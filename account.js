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
  window.dispatchEvent(new CustomEvent("varethia:cloud-loaded",{detail:data.save_data}));
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
window.VarethiaCloud={init,register,login,resetPassword,logout,save:saveCloudNow,queueSave,get user(){return session?.user||null},get profile(){return profile},get ready(){return !!client}};
document.addEventListener("DOMContentLoaded",()=>{
 $("#accountRegister")?.addEventListener("click",()=>register().catch(e=>status(e.message,true)));
 $("#accountLogin")?.addEventListener("click",()=>login().catch(e=>status(e.message,true)));
 $("#accountReset")?.addEventListener("click",()=>resetPassword().catch(e=>status(e.message,true)));
 $("#accountLogout")?.addEventListener("click",()=>logout().catch(e=>status(e.message,true)));
 $("#accountSaveNow")?.addEventListener("click",()=>saveCloudNow());
 window.addEventListener("varethia:progress-changed",queueSave);
 window.addEventListener("varethia:cloud-loaded",e=>{try{localStorage.setItem("varethia.cloudRestorePending",JSON.stringify(e.detail));location.reload()}catch{status("Cloud data loaded but could not be applied to this browser.",true)}});
 init().catch(e=>status("Account service error: "+e.message,true));
});
