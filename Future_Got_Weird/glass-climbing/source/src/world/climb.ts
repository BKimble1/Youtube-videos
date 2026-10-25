// The climb, as one continuous world over the whole film (the bay is seen at 0-181, 477-535 and 681-866; between those
// shots the world keeps its state). Everything is a pure function of the frame.
//
// Order of events (Hawkes et al.'s technique: a pad per hand, a foot stirrup on each pad's strap), film frames:
//   0-8      the left pad seats on the glass; the right pad is already seated above it
//   8-16     the left foot leaves the floor into the left stirrup and weights it (the strap snaps taut)
//   20-40    he stands up on the left; the right foot leaves the floor (both feet off the ground)
//   40-56    the right foot goes into the right stirrup
//   80-112   "lift your feet off the ground": he stands up on the right (the left goes slack)
//   112-140  "and climb it": the left pad, unloaded, peels off, is carried past the right one and seated above it
//   150-178  "like Spider-Man": the left foot steps up into its stirrup and he starts up onto it
//   477-506  "can hold your entire weight": he finishes standing on the left; on the left pad alone, the right pad is
//            released (488), lifted and seated above (516), and the right foot follows it into its stirrup (535)
//   692-752  "you shift your weight onto the other pad": he stands up on the right (the left goes slack)
//   790-798  "The first releases": the left pad peels off
//   798-826  "reach higher": it is carried up and seated; 826-866 "and repeat": the left foot steps up, he starts onto it
// A loaded pad never moves; a pad is lifted only after its strap has gone slack.
import {BASE, P as Pose} from './pose';
import {ManPose} from '../dc/Man';
import {Expr, mixExpr} from '../dc/Head';
import {HandPose, mixHand} from '../dc/Hand';
import {add, clamp, len, lerp, lerpV, mul, norm, sub, V} from '../dc/math';
import {achievedGrip, ankleForBar, barForAnkle, H_BAR, handUV, placeHand, SOLE} from './rig';
import {CM, gripOf, PadState, prPad, ringOf, STRAP_LEN, Z_FAR, Z_NEAR} from './geo';
import {EX} from './pose';

export const ss = (f: number, a: number, b: number) => {
  const x = clamp((f - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const ss5 = (f: number, a: number, b: number) => {
  const x = clamp((f - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
type Ease = (f: number, a: number, b: number) => number;
export const easeOut: Ease = (f, a, b) => 1 - (1 - clamp((f - a) / (b - a))) ** 3;
export const easeIn: Ease = (f, a, b) => clamp((f - a) / (b - a)) ** 2;
export type KeyN = [number, number, Ease?][];
export const keyN = (f: number, keys: KeyN): number => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return keys[i][0] <= keys[i - 1][0] ? keys[i][1] : lerp(keys[i - 1][1], keys[i][1], (keys[i][2] ?? ss5)(f, keys[i - 1][0], keys[i][0]));
  return keys[keys.length - 1][1];
};
export const keyV = (f: number, keys: [number, V, Ease?][]): V => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return lerpV(keys[i - 1][1], keys[i][1], (keys[i][2] ?? ss5)(f, keys[i - 1][0], keys[i][0]));
  return keys[keys.length - 1][1];
};

// ------------------------------------------------------------------ the pads' heights (pad centres)
// The near arm crosses in front of the face whenever its hand is at face height (the rig's three-quarter
// construction), so the near pad is only ever seated well below the chin or well above the brow: the far pad steps up
// 160 above the near one (clear of it: a pad is 124 tall), the near pad 380 above the far one (a full cycle climbs
// 540, about 87 cm).
const UP_R = 160, UP_L = 380;
const Y0 = -780;
export const Y = {L0: Y0, R0: Y0 - UP_R, L1: Y0 - UP_R - UP_L, R1: Y0 - 2 * UP_R - UP_L, L2: Y0 - 2 * UP_R - 2 * UP_L, R2: Y0 - 3 * UP_R - 2 * UP_L};

export const C = {
  contact: 6,
  lFoot0: 8, lFoot1: 16, // left foot into its stirrup, weighted
  standL0a: 20, standL0b: 40, rOff0: 22, rOff1: 34, // up on the left; the right foot leaves the floor
  rIn0: 40, rIn1: 56, // the right foot into its stirrup
  standR0a: 80, standR0b: 112, // "lift your feet off the ground"
  lRel: 106, lMove0: 112, lMove1: 130, lPlace: 136, // "and climb it"
  standL1a: 150, standL1b: 178, standL1c: 477, standL1d: 506, // "like Spider-Man" ... "entire weight"
  rRel: 488, rMove0: 494, rMove1: 512, rPlace: 518, rIn2a: 516, rIn2b: 535, // "can hold your entire weight"
  standR1a: 692, standR1b: 752, // "Then, you shift your weight onto the other pad"
  lRel2: 790, lMove2a: 798, lMove2b: 818, lPlace2: 826, // "The first releases, letting you reach higher"
  lIn2a: 826, lIn2b: 845, standL2a: 845, standL2b: 866, // "and repeat"
  standL2c: 971, standL2d: 996, rRel3: 974, rMove3a: 979, rMove3b: 1000, rPlace3: 1008, rIn3a: 1008, rIn3b: 1026, // "So you can climb glass"
};

type Move = {rel: number; m0: number; m1: number; place: number; from: number; to: number};
const MOVES: Record<'L' | 'R', Move[]> = {
  L: [{rel: C.lRel, m0: C.lMove0, m1: C.lMove1, place: C.lPlace, from: Y.L0, to: Y.L1}, {rel: C.lRel2, m0: C.lMove2a, m1: C.lMove2b, place: C.lPlace2, from: Y.L1, to: Y.L2}],
  R: [{rel: C.rRel, m0: C.rMove0, m1: C.rMove1, place: C.rPlace, from: Y.R0, to: Y.R1}, {rel: C.rRel3, m0: C.rMove3a, m1: C.rMove3b, place: C.rPlace3, from: Y.R1, to: Y.R2}],
};
const LOAD: Record<'L' | 'R', KeyN> = {
  L: [[0, 0.2], [C.lFoot0, 0.25], [C.lFoot1, 1], [C.standR0a, 1], [C.standR0b - 8, 0], [C.lPlace + 4, 0], [C.lPlace + 8, 0.2], [C.standL1a, 0.25], [C.standL1b - 6, 0.75], [C.standL1c, 0.75], [C.standL1c + 12, 1],
    [C.standR1a, 1], [C.standR1b - 4, 0], [C.lPlace2 + 4, 0], [C.lPlace2 + 10, 0.2], [C.standL2a, 0.3], [C.standL2a + 21, 0.8], [C.standL2c, 0.8], [C.standL2c + 10, 1]],
  R: [[0, 0.2], [C.rIn1, 0.2], [C.rIn1 + 6, 0.4], [C.standR0a, 0.4], [C.standR0b - 6, 1], [C.standL1a, 1], [C.standL1b - 8, 0.3], [C.standL1c, 0.3], [C.rRel - 2, 0], [C.rPlace + 4, 0], [C.rPlace + 10, 0.2],
    [C.rIn2b, 0.35], [C.standR1a, 0.35], [C.standR1b - 8, 1], [C.standL2a, 1], [C.standL2a + 21, 0.4], [C.standL2c, 0.4], [C.rRel3 - 2, 0], [C.rPlace3 + 4, 0], [C.rPlace3 + 10, 0.2]],
};

const padTrack = (f: number, side: 'L' | 'R'): PadState => {
  const z = side === 'L' ? Z_NEAR : Z_FAR;
  let y = side === 'L' ? Y.L0 : Y.R0, gap = 0, tilt = 0;
  if (side === 'L') gap = keyN(f, [[0, 5], [C.contact, 0, easeOut]]);
  for (const m of MOVES[side]) {
    if (f < m.rel) break;
    // release: the unloaded pad peels from its lower edge, then is carried up along the glass and seated
    tilt = keyN(f, [[m.rel, 0], [m.m0, 9], [m.m1 - 4, 5], [m.place - 2, 0]]);
    gap = keyN(f, [[m.rel, 0], [m.rel + 5, 1.2], [m.m0, 14], [(m.m0 + m.m1) / 2, 46], [m.m1, 12], [m.place, 0, easeOut]]);
    y = keyN(f, [[m.m0, m.from], [m.m1, m.to - 6], [m.place, m.to]]);
  }
  return {y, z, gap, tilt, load: keyN(f, LOAD[side])};
};

// ------------------------------------------------------------------ the body
const HX = 355; // pelvis distance from the glass: arms reach forward and up to the bars
const NEAR_DX = 150; // loaded stirrup bar's horizontal offset from its ring (near foot)
const FAR_DX = 120;
const LEG = (226 + 216) * 0.95; // a standing leg, knee just off straight
const HIP = {L: {x: 34, y: 44}, R: {x: -40, y: 42}};
/** the stirrup bar of a loaded foot: the strap straight from the ring, its full length */
const loadedBar = (ring: V, dx: number): V => ({x: ring.x + dx, y: ring.y + Math.sqrt(STRAP_LEN * STRAP_LEN - dx * dx)});
const ringAt = (padY: number): V => prPad(ringOf({y: padY, z: 0, gap: 0, tilt: 0, load: 1}));
/** pelvis height when standing (leg nearly straight) in the stirrup of the pad at padY */
const standY = (padY: number, side: 'L' | 'R'): number => {
  const A = ankleForBar(loadedBar(ringAt(padY), side === 'L' ? NEAR_DX : FAR_DX), 1);
  const hx = HX + HIP[side].x;
  // on the right stirrup he stays a little lower, so his near hand still reaches the unloaded pad below
  const leg = side === 'R' ? LEG * 0.955 : LEG;
  return A.y - Math.sqrt(leg * leg - (hx - A.x) ** 2) - HIP[side].y;
};
const FLOOR_X = {L: 200, R: 240};
const H_FLOOR = Math.max(-SOLE - Math.sqrt(LEG * LEG - (HX + HIP.R.x - FLOOR_X.R) ** 2) - HIP.R.y, -SOLE - Math.sqrt(LEG * LEG - (HX + HIP.L.x - FLOOR_X.L) ** 2) - HIP.L.y);
const hipY = (f: number) =>
  keyN(f, [
    [0, H_FLOOR], [C.lFoot0, H_FLOOR + 4], [C.standL0a, H_FLOOR - 6], [C.standL0b, standY(Y.L0, 'L')],
    [C.standR0a, standY(Y.L0, 'L')], [C.standR0b, standY(Y.R0, 'R')],
    [C.standL1a, standY(Y.R0, 'R')], [C.standL1b, standY(Y.R0, 'R') * 0.94 + standY(Y.L1, 'L') * 0.06], [C.standL1c, standY(Y.R0, 'R') * 0.94 + standY(Y.L1, 'L') * 0.06], [C.standL1d, standY(Y.L1, 'L')],
    [C.standR1a, standY(Y.L1, 'L')], [C.standR1b, standY(Y.R1, 'R')],
    [C.standL2a, standY(Y.R1, 'R')], [C.standL2b, standY(Y.R1, 'R') - 6], [C.standL2c, standY(Y.R1, 'R') - 6], [C.standL2d, standY(Y.L2, 'L')],
  ]);

export type FootState = {ankle: V; bar: V | null; inStirrup: boolean};
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
  err: {hL: number; hR: number; legL: number; legR: number};
};

/** the free (unweighted) foot hangs under its hip with the knee lifted by `lift`, within its strap's reach */
const freeAnkle = (H: V, side: 'L' | 'R', ring: V | null, lift: number): V => {
  const hip = add(H, HIP[side]);
  const hang = add(hip, {x: -70, y: 380 - lift});
  if (!ring) return hang;
  const bar = barForAnkle(hang, 1);
  if (len(sub(bar, ring)) <= STRAP_LEN * 0.985) return hang;
  return ankleForBar(add(ring, mul(norm(sub(bar, ring)), STRAP_LEN * 0.985)), 1);
};
/** an arc between two ankle positions (the knee leads: up, then across, then down onto the target) */
const arc = (a: V, b: V, u: number, h = 60): V => add(lerpV(a, b, u), {x: 0, y: -h * Math.sin(Math.PI * u)});

export const climbAt = (f: number): ClimbState => {
  const s0 = climbRaw(f);
  // a pad that is off the glass is in his hand: it goes where the hand actually is (the scripted path is only the aim)
  const uv = handUV(H_BAR, 'grip');
  const fix = (pad: PadState, side: 'L' | 'R'): PadState => {
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
  const padL = padLIn ?? padTrack(f, 'L');
  const padR = padRIn ?? padTrack(f, 'R');
  const ringL = prPad(ringOf(padL));
  const ringR = prPad(ringOf(padR));
  const H: V = {x: HX, y: hipY(f)};
  const loadedL = ankleForBar(loadedBar(ringL, NEAR_DX), 1);
  const loadedR = ankleForBar(loadedBar(ringR, FAR_DX), 1);

  // ---- left foot: floor -> stirrup at 8-16; in its stirrup from then on, weighted or trailing
  let ankL: V, lIn = true;
  {
    const floor = {x: FLOOR_X.L, y: -SOLE};
    const freeLift = (g: number) => keyN(g, [[C.standR0a, 0], [C.standR0b, 120], [C.lMove0, 170], [C.lPlace, 260], [C.standR1a, 0], [C.standR1b, 120], [C.lMove2a, 170], [C.lPlace2, 260]]);
    if (f < C.lFoot0) {
      ankL = floor;
      lIn = false;
    } else if (f < C.lFoot1) {
      ankL = arc(floor, loadedL, ss(f, C.lFoot0, C.lFoot1), 40);
      lIn = f > C.lFoot1 - 4;
    } else {
      const w = f < C.standR0a ? 1 : f < C.standL1a ? 1 - ss(f, C.standR0a, C.standR0a + 24) : f < C.standR1a ? ss(f, C.standL1a - 8, C.standL1a + 8) : f < C.lIn2a ? 1 - ss(f, C.standR1a, C.standR1a + 40) : ss(f, C.lIn2a, C.lIn2b);
      ankL = lerpV(freeAnkle(H, 'L', ringL, freeLift(f)), loadedL, w);
    }
  }
  // ---- right foot: floor (heel peeling) -> dangling (22-40) -> into its stirrup (40-56) -> weighted or trailing
  let ankR: V, rIn = true;
  {
    const floor = {x: FLOOR_X.R, y: -SOLE};
    if (f < C.rOff0) {
      ankR = add(floor, {x: 0, y: -keyN(f, [[C.lFoot1, 0], [C.rOff0, 4]])});
      rIn = false;
    } else if (f < C.rIn0) {
      ankR = arc(floor, freeAnkle(H, 'R', null, 150), ss(f, C.rOff0, C.rIn0), 30);
      rIn = false;
    } else if (f < C.rIn1) {
      ankR = arc(freeAnkle(H, 'R', null, 150), loadedR, ss(f, C.rIn0, C.rIn1), 40);
      rIn = f > C.rIn1 - 5;
    } else {
      const freeLift = (g: number) => g < C.standR1a ? keyN(g, [[C.standL1a, 0], [C.standL1b, 30], [C.standL1c, 30], [C.standL1d, 120], [C.rMove0, 170], [C.rPlace, 260]]) : keyN(g, [[C.standL2a, 0], [C.standL2b, 30], [C.standL2c, 30], [C.standL2d, 120], [C.rMove3a, 170], [C.rPlace3, 260]]);
      const w = f < C.standL1a ? 1 : f < C.rIn2a ? 1 - ss(f, C.standL1a, C.standL1a + 24) : f < C.standL2a ? ss(f, C.rIn2a, C.rIn2b) : f < C.rIn3a ? 1 - ss(f, C.standL2a, C.standL2a + 20) : ss(f, C.rIn3a, C.rIn3b);
      ankR = lerpV(freeAnkle(H, 'R', ringR, freeLift(f)), loadedR, w);
    }
  }
  const barL = barForAnkle(ankL, 1);
  const barR = barForAnkle(ankR, 1);
  const sagOf = (ring: V, bar: V) => Math.max(0, (STRAP_LEN - len(sub(bar, ring))) * 0.45);
  const sagL = lIn ? sagOf(ringL, barL) : 0;
  const sagR = rIn ? sagOf(ringR, barR) : 0;

  // ---- torso, head, hands
  // while the near pad is carried up past his face he leans back and tips his head back, out of the arm's way
  const carry = Math.max(ss(f, C.lRel, C.lMove0 + 4) * (1 - ss(f, C.lMove1 - 8, C.lPlace)), ss(f, C.lRel2, C.lMove2a + 4) * (1 - ss(f, C.lMove2b - 8, C.lPlace2)));
  const lean = keyN(f, [[0, 8], [C.standL0b, 6], [C.standR0b, 6]]) - 9 * carry;
  let pose: ManPose = Pose({x: H.x, y: H.y, s: 1, torso: lean, chest: 4 - 3 * carry, neck: -4 - 9 * carry, turn: 0.82, pelvis: 0,
    lAx: ankL.x, lAy: ankL.y, lA: 1, rAx: ankR.x, rAy: ankR.y, rA: 1, lAnk: 0, rAnk: 0});
  const uv = handUV(H_BAR, 'grip');
  pose = placeHand(pose, 'L', prPad(gripOf(padL)), 182, uv.u, uv.v);
  pose = placeHand(pose, 'R', prPad(gripOf(padR)), 176, uv.u, uv.v);
  const bump = (a: number, b: number) => ss(f, a, a + 8) * (1 - ss(f, b, b + 10));
  const strain = Math.max(bump(C.lFoot1 - 4, C.standL0b), bump(C.standR0a, C.standR0b), bump(C.standL1a, C.standL1b), bump(C.standL1c, C.standL1d), bump(C.standR1a, C.standR1b), bump(C.standL2a, C.standL2b), bump(C.standL2c, C.standL2d));
  const pleased = Math.max(bump(C.lPlace, C.lPlace + 8), bump(C.lPlace2, C.lPlace2 + 10), bump(C.rPlace3, C.rPlace3 + 14));
  const lookUp = carry;
  const expr0 = mixExpr(mixExpr(EX.focus, EX.strain, strain * 0.8), EX.pleased, pleased * 0.7);
  const expr = {...expr0, gy: expr0.gy - 0.5 * lookUp, gx: expr0.gx + 0.2 * lookUp};
  const legErr = (A: V, side: 'L' | 'R') => len(sub(A, add(H, HIP[side]))) / (226 + 216);
  return {
    f, pose, padL, padR, ringL, ringR,
    footL: {ankle: ankL, bar: lIn ? barL : null, inStirrup: lIn},
    footR: {ankle: ankR, bar: rIn ? barR : null, inStirrup: rIn},
    sagL, sagR, expr,
    lHand: H_BAR, rHand: H_BAR,
    err: {hL: 0, hR: 0, legL: legErr(ankL, 'L'), legR: legErr(ankR, 'R')},
  };
};
export {mixHand, BASE, CM};
