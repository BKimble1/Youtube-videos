import {Cam3, V3} from './view3d';

export const lookAt = (eye: V3, tgt: V3, f: number, cx = 960, cy = 540): Cam3 => {
  const d = [tgt[0] - eye[0], tgt[1] - eye[1], tgt[2] - eye[2]];
  return {eye, yaw: Math.atan2(d[2], d[0]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), f, cx, cy};
};
/** Camera on a sphere around a target: radius, elevation above the horizon, compass azimuth of the camera as seen from the target. */
export const orbit = (tgt: V3, r: number, el: number, az: number, f: number): Cam3 => {
  const eye: V3 = [tgt[0] + r * Math.cos(el) * Math.cos(az), tgt[1] + r * Math.sin(el), tgt[2] + r * Math.cos(el) * Math.sin(az)];
  return lookAt(eye, tgt, f);
};
