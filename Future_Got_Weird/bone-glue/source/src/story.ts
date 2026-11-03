// V2 timeline. Every beat is keyed to the measured narration (data/timeline.json via word()). One wrist world
// (millimetres, anatomy.ts; fracture interfaces and the moving wedge fragment in art/seams.ts) and one oyster world,
// matched in and out. See production/V2_PLAN.md.
//
//   0.00-1.35   frame 0 is the whole wrist (palm, thumb, the open incision, the shattered radius, the gloved hands); a
//               no-slip push straight into the fracture while the probe seats the wedge and the glue runs along the
//               transverse seam
//   0.80-2.15   the probe lets go alone, the applicator glues the wedge's seam, then the styloid seam: sealed by 2.15
//   2.30-4.45   ease back to the surgical framing as the applicator is taken away; on "Researchers" the probe sets
//               down on the styloid fragment and holds it
//   5.10-7.98   from "did it": a no-slip dive onto the glue band in the transverse seam
//   7.98-10.33  match cut to the oyster -> an immediate push to its base -> on "sticking" a window exposes shell /
//               cement / rock -> the cement band dissolves into the glue band (same screen line) on the cut back
//   10.33-13.6  macro: a fluid sheet washes across the bonded seam; a stronger blood wash on "wet, bloody"
//   13.6-15.0   "In one reported wrist case": out to the whole wrist; 15.0-16.0 "surgeons secured": back in
//   16.56-17.7  the probe lets go and withdraws; nothing moves; "three minutes": the gloss sets to satin
//   18.35-19.9  the incision closes (sutures); the cutaway pushes in on the same fracture, same orientation
//   19.9-21.1   hematoma -> soft callus on the whole fracture
//   21.1-22.7   "new bone grows": in to a macro of the T-junctions, woven bone advancing from both faces into the glue
//   22.6-24.5   "the glue gradually disappears": back out over the whole fracture as the last islands close
//   24.6-25.4   remodelling; the skin returns
//   25.1-27.4   out to the recovered hand on the follow-up table; the wrist bends toward the thumb, across to the
//               little-finger side and back, the fingers spreading
//   27.44-end   push back in onto frame 0's wide framing (the drape returns, the scar opens into the incision's
//               outline over healed bone), still moving at the hook's speed: the loop cuts to frame 0 (the healed bone
//               is never shown breaking)
import {P, pt, lerpP, add, mul, sub} from './core/geo';
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
  oysters: w('oysters').start, sticking: w('sticking').start, rocks: w('rocks').start, rocksEnd: w('rocks').end,
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
  // the hook: frame 0 is the whole wrist (palm, thumb, the open incision, the shattered radius, the gloved hands); the
  // camera pushes straight into the fracture while the repair happens: the probe seats the displaced wedge, the glue
  // runs along the transverse seam, the probe lets go alone, the applicator glues the wedge's seam and then the
  // styloid seam: every crack is sealed by ~2.15 s
  seat0: 0.04, seat1: 0.50,
  c1a: 0.25, c1b: 0.78, hop0: 0.95, hop1: 1.10, c3b: 1.40, appUp1: 1.47,
  probeUp0: 0.80, probeUp1: 1.08,
  appMove1: 1.62, appDown1: 1.68,
  appTurn0: 1.68, appTurn1: 1.69,
  c2a: 1.70, c2b: 2.15, appLift1: 2.45, appOut0: 2.55, appOut1: 3.45,
  // "imagine gluing the bones back together": the camera eases back to the surgical framing as the applicator's hand
  // takes it away and the probe (lifted) moves beside the styloid fragment; on "Researchers" it sets down and holds it
  probeMove0: 2.6, probeMove1: 3.4, probeIn0: 3.95, probeIn1: 4.35, probeDown1: 4.45,
  // the dive and the oyster (the push to its base starts at once; the section window opens on "sticking")
  dive0: T.did - 0.1, cutIn: T.inspired + 0.18, cutOut: T.rocksEnd + 0.08,
  reveal0: T.sticking - 0.05, reveal1: T.rocks + 0.05,
  // the wet macro (the wash takes ~0.8 s to cross the frame, so the glue is seen holding under it)
  surge0: T.wet - 0.1, surge1: T.bloodyEnd + 0.55,
  // "In one reported wrist case": out to the whole wrist on the table; "surgeons secured": in to the fixation framing
  pull0: T.woundEnd - 0.02, pull1: T.reported + 0.75, fix1: T.secured + 0.55,
  // fixation: the probe lets go on "pieces", the fragments stay; "three minutes": the gel sets
  rel0: T.pieces - 0.2, rel1: T.pieces + 0.3, probeOut0: 0, probeOut1: 0,
  set0: 0, set1: 0,
  // closing and healing: the incision is sutured, the cutaway pushes in (hematoma, soft callus), "new bone grows": in to
  // a macro of the T-junction where woven bone advances into the glue, "the glue gradually disappears": back out over
  // the whole fracture as the last islands close
  close0: T.minutesEnd - 0.35, close1: T.fracture + 0.3, sut0: T.fracture - 0.15, sut1: T.fracture + 0.22,
  dive2a: T.fracture - 0.15, dive2b: T.needed + 0.25,
  hem0: T.fracture + 0.25, hem1: T.needed + 0.05, soft0: T.needed - 0.05, soft1: T.months + 0.45,
  bridge0: T.needed, bridge1: T.disappearsEnd - 0.1, hard0: T.healEnd - 0.4, hard1: T.grows + 0.4,
  mac0: T.but - 0.05, mac1: T.grows + 0.1, back0: T.glue2 - 0.1, back1: T.disappearsEnd - 0.25,
  // remodelling (woven -> mature bone) as the last glue goes
  rem0: T.disappearsEnd - 0.15, rem1: T.disappearsEnd + 0.35,
  // the ending: out to the recovered hand, which bends at the wrist (radial, ulnar, back) with the fingers spreading
  out0: T.body + 0.05, out1: T.replaces + 0.6, curl0: T.stuff - 0.25, curl1: T.togetherEnd2 - 0.05,
  bend0: T.stuff - 0.3, bend1: T.togetherEnd2 - 0.02,
  // the loop: push back in onto the opening's wide framing, still moving at the hook's own speed
  push0: T.togetherEnd2 + 0.0, push1: LOOP_T,
};
EV.probeOut0 = EV.rel0 + 0.45;
// the wrist starts to move once the camera has settled on it
EV.bend0 = Math.max(EV.bend0, EV.out1 - 0.05);
EV.probeOut1 = EV.probeOut0 + 0.75;
// the gel sets from gloss to satin as soon as the probe has cleared, on "in just three minutes"
EV.set0 = EV.probeOut1 - 0.45;
EV.set1 = EV.set0 + 1.0;

// ---------------------------------------------------------------- the applicator (the glue's front)
type AppPose = {tip: P; ang: number; lift: number; laying: {seam: SeamId; s: number} | null};
const APP_ANG = -0.42;
/** the applicator's angle at the foot of the styloid seam through the reveal (its hand off to the right) */
const APP_ANG_WAIT = -0.47;
/** its angle for the styloid stroke, steepening a little as it climbs (the probe is parked well clear) */
const appAngS = (s: number) => lerp(APP_ANG_WAIT, APP_ANG_WAIT - 0.12, ss(s, 2, 17));
const C3_TOP = 0.3;
/** the hop's sideways bow (mm, toward the wedge's face) */
const HOP_ARC = 1.2;
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
  // parked at the seam's end while the probe lets go of the wedge
  if (t < EV.hop0) return {tip: seamPoint('C1', L1), ang, lift: 0, laying: null};
  if (t < EV.hop1) {
    // then a short lifted hop on a slight arc over the bone (not parallel to the probe's exit) to the wedge seam's foot
    const u = ss(t, EV.hop0, EV.hop1), arc = Math.sin(Math.PI * clamp((t - EV.hop0) / (EV.hop1 - EV.hop0)));
    const a = seamPoint('C1', L1), b = seamPoint('C3', L3), d = sub(b, a), n = Math.hypot(d.x, d.y) || 1;
    const side = pt((-d.y / n) * HOP_ARC * arc, (d.x / n) * HOP_ARC * arc);
    return {tip: add(lerpP(a, b, u), side), ang, lift: 0.55 * arc, laying: null};
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
  if (t < EV.c2a) return {tip: c2foot, ang: APP_ANG_WAIT, lift: 0, laying: null};
  if (t < EV.c2b) {
    const s = lerp(0.15, S2_VIS, ss(t, EV.c2a, EV.c2b) * 0.7 + 0.3 * clamp((t - EV.c2a) / (EV.c2b - EV.c2a)));
    return {tip: seamPoint('C2', s), ang: appAngS(s), lift: 0, laying: {seam: 'C2', s}};
  }
  // the stroke done: the tip lifts cleanly, then the hand takes the applicator away
  return {tip: seamPoint('C2', S2_VIS), ang: appAngS(S2_VIS), lift: ss(t, EV.c2b, EV.appLift1), laying: null};
};

// ---------------------------------------------------------------- the probe

/** how far (mm) the probe backs off down-right along its own axis when it lets go of the wedge (past the radial
 *  border and below the cannula's line from the wedge seam's lower end) */
const PROBE_BACK = 8;
/** ... then settles this far (mm) down toward the frame's lower edge (a touch to the left), so it waits in view, below
 *  the cannula's line */
const PROBE_DROP = 24;
const PROBE_BACK_V = mul(pt(Math.cos(PROBE_ANG_W), Math.sin(PROBE_ANG_W)), PROBE_BACK);
const PROBE_DROP_V = pt(-0.25 * PROBE_DROP, PROBE_DROP);
const PROBE_PARK = add(add(WEDGE_PRESS, PROBE_BACK_V), PROBE_DROP_V);
/** where the probe waits (lifted) beside the styloid fragment while the applicator waits at the seam's foot: below the
 *  cannula's line, over the radial border */
const PROBE_READY = pt(12.2, -4.8);
/** ... steep there, so its shaft passes below the right rake's tines (the lifted ball is drawn ~2.7 mm lower: over the
 *  styloid fragment's right part, clear of the wedge and the transverse seam) */
const PROBE_ANG_READY = 1.3;
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
    surge: t < EV.surge0 ? -1 : clamp((t - EV.surge0) / (EV.surge1 - EV.surge0)), // held at 1 after the wash (no tint pop)
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
export type ArmS = {curl: number; thumb: number; incision: number; sutures: number; scar: number; window: {c: P; r: number; soft: number; inc?: number} | null; spread: number; bend: number};
export const WINDOW_C = pt(-3, -14);
export const armAt = (t: number): ArmS => {
  const closing = ss(t, EV.close0, EV.close1);
  const sut = ss(t, EV.sut0, EV.sut1) * (1 - ss(t, EV.hard0, EV.hard1));
  const scar = ss(t, EV.hard0, EV.rem1);
  // the healing cutaway: a soft window opens over the fracture once the incision is closed, closes under the returning
  // skin in the ending, and opens again on the loop's push back into the bone
  let r = 0;
  if (t > EV.close1 - 0.1) r = 64 * ss(t, EV.close1 - 0.1, EV.dive2b) * (1 - ss(t, EV.out1 - 0.25, EV.out1 + 0.1));
  const shut = ss(t, EV.push1 - 0.9, EV.push1);
  if (t > EV.push0) r = lerp(28, 18, shut);
  // ... and in its last moments it takes the incision's own outline, crisp edge and fat ring, so the cut to frame 0
  // changes the fracture and the instruments, not the wound's shape (the scar fades under it)
  const inc = t > EV.push0 ? ss(t, EV.push1 - 0.45, EV.push1) : 0;
  // it opens out of the sutured incision (centred on it while small), then settles on the healing framing's centre
  const wc = t > EV.push0 ? INCISION.c : lerpP(INCISION.c, WINDOW_C, ss(r, 6, 40));
  const win = r > 0.3 ? {c: wc, r, soft: lerp(0.22, 0.07, inc), inc} : null;
  // the working wrist: the hand bends toward the thumb, across to the little-finger side and back (radial then ulnar
  // deviation, the ulnar swing a little larger, as in a real wrist), the fingers spreading at each end of the swing
  const bu = clamp((t - EV.bend0) / (EV.bend1 - EV.bend0));
  const sw = t > EV.bend0 && t < EV.bend1 ? Math.sin(2 * Math.PI * bu) * Math.sin(Math.PI * bu) ** 0.35 : 0;
  const bend = sw * (sw > 0 ? 0.3 : 0.38);
  const mv = t > EV.curl0 && t < EV.curl1 ? Math.sin(Math.PI * clamp((t - EV.curl0) / (EV.curl1 - EV.curl0))) ** 1.2 : 0;
  return {curl: 0.25 + 0.1 * mv, thumb: 0.2 + 0.2 * mv, incision: 1 - closing, sutures: sut, scar: scar * (1 - inc), window: win, spread: 0.3 * mv + 0.5 * Math.abs(sw), bend};
};
/** an opaque skin copy over the windowed skin: 0 during surgery and healing, 1 for the recovered wrist, clearing on the
 *  loop's push */
export const skinVeil = (t: number) => {
  if (t < EV.out0 - 0.1) return 0;
  // the skin is whole again early in the ease-out (no x-ray look over the hand); on the loop's push it clears only once
  // the camera is close on the radius
  const up = ss(t, EV.out0 - 0.1, EV.out0 + 0.25);
  const down = ss(t, EV.push1 - 0.42, EV.push1 - 0.17);
  return up * (1 - down);
};
/** 0 = the surgical drape, 1 = the follow-up table; on the loop's push the drape returns under the hand */
export const tableMix = (t: number) => (t < EV.dive2b ? 0 : 1 - ss(t, EV.push1 - 0.55, EV.push1 - 0.05));
export const tableVariant = (t: number): 'drape' | 'followup' => (tableMix(t) > 0.5 ? 'followup' : 'drape');
export const surgeonOn = (t: number) => t < EV.close1 && t < EV.probeOut1 + 0.2;

// ---------------------------------------------------------------- the camera
export type World = 'wrist' | 'oyster';
export type WCam = {world: World; cam: Cam; reveal?: number};
/** the close-up of the repair: the fracture fills the frame (the transverse seam, the styloid seam, the wedge) */
export const CAM0: Cam = {x: 4.0, y: -0.6, w: 26, k: 1, focus: 0};
/** the close-up's drift (mm/s, log-w/s) */
const V_OPEN = {x: 0.5, y: 0.0, lw: -0.025};
/** frame 0: the whole wrist reads at once (palm, thumb, wrist crease, the open incision with the shattered radius, the
 *  gloved hands and instruments), the fracture above the captions. The camera is already pushing in. */
export const HOOK0: Cam = {x: 4, y: -22, w: 112, k: 0.99, focus: -4};
/** the hook's push speed at frame 0 (log-w per second); the loop's push arrives with this same speed */
const LV_HOOK = -0.55;
/** the push lands on the close-up as the wedge's seam is being glued */
const HOOK_T = 1.35;
/** "imagine gluing the bones back together": the surgical framing, the sealed fracture large, the gloved hands */
const ACT2: Cam = {x: 7.5, y: -8, w: 56, k: 1, focus: -3};
const ACT2_T0 = 2.3, ACT2_T = 3.6;
/** the match framing: the glue band in the transverse seam, centred near screen y 1000 (production/v2_match_band.json) */
export const MATCH: Cam = {x: -7, y: 0.7247, w: 7.5, k: 1, focus: 0};
const M_IN: Cam = {...MATCH, w: 9.2};
const WET1: Cam = {x: -2.2, y: 0.4, w: 13.5, k: 1, focus: 0};
/** "In one reported wrist case": the whole wrist again, now sealed, the surgeon's hand holding the fragment */
const CASE: Cam = {x: 5, y: -24, w: 106, k: 0.99, focus: -4};
/** the fixation framing: the incision large, the probe holding the styloid fragment */
const FIX: Cam = {x: 6, y: -4, w: 58, k: 1, focus: -3};
const FIX2: Cam = {x: 5.6, y: -3.6, w: 53, k: 1, focus: -3};
const HEAL: Cam = {x: 3.2, y: -0.8, w: 30, k: 1, focus: 0};
/** ... gliding toward the radial side, where the soft callus swells over the cortex, while the fronts begin */
const HEAL_B: Cam = {x: 6.2, y: -1.6, w: 23.5, k: 1, focus: 0};
/** "new bone grows": a macro of the T-junctions, where woven bone advances from both faces into the glue */
const MACRO_H: Cam = {x: 5, y: -1, w: 11.5, k: 1, focus: 0};
/** "the glue gradually disappears": back out over the whole fracture */
const HEAL_W: Cam = {x: 3.6, y: -2.5, w: 34, k: 1, focus: 0};
/** the recovered hand on the follow-up table, large enough for the wrist's movement to read */
const FOLLOW: Cam = {x: -5, y: -88, w: 210, k: 1, focus: -10};

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

const V_ACT2: CV = {x: 0.3, y: 0.3, lw: -0.035};
const openCam = (t: number): Cam => {
  // frame 0 wide, already moving: a no-slip push straight into the fracture while it is repaired
  if (t < HOOK_T) return zoomH(t, 0, HOOK0, HOOK_T, CAM0, LV_HOOK, V_OPEN.lw, pt(V_OPEN.x, V_OPEN.y), pt(0, 0));
  if (t < ACT2_T0) return drift(CAM0, V_OPEN, t - HOOK_T);
  // the fracture sealed: ease back to the surgical framing as the applicator is taken away
  if (t < ACT2_T) return zoomH(t, ACT2_T0, drift(CAM0, V_OPEN, ACT2_T0 - HOOK_T), ACT2_T, ACT2, V_OPEN.lw, V_ACT2.lw, pt(V_ACT2.x, V_ACT2.y), pt(V_OPEN.x, V_OPEN.y));
  return drift(ACT2, V_ACT2, t - ACT2_T);
};
/** the dive eases nearly to the oyster's opening creep at the cut (no dead stop across it) */
const LV_DIVE_END = -0.15;
const diveCam = (t: number) => {
  const A = drift(ACT2, V_ACT2, EV.dive0 - ACT2_T);
  return zoomH(t, EV.dive0, A, EV.cutIn, M_IN, V_ACT2.lw, LV_DIVE_END, pt(0, 0), pt(V_ACT2.x, V_ACT2.y));
};
const OY_CREEP = 0.07;
/** the oyster push's log-width speed at the cut back (log-w per second) */
const LV_OY_OUT = (OY_CREEP * (Math.log(OY_CAM_OUT.w) - Math.log(OY_CAM_IN.w))) / (EV.cutOut - EV.cutIn);
const oysterCam = (t: number): Cam => {
  const u = clamp((t - EV.cutIn) / (EV.cutOut - EV.cutIn));
  // the medium shot holds long enough to read (a slow creep), the push runs into the base, then creeps on through the
  // reveal and is still moving at the cut back (the wet macro continues it)
  const e = (x: number) => OY_CREEP * x + (1 - OY_CREEP) * ss(x, 0.05, 0.6);
  return zoomAbout(u, OY_CAM_IN, OY_CAM_OUT, e);
};
const V_FOLLOW: CV = {x: 0.3, y: -0.5, lw: -0.02};
const wristCam = (t: number): Cam => {
  if (t < EV.pull0) return hermite(t, EV.cutOut, MATCH, {x: 0, y: 0, lw: LV_OY_OUT}, EV.pull0, WET1, {x: 1.0, y: -0.2, lw: 0.08});
  // "In one reported wrist case": out to the whole wrist; "surgeons secured": in to the fixation framing
  if (t < EV.pull1) return zoomH(t, EV.pull0, WET1, EV.pull1, CASE, 0.08, 0, pt(0, 0), pt(1.0, -0.2));
  if (t < EV.fix1) return zoomH(t, EV.pull1, CASE, EV.fix1, FIX, 0, -0.03, pt(-0.3, 0.15), pt(0, 0));
  if (t < EV.dive2a) return hermite(t, EV.fix1, FIX, {x: -0.3, y: 0.15, lw: -0.03}, EV.dive2a, FIX2, {x: -0.5, y: 0.2, lw: -0.05});
  if (t < EV.dive2b) return zoomH(t, EV.dive2a, FIX2, EV.dive2b, HEAL, -0.05, -0.04, pt(0.04, 0.03), pt(-0.5, 0.2));
  // healing: hematoma and callus on the whole fracture; "new bone grows": in to the macro; "disappears": back out
  if (t < EV.mac0) return hermite(t, EV.dive2b, HEAL, {x: 0.6, y: -0.2, lw: -0.04}, EV.mac0, HEAL_B, {x: 0.3, y: 0, lw: -0.2});
  if (t < EV.mac1) return zoomH(t, EV.mac0, HEAL_B, EV.mac1, MACRO_H, -0.2, -0.03, pt(0.05, 0), pt(0.3, 0));
  if (t < EV.back0) return drift(MACRO_H, {x: 0.05, y: 0, lw: -0.03}, t - EV.mac1);
  const mB = drift(MACRO_H, {x: 0.05, y: 0, lw: -0.03}, EV.back0 - EV.mac1);
  if (t < EV.back1) return zoomH(t, EV.back0, mB, EV.back1, HEAL_W, -0.03, 0.02, pt(0, 0), pt(0.05, 0));
  if (t < EV.out0) return drift(HEAL_W, {x: 0, y: 0, lw: 0.02}, t - EV.back1);
  const hB = drift(HEAL_W, {x: 0, y: 0, lw: 0.02}, EV.out0 - EV.back1);
  // the ending: out to the recovered hand, held (a gentle drift) while the wrist moves
  if (t < EV.out1) return zoomH(t, EV.out0, hB, EV.out1, FOLLOW, 0.02, V_FOLLOW.lw, pt(V_FOLLOW.x, V_FOLLOW.y), pt(0, 0));
  if (t < EV.push0) return drift(FOLLOW, V_FOLLOW, t - EV.out1);
  // the loop: push back in onto frame 0's wide framing, arriving at the hook's own push speed (it carries on through
  // the cut into the opening's push)
  return zoomH(t, EV.push0, drift(FOLLOW, V_FOLLOW, EV.push0 - EV.out1), EV.push1, HOOK0, V_FOLLOW.lw, LV_HOOK, pt(0, 0), pt(V_FOLLOW.x, V_FOLLOW.y));
};

/** the cut back from the oyster: its cement band dissolves into the glue band, which lies on the same screen line */
export const CUT_BACK_DISSOLVE = 0.22;
export const cutBackBlend = (t: number) => (t >= EV.cutOut - CUT_BACK_DISSOLVE && t < EV.cutOut ? ss(t, EV.cutOut - CUT_BACK_DISSOLVE, EV.cutOut) : 0);
export const wristCamAt = (t: number): Cam => wristCam(t);
export const camAt = (t: number): WCam => {
  if (t < EV.dive0) return {world: 'wrist', cam: openCam(t)};
  if (t < EV.cutIn) return {world: 'wrist', cam: diveCam(t)};
  if (t < EV.cutOut) return {world: 'oyster', cam: oysterCam(t), reveal: ss(t, EV.reveal0, EV.reveal1)};
  return {world: 'wrist', cam: wristCam(t)};
};
