// V4 drop-in for V3's C3 (9.67-11.42, v3/Machine3_reveal.tsx RevealC3), offered to integration for routing (see the
// A+H report). It is V3's shot exactly (the same camera c3Cam, packet train, push, FollowGlow and EndLine, imported or
// copied unchanged), with one change: the telescope is V4's physically sized one (Open4_laser PlacedLaser4, 2.3 m, its
// mount on the terrace) instead of V3's 38 m one, so it agrees with the summit station beside it (V3's giant tube made
// the station read as a doll's house at its exit window) and with A1/H2. Its exit gets the same local glow as H2's
// wide (End4_fx ExitGlow4), since the telescope is small at this distance; it eases out as the camera climbs.
import React from 'react';
import {clamp, fmt} from '../dc/math';
import {ss} from '../lib';
import {axis3, Cam3, len3, projector, sub3} from '../v2/p3';
import {View3} from '../v3/view3';
import {quietSt} from '../v3/states3';
import {MICRO_ANG} from '../v3/cams3';
import {PAL} from '../v3/palette';
import {B, EV} from '../v3/timeline3';
import {PulseBloom} from '../v3/Open3_fx';
import {BeamGlow} from '../v3/Machine3_fx';
import {c3Cam, c3Pulses, c3Tick, hF} from '../v3/Machine3_reveal';
import {EXIT_H} from '../world/site';
import {PlacedLaser4} from './Open4_laser';
import {ExitGlow4} from './End4_fx';

const T_PUSH = EV.pushIntoPulse, T2 = B.D;
const RAD = (MICRO_ANG * Math.PI) / 180;
const UP = {x: Math.sin(RAD), y: -Math.cos(RAD)};
/** (V3) the scale at the pushed-into packet (screen px per metre): the camera's f over its distance to the packet */
const zAim = (t: number) => {
  const tt = Math.min(t, T2);
  const c = c3Cam(tt);
  return c.f / len3(sub3(axis3(hF(tt)), c.pos));
};
/** (V3, unchanged) D's opening packet, in screen px along MICRO_ANG */
const D_PKT = {bloomR: 430, halo: {rx: 118 * 1.35 * 1.32, ry: 250 * 1.35 * 1.32}, core: {rx: 30 * 1.21 * 1.32, ry: 118 * 1.21 * 1.32}, white: {rx: 9 * 1.32, ry: 62 * 1.32}};
const FollowGlow: React.FC<{cam: Cam3; t: number; id: string}> = ({cam, t, id}) => {
  const k = ss(t, T_PUSH - 0.1, T_PUSH + 0.12);
  if (k <= 0.005) return null;
  const p = projector(cam)(axis3(hF(t)));
  if (!p.ok) return null;
  const g = zAim(Math.min(t, T2)) / 100;
  const bloom = ss(t, 11.08, T2);
  const sc = (r: number) => fmt(r * g);
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={fmt(k)} transform={`translate(${fmt(p.x)} ${fmt(p.y)}) rotate(${MICRO_ANG.toFixed(4)})`}>
      <defs>
        <radialGradient id={`${id}-h`}>
          <stop offset="0" stopColor={PAL.laser} stopOpacity={0.55} />
          <stop offset="0.45" stopColor={PAL.laserGlow} stopOpacity={0.26} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-c`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.5" stopColor={PAL.packet} stopOpacity={0.95} />
          <stop offset="1" stopColor={PAL.laser} stopOpacity={0} />
        </radialGradient>
      </defs>
      {bloom > 0.01 && <circle cx={0} cy={0} r={sc(D_PKT.bloomR)} fill={`url(#${id}-h)`} opacity={fmt(bloom)} />}
      <ellipse cx={0} cy={0} rx={sc(D_PKT.halo.rx)} ry={sc(D_PKT.halo.ry)} fill={`url(#${id}-h)`} />
      <ellipse cx={0} cy={0} rx={sc(D_PKT.core.rx)} ry={sc(D_PKT.core.ry)} fill={`url(#${id}-c)`} />
      <ellipse cx={0} cy={0} rx={sc(D_PKT.white.rx)} ry={sc(D_PKT.white.ry)} fill="#FFFFFF" />
    </g>
  );
};
const EndLine: React.FC<{cam: Cam3; t: number; k: number}> = ({cam, t, k}) => {
  const p = projector(cam)(axis3(hF(t)));
  if (!p.ok) return null;
  const a = {x: p.x - UP.x * 2400, y: p.y - UP.y * 2400}, b = {x: p.x + UP.x * 2400, y: p.y + UP.y * 2400};
  const d = `M${fmt(a.x)},${fmt(a.y)} L${fmt(b.x)},${fmt(b.y)}`;
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={fmt(k)}>
      <path d={d} stroke={PAL.laserGlow} strokeOpacity={0.1} strokeWidth={9} />
      <path d={d} stroke={PAL.laser} strokeOpacity={0.42} strokeWidth={2.2} />
    </g>
  );
};

export const RevealC3V4: React.FC<{t: number}> = ({t}) => {
  const tag = `c3v4-${Math.round(t * 30)}`;
  const cam = c3Cam(t);
  const pulses = c3Pulses(t);
  const end = ss(t, 11.05, T2);
  const st = {...quietSt(t, 0), pulses: pulses.filter((h) => Math.abs(h - hF(t)) > 1 || t < T_PUSH + 0.12), beam: 0.9 * (1 - end)};
  const tick = c3Tick(t);
  return (
    <g>
      <View3 cam={cam} st={st} t={t} tag={tag} rain={1 - ss(t, 10.7, 11.2)}>
        <BeamGlow cam={cam} h0={EXIT_H} h1={1000} k={0.8 * (1 - end)} />
        <PulseBloom cam={cam} pulses={st.pulses} k={0.55} id={`${tag}-pb`} />
        <ExitGlow4 cam={cam} k={1 - ss(t, B.C3 + 0.3, B.C3 + 0.9)} tick={clamp(tick)} id={`${tag}-eg`} />
      </View3>
      <PlacedLaser4 cam={cam} flash={0} fire={clamp(0.62 + 0.38 * tick)} tick={tick} t={t} id={`${tag}-l`} />
      {end > 0.01 && <rect x={0} y={0} width={1080} height={1920} fill="#131D2B" opacity={fmt(end * (0.78 + 0.22 * end ** 3))} />}
      {end > 0.01 && <EndLine cam={cam} t={t} k={end} />}
      <FollowGlow cam={cam} t={t} id={`${tag}-fg`} />
    </g>
  );
};
