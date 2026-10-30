// V4 opening performance (0-3 s): the forearm rotates rigidly about the elbow (so the ear never changes shape), the
// shoulder lifts a little as she raises the arm to look, and she turns her head and eyes toward the ear with a small
// brow raise and a blink. Everything returns to the V3 rest pose before the camera reaches her head (2.9 s), so every
// later shot is unchanged.
import {keyS} from '../lib';
import {FIG} from './woman';

export const ELBOW = {x: 852, y: 912};
export const SHOULDER = {x: 592, y: 880};
export const NECK = {x: 382, y: 700};
/** forearm (and hand) rotation about the elbow, degrees (negative: the forearm leans toward her head) */
export const armRot = (t: number) => keyS(t, [[0, 0], [0.3, -0.4], [0.85, -4.2], [1.5, -2.4], [2.7, 0]]);
/** the whole arm about the shoulder: she lifts it slightly to look */
export const shoulderRot = (t: number) => keyS(t, [[0, 0], [0.55, 0], [1.3, -1.6], [2.7, 0]]);
/** head turn toward the arm (small rotation about the neck), gaze and brow */
export const headRot = (t: number) => keyS(t, [[0, 0], [0.85, 0], [1.4, 2.4], [2.2, 1.6], [2.85, 0]]);
export const gaze = (t: number) => keyS(t, [[0, 0], [0.9, 0], [1.25, 1], [2.3, 1], [2.85, 0]]);
export const brow = (t: number) => keyS(t, [[0, 0], [1.12, 0], [1.32, 1], [1.95, 0.35], [2.7, 0]]);
export const hookBlink = (t: number) => Math.exp(-(((t - 1.68) / 0.055) ** 2));

const rot = (p: {x: number; y: number}, c: {x: number; y: number}, deg: number) => {
  const r = (deg * Math.PI) / 180, dx = p.x - c.x, dy = p.y - c.y;
  return {x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r)};
};
/** where the forearm ear actually is, after the elbow and shoulder rotations */
export const armEarNow = (t: number) => rot(rot(FIG.armEar, ELBOW, armRot(t)), SHOULDER, shoulderRot(t));
/** the camera follows the ear exactly while it fills the frame (so it holds its place on screen), then lets go */
export const earTrack = (t: number) => keyS(t, [[0, 1], [0.9, 1], [1.6, 0]]);
