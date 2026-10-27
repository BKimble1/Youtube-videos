// B3 (209-242, "living cockroach,"): a new test, a new surface: the medic (loaded) walking across a cork test board,
// seen low from the side (az 10: a touch in front of its right side; el 9), the camera tracking alongside at its pace.
// The cork's granules are drawn flat on the ground, so they slide past under the feet and show the motion; the board's
// far edge, the bench and the blurred lab wall (slower: parallax) sit behind. All six legs in the tripod gait as a pure
// function of distance (feet planted, the tarsi on the grain), antennae searching ahead, breathing.
import React from 'react';
import {poseRoach, straightPath, RoachPose} from '../../../rig/roach';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, P, f2} from '../../roach/ortho';
import {LabWall2, LAB2} from '../../sets/Lab2';
import {Layer} from '../../dc/camera';
import {ShotProps} from '../index2';
import {Cork2D, FPS} from './common';

export const B3_SPEED = 40;
const T3 = 209 / FPS;
const PATH3 = straightPath([0, 0, 0], 0);
/** distance walked (mm): already walking at the cut */
export const b3S = (t: number) => 20 + B3_SPEED * (t - T3);
export const b3Pose = (t: number): RoachPose =>
  poseRoach({path: PATH3, s: b3S(t), t, search: 0.7, seed: 5, antL: {yaw: 0.5, pitch: 0.2, curl: 0.85}, antR: {yaw: 0.5, pitch: 0.2, curl: 0.85}});

const B3_AZ = 10, B3_EL = 9, B3_S = 10.5;
/** tracking: the camera rides with the insect (its nose a little into the space ahead) */
export const b3View = (t: number): View => viewAt(B3_AZ, B3_EL, B3_S, [b3S(t) - 2, 12, 0], 520, 1100);

export const B3: React.FC<ShotProps> = ({f}) => {
  const t = f / FPS;
  const id = `b3f${f}`;
  const v = b3View(t);
  const pose = b3Pose(t);
  const cx = b3S(t);
  const o = P(v, [0, 0, 0]);
  const cam = {x: 540 - (o[0] - 540), y: 960, z: 1};
  const boardFar = P(v, [cx, 0, -150])[1];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <rect x={-20} y={-20} width={1120} height={1960} fill={LAB2.wallBot} />
      <g filter={`url(#${id}-bl)`}>
        <Layer cam={cam} depth={3.2}>
          <g transform={`translate(-300 ${f2(boardFar - 150 - 1010 * 1.3)}) scale(1.3)`}>
            <LabWall2 id={`${id}w`} />
          </g>
        </Layer>
        <path d={`M-20,${f2(boardFar - 150)} H1100 V1960 H-20 Z`} fill={LAB2.benchTop} />
      </g>
      <Cork2D v={v} x0={-400} x1={900} z0={-150} z1={640} cell={6} />
      <Roach2D pose={pose} v={v} o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={{kind: 'injector'}} />}} />
    </svg>
  );
};
