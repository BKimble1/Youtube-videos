// V3 mycelium: a clear, sparse branching network grown from one central inoculation point on the scaffold (disc
// coordinates, cm). Six main cords radiate and curve; each carries a few secondary branches with short tertiary
// twigs. It is one tree: every junction is a shared node, so a pulse can only travel along drawn hyphae. The two
// electrodes sit ON main cords (the hyphae grew onto them), and every spike runs along the tree into one of them.
import {mulberry, clamp} from '../lib';
import {DISC_R} from './robot';
import {EVENTS_EXT} from './timing';

export type P2 = [number, number];
export type Hypha = {pts: P2[]; ids: number[]; tier: 0 | 1 | 2};
const R = DISC_R * 0.94;

const build = () => {
  const rnd = mulberry(91731);
  const nodes: P2[] = [[0, 0]];
  const parent: number[] = [-1];
  const hyphae: Hypha[] = [];
  const grow = (startId: number, dir: number, step: number, n: number, turn: number, tier: 0 | 1 | 2) => {
    const pts: P2[] = [nodes[startId]], ids = [startId];
    let a = dir, p = nodes[startId];
    const kids: [number, number, number][] = [];
    for (let i = 0; i < n; i++) {
      a += (rnd() - 0.5) * turn;
      const q: P2 = [p[0] + Math.cos(a) * step, p[1] + Math.sin(a) * step];
      if (Math.hypot(q[0], q[1]) > R) break;
      nodes.push(q); parent.push(ids[ids.length - 1]);
      const id = nodes.length - 1;
      pts.push(q); ids.push(id); p = q;
      if (tier === 0 && i > 6 && i % 9 === 4) kids.push([id, a + (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 0.35), 1]);
      if (tier === 1 && i > 3 && i % 7 === 3 && rnd() < 0.7) kids.push([id, a + (rnd() < 0.5 ? -1 : 1) * (0.7 + rnd() * 0.4), 2]);
    }
    if (pts.length > 1) hyphae.push({pts, ids, tier});
    for (const [id, ang, ct] of kids) {
      if (ct === 1) grow(id, ang, step * 0.9, Math.floor(n * 0.42 * (0.7 + rnd() * 0.5)), turn * 1.1, 1);
      else grow(id, ang, step * 0.8, 4 + Math.floor(rnd() * 5), turn * 1.4, 2);
    }
  };
  for (let j = 0; j < 6; j++) grow(0, (j / 6) * Math.PI * 2 + 0.3 + (rnd() - 0.5) * 0.4, 0.034, 56, 0.22, 0);
  return {nodes, parent, hyphae};
};
const G = build();
export const NET = G.hyphae;
export const NODES = G.nodes;
const PARENT = G.parent;
/** true when a and b are joined by a drawn hypha segment */
export const isEdge = (a: number, b: number) => PARENT[a] === b || PARENT[b] === a;

// the electrodes: on two main cords, about 0.8 cm from the centre (the cords grew over them)
const onCord = (cord: number, r: number) => {
  const h = NET.filter((x) => x.tier === 0)[cord];
  let best = h.ids[1];
  for (const id of h.ids) if (Math.abs(Math.hypot(NODES[id][0], NODES[id][1]) - r) < Math.abs(Math.hypot(NODES[best][0], NODES[best][1]) - r)) best = id;
  return best;
};
export const ELECTRODE_NODES = [onCord(1, 0.8), onCord(4, 0.85)];
export const ELECTRODES: P2[] = ELECTRODE_NODES.map((i) => NODES[i]);
export const NET_STATS = {hyphae: NET.length, nodes: NODES.length, mainCords: NET.filter((h) => h.tier === 0).length,
  secondary: NET.filter((h) => h.tier === 1).length, tertiary: NET.filter((h) => h.tier === 2).length};

// ------------------------------------------------------------------------------------------------ routes along the tree
const depth = (i: number) => { let d = 0; while (PARENT[i] !== -1) { i = PARENT[i]; d++; } return d; };
const pathBetween = (a: number, b: number) => {
  const up: number[] = [], down: number[] = [];
  let x = a, y = b;
  while (depth(x) > depth(y)) { up.push(x); x = PARENT[x]; }
  while (depth(y) > depth(x)) { down.push(y); y = PARENT[y]; }
  while (x !== y) { up.push(x); down.push(y); x = PARENT[x]; y = PARENT[y]; }
  return [...up, x, ...down.reverse()];
};
const segLen = (a: number, b: number) => Math.hypot(NODES[a][0] - NODES[b][0], NODES[a][1] - NODES[b][1]);
export type Route = {ids: number[]; pts: P2[]; cum: number[]; len: number; t0: number; spike: number; amp: number; el: number};
const V = 3.6; // drawn pulse speed, cm/s (illustrative; real fungal spikes are much slower)
const mkRoute = (startId: number, el: number, spike: number, amp: number): Route => {
  const ids = pathBetween(startId, ELECTRODE_NODES[el]);
  const pts = ids.map((i) => NODES[i]);
  const cum = [0];
  for (let k = 1; k < ids.length; k++) cum.push(cum[k - 1] + segLen(ids[k - 1], ids[k]));
  const len = cum[cum.length - 1];
  return {ids, pts, cum, len, t0: spike - len / V, spike, amp, el};
};
// candidate starts: tips and mid-points of secondary branches, 0.6-1.3 cm along the tree from the electrode
const routeLen = (a: number, b: number) => { const p = pathBetween(a, b); let s = 0; for (let k = 1; k < p.length; k++) s += segLen(p[k - 1], p[k]); return s; };
const CANDS = [0, 1].map((el) => {
  const out: number[] = [];
  for (let i = 1; i < NODES.length; i += 3) { const d = routeLen(i, ELECTRODE_NODES[el]); if (d > 0.6 && d < 1.3) out.push(i); }
  return out;
});
export const ROUTES: Route[] = EVENTS_EXT.flatMap((e, k) => {
  const rnd = mulberry(7000 + Math.round(e.spike * 1000));
  const el = e.kind === 'featured' ? 0 : k % 2;
  // under UV the spikes are larger and arrive as a burst along several branches at once
  const n = e.kind === 'uv' ? 3 : 1;
  return Array.from({length: n}, (_, j) => {
    const c = CANDS[(el + j) % 2];
    const start = e.kind === 'featured' ? c.reduce((b, i) => (routeLen(i, ELECTRODE_NODES[0]) > routeLen(b, ELECTRODE_NODES[0]) ? i : b), c[0]) : c[Math.floor(rnd() * c.length)];
    return mkRoute(start, (el + j) % 2, e.spike - 0.04 * j, e.amp);
  });
});
export const pulses = (t: number) => ROUTES.filter((r) => t >= r.t0 - 0.02 && t <= r.spike + 0.12).map((r) => {
  const head = clamp((t - r.t0) * V, 0, r.len);
  const fade = t > r.spike ? clamp(1 - (t - r.spike) / 0.12) : 1;
  return {r, head, tail: 0.38, k: fade * Math.min(1.25, 0.8 + 0.25 * r.amp)};
});
export const routeSlice = (r: Route, a: number, b: number): P2[] => {
  const at = (d: number): P2 => {
    let i = 1; while (i < r.cum.length - 1 && r.cum[i] < d) i++;
    const k = clamp((d - r.cum[i - 1]) / Math.max(1e-9, r.cum[i] - r.cum[i - 1]));
    return [r.pts[i - 1][0] + (r.pts[i][0] - r.pts[i - 1][0]) * k, r.pts[i - 1][1] + (r.pts[i][1] - r.pts[i - 1][1]) * k];
  };
  a = Math.max(0, a);
  const out: P2[] = [at(a)];
  for (let i = 0; i < r.cum.length; i++) if (r.cum[i] > a && r.cum[i] < b) out.push(r.pts[i]);
  out.push(at(b));
  return out;
};
export const electrodeFlash = (t: number, idx: number) => {
  let g = 0;
  for (const r of ROUTES) { if (r.el !== idx) continue; const dt = t - r.spike; if (dt > 0 && dt < 0.5) g += r.amp * (dt < 0.05 ? dt / 0.05 : Math.exp(-(dt - 0.05) * 10)); }
  return Math.min(g, 2.2);
};
