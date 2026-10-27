// B2 (187-208, "launcher onto a"): NEW. A tight side view (profile from the insect's right, az 0, el 8) of the module
// just fitted in B1, on the same mat, a moment later (the hands have lifted out of frame). It opens on the mounting:
// the saddle and the green board seated on the shell, the two tube clamps, the stimulation wires running down the
// shield to the antenna base and back to the cercus, the rear of the clear launch tube with its compressed spring. The
// insect breathes, its antennae search, its legs are planted; then it takes its first step (B_GO) and the camera tracks
// forward with it, a little faster than it walks, along the tube: the spring, the loaded auto-injector (amber dose,
// grey plunger), the collar, the latch line through the mouth with its nichrome coil, and the needle just behind the
// mouth, over the head. One lateral move, still travelling at the cut.
import React from 'react';
import {sr} from '../../../lib/ease';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P, f2} from '../../roach/ortho';
import {LabWall2, LAB2} from '../../sets/Lab2';
import {Layer} from '../../dc/camera';
import {ShotProps} from '../index2';
import {Mat2D, FPS} from './common';
import {bPose} from './B1';

const B2_AZ = 0, B2_EL = 8, B2_S = 25;
/** the body's x (path frame: the gait's bob never moves the camera) */
const bodyX = (t: number) => bPose(t).bodyFrame0.o[0];
/** the track: from over the saddle's rear to the tube's mouth (body x, mm), starting with the first step; still
 *  moving at the cut */
export const b2Look = (f: number) => -6 + 32 * sr(f, 188, 216);
export const b2View = (f: number): View => viewAt(B2_AZ, B2_EL, B2_S, [bodyX(f / FPS) + b2Look(f), 14, 0], 540, 960);

export const B2: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS;
  const id = `b2f${f}`;
  const v = b2View(f);
  const pose = bPose(t);
  const cx = bodyX(t) + b2Look(f);
  // the room beyond the mat: the wall (blurred, slower: parallax), the bench top between
  const o = P(v, [0, 0, 0]);
  const cam = {x: 540 - (o[0] - 540), y: 960, z: 1};
  const benchFar = P(v, [0, 0, -260])[1];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <rect x={-20} y={-20} width={1120} height={1960} fill={LAB2.wallBot} />
      <g filter={`url(#${id}-bl)`}>
        <Layer cam={cam} depth={4}>
          <g transform={`translate(-500 ${f2(benchFar - 1010 * 1.6)}) scale(1.6)`}>
            <LabWall2 id={`${id}w`} />
          </g>
        </Layer>
        <path d={`M-20,${f2(benchFar - 30)} H1100 V1960 H-20 Z`} fill={LAB2.benchTop} />
      </g>
      <Mat2D v={v} x0={-190} x1={260} z0={-200} z1={190} bench={false} vis={[cx - 30, cx + 30]} />
      <Roach2D pose={pose} v={v} o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
    </svg>
  );
};
