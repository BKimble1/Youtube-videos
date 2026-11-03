// V2: the wet wound over the bonded seam (the "It grips bone even inside a wet, bloody wound" macro). A thin,
// translucent, blood-tinted sheet of fluid flows DOWN the field, across the glue-filled transverse seam: ripple
// highlights travel with it, ride up over the glue band (catching light on its surface) and carry on past it; a darker
// film lip lies along the band's upper edge where the flow meets the raised gel. Around "wet, bloody" a stronger wash
// sweeps across the whole field. The glue's two edges are redrawn crisp on top: it stays sealed to both faces. No
// strands, no droplets. World millimetres, depth 0; everything is anchored to the bone, so it scales and travels with the
// camera. Deterministic in st.flow / st.surge.
import React from 'react';
import {P, closed, open, pt} from '../core/geo';
import {mix, rgba} from '../core/color';
import {clamp, hash, noise1, ss} from '../lib';
import {C} from './palette';
import {RADIUS} from './anatomy';
import {SEAM_IDS, glueBand, seamLength} from './seams';
import {BoneState2} from '../v2state';
import {uid} from '../core/ids';

const RAD = closed(RADIUS, 0.55);
/** the field the film covers (mm): the macro framings sit inside it */
const F = {x0: -15, x1: 12, y0: -14, y1: 15};

/** the transverse band's upper and lower outline y at x (seated; C1 is the seam the flow crosses) */
const C1_ROWS = (() => {
  const runs = glueBand('C1', 0, seamLength('C1'), {dx: 0, dy: 0, rot: 0}, 0.14, undefined, 0.1);
  const rows: {x: number; lo: number; hi: number}[] = [];
  for (const r of runs) for (let i = 0; i < r.s.length; i++) rows.push({x: (r.lo[i].x + r.hi[i].x) / 2, lo: r.lo[i].y, hi: r.hi[i].y});
  rows.sort((a, b) => a.x - b.x);
  return rows;
})();
const bandAt = (x: number): {lo: number; hi: number} | null => {
  if (x < C1_ROWS[0].x || x > C1_ROWS[C1_ROWS.length - 1].x) return null;
  let lo = 0, hi = C1_ROWS.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (C1_ROWS[m].x <= x) lo = m; else hi = m;
  }
  const a = C1_ROWS[lo], b = C1_ROWS[hi];
  const u = clamp((x - a.x) / (b.x - a.x || 1));
  return {lo: a.lo + (b.lo - a.lo) * u, hi: a.hi + (b.hi - a.hi) * u};
};

type Streak = {x0: number; v: number; len: number; ph: number; wob: number; lit: boolean};
const STREAKS: Streak[] = Array.from({length: 26}, (_, k) => ({
  x0: F.x0 + 1 + (F.x1 - F.x0 - 2) * ((k * 0.6180339 + 0.11 * hash(k * 3.7)) % 1),
  v: 2.6 + 1.4 * hash(k * 5.3),
  len: 1.4 + 2.0 * hash(k * 7.1),
  ph: hash(k * 9.7),
  wob: hash(k * 2.3) * 6.28,
  lit: k % 3 !== 1,
}));

export const WetFilm: React.FC<{st: BoneState2}> = ({st}) => {
  const a = st.wet;
  if (a <= 0.001) return null;
  const px = st.px;
  const t = st.flow;
  const H = F.y1 - F.y0;
  const clip = uid('wetclip');
  const sheen = uid('wetsheen');
  const out: React.ReactNode[] = [];

  // ripple highlights travelling down with the flow; where one crosses the glue band it brightens on the gel's surface
  STREAKS.forEach((k, i) => {
    const period = (H + k.len) / k.v;
    const ph = ((t / period + k.ph) % 1 + 1) % 1;
    const head = F.y0 + ph * (H + k.len);
    const tail = head - k.len;
    const pts: P[] = [];
    const n = 10;
    for (let j = 0; j <= n; j++) {
      const y = tail + ((head - tail) * j) / n;
      pts.push(pt(k.x0 + 0.12 * (y - F.y0) * 0.12 + 0.1 * Math.sin(y * 1.6 + k.wob + t * 0.8), y));
    }
    const fadeEnds = Math.min(1, ph * 6, (1 - ph) * 6);
    const wCore = Math.max(0.006, 2.4 * px), wSoft = Math.max(0.02, 9 * px);
    out.push(
      <g key={`s${i}`} opacity={fadeEnds}>
        <path d={open(pts, 0.6)} stroke={k.lit ? '#FFE9EC' : C.bloodDeep} strokeWidth={wSoft} fill="none" strokeLinecap="round" opacity={k.lit ? 0.16 : 0.22} />
        <path d={open(pts, 0.6)} stroke={k.lit ? '#FFF6F6' : C.blood} strokeWidth={wCore} fill="none" strokeLinecap="round" opacity={k.lit ? 0.62 : 0.4} />
      </g>,
    );
    // over the gel: a short bright glint where the ripple rides over the raised band
    const mid = pts[Math.floor(n / 2)];
    const b = bandAt(mid.x);
    if (k.lit && b && head > b.lo && tail < b.hi) {
      const y0 = Math.max(tail, b.lo + 0.08), y1 = Math.min(head, b.hi - 0.08);
      if (y1 > y0) {
        out.push(<path key={`g${i}`} d={`M${mid.x.toFixed(3)} ${y0.toFixed(3)}L${(mid.x + 0.02).toFixed(3)} ${y1.toFixed(3)}`} stroke={C.glueShine} strokeWidth={Math.max(0.01, 4.5 * px)} strokeLinecap="round" opacity={0.85 * fadeEnds} />);
      }
    }
  });

  // the film's lip along the band's upper edge: the flow meets the raised gel and spills over it, never into it
  const lip: P[] = [];
  for (let x = F.x0; x <= F.x1; x += 0.25) {
    const b = bandAt(x);
    if (b) lip.push(pt(x, b.lo - 0.05 - 0.03 * Math.sin(x * 2.3 + t * 2)));
  }
  if (lip.length > 2) {
    out.push(<path key="lip" d={open(lip, 0.5)} stroke={C.bloodDeep} strokeWidth={Math.max(0.02, 7 * px)} fill="none" opacity={0.42} strokeLinecap="round" />);
    out.push(<path key="lip2" d={open(lip.map((p) => pt(p.x, p.y - Math.max(0.02, 5 * px))), 0.5)} stroke="#FFE9EC" strokeWidth={Math.max(0.006, 2 * px)} fill="none" opacity={0.5} strokeLinecap="round" />);
  }

  // the stronger wash ("wet, bloody"): a wavy front sweeps down the field; behind it the film is thicker and darker
  if (st.surge >= 0 && st.surge <= 1) {
    const u = ss(st.surge, 0, 1);
    const front = F.y0 - 2 + (H + 8) * u;
    const lead: P[] = [];
    for (let x = F.x0 - 1; x <= F.x1 + 1; x += 0.3) {
      let y = front + 0.45 * Math.sin(x * 0.9 + t * 3.1) + 0.3 * noise1(x * 0.6 + 4, 21);
      const b = bandAt(x);
      // the front bulges as it rides over the raised band
      if (b && y > b.lo - 0.4 && y < b.hi + 0.9) y += 0.35 * Math.sin(Math.PI * clamp((y - b.lo + 0.4) / (b.hi - b.lo + 1.3)));
      lead.push(pt(x, y));
    }
    const back = lead.map((p) => pt(p.x, p.y - 5.5));
    const strength = Math.sin(Math.PI * clamp(st.surge)) ** 0.5;
    const body = closed([...back, ...[...lead].reverse()], 0.4);
    out.push(
      <g key="surge" opacity={strength}>
        <defs>
          <linearGradient id={sheen} gradientUnits="userSpaceOnUse" x1={0} y1={front - 5.5} x2={0} y2={front}>
            <stop offset={0} stopColor={C.blood} stopOpacity={0} />
            <stop offset={0.7} stopColor={C.blood} stopOpacity={0.24} />
            <stop offset={1} stopColor={C.bloodDeep} stopOpacity={0.36} />
          </linearGradient>
        </defs>
        <path d={body} fill={`url(#${sheen})`} />
        <path d={open(lead, 0.5)} stroke={C.bloodDeep} strokeWidth={Math.max(0.02, 6 * px)} fill="none" opacity={0.55} strokeLinecap="round" />
        <path d={open(lead.map((p) => pt(p.x, p.y - Math.max(0.02, 6 * px))), 0.5)} stroke="#FFF2F3" strokeWidth={Math.max(0.008, 2.6 * px)} fill="none" opacity={0.85} strokeLinecap="round" />
      </g>,
    );
  }

  // the glue stays sealed to both faces: its two edges redrawn crisp over the film
  const edges: React.ReactNode[] = [];
  SEAM_IDS.forEach((id) => {
    const g = st.glue[id];
    if (g.b <= g.a) return;
    glueBand(id, g.a, g.b, st.wedge, 0.14, undefined, 0.12).forEach((r, i) => {
      [r.lo, r.hi].forEach((e, j) => {
        edges.push(<path key={`${id}${i}${j}`} d={open(e, 0.5)} stroke={C.glueInk} strokeWidth={Math.max(0.01, 2.6 * px)} fill="none" opacity={0.9} />);
        edges.push(<path key={`${id}${i}${j}h`} d={open(e, 0.5)} stroke={C.glueLit} strokeWidth={Math.max(0.006, 1.2 * px)} fill="none" opacity={0.7} transform={`translate(0 ${(j === 0 ? 1 : -1) * 2.2 * px})`} />);
      });
    });
  });

  // the whole film: a faint blood tint over the bone, slowly breathing
  const tint = 0.1 + 0.03 * Math.sin(t * 1.7);
  return (
    <g opacity={a}>
      <defs>
        <clipPath id={clip}><path d={RAD} /></clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x={F.x0} y={F.y0} width={F.x1 - F.x0} height={H} fill={rgba(mix(C.blood, C.bloodLit, 0.3), tint)} />
        {out}
      </g>
      {edges}
    </g>
  );
};
