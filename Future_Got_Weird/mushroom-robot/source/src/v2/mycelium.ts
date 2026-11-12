// V2 mycelium: one network, generated once from a fixed seed in scaffold-disc coordinates (cm), shared by every shot.
// It is a graph: hyphae are chains of nodes, branches join their parent at a shared node, and hyphae that touch fuse
// (anastomosis). An electrical spike is drawn as a pulse that runs ALONG existing hyphae, by the shortest route through
// the graph, from where it starts to the electrode that records it.
import {mulberry, clamp} from '../lib';
import {DISC_R} from './robot';
import {EVENTS_EXT} from './timing';

export type P2 = [number, number];
export type Hypha = {pts: P2[]; ids: number[]; tier: 0 | 1 | 2};
export const ELECTRODES: P2[] = [[0.55, 0.62], [-0.72, 0.38]];
const R = DISC_R * 0.96;

const build = () => {
  const rnd = mulberry(20240828);
  const nodes: P2[] = [];
  const edges: [number, number, number][] = [];
  const hyphae: Hypha[] = [];
  const addNode = (p: P2) => { nodes.push(p); return nodes.length - 1; };
  const inside = (p: P2) => Math.hypot(p[0], p[1]) < R;
  const grow = (startId: number, dir: number, step: number, n: number, turn: number, tier: 0 | 1 | 2, branchP: number, depth: number) => {
    const pts: P2[] = [nodes[startId]], ids = [startId];
    let a = dir, p = nodes[startId];
    const kids: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      a += (rnd() - 0.5) * turn;
      for (const e of ELECTRODES) {
        const dx = e[0] - p[0], dy = e[1] - p[1], d = Math.hypot(dx, dy);
        if (d < 0.3 && d > 0.07) { let da = Math.atan2(dy, dx) - a; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; a += da * 0.06; }
      }
      const q: P2 = [p[0] + Math.cos(a) * step, p[1] + Math.sin(a) * step];
      if (!inside(q)) break;
      const id = addNode(q);
      edges.push([ids[ids.length - 1], id, step]);
      pts.push(q); ids.push(id); p = q;
      if (depth > 0 && i > 3 && rnd() < branchP) kids.push([id, a + (rnd() < 0.5 ? -1 : 1) * (0.55 + rnd() * 0.5)]);
    }
    if (pts.length > 1) hyphae.push({pts, ids, tier});
    for (const [id, ang] of kids) {
      const ct = (tier === 0 ? (rnd() < 0.3 ? 0 : 1) : 2) as 0 | 1 | 2;
      grow(id, ang, step * (ct === 2 ? 0.8 : 1), Math.floor(n * (ct === 2 ? 0.3 : 0.55) * (0.6 + rnd() * 0.6)), turn * (ct === 2 ? 1.5 : 1.05), ct,
        ct === 2 ? 0 : branchP * 0.8, depth - 1);
    }
  };
  const seeds: P2[] = [[-0.2, -0.35], [0.45, 0.0], [-0.45, 0.45]];
  for (const s of seeds) {
    const sid = addNode(s);
    for (let j = 0; j < 5; j++) grow(sid, (j / 5) * Math.PI * 2 + rnd() * 0.7, 0.03, 66, 0.3, 0, 0.1, 3);
  }
  // anastomosis: fuse nodes of different hyphae closer than 0.02 cm (spatial hash)
  const cell = 0.02, grid = new Map<string, number[]>();
  nodes.forEach((p, i) => { const k = `${Math.floor(p[0] / cell)},${Math.floor(p[1] / cell)}`; (grid.get(k) ?? grid.set(k, []).get(k)!).push(i); });
  let fused = 0;
  nodes.forEach((p, i) => {
    const cx = Math.floor(p[0] / cell), cy = Math.floor(p[1] / cell);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const j of grid.get(`${cx + dx},${cy + dy}`) ?? []) {
      if (j <= i) continue;
      const d = Math.hypot(nodes[j][0] - p[0], nodes[j][1] - p[1]);
      if (d < cell) { edges.push([i, j, d]); fused++; }
    }
  });
  return {nodes, edges, hyphae, fused};
};
const G = build();
export const NET = G.hyphae;
export const NODES = G.nodes;
export const NET_STATS = {hyphae: NET.length, nodes: NODES.length, edges: G.edges.length, fusions: G.fused};

// ------------------------------------------------------------------------------------------------ shortest routes
const adj: [number, number][][] = NODES.map(() => []);
for (const [a, b, d] of G.edges) { adj[a].push([b, d]); adj[b].push([a, d]); }
const dijkstra = (src: number) => {
  const dist = new Float64Array(NODES.length).fill(Infinity), prev = new Int32Array(NODES.length).fill(-1);
  dist[src] = 0;
  // binary heap
  const h: [number, number][] = [[0, src]];
  const push = (x: [number, number]) => { h.push(x); let i = h.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } };
  const pop = () => { const top = h[0]; const last = h.pop()!; if (h.length) { h[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < h.length && h[l][0] < h[m][0]) m = l; if (r < h.length && h[r][0] < h[m][0]) m = r; if (m === i) break; [h[m], h[i]] = [h[i], h[m]]; i = m; } } return top; };
  while (h.length) {
    const [d, u] = pop();
    if (d > dist[u]) continue;
    for (const [v, w] of adj[u]) if (d + w < dist[v]) { dist[v] = d + w; prev[v] = u; push([dist[v], v]); }
  }
  return {dist, prev};
};
const nearest = (p: P2) => { let b = 0, bd = 1e9; NODES.forEach((q, i) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; b = i; } }); return b; };
export const ELECTRODE_NODES = ELECTRODES.map(nearest);
const TREES = ELECTRODE_NODES.map(dijkstra);

export type Route = {pts: P2[]; cum: number[]; len: number; t0: number; spike: number; amp: number; el: number};
const V = 4.2; // drawn pulse speed, cm/s (illustrative; real fungal spikes are far slower)
export const ROUTES: Route[] = EVENTS_EXT.map((e, k) => {
  const rnd = mulberry(4000 + Math.round(e.spike * 1000));
  const el = e.kind === 'featured' ? 0 : k % 2;
  const {dist, prev} = TREES[el];
  // a start node 0.8-1.3 cm along the network from the electrode (for the followed spike: a long route)
  const lo = e.kind === 'featured' ? 1.25 : 0.75, hi = e.kind === 'featured' ? 1.45 : 1.25;
  const cands: number[] = [];
  for (let i = 0; i < NODES.length; i++) if (dist[i] > lo && dist[i] < hi) cands.push(i);
  const start = cands.length ? cands[Math.floor(rnd() * cands.length)] : ELECTRODE_NODES[el];
  const pts: P2[] = [], cum: number[] = [];
  let u = start, c = 0;
  while (u !== -1) { if (pts.length) c += Math.hypot(NODES[u][0] - pts[pts.length - 1][0], NODES[u][1] - pts[pts.length - 1][1]); pts.push(NODES[u]); cum.push(c); u = prev[u]; }
  pts.push(ELECTRODES[el]); cum.push(c + Math.hypot(ELECTRODES[el][0] - pts[pts.length - 2][0], ELECTRODES[el][1] - pts[pts.length - 2][1]));
  const len = cum[cum.length - 1];
  return {pts, cum, len, t0: e.spike - len / V, spike: e.spike, amp: e.amp, el};
});
/** the lit part of each active pulse at time t: a comet along its route (head, tail length in cm, intensity) */
export const pulses = (t: number) => ROUTES.filter((r) => t >= r.t0 - 0.02 && t <= r.spike + 0.12).map((r) => {
  const head = clamp((t - r.t0) * V, 0, r.len);
  const fade = t > r.spike ? clamp(1 - (t - r.spike) / 0.12) : 1;
  return {r, head, tail: 0.42 * Math.min(1.2, r.amp), k: fade * Math.min(1.3, 0.75 + 0.3 * r.amp)};
});
/** the route's points between distances a and b */
export const routeSlice = (r: Route, a: number, b: number): P2[] => {
  const out: P2[] = [];
  const at = (d: number): P2 => {
    let i = 1; while (i < r.cum.length - 1 && r.cum[i] < d) i++;
    const k = (d - r.cum[i - 1]) / Math.max(1e-9, r.cum[i] - r.cum[i - 1]);
    return [r.pts[i - 1][0] + (r.pts[i][0] - r.pts[i - 1][0]) * k, r.pts[i - 1][1] + (r.pts[i][1] - r.pts[i - 1][1]) * k];
  };
  a = Math.max(0, a);
  out.push(at(a));
  for (let i = 0; i < r.cum.length; i++) if (r.cum[i] > a && r.cum[i] < b) out.push(r.pts[i]);
  out.push(at(b));
  return out;
};
/** electrode flash when a pulse arrives */
export const electrodeFlash = (t: number, idx: number) => {
  let g = 0;
  for (const r of ROUTES) { if (r.el !== idx) continue; const dt = t - r.spike; if (dt > 0 && dt < 0.5) g += r.amp * (dt < 0.05 ? dt / 0.05 : Math.exp(-(dt - 0.05) * 10)); }
  return g;
};
