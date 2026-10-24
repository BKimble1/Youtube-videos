// V4 performance: where everyone is and what they do, as pure functions of time.
// Atrium time: the atrium is on screen at the start (sections A, B: film time 0..9) and at the end (F, G, H: 23.4..DUR).
// Both ends are one continuous take in *unrolled* time tau: tau = t for t >= 20, tau = t + DUR for t < 20. The film's
// last seconds and its first seconds are one walk of the two leads, which ends one atrium bay (BAY) further along x
// than it began; a frame at tau > DUR is therefore drawn with the leads shifted by -BAY (the hall is periodic in BAY
// where the seam is seen). The crowd's walkers each advance exactly one bay (plus whole wraps of their lane) over the
// film, so they loop with the same shift.
export {DUR};
import {DUR, clamp, lerp, ss, kv, cyc, T_BLOCK, T_CLEAR} from './core4';
import {v3, V3, cardToWorld, worldToCard, sub3, dot3, len3} from './rig/geo4';
import {BODY_P, GUESSER, CLERK, EXTRAS, Look4} from './rig/cast4';
import {makeWalker, walkPose, Walker} from './rig/walk4';
import {FACES, face, mix} from './rig/poses4';
import {joints4, Pose4, Face4} from './rig/Crew4';
import {BAY, ATR} from './atrium4';
import {exitRay} from './transmitter4';

export const tauOf = (t: number) => (t < 20 ? t + DUR : t);
export const shiftOf = (t: number) => (t < 20 ? -BAY : 0);

// ---------------------------------------------------------------- the atrium plan
export const LEAD_Z = 3.5, LSTOP = 0.0, X0 = -0.35; // frame 0: x = X0 walking; stops at LSTOP; the last frame: X0 + BAY
export const MACHINE = v3(-5.5, 1.36, -1.5); // the transmitter's pivot on its tripod (the demonstration stand)
export const V_WALK = 0.95;

// ---- keyed floor paths (Hermite through [tau, x, z]; Catmull-Rom tangents unless given; 'hold' keys have zero velocity)
type PK = {t: number; x: number; z: number; hold?: boolean; vx?: number; vz?: number};
const hpath = (keys: PK[]) => (t: number) => {
  const n = keys.length;
  if (t <= keys[0].t) return {x: keys[0].x, z: keys[0].z};
  if (t >= keys[n - 1].t) return {x: keys[n - 1].x, z: keys[n - 1].z};
  let i = 0;
  while (i < n - 2 && t > keys[i + 1].t) i++;
  const k0 = keys[i], k1 = keys[i + 1], h = k1.t - k0.t, s = (t - k0.t) / h;
  const tan = (j: number, c: 'x' | 'z') => {
    const k = keys[j];
    const given = c === 'x' ? k.vx : k.vz;
    if (given !== undefined) return given;
    if (j <= 0 || j >= n - 1 || k.hold) return 0;
    return (keys[j + 1][c] - keys[j - 1][c]) / (keys[j + 1].t - keys[j - 1].t);
  };
  const H = (c: 'x' | 'z') => (2 * s ** 3 - 3 * s ** 2 + 1) * k0[c] + (s ** 3 - 2 * s ** 2 + s) * h * tan(i, c) + (-2 * s ** 3 + 3 * s ** 2) * k1[c] + (s ** 3 - s ** 2) * h * tan(i + 1, c);
  return {x: H('x'), z: H('z')};
};

// ---- the lead: stands at LSTOP through F/G; at H_GO he walks off (with her), reaching X0 + BAY at tau = DUR at
// walking speed, and settles at LSTOP + BAY at DUR + 0.62 (= film time 0.62, where he stops at LSTOP).
export const H_GO = 32.25;
const leadPath = hpath([
  {t: 20, x: LSTOP, z: LEAD_Z, hold: true}, {t: H_GO, x: LSTOP, z: LEAD_Z, hold: true},
  {t: DUR, x: X0 + BAY, z: LEAD_Z, vx: V_WALK, vz: 0}, {t: DUR + 0.62, x: LSTOP + BAY, z: LEAD_Z, hold: true}, {t: DUR + 20, x: LSTOP + BAY, z: LEAD_Z, hold: true},
]);
export const leadWalker: Walker = makeWalker({path: leadPath, heading: () => 90, t0: 20, t1: DUR + 20, stepT: 0.43, b: BODY_P, half: 0.1, first: 'R', vMin: 0.08});

// ---- the friend: beside him on his right (+z) through the opening; in F she comes round behind him to look at the ear
// he keeps touching, and stands on his left, which is between his ear and the laser (blocked T_BLOCK..T_CLEAR); she
// steps back the way she came, round behind him to his right, and they walk off together into the loop.
export const FSTAND = {x: LSTOP + 0.12, z: LEAD_Z + 0.78};
// his left ear while standing (the transmitter is set up on it); where she stands to block the beam
export const EAR0 = v3(0.003, 1.347, 3.259);
const beamDir2 = (() => {
  const d = {x: EAR0.x - MACHINE.x, z: EAR0.z - MACHINE.z};
  const l = Math.hypot(d.x, d.z);
  return {x: d.x / l, z: d.z / l};
})();
export const BLOCK_SPOT = {x: EAR0.x - beamDir2.x * 0.58, z: EAR0.z - beamDir2.z * 0.58};
// her approach is shifted in time by FA (solved so the beam is cut exactly at T_BLOCK) and her step out by FB
// (solved so it is clear exactly at T_CLEAR); see solve4.ts
export const FA = 0.2247, FB = 0.0522;
const friendKeys = (fa: number, fb: number): PK[] => [
  {t: 20, x: FSTAND.x, z: FSTAND.z, hold: true},
  {t: 24.55 + fa, x: FSTAND.x, z: FSTAND.z, hold: true},
  {t: 25.5 + fa, x: -0.55, z: LEAD_Z + 0.72},
  {t: 26.45 + fa, x: -0.92, z: LEAD_Z + 0.05},
  {t: 27.35 + fa, x: BLOCK_SPOT.x, z: BLOCK_SPOT.z, hold: true},
  {t: 31.7 + fb, x: BLOCK_SPOT.x, z: BLOCK_SPOT.z, hold: true},
  {t: 32.35 + fb, x: -0.9, z: LEAD_Z + 0.35},
  {t: 33.15, x: -0.25, z: LEAD_Z + 0.85},
  {t: DUR, x: FSTAND.x + X0 - LSTOP + BAY - 0.05, z: FSTAND.z, vx: V_WALK, vz: 0},
  {t: DUR + 0.66, x: FSTAND.x + BAY, z: FSTAND.z, hold: true},
  {t: DUR + 20, x: FSTAND.x + BAY, z: FSTAND.z, hold: true},
];
export const makeFriendWalker = (fa = FA, fb = FB) => makeWalker({path: hpath(friendKeys(fa, fb)), t0: 20, t1: DUR + 20, stepT: 0.42, b: BODY_P, half: 0.095, first: 'L', vMin: 0.08});
export const friendWalker = makeFriendWalker();

// ---------------------------------------------------------------- performance tracks (film time)
const K = (t: number, keys: [number, number][]) => kv(t, keys);
export type CharState = {ground: V3; heading: number; pose: Pose4};
const fmix = (t: number, keys: [number, Face4][]): Face4 => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) return mix(keys[i - 1][1], keys[i][1], ss(keys[i - 1][0], keys[i][0], t));
  }
  return keys[keys.length - 1][1];
};
const blinkAt = (t: number, times: number[]) => Math.max(0, ...times.map((b) => clamp(1 - Math.abs(t - b) / 0.07)));
const talk = (t: number, a: number, b: number, amt = 0.45) => (t > a && t < b ? amt * Math.abs(Math.sin((t - a) * 17)) * ss(a, a + 0.05, t) * (1 - ss(b - 0.05, b, t)) : 0);

const F = {
  chat: face({brow: 0.25, mw: 16, curve: 0.75, squint: 0.2}),
  startle: face({brow: 0.95, browIn: 0.3, wide: 1, mw: 9, curve: -0.2, open: 0.35}),
  search: face({brow: 0.55, browIn: 0.65, wide: 0.6, mw: 10, curve: -0.25}),
  listen: face({brow: 0.7, browIn: 0.8, wide: 0.75, mw: 9, curve: -0.3, open: 0.12, asym: 0.4}),
  puzzled: face({brow: 0.4, browIn: 0.9, asym: 0.9, mw: 11, curve: -0.35, smirk: -0.3}),
  wow: face({brow: 1, browIn: 0.2, wide: 1, mw: 12, curve: 0.2, open: 0.55}),
  calm: face({brow: 0.1, mw: 14, curve: 0.45, lid: 0.15}),
  curious: face({brow: 0.45, browIn: 0.3, mw: 12, curve: 0.1, wide: 0.3}),
  concern: face({brow: 0.6, browIn: 0.85, mw: 11, curve: -0.15, wide: 0.35}),
};
export const LEAD_F = F;

/** the lead (film time) */
export const leadAt = (t: number): CharState => {
  const tau = tauOf(t), sh = shiftOf(t);
  // head yaw (+ = his left, toward the camera side and the laser), pitch (+ = down), roll
  const hy = K(t, [
    [0, -18], [0.42, -16], [0.56, 62], [0.95, 70], [1.35, 64], [1.65, -10], [2.0, -38], [2.5, -34], [3.3, -12], [3.6, 30], [4.4, 48], [5.1, 20], [5.6, 12], [6.9, 10], [7.5, 35], [8.6, 28], [9.5, 10],
    [23.3, 6], [23.95, 4], [24.25, 30], [24.9, 44], [25.6, 18], [26.3, -30], [26.9, -38], [27.17, -36], [27.28, 10], [27.6, 40], [28.4, 56], [29.5, 60], [30.4, 50], [31.0, 58], [31.9, 54], [31.95, 54], [32.08, 10], [32.4, -6], [33.1, -22], [DUR, -18],
  ]);
  const hp = K(t, [[0, 2], [0.5, 2], [0.62, -6], [1.2, -4], [1.7, 4], [3.5, 2], [5.0, 6], [6.8, 2], [23.3, 2], [27.2, 2], [27.35, -8], [28.2, 0], [31.95, 0], [32.05, -8], [32.6, 2], [DUR, 2]]);
  const hr = K(t, [[0, 0], [0.5, 0], [0.62, 10], [1.3, 6], [1.8, 0], [2.0, -8], [2.7, -10], [3.3, 0], [5.0, 8], [5.9, 12], [6.9, 4], [8, 0], [23.3, 6], [24.0, 14], [25.4, 12], [26.3, 4], [27.17, 6], [27.3, -4], [28, -2], [31.9, 4], [32.0, 14], [32.8, 10], [33.4, 2], [DUR, 0]]);
  const fc = fmix(t, [
    [0, F.chat], [0.42, F.chat], [0.52, F.startle], [1.0, F.search], [1.5, F.search], [1.75, F.listen], [2.8, F.listen], [3.4, F.puzzled], [4.4, F.search], [5.2, F.listen], [6.8, F.listen], [7.6, F.search], [9.5, F.search],
    [23.3, F.puzzled], [23.95, F.puzzled], [24.1, F.listen], [26.0, F.listen], [26.6, F.concern], [27.17, F.concern], [27.24, F.startle], [27.9, F.puzzled], [31.0, F.puzzled], [31.9, F.puzzled], [31.97, F.wow], [32.7, F.listen], [33.3, F.chat], [DUR, F.chat],
  ]);
  const f: Face4 = {...fc, open: fc.open + talk(t, 1.62, 2.05, 0.4) + talk(t, 33.35, 33.75, 0.3), blink: blinkAt(t, [1.58, 3.45, 6.2, 8.1, 23.6, 26.1, 29.0, 30.9, 33.2])};
  // his left hand up to his ear (5.0..6.9 "nothing in your ears"; 24..26 when the voice comes back; 29..30.6; 32..33)
  const hand = K(t, [[0, 0], [23.9, 0], [24.3, 1], [26.1, 1], [26.6, 0], [28.6, 0], [29.0, 0.55], [30.6, 0.55], [31.0, 0], [32.0, 0], [32.25, 0.8], [32.8, 0.8], [33.2, 0]]);
  const walk = walkPose(leadWalker, tau, {face: f, hy, hp, hr});
  const b = BODY_P;
  const ear = v3(b.R + 20, b.hipY + b.spine + b.headUp - 10, -24);
  const rest = walk.pose.armL.hand;
  const armL = hand > 0.001 ? {hand: v3(lerp(rest.x, ear.x, hand), lerp(rest.y, ear.y, hand), lerp(rest.z, ear.z, hand)), shape: hand > 0.5 ? ('open' as const) : undefined, pole: v3(0.9, -0.4, -0.3)} : walk.pose.armL;
  return {ground: v3(walk.ground.x + sh, 0, walk.ground.z), heading: 90, pose: {...walk.pose, armL, twist: walk.pose.twist + 9 * clamp(hy / 60, -1, 1)}};
};

/** the friend (film time) */
export const friendAt = (t: number, w: Walker = friendWalker): CharState => {
  const tau = tauOf(t), sh = shiftOf(t);
  const hy = K(t, [[0, 18], [0.6, 20], [1.0, 30], [1.6, 46], [2.6, 40], [3.0, 8], [3.6, 30], [4.6, 40], [9.5, 30], [23.3, 32], [24.4, 40], [24.6, 0], [26.6, 0], [27.3, 0], [28.0, 6], [29.2, -8], [30.5, 10], [31.6, 6], [32.2, 30], [33.3, 30], [DUR, 18]]);
  const hp = K(t, [[0, 3], [2.9, 3], [3.1, -10], [3.4, -12], [3.7, 2], [9, 2], [27.3, 2], [27.6, 10], [30.8, 8], [31.4, 2], [DUR, 3]]);
  const hr = K(t, [[0, -4], [1.6, -10], [2.6, -6], [3.0, 0], [4, -8], [27.3, 0], [27.6, -12], [30.8, -10], [31.3, 0], [33, -6], [DUR, -4]]);
  const fc = fmix(t, [[0, F.chat], [1.0, F.calm], [1.6, F.curious], [2.7, F.calm], [3.6, F.curious], [9.5, F.curious], [23.3, F.curious], [24.4, F.concern], [27.3, F.curious], [29.0, F.calm], [30.6, F.curious], [31.6, F.concern], [32.2, F.wow], [33.0, F.chat], [DUR, F.chat]]);
  const f: Face4 = {...fc, open: fc.open + talk(t, 0.05, 0.4, 0.35) + talk(t, 24.45, 24.95, 0.35), blink: blinkAt(t, [0.9, 2.2, 4.1, 7.0, 24.9, 28.2, 30.1, 32.8])};
  const b = BODY_P;
  // the cup in her left hand: a sip at 3.0..3.5
  const sip = K(t, [[0, 0], [2.85, 0], [3.1, 1], [3.45, 1], [3.75, 0]]);
  const hold = v3(b.shW - 4, b.hipY + b.spine - 52, 46);
  const mouth = v3(10, b.hipY + b.spine + b.headUp - 40, 52);
  const cupHand = v3(lerp(hold.x, mouth.x, sip), lerp(hold.y, mouth.y, sip), lerp(hold.z, mouth.z, sip));
  // in G she leans in to look at his ear: right hand up to her glasses
  const peer = K(t, [[0, 0], [27.4, 0], [27.9, 1], [30.7, 1], [31.3, 0]]);
  const walk = walkPose(w, tau, {face: f, hy, hp, hr, lean: 6 * peer, armL: {hand: cupHand, shape: 'grip', pole: v3(0.6, -0.7, -0.5)}});
  const armR = peer > 0.001 ? {hand: v3(lerp(walk.pose.armR.hand.x, -30, peer), lerp(walk.pose.armR.hand.y, b.hipY + b.spine + 20, peer), lerp(walk.pose.armR.hand.z, 40, peer)), shape: 'open' as const} : walk.pose.armR;
  // standing beside him she turns a little toward him
  const standTurn = (1 - clamp(walk.speed / 0.25)) * K(t, [[0, 0], [0.8, 0], [1.4, -25], [9.5, -25], [23.3, -25], [24.5, -25], [24.6, 0], [DUR, 0]]);
  return {ground: v3(walk.ground.x + sh, 0, walk.ground.z), heading: walk.heading + standTurn, pose: {...walk.pose, armR, face: f}};
};

// ---------------------------------------------------------------- the crowd (loops with a one-bay shift)
export const W_LANE = 18 * BAY;
const V_POS = (BAY + W_LANE) / DUR, V_NEG = (BAY - W_LANE) / DUR;
const STEP_T = DUR / 86;
export type Extra = {look: Look4; z: number; y: number; x0: number; dir: 1 | -1; w: Walker; ph: number; i: number};
const LANES: [number, number, number, 1 | -1][] = [
  // z, floor y, start x, direction
  [5.05, 0, -6.5, 1], [5.05, 0, 7.5, 1], [6.35, 0, 3.0, -1], [6.35, 0, -11.0, -1], [7.2, 0, -2.0, 1], [7.2, 0, 12.0, 1],
  [9.3, 0, 9.0, -1], [9.3, 0, -5.0, -1], [10.2, 0, 1.0, 1], [10.9, 0, -9.0, -1], [10.9, 0, 6.5, -1],
  [12.6, ATR.yGal + 0.1, -3.0, 1], [13.2, ATR.yGal + 0.1, 6.0, -1], [12.9, ATR.yGal + 0.1, 15.0, 1],
];
export const EXTRA_LIST: Extra[] = LANES.map(([z, y, x0, dir], i) => {
  const v = dir > 0 ? V_POS : V_NEG;
  const w = makeWalker({path: (t) => ({x: x0 + v * t, z}), heading: () => (dir > 0 ? 90 : -90), t0: -3, t1: DUR + 3, stepT: STEP_T, phase: (i * 0.137) % STEP_T, b: BODY_P, half: 0.09});
  return {look: EXTRAS[i % EXTRAS.length], z, y, x0, dir, w, ph: i * 1.3, i};
});
/** the crowd at time t: ground (wrapped into the lane around the hall's centre), heading, pose */
export const extraAt = (e: Extra, t: number): CharState => {
  const s = walkPose(e.w, t, {face: face({gx: 0.3 * cyc(t, 0.07, e.ph), brow: 0.1, curve: 0.4}), hy: 22 * cyc(t, 0.05, e.ph)});
  const X = s.ground.x, wrapped = X - W_LANE * Math.round(X / W_LANE);
  return {ground: v3(wrapped, e.y, s.ground.z), heading: s.heading, pose: s.pose};
};

// ---------------------------------------------------------------- geometry helpers
/** world position of a character's ear (side +1 = their left) */
export const earOf = (s: CharState, side = 1, b = BODY_P): V3 => {
  const j = joints4(b, s.pose);
  const e = v3(j.Hc.x + j.hx.x * b.R * side, j.Hc.y + j.hx.y * b.R * side - 6, j.Hc.z + j.hx.z * b.R * side);
  return cardToWorld(s.ground, s.heading, e);
};
export const headOf = (s: CharState, b = BODY_P): V3 => cardToWorld(s.ground, s.heading, joints4(b, s.pose).Hc);
/** the transmitter's aim (yaw, pitch) toward a world point */
export const aimAt = (from: V3, to: V3) => {
  const d = v3(to.x - from.x, to.y - (from.y + 0.1), to.z - from.z);
  return {yaw: (Math.atan2(d.x, d.z) * 180) / Math.PI, pitch: (Math.atan2(d.y, Math.hypot(d.x, d.z)) * 180) / Math.PI};
};
/** the atrium transmitter is set up on his standing ear (it does not track him) */
export const AIM = aimAt(MACHINE, EAR0);
export const BEAM = (() => {
  const r = exitRay(MACHINE, AIM.yaw, AIM.pitch);
  return {o: r.o, end: EAR0};
})();
/** distance from point p to the segment a-b */
export const segDist = (p: V3, a: V3, b: V3) => {
  const ab = sub3(b, a), ap = sub3(p, a);
  const u = clamp(dot3(ap, ab) / dot3(ab, ab));
  return len3(sub3(ap, v3(ab.x * u, ab.y * u, ab.z * u)));
};
/** where the atrium beam ends: the fraction along it (0 = window, 1 = his ear) of the first body it meets */
export const beamStop = (bodies: CharState[], b = BODY_P) => {
  const a = BEAM.o, e = BEAM.end;
  let best = 1;
  for (const s of bodies) {
    const j = joints4(b, s.pose);
    const Wd = (p: V3) => cardToWorld(s.ground, s.heading, p);
    const caps: [V3, V3, number][] = [[Wd(j.Hc), Wd(j.Hc), (b.R + 4) / 267], [Wd(j.P), Wd(j.S), 0.16], [Wd(j.S), Wd(j.Hc), 0.07], [Wd(j.SL), Wd(j.WL), 0.06], [Wd(j.SR), Wd(j.WR), 0.06]];
    for (let k = 0; k <= 400; k++) {
      const u = k / 400;
      if (u >= best) break;
      const p = v3(a.x + (e.x - a.x) * u, a.y + (e.y - a.y) * u, a.z + (e.z - a.z) * u);
      if (caps.some(([c0, c1, r]) => segDist(p, c0, c1) < r)) { best = u; break; }
    }
  }
  return best;
};
/** does a character's body cut the atrium beam short of his ear? (head sphere, neck, torso capsule, arms) */
export const blocks = (s: CharState, b = BODY_P) => {
  const j = joints4(b, s.pose);
  const Wd = (p: V3) => cardToWorld(s.ground, s.heading, p);
  const a = BEAM.o, e = BEAM.end, L = len3(sub3(e, a));
  const end = v3(e.x - ((e.x - a.x) * 0.08) / L, e.y - ((e.y - a.y) * 0.08) / L, e.z - ((e.z - a.z) * 0.08) / L);
  const seg = (p: V3, q: V3, r: number) => {
    for (let k = 0; k <= 8; k++) {
      const u = k / 8;
      if (segDist(Wd(v3(p.x + (q.x - p.x) * u, p.y + (q.y - p.y) * u, p.z + (q.z - p.z) * u)), a, end) < r) return true;
    }
    return false;
  };
  return seg(j.Hc, j.Hc, (b.R + 4) / 267) || seg(j.P, j.S, 0.16) || seg(j.S, j.Hc, 0.07) || seg(j.SL, j.WL, 0.06) || seg(j.SR, j.WR, 0.06);
};
export {GUESSER, CLERK, BODY_P, mix, FACES, lerp, clamp, ss, kv, T_BLOCK, T_CLEAR, worldToCard};
