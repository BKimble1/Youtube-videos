// R3 spatial checker (bundled by city_check.mjs with esbuild; runs in node, no rendering).
// Flags obvious spatial mistakes in the battlefield set against the machines' persisted positions and routes and the
// key camera paths:
//   layout   building volumes that intersect each other; buildings intruding into the avenue / cross streets
//   set      solid set pieces (wrecks, slabs, columns, posts, walls…) intersecting buildings or each other
//   routes   formation lanes (A1, B army, EF streams) and persisted / tableau machines walking or standing inside a
//            solid set piece or a building
//   camera   key camera paths (A1, B1–B6, F1) passing inside / grazing a building or a solid set piece
//   sort     large single faces (> SORT_MAX m across) that a machine stands near: painter's-order risk (a face sorts
//            by its mean depth, so a figure near one end of a long face can be drawn on the wrong side of it)
import {V3} from '../../source/src/kit/math';
import {CITY, Bldg, bldgMesh, openingFor} from '../../source/src/r2/world/city';
import {_debug} from '../../source/src/r2/world/set';
import {PLAN, AERIAL, FIRE_SITES, STREET_OBSTACLES, steerAround} from '../../source/src/r2/world/plan';
import {groundH} from '../../source/src/r2/world/ground';
import {xfPoint, MeshItem} from '../../source/src/r2/engine';
import {PERSIST} from '../../source/src/r2/shots/persist';
import {ARMY_B, HEAVIES_B, heavyPosB} from '../../source/src/r2/shots/B/army';
import {streamForm, TB_RING, TB_OUTER, TB_RESERVE, TB_HEAVY2, TB_HOLDERS} from '../../source/src/r2/shots/EF/tableau';
import {camF1} from '../../source/src/r2/shots/EF/camera';
import * as BC from '../../source/src/r2/shots/B/cams';
import {A1_ARMY, A1_HEAVIES} from '../../source/src/r2/shots/A/army';
import type {Formation} from '../../source/src/r2/mech';
import {M} from '../../source/src/r2/timing';
import * as WORLD from '../../source/src/r2/world';

type P2 = {x: number; z: number};
type Finding = {cat: string; sev: 'error' | 'warn' | 'info'; msg: string};
const out: Finding[] = [];
const add = (cat: string, sev: Finding['sev'], msg: string) => out.push({cat, sev, msg});
const f1 = (n: number) => n.toFixed(1);

// ------------------------------------------------------------------ geometry helpers
const hull = (pts: P2[]): P2[] => {
  const P = [...pts].sort((a, b) => a.x - b.x || a.z - b.z);
  if (P.length < 3) return P;
  const cr = (o: P2, a: P2, b: P2) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lo: P2[] = [], hi: P2[] = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};
const segDist = (p: P2, a: P2, b: P2) => {
  const dx = b.x - a.x, dz = b.z - a.z, L = dx * dx + dz * dz;
  const t = L > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / L)) : 0;
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
};
const inPoly = (p: P2, H: P2[]) => {
  let c = false;
  for (let i = 0, j = H.length - 1; i < H.length; j = i++) {
    if ((H[i].z > p.z) !== (H[j].z > p.z) && p.x < ((H[j].x - H[i].x) * (p.z - H[i].z)) / (H[j].z - H[i].z) + H[i].x) c = !c;
  }
  return c;
};
/** signed distance from p to a convex polygon (negative inside) */
const polyDist = (p: P2, H: P2[]) => {
  if (H.length < 3) return H.length ? Math.min(...H.map((q) => Math.hypot(p.x - q.x, p.z - q.z))) : 1e9;
  let d = 1e9;
  for (let i = 0; i < H.length; i++) d = Math.min(d, segDist(p, H[i], H[(i + 1) % H.length]));
  return inPoly(p, H) ? -d : d;
};
/** overlap test of two convex polygons by SAT; returns penetration depth (0 = apart) */
const satDepth = (A: P2[], B: P2[]) => {
  let best = 1e9;
  for (const P of [A, B]) for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    const n = {x: -(b.z - a.z), z: b.x - a.x};
    const L = Math.hypot(n.x, n.z) || 1;
    const pr = (Q: P2[]) => { let lo = 1e9, hi = -1e9; Q.forEach((q) => { const s = (q.x * n.x + q.z * n.z) / L; lo = Math.min(lo, s); hi = Math.max(hi, s); }); return [lo, hi]; };
    const [a0, a1] = pr(A), [b0, b1] = pr(B);
    const o = Math.min(a1, b1) - Math.max(a0, b0);
    if (o <= 0) return 0;
    best = Math.min(best, o);
  }
  return best;
};

// ------------------------------------------------------------------ the set: buildings and solid pieces
const city = CITY();
const bRect = (b: Bldg): P2[] => [{x: b.x0, z: b.z0}, {x: b.x1, z: b.z0}, {x: b.x1, z: b.z1}, {x: b.x0, z: b.z1}];

type Solid = {key: string; hull: P2[]; y0: number; y1: number; low: boolean};
const SOLID_SKIP = /^(ridge_|crater_|road_|walk_|kerb_|band_|rch_|sch_|cch_|sch2_|rslab_|vanIn|dch_|dchip)/;
const solids: Solid[] = [];
const {S} = _debug.getStatic();
S.forEach((s) => {
  const it = s.item as MeshItem;
  const key = it.key ?? '?';
  if (SOLID_SKIP.test(key)) return;
  const W = it.mesh.verts.map((p) => (it.xf ? xfPoint(p, it.xf) : p));
  const lowPts = W.filter((p) => p.y < groundH(p.x, p.z) + 2.0);
  const ys = W.map((p) => p.y);
  if (lowPts.length < 2) return;
  solids.push({key, hull: hull(lowPts.map((p) => ({x: p.x, z: p.z}))), y0: Math.min(...ys), y1: Math.max(...ys), low: true});
});

// the persistent results of A1's events (the fallen facade's heap) are solids from then on
(_debug.eventItems(300) as MeshItem[]).forEach((it) => {
  if (it.kind !== 'mesh') return;
  const W = it.mesh.verts.map((p, i) => (it.fn ? it.fn(it.xf ? xfPoint(p, it.xf) : p, i) : p));
  const lowPts = W.filter((p) => p.y < groundH(p.x, p.z) + 2.0);
  if (lowPts.length >= 2) solids.push({key: it.key ?? 'event', hull: hull(lowPts.map((p) => ({x: p.x, z: p.z}))), y0: Math.min(...W.map((p) => p.y)), y1: Math.max(...W.map((p) => p.y)), low: true});
});
// fire sites: every room site has an opening cut where it says; vehicle/debris sites sit on their set piece
FIRE_SITES.forEach((f) => {
  if (f.kind === 'room') {
    const o = openingFor(f.pos, 10);
    if (!o) add('fire', 'error', `room site ${f.id} (${f.anchor}) has no opening within 10 m of ${f1(f.pos.x)}, ${f1(f.pos.y)}, ${f1(f.pos.z)}`);
    else add('fire', 'info', `room site ${f.id}: opening in ${o.bld} centre ${f1(o.center.x)}, ${f1(o.center.y)}, ${f1(o.center.z)} (${f1(o.width)} × ${f1(o.height)} m)`);
  } else if (f.kind === 'vehicle') {
    const v = STREET_OBSTACLES.find((q) => q.id === f.anchor);
    if (!v || Math.hypot(v.x - f.pos.x, v.z - f.pos.z) > 0.5) add('fire', 'error', `vehicle site ${f.id} is not on its vehicle ${f.anchor}`);
  } else if (f.kind === 'opening') {
    const b = city.find((q) => q.id === f.anchor);
    if (!b && f.anchor !== 'towerStump') add('fire', 'warn', `opening site ${f.id}: no building ${f.anchor}`);
    if (!b) return;
    else if (f.pos.x < b.x0 - 1.5 || f.pos.x > b.x1 + 1.5 || f.pos.z < b.z0 - 1.5 || f.pos.z > b.z1 + 1.5 || f.pos.y > b.h + 1) add('fire', 'warn', `opening site ${f.id} lies outside ${b.id}`);
  }
});
// fires (ATMOS's FIRES) floating in the air or buried in a building
WORLD.FIRES.forEach((f) => {
  if (f.interior) {
    const o = openingFor(f.pos, 25);
    if (!o) add('fire', 'warn', `ATMOS interior fire ${f.id} has no opening near ${f1(f.pos.x)}, ${f1(f.pos.y)}, ${f1(f.pos.z)}`);
    else if (Math.hypot(o.center.x - f.pos.x, o.center.y - f.pos.y, o.center.z - f.pos.z) > 3) add('fire', 'info', `ATMOS interior fire ${f.id} at y ${f1(f.pos.y)}: its opening (${o.bld}) is centred at ${f1(o.center.x)}, ${f1(o.center.y)}, ${f1(o.center.z)} — attach the flames there (openingFor)`);
  }
});

// layout: buildings vs buildings
for (let i = 0; i < city.length; i++) for (let j = i + 1; j < city.length; j++) {
  const a = city[i], b = city[j];
  const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
  if (ox > 0.3 && oz > 0.3) add('layout', 'error', `buildings ${a.id} (${a.zone}) and ${b.id} (${b.zone}) intersect: ${f1(ox)} × ${f1(oz)} m at x ${f1(Math.max(a.x0, b.x0))}, z ${f1(Math.max(a.z0, b.z0))}`);
}
// layout: buildings in the streets
const streets: {name: string; r: P2[]}[] = [
  {name: 'avenue', r: [{x: 10, z: -PLAN.avenue.walkZ}, {x: 1400, z: -PLAN.avenue.walkZ}, {x: 1400, z: PLAN.avenue.walkZ}, {x: 10, z: PLAN.avenue.walkZ}]},
  ...PLAN.crossStreets.map((c) => ({name: `cross street x=${c.x}`, r: [{x: c.x - c.w / 2, z: -1300}, {x: c.x + c.w / 2, z: -1300}, {x: c.x + c.w / 2, z: 1300}, {x: c.x - c.w / 2, z: 1300}]})),
];
city.forEach((b) => streets.forEach((s) => {
  const d = satDepth(bRect(b), s.r);
  if (d > 0.3) add('layout', 'error', `building ${b.id} (${b.zone}, x ${f1(b.x0)}..${f1(b.x1)}, z ${f1(b.z0)}..${f1(b.z1)}) intrudes ${f1(d)} m into the ${s.name}`);
}));
// set pieces vs buildings
solids.forEach((s) => city.forEach((b) => {
  const d = satDepth(s.hull, bRect(b));
  if (d > 0.25 && s.y0 < b.h) add('set', 'warn', `set piece ${s.key} intersects building ${b.id} by ${f1(d)} m`);
}));
// set pieces vs set pieces (small contacts are allowed; report real interpenetration)
for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
  const a = solids[i], b = solids[j];
  if (a.y1 < b.y0 || b.y1 < a.y0) continue;
  const d = satDepth(a.hull, b.hull);
  if (d > 0.35) add('set', 'info', `set pieces ${a.key} and ${b.key} overlap in plan by ${f1(d)} m (check: intended contact or interpenetration?)`);
}

// ------------------------------------------------------------------ machines: routes and positions
type Hit = {what: string; T: number; p: P2; obj: string; d: number};
const hits = new Map<string, Hit>();
const testPoint = (what: string, T: number, p: P2, r: number) => {
  for (const s of solids) {
    const d = polyDist(p, s.hull);
    if (d < r - 0.1) {
      const k = `${what}|${s.key}`;
      const prev = hits.get(k);
      if (!prev || d < prev.d) hits.set(k, {what, T, p, obj: s.key, d});
    }
  }
  for (const b of city) {
    if (p.x < b.x0 - r || p.x > b.x1 + r || p.z < b.z0 - r || p.z > b.z1 + r) continue;
    const d = polyDist(p, bRect(b));
    if (d < r - 0.1) {
      const k = `${what}|bld ${b.id}`;
      const prev = hits.get(k);
      if (!prev || d < prev.d) hits.set(k, {what, T, p, obj: `building ${b.id}`, d});
    }
  }
};
const sampleForm = (name: string, f: Formation, T0: number, T1: number, dt: number, r: number) => {
  for (let T = T0; T <= T1 + 1e-6; T += dt) f.slots(T).forEach((s) => testPoint(`${name} unit ${s.id}`, T, s.pos, r));
};
sampleForm('A1', A1_ARMY, 0, M.TITLE_IN, 0.5, 0.45);
A1_HEAVIES.forEach((h, k) => { for (let T = 0; T <= M.TITLE_IN; T += 0.5) testPoint(`A1 heavy ${k}`, T, {x: h.x + 40 - (T + 40) * 0.9, z: h.z}, 2.4); });
sampleForm('B', ARMY_B, M.ORCH, M.BASS_OUT, 0.5, 0.45);
HEAVIES_B.forEach((_, i) => { for (let T = M.ORCH; T <= M.BASS_OUT; T += 0.5) testPoint(`B heavy ${i}`, T, heavyPosB(i, T), 2.4); });
sampleForm('EF stream', streamForm(), 186, 231.6, 1.0, 0.45);
// the recommended fix for EF: the same streams with every lane position passed through steerAround (proof it clears)
sampleForm('EF stream (steered, proposal)', {slots: (T: number) => streamForm().slots(T).map((s) => ({...s, pos: Math.abs(s.pos.z) < 14 ? {...s.pos, z: steerAround(s.pos.x, s.pos.z, 0.9)} : s.pos}))}, 186, 231.6, 1.0, 0.45);
[...TB_RING, ...TB_OUTER].forEach((u) => testPoint(`EF ring unit ${u.id}`, 190, u.pos, 0.45));
TB_RESERVE.forEach((u) => testPoint(`EF reserve unit ${u.id}`, 190, u.pos, 0.45));
TB_HOLDERS.forEach((u) => testPoint(`EF holder ${u.key}`, 190, u.pos, 0.45));
testPoint('EF heavy2', 190, TB_HEAVY2.pos, 2.4);
PERSIST.forEach((p) => {
  if (p.kind === 'items') return;
  for (const T of [p.from, p.from + 5, 200]) {
    const sp = p.spec(T) as {pos: V3};
    testPoint(`persist ${p.key}`, T, sp.pos, p.kind === 'heavy' ? 2.4 : p.kind === 'drone' ? 0 : 0.45);
  }
});
// collapse by (machine group, object): one line per group/object with the worst case
const groupHits = new Map<string, Hit & {n: number}>();
hits.forEach((h) => {
  const g = h.what.replace(/ unit \d+$/, ' units');
  const k = `${g}|${h.obj}`;
  const prev = groupHits.get(k);
  if (!prev) groupHits.set(k, {...h, what: g, n: 1});
  else { prev.n++; if (h.d < prev.d) Object.assign(prev, {...h, what: g, n: prev.n}); }
});
groupHits.forEach((h) => add('routes', h.d < -0.2 ? 'error' : 'warn', `${h.what} ${h.d < 0 ? 'inside' : 'grazing'} ${h.obj} (depth ${f1(-h.d)} m, worst at T ${f1(h.T)}, x ${f1(h.p.x)}, z ${f1(h.p.z)}; ${h.n} unit${h.n > 1 ? 's' : ''})`));

// ------------------------------------------------------------------ cameras
type CamKey = {t: number; pos: V3; target: V3};
const lerpKeys = (keys: CamKey[], t: number): V3 => {
  if (t <= keys[0].t) return keys[0].pos;
  for (let i = 0; i + 1 < keys.length; i++) if (t <= keys[i + 1].t) {
    const u = (t - keys[i].t) / (keys[i + 1].t - keys[i].t);
    const a = keys[i].pos, b = keys[i + 1].pos;
    return {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u};
  }
  return keys[keys.length - 1].pos;
};
const camHits = new Map<string, {T: number; d: number; p: V3}>();
const testCam = (name: string, T: number, p: V3) => {
  if (p.y < groundH(p.x, p.z) + 0.15) camHits.set(`${name} below ground`, {T, d: groundH(p.x, p.z) - p.y, p});
  for (const b of city) {
    const top = b.h + 0.5;
    if (p.y > top + 2.5) continue;
    const d = polyDist(p, bRect(b));
    if (d < 2.0) {
      const k = `${name} ${d < 0 ? (p.y < top ? 'INSIDE' : 'over the roof of') : 'within 2 m of'} building ${b.id} (h ${f1(b.h)})`;
      const prev = camHits.get(k);
      if (!prev || d < prev.d) camHits.set(k, {T, d, p});
    }
  }
  for (const s of solids) {
    if (p.y > s.y1 + 0.4 || p.y < s.y0 - 0.4) continue;
    const d = polyDist(p, s.hull);
    if (d < 0.3) {
      const k = `${name} ${d < 0 ? 'inside' : 'within 0.3 m of'} ${s.key}`;
      const prev = camHits.get(k);
      if (!prev || d < prev.d) camHits.set(k, {T, d, p});
    }
  }
};
for (let T = 0; T <= M.TITLE_IN; T += 0.1) {
  const u = T / M.TITLE_IN;
  const a = AERIAL.from.pos, b = AERIAL.to.pos;
  testCam('A1', T, {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u});
}
// B's cameras by name, whatever its shots are called now: SHOT_T.<id> → CAM_<ID> (keys, shot-local t) or cam<Id>(T)
{
  const B = BC as unknown as Record<string, unknown>;
  const shots = (B.SHOT_T ?? {}) as Record<string, readonly [number, number]>;
  Object.entries(shots).forEach(([id, [a, b]]) => {
    const keys = B[`CAM_${id.toUpperCase()}`] as CamKey[] | undefined;
    const fn = B[`cam${id[0].toUpperCase()}${id.slice(1)}`] as ((T: number) => {pos: V3}) | undefined;
    if (!keys && typeof fn !== 'function') { add('camera', 'info', `B shot ${id}: no camera export found (skipped)`); return; }
    for (let t = 0; t <= b - a; t += 0.1) testCam(id, a + t, keys ? lerpKeys(keys, t) : fn!(a + t).pos);
  });
}
for (let T = 198.3; T <= M.CARD_IN; T += 0.1) testCam('F1', T, camF1(T).pos);
camHits.forEach((h, k) => add('camera', /INSIDE|inside|below/.test(k) ? 'error' : 'info', `${k} (at T ${f1(h.T)}, cam ${f1(h.p.x)}, ${f1(h.p.y)}, ${f1(h.p.z)})`));

// F1 corridor: the clearance of the pullback's path to the nearest building / solid (min over the path)
{
  let worst = {d: 1e9, T: 0, what: ''};
  for (let T = 201.5; T <= M.CARD_IN; T += 0.1) {
    const p = camF1(T).pos;
    for (const b of city) {
      const d = p.y > b.h ? Math.hypot(Math.max(0, polyDist(p, bRect(b))), p.y - b.h) : polyDist(p, bRect(b));
      if (d < worst.d) worst = {d, T, what: `building ${b.id}`};
    }
  }
  add('camera', 'info', `F1 pullback corridor: nearest building ${worst.what} at ${f1(worst.d)} m (T ${f1(worst.T)})`);
}

// ------------------------------------------------------------------ painter's-order risk: big faces near machines
const SORT_MAX = 7.5;
const machinePts: P2[] = [];
const addPts = (f: Formation, T0: number, T1: number, dt: number) => { for (let T = T0; T <= T1; T += dt) f.slots(T).forEach((s) => machinePts.push(s.pos)); };
addPts(ARMY_B, M.ORCH, M.BASS_OUT, 2);
addPts(streamForm(), 186, 231, 4);
[...TB_RING, ...TB_OUTER, ...TB_RESERVE].forEach((u) => machinePts.push(u.pos));
PERSIST.forEach((p) => { if (p.kind !== 'items') machinePts.push((p.spec(200) as {pos: V3}).pos); });
const near = (p: P2, R: number) => machinePts.some((q) => Math.abs(q.x - p.x) < R && Math.abs(q.z - p.z) < R && Math.hypot(q.x - p.x, q.z - p.z) < R);
let bigNear = 0;
const bigList: string[] = [];
city.forEach((b) => {
  if (b.zone !== 'front' && b.zone !== 'west') return;
  const m = bldgMesh(b, 0);
  m.faces.forEach((f, fi) => {
    const P = f.v.map((i) => m.verts[i]);
    const xs = P.map((p) => p.x), zs = P.map((p) => p.z), ys = P.map((p) => p.y);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
    if (span < SORT_MAX || Math.max(...ys) - Math.min(...ys) < 1) return; // big vertical faces only
    // a face low enough to stand behind a machine (heavies are 6 m), not already biased back by half its span
    if (Math.min(...ys) > 6 || (f.bias ?? 0) <= -span / 2 + 0.6) return;
    const c = {x: m.cents[fi].x, z: m.cents[fi].z};
    // any machine within 6 m in front of this face, along its span?
    const n = m.normals[fi];
    const hit = machinePts.some((q) => {
      const dx = q.x - c.x, dz = q.z - c.z;
      const front = dx * n.x + dz * n.z;
      const along = Math.abs(dx * -n.z + dz * n.x);
      return front > 0 && front < 6 && along < span / 2 + 1;
    });
    if (hit) { bigNear++; if (bigList.length < 12) bigList.push(`${b.id}#${fi} (${f1(span)} m)`); }
  });
});
add('sort', bigNear ? 'warn' : 'info', `${bigNear} building faces wider than ${SORT_MAX} m have machines within 6 m in front of them${bigList.length ? ': ' + bigList.join(', ') + (bigNear > bigList.length ? ' …' : '') : ''}`);
let bigSet = 0;
const bigSetList: string[] = [];
S.forEach((s) => {
  const it = s.item as MeshItem;
  const key = it.key ?? '?';
  if (/^(ridge_|crater_|road_|walk_|kerb_|band_)/.test(key)) return;
  it.mesh.faces.forEach((f) => {
    const P = f.v.map((i) => (it.xf ? xfPoint(it.mesh.verts[i], it.xf) : it.mesh.verts[i]));
    // horizontal span (a tall thin post is no sorting risk; a long beam, wall or vehicle side is)
    let mx = 0;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) mx = Math.max(mx, Math.hypot(P[i].x - P[j].x, P[i].z - P[j].z));
    if (mx < SORT_MAX) return;
    const c = P.reduce((a, p) => ({x: a.x + p.x / P.length, z: a.z + p.z / P.length}), {x: 0, z: 0});
    if (near(c, mx / 2 + 4)) { bigSet++; if (!bigSetList.includes(key) && bigSetList.length < 16) bigSetList.push(key); }
  });
});
add('sort', bigSet ? 'warn' : 'info', `${bigSet} set-piece faces longer than ${SORT_MAX} m lie near machines${bigSetList.length ? ': ' + bigSetList.join(', ') : ''}`);

// ------------------------------------------------------------------ painter's-order risk near the CREW (R3 follow-up)
// A face sorts by the depth of its middle: a figure standing within about half the face's length of it can be drawn on
// the wrong side. Flag every set-piece / near-building face of length L ≥ 0.9 m (horizontal extent) with a figure's
// feet within L/2 (and the face spanning the figure's height), unless the face is biased back by ≥ L/2 already.
type Fig = {who: string; T: number; x: number; y: number; z: number};
const FIGS: Fig[] = ((globalThis as {__R3_FIGS?: Fig[]}).__R3_FIGS ?? []);
((globalThis as {__R3_FIG_NOTES?: string[]}).__R3_FIG_NOTES ?? []).forEach((n) => add('figures', /SKIPPED/.test(n) ? 'warn' : 'info', n));
{
  // a coarse grid of figure samples (2 m cells) for speed
  const cell = 2, grid = new Map<string, Fig[]>();
  FIGS.forEach((f) => { const k = `${Math.floor(f.x / cell)},${Math.floor(f.z / cell)}`; const l = grid.get(k) ?? []; l.push(f); grid.set(k, l); });
  const nearFigs = (x0: number, x1: number, z0: number, z1: number) => {
    const out2: Fig[] = [];
    for (let i = Math.floor(x0 / cell); i <= Math.floor(x1 / cell); i++) for (let j = Math.floor(z0 / cell); j <= Math.floor(z1 / cell); j++) out2.push(...(grid.get(`${i},${j}`) ?? []));
    return out2;
  };
  type Flag = {piece: string; L: number; d: number; who: string; T: number; n: number};
  const flags = new Map<string, Flag>();
  const testFace = (piece: string, P: V3[], bias: number) => {
    let L = 0;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) L = Math.max(L, Math.hypot(P[i].x - P[j].x, P[i].z - P[j].z));
    if (L < 0.9 || bias <= -L / 2) return;
    const H = hull(P.map((p) => ({x: p.x, z: p.z})));
    const ys = P.map((p) => p.y);
    const lo = Math.min(...ys), hi = Math.max(...ys);
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    P.forEach((p) => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); });
    const R = L / 2;
    for (const f of nearFigs(x0 - R, x1 + R, z0 - R, z1 + R)) {
      if (hi < f.y - 0.1 || lo > f.y + 1.9) continue;
      const d = H.length >= 3 ? Math.max(0, polyDist(f, H)) : segDist(f, H[0], H[H.length - 1]);
      if (d >= R) continue;
      const prev = flags.get(piece);
      if (!prev) flags.set(piece, {piece, L, d, who: f.who, T: f.T, n: 1});
      else { prev.n++; if (L - 2 * d > prev.L - 2 * prev.d) Object.assign(prev, {L, d, who: f.who, T: f.T}); }
    }
  };
  S.forEach((s) => {
    const it = s.item as MeshItem;
    const key = it.key ?? '?';
    if (/^(ridge_|crater_|road_|walk_|kerb_|band_)/.test(key)) return;
    it.mesh.faces.forEach((f) => testFace(key, f.v.map((i) => (it.xf ? xfPoint(it.mesh.verts[i], it.xf) : it.mesh.verts[i])), (f.bias ?? 0) + (it.mesh.bias ?? 0) + (it.bias ?? 0)));
  });
  city.forEach((b) => {
    if (b.zone !== 'front' && b.zone !== 'west') return;
    if (!nearFigs(b.x0 - 3, b.x1 + 3, b.z0 - 3, b.z1 + 3).length) return;
    const m = bldgMesh(b, 0);
    m.faces.forEach((f) => testFace(`building ${b.id}`, f.v.map((i) => m.verts[i]), f.bias ?? 0));
  });
  // the Crew's feet inside a solid set piece (walking through a car, a wall, a slab; standing in the van)
  const inside = new Map<string, {who: string; T: number; d: number; piece: string; n: number}>();
  FIGS.forEach((f) => {
    for (const so of solids) {
      if (f.y > so.y1 + 0.2) continue; // standing on top of it (a slab, the rubble) is fine
      const d = polyDist(f, so.hull);
      if (d > -0.15) continue;
      const k = `${f.who}|${so.key}`;
      const prev = inside.get(k);
      if (!prev) inside.set(k, {who: f.who, T: f.T, d, piece: so.key, n: 1});
      else { prev.n++; if (d < prev.d) Object.assign(prev, {T: f.T, d}); }
    }
  });
  [...inside.values()].sort((a, b) => a.d - b.d).slice(0, 25).forEach((q) => add('crew', q.d < -0.4 ? 'warn' : 'info', `${q.who}'s feet ${(-q.d).toFixed(2)} m inside ${q.piece} (T ${f1(q.T)}; ${q.n} sample${q.n > 1 ? 's' : ''}) — through it, or standing on it?`));
  const list = [...flags.values()].sort((a, b) => b.L - 2 * b.d - (a.L - 2 * a.d));
  add('sort', list.length ? 'warn' : 'info', `${FIGS.length} crew samples; ${list.length} set pieces / buildings have faces longer than twice a figure's distance to them${list.length ? '' : ' (none)'}`);
  list.slice(0, 30).forEach((q) => add('sort', 'warn', `  ${q.piece}: a ${f1(q.L)} m face ${q.d.toFixed(2)} m from ${q.who} (T ${f1(q.T)}; ${q.n} sample${q.n > 1 ? 's' : ''})`));
}

// ------------------------------------------------------------------ summary
add('info', 'info', `checked ${city.length} buildings, ${solids.length} solid set pieces, ${machinePts.length} machine samples; world kit exports: ${Object.keys(WORLD).length}`);
export const report = out;
