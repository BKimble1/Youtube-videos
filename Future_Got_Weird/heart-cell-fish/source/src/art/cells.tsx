// Living cardiomyocytes under the microscope: rod-shaped, branching cells, aligned end to end in rows (as on the
// fish, where the tissue was grown aligned along the body), joined by dark zig-zag intercalated discs, cross-striated
// (sarcomeres), each with one or two nuclei. The whole sheet contracts together, a wave sweeping across it each beat:
// every cell shortens, thickens slightly and its striations crowd together.
import React from 'react';
import {mix, lit, shade} from '../dc/color';
import {INK} from '../dc/ink';

const f1 = (n: number) => n.toFixed(1);
const hash = (i: number, s = 0) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const CELL_RED = '#C8505A';
type Cell = {r: number; x0: number; x1: number; y: number; h: number; bend: number; nuc: number; seed: number; branch: number};
/** the tissue: rows of cells in cell-length units (a cell is ~1 long, ~0.23 tall) */
const ROWS = 34, COLS = 22;
const CELLS: Cell[] = (() => {
  const out: Cell[] = [];
  for (let r = 0; r < ROWS; r++) {
    let x = -COLS / 2 - hash(r, 2);
    const y = (r - ROWS / 2) * 0.25 + 0.03 * Math.sin(r * 1.3);
    let k = 0;
    while (x < COLS / 2) {
      const len = 0.8 + 0.4 * hash(r * 97 + k, 3);
      out.push({r, x0: x, x1: x + len, y, h: 0.2 + 0.05 * hash(r * 31 + k, 4), bend: (hash(r * 13 + k, 5) - 0.5) * 0.06, nuc: hash(r * 7 + k, 6) > 0.6 ? 2 : 1, seed: r * 1000 + k, branch: hash(r * 3 + k, 8)});
      x += len;
      k++;
    }
  }
  return out;
})();

/** contraction 0..1 at time t for a sheet beating at freq, with a wave crossing it (x in cell units) */
export const contractAt = (t: number, freq: number, x: number) => {
  const ph = t * freq - x * 0.035;
  const p = ((ph % 1) + 1) % 1;
  return p < 0.18 ? Math.sin((p / 0.18) * Math.PI * 0.5) : p < 0.45 ? Math.cos(((p - 0.18) / 0.27) * Math.PI * 0.5) : 0;
};

/** the field drawn in screen space: centre (cx, cy), px per cell length `px`, beat time t */
export const CellField: React.FC<{id: string; cx: number; cy: number; px: number; t: number; freq?: number; rot?: number; opacity?: number}> = ({id, cx, cy, px, t, freq = 1.4, rot = 0, opacity = 1}) => {
  const els: React.ReactNode[] = [];
  const halfW = 600 / px + 1.5, halfH = 1100 / px + 0.5;
  const detail = Math.min(1, Math.max(0, (px - 70) / 160));
  const amp = 0.085;
  const X = (x: number) => {
    const c = contractAt(t, freq, x);
    return x * (1 - amp * c);
  };
  for (const c of CELLS) {
    if (c.x1 < -halfW || c.x0 > halfW || Math.abs(c.y) > halfH) continue;
    const cc = contractAt(t, freq, (c.x0 + c.x1) / 2);
    const x0 = X(c.x0) + 0.012, x1 = X(c.x1) - 0.012;
    const hh = (c.h / 2) * (1 + 0.12 * cc);
    const y = c.y;
    const bend = c.bend;
    const pts: [number, number][] = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const x = x0 + (x1 - x0) * u;
      const taper = 1 - 0.45 * Math.pow(Math.abs(u - 0.5) * 2, 6);
      pts.push([x, y - hh * taper + bend * Math.sin(Math.PI * u) + 0.012 * Math.sin(u * 9 + c.seed)]);
    }
    for (let i = n; i >= 0; i--) {
      const u = i / n;
      const x = x0 + (x1 - x0) * u;
      const taper = 1 - 0.45 * Math.pow(Math.abs(u - 0.5) * 2, 6);
      pts.push([x, y + hh * taper + bend * Math.sin(Math.PI * u) + 0.012 * Math.sin(u * 7 + c.seed * 1.3)]);
    }
    const S = (p: [number, number]) => `${f1(cx + p[0] * px)},${f1(cy + p[1] * px)}`;
    const d = 'M' + pts.map(S).join('L') + 'Z';
    const base = mix(CELL_RED, '#D9303E', cc * 0.6);
    els.push(<path key={`c${c.seed}`} d={d} fill={base} stroke={shade(base, 0.45)} strokeWidth={Math.max(0.6, px * 0.006)} />);
    if (detail > 0) {
      // sarcomere striations: spacing shrinks with the contraction
      const ns = 14;
      let sd = '';
      for (let k = 1; k < ns; k++) {
        const x = x0 + ((x1 - x0) * k) / ns;
        const yy = y + bend * Math.sin((Math.PI * k) / ns);
        sd += `M${f1(cx + x * px)},${f1(cy + (yy - hh * 0.8) * px)}L${f1(cx + x * px)},${f1(cy + (yy + hh * 0.8) * px)}`;
      }
      els.push(<path key={`s${c.seed}`} d={sd} stroke={shade(base, 0.35)} strokeWidth={Math.max(0.6, px * 0.009)} opacity={0.55 * detail} />);
      // a soft highlight along the top
      els.push(<path key={`h${c.seed}`} d={`M${S([x0 + 0.08, y - hh * 0.55 + bend * 0.5])}L${S([x1 - 0.08, y - hh * 0.55 + bend * 0.5])}`} stroke={lit(base, 0.5)} strokeWidth={px * 0.03} strokeLinecap="round" opacity={0.35 * detail} />);
      // nuclei
      for (let k = 0; k < c.nuc; k++) {
        const u = c.nuc === 1 ? 0.5 : 0.36 + 0.28 * k;
        const nx = x0 + (x1 - x0) * u, ny = y + bend * Math.sin(Math.PI * u);
        els.push(<ellipse key={`n${c.seed}-${k}`} cx={f1(cx + nx * px)} cy={f1(cy + ny * px)} rx={f1(px * 0.085 * (1 - 0.06 * cc))} ry={f1(px * 0.042 * (1 + 0.1 * cc))} fill="#7C3462" stroke={INK} strokeWidth={Math.max(0.6, px * 0.004)} opacity={detail} />);
        els.push(<circle key={`m${c.seed}-${k}`} cx={f1(cx + (nx + 0.02) * px)} cy={f1(cy + (ny - 0.008) * px)} r={f1(px * 0.014)} fill="#B56A96" opacity={detail} />);
      }
    }
    // intercalated disc at the cell's right end (the junction with the next cell in the row)
    const zx = x1 + 0.012;
    const zz = Array.from({length: 7}, (_, i) => {
      const yy = y - hh * 0.9 + (hh * 1.8 * i) / 6;
      return `${f1(cx + (zx + (i % 2 ? 0.018 : -0.018)) * px)},${f1(cy + yy * px)}`;
    });
    els.push(<path key={`z${c.seed}`} d={'M' + zz.join('L')} fill="none" stroke="#5A1424" strokeWidth={Math.max(0.8, px * 0.012)} opacity={0.8} />);
  }
  return (
    <g opacity={opacity} transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined}>
      <rect x={-100} y={-100} width={1280} height={2120} fill="#F3C9C2" />
      {els}
      <defs>
        <radialGradient id={`${id}-vig`} cx="540" cy="960" r="1150" gradientUnits="userSpaceOnUse">
          <stop offset="0.55" stopColor="#3B0E18" stopOpacity="0" />
          <stop offset="1" stopColor="#3B0E18" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <rect x={-100} y={-100} width={1280} height={2120} fill={`url(#${id}-vig)`} />
    </g>
  );
};
