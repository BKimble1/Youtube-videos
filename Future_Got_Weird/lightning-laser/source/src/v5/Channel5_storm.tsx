// V5 D4 (14.64-15.83) "through the sky": the wide storm view. Far out on the valley side, low, looking up at the
// whole summit: the mountain's peak with the station and the telescope, the tower on top, and above it the storm deck
// filling the upper half of the frame. The packet train races up the cyan line from the telescope past the rod tip and
// into the deck; each packet leaves the warm prepared air along its path a little brighter, so the channel reads as
// one warm path from the rod tip up through the sky into the cloud base (where its top glows softly). Lightning
// flickers inside the deck, upper left (14.95) and then fainter to the right (15.47), well away from the beam, and shows
// how big the storm is (silent: far-off in-cloud flashes; the mix has only the heating shimmer here). The camera
// dollies in and rises (a slow crane up) at constant speed, the rod tip held on one screen point (no zoom).
import React from 'react';
import {clamp, fmt} from '../dc/math';
import {ss} from '../lib';
import {axis3, Cam3, lerp3, projector, TIP3, v3} from '../v2/p3';
import {stream} from '../v2/shots3d';
import {View3} from '../v3/view3';
import {PAL} from '../v3/palette';
import {lookAtScreen} from '../v3/Open3_end';
import {PulseBloom} from '../v3/Open3_fx';
import {ChannelGrow4} from '../v4/End4_fx';
import {makeDeckFlash} from './Channel5_flash';

export const D4_T0 = 14.64, D4_T1 = 15.83;
/** the dolly: from far down the valley side toward the summit, rising a little (m) */
const POS0 = v3(-112, 4, -390), POS1 = v3(-96, 40, -335);
const F4 = 1150;
const TIP_AT0 = {x: 432, y: 1172}, TIP_AT1 = {x: 432, y: 1150};
export const stormCam = (t: number): Cam3 => {
  const u = (t - D4_T0) / (D4_T1 - D4_T0);
  const pos = lerp3(POS0, POS1, u);
  return lookAtScreen(pos, TIP3, F4, TIP_AT0.x + (TIP_AT1.x - TIP_AT0.x) * u, TIP_AT0.y + (TIP_AT1.y - TIP_AT0.y) * u, 0);
};

/** the packet clock: a fast train (site px/s, gap) so several packets climb the frame at once */
const P_SPEED = 1500, P_GAP = 300;
export const stormPulses = (t: number) => stream(t, P_SPEED, P_GAP);
/** the channel's top (site px along the axis): inside the cloud base */
const CH_TOP = 660;
/** lightning flickering inside the deck: a nearer one over the valley side (upper left, far from the beam), then a
 *  fainter one far to the right */
const FLASH_A = makeDeckFlash({at: v3(-100, 238, -90), reach: 190, t0: 14.95, gain: 0.75, seed: 3, len: 130, dir: 0.5});
const FLASH_B = makeDeckFlash({at: v3(130, 240, -110), reach: 160, t0: 15.47, gain: 0.6, seed: 9, len: 90, dir: -0.3});

/** each packet's fresh warmth: a brighter warm segment trailing it up the channel, fading over ~0.35 s of its travel */
const Fresh: React.FC<{cam: Cam3; pulses: number[]; id: string}> = ({cam, pulses, id}) => {
  const P = projector(cam);
  const f = cam.f;
  const trail = P_SPEED * 0.35;
  const els = pulses.map((h, i) => {
    const top = Math.min(h, CH_TOP), bot = Math.max(-10, h - trail);
    if (top <= bot + 4) return null;
    const a = P(axis3(top)), b = P(axis3(bot));
    if (!a.ok || !b.ok) return null;
    const w = clamp((f * 2.6) / Math.max(a.z, 1), 6, 60);
    // fades toward its tail and as the packet enters the cloud base
    const k = (1 - ss(h, CH_TOP - 40, CH_TOP + 120)) * clamp((h + 10) / 60);
    if (k <= 0.01) return null;
    return (
      <g key={i}>
        <defs>
          <linearGradient id={`${id}-${i}`} gradientUnits="userSpaceOnUse" x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)}>
            <stop offset="0" stopColor={PAL.channelEdge} stopOpacity={0.55 * k} />
            <stop offset="0.35" stopColor={PAL.channel} stopOpacity={0.3 * k} />
            <stop offset="1" stopColor={PAL.channelMacro} stopOpacity={0} />
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
          <feGaussianBlur stdDeviation={5} />
        </filter>
      </defs>
      <g filter={`url(#${id}-b)`}>{els}</g>
    </g>
  );
};

/** the channel's top in the cloud base: a soft warm glow on the base where the prepared air enters it */
const TopGlow: React.FC<{cam: Cam3; k: number; id: string}> = ({cam, k, id}) => {
  const p = projector(cam)(axis3(CH_TOP - 30));
  if (!p.ok || k <= 0.01) return null;
  const r = clamp((cam.f * 26) / p.z, 40, 260);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-tg`}>
          <stop offset="0" stopColor={PAL.channel} stopOpacity={0.32} />
          <stop offset="0.4" stopColor={PAL.channelMacro} stopOpacity={0.12} />
          <stop offset="1" stopColor={PAL.channelMacro} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={fmt(p.x)} cy={fmt(p.y)} rx={fmt(r * 1.3)} ry={fmt(r * 0.7)} fill={`url(#${id}-tg)`} opacity={fmt(k)} />
    </g>
  );
};

/** a heavier sky toward the top of the frame (the deck overhead), so the storm presses down on the summit */
const Weight: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="d4-wt" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#05090F" stopOpacity={0.4} />
        <stop offset="0.22" stopColor="#05090F" stopOpacity={0.12} />
        <stop offset="0.4" stopColor="#05090F" stopOpacity={0} />
      </linearGradient>
      <radialGradient id="d4-vg" cx="0.45" cy="0.55" r="0.8">
        <stop offset="0.6" stopColor="#05090F" stopOpacity={0} />
        <stop offset="1" stopColor="#05090F" stopOpacity={0.45} />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={1080} height={1920} fill="url(#d4-wt)" />
    <rect x={0} y={0} width={1080} height={1920} fill="url(#d4-vg)" />
  </g>
);

export const StormD4: React.FC<{t: number}> = ({t}) => {
  const cam = stormCam(t);
  const pulses = stormPulses(t);
  const tag = `d4-${Math.round(t * 30)}`;
  const st = {s: -1, core: 0, flash: 0, beam: 0.9, pulses, channel: 0, tipCorona: 0};
  return (
    <g>
      <View3 cam={cam} st={st} t={t} tag={tag}>
        <ChannelGrow4 cam={cam} t={31} top={CH_TOP} k={1} wS={3.2} gain={2} id={`${tag}-g`} />
        <Fresh cam={cam} pulses={pulses} id={`${tag}-fr`} />
        <TopGlow cam={cam} k={1} id={`${tag}-tg`} />
        <FLASH_A cam={cam} t={t} id={`${tag}-fa`} />
        <FLASH_B cam={cam} t={t} id={`${tag}-fb`} />
        <PulseBloom cam={cam} pulses={pulses} k={0.85} size={1.3} id={`${tag}-pb`} />
      </View3>
      <Weight />
    </g>
  );
};
