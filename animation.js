import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SkeletonUtils } from "three/addons/utils/SkeletonUtils.js";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const loader = new GLTFLoader();
const modelCache = new Map();
let manifest = { models: {}, characters: {} };
fetch("./assets/characters/manifest.json").then(r=>r.ok?r.json():manifest).then(x=>manifest=x||manifest).catch(()=>{});
const views = new Map();
const pending = new Map();
const pendingStates = new Map();
const observer = new IntersectionObserver(entries=>entries.forEach(e=>{
 const host=e.target,view=views.get(host);
 if(e.isIntersecting&&!view){const options=pending.get(host);if(options){pending.delete(host);host.dataset.threeMounted="loading";createView(host,options)}}
 else if(e.isIntersecting&&view)view.start();
 else if(!e.isIntersecting&&view){const options=view.options||{};view.dispose();views.delete(host);host.querySelector(".three-character-canvas")?.remove();host.dataset.threeMounted="pending";pending.set(host,options)}
}),{rootMargin:"80px"});
const palette={Fire:0xb94d32,Water:0x4a8fb4,Earth:0x8d7654,Wind:0xb7c9c7,Ice:0x8bd6e8,Lightning:0xe3c75b,Nature:0x63945b,Shadow:0x6d5a91,Light:0xe5d5a0,Blood:0x9c3042,Metal:0x9aa3ad,Void:0x76519d};
const material=(color,metalness=.2,roughness=.5,emissive=0)=>new THREE.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:.5});
function part(parent,geometry,mat,name,pos,scale=[1,1,1]){const m=new THREE.Mesh(geometry,mat);m.name=name;m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m}
function capsule(parent,name,r,len,mat,pos){return part(parent,new THREE.CapsuleGeometry(r,len,4,8),mat,name,pos)}
function humanoid(species,element){
 const root=new THREE.Group();root.name="VarethiaSharedHumanoidRig";
 const armor=material(0x393239,.72,.32),cloth=material(0x655047,.1,.85),skin=material(species==="Undead"?0x77716b:species==="Orc"?0x63805a:0xc29b7e),gold=material(0xb28b52,.8,.25),accent=material(palette[element]||0x98745b,.3,.4,palette[element]||0),dark=material(0x17151b),eyes=new THREE.MeshStandardMaterial({color:0xffd68a,emissive:0xff9c2e,emissiveIntensity:1.8});
 const torso=new THREE.Group();torso.name="torso";torso.position.y=1.4;root.add(torso);
 capsule(torso,"chest",.29,.42,armor,[0,0,0]).scale.set(1.15,1,.72);
 part(torso,new THREE.BoxGeometry(.24,.5,.06),cloth,"tabard",[0,-.25,.22]);
 const head=new THREE.Group();head.name="head";head.position.set(0,.52,0);torso.add(head);
 part(head,new THREE.SphereGeometry(.22,16,12),skin,"face",[0,0,0],[.9,1.1,.85]);
 part(head,new THREE.SphereGeometry(.04,12,8),eyes,"leftEye",[-.085,.025,.185],[1,.7,.55]);part(head,new THREE.SphereGeometry(.04,12,8),eyes,"rightEye",[.085,.025,.185],[1,.7,.55]);
 part(head,new THREE.SphereGeometry(.235,16,12),gold,"helm",[0,.14,-.015],[1.08,.58,.96]);
 const armL=new THREE.Group();armL.name="armL";armL.position.set(-.38,.2,0);torso.add(armL);capsule(armL,"upperArmL",.1,.3,armor,[0,-.16,0]);capsule(armL,"foreArmL",.085,.26,cloth,[0,-.49,0]);
 const armR=new THREE.Group();armR.name="armR";armR.position.set(.38,.2,0);torso.add(armR);capsule(armR,"upperArmR",.1,.3,armor,[0,-.16,0]);capsule(armR,"foreArmR",.085,.26,cloth,[0,-.49,0]);
 const weapon=new THREE.Group();weapon.name="weapon";weapon.position.set(.02,-.62,.02);armR.add(weapon);
 part(weapon,new THREE.BoxGeometry(.055,.72,.035),gold,"blade",[0,.36,0]);part(weapon,new THREE.BoxGeometry(.18,.055,.08),gold,"guard",[0,.02,0]);part(weapon,new THREE.BoxGeometry(.045,.2,.045),dark,"grip",[0,-.1,0]);part(weapon,new THREE.BoxGeometry(.018,.65,.012),accent,"rune",[.037,.36,.02]);
 const legL=new THREE.Group();legL.name="legL";legL.position.set(-.16,1.1,0);root.add(legL);capsule(legL,"thighL",.12,.34,cloth,[0,-.2,0]);capsule(legL,"shinL",.1,.32,armor,[0,-.53,.02]);
 const legR=new THREE.Group();legR.name="legR";legR.position.set(.16,1.1,0);root.add(legR);capsule(legR,"thighR",.12,.34,cloth,[0,-.2,0]);capsule(legR,"shinR",.1,.32,armor,[0,-.53,.02]);
 const wings=[];
 if(["Angel","Demon"].includes(species))for(const side of [-1,1]){const w=new THREE.Group();w.name="wing"+side;w.position.set(side*.28,1.55,-.1);root.add(w);part(w,new THREE.BoxGeometry(.62,.06,.32),species==="Angel"?gold:accent,"wing",[side*.28,0,0]);wings.push(w)}
 root.userData.rig={torso,head,armL,armR,legL,legR,weapon,wings};return root;
}
function beast(species,element){
 const root=new THREE.Group();root.name="VarethiaCreatureRig";const hide=material(0x51433d),accent=material(palette[element]||0x98745b,.3,.4,palette[element]||0),eyes=new THREE.MeshStandardMaterial({color:0xffd68a,emissive:0xff9c2e,emissiveIntensity:1.8});
 part(root,new THREE.SphereGeometry(.46,18,14),hide,"body",[0,.72,0],[1.5,.72,.8]);
 const head=new THREE.Group();head.name="head";head.position.set(0,1.02,.48);root.add(head);part(head,new THREE.SphereGeometry(.3,16,12),hide,"skull",[0,0,0],[1.15,.85,1]);part(head,new THREE.SphereGeometry(.05,12,8),eyes,"eyeL",[-.17,.05,.24]);part(head,new THREE.SphereGeometry(.05,12,8),eyes,"eyeR",[.17,.05,.24]);
 const legs=[];for(const x of [-.32,.32])for(const z of [-.3,.35]){const l=new THREE.Group();l.position.set(x,.62,z);root.add(l);capsule(l,"limb",.11,.42,hide,[0,-.25,0]);legs.push(l)}
 const tail=new THREE.Group();tail.name="tail";tail.position.set(0,.82,-.55);root.add(tail);capsule(tail,"tailSegment",.12,.7,accent,[0,0,-.34]).rotation.x=Math.PI/2;
 return Object.assign(root,{userData:{rig:{head,legs,tail}}});
}
async function getAsset(species,element,characterId){
 const customUrl=manifest.characters?.[String(characterId)]||manifest.models?.[species]||manifest.characters?.[species];
 const key=customUrl||species+"|"+element;
 if(!modelCache.has(key))modelCache.set(key,(async()=>{
  const url=customUrl;
  if(url)try{const g=await loader.loadAsync(url);return {scene:g.scene,clips:g.animations||[],external:true}}catch(e){console.warn("GLB load failed; procedural rig used",url,e)}
  return {scene:null,clips:[],external:false};
 })());
 return modelCache.get(key);
}
async function createView(host,options={}){
 const species=host.dataset.rig||options.species||"Human",element=host.dataset.element||options.element||"Fire";
 const canvas=document.createElement("canvas");canvas.className="three-character-canvas";canvas.setAttribute("aria-label","Animated 3D "+species+" character");host.appendChild(canvas);
 try{
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(Math.max(48,host.clientWidth||88),Math.max(48,host.clientHeight||88),false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xe9d8c2,0x221820,2));const key=new THREE.DirectionalLight(0xffe0bb,2.2);key.position.set(2,4,4);scene.add(key);const rim=new THREE.PointLight(palette[element]||0xb58b58,2,8);rim.position.set(-2,1.5,-1);scene.add(rim);
  const camera=new THREE.PerspectiveCamera(31,1,.1,30);camera.position.set(0,1.45,5.2);camera.lookAt(0,1,0);
  const asset=await getAsset(species,element,host.dataset.characterModel),root=asset.external?SkeletonUtils.clone(asset.scene):(["Dragon","Monster","Legendary Creature","Beastkin"].includes(species)?beast(species,element):humanoid(species,element));root.scale.setScalar((options.scale||.9)*(species==="Giant"?1.25:1));scene.add(root);
  const mixer=asset.clips.length?new THREE.AnimationMixer(root):null,actions={};if(mixer)asset.clips.forEach(c=>actions[c.name.toLowerCase()]=mixer.clipAction(c));
  const rig=root.userData.rig||null,particles=[];for(let i=0;i<10;i++){const p=part(scene,new THREE.SphereGeometry(.018,6,4),new THREE.MeshBasicMaterial({color:palette[element]||0xc5a06a,transparent:true,opacity:.6}),"ambientParticle",[Math.random()*2-1,Math.random()*2.4,Math.random()*1.2-0.6]);particles.push(p)}
  const clock=new THREE.Clock();let raf=0,active=false,state="idle",stateAt=0,selected=false,hovered=false;
  const resize=()=>{const w=Math.max(48,host.clientWidth||88),h=Math.max(48,host.clientHeight||88);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};
  const clipFor={idle:["idle","breathing"],walk:["walk","walking"],run:["run","running"],attack:["attack","melee","cast"],block:["block","blocking"],dodge:["dodge","roll"],hit:["hit","hurt","stagger"],death:["death","die"]};
  const setState=s=>{state=s;stateAt=performance.now();if(mixer){const action=(clipFor[s]||[s]).map(n=>actions[n]).find(Boolean);if(action){Object.values(actions).forEach(a=>a.fadeOut(.1));action.reset().fadeIn(.1).play()}}};
  function frame(){if(!active)return;raf=requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;if(mixer)mixer.update(dt);
   if(rig&&!mixer){
    if(state==="idle"){root.position.y=Math.sin(t*2)*.025;if(rig.torso)rig.torso.rotation.z=Math.sin(t*1.2)*.018;if(rig.head)rig.head.rotation.y=Math.sin(t*.7)*.07;if(rig.weapon)rig.weapon.rotation.z=Math.sin(t*1.6)*.035}
    if(state==="walk"||state==="run"){const sp=state==="run"?10:6;root.position.y=Math.abs(Math.sin(t*sp))*.07;if(rig.legL)rig.legL.rotation.x=Math.sin(t*sp)*.6;if(rig.legR)rig.legR.rotation.x=-Math.sin(t*sp)*.6;if(rig.armL)rig.armL.rotation.x=-Math.sin(t*sp)*.3;if(rig.armR)rig.armR.rotation.x=Math.sin(t*sp)*.3}
    if(state==="attack"){const p=Math.min(1,(performance.now()-stateAt)/520);if(rig.armR)rig.armR.rotation.x=-Math.sin(p*Math.PI)*1.9;if(rig.torso)rig.torso.rotation.y=Math.sin(p*Math.PI)*.55;if(rig.weapon)rig.weapon.rotation.z=-Math.sin(p*Math.PI)*.65;if(p>=1)setState("idle")}
    if(state==="deploy"){const p=Math.min(1,(performance.now()-stateAt)/620);root.position.y=Math.sin(p*Math.PI)*.72;if(p>=1){root.position.y=0;setState("idle")}}
    if(state==="block"){if(rig.armL)rig.armL.rotation.x=-1.1;if(rig.armR)rig.armR.rotation.x=-1.1}
    if(state==="dodge"){const p=Math.min(1,(performance.now()-stateAt)/420);root.position.x=Math.sin(p*Math.PI)*.45;root.rotation.z=Math.sin(p*Math.PI)*.4;if(p>=1){root.position.x=0;root.rotation.z=0;setState("idle")}}
    if(state==="hit"&&performance.now()-stateAt>420)setState("idle");
    if(state==="death"){root.rotation.z=THREE.MathUtils.damp(root.rotation.z,1.42,4,dt);root.position.y=THREE.MathUtils.damp(root.position.y,-.62,4,dt)}
    if(rig.wings)rig.wings.forEach((w,i)=>w.rotation.z=Math.sin(t*2+i)*.08);
   }
   root.rotation.y=options.turn?Math.sin(t*.35)*.22:(hovered?-.14:0);root.scale.setScalar((options.scale||.9)*(selected?1.07:hovered?1.035:1));
   particles.forEach((p,i)=>{p.position.y+=dt*(.06+(i%3)*.02);if(p.position.y>2.5)p.position.y=0});
   if(Math.floor(t*2)%8===0)resize();renderer.render(scene,camera);
  }
  const view={options,start(){if(active)return;active=true;clock.start();frame()},stop(){active=false;cancelAnimationFrame(raf)},dispose(){active=false;cancelAnimationFrame(raf);renderer.dispose();scene.traverse(o=>{o.geometry?.dispose?.();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.())}})},setState,select(v){selected=v},hover(v){hovered=v}};
  views.set(host,view);host._varethiaView=view;if(options.state)setState(options.state);const pendingState=pendingStates.get(String(host.dataset.characterModel||""));if(pendingState){setState(pendingState);pendingStates.delete(String(host.dataset.characterModel||""))}if(host.getClientRects().length)view.start();
 }catch(err){host.dataset.threeMounted="failed";canvas.remove();console.warn("Three.js view unavailable; keeping original 2D art",err)}
}
function mount(host,options={}){if(!host||host.dataset.threeMounted)return;host.dataset.threeMounted="pending";pending.set(host,options);observer.observe(host)}
function scan(root=document){root.querySelectorAll?.("[data-character-model]").forEach(host=>mount(host,{turn:host.classList.contains("card-avatar"),scale:host.classList.contains("unit-icon") ? .58 : .9}))}
const mutation=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)})));mutation.observe(document.body,{childList:true,subtree:true});scan();
document.addEventListener("pointerover",e=>{const card=e.target.closest?.("[data-card]");card?.querySelector("[data-character-model]")?._varethiaView?.hover(true)});
document.addEventListener("pointerout",e=>{const card=e.target.closest?.("[data-card]");card?.querySelector("[data-character-model]")?._varethiaView?.hover(false)});
document.addEventListener("click",e=>{const card=e.target.closest?.("[data-card]");if(card){document.querySelectorAll(".card-avatar").forEach(x=>x._varethiaView?.select(false));card.querySelector(".card-avatar")?._varethiaView?.select(true)}const hand=e.target.closest?.(".hand-card");if(hand){document.querySelectorAll(".hand-card [data-character-model]").forEach(x=>x._varethiaView?.select(false));hand.querySelector("[data-character-model]")?._varethiaView?.select(true)}});
function impact(detail){const box=document.querySelector(".battlefield-frame");if(!box)return;const fx=document.createElement("span");fx.className="battle-impact-fx "+(detail.element||"")+(detail.type==="ultimate"?" ultimate":"");fx.textContent=detail.type==="ultimate"?"✹":detail.element==="Fire"?"✹":detail.element==="Ice"?"❄":detail.element==="Lightning"?"ϟ":"✦";box.appendChild(fx);if(detail.attackType==="ranged"){const from=findLiveModel(detail.attackerId),to=findLiveModel(detail.targetId);if(from&&to){const a=from.getBoundingClientRect(),b=to.getBoundingClientRect(),r=box.getBoundingClientRect(),x=a.left+a.width/2-r.left,y=a.top+a.height/2-r.top,dx=b.left+b.width/2-a.left-a.width/2,dy=b.top+b.height/2-a.top-a.height/2,line=document.createElement("i");line.className="battle-projectile";line.style.left=x+"px";line.style.top=y+"px";line.style.width=Math.hypot(dx,dy)+"px";line.style.transform="rotate("+Math.atan2(dy,dx)+"rad)";box.appendChild(line);setTimeout(()=>line.remove(),420)}}box.classList.remove("impact-shake");void box.offsetWidth;box.classList.add("impact-shake");setTimeout(()=>{fx.remove();box.classList.remove("impact-shake")},700)}
let audioContext=null;
function playSound(kind){try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;if(!audioContext)audioContext=new Ctx();if(audioContext.state==="suspended")audioContext.resume();const now=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();const config={swing:[190,105,.12,"sawtooth"],impact:[95,42,.18,"triangle"],death:[75,28,.42,"sine"],ultimate:[420,70,.55,"sawtooth"]}[kind]||[160,80,.1,"sine"];osc.type=config[3];osc.frequency.setValueAtTime(config[0],now);osc.frequency.exponentialRampToValueAtTime(Math.max(20,config[1]),now+config[2]);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(kind==="ultimate"?.075:.035,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+config[2]);osc.connect(gain);gain.connect(audioContext.destination);osc.start(now);osc.stop(now+config[2]+.02)}catch(e){console.warn("Varethia sound effect unavailable",e)}}
function findLiveModel(id){return [...document.querySelectorAll('[data-character-model="'+CSS.escape(String(id||""))+'"]')].find(n=>n.closest(".lane-unit")&&n.getClientRects().length)||[...document.querySelectorAll('[data-character-model="'+CSS.escape(String(id||""))+'"]')].find(n=>n.getClientRects().length)}
function setModelState(id,state){if(id===undefined||id===null)return;const key=String(id),host=findLiveModel(key);if(host?._varethiaView)host._varethiaView.setState(state);else pendingStates.set(key,state)}
window.addEventListener("varethia:combat",e=>{const d=e.detail||{};if(d.targetId!==undefined)setModelState(d.targetId,d.type==="death"?"death":d.type==="block"?"block":d.type==="dodge"?"dodge":"hit");if(d.attackerId!==undefined&&d.type==="attack")setModelState(d.attackerId,"attack");if(d.type==="deploy"){setModelState(d.targetId,"deploy");setTimeout(()=>setModelState(d.targetId,"idle"),650)}if(d.type==="ultimate"||d.type==="impact"||d.type==="attack"||d.type==="deploy")impact(d);playSound(d.type==="death"?"death":d.type==="attack"?"swing":d.type==="ultimate"?"ultimate":"impact")});
window.VarethiaAnimation={mount,scan,play(id,state){document.querySelector('[data-character-model="'+CSS.escape(String(id))+'"]')?._varethiaView?.setState(state)},playSound,getStatus(){return {engine:"Three.js",cachedModels:modelCache.size,activeViews:views.size,manifest:"assets/characters/manifest.json"}}};
