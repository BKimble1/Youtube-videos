// Screen-space layers: FGW captions (white, key words yellow, the channel's established treatment), compact labels,
// schematic light packets and the subjective closed-eye view. Captions never inherit camera transforms.
import React from 'react';
import {CAPTIONS, clamp, Pt, P, lerp} from './lib';
import {LIGHT} from './theme';

export const FONT = {
  cap: '"Nunito Variable", "Nunito", system-ui, sans-serif',
  label: '"Fredoka Variable", "Fredoka", "Nunito Variable", system-ui, sans-serif',
};
export const YEL = '#FFD84A';
export const CAP = {cy: 1450, size: 68, maxW: 860};

export const Captions: React.FC<{t: number}> = ({t}) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return null;
  const c = CAPTIONS[i];
  const age = t - c.show;
  const a = i === 0 ? 1 : clamp(age / 0.07);
  const pop = 1 + 0.05 * (1 - clamp(age / 0.12));
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left: (1080 - CAP.maxW) / 2 - 20, width: CAP.maxW, top: CAP.cy, transform: `translateY(-50%) scale(${i === 0 ? 1 : pop})`, opacity: a, textAlign: 'center', textWrap: 'balance'} as React.CSSProperties}>
      <span style={{fontFamily: FONT.cap, fontWeight: 900, fontSize: CAP.size, lineHeight: 1.18, letterSpacing: '0.005em', color: '#FFFFFF',
        WebkitTextStroke: '10px rgba(8,10,14,0.92)', paintOrder: 'stroke fill', textShadow: '0 5px 14px rgba(0,0,0,0.55)'} as React.CSSProperties}>
        {words.map((w, k) => {
          const key = w.toLowerCase().replace(/[^a-z']/g, '');
          const hi = c.emph.includes(key);
          return <span key={k} style={{color: hi ? YEL : '#FFFFFF'}}>{(hi ? w.toUpperCase() : w) + (k < words.length - 1 ? ' ' : '')}</span>;
        })}
      </span>
    </div>
  );
};

// compact chip label, anchored by the caller to a world point projected to the screen
export const Chip: React.FC<{text: string; x: number; y: number; a: number; dot: string; size?: number; dashed?: boolean}> = ({text, x, y, a, dot, size = 40, dashed}) => {
  if (a <= 0.001) return null;
  x = clamp(x, 60 + text.length * size * 0.36, 930 - text.length * size * 0.36); // clear of the Shorts action column
  return (
    <div style={{position: 'absolute', left: x - 400, width: 800, top: y - size * 0.75, textAlign: 'center', opacity: a, transform: `translateY(${(1 - a) * 8}px)`}}>
      <span style={{display: 'inline-flex', alignItems: 'center', gap: 14, fontFamily: FONT.label, fontWeight: 600, fontSize: size, letterSpacing: '0.07em', color: '#F2F6F8',
        background: 'rgba(8,14,20,0.74)', border: '2px solid rgba(255,255,255,0.16)', padding: '8px 24px', borderRadius: 999}}>
        <span style={{width: size * 0.62, height: 0, borderTop: `${size * 0.16}px ${dashed ? 'dashed' : 'solid'} ${dot}`, display: 'inline-block'}} />
        {text}
      </span>
    </div>
  );
};

// ---------- light packets (screen space) ----------
export type Kind = 'ir' | 'vis' | 'green';
const STY: Record<Kind, {col: string; glow: string; lam: number; amp: number; w: number; dash?: string}> = {
  ir: {col: LIGHT.ir, glow: LIGHT.irGlow, lam: 78, amp: 17, w: 6, dash: '15 11'},
  vis: {col: LIGHT.vis, glow: '#FFE07A', lam: 46, amp: 15, w: 6},
  green: {col: LIGHT.green, glow: LIGHT.greenGlow, lam: 34, amp: 14, w: 6.5},
};
// a wave packet whose head sits at arc distance `d` (px) along a screen polyline, `len` px long
export const Packet: React.FC<{pts: Pt[]; d: number; kind: Kind; len?: number; a?: number; scale?: number}> = ({pts, d, kind, len = 200, a = 1, scale = 1}) => {
  if (a <= 0.003 || pts.length < 2) return null;
  const st = STY[kind];
  const seg: number[] = [0];
  for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = seg[seg.length - 1];
  const at = (s: number) => {
    s = clamp(s, 0, total);
    let i = 1;
    while (i < seg.length - 1 && seg[i] < s) i++;
    const u = (s - seg[i - 1]) / Math.max(1e-6, seg[i] - seg[i - 1]);
    const A = pts[i - 1], B = pts[i];
    const dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1;
    return {p: P(A.x + dx * u, A.y + dy * u), n: P(-dy / l, dx / l)};
  };
  const L = len * scale, head = d, tail = d - L;
  if (head < 0 || tail > total) return null;
  const out: string[] = [];
  const n = 48;
  for (let k = 0; k <= n; k++) {
    const s = lerp(tail, head, k / n);
    if (s < 0 || s > total) continue;
    const {p, n: nn} = at(s);
    const env = Math.sin(Math.PI * (k / n)) ** 0.8;
    const off = Math.sin(((s - head) / (st.lam * scale)) * Math.PI * 2) * st.amp * scale * env;
    out.push(`${out.length ? 'L' : 'M'}${(p.x + nn.x * off).toFixed(1)} ${(p.y + nn.y * off).toFixed(1)}`);
  }
  const dstr = out.join('');
  return (
    <g opacity={a}>
      <path d={dstr} fill="none" stroke={st.glow} strokeWidth={st.w * 3.2 * scale} strokeOpacity={0.28} strokeLinecap="round" />
      <path d={dstr} fill="none" stroke={st.col} strokeWidth={st.w * scale} strokeLinecap="round" strokeDasharray={st.dash} />
    </g>
  );
};
export const polyLen = (pts: Pt[]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);

// ---------- the subjective closed-eye view: darkness, and a diffuse green flash ----------
export const Inset: React.FC<{c: Pt; r: number; flash: number; id: string; tail?: Pt}> = ({c, r, flash, id, tail}) => {
  if (r < 1) return null;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-dark`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#2A1517" />
          <stop offset="0.75" stopColor="#170B0D" />
          <stop offset="1" stopColor="#0B0506" />
        </radialGradient>
        <radialGradient id={`${id}-fl`} cx="0.52" cy="0.48" r="0.5">
          <stop offset="0" stopColor={LIGHT.greenGlow} stopOpacity={0.95} />
          <stop offset="0.35" stopColor={LIGHT.green} stopOpacity={0.6} />
          <stop offset="1" stopColor={LIGHT.greenDeep} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx={c.x} cy={c.y} r={r} />
        </clipPath>
      </defs>
      {tail && (
        <path d={`M${c.x - r * 0.42} ${c.y + r * 0.9} L${tail.x} ${tail.y} L${c.x + r * 0.05} ${c.y + r * 0.99} Z`} fill="#0B0506" stroke="#FAF3DF" strokeWidth={5} strokeLinejoin="round" />
      )}
      <circle cx={c.x} cy={c.y} r={r + 8} fill="#000" opacity={0.25} />
      <g clipPath={`url(#${id}-clip)`}>
        <circle cx={c.x} cy={c.y} r={r} fill={`url(#${id}-dark)`} />
        {flash > 0.002 && <circle cx={c.x + r * 0.04} cy={c.y - r * 0.04} r={r * lerp(0.75, 1.15, flash)} fill={`url(#${id}-fl)`} opacity={flash} />}
      </g>
      <circle cx={c.x} cy={c.y} r={r} fill="none" stroke="#FAF3DF" strokeWidth={7} />
    </g>
  );
};
// a soft pulse envelope: quick attack, smooth release
export const pulse = (t: number, at: number, len: number) => {
  if (t < at || t > at + len + 0.35) return 0;
  const a = Math.sin((Math.PI / 2) * clamp((t - at) / 0.1)); // soft attack: no strobe
  const r = t > at + len ? 1 - clamp((t - at - len) / 0.35) : 1;
  return a * r * r;
};
