// D1 (466-487, "Once it lines up,"): a low side view at insect height, a little from the target's side (az -16, el 5):
// after C5's overhead, the medic takes its last steps toward the clear target at right, decelerates and stops with all
// six feet planted (15.88 s), settles forward and down on its legs, turns a few degrees on its planted feet to square
// up to the target (the approach came in 7 degrees off its axis), while both antennae reach forward and feel the face
// (they flex along the silicone, tapping alternately). Lined up, the board's LED comes on and the coil warms faintly
// (16.14 s). The camera trucks with the insect's last steps and stops with it.
import React from 'react';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View} from '../../roach/ortho';
import {Target2D} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {dPoseFull, dGear, D_FACE} from './trial';
import {LabRoomMM} from './room';

export const D1_AZ = -16, D1_EL = 5;
/** the camera follows the body's x (the walk decelerates into the stop, so the truck does too) */
export const d1View = (f: number): View => {
  const bx = dPoseFull(f / 30, false).frame.o[0];
  return viewAt(D1_AZ, D1_EL, 10.6, [24 + 0.8 * bx, 14, 0], 540, 1080);
};

export const D1: React.FC<ShotProps> = ({f}) => {
  const t = f / 30;
  const v = d1View(f);
  const pose = dPoseFull(t);
  const g = dGear(t);
  const id = `d1f${f}`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <LabRoomMM id={`${id}room`} v={v} blur={5} tray={[-400, 400, -200, 420]} props={false} />
      <Target2D id={`${id}t`} v={v} face={D_FACE} dir={1} />
      <Roach2D pose={pose} v={v} o={{id: `${id}r`, gear: <Gear2D id={`${id}g`} v={v} f={pose.frame} g={g} />}} />
    </svg>
  );
};
