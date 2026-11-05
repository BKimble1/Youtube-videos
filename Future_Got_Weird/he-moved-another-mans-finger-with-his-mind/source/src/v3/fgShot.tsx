// V2 F + G: cameras and shot helpers on the shared BrainNet world (fgWorld.tsx).
import React from 'react';
import {clamp, fmt} from '../dc/math';
import {K, Tag} from '../art/kit';
import {CamS, camKeys} from './core2';
import {FPS} from '../lib/core';
import {CW, CH, PF} from '../art/s6world';
import {FGState, FGWorld, MON, Pillar, RecvBack, RecvGaze, scrPt} from './fgWorld';

const R = MON.R;
const scrC = (m: {x: number; y: number; s: number}) => ({x: m.x, y: m.y - 310 * m.s});
/** the falling piece's 3 x 2 box (row 1, col 3) at 4.1667 px per screen unit: exactly PAD_RECT (x 760..1160, y 380..640) */
const MATCH = (() => {
  const z = 400 / (3 * CW * R.s);
  const c = scrPt(R, PF.x + 4.5 * CW, PF.y + 2 * CH);
  return {x: c.x, y: c.y + 30 / z, z};
})();
export const CAMS = {
  MATCH,
  RMON: {x: R.x, y: 700, z: 1.75},
  RMON2: {x: R.x - 6, y: 694, z: 1.86},
  RFULL: {...scrC(R), z: 2.7 / R.s},
  AFULL: {...scrC(MON.A), z: 2.7 / MON.A.s},
  OTS: {x: 3650, y: 1010, z: 0.95},
  OTS2: {x: 3672, y: 1000, z: 1.02},
  OTS3: {x: 3664, y: 1004, z: 1.07},
  SENW: {x: 1300, y: 1060, z: 0.5},
  SENW2: {x: 1275, y: 1052, z: 0.54},
  HUB: {x: 1650, y: 1050, z: 0.62},
  HUBWIN: {x: 2230, y: 900, z: 1.3},
  HEADBACK: {x: 3545, y: 1238, z: 2.0},
  HEADBACK_B: {x: 3538, y: 1232, z: 2.12},
  HEADBACK2: {x: 3410, y: 1105, z: 1.42},
  POV: {x: R.x, y: 700, z: 1.6},
  POV2: {x: R.x, y: 704, z: 1.7},
  BFACE: {x: 640, y: 1530, z: 1.25},
  HUBWIN2: {x: 2250, y: 885, z: 1.85},
  HUBWIN3: {x: 2262, y: 890, z: 1.95},
};
export type CK = [number, CamS, ((x: number) => number)?];
export const camAt = (t: number, ks: CK[]) => camKeys(t * FPS, ks);
export const camT = (c: CamS, ax = 960, ay = 540) => `translate(${fmt(ax)} ${fmt(ay)}) scale(${fmt(c.z)}) translate(${fmt(-c.x)} ${fmt(-c.y)})`;
/** a near layer (depth d) that coincides with the world at camera `ref` */
export const nearT = (c: CamS, d: number, ref: CamS, ax = 960, ay = 540) =>
  `translate(${fmt(ax)} ${fmt(ay)}) scale(${fmt(Math.pow(c.z, d))}) translate(${fmt(-c.x * d)} ${fmt(-c.y * d)}) translate(${fmt(d * ref.x)} ${fmt(d * ref.y)}) scale(${fmt(Math.pow(ref.z, 1 - d))}) translate(${fmt(-ref.x)} ${fmt(-ref.y)})`;
export const toScr = (c: CamS, p: {x: number; y: number}, ax = 960, ay = 540) => ({x: ax + (p.x - c.x) * c.z, y: ay + (p.y - c.y) * c.z});

/** The Receiver's head as a near layer: d 1 = in the world; d > 1 sweeps past (the push-through transitions). */
export const HeadLayer: React.FC<{id: string; st: FGState; cam: CamS; d: number; ref: CamS; op: number; ax?: number; ay?: number}> = ({id, st, cam, d, ref, op, ax, ay}) =>
  op <= 0.001 ? null : (
    <g transform={nearT(cam, d, ref, ax, ay)} opacity={op}>
      <RecvBack id={id} coilK={st.coilK} pulse={st.pulse} brain={st.brain} look={st.look} tilt={st.tilt} />
      <RecvGaze g={st.gaze.R} look={st.look} />
    </g>
  );

/** the world under a camera, with the Receiver's head layer and the foreground wall pillars */
export const WorldView: React.FC<{id: string; st: FGState; f: number; cam: CamS; head?: {d: number; ref: CamS; op: number}; ax?: number; ay?: number; pillars?: boolean}> = ({
  id, st, f, cam, head = {d: 1, ref: CAMS.OTS, op: 1}, ax = 960, ay = 540, pillars = true,
}) => (
  <g>
    <g transform={camT(cam, ax, ay)}>
      <FGWorld id={id} st={st} f={f} />
    </g>
    <HeadLayer id={`${id}hb`} st={st} cam={cam} d={head.d} ref={head.ref} op={head.op} ax={ax} ay={ay} />
    {pillars && (
      <g transform={nearT(cam, 1.6, CAMS.SENW, ax, ay)}>
        <Pillar x={1750} />
        <Pillar x={2750} />
      </g>
    )}
  </g>
);

/** a screen-space tag pinned to a world point */
export const WTag: React.FC<{cam: CamS; p: {x: number; y: number}; text: string; k: number; fill?: string; color?: string; size?: number; dy?: number; ax?: number; ay?: number}> = ({
  cam, p, text, k, fill, color, size = 32, dy = 0, ax, ay,
}) => {
  if (k <= 0.001) return null;
  const s = toScr(cam, p, ax, ay);
  return <Tag x={s.x} y={Math.min(860, s.y + dy)} text={text} k={k} fill={fill} color={color} size={size} />;
};

/** the Receiver's point of view: a soft purple vignette at the edges of their vision */
export const POVVignette: React.FC<{id: string; k: number}> = ({id, k}) =>
  k <= 0.001 ? null : (
    <g opacity={clamp(k)}>
      <defs>
        <radialGradient id={`${id}-pov`} cx="0.5" cy="0.47" r="0.78">
          <stop offset="0.58" stopColor={K.receiver} stopOpacity={0} />
          <stop offset="1" stopColor={K.receiver} stopOpacity={0.6} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill={`url(#${id}-pov)`} />
    </g>
  );
