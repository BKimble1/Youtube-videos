// Inside the infected ant. After the spore germinates on the cuticle, its germ tube pierces the exoskeleton; fungal
// cells multiply in the body and grow into a connected network of branching filaments (hyphae) that wraps the muscle
// fibres: the leg muscles in the mesosoma and legs, and the large mandible-closing muscles that fill the head. The
// brain is left intact (Fredericksen et al. 2017, PNAS; Hughes et al. 2011): the fungus does not replace it.
// Drawn in the FGW finish: cream filaments with a darker under-stroke (organic, irregular, no glow), red striated
// muscle bundles, a pale clean brain.
import React from 'react';
import {add3, Basis, cross3, len3, lerp3, mul3, norm3, P2, proj, smoothOpen, sub3, V3} from '../core/three';
import {capsuleItem, ellipsoidItem, Item} from '../core/draw3';
import {lit, mix} from '../core/color';
import {dirW, Frame, toW} from '../core/frame';
import {bw, HEAD_C, hw, pair, Rig, side} from '../ant/rig';
import {hash} from '../lib';

// an anchor that moves with the rig: body or head coordinates, or a point along a leg segment
export type HP = {k: 'b'; p: V3} | {k: 'h'; p: V3} | {k: 'l'; i: number; seg: 0 | 1; u: number; a: number; r: number};
const legFrame = (R: Rig, i: number, seg: 0 | 1) => {
  const L = R.legs[i];
  const a = seg === 0 ? L.troch : L.knee, b = seg === 0 ? L.knee : L.ankle;
  const ax = norm3(sub3(b, a));
  let n = cross3(ax, R.body.u);
  if (len3(n) < 1e-4) n = cross3(ax, R.body.f);
  n = norm3(n);
  const m = cross3(ax, n);
  return {a, b, n, m};
};
const SEGR = [[0.27, 0.21], [0.19, 0.14]];
export const hpW = (R: Rig, h: HP): V3 => {
  if (h.k === 'b') return bw(R.st, h.p);
  if (h.k === 'h') return hw(R.st, R.head, h.p);
  const f = legFrame(R, h.i, h.seg);
  const c = lerp3(f.a, f.b, h.u);
  const rr = (SEGR[h.seg][0] + (SEGR[h.seg][1] - SEGR[h.seg][0]) * h.u) * h.r * (R.st.scale ?? 1);
  return add3(c, add3(mul3(f.n, Math.cos(h.a) * rr), mul3(f.m, Math.sin(h.a) * rr)));
};

/** a filament: anchors with birth times (network time, s) and a width (mm) */
export type Fil = {pts: HP[]; born: number[]; w: number};

const SOCK: V3[] = [[1.15, 0.36, -0.42], [0.15, 0.42, -0.48], [-0.6, 0.42, -0.42]];
/** the entry point under the landed spore (body coordinates), just inside the cuticle */
export const ENTRY: V3 = [-0.72, -0.42, 0.48];
const SPEED = 2.6; // mm of filament per second of network time

/** the network, grown from the entry point (deterministic) */
export const NETWORK: Fil[] = (() => {
  const fils: Fil[] = [];
  let seed = 1;
  const rnd = () => hash(seed++ * 1.618);
  const jit = (p: V3, s: number): V3 => [p[0] + (rnd() - 0.5) * s, p[1] + (rnd() - 0.5) * s, p[2] + (rnd() - 0.5) * s];
  /** a body-space run through waypoints, with wobble; returns anchors and births from t0 */
  const run = (way: HP[], t0: number, w: number, wob = 0.12): {f: Fil; tEnd: number} => {
    const pts: HP[] = [];
    const born: number[] = [];
    let t = t0;
    for (let k = 0; k < way.length - 1; k++) {
      const a = way[k], b = way[k + 1];
      if (a.k === 'l' || b.k === 'l') {
        pts.push(a);
        born.push(t);
        t += 0.12;
        continue;
      }
      const n = 5;
      for (let j = 0; j < n; j++) {
        const u = j / n;
        const p = lerp3(a.p, b.p, u);
        pts.push({k: a.k === b.k ? a.k : u < 0.5 ? a.k : b.k, p: j === 0 ? p : jit(p, wob)} as HP);
        born.push(t);
        t += len3(sub3(b.p, a.p)) / n / SPEED;
      }
    }
    pts.push(way[way.length - 1]);
    born.push(t);
    return {f: {pts, born, w}, tEnd: t};
  };
  const B = (p: V3): HP => ({k: 'b', p});
  const Hh = (p: V3): HP => ({k: 'h', p});
  // trunks: entry -> mesosoma core
  const core = run([B(ENTRY), B([-0.4, -0.25, 0.3]), B([0.1, 0, 0.2])], 0, 0.07);
  fils.push(core.f);
  // to the neck and through the head, around the mandible muscles (head coordinates after the neck)
  const neck = run([B([0.1, 0, 0.2]), B([1.2, 0.05, 0.25]), B([2.15, 0, 0.35])], core.tEnd, 0.06);
  fils.push(neck.f);
  const headIn: Fil = run([Hh([0.05, 0, 0.0]), Hh([0.6, 0.1, -0.1])], neck.tEnd, 0.055).f;
  fils.push(headIn);
  const tHead = neck.tEnd + 0.25;
  for (const s of [1, -1]) {
    // a sweep along each mandible muscle, then wrapping it
    const r = run([Hh([0.6, 0.1 * s, -0.1]), Hh([1.0, 0.5 * s, -0.25]), Hh([1.7, 0.62 * s, -0.25]), Hh([2.3, 0.5 * s, -0.45])], tHead, 0.05);
    fils.push(r.f);
    const wrapPts: HP[] = [], wrapBorn: number[] = [];
    for (let k = 0; k <= 30; k++) {
      const u = k / 30;
      const a = u * Math.PI * 2 * 2.5;
      wrapPts.push(Hh([0.45 + 1.6 * u, (0.58 + 0.42 * Math.cos(a)) * s, -0.05 + 0.5 * Math.sin(a)]));
      wrapBorn.push(r.tEnd + 0.15 + u * 0.9);
    }
    fils.push({pts: wrapPts, born: wrapBorn, w: 0.04});
  }
  // to each leg: down through the coxa, along the femur (wrapping its muscle), into the tibia
  for (let i = 0; i < 6; i++) {
    const k = pair(i), s = side(i);
    const sock: V3 = [SOCK[k][0], SOCK[k][1] * s, SOCK[k][2]];
    const r = run([B([0.1, 0, 0.2]), B([SOCK[k][0], 0.18 * s, 0.05]), B(sock)], core.tEnd + 0.1 * k, 0.05);
    fils.push(r.f);
    const legPts: HP[] = [], legBorn: number[] = [];
    for (let j = 0; j <= 14; j++) {
      const u = j / 14;
      legPts.push({k: 'l', i, seg: 0, u, a: u * 9 + i, r: 0.55});
      legBorn.push(r.tEnd + 0.1 + u * 0.55);
    }
    for (let j = 1; j <= 8; j++) {
      const u = j / 8;
      legPts.push({k: 'l', i, seg: 1, u, a: u * 7 + i, r: 0.5});
      legBorn.push(r.tEnd + 0.65 + u * 0.4);
    }
    fils.push({pts: legPts, born: legBorn, w: 0.035});
  }
  // into the gaster
  const gas = run([B(ENTRY), B([-1.5, -0.1, 0.3]), B([-1.9, 0, 0.3]), B([-2.8, 0.1, 0.35]), B([-3.9, -0.2, 0.4]), B([-4.6, 0.2, 0.5])], 0.1, 0.06);
  fils.push(gas.f);
  // side twigs along every trunk
  const twigs: Fil[] = [];
  fils.forEach((f) => {
    for (let j = 2; j < f.pts.length - 1; j += 2) {
      const a = f.pts[j];
      if (a.k === 'l') continue;
      const d: V3 = [(rnd() - 0.5) * 0.9, (rnd() - 0.5) * 0.9, (rnd() - 0.5) * 0.7];
      const p1 = add3(a.p, d), p2 = add3(p1, mul3(d, 0.6 + rnd() * 0.5));
      twigs.push({pts: [a, {k: a.k, p: p1}, {k: a.k, p: jit(p2, 0.2)}] as HP[], born: [f.born[j] + 0.05, f.born[j] + 0.25, f.born[j] + 0.45], w: 0.03});
    }
  });
  return [...fils, ...twigs];
})();
export const NET_END = Math.max(...NETWORK.map((f) => f.born[f.born.length - 1]));

const f2 = (n: number) => n.toFixed(2);
/** the network grown to network-time g, drawn on top of the x-ray body */
export const networkEl = (B: Basis, R: Rig, g: number, density = 1): React.ReactNode => {
  const sc = R.st.scale ?? 1;
  const paths: {d: string; w: number}[] = [];
  NETWORK.forEach((f) => {
    if (g <= f.born[0]) return;
    const pts: {x: number; y: number}[] = [];
    for (let k = 0; k < f.pts.length; k++) {
      if (g >= f.born[k]) pts.push(proj(B, hpW(R, f.pts[k])));
      else {
        const u = (g - f.born[k - 1]) / (f.born[k] - f.born[k - 1]);
        const a = proj(B, hpW(R, f.pts[k - 1])), b = proj(B, hpW(R, f.pts[k]));
        pts.push({x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u});
        break;
      }
    }
    if (pts.length < 2) return;
    const s = proj(B, hpW(R, f.pts[0])).s;
    paths.push({d: smoothOpen(pts), w: Math.max(0.9, f.w * s * sc * density)});
  });
  return (
    <g>
      {paths.map((p, k) => <path key={`u${k}`} d={p.d} fill="none" stroke="#4A3422" strokeWidth={f2(p.w * 2.1 + 0.8)} strokeLinecap="round" strokeLinejoin="round" opacity={0.45} />)}
      {paths.map((p, k) => <path key={`w${k}`} d={p.d} fill="none" stroke="#F3EDD6" strokeWidth={f2(p.w)} strokeLinecap="round" strokeLinejoin="round" />)}
    </g>
  );
};

/** muscles, brain and gut inside the body (x-ray), with a contraction pulse */
const MUSCLE = '#C2504F';
export const interiorItems = (B: Basis, R: Rig, pulse: number, wrapped: number): Item[] => {
  const st = R.st, sc = st.scale ?? 1, H = R.head;
  const items: Item[] = [];
  const m = mix(MUSCLE, '#E07A6E', pulse * 0.6);
  const ax = (F: Frame, a: V3): [V3, V3, V3] => [mul3(F.f, a[0] * sc), mul3(F.l, a[1] * sc), mul3(F.u, a[2] * sc)];
  const stri = (c: V3, F: Frame, len: number, n: number) => {
    const lines: string[] = [];
    for (let k = -n; k <= n; k++) {
      const a = proj(B, toW({...F, o: c}, [-len, k * 0.12, 0])), b = proj(B, toW({...F, o: c}, [len, k * 0.12, 0]));
      lines.push(`M${P2(a)} L${P2(b)}`);
    }
    return lines;
  };
  // head: the big mandible muscles either side, the brain between and above them (left clean)
  [1, -1].forEach((s) => {
    const c = hw(st, H, [HEAD_C[0] - 0.3, 0.55 * s, -0.1]);
    const P = proj(B, c);
    items.push(ellipsoidItem(B, c, ax(H, [0.95 * (1 + 0.05 * pulse), 0.46, 0.62]), m, {spec: 0.5, deco: <g opacity={0.45}>{stri(c, H, 0.9, 3).map((d, k) => <path key={k} d={d} stroke={lit(m, 0.35)} strokeWidth={f2(Math.max(0.6, 0.04 * P.s * sc))} />)}</g>}));
  });
  // nerve cord from the brain back through the mesosoma (pale), untouched
  items.push(capsuleItem(B, hw(st, H, [HEAD_C[0] - 0.6, 0, 0.3]), bw(st, [-1.4, 0, 0.0]), 0.06 * sc, 0.06 * sc, '#EBD3C6', {spec: 0, ink: 0.8}));
  // the leg muscles in the mesosoma, and the femur muscles
  R.legs.forEach((L, i) => {
    const k = pair(i), s = side(i);
    const top = bw(st, [SOCK[k][0], 0.12 * s, 0.32]);
    items.push(capsuleItem(B, top, L.socket, 0.26 * sc * (1 + 0.08 * pulse), 0.22 * sc, m, {spec: 0.4, ink: 0.9}));
    items.push(capsuleItem(B, lerp3(L.troch, L.knee, 0.1), lerp3(L.troch, L.knee, 0.82), 0.13 * sc * (1 + 0.12 * pulse), 0.08 * sc, m, {spec: 0.3, ink: 0.7}));
    items.push(capsuleItem(B, lerp3(L.knee, L.ankle, 0.12), lerp3(L.knee, L.ankle, 0.7), 0.07 * sc, 0.05 * sc, m, {spec: 0.2, ink: 0.6}));
  });
  // gut in the gaster (pale amber), gradually filling with fungal cells
  items.push(ellipsoidItem(B, bw(st, [-3.5, 0, 0.42]), ax(st.body, [1.0, 0.6, 0.55]), mix('#C99A5C', '#E8DCC0', wrapped * 0.5), {spec: 0.2, fillOpacity: 0.55}));
  return items;
};

/** the brain: drawn over the network, clean and intact (the fungus surrounds the muscles, not the brain) */
export const brainItems = (B: Basis, R: Rig): Item[] => {
  const st = R.st, sc = st.scale ?? 1, H = R.head;
  return [1, -1].map((s) => ellipsoidItem(B, hw(st, H, [HEAD_C[0] - 0.25, 0.25 * s, 0.6]), [mul3(H.f, 0.46 * sc), mul3(H.l, 0.3 * sc), mul3(H.u, 0.3 * sc)], '#F3D5C8', {spec: 0.8}));
};

/** the germ tube: from the spore on the cuticle into the body (grows 0..1) */
export const germTube = (B: Basis, R: Rig, g: number, landLocal: V3): React.ReactNode => {
  if (g <= 0) return null;
  const a = bw(R.st, landLocal);
  const b = bw(R.st, ENTRY);
  const mid = add3(lerp3(a, b, 0.5), mul3(R.st.body.f, 0.12));
  const pts = [a, mid, b].map((p) => proj(B, p));
  const n = Math.max(2, Math.ceil(g * 8));
  const sm: {x: number; y: number}[] = [];
  for (let k = 0; k <= n; k++) {
    const u = (k / n) * g;
    const q = u < 0.5 ? {x: pts[0].x + (pts[1].x - pts[0].x) * u * 2, y: pts[0].y + (pts[1].y - pts[0].y) * u * 2} : {x: pts[1].x + (pts[2].x - pts[1].x) * (u - 0.5) * 2, y: pts[1].y + (pts[2].y - pts[1].y) * (u - 0.5) * 2};
    sm.push(q);
  }
  const w = Math.max(1.0, 0.035 * pts[0].s);
  const tip = sm[sm.length - 1];
  return (
    <g>
      <path d={smoothOpen(sm)} fill="none" stroke="#4A3422" strokeWidth={f2(w * 2 + 1)} strokeLinecap="round" opacity={0.5} />
      <path d={smoothOpen(sm)} fill="none" stroke="#F3EDD6" strokeWidth={f2(w)} strokeLinecap="round" />
      <circle cx={f2(tip.x)} cy={f2(tip.y)} r={f2(w * 1.1)} fill="#F7F1DE" stroke="#4A3422" strokeWidth={f2(Math.max(0.5, w * 0.3))} />
    </g>
  );
};
