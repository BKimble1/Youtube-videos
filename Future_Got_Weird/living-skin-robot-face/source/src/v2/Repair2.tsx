// V2 repair, microscope-style (2022 study, simplified): the same narrow cut in the dermis equivalent, under the
// grafted acellular collagen sheet. Over DAY 0 -> 7: fibroblasts at the cut and graft boundary adhere, extend a
// leading edge and crawl INTO the graft along its fibres (time-lapse: extend, then the rear follows); neighbours follow;
// new matrix fills the narrow gap and its edges draw together. The graft stays identifiable as a graft.
// Cells move only along paths through tissue/graft matrix: no tumbling, no free floating, no teleporting.
import React from 'react';
import {Pt, lerp, clamp, eio, path, smooth, rnd} from '../lib';
import {TissueSection, TMap, Cell, tc, DERM} from './Tissue2';

export const RP2 = {gap: 66, depth: 140, gw: 380, gh: 88, shrink: 0.5};
const gapHalf = (w: number) => Math.max(0, RP2.gap * (1 - w / RP2.depth));
export const repairMap2 = (p: number): TMap => (u, w) => {
  const D = RP2.gap * RP2.shrink * p;
  const a = Math.abs(u);
  const k = clamp(1 - Math.max(0, a - gapHalf(Math.max(0, w))) / 420) * clamp(1 - Math.max(0, w) / 260 + 0.15);
  return {x: u - Math.tanh(u / 90) * D * k, y: w};
};
type Mig = {pts: Pt[]; d: number; dur: number; L: number; ph: number};
// paths in rest tissue coordinates (u, w); w < 0 is inside the graft
export const MIG2: Mig[] = [
  {pts: [{x: -236, y: 60}, {x: -170, y: 34}, {x: -112, y: 10}, {x: -56, y: -22}, {x: 20, y: -42}, {x: 110, y: -50}], d: 0.1, dur: 0.72, L: 104, ph: 0.4}, // hero
  {pts: [{x: 236, y: 56}, {x: 170, y: 30}, {x: 112, y: 6}, {x: 54, y: -28}, {x: -30, y: -60}], d: 0.3, dur: 0.6, L: 96, ph: 1.7},
  {pts: [{x: -350, y: 34}, {x: -300, y: 12}, {x: -250, y: -14}, {x: -180, y: -46}, {x: -100, y: -68}], d: 0.38, dur: 0.56, L: 94, ph: 2.6},
  {pts: [{x: 360, y: 30}, {x: 310, y: 8}, {x: 262, y: -20}, {x: 200, y: -50}, {x: 150, y: -70}], d: 0.44, dur: 0.52, L: 92, ph: 3.3},
  {pts: [{x: -150, y: 150}, {x: -100, y: 120}, {x: -52, y: 92}, {x: -12, y: 62}], d: 0.34, dur: 0.56, L: 88, ph: 4.1},
  {pts: [{x: 156, y: 156}, {x: 104, y: 130}, {x: 52, y: 104}, {x: 10, y: 74}], d: 0.5, dur: 0.46, L: 86, ph: 5.2},
];
const arc = (pts: Pt[]) => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)); return L; };
// smooth path sampler (Catmull-Rom through the control points, then arc-length lookup)
const sampler = (ctrl: Pt[]) => {
  const pts: Pt[] = [];
  const n = ctrl.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(n - 1, i + 2)];
    for (let k = 0; k < 20; k++) {
      const t = k / 20, t2 = t * t, t3 = t2 * t;
      pts.push({x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)});
    }
  }
  pts.push(ctrl[n - 1]);
  const L = arc(pts), total = L[L.length - 1];
  const at = (s: number) => {
    s = clamp(s, 0, total - 0.01);
    let i = 1; while (L[i] < s) i++;
    const f = (s - L[i - 1]) / (L[i] - L[i - 1]);
    const p = {x: lerp(pts[i - 1].x, pts[i].x, f), y: lerp(pts[i - 1].y, pts[i].y, f)};
    const tx = pts[i].x - pts[i - 1].x, ty = pts[i].y - pts[i - 1].y, tl = Math.hypot(tx, ty) || 1;
    return {p, t: {x: tx / tl, y: ty / tl}};
  };
  return {at, total};
};
const SAMPLERS = MIG2.map((m) => sampler(m.pts));
// crawl: in each of 3 steps the front extends first, then the rear follows (adhere -> protrude -> contract)
export const crawl = (k: number, m: Mig, total: number, t: number) => {
  const travel = total - m.L * 0.85, steps = 3, stepLen = travel / steps;
  const q = clamp(k) * steps, i = Math.min(steps - 1, Math.floor(q)), f = q - i;
  const ext = k >= 1 ? 0 : eio(clamp(f / 0.6)), ret = k >= 1 ? 1 : eio(clamp((f - 0.55) / 0.45));
  const base = i * stepLen + (k >= 1 ? stepLen : 0);
  const head = m.L * 0.85 + base + stepLen * (k >= 1 ? 0 : ext) + 3 * Math.sin(t * 2 + m.ph);
  const tail = base + stepLen * (k >= 1 ? 0 : ret);
  return {head, tail, extending: k > 0 && k < 1 && f < 0.6, retracting: k > 0 && k < 1 && f >= 0.6};
};
export const migState = (p: number, t: number) => MIG2.map((m, j) => { const sm = SAMPLERS[j]; const k = clamp((p - m.d) / m.dur); return {m, sm, k, ...crawl(k, m, sm.total, t)}; });

const PathCell: React.FC<{s: ReturnType<typeof migState>[number]; map: TMap; C: ReturnType<typeof tc>; id: string; glow: number}> = ({s, map, C, id, glow}) => {
  const {sm, head, tail} = s;
  const len = head - tail;
  const N = 18, top: Pt[] = [], bot: Pt[] = [];
  const Wm = 10 + 2 * Math.sin(s.m.ph);
  const prof = (q: number) => (q < 0.12 ? 0.25 + (q / 0.12) * 0.6 : q < 0.4 ? 0.85 + 0.15 * Math.sin(((q - 0.12) / 0.28) * Math.PI / 2) : lerp(1, 0.55, (q - 0.4) / 0.48)) * (1 + 0.08 * Math.sin(q * 9 + s.m.ph));
  for (let i = 0; i <= N; i++) {
    const q = i / N, a = sm.at(tail + q * len * 0.9);
    const n = {x: -a.t.y, y: a.t.x}, w = Wm * prof(q * (1 / 0.9) > 1 ? 1 : q);
    top.push(map(a.p.x + n.x * w, a.p.y + n.y * w)); bot.push(map(a.p.x - n.x * w, a.p.y - n.y * w));
  }
  const body = [...top, ...bot.reverse()];
  // leading lamella: a thin fan at the front
  const f0 = sm.at(head - len * 0.12), f1 = sm.at(head);
  const fn = {x: -f1.t.y, y: f1.t.x};
  const fan: Pt[] = [];
  for (let i = 0; i <= 28; i++) { const th = -Math.PI / 2 + (Math.PI * i) / 28; const wob = 1 + 0.08 * Math.sin(th * 5 + s.m.ph); fan.push(map(f1.p.x + f1.t.x * Math.cos(th) * 8 * wob + fn.x * Math.sin(th) * 14 * wob, f1.p.y + f1.t.y * Math.cos(th) * 8 * wob + fn.y * Math.sin(th) * 14 * wob)); }
  const fanBase = [map(f0.p.x + fn.x * 12, f0.p.y + fn.y * 12), map(f0.p.x - fn.x * 12, f0.p.y - fn.y * 12)];
  const nucA = sm.at(tail + len * 0.32);
  const nn = {x: -nucA.t.y, y: nucA.t.x};
  const nuc = Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2; return map(nucA.p.x + nucA.t.x * Math.cos(a) * 15 + nn.x * Math.sin(a) * 7, nucA.p.y + nucA.t.y * Math.cos(a) * 15 + nn.y * Math.sin(a) * 7); });
  const adh = s.extending ? [-0.6, 0, 0.6].map((a) => map(f1.p.x + f1.t.x * 6 + fn.x * a * 11, f1.p.y + f1.t.y * 6 + fn.y * a * 11)) : [];
  const tl = sm.at(tail), trail = s.retracting ? [map(tl.p.x, tl.p.y), map(tl.p.x - tl.t.x * 22, tl.p.y - tl.t.y * 22)] : [];
  const sc = Math.hypot(map(10, 0).x - map(0, 0).x, map(10, 0).y - map(0, 0).y) / 10;
  return (
    <g>
      {glow > 0 && <path d={smooth(body, true)} fill="none" stroke="#BFF7F2" strokeWidth={7 * sc} opacity={0.45 * glow} />}
      <path d={smooth([fanBase[1], ...fan, fanBase[0]], true)} fill={C.cyto} opacity={0.78} stroke={C.cytoEdge} strokeWidth={0.6 * sc} strokeOpacity={0.45} />
      <path d={smooth(body, true)} fill={`url(#${id}-cy)`} stroke={C.cytoEdge} strokeWidth={1.2 * sc} />
      <path d={smooth(nuc, true)} fill={`url(#${id}-nu)`} stroke={C.nucleolus} strokeWidth={1 * sc} />
      {trail.length > 0 && <line x1={trail[0].x} y1={trail[0].y} x2={trail[1].x} y2={trail[1].y} stroke={C.cytoEdge} strokeWidth={1.2 * sc} opacity={0.7} />}
      {adh.map((a, k) => <circle key={k} cx={a.x} cy={a.y} r={1.5 * sc} fill="#FFE6EC" opacity={0.75} />)}
    </g>
  );
};

export const RepairMicro2: React.FC<{p: number; t: number; tone: number; id: string; heroGlow?: number; vis?: [number, number]}> = ({p, t, tone, id, heroGlow = 0, vis = [-1400, 1400]}) => {
  const C = tc(tone);
  const m = repairMap2(p);
  const st = migState(p, t);
  const origins = MIG2.map((g) => g.pts[0]);
  const keep = (c: Cell) => !(Math.abs(c.u) < gapHalf(c.w) + 34) && !(c.w < 34 && Math.abs(c.u) < RP2.gw + 40) && !c.hero && !origins.some((o) => Math.hypot(o.x - c.u, o.y - c.w) < 90);
  const fill = clamp(p * 1.15 - 0.1);
  const gapPoly: Pt[] = [];
  for (let i = 0; i <= 12; i++) { const w = (i / 12) * RP2.depth; gapPoly.push(m(-gapHalf(w), w)); }
  for (let i = 12; i >= 0; i--) { const w = (i / 12) * RP2.depth; gapPoly.push(m(gapHalf(w), w)); }
  const gw = RP2.gw, gh = RP2.gh;
  const graftEdge = (sgn: number) => Array.from({length: 24}, (_, i) => { const u = lerp(-gw, gw, i / 23); return m(u, sgn < 0 ? -gh + 4 * Math.sin(u * 0.05) : 1 + 2 * Math.sin(u * 0.08)); });
  const graft = [...graftEdge(-1), ...graftEdge(1).reverse()];
  const integ = clamp(p * 1.25 - 0.2);
  return (
    <g>
      <rect x={-3000} y={2 * DERM - 14} width={6000} height={3000} fill={C.matrix} />
      <TissueSection m={(u, w) => m(u, w + DERM - 6)} u0={vis[0]} u1={vis[1]} t={t} tone={tone} id={`${id}-d`} epidermis={false} flat />
      <TissueSection m={m} u0={vis[0]} u1={vis[1]} t={t} tone={tone} id={`${id}-t`} epidermis={false} flat cellFilter={keep} />
      {/* the narrow cut: medium-filled at DAY 0, new matrix laid down as cells arrive */}
      <path d={smooth(gapPoly, true, 0.05)} fill={tone > 0.5 ? '#0E3540' : '#9A5A60'} opacity={0.78 * (1 - 0.85 * fill)} />
      {fill > 0 && Array.from({length: 6}, (_, k) => {
        const w = 12 + k * 20, h = gapHalf(w);
        if (h < 5) return null;
        return <path key={k} d={smooth(Array.from({length: 6}, (_, i) => m(lerp(-h - 8, h + 8, i / 5), w + 4 * Math.sin(i * 1.7 + k))))} fill="none" stroke={C.fiber} strokeWidth={2.2} opacity={0.65 * clamp(fill * 1.4 - k * 0.12)} />;
      })}
      {/* the graft: acellular sheet with its own crossing fibres and an irregular edge */}
      <path d={smooth(graft, true, 0.06)} fill={tone > 0.5 ? '#2A6870' : '#F4E3DF'} opacity={0.92} />
      {Array.from({length: 18}, (_, k) => { const u0 = -gw + k * 46; return <path key={k} d={smooth([m(u0, -gh + 6), m(u0 + 22, -gh * 0.5), m(u0 + 10, -4)])} fill="none" stroke={tone > 0.5 ? '#B9F1EE' : '#FFFFFF'} strokeWidth={1.6} opacity={0.4} />; })}
      {Array.from({length: 5}, (_, k) => <path key={k} d={smooth(Array.from({length: 13}, (_, i) => m(lerp(-gw + 10, gw - 10, i / 12), -gh + 12 + k * 16 + 3 * Math.sin(i * 0.9 + k * 2))))} fill="none" stroke={tone > 0.5 ? '#B9F1EE' : '#FFFFFF'} strokeWidth={2} opacity={0.5} />)}
      {/* integration: tissue fibres grow across the boundary into the graft */}
      {integ > 0 && Array.from({length: 12}, (_, k) => { const u = -gw + 40 + k * ((2 * gw - 80) / 11); const L = integ * (40 + 30 * rnd(k)); return <path key={k} d={smooth([m(u, 28), m(u + 8, 6), m(u + 4, -L * 0.6), m(u + 12, -L)])} fill="none" stroke={C.fiber} strokeWidth={2.2} opacity={0.7 * integ} />; })}
      {st.map((s, j) => <PathCell key={j} s={s} map={m} C={C} id={`${id}-t`} glow={j === 0 ? heroGlow : 0} />)}
      <path d={smooth(graft, true, 0.06)} fill="none" stroke={tone > 0.5 ? '#C8FFFA' : '#FFFFFF'} strokeWidth={2.6} opacity={lerp(0.95, 0.4, integ)} strokeDasharray={p > 0.85 ? '10 8' : undefined} />
    </g>
  );
};
export const heroPos2 = (p: number, t: number) => { const s = migState(p, t)[0]; const a = s.sm.at((s.head + s.tail) / 2); return repairMap2(p)(a.p.x, a.p.y); };
