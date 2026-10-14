// SET-FOUNDRY (V3): an original, illustrative steel-plant bay (not a reconstruction of the real Imatra plant or of Figure's film).
// World units cm, y up. The ladle sits at the origin; the launch walkway is on its -x side.
import React from 'react';
import {Proj} from '../engine/camera';
import {V3, add, dot, len, mulS, norm, sub, rnd, noise1, clamp01} from '../engine/math';
import {Env, Item, box, circle3, cylinder, line3, quad, tube, mixHex, fogged, shadeFace} from '../engine/prims';
const shadeFaceLocal = shadeFace;
import {hull, polyClosed, smoothClosed, clipNear} from '../engine/draw';

export const LADLE = {c: [0, 0, 0] as V3, y0: 20, rim: 380, rTop: 190, rBot: 168, rIn: 156, steel: 322};
export const DECK = {y: 600, edgeX: -214, x0: -820, z0: -135, z1: 135, thick: 22};
export const GLOW_POS: V3 = [0, LADLE.steel + 12, 0];

export const FOUNDRY_ENV: Env = {
  light: norm([0.25, 0.85, -0.45]),
  ambient: 0.36,
  glow: {pos: GLOW_POS, color: '#FF7A22', strength: 0.8, falloff: 270},
  ink: '#0E0B0F',
  lineW: 2.2,
  fog: {color: '#251E2A', near: 1100, far: 4600, max: 0.5},
};

const COL = {
  steel: '#56606E', steelDark: '#3A414D', deck: '#434954', hazard: '#F2B632', hazardDark: '#17181C',
  ladle: '#3B3736', band: '#4D4744', lining: '#A9573A', liningDark: '#6E3322', rimTop: '#5E5049',
  wall: '#24262F', wallDark: '#1B1D25', column: '#363C48', furnace: '#4E342D', furnaceRoof: '#3F312D', electrode: '#34363A',
  crane: '#C9921F', craneDark: '#8A5F15', floor: '#2B2729', rail: '#D6A936',
};

/** Which side of a vertical-axis object faces the camera: unit xz vector from the object centre toward the camera. */
const camDirXZ = (pr: Proj, c: V3): V3 => {
  const d = sub(pr.pos, c);
  const v: V3 = [d[0], 0, d[2]];
  const l = len(v) || 1;
  return [v[0] / l, 0, v[2] / l];
};

// ---------------------------------------------------------------- background (deep plane)
export const foundryBack = (pr: Proj, env: Env, t: number, opts: {furnaceGlow?: number} = {}): Item[] => {
  const items: Item[] = [];
  // rear wall with high windows
  const wallZ = -1700;
  const wq = quad(pr, env, 'wall', [[-3600, 0, wallZ], [3600, 0, wallZ], [3600, 2400, wallZ], [-3600, 2400, wallZ]], COL.wall, {flat: true});
  if (wq) items.push({...wq, z: 1e6});
  for (let i = -6; i <= 6; i++) {
    const x = i * 520;
    const win = quad(pr, env, 'win' + i, [[x - 170, 1520, wallZ + 2], [x + 170, 1520, wallZ + 2], [x + 170, 1930, wallZ + 2], [x - 170, 1930, wallZ + 2]], '#8C8A98', {flat: true, stroke: false, opacity: 0.55});
    if (win) items.push({...win, z: 1e6 - 1});
    items.push({...line3(pr, 'winb' + i, [[x, 1520, wallZ + 3], [x, 1930, wallZ + 3]], '#2A2D38', 6), z: 1e6 - 2});
  }
  // wall panel ribs
  for (let i = -18; i <= 18; i++) {
    items.push({...line3(pr, 'rib' + i, [[i * 200, 0, wallZ + 1], [i * 200, 1450, wallZ + 1]], COL.wallDark, 3, {opacity: 0.7}), z: 1e6 - 0.5});
  }
  // building columns (H-section approximated by boxes)
  for (let i = -3; i <= 3; i++) {
    const x = i * 1150 + 150;
    items.push(...box(pr, env, 'colB' + i, {c: [x, 1150, -1520], size: [70, 2300, 70], color: COL.column}));
    items.push(...box(pr, env, 'colF' + i, {c: [x, 1150, 1500], size: [70, 2300, 70], color: COL.column}));
  }
  // mid-ground columns (depth cue, scale against the robot)
  for (const [i, x, z] of [[0, -1250, -620], [1, 820, -760], [2, -1250, 900]] as [number, number, number][]) {
    items.push(...box(pr, env, 'midcol' + i, {c: [x, 1150, z], size: [90, 2300, 90], color: COL.column}));
    items.push(...box(pr, env, 'midflg' + i, {c: [x, 1150, z], size: [150, 2300, 18], color: COL.column}));
  }
  // ladle-car rails on the floor
  for (const z of [-120, 120]) items.push({...line3(pr, 'rail' + z, [[-2600, 2, z], [2600, 2, z]], '#5C5658', 7), z: 1e6 + 0.4});
  // crane runway girders + overhead crane bridge with a hanging hook block
  items.push(...box(pr, env, 'runB', {c: [0, 1720, -1430], size: [7200, 110, 70], color: COL.steelDark}));
  items.push(...box(pr, env, 'runF', {c: [0, 1720, 1430], size: [7200, 110, 70], color: COL.steelDark}));
  const bx = 760 + 30 * Math.sin(t * 0.25);
  items.push(...box(pr, env, 'bridge', {c: [bx, 1640, 0], size: [150, 170, 2900], color: COL.crane, side: COL.craneDark}));
  items.push(...box(pr, env, 'trolley', {c: [bx, 1530, -120], size: [210, 90, 240], color: COL.craneDark}));
  const hookY = 1060 + 18 * Math.sin(t * 0.6);
  const hz = -150;
  for (const [i, dx, dz] of [[0, -40, -30], [1, 40, -30], [2, -40, 30], [3, 40, 30]] as [number, number, number][]) {
    items.push(line3(pr, 'cab' + i, [[bx + dx * 1.6, 1490, hz + dz * 1.4], [bx + dx * 0.8, hookY + 150, hz + dz * 0.8]], '#1A1718', 4));
  }
  items.push(...box(pr, env, 'hookblk', {c: [bx, hookY + 90, hz], size: [150, 130, 90], color: COL.crane, side: COL.craneDark}));
  items.push(...box(pr, env, 'hookshank', {c: [bx, hookY, hz], size: [34, 70, 34], color: COL.steelDark}));
  // the hook itself: a heavy C seen in world space
  const hookPts: V3[] = [];
  for (let k = 0; k <= 14; k++) {
    const a = -0.3 + (k / 14) * 3.6;
    hookPts.push([bx + Math.sin(a) * 52, hookY - 80 - Math.cos(a) * 46, hz]);
  }
  const hp = pr.p([bx, hookY - 80, hz]);
  items.push({...line3(pr, 'hook', hookPts, '#2E3138', Math.max(4, 26 * hp.s), {smooth: true}), z: hp.z});
  items.push({...line3(pr, 'hookhi', hookPts.slice(2, 9), '#6E7480', Math.max(1.5, 7 * hp.s), {smooth: true}), z: hp.z - 0.1});
  // electric arc furnace with electrodes (deep right)
  const fc: V3 = [1250, 0, -980];
  items.push(...cylinder(pr, env, 'eaf', {base: fc, r0: 340, r1: 330, h: 430, color: COL.furnace, cap: false}));
  items.push(...cylinder(pr, env, 'eafRoof', {base: add(fc, [0, 430, 0]), r0: 330, r1: 210, h: 120, color: COL.furnaceRoof, cap: COL.furnaceRoof}));
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.4;
    const e: V3 = add(fc, [Math.cos(a) * 95, 0, Math.sin(a) * 95]);
    items.push(...cylinder(pr, env, 'elec' + k, {base: add(e, [0, 540, 0]), r0: 24, r1: 24, h: 560, color: COL.electrode, cap: '#55585D', seg: 14}));
    items.push(...box(pr, env, 'arm' + k, {c: add(e, [180, 980 + k * 30, 0]), size: [380, 40, 50], color: COL.steelDark}));
  }
  items.push(...box(pr, env, 'mast', {c: add(fc, [400, 700, 0]), size: [80, 1400, 80], color: COL.steelDark}));
  // furnace door glow
  const g = opts.furnaceGlow ?? 1;
  const door = quad(pr, env, 'eafdoor', [add(fc, [-150, 120, 300]), add(fc, [-40, 120, 318]), add(fc, [-40, 250, 318]), add(fc, [-150, 250, 300])], '#FFB347', {flat: true, stroke: false, opacity: 0.85 * g});
  if (door) items.push({...door, z: door.z - 50});
  // cable trays along the rear wall and a ventilation duct overhead
  items.push(...box(pr, env, 'trayB', {c: [0, 1240, -1640], size: [7000, 14, 60], color: '#3C414B'}));
  for (const k of [0, 1, 2]) items.push({...line3(pr, 'cbl' + k, [[-3500, 1250 + k * 4, -1630 + k * 12], [3500, 1250 + k * 4, -1630 + k * 12]], ['#1A1C22', '#5A2E1E', '#1E3348'][k], 4), z: 1e6 - 3});
  items.push(tube(pr, env, 'duct', [-3200, 1560, -1180], [3200, 1560, -1180], 48, '#4A4F59', {seg: 18}));
  for (const x of [-2400, -1200, 0, 1200, 2400]) items.push(...box(pr, env, 'ductHang' + x, {c: [x, 1640, -1180], size: [10, 120, 10], color: '#2B2F37'}));
  // high-bay lamps on drop cables: practical light sources with soft cones
  for (const [i, lx, lz] of [[0, -620, -380], [1, 420, -520], [2, -260, 560], [3, 980, 380]] as [number, number, number][]) {
    const ly = 1320 + 8 * Math.sin(t * 0.7 + i);
    items.push(line3(pr, 'lampc' + i, [[lx, 1700, lz], [lx, ly + 40, lz]], '#16171B', 2.5));
    items.push(...cylinder(pr, env, 'lamp' + i, {base: [lx, ly, lz], r0: 46, r1: 22, h: 40, color: '#2E323A', cap: '#2E323A', seg: 20}));
    const bulb = circle3([lx, ly - 0.5, lz], 40, 20).slice(0, 20);
    const bq = quad(pr, env, 'lampb' + i, bulb, '#FFE6A8', {flat: true, stroke: false, smooth: true});
    if (bq) items.push({...bq, z: bq.z - 1});
  }
  // floor
  const fl = quad(pr, env, 'floor', [[-3600, 0, -1700], [3600, 0, -1700], [3600, 0, 2600], [-3600, 0, 2600]], COL.floor, {flat: true, stroke: false});
  if (fl) items.push({...fl, z: 1e6 + 1});
  // floor safety lines
  items.push({...line3(pr, 'fline1', [[-1600, 1, 420], [1600, 1, 420]], COL.rail, 8, {opacity: 0.7}), z: 1e6 + 0.5});
  items.push({...line3(pr, 'fline2', [[-1600, 1, -420], [1600, 1, -420]], COL.rail, 8, {opacity: 0.7}), z: 1e6 + 0.5});
  return items;
};

// ---------------------------------------------------------------- walkway (launch platform)
export const walkway = (pr: Proj, env: Env, opts: {railGap?: boolean} = {}): Item[] => {
  const items: Item[] = [];
  const {y, edgeX, x0, z0, z1, thick} = DECK;
  const cx = (edgeX + x0) / 2, w = edgeX - x0, d = z1 - z0;
  items.push(...box(pr, env, 'deck', {c: [cx, y - thick / 2, 0], size: [w, thick, d], color: COL.deck, top: COL.deck, side: COL.steelDark}));
  // hazard band on the edge face and a painted launch strip on the deck top
  const stripes = 9;
  for (let k = 0; k < stripes; k++) {
    const za = z0 + (d / stripes) * k, zb = za + d / stripes;
    const col = k % 2 === 0 ? COL.hazard : COL.hazardDark;
    const q = quad(pr, env, 'hz' + k, [[edgeX + 0.5, y - thick, za], [edgeX + 0.5, y - thick, zb], [edgeX + 0.5, y, zb + 12], [edgeX + 0.5, y, za + 12]], col, {stroke: false});
    if (q) items.push({...q, z: q.z - 1});
  }
  for (let k = 0; k < 6; k++) {
    const xa = edgeX - 60 + k * 10;
    const q = quad(pr, env, 'ls' + k, [[xa - 8, y + 0.6, z0 + 20], [xa, y + 0.6, z0 + 20], [xa, y + 0.6, z1 - 20], [xa - 8, y + 0.6, z1 - 20]], k % 2 ? COL.hazard : COL.hazardDark, {stroke: false, flat: false});
    if (q) items.push({...q, z: q.z - 0.5});
  }
  // tread plate texture lines
  for (let k = 0; k < 9; k++) {
    const x = x0 + 40 + k * 55;
    items.push({...line3(pr, 'tread' + k, [[x, y + 0.5, z0 + 10], [x, y + 0.5, z1 - 10]], '#3E434B', 2, {opacity: 0.8}), z: pr.p([x, y, 0]).z + 1});
  }
  // side railings (open at the launch edge)
  for (const zr of [z0 + 6, z1 - 6]) {
    const zt = zr;
    for (let k = 0; k < 6; k++) {
      const x = x0 + 30 + k * 104;
      if (x > edgeX - 100) break;
      items.push(tube(pr, env, `post${zr}_${k}`, [x, y, zt], [x, y + 108, zt], 3.2, COL.rail, {seg: 8, plane: [0, 0, 1]}));
    }
    items.push(tube(pr, env, `rt${zr}`, [x0 + 20, y + 108, zt], [edgeX - 110, y + 108, zt], 3.2, COL.rail, {seg: 8, plane: [0, 0, 1]}));
    items.push(tube(pr, env, `rm${zr}`, [x0 + 20, y + 56, zt], [edgeX - 110, y + 56, zt], 2.6, COL.rail, {seg: 8, plane: [0, 0, 1]}));
    // chain across the gap, hanging slack (unhooked on one side for the launch)
    if (!opts.railGap) {
      const pts: V3[] = [];
      for (let i = 0; i <= 10; i++) {
        const u = i / 10;
        pts.push([edgeX - 110 + u * 40, y + 100 - Math.sin(u * Math.PI) * 6 - u * 60, zt]);
      }
      items.push(line3(pr, `chain${zr}`, pts, '#2A2526', 2.5, {smooth: true, plane: [0, 0, 1]}));
    }
  }
  // deck grating (cross-hatched tread plate) and post base plates
  for (let k = 1; k < 24; k++) {
    const x = x0 + k * 25;
    items.push({...line3(pr, 'grx' + k, [[x, y + 0.4, z0 + 4], [x, y + 0.4, z1 - 4]], '#2E3239', 1.2, {opacity: 0.55}), z: pr.p([x, y, 0]).z + 1.2});
  }
  for (let k = 1; k < 11; k++) {
    const z = z0 + k * 25;
    items.push({...line3(pr, 'grz' + k, [[x0 + 4, y + 0.4, z], [edgeX - 4, y + 0.4, z]], '#2E3239', 1.2, {opacity: 0.55}), z: pr.p([cx, y, z]).z + 1.2});
  }
  for (const zr of [z0 + 6, z1 - 6]) {
    for (let k = 0; k < 6; k++) {
      const x = x0 + 30 + k * 104;
      if (x > edgeX - 100) break;
      items.push(...box(pr, env, `bp${zr}_${k}`, {c: [x, y + 1.5, zr], size: [16, 3, 16], color: COL.steelDark}));
    }
    // handrail end return at the launch opening: the rail turns down into the deck
    items.push(tube(pr, env, `ret${zr}`, [edgeX - 110, y + 108, zr], [edgeX - 110, y, zr], 3.2, COL.rail, {seg: 8, plane: [0, 0, 1]}));
  }
  // access stair at the far end, down to the floor (stringers + treads)
  {
    const sx0 = x0 + 10, run = 520, sz0 = z0 + 18, sz1 = z0 + 108;
    for (const z of [sz0, sz1]) items.push(tube(pr, env, 'str' + z, [sx0, y - thick, z], [sx0 - run, 0, z], 5, COL.steelDark, {seg: 8}));
    for (let k = 1; k < 18; k++) {
      const u = k / 18;
      items.push(...box(pr, env, 'tread' + k, {c: [sx0 - run * u, (y - thick) * (1 - u), (sz0 + sz1) / 2], size: [26, 4, sz1 - sz0], color: COL.deck}));
    }
    items.push(tube(pr, env, 'srail', [sx0, y + 100, sz0 - 8], [sx0 - run, 100, sz0 - 8], 3, COL.rail, {seg: 8}));
  }
  // contact shadow of the walkway on the floor (offset away from the ladle glow)
  {
    const sh = quad(pr, env, 'deckShadow', [[x0 - 60, 0.6, z0 - 20], [edgeX - 40, 0.6, z0 - 20], [edgeX - 40, 0.6, z1 + 40], [x0 - 60, 0.6, z1 + 40]], '#0B0A0D', {flat: true, stroke: false, opacity: 0.38});
    if (sh) items.push({...sh, z: 1e6 + 0.45});
  }
  // support structure
  for (const x of [x0 + 40, edgeX - 70]) {
    for (const z of [z0 + 25, z1 - 25]) {
      items.push(...box(pr, env, `leg${x}_${z}`, {c: [x, (y - thick) / 2, z], size: [34, y - thick, 34], color: COL.steelDark}));
    }
  }
  items.push(...box(pr, env, 'brace1', {c: [cx, y - thick - 30, z0 + 25], size: [w - 80, 34, 22], color: COL.steelDark}));
  items.push(...box(pr, env, 'brace2', {c: [cx, y - thick - 30, z1 - 25], size: [w - 80, 34, 22], color: COL.steelDark}));
  // diagonal cross-bracing between the legs
  for (const z of [z0 + 25, z1 - 25]) {
    items.push(tube(pr, env, 'dg1' + z, [x0 + 40, 60, z], [edgeX - 70, y - thick - 50, z], 5, COL.steelDark, {seg: 8}));
    items.push(tube(pr, env, 'dg2' + z, [x0 + 40, y - thick - 50, z], [edgeX - 70, 60, z], 5, COL.steelDark, {seg: 8}));
  }
  // toe boards along the open sides
  for (const z of [z0 + 2, z1 - 2]) items.push(...box(pr, env, 'toe' + z, {c: [cx - 20, y + 7, z], size: [w - 40, 14, 3], color: COL.hazard, side: COL.hazard}));
  // service pipes under the deck
  items.push(tube(pr, env, 'pipeA', [x0, y - thick - 70, z0 + 60], [edgeX - 20, y - thick - 70, z0 + 60], 9, '#6B5A4A', {seg: 10}));
  items.push(tube(pr, env, 'pipeB', [x0, y - thick - 92, z0 + 85], [edgeX - 20, y - thick - 92, z0 + 85], 6, '#4E6A7A', {seg: 10}));
  return items;
};

// ---------------------------------------------------------------- ladle
/**
 * The ladle as two depth bands so a robot inside it sorts correctly:
 *   back  (z = centre + R): interior lining + far half of the lip
 *   front (z = centre - R): near half of the lip + outer wall, bands, trunnions, stand
 */
export const ladle = (pr: Proj, envIn: Env): {back: Item[]; front: Item[]} => {
  // the steel is inside the vessel: its exterior only gets a faint warm bounce, not the full glow
  const env: Env = {...envIn, glow: envIn.glow ? {...envIn.glow, strength: envIn.glow.strength * 0.18} : undefined};
  const envHot = envIn;
  const {c, y0, rim, rTop, rBot, rIn, steel} = LADLE;
  const zc = pr.p(add(c, [0, steel, 0])).z;
  const R = rTop;
  const back: Item[] = [], front: Item[] = [];
  const cd = camDirXZ(pr, c);
  const ang0 = Math.atan2(cd[2], cd[0]); // direction toward camera in the xz plane
  const camAbove = pr.pos[1] > rim;
  const camInside = Math.hypot(pr.pos[0] - c[0], pr.pos[2] - c[2]) < rIn - 5 && pr.pos[1] > steel;
  if (camInside) {
    // camera hovering inside the ladle: the whole lining wraps around; no outer wall or lip in view
    const segs = 24;
    for (let k = 0; k < segs; k++) {
      const a0 = (k / segs) * Math.PI * 2, a1 = ((k + 1) / segs) * Math.PI * 2;
      const quadPts: V3[] = [
        [Math.cos(a0) * rIn, rim, Math.sin(a0) * rIn], [Math.cos(a1) * rIn, rim, Math.sin(a1) * rIn],
        [Math.cos(a1) * (rIn - 3), steel, Math.sin(a1) * (rIn - 3)], [Math.cos(a0) * (rIn - 3), steel, Math.sin(a0) * (rIn - 3)],
      ];
      const cl = clipNear(pr, quadPts);
      if (cl.length < 3) continue;
      const mid: V3 = [Math.cos((a0 + a1) / 2) * rIn, (rim + steel) / 2, Math.sin((a0 + a1) / 2) * rIn];
      const col = mixHex(COL.lining, '#FF9A3D', 0.5 + 0.2 * Math.sin(k));
      back.push({z: pr.depth(mid) + 1000, key: 'lin' + k, el: <path key={'lin' + k} d={polyClosed(cl.map((q) => pr.p(q)))} fill={col} stroke={COL.liningDark} strokeWidth={1.4} />});
    }
    return {back, front};
  }

  // interior lining: visible far half between the rim and the steel surface
  if (camAbove) {
    const farA = ang0 + Math.PI / 2, farB = ang0 + (3 * Math.PI) / 2;
    const rimFar = circle3(add(c, [0, rim, 0]), rIn, 32, farA, farB);
    const steelFar = circle3(add(c, [0, steel, 0]), rIn - 3, 32, farA, farB).reverse();
    const pts = [...rimFar, ...steelFar].map((q) => pr.p(q));
    const gl = envHot.glow ? mixHex(COL.lining, '#FF9A3D', 0.55) : COL.lining;
    back.push({
      z: zc + R + 2, key: 'lining',
      el: (
        <g key="lining">
          <path d={polyClosed(pts)} fill={fogged(env, gl, zc)} stroke={env.ink} strokeWidth={env.lineW} />
          {/* refractory brick courses */}
          {[0.33, 0.66].map((u, i) => {
            const ring = circle3(add(c, [0, steel + (rim - steel) * u, 0]), rIn - 1, 24, farA, farB).map((q) => pr.p(q));
            return <path key={i} d={'M' + ring.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join('L')} fill="none" stroke={COL.liningDark} strokeWidth={1.6} strokeOpacity={0.7} />;
          })}
        </g>
      ),
    });
  }
  // lip (top annulus) split into far and near halves
  const lip = (a0: number, a1: number, key: string) => {
    const outer = circle3(add(c, [0, rim, 0]), rTop, 30, a0, a1);
    const inner = circle3(add(c, [0, rim, 0]), rIn, 30, a0, a1).reverse();
    const pts = [...outer, ...inner].map((q) => pr.p(q));
    const fill = fogged(env, mixHex(COL.rimTop, '#FF8B3A', envHot.glow ? 0.28 : 0), zc);
    return <path key={key} d={polyClosed(pts)} fill={fill} stroke={env.ink} strokeWidth={env.lineW} strokeLinejoin="round" />;
  };
  // refractory bricks on the lip: radial joints over the annulus, plus a heat-darkened inner edge
  const lipBricks = (a0: number, a1: number, key: string) => {
    const n = 14;
    const els: React.ReactNode[] = [];
    for (let k = 0; k <= n; k++) {
      const a = a0 + ((a1 - a0) * k) / n;
      const pa = pr.p([c[0] + Math.cos(a) * (rIn + 1), rim + 0.4, c[2] + Math.sin(a) * (rIn + 1)]);
      const pb = pr.p([c[0] + Math.cos(a) * (rTop - 2), rim + 0.4, c[2] + Math.sin(a) * (rTop - 2)]);
      els.push(<line key={k} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#2B2220" strokeWidth={Math.max(1, 1.6 * pa.s)} strokeOpacity={0.75} />);
    }
    const inner = circle3(add(c, [0, rim + 0.5, 0]), rIn + 5, 30, a0, a1).map((q) => pr.p(q));
    els.push(<path key="in" d={'M' + inner.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join('L')} fill="none" stroke="#1E1412" strokeWidth={Math.max(2, 7 * inner[0].s)} strokeOpacity={0.6} strokeLinecap="round" />);
    return <g key={key}>{els}</g>;
  };
  if (camAbove) {
    back.push({z: zc + R + 1, key: 'lipFar', el: <g key="lipFarG">{lip(ang0 + Math.PI / 2, ang0 + (3 * Math.PI) / 2, 'lipFar')}{lipBricks(ang0 + Math.PI / 2, ang0 + (3 * Math.PI) / 2, 'lbF')}</g>});
    front.push({z: zc - R - 1, key: 'lipNear', el: <g key="lipNearG">{lip(ang0 - Math.PI / 2, ang0 + Math.PI / 2, 'lipNear')}{lipBricks(ang0 - Math.PI / 2, ang0 + Math.PI / 2, 'lbN')}</g>});
  }
  // pouring spout on the +x side: a channel that juts out from the rim
  {
    const spoutC: V3 = [rTop + 26, rim - 14, 0];
    const near = dot(sub(pr.pos, spoutC), [1, 0, 0]) > 0;
    const sp = box(pr, env, 'spout', {c: spoutC, size: [64, 34, 96], color: COL.band, top: COL.rimTop});
    const ch = quad(pr, env, 'spoutCh', [[rTop - 4, rim + 0.6, -26], [rTop + 56, rim - 8, -20], [rTop + 56, rim - 8, 20], [rTop - 4, rim + 0.6, 26]], '#3A1C14', {stroke: false});
    for (const it of sp) (near ? front : back).push({...it, z: near ? zc - R - 1.5 : zc + R + 1.5});
    if (ch) (near ? front : back).push({...ch, z: near ? zc - R - 1.6 : zc + R + 1.4});
  }
  // floor contact shadow around the stand
  {
    const ring = circle3([c[0], 0.7, c[2]], rBot + 90, 36).slice(0, 36);
    const sh = quad(pr, env, 'ladleShadow', ring, '#0A090C', {flat: true, stroke: false, opacity: 0.42, smooth: true});
    if (sh) back.push({...sh, z: 1e6 + 0.44});
  }
  // outer wall: only the near half (so the interior, steel and anything inside stay visible above the near rim)
  {
    const a0 = ang0 - Math.PI / 2 - 0.08, a1 = ang0 + Math.PI / 2 + 0.08;
    const topArc = circle3(add(c, [0, rim, 0]), rTop, 40, a0, a1);
    const botArc = circle3(add(c, [0, y0, 0]), rBot, 40, a0, a1).reverse();
    const pts = [...topArc, ...botArc].map((q) => pr.p(q));
    const left = pr.p(topArc[0]), right = pr.p(topArc[topArc.length - 1]);
    const mid = add(c, [0, (rim + y0) / 2, 0]);
    const side = norm([-cd[2], 0, cd[0]]);
    const litSign = Math.sign(dot(env.light, side)) || 1;
    const nL = norm(add(mulS(side, litSign), mulS(cd, 0.5))), nD = norm(add(mulS(side, -litSign), mulS(cd, 0.5)));
    const cLit = fogged(env, shadeFaceLocal(env, COL.ladle, nL, mid), zc);
    const cDark = fogged(env, shadeFaceLocal(env, COL.ladle, nD, mid), zc);
    const cMid = fogged(env, shadeFaceLocal(env, COL.ladle, cd, mid), zc);
    const [ga, gb] = litSign > 0 ? [left, right] : [right, left];
    front.push({
      z: zc - R, key: 'ladleWall',
      el: (
        <g key="ladleWall">
          <defs>
            <linearGradient id="ladleWall-g" gradientUnits="userSpaceOnUse" x1={gb.x} y1={gb.y} x2={ga.x} y2={ga.y}>
              <stop offset="0" stopColor={cDark} />
              <stop offset="0.5" stopColor={cMid} />
              <stop offset="1" stopColor={cLit} />
            </linearGradient>
          </defs>
          <path d={polyClosed(pts)} fill="url(#ladleWall-g)" stroke={env.ink} strokeWidth={env.lineW} strokeLinejoin="round" />
        </g>
      ),
    });
  }
  // reinforcing bands
  for (const [i, yb] of [[0, 95], [1, 215], [2, 335], [3, 362]] as [number, number][]) {
    const rr = rBot + ((rTop - rBot) * (yb - y0)) / (rim - y0) + 5;
    const pts = [
      ...circle3(add(c, [0, yb, 0]), rr, 36, ang0 - Math.PI / 2, ang0 + Math.PI / 2),
      ...circle3(add(c, [0, yb + 16, 0]), rr, 36, ang0 - Math.PI / 2, ang0 + Math.PI / 2).reverse(),
    ].map((q) => pr.p(q));
    front.push({z: zc - R - 2 - i * 0.01, key: 'band' + i, el: <path key={'band' + i} d={polyClosed(pts)} fill={fogged(env, COL.band, zc)} stroke={env.ink} strokeWidth={env.lineW} />});
  }
  // rivet heads along the middle band (near side only)
  for (let k = -6; k <= 6; k++) {
    const a = ang0 + (k / 6) * (Math.PI / 2) * 0.92;
    const yb = 223;
    const rr = rBot + ((rTop - rBot) * (yb - y0)) / (rim - y0) + 6;
    const q = pr.p([c[0] + Math.cos(a) * rr, yb, c[2] + Math.sin(a) * rr]);
    front.push({z: zc - R - 2.5, key: 'rv' + k, el: <circle key={'rv' + k} cx={q.x} cy={q.y} r={Math.max(1.2, 3.2 * q.s)} fill="#6A625E" stroke={env.ink} strokeWidth={1} />});
  }
  // trunnions on ±z, resting in stand cradles
  for (const s of [1, -1]) {
    const a: V3 = [0, 300, s * (rTop - 6)], b: V3 = [0, 300, s * (rTop + 62)];
    const tz = pr.p(b).z;
    front.push({...tube(pr, env, 'trun' + s, a, b, 34, COL.band), z: tz < zc ? zc - R - 3 : zc + R + 3});
    const cr = box(pr, env, 'cradle' + s, {c: [0, 140, s * (rTop + 40)], size: [110, 280, 70], color: COL.steelDark});
    for (const it of cr) front.push({...it, z: tz < zc ? zc - R - 2.5 : zc + R + 2.5});
  }
  // stand under the ladle
  for (const it of box(pr, env, 'stand', {c: [0, 10, 0], size: [420, 20, 420], color: COL.steelDark})) back.push({...it, z: zc + R + 8});
  return {back, front};
};

// ---------------------------------------------------------------- molten surface
export type Disturb = {at: V3; t: number}; // impact point and seconds since impact (t < 0: none)

export const moltenSurface = (pr: Proj, env: Env, time: number, dist?: Disturb, scar = 0): Item => {
  const {c, steel, rIn} = LADLE;
  const centre = add(c, [0, steel, 0]);
  const zc = pr.p(centre).z;
  const rim = circle3(centre, rIn - 2, 64).slice(0, 64).map((q) => pr.p(q));
  const d = polyClosed(rim);
  const els: React.ReactNode[] = [];
  const gid = 'molten-g';
  els.push(
    <defs key="d">
      <radialGradient id={gid} cx="0.5" cy="0.5" r="0.55">
        <stop offset="0" stopColor="#FFF6C9" />
        <stop offset="0.35" stopColor="#FFD45A" />
        <stop offset="0.75" stopColor="#FF8A1E" />
        <stop offset="1" stopColor="#D2450F" />
      </radialGradient>
      <clipPath id="molten-clip"><path d={d} /></clipPath>
    </defs>,
  );
  els.push(<path key="base" d={d} fill={`url(#${gid})`} />);
  const g: React.ReactNode[] = [];
  // convection cells (lighter) and slag rafts (dark crust with hot cracks), drifting in a slow swirl
  for (let i = 0; i < 9; i++) {
    const r0 = 30 + rnd(i * 13 + 1) * 105;
    const a = rnd(i * 7 + 3) * Math.PI * 2 + time * (0.05 + 0.05 * rnd(i));
    const sz = 14 + rnd(i * 5 + 2) * 20;
    let cx = Math.cos(a) * r0, cz = Math.sin(a) * r0;
    if (dist && dist.t >= 0) {
      // the impact shoves crust outward
      const dx = cx - dist.at[0], dz = cz - dist.at[2];
      const dd = Math.hypot(dx, dz) || 1;
      const push = 70 * (1 - Math.exp(-dist.t * 2.5)) * Math.exp(-dd / 120);
      cx += (dx / dd) * push;
      cz += (dz / dd) * push;
      if (Math.hypot(cx, cz) > rIn - sz) {
        const k = (rIn - sz) / Math.hypot(cx, cz);
        cx *= k; cz *= k;
      }
    }
    const pts: V3[] = [];
    const nv = i % 3 === 0 ? 9 : 15;
    for (let k = 0; k < nv; k++) {
      const aa = (k / nv) * Math.PI * 2;
      const jag = i % 3 === 0 ? 0.7 + 0.45 * rnd(i * 31 + k) : 0.72 + 0.38 * rnd(i * 31 + k);
      const rr = sz * jag;
      pts.push([centre[0] + cx + Math.cos(aa) * rr, steel + 0.3, centre[2] + cz + Math.sin(aa) * rr * 0.8]);
    }
    const p2 = pts.map((q) => pr.p(q));
    if (i % 3 === 0) {
      g.push(<path key={'cell' + i} d={smoothClosed(p2)} fill="#FFF3B8" fillOpacity={0.5} />);
    } else {
      // slag raft: dark, jagged crust with glowing cracks running through it
      const cr = [0, 3, 7, 10].map((k) => p2[k % nv]);
      const ctr = pr.p([centre[0] + cx, steel + 0.4, centre[2] + cz]);
      g.push(
        <g key={'raft' + i}>
          <path d={'M' + p2.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join('L') + 'Z'} fill="#4A170A" fillOpacity={0.86} stroke="#D9561A" strokeWidth={Math.max(1, 2 * p2[0].s)} strokeOpacity={0.85} strokeLinejoin="round" />
          <path d={cr.map((q, k) => `M${ctr.x.toFixed(1)} ${ctr.y.toFixed(1)}L${((q.x + ctr.x) / 2 + (k % 2 ? 4 : -4)).toFixed(1)} ${((q.y + ctr.y) / 2).toFixed(1)}L${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join('')} fill="none" stroke="#FFB13B" strokeWidth={Math.max(0.8, 1.6 * p2[0].s)} strokeOpacity={0.75} />
        </g>,
      );
    }
  }
  // ripples after an impact
  if (dist && dist.t >= 0) {
    for (let k = 0; k < 4; k++) {
      const tt = dist.t - k * 0.18;
      if (tt <= 0) continue;
      const r = 25 + tt * 150;
      const fade = Math.max(0, 1 - tt / 1.6);
      if (fade <= 0) continue;
      const ring = circle3([dist.at[0], steel + 0.5, dist.at[2]], r, 40).map((q) => pr.p(q));
      g.push(<path key={'rip' + k} d={polyClosed(ring)} fill="none" stroke="#FFF7CF" strokeWidth={Math.max(1.5, 6 * ring[0].s)} strokeOpacity={fade * 0.85} />);
    }
    // churned, darker zone where the robot went in
    const sc = clamp01(scar);
    if (sc > 0) {
      const pts: V3[] = [];
      for (let k = 0; k < 14; k++) {
        const aa = (k / 14) * Math.PI * 2;
        const rr = (34 + 10 * Math.sin(aa * 3 + 1.3)) * (0.6 + 0.4 * sc);
        pts.push([dist.at[0] + Math.cos(aa) * rr, steel + 0.6, dist.at[2] + Math.sin(aa) * rr]);
      }
      const sp = pr.p([dist.at[0], steel, dist.at[2]]);
      const sr = Math.max(...pts.map((q) => Math.hypot(pr.p(q).x - sp.x, pr.p(q).y - sp.y)));
      g.push(
        <g key="scar">
          <defs>
            <radialGradient id="scar-g" cx={sp.x} cy={sp.y} r={sr} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#3E1407" stopOpacity={0.75 * sc} />
              <stop offset="0.6" stopColor="#7A260C" stopOpacity={0.45 * sc} />
              <stop offset="1" stopColor="#B8400E" stopOpacity={0} />
            </radialGradient>
          </defs>
          <path d={smoothClosed(pts.map((q) => pr.p(q)))} fill="url(#scar-g)" />
        </g>,
      );
    }
  }
  els.push(<g key="g" clipPath="url(#molten-clip)">{g}</g>);
  // darker meniscus at the lining
  els.push(<path key="edge" d={d} fill="none" stroke="#9E2F0B" strokeWidth={Math.max(2, 10 * rim[0].s)} strokeOpacity={0.55} />);
  return {z: zc + LADLE.rTop * 0.95, key: 'molten', el: <g key="molten">{els}</g>};
};

// ---------------------------------------------------------------- glow / haze overlays (screen space)
export const HeatGlow: React.FC<{pr: Proj; intensity?: number; id?: string}> = ({pr, intensity = 1, id = 'hg'}) => {
  const p = pr.p(GLOW_POS);
  const r = Math.min(1100, Math.max(260, 520 * p.s));
  return (
    <g style={{mixBlendMode: 'screen'}} pointerEvents="none">
      <defs>
        <radialGradient id={id} cx={p.x} cy={p.y} r={r} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFB04A" stopOpacity={0.38 * intensity} />
          <stop offset="0.35" stopColor="#FF7A22" stopOpacity={0.14 * intensity} />
          <stop offset="1" stopColor="#FF5A10" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill={`url(#${id})`} />
    </g>
  );
};

export const Haze: React.FC<{top?: string; bottom?: string; amount?: number; id?: string}> = ({top = '#1B1720', bottom = '#5A3326', amount = 1, id = 'hz'}) => (
  <g pointerEvents="none">
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={top} stopOpacity={0.5 * amount} />
        <stop offset="0.45" stopColor={top} stopOpacity={0} />
        <stop offset="1" stopColor={bottom} stopOpacity={0.18 * amount} />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill={`url(#${id})`} />
  </g>
);

/** Light shafts from the high windows (screen-space polygons from projected window corners). */
export const LightShafts: React.FC<{pr: Proj; amount?: number}> = ({pr, amount = 1}) => {
  const shafts: React.ReactNode[] = [];
  for (let i = -3; i <= 3; i++) {
    const x = i * 520;
    const a = pr.p([x - 160, 1900, -1690]), b = pr.p([x + 160, 1900, -1690]);
    const c2 = pr.p([x + 420, 0, -300]), d2 = pr.p([x - 60, 0, -300]);
    shafts.push(<path key={i} d={`M${a.x} ${a.y}L${b.x} ${b.y}L${c2.x} ${c2.y}L${d2.x} ${d2.y}Z`} fill="#D8D2E8" fillOpacity={0.05 * amount} />);
  }
  return <g style={{mixBlendMode: 'screen'}}>{shafts}</g>;
};

/** Soft cones under the high-bay lamps (screen-space, additive). */
export const LampCones: React.FC<{pr: Proj; t: number}> = ({pr, t}) => {
  const out: React.ReactNode[] = [];
  for (const [i, lx, lz] of [[0, -620, -380], [1, 420, -520], [2, -260, 560], [3, 980, 380]] as [number, number, number][]) {
    const ly = 1320 + 8 * Math.sin(t * 0.7 + i);
    if (pr.depth([lx, ly, lz]) < 40) continue;
    const top = circle3([lx, ly - 2, lz], 40, 16).slice(0, 16).map((q) => pr.p(q));
    const bot = circle3([lx, 2, lz], 340, 24).slice(0, 24).filter((q) => pr.depth(q) > 20).map((q) => pr.p(q));
    if (bot.length < 6) continue;
    const pts = hull([...top, ...bot]);
    const a = pr.p([lx, ly, lz]), b = pr.p([lx, 0, lz]);
    out.push(
      <g key={i}>
        <defs>
          <linearGradient id={'cone' + i} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}>
            <stop offset="0" stopColor="#FFE2A0" stopOpacity={0.16} />
            <stop offset="1" stopColor="#FFE2A0" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={polyClosed(pts)} fill={`url(#cone${i})`} />
      </g>,
    );
  }
  return <g style={{mixBlendMode: 'screen'}}>{out}</g>;
};

export const sparksAmbient = (pr: Proj, time: number, n = 14, seed = 5): Item[] => {
  const items: Item[] = [];
  for (let i = 0; i < n; i++) {
    const life = 1.2 + rnd(seed + i) * 0.8;
    const t0 = rnd(seed * 3 + i) * life;
    const tt = ((time + t0) % life);
    const a = rnd(seed * 7 + i) * Math.PI * 2;
    const r = rnd(seed * 11 + i) * 120;
    const vx = Math.cos(a) * (30 + 60 * rnd(i + 99)), vz = Math.sin(a) * (30 + 60 * rnd(i + 77));
    const vy = 220 + 200 * rnd(i + 55);
    const p0: V3 = [Math.cos(a) * r, LADLE.steel + 2, Math.sin(a) * r];
    const P = (u: number): V3 => [p0[0] + vx * u, p0[1] + vy * u - 490 * u * u, p0[2] + vz * u];
    const p1 = P(tt), pp = P(Math.max(0, tt - 0.05));
    if (p1[1] < LADLE.steel) continue;
    const q1 = pr.p(p1), q0 = pr.p(pp);
    const fade = 1 - tt / life;
    items.push({z: q1.z, key: 'sp' + seed + '_' + i, el: <line key={'sp' + seed + '_' + i} x1={q0.x} y1={q0.y} x2={q1.x} y2={q1.y} stroke="#FFE7A0" strokeWidth={Math.max(1.2, 2.2 * q1.s)} strokeOpacity={fade} strokeLinecap="round" />});
  }
  return items;
};

export {COL as FOUNDRY_COL, noise1, dot, mulS};
