// SET-WORKSHOP (V3): the product / maintenance bay in the channel's light palette. Staged in three planes:
//   near   tool cart, parts shelf (placed per shot)
//   action maintenance stand with charging reel, workbench with a fixture holding an actuator, shipping crate
//   deep   wall panels with an illustrative company sign (the Figure symbol), a glass partition and a background
//          assembly bay with a robot on a lift; LED fixture rows overhead with light pools on the floor
// Illustrative; not a reconstruction of Figure's facility. Key positions (WS) are unchanged from V2 so staging holds.
import React from 'react';
import {Proj} from '../engine/camera';
import {V3, add, norm, rnd} from '../engine/math';
import {Env, Item, box, circle3, cylinder, line3, quad, tube, planeGeo, bbOf} from '../engine/prims';
import {polyClosed} from '../engine/draw';
import {SYMBOL_POLY} from '../brand/figureSymbol';
import {C} from '../../theme';

export const WORKSHOP_ENV: Env = {light: norm([-0.45, 0.8, 0.5]), ambient: 0.72, ink: '#162A32', lineW: 2.6};

export const WS = {
  stand: [-180, 0, -120] as V3,      // maintenance stand platform centre (top at y = 14)
  standTop: 14,
  bench: [300, 0, -300] as V3,
  crate: [640, 0, -60] as V3,
  bin: [-640, 0, 120] as V3,
  wallZ: -620,
  sign: [-10, 340, -620] as V3,      // centre of the company sign on the back wall, beside the stand
  bay: [-980, 0, -420] as V3,        // background assembly bay (behind the glass partition)
};

const COL = {
  floor: '#D9DBD0', joint: '#C3C6B9', floorLine: '#F2C14B', cell: '#4F7CC9', wall: '#EFE7D2', panel: '#E5DCC4', dado: '#A9DDD6', trim: '#162A32',
  standBase: '#4F7CC9', post: '#E9E4D6', wood: '#C9924F', woodDark: '#9E6B30', steel: '#9AA4AE', steelDark: '#6E7882',
  peg: '#E7DCC0', bin: '#7E8A94', binRim: '#B9C2C9', signBg: '#1B1F24', signRim: '#3A414A', glass: '#CFE6EE', cart: '#D9534A', cartDark: '#A83A33',
};

/** Symbol on a flat wall (normal +z): polygon in world space, height h centred on c. Never mirrored (+x stays +x). */
export const symbolOnWall = (pr: Proj, key: string, c: V3, h: number, fill: string, z?: number): Item => {
  const pts = SYMBOL_POLY.map(([sx, sy]) => pr.p([c[0] + sx * h, c[1] + sy * h, c[2]]));
  return {z: z ?? pr.p(c).z - 2, key, el: <path key={key} d={polyClosed(pts)} fill={fill} />};
};

/** Illustrative company sign: a dark backlit panel carrying the Figure symbol (white). */
export const figureSign = (pr: Proj, env: Env, c: V3, h: number, glow = 1): Item[] => {
  const w = h * 0.62, items: Item[] = [];
  const zf = c[2] + 6;
  const panel = quad(pr, env, 'signP', [[c[0] - w / 2, c[1] - h / 2, zf], [c[0] + w / 2, c[1] - h / 2, zf], [c[0] + w / 2, c[1] + h / 2, zf], [c[0] - w / 2, c[1] + h / 2, zf]], COL.signBg, {flat: true});
  if (panel) items.push({...panel, z: panel.z - 1});
  items.push(...box(pr, env, 'signRim', {c: [c[0], c[1], c[2] + 3], size: [w + 12, h + 12, 6], color: COL.signRim, faces: ['px', 'nx', 'py', 'ny']}));
  const halo = pr.p([c[0], c[1], zf]);
  items.push({z: panel ? panel.z - 1.5 : halo.z, key: 'signHalo', el: (
    <g key="signHalo">
      <defs>
        <radialGradient id="signHaloG" cx={halo.x} cy={halo.y} r={h * 0.55 * halo.s} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.12 * glow} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={halo.x} cy={halo.y} rx={h * 0.5 * halo.s} ry={h * 0.55 * halo.s} fill="url(#signHaloG)" />
    </g>
  )});
  items.push(symbolOnWall(pr, 'signSym', [c[0], c[1], zf + 0.5], h * 0.62, '#F4F6F7', panel ? panel.z - 2 : undefined));
  return items;
};

/** A row of linear LED fixtures hanging on cables, with light pools on the floor beneath. */
const ledRow = (pr: Proj, env: Env, z: number, key: string): Item[] => {
  const items: Item[] = [];
  for (let i = -3; i <= 3; i++) {
    const x = i * 420 + 60;
    items.push(...box(pr, env, `${key}f${i}`, {c: [x, 520, z], size: [240, 10, 26], color: '#E9EDF0', top: '#BFC6CC'}));
    const lit = quad(pr, env, `${key}l${i}`, [[x - 116, 514.6, z - 10], [x + 116, 514.6, z - 10], [x + 116, 514.6, z + 10], [x - 116, 514.6, z + 10]], '#FFFDF2', {flat: true, stroke: false});
    if (lit) items.push({...lit, z: lit.z - 0.5});
    for (const dx of [-100, 100]) items.push(line3(pr, `${key}c${i}${dx}`, [[x + dx, 525, z], [x + dx, 700, z]], '#7E8A94', 1.4));
    const pool = circle3([x, 0.6, z + 40], 150, 24).slice(0, 24).map((q) => [q[0], q[1], z + 40 + (q[2] - z - 40) * 0.55] as V3);
    const pq = quad(pr, env, `${key}p${i}`, pool, '#FFFFFF', {flat: true, stroke: false, opacity: 0.16, smooth: true});
    if (pq) items.push({...pq, z: 1e6 + 0.7});
  }
  return items;
};

export const workshopBack = (pr: Proj, env: Env, t: number, opts: {sign?: number} = {}): Item[] => {
  const items: Item[] = [];
  const W = WS.wallZ;
  const fl = quad(pr, env, 'wsFloor', [[-2400, 0, -620], [2400, 0, -620], [2400, 0, 1800], [-2400, 0, 1800]], COL.floor, {flat: true, stroke: false});
  if (fl) items.push({...fl, z: 1e6 + 1});
  // expansion joints in the polished floor
  for (let i = -8; i <= 8; i++) items.push({...line3(pr, 'jx' + i, [[i * 300, 0.5, -620], [i * 300, 0.5, 1800]], COL.joint, 1.6), z: 1e6 + 0.8});
  for (let i = 0; i <= 8; i++) items.push({...line3(pr, 'jz' + i, [[-2400, 0.5, -620 + i * 300], [2400, 0.5, -620 + i * 300]], COL.joint, 1.6), z: 1e6 + 0.8});
  // floor markings: walkway lanes and a taped work cell around the stand
  items.push({...line3(pr, 'ylane1', [[-1400, 1, 260], [1400, 1, 260]], COL.floorLine, 9), z: 1e6 + 0.6});
  items.push({...line3(pr, 'ylane2', [[-1400, 1, 420], [1400, 1, 420]], COL.floorLine, 9), z: 1e6 + 0.6});
  const [sx, , sz] = WS.stand;
  items.push({...line3(pr, 'cell', [[sx - 150, 1, sz - 110], [sx + 150, 1, sz - 110], [sx + 150, 1, sz + 140], [sx - 150, 1, sz + 140], [sx - 150, 1, sz - 110]], COL.cell, 6), z: 1e6 + 0.6});
  for (let k = 0; k < 6; k++) items.push({...line3(pr, 'hatch' + k, [[520 + k * 40, 1, 120], [560 + k * 40, 1, 60]], COL.floorLine, 5, {opacity: 0.8}), z: 1e6 + 0.6});
  // back wall: panels with seams, a teal dado and a trim line
  const wall = quad(pr, env, 'wsWall', [[-2400, 0, W], [2400, 0, W], [2400, 900, W], [-2400, 900, W]], COL.wall, {flat: true, stroke: false});
  if (wall) items.push({...wall, z: 1e6});
  for (let i = -8; i <= 8; i++) items.push({...line3(pr, 'pseam' + i, [[i * 260 + 90, 120, W + 1], [i * 260 + 90, 900, W + 1]], '#D8CDB2', 2), z: 1e6 - 0.3});
  const dado = quad(pr, env, 'wsDado', [[-2400, 0, W + 1], [2400, 0, W + 1], [2400, 120, W + 1], [-2400, 120, W + 1]], COL.dado, {flat: true, stroke: false});
  if (dado) items.push({...dado, z: 1e6 - 0.5});
  items.push({...line3(pr, 'wsTrim', [[-2400, 120, W + 2], [2400, 120, W + 2]], COL.trim, 4), z: 1e6 - 0.6});
  // high windows
  for (let i = -3; i <= 3; i++) {
    const x = i * 420 + 800;
    if (Math.abs(x - WS.sign[0]) < 260) continue;
    const wq = quad(pr, env, 'wsWin' + i, [[x - 150, 600, W + 2], [x + 150, 600, W + 2], [x + 150, 780, W + 2], [x - 150, 780, W + 2]], '#CFE3F7', {flat: true});
    if (wq) items.push({...wq, z: 1e6 - 1});
    items.push({...line3(pr, 'wsWinM' + i, [[x, 600, W + 3], [x, 780, W + 3]], COL.trim, 3), z: 1e6 - 1.2});
  }
  // company sign behind the stand (illustrative, carries the Figure symbol)
  if ((opts.sign ?? 1) > 0) for (const it of figureSign(pr, env, WS.sign, 220, opts.sign ?? 1)) items.push({...it, z: it.z > 1e5 ? it.z : 1e6 - 2.5});
  // pegboard with tool silhouettes above the bench (wrench, screwdriver, pliers, torque wrench, tape)
  const pb = quad(pr, env, 'peg', [[120, 150, W + 2], [500, 150, W + 2], [500, 360, W + 2], [120, 360, W + 2]], COL.peg, {flat: true});
  if (pb) items.push({...pb, z: 1e6 - 1});
  const toolPath = (pts: [number, number][], col: string, key: string) => {
    const q = pts.map(([x, y]) => pr.p([x, y, W + 3]));
    items.push({z: 1e6 - 2, key, el: <path key={key} d={polyClosed(q)} fill={col} stroke={C.ink} strokeWidth={1.5} strokeLinejoin="round" />});
  };
  toolPath([[150, 300], [160, 312], [215, 312], [222, 318], [232, 312], [232, 296], [222, 290], [215, 296], [160, 296]], '#7E8A94', 'wr1');
  toolPath([[255, 330], [263, 330], [263, 280], [267, 260], [251, 260], [255, 280]], C.coral, 'sd1');
  toolPath([[295, 330], [305, 330], [312, 280], [322, 250], [312, 248], [300, 280], [290, 248], [280, 250], [290, 280]], C.blue, 'pl1');
  toolPath([[350, 320], [362, 320], [366, 210], [358, 200], [350, 210]], C.inkSoft, 'tw1');
  toolPath([[420, 300], [450, 300], [450, 270], [420, 270]], C.saffron, 'tp1');
  // overhead LED rows and cable tray toward the stand
  items.push(...ledRow(pr, env, -380, 'ledA'), ...ledRow(pr, env, 40, 'ledB'));
  items.push(...box(pr, env, 'tray', {c: [sx, 600, -330], size: [26, 8, 560], color: '#9AA4AE'}));
  items.push(line3(pr, 'trayDrop', [[sx + 6, 600, -100], [sx + 10, 420, -105], [sx + 4, 270, -150]], '#2B2F35', 3, {smooth: true}));
  // glass partition and the background assembly bay (deep plane activity)
  const [bx, , bz] = WS.bay;
  const gl = quad(pr, env, 'glass', [[-700, 0, -330], [-700, 0, 380], [-700, 260, 380], [-700, 260, -330]], COL.glass, {flat: true, opacity: 0.28});
  if (gl) items.push({...gl, geo: planeGeo([1, 0, 0], [-700, 0, 0])});
  items.push(...box(pr, env, 'glassFrame', {c: [-700, 262, 25], size: [10, 10, 720], color: COL.steelDark}));
  for (const z of [-330, 25, 380]) items.push(...box(pr, env, 'glassPost' + z, {c: [-700, 131, z], size: [10, 262, 10], color: COL.steelDark}));
  items.push(...box(pr, env, 'bayLift', {c: [bx, 20, bz], size: [180, 40, 150], color: '#5E6C7A', top: '#7C8B99'}));
  items.push(...box(pr, env, 'bayArm', {c: [bx + 130, 160, bz - 40], size: [10, 320, 10], color: COL.steelDark}));
  items.push(...box(pr, env, 'bayMon', {c: [bx + 130, 260, bz], size: [8, 60, 90], color: '#2B2F35', side: '#33424F'}));
  items.push(...box(pr, env, 'bayShelf', {c: [bx - 40, 120, W + 40], size: [300, 240, 60], color: '#C9CDD2', top: '#DCE0E4'}));
  for (let k = 0; k < 5; k++) items.push(...box(pr, env, 'bayBin' + k, {c: [bx - 160 + k * 60, 60 + (k % 2) * 90, W + 74], size: [46, 30, 8], color: [C.blue, C.saffron, C.coral, C.teal, C.blue][k]}));
  void t; void rnd; void tube; void bbOf;
  return items;
};

/** Maintenance stand: platform with an anti-fatigue mat, gantry posts and beam, tether strap, charging reel. */
export const stand = (pr: Proj, env: Env): Item[] => {
  const [x, , z] = WS.stand;
  const items: Item[] = [];
  items.push(...box(pr, env, 'stBase', {c: [x, 7, z], size: [150, 14, 130], color: COL.standBase}));
  const mat = quad(pr, env, 'stMat', [[x - 60, 14.5, z - 50], [x + 60, 14.5, z - 50], [x + 60, 14.5, z + 55], [x - 60, 14.5, z + 55]], '#2E3A48', {flat: true, stroke: false});
  if (mat) items.push({...mat, z: mat.z - 0.5});
  for (const dx of [-82, 82]) items.push(...box(pr, env, 'stPost' + dx, {c: [x + dx, 125, z - 50], size: [14, 250, 14], color: COL.post}));
  items.push(...box(pr, env, 'stBeam', {c: [x, 254, z - 50], size: [190, 16, 16], color: COL.post}));
  items.push(line3(pr, 'tether', [[x, 246, z - 50], [x + 3, 210, z - 30], [x, 182, z - 12]], '#E9A91C', 4, {smooth: true}));
  // charging reel on the right post with its cable looping to the robot's back
  items.push(...cylinder(pr, env, 'reel', {base: [x + 96, 150, z - 50], r0: 18, r1: 18, h: 10, color: '#2B2F35', cap: '#4A5058', seg: 18}));
  items.push(line3(pr, 'chg', [[x + 96, 156, z - 42], [x + 70, 120, z - 30], [x + 30, 130, z - 22], [x + 6, 150, z - 16]], '#1F2328', 3, {smooth: true}));
  // pendant controller hanging from the beam
  items.push(line3(pr, 'pendC', [[x - 60, 250, z - 50], [x - 60, 175, z - 46]], '#2B2F35', 2));
  items.push(...box(pr, env, 'pend', {c: [x - 60, 165, z - 46], size: [14, 22, 8], color: C.saffron}));
  return items;
};

/** Workbench with a fixture (vise) holding an actuator, parts trays, a monitor on an arm and a task lamp. */
export const workbench = (pr: Proj, env: Env, opts: {partsOn?: boolean} = {}): Item[] => {
  const [x, , z] = WS.bench;
  const items: Item[] = [];
  items.push(...box(pr, env, 'bTop', {c: [x, 92, z], size: [240, 8, 90], color: COL.wood, side: COL.woodDark}));
  for (const [dx, dz] of [[-110, -38], [110, -38], [-110, 38], [110, 38]]) items.push(...box(pr, env, `bLeg${dx}${dz}`, {c: [x + dx, 44, z + dz], size: [8, 88, 8], color: COL.steelDark}));
  items.push(...box(pr, env, 'bShelf', {c: [x, 24, z], size: [228, 5, 80], color: COL.woodDark}));
  if (opts.partsOn !== false) {
    // fixture: vise jaws clamping the actuator housing whose top is the match-cut circle
    items.push(...box(pr, env, 'viseB', {c: [x - 70, 100, z - 6], size: [44, 8, 30], color: COL.steelDark}));
    items.push(...box(pr, env, 'viseJ1', {c: [x - 92, 106, z - 6], size: [6, 16, 28], color: '#4F7CC9'}));
    items.push(...box(pr, env, 'viseJ2', {c: [x - 48, 106, z - 6], size: [6, 16, 28], color: '#4F7CC9'}));
    items.push(...cylinder(pr, env, 'act1', {base: [x - 70, 96, z - 6], r0: 9, r1: 9, h: 14, color: '#5B6670', cap: '#8F9BA6', seg: 24}));
    items.push(...cylinder(pr, env, 'act2', {base: [x - 30, 96, z + 18], r0: 7, r1: 7, h: 11, color: '#5B6670', cap: '#8F9BA6', seg: 18}));
    // parts tray with fasteners
    items.push(...box(pr, env, 'tray1', {c: [x + 10, 98, z + 20], size: [40, 4, 26], color: '#7E8A94'}));
    for (let k = 0; k < 6; k++) items.push(...cylinder(pr, env, 'bolt' + k, {base: [x - 4 + (k % 3) * 12, 100, z + 12 + Math.floor(k / 3) * 14], r0: 2.2, r1: 2.2, h: 2, color: '#C9CDD2', cap: '#E3E6E9', seg: 10}));
    items.push(...box(pr, env, 'batt', {c: [x + 60, 104, z - 4], size: [46, 16, 30], color: '#2C333A'}));
    // monitor on an articulated arm and a task lamp
    items.push(...box(pr, env, 'monArm', {c: [x + 100, 130, z - 38], size: [6, 70, 6], color: COL.steelDark}));
    items.push(...box(pr, env, 'mon', {c: [x + 100, 175, z - 30], size: [70, 44, 5], color: '#2B2F35', front: '#3B6E8F'}));
    items.push(...box(pr, env, 'lampPost', {c: [x - 105, 130, z - 30], size: [5, 70, 5], color: C.coral}));
    items.push(...box(pr, env, 'lampHead', {c: [x - 90, 162, z - 22], size: [26, 8, 16], color: C.coral}));
  }
  return items;
};

/** Rolling tool cart (near-plane prop). */
export const toolCart = (pr: Proj, env: Env, at: V3, key = 'cart'): Item[] => {
  const items: Item[] = [];
  items.push(...box(pr, env, key + 'b', {c: add(at, [0, 50, 0]), size: [90, 80, 50], color: COL.cart, side: COL.cartDark}));
  for (let k = 0; k < 4; k++) items.push({...line3(pr, key + 'd' + k, [add(at, [-40, 22 + k * 18, 25.5]), add(at, [40, 22 + k * 18, 25.5])], COL.cartDark, 2), z: pr.p(add(at, [0, 50, 26])).z - 1});
  items.push(...box(pr, env, key + 't', {c: add(at, [0, 93, 0]), size: [96, 6, 56], color: '#4A5058'}));
  for (const [dx, dz] of [[-38, -18], [38, -18], [-38, 18], [38, 18]]) items.push(...cylinder(pr, env, key + 'w' + dx + dz, {base: add(at, [dx, 0, dz]), r0: 6, r1: 6, h: 9, color: '#2B2F35', cap: '#3A3F45', seg: 10}));
  return items;
};

/** Shelf of labelled parts bins (near or deep plane). */
export const partsShelf = (pr: Proj, env: Env, at: V3, key = 'shelf'): Item[] => {
  const items: Item[] = [];
  items.push(...box(pr, env, key + 'f', {c: add(at, [0, 110, 0]), size: [200, 220, 50], color: '#C9CDD2', top: '#DCE0E4'}));
  const cols = [C.blue, C.saffron, C.coral, C.teal];
  for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) items.push(...box(pr, env, `${key}b${r}${k}`, {c: add(at, [-72 + k * 48, 40 + r * 64, 27]), size: [40, 26, 8], color: cols[(r + k) % 4]}));
  return items;
};

/** Open-top scrap bin (kept for compatibility; V3 no longer uses it as a transition). */
export const scrapBin = (pr: Proj, env: Env): Item[] => {
  const [x, , z] = WS.bin;
  const items = cylinder(pr, env, 'bin', {base: [x, 0, z], r0: 62, r1: 70, h: 96, color: COL.bin, cap: false, seg: 36});
  const rim = circle3([x, 96, z], 70, 40).slice(0, 40).map((q) => pr.p(q));
  const inner = circle3([x, 96, z], 64, 40).slice(0, 40).map((q) => pr.p(q));
  const zc = pr.p([x, 50, z]).z;
  items.push({z: zc - 1, key: 'binRim', el: <path key="binRim" d={polyClosed(rim) + polyClosed(inner)} fillRule="evenodd" fill={COL.binRim} stroke={env.ink} strokeWidth={env.lineW} />});
  items.push({z: zc - 0.5, key: 'binIn', el: <path key="binIn" d={polyClosed(inner)} fill="#56606A" stroke={env.ink} strokeWidth={1.5} />});
  return items;
};

export {COL as WS_COL, tube};
