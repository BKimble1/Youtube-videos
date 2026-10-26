// V3 beat G (25.61-28.94): an ordinary metal rod. One cut (25.61) to a house in the same night storm, wide enough for
// the house, its rod and the whole visible down-conductor down to the earth clamp. The distant strike (25.74) is far
// beyond the ridges on the right; its flash lights the whole run of metal at once (earth clamp, conductor, rod, tip),
// and that even sheen fades as one smooth push rises along the conductor and closes in on the rod, finishing on
// "metal TIP" (27.89-28.49) with the tip at screen (540, 820), pointing straight up, at the scale and line weight of
// H's tower rod. It holds there to the match cut at 28.94, still alive: rain keeps falling round the rod (only the
// point itself is kept clear), the cloud deck keeps drifting, and the far flicker (28.25) lights the clouds on the
// right, glints on the tip and gives the rod a faint sheen. Nothing marks a protected zone. Camera, timing and
// light: Rod3_cam.ts.
import React from 'react';
import {clamp} from '../dc/math';
import {catchK, cloudDrift, facadeScale, flickerK, flickSheen, pushK, rodCam, strikeK, tipGlint} from './Rod3_cam';
import {House} from './Rod3_house';
import {RodRain, RodSky} from './Rod3_sky';

export const RodG: React.FC<{t: number}> = ({t}) => {
  const cam = rodCam(t);
  const strike = strikeK(t);
  const flash = clamp(strike);
  const fk = flickerK(t);
  const sc = facadeScale(cam);
  const k = pushK(t);
  // the rain is held back only round the tip's point (it follows the tip on screen), so the endpoint reads while the
  // rain keeps falling round the rod
  const quiet = {x: 540, y: 620 + 200 * k, r: 60 + 30 * k};
  // gradient ids unique per frame (contact sheets put several frames in one document)
  const id = `g${Math.round(t * 300)}`;
  return (
    <g>
      <RodSky cam={cam} flash={0.35 * flash + 0.15 * fk} strike={strike} glow={strike + 0.25 * fk} flicker={1.4 * fk} drift={cloudDrift(t)} id={id} />
      <RodRain cam={cam} rainT={t + 40} front={false} flash={flash} quiet={quiet} />
      <House cam={cam} light={{flash: 0.5 * flash, glare: strike, catch: Math.max(catchK(t), 0.5 * flickSheen(t)), tip: tipGlint(t)}} id={`${id}h`} />
      <RodRain cam={cam} rainT={t + 40} front flash={flash} quiet={quiet} k={Math.max(0.5, clamp(1.2 - sc / 260))} />
    </g>
  );
};
