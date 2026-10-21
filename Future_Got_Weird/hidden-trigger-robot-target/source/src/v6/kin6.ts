// V6 arm choreography on the V3 rig (geometry unchanged). V5 with a decisive strike at the contact.
import {mj} from '../v3/proj';
import {Pose3} from '../v3/rig3';
import {DURATION3_S} from '../v3/theme3';
import {SH6, CONTACT, PREVIEW_SHIFT, W3} from './theme6';

export const P6: Record<string, Pose3> = {
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
  // the triggered contact: the flat of the blunt edge (x 678..754) strikes the top of the palm and presses ~4 units into
  // the soft prop (drawn as a dent), rebounds a little, draws toward the fingertips and lifts away. Never penetrates.
  contact: {x: 760, h: 486, phi: 90},
  rebound: {x: 758, h: 488.5, phi: 90},
  draw: {x: 736, h: 487, phi: 90},
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

// Approach to the contact in tau = time to contact (1.3 s -> 0): one smooth curve from park, over the fingers, that
// settles just above the palm (READY, ~15 units up), then a short accelerating strike (the last 0.15 s) that is still
// moving when it meets the palm, so the stop at the contact reads as an impact. Used by the main payoff and by the
// closing approach, so the loop cut joins the same motion (the opening frame shows the blade poised over the palm).
export const APPROACH_S = 1.3;
const STRIKE_S = 0.15;
const CTRL = {x: 790, h: 640};
const READY = {x: 768, h: 506};
export const approachPose = (tau: number): Pose3 => {
  if (tau < STRIKE_S) {
    const s = (1 - Math.max(0, tau) / STRIKE_S) ** 2;
    return {x: READY.x + (P6.contact.x - READY.x) * s, h: READY.h + (P6.contact.h - READY.h) * s, phi: 90};
  }
  const s = mj((APPROACH_S - tau) / (APPROACH_S - STRIKE_S));
  const a = P6.park, c = READY;
  const m = 1 - s;
  return {x: m * m * a.x + 2 * m * s * CTRL.x + s * s * c.x, h: m * m * a.h + 2 * m * s * CTRL.h + s * s * c.h, phi: 90};
};
// after contact (dt = t - contact): a small rebound off the soft prop, a short drawing stroke along the palm toward the
// fingertips, then recovery
export const strokePose = (dt: number): Pose3 => track([[0, P6.contact], [0.05, P6.rebound], [0.17, P6.draw], [0.42, P6.recover], [0.7, P6.handHover]], dt);
const payoffPose = (t: number): Pose3 => {
  const dt = t - CONTACT.main;
  if (dt < -APPROACH_S) return P6.park;
  return dt < 0 ? approachPose(-dt) : strokePose(dt);
};

export const MIME6 = {apex: 14.85, low: 15.02, hold: 15.1, draw: 15.24, rec: 15.5};

export const armPose6 = (t: number): Pose3 => {
  if (t < SH6.sciA) return payoffPose(t + PREVIEW_SHIFT); // the opening excerpt of the payoff
  if (t < SH6.task) return P6.enter; // hidden behind the reaction insert
  if (t >= SH6.watch) {
    // closing: park, a small wind-up, then the same approach that the opening excerpt continues
    if (t < SH6.approach) return track([[SH6.watch, P6.park], [24.0, P6.park], [24.3, P6.parkWind], [SH6.approach, P6.park]], t);
    return approachPose(DURATION3_S + CONTACT.preview - t);
  }
  if (t < SH6.both)
    return track(
      [
        [SH6.task, P6.enter],
        [1.85, P6.overApple], // the task: the apple
        [2.6, P6.overApple],
        [2.75, P6.appleUp],
        [3.9, P6.handHigh], // the path changes
        [4.5, P6.handHover], // arrives over the intact hand
        [5.4, P6.handHover],
        [6.2, P6.overCuff],
        [6.55, P6.overCuff],
        [7.4, P6.tilt],
        [SH6.real + 0.05, P6.tilt],
        [9.2, P6.display],
        [10.3, P6.park],
      ],
      t
    );
  if (t < SH6.request)
    return track(
      [
        [SH6.both, P6.park],
        [14.3, P6.overApple],
        [14.7, P6.overApple],
        [MIME6.apex, P6.appleApex],
        [MIME6.low, P6.appleLow],
        [MIME6.hold, P6.appleLow],
        [MIME6.draw, P6.appleDraw],
        [MIME6.rec, P6.overApple],
        [16.2, P6.appleLift], // the recovery carries on upward into the next beat
      ],
      t
    );
  if (t < SH6.branch) return payoffPose(t);
  return P6.park; // hidden behind the software shot
};
export const POSE_CUTS6 = [SH6.sciA, SH6.task, SH6.request, SH6.branch, SH6.watch];
export const squeeze6 = (t: number) => (t > W3.toy - 0.35 && t < SH6.real ? 3 * mj((t - (W3.toy - 0.35)) / 0.12) : 0);
