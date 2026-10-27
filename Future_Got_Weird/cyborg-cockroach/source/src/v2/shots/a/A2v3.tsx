// A2 (42-66, no words): the match cut from A1's last frame. A1 ends on the backpack board's receiver LED blinking at
// A1_LED_END; A2 opens tight on the operator's research remote with its red FIRE button on that exact screen spot, his
// gloved thumb hovering just off it. The thumb gathers, comes down onto the cap and drives it into its guard (contact
// A2_CONTACT, bottoming out with the click at A2_PRESS, frame 48), the remote's status LED turns from green (armed) to
// amber (fired); hand and remote give a little with the press. The press sets the camera off: it eases back along the
// remote (A2_BACK0..A2_BACK1), revealing the whole remote, the gloved hand holding it and the white coat sleeve. The
// thumb lets the cap spring back up (A2_RELEASE) and rests just above it, as A3 picks him up.
import React from 'react';
import {clamp, keys, sr, noise1, lerp} from '../../../lib/ease';
import {RemoteCloseUp, remoteCloseUpGeometry, RemoteCloseUpProps} from '../../../crew/operator';
import {ShotProps} from '../index2';
import {A1_LED_END} from '../h/A1';
import {SoftLab} from './A2';
import {shotRange} from '../../cuts2';

const R = shotRange('A2');
const T0 = R.from / 30;
const T1 = R.to / 30;
/** the thumb pad meets the cap; the cap bottoms out in its guard (the click); the LED turns amber */
export const A2_CONTACT = 1.555;
export const A2_PRESS = 1.6;
export const A2_LED = 1.607;
/** the thumb lets the cap come back up (it springs up under the rising pad) */
export const A2_RELEASE = 1.9;
/** the camera eases back along the remote, set off by the press */
export const A2_BACK0 = A2_PRESS - 0.02;
export const A2_BACK1 = T1 - 0.05;

const S0 = 1.6;
const S1 = 0.94;
const ROT0 = -4;
/** where the cap sits on screen at the end of the move */
const END = {x: 610, y: 690};

const pressAt = (t: number) => (t < A2_CONTACT ? 0 : t < A2_PRESS ? Math.pow((t - A2_CONTACT) / (A2_PRESS - A2_CONTACT), 1.6) : 1);
const liftAt = (t: number) => keys(t, [[T0, 0.5], [1.47, 0.6], [A2_CONTACT, 0], [A2_RELEASE, 0], [A2_RELEASE + 0.22, 0.55]]);
/** the hand's held, living drift (no shake): a slow sway, and a small dip of hand and remote as the thumb drives home */
const sway = (t: number) => {
  const dt = t - A2_PRESS;
  const dip = dt < 0 ? Math.max(0, 1 - (A2_PRESS - t) / 0.05) * 0.5 : Math.exp(-dt / 0.12) * Math.cos(dt * 18);
  return {x: 2.4 * noise1(t * 0.8, 3), y: 2 * noise1(t * 0.7, 7) + 6 * Math.max(0, dip), rot: 0.5 * noise1(t * 0.55, 11) + 0.5 * Math.max(0, dip)};
};
/** the camera: scale and the cap's screen point (the match point at the start, held until the press) */
const camA2 = (t: number) => {
  const u = sr(t, A2_BACK0, A2_BACK1);
  return {scale: lerp(S0, S1, u), bx: lerp(A1_LED_END.x, END.x, u), by: lerp(A1_LED_END.y, END.y, u)};
};

export const a2Props = (t: number): RemoteCloseUpProps => {
  const c = camA2(t);
  const sw = sway(t);
  const press = clamp(pressAt(t));
  const lift = liftAt(t);
  // the cap's screen point for this scale (the drift is on top; on the first frame it is pinned to the match point)
  const g0 = remoteCloseUpGeometry({x: 0, y: 0, scale: c.scale, rotation: ROT0, press, lift});
  const k = sr(t, T0, T0 + 0.25);
  return {
    press,
    lift,
    led: clamp((t - A2_LED) / 0.04),
    x: c.bx - g0.button.x + sw.x * k,
    y: c.by - g0.button.y + sw.y * k,
    scale: c.scale,
    rotation: ROT0 + sw.rot * k,
  };
};

export const A2Scene: React.FC<{t: number; id: string}> = ({t, id}) => {
  const p = a2Props(t);
  const c = camA2(t);
  // the soft lab behind moves less than the hand (far away), and widens a little as the camera backs off
  const bg = {dx: -(c.bx - 640) * 0.22, dy: -(c.by - 900) * 0.22, z: 1 + (c.scale - S1) * 0.25};
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <SoftLab id={`${id}l`} {...bg} />
      <RemoteCloseUp id={`${id}cu`} {...p} />
    </svg>
  );
};

export const A2: React.FC<ShotProps> = ({f}) => <A2Scene t={f / 30} id={`a2f${f}`} />;
