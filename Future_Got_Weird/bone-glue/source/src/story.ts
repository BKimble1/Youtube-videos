// V2 timeline. Every beat is keyed to the measured narration (data/timeline.json via word()). One wrist world
// (millimetres, anatomy.ts; fracture interfaces and the moving wedge fragment in art/seams.ts) and one oyster world,
// matched in and out. See production/V2_PLAN.md.
//
//   0.00-0.38   frame 0: the probe pushes the displaced wedge fragment home (the applicator already touches the seam)
//   0.36-1.45   the applicator runs the glue along the transverse seam and up the wedge's seam: every seam round the
//               wedge is bonded
//   0.66-1.40   as the glue runs onto the wedge's face the probe lets go and backs off down-right, clear of the
//               applicator's hop; the wedge stays put (fixation, seams still visible)
//   1.45-4.00   pull back, the fracture kept large: the incision, the palm-up hand and forearm, the surgeon's hands; the
//               applicator moves to the foot of the styloid seam, THEN the probe (lifted) to a ready spot beside the
//               styloid fragment (never under the cannula)
//   3.85-4.40   on "Researchers" the applicator turns steep on its tip and the probe sets down on the styloid fragment
//   4.36-5.50   "Researchers actually did it": one precise glue stroke up the styloid seam, then the applicator lifts
//   5.95-7.98   the applicator withdraws; a no-slip dive onto the glue band in the transverse seam
//   7.98-10.33  match cut to the oyster (medium) -> push to its base -> a soft window exposes shell / cement / rock ->
//               match cut back onto the glue band (same screen position and shape)
//   10.33-13.6  macro: a fluid sheet washes across the bonded seam; a stronger wash on "wet, bloody"; the bond holds
//   13.6-15.3   pull out to the fixation framing (every seam teal, the probe holding the styloid fragment)
//   15.9-17.3   "secured": the probe lifts off and withdraws; nothing moves; "three minutes": the gloss sets to satin
//   18.35-19.9  the incision closes (sutures); push into the healing framing (the opening's orientation)
//   19.2-25.6   hematoma -> soft callus -> pale new bone advances from every broken face into the glue, which thins into
//               islands and is gone -> remodelling
//   25.25-27.3  ease out to the recovered wrist; the fingers flex gently and relax
//   27.45-end   push back in through the clearing skin onto the healed radius in the opening's framing: the loop cuts to
//               frame 0 on the same framing and direction (the healed bone is never shown breaking)
import {P, pt, lerpP, add, mul} from './core/geo';
import {FPS, FRAMES, clamp, lerp, ss, word} from './lib';
import {Cam, zoomAbout} from './camera';
import {
  SeamId, WEDGE_PRESS, STYLOID_PRESS, PROBE_ANG_W, PROBE_ANG_S, WEDGE_SEATED, seamLength, seamPoint, wedgeLerp, xfPoint, WedgeX,
} from './art/seams';
import {BoneState2, Heal2, HEAL2_0, InstrState2, GlueSpan} from './v2state';
import * as OY from './art/oyster';
import {INCISION} from './art/anatomy';

// the oyster builder's match framings (fallbacks only while art/oyster.tsx is being rebuilt)
const OYX = OY as unknown as {OY_CAM_IN?: Cam; OY_CAM_OUT?: Cam};
const OY_CAM_IN: Cam = OYX.OY_CAM_IN ?? {x: 0, y: -10, w: 160};
const OY_CAM_OUT: Cam = OYX.OY_CAM_OUT ?? {x: 0, y: 0, w: 14};

const w = word;
export const T = {
  shattered: w('shattered').start, wrist: w('wrist').start, wristEnd: w('wrist').end, gluing: w('gluing').start,
  together: w('together').start, togetherEnd: w('together').end,
  researchers: w('Researchers').start, actually: w('actually').start, did: w('did').start, itEnd: w('it').end,
  they: w('They').start, experimental: w('experimental').start, glue: w('glue').start, inspired: w('inspired').start,
  oysters: w('oysters').start, rocks: w('rocks').start, rocksEnd: w('rocks').end,
  grips: w('grips').start, wet: w('wet').start, bloody: w('bloody').start, bloodyEnd: w('bloody').end, woundEnd: w('wound').end,
  inW: w('In').start, reported: w('reported').start, surgeons: w('surgeons').start, secured: w('secured').start,
  pieces: w('pieces').start, three: w('three').start, minutesEnd: w('minutes').end,
  fracture: w('fracture').start, needed: w('needed').start, months: w('months').start, heal: w('heal').start, healEnd: w('heal').end,
  but: w('But').start, newW: w('new').start, grows: w('grows').start, glue2: w('glue', 1).start, gradually: w('gradually').start, disappearsEnd: w('disappears').end,
  your: w('Your').start, body: w('body').start, replaces: w('replaces').start, stuff: w('stuff').start, holding: w('holding').start, togetherEnd2: w('together', 1).end,
};
export const LOOP_T = FRAMES / FPS;
export const LAST = (FRAMES - 1) / FPS;

const L1 = seamLength('C1'), L2 = seamLength('C2'), L3 = seamLength('C3');
/** how far up the styloid seam the visible stroke runs (the incision's upper lip covers the rest) */
const S2_VIS = (() => {
  let s = 0;
  while (s < L2 && seamPoint('C2', s).y > -17) s += 0.05;
  return s;
})();

// ---------------------------------------------------------------- events
export const EV = {
  // the opening preview of fixation
  seat0: 0.04, seat1: 0.38,
  c1a: 0.36, c1b: 0.92, hop1: 1.05, c3b: 1.45, appUp1: 1.7,
  // the probe lets go of the wedge as the glue runs onto the wedge's face and backs off down-right along its own axis,
  // clear before the applicator hops across its line to the wedge's seam (0.92-1.05)
  probeUp0: 0.66, probeUp1: 1.04,
  // staggered: the applicator moves to the foot of the styloid seam first, then the probe (lifted) to a ready spot
  // beside the styloid fragment, below the cannula's line
  appMove1: 2.4, appDown1: 2.75, probeMove0: 2.5, probeMove1: 3.3,
  // on "Researchers": the applicator turns steep on its tip (its hand stays clear of the patient's thumb through the
  // reveal), and once the cannula has turned away the probe sets down on the styloid fragment
  appTurn0: Math.max(3.85, T.togetherEnd - 0.2), appTurn1: 0, probeIn0: 0, probeIn1: 0, probeDown1: 0,
  // "Researchers actually did it"
  c2a: Math.max(4.36, T.researchers + 0.28), c2b: Math.min(T.did, T.researchers + 1.05), appLift1: 0, appOut0: 0, appOut1: 0,
  // the dive and the oyster
  dive0: Math.max(5.85, T.they - 0.1), cutIn: T.inspired + 0.18, cutOut: T.rocksEnd + 0.08,
  reveal0: T.rocks - 0.05, reveal1: T.rocksEnd - 0.12,
  // the wet macro
  surge0: T.wet - 0.1, surge1: T.bloodyEnd + 0.2,
  pull0: T.woundEnd - 0.02, pull1: T.surgeons - 0.05,
  // fixation
  rel0: T.secured, rel1: T.secured + 0.6, probeOut0: T.secured + 0.5, probeOut1: T.pieces + 0.55,
  set0: T.three - 0.1, set1: T.minutesEnd,
  // closing and healing
  close0: T.minutesEnd - 0.35, close1: T.fracture + 0.3, sut0: T.fracture - 0.05, sut1: T.fracture + 0.45,
  dive2a: T.fracture - 0.15, dive2b: T.needed + 0.25,
  hem0: T.fracture + 0.25, hem1: T.needed + 0.05, soft0: T.needed - 0.05, soft1: T.months + 0.45,
  bridge0: T.heal - 0.15, bridge1: T.disappearsEnd - 0.1, hard0: T.healEnd - 0.4, hard1: T.grows + 0.4,
  // remodelling (woven -> mature bone) starts as the last glue goes and runs while the healing framing is held
  rem0: T.disappearsEnd - 0.45, rem1: T.body + 0.45,
  // the ending and the loop
  out0: T.body, out1: T.stuff + 0.3, curl0: T.stuff - 0.1, curl1: T.togetherEnd2 - 0.1,
  push0: T.togetherEnd2 + 0.0, push1: LOOP_T,
};
EV.appTurn1 = EV.appTurn0 + 0.45;
EV.probeIn0 = EV.appTurn0 + 0.13;
EV.probeIn1 = EV.appTurn0 + 0.43;
EV.probeDown1 = EV.appTurn0 + 0.55;
EV.c2a = Math.max(EV.c2a, EV.probeDown1 - 0.04); // the probe holds the fragment before the stroke starts
EV.appLift1 = EV.c2b + 0.35;
EV.appOut0 = Math.max(EV.appLift1 + 0.1, EV.dive0 - 0.2);
EV.appOut1 = EV.appOut0 + 0.8;

// ---------------------------------------------------------------- the applicator (the glue's front)
type AppPose = {tip: P; ang: number; lift: number; laying: {seam: SeamId; s: number} | null};
const APP_ANG = -0.42;
/** the applicator's angle at the foot of the styloid seam through the reveal (its hand off to the right) */
const APP_ANG_WAIT = -0.47;
/** its angle for the stroke: steep, from above, so the cannula stays left of the probe that holds the styloid fragment
 *  (at -0.47 it swept over the probe's ball and crossed its neck) */
const APP_ANG_S = -1.35;
const C3_TOP = 0.3;
const appPose = (t: number): AppPose => {
  const ang = APP_ANG + 0.03 * Math.sin(t * 1.3);
  if (t < EV.c1a) {
    const s = lerp(9.5, 10.4, clamp(t / EV.c1a));
    return {tip: seamPoint('C1', s), ang, lift: 0, laying: {seam: 'C1', s}};
  }
  if (t < EV.c1b) {
    const s = lerp(10.4, L1, ss(t, EV.c1a, EV.c1b) * 0.85 + 0.15 * clamp((t - EV.c1a) / (EV.c1b - EV.c1a)));
    return {tip: seamPoint('C1', s), ang, lift: 0, laying: {seam: 'C1', s}};
  }
  if (t < EV.hop1) {
    const u = ss(t, EV.c1b, EV.hop1);
    return {tip: lerpP(seamPoint('C1', L1), seamPoint('C3', L3), u), ang, lift: 0.55 * Math.sin(Math.PI * clamp((t - EV.c1b) / (EV.hop1 - EV.c1b))), laying: null};
  }
  if (t < EV.c3b) {
    const s = lerp(L3, C3_TOP, ss(t, EV.hop1, EV.c3b) * 0.8 + 0.2 * clamp((t - EV.hop1) / (EV.c3b - EV.hop1)));
    return {tip: seamPoint('C3', s), ang, lift: 0, laying: {seam: 'C3', s}};
  }
  const top3 = seamPoint('C3', C3_TOP);
  const c2foot = seamPoint('C2', 0.15);
  if (t < EV.appDown1) {
    // lift off the wedge's seam, travel (lifted) to the foot of the styloid seam, lower onto it
    const up = ss(t, EV.c3b, EV.appUp1);
    const mv = ss(t, EV.appUp1, EV.appMove1);
    const down = ss(t, EV.appMove1, EV.appDown1);
    return {tip: lerpP(top3, c2foot, mv), ang: lerp(ang, APP_ANG_WAIT, mv), lift: Math.max(0, up - down), laying: null};
  }
  // waiting at the foot, then turning steep on its tip for the stroke
  if (t < EV.c2a) return {tip: c2foot, ang: lerp(APP_ANG_WAIT, APP_ANG_S, ss(t, EV.appTurn0, EV.appTurn1)), lift: 0, laying: null};
  if (t < EV.c2b) {
    const s = lerp(0.15, S2_VIS, ss(t, EV.c2a, EV.c2b) * 0.7 + 0.3 * clamp((t - EV.c2a) / (EV.c2b - EV.c2a)));
    return {tip: seamPoint('C2', s), ang: APP_ANG_S - 0.05 * clamp((t - EV.c2a) / (EV.c2b - EV.c2a)), lift: 0, laying: {seam: 'C2', s}};
  }
  // the stroke done: the tip lifts cleanly, then the hand takes the applicator away
  return {tip: seamPoint('C2', S2_VIS), ang: APP_ANG_S - 0.05, lift: ss(t, EV.c2b, EV.appLift1), laying: null};
};

// ---------------------------------------------------------------- the probe

/** how far (mm) the probe backs off down-right along its own axis when it lets go of the wedge (past the radial
 *  border and below the cannula's line from the wedge seam's lower end) */
const PROBE_BACK = 6.5;
/** ... then settles this far (mm) down toward the frame's lower edge (a touch to the left), so it waits in view, below
 *  the cannula's line */
const PROBE_DROP = 4.5;
const PROBE_BACK_V = mul(pt(Math.cos(PROBE_ANG_W), Math.sin(PROBE_ANG_W)), PROBE_BACK);
const PROBE_DROP_V = pt(-0.25 * PROBE_DROP, PROBE_DROP);
const PROBE_PARK = add(add(WEDGE_PRESS, PROBE_BACK_V), PROBE_DROP_V);
/** where the probe waits (lifted) beside the styloid fragment while the applicator waits at the seam's foot: below the
 *  cannula's line, over the radial border */
const PROBE_READY = pt(11.25, -2.5);
/** ... nearly upright there, so its shaft passes left of the right rake's tines */
const PROBE_ANG_READY = 1.48;
const probePose = (t: number, wedge: WedgeX): {tip: P; ang: number; lift: number} => {
  if (t < EV.probeMove0) {
    // lift off the wedge, back away along the axis, then settle a little lower
    const back = ss(t, EV.probeUp0 + 0.04, EV.probeUp1), drop = ss(t, EV.probeUp1 - 0.1, EV.probeUp1 + 0.35);
    return {tip: add(add(xfPoint(WEDGE_PRESS, wedge), mul(PROBE_BACK_V, back)), mul(PROBE_DROP_V, drop)), ang: PROBE_ANG_W, lift: ss(t, EV.probeUp0, EV.probeUp0 + 0.16)};
  }
  if (t < EV.probeIn0) {
    const mv = ss(t, EV.probeMove0, EV.probeMove1);
    return {tip: lerpP(PROBE_PARK, PROBE_READY, mv), ang: lerp(PROBE_ANG_W, PROBE_ANG_READY, mv), lift: 1};
  }
  if (t < EV.probeDown1) {
    const mv = ss(t, EV.probeIn0, EV.probeIn1);
    return {tip: lerpP(PROBE_READY, STYLOID_PRESS, mv), ang: lerp(PROBE_ANG_READY, PROBE_ANG_S, mv), lift: 1 - ss(t, EV.probeIn1 - 0.04, EV.probeDown1)};
  }
  // holding the styloid fragment (a faint pressure tremor), released on "secured"
  return {tip: add(STYLOID_PRESS, mul(pt(Math.sin(t * 7.1), Math.cos(t * 5.3)), 0.02)), ang: PROBE_ANG_S, lift: ss(t, EV.rel0, EV.rel1)};
};

// ---------------------------------------------------------------- bone state
export const wedgeAt = (t: number): WedgeX => (t >= EV.seat1 ? WEDGE_SEATED : wedgeLerp(ss(t, EV.seat0, EV.seat1)));
const NONE: GlueSpan = {a: 0, b: 0};
const glueAt = (t: number): Record<SeamId, GlueSpan> => {
  const ap = appPose(Math.min(t, EV.c2b + 0.01));
  const c1 = t >= EV.c1b ? L1 : ap.laying?.seam === 'C1' ? ap.laying.s : L1;
  let c3: GlueSpan = NONE;
  if (t >= EV.hop1) {
    const a = t >= EV.c3b ? C3_TOP * (1 - ss(t, EV.c3b, EV.c3b + 0.5)) : ap.laying?.seam === 'C3' ? ap.laying.s : L3;
    c3 = {a, b: L3};
  }
  let c2: GlueSpan = NONE;
  if (t >= EV.c2a) {
    const b = t >= EV.c2b ? S2_VIS : ap.laying?.seam === 'C2' ? ap.laying.s : 0.15;
    // the rest of the styloid seam, under the incision's lip, fills unseen once the camera has dived away
    c2 = {a: 0, b: t > EV.dive0 + 0.8 ? L2 : b};
  }
  return {C1: {a: 0, b: c1}, C2: c2, C3: c3};
};
const healAt = (t: number): Heal2 => {
  if (t < EV.close0) return HEAL2_0;
  const bu = clamp((t - EV.bridge0) / (EV.bridge1 - EV.bridge0));
  return {
    hem: ss(t, EV.hem0, EV.hem1),
    soft: ss(t, EV.soft0, EV.soft1),
    // a steady advance that eases in and out (the fronts keep moving through the whole line, from the first frame)
    bridge: 0.5 * ss(bu, 0, 1) + 0.5 * bu,
    hard: ss(t, EV.hard0, EV.hard1),
    // a visible, steady progression rather than a quick ease-in-out cross-fade
    remodel: 0.6 * ss(t, EV.rem0, EV.rem1) + 0.4 * clamp((t - EV.rem0) / (EV.rem1 - EV.rem0)),
  };
};
/** the glue's fresh front: at the cannula while laying; when a run ends the tip lifts away and the proud fresh tail
 *  (and its bulb) settle into the ordinary rounded end over a moment (flow 1 -> 0) instead of vanishing in one frame */
const frontAt = (t: number, ap: AppPose): BoneState2['front'] => {
  if (ap.laying && t < EV.c2b) return {seam: ap.laying.seam, s: ap.laying.s, flow: 1};
  const settle = (t0: number, t1: number) => 1 - ss(t, t0, t1);
  if (t >= EV.c1b && t < EV.hop1) return {seam: 'C1', s: L1, flow: settle(EV.c1b, EV.hop1)};
  if (t >= EV.c3b && t < EV.c3b + 0.3) return {seam: 'C3', s: C3_TOP * (1 - ss(t, EV.c3b, EV.c3b + 0.5)), flow: settle(EV.c3b, EV.c3b + 0.3)};
  if (t >= EV.c2b && t < EV.c2b + 0.3) return {seam: 'C2', s: S2_VIS, flow: settle(EV.c2b, EV.c2b + 0.3)};
  return null;
};
export const boneAt = (t: number, px: number): BoneState2 => {
  const wedge = wedgeAt(t);
  const ap = appPose(t);
  const ins = instrAt(t);
  const pr = ins.probe;
  const front = frontAt(t, ap);
  const wet = ss(t, EV.cutOut - 0.05, EV.cutOut + 0.25) * (1 - ss(t, EV.pull0 + 0.25, EV.pull1 - 0.2));
  return {
    t, px, wedge,
    glue: glueAt(t),
    front,
    set: ss(t, EV.set0, EV.set1),
    press: ins.probeOn > 0.01 ? {p: pr.tip, contact: 1 - pr.lift} : null,
    appContact: ins.appOn > 0.01 ? {p: ins.app.tip, contact: 1 - ins.app.lift} : null,
    wet, flow: t - EV.cutOut,
    surge: t >= EV.surge0 && t <= EV.surge1 ? (t - EV.surge0) / (EV.surge1 - EV.surge0) : -1,
    heal: healAt(t),
  };
};

// ---------------------------------------------------------------- instruments and the surgeon
export const instrAt = (t: number): InstrState2 => {
  const ap = appPose(t);
  const pr = probePose(t, wedgeAt(t));
  const appOn = 1 - ss(t, EV.appOut0, EV.appOut1);
  const probeOn = 1 - ss(t, EV.probeOut0, EV.probeOut1);
  const pressing = ap.laying ? 1 : 0;
  return {
    app: {tip: ap.tip, ang: ap.ang, press: 0.25 + 0.6 * clamp(t / 6) * pressing + 0.15, gel: pressing, lift: ap.lift},
    probe: pr,
    appOn, probeOn,
    face: {focus: 0.75, smile: ss(t, T.did - 0.2, T.did + 0.25) * (1 - ss(t, EV.dive0, EV.dive0 + 0.5)), gx: -0.5, gy: 0.55, blink: Math.max(0, 1 - Math.abs(t - 4.6) / 0.07)},
    lean: 2 * ss(t, 1.5, 3.5) - 1.5 * ss(t, EV.rel0, EV.probeOut1),
    k: 1,
  };
};

// ---------------------------------------------------------------- the patient's arm
export type ArmS = {curl: number; thumb: number; incision: number; sutures: number; scar: number; window: {c: P; r: number; soft: number} | null; spread: number};
export const WINDOW_C = pt(-3, -14);
export const armAt = (t: number): ArmS => {
  const closing = ss(t, EV.close0, EV.close1);
  const sut = ss(t, EV.sut0, EV.sut1) * (1 - ss(t, EV.hard0, EV.rem1));
  const scar = ss(t, EV.hard0, EV.rem1);
  // the healing cutaway: a soft window opens over the fracture once the incision is closed, closes under the returning
  // skin in the ending, and opens again on the loop's push back into the bone
  let r = 0;
  if (t > EV.close1 - 0.1) r = 64 * ss(t, EV.close1 - 0.1, EV.dive2b) * (1 - ss(t, EV.out1 - 0.25, EV.out1 + 0.1));
  if (t > EV.push0) r = 64;
  // it opens out of the sutured incision (centred on it while small), then settles on the healing framing's centre
  const wc = t > EV.push0 ? WINDOW_C : lerpP(INCISION.c, WINDOW_C, ss(r, 6, 40));
  const win = r > 0.3 ? {c: wc, r, soft: 0.38} : null;
  // one small natural movement: the fingers flex gently and spread a touch, then relax
  const mv = t > EV.curl0 && t < EV.curl1 ? Math.sin(Math.PI * clamp((t - EV.curl0) / (EV.curl1 - EV.curl0))) ** 1.2 : 0;
  return {curl: 0.25 + 0.16 * mv, thumb: 0.2 + 0.3 * mv, incision: 1 - closing, sutures: sut, scar, window: win, spread: 0.55 * mv};
};
/** an opaque skin copy over the windowed skin: 0 during surgery and healing, 1 for the recovered wrist, clearing on the
 *  loop's push */
export const skinVeil = (t: number) => {
  if (t < EV.out0 - 0.1) return 0;
  // the skin is whole again early in the ease-out (no x-ray look over the hand); on the loop's push it clears only once
  // the camera is close on the radius
  const up = ss(t, EV.out0 - 0.1, EV.out0 + 0.5);
  const down = ss(t, EV.push1 - 0.62, EV.push1 - 0.12);
  return up * (1 - down);
};
export const tableVariant = (t: number): 'drape' | 'followup' => (t < EV.close1 ? 'drape' : 'followup');
export const surgeonOn = (t: number) => t < EV.close1 && t < EV.probeOut1 + 0.2;

// ---------------------------------------------------------------- the camera
export type World = 'wrist' | 'oyster';
export type WCam = {world: World; cam: Cam; reveal?: number};
/** frame 0: the fracture fills the frame (the transverse seam, the styloid seam, the wedge on the radial side) */
export const CAM0: Cam = {x: 4.0, y: -0.6, w: 26, k: 1, focus: 0};
/** the opening's drift (mm/s, log-w/s): the loop's push lands on CAM0 with this velocity */
const V_OPEN = {x: 0.5, y: 0.0, lw: -0.025};
/** the end of the pull-back: the palm-up hand (palm, thumb, the index finger's base) and the wrist read, the fracture
 *  still large in the lower middle above the captions. Reached on "together" and held (a slow drift) to its end. */
const REVEAL: Cam = {x: 9, y: -36, w: 124, k: 0.98, focus: -5};
const REVEAL_T = 3.6;
/** "Researchers actually did it": closer on the incision and the gloved hand's stroke */
const ACT: Cam = {x: 8.5, y: -10, w: 62, k: 1, focus: -3};
/** the match framing: the glue band in the transverse seam, centred near screen y 1000 (production/v2_match_band.json) */
export const MATCH: Cam = {x: -7, y: 0.7247, w: 7.5, k: 1, focus: 0};
const M_IN: Cam = {...MATCH, w: 9.2};
const WET1: Cam = {x: -2.2, y: 0.4, w: 13.5, k: 1, focus: 0};
/** the fixation framing: the incision large, the probe holding the styloid fragment */
const FIX: Cam = {x: 6, y: -4, w: 58, k: 1, focus: -3};
const FIX2: Cam = {x: 5.6, y: -3.6, w: 53, k: 1, focus: -3};
const HEAL: Cam = {x: 3.2, y: -0.8, w: 30, k: 1, focus: 0};
const HEAL_B: Cam = {x: 3.4, y: -0.6, w: 27.5, k: 1, focus: 0};
const FOLLOW: Cam = {x: -6, y: -76, w: 182, k: 1, focus: -10};
const FOLLOW_B: Cam = {x: -5, y: -72, w: 172, k: 1, focus: -10};

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
/** a no-slip zoom about one fixed point whose log-width ease has given end slopes (log-w per second); vEnd/vStart add
 *  lateral velocity at the ends (mm/s) without moving either key */
const zoomH = (t: number, t0: number, A: Cam, t1: number, B: Cam, lv0: number, lv1: number, vEnd: P = pt(0, 0), vStart: P = pt(0, 0)): Cam => {
  const D = t1 - t0, u = clamp((t - t0) / D);
  const dl = Math.log(B.w) - Math.log(A.w);
  const m0 = Math.abs(dl) < 1e-9 ? 0 : (lv0 * D) / dl, m1 = Math.abs(dl) < 1e-9 ? 0 : (lv1 * D) / dl;
  const e = (x: number) => -2 * x ** 3 + 3 * x ** 2 + (x ** 3 - 2 * x ** 2 + x) * m0 + (x ** 3 - x ** 2) * m1;
  const c = zoomAbout(u, A, B, e);
  const h11 = u ** 3 - u ** 2, h10 = u ** 3 - 2 * u ** 2 + u;
  return {...c, x: c.x + D * (h11 * vEnd.x + h10 * vStart.x), y: c.y + D * (h11 * vEnd.y + h10 * vStart.y), k: lerp(A.k ?? 1, B.k ?? 1, ss(u, 0, 1)), focus: lerp(A.focus ?? 0, B.focus ?? 0, ss(u, 0, 1))};
};
const drift = (A: Cam, v: CV, dt: number): Cam => ({...A, x: A.x + v.x * dt, y: A.y + v.y * dt, w: A.w * Math.exp(v.lw * dt)});

const PULL0 = 1.45;
const CAM0_B = drift(CAM0, V_OPEN, PULL0);
const V_REVEAL: CV = {x: 0.3, y: 0.4, lw: 0.03};
const V_ACT: CV = {x: 0.3, y: 0.4, lw: -0.04};
const openCam = (t: number): Cam => {
  if (t < PULL0) return drift(CAM0, V_OPEN, t);
  // a no-slip pull-back: the fracture moves steadily down the frame (never into the captions) as the hand appears
  if (t < REVEAL_T) return zoomH(t, PULL0, CAM0_B, REVEAL_T, REVEAL, V_OPEN.lw, V_REVEAL.lw, pt(V_REVEAL.x, V_REVEAL.y), pt(V_OPEN.x, V_OPEN.y));
  // the hand and wrist held (still drifting gently back) to the end of "together"
  if (t < T.togetherEnd) return drift(REVEAL, V_REVEAL, t - REVEAL_T);
  // a slow push toward the incision for the precise stroke
  if (t < EV.c2b) return hermite(t, T.togetherEnd, drift(REVEAL, V_REVEAL, T.togetherEnd - REVEAL_T), V_REVEAL, EV.c2b, ACT, V_ACT);
  return drift(ACT, V_ACT, t - EV.c2b);
};
const LV_DIVE_END = -0.5;
const diveCam = (t: number) => {
  const A = drift(ACT, V_ACT, EV.dive0 - EV.c2b);
  return zoomH(t, EV.dive0, A, EV.cutIn, M_IN, V_ACT.lw, LV_DIVE_END, pt(0, 0), pt(V_ACT.x, V_ACT.y));
};
const OY_CREEP = 0.07;
/** the oyster push's log-width speed at the cut back (log-w per second) */
const LV_OY_OUT = (OY_CREEP * (Math.log(OY_CAM_OUT.w) - Math.log(OY_CAM_IN.w))) / (EV.cutOut - EV.cutIn);
const oysterCam = (t: number): Cam => {
  const u = clamp((t - EV.cutIn) / (EV.cutOut - EV.cutIn));
  // the medium shot holds long enough to read (a slow creep), the push runs into the base, then creeps on through the
  // reveal and is still moving at the cut back (the wet macro continues it)
  const e = (x: number) => OY_CREEP * x + (1 - OY_CREEP) * ss(x, 0.22, 0.7);
  return zoomAbout(u, OY_CAM_IN, OY_CAM_OUT, e);
};
const wristCam = (t: number): Cam => {
  if (t < EV.pull0) return hermite(t, EV.cutOut, MATCH, {x: 0, y: 0, lw: LV_OY_OUT}, EV.pull0, WET1, {x: 1.0, y: -0.2, lw: 0.08});
  if (t < EV.pull1) return zoomH(t, EV.pull0, WET1, EV.pull1, FIX, 0.08, -0.03, pt(-0.3, 0.15), pt(1.0, -0.2));
  if (t < EV.dive2a) return hermite(t, EV.pull1, FIX, {x: -0.3, y: 0.15, lw: -0.03}, EV.dive2a, FIX2, {x: -0.5, y: 0.2, lw: -0.05});
  if (t < EV.dive2b) return zoomH(t, EV.dive2a, FIX2, EV.dive2b, HEAL, -0.05, -0.02, pt(0.04, 0.03), pt(-0.5, 0.2));
  if (t < EV.out0) return hermite(t, EV.dive2b, HEAL, {x: 0.04, y: 0.03, lw: -0.02}, EV.out0, HEAL_B, {x: 0.04, y: 0.03, lw: -0.02});
  if (t < EV.out1) return zoomH(t, EV.out0, HEAL_B, EV.out1, FOLLOW, -0.02, -0.04, pt(0.5, 2.0), pt(0.04, 0.03));
  if (t < EV.push0) return hermite(t, EV.out1, FOLLOW, {x: 0.5, y: 2.0, lw: -0.04}, EV.push0, FOLLOW_B, {x: 0.8, y: 3.0, lw: -0.08});
  // the loop: push back in onto the opening's framing, landing with the opening's own drift
  return zoomH(t, EV.push0, FOLLOW_B, EV.push1, CAM0, -0.08, V_OPEN.lw, pt(V_OPEN.x, V_OPEN.y), pt(0.8, 3.0));
};

export const camAt = (t: number): WCam => {
  if (t < EV.dive0) return {world: 'wrist', cam: openCam(t)};
  if (t < EV.cutIn) return {world: 'wrist', cam: diveCam(t)};
  if (t < EV.cutOut) return {world: 'oyster', cam: oysterCam(t), reveal: ss(t, EV.reveal0, EV.reveal1)};
  return {world: 'wrist', cam: wristCam(t)};
};
