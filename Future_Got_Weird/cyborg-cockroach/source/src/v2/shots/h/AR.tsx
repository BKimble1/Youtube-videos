// AR (5-10, V4): the cause, cut on the action. A0 holds tight on the launcher with its coil glowing; AR cuts to the
// operator's gloved thumb on the remote's red FIRE button, the button sitting on the very screen spot where the coil
// glowed (a graphic match), and drives it home (contact 0.20 s, bottomed out at A1_PRESS, the LED turns amber); the
// hand gives a little with the press and the camera eases in a touch with it. A1 cuts back on the line parting.
import React from 'react';
import {clamp, noise1, sr} from '../../../lib/ease';
import {toW} from '../../../lib/v3';
import {PACK} from '../../../rig/gear';
import {RemoteCloseUp, remoteCloseUpGeometry} from '../../../crew/operator';
import {P} from '../../roach/ortho';
import {SoftLab} from '../a/A2';
import {a1Pose, a1View, A1_PRESS} from './A1';
import {ShotProps} from '../index2';

const CONTACT = 0.195;
/** the coil's screen point in A0 (where the button opens) */
export const AR_MATCH = (() => {
  const T = PACK.tube;
  const q = P(a1View(5 / 30), toW(a1Pose(5 / 30).frame, [T.b[0] - 0.4, T.a[1] + T.r * 0.55, 0]));
  return {x: q[0], y: q[1]};
})();

export const ARScene: React.FC<{t: number; id: string}> = ({t, id}) => {
  const press = t < CONTACT ? 0 : clamp(Math.pow((t - CONTACT) / (A1_PRESS - CONTACT), 1.5));
  const dt = t - A1_PRESS;
  const dip = dt < 0 ? 0 : Math.exp(-dt / 0.1) * Math.cos(dt * 20);
  const scale = 1.75 + 0.08 * sr(t, CONTACT, 0.36);
  const rot = -6 + 0.4 * noise1(t * 0.6, 3) + 0.6 * Math.max(0, dip);
  const g0 = remoteCloseUpGeometry({x: 0, y: 0, scale, rotation: rot, press, lift: 0});
  const x = AR_MATCH.x - g0.button.x + 1.5 * noise1(t * 0.8, 5);
  const y = AR_MATCH.y - g0.button.y + 7 * Math.max(0, dip);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <SoftLab id={`${id}l`} dx={-(AR_MATCH.x - 640) * 0.2} dy={-(AR_MATCH.y - 900) * 0.2} z={1.1} />
      <RemoteCloseUp id={`${id}cu`} press={press} lift={0} led={clamp((t - A1_PRESS - 0.01) / 0.04)} x={x} y={y} scale={scale} rotation={rot} />
    </svg>
  );
};
export const AR: React.FC<ShotProps> = ({f}) => <ARScene t={f / 30} id={`arf${f}`} />;
