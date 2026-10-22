// Liver tissue (liver units ≈ tissue units): plates of cuboidal hepatocytes, two cells thick, separated by sinusoids
// (narrow blood channels, flow +x). Hepatocytes are often binucleate; drawn with warmer, browner tones than lung.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, closedPath, rand, mixHex, noise, smooth} from '../../kit/core';
import {P} from '../palette';
import {Look, lookMix, TUMOR} from './tissue';

export const LCR = 56;               // hepatocyte half-size
export const SW = 74;                // sinusoid width
export const PH = 4 * LCR + SW;      // plate period
const PERX = 10;
const mod = (a: number, n: number) => ((a % n) + n) % n;
export const HEP: Look = {fill: '#D88A70', light: '#F6B9A0', deep: '#8E4434', nuc: '#7A2E36', nucDeep: '#521A22'};

/** Sinusoid centre lines are y = p * PH; hepatocyte rows at y = p*PH + SW/2 + LCR and + 3*LCR. */
export const hepAt = (i: number, row: number) => {
  // row: integer, two rows per plate
  const p = Math.floor(row / 2), r2 = mod(row, 2);
  const pi = mod(i, PERX), pr = mod(row, 8);
  const y = p * PH + SW / 2 + LCR + r2 * 2 * LCR + (rand(pi * 37 + pr * 11) - 0.5) * 6;
  const x = i * 2 * LCR * 1.03 + (r2 ? LCR : 0) + (rand(pi * 91 + pr * 7) - 0.5) * 10;
  return {x, y, seed: pi * 13 + pr * 71 + 5, bi: rand(pi * 5 + pr * 3) < 0.3};
};

const hepPath = (seed: number, s = 1) => {
  const pts: Pt[] = [];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 + Math.PI / 4;
    const sq = 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
    const r = LCR * 0.94 * Math.min(1.25, sq * 0.82 + 0.2) * (1 + 0.05 * noise(k, seed)) * s;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return closedPath(pts, 1);
};

export const Hepatocyte: React.FC<{x: number; y: number; seed: number; bi: boolean; look?: Look; lod: number; s?: number; pulse?: number}> = ({x, y, seed, bi, look = HEP, lod, s = 1, pulse = 0}) => {
  const d = hepPath(seed, s);
  if (lod < 7) return <rect x={x - LCR * 0.92 * s} y={y - LCR * 0.92 * s} width={LCR * 1.84 * s} height={LCR * 1.84 * s} rx={10} fill={look.fill} />;
  const nucs: Pt[] = bi ? [[-LCR * 0.3, -LCR * 0.1], [LCR * 0.32, LCR * 0.12]] : [[LCR * 0.05, 0]];
  return (
    <g transform={`translate(${x} ${y})`}>
      {pulse > 0.01 && <circle r={LCR * 2.2} fill="url(#glowMut)" opacity={pulse} />}
      <path d={d} fill={look.deep} />
      <path d={d} fill={look.fill} transform="scale(0.92)" />
      <path d={d} fill="url(#vol)" transform="scale(0.92)" />
      {lod > 18 && Array.from({length: 6}, (_, k) => <circle key={k} cx={(rand(seed * 7 + k) - 0.5) * LCR * 1.3} cy={(rand(seed * 9 + k) - 0.5) * LCR * 1.3} r={LCR * 0.05} fill={look.light} opacity={0.8} />)}
      {nucs.map(([nx, ny], k) => (
        <g key={k}>
          <circle cx={nx} cy={ny} r={LCR * (bi ? 0.24 : 0.3) * s} fill={look.nucDeep} />
          <circle cx={nx} cy={ny} r={LCR * (bi ? 0.21 : 0.27) * s} fill={look.nuc} />
          <circle cx={nx} cy={ny} r={LCR * (bi ? 0.21 : 0.27) * s} fill="url(#nucVol)" />
        </g>
      ))}
    </g>
  );
};

export const LiverPattern: React.FC<{id: string}> = ({id}) => {
  const W0 = PERX * 2 * LCR * 1.03, H0 = 4 * PH;
  const cells: React.ReactNode[] = [];
  for (let row = -1; row < 9; row++)
    for (let i = -1; i <= PERX; i++) {
      const c = hepAt(i, row);
      cells.push(<rect key={`${i},${row}`} x={c.x - LCR * 0.9} y={c.y - LCR * 0.9} width={LCR * 1.8} height={LCR * 1.8} rx={14} fill={HEP.fill} />);
      cells.push(<circle key={`n${i},${row}`} cx={c.x} cy={c.y} r={LCR * 0.28} fill={HEP.nuc} />);
    }
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={W0} height={H0}>
      <rect width={W0} height={H0} fill="#5A1420" />
      {cells}
    </pattern>
  );
};

/** Liver world under a camera. mod(i,row,x,y) can recolour cells (metastatic colony). */
export const LiverField: React.FC<{cam: Cam; t: number; mod?: (i: number, row: number, x: number, y: number) => {look?: Look; s?: number; hide?: boolean; pulse?: number} | null; flow?: number}> = ({cam, t, mod: m, flow = 160}) => {
  const lod = LCR * cam.z;
  const hw = Math.hypot(W, H) / 2 / cam.z + 200;
  const x0 = cam.x - hw, x1 = cam.x + hw, y0 = cam.y - hw, y1 = cam.y + hw;
  const cells: React.ReactNode[] = [];
  const sinus: React.ReactNode[] = [];
  const far = lod < 6;
  const p0 = Math.floor(y0 / PH) - 1, p1 = Math.ceil(y1 / PH) + 1;
  for (let p = p0; p <= p1; p++) {
    const y = p * PH;
    sinus.push(<rect key={`s${p}`} x={x0} y={y - SW / 2} width={x1 - x0} height={SW} fill="#7A1426" />);
    if (!far) {
      const S = 150;
      for (let i = Math.floor((x0 - t * flow) / S); i <= Math.ceil((x1 - t * flow) / S); i++) {
        const sd = mod(i, 97) * 7 + mod(p, 13) * 31;
        const x = i * S + t * flow + rand(sd) * 60;
        sinus.push(<ellipse key={`r${p},${i}`} cx={x} cy={y + (rand(sd + 1) - 0.5) * SW * 0.4} rx={SW * 0.36} ry={SW * 0.26} transform={`rotate(${(rand(sd + 2) - 0.5) * 60} ${x} ${y})`} fill={P.rbc} />);
      }
    }
  }
  if (!far) {
    const r0 = Math.floor(y0 / (2 * LCR)) - 2, r1 = Math.ceil(y1 / (2 * LCR)) + 2;
    const i0 = Math.floor(x0 / (2 * LCR * 1.03)) - 1, i1 = Math.ceil(x1 / (2 * LCR * 1.03)) + 1;
    for (let row = Math.floor(r0 / 2) * 2; row <= r1; row++)
      for (let i = i0; i <= i1; i++) {
        const c = hepAt(i, row);
        if (c.y < y0 - LCR || c.y > y1 + LCR) continue;
        const mm = m?.(i, row, c.x, c.y) ?? {};
        if (mm.hide) continue;
        cells.push(<Hepatocyte key={`${i},${row}`} x={c.x} y={c.y} seed={c.seed} bi={c.bi} look={mm.look} lod={lod} s={mm.s} pulse={mm.pulse} />);
      }
  }
  return (
    <g>
      <rect width={W} height={H} fill="#5A1420" />
      <g transform={camTransform(cam)}>
        {far && <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#liverPat)" />}
        {sinus}
        {cells}
      </g>
    </g>
  );
};
export const liverTumorLook = (k: number) => lookMix(HEP, TUMOR, k);
export const _lv = {smooth};
