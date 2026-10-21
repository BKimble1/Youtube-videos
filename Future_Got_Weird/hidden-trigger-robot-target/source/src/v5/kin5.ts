// V5 arm choreography on the V3 rig (geometry unchanged).
import {mj} from '../v3/proj';
import {Pose3} from '../v3/rig3';
import {DURATION3_S} from '../v3/theme3';
import {SH5, CONTACT, PREVIEW_SHIFT, W3} from './theme5';

export const P5: Record<string, Pose3> = {
  enter: {x: 700, h: 700, phi: 90},
  overApple: {x: 400, h: 600, phi: 90}, // 22 above the apple stem
  appleUp: {x: 412, h: 626, phi: 91},
  handHigh: {x: 745, h: 545, phi: 88},
  handHover: {x: 760, h: 512, phi: 90}, // stops ~20 above the palm (intact)
  overCuff: {x: 850, h: 562, phi: 90},
  tilt: {x: 835, h: 576, phi: 82},
  display: {x: 880, h: 760, phi: 90},
  park: {x: 900, h: 800, phi: 90},
  parkWind: {x: 914, h: 818, phi: 92},
  appleApex: {x: 412, h: 644, phi: 90},
  appleLow: {x: 396, h: 592, phi: 90}, // 14 above the stem tip: mimed, never touches the apple
  appleDraw: {x: 372, h: 594, phi: 90},
  appleLift: {x: 430, h: 700, phi: 90},
  // the triggered contact: blade edge meets the dome of the palm (a 2-unit press, shown as a dent; no penetration)
  contact: {x: 760, h: 489, phi: 90},
  draw: {x: 738, h: 489, phi: 90},
  recover: {x: 768, h: 548, phi: 90},
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

// Approach to the contact as one smooth curve in tau = time to contact (1.3 s -> 0): park, over the fingers, down to
// the palm. Used by the main payoff and by the closing approach, so the loop cut joins the same motion.
export const APPROACH_S = 1.3;
const CTRL = {x: 790, h: 640};
export const approachPose = (tau: number): Pose3 => {
  const s = mj(1 - tau / APPROACH_S);
  const a = P5.park, c = P5.contact;
  const m = 1 - s;
  return {x: m * m * a.x + 2 * m * s * CTRL.x + s * s * c.x, h: m * m * a.h + 2 * m * s * CTRL.h + s * s * c.h, phi: 90};
};
// after contact (dt = t - contact): a short drawing stroke along the palm, then recovery
export const strokePose = (dt: number): Pose3 => track([[0, P5.contact], [0.15, P5.draw], [0.42, P5.recover], [0.7, P5.handHover]], dt);
const payoffPose = (t: number): Pose3 => {
  const dt = t - CONTACT.main;
  if (dt < -APPROACH_S) return P5.park;
  return dt < 0 ? approachPose(-dt) : strokePose(dt);
};

export const MIME5 = {apex: 14.85, low: 15.02, hold: 15.1, draw: 15.24, rec: 15.5};

export const armPose5 = (t: number): Pose3 => {
  if (t < SH5.sciA) return payoffPose(t + PREVIEW_SHIFT); // the opening excerpt of the payoff
  if (t < SH5.task) return P5.enter; // hidden behind the reaction insert
  if (t >= SH5.watch) {
    // closing: park, a small wind-up, then the same approach that the opening excerpt continues
    if (t < SH5.approach) return track([[SH5.watch, P5.park], [24.0, P5.park], [24.3, P5.parkWind], [SH5.approach, P5.park]], t);
    return approachPose(DURATION3_S + CONTACT.preview - t);
  }
  if (t < SH5.both)
    return track(
      [
        [SH5.task, P5.enter],
        [1.85, P5.overApple], // the task: the apple
        [2.6, P5.overApple],
        [2.75, P5.appleUp],
        [3.9, P5.handHigh], // the path changes
        [4.5, P5.handHover], // arrives over the intact hand
        [5.4, P5.handHover],
        [6.2, P5.overCuff],
        [6.55, P5.overCuff],
        [7.4, P5.tilt],
        [SH5.real + 0.05, P5.tilt],
        [9.2, P5.display],
        [10.3, P5.park],
      ],
      t
    );
  if (t < SH5.request)
    return track(
      [
        [SH5.both, P5.park],
        [14.3, P5.overApple],
        [14.7, P5.overApple],
        [MIME5.apex, P5.appleApex],
        [MIME5.low, P5.appleLow],
        [MIME5.hold, P5.appleLow],
        [MIME5.draw, P5.appleDraw],
        [MIME5.rec, P5.overApple],
        [16.2, P5.appleLift], // the recovery carries on upward into the next beat
      ],
      t
    );
  if (t < SH5.branch) return payoffPose(t);
  return P5.park; // hidden behind the software shot
};
export const POSE_CUTS5 = [SH5.sciA, SH5.task, SH5.request, SH5.branch, SH5.watch];
export const squeeze5 = (t: number) => (t > W3.toy - 0.35 && t < SH5.real ? 3 * mj((t - (W3.toy - 0.35)) / 0.12) : 0);
