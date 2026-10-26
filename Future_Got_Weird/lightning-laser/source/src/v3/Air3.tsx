// V3 beat B (4.31-7.81): why ordinary air resists. "You see, air normally RESISTS / the flow of electricity."
//   4.31        exactly A's view: View3 with openCam(t) and openSt(t) (the guided channel still glowing, fading)
//   4.36-4.52   a violet corona fizzes on the channel's right side; the camera starts to push toward it
//   4.52-4.85   a side streamer jabs out of the channel into the ordinary air beside it (snap 4.52), steps up-right
//               (zaps 4.55, 4.73) and stalls (sizzle 4.85); the camera follows its tip
//   4.97-5.17   once the macro view holds only air round the tip, a zoom-dissolve about the tip's screen point into the
//               molecular view (the swell 5.0-5.5 is it settling; "air" 5.01)
//   5.2-7.81    one microscopic explanation: the stalled tip in a small group of neutral N2 / O2 molecules; on each
//               attempt (5.6, 6.35, 7.05) it re-brightens, pushes a step or two up-right and stalls; nearby bound
//               electrons tug toward it and snap back; the last attempt fades out (hard cut to C at 7.81)
// Files: Air3_cam (camera, zoom, streamer geometry), Air3_view (the site view), Air3_leader (the streamer and its
// attempts), Air3_micro (the molecules).
import React from 'react';
import {clamp} from '../dc/math';
import {ss} from '../lib';
import {openSt} from './states3';
import {airCam, T0} from './Air3_cam';
import {ViewB} from './Air3_view';
import {Leader3, leaderLight} from './Air3_leader';
import {MicroAir3} from './Air3_micro';

/** the molecular layer's opacity: the dissolve starts once the channel, bolt and tower are out of frame (4.96) */
export const microAlpha = (t: number) => ss(t, 4.97, 5.17);

export const AirB: React.FC<{t: number}> = ({t}) => {
  const ac = airCam(t);
  const am = microAlpha(t);
  const frame = Math.round(t * 30);
  const lt = leaderLight(t);
  return (
    <g>
      {am < 1 && <ViewB cam={ac.cam} st={openSt(t)} t={t} tag={`b${frame}`} dk={1 - ss(t, 4.45, 4.75)} rain={1 - 0.85 * ss(ac.L, 0.3, 1.4)} />}
      {/* as the lens closes on the tip, the storm behind it recedes (less competing cloud texture; it also meets the
          molecular view's darker backdrop) */}
      {am < 1 && ac.L > 0.9 && <rect x={0} y={0} width={1080} height={1920} fill="#0E1724" opacity={0.5 * ss(ac.L, 0.9, 2.3)} />}
      {am > 0 && <MicroAir3 t={t} tip={ac.tip} m={ac.m} alpha={am} glow={clamp(lt.tip)} />}
      {t > T0 + 1e-4 && <Leader3 t={t} ac={ac} />}
    </g>
  );
};
