// Glass Climbing V5: the climber and his gear as one constrained rig over the whole film, a pure function of the
// frame. The film is a loop: frame 0 is the catch (the near pad slammed back onto the glass), and the last frames are
// the fall that leads into it.
//
// The story in the rig:
//   catch (0-30)   hanging from the far pad (which has slid down the glass under the shock), swinging out, his free
//                  near hand slams its pad onto the glass; the swing is arrested and he comes back to the wall
//   ledge (30-102) his feet go onto the floor fin (a ledge) below; he lifts them off it into the loops; the straps take
//                  his whole weight (a dip), and he steadies
//   climb (102-1095) match-style cycles (far hand on the upper pad, near hand on the lower one; a cycle is: weight
//                  onto the near loop, far pad up, rise onto the far loop, near pad up, weight onto both)
//   brick (930-1095) at the top of his climb he stands on the far loop, takes the near pad sideways onto the brick pier
//                  beside the glass bay, presses it on, and shifts his weight toward it: it creeps, peels, tears off
//   fall (1095-end) his weight drops onto the far pad alone: it slides down the glass (the shock is more than it can
//                  hold at once) while he swings out from the wall hanging from it, and reaches back to the glass
//                  with the near pad: frame 0.
// The far pad slides back down by exactly the height he climbed, so the last frame runs into frame 0 in every value.
//
// Rig rules (as V4): each pad's strap runs to the foot on the same side; the near pad (screen-right on the receding
// glass) carries the near foot, so the straps never cross; a seated pad never moves except in the shown slide; a hand
// is placed on its bar by IK every frame; a planted foot stands on its loop's bar at the strap's taut length; no foot is
// farther from its ring than its strap; no leg is stretched. The near hand stays between chest and waist (the near arm
// never crosses the face); the far arm, when it reaches above his head, passes behind it.
import {EX, P as Pose} from '../world/pose';
import {ManPose} from '../dc/Man';
import {Expr, EXPR_NEUTRAL, mixExpr} from '../dc/Head';
import {HandPose, mixHand} from '../dc/Hand';
import {add, clamp, len, lerp, lerpV, mul, norm, sub, V} from '../dc/math';
import {achievedGrip, ankleForBar, barForAnkle, H_BAR, H_BAR_OPEN, handUV, placeHand, SOLE} from '../world/rig';
import {KX, KY} from '../world/geo';
import {easeOut, keyN, KeyN, ss} from '../world/climb';
import {BAR_U, PH} from './Pad3D';
import {FRAMES} from '../v4/set4';

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
export const G = 134, S = 170, NCY = 3;
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
  // "and climb it like Spider-Man": the far pad up, one confident rise (on screen); the near pad follows (off screen)
  {k: 1, sh: [100, 108], R: [108, 113, 132, 138], rise: [144, 172], L: [186, 191, 204, 210], settle: [210, 224]},
  // behind the micro views; "can hold your entire weight": the near pad's move is on screen
  {k: 2, sh: [300, 308], R: [308, 313, 326, 332], rise: [334, 350], L: [490, 497, 514, 522], settle: [524, 540]},
  // "Then, you shift your weight onto the other pad. The first releases, letting you reach higher and repeat."
  {k: 3, sh: [690, 748], R: [770, 790, 826, 838], rise: [842, 872], L: [878, 883, 896, 902], settle: [904, 918]},
];
export const C = {
  contact: 3, // the near pad strikes the glass
  arrest: 9, // the swing stops
  wall: 26, // back against the wall
  ledge0: 22, ledge1: 44, // feet up onto the fin
  lift0: 64, lift1: 76, drop1: 86, steady: 98, // off the fin, into the loops, the dip, steady
  // the brick: weight onto the far loop, the near pad sideways onto the pier, pressed on, weight toward it, it fails
  bUp0: 926, bUp1: 950, bRel: 952, bM0: 958, bM1: 988, bPlace: 994, bPress1: 1012,
  bLoad0: 1018, bLoad1: 1092, fail: 1095,
  look0: 868, look1: 900,
};
export const MOVES: Move[] = CYCLES.flatMap((c) => [
  {side: 'R' as Side, to: UY(c.k), rel: c.R[0], m0: c.R[1], m1: c.R[2], place: c.R[3]},
  {side: 'L' as Side, to: DY(c.k), rel: c.L[0], m0: c.L[1], m1: c.L[2], place: c.L[3]},
]);
const kOf = (f: number, side: Side) => MOVES.filter((m) => m.side === side && f >= m.place).length;
const moveAt = (f: number, side: Side) => MOVES.find((m) => m.side === side && f >= m.rel - 1 && f <= m.place + 1);

/** the fall and catch run on across the loop: T is film time, with frames 0-101 counted after the last frame */
export const CATCH_END = 102;
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
      const creep = keyN(T, [[C.bLoad0, 0], [1060, 4], [1082, 14], [C.fail, 30, (f, a, b) => clamp((f - a) / (b - a)) ** 2]]);
      p.y = DY(NCY) + creep;
      p.tilt = keyN(T, [[1050, 0], [1080, 3], [C.fail, 9]]);
      p.gap = keyN(T, [[1074, 0], [C.fail, 4]]);
      p.contact = keyN(T, [[C.bLoad0, 0.22], [1060, 0.16], [C.fail, 0.04]]);
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

// ------------------------------------------------------------------ the climb (102-1095)
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
  const doubt = ss(T, 1062, 1086);
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

// ------------------------------------------------------------------ the fall, the catch, the ledge (1095 - FRAMES+102)
/** the swing about the far grip (deg, + out from the wall) */
const SWING: KeyN = [[C.fail, 0], [1113, 30, (f, a, b) => 1 - (1 - clamp((f - a) / (b - a))) ** 2], [1137, 6], [FRAMES + C.contact, 17, (f, a, b) => {
  const x = clamp((f - a) / (b - a));
  return x * x * (3 - 2 * x) * 0.6 + x * 0.4;
}], [FRAMES + C.arrest, 18.6, easeOut], [FRAMES + C.wall, 0]];
/** the far pad slides back down the glass by the height he climbed, fast at first, stopped by the catch */
const farSlide = (T: number) => keyN(T, [[C.fail, UY(NCY)], [FRAMES + C.contact + 3, UY(0), (f, a, b) => 1 - (1 - clamp((f - a) / (b - a))) ** 2.4]]);

const catchBody = (T: number): Body => {
  const swing = keyN(T, SWING);
  const tc = FRAMES + C.contact; // the near pad strikes the glass
  // the far pad: sliding, loaded; the near pad: in his hand until it strikes
  const padR: Pad5 = {...rest('R', farSlide(T)), load: 1};
  const hang = 160 * ss(T, C.fail, C.fail + 10) * (1 - ss(T, FRAMES + C.ledge0, FRAMES + C.ledge1)); // he drops onto his far arm
  // the near hand: the brick pad tears away and his near arm drops back by his side, the pad dangling from it (never
  // up across his face), then swings forward and in to the glass
  const gC = grip5(rest('L', DY(0)));
  let padL: Pad5;
  const nearHand: V | null = null;
  if (T < tc) {
    const hangH: V = {x: HX, y: farY(0) + (padR.y - UY(0)) + 160};
    const side: V = add(hangH, {x: 150, y: -300}); // beside his waist, out from the wall (clear of his knees)
    const g0 = grip5({...rest('L', DY(NCY) + 30), zo: Z_BRICK, gap: 4, tilt: 9});
    const drop = ss(T, C.fail, 1112), fwd = ss(T, 1136, tc);
    const at = lerpV(lerpV(g0, side, drop), gC, fwd);
    const tilt = keyN(T, [[C.fail, 9], [1110, 14], [1134, 10], [tc - 8, 3], [tc, 0]]);
    const zo = lerp(Z_BRICK, PZ.L, ss(T, C.fail, 1120));
    padL = {y: 0, zo, gap: 0, tilt, load: 0, contact: 0, surface: 'glass'};
    const g = grip5(padL);
    padL.y = at.y - g.y;
    padL.gap = Math.max(0, at.x - g.x);
  } else {
    padL = {...rest('L', DY(0)), load: keyN(T, [[tc, 0.6], [tc + 4, 1], [FRAMES + C.ledge0, 1], [FRAMES + C.ledge1, 0.3], [FRAMES + C.lift1, 0.35], [FRAMES + C.drop1, 1]]), contact: keyN(T, [[tc, 0.3], [tc + 4, 1]])};
  }
  padR.load = T < FRAMES + C.ledge0 ? 1 : keyN(T, [[FRAMES + C.ledge0, 1], [FRAMES + C.ledge1, 0.3], [FRAMES + C.lift1, 0.35], [FRAMES + C.drop1, 1]]);
  // hips: hanging from the far pad (sliding with it), then on the fin, then in the loops (the dip), steady
  const hangY = farY(0) + (padR.y - UY(0)) + hang;
  const onLedge = ss(T, FRAMES + C.ledge0, FRAMES + C.ledge1) * (1 - ss(T, FRAMES + C.lift1, FRAMES + C.drop1));
  const ledgeHip = ledgeY(0.93);
  const loopsHip = levelY(0) + keyN(T, [[FRAMES + C.lift1, 0], [FRAMES + C.drop1, 26], [FRAMES + C.drop1 + 6, -6], [FRAMES + C.steady, 0]]);
  const inLoops = ss(T, FRAMES + C.lift1, FRAMES + C.drop1);
  let hy = lerp(hangY, ledgeHip, onLedge);
  if (T >= FRAMES + C.lift1) hy = lerp(ledgeHip - 14 * bump(T, FRAMES + C.lift0, FRAMES + C.lift1, 4, 4), loopsHip, inLoops);
  else if (T >= FRAMES + C.lift0) hy = ledgeHip - 14 * ss(T, FRAMES + C.lift0, FRAMES + C.lift1);
  const H: V = {x: HX - 10 * ss(T, FRAMES, FRAMES + C.wall), y: hy};
  // feet: the far foot in its loop under the far pad, the near foot light in its loop (its pad in his hand); then up on
  // the fin; then off it into the taut loops
  const farTaut = tautAnkle('R', padR), nearTaut = tautAnkle('L', rest('L', DY(0)));
  const hangR = add(farTaut, {x: 10, y: -hang * 0.6});
  const hangHip: V = {x: HX, y: farY(0) + (padR.y - UY(0)) + hang};
  // (the free leg hangs under his hip; it swings with him only part of the way)
  const hangL0 = add(hangHip, {x: HIP.L.x + 40, y: HIP.L.y + 360});
  const hangL = rot(hangL0, grip5(padR), -0.55 * keyN(T, SWING));
  const up = ss(T, FRAMES + C.ledge0, FRAMES + C.ledge1);
  const lift = ss(T, FRAMES + C.lift0, FRAMES + C.lift1);
  const drop = ss(T, FRAMES + C.lift1, FRAMES + C.drop1);
  const liftOff = (A: V, to: V) => ({x: lerp(A.x, to.x + 60, lift) - 60 * ss(drop, 0.5, 1), y: A.y - 30 * lift * (1 - drop)});
  const over = (A: V, B: V, u: number): V => ({x: lerp(A.x, B.x, u) + 70 * Math.sin(Math.PI * u), y: lerp(A.y, B.y, ss(u, 0, 0.7))});
  let ankL = over(hangL, LEDGE_FOOT.L, up), ankR = over(hangR, LEDGE_FOOT.R, up);
  if (T >= FRAMES + C.lift0) {
    const off = (A: V, to: V): V => {
      const p = liftOff(A, to);
      return {x: p.x, y: lerp(p.y, to.y, drop)};
    };
    ankL = off(LEDGE_FOOT.L, nearTaut);
    ankR = off(LEDGE_FOOT.R, farTaut);
  }
  const swingK = T < FRAMES + C.wall + 4 ? 1 : 0;
  const alarm = ss(T, C.fail, C.fail + 4) * (1 - ss(T, FRAMES + C.arrest, FRAMES + C.wall + 10));
  const relief = bump(T, FRAMES + C.wall, FRAMES + C.ledge1 + 10, 8, 14);
  const strain = Math.max(bump(T, FRAMES + C.contact, FRAMES + C.arrest + 6, 2, 8), bump(T, FRAMES + C.lift0, FRAMES + C.steady, 6, 8) * 0.8);
  let expr = mixExpr(mixExpr(mixExpr(EX.focus, EX.strain, strain * 0.6), ALARM, alarm), EX.pleased, relief * 0.4);
  expr = {...expr, gy: expr.gy + 0.6 * bump(T, FRAMES + C.wall, FRAMES + C.drop1, 8, 8)};
  // the near foot slipped out of its loop when the brick pad tore away: the loop dangles from the pad in his hand; the
  // foot steps back into it off the fin
  // on the fin both feet are out of their loops (the loops hang from the pads); off it, both step back in
  const tIn = FRAMES + C.lift0 + (C.lift1 - C.lift0) * 0.55;
  const loopR = 1 - ss(T, FRAMES + C.ledge0, FRAMES + C.ledge0 + 8) + ss(T, FRAMES + C.lift0, tIn);
  const loopL = ss(T, FRAMES + C.lift0, tIn);
  const inL = T >= tIn, inR = T < FRAMES + C.ledge0 + 4 || T >= tIn;
  return {
    T, padL, padR, H, ankL, ankR, inL, inR, loopL, loopR,
    plantL: T >= FRAMES + C.drop1 ? 1 : 0, plantR: T >= FRAMES + C.drop1 ? 1 : 0,
    lean: lerp(12, 4, alarm) + 6 * ss(T, C.fail, 1110) * (1 - ss(T, FRAMES, FRAMES + C.wall)), chest: 4 + 4 * alarm,
    head: 3 - 10 * alarm * swingK + 10 * bump(T, FRAMES + C.wall - 6, FRAMES + C.drop1, 8, 8), swing: swing * swingK,
    nearHand, expr,
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
export const climbAt = (f: number): ClimbState => {
  const s0 = climbRaw(f);
  const uv = handUV(H_BAR, 'grip');
  const fix = (pad: Pad5, side: Side): Pad5 => {
    if (pad.gap < 0.5) return pad;
    const want = grip5(pad);
    const got = achievedGrip(s0.pose, side, uv.u, uv.v);
    return {...pad, y: pad.y + (got.y - want.y), gap: Math.max(0.5, pad.gap + (got.x - want.x))};
  };
  const padL = fix(s0.padL, 'L');
  if (padL === s0.padL) return s0;
  // rebuild with the near pad where the hand is (the strap and loop follow it)
  return {...s0, padL, ringL: ring5(padL)};
};
export const hipY = (f: number) => climbAt(f).pose.y;
export {norm};
