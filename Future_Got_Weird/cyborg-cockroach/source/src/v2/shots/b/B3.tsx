// B3 (222-254, "cockroach, then used"): the medic walking naturally over the white tray, seen in profile at insect
// height (az 0, el 7: its right side, heading screen right). The camera tracks with it (it stays a little left of
// centre, nose into the space ahead) while the tray's grid, two foam blocks on the far side of the tray and the blurred
// lab wall (slower: parallax) slide past. All six legs in the tripod gait as a pure function of distance (the same walk
// as B2: one continuous s), feet planted; antennae searching ahead; the injector pack seated and wired.
import React from 'react';
import {V3} from '../../../lib/v3';
import {sr, lerp} from '../../../lib/ease';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P, f2} from '../../roach/ortho';
import {LabWall2, Bench2, Box2D, LAB2} from '../../sets/Lab2';
import {Layer} from '../../dc/camera';
import {ShotProps} from '../index2';
import {Tray2D, FoamBox, LAB_BLOCKS, FPS} from './common';
import {bPose, bWalkS, b2View, packScreenAt} from './B12';

const B3_AZ = 0, B3_EL = 10, B3_S = 9.2;
/** the body's x on the tray (the walk runs along +x from the origin) */
const bodyX = (t: number) => bPose(t).bodyFrame0.o[0];
let b3Off: [number, number] | null = null;
export const b3View = (t: number): View => {
  // the cut from B2 keeps the pack where it was on screen; tracking: the camera rides with the insect, with a slight
  // ease ahead (it settles a few mm further on through the shot)
  if (!b3Off) {
    const a = packScreenAt(b2View(221 / FPS), 221 / FPS);
    const b = packScreenAt(viewAt(B3_AZ, B3_EL, B3_S, [bodyX(222 / FPS) + 6, 12, 0], 500, 1060), 222 / FPS);
    b3Off = [a[0] - b[0], Math.max(-120, Math.min(120, a[1] - b[1]))];
  }
  const u = sr(t, 222 / FPS, 254 / FPS);
    // (the camera leads a little: the insect settles left of centre, nose into the space ahead)
  return viewAt(B3_AZ, B3_EL, B3_S, [bodyX(t) + 6, 12, 0], lerp(500 + b3Off[0], 505, u), 1060 + b3Off[1]);
};
// props on the far side of the tray (world mm): foam blocks the walk passes
const BLOCKS = LAB_BLOCKS;
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
        <filter id={`b3-bl${f}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <rect x={-20} y={-20} width={1120} height={1960} fill={LAB2.wallBot} />
      <g filter={`url(#b3-bl${f})`}>
        <Layer cam={cam} depth={3.2}>
          <g transform={`translate(-300 ${f2(benchFar - 1010 * 1.3)}) scale(1.3)`}>
            <LabWall2 id={`b3w${f}`} />
          </g>
        </Layer>
      </g>
      <path d={`M-20,${f2(benchFar - 14)} H1100 V${f2(benchNear)} H-20 Z`} fill={LAB2.benchTop} />
      <Bench2 id={`b3b${f}`} top={benchNear} k={1.3} />
      <Tray2D v={v} x0={-260} x1={320} z0={-170} z1={200} grid={20} bench={false} />
      {BLOCKS.map((k, i) => (
        <FoamBox key={i} id={`b3k${f}_${i}`} v={v} b={k.b} color={k.c} />
      ))}
      <Roach2D pose={pose} v={v} o={{id: `b3r${f}`, gear: <Gear2D id={`b3g${f}`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
    </svg>
  );
};
export const B3_WALK = (ff: number) => bWalkS(ff / FPS);
void ({} as V3);
