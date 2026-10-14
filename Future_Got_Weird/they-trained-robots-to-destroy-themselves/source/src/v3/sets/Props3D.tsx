// Reusable 3D props (asset ids PROP-*): studio, assembly line, panels, crate, shutter, recycling belt, film lights.
import React from 'react';
import {Proj} from '../engine/camera';
import {V3, add, cross, mulS, norm, sub, mv, rotY, rotAxis, lerp3, rnd, clamp01} from '../engine/math';
import {Env, Item, box, circle3, cylinder, line3, quad, tube} from '../engine/prims';
import {hull, polyClosed, smoothClosed} from '../engine/draw';
import {C, F} from '../../theme';

// ---------------------------------------------------------------- studio (product intro)
export const STUDIO_ENV: Env = {light: norm([-0.5, 0.75, 0.6]), ambient: 0.7, ink: '#162A32', lineW: 2.4};
export const StudioBg: React.FC<{id?: string}> = ({id = 'studio'}) => (
  <g>
    <defs>
      <radialGradient id={id} cx="0.5" cy="0.42" r="0.75">
        <stop offset="0" stopColor="#FFFDF6" />
        <stop offset="0.6" stopColor="#E9E4D6" />
        <stop offset="1" stopColor="#C9D7DD" />
      </radialGradient>
    </defs>
    <rect width={1920} height={1080} fill={`url(#${id})`} />
  </g>
);
export const turntable = (pr: Proj, env: Env, angle: number): Item[] => {
  const items: Item[] = cylinder(pr, env, 'tt', {base: [0, 0, 0], r0: 92, r1: 92, h: 8, color: '#2E3B45', cap: '#3A4B57', seg: 48});
  // rotating tick marks on the turntable rim (they show the spin)
  for (let k = 0; k < 12; k++) {
    const a = angle + (k / 12) * Math.PI * 2;
    const p0: V3 = [Math.cos(a) * 80, 8.5, Math.sin(a) * 80], p1: V3 = [Math.cos(a) * 90, 8.5, Math.sin(a) * 90];
    items.push({...line3(pr, 'tk' + k, [p0, p1], C.saffron, 3), z: pr.p([0, 4, 0]).z - 0.5});
  }
  const sh = quad(pr, env, 'ttShadow', circle3([0, 0.2, 0], 150, 40).slice(0, 40), '#000000', {flat: true, stroke: false, opacity: 0.08, smooth: true});
  if (sh) items.push({...sh, z: 1e6});
  return items;
};

// ---------------------------------------------------------------- assembly line (illustrative car plant)
export const LINE_ENV: Env = {light: norm([-0.35, 0.85, 0.4]), ambient: 0.7, ink: '#162A32', lineW: 2.4};
export const lineSet = (pr: Proj, env: Env, t: number): Item[] => {
  const items: Item[] = [];
  const fl = quad(pr, env, 'lnFloor', [[-3000, 0, -1400], [3000, 0, -1400], [3000, 0, 1600], [-3000, 0, 1600]], '#DADDD3', {flat: true, stroke: false});
  if (fl) items.push({...fl, z: 1e6 + 1});
  const wall = quad(pr, env, 'lnWall', [[-3000, 0, -900], [3000, 0, -900], [3000, 900, -900], [-3000, 900, -900]], '#EEE7D3', {flat: true, stroke: false});
  if (wall) items.push({...wall, z: 1e6});
  const band = quad(pr, env, 'lnBand', [[-3000, 300, -899], [3000, 300, -899], [3000, 360, -899], [-3000, 360, -899]], C.blue, {flat: true, stroke: false});
  if (band) items.push({...band, z: 1e6 - 0.5});
  for (const z of [180, 330]) items.push({...line3(pr, 'lnLane' + z, [[-3000, 1, z], [3000, 1, z]], C.saffron, 8), z: 1e6 + 0.5});
  // overhead light rails
  for (let i = -3; i <= 3; i++) items.push(...box(pr, env, 'lamp' + i, {c: [i * 500, 620, -200], size: [260, 14, 40], color: '#F7F3E8', top: '#9AA4AE'}));
  // conveyor
  items.push(...box(pr, env, 'conv', {c: [0, 35, -150], size: [5200, 70, 110], color: '#5E6C7A', top: '#7C8B99'}));
  for (let i = -26; i <= 26; i++) {
    const x = i * 100 - ((t * 40) % 100);
    items.push({...line3(pr, 'roll' + i, [[x, 70.5, -200], [x, 70.5, -100]], '#3F4A55', 3), z: pr.p([x, 70, -150]).z - 1});
  }
  // car body shells riding the line (generic, primer grey, no badges)
  for (let k = -2; k <= 2; k++) items.push(...carBody(pr, env, [k * 700 + ((t * 40) % 700) - 200, 70, -150], 'car' + k));
  return items;
};

export const carBody = (pr: Proj, env: Env, at: V3, key: string): Item[] => {
  const items: Item[] = [];
  items.push(...box(pr, env, key + 'low', {c: add(at, [0, 34, 0]), size: [430, 50, 170], color: '#C9D3DC'}));
  items.push(...box(pr, env, key + 'cab', {c: add(at, [-20, 84, 0]), size: [230, 50, 150], color: '#D7DFE6', front: '#AFC0CF'}));
  // window openings on the near side
  for (const [dx, w] of [[-80, 90], [40, 90]] as [number, number][]) {
    const q = quad(pr, env, key + 'win' + dx, [add(at, [dx - w / 2 - 20, 64, 76]), add(at, [dx + w / 2 - 20, 64, 76]), add(at, [dx + w / 2 - 26, 104, 76]), add(at, [dx - w / 2 - 14, 104, 76])], '#5E6C7A', {flat: true});
    if (q) items.push({...q, z: pr.p(add(at, [0, 60, 0])).z - 90});
  }
  return items;
};

/** A flat sheet-metal panel spanning between two grip points (the hands), height h. */
export const panelBetween = (pr: Proj, env: Env, key: string, a: V3, b: V3, h = 46, color = '#B8C6D4'): Item | null => {
  const up: V3 = [0, 1, 0];
  const pts: V3[] = [add(a, mulS(up, -h / 2)), add(b, mulS(up, -h / 2)), add(b, mulS(up, h / 2)), add(a, mulS(up, h / 2))];
  return quad(pr, env, key, pts, color, {zBias: -4});
};

export const partsRack = (pr: Proj, env: Env, at: V3, panels: number): Item[] => {
  const items: Item[] = [];
  // posts stand on the floor; the panel slots sit at the rack's working height (at[1])
  for (const dx of [-45, 45]) items.push(...box(pr, env, 'rkPost' + dx, {c: [at[0] + dx, (at[1] + 90) / 2, at[2]], size: [8, at[1] + 90, 60], color: '#4F7CC9'}));
  items.push(...box(pr, env, 'rkBase', {c: add(at, [0, 6, 0]), size: [110, 12, 70], color: '#3A5FA0'}));
  items.push(...box(pr, env, 'rkFoot', {c: [at[0], 4, at[2]], size: [110, 8, 70], color: '#3A5FA0'}));
  for (let k = 0; k < panels; k++) {
    const q = quad(pr, env, 'rkPanel' + k, [add(at, [-38, 22, -18 + k * 12]), add(at, [38, 22, -18 + k * 12]), add(at, [38, 72, -18 + k * 12]), add(at, [-38, 72, -18 + k * 12])], '#7F93A8', {solid: true});
    if (q) items.push(q);
  }
  return items;
};

// ---------------------------------------------------------------- shipping crate with fold-up walls
export const crate = (pr: Proj, env: Env, at: V3, fold: number, opts: {lid?: number; yaw?: number; key?: string; swing?: number} = {}): Item[] => {
  // fold 0 = flat walls on the floor, 1 = closed box; lid 0..1 slides on top
  const k = opts.key ?? 'cr';
  const items: Item[] = [];
  const W = 120, D = 110, H = 196;
  const R = rotY(opts.yaw ?? 0);
  const P = (x: number, y: number, z: number): V3 => add(at, mv(R, [x, y, z]));
  items.push(...box(pr, env, k + 'pal', {c: P(0, 6, 0), size: [W + 10, 12, D + 10], yaw: opts.yaw, color: '#B98447'}));
  const ang = (1 - fold) * (Math.PI / 2);
  const wall = (name: string, base0: V3, base1: V3, outward: V3, len: number) => {
    // a wall hinged on the edge base0-base1, rotating about it from flat (outward) to vertical
    const axis = norm(sub(base1, base0));
    const up = mv(rotAxis(axis, ang * Math.sign(cross(axis, [0, 1, 0])[0] * outward[0] + cross(axis, [0, 1, 0])[2] * outward[2] || 1)), [0, 1, 0]);
    const dir = norm(add(mulS([0, 1, 0], Math.cos(ang)), mulS(outward, Math.sin(ang))));
    void up;
    const pts = [base0, base1, add(base1, mulS(dir, len)), add(base0, mulS(dir, len))];
    const q = quad(pr, env, k + name, pts, '#D2A065');
    if (q) items.push(q);
    // plank lines
    for (let i = 1; i < 4; i++) {
      const a = add(lerp3(base0, base1, 0.02), mulS(dir, (len * i) / 4)), b = add(lerp3(base0, base1, 0.98), mulS(dir, (len * i) / 4));
      items.push({...line3(pr, `${k}${name}pl${i}`, [a, b], '#9E6B30', 2), z: (q?.z ?? 0) - 0.2});
    }
  };
  const y0 = 12;
  const sw = clamp01(opts.swing ?? 0);
  if (sw > 0 && fold >= 1) {
    // the front wall as a door hinged on its left vertical edge, swinging out toward the camera
    const phi = sw * 1.85;
    const hx = -W / 2, hz = D / 2;
    const ex = hx + Math.cos(phi) * W, ez = hz + Math.sin(phi) * W;
    const pts = [P(hx, y0, hz), P(ex, y0, ez), P(ex, y0 + H, ez), P(hx, y0 + H, hz)];
    const q = quad(pr, env, k + 'wF', pts, '#D2A065');
    if (q) items.push(q);
    for (let i = 1; i < 4; i++) {
      const a = lerp3(pts[0], pts[3], i / 4), b = lerp3(pts[1], pts[2], i / 4);
      items.push({...line3(pr, `${k}wFpl${i}`, [a, b], '#9E6B30', 2), z: (q?.z ?? 0) - 0.2});
    }
    // inside face of the crate shows as the door opens: a darker back wall behind the robot
  } else wall('wF', P(-W / 2, y0, D / 2), P(W / 2, y0, D / 2), mv(R, [0, 0, 1]), H);
  wall('wB', P(W / 2, y0, -D / 2), P(-W / 2, y0, -D / 2), mv(R, [0, 0, -1]), H);
  wall('wL', P(-W / 2, y0, -D / 2), P(-W / 2, y0, D / 2), mv(R, [-1, 0, 0]), H);
  wall('wR', P(W / 2, y0, D / 2), P(W / 2, y0, -D / 2), mv(R, [1, 0, 0]), H);
  const lid = clamp01(opts.lid ?? 0);
  if (lid > 0) {
    const off = (1 - lid) * 160;
    items.push(...box(pr, env, k + 'lid', {c: P(0, y0 + H + 5 + off * 0.3, 0 - off), size: [W + 8, 10, D + 8], yaw: opts.yaw, color: '#C48E52'}));
  }
  return items;
};

/** Padlock drawn in screen space at a projected point (size in cm at that depth). */
export const Padlock: React.FC<{pr: Proj; at: V3; size?: number; shut: number; drop: number}> = ({pr, at, size = 22, shut, drop}) => {
  const q = pr.p(add(at, [0, (1 - drop) * 60, 0]));
  const s = size * q.s;
  const shackleUp = (1 - shut) * s * 0.35;
  return (
    <g transform={`translate(${q.x} ${q.y})`} opacity={clamp01(drop * 3)}>
      <path d={`M${-s * 0.32} ${-s * 0.1 - shackleUp} V${-s * 0.55 - shackleUp} A${s * 0.32} ${s * 0.32} 0 0 1 ${s * 0.32} ${-s * 0.55 - shackleUp} V${-s * 0.1}`} fill="none" stroke="#5B6670" strokeWidth={s * 0.14} strokeLinecap="round" />
      <rect x={-s * 0.5} y={-s * 0.15} width={s} height={s * 0.8} rx={s * 0.12} fill={C.saffron} stroke={C.ink} strokeWidth={Math.max(2, s * 0.05)} />
      <circle cx={0} cy={s * 0.18} r={s * 0.09} fill={C.ink} />
      <rect x={-s * 0.03} y={s * 0.2} width={s * 0.06} height={s * 0.2} fill={C.ink} />
    </g>
  );
};

/** Roller shutter door in a wall plane at z, between x0..x1, closing from the top (close 0..1). */
export const shutter = (pr: Proj, env: Env, x0: number, x1: number, z: number, h: number, close: number): Item[] => {
  const items: Item[] = [];
  const bottom = h * (1 - close);
  const q = quad(pr, env, 'shut', [[x0, bottom, z], [x1, bottom, z], [x1, h, z], [x0, h, z]], '#9AA4AE', {flat: true});
  if (q) items.push({...q, z: q.z - 5});
  for (let y = bottom + 18; y < h; y += 18) items.push({...line3(pr, 'sl' + y, [[x0, y, z + 1], [x1, y, z + 1]], '#6E7882', 2), z: (q?.z ?? 0) - 5.1});
  items.push(...box(pr, env, 'shutBar', {c: [(x0 + x1) / 2, bottom + 4, z + 2], size: [x1 - x0, 8, 6], color: C.saffron, zBias: 6}));
  return items;
};

// ---------------------------------------------------------------- recycling line (illustrative e-waste sorting)
export const recycleSet = (pr: Proj, env: Env, t: number): Item[] => {
  const items: Item[] = [];
  const fl = quad(pr, env, 'rcFloor', [[-3000, 0, -1200], [3000, 0, -1200], [3000, 0, 1600], [-3000, 0, 1600]], '#D5D8CC', {flat: true, stroke: false});
  if (fl) items.push({...fl, z: 1e6 + 1});
  const wall = quad(pr, env, 'rcWall', [[-3000, 0, -700], [3000, 0, -700], [3000, 800, -700], [-3000, 800, -700]], '#E8E1CC', {flat: true, stroke: false});
  if (wall) items.push({...wall, z: 1e6});
  const band = quad(pr, env, 'rcBand', [[-3000, 260, -699], [3000, 260, -699], [3000, 300, -699], [-3000, 300, -699]], '#4F9A6B', {flat: true, stroke: false});
  if (band) items.push({...band, z: 1e6 - 0.5});
  for (const z of [180, 320]) items.push({...line3(pr, 'rcLane' + z, [[-3000, 1, z], [3000, 1, z]], '#F2C14B', 8), z: 1e6 + 0.6});
  // the belt on legs, with side rails
  items.push(...box(pr, env, 'belt', {c: [-200, 60, 0], size: [1400, 20, 120], color: '#3F4A55', top: '#55616D'}));
  for (const dz of [-64, 64]) items.push(...box(pr, env, 'brail' + dz, {c: [-200, 76, dz], size: [1400, 12, 6], color: '#9AA4AE'}));
  for (const x of [-800, -450, -100, 250]) items.push(...box(pr, env, 'bleg' + x, {c: [x, 25, 0], size: [16, 50, 100], color: '#6E7882'}));
  // overhead magnet separator lifting steel off the belt
  items.push(...box(pr, env, 'magnet', {c: [-120, 190, 0], size: [140, 40, 110], color: '#C94A36', top: '#A83A2C'}));
  for (const dx of [-60, 60]) items.push(line3(pr, 'magC' + dx, [[-120 + dx, 210, 0], [-120 + dx, 420, 0]], '#4A5058', 3));
  // shredder hopper at the end of the belt
  items.push(...box(pr, env, 'shred', {c: [610, 90, 0], size: [200, 180, 200], color: '#4F9A6B', top: '#3F7F57'}));
  const sign = quad(pr, env, 'shredSign', [[512, 110, 101], [708, 110, 101], [708, 150, 101], [512, 150, 101]], C.saffron, {flat: true, solid: true});
  if (sign) items.push(sign);
  // sorting bins along the far side: boards, cables, steel, batteries (kept apart)
  const bins: [number, string][] = [[-700, '#3F8F5A'], [-480, '#E8892B'], [-260, '#7E8A94'], [-40, '#C94A36']];
  bins.forEach(([x, col], k) => {
    items.push(...box(pr, env, 'bin' + k, {c: [x, 45, -260], size: [160, 90, 120], color: '#B9C2C9', top: '#D9DEE4'}));
    const lbl = quad(pr, env, 'binL' + k, [[x - 40, 50, -199], [x + 40, 50, -199], [x + 40, 80, -199], [x - 40, 80, -199]], col, {flat: true, solid: true});
    if (lbl) items.push(lbl);
  });
  // baled metal stacked by the wall
  for (let k = 0; k < 5; k++) items.push(...box(pr, env, 'bale' + k, {c: [900 + (k % 3) * 110, 40 + Math.floor(k / 3) * 80, -520], size: [100, 80, 100], color: '#8C8F94', top: '#A4A8AD'}));
  // old electronics riding the belt: monitors, boards, motors, cable coils (generic shapes)
  for (let i = 0; i < 22; i++) {
    const x = -880 + ((t * 70 + i * 66) % 1450);
    if (x > 560) continue;
    const kind = i % 4;
    const c: V3 = [x, 70, -36 + rnd(i) * 72];
    if (kind === 0) {
      items.push(...box(pr, env, 'ew' + i, {c: add(c, [0, 21, 0]), size: [60, 40, 12], yaw: rnd(i + 9) * 0.6, color: '#2B2E33', front: '#3B4E5E'}));
    } else if (kind === 1) {
      items.push(...box(pr, env, 'ew' + i, {c: add(c, [0, 3, 0]), size: [46, 4, 30], yaw: rnd(i + 9) * 1.2, color: '#3F8F5A'}));
      items.push(...box(pr, env, 'ewc' + i, {c: add(c, [4, 7, 2]), size: [12, 4, 10], yaw: rnd(i + 9) * 1.2, color: '#1E2026'}));
    } else if (kind === 2) {
      items.push(...cylinder(pr, env, 'ew' + i, {base: add(c, [0, 1, 0]), r0: 10, r1: 10, h: 18, color: '#5B6670', cap: '#8F9BA6', seg: 14}));
    } else {
      items.push(tube(pr, env, 'ew' + i, add(c, [-16, 6, -8]), add(c, [16, 6, 8]), 5, '#1E2026', {seg: 8}));
    }
  }
  return items;
};

// ---------------------------------------------------------------- loading dock (the crate leaves from here)
export const dockSet = (pr: Proj, env: Env): Item[] => {
  const items: Item[] = [];
  const fl = quad(pr, env, 'dock', [[-2000, 0, -1200], [2000, 0, -1200], [2000, 0, 1500], [-2000, 0, 1500]], '#C9CCBE', {flat: true, stroke: false});
  if (fl) items.push({...fl, z: 1e6 + 1});
  const W = -400;
  const wall = quad(pr, env, 'dockWall', [[-2000, 0, W], [2000, 0, W], [2000, 700, W], [-2000, 700, W]], '#D9E4EE', {flat: true, stroke: false});
  if (wall) items.push({...wall, z: 1e6});
  // three dock doors: the middle one open onto a trailer, the others shut; bumpers and yellow guide lines
  for (const [k, x] of [[0, -520], [1, 0], [2, 520]] as [number, number][]) {
    if (k === 1) {
      const hole = quad(pr, env, 'dkHole', [[x - 150, 40, W + 1], [x + 150, 40, W + 1], [x + 150, 330, W + 1], [x - 150, 330, W + 1]], '#2B2F35', {flat: true, stroke: false});
      if (hole) items.push({...hole, z: 1e6 - 1});
      for (let j = 0; j < 3; j++) {
        const q = quad(pr, env, 'dkLoad' + j, [[x - 120 + j * 82, 40, W + 2], [x - 50 + j * 82, 40, W + 2], [x - 50 + j * 82, 120 + (j % 2) * 40, W + 2], [x - 120 + j * 82, 120 + (j % 2) * 40, W + 2]], '#8E6232', {flat: true});
        if (q) items.push({...q, z: 1e6 - 1.5});
      }
    } else {
      const sh = quad(pr, env, 'dkShut' + k, [[x - 150, 40, W + 1], [x + 150, 40, W + 1], [x + 150, 330, W + 1], [x - 150, 330, W + 1]], '#9AA4AE', {flat: true});
      if (sh) items.push({...sh, z: 1e6 - 1});
      for (let y = 58; y < 330; y += 18) items.push({...line3(pr, `dkSl${k}${y}`, [[x - 150, y, W + 2], [x + 150, y, W + 2]], '#6E7882', 2), z: 1e6 - 1.2});
    }
    const lv = quad(pr, env, 'dkLev' + k, [[x - 150, 40, W + 2], [x + 150, 40, W + 2], [x + 150, 40, W + 60], [x - 150, 40, W + 60]], '#5E6C7A', {flat: true, solid: true});
    if (lv) items.push(lv);
    items.push(...box(pr, env, 'dkStep' + k, {c: [x, 20, W + 30], size: [300, 40, 60], color: '#4A5058'}));
    for (const dx of [-170, 170]) items.push(...box(pr, env, `dkBump${k}${dx}`, {c: [x + dx, 60, W + 10], size: [24, 50, 20], color: '#1E2026'}));
    items.push(...cylinder(pr, env, 'dkBol' + k, {base: [x - 200, 0, W + 140], r0: 9, r1: 9, h: 110, color: C.saffron, cap: '#E3A520', seg: 14}));
    items.push({...line3(pr, 'dkLine' + k, [[x - 150, 1, W + 60], [x - 150, 1, 600]], '#F2C14B', 6), z: 1e6 + 0.6});
  }
  // pallets stacked by the wall and an overhead crane beam
  for (let k = 0; k < 4; k++) items.push(...box(pr, env, 'dkPal' + k, {c: [880, 7 + k * 15, -250], size: [120, 12, 100], color: '#B98447'}));
  items.push(...box(pr, env, 'dkBeam', {c: [0, 690, 0], size: [3000, 30, 40], color: C.saffron, side: '#C9921E'}));
  return items;
};

// ---------------------------------------------------------------- film lights (for the foundry "film crew" reveal)
export const filmLights = (pr: Proj, env: Env, on: number): Item[] => {
  const items: Item[] = [];
  const rigs: V3[] = [[420, 0, 520], [-560, 0, 620], [700, 0, -380]];
  rigs.forEach((b, k) => {
    for (const a of [0, 2.1, 4.2]) items.push(tube(pr, env, `fl${k}leg${a}`, add(b, [Math.cos(a) * 60, 0, Math.sin(a) * 60]), add(b, [0, 220, 0]), 3, '#2B2E33', {seg: 8}));
    items.push(tube(pr, env, `fl${k}mast`, add(b, [0, 220, 0]), add(b, [0, 380, 0]), 4, '#2B2E33', {seg: 8}));
    items.push(...box(pr, env, `fl${k}head`, {c: add(b, [0, 400, 0]), size: [90, 70, 50], yaw: Math.atan2(-b[0], -b[2]), color: '#24262B'}));
    if (on > 0) {
      const lens = pr.p(add(b, [-Math.sign(b[0]) * 20, 400, -Math.sign(b[2]) * 20]));
      items.push({z: lens.z - 30, key: `fl${k}lens`, el: <circle key={`fl${k}lens`} cx={lens.x} cy={lens.y} r={Math.max(4, 30 * lens.s)} fill="#FFF6D8" opacity={on} />});
    }
  });
  return items;
};

export {hull, polyClosed, smoothClosed, F};

// ---------------------------------------------------------------- rehearsal building + giant airbag (illustrative, not Figure's campus)
export const AIR_ENV: Env = {light: norm([-0.5, 0.8, 0.45]), ambient: 0.72, ink: '#162A32', lineW: 2.4};
export const AIRBAG = {floor2: 380, ledgeX: -130, bag: [90, 0, 0] as V3, bagSize: [520, 170, 420] as V3};
export const airbagSet = (pr: Proj, env: Env, squash: number): Item[] => {
  const items: Item[] = [];
  const fl = quad(pr, env, 'abGround', [[-3000, 0, -1400], [3000, 0, -1400], [3000, 0, 1800], [-3000, 0, 1800]], '#C9D2C4', {flat: true, stroke: false});
  if (fl) items.push({...fl, z: 1e6 + 1});
  // building: two storeys, an open second-floor bay the robot jumps from
  items.push(...box(pr, env, 'bld', {c: [-620, 450, 0], size: [800, 900, 900], color: '#E3DCCB', front: '#D6CDB8', side: '#EAE3D3'}));
  // a balcony slab projecting from the second floor (the launch ledge), with side rails
  items.push(...box(pr, env, 'slab', {c: [-175, AIRBAG.floor2 - 12, 0], size: [90, 24, 420], color: '#B8B0A0'}));
  for (const z of [-205, 205]) items.push(...box(pr, env, 'brail' + z, {c: [-175, AIRBAG.floor2 + 50, z], size: [90, 100, 6], color: '#9AA4AE'}));
  const bay = quad(pr, env, 'bay', [[-221, AIRBAG.floor2, -190], [-221, AIRBAG.floor2, 190], [-221, AIRBAG.floor2 + 300, 190], [-221, AIRBAG.floor2 + 300, -190]], '#8A919B', {flat: true});
  if (bay) items.push({...bay, z: bay.z + 5});
  // window grid on the facade, a door on the ground floor, a downpipe
  for (const y of [100, 680]) for (const z of [-380, -300, 260, 340]) {
    const w = quad(pr, env, `win${y}_${z}`, [[-219, y, z - 34], [-219, y, z + 34], [-219, y + 130, z + 34], [-219, y + 130, z - 34]], '#BFD7F2', {flat: true, solid: true});
    if (w) items.push(w);
  }
  const door = quad(pr, env, 'door', [[-219, 0, -60], [-219, 0, 60], [-219, 230, 60], [-219, 230, -60]], '#5E6C7A', {flat: true, solid: true});
  if (door) items.push(door);
  items.push(tube(pr, env, 'pipe', [-216, 0, 440], [-216, 880, 440], 6, '#9AA4AE', {seg: 8}));
  // the test area: a low fence, cones and a crew tent beside the bag
  for (let k = 0; k < 9; k++) items.push(...box(pr, env, 'fenceP' + k, {c: [-200 + k * 110, 50, 620], size: [6, 100, 6], color: '#E8892B'}));
  items.push(...box(pr, env, 'fenceR', {c: [240, 92, 620], size: [880, 6, 4], color: '#E8892B'}));
  for (const [x, z] of [[420, 360], [460, -340], [-60, 420]] as [number, number][]) items.push(...cylinder(pr, env, `cone${x}${z}`, {base: [x, 0, z], r0: 14, r1: 3, h: 42, color: '#F07A22', cap: '#FFFFFF', seg: 12}));
  items.push(...box(pr, env, 'tent', {c: [720, 110, -420], size: [260, 8, 220], color: '#4F7CC9'}));
  for (const [dx, dz] of [[-120, -100], [120, -100], [-120, 100], [120, 100]]) items.push(...box(pr, env, `tentP${dx}${dz}`, {c: [720 + dx, 55, -420 + dz], size: [6, 110, 6], color: '#9AA4AE'}));
  // the airbag: a squat inflated block; it compresses on impact and bulges at the sides
  const [bx, , bz] = AIRBAG.bag;
  const [W, H, D] = AIRBAG.bagSize;
  const h = H * (1 - 0.42 * squash), w = W * (1 + 0.08 * squash), d = D * (1 + 0.08 * squash);
  items.push(...box(pr, env, 'bag', {c: [bx, h / 2, bz], size: [w, h, d], color: '#EF6B55', top: '#F58A73', side: '#D9553F'}));
  for (const k of [-1, 0, 1]) items.push({...line3(pr, 'bagSeam' + k, [[bx - w / 2, h + 0.5, bz + k * d / 3.2], [bx + w / 2, h + 0.5, bz + k * d / 3.2]], '#C94A36', 3), z: pr.p([bx, h, bz]).z - 1});
  for (const k of [-1, 1]) items.push({...line3(pr, 'bagSeamX' + k, [[bx + k * w / 4, h + 0.5, bz - d / 2], [bx + k * w / 4, h + 0.5, bz + d / 2]], '#C94A36', 3), z: pr.p([bx, h, bz]).z - 1});
  // blowers with ducts into the bag
  for (const dz of [120, -120]) {
    items.push(...box(pr, env, 'fan' + dz, {c: [bx + w / 2 + 80, 50, bz + dz], size: [90, 100, 90], color: '#FFC744'}));
    items.push(tube(pr, env, 'duct' + dz, [bx + w / 2 + 35, 40, bz + dz], [bx + w / 2 - 4, 40, bz + dz], 22, '#2B2F35', {seg: 12}));
  }
  return items;
};
