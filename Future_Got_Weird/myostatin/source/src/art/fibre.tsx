// V6 muscle world (units u, y down): one clear muscle bundle and one clear interaction. A horizontal bundle of six
// broad fibre strands (clean longitudinal cylinders, restrained cross-striations) inside a thin sheath, with
// neighbouring bundles above and below across dark tissue fluid. The bundle has a gentle belly at x = 0. One receptor
// (a socket in the top strand's membrane, at x = 0), the pink two-lobed myostatin, and the teal inhibitor.
import React from 'react';
import {P, add, closed, open, pt} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp} from '../lib';

export type Cam = {x: number; y: number; w: number};
export type FibreState = {
  t: number;
  g: number;                                              // strand thickness factor (1 = at the start)
  myo?: {p: P; ang: number; op: number};                  // the one pink protein (world position)
  inh?: {p: P; ang: number; op: number; wrap: number};    // the teal inhibitor; wrap 0 open .. 1 closed round the protein
  recOp?: number;                                         // the receptor appears with the molecular story
};

export const NS = 6;
const R0 = 60, GAP0 = 10, SHEATH = 7;
export const strandR = (g: number) => R0 * g;
const gap = (g: number) => GAP0 * g;
/** the bundle's belly: strands spread a little more in the middle */
export const belly = (x: number) => 1 + 0.12 * Math.exp(-((x / 520) ** 2));
/** half-thickness of the bundle (to the outer membrane) at x = 0 for growth g, before the belly */
const half0 = (g: number) => 2.5 * (2 * strandR(g) + gap(g)) + strandR(g);
/** the top strand's outer membrane (world y) at x */
export const topY = (g: number, x = 0) => -half0(g) * belly(x);
const NB_GAP = 330; // open tissue fluid between neighbouring bundles (room for the molecules)

export const PAL = {
  fluid: '#2A0B1C', fluid2: '#3D1229',
  lit: '#F27C68', mid: '#D94A43', shade: '#962330', deep: '#5E0F1E', ink: '#3E0814', hl: '#FFC2AE',
  sheath: '#F1B3AA',
  pink: '#F23C88', pinkLit: '#FFB3D2', pinkDk: '#B8155E', pinkInk: '#4E0727',
  rec: '#7E8EF2', recLit: '#C4CCFF', recDk: '#4452B8', recInk: '#161C5C',
  teal: '#23C6B2', tealLit: '#A6F7EA', tealDk: '#13897B', tealInk: '#053F39',
};

/** the pink two-lobed protein (same shape everywhere in the film) */
export const PROT_S = 5.6;
export const Protein: React.FC<{p: P; ang?: number; op?: number; s?: number}> = ({p, ang = 0, op = 1, s = PROT_S}) => (
  <g transform={`translate(${p.x} ${p.y}) rotate(${(ang * 180) / Math.PI}) scale(${s})`} opacity={op}>
    {[-1, 1].map((k) => (
      <g key={k} transform={`scale(${k} 1)`}>
        <path d="M0.4 -1.2 C2.6 -5.6 8.2 -6.4 9.8 -2.6 C10.8 0.2 8.8 3.6 5.6 3.4 C3.4 3.2 2.0 1.6 0.4 1.2 Z" fill={PAL.pink} stroke={PAL.pinkInk} strokeWidth={0.55} strokeLinejoin="round" />
        <path d="M2.4 -2.6 C4.2 -4.6 7.4 -4.8 8.6 -3.0" stroke={PAL.pinkLit} strokeWidth={0.8} fill="none" strokeLinecap="round" />
        <path d="M3.2 2.0 C5 2.9 7.6 2.6 8.8 0.9" stroke={PAL.pinkDk} strokeWidth={0.7} fill="none" strokeLinecap="round" opacity={0.7} />
      </g>
    ))}
    <ellipse cx={0} cy={0} rx={1.8} ry={1.6} fill={PAL.pinkDk} stroke={PAL.pinkInk} strokeWidth={0.45} />
  </g>
);
/** the protein's lowest point below its centre (local, at scale s), for seating it in the socket */
export const PROT_BOTTOM = 3.5 * PROT_S;
/** the inhibitor's reach below the protein's centre once wrapped */
export const INH_BOTTOM = 13.8 * PROT_S + 1.7 * PROT_S;

/** the receptor: a socket set into the membrane; its cradle has two dips shaped for the protein's two lobes */
export const Receptor: React.FC<{p: P; op?: number}> = ({p, op = 1}) => {
  const id = uid('rcg');
  // the cradle line, left to right (u; y = 0 is the membrane surface): two dips where the protein's lobes seat
  const rim: [number, number][] = [[-58, -14], [-50, 2], [-42, 14], [-32, 18.5], [-22, 13], [-10, 3], [0, 0], [10, 3], [22, 13], [32, 18.5], [42, 14], [50, 2], [58, -14]];
  const body = [...rim.map(([x, y]) => pt(x, y)), pt(63, -10), pt(58, 40), pt(20, 56), pt(-20, 56), pt(-58, 40), pt(-63, -10)];
  return (
    <g transform={`translate(${p.x} ${p.y})`} opacity={op}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={PAL.recLit} />
          <stop offset={0.35} stopColor={PAL.rec} />
          <stop offset={1} stopColor={PAL.recDk} />
        </linearGradient>
      </defs>
      <path d={`M-11 54 L-8 92 L8 92 L11 54 Z`} fill={PAL.recDk} stroke={PAL.recInk} strokeWidth={3} />
      <path d={closed(body, 0.6)} fill={`url(#${id})`} stroke={PAL.recInk} strokeWidth={3.4} strokeLinejoin="round" />
      <path d={open(rim.slice(1, -1).map(([x, y]) => pt(x, y + 5)))} stroke={PAL.recLit} strokeWidth={3} fill="none" opacity={0.8} strokeLinecap="round" />
    </g>
  );
};
/** where a protein's centre sits when docked in the receptor at membrane point p (its lobes in the two dips) */
export const dockPoint = (p: P) => pt(p.x, p.y + 1.5);

/** the teal inhibitor: a hub with two curved arms that open over the protein and close round underneath it */
export const Inhibitor: React.FC<{p: P; ang?: number; op?: number; wrap: number}> = ({p, ang = 0, op = 1, wrap}) => {
  const R = 13.8 * PROT_S, th = 3.4 * PROT_S;
  const reach = lerp(62, 168, clamp(wrap)); // degrees from the top, each side
  const arm = (k: number) => {
    const n = 14;
    const outer: P[] = [], inner: P[] = [];
    for (let i = 0; i <= n; i++) {
      const a = ((-90 + k * (14 + ((reach - 14) * i) / n)) * Math.PI) / 180;
      outer.push(pt(Math.cos(a) * (R + th / 2), Math.sin(a) * (R + th / 2)));
      inner.push(pt(Math.cos(a) * (R - th / 2), Math.sin(a) * (R - th / 2)));
    }
    return closed([...outer, ...inner.reverse()], 0.7);
  };
  const hl = (k: number) => {
    const pts: P[] = [];
    for (let i = 0; i <= 8; i++) {
      const a = ((-90 + k * (18 + ((reach * 0.7 - 18) * i) / 8)) * Math.PI) / 180;
      pts.push(pt(Math.cos(a) * (R + th * 0.18), Math.sin(a) * (R + th * 0.18)));
    }
    return open(pts);
  };
  return (
    <g transform={`translate(${p.x} ${p.y}) rotate(${(ang * 180) / Math.PI})`} opacity={op}>
      {[-1, 1].map((k) => (
        <g key={k}>
          <path d={arm(k)} fill={PAL.teal} stroke={PAL.tealInk} strokeWidth={3} strokeLinejoin="round" />
          <path d={hl(k)} stroke={PAL.tealLit} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.75} />
        </g>
      ))}
      <ellipse cx={0} cy={-R - 2} rx={7.6 * PROT_S} ry={5.2 * PROT_S} fill={PAL.teal} stroke={PAL.tealInk} strokeWidth={3} />
      <ellipse cx={-2 * PROT_S} cy={-R - 3.6 * PROT_S} rx={3.4 * PROT_S} ry={1.4 * PROT_S} fill={PAL.tealLit} opacity={0.65} />
      <ellipse cx={0} cy={-R + 1.2 * PROT_S} rx={5.2 * PROT_S} ry={1.4 * PROT_S} fill={PAL.tealDk} opacity={0.5} />
    </g>
  );
};

/** one bundle: six strands following the belly, its sheath; hero = the bundle with the receptor */
const Bundle: React.FC<{cy: number; g: number; vx0: number; vx1: number; sc: number; dim: number; ids: {s: string; st: string}}> = ({cy, g, vx0, vx1, sc, dim, ids}) => {
  const n = 28;
  const xs = Array.from({length: n + 1}, (_, i) => vx0 + ((vx1 - vx0) * i) / n);
  const r = strandR(g), gp = gap(g);
  const strands: React.ReactNode[] = [];
  const stOp = clamp((18 * sc - 4) / 5) * 0.55; // striations only once they are resolvable
  const inkW = Math.max(2.4, 1.4 / sc);
  for (let i = 0; i < NS; i++) {
    const c0 = (i - (NS - 1) / 2) * (2 * r + gp);
    const top = xs.map((x) => pt(x, cy + (c0 - r) * belly(x)));
    const bot = xs.map((x) => pt(x, cy + (c0 + r) * belly(x)));
    const d = closed([...top, ...[...bot].reverse()], 0);
    const hl = xs.map((x) => pt(x, cy + (c0 - 0.55 * r) * belly(x)));
    const sh = xs.map((x) => pt(x, cy + (c0 + 0.62 * r) * belly(x)));
    const k = hash(i * 3.7 + cy * 0.001);
    strands.push(
      <g key={i}>
        <path d={d} fill={`url(#${ids.s})`} />
        {stOp > 0.01 && <path d={d} fill={`url(#${ids.st})`} opacity={stOp} />}
        <path d={open(sh)} stroke={PAL.shade} strokeWidth={0.42 * r} fill="none" opacity={0.35} />
        <path d={open(hl)} stroke={PAL.hl} strokeWidth={0.09 * r} fill="none" opacity={0.5 + 0.1 * k} strokeLinecap="round" />
        <path d={open(top)} stroke={PAL.ink} strokeWidth={inkW} fill="none" />
        <path d={open(bot)} stroke={PAL.ink} strokeWidth={inkW} fill="none" />
      </g>,
    );
  }
  const H = half0(g);
  const sTop = xs.map((x) => pt(x, cy - (H + SHEATH) * belly(x)));
  const sBot = xs.map((x) => pt(x, cy + (H + SHEATH) * belly(x)));
  return (
    <g>
      <path d={closed([...sTop, ...[...sBot].reverse()], 0)} fill={PAL.sheath} />
      {strands}
      {dim > 0.01 && <path d={closed([...sTop, ...[...sBot].reverse()], 0)} fill={PAL.fluid} opacity={dim} />}
    </g>
  );
};

export const FibreWorld: React.FC<{s: FibreState; cam: Cam; margin?: number}> = ({s, cam, margin = 1}) => {
  const sc = 1080 / cam.w;
  const hw = cam.w * 0.62 * margin, hh = cam.w * (16 / 9) * 0.56 * margin;
  const vx0 = cam.x - hw, vx1 = cam.x + hw, vy0 = cam.y - hh, vy1 = cam.y + hh;
  const ids = {s: uid('fs'), st: uid('fst')};
  const g = s.g;
  // neighbouring bundles grow with the muscle (a little less), pushed apart by the hero
  const gN = 1 + 0.8 * (g - 1);
  const Hh = (half0(g) + SHEATH) * 1.12, HN = (half0(gN) + SHEATH) * 1.12;
  const bundles: {cy: number; g: number; dim: number}[] = [{cy: 0, g, dim: 0}];
  for (let j = 1; j <= 6; j++) {
    const off = Hh + NB_GAP + HN + (j - 1) * (2 * HN + NB_GAP);
    bundles.push({cy: -off, g: gN, dim: 0.28 + 0.04 * j}, {cy: off, g: gN, dim: 0.28 + 0.04 * j});
  }
  const rec = pt(0, topY(g));
  const strip = 18; // striation pitch
  return (
    <g>
      <defs>
        <linearGradient id={ids.s} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor={PAL.lit} />
          <stop offset={0.3} stopColor={PAL.mid} />
          <stop offset={0.75} stopColor={mix(PAL.mid, PAL.shade, 0.6)} />
          <stop offset={1} stopColor={PAL.deep} />
        </linearGradient>
        <pattern id={ids.st} patternUnits="userSpaceOnUse" width={strip} height={4000} y={-2000}>
          <rect x={0} y={0} width={strip * 0.22} height={4000} fill={PAL.deep} opacity={0.5} />
        </pattern>
      </defs>
      <rect x={vx0} y={vy0} width={vx1 - vx0} height={vy1 - vy0} fill={PAL.fluid} />
      {bundles.filter((b) => b.cy + 1400 > vy0 && b.cy - 1400 < vy1).map((b, i) => (
        <Bundle key={i} cy={b.cy} g={b.g} vx0={vx0} vx1={vx1} sc={sc} dim={b.dim} ids={ids} />
      ))}
      {(s.recOp ?? 1) > 0.01 && <Receptor p={rec} op={s.recOp ?? 1} />}
      {s.myo && s.myo.op > 0.01 && <Protein p={s.myo.p} ang={s.myo.ang} op={s.myo.op} />}
      {s.inh && s.inh.op > 0.01 && <Inhibitor p={s.inh.p} ang={s.inh.ang} op={s.inh.op} wrap={s.inh.wrap} />}
    </g>
  );
};
void add;
