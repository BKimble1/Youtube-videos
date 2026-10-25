// Glass Climbing V3: the climb as one continuous world over the whole film, a pure function of the frame. FRAMES is
// frame 0 again (the film loops on the same press of the near pad onto the glass).
//
// V3 rig rules (the V2 review showed the near arm crossing his face and the legs crossing):
//   - match-style climbing: the FAR (right) hand always takes the upper pad. Its arm reaches up behind the head (the
//     far side), and the NEAR (left) pad stays between his chest and his waist, so the near arm never passes in front
//     of the face. A cycle: stand in the far stirrup; move the near pad up to just below the far one; sink onto the
//     near stirrup; move the far pad up; pull up into the far stirrup;
//   - the near foot stays behind (screen-right of) the far foot, as the near hip is behind the far hip in this 3/4 view,
//     so the legs never form an X; a free foot hangs under its hip with gravity, not in a running pose;
//   - a loaded pad never moves; a pad is lifted only after it is unloaded; a carried pad goes where the hand is.
//
// On screen: 0-184 (stool, stirrups, the first move and pull-up), 470-535 (the near pad's move), 680-905 (a full
// weight shift, far pad move and pull-up, the height reveal), 950-FRAMES (back at the stool: the brick test, the loop).
// Off screen (the micro views, the springs) he keeps climbing at the same rhythm; off screen 906-950 he climbs down.
import {EX, P as Pose} from '../world/pose';
import {DIM, ManPose, manJoints} from '../dc/Man';
import {Expr, mixExpr} from '../dc/Head';
import {HandPose, mixHand} from '../dc/Hand';
import {add, clamp, len, lerpV, mul, norm, sub, V} from '../dc/math';
import {achievedGrip, ankleForBar, barForAnkle, H_BAR, handUV, placeHand, SOLE} from '../world/rig';
import {gripOf, PAD, PadState, prPad, ringOf, Z_FAR, Z_NEAR} from '../world/geo';
import {easeOut, keyN, KeyN, ss} from '../world/climb';
import {BRICK_PAD_Y, FRAMES, STOOL, STRAP3} from './set3';

export {keyN, ss, easeOut};
export const lin = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const bump = (f: number, a: number, b: number, ra = 8, rb = 10) => ss(f, a, a + ra) * (1 - ss(f, b, b + rb));

// ------------------------------------------------------------------ the pads' heights (pad centres)
/** the far pad sits G above the near one; each cycle takes both S higher */
export const G = 80, S = 160;
export const Y0 = -1130;
export const LY = (k: number) => Y0 - k * S;
export const RY = (k: number) => Y0 - G - k * S;

/** the cycle events: a pad move (R/L: release, carry, seat), a pull-up into the far stirrup, a sink onto the near one */
type Ev = {t: number; type: 'R' | 'L' | 'up' | 'sink'; k: number; len: number};
export const EVENTS: Ev[] = [
  {t: 122, type: 'R', k: 1, len: 30}, {t: 154, type: 'up', k: 1, len: 30}, // "and climb it like Spider-Man" (on screen)
  {t: 226, type: 'L', k: 1, len: 24}, {t: 252, type: 'sink', k: 1, len: 20}, {t: 274, type: 'R', k: 2, len: 26}, {t: 302, type: 'up', k: 2, len: 26},
  {t: 330, type: 'L', k: 2, len: 24}, {t: 356, type: 'sink', k: 2, len: 20}, {t: 378, type: 'R', k: 3, len: 26}, {t: 406, type: 'up', k: 3, len: 28},
  {t: 488, type: 'L', k: 3, len: 30}, // "can hold your entire weight" (on screen)
  {t: 548, type: 'sink', k: 3, len: 20}, {t: 570, type: 'R', k: 4, len: 26}, {t: 598, type: 'up', k: 4, len: 28}, {t: 630, type: 'L', k: 4, len: 24},
  {t: 684, type: 'sink', k: 4, len: 56}, // "Then, you shift your weight onto the other pad" (on screen)
  {t: 772, type: 'R', k: 5, len: 58}, // "The first releases, letting you reach higher" (on screen)
  {t: 836, type: 'up', k: 5, len: 32}, // "and repeat" (on screen)
  {t: 872, type: 'L', k: 5, len: 28}, // the height reveal: the near pad comes up beneath the far one (on screen)
];
export const C = {
  contact: 5, pull0: 36, pull1: 62,
  rStep0: 72, rStep1: 84, lStep0: 82, lStep1: 94,
  rRel: 122, rPlace: 152, upA: 154, upB: 184, lRel: 488, lPlace: 518,
  sinkA: 684, sinkB: 740, rRel2: 772, rPlace2: 830, up2A: 836, up2B: 868,
  look0: 870, look1: 900, down0: 906, down1: 950,
  lRel3: 980, lMove3a: 984, lMove3b: 1010, lPress0: 1018, lPress1: 1028,
  test0: 1040, test1: 1060,
  yank0: 1106, fail: 1116, failEnd: 1126, lift0: 1134, lift1: 1154,
};

const PEEL_GAP = (deg: number) => PAD.h * Math.sin((Math.abs(deg) * Math.PI) / 180);
/** the move (or none) that a pad is in at frame f */
const moveAt = (f: number, side: 'L' | 'R') => EVENTS.filter((e) => e.type === side && f >= e.t - 1).pop();

const padTrack = (f: number, side: 'L' | 'R'): PadState => {
  const z = side === 'L' ? Z_NEAR : Z_FAR;
  let y = side === 'L' ? LY(0) : RY(0), gap = 0, tilt = 0;
  if (side === 'L') {
    // frame 0: the near pad finishing its press onto the glass (continued from the film's last frames)
    gap = keyN(f, [[0, 4], [2, 1.2, lin], [C.contact, 0, easeOut]]);
    y = keyN(f, [[0, LY(0) - 2], [C.contact, LY(0)]]);
  }
  const m = f < C.down0 ? moveAt(f, side) : undefined;
  if (m) {
    const to = side === 'L' ? LY(m.k) : RY(m.k), from = side === 'L' ? LY(m.k - 1) : RY(m.k - 1);
    const rel = m.t, m0 = m.t + Math.round(m.len * 0.14), m1 = m.t + Math.round(m.len * 0.8), place = m.t + m.len;
    // the unloaded pad peels from its lower edge, is carried up along the glass just off it, and is seated by sliding
    // it down the last few units (the shear that engages the wedges)
    tilt = keyN(f, [[rel, 0], [m0, 9], [m1 - 3, 5], [place - 2, 0]]);
    gap = keyN(f, [[rel, 0], [rel + 4, 1.2], [m0, 12], [(m0 + m1) / 2, 34], [m1, 10], [place, 0, easeOut]]);
    y = keyN(f, [[m0, from], [m1, to - 6], [place, to]]);
  }
  if (f >= C.down0) {
    // off screen: back down to the start
    y = side === 'L' ? keyN(f, [[C.down0, LY(5)], [C.down1, LY(0)]]) : keyN(f, [[C.down0, RY(5)], [C.down1, RY(0)]]);
  }
  if (side === 'L' && f >= C.lRel3) {
    // down off the glass to the brick, pressed on, tested
    tilt = keyN(f, [[C.lRel3, 0], [C.lMove3a, 9], [C.lMove3b - 4, 4], [C.lPress0, 2], [C.lPress1, 0]]);
    gap = keyN(f, [[C.lRel3, 0], [C.lRel3 + 4, 1.2], [C.lMove3a, 14], [(C.lMove3a + C.lMove3b) / 2, 46], [C.lMove3b, 18], [C.lPress0, 8], [C.lPress1, 0, easeOut]]);
    y = keyN(f, [[C.lMove3a, LY(0)], [C.lMove3b, BRICK_PAD_Y - 10], [C.lPress1, BRICK_PAD_Y]]);
    if (f >= C.yank0) {
      // the yank: the plate creeps down as the few contacts skid, the top edge tips out and it tears off
      const creep = keyN(f, [[C.yank0, 0], [C.fail, 6], [C.fail + 8, 28, easeOut]]);
      const tf = keyN(f, [[C.fail, 0], [C.fail + 5, -12], [C.failEnd + 4, -5], [C.lift0 + 4, 4], [C.lift1 - 4, 1], [C.lift1 + 2, 0]]);
      const g = keyN(f, [[C.fail - 2, 0], [C.fail + 5, 4], [C.failEnd, 28], [C.lift0 + 6, 40], [C.lift1 - 2, 18], [FRAMES - 6, 14], [FRAMES, 4, lin]]);
      tilt = tf;
      gap = g + (tf < 0 ? PEEL_GAP(tf) : 0);
      y = f < C.lift0 ? BRICK_PAD_Y + creep : keyN(f, [[C.lift0, BRICK_PAD_Y + 28], [C.lift1, LY(0) - 8], [FRAMES, LY(0) - 2]]);
    }
  }
  return {y, z, gap, tilt, load: 0};
};

// ------------------------------------------------------------------ the body
export const HX = 345; // pelvis distance from the glass
const NEAR_DX = 200; // loaded stirrup bar's horizontal offset from its ring: the near foot sits behind the far foot
const FAR_DX = 120;
const LEGF = 226 + 216;
export const HIP = {L: {x: 34, y: 44}, R: {x: -40, y: 42}};
const loadedBar = (ring: V, dx: number): V => ({x: ring.x + dx, y: ring.y + Math.sqrt(STRAP3 * STRAP3 - dx * dx)});
const ringAt = (padY: number, z: number): V => prPad(ringOf({y: padY, z, gap: 0, tilt: 0, load: 1}));
const ankleLoaded = (padY: number, side: 'L' | 'R') => ankleForBar(loadedBar(ringAt(padY, side === 'L' ? Z_NEAR : Z_FAR), side === 'L' ? NEAR_DX : FAR_DX), 1);
const hipFor = (A: V, side: 'L' | 'R', frac: number, hx = HX) => A.y - Math.sqrt(Math.max(0, (LEGF * frac) ** 2 - (hx + HIP[side].x - A.x) ** 2)) - HIP[side].y;
/** pelvis height standing in the far stirrup (k) or sunk onto the near one (k) */
const upY = (k: number) => hipFor(ankleLoaded(RY(k), 'R'), 'R', 0.92);
const sinkY = (k: number) => hipFor(ankleLoaded(LY(k), 'L'), 'L', 0.93);
/** both feet on the stool (the near foot behind the far one), toes toward the wall */
export const STOOL_L: V = {x: 372, y: STOOL.top - SOLE};
export const STOOL_R: V = {x: 304, y: STOOL.top - SOLE};
const H_ST = hipFor(STOOL_L, 'L', 0.93);
const H_BR = hipFor(STOOL_L, 'L', 0.8); // crouched on the stool, working the pad on the brick
export const HIPS = {H_ST, H_BR, sink0: sinkY(0)};

const HIP_KEYS: KeyN = (() => {
  const k: KeyN = [
    [0, H_ST], [C.pull0, H_ST], [C.pull1, H_ST + 10], [C.rStep0, H_ST + 10],
    // the feet go up into the stirrups (he rises a little onto them), the straps take him: drop, overshoot, settle
    [C.lStep1, sinkY(0) - 8], [100, sinkY(0) + 24], [107, sinkY(0) - 8], [113, sinkY(0) + 3], [118, sinkY(0)],
  ];
  let last = 118;
  for (const e of EVENTS) {
    if (e.type === 'up' || e.type === 'sink') {
      const y = e.type === 'up' ? upY(e.k) : sinkY(e.k);
      k.push([Math.max(last, e.t), keyN(e.t, k.slice())]);
      k.push([e.t + e.len, y]);
      last = e.t + e.len;
    }
  }
  k.push([C.look0, upY(5)], [C.look1, upY(5) + 8], [C.down0, upY(5) + 8], [C.down1, H_ST]);
  k.push([C.lRel3, H_ST], [C.lMove3b, H_BR + 10], [C.lPress1, H_BR], [C.test0, H_BR], [C.test1, H_BR + 16], [C.yank0, H_BR + 16], [C.fail, H_BR + 24], [C.fail + 5, H_BR + 38], [C.failEnd + 4, H_BR + 2]);
  k.push([C.lift0 + 6, H_BR - 20], [C.lift1, H_ST], [FRAMES, H_ST]);
  return k;
})();
export const hipY = (f: number) => keyN(f, HIP_KEYS);

/** stance weights: how much each foot stands in its stirrup (1) or hangs in it (0) */
const W_KEYS = (() => {
  const wl: KeyN = [[C.lStep1, 1]], wr: KeyN = [[C.rStep1, 1]];
  for (const e of EVENTS) {
    if (e.type === 'up') {
      wl.push([e.t + e.len * 0.3, 1], [e.t + e.len - 2, 0]);
      wr.push([e.t, 1]);
    } else if (e.type === 'sink') {
      wl.push([e.t + 4, 0], [e.t + e.len * 0.6, 1]);
      wr.push([e.t, 1], [e.t + e.len, 0.86]);
    } else if (e.type === 'R') {
      wr.push([e.t - 4, 1], [e.t + 2, 0], [e.t + e.len + 2, 0], [e.t + e.len + 6, 1]);
    }
  }
  return {wl, wr};
})();

/** 1: his weight is in the far stirrup, 0: in the near one */
const STANCE: KeyN = (() => {
  const k: KeyN = [[C.lStep1, 0]];
  for (const e of EVENTS) if (e.type === 'up' || e.type === 'sink') k.push([e.t, e.type === 'up' ? 0 : 1], [e.t + e.len * 0.8, e.type === 'up' ? 1 : 0]);
  return k;
})();

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
  err: {legL: number; legR: number};
};

/** a free foot hangs under its hip (the near one a little behind, the far one a little forward, so they never
 *  cross), within its strap's reach of its ring */
const freeAnkle = (H: V, side: 'L' | 'R', ring: V | null): V => {
  const hip = add(H, HIP[side]);
  const hang = add(hip, {x: side === 'L' ? -30 : -110, y: 400});
  if (!ring) return hang;
  const bar = barForAnkle(hang, 1);
  if (len(sub(bar, ring)) <= STRAP3 * 0.985) return hang;
  return ankleForBar(add(ring, mul(norm(sub(bar, ring)), STRAP3 * 0.985)), 1);
};
const arc = (a: V, b: V, u: number, h = 60): V => add(lerpV(a, b, u), {x: 0, y: -h * Math.sin(Math.PI * u)});

export const climbAt = (f: number): ClimbState => {
  const s0 = climbRaw(f);
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
  const wl = f < C.lStep1 ? 0 : keyN(f, W_KEYS.wl), wr = f < C.rStep1 ? 0 : keyN(f, W_KEYS.wr);
  const moving = (side: 'L' | 'R') => {
    const m = f < C.down0 ? moveAt(f, side) : undefined;
    return m && f < m.t + m.len + 2 ? 1 : 0;
  };
  // the pads' loads follow the stance (on the stool, his pull on the bars)
  const stoolLoad = (side: 'L' | 'R') => keyN(f, side === 'L' ? [[0, 0], [C.contact, 0.15], [C.pull0, 0.15], [C.pull1, 0.6], [C.rStep0, 0.6], [C.lStep1, 1]] : [[0, 0.3], [C.pull0, 0.3], [C.pull1, 0.6], [C.rStep1, 0.6]]);
  const brickLoad = keyN(f, [[C.lRel3 - 4, 0], [C.lPress1, 0.1], [C.test0, 0.1], [C.test1, 0.45], [C.yank0, 0.45], [C.fail, 0.9], [C.fail + 3, 0], [FRAMES, 0]]);
  const loadOf = (side: 'L' | 'R') => {
    if (f < C.lStep1) return stoolLoad(side);
    if (f >= C.down1) return side === 'L' ? (f >= C.lRel3 - 4 ? brickLoad : 0.3) : 0.3;
    if (f >= C.down0) return 0.3;
    if (moving(side)) return 0;
    // which stirrup carries him: the far one after a pull-up, the near one after a sink (on the stirrups at first)
    const onR = keyN(f, STANCE);
    return clamp(0.15 + 0.85 * (side === 'L' ? 1 - onR : onR));
  };
  const padL = {...(padLIn ?? padTrack(f, 'L')), load: loadOf('L')};
  const padR = {...(padRIn ?? padTrack(f, 'R')), load: loadOf('R')};
  const ringL = prPad(ringOf(padL));
  const ringR = prPad(ringOf(padR));
  // he leans in toward the wall when he pulls up (the near hand still on the lower pad)
  // ... and stays leaned in while standing high, until the near pad has come up beneath the far one
  const upping = Math.max(...EVENTS.filter((e) => e.type === 'up').map((e) => {
    const nl = EVENTS.find((x) => x.type === 'L' && x.t > e.t);
    return ss(f, e.t, e.t + 10) * (1 - ss(f, nl ? nl.t + nl.len : C.down0 + 10, (nl ? nl.t + nl.len : C.down0 + 10) + 16));
  }));
  const hx = HX - 20 * upping;
  const H: V = {x: hx, y: hipY(f)};
  const loadedL = ankleForBar(loadedBar(ringL, NEAR_DX), 1);
  const loadedR = ankleForBar(loadedBar(ringR, FAR_DX), 1);
  const down = ss(f, C.down0, C.down1); // off screen: back onto the stool

  // ---- feet: stool -> stirrups (72-94) -> stirrups (standing or hanging) -> (off screen) stool
  let ankL: V, ankR: V, lIn = true, rIn = true;
  if (f < C.rStep0 || f >= C.down1) {
    ankL = STOOL_L;
    ankR = STOOL_R;
    lIn = rIn = false;
  } else {
    const inL = lerpV(freeAnkle(H, 'L', ringL), loadedL, wl);
    const inR = lerpV(freeAnkle(H, 'R', ringR), loadedR, wr);
    ankR = f < C.rStep1 ? arc(STOOL_R, loadedR, ss(f, C.rStep0, C.rStep1), 50) : inR;
    ankL = f < C.lStep0 ? STOOL_L : f < C.lStep1 ? arc(STOOL_L, loadedL, ss(f, C.lStep0, C.lStep1), 50) : inL;
    rIn = f > C.rStep1 - 4;
    lIn = f > C.lStep1 - 4;
    if (down > 0) {
      ankL = lerpV(ankL, STOOL_L, down);
      ankR = lerpV(ankR, STOOL_R, down);
      lIn = rIn = down < 0.5;
    }
  }
  // a leg never stretches: a foot beyond reach of its hip comes up (its stirrup rises with it, the strap slackens)
  const reachOf = (A: V, side: 'L' | 'R') => {
    const hp = add(H, HIP[side]);
    const d = sub(A, hp), l = len(d), mx = LEGF * 0.975;
    return l > mx ? add(hp, mul(d, mx / l)) : A;
  };
  // ... and a foot in its stirrup stays within its strap's length of the ring
  const strapOf = (A: V, ring: V, inSt: boolean) => {
    if (!inSt) return A;
    const b = barForAnkle(A, 1), d = sub(b, ring), l = len(d);
    return l > STRAP3 ? ankleForBar(add(ring, mul(d, STRAP3 / l)), 1) : A;
  };
  ankL = strapOf(reachOf(ankL, 'L'), ringL, lIn);
  ankR = strapOf(reachOf(ankR, 'R'), ringR, rIn);
  const barL = barForAnkle(ankL, 1);
  const barR = barForAnkle(ankR, 1);
  const sagOf = (ring: V, bar: V) => Math.max(0, (STRAP3 - len(sub(bar, ring))) * 0.45);
  const sagL = lIn ? sagOf(ringL, barL) : 0;
  const sagR = rIn ? sagOf(ringR, barR) : 0;

  // ---- torso, head, hands
  const rMoves = EVENTS.filter((e) => e.type === 'R');
  const lookUp = Math.max(...rMoves.map((e) => bump(f, e.t - 4, e.t + e.len + 6, 10, 12))); // he watches the far hand go up
  const lookDown = Math.max(bump(f, C.look0 - 2, 904, 12, 6), bump(f, C.lRel3, C.lift0, 10, 14)); // down at the brick
  const recoil = keyN(f, [[C.fail, 0], [C.fail + 4, 1], [C.failEnd + 2, 0.4], [C.lift0 + 6, 0]]);
  const lean = keyN(f, [[0, 9], [C.rStep0, 9], [C.lStep1, 6], [C.down0, 6], [C.down1, 9], [C.lRel3, 9], [C.lMove3b, 14], [C.lPress0, 16], [C.test1, 17], [C.fail, 18], [C.failEnd + 6, 14], [C.lift1, 9], [FRAMES, 9]]) - 10 * recoil + 16 * upping;
  const settle = Math.sin(clamp((f - 96) / 16) * Math.PI) * (1 - clamp((f - 112) / 6)); // shoulders under the drop
  const pull = Math.max(upping, bump(f, C.pull0, C.pull1, 10, 10));
  let pose: ManPose = Pose({x: H.x, y: H.y, s: 1, torso: lean, chest: 4 + 3 * settle + 4 * pull - 3 * recoil, neck: -4 - 0.8 * (lean - 9) - 0.7 * (3 * settle + 4 * pull) - 8 * lookUp + 14 * lookDown + 5 * recoil, // the head stays near upright as the body leans
    lAx: ankL.x, lAy: ankL.y, lA: 1, rAx: ankR.x, rAy: ankR.y, rA: 1, lAnk: 0, rAnk: 0, lElb: -1, rElb: -1, breath: 0.3 + 0.3 * Math.sin((2 * Math.PI * Math.round(FRAMES / 57) * f) / FRAMES)}); // ~1.9 s breaths, whole cycles over the loop
  // the far hand must stay in view: when the upper pad comes close to his head (pulling up under it), he tips his head
  // back and away from the wall, as much as it needs (continuous in the clearance, so it never snaps)
  const gripR = prPad(gripOf(padR));
  const j0 = manJoints(pose);
  const clear0 = len(sub(gripR, j0.head)) - DIM.headR * j0.s;
  pose = {...pose, neck: pose.neck - Math.min(26, Math.max(0, (75 - clear0) / 1.6))}; // 75: clear of the hair, not just the skull
  const uv = handUV(H_BAR, 'grip');
  pose = placeHand(pose, 'L', prPad(gripOf(padL)), 182, uv.u, uv.v);
  pose = placeHand(pose, 'R', gripR, 176, uv.u, uv.v);
  const strain = Math.max(bump(f, C.pull0, C.pull1, 10, 10), bump(f, C.lStep1 - 4, 106), upping, bump(f, C.sinkA, C.sinkB), bump(f, C.test0, C.test1), bump(f, C.yank0, C.fail));
  const pleased = Math.max(bump(f, C.rPlace, C.rPlace + 8), bump(f, C.upB - 4, C.upB + 14), bump(f, C.rPlace2, C.rPlace2 + 6), bump(f, C.up2B - 4, 900), bump(f, C.lPress1, C.test0 - 6));
  const doubt = bump(f, C.fail + 2, C.lift0 + 6, 5, 12);
  const expr0 = mixExpr(mixExpr(mixExpr(EX.focus, EX.strain, strain * 0.75), EX.pleased, pleased * 0.65), EX.doubt, doubt);
  const expr = {...expr0, gy: expr0.gy - 0.55 * lookUp + 1.0 * lookDown, gx: expr0.gx + 0.15 * lookUp};
  const tight = (load: number): HandPose => mixHand(H_BAR, {curl: [0.8, 0.86, 0.9, 0.93], spread: 0.04, thumb: 30, thumbCurl: 0.68}, clamp(load));
  // hair follows through when the body drops or rises (it lags the head)
  const v = (g: number) => hipY(g) - hipY(g - 1);
  const hairSway = clamp((v(f - 2) - v(f - 6)) * 1.3, -8, 8) + 4 * recoil;
  const blink = Math.max(...[22, 236, 608, 707, 960, 1090].map((b) => Math.max(0, 1 - Math.abs(f - b) / 2.2)));
  const legErr = (A: V, side: 'L' | 'R') => len(sub(A, add(H, HIP[side]))) / LEGF;
  return {
    f, pose, padL, padR, ringL, ringR,
    footL: {ankle: ankL, bar: lIn ? barL : null, inStirrup: lIn},
    footR: {ankle: ankR, bar: rIn ? barR : null, inStirrup: rIn},
    sagL, sagR, expr,
    lHand: tight(padL.load), rHand: tight(padR.load),
    hairSway, blink,
    err: {legL: legErr(ankL, 'L'), legR: legErr(ankR, 'R')},
  };
};
