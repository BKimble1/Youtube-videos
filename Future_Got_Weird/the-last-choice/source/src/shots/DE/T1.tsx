// T1 — temporary rig back-view test
import React from 'react';
import {Actor} from '../../rig/actor';
import {CAST, CIVILIANS} from '../../rig/looks';
const T1: React.FC = () => {
  const looks = [CAST.clerkA, CAST.honest, CAST.clerkC, CAST.clerkB, CAST.checker, CIVILIANS[0], CIVILIANS[2]];
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{background: '#F4F1EA'}}>
      {looks.map((lk, i) => <Actor key={i} look={lk} t={0} x={150 + i * 260} y={500} s={1} yaw={180} seed={i} />)}
      {looks.map((lk, i) => <Actor key={`b${i}`} look={lk} t={0} x={150 + i * 260} y={1040} s={1} yaw={150} seed={i} head={{pitch: 20}} />)}
    </svg>
  );
};
export default T1;
