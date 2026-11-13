-- Varethia online accounts and cloud saves (Supabase PostgreSQL)
-- Run this entire file in Supabase SQL Editor. Never put a service_role key in the website.

create extension if not exists pgcrypto;

create table if not exists public.player_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  player_id text not null unique default ('VAR-' || upper(substr(encode(gen_random_bytes(8),'hex'),1,10))),
  username text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
create table if not exists public.player_friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','accepted','blocked')),
  created_at timestamptz not null default now(),
  unique(requester_id,addressee_id),
  check(requester_id <> addressee_id)
);
create table if not exists public.player_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_player_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check(length(reason) between 5 and 1000),
  created_at timestamptz not null default now()
);
create table if not exists public.player_matches (
  id uuid primary key default gen_random_uuid(),
  mode text not null check(mode in ('arena','dungeon','survival')),
  player_one uuid not null references auth.users(id) on delete cascade,
  player_two uuid not null references auth.users(id) on delete cascade,
  status text not null default 'matched' check(status in ('matched','completed','cancelled')),
  created_at timestamptz not null default now(),
  check(player_one <> player_two)
);
create table if not exists public.matchmaking_queue (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mode text not null check(mode in ('arena','dungeon','survival')),
  rating integer not null default 1000,
  queued_at timestamptz not null default now()
);

create index if not exists player_profiles_username_search on public.player_profiles using btree(lower(username));
create index if not exists player_friendships_addressee on public.player_friendships(addressee_id,status);
create index if not exists matchmaking_queue_mode_time on public.matchmaking_queue(mode,queued_at);

create or replace function public.handle_new_player()
returns trigger language plpgsql security definer set search_path=public
as $$
declare requested_name text;
begin
 requested_name := coalesce(nullif(trim(new.raw_user_meta_data->>'username'),''), 'Player-' || substr(new.id::text,1,8));
 insert into public.player_profiles(id,username) values(new.id,requested_name)
 on conflict(id) do nothing;
 insert into public.player_saves(user_id,save_data) values(new.id,'{}'::jsonb)
 on conflict(user_id) do nothing;
 return new;
end; $$;

drop trigger if exists on_auth_user_created_varethia on auth.users;
create trigger on_auth_user_created_varethia after insert on auth.users
for each row execute procedure public.handle_new_player();

alter table public.player_profiles enable row level security;
alter table public.player_saves enable row level security;
alter table public.player_friendships enable row level security;
alter table public.player_reports enable row level security;
alter table public.matchmaking_queue enable row level security;\nalter table public.player_matches enable row level security;

drop policy if exists "Profiles are publicly searchable" on public.player_profiles;
create policy "Profiles are publicly searchable" on public.player_profiles for select to authenticated using(true);
drop policy if exists "Players update own profile" on public.player_profiles;
create policy "Players update own profile" on public.player_profiles for update to authenticated using(auth.uid()=id) with check(auth.uid()=id);
drop policy if exists "Players read own save" on public.player_saves;
create policy "Players read own save" on public.player_saves for select to authenticated using(auth.uid()=user_id);
drop policy if exists "Players write own save" on public.player_saves;
create policy "Players write own save" on public.player_saves for insert to authenticated with check(auth.uid()=user_id);
drop policy if exists "Players update own save" on public.player_saves;
create policy "Players update own save" on public.player_saves for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "Friendship participants can view" on public.player_friendships;
create policy "Friendship participants can view" on public.player_friendships for select to authenticated using(auth.uid() in (requester_id,addressee_id));
drop policy if exists "Players send friend requests" on public.player_friendships;
create policy "Players send friend requests" on public.player_friendships for insert to authenticated with check(auth.uid()=requester_id and status='pending');
drop policy if exists "Recipients accept or block requests" on public.player_friendships;
create policy "Recipients accept or block requests" on public.player_friendships for update to authenticated using(auth.uid()=addressee_id) with check(auth.uid()=addressee_id and status in ('accepted','blocked'));
drop policy if exists "Players report others" on public.player_reports;
create policy "Players report others" on public.player_reports for insert to authenticated with check(auth.uid()=reporter_id and reporter_id<>reported_player_id);
drop policy if exists "Players manage own matchmaking entry" on public.matchmaking_queue;
create policy "Players manage own matchmaking entry" on public.matchmaking_queue for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "Match participants can view" on public.player_matches;
create policy "Match participants can view" on public.player_matches for select to authenticated using(auth.uid() in (player_one,player_two));
drop policy if exists "Either friend can update relationship" on public.player_friendships;
create policy "Either friend can update relationship" on public.player_friendships for update to authenticated using(auth.uid() in (requester_id,addressee_id)) with check(auth.uid() in (requester_id,addressee_id) and status in ('accepted','blocked'));

create or replace function public.join_varethia_matchmaking(p_mode text)
returns jsonb language plpgsql security definer set search_path=public
as $
declare me uuid := auth.uid(); opponent uuid; match_id uuid;
begin
 if me is null then raise exception 'Authentication required'; end if;
 if p_mode not in ('arena','dungeon','survival') then raise exception 'Invalid mode'; end if;
 select user_id into opponent from public.matchmaking_queue
  where mode=p_mode and user_id<>me order by queued_at
  for update skip locked limit 1;
 if opponent is not null then
  delete from public.matchmaking_queue where user_id in (me,opponent);
  insert into public.player_matches(mode,player_one,player_two) values(p_mode,opponent,me) returning id into match_id;
  return jsonb_build_object('status','matched','match_id',match_id,'mode',p_mode);
 end if;
 insert into public.matchmaking_queue(user_id,mode,rating,queued_at) values(me,p_mode,1000,now())
 on conflict(user_id) do update set mode=excluded.mode,queued_at=excluded.queued_at;
 return jsonb_build_object('status','queued','mode',p_mode);
end; $;
revoke all on function public.join_varethia_matchmaking(text) from public;
grant execute on function public.join_varethia_matchmaking(text) to authenticated;

create or replace view public.player_leaderboard
with (security_invoker=true) as
select p.id,p.player_id,p.username,
coalesce((s.save_data->>'wins')::integer,0) as wins,
coalesce((s.save_data->>'rating')::integer,1000) as rating
from public.player_profiles p
left join public.player_saves s on s.user_id=p.id;

grant select on public.player_leaderboard to authenticated;
