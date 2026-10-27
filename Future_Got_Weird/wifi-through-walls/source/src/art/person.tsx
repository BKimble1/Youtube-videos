// Characters as cutout cards in the sets' perspective space. The Weird Crew's guesser (Death Clock rig, dc/Man.tsx) is
// drawn in his own rig units (y down, hip at pose.x/y, facing screen-left in 3/4); a card places the rig's local origin
// (the floor under him, y = 0) at a projected world point and scales it to the px-per-metre of that depth.
import React from 'react';
import {Man, ManPose, manJoints, Outfit, GUESSER} from '../dc/Man';
import {Expr, EXPR_NEUTRAL} from '../dc/Head';
import {HandPose, HAND_RELAXED} from '../dc/Hand';
import {B, proj, scaleAt, V3} from '../world/cam';
import {PAL} from '../dc/color';

/** rig units per metre (the guesser stands about 1.78 m) */
export const U = 600;
/** ankle to sole (rig units at s = 1) */
export const SOLE = 27;

export const BASE: ManPose = {
  x: 0, y: -520, s: 1, torso: 2, chest: 2, neck: -2, turn: 0.5, pelvis: 0,
  lTu: -330, lTv: -20, lWx: 0, lWy: 0, lW: 0, lElb: 1, lWr: 0,
  rTu: -325, rTv: 30, rWx: 0, rWy: 0, rW: 0, rElb: 1, rWr: 0,
  lHip: 4, lKnee: 4, lAnk: 0, rHip: -4, rKnee: 4, rAnk: 0, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.3,
  lFa: 1, rFa: 1, lAx: 0, lAy: 0, lA: 0, rAx: 0, rAy: 0, rA: 0,
};
export const pose = (o: Partial<ManPose>): ManPose => ({...BASE, ...o});

/** the pose with its hips lifted or lowered so the lower sole touches the floor (y = 0), unless feet are planted */
export const ground = (p: ManPose): ManPose => {
  const j = manJoints({...p, x: 0, y: 0});
  const low = Math.max(j.lLeg.A.y, j.rLeg.A.y) + SOLE * p.s;
  return {...p, y: -low};
};
/** feet planted at local x positions on the floor (IK to the ankles), weight w */
export const plant = (p: ManPose, lx: number, rx: number, w = 1): ManPose => ({...p, lAx: lx, lAy: -SOLE * p.s, lA: w, rAx: rx, rAy: -SOLE * p.s, rA: w});

export type Card = {x: number; y: number; k: number; depth: number};
export const cardAt = (b: B, ground3: V3, sizeScale = 1): Card => {
  const p = proj(b, ground3);
  return {x: p.x, y: p.y, k: (scaleAt(b, ground3) / U) * sizeScale, depth: p.z};
};
/** a rig-local point (units) to screen through a card */
export const cardPt = (cd: Card, p: {x: number; y: number}, flip = false) => ({x: cd.x + cd.k * (flip ? -p.x : p.x), y: cd.y + cd.k * p.y});

export type Look = {
  outfit?: Outfit;
  expr?: Expr;
  blink?: number;
  lHand?: HandPose;
  rHand?: HandPose;
  hairSway?: number;
};
export const Person: React.FC<{id: string; cd: Card; p: ManPose; look?: Look; flip?: boolean; opacity?: number; children?: React.ReactNode; overAll?: React.ReactNode; farBehind?: boolean; nearPalm?: boolean}> = ({id, cd, p, look = {}, flip, opacity, children, overAll, farBehind, nearPalm}) => cd.depth < 0.25 ? null : (
  <g transform={`translate(${cd.x.toFixed(2)} ${cd.y.toFixed(2)}) scale(${(cd.k * (flip ? -1 : 1)).toFixed(5)} ${cd.k.toFixed(5)})`} opacity={opacity}>
    <Man id={id} pose={p} expr={look.expr ?? EXPR_NEUTRAL} blink={look.blink ?? 0} lHand={look.lHand ?? HAND_RELAXED} rHand={look.rHand ?? HAND_RELAXED} outfit={look.outfit ?? GUESSER} hairSway={look.hairSway ?? 0} overAll={overAll} farBehind={farBehind} nearPalm={nearPalm}>
      {children}
    </Man>
  </g>
);
/** a soft contact shadow under a card */
export const FloorShadow: React.FC<{cd: Card; w?: number; x?: number; alpha?: number}> = ({cd, w = 260, x = 0, alpha = 0.22}) => cd.depth < 0.25 ? null : (
  <ellipse cx={cd.x + cd.k * x} cy={cd.y - 4 * cd.k} rx={w * cd.k} ry={w * 0.16 * cd.k} fill={PAL.ink} opacity={alpha} />
);
export {GUESSER};

type K<T> = [number, T, ((x: number) => number)?];
const s3 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** keyed track for any blendable value (each key's easing applies to the segment ending at it) */
export const keyed = <T,>(t: number, keys: K<T>[], mixf: (a: T, b: T, u: number) => T): T => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, a] = keys[i - 1], [t1, b, e] = keys[i];
      return mixf(a, b, (e ?? s3)((t - t0) / (t1 - t0 || 1)));
    }
  }
  return keys[keys.length - 1][1];
};
