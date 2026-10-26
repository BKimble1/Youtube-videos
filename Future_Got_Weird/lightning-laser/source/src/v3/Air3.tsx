// V3 beat B (4.31-7.81): why ordinary air resists. "You see, air normally RESISTS / the flow of electricity."
//   4.31        exactly A's view: View3 with openCam(t) and openSt(t) (the guided channel still glowing, fading)
//   4.31-4.52   the upper channel and its branches cool away first; the guided channel round the streamer's root stays
//               faintly lit (white core, violet edge); a violet corona fizzes on its right side (4.36) and the camera
//               starts to push toward it; the laser line and its packets quieten
//   4.52-4.85   a side streamer jabs out of that lit channel into the ordinary air beside it (snap 4.52; the channel
//               flickers as the streamer draws on it), steps up-right (zaps 4.55, 4.73) and stalls (sizzle 4.85); the
//               camera follows its tip while the channel's root fades out behind it (gone by 4.8)
//   4.97-5.17   once the macro view holds only air round the tip, a zoom-dissolve about the tip's screen point into the
//               molecular view (the swell 5.0-5.5 is it settling; "air" 5.01)
//   5.2-7.81    one microscopic explanation: the stalled tip among a few neutral N2 / O2 molecules; on each attempt
//               (5.6, 6.35, 7.05) it re-brightens, pushes a step or two up-right and stalls; the bound electrons of the
//               molecules round it are pulled off toward it on a stretched tether, held, and snap back onto their
//               molecules as it gives up; the last attempt fades out (hard cut to C at 7.81)
// Files: Air3_cam (camera, zoom, streamer geometry), Air3_view (the site view), Air3_leader (the streamer and its
// attempts), Air3_micro (the molecules and the tug).
import React from 'react';
import {clamp, fmt} from '../dc/math';
import {ss} from '../lib';
import {axis3, Cam3, projector} from '../v2/p3';
import {openSt} from './states3';
import {ViewB} from './Air3_view';
import {Discharge3D} from './Scene3';
import {airCam, ROOT3, ROOT_H, T0} from './Air3_cam';
import {Leader3, leaderLight} from './Air3_leader';
import {MicroAir3, MicroTug3} from './Air3_micro';

/** the molecular layer's opacity: the dissolve starts once the channel, bolt and tower are out of frame (4.96) */
export const microAlpha = (t: number) => ss(t, 4.97, 5.17);

const spike = (t: number, t0: number, tau: number) => (t >= t0 ? Math.exp(-(t - t0) / tau) : 0);
/** the opening discharge during the push. At T0 it is A's discharge exactly (up = 1, core = openSt core, root = 1).
 *  up: the upper channel and branches (fade first, by the snap); core: the guided channel round the streamer's root
 *  is held faintly lit (a white core with violet edges, ~0.32) and flickers up on the snap and zaps, as the streamer
 *  draws on it; root: that remaining glow fades out once the streamer has stepped away (whole-layer opacity, so it
 *  keeps its white / violet balance while it goes) */
const boltB = (t: number) => {
  const c0 = openSt(t).core;
  const feed = 0.3 * spike(t, 4.515, 0.08) + 0.12 * spike(t, 4.55, 0.06) + 0.08 * spike(t, 4.725, 0.06);
  return {up: 1 - ss(t, T0, 4.52), core: c0 + (0.32 - c0) * ss(t, T0, 4.45) + feed, root: 1 - ss(t, 4.58, 4.8)};
};
/** A's discharge (Discharge3D on the same bolt) seen through a mask: everywhere at `up`, round the root's screen point
 *  at full; screen-blended like the original. Drawn right after ViewB with dk = 0, which is View3's own discharge slot
 *  (View3 draws only its children and the bracket after the discharge, and openSt has neither) */
const BoltB: React.FC<{cam: Cam3; s: number; b: ReturnType<typeof boltB>; tag: string}> = ({cam, s, b, tag}) => {
  if (b.root <= 0.003) return null;
  const P = projector(cam);
  const r = P(ROOT3), e = P(axis3(ROOT_H + 130));
  const R = Math.max(60, Math.hypot(e.x - r.x, e.y - r.y));
  const id = `${tag}-bk`;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" cx={fmt(r.x)} cy={fmt(r.y)} r={fmt(R)}>
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-400} y={-400} width={1880} height={2720}>
          {b.up > 0.003 && <rect x={-400} y={-400} width={1880} height={2720} fill="#FFFFFF" opacity={fmt(b.up)} />}
          <rect x={-400} y={-400} width={1880} height={2720} fill={`url(#${id}-g)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-m)`} opacity={fmt(b.root)} style={{mixBlendMode: 'screen'}}>
        <Discharge3D cam={cam} s={s} core={b.core} id={`${tag}-dc`} />
      </g>
    </g>
  );
};

export const AirB: React.FC<{t: number}> = ({t}) => {
  const ac = airCam(t);
  const am = microAlpha(t);
  const frame = Math.round(t * 30);
  const lt = leaderLight(t);
  const st0 = openSt(t);
  // the laser line and its packets quieten as the streamer takes over (unchanged at T0, so frame 130 still matches A)
  const st = {...st0, beam: st0.beam * (1 - 0.42 * ss(t, 4.36, 4.56))};
  const b = boltB(t);
  const plain = b.up >= 0.999 && Math.abs(b.core - st0.core) < 1e-3;
  const tag = `b${frame}`;
  return (
    <g>
      {am < 1 && <ViewB cam={ac.cam} st={st} t={t} tag={tag} dk={plain ? 1 : 0} rain={1 - 0.85 * ss(ac.L, 0.3, 1.4)} />}
      {am < 1 && !plain && <BoltB cam={ac.cam} s={st.s} b={b} tag={tag} />}
      {/* as the lens closes on the tip, the storm behind it recedes (less competing cloud texture; it also meets the
          molecular view's darker backdrop) */}
      {am < 1 && ac.L > 0.9 && <rect x={0} y={0} width={1080} height={1920} fill="#0E1724" opacity={0.5 * ss(ac.L, 0.9, 2.3)} />}
      {am > 0 && <MicroAir3 t={t} tip={ac.tip} m={ac.m} alpha={am} glow={clamp(lt.tip)} />}
      {t > T0 + 1e-4 && <Leader3 t={t} ac={ac} />}
      {/* the pulled electrons again, above the leader's glow */}
      {am > 0 && <MicroTug3 t={t} tip={ac.tip} m={ac.m} alpha={am} glow={clamp(lt.tip)} />}
    </g>
  );
};
