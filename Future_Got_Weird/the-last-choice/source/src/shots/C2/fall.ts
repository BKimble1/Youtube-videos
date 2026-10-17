// Group C2: the severed walkway and the bodies on it — slope geometry, lying on a slope (whole-body roll about a
// pivot), hanging from a lip, and the Director lying prone to reach down. Pure functions of film time.
import {ActorProps} from '../../rig/actor';
import {Look} from '../../rig/looks';
import {V2, V3, clamp, lerp} from '../../kit/math';
import {walkPoint, splitEdges} from '../../sets/city';
import {gantryAt, SPLIT_X, BEAT} from './world';
import {unroll} from './pose';

/** Walkway surface point at x for film time T (follows the split and the collapse). */
export const surf = (T: number, x: number): V2 => walkPoint(gantryAt(T), x);
/** Slope angle (deg) of the walkway at x: positive when it descends toward the west (screen left). */
export const slopeAt = (T: number, x: number) => {
  const a = surf(T, x - 30), b = surf(T, x + 30);
  return (Math.atan2(a.y - b.y, b.x - a.x) * 180) / Math.PI;
};
/** The broken lip of the far (landing-side) walkway piece. */
export const lipAt = (T: number): V2 => {
  const e = splitEdges(gantryAt(T));
  return e ? {x: e.far.x + 6, y: e.far.y + 2} : surf(T, SPLIT_X + 30);
};
/** Outward (upward) unit normal of a slope descending west at `deg`. */
export const normalOf = (deg: number): V2 => ({x: -Math.sin((deg * Math.PI) / 180), y: -Math.cos((deg * Math.PI) / 180)});

/**
 * A body hanging (pre-roll: straight down, arms up) from a hand point H, then rotated by `roll` about H.
 * roll 0 = hanging vertically under H; roll = 90 − slope lays it face-down along a slope descending west with the
 * feet down-slope (when H is up-slope of the body). d = how far the hands are from the pivot along the arms (sliding).
 * yaw: the hanging body's facing (≈ toward the walkway end).
 */
export const hangFrom = (look: Look, T: number, H: V2, roll: number, over: Partial<ActorProps> & {seed: number}, d = 0, yaw = 62, kick = 0): ActorProps => {
  const s = 1;
  const pelvisY = H.y + d + 284 * s;
  const sw = Math.sin(T * 5.1) * kick, sw2 = Math.cos(T * 4.3) * kick;
  return {
    look, t: T, x: H.x, y: pelvisY + 165 * s, z: -0.3, yaw, drop: 0, lean: -4,
    roll, rollPivot: H, shadow: false,
    armL: {hand: {x: H.x - 12, y: H.y + d, z: -14}, pole: {x: 0.3, y: 0, z: 1}},
    armR: {hand: {x: H.x + 14, y: H.y + d, z: 16}, pole: {x: -0.3, y: 0, z: 1}},
    handL: 'fist', handR: 'fist',
    legL: {foot: {x: H.x + 20 + 30 * sw, y: pelvisY + 155 - 30 * Math.abs(sw), z: -10}},
    legR: {foot: {x: H.x - 26 - 26 * sw2, y: pelvisY + 150 - 30 * Math.abs(sw2), z: 18}},
    head: {pitch: -26},
    ...over,
  };
};

/**
 * Lying face-down along the slope at surface point S (pelvis above it), head toward the west (down-slope): the
 * Director reaching over the lip. Arm targets are world points.
 */
export const proneDown = (look: Look, T: number, S: V2, slopeDeg: number, hands: {L?: V3; R?: V3}, over: Partial<ActorProps> & {seed: number}): ActorProps => {
  const n = normalOf(slopeDeg);
  const P = {x: S.x + n.x * 44, y: S.y + n.y * 44};
  const roll = -90 - slopeDeg;
  const u = (q?: V3) => (q ? unroll(q, P, roll) : undefined);
  return {
    look, t: T, x: P.x, y: P.y + 165, z: 0.4, yaw: -90, roll, rollPivot: P, shadow: false, drop: 0, lean: 0,
    armL: hands.L ? {hand: u(hands.L), pole: {x: 0, y: 0, z: 1}} : {fk: {fwd: 150, out: 10, bend: 20}},
    armR: hands.R ? {hand: u(hands.R), pole: {x: 0, y: 0, z: 1}} : {fk: {fwd: 150, out: 10, bend: 20}},
    legL: {foot: {x: P.x - 14, y: P.y + 155, z: -14}, pitch: 30}, legR: {foot: {x: P.x + 16, y: P.y + 158, z: 14}, pitch: 30},
    head: {pitch: -34},
    ...over,
  };
};
export {clamp, lerp, BEAT};
