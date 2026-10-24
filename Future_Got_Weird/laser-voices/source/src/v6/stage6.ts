// V6 staging and performance in the atrium (positions as V5: the lead and his friend at the exhibit case facing the
// front of the hall; the transmitter on its tripod 3.75 m to his left, set up on his left ear; a visitor with a museum
// map walks from the back of the hall through the beam's line). V6 re-acts every beat with the V6 rig:
//   hook (seam .. 3.0): the voice; his eyes go first, brows, a short head turn, a shoulder lift; the arm rises from the
//     shoulder, elbow leading, to cup the ear; he searches; turns to her; the voice again; he lowers the arm, looking
//     round. She reads on, takes one short sip, then looks at him: "what?".
//   5.0..5.5: he checks his ear with a fingertip.
//   F1 (23.4..27): listening, chin in hand, head cocked toward the voice.
//   F3 (27.75..30.3): the voice is gone: startle, palms up, looks round, then at the visitor.
//   F4/F5 (31.93..): it is back: eyes, head, shoulders and arm together; he cups the ear, then lets it go and settles
//     back to the case, and the voice starts again across the loop seam.
// Keyed in unrolled time tau (tau = t + DUR for t < TAU_WRAP) so actions run across the seam.
import {DUR, clamp, lerp, ss, kv, cyc, T_BLOCK, T_CLEAR} from '../v4/core4';
import {v3, V3, cardToWorld, sub3, dot3, len3} from '../v4/rig/geo4';
import {BODY_P, GUESSER, CLERK, EXTRAS, Look4} from '../v4/rig/cast4';
import {face, mix, stand} from '../v4/rig/poses4';
import {makeWalker, walkPose, Walker} from './rig/walk6';
import {joints4, Pose4, Face4, Arm4} from './rig/Crew6';
import {exitRay} from '../v4/transmitter4';

export const TAU_WRAP = 3.05;
export const tauOf = (t: number) => (t < TAU_WRAP ? t + DUR : t);
export type CharState = {ground: V3; heading: number; pose: Pose4};

// ---------------------------------------------------------------- places (as V5)
export const LEAD_G = v3(0, 0, 3.5), LEAD_H = 180;
export const FRIEND_G = v3(0.8, 0, 3.56), FRIEND_H = 196;
export const MACHINE = v3(-3.75, 1.36, 3.48);
export const CASE = {x0: -0.42, x1: 1.22, z0: 2.5, z1: 2.88, y: 0.74, glass: 0.2};
export const EAR0 = v3(-0.223, 1.356, 3.434);
export const aimAt = (from: V3, to: V3) => {
  const d = v3(to.x - from.x, to.y - (from.y + 0.1), to.z - from.z);
  return {yaw: (Math.atan2(d.x, d.z) * 180) / Math.PI, pitch: (Math.atan2(d.y, Math.hypot(d.x, d.z)) * 180) / Math.PI};
};
export const AIM = aimAt(MACHINE, EAR0);
export const BEAM = {o: exitRay(MACHINE, AIM.yaw, AIM.pitch).o, end: EAR0};
export const beamAt = (u: number) => v3(BEAM.o.x + (BEAM.end.x - BEAM.o.x) * u, BEAM.o.y + (BEAM.end.y - BEAM.o.y) * u, BEAM.o.z + (BEAM.end.z - BEAM.o.z) * u);

// ---------------------------------------------------------------- helpers
const K = (tau: number, keys: [number, number][]) => kv(tau, keys);
const fmix = (t: number, keys: [number, Face4][]): Face4 => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return mix(keys[i - 1][1], keys[i][1], ss(keys[i - 1][0], keys[i][0], t));
  return keys[keys.length - 1][1];
};
const blinkAt = (t: number, ts: number[]) => Math.max(0, ...ts.map((b) => clamp(1 - Math.abs(t - b) / 0.075)));
const lerpV = (a: V3, b: V3, u: number) => v3(lerp(a.x, b.x, u), lerp(a.y, b.y, u), lerp(a.z, b.z, u));
/** hand path through a via point (the elbow leads, the hand follows a curve, never a straight jump) */
const via = (a: V3, m: V3, b: V3, u: number) => {
  const p = lerpV(lerpV(a, m, u), lerpV(m, b, u), u);
  return p;
};
const D = DUR;

export const FX = {
  study: face({brow: 0.05, mw: 14, curve: 0.35, lid: 0.2, gy: 0.55}),
  startle: face({brow: 1, browIn: 0.25, wide: 1, mw: 9, curve: -0.25, open: 0.3}),
  search: face({brow: 0.6, browIn: 0.7, wide: 0.55, mw: 10, curve: -0.25}),
  listen: face({brow: 0.75, browIn: 0.85, wide: 0.55, mw: 9, curve: -0.3, open: 0.08, asym: 0.45}),
  think: face({brow: 0.35, browIn: 0.6, asym: 0.6, lid: 0.15, mw: 11, curve: -0.1, smirk: -0.2, gy: -0.4}),
  puzzled: face({brow: 0.45, browIn: 0.95, asym: 0.9, mw: 11, curve: -0.35, smirk: -0.3}),
  what: face({brow: 0.9, browIn: 0.4, wide: 0.7, mw: 12, curve: -0.2, open: 0.3}),
  wow: face({brow: 1, browIn: 0.2, wide: 1, mw: 13, curve: 0.25, open: 0.55}),
  bemused: face({brow: 0.35, browIn: 0.5, asym: 0.5, mw: 13, curve: 0.15, lid: 0.1}),
  read: face({brow: 0.1, mw: 13, curve: 0.45, lid: 0.3, gy: 0.6}),
  herWhat: face({brow: 0.6, browIn: 0.2, mw: 12, curve: -0.05, wide: 0.3, asym: 0.4}),
  smirk: face({brow: 0.25, browIn: -0.1, asym: 0.6, lid: 0.25, mw: 14, curve: 0.6, smirk: 0.5}),
  map: face({brow: -0.1, browIn: -0.3, mw: 12, curve: 0.1, lid: 0.25, gy: 0.7}),
  stroll: face({brow: 0.15, mw: 14, curve: 0.4}),
};

// ---------------------------------------------------------------- the lead
export const leadAt = (t: number): CharState => {
  const tau = tauOf(t), b = BODY_P;
  const hy = K(tau, [
    [3.05, 34], [3.6, -8], [4.2, 26], [4.99, 6], [5.6, 4], [7, 4],
    [23.37, 20], [27.17, 20], [27.75, 6], [28.25, -30], [28.8, 30], [29.3, 0], [29.5, 40], [30.3, 42], [31.93, 40], [31.97, 40], [32.08, 70], [32.35, 66], [33.0, 60],
    [33.45, 20], [33.8, 2], [D - 0.05, 2], [D + 0.2, 42], [D + 0.5, 46], [D + 1.0, 40], [D + 1.55, 62], [D + 1.85, -34], [D + 2.12, -34], [D + 2.2, 44], [D + 2.45, 48], [D + 2.7, 18], [D + 3.05, 34],
  ]);
  const hp = K(tau, [[3.05, 2], [4.99, 2], [5.6, 4], [23.37, 4], [27.17, 4], [27.75, -4], [28.4, 0], [31.93, 0], [32.05, -8], [32.5, -2], [33.3, 6], [33.8, 16], [D - 0.05, 16], [D + 0.15, -4], [D + 0.6, 0], [D + 3.05, 2]]);
  const hr = K(tau, [[3.05, 6], [4.99, 2], [23.37, 12], [27.17, 12], [27.75, 2], [31.93, 2], [32.1, 12], [32.9, 10], [33.6, 0], [D, 0], [D + 0.25, 9], [D + 1.0, 12], [D + 1.85, 2], [D + 2.25, 10], [D + 3.05, 6]]);
  // eyes lead the head
  const gx = K(tau, [[3.05, 0.5], [3.4, -0.6], [3.9, 0.7], [4.5, -0.2], [4.99, 0], [7, 0], [23.37, 0.5], [27.17, 0.5], [27.8, -0.8], [28.6, 0.8], [29.2, 0], [29.4, 0.8], [31.93, 0.7], [31.96, 1], [32.8, 0.6], [33.5, 0],
    [D - 0.12, 0], [D - 0.06, 0.95], [D + 0.4, 0.75], [D + 1.0, 0.5], [D + 1.5, 0.9], [D + 1.75, -0.9], [D + 2.12, -0.8], [D + 2.16, 0.95], [D + 2.6, -0.4], [D + 2.85, 0.7], [D + 3.05, 0.5]]);
  const fc = fmix(tau, [[3.05, FX.search], [4.3, FX.puzzled], [4.99, FX.puzzled], [5.6, FX.listen], [7, FX.listen],
    [23.37, FX.think], [27.17, FX.think], [27.2, FX.startle], [28.0, FX.what], [28.9, FX.search], [29.5, FX.puzzled], [31.93, FX.puzzled], [31.97, FX.startle], [32.2, FX.wow], [32.9, FX.wow],
    [33.4, FX.bemused], [33.8, FX.study], [D - 0.1, FX.study], [D - 0.04, FX.startle], [D + 0.7, FX.search], [D + 1.6, FX.listen], [D + 1.85, FX.what], [D + 2.12, FX.what], [D + 2.18, FX.startle], [D + 2.6, FX.search], [D + 3.05, FX.search]]);
  const f: Face4 = {...fc, gx, blink: blinkAt(tau, [3.5, 4.6, 24.3, 25.9, 30.6, 33.15, D + 0.9])};
  const p = stand(b, f);
  // breath and weight (whole cycles over the film); the shoulder lift on each startle
  const sway = cyc(t, 0.21, 0.4);
  const lift = K(tau, [[D - 0.06, 0], [D + 0.12, 1], [D + 0.7, 0.2], [D + 1.2, 0]]) + K(tau, [[27.15, 0], [27.3, 0.8], [27.9, 0]]) + K(tau, [[31.93, 0], [32.06, 1], [32.6, 0.2], [33.2, 0]]) + K(tau, [[D + 2.12, 0], [D + 2.25, 0.6], [D + 2.7, 0]]);
  p.pel = v3(4 * sway, b.hipY - 1.5 + 1.5 * cyc(t, 0.27, 1) + 4 * lift, -3 * lift);
  p.roll = -1.5 * sway - 4 * lift;
  // ---- arms
  const restL = p.armL.hand, restR = p.armR.hand;
  const chestL = v3(b.shW + 30, b.hipY + b.spine - 40, 40); // via point: elbow out, hand in front of the chest
  const cupL = v3(b.R + 22, b.hipY + b.spine + b.headUp - 18, 2); // cupped behind the ear, palm forward
  const tipL = v3(b.R + 6, b.hipY + b.spine + b.headUp - 16, 12); // a fingertip at the ear opening
  const chinR = v3(-10, b.hipY + b.spine + b.headUp - 52, 44); // chin in hand
  const palmL = v3(b.shW + 36, b.hipY + b.spine - 92, 52), palmR = v3(-b.shW - 36, b.hipY + b.spine - 92, 52); // "what?"
  // left arm: 0 rest .. 1 cup (via the chest point); 'tip' the fingertip check; 'palm' palms up
  const cup = K(tau, [[3.05, 0], [31.93, 0], [32.05, 0], [32.38, 1], [33.0, 1], [33.55, 0], [D - 0.05, 0], [D + 0.3, 0], [D + 0.95, 1], [D + 2.55, 1], [D + 3.05, 0]]);
  const tip = K(tau, [[4.99, 0], [5.22, 1], [5.34, 1], [5.52, 0]]);
  const palms = K(tau, [[27.75, 0], [28.0, 1], [28.75, 1], [29.15, 0]]);
  const chin = K(tau, [[23.3, 0], [23.37, 1], [27.15, 1], [27.45, 0]]);
  let armL: Arm4 = {...p.armL, shape: 'relax'};
  if (cup > 0.001) {
    const u = ss(0, 1, cup);
    armL = {hand: via(restL, chestL, cupL, u), shape: u > 0.7 ? 'cup' : 'relax', pole: v3(1, lerp(-0.9, -0.25, u), lerp(0.3, -0.1, u)), wrist: lerp(0, 170, ss(0.55, 1, u))};
  } else if (tip > 0.001) {
    armL = {hand: via(restL, chestL, tipL, ss(0, 1, tip)), shape: tip > 0.5 ? 'point' : 'relax', pole: v3(1, -0.4, 0)};
  } else if (palms > 0.001) {
    armL = {hand: lerpV(restL, palmL, ss(0, 1, palms)), shape: 'open', pole: v3(0.8, -0.8, -0.3), wrist: lerp(0, -150, palms)};
  }
  let armR: Arm4 = {...p.armR, shape: 'relax'};
  if (chin > 0.001) armR = {hand: lerpV(restR, chinR, ss(0, 1, chin)), shape: chin > 0.6 ? 'fist' : 'relax', pole: v3(-0.6, -1, 0.2)};
  else if (palms > 0.001) armR = {hand: lerpV(restR, palmR, ss(0, 1, palms)), shape: 'open', pole: v3(-0.8, -0.8, -0.3), wrist: lerp(0, 150, palms)};
  const pose: Pose4 = {...p, armL, armR, hy, hp, hr, twist: 8 * clamp(hy / 60, -1, 1)};
  return {ground: LEAD_G, heading: LEAD_H, pose};
};

// ---------------------------------------------------------------- the friend
export const friendAt = (t: number): CharState => {
  const tau = tauOf(t), b = BODY_P;
  const hy = K(tau, [[3.05, 24], [3.3, -6], [23.37, -6], [29.8, -6], [30.1, 22], [30.9, 22], [31.2, -6], [31.97, -6], [32.2, 26], [32.9, 26], [33.2, -6], [D + 1.6, -6], [D + 1.85, 36], [D + 2.9, 32], [D + 3.05, 24]]);
  const hp = K(tau, [[3.05, 6], [3.35, 20], [29.8, 20], [30.1, 6], [30.9, 8], [31.2, 20], [32.0, 20], [32.2, 6], [32.9, 6], [33.2, 20], [D + 1.6, 20], [D + 1.85, 4], [D + 3.05, 6]]);
  const hr = K(tau, [[3.05, 4], [3.35, -4], [D + 1.6, -4], [D + 1.9, 8], [D + 2.5, 4], [D + 3.05, 4]]);
  const gx = K(tau, [[3.05, 0.4], [3.3, 0], [29.8, 0], [30.0, 0.7], [30.9, 0.5], [31.1, 0], [32.0, 0], [32.15, 0.7], [32.9, 0.5], [33.1, 0], [D + 1.6, 0], [D + 1.8, 0.7], [D + 3.05, 0.4]]);
  const fc = fmix(tau, [[3.05, FX.herWhat], [3.3, FX.read], [29.8, FX.read], [30.05, FX.herWhat], [31.1, FX.read], [32.0, FX.read], [32.2, FX.smirk], [32.9, FX.smirk], [33.15, FX.read], [D + 1.6, FX.read], [D + 1.85, FX.herWhat], [D + 3.05, FX.herWhat]]);
  const f: Face4 = {...fc, gx, blink: blinkAt(tau, [4.2, 6.0, 24.3, 26.8, 29.1, 31.4, 33.5, D + 1.2])};
  const p = stand(b, f);
  p.pel = v3(-3 * cyc(t, 0.19, 2.2), b.hipY - 1 + 1.2 * cyc(t, 0.25, 0.3), 0);
  // the cup (right hand, outer side), held at the chest; one short sip in the opening shot
  const sip = K(tau, [[D + 0.45, 0], [D + 0.68, 1], [D + 0.9, 1], [D + 1.15, 0]]);
  const hold = v3(-22, b.hipY + b.spine - 60, 62), mouth = v3(-30, b.hipY + b.spine + b.headUp - 52, 56);
  const armR: Arm4 = {hand: lerpV(hold, mouth, ss(0, 1, sip)), shape: 'grip', pole: v3(-0.6, -0.7, -0.5), tilt: 22 * ss(0.3, 1, sip)};
  // free hand on the case edge; a palm-up "what?" at D+1.9..2.6
  const what = K(tau, [[D + 1.85, 0], [D + 2.05, 1], [D + 2.5, 1], [D + 2.75, 0]]);
  const onCase = v3(b.shW - 6, b.hipY + b.spine - 120, 60), palm = v3(b.shW + 28, b.hipY + b.spine - 92, 56);
  const armL: Arm4 = {hand: lerpV(onCase, palm, ss(0, 1, what)), shape: what > 0.4 ? 'open' : 'relax', pole: v3(0.5, -0.8, -0.4), wrist: lerp(0, -140, what)};
  return {ground: FRIEND_G, heading: FRIEND_H, pose: {...p, armL, armR, hy, hp, hr, pitch: 4 + 4 * clamp(hp / 20, 0, 1)}};
};
export const FRIEND_CUP = -1;

// ---------------------------------------------------------------- the visitor (as V5; FA/FB re-solved by solve_v6)
export const BX = -1.9;
export const FA = 0.3625, FB = -0.2628;
const visitorPath = (fa: number, fb: number) => {
  const zStop = MACHINE.z + 0.02, v = 1.05;
  const tStop = 27.75 + fa, tGo = 31.5 + fb;
  const zAt = (tau: number) => {
    if (tau <= tStop - 1.9) return zStop + 1.0 + v * (tStop - 1.9 - tau);
    if (tau <= tStop) { const u = (tau - (tStop - 1.9)) / 1.9; return zStop + 1.0 * (1 - (2 * u - u * u)); }
    if (tau <= tGo) return zStop;
    const s = tau - tGo;
    return s < 1.2 ? zStop - v * (s * s) / (2 * 1.2) : zStop - v * 0.6 - v * (s - 1.2);
  };
  return (tau: number) => ({x: BX + 0.06 * Math.sin(tau * 0.7), z: zAt(tau)});
};
export const makeVisitor = (fa = FA, fb = FB) => makeWalker({path: visitorPath(fa, fb), heading: () => 180, t0: 18, t1: D + 1.5, stepT: 0.5, b: BODY_P, half: 0.1, first: 'L', vMin: 0.1});
export const visitorWalker = makeVisitor();
export const VISITOR: Look4 = EXTRAS[0];
export const visitorRead = (t: number) => kv(t, [[27.25, 0], [27.7, 1], [30.75, 1], [31.15, 0]]);
export const visitorAt = (t: number, w: Walker = visitorWalker): CharState => {
  const b = BODY_P;
  const read = visitorRead(t);
  const f: Face4 = {...mix(FX.stroll, FX.map, read), blink: blinkAt(t, [24.8, 26.4, 29.3, 32.0])};
  const s = walkPose(w, t, {face: f, hy: K(t, [[23, 8], [25, -10], [26.5, 12], [27.3, 0], [31.2, 0], [31.6, 14], [32.3, 8]]), hp: lerp(4, 22, read), armMix: 1 - read});
  const mapL = v3(34, b.hipY + b.spine - 40, 58), mapR = v3(-34, b.hipY + b.spine - 40, 58);
  const armL: Arm4 = read > 0.01 ? {hand: lerpV(s.pose.armL.hand, mapL, read), shape: 'fist', pole: v3(0.7, -0.7, -0.6)} : s.pose.armL;
  const armR: Arm4 = read > 0.01 ? {hand: lerpV(s.pose.armR.hand, mapR, read), shape: 'fist', pole: v3(-0.7, -0.7, -0.6)} : {...s.pose.armR, shape: 'fist'};
  return {ground: s.ground, heading: s.heading, pose: {...s.pose, armL, armR}};
};

// ---------------------------------------------------------------- the crowd (behind them; exactly periodic over the film)
export const W_LANE = 34.2;
const STEPS = 56;
export type Extra = {look: Look4; z: number; y: number; x0: number; dir: 1 | -1; w: Walker; ph: number};
const LANES: [number, number, number, 1 | -1][] = [
  [5.7, 0, -6.0, 1], [5.7, 0, 11.0, 1], [6.6, 0, 4.0, -1], [6.6, 0, -12.5, -1], [7.3, 0, -1.5, 1], [9.2, 0, 8.0, -1], [9.2, 0, -7.0, -1],
  [10.1, 0, 2.0, 1], [10.9, 0, -10.0, -1], [10.9, 0, 6.0, -1], [12.6, 4.5, -3.0, 1], [13.2, 4.5, 6.0, -1], [12.9, 4.5, 15.0, 1],
];
export const EXTRA_LIST: Extra[] = LANES.map(([z, y, x0, dir], i) => {
  const v = (dir * W_LANE) / DUR;
  const w = makeWalker({path: (t) => ({x: x0 + v * t, z}), heading: () => (dir > 0 ? 90 : -90), t0: -3, t1: DUR + 3, stepT: DUR / STEPS, phase: (i * 0.173) % (DUR / STEPS), b: BODY_P, half: 0.09});
  return {look: EXTRAS[(i + 1) % EXTRAS.length], z, y, x0, dir, w, ph: i * 1.3};
});
export const extraAt = (e: Extra, t: number): CharState => {
  const s = walkPose(e.w, t, {face: face({gx: 0.3 * cyc(t, 0.07, e.ph), brow: 0.1, curve: 0.4}), hy: 22 * cyc(t, 0.05, e.ph)});
  const X = s.ground.x, wrapped = X - W_LANE * Math.round(X / W_LANE);
  return {ground: v3(wrapped, e.y, s.ground.z), heading: s.heading, pose: s.pose};
};

// ---------------------------------------------------------------- geometry
export const earOf = (s: CharState, side = 1, b = BODY_P): V3 => {
  const j = joints4(b, s.pose);
  return cardToWorld(s.ground, s.heading, v3(j.Hc.x + j.hx.x * b.R * side, j.Hc.y + j.hx.y * b.R * side - 6, j.Hc.z + j.hx.z * b.R * side));
};
export const segDist = (p: V3, a: V3, c: V3) => {
  const ab = sub3(c, a), ap = sub3(p, a);
  const L2 = dot3(ab, ab);
  if (L2 < 1e-12) return len3(ap);
  const u = clamp(dot3(ap, ab) / L2);
  return len3(sub3(ap, v3(ab.x * u, ab.y * u, ab.z * u)));
};
const capsules = (s: CharState, b = BODY_P): [V3, V3, number][] => {
  const j = joints4(b, s.pose);
  const W = (p: V3) => cardToWorld(s.ground, s.heading, p);
  return [[W(j.Hc), W(j.Hc), (b.R + 4) / 267], [W(j.P), W(j.S), 0.16], [W(j.S), W(j.Hc), 0.07], [W(j.SL), W(j.WL), 0.06], [W(j.SR), W(j.WR), 0.06]];
};
export const beamStop = (bodies: CharState[]) => {
  const caps = bodies.flatMap((s) => capsules(s));
  for (let k = 0; k <= 500; k++) {
    const u = k / 500;
    if (u > 0.985) break;
    const p = beamAt(u);
    if (caps.some(([a, c, r]) => segDist(p, a, c) < r)) return u;
  }
  return 1;
};
export const blocked = (t: number, w: Walker = visitorWalker) => beamStop([visitorAt(t, w)]) < 0.985;
export {GUESSER, CLERK, BODY_P, T_BLOCK, T_CLEAR, DUR, clamp, lerp, ss, kv, cyc};
