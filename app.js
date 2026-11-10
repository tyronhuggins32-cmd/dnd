const $=s=>document.querySelector(s);
const emberRoot=$("#embers");
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
for(let i=0;i<(reduced?6:38);i++){const e=document.createElement("i");e.className="ember";e.style.left=Math.random()*100+"%";e.style.animationDuration=9+Math.random()*17+"s";e.style.animationDelay=-Math.random()*18+"s";e.style.opacity=.2+Math.random()*.7;emberRoot.appendChild(e)}
const modal=$("#characterModal"),form=$("#characterForm"),message=$("#formMessage"),nav=$("#mainNav");
function openCharacter(){modal.classList.add("open");modal.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";setTimeout(()=>form.elements.name.focus(),50)}
function closeCharacter(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");document.body.style.overflow="";message.textContent=""}
document.querySelectorAll("[data-open-character]").forEach(b=>b.addEventListener("click",openCharacter));
$("#closeModal").addEventListener("click",closeCharacter);
modal.addEventListener("click",e=>{if(e.target===modal)closeCharacter()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&modal.classList.contains("open"))closeCharacter()});
form.addEventListener("submit",e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form).entries());data.savedAt=new Date().toISOString();data.campaignStarted=false;try{localStorage.setItem("varethia.characterDraft",JSON.stringify(data));message.textContent="Character draft saved in this browser. The campaign remains paused."; }catch{message.textContent="Your browser could not save this draft. You can still keep these details here."}});
$("#mobileToggle").addEventListener("click",()=>{const open=nav.classList.toggle("open");$("#mobileToggle").setAttribute("aria-expanded",String(open))});
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
