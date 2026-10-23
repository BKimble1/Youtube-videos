// One physical setup for the whole film, in world pixels (the 1080x1920 full shot at zoom 1; 1 m = 560 px).
// A painted plank wall with horizontal joints, a wood floor, the lead standing still at x = 540, and one rigid,
// passive lens-array panel (1.30 m x 0.75 m, two upright grips on its back). Every state below is a pure function
// of the time in seconds, derived from the measured narration words (data/timeline.json).
import tl from './data/timeline.json';
import {clamp, easeInOut as eio, easeOut, inv, lerp} from './lib/math';

export const W = 1080;
export const H = 1920;
export const FPS = tl.fps;
export const FRAMES = tl.frames;
export const DUR = tl.duration;

type Word = {word: string; start: number; end: number};
export const WORDS: Word[] = tl.words as Word[];
export const CAPTIONS = tl.captions as {text: string; emph: string[]; start: number; end: number; show: number; hide: number}[];
const w = (i: number) => WORDS[i].start;
const we = (i: number) => WORDS[i].end;

// ---------------------------------------------------------------- layout
export const M = 560; // px per metre
export const GROUND = 1330; // floor line at the wall's foot (the lead's soles)
export const BODY_X = 540;
export const PANEL = {w: 420, h: 728, r: 16, gripX: 150, grip0: 220, grip1: 360, gripC: 290};
export const RIDGE = 14; // lens pitch in world px (stylised; the real lenses are far finer)
export const WALL = {
  plank: 48, // horizontal joint spacing (upper wall)
  band: [520, 566] as [number, number], // teal painted band
  pin: [584, 591] as [number, number], // coral pinstripe
  dado: 900, // dado rail (top)
  skirt: 1290,
  pipeX: 112,
  outlet: {x: 912, y: 1150},
  switchP: {x: 236, y: 790},
};

// panel key states (centre x, top y)
export const SIDE = {cx: 860, top: 594}; // carried at his left side, bottom edge just above the floor
export const RAISED = {cx: 540, top: 232}; // in front of him, top edge above the hair
export const LOWC = {cx: 540, top: 594}; // lowered straight down in front of him

// ---------------------------------------------------------------- cues (s)
export const CUE = {
  liftStart: -0.5, // the lift begins 0.5 s before frame 0 (it is running at frame 0; the loop tail plays its start)
  liftEnd: 1.2,
  disappear: w(14),
  pushB0: w(15) + 0.02, // "You see"
  pushB1: we(23) - 0.1, // "lenses"
  lenses: w(23),
  cut0: w(24) - 0.3, cut1: w(24) + 0.5, // section opens on "They"
  spread0: w(25), spread1: we(32), // "light ... sideways": body light fans out
  smear0: w(34), smear1: we(42) - 0.15, // "smearing ... standing": background crosses the outline
  close0: we(42) - 0.1, close1: we(42) + 0.55,
  pull0: we(42) + 0.25, pull1: w(47) + 0.12, // pull back, arriving slightly off-axis on "position"
  align0: w(46) + 0.25, align1: w(55) + 0.05, // the modest alignment move; the outline melts into "a blurred patch of scenery"
  framE0: w(56) - 0.1, framE1: w(61) + 0.1,
  reach0: w(59) + 0.05, // tiny anticipation behind the panel on "reach"
  out0: w(62) - 0.05, out1: we(64) - 0.05, // fingertips clear the edge on "around", hand out on "edge"
  wave0: w(73) - 0.02, wave1: we(75) - 0.15, // finger ripple on "floating ... midair"
  back0: we(75) - 0.1, back1: w(76) + 0.02, // hand returns behind the edge before the lowering starts
  lower0: w(77) - 0.02, lower1: we(79) + 0.15, // "lower the shield"
  aside0: w(80) - 0.05, aside1: w(84) + 0.35, // "and reveal you were standing": panel to his side
  camF0: w(76), camF1: we(79) + 0.4,
  smirk0: w(91) - 0.08, smirk1: we(92) + 0.05,
  antic0: DUR - 0.75,
  end: DUR,
};

// lift progress in loop time: the tail (t > DUR - 0.6) is the start of the next lift
export const loopT = (t: number) => (t > DUR - 0.6 ? t - DUR : t);
export const liftU = (t: number) => eio(inv(CUE.liftStart, CUE.liftEnd, loopT(t)));

export type PanelState = {cx: number; top: number; speed: number};
const panelRaw = (t: number) => {
  const tl = loopT(t);
  if (tl < CUE.lower0) {
    const u = liftU(t);
    // swings in from his side and rises; x leads slightly so the near edge sweeps across his body first
    const ux = eio(inv(CUE.liftStart, CUE.liftEnd - 0.12, tl));
    let top = lerp(SIDE.top, RAISED.top, u);
    // settle after the lift (small damped bob), the hold (hands breathing), and the weight shift before the reach
    const s = tl - CUE.liftEnd;
    if (s > 0) top += -5 * Math.exp(-4 * s) * Math.sin(9 * s);
    if (tl > 2) top += 1.4 * Math.sin((tl - 2) * 1.6) * clamp((tl - 2) / 1.5);
    const dip = tl - CUE.reach0;
    if (dip > -0.1 && dip < 1.4) top += 4 * Math.sin(Math.PI * clamp((dip + 0.1) / 1.5)) * (1 - clamp((dip - 0.6) / 0.8));
    // the antic dip before the next lift (tail) is applied in the loop-time branch below
    if (tl < 0) top += 4 * Math.sin(Math.PI * clamp((tl + 0.75) / 0.45)) * (tl < -0.3 ? 1 : 0);
    return {cx: lerp(SIDE.cx, RAISED.cx, ux), top};
  }
  // lowering: straight down, then to his side
  const d = eio(inv(CUE.lower0, CUE.lower1, tl));
  const a = eio(inv(CUE.aside0, CUE.aside1, tl));
  let top = lerp(RAISED.top, LOWC.top, d);
  const s = tl - CUE.lower1;
  if (s > 0) top += 3 * Math.exp(-5 * s) * Math.sin(10 * s);
  const s2 = tl - CUE.aside1;
  let cx = lerp(LOWC.cx, SIDE.cx, a);
  if (s2 > 0) cx += -4 * Math.exp(-5 * s2) * Math.sin(9 * s2);
  // anticipation of the next lift: a small dip as he loads the grip
  if (tl > CUE.antic0 && tl < DUR - 0.6) top += 4 * Math.sin(Math.PI * clamp((tl - CUE.antic0) / 0.45));
  return {cx, top};
};
export const panelAt = (t: number): PanelState => {
  const a = panelRaw(t);
  const b = panelRaw(t - 1 / FPS);
  return {...a, speed: Math.hypot(a.cx - b.cx, a.top - b.top) * FPS};
};

// ---------------------------------------------------------------- camera
export type Cam = {x: number; y: number; z: number};
export const CAM0: Cam = {x: 540, y: 960, z: 1};
export const CAMB: Cam = {x: 540, y: 800, z: 2.35}; // panel surface, both side edges in frame
export const CAMD: Cam = {x: 604, y: 930, z: 1.0}; // pulled back, slightly off-axis
export const CAMDA: Cam = {x: 540, y: 930, z: 1.0}; // the favourable frontal position
export const CAME: Cam = {x: 440, y: 660, z: 1.55}; // the panel's left edge and the space beside it
const camLerp = (a: Cam, b: Cam, t: number): Cam => {
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), t));
  const wa = 1 / a.z, wb = 1 / b.z, wz = 1 / z;
  const k = Math.abs(wa - wb) < 1e-9 ? t : (wa - wz) / (wa - wb);
  return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z};
};
// A -> B: one continuous push from the end of the lift onto the panel's surface. Log-zoom follows a C1 Hermite curve:
// a slow creep while the promise is spoken, accelerating on "You see" and arriving gently on "lenses".
const PUSH = {t0: CUE.liftEnd + 0.1, tm: CUE.pushB0, zm: 1.12, t1: CUE.pushB1};
const hermite = (p0: number, m0: number, p1: number, m1: number, h: number, u: number) => {
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * h * m1;
};
const pushCam = (t: number): Cam => {
  const L1 = Math.log(PUSH.zm), L2 = Math.log(CAMB.z), sm = (L2 / (PUSH.t1 - PUSH.t0)) * 0.6;
  const L = t < PUSH.tm ? hermite(0, 0, L1, sm, PUSH.tm - PUSH.t0, inv(PUSH.t0, PUSH.tm, t)) : hermite(L1, sm, L2, 0, PUSH.t1 - PUSH.tm, inv(PUSH.tm, PUSH.t1, t));
  const z = Math.exp(L);
  const k = (1 / CAM0.z - 1 / z) / (1 / CAM0.z - 1 / CAMB.z); // the screen point that stays fixed: a dive, not a pan
  return {x: lerp(CAM0.x, CAMB.x, k), y: lerp(CAM0.y, CAMB.y, k), z};
};
export const camAt = (t: number): Cam => {
  if (t > PUSH.t0 && t < PUSH.t1) return pushCam(t);
  const keys: [number, Cam][] = [
    [0, CAM0],
    [PUSH.t0, CAM0],
    [CUE.pushB1, CAMB],
    [CUE.close1, {...CAMB, z: 2.42, y: 798}],
    [CUE.pull1, CAMD],
    [CUE.align1, CAMDA],
    [CUE.framE0, CAMDA],
    [CUE.framE1, CAME],
    [CUE.camF0, CAME],
    [CUE.camF1, CAM0],
  ];
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, c0] = keys[i - 1];
      const [t1, c1] = keys[i];
      // the drift inside the section hold is linear; every other move eases in and out
      const e = i === 3 ? inv(t0, t1, t) : eio(inv(t0, t1, t));
      return camLerp(c0, c1, e);
    }
  }
  return keys[keys.length - 1][1];
};

// ---------------------------------------------------------------- optics parameters
export const opticsAt = (t: number, cam: Cam, p: PanelState) => {
  // off-axis amount: the camera's lateral offset from the favourable frontal line
  // (only in the pull-back of D, where the camera deliberately arrives off the frontal line and then aligns)
  const inD = clamp(inv(CUE.pull0 + 0.6, CUE.pull1, t)) * (1 - clamp(inv(CUE.align1, CUE.align1 + 0.3, t)));
  const off = clamp(Math.abs(cam.x - BODY_X) / 64) * inD;
  // residual subject light: faint when still, stronger while the panel moves ("movement shows through") and off-axis
  const motion = clamp(p.speed / 900);
  const resid = 0.06 + 0.08 * motion + 0.06 * off;
  return {off, resid, ghost: 0.1 * off, parallax: (cam.x - BODY_X) * 0.22 * inD};
};

export {easeOut};
