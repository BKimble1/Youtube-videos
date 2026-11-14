// The robot's canonical body plan and its crawl schedule.
//
// Body plan (axial lengths in world units; body radius 1), tail end first:
//   tail cap (with the tether port) | tail anchor (balloon under a kirigami sleeve) | collar |
//   extender (four-chamber pneumatic actuator, length L(e)) | collar | head anchor | head cap (central channel)
//
// Crawl (the real BIOSENTER sequence): anchor the tail, extend the middle (the head advances), anchor the head, release
// the tail, contract (the tail is drawn forward), release the head, repeat. One schedule in WORLD time drives every
// in-gut shot: the closing shot (S7) is the same crawl just BEFORE frame 0, so the film loops by construction, and the
// macro (S2) and the cutaway (S3) continue the opening crawl (S1) without a reset.
import {clamp, ring, ss5} from '../lib';

export const LEN = {tailCap: 0.62, anchor: 1.5, collar: 0.3, headCap: 0.72};
export const L0 = 2.8; // extender length, contracted
export const STROKE = 2.0; // extension stroke
export const extLen = (e: number) => L0 + STROKE * e;
export const bodyLen = (e: number) => LEN.tailCap + 2 * LEN.anchor + 2 * LEN.collar + LEN.headCap + extLen(e);
export const R_BODY = 1.0;
export const R_ANCHOR_MAX = 1.98; // inflated: reaches and presses the wall (lumen radius 2.0)
export const POP_ON = 0.6; // anchor inflation at which the kirigami scales buckle out

type Ph = 'TA' | 'TR' | 'HA' | 'HR' | 'EX' | 'CO';
// [phase, start, end] in world time tau (s). tau = t for S1-S3; tau = t - DUR for S7 (the crawl that leads into frame 0).
export const PHASES: [Ph, number, number][] = [
  ['CO', -5.4, -4.7], ['HR', -4.7, -4.4], ['TA', -4.4, -4.0], ['EX', -4.0, -3.2], ['HA', -3.2, -2.7],
  ['TR', -2.6, -2.3], ['CO', -2.3, -1.5], ['HR', -1.5, -1.2], ['TA', -1.2, -0.8], ['EX', -0.8, 0.75],
  ['HA', 0.75, 1.15], ['TR', 1.15, 1.4], ['CO', 1.4, 2.1], ['HR', 2.1, 2.4], ['TA', 2.4, 2.75], ['EX', 2.75, 4.1],
  ['HA', 4.2, 5.62], ['TR', 5.72, 6.0], ['CO', 6.0, 7.0], ['HR', 7.1, 7.4], ['TA', 7.5, 7.95], ['EX', 8.1, 9.0],
  ['HA', 9.0, 9.35], ['TR', 9.35, 9.6], ['CO', 9.6, 10.3], ['HR', 10.3, 10.55], ['TA', 10.55, 10.85], ['EX', 10.85, 11.9],
  ['HA', 11.9, 12.3], ['TR', 12.3, 12.55], ['CO', 12.55, 13.3],
];
// state before the first phase: head anchored, tail free, extended (the first phase contracts)
const INIT = {aT: 0, aH: 1, e: 1};
export const S_TAIL0 = -2.2; // tail end position (arc length) at the start of the schedule

/** the macro inflation (S2): the balloon swells slowly with the scales still flat, then they pop on "pop" */
const HA_MACRO = (u: number) => {
  // u in [0,1] over 4.2..5.62
  const t = 4.2 + u * 1.42;
  if (t < 5.3) return 0.56 * ss5(t, 4.2, 5.3) ** 0.9;
  return 0.56 + 0.44 * ss5(t, 5.3, 5.62);
};

const curve = (ph: Ph, t0: number, t1: number, tau: number) => {
  const u = clamp((tau - t0) / (t1 - t0));
  const k = ph === 'TA' || ph === 'HA' ? 1 - (1 - u) ** 2.2 : ss5(u, 0, 1);
  return ph === 'HA' && t0 === 4.2 ? HA_MACRO(u) : k;
};

export type CrawlState = {
  sTail: number; e: number; aT: number; aH: number;
  /** scale pop angle factor 0..~1.2 (with a spring overshoot as they snap out) */
  popT: number; popH: number;
  /** extender pressure glow 0..1 (rises while it extends, falls while it vents) */
  gE: number;
};

const valueAt = (key: 'aT' | 'aH' | 'e', tau: number) => {
  let v = INIT[key];
  for (const [ph, t0, t1] of PHASES) {
    if (t0 > tau) break;
    const owns = (key === 'aT' && (ph === 'TA' || ph === 'TR')) || (key === 'aH' && (ph === 'HA' || ph === 'HR')) || (key === 'e' && (ph === 'EX' || ph === 'CO'));
    if (!owns) continue;
    const up = ph === 'TA' || ph === 'HA' || ph === 'EX';
    const k = curve(ph, t0, t1, tau);
    v = up ? k : 1 - k;
  }
  return v;
};
/** the tail end advances only while the body contracts (the head is anchored then) */
const tailAt = (tau: number) => {
  let s = S_TAIL0;
  for (const [ph, t0, t1] of PHASES) {
    if (t0 > tau) break;
    if (ph !== 'CO') continue;
    const k = curve(ph, t0, t1, tau);
    s += STROKE * k;
  }
  return s;
};
/** the time (in [t0, t1]) an anchor's inflation crosses POP_ON going up, by bisection */
const crossTime = (key: 'aT' | 'aH', t0: number, t1: number) => {
  let a = t0, b = t1;
  for (let i = 0; i < 30; i++) {
    const m = (a + b) / 2;
    if (valueAt(key, m) < POP_ON) a = m; else b = m;
  }
  return (a + b) / 2;
};
const CROSS: Record<'aT' | 'aH', number[]> = {aT: [], aH: []};
for (const [ph, t0, t1] of PHASES) {
  if (ph === 'TA') CROSS.aT.push(crossTime('aT', t0, t1));
  if (ph === 'HA') CROSS.aH.push(crossTime('aH', t0, t1));
}
export const POP_TIMES = CROSS;
const popOf = (key: 'aT' | 'aH', tau: number, a: number) => {
  const base = ss5(a, POP_ON - 0.06, POP_ON + 0.12);
  let over = 0;
  for (const tc of CROSS[key]) if (tau >= tc && tau - tc < 1.2) over = 0.32 * ring(tau, tc + 0.05, 6.5, 0.11);
  return base * (1 + over);
};
const glowAt = (tau: number) => {
  let g = 0;
  for (const [ph, t0, t1] of PHASES) {
    if (t0 > tau) break;
    if (ph === 'EX') g = ss5(tau, t0, t0 + 0.25);
    if (ph === 'CO') g = 1 - ss5(tau, t0, t0 + 0.35);
  }
  return g;
};

export const crawl = (tau: number): CrawlState => {
  const aT = valueAt('aT', tau), aH = valueAt('aH', tau);
  return {sTail: tailAt(tau), e: valueAt('e', tau), aT, aH, popT: popOf('aT', tau, aT), popH: popOf('aH', tau, aH), gE: glowAt(tau)};
};
/** a still pose (for the tool close-up and the lab) */
export const pose = (p: Partial<CrawlState> & {sTail: number}): CrawlState => ({e: 0.5, aT: 0, aH: 0, popT: 0, popH: 0, gE: 0, ...p});
