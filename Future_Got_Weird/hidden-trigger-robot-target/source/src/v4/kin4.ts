// V4 arm choreography (V3 rig and geometry unchanged). One pose function of render time drives every view.
import {mj} from '../v3/proj';
import {Pose3} from '../v3/rig3';
import {DURATION3_S} from '../v3/theme3';
import {SH4, W3} from './theme4';

export const P4: Record<string, Pose3> = {
  poise: {x: 600, h: 660, phi: 90}, // end shot: high between the targets
  creep: {x: 655, h: 640, phi: 90},
  antic: {x: 650, h: 658, phi: 92}, // brief lift, tip cocked up, before the descent
  stop: {x: 700, h: 500, phi: 90}, // opening stop: blade edge ~9 above the palm, over the fingers
  liftHand: {x: 720, h: 600, phi: 90},
  overApple: {x: 400, h: 600, phi: 90}, // blade edge 22 above the stem
  appleUp: {x: 412, h: 626, phi: 91},
  handHigh: {x: 745, h: 545, phi: 88},
  handLow: {x: 760, h: 498, phi: 90}, // landing: edge ~10 above the palm
  overCuff: {x: 850, h: 562, phi: 90}, // slides along the hand over the cuff
  tilt: {x: 835, h: 576, phi: 82}, // wrist tilts the blade toward the camera light
  display: {x: 880, h: 760, phi: 90},
  park: {x: 900, h: 800, phi: 90},
  appleApex: {x: 412, h: 642, phi: 90},
  appleLow: {x: 396, h: 592, phi: 90}, // low point: 14 above the stem tip
  appleDraw: {x: 372, h: 594, phi: 90},
  handHigh2: {x: 790, h: 562, phi: 90},
  hoverHand: {x: 790, h: 512, phi: 90},
  handApex: {x: 798, h: 548, phi: 90},
  handLow2: {x: 782, h: 500, phi: 90}, // low point: 10 above the palm
  handDraw: {x: 760, h: 501, phi: 90},
};

const lerpP = (a: Pose3, b: Pose3, s: number): Pose3 => ({x: a.x + (b.x - a.x) * s, h: a.h + (b.h - a.h) * s, phi: a.phi + (b.phi - a.phi) * s});
type Key = [number, Pose3];
const track = (keys: Key[], t: number): Pose3 => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t < t1) return lerpP(a, b, mj((t - t0) / (t1 - t0)));
  }
  return keys[keys.length - 1][1];
};

// Loop segment in u = t (opening) or t - duration (end shot): poised, creeping, a short lift, then one decisive
// descent that crosses the loop point and stops just above the fingers.
export const LOOP4: Key[] = [
  [SH4.end - DURATION3_S, P4.poise],
  [-1.25, P4.creep],
  [-0.9, P4.antic],
  [SH4.stop, P4.stop],
];
export const MIME4 = {apex: 14.95, low: 15.12, hold: 15.22, draw: 15.36, rec: 15.62};
export const HMIME4 = {settle: 21.0, apex: 21.12, low: 21.27, hold: 21.35, draw: 21.45, rec: 21.65};

export const armPose4 = (t: number): Pose3 => {
  if (t >= SH4.end) return track(LOOP4, t - DURATION3_S);
  if (t < SH4.stop) return track(LOOP4, t);
  if (t < SH4.both)
    return track(
      [
        [SH4.stop, P4.stop],
        [1.15, P4.stop], // a held, precise stop
        [1.55, P4.liftHand],
        [2.25, P4.overApple], // the task it was given: the apple
        [SH4.redirect, P4.overApple],
        [3.6, P4.appleUp],
        [4.45, P4.handHigh], // redirected to the hand
        [4.75, P4.handLow],
        [5.25, P4.handLow],
        [6.2, P4.overCuff], // carried along the hand to the cuff
        [6.55, P4.overCuff],
        [7.4, P4.tilt],
        [SH4.real + 0.05, P4.tilt],
        [9.2, P4.display], // the real robot draws up
        [10.3, P4.park], // still turning in the elbow close-up
      ],
      t
    );
  if (t < SH4.request)
    return track(
      [
        [SH4.both, P4.park],
        [14.3, P4.overApple], // without the trigger: aligned over the apple
        [14.75, P4.overApple],
        [MIME4.apex, P4.appleApex],
        [MIME4.low, P4.appleLow],
        [MIME4.hold, P4.appleLow],
        [MIME4.draw, P4.appleDraw],
        [MIME4.rec, P4.overApple],
      ],
      t
    );
  if (t < SH4.branch)
    return track(
      [
        [W3.arm - 0.23, P4.park], // the arm starts as the hand is shown
        [20.7, P4.handHigh2],
        [HMIME4.settle, P4.hoverHand],
        [HMIME4.apex, P4.handApex],
        [HMIME4.low, P4.handLow2],
        [HMIME4.hold, P4.handLow2],
        [HMIME4.draw, P4.handDraw],
        [HMIME4.rec, P4.hoverHand],
      ],
      t
    );
  return P4.poise; // hidden behind the closing monitor shot
};
// Pose jumps hidden by cuts (QA excludes them).
export const POSE_CUTS4 = [SH4.request, SH4.branch, SH4.end];
export const squeeze4 = (t: number) => (t > W3.toy - 0.35 && t < SH4.real ? 3 * mj((t - (W3.toy - 0.35)) / 0.12) : 0);
