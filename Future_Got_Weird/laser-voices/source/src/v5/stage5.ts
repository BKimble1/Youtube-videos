// V5 staging and performance in the atrium. All positions in metres (floor y = 0); the hall is V4's (atrium4).
// The lead and his friend stand at an exhibit case facing the front of the hall (heading 180, toward -z, where the
// cameras are). The transmitter stands on its tripod 4.6 m to his left (-x), set up on his left ear, so its beam runs
// along +x at ear height. Seen from the front, +x is screen-left: the transmitter is on screen right and the beam
// travels right to left, as in every other world of the film.
// Performance is keyed in unrolled time tau (tau = t + DUR for t < TAU_WRAP), so his startle can run across the loop
// seam: the last frame and frame 0 are consecutive frames of one action.
import {DUR, clamp, lerp, ss, kv, cyc, T_BLOCK, T_CLEAR} from '../v4/core4';
import {v3, V3, cardToWorld, sub3, dot3, len3} from '../v4/rig/geo4';
import {BODY_P, GUESSER, CLERK, EXTRAS, Look4} from '../v4/rig/cast4';
import {makeWalker, walkPose, Walker} from '../v4/rig/walk4';
import {face, mix, stand} from '../v4/rig/poses4';
import {joints4, Pose4, Face4, Arm4} from '../v4/rig/Crew4';
import {exitRay} from '../v4/transmitter4';

export const TAU_WRAP = 1.6;
export const tauOf = (t: number) => (t < TAU_WRAP ? t + DUR : t);
export type CharState = {ground: V3; heading: number; pose: Pose4};

// ---------------------------------------------------------------- places
export const LEAD_G = v3(0, 0, 3.5), LEAD_H = 180;
export const FRIEND_G = v3(0.8, 0, 3.56), FRIEND_H = 196;
export const MACHINE = v3(-3.75, 1.36, 3.48);
export const CASE = {x0: -0.42, x1: 1.22, z0: 2.5, z1: 2.88, y: 0.74, glass: 0.2};
// his left ear when standing at rest (the transmitter is aimed here); refined by solve_v5
export const EAR0 = v3(-0.221, 1.355, 3.42);
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
const talk = (t: number, a: number, b: number, amt = 0.42) => (t > a && t < b ? amt * Math.abs(Math.sin((t - a) * 15)) * ss(a, a + 0.05, t) * (1 - ss(b - 0.06, b, t)) : 0);
const lerpV = (a: V3, b: V3, u: number) => v3(lerp(a.x, b.x, u), lerp(a.y, b.y, u), lerp(a.z, b.z, u));
const D = DUR;

const FX = {
  study: face({brow: 0.05, mw: 14, curve: 0.35, lid: 0.18, gy: 0.5}),
  startle: face({brow: 1, browIn: 0.25, wide: 1, mw: 9, curve: -0.25, open: 0.32}),
  search: face({brow: 0.6, browIn: 0.7, wide: 0.55, mw: 10, curve: -0.25}),
  listen: face({brow: 0.75, browIn: 0.85, wide: 0.6, mw: 9, curve: -0.3, open: 0.1, asym: 0.45}),
  ask: face({brow: 0.85, browIn: 0.6, wide: 0.8, mw: 12, curve: -0.1, open: 0.25}),
  puzzled: face({brow: 0.45, browIn: 0.95, asym: 0.9, mw: 11, curve: -0.35, smirk: -0.3}),
  wow: face({brow: 1, browIn: 0.2, wide: 1, mw: 13, curve: 0.25, open: 0.6}),
  bemused: face({brow: 0.35, browIn: 0.5, asym: 0.5, mw: 13, curve: 0.15, lid: 0.1}),
  // her
  read: face({brow: 0.1, mw: 13, curve: 0.45, lid: 0.3, gy: 0.6}),
  what: face({brow: 0.55, browIn: 0.1, mw: 12, curve: -0.05, wide: 0.25, asym: 0.3}),
  smirk: face({brow: 0.25, browIn: -0.1, asym: 0.6, lid: 0.25, mw: 14, curve: 0.6, smirk: 0.5}),
  // the visitor
  map: face({brow: -0.1, browIn: -0.3, mw: 12, curve: 0.1, lid: 0.25, gy: 0.7}),
  stroll: face({brow: 0.15, mw: 14, curve: 0.4}),
};

// ---------------------------------------------------------------- the lead (stands at the case all film)
export const leadAt = (t: number): CharState => {
  const tau = tauOf(t), b = BODY_P;
  // head yaw (+ = his left, toward the voice and the transmitter), pitch (+ = down), roll (+ = toward his left)
  const hy = K(tau, [[1.6, 50], [1.75, 20], [1.95, -48], [2.12, -46], [2.18, 40], [2.4, 52], [2.9, 46], [3.75, 30], [4.0, -8], [4.35, 34], [4.7, 12], [4.99, 4],
    [5.6, 4], [6.95, 10], [7.6, 30], [8.4, 8], [9.4, 0],
    [23.37, 18], [24.0, 26], [26.6, 22], [27.17, 22], [27.3, 6], [27.75, -28], [28.3, 22], [28.9, -10], [29.45, 0], [29.8, 52], [30.8, 50], [31.2, 40], [31.93, 38], [32.0, 40], [32.16, 74], [32.3, 74],
    [32.7, 70], [33.35, 30], [33.75, 2], [D + 0.02, 0], [D + 0.12, 34], [D + 0.26, 68], [D + 0.55, 62], [D + 0.9, 50], [D + 1.25, 58], [D + 1.6, 50]]);
  const hp = K(tau, [[1.6, 0], [1.9, 2], [3.75, 2], [4.99, 2], [6.95, 2], [9.4, 2], [23.37, 2], [27.17, 2], [27.3, -6], [27.8, 0], [31.93, 0], [32.05, -8], [32.5, -2],
    [33.3, 6], [33.75, 16], [D + 0.02, 16], [D + 0.2, -6], [D + 0.5, -2], [D + 1.6, 0]]);
  const hr = K(tau, [[1.6, 8], [2.0, 0], [2.3, 10], [2.9, 8], [3.75, 6], [4.99, 2], [6.95, 4], [9.4, 0], [23.37, 4], [23.9, 14], [27.1, 14], [27.3, 2], [31.93, 2], [32.1, 12], [32.8, 10], [33.6, 0],
    [D + 0.02, 0], [D + 0.25, 10], [D + 1.6, 8]]);
  const gx = K(tau, [[1.6, 0.6], [1.8, -0.6], [2.12, -0.6], [2.16, 0.8], [2.9, 0.6], [3.75, 0.2], [3.95, -0.7], [4.25, 0.8], [4.55, -0.3], [4.99, 0], [6.95, 0.2], [7.5, 0.7], [8.4, 0],
    [23.37, 0.3], [27.17, 0.3], [27.3, 0], [27.5, -0.8], [28.1, 0.8], [28.7, -0.5], [29.3, 0], [29.6, 0.7], [31.93, 0.6], [31.98, 0.9], [32.8, 0.6], [33.5, 0], [D, 0], [D + 0.08, 0.95], [D + 0.4, 0.7], [D + 0.9, -0.4], [D + 1.2, 0.6], [D + 1.6, 0.6]]);
  const fc = fmix(tau, [[1.6, FX.search], [1.8, FX.ask], [2.1, FX.ask], [2.16, FX.startle], [2.5, FX.listen], [3.75, FX.search], [4.4, FX.puzzled], [4.99, FX.puzzled], [6.95, FX.listen], [8.4, FX.search],
    [23.37, FX.listen], [26.9, FX.listen], [27.17, FX.listen], [27.24, FX.startle], [27.9, FX.search], [29.45, FX.puzzled], [31.9, FX.puzzled], [31.97, FX.wow], [32.7, FX.wow], [33.35, FX.bemused], [33.75, FX.study],
    [D + 0.02, FX.study], [D + 0.1, FX.startle], [D + 0.7, FX.search], [D + 1.6, FX.search]]);
  const f: Face4 = {...fc, gx, open: fc.open + talk(tau, 1.95, 2.1, 0.45) + talk(tau, D + 1.5, D + 1.62, 0.4),
    blink: blinkAt(tau, [3.4, 6.3, 7.2, 24.6, 26.0, 28.6, 30.2, 33.1, D + 1.1])};
  // talking line "did you hear that?" spans the wrap: 1.5..2.1 film time
  if (t > 1.5 && t < 2.1) f.open += talk(t, 1.5, 2.1, 0.42) * 0.6;
  // his left hand: up to cup the ear (seam startle .. 2.9; 3.75..5.5 checking; 23.7..27.2 listening; 32.3..33.2)
  const cup = K(tau, [[1.6, 1], [2.9, 1], [3.75, 1], [4.99, 0.6], [5.12, 1.15], [5.3, 1.15], [5.52, 0], [6.95, 0], [9.4, 0], [23.37, 0.6], [23.75, 1], [27.17, 1], [27.32, 0.55], [27.6, 0], [31.93, 0], [32.25, 0.15], [32.5, 0.9],
    [33.1, 0.9], [33.6, 0], [D + 0.02, 0], [D + 0.45, 0], [D + 0.75, 1], [D + 1.6, 1]]);
  const p = stand(b, f);
  // weight and breath: a slow sway (whole cycles over the film)
  const sway = cyc(t, 0.21, 0.4);
  p.pel = v3(4 * sway, b.hipY - 1.5 + 1.5 * cyc(t, 0.27, 1), 0);
  p.roll = -1.5 * sway;
  const rest = p.armL.hand;
  // 1.0: cupped behind the ear, listening; >1 (in S4): a fingertip at the ear opening, checking
  const cupAt = v3(b.R + 34, b.hipY + b.spine + b.headUp - 6, -14);
  const tipAt = v3(b.R + 8, b.hipY + b.spine + b.headUp - 14, 8);
  const handL = cup <= 1 ? lerpV(rest, cupAt, ss(0, 1, cup)) : lerpV(cupAt, tipAt, clamp((cup - 1) / 0.15));
  const armL: Arm4 = cup > 0.02 ? {hand: handL, shape: cup > 0.6 ? (cup > 1.05 ? 'grip' : 'open') : undefined, pole: v3(1, -0.9, 0.1), wrist: -20} : p.armL;
  // he leans away from the voice as it starts, and back
  const lean = K(tau, [[1.6, 0], [D + 0.02, 0], [D + 0.15, -6], [D + 0.6, -2], [D + 1.6, 0]]) + K(tau, [[27.2, 0], [27.35, -3], [27.9, 0]]) + K(tau, [[31.93, 0], [32.05, -6], [32.6, -2], [33.4, 0]]);
  const pose: Pose4 = {...p, armL, hy, hp, hr, roll: p.roll + lean * 0.6, twist: 8 * clamp(hy / 60, -1, 1)};
  return {ground: LEAD_G, heading: LEAD_H, pose};
};

// ---------------------------------------------------------------- the friend (reads the placard, sips, is never bothered)
export const friendAt = (t: number): CharState => {
  const tau = tauOf(t), b = BODY_P;
  // + = her left, toward him
  const hy = K(tau, [[1.6, 30], [1.95, 34], [2.15, 40], [2.5, 30], [2.75, -8], [3.75, -8], [4.15, -6], [4.3, 34], [4.85, 30], [4.99, -6], [6.95, -6], [9.4, -6],
    [23.37, -6], [29.6, -6], [29.85, 30], [30.6, 26], [30.9, -6], [31.93, -6], [32.3, -6], [D + 0.02, -6], [D + 0.5, -6], [D + 0.9, 8], [D + 1.25, 30], [D + 1.6, 30]]);
  const hp = K(tau, [[1.6, 2], [2.6, 2], [2.8, 20], [3.75, 20], [4.25, 12], [4.3, 4], [4.9, 6], [5.1, 20], [23.37, 20], [29.6, 20], [29.85, 6], [30.8, 8], [31.0, 20], [D + 0.9, 20], [D + 1.25, 4], [D + 1.6, 2]]);
  const hr = K(tau, [[1.6, 6], [2.2, 10], [2.5, 4], [2.8, -4], [4.3, 6], [4.9, 4], [5.1, -4], [D + 1.25, 4], [D + 1.6, 6]]);
  const gx = K(tau, [[1.6, 0.4], [2.6, 0.3], [2.8, -0.1], [4.25, -0.1], [4.35, 0.6], [4.9, 0.5], [5.1, 0], [29.6, 0], [29.8, 0.7], [30.8, 0.5], [31.0, 0], [D + 1.0, 0], [D + 1.25, 0.4], [D + 1.6, 0.4]]);
  const fc = fmix(tau, [[1.6, FX.what], [2.1, FX.what], [2.5, FX.smirk], [2.8, FX.read], [4.25, FX.read], [4.35, FX.smirk], [4.95, FX.smirk], [5.1, FX.read], [29.6, FX.read], [29.85, FX.what], [30.9, FX.what], [31.1, FX.read],
    [D + 1.0, FX.read], [D + 1.25, FX.what], [D + 1.6, FX.what]]);
  const f: Face4 = {...fc, gx, blink: blinkAt(tau, [3.2, 5.8, 8.0, 24.3, 26.8, 29.1, 31.4, 33.5, D + 0.6])};
  const p = stand(b, f);
  p.pel = v3(-3 * cyc(t, 0.19, 2.2), b.hipY - 1 + 1.2 * cyc(t, 0.25, 0.3), 0);
  // the coffee in her right hand (outer side): sips
  const sip = Math.max(K(tau, [[3.85, 0], [4.05, 1], [4.2, 1], [4.3, 0]]), K(tau, [[7.3, 0], [7.55, 1], [7.9, 1], [8.15, 0]]), K(tau, [[25.0, 0], [25.3, 1], [25.7, 1], [25.95, 0]]),
    K(tau, [[32.9, 0], [33.15, 1], [33.45, 1], [33.7, 0]]), K(tau, [[D + 0.3, 0], [D + 0.55, 1], [D + 0.8, 1], [D + 0.95, 0]]));
  const hold = v3(-b.shW + 2, b.hipY + b.spine - 58, 44);
  const mouth = v3(-14, b.hipY + b.spine + b.headUp - 40, 50);
  const armR: Arm4 = {hand: lerpV(hold, mouth, sip), shape: 'grip', pole: v3(-0.6, -0.7, -0.5)};
  // her free hand rests on the case edge; a small palm-up "what?" at 2.0..2.5
  const what = K(tau, [[1.9, 0], [2.05, 1], [2.45, 1], [2.65, 0]]);
  const onCase = v3(b.shW - 6, b.hipY + b.spine - 120, 60);
  const palm = v3(b.shW + 26, b.hipY + b.spine - 90, 56);
  const armL: Arm4 = {hand: lerpV(onCase, palm, what), shape: what > 0.4 ? 'open' : 'mitt', pole: v3(0.5, -0.8, -0.4)};
  return {ground: FRIEND_G, heading: FRIEND_H, pose: {...p, armL, armR, hy, hp, hr, pitch: 4 + 4 * clamp(hp / 20, 0, 1)}};
};
export const FRIEND_CUP = -1; // the cup is in her right hand

// ---------------------------------------------------------------- the visitor who walks through the beam
// Straight from the back of the hall toward the front along x = BX, stopping in the beam's line to read a museum map.
// FA shifts the approach (solved so the body first cuts the beam on frame 815) and FB the walk-off (clear on 958).
export const BX = -1.9;
export const FA = 0.3499, FB = -0.2742;
const visitorPath = (fa: number, fb: number) => {
  const zStop = MACHINE.z + 0.02, v = 1.05;
  const tStop = 27.75 + fa, tGo = 31.5 + fb;
  const zAt = (tau: number) => {
    // decelerate over the last 1.0 m into the stop; accelerate away
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
export const visitorAt = (t: number, w: Walker = visitorWalker): CharState => {
  const tau = t; // only seen in S12 (no wrap)
  const b = BODY_P;
  const read = K(tau, [[27.25 + 0.0, 0], [27.7, 1], [30.75, 1], [31.15, 0]]);
  const f: Face4 = {...mix(FX.stroll, FX.map, read), blink: blinkAt(tau, [24.8, 26.4, 29.3, 32.0])};
  const s = walkPose(w, tau, {face: f, hy: K(tau, [[23, 8], [25, -10], [26.5, 12], [27.3, 0], [31.2, 0], [31.6, 14], [32.3, 8]]), hp: lerp(4, 22, read), armMix: 1 - read});
  // the map: both hands up in front of the chest while reading; folded in the right hand while walking
  const mapL = v3(34, b.hipY + b.spine - 40, 58), mapR = v3(-34, b.hipY + b.spine - 40, 58);
  const armL: Arm4 = read > 0.01 ? {hand: lerpV(s.pose.armL.hand, mapL, read), shape: 'grip', pole: v3(0.7, -0.7, -0.6)} : s.pose.armL;
  const armR: Arm4 = {hand: read > 0.01 ? lerpV(s.pose.armR.hand, mapR, read) : s.pose.armR.hand, shape: 'grip', pole: v3(-0.7, -0.7, -0.6)};
  return {ground: s.ground, heading: s.heading, pose: {...s.pose, armL, armR}};
};
export const visitorRead = (t: number) => kv(t, [[27.25, 0], [27.7, 1], [30.75, 1], [31.15, 0]]);

// ---------------------------------------------------------------- the crowd, behind them (exactly periodic over the film)
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
/** the fraction along the beam (0 = window, 1 = his ear) where it first meets one of these bodies */
export const beamStop = (bodies: CharState[], extra: [V3, V3, number][] = []) => {
  const caps = [...bodies.flatMap((s) => capsules(s)), ...extra];
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
