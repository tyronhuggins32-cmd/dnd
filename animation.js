import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SkeletonUtils } from "three/addons/utils/SkeletonUtils.js";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const loader = new GLTFLoader();
const modelCache = new Map();
let manifest = { models: {}, characters: {} };
const manifestReady=fetch("./assets/characters/manifest.json").then(r=>r.ok?r.json():manifest).then(x=>(manifest=x||manifest)).catch(()=>manifest);
const views = new Map();
const pending = new Map();
const pendingStates = new Map();
const observer = new IntersectionObserver(entries=>entries.forEach(e=>{
 const host=e.target,view=views.get(host);
 if(e.isIntersecting){host.dataset.threeVisible="true";if(!view){const options=pending.get(host);if(options){pending.delete(host);host.dataset.threeMounted="loading";createView(host,options)}}else view.start()}
 else{host.dataset.threeVisible="false";if(view){const options=view.options||{};view.dispose();views.delete(host);delete host._varethiaView;host.querySelector(".three-character-canvas")?.remove();host.dataset.threeMounted="pending";pending.set(host,options)}}
}),{rootMargin:"240px"});
const palette={Fire:0xb94d32,Water:0x4a8fb4,Earth:0x8d7654,Wind:0xb7c9c7,Ice:0x8bd6e8,Lightning:0xe3c75b,Nature:0x63945b,Shadow:0x6d5a91,Light:0xe5d5a0,Blood:0x9c3042,Metal:0x9aa3ad,Void:0x76519d};
const material=(color,metalness=.2,roughness=.5,emissive=0)=>new THREE.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:.5});

/* Cinematic 3D arena: persistent terrain, lane inlays, pillars, crystals and fog. */
function mountArenaScene(){
 const frame=document.querySelector("#battlefieldFrame"),canvas=document.querySelector("#arenaSceneCanvas");
 if(!frame||!canvas||canvas.dataset.ready)return;
 canvas.dataset.ready="true";
 let renderer,scene,camera,raf=0;const clock=new THREE.Clock(),runes=[],embers=[];
 try{
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x101b19,.055);
  camera=new THREE.PerspectiveCamera(38,1,.1,80);camera.position.set(0,11,17);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xc7d9d2,0x17131b,1.8));
  const key=new THREE.DirectionalLight(0xffd9a2,2.4);key.position.set(-5,10,7);key.castShadow=true;scene.add(key);
  const fill=new THREE.PointLight(0x5eaf9d,3,26);fill.position.set(0,4,0);scene.add(fill);
  const floorMat=new THREE.MeshStandardMaterial({color:0x35433a,roughness:.92});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(22,18,1,1),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-.28;floor.receiveShadow=true;scene.add(floor);
  const stoneMat=new THREE.MeshStandardMaterial({color:0x5d594e,roughness:.9}),darkMat=new THREE.MeshStandardMaterial({color:0x242b28,roughness:.95});
  const crystalMat=new THREE.MeshStandardMaterial({color:0x63d7ca,emissive:0x187d76,emissiveIntensity:1.4,metalness:.25,roughness:.22});
  const goldMat=new THREE.MeshStandardMaterial({color:0xc3a36e,emissive:0x8a5924,emissiveIntensity:.55,metalness:.65,roughness:.32});
  const add=(geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m};
  add(new THREE.BoxGeometry(18,.42,14),darkMat,0,-.5,0,1,1,1);
  // Five raised stone lanes with luminous engraved borders and central rune seams.
  for(let i=0;i<5;i++){
   const x=(i-2)*3.35;
   add(new THREE.BoxGeometry(3.12,.18,12.8),stoneMat,x,-.16,0);
   const glow=new THREE.MeshBasicMaterial({color:[0x8bc7a0,0xd27c61,0x9ec8f0,0x74d8ec,0xb895e8][i],transparent:true,opacity:.68});
   for(const side of [-1,1])add(new THREE.BoxGeometry(.035,.035,12.2),glow,x+side*1.48,-.055,0);
   for(let z=-5.2;z<=5.2;z+=2.6){const rune=add(new THREE.TorusGeometry(.25,.018,5,24),glow,x,-.045,z);rune.rotation.x=Math.PI/2;runes.push(rune)}
   for(let z of [-6.1,6.1])add(new THREE.BoxGeometry(3.18,.3,.28),goldMat,x,-.02,z);
  }
  // Broken colonnades and huge ruined arches framing the field.
  for(const side of [-1,1])for(let i=0;i<4;i++){
   const x=side*(9.0+(i%2)*.25),z=-5.4+i*3.6;
   add(new THREE.CylinderGeometry(.42,.58,4.8,8),stoneMat,x,2.1,z);
   add(new THREE.CylinderGeometry(.68,.68,.38,8),goldMat,x,4.55,z);
   add(new THREE.BoxGeometry(1.2,.65,1.1),stoneMat,x,4.95,z);
  }
  // Crystal clusters on the arena corners and side galleries.
  for(const [x,z] of [[-8,-6],[-8,6],[8,-6],[8,6],[-7,0],[7,0]]){
   add(new THREE.DodecahedronGeometry(.78,0),crystalMat,x,.55,z,.62,1.8,.62).rotation.z=.12;
   add(new THREE.DodecahedronGeometry(.42,0),crystalMat,x+.48,.38,z+.2,.5,1.3,.5);
  }
  // Broken masonry, grass tufts and ground debris.
  for(let i=0;i<38;i++){const x=(Math.random()-.5)*19,z=(Math.random()-.5)*14; if(Math.abs(x)<7.9)continue;const rock=add(new THREE.DodecahedronGeometry(.18+Math.random()*.32,0),i%3?stoneMat:darkMat,x,-.02,z,1.2,.55,.8);rock.rotation.set(Math.random(),Math.random(),Math.random())}
  const grassMat=new THREE.MeshStandardMaterial({color:0x4f8050,roughness:1});
  for(let i=0;i<65;i++){const x=(Math.random()-.5)*19,z=(Math.random()-.5)*14;if(Math.abs(x)<8)continue;const blade=add(new THREE.ConeGeometry(.045,.42,4),grassMat,x,.08,z);blade.rotation.z=(Math.random()-.5)*.8}
  const particleGeo=new THREE.BufferGeometry(),positions=new Float32Array(180*3);
  for(let i=0;i<180;i++){positions[i*3]=(Math.random()-.5)*20;positions[i*3+1]=Math.random()*5;positions[i*3+2]=(Math.random()-.5)*16}
  particleGeo.setAttribute("position",new THREE.BufferAttribute(positions,3));
  const dust=new THREE.Points(particleGeo,new THREE.PointsMaterial({color:0xd9c49c,size:.055,transparent:true,opacity:.48,depthWrite:false}));scene.add(dust);embers.push(dust);
  const resize=()=>{const w=Math.max(1,frame.clientWidth),h=Math.max(1,frame.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};const ro=new ResizeObserver(resize);ro.observe(frame);resize();
  let cinematicUntil=0;
  window.addEventListener("varethia:combat",e=>{const d=e.detail||{};if(["ultimate","element-combo","evolution"].includes(d.type)){cinematicUntil=performance.now()+1250;const pulse=new THREE.PointLight(0xffc77c,8,18);pulse.position.set(0,3,0);scene.add(pulse);setTimeout(()=>scene.remove(pulse),650)}});
  const applyMood=()=>{const env=frame.dataset.environment||"verdant-wilds",moods={"verdant-wilds":[0x101b19,0x5eaf9d,0x4d8053],"ashen-wastes":[0x211312,0xff7648,0x9a4832],"frostfall-reach":[0x101a29,0x72c9f4,0x4c6d9d],"emberfall-caldera":[0x24100d,0xff6a31,0x9d3822]};const v=moods[env]||moods["verdant-wilds"];scene.fog.color.setHex(v[0]);fill.color.setHex(v[1]);floorMat.color.setHex(v[2]);crystalMat.emissive.setHex(v[1]);};
  let lastEnv="";function frameLoop(){raf=requestAnimationFrame(frameLoop);const t=clock.getElapsedTime(),now=performance.now();if(lastEnv!==frame.dataset.environment){lastEnv=frame.dataset.environment;applyMood()}runes.forEach((r,i)=>{r.rotation.z=t*.18+(i%4)*.5;r.material.opacity=.35+Math.sin(t*2+i)*.22});dust.rotation.y=t*.012;const cinematic=now<cinematicUntil;const targetZ=cinematic?14.2:17,targetY=cinematic?8.8:11;camera.position.z=THREE.MathUtils.damp(camera.position.z,targetZ,cinematic?4:2,.016);camera.position.y=THREE.MathUtils.damp(camera.position.y,targetY,cinematic?4:2,.016);camera.position.x=THREE.MathUtils.damp(camera.position.x,cinematic?Math.sin(t*7)*.38:0,3,.016);camera.lookAt(0,0,0);renderer.render(scene,camera)}
  frameLoop();window.addEventListener("beforeunload",()=>{cancelAnimationFrame(raf);ro.disconnect();renderer.dispose()},{once:true});
 }catch(e){canvas.remove();console.warn("3D arena renderer unavailable; CSS battlefield remains active",e)}
}

function part(parent,geometry,mat,name,pos,scale=[1,1,1]){const m=new THREE.Mesh(geometry,mat);m.name=name;m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m}
function capsule(parent,name,r,len,mat,pos){return part(parent,new THREE.CapsuleGeometry(r,len,4,8),mat,name,pos)}
function seededStyle(id){
 let n=2166136261;for(const ch of String(id??"0")){n^=ch.charCodeAt(0);n=Math.imul(n,16777619)}
 const rand=()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296};
 const paletteColors=[0x6f3c52,0x365d70,0x6d653b,0x513c76,0x3d6a50,0x873f35,0x53606c,0x7a5637,0x3c526e,0x744d67,0x4b6449,0x6b4b31];
 return {rand,armor:paletteColors[Math.floor(rand()*paletteColors.length)],cloth:paletteColors[Math.floor(rand()*paletteColors.length)],trim:[0xc89b50,0xb9c6d4,0x9c6aaf,0x6fa6a0,0xc77b56][Math.floor(rand()*5)],skin:[0xe8bd9b,0xc78f72,0x98735f,0xaaa19b,0xe0c9ad,0x78a45d][Math.floor(rand()*6)],iris:[0x3e9b9c,0x9e443c,0x8563c4,0xd4a32c,0x4eaa68,0xd9d9e5][Math.floor(rand()*6)],ornament:Math.floor(rand()*5),horns:rand()>.48,crest:rand()>.35,shoulders:rand()>.45,weapon:Math.floor(rand()*4),cape:rand()>.25};
}
function humanoid(species,element,characterId){
 const style=seededStyle(characterId),root=new THREE.Group();root.name="VarethiaStylizedHeroRig";
 const toon=(color,emissive=0)=>new THREE.MeshToonMaterial({color,emissive,emissiveIntensity:emissive?0.45:0});
 const armor=toon(style.armor),cloth=toon(style.cloth),skin=toon(species==="Undead"?0xaaa19b:species==="Orc"?0x78a45d:species==="Elf"?0xe4bd9b:style.skin),gold=toon(style.trim),accent=toon(palette[element]||0x98745b,palette[element]||0),dark=toon(0x211d2a),eyeWhite=toon(0xfff0d9),iris=toon(style.iris),pupil=toon(0x211c27);
 const torso=new THREE.Group();torso.name="torso";torso.position.y=1.02;root.add(torso);
 part(torso,new THREE.SphereGeometry(.34,20,16),armor,"chest",[0,0,0],[1.08,1.22,.78]);
 part(torso,new THREE.SphereGeometry(.255,18,14),cloth,"tunic",[0,-.16,.075],[1.04,1.12,.78]);
 part(torso,new THREE.BoxGeometry(.28,.42,.045),gold,"chest-crest",[0,.02,.285]);
 part(torso,new THREE.SphereGeometry(.12,14,10),accent,"element-gem",[0,.19,.31]);
 part(torso,new THREE.TorusGeometry(.27,.045,8,18),gold,"belt",[0,-.31,.015],[1,1,.7]);
 const cape=new THREE.Group();cape.name="cape";cape.position.set(0,.22,-.2);torso.add(cape);
 if(style.cape)part(cape,new THREE.ConeGeometry(.36,.78,5),cloth,"hero-cape",[0,-.43,-.02],[1,.9,.22]).rotation.x=-Math.PI;
 const head=new THREE.Group();head.name="head";head.position.set(0,.48,.02);torso.add(head);
 part(head,new THREE.SphereGeometry(.32,24,20),skin,"face",[0,0,.035],[1.02,1.08,.88]);
 part(head,new THREE.SphereGeometry(.12,14,10),skin,"earL",[-.31,-.015,0],[.55,.8,.45]);part(head,new THREE.SphereGeometry(.12,14,10),skin,"earR",[.31,-.015,0],[.55,.8,.45]);
 for(const side of [-1,1]){
  part(head,new THREE.SphereGeometry(.095,16,12),eyeWhite,"eyeSocket",[side*.125,.025,.295],[1,.9,.42]);
  part(head,new THREE.SphereGeometry(.055,14,10),iris,"iris",[side*.115,.018,.337],[1,1,.55]);
  part(head,new THREE.SphereGeometry(.027,12,8),pupil,"pupil",[side*.112,.018,.36]);
  part(head,new THREE.SphereGeometry(.105,12,8),dark,"eyebrow",[side*.125,.145,.29],[1.2,.25,.4]);
 }
 part(head,new THREE.SphereGeometry(.045,12,8),gold,"nose",[0,-.055,.33],[.8,.7,.6]);
 part(head,new THREE.TorusGeometry(.055,.012,6,12,Math.PI),dark,"smile",[0,-.145,.304]).rotation.z=Math.PI;
 const helm=new THREE.Group();helm.name="helm";helm.position.y=.24;head.add(helm);
 part(helm,new THREE.SphereGeometry(.335,20,14,0,Math.PI*2,0,Math.PI*.56),gold,"helmet-crown",[0,.02,-.005],[1.08,.82,.98]);
 part(helm,new THREE.BoxGeometry(.47,.075,.055),accent,"helmet-band",[0,-.095,.285]);
 if(style.crest)part(helm,new THREE.ConeGeometry(.09,.24,5),accent,"helmet-crest",[0,.31,-.005]);
 if((species==="Demon"||species==="Orc")||style.horns){for(const side of [-1,1])if(style.horns||species==="Demon"||species==="Orc")part(helm,new THREE.ConeGeometry(.055+style.ornament*.008,.2+style.ornament*.025,6),species==="Demon"?dark:gold,"horn",[side*.25,.18,-.02],[1,1.25,1]).rotation.z=-side*.5}
 if(species==="Elf")for(const side of [-1,1])part(head,new THREE.ConeGeometry(.07,.3,5),skin,"elf-ear",[side*.36,.02,0],[.7,1.4,.6]).rotation.z=-side*.9;
 const armL=new THREE.Group();armL.name="armL";armL.position.set(-.37,.12,0);torso.add(armL);
 const armR=new THREE.Group();armR.name="armR";armR.position.set(.37,.12,0);torso.add(armR);
 for(const [arm,side] of [[armL,-1],[armR,1]]){
  if(style.shoulders)part(arm,new THREE.SphereGeometry(.16,16,12),gold,"shoulder-pad",[side*.015,-.015,0],[1.2,.9,1]);
  capsule(arm,"upperArm",.105,.23,skin,[0,-.18,.015]);
  capsule(arm,"foreArm",.105,.22,armor,[0,-.43,.035]);
  part(arm,new THREE.SphereGeometry(.12,14,10),gold,"gauntlet",[0,-.57,.055]);
 }
 const weapon=new THREE.Group();weapon.name="weapon";weapon.position.set(.02,-.62,.06);armR.add(weapon);
 part(weapon,new THREE.CapsuleGeometry(.055,.62,4,8),gold,"blade",[0,.39,0]).rotation.z=-.08;
 part(weapon,new THREE.BoxGeometry(.24,.065,.08),gold,"guard",[0,.08,0]);
 part(weapon,new THREE.CylinderGeometry(.045,.055,.22,10),dark,"grip",[0,-.055,0]);
 part(weapon,new THREE.SphereGeometry(.07,12,10),accent,"pommel",[0,-.18,0]);
 const legL=new THREE.Group();legL.name="legL";legL.position.set(-.16,.62,0);root.add(legL);
 const legR=new THREE.Group();legR.name="legR";legR.position.set(.16,.62,0);root.add(legR);
 for(const [leg,side] of [[legL,-1],[legR,1]]){
  capsule(leg,"thigh",.13,.22,cloth,[0,-.13,0]);
  capsule(leg,"greave",.12,.24,armor,[0,-.36,.015]);
  part(leg,new THREE.SphereGeometry(.15,14,10),gold,"boot",[0,-.51,.075],[1.1,.65,1.35]);
 }
 const wings=[];
 if(["Angel","Demon"].includes(species))for(const side of [-1,1]){
  const w=new THREE.Group();w.name="wing"+side;w.position.set(side*.28,.22,-.22);root.add(w);
  for(let j=0;j<4;j++)part(w,new THREE.SphereGeometry(.13,12,8),species==="Angel"?gold:accent,"feather",[side*(.12+j*.08),.13-j*.12,-j*.025],[.7,1.7,.35]).rotation.z=-side*.35;
  wings.push(w);
 }
 root.userData.rig={torso,head,armL,armR,legL,legR,weapon,wings,cape};return root;
}
function beast(species,element,characterId){
 const style=seededStyle(characterId),root=new THREE.Group();root.name="VarethiaCreatureRig";const hide=material(style.armor),accent=material(palette[element]||style.trim,.3,.4,palette[element]||0),eyes=new THREE.MeshStandardMaterial({color:style.iris,emissive:style.iris,emissiveIntensity:1.8});
 part(root,new THREE.SphereGeometry(.46,18,14),hide,"body",[0,.72,0],[1.5,.72,.8]);
 const head=new THREE.Group();head.name="head";head.position.set(0,1.02,.48);root.add(head);part(head,new THREE.SphereGeometry(.3,16,12),hide,"skull",[0,0,0],[1.15,.85,1]);part(head,new THREE.SphereGeometry(.05,12,8),eyes,"eyeL",[-.17,.05,.24]);part(head,new THREE.SphereGeometry(.05,12,8),eyes,"eyeR",[.17,.05,.24]);
 const legs=[];for(const x of [-.32,.32])for(const z of [-.3,.35]){const l=new THREE.Group();l.position.set(x,.62,z);root.add(l);capsule(l,"limb",.11,.42,hide,[0,-.25,0]);legs.push(l)}
 const tail=new THREE.Group();tail.name="tail";tail.position.set(0,.82,-.55);root.add(tail);capsule(tail,"tailSegment",.12,.7,accent,[0,0,-.34]).rotation.x=Math.PI/2;
 return Object.assign(root,{userData:{rig:{head,legs,tail}}});
}
async function getAsset(species,element,characterId,lowDetail=false){
 await manifestReady;
 const entry=manifest.characters?.[String(characterId)]||manifest.models?.[species]||manifest.characters?.[species];
 const customUrl=typeof entry==="string"?entry:(lowDetail?(entry?.low||entry?.high):(entry?.high||entry?.low));
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
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:"low-power",depth:true,stencil:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1));renderer.setSize(Math.max(48,host.clientWidth||88),Math.max(48,host.clientHeight||88),false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xe9d8c2,0x221820,2));const key=new THREE.DirectionalLight(0xffe0bb,2.2);key.position.set(2,4,4);scene.add(key);const rim=new THREE.PointLight(palette[element]||0xb58b58,2,8);rim.position.set(-2,1.5,-1);scene.add(rim);
  const battlefieldView=host.classList.contains("unit-icon")||host.dataset.characterModel?.startsWith("commander-");const camera=battlefieldView?new THREE.OrthographicCamera(-1.05,1.05,1.05,-1.05,.1,40):new THREE.PerspectiveCamera(31,1,.1,30);if(battlefieldView){camera.position.set(3.4,3.4,5.8);camera.lookAt(0,1.05,0)}else{camera.position.set(1.05,1.75,5.25);camera.lookAt(0,1,0)}
  const asset=await getAsset(species,element,host.dataset.characterModel,battlefieldView),root=asset.external?SkeletonUtils.clone(asset.scene):(["Dragon","Monster","Legendary Creature","Beastkin"].includes(species)?beast(species,element,host.dataset.characterModel):humanoid(species,element,host.dataset.characterModel)),baseScale=(options.scale||(battlefieldView?1.38:.9))*(species==="Giant"?1.25:1);root.scale.setScalar(baseScale);scene.add(root);
  const mixer=asset.clips.length?new THREE.AnimationMixer(root):null,actions={};if(mixer)asset.clips.forEach(c=>actions[c.name.toLowerCase()]=mixer.clipAction(c));
  const rig=root.userData.rig||null,particles=[];for(let i=0;i<(battlefieldView?2:3);i++){const p=part(scene,new THREE.SphereGeometry(.018,6,4),new THREE.MeshBasicMaterial({color:palette[element]||0xc5a06a,transparent:true,opacity:.6}),"ambientParticle",[Math.random()*2-1,Math.random()*2.4,Math.random()*1.2-0.6]);particles.push(p)}
  const clock=new THREE.Clock();let raf=0,active=false,state="idle",stateAt=0,selected=false,hovered=false;const blinkPhase=Math.random()*3.2;const eyeMeshes=[];root.traverse(o=>{if(o.isMesh&&/eye/i.test(o.name)){o.userData.baseEyeY=o.scale.y;eyeMeshes.push(o)}});
  const resize=()=>{const w=Math.max(48,host.clientWidth||88),h=Math.max(48,host.clientHeight||88);renderer.setSize(w,h,false);camera.aspect=w/h;if(camera.isOrthographicCamera){const half=1.05;camera.left=-half*w/h;camera.right=half*w/h;camera.top=half;camera.bottom=-half}camera.updateProjectionMatrix()};const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();
  const clipFor={idle:["idle","breathing"],walk:["walk","walking"],run:["run","running"],attack:["attack","melee","cast"],block:["block","blocking"],dodge:["dodge","roll"],hit:["hit","hurt","stagger"],death:["death","die"]};
  const setState=s=>{state=s;stateAt=performance.now();if(mixer){const action=(clipFor[s]||[s]).map(n=>actions[n]).find(Boolean);if(action){Object.values(actions).forEach(a=>a.fadeOut(.1));action.reset().fadeIn(.1).play()}}};
  function frame(){if(!active)return;raf=requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;if(mixer)mixer.update(dt);
   const idleMotion=state==="idle"||state==="block";
   if(idleMotion){const bounce=Math.sin(t*3.1+blinkPhase);root.position.y=bounce*.045;root.rotation.z=Math.sin(t*1.55+blinkPhase)*.025;root.rotation.x=Math.sin(t*1.1+blinkPhase)*.018;if(rig?.torso){rig.torso.rotation.z=Math.sin(t*1.7+blinkPhase)*.045;rig.torso.rotation.x=Math.sin(t*1.25)*.025}if(rig?.head){rig.head.rotation.y=Math.sin(t*.9+blinkPhase)*.12;rig.head.rotation.x=Math.sin(t*2.1)*.035}if(rig?.armL)rig.armL.rotation.z=Math.sin(t*2.2+blinkPhase)*.09;if(rig?.armR)rig.armR.rotation.z=-Math.sin(t*2.2+blinkPhase)*.09;if(rig?.weapon)rig.weapon.rotation.z=Math.sin(t*2.4)*.07;if(rig?.tail)rig.tail.rotation.y=Math.sin(t*2.4)*.16;if(rig?.cape)rig.cape.rotation.x=Math.sin(t*2.2+blinkPhase)*.09;if(rig?.legs)rig.legs.forEach((l,i)=>l.rotation.x=Math.sin(t*2+i*Math.PI)*.035)}
   const blinkCycle=(t+blinkPhase)%3.8;const blink=Math.max(0,1-Math.abs(blinkCycle-3.48)/.12);eyeMeshes.forEach(eye=>{eye.scale.y=Math.max(.04,eye.userData.baseEyeY*(1-.94*blink))});
   if(rig&&!mixer){
    if(state==="walk"||state==="run"){const sp=state==="run"?10:6;root.position.y=Math.abs(Math.sin(t*sp))*.09;if(rig.legL)rig.legL.rotation.x=Math.sin(t*sp)*.6;if(rig.legR)rig.legR.rotation.x=-Math.sin(t*sp)*.6;if(rig.armL)rig.armL.rotation.x=-Math.sin(t*sp)*.3;if(rig.armR)rig.armR.rotation.x=Math.sin(t*sp)*.3;if(rig.legs)rig.legs.forEach((l,i)=>l.rotation.x=Math.sin(t*sp+i*Math.PI)*.42)}
    if(state==="attack"){const p=Math.min(1,(performance.now()-stateAt)/780);const strike=Math.sin(p*Math.PI*3);const style=host.dataset.attackStyle||"duelist";const forward=Math.sin(p*Math.PI);root.position.z=forward*(style==="ranger"?.04:.28);root.position.y=Math.abs(strike)*.035;if(rig.armR)rig.armR.rotation.x=-Math.max(0,strike)*(style==="bruiser"?2.45:style==="spellcaster"?1.55:2.05);if(rig.armL)rig.armL.rotation.x=Math.max(0,-strike)*.9;if(rig.torso)rig.torso.rotation.y=strike*(style==="bruiser"?.82:.58);if(rig.weapon)rig.weapon.rotation.z=-strike*(style==="spellcaster"?1.15:.9);if(rig.head)rig.head.rotation.x=-Math.max(0,strike)*.42;if(rig.tail)rig.tail.rotation.x=strike*.45;if(p>=1){root.position.z=0;setState("idle")}}
    if(state==="deploy"){const p=Math.min(1,(performance.now()-stateAt)/620);root.position.y=Math.sin(p*Math.PI)*.72;root.rotation.z=Math.sin(p*Math.PI)*.12;if(p>=1){root.position.y=0;root.rotation.z=0;setState("idle")}}
    if(state==="block"){if(rig.armL)rig.armL.rotation.x=-1.1;if(rig.armR)rig.armR.rotation.x=-1.1}
    if(state==="dodge"){const p=Math.min(1,(performance.now()-stateAt)/420);root.position.x=Math.sin(p*Math.PI)*.45;root.rotation.z=Math.sin(p*Math.PI)*.48;if(p>=1){root.position.x=0;root.rotation.z=0;setState("idle")}}
    if(state==="hit"){const p=Math.min(1,(performance.now()-stateAt)/420);root.rotation.z=Math.sin(p*Math.PI*3)*.12;root.position.x=Math.sin(p*Math.PI*3)*.035;if(p>=1){root.rotation.z=0;root.position.x=0;setState("idle")}}
    if(state==="death"){root.rotation.z=THREE.MathUtils.damp(root.rotation.z,1.42,4,dt);root.position.y=THREE.MathUtils.damp(root.position.y,-.62,4,dt);root.scale.x=THREE.MathUtils.damp(root.scale.x,baseScale*.88,3,dt)}
    if(state==="evolution"){const p=Math.min(1,(performance.now()-stateAt)/900);root.scale.setScalar(baseScale*(1+.32*Math.sin(p*Math.PI)));if(rig?.wings)rig.wings.forEach((w,i)=>w.rotation.z=Math.sin(p*Math.PI*8+i)*.55);if(p>=1)setState("idle")}
    if(rig.wings)rig.wings.forEach((w,i)=>w.rotation.z=Math.sin(t*2.6+i)*.14);if(rig?.cape&&state!=="idle")rig.cape.rotation.x=Math.sin(t*4.2)*.16;
   }else if(mixer&&state==="idle"){root.position.y=Math.sin(t*3.1+blinkPhase)*.035}
   root.rotation.y=options.turn?Math.sin(t*.55)*.28:(hovered?-.14:Math.sin(t*.65+blinkPhase)*.025);const pulse=idleMotion?Math.sin(t*3.1+blinkPhase):0;const visualScale=baseScale*(selected?1.07:hovered?1.035:1);root.scale.set(visualScale*(1+pulse*.012),visualScale*(1-Math.max(0,pulse)*.025),visualScale*(1+pulse*.012));
   particles.forEach((p,i)=>{p.position.y+=dt*(.06+(i%3)*.02);if(p.position.y>2.5)p.position.y=0});
   renderer.render(scene,camera);
  }
  const view={options,start(){if(active)return;active=true;clock.start();frame()},stop(){active=false;cancelAnimationFrame(raf)},dispose(){active=false;cancelAnimationFrame(raf);resizeObserver.disconnect();renderer.dispose();scene.traverse(o=>{o.geometry?.dispose?.();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.())}})},setState,select(v){selected=v},hover(v){hovered=v}};
  if(host.dataset.threeVisible!=="true"){view.dispose();canvas.remove();host.dataset.threeMounted="pending";pending.set(host,options);return}
  views.set(host,view);host.classList.add("three-ready");host.classList.remove("three-fallback");host._varethiaView=view;if(options.state)setState(options.state);const pendingState=pendingStates.get(String(host.dataset.characterModel||""));if(pendingState){setState(pendingState);pendingStates.delete(String(host.dataset.characterModel||""))}view.start();host.dispatchEvent(new CustomEvent("varethia:art-ready",{bubbles:true,detail:{characterId:host.dataset.characterModel}}));
 }catch(err){host.dataset.threeMounted="failed";host.classList.add("three-fallback");canvas.remove();host.dispatchEvent(new CustomEvent("varethia:art-failed",{bubbles:true,detail:{characterId:host.dataset.characterModel}}));console.warn("Three.js view unavailable; keeping original 2D art",err)}
}
function mount(host,options={}){if(!host||host.dataset.threeMounted)return;host.dataset.threeMounted="pending";pending.set(host,options);observer.observe(host)}
function scan(root=document){const hosts=[];if(root.matches?.("[data-character-model]"))hosts.push(root);root.querySelectorAll?.("[data-character-model]").forEach(host=>hosts.push(host));hosts.forEach(host=>mount(host,{turn:host.classList.contains("card-avatar"),scale:host.classList.contains("unit-icon")?1.18:.9}))}
function release(root){const hosts=[];if(root.matches?.("[data-character-model]"))hosts.push(root);root.querySelectorAll?.("[data-character-model]").forEach(h=>hosts.push(h));hosts.forEach(host=>{observer.unobserve(host);pending.delete(host);const view=views.get(host);if(view)view.dispose();views.delete(host);delete host._varethiaView})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mountArenaScene,{once:true});else mountArenaScene();
const mutation=new MutationObserver(records=>records.forEach(r=>{r.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)});r.removedNodes.forEach(n=>{if(n.nodeType===1)release(n)})}));mutation.observe(document.body,{childList:true,subtree:true});scan();
document.addEventListener("pointerover",e=>{const card=e.target.closest?.("[data-card]");card?.querySelector("[data-character-model]")?._varethiaView?.hover(true)});
document.addEventListener("pointerout",e=>{const card=e.target.closest?.("[data-card]");card?.querySelector("[data-character-model]")?._varethiaView?.hover(false)});
document.addEventListener("click",e=>{const card=e.target.closest?.("[data-card]");if(card){document.querySelectorAll(".card-avatar").forEach(x=>x._varethiaView?.select(false));card.querySelector(".card-avatar")?._varethiaView?.select(true)}const hand=e.target.closest?.(".hand-card");if(hand){document.querySelectorAll(".hand-card [data-character-model]").forEach(x=>x._varethiaView?.select(false));hand.querySelector("[data-character-model]")?._varethiaView?.select(true)}});
function impact(detail){const box=document.querySelector(".battlefield-frame");if(!box)return;const fx=document.createElement("span");fx.className="battle-impact-fx "+(detail.element||"")+(detail.type==="ultimate"?" ultimate":"")+(detail.combo==="firestorm"?" firestorm":"")+(detail.type==="evolution"?" evolution":"");fx.textContent=detail.combo==="firestorm"?"✧":detail.type==="evolution"?"✧":detail.type==="ultimate"?"✹":detail.element==="Fire"?"✹":detail.element==="Ice"?"❖":detail.element==="Lightning"?"ϟ":"✦";box.appendChild(fx);if(detail.type==="ultimate"||detail.combo==="firestorm"){const damage=Number(box.dataset.terrainDamage||0)+1;box.dataset.terrainDamage=String(damage);box.classList.add("terrain-damaged");}if(detail.attackType==="ranged"){const from=findLiveModel(detail.attackerId),to=findLiveModel(detail.targetId);if(from&&to){const a=from.getBoundingClientRect(),b=to.getBoundingClientRect(),r=box.getBoundingClientRect(),x=a.left+a.width/2-r.left,y=a.top+a.height/2-r.top,dx=b.left+b.width/2-a.left-a.width/2,dy=b.top+b.height/2-a.top-a.height/2,line=document.createElement("i");line.className="battle-projectile";line.style.left=x+"px";line.style.top=y+"px";line.style.width=Math.hypot(dx,dy)+"px";line.style.transform="rotate("+Math.atan2(dy,dx)+"rad)";box.appendChild(line);setTimeout(()=>line.remove(),420)}}box.classList.remove("impact-shake");void box.offsetWidth;box.classList.add("impact-shake");setTimeout(()=>{fx.remove();box.classList.remove("impact-shake")},700)}
let audioContext=null;
function playSound(kind){try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;if(!audioContext)audioContext=new Ctx();if(audioContext.state==="suspended")audioContext.resume();const now=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();const config={swing:[190,105,.12,"sawtooth"],impact:[95,42,.18,"triangle"],death:[75,28,.42,"sine"],ultimate:[420,70,.55,"sawtooth"]}[kind]||[160,80,.1,"sine"];osc.type=config[3];osc.frequency.setValueAtTime(config[0],now);osc.frequency.exponentialRampToValueAtTime(Math.max(20,config[1]),now+config[2]);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(kind==="ultimate"?.075:.035,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+config[2]);osc.connect(gain);gain.connect(audioContext.destination);osc.start(now);osc.stop(now+config[2]+.02)}catch(e){console.warn("Varethia sound effect unavailable",e)}}
function findLiveModel(id){return [...document.querySelectorAll('[data-character-model="'+CSS.escape(String(id||""))+'"]')].find(n=>n.closest(".lane-unit")&&n.dataset.threeVisible==="true")||[...document.querySelectorAll('[data-character-model="'+CSS.escape(String(id||""))+'"]')].find(n=>n.dataset.threeVisible==="true")}
function setModelState(id,state){if(id===undefined||id===null)return;const key=String(id),host=findLiveModel(key);if(host?._varethiaView)host._varethiaView.setState(state);else pendingStates.set(key,state)}
window.addEventListener("varethia:combat",e=>{const d=e.detail||{};if(d.targetId!==undefined)setModelState(d.targetId,d.type==="death"?"death":d.type==="block"?"block":d.type==="dodge"?"dodge":d.type==="evolution"?"evolution":"hit");if(d.attackerId!==undefined&&(d.type==="attack"||d.type==="element-combo")){setModelState(d.attackerId,d.type==="element-combo"||d.combo>=3?"ultimate":"attack");if(d.type==="attack"){const attacker=findLiveModel(d.attackerId)?.closest(".lane-unit");if(attacker){attacker.classList.remove("attacking");void attacker.offsetWidth;attacker.classList.add("attacking");setTimeout(()=>attacker.classList.remove("attacking"),760)}}}if(d.targetId!==undefined&&["block","dodge","evolution"].includes(d.type)){const target=findLiveModel(d.targetId)?.closest(".lane-unit");if(target){target.classList.add(d.type==="block"?"blocking":d.type==="dodge"?"dodging":"evolved");setTimeout(()=>target.classList.remove("blocking","dodging"),520)}}if(d.type==="deploy"){setModelState(d.targetId,"deploy");setTimeout(()=>setModelState(d.targetId,"idle"),650)}if(["ultimate","impact","attack","deploy","element-combo","evolution"].includes(d.type))impact(d);playSound(d.type==="death"?"death":d.type==="attack"?"swing":d.type==="ultimate"||d.type==="element-combo"||d.type==="evolution"?"ultimate":"impact")});
window.VarethiaAnimation={mount,scan,getCharacterAsset(id){return manifest.characters?.[String(id)]||null},getCharacterAssets(){return manifest.characters},assetsReady:manifestReady,play(id,state){document.querySelector('[data-character-model="'+CSS.escape(String(id))+'"]')?._varethiaView?.setState(state)},playSound,getStatus(){return {engine:"Three.js",cachedModels:modelCache.size,activeViews:views.size,manifest:"assets/characters/manifest.json"}}};
