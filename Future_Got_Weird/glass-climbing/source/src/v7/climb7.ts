// Glass Climbing V7: the climber and his gear as one constrained rig over the whole film, a pure function of the
// frame (V6's rig re-staged for the V7 brief). The film is a loop.
//
// The story in the rig:
//   catch (0-26)       his near pad strikes the glass and catches him: he has been swinging from the far pad, which
//                      never left the glass; the swing is arrested and he comes back to the wall
//   on the glass (26-72) his toes find the glass (no ledge: the stirrups hold him), he steadies on both pads
//   lift-off (72-106)  he swings his feet clear of the building: the straps take his whole weight (a dip), steady
//   climb (106-1006)   eight match-style cycles of S; the eighth ends standing on the far stirrup
//   brick (1008-1095)  he takes the near pad sideways and up onto the brick pier, presses it on and shifts his weight
//                      toward it: it creeps, peels and slips off
//   slip (1095-end)    his weight drops onto the far pad, still on the glass: its strap snaps taut and he swings out
//                      from the wall and back, reaching his near pad to the glass: frame 0 (contact at frame 3)
// The climb is exactly one storey (NCY * S = FLOOR_H7): the end of the film is the opening one floor higher, and the
// facade repeats every storey, so the seam is the same picture. climbAt() gives the opening frames (before
// CATCH_END) in the opening's coordinates (one storey down) so the climb continues from them; climbTop() gives them at
// the top, continuous with the film's last frames, for the shots that run across the seam.
//
// Rig rules (as V4-V6): each pad's strap runs to the stirrup on the same side's foot; a seated pad never moves except
// in a shown slip; a hand is placed on its bar by IK every frame (a carried pad goes where the hand can take it); a
// planted foot stands on its stirrup's bar at the strap's taut length; no foot is farther from its ring than its
// strap; no leg is stretched; the feet stay in their stirrups throughout; no foot ever stands on a ledge.
import {EX, P as Pose} from '../world/pose';
import {ManPose} from '../dc/Man';
import {Expr, EXPR_NEUTRAL, mixExpr} from '../dc/Head';
import {HandPose, mixHand} from '../dc/Hand';
import {add, clamp, len, lerp, lerpV, mul, norm, sub, V} from '../dc/math';
import {achievedGrip, ankleForBar, barForAnkle, H_BAR, H_BAR_OPEN, handUV, placeHand, SOLE} from '../world/rig';
import {KX, KY} from '../world/geo';
import {easeOut, keyN, KeyN, ss} from '../world/climb';
import {BAR_U, PH} from '../v6/Pad6';
import {FRAMES} from '../v6/tl6';

export {keyN, ss, easeOut, FRAMES};
export const lin = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const bump = (f: number, a: number, b: number, ra = 8, rb = 10) => ss(f, a, a + ra) * (1 - ss(f, b, b + rb));
type Side = 'L' | 'R';

// ------------------------------------------------------------------ the pads (Pad3D geometry, world units)
/** world units per mm (6.2 per cm) */
export const MM = 0.62;
/** a pad on the facade: centre height y, depth zo on the receding face, stand-off gap (world), peel tilt (deg, +: its
 *  lower edge comes away), load 0..1, contact 0..1 (how much of its tile area grips) */
export type Pad5 = {y: number; zo: number; gap: number; tilt: number; load: number; contact: number; surface: 'glass' | 'brick'};
export const travelOf = (load: number) => 2 + 12 * load; // mm: the spine's travel under load (Pad3D)
/** a pad-local point (mm) -> the facade's screen plane (world units) */
export const padPt5 = (s: Pad5, p: {u: number; v: number; w: number}): V => {
  const ta = (s.tilt * Math.PI) / 180;
  const v0 = -PH / 2;
  const du = p.u, dv = p.v - v0;
  const u = s.gap / MM + du * Math.cos(ta) + dv * Math.sin(ta);
  const v = v0 - du * Math.sin(ta) + dv * Math.cos(ta);
  const z = p.w * MM + s.zo;
  return {x: u * MM + KX * z, y: s.y + v * MM + KY * z};
};
export const grip5 = (s: Pad5) => padPt5(s, {u: BAR_U, v: travelOf(s.load), w: 0});
export const ring5 = (s: Pad5) => padPt5(s, {u: 16.5, v: PH / 2 + 14 + travelOf(s.load), w: 0});

/** the climb's geometry: G the far pad above the near one, S the climb per cycle, NCY cycles */
/** one storey of the V7 facade (3.02 m); the climb is exactly one storey */
export const FLOOR_H7 = 1874;
export const G = 134, NCY = 8, S = FLOOR_H7 / NCY;
/** the pads' depths on the receding glass: near (L) screen-right of far (R), as their feet; the brick pier begins at
 *  PIER_Z (a vertical aluminium channel), and the near pad goes onto the brick at Z_BRICK */
export const PZ = {L: -180, R: 180};
export const PIER_Z = 240, Z_BRICK = 400;
/** the near pad at the catch (frame 0) and the climb's pad heights */
export const L_C = -18400;
export const DY = (k: number) => L_C - k * S;
export const UY = (k: number) => L_C - G - k * S;
const rest = (side: Side, y: number, load = 1): Pad5 => ({y, zo: PZ[side], gap: 0, tilt: 0, load, contact: 1, surface: 'glass'});

// ------------------------------------------------------------------ straps, loops, ledge
/** a taut strap's horizontal run from ring to loop bar */
export const DX = {L: 130, R: 120};
/** the taut loops hang level, 600 below the near pad at the catch */
const LOOP_Y0 = L_C + 600;
export const LEN = {L: Math.hypot(DX.L, LOOP_Y0 - ring5(rest('L', DY(0))).y), R: Math.hypot(DX.R, LOOP_Y0 - ring5(rest('R', UY(0))).y)};
const tautBar = (ring: V, side: Side): V => ({x: ring.x + DX[side], y: ring.y + Math.sqrt(LEN[side] ** 2 - DX[side] ** 2)});
export const hangingBar = (ring: V, side: Side): V => {
  const dx = side === 'L' ? 90 : 14; // the empty near loop hangs a little out, clear of the far strap
  return {x: ring.x + dx, y: ring.y + Math.sqrt(LEN[side] ** 2 - dx * dx)};
};
/** the loop's top, where the strap joins it: over the forefoot */
export const loopApex = (bar: V): V => ({x: bar.x - 22, y: bar.y - 74});
const tautAnkle = (side: Side, pad: Pad5) => ankleForBar(tautBar(ring5(pad), side), 1);
/** the near foot standing in its loop with the pad out on the pier: under him (x of `home`), the strap taut diagonally */
const diagAnkle = (pad: Pad5, home: V) => {
  const r = ring5(pad), bx = barForAnkle(home, 1).x;
  const dx = bx - r.x;
  return ankleForBar({x: bx, y: r.y + Math.sqrt(Math.max(0, LEN.L ** 2 - dx * dx))}, 1);
};
/** a foot in its stirrup with its toes against the glass (the strap nearly vertical under its ring) */
const wallAnkle = (side: Side, pad: Pad5) => {
  const r = ring5(pad), dx = Math.max(22, 112 - r.x);
  return ankleForBar({x: r.x + dx, y: r.y + Math.sqrt(LEN[side] ** 2 - dx * dx)}, 1);
};
/** the floor fins' phase: a fin top lies between the planted feet's heights (L and R sets, every S) at every level of
 *  the climb, so a shoe is never seen level with a fin; it projects FIN_D */
export const LEDGE_Y = tautAnkle('L', rest('L', DY(0))).y + SOLE + 870;
export const FIN_D = 50;

// ------------------------------------------------------------------ the body
export const HX = 330;
const LEGF = 226 + 216;
export const HIP = {L: {x: 34, y: 44}, R: {x: -40, y: 42}};
const standY = (A: V, side: Side, frac: number, hx = HX) => A.y - Math.sqrt(Math.max(0, (LEGF * frac) ** 2 - (hx + HIP[side].x - A.x) ** 2)) - HIP[side].y;
const nearY = (k: number) => standY(tautAnkle('L', rest('L', DY(k))), 'L', 0.93);
const farY = (k: number) => standY(tautAnkle('R', rest('R', UY(k))), 'R', 0.93);
const levelY = (k: number) => (nearY(k) + farY(k)) / 2;
const wallY = (k: number, frac: number) => (standY(wallAnkle('L', rest('L', DY(k))), 'L', frac) + standY(wallAnkle('R', rest('R', UY(k))), 'R', frac)) / 2;
/** how far he comes up onto the far loop before the near pad moves; how far he settles into the near loop */
export const RISE_A = 84, SINK = 34;

// ------------------------------------------------------------------ the schedule
/** a pad move: release (peel), carry (m0-m1, just off the glass), seat (slide down onto it) */
export type Move = {side: Side; to: number; rel: number; m0: number; m1: number; place: number};
type Cycle = {k: number; sh: [number, number]; R: [number, number, number, number]; rise: [number, number]; L: [number, number, number, number] | null; settle: [number, number] | null};
export const CYCLES: Cycle[] = [
  // "and climb it like Spider-Man": the far pad up, one confident rise
  {k: 1, sh: [108, 114], R: [114, 118, 132, 138], rise: [140, 160], L: [184, 189, 202, 208], settle: [208, 222]},
  // through the micro views and the springs
  {k: 2, sh: [236, 244], R: [244, 249, 262, 268], rise: [270, 290], L: [296, 301, 314, 320], settle: [320, 334]},
  {k: 3, sh: [350, 358], R: [358, 363, 376, 382], rise: [384, 404], L: [410, 415, 428, 434], settle: [434, 448]},
  {k: 4, sh: [452, 460], R: [460, 465, 478, 484], rise: [486, 504], L: [508, 513, 526, 532], settle: [532, 546]},
  {k: 5, sh: [556, 564], R: [564, 569, 582, 588], rise: [590, 610], L: [616, 621, 634, 640], settle: [640, 654]},
  // "Then, you shift your weight onto the other pad. The first releases, letting you reach higher and repeat."
  {k: 6, sh: [672, 700], R: [750, 766, 800, 812], rise: [814, 840], L: [842, 847, 860, 866], settle: [866, 880]},
  // nearing the brick ("But there's a catch."), and up the glass again ("So you can climb glass—")
  {k: 7, sh: [880, 886], R: [886, 890, 904, 910], rise: [912, 928], L: [930, 934, 946, 952], settle: [952, 960]},
  {k: 8, sh: [962, 968], R: [968, 972, 984, 990], rise: [992, 1006], L: null, settle: null},
];
export const C = {
  // the catch and the opening
  contact: 3, arrest: 9, wall: 26, feet0: 24, feet1: 44, lift0: 72, lift1: 86, drop1: 96, steady: 106,
  // the brick: the near pad sideways and up onto the pier, pressed on, weight toward it, it slips
  bRel: 1008, bM0: 1012, bM1: 1030, bPlace: 1034, bPress1: 1044, bLoad0: 1048, bLoad1: 1092, fail: 1095,
  look0: -100, look1: -90,
};
export const MOVES: Move[] = CYCLES.flatMap((c) => [
  {side: 'R' as Side, to: UY(c.k), rel: c.R[0], m0: c.R[1], m1: c.R[2], place: c.R[3]},
  ...(c.L ? [{side: 'L' as Side, to: DY(c.k), rel: c.L[0], m0: c.L[1], m1: c.L[2], place: c.L[3]}] : []),
]);
const kOf = (f: number, side: Side) => MOVES.filter((m) => m.side === side && f >= m.place).length;
const moveAt = (f: number, side: Side) => MOVES.find((m) => m.side === side && f >= m.rel - 1 && f <= m.place + 1);

/** the fall and catch run on across the loop: T is film time, with frames 0-101 counted after the last frame */
export const CATCH_END = 106;
const T_OF = (f: number) => (f < CATCH_END ? f + FRAMES : f);

// ------------------------------------------------------------------ pads through the climb
const padClimb = (T: number, side: Side): Pad5 => {
  const base = side === 'L' ? DY : UY;
  const p = rest(side, base(kOf(T, side)));
  const m = moveAt(T, side);
  if (m) {
    const from = m.to + S;
    p.tilt = keyN(T, [[m.rel, 0], [m.m0, 9], [m.m1 - 3, 5], [m.place - 2, 0]]);
    p.gap = keyN(T, [[m.rel, 0], [m.rel + 3, 0.8], [m.m0, 7], [(m.m0 + m.m1) / 2, 12], [m.m1, 5], [m.place, 0, easeOut]]);
    p.y = keyN(T, [[m.m0, from], [m.m1, m.to - 6], [m.place, m.to]]);
    p.contact = 1 - clamp(p.gap / 2);
  }
  if (side === 'L' && T >= C.bRel) {
    // sideways onto the brick pier (toward the camera), a little higher; pressed on: only part of it can touch
    const u = ss(T, C.bM0, C.bM1);
    p.zo = lerp(PZ.L, Z_BRICK, u);
    p.y = keyN(T, [[C.bM0, DY(NCY - 1)], [C.bM1, DY(NCY) - 6], [C.bPlace, DY(NCY)]]);
    p.tilt = keyN(T, [[C.bRel, 0], [C.bM0, 8], [C.bM1 - 4, 4], [C.bPlace, 1], [C.bPress1, 0]]);
    p.gap = keyN(T, [[C.bRel, 0], [C.bRel + 3, 0.8], [C.bM0, 8], [(C.bM0 + C.bM1) / 2, 16], [C.bM1, 6], [C.bPlace, 1.5], [C.bPress1, 0, easeOut]]);
    p.surface = T >= C.bM1 ? 'brick' : 'glass';
    p.contact = T >= C.bPlace ? 0.22 : 1 - clamp(p.gap / 2);
    if (T >= C.bLoad0) {
      // under his shifting weight the few contacts skid: it creeps down, its lower edge starts to come away
      const creep = keyN(T, [[C.bLoad0, 0], [1062, 4], [1082, 14], [C.fail, 30, (f, a, b) => clamp((f - a) / (b - a)) ** 2]]);
      p.y = DY(NCY) + creep;
      p.tilt = keyN(T, [[1052, 0], [1080, 3], [C.fail, 9]]);
      p.gap = keyN(T, [[1074, 0], [C.fail, 4]]);
      p.contact = keyN(T, [[C.bLoad0, 0.22], [1062, 0.16], [C.fail, 0.04]]);
    }
  }
  return p;
};

// ------------------------------------------------------------------ hips through the climb
const HIP_KEYS: KeyN = (() => {
  const k: KeyN = [[CATCH_END, levelY(0)]];
  for (const c of CYCLES) {
    k.push([c.sh[0], levelY(c.k - 1)], [c.sh[1], nearY(c.k - 1) + SINK], [c.rise[0], nearY(c.k - 1) + SINK], [c.rise[1], nearY(c.k - 1) - RISE_A]);
    if (c.settle) k.push([c.settle[0], nearY(c.k - 1) - RISE_A], [c.settle[1], levelY(c.k)]);
  }
  // the brick: standing on the far stirrup as the near pad goes across, then down toward it as he weights it
  k.push([C.bLoad0, nearY(NCY - 1) - RISE_A], [C.fail, levelY(NCY) + 10]);
  return k;
})();
/** loop weights (0..1: how much each foot stands in its loop) */
const LOOP_W: Record<Side, KeyN> = (() => {
  const L: KeyN = [[CATCH_END, 1]], R: KeyN = [[CATCH_END, 1]];
  for (const c of CYCLES) {
    R.push([c.sh[0], 1], [c.sh[1], 0], [c.rise[0], 0], [c.rise[1], 1]);
    L.push([c.rise[0], 1], [c.rise[1], 0]);
    if (c.settle) L.push([c.settle[0], 0], [c.settle[1], 1]);
  }
  L.push([C.bLoad0, 0], [C.fail, 0.7]);
  R.push([C.fail, 1]);
  return {L, R};
})();

// ------------------------------------------------------------------ the state
export type FootState = {ankle: V; bar: V; inLoop: boolean; planted: number};
export type ClimbState = {
  f: number;
  pose: ManPose;
  padL: Pad5;
  padR: Pad5;
  ringL: V;
  ringR: V;
  footL: FootState;
  footR: FootState;
  sagL: number;
  sagR: number;
  expr: Expr;
  lHand: HandPose;
  rHand: HandPose;
  hairSway: number;
  blink: number;
  err: {legL: number; legR: number};
  swing: number;
};

const ALARM: Expr = {...EXPR_NEUTRAL, browIn: 0.95, browDown: 0, lid: 0, squint: 0, pupil: 0.72, open: 0.45, wide: 0.72, smile: -0.35, teeth: 0.15, gx: -0.55, gy: 0.1, flush: 0.35};
const rot = (p: V, c: V, deg: number): V => {
  const a = (deg * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const d = sub(p, c);
  // + = outward: points below the pivot move away from the glass (+x)
  return {x: c.x + d.x * ca + d.y * sa, y: c.y - d.x * sa + d.y * ca};
};

/** the body's inputs, from which the state is built */
type Body = {
  T: number;
  padL: Pad5;
  padR: Pad5;
  H: V;
  ankL: V;
  ankR: V;
  inL: boolean;
  inR: boolean;
  plantL: number;
  plantR: number;
  /** how much each loop is on its foot (1) or hanging empty from its ring (0) */
  loopL?: number;
  loopR?: number;
  lean: number;
  chest: number;
  head: number; // the head's angle from upright (deg, + = forward/down)
  swing: number; // deg, about the far grip
  /** the near hand's target when it is not on its pad's bar (null: on the bar) */
  nearHand: V | null;
  expr: Expr;
  gripL: HandPose;
  gripR: HandPose;
};

const reachClamp = (A: V, H: V, side: Side, mx = 0.965) => {
  const hp = add(H, HIP[side]);
  const d = sub(A, hp), l = len(d), m = LEGF * mx;
  return l > m ? add(hp, mul(d, m / l)) : A;
};
const strapClamp = (A: V, ring: V, side: Side) => {
  const b = barForAnkle(A, 1), d = sub(b, ring), l = len(d);
  return l > LEN[side] ? ankleForBar(add(ring, mul(d, LEN[side] / l)), 1) : A;
};

const build = (b: Body): ClimbState => {
  const {T} = b;
  let {H, ankL, ankR} = b;
  const ringL = ring5(b.padL), ringR = ring5(b.padR);
  // the swing turns the whole hanging body (hips, feet) about the far grip
  const pivot = grip5(b.padR);
  if (Math.abs(b.swing) > 1e-4) {
    H = rot(H, pivot, b.swing);
    ankL = rot(ankL, pivot, b.swing);
    ankR = rot(ankR, pivot, b.swing);
  }
  ankL = reachClamp(ankL, H, 'L');
  ankR = reachClamp(ankR, H, 'R');
  if (b.inL) ankL = strapClamp(ankL, ringL, 'L');
  if (b.inR) ankR = strapClamp(ankR, ringR, 'R');
  // an empty loop swings out with him (it hangs from a pad he has just been swinging with)
  const hangL = rot(hangingBar(ringL, 'L'), ringL, b.swing * 0.9), hangR = rot(hangingBar(ringR, 'R'), ringR, b.swing * 0.9);
  const barL = lerpV(hangL, barForAnkle(ankL, 1), b.loopL ?? (b.inL ? 1 : 0));
  const barR = lerpV(hangR, barForAnkle(ankR, 1), b.loopR ?? (b.inR ? 1 : 0));
  const sagOf = (ring: V, bar: V, side: Side) => Math.max(0, (LEN[side] - len(sub(bar, ring))) * 0.45);
  // a raised leg turns its knee out instead of pushing it into the straps
  const fsOf = (A: V, side: Side) => 1 - 0.45 * ss(len(sub(A, add(H, HIP[side]))), 0.92 * LEGF, 0.55 * LEGF);
  const lean = b.lean + b.swing;
  let pose: ManPose = Pose({x: H.x, y: H.y, s: 1, torso: lean, chest: b.chest, neck: b.head - lean - b.chest, turn: 0.78, pelvis: 0,
    lFs: fsOf(ankL, 'L'), rFs: fsOf(ankR, 'R'),
    lAx: ankL.x, lAy: ankL.y, lA: 1, rAx: ankR.x, rAy: ankR.y, rA: 1, lAnk: 0, rAnk: 0, lElb: -1, rElb: -1,
    breath: 0.3 + 0.3 * Math.sin((2 * Math.PI * Math.round(FRAMES / 57) * b.T) / FRAMES)});
  const uv = handUV(H_BAR, 'grip');
  pose = placeHand(pose, 'L', b.nearHand ?? grip5(b.padL), 182, uv.u, uv.v);
  pose = placeHand(pose, 'R', grip5(b.padR), 176, uv.u, uv.v);
  const blink = Math.max(...[40, 236, 608, 712, 960].map((x) => Math.max(0, 1 - Math.abs(T - x) / 2.2)));
  return {
    f: T % FRAMES, pose, padL: b.padL, padR: b.padR, ringL, ringR,
    footL: {ankle: ankL, bar: barL, inLoop: b.inL, planted: b.plantL},
    footR: {ankle: ankR, bar: barR, inLoop: b.inR, planted: b.plantR},
    sagL: b.inL ? sagOf(ringL, barL, 'L') : 0, sagR: b.inR ? sagOf(ringR, barR, 'R') : 0,
    expr: b.expr, lHand: b.gripL, rHand: b.gripR, hairSway: 0, blink,
    err: {legL: len(sub(ankL, add(H, HIP.L))) / LEGF, legR: len(sub(ankR, add(H, HIP.R))) / LEGF},
    swing: b.swing,
  };
};
const tight = (load: number): HandPose => mixHand(H_BAR, {curl: [0.8, 0.86, 0.9, 0.93], spread: 0.04, thumb: 30, thumbCurl: 0.68}, clamp(load));

// ------------------------------------------------------------------ the climb (CATCH_END-fail)
const climbBody = (T: number): Body => {
  const wl = keyN(T, LOOP_W.L), wr = keyN(T, LOOP_W.R);
  const moving = (side: Side) => (moveAt(T, side) ? 1 : 0);
  const padL = padClimb(T, 'L'), padR = padClimb(T, 'R');
  const brickLoad = keyN(T, [[C.bPress1, 0.1], [C.bLoad0, 0.15], [C.fail, 0.9]]);
  padL.load = moving('L') ? 0 : T >= C.bRel ? (T >= C.bPress1 ? brickLoad : 0) : clamp(0.12 + 0.88 * wl);
  padR.load = moving('R') ? 0 : clamp(0.12 + 0.88 * wr);
  const hy = keyN(T, HIP_KEYS);
  const shiftX = Math.max(...CYCLES.map((c) => ss(T, c.sh[0], c.sh[1]) * (1 - ss(T, c.rise[0], c.rise[1]))));
  // (reaching across to the pier he leans toward it, hips in a little)
  const pier = ss(T, C.bRel - 6, C.bM1) * (1 - ss(T, C.fail - 4, C.fail + 8));
  const H: V = {x: HX + 16 * shiftX - 10 * pier, y: hy};
  // feet: planted in a taut loop, or light in it (carried with the loop as its pad moves)
  const foot = (side: Side, w: number) => {
    const pad = side === 'L' ? padL : padR;
    // on the pier the near pad is out to the side: its foot stays under him and its strap runs diagonally to it
    const onPier = side === 'L' ? ss(T, C.bM0, C.bM1) : 0;
    const home = side === 'L' ? {...pad, zo: PZ.L} : pad;
    const seated = tautAnkle(side, {...home, gap: 0, tilt: 0});
    const taut = lerpV(tautAnkle(side, pad), diagAnkle(pad, seated), onPier);
    // (the far foot comes up a little out from the glass, clear of the fin's edge)
    const nearFin = 0;
    const free = add(seated, {x: side === 'R' ? -4 + 44 * nearFin : -4 + 10 * onPier, y: side === 'R' ? -46 : -20 + 14 * onPier});
    return lerpV(free, taut, ss(w, 0, 0.85));
  };
  const rMoves = MOVES.filter((m) => m.side === 'R');
  const reach = Math.max(...rMoves.map((m) => bump(T, m.rel, m.place, 6, 8)));
  const lookUp = Math.max(...rMoves.map((m) => bump(T, m.rel - 2, m.place + 4, 8, 10)));
  const lookSide = bump(T, C.bRel - 4, C.bLoad0 + 20, 10, 16); // he looks at the brick as he places the pad
  const lookDown = bump(T, C.look0, C.look1 + 6, 10, 8);
  const doubt = ss(T, 1052, 1084);
  const riseNow = Math.max(...CYCLES.map((c) => bump(T, c.rise[0] - 4, c.rise[1], 6, 8)));
  const strain = Math.max(riseNow, bump(T, C.bLoad0, C.fail, 10, 2) * 0.7);
  const pleased = Math.max(...rMoves.map((m) => bump(T, m.place - 2, m.place + 12, 6, 10)), bump(T, C.bPlace, C.bLoad0 + 10, 4, 10));
  let expr = mixExpr(mixExpr(mixExpr(EX.focus, EX.strain, strain * 0.6), EX.pleased, pleased * 0.6), EX.doubt, doubt);
  expr = {...expr, gy: expr.gy - 0.5 * lookUp + 0.9 * lookDown + 0.5 * lookSide, gx: expr.gx + 0.12 * lookUp};
  return {
    T, padL, padR, H,
    ankL: foot('L', wl), ankR: foot('R', wr), inL: true, inR: true, plantL: wl, plantR: wr,
    lean: 12 + 2 * reach + 4 * shiftX + 3 * pier, chest: 4 + 2 * reach + 4 * pier,
    head: 3 - 5 * lookUp + 6 * lookDown + 5 * lookSide, swing: 0, nearHand: null, expr,
    gripL: tight(padL.load), gripR: tight(padR.load),
  };
};

// ------------------------------------------------------------------ the slip, the swing, the catch (fail - FRAMES+CATCH_END)
/** the swing about the far grip (deg, + out from the wall): out as the brick pad slips and his weight drops onto the
 *  far pad; back toward the wall; the near pad meets the glass as he comes in (frame 3) and stops him */
const SWING: KeyN = [
  [C.fail, 0],
  [1119, 24, (f, a, b) => 1 - (1 - clamp((f - a) / (b - a))) ** 2],
  [FRAMES + C.contact, 3, (f, a, b) => {
    const x = clamp((f - a) / (b - a));
    return x * x * (3 - 2 * x);
  }],
  [FRAMES + C.arrest, 1.2, easeOut], [FRAMES + C.wall, 0],
];
/** how far he drops onto the far arm and its strap (units) */
const HANG = 150;

const catchBody = (T: number): Body => {
  const swing = keyN(T, SWING);
  const tc = FRAMES + C.contact; // the near pad strikes the glass
  // the far pad never leaves the glass; it takes all of him until the near pad is back on
  const padR: Pad5 = {...rest('R', UY(NCY)), load: 1};
  const hang = HANG * ss(T, C.fail, C.fail + 9) * (1 - ss(T, FRAMES + C.arrest, FRAMES + C.wall));
  // the near hand: the slipping pad comes off the brick; his near arm drops back by his side with it (never across his
  // face); then swings forward and in, the pad held out flat toward the glass
  const gC = grip5(rest('L', DY(NCY)));
  let padL: Pad5;
  const hangH: V = {x: HX, y: farY(NCY) + HANG};
  if (T < tc) {
    const side: V = add(hangH, {x: -200, y: -150});
    const g0 = grip5({...rest('L', DY(NCY) + 30), zo: Z_BRICK, gap: 4, tilt: 9});
    const drop = ss(T, C.fail, 1114), fwd = ss(T, 1132, tc);
    const at = lerpV(lerpV(g0, side, drop), {x: gC.x + 6, y: gC.y}, fwd);
    const tilt = keyN(T, [[C.fail, 9], [1110, 14], [1130, 10], [tc - 8, 3], [tc, 0]]);
    const zo = lerp(Z_BRICK, PZ.L, ss(T, C.fail, 1120));
    padL = {y: 0, zo, gap: 0, tilt, load: 0, contact: 0, surface: 'glass'};
    const g = grip5(padL);
    padL.y = at.y - g.y;
    padL.gap = Math.max(0, at.x - g.x);
  } else {
    padL = {...rest('L', DY(NCY)), load: keyN(T, [[tc, 0.6], [tc + 4, 1], [FRAMES + C.feet1, 0.8], [FRAMES + C.lift1, 0.4], [FRAMES + C.drop1, 1]]), contact: keyN(T, [[tc, 0.3], [tc + 4, 1]])};
  }
  padR.load = keyN(T, [[FRAMES + C.wall, 1], [FRAMES + C.feet1, 0.8], [FRAMES + C.lift1, 0.4], [FRAMES + C.drop1, 1]]);
  // hips: hanging from the far pad; back to the wall on both pads, feet on the glass; off it (the dip), steady
  const wallHip = wallY(NCY, 0.93);
  const loopsHip = levelY(NCY) + keyN(T, [[FRAMES + C.lift1, 0], [FRAMES + C.drop1, 26], [FRAMES + C.drop1 + 6, -6], [FRAMES + C.steady, 0]]);
  const onWall = ss(T, FRAMES + C.feet0, FRAMES + C.feet1);
  let hy = lerp(farY(NCY) + hang, wallHip, onWall);
  const lift = ss(T, FRAMES + C.lift0, FRAMES + C.lift1), inLoops = ss(T, FRAMES + C.lift1, FRAMES + C.drop1);
  if (T >= FRAMES + C.lift0) hy = lerp(wallHip - 12 * lift, loopsHip, inLoops);
  const H: V = {x: HX - 10 * ss(T, FRAMES, FRAMES + C.wall) * (1 - ss(T, FRAMES + C.lift0, FRAMES + C.drop1)) + 14 * bump(T, FRAMES + C.lift0, FRAMES + C.steady, 8, 10), y: hy};
  // feet: the far foot in its stirrup under the far pad (its strap taut: it arrests him); the near foot hanging in its
  // stirrup under him (its pad is in his hand); at the wall both find the glass with their toes; then they swing clear
  const farTaut = tautAnkle('R', padR);
  const hangR = add(farTaut, {x: 10, y: -HANG * 0.5});
  const hangHip: V = {x: HX, y: farY(NCY) + hang};
  const hangL0 = add(hangHip, {x: HIP.L.x - 150, y: HIP.L.y + 370});
  const hangL = rot(hangL0, grip5(padR), -0.55 * swing);
  const atTop = climbBody(C.fail - 0.001);
  const fromTop = ss(T, C.fail, C.fail + 10);
  let ankL = lerpV(atTop.ankL, hangL, fromTop), ankR = lerpV(atTop.ankR, hangR, fromTop);
  const wallL = wallAnkle('L', rest('L', DY(NCY))), wallR = wallAnkle('R', padR);
  ankL = lerpV(ankL, wallL, onWall);
  ankR = lerpV(ankR, wallR, onWall);
  if (T >= FRAMES + C.lift0) {
    const nearT = tautAnkle('L', rest('L', DY(NCY))), farT = tautAnkle('R', padR);
    const drop = ss(T, FRAMES + C.lift1, FRAMES + C.drop1);
    // the shoes come away from the glass (out and a little up, knees bending), then settle into the taut stirrups
    const off = (A: V, to: V): V => ({x: lerp(A.x, to.x + 50, lift) - 50 * ss(drop, 0.4, 1), y: lerp(A.y - 34 * lift, to.y, drop)});
    ankL = off(wallL, nearT);
    ankR = off(wallR, farT);
  }
  const swingK = T < FRAMES + C.wall + 4 ? 1 : 0;
  const alarm = ss(T, C.fail, C.fail + 3) * (1 - ss(T, FRAMES + C.arrest, FRAMES + C.wall + 10));
  const relief = bump(T, FRAMES + C.wall, FRAMES + C.feet1 + 12, 8, 14);
  const strain = Math.max(bump(T, FRAMES + C.contact, FRAMES + C.arrest + 6, 2, 8), bump(T, FRAMES + C.lift0, FRAMES + C.steady, 6, 8) * 0.8, bump(T, 1128, tc, 4, 4) * 0.7);
  let expr = mixExpr(mixExpr(mixExpr(EX.focus, EX.strain, strain * 0.6), ALARM, alarm), EX.pleased, relief * 0.3);
  // (he looks at the glass he is reaching for, then down at his feet as they leave it)
  const lookFeet = bump(T, FRAMES + C.lift0 - 6, FRAMES + C.drop1, 8, 8);
  expr = {...expr, gy: expr.gy + 0.6 * lookFeet};
  return {
    T, padL, padR, H, ankL, ankR, inL: true, inR: true, loopL: 1, loopR: 1,
    plantL: T >= FRAMES + C.drop1 ? 1 : 0, plantR: T >= FRAMES + C.drop1 ? 1 : 0,
    lean: lerp(12, 4, alarm) + 6 * ss(T, C.fail, 1110) * (1 - ss(T, FRAMES, FRAMES + C.wall)), chest: 4 + 4 * alarm,
    head: 3 - 10 * alarm * swingK + 8 * lookFeet, swing: swing * swingK,
    nearHand: null, expr,
    gripL: T < tc ? mixHand(H_BAR, H_BAR_OPEN, 0.15) : tight(padL.load), gripR: tight(1),
  };
};

const lerpBody = (a: Body, b: Body, u: number): Body => {
  const n = (x: number, y: number) => lerp(x, y, u);
  const pad = (p: Pad5, q: Pad5): Pad5 => ({...q, surface: u < 1 ? p.surface : q.surface, y: n(p.y, q.y), zo: n(p.zo, q.zo), gap: n(p.gap, q.gap), tilt: n(p.tilt, q.tilt), load: n(p.load, q.load), contact: n(p.contact, q.contact)});
  return {
    ...b, padL: pad(a.padL, b.padL), padR: pad(a.padR, b.padR), H: lerpV(a.H, b.H, u), ankL: lerpV(a.ankL, b.ankL, u), ankR: lerpV(a.ankR, b.ankR, u),
    plantL: n(a.plantL, b.plantL), plantR: n(a.plantR, b.plantR), lean: n(a.lean, b.lean), chest: n(a.chest, b.chest), head: n(a.head, b.head),
    expr: mixExpr(a.expr, b.expr, u), gripL: mixHand(a.gripL, b.gripL, u), gripR: mixHand(a.gripR, b.gripR, u),
  };
};

const climbRaw = (f: number): ClimbState => {
  const T = T_OF(f);
  if (T < C.fail) return build(climbBody(T));
  // the first frames of the fall blend from the last of the climb into the hang
  const cb = catchBody(T);
  if (T < C.fail + 8) return build(lerpBody(climbBody(C.fail - 0.001), cb, ss(T, C.fail, C.fail + 8)));
  return build(cb);
};

/** a carried pad goes where the hand can actually take it (the arm never stretches) */
const fixCarried = (s0: ClimbState): ClimbState => {
  const uv = handUV(H_BAR, 'grip');
  const fix = (pad: Pad5, side: Side): Pad5 => {
    if (pad.gap < 0.5) return pad;
    const want = grip5(pad);
    const got = achievedGrip(s0.pose, side, uv.u, uv.v);
    return {...pad, y: pad.y + (got.y - want.y), gap: Math.max(0.5, pad.gap + (got.x - want.x))};
  };
  const padL = fix(s0.padL, 'L'), padR = fix(s0.padR, 'R');
  if (padL === s0.padL && padR === s0.padR) return s0;
  return {...s0, padL, padR, ringL: ring5(padL), ringR: ring5(padR)};
};
/** a whole state moved down by dy (world units) */
const shiftState = (s0: ClimbState, dy: number): ClimbState => ({
  ...s0,
  pose: {...s0.pose, y: s0.pose.y + dy, lWy: s0.pose.lWy + dy, rWy: s0.pose.rWy + dy,
    ...(s0.pose.lAy != null ? {lAy: s0.pose.lAy + dy} : {}), ...(s0.pose.rAy != null ? {rAy: s0.pose.rAy + dy} : {})},
  padL: {...s0.padL, y: s0.padL.y + dy}, padR: {...s0.padR, y: s0.padR.y + dy},
  ringL: {x: s0.ringL.x, y: s0.ringL.y + dy}, ringR: {x: s0.ringR.x, y: s0.ringR.y + dy},
  footL: {...s0.footL, ankle: {x: s0.footL.ankle.x, y: s0.footL.ankle.y + dy}, bar: {x: s0.footL.bar.x, y: s0.footL.bar.y + dy}},
  footR: {...s0.footR, ankle: {x: s0.footR.ankle.x, y: s0.footR.ankle.y + dy}, bar: {x: s0.footR.bar.x, y: s0.footR.bar.y + dy}},
});
/** the state at the top of the climb's coordinates (the film's last frames and, continuously, its opening frames) */
export const climbTop = (f: number): ClimbState => fixCarried(climbRaw(f));
/** the state in the climb's own coordinates: the opening frames one storey down, where the climb starts */
export const climbAt = (f: number): ClimbState => {
  const s0 = climbTop(f);
  return f < CATCH_END ? shiftState(s0, FLOOR_H7) : s0;
};
/** the storey shift in force at frame f (0 at the top; FLOOR_H7 for the opening frames) */
export const storeyShift = (f: number) => (f < CATCH_END ? FLOOR_H7 : 0);
export const hipY = (f: number) => climbAt(f).pose.y;
export {norm};
