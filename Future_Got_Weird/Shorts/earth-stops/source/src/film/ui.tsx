import React from 'react';
import {C, H, W} from '../theme';
import {CAP_FONT, HED_FONT} from '../fonts4';
import {Hed} from '../opening/type';
import {E} from '../lib/motion';
import {CharacterSide, SidePose, hipOnGround, sideFK} from '../v2/side';
import {MugSide} from '../v2/props';
import {GSY, GYW, SC} from '../v2/choreo2';
import {CUES, Cue} from './timeline';

export {Chip, ArrowShape, popScale, pop} from '../v2/OpeningH1';
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sm = (x: number) => { const t = cl(x); return t * t * (3 - 2 * t); };
/** 0 -> 1 over [a, b] frames with an ease */
export const ramp = (f: number, a: number, b: number, e: (x: number) => number = E.inOut) => e(cl((f - a) / Math.max(1e-6, b - a)));

/* ------------------------------------------------------------------ captions (Montserrat ExtraBold, cream, ink outline, replaced not faded) */
export const Captions: React.FC<{f: number; cues?: Cue[]; dy?: number}> = ({f, cues = CUES, dy = 0}) => {
  const c = cues.find((q) => f >= q.a && f < q.b);
  if (!c) return null;
  const n = c.lines.length, base = n === 1 ? 540 : n === 2 ? 500 : 458;
  return (
    <g fontFamily={CAP_FONT} fontWeight={800} fontSize={68} textAnchor="middle" strokeLinejoin="round">
      {c.lines.map((ln, i) => (
        <text key={i} x={540} y={base + dy + i * 86} paintOrder="stroke" stroke={C.ink} strokeWidth={15} fill={C.cream}>
          {ln.map(([t, em], j) => <tspan key={j} fill={em ? C.coral : C.cream}>{t}</tspan>)}
        </text>
      ))}
    </g>
  );
};

/* ------------------------------------------------------------------ the WHAT IF tag (hypothetical framing), top centre; slides up and out when `off` goes 0 -> 1 */
export const WhatIfTag: React.FC<{off?: number; scale?: number}> = ({off = 0, scale = 1}) => {
  if (off >= 1) return null;
  return (
    <g transform={`translate(0 ${-off * 340}) rotate(${off * -9} 540 263)`} opacity={1 - off * 0.2}>
      <g transform={`translate(540 263) scale(${scale}) translate(-540 -263)`}>
        <rect x={(W - 318) / 2 + 7} y={222} width={318} height={96} rx={22} fill={C.ink} />
        <rect x={(W - 318) / 2} y={215} width={318} height={96} rx={22} fill={C.saffron} stroke={C.ink} strokeWidth={5} />
        <Hed x={W / 2} y={263} text="WHAT IF" size={68} color={C.ink} shadow={null} ls={3} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ hero (same cast member, side view) placed in the ground frame */
export const WALKP = (t: number): SidePose => {
  const p = (2 * Math.PI * (t - 6)) / 30, s = Math.sin(p), c = Math.cos(p);
  return {lean: 3, head: 0, armN: {s: 26, e: 74}, armF: {s: 22 * -s, e: 10}, legN: {h: 22 * s, k: 6 + 16 * Math.max(0, c), f: 0}, legF: {h: -22 * s, k: 6 + 16 * Math.max(0, -c), f: 0}, mouth: 'smile', brows: 0, lookY: 0};
};
/** standing, calm, holding the mug out in front (breathing only) */
export const CALM = (t: number): SidePose => ({
  lean: 2 + 0.6 * Math.sin(t * 0.11), head: 1 + 0.8 * Math.sin(t * 0.07 + 1), armN: {s: 28 + 1.2 * Math.sin(t * 0.11), e: 70}, armF: {s: 6, e: 10}, legN: {h: 5, k: 3, f: 0}, legF: {h: -5, k: 2, f: 0}, mouth: 'smile', brows: 0, lookY: 0,
});

export const ScarfHang: React.FC<{n: {x: number; y: number}; z: number; sway: number}> = ({n, z, sway}) => {
  const pts = Array.from({length: 7}).map((_, k) => ({x: n.x - (14 + 20 * k) * z, y: n.y + (6 + 12 * k + 6 * Math.sin(sway + 0.9 * k)) * z, w: Math.max(22, 44 - 3 * k) * z}));
  return (
    <g>
      {[...pts].reverse().map((p, ri) => { const k = 6 - ri, a = k === 0 ? {x: n.x, y: n.y} : pts[k - 1]; return <line key={`o${k}`} x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke={C.ink} strokeWidth={p.w + 8 * z} strokeLinecap="round" />; })}
      {[...pts].reverse().map((p, ri) => { const k = 6 - ri, a = k === 0 ? {x: n.x, y: n.y} : pts[k - 1]; return <line key={`i${k}`} x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke={k % 3 === 1 ? C.cream : C.coral} strokeWidth={p.w} strokeLinecap="round" />; })}
    </g>
  );
};

export const heroScreen = (pose: SidePose, hipX: number, camX: number, z: number, groundY = GYW) => {
  const hip = hipOnGround(pose, hipX, groundY, SC);
  return {x: 540 + (hip.x - camX) * z, y: GSY + (hip.y - GYW) * z};
};

export const HeroAt: React.FC<{pose: SidePose; hipX: number; camX: number; z: number; mug?: number; sway?: number; opacity?: number; groundY?: number; noMug?: boolean}> = ({pose, hipX, camX, z, mug = 0, sway = 0, opacity = 1, groundY = GYW, noMug}) => {
  const hip = heroScreen(pose, hipX, camX, z, groundY);
  const fk = sideFK(pose, hip, SC * z);
  return <CharacterSide pose={pose} hip={hip} sc={SC * z} scarfWrap scarf={<ScarfHang n={fk.N} z={z} sway={sway} />} holdN={noMug ? undefined : <MugSide tilt={mug} sc={SC * z} />} opacity={opacity} />;
};

/* ------------------------------------------------------------------ small props: cat, pigeon */
export const Cat: React.FC<{x: number; y: number; s?: number; look?: number}> = ({x, y, s = 1, look = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={2} rx={46} ry={8} fill={C.shadow} />
    <path d="M -34 0 Q -44 -34 -22 -52 Q -4 -64 14 -52 Q 34 -34 28 0 Z" fill="#E7B47A" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M -34 -6 Q -66 -8 -62 -34 Q -58 -44 -50 -34" fill="none" stroke={C.ink} strokeWidth={13} strokeLinecap="round" />
    <path d="M -34 -6 Q -66 -8 -62 -34 Q -58 -44 -50 -34" fill="none" stroke="#E7B47A" strokeWidth={6} strokeLinecap="round" />
    <circle cx={8} cy={-62} r={24} fill="#E7B47A" stroke={C.ink} strokeWidth={4} />
    <path d="M -10 -80 L -14 -104 L 6 -88 Z M 22 -84 L 32 -106 L 34 -78 Z" fill="#E7B47A" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={2 + look * 2} cy={-64} r={3.4} fill={C.ink} /><circle cx={20 + look * 2} cy={-64} r={3.4} fill={C.ink} />
    <path d="M 8 -56 l 3 4 l -6 0 z" fill={C.coralDeep} />
    <path d="M -22 0 q 0 -16 8 -16 M 6 0 q 0 -16 8 -16" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
  </g>
);
export const Pigeon: React.FC<{x: number; y: number; s?: number; flap?: number; fly?: boolean}> = ({x, y, s = 1, flap = 0, fly}) => {
  const wing = fly ? Math.sin(flap) * 36 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M -34 0 Q -30 -26 -2 -28 Q 26 -30 36 -14 Q 40 -6 30 0 Q 6 8 -34 0 Z`} fill="#9CB1BD" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={34} cy={-26} r={14} fill="#9CB1BD" stroke={C.ink} strokeWidth={4} />
      <path d="M 46 -28 l 18 4 l -18 6 z" fill={C.saffronDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <circle cx={38} cy={-30} r={3} fill={C.ink} />
      <path d={`M -4 -22 Q -20 ${-48 - wing} -44 ${-40 - wing * 0.6} Q -26 -18 -4 -14 Z`} fill="#7C94A3" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M -34 -2 L -58 4 L -34 8 Z" fill="#7C94A3" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      {!fly && <path d="M 0 2 v 14 M 14 2 v 14" stroke={C.saffronDeep} strokeWidth={4} strokeLinecap="round" />}
    </g>
  );
};

export const SKY_DEFS = (id: string) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.saffron} /><stop offset="1" stopColor={C.saffronLight} /></linearGradient>
  </defs>
);
export {C, H, W, HED_FONT, GSY, GYW, SC};
