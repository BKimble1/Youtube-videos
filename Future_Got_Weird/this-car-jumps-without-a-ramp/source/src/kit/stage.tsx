// Camera and scene shell. World units are millimetres with y up; the camera is the world point at the screen centre
// plus a zoom in screen pixels per millimetre (at 1920x1080; the 4K master renders the same frame at scale 2).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {lerp} from './util';

export type Cam = {x: number; y: number; z: number};
export const camT = (c: Cam) => `translate(960 540) scale(${c.z} ${-c.z}) translate(${-c.x} ${-c.y})`;
export const toScreen = (c: Cam, x: number, y: number) => ({x: 960 + (x - c.x) * c.z, y: 540 - (y - c.y) * c.z});
/** Zoom interpolates geometrically so pushes feel even; position follows the zoom so the framing stays anchored. */
export const mixCam = (a: Cam, b: Cam, t: number): Cam => {
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), t));
  const k = Math.abs(b.z - a.z) < 1e-9 ? t : (1 / z - 1 / a.z) / (1 / b.z - 1 / a.z);
  return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z};
};
/** Camera keyed in time: [[t, cam], ...] with smooth eases between keys. */
export const camKeys = (t: number, ks: [number, Cam][], ease: (x: number) => number) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) if (t <= ks[i + 1][0]) return mixCam(ks[i][1], ks[i + 1][1], ease((t - ks[i][0]) / (ks[i + 1][0] - ks[i][0])));
  return ks[ks.length - 1][1];
};

export const Stage: React.FC<{children: React.ReactNode; bg?: string; over?: React.ReactNode}> = ({children, bg = C.paper, over}) => (
  <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      {children}
    </svg>
    {over}
  </AbsoluteFill>
);
export const World: React.FC<{cam: Cam; children: React.ReactNode; opacity?: number}> = ({cam, children, opacity}) => (
  <g transform={camT(cam)} opacity={opacity}>{children}</g>
);

/** Screen-space caption chip (top-left corner style), used sparingly: source credit, "simplified", "slowed down". */
export const Chip: React.FC<{x: number; y: number; text: string; opacity?: number; dark?: boolean; size?: number; anchor?: 'l' | 'r'}> = ({x, y, text, opacity = 1, dark = true, size = 24, anchor = 'l'}) => {
  if (opacity <= 0.001) return null;
  const w = text.length * size * 0.58 + size * 1.2;
  const h = size * 1.6;
  const x0 = anchor === 'l' ? x : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y} width={w} height={h} rx={h * 0.28} fill={dark ? C.ink : C.white} opacity={dark ? 0.86 : 0.95} stroke={dark ? 'none' : C.ink} strokeWidth={3} />
      <text x={x0 + w / 2} y={y + h / 2 + size * 0.35} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={size} fill={dark ? C.cream : C.ink} letterSpacing={1.2}>
        {text}
      </text>
    </g>
  );
};

/** Screen-space label with a leader line to a screen point. */
export const Callout: React.FC<{x: number; y: number; tx: number; ty: number; text: string; opacity?: number; color?: string; size?: number; fg?: string}> = ({x, y, tx, ty, text, opacity = 1, color = C.white, size = 34, fg = C.ink}) => {
  if (opacity <= 0.001) return null;
  const w = text.length * size * 0.6 + size * 1.1;
  const h = size * 1.55;
  return (
    <g opacity={opacity}>
      <line x1={x} y1={y} x2={tx} y2={ty} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      <circle cx={tx} cy={ty} r={7} fill={C.ink} />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h * 0.3} fill={color} stroke={C.ink} strokeWidth={4} />
      <text x={x} y={y + size * 0.36} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={size} fill={fg}>
        {text}
      </text>
    </g>
  );
};

/** Screen-space bold label (no leader). */
export const Label: React.FC<{x: number; y: number; text: string; opacity?: number; color?: string; fg?: string; size?: number; scale?: number}> = ({x, y, text, opacity = 1, color = C.white, fg = C.ink, size = 38, scale = 1}) => {
  if (opacity <= 0.001) return null;
  const w = text.length * size * 0.6 + size * 1.2;
  const h = size * 1.6;
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.3} fill={color} stroke={C.ink} strokeWidth={4} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={size} fill={fg}>
        {text}
      </text>
    </g>
  );
};
