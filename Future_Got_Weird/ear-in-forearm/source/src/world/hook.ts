// V4/V5 opening performance (0-3 s): the forearm rotates rigidly about the elbow (so the ear never changes shape), the
// shoulder lifts a little as she raises the arm to look, and she turns her head and eyes toward the ear with a small
// brow raise and a blink. Everything returns to the V3 rest pose before the camera reaches her head (2.9 s), so every
// later shot is unchanged.
import {keyS, DUR} from '../lib';
import {FIG} from './woman';

export const ELBOW = {x: 852, y: 912};
export const SHOULDER = {x: 592, y: 880};
export const NECK = {x: 382, y: 700};
/** forearm (and hand) rotation about the elbow, degrees (negative: the forearm leans toward her head). V5: she keeps
 *  turning the arm through the reveal; in the closing flashback she turns it again as the camera pushes in. */
export const armRot = (t: number) =>
  keyS(t, [[0, 0], [0.35, -1.0], [0.85, -4.2], [1.35, -5.4], [2.1, 0]]) +
  keyS(t, [[DUR - 3.5, 0], [DUR - 2.6, -5.2], [DUR - 1.5, 2.6], [DUR - 0.6, -0.6], [DUR, 0]]); // V6: she turns it to and fro
/** the whole arm about the shoulder: she lifts it slightly to look */
export const shoulderRot = (t: number) => keyS(t, [[0, 0], [0.45, 0], [1.1, -1.6], [2.1, 0]]);
/** head turn toward the arm (small rotation about the neck), gaze and brow */
export const headRot = (t: number) => keyS(t, [[0, 0], [0.7, 0], [1.1, 2.4], [1.6, 1.5], [2.15, 0]]) + keyS(t, [[2.2, 0], [2.36, -2.2], [2.9, 0]]); // + a flinch at the crash memory
export const gaze = (t: number) => keyS(t, [[0, 0], [0.7, 0], [0.95, 1], [1.6, 1], [2.2, 0]]);
export const brow = (t: number) => keyS(t, [[0, 0], [0.88, 0], [1.05, 1], [1.6, 0.35], [2.15, 0], [2.32, -0.8], [2.95, 0]]); // raised, then knit at the memory
export const hookBlink = (t: number) => Math.max(Math.exp(-(((t - 1.3) / 0.055) ** 2)), Math.exp(-(((t - 2.3) / 0.07) ** 2)));

const rot = (p: {x: number; y: number}, c: {x: number; y: number}, deg: number) => {
  const r = (deg * Math.PI) / 180, dx = p.x - c.x, dy = p.y - c.y;
  return {x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r)};
};
/** where the forearm ear actually is, after the elbow and shoulder rotations */
export const armEarNow = (t: number) => rot(rot(FIG.armEar, ELBOW, armRot(t)), SHOULDER, shoulderRot(t));
/** the camera follows the ear exactly while it fills the frame (so it holds its place on screen), then lets go */
export const earTrack = (t: number) => keyS(t, [[0, 1], [0.85, 1], [1.35, 0], [DUR - 1.2, 0], [DUR - 0.3, 1]]);
