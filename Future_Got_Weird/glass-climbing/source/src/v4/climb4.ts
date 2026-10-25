// Glass Climbing V4: the climber and his gear as one constrained rig, a pure function of the frame. FRAMES is frame 0
// again (the film loops on the same press of the near pad onto the glass).
//
// V4 rig (the V3 review showed the straps crossing in an X, through his legs, and feet in front of the window trim):
//   - Each pad's strap runs to the foot on the SAME side: the near (left) hand's pad to the near foot, the far (right)
//     hand's pad to the far foot. In this 3/4 view his near hip is screen-right of his far hip, so the near foot is
//     right of the far foot; the pads are set on the receding face so that the near pad's ring is right of the far
//     pad's too (zo, projected in full: x + KX zo). Ring order = foot order, so the two straps never cross.
//   - The straps hang nearly straight down the glass to loops at his feet, close to the wall, so they run in front of
//     (wall-side of) his shins and knees, never through them. The far pad's strap is longer by the pads' spacing, so
//     with the pads one above the other the two loops hang level.
//   - Match-style: the far hand always holds the upper pad (U), the near hand the lower one (D). A cycle: weight onto
//     the near loop (the far strap goes slack); the far pad peels, is carried up S and seated (its loop and the far
//     foot come up with it); he rises onto the far loop; the near pad peels, is carried up S to just below the far
//     one (the near foot comes up with its loop); weight back onto both loops.
//   - Hard constraints: a seated pad never moves; a hand is placed on its bar by IK every frame; a planted foot stands
//     on its loop's bar at the strap's taut length; a foot in a slack loop carries the loop (the strap sags); no foot
//     is ever farther from its ring than the strap allows and no leg is ever stretched. The hips follow the planted
//     supports (their standing heights, weighted by how much weight each carries), so the body is carried by its feet.
//
// On screen: 0-176 (the stool, the takeoff, the first far-pad move and rise), 470-535 (a near-pad move), 680-904
// (a full shift, far-pad move and rise; the height), 945-FRAMES (back on the stool: the brick test, the loop).
// Off screen (the micro views, the springs) he keeps climbing at the same rhythm; under the boundary close-up he is
// back on the stool.
import {EX, P as Pose} from '../world/pose';
import {ManPose} from '../dc/Man';
import {Expr, mixExpr} from '../dc/Head';
import {HandPose, mixHand} from '../dc/Hand';
import {add, clamp, len, lerpV, mul, norm, sub, V} from '../dc/math';
import {achievedGrip, ankleForBar, barForAnkle, H_BAR, handUV, placeHand, SOLE} from '../world/rig';
import {gripOf, PAD, PadState, prPad, ringOf} from '../world/geo';
import {easeOut, keyN, KeyN, ss} from '../world/climb';
import {BRICK_PAD_Y, FRAMES, STOOL4} from './set4';

export {keyN, ss, easeOut};
export const lin = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const bump = (f: number, a: number, b: number, ra = 8, rb = 10) => ss(f, a, a + ra) * (1 - ss(f, b, b + rb));

// ------------------------------------------------------------------ pads and straps
/** pad spacing (the lower pad's centre below the upper's) and the climb per cycle */
export const G = 134, S = 170;
/** the pads' heights on the stool (the lower pad just above the bricks, the upper one at his chest) */
export const D0 = -1100, U0 = D0 - G;
export const UY = (k: number) => U0 - k * S;
export const DY = (k: number) => D0 - k * S;
/** the pads' depth on the receding face (see the header): near pad (L) screen-right, far pad (R) screen-left */
export const PZ = {L: -180, R: 180};
type Side = 'L' | 'R';
const restPad = (side: Side, y: number): PadState => ({y, z: 0, gap: 0, tilt: 0, load: 0, zo: PZ[side]});
const ringAt = (side: Side, y: number) => prPad(ringOf(restPad(side, y)));
/** a taut strap's horizontal run from ring to loop bar (its loop sits a little out from the wall, under his feet) */
export const DX = {L: 130, R: 120};
/** both loops (taut) at the takeoff: 60 above the stool's top board */
export const TAKEOFF_BAR = STOOL4.top - 60;
/** strap lengths, ring to loop bar: the far pad's is longer by the spacing, so the loops hang level */
export const LEN = {L: Math.hypot(DX.L, TAKEOFF_BAR - ringAt('L', D0).y), R: Math.hypot(DX.R, TAKEOFF_BAR - ringAt('R', U0).y)};
const tautBar = (ring: V, side: Side): V => ({x: ring.x + DX[side], y: ring.y + Math.sqrt(LEN[side] ** 2 - DX[side] ** 2)});
/** an empty loop hangs straight down (a little out from the glass) */
export const hangingBar = (ring: V, side: Side): V => ({x: ring.x + 10, y: ring.y + LEN[side]});
/** the loop's top, where the strap joins it: over the forefoot, just above the shoe (the bar is under the arch) */
export const loopApex = (bar: V): V => ({x: bar.x - 22, y: bar.y - 74});

// ------------------------------------------------------------------ the climb's schedule
/** a pad move: release (peel), carry (m0-m1, just off the glass), seat (slide down onto the glass) */
export type Move = {side: Side; to: number; rel: number; m0: number; m1: number; place: number};
/** a cycle: sh (weight onto the near loop), R (far pad up S), rise (weight onto the far loop: he comes up part of the
 *  way, the near hand still on the lower pad), L (near pad up S), settle (onto both loops, up the rest of the way) */
type Cycle = {k: number; sh: [number, number]; R: [number, number, number, number]; rise: [number, number]; L?: [number, number, number, number]; settle?: [number, number]};
export const CYCLES: Cycle[] = [
  // "and climb it like Spider-Man" (on screen to 176)
  {k: 1, sh: [120, 130], R: [128, 134, 148, 154], rise: [154, 174], L: [218, 223, 236, 242], settle: [242, 256]},
  {k: 2, sh: [260, 268], R: [268, 273, 286, 292], rise: [294, 310], L: [314, 319, 332, 338], settle: [338, 352]},
  {k: 3, sh: [356, 364], R: [364, 369, 382, 388], rise: [390, 406], L: [408, 413, 426, 432], settle: [432, 444]},
  // "can hold your entire weight": the near pad's move, on screen (he stands in the far loop alone)
  {k: 4, sh: [446, 452], R: [452, 456, 466, 470], rise: [470, 488], L: [492, 500, 514, 522], settle: [524, 540]},
  {k: 5, sh: [548, 556], R: [556, 561, 574, 580], rise: [582, 598], L: [602, 607, 620, 626], settle: [626, 640]},
  // "Then, you shift your weight onto the other pad. The first releases, letting you reach higher and repeat."
  {k: 6, sh: [690, 748], R: [770, 790, 826, 838], rise: [842, 880]},
];
export const C = {
  contact: 5, pull0: 36, pull1: 62,
  nStep0: 72, nStep1: 86, nLoad0: 86, nLoad1: 98, fStep0: 98, fStep1: 112, fLoad0: 108, fLoad1: 120,
  look0: 878, look1: 902,
  frozen0: 904, stool: 945,
  lRel3: 976, lMove3a: 980, lMove3b: 1004, lPress0: 1008, lPress1: 1018,
  test0: 1040, test1: 1060,
  yank0: 1106, fail: 1116, failEnd: 1126, lift0: 1134, lift1: 1152,
};
export const MOVES: Move[] = CYCLES.flatMap((c) => [
  {side: 'R' as Side, to: UY(c.k), rel: c.R[0], m0: c.R[1], m1: c.R[2], place: c.R[3]},
  ...(c.L ? [{side: 'L' as Side, to: DY(c.k), rel: c.L[0], m0: c.L[1], m1: c.L[2], place: c.L[3]}] : []),
]);
/** the cycle index each pad has reached by frame f */
const kOf = (f: number, side: Side) => MOVES.filter((m) => m.side === side && f >= m.place).length;
const moveAt = (f: number, side: Side) => MOVES.find((m) => m.side === side && f >= m.rel - 1 && f <= m.place + 1);

const PEEL_GAP = (deg: number) => PAD.h * Math.sin((Math.abs(deg) * Math.PI) / 180);

const padTrack = (f: number, side: Side): PadState => {
  const base = side === 'L' ? DY : UY;
  let y = base(f >= C.stool ? 0 : kOf(f, side)), gap = 0, tilt = 0;
  if (side === 'L' && f < C.nStep0) {
    // frame 0: the near pad finishing its press onto the glass (continued from the film's last frames)
    gap = keyN(f, [[0, 4], [2, 1.2, lin], [C.contact, 0, easeOut]]);
    y = keyN(f, [[0, D0 - 2], [C.contact, D0]]);
  }
  const m = f < C.frozen0 ? moveAt(f, side) : undefined;
  if (m) {
    const from = m.to + S;
    // peels from its lower edge (unloaded), is carried up just off the glass, seated by a short slide down onto it
    tilt = keyN(f, [[m.rel, 0], [m.m0, 9], [m.m1 - 3, 5], [m.place - 2, 0]]);
    gap = keyN(f, [[m.rel, 0], [m.rel + 3, 1.2], [m.m0, 10], [(m.m0 + m.m1) / 2, 18], [m.m1, 8], [m.place, 0, easeOut]]);
    y = keyN(f, [[m.m0, from], [m.m1, m.to - 6], [m.place, m.to]]);
  }
  if (side === 'L' && f >= C.lRel3) {
    // down off the glass onto the brick, pressed on, tested; it skids, tips and tears off; back up to the glass
    tilt = keyN(f, [[C.lRel3, 0], [C.lMove3a, 9], [C.lMove3b - 4, 4], [C.lPress0, 2], [C.lPress1, 0]]);
    gap = keyN(f, [[C.lRel3, 0], [C.lRel3 + 4, 1.2], [C.lMove3a, 14], [(C.lMove3a + C.lMove3b) / 2, 40], [C.lMove3b, 16], [C.lPress0, 8], [C.lPress1, 0, easeOut]]);
    y = keyN(f, [[C.lMove3a, D0], [C.lMove3b, BRICK_PAD_Y - 10], [C.lPress1, BRICK_PAD_Y]]);
    if (f >= C.yank0) {
      const creep = keyN(f, [[C.yank0, 0], [C.fail, 6], [C.fail + 8, 26, easeOut]]);
      const tf = keyN(f, [[C.fail, 0], [C.fail + 5, -12], [C.failEnd + 4, -5], [C.lift0 + 4, 3], [C.lift1 - 4, 1], [C.lift1 + 2, 0]]);
      const g = keyN(f, [[C.fail - 2, 0], [C.fail + 5, 4], [C.failEnd, 26], [C.lift0 + 6, 36], [C.lift1 - 2, 16], [FRAMES - 6, 12], [FRAMES, 4, lin]]);
      tilt = tf;
      gap = g + (tf < 0 ? PEEL_GAP(tf) : 0);
      y = f < C.lift0 ? BRICK_PAD_Y + creep : keyN(f, [[C.lift0, BRICK_PAD_Y + 26], [C.lift1, D0 - 8], [FRAMES, D0 - 2]]);
    }
  }
  return {y, z: 0, gap, tilt, load: 0, zo: PZ[side]};
};

// ------------------------------------------------------------------ the body
export const HX = 330; // pelvis distance from the glass
const LEGF = 226 + 216;
export const HIP = {L: {x: 34, y: 44}, R: {x: -40, y: 42}};
/** feet on the stool's top board (toes toward the wall; the near foot right of the far one, under its hip) */
export const STOOL_FOOT = {L: {x: 352, y: STOOL4.top - SOLE}, R: {x: 292, y: STOOL4.top - SOLE}};
/** pelvis height standing on an ankle with the leg at `frac` of its length */
const standY = (A: V, side: Side, frac: number, hx = HX) => A.y - Math.sqrt(Math.max(0, (LEGF * frac) ** 2 - (hx + HIP[side].x - A.x) ** 2)) - HIP[side].y;

// support weights (0..1, eased): stool board under each foot, each loop (planted at its strap's taut length)
const STOOL_W: Record<Side, KeyN> = {L: [[0, 1], [C.nStep0 - 2, 1], [C.nStep0 + 4, 0], [C.stool - 1, 0], [C.stool, 1]], R: [[0, 1], [C.fStep0 - 2, 1], [C.fStep0 + 4, 0], [C.stool - 1, 0], [C.stool, 1]]};
const LOOP_W: Record<Side, KeyN> = (() => {
  const L: KeyN = [[0, 0], [C.nLoad0, 0], [C.nLoad1, 1]], R: KeyN = [[0, 0], [C.fLoad0, 0], [C.fLoad1, 1]];
  for (const c of CYCLES) {
    R.push([c.sh[0], 1], [c.sh[1], 0], [c.rise[0], 0], [c.rise[1], 1]);
    L.push([c.rise[0], 1], [c.rise[1], 0]);
    if (c.settle) L.push([c.settle[0], 0], [c.settle[1], 1]);
  }
  L.push([C.stool - 1, 0]);
  R.push([C.stool - 1, 0]);
  return {L, R};
})();
const loopW = (f: number, side: Side) => (f >= C.stool - 1 ? 0 : keyN(f, LOOP_W[side]));
const stoolW = (f: number, side: Side) => keyN(f, STOOL_W[side]);
/** leg extension on the stool: straight-ish, a smooth squat for the brick (one bend down, one back up) */
const stoolFrac = (f: number) => keyN(f, [[0, 0.94], [C.lRel3, 0.94], [C.lPress0, 0.82], [C.yank0, 0.82], [C.fail + 4, 0.85], [C.lift1, 0.94]]);

const tautAnkleAt = (side: Side, padY: number) => ankleForBar(tautBar(ringAt(side, padY), side), 1);
/** pelvis heights: on the stool board; on the near loop alone; on both loops (level) */
const stoolY = (frac: number) => (standY(STOOL_FOOT.L, 'L', frac) + standY(STOOL_FOOT.R, 'R', frac)) / 2;
const nearY = (k: number) => standY(tautAnkleAt('L', DY(k)), 'L', 0.93);
const levelY = (k: number) => (nearY(k) + standY(tautAnkleAt('R', UY(k)), 'R', 0.93)) / 2;
/** how far he comes up onto the far loop before the near pad moves (the near hand must still reach its pad) */
export const RISE_A = 84;
/** how far he settles into the near loop as he takes his weight off the far one (the near knee gives a little) */
export const SINK = 22;
const HIP_KEYS: KeyN = (() => {
  const k: KeyN = [[0, stoolY(0.94)], [C.nLoad0, stoolY(0.94)], [C.nLoad1, Math.max((stoolY(0.94) + nearY(0)) / 2, standY(STOOL_FOOT.R, 'R', 0.96))], [C.fStep1, nearY(0)], [C.fLoad1, levelY(0)]];
  for (const c of CYCLES) {
    // the shift: down onto the near loop, a little lower than standing on it (his weight settling into the strap)
    k.push([c.sh[0], levelY(c.k - 1)], [c.sh[1], nearY(c.k - 1) + SINK], [c.rise[0], nearY(c.k - 1) + SINK], [c.rise[1], nearY(c.k - 1) - RISE_A]);
    if (c.settle) k.push([c.settle[0], nearY(c.k - 1) - RISE_A], [c.settle[1], levelY(c.k)]);
  }
  return k;
})();
export const hipY = (f: number) => (f >= C.stool ? stoolY(stoolFrac(f)) : keyN(f, HIP_KEYS));

export type FootState = {ankle: V; bar: V; inLoop: boolean; planted: number};
export type ClimbState = {
  f: number;
  pose: ManPose;
  padL: PadState;
  padR: PadState;
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
};

const arc = (a: V, b: V, u: number, h = 60): V => add(lerpV(a, b, u), {x: 0, y: -h * Math.sin(Math.PI * u)});

export const climbAt = (f: number): ClimbState => {
  // under the boundary close-up (no climber in shot) he is taken down to the stool: hold the last climbing frame
  if (f >= C.frozen0 && f < C.stool) return {...climbAt(C.frozen0 - 1), f};
  const s0 = climbRaw(f);
  // a carried pad goes where the hand can take it (the arm never stretches)
  const uv = handUV(H_BAR, 'grip');
  const fix = (pad: PadState, side: Side): PadState => {
    if (pad.gap < 0.5) return pad;
    const want = prPad(gripOf(pad));
    const got = achievedGrip(s0.pose, side, uv.u, uv.v);
    return {...pad, y: pad.y + (got.y - want.y), gap: Math.max(0.5, pad.gap + (got.x - want.x))};
  };
  const padL = fix(s0.padL, 'L'), padR = fix(s0.padR, 'R');
  if (padL === s0.padL && padR === s0.padR) return s0;
  return climbRaw(f, padL, padR);
};

const climbRaw = (f: number, padLIn?: PadState, padRIn?: PadState): ClimbState => {
  const moving = (side: Side) => {
    const m = f < C.frozen0 ? moveAt(f, side) : undefined;
    return m ? 1 : 0;
  };
  const wl = {L: loopW(f, 'L'), R: loopW(f, 'R')};
  const ws = {L: stoolW(f, 'L'), R: stoolW(f, 'R')};
  // pad loads: on the stool, his pull on the bars; in the loops, the weight in that pad's loop; on the brick, the test
  const stoolLoad = (side: Side) => keyN(f, side === 'L' ? [[0, 0], [C.contact, 0.15], [C.pull0, 0.15], [C.pull1, 0.5]] : [[0, 0.3], [C.pull0, 0.3], [C.pull1, 0.5]]);
  const brickLoad = keyN(f, [[C.lRel3 - 4, 0], [C.lPress1, 0.1], [C.test0, 0.1], [C.test1, 0.45], [C.yank0, 0.45], [C.fail, 0.9], [C.fail + 3, 0], [FRAMES, 0]]);
  const loadOf = (side: Side) => {
    if (moving(side)) return 0;
    if (f >= C.stool) return side === 'L' && f >= C.lRel3 - 4 ? brickLoad : 0.3;
    if (f < C.nLoad0) return stoolLoad(side);
    return clamp(Math.max(stoolLoad(side) * (1 - wl[side]), 0.12 + 0.88 * wl[side]));
  };
  const padL = {...(padLIn ?? padTrack(f, 'L')), load: loadOf('L')};
  const padR = {...(padRIn ?? padTrack(f, 'R')), load: loadOf('R')};
  const ringL = prPad(ringOf(padL));
  const ringR = prPad(ringOf(padR));
  const taut = {L: ankleForBar(tautBar(ringL, 'L'), 1), R: ankleForBar(tautBar(ringR, 'R'), 1)};

  // ---- the pelvis: stage heights from the supports (see HIP_KEYS); on the stool, from the board and the squat
  const hy = f >= C.stool ? stoolY(stoolFrac(f)) : keyN(f, HIP_KEYS);
  const H: V = {x: HX, y: hy};

  // ---- feet: on the stool, stepping into a loop, or in it (planted at the taut length, or carried with a slack strap)
  const reachOf = (A: V, side: Side) => {
    const hp = add(H, HIP[side]);
    const d = sub(A, hp), l = len(d), mx = LEGF * 0.965;
    return l > mx ? add(hp, mul(d, mx / l)) : A;
  };
  const inCircle = (A: V, ring: V, side: Side) => {
    const b = barForAnkle(A, 1), d = sub(b, ring), l = len(d);
    return l > LEN[side] ? ankleForBar(add(ring, mul(d, LEN[side] / l)), 1) : A;
  };
  const foot = (side: Side): FootState => {
    const ring = side === 'L' ? ringL : ringR;
    const step0 = side === 'L' ? C.nStep0 : C.fStep0, step1 = side === 'L' ? C.nStep1 : C.fStep1;
    const hang = hangingBar(ring, side);
    if (f >= C.stool || f < step0) return {ankle: STOOL_FOOT[side], bar: hang, inLoop: false, planted: ws[side]};
    // a foot not carrying weight rises a little in its loop (knee easing), and is carried with the loop
    // (straight up in its loop, never out past the other strap; it follows its pad up and down, not the pad's small
    // stand-off from the glass while it is carried)
    const pad = side === 'L' ? padL : padR;
    const seated = ankleForBar(tautBar(prPad(ringOf({...pad, gap: 0, tilt: 0})), side), 1);
    const free = add(seated, {x: -4, y: -20});
    let A = lerpV(free, taut[side], ss(wl[side], 0, 0.85));
    if (f < step1) {
      // the step from the board into the loop: up off the board, across toward the wall, down into the loop
      const u = ss(f, step0, step1);
      A = arc(STOOL_FOOT[side], A, u, 70);
      const into = ss(f, step0 + (step1 - step0) * 0.55, step1);
      const bar = lerpV(hang, barForAnkle(A, 1), into);
      return {ankle: reachOf(A, side), bar, inLoop: into > 0.5, planted: 0};
    }
    A = inCircle(reachOf(A, side), ring, side);
    return {ankle: A, bar: barForAnkle(A, 1), inLoop: true, planted: wl[side]};
  };
  const footL = foot('L'), footR = foot('R');
  const sagOf = (ring: V, bar: V, side: Side) => Math.max(0, (LEN[side] - len(sub(bar, ring))) * 0.45);
  const sagL = footL.inLoop ? sagOf(ringL, footL.bar, 'L') : 0;
  const sagR = footR.inLoop ? sagOf(ringR, footR.bar, 'R') : 0;

  // a raised leg turns its knee out (toward the camera for the near leg, away for the far one) rather than pushing it
  // forward into the straps: the thigh foreshortens as the foot comes up
  const fsOf = (A: V, side: Side) => {
    const d = len(sub(A, add(H, HIP[side])));
    return 1 - 0.45 * ss(d, 0.92 * LEGF, 0.55 * LEGF);
  };
  const lFs = fsOf(footL.ankle, 'L'), rFs = fsOf(footR.ankle, 'R');

  // ---- torso, head, hands
  const rMoves = MOVES.filter((m) => m.side === 'R' && m.rel < C.frozen0);
  const reach = Math.max(...rMoves.map((m) => bump(f, m.rel, m.place, 6, 8))); // he reaches up with the far pad
  const lookUp = Math.max(...rMoves.map((m) => bump(f, m.rel - 2, m.place + 4, 8, 10)));
  const lookDown = Math.max(bump(f, C.look0, C.frozen0 + 4, 12, 4), bump(f, C.stool + 20, C.lift0, 12, 14));
  const recoil = keyN(f, [[C.fail, 0], [C.fail + 5, 1], [C.failEnd + 4, 0.5], [C.lift1, 0]]);
  const leanBase = keyN(f, [[0, 9], [C.nStep0, 9], [C.fLoad1, 12], [C.stool - 1, 12], [C.stool, 9], [C.lRel3, 9], [C.lPress0, 14], [C.yank0, 14], [C.lift1, 9], [FRAMES, 9]]);
  const lean = leanBase + 2 * reach - 4 * recoil;
  const chest = 4 + 2 * reach;
  // the head stays upright as the body leans: its angle is set directly (a small tip back looking up, forward
  // looking down), never as a side effect of the torso
  const headTilt = 3 - 5 * lookUp + 6 * lookDown;
  let pose: ManPose = Pose({x: H.x, y: H.y, s: 1, torso: lean, chest, neck: headTilt - lean - chest,
    lFs, rFs, lAx: footL.ankle.x, lAy: footL.ankle.y, lA: 1, rAx: footR.ankle.x, rAy: footR.ankle.y, rA: 1, lAnk: 0, rAnk: 0, lElb: -1, rElb: -1,
    breath: 0.3 + 0.3 * Math.sin((2 * Math.PI * Math.round(FRAMES / 57) * f) / FRAMES)}); // ~1.9 s breaths, whole cycles over the loop
  const uv = handUV(H_BAR, 'grip');
  pose = placeHand(pose, 'L', prPad(gripOf(padL)), 182, uv.u, uv.v);
  pose = placeHand(pose, 'R', prPad(gripOf(padR)), 176, uv.u, uv.v);
  const riseNow = Math.max(...CYCLES.map((c) => bump(f, c.rise[0] - 4, c.rise[1], 6, 8)));
  const strain = Math.max(bump(f, C.pull0, C.pull1, 10, 10), bump(f, C.nLoad0 - 4, C.fLoad1 + 4), riseNow, bump(f, C.test0, C.test1), bump(f, C.yank0, C.fail));
  const pleased = Math.max(...rMoves.map((m) => bump(f, m.place - 2, m.place + 12, 6, 10)), bump(f, C.lPress1, C.test0 - 6));
  const doubt = bump(f, C.fail + 2, C.lift0 + 6, 5, 12);
  const expr0 = mixExpr(mixExpr(mixExpr(EX.focus, EX.strain, strain * 0.6), EX.pleased, pleased * 0.6), EX.doubt, doubt);
  const expr = {...expr0, gy: expr0.gy - 0.5 * lookUp + 0.9 * lookDown, gx: expr0.gx + 0.12 * lookUp};
  const tight = (load: number): HandPose => mixHand(H_BAR, {curl: [0.8, 0.86, 0.9, 0.93], spread: 0.04, thumb: 30, thumbCurl: 0.68}, clamp(load));
  const blink = Math.max(...[22, 236, 608, 712, 960, 1090].map((b) => Math.max(0, 1 - Math.abs(f - b) / 2.2)));
  const legErr = (A: V, side: Side) => len(sub(A, add(H, HIP[side]))) / LEGF;
  return {
    f, pose, padL, padR, ringL, ringR, footL, footR, sagL, sagR, expr,
    lHand: tight(padL.load), rHand: tight(padR.load),
    hairSway: 0, blink,
    err: {legL: legErr(footL.ankle, 'L'), legR: legErr(footR.ankle, 'R')},
  };
};
export {norm};
