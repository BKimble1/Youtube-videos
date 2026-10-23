// V3 story. Every state is a pure function of time, keyed to the measured words of the unchanged narration
// (src/data/timeline.json). Blocking (top view, metres; x across, z along the corridor; she flees toward -z, the
// guard chases from +z; every camera stays on the +x side of the line between them):
//   0.00-1.50  she runs toward -z (looking back over her left shoulder), the guard jogs ~3.7 m behind; she brakes at
//              z 2.66 with a planted brace foot
//   1.20-2.65  she pivots to her right, the shield in her right hand swings through the guard's side into place, her
//              left hand takes the second grip, and she sinks into a crouch at (-0.55, 2.5); shield face at z 2.95
//   2.2-3.4    the guard (lane x -0.28) brakes and stops at z 5.45 when she vanishes; he hooks his cuffs on his belt
//   3.1-18.5   one camera: over his shoulder onto his line (she melts), an orbit round the edge (she is there), back
//              onto his line, into the lens surface, over the cut edge, up into the cross-section with the light paths,
//              back down through the lens and out along his line, then with him as he creeps to z 4.3, and round to
//              the side for both of them
//   18.5-23.9  the reach round the panel's +x edge (her right hand), the floating hand, his micro-reactions, his
//              hesitant reach and recoil
//   23.9-27.9  she stands and lowers the shield to her left side: revealed right in front of him; he realises and
//              draws his cuffs (click)
//   27.9-29.27 she turns left, takes the shield in her right hand and bolts toward -z; he lunges and gives chase. The
//              run continues seamlessly into the opening one corridor period (PERIOD) further along.
import {clamp, lerp} from '../lib/math';
import {DUR, WORDS} from '../world';
import {a3, Cam, l3, lerp3, m3, n3, s3, V3, v3, fwdOf} from '../v2/p3';
import {EXP0, HeadExpr, mixE} from '../v2/Head3';
import {HAND_RELAXED, HandPose, mixHand} from '../art/Hand';
import {gripWorld, onShield, SH, ShieldState} from '../v2/Shield3';
import {footState, Plant} from './gait';
import {simulateSteps} from './stepper';
import {DIM_G3, DIM_W3, joints3, Pose3} from './Person3';
import {PERIOD} from './Corridor3';
import {FIST_RUN, GRIP, OPEN, REACH} from './hands';
import {mc, mc3, prog, sm, SKey} from './spline';
import {CuffsState} from './Cuffs';

export const w = (i: number) => WORDS[i].start;
export const we = (i: number) => WORDS[i].end;
const PI = Math.PI, TAU = 2 * Math.PI;

// ================================================================ places
export const HIDE = v3(-0.55, 0, 2.5);
export const STAND = v3(-0.55, 0, 2.62);
export const S_HIDE: ShieldState = {c: v3(-0.55, SH.h / 2 + 0.006, 2.95), yaw: 0, tilt: 0, speed: 0};
export const GX = -0.28;
export const CUT_Y = S_HIDE.c.y + 0.06 * SH.h;

// ================================================================ shots
export const SHOT = {A: 0, B: 3.1, E: 18.5, F: 20.75, G: 21.35, H: 27.95};
export const shotAt = (t: number) => (t < SHOT.B ? 'A' : t < SHOT.E ? 'B' : t < SHOT.F ? 'E' : t < SHOT.G ? 'F' : t < SHOT.H ? 'G' : 'H');

// ================================================================ her path
// the bolt (from standing at STAND, t 28.1) is an exponential approach to running speed; the opening is the same run
// continued one PERIOD further along, braking into the stop
const TB = 28.1, VMAX = 3.7, TAUR = 0.28;
const runS = (d: number) => (d <= 0 ? 0 : VMAX * (d - TAUR * (1 - Math.exp(-d / TAUR))));
const runV = (d: number) => (d <= 0 ? 0 : VMAX * (1 - Math.exp(-d / TAUR)));
const herRunZ = (T: number) => STAND.z - runS(T - TB);
const TD = 0.92, TS = 1.5, ZS = 2.66;
const vD = -runV(DUR + TD - TB);
// check: braking from TD to TS covers half the distance a constant speed would (a smooth monotone stop)
const zD = ZS - vD * (TS - TD) * 0.5;
const herm = (t: number, t0: number, t1: number, p0: number, v0: number, p1: number, v1: number) => {
  const h = t1 - t0, s = (t - t0) / h, s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * h * v0 + (-2 * s3 + 3 * s2) * p1 + (s3 - s2) * h * v1;
};
// PERIOD is fixed by the corridor; zD (the braking start a smooth stop would want) is reported for the QA check
export const herZ = (t: number) => {
  if (t <= TD) return herRunZ(DUR + t) + PERIOD;
  if (t <= TS) return herm(t, TD, TS, herRunZ(DUR + TD) + PERIOD, vD, ZS, 0);
  if (t <= 2.0) return ZS;
  if (t <= 2.65) return lerp(ZS, HIDE.z, sm((t - 2.0) / 0.65));
  if (t <= 23.95) return HIDE.z;
  if (t <= 24.95) return lerp(HIDE.z, STAND.z, sm((t - 23.95) / 1.0));
  if (t <= TB) return STAND.z;
  return herRunZ(t);
};
export const RUNCHECK = {zD, zAtTD: herRunZ(DUR + TD) + PERIOD};
const herYawK: SKey[] = [[0, PI], [1.18, PI], [1.78, TAU], [27.93, TAU], [28.36, PI], [DUR, PI]];
export const herYaw = (t: number) => mc(t, herYawK);
const herX = (t: number) => -0.55;
export const herPos = (t: number) => v3(herX(t), 0, herZ(t));

// ================================================================ guard path
const TG = 28.55, VG = 1.95, TAUG = 0.35;
const gRunS = (d: number) => (d <= 0 ? 0 : VG * (d - TAUG * (1 - Math.exp(-d / TAUG))));
const gRunV = (d: number) => (d <= 0 ? 0 : VG * (1 - Math.exp(-d / TAUG)));
const LUNGE = 3.72;
const guardRunZ = (T: number) => LUNGE - gRunS(T - TG);
const TGD = 2.2, TGS = 3.4;
const vGD = -gRunV(DUR + TGD - TG);
const G1z = guardRunZ(DUR + TGD) + PERIOD + vGD * (TGS - TGD) * 0.5;
const gzK: SKey[] = [[TGS, G1z], [14.9, G1z], [16.6, 4.45], [17.4, 4.3], [20.9, 4.3], [21.3, 4.37], [21.9, 4.37], [22.7, 4.31], [22.95, 4.31], [23.35, 4.48], [26.5, 4.48], [26.9, 4.12], [28.15, 4.12], [28.45, LUNGE], [TG, LUNGE]];
export const guardZ = (t: number) => {
  if (t <= TGD) return guardRunZ(DUR + t) + PERIOD;
  if (t <= TGS) return herm(t, TGD, TGS, guardRunZ(DUR + TGD) + PERIOD, vGD, G1z, 0);
  if (t <= TG) return mc(t, gzK);
  return guardRunZ(t);
};
const guardX = (t: number) => GX + (t > 28.1 ? -0.1 * sm((t - 28.1) / 0.4) : 0);
export const guardPos = (t: number) => v3(guardX(t), 0, guardZ(t));
export const guardYaw = (_t: number) => PI;

// ================================================================ feet (simulated once, over an unwrapped timeline:
// the opening is the continuation of the ending, one PERIOD further along)
const T_SIM0 = 3.6;
const unwrap = <T,>(f: (t: number) => T, shift: (x: T) => T) => (tau: number) => (tau < DUR ? f(tau) : shift(f(tau - DUR)));
const shiftZ = (p: V3) => v3(p.x, p.y, p.z - PERIOD);
const herPathU = unwrap(herPos, shiftZ);
const herYawU = (tau: number) => herYaw(tau < DUR ? tau : tau - DUR);
const guardPathU = unwrap(guardPos, shiftZ);
const crouchK: SKey[] = [[0, 0.05], [0.92, 0.05], [1.3, 0.24], [1.62, 0.16], [2.0, 0.26], [2.62, 1], [23.95, 1], [24.85, 0], [27.95, 0], [28.12, 0.2], [28.5, 0.06], [DUR, 0.05]];
export const herCrouch = (t: number) => mc(t, crouchK);
const pl = (p: V3, yaw: number): Plant => ({t0: -Infinity, t1: -Infinity, p, yaw});
const fw = (yaw: number) => fwdOf(yaw), rt = (yaw: number) => v3(Math.cos(yaw), 0, -Math.sin(yaw));
const at = (p: V3, yaw: number, x: number, z: number) => a3(a3(p, m3(rt(yaw), x)), m3(fw(yaw), z));
// her forced steps (times on the unwrapped timeline)
const U = (t: number) => DUR + t;
const herForced = (() => {
  const brace = herPathU(U(1.42));
  return [
    // the brace: right foot planted ahead on the second-to-last braking step, then a pivot on its ball
    // braking: a short left step under the body, then the right brace ahead, then the pivot on its ball
    {foot: 'r' as const, t0: U(0.88), t1: U(1.12), p: at(brace, PI, 0.12, 0.22), yaw: PI + 0.25, h: 0.12},
    {foot: 'l' as const, t0: U(1.12), t1: U(1.36), p: at(herPathU(U(1.5)), PI, -0.09, -0.14), yaw: PI - 0.12, h: 0.06},
    {foot: 'r' as const, t0: U(1.36), t1: U(1.72), p: at(brace, PI, 0.12, 0.22), yaw: TAU - 0.2, h: 0.012},
    // the left foot steps round behind into the crouch stance
    {foot: 'l' as const, t0: U(1.46), t1: U(1.84), p: shiftZ(v3(-0.73, 0, 2.53)), yaw: TAU - 0.15, h: 0.07},
    // the right foot settles forward into the crouch
    {foot: 'r' as const, t0: U(2.12), t1: U(2.46), p: shiftZ(v3(-0.37, 0, 2.66)), yaw: TAU + 0.12, h: 0.04},
    // stance adjust at the close call (a nervous half-step back and in again)
    {foot: 'l' as const, t0: 16.62, t1: 16.86, p: v3(-0.75, 0, 2.47), yaw: TAU - 0.18, h: 0.025},
    {foot: 'l' as const, t0: 17.0, t1: 17.24, p: v3(-0.73, 0, 2.53), yaw: TAU - 0.15, h: 0.025},
    // standing up at the reveal
    {foot: 'r' as const, t0: 24.28, t1: 24.58, p: v3(-0.45, 0, 2.66), yaw: TAU + 0.08, h: 0.05},
    {foot: 'l' as const, t0: 24.6, t1: 24.88, p: v3(-0.66, 0, 2.6), yaw: TAU - 0.08, h: 0.05},
  ];
})();
const herInit = {l: pl(v3(-0.73, 0, 2.53), TAU - 0.15), r: pl(v3(-0.37, 0, 2.66), TAU + 0.12)};
const herHold: [number, number][] = [[T_SIM0, 24.95], [U(0.86), U(3.6) + 0.1]];
// two passes: the second starts from the feet the first one ends with (one loop later), so the stance at T_SIM0 is
// exactly where the opening leaves it
const twoPass = (cfg: Omit<Parameters<typeof simulateSteps>[0], 'init'>, init: {l: Plant; r: Plant}) => {
  const a = simulateSteps({...cfg, init});
  const end = (k: 'l' | 'r') => {
    const last = a[k][a[k].length - 1];
    return pl(v3(last.p.x, 0, last.p.z + PERIOD), last.yaw);
  };
  return simulateSteps({...cfg, init: {l: end('l'), r: end('r')}});
};
const herSteps = twoPass({
  path: herPathU, yaw: herYawU, t0: T_SIM0, t1: U(T_SIM0),
  width: (tau) => lerp(0.1, 0.07, clamp((l3(s3(herPathU(tau + 0.02), herPathU(tau - 0.02))) / 0.04 - 1) / 2)),
  forced: herForced, hold: herHold, thresh: 0.17,
}, herInit);
const guardInit = {l: pl(v3(GX + 0.11, 0, G1z + 0.02), PI - 0.08), r: pl(v3(GX - 0.11, 0, G1z - 0.04), PI + 0.08)};
const guardSteps = twoPass({path: guardPathU, yaw: () => PI, t0: T_SIM0, t1: U(T_SIM0), width: () => 0.115, thresh: 0.15}, guardInit);
export const STEPS = {her: herSteps, guard: guardSteps};
const feetAt = (tr: {l: Plant[]; r: Plant[]}, t: number, fd: typeof DIM_W3.foot) => {
  const tau = t < T_SIM0 ? t + DUR : t;
  const f = (k: 'l' | 'r') => {
    const s = footState(tr[k], tau, fd);
    return tau >= DUR ? {...s, ank: v3(s.ank.x, s.ank.y, s.ank.z + PERIOD)} : s;
  };
  return {l: f('l'), r: f('r')};
};

// ================================================================ the shield
const speedOf = (f: (t: number) => V3, t: number) => l3(s3(f(t + 1 / 60), f(t - 1 / 60))) * 30;
/** carried at her right side by its rear grip, plane along her heading, gently swinging with her stride */
const carry = (t: number): ShieldState => {
  const p = herPos(t), yaw = herYaw(t);
  const sw = Math.sin(t * 2 * PI * 1.55);
  const c = a3(a3(a3(p, m3(rt(yaw), 0.33)), v3(0, 0.86 + 0.012 * sw, 0)), m3(fw(yaw), 0.03 * sw));
  return {c, yaw: yaw + PI / 2 + 0.05 * sw, tilt: 0.03, speed: 0};
};
const LOW: ShieldState = {c: v3(-0.93, 0.6, 2.66), yaw: TAU - PI / 2, tilt: 0.02, speed: 0};
const raiseK = (() => {
  const c0 = carry(1.5);
  return {c: [[1.5, c0.c], [1.7, v3(-0.6, 0.93, 3.0)], [1.95, v3(-0.55, 0.95, 3.07)], [2.66, S_HIDE.c]] as [number, V3][],
    yaw: [[1.5, c0.yaw], [1.72, TAU - 0.1], [1.95, TAU], [2.66, TAU]] as SKey[], tilt: [[1.5, 0.03], [1.95, 0.06], [2.66, 0]] as SKey[]};
})();
const lowerK = {c: [[23.95, S_HIDE.c], [24.35, v3(-0.64, 0.66, 2.98)], [24.95, LOW.c]] as [number, V3][], yaw: [[23.95, TAU], [24.35, TAU - 0.5], [24.95, LOW.yaw]] as SKey[]};
const shieldRaw = (t: number): ShieldState => {
  if (t <= 1.5) return carry(t);
  if (t <= 2.66) return {c: mc3(t, raiseK.c), yaw: mc(t, raiseK.yaw), tilt: mc(t, raiseK.tilt), speed: 0};
  if (t <= 23.95) {
    // held: breathing, a tightening of the grip in the close call, the weight shift of the reach
    const br = 0.004 * Math.sin(t * 2 * PI * 0.42);
    const reach = 0.012 * Math.sin(PI * clamp((t - 18.5) / 5.4));
    return {c: a3(S_HIDE.c, v3(-reach, br, 0)), yaw: TAU - 0.03 * Math.sin(PI * clamp((t - 18.5) / 5.4)), tilt: 0.004 * Math.sin(t * 1.7), speed: 0};
  }
  if (t <= 24.95) return {c: mc3(t, lowerK.c), yaw: mc(t, lowerK.yaw), tilt: 0.02 * prog(t, 23.95, 24.95), speed: 0};
  if (t <= 28.0) return {...LOW, c: a3(LOW.c, v3(0, 0.006 * Math.sin(t * 2.2), 0))};
  // the hand-off: from her left side (facing the guard) to her right side (running), the shield hardly moves; she
  // turns round it
  const k = prog(t, 28.0, 28.42);
  const cr = carry(t);
  return {c: lerp3(LOW.c, cr.c, k), yaw: lerp(LOW.yaw, cr.yaw + TAU, k) , tilt: lerp(LOW.tilt, cr.tilt, k), speed: 0};
};
export const shieldAt = (t: number): ShieldState => ({...shieldRaw(t), speed: speedOf((x) => shieldRaw(x).c, t)});
export const floatHandPos = (t: number) => a3(onShield(S_HIDE, 0.57, 0.2, 0.05), v3(0.004 * Math.sin(t * 2.3), 0.006 * Math.sin(t * 1.7), 0));

// ================================================================ expressions
const X = (o: Partial<HeadExpr>): HeadExpr => ({...EXP0, ...o});
const E = {
  panic: X({wide: 0.9, browIn: 0.8, open: 0.45, smile: -0.3, lid: 0}),
  focus: X({browDown: 0.55, squint: 0.2, smile: -0.1, lid: 0.12}),
  hope: X({browIn: 0.35, smile: 0.12, lid: 0.15, wide: 0.15}),
  tense: X({browIn: 0.6, squint: 0.35, smile: -0.25, lid: 0.1, open: 0.05}),
  wince: X({browIn: 0.9, squint: 0.75, smile: -0.35, lid: 0.3}),
  sly: X({smirk: 0.55, smile: 0.25, browAsym: 0.45, lid: 0.22, browDown: 0.1}),
  stifle: X({smirk: 0.8, smile: 0.45, browAsym: 0.6, lid: 0.3, squint: 0.3}),
  grin: X({smirk: 0.75, smile: 0.6, browAsym: 0.65, lid: 0.15, wide: 0.1}),
  alarm: X({wide: 1, browIn: 0.9, open: 0.6, smile: -0.35, lid: 0}),
};
const G = {
  chase: X({browDown: 0.75, squint: 0.25, smile: -0.25, lid: 0.08, open: 0.12}),
  search: X({browDown: 0.45, smile: -0.15, lid: 0.12}),
  puzzled: X({browAsym: 0.9, browDown: 0.3, smile: -0.25, smirk: 0.2, lid: 0.1}),
  squint: X({browDown: 0.9, squint: 0.7, smile: -0.2, lid: 0.25}),
  notice: X({wide: 0.6, browIn: 0.3, smile: -0.1, lid: 0}),
  shock: X({wide: 1, browIn: 0.8, open: 0.8, smile: -0.4, lid: 0}),
  uneasy: X({wide: 0.55, browIn: 0.65, open: 0.2, smile: -0.3, lid: 0.02}),
  stunned: X({wide: 0.85, browIn: 0.5, open: 0.5, smile: -0.2, lid: 0}),
  realise: X({browDown: 1, squint: 0.55, smile: -0.1, smirk: 0.15, lid: 0.2}),
  stern: X({browDown: 0.85, squint: 0.3, smirk: 0.45, smile: 0.1, lid: 0.18}),
};
const exprTrack = (t: number, keys: [number, HeadExpr][], blend = 0.22): HeadExpr => {
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  const cur = keys[i][1];
  const prev = i > 0 ? keys[i - 1][1] : cur;
  const k = i > 0 ? sm((t - keys[i][0]) / blend) : 1;
  return mixE(prev, cur, k);
};
const herExprK: [number, HeadExpr][] = [[0, E.panic], [1.2, E.focus], [2.4, E.hope], [7.0, E.focus], [12.0, E.hope], [15.4, E.tense], [17.5, E.wince], [18.3, E.focus], [19.9, E.sly], [22.25, E.stifle], [23.2, E.sly], [25.1, E.grin], [27.45, E.alarm], [28.4, E.panic]];
const guardExprK: [number, HeadExpr][] = [[0, G.chase], [2.6, G.search], [4.55, G.puzzled], [5.6, G.search], [16.9, G.squint], [17.95, G.puzzled], [18.6, G.search], [21.0, G.notice], [21.3, G.shock], [21.85, G.uneasy], [22.95, G.shock], [23.45, G.stunned], [24.9, G.shock], [25.5, G.stunned], [26.45, G.realise], [27.3, G.stern], [28.1, G.chase]];

// ================================================================ her pose
const twistK: SKey[] = [[0, -0.35], [0.5, -0.35], [0.9, 0], [1.12, 0.1], [1.36, 0.34], [1.76, 0.08], [2.05, 0], [18.5, 0], [19.6, -0.3], [20.6, -0.22], [23.3, -0.22], [23.9, 0], [27.95, 0], [28.12, -0.32], [28.48, 0], [28.85, 0], [29.1, -0.3], [DUR, -0.35]];
const headRelK: SKey[] = [[0, -1.6], [0.5, -1.6], [0.92, -0.08], [1.12, 0.2], [1.36, 0.6], [1.72, 0.22], [2.05, 0.02], [5.5, 0.06], [9.0, -0.05], [12.5, 0.06], [15.6, 0.16], [16.5, 0.0], [17.6, 0.08], [18.6, 0.1], [19.6, 0.42], [20.6, 0.16], [21.4, 0.06], [22.5, 0.12], [23.9, 0.02], [25.2, 0.05], [26.3, -0.08], [27.4, 0.0], [27.95, 0.0], [28.1, -0.55], [28.42, -0.18], [28.75, 0], [29.05, -1.1], [DUR, -1.6]];
const headPitchK: SKey[] = [[0, 0.02], [0.92, 0.04], [1.3, -0.05], [2.4, -0.12], [5, -0.15], [15.6, -0.1], [17.6, -0.18], [18.6, 0.02], [19.6, 0.1], [20.6, -0.06], [23.9, -0.08], [25.1, -0.16], [27.95, -0.12], [28.5, 0.05], [DUR, 0.02]];
const leanK: SKey[] = [[0, 0.2], [0.92, 0.2], [1.32, -0.12], [1.6, 0.0], [2.0, 0.08], [2.62, 0.12], [15.6, 0.12], [17.4, 0.2], [18.4, 0.12], [19.6, 0.2], [23.3, 0.18], [23.95, 0.12], [24.95, 0.02], [27.45, 0.02], [27.85, -0.1], [28.15, 0.28], [28.6, 0.22], [DUR, 0.2]];
const carriageK: SKey[] = [[0, 1], [0.92, 1], [1.4, 0.3], [1.7, 0], [27.95, 0], [28.3, 0.6], [28.6, 1], [DUR, 1]];
const blinkAt = [2.9, 6.8, 11.5, 14.2, 17.75, 21.1, 25.0, 26.95];
const blinkOf = (t: number, at_: number[]) => at_.reduce((m, a) => Math.max(m, clamp(1 - Math.abs(t - a) / 0.07)), 0);

const RGRIP = (s: ShieldState) => gripWorld(s, 1, 0.5);
const LGRIP = (s: ShieldState) => gripWorld(s, -1, 0.5);
const reachW = (t: number, s: ShieldState) => {
  // grip -> slip back and out -> behind the edge -> round the edge -> the float position; the hand returns the same way
  const stage = onShield(s, 0.5 - 0.035, 0.12, -0.075);
  const edge = onShield(s, 0.5 + 0.03, 0.16, -0.01);
  const fl = floatHandPos(t);
  const keys: [number, V3][] = [[18.55, RGRIP(s)], [18.9, a3(RGRIP(s), v3(0.05, 0.05, -0.09))], [19.45, stage], [20.0, edge], [20.55, fl], [23.25, fl], [23.5, edge], [23.68, stage], [23.88, RGRIP(s)]];
  return mc3(t, keys);
};

export const womanAt = (t: number): {pose: Pose3; shield: ShieldState} => {
  const D = DIM_W3;
  const s = shieldAt(t);
  const yaw = herYaw(t);
  const twist = mc(t, twistK);
  const crouch = herCrouch(t);
  const run = mc(t, carriageK);
  const breath = 0.006 * Math.sin(t * 2 * PI * 0.42);
  const feet = feetAt(herSteps, t, D.foot);
  const headYaw = yaw + twist + mc(t, headRelK);
  // hair: trails the head's turning and lifts with the stride
  const hy0 = herYaw(t - 0.1) + mc(t - 0.1, twistK) + mc(t - 0.1, headRelK);
  const sway = clamp((hy0 - headYaw) * 1.6, -1, 1);
  const v = speedOf(herPos, t);
  const lift = clamp(v / 3.7, 0, 1) * (0.6 + 0.4 * Math.sin(t * 2 * PI * 1.55));
  const vel = s3(herPos(t + 1 / 60), herPos(t - 1 / 60));
  const hem = m3(vel, -30 * 0.012);
  const base: Pose3 = {
    pos: herPos(t), yaw, crouch, lean: mc(t, leanK), side: t > 18.5 && t < 23.9 ? 0.07 * Math.sin(PI * clamp((t - 18.5) / 5.4)) : 0,
    twist, bob: breath * crouch, shrug: 0.012 * Math.sin(t * 2 * PI * 0.42) + (t > 27.45 && t < 28.0 ? 0.03 * Math.sin(PI * (t - 27.45) / 0.55) : 0),
    headYaw, headPitch: mc(t, headPitchK), headRoll: (t > 25.1 && t < 27.4 ? 0.12 * Math.sin(PI * clamp((t - 25.1) / 2.3)) : 0) + (t > 15.5 && t < 16.5 ? -0.06 * Math.sin(PI * (t - 15.5)) : 0),
    feet, R: {hand: HAND_RELAXED}, L: {hand: HAND_RELAXED}, carriage: run,
    expr: exprTrack(t, herExprK), blink: blinkOf(t, blinkAt), sway, lift, hem,
  };
  // free-arm positions (forward kinematics) for blending into and out of grips
  const free = joints3(base, D);
  const blendW = (a: V3, b: V3, k: number) => lerp3(a, b, k);
  // ---- right hand
  let R: Pose3['R'];
  const sN = n3(v3(Math.sin(s.yaw), 0, Math.cos(s.yaw)));
  if (t < 18.55 || (t > 23.88 && t < 24.5)) {
    R = {W: RGRIP(s), hand: GRIP, dir: sN};
  } else if (t <= 23.88) {
    const W = reachW(t, s);
    const k1 = prog(t, 18.55, 18.95), k2 = prog(t, 19.5, 20.5), kb = prog(t, 23.3, 23.85);
    let hand = mixHand(mixHand(GRIP, REACH, k1), OPEN, k2);
    hand = mixHand(hand, GRIP, kb);
    // fingers: a ripple when he reaches, a twitch when he freezes
    const rip = Math.sin(PI * clamp((t - 22.45) / 0.65)), tw = 0.45 * Math.sin(PI * clamp((t - 21.4) / 0.3));
    const env = rip + tw;
    if (env > 0.01) {
      const ph = t * 2 * PI * 3.4;
      hand = {...hand, curl: hand.curl.map((c0, i) => clamp(c0 + 0.8 * env * Math.max(0, Math.sin(ph - i * 0.8)))) as HandPose['curl']};
    }
    const out = k2 * (1 - kb);
    const dir = n3(lerp3(lerp3(sN, v3(0.25, 0.1, 0.95), k1), v3(-0.05, 1, 0.12), out));
    const palm = n3(lerp3(v3(-1, 0, 0), v3(0, 0, 1), out));
    R = {W, hand, dir, palm};
  } else if (t < 27.95) {
    // free: drops from the grip to her side; a small "hi" on "right in front of them"
    const k = prog(t, 24.5, 24.95);
    const wave = Math.sin(PI * clamp((t - 26.35) / 0.75));
    let W = blendW(RGRIP(s), free.R.W, k);
    if (wave > 0) W = lerp3(W, a3(free.sh.r, v3(0.06, -0.08, 0.22)), sm(wave * 1.4));
    let hand = mixHand(GRIP, HAND_RELAXED, k);
    if (wave > 0.05) {
      const ph = t * 2 * PI * 3;
      hand = {...OPEN, curl: OPEN.curl.map((c0, i) => clamp(c0 + 0.7 * wave * Math.max(0, Math.sin(ph - i * 0.8)))) as HandPose['curl']};
    }
    R = wave > 0.05 ? {W, hand, dir: n3(v3(0.1, 1, 0.2)), palm: v3(0, 0, 1)} : {W, hand};
  } else {
    // the hand-off: takes the rear grip as she turns, then carries
    const k = prog(t, 27.97, 28.15);
    R = {W: blendW(free.R.W, RGRIP(s), k), hand: mixHand(HAND_RELAXED, GRIP, k), dir: k > 0.5 ? sN : undefined};
  }
  // ---- left hand
  let L: Pose3['L'];
  if (t < 1.55) L = {hand: mixHand(HAND_RELAXED, FIST_RUN, run)};
  else if (t < 1.88) {
    const k = prog(t, 1.55, 1.86);
    L = {W: blendW(free.L.W, LGRIP(s), k), hand: mixHand(FIST_RUN, GRIP, k)};
  } else if (t < 28.1) L = {W: LGRIP(s), hand: GRIP, dir: sN};
  else {
    const k = prog(t, 28.1, 28.38);
    L = {W: blendW(LGRIP(s), free.L.W, k), hand: mixHand(GRIP, FIST_RUN, k)};
  }
  if (t < 1.55 || t >= 28.38) L = {hand: FIST_RUN};
  return {pose: {...base, R, L}, shield: s};
};

// ================================================================ the guard
// what he looks at, and where the torch points (world targets)
const herHead = (t: number) => a3(herPos(t), v3(0, 1.45 - 0.55 * herCrouch(t), 0));
const lookK: [number, V3][] = [
  [2.0, v3(-0.55, 1.2, 2.7)], [3.0, v3(-0.55, 0.8, 2.95)], [4.4, v3(-0.5, 0.7, 2.95)], [5.0, v3(-0.75, 0.75, 2.95)], [6.5, v3(-0.3, 0.75, 2.9)],
  [8.5, v3(-1.2, 1.0, 2.2)], [10.5, v3(0.4, 1.0, 2.0)], [12.5, v3(-0.55, 0.8, 2.95)], [15.5, v3(-0.4, 0.7, 2.95)], [16.6, v3(-0.7, 0.75, 2.95)],
  [17.6, v3(-0.55, 0.72, 2.95)], [18.6, v3(-0.9, 0.9, 2.6)], [19.8, v3(-0.4, 0.8, 2.95)], [20.95, v3(-0.4, 0.8, 2.95)], [21.25, v3(-0.13, 0.8, 3.0)],
  [23.9, v3(-0.15, 0.82, 3.0)], [24.6, v3(-0.7, 0.8, 2.8)], [25.4, v3(-0.75, 0.7, 2.7)], [26.0, v3(-0.55, 1.45, 2.62)], [26.85, v3(-0.55, 1.45, 2.62)],
  [27.05, v3(0.0, 0.85, 4.15)], [27.35, v3(-0.1, 1.15, 3.95)], [27.7, v3(-0.45, 1.4, 2.7)], [28.0, v3(-0.55, 1.4, 2.62)],
];
const torchK: [number, V3][] = [
  [2.2, v3(-0.6, 1.0, 2.75)], [2.9, v3(-0.9, 0.7, 2.95)], [3.6, v3(-0.2, 0.7, 2.97)], [4.5, v3(-0.55, 0.62, 2.97)], [5.2, v3(-0.85, 0.65, 2.97)],
  [7.0, v3(-0.3, 0.6, 2.97)], [9.0, v3(-1.2, 0.6, 2.4)], [11.0, v3(0.3, 0.6, 2.2)], [13.0, v3(-0.4, 0.62, 2.97)], [15.4, v3(-0.75, 0.7, 2.97)],
  [16.4, v3(-0.3, 0.75, 2.97)], [17.6, v3(-0.55, 0.62, 2.97)], [18.8, v3(-1.1, 0.6, 2.6)], [20.0, v3(-0.45, 0.6, 2.97)], [21.0, v3(-0.3, 0.7, 2.97)],
  [21.25, v3(-0.15, 0.78, 3.0)], [21.5, v3(-0.2, 0.35, 3.3)], [22.4, v3(-0.15, 0.72, 3.0)], [23.0, v3(-0.1, 0.9, 3.0)], [23.4, v3(-0.4, 0.5, 3.1)],
  [24.6, v3(-0.7, 0.7, 2.85)], [25.4, v3(-0.6, 1.1, 2.7)], [26.0, v3(-0.55, 1.3, 2.7)], [26.9, v3(-0.5, 1.0, 2.8)], [27.6, v3(-0.5, 0.95, 2.75)], [28.0, v3(-0.55, 1.0, 2.6)],
];
export const torchAimRaw = (t: number): V3 => {
  // chasing: on her back; after the stop: keyed sweeps
  const chase = (tt: number) => a3(herHead(tt), v3(0.05 * Math.sin(tt * 3.1), -0.35 + 0.08 * Math.sin(tt * 2.3), 0));
  if (t <= 2.2) return chase(t);
  if (t < 2.6) return lerp3(chase(t), mc3(t, torchK), prog(t, 2.2, 2.6));
  if (t < 28.0) return mc3(t, torchK);
  return lerp3(mc3(28.0, torchK), chase(t), prog(t, 28.0, 28.5));
};
const lookAt = (t: number): V3 => {
  if (t <= 2.0) return herHead(t);
  if (t < 28.0) return t < 2.4 ? lerp3(herHead(t), mc3(t, lookK), prog(t, 2.0, 2.4)) : mc3(t, lookK);
  return lerp3(mc3(28.0, lookK), herHead(t), prog(t, 28.0, 28.3));
};
const gLeanK: SKey[] = [[0, 0.16], [2.2, 0.16], [3.0, -0.04], [3.5, 0.06], [4.55, 0.06], [5.1, 0.24], [5.7, 0.06], [14.9, 0.06], [16.6, 0.1], [17.4, 0.34], [17.95, 0.28], [18.5, 0.08], [20.9, 0.08], [21.3, -0.08], [21.9, -0.02], [22.7, 0.14], [22.95, 0.14], [23.15, -0.16], [23.6, -0.04], [24.95, -0.04], [25.25, -0.14], [26.4, -0.05], [26.9, 0.08], [27.9, 0.04], [28.35, 0.38], [28.7, 0.18], [DUR, 0.16]];
const gShrugK: SKey[] = [[0, 0.0], [20.95, 0], [21.25, 0.035], [21.9, 0.02], [22.95, 0.02], [23.1, 0.045], [23.8, 0.01], [24.95, 0.01], [25.2, 0.045], [26.3, 0.015], [26.9, 0], [DUR, 0]];
const gBlinkAt = [1.6, 6.2, 9.9, 13.6, 18.2, 20.85, 24.4, 26.6];
const pouch = (j: ReturnType<typeof joints3>) => a3(a3(j.P, m3(j.lum, 0.05)), m3(j.Rv, -0.21));
export const cuffsAt = (t: number): CuffsState => {
  const where = t < 4.98 || t > 27.18 ? 'hand' : 'belt';
  const open = t < 4.98 ? 1 : clamp((t - 27.82) / 0.07);
  const snap = t > 27.82 && t < 28.2 ? 0.25 * Math.sin((t - 27.82) * 40) * Math.exp(-(t - 27.82) * 12) : 0;
  return {where, open: clamp(open + snap, 0, 1.2), swing: 0.6 * Math.sin(t * 7.3) * (t < 4.98 || t > 28.1 ? 1 : 0.3)};
};
export const guardAt = (t: number): Pose3 => {
  const D = DIM_G3;
  const pos = guardPos(t);
  const v = speedOf(guardPos, t);
  const run = clamp(v / 1.6);
  const feet = feetAt(guardSteps, t, D.foot);
  const look = lookAt(t);
  const eye = a3(pos, v3(0, 1.72, 0));
  const dl = s3(look, eye);
  const ly = Math.atan2(dl.x, dl.z), lp = clamp(-Math.atan2(dl.y, Math.hypot(dl.x, dl.z)), -0.5, 0.7);
  const yaw = guardYaw(t);
  let rel = ((ly - yaw + PI * 3) % TAU) - PI;
  rel = clamp(rel, -1.3, 1.3);
  const twist = clamp(rel * 0.3, -0.35, 0.35);
  const roll = 0.2 * Math.sin(PI * clamp((t - 17.95) / 0.6)) + 0.16 * Math.sin(PI * clamp((t - 23.45) / 1.3)) + 0.1 * Math.sin(PI * clamp((t - 25.5) / 0.8));
  const base: Pose3 = {
    pos, yaw, crouch: 0.06 * run + 0.18 * Math.sin(PI * clamp((t - 28.12) / 0.45)), lean: mc(t, gLeanK), side: 0, twist,
    bob: 0, shrug: mc(t, gShrugK), headYaw: yaw + twist + (rel - twist) * 0.98, headPitch: lp + (t > 21.25 && t < 21.6 ? -0.1 * Math.sin(PI * (t - 21.25) / 0.35) : 0), headRoll: roll,
    feet, R: {hand: GRIP}, L: {hand: HAND_RELAXED}, carriage: run * 0.7,
    expr: exprTrack(t, guardExprK, 0.16), blink: blinkOf(t, gBlinkAt), sway: 0, torch: true, cuffs: cuffsAt(t),
  };
  const j = joints3(base, D);
  // torch hand: forward at chest height, pointing at the target; it dips when he sees the hand
  const aim = torchAimRaw(t);
  const dip = 0.12 * Math.sin(PI * clamp((t - 21.2) / 0.7));
  const jolt = 0.1 * Math.sin(PI * clamp((t - 24.95) / 0.5));
  const Wt = a3(a3(a3(j.sh.r, m3(j.Fs, 0.36 + 0.06 * run)), v3(0, -0.17 - dip + jolt, 0)), m3(j.Rs, 0.02));
  const dir = n3(s3(aim, Wt));
  // left hand: cuffs while chasing; hooks them on the belt; reaches for the floating hand; draws the cuffs
  const free = j.L.W;
  const pz = pouch(j);
  const reachT = a3(floatHandPos(t), v3(0.02, 0.1, 0.62));
  let LW: V3 = free, Lh: HandPose = HAND_RELAXED, Ldir: V3 | undefined, Lpalm: V3 | undefined, Lpole: V3 | undefined;
  if (t < 5.4) {
    const k1 = prog(t, 4.62, 4.98), k2 = prog(t, 5.0, 5.38);
    LW = lerp3(lerp3(free, pz, k1), free, k2);
    Lh = t < 4.98 ? GRIP : mixHand(OPEN, HAND_RELAXED, k2);
  } else if (t > 17.85 && t < 18.6) {
    // scratches the back of his cap: puzzled
    const k = Math.sin(PI * clamp((t - 17.85) / 0.75));
    LW = lerp3(free, a3(j.Hc, a3(m3(j.Rs, -0.1), v3(0, 0.04, -0.05))), sm(k * 1.3));
    Lh = mixHand(HAND_RELAXED, {curl: [0.4, 0.45, 0.5, 0.55], spread: 0.3, thumb: 30, thumbCurl: 0.4}, k);
    Lpole = n3(a3(a3(m3(j.Rs, -1), v3(0, 0.25, 0)), m3(j.Fs, -0.3)));
  } else if (t > 21.85 && t < 23.6) {
    // the hesitant reach: up, a stall, a little further, then snatched back on the ripple
    const r = mc(t, [[21.85, 0], [22.15, 0.45], [22.35, 0.48], [22.75, 0.78], [22.95, 0.8], [23.12, 0.15], [23.6, 0]] as SKey[]);
    const shake = 0.008 * Math.sin(t * 47) * (t > 22.15 && t < 22.95 ? 1 : 0);
    LW = a3(lerp3(free, reachT, r), v3(0, shake, 0));
    Lh = mixHand(HAND_RELAXED, {curl: [0.08, 0.12, 0.2, 0.28], spread: 0.45, thumb: 30, thumbCurl: 0.2}, clamp(r * 1.6));
    Ldir = r > 0.2 ? n3(v3(-0.1, 0.65, -1)) : undefined;
    Lpalm = r > 0.2 ? v3(0, 0.1, -1) : undefined;
  } else if (t > 26.85) {
    const k1 = prog(t, 26.88, 27.18), k2 = prog(t, 27.22, 27.6);
    const show = a3(a3(j.sh.l, m3(j.Fs, 0.36)), v3(0.02, -0.12, 0));
    const lunge = Math.sin(PI * clamp((t - 28.1) / 0.5));
    LW = lerp3(lerp3(free, pz, k1), show, k2);
    if (lunge > 0) LW = lerp3(LW, a3(a3(j.sh.l, m3(j.Fs, 0.5)), v3(-0.05, -0.05, 0)), lunge);
    if (t > 28.6) LW = lerp3(LW, free, prog(t, 28.6, 28.95));
    Lh = GRIP;
    Ldir = k2 > 0.4 && t < 28.6 ? n3(a3(j.Fs, v3(0, 0.25, 0))) : undefined;
    Lpalm = Ldir ? n3(m3(j.Rs, 1)) : undefined;
  }
  if (t < 4.62 || t > 28.95) { LW = free; Lh = GRIP; }
  return {...base, R: {W: Wt, hand: GRIP, dir}, L: {W: t < 4.62 || t > 28.95 ? undefined : LW, hand: Lh, dir: Ldir, palm: Lpalm, pole: Lpole}};
};
export const torchRay = (t: number) => {
  const g = guardAt(t);
  const j = joints3(g, DIM_G3);
  return {o: a3(j.R.W, m3(j.R.dir, 0.25)), dir: j.R.dir, eye: j.Hc};
};

// ================================================================ cameras
/** orbit rig: focus point, distance, azimuth (from +z toward +x), elevation; screen-up is the elevation tangent */
export type Orbit = {F: V3; D: number; az: number; el: number; f: number};
export const orbitCam = (o: Orbit): Cam => {
  const ca = Math.cos(o.az), sa = Math.sin(o.az), ce = Math.cos(o.el), se = Math.sin(o.el);
  const pos = a3(o.F, v3(o.D * sa * ce, o.D * se, o.D * ca * ce));
  return {pos, tgt: o.F, f: o.f, up: v3(-sa * se, ce, -ca * se)};
};
type OK = [number, Orbit];
const orbitAt = (t: number, keys: OK[]): Orbit => {
  const F = mc3(t, keys.map(([tt, o]) => [tt, o.F]) as [number, V3][]);
  return {
    F, D: Math.exp(mc(t, keys.map(([tt, o]) => [tt, Math.log(o.D)]) as SKey[])),
    az: mc(t, keys.map(([tt, o]) => [tt, o.az]) as SKey[]), el: mc(t, keys.map(([tt, o]) => [tt, o.el]) as SKey[]),
    f: Math.exp(mc(t, keys.map(([tt, o]) => [tt, Math.log(o.f)]) as SKey[])),
  };
};
const cache = new Map<string, unknown>();
const memo = <T,>(k: string, f: () => T): T => {
  if (!cache.has(k)) cache.set(k, f());
  return cache.get(k) as T;
};
const deg = (d: number) => (d * PI) / 180;
export const P0 = onShield(S_HIDE, 0.18, 0.06, SH.th / 2); // the dive's landing point, on his line, at the cut height
export const P1 = onShield(S_HIDE, 0.3, 0.02, SH.th / 2); // the return point
const SC = v3(S_HIDE.c.x, S_HIDE.c.y + 0.06, S_HIDE.c.z);
// the long take (B): a list of orbit keys; the guard positions are used to keep the camera over his shoulder
const B_KEYS = (): OK[] => {
  const ots = (t: number, dx: number, dy: number, dz: number, f: number): Orbit => {
    const g = guardPos(t);
    const cam = v3(g.x + dx, 1.72 + dy, g.z + dz);
    const d = s3(cam, SC);
    const D = l3(d);
    return {F: SC, D, az: Math.atan2(d.x, d.z), el: Math.asin(d.y / D), f};
  };
  return [
    [3.1, ots(3.1, 0.5, 0.24, 1.25, 1350)],
    [3.75, ots(3.75, 0.26, 0.26, 1.15, 1450)],
    [4.45, ots(4.45, 0.02, 0.3, 1.05, 1600)],
    [5.0, ots(5.0, 0.0, 0.26, 0.85, 1650)],
    [5.7, {F: v3(-0.48, 0.66, 2.85), D: 2.05, az: deg(54), el: deg(9), f: 1250}],
    [6.4, {F: v3(-0.5, 0.65, 2.95), D: 1.05, az: deg(4), el: deg(4), f: 1500}],
    [7.7, {F: P0, D: 0.024, az: deg(0.5), el: deg(0.5), f: 1500}],
    [8.25, {F: a3(P0, v3(0.0015, 0, 0)), D: 0.023, az: deg(0.3), el: deg(1), f: 1500}],
    [9.1, {F: a3(P0, v3(0.0015, 0, 0)), D: 0.024, az: deg(0.3), el: deg(89.5), f: 1500}],
    [10.4, {F: v3(-0.52, CUT_Y, 2.9), D: 1.5, az: deg(8), el: deg(68), f: 1300}],
    [12.75, {F: v3(-0.45, CUT_Y, 3.85), D: 4.3, az: deg(18), el: deg(56), f: 1150}],
    [13.3, {F: v3(-0.4, CUT_Y, 3.2), D: 1.2, az: deg(8), el: deg(30), f: 1300}],
    [13.75, {F: P1, D: 0.03, az: deg(2), el: deg(3), f: 1500}],
    [14.85, ots(14.85, 0.36, 0.26, 1.15, 1450)],
    [16.6, ots(16.6, 0.36, 0.2, 1.05, 1380)],
    [17.55, {F: v3(-0.4, 0.95, 3.5), D: 1.85, az: deg(70), el: deg(8), f: 880}],
    [18.5, {F: v3(-0.4, 0.98, 3.48), D: 1.8, az: deg(76), el: deg(8), f: 900}],
  ];
};
const G_KEYS = (): OK[] => {
  // starts exactly where F ends (behind his left shoulder), arcs past his left side to the two-shot
  const fh = floatHandPos(SHOT.G);
  const g = guardPos(SHOT.G);
  const c0 = v3(g.x + 0.42, 1.95, g.z + 1.0);
  const d0 = s3(c0, fh), D0 = l3(d0);
  return [
    [SHOT.G, {F: fh, D: D0, az: Math.atan2(d0.x, d0.z), el: Math.asin(d0.y / D0), f: 1650}],
    [22.15, {F: v3(-0.38, 1.12, 3.6), D: 1.78, az: deg(84), el: deg(6), f: 740}],
    [23.9, {F: v3(-0.38, 1.14, 3.58), D: 1.78, az: deg(85), el: deg(6), f: 750}],
    [24.95, {F: v3(-0.4, 1.22, 3.55), D: 1.8, az: deg(86), el: deg(5), f: 720}],
    [26.4, {F: v3(-0.4, 1.26, 3.52), D: 1.8, az: deg(86), el: deg(5), f: 740}],
    [27.3, {F: v3(-0.34, 1.2, 3.62), D: 1.76, az: deg(84), el: deg(4), f: 780}],
    [27.95, {F: v3(-0.38, 1.16, 3.55), D: 1.8, az: deg(85), el: deg(4), f: 740}],
  ];
};
/** the chase camera: ahead of her and to her left (+x), looking back past her at the guard */
export const chaseCam = (zh: number): Cam => ({pos: v3(1.15, 1.27, zh - 1.38), tgt: v3(0.06, 1.08, zh + 0.3), f: 900});
const mixCam = (a: Cam, b: Cam, k: number): Cam => ({pos: lerp3(a.pos, b.pos, k), tgt: lerp3(a.tgt, b.tgt, k), f: Math.exp(lerp(Math.log(a.f), Math.log(b.f), k)), up: a.up && b.up ? n3(lerp3(a.up, b.up, k)) : a.up ?? b.up});
export const camAt = (t: number): Cam => {
  const sh = shotAt(t);
  switch (sh) {
    case 'A': {
      const ch = chaseCam(herZ(t));
      // after she stops: round behind her shoulder, low, the guard beyond the shield
      const ots: Cam = {pos: v3(-0.16, 1.12, 1.3), tgt: v3(-0.7, 0.92, 4.45), f: 1060, up: v3(0, 1, 0)};
      const drift: Cam = {pos: v3(-0.1, 1.06, 1.42), tgt: v3(-0.68, 0.9, 4.45), f: 1130, up: v3(0, 1, 0)};
      const k = prog(t, 1.45, 2.75);
      const base = mixCam({...ch, up: v3(0, 1, 0)}, ots, k);
      return t < 2.75 ? base : mixCam(ots, drift, prog(t, 2.75, 3.5));
    }
    case 'B': return orbitCam(orbitAt(t, memo('B', B_KEYS)));
    case 'E': {
      const k = prog(t, SHOT.E, SHOT.F);
      return {pos: lerp3(v3(0.32, 1.08, 1.3), v3(0.4, 1.04, 1.45), k), tgt: lerp3(v3(-0.32, 0.8, 3.1), v3(-0.22, 0.82, 3.1), k), f: lerp(1000, 1080, k), up: v3(0, 1, 0)};
    }
    case 'F': {
      const k = prog(t, SHOT.F, SHOT.G + 0.4);
      const g = guardPos(t);
      const fh = floatHandPos(t);
      return {pos: v3(g.x + 0.42, 1.95, g.z + 1.0), tgt: lerp3(v3(fh.x - 0.12, fh.y + 0.04, fh.z), fh, k), f: lerp(1500, 1650, k), up: v3(0, 1, 0)};
    }
    case 'G': return orbitCam(orbitAt(t, memo('G', G_KEYS)));
    default: {
      // the swoop into the chase: from the side two-shot to the chase camera, which then carries over the loop
      const side = orbitCam(orbitAt(SHOT.H, memo('G', G_KEYS)));
      const k = prog(t, SHOT.H, 28.95);
      return mixCam({...side, up: v3(0, 1, 0)}, {...chaseCam(herZ(t)), up: v3(0, 1, 0)}, k);
    }
  }
};
export const sectionCut = (t: number) => {
  // the panel above the cut plane slices away as the camera starts over the edge, and returns as it comes back down
  const out = prog(t, 8.15, 8.75), back = prog(t, 13.45, 13.72);
  const k = out * (1 - back);
  return 0.5 - (0.5 - 0.06) * (1 - Math.pow(1 - k, 4));
};
export const inSection = (t: number) => t > 8.12 && t < 13.75;
export const ceilingCut = (t: number) => t > 8.6 && t < 13.55;
export const DIM = {W: DIM_W3, G: DIM_G3};
export {SH};
