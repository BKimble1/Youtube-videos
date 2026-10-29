// V2 sea slug renderer in the Weird Crew finish. The body surface is sampled into small facets, each shaded from the
// fixed upper-left key light (warm lit / cool shade ramps, kit/dc/color). All facets of a piece are sorted far to near
// together, so a parapodium passes correctly in front of or behind the trunk from any camera. The ink contour is
// drawn per facet only on true outline edges: silhouettes (where the surface turns away), the parapodial margins and
// ends, open wounds and cut edges. A nearer facet covers a farther one's ink, so outlines stay occlusion-correct.
import React from 'react';
import {lit, mix, shade} from '../../kit/dc/color';
import {INK} from '../../kit/dc/ink';
import {Basis, P2, V2, V3, add3, cross3, depth, dot3, len3, mul3, norm3, proj, sub3} from '../../kit/three';
import {clamp, lerp, smooth} from '../../lib';
import {A_CUT, C, F0, F1, Piece, SPOTS, TUBULES, geo, growPale, growSpots, heartAOf, isRegen} from './body';
import {capsuleItem, ellipsoidItem} from '../../kit/draw3';

type Facet = {z: number; d: string; fill: string; op?: number; ink?: string; kind?: 'deco' | 'line'; sw?: number; stroke?: string; node?: React.ReactNode};
const f1 = (n: number) => n.toFixed(1);
const poly = (pts: V2[]) => `M${pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}Z`;
const seg = (a: V2, b: V2) => `M${f1(a.x)},${f1(a.y)}L${f1(b.x)},${f1(b.y)}`;

/** key-light ramp: lambert -1..1 -> cool shadow .. base .. warm light, plus a wet specular */
const ramp = (base: string, lam: number, spec: number) => {
  const t = clamp((lam + 0.3) / 1.2);
  const c = t < 0.5 ? mix(shade(base, 0.7), base, t / 0.5) : mix(base, lit(base, 0.42), (t - 0.5) / 0.5);
  return spec > 0.02 ? mix(c, '#FFFFFF', Math.min(0.8, spec)) : c;
};
/** V5: a richer, more saturated green so the animal stands off the pale floor */
const C5 = {...C, body: '#5EAE3F', head: '#6FBA4A', foot: '#BFDC9B', flapOut: '#4E9C37', flapIn: '#8CC861', flapEdge: '#24502A', rhino: '#7DBB57', vein: '#3B7230'};
/** facets with a corner nearer than this (world units in front of the lens) are not drawn */
const NEAR = 3;
const quadOf = (q: V3[]) => mul3(add3(add3(q[0], q[1]), add3(q[2], q[3])), 0.25);

export type SlugOpts = {ink?: number; op?: number; noSpots?: boolean};

export const slugItem = (B: Basis, p: Piece, o: SlugOpts = {}): {z: number; el: React.ReactNode} => {
  const G = geo(p);
  const PC = p.style === 'v5' ? C5 : C;
  const regen = isRegen(p);
  const g = p.grow ?? 1;
  const pale = regen ? growPale(g) : 0;
  const xr = p.xray ?? 0;
  const eye = B.eye;
  const Lt = norm3(add3(add3(mul3(B.r, -0.55), mul3(B.u, 0.7)), mul3(B.fw, -0.45)));
  const lightOf = (n: V3, qc: V3) => {
    const lam = dot3(n, Lt);
    const V = norm3(sub3(eye, qc));
    const rf = sub3(mul3(n, 2 * dot3(n, Lt)), Lt);
    return [lam, Math.pow(Math.max(0, dot3(rf, V)), 16) * 0.55] as const;
  };
  const shadeQ = (base: string, n: V3, qc: V3, gloss = 1) => {
    const [lam, spec] = lightOf(n, qc);
    return ramp(base, lam, spec * gloss);
  };
  /** smooth shading: the light at the four corners (vertex normals) averaged over the facet */
  const shadeV = (base: string, ns4: V3[], q: V3[], gloss = 1) => {
    let lam = 0, spec = 0;
    for (let k = 0; k < 4; k++) {
      const [l, s] = lightOf(ns4[k], q[k]);
      lam += l / 4;
      spec += s / 4;
    }
    return ramp(base, lam, spec * gloss);
  };
  const Pp = (q: V3) => proj(B, q);
  const T = (col: string, a: number) => (pale > 0 && a > A_CUT ? mix(col, PC.pale, pale * 0.62) : col);
  const headCol = mix(PC.head, '#76B954', p.green ?? 0);
  const F: Facet[] = [];
  const mid = G.at((p.a0 + p.a1) / 2, 0, 3);
  const sc = Pp(mid).s * (p.scale ?? 1);
  const inkW = Math.max(1.5, Math.min(3.1, 0.2 * sc)) * (o.ink ?? 1);
  const surfOp = xr > 0 ? 1 - 0.5 * xr : undefined;

  // cutaway window (sagittal section, the near half removed)
  const cut = p.cut && p.cut.open > 0.001 ? p.cut : undefined;
  const latW = sub3(G.at((p.a0 + p.a1) / 2, 1, 3), mid);
  const nearSide = dot3(latW, sub3(eye, mid)) > 0 ? 1 : -1;
  const inCut = (a: number) => {
    if (!cut) return false;
    const c = (cut.a0 + cut.a1) / 2, hw = ((cut.a1 - cut.a0) / 2) * cut.open;
    return Math.abs(a - c) < hw;
  };
  // V3 tissue window: how see-through the wall is at (a, theta); a soft organic edge, the near flank and back only
  const win = p.win && p.win.open > 0.005 ? p.win : undefined;
  const winA = (a: number, th = 0) => {
    if (!win) return 0;
    const r = win.r * (0.75 + 0.25 * win.open) * (1 + 0.1 * Math.sin(th * 3 + a * 0.6) + 0.06 * Math.sin(a * 1.7 + 1));
    return win.open * (1 - smooth(clamp((Math.abs(a - win.a) / r - 0.55) / 0.45)));
  };
  const winAt = (a: number, th: number) => {
    const c = Math.cos(th) * nearSide, sn = Math.sin(th);
    return winA(a, th) * smooth(clamp((c + 0.35) / 0.6)) * smooth(clamp((sn + 0.45) / 0.5));
  };
  const wk = p.weak ?? 0;
  let zWin = Infinity;

  // ------------------------------------------------ the tube (head + trunk)
  const hasTrunk = p.a1 > A_CUT + 0.5 && (!regen || g > 0.015);
  const aEnd = hasTrunk ? p.a1 : Math.min(p.a1, A_CUT);
  const nA = Math.max(14, Math.round((aEnd - p.a0) * 1.05));
  const M = 28;
  const as: number[] = [];
  for (let i = 0; i <= nA; i++) as.push(lerp(p.a0, aEnd, i / nA));
  const ths: number[] = [];
  for (let j = 0; j <= M; j++) ths.push(-Math.PI / 2 + (j / M) * Math.PI * 2);
  const ring = as.map((a) => ths.map((th) => G.tube(a, th)));
  const R2 = ring.map((r) => r.map(Pp));
  // vertex normals (central differences, pointing away from the body axis)
  const vn: V3[][] = ring.map((r, i) =>
    r.map((pt, j) => {
      const ia = Math.max(0, i - 1), ib = Math.min(nA, i + 1);
      const ja = (j - 1 + M) % M, jb = (j + 1) % M;
      let n = cross3(sub3(ring[ib][j % M], ring[ia][j % M]), sub3(ring[i][jb], ring[i][ja]));
      const ln = len3(n);
      const ax = G.at(as[i], 0, G.h(as[i]) * 0.45);
      n = ln > 1e-9 ? mul3(n, 1 / ln) : norm3(sub3(pt, ax));
      if (dot3(n, sub3(pt, ax)) < 0) n = mul3(n, -1);
      return n;
    }),
  );
  const vis: boolean[][] = [];
  const nrm: V3[][] = [];
  for (let i = 0; i < nA; i++) {
    vis.push([]);
    nrm.push([]);
    const am = (as[i] + as[i + 1]) / 2;
    const axis = G.at(am, 0, G.h(am) * 0.45);
    for (let j = 0; j < M; j++) {
      const q = [ring[i][j], ring[i + 1][j], ring[i + 1][j + 1], ring[i][j + 1]];
      const qc = quadOf(q);
      let n = cross3(sub3(q[2], q[0]), sub3(q[3], q[1]));
      const ln = len3(n);
      n = ln > 1e-9 ? mul3(n, 1 / ln) : [0, 0, 1];
      if (dot3(n, sub3(qc, axis)) < 0) n = mul3(n, -1);
      const thm = (ths[j] + ths[j + 1]) / 2;
      const removed = !!cut && Math.cos(thm) * nearSide > 0 && inCut(am);
      vis[i].push(ln > 1e-9 && !removed && dot3(n, sub3(eye, qc)) > 0);
      nrm[i].push(n);
    }
  }
  const visAt = (i: number, j: number) => (i < 0 || i >= nA ? false : vis[i][(j + M) % M]);
  for (let i = 0; i < nA; i++) {
    const am = (as[i] + as[i + 1]) / 2;
    for (let j = 0; j < M; j++) {
      const thm = (ths[j] + ths[j + 1]) / 2;
      if (!vis[i][j]) continue;
      const q = [ring[i][j], ring[i + 1][j], ring[i + 1][j + 1], ring[i][j + 1]];
      const qc = quadOf(q);
      const foot = Math.sin(thm) < -0.3;
      const base = foot ? T(PC.foot, am) : am < A_CUT ? headCol : T(PC.body, am);
      let fill = shadeV(base, [vn[i][j], vn[i + 1][j], vn[i + 1][j + 1], vn[i][j + 1]], q, foot ? 0.2 : 1);
      // the weak spot: a pale, slightly translucent band of tissue round the neck groove
      if (wk > 0.01) fill = mix(fill, '#F2F6D2', 0.72 * wk * clamp(1 - Math.abs(am - A_CUT) / 1.8));
      const ww = winAt(am, thm);
      // outline edges: where the neighbouring facet turns away (silhouette), and open ends
      let ink = '';
      if (!visAt(i, j - 1)) ink += seg(R2[i][j], R2[i + 1][j]);
      if (!visAt(i, j + 1)) ink += seg(R2[i][j + 1], R2[i + 1][j + 1]);
      if (!visAt(i - 1, j) && (i > 0 || G.w(as[0]) > 0.4)) ink += seg(R2[i][j], R2[i][j + 1]);
      if (!visAt(i + 1, j) && (i < nA - 1 || G.w(as[nA]) > 0.4)) ink += seg(R2[i + 1][j], R2[i + 1][j + 1]);
      // in the window the wall reads as clear tissue onto the body cavity (the organs are drawn over it)
      if (ww > 0.01) {
        const [lam] = lightOf(vn[i][j], qc);
        fill = mix(fill, mix('#2F5F2E', '#6E9E52', clamp(0.3 + 0.4 * lam)), 0.88 * ww);
        if (ww > 0.3) zWin = Math.min(zWin, depth(B, qc));
      }
      if (Math.min(R2[i][j].z, R2[i + 1][j].z, R2[i + 1][j + 1].z, R2[i][j + 1].z) < NEAR) continue; // behind or at the lens
      F.push({z: depth(B, qc), d: poly([R2[i][j], R2[i + 1][j], R2[i + 1][j + 1], R2[i][j + 1]]), fill, op: surfOp, ink: ww > 0.6 ? undefined : ink || undefined});
    }
  }
  // the weak spot: a fine dashed ring round the neck groove, on the side toward the camera
  if (wk > 0.01 && A_CUT > p.a0 + 0.5 && A_CUT < aEnd - 0.5) {
    const n = 40, pts: V3[] = [];
    for (let k = 0; k <= n; k++) pts.push(G.tube(A_CUT, -Math.PI / 2 + (k / n) * Math.PI * 2));
    const P = pts.map(Pp);
    let d = '';
    for (let k = 0; k < n; k++) {
      const mid3 = mul3(add3(pts[k], pts[k + 1]), 0.5), ax = G.at(A_CUT, 0, G.h(A_CUT) * 0.45);
      if (dot3(sub3(mid3, ax), sub3(eye, mid3)) > 0 && k % 2 === 0) d += seg(P[k], P[k + 1]);
    }
    if (d) F.push({z: depth(B, G.at(A_CUT, 0, G.h(A_CUT))) - 3, d, fill: 'none', kind: 'line', stroke: '#FFFFFF', sw: Math.max(1.5, 0.3 * sc), op: 0.85 * wk});
  }
  // spots on the tube
  const spotF = (pt: V3, ta: V3, tb: V3, r: number, pl: boolean | undefined, op: number): Facet => {
    const e1 = mul3(norm3(ta), r), e2 = mul3(norm3(tb), r * 0.92);
    const pts: V2[] = [];
    for (let k = 0; k < 8; k++) {
      const ph = (k / 8) * Math.PI * 2;
      pts.push(Pp(add3(pt, add3(mul3(e1, Math.cos(ph)), mul3(e2, Math.sin(ph))))));
    }
    return {z: depth(B, pt) - 0.05, d: poly(pts), fill: pl ? PC.speck : PC.spot, op, kind: 'deco'};
  };
  const spotOp = (a: number) => (a > A_CUT && regen ? growSpots(g) : 1) * (1 - 0.45 * xr);
  if (!o.noSpots)
    SPOTS.forEach((s) => {
      if (s.part !== 'tube' || s.a < p.a0 + 0.5 || s.a > aEnd - 0.5) return;
      const pt = G.tube(s.a, s.q);
      const n0 = sub3(pt, G.at(s.a, 0, G.h(s.a) * 0.45));
      if (dot3(n0, sub3(eye, pt)) <= 0) return;
      if (cut && Math.cos(s.q) * nearSide > 0 && inCut(s.a)) return;
      const op = spotOp(s.a) * (1 - winAt(s.a, s.q));
      if (op < 0.02) return;
      F.push(spotF(add3(pt, mul3(norm3(n0), 0.05)), sub3(G.tube(s.a + 0.4, s.q), G.tube(s.a - 0.4, s.q)), sub3(G.tube(s.a, s.q + 0.06), G.tube(s.a, s.q - 0.06)), s.r, s.pale, op));
    });

  // ------------------------------------------------ parapodia (two-sided curling sheets)
  const fa0 = Math.max(F0, p.a0), fa1 = Math.min(F1, p.a1);
  if (hasTrunk && fa1 - fa0 > 2 && G.sp((F0 + F1) / 2) > 0.6) {
    for (const side of [1, -1]) {
      // denser when the camera is close (the curling margins otherwise shade in visible terraces)
      const nAf = sc > 22 ? 120 : 84, nS = sc > 22 ? 20 : 12;
      const af: number[] = [];
      for (let i = 0; i <= nAf; i++) af.push(lerp(fa0, fa1, i / nAf));
      const grid = af.map((a) => Array.from({length: nS + 1}, (_, k) => G.flap(side, a, k / nS)));
      const G2 = grid.map((r) => r.map(Pp));
      const out = sub3(G.at((fa0 + fa1) / 2, side, 4), G.at((fa0 + fa1) / 2, 0, 0));
      const fvn: V3[][] = grid.map((r, i) =>
        r.map((_, k) => {
          const ia = Math.max(0, i - 1), ib = Math.min(nAf, i + 1), ka = Math.max(0, k - 1), kb = Math.min(nS, k + 1);
          let n = cross3(sub3(grid[ib][k], grid[ia][k]), sub3(grid[i][kb], grid[i][ka]));
          n = mul3(n, 1 / (len3(n) || 1));
          return dot3(n, out) < 0 ? mul3(n, -1) : n;
        }),
      );
      const facing: boolean[][] = [];
      const ns: V3[][] = [];
      for (let i = 0; i < nAf; i++) {
        facing.push([]);
        ns.push([]);
        for (let k = 0; k < nS; k++) {
          const q = [grid[i][k], grid[i + 1][k], grid[i + 1][k + 1], grid[i][k + 1]];
          const qc = quadOf(q);
          let n = cross3(sub3(q[2], q[0]), sub3(q[3], q[1]));
          const ln = len3(n) || 1;
          n = mul3(n, 1 / ln);
          if (dot3(n, out) < 0) n = mul3(n, -1); // n = the outer face's normal
          facing[i].push(dot3(n, sub3(eye, qc)) > 0);
          ns[i].push(n);
        }
      }
      const removed = (i: number) => !!cut && side === nearSide && inCut((af[i] + af[i + 1]) / 2);
      for (let i = 0; i < nAf; i++) {
        if (removed(i)) continue;
        const am = (af[i] + af[i + 1]) / 2;
        for (let k = 0; k < nS; k++) {
          const q = [grid[i][k], grid[i + 1][k], grid[i + 1][k + 1], grid[i][k + 1]];
          const qc = quadOf(q);
          const outer = facing[i][k];
          const sgn = outer ? 1 : -1;
          const n4 = [fvn[i][k], fvn[i + 1][k], fvn[i + 1][k + 1], fvn[i][k + 1]].map((v) => mul3(v, sgn));
          const s = (k + 0.5) / nS;
          let base = outer ? mix(PC.flapOut, PC.flapIn, 0.25 * s) : mix(PC.flapIn, PC.glow, 0.3 * s);
          base = T(base, am);
          let fill = shadeV(base, n4, q, outer ? 0.9 : 0.45);
          fill = mix(fill, PC.glow, 0.3 * Math.pow(s, 3)); // thin margins transmit light
          if (k === nS - 1) fill = mix(fill, T(PC.flapEdge, am), outer ? 0.55 : 0.3); // the darker edging
          // V5: Elysia cf. marginata's margin: a fine orange band inside a black rim along the parapodial edge
          if (p.style === 'v5' && k === nS - 1) fill = T(outer ? '#20301E' : '#2E4A2A', am);
          if (p.style === 'v5' && k === nS - 2) fill = mix(fill, T('#E89A3C', am), outer ? 0.7 : 0.45);
          if (s < 0.2) fill = shade(fill, 0.2 * (1 - s / 0.2)); // shadow where it meets the body
          let ink = '';
          if (k === nS - 1) ink += seg(G2[i][nS], G2[i + 1][nS]);
          if (i === 0 || removed(i - 1)) ink += seg(G2[i][k], G2[i][k + 1]);
          if (i === nAf - 1 || removed(i + 1)) ink += seg(G2[i + 1][k], G2[i + 1][k + 1]);

          const fw = side === nearSide ? winA(am) * 0.9 : 0;
          if (fw > 0.01) {
            fill = mix(fill, mix('#4F8A42', '#9CC97C', 0.4 + 0.4 * s), 0.75 * fw);
            if (fw > 0.3) zWin = Math.min(zWin, depth(B, qc));
          }
          if (Math.min(G2[i][k].z, G2[i + 1][k].z, G2[i + 1][k + 1].z, G2[i][k + 1].z) < NEAR) continue;
          F.push({z: depth(B, qc), d: poly([G2[i][k], G2[i + 1][k], G2[i + 1][k + 1], G2[i][k + 1]]), fill, op: xr > 0 ? 1 - 0.55 * xr : undefined, ink: fw > 0.6 ? undefined : ink || undefined});
        }
      }
      // spots on the outer face; digestive tubules
      if (!o.noSpots)
        SPOTS.forEach((sp) => {
          if (sp.part !== 'flap' || sp.side !== side || sp.a < fa0 + 1 || sp.a > fa1 - 1) return;
          if (cut && side === nearSide && inCut(sp.a)) return;
          const pt = G.flap(side, sp.a, sp.q);
          const ta = sub3(G.flap(side, sp.a + 0.5, sp.q), G.flap(side, sp.a - 0.5, sp.q)), tb = sub3(G.flap(side, sp.a, sp.q + 0.03), G.flap(side, sp.a, sp.q - 0.03));
          let n = norm3(cross3(ta, tb));
          if (dot3(n, out) < 0) n = mul3(n, -1);
          if (dot3(n, sub3(eye, pt)) <= 0) return;
          const op = spotOp(sp.a) * (side === nearSide ? 1 - winA(sp.a) : 1);
          if (op < 0.02) return;
          F.push(spotF(add3(pt, mul3(n, 0.1)), ta, tb, sp.r, sp.pale, op));
        });
      TUBULES.filter((tb) => tb.side === side).forEach((tb) => {
        const pts = tb.pts.filter(([a]) => a > fa0 + 0.5 && a < fa1 - 0.5 && !(cut && side === nearSide && inCut(a))).map(([a, s]) => G.flap(side, a, s));
        if (pts.length < 2) return;
        // only where the outer face is toward the camera (they lie under its surface)
        const mz = pts.reduce((s, q) => s + depth(B, q), 0) / pts.length;
        F.push({z: mz - 0.04, d: `M${pts.map((q) => P2(Pp(q))).join(' L')}`, fill: 'none', kind: 'line', stroke: T(PC.vein, 60), sw: Math.max(1, 0.45 * sc), op: 0.28 + 0.45 * xr});
      });
    }
  }

  // ------------------------------------------------ rhinophores
  if (p.a0 < 1) {
    const t = p.t ?? 0, sw = p.sway ?? 1;
    for (const side of [1, -1]) {
      const bA = 6.5, h0 = G.h(bA);
      const swA = sw * 0.9 * Math.sin(t * 1.9 + side * 0.8), swV = sw * 0.7 * Math.sin(t * 1.4 + side * 2.1);
      // V4: shorter, more slender rhinophores (they were reading as two big orange horns)
      const rk = p.style === 'v5' ? 0.78 : p.style === 'v4' ? 0.7 : 1;
      const P0 = G.at(bA, side * 2.6, h0 * 0.92), P1 = G.at(3.6 + swA * 0.3, side * (2.6 + 2.8 * rk), h0 + 7.4 * rk), P2_ = G.at(-2.2 * rk + swA, side * (2.6 + (7.2 + swV) * rk), h0 + 13.0 * rk);
      const nU = 10, nR = 10;
      const cen: V3[] = [], rad: number[] = [];
      for (let i = 0; i <= nU; i++) {
        const u = i / nU;
        cen.push([0, 1, 2].map((k) => (1 - u) * (1 - u) * P0[k] + 2 * u * (1 - u) * P1[k] + u * u * P2_[k]) as V3);
        rad.push((lerp(1.6, 0.5, Math.pow(u, 1.25)) + 0.28 * Math.sin(Math.PI * u)) * (u > 0.97 ? 0.6 : 1) * (p.style === 'v4' || p.style === 'v5' ? 0.82 : 1));
      }
      const rings = cen.map((c, i) => {
        const tan = norm3(sub3(cen[Math.min(nU, i + 1)], cen[Math.max(0, i - 1)]));
        let e1 = cross3(tan, [0, 0, 1]);
        e1 = len3(e1) < 1e-6 ? [1, 0, 0] : norm3(e1);
        const e2 = cross3(e1, tan);
        return Array.from({length: nR + 1}, (_, k) => {
          const ph = (k / nR) * Math.PI * 2;
          return add3(c, add3(mul3(e1, Math.cos(ph) * rad[i]), mul3(e2, Math.sin(ph) * rad[i])));
        });
      });
      const RR = rings.map((r) => r.map(Pp));
      const rv: boolean[][] = [], rn: V3[][] = [];
      for (let i = 0; i < nU; i++) {
        rv.push([]);
        rn.push([]);
        for (let k = 0; k < nR; k++) {
          const q = [rings[i][k], rings[i + 1][k], rings[i + 1][k + 1], rings[i][k + 1]];
          const qc = quadOf(q);
          let n = norm3(cross3(sub3(q[2], q[0]), sub3(q[3], q[1])));
          if (dot3(n, sub3(qc, cen[i])) < 0) n = mul3(n, -1);
          rv[i].push(dot3(n, sub3(eye, qc)) > 0);
          rn[i].push(n);
        }
      }
      const rvAt = (i: number, k: number) => (i < 0 || i >= nU ? false : rv[i][(k + nR) % nR]);
      for (let i = 0; i < nU; i++)
        for (let k = 0; k < nR; k++) {
          if (!rv[i][k]) continue;
          const q = [rings[i][k], rings[i + 1][k], rings[i + 1][k + 1], rings[i][k + 1]];
          const qc = quadOf(q);
          const u = (i + 0.5) / nU;
          const base = p.style === 'v5' ? (u < 0.7 ? headCol : u < 0.88 ? '#E9952F' : '#F7C755') : p.style === 'v4' ? (u < 0.74 ? headCol : u < 0.9 ? '#D9A24E' : '#EBCB78') : u < 0.6 ? headCol : u < 0.85 ? PC.rhinoTip : PC.rhinoTip2;
          let ink = '';
          if (!rvAt(i, k - 1)) ink += seg(RR[i][k], RR[i + 1][k]);
          if (!rvAt(i, k + 1)) ink += seg(RR[i][k + 1], RR[i + 1][k + 1]);
          if (i === nU - 1) ink += seg(RR[i + 1][k], RR[i + 1][k + 1]);
          // the rhinophores are thin and translucent: lift their shadow side so a back-lit one never goes muddy
          const [lam, spc] = lightOf(rn[i][k], qc);
          if (Math.min(RR[i][k].z, RR[i + 1][k].z, RR[i + 1][k + 1].z, RR[i][k + 1].z) < NEAR) continue;
          F.push({z: depth(B, qc), d: poly([RR[i][k], RR[i + 1][k], RR[i + 1][k + 1], RR[i][k + 1]]), fill: ramp(base, lam * 0.6 + 0.25, spc * 1.2), ink: ink || undefined});
        }
      // the rolled groove along the inner side
      const groove = cen.slice(1, 9).map((c, i) => add3(c, mul3(norm3(sub3(G.at(bA, 0, h0 + 6), c)), rad[i + 1] * 0.75)));
      const gz = groove.reduce((s, q) => s + depth(B, q), 0) / groove.length;
      F.push({z: gz - 0.3, d: `M${groove.map((q) => P2(Pp(q))).join(' L')}`, fill: 'none', kind: 'line', stroke: shade(headCol, 0.55), sw: Math.max(1, 0.32 * sc), op: 0.55});
    }
  }

  const heartA_ = heartAOf(p);
  // ------------------------------------------------ the cut face (sagittal section through the window)
  let secZ = 0;
  if (cut) {
    const c0 = (cut.a0 + cut.a1) / 2, hw = ((cut.a1 - cut.a0) / 2) * cut.open;
    const s0 = Math.max(p.a0 + 0.3, c0 - hw), s1 = Math.min(aEnd - 0.3, c0 + hw);
    if (s1 - s0 > 0.5) {
      const nC = Math.max(6, Math.round((s1 - s0) * 1.2));
      const top = (a: number) => G.tube(a, Math.PI / 2)[2] / (p.scale ?? 1) - 0.25;
      const sec = (a: number, z: number) => G.at(a, 0, z);
      let zsum = 0;
      for (let i = 0; i < nC; i++) {
        const a = lerp(s0, s1, i / nC), b = lerp(s0, s1, (i + 1) / nC);
        const q: V3[] = [sec(a, 0.05), sec(b, 0.05), sec(b, top(b)), sec(a, top(a))];
        const qc = quadOf(q);
        const zq = depth(B, qc);
        zsum += zq;
        const am = (a + b) / 2;
        const tissue = am < A_CUT ? mix(PC.section, PC.head, 0.25) : T(PC.section, am);
        let ink = '';
        ink += seg(Pp(q[3]), Pp(q[2])) + seg(Pp(q[0]), Pp(q[1]));
        if (i === 0) ink += seg(Pp(q[0]), Pp(q[3]));
        if (i === nC - 1) ink += seg(Pp(q[1]), Pp(q[2]));
        F.push({z: zq - 0.2, d: poly(q.map(Pp)), fill: tissue, ink});
      }
      secZ = zsum / nC;
      // inside the section: the digestive gland (dark green lobes) along the upper body, the gut, the head's
      // tissue; drawn on the cut plane
      const lobes: React.ReactNode[] = [];
      const R = (k: number) => Math.sin(k * 12.9898) * 43758.5453 - Math.floor(Math.sin(k * 12.9898) * 43758.5453);
      for (let k = 0; k < 40; k++) {
        const a = lerp(s0 + 0.5, s1 - 0.5, (k + 0.5) / 40);
        if (Math.abs(a - A_CUT) < 2.2) continue;
        const tz = top(a);
        const zc = tz * (a < A_CUT ? 0.55 : 0.62 + 0.12 * R(k));
        const rr = (a < A_CUT ? 0.9 : 1.3) * (0.7 + 0.5 * R(k + 9));
        const pts: V2[] = [];
        for (let m = 0; m < 9; m++) {
          const ph = (m / 9) * Math.PI * 2;
          pts.push(Pp(sec(a + Math.cos(ph) * rr * 1.4, zc + Math.sin(ph) * rr)));
        }
        if (Math.abs(a - heartA_) < 4.2 && zc > tz * 0.5) continue;
        lobes.push(<path key={k} d={poly(pts)} fill={a < A_CUT ? '#9CC77A' : PC.gland} opacity={0.75} />);
      }
      // the gut: a pale tube along the lower body
      const gut = Array.from({length: 24}, (_, k) => {
        const a = lerp(s0 + 0.5, s1 - 0.5, k / 23);
        return Pp(sec(a, top(a) * 0.3 + 0.4 * Math.sin(a * 0.4)));
      });
      // the weak spot: the breaking plane across the neck groove
      const wk = p.weak ?? 0;
      const wl = wk > 0.01 && A_CUT > s0 && A_CUT < s1 ? (
        <g opacity={wk}>
          <path d={`M${P2(Pp(sec(A_CUT, 0.2)))} L${P2(Pp(sec(A_CUT, top(A_CUT))))}`} stroke="#FFFFFF" strokeWidth={Math.max(3, 0.7 * sc)} opacity={0.35} strokeLinecap="round" />
          <path d={`M${P2(Pp(sec(A_CUT, 0.2)))} L${P2(Pp(sec(A_CUT, top(A_CUT))))}`} stroke="#FFFFFF" strokeWidth={Math.max(1.5, 0.22 * sc)} strokeDasharray={`${0.6 * sc} ${0.45 * sc}`} strokeLinecap="round" />
        </g>
      ) : null;
      F.push({z: secZ - 0.3, d: '', fill: 'node', kind: 'deco', ink: undefined, node: (
        <g>
          {lobes}
          <path d={`M${gut.map(P2).join(' L')}`} fill="none" stroke="#EAD9A6" strokeWidth={Math.max(2, 0.9 * sc)} strokeLinecap="round" opacity={0.85} />
          {wl}
        </g>
      )} as Facet & {node: React.ReactNode});
    }
  }

  // ------------------------------------------------ the heart (inside; through translucent tissue or in the cutaway)
  const hv = p.heart ?? 0;
  const heartA = heartA_;
  if (hv > 0.01 && !p.win && p.a0 <= heartA && aEnd >= heartA) {
    const c3 = G.at(heartA, 0, G.h(heartA) * 0.66);
    const c = Pp(c3);
    const s = c.s * (p.scale ?? 1);
    const bt = p.beat ?? 0;
    const ax = Pp(G.at(heartA - 1, 0, G.h(heartA) * 0.66)), bx = Pp(G.at(heartA + 1, 0, G.h(heartA) * 0.66));
    const ang = (Math.atan2(bx.y - ax.y, bx.x - ax.x) * 180) / Math.PI;
    const gs = regen ? lerp(0.62, 1, smooth(g)) : 1;
    const vs = (1 + (regen ? 0.3 : 0.2) * bt) * lerp(0.45, 1, smooth(hv)) * gs;
    const lw = Math.max(1, 0.12 * s);
    F.push({
      z: cut && secZ ? Math.min(depth(B, c3), secZ - 0.6) : depth(B, c3),
      d: '',
      fill: 'heart',
      kind: 'deco',
      op: clamp(hv * 1.2),
      ink: JSON.stringify({x: c.x, y: c.y, ang, s, gs, vs, lw}),
    });
  }

  // ------------------------------------------------ V3: the organs inside the window
  if (win) {
    const axes = (a: number, rl: number, rw: number, rh: number): [V3, V3, V3] => {
      const tA = norm3(sub3(G.at(a + 0.6, 0, 0), G.at(a - 0.6, 0, 0)));
      const lat = norm3(sub3(G.at(a, 1, 0), G.at(a, 0, 0)));
      const sc0 = p.scale ?? 1;
      return [mul3(tA, rl * sc0), mul3(lat, rw * sc0), [0, 0, rh * sc0]];
    };
    const OR: {z: number; el: React.ReactNode}[] = [];
    const organ = (a: number, v: number, zf: number, r: [number, number, number], col: string, op: number, o2: {spec?: number; ink?: number; glossy?: boolean} = {}) => {
      if (a < p.a0 + 0.4 || a > aEnd - 0.4 || op < 0.02) return;
      const c3 = G.at(a, v * G.w(a), G.h(a) * zf);
      OR.push(ellipsoidItem(B, c3, axes(a, r[0], r[1], r[2]), col, {opacity: clamp(op), spec: o2.spec ?? 0.6, ink: o2.ink ?? Math.max(0.8, inkW * 0.45), glossy: o2.glossy}));
    };
    const vis0 = (a: number) => winA(a) * 1.25;
    const gS = regen ? growSpots(g) : 1;
    // the digestive gland: branching green lobes filling the body and running out under the parapodia
    for (let k = 0; k < 60; k++) {
      const a = 24 + k * 1.2 + 0.5 * Math.sin(k * 2.3);
      const v = (k % 2 ? 1 : -1) * (0.2 + 0.3 * Math.abs(Math.sin(k * 1.7)));
      organ(a, v, 0.48 + 0.18 * Math.sin(k * 2.9), [1.5 + 0.6 * Math.abs(Math.sin(k)), 1.1, 0.95], k % 3 ? PC.gland : '#4E8A3C', vis0(a) * (a > A_CUT + 3 ? gS : 1) * 0.9, {spec: 0.35});
    }
    // the head: the pale buccal mass at the front, the paired cerebral ganglia above it
    const pm = p.pump ?? 0;
    organ(5.5 - 0.5 * pm, 0, 0.38, [2.3 * (1 + 0.16 * pm), 1.7 * (1 - 0.12 * pm), 1.4 * (1 + 0.18 * pm)], mix('#E5BFA6', '#9CC46E', 0.35 * (p.green ?? 0)), vis0(5.5), {spec: 0.5});
    for (const sd of [1, -1]) organ(9.5, sd * 0.22, 0.62, [1.0, 0.95, 0.8], '#F2E8BE', vis0(9.5), {spec: 0.7});
    // the gut: one continuous pale tube back from the buccal mass, where the window shows it
    {
      const pts: ReturnType<typeof Pp>[] = [];
      let opS = 0, zs = 0;
      for (let a = Math.max(p.a0 + 0.5, 7); a < Math.min(aEnd - 1, 90); a += 1.0) {
        const op = vis0(a) * (a > A_CUT + 3 ? gS : 1) * 0.9;
        if (op < 0.12) continue;
        const q = Pp(G.at(a, 0.08 * G.w(a) * Math.sin(a * 0.35), G.h(a) * 0.27));
        pts.push(q);
        opS += op;
        zs += q.z;
      }
      if (pts.length > 2) {
        const d = `M${pts.map((q) => `${f1(q.x)},${f1(q.y)}`).join('L')}`, w = Math.max(1.2, 0.7 * pts[0].s * (p.scale ?? 1));
        OR.push({z: zs / pts.length, el: (
          <g opacity={clamp((0.7 * opS) / pts.length)}>
            <path d={d} fill="none" stroke={shade('#E7D6A0', 0.45)} strokeWidth={w + 2.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} fill="none" stroke="#E9DAA6" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )});
      }
    }
    // the heart in its pericardium, on the back just behind the neck: a pale coral two-chambered pump in a clear sac.
    // Regrowth: first a loose cluster of cells, which draws together into the sac and heart.
    if (hv > 0.01 && p.a0 <= heartA && aEnd >= heartA) {
      // (V5 draws the heart a little larger so it reads at phone size)
      const bt = p.beat ?? 0, gsz = (regen ? lerp(0.85, 1, smooth(g)) : 1) * (p.style === 'v5' ? 1.25 : 1);
      const form = smooth(clamp((hv - 0.25) / 0.75));
      const op = vis0(heartA);
      if (hv < 1) {
        const R0 = (k: number) => Math.sin(k * 78.233) * 43758.5453 % 1;
        for (let k = 0; k < 14; k++) {
          const ph = k * 2.4, rr = (1 - form) * 3.2 + 0.4;
          const a = heartA + Math.cos(ph) * rr * 0.9, v = (Math.sin(ph) * rr * 0.12);
          organ(a, v, 0.66 + 0.12 * R0(k), [0.5, 0.5, 0.5].map((x) => x * gsz) as [number, number, number], '#F0B7A2', op * clamp(hv * 3) * (1 - form * 0.9), {spec: 0.5});
        }
      }
      const sys0 = clamp(bt / 1.6);
      organ(heartA, 0, 0.66, [3.6 * gsz * (1 - 0.06 * sys0), 2.5 * gsz * (1 - 0.06 * sys0), 2.0 * gsz], PC.peri, op * 0.4 * form, {spec: 1, glossy: true, ink: Math.max(0.6, inkW * 0.3)});
      // systole: the ventricle squeezes and shortens while the auricle fills; diastole the reverse
      const sys = clamp(bt / 1.6);
      // the aorta: a fine vessel running forward from the ventricle
      if (form > 0.3) {
        const v0 = G.at(heartA - 2.2 * gsz, 0, G.h(heartA) * 0.62), v1 = G.at(heartA - 6 * gsz, 0, G.h(heartA - 6) * 0.5);
        OR.push(capsuleItem(B, v0, v1, 0.38 * gsz * (p.scale ?? 1), 0.28 * gsz * (p.scale ?? 1), '#E9A593', {opacity: clamp(op * form), ink: Math.max(0.6, inkW * 0.3), spec: 0.4}));
      }
      const sq = regen ? 1.5 : 1; // the new heart's squeeze is drawn larger so it reads at phone size
      // (the new heart is seen from above: its squeeze must show in plan, so length and width shrink hard)
      const vk = regen ? [0.55, 0.55, 0.3] : [0.3, 0.38, 0.36];
      organ(heartA - 0.7 * gsz, 0, 0.63, [2.1 * (1 - vk[0] * sys), 1.25 * (1 - vk[1] * sys), 1.35 * (1 - vk[2] * sys)].map((x) => x * gsz * (regen ? 1.25 : 1)) as [number, number, number], mix('#E0806C', '#A8382E', sys), op * form, {spec: 0.8, glossy: true});
      organ(heartA + 1.6 * gsz, 0.06, 0.72, [1.2 * (1 + 0.2 * sq * sys), 1.15 * (1 + 0.22 * sq * sys), 0.8].map((x) => x * gsz) as [number, number, number], '#EFB5A2', op * form * 0.9, {spec: 0.6});
    }
    // over the window skin, in their own far-to-near order
    const zTop = (isFinite(zWin) ? zWin : depth(B, G.at(win.a, 0, 3))) - 0.05;
    OR.sort((a2, b2) => b2.z - a2.z).forEach((it, k) => F.push({z: zTop - 1e-4 * k, d: '', fill: 'node', kind: 'deco', node: it.el}));
  }

  // ------------------------------------------------ draw far to near
  F.sort((a, b) => b.z - a.z);
  const els = F.map((f, i) => {
    if (f.fill === 'heart') {
      const h = JSON.parse(f.ink!);
      const s = h.s;
      return (
        <g key={i} transform={`translate(${f1(h.x)},${f1(h.y)}) rotate(${f1(h.ang)})`} opacity={f.op}>
          <ellipse rx={3.6 * s * h.gs} ry={2.8 * s * h.gs} fill={PC.peri} opacity={0.8} stroke="#B57E72" strokeWidth={h.lw} />
          <g transform={`scale(${h.vs.toFixed(3)})`}>
            <path d={`M${f1(-2.4 * s)},0 C${f1(-2.4 * s)},${f1(-1.9 * s)} ${f1(0.4 * s)},${f1(-1.9 * s)} ${f1(0.9 * s)},${f1(-0.3 * s)} C${f1(1.3 * s)},${f1(1.2 * s)} ${f1(-1.2 * s)},${f1(1.8 * s)} ${f1(-2.4 * s)},0Z`} fill={PC.heart} stroke="#7E2A26" strokeWidth={h.lw} />
            <ellipse cx={1.7 * s} cy={0.25 * s} rx={0.95 * s} ry={0.85 * s} fill="#E77A6E" stroke="#7E2A26" strokeWidth={h.lw * 0.8} />
            <ellipse cx={-1.4 * s} cy={-0.6 * s} rx={0.65 * s} ry={0.3 * s} fill={PC.heartHi} opacity={0.85} />
          </g>
        </g>
      );
    }
    if (f.fill === 'node') return <React.Fragment key={i}>{f.node}</React.Fragment>;
    if (f.kind === 'line') return <path key={i} d={f.d} fill="none" stroke={f.stroke} strokeWidth={f.sw} strokeLinecap="round" strokeLinejoin="round" opacity={f.op} />;
    if (f.kind === 'deco') return <path key={i} d={f.d} fill={f.fill} opacity={f.op} />;
    return (
      <React.Fragment key={i}>
        <path d={f.d} fill={f.fill} stroke={f.fill} strokeWidth={1.3} strokeLinejoin="round" opacity={f.op} />
        {f.ink && <path d={f.ink} fill="none" stroke={INK} strokeWidth={inkW} strokeLinecap="round" opacity={f.op !== undefined ? Math.max(0.6, f.op) : undefined} />}
      </React.Fragment>
    );
  });
  const z = F.length ? F.reduce((s, f) => s + f.z, 0) / F.length : depth(B, mid);
  return {z, el: <g key={p.id} opacity={o.op}>{els}</g>};
};

/** contact shadow and foot line on the substrate (floor pass) */
export const SlugFloor: React.FC<{B: Basis; p: Piece; id: string; alpha?: number}> = ({B, p, id, alpha = 0.3}) => {
  const G = geo(p);
  const regen = isRegen(p);
  const aEnd = p.a1 > A_CUT + 0.5 && (!regen || (p.grow ?? 1) > 0.015) ? p.a1 : Math.min(p.a1, A_CUT);
  const as: number[] = [];
  for (let i = 0; i <= 40; i++) as.push(lerp(p.a0, aEnd, i / 40));
  const ext = (a: number) => G.w(a) * 1.15 + (G.sp(a) > 0 ? G.sp(a) * 0.7 : 0);
  const outline = [...as.map((a) => proj(B, G.at(a, ext(a), 0.02))), ...as.slice().reverse().map((a) => proj(B, G.at(a, -ext(a), 0.02)))];
  const foot = [...as.map((a) => proj(B, G.at(a, G.w(a) * 1.06, 0.01))), ...as.slice().reverse().map((a) => proj(B, G.at(a, -G.w(a) * 1.06, 0.01)))];
  const s = proj(B, G.at((p.a0 + aEnd) / 2, 0, 0)).s;
  if (outline.some((q) => q.z < NEAR)) return null;
  return (
    <g>
      <defs>
        <filter id={`${id}sh`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(2, 2.2 * s)} />
        </filter>
        <filter id={`${id}ft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(1, 0.4 * s)} />
        </filter>
      </defs>
      <path d={poly(outline)} fill="#1E3A35" opacity={alpha * 0.5} filter={`url(#${id}sh)`} />
      <path d={poly(foot)} fill="#12261F" opacity={alpha} filter={`url(#${id}ft)`} />
    </g>
  );
};
void F1;
