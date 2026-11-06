// The film's timeline. Every beat is keyed to the measured narration (data/timeline.json) or to the game's own events.
// One camera travels one world: the game monitor, the control monitor and the CL1 on the bench (cm), and, nested in
// the CL1's headstage, the chip and its culture (um). Signals ride the real path: cyan stimulation from the encoder
// through the PC and the cable into the chip, amber recordings out of the chip back to the decoder, then up to the game.
import {ACT, electrode, setActivity} from './micro/culture';
import {CABLE_CL1_PC, CABLE_PC_CTRL, CHIP, CHIP_K, chipK, chipToLab, HEAD_OUT, pt, Pt, ui} from './lab/geo';
import {clamp, lerp, ss, ss5, word} from './lib';
import {filmShots} from './game/script';

export type Cam = {x: number; y: number; w: number};
const W = (s: string, n = 0) => word(s, n).start;
const WE = (s: string, n = 0) => word(s, n).end;

// ------------------------------------------------------------------ word times used below
export const T = {
  doom: W('Doom'), shoot1: W('shoot', 0), scientists: W('Scientists'), cells2: W('cells', 1), head: W('head'),
  chip: W('chip'), game1: W('game', 0), electrical: W('electrical'), into1: W('into', 0), them: W('them'), neurons: W('neurons'),
  fire: W('fire'), software: W('software'), commands: W('commands'), move: W('move'), turn: W('turn'), shoot2: W('shoot', 1),
  terrible: W('terrible'), normal: W('normal'), computer: W('computer'), work: WE('work'), but: W('But'), real: W('real'),
  thisw: W('This'), controller: W('controller'), alive: W('alive'), aliveEnd: WE('alive'),
};

// ------------------------------------------------------------------ activity in the culture (slowed for visibility)
const FIRE = [32, 33, 34], TURN = [29, 30, 31, 37], MOVE = [41, 42, 49], TURNR = [59, 60, 61, 62];
const ENC = [11, 12, 18, 19, 20, 21, 26, 27, 28];
setActivity({
  stims: [
    {t: 1.45, cs: [26, 27, 19], pulses: 3}, // V2 hook: seen through the lens as it opens on the culture
    {t: 3.05, cs: [18, 19, 20, 21], pulses: 2},
    {t: 4.6, cs: [26, 27, 28, 19], pulses: 3}, // the pulse the camera rode down from the encoder
    {t: 12.93, cs: ENC, pulses: 3}, // "...electrical signals into them"
    {t: 20.4, cs: [11, 12, 20], pulses: 2},
    {t: 26.0, cs: [26, 27], pulses: 2},
  ],
  resps: [
    {t: 1.85, cs: FIRE}, // -> the recording rides out 1.95-2.40 -> FIRE decoded 2.38 -> the shot at 2.70
    {t: 3.28, cs: TURN}, // -> the turn at 3.5
    {t: 4.4, cs: FIRE}, // "shoot" -> FIRE decoded 4.70 -> the shot at 5.0
    {t: 5.28, cs: FIRE},
    {t: 13.62, cs: MOVE}, {t: 13.9, cs: TURN}, {t: 14.12, cs: FIRE}, // "...the neurons fire back"
    {t: 17.08, cs: MOVE}, {t: 17.55, cs: TURN}, {t: 18.1, cs: FIRE}, // what the decoder reads for move, turn, shoot
    {t: 19.05, cs: TURNR, p: 0.7}, {t: 19.55, cs: FIRE, p: 0.6}, {t: 20.05, cs: FIRE, p: 0.6}, {t: 21.62, cs: TURN, p: 0.7},
    {t: 21.8, cs: FIRE, p: 0.6}, {t: 22.28, cs: FIRE, p: 0.7},
    {t: 25.55, cs: FIRE, p: 0.9}, // V2 ending: the volley the camera rides out of the chip
    {t: 27.55, cs: FIRE}, // "alive" -> FIRE decoded -> the shot at 28.55, and the loop
  ],
  bursts: [
    {t: 24.75, x: -420, y: 100, speed: 800, radius: 420, p: 0.6}, // V2: as the push arrives on the culture
    {t: T.real - 0.05, x: -360, y: 120, speed: 650, radius: 560, p: 0.8}, // "real"
    {t: 27.38, x: -420, y: 60, speed: 600, radius: 650, p: 0.85}, // "alive"
  ],
});
export {ACT};

// ------------------------------------------------------------------ decoder commands (the lamps on the DECODE panel)
export type CmdKind = 'move' | 'turn' | 'fire';
type Iv = [number, number];
const shots = filmShots();
const CMD: Record<CmdKind, Iv[]> = {
  fire: shots.map((s): Iv => (Math.abs(s.t - 2.7) < 0.01 ? [2.38, 2.82] : Math.abs(s.t - 28.55) < 0.01 ? [28.22, 28.68] : [s.t - 0.3, s.t + 0.12])),
  turn: [[3.42, 4.05], [17.72, 18.12], [19.28, 19.72], [21.45, 21.95], [22.35, 22.5]],
  move: [[5.65, 9.0], [17.24, 17.66], [24, 28.12]],
};
// the frame-0 shots, seen again at the loop
CMD.fire.push([28.72, 29.2], [-0.3, 0.1], [0.0, 0.42]);
export const cmdLevel = (k: CmdKind, t: number) => {
  let v = 0;
  for (const [a, b] of CMD[k]) v = Math.max(v, Math.min(ss(t, a, a + 0.05), 1 - ss(t, b, b + 0.16)));
  return v;
};

// ------------------------------------------------------------------ signal routes
export type RouteKind = 'rec' | 'stim' | 'cmd';
type RP = {lab?: Pt; um?: [number, number]};
const lab = (x: number, y: number): RP => ({lab: pt(x, y)});
const um = (x: number, y: number): RP => ({um: [x, y]});
const ringIn: RP[] = [lab(CHIP.x - 4.4, CHIP.y + 0.2), lab(CHIP.x - 2.4, CHIP.y + 4.6 * CHIP_K), lab(CHIP.x + 2.4, CHIP.y + 4.6 * CHIP_K), lab(HEAD_OUT.x, HEAD_OUT.y)];
const pcIn: RP[] = [...CABLE_CL1_PC.map((p) => lab(p.x, p.y)), lab(34.5, -12), lab(37, -24), lab(33.5, -32.2)];
const toCtrl: RP[] = CABLE_PC_CTRL.slice(1).map((p) => lab(p.x, p.y));
export const DEC_FIRE = ui(1324, 786), DEC_TURN = ui(1324, 572), DEC_MOVE = ui(1324, 358), DEC_C = ui(1050, 520);
export const ENC_P = pt(-13.1, -24.5);
/** recording: electrode c's lead -> the carrier pad -> the headstage -> the cable -> the PC -> the decoder */
const recRoute = (c: number, end: Pt, from = 1): RP[] => {
  const e = electrode(c);
  return [...e.lead.slice(from).map((p) => um(p[0], p[1])), ...(e.x < 0 ? ringIn : ringIn.slice(3)), ...pcIn, ...toCtrl, lab(19.6, -30), lab(end.x, end.y)];
};
const stimRoute = (c: number): RP[] => [lab(ENC_P.x, ENC_P.y), lab(ENC_P.x + 4, -19.6), lab(19.6, -19.6), lab(21.2, -24), ...[...toCtrl].reverse().slice(1), lab(CABLE_PC_CTRL[0].x, CABLE_PC_CTRL[0].y), ...[...pcIn].reverse().slice(1), ...[...ringIn].reverse(), ...[...electrode(c).lead].reverse().map((p) => um(p[0], p[1]))];
const cmdRoute = (from: Pt): RP[] => [lab(from.x, from.y), lab(from.x, -42.6), lab(from.x * 0.9, -47.4), lab(from.x * 0.45, -56), lab(0, -61)];
/** a route as lab points for a camera of width w */
export const routePts = (r: RP[], w: number): Pt[] => r.map((p) => (p.lab ? p.lab : chipToLab(p.um![0], p.um![1], w)));
const cum = (p: Pt[]) => {
  const c = [0];
  for (let i = 1; i < p.length; i++) c.push(c[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y));
  return c;
};
export const alongPts = (p: Pt[], s: number): Pt => {
  const c = cum(p);
  if (s <= 0) return p[0];
  for (let i = 1; i < p.length; i++)
    if (s <= c[i]) {
      const u = (s - c[i - 1]) / (c[i] - c[i - 1] || 1);
      return pt(lerp(p[i - 1].x, p[i].x, u), lerp(p[i - 1].y, p[i].y, u));
    }
  return p[p.length - 1];
};
export const routeLen = (p: Pt[]) => cum(p)[p.length - 1];

// ------------------------------------------------------------------ camera
const camUm = (x: number, y: number, wum: number): Cam => ({x: CHIP.x + x * 1e-4, y: CHIP.y + y * 1e-4, w: wum * 1e-4});
const GAME0: Cam = {x: 0, y: -65, w: (35 * 1080) / 1920};
const TWO: Cam = {x: 2, y: -36, w: 64};
const TWO_L: Cam = {x: 0, y: -34, w: 66};
const LAB_WIDE: Cam = {x: 8, y: -46, w: 140};
const SCREENS: Cam = {x: 2, y: -50, w: 60};
const GAME_F: Cam = {x: 0, y: -63, w: 50};
const LAB_COMP: Cam = {x: 12, y: -30, w: 98};

/** pure zoom about the one point both framings share */
const zoomAbout = (u: number, A: Cam, B: Cam, e = ss5(u, 0, 1)): Cam => {
  const wv = Math.exp(lerp(Math.log(A.w), Math.log(B.w), e));
  if (Math.abs(A.w - B.w) < 1e-9) return {x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), w: wv};
  const px = (A.x / A.w - B.x / B.w) / (1 / A.w - 1 / B.w), py = (A.y / A.w - B.y / B.w) / (1 / A.w - 1 / B.w);
  return {x: px + (A.x - px) * (wv / A.w), y: py + (A.y - py) * (wv / A.w), w: wv};
};
/** zoom in to B while a target point (which B centres) slides from where it sits in A to the frame centre */
const zoomTo = (u: number, A: Cam, B: Cam, e = ss(u, 0, 1), e2 = ss(u, 0, 0.75)): Cam => {
  const wv = Math.exp(lerp(Math.log(A.w), Math.log(B.w), e));
  const ox = (B.x - A.x) / A.w, oy = (B.y - A.y) / A.w; // the target's offset in A, in frame widths
  const k = 1 - e2;
  return {x: B.x - ox * k * wv, y: B.y - oy * k * wv, w: wv};
};
const travel = (u: number, A: Cam, B: Cam, e = ss5(u, 0, 1)): Cam => ({x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), w: Math.exp(lerp(Math.log(A.w), Math.log(B.w), e))});
/** ride a signal: the camera centres the token while the width changes in log space; the distance travelled is
 *  proportional to the change in width, so the token keeps a steady pace on screen at every scale */
type Ride = {kind: RouteKind; r: RP[]; t0: number; t1: number; w0: number; w1: number; ease?: (u: number) => number};
const RIDE_K = 1.2; // frame width per cm of route still to go (or already gone): the camera widens with distance
const rideAt = (rd: Ride, t: number) => {
  const u = clamp((t - rd.t0) / (rd.t1 - rd.t0));
  const e = (rd.ease ?? ((x: number) => ss(x, 0, 1)))(u);
  const inward = rd.w1 < rd.w0;
  let w = inward ? rd.w0 : rd.w0;
  let pts = routePts(rd.r, w), L = routeLen(pts), sPos = 0;
  for (let it = 0; it < 3; it++) {
    if (inward) {
      // the distance still to go shrinks in log space; the frame is k times that distance (never wider than w0)
      const a = rd.w1 / RIDE_K;
      const rem = (L + a) * Math.exp(e * Math.log(a / (L + a))) - a;
      w = clamp(RIDE_K * rem + rd.w1, rd.w1, rd.w0);
      sPos = L - rem;
    } else {
      const a = rd.w0 / RIDE_K;
      const d = (L + a) * Math.exp((1 - e) * Math.log(a / (L + a))) - a;
      w = clamp(RIDE_K * d + rd.w0, rd.w0, rd.w1);
      sPos = d;
    }
    pts = routePts(rd.r, w);
    L = routeLen(pts);
  }
  if (u >= 1) { w = rd.w1; sPos = L; }
  const p = alongPts(pts, sPos);
  return {cam: {x: p.x, y: p.y, w}, p, pts, s: sPos, L, w};
};
export const RIDES: Ride[] = [
  {kind: 'rec', r: recRoute(33, DEC_FIRE), t0: 1.95, t1: 2.4, w0: 0.052, w1: 16}, // V2: seen from the wide shot
  {kind: 'rec', r: recRoute(33, DEC_MOVE), t0: 25.75, t1: 26.95, w0: 0.052, w1: 58}, // V2 ending: the camera rides it out
  {kind: 'stim', r: stimRoute(26), t0: 12.15, t1: 12.95, w0: 20, w1: 0.065},
  {kind: 'rec', r: recRoute(33, DEC_C), t0: 14.85, t1: 15.62, w0: 0.15, w1: 27},
];
const M1 = camUm(-300, -100, 420), M2 = camUm(-360, 10, 470), M3: Cam = {...camUm(-500, 152, 520), w: 0.052};
const DEC_A: Cam = {x: DEC_FIRE.x, y: DEC_FIRE.y, w: 16}, DEC_B: Cam = {x: 12.6, y: -24.5, w: 14.6};
const cmdRide: Ride = {kind: 'cmd', r: cmdRoute(pt(12.6, -24.5)), t0: 2.45, t1: 2.68, w0: 14.6, w1: 40};
RIDES.push(cmdRide);
const GAME_MID: Cam = {x: 0, y: -61, w: 40};
const ENC_W: Cam = {x: ENC_P.x, y: ENC_P.y, w: 52};
const M26 = camUm(-300, -100, 500), MF = camUm(-430, 30, 640);
const HEAD: Cam = {x: 8, y: -9.6, w: 15};
const CL1_IN: Cam = {x: 8, y: -5, w: 40};
const SCOPE = camUm(-40, 20, 600), SCOPE2 = camUm(-90, 50, 540);
const CHIPV: Cam = {x: 8, y: -9, w: 22};
const GAME_V: Cam = {x: 0, y: -63, w: 46};
const ENC_C: Cam = {x: ENC_P.x, y: ENC_P.y, w: 20};
const ENC_M = camUm(-300, -100, 650), ENC_M2 = camUm(-220, -60, 800), ARR = camUm(-100, 60, 1750), ARR2 = camUm(-500, 152, 1500);
const DEC_CC: Cam = {x: DEC_C.x, y: DEC_C.y, w: 27};
const CLOSE = camUm(-380, 60, 300), CLOSE2 = camUm(-410, 72, 268);
const ALIVE: Cam = {x: -7, y: -16, w: 50};
// V2 framings
const GAME_IN: Cam = {x: 0, y: -66, w: GAME0.w * 0.93}; // the hook's single push toward the brute and the muzzle flash
const TWO_D: Cam = {x: 1, y: -39, w: 57}; // the reveal holds and drifts while the recording travels to the decoder
const GAME_P: Cam = {x: 0, y: -52, w: 44}; // the game with the DECODE lamps beneath it
const GAME_P2: Cam = {x: 0, y: -53, w: 41.5};
const RIDE_END: Cam = {x: DEC_MOVE.x, y: DEC_MOVE.y, w: 58};
const ALIVE_C: Cam = {x: -6, y: -37, w: 60};
const M3_PRE: Cam = {...camUm(-470, 120, 640), w: 0.064}; // the push lands on the culture, then drifts to the FIRE electrode // the game and the living culture in one frame

type Seg = [number, number, (u: number, t: number) => Cam];
const SEGS: Seg[] = [
  // V2 hook: one push to the action, one reveal of the hardware (the lens opens on the living culture), a calm drift
  // while the recording travels to the decoder and the command fires the gun, one push back into the game, one reveal of
  // the lab. Each move lands on new information; no dive into the chip and back in the first five seconds.
  [0, 0.7, (u) => travel(u, GAME0, GAME_IN, 1 - (1 - u) ** 3)],
  [0.7, 1.75, (u) => zoomAbout(u, GAME_IN, TWO)],
  [1.75, 3.45, (u) => travel(u, TWO, TWO_D, ss(u, 0, 1))],
  [3.45, 4.45, (u) => zoomAbout(u, TWO_D, GAME_P)],
  [4.45, 5.35, (u) => travel(u, GAME_P, GAME_P2, ss(u, 0, 1))],
  [5.35, 6.7, (u) => zoomAbout(u, GAME_P2, LAB_WIDE)],
  [6.7, 7.62, (u) => travel(u, LAB_WIDE, {x: 8, y: -44, w: 132})],
  [7.62, 8.7, (u) => zoomTo(u, {x: 8, y: -44, w: 132}, CL1_IN)],
  [8.7, 9.35, (u) => travel(u, CL1_IN, HEAD)],
  [9.35, 9.95, (u) => zoomTo(u, HEAD, SCOPE)],
  [9.95, 10.7, (u) => travel(u, SCOPE, SCOPE2)],
  // V2: the two fastest scale changes get more time and a gentler (cubic) ease; the dive now lands on "them"
  [10.7, 11.2, (u) => zoomAbout(u, SCOPE2, CHIPV, ss(u, 0, 1))],
  [11.2, 11.75, (u) => zoomAbout(u, CHIPV, GAME_V, ss(u, 0, 1))],
  [11.75, 12.15, (u) => travel(u, GAME_V, ENC_C)],
  [12.15, 12.95, (_, t) => rideAt(RIDES[2], t).cam],
  [12.95, 13.25, (u) => travel(u, ENC_M, ENC_M2)],
  [13.25, 13.75, (u) => zoomAbout(u, ENC_M2, ARR)],
  [13.75, 14.85, (u) => travel(u, ARR, ARR2, ss(u, 0.45, 1))],
  [14.85, 15.62, (_, t) => rideAt(RIDES[3], t).cam],
  [15.62, 16.45, (u) => travel(u, DEC_CC, {...DEC_CC, x: DEC_CC.x + 0.8, w: 25.5})],
  [16.45, 17.1, (u) => travel(u, {...DEC_CC, x: DEC_CC.x + 0.8, w: 25.5}, SCREENS)],
  [17.1, 19.29, (u) => travel(u, SCREENS, {...SCREENS, w: 58})],
  [19.29, 19.75, (u) => zoomAbout(u, {...SCREENS, w: 58}, GAME_F)],
  [19.75, 21.0, (u) => travel(u, GAME_F, {...GAME_F, w: 47.5})],
  [21.0, 22.0, (u) => zoomAbout(u, {...GAME_F, w: 47.5}, LAB_COMP)],
  [22.0, 23.45, (u) => travel(u, LAB_COMP, {...LAB_COMP, w: 94})],
  // V2 ending: one controlled push into the living culture (the bursts carry it), ride the volley out through the chip,
  // the PC and the cable to the decoder, settle on the game and the culture together for "is alive", one push into the
  // game for the shot, landing on frame 0.
  [23.45, 25.05, (u) => zoomAbout(u, {...LAB_COMP, w: 94}, M3_PRE)],
  [25.05, 25.75, (u) => travel(u, M3_PRE, M3, ss(u, 0, 1))],
  [25.75, 26.95, (_, t) => rideAt(RIDES[1], t).cam],
  [26.95, 27.95, (u) => travel(u, RIDE_END, ALIVE_C)],
  [27.95, 28.9, (u) => zoomAbout(u, ALIVE_C, GAME0)],
  [28.9, 29.1, () => GAME0],
];
export const camAt = (t: number): Cam => {
  for (const [a, b, f] of SEGS) if (t < b) return f(clamp((t - a) / (b - a)), t);
  return GAME0;
};
export const rideNow = (t: number) => {
  const rd = RIDES.find((r) => t >= r.t0 && t < r.t1);
  return rd ? {rd, ...rideAt(rd, t)} : null;
};
export {chipK};

// ------------------------------------------------------------------ the lens (a local magnified view of the culture)
export const LENS = {c: pt(-20, -4), r: 9, um: {x: -330, y: 30, w: 600}};
export const lensState = (t: number) => {
  const a1 = ss(t, 1.3, 1.62) * (1 - ss(t, 3.5, 3.75));
  const a2 = ss(t, 26.35, 26.7) * (1 - ss(t, 28.12, 28.3));
  const a = Math.max(a1, a2);
  const grow = ss(t, T.alive - 0.45, T.alive + 0.12) * (1 - ss(t, 28.05, 28.25));
  return {a, r: LENS.r * (0.35 + 0.65 * ss(a, 0, 1)) * (1 + grow * 0.5), grow, c: pt(LENS.c.x + grow * 4.5, LENS.c.y - grow * 5)};
};
// ------------------------------------------------------------------ the microscope look ("They're growing on a chip")
export const scopeAmt = (t: number) => ss(t, 9.45, 9.8) * (1 - ss(t, 10.72, 10.98));
export const irisAmt = (t: number) => ss(t, 9.4, 9.72) * (1 - ss(t, 10.7, 10.95));
export const focusBlur = (t: number) => (t > 9.4 && t < 10.1 ? 9 * (1 - ss(t, 9.6, 9.98)) * ss(t, 9.4, 9.55) : 0);
export const sectionAmt = (t: number) => ss(t, 10.02, 10.32) * (1 - ss(t, 10.62, 10.8));
// ------------------------------------------------------------------ electrode-group outlines on the array
export const groupsAmt = (t: number) => ss(t, 13.35, 13.6) * (1 - ss(t, 14.9, 15.15));
export const encAmt = (t: number) => Math.max(ss(t, 12.75, 12.95) * (1 - ss(t, 14.9, 15.15)), 0);
// ------------------------------------------------------------------ labels (anchored to lab points)
export type Label = {text: string; at: Pt; t0: number; t1: number; dx?: number; dy?: number; tone?: 'bio' | 'tech' | 'plain'};
export const LABELS: Label[] = [
  {text: 'CL1 biological computer', at: pt(8, -15.5), t0: 6.0, t1: 7.7, dy: -90, tone: 'plain'},
  {text: 'nutrient medium', at: pt(-4.6, -1.5), t0: 7.95, t1: 9.35, dx: -40, dy: -150, tone: 'bio'},
  {text: 'pump', at: pt(19.7, -4.8), t0: 8.25, t1: 9.35, dx: 60, dy: -150, tone: 'bio'},
  {text: 'kept at 37 °C', at: pt(18.5, 6.3), t0: 8.55, t1: 9.35, dx: 0, dy: 120, tone: 'bio'},
  {text: 'runs the game', at: pt(38.5, -24), t0: T.normal + 0.25, t1: 23.5, dx: 40, dy: -330, tone: 'tech'},
  {text: 'encoder + decoder', at: pt(38.5, -14), t0: T.computer + 0.25, t1: 23.5, dx: 40, dy: -250, tone: 'tech'},
  {text: 'learning algorithm', at: pt(38.5, -4), t0: T.computer + 0.65, t1: 23.5, dx: 40, dy: -170, tone: 'tech'},
  {text: 'living neurons', at: pt(8, -12), t0: 22.35, t1: 23.5, dx: -120, dy: 260, tone: 'bio'},
];
export const labelAmt = (l: Label, t: number) => ss(t, l.t0, l.t0 + 0.2) * (1 - ss(t, l.t1 - 0.2, l.t1));
// ------------------------------------------------------------------ live traffic on the cables (wide shots)
export const trafficAmt = (t: number) => Math.max(ss(t, 5.9, 6.3) * (1 - ss(t, 7.7, 8.0)), ss(t, 21.4, 21.8) * (1 - ss(t, 23.5, 23.8)), ss(t, 2.75, 2.95) * (1 - ss(t, 3.45, 3.7)), ss(t, 26.6, 26.9) * (1 - ss(t, 28.1, 28.3)));
export const TRAFFIC_ROUTES = {
  stim: (): RP[] => [lab(CABLE_PC_CTRL[0].x, CABLE_PC_CTRL[0].y), ...[...pcIn].reverse().slice(1), ...[...ringIn].reverse().slice(1)],
  rec: (): RP[] => [...ringIn, ...pcIn],
};
/** command pulses up to the game (each decoded command, while the screens are in view) */
export const CMD_PULSES: {t: number; from: Pt; k: CmdKind}[] = [
  {t: T.move - 0.24, from: DEC_MOVE, k: 'move'},
  {t: T.turn - 0.24, from: DEC_TURN, k: 'turn'},
  {t: T.shoot2 - 0.24, from: DEC_FIRE, k: 'fire'},
  {t: 3.25, from: DEC_TURN, k: 'turn'},
  {t: 4.72, from: DEC_FIRE, k: 'fire'}, // V2: the decoded FIRE that makes the character shoot (5.0)
  {t: 28.3, from: DEC_FIRE, k: 'fire'},
];
export const cmdRouteOf = (from: Pt) => cmdRoute(from);
export {CHIP};
