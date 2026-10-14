// SET-WORKSHOP: the channel's light palette. A maintenance bay with a robot stand, workbench, pegboard,
// shipping crate, scrap bin and a back rack of retired robots. Illustrative; not Figure's facility.
import React from 'react';
import {Proj} from '../engine/camera';
import {V3, add, norm, rnd} from '../engine/math';
import {Env, Item, box, circle3, cylinder, line3, quad, tube} from '../engine/prims';
import {polyClosed} from '../engine/draw';
import {C} from '../../theme';

export const WORKSHOP_ENV: Env = {light: norm([-0.45, 0.8, 0.5]), ambient: 0.72, ink: '#162A32', lineW: 2.6};

export const WS = {
  stand: [-180, 0, -120] as V3,      // maintenance stand platform centre (top at y = 14)
  standTop: 14,
  bench: [300, 0, -300] as V3,
  crate: [640, 0, -60] as V3,
  bin: [-640, 0, 120] as V3,
  wallZ: -620,
};

const COL = {
  floor: '#D7D9CC', floorLine: '#F2C14B', wall: '#F4ECD6', dado: '#A9DDD6', trim: '#162A32',
  standBase: '#4F7CC9', post: '#E9E4D6', wood: '#C9924F', woodDark: '#9E6B30', steel: '#9AA4AE', steelDark: '#6E7882',
  peg: '#E7DCC0', bin: '#7E8A94', binRim: '#B9C2C9',
};

export const workshopBack = (pr: Proj, env: Env, t: number): Item[] => {
  const items: Item[] = [];
  const W = WS.wallZ;
  const fl = quad(pr, env, 'wsFloor', [[-2400, 0, -620], [2400, 0, -620], [2400, 0, 1800], [-2400, 0, 1800]], COL.floor, {flat: true, stroke: false});
  if (fl) items.push({...fl, z: 1e6 + 1});
  for (let i = -6; i <= 6; i++) {
    items.push({...line3(pr, 'tile' + i, [[i * 200, 0.5, -620], [i * 200, 0.5, 1800]], '#C9CCBE', 2), z: 1e6 + 0.8});
  }
  items.push({...line3(pr, 'ylane1', [[-1400, 1, 260], [1400, 1, 260]], COL.floorLine, 9), z: 1e6 + 0.6});
  items.push({...line3(pr, 'ylane2', [[-1400, 1, 420], [1400, 1, 420]], COL.floorLine, 9), z: 1e6 + 0.6});
  // back wall: paper with a teal dado and a dark trim line
  const wall = quad(pr, env, 'wsWall', [[-2400, 0, W], [2400, 0, W], [2400, 900, W], [-2400, 900, W]], COL.wall, {flat: true, stroke: false});
  if (wall) items.push({...wall, z: 1e6});
  const dado = quad(pr, env, 'wsDado', [[-2400, 0, W + 1], [2400, 0, W + 1], [2400, 120, W + 1], [-2400, 120, W + 1]], COL.dado, {flat: true, stroke: false});
  if (dado) items.push({...dado, z: 1e6 - 0.5});
  items.push({...line3(pr, 'wsTrim', [[-2400, 120, W + 2], [2400, 120, W + 2]], COL.trim, 4), z: 1e6 - 0.6});
  // high windows
  for (let i = -3; i <= 3; i++) {
    const x = i * 420;
    const wq = quad(pr, env, 'wsWin' + i, [[x - 150, 560, W + 2], [x + 150, 560, W + 2], [x + 150, 760, W + 2], [x - 150, 760, W + 2]], '#CFE3F7', {flat: true});
    if (wq) items.push({...wq, z: 1e6 - 1});
    items.push({...line3(pr, 'wsWinM' + i, [[x, 560, W + 3], [x, 760, W + 3]], COL.trim, 3), z: 1e6 - 1.2});
  }
  // pegboard with tool silhouettes above the bench
  const pb = quad(pr, env, 'peg', [[130, 150, W + 2], [470, 150, W + 2], [470, 340, W + 2], [130, 340, W + 2]], COL.peg, {flat: true});
  if (pb) items.push({...pb, z: 1e6 - 1});
  const tools: [number, number, number, number, string][] = [[170, 300, 40, 8, C.coral], [230, 250, 10, 70, C.ink], [290, 260, 46, 10, C.blue], [360, 230, 12, 90, C.inkSoft], [420, 290, 34, 34, C.saffron]];
  tools.forEach(([x, y, w, h, col], k) => {
    const q = quad(pr, env, 'tool' + k, [[x, y, W + 3], [x + w, y, W + 3], [x + w, y + h, W + 3], [x, y + h, W + 3]], col, {flat: true});
    if (q) items.push({...q, z: 1e6 - 2});
  });
  // back rack: three stands where retired robots wait
  for (let k = 0; k < 3; k++) items.push(...box(pr, env, 'rack' + k, {c: [-1050 + k * 170, 6, W + 90], size: [120, 12, 90], color: COL.standBase}));
  void t;
  return items;
};

/** Maintenance stand: platform, two posts and a top beam with a slack tether strap. */
export const stand = (pr: Proj, env: Env): Item[] => {
  const [x, , z] = WS.stand;
  const items: Item[] = [];
  items.push(...box(pr, env, 'stBase', {c: [x, 7, z], size: [150, 14, 130], color: COL.standBase}));
  for (const dx of [-82, 82]) items.push(...box(pr, env, 'stPost' + dx, {c: [x + dx, 125, z - 50], size: [14, 250, 14], color: COL.post}));
  items.push(...box(pr, env, 'stBeam', {c: [x, 254, z - 50], size: [190, 16, 16], color: COL.post}));
  items.push(line3(pr, 'tether', [[x, 246, z - 50], [x + 3, 210, z - 30], [x, 182, z - 12]], '#E9A91C', 4, {smooth: true}));
  return items;
};

export const workbench = (pr: Proj, env: Env, opts: {partsOn?: boolean} = {}): Item[] => {
  const [x, , z] = WS.bench;
  const items: Item[] = [];
  items.push(...box(pr, env, 'bTop', {c: [x, 92, z], size: [240, 8, 90], color: COL.wood, side: COL.woodDark}));
  for (const [dx, dz] of [[-110, -38], [110, -38], [-110, 38], [110, 38]]) items.push(...box(pr, env, `bLeg${dx}${dz}`, {c: [x + dx, 44, z + dz], size: [8, 88, 8], color: COL.steelDark}));
  items.push(...box(pr, env, 'bShelf', {c: [x, 24, z], size: [228, 5, 80], color: COL.woodDark}));
  if (opts.partsOn !== false) {
    // actuator housings and a battery pack waiting on the bench
    items.push(...cylinder(pr, env, 'act1', {base: [x - 70, 96, z - 6], r0: 9, r1: 9, h: 14, color: '#5B6670', cap: '#8F9BA6', seg: 20}));
    items.push(...cylinder(pr, env, 'act2', {base: [x - 40, 96, z + 14], r0: 7, r1: 7, h: 11, color: '#5B6670', cap: '#8F9BA6', seg: 18}));
    items.push(...box(pr, env, 'batt', {c: [x + 50, 104, z - 4], size: [46, 16, 30], color: '#2C333A'}));
    items.push(...box(pr, env, 'lamp', {c: [x + 100, 135, z - 30], size: [10, 80, 10], color: C.coral}));
  }
  return items;
};

/** Open-top scrap bin (its rim is a match-cut shape for the ladle). */
export const scrapBin = (pr: Proj, env: Env): Item[] => {
  const [x, , z] = WS.bin;
  const items = cylinder(pr, env, 'bin', {base: [x, 0, z], r0: 62, r1: 70, h: 96, color: COL.bin, cap: false, seg: 36});
  const rim = circle3([x, 96, z], 70, 40).slice(0, 40).map((q) => pr.p(q));
  const inner = circle3([x, 96, z], 64, 40).slice(0, 40).map((q) => pr.p(q));
  const zc = pr.p([x, 50, z]).z;
  items.push({z: zc - 1, key: 'binRim', el: <path key="binRim" d={polyClosed(rim) + polyClosed(inner)} fillRule="evenodd" fill={COL.binRim} stroke={env.ink} strokeWidth={env.lineW} />});
  items.push({z: zc - 0.5, key: 'binIn', el: <path key="binIn" d={polyClosed(inner)} fill="#56606A" stroke={env.ink} strokeWidth={1.5} />});
  // scrap: a few bent offcuts
  for (let k = 0; k < 4; k++) {
    const a = rnd(k + 3) * 6.28;
    const p0: V3 = [x + Math.cos(a) * 30, 92, z + Math.sin(a) * 30];
    items.push({...line3(pr, 'scrap' + k, [p0, add(p0, [18, 12, -8])], '#9AA4AE', 8), z: zc - 0.7});
  }
  return items;
};

export {COL as WS_COL, tube};
