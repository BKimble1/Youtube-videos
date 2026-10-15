// V4: ONE reveal authority for the body journey and the treatment. Every shot reads its anatomy states from
// revealAt(f); nothing else switches a section, a window, a trace or a heart state on or off.
//
//   arm section (open)  ->  closes while the camera pulls out (442-454)  ->  closed exterior arm with a thin
//   diagnostic trace on the bare skin (amber dashes up toward the chest)  ->  chest window opens (463-477, out from
//   under the near arm): liver dims, heart regular then irregular  ->  window closes (570-584, back under the arm)
//   ->  red warning dash runs down the trace into the band (565-608)  ->  wrist.
//   Treatment: the device area's arm section/vessel views up to 986  ->  HARD CUT at 987 into the same chest view,
//   already open; the pulse runs down the superior vena cava into the right atrium; the rhythm settles
//   (lib/heart4.ts)  ->  window closes (1025-1035) before the camera pulls out, nothing left behind.
//
// Invariant (checkReveal): armOpen * chestOpen == 0 on every frame except the cut frame.
import {B} from './timeline3';
import {B4} from './beats4';
import {clamp, easeIn, easeInOut, inv} from './math';
import {heartAt, HeartState} from './heart4';

const ease = easeInOut;

/** A pulse on the diagnostic trace. leg 'arm': t 0 = band edge .. 1 = sleeve hem (drawn on the bare arm skin);
 *  'hidden': under the sleeve (not drawn); 'chest': t 0 = the arm's front edge in the window .. 1 = the heart sensor. */
export type TracePulse = {kind: 'signal' | 'warning'; leg: 'arm' | 'hidden' | 'chest'; t: number; a: number; key: number};

export type Reveal = {
  /** the arm section window (SectionLayers open) 0..1 */
  armOpen: number;
  /** the device case cut showing its port module 0..1 */
  caseOpen: number;
  /** the dark section backdrop behind the forearm 0..1 */
  backdrop: number;
  /** the exterior diagnostic trace: visibility and its pulses */
  trace: {a: number; pulses: TracePulse[]};
  /** chest window open amount 0..1 (0 = nothing drawn; art/Cutaway maps it to a scale about a pivot under the
   *  near arm, so any small value is already hidden under the arm) */
  chestOpen: number;
  /** the failing organ (liver) dims 0..1, its sensors 0..1 */
  organDim: number;
  organSense: number;
  /** heart sensors 0..1 and their state: 0 normal (cyan), 1 sensing (amber), 2 lethal (red) */
  heartSense: number;
  heartWarn: number;
  /** liver sensor state, same scale */
  organWarn: number;
  heart: HeartState;
  /** treatment pulse in the superior vena cava: t 0 = window top .. 1 = entering the right atrium */
  treat?: {t: number; a: number};
  /** restrained local cyan light where the pulse enters the right atrium (alpha scale 0..1) */
  treatLight: number;
  /** his free right hand: 0 = V3 chest clutch, 1 = low grip (it holds his raised near knee, clear of the window) */
  rHandLow: number;
  /** the hard cut into the treatment chest view */
  cut: boolean;
};

const J = {
  /** V3 arm section opening (Journey3 openAmt) */
  open: (f: number) => ease(inv(B.open0, B.open1 + 8, f)),
};

const signalPulses = (f: number): TracePulse[] => {
  const out: TracePulse[] = [];
  B4.sigLaunch.forEach((L, k) => {
    const t = f - L;
    if (t < 0) return;
    const {sigArmT: ta, sigHiddenT: th, sigChestT: tc} = B4;
    // fade in as it leaves the band, fade out as it reaches the heart sensor
    if (t < ta) out.push({kind: 'signal', leg: 'arm', t: t / ta, a: clamp(t / 3), key: k});
    else if (t < ta + th) out.push({kind: 'signal', leg: 'hidden', t: (t - ta) / th, a: 1, key: k});
    else if (t < ta + th + tc + 2) out.push({kind: 'signal', leg: 'chest', t: Math.min(1, (t - ta - th) / tc), a: 1 - clamp((t - ta - th - tc) / 2), key: k});
  });
  return out;
};

const warningPulse = (f: number): TracePulse[] => {
  if (f < B4.warn0 || f > B4.warn1 + 2) return [];
  if (f < B4.warnArmEdge) return [{kind: 'warning', leg: 'chest', t: 1 - easeIn(inv(B4.warn0, B4.warnArmEdge, f)), a: clamp((f - B4.warn0 + 1) / 2), key: 0}];
  if (f < B4.warnHem) return [{kind: 'warning', leg: 'hidden', t: inv(B4.warnArmEdge, B4.warnHem, f), a: 1, key: 0}];
  // down the bare arm: it accelerates a little ("races") and lands in the band
  const t = inv(B4.warnHem, B4.warn1, f);
  return [{kind: 'warning', leg: 'arm', t: 1 - (0.55 * t + 0.45 * t * t), a: 1 - clamp((f - B4.warn1) / 2), key: 0}];
};

/** the exterior trace exists only in the Journey, between the closed section and the landing */
const traceA = (f: number) => (f < B.map0 ? ease(inv(B4.traceIn0, B4.traceIn1, f)) * (1 - ease(inv(B4.traceOut0, B4.traceOut1, f))) : 0);

// in-out eases: the window emerges slowly from under the arm, opens, and slows again as it slides back under it
const chestJourney = (f: number) => ease(inv(B4.chestOpen0, B4.chestOpen1, f)) * (1 - ease(inv(B4.chestClose0, B4.chestClose1, f)));
const chestTreat = (f: number) => (f >= B4.chestCut ? 1 - ease(inv(B4.treatClose0, B4.treatClose1, f)) : 0);

export const revealAt = (f: number): Reveal => {
  const heart = heartAt(f);
  if (f < B.map0) {
    // ---------------------------------------------------------------- the journey
    const close = 1 - ease(inv(B4.armClose0, B4.armClose1, f));
    const armOpen = f >= B.tip0 - 2 ? J.open(f) * close : 0;
    const caseOpen = f >= B.tip0 - 2 ? ease(inv(B.tip1 - 6, B.open0 + 4, f)) * (1 - ease(inv(B4.armClose0 - 2, B4.armClose1 - 4, f))) : 0;
    const backdrop = clamp(inv(B.tip0 + 2, B.tip0 + 16, f)) * (1 - clamp(inv(B.pull0 + 8, B.pull0 + 26, f)));
    const a = traceA(f);
    const pulses = a > 0.01 ? [...signalPulses(f), ...warningPulse(f)] : [];
    const chestOpen = chestJourney(f);
    const heartWarn = clamp(inv(B.heart0 + 4, B.heart0 + 12, f)) + clamp(inv(B.lethal - 2, B.lethal + 6, f));
    return {
      armOpen,
      caseOpen,
      backdrop,
      trace: {a, pulses},
      chestOpen,
      organDim: ease(inv(B4.organDim0, B4.organDim1, f)),
      organSense: clamp(inv(B4.organSense0, B4.organSense0 + 8, f)),
      organWarn: clamp(inv(B4.organDim0, B4.organDim1, f)),
      heartSense: clamp(inv(B4.heartSense0, B4.heartSense0 + 8, f)),
      heartWarn,
      heart,
      treatLight: 0,
      rHandLow: ease(inv(B4.rLow0, B4.rLow1, f)) * (1 - ease(inv(B4.rHigh0, B4.rHigh1, f))),
      cut: false,
    };
  }
  // ---------------------------------------------------------------- the treatment (Aftermath3)
  // the arm section belongs to the device/treatment area up to the cut (this is the V3 curve, for the invariant);
  // from the cut on there is no arm section, no case cut and no backdrop
  const pre = f < B4.chestCut;
  const armOpen = pre && f >= B.act0 + 4 ? ease(inv(B.act0 + 4, B.act0 + 16, f)) : 0;
  const chestOpen = chestTreat(f);
  // it is already entering the window's top edge on the cut frame (the match with the vessel shot), decelerates a
  // little and enters the right atrium at treatSvc1
  const svc = f >= B4.chestCut && f <= B4.treatSvc1 + 1 ? {t: clamp(0.26 + 0.74 * inv(B4.chestCut, B4.treatSvc1, f)), a: 1 - clamp((f - B4.treatSvc1) / 2)} : undefined;
  // the cyan light: rises as the pulse enters the atrium, stays local, gone within 10 frames
  const lt = f - B4.treatSvc1;
  const lN = B4.treatLight1 - B4.treatSvc1; // 10 frames
  const treatLight = lt <= 0 ? 0 : lt <= 2 ? lt / 2 : clamp(1 - (lt - 2) / (lN - 2));
  // sensors on the heart: red -> amber -> cyan as the rhythm settles
  const heartWarn = 2 - clamp(inv(B4.chestCut + 8, B.settleHeart0 + 16, f)) - clamp(inv(B.settleHeart0 + 18, B.settleHeart0 + 26, f));
  return {
    armOpen,
    caseOpen: pre ? 1 : 0,
    backdrop: pre ? clamp(inv(B.act0 + 2, B.act0 + 12, f)) : 0,
    trace: {a: 0, pulses: []},
    chestOpen,
    organDim: 1 - 0.5 * ease(inv(B.settleHeart0 + 20, B.settleHeart1, f)),
    organSense: 0,
    organWarn: 1,
    heartSense: f >= B4.chestCut ? 1 : 0,
    heartWarn,
    heart,
    treat: svc,
    treatLight,
    // the hand goes low while the camera is in the close-up section views (it is off screen), then rises again
    rHandLow: f < B4.chestCut ? ease(inv(B.act0 + 18, B.act0 + 38, f)) : 1 - ease(inv(B4.treatHigh0, B4.treatHigh1, f)),
    cut: f === B4.chestCut,
  };
};

/** The invariant, over the whole film: no frame shows the arm section and the chest window together, except the
 *  cut frame. Returns the offending frames (empty = pass). */
export const checkReveal = (total = 1350): number[] => {
  const bad: number[] = [];
  for (let f = 0; f < total; f++) {
    const r = revealAt(f);
    if (r.armOpen * r.chestOpen > 0 && !r.cut) bad.push(f);
  }
  return bad;
};
