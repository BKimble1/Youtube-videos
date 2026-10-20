// V2 choreography: every animated quantity as a pure function of time (seconds). Word times come from the unchanged
// narration (lib/timeline.ts); every beat below is tied to one of them. One world, one camera, but the camera visits
// very different places in it: the sender's crown (window, implant, threads, cortex, decoder), the throat, the room
// two-shot, the receiver, the cancel control. Cuts are explicit camera segments.
import {T, WORDS} from '../lib/timeline';
import {clamp, easeIn, easeInOut, easeOut, inv, lerp, rot, smooth, V} from '../lib/math';
import {Expr, EXPR_GASP, EXPR_PAIN, EXPR_WINCE, mixExpr} from '../art/Head';
import {RouteGeo, routePoint} from '../art/Ui';
import {X0, topY, pulsePt, THREADS} from './art/Column';
import type {ColPulse, DecPulse} from './art/Column';

export const FPS = 30;
export const DUR = 28.0;
export const TOTAL2 = 840;

// ---- layout (world px) ---------------------------------------------------------------------------------------------
export const SC: V = {x: 260, y: 800};
export const SR = 130;
export const SU = SR / 100;
export const RC: V = {x: 860, y: 880};
export const RR = 135;
export const CARD_C: V = {x: 585, y: 790};
export const UNDO_C: V = {x: 365, y: 1140};
export const WARN_C: V = {x: 565, y: 1005};
export const HEYQ_C: V = {x: 480, y: 828};

const sm = (a: number, b: number, t: number) => {
  const x = clamp((t - a) / (b - a || 1));
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number, fi = 0.2, fo = 0.2) => sm(a, a + fi, t) * (1 - sm(b - fo, b, t));
const lin = (a: number, b: number, t: number) => clamp((t - a) / (b - a || 1));

// ---- beats (seconds) -----------------------------------------------------------------------------------------------
export const V2 = {
  // hook
  pushFrom: 0.7,
  macroAt: 1.3,
  decHook: [0.95, 1.45] as [number, number],
  hookOut: 1.45,
  hookArrive: 2.34,
  // neck
  neckOpen: [3.55, 4.0] as [number, number],
  neckClose: [4.95, 5.4] as [number, number],
  // reading, motor cortex, translating
  dive: [5.65, 6.45] as [number, number],
  motorGlow: [6.95, 8.05] as [number, number],
  dec2: [8.72, 10.0] as [number, number],
  normalOut: 10.0,
  recvCut: 10.3,
  recvArrive: 10.82,
  // until
  redAt: 13.15,
  decRed: [13.95, 14.95] as [number, number],
  silhouette: [14.5, 14.77] as [number, number],
  redOut: 14.95,
  warn: [15.45, 16.6] as [number, number],
  // cancel
  reachFrom: 19.85,
  tapDenied: 21.05,
  // equivalence
  pipeBlue: [21.9, 22.7] as [number, number],
  pipeRed: [22.25, 23.05] as [number, number],
  // delivery
  recvCut2: 24.55,
  redArrive: 25.95,
  recognise: 26.2,
  recoil: [26.25, 26.95] as [number, number],
  lateTap: 27.22,
  loopCut: 27.4,
};
void T;
void WORDS;

// ---- camera --------------------------------------------------------------------------------------------------------
export type Cam = {x: number; y: number; z: number};
const hwc = (xl: number, yl: number, z: number): Cam => ({x: SC.x + SU * xl, y: SC.y + SU * yl, z});
export const HEAD: Cam = hwc(-6, -62, 3.5);
const MACRO: Cam = hwc(X0, -93, 14);
const THREADS_CAM: Cam = hwc(X0 + 3, -74, 12);
const CORTEX_CAM: Cam = hwc(X0 + 9, -60, 13.5);
const DEC_CAM: Cam = hwc(X0, -96, 20);
const TWO: Cam = {x: 540, y: 905, z: 1.0};
const NECK_CAM: Cam = {x: 251, y: 955, z: 3.5};
const RCU: Cam = {x: 720, y: 850, z: 2.0};
export const ROUTE_NOMINAL: RouteGeo = {A: {x: SC.x + SU * X0, y: SC.y + SU * -113}, C1: {x: 262, y: 410}, C2: {x: 560, y: 380}, B: {x: CARD_C.x, y: CARD_C.y - 100}};

type Seg = {t0: number; t1: number; a: Cam; b: Cam; e?: (t: number) => number; follow?: boolean};
const lnz = Math.log;
const camSeg = (s: Seg, t: number): Cam => {
  const e = s.e ?? easeInOut;
  const u = e(clamp((t - s.t0) / (s.t1 - s.t0)));
  const z = Math.exp(lerp(lnz(s.a.z), lnz(s.b.z), u));
  const r = Math.abs(lnz(s.b.z / s.a.z));
  if (r < 0.15) return {x: lerp(s.a.x, s.b.x, u), y: lerp(s.a.y, s.b.y, u), z};
  // zoom about the point that stays still on screen
  const Fx = (s.b.x * s.b.z - s.a.x * s.a.z) / (s.b.z - s.a.z);
  const Fy = (s.b.y * s.b.z - s.a.y * s.a.z) / (s.b.z - s.a.z);
  return {x: Fx + (s.a.x - Fx) * (s.a.z / z), y: Fy + (s.a.y - Fy) * (s.a.z / z), z};
};
const hold = (t0: number, t1: number, c: Cam): Seg => ({t0, t1, a: c, b: c});
const SEGS: Seg[] = [
  {t0: 0, t1: 0.7, a: HEAD, b: hwc(-6, -63, 3.9), e: easeInOut},
  {t0: 0.7, t1: 1.3, a: hwc(-6, -63, 3.9), b: MACRO, e: easeInOut},
  {t0: 1.3, t1: 1.5, a: MACRO, b: hwc(X0, -96, 13.2), e: smooth},
  {t0: 1.5, t1: 2.4, a: hwc(X0, -96, 13.2), b: TWO, e: easeInOut, follow: true},
  {t0: 2.4, t1: 3.1, a: TWO, b: {x: 535, y: 902, z: 1.05}, e: (u) => u},
  {t0: 3.1, t1: 3.75, a: {x: 535, y: 902, z: 1.05}, b: NECK_CAM, e: easeInOut},
  {t0: 3.75, t1: 5.0, a: NECK_CAM, b: {x: 251, y: 950, z: 3.7}, e: (u) => u},
  {t0: 5.0, t1: 5.65, a: {x: 251, y: 950, z: 3.7}, b: HEAD, e: easeInOut},
  {t0: 5.65, t1: 6.45, a: HEAD, b: THREADS_CAM, e: easeInOut},
  {t0: 6.45, t1: 8.0, a: THREADS_CAM, b: CORTEX_CAM, e: smooth},
  {t0: 8.0, t1: 8.75, a: CORTEX_CAM, b: hwc(X0, -85, 16), e: easeInOut},
  {t0: 8.75, t1: 9.15, a: hwc(X0, -85, 16), b: DEC_CAM, e: easeInOut},
  {t0: 9.15, t1: 10.0, a: DEC_CAM, b: hwc(X0, -96, 21), e: (u) => u},
  {t0: 10.0, t1: 10.3, a: hwc(X0, -96, 21), b: hwc(X0 + 10, -120, 11), e: easeIn},
  {t0: 10.3, t1: 11.1, a: RCU, b: {x: 712, y: 852, z: 2.05}, e: (u) => u},
  {t0: 11.1, t1: 11.6, a: {x: 712, y: 852, z: 2.05}, b: TWO, e: easeInOut},
  {t0: 11.6, t1: 13.1, a: TWO, b: {x: 545, y: 900, z: 1.12}, e: (u) => u},
  {t0: 13.1, t1: 13.95, a: hwc(X0 + 3, -76, 12), b: hwc(X0 + 3, -78, 12.5), e: (u) => u},
  {t0: 13.95, t1: 14.5, a: hwc(34, -18, 3.9), b: hwc(34, -18, 4.2), e: (u) => u},
  hold(14.5, 14.97, DEC_CAM),
  {t0: 14.97, t1: 15.45, a: DEC_CAM, b: {x: 450, y: 900, z: 1.8}, e: easeInOut},
  {t0: 15.45, t1: 16.7, a: {x: 450, y: 900, z: 1.8}, b: {x: 520, y: 905, z: 1.0}, e: easeInOut},
  {t0: 16.7, t1: 18.0, a: hwc(30, -20, 3.5), b: hwc(30, -20, 3.8), e: (u) => u},
  {t0: 18.0, t1: 19.85, a: {x: 380, y: 790, z: 2.2}, b: {x: 405, y: 775, z: 2.25}, e: (u) => u},
  {t0: 19.85, t1: 21.45, a: {x: 330, y: 1070, z: 2.3}, b: {x: 340, y: 1085, z: 2.4}, e: (u) => u},
  {t0: 21.45, t1: 21.84, a: {x: 300, y: 900, z: 1.5}, b: {x: 300, y: 900, z: 1.55}, e: (u) => u},
  {t0: 21.84, t1: 23.0, a: hwc(X0, -96, 17), b: hwc(X0, -98, 17.6), e: (u) => u},
  {t0: 23.0, t1: 24.55, a: {x: 470, y: 880, z: 1.2}, b: {x: 500, y: 885, z: 1.28}, e: (u) => u},
  {t0: 24.55, t1: 25.75, a: RCU, b: {x: 722, y: 850, z: 2.05}, e: (u) => u},
  {t0: 25.75, t1: 26.8, a: {x: 722, y: 850, z: 2.05}, b: {x: 726, y: 850, z: 2.0}, e: (u) => u},
  {t0: 26.8, t1: 27.4, a: {x: 726, y: 850, z: 2.0}, b: {x: 600, y: 890, z: 1.2}, e: easeInOut},
  {t0: 27.4, t1: 28.0001, a: hwc(X0, -100, 14), b: HEAD, e: easeOut},
];
export const camAt2 = (t: number): Cam => {
  const s = SEGS.find((q) => t >= q.t0 && t < q.t1) ?? SEGS[SEGS.length - 1];
  const c = camSeg(s, t);
  if (s.follow) {
    // follow the packet: the centre starts on it and settles on the destination framing
    const P = routePoint(routeAt2(t), hookU(t));
    const w = smooth(lin(s.t0 + 0.05, s.t1, t));
    return {x: lerp(P.x, s.b.x, w), y: lerp(P.y, s.b.y, w), z: c.z};
  }
  return c;
};
/** is this frame the first of a new shot (a hard cut)? used by the layout/cut checks */
export const CUTS = SEGS.map((s) => s.t0).filter((t) => t > 0);

// ---- the sender ----------------------------------------------------------------------------------------------------
export type SenderPose = {roll: number; shiftX: number; shiftY: number; reach: number; press: number; sway: number; lean: number};
export const senderPose = (t: number): SenderPose => {
  const tense = sm(13.5, 14.2, t) * (1 - sm(15.0, 15.6, t) * 0.4) * (1 - sm(27.4, 27.8, t));
  const wince = win(t, 14.75, 16.0, 0.2, 0.7);
  const shake = win(t, 16.2, 19.7, 0.5, 0.5) * Math.sin(t * 19) * 0.8 + win(t, 19.6, 21.3, 0.2, 0.3) * Math.sin(t * 21) * 0.9;
  const dread = sm(21.45, 22.2, t) * (1 - sm(27.4, 27.8, t)); // eased out under the closing macro so the loop seam is exact
  const reach = Math.max(sm(V2.reachFrom - 0.1, V2.reachFrom + 0.6, t) * (1 - sm(21.4, 21.9, t)), sm(26.85, 27.15, t) * (1 - sm(27.5, 27.9, t)));
  const press = Math.max(win(t, V2.tapDenied - 0.1, V2.tapDenied + 0.28, 0.1, 0.18), win(t, V2.lateTap - 0.1, V2.lateTap + 0.26, 0.1, 0.16));
  return {
    roll: -1.0 + 4 * tense + 3 * wince + 1.6 * shake + 2.5 * dread + 0.5 * Math.sin((2 * Math.PI * t) / 7),
    shiftX: -2 * wince - 5 * dread,
    shiftY: -5 * tense + 6 * wince + 4 * dread,
    reach: clamp(reach),
    press: clamp(press),
    sway: 2.2 * Math.sin((2 * Math.PI * t) / 3.5 + 0.4) + 6 * wince * Math.sin(t * 15) * 0.5 + 4 * shake,
    lean: 6 * sm(2.2, 2.6, t) * (1 - sm(3.1, 3.5, t)) - 8 * dread,
  };
};
/** a head-space point (units) in world px for the sender at time t */
export const headW = (p: V, t: number): V => {
  const s = senderPose(t);
  const hc = {x: SC.x + s.shiftX * 0.7 + s.lean * 0.8, y: SC.y + s.shiftY * 0.7};
  const r = rot({x: p.x * SU, y: p.y * SU}, s.roll);
  return {x: hc.x + r.x, y: hc.y + r.y};
};
export const lensW = (t: number): V => headW({x: X0, y: topY(X0) - 6}, t);

const E = (o: Partial<Expr>, b: Expr): Expr => ({...b, ...o});
const BASE: Expr = {browIn: 0.05, browDown: 0, lid: 0.02, squint: 0, shut: 0, pupil: 1, open: 0, wide: 1, smile: 0.1, teeth: 0, tongue: 0, gx: 0.35, gy: 0, sweat: 0, flush: 0.1};
const S_FOCUS = E({smile: 0.12, gx: 0.4, lid: 0.04}, BASE);
const S_PLEASED = E({smile: 0.55, gx: 0.45, squint: 0.15, flush: 0.2, browIn: 0}, BASE);
const S_EASY = E({smile: 0.4, gx: 0.35, lid: 0.03}, BASE);
const S_LOCK = E({smile: -0.2, gx: 0.6, gy: 0.0, pupil: 0.78, browIn: 0.35, browDown: 0.45, lid: 0.0, teeth: 0}, BASE);
const S_ALARM = E({smile: -0.45, gx: 0.55, pupil: 0.68, browIn: 0.85, browDown: 0.2, lid: 0, sweat: 0.45, flush: 0.2}, BASE);
const S_WINCE = E({...EXPR_WINCE, gx: 0, sweat: 0.85}, BASE);
const S_PAIN = E({...EXPR_PAIN, lid: 0, squint: 0.1, shut: 0, pupil: 0.62, browIn: 1, browDown: 0.1, teeth: 0, open: 0, smile: -0.55, sweat: 0.9, gx: 0.45}, BASE);
const S_DREAD = E({browIn: 0.95, browDown: 0.1, lid: 0, smile: -0.5, pupil: 0.66, gx: 0.55, gy: 0.2, sweat: 0.8, flush: 0.3, teeth: 0}, BASE);
const S_CHIP = E({browIn: 0.9, browDown: 0.15, lid: 0, smile: -0.45, pupil: 0.7, gx: 0.05, gy: 1.0, sweat: 0.8, flush: 0.3}, BASE);
const S_GASP = E({...EXPR_GASP, gx: 0.4, sweat: 0.8}, BASE);

type EK = [number, Expr];
const exprTrack = (t: number, keys: EK[]): Expr => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i];
    const [t1, b] = keys[i + 1];
    if (t <= t1) return mixExpr(a, b, sm(t0, t1, t));
  }
  return keys[keys.length - 1][1];
};
export const senderExpr = (t: number): Expr =>
  exprTrack(t, [
    [0, S_FOCUS],
    [2.0, S_FOCUS],
    [2.55, S_PLEASED],
    [3.3, S_EASY],
    [11.0, S_EASY],
    [11.4, S_PLEASED],
    [12.9, S_PLEASED],
    [13.2, S_EASY],
    [13.55, S_LOCK],
    [14.2, S_ALARM],
    [14.6, S_ALARM],
    [14.85, S_WINCE],
    [15.9, S_WINCE],
    [16.6, S_PAIN],
    [17.9, S_PAIN],
    [18.4, S_DREAD],
    [19.8, S_DREAD],
    [20.1, S_WINCE],
    [20.5, S_WINCE],
    [20.8, S_CHIP],
    [21.4, S_CHIP],
    [21.8, S_DREAD],
    [22.5, S_DREAD],
    [24.5, S_GASP],
    [27.0, S_GASP],
    [27.5, S_FOCUS],
  ]);

export const blink = (t: number, seed: number) => {
  const period = 2.9 + ((seed * 37) % 10) / 10;
  const ph = (t + ((seed * 53) % 100) / 100 * period) % period;
  const d = ph / (5 / FPS);
  // no blink in the opening or at the seam (the frame-0 eyes are open), nor during a wince
  if (t < 0.6 || t > 27.4 || (t > 24.5 && t < 27.0)) return 0;
  return d >= 0 && d <= 1 ? Math.sin(Math.PI * d) : 0;
};

// ---- the receiver --------------------------------------------------------------------------------------------------
const R_BASE: Expr = {browIn: 0.1, browDown: 0, lid: 0.1, squint: 0, shut: 0, pupil: 1, open: 0.03, wide: 1, smile: 0.3, teeth: 0, tongue: 0, gx: -0.2, gy: 0, sweat: 0, flush: 0.1};
const R_CALM = E({gx: -0.2, smile: 0.25, browIn: 0.05, lid: 0.08}, R_BASE);
const R_NOTICE = E({gx: -0.8, gy: -0.1, browIn: 0.5, pupil: 1.05, open: 0.1, smile: 0.2, lid: 0}, R_BASE);
const R_SMILE = E({gx: -0.6, smile: 0.9, open: 0.22, teeth: 0.45, squint: 0.3, browIn: 0.1, flush: 0.3}, R_BASE);
const R_EASY = E({gx: -0.3, smile: 0.55, browIn: 0.05, lid: 0.1, flush: 0.2}, R_BASE);
const R_TRACK = E({gx: -0.75, gy: -0.2, smile: 0.2, browIn: 0.45, open: 0.06, lid: 0.02}, R_BASE);
const R_RECOG = E({...EXPR_GASP, gx: -0.75, gy: -0.1, pupil: 0.55, open: 0.4, smile: -0.6, sweat: 0.2, browIn: 0.9}, R_BASE);
const R_DRAW = E({browIn: 1, browDown: 0.35, lid: 0.0, pupil: 0.62, open: 0.32, smile: -0.7, gx: -0.5, gy: 0, sweat: 0.7, flush: 0.5, teeth: 0.2}, R_BASE);
export const receiverExpr = (t: number): Expr =>
  exprTrack(t, [
    [0, R_CALM],
    [V2.hookArrive - 0.35, R_CALM],
    [V2.hookArrive, R_NOTICE],
    [V2.hookArrive + 0.35, R_SMILE],
    [3.5, R_EASY],
    [10.1, R_EASY],
    [V2.recvArrive - 0.25, R_NOTICE],
    [V2.recvArrive + 0.2, R_SMILE],
    [11.7, R_EASY],
    [24.4, R_EASY],
    [24.95, R_TRACK],
    [V2.redArrive + 0.05, R_TRACK],
    [V2.recognise + 0.3, R_RECOG],
    [V2.recoil[0] + 0.5, R_DRAW],
    [28.0, R_DRAW],
  ]);
export const receiverPose = (t: number) => {
  const nod = win(t, V2.hookArrive + 0.1, V2.hookArrive + 0.65, 0.15, 0.3) + win(t, V2.recvArrive + 0.08, V2.recvArrive + 0.6, 0.15, 0.3);
  const lean = win(t, 24.9, 26.1, 0.5, 0.2); // leans in to read
  const recoil = sm(V2.recoil[0], V2.recoil[0] + 0.32, t) * (1 - 0.3 * sm(V2.recoil[0] + 0.7, V2.recoil[1] + 0.6, t));
  return {
    roll: 1.0 * Math.sin((2 * Math.PI * t) / 8) + 2.0 * nod - 6 * recoil,
    turn: 0.55 + 0.12 * recoil,
    shiftX: -10 * lean + 52 * recoil,
    shiftY: 4 * nod + 3 * lean + 16 * recoil,
    scale: 1 - 0.055 * recoil,
  };
};

// ---- the route and the packets -------------------------------------------------------------------------------------
export const routeAt2 = (t: number): RouteGeo => {
  const A = lensW(t);
  return {A, C1: {x: A.x + 10, y: A.y - 240}, C2: {x: CARD_C.x - 25, y: CARD_C.y - 420}, B: {x: CARD_C.x, y: CARD_C.y - 100}};
};
/** u along the route of each packet */
export const hookU = (t: number) => easeInOut(lin(V2.hookOut + 0.05, V2.hookArrive, t));
export const normalU = (t: number) => {
  if (t < V2.normalOut) return 0;
  if (t < 10.22) return 0.05 * easeIn(lin(V2.normalOut, 10.22, t));
  if (t < V2.recvCut) return lerp(0.05, 0.72, lin(10.22, V2.recvCut, t));
  return lerp(0.72, 1, easeOut(lin(V2.recvCut, V2.recvArrive, t)));
};
const RED_KEYS: [number, number][] = [
  [V2.redOut, 0],
  [16.0, 0.05],
  [19.0, 0.3],
  [21.0, 0.42],
  [23.0, 0.62],
  [24.7, 0.83],
  [V2.redArrive, 1],
];
export const redU = (t: number) => {
  if (t <= RED_KEYS[0][0]) return 0;
  for (let i = 0; i < RED_KEYS.length - 1; i++) {
    const [t0, a] = RED_KEYS[i];
    const [t1, b] = RED_KEYS[i + 1];
    if (t <= t1) return lerp(a, b, smooth(lin(t0, t1, t)));
  }
  return 1;
};
/** which packets exist, as alpha */
export const hookAlpha = (t: number) => (t > V2.hookOut - 0.02 && t < V2.hookArrive + 0.02 ? 1 - sm(V2.hookArrive - 0.08, V2.hookArrive + 0.02, t) : 0);
export const normalAlpha = (t: number) => (t > V2.normalOut - 0.02 && t < V2.recvArrive + 0.02 ? 1 - sm(V2.recvArrive - 0.1, V2.recvArrive + 0.02, t) : 0);
export const redAlpha = (t: number) => (t > V2.redOut - 0.02 && t < V2.redArrive + 0.02 ? 1 - sm(V2.redArrive - 0.1, V2.redArrive + 0.02, t) : 0);
/** the route line: faint while a packet is on it */
export const routeAlpha = (t: number) => Math.max(win(t, V2.hookOut + 0.1, V2.hookArrive + 0.5, 0.2, 0.4), win(t, 11.7, 13.1, 0.3, 0.3) * 0.6, win(t, V2.redOut + 0.1, V2.redArrive + 0.2, 0.3, 0.2) * 0.9);
export const routeRed = (t: number) => sm(V2.redOut, V2.redOut + 0.2, t) * (1 - sm(V2.redArrive + 0.1, V2.redArrive + 0.3, t));
/** tiny orbs sliding along the route while it is calm (the live link) */
export const linkOrbs = (t: number): number[] => {
  if (t < 11.7 || t > 13.1) return [];
  const out: number[] = [];
  const P = 0.55;
  for (let n = 0; n < 4; n++) {
    const u = ((t - 11.7) / P - n) / 1.5;
    if (u > 0 && u < 1) out.push(u);
  }
  return out;
};
/** the intended "Hey" that is left waiting beside the sender */
export const heyQueued = (t: number) => win(t, 22.95, 24.55, 0.35, 0.3);

// ---- interface -----------------------------------------------------------------------------------------------------
export const arCard = (t: number) => {
  // hook message
  const hookIn = win(t, V2.hookArrive - 0.25, 3.15, 0.25, 0.25);
  const hookMsg = sm(V2.hookArrive, V2.hookArrive + 0.15, t);
  // the dark message
  const redIn = win(t, 25.4, 27.45, 0.3, 0.3);
  const typing = redIn > 0 ? 1 - sm(V2.redArrive - 0.05, V2.redArrive + 0.1, t) : 1 - hookMsg;
  const redMsg = sm(V2.redArrive, V2.redArrive + 0.14, t);
  const alpha = Math.max(hookIn, redIn);
  const red = sm(V2.redArrive - 0.05, V2.redArrive + 0.12, t);
  const msg = redIn > hookIn ? redMsg : hookMsg;
  const done = sm(26.1, 26.25, t) * redIn;
  return {alpha, red, typing: typing * alpha, msg: msg * alpha, done, sil: red, pulse: done * (1 - done) * 2, tick: t};
};
export const undoChip = (t: number) => {
  // "undo send": established after the first message (a short grace ring that drains), then spent for the dark one
  const first = win(t, 2.3, 3.25, 0.15, 0.3);
  const second = Math.max(win(t, 15.85, 16.9, 0.15, 0.5), win(t, 19.8, 21.7, 0.2, 0.3), win(t, 26.9, 27.55, 0.15, 0.25));
  const alpha = Math.max(first, second);
  const isFirst = t < 6;
  const prog = isFirst ? 1 : clamp(0.55 * smooth(lin(V2.redOut, 15.25, t)) + 0.42 * redU(t));
  const ring = isFirst ? 1 - lin(2.35, 3.15, t) : 0;
  return {
    alpha,
    ring,
    spent: isFirst ? 0 : 1,
    press: clamp(senderPose(t).press),
    shake: win(t, V2.tapDenied, V2.tapDenied + 0.35, 0.02, 0.3) + win(t, V2.lateTap, V2.lateTap + 0.35, 0.02, 0.3),
    prog,
    red: isFirst ? 0 : 1,
    showTrack: 1,
  };
};
export const warnCard = (t: number) => ({alpha: win(t, V2.warn[0], V2.warn[1], 0.15, 0.25), blink: sm(V2.warn[0], V2.warn[0] + 0.1, t) * (0.5 + 0.5 * Math.sin((t - V2.warn[0]) * 18)) * (1 - sm(V2.warn[1] - 0.4, V2.warn[1], t))});
/** the dark bust interrupts the internal imagery for ~0.27 s (8 frames) */
export const silhouetteFlash = (t: number) => {
  const [a, b] = V2.silhouette;
  if (t < a || t > b) return 0;
  return Math.min(1, (t - a) / 0.05) * Math.min(1, (b - t) / 0.05);
};

// ---- the column (head interior) ------------------------------------------------------------------------------------
export const aperture = (t: number): number => {
  if (t < 0.7) return lerp(0.6, 1.0, easeOut(t / 0.7)) * 1;
  if (t < 1.3) return lerp(1.0, 1.9, easeInOut(lin(0.7, 1.3, t)));
  if (t < 1.5) return 1.9;
  if (t < 2.3) return 1.9 * (1 - easeInOut(lin(1.5, 2.3, t)));
  if (t < 5.42) return 0;
  if (t < 5.65) return lerp(0, 0.7, easeInOut(lin(5.42, 5.65, t)));
  if (t < 6.2) return lerp(0.7, 1.9, easeInOut(lin(5.65, 6.2, t)));
  if (t < 10.3) return 1.9;
  if (t < 13.1) return 0;
  if (t < 13.95) return 1.9;
  if (t < 14.5) return 0;
  if (t < 15.0) return 1.9;
  if (t < 15.45) return 1.9 * (1 - easeInOut(lin(15.0, 15.45, t)));
  if (t < 21.84) return 0;
  if (t < 23.0) return 1.9;
  if (t < 27.4) return 0;
  if (t < 27.6) return lerp(1.9, 1.0, easeInOut(lin(27.4, 27.6, t)));
  return lerp(1.0, 0.6, easeOut(lin(27.6, 28.0, t)));
};

export const neckOpenAt = (t: number) => sm(V2.neckOpen[0], V2.neckOpen[1], t) * (1 - sm(V2.neckClose[0], V2.neckClose[1], t));
/** the folds stay inactive; a soft ring marks them once, then they cool as attention leaves */
export const neckMark = (t: number) => win(t, 4.2, 5.0, 0.3, 0.5);

type Ev = {k: number; t0: number; dur: number; red?: number; r?: number; a?: number};
const EVENTS: Ev[] = [];
// the thought that becomes the first message
EVENTS.push({k: 4, t0: 0.4, dur: 0.6, r: 1.6});
// reading neural impulses (hero pulses on several threads)
[3, 5, 4, 2, 3, 5, 4, 3].forEach((k, i) => EVENTS.push({k, t0: 5.95 + i * 0.16, dur: 0.6, r: 1.25}));
// the motor-cortex strip: the same three threads, again and again
for (let i = 0; i < 6; i++) EVENTS.push({k: [3, 4, 5][i % 3], t0: 7.1 + i * 0.2, dur: 0.55, r: 1.35});
// translating: one hero pulse climbs to the stem
EVENTS.push({k: 4, t0: 8.0, dur: 0.72, r: 1.7});
// the anomaly: one red impulse on the same thread the blue ones use
EVENTS.push({k: 5, t0: V2.redAt, dur: 0.8, red: 1, r: 1.7});
// calm blue traffic under it
for (let i = 0; i < 4; i++) EVENTS.push({k: [3, 4, 5, 3][i], t0: 13.1 + i * 0.25 - 0.45, dur: 0.55, r: 1.2, a: 1 - sm(13.55, 13.95, 13.1 + i * 0.25 - 0.45 + 0.4)});

const OPEN_P = 0.35;
const OPEN_K = [3, 5, 4, 3, 5];
const streamOpening = (t: number): ColPulse[] => {
  const out: ColPulse[] = [];
  for (let n = Math.floor((t - 0.7) / OPEN_P); n <= Math.floor(t / OPEN_P); n++) {
    const s0 = n * OPEN_P;
    const u = (t - s0) / 0.7;
    if (u < 0 || u > 1) continue;
    out.push({k: OPEN_K[((n % 5) + 5) % 5], u, r: 1.25, a: 1});
  }
  return out;
};

export type ColState = {pulses: ColPulse[]; dec: DecPulse[]; glow: number; dim: number; lens: number; lensRed: number; distort: number; gates: number[]; active: number[]};
export const colState = (t: number): ColState => {
  const pulses: ColPulse[] = [];
  // opening and loop-return stream (periodic: the seam is invisible)
  const open = (1 - sm(1.0, 1.15, t)) * 1;
  if (open > 0.01 && t < 1.2) for (const p of streamOpening(t)) pulses.push({...p, a: (p.a ?? 1) * open});
  if (t > 27.55) for (const p of streamOpening(t - DUR)) pulses.push({...p, a: (p.a ?? 1) * sm(27.55, 27.75, t)});
  for (const e of EVENTS) {
    const u = (t - e.t0) / e.dur;
    if (u < 0 || u > 1) continue;
    pulses.push({k: e.k, u, red: e.red ?? 0, r: e.r ?? 1.2, a: e.a ?? 1});
  }
  // decoder pulses
  const dec: DecPulse[] = [];
  const D = (a: number, b: number, red = 0, jag = 1) => {
    if (t >= a && t <= b + 0.12) dec.push({u: lin(a, b, t), red, jag, a: 1 - sm(b + 0.02, b + 0.12, t)});
  };
  D(V2.decHook[0], V2.decHook[1]);
  D(V2.dec2[0], V2.dec2[1]);
  D(V2.decRed[0], V2.decRed[1], 1, 1.6);
  D(V2.pipeBlue[0], V2.pipeBlue[1]);
  D(V2.pipeRed[0], V2.pipeRed[1], 1, 1);
  // the gates flash as any decoder pulse passes them: identical treatment for every message
  const gu = [0.264, 0.399, 0.534];
  const gates = gu.map((g) => Math.max(0, ...dec.map((d) => Math.max(0, 1 - Math.abs(d.u - g) / 0.07))));
  // active neurons: those whose pulse has just left, and the motor-cortex trio
  const active = THREADS.map((_, k) => {
    let a = 0;
    for (const e of EVENTS) {
      if (e.k !== k) continue;
      const u = (t - e.t0) / e.dur;
      if (u > -0.1 && u < 0.45) a = Math.max(a, sm(-0.1, 0.05, u) * (1 - sm(0.2, 0.45, u)) * (e.red ? 1 : 0.9));
    }
    return a;
  });
  const motor = win(t, V2.motorGlow[0], V2.motorGlow[1], 0.3, 0.3);
  [3, 4, 5].forEach((k) => (active[k] = Math.max(active[k], 0.55 * motor)));
  const intr = sm(13.3, 13.9, t) * (1 - sm(14.6, 15.0, t));
  const lensExit = (a: number) => Math.max(0, 1 - Math.abs(t - a) / 0.2);
  const lens = clamp(0.55 + 0.25 * Math.sin(t * 8) * 0 + 0.45 * Math.max(lensExit(V2.decHook[1]), lensExit(V2.dec2[1]), lensExit(V2.redOut), lensExit(V2.pipeBlue[1]), lensExit(V2.pipeRed[1])) + 0.3 * (1 - sm(27.4, 28.0, t)) * (t > 27.4 ? 1 : 0));
  const lensRed = Math.max(sm(V2.redAt, V2.redAt + 0.8, t) * (1 - sm(15.6, 16.0, t)), sm(21.9, 22.3, t) * (1 - sm(23.0, 23.1, t)) * 0, sm(26.8, 27.0, t) * (1 - sm(27.55, 27.85, t)));
  return {pulses, dec, glow: motor, dim: 0.5 * motor + 0.5 * intr, lens, lensRed, distort: intr, gates, active};
};

// ---- receiver gaze -------------------------------------------------------------------------------------------------
export const receiverEye = (t: number): V => {
  const p = receiverPose(t);
  return {x: RC.x + p.shiftX * 0.8 - 8, y: RC.y + p.shiftY * 0.8 - 14};
};
export const receiverGaze2 = (t: number) => {
  const r = routeAt2(t);
  let target: V = CARD_C;
  let w = 0;
  const w1 = win(t, V2.hookOut + 0.1, 3.4, 0.3, 0.3);
  const w2 = win(t, V2.normalOut + 0.1, V2.recvArrive + 0.9, 0.15, 0.3);
  const w3 = win(t, 24.6, 27.2, 0.3, 0.3);
  if (w1 > 0) {
    target = t < V2.hookArrive ? routePoint(r, hookU(t)) : CARD_C;
    w = w1;
  }
  if (w2 > w) {
    target = t < V2.recvArrive ? routePoint(r, normalU(t)) : CARD_C;
    w = w2;
  }
  if (w3 > w) {
    target = t < V2.redArrive ? routePoint(r, redU(t)) : CARD_C;
    w = w3;
  }
  const eye = receiverEye(t);
  return {gx: clamp((target.x - eye.x) / 260, -1, 1), gy: clamp((target.y - eye.y) / 260, -1, 1), w};
};

export { pulsePt };

/** the localized source region (motor-cortex strip) in world px, and the tag that names it once */
export const glowWorld = (t: number): V => headW({x: X0 + 14, y: topY(X0 + 14) + 42}, t);
export const motorTagAlpha = (t: number) => win(t, V2.motorGlow[0] + 0.1, V2.motorGlow[1] - 0.15, 0.25, 0.25);
