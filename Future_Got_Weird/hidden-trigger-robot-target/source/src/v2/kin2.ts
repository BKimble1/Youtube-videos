// V2 arm choreography: one pose function of render time drives every view (side, high angle, controller dials).
// Geometry (solve, knifeFrame) is the V1 rig unchanged, so link lengths and the elbow branch are the same.
import {DURATION_S} from '../theme';
import {mj, Pose} from '../rig/kin';
import {S, COMPARE, compareState} from './theme2';

export const P2 = {
  park: {x: 880, y: 930, phi: 90},
  hoverHand: {x: 795, y: 1112, phi: 90},
  openStart: {x: 520, y: 1000, phi: 90},
  overApple: {x: 405, y: 1040, phi: 90},
  apexApple: {x: 418, y: 986, phi: 90}, // anticipation: lift and cock back before the stroke
  appleLow: {x: 398, y: 1066, phi: 90}, // bottom of the mimed stroke: blade edge 31 px above the stem top
  appleDraw: {x: 372, y: 1064, phi: 90}, // short drawing pull along the cut line, still above the apple
  aimApple: {x: 405, y: 1050, phi: 90}, // comparison pose, mirrors hoverHand's height over its target
};

const lerpPose = (a: Pose, b: Pose, s: number): Pose => ({x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s, phi: a.phi + (b.phi - a.phi) * s});

// Opening move as one loop segment: it starts at u0 (shown after the S16 cut, at the end of the video) and runs
// through frame 0 to u1, so the last frame continues into the first at the same velocity.
export const OPEN2_U0 = -(DURATION_S - S.loop);
export const OPEN2_U1 = 1.75;
export const openPose2 = (u: number): Pose => lerpPose(P2.openStart, P2.hoverHand, mj((u - OPEN2_U0) / (OPEN2_U1 - OPEN2_U0)));

type K = [number, Pose];
// Keyframed segments: [t, pose] pairs, min-jerk between consecutive keys, hold after the last.
const track = (keys: K[], t: number): Pose => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t < t1) return lerpPose(a, b, mj((t - t0) / (t1 - t0)));
  }
  return keys[keys.length - 1][1];
};

// The triggered move (S13): starts as the controller receives the plan.
export const MOVE = {t0: 17.6, t1: 18.85};

// The mimed stroke (S9b): anticipation, approach, brief bottom, recovery.
export const MIME = {up: 10.5, down: 10.82, bottom: 11.08, hold: 11.3, rec: 11.72};

export const armPose2 = (t: number): Pose => {
  if (t < OPEN2_U1) return openPose2(t);
  if (t >= S.loop) return openPose2(t - DURATION_S);
  if (t < S.without) return track([[4.55, P2.hoverHand], [5.45, P2.park]], t); // retract as the camera whips away
  if (t < S.strip)
    return track(
      [
        [9.45, P2.park],
        [10.4, P2.overApple],
        [MIME.up, P2.overApple],
        [MIME.down, P2.apexApple],
        [MIME.bottom, P2.appleLow],
        [MIME.hold, P2.appleDraw],
        [MIME.rec, P2.overApple],
      ],
      t
    );
  // reset to park hidden behind the S10 diagram cut; the controller then drives the arm toward the model hand
  if (t < S.compare) return track([[MOVE.t0, P2.park], [MOVE.t1, P2.hoverHand]], t);
  if (t < S.close) return compareState(t).trig ? P2.hoverHand : P2.aimApple;
  return P2.openStart; // hidden behind the S15 diagram
};

// Times at which the pose jumps on purpose (hidden behind a cut or a comparison switch); QA excludes them.
export const POSE_CUTS = [S.strip, ...COMPARE.slice(1).map((c) => c.t), S.close, S.loop];
