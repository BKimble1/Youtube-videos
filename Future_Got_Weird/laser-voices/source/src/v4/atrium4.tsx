// V4 world 1: the science-museum atrium. A tall, sunlit hall (metres; floor y = 0; back wall z = 15), its middle
// band repeating every BAY in x (windows, columns, floor tiles, sun shafts, the gallery) so the loop can shift the
// whole view by one bay without a visible jump. Exhibits, banners and the transmitter's demonstration stand sit
// outside that band. A crowd of the channel's other cast members walks the hall and the gallery; every walker's
// motion repeats over the film with a net shift of exactly one bay (see story4.ts), so the crowd loops too.
import React from 'react';
import {B, V3, v3, proj, pathOf} from './rig/geo4';
import {INK} from './rig/cast4';
import {cyc} from './core4';
import {Item, poly, line, polyNode, lineNode, depthOf, box, cyl} from './draw3';

export const BAY = 1.9;
export const ATR = {zBack: 15, zGal: 11.5, yGal: 4.4, hCeil: 9.6, x0: -40, x1: 40, zNear: -9};
export const AC = {
  wall: '#EFE3C2', wallShade: '#E2D3AC', wallDeep: '#D6C59A', trim: '#127A75', teal: '#1CA7A0', tealDeep: '#127A75',
  floor: '#D8CCB4', floorDark: '#C9BB9F', grout: '#BFAF92', inlay: '#1CA7A0', sky: '#BFE3EC', skyHi: '#E9F6F4', city: '#8FB8C4', cityDeep: '#6E9AA8',
  frame: '#2E4E5A', ceil: '#DCCFB0', ceilLight: '#CFE8EE', beam: '#C9B98F', column: '#F4ECD6', columnShade: '#DCCFAE', gallery: '#E8DCBE', galleryUnder: '#B9A985',
  glass: '#CDE9EE', rail: '#162A32', coral: '#EF6B55', saffron: '#FFC744', blue: '#4F7CC9', sun: '#FFF4D6',
};
const P3 = v3;

/** The hall's shell: floor, back wall with windows, gallery, columns, ceiling, sun shafts. One background layer. */
export const AtriumShell: React.FC<{b: B}> = ({b}) => {
  const {zBack: Z, zGal, yGal, hCeil, x0, x1, zNear} = ATR;
  const out: React.ReactNode[] = [];
  const add = (n: React.ReactNode) => out.push(n);
  // floor and its tile grid (0.95 m), a teal inlay band
  add(polyNode(b, [P3(x0, 0, zNear), P3(x1, 0, zNear), P3(x1, 0, Z), P3(x0, 0, Z)], {fill: AC.floor}, 'floor'));
  add(polyNode(b, [P3(x0, 0.001, 5.6), P3(x1, 0.001, 5.6), P3(x1, 0.001, 6.1), P3(x0, 0.001, 6.1)], {fill: AC.inlay, op: 0.85}, 'inlay'));
  for (let i = Math.ceil(x0 / 0.95); i <= x1 / 0.95; i++) add(lineNode(b, P3(i * 0.95, 0.002, zNear), P3(i * 0.95, 0.002, Z), {stroke: AC.grout, sw: 1.4}, `gx${i}`));
  for (let k = Math.ceil(zNear / 0.95); k <= Z / 0.95; k++) add(lineNode(b, P3(x0, 0.002, k * 0.95), P3(x1, 0.002, k * 0.95), {stroke: AC.grout, sw: 1.4}, `gz${k}`));
  // sun shafts through the upper windows onto the floor (soft, periodic)
  for (let i = Math.ceil(x0 / BAY); i <= x1 / BAY; i++) {
    const x = i * BAY;
    add(polyNode(b, [P3(x - 0.45, 0.003, 6.8), P3(x + 0.45, 0.003, 6.8), P3(x + 0.25, 0.003, 10.6), P3(x - 0.65, 0.003, 10.6)], {fill: AC.sun, op: 0.35}, `sun${i}`));
  }
  // back wall: lower windows (behind the gallery) and upper windows
  add(polyNode(b, [P3(x0, 0, Z), P3(x1, 0, Z), P3(x1, hCeil, Z), P3(x0, hCeil, Z)], {fill: AC.wall}, 'wall'));
  for (let i = Math.ceil(x0 / BAY); i <= x1 / BAY; i++) {
    const x = i * BAY;
    for (const [y0, y1, tag] of [[0.9, 3.7, 'lo'], [5.3, 8.6, 'hi']] as [number, number, string][]) {
      const q = (xa: number, ya: number) => P3(x + xa, ya, Z - 0.01);
      add(polyNode(b, [q(-0.55, y0), q(0.55, y0), q(0.55, y1), q(-0.55, y1)], {fill: AC.sky}, `ws${tag}${i}`));
      const cy = y0 + (y1 - y0) * (tag === 'lo' ? 0.42 : 0.18), hh = (i * 7) % 3;
      add(polyNode(b, [q(-0.55, y0), q(0.55, y0), q(0.55, cy + 0.15 * hh), q(0.1, cy + 0.15 * hh), q(0.1, cy + 0.35), q(-0.55, cy + 0.35)], {fill: (i % 2) ? AC.city : AC.cityDeep}, `wc${tag}${i}`));
      add(polyNode(b, [q(-0.4, y1 - 0.2), q(-0.15, y1 - 0.2), q(-0.45, y0 + 0.6), q(-0.55, y0 + 0.6)], {fill: '#FFFFFF', op: 0.25}, `wgl${tag}${i}`));
      add(polyNode(b, [q(-0.55, y0), q(0.55, y0), q(0.55, y1), q(-0.55, y1)], {stroke: AC.frame, sw: 4}, `wf${tag}${i}`));
      add(lineNode(b, q(0, y0), q(0, y1), {stroke: AC.frame, sw: 2.5}, `wm${tag}${i}`));
      add(lineNode(b, q(-0.55, y0 + (y1 - y0) * 0.7), q(0.55, y0 + (y1 - y0) * 0.7), {stroke: AC.frame, sw: 2.5}, `wt${tag}${i}`));
    }
  }
  // under the gallery: a darker soffit band; gallery slab front edge and glass railing
  add(polyNode(b, [P3(x0, yGal - 0.25, zGal), P3(x1, yGal - 0.25, zGal), P3(x1, yGal - 0.25, Z), P3(x0, yGal - 0.25, Z)], {fill: AC.galleryUnder}, 'soffit'));
  add(polyNode(b, [P3(x0, yGal - 0.25, zGal), P3(x1, yGal - 0.25, zGal), P3(x1, yGal + 0.1, zGal), P3(x0, yGal + 0.1, zGal)], {fill: AC.gallery, stroke: INK, sw: 2}, 'slab'));
  add(polyNode(b, [P3(x0, yGal + 0.1, zGal), P3(x1, yGal + 0.1, zGal), P3(x1, yGal + 0.1, Z), P3(x0, yGal + 0.1, Z)], {fill: AC.wallShade}, 'galfloor'));
  // ceiling with skylight panels between beams
  add(polyNode(b, [P3(x0, hCeil, zNear), P3(x1, hCeil, zNear), P3(x1, hCeil, Z), P3(x0, hCeil, Z)], {fill: AC.ceil}, 'ceil'));
  for (let i = Math.ceil(x0 / BAY); i <= x1 / BAY; i++) {
    const x = i * BAY;
    add(polyNode(b, [P3(x - 0.62, hCeil - 0.01, -6), P3(x + 0.62, hCeil - 0.01, -6), P3(x + 0.62, hCeil - 0.01, 10), P3(x - 0.62, hCeil - 0.01, 10)], {fill: AC.ceilLight}, `sk${i}`));
    add(polyNode(b, [P3(x - 0.62, hCeil - 0.01, -6), P3(x - 0.3, hCeil - 0.01, -6), P3(x - 0.3, hCeil - 0.01, 10), P3(x - 0.62, hCeil - 0.01, 10)], {fill: '#FFFFFF', op: 0.35}, `skg${i}`));
    add(lineNode(b, P3(x + BAY / 2, hCeil - 0.02, zNear), P3(x + BAY / 2, hCeil - 0.02, Z), {stroke: AC.frame, sw: 3}, `cb${i}`));
  }
  // front wall (the entrance side, z = zNear): tall glass doors under clerestory windows, periodic in BAY
  add(polyNode(b, [P3(x0, 0, zNear), P3(x1, 0, zNear), P3(x1, hCeil, zNear), P3(x0, hCeil, zNear)], {fill: AC.wallShade}, 'fwall'));
  for (let i = Math.ceil(x0 / BAY); i <= x1 / BAY; i++) {
    const x = i * BAY;
    const q = (xa: number, ya: number) => P3(x + xa, ya, zNear + 0.01);
    add(polyNode(b, [q(-0.6, 0), q(0.6, 0), q(0.6, 2.9), q(-0.6, 2.9)], {fill: AC.sky}, `fd${i}`));
    add(polyNode(b, [q(-0.6, 0), q(0.6, 0), q(0.6, 1.5 + 0.25 * ((i * 5) % 3)), q(-0.6, 1.3)], {fill: (i % 2) ? AC.city : AC.cityDeep}, `fdc${i}`));
    add(polyNode(b, [q(-0.6, 0), q(0.6, 0), q(0.6, 2.9), q(-0.6, 2.9)], {stroke: AC.frame, sw: 4}, `fdf${i}`));
    add(lineNode(b, q(0, 0), q(0, 2.9), {stroke: AC.frame, sw: 3}, `fdm${i}`));
    add(lineNode(b, q(-0.12, 1.1), q(-0.12, 1.5), {stroke: AC.rail, sw: 4}, `fh1${i}`));
    add(lineNode(b, q(0.12, 1.1), q(0.12, 1.5), {stroke: AC.rail, sw: 4}, `fh2${i}`));
    add(polyNode(b, [q(-0.55, 5.4), q(0.55, 5.4), q(0.55, 8.4), q(-0.55, 8.4)], {fill: AC.sky, stroke: AC.frame, sw: 4}, `fw${i}`));
    add(lineNode(b, q(0, 5.4), q(0, 8.4), {stroke: AC.frame, sw: 2.5}, `fwm${i}`));
  }
  add(polyNode(b, [P3(x0, 3.4, zNear + 0.02), P3(x1, 3.4, zNear + 0.02), P3(x1, 3.75, zNear + 0.02), P3(x0, 3.75, zNear + 0.02)], {fill: AC.trim}, 'fband'));
  // the hall's far ends
  for (const xe of [x0, x1]) add(polyNode(b, [P3(xe, 0, zNear), P3(xe, 0, Z), P3(xe, hCeil, Z), P3(xe, hCeil, zNear)], {fill: AC.wallDeep}, `end${xe}`));
  return <g>{out}</g>;
};

/** Gallery railing, columns (periodic band) as paint items, so walkers can pass in front of and behind them. */
export const atriumItems = (b: B, t: number): Item[] => {
  const {zGal, yGal} = ATR;
  const items: Item[] = [];
  for (let i = -18; i <= 18; i++) {
    const x = i * BAY + BAY / 2;
    items.push(cyl(b, x, zGal + 0.15, 0.17, 0, yGal - 0.25, {side: AC.column, top: AC.column, sw: 2}, `col${i}`));
    // glass railing panel on the gallery edge
    items.push(poly(b, [P3(x - BAY / 2, yGal + 0.1, zGal - 0.02), P3(x + BAY / 2, yGal + 0.1, zGal - 0.02), P3(x + BAY / 2, yGal + 1.0, zGal - 0.02), P3(x - BAY / 2, yGal + 1.0, zGal - 0.02)], {fill: AC.glass, op: 0.35, stroke: AC.rail, sw: 1.5}, `rail${i}`, 0.3));
    items.push(line(b, P3(x - BAY / 2, yGal + 1.02, zGal - 0.02), P3(x + BAY / 2, yGal + 1.02, zGal - 0.02), {stroke: AC.rail, sw: 4}, `rt${i}`, 0.29));
  }
  // banners hanging from the ceiling (outside the loop band)
  ([[-16.5, AC.coral], [-11.2, AC.teal], [16.5, AC.saffron], [11.0, AC.blue], [-14, AC.saffron], [14, AC.coral]] as [number, string][]).forEach(([x, c], i) => {
    const sway = 0.05 * cyc(t, 0.127, i); // periodic over the film (loops)
    items.push(poly(b, [P3(x - 0.45, 8.8, 9), P3(x + 0.45, 8.8, 9), P3(x + 0.45 + sway, 5.8, 9), P3(x + sway, 5.5, 9), P3(x - 0.45 + sway, 5.8, 9)], {fill: c, stroke: INK, sw: 2}, `ban${i}`));
  });
  // exhibits: display plinths with objects (left and right of the action, outside the loop band)
  const plinth = (x: number, z: number, k: string, top: React.ReactNode | null, w = 0.7) => {
    items.push(box(b, x - w / 2, x + w / 2, 0, 1.0, z - w / 2, z + w / 2, {top: '#F4ECD6', side: '#DCCFAE', front: '#E8DCBE'}, k));
    if (top) items.push({d: depthOf(b, v3(x, 1.2, z)) - 0.01, node: <g key={`${k}t`}>{top}</g>});
  };
  // a gramophone horn and a big tuning fork on plinths; a glass case
  {
    const x = -9.5, z = 8.2;
    const c = proj(b, v3(x, 1.25, z));
    plinth(x, z, 'pl1', c.z > 0.2 ? (() => {
      const k = b.c.f / c.z;
      return <g transform={`translate(${c.x} ${c.y}) scale(${k / 100})`}><path d="M -18 10 L 18 10 L 10 -4 L -10 -4 Z" fill="#7A4A2A" stroke={INK} strokeWidth={2.5} /><path d="M 0 -4 L 4 -20 C 10 -40 30 -60 52 -58 C 40 -40 30 -30 10 -16" fill={AC.saffron} stroke={INK} strokeWidth={2.5} /></g>;
    })() : null);
  }
  {
    const x = 12.6, z = 8.2;
    const c = proj(b, v3(x, 1.0, z));
    plinth(x, z, 'pl2', c.z > 0.2 ? (() => {
      const k = b.c.f / c.z;
      return <g transform={`translate(${c.x} ${c.y}) scale(${k / 100})`}><path d="M -6 0 L -6 -40 Q -6 -52 -16 -52 L -16 -80 M 6 0 L 6 -40 Q 6 -52 16 -52 L 16 -80" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" /><path d="M -6 0 L -6 -40 Q -6 -52 -16 -52 L -16 -80 M 6 0 L 6 -40 Q 6 -52 16 -52 L 16 -80" fill="none" stroke="#C9D6DC" strokeWidth={4.5} strokeLinecap="round" /></g>;
    })() : null);
  }
  items.push(box(b, 9.4, 10.8, 0, 0.9, 7.75, 8.65, {top: '#F4ECD6', side: '#DCCFAE', front: '#E8DCBE'}, 'case'));
  items.push(box(b, 9.45, 10.75, 0.9, 1.6, 7.8, 8.6, {top: AC.glass, side: AC.glass, front: AC.glass, sw: 1.5}, 'caseglass', 0, -0.01));
  // benches
  items.push(box(b, -7.2, -5.6, 0.38, 0.46, 3.2, 3.6, {top: '#7A5A3A', side: '#5E432B', front: '#6B4D33'}, 'bench1'));
  items.push(box(b, 12.0, 13.6, 0.38, 0.46, 8.0, 8.4, {top: '#7A5A3A', side: '#5E432B', front: '#6B4D33'}, 'bench2'));
  return items;
};

/** A big potted plant (a foreground wipe element): pot + leaf fan, drawn as one card at its base. */
export const plant = (b: B, x: number, z: number, s: number, key: string, t: number): Item => {
  const base = proj(b, v3(x, 0, z));
  if (base.z < 0.15) return {d: base.z, node: null};
  const k = b.c.f / base.z / 100 * s;
  const leaves = Array.from({length: 9}, (_, i) => {
    const a = -70 + i * 17.5 + 3 * cyc(t, 0.143, i);
    const L = 120 + 40 * Math.sin(i * 2.1);
    return <path key={i} d={`M 0 -60 Q ${Math.sin((a * Math.PI) / 180) * L * 0.5 - 14} ${-60 - Math.cos((a * Math.PI) / 180) * L * 0.6} ${Math.sin((a * Math.PI) / 180) * L} ${-60 - Math.cos((a * Math.PI) / 180) * L} Q ${Math.sin((a * Math.PI) / 180) * L * 0.5 + 14} ${-60 - Math.cos((a * Math.PI) / 180) * L * 0.5} 0 -60 Z`} fill={i % 2 ? '#2F8F6A' : '#3FA57C'} stroke={INK} strokeWidth={2.4} />;
  });
  return {d: base.z, node: <g key={key} transform={`translate(${base.x} ${base.y}) scale(${k})`}>{leaves}<path d="M -32 0 L 32 0 L 40 -64 L -40 -64 Z" fill={AC.coral} stroke={INK} strokeWidth={2.6} /><rect x={-44} y={-72} width={88} height={12} rx={4} fill="#C9503E" stroke={INK} strokeWidth={2.4} /></g>};
};
/** The demonstration stand around the transmitter: rope stanchions and a small sign. */
export const demoStand = (b: B, c: V3, key: string): Item[] => {
  const items: Item[] = [];
  const posts = [v3(c.x - 0.7, 0, c.z - 0.6), v3(c.x + 0.7, 0, c.z - 0.6), v3(c.x + 0.7, 0, c.z + 0.7), v3(c.x - 0.7, 0, c.z + 0.7)];
  posts.forEach((p, i) => items.push(cyl(b, p.x, p.z, 0.03, 0, 0.95, {side: '#C9A227', top: '#E9C04A', sw: 1.5}, `${key}p${i}`)));
  posts.forEach((p, i) => {
    const q = posts[(i + 1) % 4];
    if (i === 3) return;
    const pts: {x: number; y: number}[] = [];
    for (let k = 0; k <= 8; k++) {
      const u = k / 8;
      const pp = proj(b, v3(p.x + (q.x - p.x) * u, 0.85 - 0.12 * Math.sin(Math.PI * u), p.z + (q.z - p.z) * u));
      pts.push(pp);
    }
    items.push({d: depthOf(b, v3((p.x + q.x) / 2, 0.8, (p.z + q.z) / 2)), node: <path key={`${key}r${i}`} d={pathOf(pts, false)} fill="none" stroke="#8E2B3A" strokeWidth={4} strokeLinecap="round" />});
  });
  return items;
};
