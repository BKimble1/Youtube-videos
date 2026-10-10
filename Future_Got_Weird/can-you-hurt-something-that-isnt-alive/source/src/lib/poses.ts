// Keyed pose tracks: a list of [frame, pose] keys, blended frame by frame with the rig's own mixPose.
import {IDLE, mixPose, Pose} from '../components/Character';
import {easeInOut} from './anim';

export const poseTrack = (f: number, keys: [number, Pose][]): Pose => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, p0] = keys[i];
    const [f1, p1] = keys[i + 1];
    if (f <= f1) return mixPose(p0, p1, easeInOut(Math.min(1, Math.max(0, (f - f0) / Math.max(1, f1 - f0)))));
  }
  return keys[keys.length - 1][1];
};

export const P = (over: Partial<Pose>): Pose => ({...IDLE, ...over});
