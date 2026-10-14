// SET-LINE (V3): an illustrative body-shop loading cell (generic; no carmaker branding, not a reconstruction of any
// plant). Near: the loading station with its parts rack. Action: a car body on a stopped skid, a station frame with
// pneumatic clamps that close on a placed panel, a stack light and an HMI. Deep: a guard fence and further stations
// with industrial arms, overhead trusses and light rows.
import React from 'react';
import {Proj} from '../engine/camera';
import {V3, add, norm, mix, clamp01} from '../engine/math';
import {Env, Item, box, cylinder, line3, quad, tube} from '../engine/prims';
import {C} from '../../theme';

export const CELL_ENV: Env = {light: norm([-0.35, 0.85, 0.4]), ambient: 0.7, ink: '#162A32', lineW: 2.4};
export const CELL = {carZ: -150, carSide: -64, frameZ: -290, clampZ: -76, fenceZ: -440, stationX: [0, -760, -1520, 760, 1520]};
const COL = {floor: '#D6D9CF', wall: '#E9E3D0', band: '#4F7CC9', lane: '#F2C14B', rail: '#5E6C7A', frame: '#3A5FA0', post: '#F2B632', mesh: '#8A949E',
  car: '#C9D3DC', carTop: '#D7DFE6', glass: '#5E6C7A', arm: '#E8892B', armDark: '#B9661C', truss: '#9AA4AE'};

/** Generic body-in-white shell on its skid. */
export const carShell = (pr: Proj, env: Env, at: V3, key: string): Item[] => {
  const items: Item[] = [];
  items.push(...box(pr, env, key + 'skid', {c: add(at, [0, -6, 0]), size: [470, 10, 150], color: '#4A5058'}));
  items.push(...box(pr, env, key + 'low', {c: add(at, [0, 32, 0]), size: [430, 52, 170], color: COL.car}));
  items.push(...box(pr, env, key + 'cab', {c: add(at, [-20, 82, 0]), size: [230, 48, 150], color: COL.carTop, front: '#AFC0CF'}));
  // window openings and wheel arches on the near side (+z)
  const zs = 85.5;
  for (const [dx, w] of [[-82, 88], [36, 88]] as [number, number][]) {
    const q = quad(pr, env, key + 'win' + dx, [add(at, [dx - w / 2 - 20, 62, zs - 9]), add(at, [dx + w / 2 - 20, 62, zs - 9]), add(at, [dx + w / 2 - 26, 100, zs - 9]), add(at, [dx - w / 2 - 14, 100, zs - 9])], COL.glass, {flat: true, solid: true});
    if (q) items.push(q);
  }
  for (const dx of [-140, 140]) {
    const pts: V3[] = [];
    for (let k = 0; k <= 10; k++) {
      const a = Math.PI * (k / 10);
      pts.push(add(at, [dx + Math.cos(a) * 38, 6 + Math.sin(a) * 34, zs + 0.5]));
    }
    const q = quad(pr, env, key + 'arch' + dx, pts, '#2E353C', {flat: true, stroke: false, solid: true});
    if (q) items.push(q);
  }
  return items;
};

/** Orange six-axis-style industrial arm (simplified: base, shoulder, upper arm, forearm, tool). */
export const industrialArm = (pr: Proj, env: Env, base: V3, key: string, a: {yaw: number; sh: number; el: number}): Item[] => {
  const items: Item[] = [];
  items.push(...cylinder(pr, env, key + 'b', {base, r0: 34, r1: 30, h: 40, color: COL.armDark, cap: COL.arm, seg: 20}));
  const sh = add(base, [0, 70, 0]);
  items.push(...box(pr, env, key + 'tw', {c: add(base, [0, 55, 0]), size: [56, 30, 56], yaw: a.yaw, color: COL.arm}));
  const dir: V3 = [Math.sin(a.yaw), 0, Math.cos(a.yaw)];
  const elb: V3 = add(sh, [dir[0] * Math.sin(a.sh) * 120, Math.cos(a.sh) * 120, dir[2] * Math.sin(a.sh) * 120]);
  const wr: V3 = add(elb, [dir[0] * Math.sin(a.sh + a.el) * 100, Math.cos(a.sh + a.el) * 100, dir[2] * Math.sin(a.sh + a.el) * 100]);
  items.push(tube(pr, env, key + 'ua', sh, elb, 13, COL.arm, {seg: 10}));
  items.push(tube(pr, env, key + 'fa', elb, wr, 10, COL.arm, {seg: 10}));
  items.push(tube(pr, env, key + 'tool', wr, add(wr, [0, -26, 0]), 6, '#4A5058', {seg: 8}));
  return items;
};

/** Stack light (red / amber / green) on a pole; `state` lights one lamp. */
const stackLight = (pr: Proj, env: Env, at: V3, state: 'red' | 'amber' | 'green', key: string): Item[] => {
  const items: Item[] = [];
  items.push(tube(pr, env, key + 'pole', at, add(at, [0, 30, 0]), 2, '#4A5058', {seg: 8}));
  const lamps: ['red' | 'amber' | 'green', string, string][] = [['green', '#2E8B57', '#7CF2A8'], ['amber', '#B07A12', '#FFD45A'], ['red', '#9E2F22', '#FF7A66']];
  lamps.forEach(([name, off, on], k) => {
    const lit = name === state;
    items.push(...cylinder(pr, env, `${key}${name}`, {base: add(at, [0, 30 + k * 11, 0]), r0: 7, r1: 7, h: 10, color: lit ? on : off, cap: lit ? on : off, seg: 14}));
    if (lit) {
      const q = pr.p(add(at, [0, 35 + k * 11, 0]));
      const r = 26 * q.s;
      items.push({z: q.z - 3, key: `${key}glow`, el: (
        <g key={`${key}glow`}>
          <defs><radialGradient id={`${key}glowG`}><stop offset="0" stopColor={on} stopOpacity={0.55} /><stop offset="1" stopColor={on} stopOpacity={0} /></radialGradient></defs>
          <circle cx={q.x} cy={q.y} r={r} fill={`url(#${key}glowG)`} />
        </g>
      )});
    }
  });
  return items;
};

export type CellState = {stack: 'red' | 'amber' | 'green'; clamp: number; hmi: number; armT: number};

/** The cell around station x0 (the hero station has the frame, clamps, stack light and HMI). */
export const cellSet = (pr: Proj, env: Env, t: number, st: CellState): Item[] => {
  const items: Item[] = [];
  const fl = quad(pr, env, 'ceFloor', [[-3200, 0, -1400], [3200, 0, -1400], [3200, 0, 1600], [-3200, 0, 1600]], COL.floor, {flat: true, stroke: false});
  if (fl) items.push({...fl, z: 1e6 + 1});
  for (let i = -10; i <= 10; i++) items.push({...line3(pr, 'ceJ' + i, [[i * 320, 0.5, -1400], [i * 320, 0.5, 1600]], '#C6C9BE', 1.5), z: 1e6 + 0.8});
  const wall = quad(pr, env, 'ceWall', [[-3200, 0, -1100], [3200, 0, -1100], [3200, 1000, -1100], [-3200, 1000, -1100]], COL.wall, {flat: true, stroke: false});
  if (wall) items.push({...wall, z: 1e6});
  const band = quad(pr, env, 'ceBand', [[-3200, 300, -1099], [3200, 300, -1099], [3200, 350, -1099], [-3200, 350, -1099]], COL.band, {flat: true, stroke: false});
  if (band) items.push({...band, z: 1e6 - 0.5});
  for (let i = -6; i <= 6; i++) {
    const w = quad(pr, env, 'ceWin' + i, [[i * 480 - 160, 620, -1098], [i * 480 + 160, 620, -1098], [i * 480 + 160, 820, -1098], [i * 480 - 160, 820, -1098]], '#CFE3F7', {flat: true});
    if (w) items.push({...w, z: 1e6 - 1});
  }
  // walkway lanes and the taped loading zone in front of the hero station
  for (const z of [200, 340]) items.push({...line3(pr, 'ceLane' + z, [[-3200, 1, z], [3200, 1, z]], COL.lane, 8), z: 1e6 + 0.6});
  items.push({...line3(pr, 'ceZone', [[-130, 1, -40], [190, 1, -40], [190, 1, 120], [-130, 1, 120], [-130, 1, -40]], C.blue, 5), z: 1e6 + 0.6});
  // overhead trusses with light rows
  for (const z of [-520, 60]) {
    items.push(...box(pr, env, 'ceTr' + z, {c: [0, 640, z], size: [6400, 16, 30], color: COL.truss}));
    for (let i = -6; i <= 6; i++) {
      items.push(...box(pr, env, `ceL${z}_${i}`, {c: [i * 480, 624, z], size: [240, 10, 26], color: '#F7F3E8', top: '#BFC6CC'}));
      const pool = quad(pr, env, `cePool${z}_${i}`, [[i * 480 - 150, 0.6, z - 60], [i * 480 + 150, 0.6, z - 60], [i * 480 + 150, 0.6, z + 120], [i * 480 - 150, 0.6, z + 120]], '#FFFFFF', {flat: true, stroke: false, opacity: 0.12, smooth: true});
      if (pool) items.push({...pool, z: 1e6 + 0.7});
    }
  }
  // skid conveyor: two rails on legs with rollers
  for (const dz of [-55, 55]) {
    items.push(...box(pr, env, 'ceRail' + dz, {c: [0, 52, CELL.carZ + dz], size: [6400, 14, 10], color: COL.rail}));
    for (let i = -10; i <= 10; i++) items.push(...box(pr, env, `ceRL${dz}_${i}`, {c: [i * 320 + 40, 23, CELL.carZ + dz], size: [10, 46, 10], color: '#4A5058'}));
  }
  // guard fence behind the line
  for (let i = -12; i <= 12; i++) {
    const x = i * 260;
    items.push(...box(pr, env, 'ceFP' + i, {c: [x, 110, CELL.fenceZ], size: [8, 220, 8], color: COL.post}));
    if (i < 12) {
      const m = quad(pr, env, 'ceFM' + i, [[x + 4, 12, CELL.fenceZ], [x + 256, 12, CELL.fenceZ], [x + 256, 212, CELL.fenceZ], [x + 4, 212, CELL.fenceZ]], COL.mesh, {flat: true, opacity: 0.18, stroke: false});
      if (m) items.push(m);
      for (let k = 1; k < 6; k++) items.push(line3(pr, `ceFL${i}_${k}`, [[x + 4 + k * 42, 12, CELL.fenceZ + 0.5], [x + 4 + k * 42, 212, CELL.fenceZ + 0.5]], COL.mesh, 1.2, {opacity: 0.5, plane: [0, 0, 1]}));
      items.push(line3(pr, `ceFT${i}`, [[x + 4, 212, CELL.fenceZ + 0.5], [x + 256, 212, CELL.fenceZ + 0.5]], COL.post, 4, {plane: [0, 0, 1]}));
    }
  }
  // further stations: car shells and industrial arms behind the fence line
  CELL.stationX.forEach((x, k) => {
    items.push(...carShell(pr, env, [x, 64, CELL.carZ], 'car' + k));
    if (k > 0) {
      const ph = t * 1.3 + k * 1.7;
      items.push(...industrialArm(pr, env, [x + 120, 0, CELL.carZ - 200], 'arm' + k, {yaw: Math.PI + 0.5 * Math.sin(ph), sh: 0.7 + 0.25 * Math.sin(ph * 1.3), el: 1.2 + 0.3 * Math.cos(ph)}));
    }
  });
  // hero station frame (x = 0): side posts, cantilevers, a front beam with the clamps, stack light and HMI
  for (const sx of [-250, 250]) {
    items.push(...box(pr, env, 'ceSP' + sx, {c: [sx, 170, CELL.frameZ], size: [16, 340, 16], color: COL.frame}));
    items.push(...box(pr, env, 'ceCa' + sx, {c: [sx, 332, (CELL.frameZ + CELL.clampZ) / 2], size: [14, 14, CELL.clampZ - CELL.frameZ + 14], color: COL.frame}));
  }
  items.push(...box(pr, env, 'ceBeam', {c: [0, 332, CELL.clampZ], size: [514, 16, 14], color: COL.frame}));
  items.push(...box(pr, env, 'ceBeamB', {c: [0, 332, CELL.frameZ], size: [514, 16, 14], color: COL.frame}));
  // festoon cable along the front beam
  items.push(line3(pr, 'ceFest', [[-240, 322, CELL.clampZ + 8], [-140, 300, CELL.clampZ + 8], [-40, 322, CELL.clampZ + 8], [60, 300, CELL.clampZ + 8], [160, 322, CELL.clampZ + 8], [240, 306, CELL.clampZ + 8]], '#2B2F35', 3, {smooth: true}));
  // clamps: drop posts with arms that swing down onto the panel's top edge
  for (const cx of [-34, 32]) {
    const piv: V3 = [cx, 176, CELL.clampZ];
    items.push(...box(pr, env, 'ceDrop' + cx, {c: [cx, 254, CELL.clampZ], size: [10, 156, 10], color: '#4A5058'}));
    items.push(...box(pr, env, 'ceCyl' + cx, {c: [cx, 214, CELL.clampZ - 9], size: [12, 50, 12], color: '#9AA4AE'}));
    const a = mix(-1.25, 0.05, clamp01(st.clamp));        // swing angle (rad): back-and-up when open, down when closed
    const end: V3 = add(piv, [0, -Math.cos(a) * 46, Math.sin(a) * 46 + 12 * clamp01(st.clamp)]);
    items.push(tube(pr, env, 'ceArm' + cx, piv, end, 3.5, C.saffron, {seg: 8}));
    items.push(...box(pr, env, 'cePad' + cx, {c: end, size: [12, 6, 8], color: '#2B2F35'}));
  }
  items.push(...stackLight(pr, env, [-250, 340, CELL.frameZ], st.stack, 'ceStack'));
  // HMI on the right post, facing the loading zone
  items.push(...box(pr, env, 'ceHmi', {c: [262, 170, CELL.frameZ + 14], size: [80, 60, 8], color: '#2B2F35', front: '#33424F'}));
  const sq = quad(pr, env, 'ceHmiS', [[228, 146, CELL.frameZ + 18.5], [296, 146, CELL.frameZ + 18.5], [296, 194, CELL.frameZ + 18.5], [228, 194, CELL.frameZ + 18.5]], st.stack === 'green' ? '#2E8B57' : '#B07A12', {flat: true, solid: true});
  if (sq) items.push(sq);
  const bar = quad(pr, env, 'ceHmiB', [[234, 152, CELL.frameZ + 19], [234 + 56 * clamp01(st.hmi), 152, CELL.frameZ + 19], [234 + 56 * clamp01(st.hmi), 160, CELL.frameZ + 19], [234, 160, CELL.frameZ + 19]], '#F4F6F7', {flat: true, stroke: false, solid: true});
  if (bar) items.push(bar);
  void st.hmi; void st.armT;
  return items;
};
