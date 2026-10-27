// Group A timing and the A2 -> A3 match-cut contract (every value read from here by the shots and the cues).
import {clamp, keys, sr, noise1} from '../../../lib/ease';
import {remoteCloseUpGeometry, RemoteCloseUpProps} from '../../../crew/operator';
import {shotRange} from '../../cuts2';

export const FPS_A = 30;
export const A2R = shotRange('A2');
export const A3R = shotRange('A3');
export const A4R = shotRange('A4');
export const C4R = shotRange('C4');

// ------------------------------------------------------------------ A2: the thumb comes down and presses
/** the thumb pad meets the raised cap */
export const A2_CONTACT = 2.29;
/** the cap bottoms out in its guard (the click), on "person" */
export const A2_PRESS = 2.35;
/** the remote's status LED turns from green (armed) to amber (fired) */
export const A2_LED = 2.36;
/** the end of A2 (the cut to the backpack's LED) */
export const A2_END = A3R.from / FPS_A;

/** where the pressed button's cap sits on screen on A2's last frame (and where A3's LED opens): centre + radius */
export const MATCH = {x: 540, y: 1010};
/** the thumb covers the cap's lower-left; the red that shows is centred a little up and right of the cap centre:
 *  A3's LED lens opens there */
export const MATCH_LED = {x: MATCH.x + 22, y: MATCH.y - 12};

const pressAt = (t: number) => {
  // the pad travels down with the cap, accelerating (a firm press), then a small squeeze once it bottoms out
  const p = t < A2_CONTACT ? 0 : t < A2_PRESS ? Math.pow((t - A2_CONTACT) / (A2_PRESS - A2_CONTACT), 1.6) : 1;
  return clamp(p);
};
const liftAt = (t: number) =>
  // hovering just above the cap, a small gathering rise, then down onto it
  keys(t, [[1.83, 0.42], [1.98, 0.5], [A2_CONTACT, 0]]);

/** the hand's held, living drift (no shake): slow sway, and a small dip of hand and remote as the thumb drives home */
const sway = (t: number) => {
  const dt = t - A2_PRESS;
  const dip = dt < 0 ? Math.max(0, 1 - (A2_PRESS - t) / 0.06) * 0.5 : Math.exp(-dt / 0.12) * Math.cos(dt * 18);
  return {x: 3.2 * noise1(t * 0.8, 3), y: 2.6 * noise1(t * 0.7, 7) + 7 * Math.max(0, dip), rot: 0.7 * noise1(t * 0.55, 11) + 0.6 * Math.max(0, dip)};
};

/** the push toward the button through the shot: the scale and where the cap's centre travels on screen */
const camA2 = (t: number) => {
  const u = sr(t, A2R.from / FPS_A, A2_END - 0.12);
  return {scale: 1.25 + 0.3 * u, bx: 640 + (MATCH.x - 640) * u, by: 930 + (MATCH.y - 930) * u};
};
const ROT0 = -4;

/** RemoteCloseUp props at time t (the cap's screen position is pinned by the push; the drift is added on top) */
export const a2Props = (t: number): RemoteCloseUpProps => {
  const c = camA2(t);
  const sw = sway(t);
  const rotation = ROT0 + sw.rot;
  // the cap centre (fully pressed) relative to the remote's anchor for this scale and rotation
  const g0 = remoteCloseUpGeometry({x: 0, y: 0, scale: c.scale, rotation: ROT0, press: 1});
  const settleEnd = 1 - sr(t, A2_END - 0.3, A2_END); // the drift dies away into the cut, so the cap lands on MATCH
  return {
    press: pressAt(t),
    lift: liftAt(t),
    led: clamp((t - A2_LED) / 0.05),
    x: c.bx - g0.button.x + sw.x * settleEnd,
    y: c.by - g0.button.y + sw.y * settleEnd,
    scale: c.scale,
    rotation: ROT0 + (rotation - ROT0) * settleEnd,
  };
};
/** the cap's on-screen radius (px, across) on A2's last frame: A3's LED lens opens at this size */
export const matchRadius = () => {
  const g = remoteCloseUpGeometry(a2Props(A2_END - 1 / FPS_A));
  return 7.4 * g.k;
};
export const a2Background = (t: number) => {
  const c = camA2(t);
  return {dx: -(c.bx - 640) * 0.25, dy: -(c.by - 930) * 0.25, z: 1 + (c.scale - 1.25) * 0.3};
};
