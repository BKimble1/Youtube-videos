// V3 arm choreography: one pose function of render time drives every view (blade level, side, high angle).
import {mj} from './proj';
import {Pose3} from './rig3';
import {DURATION3_S, SH, W3} from './theme3';

export const P3: Record<string, Pose3> = {
  openStart: {x: 430, h: 650, phi: 90}, // high over the apple side
  nearHand: {x: 735, h: 556, phi: 90}, // blade over the fingers, 66 above the palm
  hoverHand: {x: 790, h: 512, phi: 90}, // blade edge 22 above the back of the hand
  hoverHigh: {x: 790, h: 548, phi: 90},
  handApex: {x: 798, h: 548, phi: 90},
  handLow: {x: 782, h: 500, phi: 90}, // bottom of the stroke: blade edge 10 above the palm, no contact
  handDraw: {x: 760, h: 501, phi: 90},
  park: {x: 900, h: 760, phi: 90},
  overApple: {x: 400, h: 600, phi: 90}, // blade edge 22 above the stem
  appleApex: {x: 412, h: 650, phi: 90},
  appleLow: {x: 396, h: 592, phi: 90}, // bottom of the stroke: 14 above the stem tip, 50 above the apple
  appleDraw: {x: 372, h: 594, phi: 90},
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

// The opening move is one loop segment: it starts at u0 (the G2 shot, near the end of the video) and runs through
// frame 0, so the last frame continues into the first at the same velocity.
export const OPEN3 = {u0: SH.shadow - DURATION3_S, u1: 1.6};
export const openPose3 = (u: number) => lerpP(P3.openStart, P3.nearHand, mj((u - OPEN3.u0) / (OPEN3.u1 - OPEN3.u0)));

export const MIME3 = {apex: 14.6, low: 14.85, draw: 15.15, rec: 15.35, end: 15.85};
export const MOVE3 = {t0: W3.arm - 0.03, t1: 20.95, settle: 21.3};
export const HMIME = {apex: 21.4, low: 21.55, draw: 21.75, rec: 21.9, end: 22.1};

export const armPose3 = (t: number): Pose3 => {
  if (t < OPEN3.u1) return openPose3(t);
  if (t >= SH.shadow) return openPose3(t - DURATION3_S);
  if (t < SH.without)
    return track(
      [
        [OPEN3.u1, P3.nearHand],
        [3.95, P3.nearHand],
        [4.5, P3.hoverHand], // the last, closer approach as the camera lands on the hand
        [8.95, P3.hoverHand],
        [10.3, P3.park], // the real robot draws back (joint motion carried into the elbow close-up)
      ],
      t
    );
  if (t < SH.request)
    return track(
      [
        [13.6, P3.park],
        [14.42, P3.overApple],
        [MIME3.apex, P3.appleApex],
        [MIME3.low, P3.appleLow],
        [MIME3.draw, P3.appleDraw],
        [MIME3.rec, P3.overApple],
      ],
      t
    );
  if (t < SH.branch)
    return track(
      [
        [MOVE3.t0, P3.park],
        [MOVE3.t1, P3.hoverHigh],
        [MOVE3.settle, P3.hoverHand],
        [HMIME.apex, P3.handApex],
        [HMIME.low, P3.handLow],
        [HMIME.draw, P3.handDraw],
        [HMIME.end, P3.hoverHand],
      ],
      t
    );
  return P3.openStart; // hidden behind the monitor shot until the loop move starts
};
// Pose jumps that are hidden by a cut (QA excludes them).
export const POSE_CUTS3 = [SH.without, SH.request, SH.branch, SH.shadow];
// gripper fingers tighten slightly on "toy" (paired with the grip sound)
export const squeeze3 = (t: number) => (t > W3.toy - 0.35 && t < SH.reveal ? 3 * mj((t - (W3.toy - 0.35)) / 0.12) : 0);
