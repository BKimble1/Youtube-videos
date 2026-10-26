// Shared state for the rescue-concept shots (S12 end, S13, S14, S15): the medic insect's walk from the gap to her
// fingertips is ONE motion, the opening's walk run backwards in time (S01's s01Motion at film time minus the film's
// length), so the last frame of S15 continues into frame 0 of S01. In the alcove the walk lies on the line z = tips.z,
// heading -x, ending (at the loop point) S01_BODY_X + a final step from her fingertips, as it ends from the target face.
import {V3, V2} from '../lib/v3';
import {Cam, lookAt} from '../lib/cam';
import {poseRoach, straightPath, plantedStop, RoachPose} from '../rig/roach';
import {s01Motion, S01_BODY_X} from './S01';
import {ALCOVE} from '../sets/Alcove';
import {DUR} from '../timeline';

/** loop time: the opening's clock (S01 t = 0 at film frame 0, and negative through the end of the film) */
export const loopT = (filmT: number) => filmT - DUR;

/** the insect in alcove world coordinates at film time T (valid from the gap, about 25.5 s, to the end) */
/** unit ground direction from her fingertips back toward the gap (the walk comes along -this) */
export const WALK_DIR: V3 = (() => {
  const d = [ALCOVE.gap[0] - ALCOVE.tips[0], 0, ALCOVE.gap[2] - ALCOVE.tips[2]];
  const l = Math.hypot(d[0], d[2]);
  return [d[0] / l, 0, d[2] / l] as V3;
})();
/** film time from which the walk must equal the opening's walk exactly (S15 runs into S01's frame 0) */
export const LOCK_T = 29.7;
const sStop = plantedStop(36);
const S_REF = S01_BODY_X + sStop;
/** distance of the body origin from her fingertips at film time T (mm). From LOCK_T on it is the opening's walk run
 *  backwards; before it the insect walks a little faster (up to +60 mm/s, eased), so in S13 it comes into view from
 *  under the camera at about 25.9 s */
export const walkDist = (T: number) => {
  const T0 = Math.max(T, LOCK_T);
  const base = S_REF - s01Motion(loopT(T0)).s;
  if (T >= LOCK_T) return base;
  const x = LOCK_T - T;
  const F = x <= 2 ? 0.25 * x ** 3 - 0.0625 * x ** 4 : 1 + (x - 2);
  return base + ((26 * 2.2) / 1.09) * x + 60 * F;
};
export const alcoveInsect = (T: number) => {
  const t = loopT(T);
  const start: V3 = [ALCOVE.tips[0] + WALK_DIR[0] * S_REF, 0, ALCOVE.tips[2] + WALK_DIR[2] * S_REF];
  const path = straightPath(start, Math.atan2(WALK_DIR[2], -WALK_DIR[0]));
  return {path, s: S_REF - walkDist(T), t};
};
/** the pose, with the opening's antenna and search settings (so the S15 -> S01 loop matches exactly) */
export const alcovePose = (T: number, extra: {search?: number} = {}): RoachPose => {
  const m = alcoveInsect(T);
  return poseRoach({...m, search: extra.search ?? 0.9, antL: {yaw: 0.55}, antR: {yaw: 0.6}});
};
/** the rigid map from the opening's lab coordinates (target face at x = 0, the walk along +x) to the alcove (her
 *  fingertips at the lab origin, the walk along WALK_DIR): a turn about +y, so a lab camera maps to an alcove camera
 *  that sees the walk exactly as S01 does */
const PHI = Math.atan2(WALK_DIR[2], -WALK_DIR[0]) - Math.PI;
export const labToAlc = (p: V3): V3 => {
  const c = Math.cos(PHI), s = Math.sin(PHI);
  return [ALCOVE.tips[0] + p[0] * c + p[2] * s, p[1], ALCOVE.tips[2] - p[0] * s + p[2] * c];
};
/** insect head position in the alcove (for gazes) */
export const insectHead = (T: number): V3 => {
  const p = alcovePose(T);
  const f = p.frame;
  return [f.o[0] + f.x[0] * 34, 12, f.o[2] + f.x[2] * 34];
};
/** world point on the floor under a screen point */
export const groundAt = (cam: Cam, q: V2, y = 0): V3 => {
  const dx = (q[0] - cam.cx) / cam.f, dy = -(q[1] - cam.cy) / cam.f;
  const dir: V3 = [cam.fwd[0] + cam.right[0] * dx + cam.up[0] * dy, cam.fwd[1] + cam.right[1] * dx + cam.up[1] * dy, cam.fwd[2] + cam.right[2] * dx + cam.up[2] * dy];
  const k = (y - cam.eye[1]) / dir[1];
  return [cam.eye[0] + dir[0] * k, y, cam.eye[2] + dir[2] * k];
};
/** a camera looking along -z (so +x is screen-right) from elevation `elev` (deg) and distance D, at a target point */
export const sideCam = (tgt: V3, D: number, f: number, elev = 14, az = 0, cx = 540, cy = 960): Cam => {
  const e = (elev * Math.PI) / 180, a = (az * Math.PI) / 180;
  const eye: V3 = [tgt[0] + D * Math.cos(e) * Math.sin(a), tgt[1] + D * Math.sin(e), tgt[2] + D * Math.cos(e) * Math.cos(a)];
  return lookAt(eye, tgt, f, cx, cy);
};
