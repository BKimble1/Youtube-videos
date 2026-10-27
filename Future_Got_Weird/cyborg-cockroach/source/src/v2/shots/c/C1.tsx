// C1 (315-340, "A second cockroach"): the two configurations side by side, close and low (front three-quarter, el 13,
// at insect height on the tray). Nearest, lower left and big: the OBSERVER (lighter shell, dark camera module with its
// round blue lens looking forward, a short aerial). Just behind it, to the right and a little ahead: the MEDIC (clear
// launch tube with the spring, the amber dose and the needle, latch line and coil). Both walk slowly toward the
// viewer's right in a tripod gait, antennae searching, over out-of-focus course blocks. 2.5D: each insect is drawn through its own view, the far one
// smaller and higher; the camera follows the pair a little (pan at part of their pace; the far one drifts less).
import React from 'react';
import {sr} from '../../../lib/ease';
import {poseRoach, straightPath, RoachPose} from '../../../rig/roach';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View, f2} from '../../roach/ortho';
import {LAB2} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {OBS_TINT} from './C2';
import {Beyond2D} from './tray';

export const C1_FROM = 315, C1_TO = 341;
const T0 = C1_FROM / 30;
const OBS_V = 34, MED_V = 31;
export const c1Obs = (f: number): RoachPose => {
  const t = f / 30;
  return poseRoach({path: straightPath([0, 0, 0], 0), s: 20 + OBS_V * (t - T0), t, seed: 4, search: 0.85, antL: {yaw: 0.8, pitch: 0.36, curl: 0.85}, antR: {yaw: 0.8, pitch: 0.36, curl: 0.85}});
};
export const c1Medic = (f: number): RoachPose => {
  const t = f / 30;
  return poseRoach({path: straightPath([0, 0, 0], 0), s: 9 + MED_V * (t - T0), t, seed: 1, search: 0.8, antL: {yaw: 0.72, pitch: 0.28}, antR: {yaw: 0.72, pitch: 0.28}});
};
export const C1_AZ = 63, C1_EL = 13;
/** near (observer) and far (medic) scales, px per mm */
const S_NEAR = 10.6, S_FAR = 8.2;
/** the follow: a pan (scene px at the near plane) of part of the observer's screen travel, eased in and out */
const pan = (f: number) => -120 * sr(f, C1_FROM - 4, C1_TO + 4);
export const c1Views = (f: number): {near: View; far: View} => {
  const p = pan(f);
  return {
    near: viewAt(C1_AZ, C1_EL, S_NEAR, [0, 0, 0], 360 + p, 1480),
    far: viewAt(C1_AZ, C1_EL, S_FAR, [0, 0, 0], 690 + (p * S_FAR) / S_NEAR, 1060),
  };
};

/** out-of-focus course blocks far behind (scene px) */
const FAR_BLOCKS: {x: number; y: number; w: number; h: number; c: string}[] = [
  {x: 60, y: 650, w: 150, h: 120, c: LAB2.foamB},
  {x: 840, y: 610, w: 210, h: 170, c: LAB2.foamY},
  {x: 1040, y: 690, w: 120, h: 90, c: LAB2.foamR},
];

export const C1Scene: React.FC<{f: number; id: string}> = ({f, id}) => {
  const {near, far} = c1Views(f);
  const med = c1Medic(f), obs = c1Obs(f);
  const p = pan(f);
  const lipY = 780;
  const fb = (x: number) => x + p * 0.3;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <defs>
        <filter id={`${id}-bl`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <linearGradient id={`${id}-fl`} x1="0" y1={lipY} x2="0" y2="1920" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#D3DEE3" />
          <stop offset="0.25" stopColor={LAB2.surface} />
          <stop offset="1" stopColor="#F4F7F8" />
        </linearGradient>
      </defs>
      <Beyond2D id={`${id}-lb`} lipY={lipY} k={1.2} dx={p * 0.2} blur={10} bench={70} />
      <rect x={-20} y={lipY} width={1120} height={1940 - lipY} fill={`url(#${id}-fl)`} />
      <path d={`M-20,${lipY} H1100`} stroke="#FFFFFF" strokeWidth={2} opacity={0.6} />
      <g filter={`url(#${id}-bl)`}>
        {FAR_BLOCKS.map((b, i) => (
          <g key={i}>
            <rect x={f2(fb(b.x) - b.w / 2)} y={f2(b.y - b.h)} width={b.w} height={b.h} fill={b.c} />
            <rect x={f2(fb(b.x) - b.w / 2)} y={f2(b.y - b.h)} width={b.w} height={f2(b.h * 0.22)} fill="#FFFFFF" opacity={0.25} />
            <ellipse cx={f2(fb(b.x))} cy={b.y + 4} rx={b.w * 0.6} ry={8} fill="#1A1612" opacity={0.12} />
          </g>
        ))}
      </g>
      <Roach2D pose={med} v={far} o={{id: `${id}-m`, gear: <Gear2D id={`${id}-mg`} v={far} f={med.frame} g={{kind: 'injector'}} />}} />
      <Roach2D pose={obs} v={near} o={{id: `${id}-o`, tint: OBS_TINT, gear: <Gear2D id={`${id}-og`} v={near} f={obs.frame} g={{kind: 'camera'}} />}} />
    </svg>
  );
};

export const C1: React.FC<ShotProps> = ({f}) => <C1Scene f={f} id={`c1-${f}`} />;
