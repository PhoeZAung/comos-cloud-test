import {useRef} from 'react';
import {createRoot} from 'react-dom/client';
import LaserFlow from '../../components/react-bits/LaserFlow.jsx';
import '../../styles/laser-flow.css';

// React owns only the decoration; the site and sheet controls stay native.
function CosmosLaserFlow(){
 const cardRef=useRef(null);
 return <div className="cosmos-laser-stage">
  <div ref={cardRef} className="cosmos-laser-surface" />
  <LaserFlow surfaceRef={cardRef} beamPosition={0.6} color="#3847ff"
   intensity={1.8} flare={1.5} spread={1.5} spill={1} fog={0.2} dust={1.6}
   revealImage={new URL('../comos-universe.png',import.meta.url).href}
   revealRadius={220} revealOpacity={0.6} />
 </div>;
}
export function mountLaserFlow(host){
 const root=createRoot(host);
 root.render(<CosmosLaserFlow />);
 return ()=>root.unmount();
}
