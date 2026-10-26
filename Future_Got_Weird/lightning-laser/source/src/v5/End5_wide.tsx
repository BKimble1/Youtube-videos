// V5 beat H2 (30.78-31.88), "into the SKY—": the payoff. A long-lens view level with the rod tip from out on the
// opening side (End5_cam.ts payCam): the cyan line rising past the tower's rod tip and the warm channel running on along
// it, large in frame, all the way up into the storm deck that fills the top of the frame; the view tilts up with the
// packet train toward the deck as the camera rises (in motion from cut to cut). The guided leader that ran up the
// channel in the split reaches the base at the cut: from there the discharge spreads through the base of the cell
// (End5_cloud.tsx: in-cloud channels crawling outward, the lobes they pass lit from within, local light only); on the
// payoff tick that starts "SKY" (31.14) the current surges through the channel and its branches (the brightest moment,
// ~31.15-31.35), then the branches die away by ~31.7 and the leader by ~31.8, leaving the warm channel, the line and a
// dim glow in the deck. The packet train (H's pace, a gap per 0.3 s) passes the rod tip on each payoff tick (30.84,
// 31.14, 31.44, 31.74) and enters the cloud base, each packet leaving the channel a little brighter behind it (it keeps
// the air heated). The site's own pieces (View3's, without its discharge), so the deck is lit by this discharge rather
// than V3's bolt.
import React from 'react';
import {clamp, fmt, noise1} from '../dc/math';
import {ss} from '../lib';
import {axis3, BOLT3, Cam3, projector, TIP3} from '../v2/p3';
import {BOLT3V} from '../v3/bolt3';
import {GuidedLeader5} from './End5_split';
import {TipCorona3} from '../v3/view3';
import {Beam3D, Sky3D, Tower3D} from '../v3/Scene3';
import {SiteExtras} from '../v3/features3';
import {PulseBloom} from '../v3/Open3_fx';
import {PULSE} from '../v3/Open3_end';
import {tau3} from '../v3/timeline3';
import {PAL} from '../v3/palette';
import {ChannelGrow4} from '../v4/End4_fx';
import {PAY_TOP, payCam, payPulses} from './End5_cam';
import {deckK, InCloud5, SURGE} from './End5_cloud';

const BOLT_TOP = BOLT3V.pts[BOLT3V.pts.length - 1];

/** each packet keeps the air it passes heated: a brighter warm stretch trailing it up the channel, fading behind it */
const Reheat: React.FC<{cam: Cam3; pulses: number[]; id: string}> = ({cam, pulses, id}) => {
  const P = projector(cam);
  const trail = PULSE.SPEED * PULSE.R_FAST * 0.3;
  const els = pulses.map((h, i) => {
    const top = Math.min(h, PAY_TOP), bot = Math.max(-10, h - trail);
    if (top <= bot + 4) return null;
    const a = P(axis3(top)), b = P(axis3(bot));
    if (!a.ok || !b.ok) return null;
    const w = clamp((cam.f * 3.2) / Math.max(a.z, 1), 8, 40);
    const k = (1 - ss(h, PAY_TOP - 40, PAY_TOP + 100)) * clamp((h + 10) / 40);
    if (k <= 0.01) return null;
    return (
      <g key={i}>
        <defs>
          <linearGradient id={`${id}-${i}`} gradientUnits="userSpaceOnUse" x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)}>
            <stop offset="0" stopColor={PAL.channelEdge} stopOpacity={0.6 * k} />
            <stop offset="1" stopColor={PAL.channel} stopOpacity={0} />
          </linearGradient>
        </defs>
        <line x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} stroke={`url(#${id}-${i})`} strokeWidth={fmt(w)} strokeLinecap="round" />
      </g>
    );
  });
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <filter id={`${id}-b`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      <g filter={`url(#${id}-b)`}>{els}</g>
    </g>
  );
};

/** the cloud base's soft glow where the line and the channel enter it (local, never a wash) */
const EntryGlow: React.FC<{cam: Cam3; id: string; k: number}> = ({cam, id, k}) => {
  const p = projector(cam)(axis3(PAY_TOP));
  if (!p.ok) return null;
  const r = clamp((cam.f * 70) / Math.max(p.z, 1), 120, 420);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-eg`} gradientUnits="userSpaceOnUse" cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(r)} gradientTransform={`translate(${fmt(p.x)},${fmt(p.y)}) scale(1.4,0.7) translate(${fmt(-p.x)},${fmt(-p.y)})`}>
          <stop offset="0" stopColor={PAL.channelEdge} stopOpacity={0.32 * k} />
          <stop offset="0.3" stopColor={PAL.laser} stopOpacity={0.14 * k} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={fmt(p.x)} cy={fmt(p.y)} rx={fmt(r * 1.4)} ry={fmt(r * 0.7)} fill={`url(#${id}-eg)`} />
    </g>
  );
};

export const PayoffH5: React.FC<{t: number}> = ({t}) => {
  const cam = payCam(t);
  const tag = `h5w-${Math.round(t * 30)}`;
  const pulses = payPulses(t);
  const drift = tau3(t);
  const Extra = React.useContext(SiteExtras);
  // the guided leader has reached the deck at the cut (End5_split): its channel glows on (the continuing current of an
  // upward flash, a steady glow with a slight flicker), surges with the in-cloud spread on SKY, then dies away by ~31.8
  const surge = t < SURGE - 0.02 ? 0 : 0.6 * Math.exp(-Math.max(0, t - SURGE) / 0.18) * clamp((t - SURGE + 0.02) / 0.02);
  const lk = (0.86 + 0.14 * noise1(t * 24, 9501) + surge) * (1 - ss(t, 31.4, 31.8));
  const dk = deckK(t);
  const tip = projector(cam)(TIP3);
  // the field crackles faintly at the tip toward the cut (only while the tip is clear of the caption band)
  const corona = 0.3 * ss(t, 31.3, 31.88) * (0.5 + 0.5 * Math.abs(Math.sin(t * 23))) * (1 - ss(tip.y, 1440, 1530));
  return (
    <g>
      <Sky3D cam={cam} flash={clamp(0.3 * Math.min(lk, 1.1))} boltTop={lk > 0.02 ? BOLT_TOP : undefined} drift={drift} rainT={drift + 40} />
      <EntryGlow cam={cam} id={`${tag}-en`} k={0.85 + 0.15 * Math.sin(t * 9)} />
      <InCloud5 cam={cam} t={t} id={`${tag}-ic`} />
      {Extra && <Extra cam={cam} flash={0} t={t} layer="back" id={`${tag}-xb`} />}
      <Tower3D cam={cam} flash={0} aviation={0.5 + 0.5 * Math.sin((2 * Math.PI * 17 * drift) / 33.5)} id={`${tag}-tw`} />
      {Extra && <Extra cam={cam} flash={0} t={t} layer="front" id={`${tag}-xf`} />}
      <Beam3D cam={cam} alpha={0.9} pulses={pulses} channel={0.9} channelTop={PAY_TOP} id={`${tag}-bm`} />
      <ChannelGrow4 cam={cam} t={t} top={PAY_TOP} k={1} wS={3.3} gain={2} id={`${tag}-g`} />
      <Reheat cam={cam} pulses={pulses} id={`${tag}-rh`} />
      <TipCorona3 cam={cam} k={corona} t={t} />
      {lk > 0.01 && (
        <g opacity={fmt(clamp(lk))}>
          <GuidedLeader5 cam={cam} s={BOLT3.total} t={t} id={`${tag}-gl`} tipGlow={false} gain={Math.max(1, lk)} />
        </g>
      )}
      <PulseBloom cam={cam} pulses={pulses} k={0.85} size={1.2} id={`${tag}-pb`} />
    </g>
  );
};
