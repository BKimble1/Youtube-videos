// V3 timeline. Every beat is keyed to the measured narration (data/timeline.json via word()). Worlds: the wrist (one
// world in millimetres, anatomy.ts; the fracture's seams and its three movable fragments in art/seams.ts), the lab
// (art/lab.tsx), the oyster (art/oyster.tsx) and the micro section of the bond (art/micro.tsx). See production/V3_PLAN.md.
//
//   0.00        frame 0: a cutaway of the wrist, the distal radius shattered (the articular fragments split apart and
//               lifted off the transverse seam, the wedge out), the camera already pushing in
//   0.12-1.05   the applicator injects at the C1/C2 junction: glue fronts race out along every crack at once
//   0.40-1.45   reduction forceps bite the two articular fragments and close: the fragments slide together and seat,
//               squeezing the glue to a thin band (the tool moves the bone, never the glue)
//   1.45-2.55   the tools withdraw; a fast pull-out to the whole forearm and hand: aligned, held by teal lines
//   2.55-3.72   the fingers flex; a fast push into the glue band -> match cut to the lab's bead
//   3.72-7.13   the lab: the researcher lays the bead along a specimen's crack, presses the halves; a drop falls into a
//               beaker of seawater, the camera plunges after it -> dissolve into the oyster's sea
//   7.13-9.5    the oyster on its rock in the current; push to its base; the section shows its cement -> the cement
//               band dissolves into the glue band on the same screen line
//   9.5-10.4    wet macro: fluid sheets over the bonded seam
//   10.4-11.2   the micro section: the adhesive flows into the bone's pores, pushes the fluid aside, grips both faces
//   11.2-12.4   back to the macro: the blood wash on "wet, bloody"; the bond holds
//   12.4-13.65  "In one reported wrist case": out to the patient's wrist in surgery
//   13.65-15.4  "surgeons secured the broken pieces": the probe seats the displaced wedge, the glue runs into its seams,
//               the probe lets go: nothing moves
//   15.4-17.3   "in just three minutes": a track across the bonded fracture while the gel cures (a glint runs along every
//               seam, leaving satin); the hands leave
//   17.3-22.6   the incision is sutured; the cutaway (same fracture, same orientation): hematoma, callus; "new bone
//               grows": a macro of the T-junctions; "disappears": back out as the last glue goes
//   22.9-25.27  the recovered hand: the wrist bends toward the thumb, across and back
//   25.27-end   a push back onto frame 0's composition (the same cutaway, over healed bone), and a short matched dissolve
//               into frame 0
import {P, pt, lerpP, add, mul, sub} from './core/geo';
import {FPS, FRAMES, clamp, lerp, ss, word} from './lib';
import {Cam, zoomAbout} from './camera';
import {
  SeamId, WEDGE_PRESS, PROBE_ANG_W, WEDGE_SEATED, seamLength, seamPoint, seamEdgeSeated, wedgeLerp, xfPoint, xfFrag, WedgeX,
  Poses, POSES_SEATED, posesLerp, S_C2_ON_C1, S_C3_ON_C1,
} from './art/seams';
import {BoneState2, GlueFront, GlueSpan, Heal2, HEAL2_0, InstrState2} from './v2state';
import * as OY from './art/oyster';
import {INCISION} from './art/anatomy';
import {LabState, labSuggest, LAB_T} from './art/lab';
import {MicroState, MICRO_IN, MICRO_OUT} from './art/micro';
import {ForcepsState} from './art/forceps';
import type {Win} from './art/arm';

const OYX = OY as unknown as {OY_CAM_IN?: Cam; OY_CAM_OUT?: Cam};
const OY_CAM_IN: Cam = OYX.OY_CAM_IN ?? {x: 0, y: -10, w: 160};
const OY_CAM_OUT: Cam = OYX.OY_CAM_OUT ?? {x: 0, y: 0, w: 14};

const w = word;
export const T = {
  shattered: w('shattered').start, wrist: w('wrist').start, wristEnd: w('wrist').end, imagine: w('imagine').start, gluing: w('gluing').start,
  together: w('together').start, togetherEnd: w('together').end,
  researchers: w('Researchers').start, actually: w('actually').start, did: w('did').start, itEnd: w('it').end,
  they: w('They').start, experimental: w('experimental').start, glue: w('glue').start, inspired: w('inspired').start,
  oysters: w('oysters').start, sticking: w('sticking').start, rocks: w('rocks').start, rocksEnd: w('rocks').end,
  itW: w('It').start, grips: w('grips').start, even: w('even').start, inside: w('inside').start,
  wet: w('wet').start, bloody: w('bloody').start, bloodyEnd: w('bloody').end, woundEnd: w('wound').end,
  inW: w('In').start, reported: w('reported').start, surgeons: w('surgeons').start, secured: w('secured').start,
  pieces: w('pieces').start, inJust: w('in', 1).start, three: w('three').start, minutesEnd: w('minutes').end,
  fracture: w('fracture').start, needed: w('needed').start, months: w('months').start, heal: w('heal').start, healEnd: w('heal').end,
  but: w('But').start, newW: w('new').start, grows: w('grows').start, glue2: w('glue', 1).start, gradually: w('gradually').start, disappearsEnd: w('disappears').end,
  your: w('Your', 1).start, body: w('body').start, replaces: w('replaces').start, stuff: w('stuff').start, holding: w('holding').start, togetherEnd2: w('together', 1).end,
};
export const LOOP_T = FRAMES / FPS;
export const LAST = (FRAMES - 1) / FPS;

const L1 = seamLength('C1'), L2 = seamLength('C2'), L3 = seamLength('C3');

// ---------------------------------------------------------------- events
export const EV = {
  // ---- the hook (cutaway)
  appIn0: 0.0, appIn1: 0.16, race0: 0.14, race1: 0.82, appLiftH0: 0.86, appLiftH1: 1.0, appOutH0: 0.95, appOutH1: 1.55,
  fIn0: 0.3, fIn1: 0.62, fBite0: 0.55, fBite1: 0.8, reduce0: 0.8, reduce1: 1.42, fLift0: 1.42, fLift1: 1.55, fOut0: 1.48, fOut1: 1.85,
  pullH0: 1.5, pullH1: 2.5, flex0: 2.5, flex1: 3.15, pushH0: 2.95, matchT: T.researchers,
  // ---- the lab, the oyster
  labEnd: LAB_T.plunge1, labDiss0: LAB_T.dissolve0,
  cutIn: LAB_T.plunge1, cutOut: T.rocksEnd + 0.08,
  reveal0: T.sticking - 0.05, reveal1: T.rocks + 0.05,
  // ---- the wet macro and the micro section
  mic0: T.even - 0.02, mic1: T.wet - 0.02, micDiss: 0.16,
  surge0: T.wet + 0.0, surge1: T.bloodyEnd + 0.45,
  // ---- the surgical case
  pull0: T.woundEnd - 0.02, pull1: T.reported + 0.75, fix1: T.secured + 0.55,
  eSeat0: T.surgeons - 0.1, eSeat1: T.surgeons + 0.35, eRun0: 0, eRun1: 0, eHop0: 0, eHop1: 0, eC3b: 0,
  rel0: 0, rel1: 0, probeOut0: 0, probeOut1: 0, appLift1: 0, appOut0: 0, appOut1: 0,
  set0: T.inJust - 0.05, set1: T.minutesEnd - 0.1,
  // ---- closing and healing
  close0: T.minutesEnd - 0.3, close1: T.fracture + 0.3, sut0: T.fracture - 0.15, sut1: T.fracture + 0.22,
  dive2a: T.fracture - 0.15, dive2b: T.needed + 0.25,
  hem0: T.fracture + 0.25, hem1: T.needed + 0.05, soft0: T.needed - 0.05, soft1: T.months + 0.45,
  bridge0: T.needed, bridge1: T.disappearsEnd - 0.1, hard0: T.healEnd - 0.4, hard1: T.grows + 0.4,
  mac0: T.but - 0.05, mac1: T.grows + 0.1, back0: T.glue2 - 0.1, back1: T.disappearsEnd - 0.25,
  rem0: T.disappearsEnd - 0.15, rem1: T.disappearsEnd + 0.35,
  // ---- the ending and the loop
  out0: T.your + 0.1, out1: T.replaces + 0.45, curl0: T.stuff - 0.25, curl1: T.togetherEnd2 - 0.05,
  bend0: T.stuff - 0.3, bend1: T.togetherEnd2 - 0.02,
  push0: T.togetherEnd2 - 0.05, loopDiss0: LOOP_T - 0.24, push1: LOOP_T,
};
EV.eRun0 = EV.eSeat1 - 0.05;
EV.eRun1 = EV.eRun0 + 0.42;
EV.eHop0 = EV.eRun1 + 0.02;
EV.eHop1 = EV.eHop0 + 0.15;
EV.eC3b = EV.eHop1 + 0.33;
// the probe holds the wedge until the glue has crossed its top seam, then lets go alone (before the applicator hops)
EV.rel0 = EV.eRun1 - 0.02;
EV.rel1 = EV.rel0 + 0.3;
EV.probeOut0 = EV.rel0 + 0.35;
EV.probeOut1 = EV.probeOut0 + 0.8;
EV.appLift1 = EV.eC3b + 0.25;
EV.appOut0 = EV.appLift1 + 0.05;
EV.appOut1 = EV.appOut0 + 0.8;
EV.bend0 = Math.max(EV.bend0, EV.out1 - 0.05);

// ---------------------------------------------------------------- segments
type Seg = 'hook' | 'lab' | 'oyster' | 'macro' | 'case';
const segOf = (t: number): Seg => {
  if (t < EV.matchT) return 'hook';
  if (t < EV.cutIn) return 'lab';
  if (t < EV.cutOut) return 'oyster';
  if (t < EV.pull0) return 'macro';
  return 'case';
};

// ---------------------------------------------------------------- the hook: injection, the racing glue, the reduction
/** fragment reduction 0 (shattered) .. 1 (seated) */
const reduceAt = (t: number) => ss(t, EV.reduce0, EV.reduce1);
const posesAt = (t: number): Poses => posesLerp({wedge: reduceAt(t), styloid: reduceAt(t), lunate: reduceAt(t)});
/** the injection: fronts race out from the C1/C2 junction along C1 both ways, up C2, and down C3 once the C1 front
 *  passes it; they settle (flow -> 0) as the race ends */
const raceGlue = (race: number): {glue: Record<SeamId, GlueSpan>; fronts: GlueFront[]} => {
  if (race <= 0) return {glue: {C1: {a: 0, b: 0}, C2: {a: 0, b: 0}, C3: {a: 0, b: 0}}, fronts: []};
  const r = clamp(race);
  const flow = 1 - ss(race, 1, 1.3);
  const a1 = S_C2_ON_C1 * (1 - r), b1 = S_C2_ON_C1 + (L1 - S_C2_ON_C1) * r;
  const b2 = L2 * r;
  const r3 = clamp((b1 - S_C3_ON_C1) / (L1 - S_C3_ON_C1));
  const b3 = (L3 + 0.2) * r3;
  const glue: Record<SeamId, GlueSpan> = {C1: {a: a1, b: b1}, C2: {a: 0, b: b2}, C3: {a: 0, b: b3}};
  const fronts: GlueFront[] = [];
  if (flow > 0.001 && race > 0) {
    fronts.push({seam: 'C1', s: a1, flow}, {seam: 'C1', s: b1, flow}, {seam: 'C2', s: b2, flow});
    if (b3 > 0.6) fronts.push({seam: 'C3', s: b3, flow});
  }
  return {glue, fronts};
};
/** the race: fast and eased, so the glue visibly shoots along the cracks; then a short settle */
const raceAt = (t: number) => (t < EV.race0 ? 0 : t < EV.race1 ? ss(t, EV.race0, EV.race1) * 0.85 + 0.15 * clamp((t - EV.race0) / (EV.race1 - EV.race0)) : 1 + 0.3 * ss(t, EV.race1, EV.race1 + 0.35));
/** the injection point: the shaft-side face at the C1/C2 junction */
const HOOK_TIP = seamEdgeSeated('C1', S_C2_ON_C1 + 0.6, 1, 0.1);
const HOOK_APP_ANG = -0.5;
/** the forceps' bite points, on the lunate and styloid fragments (seated coordinates; they ride with the fragments) */
const BITE_A = pt(-8.5, -15), BITE_B = pt(11, -21);
export const forcepsAt = (t: number): ForcepsState | null => {
  if (t >= EV.fOut1 || t < EV.fIn0 || segOf(t) !== 'hook') return null;
  const p = posesAt(t);
  return {
    tipA: xfFrag(BITE_A, 'lunate', p), tipB: xfFrag(BITE_B, 'styloid', p),
    close: ss(t, EV.fBite0, EV.fBite1),
    on: ss(t, EV.fIn0, EV.fIn1) * (1 - ss(t, EV.fOut0, EV.fOut1)),
    lift: ss(t, EV.fLift0, EV.fLift1),
  };
};

// ---------------------------------------------------------------- the surgical case: the probe seats the wedge, the glue
// runs along the wedge's seams (the rest of the fracture is already bonded), the probe lets go
const C3_TOP = 0.3;
const HOP_ARC = 1.2;
const APP_ANG = -0.42;
type AppPose = {tip: P; ang: number; lift: number; laying: {seam: SeamId; s: number} | null};
const caseApp = (t: number): AppPose => {
  const ang = APP_ANG + 0.03 * Math.sin(t * 1.3);
  if (t < EV.eRun0) return {tip: seamPoint('C1', S_C3_ON_C1), ang, lift: 0, laying: null};
  if (t < EV.eRun1) {
    const s = lerp(S_C3_ON_C1, L1, ss(t, EV.eRun0, EV.eRun1) * 0.85 + 0.15 * clamp((t - EV.eRun0) / (EV.eRun1 - EV.eRun0)));
    return {tip: seamPoint('C1', s), ang, lift: 0, laying: {seam: 'C1', s}};
  }
  if (t < EV.eHop0) return {tip: seamPoint('C1', L1), ang, lift: 0, laying: null};
  if (t < EV.eHop1) {
    const u = ss(t, EV.eHop0, EV.eHop1), arc = Math.sin(Math.PI * clamp((t - EV.eHop0) / (EV.eHop1 - EV.eHop0)));
    const a = seamPoint('C1', L1), b = seamPoint('C3', L3), d = sub(b, a), n = Math.hypot(d.x, d.y) || 1;
    return {tip: add(lerpP(a, b, u), pt((-d.y / n) * HOP_ARC * arc, (d.x / n) * HOP_ARC * arc)), ang, lift: 0.55 * arc, laying: null};
  }
  if (t < EV.eC3b) {
    const s = lerp(L3, C3_TOP, ss(t, EV.eHop1, EV.eC3b) * 0.8 + 0.2 * clamp((t - EV.eHop1) / (EV.eC3b - EV.eHop1)));
    return {tip: seamPoint('C3', s), ang, lift: 0, laying: {seam: 'C3', s}};
  }
  return {tip: seamPoint('C3', C3_TOP), ang, lift: ss(t, EV.eC3b, EV.appLift1), laying: null};
};
const PROBE_BACK = 8, PROBE_DROP = 24;
const PROBE_BACK_V = mul(pt(Math.cos(PROBE_ANG_W), Math.sin(PROBE_ANG_W)), PROBE_BACK);
const PROBE_DROP_V = pt(-0.25 * PROBE_DROP, PROBE_DROP);
const caseWedge = (t: number): WedgeX => (t >= EV.eSeat1 ? WEDGE_SEATED : wedgeLerp(ss(t, EV.eSeat0, EV.eSeat1)));
const caseProbe = (t: number): {tip: P; ang: number; lift: number} => {
  const back = ss(t, EV.rel0 + 0.04, EV.rel1), drop = ss(t, EV.rel1 - 0.1, EV.rel1 + 0.35);
  return {tip: add(add(xfPoint(WEDGE_PRESS, caseWedge(t)), mul(PROBE_BACK_V, back)), mul(PROBE_DROP_V, drop)), ang: PROBE_ANG_W, lift: ss(t, EV.rel0, EV.rel0 + 0.16)};
};
const caseGlue = (t: number): Record<SeamId, GlueSpan> => {
  const ap = caseApp(Math.min(t, EV.eC3b + 0.01));
  const c1 = t >= EV.eRun1 ? L1 : ap.laying?.seam === 'C1' ? ap.laying.s : S_C3_ON_C1;
  let c3: GlueSpan = {a: 0, b: 0};
  if (t >= EV.eHop1) c3 = {a: t >= EV.eC3b ? C3_TOP * (1 - ss(t, EV.eC3b, EV.eC3b + 0.5)) : ap.laying?.seam === 'C3' ? ap.laying.s : L3, b: L3};
  return {C1: {a: 0, b: c1}, C2: {a: 0, b: L2}, C3: c3};
};
const caseFront = (t: number, ap: AppPose): BoneState2['front'] => {
  if (ap.laying) return {seam: ap.laying.seam, s: ap.laying.s, flow: 1};
  const settle = (t0: number, t1: number) => 1 - ss(t, t0, t1);
  if (t >= EV.eRun1 && t < EV.eHop1) return {seam: 'C1', s: L1, flow: settle(EV.eRun1, EV.eHop1)};
  if (t >= EV.eC3b && t < EV.eC3b + 0.3) return {seam: 'C3', s: C3_TOP * (1 - ss(t, EV.eC3b, EV.eC3b + 0.5)), flow: settle(EV.eC3b, EV.eC3b + 0.3)};
  return null;
};

// ---------------------------------------------------------------- bone state
const FULL: Record<SeamId, GlueSpan> = {C1: {a: 0, b: L1}, C2: {a: 0, b: L2}, C3: {a: 0, b: L3}};
const healAt = (t: number): Heal2 => {
  if (t < EV.close0) return HEAL2_0;
  const bu = clamp((t - EV.bridge0) / (EV.bridge1 - EV.bridge0));
  return {
    hem: ss(t, EV.hem0, EV.hem1),
    soft: ss(t, EV.soft0, EV.soft1),
    bridge: 0.5 * ss(bu, 0, 1) + 0.5 * bu,
    hard: ss(t, EV.hard0, EV.hard1),
    remodel: 0.6 * ss(t, EV.rem0, EV.rem1) + 0.4 * clamp((t - EV.rem0) / (EV.rem1 - EV.rem0)),
  };
};
export const boneAt = (t: number, px: number): BoneState2 => {
  const seg = segOf(t);
  const ins = instrAt(t);
  const base = {
    t, px, press: null, appContact: null, wet: 0, flow: t - EV.cutOut, surge: -1, heal: HEAL2_0, set: 0,
  };
  if (seg === 'hook' || seg === 'lab') {
    const poses = posesAt(Math.min(t, EV.matchT));
    const g = raceGlue(raceAt(t));
    return {
      ...base, wedge: poses.wedge, poses, glue: g.glue, front: null, fronts: g.fronts,
      appContact: ins.appOn > 0.01 ? {p: ins.app.tip, contact: 1 - ins.app.lift} : null,
    };
  }
  if (seg === 'oyster' || seg === 'macro') {
    const wet = ss(t, EV.cutOut - 0.05, EV.cutOut + 0.25);
    return {
      ...base, wedge: WEDGE_SEATED, glue: FULL, front: null, wet, flow: t - EV.cutOut,
      surge: t < EV.surge0 ? -1 : clamp((t - EV.surge0) / (EV.surge1 - EV.surge0)),
    };
  }
  // the case, then healing and the ending (the wedge alone moves: the V2 path, no poses)
  const ap = caseApp(t);
  const pr = ins.probe;
  const wet = t < EV.pull1 ? ss(t, EV.cutOut - 0.05, EV.cutOut + 0.25) * (1 - ss(t, EV.pull0 + 0.25, EV.pull1 - 0.2)) : 0;
  return {
    ...base,
    wedge: caseWedge(t),
    glue: t < EV.close0 ? caseGlue(t) : FULL,
    front: t < EV.appLift1 + 0.3 ? caseFront(t, ap) : null,
    set: ss(t, EV.set0, EV.set1),
    press: ins.probeOn > 0.01 ? {p: pr.tip, contact: 1 - pr.lift} : null,
    appContact: ins.appOn > 0.01 ? {p: ins.app.tip, contact: 1 - ins.app.lift} : null,
    wet, flow: t - EV.cutOut,
    surge: 1,
    heal: healAt(t),
  };
};
/** the frame-0 state, for the loop's closing dissolve */
export const POSES_AT_0 = (): Poses => posesAt(0);
void POSES_SEATED;

// ---------------------------------------------------------------- instruments and the surgeon
const OFF: InstrState2['probe'] = {tip: pt(30, 40), ang: PROBE_ANG_W, lift: 1};
export const instrAt = (t: number): InstrState2 => {
  const face = {focus: 0.75, smile: 0, gx: -0.5, gy: 0.55, blink: 0};
  const seg = segOf(t);
  if (seg === 'hook' || seg === 'lab') {
    const injecting = t >= EV.race0 && t < EV.appLiftH0 ? 1 : 0;
    return {
      app: {tip: HOOK_TIP, ang: HOOK_APP_ANG, press: 0.3 + 0.6 * injecting, gel: injecting, lift: ss(t, EV.appLiftH0, EV.appLiftH1)},
      probe: OFF,
      appOn: seg === 'hook' ? ss(t, EV.appIn0, EV.appIn1) * (1 - ss(t, EV.appOutH0, EV.appOutH1)) : 0,
      probeOn: 0,
      face, lean: 0, k: 1,
    };
  }
  if (seg === 'oyster' || seg === 'macro') return {app: {tip: HOOK_TIP, ang: APP_ANG, press: 0, gel: 0, lift: 1}, probe: OFF, appOn: 0, probeOn: 0, face, lean: 0, k: 1};
  const ap = caseApp(t);
  const pressing = ap.laying ? 1 : 0;
  return {
    app: {tip: ap.tip, ang: ap.ang, press: 0.4 + 0.5 * pressing, gel: pressing, lift: ap.lift},
    probe: caseProbe(t),
    appOn: ss(t, EV.pull0, EV.pull0 + 0.3) * (1 - ss(t, EV.appOut0, EV.appOut1)),
    probeOn: ss(t, EV.pull0, EV.pull0 + 0.3) * (1 - ss(t, EV.probeOut0, EV.probeOut1)),
    face: {...face, smile: ss(t, EV.rel0, EV.rel0 + 0.4) * (1 - ss(t, EV.probeOut1, EV.probeOut1 + 0.5))},
    lean: 1.5 - 1.5 * ss(t, EV.rel0, EV.probeOut1),
    k: 1,
  };
};

// ---------------------------------------------------------------- the patient's arm
export type ArmS = {curl: number; thumb: number; incision: number; sutures: number; scar: number; window: Win | null; spread: number; bend: number};
export const WINDOW_C = pt(-3, -14);
/** the hook's dramatic cutaway: an elongated opening along the forearm over the distal radius and the carpus */
export const HOOK_WIN: Win = {c: pt(-1.5, -14), r: 16, soft: 0.1, aspect: 2.6, rot: 0.14, rim: 'cut'};
export const armAt = (t: number): ArmS => {
  const seg = segOf(t);
  const flexU = clamp((t - EV.flex0) / (EV.flex1 - EV.flex0));
  const flex = t > EV.flex0 && t < EV.flex1 ? Math.sin(Math.PI * flexU) ** 1.2 : 0;
  if (seg !== 'case') {
    // the hook: closed skin, the cutaway; the fingers flex once after the repair
    return {curl: 0.25 + 0.2 * flex, thumb: 0.2 + 0.25 * flex, incision: 0, sutures: 0, scar: 0, window: HOOK_WIN, spread: 0.35 * flex, bend: 0};
  }
  const closing = ss(t, EV.close0, EV.close1);
  const sut = ss(t, EV.sut0, EV.sut1) * (1 - ss(t, EV.hard0, EV.hard1));
  const scar = ss(t, EV.hard0, EV.rem1);
  let win: Win | null = null;
  let r = 0;
  if (t > EV.close1 - 0.1) r = 64 * ss(t, EV.close1 - 0.1, EV.dive2b) * (1 - ss(t, EV.out1 - 0.25, EV.out1 + 0.1));
  if (r > 0.3) win = {c: lerpP(INCISION.c, WINDOW_C, ss(r, 6, 40)), r, soft: 0.22};
  // the loop: the hook's cutaway again, over healed bone (revealed as the skin copy clears)
  if (t > EV.push0) win = HOOK_WIN;
  const bu = clamp((t - EV.bend0) / (EV.bend1 - EV.bend0));
  const sw = t > EV.bend0 && t < EV.bend1 ? Math.sin(2 * Math.PI * bu) * Math.sin(Math.PI * bu) ** 0.35 : 0;
  const bend = sw * (sw > 0 ? 0.3 : 0.38);
  const mv = t > EV.curl0 && t < EV.curl1 ? Math.sin(Math.PI * clamp((t - EV.curl0) / (EV.curl1 - EV.curl0))) ** 1.2 : 0;
  const fadeScar = 1 - ss(t, EV.push0, EV.push1 - 0.1);
  return {curl: 0.25 + 0.1 * mv, thumb: 0.2 + 0.2 * mv, incision: 1 - closing, sutures: sut, scar: scar * fadeScar, window: win, spread: 0.3 * mv + 0.5 * Math.abs(sw), bend};
};
/** an opaque skin copy over the windowed skin: 1 for the recovered wrist; on the loop's push it clears over the cutaway */
export const skinVeil = (t: number) => {
  if (segOf(t) !== 'case' || t < EV.out0 - 0.1) return 0;
  const up = ss(t, EV.out0 - 0.1, EV.out0 + 0.25);
  const down = ss(t, EV.push1 - 0.62, EV.push1 - 0.3);
  return up * (1 - down);
};
/** 0 = the surgical drape, 1 = the follow-up table; on the loop's push the drape returns under the hand */
export const tableMix = (t: number) => (segOf(t) !== 'case' || t < EV.dive2b ? 0 : 1 - ss(t, EV.push1 - 0.6, EV.push1 - 0.1));
export const tableVariant = (t: number): 'drape' | 'followup' => (tableMix(t) > 0.5 ? 'followup' : 'drape');
export const surgeonOn = (t: number) => {
  const seg = segOf(t);
  if (seg === 'hook') return t < EV.appOutH1 + 0.05;
  if (seg === 'case') return t < EV.close1 && t < Math.max(EV.probeOut1, EV.appOut1) + 0.2;
  return false;
};

// ---------------------------------------------------------------- the camera
export type World = 'wrist' | 'oyster' | 'lab' | 'micro';
export type WCam = {world: World; cam: Cam; reveal?: number; lab?: LabState; micro?: MicroState; over?: {world: World; cam: Cam; alpha: number; t?: number; reveal?: number; micro?: MicroState}};

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

/** frame 0: the cutaway of the shattered wrist (the carpus and the palm's heel at the top, the fracture above the
 *  captions); the camera is already pushing in */
export const HOOK0: Cam = {x: 2, y: -14, w: 84, k: 1, focus: -2};
const LV_HOOK = -0.3;
/** the repair's close framing */
const HOOK_C: Cam = {x: 3.5, y: -8, w: 46, k: 1, focus: -2};
/** the reveal: the whole forearm and hand, the cutaway showing the aligned, glued radius */
const ARM_W: Cam = {x: -6, y: -58, w: 175, k: 1, focus: -6};
const V_ARM: CV = {x: 0.4, y: 0.8, lw: -0.04};
/** the match framing: the glue band in the transverse seam, centred near screen y 1000 (production/v2_match_band.json) */
export const MATCH: Cam = {x: -7, y: 0.7247, w: 7.5, k: 1, focus: 0};
const WET1: Cam = {x: -2.2, y: 0.4, w: 13.5, k: 1, focus: 0};
/** the macro pushed onto the band's centre, where the micro section dissolves in */
const MIC_M: Cam = {x: -3.5, y: 0.35, w: 5.2, k: 1, focus: 0};
const CASE: Cam = {x: 5, y: -24, w: 106, k: 0.99, focus: -4};
const FIX: Cam = {x: 6, y: -4, w: 58, k: 1, focus: -3};
/** "in just three minutes": the camera tracks across the bonded fracture (from the ulnar side to the wedge) */
const TRACK0: Cam = {x: -3, y: -3, w: 40, k: 1, focus: -2};
const TRACK1: Cam = {x: 9, y: -1, w: 36, k: 1, focus: -2};
const HEAL: Cam = {x: 3.2, y: -0.8, w: 30, k: 1, focus: 0};
const HEAL_B: Cam = {x: 6.2, y: -1.6, w: 23.5, k: 1, focus: 0};
const MACRO_H: Cam = {x: 5, y: -1, w: 11.5, k: 1, focus: 0};
const HEAL_W: Cam = {x: 3.6, y: -2.5, w: 34, k: 1, focus: 0};
const FOLLOW: Cam = {x: -5, y: -88, w: 210, k: 1, focus: -10};

/** frame 0's camera extended back before the loop point (it is already pushing in at LV_HOOK) */
export const loopCam = (t: number): Cam => drift(HOOK0, {x: 0, y: 0, lw: LV_HOOK}, t - LOOP_T);
const hookCam = (t: number): Cam => {
  if (t < EV.pullH0) return zoomH(t, 0, HOOK0, EV.pullH0, HOOK_C, LV_HOOK, -0.05, pt(0, 0), pt(0, 0));
  // the repair done: a fast, smooth pull-out to the whole forearm and hand
  if (t < EV.pullH1) return zoomH(t, EV.pullH0, HOOK_C, EV.pullH1, ARM_W, -0.05, V_ARM.lw, pt(V_ARM.x, V_ARM.y), pt(0, 0));
  if (t < EV.pushH0) return drift(ARM_W, V_ARM, t - EV.pullH1);
  // a fast push into the glue band for the match cut to the lab
  return zoomH(t, EV.pushH0, drift(ARM_W, V_ARM, EV.pushH0 - EV.pullH1), EV.matchT, MATCH, V_ARM.lw, -0.6, pt(0, 0), pt(V_ARM.x, V_ARM.y));
};
const OY_CREEP = 0.07;
const LV_OY_OUT = (OY_CREEP * (Math.log(OY_CAM_OUT.w) - Math.log(OY_CAM_IN.w))) / (EV.cutOut - EV.cutIn);
const oysterCam = (t: number): Cam => {
  const u = clamp((t - EV.cutIn) / (EV.cutOut - EV.cutIn));
  const e = (x: number) => OY_CREEP * x + (1 - OY_CREEP) * ss(x, 0.04, 0.55);
  return zoomAbout(u, OY_CAM_IN, OY_CAM_OUT, e);
};
const microCam = (t: number): Cam => zoomAbout(clamp((t - EV.mic0) / (EV.mic1 - EV.mic0)), MICRO_IN, MICRO_OUT, (x) => x);
const microSt = (t: number): MicroState => {
  const u = clamp((t - EV.mic0) / (EV.mic1 - EV.mic0));
  return {flow: 0.24 + 0.52 * (u * (1.25 - 0.25 * u)), grip: ss(u, 0.4, 0.95), wet: 1};
};
const V_FOLLOW: CV = {x: 0.3, y: -0.5, lw: -0.02};
const caseCam = (t: number): Cam => {
  // the wet macro: a push onto the band's centre (into the micro section), then back out for the blood wash
  if (t < EV.mic0) return hermite(t, EV.cutOut, MATCH, {x: 0, y: 0, lw: LV_OY_OUT}, EV.mic0, MIC_M, {x: 0, y: 0, lw: -0.5});
  if (t < EV.mic1) return drift(MIC_M, {x: 0, y: 0, lw: -0.5}, t - EV.mic0);
  if (t < EV.pull0) return hermite(t, EV.mic1, drift(MIC_M, {x: 0, y: 0, lw: -0.5}, EV.mic1 - EV.mic0), {x: 0, y: 0, lw: 0.4}, EV.pull0, WET1, {x: 1.0, y: -0.2, lw: 0.08});
  if (t < EV.pull1) return zoomH(t, EV.pull0, WET1, EV.pull1, CASE, 0.08, 0, pt(0, 0), pt(1.0, -0.2));
  if (t < EV.fix1) return zoomH(t, EV.pull1, CASE, EV.fix1, FIX, 0, -0.03, pt(-0.3, 0.15), pt(0, 0));
  if (t < EV.set0) return hermite(t, EV.fix1, FIX, {x: -0.3, y: 0.15, lw: -0.03}, EV.set0, TRACK0, {x: 2.0, y: 0.3, lw: -0.1});
  if (t < EV.dive2a) return hermite(t, EV.set0, TRACK0, {x: 2.0, y: 0.3, lw: -0.1}, EV.dive2a, TRACK1, {x: 1.0, y: 0.2, lw: 0.05});
  if (t < EV.dive2b) return zoomH(t, EV.dive2a, TRACK1, EV.dive2b, HEAL, 0.05, -0.04, pt(0.04, 0.03), pt(1.0, 0.2));
  if (t < EV.mac0) return hermite(t, EV.dive2b, HEAL, {x: 0.6, y: -0.2, lw: -0.04}, EV.mac0, HEAL_B, {x: 0.3, y: 0, lw: -0.2});
  if (t < EV.mac1) return zoomH(t, EV.mac0, HEAL_B, EV.mac1, MACRO_H, -0.2, -0.03, pt(0.05, 0), pt(0.3, 0));
  if (t < EV.back0) return drift(MACRO_H, {x: 0.05, y: 0, lw: -0.03}, t - EV.mac1);
  const mB = drift(MACRO_H, {x: 0.05, y: 0, lw: -0.03}, EV.back0 - EV.mac1);
  if (t < EV.back1) return zoomH(t, EV.back0, mB, EV.back1, HEAL_W, -0.03, 0.02, pt(0, 0), pt(0.05, 0));
  if (t < EV.out0) return drift(HEAL_W, {x: 0, y: 0, lw: 0.02}, t - EV.back1);
  const hB = drift(HEAL_W, {x: 0, y: 0, lw: 0.02}, EV.out0 - EV.back1);
  if (t < EV.out1) return zoomH(t, EV.out0, hB, EV.out1, FOLLOW, 0.02, V_FOLLOW.lw, pt(V_FOLLOW.x, V_FOLLOW.y), pt(0, 0));
  if (t < EV.push0) return drift(FOLLOW, V_FOLLOW, t - EV.out1);
  // the loop: push back onto frame 0's composition, landing on it (at the hook's own push speed) as the closing
  // dissolve begins, then carrying on exactly as frame 0's camera will
  if (t < EV.loopDiss0) return zoomH(t, EV.push0, drift(FOLLOW, V_FOLLOW, EV.push0 - EV.out1), EV.loopDiss0, loopCam(EV.loopDiss0), V_FOLLOW.lw, LV_HOOK, pt(0, 0), pt(V_FOLLOW.x, V_FOLLOW.y));
  return loopCam(t);
};

/** the cut back from the oyster: its cement band dissolves into the glue band, which lies on the same screen line */
export const CUT_BACK_DISSOLVE = 0.22;
export const cutBackBlend = (t: number) => (t >= EV.cutOut - CUT_BACK_DISSOLVE && t < EV.cutOut ? ss(t, EV.cutOut - CUT_BACK_DISSOLVE, EV.cutOut) : 0);
export const wristCamAt = (t: number): Cam => caseCam(Math.max(t, EV.cutOut));
/** the loop's closing dissolve into frame 0 (same camera, same cutaway): 0..1 over the last frames */
export const loopBlend = (t: number) => ss(t, EV.loopDiss0, EV.push1 - 1 / FPS);
export const camAt = (t: number): WCam => {
  const seg = segOf(t);
  if (seg === 'hook') return {world: 'wrist', cam: hookCam(t)};
  if (seg === 'lab') {
    const s = labSuggest(t);
    const a = ss(t, EV.labDiss0, EV.labEnd);
    return {world: 'lab', cam: s.cam, lab: s.st, over: a > 0.001 ? {world: 'oyster', cam: oysterCam(EV.cutIn), alpha: a, reveal: 0} : undefined};
  }
  if (seg === 'oyster') return {world: 'oyster', cam: oysterCam(t), reveal: ss(t, EV.reveal0, EV.reveal1)};
  if (t >= EV.mic0 - EV.micDiss && t < EV.mic1 + EV.micDiss) {
    // the micro section, dissolved in and out over the macro push
    const a = ss(t, EV.mic0 - EV.micDiss, EV.mic0) * (1 - ss(t, EV.mic1, EV.mic1 + EV.micDiss));
    const tm = clamp(t, EV.mic0, EV.mic1);
    return {world: 'wrist', cam: caseCam(t), over: {world: 'micro', cam: microCam(tm), alpha: a, micro: microSt(tm)}};
  }
  return {world: 'wrist', cam: caseCam(t)};
};
/** (test entries) the wedge's pose in the surgical case */
export const wedgeAt = (t: number): WedgeX => caseWedge(t);
