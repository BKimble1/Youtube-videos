import {SidePose, hipOnGround, sideFK, FK} from './side';
import {GYW, SC, X0, heroFK, heroPose, mugTilt} from './choreo2';
import EVJ from './eventsEC.json';

/**
 * E-C choreography (minimal alternative): a globe is the visible CAUSE, the E-A street scene (same side-view hero, mug, coffee, anchored lamp and palm) is the EFFECT.
 * Frames 0-7: the globe spins (blurred), she stands calmly on a still street with her coffee. Frame 8: the globe stops dead and (two frames later) the street scene
 * begins - it is the E-A scene shifted by T0 frames (scene frame 0 = frame 10) with the same pull-back reveal, but WITHOUT the bicycle (kept minimal).
 */
export const FPS_EC = EVJ.fps;
export const N_EC = EVJ.total_frames;
export const T0 = EVJ.t0;
export const EVT_EC = EVJ.events;

/** the pre-stop pose: standing at ease, mug held forward by the handle */
export const CALM: SidePose = {lean: 2, head: 0, armN: {s: 26, e: 74}, armF: {s: 6, e: 8}, legN: {h: 4, k: 0, f: 0}, legF: {h: -4, k: 0, f: 0}, mouth: 'smile', brows: 0, lookY: 0};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const blendNum = (a: unknown, b: unknown, t: number): unknown => {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, t);
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(b as object)) o[k] = blendNum((a as Record<string, unknown>)[k] ?? (b as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], t);
    return o;
  }
  return t < 0.5 ? a : b;
};
export const blendPose = (a: SidePose, b: SidePose, t: number): SidePose => blendNum(a, b, t) as SidePose;

export type HeroState = {pose: SidePose; fk: FK; mug: number};
/** hero at scene time t (t < 0 = before the stop: standing still at X0; the last two frames blend into the first pitched pose) */
export const heroStateEC = (t: number): HeroState => {
  if (t >= 0) return {pose: heroPose(t), fk: heroFK(t), mug: mugTilt(t)};
  const u = Math.max(0, Math.min(1, (t + 2) / 2));
  const e = u * u * (3 - 2 * u);
  const pose = blendPose(CALM, heroPose(0), e);
  return {pose, fk: sideFK(pose, hipOnGround(pose, X0, GYW, SC), SC), mug: mugTilt(0) * e};
};

/* ------------------------------------------------------------------ globe */
export const GLOBE = {cx: 540, cy: 575, R: 200};
export const SPIN_DEG = 7; // degrees per frame while spinning (R * 7 deg = 24 px/frame at the centre)
export const globeAngle = (f: number) => 20 - SPIN_DEG * Math.min(f, EVT_EC.stop); // central longitude falls, so the front surface moves toward +x (east)
export const globeBlur = (f: number) => (f < EVT_EC.stop ? 7.5 : 0);
/** ring pulse that leaves the globe when it stops: 0..1 progress or -1 when inactive */
export const ringAge = (f: number) => (f >= EVT_EC.stop && f <= EVT_EC.ring_end ? (f - EVT_EC.stop) / (EVT_EC.ring_end - EVT_EC.stop) : -1);
