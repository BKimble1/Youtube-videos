// D1 (466-489, "Once it lines up,"): profile, a touch from behind the target's face (az -8, el 9). The medic walks in
// from the left toward the silicone target at right, decelerates and stops with all six feet planted (16.0 s), the
// body settles a little forward and down on its legs, then it turns a few degrees on its planted feet to square up to
// the target (the approach came in 5 degrees off its axis), while both antennae reach forward and feel the face
// (they flex along the silicone, tapping alternately). The coil starts to warm in the last frames (the release is on
// the first frames of D2). One slow push in toward the head and the target.
import React from 'react';
import {sr} from '../../../lib/ease';
import {Roach2D} from '../../roach/Roach2D';
import {Gear2D} from '../../roach/Gear2D';
import {viewAt, View} from '../../roach/ortho';
import {Target2D} from '../../sets/Lab2';
import {ShotProps} from '../index2';
import {shotRange} from '../../cuts2';
import {dPoseFull, dGear, D_FACE} from './trial';
import {LabRoomMM} from './room';

const R = shotRange('D1');
export const D1_AZ = -8, D1_EL = 9;
export const d1View = (f: number): View => {
  const u = sr(f, R.from - 4, R.to + 2);
  return viewAt(D1_AZ, D1_EL, 8.3 + 0.9 * u, [13 + 7 * u, 14, 0], 540, 1000);
};

export const D1: React.FC<ShotProps> = ({f}) => {
  const t = f / 30;
  const v = d1View(f);
  const pose = dPoseFull(t);
  const g = dGear(t);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <LabRoomMM id="d1room" v={v} blur={4} tray={[-400, 400, -200, 420]} />
      <Target2D id="d1t" v={v} face={D_FACE} dir={1} />
      <Roach2D pose={pose} v={v} o={{id: 'd1r', gear: <Gear2D id="d1g" v={v} f={pose.frame} g={g} />}} />
    </svg>
  );
};
