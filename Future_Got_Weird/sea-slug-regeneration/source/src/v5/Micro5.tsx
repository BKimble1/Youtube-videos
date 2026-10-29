// V5 microscope view (scene 4): a stylized section through the abandoned body's digestive gland, the tissue the
// heart sat in. Branching gland tubules run through dark connective tissue; each is walled by a row of cells packed
// with the chloroplasts the slug steals from algae, around a pale lumen. Two copepod-like parasites (the hypothesis)
// work along inside one tubule and through the tissue between. Three depth layers part with parallax as the view
// pushes in and pans; the parasites are slightly ghosted and the shot carries a HYPOTHESIS tag (in the shot state).
import React from 'react';
import {W, H} from '../lib';
import {Copepod4} from '../v4/Micro4';

type Pt = [number, number];
const bez = (p: Pt[], n: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([
      u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
      u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1],
    ]);
  }
  return out;
};
type Tubule = {pts: Pt[]; hw: number; seed: number};
const TUB = (ctrl: Pt[], hw: number, seed: number): Tubule => ({pts: bez(ctrl, 90), hw, seed});
// the focal layer: the central tubule (the parasites' route) and two branches; a far layer; a near, very soft layer
const MID: Tubule[] = [
  TUB([[-900, -260], [-300, -420], [250, 40], [900, -120]], 150, 1),
  TUB([[-900, 420], [-350, 300], [120, 620], [900, 520]], 120, 2),
  TUB([[-120, -980], [-60, -620], [260, -520], [420, -260]], 95, 3),
  TUB([[-700, 980], [-420, 760], [-160, 760], [40, 560]], 90, 4),
];
const FAR: Tubule[] = [
  TUB([[-900, -760], [-300, -600], [300, -900], [900, -700]], 110, 5),
  TUB([[-900, 80], [-200, 200], [300, -40], [900, 160]], 90, 6),
  TUB([[-900, 900], [-200, 1000], [400, 800], [900, 980]], 110, 7),
];
const NEAR: Tubule[] = [TUB([[-900, -1150], [-200, -900], [400, -1300], [1000, -1000]], 260, 8), TUB([[-1000, 1300], [-300, 1050], [400, 1350], [1000, 1150]], 280, 9)];

const rnd = (k: number) => {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const f1 = (n: number) => n.toFixed(1);

/** one tubule: cell wall rows either side of a pale lumen, chloroplasts in each cell */
const TubuleG: React.FC<{tb: Tubule; tone: number; id: string}> = ({tb, tone, id}) => {
  const P = tb.pts, n = P.length;
  const nrm = P.map((p, i) => {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l] as Pt;
  });
  const off = (i: number, k: number): Pt => [P[i][0] + nrm[i][0] * k, P[i][1] + nrm[i][1] * k];
  const hw = tb.hw, hi = hw * 0.42;
  const outline = [...P.map((_, i) => off(i, hw)), ...P.map((_, i) => off(n - 1 - i, -hw))];
  const lumen = [...P.map((_, i) => off(i, hi)), ...P.map((_, i) => off(n - 1 - i, -hi))];
  const d = (pts: Pt[]) => `M${pts.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}Z`;
  const cells: React.ReactNode[] = [];
  const step = Math.max(3, Math.round(hw / 13));
  for (const side of [1, -1]) {
    for (let i = 0, k = 0; i < n - step; i += step, k++) {
      const j = i + step;
      const q = [off(i, side * hi), off(j, side * hi), off(j, side * hw * 0.97), off(i, side * hw * 0.97)];
      const c: Pt = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2];
      const seed = tb.seed * 1000 + k * 2 + (side > 0 ? 0 : 1);
      cells.push(
        <g key={`${side}${k}`}>
          <path d={d(q)} fill={`url(#${id}c5)`} stroke="#1E4A2C" strokeWidth={Math.max(2, hw * 0.025)} strokeLinejoin="round" />
          {[0, 1, 2].map((m) => {
            const u = 0.25 + 0.5 * rnd(seed + m * 7), v = 0.25 + 0.5 * rnd(seed + m * 13);
            const x = q[0][0] + (q[1][0] - q[0][0]) * u + (q[3][0] - q[0][0]) * v, y = q[0][1] + (q[1][1] - q[0][1]) * u + (q[3][1] - q[0][1]) * v;
            return <ellipse key={m} cx={f1(x)} cy={f1(y)} rx={f1(hw * 0.085)} ry={f1(hw * 0.05)} fill={`url(#${id}k5)`} transform={`rotate(${f1(rnd(seed + m) * 180)} ${f1(x)} ${f1(y)})`} />;
          })}
          <circle cx={f1(c[0] + nrm[i][0] * side * hw * 0.16)} cy={f1(c[1] + nrm[i][1] * side * hw * 0.16)} r={f1(hw * 0.05)} fill="#E6EFC4" opacity={0.55} />
        </g>,
      );
    }
  }
  return (
    <g opacity={tone}>
      <path d={d(outline)} fill="#173C2A" stroke="#0B2016" strokeWidth={Math.max(3, hw * 0.05)} strokeLinejoin="round" />
      {cells}
      <path d={d(lumen)} fill="#D6E7BE" opacity={0.42} />
      <path d={`M${P.map((q) => `${f1(q[0])},${f1(q[1])}`).join('L')}`} fill="none" stroke="#F2F8E2" strokeWidth={hw * 0.12} strokeLinecap="round" opacity={0.2} />
    </g>
  );
};

/** a point and heading (deg) at fraction u along a tubule's centreline */
const along = (tb: Tubule, u: number): {p: Pt; a: number} => {
  const P = tb.pts, x = Math.min(P.length - 2, Math.max(0, u * (P.length - 1))), i = Math.floor(x), r = x - i;
  const p: Pt = [P[i][0] + (P[i + 1][0] - P[i][0]) * r, P[i][1] + (P[i + 1][1] - P[i][1]) * r];
  return {p, a: (Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0]) * 180) / Math.PI};
};

export const Micro5: React.FC<{id: string; op: number; t: number; para: number; zoom: number; reveal: number; swim?: number; bar?: number; pan?: number}> = ({id, op, t, para, zoom, reveal, swim = 0, bar = 0, pan = 0}) => {
  if (op <= 0.001) return null;
  const cx = W / 2, cy = H * 0.46;
  const L = (k: number, dx: number, node: React.ReactNode) => <g transform={`translate(${f1(cx + dx)},${cy}) scale(${k.toFixed(3)})`}>{node}</g>;
  const zf = 0.85 + 0.15 * zoom, zm = zoom, zn = Math.pow(zoom, 1.8);
  // parasite 1 works along the lumen of the central tubule; parasite 2 pushes between the tubules through the tissue
  const p1 = along(MID[0], 0.12 + 0.2 * swim);
  const p2: {p: Pt; a: number} = {p: [420 - 140 * swim, 170 + 30 * Math.sin(swim * 2.4)], a: 200 + 12 * Math.sin(swim * 1.8)};
  // the tissue fibres between the tubules (connective tissue)
  const fibres = Array.from({length: 26}, (_, k) => {
    const y = -1100 + k * 90, w = Math.sin(k * 1.7) * 60;
    return <path key={k} d={`M-1000,${y} C-400,${y + w} 300,${y - w} 1000,${y + w * 0.5}`} fill="none" stroke="#2C5E44" strokeWidth={5} opacity={0.35} />;
  });
  return (
    <g opacity={op}>
      <defs>
        <linearGradient id={`${id}c5`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A6D67E" />
          <stop offset="1" stopColor="#4E9246" />
        </linearGradient>
        <radialGradient id={`${id}k5`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#6ACB4C" />
          <stop offset="1" stopColor="#14551C" />
        </radialGradient>
        <radialGradient id={`${id}pg`} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#F6C894" />
          <stop offset="0.6" stopColor="#CF8A55" />
          <stop offset="1" stopColor="#7E4426" />
        </radialGradient>
        <linearGradient id={`${id}b5`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0F3326" />
          <stop offset="1" stopColor="#071B14" />
        </linearGradient>
        <filter id={`${id}f5`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={8} /></filter>
        <filter id={`${id}n5`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={20} /></filter>
        <radialGradient id={`${id}r5`} cx="0.5" cy="0.46" r="0.72">
          <stop offset={Math.max(0, reveal * 1.2 - 0.2)} stopColor="#fff" />
          <stop offset={Math.min(1, reveal * 1.2)} stopColor="#000" />
        </radialGradient>
        <mask id={`${id}m5`}><rect width={W} height={H} fill={`url(#${id}r5)`} /></mask>
        <radialGradient id={`${id}v5`} cx="0.5" cy="0.46" r="0.78">
          <stop offset="0.55" stopColor="#04110C" stopOpacity={0} />
          <stop offset="1" stopColor="#04110C" stopOpacity={0.75} />
        </radialGradient>
      </defs>
      <g mask={`url(#${id}m5)`}>
        <rect width={W} height={H} fill={`url(#${id}b5)`} />
        <g filter={`url(#${id}f5)`}>{L(zf, -pan * 0.4, <>{fibres}{FAR.map((tb, i) => <TubuleG key={i} tb={tb} tone={0.5} id={id} />)}</>)}</g>
        {L(zm, -pan, (
          <>
            {MID.map((tb, i) => <TubuleG key={i} tb={tb} tone={1} id={id} />)}
            <g opacity={0.92 * para}>
              <g transform={`translate(${f1(p1.p[0])},${f1(p1.p[1])}) rotate(${f1(p1.a)})`}><Copepod4 L={250} ph={t * 22} id={id} /></g>
              <g transform={`translate(${f1(p2.p[0])},${f1(p2.p[1])}) rotate(${f1(p2.a)})`}><Copepod4 L={220} ph={t * 22 + 1.3} id={id} /></g>
            </g>
          </>
        ))}
        <g filter={`url(#${id}n5)`} opacity={0.6}>{L(zn, -pan * 1.9, NEAR.map((tb, i) => <TubuleG key={i} tb={tb} tone={0.8} id={id} />))}</g>
        <rect width={W} height={H} fill={`url(#${id}v5)`} />
        {bar > 0.01 && (
          <g opacity={bar} transform={`translate(${W - 250}, ${H * 0.71})`}>
            <path d={`M0,0 L${(90 * zoom).toFixed(1)},0`} stroke="#0D1A1D" strokeWidth={10} strokeLinecap="round" />
            <path d={`M0,0 L${(90 * zoom).toFixed(1)},0`} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
            <text x={0} y={-16} fontFamily='"Nunito Variable", Nunito, sans-serif' fontWeight={900} fontSize={30} fill="#FFFFFF" stroke="#0D1A1D" strokeWidth={6} paintOrder="stroke">0.1 mm</text>
          </g>
        )}
      </g>
    </g>
  );
};
