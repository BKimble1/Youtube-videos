// V2 lens views, all in the corridor's metric space and drawn through the shot camera:
//  - LensFace: the panel's front at micro scale: each vertical lenticule a shaded cylinder (1.85 mm pitch, ~400 across the
//    panel) with a specular highlight that travels across the curved lenses; the refracted scene shows as bands of the
//    corridor's colours inside them. Optionally cut off above a horizontal section plane.
//  - LensSection: the cut face at that plane: the slab and the curved lens profiles (true geometry, seen from above).
//  - LightPaths: a few representative rays in the section plane (simplified): her light reaches the lenses and is spread
//    sideways, mostly away from the guard (a faint trace still reaches him); light from the corridor beside her reaches the
//    lenses in front of her and is bent toward the guard's eye. Pulses travel along the paths at one speed.
import React from 'react';
import {clamp, lerp} from '../lib/math';
import {mix} from '../lib/color';
import {a3, Basis, d3, fmt, lineD, m3, n3, polyD, proj, projPoly, s3, V3, v3} from './p3';
import {onShield, SH, shieldFrame, ShieldState} from './Shield3';

const lensIndexRange = (b: Basis, s: ShieldState, margin = 8) => {
  // which lenticules are on screen: project the panel's horizontal axis at the camera's target height and clip
  const n = Math.floor(SH.w / SH.pitch);
  const {r} = shieldFrame(s);
  let i0 = n, i1 = 0;
  for (let i = 0; i <= n; i += 4) {
    const u = -0.5 + (i * SH.pitch) / SH.w;
    const p = proj(b, onShield(s, u, 0.06, SH.th / 2));
    if (p.d > 0 && p.x > -200 && p.x < 1280) { i0 = Math.min(i0, i); i1 = Math.max(i1, i); }
  }
  void r;
  return {i0: Math.max(0, i0 - margin), i1: Math.min(n, i1 + margin), n};
};

export const LensFace: React.FC<{id: string; b: Basis; s: ShieldState; t: number; cutV?: number; a?: number}> = ({id, b, s, t, cutV = 0.5, a = 1}) => {
  const {i0, i1} = lensIndexRange(b, s);
  if (i1 <= i0 || a <= 0.01) return null;
  const nodes: React.ReactNode[] = [];
  const bump = SH.pitch * 0.42;
  for (let i = i0; i < i1; i++) {
    const u0 = -0.5 + (i * SH.pitch) / SH.w, u1 = -0.5 + ((i + 1) * SH.pitch) / SH.w;
    const um = (u0 + u1) / 2;
    const vTop = Math.min(0.5, cutV), vBot = -0.5;
    // the lens strip, with its crest raised by the bump height
    const A = onShield(s, u0, vBot, SH.th / 2), B = onShield(s, u1, vBot, SH.th / 2), Cc = onShield(s, u1, vTop, SH.th / 2), D = onShield(s, u0, vTop, SH.th / 2);
    const pp = projPoly(b, [A, B, Cc, D]);
    if (pp.length < 3) continue;
    // travelling highlight: a wave moving across the array. Each lens is shaded as sub-strips in panel space (a
    // screen-space gradient would cut across the strips once perspective converges them)
    const hi = 0.22 + 0.16 * Math.sin(t * 2.4 - i * 0.35);
    const stops: [number, string, number][] = [[0, '#0B2A33', 0.75], [clamp(hi - 0.12), '#7FD3D8', 0.35], [clamp(hi), '#FFFFFF', 0.95], [clamp(hi + 0.1), '#BDEFF2', 0.45], [0.75, '#5FB5BF', 0.25], [1, '#0B2A33', 0.8]];
    const at = (f: number): [string, number] => {
      for (let q = 1; q < stops.length; q++) if (f <= stops[q][0]) {
        const [f0, c0, o0] = stops[q - 1], [f1, c1, o1] = stops[q];
        const k = f1 > f0 ? (f - f0) / (f1 - f0) : 1;
        return [mix(c0, c1, k), lerp(o0, o1, k)];
      }
      return [stops[stops.length - 1][1], stops[stops.length - 1][2]];
    };
    // fewer sub-strips when a lens is only a few px wide
    const wpx = Math.abs(proj(b, onShield(s, u1, Math.min(vTop, 0.06), SH.th / 2)).x - proj(b, onShield(s, u0, Math.min(vTop, 0.06), SH.th / 2)).x);
    const nSub = wpx > 60 ? 9 : wpx > 14 ? 4 : 1;
    void um; void bump; void pp;
    const subs: React.ReactNode[] = [];
    for (let q = 0; q < nSub; q++) {
      const fa = q / nSub, fb = (q + 1) / nSub;
      const ua = lerp(u0, u1, fa), ub = lerp(u0, u1, fb);
      const sp = projPoly(b, [onShield(s, ua, vBot, SH.th / 2), onShield(s, ub, vBot, SH.th / 2), onShield(s, ub, vTop, SH.th / 2), onShield(s, ua, vTop, SH.th / 2)]);
      if (sp.length < 3) continue;
      const [c, o] = nSub === 1 ? ['#6FB9C0', 0.45] as [string, number] : at((fa + fb) / 2);
      subs.push(<path key={q} d={polyD(sp)} fill={c} fillOpacity={o} stroke={c} strokeOpacity={o} strokeWidth={0.6} />);
    }
    nodes.push(<g key={i}>{subs}</g>);
  }
  // the refracted scene seen through the lenses: horizontal bands of the corridor's colours (behind the lens shading)
  const band = (v0: number, v1: number, col: string, op: number) => {
    const pp = projPoly(b, [onShield(s, -0.5 + (i0 * SH.pitch) / SH.w, v0, SH.th / 2 - 0.001), onShield(s, -0.5 + (i1 * SH.pitch) / SH.w, v0, SH.th / 2 - 0.001), onShield(s, -0.5 + (i1 * SH.pitch) / SH.w, Math.min(v1, cutV), SH.th / 2 - 0.001), onShield(s, -0.5 + (i0 * SH.pitch) / SH.w, Math.min(v1, cutV), SH.th / 2 - 0.001)]);
    return pp.length >= 3 ? <path d={polyD(pp)} fill={col} opacity={op} /> : null;
  };
  return (
    <g opacity={a}>
      {band(-0.5, 0.5, '#2E4552', 1)}
      {band(-0.05, 0.0, '#FFB23F', 0.9)}
      {band(0.0, 0.08, '#FFB23F', 0.25)}
      {band(0.32, 0.36, '#3FE0D0', 0.8)}
      {band(-0.5, -0.38, '#1A242C', 1)}
      {nodes}
    </g>
  );
};

export const LensSection: React.FC<{id: string; b: Basis; s: ShieldState; cutV: number; a?: number}> = ({id, b, s, cutV, a = 1}) => {
  const {i0, i1, n} = lensIndexRange(b, s, 12);
  const fine = i1 - i0 < 160;
  const prof: V3[] = [];
  const bump = SH.pitch * 0.42;
  const uA = -0.5 + (i0 * SH.pitch) / SH.w, uB = -0.5 + (i1 * SH.pitch) / SH.w;
  if (fine) {
    for (let i = i0; i < i1; i++) {
      for (let k = 0; k <= 8; k++) {
        const f = k / 8;
        const u = -0.5 + ((i + f) * SH.pitch) / SH.w;
        const h = bump * Math.sqrt(Math.max(0, 1 - (2 * f - 1) ** 2));
        prof.push(onShield(s, u, cutV, SH.th / 2 + h));
      }
    }
  } else {
    prof.push(onShield(s, -0.5, cutV, SH.th / 2 + bump * 0.6), onShield(s, 0.5, cutV, SH.th / 2 + bump * 0.6));
  }
  const back = [onShield(s, fine ? uB : 0.5, cutV, -SH.th / 2), onShield(s, fine ? uA : -0.5, cutV, -SH.th / 2)];
  const poly = projPoly(b, [...prof, ...back]);
  if (poly.length < 3) return null;
  const line = prof.map((p) => proj(b, p));
  void n;
  return (
    <g opacity={a}>
      <defs>
        <linearGradient id={`${id}-sg`} gradientUnits="userSpaceOnUse" x1={fmt(proj(b, back[0]).x)} y1={fmt(proj(b, back[0]).y)} x2={fmt(line[0].x)} y2={fmt(line[0].y)}>
          <stop offset="0" stopColor="#8ED6DE" />
          <stop offset="1" stopColor="#D9F7F9" />
        </linearGradient>
      </defs>
      <path d={polyD(poly)} fill={`url(#${id}-sg)`} opacity={0.95} />
      <path d={lineD(line)} fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinejoin="round" />
      <path d={polyD(poly)} fill="none" stroke="#14353E" strokeWidth={1.4} strokeLinejoin="round" />
    </g>
  );
};

// ---- representative light paths in the section plane
export const RAYC = {body: '#FF9A55', bodyGlow: '#FFD2A8', bg: '#3FE6D6', bgGlow: '#A8FFF5'};
export type RayPath = {pts: V3[]; kind: 'body' | 'bg'; a: number; delay: number};
export const lightPaths = (s: ShieldState, y: number, eye: V3): RayPath[] => {
  const zF = s.c.z + SH.th / 2;
  const lensX = (x: number) => {
    const u = (x - s.c.x) / SH.w + 0.5;
    const i = Math.floor((u * SH.w) / SH.pitch);
    return s.c.x - SH.w / 2 + (i + 0.5) * SH.pitch;
  };
  const E = v3(eye.x, y, eye.z);
  const out: RayPath[] = [];
  // her light: from her front, to the lens directly in front, then spread sideways
  [-0.42, -0.55, -0.68].forEach((x, i) => {
    const src = v3(x, y, 2.64);
    const lx = lensX(x);
    const hit = v3(lx, y, zF);
    const fan = i === 0 ? [-72, -58, 58, 72] : [-65, 65];
    fan.forEach((deg, k) => {
      const r = (deg * Math.PI) / 180;
      out.push({pts: [src, hit, v3(lx + Math.sin(r) * 1.8, y, zF + Math.cos(r) * 1.8)], kind: 'body', a: 1, delay: i * 0.08 + k * 0.03});
    });
    if (i === 0) out.push({pts: [src, hit, E], kind: 'body', a: 0.3, delay: 0.15});
  });
  // light from the corridor beside her (walls), reaching the lenses in front of her and bent toward the guard
  ([[v3(-1.6, y, 1.7), -0.62], [v3(-1.6, y, 0.9), -0.7], [v3(1.6, y, 1.2), -0.48], [v3(1.6, y, 0.4), -0.4]] as [V3, number][]).forEach(([src, x], i) => {
    const hit = v3(lensX(x), y, zF);
    out.push({pts: [src, hit, E], kind: 'bg', a: 1, delay: i * 0.07});
  });
  return out;
};
export const LightPaths: React.FC<{b: Basis; paths: RayPath[]; kBody: number; kBg: number; t: number; scale?: number}> = ({b, paths, kBody, kBg, t, scale = 1}) => {
  const nodes: React.ReactNode[] = [];
  paths.forEach((p, i) => {
    const k = clamp(((p.kind === 'body' ? kBody : kBg) - p.delay) / (1 - p.delay));
    if (k <= 0.001) return;
    // draw-on along the polyline (in world space, then projected)
    const seg = p.pts.slice(1).map((q, j) => Math.hypot(q.x - p.pts[j].x, q.z - p.pts[j].z));
    const total = seg.reduce((s0, x) => s0 + x, 0);
    let left = total * k;
    const pts: V3[] = [p.pts[0]];
    for (let j = 0; j < seg.length && left > 0; j++) {
      const f = Math.min(1, left / seg[j]);
      pts.push(a3(p.pts[j], m3(s3(p.pts[j + 1], p.pts[j]), f)));
      left -= seg[j];
    }
    const sp = pts.map((q) => proj(b, q)).filter((q) => q.d > 0.001);
    if (sp.length < 2) return;
    const col = p.kind === 'body' ? RAYC.body : RAYC.bg, glow = p.kind === 'body' ? RAYC.bodyGlow : RAYC.bgGlow;
    const wpx = Math.max(1.6, Math.min(7, 0.006 * sp[sp.length - 1].k)) * scale;
    const d = lineD(sp);
    const head = sp[sp.length - 1], prev = sp[sp.length - 2];
    const ang = Math.atan2(head.y - prev.y, head.x - prev.x);
    const ah = wpx * 3.2;
    nodes.push(
      <g key={i} opacity={p.a}>
        <path d={d} fill="none" stroke={glow} strokeWidth={wpx * 3} strokeOpacity={0.22} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke={col} strokeWidth={wpx} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={wpx * 0.6} strokeLinecap="round" strokeDasharray={`${fmt(wpx * 2)} ${fmt(wpx * 9)}`} strokeDashoffset={fmt(-t * wpx * 40)} opacity={0.7} />
        {k < 0.999 && <path d={`M${fmt(head.x - Math.cos(ang - 0.5) * ah)},${fmt(head.y - Math.sin(ang - 0.5) * ah)} L${fmt(head.x)},${fmt(head.y)} L${fmt(head.x - Math.cos(ang + 0.5) * ah)},${fmt(head.y - Math.sin(ang + 0.5) * ah)}`} fill="none" stroke={col} strokeWidth={wpx} strokeLinecap="round" strokeLinejoin="round" />}
      </g>,
    );
  });
  return <g>{nodes}</g>;
};
export {d3, lerp, n3};
