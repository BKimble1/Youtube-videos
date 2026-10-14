// V3 thumbnails, drawn from the same rig, foundry set and payoff jump as the episode (no source frames, no logo).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cam3} from '../engine/camera';
import {add} from '../engine/math';
import {FoundryScene} from '../shots/HookFoundry';
import {PAYOFF} from '../shots/Real';
import {C, F} from '../../theme';

const Title: React.FC<{lines: string[]; x: number; y: number; align?: 'left' | 'right'}> = ({lines, x, y, align = 'right'}) => (
  <div style={{position: 'absolute', top: y, left: align === 'left' ? x : undefined, right: align === 'right' ? 1920 - x : undefined, textAlign: align,
    fontFamily: F.display, fontWeight: 700, fontSize: 210, lineHeight: 0.98, color: '#FFF6E4', letterSpacing: '-0.01em',
    textShadow: `0 10px 0 ${C.ink}, 8px 10px 0 ${C.ink}, -8px 10px 0 ${C.ink}, 0 -4px 0 ${C.ink}, 6px 0 0 ${C.ink}, -6px 0 0 ${C.ink}, 0 18px 30px rgba(0,0,0,0.6)`}}>
    {lines.map((l, i) => <div key={i} style={{color: i === lines.length - 1 ? C.saffron : '#FFF6E4'}}>{l}</div>)}
  </div>
);

export const ThumbV3A: React.FC = () => {
  const st = PAYOFF.at(0.55);
  const p = st.pose.pos;
  const cam: Cam3 = {pos: [10, 780, 560], target: [-90, 585, 0], fov: 42, roll: -3};
  return (
    <AbsoluteFill>
      <FoundryScene cam={cam} tau={100} robots={[{pose: st.pose, id: 'thA', inside: false}]} entries={[]} />
      <Title lines={['ON', 'PURPOSE']} x={1860} y={60} />
    </AbsoluteFill>
  );
};

export const ThumbV3B: React.FC = () => {
  const st = PAYOFF.at(-0.7);
  const p = st.pose.pos;
  const cam: Cam3 = {pos: [-470, 900, 70], target: [-40, 380, -40], fov: 40, roll: 2};
  return (
    <AbsoluteFill>
      <FoundryScene cam={cam} tau={100} robots={[{pose: st.pose, id: 'thB', inside: false}]} entries={[]} />
      <Title lines={['ON', 'PURPOSE']} x={1860} y={70} />
    </AbsoluteFill>
  );
};
