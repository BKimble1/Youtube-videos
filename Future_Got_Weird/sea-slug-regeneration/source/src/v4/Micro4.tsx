// V4 microscope view (scene 4): inside the abandoned body's gland tissue. Dimensional but still the FGW 2.5D finish:
// a dark tissue space, shaded translucent cells in three depth layers (they part with parallax as the view pushes in
// and pans), lens-shaped chloroplasts inside them, and two copepod-like parasites working between the cells
// (amber, segmented, swim-legs beating). The parasites are drawn slightly ghosted and the scene carries a HYPOTHESIS
// tag (in the shot): their role is a proposed explanation.
import React from 'react';
import {W, H} from '../lib';

const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};
type Cell = {x: number; y: number; r: number; sq: number; rot: number; chl: {x: number; y: number; a: number; s: number}[]};
const layer = (seed: number, n: number, spread: number, r0: number, r1: number, nch: number): Cell[] => {
  const R = rng(seed);
  return Array.from({length: n}, () => {
    const r = r0 + (r1 - r0) * R();
    return {
      x: (R() - 0.5) * spread, y: (R() - 0.5) * spread * 1.6, r, sq: 0.8 + R() * 0.3, rot: R() * 180,
      chl: Array.from({length: nch}, () => {
        const th = R() * Math.PI * 2, rr = Math.sqrt(R()) * r * 0.6;
        return {x: Math.cos(th) * rr, y: Math.sin(th) * rr, a: R() * 180, s: 0.75 + R() * 0.5};
      }),
    };
  });
};
const FAR = layer(21, 70, 2600, 70, 120, 3);
const MID = layer(5, 46, 2000, 95, 150, 6);
const NEAR = layer(9, 12, 2400, 190, 280, 5);

const CellG: React.FC<{c: Cell; id: string; tone: number}> = ({c, id, tone}) => (
  <g transform={`translate(${c.x.toFixed(1)},${c.y.toFixed(1)}) rotate(${c.rot.toFixed(0)})`}>
    <ellipse rx={c.r} ry={c.r * c.sq} fill={`url(#${id}cg)`} opacity={0.92 * tone} />
    <ellipse rx={c.r} ry={c.r * c.sq} fill="none" stroke="#CFEBB4" strokeOpacity={0.45 * tone} strokeWidth={Math.max(2, c.r * 0.04)} />
    {c.chl.map((q, k) => (
      <g key={k} transform={`translate(${q.x.toFixed(1)},${q.y.toFixed(1)}) rotate(${q.a.toFixed(0)}) scale(${q.s.toFixed(2)})`}>
        <ellipse rx={c.r * 0.2} ry={c.r * 0.11} fill={`url(#${id}ch)`} opacity={tone} />
      </g>
    ))}
    <ellipse cx={-c.r * 0.32} cy={-c.r * 0.38} rx={c.r * 0.28} ry={c.r * 0.12} fill="#F4FFE6" opacity={0.28 * tone} transform={`rotate(-30 ${(-c.r * 0.32).toFixed(1)} ${(-c.r * 0.38).toFixed(1)})`} />
  </g>
);

/** a copepod-like parasite, length L, heading +x; legs beat with phase ph */
export const Copepod4: React.FC<{L: number; ph: number; id: string}> = ({L, ph, id}) => {
  const beat = Math.sin(ph);
  return (
    <g>
      {/* swimming legs under the body, beating */}
      {[0.05, 0.16, 0.27, 0.37].map((x, i) => (
        <path key={i} d={`M${(x * L).toFixed(1)},0 q${(-L * 0.05 - beat * L * 0.06).toFixed(1)},${(L * 0.12).toFixed(1)} ${(-L * 0.12 - beat * L * 0.1).toFixed(1)},${(L * 0.2).toFixed(1)}`} stroke="#5A2E1E" strokeWidth={L * 0.018} fill="none" strokeLinecap="round" opacity={0.85} />
      ))}
      {/* egg sacs, the tapering abdomen, the big cephalothorax */}
      {[-1, 1].map((sd) => <ellipse key={sd} cx={-L * 0.42} cy={sd * L * 0.08} rx={L * 0.16} ry={L * 0.06} fill={`url(#${id}pg)`} opacity={0.8} transform={`rotate(${sd * (10 + 4 * beat)} ${-L * 0.28} 0)`} />)}
      {[-0.32, -0.22, -0.13].map((x, i) => <ellipse key={i} cx={x * L} cy={0} rx={L * 0.06} ry={L * (0.07 + 0.012 * i)} fill={`url(#${id}pg)`} stroke="#5A2E1E" strokeWidth={L * 0.012} />)}
      <ellipse cx={L * 0.12} cy={0} rx={L * 0.26} ry={L * 0.15} fill={`url(#${id}pg)`} stroke="#5A2E1E" strokeWidth={L * 0.014} />
      <ellipse cx={L * 0.06} cy={-L * 0.06} rx={L * 0.12} ry={L * 0.04} fill="#FFF1D8" opacity={0.45} />
      {/* antennules sweeping */}
      {[-1, 1].map((sd) => (
        <path key={sd} d={`M${(L * 0.34).toFixed(1)},${(sd * L * 0.06).toFixed(1)} q${(L * 0.16).toFixed(1)},${(sd * (L * 0.1 + beat * L * 0.04)).toFixed(1)} ${(L * 0.1).toFixed(1)},${(sd * L * 0.34).toFixed(1)}`} stroke="#5A2E1E" strokeWidth={L * 0.016} fill="none" strokeLinecap="round" />
      ))}
      <circle cx={L * 0.32} cy={0} r={L * 0.022} fill="#3B1210" />
    </g>
  );
};

export const Micro4: React.FC<{id: string; op: number; t: number; para: number; zoom: number; reveal: number; swim?: number; bar?: number; pan?: number}> = ({id, op, t, para, zoom, reveal, swim = 0, bar = 0, pan = 0}) => {
  if (op <= 0.001) return null;
  const cx = W / 2, cy = H * 0.46;
  const L = (k: number, dx: number, node: React.ReactNode) => <g transform={`translate(${(cx + dx).toFixed(1)},${cy}) scale(${k.toFixed(3)})`}>{node}</g>;
  const zf = 0.85 + 0.15 * zoom, zm = zoom, zn = Math.pow(zoom, 1.8);
  // the parasites: one crossing the frame between cells, one turning and squeezing through behind
  const sw = swim;
  const bugs = [
    {x: -420 + sw * 190, y: -150 + 40 * Math.sin(sw * 2.2), a: 8 + 8 * Math.sin(sw * 1.7), L: 330, ph: t * 22},
    {x: 380 - sw * 120, y: 260 - sw * 30 + 25 * Math.sin(sw * 2.6 + 1), a: 196 + 14 * Math.sin(sw * 1.9), L: 270, ph: t * 22 + 1.3},
  ];
  return (
    <g opacity={op}>
      <defs>
        <radialGradient id={`${id}cg`} cx="0.38" cy="0.34" r="0.75">
          <stop offset="0" stopColor="#B9DE95" />
          <stop offset="0.55" stopColor="#6FA757" />
          <stop offset="1" stopColor="#2E5E34" />
        </radialGradient>
        <radialGradient id={`${id}ch`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#7FD25B" />
          <stop offset="1" stopColor="#1F6A26" />
        </radialGradient>
        <radialGradient id={`${id}pg`} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#F6C894" />
          <stop offset="0.6" stopColor="#CF8A55" />
          <stop offset="1" stopColor="#7E4426" />
        </radialGradient>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#163A2C" />
          <stop offset="1" stopColor="#0B2119" />
        </linearGradient>
        <filter id={`${id}mf`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={7} /></filter>
        <filter id={`${id}mn`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={18} /></filter>
        <radialGradient id={`${id}mr`} cx="0.5" cy="0.46" r="0.72">
          <stop offset={Math.max(0, reveal * 1.2 - 0.2)} stopColor="#fff" />
          <stop offset={Math.min(1, reveal * 1.2)} stopColor="#000" />
        </radialGradient>
        <mask id={`${id}mm`}><rect width={W} height={H} fill={`url(#${id}mr)`} /></mask>
        <radialGradient id={`${id}mv`} cx="0.5" cy="0.46" r="0.78">
          <stop offset="0.55" stopColor="#06150F" stopOpacity={0} />
          <stop offset="1" stopColor="#06150F" stopOpacity={0.7} />
        </radialGradient>
      </defs>
      <g mask={`url(#${id}mm)`}>
        <rect width={W} height={H} fill={`url(#${id}bg)`} />
        <g filter={`url(#${id}mf)`}>{L(zf, -pan * 0.4, FAR.map((c, i) => <CellG key={i} c={c} id={id} tone={0.55} />))}</g>
        {L(zm, -pan, (
          <>
            {MID.map((c, i) => <CellG key={i} c={c} id={id} tone={1} />)}
            <g opacity={0.9 * para}>
              {bugs.map((b, i) => (
                <g key={i} transform={`translate(${b.x.toFixed(1)},${b.y.toFixed(1)}) rotate(${b.a.toFixed(1)})`}>
                  <Copepod4 L={b.L} ph={b.ph} id={id} />
                </g>
              ))}
            </g>
          </>
        ))}
        <g filter={`url(#${id}mn)`} opacity={0.55}>{L(zn, -pan * 1.9, NEAR.map((c, i) => <CellG key={i} c={c} id={id} tone={0.8} />))}</g>
        <rect width={W} height={H} fill={`url(#${id}mv)`} />
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
