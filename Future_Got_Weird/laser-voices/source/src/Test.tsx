// Dev still: the scene at time t through an explicit camera (for blocking and composition checks).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import './fonts';
import {basis, lineD, proj, v3} from './p3';
import {RoomScene} from './Scene';
import {byAt, FOCUS, pathHit, recAt} from './story';
import {EXIT} from './world';

export const Test: React.FC<{t: number; pos: number[]; tgt: number[]; f: number; sec?: number}> = ({t, pos, tgt, f, sec = 0}) => {
  const b = basis({pos: v3(pos[0], pos[1], pos[2]), tgt: v3(tgt[0], tgt[1], tgt[2]), f});
  const hit = pathHit(t);
  const end = hit ? hit.p : FOCUS;
  const a = proj(b, EXIT), c = proj(b, end);
  return (
    <AbsoluteFill style={{background: '#E7DCCB'}}>
      <svg width={1080} height={1920}>
        <RoomScene b={b} rec={recAt(t)} by={byAt(t)} dev={{section: sec, mirror: 0.03 * Math.sin(t * 5), tx: 1, t}} />
        <path d={lineD([a, c])} stroke="#F2A93B" strokeWidth={4} strokeDasharray="14 10" />
      </svg>
      <div style={{position: 'absolute', left: 20, top: 20, fontSize: 36, color: '#000', fontFamily: 'monospace'}}>{`t=${t} ${hit ? 'BLOCKED' : 'clear'}`}</div>
    </AbsoluteFill>
  );
};
