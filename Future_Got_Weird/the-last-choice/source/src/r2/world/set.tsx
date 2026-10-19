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
import {PLAN, STREET_OBSTACLES, A1_EVENTS, FIRE_SITES} from './plan';
import {groundH, CLEAR_ZONES, isClear, noise2, FOOT} from './ground';
import {groundGrid, Decal, blobXZ, crackXZ, rebarAt, polyline3, chipsXZ, splitPlanar, splitPlanar2} from './geom';
import {CITY, Bldg, bldgMesh, lodFor, coneMesh, bldgSteel, facadePanel, openingFor, wallFrame, wallPoint} from './city';
import {vanMesh, vanInteriorMesh, VAN_XF, radioMesh, radioFn, RADIO, deathSlabMesh, carMesh, busMesh, girderMesh, girderMeshMid, girderMeshFar, vehicleFar, vanMeshWhole, columnMeshes, brokenSlab, chunkMesh, beam, truckMesh, fallenSignal, dumpsterMesh, boxBin, hydrantMesh} from './props';
import {M} from '../timing';
import {lodWindowAt, envelopeDist, minDistTo} from './lodwin';

const FLAT_BIAS = -1e5;
/** (R4) thin sprites (wires, rebar) are drawn within 160 m of the lens and fade out over the last 50 m instead of vanishing */
const SPRITE_FADE: [number, number] = [110, 160];
/** the same for the twisted steel at broken buildings (drawn within 330 m) */
const STEEL_FADE: [number, number] = [240, 330];

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
type Static = {item: MeshItem; c: V3; r: number; minPx?: number; /** cheaper versions by camera distance: each `item` is used beyond its `d` (ascending) */ lods?: {d: number; item: MeshItem}[]};
let STATIC: Static[] | null = null;
let FLAT: Static[] | null = null;
let EXTRA: Item[] | null = null;

/**
 * A piece people stand next to: finely split within NEAR m of the camera (every close shot and the first wides of F1), whole beyond — the cuts
 * only matter where a figure can be beside it on screen at a size where the order shows, and they cost faces.
 */
const NEAR = 60;
const splitNear = (whole: Mesh, split: (m: Mesh) => Mesh, key: string, extra: Partial<MeshItem> = {}): Static => {
  const near = meshOf(prep(split(whole)), key, extra);
  return {...near, lods: [{d: NEAR, item: {...near.item, mesh: prep(whole)}}]};
};
const meshOf = (m: Prepped, key: string, extra: Partial<MeshItem> = {}): Static => {
  const c = extra.xf?.pos ? add3(m.center, extra.xf.pos) : m.center;
  const sc = typeof extra.xf?.scale === 'number' ? extra.xf.scale : 1;
  return {item: {kind: 'mesh', mesh: m, key, ...extra}, c, r: m.radius * sc};
};

/**
 * (R4) Seat a slab on the ground: the slab's origin height at (x, z) that puts its lowest vertex `sink` m below the terrain there
 * (broken pieces lie IN the rubble, not on top of it). `o` is returned as the origin to pass to brokenSlab with the same
 * arguments.
 */
const seatSlab = (x: number, z: number, U: V3, V: V3, w: number, h: number, thick: number, seed: number, sink: number): V3 => {
  const probe = brokenSlab({x, y: 0, z}, U, V, w, h, thick, seed);
  const low = Math.min(...probe.verts.map((q) => q.y - groundH(q.x, q.z)));
  return {x, y: -sink - low, z};
};

/** the ruin's free-standing columns and the broken floors placed so far (a floor must not pass through either) */
const RUIN_COLS: {x: number; z: number; h: number}[] = [];
const FLOORS: Mesh[] = [];
/** is p inside the closed mesh m? (ray cast straight up through the faces' fans) */
const insideMesh = (m: Mesh, p: V3): boolean => {
  let hits = 0;
  for (const f of m.faces) {
    const P = f.v.map((i) => m.verts[i]);
    for (let k = 1; k + 1 < P.length; k++) {
      const a = P[0], b = P[k], c = P[k + 1];
      const d = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
      if (Math.abs(d) < 1e-9) continue;
      const u = ((p.x - a.x) * (c.z - a.z) - (p.z - a.z) * (c.x - a.x)) / d, v = ((b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x)) / d;
      if (u < 0 || v < 0 || u + v > 1) continue;
      if (a.y + u * (b.y - a.y) + v * (c.y - a.y) > p.y) hits++;
    }
  }
  return hits % 2 === 1;
};
/** does the slab mesh have a vertex inside another slab (or the other way round), or does a column stand through it? */
const slabConflict = (m: Mesh, others: Mesh[], cols: {x: number; z: number; h: number}[]): boolean =>
  others.some((o) => m.verts.some((v) => insideMesh(o, v)) || o.verts.some((v) => insideMesh(m, v))) ||
  cols.some((c) => [[-0.35, -0.35], [0.35, -0.35], [0.35, 0.35], [-0.35, 0.35], [0, 0]].some(([dx, dz]) => [0.5, c.h * 0.5, c.h - 0.2].some((y) => insideMesh(m, {x: c.x + dx, y, z: c.z + dz}))) ||
    m.verts.some((v) => Math.abs(v.x - c.x) < 0.35 && Math.abs(v.z - c.z) < 0.35 && v.y > 0 && v.y < c.h));

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
    const th = 0.24 + rnd(s * 17) * 0.18;
    let o = {x: x - U.x * w / 2, y: y - 0.45, z: z - U.z * w / 2};
    // (R4) a slab whose low edge hangs more than 0.25 m over a dip in the mound (rslab_19: 0.57 m) is settled into it
    const contact = (oo: V3) => { const g = brokenSlab(oo, U, V, w, h, th, s).verts.map((q) => q.y - groundH(q.x, q.z)).sort((a, b) => a - b); return g[Math.floor(g.length / 3)]; };
    const c0 = contact(o);
    if (c0 > 0.25) o = {...o, y: o.y - (c0 - 0.05)};
    // (R3) 0.6 m strips across the slab: the Crew climb, crouch and stand beside these on the ridge
    out.push(splitNear(brokenSlab(o, U, V, w, h, th, s), (m) => splitPlanar2(m, 0.6, U), `rslab_${i}`));
    const topMid = add3(add3(o, mul3(U, w * 0.5)), mul3(V, h * 0.95));
    // (R3: slab 15, 3–4 m south of the death seat, keeps no rebar: on F1's crane-up its strands crossed the pilot and the
    // Director for 3 s)
    if (i !== 15) EXTRA_PUSH.push(...rebarAt(`rreb_${i}`, topMid, norm3(add3(V, mul3(U, 0.3))), 3 + Math.floor(rnd(s * 19) * 3), 0.7 + rnd(s * 23) * 0.8, s, SPRITE_FADE));
  }
  for (let i = 0; i < 90; i++) {
    const s = 600 + i;
    const x = -9 + rnd(s) * 22, z = -24 + rnd(s * 3) * 48;
    if (!isClear(x, z, 0.4)) continue;
    const size = 0.35 + Math.pow(rnd(s * 5), 2) * 1.4;
    out.push({...meshOf(chunkMesh(s, rnd(s * 7) > 0.5 ? 'rubble' : 'rubbleDark', size > 1.0), `rch_${i}`, {xf: {pos: {x, y: groundH(x, z) - size * 0.15, z}, yaw: rnd(s * 9) * 360, pitch: (rnd(s * 11) - 0.5) * 30, roll: (rnd(s * 13) - 0.5) * 30, scale: size}}), minPx: 3});
  }
  for (let i = 0; i < 5; i++) {
    const s = 700 + i;
    const x = -5 + rnd(s) * 12, z = -14 + rnd(s * 3) * 28;
    if (!isClear(x, z, 1.5)) continue;
    const a = rnd(s * 5) * Math.PI * 2, L = 4 + rnd(s * 7) * 5;
    const p0 = {x: x - Math.cos(a) * L / 2, y: groundH(x - Math.cos(a) * L / 2, z - Math.sin(a) * L / 2) + 0.1, z: z - Math.sin(a) * L / 2};
    const p1 = {x: x + Math.cos(a) * L / 2, y: groundH(x + Math.cos(a) * L / 2, z + Math.sin(a) * L / 2) + 0.6 + rnd(s * 9) * 1.2, z: z + Math.sin(a) * L / 2};
    out.push(splitNear(beam(p0, p1, 0.32, 0.42, rnd(s) > 0.5 ? 'rust' : 'steelDark'), (m) => splitLong(m, 0.8), `rbeam_${i}`));
  }
  // east-foot spill toward the avenue
  for (let i = 0; i < 40; i++) {
    const s = 800 + i;
    const x = 9 + rnd(s) * 18, z = -18 + rnd(s * 3) * 36;
    if (!isClear(x, z, 0.5) || Math.hypot(x - FOOT.x, z - FOOT.z) < FOOT.r + 1.2) continue;
    const size = 0.3 + Math.pow(rnd(s * 5), 2) * 1.1;
    out.push({...meshOf(chunkMesh(s, 'rubble', size > 1.0), `sch_${i}`, {xf: {pos: {x, y: groundH(x, z) - size * 0.15, z}, yaw: rnd(s * 9) * 360, pitch: (rnd(s * 11) - 0.5) * 20, scale: size}}), minPx: 3});
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
    // (R3) cut into 1 m strips along the wall (the Crew pass in front of and behind these walls: each strip sorts
    // by its own depth instead of the middle of a 44 m face); windows are clipped to their strips
    out.push(meshOf(prep(splitPlanar(sl, 1.0, U)), key));
  };
  wall({x: W.x0, y: 0, z: W.z0}, {x: W.x1 - 3, y: 0, z: W.z0}, W.stumpH * 1.3, 11, 'ruinN');
  wall({x: W.x1 - 2, y: 0, z: W.z1}, {x: W.x0, y: 0, z: W.z1}, W.stumpH * 1.1, 12, 'ruinS');
  wall({x: W.x0, y: 0, z: W.z1}, {x: W.x0, y: 0, z: W.z0}, W.stumpH * 1.6, 13, 'ruinW');
  for (let i = 0; i < 5; i++) {
    const s = 900 + i;
    const x = W.x0 + 3 + rnd(s) * (W.x1 - W.x0 - 6), z = W.z0 + 4 + rnd(s * 3) * (W.z1 - W.z0 - 8);
    const hh = 4 + rnd(s * 5) * 8;
    RUIN_COLS.push({x, z, h: hh});
    out.push(meshOf(prep(box({x: x - 0.35, y: 0, z: z - 0.35}, {x: x + 0.35, y: hh, z: z + 0.35}, 'concrete')), `rcol_${i}`));
    EXTRA_PUSH.push(...rebarAt(`rcreb_${i}`, {x, y: hh, z}, {x: 0, y: 1, z: 0}, 4, 1.0, s, SPRITE_FADE));
  }
  // (R4) the four broken floors in the ruin hovered 0.3–2.7 m above the rubble bed (rfloor_3 was the "floating rock" of B5–D1:
  // its height was an absolute 1–3.5 m whatever the ground under it was). Each now lies with its low edge buried in the bed and
  // leans up at ≤ ~20°; its raised part rests on stacks of broken pieces standing on the ground (the same random draws as R3:
  // place, direction, size; only the height and the lean angle are seated).
  for (let i = 0; i < 4; i++) {
    const s = 950 + i;
    const x = W.x0 + 5 + rnd(s) * (W.x1 - W.x0 - 10), z = W.z0 + 6 + rnd(s * 3) * (W.z1 - W.z0 - 12);
    const ang = rnd(s * 5) * Math.PI * 2;
    const U = {x: Math.cos(ang), y: 0, z: Math.sin(ang)};
    const w = 5 + rnd(s * 11) * 4, h = 3 + rnd(s * 13) * 3;
    const tilt = Math.max(55 + rnd(s * 7) * 25, (Math.acos(Math.min(1, 1.2 / h)) * 180) / Math.PI); // the raised end is ≤ 1.2 m above the low edge
    const V = norm3(rotAxis({x: 0, y: 1, z: 0}, U, rad(tilt)));
    // (and clear of the other floors and of the ruin's columns: slid along its own length until nothing of one is inside the other)
    let o = seatSlab(x, z, U, V, w, h, 0.3, s, 0.12), mesh = brokenSlab(o, U, V, w, h, 0.3, s), cut = splitPlanar2(mesh, 0.8, U);
    for (let k = 1; k < 14 && slabConflict(cut, FLOORS, RUIN_COLS); k++) {
      const dx = Math.ceil(k / 2) * 0.6 * (k % 2 ? 1 : -1);
      o = seatSlab(x + U.x * dx, z + U.z * dx, U, V, w, h, 0.3, s, 0.12);
      mesh = brokenSlab(o, U, V, w, h, 0.3, s);
      cut = splitPlanar2(mesh, 0.8, U);
    }
    FLOORS.push(cut);
    out.push(splitNear(mesh, (m) => splitPlanar2(m, 0.8, U), `rfloor_${i}`));
    // supports under the raised part (fractions of the slab's width and height, on its underside): stacks of broken pieces
    // standing on the ground, as many as the gap needs, the top one meeting the slab
    ([[0.32, 0.62], [0.7, 0.62], [0.5, 0.78]] as [number, number][]).forEach(([fu, fv], k) => {
      const P = add3(add3(o, mul3(U, fu * w)), mul3(V, fv * h));
      const g0 = groundH(P.x, P.z);
      let y = g0 - 0.12;
      // (a stack under this floor that would stand inside another floor is left out)
      if (FLOORS.some((F) => F !== cut && insideMesh(F, {x: P.x, y: (y + P.y) / 2, z: P.z}))) return;
      for (let j = 0; j < 8 && y < P.y - 0.18; j++) {
        const sd = s * 31 + k * 7 + j, piece = chunkMesh(sd, j % 2 ? 'concreteDark' : 'rubble');
        const top = piece.verts.slice(piece.verts.length / 2).reduce((m, q) => m + q.y, 0) / (piece.verts.length / 2);
        const sc = 1.15 + rnd(sd * 3) * 0.4;
        const st = meshOf(piece, `rfsup_${i}_${k}_${j}`, {xf: {pos: {x: P.x + (rnd(sd * 11) - 0.5) * 0.3, y, z: P.z + (rnd(sd * 13) - 0.5) * 0.3}, yaw: rnd(sd * 5) * 360, scale: sc}});
        out.push({...st, minPx: 3});
        y += top * sc * 0.92;
      }
    });
  }

  // THE VAN + interior, the DEATH SLAB
  out.push(meshOf(vanInteriorMesh(), 'vanIn', {xf: VAN_XF, noInk: true}));
  out.push({...meshOf(vanMesh(), 'van', {xf: VAN_XF}), lods: [{d: NEAR, item: {kind: 'mesh', mesh: vanMeshWhole(), key: 'van', xf: VAN_XF}}]});
  out.push(meshOf(deathSlabMesh(), 'deathSlab'));

  // THE CRATER: tilted asphalt plates on the rim, chunks, a burning car, the broken water main
  for (let i = 0; i < 16; i++) {
    const s = 1000 + i;
    const a = (i / 16) * Math.PI * 2 + rnd(s) * 0.3;
    const r = C.radius * (0.95 + rnd(s * 3) * 0.2);
    const x = C.center.x + Math.cos(a) * r, z = C.center.z + Math.sin(a) * r;
    // (R3) no plate through the girder's column, nor into the north frontage
    if (Math.hypot(x - PLAN.girder.to.x, z - PLAN.girder.to.z) < 4.2 || z < -PLAN.avenue.walkZ + 3.2) continue;
    // (R3) none on the west rim where the Crew fight (D1–D3 walked through plates 7–9: tools/r3/city_check.mjs 'crew')
    if (i >= 7 && i <= 9) continue;
    const U = {x: -Math.sin(a), y: 0, z: Math.cos(a)};
    const V = norm3(rotAxis({x: 0, y: 1, z: 0}, U, -rad(55 + rnd(s * 5) * 25)));
    const w = 2.5 + rnd(s * 7) * 3, h = 1.6 + rnd(s * 9) * 2;
    // (R3) 0.6 m strips: the fighting happens on and around the rim
    out.push(splitNear(brokenSlab({x: x - U.x * w / 2, y: groundH(x, z) - 0.6, z: z - U.z * w / 2}, U, V, w, h, 0.32, s, 'asphaltBroken', 'rubbleDark'), (m) => splitPlanar2(m, 0.6, U), `cplate_${i}`));
  }
  for (let i = 0; i < 40; i++) {
    const s = 1100 + i;
    const a = rnd(s) * Math.PI * 2, r = C.radius * (0.2 + rnd(s * 3) * 1.2);
    const x = C.center.x + Math.cos(a) * r, z = C.center.z + Math.sin(a) * r;
    const size = 0.35 + Math.pow(rnd(s * 5), 2) * 1.3;
    out.push({...meshOf(chunkMesh(s, 'rubbleDark', size > 1.0), `cch_${i}`, {xf: {pos: {x, y: groundH(x, z) - size * 0.15, z}, yaw: rnd(s * 7) * 360, pitch: (rnd(s * 9) - 0.5) * 30, scale: size}}), minPx: 3});
  }
  out.push(meshOf(prep(carMesh('carGrey', 0.3, true)), 'craterCar', {xf: {pos: {x: 57, y: groundH(57, 4) - 0.1, z: 4}, yaw: 32, roll: 12, pitch: -8}}));
  const pipeA = {x: C.center.x - 10, y: -1.0, z: C.center.z - 9}, pipeB = {x: C.center.x + 5, y: -1.8, z: C.center.z + 6};
  // (long faces cut into ≤1.5 m strips so figures near one end sort correctly against the beam)
  out.push(splitNear(splitLong(merge(beamPipe(pipeA, pipeB), beamPipe({x: pipeB.x + 2, y: -1.5, z: pipeB.z + 2.5}, {x: pipeB.x + 9, y: -0.7, z: pipeB.z + 10})), 1.5), (m) => splitLong(m, 0.6), 'waterMain'));

  // THE GIRDER (north flank) with its columns, the crushed taxi
  out.push({...meshOf(girderMesh(), 'girder'), lods: [{d: NEAR, item: {kind: 'mesh', mesh: girderMeshMid(), key: 'girder'}}, {d: 110, item: {kind: 'mesh', mesh: girderMeshFar(), key: 'girder'}}]});
  columnMeshes().forEach((m, i) => out.push(meshOf(m, `gcol_${i}`)));
  out.push(meshOf(prep(carMesh('taxi', 0.85)), 'taxi', {xf: {pos: {x: 46.5, y: groundH(46.5, -14.2), z: -14.2}, yaw: 75, roll: -6}}));

  // SOUTH FLANK: the spilled facade (panels with windows) and debris; the bus wreck; other wrecks along the avenue
  for (let i = 0; i < 6; i++) {
    const s = 1200 + i;
    const x = 30 + i * 6 + rnd(s) * 3, z = 16.2 + rnd(s * 3) * 2;
    const ang = rad(-10 + rnd(s * 5) * 20);
    const U = {x: Math.cos(ang), y: 0, z: Math.sin(ang)};
    // (R3) fallen OUTWARD: lying over the sidewalk with their tops toward the street (R2 tilted them into the wall)
    const V = norm3(rotAxis({x: 0, y: 1, z: 0}, U, -rad(58 + rnd(s * 7) * 24)));
    const w = 4.5 + rnd(s * 9) * 2.5, h = 3 + rnd(s * 11) * 2.5;
    const sl = brokenSlab({x, y: -0.3, z: z + 0.9}, U, V, w, h, 0.35, s, 'brick', 'brickDark');
    // windows on the fallen panel's face
    const wins: V3[][] = [];
    for (let k = 0; k < 2; k++) {
      const uu = 0.8 + k * 2.1, vv = 1.0;
      const P = (du: number, dv: number) => add3(add3({x, y: -0.3, z: z + 0.9}, mul3(U, uu + du)), add3(mul3(V, vv + dv), mul3(norm3({x: U.y * V.z - U.z * V.y, y: U.z * V.x - U.x * V.z, z: U.x * V.y - U.y * V.x}), 0.02)));
      if (uu + 1.3 < w) wins.push([P(0, 0), P(1.2, 0), P(1.2, 1.7), P(0, 1.7)]);
    }
    sl.faces[0] = {...sl.faces[0], ov: [{polys: wins, mat: 'interiorDeep'}]};
    out.push(splitNear(sl, (m) => splitPlanar2(m, 0.8, U), `sfacade_${i}`));
  }
  for (let i = 0; i < 30; i++) {
    const s = 1300 + i;
    const x = 28 + rnd(s) * 38, z = 13 + rnd(s * 3) * 7;
    const size = 0.4 + Math.pow(rnd(s * 5), 2) * 1.3;
    out.push({...meshOf(chunkMesh(s, 'brickDark', size > 1.0), `sch2_${i}`, {xf: {pos: {x, y: groundH(x, z) - size * 0.15, z}, yaw: rnd(s * 7) * 360, pitch: (rnd(s * 9) - 0.5) * 30, scale: size}}), minPx: 3});
  }
  out.push(meshOf(prep(busMesh()), 'bus', {xf: {pos: {x: PLAN.bus.pos.x, y: 0, z: PLAN.bus.pos.z}, yaw: PLAN.bus.heading, roll: 4}}));
  // the wrecks and abandoned vehicles: one list (plan.ts STREET_OBSTACLES) for the set and for the formations' lanes.
  // (R3) a car on its roof now rests ON its roof (R2's 172° roll sank the whole body under the asphalt)
  STREET_OBSTACLES.forEach((o) => {
    if (o.kind !== 'car' && o.kind !== 'taxi' && o.kind !== 'truck') return;
    const m = o.kind === 'truck' ? truckMesh(o.burnt) : carMesh(o.mat ?? 'carGrey', o.crushed ?? 0, o.burnt, o.doorOpen);
    const mid = o.kind === 'truck' ? m : carMesh(o.mat ?? 'carGrey', o.crushed ?? 0, o.burnt, o.doorOpen, false);
    const top = o.kind === 'truck' ? 3.4 : 0.92 + 0.62 * (1 - 0.75 * (o.crushed ?? 0));
    const xf = {pos: {x: o.x, y: groundH(o.x, o.z) + (o.flipped ? top - 0.08 : 0), z: o.z}, yaw: o.heading, roll: o.flipped ? 172 : 0};
    const far: MeshItem = {kind: 'mesh', mesh: prep(vehicleFar(o.kind === 'truck' ? 'truck' : 'car', o.mat ?? 'carGrey', o.burnt)), key: o.id, xf};
    out.push({...meshOf(prep(m), o.id, {xf}), minPx: 3, lods: [{d: NEAR, item: {kind: 'mesh', mesh: prep(mid), key: o.id, xf}}, {d: 120, item: far}]});
  });
  dressing(out);
  // street furniture: lamp posts (some bent), traffic poles, a subway entrance with green globes (NY), hydrants
  for (let i = 0; i < 14; i++) {
    const x = 22 + i * 26, z = i % 2 ? 15.2 : -15.2;
    const bent = rnd(i * 7) < 0.4;
    const top = bent ? {x: x + 1.5, y: 5.2, z: z * 0.85} : {x, y: 7.6, z};
    out.push(meshOf(prep(merge(beam({x, y: 0, z}, top, 0.16, 0.16, 'steelDark'), beam(top, {x: top.x + (bent ? 1.2 : 0), y: top.y + (bent ? -0.6 : 0.3), z: top.z - Math.sign(z) * 1.6}, 0.12, 0.12, 'steelDark'))), `lamp_${i}`));
  }
  const subX = 22, subZ = -16.6;
  out.push(meshOf(prep(splitLong(merge(
    box({x: subX - 3, y: 0, z: subZ - 1.2}, {x: subX + 3, y: 1.05, z: subZ - 1.0}, 'girder'),
    box({x: subX - 3, y: 0, z: subZ + 1.0}, {x: subX + 3, y: 1.05, z: subZ + 1.2}, 'girder'),
    box({x: subX + 2.8, y: 0, z: subZ - 1.0}, {x: subX + 3.0, y: 1.05, z: subZ + 1.0}, 'girder'),
    box({x: subX - 3.1, y: 0, z: subZ - 1.0}, {x: subX + 2.8, y: 0.06, z: subZ + 1.0}, 'interiorDeep'),
    box({x: subX - 3.05, y: 0, z: subZ - 1.25}, {x: subX - 2.95, y: 2.4, z: subZ - 1.15}, 'girder'),
    box({x: subX - 3.05, y: 0, z: subZ + 1.15}, {x: subX - 2.95, y: 2.4, z: subZ + 1.25}, 'girder'),
  ), 0.8)), 'subway'));
  EXTRA_PUSH.push(globe('globe1', {x: subX - 3, y: 2.55, z: subZ - 1.2}), globe('globe2', {x: subX - 3, y: 2.55, z: subZ + 1.2}));

  // THE FAILING TOWER is animated (see towerItems); its stump persists after the opening
  return out;
};

// ------------------------------------------------------------------ (R3) street dressing
/** heading → the yaw that lays a mesh's local +z along it */
const along = (h: number) => h + 180;
/**
 * Detail in distinct clusters, densest away from the fighting: heaps the machines pushed to the kerbs at the cross
 * streets they hold, toppled signal masts, a fallen lamp post, dumpsters, hydrants, bins, and power / phone lines
 * across the avenue (some snapped and hanging). Nothing stands in the formations' lanes (tools/r3/city_check.mjs).
 */
const dressing = (out: Static[]) => {
  // heaps: broken slabs leaning together, chunks, and (x1) a car shoved onto its side
  const heap = (key: string, x: number, z: number, r: number, seed: number, carMat?: string) => {
    for (let i = 0; i < 4; i++) {
      const sd = seed * 13 + i;
      const a = rnd(sd) * Math.PI * 2;
      const U = {x: Math.cos(a), y: 0, z: Math.sin(a)};
      const V = norm3(rotAxis({x: 0, y: 1, z: 0}, U, rad(25 + rnd(sd * 3) * 45) * (rnd(sd * 5) < 0.5 ? 1 : -1)));
      const w = 1.6 + rnd(sd * 7) * 2.2, h = 1.0 + rnd(sd * 9) * 1.4;
      const px = x + (rnd(sd * 11) - 0.5) * r, pz = z + (rnd(sd * 17) - 0.5) * r;
      out.push(meshOf(prep(brokenSlab({x: px - U.x * w / 2, y: groundH(px, pz) - 0.3, z: pz - U.z * w / 2}, U, V, w, h, 0.25, sd, i % 2 ? 'concrete' : 'asphaltBroken', 'rubbleDark')), `${key}_s${i}`));
    }
    for (let i = 0; i < 12; i++) {
      const sd = seed * 31 + i;
      const a = rnd(sd) * Math.PI * 2, rr = r * Math.sqrt(rnd(sd * 3));
      const px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr, size = 0.4 + Math.pow(rnd(sd * 5), 2) * 1.2;
      out.push({...meshOf(chunkMesh(sd, i % 3 ? 'rubbleDark' : 'concreteDark'), `${key}_c${i}`, {xf: {pos: {x: px, y: groundH(px, pz) - size * 0.15, z: pz}, yaw: rnd(sd * 7) * 360, pitch: (rnd(sd * 9) - 0.5) * 30, scale: size}}), minPx: 2});
    }
    if (carMat) out.push(meshOf(prep(carMesh(carMat, 0.4, true)), `${key}_car`, {xf: {pos: {x: x + 0.4, y: 0.88, z: z - 0.2}, yaw: 8, roll: 84}}));
  };
  heap('pile_x1', 118.2, 25, 3.2, 41, 'carGrey');
  heap('pile_x2', 248.5, -16.4, 2.0, 42);
  // the FN6 / FS9 / FN12 breaches dropped their floors on the sidewalk below
  heap('pile_fn6', 171.5, -16.2, 2.0, 43);
  heap('pile_fs9', 332.5, 16.2, 2.0, 44);
  // toppled traffic-signal masts at the corners of the held intersections (on the sidewalks)
  out.push(meshOf(prep(fallenSignal(7.5, 1)), 'util_sig1', {xf: {pos: {x: 134.6, y: 0.15, z: -15.2}, yaw: along(90)}}));
  out.push(meshOf(prep(fallenSignal(7.0, 2)), 'util_sig2', {xf: {pos: {x: 252.6, y: 0.15, z: 15.6}, yaw: along(268)}}));
  out.push(meshOf(prep(fallenSignal(6.5, 3)), 'util_sig3', {xf: {pos: {x: 409.4, y: 0.15, z: -15.8}, yaw: along(272)}}));
  // a lamp post snapped at its base, lying along the south sidewalk
  out.push(meshOf(prep(splitLong(merge(beam({x: 219, y: 0.2, z: 16.9}, {x: 226.4, y: 0.32, z: 17.5}, 0.16, 0.16, 'steelDark'), beam({x: 226.4, y: 0.32, z: 17.5}, {x: 226.9, y: 0.25, z: 15.9}, 0.12, 0.12, 'steelDark')), 2.0)), 'util_lamp'));
  // dumpsters, hydrants, bins (sidewalks, by the buildings)
  ([[112, -17.3, 90, 'girder'], [238, 16.9, 270, 'vanStripe'], [318, -17.0, 92, 'girder'], [452, 17.0, 268, 'carRed']] as [number, number, number, string][]).forEach(([x, z, h, m], i) => out.push({...meshOf(prep(dumpsterMesh(m)), `util_dump${i}`, {xf: {pos: {x, y: 0.15, z}, yaw: h}}), minPx: 2}));
  ([[116.2, 15.6], [252.4, -15.6], [271.6, 15.7], [432.2, -15.6]] as [number, number][]).forEach(([x, z], i) => out.push({...meshOf(prep(hydrantMesh()), `util_hyd${i}`, {xf: {pos: {x, y: 0.15, z}}}), minPx: 2}));
  ([[198.2, 16.6, 0, 90, 'vanStripe'], [200.4, 17.2, 30, 0, 'carRed'], [288.6, -16.4, 20, 86, 'girder'], [372.5, 16.8, 70, 88, 'vanStripe']] as [number, number, number, number, string][]).forEach(([x, z, h, roll, m], i) => out.push({...meshOf(prep(boxBin(m)), `util_bin${i}`, {xf: {pos: {x, y: roll ? 0.45 : 0.15, z}, yaw: h, roll}}), minPx: 2}));
};

/** Overhead power / phone lines (sprites, cut into short spans so each part sorts by its own depth). */
const wires = (): Item[] => {
  const items: Item[] = [];
  const cat = (key: string, a: V3, b: V3, sag: number, snapAt?: number) => {
    const n = 12;
    const P = Array.from({length: n + 1}, (_, i) => {
      const u = i / n;
      return {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u - sag * 4 * u * (1 - u), z: a.z + (b.z - a.z) * u};
    });
    const spans: V3[][] = [];
    if (snapAt === undefined) for (let i = 0; i < n; i += 3) spans.push(P.slice(i, Math.min(n, i + 3) + 1));
    else {
      // snapped: each half hangs from its anchor, draped down to the street
      const k = Math.round(snapAt * n);
      const hang = (from: V3, dirX: number, dirZ: number, L: number) => {
        const H: V3[] = [];
        for (let i = 0; i <= 8; i++) {
          const u = i / 8;
          const y = Math.max(0.04, from.y - L * Math.sin(u * Math.PI / 2) * 1.05);
          H.push({x: from.x + dirX * L * 0.35 * u * u, y, z: from.z + dirZ * L * 0.35 * u * u});
        }
        return H;
      };
      const La = Math.hypot(P[k].x - a.x, P[k].z - a.z), Lb = Math.hypot(b.x - P[k].x, b.z - P[k].z);
      const ha = hang(a, (b.x - a.x) / Math.hypot(b.x - a.x, b.z - a.z), (b.z - a.z) / Math.hypot(b.x - a.x, b.z - a.z), Math.min(a.y, La));
      const hb = hang(b, (a.x - b.x) / Math.hypot(b.x - a.x, b.z - a.z), (a.z - b.z) / Math.hypot(b.x - a.x, b.z - a.z), Math.min(b.y, Lb));
      spans.push(ha.slice(0, 5), ha.slice(4), hb.slice(0, 5), hb.slice(4));
    }
    spans.forEach((S, i) => items.push(polyline3(`${key}_${i}`, S, 0.035, '#2A2522', {minPx: 0.7, fade: SPRITE_FADE})));
  };
  // across the avenue, facade to facade (only where both frontages stand), beyond the fighting
  ([[138, 9.2, 8.6, 2.8], [189, 10.0, 9.4, 3.2, 0.42], [249, 8.4, 9.0, 2.6], [297, 9.6, 8.8, 3.0, 0.62], [352, 10.4, 9.8, 3.4], [405, 9.0, 9.4, 2.9]] as number[][]).forEach(([x, ya, yb, sag, snap], i) => {
    cat(`wire_a${i}`, {x, y: ya, z: -18.95}, {x: x + 1.6, y: yb, z: 18.95}, sag, snap);
    if (i % 2 === 0) cat(`wire_b${i}`, {x: x + 0.8, y: ya + 1.1, z: -18.95}, {x: x + 2.6, y: yb + 0.9, z: 18.95}, sag * 0.8);
  });
  // across the first cross street, north and south of the avenue
  cat('wire_x1n', {x: 115.05, y: 8.6, z: -40}, {x: 133.45, y: 8.1, z: -40.5}, 1.6);
  cat('wire_x1s', {x: 115.05, y: 7.8, z: 40}, {x: 133.45, y: 8.4, z: 40.6}, 1.4, 0.3);
  return items;
};

// ------------------------------------------------------------------ (R3) A1's damage events, whose results persist
type PeelPiece = {mesh: Prepped; c0: V3; cb: V3; ab: number; cf: V3; af: number; tl: number};
let PEEL: {pieces: PeelPiece[]; H: V3; U: V3; final: MeshItem[]} | null = null;
const rotAbout = (p: V3, c: V3, U: V3, a: number) => add3(c, rotAxis({x: p.x - c.x, y: p.y - c.y, z: p.z - c.z}, U, a));
/** the three pieces of the peeling wall section: their break pose, landing pose and time (from A1_EVENTS.peel) */
const peelSetup = () => {
  if (PEEL) return PEEL;
  const pe = A1_EVENTS.peel;
  const b = CITY().find((q) => q.id === pe.bld)!;
  const F = wallFrame(b, pe.side);
  const U = F.U; // the hinge runs along the wall; a positive turn about U swings the top outward (U × up = N)
  const um = (pe.u0 + pe.u1) / 2;
  const H = wallPoint(b, pe.side, um, pe.y0);
  const aB = rad(17);
  const bands = [0, 1, 2].map((k) => [pe.y0 + ((pe.y1 - pe.y0) * k) / 3, pe.y0 + ((pe.y1 - pe.y0) * (k + 1)) / 3]);
  // they come to rest in the gap west of the wall and on the rubble lot's edge: broken, tipped, stacked
  const lie = [{out: 3.4, y: 0.75, a: 76, du: -1.2}, {out: 5.6, y: 1.1, a: 95, du: 1.4}, {out: 7.6, y: 1.9, a: 108, du: -0.4}];
  const pieces = bands.map(([y0, y1], k): PeelPiece => {
    const mesh = prep(facadePanel(b, pe.u0, pe.u1, y0, y1, 1, pe.side));
    const c0 = wallPoint(b, pe.side, um, (y0 + y1) / 2, -0.22);
    const cb = rotAbout(c0, H, U, aB);
    const cf = {...wallPoint(b, pe.side, um + lie[k].du, 0, lie[k].out), y: lie[k].y};
    return {mesh, c0, cb, ab: aB, cf, af: rad(lie[k].a), tl: pe.tb + Math.sqrt((2 * (cb.y - cf.y)) / 9.8)};
  });
  const final = pieces.map((pc, k): MeshItem => ({kind: 'mesh', mesh: pc.mesh, key: `a1peel_${k}`, fn: (p: V3) => add3(pc.cf, rotAxis(sub3v(p, pc.c0), U, pc.af))}));
  PEEL = {pieces, H, U, final};
  return PEEL;
};
const sub3v = (a: V3, b: V3): V3 => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
/** where each piece is at film time t (A1 reads this for its dust and sound) */
export const peelState = (t: number) => {
  const S = peelSetup(), pe = A1_EVENTS.peel;
  return S.pieces.map((pc) => {
    if (t < pe.t0) return {phase: 'intact' as const, c: pc.c0, a: 0, land: pc.tl};
    if (t < pe.tb) { const k = (t - pe.t0) / (pe.tb - pe.t0); const a = pc.ab * k * k * (3 - 2 * k); return {phase: 'tear' as const, c: rotAbout(pc.c0, S.H, S.U, a), a, land: pc.tl}; }
    if (t < pc.tl) {
      const u = (t - pe.tb) / (pc.tl - pe.tb);
      const c = {x: pc.cb.x + (pc.cf.x - pc.cb.x) * u, y: pc.cb.y + (pc.cf.y - pc.cb.y) * u * u, z: pc.cb.z + (pc.cf.z - pc.cb.z) * Math.sqrt(u)};
      return {phase: 'fall' as const, c, a: pc.ab + (pc.af - pc.ab) * Math.pow(u, 1.4), land: pc.tl};
    }
    return {phase: 'down' as const, c: pc.cf, a: pc.af, land: pc.tl};
  });
};
let COVER: Prepped | null | undefined;
/** the glazing over A1's blow-out room, until the blast removes it */
const blowoutCover = (): Prepped | null => {
  if (COVER !== undefined) return COVER;
  const site = FIRE_SITES.find((q) => q.id === A1_EVENTS.blowout.site);
  const o = site ? openingFor(site.pos, 14) : null;
  const b = o ? CITY().find((q) => q.id === o.bld) : undefined;
  if (!o || !b) return (COVER = null);
  COVER = prep(facadePanel(b, o.u0, o.u1, o.corners[0].y, o.corners[2].y, 1, o.side));
  return COVER;
};
const eventItems = (t: number): Item[] => {
  const S = peelSetup(), pe = A1_EVENTS.peel;
  const items: Item[] = [];
  if (t >= Math.max(...S.pieces.map((p) => p.tl))) items.push(...S.final);
  else peelState(t).forEach((st, k) => {
    const pc = S.pieces[k];
    if (st.phase === 'intact') items.push({kind: 'mesh', mesh: pc.mesh, key: `a1peel_${k}`});
    else if (st.phase === 'tear') items.push({kind: 'mesh', mesh: pc.mesh, key: `a1peel_${k}`, fn: (p: V3) => rotAbout(p, S.H, S.U, st.a), noCull: true});
    else items.push({kind: 'mesh', mesh: pc.mesh, key: `a1peel_${k}`, fn: (p: V3) => add3(st.c, rotAxis(sub3v(p, pc.c0), S.U, st.a)), noCull: true});
  });
  void pe;
  const cov = blowoutCover();
  if (cov && t < A1_EVENTS.blowout.t0) items.push({kind: 'mesh', mesh: cov, key: 'a1cover'});
  return items;
};

/** twisted steel and rebar at the broken buildings near the camera */
const STEEL = new Map<string, Item[]>();
const steelOf = (b: Bldg): Item[] => {
  let it = STEEL.get(b.id);
  if (!it) { it = bldgSteel(b).map((q, i) => polyline3(`steel_${b.id}_${i}`, q.pts, q.w, q.color, {minPx: 0.7, ink: '#1E1A18', inkW: 1.0, fade: STEEL_FADE})); STEEL.set(b.id, it); }
  return it;
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
    EXTRA = [...EXTRA_PUSH, ...wires()];
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
  /** skip groups: 'city' | 'far' | 'flat' | 'relief' | 'debris' | 'van' | 'radio' | 'tower' | 'girder' | 'wrecks' | 'events' (A1's falling facade / its heap) */
  skip?: string[];
  /** extra culling distance for small objects (m); default automatic */
  maxDist?: number;
  /**
   * (R4) camera positions a long move passes through: every building keeps the finest level of detail any of them
   * asks for, for the whole shot (no window-pattern or roof-kit switch while the camera travels). The opening aerial
   * passes its path; E2 / F1 are covered by world/lodwin.ts. Default: the per-frame distance rule.
   */
  lodCams?: V3[];
};

const groupOf = (key: string) => {
  if (key.startsWith('ridge_') || key.startsWith('crater_')) return 'relief';
  if (key.startsWith('road_') || key.startsWith('walk_') || key.startsWith('kerb_') || key.startsWith('band_')) return 'flat';
  if (key === 'van' || key === 'vanIn') return 'van';
  if (key.startsWith('girder') || key.startsWith('gcol') || key === 'taxi') return 'girder';
  if (key.startsWith('wreck') || key.startsWith('veh_') || key === 'bus' || key === 'craterCar') return 'wrecks';
  return 'debris';
};

// ------------------------------------------------------------------ (R4) what the frontage hides from a low camera
type Occl = {x0: number; x1: number; z0: number; z1: number; h: number};
let OCC: Occl[] | null = null;
/** the buildings a block can stand behind (the avenue frontage and the flank), as boxes from the ground up */
const occluders = (): Occl[] => (OCC ??= CITY().filter((b) => (b.zone === 'front' || b.zone === 'west') && !b.rubble).map((b) => ({x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1, h: b.h})));
/** does the segment a → p pass through the box (slab method)? */
const segBox = (a: V3, p: V3, q: Occl): boolean => {
  let t0 = 0.001, t1 = 0.999;
  const ax = [a.x, a.y, a.z], dd = [p.x - a.x, p.y - a.y, p.z - a.z], lo = [q.x0, 0, q.z0], hi = [q.x1, q.h, q.z1];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(dd[i]) < 1e-9) { if (ax[i] < lo[i] || ax[i] > hi[i]) return false; continue; }
    let ta = (lo[i] - ax[i]) / dd[i], tb = (hi[i] - ax[i]) / dd[i];
    if (ta > tb) { const x = ta; ta = tb; tb = x; }
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  return true;
};
/** true when b (a grid over its roof, its walls at mid height) is entirely behind opaque frontage buildings, seen from the camera */
const hiddenBehind = (occ: Occl[], cam: V3, b: Bldg): boolean => {
  // a 5 × 5 grid over the roof (a cross street between two frontage buildings is ~18 m wide: a coarse grid can miss the slice
  // of a block that shows through it) and the walls' foot-to-roof edges at mid height
  const probes: V3[] = [];
  for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) probes.push({x: b.x0 + ((b.x1 - b.x0) * i) / 4, y: b.h, z: b.z0 + ((b.z1 - b.z0) * j) / 4});
  for (let i = 0; i <= 4; i++) for (const z of [b.z0, b.z1]) probes.push({x: b.x0 + ((b.x1 - b.x0) * i) / 4, y: b.h * 0.5, z});
  for (let j = 1; j <= 3; j++) for (const x of [b.x0, b.x1]) probes.push({x, y: b.h * 0.5, z: b.z0 + ((b.z1 - b.z0) * j) / 4});
  return probes.every((p) => {
    const x0 = Math.min(cam.x, p.x), x1 = Math.max(cam.x, p.x), z0 = Math.min(cam.z, p.z), z1 = Math.max(cam.z, p.z);
    return occ.some((q) => q.x1 >= x0 && q.x0 <= x1 && q.z1 >= z0 && q.z0 <= z1 && q.h > 0 && segBox(cam, p, q));
  });
};

export const setItems = (view: View, t: number, o: SetOpts = {}): Item[] => {
  const {S, F, X} = getStatic();
  const skip = new Set(o.skip ?? []);
  const cam = view.pos;
  const items: Item[] = [];
  // (R4) a long move keeps each piece's level of detail for its whole length (lodwin.ts); otherwise the camera's distance now
  const win = o.lodCams ? null : lodWindowAt(t);
  const lodCams = o.lodCams ?? win?.cams;
  const push = (s: Static) => {
    const g = groupOf(s.item.key ?? '');
    if (skip.has(g)) return;
    const d = Math.hypot(s.c.x - cam.x, s.c.y - cam.y, s.c.z - cam.z);
    let fadeOp = 1;
    if (s.minPx) {
      // (R4) a speck stops being drawn below minPx pixels: over the next minPx pixels it fades out instead of vanishing
      const px = (s.r * 2 * view.focal) / Math.max(1, d);
      if (px < s.minPx) return;
      if (px < s.minPx * 2) fadeOp = (px - s.minPx) / s.minPx;
    }
    if (o.maxDist && d - s.r > o.maxDist && g !== 'flat') return;
    let it = s.item;
    // (only the vehicles' levels change how they LOOK — the far mesh has no wheels; the girder's and the van's differ in strips only)
    const dl = lodCams && /^(wreck_|veh_)/.test(s.item.key ?? '') ? Math.min(minDistTo(lodCams, s.c), d) : d;
    if (s.lods) for (const l of s.lods) if (dl > l.d) it = l.item;
    items.push(fadeOp < 1 ? {...it, opacity: fadeOp} : it);
  };
  if (!skip.has('flat')) F.forEach(push);
  S.forEach(push);
  if (!skip.has('debris')) X.forEach((it) => {
    if (it.kind !== 'sprite') { items.push(it); return; }
    const d = Math.hypot(it.pos.x - cam.x, it.pos.y - cam.y, it.pos.z - cam.z);
    if (d < SPRITE_FADE[1]) items.push(it);
  });
  if (!skip.has('radio')) items.push(...radioItems(o.radioOn ?? 0));
  if (!skip.has('tower')) items.push(...towerItems(t, o.tower ?? 'auto'));
  if (!skip.has('city') && !skip.has('events')) items.push(...eventItems(t));
  // the city with LOD; blocks behind the frontage only when the camera is high enough to see them
  if (!skip.has('city')) {
    const low = cam.y < 26;
    // (no shortcut at all during E2 / F1: the crane's rise passes 26 m — see lodwin.ts)
    const frontage = low && !win?.noShortcut ? occluders() : null;
    CITY().forEach((b) => {
      if (skip.has('far') && b.zone === 'far') return;
      const c = {x: (b.x0 + b.x1) / 2, y: b.h / 2, z: (b.z0 + b.z1) / 2};
      const dNow = Math.hypot(c.x - cam.x, c.y - cam.y, c.z - cam.z);
      if (dNow > 4200) return;
      // (R4) the low-camera shortcut dropped every short block behind the frontage while the lens was under 26 m, so ~100 buildings
      // popped in at once when F1's crane rose past 26 m (and any gap or rubble lot showed an empty block). It now drops a block
      // only while it is really hidden behind the frontage (every probe point of its roof is behind an opaque building).
      if (frontage && b.zone === 'block' && b.h < 46 && dNow > 90 && Math.abs(cam.z) < 30 && hiddenBehind(frontage, cam, b)) return;
      const d = lodCams ? Math.min(envelopeDist(lodCams, b, c), dNow) : dNow; // (never coarser than the camera's distance now)
      const lod = lodFor(b, d);
      items.push({kind: 'mesh', mesh: bldgMesh(b, lod), key: `bl_${b.id}`});
      if (lod < 2 && dNow < STEEL_FADE[1] && (b.breach || b.crown) && !skip.has('debris')) items.push(...steelOf(b));
    });
  }
  return items;
};

/** Everything a shot needs to stand on the set (re-exported for convenience). */
export {groundH, RADIO, VAN_XF, CLEAR_ZONES};
export {towerItems};
export const _debug = {getStatic, peelSetup, eventItems, occluders, hiddenBehind};
