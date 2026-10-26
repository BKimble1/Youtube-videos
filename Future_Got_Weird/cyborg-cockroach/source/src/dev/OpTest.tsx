// Framing test for S03: candidate cameras with a stand-in figure at the operator's position (a 1.75 m column).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {S03Scene, s03Cam} from '../shots/S03';
import {proj, Cam} from '../lib/cam';
import {V3} from '../lib/v3';
import {ROOM} from '../sets/LabRoom';

const StandIn: React.FC<{cam: Cam}> = ({cam}) => {
  const h = ROOM.operator.hip;
  const feet: V3 = [h[0], -900, h[2]], head: V3 = [h[0], 700, h[2]];
  const a = proj(cam, feet), b = proj(cam, head);
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#C0392B" strokeWidth={60} opacity={0.5} />;
};
export const OpTest: React.FC<{t: number; cams: {eyeA: V3; eyeB: V3; tgt: V3; f: number}[]}> = ({t, cams}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {cams.map((c, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <S03Scene t={t} cam={s03Cam(t, c.eyeA, c.eyeB, c.tgt, c.f)} operator={(cam) => <StandIn cam={cam} />} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace'}}>{i}</div>
      </div>
    ))}
  </AbsoluteFill>
);
