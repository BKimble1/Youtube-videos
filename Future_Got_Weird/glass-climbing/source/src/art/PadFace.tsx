// The pad's adhesive face, seen square-on (through the glass, or on the bench): the plate's rim, 4 x 6 tiles of
// translucent silicone, each covered in rows of microscopic wedges (drawn as fine ridges, which only resolve when the
// camera is close), each with the anchor of its tendon at the centre. Where a tile is in close contact with glass it
// darkens and loses its sheen (light passes into the glass instead of scattering), as dry adhesives do.
import React from 'react';
import {mix, shade} from '../dc/color';
import {Deco, INK, Inked} from '../dc/ink';
import {fmt, V} from '../dc/math';
import {Lin} from '../dc/shade';
import {PLATE} from './Pad';

export const FACE = {cols: 4, rows: 6, tile: 25, gap: 3.4, rim: 7}; // mm-ish units: a 2.5 cm tile
export const faceSize = () => ({w: FACE.cols * FACE.tile + (FACE.cols - 1) * FACE.gap + 2 * FACE.rim, h: FACE.rows * FACE.tile + (FACE.rows - 1) * FACE.gap + 2 * FACE.rim});
/** a tile's centre in face units (origin at the face centre) */
export const tileC = (c: number, r: number): V => {
  const {w, h} = faceSize();
  return {x: -w / 2 + FACE.rim + c * (FACE.tile + FACE.gap) + FACE.tile / 2, y: -h / 2 + FACE.rim + r * (FACE.tile + FACE.gap) + FACE.tile / 2};
};

const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${fmt(x0 + r)},${fmt(y0)} H${fmt(x1 - r)} Q${fmt(x1)},${fmt(y0)} ${fmt(x1)},${fmt(y0 + r)} V${fmt(y1 - r)} Q${fmt(x1)},${fmt(y1)} ${fmt(x1 - r)},${fmt(y1)} H${fmt(x0 + r)} Q${fmt(x0)},${fmt(y1)} ${fmt(x0)},${fmt(y1 - r)} V${fmt(y0 + r)} Q${fmt(x0)},${fmt(y0)} ${fmt(x0 + r)},${fmt(y0)} Z`;

/** contact(c, r) in 0..1 per tile; `detail` 0..1 fades in the wedge ridges (close-ups) */
export const PadFace: React.FC<{id: string; c: V; s: number; contact: (c: number, r: number) => number; k: number; detail?: number; mirror?: boolean}> = ({id, c, s, contact, k, detail = 0}) => {
  const {w, h} = faceSize();
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) scale(${fmt(s)})`}>
      <Inked w={(3.2 * k) / s}>
        <Lin id={`${id}-pl`} d={rr(-w / 2, -h / 2, w / 2, h / 2, 6)} from={{x: -w / 2, y: -h / 2}} to={{x: w / 2, y: h / 2}} stops={[[0, mix(PLATE, '#A9B7C1', 0.4)], [1, shade(PLATE, 0.25)]]} />
      </Inked>
      <Deco>
        {Array.from({length: FACE.rows}).map((_, r) =>
          Array.from({length: FACE.cols}).map((__, cc) => {
            const t = tileC(cc, r);
            const a = Math.max(0, Math.min(1, contact(cc, r)));
            const x0 = t.x - FACE.tile / 2, y0 = t.y - FACE.tile / 2;
            const tid = `${id}-t${r}-${cc}`;
            return (
              <g key={`${r}-${cc}`}>
                <defs>
                  <linearGradient id={tid} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={mix('#E4F1F2', '#5E7C86', a * 0.75)} />
                    <stop offset="0.55" stopColor={mix('#C9DEE2', '#4D6A75', a * 0.8)} />
                    <stop offset="1" stopColor={mix('#AFC8CE', '#3D5662', a * 0.8)} />
                  </linearGradient>
                </defs>
                <path d={rr(x0, y0, x0 + FACE.tile, y0 + FACE.tile, 2.4)} fill={`url(#${tid})`} />
                {/* the sheen of uncontacted silicone (gone where the tile is in contact) */}
                <path d={`M${fmt(x0 + 3)},${fmt(y0 + 7)} L${fmt(x0 + 9)},${fmt(y0 + 2.5)} L${fmt(x0 + 13)},${fmt(y0 + 2.5)} L${fmt(x0 + 3)},${fmt(y0 + 11)} Z`} fill="#FFFFFF" opacity={0.45 * (1 - a)} />
                {/* wedge rows: fine ridges across the tile (resolve in the close-ups) */}
                {detail > 0.01 &&
                  Array.from({length: 22}).map((___, i) => {
                    const yy = y0 + 1.6 + i * ((FACE.tile - 3.2) / 21);
                    return <path key={i} d={`M${fmt(x0 + 1.4)},${fmt(yy)} H${fmt(x0 + FACE.tile - 1.4)}`} stroke={a > 0.5 ? '#2E4651' : '#8FAAB2'} strokeWidth={0.32} opacity={detail * (0.55 + 0.25 * a)} />;
                  })}
                {/* the tendon's anchor behind the tile */}
                <circle cx={fmt(t.x)} cy={fmt(t.y)} r={2.1} fill={shade(PLATE, 0.2)} opacity={0.35 * (1 - detail * 0.6)} />
                <path d={rr(x0, y0, x0 + FACE.tile, y0 + FACE.tile, 2.4)} fill="none" stroke={INK} strokeWidth={(1.4 * k) / s} opacity={0.55} />
              </g>
            );
          }),
        )}
      </Deco>
    </g>
  );
};
