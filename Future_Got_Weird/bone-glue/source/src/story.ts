// The timeline. Every beat is keyed to the measured narration (data/timeline.json via word()). One continuous story
// in the wrist world (millimetres, anatomy.ts), with one editorial match out to an oyster on a rock and back:
//
//   0.00-1.25  straight down into the incision: the cannula is already laying a teal bead along the transverse crack;
//              the camera tracks right with it; the bead bridges the crack within the first second
//   1.25-4.90  the tip hops to the wedge crack and then runs up the styloid crack while the camera widens and tilts:
//              the incision rim, the palm-up hand and forearm, then the compact clinical scene (the surgeon finishes)
//   5.0-6.0    "Researchers actually did it": the applicator lifts; the surgeon's eyes smile above the mask
//   6.0-7.9    push back down to the bead's lower contact edge ("an experimental glue")
//   7.9-8.25   match: the glue's contact edge -> the oyster's cemented seam on its rock (same direction, push-in)
//   8.25-10.0  underwater: current, particles, swaying weed; the oyster never moves
//   10.0-10.35 match back: the seam -> the bead's contact edge, now wet
//   10.35-13.6 macro: blood-tinted fluid runs over bone and bead; the bond holds; the camera crosses the bead
//   13.6-18.7  pull out to a wider cutaway of the wrist (window over radius, ulna, carpals); the surgeon withdraws the
//              applicator and releases the clamp; the fragments stay put; the gel sets ("three minutes")
//   18.3-19.8  the incision closes (sutures); the camera moves back into the fracture
//   19.3-21.4  hematoma -> soft callus -> hard callus
//   21.4-24.6  new bone fills in around the shrinking glue islands; the glue is gone
//   24.4-25.6  remodelling back to the shaft's shape (restored)
//   25.5-27.3  ease out to the healed wrist (faint scar, follow-up table); the fingers curl gently and relax
//   27.35-28.0 push back into the wrist through the skin layers into frame 0 (the loop; the reset is hidden)
import {P, pt} from './core/geo';
import {FPS, FRAMES, clamp, keyS, lerp, ss, ss5, word} from './lib';
import {Cam, Key, glide, travel, zoomAbout} from './camera';
import {BEAD_TOTAL, BEAD_VISIBLE, BoneState, HEAL0, HINGE, Heal, beadEdgeBelow, beadTip} from './art/bone';

const w = word;
export const T = {
  wrist: w('wrist').start, gluing: w('gluing').start, together: w('together').start, togetherEnd: w('together').end,
  researchers: w('Researchers').start, did: w('did').start, itEnd: w('it').end,
  they: w('They').start, experimental: w('experimental').start, glue: w('glue').start, inspired: w('inspired').start,
  oysters: w('oysters').start, rocks: w('rocks').start, rocksEnd: w('rocks').end,
  grips: w('grips').start, wet: w('wet').start, bloody: w('bloody').start, woundEnd: w('wound').end,
  inW: w('In').start, reported: w('reported').start, surgeons: w('surgeons').start, secured: w('secured').start,
  pieces: w('pieces').start, three: w('three').start, minutesEnd: w('minutes').end,
  fracture: w('fracture').start, needed: w('needed').start, months: w('months').start, heal: w('heal').start, healEnd: w('heal').end,
  but: w('But').start, newW: w('new').start, grows: w('grows').start, glue2: w('glue', 1).start, gradually: w('gradually').start, disappearsEnd: w('disappears').end,
  your: w('Your').start, body: w('body').start, replaces: w('replaces').start, stuff: w('stuff').start, holding: w('holding').start, togetherEnd2: w('together', 1).end,
};
export const LOOP_T = FRAMES / FPS;
export const LAST = (FRAMES - 1) / FPS;

export const EV = {
  // the bead (film time); laid at frame 0
  laid0: 6.0, beadEnd: 4.85,
  appLift0: 4.95, appLift1: 5.55,
  // the dive to the match and the oyster
  dive0: Math.max(5.9, T.they - 0.05), match0: T.inspired + 0.06, match1: T.inspired + 0.42,
  back0: T.rocksEnd - 0.3, back1: T.rocksEnd + 0.08, cutIn: T.inspired + 0.18, cutOut: T.rocksEnd + 0.08,
  // the wet macro and the pull-out
  pull0: T.woundEnd - 0.02, pull1: T.surgeons - 0.05, window0: T.woundEnd + 0.25, window1: T.surgeons + 0.1,
  touch0: T.surgeons, appOut0: T.secured, appOut1: T.secured + 0.95, clampOpen0: T.pieces - 0.15, clampOpen1: T.pieces + 0.2,
  clampOut0: T.pieces + 0.15, clampOut1: T.pieces + 1.15, set0: T.three - 0.1, set1: T.minutesEnd,
  // closing and healing
  close0: T.minutesEnd - 0.4, close1: T.fracture + 0.35, sut0: T.fracture, sut1: T.fracture + 0.55,
  dive2a: T.fracture - 0.1, dive2b: T.needed + 0.15,
  hem0: T.fracture + 0.35, hem1: T.needed + 0.15, soft0: T.needed + 0.1, soft1: T.months + 0.45, hard0: T.months + 0.4, hard1: T.healEnd + 0.3,
  res0: T.but + 0.05, res1: T.disappearsEnd - 0.15, rem0: T.disappearsEnd - 0.3, rem1: T.replaces + 0.15,
  // the ending
  out0: T.replaces - 0.15, out1: T.holding - 0.15, curl0: T.stuff - 0.15, curlPeak: T.holding + 0.2, curl1: T.togetherEnd2 - 0.1,
  // the loop: the surgeon's sleeve sweeps across the lens; the reset happens while it covers the frame
  wipe0: Math.max(T.togetherEnd2 + 0.0, LOOP_T - 0.55), wipe1: LOOP_T - 1 / 30, reset: 0,
};

// ---------------------------------------------------------------- the bead: laid length over time
/** tip speed (mm/s): steady along the transverse crack, a short slowdown at each hop, finishing as the surgeon lifts */
const speedAt = (t: number) => keyS(t, [[-2, 16], [1.15, 16], [1.4, 13.5], [2.3, 14.5], [4.2, 15.5], [EV.beadEnd, 0]], (x) => ss(x, 0, 1));
const LAID_TAB = (() => {
  const dt = 0.005, t0 = -2, n = Math.round((7 - t0) / dt);
  const ts: number[] = [], ls: number[] = [];
  let l = EV.laid0 - 16 * 2; // laid at t0 (the loop's pre-roll runs the same tip speed backward)
  for (let i = 0; i <= n; i++) {
    const t = t0 + i * dt;
    ts.push(t); ls.push(l);
    l += speedAt(t) * dt;
  }
  // rescale so laid(0) = laid0 and the bead completes exactly at beadEnd
  const i0 = Math.round(-t0 / dt), iE = Math.round((EV.beadEnd - t0) / dt);
  const a = ls[i0], b = ls[iE];
  const k = (BEAD_VISIBLE - EV.laid0) / (b - a);
  return {ts, ls: ls.map((x) => EV.laid0 + (x - a) * k), dt, t0};
})();
export const laidAt = (t: number) => {
  const {ts, ls, dt, t0} = LAID_TAB;
  const i = Math.max(0, Math.min(ts.length - 2, Math.floor((t - t0) / dt)));
  const u = clamp((t - ts[i]) / dt);
  return Math.min(BEAD_VISIBLE, Math.max(0, lerp(ls[i], ls[i + 1], u)));
};
/** the time at which a bead length was laid (inverse of laidAt) */
export const timeOfLaid = (s: number) => {
  const {ts, ls} = LAID_TAB;
  if (s <= ls[0]) return ts[0];
  let lo = 0, hi = ls.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (ls[m] <= s) lo = m; else hi = m;
  }
  return lerp(ts[lo], ts[hi], clamp((s - ls[lo]) / (ls[hi] - ls[lo] || 1)));
};

// ---------------------------------------------------------------- the loop's clock
/** the opening's clock: film time, except in the loop pre-roll at the end (t - LOOP_T, negative) */
EV.reset = EV.wipe0 + 0.51 * (EV.wipe1 - EV.wipe0);
export const openTau = (t: number) => (t >= EV.reset ? t - LOOP_T : t);
export const inOpening = (t: number) => t < EV.dive0 || t >= EV.reset;

// ---------------------------------------------------------------- the reduction (the clamp seats the distal fragments)
const REDUCE0 = -0.028;
export const reduceAt = (tau: number) => REDUCE0 * (1 - ss(tau, 0.04, 0.55));
const rotAbout = (p: P, th: number, c: P): P => {
  const cs = Math.cos(th), sn = Math.sin(th);
  return pt(c.x + (p.x - c.x) * cs - (p.y - c.y) * sn, c.y + (p.x - c.x) * sn + (p.y - c.y) * cs);
};

// ---------------------------------------------------------------- bone state
const healAt = (t: number): Heal => {
  if (inOpening(t) || t < EV.close0) return HEAL0;
  return {
    hem: ss(t, EV.hem0, EV.hem1),
    soft: ss(t, EV.soft0, EV.soft1),
    hard: ss(t, EV.hard0, EV.hard1),
    resorb: clamp((t - EV.res0) / (EV.res1 - EV.res0)) ** 0.85 * (t > EV.res0 ? 1 : 0),
    remodel: ss(t, EV.rem0, EV.rem1),
  };
};
export const boneAt = (t: number, px: number): BoneState => {
  const tau = openTau(t);
  const opening = inOpening(t) && tau < EV.dive0;
  const laid = opening ? laidAt(tau) : BEAD_VISIBLE;
  return {
    t: opening ? tau : t,
    laid,
    laidAt: (s: number) => timeOfLaid(s),
    seep: opening ? 0 : ss(t, EV.dive0, EV.dive0 + 0.6),
    reduce: opening ? reduceAt(tau) : 0,
    set: opening ? 0 : ss(t, EV.set0, EV.set1),
    wet: opening ? 0 : ss(t, EV.back0, EV.back1 + 0.4) * (1 - ss(t, EV.pull0 + 0.3, EV.pull1)),
    heal: healAt(t),
    px,
  };
};

// ---------------------------------------------------------------- the instruments and the surgeon
export type InstrState = {
  app: {tip: P; ang: number; press: number; gel: number};
  clamp: {a: P; b: P; open: number; lift: number};
  appHeld: number; clampHeld: number; appOn: number; clampOn: number;
  face: {focus: number; smile: number; gx: number; gy: number; blink: number};
  lean: number;
};
const APP_ANG = -0.42;
const CLAMP_A = pt(7.5, -5.5), CLAMP_B = pt(6.5, 5.5);
const blinkAt = (t: number) => {
  // two blinks over the clinical shots
  const b = (c: number) => Math.max(0, 1 - Math.abs(t - c) / 0.07);
  return Math.max(b(4.45), b(14.9), b(16.95));
};
export const instrAt = (t: number): InstrState => {
  const tau = openTau(t);
  const opening = inOpening(t) && tau < EV.dive0;
  const tt = opening ? tau : t;
  const tip = beadTip(laidAt(tt));
  const red = opening ? reduceAt(tau) : 0;
  // after the bead: lift off the end of the styloid crack and hold, then (in the cutaway) touch the wedge once and
  // withdraw up and away
  const lift = ss(tt, EV.appLift0, EV.appLift1);
  const end = beadTip(BEAD_VISIBLE).p;
  const hover = pt(end.x + 3.2 * Math.cos(APP_ANG), end.y + 3.2 * Math.sin(APP_ANG));
  const touch = beadTip(30 + 6).p; // a point on the wedge crack
  let p = tip.p, ang = APP_ANG + 0.04 * Math.sin(tt * 1.3), press = 0.15 + 0.6 * clamp(laidAt(tt) / BEAD_TOTAL), gel = 1 - lift;
  if (tt >= EV.appLift0) {
    p = pt(lerp(end.x, hover.x, lift), lerp(end.y, hover.y, lift));
    gel = 0;
  }
  if (!opening && t >= EV.pull0) {
    // the cutaway: the applicator is back at the wedge for a last touch, then withdraws
    const u = ss(t, EV.appOut0, EV.appOut1);
    const at = pt(touch.x + 1.2, touch.y - 0.6);
    const away = pt(at.x + 120, at.y - 95);
    p = pt(lerp(at.x, away.x, u ** 1.3), lerp(at.y, away.y, u ** 1.3));
    gel = 0;
    press = 0.75;
  }
  // a hop lifts the tip slightly (toward the barrel)
  if (opening && tip.lift > 0) p = pt(p.x + 1.4 * tip.lift * Math.cos(APP_ANG), p.y + 1.4 * tip.lift * Math.sin(APP_ANG));
  const open = ss(t, EV.clampOpen0, EV.clampOpen1) * (opening ? 0 : 1);
  const clampLift = ss(t, EV.clampOut0, EV.clampOut1) * (opening ? 0 : 1);
  const focus = opening ? 0.8 - 0.8 * ss(tt, T.did - 0.25, T.did + 0.15) : 0.55;
  const smile = opening ? ss(tt, T.did - 0.2, T.did + 0.2) * (1 - ss(tt, EV.dive0 - 0.2, EV.dive0 + 0.3)) : 0.25 * ss(t, EV.set0, EV.set1);
  return {
    app: {tip: p, ang, press, gel},
    clamp: {a: rotAbout(CLAMP_A, red, HINGE), b: CLAMP_B, open: Math.max(open, opening ? 0.12 * (red / REDUCE0) : 0), lift: clampLift},
    appHeld: 1, clampHeld: 1,
    appOn: opening ? 1 : t < EV.pull0 ? 1 : 1 - ss(t, EV.appOut1 - 0.1, EV.appOut1 + 0.2),
    clampOn: opening ? 1 : 1 - ss(t, EV.clampOut1 - 0.1, EV.clampOut1 + 0.2),
    face: {focus, smile, gx: -0.5, gy: 0.55, blink: blinkAt(t)},
    lean: opening ? 3 * ss(tt, 2.6, 4.4) - 3.5 * ss(tt, T.did - 0.3, T.did + 0.35) : -1.5 * ss(t, EV.appOut0, EV.clampOut1),
  };
};

// ---------------------------------------------------------------- the patient's arm
export type ArmS = {curl: number; thumb: number; incision: number; sutures: number; scar: number; window: {c: P; r: number; soft: number} | null; spread: number};
export const WINDOW_C = pt(-5, -24);
export const armAt = (t: number): ArmS => {
  const tau = openTau(t);
  const opening = inOpening(t) && tau < EV.dive0;
  if (opening) return {curl: 0.25 + 0.03 * Math.sin(tau * 0.9), thumb: 0.2, incision: 1, sutures: 0, scar: 0, window: null, spread: 0};
  const relax = 0.5 * ss(t, EV.pull0 + 0.2, EV.pull0 + 0.75); // retractors out: the lips relax a little
  const closing = ss(t, EV.close0, EV.close1);
  const sut = ss(t, EV.sut0, EV.sut1) * (1 - ss(t, EV.hard0, EV.hard1));
  const scar = ss(t, EV.hard0, EV.rem1);
  const r0 = 16, rF = 62, rHeal = 95;
  let r = lerp(r0, rF, ss5(t, EV.window0, EV.window1));
  let c = WINDOW_C;
  if (t > EV.dive2b - 0.2) r = lerp(rF, rHeal, ss(t, EV.dive2b - 0.2, EV.dive2b + 0.3));
  // the ending: the cutaway closes inward onto the healed fracture as the camera eases out
  const shut = ss5(t, EV.out0 + 0.05, EV.out1 - 0.1);
  if (shut > 0) {
    r *= 1 - shut;
    c = pt(lerp(WINDOW_C.x, 0, shut), lerp(WINDOW_C.y, 0, shut));
  }
  const win = t >= EV.window0 && r > 0.3 ? {c, r, soft: 0.38} : null;
  // one small natural movement: the fingers spread a little and flex gently, then relax
  const mv = t > EV.curl0 && t < EV.curl1 ? Math.sin(Math.PI * clamp((t - EV.curl0) / (EV.curl1 - EV.curl0))) : 0;
  const curl = 0.25 + 0.12 * mv;
  const spread = 1.0 * mv;
  return {curl, thumb: 0.2 + 0.35 * mv, incision: (1 - relax) * (1 - closing), sutures: sut, scar, window: win, spread};
};

// ---------------------------------------------------------------- the camera
export type World = 'wrist' | 'match' | 'oyster' | 'match2';
export type WCam = {world: World; cam: Cam; cam2?: Cam; mix?: number};
const CAM0: Cam = {x: -0.6, y: -1.2, w: 26.5, k: 1, focus: 0};
const TRACK1: Cam = {x: 6.0, y: -1.9, w: 25.5, k: 1, focus: 0};
const REVEAL: Cam = {x: 10, y: -48, w: 175, k: 0.96, focus: -6};
const CLINIC: Cam = {x: 92, y: -100, w: 405, k: 0.86, focus: -10};
const CLINIC2: Cam = {x: 88, y: -97, w: 392, k: 0.86, focus: -10};
/** the bead's lower contact edge under the ulnar half of the transverse crack, where the match lands */
export const MATCH_X = -7;
const edgeB = beadEdgeBelow(MATCH_X, {t: 99, laid: BEAD_TOTAL, laidAt: () => 0, seep: 0, set: 0, wet: 0, heal: HEAL0, px: 0.01});
export const MATCH_B = edgeB;
const MATCH_SCREEN_Y = 1090;
const MATCH_W = 7.5;
const matchCam = (wv: number): Cam => ({x: edgeB.x, y: edgeB.y - (MATCH_SCREEN_Y - 960) * (wv / 1080), w: wv, k: 1, focus: 0});
const M_IN = matchCam(MATCH_W);
/** oyster world <-> wrist world at the match: (0,0) on the oyster's seam <-> the bead's contact edge, R mm per mm */
export const R_IN = 12.67, R_OUT = 32 / 7.5;
export const toOyster = (c: Cam, R: number): Cam => ({x: (c.x - edgeB.x) * R, y: (c.y - edgeB.y) * R, w: c.w * R, k: 1});
export const fromOyster = (o: Cam, R: number): Cam => ({x: edgeB.x + o.x / R, y: edgeB.y + o.y / R, w: o.w / R, k: 1, focus: 0});
const O_HOLD: Cam = {x: 2, y: -15, w: 80};
const O_SEAM: Cam = {x: 0, y: -3.9, w: 32};
const WET0 = fromOyster(O_SEAM, R_OUT);
const WET1: Cam = {x: 0.6, y: -0.9, w: 7.6, k: 1, focus: 0};
const CUTAWAY: Cam = {x: -6, y: -44, w: 205, k: 0.9, focus: -8};
const CUTAWAY2: Cam = {x: -4, y: -34, w: 178, k: 0.9, focus: -8};
const HEAL_A: Cam = {x: -2.5, y: 2.0, w: 46, k: 1, focus: 0};
const HEAL_B: Cam = {x: 2.0, y: 1.0, w: 42, k: 1, focus: 0};
const FOLLOW: Cam = {x: -8, y: -74, w: 182, k: 1, focus: -10};
/** the hold on the healed hand drifts gently in (no static frames), straight into the loop's push */
const FOLLOW_B: Cam = {x: -7, y: -70, w: 172, k: 1, focus: -10};
const LV_DRIFT = -0.05;

/** a cubic Hermite in (x, y, log w) between two cameras with end velocities (per second) */
type CV = {x: number; y: number; lw: number};
const hermite = (t: number, t0: number, A: Cam, vA: CV, t1: number, B: Cam, vB: CV): Cam => {
  const D = t1 - t0, u = clamp((t - t0) / D);
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  const f = (a: number, b: number, va: number, vb: number) => h00 * a + h10 * D * va + h01 * b + h11 * D * vb;
  return {
    x: f(A.x, B.x, vA.x, vB.x), y: f(A.y, B.y, vA.y, vB.y), w: Math.exp(f(Math.log(A.w), Math.log(B.w), vA.lw, vB.lw)),
    k: lerp(A.k ?? 1, B.k ?? 1, ss(u, 0, 1)), focus: lerp(A.focus ?? 0, B.focus ?? 0, ss(u, 0, 1)),
  };
};
/** a zoom about one fixed point (no slip) whose log-width ease has given end slopes (log-w per second at each end);
 *  vEnd adds a lateral velocity at the end (mm/s) without moving either end key */
const zoomH = (t: number, t0: number, A: Cam, t1: number, B: Cam, lv0: number, lv1: number, vEnd: P = pt(0, 0), vStart: P = pt(0, 0)): Cam => {
  const D = t1 - t0, u = clamp((t - t0) / D);
  const dl = Math.log(B.w) - Math.log(A.w);
  const m0 = Math.abs(dl) < 1e-9 ? 0 : (lv0 * D) / dl, m1 = Math.abs(dl) < 1e-9 ? 0 : (lv1 * D) / dl;
  const e = (x: number) => -2 * x ** 3 + 3 * x ** 2 + (x ** 3 - 2 * x ** 2 + x) * m0 + (x ** 3 - x ** 2) * m1;
  const c = zoomAbout(u, A, B, e);
  const h11 = u ** 3 - u ** 2, h10 = u ** 3 - 2 * u ** 2 + u;
  return {...c, x: c.x + D * (h11 * vEnd.x + h10 * vStart.x), y: c.y + D * (h11 * vEnd.y + h10 * vStart.y), k: lerp(A.k ?? 1, B.k ?? 1, ss(u, 0, 1)), focus: lerp(A.focus ?? 0, B.focus ?? 0, ss(u, 0, 1))};
};
const V0: CV = {x: 0, y: 0, lw: 0};
const V_TRACK: CV = {x: 6.0, y: -0.4, lw: -0.04};
/** the opening's camera on its own clock (tau may be negative: the loop's push back into the wrist) */
const openCam = (tau: number): Cam => {
  if (tau < 0) {
    const pre = EV.reset - LOOP_T - 0.05;
    const A: Cam = {...CAM0, x: CAM0.x + V_TRACK.x * pre, y: CAM0.y + V_TRACK.y * pre, w: CAM0.w * Math.exp(V_TRACK.lw * pre)};
    return hermite(tau, pre, A, V_TRACK, 0, CAM0, V_TRACK);
  }
  if (tau < 1.2) return hermite(tau, 0, CAM0, V_TRACK, 1.2, TRACK1, {x: 2.0, y: -1.5, lw: 0.4});
  if (tau < T.togetherEnd) return hermite(tau, 1.2, TRACK1, {x: 2.0, y: -1.5, lw: 0.4}, T.togetherEnd, REVEAL, {x: 45, y: -14, lw: 0.55});
  if (tau < T.did + 0.1) return hermite(tau, T.togetherEnd, REVEAL, {x: 45, y: -14, lw: 0.55}, T.did + 0.1, CLINIC, {x: -3, y: 2, lw: -0.02});
  return hermite(tau, T.did + 0.1, CLINIC, {x: -3, y: 2, lw: -0.02}, EV.dive0, CLINIC2, {x: -6, y: 3, lw: -0.05});
};
/** the dive to the match: from the clinic down to the bead's edge, still moving as the dissolve begins */
const DIVE_V_END: CV = {x: 0, y: 0.05, lw: -0.55};
const diveCam = (t: number) => zoomH(t, EV.dive0, CLINIC2, EV.match0, M_IN, -0.05, DIVE_V_END.lw, pt(0, 0), pt(-6, 3));
const afterMatch = (t: number) => {
  // continue the push at the dive's end velocity, decaying
  const dt = t - EV.match0;
  const lw = Math.log(M_IN.w) + DIVE_V_END.lw * (0.6 * (1 - Math.exp(-dt / 0.6)));
  return matchCam(Math.exp(lw));
};
/** the oyster camera after the match: continues from the matched framing, drifts, then pushes onto the seam */
const oysterCam = (t: number): Cam => {
  const O_START = toOyster(afterMatch(EV.cutIn), R_IN);
  const vIn: CV = {x: 0, y: 0, lw: -0.12};
  if (t < EV.back0) return hermite(t, EV.cutIn, O_START, vIn, EV.back0, O_HOLD, {x: 0, y: 0.5, lw: -0.4});
  return zoomH(t, EV.back0, O_HOLD, EV.cutOut, O_SEAM, -0.4, -0.9);
};
/** the wet macro: from the matched seam framing, across the bead, then the long pull-out to the cutaway */
const wetCam = (t: number): Cam => {
  if (t < EV.pull0) return hermite(t, EV.cutOut, WET0, {x: 0.8, y: 4 / R_OUT, lw: -0.5}, EV.pull0, WET1, {x: 1.6, y: -0.3, lw: 0.02});
  if (t < EV.pull1) return zoomH(t, EV.pull0, WET1, EV.pull1, CUTAWAY, 0.02, 0.04, pt(1, 2), pt(1.6, -0.3));
  if (t < EV.dive2a) return hermite(t, EV.pull1, CUTAWAY, {x: 1, y: 2, lw: 0.04}, EV.dive2a, CUTAWAY2, {x: 2, y: 6, lw: -0.12});
  if (t < EV.dive2b) return zoomH(t, EV.dive2a, CUTAWAY2, EV.dive2b, HEAL_A, -0.12, -0.02, pt(0.8, -0.1), pt(2, 6));
  if (t < EV.out0) return hermite(t, EV.dive2b, HEAL_A, {x: 0.8, y: -0.1, lw: -0.02}, EV.out0, HEAL_B, {x: 0.8, y: -0.1, lw: 0.02});
  if (t < EV.out1) return zoomH(t, EV.out0, HEAL_B, EV.out1, FOLLOW, 0.02, LV_DRIFT, pt(0, 0), pt(0.8, -0.1));
  return zoomH(t, EV.out1, FOLLOW, EV.reset, FOLLOW_B, LV_DRIFT, LV_DRIFT);
};

export const camAt = (t: number): WCam => {
  if (t < EV.dive0) return {world: 'wrist', cam: openCam(t)};
  if (t >= EV.reset) return {world: 'wrist', cam: openCam(t - LOOP_T)};
  if (t < EV.match0) return {world: 'wrist', cam: diveCam(t)};
  // hard match cuts: the glue's lower contact edge and the oyster's cement edge sit on the same screen line, and the
  // push-in carries on through both cuts
  if (t < EV.cutIn) return {world: 'wrist', cam: afterMatch(t)};
  if (t < EV.cutOut) return {world: 'oyster', cam: oysterCam(t)};
  return {world: 'wrist', cam: wetCam(t)};
};
/** the ending: the skin regrows over the restored bone as a thickening veil while the camera eases out */
export const skinVeil = (t: number) => (inOpening(t) ? 0 : 0.34 * ss(t, EV.window0, EV.window0 + 0.6) * (1 - ss(t, EV.dive2a + 0.3, EV.dive2b)));
export const tableVariant = (t: number): 'drape' | 'followup' => (inOpening(t) || t < EV.hem1 ? 'drape' : 'followup');
/** the surgeon is in the room until the incision closes */
export const surgeonOn = (t: number) => inOpening(t) || t < EV.close1;
/** the loop's pass through the skin layers (0 = none; rises to cover; 1 = gone past the camera) */
/** the loop wipe's progress (0 none .. 1 gone below the frame) */
export const wipeAt = (t: number) => (t < EV.wipe0 || t > EV.wipe1 ? 0 : (t - EV.wipe0) / (EV.wipe1 - EV.wipe0));
export const passAt = (_t: number) => 0;
void ss5; void keyS; void glide; void travel; void zoomAbout;
export type {Key};
