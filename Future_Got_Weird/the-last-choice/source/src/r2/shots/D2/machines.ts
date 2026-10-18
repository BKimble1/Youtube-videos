// Section D2 machines: PURE specs (no React, no continuity import) — imported by the shots and by ./persist.ts.
// R3: the machines keep the pressure on while the plan happens, take the bait (they strike at the projected figures),
// and fight back when the Crew hit them: they turn to a threat, block with a forearm in the path, press, parry, shove,
// grab the tether's cable and haul, chain blows, and one comes back out of the smoke at the sound of the fight. The
// exchange vocabulary is MECH's (strikes / parry / catch / shove / press / turns / attend / posture / scan); the
// timeline is EV2 below; the exchange sheet is production/R3_EXCHANGES.md ## D2.
//
// GEOGRAPHY: the broken water main (world/set.tsx 'waterMain', 0.9 m square, (52, −9) → (67, 6)) crosses the crater's
// north-west part; its north-west end lies in the slope (≈ 0.4 m proud), further out it stands 1.2–2.6 m clear of the
// floor. Nothing walks through it: units on its north-east side come round its north-west end. The smoke wall and the
// projected figures are on its south-west side, between it and the slab.
//
//   A  8105 (D1's U5)  taken over at P2 before D1's recall walk reaches the pipe: it pulls up, turns back on the
//                      drone's mark on the slab and walks into the smoke; hammers through figure 1 (HITb); hears the
//                      knee go and turns: blocks the Director's bash with its forearm in the path, hammers him back,
//                      presses him toward the pipe, hooks at his head (he ducks); parries the breaker's swing and shoves
//                      him down; its finishing blow is jerked off by the tether's clamp — it has learned (D1 X4): it
//                      grabs the cable and hauls her a step — she wraps it round girder post 3, the reel drags it across
//                      the slope into C and both slam into the girder (wreck).
//   B  8107 (D1's U7)  turns back from the north rim, comes round the pipe's end, walks into figure 0 and punches
//                      through it (HITa), again at 102.1 — the runner's adze hooks its left knee out (FLANK): on its
//                      knee it backhands at him (he ducks), the fork under its back plate, pop, cables ripped; it falls
//                      forward (wreck).
//   D  8106 (D1's U6)  the system re-commits on the slab (the drone's mark): it comes back up the south slope at the
//                      slab's south end; the breaker covers the pilot from it; the figures appear beside it and it goes
//                      after them (fist through figure 3); the blast of heavy 1's round staggers it; at 106.5 it turns
//                      to the noise of the fight, comes up out of the smoke, hooks into the runner's bar (KNOCKBACK),
//                      presses after him, hammers at him on his knees — the allied drone takes it (SHIELD); the
//                      Director's plate in its side (COUNTER), the runner's adze behind its ankle: down on the crest.
//   U8 8108 (D1's U8)  comes back up the south slope on D's flank; lured: round the burnt car, hammers through figure 3;
//                      searches the smoke (survivor).
//   C  8112 (reserve R2) along the girder's underside from the north-east rim, watching the light; at 105.3 it comes
//                      round the pipe's end at the tether operator — A is dragged into it (wreck).
//   8113–8117 (R3–R7)  the reserve sent down from the east rim after the figures (R5–R7 through the gap in the broken
//                      main); survivors (D3).  8111 (R1) holds the north-east rim (steps out of heavy 1's way).
//   heavy 1 = HEAVIES_B[0] (3101): walks in from (104, −1), fires into the smoke on DECOY_HITc (the round bursts among
//                      its own units), comes through the crater's north part toward the girder; halts at 121.0 (D3).
import type {UnitSpec, DroneSpec, HeavySpec, CatchSpec} from '../../mech';
import {unitRoot, unitAttach} from '../../mech';
import {V3, clamp, smooth, lerp, add3, sub3, mul3, norm3, rnd, easeIn, easeOut} from '../../../kit/math';
import {M} from '../../timing';
import {XZ, G, runDist, runSpeed, cruise, linePath, pathLen, rightOf, headingTo, wrapD, win, after, gaitFoot} from '../D1/motion';
import {unitD1, enemyDrones} from '../D1/machines';
import {HEAVIES_B, restD, armyUnits, heavySpecB} from '../B/army';

const ground = G;
const lerp3s = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
const on = (p: XZ, up = 0): V3 => ({x: p.x, y: G(p.x, p.z) + up, z: p.z});
const hdir = (h: number): V3 => ({x: Math.sin((h * Math.PI) / 180), y: 0, z: -Math.cos((h * Math.PI) / 180)});

// ------------------------------------------------------------------ the timeline (film s)
export const EV2 = {
  // D2-1 PRESSURE: A pulls up and turns back; the drone swings back over the slab with its beam on it; D and U8 come
  // back up the south slope; B turns back from the north rim
  aStop: 94.3, mark0: 94.6, mark1: 98.05, dAtt: 94.5, dWalk0: 95.0, dWalk1: 97.4, u8Walk0: 95.15, u8Walk1: 97.6, bAtt: 95.25,
  // the flare carrier draws, pulls the pins and lobs two canisters into the crater (satchel: rig/crew.ts 94.44 / 95.03)
  draw1: 94.3, pin1: 94.46, rel1: 94.72, draw2: 94.92, pin2: 95.05, rel2: 95.34, canFlight: 0.95, pop: 0.12,
  // D2-2 THE PLAN UNDER THREAT: the sketch (insert), the breaker covers the pilot from D, the tap, the tablet on the
  // slab's top edge, the projector on; the light figures; heads snap round to them
  sketch: 95.48, sketchDur: 1.72, cover: 96.15, tap: 97.36, place: 97.66, projOn: 97.9, projOff: 112.6, lure: 98.02,
  // D2-3 THE BAIT TAKEN: B's fist through figure 0 (HITa) — the Director's signal, the flank goes; A through figure 1,
  // ED1 through figure 2 (HITb); a second drone through figure 3; heavy 1 fires into the smoke (HITc); D, U8
  hitA: M.DECOY_HITa, signal: 99.6, go: 99.78, brkGo: 99.95, hitB: M.DECOY_HITb, dive2: 100.18, fire: M.DECOY_HITc, blast: M.DECOY_HITc + 0.2,
  dHit: 100.95, aHit2: 101.5, u8Hit: 101.85, bHit2: 102.1,
  // D2-4 FLANK
  flank: M.FLANK, knee: 102.25, aTurn: 102.3, block: 102.92, bBack: 103.08, aHam: 103.42, press0: 103.62, press1: 104.2,
  pryIn: 103.58, pryPop: 103.98, rip: 104.36, aHook: 104.45, bFall: 104.62, brkSwing: 104.98, aShove: 105.38, aFin: 106.28,
  // D2-5 TETHER: fire, bite (its finishing blow on the breaker jerked off), it grabs the cable and hauls, the wrap round
  // post 3, the reel; across the slope into C; both into the girder
  tFire: 105.95, tBite: 106.22, grab: 106.42, haul: 106.55, wrap0: 106.6, wrap: 106.9, taut: 107.0,
  cRaise: 107.95, sweep: 108.5, crash: 108.74, release: 109.4, reelEnd: 110.05,
  dTurn: 106.5, dUp0: 107.15, dUp1: 110.05,
  // D2-6 KNOCKBACK / CATCH, D2-7 SHIELD / COUNTER / BRIGHT
  knock: M.KNOCKBACK, catch: M.CATCH, dPress0: 110.82, dPress1: 112.55, shield: M.SHIELD, dAtt2: 113.8, dRe: 114.3,
  counter: M.COUNTER, hook: 114.42, dFall: 114.56, bright: M.BRIGHT,
  /** A, down at the girder, stirs (its eye relights, its head comes round) — the Director's plate on its head */
  aStir: 110.0, aKill: 111.05,
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
/** the tether's anchor: girder post 3 on the south face, just above the bottom chord (where the cable is wrapped;
 *  the only post low enough to reach — D3 wraps here too) */
export const POST3 = postSouth(3);
export const ANCHOR: V3 = postSouth(3, 0.42);

// ------------------------------------------------------------------ the water main (world/set.tsx 'waterMain')
export const PIPE = {a: {x: 52, y: -1.0, z: -9} as V3, b: {x: 67, y: -1.8, z: 6} as V3, half: 0.45};
/** horizontal distance from the pipe's axis segment, and the axis point */
export const pipeDist = (p: XZ): {d: number; at: V3} => {
  const a = PIPE.a, b = PIPE.b, dx = b.x - a.x, dz = b.z - a.z;
  const u = clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz));
  const at = {x: a.x + dx * u, y: a.y + (b.y - a.y) * u, z: a.z + dz * u};
  return {d: Math.hypot(p.x - at.x, p.z - at.z), at};
};

// ------------------------------------------------------------------ the smoke and the decoy (geometry only)
/** where the two canisters land: the wall across the crater's north-west slope, south-west of the pipe */
export const CAN_TO: [XZ, XZ] = [{x: 51.9, z: -1.2}, {x: 54.85, z: -0.45}];
/** the light figures' plane: human-sized walking silhouettes in the smoke (≈ 1.6 × a person, projected — not giants),
 *  walking east-south-east down into the crater, the plane facing the projector on the slab (south-west) */
export const DECOY = {
  center: on({x: 54.4, z: -1.6}, 1.45) as V3,
  walkHeading: 125, height: 2.9, spacing: 1.7, walkSpeed: 0.3, seed: 4,
};
const DU: V3 = hdir(DECOY.walkHeading);
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
/** a figure's chest at the striking unit's own height (the plane is level, the slope is not): the point a unit punches */
const figAt = (j: number, T: number, from: XZ, up = 1.45): V3 => { const f = decoyFoot(j, T); return {x: f.x, y: G(from.x, from.z) + up, z: f.z}; };
/** where heavy 1's round lands (inside the smoke, among the figures' feet: among its own units) */
export const BLAST_AT: V3 = on({x: 55.5, z: -0.95}, 0.35);
/** the drone's mark on the slab's top edge (D1 ED1's sweep found them; at P2 it comes back to it) */
export const MARK_AT: V3 = {x: 47.2, y: 2.97, z: 3.4};
/** where D's left hammer lands: the allied drone, hovering between it and the runner (SHIELD) */
export const SHIELD_AT: V3 = on({x: 49.72, z: -6.32}, 1.28);
/** the allied drone's centre at the blow: just beyond the fist's contact, on the runner's side, a little higher */
export const SHIELD_DRONE: V3 = {x: SHIELD_AT.x - 0.14, y: SHIELD_AT.y + 0.1, z: SHIELD_AT.z - 0.17};
const slabMark: V3 = MARK_AT;
const smokeC: V3 = on({x: 54.4, z: -1.4}, 1.6);
const crewC: V3 = on({x: 50.0, z: -5.6}, 1.5);

// ------------------------------------------------------------------ the people the machines aim at
/**
 * Pure functions of film time T, installed by crew.tsx at import (from each person's body and tool alone — never from
 * a machine's solved pose, so there is no cycle): the Director's plate and head (A blocks, hammers, presses, hooks),
 * the breaker's chest and tool tip (A parries and shoves), the runner's bar and chest (D's hook, press), the
 * Director's head (D's late turn). Re-entry throws (a cycle would otherwise hang a render).
 */
type AimKey = 'plate' | 'head' | 'breaker' | 'brkTip' | 'bar' | 'chest' | 'dirHead';
const guard = (name: string, f: (T: number) => V3) => { let depth = 0; return (T: number): V3 => { if (depth > 0) throw new Error(`D2 aim cycle: ${name}`); depth++; try { return f(T); } finally { depth--; } }; };
export const AIM: Record<AimKey, (T: number) => V3> = {
  plate: guard('plate', () => on({x: 54.4, z: -3.4}, 1.3)), head: guard('head', () => on({x: 54.4, z: -3.4}, 1.6)),
  breaker: guard('breaker', () => on({x: 52.6, z: -2.4}, 1.2)), brkTip: guard('brkTip', () => on({x: 53.1, z: -2.5}, 1.3)),
  bar: guard('bar', () => on({x: 49.95, z: -6.12}, 1.32)), chest: guard('chest', () => on({x: 49.6, z: -6.4}, 1.2)), dirHead: guard('dirHead', () => on({x: 50.6, z: -6.0}, 1.6)),
};
/** the late caches (A's yank, the drag line, D's hooked foot) are only kept once crew.tsx has installed the aims */
let AIM_READY = false;
export const setAim = (o: Partial<Record<AimKey, (T: number) => V3>>) => {
  (Object.keys(o) as AimKey[]).forEach((k) => { AIM[k] = guard(k, o[k]!); });
  AIM_READY = true;
  CACHE.clear();
};
const CACHE = new Map<string, unknown>();
const cached = <X>(key: string, f: () => X): X => {
  if (CACHE.has(key)) return CACHE.get(key) as X;
  const v = f();
  if (AIM_READY) CACHE.set(key, v);
  return v;
};


/**
 * One continuous attention track (MECH's attend snaps to a new entry and drops the old one's torso turn in a frame, so
 * a unit keeps ONE attend entry and its target is blended here): keys [t, point, blend s]; each key takes over from
 * the one before over its blend time (0.12–0.2 s: a snap to a threat; 0.3–0.5 s: a look round). No body turn.
 */
type AttKey = [number, V3 | ((t: number) => V3), number?];
const ptOf = (p: V3 | ((t: number) => V3), t: number) => (typeof p === 'function' ? p(t) : p);
const track = (keys: AttKey[], t1?: number, about?: XZ & {h?: number}): {t0: number; at: (t: number) => V3; t1?: number; turn: false}[] => [{
  t0: keys[0][0], t1, turn: false,
  at: (t: number) => {
    let p = ptOf(keys[0][1], t);
    for (let i = 1; i < keys.length; i++) {
      if (t < keys[i][0]) break;
      const w = smooth(clamp((t - keys[i][0]) / (keys[i][2] ?? 0.3)));
      p = about ? swing(p, ptOf(keys[i][1], t), w, about) : lerp3s(p, ptOf(keys[i][1], t), w);
    }
    return p;
  },
}];
/** blend two look points round the unit (angle the short way, radius and height lerped): a look from a point in
 *  front to one behind it swings round instead of passing through the unit (whose heading-to-target would flip) */
const swing = (p: V3, q: V3, w: number, c: XZ & {h?: number}): V3 => {
  if (w <= 0) return p;
  if (w >= 1) return q;
  // with the unit's heading: the angle relative to it is lerped (the look never swings through its back)
  const h0 = c.h ?? headingTo(c, p);
  const a0 = wrapD(headingTo(c, p) - h0), a1 = c.h !== undefined ? wrapD(headingTo(c, q) - h0) : a0 + wrapD(headingTo(c, q) - headingTo(c, p));
  const a = h0 + lerp(a0, a1, w), r = lerp(Math.hypot(p.x - c.x, p.z - c.z), Math.hypot(q.x - c.x, q.z - c.z), w), d = hdir(a);
  return {x: c.x + d.x * r, y: lerp(p.y, q.y, w), z: c.z + d.z * r};
};

// ------------------------------------------------------------------ unit plans
/** a walk (gait with planted feet; it starts and ends in the standing stance) */
type Walk = {kind: 'walk'; pts: XZ[]; T0: number; T1: number; stride?: number; A?: number; D?: number};
/** standing on a fixed base root: every move comes from the MECH kit's generators (turns, moves, press, dodge and shove
 *  steps, strike lunges) — only those that start in this phase are passed, so a later phase never replays them.
 *  `at` null: where the phase before leaves the unit (a walk's end, or D1's root at T0) */
type Kit = {kind: 'kit'; T0: number; at: {x: number; z: number; h: number} | null};
type FromD1 = {kind: 'd1'; name: string};
/** D1's walk continued from Tk on a new short leg (its path up to Tk is kept, so the planted feet carry over), easing
 *  to a stop at T1 at the leg's end */
type Cont = {kind: 'cont'; name: string; Tk: number; leg: XZ[]; T1: number};
type Fn = {kind: 'fn'; T0: number; at: (T: number) => Partial<UnitSpec> & {pos: V3; heading: number}};
type Phase = Walk | Kit | FromD1 | Cont | Fn;
type Plan = {id: number; key: string; d1?: string; phases: Phase[]; act?: (T: number) => Partial<UnitSpec>};
const startOf = (p: Phase) => (p.kind === 'walk' || p.kind === 'kit' || p.kind === 'fn' ? p.T0 : p.kind === 'cont' ? p.Tk : -1e9);

const walkAt = (w: Walk, T: number) => {
  const L = pathLen(w.pts);
  const d = runDist(clamp(T, w.T0, w.T1), w.T0, w.T1, L, w.A ?? 0.7, w.D ?? 0.7);
  return {...linePath(w.pts, 1.2)(d), d, L};
};
const walkEnd = (w: Walk) => { const e = walkAt(w, w.T1); return {x: e.pos.x, z: e.pos.z, h: e.heading}; };
const walkStartH = (w: Walk) => headingTo(w.pts[0], w.pts[1]);

const LOCO_KEYS = ['turns', 'moves', 'press', 'brace', 'shove'] as const;
const arr = <X>(x: X | X[] | undefined): X[] => (x === undefined ? [] : Array.isArray(x) ? x : [x]);
/** the act's fields for a kit phase starting at t0: locomotion generators that started before it are dropped */
const kitOnly = (a: Partial<UnitSpec>, t0: number): Partial<UnitSpec> => {
  const o: Partial<UnitSpec> & Record<string, unknown> = {...a};
  const lead: Record<string, number> = {brace: 0.55, shove: 0.22};
  for (const k of LOCO_KEYS) (o as Record<string, unknown>)[k] = (arr((a as Record<string, never>)[k]) as {t0: number}[]).filter((q) => q.t0 - (lead[k] ?? 0) >= t0 - 1e-6);
  o.dodge = arr(a.dodge).filter((d) => (d.kind ?? 'lean') !== 'step' || d.t0 - 0.3 >= t0);
  const sl = [...(a.strike ? [a.strike] : []), ...(a.strikes ?? [])];
  o.strike = undefined;
  o.strikes = sl.map((s) => (s.step && s.t0 - 0.4 < t0 ? {...s, step: undefined} : s));
  o.attend = a.attend?.map((x) => (x.t0 + 0.12 < t0 ? {...x, turn: false} : x));
  return o;
};
/** the same act inside a walk: no planted-step generators (the gait moves the feet) */
const walkOnly = (a: Partial<UnitSpec>): Partial<UnitSpec> => {
  const o: Partial<UnitSpec> & Record<string, unknown> = {...a};
  for (const k of LOCO_KEYS) (o as Record<string, unknown>)[k] = undefined;
  const sl = [...(a.strike ? [a.strike] : []), ...(a.strikes ?? [])];
  o.strike = undefined;
  o.strikes = sl.map((s) => ({...s, step: undefined}));
  o.attend = a.attend?.map((x) => ({...x, turn: false}));
  o.dodge = arr(a.dodge).filter((d) => (d.kind ?? 'lean') !== 'step');
  return o;
};

const HIPW = 0.15;
const run = (pl: Plan, T: number): UnitSpec => {
  let i = 0;
  pl.phases.forEach((p, k) => { if (T >= startOf(p)) i = k; });
  const ph = pl.phases[i];
  const act = pl.act ? pl.act(T) : {};
  const lockAt = pl.d1 ? unitD1(pl.d1, 94.3).lockAt : undefined;
  /** D1's crouch / idle at a takeover, blended out over 0.4 s (the handover is invisible) */
  const takeover = (sp: UnitSpec, Tk: number): UnitSpec => {
    if (!pl.d1 || T > Tk + 0.4 || T < Tk) return sp;
    const s = unitD1(pl.d1, Tk), w = 1 - smooth(clamp((T - Tk) / 0.4));
    return {...sp, crouch: lerp(sp.crouch ?? 0, s.crouch ?? 0, w), idle: lerp(sp.idle ?? 0.45, s.idle ?? 0.55, w), lean: lerp(sp.lean ?? 0, s.lean ?? 0, w)};
  };
  if (ph.kind === 'd1') return {...unitD1(ph.name, T), key: pl.key};
  if (ph.kind === 'cont') {
    const c = contAt(ph, T);
    // the swinging foot was headed for D1's next plant: it is eased onto the new leg's over the first 0.3 s
    const w = smooth(clamp((T - ph.Tk) / 0.3));
    if (w < 1 && c.feet) {
      const f1 = unitD1(ph.name, T).feet;
      if (f1?.L && f1?.R) c.feet = {L: lerp3s(f1.L, c.feet.L!, w), R: lerp3s(f1.R, c.feet.R!, w), pitchL: lerp(f1.pitchL ?? 0, c.feet.pitchL ?? 0, w), pitchR: lerp(f1.pitchR ?? 0, c.feet.pitchR ?? 0, w)};
    }
    return takeover({...c, ...walkOnly(act), lean: c.lean, crouch: c.crouch, feet: c.feet, lockAt, key: pl.key}, ph.Tk);
  }
  if (ph.kind === 'walk') {
    const L = pathLen(ph.pts);
    const path = linePath(ph.pts, 1.2);
    const A = ph.A ?? 0.7, D = ph.D ?? 0.7;
    const d = runDist(clamp(T, ph.T0, ph.T1), ph.T0, ph.T1, L, A, D);
    const k = clamp(runSpeed(T, ph.T0, ph.T1, L, A, D) / cruise(ph.T0, ph.T1, L, A, D));
    const at = path(d);
    const a = walkOnly(act);
    // the walk's carriage (4° + speed) eases in from the stance before it, and out into the stance after (kit phase)
    const wIn = i > 0 && pl.phases[i - 1].kind !== 'walk' ? smooth(clamp((T - ph.T0) / 0.35)) : 1;
    return {
      id: pl.id, t: T, pos: at.pos, heading: at.heading, ground, idle: 0.5, key: pl.key, lockAt,
      gait: {path, dist: d, stride: ph.stride ?? 1.6, lift: 0.14, start: 0, end: L},
      ...a, lean: (4 + 6 * k) * wIn + (a.lean ?? 0), crouch: 0.04 * k + (a.crouch ?? 0),
    };
  }
  if (ph.kind === 'kit') {
    const a = kitOnly(act, ph.T0);
    const at = ph.at ?? kitAt(pl, i);
    const prev = pl.phases[i - 1];
    const sp = takeover({id: pl.id, t: T, pos: {x: at.x, y: 0, z: at.z}, heading: at.h, ground, idle: 0.45, key: pl.key, lockAt, ...a}, prev && prev.kind === 'd1' ? ph.T0 : -1e9);
    if (prev && (prev.kind === 'walk' || prev.kind === 'cont')) sp.lean = (sp.lean ?? 0) + 4 * (1 - smooth(clamp((T - ph.T0) / 0.35)));
    return sp;
  }
  return {id: pl.id, t: T, ground, idle: 0.3, key: pl.key, lockAt, ...act, ...ph.at(T)};
};
/** where the phase before a kit phase leaves the unit */
const kitAt = (pl: Plan, i: number) => cached(`kit:${pl.key}:${i}`, () => {
  const prev = pl.phases[i - 1], ph = pl.phases[i] as Kit;
  if (prev.kind === 'walk') return walkEnd(prev);
  if (prev.kind === 'cont') { const c = contAt(prev, prev.T1 + 0.5); return {x: c.pos.x, z: c.pos.z, h: c.heading}; }
  if (prev.kind === 'd1') { const r = unitRoot(unitD1(prev.name, ph.T0)); return {x: r.pos.x, z: r.pos.z, h: r.heading}; }
  const r = unitRoot(run(pl, ph.T0 - 0.001));
  return {x: r.pos.x, z: r.pos.z, h: r.heading};
});
/** D1's walk continued past Tk along a short new leg to a stop (the same gait math as D1's walk, so nothing pops) */
const contAt = (c: Cont, T: number): UnitSpec => {
  const k = cached(`cont:${c.name}:${c.Tk}`, () => {
    const s0 = unitD1(c.name, c.Tk), g = s0.gait!;
    const d0 = g.dist, v0 = (unitD1(c.name, c.Tk + 0.01).gait!.dist - unitD1(c.name, c.Tk - 0.01).gait!.dist) / 0.02;
    const p0 = g.path(d0).pos;
    const leg = [{x: p0.x, z: p0.z}, ...c.leg];
    return {s0, g, d0, v0, leg, Lc: pathLen(leg), legPath: linePath(leg, 0.5)};
  });
  const dur = c.T1 - c.Tk, tau = clamp((T - c.Tk) / dur);
  // Hermite: leaves at D1's speed, arrives at rest
  const h10 = tau * tau * tau - 2 * tau * tau + tau, h01 = -2 * tau * tau * tau + 3 * tau * tau;
  const s = h10 * k.v0 * dur + h01 * k.Lc;
  const path = (d: number) => (d <= k.d0 ? k.g.path(d) : k.legPath(d - k.d0));
  const dist = k.d0 + s, end = k.d0 + k.Lc;
  const at = path(dist), fw = hdir(at.heading), rt = rightOf(at.heading);
  const stride = k.g.stride ?? 1.7, bz0 = 0.6;
  const wk = 1 - smooth((dist - (end - bz0)) / bz0);
  const foot = (sd: -1 | 1, phase: number) => {
    const f = gaitFoot(path, dist, phase, stride, 0.55, sd * (HIPW + 0.02), 0.14);
    const bx = at.pos.x + rt.x * sd * (HIPW + 0.04) + fw.x * sd * 0.04, bz = at.pos.z + rt.z * sd * (HIPW + 0.04) + fw.z * sd * 0.04;
    return {p: lerp3s({x: bx, y: G(bx, bz), z: bz}, f, wk), pitch: (f.stance ? 0 : Math.sin(Math.PI * f.s) * -12) * wk};
  };
  const fl = foot(-1, 0), fr = foot(1, 0.5);
  const vk = tau < 1 ? k.v0 * (3 * tau * tau - 4 * tau + 1) + (k.Lc / dur) * (-6 * tau * tau + 6 * tau) : 0;
  const kk = clamp(vk / Math.max(0.5, k.v0));
  return {
    id: k.s0.id, t: T, pos: at.pos, heading: at.heading, ground, idle: 0.5,
    gait: {path, dist, stride, lift: 0.14, start: 0, end}, feet: {L: fl.p, R: fr.p, pitchL: fl.pitch, pitchR: fr.pitch},
    lean: 4 + 6 * kk, crouch: 0.04 * kk,
  };
};
/** where a plan's unit stands (root, heading) at T: for chaining a walk onto a kit phase */
const rootOf = (pl: Plan, T: number) => { const r = unitRoot(run(pl, T)); return {x: r.pos.x, z: r.pos.z, h: r.heading}; };
/** a strike target pulled back along the blow, so the kit's follow-through ends at a blocking surface, not in it */
const short = (from: V3, at: V3, d = 0.1): V3 => sub3(at, mul3(norm3(sub3(at, from)), d));

/** the angle (from upright) at which a body toppled about p toward d comes to rest on the terrain (see D1) */
function restAng(p: XZ, d: XZ, lo = 70, hi = 150): number {
  const py = G(p.x, p.z) + 0.16;
  for (let a = lo; a <= hi; a += 0.5) {
    const sa = Math.sin((a * Math.PI) / 180), ca = Math.cos((a * Math.PI) / 180);
    for (const [sx, need] of [[0.6, 0.16], [1.0, 0.2], [1.4, 0.22], [1.8, 0.18], [2.05, 0.14]]) {
      const x = p.x + d.x * sx * sa, z = p.z + d.z * sx * sa;
      if (py + sx * ca - G(x, z) < need) return a;
    }
  }
  return hi;
}

// ================================================================== B (D1's U7): round the pipe's end, figure 0, the knee, the pry
export const B_STRIKE_AT = {x: 51.85, z: -3.72};
const B_IN: Walk = {kind: 'walk', pts: [{x: 55.0, z: -12.4}, {x: 53.1, z: -10.55}, {x: 51.15, z: -9.65}, {x: 50.85, z: -7.4}, B_STRIKE_AT], T0: 95.75, T1: 99.05, stride: 1.85, A: 0.7, D: 0.8};
const B_PLAN: Plan = {
  id: 8107, key: 'd2B', d1: 'U7',
  phases: [{kind: 'd1', name: 'U7'}, {kind: 'kit', T0: 95.2, at: null}, B_IN, {kind: 'kit', T0: 99.05, at: null}],
  act: (T) => {
    if (T < 95.2) return {};
    const kn = smooth(clamp((T - EV2.knee) / 0.3));
    const sag = kn * (1 - 0.15 * smooth(clamp((T - 103.6) / 0.8)));
    const back = bBackhand(T);
    return {
      posture: [[95.2, 'idle'], [96.2, 'ready'], [EV2.lure, 'guard'], [EV2.knee, 'idle']],
      attend: track([[EV2.bAtt, slabMark], [EV2.lure, (t) => decoyPt(0, t, 0.5), 0.15], [EV2.knee + 0.06, on({x: 51.2, z: -4.5}, 1.0), 0.14]], EV2.pryIn, {x: 52.13, z: -3.44, h: 164.8}),
      turns: [{t0: 95.28, to: walkStartH(B_IN), dur: 0.45}],
      strikes: [
        {t0: EV2.hitA, side: 'R', kind: 'punch', target: figAt(0, EV2.hitA, B_STRIKE_AT, 1.5), step: 0.25},
        {t0: EV2.bHit2, side: 'L', kind: 'punch', target: figAt(0, EV2.bHit2, B_STRIKE_AT, 1.45), step: 0.15},
      ],
      crouch: 0.5 * sag, lean: 16 * kn + 10 * after(T, EV2.rip, 0.3),
      // on its knee it swings its right arm back at the man behind it (he ducks), then braces the hand on the knee
      armR: back ? {hand: back, open: true} : T > EV2.bBack + 0.75 && T < EV2.pryPop + 0.35 ? {hand: bKneeHand()} : undefined,
      twist: back ? -40 * win(T, EV2.bBack - 0.45, EV2.bBack + 0.4, 0.3, 0.3) : 0,
      hits: [{t0: EV2.knee, dir: hdir(125), strength: 0.9}, {t0: EV2.blast + 0.06, dir: norm3(sub3(on(B_STRIKE_AT), BLAST_AT)), strength: 0.2},
        {t0: EV2.pryPop, dir: hdir(125), strength: 0.5}, {t0: EV2.rip, dir: hdir(305), strength: 0.45}],
      // the plate springs up and off to its left (away from the runner's face)
      damage: {back: {t0: EV2.pryPop, dir: {x: 0.55, y: 0.85, z: -0.1}, speed: 3.0}, dead: {t0: EV2.rip + 0.06}, leak: {t0: EV2.rip}},
      feet: T > EV2.knee - 0.02 ? bKneeFeet(T) : undefined,
      // the broken right knee gives: it goes down forward and to its right (south-south-west), away from the fight
      fall: T > EV2.bFall - 0.5 ? {t0: EV2.bFall, dir: hdir(bRoot().h + 40), ang: restAng(bRoot(), hdir(bRoot().h + 40))} : undefined,
    };
  },
};
/** B's root on its knee (after the strike lunges) */
export const bRoot = () => cached('bRoot', () => rootOf(B_PLAN, EV2.knee - 0.05));
const bKneeFeet = (T: number) => {
  const F = cached('bKnee', () => {
    const r = bRoot(), f = hdir(r.h), rt = rightOf(r.h);
    const L0 = {x: r.x - rt.x * 0.19 - f.x * 0.04, z: r.z - rt.z * 0.19 - f.z * 0.04};
    const R0 = {x: r.x + rt.x * 0.19 + f.x * 0.04, z: r.z + rt.z * 0.19 + f.z * 0.04};
    const Rk = {x: r.x - f.x * 0.55 + rt.x * 0.22, z: r.z - f.z * 0.55 + rt.z * 0.22};
    return {L0: on(L0), R0: on(R0), Rk: on(Rk, 0.03)};
  });
  // the adze yanks the right foot back and out from under it (a slide, no lift): down on the right knee
  const u = clamp((T - EV2.knee) / 0.24);
  const e = 1 - (1 - u) * (1 - u);
  return {L: F.L0, R: lerp3s(F.R0, F.Rk, e), pitchR: -55 * e};
};
const bKneeHand = (): V3 => { const r = bRoot(), f = hdir(r.h), rt = rightOf(r.h); return {x: r.x + f.x * 0.25 - rt.x * 0.24, y: G(r.x, r.z) + 0.62, z: r.z + f.z * 0.25 - rt.z * 0.24}; };
/** the backhand: its right hand sweeps back and round toward the man at its back (he ducks under it) */
const bBackhand = (T: number): V3 | undefined => {
  if (T < EV2.bBack - 0.45 || T > EV2.bBack + 0.75) return undefined;
  const r = bRoot(), p = on(r, 0), f = hdir(r.h), rt = rightOf(r.h);
  const P = (fw: number, ri: number, up: number): V3 => ({x: p.x + f.x * fw + rt.x * ri, y: p.y + up, z: p.z + f.z * fw + rt.z * ri});
  const K: [number, V3][] = [[EV2.bBack - 0.45, bKneeHand()], [EV2.bBack - 0.2, P(0.25, 0.55, 1.3)], [EV2.bBack, P(-0.55, 0.45, 1.25)], [EV2.bBack + 0.18, P(-0.7, 0.05, 1.2)], [EV2.bBack + 0.75, bKneeHand()]];
  for (let i = 1; i < K.length; i++) if (T <= K[i][0]) {
    const u = (T - K[i - 1][0]) / (K[i][0] - K[i - 1][0]);
    return lerp3s(K[i - 1][1], K[i][1], i === 2 ? easeIn(u) : i === 3 ? easeOut(u) : smooth(u));
  }
  return undefined;
};

// ================================================================== A (D1's U5): figure 1, the Director, the cable
export const A_STRIKE_AT = {x: 53.72, z: -2.72};
const A_IN: Walk = {kind: 'walk', pts: [{x: 0, z: 0}, {x: 52.75, z: -5.1}, A_STRIKE_AT], T0: 95.7, T1: 98.6, stride: 1.5, A: 0.8, D: 0.9};
/** the point on the tether's cable A grabs: 0.42 m from the clamp on its chest along the line to the post (its chest
 *  solved without the catch itself) */
const aCable = (T: number): V3 => {
  const s = run(A_PLAN, Math.min(T, EV2.crash));
  const c = unitAttach({...s, catch: undefined, attend: s.attend?.filter((q) => q.t0 < EV2.tBite)}).chest;
  return add3(c, mul3(norm3(sub3(ANCHOR, c)), 0.42));
};
export const aCablePt = (T: number) => aCable(T);
/** where it looks once the clamp bites: down the cable's line, 1.3 m out from its chest toward the post (a fixed point:
 *  the cable's own position depends on A's chest) */
const A_CABLE_LOOK: V3 = (() => { const c = on(A_STRIKE_AT, 1.35); return add3(c, mul3(norm3(sub3(ANCHOR, c)), 1.3)); })();
const A_PLAN: Plan = {
  id: 8105, key: 'd2A', d1: 'U5',
  phases: [
    {kind: 'd1', name: 'U5'},
    // D1's recall walk would take it into the pipe: it pulls up hard, swinging right, in two strides
    {kind: 'cont', name: 'U5', Tk: EV2.aStop, leg: [{x: 52.78, z: -7.12}, {x: 52.9, z: -6.9}], T1: EV2.aStop + 0.62},
    {kind: 'kit', T0: EV2.aStop + 0.62, at: null},
    A_IN, {kind: 'kit', T0: A_IN.T1, at: null},
  ],
  act: (T) => {
    if (T < EV2.aStop) return {};
    const strain = win(T, EV2.haul, EV2.taut + 0.1, 0.1, 0.12);
    const brk = AIM.breaker;
    return {
      posture: [[EV2.aStop, 'idle'], [95.6, 'ready'], [EV2.lure, 'guard']],
      // the knee goes behind it: it snaps round to the noise and the man coming at it; the breaker; the clamp's line
      attend: track([[EV2.aStop + 0.3, slabMark, 0.4], [EV2.lure, (t) => decoyPt(1, t, 0.5), 0.15], [EV2.aTurn, (t) => AIM.head(t), 0.12],
        [EV2.brkSwing - 0.42, (t) => brk(t), 0.15], [EV2.tBite + 0.05, A_CABLE_LOOK, 0.15], [EV2.taut + 0.05, on(ANCHOR, 1.2), 0.45]], EV2.crash, A_STRIKE_AT),
      turns: [
        {t0: EV2.aStop + 0.72, to: walkStartH(A_IN), dur: 0.5},
        // turn-to-threat (planted pivot), fast: it is still coming round as the plate arrives
        {t0: EV2.aTurn + 0.02, to: AIM.head(EV2.block), dur: 0.5},
        {t0: EV2.brkSwing - 0.42, to: brk(EV2.brkSwing - 0.3), dur: 0.34},
      ],
      strikes: [
        {t0: EV2.hitB, side: 'L', kind: 'hammer', target: figAt(1, EV2.hitB, A_STRIKE_AT, 1.55), step: 0.2},
        {t0: EV2.aHit2, side: 'R', kind: 'hook', target: figAt(1, EV2.aHit2, A_STRIKE_AT, 1.5)},
        // the counter: a left hammer on the Director's plate (he takes it), then a right hook at his head (he ducks it)
        {t0: EV2.aHam, side: 'L', kind: 'hammer', target: short(add3(AIM.head(EV2.aHam), {x: 0, y: 0.7, z: 0}), AIM.plate(EV2.aHam), 0.04), step: 0.25},
        {t0: EV2.aHook, side: 'R', kind: 'hook', target: add3(AIM.head(EV2.aHook - 0.3), {x: 0, y: 0.05, z: 0})},
        // the finishing blow at the breaker on his knee — the clamp bites as it comes down: it goes into the ground
        {t0: EV2.aFin, side: 'R', kind: 'hammer', target: add3(brk(EV2.aFin), {x: 0.45, y: -0.75, z: 0.25})},
      ],
      // its right forearm in the path of the Director's bash (heavy block), its left parries the breaker's swing
      parry: [
        {t0: EV2.block, side: 'R', at: (t) => AIM.plate(t), kind: 'block', force: 1.3, t1: EV2.block + 0.3},
        {t0: EV2.brkSwing, side: 'L', at: (t) => AIM.brkTip(t), kind: 'parry', force: 1.1},
      ],
      press: {t0: EV2.press0, t1: EV2.press1, target: (t) => AIM.plate(t), reach: 1.0, beat: 0.28},
      shove: {t0: EV2.aShove, target: (t) => brk(t), side: 'both', step: 0.3},
      // the clamp on its chest: it has learned (D1 X4) — it grabs the cable with its right hand and hauls along it
      catch: {t0: EV2.grab, side: 'R', at: (t) => aCable(t), hold: (t) => aCable(t), t1: EV2.taut + 0.25,
        wrench: {t0: EV2.haul, dir: norm3(sub3(on(A_STRIKE_AT), ANCHOR)), dist: 0.4, deg: 25}},
      lean: 10 * strain,
      hits: [{t0: EV2.blast + 0.06, dir: norm3(sub3(on(A_STRIKE_AT), BLAST_AT)), strength: 0.55}, {t0: EV2.tBite, dir: norm3(sub3(ANCHOR, on(A_STRIKE_AT))), strength: 0.7}],
    };
  },
};

// ---- the drag (TETHER): the reel pulls A across the slope toward girder post 3; it hits C; both slam into the girder
// where its bottom chord comes down to their shoulders (the line runs up the slope, past the pipe's end)
/** A at the moment the reel goes taut (the start of the drag) */
export const aYank = () => cached('aYank', () => rootOf(A_PLAN, EV2.taut - 0.001));
const dragDir = () => { const a = aYank(); const d = {x: ANCHOR.x - a.x, z: ANCHOR.z - a.z}; const l = Math.hypot(d.x, d.z); return {x: d.x / l, z: d.z / l}; };
const GAP = 0.78; // A's centre behind C's at contact
/** after the crash both go down along the girder's south face, toward the pipe's end (a wreck barricade under it) */
const A_FALL: V3 = norm3({x: 0.8, y: 0, z: -0.6});
const C_FALL: V3 = norm3({x: 0.75, y: 0, z: -0.66});
/** the crash stop along the line from A: C's centre where the chord's underside meets its shoulders */
export const crashC = (): XZ => cached('crashC', () => {
  const a = aYank(), d = dragDir();
  for (let s = 1; s < 16; s += 0.05) {
    const x = a.x + d.x * s, z = a.z + d.z * s;
    const fx = x + d.x * 0.28, fz = z + d.z * 0.28;
    const clearance = chordY(fx) - 0.22 - G(fx, fz);
    if (clearance < 1.92 && Math.abs(fz - faceZ(fx)) < 0.55) return {x, z};
    if (clearance < 1.6) return {x, z};
  }
  return {x: a.x + d.x * 9, z: a.z + d.z * 9};
});
/** the pair's travel together (C shoved into the chord), and A's run-up before it meets C */
const PAIR_L = 0.95;
const A_L1 = () => { const a = aYank(), e = crashC(); return Math.hypot(e.x - a.x, e.z - a.z) - PAIR_L - GAP; };
/** C at the sweep: on A's line, GAP beyond A's contact point */
export const cHit = () => { const a = aYank(), d = dragDir(), L = A_L1() + GAP; return {x: a.x + d.x * L, z: a.z + d.z * L}; };
const aContact = () => { const c = cHit(), d = dragDir(); return {x: c.x - d.x * GAP, z: c.z - d.z * GAP}; };
/** A's distance along the line: the reel takes up the slack, accelerates over 0.45 s, then hauls at a steady pace */
const aDragS = (T: number) => {
  const L1 = A_L1(), D = EV2.sweep - EV2.taut, ta = 0.45;
  const v = L1 / (D - ta / 2);
  const t = clamp(T - EV2.taut, 0, D);
  return t < ta ? (v * t * t) / (2 * ta) : v * (t - ta / 2);
};
/** pair travel after the hit (m), 0 … PAIR_L at the crash */
const pairS = (T: number) => { const u = clamp((T - EV2.sweep) / (EV2.crash - EV2.sweep)); return PAIR_L * (1 - (1 - u) * (1 - u) * (1 - 0.35 * u)); };
/** A's root during the drag (yanked by the chest clamp: hauled chest-first, its feet skidding behind) */
const aDrag = (T: number): Partial<UnitSpec> & {pos: V3; heading: number} => {
  const a0 = aYank(), d = dragDir();
  let x: number, z: number;
  if (T < EV2.sweep) { const s = aDragS(T); x = a0.x + d.x * s; z = a0.z + d.z * s; }
  else {
    const ac = aContact();
    const s = Math.min(pairS(T), PAIR_L - 0.05) - 0.06 * win(T, EV2.crash, EV2.crash + 0.5, 0.06, 0.3);
    x = ac.x + d.x * s; z = ac.z + d.z * s;
  }
  const hPull = headingTo({x: 0, z: 0}, d);
  const h = a0.h + wrapD(hPull - a0.h) * smooth(clamp((T - EV2.taut) / 0.35)) * 0.75;
  const f = hdir(h), r = rightOf(h);
  const trail = 0.3 * win(T, EV2.taut, EV2.crash + 0.2, 0.15, 0.2);
  // the kit stance at the yank, carried along with the root (skidding), settling into the dragged trail over 0.35 s
  const F0 = cached('aFeetTaut', () => { const q = unitAttach(run(A_PLAN, EV2.taut - 0.001)); return {L: q.footL, R: q.footR}; });
  const wF = smooth(clamp((T - EV2.taut) / 0.35));
  const foot = (sd: number): V3 => {
    const q = sd < 0 ? F0.L : F0.R;
    const sx = q.x + (x - a0.x), sz = q.z + (z - a0.z);
    const fx = lerp(sx, x - f.x * trail + r.x * sd * 0.19, wF), fz = lerp(sz, z - f.z * trail + r.z * sd * 0.19, wF);
    return {x: fx, y: G(fx, fz), z: fz};
  };
  return {pos: {x, y: 0, z}, heading: h, idle: 0.45, feet: {L: foot(-1), R: foot(1), pitchL: (-18 * trail) / 0.3, pitchR: (-14 * trail) / 0.3},
    lean: 10 + 14 * win(T, EV2.taut + 0.05, EV2.crash + 0.06, 0.2, 0.12)};
};
/** where the pair hit the girder (the impact point on C's chest / the chord) */
export const CRASH_AT = (): V3 => { const e = crashC(), d = dragDir(); return {x: e.x + d.x * 0.3, y: chordY(e.x + d.x * 0.3) - 0.2, z: e.z + d.z * 0.3}; };
export const DRAG = {get dir() { return dragDir(); }, get aContact() { return aContact(); }, get pairL() { return PAIR_L; }};

A_PLAN.phases.push({kind: 'fn', T0: EV2.taut, at: aDrag});
const A_ACT0 = A_PLAN.act!;
A_PLAN.act = (T) => {
  const a = A_ACT0(T);
  if (T < EV2.taut) return a;
  const d = dragDir();
  return {
    // the drag is the root now: the kit's locomotion generators go (their effect is in the yank root), the arms stay
    ...a, press: undefined, shove: undefined, turns: undefined,
    strikes: (a.strikes as {t0: number; step?: number}[] | undefined)?.map((q) => ({...q, step: undefined})) as UnitSpec['strikes'],
    // its right hand stays on the cable as the reel drags it chest-first; the crash tears it off the line
    catch: {...(a.catch as CatchSpec), t1: EV2.crash - 0.04},
    attend: T > EV2.crash ? [{t0: EV2.aStir, at: (t) => AIM.head(t), t1: EV2.aKill, turn: false}] : a.attend, posture: [...((a.posture as [number, 'idle' | 'guard' | 'ready' | 'lowered'][]) ?? []), [EV2.taut, 'idle']],
    hits: [...(a.hits ?? []), {t0: EV2.sweep, dir: {x: d.x, y: 0, z: d.z}, strength: 0.8}, {t0: EV2.crash + 0.03, dir: {x: -d.x, y: 0, z: -d.z}, strength: 1.0}, {t0: EV2.aKill, dir: {x: 0.3, y: -1, z: -0.2}, strength: 0.6}],
    damage: {back: {t0: EV2.crash + 0.02, dir: {x: -d.x * 0.4, y: 0.8, z: -d.z * 0.4 + 0.3}, speed: 2.6}, leak: {t0: EV2.crash + 0.1}, dent: {t0: EV2.aKill, deg: 9}, dead: {t0: EV2.aKill + 0.04}},
    // it rebounds off C and goes down on its side along the girder's south face (beside C: the wreck barricade)
    fall: {t0: EV2.crash + 0.14, dir: A_FALL, ang: restAng(aContact(), A_FALL)},
    eye: T > EV2.crash + 0.2 && T < EV2.aStir ? 'off' : undefined,
  };
};

// ================================================================== C (reserve R2): along the girder; round the pipe's end
const C_IN: Walk = {kind: 'walk', pts: [{x: 81.0, z: -10.53}, {x: 76.4, z: -9.2}, {x: 74.0, z: -7.5}, {x: 70.4, z: -7.2}, {x: 66.0, z: -8.6}, {x: 58.6, z: -9.1}], T0: 96.35, T1: 101.8, stride: 2.0, A: 1.0, D: 0.8};
const C_HOLD = {x: 58.6, z: -9.1};
/** C's walk west along the girder's south side, round the pipe's end, at the tether operator: through cHit at the sweep
 *  (it arrives at speed; the drag takes it from there) */
const cWest = (): Walk => cached('cWest', () => {
  const c = cHit();
  return {kind: 'walk', pts: [C_HOLD, {x: 54.6, z: -9.9}, {x: 52.3, z: -10.2}, {x: c.x + 0.9, z: c.z - 0.6}, {x: c.x, z: c.z}], T0: 105.3, T1: EV2.sweep, stride: 1.65, A: 0.7, D: 0};
});
const cDrag = (T: number): Partial<UnitSpec> & {pos: V3; heading: number} => {
  const c0 = cHit(), d = dragDir(), w = cWest();
  const s = pairS(T) - 0.08 * win(T, EV2.crash, EV2.crash + 0.45, 0.05, 0.3);
  const x = c0.x + d.x * s, z = c0.z + d.z * s;
  // hit from behind while walking: shoved along the line, it twists toward it
  const h0 = headingTo(w.pts[w.pts.length - 2], w.pts[w.pts.length - 1]);
  const h = h0 + wrapD(headingTo({x: 0, z: 0}, d) - h0) * smooth(clamp((T - EV2.sweep) / 0.25)) * 0.5;
  const f = hdir(h), r = rightOf(h);
  const trail = 0.22 * win(T, EV2.sweep, EV2.crash + 0.15, 0.05, 0.2);
  const foot = (sd: number): V3 => { const fx = x - f.x * trail + r.x * sd * 0.19, fz = z - f.z * trail + r.z * sd * 0.19; return {x: fx, y: G(fx, fz), z: fz}; };
  return {pos: {x, y: 0, z}, heading: h, feet: {L: foot(-1), R: foot(1), pitchL: -12, pitchR: -16}, lean: -12 * win(T, EV2.sweep, EV2.crash + 0.04, 0.04, 0.14) + 14 * after(T, EV2.crash - 0.03, 0.14)};
};
const C_PLAN: Plan = {
  id: 8112, key: 'd2C', d1: 'R2',
  phases: [{kind: 'd1', name: 'R2'}, {kind: 'kit', T0: 95.9, at: null}, C_IN, {kind: 'kit', T0: C_IN.T1, at: null},
    {kind: 'fn', T0: 105.3, at: (T) => {
      const w = cWest();
      const L = pathLen(w.pts), path = linePath(w.pts, 1.0);
      const d = runDist(Math.min(T, w.T1), w.T0, w.T1, L, w.A ?? 0.7, 0);
      const k = clamp(runSpeed(T, w.T0, w.T1, L, w.A ?? 0.7, 0) / cruise(w.T0, w.T1, L, w.A ?? 0.7, 0));
      const at = path(d);
      return {pos: at.pos, heading: at.heading, gait: {path, dist: d, stride: w.stride ?? 1.6, lift: 0.14, start: 0, end: 1e9}, lean: (5 + 6 * k) * smooth(clamp((T - w.T0) / 0.4)), crouch: 0.04 * k, idle: 0.5};
    }},
    {kind: 'fn', T0: EV2.sweep, at: cDrag},
  ],
  act: (T) => {
    if (T < 95.9) return {};
    if (T < 105.3) return {
      posture: [[95.9, 'idle'], [102.0, 'ready'], [104.5, 'guard']],
      attend: track([[95.95, smokeC, 0.4], [98.3, (t) => decoyPt(0, t, 0.6), 0.3], [104.45, on({x: 50.6, z: -8.6}, 1.4), 0.2]]),
      turns: [{t0: 96.0, to: walkStartH(C_IN), dur: 0.35}, {t0: C_IN.T1 + 0.05, to: 215, dur: 0.6}, ...(T > 104.5 ? [{t0: 104.7, to: walkStartH(cWest()), dur: 0.5}] : [])],
    };
    const d = dragDir();
    return {
      posture: [[95.9, 'idle'], [102.0, 'ready'], [104.5, 'guard']],
      attend: T < EV2.sweep + 0.4 ? track([[95.95, smokeC, 0.4], [98.3, (t) => decoyPt(0, t, 0.6), 0.3], [104.45, on({x: 50.6, z: -8.6}, 1.4), 0.2], [106.2, on({x: 47.0, z: -10.8}, 1.4), 0.4]], EV2.sweep) : undefined,
      raise: T < EV2.sweep + 0.1 ? {t0: EV2.cRaise, t1: EV2.sweep - 0.02, side: 'R'} : undefined,
      hits: [{t0: EV2.sweep, dir: {x: d.x, y: 0, z: d.z}, strength: 1.4}, {t0: EV2.crash, dir: {x: -d.x, y: 0, z: -d.z}, strength: 1.6}],
      damage: {chest: {t0: EV2.crash, dir: {x: -d.x * 0.5 + 0.2, y: 0.75, z: -d.z * 0.5 + 0.4}, speed: 3.4}, pauldronL: {t0: EV2.crash + 0.02, dir: {x: -0.2, y: 0.7, z: 0.6}, speed: 2.2}, leak: {t0: EV2.crash + 0.08}, dead: {t0: EV2.crash + 0.3}},
      // its upper body stops on the chord, the legs go on: it folds and slumps down sideways at the girder's foot
      fall: {t0: EV2.crash + 0.1, dir: C_FALL, ang: 84},
      crouch: 0.12 * win(T, EV2.crash, EV2.crash + 0.3, 0.04, 0.2),
    };
  },
};

// ================================================================== D (D1's U6): the slab, the light, the runner
const D_COME: Walk = {kind: 'walk', pts: [{x: 0, z: 0}, {x: 53.5, z: 7.45}, {x: 52.85, z: 6.9}], T0: EV2.dWalk0, T1: EV2.dWalk1, stride: 1.5, A: 0.6, D: 0.7};
export const D_LURE_AT = {x: 55.75, z: 1.35};
const D_LURE: Walk = {kind: 'walk', pts: [{x: 0, z: 0}, {x: 53.9, z: 4.95}, D_LURE_AT], T0: 98.62, T1: 100.62, stride: 1.75, A: 0.55, D: 0.55};
/** up out of the smoke at the noise of the fight, to the crest in front of the runner (west of B's wreck) */
export const D_UP = {x: 50.85, z: -5.05};
const D_UPW: Walk = {kind: 'walk', pts: [{x: 0, z: 0}, {x: 54.6, z: -0.9}, {x: 53.35, z: -3.55}, {x: 52.2, z: -4.75}, {x: D_UP.x, z: D_UP.z}], T0: EV2.dUp0, T1: EV2.dUp1, stride: 1.7, A: 0.6, D: 0.65};
/** where the runner's adze pulls D's left ankle toward (him, on his knees) */
export const D_ANKLE_TO: XZ = {x: 49.17, z: -6.73};
const D_PLAN: Plan = {
  id: 8106, key: 'd2D', d1: 'U6',
  phases: [{kind: 'd1', name: 'U6'}, {kind: 'kit', T0: EV2.dAtt, at: null}, D_COME, {kind: 'kit', T0: EV2.dWalk1, at: null}, D_LURE, {kind: 'kit', T0: D_LURE.T1, at: null},
    D_UPW, {kind: 'kit', T0: EV2.dUp1, at: null}],
  act: (T) => {
    if (T < EV2.dAtt) return {};
    return {
      posture: [[EV2.dAtt, 'idle'], [95.6, 'ready'], [97.0, 'guard'], [EV2.lure + 0.4, 'ready'], [100.3, 'guard'], [106.2, 'ready'], [109.4, 'guard'], [EV2.counter, 'idle']],
      // the drone's mark; the breaker at the slab's south end, tool up (it squares up to him); the figures; the light
      // doesn't fall: it turns to the noise of the fight; the runner; the Director coming in
      attend: track([[EV2.dAtt, slabMark, 0.4], [97.4, on({x: 47.35, z: 6.8}, 1.4), 0.2], [EV2.lure, (t) => decoyPt(3, t, 0.5), 0.15], [102.6, (t) => decoyPt(2, t, 0.5), 0.4],
        [EV2.dTurn, crewC, 0.15], [EV2.dUp1 - 0.6, (t) => AIM.chest(t), 0.3], [EV2.dAtt2, (t) => AIM.dirHead(t), 0.12]], EV2.dFall),
      turns: [{t0: EV2.dAtt + 0.05, to: walkStartH(D_COME), dur: 0.42}, {t0: EV2.lure + 0.12, to: walkStartH(D_LURE), dur: 0.45}, {t0: EV2.dTurn + 0.05, to: walkStartH(D_UPW), dur: 0.55}],
      strikes: [
        {t0: EV2.dHit, side: 'R', kind: 'punch', target: figAt(3, EV2.dHit, D_LURE_AT, 1.5), step: 0.2},
        {t0: 102.4, side: 'L', kind: 'hammer', target: figAt(3, 102.4, D_LURE_AT, 1.6)},
        {t0: 104.3, side: 'R', kind: 'hook', target: figAt(2, 104.3, D_LURE_AT, 1.45), step: 0.25},
        // KNOCKBACK: a right hook into the bar he raises (his parry can't hold it)
        {t0: EV2.knock, side: 'R', kind: 'hook', target: short(on(D_UP, 1.5), AIM.bar(EV2.knock), -0.08), step: 0.25},
        // SHIELD: the left hammer at him on his knees (the allied drone takes it), the right re-chambers (cut off)
        {t0: EV2.shield, side: 'L', kind: 'hammer', target: SHIELD_AT, step: 0.15},
        {t0: EV2.dRe, side: 'R', kind: 'punch', target: on({x: 49.0, z: -5.7}, 0.9)},
      ],
      press: {t0: EV2.dPress0, t1: EV2.dPress1, target: (t) => AIM.chest(t), reach: 1.05, beat: 0.3},
      hits: [
        {t0: EV2.blast + 0.06, dir: norm3(sub3(on(D_LURE_AT), BLAST_AT)), strength: 0.7},
        {t0: EV2.shield + 0.02, dir: {x: 0.85, y: 0, z: 0.5}, strength: 0.45},
        {t0: EV2.counter, dir: {x: -0.72, y: 0, z: 0.69}, strength: 1.7},
      ],
      damage: {dent: {t0: EV2.counter, deg: -11}, pauldronR: {t0: EV2.counter + 0.02, dir: {x: -0.3, y: 0.7, z: 0.6}, speed: 3.0}, leak: {t0: EV2.counter + 0.1}, dead: {t0: 115.05}},
      // the runner's adze behind its left ankle: the foot goes out and it goes down on the crest
      feet: T > EV2.hook - 0.02 ? dHookFeet(T) : undefined,
      fall: {t0: EV2.dFall, dir: norm3({x: -0.62, y: 0, z: 0.78}), ang: restAng(D_UP, {x: -0.62, z: 0.78})},
    };
  },
};
/** D's left foot when the adze catches it (the runner's hook target) and where it is pulled */
export const dHookFoot = () => cached('dHook', () => {
  const s = run(D_PLAN, EV2.hook - 0.03);
  const a = unitAttach({...s, feet: undefined});
  const L0 = on(a.footL), R0 = on(a.footR);
  const pull = norm3(sub3(on(D_ANKLE_TO), L0));
  return {L0, R0, L1: on({x: L0.x + pull.x * 0.55, z: L0.z + pull.z * 0.55})};
});
const dHookFeet = (T: number) => {
  const k = dHookFoot();
  const u = clamp((T - EV2.hook) / 0.2);
  return {L: lerp3s(k.L0, k.L1, 1 - (1 - u) * (1 - u)), R: k.R0, pitchL: 20 * u};
};

// ================================================================== U8 (D1's U8): D's flank; round the car; figure 3
const U8_COME: Walk = {kind: 'walk', pts: [{x: 0, z: 0}, {x: 55.0, z: 8.45}, {x: 55.5, z: 7.6}], T0: EV2.u8Walk0, T1: EV2.u8Walk1, stride: 1.5, A: 0.6, D: 0.7};
export const U8_LURE_AT = {x: 57.35, z: 0.75};
const U8_LURE: Walk = {kind: 'walk', pts: [{x: 0, z: 0}, {x: 58.6, z: 6.95}, {x: 59.85, z: 4.2}, {x: 59.1, z: 1.75}, U8_LURE_AT], T0: 98.7, T1: 101.5, stride: 1.8, A: 0.5, D: 0.55};
const U8_PLAN: Plan = {
  id: 8108, key: 'd2U8', d1: 'U8',
  phases: [{kind: 'd1', name: 'U8'}, {kind: 'kit', T0: 94.6, at: null}, U8_COME, {kind: 'kit', T0: EV2.u8Walk1, at: null}, U8_LURE, {kind: 'kit', T0: U8_LURE.T1, at: null}],
  act: (T) => {
    if (T < 94.6) return {};
    return {
      posture: [[94.6, 'idle'], [95.8, 'ready'], [EV2.lure, 'guard'], [106.0, 'ready']],
      attend: track([[94.65, slabMark, 0.4], [EV2.lure + 0.05, (t) => decoyPt(3, t, 0.5), 0.15], [103.75, (t) => decoyPt(0, t, 0.5), 0.45]], 109.0, {x: 57.55, z: 0.77, h: -60.3}),
      turns: [{t0: 94.7, to: walkStartH(U8_COME), dur: 0.4}, {t0: EV2.lure + 0.2, to: walkStartH(U8_LURE), dur: 0.45}],
      strikes: [{t0: EV2.u8Hit, side: 'L', kind: 'hammer', target: figAt(3, EV2.u8Hit, U8_LURE_AT, 1.55), step: 0.2}, {t0: 103.4, side: 'R', kind: 'punch', target: figAt(3, 103.4, U8_LURE_AT, 1.5), step: 0.2}],
      moves: [{t0: 105.2, t1: 106.6, to: on({x: 58.5, z: 1.9}), guard: true}],
      scan: {t0: 109.45, t1: 116.92, center: on({x: 55.5, z: 0.5}, 1.5), span: 110, dwell: 0.9, torso: 0},
      hits: [{t0: EV2.blast + 0.06, dir: norm3(sub3(on(U8_LURE_AT), BLAST_AT)), strength: 0.35}],
    };
  },
};

// ================================================================== the reserve sent into the smoke (R3–R7), R1
// R3/R4 stay on the pipe's north-east side (they reach toward the figures across it); R5–R7 come through the gap in
// the broken main (between its two lengths, ≈ (68, 7.3)) onto the south-west side
const RES: {name: string; id: number; pts: XZ[]; T0: number; T1: number; j: number; tS: number}[] = [
  {name: 'R3', id: 8113, pts: [{x: 70.5, z: -3.2}, {x: 61.6, z: -2.2}], T0: 97.05, T1: 103.2, j: 2, tS: 0},
  {name: 'R4', id: 8114, pts: [{x: 70.0, z: 1.2}, {x: 63.6, z: 0.2}], T0: 97.25, T1: 103.4, j: 3, tS: 0},
  {name: 'R5', id: 8115, pts: [{x: 73.0, z: 6.2}, {x: 68.1, z: 7.35}, {x: 63.0, z: 4.9}, {x: 59.5, z: 3.1}], T0: 97.4, T1: 104.2, j: 3, tS: 104.55},
  {name: 'R6', id: 8116, pts: [{x: 73.5, z: 7.9}, {x: 68.0, z: 7.6}, {x: 63.8, z: 6.4}, {x: 61.6, z: 4.3}], T0: 97.6, T1: 104.6, j: 3, tS: 0},
  {name: 'R7', id: 8117, pts: [{x: 74.0, z: 9.6}, {x: 67.9, z: 7.9}, {x: 65.4, z: 7.6}], T0: 97.8, T1: 104.8, j: 3, tS: 0},
];
const resPlan = (r: (typeof RES)[number]): Plan => {
  const w: Walk = {kind: 'walk', pts: [{x: 0, z: 0}, ...r.pts], T0: r.T0, T1: r.T1, stride: 1.9, A: 1.0, D: 0.9};
  const end = r.pts[r.pts.length - 1];
  return {
    id: r.id, key: `d2${r.name}`, d1: r.name,
    phases: [{kind: 'd1', name: r.name}, {kind: 'kit', T0: r.T0 - 0.45, at: null}, w, {kind: 'kit', T0: r.T1, at: null}],
    act: (T) => {
      if (T < r.T0 - 0.45) return {};
      return {
        posture: [[r.T0, 'ready'], [r.T1 - 0.5, 'guard']],
        attend: track([[r.T0 - 0.4, smokeC, 0.4], [102.8, (t) => decoyPt(r.j, t, 0.5), 0.3], [108.4 + (r.id % 3) * 0.6, crewC, 0.4]]),
        turns: [{t0: r.T0 - 0.4, to: walkStartH(w), dur: 0.4}, {t0: r.T1 + 0.05, to: decoyPt(r.j, r.T1 + 0.4, 0), dur: 0.45}, {t0: 108.6 + (r.id % 3) * 0.6, to: crewC, dur: 0.6}],
        moves: r.tS ? [] : [{t0: 110.4 + (r.id % 3) * 0.5, t1: 111.8 + (r.id % 3) * 0.5, to: {x: end.x - 0.6, y: 0, z: end.z - 0.2}, face: crewC, guard: true}],
        strikes: r.tS ? [{t0: r.tS, side: 'R', target: figAt(r.j, r.tS, end, 1.5), kind: 'punch'}] : [],
      };
    },
  };
};

const PLANS: Record<string, Plan> = {A: A_PLAN, B: B_PLAN, C: C_PLAN, D: D_PLAN, U8: U8_PLAN};
RES.forEach((r) => (PLANS[r.name] = resPlan(r)));
// R1 holds the north-east rim, then steps out of heavy 1's way as it comes along the north side
PLANS.R1 = {
  id: 8111, key: 'd2R1', d1: 'R1', phases: [{kind: 'd1', name: 'R1'}, {kind: 'kit', T0: 96.2, at: null}],
  act: (T) => (T > 96.2 ? {
    attend: track([[96.25, smokeC, 0.4], [107.4, (t) => add3(heavy1(t).pos, {x: 0, y: 3.5, z: 0}), 0.3], [109.7, smokeC, 0.5]]),
    moves: [{t0: 107.7, t1: 109.3, to: {x: 80.1, y: 0, z: -10.1}, face: {x: 79.0, y: 0, z: -14.0}}], turns: [{t0: 109.6, to: 285, dur: 0.5}],
  } : {}),
};

// ------------------------------------------------------------------ the chain: each walk starts where the phase before ends
const chain = (pl: Plan) => {
  pl.phases.forEach((ph, i) => {
    const prev = pl.phases[i - 1];
    if (ph.kind === 'walk' && prev && prev.kind === 'kit') { const r = rootOf(pl, ph.T0 - 0.001); ph.pts[0] = {x: r.x, z: r.z}; }
    if (ph.kind === 'walk' && prev && prev.kind === 'walk') ph.pts[0] = {...prev.pts[prev.pts.length - 1]};
  });
};
Object.values(PLANS).forEach(chain);

/** the units whose contacts the close shots show (full meshes nearer than the army) */
export const NAMED = ['A', 'B', 'C', 'D', 'U8'];
export const RESERVE_D2 = ['R1', 'R3', 'R4', 'R5', 'R6', 'R7'];
/** A named D2 unit's spec at film time T (all t0s in film seconds). */
/** arm controls fade in / out against the arm's free position (an ArmCtl is all-or-nothing in MECH) */
type Fade = {side: 'L' | 'R'; t0: number; t1: number; dir: 'in' | 'out'};
const FADES: Record<string, Fade[]> = {
  // the backhand leaves from its guard and the bracing hand comes off the knee when the plate pops
  B: [{side: 'R', t0: EV2.bBack - 0.45, t1: EV2.bBack - 0.2, dir: 'in'}, {side: 'R', t0: EV2.pryPop, t1: EV2.pryPop + 0.35, dir: 'out'}],
};
export const unitD2 = (name: string, T: number): UnitSpec => {
  let sp = run(PLANS[name], T);
  for (const f of FADES[name] ?? []) {
    if (T < f.t0 || T > f.t1) continue;
    const key = f.side === 'L' ? 'armL' : 'armR';
    const ctl = sp[key];
    if (!ctl?.hand) continue;
    const free = unitAttach({...sp, [key]: undefined})[f.side === 'L' ? 'handL' : 'handR'];
    const u = smooth((T - f.t0) / (f.t1 - f.t0));
    sp = {...sp, [key]: {...ctl, hand: lerp3s(free, ctl.hand, f.dir === 'in' ? u : 1 - u)}};
  }
  return sp;
};

// ------------------------------------------------------------------ heavy 1 (HEAVIES_B[0], id 3101) — the R2 walk, unchanged
// B's main body stands packed round it, the vanguard's six ranks fill the avenue to the east rim: it goes up the north
// sidewalk (four main-body units step aside for it), turns west along it past the vanguard's flank, and comes down the
// crater's north-east slope under the girder, walking on toward the Crew (D3 takes it from there; the walk halts at the
// path's end, all four feet planted, at HEAVY1.T1).
const HV_PTS: XZ[] = [{x: 104, z: -1}, {x: 102.8, z: -6.0}, {x: 100.6, z: -15.6}, {x: 84, z: -17.0}, {x: 76.5, z: -13.4}, {x: 70.0, z: -8.6}, {x: 63.6, z: -5.6}];
const HV_FULL = pathLen(HV_PTS);
const HV_EXT = 6;
const HV_LINE: XZ[] = (() => {
  const a = HV_PTS[HV_PTS.length - 2], b = HV_PTS[HV_PTS.length - 1], l = Math.hypot(b.x - a.x, b.z - a.z);
  return [{x: HV_PTS[0].x + HV_EXT, z: HV_PTS[0].z}, ...HV_PTS, {x: b.x + ((b.x - a.x) / l) * HV_EXT, z: b.z + ((b.z - a.z) / l) * HV_EXT}];
})();
const HV_L = Math.floor(HV_FULL / 0.75) * 0.75;
// the walk starts on the cut out of D2-1 (until then it is B's halted rest spec, exactly as C and D1 draw it)
const HV_T0 = M.DECOY, HV_T1 = 121.0;
const HV_D0 = restD('rear');
const hvLine = linePath(HV_LINE, 2.5);
export const HEAVY1 = {id: HEAVIES_B[0].id, index: 0, T0: HV_T0, T1: HV_T1, end: hvLine(HV_EXT + HV_L), path: HV_PTS};
/** distance walked (m) along HEAVY1.path at film time T */
export const heavy1Dist = (T: number) => runDist(clamp(T, HV_T0, HV_T1), HV_T0, HV_T1, HV_L, 2.2, 2.4);
export const heavy1 = (T: number, o: Partial<HeavySpec> = {}): HeavySpec => {
  // halted, before its walk: exactly B's rest spec (the stance C and D1 draw), so the 94.30 handover is seamless. Its
  // walk starts on the cut to D2-2a (95.38) from the route's own rest stance, turned onto the route (no heavy in the insert).
  if (T < HV_T0) return heavySpecB(0, T, {look: on({x: 44, z: 0}, 1.5), eye: 'cyan', lockAt: 98.1, key: 'd2hv1', ...o});
  const d = heavy1Dist(T);
  const path = (dd: number) => hvLine(dd - HV_D0 + HV_EXT);
  const p = path(HV_D0 + d);
  const crew = on({x: 48.6, z: -6.6}, 1.4);
  return {
    id: HEAVY1.id, t: T, pos: p.pos, heading: p.heading, gait: {path, dist: HV_D0 + d, stride: 3.0, distAt: (t: number) => HV_D0 + heavy1Dist(t)}, ground,
    look: T < 96.0 ? on({x: 44, z: 0}, 1.5) : T < 98.0 ? smokeC : T < 108.6 ? decoyPt(1, T, 0.5) : crew,
    eye: 'cyan', lockAt: 98.1, fire: {t0: EV2.fire, target: BLAST_AT}, key: 'd2hv1', ...o,
  };
};
/** B's main-body units on heavy 1's way: they step aside before it reaches them */
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
  const dur = 0.8 + Math.hypot(y.to.x - from.x, y.to.z - from.z) / 1.4;
  PLANS[`Y${y.id}`] = {
    id: y.id, key: `d2y${y.id}`,
    phases: [{kind: 'kit', T0: 90, at: from}],
    act: () => ({
      idle: 0.4, eye: 'cyan' as const,
      attend: track([[y.T0 - 0.3, (t) => add3(heavy1(t).pos, {x: 0, y: 3.5, z: 0}), 0.3], [101.5, smokeC, 0.5]]),
      moves: [{t0: y.T0 + 0.1, t1: y.T0 + dur, to: {x: y.to.x, y: 0, z: y.to.z}}],
      turns: [{t0: y.T0 + dur + 0.1, to: 285, dur: 0.6}],
    }),
  };
});
export const YIELD_NAMES = YIELD.map((y) => `Y${y.id}`);
export const UNIT_NAMES = Object.keys(PLANS);

// ------------------------------------------------------------------ enemy drones: ED1 back on the slab, then the dives
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
/** ED1 at P2: D1's sweep is taking it home; from 94.45 it swings back over the crater's west slope and holds there
 *  with its beam on the slab (the units come on to it) until the figures appear; it dives through figure 2 (HITb) */
const ED1 = 8151;
const ED1_HOLD: V3 = {x: 52.6, y: 5.4, z: 4.2};
const ed1Path = (T: number): V3 => {
  const d1 = (t: number) => enemyDrones(t).find((q) => q.id === ED1)!.pos;
  const ta = 94.45;
  if (T <= ta) return d1(T);
  const p0 = d1(ta), v0 = mul3(sub3(d1(ta + 0.02), d1(ta - 0.02)), 25);
  const tb = 95.45;
  const bob = (t: number) => ({x: 0.12 * Math.sin(t * 1.7), y: 0.08 * Math.sin(t * 2.3 + 1), z: 0.1 * Math.cos(t * 1.3)});
  if (T < tb) {
    const dt = tb - ta, u = (T - ta) / dt, u2 = u * u, u3 = u2 * u;
    const goal = add3(ED1_HOLD, bob(tb));
    const H = (a: number, va: number, b: number) => (2 * u3 - 3 * u2 + 1) * a + (u3 - 2 * u2 + u) * va * dt + (-2 * u3 + 3 * u2) * b;
    return {x: H(p0.x, v0.x, goal.x), y: H(p0.y, v0.y, goal.y), z: H(p0.z, v0.z, goal.z)};
  }
  return add3(ED1_HOLD, bob(T));
};
/** a dive: from its hover at t0, down through a figure's chest at tc, out and up the far side, back to its hover by t1 */
const DIVES: {id: number; t0: number; tc: number; t1: number; j: number; out: V3}[] = [
  {id: ED1, t0: 99.35, tc: EV2.hitB, t1: 102.6, j: 2, out: {x: 58.4, y: 1.2, z: -1.6}},
  {id: 8152, t0: 99.55, tc: EV2.dive2, t1: 102.3, j: 3, out: {x: 59.4, y: 0.6, z: 0.9}},
];
export const diveThrough = (_T?: number) => DIVES.map((d) => ({...d, at: decoyPt(d.j, d.tc, 0.66)}));
const divePos = (d: (typeof DIVES)[number], hover: (t: number) => V3, T: number): V3 => {
  const c = decoyPt(d.j, d.tc, 0.66), h0 = hover(d.t0), h1 = hover(d.t1);
  const k: K4[] = [[d.t0, h0.x, h0.y, h0.z], [d.tc - 0.22, lerp(h0.x, c.x, 0.7), lerp(h0.y, c.y, 0.55) + 0.5, lerp(h0.z, c.z, 0.7)], [d.tc, c.x, c.y, c.z], [d.tc + 0.4, d.out.x, d.out.y, d.out.z], [d.t1, h1.x, h1.y, h1.z]];
  if (T > d.tc - 0.22 && T < d.tc + 0.4) {
    const a = T < d.tc ? {p: {x: k[1][1], y: k[1][2], z: k[1][3]}, q: c, u: (T - (d.tc - 0.22)) / 0.22} : {p: c, q: d.out, u: (T - d.tc) / 0.4};
    return lerp3s(a.p, a.q, T < d.tc ? a.u : 1 - (1 - a.u) * (1 - a.u));
  }
  return kxyz(k, T);
};
/** ED1's own position before its dive / after it (its hold, then a smooth return to D1's station) */
const ed1Base = (t: number): V3 => (t < 102.6 ? ed1Path(t) : t < 104.6 ? lerp3s(ed1Path(102.6), enemyDrones(t).find((q) => q.id === ED1)!.pos, smooth((t - 102.6) / 2.0)) : enemyDrones(t).find((q) => q.id === ED1)!.pos);
export const enemyDronesD2 = (T: number): DroneSpec[] => enemyDrones(T).map((s) => {
  const base = (t: number) => (s.id === ED1 ? ed1Base(t) : enemyDrones(t).find((q) => q.id === s.id)!.pos);
  const d = DIVES.find((q) => q.id === s.id);
  const pAt = (t: number) => (d && t > d.t0 && t < d.t1 ? divePos(d, base, t) : base(t));
  const p = pAt(T);
  const v = mul3(sub3(pAt(T + 0.04), pAt(T - 0.04)), 12.5);
  const sp = Math.hypot(v.x, v.z);
  const out: DroneSpec = {...s, key: `d2ed${s.id}`, pos: p, vel: v, heading: sp > 0.6 ? (Math.atan2(v.x, -v.z) * 180) / Math.PI : s.heading, eye: 'amber'};
  if (d && T > d.t0 && T < d.t1) out.look = decoyPt(d.j, d.tc, 0.66);
  if (s.id === ED1 && T > 94.45 && T < EV2.mark1 + 0.2) {
    out.look = MARK_AT;
    out.mark = {target: add3(MARK_AT, {x: 0, y: 0, z: 0.9 * Math.sin(T * 1.6)}), t0: EV2.mark0, t1: EV2.mark1, color: 'amber'};
    if (sp < 0.6) out.heading = headingTo(p, MARK_AT);
  }
  return out;
});

// ------------------------------------------------------------------ the allied drone (checker's), continuing D1's flight
/** [T, x, y, z] keys from D1's last key; it hangs over the slab while she sketches, goes up the slope with the flank,
 *  holds over the fight, darts in between D's blow and the runner at SHIELD (takes the hit), wobbles back */
export const ALLY2_KEYS: K4[] = [
  [90.5, 45.2, 4.3, 4.9], [94.3, 45.4, 3.5, 4.6], [96.4, 45.9, 3.6, 4.2], [98.5, 46.2, 3.9, 2.4], [100.6, 47.4, 4.2, -1.6], [102.4, 49.6, 4.3, -4.4],
  [104.6, 51.2, 4.4, -5.2], [106.6, 50.6, 4.3, -5.8], [108.6, 49.2, 4.0, -5.4], [110.6, 48.6, 3.2, -5.4], [112.5, 48.3, 2.3, -5.8],
  [112.95, SHIELD_DRONE.x - 0.4, SHIELD_DRONE.y + 0.15, SHIELD_DRONE.z + 0.12], [EV2.shield, SHIELD_DRONE.x, SHIELD_DRONE.y, SHIELD_DRONE.z],
  [113.85, 48.9, 1.7, -5.9], [115.0, 48.2, 2.1, -5.7], [116.92, 47.9, 2.4, -5.6],
];

