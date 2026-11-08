import {createRoot} from 'react-dom/client';
import ElectricBorder from '../../components/react-bits/ElectricBorder.jsx';

export function mountElectricBorder(host){
 const root=createRoot(host);
 root.render(<ElectricBorder color="#7df9ff" speed={1} chaos={0.5} spread={0.6}
  strands={3} thickness={1.5} borderRadius={24} style={{width:'100%',height:'100%'}} />);
 return ()=>root.unmount();
}
