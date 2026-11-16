import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {RoomScene, handsUp, honestHold, gMouth, gHead, H} from '../art/room';
import {gameAt} from '../gameplay';

const SHOTS = [
  {cam: {x: 540, y: 830, z: 1.12}, open: 0.35, lift: 0},
  {cam: {x: 640, y: 760, z: 1.6}, open: 0.8, lift: 1},
  {cam: {x: gHead.x, y: gHead.y + 20, z: 4.2}, open: 1, lift: 0},
  {cam: {x: gMouth.x, y: gMouth.y + 8, z: 15}, open: 1, lift: 0},
  {cam: {x: gMouth.x, y: gMouth.y + 8, z: 15}, open: 1, lift: 1},
  {cam: {x: 520, y: 880, z: 1.12}, open: 0, lift: 0, honest: true},
];
export const RoomTest: React.FC = () => {
  const f = useCurrentFrame();
  const s = SHOTS[f];
  const t = [0.2, 3.0, 1.0, 1.2, 1.4, 4.9][f];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg width={1080} height={1920}>
        <RoomScene t={t} frame={Math.round(t * 30)} cam={s.cam} g={{pose: handsUp(1), m: {open: s.open, tongueLift: s.lift, u: 0.3, v: 0, glow: 1}}}
          h={s.honest ? {x: H.x, pose: {...honestHold(H.x), mouth: 'o', brows: 1}, pad: {dx: 0, dy: 0, r: 0, shake: 0}} : null} game={gameAt(t)} id="rt" />
      </svg>
    </AbsoluteFill>
  );
};
