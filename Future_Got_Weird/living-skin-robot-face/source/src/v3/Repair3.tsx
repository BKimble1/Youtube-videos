// V3 repair, microscope-style (2022 study, simplified). Same narrow cut under the grafted acellular collagen sheet.
// Cell migration is an illustrated cycle per cell, each on its own schedule (no lockstep):
//   1 a broad, thin protrusion extends into the matrix (continuous with the body, slightly to one side),
//   2 contact forms at its edge (small adhesion points),
//   3 the body and nucleus advance,
//   4 the trailing edge releases (a short retraction fibre) and follows.
// Cells move only along paths through tissue/graft matrix and end INSIDE the graft's volume: the graft is drawn as a
// back layer (fill, rear fibres) and a front layer (front fibres over the cells).
import React from 'react';
import {Pt, lerp, clamp, eio, eout, ein, path, smooth, rnd} from '../lib';
import {TissueSection, TMap, Cell, tc, DERM} from '../v2/Tissue2';

export const RP3 = {gap: 60, depth: 130, gw: 380, gh: 92, shrink: 0.5};
const gapHalf = (w: number) => Math.max(0, RP3.gap * (1 - w / RP3.depth));
export const repairMap3 = (p: number): TMap => (u, w) => {
  const D = RP3.gap * RP3.shrink * p;
  const a = Math.abs(u);
  const k = clamp(1 - Math.max(0, a - gapHalf(Math.max(0, w))) / 420) * clamp(1 - Math.max(0, w) / 260 + 0.15);
  return {x: u - Math.tanh(u / 90) * D * k, y: w};
};
type Mig = {pts: Pt[]; d: number; dur: number; L: number; Wd: number; cyc: number; asym: number; ph: number};
export const MIG3: Mig[] = [
  {pts: [{x: -250, y: 64}, {x: -190, y: 36}, {x: -130, y: 12}, {x: -70, y: -20}, {x: 0, y: -44}, {x: 80, y: -54}], d: 0.08, dur: 0.78, L: 66, Wd: 28, cyc: 5, asym: 1, ph: 0.4}, // hero
  {pts: [{x: 250, y: 60}, {x: 186, y: 32}, {x: 124, y: 8}, {x: 66, y: -24}, {x: 0, y: -66}], d: 0.3, dur: 0.6, L: 62, Wd: 26, cyc: 4, asym: -1, ph: 1.7},
  {pts: [{x: -372, y: 38}, {x: -318, y: 14}, {x: -266, y: -14}, {x: -200, y: -44}, {x: -126, y: -64}], d: 0.4, dur: 0.54, L: 60, Wd: 25, cyc: 4, asym: 1, ph: 2.6},
  {pts: [{x: 372, y: 34}, {x: 322, y: 10}, {x: 274, y: -18}, {x: 214, y: -46}, {x: 160, y: -70}], d: 0.47, dur: 0.5, L: 60, Wd: 24, cyc: 4, asym: -1, ph: 3.3},
  {pts: [{x: -150, y: 150}, {x: -104, y: 122}, {x: -58, y: 94}, {x: -18, y: 64}], d: 0.36, dur: 0.52, L: 58, Wd: 24, cyc: 3, asym: -1, ph: 4.1},
  {pts: [{x: 156, y: 156}, {x: 108, y: 130}, {x: 58, y: 102}, {x: 14, y: 74}], d: 0.52, dur: 0.44, L: 58, Wd: 23, cyc: 3, asym: 1, ph: 5.2},
];
const sampler = (ctrl: Pt[]) => {
  const pts: Pt[] = [];
  const n = ctrl.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(n - 1, i + 2)];
    for (let k = 0; k < 24; k++) {
      const t = k / 24, t2 = t * t, t3 = t2 * t;
      pts.push({x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)});
    }
  }
  pts.push(ctrl[n - 1]);
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = L[L.length - 1];
  const at = (s: number) => {
    // beyond the ends, extrapolate along the end tangents (keeps the outline smooth at path ends)
    const ss = clamp(s, 0, total - 0.01);
    let i = 1; while (L[i] < ss) i++;
    const f = (ss - L[i - 1]) / (L[i] - L[i - 1]);
    const tx = pts[i].x - pts[i - 1].x, ty = pts[i].y - pts[i - 1].y, tl = Math.hypot(tx, ty) || 1;
    const p = {x: lerp(pts[i - 1].x, pts[i].x, f) + (tx / tl) * (s - ss), y: lerp(pts[i - 1].y, pts[i].y, f) + (ty / tl) * (s - ss)};
    return {p, t: {x: tx / tl, y: ty / tl}};
  };
  return {at, total};
};
const SAMP3 = MIG3.map((m) => sampler(m.pts));
// migration cycle state along the path (arc positions of rear R, nucleus N, front F) for progress k
export const cycle = (m: Mig, total: number, k: number) => {
  const travel = Math.max(10, total - m.L), step = travel / m.cyc;
  const q = clamp(k) * m.cyc, c = Math.min(m.cyc - 1, Math.floor(q)), f = k >= 1 ? 1 : q - c;
  const eF = eout(clamp(f / 0.35)), eN = eio(clamp((f - 0.38) / 0.37)), eR = ein(clamp((f - 0.62) / 0.38));
  const base = c * step;
  const F = base + m.L + step * eF, N = base + m.L * 0.42 + step * eN, R = base + step * eR;
  return {F, N, R, contact: k > 0 && k < 1 ? clamp((f - 0.28) / 0.1) * (1 - clamp((f - 0.7) / 0.15)) : 0, release: k > 0 && k < 1 && f > 0.6 && f < 0.82 ? 1 - Math.abs((f - 0.71) / 0.11) : 0, moving: k > 0 && k < 1};
};
export const migState3 = (p: number) => MIG3.map((m, j) => { const sm = SAMP3[j]; const k = clamp((p - m.d) / m.dur); return {m, sm, k, ...cycle(m, sm.total, k)}; });

const MigCell: React.FC<{s: ReturnType<typeof migState3>[number]; map: TMap; C: ReturnType<typeof tc>; id: string; t: number; glow: number}> = ({s, map, C, id, t, glow}) => {
  const {sm, F, N, R, m} = s;
  const len = F - R, half = m.Wd / 2;
  // outline in cell coordinates (arc position along the path, signed distance from it): a thin trailing tail, a body
  // around the nucleus, a narrower neck, then a broad fan-shaped leading lamella with a rounded, ruffled edge. One side
  // of the fan is larger (asymmetric) and a short side protrusion grows out of the body on the other side.
  const fan = half * 1.6, A = fan * 0.95; // fan half-width and the depth of its rounded leading edge
  const qa = clamp(1 - A / len, 0.5, 0.92), nq = clamp((N - R) / len, 0.2, qa - 0.12), neck = lerp(nq, qa, 0.45);
  const base = (q: number) => {
    if (q < nq) return half * (0.1 + 0.9 * Math.pow(q / nq, 0.6));
    if (q < neck) return half * (1 - 0.3 * eio((q - nq) / (neck - nq)));
    return half * lerp(0.7, fan / half, Math.sin((Math.PI / 2) * clamp((q - neck) / (qa - neck))));
  };
  const big = m.asym > 0 ? 1 : -1;
  const lobe = 0.35 + 0.65 * Math.sin(Math.PI * clamp(((s.k * m.cyc) % 1) / 0.75)); // side protrusion extends, then retracts
  const qL = clamp(nq + 0.08, 0, 1);
  const side = (q: number, sg: number) => {
    const fanSide = q > neck ? (sg === big ? 1.12 : 0.86) : 1;
    const bump = sg !== big ? half * 0.75 * lobe * Math.exp(-(((q - qL) / 0.07) ** 2)) : 0;
    return base(q) * lerp(1, fanSide, clamp((q - neck) / (qa - neck))) + bump;
  };
  const pt = (q: number, n: number) => { const a2 = sm.at(R + q * len), nn = {x: -a2.t.y, y: a2.t.x}; return map(a2.p.x + nn.x * n, a2.p.y + nn.y * n); };
  const NS = 30, top: Pt[] = [], bot: Pt[] = [];
  for (let i = 0; i <= NS; i++) { const q = (i / NS) * qa; top.push(pt(q, side(q, 1))); bot.push(pt(q, -side(q, -1))); }
  const wt = side(qa, 1), wb = side(qa, -1), cOff = (wt - wb) / 2, cW = (wt + wb) / 2;
  const ca = sm.at(R + qa * len), cn = {x: -ca.t.y, y: ca.t.x};
  const cap: Pt[] = [];
  for (let i = 1; i < 14; i++) {
    const th = -Math.PI / 2 + (Math.PI * i) / 14, ruf = 1 + 0.04 * Math.sin(th * 5 + t * 1.6 + m.ph);
    const along = Math.cos(th) * A * ruf, across = cOff + Math.sin(th) * cW * ruf;
    cap.push(map(ca.p.x + ca.t.x * along + cn.x * across, ca.p.y + ca.t.y * along + cn.y * across));
  }
  const body = [...top, ...[...cap].reverse(), ...[...bot].reverse()];
  // thin leading lamella (lighter): the fan beyond the neck, bounded behind by a soft arc
  const lam: Pt[] = [];
  for (let i = 0; i <= 8; i++) { const q = lerp(neck + 0.06, qa, i / 8); lam.push(pt(q, side(q, 1) * 0.9)); }
  lam.push(...[...cap].reverse().map((p) => ({x: lerp(p.x, map(ca.p.x, ca.p.y).x, 0.1), y: lerp(p.y, map(ca.p.x, ca.p.y).y, 0.1)})));
  for (let i = 8; i >= 0; i--) { const q = lerp(neck + 0.06, qa, i / 8); lam.push(pt(q, -side(q, -1) * 0.9)); }
  const na = sm.at(N), nn = {x: -na.t.y, y: na.t.x};
  const nuc = Array.from({length: 16}, (_, i) => { const a2 = (i / 16) * Math.PI * 2; return map(na.p.x + na.t.x * Math.cos(a2) * half * 0.78 + nn.x * Math.sin(a2) * half * 0.52, na.p.y + na.t.y * Math.cos(a2) * half * 0.78 + nn.y * Math.sin(a2) * half * 0.52); });
  const sc = Math.hypot(map(10, 0).x - map(0, 0).x, map(10, 0).y - map(0, 0).y) / 10;
  const adh = [-0.6, -0.2, 0.2, 0.6].map((f) => { const along = A * 0.55 * Math.cos(f), across = cOff + f * cW; return map(ca.p.x + ca.t.x * along + cn.x * across, ca.p.y + ca.t.y * along + cn.y * across); });
  const ra = sm.at(R);
  const trail = [map(ra.p.x, ra.p.y), map(ra.p.x - ra.t.x * 18, ra.p.y - ra.t.y * 18)];
  return (
    <g>
      {glow > 0 && <path d={smooth(body, true, 0.12)} fill="none" stroke="#BFF7F2" strokeWidth={6 * sc} opacity={0.4 * glow} />}
      <path d={smooth(body, true, 0.12)} fill={`url(#${id}-cy)`} stroke={C.cytoEdge} strokeWidth={1.2 * sc} />
      <path d={smooth(lam, true, 0.12)} fill="#FFFFFF" opacity={0.2} />
      <path d={smooth(nuc, true)} fill={`url(#${id}-nu)`} stroke={C.nucleolus} strokeWidth={0.9 * sc} />
      {s.release > 0 && <line x1={trail[0].x} y1={trail[0].y} x2={trail[1].x} y2={trail[1].y} stroke={C.cytoEdge} strokeWidth={1.1 * sc} opacity={0.7 * s.release} />}
      {s.contact > 0 && adh.map((a2, k) => <circle key={k} cx={a2.x} cy={a2.y} r={1.4 * sc} fill={C.cytoEdge} opacity={0.75 * s.contact} />)}
    </g>
  );
};

const graftFibres = (n: number, seed: number) => Array.from({length: n}, (_, k) => ({w0: -RP3.gh + 6 + rnd(seed + k) * (RP3.gh - 12), u0: -RP3.gw + rnd(seed + 40 + k) * (2 * RP3.gw - 120), len: 140 + rnd(seed + 80 + k) * 240, tilt: (rnd(seed + 120 + k) - 0.5) * 0.18, amp: 2 + rnd(seed + 160 + k) * 4}));
const GB = graftFibres(46, 300), GF = graftFibres(16, 700);

export const RepairMicro3: React.FC<{p: number; t: number; tone: number; id: string; heroGlow?: number; vis?: [number, number]}> = ({p, t, tone, id, heroGlow = 0, vis = [-1400, 1400]}) => {
  const C = tc(tone);
  const m = repairMap3(p);
  const st = migState3(p);
  const origins = MIG3.map((g) => g.pts[0]);
  const keep = (c: Cell) => !(Math.abs(c.u) < gapHalf(c.w) + 34) && !(c.w < 34 && Math.abs(c.u) < RP3.gw + 40) && !c.hero && !origins.some((o) => Math.hypot(o.x - c.u, o.y - c.w) < 90);
  const fill = clamp(p * 1.15 - 0.1);
  const gapPoly: Pt[] = [];
  for (let i = 0; i <= 12; i++) { const w = (i / 12) * RP3.depth; gapPoly.push(m(-gapHalf(w), w)); }
  for (let i = 12; i >= 0; i--) { const w = (i / 12) * RP3.depth; gapPoly.push(m(gapHalf(w), w)); }
  const gw = RP3.gw, gh = RP3.gh;
  const edge = (sgn: number) => Array.from({length: 26}, (_, i) => { const u = lerp(-gw, gw, i / 25); return m(u, sgn < 0 ? -gh + 5 * Math.sin(u * 0.045) + 3 * Math.sin(u * 0.13) : 1.5 * Math.sin(u * 0.08)); });
  const graft = [...edge(-1), ...edge(1).reverse()];
  const integ = clamp(p * 1.25 - 0.2);
  const fibre = (f: (typeof GB)[number]) => smooth(Array.from({length: 8}, (_, i) => { const u = f.u0 + (i / 7) * f.len; return m(Math.min(u, gw - 6), f.w0 + f.amp * Math.sin(i * 1.1 + f.u0) + (u - f.u0) * f.tilt); }));
  const gFill = tone > 0.5 ? '#2B6A72' : '#F4E3DF', gFib = tone > 0.5 ? '#BDF2EF' : '#FFFFFF';
  return (
    <g>
      <defs><clipPath id={`${id}-g`}><path d={smooth(graft, true, 0.06)} /></clipPath></defs>
      <rect x={-3000} y={2 * DERM - 14} width={6000} height={3000} fill={C.matrix} />
      <TissueSection m={(u, w) => m(u, w + DERM - 6)} u0={vis[0]} u1={vis[1]} t={t} tone={tone} id={`${id}-d`} epidermis={false} flat />
      <TissueSection m={m} u0={vis[0]} u1={vis[1]} t={t} tone={tone} id={`${id}-t`} epidermis={false} flat cellFilter={keep} />
      <path d={smooth(gapPoly, true, 0.05)} fill={tone > 0.5 ? '#0F3843' : '#9A5A60'} opacity={0.72 * (1 - 0.85 * fill)} />
      {fill > 0 && Array.from({length: 6}, (_, k) => {
        const w = 12 + k * 19, h = gapHalf(w);
        if (h < 5) return null;
        return <path key={k} d={smooth(Array.from({length: 6}, (_, i) => m(lerp(-h - 8, h + 8, i / 5), w + 4 * Math.sin(i * 1.7 + k))))} fill="none" stroke={C.fiber} strokeWidth={2.2} opacity={0.65 * clamp(fill * 1.4 - k * 0.12)} />;
      })}
      {/* graft: back layer (sits on the tissue surface; soft contact shadow), rear fibres */}
      <path d={smooth(edge(1).map((q) => ({x: q.x, y: q.y + 6})))} fill="none" stroke="#06181D" strokeWidth={10} opacity={0.25 * (1 - integ * 0.6)} />
      <path d={smooth(graft, true, 0.06)} fill={gFill} opacity={0.88} />
      <g clipPath={`url(#${id}-g)`}>{GB.map((f, k) => <path key={k} d={fibre(f)} fill="none" stroke={gFib} strokeWidth={1.5} opacity={0.42} />)}</g>
      {/* integration: tissue fibres grow across the boundary into the graft */}
      {integ > 0 && Array.from({length: 12}, (_, k) => { const u = -gw + 40 + k * ((2 * gw - 80) / 11); const L = integ * (40 + 30 * rnd(k)); return <path key={k} d={smooth([m(u, 28), m(u + 8, 6), m(u + 4, -L * 0.6), m(u + 12, -L)])} fill="none" stroke={C.fiber} strokeWidth={2.2} opacity={0.7 * integ} />; })}
      {st.map((s, j) => <MigCell key={j} s={s} map={m} C={C} id={`${id}-t`} t={t} glow={j === 0 ? heroGlow : 0} />)}
      {/* graft: front fibres over the cells inside it, then its edge */}
      <g clipPath={`url(#${id}-g)`}>{GF.map((f, k) => <path key={k} d={fibre(f)} fill="none" stroke={gFib} strokeWidth={1.8} opacity={0.5} />)}</g>
      <path d={smooth(graft, true, 0.06)} fill="none" stroke={tone > 0.5 ? '#C8FFFA' : '#FFFFFF'} strokeWidth={2.4} opacity={lerp(0.9, 0.38, integ)} strokeDasharray={p > 0.85 ? '10 8' : undefined} />
    </g>
  );
};
export const heroPos3 = (p: number) => { const s = migState3(p)[0]; const a = s.sm.at(s.N); return repairMap3(p)(a.p.x, a.p.y); };
