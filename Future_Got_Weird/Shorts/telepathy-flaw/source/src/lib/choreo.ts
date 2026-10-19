// Choreography of the Telepathy Flaw Short: every animated quantity as a pure function of time (seconds).
// Times come from the narration beat table in timeline.ts, so the picture, captions and sound cannot drift apart.
// The loop layer (the opening head scene) is the same functions evaluated at negative times: before 0 every story
// beat is "not started", so the scene equals frame 0, and everything periodic has a period that divides 30 s.
import {B, FPS, T} from './timeline';
import {clamp, easeInOut, easeOut, hash, inv, lerp, V} from './math';
import {SKey, splineRec} from './motion';
import {Expr, EXPR_GASP, EXPR_PAIN, EXPR_UNEASY, EXPR_WINCE, mixExpr} from '../art/Head';
import {RouteGeo} from '../art/Ui';
import {chipWorld, Pulse, N_THREADS} from '../art/Section';
import {RECEIVER_C, RECEIVER_R, SENDER_C, SENDER_R} from '../art/Figures';

// ---- layout (world coordinates) --------------------------------------------------------------------------------
export const HUD_C: V = {x: 545, y: 735};
export const PANEL_C: V = {x: 520, y: 1010};
export const CANCEL_C: V = {x: 375, y: 1195};
export const NECK_C: V = {x: SENDER_C.x + SENDER_R * 0.06, y: SENDER_C.y + SENDER_R * 1.2};

const sm = (a: number, b: number, t: number) => {
  const x = clamp((t - a) / (b - a || 1));
  return x * x * (3 - 2 * x);
};
/** 1 between a..b, fading in over `fi` and out over `fo` */
const win = (t: number, a: number, b: number, fi = 0.25, fo = 0.25) => sm(a, a + fi, t) * (1 - sm(b - fo, b, t));

// ---- camera ----------------------------------------------------------------------------------------------------
type CamKey = {x: number; y: number; lz: number};
const K = (t: number, x: number, y: number, z: number): SKey<CamKey> => [Math.round(t * FPS), {x, y, lz: Math.log(z)}];
const CAM_KEYS: SKey<CamKey>[] = [
  K(0.0, 225, 886, 3.0),
  K(B.cutawayFrom, 225, 886, 3.0),
  K(1.85, 232, 842, 3.55),
  K(2.45, 236, 822, 3.4),
  K(3.62, 545, 905, 1.06),
  K(4.05, 252, 926, 2.35),
  K(4.9, 250, 920, 2.4),
  K(5.5, 232, 856, 3.55),
  K(7.2, 232, 836, 3.9),
  K(8.4, 232, 840, 3.05),
  K(9.55, 330, 780, 2.0),
  K(10.35, 480, 770, 1.3),
  K(11.2, 540, 880, 1.15),
  K(12.2, 520, 900, 1.2),
  K(12.9, 300, 880, 2.2),
  K(13.35, 225, 886, 3.0),
  K(14.2, 232, 770, 2.05),
  K(15.35, 420, 950, 1.45),
  K(16.95, 420, 950, 1.45),
  K(17.55, 190, 740, 1.9),
  K(18.3, 240, 760, 1.85),
  K(19.6, 430, 960, 1.5),
  K(21.5, 440, 1000, 1.5),
  K(22.4, 480, 930, 1.2),
  K(23.9, 520, 920, 1.18),
  K(24.6, 650, 800, 1.65),
  K(27.0, 655, 810, 1.62),
  K(27.9, 540, 900, 1.12),
  K(29.0, 540, 900, 1.12),
];
export const camAt = (f: number) => {
  const c = splineRec(f, CAM_KEYS);
  return {x: c.x, y: c.y, z: Math.exp(c.lz)};
};
/** the loop layer's camera: the opening framing, held still so it continues across the seam */
export const LOOP_CAM = {x: 225, y: 886, z: 3.0};

// ---- sender head -----------------------------------------------------------------------------------------------
/** reveal progress of the see-through head: a first state is already open at frame 0, then it sweeps to full */
export const SWEEP_P0 = 0.3;
export const sweepP = (t: number) => lerp(SWEEP_P0, 1, easeInOut(inv(B.cutawayFrom, B.cutawayTo, t)));
export const sweepEdge = (t: number) => {
  const x = inv(B.cutawayFrom, B.cutawayTo, t);
  return x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x);
};
/** the controlled shallow turn: a slow oscillation with a 30 s period, so it is continuous across the loop seam */
export const turnAt = (t: number) => 0.78 + 0.1 * Math.sin((2 * Math.PI * t) / 30 + 0.6);
const LOOP_PERIOD = 0.75; // 30 / 40: pulses and pings repeat exactly across the loop

const lane = (i: number) => (i * 4 + 1) % N_THREADS;

/** the cortex -> chip signal streams: [first launch, last launch], spacing, travel time, red 0/1, strength */
export type Stream = {t0: number; t1: number; dt: number; life: number; red: number; a: number};
export const STREAMS: Stream[] = [
  {t0: B.followPulse + 0.15, t1: B.sendHook, dt: 0.18, life: 0.5, red: 0, a: 1}, // the thought leaves the cortex
  {t0: B.signals, t1: T.cortexE + 0.3, dt: 0.13, life: 0.5, red: 0, a: 1}, // grouped signals while "reads neural impulses"
  {t0: B.packetForms - 0.2, t1: B.packetForms + 0.5, dt: 0.1, life: 0.45, red: 0, a: 1},
  {t0: B.seamless + 0.1, t1: B.redPulse - 0.2, dt: 0.32, life: 0.5, red: 0, a: 0.8}, // calm, orderly impulses
  {t0: B.redPulse, t1: B.redPulse + 0.2, dt: 0.2, life: 0.55, red: 1, a: 1}, // the irregular red pulse among the blue ones
  {t0: T.untilE + 0.3, t1: T.thoughtE, dt: 0.22, life: 0.5, red: 0, a: 0.85},
  {t0: B.silhouetteIn + 0.05, t1: B.redEnters + 0.25, dt: 0.12, life: 0.45, red: 1, a: 1}, // the red stream into the chip
];

/** signals on the threads at time t */
export const headPulses = (t: number): Pulse[] => {
  const out: Pulse[] = [];
  // 1) opening pings: blue, chip -> cortex ("inward"), periodic so frame 0 already has one in flight and the loop closes
  const ping = (tt: number) => {
    const ph = tt / LOOP_PERIOD;
    for (let j = 0; j < 2; j++) {
      const q = (((ph + j * 0.5) % 1) + 1) % 1;
      const k = lane(Math.floor(ph + j * 0.5 + 1000));
      out.push({k, u: q, a: 1 - 0.0});
    }
  };
  const pingA = 1 - sm(B.followPulse, B.followPulse + 0.35, t);
  if (pingA > 0.01) {
    const n = out.length;
    ping(t);
    for (let i = n; i < out.length; i++) out[i].a = pingA;
  }
  // 2) cortex -> chip streams (reading): launch every `dt` s, travel `life` s, arrive at the chip at launch + life
  for (const sp of STREAMS) {
    const {t0, t1, dt, life, red, a} = sp;
    if (t < t0 || t > t1 + life) continue;
    const first = Math.floor((t - life - t0) / dt);
    const last = Math.floor((t - t0) / dt);
    for (let i = Math.max(0, first); i <= Math.min(last, Math.floor((t1 - t0) / dt)); i++) {
      const u = (t - (t0 + i * dt)) / life;
      if (u < 0 || u > 1) continue;
      out.push({k: lane(i + Math.floor(t0 * 3)), u: 1 - u, red, a, tail: 0.18});
    }
  }
  return out;
};
export const patchGlow = (t: number) => {
  const base = 0.28 + 0.1 * Math.sin(t * 5);
  const up = win(t, B.followPulse, B.sendHook + 0.3, 0.3, 0.4) + win(t, B.signals - 0.1, T.cortexE + 0.8, 0.3, 0.5) * 1.0 + win(t, B.packetForms - 0.2, B.packetForms + 0.7, 0.2, 0.4) + win(t, B.redPulse - 0.05, B.redPulse + 0.8, 0.12, 0.5) * 0.9;
  return clamp(base + up * 0.7);
};
export const patchRed = (t: number) => Math.max(0.85 * win(t, B.redPulse - 0.05, B.redPulse + 0.75, 0.12, 0.45), sm(B.silhouetteIn, B.redEnters + 0.4, t) * (1 - sm(B.matchCut, B.matchCut + 0.6, t)));
export const chipRedAt = (t: number) => sm(B.redEnters, B.redEnters + 0.35, t) * (1 - sm(B.matchCut - 0.2, B.matchCut + 0.5, t));
/** chip LED: quick double flicker on every send, slow breathing otherwise; periodic with 0.75 s */
export const ledAt = (t: number) => 0.5 + 0.4 * Math.sin((2 * Math.PI * t) / LOOP_PERIOD);
/** ring ping from the chip (the loop's circular motif): one per LOOP_PERIOD, 0..1 progress and strength */
export const chipPing = (t: number) => {
  const ph = (((t / LOOP_PERIOD) % 1) + 1) % 1;
  // only while the head is the whole picture (the opening and the loop layer), never in the middle of the story
  const gate = t < 0 ? 1 : 1 - sm(B.followPulse, B.followPulse + 0.4, t);
  return {u: ph, a: (1 - ph) * gate};
};
export const motorTag = (t: number) => win(t, B.motor, T.cortexE + 0.9, 0.3, 0.3);
export const neckOpen = (t: number) => sm(B.neckFrom + 0.05, B.neckFrom + 0.55, t) * (1 - sm(B.neckTo - 0.1, B.neckTo + 0.35, t));
export const neckDim = (t: number) => sm(B.neckTo - 0.6, B.neckTo, t);

// ---- poses and faces -------------------------------------------------------------------------------------------
const E = (o: Partial<Expr>, base: Expr): Expr => ({...base, ...o});
const BASE: Expr = {browIn: 0.1, browDown: 0, lid: 0.1, squint: 0, shut: 0, pupil: 1, open: 0.03, wide: 1, smile: 0.3, teeth: 0, tongue: 0, gx: 0.3, gy: 0, sweat: 0, flush: 0.1};
const S_CALM = E({}, BASE);
const S_SMILE = E({smile: 0.85, open: 0.2, teeth: 0.5, squint: 0.2, browIn: 0.05}, BASE);
const S_CONCERN = E({browIn: 0.7, smile: -0.1, lid: 0.05, gy: 0.15, pupil: 0.9, sweat: 0.2}, BASE);
const S_FLINCH = E({...EXPR_GASP, gx: -0.2, gy: -0.3, sweat: 0.5, flush: 0.3}, BASE);
const S_DISTRESS = E({...EXPR_PAIN, shut: 0.15, sweat: 0.7}, BASE);
const S_REJECT = E({...EXPR_WINCE, shut: 0.9, sweat: 0.7}, BASE);
const S_DREAD = E({...EXPR_UNEASY, gx: 0.45, gy: 0.2, sweat: 0.7}, BASE);
const S_LOOK = E({gx: 0.5, gy: -0.1, browIn: 0.15, smile: 0.5}, BASE);

type EK = [number, Expr];
export const exprTrack = (t: number, keys: EK[]): Expr => {
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
    [0, S_CALM],
    [2.4, S_LOOK],
    [3.3, S_SMILE],
    [4.0, S_CALM],
    [10.9, S_CALM],
    [11.3, S_SMILE],
    [12.3, S_SMILE],
    [T.untilS + 0.05, S_SMILE],
    [T.untilE + 0.35, S_CONCERN],
    [T.intrusiveS + 0.1, S_CONCERN],
    [T.intrusiveS + 0.45, S_FLINCH],
    [T.thoughtE + 0.5, S_FLINCH],
    [T.thoughtE + 1.2, S_DISTRESS],
    [B.fragments + 1.0, S_DISTRESS],
    [B.rejectFrom + 0.3, S_REJECT],
    [B.cancelTap + 0.2, S_REJECT],
    [B.cancelTap + 0.9, S_DISTRESS],
    [B.overtake, S_DREAD],
    [B.drawBack + 0.6, S_DREAD],
    [B.wipeFrom, S_DREAD],
  ]);

export const blinkAt = (t: number, seed: number) => {
  // a blink every ~3 s, 5 frames long, never during the loop seam (the opening frame has the eyes open)
  const period = 2.8 + hash(seed, 3) * 1.2;
  const ph = (t + hash(seed, 7) * period) % period;
  const d = ph / (5 / FPS);
  if (t < 0.5 || t > 29.2) return 0;
  return d >= 0 && d <= 1 ? Math.sin(Math.PI * d) : 0;
};

export type SenderState = {
  roll: number;
  turn: number;
  shiftX: number;
  shiftY: number;
  reach: number;
  press: number;
  tremble: number;
};
export const senderState = (t: number): SenderState => {
  const turn = turnAt(t);
  const recoil = win(t, T.intrusiveS + 0.05, B.rejectFrom + 0.5, 0.35, 0.8);
  const slump = sm(T.thoughtE + 0.6, B.fragments + 0.8, t) * (1 - sm(B.cancelTap + 0.4, B.cancelTap + 1.4, t) * 0.5);
  const shake = win(t, B.rejectFrom, B.cancelTap + 0.2, 0.2, 0.2);
  const roll = -2 + 5 * recoil + 3 * slump + 3.5 * shake * Math.sin(t * 17) + 0.6 * Math.sin((2 * Math.PI * t) / 7.5);
  // the hand comes up to the cancel button, drops while the camera is on the receiver, and comes back for the late tap
  const reach = Math.max(sm(B.cancelReach - 0.2, B.cancelReach + 0.6, t) * (1 - sm(B.receiverCut - 0.5, B.receiverCut + 0.2, t)), sm(B.lateCancel - 0.9, B.lateCancel - 0.3, t) * (1 - sm(B.wipeFrom + 1.1, B.wipeFrom + 1.9, t)));
  const press = win(t, B.cancelTap - 0.12, B.cancelTap + 0.28, 0.1, 0.18);
  return {
    roll,
    turn: turn - 0.12 * recoil + 0.05 * shake * Math.sin(t * 17),
    shiftX: 16 * recoil + 6 * slump,
    shiftY: 8 * recoil + 8 * slump,
    reach,
    press: clamp(press),
    tremble: recoil,
  };
};

const R_CALM = E({gx: -0.15, smile: 0.2, browIn: 0.05, lid: 0.08, flush: 0.12}, BASE);
const R_NOTICE = E({gx: -0.75, gy: -0.15, browIn: 0.55, pupil: 1.05, open: 0.1, smile: 0.25, lid: 0}, BASE);
const R_SMILE = E({gx: -0.55, smile: 0.9, open: 0.22, teeth: 0.45, squint: 0.3, browIn: 0.1, flush: 0.3}, BASE);
const R_WATCH = E({gx: -0.7, gy: -0.2, smile: 0.35, browIn: 0.1, open: 0.05}, BASE);
const R_STILL = E({gx: -0.8, gy: -0.25, smile: 0.2, browIn: 0.45, open: 0.08}, BASE);
const R_WORRY = E({gx: -0.8, gy: -0.1, smile: -0.35, browIn: 0.85, pupil: 0.85, open: 0.1, sweat: 0.25}, BASE);
const R_SHOCK = E({...EXPR_GASP, gx: -0.7, gy: -0.1, pupil: 0.55, open: 0.55, smile: -0.7, sweat: 0.5}, BASE);
const R_DRAW = E({...EXPR_UNEASY, gx: -0.5, pupil: 0.65, open: 0.3, smile: -0.6, browIn: 1, sweat: 0.6}, BASE);

export const receiverExpr = (t: number): Expr =>
  exprTrack(t, [
    [0, R_CALM],
    [B.arriveHook - 0.4, R_CALM],
    [B.arriveHook, R_NOTICE],
    [B.arriveHook + 0.35, R_SMILE],
    [4.3, R_CALM],
    [B.arriveNormal - 0.2, R_CALM],
    [B.arriveNormal + 0.15, R_SMILE],
    [12.4, R_SMILE],
    [13.6, R_WATCH],
    [B.matchCut, R_WATCH],
    [B.receiverCut - 0.1, R_STILL],
    [B.redArrives - 0.9, R_STILL],
    [B.redArrives - 0.35, R_WORRY],
    [B.redArrives + 0.25, R_SHOCK],
    [B.drawBack, R_SHOCK],
    [B.drawBack + 0.5, R_DRAW],
    [B.wipeFrom + 0.3, R_DRAW],
  ]);
export type ReceiverState = {roll: number; turn: number; shiftX: number; shiftY: number};
export const receiverState = (t: number): ReceiverState => {
  const draw = sm(B.drawBack - 0.1, B.drawBack + 0.45, t);
  const flinch = win(t, B.redArrives + 0.1, B.redArrives + 0.7, 0.12, 0.5);
  const nod = win(t, B.arriveHook + 0.1, B.arriveHook + 0.6, 0.15, 0.3) + win(t, B.arriveNormal + 0.1, B.arriveNormal + 0.6, 0.15, 0.3);
  return {
    roll: 1.2 * Math.sin((2 * Math.PI * t) / 9) - 2.5 * draw - 1.5 * flinch + 2 * nod,
    turn: 0.55,
    shiftX: 26 * draw + 6 * flinch,
    shiftY: 4 * nod + 6 * draw,
  };
};

/** when the red packet forms at the chip, and the span in which the blue "Hey" waits on the route */
export const RED_FORMS = T.thoughtE + 1.1;
export const QUEUED = {from: B.overtake - 0.3, to: B.receiverCut + 0.9};

// ---- route and packets -----------------------------------------------------------------------------------------
export const routeAt = (t: number): RouteGeo => {
  const s = senderState(t);
  const hc: V = {x: SENDER_C.x + s.shiftX * 0.7, y: SENDER_C.y + s.shiftY * 0.7};
  const A = chipWorld(hc, SENDER_R, s.roll, s.turn);
  return {A, C1: {x: A.x + 4, y: A.y - 250}, C2: {x: HUD_C.x - 40, y: HUD_C.y - 360}, B: {x: HUD_C.x - 20, y: HUD_C.y - 118}};
};

/** u of the hook packet and the normal packet along the route (0 at the chip, 1 at the receiver's view) */
export const hookU = (t: number) => easeInOut(inv(B.sendHook, B.arriveHook, t));
export const normalU = (t: number) => easeInOut(inv(B.sendNormal, B.arriveNormal, t));
/** the red packet: leaves the chip, then travels slowly and speeds up as the camera tracks it */
export const redU = (t: number) => {
  const keys: [number, number][] = [
    [B.redLeaves, 0],
    [B.cancelTap, 0.12],
    [B.matchCut + 0.4, 0.22],
    [B.overtake + 0.4, 0.4],
    [B.receiverCut, 0.74],
    [B.redArrives, 1],
  ];
  if (t <= keys[0][0]) return 0;
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i];
    const [t1, b] = keys[i + 1];
    if (t <= t1) return lerp(a, b, easeInOut(inv(t0, t1, t)));
  }
  return 1;
};

/** the queued blue "Hey" that waits on the route while the red packet overtakes it */
export const queuedU = (t: number) => 0.3 + 0.03 * sm(B.matchCut + 1, B.overtake + 1, t);

export const hudState = (t: number) => {
  const hookIn = win(t, B.arriveHook - 0.5, 4.15, 0.35, 0.4);
  const normIn = win(t, B.arriveNormal - 0.45, B.seamless + 1.3, 0.35, 0.45);
  const redIn = win(t, B.receiverCut - 0.2, B.wipeFrom + 0.9, 0.35, 0.55);
  const alpha = Math.max(hookIn, normIn, redIn);
  const red = sm(B.redArrives - 0.1, B.redArrives + 0.2, t);
  const arrived = Math.max(inv(B.arriveHook - 0.2, B.arriveHook, t) * hookIn, inv(B.arriveNormal - 0.2, B.arriveNormal, t) * normIn);
  const msgBlue = Math.max(sm(B.arriveHook, B.arriveHook + 0.2, t) * hookIn, sm(B.arriveNormal, B.arriveNormal + 0.2, t) * normIn);
  const msgRed = sm(B.redArrives, B.redArrives + 0.18, t) * redIn;
  const progressRed = inv(B.receiverCut, B.redArrives - 0.05, t);
  const progress = redIn > hookIn && redIn > normIn ? progressRed : arrived;
  return {
    alpha,
    red,
    msg: Math.max(msgBlue * (1 - redIn), msgRed),
    progress,
    delivered: sm(B.delivered, B.delivered + 0.14, t) * redIn,
    landed: red,
  };
};

export const panelState = (t: number) => ({
  // the outgoing-message interface appears with the first normal send and stays (blue) until the warning turns it red
  // visible in the two-shots (the Hey is sent) and again for the warning; away while the camera is tight on the sender
  alpha: win(t, B.warnIn - 0.3, B.warnOut - 0.05, 0.3, 0.25),
  red: sm(B.warnIn, B.warnIn + 0.18, t),
  warn: sm(B.warnIn, B.warnIn + 0.45, t),
  blink: sm(B.warnIn, B.warnIn + 0.1, t) * (0.5 + 0.5 * Math.sin((t - B.warnIn) * 18)) * (1 - sm(B.warnOut, B.warnOut + 0.4, t)),
  hey: 1 - sm(B.warnIn - 0.2, B.warnIn + 0.05, t),
});
export const cancelState = (t: number) => {
  // away while the camera is on the receiver (it would sit cut off at the frame edge)
  const alpha = Math.max(win(t, B.cancelReach - 0.5, B.receiverCut - 0.5, 0.3, 0.3), win(t, B.lateCancel - 0.2, B.wipeFrom + 1.5, 0.25, 0.4));
  const ring = inv(B.cancelTap + 0.05, B.lateCancel + 0.1, t);
  return {
    alpha,
    red: sm(B.warnIn, B.warnIn + 0.2, t),
    ring: t < B.cancelTap + 0.05 ? 0 : ring,
    flash: win(t, B.lateCancel + 0.1, B.lateCancel + 0.5, 0.05, 0.3),
  };
};

/** mental space */
export const cloudAlpha = (t: number) => win(t, T.intrusiveS - 0.25, B.fragments + 1.9, 0.3, 0.45);
export const silhouetteAlpha = (t: number) => win(t, B.silhouetteIn, B.silhouetteOut, 0.18, 0.3);
export const silhouetteGrow = (t: number) => sm(B.silhouetteIn, B.silhouetteIn + 0.5, t);
