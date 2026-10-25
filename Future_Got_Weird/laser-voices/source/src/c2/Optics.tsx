// "Now sweeping that beam at exactly the right speed": a whip from her ear back up the beam to the emitter, whose hood
// swings open on the optical train (diode, collimating lens, the modulator fed with the voice, the spinning wedge
// prism); on "sweeping" the operator turns the dial, the prism spins up and the beam leaving the lens sweeps.
import React from 'react';
import {lerpCam, lookAt} from './rig/draw';
import {v3} from './rig/geo';
import {RoomScene} from './Scene';
import {beamEnd, cast, earAndHead} from './story';
import {basis} from './rig/geo';
import {depth} from './art/d3';
import {BeamSort} from './Scene';
import {camAt} from './shots';
import {ss, ss5} from './lib';
import {EAR0} from './world';
import {beamSortOf, beamVis, sweepAt} from './Film';

export const T_OPT = 15.0;
/** prism angle (rad): spins up on "sweeping" */
export const spinAt = (t: number) => {
  const t0 = 15.5;
  if (t < t0) return 0;
  const w = 26; // rad/s at speed
  const ramp = 0.5;
  const tt = t - t0;
  return tt < ramp ? (w * tt * tt) / (2 * ramp) : w * (tt - ramp / 2);
};
export const Optics: React.FC<{t: number}> = ({t}) => {
  // the whip: 0.32 s from beside her ear, looking back up the beam, to the emitter
  const from = lookAt(v3(EAR0.x - 0.35, 1.45, EAR0.z - 0.4), v3(EAR0.x - 1.6, 1.38, EAR0.z), 1400);
  const k = ss5(t, T_OPT, T_OPT + 0.32);
  const cam = k < 1 ? lerpCam(from, camAt(T_OPT + 0.32, 'optics'), k) : camAt(t, 'optics');
  const be = beamEnd(t);
  return (
    <RoomScene
      t={t}
      cam={cam}
      actors={cast(t)}
      beamSort={beamSortOf(t, cam, be.blocked)}
      beam={{vis: beamVis(t), end: be.end, sweep: sweepAt(t)}}
      dial={-40 * ss(t, 15.5, 17.4)}
      open={ss(t, 15.15, 15.6) * (1 - ss(t, 17.15, 17.65))}
      spin={spinAt(t)}
    />
  );
};
