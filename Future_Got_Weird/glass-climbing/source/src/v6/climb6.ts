// Glass Climbing V6: the climber and his gear as one constrained rig over the whole film, a pure function of the
// frame (V5's rig, climb5.ts, re-staged for V6). The film is a loop: its last seconds are a real fall and a catch on the
// glass, and frame 0 is the end of that catch.
//
// The story in the rig:
//   catch end (0-24)   standing on the floor fin he landed on, his feet in their stirrups (they never leave them), the
//                      near pad that stopped him loaded on the glass; the far pad he has just placed takes its share
//                      and he settles onto it
//   lift-off (72-108)  he lifts his feet off the fin: the straps take his whole weight (a dip), and he steadies
//   climb (112-880)    six match-style cycles (far hand on the upper pad, near hand on the lower one; a cycle is: weight
//                      onto the near stirrup, far pad up, rise onto the far stirrup, near pad up, weight onto both)
//   brick (896-1090)   at the top he stands on the far stirrup, takes the near pad sideways onto the brick pier beside
//                      the glass bay, presses it on and shifts his weight toward it: it creeps, peels, tears off
//   fall (1090-1124)   the jolt swings him out on the far pad, which peels off the glass too; he falls beside the
//                      facade, both pads in his hands, the stirrups on his feet, the straps between them
//   catch (1112-end)   his near hand slaps its pad flat on the glass: it loads, slides a hand's width and holds; his feet
//                      land on the floor fin; he places the far pad: frame 0.
// The fall takes him back down by the height he climbed, so the last frame runs into frame 0 in every value.
//
// Rig rules (as V4/V5): each pad's strap runs to the stirrup on the same side's foot; a seated pad never moves except
// in a shown slide; a hand is placed on its bar by IK every frame (a carried pad goes where the hand can take it); a
// planted foot stands on its stirrup's bar at the strap's taut length; no foot is farther from its ring than its strap;
// no leg is stretched; the feet stay in their stirrups throughout.
import {EX, P as Pose} from '../world/pose';
import {ManPose} from '../dc/Man';
import {Expr, EXPR_NEUTRAL, mixExpr} from '../dc/Head';
import {HandPose, mixHand} from '../dc/Hand';
import {add, clamp, len, lerp, lerpV, mul, norm, sub, V} from '../dc/math';
import {achievedGrip, ankleForBar, barForAnkle, H_BAR, H_BAR_OPEN, handUV, placeHand, SOLE} from '../world/rig';
import {KX, KY} from '../world/geo';
import {easeOut, keyN, KeyN, ss} from '../world/climb';
import {BAR_U, PH} from './Pad6';
import {FRAMES} from './tl6';

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
export const G = 134, S = 170, NCY = 6;
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
/** the floor fin he stands on after the catch: its top 70 above the taut loops' standing height; it projects FIN_D */
export const LEDGE_Y = tautAnkle('L', rest('L', DY(0))).y + SOLE - 70;
export const FIN_D = 50;
/** on the narrow fin he stands on the balls of his feet, close to the glass */
export const LEDGE_FOOT = {L: {x: 132, y: LEDGE_Y - SOLE}, R: {x: 100, y: LEDGE_Y - SOLE}};

// ------------------------------------------------------------------ the body
export const HX = 330;
const LEGF = 226 + 216;
export const HIP = {L: {x: 34, y: 44}, R: {x: -40, y: 42}};
const standY = (A: V, side: Side, frac: number, hx = HX) => A.y - Math.sqrt(Math.max(0, (LEGF * frac) ** 2 - (hx + HIP[side].x - A.x) ** 2)) - HIP[side].y;
const nearY = (k: number) => standY(tautAnkle('L', rest('L', DY(k))), 'L', 0.93);
const farY = (k: number) => standY(tautAnkle('R', rest('R', UY(k))), 'R', 0.93);
const levelY = (k: number) => (nearY(k) + farY(k)) / 2;
const ledgeY = (frac: number) => (standY(LEDGE_FOOT.L, 'L', frac) + standY(LEDGE_FOOT.R, 'R', frac)) / 2;
/** how far he comes up onto the far loop before the near pad moves; how far he settles into the near loop */
export const RISE_A = 84, SINK = 34;

// ------------------------------------------------------------------ the schedule
/** a pad move: release (peel), carry (m0-m1, just off the glass), seat (slide down onto it) */
export type Move = {side: Side; to: number; rel: number; m0: number; m1: number; place: number};
type Cycle = {k: number; sh: [number, number]; R: [number, number, number, number]; rise: [number, number]; L: [number, number, number, number]; settle: [number, number]};
export const CYCLES: Cycle[] = [
  // "and climb it like Spider-Man": the far pad up, one confident rise (on screen)
  {k: 1, sh: [108, 114], R: [114, 118, 132, 138], rise: [140, 160], L: [184, 189, 202, 208], settle: [208, 222]},
  // through the micro views (unseen) and back on screen at "can hold your entire weight" (the near pad's move)
  {k: 2, sh: [236, 244], R: [244, 249, 262, 268], rise: [270, 290], L: [296, 301, 314, 320], settle: [320, 334]},
  {k: 3, sh: [350, 358], R: [358, 363, 376, 382], rise: [384, 404], L: [410, 415, 428, 434], settle: [434, 448]},
  {k: 4, sh: [452, 460], R: [460, 465, 478, 484], rise: [486, 504], L: [508, 513, 526, 532], settle: [532, 546]},
  // behind the springs (unseen)
  {k: 5, sh: [556, 564], R: [564, 569, 582, 588], rise: [590, 610], L: [616, 621, 634, 640], settle: [640, 654]},
  // "Then, you shift your weight onto the other pad. The first releases, letting you reach higher and repeat."
  {k: 6, sh: [672, 700], R: [750, 766, 800, 812], rise: [814, 840], L: [842, 847, 860, 866], settle: [866, 880]},
];
export const C = {
  // the opening: the far pad (placed at the end of the catch) loads; he lifts his feet off the fin into the stirrups
  rLoad1: 20, lift0: 72, lift1: 86, drop1: 96, steady: 106,
  // the brick: up onto the far stirrup (the far pad loading on the glass), the near pad sideways onto the pier, pressed
  // on, weight toward it, it fails
  bUp0: 896, bUp1: 920, bRel: 958, bM0: 964, bM1: 994, bPlace: 1000, bPress1: 1016,
  bLoad0: 1022, bLoad1: 1086, fail: 1090,
  // the fall and the catch
  peelR: 1097, slap: 1114, held: 1123, land: 1122, absorb: 1132, rM0: 1134, rPlace: 1150,
  look0: 860, look1: 892,
};
export const MOVES: Move[] = CYCLES.flatMap((c) => [
  {side: 'R' as Side, to: UY(c.k), rel: c.R[0], m0: c.R[1], m1: c.R[2], place: c.R[3]},
  {side: 'L' as Side, to: DY(c.k), rel: c.L[0], m0: c.L[1], m1: c.L[2], place: c.L[3]},
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
    p.y = keyN(T, [[C.bM0, DY(NCY)], [C.bM1, DY(NCY) - 6], [C.bPlace, DY(NCY)]]);
    p.tilt = keyN(T, [[C.bRel, 0], [C.bM0, 8], [C.bM1 - 4, 4], [C.bPlace, 1], [C.bPress1, 0]]);
    p.gap = keyN(T, [[C.bRel, 0], [C.bRel + 3, 0.8], [C.bM0, 8], [(C.bM0 + C.bM1) / 2, 16], [C.bM1, 6], [C.bPlace, 1.5], [C.bPress1, 0, easeOut]]);
    p.surface = T >= C.bM1 ? 'brick' : 'glass';
    p.contact = T >= C.bPlace ? 0.22 : 1 - clamp(p.gap / 2);
    if (T >= C.bLoad0) {
      // under his shifting weight the few contacts skid: it creeps down, its lower edge starts to come away
      const creep = keyN(T, [[C.bLoad0, 0], [1056, 4], [1078, 14], [C.fail, 30, (f, a, b) => clamp((f - a) / (b - a)) ** 2]]);
      p.y = DY(NCY) + creep;
      p.tilt = keyN(T, [[1046, 0], [1076, 3], [C.fail, 9]]);
      p.gap = keyN(T, [[1070, 0], [C.fail, 4]]);
      p.contact = keyN(T, [[C.bLoad0, 0.22], [1056, 0.16], [C.fail, 0.04]]);
    }
  }
  return p;
};

// ------------------------------------------------------------------ hips through the climb
const HIP_KEYS: KeyN = (() => {
  const k: KeyN = [[CATCH_END, levelY(0)]];
  for (const c of CYCLES) {
    k.push([c.sh[0], levelY(c.k - 1)], [c.sh[1], nearY(c.k - 1) + SINK], [c.rise[0], nearY(c.k - 1) + SINK], [c.rise[1], nearY(c.k - 1) - RISE_A]);
    k.push([c.settle[0], nearY(c.k - 1) - RISE_A], [c.settle[1], levelY(c.k)]);
  }
  // the brick: up onto the far loop (the near pad unloaded), then down toward the near loop as he weights the brick pad
  k.push([C.bUp0, levelY(NCY)], [C.bUp1, nearY(NCY) - RISE_A], [C.bLoad0, nearY(NCY) - RISE_A], [C.fail, levelY(NCY) + 10]);
  return k;
})();
/** loop weights (0..1: how much each foot stands in its loop) */
const LOOP_W: Record<Side, KeyN> = (() => {
  const L: KeyN = [[CATCH_END, 1]], R: KeyN = [[CATCH_END, 1]];
  for (const c of CYCLES) {
    R.push([c.sh[0], 1], [c.sh[1], 0], [c.rise[0], 0], [c.rise[1], 1]);
    L.push([c.rise[0], 1], [c.rise[1], 0], [c.settle[0], 0], [c.settle[1], 1]);
  }
  L.push([C.bUp0, 1], [C.bUp1, 0], [C.bLoad0, 0], [C.fail, 0.7]);
  R.push([C.bUp0, 1], [C.fail, 1]);
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
  const H: V = {x: HX + 16 * shiftX - 26 * pier, y: hy};
  // feet: planted in a taut loop, or light in it (carried with the loop as its pad moves)
  const foot = (side: Side, w: number) => {
    const pad = side === 'L' ? padL : padR;
    // on the pier the near pad is out to the side: its foot stays under him and its strap runs diagonally to it
    const onPier = side === 'L' ? ss(T, C.bM0, C.bM1) : 0;
    const home = side === 'L' ? {...pad, zo: PZ.L} : pad;
    const seated = tautAnkle(side, {...home, gap: 0, tilt: 0});
    const taut = lerpV(tautAnkle(side, pad), diagAnkle(pad, seated), onPier);
    // (the far foot comes up a little out from the glass, clear of the fin's edge)
    const nearFin = clamp(1 - Math.abs(seated.y - 46 - LEDGE_Y) / 160);
    const free = add(seated, {x: side === 'R' ? -4 + 44 * nearFin : -4 + 10 * onPier, y: side === 'R' ? -46 : -20 + 14 * onPier});
    return lerpV(free, taut, ss(w, 0, 0.85));
  };
  const rMoves = MOVES.filter((m) => m.side === 'R');
  const reach = Math.max(...rMoves.map((m) => bump(T, m.rel, m.place, 6, 8)));
  const lookUp = Math.max(...rMoves.map((m) => bump(T, m.rel - 2, m.place + 4, 8, 10)));
  const lookSide = bump(T, C.bRel - 4, C.bLoad0 + 20, 10, 16); // he looks at the brick as he places the pad
  const lookDown = bump(T, C.look0, C.look1 + 6, 10, 8);
  const doubt = ss(T, 1056, 1084);
  const riseNow = Math.max(...CYCLES.map((c) => bump(T, c.rise[0] - 4, c.rise[1], 6, 8)));
  const strain = Math.max(riseNow, bump(T, C.bLoad0, C.fail, 10, 2) * 0.7);
  const pleased = Math.max(...rMoves.map((m) => bump(T, m.place - 2, m.place + 12, 6, 10)), bump(T, C.bPlace, C.bLoad0 + 10, 4, 10));
  let expr = mixExpr(mixExpr(mixExpr(EX.focus, EX.strain, strain * 0.6), EX.pleased, pleased * 0.6), EX.doubt, doubt);
  expr = {...expr, gy: expr.gy - 0.5 * lookUp + 0.9 * lookDown + 0.5 * lookSide, gx: expr.gx + 0.12 * lookUp};
  return {
    T, padL, padR, H,
    ankL: foot('L', wl), ankR: foot('R', wr), inL: true, inR: true, plantL: wl, plantR: wr,
    lean: 12 + 2 * reach + 4 * shiftX + 9 * pier, chest: 4 + 2 * reach + 4 * pier,
    head: 3 - 5 * lookUp + 6 * lookDown + 5 * lookSide, swing: 0, nearHand: null, expr,
    gripL: tight(padL.load), gripR: tight(padR.load),
  };
};

// ------------------------------------------------------------------ the fall, the catch, the opening (fail - FRAMES+CATCH_END)
/** the hips on the fin (standing on it) and the drop from the top of the climb to it */
const LEDGE_HIP = (): number => ledgeY(0.93);
/** the fall: the jolt (the far pad takes him alone and swings him out), then the drop; it accelerates, and the catch
 *  (the near pad sliding, then the feet on the fin) takes it out over the last frames */
const fallY = (T: number, top: number) => {
  // free fall to where his near hand can slap its pad on (the pad's rest less the slide, his arm reaching down a little
  // more than at rest), then the catch: the pad slides down to its rest as his feet come onto the fin, knees bent
  const atSlap = grip5(rest('L', DY(0))).y - SLIDE + 157;
  return keyN(T, [[C.fail, top], [C.peelR, top + 30], [C.slap, atSlap, (f, a, b) => clamp((f - a) / (b - a)) ** 2],
    [C.land + 2, LEDGE_HIP() + 46, (f, a, b) => 1 - (1 - clamp((f - a) / (b - a))) ** 2]]);
};
/** swing (deg, + out from the wall) about the far grip: out on the jolt, carried into the fall, back to the wall */
const SWING: KeyN = [[C.fail, 0], [C.peelR + 2, 13, easeOut], [C.peelR + 9, 16], [C.slap, 9], [C.held, 4], [C.absorb + 6, 0]];
/** how far the near pad slides on the glass as it takes the fall (world units: about 25 cm) */
const SLIDE = 200;

const catchBody = (T: number): Body => {
  const swing = keyN(T, SWING);
  const top = keyN(C.fail, HIP_KEYS);
  const fall = fallY(Math.min(T, C.land + 2), top);
  // the hips: falling, landing on the fin (the knees take it), rising to stand; the opening: settling onto the far pad
  // he has just placed, then off the fin into the stirrups (the dip), steady
  const ledgeHip = LEDGE_HIP();
  const loopsHip = levelY(0) + keyN(T, [[FRAMES + C.lift1, 0], [FRAMES + C.drop1, 26], [FRAMES + C.drop1 + 6, -6], [FRAMES + C.steady, 0]]);
  let hy = fall;
  if (T >= C.land + 2) hy = keyN(T, [[C.land + 2, ledgeHip + 46], [C.absorb + 8, ledgeHip - 6], [C.rPlace, ledgeHip - 12], [FRAMES + C.rLoad1, ledgeHip, easeOut]]);
  if (T >= FRAMES + C.lift0) {
    const lift = ss(T, FRAMES + C.lift0, FRAMES + C.lift1), inLoops = ss(T, FRAMES + C.lift1, FRAMES + C.drop1);
    hy = lerp(ledgeHip - 14 * lift, loopsHip, inLoops);
  }
  const H: V = {x: HX + 20 * ss(T, C.fail, C.peelR) * (1 - ss(T, C.held, C.absorb + 10)), y: hy};
  // the pads. The near pad: torn off the brick, pulled in to his chest, then slapped flat on the glass a hand's width
  // above its rest, where it loads and slides down to its rest as it takes him. The far pad: peeled off by the jolt,
  // held at his shoulder through the fall, then placed back on the glass (a normal seat) and loaded.
  const chest = (dx: number, dy: number): V => ({x: H.x + dx, y: H.y + dy});
  const restL = rest('L', DY(0)), restR = rest('R', UY(0));
  let padL: Pad5, padR: Pad5;
  const carried = (side: Side, at: V, zo: number, tilt: number): Pad5 => {
    const p: Pad5 = {y: 0, zo, gap: 0, tilt, load: 0, contact: 0, surface: 'glass'};
    const g = grip5(p);
    p.y = at.y - g.y;
    p.gap = Math.max(0.6, at.x - g.x);
    return p;
  };
  if (T < C.slap) {
    const g0 = grip5({...rest('L', DY(NCY) + 30), zo: Z_BRICK, gap: 4, tilt: 9});
    const inA = ss(T, C.fail, C.peelR + 4), out = ss(T, C.peelR + 6, C.slap);
    const atL = lerpV(lerpV(g0, {x: grip5(restL).x + 40, y: H.y - 120}, inA), {x: grip5(restL).x + 4, y: grip5(restL).y - SLIDE}, out);
    padL = carried('L', atL, lerp(Z_BRICK, PZ.L, ss(T, C.fail, C.peelR + 6)), keyN(T, [[C.fail, 9], [C.peelR + 4, 14], [C.slap - 4, 4], [C.slap, 0]]));
  } else {
    // slapped on: it loads at once and slides down to its rest, slowing (the wedges bend flat as it goes)
    const sl = keyN(T, [[C.slap, SLIDE], [C.held, 0, (f, a, b) => 1 - (1 - clamp((f - a) / (b - a))) ** 2]]);
    padL = {...restL, y: DY(0) - sl, load: keyN(T, [[C.slap, 0.55], [C.slap + 3, 1], [C.absorb + 6, 1], [FRAMES + C.rLoad1, 0.6], [FRAMES + C.lift0, 0.4], [FRAMES + C.lift1, 0.35], [FRAMES + C.drop1, 1]]), contact: keyN(T, [[C.slap, 0.4], [C.slap + 4, 1]])};
  }
  if (T < C.peelR) {
    // the jolt: the far pad alone takes him as he swings out; its lower edge comes away
    padR = {...rest('R', UY(NCY)), load: 1, tilt: keyN(T, [[C.fail, 0], [C.peelR, 10]]), gap: keyN(T, [[C.fail + 2, 0], [C.peelR, 3]]), contact: keyN(T, [[C.fail, 1], [C.peelR, 0.2]])};
  } else if (T < C.rPlace) {
    const ret = ss(T, C.rM0, C.rPlace - 4);
    const g1 = grip5(padRFrom(C.peelR)), seat = {x: grip5(restR).x + 6, y: grip5(restR).y - 8};
    const atR = lerpV(lerpV(g1, {x: grip5(restR).x + 34, y: H.y - 150}, ss(T, C.peelR, C.peelR + 10)), seat, ret);
    padR = carried('R', atR, PZ.R, keyN(T, [[C.peelR, 10], [C.peelR + 10, 12], [C.rM0, 8], [C.rPlace - 4, 2], [C.rPlace, 0]]));
    if (T >= C.rPlace - 4) padR.gap = keyN(T, [[C.rPlace - 4, Math.max(0.6, padR.gap)], [C.rPlace, 0, easeOut]]);
  } else {
    padR = {...restR, load: keyN(T, [[C.rPlace, 0.05], [FRAMES + C.rLoad1, 0.6, easeOut], [FRAMES + C.lift0, 0.4], [FRAMES + C.lift1, 0.35], [FRAMES + C.drop1, 1]]), contact: keyN(T, [[C.rPlace, 0.5], [C.rPlace + 6, 1]])};
  }
  // feet, always in their stirrups: at the top of the climb; dangling under him through the fall (the straps from the
  // pads in his hands); on the fin as he lands; then off it into the taut stirrups
  const dangle = (side: Side): V => ({x: H.x + (LEDGE_FOOT[side].x - HX) + 30, y: H.y + (LEDGE_FOOT[side].y - ledgeHip) + 60});
  const atTop = climbBody(C.fail - 0.001);
  let ankL = lerpV(atTop.ankL, dangle('L'), ss(T, C.fail, C.peelR + 8));
  let ankR = lerpV(atTop.ankR, dangle('R'), ss(T, C.fail, C.peelR + 8));
  const land = ss(T, C.land - 6, C.land);
  ankL = lerpV(ankL, LEDGE_FOOT.L, land);
  ankR = lerpV(ankR, LEDGE_FOOT.R, land);
  if (T >= FRAMES + C.lift0) {
    const nearTaut = tautAnkle('L', restL), farTaut = tautAnkle('R', restR);
    const lift = ss(T, FRAMES + C.lift0, FRAMES + C.lift1), drop = ss(T, FRAMES + C.lift1, FRAMES + C.drop1);
    const off = (A: V, to: V): V => ({x: lerp(A.x, to.x + 60, lift) - 60 * ss(drop, 0.5, 1), y: lerp(A.y - 30 * lift * (1 - drop), to.y, drop)});
    ankL = off(LEDGE_FOOT.L, nearTaut);
    ankR = off(LEDGE_FOOT.R, farTaut);
  }
  const onFin = T >= C.land && T < FRAMES + C.lift1 ? 1 : 0;
  const alarm = ss(T, C.fail, C.fail + 3) * (1 - ss(T, C.absorb, C.rPlace + 10));
  const relief = bump(T, C.absorb + 4, FRAMES + C.rLoad1 + 10, 10, 16);
  const strain = Math.max(bump(T, C.slap, C.absorb + 4, 2, 8), bump(T, FRAMES + C.lift0, FRAMES + C.steady, 6, 8) * 0.8);
  let expr = mixExpr(mixExpr(mixExpr(EX.focus, EX.strain, strain * 0.6), ALARM, alarm), EX.pleased, relief * 0.35);
  // (he looks down as he falls and lands; then back to the pad he is placing)
  const lookDn = bump(T, C.peelR, C.absorb + 6, 4, 10), lookPad = bump(T, C.rM0, FRAMES + C.rLoad1, 6, 10);
  expr = {...expr, gy: expr.gy + 0.7 * lookDn - 0.4 * lookPad};
  return {
    T, padL, padR, H, ankL, ankR, inL: true, inR: true, loopL: 1, loopR: 1,
    plantL: onFin ? 0 : T >= FRAMES + C.drop1 ? 1 : 0, plantR: onFin ? 0 : T >= FRAMES + C.drop1 ? 1 : 0,
    lean: lerp(12, 5, alarm) + 4 * bump(T, C.land, C.absorb + 10, 2, 10), chest: 4 + 4 * alarm,
    head: 3 + 8 * lookDn - 4 * lookPad, swing,
    nearHand: null, expr,
    gripL: T < C.slap ? mixHand(H_BAR, H_BAR_OPEN, 0.1) : tight(padL.load), gripR: T >= C.peelR && T < C.rPlace ? mixHand(H_BAR, H_BAR_OPEN, 0.1) : tight(padR.load),
  };
};
/** the far pad as it comes off the glass (its pose at the peel, for the carry) */
const padRFrom = (T: number): Pad5 => ({...rest('R', UY(NCY)), tilt: 10, gap: 3, load: 0, contact: 0.2, surface: 'glass'});

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
export const climbAt = (f: number): ClimbState => {
  const s0 = climbRaw(f);
  const uv = handUV(H_BAR, 'grip');
  const fix = (pad: Pad5, side: Side): Pad5 => {
    if (pad.gap < 0.5) return pad;
    const want = grip5(pad);
    const got = achievedGrip(s0.pose, side, uv.u, uv.v);
    return {...pad, y: pad.y + (got.y - want.y), gap: Math.max(0.5, pad.gap + (got.x - want.x))};
  };
  const padL = fix(s0.padL, 'L'), padR = fix(s0.padR, 'R');
  if (padL === s0.padL && padR === s0.padR) return s0;
  // rebuild with the carried pads where the hands are (the straps and stirrups follow them)
  return {...s0, padL, padR, ringL: ring5(padL), ringR: ring5(padR)};
};
export const hipY = (f: number) => climbAt(f).pose.y;
export {norm};
