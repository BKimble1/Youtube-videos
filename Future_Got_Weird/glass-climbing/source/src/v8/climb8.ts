// Glass Climbing V8: the climber and his gear as one constrained rig over the whole film, a pure function of the
// frame (V7's rig re-staged for the V8 brief). The film is a loop.
//
// The story in the rig:
//   catch (0-44)       the end of the recovery: his near pad meets the glass (frame 3), a small downward load seats it,
//                      its strap takes his near foot, his pelvis and knees absorb a short settle, he stands steady in
//                      both stirrups. His feet never touch the glass: they are in their stirrups throughout.
//   climb (44-990)     eight match-style cycles of S (the first starts on "you could lift your feet": weight onto the
//                      near stirrup, the far knee lifts with its stirrup as the far pad goes up); the eighth ends
//                      standing on the far stirrup
//   brick (994-1095)   he takes the near pad (the one just seen seating on the glass) across onto the brick strip,
//                      presses it on, pleased, and doubts it as he leans on it; it creeps and slips off
//   slip (1095-end)    his near stirrup loses its anchor: that foot drops, his weight comes onto the far pad (still on
//                      the glass) and far stirrup, his knee bends and he lurches down a short way (the far strap is
//                      already taut: no free fall); he steadies, then deliberately reaches the free pad back to the
//                      glass: it arrives on the last frame and touches at frame 3.
// The climb is exactly one storey (NCY * S = FLOOR_H7): the end of the film is the opening one floor higher, and the
// facade repeats every storey, so the seam is the same picture. climbAt() gives the opening frames (before
// CATCH_END) in the opening's coordinates (one storey down) so the climb continues from them; climbTop() gives them at
// the top, continuous with the film's last frames, for the shots that run across the seam.
//
// Rig rules (as V4-V7): each pad's strap runs to the stirrup on the same side's foot; a seated pad never moves except
// in a shown slip; a hand is placed on its bar by IK every frame (a carried pad goes where the hand can take it); a
// planted foot stands on its stirrup's bar at the strap's taut length; no foot is farther from its ring than its
// strap; no leg is stretched; the feet stay in their stirrups throughout; no foot ever stands on a ledge or the glass.
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
export const PIER_Z = 240, Z_BRICK = 600;
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
/** a taut stirrup swung `extra` further out from the glass (its strap at a steeper angle): his shoes clear of it */
const tautAnkleX = (side: Side, pad: Pad5, extra: number) => {
  const r = ring5(pad), dx = DX[side] + extra;
  return ankleForBar({x: r.x + dx, y: r.y + Math.sqrt(LEN[side] ** 2 - dx * dx)}, 1);
};
/** his shoes hang this much further out from the glass than the straps' plain taut run: the soles sit on the stirrups,
 *  the toes clear of the glass (V8: no foot is ever seen standing on bare glass) */
export const EXTRA = 0;
/** the near foot standing in its loop with the pad out on the pier: under him (x of `home`), the strap taut diagonally */
const diagAnkle = (pad: Pad5, home: V) => {
  const r = ring5(pad), bx = barForAnkle(home, 1).x;
  const dx = bx - r.x;
  return ankleForBar({x: bx, y: r.y + Math.sqrt(Math.max(0, LEN.L ** 2 - dx * dx))}, 1);
};
/** the floor fins' phase: a fin top lies between the planted feet's heights (L and R sets, every S) at every level of
 *  the climb, so a shoe is never seen level with a fin; it projects FIN_D */
export const LEDGE_Y = tautAnkle('L', rest('L', DY(0))).y + SOLE + 1670; // (V8: phased so the stirrups hang clear of the floor lines and sill joints in the held shots)
export const FIN_D = 50;

// ------------------------------------------------------------------ the body
export const HX = 330;
const LEGF = 226 + 216;
export const HIP = {L: {x: 34, y: 44}, R: {x: -40, y: 42}};
const standY = (A: V, side: Side, frac: number, hx = HX) => A.y - Math.sqrt(Math.max(0, (LEGF * frac) ** 2 - (hx + HIP[side].x - A.x) ** 2)) - HIP[side].y;
const nearY = (k: number) => standY(tautAnkleX('L', rest('L', DY(k)), EXTRA), 'L', 0.93);
const farY = (k: number) => standY(tautAnkleX('R', rest('R', UY(k)), EXTRA), 'R', 0.93);
const levelY = (k: number) => (nearY(k) + farY(k)) / 2;
/** how far he comes up onto the far loop before the near pad moves; how far he settles into the near loop */
export const RISE_A = 84, SINK = 34;

// ------------------------------------------------------------------ the schedule
/** a pad move: release (peel), carry (m0-m1, just off the glass), seat (slide down onto it) */
export type Move = {side: Side; to: number; rel: number; m0: number; m1: number; place: number};
type Cycle = {k: number; sh: [number, number]; R: [number, number, number, number]; rise: [number, number]; L: [number, number, number, number] | null; settle: [number, number] | null;
  /** (V8) the shift's size: hips across toward the near stirrup (units), down into it (units); when the far loop
   *  unweights (default: during the shift); how high the light far foot comes up in its loop (units) */
  amp?: number; sink?: number; unw?: [number, number]; lift?: number};
export const CYCLES: Cycle[] = [
  // "you could lift your feet off the ground— and climb it like Spider-Man": weight onto the near stirrup, the far
  // pad (and with it the far stirrup and knee) up, the rise, the near pad up
  {k: 1, sh: [72, 84], R: [86, 90, 108, 114], rise: [116, 136], L: [140, 145, 158, 164], settle: [164, 176]},
  // through the micro views (hidden); steady and loaded for "can hold your entire weight" and the tether to the springs
  // (474-560, a small settle into the stirrups at 492); then on, behind the spring close-up
  {k: 2, sh: [230, 236], R: [236, 241, 252, 258], rise: [258, 274], L: [276, 281, 292, 298], settle: [298, 308]},
  {k: 3, sh: [312, 318], R: [318, 323, 334, 340], rise: [340, 356], L: [358, 363, 374, 380], settle: [380, 390]},
  {k: 4, sh: [394, 400], R: [400, 405, 416, 422], rise: [422, 438], L: [440, 445, 456, 462], settle: [462, 474]},
  {k: 5, sh: [552, 558], R: [558, 563, 574, 580], rise: [580, 596], L: [598, 603, 614, 620], settle: [620, 632]},
  // "Then, you shift your weight onto the other pad. The first releases, letting you reach higher and repeat.": one
  // whole cycle in one medium view; the next side begins on "repeat"
  // (V8 QA: shown whole in the medium view, so slower and bigger: the hips go across and down onto the near stirrup on
  // "Then, you shift your weight", the far stirrup unweights and its foot comes up on "onto the other pad", and the
  // far pad releases on "The first releases")
  {k: 6, sh: [664, 704], unw: [704, 744], amp: 50, sink: 56, lift: 100, R: [746, 758, 792, 806], rise: [808, 830], L: [834, 839, 851, 856], settle: [856, 866]},
  // nearing the brick ("But there's a catch."); the near pad seats on the glass in the contact test ("They need a
  // smooth surface"); up the glass once more ("So you can climb glass—")
  {k: 7, sh: [872, 878], R: [878, 883, 897, 902], rise: [902, 920], L: [922, 927, 940, 945], settle: [945, 952]},
  {k: 8, sh: [952, 964], unw: [952, 959], R: [960, 964, 974, 979], rise: [979, 990], L: null, settle: null},
];
export const C = {
  // the catch and the opening: contact, the seat (a small downward load), the settle, steady
  contact: 3, seat: 10, settle0: 8, settle1: 30, steady: 38,
  // the brick: the near pad sideways onto the brick strip, pressed on, weight toward it, it slips
  bRel: 994, bM0: 998, bM1: 1018, bPlace: 1024, bPress1: 1036, bLoad0: 1040, bLoad1: 1092, fail: 1095,
  // the recovery: arrested and steady on the far pad; the deliberate reach back to the glass
  arrest: 1108, reach0: 1146,
  look0: -100, look1: -90,
};
export const MOVES: Move[] = CYCLES.flatMap((c) => [
  {side: 'R' as Side, to: UY(c.k), rel: c.R[0], m0: c.R[1], m1: c.R[2], place: c.R[3]},
  ...(c.L ? [{side: 'L' as Side, to: DY(c.k), rel: c.L[0], m0: c.L[1], m1: c.L[2], place: c.L[3]}] : []),
]);
const kOf = (f: number, side: Side) => MOVES.filter((m) => m.side === side && f >= m.place).length;
const moveAt = (f: number, side: Side) => MOVES.find((m) => m.side === side && f >= m.rel - 1 && f <= m.place + 1);

/** the recovery runs on across the loop: T is film time, with frames 0-43 counted after the last frame */
export const CATCH_END = 44;
const T_OF = (f: number) => (f < CATCH_END ? f + FRAMES : f);

// ------------------------------------------------------------------ pads through the climb
const padClimb = (T: number, side: Side): Pad5 => {
  const base = side === 'L' ? DY : UY;
  const p = rest(side, base(kOf(T, side)));
  const m = moveAt(T, side);
  if (m) {
    const from = m.to + S;
    p.tilt = keyN(T, [[m.rel, 0], [m.m0, 9], [m.m1 - 3, 5], [m.place - 2, 0]]);
    // (a visible stand-off: it never slides on the glass while attached; the stand-off eases in and on, with no dead
    // stop where the carry begins)
    const sm = (t: number, a: number, b: number) => {
      const x = clamp((t - a) / (b - a));
      return x * x * (3 - 2 * x);
    };
    p.gap = keyN(T, [[m.rel, 0], [m.rel + 3, 4], [m.m0 + 2, 34, sm], [m.m1, 22, sm], [m.place, 0, easeOut]]);
    p.y = keyN(T, [[m.m0, from], [m.m1, m.to - 6], [m.place, m.to]]);
    p.contact = 1 - clamp(p.gap / 2);
  }
  if (side === 'L' && T >= C.bRel) {
    // sideways onto the brick pier (toward the camera), a little higher; pressed on: only part of it can touch
    const u = ss(T, C.bM0, C.bM1);
    p.zo = lerp(PZ.L, Z_BRICK, u);
    p.y = keyN(T, [[C.bM0, DY(NCY - 1)], [C.bM1, DY(NCY) - 6], [C.bPlace, DY(NCY)]]);
    p.tilt = keyN(T, [[C.bRel, 0], [C.bM0, 8], [C.bM1 - 4, 4], [C.bPlace, 1], [C.bPress1, 0]]);
    p.gap = keyN(T, [[C.bRel, 0], [C.bRel + 3, 2], [C.bM0, 16], [(C.bM0 + C.bM1) / 2, 26], [C.bM1, 10], [C.bPlace, 1.5], [C.bPress1, 0, easeOut]]);
    p.surface = T >= C.bM1 ? 'brick' : 'glass';
    p.contact = T >= C.bPlace ? 0.22 : 1 - clamp(p.gap / 2);
    if (T >= C.bLoad0) {
      // under his shifting weight the few contacts skid: it creeps down, its lower edge starts to come away
      const creep = keyN(T, [[C.bLoad0, 0], [1060, 4], [1082, 18], [C.fail, 44, (f, a, b) => clamp((f - a) / (b - a)) ** 2]]);
      p.y = DY(NCY) + creep;
      p.tilt = keyN(T, [[1050, 0], [1078, 4], [C.fail, 14]]);
      p.gap = keyN(T, [[1072, 0], [C.fail, 9]]);
      p.contact = keyN(T, [[C.bLoad0, 0.22], [1060, 0.16], [C.fail, 0.04]]);
    }
  }
  return p;
};

// ------------------------------------------------------------------ hips through the climb
const HIP_KEYS: KeyN = (() => {
  const k: KeyN = [[CATCH_END, levelY(0)]];
  for (const c of CYCLES) {
    k.push([c.sh[0], levelY(c.k - 1)], [c.sh[1], nearY(c.k - 1) + (c.sink ?? SINK)], [c.rise[0], nearY(c.k - 1) + (c.sink ?? SINK)], [c.rise[1], nearY(c.k - 1) - RISE_A]);
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
    R.push([(c.unw ?? c.sh)[0], 1], [(c.unw ?? c.sh)[1], 0], [c.rise[0], 0], [c.rise[1], 1]);
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
  const fsOf = (A: V, side: Side) => 1 - 0.3 * ss(len(sub(A, add(H, HIP[side]))), 0.92 * LEGF, 0.55 * LEGF); // (V8 QA: 0.45 turned a high shoe sole-on)
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
  // ("can hold your entire weight": he settles a little into the loaded stirrups, then holds)
  const hy = keyN(T, HIP_KEYS) + 16 * bump(T, 505, 513, 6, 14);
  const shiftX = Math.max(...CYCLES.map((c) => ss(T, c.sh[0], c.sh[1]) * (1 - ss(T, c.rise[0], c.rise[1]))));
  const shiftU = Math.max(...CYCLES.map((c) => (c.amp ?? 16) * ss(T, c.sh[0], c.sh[1]) * (1 - ss(T, c.rise[0], c.rise[1]))));
  // the light far foot's lift in its loop: the cycle's own, through its shift and carry until the rise
  // (a big lift shows the unweighting; it eases back to the usual height while the loop is carried up with its pad, so
  // the knee never comes up so high that the shoe turns sole-on)
  const cyc = CYCLES.find((c) => T >= c.sh[0] - 1 && T <= c.rise[1] + 1);
  const liftR = cyc?.lift ? lerp(cyc.lift, 46, ss(T, cyc.R[0], cyc.R[2])) : 46;
  // (reaching across to the pier he leans toward it, hips in a little)
  const pier = ss(T, C.bRel - 6, C.bM1) * (1 - ss(T, C.fail - 4, C.fail + 8));
  const H: V = {x: HX + shiftU - 10 * pier, y: hy};
  // feet: planted in a taut loop, or light in it (carried with the loop as its pad moves)
  const foot = (side: Side, w: number) => {
    const pad = side === 'L' ? padL : padR;
    // on the pier the near pad is out to the side: its foot stays under him and its strap runs diagonally to it
    const onPier = side === 'L' ? ss(T, C.bM0, C.bM1) : 0;
    const home = side === 'L' ? {...pad, zo: PZ.L} : pad;
    const seated = tautAnkleX(side, {...home, gap: 0, tilt: 0}, EXTRA);
    const taut = lerpV(tautAnkleX(side, pad, EXTRA), diagAnkle(pad, seated), onPier);
    // (the far foot comes up a little out from the glass, clear of the fin's edge)
    const nearFin = 0;
    const free = add(seated, {x: side === 'R' ? -4 + 44 * nearFin : -4 + 10 * onPier, y: side === 'R' ? -liftR : -20 + 14 * onPier});
    return lerpV(free, taut, ss(w, 0, 0.85));
  };
  const rMoves = MOVES.filter((m) => m.side === 'R');
  const reach = Math.max(...rMoves.map((m) => bump(T, m.rel, m.place, 6, 8)));
  const lookUp = Math.max(...rMoves.map((m) => bump(T, m.rel - 2, m.place + 4, 8, 10)));
  const lookSide = bump(T, C.bRel - 4, C.bLoad0 + 20, 10, 16); // he looks at the brick as he places the pad
  const lookDown = bump(T, C.look0, C.look1 + 6, 10, 8);
  const doubt = ss(T, C.bPlace + 4, C.bPress1 + 4); // (confident as it goes on; doubt as he leans on it)
  const riseNow = Math.max(...CYCLES.map((c) => bump(T, c.rise[0] - 4, c.rise[1], 6, 8)));
  const strain = Math.max(riseNow, bump(T, C.bLoad0, C.fail, 10, 2) * 0.7);
  const pleased = Math.max(...rMoves.map((m) => bump(T, m.place - 2, m.place + 12, 6, 10)), bump(T, C.bPlace - 6, C.bPlace + 4, 4, 6));
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

// ------------------------------------------------------------------ the slip, the recovery, the catch (fail - FRAMES+CATCH_END)
/** the short swing about the far grip (deg, + out from the wall) as his weight drops onto the far pad: a few degrees
 *  out, back by the time he reaches; none at the catch */
const SWING: KeyN = [
  [C.fail, 0],
  [C.fail + 9, 6, (f, a, b) => 1 - (1 - clamp((f - a) / (b - a))) ** 2],
  [C.arrest + 6, 1.5, (f, a, b) => {
    const x = clamp((f - a) / (b - a));
    return x * x * (3 - 2 * x);
  }],
  [C.reach0 + 12, 0], [FRAMES + C.contact, 0],
];
/** the lurch: how far his hips drop as his weight comes onto the far stirrup alone (units; the far strap is already
 *  taut, so the drop is his far knee bending and the near foot losing its stirrup, not a fall) */
const LURCH = 220;

const catchBody = (T: number): Body => {
  const swing = keyN(T, SWING);
  const tc = FRAMES + C.contact; // the near pad meets the glass
  // the far pad never leaves the glass; it takes all of him until the near pad is back on
  const padR: Pad5 = {...rest('R', UY(NCY)), load: 1};
  const atTop = climbBody(C.fail - 0.001);
  // the near pad: it slips down the brick and comes away in his hand; his arm drops with the lurch, the pad held low in
  // front of his hip, never across his face; he steadies; then one deliberate reach brings it forward and in to the
  // glass, arriving just short of it on the last frame; it touches at frame 3, and a small downward load seats it
  const gC = grip5(rest('L', DY(NCY)));
  const hangHip: V = {x: HX, y: levelY(NCY) + 10 + LURCH};
  let padL: Pad5;
  if (T < tc) {
    const g0 = grip5({...rest('L', DY(NCY) + 30), zo: Z_BRICK, gap: 4, tilt: 9});
    const low: V = add(hangHip, {x: -175, y: -135});
    const drop = ss(T, C.fail, C.fail + 12);
    // one deliberate reach: it starts from rest and accelerates into the glass (it meets it moving, at frame 3), so on
    // the film's first frames the pad is still visibly arriving
    const x = clamp((T - C.reach0) / (tc - C.reach0));
    const reach = x * x; // (accelerating all the way: it meets the glass at its fastest)
    // it arrives a little high (it then seats down onto its rest)
    const target: V = {x: gC.x, y: gC.y - 9};
    const at = lerpV(lerpV(g0, low, drop), target, reach);
    const tilt = keyN(T, [[C.fail, 9], [C.fail + 10, 15], [C.reach0, 12], [FRAMES - 6, 4], [tc, 0]]);
    const zo = lerp(Z_BRICK, PZ.L, ss(T, C.fail + 4, C.reach0 + 10));
    padL = {y: 0, zo, gap: 0, tilt, load: 0, contact: 0, surface: 'glass'};
    const g = grip5(padL);
    padL.y = at.y - g.y;
    padL.gap = Math.max(0, at.x - g.x);
  } else {
    // seated: it moves a few units down the glass as the wedges take the load, then holds
    const seat = keyN(T, [[tc, -9], [FRAMES + C.seat, 0, easeOut]]);
    padL = {...rest('L', DY(NCY)), y: DY(NCY) + seat, load: keyN(T, [[tc, 0.35], [FRAMES + C.seat, 1, easeOut]]), contact: keyN(T, [[tc, 0.3], [tc + 5, 1]])};
  }
  // hips: the lurch (fast, arrested by the far strap and his far knee, a small rebound), steady; during the reach he
  // stands up on the far stirrup; the catch: a short settle as the near stirrup takes him, then level
  const top = atTop.H.y;
  const level = levelY(NCY);
  let hy = keyN(T, [[C.fail, top], [C.fail + 8, top + LURCH * 1.06, (f, a, b) => clamp((f - a) / (b - a)) ** 1.6], [C.fail + 13, top + LURCH * 0.95], [C.fail + 19, top + LURCH]]);
  if (T >= C.fail + 19) hy = keyN(T, [[C.fail + 19, top + LURCH], [C.reach0, top + LURCH], [FRAMES - 2, level + 34], [tc, level + 30], [FRAMES + C.settle0 + 4, level + 92, (f, a, b) => {
    // (V8 QA: eased in as well as out, so the load comes on over a few frames instead of a one-frame drop at contact)
    const x = clamp((f - a) / (b - a));
    return x * x * (3 - 2 * x);
  }], [FRAMES + C.settle1, level]]);
  const H: V = {x: HX - 12 * ss(T, C.reach0, FRAMES) * (1 - ss(T, FRAMES + C.seat, FRAMES + C.settle1)), y: hy};
  // feet: the far foot stays in its taut stirrup under the far pad (it, the far hand and the pad hold him); the near
  // foot loses its stirrup's anchor and drops, hanging in its loop below him; during the reach it comes forward under
  // the pad; at the catch it takes its stirrup's load and both stand level
  const farT = tautAnkleX('R', padR, EXTRA);
  const fromTop = ss(T, C.fail, C.fail + 10);
  const dangle: V = add(hangHip, {x: HIP.L.x - 150, y: HIP.L.y + 440});
  const nearSeat = tautAnkleX('L', rest('L', DY(NCY)), EXTRA);
  let ankL = lerpV(atTop.ankL, dangle, fromTop);
  // (during the reach the foot comes under the pad, knee lifting, ready to take its stirrup)
  ankL = lerpV(ankL, add(nearSeat, {x: 0, y: -26}), ss(T, C.reach0 + 8, FRAMES + 2));
  if (T >= FRAMES + 2) ankL = lerpV(add(nearSeat, {x: 0, y: -26}), nearSeat, ss(T, FRAMES + 2, FRAMES + C.seat + 4));
  const ankR = lerpV(atTop.ankR, farT, fromTop);
  const plantL = T >= FRAMES ? ss(T, tc, FRAMES + C.seat + 4) : 0;
  padR.load = 1;
  if (T >= tc) padL.load = Math.max(padL.load, 0.35);
  const alarm = ss(T, C.fail, C.fail + 3) * (1 - ss(T, C.arrest, C.reach0 + 6));
  const intent = ss(T, C.reach0 - 6, C.reach0 + 4) * (1 - ss(T, FRAMES + C.seat, FRAMES + C.settle1));
  const relief = bump(T, FRAMES + C.settle0, FRAMES + C.steady, 6, 10);
  const strain = Math.max(bump(T, tc, FRAMES + C.settle1 - 6, 2, 8), intent * 0.7);
  let expr = mixExpr(mixExpr(mixExpr(EX.focus, EX.strain, strain * 0.6), ALARM, alarm * 0.95), EX.pleased, relief * 0.25);
  // (he looks down as he drops, then at the glass he is reaching for)
  const lookDown = bump(T, C.fail + 2, C.arrest + 6, 4, 10);
  const lookGlass = intent;
  expr = {...expr, gy: expr.gy + 0.55 * lookDown + 0.15 * lookGlass, gx: expr.gx - 0.25 * lookGlass};
  const tipBack = ss(T, C.fail, C.fail + 8) * (1 - ss(T, C.arrest, C.reach0));
  return {
    T, padL, padR, H, ankL, ankR, inL: true, inR: true, loopL: 1, loopR: 1,
    plantL, plantR: 1,
    lean: lerp(atTop.lean, 12, ss(T, C.fail, C.fail + 10)) - 7 * tipBack + 4 * intent, chest: 4 + 3 * alarm + 2 * intent,
    head: 3 + 6 * lookDown - 3 * alarm + 2 * intent, swing,
    nearHand: null, expr,
    gripL: T < tc ? mixHand(H_BAR, tight(1), 0.5) : tight(padL.load), gripR: tight(1),
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
