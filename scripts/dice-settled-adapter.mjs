// Pinned to Dice Box 1.1.4. Prepare a landing orientation before the die appears;
// after landing this function only checks that face, without changing it.
export function patchSettledFaces(source){
 const anchor='const d = t.pickWithRay(Ze.ray);';
 if(!source.includes(anchor))throw Error('Dice face adapter needs review.');
 source=source.replace(anchor,`
      const rawWanted=s.config.data?.targetValue;
      const faceMap=o[s.dieType];
      const requested=Number.isInteger(rawWanted)?(s.dieParent?rawWanted%10:s.config.sides===100?Math.floor((rawWanted%100)/10)*10:rawWanted):undefined;
      const wanted=requested===10&&!Object.values(faceMap).includes(10)?0:requested===0&&!Object.values(faceMap).includes(0)&&s.dieType==='d10'?10:requested;
      // Source meshes have frozen transforms. Instances and their hitboxes must
      // update their actual world matrices after choosing the recorded face.
      c.unfreezeWorldMatrix();s.mesh.unfreezeWorldMatrix();
      c.scaling.scaleInPlace(s.config.scale);
      const cameraDirection=t.activeCamera.position.subtract(s.mesh.position).normalize();
      u.copyFrom(cameraDirection);if(s.dieType==='d4'&&h)u.negateInPlace();
      Ze.ray.direction=u;Ze.ray.length=10000;
      s.mesh.computeWorldMatrix(true);c.computeWorldMatrix(true);
      const pick=()=>t.pickWithRay(Ze.ray,mesh=>mesh===c);
      if(Number.isInteger(wanted)&&s.cosmosPreparing){
        const indices=c.getIndices(),positions=c.getVerticesData('position');
        const vertex=index=>new p(positions[index*3]*c.scaling.x,positions[index*3+1]*c.scaling.y,positions[index*3+2]*c.scaling.z);
        const candidates=Object.keys(faceMap).filter(key=>faceMap[key]===wanted);
        let matched=false;
        for(const face of candidates){
          const start=Number(face)*3,a0=vertex(indices[start]),b0=vertex(indices[start+1]),c0=vertex(indices[start+2]);
          const normal=p.Cross(b0.subtract(a0),c0.subtract(a0)).normalize();
          for(const direction of [normal,normal.negate()]){
            const dot=Math.max(-1,Math.min(1,p.Dot(direction,u))),axis=p.Cross(direction,u);
            if(axis.length()<.00001)axis.copyFrom(p.Cross(direction,new p(1,0,0)));
            if(axis.length()<.00001)axis.set(0,0,1);
            const rotation=s.mesh.rotationQuaternion.constructor.RotationAxis(axis.normalize(),Math.acos(dot));
            s.mesh.rotationQuaternion.copyFrom(rotation);c.rotationQuaternion=s.mesh.rotationQuaternion;
            s.mesh.computeWorldMatrix(true);c.computeWorldMatrix(true);
            const hit=pick();if(hit?.hit&&faceMap[hit.faceId]===wanted){
              s.cosmosLandingNormal=direction.clone();
              s.cosmosRotationFor=position=>{
                const aim=t.activeCamera.position.subtract(position).normalize();if(s.dieType==='d4'&&h)aim.negateInPlace();
                const normal=s.cosmosLandingNormal,dot=Math.max(-1,Math.min(1,p.Dot(normal,aim))),axis=p.Cross(normal,aim);
                if(axis.length()<.00001)axis.copyFrom(p.Cross(normal,new p(1,0,0)));
                if(axis.length()<.00001)axis.set(0,0,1);
                return s.mesh.rotationQuaternion.constructor.RotationAxis(axis.normalize(),Math.acos(dot));
              };
              matched=true;break;
            }
          }
          if(matched)break;
        }
        if(!matched){c.dispose();throw Error('The recorded die face could not be aligned.');}
      }
      const d = pick();
      if(!d?.hit){c.dispose();throw Error('The visible die face could not be read.');}
      if(Number.isInteger(wanted)&&faceMap[d.faceId]!==wanted){c.dispose();throw Error('The visible face does not match the recorded roll.');}
 `.trim());
 const result='return c.dispose(), s.value = o[s.dieType][d.faceId],';
 if(!source.includes(result))throw Error('Dice result adapter needs review.');
 source=source.replace(result,`return c.dispose(), s.value = (s.dieParent&&o[s.dieType][d.faceId]===10?0:o[s.dieType][d.faceId]),`);
 return source;
}
