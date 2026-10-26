// V3 beat B: the molecular view of ordinary air beside the channel (micro units: one unit is one screen px at micro
// scale 1; the origin is the streamer's stalled tip T, so this layer zooms about exactly the screen point the macro
// view zooms about).
//   foreground  a few readable neutral molecules (N2 blue pairs, O2 red pairs) round the leader's path, each with one
//               bound electron; farther out the same molecules get smaller and dimmer (depth), and a sparse hashed
//               field at background contrast keeps the zoom-in filled
//   background  a quiet, low-contrast, blurred farther layer (parallax), for depth
// The only motions: slow thermal drift and spin (air is a gas), slow electron orbits near the action (they are bound;
// far electrons barely move), and the tug, which is the mechanism: while the leader tip pushes, the electrons of the
// few molecules round it are pulled off their molecule toward the tip on a stretched tether, held while it stalls,
// and snap back onto their molecule when it gives up (the air does not let go of its electrons, so the leader cannot
// advance). The pulled electrons are drawn again above the leader's glow (MicroTug3), so they stay readable.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {ss} from '../lib';
import {ATT, EXT, tipMicro} from './Air3_leader';

const INK = '#0B151C';
type Pt = {x: number; y: number};
type Mol = {x: number; y: number; o2: boolean; th: number; ph: number; id: number; sc: number; op: number; near: number; orb: number};

// ------------------------------------------------------------------ the foreground group (round the leader's path)
// the leader's path (Air3_leader EXT) runs from (0, 0) up-right through stall points near (72, -168), (117, -269) and
// (140, -336); its cooling body runs back down-left at 25 deg. The first five molecules sit ~200 units from a stall
// point (each attempt tugs a different few as the tip advances, and the pulled electron has room to travel toward the
// tip without reaching it); the next two flank the macro streamer's stalled tip (the first tug, as the view arrives).
const HAND: [number, number, number, number][] = [
  // x, y, O2 (1) or N2 (0), bond angle (deg)
  [-81, -297, 0, 32], [266, -118, 1, -24], [-30, -441, 0, 72], [331, -276, 0, 8], [169, -534, 0, -42],
  [-180, -60, 0, 54], [176, 70, 0, -58], [-290, 170, 1, 18], [440, -40, 0, 40], [-300, -420, 0, -12],
  [420, -520, 1, 62], [-130, -680, 0, 16], [250, -770, 0, -30], [300, 215, 0, 82], [-420, -190, 0, -50],
  [40, 335, 0, 24], [-320, -950, 1, 28], [80, -1000, 0, -64], [430, -930, 0, 6],
];
/** distance from the leader's path (its knots) */
const pathDist = (x: number, y: number) => EXT.knots.reduce((b, k) => Math.min(b, Math.hypot(k.x - x, k.y - y)), 1e9);
const FG: Mol[] = (() => {
  const out: Mol[] = HAND.map(([x, y, o, th], i) => ({x, y, o2: o === 1, th, ph: 6.283 * hash(i, 1201), id: i, sc: 1, op: 1, near: 0, orb: 0}));
  // a sparser hashed field outside the group (seen while the view zooms in)
  const C = 330;
  for (let i = -6; i <= 8; i++) for (let j = -12; j <= 9; j++) {
    const id = 100 + (i + 20) * 60 + (j + 30);
    const x = (i + 0.2 + 0.6 * hash(id, 1203)) * C, y = (j + 0.2 + 0.6 * hash(id, 1205)) * C;
    if (out.some((q) => Math.hypot(q.x - x, q.y - y) < 260)) continue;
    if (x > -480 && x < 480 && y > -1120 && y < 400) continue;
    out.push({x, y, o2: hash(id, 1207) < 0.21, th: 360 * hash(id, 1209), ph: 6.283 * hash(id, 1211), id, sc: 1, op: 1, near: 0, orb: 0});
  }
  // depth cue by distance from the leader's path: the few molecules round it are full size and contrast, the rest
  // fall off quickly; the hashed field sits at background contrast. `near` marks the tug's actors (big electrons),
  // `orb` scales the electron orbits (only electrons near the action move noticeably)
  return out.map((q) => {
    const dA = pathDist(q.x, q.y);
    const k = q.id >= 100 ? 1 : clamp((dA - 200) / 300);
    return {...q, sc: 1 - 0.26 * k, op: 1 - 0.64 * k, near: 1 - clamp((dA - 205) / 80), orb: 1 - clamp((dA - 220) / 200)};
  });
})();

// ------------------------------------------------------------------ the tug
/** the leader's pull on bound electrons: phases (rise while the tip pushes, hold while it stalls, snap back after) */
const PULL = [
  {r0: 4.95, r1: 5.15, hold: 5.36, S: 0.8},
  ...ATT.map((a, i) => ({r0: a.t0, r1: a.stall[0], hold: a.stall[1], S: i === 2 ? 0.85 : 1})),
];
/** the release: a bound electron let go from rest springs back onto its molecule over ~5 frames (95, 71, 41, 16, 0 %),
 *  a little past its rest point (~12 %) and settles (damped oscillator released with zero velocity; zeta ~0.55) */
const spring = (d: number) => (d < 0 ? 1 : Math.exp(-9.5 * d) * (Math.cos(14.4 * d) + 0.657 * Math.sin(14.4 * d)));
/** the leader's light on the air (broad) */
const light = (m: Pt, tip: Pt) => 1 / (1 + (Math.hypot(tip.x - m.x, tip.y - m.y) / 210) ** 2);
/** the tug's reach: local (only the few molecules round the tip feel it) and strongest ahead of the tip, along its
 *  direction of advance (FWD, up-right), where a pointed tip's field is strongest; so each attempt pulls a different
 *  two or three electrons, mostly on the side it is trying to advance into, never a symmetric ring */
const FWD = {x: Math.sin((22 * Math.PI) / 180), y: -Math.cos((22 * Math.PI) / 180)};
const tugF = (m: Pt, tip: Pt) => {
  const dx = tip.x - m.x, dy = tip.y - m.y, d = Math.hypot(dx, dy) || 1;
  const ahead = -(dx * FWD.x + dy * FWD.y) / d;
  return {g: (1 / (1 + (d / 235) ** 8)) * clamp(0.5 + 0.8 * ahead, 0.15, 1), ux: dx / d, uy: dy / d, d};
};
const PULL_D = 118; // micro units: how far a fully pulled electron leaves its molecule's centre
/** the electron's pull displacement (micro units, toward the tip; briefly the other way after a snap) and its strength */
const pull = (m: Pt, t: number) => {
  let vx = 0, vy = 0, kk = 0;
  for (const p of PULL) {
    if (t < p.r0) continue;
    const dt = t - p.hold;
    if (dt > 0.5) continue;
    const th = Math.min(t, p.hold);
    const f = tugF(m, tipMicro(th));
    const k = Math.min(1, p.S * ss(th, p.r0, p.r1) * f.g * 1.35);
    // never all the way to the tip: the electron stays visibly apart from the leader
    const D = Math.min(PULL_D * k, 0.65 * Math.max(0, f.d - 30));
    const s = spring(dt);
    vx += D * s * f.ux;
    vy += D * s * f.uy;
    kk += k * Math.abs(s);
  }
  return {vx, vy, kk: Math.min(1, kk)};
};

// ------------------------------------------------------------------ drawing
const N2C = '#86A9C9', O2C = '#E0806E';
/** one molecule's pose at time t: atoms, colour, the electron (pulled or orbiting) and its tether */
const molState = (q: Mol, t: number, glow: number, tip: Pt) => {
  const x = q.x + 9 * noise1(t * 0.35 + q.ph, q.id % 997), y = q.y + 9 * noise1(t * 0.3 + q.ph * 2, (q.id % 997) + 9);
  const th = ((q.th + 7 * t * (q.id % 2 ? 1 : -1)) * Math.PI) / 180;
  const c = Math.cos(th), sn = Math.sin(th);
  const sc = q.sc;
  const r = (q.o2 ? 28 : 29) * sc, d = (q.o2 ? 22 : 23) * sc;
  const {vx, vy, kk} = pull({x, y}, t);
  const lit = clamp(glow * light({x, y}, tip) * 0.7);
  const col = mix(q.o2 ? O2C : N2C, '#E6E9FF', 0.4 * lit);
  // the electron: on a tilted orbit across the bond (front half drawn over the atoms); far from the action the orbit
  // is small and slow; while it is pulled it stops orbiting and leaves the molecule toward the tip
  const ph = q.ph + ((t * 2 * Math.PI) / 2.9) * (q.id % 3 ? 1 : -1) * (0.2 + 0.8 * q.orb);
  const orr = 0.7 + 0.3 * q.orb;
  const ox = 46 * sc * orr * Math.cos(ph), oy = 19 * sc * orr * Math.sin(ph);
  const orx = ox * -sn + oy * c, ory = ox * c + oy * sn;
  const free = 1 - ss(kk, 0.02, 0.4);
  const ex = x + free * orx + vx * sc, ey = y + free * ory + vy * sc;
  const er = (9 + 4.5 * q.near) * sc;
  const front = Math.sin(ph) > 0 || kk > 0.12;
  // the tether: from the molecule's edge (toward the electron) to the electron, while it is held off the molecule
  const ux = ex - x, uy = ey - y, ul = Math.hypot(ux, uy) || 1;
  const edge = d * Math.abs((ux / ul) * c + (uy / ul) * sn) + r * 0.82;
  const tl = ul - edge - er * 0.7;
  const teth = tl > 3 && kk > 0.04 ? {x0: x + (ux / ul) * edge, y0: y + (uy / ul) * edge, x1: ex - (ux / ul) * er * 0.7, y1: ey - (uy / ul) * er * 0.7, a: ss(kk, 0.04, 0.4) * clamp(tl / 18)} : null;
  return {x, y, c, sn, r, d, col, ex, ey, er, kk, front, sc, vx, vy, teth};
};
type MS = ReturnType<typeof molState>;
const Electron: React.FC<{s: MS}> = ({s}) => (
  <circle cx={fmt(s.ex)} cy={fmt(s.ey)} r={fmt(s.er)} fill="#DFF8FF" stroke={INK} strokeWidth={fmt(2.4 + 0.5 * (s.er / s.sc - 9) / 4.5)} />
);
/** the stretched hold of the molecule on its electron: a soft, thin, tapering strand (widest at the molecule) */
const Tether: React.FC<{s: MS}> = ({s}) => {
  const tt = s.teth;
  if (!tt) return null;
  const dx = tt.x1 - tt.x0, dy = tt.y1 - tt.y0, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const strand = (w0: number, w1: number) => {
    const a = w0 * s.sc, b = w1 * s.sc;
    return `M${fmt(tt.x0 + nx * a)},${fmt(tt.y0 + ny * a)} L${fmt(tt.x1 + nx * b)},${fmt(tt.y1 + ny * b)} L${fmt(tt.x1 - nx * b)},${fmt(tt.y1 - ny * b)} L${fmt(tt.x0 - nx * a)},${fmt(tt.y0 - ny * a)}Z`;
  };
  return (
    <g opacity={fmt(tt.a)}>
      <path d={strand(9, 5)} fill="#BFEFFF" opacity={0.16} />
      <path d={strand(3, 1.1)} fill="#DFF8FF" opacity={0.7} />
    </g>
  );
};
const MolB: React.FC<{q: Mol; t: number; glow: number; tip: Pt}> = ({q, t, glow, tip}) => {
  const s = molState(q, t, glow, tip);
  const {x, y, c, sn, r, d, col, kk, sc} = s;
  const ca = (Math.atan2(s.vy, s.vx) * 180) / Math.PI;
  const ccx = x + s.vx * 0.12 * sc, ccy = y + s.vy * 0.12 * sc;
  return (
    <g opacity={q.op}>
      {/* the bound electron cloud: a faint round haze, leaning a little toward the tip while the electron is pulled */}
      <ellipse cx={fmt(ccx)} cy={fmt(ccy)} rx={fmt((70 + 12 * kk) * sc)} ry={fmt((58 - 4 * kk) * sc)} transform={`rotate(${fmt(ca)} ${fmt(ccx)} ${fmt(ccy)})`} fill="#BFEFFF" opacity={0.02 + 0.045 * kk} />
      {!s.front && <Electron s={s} />}
      {[-1, 1].map((k) => (
        <g key={k}>
          <circle cx={fmt(x + c * d * k)} cy={fmt(y + sn * d * k)} r={fmt(r)} fill={col} stroke={INK} strokeWidth={3} />
          <circle cx={fmt(x + c * d * k - r * 0.3)} cy={fmt(y + sn * d * k - r * 0.32)} r={fmt(r * 0.34)} fill="#FFFFFF" opacity={0.32} />
        </g>
      ))}
      <Tether s={s} />
      {s.front && <Electron s={s} />}
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

/** the foreground molecules that can be on screen */
const visible = (tip: Pt, m: number) => {
  const R = {x0: (-120 - tip.x) / m, x1: (1200 - tip.x) / m, y0: (-120 - tip.y) / m, y1: (2040 - tip.y) / m};
  return FG.filter((q) => q.x > R.x0 && q.x < R.x1 && q.y > R.y0 && q.y < R.y1);
};

export const MicroAir3: React.FC<{t: number; tip: Pt; m: number; alpha: number; glow: number}> = ({t, tip, m, alpha, glow}) => {
  const tm = tipMicro(t);
  const fr = Math.round(t * 30); // frame-unique ids (contact sheets draw several frames in one document)
  const tipS = {x: tip.x + m * tm.x, y: tip.y + m * tm.y};
  // the background layer is farther: it scales more slowly and moves less (parallax)
  const sb = 0.46 * Math.pow(m, 0.55);
  const ab = {x: 540 + 0.6 * (tip.x - 540), y: 960 + 0.6 * (tip.y - 960)};
  const vis = visible(tip, m);
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

/** the pulled electrons and their tethers again, drawn above the leader (its tip glow would otherwise wash out the
 *  nearest ones). They fade in with the pull, exactly over their copies below, so nothing pops or doubles. */
export const MicroTug3: React.FC<{t: number; tip: Pt; m: number; alpha: number; glow: number}> = ({t, tip, m, alpha, glow}) => {
  const tm = tipMicro(t);
  const els: React.ReactNode[] = [];
  for (const q of visible(tip, m)) {
    if (q.near <= 0.01) continue;
    const s = molState(q, t, glow, tm);
    const a = ss(s.kk, 0.03, 0.25) * q.op;
    if (a <= 0.01) continue;
    els.push(
      <g key={q.id} opacity={fmt(a)}>
        <Tether s={s} />
        <Electron s={s} />
      </g>,
    );
  }
  if (!els.length) return null;
  return (
    <g opacity={alpha} transform={`translate(${fmt(tip.x)} ${fmt(tip.y)}) scale(${fmt(m)})`}>
      {els}
    </g>
  );
};
