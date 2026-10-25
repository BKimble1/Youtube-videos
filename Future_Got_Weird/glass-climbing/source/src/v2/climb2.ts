// Glass Climbing V2: the climb as one continuous world over the whole film, a pure function of the frame, built so
// that the last frame runs straight into frame 0 (FRAMES is frame 0 again). V1's mechanics (world/climb.ts): a pad per
// hand on the glass, a strap from each pad to a foot stirrup; a loaded pad never moves; a pad is lifted only after its
// strap has gone slack; a carried pad goes where the hand actually is.
//
// Order of events (film frames):
//   0-4      the near (left) pad is pressed onto the glass just above the brick; he is crouched on the step stool, his
//            right foot already in the right stirrup
//   4-16     his left foot steps off the stool into the left stirrup; the strap snaps taut and he drops about 10 cm
//            before the pads hold (4-32: the drop, a small overshoot and settle)
//   80-110   he stands up on the right stirrup (the left strap goes slack)
//   104-134  "and climb it": the left pad peels off, is carried past the right one and seated above it
//   146-182  "like Spider-Man": the left foot comes up in its stirrup and he pulls himself up onto it (most of the way:
//            his right hand must still reach the lower pad)
//   486-535  "can hold your entire weight": he finishes standing on the left pad alone; the right pad is released,
//            carried up and seated
//   692-752  "you shift your weight onto the other pad": he stands up on the right
//   790-866  "The first releases, letting you reach higher and repeat": the left pad peels off, goes up, he follows
//   868-905  "But there's a catch": he sinks back onto the right stirrup and starts down (the left pad comes off)
//   905-971  (off screen, the smooth-glass close-up) he climbs down two moves; at 971 he stands on the right stirrup
//            with his left foot back on the stool
//   960-1030 "So you can climb glass, but switch to rough brick": the left pad comes down off the glass onto the brick
//   1044-1062 he tests it: it seems to hold
//   1106-1126 "...can't make the same contact": he pulls; the pad skids and peels off the brick; he rocks back
//   1136-FRAMES he lifts it back up to the glass and presses it on: frame 0
import {P as Pose, EX} from '../world/pose';
import {manJoints, ManPose} from '../dc/Man';
import {Expr, mixExpr} from '../dc/Head';
import {HandPose, mixHand} from '../dc/Hand';
import {add, clamp, len, lerp, lerpV, mul, norm, sub, V} from '../dc/math';
import {achievedGrip, ankleForBar, barForAnkle, H_BAR, handUV, placeHand, SOLE} from '../world/rig';
import {gripOf, PAD, PadState, prPad, ringOf, STRAP_LEN, Z_FAR, Z_NEAR} from '../world/geo';
import {easeOut, keyN, KeyN, ss} from '../world/climb';
import {BRICK_PAD_Y, FRAMES, STOOL} from './set';

export {keyN, ss, easeOut};
export const lin = (f: number, a: number, b: number) => clamp((f - a) / (b - a));

// ------------------------------------------------------------------ the pads' heights (pad centres)
// As V1: the far (right) pad steps up 160 above the near one, the near pad 380 above the far one (the near arm must
// never seat its pad at face height). V2 starts 230 higher: the climb begins from the stool above the brick.
const UP_R = 160, UP_L = 380;
const Y0 = -1010;
export const Y = {L0: Y0, R0: Y0 - UP_R, L1: Y0 - UP_R - UP_L, R1: Y0 - 2 * UP_R - UP_L, L2: Y0 - 2 * UP_R - 2 * UP_L};

export const C = {
  contact: 4, lStep0: 4, lStep1: 16,
  standR0a: 80, standR0b: 110,
  lRel: 104, lMove0: 110, lMove1: 128, lPlace: 134,
  standL1a: 146, standL1b: 182, standL1c: 486, standL1d: 512,
  rRel: 488, rMove0: 494, rMove1: 512, rPlace: 518, rIn2a: 516, rIn2b: 535,
  standR1a: 692, standR1b: 752,
  lRel2: 790, lMove2a: 798, lMove2b: 818, lPlace2: 826, lIn2a: 826, lIn2b: 845, standL2a: 845, standL2b: 866,
  // the catch: down again
  sink: 868, sink1: 884, lRel3: 886, lMove3a: 892, lMove3b: 918, lPlace3: 924,
  rRel4: 936, rMove4a: 940, rMove4b: 954, rPlace4: 958,
  lRel5: 962, lMove5a: 966, lMove5b: 1008, lPress0: 1020, lPress1: 1028,
  test0: 1044, test1: 1062,
  pull0: 1106, fail: 1116, failEnd: 1126, lift0: 1136, lift1: 1154,
};

type Move = {rel: number; m0: number; m1: number; place: number; from: number; to: number};
const MOVES: Record<'L' | 'R', Move[]> = {
  L: [
    {rel: C.lRel, m0: C.lMove0, m1: C.lMove1, place: C.lPlace, from: Y.L0, to: Y.L1},
    {rel: C.lRel2, m0: C.lMove2a, m1: C.lMove2b, place: C.lPlace2, from: Y.L1, to: Y.L2},
    {rel: C.lRel3, m0: C.lMove3a, m1: C.lMove3b, place: C.lPlace3, from: Y.L2, to: Y.L1},
  ],
  R: [
    {rel: C.rRel, m0: C.rMove0, m1: C.rMove1, place: C.rPlace, from: Y.R0, to: Y.R1},
    {rel: C.rRel4, m0: C.rMove4a, m1: C.rMove4b, place: C.rPlace4, from: Y.R1, to: Y.R0},
  ],
};
const LOAD: Record<'L' | 'R', KeyN> = {
  L: [[0, 0], [C.contact, 0.08], [C.lStep0 + 4, 0.4], [C.lStep1, 1], [C.standR0a, 1], [C.standR0b - 8, 0], [C.lPlace + 4, 0], [C.lPlace + 8, 0.2], [C.standL1a, 0.25], [C.standL1b - 4, 0.8], [C.standL1c, 0.8], [C.standL1c + 8, 1], [C.standR1a, 1], [C.standR1b - 4, 0], [C.lPlace2 + 4, 0], [C.lPlace2 + 10, 0.2], [C.standL2a, 0.3], [C.standL2b, 0.6], [C.sink, 0.6], [C.sink1 - 4, 0],
    [C.lPlace3 + 2, 0], [C.lPlace3 + 8, 1], [C.rPlace4 + 2, 1], [C.lRel5 - 4, 0], [C.test0, 0], [C.test1, 0.35], [C.pull0, 0.35], [C.fail, 0.85], [C.fail + 3, 0], [FRAMES, 0]],
  R: [[0, 0.15], [C.lStep1, 0.25], [C.standR0a, 0.3], [C.standR0b - 6, 1], [C.standL1a, 1], [C.standL1b - 6, 0.35], [C.standL1c - 6, 0.3], [C.rRel - 2, 0], [C.rPlace + 4, 0], [C.rPlace + 10, 0.2],
    [C.rIn2b, 0.35], [C.standR1a, 0.35], [C.standR1b - 8, 1], [C.standL2a, 1], [C.standL2b, 0.6], [C.sink1, 1], [C.lPlace3 + 8, 1], [C.rRel4 - 4, 0], [C.rPlace4 + 2, 0], [C.rPlace4 + 8, 1],
    [C.lMove5b, 1], [C.lPress1, 0.55], [C.test1, 0.45], [C.lift1, 0.2], [FRAMES, 0.15]],
};

const PEEL_GAP = (deg: number) => PAD.h * Math.sin((Math.abs(deg) * Math.PI) / 180);

const padTrack = (f: number, side: 'L' | 'R'): PadState => {
  const z = side === 'L' ? Z_NEAR : Z_FAR;
  let y = side === 'L' ? Y.L0 : Y.R0, gap = 0, tilt = 0;
  // frame 0: the near pad finishing its press onto the glass (continued from the film's last frames)
  if (side === 'L') {
    gap = keyN(f, [[0, 4], [2, 1, lin], [5, 0, easeOut]]);
    y = keyN(f, [[0, Y.L0 - 2], [5, Y.L0]]);
  }
  for (const m of MOVES[side]) {
    if (f < m.rel) break;
    // release: the unloaded pad peels from its lower edge, is carried along the glass just off it, and is seated
    // by sliding it down the last few units (the shear that engages the wedges)
    tilt = keyN(f, [[m.rel, 0], [m.m0, 9], [m.m1 - 4, 5], [m.place - 2, 0]]);
    gap = keyN(f, [[m.rel, 0], [m.rel + 5, 1.2], [m.m0, 14], [(m.m0 + m.m1) / 2, 46], [m.m1, 12], [m.place, 0, easeOut]]);
    y = keyN(f, [[m.m0, m.from], [m.m1, m.to - 6], [m.place, m.to]]);
  }
  if (side === 'L' && f >= C.lRel5) {
    // down off the glass to the brick, pressed on, tested
    tilt = keyN(f, [[C.lRel5, 0], [C.lMove5a, 9], [C.lMove5b - 4, 4], [C.lPress0, 2], [C.lPress1, 0]]);
    gap = keyN(f, [[C.lRel5, 0], [C.lRel5 + 4, 1.2], [C.lMove5a, 14], [(C.lMove5a + C.lMove5b) / 2, 52], [C.lMove5b, 18], [C.lPress0, 10], [C.lPress1, 0, easeOut]]);
    y = keyN(f, [[C.lMove5a, Y.L1], [C.lMove5b, BRICK_PAD_Y - 10], [C.lPress1, BRICK_PAD_Y]]);
    if (f >= C.pull0) {
      // the pull: the plate creeps down as the few contacts skid, then the top edge peels away and it comes off
      const creep = keyN(f, [[C.pull0, 0], [C.fail, 5], [C.fail + 8, 26, easeOut]]);
      const tf = keyN(f, [[C.fail, 0], [C.fail + 5, -11], [C.failEnd + 4, -4], [C.lift0 + 4, 4], [C.lift1 - 4, 1], [C.lift1 + 2, 0]]);
      // with the top edge tipped out (tilt < 0) the bottom edge stays on the brick: the whole plate stands off by the
      // peel's own geometry, plus the pull away
      const g = keyN(f, [[C.fail - 2, 0], [C.fail + 5, 4], [C.failEnd, 26], [C.lift0 + 6, 40], [C.lift1 - 2, 18], [FRAMES - 6, 16], [FRAMES, 4, lin]]);
      tilt = tf;
      gap = g + (tf < 0 ? PEEL_GAP(tf) : 0);
      y = f < C.lift0 ? BRICK_PAD_Y + creep : keyN(f, [[C.lift0, BRICK_PAD_Y + 26], [C.lift1, Y.L0 - 8], [FRAMES, Y.L0 - 2]]);
    }
  }
  return {y, z, gap, tilt, load: keyN(f, LOAD[side])};
};

// ------------------------------------------------------------------ the body
export const HX = 355; // pelvis distance from the glass
const NEAR_DX = 150; // loaded stirrup bar's horizontal offset from its ring (near foot)
const FAR_DX = 120;
const LEGF = 226 + 216;
const LEG = LEGF * 0.95; // a standing leg, knee just off straight
export const HIP = {L: {x: 34, y: 44}, R: {x: -40, y: 42}};
const loadedBar = (ring: V, dx: number): V => ({x: ring.x + dx, y: ring.y + Math.sqrt(STRAP_LEN * STRAP_LEN - dx * dx)});
const ringAt = (padY: number, z: number): V => prPad(ringOf({y: padY, z, gap: 0, tilt: 0, load: 1}));
const ankleLoaded = (padY: number, side: 'L' | 'R') => ankleForBar(loadedBar(ringAt(padY, side === 'L' ? Z_NEAR : Z_FAR), side === 'L' ? NEAR_DX : FAR_DX), 1);
/** pelvis height with the leg of `side` at `frac` of its full length, reaching ankle A */
const hipFor = (A: V, side: 'L' | 'R', frac: number, hx = HX) => A.y - Math.sqrt((LEGF * frac) ** 2 - (hx + HIP[side].x - A.x) ** 2) - HIP[side].y;
const standY = (padY: number, side: 'L' | 'R') => hipFor(ankleLoaded(padY, side), side, side === 'R' ? 0.95 * 0.955 : 0.95);
/** the left foot on the stool (no stirrup): the sole on the stool top */
export const STOOL_ANKLE: V = {x: 300, y: STOOL.top - SOLE};
const H_ST = hipFor(STOOL_ANKLE, 'L', 0.84); // crouched on the stool (frame 0)
const H_HANG = hipFor(ankleLoaded(Y.L0, 'L'), 'L', 0.9); // just stepped off: in the left stirrup, knee a little bent
const H_LOW = hipFor(STOOL_ANKLE, 'L', 0.9); // standing at the stool with the right foot loaded in its stirrup
const H_BRICK = H_LOW + 120; // crouched at the stool, reaching the pad on the brick
const sR0 = standY(Y.R0, 'R'), sL1 = standY(Y.L1, 'L'), sR1 = standY(Y.R1, 'R'), sL2 = standY(Y.L2, 'L');
export const HIPS = {H_ST, H_HANG, H_LOW, sR0, sL1, sR1, sL2};

const HIP_KEYS: KeyN = [
  [0, H_ST], [C.lStep0, H_ST - 5], [13, H_HANG + 16], [19, H_HANG - 5], [26, H_HANG + 2], [32, H_HANG],
  [C.standR0a, H_HANG], [C.standR0b, sR0],
  [C.standL1a, sR0], [C.standL1b, lerp(sR0, sL1, 0.6)], [C.standL1c, lerp(sR0, sL1, 0.6)], [C.standL1d, sL1],
  [C.standR1a, sL1], [C.standR1b, sR1],
  [C.standL2a, sR1], [C.standL2b, lerp(sR1, sL2, 0.18)], [C.sink, lerp(sR1, sL2, 0.18)], [C.sink1, sR1],
  // off screen: down onto the left pad, then onto the right one with the left foot to the stool
  [C.lPlace3 + 2, sR1], [C.lPlace3 + 12, sL1], [C.rPlace4, sL1], [C.lRel5, H_LOW],
  // down to the brick he crouches deep (the pad on the brick is at knee height from the stool)
  [C.lMove5b, H_LOW + 70], [C.lPress0, H_BRICK], [C.test0, H_BRICK], [C.test1, H_BRICK + 10], [C.pull0, H_BRICK + 10], [C.fail, H_BRICK + 18], [C.fail + 5, H_BRICK + 30], [C.failEnd + 4, H_BRICK - 4],
  [C.lift0 + 6, H_ST + 4], [C.lift1, H_ST], [FRAMES, H_ST],
];
export const hipY = (f: number) => keyN(f, HIP_KEYS);

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
  hairSway: number;
  blink: number;
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
const arc = (a: V, b: V, u: number, h = 60): V => add(lerpV(a, b, u), {x: 0, y: -h * Math.sin(Math.PI * u)});

// how much each foot stands in its stirrup (1) or hangs in it (0), and how high a hanging knee is lifted
const W_L: KeyN = [[C.lStep1, 1], [C.standR0a, 1], [C.standR0b - 6, 0], [C.lPlace + 4, 0], [C.standL1a - 8, 0], [C.standL1a + 8, 1], [C.standR1a, 1], [C.standR1a + 40, 0], [C.lIn2a, 0], [C.lIn2b, 1],
  [C.sink, 1], [C.sink1, 0], [C.lPlace3, 0], [C.lPlace3 + 10, 1], [C.rPlace4, 1], [C.rPlace4 + 4, 0]];
const LIFT_L: KeyN = [[C.standR0a, 0], [C.standR0b, 120], [C.lMove0, 170], [C.lPlace, 260], [C.standL1a + 4, 60], [C.standR1a, 0], [C.standR1b, 120], [C.lMove2a, 170], [C.lPlace2, 260], [C.lIn2b, 60],
  [C.sink, 30], [C.sink1, 120], [C.lMove3a, 160], [C.lPlace3, 60], [C.rPlace4, 40]];
const W_R: KeyN = [[0, 0], [24, 0], [56, 0.6], [C.standR0a, 1], [C.standL1a, 1], [C.standL1a + 24, 0], [C.rIn2a, 0], [C.rIn2b, 1], [C.standL2a, 1], [C.standL2b, 0.6], [C.sink1, 1],
  [C.lPlace3 + 10, 1], [C.lPlace3 + 12, 0], [C.rPlace4, 0], [C.rPlace4 + 6, 1], [C.lMove5b, 1], [C.lPress1, 0.7], [C.test1, 0.6], [C.lift0, 0.4], [C.lift1 + 2, 0], [FRAMES, 0]];
const LIFT_R: KeyN = [[0, 0], [C.standL1a, 0], [C.standL1b, 30], [C.standL1c, 30], [C.rRel, 120], [C.rMove0, 170], [C.rPlace, 260], [C.rIn2b, 80], [C.standR1a, 0], [C.standL2b, 30], [C.sink1, 0],
  [C.rRel4, 120], [C.rMove4a, 170], [C.rPlace4, 60], [C.lRel5, 0]];

export const climbAt = (f: number): ClimbState => {
  const s0 = climbRaw(f);
  // a pad that is off its surface is in his hand: it goes where the hand actually is
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

const bump = (f: number, a: number, b: number, ra = 8, rb = 10) => ss(f, a, a + ra) * (1 - ss(f, b, b + rb));

const climbRaw = (f: number, padLIn?: PadState, padRIn?: PadState): ClimbState => {
  const padL = padLIn ?? padTrack(f, 'L');
  const padR = padRIn ?? padTrack(f, 'R');
  const ringL = prPad(ringOf(padL));
  const ringR = prPad(ringOf(padR));
  // the body sits a little closer to the wall when he reaches high from the stool
  const hx = HX - 40 * bump(f, C.lPlace3 + 20, C.lMove5a + 10, 20, 20) - 55 * bump(f, C.lPlace - 10, C.rPlace, 20, 20) - 55 * bump(f, C.lPlace2 - 10, C.rRel4, 20, 20);
  const H: V = {x: hx, y: hipY(f)};
  const loadedL = ankleForBar(loadedBar(ringL, NEAR_DX), 1);
  const loadedR = ankleForBar(loadedBar(ringR, FAR_DX), 1);

  // ---- left foot: on the stool -> its stirrup (4-16) -> in the stirrup -> (off screen) back to the stool
  let ankL: V, lIn = true;
  if (f < C.lStep0) {
    ankL = STOOL_ANKLE;
    lIn = false;
  } else if (f < C.lStep1) {
    ankL = arc(STOOL_ANKLE, loadedL, ss(f, C.lStep0, C.lStep1), 22);
    lIn = f > C.lStep1 - 5;
  } else {
    const inSt = lerpV(freeAnkle(H, 'L', ringL, keyN(f, LIFT_L)), loadedL, keyN(f, W_L));
    const back = ss(f, C.rPlace4 + 2, C.lRel5 + 2); // off screen: out of the stirrup, onto the stool
    ankL = back > 0 ? lerpV(inSt, STOOL_ANKLE, back) : inSt;
    lIn = back < 0.5;
  }
  // ---- right foot: in its stirrup throughout, standing or hanging
  const ankR = lerpV(freeAnkle(H, 'R', ringR, keyN(f, LIFT_R)), loadedR, keyN(f, W_R));
  const barL = barForAnkle(ankL, 1);
  const barR = barForAnkle(ankR, 1);
  const sagOf = (ring: V, bar: V) => Math.max(0, (STRAP_LEN - len(sub(bar, ring))) * 0.45);
  const sagL = lIn ? sagOf(ringL, barL) : 0;
  const sagR = sagOf(ringR, barR);

  // ---- torso, head, hands
  // while the near pad passes his face he leans back and tips his head back, out of the arm's way
  const carry0 = Math.max(ss(f, C.lRel, C.lMove0 + 4) * (1 - ss(f, C.lMove1 - 8, C.lPlace)), ss(f, C.lRel2, C.lMove2a + 4) * (1 - ss(f, C.lMove2b - 8, C.lPlace2)),
    ss(f, C.lMove5a, C.lMove5a + 10) * (1 - ss(f, C.lMove5a + 22, C.lMove5b)));
  // while his face passes the near pad's height (standing up past it), the same: the arm never covers his face
  const faceY = manJoints(Pose({x: H.x, y: H.y, s: 1, torso: 6, chest: 4, neck: -4, turn: 0.82})).head.y;
  const dFace = faceY - padL.y; // > 0: the near pad is above his face
  const pass = (dFace > 0 ? 1 - clamp((dFace - 260) / 160) : 1 - clamp(-dFace / 210)) * (padL.gap < 1 ? 1 : 0);
  const lookDown = bump(f, C.sink - 2, 898, 10, 10); // "But there's a catch": a look down at the brick below
  const recoil = keyN(f, [[C.fail, 0], [C.fail + 4, 1], [C.failEnd + 2, 0.35], [C.lift0 + 4, 0]]);
  const carry = Math.max(carry0, pass);
  const lean = keyN(f, [[0, 11], [C.lStep1, 8], [32, 6], [C.standR0b, 6], [C.sink, 6], [C.lRel5, 12], [C.lMove5b, 18], [C.lPress0, 26], [C.test1, 27], [C.fail, 28], [C.failEnd + 6, 20], [C.lift1, 11], [FRAMES, 11]]) - 9 * carry0 - 5 * pass - 10 * recoil;
  // small shoulder settle under the drop (frame 13-24) and on each stand-up
  const settle = Math.sin(clamp((f - 12) / 14) * Math.PI) * (1 - clamp((f - 26) / 6));
  let pose: ManPose = Pose({x: H.x, y: H.y, s: 1, torso: lean, chest: 4 - 3 * carry + 3 * settle - 2 * recoil, neck: -4 - 9 * carry0 - 26 * pass + 14 * lookDown + 4 * recoil, turn: 0.82 - 0.22 * Math.max(carry0, pass), pelvis: 0,
    lAx: ankL.x, lAy: ankL.y, lA: 1, rAx: ankR.x, rAy: ankR.y, rA: 1, lAnk: 0, rAnk: 0, breath: 0.3 + 0.3 * Math.sin(f / 9)});
  const uv = handUV(H_BAR, 'grip');
  pose = placeHand(pose, 'L', prPad(gripOf(padL)), 182, uv.u, uv.v);
  pose = placeHand(pose, 'R', prPad(gripOf(padR)), 176, uv.u, uv.v);
  const strain = Math.max(bump(f, C.lStep1 - 6, 24), bump(f, C.standR0a, C.standR0b), bump(f, C.standL1a, C.standL1b), bump(f, C.standL1c, C.standL1d), bump(f, C.standR1a, C.standR1b),
    bump(f, C.standL2a, C.standL2b), bump(f, C.test0, C.test1), bump(f, C.pull0, C.fail));
  const pleased = Math.max(bump(f, C.lPlace, C.lPlace + 8), bump(f, C.lPlace2, C.lPlace2 + 10), bump(f, C.rPlace + 2, C.rPlace + 12), bump(f, C.lPress1, C.test0 - 6));
  const doubt = bump(f, C.fail + 2, C.lift0 + 8, 4, 12);
  const expr0 = mixExpr(mixExpr(mixExpr(EX.focus, EX.strain, strain * 0.8), EX.pleased, pleased * 0.7), EX.doubt, doubt);
  const expr = {...expr0, gy: expr0.gy - 0.5 * carry + 1.0 * lookDown, gx: expr0.gx + 0.2 * carry};
  // a firmer grip on a loaded bar (fingers and thumb close a little more)
  const tight = (load: number): HandPose => mixHand(H_BAR, {curl: [0.8, 0.86, 0.9, 0.93], spread: 0.04, thumb: 30, thumbCurl: 0.68}, clamp(load));
  // hair follows through when the body drops or rises (it lags the head)
  const v = (g: number) => hipY(g) - hipY(g - 1);
  const hairSway = clamp((v(f - 2) - v(f - 6)) * 1.4, -9, 9) + 4 * recoil;
  const blink = Math.max(...[58, 252, 610, 707, 1001, 1092].map((b) => Math.max(0, 1 - Math.abs(f - b) / 2.2)));
  const legErr = (A: V, side: 'L' | 'R') => len(sub(A, add(H, HIP[side]))) / LEGF;
  return {
    f, pose, padL, padR, ringL, ringR,
    footL: {ankle: ankL, bar: lIn ? barL : null, inStirrup: lIn},
    footR: {ankle: ankR, bar: barR, inStirrup: true},
    sagL, sagR, expr,
    lHand: tight(padL.load), rHand: tight(padR.load),
    hairSway, blink,
    err: {hL: 0, hR: 0, legL: legErr(ankL, 'L'), legR: legErr(ankR, 'R')},
  };
};
