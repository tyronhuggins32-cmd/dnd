import * as THREE from "three";

const host=document.getElementById("titleSceneViewport");
const screen=document.getElementById("titleScreen");
if(!host||!screen) throw new Error("Varethia title scene mount is missing");
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let renderer,scene,camera,frame=0,elapsed=0,transitioning=false;
const clock=new THREE.Clock();
const movers=[];
const pointer={x:0,y:0};
const target=new THREE.Vector3(0,2.1,0);

function material(color,roughness=.92,extra={}){return new THREE.MeshStandardMaterial({color,roughness,...extra})}
function addTree(x,z,height,scale=1){
 const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(scale);
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.42,height*.54,7),material(0x211d14));trunk.position.y=height*.27;group.add(trunk);
 for(let i=0;i<3;i++){const cone=new THREE.Mesh(new THREE.ConeGeometry(height*(.23-i*.035),height*(.45-i*.06),7),material(i===0?0x1e2b1b:0x293623));cone.position.y=height*(.48+i*.16);group.add(cone)}
 group.rotation.z=(Math.random()-.5)*.08;scene.add(group);movers.push({object:group,kind:"tree",phase:Math.random()*6});
}
function addRuin(){
 const stone=material(0x68634d),dark=material(0x282d22),glow=material(0xb5c7a0,.28,{emissive:0x718d72,emissiveIntensity:1.2});
 const base=new THREE.Mesh(new THREE.BoxGeometry(4.7,.8,3.8),stone);base.position.set(1.1,.35,-4.7);scene.add(base);
 const keep=new THREE.Mesh(new THREE.BoxGeometry(2.9,4.3,2.8),stone);keep.position.set(1.1,2.75,-4.7);scene.add(keep);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(2.3,1.5,4),dark);roof.position.set(1.1,5.55,-4.7);roof.rotation.y=Math.PI/4;scene.add(roof);
 for(const x of [-.1,2.3]){const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,3.8,8),stone);pillar.position.set(x,2.2,-2.9);scene.add(pillar)}
 const arch=new THREE.Mesh(new THREE.TorusGeometry(.66,.14,8,20,Math.PI),glow);arch.position.set(1.1,2.1,-3.24);scene.add(arch);
 const doorway=new THREE.Mesh(new THREE.PlaneGeometry(1.15,2.15),dark);doorway.position.set(1.1,1.48,-3.19);scene.add(doorway);
 const rubbleGeo=new THREE.DodecahedronGeometry(.34,0);
 for(let i=0;i<32;i++){const rock=new THREE.Mesh(rubbleGeo,stone);rock.position.set(-4+Math.random()*10,.1+Math.random()*.25,-7+Math.random()*5);rock.rotation.set(Math.random(),Math.random(),Math.random());rock.scale.set(.6+Math.random(),.4+Math.random()*.8,.6+Math.random());scene.add(rock)}
}
function addShrine(){
 const gold=material(0xa18a58,.55,{metalness:.22}),stone=material(0x85816b);
 const plinth=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.9,.65,8),stone);plinth.position.set(-3,.25,-3.8);scene.add(plinth);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.08,.055,10,64),gold);ring.position.set(-3,2.0,-3.8);ring.rotation.x=.35;scene.add(ring);movers.push({object:ring,kind:"ring"});
 const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.48,1),material(0x9dc7c2,.2,{emissive:0x397c79,emissiveIntensity:1.5,transparent:true,opacity:.9}));crystal.position.set(-3,2.05,-3.8);scene.add(crystal);movers.push({object:crystal,kind:"crystal"});
}
function addParticles(){
 const count=reduced?70:240,positions=new Float32Array(count*3),sizes=new Float32Array(count);
 for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*22;positions[i*3+1]=Math.random()*7+.2;positions[i*3+2]=(Math.random()-.5)*18-2;sizes[i]=.5+Math.random()*1.8}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));geometry.setAttribute("size",new THREE.BufferAttribute(sizes,1));
 const points=new THREE.Points(geometry,new THREE.PointsMaterial({color:0xd8d9a2,size:.055,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(points);movers.push({object:points,kind:"particles",base:positions.slice()});
}
function build(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x192219);scene.fog=new THREE.FogExp2(0x20291f,.038);
 camera=new THREE.PerspectiveCamera(43,1,.1,100);camera.position.set(0,4.1,13);camera.lookAt(target);
 scene.add(new THREE.HemisphereLight(0xc4cbb1,0x171b13,1.55));
 const moon=new THREE.DirectionalLight(0xd9dfc4,2.25);moon.position.set(4,10,5);scene.add(moon);
 const warm=new THREE.PointLight(0xd0a66b,35,17,2);warm.position.set(-4,3,-2);scene.add(warm);
 const shrineLight=new THREE.PointLight(0x8fc2ac,18,12,2);shrineLight.position.set(-3,2.5,-3.7);scene.add(shrineLight);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(50,50),material(0x20291b));floor.rotation.x=-Math.PI/2;floor.position.y=-.05;scene.add(floor);
 for(let i=0;i<22;i++){const x=(Math.random()-.5)*25,z=-1-Math.random()*18;addTree(x,z,5+Math.random()*5,.7+Math.random()*.75)}
 addRuin();addShrine();addParticles();
 const fogMat=new THREE.MeshBasicMaterial({color:0xc3cbb3,transparent:true,opacity:.045,depthWrite:false});
 for(let i=0;i<4;i++){const fog=new THREE.Mesh(new THREE.PlaneGeometry(24,3),fogMat.clone());fog.position.set((i-1.5)*3,.45+i*.28,-1-i*2);fog.rotation.x=-.08;movers.push({object:fog,kind:"fog",phase:i});scene.add(fog)}
}
function resize(){if(!renderer||!camera)return;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function animate(){
 frame=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;
 if(!renderer||!scene)return;
 const active=!screen.classList.contains("dismissed");
 if(active&&!reduced&&!transitioning){camera.position.x=THREE.MathUtils.damp(camera.position.x,pointer.x*.65,1.2,dt);camera.position.y=THREE.MathUtils.damp(camera.position.y,4.1+pointer.y*.22,1.2,dt);camera.position.z=THREE.MathUtils.damp(camera.position.z,13,1.2,dt);camera.lookAt(target.x+pointer.x*.22,target.y+pointer.y*.1,target.z)}
 for(const mover of movers){const o=mover.object;if(mover.kind==="tree"&&!reduced)o.rotation.z=Math.sin(elapsed*.28+mover.phase)*.009;if(mover.kind==="ring"&&!reduced)o.rotation.y=elapsed*.18;if(mover.kind==="crystal"){o.rotation.y=elapsed*.35;o.position.y=2.05+Math.sin(elapsed*1.2)*.14}if(mover.kind==="fog"&&!reduced)o.position.x=Math.sin(elapsed*.12+mover.phase)*1.3;if(mover.kind==="particles"&&!reduced){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)+dt*(.12+(i%5)*.025);p.setY(i,y>7.3?.15:y)}p.needsUpdate=true}}
 renderer.render(scene,camera);
}
try{
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"low-power"});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.setClearColor(0x192219,1);host.appendChild(renderer.domElement);screen.classList.add("scene-ready");build();resize();new ResizeObserver(resize).observe(host);animate();
}catch(error){console.warn("Varethia 3D title scene unavailable; CSS scene fallback remains active.",error);screen.classList.add("scene-fallback")}
window.addEventListener("pointermove",e=>{if(reduced)return;pointer.x=(e.clientX/innerWidth-.5)*2;pointer.y=(e.clientY/innerHeight-.5)*2},{passive:true});
function playSelectSound(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;const ctx=new Audio(),now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type="sine";osc.frequency.setValueAtTime(660,now);osc.frequency.exponentialRampToValueAtTime(440,now+.12);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.045,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+.2);osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.21);osc.onended=()=>ctx.close()}catch{}}
const overlay=document.createElement("div");overlay.className="title-transition";document.body.appendChild(overlay);
function transitionOut(callback){if(transitioning){callback?.();return}transitioning=true;playSelectSound();screen.classList.add("cinematic-exit");overlay.classList.add("active");if(!reduced){camera.position.z-=1.3;camera.position.y+=.18}setTimeout(()=>{callback?.();screen.classList.add("dismissed");screen.classList.remove("cinematic-exit");overlay.classList.remove("active");transitioning=false},reduced?40:760)}
function transitionIn(callback){transitioning=true;screen.classList.remove("dismissed");screen.classList.add("cinematic-enter");overlay.classList.add("active");requestAnimationFrame(()=>requestAnimationFrame(()=>{overlay.classList.remove("active");screen.classList.remove("cinematic-enter");transitioning=false;callback?.()}))}
window.VarethiaTitleScene={transitionOut,transitionIn,playSelectSound};
document.querySelectorAll("[data-title-action]").forEach(button=>button.addEventListener("click",()=>{if(button.dataset.titleAction==="settings")playSelectSound();if(!reduced){camera.position.z-=.22;camera.position.y+=.04}},{capture:true}));
