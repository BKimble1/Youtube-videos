// V3 mechanical probe over every frame (world geometry; the camera-dependent checks are in probe3_view.ts).
//  * every link's actuator length (ball centre to ball centre) within 0.25-0.40 m
//  * every joint: each ball touches at least one other ball of its cluster, and no two balls overlap
//  * no two parts of different links intersect (balls, necks, motor blocks, housings, rods; exact for spheres,
//    conservative for cylinders), and no part goes below the deck, ramp or floor
//  * the set of parts never changes (nothing appears or disappears)
//  * no part jumps: per-frame travel of every ball, and its change from the previous frame (a pop)
// usage: esbuild bundle, then node probe3.cjs [out.json]
import {world, EV} from '../source/src/v3/story';
import {resolve, ResolvedLink, RB, L_MIN, L_MAX, R_NECK, R_MOTOR, R_HOUS, R_ROD, S_NECK0, S_M0, S_M1, S_H1, S_ROD_IN} from '../source/src/v3/rig';
import {groundY} from '../source/src/v3/world';
import {FRAMES, FPS} from '../source/src/lib/time';
import {add, dot, len, mul, sub, V3} from '../source/src/lib/v3';
import * as fs from 'fs';

type Piece = {link: string; kind: 's' | 'y'; a: V3; b: V3; r: number; name: string};
const pieces = (l: ResolvedLink): Piece[] => {
  const at = (s: number) => add(l.Ca, mul(l.u, s));
  const out: Piece[] = [
    {link: l.id, kind: 's', a: l.Ca, b: l.Ca, r: RB, name: 'ballA'},
    {link: l.id, kind: 'y', a: at(S_NECK0), b: at(S_M0), r: R_NECK, name: 'neck'},
    {link: l.id, kind: 'y', a: at(S_M0), b: at(S_M1), r: R_MOTOR, name: 'motor'},
    {link: l.id, kind: 'y', a: at(S_M1), b: at(S_H1), r: R_HOUS * 1.05, name: 'housing'},
    {link: l.id, kind: 'y', a: at(S_H1), b: at(l.Lp - S_ROD_IN), r: R_ROD, name: 'rod'},
  ];
  if (!l.noBallB) out.push({link: l.id, kind: 's', a: l.Cb, b: l.Cb, r: RB, name: 'ballB'});
  return out;
};

/** distance from point p to a flat-ended cylinder (0 inside) */
const ptCyl = (p: V3, a: V3, b: V3, r: number) => {
  const ab = sub(b, a);
  const h = len(ab);
  if (h < 1e-9) return Math.max(0, len(sub(p, a)) - r);
  const w = mul(ab, 1 / h);
  const s = dot(sub(p, a), w);
  const radial = len(sub(sub(p, a), mul(w, s)));
  const out = s < 0 ? -s : s > h ? s - h : 0;
  const rr = Math.max(0, radial - r);
  return Math.hypot(rr, out);
};
/** gap between two pieces (lower bound for cylinder pairs, from axis samples) */
const gap = (A: Piece, B: Piece) => {
  if (A.kind === 's' && B.kind === 's') return len(sub(A.a, B.a)) - A.r - B.r;
  if (A.kind === 's') return ptCyl(A.a, B.a, B.b, B.r) - A.r;
  if (B.kind === 's') return ptCyl(B.a, A.a, A.b, A.r) - B.r;
  let best = Infinity;
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    best = Math.min(best, ptCyl(add(A.a, mul(sub(A.b, A.a), t)), B.a, B.b, B.r) - A.r, ptCyl(add(B.a, mul(sub(B.b, B.a), t)), A.a, A.b, A.r) - B.r);
  }
  return best;
};
const lowest = (P: Piece) => {
  if (P.kind === 's') return P.a.y - P.r - groundY(P.a.x, P.a.z);
  let m = Infinity;
  for (let i = 0; i <= 8; i++) {
    const p = add(P.a, mul(sub(P.b, P.a), i / 8));
    const u = sub(P.b, P.a);
    const L = len(u) || 1;
    const drop = P.r * Math.sqrt(Math.max(0, 1 - (u.y / L) ** 2));
    m = Math.min(m, p.y - drop - groundY(p.x, p.z));
  }
  return m;
};

const faults: {t: number; kind: string; what: string; v: number}[] = [];
const add_ = (t: number, kind: string, what: string, v: number) => faults.push({t: Math.round(t * 100) / 100, kind, what, v: Math.round(v * 10000) / 10000});
const range: Record<string, [number, number]> = {};
let ids0 = '';
let prevBalls: Record<string, V3> = {}, prevD: Record<string, V3> = {};
let minGap = Infinity, minGapWhat = '';
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  const R = resolve(world(t));
  // part set
  const ids = R.links.map((l) => l.id).sort().join(',');
  if (f === 0) ids0 = ids;
  else if (ids !== ids0) add_(t, 'parts', 'set changed', 0);
  // lengths
  for (const l of R.links) {
    const r = range[l.id] ?? [9, 0];
    range[l.id] = [Math.min(r[0], l.Lp), Math.max(r[1], l.Lp)];
    if (l.Lp < L_MIN - 2e-4 || l.Lp > L_MAX + 2e-4) add_(t, 'length', l.id, l.Lp);
  }
  // clusters
  for (const [j, balls] of Object.entries(R.balls)) {
    if (balls.length < 2) continue;
    for (let i = 0; i < balls.length; i++) {
      let near = Infinity;
      for (let k = 0; k < balls.length; k++) {
        if (k === i) continue;
        const d = len(sub(balls[i].c, balls[k].c)) - 2 * RB;
        near = Math.min(near, d);
        if (d < -3e-4 && k > i) add_(t, 'cluster-overlap', `${j} ${balls[i].key}/${balls[k].key}`, d);
      }
      if (near > 6e-4) add_(t, 'cluster-loose', `${j} ${balls[i].key}`, near);
    }
  }
  // pieces: intersections between different links, and the ground
  const P = R.links.flatMap(pieces);
  const clusterOf: Record<string, string> = {};
  for (const [j, balls] of Object.entries(R.balls)) for (const b of balls) clusterOf[b.key] = j;
  for (let i = 0; i < P.length; i++) {
    const lo = lowest(P[i]);
    if (lo < -5e-4) add_(t, 'ground', `${P[i].link}.${P[i].name}`, lo);
    for (let k = i + 1; k < P.length; k++) {
      if (P[i].link === P[k].link) continue;
      // balls of one cluster are checked above
      if (P[i].kind === 's' && P[k].kind === 's') {
        const ka = `${P[i].link}:${P[i].name === 'ballA' ? 'a' : 'b'}`, kb = `${P[k].link}:${P[k].name === 'ballA' ? 'a' : 'b'}`;
        if (clusterOf[ka] && clusterOf[ka] === clusterOf[kb]) continue;
      }
      const g = gap(P[i], P[k]);
      if (g < minGap) {
        minGap = g;
        minGapWhat = `${t.toFixed(2)} ${P[i].link}.${P[i].name}/${P[k].link}.${P[k].name}`;
      }
      if (g < -3e-4) add_(t, 'intersect', `${P[i].link}.${P[i].name}/${P[k].link}.${P[k].name}`, g);
    }
  }
  // jumps and pops (ball centres)
  const balls: Record<string, V3> = {};
  for (const l of R.links) {
    balls[`${l.id}:a`] = l.Ca;
    balls[`${l.id}:b`] = l.Cb;
  }
  const D: Record<string, V3> = {};
  for (const [k, p] of Object.entries(balls)) {
    if (!prevBalls[k]) continue;
    D[k] = sub(p, prevBalls[k]);
    const v = len(D[k]);
    if (v > 0.032) add_(t, 'jump', k, v); // ~0.96 m/s: faster reads as a jump at 30 fps
    if (prevD[k]) {
      const jerk = len(sub(D[k], prevD[k]));
      if (jerk > 0.012) add_(t, 'pop', k, jerk);
    }
  }
  prevBalls = balls;
  prevD = D;
}
// summarise faults by kind/what (first time, count, worst)
const sum: Record<string, {first: number; last: number; n: number; worst: number}> = {};
for (const x of faults) {
  const k = `${x.kind} ${x.what}`;
  const s = sum[k] ?? {first: x.t, last: x.t, n: 0, worst: x.v};
  s.n++;
  s.last = x.t;
  if (Math.abs(x.v) > Math.abs(s.worst)) s.worst = x.v;
  sum[k] = s;
}
const out = {frames: FRAMES, faults: faults.length, summary: sum, minGap: {m: Math.round(minGap * 10000) / 10000, at: minGapWhat}, lengths: Object.fromEntries(Object.entries(range).map(([k, [a, b]]) => [k, `${a.toFixed(3)}-${b.toFixed(3)}`])), events: EV};
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`${FRAMES} frames; ${faults.length} faults; min gap between parts ${out.minGap.m} m at ${out.minGap.at}`);
for (const [k, s] of Object.entries(sum).slice(0, 60)) console.log(`  ${k}: ${s.n}x ${s.first}-${s.last} worst ${s.worst}`);
