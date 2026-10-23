// V3 light paths in the section plane, shown as light rather than as diagram arrows: each ray draws on at the speed
// its light would travel in the animation, as a thin glowing line, with bright pulses moving along it (no arrowheads,
// no dashes, no labels). Only five rays: two from her front, which the lens fans out sideways (away from the guard's
// line), and three from the corridor behind and beside her, which pass beside her body, enter lenses in front of her
// and are bent across to the guard's eye: he sees the corridor where she is.
import React from 'react';
import {clamp} from '../lib/math';
import {a3, Basis, fmt, lineD, m3, proj, s3, V3, v3} from '../v2/p3';
import {SH, ShieldState} from '../v2/Shield3';

export type Ray = {pts: V3[]; kind: 'body' | 'bg'; a: number; delay: number};
export const RAYC = {body: '#FF9A55', bodyGlow: '#FFD2A8', bg: '#3FE6D6', bgGlow: '#A8FFF5'};

export const rays3 = (s: ShieldState, y: number, eye: V3): Ray[] => {
  const zF = s.c.z + SH.th / 2;
  const lensX = (x: number) => {
    const u = (x - s.c.x) / SH.w + 0.5;
    const i = Math.floor((u * SH.w) / SH.pitch);
    return s.c.x - SH.w / 2 + (i + 0.5) * SH.pitch;
  };
  const E = v3(eye.x, y, eye.z);
  const out: Ray[] = [];
  [[-0.47, [-64, 61]], [-0.63, [-60, 66]]].forEach(([x, fan], i) => {
    const src = v3(x as number, y, 2.66);
    const lx = lensX(x as number);
    const hit = v3(lx, y, zF);
    (fan as number[]).forEach((deg, k) => {
      const r = (deg * Math.PI) / 180;
      out.push({pts: [src, hit, v3(lx + Math.sin(r) * 2.2, y, zF + Math.cos(r) * 2.2)], kind: 'body', a: 1, delay: i * 0.12 + k * 0.05});
    });
  });
  // the faint remainder that does reach him (the panel is not a perfect cloak)
  out.push({pts: [v3(-0.55, y, 2.66), v3(lensX(-0.55), y, zF), E], kind: 'body', a: 0.22, delay: 0.3});
  ([[v3(-1.58, y, 1.2), -0.66], [v3(-1.1, y, -1.5), -0.5], [v3(1.58, y, 0.9), -0.42]] as [V3, number][]).forEach(([src, x], i) => {
    out.push({pts: [src, v3(lensX(x), y, zF), E], kind: 'bg', a: 1, delay: i * 0.12});
  });
  return out;
};

export const Rays3: React.FC<{b: Basis; rays: Ray[]; kBody: number; kBg: number; t: number; fade?: number}> = ({b, rays, kBody, kBg, t, fade = 1}) => {
  const nodes: React.ReactNode[] = [];
  rays.forEach((r, i) => {
    const k = clamp(((r.kind === 'body' ? kBody : kBg) - r.delay) / (1 - r.delay));
    if (k <= 0.001) return;
    const seg = r.pts.slice(1).map((q, j) => Math.hypot(q.x - r.pts[j].x, q.z - r.pts[j].z));
    const total = seg.reduce((s0, x) => s0 + x, 0);
    const along = (d: number): V3 => {
      let left = d;
      for (let j = 0; j < seg.length; j++) {
        if (left <= seg[j]) return a3(r.pts[j], m3(s3(r.pts[j + 1], r.pts[j]), left / seg[j]));
        left -= seg[j];
      }
      return r.pts[r.pts.length - 1];
    };
    const reach = total * k;
    const pts: V3[] = [r.pts[0]];
    let acc = 0;
    for (let j = 0; j < seg.length && acc + seg[j] < reach; j++) { acc += seg[j]; pts.push(r.pts[j + 1]); }
    pts.push(along(reach));
    const sp = pts.map((q) => proj(b, q)).filter((q) => q.d > 0.001);
    if (sp.length < 2) return;
    const col = r.kind === 'body' ? RAYC.body : RAYC.bg, glow = r.kind === 'body' ? RAYC.bodyGlow : RAYC.bgGlow;
    const wpx = Math.max(1.4, Math.min(6, 0.005 * sp[sp.length - 1].k));
    const d = lineD(sp);
    // pulses: travel the drawn part of the ray at a steady speed
    const pulses: React.ReactNode[] = [];
    const speed = 1.6, gap = 0.55;
    for (let q = 0; q < 6; q++) {
      const dd = ((t * speed + q * gap + i * 0.17) % (gap * 6));
      if (dd > reach) continue;
      const p = proj(b, along(dd));
      if (p.d <= 0.001) continue;
      const pr = wpx * 1.9;
      pulses.push(<circle key={q} cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(pr)} fill="#FFFFFF" opacity={0.85} />);
      pulses.push(<circle key={`g${q}`} cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(pr * 3)} fill={glow} opacity={0.25} />);
    }
    nodes.push(
      <g key={i} opacity={r.a * fade}>
        <path d={d} fill="none" stroke={glow} strokeWidth={wpx * 3.4} strokeOpacity={0.18} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke={col} strokeWidth={wpx} strokeLinecap="round" strokeLinejoin="round" />
        <g style={{mixBlendMode: 'screen'}}>{pulses}</g>
      </g>,
    );
  });
  return <g>{nodes}</g>;
};
