// Section D3 machines: PURE specs (no React, no continuity import) — imported by the shots and by ./persist.ts.
//
//   heavy 1 (HEAVIES_B[0], id 3101)  D2's walk to its halt (121.0) — blinded on the way (the flare and the allied drone,
//            119.38), a blind swipe of the ram at where the drone hung (119.9); then it swings round to its right toward
//            the drone's noise at the girder (heading 245 → 325, stepping), its front-left shin is clamped and the cable
//            wrapped round girder post 3 (pinned 122.9; it tries to step back and is held, 123.08); the Director's plate
//            draws its head and its ram slams the slope short of him (124.05); the breaker splits its rear-left knee
//            (124.75): it rolls onto its left side, across the crater's north part, and crashes (126.25). The wreck stays
//            (PERSIST_D3 'd3_heavy1': E/F and D4 draw it instead of the tableau's fallback).
//   heavy 2 (HEAVIES_B[2] at rest (146, −10); drawn as the tableau's 7401 from the start of D3)  sent forward at
//            117.0: up the north sidewalk, down under the girder's east end into the crater, onto D4's line (heading
//            262) at (70.0, −4.8); its legs step OVER heavy 1's wreck (143–147.5, the front-left comes down at
//            EV3.stomp); its launcher fires at the rim (145.18); it walks on at 2.1 m/s into D4's start (55.5, −2.76).
//            Its four feet are keyed (lateral sequence) so that at 149.86 they are exactly D4's (heavy2At).
//   the arc  the 27 units D4 starts with (start.ts ARC_START, tableau ids): 7 are D2's survivors (U8, R1, R3–R7: they
//            back off into the crater's south-east at P3, clear of the attack), 20 come down from the vanguard's front
//            ranks (from 123.2: the system moves up as heavy 1 is pinned). After the crash they stand in one LINE across
//            the crater (x ≈ 58.3, shoulder to shoulder); at FORMATION the line bends into an ARC round the Crew on the
//            rim (ripple from the middle out); at DECOY_FAIL they advance on the source (through the light figures);
//            they hold; after the blast they press in to exactly D4's start (ARC_START positions and walk headings).
//   drones   the tableau's eight (TB_DRONES ids): 7605 climbs above the dust at ADAPT and locks on; 7601 dives on the
//            decoy maker's tablet (136.35); 7602 cuts the tether cable (138.95) with 7603 swarming the girder flank;
//            7604 and 7607 run the allied drone down (141.35); all end at D4's first keys (droneD4 at 149.86).
import type {UnitSpec, HeavySpec, DroneSpec, Path} from '../../mech';
import {heavyAttach, unitAttach} from '../../mech';
import {V3, clamp, smooth, lerp, rnd, easeIn, easeOut, add3, sub3, mul3, norm3} from '../../../kit/math';
import {M} from '../../timing';
import {EV3} from './times';
import {XZ, KP, KR, G, onG, keyRoot, footAt, autoSteps, runDist, runSpeed, cruise, linePath, pathLen, fwdOf, rightOf, headingTo, wrapD, win, after, heavyStance} from '../D4/motion';
import {heavy1, unitD2, ANCHOR} from '../D2/machines';
import {D1_ARMY_IDS} from '../D1/machines';
import {armyUnits, HEAVIES_B} from '../B/army';
import {ARC_START} from '../D4/start';
import {NAMED as D4_NAMED, RING_PLANS, unitAt as d4UnitAt, heavy2At, droneD4, dirHeadAt, DRONE_IDS as D4_DRONES} from '../D4/machines';

const ground = G;
const lerp3s = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
const hv = (h: number): V3 => ({x: Math.sin((h * Math.PI) / 180), y: 0, z: -Math.cos((h * Math.PI) / 180)});
const on = (p: XZ, up = 0): V3 => onG(p.x, p.z, up);
const norm360 = (h: number) => ((h % 360) + 360) % 360;
type K4 = [number, number, number, number];
/** smooth (Catmull-Rom, time-scaled tangents) through [t, x, y, z] keys */
const spl = (k: K4[], t: number, ax: 1 | 2 | 3) => {
  const n = k.length;
  if (t <= k[0][0]) return k[0][ax];
  if (t >= k[n - 1][0]) return k[n - 1][ax];
  let i = 0;
  while (i < n - 2 && t > k[i + 1][0]) i++;
  const p0 = k[Math.max(0, i - 1)], p1 = k[i], p2 = k[i + 1], p3 = k[Math.min(n - 1, i + 2)];
  const u = (t - p1[0]) / (p2[0] - p1[0]);
  const m1 = ((p2[ax] - p0[ax]) / Math.max(1e-3, p2[0] - p0[0])) * (p2[0] - p1[0]);
  const m2 = ((p3[ax] - p1[ax]) / Math.max(1e-3, p3[0] - p1[0])) * (p2[0] - p1[0]);
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1[ax] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[ax] + (u3 - u2) * m2;
};
const splV = (k: K4[], t: number): V3 => ({x: spl(k, t, 1), y: spl(k, t, 2), z: spl(k, t, 3)});

// ================================================================== the allied drone (checker's) — D3's flight
// From D2's last key (hovering over the regroup, damaged): it darts at heavy 1's sensor head and hangs in its face
// (118.95), climbs away from the swipe (119.28), draws the blind head round toward the girder, follows the fight, comes
// back over the Crew; at ALLY_DRONE_LOST it flees two hunters low over the rim and is struck (EV3.kill).
const H1_EYE_AT = (t: number) => heavyAttach(heavy1(t)).eye;
const EYE_FRONT = (t: number, d = 1.55, up = 0.15): V3 => {
  const h = heavy1(t), p = h.gait!.path(h.gait!.dist), e = H1_EYE_AT(t), f = hv(p.heading);
  return {x: e.x + f.x * d, y: e.y + up, z: e.z + f.z * d};
};
export const ALLY3_KEYS: K4[] = (() => {
  const a = EYE_FRONT(EV3.allyAtEye), b = EYE_FRONT(EV3.allyDodge, 1.45, 0.2);
  return [
    [M.P3, 47.9, 2.42, -5.6], [117.55, 47.92, 2.5, -5.58], [117.95, 49.6, 2.75, -5.4], [118.45, 55.0, 2.6, -5.0],
    [EV3.allyAtEye, a.x, a.y, a.z], [EV3.allyDodge, b.x, b.y, b.z], [119.62, b.x - 0.4, b.y + 2.6, b.z - 2.2],
    [120.4, 58.6, 5.6, -9.6], [121.3, 58.0, 5.2, -11.6], [122.4, 55.6, 4.6, -11.0], [123.6, 53.0, 4.4, -8.6],
    [125.0, 51.5, 4.6, -6.2], [126.6, 50.0, 4.3, -4.6], [128.5, 48.6, 3.7, -3.0], [130.5, 47.6, 3.3, -2.2],
    [133.0, 46.9, 3.1, -2.8], [135.5, 47.4, 3.4, -2.0], [137.5, 46.6, 3.2, -3.4], [139.4, 46.2, 3.0, -2.6],
    // the hunt: it banks away south-west low over the rim, the two hunters closing
    [140.5, 45.9, 3.0, -2.4], [140.85, 44.6, 2.6, -1.0], [141.15, 43.4, 2.2, 0.6], [EV3.kill, 42.9, 2.05, 1.3],
  ];
})();
export const ALLY_KILL_DIR: V3 = norm3({x: -0.55, y: -0.35, z: 0.75});
/** the allied drone's centre (before it is struck), for looks and aiming */
export const allyAt = (t: number): V3 => splV(ALLY3_KEYS, Math.min(t, EV3.kill));
/** the allied drone's flight pose from D3's keys (heading from velocity, nose-down with speed, bank into turns) */
export const allyPose3 = (t: number): {pos: V3; heading: number; pitch: number; roll: number; speed: number} => {
  const at = (q: number) => splV(ALLY3_KEYS, q);
  const p = at(t), v = mul3(sub3(at(t + 0.08), at(t - 0.08)), 6.25);
  const sp = Math.hypot(v.x, v.z);
  const hvd = (q: V3) => (Math.atan2(q.x, -q.z) * 180) / Math.PI;
  const face = t > 118.7 && t < 119.3 ? sub3(H1_EYE_AT(t), p) : null;
  let heading = sp > 0.5 ? hvd(v) : face ? hvd(face) : hvd(sub3(at(t + 0.6), at(t - 0.6)));
  if (face && sp < 2.5) heading = hvd(face);
  const v2 = sub3(at(t + 0.25), at(t)), v1 = sub3(at(t), at(t - 0.25));
  const turn = ((hvd(v2) - hvd(v1) + 540) % 360) - 180;
  const roll = sp > 0.5 ? clamp(-turn * 0.6, -28, 28) : 0;
  const bob = 0.035 * Math.sin(t * 3.1 + 3) + 0.02 * Math.sin(t * 5.3 + 6);
  return {pos: add3(p, {x: 0, y: bob, z: 0}), heading, pitch: -clamp(sp * 3.2, 0, 26), roll, speed: sp};
};
/** the pilot's ground and where the wreck lands is computed by the FX (allyDrone destroyAt); its ground height there */
export const ALLY_CRASH_GROUND = G(42.2, 2.35);

// ================================================================== HEAVY 1
const H1_HALT = (() => { const h = heavy1(EV3.turn0); const p = h.gait!.path(h.gait!.dist); return {x: p.pos.x, z: p.pos.z, h: norm360(p.heading)}; })();
/** after the swing round: a little back toward the girder's foot, nose toward the girder */
export const H1_AT = {x: H1_HALT.x + 0.55, z: H1_HALT.z - 0.15, h: 325};
const H1_ROOT: KR[] = [[EV3.turn0, H1_HALT.x, H1_HALT.z, H1_HALT.h], [121.85, H1_HALT.x + 0.3, H1_HALT.z - 0.05, 288], [EV3.turn1, H1_AT.x, H1_AT.z, H1_AT.h]];
/** the four feet at the halt (ground contact under the kit's ankles) */
const H1_FEET0: XZ[] = heavyAttach(heavy1(EV3.turn0)).feet.map((f) => ({x: f.x, z: f.z}));
/** quadruped steps from given footholds over a keyed root (lateral sequence; the last cycle sets the final stance) */
const quadFrom = (start: XZ[], root: KR[], cyc: number, lift = 0.55, order = [0, 3, 1, 2]): KP[][] => {
  const legs: KP[][] = start.map((p) => [[root[0][0], p.x, p.z] as KP]);
  for (let s = 1; s < root.length; s++) {
    const a = root[s - 1], b = root[s], dt = b[0] - a[0];
    const n = Math.max(1, Math.round(dt / cyc)), c = dt / n, sw = c / 4;
    for (let ci = 0; ci < n; ci++) order.forEach((i, j) => {
      const t0 = a[0] + ci * c + j * sw, t1 = t0 + sw * 0.92;
      const at = s === root.length - 1 && ci === n - 1 ? b[0] : Math.min(b[0], t1 + c * 0.35);
      const rp = keyRoot(root, at);
      const p = heavyStance(rp.p.x, rp.p.z, rp.h, i);
      const L = legs[i];
      L.push([t0, L[L.length - 1][1], L[L.length - 1][2]], [t1, p[0], p[1], lift]);
    });
    legs.forEach((L) => L.push([b[0], L[L.length - 1][1], L[L.length - 1][2]]));
  }
  return legs;
};
/** heavy 1's keyed footholds after its halt (the swing round and the yank) */
export const H1_LEGS: KP[][] = (() => {
  const L = quadFrom(H1_FEET0, H1_ROOT, 0.85, 0.5);
  // the pinned front-left: it tries to step back (south-east, away from the girder) and the cable holds it
  const f = L[0][L[0].length - 1];
  const back = {x: f[1] + 0.32, z: f[2] + 0.36};
  L[0].push([EV3.yank, f[1], f[2]], [EV3.yank + 0.2, back.x, back.z, 0.42], [EV3.yank + 0.42, f[1] + 0.05, f[2] + 0.04, 0]);
  return L;
})();
/** the pinned front-left shin: where the clamp bites (on the lower leg, ~1.5 m above the foot) */
export const h1ClampPt = (T: number): V3 => {
  const h = heavy1D3(Math.min(T, EV3.knee));
  const a = heavyAttach(h);
  return lerp3s(a.knees[0], a.feet[0], 0.55);
};
/** the Director's bait spot on the slope west of it (he bangs the plate; the ram comes down short of him) */
export const DIR_BAIT = {x: 57.0, z: -9.4};
export const RAM2_AT: V3 = (() => {
  const p = {x: 59.4, z: -8.4};
  return {x: p.x, y: G(p.x, p.z) + 0.12, z: p.z};
})();
/** heavy 1's head swinging blind after the flash: up and away, then sweeping */
const blindLook = (T: number, eye: V3, h: number): V3 => {
  const f = hv(h), r = {x: -f.z, y: 0, z: f.x};
  if (T < EV3.flash + 0.35) {
    const k = smooth((T - EV3.flash) / 0.25);
    return {x: eye.x + f.x * 4 + r.x * 3 * k, y: eye.y + 2 + 6 * k, z: eye.z + f.z * 4 + r.z * 3 * k};
  }
  const s = Math.sin((T - EV3.flash - 0.35) * 4.2);
  return {x: eye.x + f.x * 6 + r.x * 5 * s, y: eye.y + 1.5 - 1.0 * Math.abs(s), z: eye.z + f.z * 6 + r.z * 5 * s};
};
/** the eye washed out by the flash: dark, then flickering back (machines see through it again by ~120.7) */
const blindEye = (T: number): 'amber' | 'off' => {
  if (T < EV3.flash || T > 120.75) return 'amber';
  if (T < EV3.flash + 0.22) return 'off';
  return rnd(Math.floor(T * 22) * 7 + 3) > 0.45 ? 'amber' : 'off';
};
const DIR_HEAD_BAIT: V3 = on(DIR_BAIT, 1.6);
export const heavy1D3 = (T: number): HeavySpec => {
  // the ram's two blows: the swipe at the drone, then the slam at the Director
  const ram = T < 121.95 ? {t0: EV3.ram1, target: splV(ALLY3_KEYS, EV3.allyDodge - 0.04)} : {t0: EV3.ram2, target: RAM2_AT};
  const base: HeavySpec = {
    id: HEAVIES_B[0].id, t: T, pos: {x: 0, y: 0, z: 0}, heading: 0, ground, key: 'd3hv1', ram,
    damage: {plateL: {t0: EV3.land + 0.03, dir: {x: -0.75, y: 0.35, z: 0.55}}, dead: {t0: EV3.land + 0.1}},
    kneeBreak: {t0: EV3.knee, leg: 2, dir: {x: 0.45, y: 0, z: 0.89}},
    pinned: {t0: EV3.taut, leg: 0, hold: true},
  };
  if (T < EV3.turn0) {
    const h = heavy1(T);
    const p = h.gait!.path(h.gait!.dist);
    const eye = H1_EYE_AT(T);
    const look = T < 117.85 ? h.look : T < EV3.flash ? allyAt(T) : blindLook(T, eye, p.heading);
    // the blind swipe pulls it forward off its stride
    return {...h, ...base, pos: h.pos, heading: h.heading, gait: h.gait, look, eye: blindEye(T), lockAt: undefined, fire: undefined, kneeBreak: undefined, damage: undefined,
      stumble: {t0: EV3.ram1 + 0.05, dir: hv(p.heading + 20), strength: 0.7}};
  }
  const tt = Math.min(T, EV3.knee);
  const r = keyRoot(H1_ROOT, tt);
  const feet = H1_LEGS.map((k) => footAt(k, tt, 0.5));
  // looks: toward the drone's noise at the girder (it turns to it), then the Director's bangs draw the head west
  const lookT = tt < EV3.bang1 ? allyAt(tt) : DIR_HEAD_BAIT;
  const eye = H1_EYE_AT(EV3.turn0);
  const look = tt < 121.5 ? lerp3s(blindLook(tt, eye, r.h), allyAt(tt), smooth((tt - 121.0) / 0.5)) : lookT;
  // the yank: the hull lurches as the held leg is pulled back down
  const lurch = win(tt, EV3.yank + 0.15, EV3.yank + 0.9, 0.08, 0.5);
  return {
    ...base, pos: {x: r.p.x, y: 0, z: r.p.z}, heading: r.h, feet, look, eye: blindEye(tt),
    stumble: {t0: EV3.yank + 0.2, dir: hv(r.h + 140), strength: 0.45},
    drop: 0.18 * lurch,
  };
};
/** heavy 1 at the moment the knee splits (the frozen rig the topple rotates), and its wreck at rest */
export const H1_BREAK = () => heavyAttach(heavy1D3(EV3.knee - 0.001));
export const H1_WRECK = () => heavyAttach(heavy1D3(EV3.land + 2));
/** the wreck's footprint: its hull centre, long axis (unit, along the old heading), half-length, half-width */
export const H1_FOOT = (() => {
  let c: V3 | null = null;
  return () => {
    if (!c) c = H1_WRECK().hull;
    const f = hv(H1_AT.h);
    return {c: c!, axis: f, hl: 3.3, hw: 1.6};
  };
})();
/** distance (m) from a ground point to the wreck's footprint (negative inside); `body` = the hull alone (a heavy's
 *  foot may come down right beside it), else the whole wreck with its folded legs and head */
export const wreckDist = (p: XZ, body = false): number => {
  const w = H1_FOOT();
  const dx = p.x - w.c.x, dz = p.z - w.c.z;
  const a = dx * w.axis.x + dz * w.axis.z, s = -dx * w.axis.z + dz * w.axis.x;
  return body ? Math.max(Math.abs(a + 0.3) - 2.6, Math.abs(s) - 1.15) : Math.max(Math.abs(a) - w.hl, Math.abs(s) - w.hw);
};
/** the units' wrecks on the rim and its slopes (D1, D2): ground centres, for paths that step over them */
export const UNIT_WRECKS: XZ[] = [
  {x: 51.4, z: -9.1}, {x: 51.65, z: -9.0}, {x: 51.6, z: -6.43}, {x: 51.9, z: -6.24}, {x: 49.24, z: -9.6}, {x: 49.05, z: -9.19},
  {x: 49.33, z: -5.04}, {x: 49.22, z: -4.62}, {x: 50.14, z: -5.54}, {x: 48.44, z: -1.97}, {x: 48.66, z: -2.1}, {x: 47.6, z: -1.5},
  {x: 40.94, z: -2.7}, {x: 41.6, z: -1.84}, {x: 40.82, z: -3.82}, {x: 41.32, z: -2.84}, {x: 40.81, z: 3.76}, {x: 41.87, z: 4.08},
];
/** does a polyline pass over a unit wreck (within r)? */
export const overWreck = (pts: XZ[], r = 0.75): boolean => {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(2, Math.ceil(L / 0.3));
    for (let k = 0; k <= n; k++) { const u = k / n, x = lerp(a.x, b.x, u), z = lerp(a.z, b.z, u); if (UNIT_WRECKS.some((w) => Math.hypot(w.x - x, w.z - z) < r)) return true; }
  }
  return false;
};

// ================================================================== HEAVY 2 (tableau 7401; HEAVIES_B[2] at rest)
const H2_SRC = HEAVIES_B[2];
const LINE_F = hv(262);
const onLine = (x: number): XZ => { const s = (x - 55.5) / LINE_F.x; return {x, z: -2.76 + LINE_F.z * s}; };
const H2_PTS: XZ[] = [{x: H2_SRC.rest.x, z: H2_SRC.rest.z}, {x: 143.0, z: -15.3}, {x: 90.0, z: -15.6}, {x: 79.5, z: -14.2}, {x: 75.0, z: -9.6}, onLine(70.0), {x: 55.5, z: -2.76}, onLine(25.8)];
const H2_PATH = linePath(H2_PTS, 2.6);
const H2_DEND = pathLen(H2_PTS.slice(0, 7));
/** speed profile: from rest at H2_T0 (accelerating over A), cruise vmax, slowing to D4's 2.1 m/s by H2_TC */
const H2_T0 = 117.0, H2_A = 2.2, H2_TD = 138.8, H2_TC = 141.0, H2_VC = 2.1;
const H2_VMAX = (H2_DEND - H2_VC * (M.P4 - H2_TC) - (H2_VC * (H2_TC - H2_TD)) / 2) / (H2_A / 2 + (H2_TD - H2_T0 - H2_A) + (H2_TC - H2_TD) / 2);
export const h2Dist = (T: number): number => {
  if (T <= H2_T0) return 0;
  const u1 = H2_T0 + H2_A;
  if (T < u1) return (H2_VMAX * (T - H2_T0) ** 2) / (2 * H2_A);
  const d1 = (H2_VMAX * H2_A) / 2;
  if (T < H2_TD) return d1 + H2_VMAX * (T - u1);
  const d2 = d1 + H2_VMAX * (H2_TD - u1);
  if (T < H2_TC) { const u = T - H2_TD, D = H2_TC - H2_TD; return d2 + H2_VMAX * u - ((H2_VMAX - H2_VC) * u * u) / (2 * D); }
  const d3 = d2 + ((H2_VMAX + H2_VC) / 2) * (H2_TC - H2_TD);
  return d3 + H2_VC * (T - H2_TC);
};
export const h2Speed = (T: number) => (h2Dist(T + 0.02) - h2Dist(T - 0.02)) / 0.04;
export const h2Root = (T: number): {x: number; z: number; h: number} => {
  const p = H2_PATH(h2Dist(T));
  return {x: p.pos.x, z: p.pos.z, h: norm360(p.heading)};
};
/**
 * heavy 2's keyed feet: the lateral sequence (FL, RR, FR, RL) at a cadence tied to its speed, generated back from
 * 149.86 so that the last landings before the cut are exactly D4's first footholds; a step whose swing passes over heavy
 * 1's wreck lifts high (a step OVER it) and lands clear of it.
 */
const H2_ORDER = [0, 3, 1, 2];
const H2_C0 = (165.95 - M.P4) / Math.max(1, Math.round((165.95 - M.P4) / 1.45));
export const H2_LEGS: KP[][] = (() => {
  const S4 = heavy2At(M.P4).feet!.map((f) => ({x: f!.x, z: f!.z}));
  // cycle starts back from P4
  const taus: number[] = [];
  let tau = M.P4;
  while (tau > H2_T0 + 0.6) {
    const v = Math.max(0.6, h2Speed(tau - 0.5));
    tau -= Math.min(2.4, H2_C0 * (H2_VC / v));
    if (tau > H2_T0 + 0.3) taus.push(tau);
  }
  taus.reverse();
  const r0 = h2Root(H2_T0);
  const legs: KP[][] = [0, 1, 2, 3].map((i) => [[H2_T0 - 1, ...heavyStance(r0.x, r0.z, r0.h, i)] as KP]);
  /** a landing never on the wreck's hull: pushed on past it, or held short of it, whichever keeps the step a step */
  const clearOf = (prev: XZ, p: XZ, dir: XZ): XZ => {
    if (wreckDist(p, true) > 0.35) return p;
    let f = {...p}, b = {...p};
    for (let k = 0; k < 40 && wreckDist(f, true) < 0.4; k++) f = {x: f.x + dir.x * 0.2, z: f.z + dir.z * 0.2};
    for (let k = 0; k < 40 && wreckDist(b, true) < 0.4; k++) b = {x: b.x - dir.x * 0.2, z: b.z - dir.z * 0.2};
    const lf = Math.hypot(f.x - prev.x, f.z - prev.z), lb = Math.hypot(b.x - prev.x, b.z - prev.z);
    return lf < 4.3 ? f : lb > 0.5 ? b : f;
  };
  taus.forEach((t, ci) => {
    const next = ci < taus.length - 1 ? taus[ci + 1] : M.P4;
    const c = next - t, sw = c / 4;
    H2_ORDER.forEach((i, j) => {
      const t0 = t + j * sw, t1 = t0 + sw * 0.92;
      const L = legs[i];
      const prev = {x: L[L.length - 1][1], z: L[L.length - 1][2]};
      let p: XZ;
      if (ci === taus.length - 1) p = S4[i];
      else { const rp = h2Root(Math.min(M.P4, t1 + c * 0.4)); const s = heavyStance(rp.x, rp.z, rp.h, i); p = {x: s[0], z: s[1]}; }
      const dir = {x: hv(h2Root(t1).h).x, z: hv(h2Root(t1).h).z};
      if (ci < taus.length - 1) p = clearOf(prev, p, dir);
      // stepping over the wreck: a high step
      const over = T_OVER(prev, p);
      if (Math.hypot(p.x - prev.x, p.z - prev.z) < 0.08) { L.push([t1, prev.x, prev.z]); return; }
      L.push([t0, prev.x, prev.z], [t1, p.x, p.z, over ? 3.5 : 0.55]);
    });
  });
  return legs;
})();
/** does a swing from a to b pass over (or land on) heavy 1's wreck? */
function T_OVER(a: XZ, b: XZ): boolean {
  for (let k = 1; k < 10; k++) { const u = k / 10; if (wreckDist({x: lerp(a.x, b.x, u), z: lerp(a.z, b.z, u)}) < 0.3) return true; }
  return false;
}
/** every step heavy 2 takes over the wreck: [leg, lift time, landing time, landing point] (for FX, sound) */
export const H2_FALLS = (() => {
  const out: {leg: number; t0: number; t: number; pos: V3; over: boolean}[] = [];
  H2_LEGS.forEach((k, leg) => k.forEach((kk, j) => {
    if (j === 0) return;
    const prev = k[j - 1];
    if (Math.hypot(kk[1] - prev[1], kk[2] - prev[2]) < 0.05) return;
    out.push({leg, t0: prev[0], t: kk[0], pos: onG(kk[1], kk[2]), over: (kk[3] ?? 0) > 1});
  }));
  return out.sort((a, b) => a.t - b.t);
})();
/** the round's aim and where it bursts: the rim crest in front of the Crew, north of the cover slab */
export const BLAST_AT: V3 = on({x: 48.5, z: -0.2}, 0.25);
export const heavy2D3 = (T: number): HeavySpec => {
  const r = h2Root(T);
  const feet = H2_LEGS.map((k) => footAt(k, T, 0.55));
  // it rears a little to carry its hull over the wreck
  const rear = 0.38 * win(T, 143.3, 147.9, 0.6, 0.8);
  const look: V3 = T < 128.6 ? {x: r.x - 20, y: 2, z: r.z + 2} : T > 147.0 ? dirHeadAt(T) : on({x: 46.5, z: -0.6}, 1.5);
  return {
    id: 7401, t: T, pos: {x: r.x, y: 0, z: r.z}, heading: r.h, ground, key: 'tb_heavy2', feet, look,
    eye: T < 128.6 ? 'cyan' : 'amber', drop: -rear,
    aim: T > 143.6 && T < EV3.fire ? BLAST_AT : undefined,
    fire: {t0: EV3.fire, target: BLAST_AT},
  };
};
/** heavy 2's footfalls in (Ta, Tb] */
export const heavy2Falls = (Ta: number, Tb: number) => H2_FALLS.filter((f) => f.t > Ta && f.t <= Tb);
export const H2_INFO = {vmax: H2_VMAX, dEnd: H2_DEND, c0: H2_C0};

// ================================================================== THE ARC (27 units: D4's ARC_START, tableau ids)
type UStep =
  | {k: 'walk'; pts: XZ[]; T0: number; T1: number; A?: number; D?: number; stride?: number; lift?: number}
  | {k: 'keys'; root: KR[]};
type UPlan = {id: number; key: string; steps: UStep[]; act?: (T: number) => Partial<UnitSpec>};
const stepT0 = (s: UStep) => (s.k === 'walk' ? s.T0 : s.root[0][0]);
const FEET = new WeakMap<object, {L: KP[]; R: KP[]}>();
const unitRun = (pl: UPlan, T: number): UnitSpec => {
  let i = 0;
  pl.steps.forEach((s, k) => { if (T >= stepT0(s)) i = k; });
  const s = pl.steps[i];
  const base: UnitSpec = {id: pl.id, t: T, pos: {x: 0, y: 0, z: 0}, heading: 0, ground, idle: 0.45, eye: 'cyan', key: pl.key};
  let sp: UnitSpec;
  if (s.k === 'walk') {
    const L = pathLen(s.pts), A = s.A ?? 0.5, D = s.D ?? 0.5;
    const path: Path = linePath(s.pts, 1.2);
    const dist = runDist(Math.min(T, s.T1), s.T0, s.T1, L, A, D);
    const vc = cruise(s.T0, s.T1, L, A, D);
    const k = clamp(runSpeed(T, s.T0, s.T1, L, A, D) / Math.max(0.5, vc));
    const fast = clamp((vc - 1.8) / 2);
    const end = path(L);
    sp = {
      ...base, pos: end.pos, heading: end.heading,
      gait: {path, dist, stride: s.stride ?? 1.45 + 0.85 * fast, lift: s.lift ?? 0.14 + 0.08 * fast, start: A > 0.25 ? 0 : undefined, end: D > 0 ? L : undefined},
      crouch: (0.03 + 0.16 * fast) * k, lean: (3 + 12 * fast) * k,
    };
  } else {
    const r = keyRoot(s.root, T);
    let feet = FEET.get(s);
    if (!feet) FEET.set(s, (feet = autoSteps(s.root, {half: 0.19, stag: -0.04, stepLen: 0.55})));
    sp = {...base, pos: {x: r.p.x, y: 0, z: r.p.z}, heading: r.h, feet: {L: footAt(feet.L, T, 0.11), R: footAt(feet.R, T, 0.11)}};
  }
  return {...sp, ...(pl.act ? pl.act(T) : {})};
};

/** D4's plan for a tableau id, and its state at 149.86 (where the walk begins: position, heading) */
const d4PlanOf = (id: number) => Object.values(D4_NAMED).find((p) => p.id === id) ?? RING_PLANS.find((p) => p.id === id)!;
const d4Start = (id: number): {x: number; z: number; h: number} => {
  const s = d4UnitAt(d4PlanOf(id), M.P4);
  const p = s.gait ? s.gait.path(s.gait.dist) : {pos: s.pos, heading: s.heading};
  return {x: p.pos.x, z: p.pos.z, h: norm360(p.heading)};
};

// ---- sources: D2's survivors and the vanguard's front ranks
type Src = {name: string; srcId: number; x: number; z: number; h: number; d2?: string};
const SURV = ['R1', 'R3', 'R4', 'R6', 'R5', 'U8', 'R7'];
const surv: Src[] = SURV.map((n) => {
  const s = unitD2(n, M.P3);
  return {name: n, srcId: s.id, x: s.pos.x, z: s.pos.z, h: norm360(s.heading), d2: n};
});
/** the vanguard units the line takes (front two ranks, nearest the avenue's middle; none D1/D2 already took) */
const VAN_TAKE: Src[] = (() => {
  const v = armyUnits().filter((u) => u.g === 'van' && u.rest.x < 86 && !D1_ARMY_IDS.has(u.id) && Math.abs(u.rest.z) < 12.4);
  v.sort((a, b) => a.rest.x - b.rest.x || Math.abs(a.rest.z) - Math.abs(b.rest.z));
  return v.slice(0, 20).map((u) => ({name: `V${u.id}`, srcId: u.id, x: u.rest.x, z: u.rest.z, h: norm360(u.heading)}));
})();
/** the vanguard ids the line takes (leave them out when drawing B's halted army) */
export const VAN_TAKEN = new Set(VAN_TAKE.map((s) => s.srcId));

// ---- formation geometry
/** the line across the crater (x ≈ 58.3, shoulder to shoulder, north → south), the cable's crossing left open */
export const LINE_X = 58.3;
const lineZ = (k: number) => { const z = -12.6 + k * 0.98; return z < -7.5 ? z - 0.55 : z; };
/** the arc round the Crew on the rim (pivot, radius) at FORMATION */
export const ARC1_C = {x: 46.6, z: -0.6}, ARC1_R = 11.6;
const arc1 = (k: number, n: number) => {
  const b = 26 + (128 * k) / (n - 1);
  const a = (b * Math.PI) / 180;
  return {x: ARC1_C.x + Math.sin(a) * ARC1_R, z: ARC1_C.z - Math.cos(a) * ARC1_R, h: norm360(b + 180)};
};

export type ArcUnit = {id: number; role: string; src: Src; k: number; line: XZ; a1: {x: number; z: number; h: number}; a2: {x: number; z: number; h: number}; fin: {x: number; z: number; h: number}; plan: UPlan};
const pushFrom = (p: XZ, o: XZ, r: number): XZ => { const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz) || 1e-3; return d < r ? {x: o.x + (dx / d) * r, z: o.z + (dz / d) * r} : p; };
/** the units' look: the Crew's middle (the source once she projects) */
export const CREW_C: V3 = on({x: 46.4, z: -1.2}, 1.3);
const DECOY_SRC: V3 = on({x: 46.3, z: -0.4}, 1.3);

export const ARC: ArcUnit[] = (() => {
  const order = [...ARC_START].sort((a, b) => a.bearing - b.bearing);
  const n = order.length;
  // sources sorted north → south become the line's slots north → south (paths don't cross)
  const srcs = [...surv, ...VAN_TAKE];
  // the survivors take the line's middle and south-middle (they are in the crater's south-east), the vanguard the rest:
  // assign by z order inside each group to the slot list
  const slotsZ = Array.from({length: n}, (_, k) => lineZ(k));
  const survSlots = [2, 12, 13, 14, 15, 16, 17]; // R1 north; the rest from the middle south
  const vanSlots = slotsZ.map((_, k) => k).filter((k) => !survSlots.includes(k));
  const bySurv = [...surv].sort((a, b) => a.z - b.z), byVan = [...VAN_TAKE].sort((a, b) => a.z - b.z);
  const slotSrc: Src[] = [];
  survSlots.forEach((k, i) => (slotSrc[k] = bySurv[i]));
  vanSlots.forEach((k, i) => (slotSrc[k] = byVan[i]));
  void srcs;
  return order.map((a, k) => {
    const src = slotSrc[k];
    const line = {x: LINE_X + (k % 2 ? 0.35 : -0.1), z: slotsZ[k]};
    const a1 = arc1(k, n);
    const fin = d4Start(a.id);
    // the hold (advanced on the source): a third of the way from the formed arc to the final place, kept out of the
    // Crew's circle, heavy 1's wreck and the round's burst
    let p2: XZ = {x: lerp(a1.x, fin.x, 0.3) + 1.2, z: lerp(a1.z, fin.z, 0.3)};
    p2 = pushFrom(p2, {x: 46.0, z: -1.0}, 6.6);
    p2 = pushFrom(p2, BLAST_AT, 5.2);
    const a2 = {x: p2.x, z: p2.z, h: norm360(headingTo(p2, CREW_C))};
    const plan = buildPlan(a.id, src, k, line, a1, a2, fin);
    return {id: a.id, role: a.role, src, k, line, a1, a2, fin, plan};
  });
})();

/** the line forms after the crash (the vanguard starts down at 123.2 as heavy 1 is pinned) */
function buildPlan(id: number, src: Src, k: number, line: XZ, a1: {x: number; z: number; h: number}, a2: {x: number; z: number; h: number}, fin: {x: number; z: number; h: number}): UPlan {
  const steps: UStep[] = [];
  const mid = 13; // the line's middle slot
  const ripple = Math.abs(k - mid);
  if (src.d2) {
    // D2's survivors: at P3 they back off south-east, clear of the attack; after the crash, into the line
    const hold: XZ = src.name === 'R1' ? {x: src.x, z: src.z} : {x: 66.2 + (k % 3) * 1.4, z: 3.6 + (k - 12) * 1.05};
    steps.push({k: 'keys', root: [[M.P3, src.x, src.z, src.h], [117.4 + (k % 4) * 0.12, src.x, src.z, src.h]]});
    if (src.name !== 'R1') {
      const t0 = 117.45 + (k % 4) * 0.12;
      steps.push({k: 'walk', pts: [{x: src.x, z: src.z}, hold], T0: t0, T1: t0 + 2.6, A: 0.5, D: 0.6});
      steps.push({k: 'keys', root: [[t0 + 2.6, hold.x, hold.z, headingTo({x: src.x, z: src.z}, hold)], [t0 + 3.3, hold.x, hold.z, 280]]});
    }
    const t1 = 126.6 + (k % 5) * 0.18;
    const via: XZ[] = src.name === 'R1' ? [{x: src.x, z: src.z}, {x: 70, z: -11.4}, {x: 62.5, z: -11.6}, line] : [hold, {x: lerp(hold.x, line.x, 0.5), z: Math.max(hold.z, 1.2) + 0.4}, line];
    steps.push({k: 'walk', pts: via, T0: t1, T1: EV3.lineSet - 0.1 + (k % 3) * 0.08, A: 0.5, D: 0.6});
  } else {
    // the vanguard: down from the east rim (from 123.2, rank by rank) round heavy 1 (north under the girder or south),
    // into its slot in the line
    const t0 = 123.2 + (k % 7) * 0.11 + (src.x - 81) * 0.05;
    const north = line.z < -2.5;
    const via: XZ[] = north
      ? [{x: src.x, z: src.z}, {x: 72.5, z: Math.min(src.z, -9.8)}, {x: 66.0, z: -11.4}, {x: LINE_X + 2.2, z: Math.max(line.z, -12.4)}, line]
      : [{x: src.x, z: src.z}, {x: 72.0, z: Math.max(src.z, 2.5)}, {x: 64.0, z: Math.max(line.z, 2.4)}, line];
    steps.push({k: 'keys', root: [[M.P3, src.x, src.z, src.h], [t0, src.x, src.z, src.h]]});
    steps.push({k: 'walk', pts: via, T0: t0, T1: EV3.lineSet - 0.2 + (k % 4) * 0.1, A: 0.6, D: 0.7});
  }
  // in line, facing the rim
  const tSet = EV3.lineSet + 0.3;
  steps.push({k: 'keys', root: [[EV3.lineSet + (k % 4) * 0.1, line.x, line.z, 270], [tSet + 0.4, line.x, line.z, 272]]});
  // FORMATION: the line bends into the arc (the middle first, the ripple running out to both ends)
  const r0 = EV3.reform + ripple * 0.075;
  const L1 = Math.hypot(a1.x - line.x, a1.z - line.z);
  if (L1 > 0.25) {
    steps.push({k: 'walk', pts: [line, a1], T0: r0, T1: r0 + Math.max(0.9, L1 / 2.9 + 0.5), A: 0.35, D: 0.45});
    steps.push({k: 'keys', root: [[r0 + Math.max(0.9, L1 / 2.9 + 0.5), a1.x, a1.z, headingTo(line, a1)], [r0 + Math.max(0.9, L1 / 2.9 + 0.5) + 0.5, a1.x, a1.z, a1.h]]});
  } else {
    steps.push({k: 'keys', root: [[r0, line.x, line.z, 272], [r0 + 0.6, a1.x, a1.z, a1.h]]});
  }
  // DECOY_FAIL: they advance on the source (straight through the light), then hold, facing the Crew
  const ad0 = EV3.advance0 + (k % 6) * 0.08 + ripple * 0.02;
  steps.push({k: 'walk', pts: [{x: a1.x, z: a1.z}, {x: a2.x, z: a2.z}], T0: Math.max(ad0, stepEnd(steps) + 0.05), T1: EV3.advance1 + (k % 5) * 0.12, A: 0.4, D: 0.5});
  steps.push({k: 'keys', root: [[EV3.advance1 + (k % 5) * 0.12, a2.x, a2.z, headingTo({x: a1.x, z: a1.z}, a2)], [EV3.advance1 + 0.6 + (k % 5) * 0.12, a2.x, a2.z, a2.h],
    [145.55 + (k % 5) * 0.07, a2.x, a2.z, a2.h]]});
  // after the blast: they press in, to D4's start (arriving along D4's first heading)
  const f = hv(fin.h);
  const pre = {x: fin.x - f.x * 1.1, z: fin.z - f.z * 1.1};
  steps.push({k: 'walk', pts: [{x: a2.x, z: a2.z}, pre, {x: fin.x, z: fin.z}], T0: 145.6 + (k % 5) * 0.07, T1: M.P4, A: 0.45, D: 0.55});
  // replacements step over the wrecks in their way (a high step)
  steps.forEach((st) => { if (st.k === 'walk' && overWreck(st.pts)) st.lift = 0.5; });
  return {
    id, key: `d3a${id}`, steps,
    act: (T) => ({
      look: T < 126.4 ? undefined : T < EV3.lineSet ? CREW_C : T < 136.4 ? DECOY_SRC : T < 145.4 ? CREW_C : dirHeadAt(T),
      eye: T < 128.4 ? 'cyan' : 'amber',
      lockAt: undefined,
      idle: 0.42,
    }),
  };
}
function stepEnd(steps: UStep[]): number {
  const s = steps[steps.length - 1];
  return s.k === 'walk' ? s.T1 : s.root[s.root.length - 1][0];
}
export const arcUnit = (u: ArcUnit, T: number): UnitSpec => unitRun(u.plan, T);
/** the D2 survivors' names the arc animates (leave them out of D2's own draw) */
export const ARC_SURVIVORS = SURV;

// ================================================================== ENEMY DRONES (the tableau's eight)
// From D1/D2's hovering drones (same positions at P3) and two from B's sky. Keys [t, x, y, z]; the last key lands on D4's
// first (droneD4 at 149.86, blended in over the final second).
const D1_HOVER = (id: number, c: V3, T: number, r = 1.2): V3 => ({x: c.x + Math.sin(T * 0.37 + id) * r, y: c.y + Math.sin(T * 0.6 + id * 2) * 0.35, z: c.z + Math.cos(T * 0.29 + id) * r});
type DPlan = {id: number; from: {id: number; c: V3; r: number}; keys: K4[]; eye?: (T: number) => 'cyan' | 'amber'; extra?: (T: number) => Partial<DroneSpec>};
const P = (t: number, x: number, y: number, z: number): K4 => [t, x, y, z];
/** where the decoy maker stands to project again (on the rim, north of the cover slab), facing the crater */
export const DEC_SPOT = {x: 45.0, z: -0.6, h: 86};
/** where the diver hits: the tablet in her left hand at EV3.smash (crew.tsx holds it there) */
export const SMASH_AT: V3 = (() => {
  const f = hv(DEC_SPOT.h), r = {x: -f.z, z: f.x};
  const x = DEC_SPOT.x + f.x * 0.42 - r.x * 0.1, z = DEC_SPOT.z + f.z * 0.42 - r.z * 0.1;
  return {x, y: G(DEC_SPOT.x, DEC_SPOT.z) + 1.08, z};
})();
/** the cable cut point: on the girder flank between post 3 and the wreck's leg (set by the FX from the tether) */
export const CUT_AT: V3 = lerp3s(ANCHOR, h1ClampPt(EV3.cut), 0.3);
export const D_PLANS: DPlan[] = [
  // 7605: the ADAPT drone — holds over heavy 1, climbs out of the dust, locks on, marks the source; holds high
  {id: 7605, from: {id: 8151, c: {x: 63, y: 7.6, z: -5.5}, r: 1.6}, eye: (T) => (T < EV3.lock ? 'cyan' : 'amber'),
    keys: [P(126.0, 0, 0, 0), P(EV3.climb0, 61.6, 6.4, -4.2), P(129.1, 61.0, 12.0, -5.2), P(EV3.climb1, 61.4, 19.2, -6.4), P(131.0, 61.8, 20.6, -6.9), P(140.0, 62.8, 21.4, -7.4), P(M.P4, 64, 22, -8)],
    extra: (T) => ({look: T < 129.0 ? undefined : T < 129.75 ? CREW_C : SMASH_AT, mark: T > EV3.mark0 && T < 131.8 ? {target: SMASH_AT, color: 'amber'} : undefined})},
  // 7601: the diver — from over the crater's south, up high, then straight down onto the tablet (136.35); bounces off
  {id: 7601, from: {id: 8153, c: {x: 61, y: 8.5, z: 3}, r: 1.2}, eye: (T) => (T < 134.2 ? 'cyan' : 'amber'),
    keys: [P(128.0, 0, 0, 0), P(131.5, 57.5, 9.6, 2.6), P(EV3.dive0, 53.6, 9.2, 1.3), P(EV3.smash - 0.32, 48.6, 3.4, 0.25), P(EV3.smash, SMASH_AT.x + 0.05, SMASH_AT.y + 0.08, SMASH_AT.z), P(136.75, 47.6, 3.0, 1.6), P(138.4, 49.5, 6.4, 3.5), P(142.0, 47.5, 7.2, 6.0), P(M.P4, 46, 7.5, 7)],
    extra: (T) => ({struck: {t0: EV3.smash, dir: {x: 0.6, y: 0.5, z: 0.4}}, mark: T > 135.2 && T < EV3.smash ? {target: SMASH_AT, color: 'amber'} : undefined})},
  // 7602: the cutter — under the girder from the north-east, low along the cable, the cutter arm out; then holds
  {id: 7602, from: {id: 8152, c: {x: 56, y: 6.5, z: -9}, r: 1.2}, eye: (T) => (T < 137.4 ? 'cyan' : 'amber'),
    keys: [P(136.8, 0, 0, 0), P(EV3.swarm0, 56.0, 4.6, -9.6), P(138.45, CUT_AT.x + 1.6, CUT_AT.y + 0.5, CUT_AT.z - 0.35), P(EV3.cut, CUT_AT.x - 0.05, CUT_AT.y + 0.04, CUT_AT.z), P(139.45, CUT_AT.x - 1.4, CUT_AT.y + 1.2, CUT_AT.z + 0.5), P(141.5, 51.0, 7.0, -7.0), P(M.P4, 50, 9, -6)],
    extra: (T) => ({cutter: clamp((T - 138.1) / 0.35) * (1 - clamp((T - 139.6) / 0.5))})},
  // 7603: swarms the flank with it (over the tether operator), then rises to the north
  {id: 7603, from: {id: 8155, c: {x: 68, y: 9.5, z: -4}, r: 1.2}, eye: (T) => (T < 137.4 ? 'cyan' : 'amber'),
    keys: [P(136.6, 0, 0, 0), P(EV3.swarm0, 58.0, 6.2, -12.2), P(138.6, 50.2, 3.6, -12.6), P(139.6, 47.4, 3.1, -11.4), P(141.0, 46.0, 6.0, -12.0), P(M.P4, 44, 12, -12)]},
  // 7604 and 7607: the hunters — they come in from the south and the east and run the allied drone down
  {id: 7604, from: {id: 8154, c: {x: 54, y: 5.2, z: 9}, r: 1.2}, eye: (T) => (T < 140.2 ? 'cyan' : 'amber'),
    keys: [P(139.6, 0, 0, 0), P(EV3.hunt0, 50.0, 4.2, 4.8), P(140.9, 46.6, 3.1, 1.6), P(141.2, 44.2, 2.5, 1.0), P(EV3.kill, 43.15, 2.25, 1.15), P(141.75, 42.4, 3.4, 2.6), P(143.5, 45.0, 7.5, 7.5), P(M.P4, 48, 10, 12)],
    extra: (T) => ({mark: T > 140.55 && T < EV3.kill ? {target: allyAt(T), color: 'amber'} : undefined})},
  {id: 7607, from: {id: 8156, c: {x: 72, y: 7, z: 8}, r: 1.2}, eye: (T) => (T < 140.2 ? 'cyan' : 'amber'),
    keys: [P(139.0, 0, 0, 0), P(EV3.hunt0, 53.0, 5.6, -0.6), P(140.95, 47.5, 3.8, -1.2), P(141.25, 44.4, 2.6, 0.1), P(141.6, 42.8, 3.2, -0.2), P(143.5, 50.0, 9.0, 4.0), P(M.P4, 70, 17, 12)]},
  // 7606 and 7608: high in the smoke over the avenue (two of B's sky)
  {id: 7606, from: {id: 3310, c: {x: 84, y: 30, z: 6}, r: 0}, keys: [P(M.P3, 84, 30, 6), P(M.P4, 84, 30, 6)]},
  {id: 7608, from: {id: 3316, c: {x: 110, y: 34, z: -12}, r: 0}, keys: [P(M.P3, 110, 34, -12), P(M.P4, 110, 34, -12)]},
];
/** one of the tableau's drones at T: its hover from D1/D2 until its keys take over, the keys, D4's sway in the last s */
export const droneD3 = (pl: DPlan, T: number): DroneSpec => {
  const k0 = pl.keys[0][0];
  const hov = (t: number) => (pl.from.r > 0 ? D1_HOVER(pl.from.id, pl.from.c, t, pl.from.r) : pl.from.c);
  // the first key is the hover position at its own time (the move starts from where it was)
  const keys: K4[] = pl.keys.map((k, i) => (i === 0 ? [k0, hov(k0).x, hov(k0).y, hov(k0).z] as K4 : k));
  const at = (t: number) => (t < k0 ? hov(t) : splV(keys, t));
  let pos = at(T);
  const vel = mul3(sub3(at(T + 0.05), at(T - 0.05)), 10);
  // the last second: into D4's own spec (its sway included)
  const d4 = T > M.P4 - 1.2 ? droneD4(pl.id, M.P4) : null;
  const w = d4 ? smooth((T - (M.P4 - 1.2)) / 1.2) : 0;
  if (d4) pos = lerp3s(pos, d4.pos, w);
  const sp = Math.hypot(vel.x, vel.z);
  const heading = sp > 0.6 ? (Math.atan2(vel.x, -vel.z) * 180) / Math.PI : 260;
  const look = T < 128 ? on({x: 49, z: -6}, 1.2) : CREW_C;
  const ex = pl.extra ? pl.extra(T) : {};
  return {id: pl.id, t: T, pos, vel, heading: d4 && w > 0.5 ? d4.heading : heading, eye: pl.eye ? pl.eye(T) : 'cyan', ground, key: `tb_d${pl.id}`, ...ex, look: d4 && w > 0.5 ? d4.look : ex.look ?? look};
};
export const dronesD3 = (T: number): DroneSpec[] => D_PLANS.map((p) => droneD3(p, T));
/** the ids of D1/D2's drones and B's sky drones the tableau's eight take over */
export const DRONE_SRC_IDS = new Set(D_PLANS.map((p) => p.from.id));
void [D4_DRONES, easeIn, easeOut, add3, unitAttach, rightOf, fwdOf, after, wrapD];
