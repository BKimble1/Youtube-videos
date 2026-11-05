// V3 D/E cast helpers (builder of D and E only). The people are the crew3 rig (real cartoon hands); this file adds
// world-space hand targets with lean compensation, seated / standing staging (body behind a desk, arms in front),
// eased keyed values and 2D paths with arcs, and the involuntary TMS jerk vs voluntary motion.
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, lerp} from '../dc/math';
import {FPS} from './core2';
import {Arm, CrewChar, HandShape, HAND_REST, IDLE, Look, Pose, reachLocal} from './crew3';
import {K} from '../art/kit';

export type Pt = {x: number; y: number};
type Ch = {x: number; y: number; scale: number; lean?: number; bob?: number};
const R = Math.PI / 180;

/** two-bone IK in world space for a crew3 character (front view), undoing the body lean (pivot at local (0,-150)) */
export const armTo = (ch: Ch, side: -1 | 1, w: Pt, elbow?: 1 | -1): Arm => {
  const lx0 = (w.x - ch.x) / ch.scale, ly0 = (w.y - ch.y) / ch.scale - (ch.bob ?? 0);
  const th = (ch.lean ?? 0) * R;
  const dx = lx0, dy = ly0 + 150;
  const lx = dx * Math.cos(th) + dy * Math.sin(th);
  const ly = -dx * Math.sin(th) + dy * Math.cos(th) - 150;
  if (elbow) return reachLocal(lx, ly, side, elbow);
  // default: the elbow that sits further out from the body (natural for hands on a desk, a face, a coil)
  const p = reachLocal(lx, ly, side, 1), q = reachLocal(lx, ly, side, -1);
  return Math.sin((p.a * Math.PI) / 180) >= Math.sin((q.a * Math.PI) / 180) ? p : q;
};
/** a local rig point (e.g. the head centre (0,-372)) in world space under lean and bob */
export const rigWorld = (ch: Ch, p: Pt): Pt => {
  const th = (ch.lean ?? 0) * R;
  const dx = p.x, dy = p.y + 150;
  const rx = dx * Math.cos(th) - dy * Math.sin(th), ry = dx * Math.sin(th) + dy * Math.cos(th) - 150;
  return {x: ch.x + rx * ch.scale, y: ch.y + (ry + (ch.bob ?? 0)) * ch.scale};
};
export const HEAD_L = {x: 0, y: -372};
export const MOUTH_L = {x: 0, y: -340};

export type Perf = {
  pose: Partial<Pose>;
  /** frame-left hand (the person's RIGHT hand in this front view) and frame-right hand, world targets */
  hl: Pt;
  hr: Pt;
  sl?: HandShape;
  sr?: HandShape;
  el?: 1 | -1;
  er?: 1 | -1;
};

/** A crew3 person in front view: chair/back layer, body, a desk drawn over the body, then both arms in front. */
export const Person3: React.FC<{
  id: string; look: Look; f: number; x: number; y: number; scale: number; seed?: number; perf: Perf;
  gear?: React.ReactNode; behind?: React.ReactNode; desk?: React.ReactNode; life?: number; shadow?: boolean; front?: React.ReactNode;
}> = ({id, look, f, x, y, scale, seed = 1, perf, gear, behind, desk, life = 0.35, shadow = false, front}) => {
  const lean = perf.pose.lean ?? 0, bob = perf.pose.bob ?? 0;
  const ch = {x, y, scale, lean, bob};
  const armL = armTo(ch, -1, perf.hl, perf.el);
  const armR = armTo(ch, 1, perf.hr, perf.er);
  const pose: Pose = {...IDLE, ...perf.pose, armL, armR, handL: perf.sl ?? HAND_REST, handR: perf.sr ?? HAND_REST};
  const common = {look, pose, frame: f, seed, x, y, scale, life, headGear: gear, id, shadow};
  return (
    <g>
      {behind}
      <CrewChar {...common} front="L" pass="body" />
      {desk}
      {front}
      <CrewChar {...common} front="L" pass="frontArm" />
      <CrewChar {...common} front="R" pass="frontArm" />
    </g>
  );
};

// ---------------------------------------------------------------- keyed motion
type Ease = (t: number) => number;
/** keyed number: [time s, value, ease into this key?][] */
export const kv = (t: number, ks: [number, number, Ease?][]): number => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, va] = ks[i];
    const [b, vb, e] = ks[i + 1];
    if (t <= b) return lerp(va, vb, (e ?? easeInOut)(clamp((t - a) / (b - a || 1e-6))));
  }
  return ks[ks.length - 1][1];
};
/** keyed point with an arc: [time, point, arc (perpendicular bulge, units; + bulges to the left of travel), ease?] */
export const kp = (t: number, ks: [number, Pt, number?, Ease?][]): Pt => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, A] = ks[i];
    const [b, B, arc = 0, e] = ks[i + 1];
    if (t <= b) {
      const u = (e ?? easeInOut)(clamp((t - a) / (b - a || 1e-6)));
      const dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1;
      const s = Math.sin(u * Math.PI) * arc;
      return {x: lerp(A.x, B.x, u) + (dy / l) * s, y: lerp(A.y, B.y, u) - (dx / l) * s};
    }
  }
  return ks[ks.length - 1][1];
};
/** keyed hand shape */
export const ks = (t: number, k: [number, HandShape, Ease?][]): HandShape => ({
  curl: kv(t, k.map(([a, s, e]) => [a, s.curl, e] as [number, number, Ease?])),
  spread: kv(t, k.map(([a, s, e]) => [a, s.spread ?? 0.3, e] as [number, number, Ease?])),
  point: kv(t, k.map(([a, s, e]) => [a, s.point ?? 0, e] as [number, number, Ease?])),
});
/** a soft bump 0..1..0 over [a, b] with attack/release fractions */
export const bump = (t: number, a: number, b: number, att = 0.25, rel = 0.35) => {
  if (t <= a || t >= b) return 0;
  const u = (t - a) / (b - a);
  if (u < att) return easeOut(u / att);
  if (u > 1 - rel) return easeInOut((1 - u) / rel);
  return 1;
};
/** a quick blink (eyelid 1 open .. 0 closed) at time p, 4 frames */
export const blinkAt = (t: number, ps: number[]) => {
  let b = 1;
  for (const p of ps) {
    const d = (t - p) * FPS;
    if (d >= 0 && d < 5) b = Math.min(b, d < 2 ? 1 - d / 2 : (d - 2) / 3);
  }
  return Math.max(0.05, b);
};

// ---------------------------------------------------------------- the involuntary TMS jerk (fast, mechanical)
export const SH_REST: HandShape = {curl: 0.38, spread: 0.32};
export const SH_FLICK: HandShape = {curl: 0.02, spread: 0.85};
export const SH_PRESS: HandShape = {curl: 0.5, spread: 0.3};
/** The pulse-driven movement: no anticipation, a 2-frame snap up with the fingers flicked open, a hard drop onto
 *  the pad, a stiff hold, then a slow settle. Returns the hand offset from rest (world units at scale), shape,
 *  press 0..1 and a small shoulder hitch. */
export const jerk = (t: number, pulse: number, up = 95) => {
  const d = t - pulse;
  if (d < 0.033 || d > 1.0) return {dx: 0, dy: 0, shape: SH_REST, press: 0, hitch: 0};
  if (d < 0.1) {
    const u = (d - 0.033) / 0.067;
    return {dx: -0.25 * up * u, dy: -up * u, shape: mixS(SH_REST, SH_FLICK, Math.min(1, u * 1.6)), press: 0, hitch: u};
  }
  if (d < 0.2) {
    const u = easeIn((d - 0.1) / 0.1);
    return {dx: -0.25 * up * (1 - u), dy: -up + (up + 10) * u, shape: mixS(SH_FLICK, SH_PRESS, u), press: 0, hitch: 1 - u};
  }
  if (d < 0.36) {
    // contact: a stiff hold with a 1-frame rebound tremor
    const tr = Math.sin((d - 0.2) * 90) * 2 * (1 - (d - 0.2) / 0.16);
    return {dx: 0, dy: 10 + tr, shape: SH_PRESS, press: 1, hitch: 0};
  }
  const u = easeInOut(clamp((d - 0.36) / 0.6));
  return {dx: 0, dy: 10 * (1 - u), shape: mixS(SH_PRESS, SH_REST, u), press: 0, hitch: 0};
};
export const mixS = (a: HandShape, b: HandShape, u: number): HandShape => ({
  curl: lerp(a.curl, b.curl, u), spread: lerp(a.spread ?? 0.3, b.spread ?? 0.3, u), point: lerp(a.point ?? 0, b.point ?? 0, u),
});

/** the 2014 researcher (lab coat), and the cast looks used by D and E */
export const RESEARCHER: Look = {skin: '#8D5A3C', hair: 'bun', hairColor: '#1E1A1A', shirt: '#D3E1F8', overlay: 'jacket', overlayColor: '#F4F6F8', pants: '#2E3F5C', shoes: '#2B2B33', accessories: ['glasses', 'nametag']};
export const SALT = K.saffron;
