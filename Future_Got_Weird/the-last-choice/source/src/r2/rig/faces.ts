// R3 faces: named expressions for the section agents (plain Face values: put them in a pose's `face`, blend them with
// keyPose/blendPose like any pose field), eye focus on a world point, and the slow-time helpers for the death close-up.
//
//   expr(name, k?, over?)       a named expression at strength k (0 = the resting face … 1 = full), fields in `over` win
//   exprMix(a, b, k, over?)     cross-fade two named expressions (a look of recognition turning to grief)
//   FACES                       the presets themselves (Face objects)
//   gazeLook(rig, target)       lookX/lookY turning the eyes to a point in the solved rig's drawn frame;
//                               shots usually pass FigSpec.gaze (a world point) instead (sprite.tsx)
//   breathCycle(t, o)           chest + mouth for steady breathing (laboured, shallow …): {chest, open}
//   lastBreath(t, t0, o)        one final inhale and long exhale, then stillness: {chest, open, mouth}
//   focusSearch(t, o)           eyes that keep losing and finding focus: {unfocus, lookX, lookY, lid}
//   eyesClose(t, t0, dur)       the lids' slow final close (sag, catch, close), 0 → 1, monotonic
//   slowBlink(t, t0, dur)       a heavy blink: lid added 0 → 1 → 0
//   deathFace(u, t, o)          the whole dying face for u = 0 (conscious, trying to focus) … 1 (closed, still)
import {Face, Rig2, FACE_REST_LID, Mouth} from './figure';
import {lerpFace} from './poses';
import {V3, clamp, lerp, smooth, dot3, norm3, sub3, noise} from '../../kit/math';

export type FaceName =
  | 'neutral' | 'alert' | 'concentration' | 'effort' | 'anger' | 'fear' | 'recognition' | 'realization' | 'pain'
  | 'grief' | 'exhaustion' | 'resolve' | 'shock' | 'relief' | 'dying';

/** The resting face (what an unset face draws). */
export const FACE_REST: Face = {mouth: 'flat', brows: 0, worry: 0, lid: FACE_REST_LID, squint: 0, pupil: 1, open: 0};

/** Named expressions in the approved face's own vocabulary (brows, worry, lids, squint, pupils, gaze, mouth). */
export const FACES: Record<FaceName, Face> = {
  /** the resting face: relaxed upper lids, brows level, lips closed */
  neutral: FACE_REST,
  /** awake to a sound or a movement: lids up, brows lifted a little */
  alert: {mouth: 'flat', brows: 0.3, worry: 0.1, lid: 0.04, pupil: 0.95},
  /** aiming, sketching, judging a distance: brows drawn down, lower lids up, lips pressed */
  concentration: {mouth: 'flat', brows: -0.55, worry: 0.1, lid: 0.24, squint: 0.35},
  /** lifting, pushing, swinging: teeth set, brows down hard, eyes narrowed */
  effort: {mouth: 'grit', brows: -0.9, lid: 0.26, squint: 0.55},
  /** the attack: brows down and in, teeth bared */
  anger: {mouth: 'grit', brows: -1, worry: 0, lid: 0.12, squint: 0.4},
  /** something too big coming: brows up and pinched, eyes wide, pupils small, mouth a little open */
  fear: {mouth: 'open', open: 0.2, brows: 0.75, worry: 0.9, lid: 0, pupil: 0.78},
  /** knowing a face, or what a sound means: brows lift, a breath in through the mouth */
  recognition: {mouth: 'breath', open: 0.35, brows: 0.5, worry: 0.15, lid: 0.04},
  /** understanding something bad: brows up and pinched, lips part, eyes still */
  realization: {mouth: 'open', open: 0.08, brows: 0.55, worry: 0.55, lid: 0.06, pupil: 0.9, browAsym: 0.15},
  /** hurt: eyes screwed up (one more), brows pinched, teeth showing */
  pain: {mouth: 'pain', brows: 0.25, worry: 0.9, lid: 0.42, squint: 0.7, lidLR: [0, 0.15], browAsym: -0.15},
  /** loss: inner brows high, lids heavy, gaze down, mouth turned down */
  grief: {mouth: 'sad', open: 0.1, brows: 0.3, worry: 1, lid: 0.42, lookY: 0.45},
  /** spent: lids heavy, mouth open on the breath, brows slack */
  exhaustion: {mouth: 'pant', open: 0.35, brows: 0.05, worry: 0.3, lid: 0.48, lookY: 0.2},
  /** the decision made: brows level-low, a steady narrowed look, lips closed */
  resolve: {mouth: 'flat', brows: -0.6, worry: 0.05, lid: 0.2, squint: 0.25},
  /** a blow or a sudden sight: brows right up, eyes wide, pupils pinned, mouth dropped */
  shock: {mouth: 'o', brows: 1, worry: 0.25, lid: 0, pupil: 0.7},
  /** it's over / he's here: brows lift and soften, lids drop a little, a soft mouth */
  relief: {mouth: 'soft', brows: 0.2, worry: 0.5, lid: 0.36},
  /** fading: lids low, eyes not focused, lips parted on a shallow breath */
  dying: {mouth: 'breath', open: 0.18, brows: 0.05, worry: 0.35, lid: 0.6, unfocus: 0.55, lookY: 0.15},
};

/** A named expression at strength k (0 = the resting face … 1 = the full preset); fields in `over` win. */
export const expr = (name: FaceName, k = 1, over: Face = {}): Face => ({...(lerpFace(FACE_REST, FACES[name], clamp(k)) ?? {}), ...over});
/** Cross-fade two named expressions (k 0 = a, 1 = b); fields in `over` win. */
export const exprMix = (a: FaceName, b: FaceName, k: number, over: Face = {}): Face => ({...(lerpFace(FACES[a], FACES[b], clamp(k)) ?? {}), ...over});

/**
 * lookX/lookY that turn the eyes toward `target` (a point in the solved rig's DRAWN frame, e.g. another figure's
 * rig.headC in the same view, or sprite.worldToDrawn). The eyes travel at most ~60° from the face; beyond that the
 * head has to turn (shots: head.yaw). `gain` scales how far the pupils move.
 */
export const gazeLook = (r: Rig2, target: V3, gain = 1.3): Pick<Face, 'lookX' | 'lookY'> => {
  const hb = r.head;
  const d = norm3(sub3(target, r.headC));
  const lr = dot3(d, hb.R), lu = dot3(d, hb.U), lf = dot3(d, hb.F);
  const yawE = clamp(Math.atan2(lr, Math.max(lf, 0.05)), -1.05, 1.05), pitchE = clamp(Math.atan2(lu, Math.hypot(lr, Math.max(lf, 0.05))), -0.8, 0.8);
  // the iris's offset on screen (head right / head up projected), in the eye drawing's own (rolled) frame
  const ox = hb.R.x * Math.sin(yawE) + hb.U.x * Math.sin(pitchE), oy = hb.R.y * Math.sin(yawE) + hb.U.y * Math.sin(pitchE);
  const ro = Math.atan2(hb.U.x, -hb.U.y);
  const ex = ox * Math.cos(-ro) - oy * Math.sin(-ro), ey = ox * Math.sin(-ro) + oy * Math.cos(-ro);
  const sx = clamp(hb.F.z, 0.3, 1);
  return {lookX: clamp((ex / sx) * gain, -1, 1), lookY: clamp(ey * gain, -1, 1)};
};

// ------------------------------------------------------------------ breath, blinks and the dying face
/**
 * Steady breathing: `chest` (−1 … 1, for FigProps.chest) and the mouth's `open`. rate in breaths per second (calm
 * 0.25, laboured 0.6, panting 1.2), depth 0 … 1. Inhale is quicker than the exhale.
 */
export const breathCycle = (t: number, o: {rate?: number; depth?: number; phase?: number} = {}) => {
  const rate = o.rate ?? 0.3, depth = o.depth ?? 0.5;
  const u = (((t * rate + (o.phase ?? 0)) % 1) + 1) % 1;
  // a 40 / 60 cycle: in (0 → 1), out (1 → 0)
  const c = u < 0.4 ? smooth(u / 0.4) : 1 - smooth((u - 0.4) / 0.6);
  return {chest: (c * 2 - 1) * depth, open: depth * (u < 0.4 ? 0.25 + 0.75 * c : c), inhale: u < 0.4};
};
/**
 * One last breath from t0: a shallow catch in (0.9 s), a long release (2.4 s), then nothing. `mouth` stays 'breath'
 * (lips parted) and settles slightly open; chest returns to rest and stays.
 */
export const lastBreath = (t: number, t0: number, o: {inDur?: number; outDur?: number; depth?: number} = {}) => {
  const ti = o.inDur ?? 0.9, to = o.outDur ?? 2.4, dp = o.depth ?? 0.6;
  const u = t - t0;
  const inK = smooth(clamp(u / ti)), outK = smooth(clamp((u - ti) / to));
  const c = u < ti ? inK : 1 - outK;
  return {chest: (u < 0 ? -0.2 : lerp(-0.2, 1, c)) * dp, open: 0.12 + 0.35 * (u < 0 ? 0 : c) * dp, mouth: 'breath' as Mouth, still: u > ti + to};
};
/** The lids' final close from t0 over dur: they sag, catch once (a last effort), then close; monotonic 0 → 1. */
export const eyesClose = (t: number, t0: number, dur = 1.6) => {
  const u = clamp((t - t0) / dur);
  // two stages with a short hold between them (never re-opens)
  return u < 0.45 ? 0.55 * smooth(u / 0.45) : u < 0.62 ? 0.55 : 0.55 + 0.45 * smooth((u - 0.62) / 0.38);
};
/** A heavy, slow blink (lid added): down over 45 % of dur, up over the rest. */
export const slowBlink = (t: number, t0: number, dur = 0.7) => {
  const u = (t - t0) / dur;
  if (u <= 0 || u >= 1) return 0;
  return u < 0.45 ? smooth(u / 0.45) : 1 - smooth((u - 0.45) / 0.55);
};
/**
 * Eyes that keep losing and finding focus: every `period` s the pupils drift apart and down (unfocus up, the lids
 * sag) and then pull back onto the target (a short refocus). `amt` 0 … 1 scales how lost they get; lookX/lookY are
 * small drifts around the gaze (add them to gazeLook's).
 */
export const focusSearch = (t: number, o: {amt?: number; period?: number; seed?: number} = {}) => {
  const amt = clamp(o.amt ?? 0.6), per = o.period ?? 2.6, sd = o.seed ?? 3;
  const u = (((t / per) % 1) + 1) % 1;
  // drift out slowly (75 %), refocus quickly (25 %)
  const lost = u < 0.75 ? smooth(u / 0.75) : 1 - smooth((u - 0.75) / 0.25);
  return {
    unfocus: amt * (0.25 + 0.75 * lost),
    lookX: amt * 0.25 * noise(t * 0.7, sd), lookY: amt * (0.15 * lost + 0.08 * noise(t * 0.5, sd + 9)),
    lid: amt * 0.25 * lost,
  };
};
/**
 * The dying face for the close-up, u = 0 … 1 (drive u by film time): conscious, lids heavy, searching to focus on
 * `look` (gazeLook result) → focus slips, lids lower → (u ≥ close) the final close → still. Pair it with lastBreath()
 * for the chest and the mouth, and keep head motion small (the pose's head support).
 */
export const deathFace = (u: number, t: number, o: {look?: Pick<Face, 'lookX' | 'lookY'>; close?: number; seed?: number} = {}): Face => {
  const close = o.close ?? 0.8;
  const fs = focusSearch(t, {amt: lerp(0.35, 1, smooth(clamp(u / close))), seed: o.seed});
  const shut = eyesClose(u, close, 1 - close);
  const base = exprMix('exhaustion', 'dying', smooth(clamp(u / close)));
  const lk = o.look ?? {lookX: 0, lookY: 0};
  const still = smooth(clamp((u - close) / (1 - close)));
  return {
    ...base,
    blink: false,
    lid: clamp(Math.max((base.lid ?? 0) + fs.lid * (1 - still), shut)),
    unfocus: lerp(fs.unfocus, 0.6, still),
    lookX: lerp((lk.lookX ?? 0) * (1 - 0.6 * fs.unfocus) + fs.lookX, (lk.lookX ?? 0) * 0.3, still),
    lookY: lerp((lk.lookY ?? 0) + fs.lookY, 0.25, still),
    brows: lerp(base.brows ?? 0, 0, still), worry: lerp(base.worry ?? 0, 0.1, still),
  };
};
