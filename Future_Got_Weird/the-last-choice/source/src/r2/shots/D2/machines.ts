// Section D2 machines: PURE specs (no React, no continuity import) — imported by the shots and by ./persist.ts.
//
// D2 continues D1's survivors (the same ids, so nothing pops at the cut) and adds heavy 1 and a reserve unit:
//   A  8105 (D1's U5)  on the crater's north-west slope by the girder: distracted by the light figures; the Director
//                      bashes its back-right at FLANK (it staggers ESE, pauldron torn); it turns back on the Crew, the
//                      tether clamps it, the reel drags it along the girder into C: both slam into the girder (wreck).
//   B  8107 (D1's U7)  walks out from under the girder to watch the light; the breaker breaks its left knee from behind,
//                      the runner pries its back plate and rips its cables; it topples forward down the slope (wreck).
//   C  8112 (reserve R2) sent along the girder's underside from the north-east rim to investigate the smoke; turns on
//                      the fight and walks west along the girder; A is dragged into it and both hit the girder (wreck).
//   D  8106 (D1's U6)  strikes through a light figure (DECOY_HITb); later comes up the slope, backhands the runner
//                      (KNOCKBACK), swings at him again (the allied drone takes the blow, SHIELD) and the Director bashes
//                      it down (COUNTER) (wreck).
//   8108 (D1's U8)     strikes through a light figure (DECOY_HITa); stays searching in the smoke (survivor).
//   8113–8117 (R3–R7)  the reserve sent down from the east rim into the smoke; three strike at the figures (survivors).
//   8111 (R1)          holds the north-east rim.
//   heavy 1 = HEAVIES_B[0] (3101, B4's heavy): walks in from (104, −1), fires into the smoke on DECOY_HITc, and comes
//                      through the crater toward the girder; halts at the crater's north part (≈ 63.5, −4.0) facing
//                      the Crew at BRIGHT. D3 blinds, pins and topples it.
import type {UnitSpec, DroneSpec, HeavySpec} from '../../mech';
import {V3, clamp, smooth, lerp, add3, sub3, mul3, norm3, len3, rnd, easeIn, easeOut} from '../../../kit/math';
import {M} from '../../timing';
import {XZ, KR, KP, G, keyRoot, footAt, autoSteps, runDist, runSpeed, cruise, linePath, pathLen, fwdOf, rightOf, headingTo, wrapD, win, after} from '../D1/motion';
import {unitD1, enemyDrones} from '../D1/machines';
import {HEAVIES_B, restD, armyUnits} from '../B/army';

const ground = G;
const lerp3s = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
const on = (p: XZ, up = 0): V3 => ({x: p.x, y: G(p.x, p.z) + up, z: p.z});

// ------------------------------------------------------------------ key moments (film s)
export const EV2 = {
  // D2-1: the flare carrier draws, pulls the pins and lobs two canisters over the slab
  draw1: 94.36, pin1: 94.58, rel1: 94.86, draw2: 94.95, pin2: 95.08, rel2: 95.27, canFlight: 1.0, pop: 0.12,
  // D2-2: the decoy: sketch on the tablet, tap, the tablet set on the slab's top edge, projector on
  sketch: 95.48, sketchDur: 1.72, tap: 97.36, place: 97.66, projOn: 97.9, projOff: 112.6,
  // the Director's signal; the flank group runs north along the rim to the girder
  signal: 98.02, go: 98.2,
  // D2-3: strikes through the light; drones dive through it; heavy 1 fires into the smoke
  hitA: M.DECOY_HITa, hitB: M.DECOY_HITb, fire: M.DECOY_HITc, blast: M.DECOY_HITc + 0.2,
  // D2-4: FLANK
  flank: M.FLANK, knee: 103.1, bash: 103.62, pryIn: 104.05, pryPop: 104.5, rip: 104.92,
  // D2-5: TETHER
  tFire: 105.95, tBite: 106.22, wrap0: 106.35, wrap: 106.72, taut: 106.85, sweep: 107.55, crash: 107.95, release: 109.3, reelEnd: 110.0,
  // D2-6, D2-7
  knock: M.KNOCKBACK, catch: M.CATCH, shield: M.SHIELD, counter: M.COUNTER, bright: M.BRIGHT,
};
export const canLand = (i: 0 | 1) => (i === 0 ? EV2.rel1 : EV2.rel2) + EV2.canFlight;
export const canPop = (i: 0 | 1) => canLand(i) + EV2.pop;

// ------------------------------------------------------------------ the girder (PLAN.girder; world/props GIRDER)
const GA = {x: 36, y: 0, z: -17}, GB = {x: 80, y: 8, z: -5};
const GL = Math.hypot(GB.x - GA.x, GB.y - GA.y, GB.z - GA.z);
export const GF: V3 = {x: (GB.x - GA.x) / GL, y: (GB.y - GA.y) / GL, z: (GB.z - GA.z) / GL};
const gsl = Math.hypot(GF.x, GF.z);
/** the girder's left (north), horizontal */
export const GSIDE: V3 = {x: GF.z / gsl, y: 0, z: -GF.x / gsl};
/** up across the truss (perpendicular to the girder and its side) */
export const GUP: V3 = {x: GF.y * GSIDE.z - GF.z * GSIDE.y, y: GF.z * GSIDE.x - GF.x * GSIDE.z, z: GF.x * GSIDE.y - GF.y * GSIDE.x};
export const GIRDER_LEN = GL;
const PANELS = Math.round(GL / 4.2), PL = GL / PANELS;
/** a point on the girder: s along it, l to its north (+) / south (−), u up the truss (0 = bottom chord axis) */
export const girderPt = (s: number, l: number, u = 0): V3 => ({
  x: GA.x + GF.x * s + GSIDE.x * l + GUP.x * u, y: GA.y + GF.y * s + GSIDE.y * l + GUP.y * u, z: GA.z + GF.z * s + GSIDE.z * l + GUP.z * u,
});
/** bottom of the south face's vertical post i (the truss panels are ≈ 4.2 m) */
export const postSouth = (i: number, u = 0) => girderPt(i * PL, -2.6, u);
/** s along the girder of a world x on its south face */
const sOfX = (x: number) => (x - (GA.x - GSIDE.x * 2.6)) / GF.x;
/** z of the south face at world x, and the bottom chord's height (axis) there */
export const faceZ = (x: number) => GA.z - GSIDE.z * 2.6 + GF.z * sOfX(x);
export const chordY = (x: number) => GF.y * sOfX(x);
/** the tether's anchor: girder post 3 on the south face, just above the bottom chord (where the cable is wrapped) */
export const POST3 = postSouth(3);
export const ANCHOR: V3 = postSouth(3, 0.42);

// ------------------------------------------------------------------ the smoke and the decoy (geometry only)
export const CAN_TO: [XZ, XZ] = [{x: 56.4, z: -2.6}, {x: 59.0, z: 1.6}];
/** the light figures' plane: walking south-east across the crater, the plane facing the projector (south-west) */
export const DECOY = {
  center: on({x: 57.4, z: -0.9}, 3.0) as V3,
  walkHeading: 136, height: 6.0, spacing: 2.6, walkSpeed: 0.45, seed: 4,
};
const DU: V3 = {x: Math.sin((DECOY.walkHeading * Math.PI) / 180), y: 0, z: -Math.cos((DECOY.walkHeading * Math.PI) / 180)};
/** the plane's normal, toward the projector side (south-west) */
export const DN: V3 = {x: -DU.z, y: 0, z: DU.x};
export const DECOY_U = DU;
/** figure j's feet at film time T (the decoy kit's layout: fx/decoy.tsx decoyItems) */
export const decoyFoot = (j: number, T: number): V3 => {
  const H = DECOY.height, sp = DECOY.spacing;
  const drift = DECOY.walkSpeed * Math.max(0, T - EV2.projOn);
  const base = {x: DECOY.center.x, y: DECOY.center.y - H / 2, z: DECOY.center.z};
  const k = (j - 1.5) * sp + drift + (rnd(j * 3 + 1) - 0.5) * 0.3 * sp;
  return {x: base.x + DU.x * k, y: base.y, z: base.z + DU.z * k};
};
/** a point on figure j: up = fraction of its height */
export const decoyPt = (j: number, T: number, up: number, along = 0): V3 => add3(decoyFoot(j, T), {x: DU.x * along * DECOY.height, y: up * DECOY.height, z: DU.z * along * DECOY.height});
/** a standing spot `off` m from the plane in front of figure j (off > 0: the projector side) at T, facing the plane */
const besideFig = (j: number, T: number, off: number, along = 0): {x: number; z: number; h: number} => {
  const f = decoyFoot(j, T);
  const x = f.x + DN.x * off + DU.x * along, z = f.z + DN.z * off + DU.z * along;
  return {x, z, h: headingTo({x, z}, {x: f.x + DU.x * along, z: f.z + DU.z * along})};
};
/** where heavy 1's round lands (inside the smoke, among the figures' feet) */
export const BLAST_AT: V3 = on({x: 56.6, z: -2.6}, 0.35);

// ------------------------------------------------------------------ unit plans
type Walk = {kind: 'walk'; pts: XZ[]; T0: number; T1: number; stride?: number; A?: number; D?: number};
type Stand = {kind: 'stand'; root: KR[]; stag?: number; stepLen?: number; feet?: {L: KP[]; R: KP[]}};
type FromD1 = {kind: 'd1'; name: string};
type Fn = {kind: 'fn'; T0: number; at: (T: number) => Partial<UnitSpec> & {pos: V3; heading: number}};
type Phase = Walk | Stand | FromD1 | Fn;
type Plan = {id: number; key: string; phases: Phase[]; act?: (T: number) => Partial<UnitSpec>};
const startOf = (p: Phase) => (p.kind === 'walk' ? p.T0 : p.kind === 'stand' ? p.root[0][0] : p.kind === 'fn' ? p.T0 : -1e9);

const HIP_Y = 1.05, ANKLE = 0.1, LEG = 0.95;
const FEET = new Map<Stand, {L: KP[]; R: KP[]}>();
const feetOf = (s: Stand) => {
  let f = FEET.get(s);
  if (!f) FEET.set(s, (f = s.feet ?? autoSteps(s.root, {stepLen: s.stepLen ?? 0.55, stag: s.stag ?? 0})));
  return f;
};
/** a walk's position/heading at T (for chaining phases and aiming) */
const walkAt = (w: Walk, T: number) => {
  const L = pathLen(w.pts);
  const d = runDist(clamp(T, w.T0, w.T1), w.T0, w.T1, L, w.A ?? 0.7, w.D ?? 0.7);
  return {...linePath(w.pts, 1.2)(d), d, L};
};

const run = (pl: Plan, T: number): UnitSpec => {
  let i = 0;
  pl.phases.forEach((p, k) => { if (T >= startOf(p)) i = k; });
  const ph = pl.phases[i];
  const act = pl.act ? pl.act(T) : {};
  if (ph.kind === 'd1') return {...unitD1(ph.name, T), key: pl.key, ...act};
  let sp: UnitSpec;
  if (ph.kind === 'walk') {
    const L = pathLen(ph.pts);
    const path = linePath(ph.pts, 1.2);
    const A = ph.A ?? 0.7, D = ph.D ?? 0.7;
    const d = runDist(clamp(T, ph.T0, ph.T1), ph.T0, ph.T1, L, A, D);
    const k = clamp(runSpeed(T, ph.T0, ph.T1, L, A, D) / cruise(ph.T0, ph.T1, L, A, D));
    const at = path(d);
    sp = {
      id: pl.id, t: T, pos: at.pos, heading: at.heading, ground, idle: 0.5, key: pl.key,
      gait: {path, dist: d, stride: ph.stride ?? 1.6, lift: 0.14, start: 0, end: L},
      lean: 4 + 6 * k, crouch: 0.04 * k,
    };
  } else if (ph.kind === 'stand') {
    const r = keyRoot(ph.root, T);
    const f = feetOf(ph);
    sp = {id: pl.id, t: T, pos: {x: r.p.x, y: 0, z: r.p.z}, heading: r.h, ground, idle: 0.5, key: pl.key, feet: {L: footAt(f.L, T, 0.11), R: footAt(f.R, T, 0.11)}};
  } else {
    sp = {id: pl.id, t: T, ground, idle: 0.3, key: pl.key, ...ph.at(T)};
  }
  sp = {...sp, ...act, lean: (sp.lean ?? 0) + (act.lean ?? 0), crouch: (sp.crouch ?? 0) + (act.crouch ?? 0)};
  // the kit's hit stagger holds at 60 % and drops out 1.2 s after the blow (a pop of up to 0.17 m): carry that remainder
  // on the root instead and let it settle over the next 0.5 s (as D1)
  for (const h of sp.hits ?? []) {
    const u = T - h.t0;
    if (u <= 1.2 || u > 1.7) continue;
    const k = 0.108 * h.strength * (1 - smooth((u - 1.2) / 0.5));
    const l = Math.hypot(h.dir.x, h.dir.z) || 1;
    sp.pos = {x: sp.pos.x + (h.dir.x / l) * k, y: sp.pos.y, z: sp.pos.z + (h.dir.z / l) * k};
    sp.crouch = (sp.crouch ?? 0) + k * 0.6;
  }
  // on the rim's slopes a planted foot can sit well below the pelvis's ground: crouch enough to keep it in reach
  const f = sp.feet ?? {};
  if (!sp.gait) {
    const gy = G(sp.pos.x, sp.pos.z);
    const need = Math.max(0, ...[f.L, f.R].map((q) => {
      if (!q) return 0;
      const dh = Math.min(0.9, Math.hypot(q.x - sp.pos.x, q.z - sp.pos.z));
      return HIP_Y + (gy - q.y) - ANKLE - Math.sqrt(LEG * LEG - dh * dh);
    }));
    if (need > (sp.crouch ?? 0)) sp.crouch = need;
  }
  return sp;
};

/** the active one of several strikes (each has a window −0.42 … +0.85 s around its contact) */
const pickStrike = (T: number, list: NonNullable<UnitSpec['strike']>[]) => list.find((s) => T > s.t0 - 0.43 && T < s.t0 + 0.86);
/** the angle (from upright) at which a body toppled about p toward d comes to rest on the terrain (see D1) */
const restAng = (p: XZ, d: XZ, lo = 70, hi = 150): number => {
  const py = G(p.x, p.z) + 0.16;
  for (let a = lo; a <= hi; a += 0.5) {
    const sa = Math.sin((a * Math.PI) / 180), ca = Math.cos((a * Math.PI) / 180);
    for (const [sx, need] of [[0.6, 0.16], [1.0, 0.2], [1.4, 0.22], [1.8, 0.18], [2.05, 0.14]]) {
      const x = p.x + d.x * sx * sa, z = p.z + d.z * sx * sa;
      if (py + sx * ca - G(x, z) < need) return a;
    }
  }
  return hi;
};
const hdir = (h: number): V3 => ({x: Math.sin((h * Math.PI) / 180), y: 0, z: -Math.cos((h * Math.PI) / 180)});
const smokeC: V3 = on({x: 57.2, z: -1.1}, 2.2);
const crewAt: V3 = on({x: 49.0, z: -7.0}, 1.5);

// ---- A (D1's U5): watches the light by the girder; bashed; turns back; clamped and dragged into C
export const A_FL = {x: 54.95, z: -7.85, h: 150};
const A_STAG = {x: 55.95, z: -8.15};
const A_WALK: Walk = {kind: 'walk', pts: [{x: A_STAG.x - 0.05, z: A_STAG.z - 0.05}, {x: 53.6, z: -8.85}, {x: 51.0, z: -9.6}], T0: 105.55, T1: 109.8, stride: 1.4, A: 0.6, D: 0.6};
/** A at the moment the reel goes taut (the start of the drag) */
export const A_YANK = (() => { const w = walkAt(A_WALK, EV2.taut); return {x: w.pos.x, z: w.pos.z, h: w.heading}; })();

// ---- C (reserve R2): along the girder's underside from the north-east rim; watches the light; walks west on the fight
const C_IN: Walk = {kind: 'walk', pts: [{x: 81.0, z: -10.53}, {x: 74.0, z: -9.9}, {x: 66.0, z: -9.7}, {x: 58.6, z: -9.1}], T0: 96.35, T1: 101.8, stride: 2.0, A: 1.0, D: 0.8};
const C_HOLD = {x: 58.6, z: -9.1};
const C_WEST: Walk = {kind: 'walk', pts: [C_HOLD, {x: 54.6, z: -9.3}, {x: 51.6, z: -9.6}, {x: 49.6, z: -9.4}], T0: 104.5, T1: 108.6, stride: 1.6, A: 0.7, D: 0.6};
export const C_HIT = (() => { const w = walkAt(C_WEST, EV2.sweep); return {x: w.pos.x, z: w.pos.z, h: w.heading}; })();

// ---- the drag (TETHER): the reel pulls A along its cable toward the anchor; A hits C; both slam into the girder where
// its bottom chord comes down to their shoulders (the line runs along the girder's south face, rising onto the rim)
const DRAG_DIR = (() => { const d = {x: ANCHOR.x - A_YANK.x, z: ANCHOR.z - A_YANK.z}; const l = Math.hypot(d.x, d.z); return {x: d.x / l, z: d.z / l}; })();
const GAP = 0.78; // A's centre behind C's at contact
/** the crash stop: C's centre where the chord's underside meets its shoulders (plus its half-depth) */
export const CRASH_C: XZ = (() => {
  for (let s = 0; s < 14; s += 0.05) {
    const x = C_HIT.x + DRAG_DIR.x * s, z = C_HIT.z + DRAG_DIR.z * s;
    // C's front (0.28 m ahead) under the chord: the chord underside is (axis − 0.22) above the ground there
    const fx = x + DRAG_DIR.x * 0.28, fz = z + DRAG_DIR.z * 0.28;
    const clearance = chordY(fx) - 0.22 - G(fx, fz);
    if (clearance < 1.92 && Math.abs(fz - faceZ(fx)) < 0.55) return {x, z};
    if (clearance < 1.6) return {x, z};
  }
  return {x: C_HIT.x + DRAG_DIR.x * 2.6, z: C_HIT.z + DRAG_DIR.z * 2.6};
})();
const PAIR_L = Math.hypot(CRASH_C.x - C_HIT.x, CRASH_C.z - C_HIT.z);
const A_CONTACT: XZ = {x: C_HIT.x - DRAG_DIR.x * GAP, z: C_HIT.z - DRAG_DIR.z * GAP};
const A_L1 = Math.hypot(A_CONTACT.x - A_YANK.x, A_CONTACT.z - A_YANK.z);
/** pair travel after the hit (m), 0 … PAIR_L at the crash; then a short rebound */
const pairS = (T: number) => {
  const u = clamp((T - EV2.sweep) / (EV2.crash - EV2.sweep));
  return PAIR_L * (0.82 * u + 0.18 * u * u);
};
const dragHead = (T: number, h0: number) => {
  const hd = headingTo({x: 0, z: 0}, DRAG_DIR);
  return h0 + wrapD(hd - h0) * smooth(clamp((T - EV2.taut) / 0.28));
};
/** A's root during the drag (yanked by the chest clamp: it pitches into the pull, feet dragging) */
const aDrag = (T: number): Partial<UnitSpec> & {pos: V3; heading: number} => {
  let x: number, z: number;
  if (T < EV2.sweep) {
    const u = clamp((T - EV2.taut) / (EV2.sweep - EV2.taut));
    const s = A_L1 * u * u;
    x = A_YANK.x + DRAG_DIR.x * s; z = A_YANK.z + DRAG_DIR.z * s;
  } else {
    const s = Math.min(pairS(T), PAIR_L - 0.05) - 0.06 * win(T, EV2.crash, EV2.crash + 0.5, 0.06, 0.3);
    x = A_CONTACT.x + DRAG_DIR.x * s; z = A_CONTACT.z + DRAG_DIR.z * s;
  }
  const h = dragHead(T, A_YANK.h);
  const f = hdir(h), r = rightOf(h);
  // feet trail behind the pelvis, skidding (no lift); after the crash they settle
  const trail = 0.28 * win(T, EV2.taut, EV2.crash + 0.2, 0.15, 0.2);
  const foot = (sd: number): V3 => { const fx = x - f.x * trail + r.x * sd * 0.19, fz = z - f.z * trail + r.z * sd * 0.19; return {x: fx, y: G(fx, fz), z: fz}; };
  return {pos: {x, y: 0, z}, heading: h, feet: {L: foot(-1), R: foot(1), pitchL: -18 * trail / 0.28, pitchR: -14 * trail / 0.28}, lean: 22 * win(T, EV2.taut + 0.05, EV2.crash, 0.2, 0.05)};
};
const cDrag = (T: number): Partial<UnitSpec> & {pos: V3; heading: number} => {
  const s = pairS(T) - 0.08 * win(T, EV2.crash, EV2.crash + 0.45, 0.05, 0.3);
  const x = C_HIT.x + DRAG_DIR.x * s, z = C_HIT.z + DRAG_DIR.z * s;
  const h = C_HIT.h + wrapD(headingTo({x: 0, z: 0}, DRAG_DIR) - C_HIT.h) * smooth(clamp((T - EV2.sweep) / 0.3)) * 0.6;
  const f = hdir(h), r = rightOf(h);
  const trail = 0.22 * win(T, EV2.sweep, EV2.crash + 0.15, 0.05, 0.2);
  const foot = (sd: number): V3 => { const fx = x - f.x * trail + r.x * sd * 0.19, fz = z - f.z * trail + r.z * sd * 0.19; return {x: fx, y: G(fx, fz), z: fz}; };
  return {pos: {x, y: 0, z}, heading: h, feet: {L: foot(-1), R: foot(1), pitchL: -12, pitchR: -16}, lean: -12 * win(T, EV2.sweep, EV2.crash, 0.04, 0.12) + 14 * after(T, EV2.crash - 0.02, 0.08)};
};
/** where the pair hit the girder (the impact point on C's chest / the chord) */
export const CRASH_AT = (): V3 => ({x: CRASH_C.x + DRAG_DIR.x * 0.3, y: chordY(CRASH_C.x + DRAG_DIR.x * 0.3) - 0.2, z: CRASH_C.z + DRAG_DIR.z * 0.3});
export const DRAG = {dir: DRAG_DIR, aContact: A_CONTACT, pairL: PAIR_L};

const A_PLAN: Plan = {
  id: 8105, key: 'd2A',
  phases: [
    {kind: 'd1', name: 'U5'},
    {kind: 'stand', root: [[96.5, 54.6, -7.4, 92], [98.15, 54.6, -7.4, 92], [98.9, A_FL.x, A_FL.z, A_FL.h], [EV2.bash, A_FL.x, A_FL.z, A_FL.h],
      [EV2.bash + 0.32, lerp(A_FL.x, A_STAG.x, 0.55), lerp(A_FL.z, A_STAG.z, 0.55), A_FL.h - 8], [EV2.bash + 0.66, A_STAG.x, A_STAG.z, A_FL.h - 12],
      [104.55, A_STAG.x, A_STAG.z, A_FL.h - 12], [105.4, A_STAG.x - 0.05, A_STAG.z - 0.05, 286]]},
    A_WALK,
    {kind: 'fn', T0: EV2.taut, at: aDrag},
  ],
  act: (T) => {
    if (T < 95.9) return {};
    const fig = decoyPt(0, T, 0.62);
    const look = T < EV2.projOn + 0.1 ? smokeC : T < EV2.bash ? fig : T < EV2.taut ? crewAt : undefined;
    return {
      look, lockAt: 57.7, idle: 0.45,
      // it reaches toward the walking light (an arm raised to strike), lowers it, raises again
      raise: T < EV2.bash ? {t0: 99.3, t1: 101.4, side: 'R'} : undefined,
      armL: T > 101.9 && T < EV2.bash + 0.1 ? {hand: lerp3s(add3(on({x: A_FL.x, z: A_FL.z}), {x: 0.25, y: 0.95, z: 0.05}), lerp3s(on({x: A_FL.x, z: A_FL.z}, 1.75), fig, 0.22), smooth(clamp((T - 101.9) / 0.5)) * (1 - smooth(clamp((T - EV2.bash) / 0.1))))} : undefined,
      hits: [
        {t0: BLAST_HIT, dir: norm3(sub3(on({x: A_FL.x, z: A_FL.z}), BLAST_AT)), strength: 0.35},
        {t0: EV2.bash, dir: {x: 0.96, y: 0, z: -0.25}, strength: 1.5},
        {t0: EV2.sweep, dir: {x: DRAG_DIR.x, y: 0, z: DRAG_DIR.z}, strength: 0.8},
        {t0: EV2.crash + 0.03, dir: {x: -DRAG_DIR.x, y: 0, z: -DRAG_DIR.z}, strength: 1.0},
      ],
      lean: T > EV2.bash && T < 104.6 ? 16 * win(T, EV2.bash, 104.5, 0.06, 0.5) : 0,
      twist: T > EV2.bash && T < 104.6 ? -14 * win(T, EV2.bash, 104.4, 0.06, 0.5) : 0,
      damage: {pauldronR: {t0: EV2.bash, dir: {x: 0.7, y: 0.65, z: -0.3}, speed: 3.0}, dent: {t0: EV2.bash, deg: -8}, back: {t0: EV2.crash + 0.02, dir: {x: -DRAG_DIR.x * 0.4, y: 0.8, z: -DRAG_DIR.z * 0.4 + 0.3}, speed: 2.6}, leak: {t0: EV2.crash + 0.1}, dead: {t0: EV2.crash + 0.45}},
      // it rebounds off C and goes down beside the girder's foot
      fall: {t0: EV2.crash + 0.14, dir: norm3({x: -DRAG_DIR.x * 0.2 + 0.55, y: 0, z: -DRAG_DIR.z * 0.2 + 0.75}), ang: restAng(A_CONTACT, {x: 0.6, z: 0.8})},
    };
  },
};

// ---- B (D1's U7): out from under the girder to watch the light; knee broken, back plate pried, cables ripped
export const B_FL = {x: 51.6, z: -6.6, h: 150};
const B_WALK: Walk = {kind: 'walk', pts: [{x: 55.0, z: -12.4}, {x: 51.0, z: -10.0}, {x: B_FL.x + 0.1, z: B_FL.z - 0.35}], T0: 98.3, T1: 100.55, stride: 1.5, A: 0.6, D: 0.7};
const bStand: Stand = {kind: 'stand', root: [[100.55, B_FL.x + 0.1, B_FL.z - 0.35, 0], [101.0, B_FL.x + 0.1, B_FL.z - 0.35, B_FL.h], [101.6, B_FL.x, B_FL.z, B_FL.h]], stepLen: 0.5};
(() => {
  // the root's first heading = the walk's arrival heading
  const w = walkAt(B_WALK, B_WALK.T1);
  bStand.root[0][3] = w.heading;
  const st = autoSteps(bStand.root, {stepLen: 0.5});
  // the knee drop: the broken (left) leg folds, its foot sliding back under it, shin to the ground; the right stays
  const f = hdir(B_FL.h), r = rightOf(B_FL.h);
  const back: [number, number] = [B_FL.x - f.x * 0.52 - r.x * 0.22, B_FL.z - f.z * 0.52 - r.z * 0.22];
  st.L.push([EV2.knee + 0.02, st.L[st.L.length - 1][1], st.L[st.L.length - 1][2]], [EV2.knee + 0.24, back[0], back[1], 0.03]);
  bStand.feet = st;
})();
const B_PLAN: Plan = {
  id: 8107, key: 'd2B',
  phases: [
    {kind: 'd1', name: 'U7'},
    {kind: 'stand', root: [[96.0, 55.0, -12.4, 85], [97.95, 55.0, -12.4, 85], [98.25, 55.0, -12.4, 200]]},
    B_WALK, bStand,
  ],
  act: (T) => {
    if (T < 96.0) return {};
    const kn = smooth(clamp((T - EV2.knee) / 0.28));
    const sag = kn * (1 - 0.15 * smooth(clamp((T - 104.0) / 1.0)));
    const fig = decoyPt(1, T, 0.6);
    return {
      look: T < EV2.projOn + 0.1 ? smokeC : T < EV2.knee ? fig : T < EV2.pryIn ? on({x: 51.4, z: -8.2}, 1.0) : undefined,
      lockAt: 57.9, idle: 0.45,
      crouch: 0.47 * sag, lean: 14 * kn + 10 * after(T, EV2.rip, 0.3),
      raise: T < EV2.knee ? {t0: 101.2, t1: 102.6, side: 'L'} : undefined,
      // after the knee goes, the right hand braces on its own right knee
      armR: T > EV2.knee + 0.25 && T < EV2.pryPop ? {hand: {x: B_FL.x + hdir(B_FL.h).x * 0.12 + rightOf(B_FL.h).x * 0.26, y: G(B_FL.x, B_FL.z) + 0.62, z: B_FL.z + hdir(B_FL.h).z * 0.12 + rightOf(B_FL.h).z * 0.26}} : undefined,
      hits: [{t0: BLAST_HIT, dir: {x: -0.6, y: 0, z: -0.8}, strength: 0.25}, {t0: EV2.knee, dir: {x: 0.5, y: 0, z: 0.85}, strength: 0.9}, {t0: EV2.pryPop, dir: {x: -0.6, y: 0, z: -0.75}, strength: 0.6}, {t0: EV2.rip, dir: {x: 0.6, y: 0, z: 0.7}, strength: 0.5}],
      damage: {back: {t0: EV2.pryPop, dir: {x: -0.55, y: 0.85, z: -0.4}, speed: 3.2}, dead: {t0: EV2.rip + 0.06}, leak: {t0: EV2.rip}},
      // it topples forward and to its left, down the slope (clear of the pipe's end and the crest)
      fall: {t0: 105.55, dir: hdir(125), ang: restAng(B_FL, hdir(125))},
    };
  },
};

// ---- C (reserve R2)
const C_PLAN: Plan = {
  id: 8112, key: 'd2C',
  phases: [
    {kind: 'd1', name: 'R2'},
    {kind: 'stand', root: [[95.9, 81.0, -10.53, 270], [96.3, 81.0, -10.53, 264]]},
    C_IN,
    {kind: 'stand', root: [[C_IN.T1, C_HOLD.x, C_HOLD.z, 0], [102.4, C_HOLD.x, C_HOLD.z, 205], [103.95, C_HOLD.x, C_HOLD.z, 205], [104.45, C_HOLD.x, C_HOLD.z, 272]]},
    C_WEST,
    {kind: 'fn', T0: EV2.sweep, at: cDrag},
  ],
  act: (T) => {
    if (T < 95.9) return {};
    const tgt = on({x: 45.9, z: -10.95}, 1.4);
    return {
      look: T < 102.0 ? smokeC : T < 104.0 ? decoyPt(1, T, 0.7) : T < EV2.sweep ? tgt : undefined,
      lockAt: 58.9, idle: 0.45,
      raise: T > 104.0 && T < EV2.sweep ? {t0: 106.9, t1: EV2.sweep - 0.1, side: 'R'} : undefined,
      hits: [{t0: EV2.sweep, dir: {x: DRAG_DIR.x, y: 0, z: DRAG_DIR.z}, strength: 1.4}, {t0: EV2.crash, dir: {x: -DRAG_DIR.x, y: 0, z: -DRAG_DIR.z}, strength: 1.6}],
      damage: {chest: {t0: EV2.crash, dir: {x: -DRAG_DIR.x * 0.5 + 0.2, y: 0.75, z: -DRAG_DIR.z * 0.5 + 0.4}, speed: 3.4}, pauldronL: {t0: EV2.crash + 0.02, dir: {x: -0.2, y: 0.7, z: 0.6}, speed: 2.2}, leak: {t0: EV2.crash + 0.08}, dead: {t0: EV2.crash + 0.3}},
      // its upper body stops on the chord, the legs go on: it folds and slumps down sideways at the girder's foot
      fall: {t0: EV2.crash + 0.1, dir: norm3({x: -0.62, y: 0, z: 0.78}), ang: 84},
      crouch: 0.12 * win(T, EV2.crash, EV2.crash + 0.3, 0.04, 0.2),
    };
  },
};

// ---- D (D1's U6): strikes the light; comes up the slope; backhands the runner; its blow on the drone; bashed down
const D_HIT = besideFig(2, EV2.hitB, 1.0, -0.25);
export const D_UP = {x: 50.85, z: -5.05, h: 320};
const D_STEP = {x: 50.15, z: -5.55};
const D_IN: Walk = {kind: 'walk', pts: [{x: 54.2, z: 8.0}, {x: 55.3, z: 4.4}, {x: D_HIT.x, z: D_HIT.z}], T0: 97.45, T1: 99.45, stride: 1.6, A: 0.6, D: 0.6};
const D_HIT2 = besideFig(2, 101.3, 1.0, -0.25);
const D_UPW: Walk = {kind: 'walk', pts: [{x: D_HIT2.x, z: D_HIT2.z}, {x: 54.6, z: -3.4}, {x: 52.7, z: -3.9}, {x: D_UP.x, z: D_UP.z}], T0: 107.45, T1: 110.15, stride: 1.7, A: 0.6, D: 0.7};
/** the backhand: D's right hand sweeps across its body and out into the runner's left shoulder at KNOCKBACK */
export const dBackhand = (T: number, target: V3): {hand: V3; open: boolean} | undefined => {
  if (T < 109.85 || T > 111.3) return undefined;
  const p = on(D_UP), h = D_UP.h, f = hdir(h), r = rightOf(h);
  const P = (fw: number, rt: number, up: number): V3 => ({x: p.x + f.x * fw + r.x * rt, y: p.y + up, z: p.z + f.z * fw + r.z * rt});
  const rest = P(0.12, 0.38, 0.95), wind = P(0.32, -0.42, 1.55), through = add3(target, mul3(norm3(sub3(target, P(0, 0.2, 1.5))), 0.3));
  const K: [number, V3][] = [[109.85, rest], [110.28, wind], [EV2.knock, target], [EV2.knock + 0.16, through], [111.3, rest]];
  for (let i = 1; i < K.length; i++) if (T <= K[i][0]) {
    const u = (T - K[i - 1][0]) / (K[i][0] - K[i - 1][0]);
    const e = i === 2 ? easeIn(u) : i === 3 ? easeOut(u) : smooth(u);
    return {hand: lerp3s(K[i - 1][1], K[i][1], e), open: i >= 2 && i <= 3};
  }
  return undefined;
};
const D_PLAN: Plan = {
  id: 8106, key: 'd2D',
  phases: [
    {kind: 'd1', name: 'U6'},
    {kind: 'stand', root: [[97.05, 54.2, 8.0, 88], [97.45, 54.2, 8.0, 18]]},
    D_IN,
    {kind: 'stand', root: [[D_IN.T1, D_HIT.x, D_HIT.z, 0], [99.62, D_HIT.x, D_HIT.z, D_HIT.h], [100.15, D_HIT.x + hdir(D_HIT.h).x * 0.3, D_HIT.z + hdir(D_HIT.h).z * 0.3, D_HIT.h],
      [100.95, D_HIT2.x, D_HIT2.z, D_HIT2.h], [101.9, D_HIT2.x, D_HIT2.z, D_HIT2.h + 20], [104.5, D_HIT2.x, D_HIT2.z, D_HIT2.h + 20],
      [105.6, D_HIT2.x, D_HIT2.z, 325], [107.4, D_HIT2.x, D_HIT2.z, 325]]},
    D_UPW,
    {kind: 'stand', root: [[D_UPW.T1, D_UP.x, D_UP.z, 0], [110.3, D_UP.x, D_UP.z, D_UP.h], [112.25, D_UP.x, D_UP.z, D_UP.h], [112.75, D_STEP.x, D_STEP.z, D_UP.h - 4], [EV2.counter, D_STEP.x, D_STEP.z, D_UP.h - 4]]},
  ],
  act: (T) => {
    if (T < 96.4) return {};
    const fig2 = decoyPt(2, EV2.hitB, 0.24);
    const runnerHead = on({x: 49.0, z: -6.9}, 1.05);
    const look = T < EV2.projOn + 0.1 ? smokeC : T < 104.5 ? decoyPt(2, T, 0.55) : T < 109.8 ? crewAt : T < 111.4 ? on({x: 49.8, z: -6.2}, 1.45) : runnerHead;
    const bh = dBackhand(T, on({x: 49.95, z: -6.12}, 1.32));
    return {
      look: T < EV2.counter + 0.1 ? look : undefined, lockAt: 57.6, idle: 0.45,
      strike: pickStrike(T, [{t0: EV2.hitB, side: 'L', target: fig2, kind: 'hammer'}, {t0: 101.3, side: 'R', target: decoyPt(2, 101.3, 0.28), kind: 'punch'}, {t0: EV2.shield, side: 'L', target: SHIELD_AT, kind: 'hammer'}]),
      armR: bh ? {hand: bh.hand, open: bh.open} : undefined,
      twist: bh ? 26 * win(T, 109.9, 110.3, 0.3, 0.05) - 30 * win(T, 110.3, 111.2, 0.12, 0.6) : 0,
      hits: [
        {t0: EV2.hitB + 0.08, dir: hdir(D_HIT.h), strength: 0.55},
        {t0: BLAST_HIT, dir: norm3(sub3(on(D_HIT), BLAST_AT)), strength: 0.6},
        {t0: EV2.knock + 0.02, dir: {x: -0.4, y: 0, z: -0.9}, strength: 0.3},
        {t0: EV2.shield + 0.02, dir: {x: 0.85, y: 0, z: 0.5}, strength: 0.6},
        {t0: EV2.counter, dir: {x: -0.72, y: 0, z: 0.69}, strength: 1.7},
      ],
      damage: {dent: {t0: EV2.counter, deg: -11}, pauldronR: {t0: EV2.counter + 0.02, dir: {x: -0.3, y: 0.7, z: 0.6}, speed: 3.0}, leak: {t0: EV2.counter + 0.1}, dead: {t0: 115.0}},
      // the plate lands on its right side: it is driven over to its left, down onto the crest's slope
      fall: {t0: EV2.counter + 0.16, dir: {x: -0.72, y: 0, z: 0.69}, ang: restAng(D_STEP, {x: -0.72, z: 0.69})},
    };
  },
};
/** where D's second blow lands: the allied drone, hovering between it and the runner */
export const SHIELD_AT: V3 = on({x: 49.72, z: -6.32}, 1.28);
/** the allied drone's centre at the blow: just beyond the fist's contact, on the runner's side, a little higher */
export const SHIELD_DRONE: V3 = {x: SHIELD_AT.x - 0.14, y: SHIELD_AT.y + 0.1, z: SHIELD_AT.z - 0.17};

// ---- 8108 (D1's U8): strikes through figure 3 at DECOY_HITa, again at 101.45; searches the smoke; survives
const U8_HIT = besideFig(3, EV2.hitA, 0.95, -0.3);
const U8_IN: Walk = {kind: 'walk', pts: [{x: 54.0, z: 9.6}, {x: 57.0, z: 6.7}, {x: U8_HIT.x, z: U8_HIT.z}], T0: 96.95, T1: 99.12, stride: 1.6, A: 0.6, D: 0.6};
const U8_2 = besideFig(3, 101.45, 0.95, -0.3);
const U8_PLAN: Plan = {
  id: 8108, key: 'd2U8',
  phases: [
    {kind: 'd1', name: 'U8'},
    {kind: 'stand', root: [[96.6, 54.0, 9.6, 80], [96.95, 54.0, 9.6, 46]]},
    U8_IN,
    {kind: 'stand', root: [[U8_IN.T1, U8_HIT.x, U8_HIT.z, 0], [99.3, U8_HIT.x, U8_HIT.z, U8_HIT.h], [99.75, U8_HIT.x + hdir(U8_HIT.h).x * 0.3, U8_HIT.z + hdir(U8_HIT.h).z * 0.3, U8_HIT.h],
      [100.9, U8_2.x, U8_2.z, U8_2.h], [103.5, U8_2.x, U8_2.z, U8_2.h], [104.8, U8_2.x + 0.6, U8_2.z + 0.4, 310], [116.92, U8_2.x + 0.6, U8_2.z + 0.4, 305]]},
  ],
  act: (T) => {
    if (T < 96.4) return {};
    return {
      look: T < EV2.projOn + 0.1 ? smokeC : T < 104.4 ? decoyPt(3, T, 0.55) : on({x: 50, z: -6.5}, 1.5), lockAt: 57.5, idle: 0.5,
      strike: pickStrike(T, [{t0: EV2.hitA, side: 'R', target: decoyPt(3, EV2.hitA, 0.25), kind: 'punch'}, {t0: 101.45, side: 'L', target: decoyPt(3, 101.45, 0.3), kind: 'hammer'}]),
      hits: [{t0: EV2.hitA + 0.08, dir: hdir(U8_HIT.h), strength: 0.6}, {t0: BLAST_HIT, dir: norm3(sub3(on(U8_HIT), BLAST_AT)), strength: 0.3}, {t0: 101.53, dir: hdir(U8_2.h), strength: 0.45}],
    };
  },
};

// ---- the reserve sent into the smoke (R3–R7), R1 holds the north-east rim
const RES: {name: string; id: number; j: number; tS: number; off: number; along: number; T0: number}[] = [
  {name: 'R3', id: 8113, j: 1, tS: 103.55, off: -1.05, along: 0.3, T0: 97.05},
  {name: 'R4', id: 8114, j: 2, tS: 103.95, off: -1.0, along: -0.2, T0: 97.25},
  {name: 'R5', id: 8115, j: 3, tS: 104.35, off: -1.0, along: 0.25, T0: 97.4},
  {name: 'R6', id: 8116, j: 3, tS: 0, off: -3.2, along: 1.6, T0: 97.6},
  {name: 'R7', id: 8117, j: 3, tS: 0, off: -2.4, along: 4.2, T0: 97.8},
];
const resPlan = (r: (typeof RES)[number]): Plan => {
  const s0 = unitD1(r.name, 94.3);
  const from = {x: s0.pos.x, z: s0.pos.z};
  const spot = besideFig(r.j, r.tS || 103.0, r.off, r.along);
  const mid = {x: lerp(from.x, spot.x, 0.55), z: lerp(from.z, spot.z, 0.55) + (r.id % 2 ? 0.8 : -0.6)};
  const w: Walk = {kind: 'walk', pts: [from, mid, {x: spot.x, z: spot.z}], T0: r.T0, T1: r.T0 + 6.0, stride: 1.9, A: 1.0, D: 0.9};
  const end = walkAt(w, w.T1);
  const back = {x: spot.x + 0.4 * (r.id % 2 ? 1 : -1), z: spot.z - 0.3};
  return {
    id: r.id, key: `d2${r.name}`,
    phases: [
      {kind: 'd1', name: r.name},
      {kind: 'stand', root: [[r.T0 - 0.4, from.x, from.z, 270], [r.T0, from.x, from.z, headingTo(from, mid)]]},
      w,
      {kind: 'stand', root: [[w.T1, spot.x, spot.z, end.heading], [w.T1 + 0.5, spot.x, spot.z, spot.h], [109.0 + (r.id % 3) * 0.7, spot.x, spot.z, spot.h], [110.2 + (r.id % 3) * 0.7, back.x, back.z, 290 + (r.id % 4) * 6], [116.92, back.x, back.z, 290 + (r.id % 4) * 6]]},
    ],
    act: (T) => {
      if (T < r.T0 - 0.5) return {};
      return {
        look: T < 103.2 ? smokeC : T < 109.0 ? decoyPt(r.j, T, 0.55) : on({x: 49, z: -6.5}, 1.5), lockAt: 59, idle: 0.5,
        strike: r.tS ? pickStrike(T, [{t0: r.tS, side: r.id % 2 ? 'R' : 'L', target: decoyPt(r.j, r.tS, 0.27), kind: r.id % 2 ? 'punch' : 'hammer'}]) : undefined,
        hits: r.tS ? [{t0: r.tS + 0.08, dir: hdir(spot.h), strength: 0.5}] : [],
      };
    },
  };
};

const PLANS: Record<string, Plan> = {A: A_PLAN, B: B_PLAN, C: C_PLAN, D: D_PLAN, U8: U8_PLAN};
RES.forEach((r) => (PLANS[r.name] = resPlan(r)));
// R1 holds the north-east rim, then steps out of heavy 1's way as it comes along the north side
PLANS.R1 = {id: 8111, key: 'd2R1', phases: [{kind: 'd1', name: 'R1'}, {kind: 'stand', root: [[107.6, 81.0, -11.93, 270], [108.0, 81.0, -11.93, 205], [109.3, 80.1, -10.1, 205], [110.1, 80.1, -10.1, 285]], stepLen: 0.6}], act: (T) => (T > 96.2 ? {look: T > 107.4 && T < 109.6 ? add3(heavy1(T).pos, {x: 0, y: 3.5, z: 0}) : smokeC} : {})};
/** the units whose contacts the close shots show (full meshes nearer than the army) */
export const NAMED = ['A', 'B', 'C', 'D', 'U8'];
export const RESERVE_D2 = ['R1', 'R3', 'R4', 'R5', 'R6', 'R7'];
/** A named D2 unit's spec at film time T (all t0s in film seconds). */
export const unitD2 = (name: string, T: number): UnitSpec => run(PLANS[name], T);

// the blast's shock reaches the nearest units a moment after the flash
const BLAST_HIT = EV2.blast + 0.06;

// ------------------------------------------------------------------ heavy 1 (HEAVIES_B[0], id 3101)
// B's main body stands packed round it, the vanguard's six ranks fill the avenue to the east rim: it goes up the north
// sidewalk (four main-body units step aside for it), turns west along it past the vanguard's flank, and comes down the
// crater's north-east slope under the girder, walking on toward the Crew (D3 takes it from there; the walk halts at the
// path's end, all four feet planted, at HEAVY1.T1).
const HV_PTS: XZ[] = [{x: 104, z: -1}, {x: 102.8, z: -6.0}, {x: 100.6, z: -15.6}, {x: 84, z: -17.0}, {x: 76.5, z: -13.4}, {x: 70.0, z: -8.6}, {x: 63.6, z: -5.6}];
const HV_FULL = pathLen(HV_PTS);
// the line runs on past both ends (the kit samples the path ±2.7 m for the front and rear legs)
const HV_EXT = 6;
const HV_LINE: XZ[] = (() => {
  const a = HV_PTS[HV_PTS.length - 2], b = HV_PTS[HV_PTS.length - 1], l = Math.hypot(b.x - a.x, b.z - a.z);
  return [{x: HV_PTS[0].x + HV_EXT, z: HV_PTS[0].z}, ...HV_PTS, {x: b.x + ((b.x - a.x) / l) * HV_EXT, z: b.z + ((b.z - a.z) / l) * HV_EXT}];
})();
/** the walk length is a whole number of quarter strides, so all four feet are planted when it halts */
const HV_L = Math.floor(HV_FULL / 0.75) * 0.75;
const HV_T0 = 94.4, HV_T1 = 121.0;
const HV_D0 = restD('rear');
const hvLine = linePath(HV_LINE, 2.5);
export const HEAVY1 = {id: HEAVIES_B[0].id, index: 0, T0: HV_T0, T1: HV_T1, end: hvLine(HV_EXT + HV_L), path: HV_PTS};
/** distance walked (m) along HEAVY1.path at film time T */
export const heavy1Dist = (T: number) => runDist(clamp(T, HV_T0, HV_T1), HV_T0, HV_T1, HV_L, 2.2, 2.4);
export const heavy1 = (T: number, o: Partial<HeavySpec> = {}): HeavySpec => {
  const d = heavy1Dist(T);
  const path = (dd: number) => hvLine(dd - HV_D0 + HV_EXT);
  const p = path(HV_D0 + d);
  const crew = on({x: 48.6, z: -6.6}, 1.4);
  return {
    id: HEAVY1.id, t: T, pos: p.pos, heading: p.heading, gait: {path, dist: HV_D0 + d, stride: 3.0}, ground,
    look: T < 96.0 ? on({x: 44, z: 0}, 1.5) : T < 101.4 ? smokeC : T < 111.5 ? decoyPt(1, T, 0.5) : crew,
    eye: 'cyan', lockAt: 99.55, fire: {t0: EV2.fire, target: BLAST_AT}, key: 'd2hv1', ...o,
  };
};
/** B's main-body units on heavy 1's way: they step aside before it reaches them (id, from, to, start) */
export const YIELD: {id: number; to: XZ; T0: number}[] = [
  {id: 4201, to: {x: 98.6, z: -7.6}, T0: 94.6},
  {id: 4003, to: {x: 107.1, z: -10.1}, T0: 95.0},
  {id: 4002, to: {x: 97.7, z: -9.1}, T0: 95.4},
  {id: 4001, to: {x: 95.9, z: -12.6}, T0: 96.8},
];
export const YIELD_IDS = new Set(YIELD.map((y) => y.id));
YIELD.forEach((y) => {
  const u = armyUnits().find((q) => q.id === y.id);
  const from = u ? {x: u.rest.x, z: u.rest.z, h: u.heading} : {x: y.to.x, z: y.to.z, h: 270};
  const hAway = headingTo(from, y.to);
  const dur = 0.8 + Math.hypot(y.to.x - from.x, y.to.z - from.z) / 1.4;
  PLANS[`Y${y.id}`] = {
    id: y.id, key: `d2y${y.id}`,
    phases: [{kind: 'stand', root: [[90, from.x, from.z, from.h], [y.T0, from.x, from.z, from.h], [y.T0 + 0.45, from.x, from.z, hAway], [y.T0 + dur, y.to.x, y.to.z, hAway], [y.T0 + dur + 0.7, y.to.x, y.to.z, 285]], stepLen: 0.6}],
    act: (T) => ({look: T < y.T0 - 0.3 ? smokeC : T < 101.5 ? add3(heavy1(T).pos, {x: 0, y: 3.5, z: 0}) : smokeC, idle: 0.4, eye: 'cyan' as const}),
  };
});
export const YIELD_NAMES = YIELD.map((y) => `Y${y.id}`);
export const UNIT_NAMES = Object.keys(PLANS);

// ------------------------------------------------------------------ enemy drones: D1's, two diving through the light
type K4 = [number, number, number, number];
const kxyz = (k: K4[], T: number): V3 => {
  if (T <= k[0][0]) return {x: k[0][1], y: k[0][2], z: k[0][3]};
  for (let i = 1; i < k.length; i++) if (T <= k[i][0]) {
    const u = smooth((T - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
    return {x: lerp(k[i - 1][1], k[i][1], u), y: lerp(k[i - 1][2], k[i][2], u), z: lerp(k[i - 1][3], k[i][3], u)};
  }
  const l = k[k.length - 1];
  return {x: l[1], y: l[2], z: l[3]};
};
/** a dive: from its hover at t0, down through a figure's chest at tc, out and up the far side, back to its hover by t1 */
const DIVES: {id: number; t0: number; tc: number; t1: number; j: number; out: V3}[] = [
  {id: 8152, t0: 99.3, tc: EV2.hitB, t1: 102.0, j: 1, out: {x: 53.2, y: 2.4, z: 1.6}},
  {id: 8153, t0: 99.55, tc: EV2.hitB + 0.24, t1: 102.3, j: 3, out: {x: 57.2, y: 2.1, z: 6.4}},
];
export const diveThrough = (T: number) => DIVES.map((d) => ({...d, at: decoyPt(d.j, d.tc, 0.66)}));
const divePos = (d: (typeof DIVES)[number], hover: (t: number) => V3, T: number): V3 => {
  const c = decoyPt(d.j, d.tc, 0.66), h0 = hover(d.t0), h1 = hover(d.t1);
  const k: K4[] = [[d.t0, h0.x, h0.y, h0.z], [d.tc - 0.22, lerp(h0.x, c.x, 0.7), lerp(h0.y, c.y, 0.55) + 0.5, lerp(h0.z, c.z, 0.7)], [d.tc, c.x, c.y, c.z], [d.tc + 0.4, d.out.x, d.out.y, d.out.z], [d.t1, h1.x, h1.y, h1.z]];
  // the dive accelerates through the light: keys [t0 → tc] eased in, [tc → out] straight
  if (T > d.tc - 0.22 && T < d.tc + 0.4) {
    const a = T < d.tc ? {p: {x: k[1][1], y: k[1][2], z: k[1][3]}, q: c, u: (T - (d.tc - 0.22)) / 0.22} : {p: c, q: d.out, u: (T - d.tc) / 0.4};
    return lerp3s(a.p, a.q, T < d.tc ? a.u : 1 - (1 - a.u) * (1 - a.u));
  }
  return kxyz(k, T);
};
export const enemyDronesD2 = (T: number): DroneSpec[] => enemyDrones(T).map((s) => {
  const d = DIVES.find((q) => q.id === s.id);
  if (!d || T < d.t0 || T > d.t1) return {...s, key: `d2ed${s.id}`};
  const hover = (t: number) => enemyDrones(t).find((q) => q.id === s.id)!.pos;
  const p = divePos(d, hover, T);
  const v = mul3(sub3(divePos(d, hover, T + 0.04), divePos(d, hover, T - 0.04)), 12.5);
  const sp = Math.hypot(v.x, v.z);
  return {...s, key: `d2ed${s.id}`, pos: p, vel: v, heading: sp > 0.6 ? (Math.atan2(v.x, -v.z) * 180) / Math.PI : s.heading, eye: 'amber', look: decoyPt(d.j, d.tc, 0.66)};
});

// ------------------------------------------------------------------ the allied drone (checker's), continuing D1's flight
/** [T, x, y, z] keys from D1's last key; it follows the flank group to the girder, holds over the fight, darts in
 * between D's blow and the runner at SHIELD (takes the hit), wobbles back and hovers over the regroup at BRIGHT */
export const ALLY2_KEYS: K4[] = [
  [90.5, 45.2, 4.3, 4.9], [94.3, 45.4, 3.5, 4.6], [96.4, 46.2, 4.0, 2.6], [98.3, 46.0, 4.3, 0.2], [100.6, 46.6, 4.4, -5.6], [102.4, 48.2, 4.2, -8.0],
  [104.6, 50.6, 4.5, -7.2], [106.6, 49.6, 4.2, -5.6], [108.6, 48.8, 4.0, -5.0], [110.6, 48.6, 3.2, -5.4], [112.5, 48.3, 2.3, -5.8],
  [112.95, SHIELD_DRONE.x - 0.4, SHIELD_DRONE.y + 0.15, SHIELD_DRONE.z + 0.12], [EV2.shield, SHIELD_DRONE.x, SHIELD_DRONE.y, SHIELD_DRONE.z],
  [113.85, 48.9, 1.7, -5.9], [115.0, 48.2, 2.1, -5.7], [116.92, 47.9, 2.4, -5.6],
];
