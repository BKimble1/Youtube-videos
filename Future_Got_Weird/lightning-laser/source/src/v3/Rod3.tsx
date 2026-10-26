// V3 beat G (25.61-28.94): an ordinary metal rod. One cut (25.61) to a house in the same night storm, wide enough for
// the house, its rod and the whole visible down-conductor down to the earth clamp. The distant strike (25.74) is far
// beyond the ridges on the right; its flash catches the copper conductor along its whole length. As the flash fades,
// the lit sky's sheen slides up the metal (clamp, wall corner, roof edge, mast) while one smooth push rises and closes
// in on the rod, finishing on "metal TIP" (27.89-28.49) with the tip at screen (540, 820), pointing straight up, at the
// scale and line weight of H's tower rod; it holds there (rain and cloud still moving, the far flicker at 28.25 glinting
// on the tip) to the match cut at 28.94. Nothing marks a protected zone. Camera, timing and light: Rod3_cam.ts.
import React from 'react';
import {clamp} from '../dc/math';
import {facadeScale, flickerK, pushK, rodCam, sheenK, sheenL, strikeK, tipGlint} from './Rod3_cam';
import {House} from './Rod3_house';
import {RodRain, RodSky} from './Rod3_sky';

export const RodG: React.FC<{t: number}> = ({t}) => {
  const cam = rodCam(t);
  const strike = strikeK(t);
  const flash = clamp(strike);
  const sc = facadeScale(cam);
  const k = pushK(t);
  // near the end the rain is held back round the tip, so the endpoint reads
  const quiet = {x: 540, y: 820 + 140 * (1 - k), r: 60 + 140 * k};
  const drift = (t - 27.3) * 1.6;
  // gradient ids unique per frame (contact sheets put several frames in one document)
  const id = `g${Math.round(t * 300)}`;
  return (
    <g>
      <RodSky cam={cam} flash={0.35 * flash + 0.12 * flickerK(t)} strike={strike} glow={strike + 0.25 * flickerK(t)} drift={drift} id={id} />
      <RodRain cam={cam} rainT={t + 40} front={false} flash={flash} quiet={quiet} />
      <House cam={cam} light={{flash: 0.5 * flash, catch: strike, sheenL: sheenL(t), sheen: sheenK(t), tip: tipGlint(t)}} id={`${id}h`} />
      <RodRain cam={cam} rainT={t + 40} front flash={flash} quiet={quiet} k={clamp(1.2 - sc / 260)} />
    </g>
  );
};
