// B3 (222-254, "cockroach, then used"): the medic walking naturally over the white tray, seen in profile at insect
// height (az 0, el 7: its right side, heading screen right). The camera tracks with it (it stays a little left of
// centre, nose into the space ahead) while the tray's grid, two foam blocks on the far side of the tray and the blurred
// lab wall (slower: parallax) slide past. All six legs in the tripod gait as a pure function of distance (the same walk
// as B2: one continuous s), feet planted; antennae searching ahead; the injector pack seated and wired.
import React from 'react';
import {V3} from '../../../lib/v3';
import {sr} from '../../../lib/ease';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P, f2} from '../../roach/ortho';
import {LabWall2, Bench2, Box2D, LAB2} from '../../sets/Lab2';
import {Layer} from '../../dc/camera';
import {ShotProps} from '../index2';
import {Tray2D, BoxShadow, FPS} from './common';
import {bPose, bWalkS} from './B12';

const B3_AZ = 0, B3_EL = 10, B3_S = 9.2;
/** the body's x on the tray (the walk runs along +x from the origin) */
const bodyX = (t: number) => bPose(t).bodyFrame0.o[0];
export const b3View = (t: number): View => {
  // tracking: the camera rides with the insect; a slight ease ahead (it settles a few mm further on through the shot)
  const u = sr(t, 222 / FPS, 254 / FPS);
  return viewAt(B3_AZ, B3_EL, B3_S, [bodyX(t) + 6 - 4 * u, 12, 0], 500, 1060);
};
// props on the far side of the tray (world mm): foam blocks the walk passes
const BLOCKS: {b: [number, number, number, number, number, number]; c: string}[] = [
  {b: [10, 52, 0, 36, -150, -112], c: LAB2.foamB},
  {b: [96, 150, 0, 26, -138, -104], c: LAB2.foamY},
  {b: [-80, -40, 0, 30, -128, -96], c: LAB2.foamR},
];
export const B3: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS;
  const v = b3View(t);
  const pose = bPose(t);
  // the room beyond the bench: wall layer (slower), the bench's far edge, cabinets below the bench front
  const o = P(v, [0, 0, 0]);
  const benchFar = P(v, [0, 0, -260])[1];
  const benchNear = P(v, [0, 0, 260])[1];
  const cam = {x: 540 - (o[0] - 500) * 1, y: 960, z: 1};
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <filter id="b3-bl" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <rect x={-20} y={-20} width={1120} height={1960} fill={LAB2.wallBot} />
      <g filter="url(#b3-bl)">
        <Layer cam={cam} depth={3.2}>
          <g transform={`translate(-300 ${f2(benchFar - 1010 * 1.3)}) scale(1.3)`}>
            <LabWall2 id="b3w" />
          </g>
        </Layer>
      </g>
      <path d={`M-20,${f2(benchFar - 14)} H1100 V${f2(benchNear)} H-20 Z`} fill={LAB2.benchTop} />
      <Bench2 id="b3b" top={benchNear} k={1.3} />
      <Tray2D v={v} x0={-260} x1={320} z0={-170} z1={200} grid={20} bench={false} />
      {BLOCKS.map((k, i) => (
        <g key={i}>
          <BoxShadow id={`b3s${i}`} v={v} b={k.b} push={[16, 6]} alpha={0.12} />
          <Box2D id={`b3k${i}`} v={v} b={k.b} color={k.c} />
        </g>
      ))}
      <Roach2D pose={pose} v={v} o={{id: 'b3r', gear: <Gear2D id="b3g" v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
    </svg>
  );
};
export const B3_WALK = (ff: number) => bWalkS(ff / FPS);
void ({} as V3);
