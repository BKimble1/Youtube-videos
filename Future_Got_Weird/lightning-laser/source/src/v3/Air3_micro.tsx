// V3 beat B: the molecular view of ordinary air beside the channel (micro units: one unit is one screen px at micro
// scale 1; the origin is the streamer's stalled tip T, so this layer zooms about exactly the screen point the macro
// view zooms about).
//   foreground  a small, readable group of neutral molecules (N2 blue pairs, O2 red pairs) placed round the leader's
//               path, each with one bound electron; beyond them, a sparser, dimmer hashed field so the zoom-in always
//               fills the frame
//   background  a quiet, low-contrast, blurred farther layer (parallax), for depth
// The only motions: slow thermal drift and spin (air is a gas), slow electron orbits (they are bound), and the tug:
// while the leader tip pushes, nearby electrons are pulled toward it and stretch their cloud, then snap back when it
// stalls (the air does not give up its electrons, so the leader cannot advance).
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {ss} from '../lib';
import {ATT, tipMicro} from './Air3_leader';

const INK = '#0B151C';
type Pt = {x: number; y: number};
type Mol = {x: number; y: number; o2: boolean; th: number; ph: number; id: number; sc: number; op: number};

// ------------------------------------------------------------------ the foreground group (round the leader's path)
// the leader's path (Air3_leader EXT) runs from (0, 0) up-right through stall points near (72, -168), (117, -269) and
// (140, -336); its cooling body runs back down-left at 25 deg. Molecules sit clear of both, the first five round the
// stall points (the ones whose electrons the tip pulls hardest).
const HAND: [number, number, number, number][] = [
  // x, y, O2 (1) or N2 (0), bond angle (deg)
  [-25, -250, 0, 32], [200, -135, 1, -24], [20, -410, 0, 72], [255, -300, 0, 8], [165, -505, 0, -42],
  [-150, -50, 0, 54], [150, 60, 0, -58], [-290, 170, 1, 18], [390, -90, 0, 40], [-300, -420, 0, -12],
  [420, -520, 1, 62], [-130, -680, 0, 16], [250, -770, 0, -30], [300, 215, 0, 82], [-420, -190, 0, -50],
  [40, 335, 0, 24], [-320, -950, 1, 28], [80, -1000, 0, -64], [430, -930, 0, 6],
];
const ACT = {x: 80, y: -190}; // the centre of the action
const FG: Mol[] = (() => {
  const out: Mol[] = HAND.map(([x, y, o, th], i) => ({x, y, o2: o === 1, th, ph: 6.283 * hash(i, 1201), id: i, sc: 1, op: 1}));
  // a sparser hashed field outside the group (seen while the view zooms in)
  const C = 330;
  for (let i = -6; i <= 8; i++) for (let j = -12; j <= 9; j++) {
    const id = 100 + (i + 20) * 60 + (j + 30);
    const x = (i + 0.2 + 0.6 * hash(id, 1203)) * C, y = (j + 0.2 + 0.6 * hash(id, 1205)) * C;
    if (out.some((q) => Math.hypot(q.x - x, q.y - y) < 260)) continue;
    if (x > -480 && x < 480 && y > -1120 && y < 400) continue;
    out.push({x, y, o2: hash(id, 1207) < 0.21, th: 360 * hash(id, 1209), ph: 6.283 * hash(id, 1211), id, sc: 1, op: 1});
  }
  // depth cue by distance from the action: the readable group is full size, the rest a little smaller and dimmer
  return out.map((q) => {
    const d = Math.hypot(q.x - ACT.x, q.y - ACT.y);
    const k = clamp((d - 360) / 520);
    return {...q, sc: 1 - 0.22 * k, op: 1 - 0.45 * k};
  });
})();

// ------------------------------------------------------------------ the tug
/** the leader's pull on bound electrons: phases (rise while the tip pushes, hold while it stalls, snap back after) */
const PULL = [
  {r0: 4.95, r1: 5.15, hold: 5.36, S: 0.6},
  ...ATT.map((a, i) => ({r0: a.t0, r1: a.stall[0], hold: a.stall[1], S: i === 2 ? 0.85 : 1})),
];
const spring = (d: number) => (d < 0 ? 1 : Math.exp(-d / 0.05) * Math.cos((d * 2 * Math.PI) / 0.18));
const field = (m: Pt, tip: Pt) => {
  const dx = tip.x - m.x, dy = tip.y - m.y, d = Math.hypot(dx, dy) || 1;
  return {g: 1 / (1 + (d / 210) ** 2), ux: dx / d, uy: dy / d};
};
/** the pull vector on a molecule's electron (magnitude 0..~0.9, toward the tip; briefly negative after a snap) */
const pull = (m: Pt, t: number) => {
  let vx = 0, vy = 0;
  for (const p of PULL) {
    if (t < p.r0) continue;
    const th = Math.min(t, p.hold);
    const f = field(m, tipMicro(th));
    const k = Math.min(0.92, p.S * ss(th, p.r0, p.r1) * f.g * 1.2);
    const s = t <= p.hold ? 1 : t - p.hold < 0.45 ? spring(t - p.hold) : 0;
    vx += k * s * f.ux;
    vy += k * s * f.uy;
  }
  return {vx, vy};
};

// ------------------------------------------------------------------ drawing
const N2C = '#86A9C9', O2C = '#E0806E';
const MolB: React.FC<{q: Mol; t: number; glow: number; tip: Pt}> = ({q, t, glow, tip}) => {
  const x = q.x + 9 * noise1(t * 0.35 + q.ph, q.id % 997), y = q.y + 9 * noise1(t * 0.3 + q.ph * 2, (q.id % 997) + 9);
  const th = ((q.th + 7 * t * (q.id % 2 ? 1 : -1)) * Math.PI) / 180;
  const c = Math.cos(th), sn = Math.sin(th);
  const sc = q.sc;
  const r = (q.o2 ? 28 : 29) * sc, d = (q.o2 ? 22 : 23) * sc;
  const {vx, vy} = pull({x, y}, t);
  const k = Math.hypot(vx, vy);
  const f = field({x, y}, tip);
  const lit = clamp(glow * f.g * 0.7);
  const base = q.o2 ? O2C : N2C;
  const col = mix(base, '#E6E9FF', 0.4 * lit);
  // the electron: on a tilted orbit across the bond (front half drawn over the atoms), pulled toward the tip
  const ph = q.ph + ((t * 2 * Math.PI) / 2.9) * (q.id % 3 ? 1 : -1);
  const ox = 58 * sc * Math.cos(ph), oy = 21 * sc * Math.sin(ph);
  const orx = ox * -sn + oy * c, ory = ox * c + oy * sn;
  const kk = clamp(k, 0, 0.95);
  const ex = x + (1 - kk) * orx + vx * 68 * sc, ey = y + (1 - kk) * ory + vy * 68 * sc;
  const front = Math.sin(ph) > 0 || kk > 0.3;
  const ca = (Math.atan2(vy, vx) * 180) / Math.PI;
  const ccx = x + vx * 22 * sc, ccy = y + vy * 22 * sc;
  const electron = <circle cx={fmt(ex)} cy={fmt(ey)} r={fmt(9 * sc)} fill="#DFF8FF" stroke={INK} strokeWidth={2.4} />;
  return (
    <g opacity={q.op}>
      {/* the bound electron cloud: round at rest, stretched toward the tip while pulled */}
      <ellipse cx={fmt(ccx)} cy={fmt(ccy)} rx={fmt((70 + 42 * k) * sc)} ry={fmt((58 - 10 * k) * sc)} transform={`rotate(${fmt(ca)} ${fmt(ccx)} ${fmt(ccy)})`} fill="#BFEFFF" opacity={0.022 + 0.17 * k} />
      {!front && electron}
      {[-1, 1].map((s) => (
        <g key={s}>
          <circle cx={fmt(x + c * d * s)} cy={fmt(y + sn * d * s)} r={fmt(r)} fill={col} stroke={INK} strokeWidth={3} />
          <circle cx={fmt(x + c * d * s - r * 0.3)} cy={fmt(y + sn * d * s - r * 0.32)} r={fmt(r * 0.34)} fill="#FFFFFF" opacity={0.32} />
        </g>
      ))}
      {front && electron}
    </g>
  );
};

/** the farther, quiet layer: simplified pairs, low contrast, blurred (depth of field) */
const BackAir: React.FC<{t: number; s: number; ax: number; ay: number}> = ({t, s, ax, ay}) => {
  const C = 250;
  const R = {x0: -ax / s, x1: (1080 - ax) / s, y0: -ay / s, y1: (1920 - ay) / s};
  const els: React.ReactNode[] = [];
  for (let i = Math.floor(R.x0 / C) - 1; i <= Math.ceil(R.x1 / C); i++) for (let j = Math.floor(R.y0 / C) - 1; j <= Math.ceil(R.y1 / C); j++) {
    const id = ((i + 500) * 1009 + (j + 500) * 7) | 0;
    const x = (i + 0.15 + 0.7 * hash(id, 1301)) * C + 8 * noise1(t * 0.3 + hash(id, 1303) * 9, id % 389);
    const y = (j + 0.15 + 0.7 * hash(id, 1305)) * C + 8 * noise1(t * 0.27 + hash(id, 1307) * 9, (id % 389) + 3);
    const o2 = hash(id, 1309) < 0.21;
    const th = ((360 * hash(id, 1311) + 6 * t) * Math.PI) / 180;
    const dx = Math.cos(th) * 15, dy = Math.sin(th) * 15;
    els.push(
      <g key={id} fill={o2 ? '#4C3A46' : '#2A425A'}>
        <circle cx={fmt(x - dx)} cy={fmt(y - dy)} r={19} />
        <circle cx={fmt(x + dx)} cy={fmt(y + dy)} r={19} />
      </g>,
    );
  }
  return (
    <g transform={`translate(${fmt(ax)} ${fmt(ay)}) scale(${fmt(s)})`} opacity={0.55}>
      {els}
    </g>
  );
};

export const MicroAir3: React.FC<{t: number; tip: Pt; m: number; alpha: number; glow: number}> = ({t, tip, m, alpha, glow}) => {
  const tm = tipMicro(t);
  const fr = Math.round(t * 30); // frame-unique ids (contact sheets draw several frames in one document)
  const tipS = {x: tip.x + m * tm.x, y: tip.y + m * tm.y};
  // the background layer is farther: it scales more slowly and moves less (parallax)
  const sb = 0.46 * Math.pow(m, 0.55);
  const ab = {x: 540 + 0.6 * (tip.x - 540), y: 960 + 0.6 * (tip.y - 960)};
  // only draw the foreground molecules that can be on screen
  const R = {x0: (-120 - tip.x) / m, x1: (1200 - tip.x) / m, y0: (-120 - tip.y) / m, y1: (2040 - tip.y) / m};
  const vis = FG.filter((q) => q.x > R.x0 && q.x < R.x1 && q.y > R.y0 && q.y < R.y1);
  return (
    <g opacity={alpha}>
      <defs>
        <radialGradient id={`b-mglow-${fr}`} gradientUnits="userSpaceOnUse" cx={fmt(tipS.x)} cy={fmt(tipS.y)} r={fmt(520 * m)}>
          <stop offset="0" stopColor="#5A5FC8" stopOpacity={0.5} />
          <stop offset="0.45" stopColor="#343C86" stopOpacity={0.22} />
          <stop offset="1" stopColor="#1A2040" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`b-mvig-${fr}`} gradientUnits="userSpaceOnUse" cx={540} cy={900} r={1250}>
          <stop offset="0.5" stopColor="#05080F" stopOpacity={0} />
          <stop offset="1" stopColor="#05080F" stopOpacity={0.6} />
        </radialGradient>
        <filter id={`b-mblur-${fr}`} filterUnits="userSpaceOnUse" x={-50} y={-50} width={1180} height={2020}>
          <feGaussianBlur stdDeviation={3.5} />
        </filter>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="#111B2A" />
      <g filter={`url(#b-mblur-${fr})`}>
        <BackAir t={t} s={sb} ax={ab.x} ay={ab.y} />
      </g>
      {/* the leader's light on the air round its tip */}
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#b-mglow-${fr})`} opacity={clamp(0.35 + 0.65 * glow)} style={{mixBlendMode: 'screen'}} />
      <g transform={`translate(${fmt(tip.x)} ${fmt(tip.y)}) scale(${fmt(m)})`}>
        {vis.map((q) => <MolB key={q.id} q={q} t={t} glow={glow} tip={tm} />)}
      </g>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#b-mvig-${fr})`} />
    </g>
  );
};
