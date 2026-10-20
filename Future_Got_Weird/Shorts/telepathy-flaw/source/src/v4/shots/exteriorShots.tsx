// Exterior shots: the wide, her reaction to the silent greeting, his pleased reverse.
import React from 'react';
import {Shot, ShotId, W} from '../plan4';
import {ExteriorWorld, ES, solveExterior} from '../world/exterior';
import {MsgChip, popScale} from '../ui4';
import {Cam} from '../../lib/camera';
import {clamp, easeInOut, lerp} from '../../lib/math';

export const exteriorCam = (id: ShotId, t: number, shot: {a: number; b: number}): Cam => {
  const k = easeInOut(clamp((t - shot.a) / (shot.b - shot.a)));
  const s0 = solveExterior(t);
  if (id === 'extWide') return {x: 540, y: lerp(990, 960, k), z: lerp(1.12, 1.22, k)};
  if (id === 'recvHey') return {x: s0.wHead.x + lerp(40, 60, k), y: s0.wHead.y + 22, z: lerp(2.5, 2.7, k)};
  return {x: s0.mHead.x - lerp(40, 20, k), y: s0.mHead.y + 48, z: lerp(2.5, 2.65, k)};
};

export const exteriorShot = (id: ShotId, t: number, f: number, lt: number, shot: Shot): React.ReactNode => {
  const cam = exteriorCam(id, t, shot);
  const hey = popScale(t, 2.02, 0.22);
  const heyFade = 1 - clamp((t - 3.05) / 0.25);
  return (
    <ExteriorWorld
      t={t}
      f={f}
      cam={cam}
      extra={(s) => <MsgChip x={s.wHead.x + 96 * ES * 0.7} y={s.wHead.y - 96 * ES * 1.0} s={ES * (id === 'extWide' ? 1.5 : 1.3)} text="Hey" k={hey} alpha={id === 'sendSmile' ? 0 : heyFade} tailDir={-1} />}
    />
  );
};
