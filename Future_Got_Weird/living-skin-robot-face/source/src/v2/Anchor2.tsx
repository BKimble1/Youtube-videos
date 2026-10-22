// V2 close explanation of ONE attachment (mouth corner), at large scale. Based on the 2024 perforation-type anchors:
// the dermis-equivalent gel fills tapered (V-shaped) perforations through the support and locks beneath it, like a
// skin ligament, instead of hanging on separate pegs or studs. The movable support, link, carriage, lead screw and
// motor are a clearly simplified illustration of "actuators pull underneath". No muscles.
// World units = pixels at zoom 1. Pull d in [0, 1] moves the support left by D; the gel columns carry the force up
// into the silicone and dermis, which shear and fold at the surface.
import React from 'react';
import {Pt, smooth, path, lerp, clamp, rnd} from '../lib';
import {TissueSection, TMap, DERM, tc} from './Tissue2';
import {K} from '../art/Face';

export const AN = {k: 1.55, y0: -600, sil0: -600 + DERM * 1.55, plate0: -110, plate1: 60, D: 110, holes: [-280, 0, 280], plateHalf: 470};
const hy = (y: number) => lerp(1, 0.42, clamp((AN.plate0 - y) / (AN.plate0 - AN.y0)));
const gx = (x: number) => 1 / (1 + Math.pow(Math.abs(x) / 560, 6));
// displacement of the soft layers at rest point (x, y)
export const anDisp = (x: number, y: number, d: number): Pt => {
  const fy = clamp(1 - (y - AN.y0) / 520, 0.12, 1);
  const tx = -AN.D * d * gx(x) * hy(y);
  const dy = (-74 * Math.exp(-(((x + 440) / 210) ** 2)) + 48 * Math.exp(-(((x - 300) / 150) ** 2)) + 16 * Math.exp(-(((x + 40) / 120) ** 2))) * d * fy;
  return {x: tx, y: dy};
};
export const anMap = (d: number): TMap => (u, w) => {
  const x = (u - 640) * AN.k, y = AN.y0 + w * AN.k;
  const q = anDisp(x, y, d);
  return {x: x + q.x, y: y + q.y};
};

export const AnchorSection: React.FC<{d: number; t: number; tone: number; id: string; glow: number[]; motor: number; spin: number}> = ({d, t, tone, id, glow, motor, spin}) => {
  const C = tc(tone);
  const tx = -AN.D * d;
  const P = (x: number, y: number) => { const q = anDisp(x, y, d); return {x: x + q.x, y: y + q.y}; };
  const xs = Array.from({length: 73}, (_, i) => -900 + i * 25);
  const silTop = xs.map((x) => P(x, AN.sil0)), silBot = xs.map((x) => P(x, AN.plate0));
  const band = (a: Pt[], b: Pt[]) => smooth(a) + 'L' + [...b].reverse().map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L') + 'Z';
  // gel column for perforation at rest x = hx: through the silicone (soft, sheared), then through the moving support
  const colPts = (hx: number, side: number) => {
    const top = Array.from({length: 7}, (_, i) => { const y = lerp(AN.sil0 - 20, AN.plate0, i / 6); return P(hx + side * lerp(70, 60, i / 6), y); });
    const v = [{x: hx + side * 60 + tx, y: AN.plate0}, {x: hx + side * 19 + tx, y: AN.plate1}, {x: hx + side * 34 + tx, y: AN.plate1 + 8}, {x: hx + side * 30 + tx, y: AN.plate1 + 16}, {x: hx + tx, y: AN.plate1 + 17}];
    return [...top, ...v];
  };
  const column = (hx: number) => { const a = colPts(hx, -1), b = colPts(hx, 1); return smooth(a) + 'L' + [...b].reverse().map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L') + 'Z'; };
  const colFibre = (hx: number, o: number) => {
    const pts = Array.from({length: 7}, (_, i) => { const y = lerp(AN.sil0 - 30, AN.plate0, i / 6); return P(hx + o * lerp(18, 40, i / 6), y); });
    return [...pts, {x: hx + o * 26 + tx, y: AN.plate0 + 60}, {x: hx + o * 10 + tx, y: AN.plate1}, {x: hx + o * 22 + tx, y: AN.plate1 + 10}];
  };
  const plate: Pt[] = [{x: -AN.plateHalf + tx, y: AN.plate0}, {x: AN.plateHalf + tx, y: AN.plate0}, {x: AN.plateHalf + tx, y: AN.plate1}, {x: -AN.plateHalf + tx, y: AN.plate1}];
  const vHole = (hx: number) => [{x: hx - 60 + tx, y: AN.plate0 - 1}, {x: hx + 60 + tx, y: AN.plate0 - 1}, {x: hx + 19 + tx, y: AN.plate1 + 1}, {x: hx - 19 + tx, y: AN.plate1 + 1}];
  const screwY = 520;
  return (
    <g>
      <defs>
        <pattern id={`${id}-hatch`} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="16" height="16" fill="#E3E9EE" /><line x1="0" y1="0" x2="0" y2="16" stroke="#C9D2DA" strokeWidth="3.5" />
        </pattern>
        <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9AA6B1" /><stop offset="0.5" stopColor="#7D8995" /><stop offset="1" stopColor="#5F6B76" /></linearGradient>
        <linearGradient id={`${id}-sil`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E6F0F5" /><stop offset="1" stopColor="#C9D8E1" /></linearGradient>
        <linearGradient id={`${id}-motor`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#56616C" /><stop offset="1" stopColor={K.metalDark} /></linearGradient>
        <clipPath id={`${id}-screw`}><rect x={-520} y={screwY - 16} width={1040} height={32} rx={14} /></clipPath>
      </defs>
      {/* base (cut, hatched) around the support's slot, and the cavity the locking knobs ride in */}
      <path d={`M-1200 ${AN.plate0}H-600V${AN.plate1 + 70}H600V${AN.plate0}H1200V1400H-1200Z`} fill={`url(#${id}-hatch)`} stroke={K.blockInk} strokeWidth={3} />
      <rect x={-600} y={AN.plate1 + 70} width={1200} height={10} fill={K.blockInk} opacity={0.4} />
      <rect x={-60} y={AN.plate1 + 70} width={120} height={330} fill="#4A5560" opacity={0.6} />
      {/* rigid linkage: support -> link -> carriage on a lead screw -> motor */}
      <rect x={-34 + tx} y={AN.plate1 - 10} width={68} height={screwY - AN.plate1 - 10} rx={12} fill={K.metal} stroke={K.metalDark} strokeWidth={3} />
      <circle cx={tx} cy={AN.plate1 + 40} r={14} fill={K.metalHi} stroke={K.metalDark} strokeWidth={3} />
      <rect x={-520} y={screwY - 16} width={1040} height={32} rx={14} fill="#B8C2CB" stroke={K.metalDark} strokeWidth={3} />
      <g clipPath={`url(#${id}-screw)`}>
        {Array.from({length: 60}, (_, k) => { const x = -540 + k * 22 + ((spin * 22) % 22); return <line key={k} x1={x} y1={screwY - 16} x2={x + 12} y2={screwY + 16} stroke="#7E8B97" strokeWidth={5} />; })}
      </g>
      <rect x={-78 + tx} y={screwY - 44} width={156} height={88} rx={14} fill={K.metal} stroke={K.metalDark} strokeWidth={3} />
      <rect x={-60 + tx} y={screwY - 30} width={120} height={14} rx={5} fill={K.metalHi} opacity={0.5} />
      <rect x={520} y={screwY - 90} width={300} height={180} rx={24} fill={`url(#${id}-motor)`} stroke={K.metalDark} strokeWidth={4} />
      {[0, 1, 2, 3, 4].map((q) => <line key={q} x1={760 - q * 24} y1={screwY - 70} x2={760 - q * 24} y2={screwY + 70} stroke={K.metalHi} strokeWidth={6} opacity={0.5} />)}
      {motor > 0 && <rect x={512} y={screwY - 98} width={316} height={196} rx={28} fill="none" stroke="#7FF2EA" strokeWidth={6} opacity={0.7 * motor} />}
      <circle cx={600} cy={screwY + 60} r={10} fill={K.accent} opacity={0.5 + 0.5 * motor} />
      {/* the perforated support (moves) */}
      <path d={path(plate)} fill={`url(#${id}-plate)`} stroke={K.metalDark} strokeWidth={3} />
      <path d={`M${-AN.plateHalf + tx + 6} ${AN.plate0 + 5}H${AN.plateHalf + tx - 6}`} stroke="#C3CCD4" strokeWidth={4} opacity={0.7} />
      {AN.holes.map((hx, k) => <path key={k} d={path(vHole(hx))} fill="#3A444E" />)}
      {/* silicone layer, then gel columns through it and through the perforations, locking in knobs below */}
      <path d={band(silTop, silBot)} fill={`url(#${id}-sil)`} />
      {Array.from({length: 6}, (_, k) => <path key={k} d={smooth(xs.map((x) => P(x, lerp(AN.sil0 + 20, AN.plate0 - 18, k / 5))))} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.35} />)}
      {AN.holes.map((hx, k) => (
        <g key={k}>
          {glow[k] > 0 && <path d={column(hx)} fill="none" stroke="#7FF2EA" strokeWidth={14} opacity={0.5 * glow[k]} />}
          <path d={column(hx)} fill={C.matrix} />
          {[-1.4, -0.5, 0.5, 1.4].map((o) => <path key={o} d={smooth(colFibre(hx, o))} fill="none" stroke={d > 0.05 ? '#FFF4EC' : C.fiber} strokeWidth={2.4 + 1.6 * d} opacity={0.5 + 0.45 * d} />)}
          <path d={`M${hx - 60 + tx} ${AN.plate0}L${hx - 19 + tx} ${AN.plate1}M${hx + 60 + tx} ${AN.plate0}L${hx + 19 + tx} ${AN.plate1}`} stroke={K.metalDark} strokeWidth={4} />

        </g>
      ))}
      {/* the living dermis (same cells and fibres), sheared by the pull */}
      <TissueSection m={anMap(d)} u0={640 - 900 / AN.k} u1={640 + 900 / AN.k} t={t} tone={tone} id={`${id}-ts`} />
      {/* wet sheen on the surface that follows the fold */}
      <path d={smooth(xs.slice(10, 40).map((x) => { const p = P(x, AN.y0); return {x: p.x, y: p.y + 6}; }))} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.35} />
    </g>
  );
};
