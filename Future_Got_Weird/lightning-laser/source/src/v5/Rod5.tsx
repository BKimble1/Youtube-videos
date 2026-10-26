// V5 beat G (25.61-28.94): a normal lightning rod, doing its job. Two setups at the house (V3's house, storm, rain):
//   G1 25.61-26.64  the wide, from the far side of the garden: the stepped leader comes down out of the deck all the
//                   way to the rod, the return stroke lights the channel from the cloud to the metal tip (on the
//                   distant crack, 25.74), the current runs down the conductor to the earth clamp; the glow fades
//                   through the thunder (26.2)
//   G2 26.64-28.94  one cut in (caption "only reaches as high"): the camera, already moving, rises along the conductor
//                   and closes in on the rod, settled at 28.45 with the tip at (540, 820); the far flicker (28.25)
//                   glints on the tip. Nothing marks a protected zone.
// Cameras, timing and light: Rod5_cam.ts; the bolt and the current: Rod5_bolt.tsx.
import React from 'react';
import {clamp, fmt} from '../dc/math';
import {facadeScale, hw, TIP_W} from '../v3/Rod3_cam';
import {House} from '../v3/Rod3_house';
import {FarGlow, FLICK_AT, RodRain} from '../v3/Rod3_sky';
import {Clouds, Ranges, SkyGrad} from '../v3/Scene3_sky';
import {projector} from '../v2/p3';
import {channelHold, flicker5, G_CUT, groundK, JUNCTION, pushK5, rodCam5, sceneFlash, strokeK5} from './Rod5_cam';
import {ConductorCurrent5, STRIKE_TOP_W, StrikeBolt5} from './Rod5_bolt';
import {EV} from '../v3/timeline3';
import {sm5} from '../camera';

/** the cloud deck's drift clock: a steady drift (V3's slow drift, a little quicker once G2 has settled) */
export const drift5 = (t: number) => {
  const a = 28.2, b = 28.6, x = clamp((t - a) / (b - a));
  return (t - 27.3) * 1.6 + 2.4 * ((b - a) * (x ** 3 - x ** 4 / 2) + Math.max(0, t - b));
};
/** the far flicker's light held on the metal at the end (V3's flickSheen, on V5's flicker) */
const flickSheen5 = (t: number) => {
  const b = EV.farFlicker;
  if (t < b - 0.025) return 0;
  if (t < b) return (t - b + 0.025) / 0.025;
  return (1 - sm5(clamp((t - b - 0.12) / 0.45))) * (0.7 + 0.3 * clamp(flicker5(t) / 0.3));
};

export const RodG5: React.FC<{t: number}> = ({t}) => {
  const cam = rodCam5(t);
  const id = `g5${Math.round(t * 300)}`;
  const P = projector(cam);
  const wide = t < G_CUT;
  const fl = wide ? sceneFlash(t) : 0;
  const sk = wide ? strokeK5(t) : 0;
  const hold = wide ? channelHold(t) : 0;
  const fk = flicker5(t);
  const sc = facadeScale(cam);
  const k = wide ? 0 : pushK5(t);
  const tipS = P(TIP_W);
  const gnd = P(hw(0, 0.02, -0.2));
  // rain is held back round the tip's point at the end (it follows the tip on screen), so the endpoint reads
  const quiet = wide ? {x: tipS.x, y: tipS.y - 30, r: 40} : {x: 540, y: 620 + 200 * k, r: 60 + 30 * k};
  // the deck lit where the leader leaves it (local, round the channel's top), and the general lift of the sky
  const deckLit = wide ? clamp(1.1 * sk + 0.35 * hold + (t < JUNCTION ? 0.25 : 0)) : 0;
  return (
    <g>
      <SkyGrad cam={cam} flash={0.45 * fl + 0.15 * fk} id={`${id}-sky`} />
      <Clouds cam={cam} P={P} flash={0.5 * fl + 0.15 * fk} s={0} drift={drift5(t)} id={`${id}-cl`} />
      <FarGlow cam={cam} k={deckLit} id={`${id}-sg`} at={STRIKE_TOP_W} size={0.8} />
      <FarGlow cam={cam} k={1.4 * fk} id={`${id}-fl`} at={FLICK_AT} size={0.55} />
      <Ranges cam={cam} P={P} flash={0.5 * fl} />
      <RodRain cam={cam} rainT={t + 40} front={false} flash={fl} quiet={quiet} />
      <House
        cam={cam}
        light={{flash: clamp(0.75 * fl + 0.2 * groundK(t)), glare: 0, catch: wide ? 0 : 0.5 * flickSheen5(t), tip: clamp((wide ? 0.6 * sk : 0) + 1.6 * fk + 0.3 * flickSheen5(t))}}
        id={`${id}h`}
      />
      {/* the stroke lights the whole night for a moment (a lift, never a white-out) */}
      {wide && sk > 0.02 && (
        <g style={{mixBlendMode: 'screen'}}>
          <defs>
            <radialGradient id={`${id}-lift`} gradientUnits="userSpaceOnUse" cx={fmt(tipS.x + 40)} cy={fmt(tipS.y - 380)} r={1250}>
              <stop offset="0" stopColor="#7A86D8" stopOpacity={clamp(0.36 * sk)} />
              <stop offset="0.55" stopColor="#5A66B4" stopOpacity={clamp(0.2 * sk)} />
              <stop offset="1" stopColor="#4A5498" stopOpacity={clamp(0.1 * sk)} />
            </radialGradient>
            <filter id={`${id}-wb`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
              <feGaussianBlur stdDeviation={22} />
            </filter>
            <linearGradient id={`${id}-wet`} gradientUnits="userSpaceOnUse" x1="0" y1={fmt(gnd.y)} x2="0" y2={fmt(gnd.y + 300)}>
              <stop offset="0" stopColor="#C8D0FF" stopOpacity={clamp(0.22 * sk)} />
              <stop offset="1" stopColor="#C8D0FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <rect x={-20} y={-20} width={1120} height={1960} fill={`url(#${id}-lift)`} />
          {/* the wet garden catches the flash under the bolt */}
          <path d={`M${fmt(tipS.x - 26)},${fmt(gnd.y + 10)} L${fmt(tipS.x + 26)},${fmt(gnd.y + 10)} L${fmt(tipS.x + 60)},${fmt(gnd.y + 300)} L${fmt(tipS.x - 60)},${fmt(gnd.y + 300)} Z`} fill={`url(#${id}-wet)`} filter={`url(#${id}-wb)`} />
        </g>
      )}
      {wide && <ConductorCurrent5 cam={cam} t={t} id={`${id}-cc`} />}
      {wide && <StrikeBolt5 cam={cam} t={t} id={`${id}-b`} />}
      <RodRain cam={cam} rainT={t + 40} front flash={fl} quiet={quiet} k={Math.max(0.5, clamp(1.2 - sc / 260))} />
    </g>
  );
};
