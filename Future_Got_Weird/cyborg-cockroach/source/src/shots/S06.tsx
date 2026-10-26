// S06 (9.10-10.50 s) "to steer it." Overhead on the obstacle course: the same medic insect (injector loaded and
// latched) comes up-screen toward a yellow foam block. The veer to the RIGHT that the first pulse started at the end of
// S04 is under way; a second short pulse runs down the left antenna wire (~9.3 s), the left electrode glows, the left
// antenna flicks, and the insect swings round in front of the block and clears its corner, leaving heading screen-RIGHT
// (into S07). The camera, high and tilted a little, makes one small eased drift with the turn.
import React from 'react';
import {Cam, lookAt, proj, depth, scaleAt} from '../lib/cam';
import {V3, V2, add, mul, toW} from '../lib/v3';
import {fmt, polyPath, projPoly} from '../lib/g3';
import {sr, lerp} from '../lib/ease';
import {Roach} from '../rig/Roach';
import {Gear, GEAR_COL, alongPolyline} from '../rig/Gear';
import {wires} from '../rig/gear';
import {ArenaFloor, Foam, Solid, LAB} from '../sets/Lab';
import {INK} from '../lib/ink';
import {ShotProps} from './index';
import {FPS} from '../timeline';
import {medicPose, medicGear, PULSE1, PULSE2, pulseTrain, zapOf} from './S04';

const T0 = 273 / FPS, T1 = 315 / FPS;
/** the course: foam blocks (centre, half sizes, colour, yaw) and the clear acrylic course edge */
export const S06_BLOCKS: {c: V3; h: V3; color: string; yaw?: number}[] = [
  {c: [-95, 13, -2], h: [23, 13, 43], color: LAB.foam}, // directly in the insect's path
  {c: [-196, 15, -108], h: [26, 15, 30], color: LAB.foamB, yaw: 0.12},
  {c: [-238, 12, 52], h: [40, 12, 24], color: LAB.foam, yaw: 0.05},
];
const EDGE = {c: [-60, 18, 86] as V3, h: [320, 18, 1.6] as V3}; // acrylic course edge along the left of frame

// camera: high above, tilted forward a little (eye behind the insect's start, +x) and turned a touch off the grid
const DEG = Math.PI / 180;
const camAt = (t: number): Cam => {
  const u = sr(t, T0, T1);
  const tgt: V3 = [lerp(-26, -34, u), 0, lerp(-10, -26, u)];
  const el = 70 * DEG, az = 8 * DEG, D = 420;
  // eye direction: mostly up, leaning toward +x (behind the insect) and rotated about y by az
  const back: V3 = [Math.cos(az), 0, Math.sin(az)];
  const eye = add(tgt, add(mul(back, D * Math.cos(el)), [0, D * Math.sin(el), 0]));
  return lookAt(eye, tgt, 2000, 540, 820);
};
export const s06Cam = camAt;

/** soft contact shadow of a box on the mat: its footprint grown a little, nudged away from the upper-left key light */
const BoxShadow: React.FC<{id: string; cam: Cam; c: V3; h: V3; yaw?: number}> = ({id, cam, c, h, yaw = 0}) => {
  const cs = Math.cos(yaw), sn = Math.sin(yaw);
  const g = 3.5;
  const pts: V3[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
    const lx = a * (h[0] + g), lz = b * (h[2] + g);
    return [c[0] + lx * cs + lz * sn + 3, 0.05, c[2] - lx * sn + lz * cs - 3] as V3;
  });
  const q = projPoly(cam, pts);
  if (!q) return null;
  return (
    <g>
      <defs>
        <filter id={`${id}-f`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={7} />
        </filter>
      </defs>
      <path d={polyPath(q)} fill="#1C2A24" opacity={0.28} filter={`url(#${id}-f)`} />
    </g>
  );
};

/** the clear acrylic course edge: a thin wall drawn as tinted glass with a bright top edge */
const Acrylic: React.FC<{cam: Cam}> = ({cam}) => {
  const {c, h} = EDGE;
  const top = projPoly(cam, [[c[0] - h[0], 2 * h[1], c[2] - h[2]], [c[0] + h[0], 2 * h[1], c[2] - h[2]], [c[0] + h[0], 2 * h[1], c[2] + h[2]], [c[0] - h[0], 2 * h[1], c[2] + h[2]]]);
  const face = projPoly(cam, [[c[0] - h[0], 0, c[2] - h[2]], [c[0] + h[0], 0, c[2] - h[2]], [c[0] + h[0], 2 * h[1], c[2] - h[2]], [c[0] - h[0], 2 * h[1], c[2] - h[2]]]);
  const foot = projPoly(cam, [[c[0] - h[0], 0.05, c[2] - h[2] - 4], [c[0] + h[0], 0.05, c[2] - h[2] - 4], [c[0] + h[0], 0.05, c[2] + h[2]], [c[0] - h[0], 0.05, c[2] + h[2]]]);
  return (
    <g>
      {foot && <path d={polyPath(foot)} fill="#9FB3BF" opacity={0.25} />}
      {face && <path d={polyPath(face)} fill="#DCEFF6" opacity={0.3} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />}
      {top && <path d={polyPath(top)} fill="#F4FBFD" opacity={0.85} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />}
    </g>
  );
};

/** from above the wire pulses and the electrode glow are tiny at this scale: a readable (still subtle) version on top */
export const PulseMarks: React.FC<{id: string; cam: Cam; f: ReturnType<typeof medicPose>['pose']['frame']; pulses: number[]; zap: number; k?: number}> = ({id, cam, f, pulses, zap, k = 1}) => {
  const W = wires(f).antL;
  const e = proj(cam, W[W.length - 1]);
  const sc = scaleAt(cam, W[W.length - 1]);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-z`}>
          <stop offset="0" stopColor={GEAR_COL.pulse} stopOpacity={0.95} />
          <stop offset="0.35" stopColor={GEAR_COL.pulse} stopOpacity={0.5} />
          <stop offset="1" stopColor={GEAR_COL.pulse} stopOpacity={0} />
        </radialGradient>
      </defs>
      {pulses.map((t, i) => {
        const q = proj(cam, alongPolyline(W, t));
        return (
          <g key={i}>
            <circle cx={fmt(q[0])} cy={fmt(q[1])} r={fmt(2.6 * sc * k)} fill={GEAR_COL.pulse} opacity={0.4} />
            <circle cx={fmt(q[0])} cy={fmt(q[1])} r={fmt(1.1 * sc * k)} fill="#FFFFFF" />
          </g>
        );
      })}
      {zap > 0.01 && <circle cx={fmt(e[0])} cy={fmt(e[1])} r={fmt(11 * sc * k * (0.7 + 0.3 * zap))} fill={`url(#${id}-z)`} opacity={zap} />}
      {zap > 0.01 && <circle cx={fmt(e[0])} cy={fmt(e[1])} r={fmt(1.5 * sc * k)} fill="#FFFFFF" opacity={zap} />}
    </g>
  );
};

export const S06: React.FC<ShotProps & {k?: string}> = ({f, k = ''}) => {
  const t = f / FPS;
  const cam = camAt(t);
  const {pose} = medicPose(t);
  const g = medicGear(t);
  const id = `s06${k}`;
  const pulses = [...pulseTrain(t, PULSE1), ...pulseTrain(t, PULSE2)];
  const zap = Math.max(zapOf(t, PULSE1), zapOf(t, PULSE2));
  const items: {z: number; el: React.ReactNode}[] = S06_BLOCKS.map((b, i) => ({
    z: depth(cam, [b.c[0], b.c[1] * 2, b.c[2]]),
    el: <Foam key={`b${i}`} cam={cam} c={b.c} h={b.h} color={b.color} yaw={b.yaw} />,
  }));
  items.push({
    z: depth(cam, add(pose.frame.o, [0, 22, 0])),
    el: (
      <g key="roach">
        <Roach pose={pose} cam={cam} o={{id: `${id}r`, gear: <Gear id={`${id}g`} cam={cam} f={pose.frame} g={g} />}} />
        <PulseMarks id={`${id}p`} cam={cam} f={pose.frame} pulses={pulses} zap={zap} />
      </g>
    ),
  });
  items.push({z: depth(cam, [EDGE.c[0], EDGE.h[1], EDGE.c[2]]), el: <Acrylic key="edge" cam={cam} />});
  items.sort((a, b) => b.z - a.z);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <rect x={0} y={0} width={1080} height={1920} fill={LAB.matDeep} />
      <ArenaFloor id={`${id}f`} cam={cam} x0={-520} x1={420} z0={-360} z1={320} fade={2400} />
      {S06_BLOCKS.map((b, i) => (
        <BoxShadow key={i} id={`${id}bs${i}`} cam={cam} c={b.c} h={b.h} yaw={b.yaw} />
      ))}
      {items.map((it) => it.el)}
    </svg>
  );
};
