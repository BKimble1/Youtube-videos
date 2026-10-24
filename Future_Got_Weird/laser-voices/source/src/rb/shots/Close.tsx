// The listener's close-up, used for the hook (0-1.0), his reaction to the silence (26.3-27.85) and the return of the
// voice (32.0-34.07). The hook and the return are one performance in loop time tau (tau = t - DUR before the seam), so
// the last frame flows into frame 0: he hears the voice come back, enjoys it, settles... and it starts again: his eyes
// snap toward it (frame 0 is mid-snap), his head whips round, nobody is there.
import React from 'react';
import {Layer} from '../lib/camera';
import {clamp, lerp} from '../lib/math';
import {spline} from '../lib/motion';
import {E_AMAZED, E_GRIN, E_LISTEN, E_LOST, E_PUZZLED, E_REST, E_STARTLE, Expr, mixExpr} from '../art/Face';
import {HAND_BRACE, HAND_POINT, HAND_RELAXED, mixHand} from '../art/Hand';
import {earOf, joints, Person, Pose} from '../art/Person';
import {Bokeh, LightCone} from '../art/Lab';
import {LISTENER, LISTENER_FIT} from '../cast';
import {DUR, T_BLOCK} from '../beats';
import {blinkAt, breath, ss} from './common';

const S = 1;
const BASE: Pose = {
  x: 520, y: 1500, s: S, yaw: 0.75, head: 0.3, lean: 2, chest: 2, nod: 0, roll: 0, shrug: 0,
  nU: -14, nV: 500, fU: 24, fV: 505, nElb: 1, fElb: 1, nWr: 6, fWr: 6,
  nAx: 540, nAy: 2400, fAx: 480, fAy: 2400,
};
const ROT = (deg: number) => (deg * Math.PI) / 180;
/** put the near hand at the ear: a cupped hand behind it (cup) or a fingertip on the tragus (tap) */
const handToEar = (p: Pose, w: number, kind: 'cup' | 'tap', wob = 0): Pose => {
  if (w <= 0.001) return p;
  const ear = earOf(p);
  const ha = kind === 'cup' ? -112 : -98 + wob;
  const L = 150 * p.s * 0.86;
  const tip = kind === 'cup' ? {x: ear.x + 16 * p.s, y: ear.y - 4 * p.s} : {x: ear.x - 6 * p.s, y: ear.y + 10 * p.s};
  return {...p, nW: w, nWx: tip.x - Math.cos(ROT(ha)) * L, nWy: tip.y - Math.sin(ROT(ha)) * L, nPoleU: -300, nPoleV: 140, nHandAng: ha};
};

/** the hook / return performance in loop time tau (-2.07 .. 1.0) */
export const loopPerf = (tau: number): {p: Pose; e: Expr; hand: typeof HAND_RELAXED; blink: number} => {
  const head = spline(tau, [
    [-2.1, 0.1],
    [-1.85, 0.5],
    [-1.3, 0.56],
    [-0.55, 0.5],
    [-0.15, 0.3, 'stop'],
    [0.0, 0.3],
    [0.2, -0.42, 'hit'],
    [0.32, -0.36],
    [0.62, 0.05],
    [0.85, 0.2],
    [1.05, 0.12],
  ]);
  const cup = ss(-1.95, -1.6, tau) * (1 - ss(-0.6, -0.25, tau));
  const shrug = 0.5 * Math.exp(-(((tau + 2.0) / 0.12) ** 2)) + 0.7 * Math.exp(-(((tau - 0.14) / 0.1) ** 2));
  const nod = spline(tau, [
    [-2.1, -4],
    [-1.5, 4],
    [-1.2, -1],
    [-0.9, 3],
    [-0.6, -1],
    [-0.15, 0],
    [0.15, -5],
    [0.5, 3],
    [1.05, 2],
  ]);
  const reach = ss(0.6, 1.0, tau); // the hand starting toward the ear as the shot cuts
  let p: Pose = {...BASE, head, nod, shrug, roll: 3 * Math.sin(tau * 1.3) - 3 * Math.exp(-(((tau - 0.2) / 0.15) ** 2)), breath: breath(tau + 34)};
  p = cup > 0.001 ? handToEar(p, cup, 'cup') : p;
  // expression
  const gxSnap = ss(-0.12, 0.0, tau); // frame 0 is mid-snap
  let e: Expr;
  if (tau < -0.15) {
    e = mixExpr({...E_STARTLE, gx: 0.6}, {...E_AMAZED, gx: 0.4}, ss(-2.0, -1.8, tau));
    e = mixExpr(e, {...E_GRIN, gx: 0.3, gy: -0.1}, ss(-1.75, -1.4, tau));
    e = mixExpr(e, {...E_LISTEN, smile: 0.45, gx: 0.2, lid: 0.3}, ss(-1.0, -0.6, tau));
    e = mixExpr(e, {...E_REST, gx: -0.1}, ss(-0.55, -0.2, tau));
  } else {
    e = mixExpr({...E_REST, gx: -0.1}, {...E_REST, browUp: 0.6, wide: 0.6, lid: 0.05, gx: 0.95}, gxSnap);
    e = mixExpr(e, {...E_STARTLE, gx: 0.9}, ss(0.0, 0.12, tau));
    e = mixExpr(e, {...E_PUZZLED, gx: -0.7, gy: 0.05, open: 0.12}, ss(0.4, 0.7, tau));
  }
  const hand = cup > 0.001 ? mixHand(HAND_RELAXED, {curl: [0.3, 0.32, 0.36, 0.4], spread: 0.15, thumb: 30, thumbCurl: 0.3}, cup) : HAND_RELAXED;
  void reach;
  void HAND_BRACE;
  void HAND_POINT;
  return {p, e, hand, blink: blinkAt(tau, [-1.15, -0.32])};
};

/** his reaction to the silence (26.3 .. 27.85) */
export const stopPerf = (t: number) => {
  const head = spline(t, [
    [26.2, -0.15],
    [26.45, -0.12],
    [26.6, 0.35, 'hit'],
    [26.85, 0.3],
    [27.0, -0.35],
    [27.3, -0.4],
    [27.6, -0.25],
    [27.9, -0.3],
  ]);
  const tap = ss(26.95, 27.15, t) * (1 - ss(27.6, 27.8, t));
  const wob = 8 * Math.sin((t - 27.1) * 22) * tap;
  let p: Pose = {...BASE, head, nod: lerp(-2, 4, ss(26.4, 26.6, t)), shrug: 0.3 * ss(26.3, 26.5, t), breath: breath(t)};
  p = handToEar(p, tap, 'tap', wob);
  let e = mixExpr({...E_LISTEN, smile: 0.45, gx: 0.3}, {...E_REST, browUp: 0.5, smile: 0, gx: 0.3, wide: 0.3}, ss(T_BLOCK, T_BLOCK + 0.15, t));
  e = mixExpr(e, {...E_LOST, gx: -0.8}, ss(26.5, 26.7, t));
  e = mixExpr(e, {...E_PUZZLED, gx: 0.8, cock: 0.9, open: 0.15}, ss(26.95, 27.2, t));
  return {p, e, hand: mixHand(HAND_RELAXED, HAND_POINT, tap), blink: blinkAt(t, [26.82])};
};

const camFor = (head: {x: number; y: number}, z: number) => ({x: head.x + 20, y: head.y + 120, z});

export const CloseShot: React.FC<{t: number; mode: 'loop' | 'stop'}> = ({t, mode}) => {
  const tau = mode === 'loop' ? (t > DUR / 2 ? t - DUR : t) : 0;
  const P = mode === 'loop' ? loopPerf(tau) : stopPerf(t);
  // the camera: a fixed head anchor (so the head moves inside the frame), a slow push across the seam
  const anchor = joints({...BASE}).head;
  const z = mode === 'loop' ? lerp(3.0, 3.25, clamp((tau + 2.07) / 3.07)) : lerp(2.9, 3.05, clamp((t - 26.3) / 1.55));
  const cam = camFor(anchor, z);
  return (
    <g>
      <Layer cam={cam} depth={2.6}>
        <Bokeh id={`cb${mode}`} t={t} ox={-200} oy={-200} warm={0.55} />
      </Layer>
      <Layer cam={cam} depth={1.6}>
        <LightCone id="cl" x={anchor.x - 40} top={-200} floor={2000} w0={60} w1={600} alpha={0.1} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Person id="cu" pose={P.p} look={LISTENER} fit={LISTENER_FIT} expr={P.e} blink={P.blink} nHand={P.hand} inkK={0.45} />
      </Layer>
    </g>
  );
};
