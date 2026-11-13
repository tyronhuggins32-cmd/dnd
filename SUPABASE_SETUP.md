# Varethia online accounts setup

The browser game is hosted on GitHub Pages. Authentication and cloud data use Supabase so passwords are handled by the auth provider and each player's save is protected by PostgreSQL row-level security.

## 1. Create the backend
1. Create a Supabase project at https://supabase.com/dashboard.
2. Open **SQL Editor** and run the complete contents of `supabase/schema.sql`.
3. In **Project Settings → API**, copy the Project URL and the **anon / publishable** client key.
4. Put those two public values into `account-config.js`:
   - `url`: your Supabase project URL
   - `anonKey`: your anon/publishable key
5. In Supabase **Authentication → URL Configuration**, add the deployed GitHub Pages URL to the allowed redirect URLs:
   `https://tyronhuggins32-cmd.github.io/dnd/`
6. Configure email delivery and verification in Supabase Authentication. Test signup and password reset using an email you control.

## Security notes
- Never put a Supabase `service_role` key, database password, or other secret in this repository or browser code.
- The anon/publishable key is intended for browser use; row-level security policies in the SQL schema protect player data.
- The player save table allows a signed-in player to read and write only their own row.
- Email verification, password reset and session refresh are handled by Supabase Auth.
- Searchable public player profile fields are username and player ID only. Passwords and emails are not exposed in the player search UI.
- Reports are write-only for the reporting player; review and moderation require a trusted server/admin workflow.

## Current online features
- Email/password signup and sign-in, email verification, password reset, sign-out.
- Unique player ID and username profile.
- Cloud save/load for character draft, coins, owned cards, team, favorites, settings and win count.
- Player search, friend requests/acceptance/blocking, player reports, leaderboard query and matchmaking queue pairing.

## Important implementation boundary
The matchmaking queue can pair two accounts and create a protected match record. The existing battle engine is still local prototype gameplay; synchronized real-time combat, authoritative server validation, and moderation/admin tooling are separate backend work and are not claimed as complete.
