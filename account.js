import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Configure with your Supabase Project URL and anon/public key.
// These are public client values; NEVER use a service_role key in browser code.
const CONFIG = window.VARETHIA_SUPABASE || { url: "", anonKey: "" };
const $ = (s) => document.querySelector(s);
const status = (message, error=false) => { const el=$("#accountStatus"); if(el){el.textContent=message;el.dataset.error=String(error)} };
let client=null, session=null, profile=null, saveTimer=null;

function configured(){return Boolean(CONFIG.url && CONFIG.anonKey)}
async function init(){
 if(!configured()){status("Online accounts need the backend connection to be configured.",true);return}
 client=createClient(CONFIG.url,CONFIG.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const {data}=await client.auth.getSession();session=data.session;
 client.auth.onAuthStateChange((_event,next)=>{session=next;queueMicrotask(()=>handleSession())});
 await handleSession();
}
async function handleSession(){
 const auth=$("#accountAuth"), signed=$("#accountSignedIn");
 if(!client)return;
 if(session){
  const {data,error}=await client.from("player_profiles").select("id,player_id,username").eq("id",session.user.id).maybeSingle();
  if(error){status("Signed in, but player profile could not load: "+error.message,true);return}
  profile=data;
  if(auth)auth.hidden=true;if(signed)signed.hidden=false;
  $("#accountPlayerName").textContent=profile?.username||session.user.email;
  $("#accountPlayerId").textContent=profile?.player_id||"Assigning player ID…";
  status("Account verified. Loading cloud save…");
  await loadCloudSave();
  await loadFriends();
 }else{profile=null;if(auth)auth.hidden=false;if(signed)signed.hidden=true;status(configured()?"Create an account or sign in to enable cloud saves.":"Backend connection not configured yet.",!configured())}
}
async function register(){
 const username=$("#accountUsername").value.trim(),email=$("#accountEmail").value.trim(),password=$("#accountPassword").value;
 if(username.length<3||username.length>20||!/^[a-zA-Z0-9_]+$/.test(username)){status("Username must be 3–20 letters, numbers or underscores.",true);return}
 if(password.length<8){status("Use a password with at least 8 characters.",true);return}
 const {data,error}=await client.auth.signUp({email,password,options:{data:{username},emailRedirectTo:location.origin+location.pathname}});
 if(error){status(error.message,true);return}
 status(data.session?"Account created. Verifying your player profile…":"Check your email to verify your account, then return here to sign in.");
}
async function login(){
 const email=$("#accountEmail").value.trim(),password=$("#accountPassword").value;
 const {error}=await client.auth.signInWithPassword({email,password});
 if(error)status(error.message,true);
}
async function resetPassword(){
 const email=$("#accountEmail").value.trim();if(!email){status("Enter your email first.",true);return}
 const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
 status(error?error.message:"Password reset link sent. Check your email.",!!error);
}
async function logout(){if(!client)return;const {error}=await client.auth.signOut();status(error?error.message:"Signed out.",!!error)}
async function loadCloudSave(){
 if(!session)return;
 const {data,error}=await client.from("player_saves").select("save_data,revision,updated_at").eq("user_id",session.user.id).maybeSingle();
 if(error){status("Cloud save could not load: "+error.message,true);return}
 if(data?.save_data && Object.keys(data.save_data).length){
  if(window.VarethiaApplyCloudData)window.VarethiaApplyCloudData(data.save_data);
  status("Cloud progress loaded. Your account is ready.");
 }else{await saveCloudNow();status("Account verified. First cloud save created.")}
}
async function saveCloudNow(){
 if(!client||!session||!window.VarethiaGetSaveData)return;
 const payload=window.VarethiaGetSaveData();
 const {error}=await client.from("player_saves").upsert({user_id:session.user.id,save_data:payload,updated_at:new Date().toISOString()},{onConflict:"user_id"});
 if(error)status("Cloud save failed: "+error.message,true);
 else status("Cloud save synced · "+new Date().toLocaleTimeString());
}
function queueSave(){if(!session)return;clearTimeout(saveTimer);saveTimer=setTimeout(saveCloudNow,900)}
async function searchPlayers(){
 const q=$("#playerSearch").value.trim();if(q.length<2){status("Enter at least 2 characters to search.",true);return}
 const {data,error}=await client.from("player_profiles").select("id,player_id,username").or("username.ilike.%"+q+"%,player_id.ilike.%"+q+"%").limit(12);
 if(error){status(error.message,true);return}
 const box=$("#playerSearchResults");box.replaceChildren();
 (data||[]).filter(p=>p.id!==session.user.id).forEach(p=>{
  const row=document.createElement("div");row.className="account-player-row";
  const label=document.createElement("span");label.textContent=p.username+" · "+p.player_id;
  const add=document.createElement("button");add.className="secondary-btn";add.textContent="ADD FRIEND";
  add.addEventListener("click",async()=>{const r=await client.from("player_friendships").insert({requester_id:session.user.id,addressee_id:p.id});status(r.error?r.error.message:"Friend request sent.");});
  const report=document.createElement("button");report.className="account-text-btn";report.textContent="REPORT";
  report.addEventListener("click",async()=>{const reason=prompt("Why are you reporting this player?");if(!reason)return;const r=await client.from("player_reports").insert({reporter_id:session.user.id,reported_player_id:p.id,reason});status(r.error?r.error.message:"Report submitted.");});
  row.append(label,add,report);box.append(row);
 });
 if(!box.children.length)box.textContent="No players found.";
}
async function loadFriends(){
 const {data,error}=await client.from("player_friendships").select("id,requester_id,addressee_id,status").or("requester_id.eq."+session.user.id+",addressee_id.eq."+session.user.id).limit(50);
 if(error){$("#friendList").textContent=error.message;return}
 const ids=[...new Set((data||[]).map(x=>x.requester_id===session.user.id?x.addressee_id:x.requester_id).filter(x=>x!==session.user.id))];
 const {data:profiles}=ids.length?await client.from("player_profiles").select("id,username,player_id").in("id",ids):{data:[]};
 const box=$("#friendList");box.replaceChildren();
 (data||[]).forEach(f=>{
  const other=f.requester_id===session.user.id?f.addressee_id:f.requester_id,p=(profiles||[]).find(x=>x.id===other);
  const row=document.createElement("div");row.className="account-player-row";
  const name=document.createElement("span");name.textContent=(p?.username||"Player")+" · "+f.status;row.append(name);if(f.status!=="blocked"){const block=document.createElement("button");block.className="account-text-btn";block.textContent="BLOCK";block.addEventListener("click",async()=>{const r=await client.from("player_friendships").update({status:"blocked"}).eq("id",f.id);status(r.error?.message||"Player blocked.");loadFriends()});row.append(block)}
  if(f.addressee_id===session.user.id&&f.status==="pending"){const accept=document.createElement("button");accept.className="secondary-btn";accept.textContent="ACCEPT";accept.addEventListener("click",async()=>{const r=await client.from("player_friendships").update({status:"accepted"}).eq("id",f.id);status(r.error?.message||"Friend request accepted.");loadFriends()});row.append(accept)}
  box.append(row);
 });
 if(!box.children.length)box.textContent="No friend requests or friends yet.";
}
async function loadLeaderboard(){
 const {data,error}=await client.from("player_leaderboard").select("username,player_id,wins,rating").order("rating",{ascending:false}).limit(20);
 const box=$("#leaderboardList");box.replaceChildren();if(error){box.textContent=error.message;return}
 (data||[]).forEach((p,i)=>{const row=document.createElement("div");row.className="account-player-row";row.textContent=(i+1)+". "+p.username+" · "+p.rating+" rating · "+p.wins+" wins";box.append(row)});
}
async function joinQueue(){
 const mode=$("#queueMode").value;
 const {data,error}=await client.rpc("join_varethia_matchmaking",{p_mode:mode});
 if(error){status(error.message,true);return}
 status(data?.status==="matched"?"Opponent found. Match ID: "+data.match_id:"You are in the "+mode+" matchmaking queue. Waiting for an opponent.");
}
async function leaveQueue(){const {error}=await client.from("matchmaking_queue").delete().eq("user_id",session.user.id);status(error?error.message:"You left the matchmaking queue.")}
window.VarethiaCloud={init,register,login,resetPassword,logout,save:saveCloudNow,queueSave,searchPlayers,loadFriends,loadLeaderboard,joinQueue,leaveQueue,get user(){return session?.user||null},get profile(){return profile},get ready(){return !!client}};
document.addEventListener("DOMContentLoaded",()=>{
 $("#accountRegister")?.addEventListener("click",()=>register().catch(e=>status(e.message,true)));
 $("#accountLogin")?.addEventListener("click",()=>login().catch(e=>status(e.message,true)));
 $("#accountReset")?.addEventListener("click",()=>resetPassword().catch(e=>status(e.message,true)));
 $("#accountLogout")?.addEventListener("click",()=>logout().catch(e=>status(e.message,true)));
 $("#accountSaveNow")?.addEventListener("click",()=>saveCloudNow());
 $("#playerSearchButton")?.addEventListener("click",()=>searchPlayers().catch(e=>status(e.message,true)));
 $("#leaderboardButton")?.addEventListener("click",()=>loadLeaderboard().catch(e=>status(e.message,true)));
 $("#queueButton")?.addEventListener("click",()=>joinQueue().catch(e=>status(e.message,true)));
 $("#leaveQueue")?.addEventListener("click",()=>leaveQueue().catch(e=>status(e.message,true)));
 window.addEventListener("varethia:progress-changed",queueSave);
 init().catch(e=>status("Account service error: "+e.message,true));
});
