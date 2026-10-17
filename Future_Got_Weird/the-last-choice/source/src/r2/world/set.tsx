// THE LAST CHOICE R2 — the battlefield set for any camera.
//
//   setItems(view, t, opts?) → Item[]   everything static or set-animated (terrain, ruins, buildings, wrecks, girder,
//                                        van + radio, death slab, failing tower); pass to <Scene items={[...setItems(),
//                                        ...atmosItems(), ...your figures]} />
//
// Draw-order layers (see the contract in engine/scene.tsx):
//   FLAT  (streets, sidewalks, lots) — bias −1e5: always drawn first; flat ground at y ≈ 0 never hides anything
//   RELIEF (ridge, crater, rubble beds) — painter key = a cell's FARTHEST corner, so a figure standing on a cell is
//          drawn after it, while a rim or ridge in front of something still covers it
//   OBJECTS (walls, slabs, wrecks, buildings) — normal mean-depth sort
import {V3, rnd, add3, mul3, norm3, rotAxis, rad} from '../../kit/math';
import {View, Item, MeshItem, Prepped, prep, box, merge, xfMesh, Mesh, Face, mix as mixC, splitLong} from '../engine';
import {PLAN} from './plan';
import {groundH, CLEAR_ZONES, isClear, noise2, FOOT} from './ground';
import {groundGrid, Decal, blobXZ, crackXZ, rebarAt, polyline3, chipsXZ} from './geom';
import {CITY, Bldg, bldgMesh, lodFor, coneMesh} from './city';
import {vanMesh, vanInteriorMesh, VAN_XF, radioMesh, radioFn, RADIO, deathSlabMesh, carMesh, busMesh, girderMesh, columnMeshes, brokenSlab, chunkMesh, beam} from './props';
import {M} from '../timing';

const FLAT_BIAS = -1e5;

// ------------------------------------------------------------------ ground materials
const ridgeMat = (x: number, z: number, slope: number) => {
  const h = groundH(x, z);
  const az = Math.abs(z);
  if (h > 0.35 || x < -8) {
    const n = noise2(x * 0.12, z * 0.12, 71) + 0.35 * noise2(x * 0.35, z * 0.35, 72);
    if (slope > 38) return 'concreteDark';
    if (n > 0.6) return 'concrete';
    if (n < -0.6) return 'rubbleDark';
    if (n > 0.25 && h > 1.5) return 'dust';
    return 'rubble';
  }
  if (x > 9 && az < PLAN.avenue.roadZ) return noise2(x * 0.08, z * 0.08, 73) > 0.5 ? 'asphaltBroken' : 'asphalt';
  if (x > 9 && az < PLAN.avenue.walkZ) return 'sidewalk';
  return noise2(x * 0.3, z * 0.3, 74) > 0.3 ? 'rubbleDark' : 'dirt';
};
const craterMat = (x: number, z: number, slope: number) => {
  const r = Math.hypot(x - PLAN.crater.center.x, z - PLAN.crater.center.z) / PLAN.crater.radius;
  if (r < 0.78) return noise2(x * 0.12, z * 0.12, 81) > 0.35 ? 'dirt' : 'scorched';
  if (r < 1.18) return slope > 30 ? 'rubbleDark' : 'asphaltBroken';
  if (Math.abs(z) > PLAN.avenue.roadZ) return 'sidewalk';
  return 'asphalt';
};

// ------------------------------------------------------------------ decals (street paint, cracks, scorch)
const roadDecals = (x0: number, x1: number): Decal[] => {
  const d: Decal[] = [];
  const crosses = PLAN.crossStreets;
  const inX = (x: number) => !crosses.some((c) => Math.abs(x - c.x) < c.w / 2 + 3.5) && !(x > 40 && x < 86);
  // double yellow centre line (broken where the crater is)
  for (let x = Math.max(16, x0); x < x1; x += 6) {
    if (!inX(x) || !inX(x + 6)) continue;
    d.push({pts: [{x, z: -0.22}, {x: x + 6, z: -0.22}], mat: 'paintY', line: 0.12});
    d.push({pts: [{x, z: 0.22}, {x: x + 6, z: 0.22}], mat: 'paintY', line: 0.12});
  }
  // lane dashes
  for (const lz of [-7.0, 7.0]) for (let x = Math.max(18, x0); x < x1; x += 9) {
    if (!inX(x)) continue;
    d.push({pts: [{x, z: lz}, {x: x + 3, z: lz}], mat: 'paintW', line: 0.13});
  }
  // crosswalks and stop bars at the cross streets
  crosses.forEach((c) => {
    if (c.x < x0 - 20 || c.x > x1 + 20) return;
    for (const side of [-1, 1]) {
      const cx = c.x + side * (c.w / 2 + 2.2);
      for (let z = -13; z < 13; z += 1.4) d.push({pts: [{x: cx - 1.6, z}, {x: cx + 1.6, z}, {x: cx + 1.6, z: z + 0.7}, {x: cx - 1.6, z: z + 0.7}], mat: 'paintW'});
      const sb = c.x + side * (c.w / 2 + 4.6);
      d.push({pts: [{x: sb, z: side < 0 ? 0.3 : -13.6}, {x: sb, z: side < 0 ? 13.6 : -0.3}], mat: 'paintW', line: 0.4});
    }
  });
  // manholes
  for (let x = 30; x < x1; x += 37) if (inX(x) && x >= x0) d.push({pts: blobXZ(x + 3, (rnd(x) - 0.5) * 16, 0.38, x, 10, 0.02), mat: 'manhole'});
  // battle damage near the crater and the ridge: scorch, cracks, stains
  if (x0 < 160) {
    const C = PLAN.crater.center;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + rnd(i) * 0.3;
      const r0 = PLAN.crater.radius * 1.15;
      d.push({pts: crackXZ(C.x + Math.cos(a) * r0, C.z + Math.sin(a) * r0, a, 6 + rnd(i * 3) * 12, i), mat: 'crack', line: 0.07 + rnd(i * 5) * 0.05});
    }
    for (let i = 0; i < 12; i++) {
      const x = 14 + rnd(i * 11) * 130, z = (rnd(i * 13) - 0.5) * 24;
      if (x > 42 && x < 82) continue;
      d.push({pts: blobXZ(x, z, 1.5 + rnd(i * 7) * 3.5, i + 40, 12, 0.5, 1.4, 1), mat: 'scorch'});
    }
    for (let i = 0; i < 26; i++) {
      const x = 14 + rnd(i * 17 + 3) * 140, z = (rnd(i * 19 + 1) - 0.5) * 26;
      d.push({pts: crackXZ(x, z, rnd(i * 23) * 6.28, 2 + rnd(i * 29) * 6, i + 80, 5), mat: 'crack', line: 0.05});
    }
    for (let i = 0; i < 8; i++) d.push({pts: blobXZ(20 + rnd(i * 31) * 120, (rnd(i * 37) - 0.5) * 22, 0.8 + rnd(i) * 1.2, i + 120, 9, 0.6), mat: 'stain'});
  }
  return d;
};

// ------------------------------------------------------------------ static meshes (built once, lazily)
type Static = {item: MeshItem; c: V3; r: number; minPx?: number};
let STATIC: Static[] | null = null;
let FLAT: Static[] | null = null;
let EXTRA: Item[] | null = null;

const meshOf = (m: Prepped, key: string, extra: Partial<MeshItem> = {}): Static => {
  const c = extra.xf?.pos ? add3(m.center, extra.xf.pos) : m.center;
  const sc = typeof extra.xf?.scale === 'number' ? extra.xf.scale : 1;
  return {item: {kind: 'mesh', mesh: m, key, ...extra}, c, r: m.radius * sc};
};

const buildFlat = (): Static[] => {
  const out: Static[] = [];
  const avW = PLAN.avenue.roadZ, wk = PLAN.avenue.walkZ;
  // roadway tiles (except the crater block), coarser with distance
  const segs: [number, number, number][] = [[16, 40, 4], [84, 132, 4], [132, 204, 6], [204, 420, 8], [420, 820, 12], [820, 1400, 20]];
  segs.forEach(([a, b, cell]) => {
    const step = Math.max(cell * 4, 24);
    for (let x = a; x < b - 0.01; x += step) {
      const xe = Math.min(b, x + step);
      const dec = roadDecals(x, xe);
      out.push(meshOf(prep(groundGrid(x, xe, -avW, avW, cell, cell, () => 0, (xx, zz) => (noise2(xx * 0.05, zz * 0.05, 90) > 0.55 ? 'asphaltWorn' : 'asphalt'), dec, {sortKey: 'max', bias: FLAT_BIAS})), `road_${x}`));
      // sidewalks and kerbs both sides (skip intersections)
      for (const side of [-1, 1]) {
        const z0 = side < 0 ? -wk : avW, z1 = side < 0 ? -avW : wk;
        const walkDec: Decal[] = [];
        for (let xx = x; xx < xe; xx += 1.6) walkDec.push({pts: [{x: xx, z: z0 + 0.05}, {x: xx, z: z1 - 0.05}], mat: 'concreteDark', line: 0.03});
        const cut = PLAN.crossStreets.filter((c) => c.x + c.w / 2 > x && c.x - c.w / 2 < xe);
        const pieces: [number, number][] = [];
        let s0 = x;
        cut.forEach((c) => { if (c.x - c.w / 2 > s0) pieces.push([s0, c.x - c.w / 2]); s0 = Math.max(s0, c.x + c.w / 2); });
        if (xe > s0) pieces.push([s0, xe]);
        pieces.forEach(([p0, p1], k) => {
          if (p1 - p0 < 0.5) return;
          out.push(meshOf(prep(groundGrid(p0, p1, z0, z1, Math.min(cell, p1 - p0), z1 - z0, () => 0.15, () => 'sidewalk', walkDec, {sortKey: 'max', bias: FLAT_BIAS + 2000})), `walk_${x}_${side}_${k}`));
          // kerb face toward the road
          const kz = side < 0 ? -avW : avW;
          const kerb: Mesh = {verts: [{x: p0, y: 0, z: kz}, {x: p1, y: 0, z: kz}, {x: p1, y: 0.15, z: kz}, {x: p0, y: 0.15, z: kz}], faces: [{v: side < 0 ? [0, 1, 2, 3] : [1, 0, 3, 2], mat: 'kerb'}], inkBoundary: false, bias: FLAT_BIAS + 1000};
          out.push(meshOf(prep(kerb), `kerb_${x}_${side}_${k}`));
        });
      }
    }
  });
  // lots and the rest of the city's ground: big cells carrying the street grid as paint
  const streetDec: Decal[] = [];
  [...PLAN.crossStreets.map((c) => ({x: c.x, w: c.w})), {x: -120, w: 16}, {x: -260, w: 16}, {x: 560, w: 16}, {x: 700, w: 16}, {x: 860, w: 16}, {x: 1020, w: 16}, {x: 1180, w: 16}, {x: 1340, w: 16}].forEach((c) => {
    streetDec.push({pts: [{x: c.x - c.w / 2, z: -1300}, {x: c.x + c.w / 2, z: -1300}, {x: c.x + c.w / 2, z: 1300}, {x: c.x - c.w / 2, z: 1300}], mat: 'asphalt'});
    streetDec.push({pts: [{x: c.x, z: -1300}, {x: c.x, z: 1300}], mat: 'paintY', line: 0.2, lift: 0.02});
  });
  [90, 170, 250, 330].forEach((z) => [-1, 1].forEach((s) => streetDec.push({pts: [{x: -400, z: s * z - 8}, {x: 3000, z: s * z - 8}, {x: 3000, z: s * z + 8}, {x: -400, z: s * z + 8}], mat: 'asphalt'})));
  const bands: [number, number, number, number][] = [
    [-400, 3000, -1300, -40], [-400, 3000, 40, 1300],
    [-400, -44, -40, -19], [16, 3000, -40, -19], [-400, -44, 19, 40], [16, 3000, 19, 40],
    [-400, -44, -19, 19], [1400, 3000, -19, 19],
  ];
  bands.forEach(([x0, x1, z0, z1], k) => {
    const big = (x1 - x0) * (z1 - z0) > 1e5;
    const cell = big ? 60 : 12;
    const nx = Math.ceil((x1 - x0) / (cell * 6)), nz = Math.ceil((z1 - z0) / (cell * 6));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const a = x0 + ((x1 - x0) * i) / nx, b = x0 + ((x1 - x0) * (i + 1)) / nx, c = z0 + ((z1 - z0) * j) / nz, d = z0 + ((z1 - z0) * (j + 1)) / nz;
      out.push(meshOf(prep(groundGrid(a, b, c, d, cell, cell, () => 0, (xx, zz) => (noise2(xx * 0.01, zz * 0.01, 91) > 0.3 ? 'rubbleDark' : 'asphaltWorn'), streetDec, {sortKey: 'max', bias: FLAT_BIAS - 500})), `band_${k}_${i}_${j}`));
    }
  });
  return out;
};

const ridgeDecals = (): Decal[] => {
  const d: Decal[] = [];
  // scorch on the rubble, dust fans, the burial hollow where the Director lies at the start
  for (let i = 0; i < 9; i++) d.push({pts: blobXZ(-6 + rnd(i * 41) * 16, -16 + rnd(i * 43) * 32, 0.8 + rnd(i * 47) * 1.6, i + 200, 10, 0.5), mat: rnd(i) > 0.5 ? 'scorch' : 'dust'});
  d.push({pts: blobXZ(PLAN.directorBuried.x, PLAN.directorBuried.z, 1.3, 222, 12, 0.35, 1.2, 0.8), mat: 'rubbleDark'});
  // close-shot texture: chips of light dust and dark grit over the crest, the foot and the burial spot
  d.push(...chipsXZ(-8, 12, -16, 16, 1100, 1, ['chipLight', 'chipDark', 'chipMid', 'chipDark']));
  d.push(...chipsXZ(PLAN.deathPos.x - 3, PLAN.deathPos.x + 3, PLAN.deathPos.z - 3, PLAN.deathPos.z + 3, 260, 2, ['chipLight', 'chipDark', 'chipMid']));
  return d;
};

const buildStatic = (): Static[] => {
  const out: Static[] = [];
  // RELIEF: ridge zone and crater zone in tiles (finer near the ridge crest and the death position)
  const rd = ridgeDecals();
  for (let x = -44; x < 16; x += 12) for (let z = -40; z < 40; z += 10) {
    const xe = Math.min(16, x + 12), ze = Math.min(40, z + 10);
    const fine = x > -14 && x < 14 && z > -22 && z < 22;
    const cell = fine ? 1.0 : 1.6;
    out.push(meshOf(prep(groundGrid(x, xe, z, ze, cell, cell, groundH, ridgeMat, rd, {sortKey: 'max', bias: -0.15, crease: 42})), `ridge_${x}_${z}`));
  }
  const C = PLAN.crater;
  const craterDec: Decal[] = [];
  for (let i = 0; i < 7; i++) craterDec.push({pts: blobXZ(C.center.x + (rnd(i * 3) - 0.5) * 18, C.center.z + (rnd(i * 5) - 0.5) * 18, 1 + rnd(i * 7) * 2, i + 300, 10, 0.5), mat: 'scorch'});
  craterDec.push(...chipsXZ(C.center.x - 20, C.center.x + 20, C.center.z - 19, C.center.z + 19, 800, 3, ['chipLight', 'chipDark', 'chipMid']));
  for (let x = 40; x < 86; x += 11.5) for (let z = -19; z < 19; z += 9.5) {
    out.push(meshOf(prep(groundGrid(x, Math.min(86, x + 11.5), z, Math.min(19, z + 9.5), 1.45, 1.45, groundH, craterMat, craterDec, {sortKey: 'max', bias: -0.15, crease: 42})), `crater_${x}_${z}`));
  }

  // RIDGE DEBRIS: broken slabs leaning on the mound (with rebar), chunks, steel beams
  for (let i = 0; i < 22; i++) {
    const s = 400 + i;
    const x = -7 + rnd(s) * 17, z = -19 + rnd(s * 3) * 38;
    if (!isClear(x, z, 1.4)) continue;
    const y = groundH(x, z);
    if (y < 0.4 && x > 8) continue;
    const ang = rnd(s * 5) * Math.PI * 2;
    const U = {x: Math.cos(ang), y: 0, z: Math.sin(ang)};
    const tilt = rad(18 + rnd(s * 7) * 62);
    const V0 = {x: 0, y: 1, z: 0};
    const V = norm3(rotAxis(V0, U, tilt * (rnd(s * 9) > 0.5 ? 1 : -1)));
    const w = 1.8 + rnd(s * 11) * 3.2, h = 1.1 + rnd(s * 13) * 2.2;
    const o = {x: x - U.x * w / 2, y: y - 0.45, z: z - U.z * w / 2};
    out.push(meshOf(prep(brokenSlab(o, U, V, w, h, 0.24 + rnd(s * 17) * 0.18, s)), `rslab_${i}`));
    const topMid = add3(add3(o, mul3(U, w * 0.5)), mul3(V, h * 0.95));
    EXTRA_PUSH.push(...rebarAt(`rreb_${i}`, topMid, norm3(add3(V, mul3(U, 0.3))), 3 + Math.floor(rnd(s * 19) * 3), 0.7 + rnd(s * 23) * 0.8, s));
  }
  for (let i = 0; i < 90; i++) {
    const s = 600 + i;
    const x = -9 + rnd(s) * 22, z = -24 + rnd(s * 3) * 48;
    if (!isClear(x, z, 0.4)) continue;
    const size = 0.35 + Math.pow(rnd(s * 5), 2) * 1.4;
    out.push({...meshOf(chunkMesh(s, rnd(s * 7) > 0.5 ? 'rubble' : 'rubbleDark'), `rch_${i}`, {xf: {pos: {x, y: groundH(x, z) - size * 0.15, z}, yaw: rnd(s * 9) * 360, pitch: (rnd(s * 11) - 0.5) * 30, roll: (rnd(s * 13) - 0.5) * 30, scale: size}}), minPx: 3});
  }
  for (let i = 0; i < 5; i++) {
    const s = 700 + i;
    const x = -5 + rnd(s) * 12, z = -14 + rnd(s * 3) * 28;
    if (!isClear(x, z, 1.5)) continue;
    const a = rnd(s * 5) * Math.PI * 2, L = 4 + rnd(s * 7) * 5;
    const p0 = {x: x - Math.cos(a) * L / 2, y: groundH(x - Math.cos(a) * L / 2, z - Math.sin(a) * L / 2) + 0.1, z: z - Math.sin(a) * L / 2};
    const p1 = {x: x + Math.cos(a) * L / 2, y: groundH(x + Math.cos(a) * L / 2, z + Math.sin(a) * L / 2) + 0.6 + rnd(s * 9) * 1.2, z: z + Math.sin(a) * L / 2};
    out.push(meshOf(prep(beam(p0, p1, 0.32, 0.42, rnd(s) > 0.5 ? 'rust' : 'steelDark')), `rbeam_${i}`));
  }
  // east-foot spill toward the avenue
  for (let i = 0; i < 40; i++) {
    const s = 800 + i;
    const x = 9 + rnd(s) * 18, z = -18 + rnd(s * 3) * 36;
    if (!isClear(x, z, 0.5) || Math.hypot(x - FOOT.x, z - FOOT.z) < FOOT.r + 1.2) continue;
    const size = 0.3 + Math.pow(rnd(s * 5), 2) * 1.1;
    out.push({...meshOf(chunkMesh(s), `sch_${i}`, {xf: {pos: {x, y: groundH(x, z) - size * 0.15, z}, yaw: rnd(s * 9) * 360, pitch: (rnd(s * 11) - 0.5) * 20, scale: size}}), minPx: 3});
  }

  // WEST RUIN: the broken shell the Crew come out of (walls with jagged tops, columns, hanging floors)
  const W = PLAN.westRuin;
  const wall = (a: V3, b: V3, hgt: number, seed: number, key: string) => {
    const U = norm3({x: b.x - a.x, y: 0, z: b.z - a.z});
    const L = Math.hypot(b.x - a.x, b.z - a.z);
    const pts: {u: number; v: number}[] = [{u: 0, v: 0}, {u: L, v: 0}];
    const n = Math.max(4, Math.round(L / 2.2));
    for (let i = n; i >= 0; i--) pts.push({u: (L * i) / n, v: hgt * (0.35 + 0.65 * Math.abs(noise2(i * 0.7, seed, 77)) + (rnd(seed * 31 + i) - 0.5) * 0.25)});
    const ov: V3[][] = [];
    for (let y = 1.2; y < hgt - 1.8; y += 3.4) for (let u = 1.2; u < L - 1.6; u += 2.6) {
      const hv = hgt * (0.35 + 0.65 * Math.abs(noise2((u / L) * n * 0.7, seed, 77)));
      if (y + 1.9 > hv - 0.4) continue;
      const P = (uu: number, vv: number) => ({x: a.x + U.x * uu, y: vv, z: a.z + U.z * uu});
      ov.push([P(u, y), P(u + 1.2, y), P(u + 1.2, y + 1.8), P(u, y + 1.8)]);
    }
    const sl: Mesh = (() => {
      // straight wall slab with the jagged outline, 0.45 m thick, windows as dark overlays on the front (toward +N)
      const Nn = {x: -U.z, y: 0, z: U.x};
      const P3 = (u: number, v: number, d: number) => ({x: a.x + U.x * u + Nn.x * d, y: v, z: a.z + U.z * u + Nn.z * d});
      const nn = pts.length;
      const verts = [...pts.map((p) => P3(p.u, p.v, 0)), ...pts.map((p) => P3(p.u, p.v, -0.45))];
      const faces: Face[] = [{v: pts.map((_, i) => i), mat: 'brickDark', ov: [{polys: ov.map((P) => P.map((q) => ({x: q.x + Nn.x * 0.02, y: q.y, z: q.z + Nn.z * 0.02}))), mat: 'interiorDeep'}]}, {v: pts.map((_, i) => 2 * nn - 1 - i), mat: 'brick'}];
      for (let i = 0; i < nn; i++) { const j = (i + 1) % nn; faces.push({v: [i, nn + i, nn + j, j], mat: 'concreteEdge'}); }
      return orientCaps({verts, faces, crease: 30}, Nn);
    })();
    out.push(meshOf(prep(sl), key));
  };
  wall({x: W.x0, y: 0, z: W.z0}, {x: W.x1 - 3, y: 0, z: W.z0}, W.stumpH * 1.3, 11, 'ruinN');
  wall({x: W.x1 - 2, y: 0, z: W.z1}, {x: W.x0, y: 0, z: W.z1}, W.stumpH * 1.1, 12, 'ruinS');
  wall({x: W.x0, y: 0, z: W.z1}, {x: W.x0, y: 0, z: W.z0}, W.stumpH * 1.6, 13, 'ruinW');
  for (let i = 0; i < 5; i++) {
    const s = 900 + i;
    const x = W.x0 + 3 + rnd(s) * (W.x1 - W.x0 - 6), z = W.z0 + 4 + rnd(s * 3) * (W.z1 - W.z0 - 8);
    const hh = 4 + rnd(s * 5) * 8;
    out.push(meshOf(prep(box({x: x - 0.35, y: 0, z: z - 0.35}, {x: x + 0.35, y: hh, z: z + 0.35}, 'concrete')), `rcol_${i}`));
    EXTRA_PUSH.push(...rebarAt(`rcreb_${i}`, {x, y: hh, z}, {x: 0, y: 1, z: 0}, 4, 1.0, s));
  }
  for (let i = 0; i < 4; i++) {
    const s = 950 + i;
    const x = W.x0 + 5 + rnd(s) * (W.x1 - W.x0 - 10), z = W.z0 + 6 + rnd(s * 3) * (W.z1 - W.z0 - 12);
    const ang = rnd(s * 5) * Math.PI * 2;
    const U = {x: Math.cos(ang), y: 0, z: Math.sin(ang)};
    const V = norm3(rotAxis({x: 0, y: 1, z: 0}, U, rad(55 + rnd(s * 7) * 25)));
    out.push(meshOf(prep(brokenSlab({x, y: 1 + rnd(s * 9) * 2.5, z}, U, V, 5 + rnd(s * 11) * 4, 3 + rnd(s * 13) * 3, 0.3, s)), `rfloor_${i}`));
  }

  // THE VAN + interior, the DEATH SLAB
  out.push(meshOf(vanInteriorMesh(), 'vanIn', {xf: VAN_XF, noInk: true}));
  out.push(meshOf(vanMesh(), 'van', {xf: VAN_XF}));
  out.push(meshOf(deathSlabMesh(), 'deathSlab'));

  // THE CRATER: tilted asphalt plates on the rim, chunks, a burning car, the broken water main
  for (let i = 0; i < 16; i++) {
    const s = 1000 + i;
    const a = (i / 16) * Math.PI * 2 + rnd(s) * 0.3;
    const r = C.radius * (0.95 + rnd(s * 3) * 0.2);
    const x = C.center.x + Math.cos(a) * r, z = C.center.z + Math.sin(a) * r;
    const U = {x: -Math.sin(a), y: 0, z: Math.cos(a)};
    const V = norm3(rotAxis({x: 0, y: 1, z: 0}, U, -rad(55 + rnd(s * 5) * 25)));
    const w = 2.5 + rnd(s * 7) * 3, h = 1.6 + rnd(s * 9) * 2;
    out.push(meshOf(prep(brokenSlab({x: x - U.x * w / 2, y: groundH(x, z) - 0.6, z: z - U.z * w / 2}, U, V, w, h, 0.32, s, 'asphaltBroken', 'rubbleDark')), `cplate_${i}`));
  }
  for (let i = 0; i < 40; i++) {
    const s = 1100 + i;
    const a = rnd(s) * Math.PI * 2, r = C.radius * (0.2 + rnd(s * 3) * 1.2);
    const x = C.center.x + Math.cos(a) * r, z = C.center.z + Math.sin(a) * r;
    const size = 0.35 + Math.pow(rnd(s * 5), 2) * 1.3;
    out.push({...meshOf(chunkMesh(s, 'rubbleDark'), `cch_${i}`, {xf: {pos: {x, y: groundH(x, z) - size * 0.15, z}, yaw: rnd(s * 7) * 360, pitch: (rnd(s * 9) - 0.5) * 30, scale: size}}), minPx: 3});
  }
  out.push(meshOf(prep(carMesh('carGrey', 0.3, true)), 'craterCar', {xf: {pos: {x: 57, y: groundH(57, 4) - 0.1, z: 4}, yaw: 32, roll: 12, pitch: -8}}));
  const pipeA = {x: C.center.x - 10, y: -1.0, z: C.center.z - 9}, pipeB = {x: C.center.x + 5, y: -1.8, z: C.center.z + 6};
  // (long faces cut into ≤1.5 m strips so figures near one end sort correctly against the beam)
  out.push(meshOf(prep(splitLong(merge(beamPipe(pipeA, pipeB), beamPipe({x: pipeB.x + 2, y: -1.5, z: pipeB.z + 2.5}, {x: pipeB.x + 9, y: -0.7, z: pipeB.z + 10})), 1.5)), 'waterMain'));

  // THE GIRDER (north flank) with its columns, the crushed taxi
  out.push(meshOf(girderMesh(), 'girder'));
  columnMeshes().forEach((m, i) => out.push(meshOf(m, `gcol_${i}`)));
  out.push(meshOf(prep(carMesh('taxi', 0.85)), 'taxi', {xf: {pos: {x: 46.5, y: groundH(46.5, -14.2), z: -14.2}, yaw: 75, roll: -6}}));

  // SOUTH FLANK: the spilled facade (panels with windows) and debris; the bus wreck; other wrecks along the avenue
  for (let i = 0; i < 6; i++) {
    const s = 1200 + i;
    const x = 30 + i * 6 + rnd(s) * 3, z = 16.2 + rnd(s * 3) * 2;
    const ang = rad(-10 + rnd(s * 5) * 20);
    const U = {x: Math.cos(ang), y: 0, z: Math.sin(ang)};
    const V = norm3(rotAxis({x: 0, y: 1, z: 0}, U, rad(52 + rnd(s * 7) * 30)));
    const w = 4.5 + rnd(s * 9) * 2.5, h = 3 + rnd(s * 11) * 2.5;
    const sl = brokenSlab({x, y: -0.3, z}, U, V, w, h, 0.35, s, 'brick', 'brickDark');
    // windows on the fallen panel's face
    const wins: V3[][] = [];
    for (let k = 0; k < 2; k++) {
      const uu = 0.8 + k * 2.1, vv = 1.0;
      const P = (du: number, dv: number) => add3(add3({x, y: -0.3, z}, mul3(U, uu + du)), add3(mul3(V, vv + dv), mul3(norm3({x: U.y * V.z - U.z * V.y, y: U.z * V.x - U.x * V.z, z: U.x * V.y - U.y * V.x}), 0.02)));
      if (uu + 1.3 < w) wins.push([P(0, 0), P(1.2, 0), P(1.2, 1.7), P(0, 1.7)]);
    }
    sl.faces[0] = {...sl.faces[0], ov: [{polys: wins, mat: 'interiorDeep'}]};
    out.push(meshOf(prep(sl), `sfacade_${i}`));
  }
  for (let i = 0; i < 30; i++) {
    const s = 1300 + i;
    const x = 28 + rnd(s) * 38, z = 13 + rnd(s * 3) * 7;
    const size = 0.4 + Math.pow(rnd(s * 5), 2) * 1.3;
    out.push({...meshOf(chunkMesh(s, 'brickDark'), `sch2_${i}`, {xf: {pos: {x, y: groundH(x, z) - size * 0.15, z}, yaw: rnd(s * 7) * 360, pitch: (rnd(s * 9) - 0.5) * 30, scale: size}}), minPx: 3});
  }
  out.push(meshOf(prep(busMesh()), 'bus', {xf: {pos: {x: PLAN.bus.pos.x, y: 0, z: PLAN.bus.pos.z}, yaw: PLAN.bus.heading, roll: 4}}));
  const wrecks: [number, number, number, string, number, boolean][] = [
    [24, -9, 140, 'carGrey', 0, true], [31, 6, 60, 'carRed', 0.2, false], [96, -6, 200, 'carGrey', 0.1, true], [118, 10, 10, 'carRed', 0, true],
    [150, -3, 95, 'carGrey', 0, false], [178, 8, 250, 'taxi', 0.3, true], [215, -10, 80, 'carGrey', 0.5, true], [290, 5, 120, 'carRed', 0, true],
    [340, -8, 45, 'carGrey', 0.2, true], [380, 3, 170, 'taxi', 0, false],
  ];
  wrecks.forEach(([x, z, hd, mat, cr, burnt], i) => out.push(meshOf(prep(carMesh(mat, cr, burnt)), `wreck_${i}`, {xf: {pos: {x, y: groundH(x, z), z}, yaw: hd, roll: i % 4 === 0 ? 172 : 0}})));
  // street furniture: lamp posts (some bent), traffic poles, a subway entrance with green globes (NY), hydrants
  for (let i = 0; i < 14; i++) {
    const x = 22 + i * 26, z = i % 2 ? 15.2 : -15.2;
    const bent = rnd(i * 7) < 0.4;
    const top = bent ? {x: x + 1.5, y: 5.2, z: z * 0.85} : {x, y: 7.6, z};
    out.push(meshOf(prep(merge(beam({x, y: 0, z}, top, 0.16, 0.16, 'steelDark'), beam(top, {x: top.x + (bent ? 1.2 : 0), y: top.y + (bent ? -0.6 : 0.3), z: top.z - Math.sign(z) * 1.6}, 0.12, 0.12, 'steelDark'))), `lamp_${i}`));
  }
  const subX = 22, subZ = -16.6;
  out.push(meshOf(prep(merge(
    box({x: subX - 3, y: 0, z: subZ - 1.2}, {x: subX + 3, y: 1.05, z: subZ - 1.0}, 'girder'),
    box({x: subX - 3, y: 0, z: subZ + 1.0}, {x: subX + 3, y: 1.05, z: subZ + 1.2}, 'girder'),
    box({x: subX + 2.8, y: 0, z: subZ - 1.0}, {x: subX + 3.0, y: 1.05, z: subZ + 1.0}, 'girder'),
    box({x: subX - 3.1, y: 0, z: subZ - 1.0}, {x: subX + 2.8, y: 0.06, z: subZ + 1.0}, 'interiorDeep'),
    box({x: subX - 3.05, y: 0, z: subZ - 1.25}, {x: subX - 2.95, y: 2.4, z: subZ - 1.15}, 'girder'),
    box({x: subX - 3.05, y: 0, z: subZ + 1.15}, {x: subX - 2.95, y: 2.4, z: subZ + 1.25}, 'girder'),
  )), 'subway'));
  EXTRA_PUSH.push(globe('globe1', {x: subX - 3, y: 2.55, z: subZ - 1.2}), globe('globe2', {x: subX - 3, y: 2.55, z: subZ + 1.2}));

  // THE FAILING TOWER is animated (see towerItems); its stump persists after the opening
  return out;
};

// the water main (a fat pipe)
const beamPipe = (a: V3, b: V3): Mesh => {
  const p = beam(a, b, 0.9, 0.9, 'rust');
  return p;
};
/** Flip the two cap faces (first two) if their normal disagrees with N (wall slabs built by hand). */
const orientCaps = (m: Mesh, N: V3): Mesh => {
  const nf = (f: Face) => {
    const P = f.v.map((i) => m.verts[i]);
    let n = {x: 0, y: 0, z: 0};
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; n = {x: n.x + (a.y - b.y) * (a.z + b.z), y: n.y + (a.z - b.z) * (a.x + b.x), z: n.z + (a.x - b.x) * (a.y + b.y)}; }
    return n;
  };
  const n0 = nf(m.faces[0]);
  if (n0.x * N.x + n0.y * N.y + n0.z * N.z < 0) m.faces.forEach((f) => f.v.reverse());
  return m;
};
/** Subway globe lamp (green), as a sprite: small, round, glowing a little. */
const globe = (key: string, p: V3): Item => ({
  kind: 'sprite', key, pos: p,
  draw: (c) => {
    const r = Math.max(1.2, 0.24 * c.k);
    return <g><circle cx={c.x} cy={c.y} r={r * 1.9} fill="#7FE0A0" opacity={0.18 * (1 - c.lit.fog)} /><circle cx={c.x} cy={c.y} r={r} fill={mixC('#4FAF6F', c.light.fogColor, c.lit.fog)} stroke={mixC('#162A32', c.light.fogColor, c.lit.fog)} strokeWidth={Math.max(0.6, r * 0.18)} /></g>;
  },
});

let EXTRA_PUSH: Item[] = [];

const getStatic = () => {
  if (!STATIC) {
    EXTRA_PUSH = [];
    STATIC = buildStatic();
    EXTRA = EXTRA_PUSH;
    FLAT = buildFlat();
  }
  return {S: STATIC, F: FLAT!, X: EXTRA!};
};

// ------------------------------------------------------------------ the failing tower
const TW = PLAN.failingTower;
const HINGE = 0.6;
let TOWER: {lower: Prepped; upper: Prepped; stump: Prepped} | null = null;
/** A distinctive setback tower: a broad base, two setbacks, a crown and a spire (so it reads at 700 m). */
const towerBody = (id: string, y0: number, y1: number): Mesh => {
  const W2 = TW.width / 2;
  const tiers: [number, number, number][] = [[0, TW.height * 0.48, 1], [TW.height * 0.48, TW.height * 0.74, 0.78], [TW.height * 0.74, TW.height * 0.92, 0.58]];
  const parts: Mesh[] = [];
  tiers.forEach(([a, b, k], i) => {
    const lo = Math.max(a, y0), hi = Math.min(b, y1);
    if (hi <= lo + 0.5) return;
    const w = W2 * k;
    const bl: Bldg = {id: `${id}${i}`, x0: -w, x1: w, z0: -w, z1: w, h: hi - lo, kind: 'limestone', front: 'W', seed: 77 + i, zone: 'far', storey: 4};
    const m = bldgMesh(bl, 1);
    parts.push(xfMesh({verts: m.verts, faces: m.faces}, {pos: {x: 0, y: lo - y0, z: 0}}));
  });
  if (y1 >= TW.height * 0.92) parts.push(coneMesh(W2 * 0.3, TW.height * 0.12, 6, 'steel', {x: 0, y: TW.height * 0.92 - y0, z: 0}));
  const m = merge(...parts);
  m.crease = 30;
  return m;
};
const towerMeshes = () => {
  if (TOWER) return TOWER;
  const hingeY = TW.height * HINGE;
  const lower = prep(xfMesh(towerBody('TL', 0, hingeY), {pos: TW.base}));
  const upper = prep(towerBody('TU', hingeY, TW.height * 1.05));
  const stumpH = TW.height * 0.4;
  const sb: Bldg = {id: 'TOWERS', x0: -TW.width / 2, x1: TW.width / 2, z0: -TW.width / 2, z1: TW.width / 2, h: stumpH, kind: 'limestone', front: 'W', seed: 79, zone: 'far', storey: 4, crown: {keep: [[0.05, 0.4], [0.62, 0.85]], low: stumpH * 0.72}};
  const st = bldgMesh(sb, 1);
  const stump = prep(xfMesh({verts: st.verts, faces: st.faces, crease: 30}, {pos: TW.base}));
  TOWER = {lower, upper, stump};
  return TOWER;
};
/** Collapse progress: tilt (deg) and drop (m) of the upper section, how far the lower section has crumbled (m). */
export const towerState = (t: number) => {
  const tc = Math.max(0, t - M.LOW_HIT);
  const tilt = Math.min(42, 4 * tc + 1.6 * tc * tc);
  const drop = Math.min(TW.height * 0.5, 2 * tc * tc);
  return {tc, tilt, drop, collapsed: t > M.TITLE_IN + 0.2};
};
const towerItems = (t: number, mode: 'auto' | 'intact' | 'collapsed'): Item[] => {
  const T = towerMeshes();
  const st = towerState(t);
  if (mode === 'collapsed' || (mode === 'auto' && st.collapsed)) return [{kind: 'mesh', mesh: T.stump, key: 'towerStump'}];
  if (mode === 'intact' || st.tc <= 0) {
    return [{kind: 'mesh', mesh: T.lower, key: 'towerL'}, {kind: 'mesh', mesh: T.upper, key: 'towerU', xf: {pos: {x: TW.base.x, y: TW.height * HINGE, z: TW.base.z}}}];
  }
  const hingeY = TW.height * HINGE - st.drop;
  // the lower section crumbles from the top down as the upper mass drives into it
  const lowerTop = TW.height * HINGE - st.drop;
  const lowerFn = (p: V3) => ({...p, y: Math.min(p.y, lowerTop)});
  // the upper section pivots about its south-west base edge (falls toward the city's south-west) and sinks
  const pivotLocal = {x: -TW.width / 2, y: 0, z: TW.width / 2};
  const axis = norm3({x: 1, y: 0, z: 1});
  const a = rad(st.tilt);
  const upperFn = (p: V3) => {
    const q = {x: p.x - pivotLocal.x, y: p.y - pivotLocal.y, z: p.z - pivotLocal.z};
    const r = rotAxis(q, axis, a);
    return {x: TW.base.x + pivotLocal.x + r.x, y: hingeY + pivotLocal.y + r.y, z: TW.base.z + pivotLocal.z + r.z};
  };
  return [
    {kind: 'mesh', mesh: T.lower, key: 'towerL', fn: lowerFn, noCull: true},
    {kind: 'mesh', mesh: T.upper, key: 'towerU', fn: upperFn, noCull: true},
  ];
};

// ------------------------------------------------------------------ the radio
/** The radio as items (dial light 0..1 crossfades the dial material). */
export const radioItems = (on: number): Item[] => [
  {kind: 'mesh', mesh: radioMesh(on > 0.5), key: 'radio', fn: radioFn, noCull: true, asObject: true, bias: 0.05},
  polyline3('radioAnt', [RADIO.antennaBase, RADIO.antennaTip], 0.006, '#B8B2AA', {minPx: 0.8, ink: '#162A32', inkW: 1.0}),
  ...(on > 0.02 ? [{
    kind: 'sprite' as const, key: 'radioGlow', pos: RADIO.dial, bias: 0.1,
    draw: (c: {x: number; y: number; k: number}) => <circle cx={c.x} cy={c.y} r={Math.max(2, 0.16 * c.k)} fill="#FFD27A" opacity={0.28 * on} />,
  }] : []),
];

// ------------------------------------------------------------------ assembly
export type SetOpts = {
  /** failing tower: 'auto' (intact → collapsing from M.LOW_HIT → stump after the title) */
  tower?: 'auto' | 'intact' | 'collapsed';
  /** radio dial light 0..1 (0 = off) */
  radioOn?: number;
  /** skip groups: 'city' | 'far' | 'flat' | 'relief' | 'debris' | 'van' | 'radio' | 'tower' | 'girder' | 'wrecks' */
  skip?: string[];
  /** extra culling distance for small objects (m); default automatic */
  maxDist?: number;
};

const groupOf = (key: string) => {
  if (key.startsWith('ridge_') || key.startsWith('crater_')) return 'relief';
  if (key.startsWith('road_') || key.startsWith('walk_') || key.startsWith('kerb_') || key.startsWith('band_')) return 'flat';
  if (key === 'van' || key === 'vanIn') return 'van';
  if (key.startsWith('girder') || key.startsWith('gcol') || key === 'taxi') return 'girder';
  if (key.startsWith('wreck') || key === 'bus' || key === 'craterCar') return 'wrecks';
  return 'debris';
};

export const setItems = (view: View, t: number, o: SetOpts = {}): Item[] => {
  const {S, F, X} = getStatic();
  const skip = new Set(o.skip ?? []);
  const cam = view.pos;
  const items: Item[] = [];
  const push = (s: Static) => {
    const g = groupOf(s.item.key ?? '');
    if (skip.has(g)) return;
    const d = Math.hypot(s.c.x - cam.x, s.c.y - cam.y, s.c.z - cam.z);
    if (s.minPx && (s.r * 2 * view.focal) / Math.max(1, d) < s.minPx) return;
    if (o.maxDist && d - s.r > o.maxDist && g !== 'flat') return;
    items.push(s.item);
  };
  if (!skip.has('flat')) F.forEach(push);
  S.forEach(push);
  if (!skip.has('debris')) X.forEach((it) => {
    if (it.kind !== 'sprite') { items.push(it); return; }
    const d = Math.hypot(it.pos.x - cam.x, it.pos.y - cam.y, it.pos.z - cam.z);
    if (d < 160) items.push(it);
  });
  if (!skip.has('radio')) items.push(...radioItems(o.radioOn ?? 0));
  if (!skip.has('tower')) items.push(...towerItems(t, o.tower ?? 'auto'));
  // the city with LOD; blocks behind the frontage only when the camera is high enough to see them
  if (!skip.has('city')) {
    const low = cam.y < 26;
    CITY().forEach((b) => {
      if (skip.has('far') && b.zone === 'far') return;
      const c = {x: (b.x0 + b.x1) / 2, y: b.h / 2, z: (b.z0 + b.z1) / 2};
      const d = Math.hypot(c.x - cam.x, c.y - cam.y, c.z - cam.z);
      if (low && b.zone === 'block' && b.h < 46 && d > 90 && Math.abs(cam.z) < 30) return;
      if (d > 4200) return;
      items.push({kind: 'mesh', mesh: bldgMesh(b, lodFor(b, d)), key: `bl_${b.id}`});
    });
  }
  return items;
};

/** Everything a shot needs to stand on the set (re-exported for convenience). */
export {groundH, RADIO, VAN_XF, CLEAR_ZONES};
export {towerItems};
export const _debug = {getStatic};
