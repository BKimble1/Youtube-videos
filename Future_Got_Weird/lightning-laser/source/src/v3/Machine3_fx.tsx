// V3 beat C helpers drawn over View3 (screen space, from the same 3D model, so they stay attached as a camera moves):
//   BeamGlow   a soft cyan glow along the projected beam axis between two heights, so the thin laser line reads on a
//              phone (the same restrained look as the opening's OpenFx glow)
//   beamFront  the beam's growing front when the laser fires (C1's window)
import React from 'react';
import {clamp, fmt} from '../dc/math';
import {axis3, Cam3, projector, V3} from '../v2/p3';
import {PAL} from './palette';

type Pt = {x: number; y: number};
const line = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');

/** the projected axis from h0 to h1 as short runs whose width follows depth */
export const axisRuns = (cam: Cam3, h0: number, h1: number, wM: number, minW: number, maxW: number, n = 48) => {
  if (h1 <= h0) return [];
  const P = projector(cam);
  const pts: V3[] = Array.from({length: n + 1}, (_, i) => axis3(h0 + ((h1 - h0) * i) / n));
  const pp = pts.map(P);
  const out: {d: string; w: number}[] = [];
  for (let i = 0; i + 1 < pp.length; i += 3) {
    const seg = pp.slice(i, Math.min(pp.length, i + 4)).filter((q) => q.ok);
    if (seg.length < 2) continue;
    const z = seg[Math.floor(seg.length / 2)].z;
    out.push({d: line(seg), w: clamp((cam.f * wM) / Math.max(z, 0.5), minW, maxW)});
  }
  return out;
};

export const BeamGlow: React.FC<{cam: Cam3; h0: number; h1: number; k: number; wide?: number; narrow?: number}> = ({cam, h0, h1, k, wide = 1.4, narrow = 0.45}) => {
  if (k <= 0.01) return null;
  const gw = axisRuns(cam, h0, h1, wide, 5, 26);
  const gn = axisRuns(cam, h0, h1, narrow, 2.5, 10);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      {gw.map((r, i) => <path key={`w${i}`} d={r.d} fill="none" stroke={PAL.laserGlow} strokeOpacity={0.16 * k} strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
      {gn.map((r, i) => <path key={`n${i}`} d={r.d} fill="none" stroke={PAL.laser} strokeOpacity={0.24 * k} strokeWidth={fmt(r.w)} strokeLinecap="round" />)}
    </g>
  );
};

/** a packet's head flare (screen space, oriented along the beam): the first light out of the telescope */
export const HeadFlare: React.FC<{cam: Cam3; h: number; k: number; id: string; r?: number}> = ({cam, h, k, id, r = 1}) => {
  if (k <= 0.01) return null;
  const P = projector(cam);
  const a = P(axis3(h)), b = P(axis3(h - 20));
  if (!a.ok || !b.ok) return null;
  const rad = clamp((cam.f * 3.2 * r) / a.z, 10, 90);
  const ang = (Math.atan2(a.y - b.y, a.x - b.x) * 180) / Math.PI;
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={clamp(k)}>
      <defs>
        <radialGradient id={`${id}-hf`}>
          <stop offset="0" stopColor={PAL.packet} stopOpacity={0.9} />
          <stop offset="0.35" stopColor={PAL.laser} stopOpacity={0.4} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={fmt(a.x)} cy={fmt(a.y)} rx={fmt(rad * 1.6)} ry={fmt(rad)} transform={`rotate(${fmt(ang)} ${fmt(a.x)} ${fmt(a.y)})`} fill={`url(#${id}-hf)`} />
    </g>
  );
};
