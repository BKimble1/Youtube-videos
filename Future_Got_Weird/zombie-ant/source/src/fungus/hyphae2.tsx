// V2: the infection drawn as living tissue rather than a diagram.
// - Close in, under the landed spore: bundles of striated muscle fibres, pale fat-body lobes, and the fungus growing
//   between them from the germ tube's tip: yeast-like fungal cells that bud and multiply, and hyphae that creep along
//   the fibres and wrap them (Fredericksen et al. 2017: fungal cells surround and invade the muscle fibres, linked into
//   a network). Everything sits in the ant's body coordinates, so it moves with the ant.
// - Further out: the same growth through the whole body: the network as soft, uneven cream strands beaded with cells,
//   densest where it started, wrapping the leg and mandible muscles; the brain is left intact.
import React from 'react';
import {add3, Basis, cross3, len3, lerp3, mul3, norm3, P2, proj, smoothClosed, smoothOpen, sub3, V3} from '../core/three';
import {capsuleItem, ellipsoidItem, inkW, Item} from '../core/draw3';
import {lit, mix, shade} from '../core/color';
import {INK} from '../core/ink';
import {bw, Rig} from '../ant/rig';
import {hash} from '../lib';
import {ENTRY, HP, hpW, NETWORK} from './hyphae';

const f2 = (n: number) => n.toFixed(2);
type Fiber = {a: V3; b: V3; r: number};
// two crossing bundles of muscle fibres in the side of the mesosoma, under the entry point (body coordinates)
const bundle = (a: V3, b: V3, n: number, depth: number, spread: number): Fiber[] => {
  const ax = norm3(sub3(b, a));
  const side = norm3(cross3(ax, [0, 1, 0]));
  return Array.from({length: n}, (_, k) => {
    const o = (k - (n - 1) / 2) * spread;
    const dy = depth + (k % 2) * 0.08;
    const off: V3 = add3(mul3(side, o), [0, dy, 0]);
    return {a: add3(a, off), b: add3(b, off), r: 0.072 + 0.012 * hash(k * 3.1)};
  });
};
export const FIBERS: Fiber[] = [
  ...bundle([-2.1, -0.36, 1.2], [0.7, -0.36, -0.55], 9, 0, 0.165),
  ...bundle([-2.3, -0.22, -0.05], [0.6, -0.22, 0.95], 8, 0, 0.16),
  ...bundle([-1.9, -0.1, 0.55], [0.8, -0.1, 0.25], 7, 0, 0.17),
];
const FIB_DIRS = [norm3(sub3([0.7, -0.36, -0.55], [-2.1, -0.36, 1.2])), norm3(sub3([0.6, -0.22, 0.95], [-2.3, -0.22, -0.05]))];
const FAT: {c: V3; r: number}[] = Array.from({length: 7}, (_, k) => ({
  c: [ENTRY[0] - 0.9 + hash(k * 2.3) * 1.6, -0.12 - hash(k * 4.1) * 0.22, ENTRY[2] - 0.7 + hash(k * 6.7) * 1.0] as V3,
  r: 0.1 + 0.08 * hash(k * 8.9),
}));
const segDist = (p: V3, f: Fiber) => {
  const ab = sub3(f.b, f.a);
  const u = Math.max(0, Math.min(1, ((p[0] - f.a[0]) * ab[0] + (p[1] - f.a[1]) * ab[1] + (p[2] - f.a[2]) * ab[2]) / (ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2)));
  return {d: len3(sub3(p, add3(f.a, mul3(ab, u)))), u};
};

/** fungal cells: budding from the germ tube's tip (network time of birth, parent), deterministic */
type Cell = {p: V3; born: number; parent: number; dir: V3};
export const CELLS: Cell[] = (() => {
  const cells: Cell[] = [{p: ENTRY, born: 0, parent: -1, dir: [0, 1, 0]}];
  let seed = 7;
  const rnd = () => hash(seed++ * 1.37);
  let frontier = [0];
  for (let gen = 0; gen < 10 && cells.length < 200; gen++) {
    const next: number[] = [];
    for (const i of frontier) {
      const c = cells[i];
      const buds = c.parent < 0 ? 3 : 2;
      for (let b = 0; b < buds && cells.length < 200; b++) {
        // bud toward open tissue: away from the entry, sliding between the fibres, never into them
        // mostly along the fibres (the gaps between them), either way
        const fd = FIB_DIRS[(i + b) % 2];
        const sg = rnd() < 0.5 ? -1 : 1;
        let d: V3 = norm3(add3(mul3(fd, sg), [(rnd() - 0.5) * 0.7, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.7]));
        for (let tries = 0; tries < 8; tries++) {
          const p = add3(c.p, mul3(d, 0.13 + 0.03 * rnd()));
          const inFiber = FIBERS.some((f) => segDist(p, f).d < f.r + 0.035);
          const far = len3(sub3(p, ENTRY)) > 2.0 || p[1] > 0.05 || p[1] < -0.62;
          const crowded = cells.some((x) => len3(sub3(x.p, p)) < 0.085);
          if (!inFiber && !far && !crowded) {
            cells.push({p, born: c.born + 0.3 + b * 0.28 + 0.06 * rnd(), parent: i, dir: d});
            next.push(cells.length - 1);
            break;
          }
          d = norm3([rnd() - 0.5, (rnd() - 0.5) * 0.8, rnd() - 0.5]);
        }
      }
    }
    frontier = next;
  }
  return cells;
})();
export const CELLS_END = Math.max(...CELLS.map((c) => c.born));
/** hyphae creeping along a fibre from cells that touch it (helix round the fibre) */
type Wrap = {f: number; u0: number; born: number; turns: number; len: number};
export const WRAPS: Wrap[] = (() => {
  const out: Wrap[] = [];
  CELLS.forEach((c, i) => {
    if (i % 3) return;
    let best = -1, bd = 9, bu = 0;
    FIBERS.forEach((f, k) => {
      const s = segDist(c.p, f);
      if (s.d < bd) { bd = s.d; best = k; bu = s.u; }
    });
    if (best >= 0 && bd < 0.3) out.push({f: best, u0: bu, born: c.born + 0.5, turns: 1.4 + hash(i) * 1.2, len: 0.25 + 0.2 * hash(i * 3)});
  });
  return out;
})();

/** the close-in tissue under the entry point, grown to network time c, with contraction pulse */
export const tissueItems = (B: Basis, R: Rig, c: number, pulse: number): Item[] => {
  const st = R.st, sc = st.scale ?? 1;
  const W = (p: V3) => bw(st, p);
  const items: Item[] = [];
  // the inside: dark, warm body fluid around the tissue (drawn behind everything else here)
  const E = proj(B, W(ENTRY));
  const RR = 2.4 * sc * E.s;
  items.push({
    z: E.z + 3 * sc,
    el: (
      <g key="hemo">
        <defs>
          <radialGradient id="hemoG" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#6B3324" stopOpacity="0.95" />
            <stop offset="0.7" stopColor="#4A2118" stopOpacity="0.85" />
            <stop offset="1" stopColor="#4A2118" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={f2(E.x)} cy={f2(E.y)} r={f2(RR)} fill="url(#hemoG)" />
      </g>
    ),
  });
  // muscle fibres: striated, bulging slightly as they contract
  FIBERS.forEach((f, k) => {
    const a = W(f.a), b = W(f.b);
    const r = f.r * sc * (1 + 0.18 * pulse);
    const it = capsuleItem(B, a, b, r, r, mix('#B9474A', '#DB6B66', pulse * 0.5), {spec: 0.35, ink: Math.max(0.6, 0.02 * proj(B, a).s)});
    const A = proj(B, a), Bp = proj(B, b);
    const L = Math.hypot(Bp.x - A.x, Bp.y - A.y);
    const nx = -(Bp.y - A.y) / (L || 1), ny = (Bp.x - A.x) / (L || 1);
    const rp = r * (A.s + Bp.s) / 2;
    const n = Math.max(4, Math.floor(L / Math.max(4, rp * 0.7)));
    const stri: string[] = [];
    for (let j = 1; j < n; j++) {
      const x = A.x + ((Bp.x - A.x) * j) / n, y = A.y + ((Bp.y - A.y) * j) / n;
      stri.push(`M${f2(x - nx * rp * 0.85)},${f2(y - ny * rp * 0.85)} L${f2(x + nx * rp * 0.85)},${f2(y + ny * rp * 0.85)}`);
    }
    items.push({z: it.z, el: <g key={`fb${k}`}>{it.el}<g opacity={0.35}>{stri.map((d, j) => <path key={j} d={d} stroke={shade('#B9474A', 0.45)} strokeWidth={f2(Math.max(0.5, rp * 0.12))} />)}</g></g>});
  });
  FAT.forEach((q) => items.push(ellipsoidItem(B, W(q.c), [[q.r * sc, 0, 0], [0, q.r * 0.8 * sc, 0], [0, 0, q.r * 0.9 * sc]] as [V3, V3, V3], '#E8CF86', {spec: 0.5})));
  // fungal cells: budding ovals (a bud swells on the parent before it separates), linked by short hyphal necks
  const pts = CELLS.filter((x) => x.born <= c);
  pts.forEach((x) => {
    const age = c - x.born;
    const grow = Math.min(1, age / 0.3);
    const p = x.parent >= 0 ? lerp3(CELLS[x.parent].p, x.p, 0.35 + 0.65 * grow) : x.p;
    const P = proj(B, W(p));
    const rr = (0.034 + 0.018 * Math.min(1, age / 0.6)) * sc * P.s;
    const ang = Math.atan2(x.dir[2], x.dir[0]) * (180 / Math.PI);
    const neck = x.parent >= 0 ? proj(B, W(CELLS[x.parent].p)) : null;
    items.push({
      z: P.z - 0.05,
      el: (
        <g key={`c${x.born.toFixed(3)}_${x.parent}`}>
          {neck && <path d={`M${P2(neck)} L${P2(P)}`} stroke="#E9DFC4" strokeWidth={f2(Math.max(0.6, rr * 0.55))} strokeLinecap="round" />}
          <ellipse cx={f2(P.x)} cy={f2(P.y)} rx={f2(rr * 1.35)} ry={f2(rr)} transform={`rotate(${f2(-ang)} ${f2(P.x)} ${f2(P.y)})`} fill="#F5EEDA" stroke="#6E5A3E" strokeWidth={f2(Math.max(0.5, rr * 0.18))} />
          <circle cx={f2(P.x - rr * 0.3)} cy={f2(P.y - rr * 0.25)} r={f2(rr * 0.28)} fill="#FFFFFF" opacity={0.7} />
        </g>
      ),
    });
  });
  // hyphae wrapping the fibres
  WRAPS.forEach((w, k) => {
    if (c <= w.born) return;
    const f = FIBERS[w.f];
    const g = Math.min(1, (c - w.born) / 0.9);
    const ax = sub3(f.b, f.a), L = len3(ax), ad = norm3(ax);
    const n1 = norm3(cross3(ad, [0, 1, 0])), n2 = cross3(ad, n1);
    const steps = 22;
    const ps: {x: number; y: number; z: number}[] = [];
    for (let j = 0; j <= steps * g; j++) {
      const u = w.u0 + ((j / steps) * w.len) / L - w.len / L / 2;
      const a = (j / steps) * w.turns * Math.PI * 2;
      const rr = f.r + 0.03;
      const p = add3(add3(f.a, mul3(ax, Math.max(0, Math.min(1, u)))), add3(mul3(n1, Math.cos(a) * rr), mul3(n2, Math.sin(a) * rr)));
      const P = proj(B, W(p));
      ps.push({x: P.x, y: P.y, z: P.z});
    }
    if (ps.length < 2) return;
    const s = proj(B, W(f.a)).s;
    const wd = Math.max(0.6, 0.022 * s * sc);
    items.push({z: proj(B, W(lerp3(f.a, f.b, w.u0))).z - f.r * sc - 0.02, el: <path key={`w${k}`} d={smoothOpen(ps)} fill="none" stroke="#F3EBD2" strokeWidth={f2(wd)} strokeLinecap="round" opacity={0.95} />});
  });
  return items;
};

/** the network through the whole body as soft, uneven strands beaded with fungal cells (grown to network time g) */
export const organicNetworkEl = (B: Basis, R: Rig, g: number): React.ReactNode => {
  const sc = R.st.scale ?? 1;
  const strands: {d: string; w: number}[] = [];
  const beads: {x: number; y: number; r: number}[] = [];
  NETWORK.forEach((f, fi) => {
    if (g <= f.born[0]) return;
    // V3: the trunks only (no side twigs): a clean, readable network
    if (f.pts.length <= 3) return;
    const pts: {x: number; y: number; s: number}[] = [];
    for (let k = 0; k < f.pts.length; k++) {
      if (g >= f.born[k]) {
        const P = proj(B, hpW(R, f.pts[k] as HP));
        pts.push({x: P.x, y: P.y, s: P.s});
      } else {
        const u = (g - f.born[k - 1]) / (f.born[k] - f.born[k - 1]);
        const a = proj(B, hpW(R, f.pts[k - 1] as HP)), b = proj(B, hpW(R, f.pts[k] as HP));
        pts.push({x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, s: a.s});
        break;
      }
    }
    if (pts.length < 2) return;
    const s = pts[0].s;
    strands.push({d: smoothOpen(pts), w: Math.max(0.8, f.w * 1.35 * s * sc)});
    // cells strung along the strand, more of them where the strand is older
    pts.forEach((q, k) => {
      if ((k + fi) % 4) return;
      beads.push({x: q.x, y: q.y, r: Math.max(1.2, (0.045 + 0.02 * hash(fi * 7 + k)) * q.s * sc)});
    });
  });
  return (
    <g>
      {strands.map((p, k) => <path key={`u${k}`} d={p.d} fill="none" stroke="#5A4630" strokeWidth={f2(p.w + 1.6)} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />)}
      {strands.map((p, k) => <path key={`w${k}`} d={p.d} fill="none" stroke="#EFE5CA" strokeWidth={f2(p.w)} strokeLinecap="round" strokeLinejoin="round" />)}
      {beads.map((b, k) => <ellipse key={`b${k}`} cx={f2(b.x)} cy={f2(b.y)} rx={f2(b.r * 1.3)} ry={f2(b.r)} fill="#F6EFDB" stroke="#6E5A3E" strokeWidth={f2(Math.max(0.4, b.r * 0.2))} />)}
    </g>
  );
};
void P2;
void smoothClosed;
void inkW;
void lit;
void INK;
