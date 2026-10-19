import {heavy} from './mechapi';
import {xfPoint} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {heavy1D3, wreckHull, wreckTop} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/D3/machines';
import {groundH} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/ground';
const g: any = globalThis;
const hullArea = (v: {x: number; z: number}[]) => { let a = 0; for (let i = 0; i < v.length; i++) { const p = v[i], q = v[(i + 1) % v.length]; a += p.x * q.z - q.x * p.z; } return Math.abs(a) / 2; };
const run = (noka: boolean) => {
  g.__NOKA = noka;
  const T = 200; const items = heavy({...(heavy1D3(T) as any), lod: 'full'});
  let n = 0, maxTop = 0, minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  const pts: any[] = [];
  for (const it of items) { if (it.kind !== 'mesh') continue; for (const p of it.mesh.verts) { let q = it.xf ? xfPoint(p, it.xf) : p; if (it.fn) q = it.fn(q, -1); pts.push(q); } }
  const low = pts.filter((p) => p.y < groundH(p.x, p.z) + 3.2);
  for (const p of low) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); }
  const tops = pts.map((p) => p.y - groundH(p.x, p.z));
  const grid = new Map<string, number>(); for (const p of pts) { const k = `${Math.round(p.x / 0.5)},${Math.round(p.z / 0.5)}`; grid.set(k, Math.max(grid.get(k) ?? 0, p.y - groundH(p.x, p.z))); }
  (globalThis as any).__G = (globalThis as any).__G ?? []; (globalThis as any).__G.push(grid);
  return {nLow: low.length, bbox: [minX, maxX, minZ, maxZ].map((x) => x.toFixed(2)).join(','), maxTop: Math.max(...tops).toFixed(2), area: ''};
};
console.log('without kneeAbove', JSON.stringify(run(true)));
console.log('with    kneeAbove', JSON.stringify(run(false)));

const [A, B] = (globalThis as any).__G as Map<string, number>[];
let diffs = 0, maxd = 0, cells = new Set([...A.keys(), ...B.keys()]);
for (const k of cells) { const d = Math.abs((A.get(k) ?? 0) - (B.get(k) ?? 0)); if (d > 0.1) diffs++; maxd = Math.max(maxd, d); }
console.log('top-height grid (0.5 m cells): cells', cells.size, 'cells differing by >0.1 m:', diffs, 'max difference', maxd.toFixed(2));
