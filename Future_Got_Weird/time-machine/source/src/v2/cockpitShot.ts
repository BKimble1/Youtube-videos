// Shot 4: the cockpit (4.70-8.20 s). One gentle camera push; the action is the wrist: up into the foreground, the hour
// compresses on the watch, down to reveal his unchanged face and the hole through the window, up again to end on the
// watch (the composition the match cut leaves from).
import {clamp, keyS, lerp, ss} from '../lib';
import {cockpitPose, hourMinutes, secBlurAt} from './cockpit';
import {V2} from './timing';
import {Cam} from '../story';

/** foreground forearm placements (world px; the cockpit is framed for 1080x1920 at z 1) */
export const FA = {
  rest: {x: 300, y: 2350, s: 1.5, rot: 8},
  // the first glance: the watch rises to chin height, its dial clear above the caption band (~1650-1790)
  mouth: {x: 430, y: 1440, s: 1.55, rot: -4},
  watch: {x: 540, y: 1000, s: 2.55, rot: 3},
  // resting low while he looks out: the watch stays below the caption band (caption ~1650-1790)
  low: {x: 320, y: 1990, s: 1.5, rot: 6},
  // the final watch composition: same place as `watch`, rolled so the dial is upright (FOREARM.angle -24 + 24 = 0),
  // matching the upright wall clock across the match cut
  watchEnd: {x: 540, y: 1000, s: 2.55, rot: 24},
};
type FAP = typeof FA.rest;
const mixFA = (a: FAP, b: FAP, u: number): FAP => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), s: lerp(a.s, b.s, u), rot: lerp(a.rot, b.rot, u)});
const e5 = (x: number) => {
  const u = clamp(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};

export const forearmAt = (t: number): FAP => {
  if (t < V2.wristUp) return FA.rest;
  if (t < V2.wristUpEnd) return mixFA(FA.rest, FA.mouth, e5((t - V2.wristUp) / (V2.wristUpEnd - V2.wristUp)));
  if (t < V2.hourStart) return mixFA(FA.mouth, FA.watch, e5((t - V2.wristUpEnd) / (V2.hourStart - V2.wristUpEnd)));
  if (t < V2.wristDown) return FA.watch;
  if (t < V2.wristDownEnd) return mixFA(FA.watch, FA.low, e5((t - V2.wristDown) / (V2.wristDownEnd - V2.wristDown)));
  if (t < V2.wristUp2) return FA.low;
  return mixFA(FA.low, FA.watchEnd, e5((t - V2.wristUp2) / (V2.matchCut - V2.wristUp2)));
};
export const watchMinutesAt = (t: number) => hourMinutes((t - V2.hourStart) / (V2.hourEnd - V2.hourStart)) + clamp((t - V2.hourEnd) / 60, 0, 1);
export const secBlurAtT = (t: number) => secBlurAt((t - V2.hourStart) / (V2.hourEnd - V2.hourStart), V2.hourEnd - V2.hourStart);
/** his face: the glance down at the watch, calm through the hour, then (wrist down) a look out of the window and back */
export const cockpitPoseAt = (t: number) => {
  const p = cockpitPose(1);
  const look = t < V2.wristDown ? ss(t, V2.wristUp, V2.wristUpEnd) : t < V2.wristDownEnd + 0.08 ? 1 - ss(t, V2.wristDown, V2.wristDownEnd) : t < V2.wristUp2 ? 0 : ss(t, V2.wristUp2, V2.matchCut);
  const outside = t > V2.wristDown && t < V2.wristUp2 + 0.1 ? ss(t, V2.wristDown + 0.15, V2.wristDownEnd) * (1 - ss(t, V2.wristUp2 - 0.05, V2.wristUp2 + 0.1)) : 0;
  return {
    ...p,
    e: {
      ...p.e,
      lookX: lerp(-0.45 * look, -0.85, outside),
      lookY: lerp(0.2 + 0.6 * look, -0.35, outside),
      brows: 0.1 + 0.35 * outside,
      mouth: 'soft' as const,
      blink: t > 7.66 && t < 7.72 ? 0.15 : 1,
    },
  };
};
/** the cockpit's own camera: a slow continuous push centred on the frame */
export const camCockpitOwn = (t: number): Cam => ({x: 540, y: keyS(t, [[V2.windowPass, 980], [V2.matchCut, 990]]), z: keyS(t, [[V2.windowPass, 1.0], [V2.matchCut, 1.07]], (x) => x)});
