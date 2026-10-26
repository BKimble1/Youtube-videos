// V5 shot B2: the storm at storm scale, seen side-on from far off. Screen units at the shot's base framing (y down).
//   sky     dark under the deck, a hazy band at the horizon behind the ranges
//   deck    the cell as four masses, back to front: the towering top, the body, the flat dark base (sagging toward the
//           core) and a ragged lowering under the core where the leader comes out (Resist5_leader ORIGIN). Each mass is
//           a union of lobes with a lighter lip only along its own upper outline, so it reads as one mass, not scales
//   rain    soft-edged rain shafts hanging from the base on either side, streaked and falling
//   ranges  three ridge lines, cooler and lighter with distance; the nearest is nearly black (the caption band sits on it)
// Lighting is local: the leader lights the base's underside and the lowering round the origin (clipped to the cloud),
// a glow inside the cell above it, the rain shaft nearest it and the ridge crests faintly.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {PAL} from '../v3/palette';
import {ORIGIN} from './Resist5_leader';

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
    const r = rOf(x) * (0.55 + 0.85 * Math.pow(hash(i, seed + 2), 1.6));
    return {x, y: yOf(x) + 0.5 * r * (hash(i, seed + 1) - 0.5), rx: r * (1.0 + 0.3 * hash(i, seed + 3)), ry: r * sq};
  });
const CORE = ORIGIN.x - 20;
const bump = (x: number, w: number) => Math.exp(-(((x - CORE) / w) ** 2));
/** the cell's base line (the flat underside): sagging toward the core */
export const baseY = (x: number) => 560 + 58 * bump(x, 300) + 16 * noise1(x / 75, 7) + 8 * noise1(x / 26, 8);
/** the cell as rows of billows, back (top) to front (bottom): each row is a union of lobes of mixed sizes with a lip
 *  along its own upper outline and a body darkening downward, so each row's lip reads against the shadowed bottom of
 *  the row behind it (billows, not scales). The bottom row is cut flat by the base line. */
type Row = {lobes: Lobe[]; lip: string; top: string; bot: string; y0: number; y1: number; flat?: boolean};
const ROWS: Row[] = [
  [-120, 210, 0.78, 6, '#2B445E', '#1C3046', '#132336'],
  [0, 180, 0.74, 7, '#2A425B', '#1A2D42', '#112032'],
  [120, 160, 0.72, 8, '#283F57', '#182A3F', '#101D2E'],
  [235, 140, 0.7, 9, '#263C53', '#16283C', '#0F1B2B'],
  [345, 120, 0.68, 10, '#243A50', '#152639', '#0E1A29'],
  [450, 100, 0.64, 12, '#22374C', '#142436', '#0C1725'],
  [535, 82, 0.6, 14, '#20354A', '#132233', '#0A1522'],
].map(([y, r, sq, n, lip, top, bot], j) => {
  const yy = y as number, rr = r as number;
  // the rows swell and rise a little over the core (the cell's tower is above the origin)
  const lobes = strip(n as number, -220, 1300, (x) => (j === 6 ? baseY(x) - 34 : yy - 40 * bump(x, 320)), (x) => rr * (1 + 0.25 * bump(x, 280)), sq as number, 11 + j * 13);
  return {lobes, lip: lip as string, top: top as string, bot: bot as string, y0: yy - rr * 0.9, y1: yy + rr * 0.8, flat: j === 6};
});
/** the lowering under the core: ragged dark lobes hanging under the base, and scud fragments */
const LOWER: Lobe[] = [
  ...Array.from({length: 8}, (_, i) => {
    const u = (i + 0.5) / 8;
    const r = 40 + 32 * hash(i, 53) + 18 * (1 - Math.abs(u - 0.5) * 2);
    return {x: CORE - 200 + 400 * u + 26 * (hash(i, 51) - 0.5), y: baseY(CORE) + 22 + 30 * hash(i, 52) - 26 * Math.abs(u - 0.5) * 2, rx: r * 1.15, ry: r * 0.5};
  }),
];

/** ridge line: y at x for a range (noise-built, sharp crests) */
const ridgeY = (x: number, y0: number, amp: number, seed: number) =>
  y0 - amp * (0.6 * (1 - Math.abs(noise1(x / 230, seed))) + 0.28 * (1 - Math.abs(noise1(x / 95, seed + 1))) + 0.12 * noise1(x / 38, seed + 2) - 0.45);
const ridgeD = (y0: number, amp: number, seed: number) => {
  const pts: string[] = [];
  for (let x = -260; x <= 1340; x += 10) pts.push(`${fmt(x)},${fmt(ridgeY(x, y0, amp, seed))}`);
  return `M-260,2400 L${pts.join(' L')} L1340,2400 Z`;
};
export const RANGES = [
  {y0: 1360, amp: 96, seed: 81, fill: '#1E3446', rim: '#3D5872'},
  {y0: 1470, amp: 130, seed: 83, fill: '#122131', rim: '#34506A'},
  {y0: 1580, amp: 120, seed: 87, fill: '#09121A', rim: '#2C4660'},
];


// ------------------------------------------------------------------ layers
export const SkyB5: React.FC<{tag: string; flash: number}> = ({tag, flash}) => (
  <g>
    <defs>
      <linearGradient id={`${tag}-sky`} gradientUnits="userSpaceOnUse" x1="0" y1="-300" x2="0" y2="1700">
        <stop offset="0" stopColor="#09121E" />
        <stop offset="0.42" stopColor="#0E1A29" />
        <stop offset="0.6" stopColor="#15273A" />
        <stop offset="0.74" stopColor={mix('#233E50', '#3A4C78', 0.2 * flash)} />
        <stop offset="0.8" stopColor={mix('#2C4959', '#46588A', 0.2 * flash)} />
        <stop offset="1" stopColor="#1A2E3E" />
      </linearGradient>
    </defs>
    <rect x={-500} y={-500} width={2080} height={2920} fill={`url(#${tag}-sky)`} />
  </g>
);

/** the deck, with its underside lit round the origin by the leader (`L` 0..~1.6) */
export const DeckB5: React.FC<{tag: string; L: number; t: number}> = ({tag, L, t}) => {
  // a very slow roll of the lobes (alive, not busy)
  const roll = (l: Lobe, i: number, m: number): Lobe => ({...l, x: l.x + 5 * noise1(t * 0.55 + i * 0.37 + m, 61), y: l.y + 2.5 * noise1(t * 0.45 + i * 0.29 + m, 63)});
  const lit = clamp(L, 0, 1.6);
  const lowB = LOWER.map((l, i) => roll(l, i, 9));
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
          <path d={`M-400,-600 L1480,-600 L1480,${fmt(baseY(1480))} ${Array.from({length: 48}, (_, i) => {
            const x = 1480 - (i * 1880) / 47;
            return `L${fmt(x)},${fmt(baseY(x))}`;
          }).join(' ')} Z`} />
        </clipPath>
        <clipPath id={`${tag}-low`}>
          {ROWS[6].lobes.map((l, i) => <path key={i} d={lobeD(l)} />)}
          {ROWS[5].lobes.map((l, i) => <path key={`r5${i}`} d={lobeD(l)} />)}
          {lowB.map((l, i) => <path key={`l${i}`} d={lobeD(l)} />)}
        </clipPath>
        <clipPath id={`${tag}-all`}>
          <path d={`M-500,-600 L1580,-600 L1580,560 L-500,560 Z`} />
          {ROWS.flatMap((m, j) => m.lobes.map((l, i) => <path key={`${j}-${i}`} d={lobeD(l)} />))}
        </clipPath>
        <radialGradient id={`${tag}-ul`} gradientUnits="userSpaceOnUse" cx={fmt(ORIGIN.x)} cy={fmt(ORIGIN.y + 40)} r={300}>
          <stop offset="0" stopColor="#E8EAFF" stopOpacity={0.9} />
          <stop offset="0.16" stopColor={PAL.mid} stopOpacity={0.55} />
          <stop offset="0.45" stopColor={PAL.halo} stopOpacity={0.18} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
        {/* the cell lit from inside: a broad, flat glow just above the base (it spreads through the cloud, it is not a lamp) */}
        <radialGradient id={`${tag}-in`} gradientUnits="userSpaceOnUse" cx={fmt(ORIGIN.x)} cy={fmt(baseY(ORIGIN.x) - 110)} r={520} gradientTransform={`translate(${fmt(ORIGIN.x)} ${fmt(baseY(ORIGIN.x) - 110)}) scale(1 0.5) translate(${fmt(-ORIGIN.x)} ${fmt(-(baseY(ORIGIN.x) - 110))})`}>
          <stop offset="0" stopColor="#C8CEFF" stopOpacity={0.5} />
          <stop offset="0.4" stopColor={PAL.halo} stopOpacity={0.16} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${tag}-sh`} gradientUnits="userSpaceOnUse" x1="0" y1="560" x2="0" y2="900">
          <stop offset="0" stopColor="#060C14" stopOpacity={0.55} />
          <stop offset="1" stopColor="#060C14" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* the air just under the base is in its shadow */}
      <rect x={-400} y={540} width={1880} height={380} fill={`url(#${tag}-sh)`} />
      {/* behind the rows: the cell's dark body (no sky shows through between the billows) */}
      <path d={`M-500,-600 L1580,-600 ${Array.from({length: 40}, (_, i) => {
        const x = 1580 - (i * 2080) / 39;
        return `L${fmt(x)},${fmt(baseY(x))}`;
      }).join(' ')} Z`} fill="#0C1725" />
      {ROWS.map((m, j) => {
        const lobes = m.lobes.map((l, i) => roll(l, i, j * 3.1));
        return (
          <g key={j} clipPath={m.flat ? `url(#${tag}-bc)` : undefined}>
            {lobes.map((l, i) => {
              // lips near the core catch the leader's light (violet-white), the rest stay storm-dark
              const pr = Math.exp(-(((l.x - ORIGIN.x) / 380) ** 2 + ((l.y - ORIGIN.y) / 380) ** 2));
              return <path key={`p${i}`} d={lobeD(l)} fill={mix(m.lip, '#AEB6F6', clamp(pr * (0.14 + 0.5 * lit)))} />;
            })}
            {lobes.map((l, i) => <path key={`b${i}`} d={lobeD(l, 0.975, l.rx * 0.03, l.ry * 0.1)} fill={`url(#${tag}-m${j})`} />)}
          </g>
        );
      })}
      {/* the lowering: dark, ragged, under the core */}
      {lowB.map((l, i) => <path key={`lp${i}`} d={lobeD(l)} fill={mix('#1F354B', '#8C96E6', clamp(0.25 * lit * Math.exp(-(((l.x - ORIGIN.x) / 160) ** 2))))} />)}
      {lowB.map((l, i) => <path key={`lb${i}`} d={lobeD(l, 0.96, 0, l.ry * 0.14)} fill={i % 2 ? '#0B1522' : '#0E1927'} />)}
      {/* the leader's light: the underside round the origin, and the cell lit from inside above it */}
      <g style={{mixBlendMode: 'screen'}}>
        <g clipPath={`url(#${tag}-all)`}>
          <rect x={-400} y={-600} width={1880} height={1500} fill={`url(#${tag}-in)`} opacity={fmt(clamp(0.06 + 0.5 * lit, 0, 1))} />
        </g>
        <g clipPath={`url(#${tag}-low)`}>
          <rect x={-400} y={-600} width={1880} height={1500} fill={`url(#${tag}-ul)`} opacity={fmt(clamp(0.12 + 0.6 * lit, 0, 1))} />
        </g>
      </g>
    </g>
  );
};

/** soft rain shafts from the base to the ranges, streaked and falling; the one nearer the leader catches its light */
const SHAFTS = [
  {x0: -200, x1: 330, top: 560, bot: 1560, lean: -90, seed: 3, a: 0.34},
  {x0: 800, x1: 1280, top: 540, bot: 1540, lean: -80, seed: 5, a: 0.3},
  {x0: 250, x1: 560, top: 600, bot: 1460, lean: -60, seed: 7, a: 0.12},
];
export const RainB5: React.FC<{tag: string; t: number; L: number}> = ({tag, t, L}) => (
  <g>
    {SHAFTS.map((s, i) => {
      const id = `${tag}-rs${i}`;
      const poly = `M${s.x0},${s.top} L${s.x1},${s.top} L${s.x1 + s.lean},${s.bot} L${s.x0 + s.lean},${s.bot} Z`;
      const H = s.bot - s.top;
      const streaks = Array.from({length: 30}, (_, k) => {
        const u = hash(k, s.seed * 10 + 1);
        const y = s.top + ((hash(k, s.seed * 10 + 2) * H + t * 1150) % H);
        const v = (y - s.top) / H;
        const x = s.x0 + (s.x1 - s.x0) * u + s.lean * v;
        return `M${fmt(x)},${fmt(y)} l${fmt(s.lean * 0.07)},${fmt(80 + 50 * hash(k, s.seed * 10 + 3))}`;
      }).join(' ');
      const near = Math.exp(-((((s.x0 + s.x1) / 2 - ORIGIN.x) / 520) ** 2));
      return (
        <g key={i}>
          <defs>
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={s.top} x2="0" y2={s.bot}>
              <stop offset="0" stopColor={mix('#4A6378', '#9AA6FF', 0.4 * near * clamp(L))} stopOpacity={s.a} />
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
            <path d={streaks} stroke="#A4B8CC" strokeOpacity={0.2 + 0.16 * near * clamp(L)} strokeWidth={2} strokeLinecap="round" fill="none" />
          </g>
        </g>
      );
    })}
  </g>
);

/** one range, with a faint rim on its crest when the leader flashes */
export const RangeB5: React.FC<{i: number; L: number}> = ({i, L}) => {
  const r = RANGES[i];
  const d = ridgeD(r.y0, r.amp, r.seed);
  const rimK = clamp(L) * (0.1 + 0.1 * i);
  return (
    <g>
      <path d={d} fill={r.fill} />
      {i === 0 && <path d={d} fill="none" stroke={r.rim} strokeOpacity={0.35} strokeWidth={2} />}
      {rimK > 0.01 && <path d={d} fill="none" stroke={PAL.mid} strokeOpacity={fmt(rimK)} strokeWidth={2.5} style={{mixBlendMode: 'screen'}} />}
      {i === 2 && <rect x={-500} y={1600} width={2080} height={900} fill="#060C12" opacity={0.55} />}
    </g>
  );
};
