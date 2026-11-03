import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
let pending;
export async function showDrake(host){
 pending??=new GLTFLoader().loadAsync('/assets/roll-fx/drake.glb').catch(error=>{pending=null;throw error;});
 const gltf=await pending;if(!host.isConnected)return ()=>{};
 const {clone}=await import('three/addons/utils/SkeletonUtils.js'),model=clone(gltf.scene),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.01,1000),renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(host.clientWidth||420,host.clientHeight||320);renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);camera.aspect=(host.clientWidth||420)/(host.clientHeight||320);camera.updateProjectionMatrix();
 scene.add(new THREE.HemisphereLight(0xc5c0ff,0x301732,3));const light=new THREE.DirectionalLight(0xffbf85,5);light.position.set(4,6,8);scene.add(light);scene.add(model);
 const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3()),radius=Math.max(size.x,size.y,size.z);model.position.sub(center);model.rotation.y=-.4;camera.position.set(radius*.2,radius*.12,radius*1.9);camera.lookAt(0,0,0);
 const mixer=new THREE.AnimationMixer(model),clip=gltf.animations.find(clip=>/roar/i.test(clip.name))||gltf.animations.find(clip=>/fly/i.test(clip.name))||gltf.animations[0];if(clip)mixer.clipAction(clip).play();
 let frame,previous=performance.now(),closed=false;
 function draw(now){if(closed||!host.isConnected)return;mixer.update(Math.min(.05,(now-previous)/1000));previous=now;renderer.render(scene,camera);frame=requestAnimationFrame(draw);}frame=requestAnimationFrame(draw);
 return ()=>{closed=true;cancelAnimationFrame(frame);mixer.stopAllAction();mixer.uncacheRoot(model);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
}
