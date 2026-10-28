// The acquisition bench and its corner of the lab: a gridded test mat on a wooden bench against the lab wall
// (cream plaster over a teal panel, the channel's lab palette), a parts shelf and a warm task lamp.
import React from 'react';
import {box, Item, line, poly, Proj} from '../lib/r3';
import {v3, V3} from '../lib/v3';
import {INK} from '../dc/ink';
import {rgba} from '../dc/color';

export const ENV = {
  wall: '#F2E8D5',
  wallDeep: '#E4D7BF',
  panel: '#8DB3AC',
  panelDeep: '#76A097',
  wood: '#D29E6A',
  woodFront: '#B9844F',
  woodDeep: '#9C6B3D',
  mat: '#DCE6EA',
  matLine: '#BFCFD7',
  matBold: '#A9BDC8',
  shelf: '#C99A68',
  bin: ['#D99A8C', '#E3C487', '#93B8C8', '#A3C2A6'],
  metal: '#AEB9C2',
  lamp: '#E9E2D4',
};

const MAT = {x0: -1.4, x1: 1.4, z0: -0.66, z1: 0.6};
const BENCH = {x0: -2.2, x1: 2.2, z0: -0.95, z1: 0.75, top: 0, thick: 0.045};
const WALL_Z = -0.95;

/** the mat grid: fine every 5 cm, bold every 25 cm */
const matGrid = (P: Proj): Item[] => {
  const out: (Item | null)[] = [];
  const y = 0.0004;
  for (let x = Math.ceil(MAT.x0 / 0.05) * 0.05; x <= MAT.x1 + 1e-6; x += 0.05) {
    const bold = Math.abs(Math.round(x / 0.25) * 0.25 - x) < 1e-6;
    out.push(line(P, [v3(x, y, MAT.z0), v3(x, y, MAT.z1)], bold ? ENV.matBold : ENV.matLine, bold ? 2.2 : 1.1, {layer: 1, depthBias: 50}));
  }
  for (let z = Math.ceil(MAT.z0 / 0.05) * 0.05; z <= MAT.z1 + 1e-6; z += 0.05) {
    const bold = Math.abs(Math.round(z / 0.25) * 0.25 - z) < 1e-6;
    out.push(line(P, [v3(MAT.x0, y, z), v3(MAT.x1, y, z)], bold ? ENV.matBold : ENV.matLine, bold ? 2.2 : 1.1, {layer: 1, depthBias: 50}));
  }
  return out.filter(Boolean) as Item[];
};

export const benchArt = (P: Proj): Item[] => {
  const out: (Item | null)[] = [];
  // wall (behind everything) and its panel
  out.push(poly(P, [v3(-4, 0, WALL_Z), v3(4, 0, WALL_Z), v3(4, 2.6, WALL_Z), v3(-4, 2.6, WALL_Z)], ENV.wall, {layer: 0, stroke: null, depthBias: 100}));
  out.push(poly(P, [v3(-4, -1.0, WALL_Z + 0.001), v3(4, -1.0, WALL_Z + 0.001), v3(4, 0.0, WALL_Z + 0.001), v3(-4, 0.0, WALL_Z + 0.001)], ENV.panel, {layer: 0, stroke: null, depthBias: 99}));
  // a band of panel moulding along the wall above the bench
  out.push(poly(P, [v3(-4, 0.0, WALL_Z + 0.002), v3(4, 0.0, WALL_Z + 0.002), v3(4, 0.03, WALL_Z + 0.002), v3(-4, 0.03, WALL_Z + 0.002)], ENV.panelDeep, {layer: 0, stroke: null, depthBias: 98}));
  // the shelf and parts bins
  out.push(...box(P, v3(0.15, 0.62, WALL_Z + 0.11), v3(1.25, 0.012, 0.11), {top: ENV.shelf, side: ENV.woodFront, front: ENV.woodFront}, {layer: 0}));
  const bins: [number, number][] = [[-0.85, 0], [-0.55, 1], [-0.25, 2], [0.05, 3], [0.35, 0], [0.65, 2], [0.95, 1]];
  for (const [x, c] of bins) out.push(...box(P, v3(x, 0.68, WALL_Z + 0.1), v3(0.12, 0.05, 0.08), {top: '#F6EFE2', side: ENV.bin[c], front: ENV.bin[c]}, {layer: 0}));
  // a second shelf higher up with boxes
  out.push(...box(P, v3(-0.2, 1.05, WALL_Z + 0.11), v3(1.0, 0.012, 0.11), {top: ENV.shelf, side: ENV.woodFront, front: ENV.woodFront}, {layer: 0}));
  for (const [x, w, h, c] of [[-0.9, 0.14, 0.12, '#E9DCC6'], [-0.62, 0.1, 0.16, '#D7C6A8'], [0.1, 0.16, 0.1, '#E9DCC6'], [0.45, 0.12, 0.14, '#CDB894']] as [number, number, number, string][])
    out.push(...box(P, v3(x, 1.062 + h, WALL_Z + 0.1), v3(w, h, 0.08), {top: '#F6EFE2', side: c, front: c}, {layer: 0}));
  // bench top (wood) and its front edge
  out.push(poly(P, [v3(BENCH.x0, 0, BENCH.z0), v3(BENCH.x1, 0, BENCH.z0), v3(BENCH.x1, 0, BENCH.z1), v3(BENCH.x0, 0, BENCH.z1)], ENV.wood, {layer: 1, stroke: null, depthBias: 60}));
  out.push(poly(P, [v3(BENCH.x0, 0, BENCH.z1), v3(BENCH.x1, 0, BENCH.z1), v3(BENCH.x1, -BENCH.thick, BENCH.z1), v3(BENCH.x0, -BENCH.thick, BENCH.z1)], ENV.woodFront, {layer: 1, sw: 3, depthBias: 59}));
  out.push(poly(P, [v3(BENCH.x0, -BENCH.thick, BENCH.z1 - 0.02), v3(BENCH.x1, -BENCH.thick, BENCH.z1 - 0.02), v3(BENCH.x1, -1.0, BENCH.z1 - 0.02), v3(BENCH.x0, -1.0, BENCH.z1 - 0.02)], '#6F8C8A', {layer: 1, sw: 3, depthBias: 58}));
  // the test mat (a thin sheet with a rounded border line)
  out.push(poly(P, [v3(MAT.x0, 0.0002, MAT.z0), v3(MAT.x1, 0.0002, MAT.z0), v3(MAT.x1, 0.0002, MAT.z1), v3(MAT.x0, 0.0002, MAT.z1)], ENV.mat, {layer: 1, sw: 2.4, depthBias: 55}));
  out.push(...matGrid(P));
  return out.filter(Boolean) as Item[];
};

/** a warm pool of task light on the mat (drawn over the mat, under the shadows) */
export const lightPool = (P: Proj, c: V3, r: number, a = 0.18): Item | null => {
  const s = P.proj(c);
  if (s.z < 0.05) return null;
  const R = P.rad(c, r);
  const ry = R * (Math.abs(P.basis.fwd.y) * 0.9 + 0.1);
  const id = `poolg${Math.round(c.x * 1000)}${Math.round(c.z * 1000)}`;
  return {layer: 1, depth: -1, key: id, el: (
    <g key={id}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={rgba('#FFE7B8', a)} />
          <stop offset="1" stopColor={rgba('#FFE7B8', 0)} />
        </radialGradient>
      </defs>
      <ellipse cx={s.x} cy={s.y} rx={R} ry={ry} fill={`url(#${id})`} />
    </g>
  )};
};
