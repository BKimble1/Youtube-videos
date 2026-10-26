// V5 D4 (14.64-15.83) "through the sky": the storm view from up in the sky. The camera hangs out in the open air on
// the main views' side, about 130 m from the tower and level with its top, and cranes straight up (about 20 m, one
// steady move with the pulses) toward the storm deck: the tower top sinks a little in the frame while the deck's
// underside, 90-110 m overhead, spreads across the whole upper half of the frame and away to the horizon. The warm
// channel is the subject: one long warm path (about 40% of the frame's height) from the rod tip, where the cyan line
// passes, up through the open sky into the cloud base, where its warmth lights the lobes round it from beneath; the
// packet train races up it, each packet leaving the air behind it a little brighter. The storm's size shows in the
// rain shafts hanging from the deck far off on both sides, and in lightning flickering inside the deck: a crawler
// across the base well left of the channel (14.95), lighting the lobes and the rain under it, then a fainter flash far
// to the right (15.47) (silent: far-off in-cloud flashes; the mix has only the heating shimmer here). The laser's
// station is far below the frame; the beam enters from the lower left.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash} from '../dc/math';
import {ss} from '../lib';
import {axis3, Cam3, lerp3, projector, TIP3, v3, V3} from '../v2/p3';
import {stream} from '../v2/shots3d';
import {View3} from '../v3/view3';
import {PAL} from '../v3/palette';
import {lookAtScreen} from '../v3/Open3_end';
import {PulseBloom} from '../v3/Open3_fx';
import {CB, deckY} from '../v3/Scene3_sky';
import {SiteExtras} from '../v3/features3';
import {ChannelGrow4} from '../v4/End4_fx';
import {deckFlashK, DeckFlashSpec, makeDeckFlash, makeDeckGlow} from './Channel5_flash';

export const D4_T0 = 14.64, D4_T1 = 15.83;
/** the crane: from level with the tower top to about 18 m above it, on the main views' side (m) */
const POS0 = v3(-48, 121, -124), POS1 = v3(-45, 141, -119);
const F4 = 1000;
/** the rod tip on screen: it sinks as the camera rises, ending where E1 opens on it (about (470, 1300)) */
const TIP_AT0 = {x: 450, y: 1060}, TIP_AT1 = {x: 452, y: 1250};
/** a steady rise, a touch quicker off the cut and a touch slower into E1's close view */
const craneK = (u: number) => u + 0.2 * u * (1 - u);
export const stormCam = (t: number): Cam3 => {
  const k = craneK(clamp((t - D4_T0) / (D4_T1 - D4_T0)));
  return lookAtScreen(lerp3(POS0, POS1, k), TIP3, F4, TIP_AT0.x + (TIP_AT1.x - TIP_AT0.x) * k, TIP_AT0.y + (TIP_AT1.y - TIP_AT0.y) * k, 0);
};

/** the packet clock: a fast train (site px/s, gap) so several packets climb the frame at once */
const P_SPEED = 1500, P_GAP = 300;
export const stormPulses = (t: number) => stream(t, P_SPEED, P_GAP);
/** the channel's top (site px along the axis): inside the cloud base */
const CH_TOP = 660;
const ENTRY = axis3(CH_TOP);
/** the base round the channel's entry, lit warm from beneath */
const GLOW = makeDeckGlow({at: v3(ENTRY.x, CB, ENTRY.z), reach: 110, seed: 21});
/** lightning inside the deck: a crawler along the base well left of the channel (nearer), then a fainter flash far to
 *  the right; both far from the beam */
const SPEC_A: DeckFlashSpec = {at: v3(-58, 234, 46), reach: 125, t0: 14.95, gain: 1, seed: 3, len: 100, dir: -0.3, jag: 0.85};
const SPEC_B: DeckFlashSpec = {at: v3(232, 240, 100), reach: 130, t0: 15.47, gain: 0.65, seed: 9, len: 90, dir: -0.4};
const FLASH_A = makeDeckFlash(SPEC_A);
const FLASH_B = makeDeckFlash(SPEC_B);

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

/** where the channel enters the base: a soft warm bloom on the cloud round the entry */
const EntryBloom: React.FC<{cam: Cam3; k: number; id: string}> = ({cam, k, id}) => {
  const p = projector(cam)(axis3(CH_TOP - 20));
  if (!p.ok || k <= 0.01) return null;
  const r = clamp((cam.f * 30) / p.z, 40, 300);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-tg`}>
          <stop offset="0" stopColor={PAL.channelEdge} stopOpacity={0.5} />
          <stop offset="0.3" stopColor={PAL.channel} stopOpacity={0.22} />
          <stop offset="1" stopColor={PAL.channelMacro} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={fmt(p.x)} cy={fmt(p.y)} rx={fmt(r * 1.4)} ry={fmt(r * 0.6)} fill={`url(#${id}-tg)`} opacity={fmt(k)} />
    </g>
  );
};

// ------------------------------------------------------------------ rain shafts far off under the deck
/** veils of rain hanging from the deck base to the ground, far out on both sides of the view (world x/z of the
 *  centre, half-width, wind lean), each facing the main view direction; a flash lights the ones near it */
type Veil = {x: number; z: number; w: number; lean: number; a: number; seed: number};
const VIEW_YAW = 26 * (Math.PI / 180);
const VEILS: Veil[] = [
  {az: -27, d: 1250, w: 190, a: 0.9}, {az: -15, d: 650, w: 120, a: 1}, {az: -4, d: 1700, w: 260, a: 0.7},
  {az: 15, d: 1050, w: 170, a: 0.85}, {az: 26, d: 720, w: 110, a: 1}, {az: 9, d: 2300, w: 320, a: 0.55},
].map((v, i) => {
  const az = VIEW_YAW + v.az * (Math.PI / 180);
  return {x: POS1.x + v.d * Math.sin(az), z: POS1.z + v.d * Math.cos(az), w: v.w, lean: 0.22 + 0.1 * hash(i, 1501), a: v.a, seed: i};
});
const GROUND = -380;
const deckAt = (x: number, z: number) => {
  const d = Math.hypot(x, z);
  return d < 330 ? CB : deckY(d);
};
const Veils: React.FC<{cam: Cam3; t: number; id: string}> = ({cam, t, id}) => {
  const P = projector(cam);
  const ax = Math.cos(VIEW_YAW), az = -Math.sin(VIEW_YAW); // across the view
  const kA = deckFlashK(SPEC_A, t), kB = deckFlashK(SPEC_B, t);
  const els = VEILS.map((v, i) => {
    const top = deckAt(v.x, v.z) - 2;
    const at = (u: number, y: number): V3 => {
      // the wind leans each veil: its foot lies downwind of its top
      const s = u * v.w + (top - y) * v.lean;
      return v3(v.x + ax * s, y, v.z + az * s);
    };
    const q = [at(-1, top), at(1, top), at(1, GROUND), at(-1, GROUND)].map(P);
    if (!q.every((p) => p.ok)) return null;
    // the flashes light the rain under them
    const lit = (s: DeckFlashSpec, k: number) => k * clamp(1 - (Math.hypot(v.x - s.at.x, v.z - s.at.z) - v.w) / (s.reach * 3.2));
    const L = clamp(lit(SPEC_A, kA) + 0.7 * lit(SPEC_B, kB));
    const col = mix('#1C2E3F', '#7E8CC8', L), colS = mix('#3B5169', '#C2CAF6', L);
    const gid = `${id}-v${i}`;
    // the streaks inside the veil (texture): thin leaning lines from the base down
    const streaks: string[] = [];
    for (let j = 0; j < 9; j++) {
      const u = -0.85 + 1.7 * hash(j + i * 13, 1503);
      const y0 = top - 10 - 60 * hash(j + i * 13, 1505), y1 = GROUND + 260 * hash(j + i * 13, 1507);
      const a = P(at(u, y0)), b = P(at(u, y1));
      if (a.ok && b.ok) streaks.push(`M${fmt(a.x)},${fmt(a.y)} L${fmt(b.x)},${fmt(b.y)}`);
    }
    const yT = (q[0].y + q[1].y) / 2, yB = (q[2].y + q[3].y) / 2;
    const w = Math.abs(q[1].x - q[0].x);
    const grad = (gid2: string, c: string, a: number) => (
      <linearGradient id={gid2} gradientUnits="userSpaceOnUse" x1="0" y1={fmt(yT)} x2="0" y2={fmt(yB)}>
        <stop offset="0" stopColor={c} stopOpacity={0} />
        <stop offset="0.1" stopColor={c} stopOpacity={a * v.a} />
        <stop offset="0.5" stopColor={c} stopOpacity={0.7 * a * v.a} />
        <stop offset="1" stopColor={c} stopOpacity={0.15 * a * v.a} />
      </linearGradient>
    );
    return (
      <g key={i}>
        <defs>
          {grad(gid, col, 0.5)}
          {grad(`${gid}s`, colS, 0.35 + 0.4 * L)}
        </defs>
        <path d={`M${q.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} Z`} fill={`url(#${gid})`} />
        <path d={streaks.join(' ')} fill="none" stroke={`url(#${gid}s)`} strokeWidth={fmt(clamp(w / 50, 1.2, 4))} />
      </g>
    );
  });
  return (
    <g>
      <defs>
        <filter id={`${id}-vb`} filterUnits="userSpaceOnUse" x={-300} y={-300} width={1680} height={2520}>
          <feGaussianBlur stdDeviation={9} />
        </filter>
      </defs>
      <g filter={`url(#${id}-vb)`}>{els}</g>
    </g>
  );
};

/** the deck overhead weighs on the frame: a slightly heavier top and a soft vignette */
const Weight: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="d4-wt" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#05090F" stopOpacity={0.12} />
        <stop offset="0.15" stopColor="#05090F" stopOpacity={0} />
      </linearGradient>
      <radialGradient id="d4-vg" cx="0.5" cy="0.45" r="0.8">
        <stop offset="0.62" stopColor="#05090F" stopOpacity={0} />
        <stop offset="1" stopColor="#05090F" stopOpacity={0.4} />
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
  // the glow on the base breathes a little as packets arrive in it
  const arrive = pulses.reduce((a, h) => Math.max(a, Math.exp(-(((h - CH_TOP) / 160) ** 2))), 0);
  const glowK = 0.85 + 0.15 * arrive;
  // (the station is far below the frame: only the rain shafts are added behind the tower)
  const Back = React.useCallback<React.FC<{cam: Cam3; flash: number; t: number; layer: 'back' | 'front'; id: string}>>(
    (p) => (p.layer === 'back' ? <Veils cam={p.cam} t={p.t} id={p.id} /> : null),
    [],
  );
  return (
    <g>
      <SiteExtras.Provider value={Back}>
        <View3 cam={cam} st={st} t={t} tag={tag}>
          <GLOW cam={cam} t={t} k={glowK} id={`${tag}-gl`} />
          <FLASH_A cam={cam} t={t} id={`${tag}-fa`} />
          <FLASH_B cam={cam} t={t} id={`${tag}-fb`} />
          <ChannelGrow4 cam={cam} t={31} top={CH_TOP} k={1} wS={3.2} gain={2} id={`${tag}-g`} />
          <Fresh cam={cam} pulses={pulses} id={`${tag}-fr`} />
          <EntryBloom cam={cam} k={glowK} id={`${tag}-tg`} />
          <PulseBloom cam={cam} pulses={pulses} k={0.85} size={1.3} id={`${tag}-pb`} />
        </View3>
      </SiteExtras.Provider>
      <Weight />
    </g>
  );
};
