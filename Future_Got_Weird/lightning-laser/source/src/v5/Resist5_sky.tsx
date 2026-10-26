// V5 shot B2: the storm at storm scale, seen side-on from far off. Screen units at the shot's base framing (y down).
//   sky     dark under the deck, a hazy band at the horizon behind the ranges (it silhouettes the summit)
//   deck    the cell as rows of broad billows, back (top) to front (bottom), in the film's storm values: dark masses,
//           each row's upper outline only a thin, slightly lighter lip (no pale outlines), the bottom row cut flat by
//           the base line, and a dark ragged lowering hanging over the place the leader is trying to reach
//   rain    soft-edged rain shafts hanging from the base, streaked and falling; streaks near the tip catch its light
//   summit  the peak the leader climbs out of (Resist5_leader SUMMIT), faceted rock in the leader's plane
//   ranges  a far ridge line behind the summit and a near one, nearly black, under the caption band
// Lighting is local: the tip lights the base above it (more the nearer it gets), clipped to the cloud, with a glow
// inside the cell over it; the channel's foot lights the summit's crest and faces; the rain round the tip.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {PAL} from '../v3/palette';
import {Pt, SUMMIT, TIP_END} from './Resist5_leader';

type Lobe = {x: number; y: number; rx: number; ry: number};
const lobeD = (l: Lobe, k = 1, dx = 0, dy = 0) => {
  const rx = l.rx * k, ry = l.ry * k, cx = l.x + dx, cy = l.y + dy;
  return `M${fmt(cx - rx)},${fmt(cy)} a${fmt(rx)},${fmt(ry)} 0 1,0 ${fmt(2 * rx)},0 a${fmt(rx)},${fmt(ry)} 0 1,0 ${fmt(-2 * rx)},0 Z`;
};
/** lobes along x with sizes and heights shaped by profile functions (the cell rises and swells over its core) */
const strip = (n: number, x0: number, x1: number, yOf: (x: number) => number, rOf: (x: number) => number, sq: number, seed: number): Lobe[] =>
  Array.from({length: n}, (_, i) => {
    const u = (i + 0.2 + hash(seed, 99) + 0.7 * (hash(i, seed) - 0.5)) / n;
    const x = x0 + (x1 - x0) * u;
    const r = rOf(x) * (0.7 + 0.6 * Math.pow(hash(i, seed + 2), 1.4));
    return {x, y: yOf(x) + 0.4 * r * (hash(i, seed + 1) - 0.5), rx: r * (1.15 + 0.35 * hash(i, seed + 3)), ry: r * sq};
  });
/** the cell's core: over the place the leader stalls */
const CORE = TIP_END.x + 10;
const bumpX = (x: number, w: number) => Math.exp(-(((x - CORE) / w) ** 2));
/** the cell's base line (the flat underside): sagging toward the core */
export const baseY = (x: number) => 438 + 46 * bumpX(x, 300) + 14 * noise1(x / 75, 7) + 7 * noise1(x / 26, 8);
const basePath = (x0: number, x1: number, n: number) =>
  Array.from({length: n}, (_, i) => {
    const x = x1 - (i * (x1 - x0)) / (n - 1);
    return `L${fmt(x)},${fmt(baseY(x))}`;
  }).join(' ');
/** the rows: [centre y, radius, squash, count, lip, body top, body bottom] (the film's storm-deck values) */
type Row = {lobes: Lobe[]; lip: string; top: string; bot: string; y0: number; y1: number; flat?: boolean};
const ROWS: Row[] = (
  [
    [-90, 300, 0.6, 5, '#1E3044', '#162536', '#101C2A'],
    [80, 250, 0.58, 6, '#1D2E42', '#152334', '#0F1A28'],
    [230, 200, 0.55, 7, '#1C2C40', '#142132', '#0E1825'],
    [345, 150, 0.52, 9, '#1B2A3D', '#13202F', '#0D1622'],
    [0, 110, 0.5, 11, '#1A283A', '#111D2C', '#0A131E'],
  ] as [number, number, number, number, string, string, string][]
).map(([y, r, sq, n, lip, top, bot], j, all) => {
  const flat = j === all.length - 1;
  const lobes = strip(n, -260, 1340, (x) => (flat ? baseY(x) - 30 : y - 34 * bumpX(x, 320)), (x) => r * (1 + 0.2 * bumpX(x, 280)), sq, 11 + j * 13);
  return {lobes, lip, top, bot, y0: (flat ? 400 : y) - r * 0.8, y1: (flat ? 480 : y) + r * 0.7, flat};
});
/** the lowering over the core: ragged dark lobes hanging under the base, above the stalled tip (out of its reach) */
const LOWER: Lobe[] = Array.from({length: 7}, (_, i) => {
  const u = (i + 0.5) / 7;
  const r = 34 + 26 * hash(i, 53) + 16 * (1 - Math.abs(u - 0.5) * 2);
  const x = CORE - 190 + 380 * u + 24 * (hash(i, 51) - 0.5);
  return {x, y: baseY(x) + 12 + 20 * hash(i, 52) - 22 * Math.abs(u - 0.5) * 2, rx: r * 1.25, ry: r * 0.48};
});

/** ridge line: y at x for a range (noise-built, sharp crests) */
const ridgeY = (x: number, y0: number, amp: number, seed: number) =>
  y0 - amp * (0.6 * (1 - Math.abs(noise1(x / 230, seed))) + 0.28 * (1 - Math.abs(noise1(x / 95, seed + 1))) + 0.12 * noise1(x / 38, seed + 2) - 0.45);
const ridgeD = (y0: number, amp: number, seed: number) => {
  const pts: string[] = [];
  for (let x = -260; x <= 1340; x += 10) pts.push(`${fmt(x)},${fmt(ridgeY(x, y0, amp, seed))}`);
  return `M-260,2400 L${pts.join(' L')} L1340,2400 Z`;
};
const RANGES = [
  {y0: 1500, amp: 74, seed: 81, fill: '#1B3042', fill2: '#16283A', rim: '#3A5570'},
  {y0: 1600, amp: 110, seed: 87, fill: '#0B1620', fill2: '#060B11', rim: '#253C52'},
];

// ------------------------------------------------------------------ the summit (in the leader's plane)
/** the massif's crest: the summit is its highest point; shoulders and a rocky jag away from it */
const crestY = (x: number) => {
  const d = x - SUMMIT.x;
  const a = Math.abs(d);
  const slope = d < 0 ? 0.62 : 0.5;
  const shoulder = d < 0 ? 30 * Math.exp(-(((d + 210) / 70) ** 2)) : 26 * Math.exp(-(((d - 260) / 80) ** 2));
  const jagK = clamp(a / 50);
  return SUMMIT.y - 2 + slope * Math.pow(a, 0.96) - shoulder + jagK * (9 * noise1(x / 22, 31) + 16 * noise1(x / 70, 33));
};
const CREST: Pt[] = Array.from({length: 121}, (_, i) => {
  const x = SUMMIT.x - 640 + i * (1280 / 120);
  return {x, y: Math.min(1900, crestY(x))};
});
const crestD = `M${CREST.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}`;
const massD = `${crestD} L${fmt(SUMMIT.x + 640)},2000 L${fmt(SUMMIT.x - 640)},2000 Z`;
/** spurs down from the crest: the faces between them alternate lit (toward the channel) and shadowed */
const SPURS = [-300, -170, -60, 70, 180, 300, 420].map((dx, i) => {
  const x = SUMMIT.x + dx;
  const top = {x, y: crestY(x)};
  const lean = dx <= 0 ? -0.35 - 0.15 * hash(i, 41) : 0.35 + 0.15 * hash(i, 41);
  // a crooked rib of rock: it wanders a little as it runs down
  return Array.from({length: 6}, (_, k) => {
    const h = k * 60;
    return {x: x + lean * h * (1 + 0.25 * (k / 5)) + (k ? 12 * (hash(i * 7 + k, 43) - 0.5) : 0), y: top.y + h};
  });
});

// ------------------------------------------------------------------ layers
export const SkyB5: React.FC<{tag: string; flash: number}> = ({tag, flash}) => (
  <g>
    <defs>
      <linearGradient id={`${tag}-sky`} gradientUnits="userSpaceOnUse" x1="0" y1="-300" x2="0" y2="1700">
        <stop offset="0" stopColor="#09121E" />
        <stop offset="0.4" stopColor="#0E1A29" />
        <stop offset="0.62" stopColor="#15273A" />
        <stop offset="0.8" stopColor={mix('#203A4C', '#34466E', 0.2 * flash)} />
        <stop offset="0.87" stopColor={mix('#2A4757', '#41538A', 0.2 * flash)} />
        <stop offset="1" stopColor="#1A2E3E" />
      </linearGradient>
    </defs>
    <rect x={-500} y={-500} width={2080} height={2920} fill={`url(#${tag}-sky)`} />
  </g>
);

/** the deck, its underside lit by the tip below it (`Lb` 0..~1.6, already scaled by the tip's nearness), the glow in
 *  the cell above it (`Li`) */
export const DeckB5: React.FC<{tag: string; Lb: number; Li: number; t: number; tip: Pt}> = ({tag, Lb, Li, t, tip}) => {
  // a very slow roll of the lobes (alive, not busy)
  const roll = (l: Lobe, i: number, m: number): Lobe => ({...l, x: l.x + 5 * noise1(t * 0.55 + i * 0.37 + m, 61), y: l.y + 2.5 * noise1(t * 0.45 + i * 0.29 + m, 63)});
  const lit = clamp(Lb, 0, 1.6);
  const lowB = LOWER.map((l, i) => roll(l, i, 9));
  const by = baseY(tip.x);
  const bodyD = `M-500,-600 L1580,-600 ${basePath(-500, 1580, 140)} Z`;
  return (
    <g>
      <defs>
        {ROWS.map((m, j) => (
          <linearGradient key={j} id={`${tag}-m${j}`} gradientUnits="userSpaceOnUse" x1="0" y1={fmt(m.y0)} x2="0" y2={fmt(m.y1)}>
            <stop offset="0" stopColor={m.top} />
            <stop offset="1" stopColor={m.bot} />
          </linearGradient>
        ))}
        <clipPath id={`${tag}-bc`}>
          <path d={bodyD} />
        </clipPath>
        <clipPath id={`${tag}-low`}>
          {ROWS[ROWS.length - 1].lobes.map((l, i) => <path key={i} d={lobeD(l)} />)}
          {lowB.map((l, i) => <path key={`l${i}`} d={lobeD(l)} />)}
        </clipPath>
        <clipPath id={`${tag}-all`}>
          <path d={bodyD} />
          {lowB.map((l, i) => <path key={`l${i}`} d={lobeD(l)} />)}
        </clipPath>
        {/* the underside over the tip: bright straight above it, gone within a few hundred px, flattened (seen edge-on) */}
        <radialGradient id={`${tag}-ul`} gradientUnits="userSpaceOnUse" cx={fmt(tip.x)} cy={fmt(by + 30)} r={360} gradientTransform={`translate(${fmt(tip.x)} ${fmt(by + 30)}) scale(1 0.55) translate(${fmt(-tip.x)} ${fmt(-(by + 30))})`}>
          <stop offset="0" stopColor="#D6DBFF" stopOpacity={0.62} />
          <stop offset="0.22" stopColor={PAL.mid} stopOpacity={0.42} />
          <stop offset="0.5" stopColor={PAL.halo} stopOpacity={0.16} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
        {/* the cell lit from inside: a broad, flat glow above the base (it spreads through the cloud, it is not a lamp) */}
        <radialGradient id={`${tag}-in`} gradientUnits="userSpaceOnUse" cx={fmt(tip.x)} cy={fmt(by - 120)} r={520} gradientTransform={`translate(${fmt(tip.x)} ${fmt(by - 120)}) scale(1 0.45) translate(${fmt(-tip.x)} ${fmt(-(by - 120))})`}>
          <stop offset="0" stopColor="#C8CEFF" stopOpacity={0.45} />
          <stop offset="0.4" stopColor={PAL.halo} stopOpacity={0.14} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${tag}-sh`} gradientUnits="userSpaceOnUse" x1="0" y1="430" x2="0" y2="860">
          <stop offset="0" stopColor="#060C14" stopOpacity={0.5} />
          <stop offset="1" stopColor="#060C14" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* the air under the base is in its shadow (the band follows the base line: no straight edge) */}
      <path d={`M-500,900 L1580,900 ${basePath(-500, 1580, 140)} Z`} fill={`url(#${tag}-sh)`} />
      {/* behind the rows: the cell's dark body (no sky shows through between the billows) */}
      <path d={bodyD} fill="#0B1522" />
      {ROWS.map((m, j) => {
        const lobes = m.lobes.map((l, i) => roll(l, i, j * 3.1));
        return (
          <g key={j} clipPath={m.flat ? `url(#${tag}-bc)` : undefined}>
            {lobes.map((l, i) => {
              // lips over the tip catch its light (violet-white); the rest stay storm-dark
              const pr = Math.exp(-(((l.x - tip.x) / 340) ** 2 + ((l.y - by) / 300) ** 2));
              return <path key={`p${i}`} d={lobeD(l)} fill={mix(m.lip, '#8E98E4', clamp(pr * 0.36 * lit))} />;
            })}
            {lobes.map((l, i) => <path key={`b${i}`} d={lobeD(l, 0.988, 0, l.ry * 0.055)} fill={`url(#${tag}-m${j})`} />)}
          </g>
        );
      })}
      {/* the lowering: dark, ragged, over the core */}
      {lowB.map((l, i) => <path key={`lp${i}`} d={lobeD(l)} fill={mix('#18273A', '#7E88D8', clamp(0.32 * lit * Math.exp(-(((l.x - tip.x) / 170) ** 2))))} />)}
      {lowB.map((l, i) => <path key={`lb${i}`} d={lobeD(l, 0.97, 0, l.ry * 0.1)} fill={i % 2 ? '#0A1420' : '#0D1826'} />)}
      {/* the leader's light: the underside over the tip, and the cell lit from inside above it */}
      <g style={{mixBlendMode: 'screen'}}>
        <g clipPath={`url(#${tag}-all)`}>
          <rect x={-400} y={-600} width={1880} height={1300} fill={`url(#${tag}-in)`} opacity={fmt(clamp(0.05 + 0.55 * Li, 0, 1))} />
        </g>
        <g clipPath={`url(#${tag}-low)`}>
          <rect x={-400} y={-600} width={1880} height={1300} fill={`url(#${tag}-ul)`} opacity={fmt(clamp(0.06 + 0.62 * lit, 0, 1))} />
        </g>
      </g>
    </g>
  );
};

/** soft rain shafts from the base to the ranges, streaked and falling; streaks near the tip catch its light */
const SHAFTS = [
  {x0: -200, x1: 300, top: 470, bot: 1560, lean: -90, seed: 3, a: 0.32},
  {x0: 820, x1: 1280, top: 460, bot: 1540, lean: -80, seed: 5, a: 0.28},
  {x0: 380, x1: 820, top: 500, bot: 1480, lean: -70, seed: 7, a: 0.13},
];
export const RainB5: React.FC<{tag: string; t: number; L: number; tip: Pt}> = ({tag, t, L, tip}) => (
  <g>
    {SHAFTS.map((s, i) => {
      const id = `${tag}-rs${i}`;
      const poly = `M${s.x0},${s.top} L${s.x1},${s.top} L${s.x1 + s.lean},${s.bot} L${s.x0 + s.lean},${s.bot} Z`;
      const H = s.bot - s.top;
      const plain: string[] = [], litS: string[] = [];
      for (let k = 0; k < 34; k++) {
        const u = hash(k, s.seed * 10 + 1);
        const y = s.top + ((hash(k, s.seed * 10 + 2) * H + t * 1150) % H);
        const v = (y - s.top) / H;
        const x = s.x0 + (s.x1 - s.x0) * u + s.lean * v;
        const d = `M${fmt(x)},${fmt(y)} l${fmt(s.lean * 0.07)},${fmt(80 + 50 * hash(k, s.seed * 10 + 3))}`;
        (Math.hypot(x - tip.x, y + 50 - tip.y) < 230 ? litS : plain).push(d);
      }
      return (
        <g key={i}>
          <defs>
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={s.top} x2="0" y2={s.bot}>
              <stop offset="0" stopColor="#4A6378" stopOpacity={s.a} />
              <stop offset="0.65" stopColor="#3A5468" stopOpacity={s.a * 0.55} />
              <stop offset="1" stopColor="#3A5468" stopOpacity={0} />
            </linearGradient>
            {/* soft sides: the shaft fades out across its width */}
            <linearGradient id={`${id}-x`} gradientUnits="userSpaceOnUse" x1={s.x0 + s.lean / 2} y1="0" x2={s.x1 + s.lean / 2} y2="0">
              <stop offset="0" stopColor="#FFF" stopOpacity={0} />
              <stop offset="0.5" stopColor="#FFF" stopOpacity={1} />
              <stop offset="1" stopColor="#FFF" stopOpacity={0} />
            </linearGradient>
            <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-500} y={-500} width={2080} height={2920}>
              <path d={poly} fill={`url(#${id}-x)`} />
            </mask>
          </defs>
          <g mask={`url(#${id}-m)`}>
            <path d={poly} fill={`url(#${id})`} />
            <path d={plain.join(' ')} stroke="#A4B8CC" strokeOpacity={0.2} strokeWidth={2} strokeLinecap="round" fill="none" />
          </g>
          {/* the streaks by the tip flash with it (unmasked: they are lit, not hazy) */}
          {litS.length > 0 && <path d={litS.join(' ')} stroke={mix('#A4B8CC', '#C4CCFF', clamp(0.8 * L))} strokeOpacity={fmt(clamp(0.16 + 0.26 * L, 0, 0.5))} strokeWidth={2} strokeLinecap="round" fill="none" />}
        </g>
      );
    })}
  </g>
);

/** the summit and its massif; `L` lights its crest and faces round the channel's foot */
export const PeakB5: React.FC<{tag: string; L: number}> = ({tag, L}) => {
  const lit = clamp(L, 0, 1.6);
  return (
    <g>
      <defs>
        <clipPath id={`${tag}-pk`}>
          <path d={massD} />
        </clipPath>
        <linearGradient id={`${tag}-pf`} gradientUnits="userSpaceOnUse" x1="0" y1={fmt(SUMMIT.y)} x2="0" y2={fmt(SUMMIT.y + 380)}>
          <stop offset="0" stopColor="#15263A" />
          <stop offset="1" stopColor="#0B1520" />
        </linearGradient>
        <radialGradient id={`${tag}-pl`} gradientUnits="userSpaceOnUse" cx={fmt(SUMMIT.x)} cy={fmt(SUMMIT.y)} r={230}>
          <stop offset="0" stopColor="#D8DDFF" stopOpacity={0.6} />
          <stop offset="0.2" stopColor={PAL.mid} stopOpacity={0.3} />
          <stop offset="0.55" stopColor={PAL.halo} stopOpacity={0.12} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={massD} fill={`url(#${tag}-pf)`} />
      {/* the faces: those turned away from the channel's foot are in shadow */}
      <g clipPath={`url(#${tag}-pk)`}>
        {SPURS.slice(0, -1).map((s, i) => {
          const n = SPURS[i + 1];
          if (i % 2) return null;
          return <path key={i} d={`M${s.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} L${n.map((q) => `${fmt(q.x)},${fmt(q.y)}`).reverse().join(' L')} Z`} fill="#050B12" opacity={0.4} />;
        })}
        {SPURS.map((s, i) => <path key={`s${i}`} d={`M${s.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}`} fill="none" stroke="#24384E" strokeOpacity={0.32} strokeWidth={2} />)}
      </g>
      <path d={crestD} fill="none" stroke="#2E4862" strokeOpacity={0.8} strokeWidth={2.5} />
      {/* the channel's foot lights the rock round the summit */}
      {lit > 0.01 && (
        <g style={{mixBlendMode: 'screen'}}>
          <g clipPath={`url(#${tag}-pk)`}>
            <rect x={SUMMIT.x - 320} y={SUMMIT.y - 40} width={640} height={420} fill={`url(#${tag}-pl)`} opacity={fmt(clamp(0.2 + 0.4 * lit))} />
          </g>
          <path d={crestD} fill="none" stroke={`url(#${tag}-pl)`} strokeWidth={4} opacity={fmt(clamp(0.5 + 0.5 * lit))} />
        </g>
      )}
    </g>
  );
};

/** one range (0 far, 1 near), with a faint rim on its crest when the leader flashes */
export const RangeB5: React.FC<{tag: string; i: number; L: number}> = ({tag, i, L}) => {
  const r = RANGES[i];
  const d = ridgeD(r.y0, r.amp, r.seed);
  const rimK = clamp(L) * (0.12 + 0.08 * i);
  return (
    <g>
      <defs>
        {/* the near range darkens downward into the caption band (no seam) */}
        <linearGradient id={`${tag}-rg${i}`} gradientUnits="userSpaceOnUse" x1="0" y1={r.y0 - r.amp} x2="0" y2={r.y0 + 260}>
          <stop offset="0" stopColor={r.fill} />
          <stop offset="1" stopColor={r.fill2} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${tag}-rg${i})`} />
      <path d={d} fill="none" stroke={r.rim} strokeOpacity={0.35} strokeWidth={2} />
      {rimK > 0.01 && <path d={d} fill="none" stroke={PAL.mid} strokeOpacity={fmt(rimK)} strokeWidth={2.5} style={{mixBlendMode: 'screen'}} />}
    </g>
  );
};
