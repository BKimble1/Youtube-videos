// V4 thumbnails, drawn with the episode's own vector F.02, foundry set and opening jump (no source frames, no logo lock-up).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Scene, Cam} from '../kit/scene';
import {FoundryView} from '../sets/views';
import {Bot} from '../kit/scene';
import {stand, A} from '../rig/poses';
import {JUMP1, S_OPEN} from '../shots/Opening';
import {FD} from '../sets/foundry';
import {C, F} from '../../theme';

const Title: React.FC<{lines: string[]; x: number; y: number; align?: 'left' | 'right'}> = ({lines, x, y, align = 'right'}) => (
  <div style={{position: 'absolute', top: y, left: align === 'left' ? x : undefined, right: align === 'right' ? 1920 - x : undefined, textAlign: align,
    fontFamily: F.display, fontWeight: 700, fontSize: 210, lineHeight: 0.98, color: '#FFF6E4', letterSpacing: '-0.01em',
    textShadow: `0 10px 0 ${C.ink}, 8px 10px 0 ${C.ink}, -8px 10px 0 ${C.ink}, 0 -4px 0 ${C.ink}, 6px 0 0 ${C.ink}, -6px 0 0 ${C.ink}, 0 18px 30px rgba(0,0,0,0.6)`}}>
    {lines.map((l, i) => <div key={i} style={{color: i === lines.length - 1 ? C.saffron : '#FFF6E4'}}>{l}</div>)}
  </div>
);

/** Main: the F.02 at the lip, looking down into the ladle. */
export const ThumbV4A: React.FC = () => {
  const cam: Cam = {x: 520, y: 470, z: 1.5};
  const p = stand(250, FD.deck.top, S_OPEN, {yaw: 0.8, head: 16, neck: 8, armN: A(6, 14, {grip: 0.4}), armF: A(-4, 16, {grip: 0.4})});
  return (
    <AbsoluteFill>
      <Scene bg="#221A21"><FoundryView cam={cam} t={4.2} glow={1.3} behind={<Bot cam={cam} id="thA4" model="F02" s={S_OPEN} pose={p} />} /></Scene>
      <Title lines={['ON', 'PURPOSE']} x={1860} y={60} />
    </AbsoluteFill>
  );
};

/** Backup: the leap toward the ladle. */
export const ThumbV4B: React.FC = () => {
  const cam: Cam = {x: 580, y: 400, z: 1.55};
  return (
    <AbsoluteFill>
      <Scene bg="#221A21"><FoundryView cam={cam} t={4.2} glow={1.3} behind={<Bot cam={cam} id="thB4" model="F02" s={S_OPEN} pose={JUMP1.pose(1.05).pose} />} /></Scene>
      <Title lines={['ON', 'PURPOSE']} x={1860} y={60} />
    </AbsoluteFill>
  );
};
