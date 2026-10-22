// V3 close explanation of ONE attachment, rebuilt from the 2024 study's concept: small (minuscule) V-shaped
// perforations in a rigid support, into which the collagen gel of the dermis equivalent is fed; the gel locks
// through them like a skin ligament. Here: a thin gel strand per perforation, embedded in the silicone layer
// (seen through it), passing through a tapered hole in the rigid base and spreading into a small lip beneath.
// The movable insert under the mouth corner carries five of these perforations; the neighbouring base (fixed)
// carries the same pattern for context. The drive under it (link, carriage, lead screw, motor) is a clearly
// simplified illustration. The tug is LOCAL: only the covering above and around the insert is displaced.
import React from 'react';
import {Pt, smooth, path, lerp, clamp} from '../lib';
import {TissueSection, TMap, DERM} from '../v2/Tissue2';
import {K} from '../art/Face';

export const A3 = {k: 1.5, y0: -520, sil0: -520 + DERM * 1.5, base0: -95, D: 74, pitch: 64, insHalf: 168, pd: 58, sy: 250};
export const HOLES = Array.from({length: 17}, (_, i) => (i - 8) * A3.pitch); // x of each perforation (rest)
export const onInsert = (x: number) => Math.abs(x) < A3.insHalf - 20;
// local displacement of the soft layers at rest (x, y) for pull d: strongest at the bonded underside over the insert,
// fading upward and sideways (a localized tug, not a whole-slab wave); the surface dips over the pull and bunches ahead
export const a3Disp = (x: number, y: number, d: number): Pt => {
  const g = Math.exp(-((x / 190) ** 2));
  const h = lerp(1, 0.45, clamp((A3.base0 - y) / (A3.base0 - A3.y0)));
  const fy = clamp(1 - (y - A3.y0) / 420, 0.1, 1); // surface relief fades with depth
  const relief = (16 * Math.exp(-(((x + 20) / 80) ** 2)) - 20 * Math.exp(-(((x + 200) / 90) ** 2))) * d * fy;
  return {x: -A3.D * d * g * h, y: relief};
};
export const a3Map = (d: number): TMap => (u, w) => {
  const x = (u - 640) * A3.k, y = A3.y0 + w * A3.k;
  const q = a3Disp(x, y, d);
  return {x: x + q.x, y: y + q.y};
};
export const a3Surf = (x: number, d: number): Pt => { const q = a3Disp(x, A3.y0, d); return {x: x + q.x, y: A3.y0 + q.y}; };
const GEL = '#EFC3BE', GEL_D = '#DFA9A6', GEL_F = '#FFF0EA';

// keyhole perforation (rest x = 0 local): V narrowing into the rigid support, then a rounded undercut the gel locks into
const pocket = (x: number, y: number, k = 1): Pt[] => {
  const D = A3.pd;
  const r = [[-17, 0], [-6.5, D * 0.55], [-12, D * 0.7], [-12.5, D * 0.86], [-7, D], [0, D + 2], [7, D], [12.5, D * 0.86], [12, D * 0.7], [6.5, D * 0.55], [17, 0]];
  return r.map(([a, b]) => ({x: x + a * k, y: y + b * k}));
};

export const AnchorSection3: React.FC<{d: number; t: number; id: string; glow: number[]; motor: number; spin: number}> = ({d, t, id, glow, motor, spin}) => {
  const ix = -A3.D * d; // insert travel
  const P = (x: number, y: number) => { const q = a3Disp(x, y, d); return {x: x + q.x, y: y + q.y}; };
  const xs = Array.from({length: 81}, (_, i) => -1000 + i * 25);
  const silTop = xs.map((x) => P(x, A3.sil0)), silBot = xs.map((x) => P(x, A3.base0));
  const band = (a: Pt[], b: Pt[]) => smooth(a) + 'L' + [...b].reverse().map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L') + 'Z';
  const shift = (x: number) => (onInsert(x) ? ix : 0);
  const B0 = A3.base0, iB = B0 + A3.pd + 34; // insert underside
  // gel column through the silicone: uniform, slightly sheared with the layer, entering its pocket
  const column = (hx: number) => {
    const L = Array.from({length: 6}, (_, i) => P(hx - 9, lerp(A3.sil0 - 4, B0 - 1, i / 5)));
    const R = Array.from({length: 6}, (_, i) => P(hx + 9, lerp(A3.sil0 - 4, B0 - 1, i / 5)));
    L[5] = {x: hx - 13 + shift(hx), y: B0 + 1}; R[5] = {x: hx + 13 + shift(hx), y: B0 + 1};
    return smooth(L) + 'L' + [...R].reverse().map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L') + 'Z';
  };
  const fib = (hx: number, o: number) => smooth([P(hx + o, A3.sil0 - 30), P(hx + o, lerp(A3.sil0, B0, 0.5)), {x: hx + o * 0.8 + shift(hx), y: B0 + 4}, {x: hx + o * 0.35 + shift(hx), y: B0 + A3.pd * 0.55}, {x: hx + o * 0.9 + shift(hx), y: B0 + A3.pd * 0.85}]);
  const ins: Pt[] = [{x: -A3.insHalf + ix, y: B0}, {x: A3.insHalf + ix, y: B0}, {x: A3.insHalf + ix, y: iB}, {x: -A3.insHalf + ix, y: iB}];
  const sy = A3.sy, mx = 250; // lead screw height, motor x
  const G = (hx: number) => (onInsert(hx) ? glow[Math.round(hx / A3.pitch) + 1] ?? 0 : 0);
  return (
    <g>
      <defs>
        <pattern id={`${id}-hatch`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#E6ECF0" /><line x1="0" y1="0" x2="0" y2="14" stroke="#CDD6DD" strokeWidth="3" /></pattern>
        <linearGradient id={`${id}-ins`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B3BDC6" /><stop offset="0.15" stopColor="#95A1AC" /><stop offset="1" stopColor="#66727D" /></linearGradient>
        <linearGradient id={`${id}-sil`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F1F0F2" /><stop offset="1" stopColor="#DCE0E5" /></linearGradient>
        <linearGradient id={`${id}-gel`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={GEL} /><stop offset="1" stopColor={GEL_D} /></linearGradient>
        <linearGradient id={`${id}-motor`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#56616C" /><stop offset="1" stopColor={K.metalDark} /></linearGradient>
        <clipPath id={`${id}-screw`}><rect x={-330} y={sy - 13} width={mx + 330} height={26} rx={11} /></clipPath>
        <filter id={`${id}-sh`} x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation={5} /></filter>
      </defs>
      {/* rigid support (white printed part, cut): cavity for the insert, and a bay for the drive below */}
      <path d={`M-1400 ${B0}H${-A3.insHalf - 2}V${iB + 2}H${A3.insHalf + 2}V${B0}H1400V1500H-1400Z`} fill={`url(#${id}-hatch)`} stroke={K.blockInk} strokeWidth={3} />
      <path d={`M${-A3.insHalf - 90} ${iB + 2}H${A3.insHalf + 90}V${sy + 70}H${-A3.insHalf - 90}Z`} fill="#26313A" stroke={K.blockInk} strokeWidth={3} />
      <path d={`M${-330} ${sy - 60}H${mx + 10}V${sy + 70}H-330Z`} fill="#26313A" />
      {/* drive (illustrative): insert -> link -> carriage on a lead screw, turned by a motor */}
      <rect x={-22 + ix} y={iB - 6} width={44} height={sy - iB} rx={8} fill={K.metal} stroke={K.metalDark} strokeWidth={3} />
      <rect x={-330} y={sy - 13} width={mx + 330} height={26} rx={11} fill="#B8C2CB" stroke={K.metalDark} strokeWidth={3} />
      <g clipPath={`url(#${id}-screw)`}>{Array.from({length: 34}, (_, k) => { const x = -350 + k * 18 + ((spin * 18) % 18); return <line key={k} x1={x} y1={sy - 13} x2={x + 10} y2={sy + 13} stroke="#7E8B97" strokeWidth={4} />; })}</g>
      <rect x={-56 + ix} y={sy - 34} width={112} height={68} rx={11} fill={K.metal} stroke={K.metalDark} strokeWidth={3} />
      <rect x={-42 + ix} y={sy - 23} width={84} height={10} rx={4} fill={K.metalHi} opacity={0.5} />
      <rect x={mx} y={sy - 70} width={210} height={140} rx={20} fill={`url(#${id}-motor)`} stroke={K.metalDark} strokeWidth={4} />
      {[0, 1, 2, 3].map((q) => <line key={q} x1={mx + 180 - q * 20} y1={sy - 52} x2={mx + 180 - q * 20} y2={sy + 52} stroke={K.metalHi} strokeWidth={5} opacity={0.5} />)}
      {motor > 0 && <rect x={mx - 8} y={sy - 78} width={226} height={156} rx={24} fill="none" stroke="#7FF2EA" strokeWidth={5} opacity={0.65 * motor} />}
      {/* the movable insert: rigid machined part carrying the five perforations under the mouth corner */}
      <path d={path(ins)} fill={`url(#${id}-ins)`} stroke={K.metalDark} strokeWidth={3} />
      <path d={`M${-A3.insHalf + ix + 6} ${B0 + 4}H${A3.insHalf + ix - 6}`} stroke="#DCE2E7" strokeWidth={3} opacity={0.8} />
      {/* perforations, filled by the gel that locks into each undercut */}
      {HOLES.map((hx, k) => {
        const pk = pocket(hx + shift(hx), B0);
        return (
          <g key={k}>
            <path d={smooth(pk, false, 0.14)} fill="#2E3841" />
            <path d={smooth(pocket(hx + shift(hx), B0 + 1.5, 0.84), false, 0.14)} fill={`url(#${id}-gel)`} />
            {[-4, 0, 4].map((o, q) => <path key={q} d={fib(hx, o)} fill="none" stroke={GEL_F} strokeWidth={1.4 + (onInsert(hx) ? 1.2 * d : 0)} opacity={0.7} />)}
            {G(hx) > 0 && <path d={smooth(pk, false, 0.14)} fill="none" stroke="#7FF2EA" strokeWidth={4} opacity={0.75 * G(hx)} />}
          </g>
        );
      })}
      {/* gel columns rising from each perforation through the silicone into the dermis */}
      {HOLES.map((hx, k) => <path key={k} d={column(hx)} fill={GEL} />)}
      <path d={band(silTop, silBot)} fill={`url(#${id}-sil)`} opacity={0.66} />
      {HOLES.map((hx, k) => [-4, 0, 4].map((o, q) => <path key={`${k}${q}`} d={smooth([P(hx + o, A3.sil0 - 10), P(hx + o, lerp(A3.sil0, B0, 0.5)), {x: hx + o * 0.8 + shift(hx), y: B0 + 2}])} fill="none" stroke={GEL_F} strokeWidth={1.2} opacity={0.55} />))}
      {HOLES.map((hx, k) => G(hx) > 0 && <path key={k} d={column(hx)} fill="none" stroke="#7FF2EA" strokeWidth={3} opacity={0.6 * G(hx)} />)}
      {/* living dermis (same cells and fibres as every tissue view), displaced only around the insert */}
      <TissueSection m={a3Map(d)} u0={640 - 1000 / A3.k} u1={640 + 1000 / A3.k} t={t} tone={0} id={`${id}-ts`} />
      <path d={smooth(xs.slice(20, 60).map((x) => { const p = P(x, A3.y0); return {x: p.x, y: p.y + 5}; }))} fill="none" stroke="#FFFFFF" strokeWidth={3.5} opacity={0.3} />
    </g>
  );
};
