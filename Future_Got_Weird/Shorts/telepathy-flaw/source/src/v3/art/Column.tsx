// The "column": one continuous cross-section through the sender's crown, drawn in HEAD space (head radius = 100 units,
// the head faces +x, y down). From the outside in: air, scalp, skull, the seated implant, dura, the cortex with its
// neurons and the six fine threads that end in the motor-cortex strip, white matter below. The same drawing is seen at
// three scales - a small window in the head (opening shot), the implant macro (seat, contact edge, decoder), and a
// large cortical interior (depth planes, one hero pulse) - so the journey "head -> chip -> threads -> cortex ->
// decoder -> packet" is one place, not three pictures.
// Every value is a pure function of the props (no state, no randomness except a seeded hash).
import React from 'react';
import {lit, mix, shade} from '../../lib/color';
import {clamp, fmt, hash, lerp, V} from '../../lib/math';
import {BONE, CHIP, CHIP_DEEP, ALERT, ALERT_DEEP, SIG, SIG_DEEP} from '../../art/Section';

export const INKC = '#172B3A';
export const X0 = -6; // implant axis (head space)
/** the head's top contour at x (the head ellipse: 100 x 107) */
export const topY = (x: number) => -107 * Math.sqrt(Math.max(0, 1 - (x / 100) * (x / 100)));
export const SURF0 = topY(X0);
/** point at horizontal offset dx from the implant axis and depth d below the scalp surface */
export const at = (dx: number, d: number): V => ({x: X0 + dx, y: topY(X0 + dx) + d});

// cortex palette (the Death Clock tissue finish: soft rose, one cool shadow, no grey mud)
const CORTEX_TOP = '#F3B5B8';
const CORTEX_MID = '#E996A3';
const CORTEX_DEEP = '#D27890';
const WHITE_M = '#F5DAD3';
const SKIN_L = '#F2BE9F';
const DURA = '#E9CBD4';
const CELL = '#F8E8F4';
const NUCLEUS = '#8C5CA8';

// ---- geometry ------------------------------------------------------------------------------------------------------
const wave = (x: number) => 1.5 * Math.sin(x * 0.42) + 0.8 * Math.sin(x * 1.13 + 1.3);
const bandD = (x0: number, x1: number, top: (x: number) => number, bot: (x: number) => number, step = 3) => {
  let d = '';
  for (let x = x0; x <= x1 + 0.01; x += step) d += `${d ? 'L' : 'M'}${fmt(x)},${fmt(top(x))} `;
  for (let x = x1; x >= x0 - 0.01; x -= step) d += `L${fmt(x)},${fmt(bot(x))} `;
  return d + 'Z';
};
const lineD = (x0: number, x1: number, f: (x: number) => number, step = 3) => {
  let d = '';
  for (let x = x0; x <= x1 + 0.01; x += step) d += `${d ? 'L' : 'M'}${fmt(x)},${fmt(f(x))} `;
  return d;
};

/** the six threads: where each ends (dx from the implant axis, depth d) */
export const THREADS = [
  {dx: -20, d: 47},
  {dx: -12, d: 36},
  {dx: -4, d: 56},
  {dx: 5, d: 40},
  {dx: 13, d: 52},
  {dx: 21, d: 34},
];
export const STEM: V = {x: X0, y: SURF0 + 17.5};
/** the thread k as a cubic: stem -> tip */
export const threadPt = (k: number, u: number): V => {
  const T = THREADS[k];
  const tip = at(T.dx, T.d);
  const p0 = STEM;
  const dy = tip.y - p0.y;
  const p1 = {x: p0.x + T.dx * 0.12, y: p0.y + dy * 0.5};
  const p2 = {x: tip.x - T.dx * 0.05, y: tip.y - dy * 0.3};
  const q = 1 - u;
  const a = q * q * q;
  const b = 3 * q * q * u;
  const c = 3 * q * u * u;
  const d = u * u * u;
  return {x: a * p0.x + b * p1.x + c * p2.x + d * tip.x, y: a * p0.y + b * p1.y + c * p2.y + d * tip.y};
};
/** the neuron that feeds thread k (its soma sits a little below and beside the tip) */
export const somaOf = (k: number): V => {
  const T = THREADS[k];
  return at(T.dx + (k % 2 ? 4.5 : -4.2), T.d + 7 + (k % 3));
};
/** a pulse path from the soma of neuron k to the stem: fibre, then up the thread; u in 0..1 by length */
const pathCache: Record<number, V[]> = {};
const pathPts = (k: number): V[] => {
  if (pathCache[k]) return pathCache[k];
  const s = somaOf(k);
  const tip = threadPt(k, 1);
  const pts: V[] = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const bend = Math.sin(Math.PI * u) * (k % 2 ? -1.6 : 1.6);
    pts.push({x: s.x + (tip.x - s.x) * u + bend, y: s.y + (tip.y - s.y) * u});
  }
  for (let i = 1; i <= 36; i++) pts.push(threadPt(k, 1 - i / 36));
  pathCache[k] = pts;
  return pts;
};
export const pulsePt = (k: number, u: number): V => {
  const pts = pathPts(k);
  let tot = 0;
  const seg: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    seg.push(l);
    tot += l;
  }
  let want = clamp(u) * tot;
  for (let i = 0; i < seg.length; i++) {
    if (want <= seg[i] || i === seg.length - 1) {
      const t = seg[i] ? clamp(want / seg[i]) : 0;
      return {x: lerp(pts[i].x, pts[i + 1].x, t), y: lerp(pts[i].y, pts[i + 1].y, t)};
    }
    want -= seg[i];
  }
  return pts[pts.length - 1];
};

// ---- small pieces --------------------------------------------------------------------------------------------------
const NS = {vectorEffect: 'non-scaling-stroke' as const};

/** the glowing pulse orb with its ring (the Death Clock sensor look) */
export const Orb: React.FC<{c: V; r: number; red?: number; a?: number; id: string; ring?: number}> = ({c, r, red = 0, a = 1, id, ring = 1}) => {
  if (a <= 0.01) return null;
  const col = mix(SIG, ALERT, red);
  const core = mix('#EAFBFF', '#FFE3E5', red);
  return (
    <g opacity={a}>
      <defs>
        <radialGradient id={`${id}-og`}>
          <stop offset="0" stopColor={col} stopOpacity={0.85} />
          <stop offset="0.4" stopColor={col} stopOpacity={0.35} />
          <stop offset="1" stopColor={col} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-oc`} cx="0.38" cy="0.34" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor={core} />
          <stop offset="1" stopColor={mix(SIG_DEEP, ALERT_DEEP, red)} />
        </radialGradient>
      </defs>
      <circle cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(r * 3.4)} fill={`url(#${id}-og)`} />
      <circle cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(r)} fill={`url(#${id}-oc)`} />
      {ring > 0 && <circle cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(r * 1.75)} fill="none" stroke="#FFFFFF" strokeWidth={2.4} opacity={0.85 * ring} {...NS} />}
    </g>
  );
};

/** the message bubble in the decoder / outside the lens, in head units (a rounded chat token) */
export const BubbleU: React.FC<{c: V; w: number; red?: number; a?: number; id: string; rot?: number}> = ({c, w, red = 0, a = 1, id, rot = 0}) => {
  if (a <= 0.01) return null;
  const s = w / 48;
  const body = mix('#2F7BFF', ALERT, red);
  const deep = mix('#173FA8', ALERT_DEEP, red);
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) rotate(${fmt(rot)}) scale(${fmt(s)})`} opacity={a}>
      <defs>
        <linearGradient id={`${id}-bb`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(body, 0.4)} />
          <stop offset="0.55" stopColor={body} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
      </defs>
      <path d="M-24,-17 Q-24,-23 -18,-23 L18,-23 Q24,-23 24,-17 L24,9 Q24,15 18,15 L-4,15 L-14,25 L-13,15 L-18,15 Q-24,15 -24,9 Z" fill={`url(#${id}-bb)`} stroke={INKC} strokeWidth={3} strokeLinejoin="round" {...NS} />
      <path d="M-20,-18 Q-20,-20 -17,-20 L12,-20" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" opacity={0.7} {...NS} />
      {red < 0.5 ? (
        <g fill="#FFFFFF">
          <circle cx={-10} cy={-4} r={3.4} />
          <circle cx={0} cy={-4} r={3.4} />
          <circle cx={10} cy={-4} r={3.4} />
        </g>
      ) : (
        <path d="M-12,8 L-9,-9 L-4,2 L0,-12 L4,2 L9,-9 L12,8 Q0,12 -12,8 Z" fill="#1A0B14" opacity={0.92} />
      )}
    </g>
  );
};

/** a pyramidal neuron: soma, apical dendrite with two branches, basal dendrites, axon. s = size, act = 0..1 glow */
const Neuron: React.FC<{c: V; s: number; rot?: number; act?: number; id: string; dim?: number; kind?: number}> = ({c, s, rot = 0, act = 0, id, dim = 0, kind = 0}) => {
  const k = kind;
  const den = mix('#F2C6E4', '#BDEBFF', act);
  const body = mix(CELL, '#E8FAFF', act);
  const al = 1 - dim * 0.55;
  const w = (n: number) => n; // stroke widths are in units
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) rotate(${fmt(rot)}) scale(${fmt(s)})`} opacity={al}>
      {act > 0.05 && (
        <circle r={9} fill={`url(#${id}-ng)`} opacity={0.75 * act} />
      )}
      {/* dendrites */}
      <g stroke={den} strokeLinecap="round" fill="none" opacity={0.95}>
        <path d={`M0,-2.4 C${0.4 * (k % 2 ? 1 : -1)},-6 ${1.6 * (k % 3 - 1)},-9 ${2.2 * (k % 2 ? 1 : -1)},-13`} strokeWidth={w(0.55)} />
        <path d={`M${0.5 * (k % 2 ? 1 : -1)},-7 C${-2},-9 ${-4},-10.5 ${-5.5},-13.5`} strokeWidth={w(0.5)} />
        <path d={`M${0.9 * (k % 2 ? 1 : -1)},-9.4 C2.5,-11 4.2,-11.6 5.8,-14.5`} strokeWidth={w(0.45)} />
        <path d="M-2.6,1.4 C-5,2 -7,3.4 -8.2,6" strokeWidth={w(0.6)} />
        <path d="M2.6,1.4 C5,2.2 7,3.2 8.4,5.6" strokeWidth={w(0.6)} />
        <path d="M-1,3.2 C-2,5.5 -3.4,7.2 -4.2,9.6" strokeWidth={w(0.55)} />
        <path d="M0.4,3.4 C0.8,8 0.2,12 1,17" strokeWidth={w(0.35)} opacity={0.85} />
      </g>
      <path d="M0,-3.4 C1.9,-3.4 3.3,-1.2 3.3,0.9 C3.3,2.9 1.8,3.9 0,3.9 C-1.8,3.9 -3.3,2.9 -3.3,0.9 C-3.3,-1.2 -1.9,-3.4 0,-3.4 Z" fill={body} stroke={mix('#B68AB8', '#6CC4E6', act)} strokeWidth={0.55} />
      <ellipse cx={-0.2} cy={0.5} rx={1.25} ry={1.15} fill={mix(NUCLEUS, '#3E9CD0', act)} />
      <ellipse cx={-1.2} cy={-1.7} rx={0.9} ry={0.45} fill="#FFFFFF" opacity={0.75} transform="rotate(-30 -1.2 -1.7)" />
    </g>
  );
};

// ---- the column ----------------------------------------------------------------------------------------------------
export type ColPulse = {k: number; u: number; red?: number; a?: number; r?: number};
export type DecPulse = {u: number; red?: number; a?: number; jag?: number};
export type ColumnProps = {
  id: string;
  /** neural pulses on the fibres/threads (u: 0 at the soma, 1 at the stem) */
  pulses: ColPulse[];
  /** the pulse inside the decoder (u: 0 enters from the stem, 1 leaves through the lens) */
  dec?: DecPulse[] | null;
  /** soft glow over the active (motor-cortex) region 0..1; dim darkens the rest of the cortex 0..1 */
  glow: number;
  dim: number;
  /** implant lens brightness 0..1 and red 0..1 */
  lens: number;
  lensRed: number;
  /** red distortion 0..1: threads wobble and the tissue near the pathway tints */
  distort: number;
  /** gate flashes: array of 0..1 for the three gates (the decoder treats every packet the same) */
  gates?: number[];
  /** neurons that glow (0..1) per thread index */
  active: number[];
  /** camera position in head units, for parallax between the three planes */
  par: V;
  /** level of detail: 0 = the small window in the head (skip fine detail), 1 = macro */
  detail: number;
  /** outer extent: false = a clipped slab, true = unbounded (when the camera is inside the tissue) */
  wide?: boolean;
  /** size multipliers that keep pulses and threads readable at head scale (1 = native) */
  ps?: number;
  ts?: number;
};

const CELLS = Array.from({length: 150}, (_, i) => ({x: -130 + hash(i, 1) * 260, d: 15 + hash(i, 2) * 70, r: 0.4 + hash(i, 3) * 0.7, a: 0.18 + hash(i, 4) * 0.3}));
const AMBIENT = Array.from({length: 18}, (_, i) => ({dx: -50 + hash(i, 11) * 100, d: 22 + hash(i, 12) * 40, s: 0.55 + hash(i, 13) * 0.3, rot: (hash(i, 14) - 0.5) * 24, kind: i}));
const FAR = Array.from({length: 14}, (_, i) => ({dx: -60 + hash(i, 21) * 120, d: 20 + hash(i, 22) * 55, s: 0.8 + hash(i, 23) * 0.5, rot: (hash(i, 24) - 0.5) * 40, kind: i + 3}));
const NEAR = [
  {dx: -30, d: 40, s: 1.9, rot: 8, kind: 1},
  {dx: 32, d: 56, s: 2.2, rot: -10, kind: 2},
  {dx: -4, d: 78, s: 1.8, rot: 4, kind: 0},
];

export const Column: React.FC<ColumnProps> = ({id, pulses, dec, glow, dim, lens, lensRed, distort, gates = [0, 0, 0], active, par, detail, wide = false, ps = 1, ts = 1}) => {
  const XA = X0 - (wide ? 150 : 70);
  const XB = X0 + (wide ? 150 : 70);
  const sf = (x: number) => topY(x);
  const cortexTop = (x: number) => sf(x) + 13.5 + wave(x) * 0.6;
  const cortexBot = (x: number) => sf(x) + 52 + wave(x * 0.7) * 1.4;
  const tone = mix(CORTEX_MID, '#6C3F72', dim * 0.45);
  const glowC = at(14, 42);
  const redTint = distort;
  const farOff = {x: par.x * 0.38, y: par.y * 0.3};
  const nearOff = {x: -par.x * 0.42, y: -par.y * 0.3};
  const showFine = detail > 0.25;
  const lensC = at(0, -5.4);

  // threads, wobbled while red distorts the pathway
  const threadD = (k: number) => {
    let d = '';
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const p = threadPt(k, u);
      const w = distort * 0.9 * Math.sin(u * 22 + k * 1.7) * Math.sin(Math.PI * u);
      d += `${i ? 'L' : 'M'}${fmt(p.x + w)},${fmt(p.y)} `;
    }
    return d;
  };

  return (
    <g>
      <defs>
        <linearGradient id={`${id}-cx`} gradientUnits="userSpaceOnUse" x1={fmt(X0)} y1={fmt(SURF0 + 13)} x2={fmt(X0)} y2={fmt(SURF0 + 58)}>
          <stop offset="0" stopColor={lit(CORTEX_TOP, 0.12)} />
          <stop offset="0.45" stopColor={tone} />
          <stop offset="1" stopColor={mix(CORTEX_DEEP, '#6C3F72', dim * 0.45)} />
        </linearGradient>
        <linearGradient id={`${id}-wm`} gradientUnits="userSpaceOnUse" x1={fmt(X0)} y1={fmt(SURF0 + 52)} x2={fmt(X0)} y2={fmt(SURF0 + 130)}>
          <stop offset="0" stopColor={mix(WHITE_M, '#5A3560', dim * 0.4)} />
          <stop offset="1" stopColor={mix(shade(WHITE_M, 0.2), '#3A2142', dim * 0.4)} />
        </linearGradient>
        <linearGradient id={`${id}-sk`} gradientUnits="userSpaceOnUse" x1={fmt(X0)} y1={fmt(SURF0)} x2={fmt(X0)} y2={fmt(SURF0 + 4)}>
          <stop offset="0" stopColor={lit(SKIN_L, 0.25)} />
          <stop offset="1" stopColor={shade(SKIN_L, 0.2)} />
        </linearGradient>
        <linearGradient id={`${id}-bn`} gradientUnits="userSpaceOnUse" x1={fmt(X0)} y1={fmt(SURF0 + 4)} x2={fmt(X0)} y2={fmt(SURF0 + 11)}>
          <stop offset="0" stopColor={lit(BONE, 0.3)} />
          <stop offset="0.5" stopColor={BONE} />
          <stop offset="1" stopColor={shade(BONE, 0.28)} />
        </linearGradient>
        <linearGradient id={`${id}-cs`} gradientUnits="userSpaceOnUse" x1={fmt(X0)} y1={fmt(SURF0 - 1)} x2={fmt(X0)} y2={fmt(SURF0 + 7.6)}>
          <stop offset="0" stopColor={lit(CHIP, 0.35)} />
          <stop offset="0.5" stopColor={CHIP} />
          <stop offset="1" stopColor={CHIP_DEEP} />
        </linearGradient>
        <radialGradient id={`${id}-ng`}>
          <stop offset="0" stopColor="#BFF1FF" stopOpacity={0.9} />
          <stop offset="1" stopColor="#BFF1FF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-rg`} gradientUnits="userSpaceOnUse" cx={fmt(glowC.x)} cy={fmt(glowC.y)} r={26}>
          <stop offset="0" stopColor="#8FE6FF" stopOpacity={0.7} />
          <stop offset="0.5" stopColor="#6CD0FF" stopOpacity={0.28} />
          <stop offset="1" stopColor="#6CD0FF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-lg`}>
          <stop offset="0" stopColor="#BFF1FF" stopOpacity={0.9} />
          <stop offset="0.45" stopColor="#46CFFF" stopOpacity={0.4} />
          <stop offset="1" stopColor="#46CFFF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-lr`}>
          <stop offset="0" stopColor="#FFC7CB" stopOpacity={0.95} />
          <stop offset="0.45" stopColor="#EF3340" stopOpacity={0.5} />
          <stop offset="1" stopColor="#EF3340" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-thr`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E7F4FB" />
          <stop offset="1" stopColor="#8DB4CC" />
        </linearGradient>
      </defs>

      {/* far plane: faint tissue and small neurons, shifted less than the main plane */}
      <clipPath id={`${id}-fc`}>
        <path d={bandD(XA - 40, XB + 40, (x) => sf(x) + 12.5, (x) => sf(x) + 400, 8)} />
      </clipPath>
      <g clipPath={`url(#${id}-fc)`}>
      <g transform={`translate(${fmt(farOff.x)} ${fmt(farOff.y)})`} opacity={0.55 - dim * 0.15}>
        <path d={bandD(XA - 30, XB + 30, (x) => sf(x) + 16, (x) => sf(x) + 120, 6)} fill={mix('#E8A7B4', '#6C3F72', dim * 0.4)} />
        {FAR.map((n, i) => {
          const p = at(n.dx, n.d);
          return <Neuron key={i} id={`${id}-nf`} c={p} s={n.s} rot={n.rot} kind={n.kind} dim={0.6} />;
        })}
      </g>
      </g>

      {/* strata: scalp, skull, dura, cortex (layered), white matter with fibres */}
      <g>
        <path d={bandD(XA, XB, (x) => sf(x), (x) => sf(x) + 4, 3)} fill={`url(#${id}-sk)`} stroke={INKC} strokeWidth={2.2} strokeLinejoin="round" {...NS} />
        <path d={bandD(XA, XB, (x) => sf(x) + 4, (x) => sf(x) + 11, 3)} fill={`url(#${id}-bn)`} stroke={INKC} strokeWidth={1.8} strokeLinejoin="round" {...NS} />
        {showFine && <path d={lineD(XA, XB, (x) => sf(x) + 7.6, 3)} fill="none" stroke={shade(BONE, 0.3)} strokeWidth={1.2} strokeDasharray="1 3" opacity={0.6} {...NS} />}
        <path d={bandD(XA, XB, (x) => sf(x) + 11, (x) => cortexTop(x), 3)} fill={DURA} opacity={0.95} />
        <path d={bandD(XA, XB, (x) => cortexTop(x), (x) => cortexBot(x), 3)} fill={`url(#${id}-cx)`} />
        <path d={bandD(XA, XB, (x) => cortexBot(x), (x) => sf(x) + 150, 4)} fill={`url(#${id}-wm)`} />
        {/* cortical layers: alternating faint bands */}
        {[0, 1, 2, 3].map((j) => (
          <path key={j} d={bandD(XA, XB, (x) => cortexTop(x) + 6 + j * 8.6, (x) => cortexTop(x) + 6 + j * 8.6 + 4.2, 4)} fill="#FFFFFF" opacity={0.05 + 0.03 * (j % 2)} />
        ))}
        {showFine && CELLS.filter((c) => c.x > XA && c.x < XB).map((c, i) => {
          const p = at(c.x - X0, c.d);
          return <circle key={i} cx={fmt(p.x)} cy={fmt(p.y)} r={c.r} fill={shade(CORTEX_MID, 0.35)} opacity={c.a} />;
        })}
        {/* white-matter fibres: long soft curves */}
        {showFine &&
          [0, 1, 2, 3, 4, 5, 6].map((j) => (
            <path key={j} d={`M${fmt(XA)},${fmt(SURF0 + 60 + j * 9)} C${fmt(X0 - 40)},${fmt(SURF0 + 55 + j * 9 + (j % 2) * 6)} ${fmt(X0 + 30)},${fmt(SURF0 + 66 + j * 9 - (j % 2) * 7)} ${fmt(XB)},${fmt(SURF0 + 58 + j * 9)}`} fill="none" stroke={shade(WHITE_M, 0.2)} strokeWidth={1.6} opacity={0.5} {...NS} />
          ))}
        {/* the gyral surface line */}
        <path d={lineD(XA, XB, (x) => cortexTop(x), 2)} fill="none" stroke={shade(CORTEX_MID, 0.5)} strokeWidth={2.4} {...NS} />
      </g>

      {/* the localized source region: a soft glow, and the rest of the cortex darkens around it */}
      {glow > 0.02 && <circle cx={fmt(glowC.x)} cy={fmt(glowC.y)} r={26} fill={`url(#${id}-rg)`} opacity={glow} />}

      {/* neurons, main plane */}
      <g>
        {AMBIENT.map((n, i) => {
          const p = at(n.dx, n.d);
          return <Neuron key={i} id={id} c={p} s={n.s} rot={n.rot} kind={n.kind} dim={dim} act={0} />;
        })}
        {THREADS.map((_, k) => {
          const p = somaOf(k);
          return <Neuron key={`h${k}`} id={id} c={p} s={0.95} rot={(k - 2.5) * 5} kind={k} act={active[k] ?? 0} dim={Math.max(0, dim - (active[k] ?? 0))} />;
        })}
      </g>

      {/* threads: steel-blue filaments with electrode contacts at the tips */}
      <g>
        {THREADS.map((T, k) => {
          const tip = at(T.dx, T.d);
          const red = redTint;
          return (
            <g key={k}>
              <path d={threadD(k)} fill="none" stroke={INKC} strokeWidth={0.95 * ts} strokeLinecap="round" opacity={0.55} />
              <path d={threadD(k)} fill="none" stroke={mix('#C6E2F2', '#FF8E96', red)} strokeWidth={0.55 * ts} strokeLinecap="round" />
              <path d={threadD(k)} fill="none" stroke="#FFFFFF" strokeWidth={0.16} strokeLinecap="round" opacity={0.8} transform="translate(-0.12 -0.1)" />
              <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={0.7} fill={mix('#EAF6FC', '#FFD3D6', red)} stroke={INKC} strokeWidth={0.28} />
              {showFine && [0.55, 0.78].map((u, j) => {
                const p = threadPt(k, u);
                return <circle key={j} cx={fmt(p.x)} cy={fmt(p.y)} r={0.3} fill="#FFFFFF" opacity={0.85} />;
              })}
            </g>
          );
        })}
      </g>

      {/* the implant: seat in the skull, case, cut-away interior with the decoder, lens */}
      <Implant id={`${id}-im`} lens={lens} lensRed={lensRed} gates={gates} dec={dec ?? []} detail={detail} distort={distort} />

      {/* pulses on fibres and threads (drawn above everything in the main plane) */}
      <g>
        {pulses.map((p, i) => {
          const c = pulsePt(p.k, p.u);
          const r = (p.r ?? 1.15) * ps;
          return (
            <g key={i}>
              {r >= 1.2 &&
                [1, 2, 3].map((j) => {
                  const uu = p.u - 0.05 * j;
                  if (uu <= 0) return null;
                  return <Orb key={j} id={`${id}-p${i}t${j}`} c={pulsePt(p.k, uu)} r={r * (1 - 0.2 * j)} red={p.red ?? 0} a={(p.a ?? 1) * 0.34 / j} ring={0} />;
                })}
              <Orb id={`${id}-p${i}`} c={c} r={r} red={p.red ?? 0} a={p.a ?? 1} ring={0.9} />
            </g>
          );
        })}
      </g>

      {/* near plane: a few big, soft foreground neurons drifting against the main plane */}
      <g clipPath={`url(#${id}-fc)`}>
      <g transform={`translate(${fmt(nearOff.x)} ${fmt(nearOff.y)})`} opacity={0.5 - dim * 0.1}>
        {NEAR.map((n, i) => {
          const p = at(n.dx, n.d);
          return <Neuron key={i} id={`${id}-nn`} c={p} s={n.s} rot={n.rot} kind={n.kind} dim={0.35} />;
        })}
      </g>
      </g>
      {void lensC}
    </g>
  );
};

// ---- the implant ---------------------------------------------------------------------------------------------------
/** one circular, low-profile housing, flush with the skull, shared by the exterior, the window and the macro */
export const HOUSING = {r: 12.5, top: -0.9, bot: 7.4, wall: 1.3};
/** where the packet leaves the lens (d below the scalp surface), the decoder path and its three gates */
export const LENS_D = -2.4;
export const DEC_D0 = 17.6;
export const DEC_D1 = -7.0;
export const decD = (u: number) => lerp(DEC_D0, DEC_D1, u);
export const GATE_D = [5.6, 4.0, 2.4];
export const GATE_U = GATE_D.map((d) => (DEC_D0 - d) / (DEC_D0 - DEC_D1));

const Implant: React.FC<{id: string; lens: number; lensRed: number; gates: number[]; dec: DecPulse[]; detail: number; distort: number}> = ({id, lens, lensRed, gates, dec, detail, distort}) => {
  const gid = id.replace('-im', '');
  const H = HOUSING;
  const yy = (d: number) => SURF0 + d; // the housing is a rigid disc: flat in head space
  const xL = X0 - H.r;
  const xR = X0 + H.r;
  const lensCol = mix('#46CFFF', ALERT, lensRed);
  const chW = 3.1; // half width of the decoder channel
  const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
    `M${fmt(x0 + r)},${fmt(y0)} L${fmt(x1 - r)},${fmt(y0)} Q${fmt(x1)},${fmt(y0)} ${fmt(x1)},${fmt(y0 + r)} L${fmt(x1)},${fmt(y1 - r)} Q${fmt(x1)},${fmt(y1)} ${fmt(x1 - r)},${fmt(y1)} L${fmt(x0 + r)},${fmt(y1)} Q${fmt(x0)},${fmt(y1)} ${fmt(x0)},${fmt(y1 - r)} L${fmt(x0)},${fmt(y0 + r)} Q${fmt(x0)},${fmt(y0)} ${fmt(x0 + r)},${fmt(y0)} Z`;
  return (
    <g>
      {/* contact shadow on the scalp and bone round the seat, and the recess the housing sits in */}
      <ellipse cx={fmt(X0)} cy={fmt(yy(4.2))} rx={18} ry={5.4} fill="#7A5A3A" opacity={0.2} />
      <path d={rr(X0 - H.r - 1.7, yy(2.4), X0 + H.r + 1.7, yy(H.bot + 1.5), 1.6)} fill={shade(BONE, 0.4)} stroke={INKC} strokeWidth={1.8} strokeLinejoin="round" {...NS} />
      {/* the stem through the skull and dura to the cortex, with its collar */}
      <rect x={fmt(X0 - 1.6)} y={fmt(yy(H.bot - 0.2))} width={3.2} height={fmt(DEC_D0 - H.bot + 0.2)} rx={1} fill="#8FA7BF" stroke={INKC} strokeWidth={1.7} {...NS} />
      <ellipse cx={fmt(X0)} cy={fmt(yy(11.2))} rx={2.6} ry={0.7} fill="#B7C9D8" stroke={INKC} strokeWidth={1.3} {...NS} />
      <ellipse cx={fmt(X0)} cy={fmt(yy(DEC_D0))} rx={2.6} ry={1.1} fill={mix('#C9DCEA', '#FF9AA2', distort)} stroke={INKC} strokeWidth={1.6} {...NS} />
      {/* the housing: a thin round puck in section, rim walls and a glass top flush with the scalp */}
      <path d={rr(xL, yy(H.top), xR, yy(H.bot), 2.6)} fill={`url(#${gid}-cs)`} stroke={INKC} strokeWidth={2.6} strokeLinejoin="round" {...NS} />
      <path d={rr(xL + 0.55, yy(H.top + 0.55), xR - 0.55, yy(H.bot - 0.55), 2.2)} fill="none" stroke="#FFFFFF" strokeWidth={1.4} opacity={0.3} {...NS} />
      {/* glass top (the lens), the same ellipse the exterior shows */}
      <ellipse cx={fmt(X0)} cy={fmt(yy(H.top + 0.1))} rx={10.4} ry={1.5} fill={lensCol} opacity={0.4 + 0.6 * lens} stroke={INKC} strokeWidth={1.4} {...NS} />
      <ellipse cx={fmt(X0 - 3)} cy={fmt(yy(H.top - 0.1))} rx={3} ry={0.45} fill="#FFFFFF" opacity={0.75} />
      {/* rim lights: the restrained blue (red for the fault) */}
      <circle cx={fmt(xL + 1.6)} cy={fmt(yy(H.top + 0.1))} r={0.55} fill={lensCol} opacity={0.35 + 0.65 * lens} />
      <circle cx={fmt(xR - 1.6)} cy={fmt(yy(H.top + 0.1))} r={0.55} fill={lensCol} opacity={0.35 + 0.65 * lens} />
      {lens > 0.05 && <ellipse cx={fmt(X0)} cy={fmt(yy(H.top))} rx={16 * (0.6 + 0.4 * lens)} ry={6 * (0.6 + 0.4 * lens)} fill={`url(#${gid}-${lensRed > 0.5 ? 'lr' : 'lg'})`} opacity={0.75 * lens} />}
      {/* cut-away of the housing: an emitter chamber under the glass, the decoder channel with three gates, a coil */}
      {detail > 0.2 && (
        <g>
          <path d={rr(X0 - 10.6, yy(0.4), X0 + 10.6, yy(6.0), 1.4)} fill="#0E2540" stroke="#0A1B30" strokeWidth={1.4} {...NS} />
          <path d={`M${fmt(X0 - 8.2)},${fmt(yy(0.4))} L${fmt(X0 + 8.2)},${fmt(yy(0.4))} L${fmt(X0 + 6.4)},${fmt(yy(2.0))} L${fmt(X0 - 6.4)},${fmt(yy(2.0))} Z`} fill="#16406E" opacity={0.9} />
          <rect x={fmt(X0 - chW)} y={fmt(yy(2.0))} width={chW * 2} height={4.0} fill="#0A1B30" stroke="#2F7BA8" strokeWidth={0.3} />
          {/* one thin electronics layer along the base of the housing: a strip and two tiny chips */}
          <rect x={fmt(X0 - 9.4)} y={fmt(yy(5.35))} width={18.8} height={0.35} rx={0.17} fill="#3E6C99" />
          <rect x={fmt(X0 - 8.4)} y={fmt(yy(4.45))} width={2.0} height={0.9} rx={0.25} fill="#8FA7BF" />
          <rect x={fmt(X0 + 6.4)} y={fmt(yy(4.45))} width={2.0} height={0.9} rx={0.25} fill="#8FA7BF" />
          {/* the three gates: the same treatment for every message */}
          {GATE_D.map((d, j) => {
            const gap = [2.8, 2.0, 1.2][j];
            const fl = gates[j] ?? 0;
            const col = mix('#6FB7DE', '#FFFFFF', fl);
            const y = yy(d);
            return (
              <g key={j}>
                <rect x={fmt(X0 - chW)} y={fmt(y - 0.3)} width={fmt(chW - gap / 2)} height={0.6} rx={0.3} fill={col} />
                <rect x={fmt(X0 + gap / 2)} y={fmt(y - 0.3)} width={fmt(chW - gap / 2)} height={0.6} rx={0.3} fill={col} />
                {fl > 0.02 && <ellipse cx={fmt(X0)} cy={fmt(y)} rx={fmt(3.2 + 2 * fl)} ry={fmt(0.8 + 0.6 * fl)} fill="#FFFFFF" opacity={0.55 * fl} />}
              </g>
            );
          })}
        </g>
      )}
      {/* the decoder pulse: an orb up the stem, a small waveform in the channel that smooths at the gates, then one bubble */}
      {dec.map((dp, di) =>
        dp.a === 0
          ? null
          : (() => {
              const u = clamp(dp.u, 0, 1);
              const red = dp.red ?? 0;
              const a = dp.a ?? 1;
              const cc: V = {x: X0, y: yy(decD(u))};
              const col = mix('#BFF1FF', '#FFC7CB', red);
              const w = lerp(6.0, 3.6, clamp((u - 0.414) / 0.2));
              const amp = (1.1 * (1 - clamp((u - 0.45) / 0.15)) * (dp.jag ?? 1) + (red > 0.5 ? 0.3 : 0)) * 1;
              let wd = '';
              for (let i = 0; i <= 24; i++) {
                const q = i / 24;
                wd += `${i ? 'L' : 'M'}${fmt(X0 - w / 2 + q * w)},${fmt(cc.y + amp * Math.sin(q * 15 + u * 40) * (1 - Math.abs(q - 0.5) * 0.6))} `;
              }
              const orbA = 1 - clamp((u - 0.36) / 0.06);
              const waveA = clamp((u - 0.38) / 0.05) * (1 - clamp((u - 0.6) / 0.05));
              const bubA = clamp((u - 0.6) / 0.05);
              return (
                <g key={di} opacity={a}>
                  {orbA > 0.01 && <Orb id={`${id}-do${di}`} c={cc} r={1.25} red={red} a={orbA} ring={0.7} />}
                  {waveA > 0.01 && (
                    <g opacity={waveA}>
                      <path d={wd} fill="none" stroke={mix(SIG, ALERT, red)} strokeWidth={5} strokeLinecap="round" opacity={0.3} {...NS} />
                      <path d={wd} fill="none" stroke={col} strokeWidth={2.6} strokeLinecap="round" {...NS} />
                    </g>
                  )}
                  {bubA > 0.01 && <BubbleU id={`${id}-db${di}`} c={cc} w={lerp(3.4, 8.2, clamp((u - 0.6) / 0.18))} red={red} a={bubA} />}
                </g>
              );
            })(),
      )}
    </g>
  );
};
