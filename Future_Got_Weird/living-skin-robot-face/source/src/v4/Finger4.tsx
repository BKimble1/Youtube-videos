// V4 finger world: everything from the push-in to the joint reveal happens on ONE finger drawing (V1's FingerSide), so
// the incision, the graft and the repair stay on the same surface and wound. The close views use the same light
// elevated look as V3's patch view: a point at angle phi around the finger (0 = the top line, + toward the lens) sits at
// k = cos(phi + E4) of the profile. The incision runs across the top of the middle segment; the microscopic repair is a
// local longitudinal section through the graft, opened in place (V3's RepairMicro3 drawing, mapped onto the finger at
// the scale where its graft spans the patch).
import React from 'react';
import {Pt, lerp, clamp, smooth, path, rnd} from '../lib';
import {FK, FS, Scalpel, Tweezers, fingerFrame} from '../art/Finger';
import {RepairMicro3, RP3} from '../v3/Repair3';
import {DERM, tc} from '../v2/Tissue2';

export const E4 = 0.62;
const LT = FS.L[0] + FS.L[1] + FS.L[2];
export const radAt = (s: number) => lerp(FS.r0, FS.r1, clamp(s / LT));
// point at arc s, offset k radii, interpolated between the rig's 3-unit centreline samples (no stepping)
const frameCache = new Map<string, {x: number; y: number; a: number}[]>();
export const fp = (s: number, k: number, th: number[]) => {
  const key = th.map((v) => v.toFixed(5)).join(',');
  let c = frameCache.get(key);
  if (!c) { c = fingerFrame(LT, th); if (frameCache.size > 64) frameCache.clear(); frameCache.set(key, c); }
  const q = clamp(s / 3, 0, c.length - 1.001), i = Math.floor(q), f = q - i;
  const p0 = c[i], p1 = c[Math.min(c.length - 1, i + 1)];
  const x = lerp(p0.x, p1.x, f), y = lerp(p0.y, p1.y, f), a = lerp(p0.a, p1.a, f), r = radAt(s);
  return {x: x + Math.sin(a) * r * k, y: y - Math.cos(a) * r * k};
};
export const SW = FS.sw, PH = FS.patchHalf;
export const SIG = PH / RP3.gw; // finger units per micro unit
export const COVw = (0.36 * radAt(SW)) / SIG; // covering thickness in micro units
// point on the surface at arc s, angle phi, radius factor rr
export const fpe = (s: number, phi: number, th: number[], rr = 1) => fp(s, rr * Math.cos(phi + E4), th);
export const upAt = (s: number, up: number, th: number[]) => fp(s, up / radAt(s), th);
export const frameAt = (s: number, th: number[]) => {
  const a = fp(s - 1, 0, th), b = fp(s + 1, 0, th), l = Math.hypot(b.x - a.x, b.y - a.y);
  const tx = (b.x - a.x) / l, ty = (b.y - a.y) / l;
  return {o: fp(s, 0, th), t: {x: tx, y: ty}, up: {x: ty, y: -tx}};
};
// micro (u along the finger, w into the covering from the top line) -> finger world
export const microAffine = (th: number[]) => {
  const f = frameAt(SW, th), h = radAt(SW) * Math.cos(E4);
  const o = {x: f.o.x + f.up.x * h, y: f.o.y + f.up.y * h};
  return {a: f.t.x * SIG, b: f.t.y * SIG, c: -f.up.x * SIG, d: -f.up.y * SIG, e: o.x, f: o.y};
};
export const microPt = (u: number, w: number, th: number[]): Pt => { const M = microAffine(th); return {x: M.a * u + M.c * w + M.e, y: M.b * u + M.d * w + M.f}; };

// ---------- the incision: across the top line, cut from the far side toward the lens ----------
const PHI0 = -0.34, PHI1 = 0.5;
export const slitTip = (cut: number, th: number[]) => fpe(SW, lerp(PHI0, PHI1, cut), th);
export const Slit: React.FC<{th: number[]; cut: number; open: number; press: number; integ: number}> = ({th, cut, open, press, integ}) => {
  const hw = 5.2 * open * (1 - 0.8 * integ); // half-width at full opening (the micro gap at the surface)
  const pe = lerp(PHI0, PHI1, cut);
  // the wound gapes most in the middle and closes to points at both ends; behind the blade it opens progressively
  const prof = (phi: number) => { const q = (phi - PHI0) / (PHI1 - PHI0); return Math.pow(Math.sin(Math.PI * clamp(q)), 0.85) * clamp((pe - phi) / 0.18); };
  const lens = (g: number) => {
    const n = 22, a: Pt[] = [], b: Pt[] = [];
    for (let i = 0; i <= n; i++) { const phi = lerp(PHI0, pe, i / n), w = g * hw * prof(phi); a.push(fp(SW - w, Math.cos(phi + E4), th)); b.push(fp(SW + w, Math.cos(phi + E4), th)); }
    return smooth([...a, ...b.reverse()], true, 0.12);
  };
  const line = (o: number) => smooth(Array.from({length: 12}, (_, i) => { const phi = lerp(PHI0, pe, i / 11); return fp(SW + o * (hw * prof(phi) + 0.5), Math.cos(phi + E4), th); }));
  const c = fpe(SW, PHI0, th);
  return (
    <g>
      {press > 0 && <ellipse cx={c.x} cy={c.y + 0.4} rx={2.2 * press} ry={1.1 * press} fill={FK.skinDeep} opacity={0.4 * press} />}
      {cut > 0.005 && (
        <g opacity={1 - 0.3 * integ}>
          {/* lips: a little raised and lit where the covering parts */}
          {open > 0.05 && [-1, 1].map((o) => <path key={o} d={line(o)} fill="none" stroke="#FBE3D9" strokeWidth={0.7} strokeLinecap="round" opacity={0.6 * open} />)}
          <path d={lens(1)} fill={FK.skinDeep} stroke={FK.skinDeep} strokeWidth={0.45} strokeLinejoin="round" />
          {open > 0.05 && <path d={lens(0.72)} fill="#C98C86" />}
          {open > 0.05 && <path d={lens(0.34)} fill="#E9B8A9" opacity={0.85} />}
          <path d={smooth(Array.from({length: 12}, (_, i) => fpe(SW, lerp(PHI0, pe, i / 11), th)))} fill="none" stroke="#7E4A4E" strokeWidth={0.45} opacity={0.7 * (1 - integ)} />
        </g>
      )}
    </g>
  );
};

// ---------- the graft: a fibrous collagen sheet, held flat by the tweezers, bending onto the surface on contact ----------
const FIB = Array.from({length: 90}, (_, k) => { const cross = k % 4 === 0; return {x0: -1.15 + rnd(k + 3) * (cross ? 2.1 : 1.6), v0: -1.05 + rnd(k + 60) * 2.0, dx: cross ? 0.03 + rnd(k + 120) * 0.02 : 0.06 + rnd(k + 120) * 0.05, dv: cross ? (rnd(k + 180) > 0.5 ? 1 : -1) * (0.07 + rnd(k + 240) * 0.05) : (rnd(k + 180) - 0.5) * 0.05}; });
export const graftPt = (x: number, v: number, th: number[], st: {drop: number; contact: number; settle: number; off: Pt}): Pt => {
  const {drop, contact, settle, off} = st;
  const s = SW + x * PH, r = radAt(s), c = r / 260; // V3 patch-view units -> finger units
  const front = lerp(-1.15, 1.15, contact);
  const lifted = (1 - drop) * 190 * c + 26 * c * (x + 1) * (1 - contact) * drop;
  const ahead = clamp((x - front) / 0.5);
  const lift = contact >= 1 ? 0 : lifted * (drop < 1 ? 1 : ahead);
  const wrap = clamp(drop * 1.15 - 0.15) * (0.55 + 0.45 * (1 - ahead));
  const ripple = settle * 1.6 * c * Math.sin(x * 5 + settle * 9) * (1 - Math.abs(v));
  const phi = v * 0.5 + 0.03 * Math.sin(x * 7 + v * 3);
  const onUp = (r + 0.5) * Math.cos(phi + E4);
  const flatUp = (r + 0.5) * (Math.cos(E4) - v * 0.5 * Math.sin(E4));
  const p = upAt(s, lerp(flatUp, onUp, wrap) + lift + ripple, th);
  return {x: p.x + off.x, y: p.y + off.y};
};
export const Graft4: React.FC<{th: number[]; id: string; drop: number; contact: number; settle: number; integ: number; off?: Pt; a?: number}> = ({th, id, drop, contact, settle, integ, off = {x: 0, y: 0}, a = 1}) => {
  if (a <= 0.001) return null;
  const st = {drop, contact, settle, off};
  const gp = (x: number, v: number) => graftPt(x, v, th, st);
  const sheet: Pt[] = [];
  for (let i = 0; i <= 18; i++) sheet.push(gp(lerp(-1, 1, i / 18) + 0.02 * Math.sin(i * 2.3), -1 - 0.04 * Math.sin(i * 1.7)));
  for (let i = 0; i <= 10; i++) sheet.push(gp(1 + 0.03 * Math.sin(i * 2.1), lerp(-1, 1, i / 10)));
  for (let i = 18; i >= 0; i--) sheet.push(gp(lerp(-1, 1, i / 18) + 0.02 * Math.sin(i * 1.9), 1 + 0.04 * Math.sin(i * 2.9)));
  for (let i = 10; i >= 0; i--) sheet.push(gp(-1 + 0.03 * Math.sin(i * 2.7), lerp(-1, 1, i / 10)));
  const wet = clamp(contact * 1.2);
  const front = lerp(-1.15, 1.15, contact);
  // soft shadow on the skin under the sheet, tightening as it comes down
  const sh = Array.from({length: 24}, (_, i) => { const q = (i / 24) * Math.PI * 2; return fpe(SW + PH * 1.08 * Math.cos(q) + 6 * (1 - drop), 0.55 * Math.sin(q) * (1 + 0.5 * (1 - drop)), th); });
  return (
    <g opacity={a}>
      <defs><clipPath id={`${id}-sh`}><path d={smooth(sheet, true, 0.08)} /></clipPath></defs>
      {drop > 0 && <path d={smooth(sh, true)} fill="#5A2E2E" opacity={0.18 * drop * (1 - 0.6 * wet) * (1 - integ)} />}
      <path d={smooth(sheet, true, 0.08)} fill={integ > 0 ? '#F8E3DA' : FK.patch} opacity={lerp(lerp(0.36, 0.24, wet), 0.3, integ)} />
      <g clipPath={`url(#${id}-sh)`}>
        {FIB.map((f, k) => <path key={k} d={smooth(Array.from({length: 7}, (_, i) => gp(clamp(f.x0 + i * f.dx, -1.08, 1.08), clamp(f.v0 + i * f.dv + 0.05 * Math.sin(i * 1.3 + k), -1.08, 1.08))))} fill="none" stroke={k % 3 ? '#FFFFFF' : '#E3F1F2'} strokeWidth={k % 4 ? 0.2 : 0.34} opacity={(k % 3 ? 0.42 : 0.3) * (1 - 0.45 * integ)} />)}
        {wet > 0 && integ < 1 && <path d={smooth(Array.from({length: 11}, (_, i) => gp(lerp(-1, Math.min(1, front), i / 10), -0.35)))} fill="none" stroke="#FFFFFF" strokeWidth={1} strokeLinecap="round" opacity={0.45 * wet * (1 - integ)} />}
      </g>
      <path d={smooth(sheet, true, 0.08)} fill="none" stroke={integ > 0 ? '#FBEFEA' : FK.patchEdge} strokeWidth={0.42} strokeDasharray={integ > 0.5 ? '1.2 1' : undefined} opacity={lerp(0.85, 0.6, integ)} />
      {/* the sheet's thickness, seen along its far edge */}
      {integ < 1 && <path d={smooth(Array.from({length: 13}, (_, i) => gp(lerp(-1, 1, i / 12), -1.02)))} fill="none" stroke="#FFFFFF" strokeWidth={0.9} strokeLinecap="round" opacity={0.5 * (1 - integ)} />}
    </g>
  );
};

// ---------- local longitudinal section through the graft, opened in place ----------
export const Section4: React.FC<{th: number[]; W: number; t: number; p: number; tone: number; id: string; heroGlow: number; vis: [number, number]}> = ({th, W, t, p, tone, id, heroGlow, vis}) => {
  if (W <= 0.05) return null;
  const M = microAffine(th);
  const r = radAt(SW), uw = W / SIG, top = -135, bot = (r * (1 + Math.cos(E4))) / SIG;
  const axis = (r * Math.cos(E4)) / SIG, core0 = COVw;
  const C = tc(tone);
  return (
    <g transform={`matrix(${M.a} ${M.b} ${M.c} ${M.d} ${M.e} ${M.f})`}>
      <defs>
        <clipPath id={`${id}-win`}><rect x={-uw} y={top} width={2 * uw} height={bot - top} /></clipPath>
        <clipPath id={`${id}-cov`}><rect x={-uw} y={top} width={2 * uw} height={core0 - top} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-win)`}>
        {/* the finger's interior, as in its joint cutaway: dark cavity, the segment's metal link along the axis */}
        <rect x={-uw} y={core0} width={2 * uw} height={bot - core0 + 40} fill="#151B21" />
        <rect x={-uw - 40} y={axis - 190} width={2 * uw + 80} height={380} rx={60} fill={FK.metal} />
        <line x1={-uw} y1={axis - 95} x2={uw} y2={axis - 95} stroke={FK.metalHi} strokeWidth={42} strokeLinecap="round" opacity={0.7} />
        <line x1={-uw} y1={axis + 275} x2={uw} y2={axis + 275} stroke="#C9D2DA" strokeWidth={32} opacity={0.8} />
        {/* inner face of the covering on the far side */}
        <rect x={-uw} y={bot - COVw * 0.45} width={2 * uw} height={COVw} fill={FK.inner} />
        <g clipPath={`url(#${id}-cov)`}><RepairMicro3 p={p} t={t} tone={tone} id={id} heroGlow={heroGlow} vis={vis} graftAlpha={lerp(0.55, 0.88, tone)} blend /></g>
        <rect x={-uw} y={core0} width={2 * uw} height={10} fill={C.matrixDeep} opacity={0.5} />
      </g>
      {/* cut edges, drawn like the joint cutaway's */}
      <path d={`M${-uw} ${top + 40}V${bot}M${uw} ${top + 40}V${bot}`} stroke={FK.skinDeep} strokeWidth={42} fill="none" opacity={0.9} />
    </g>
  );
};

export {Scalpel, Tweezers};
