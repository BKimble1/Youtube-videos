// The canonical robot, in 3D, as painter-sorted SVG items. Every shot that shows the robot draws it through this one
// module from the same body plan (state.ts), so it never changes shape between shots: only its pose, its centreline
// (the gut, a steered bend, the lab bench) and the camera change.
//
// Surface: a tube around a centreline frame (p, T, N, B) with radius r(u, phi):
//   caps and collars  pale clinical grey, glossy
//   anchors           a balloon under a teal kirigami sleeve; inflation a in [0, 1] swells it to touch the wall
//   extender          pale silicone with four longitudinal chamber lobes and fibre ribs; pressurised = cyan glow
// Kirigami scales: a staggered grid of triangular flaps cut into each sleeve. Flat, they are cut lines; as the balloon
// passes POP_ON they hinge out about their forward edge (tips pointing back toward the tail, like snake scales), leaving
// a dark opening in the sleeve. They stay attached and move with the sleeve.
import {add3, Basis, cross3, dot3, len3, mul3, norm3, P2, proj, sub3, V2, V3} from '../core/three';
import {depthOf, facing, gradFrom, Item, Light, shadeAt} from '../core/render';
import {C, INK, INK_PX} from '../art/palette';
import {mix} from '../core/color';
import {clamp, ss} from '../lib';
import {CrawlState, extLen, LEN, R_ANCHOR_MAX} from './state';

export type Fr = {p: V3; T: V3; N: V3; B: V3};
export type FrameF = (s: number) => Fr;

type Sec = 'tailCap' | 'tailAnchor' | 'collarT' | 'ext' | 'collarH' | 'headAnchor' | 'headCap';
export const layout = (e: number) => {
  const u1 = LEN.tailCap, u2 = u1 + LEN.anchor, u3 = u2 + LEN.collar, u4 = u3 + extLen(e), u5 = u4 + LEN.collar, u6 = u5 + LEN.anchor, u7 = u6 + LEN.headCap;
  return {u1, u2, u3, u4, u5, u6, u7};
};
const TIP_R = 0.44, CH_R = 0.29, TETHER_R = 0.34;
const FLAP_H = 0.17, FLAP_MAX = (50 * Math.PI) / 180, ROWS = 6, COLS = 16;
const NPHI = 48;

/** anchor balloon radius along its length (v in [0,1]) at inflation a */
const anchorR = (v: number, a: number) => {
  const R = 1.02 + (R_ANCHOR_MAX - 1.02) * a;
  const sh = Math.sin(Math.PI * clamp(v)) ** 0.55;
  return 1.0 + 0.025 * Math.sin(Math.PI * clamp(v)) + (R - 1.02) * sh;
};
/** flap tip height above the sleeve */
const flapTip = (pop: number) => FLAP_H * Math.sin(FLAP_MAX * clamp(pop, 0, 1.3));

export const radius = (u: number, phi: number, st: CrawlState, L: ReturnType<typeof layout>): {r: number; sec: Sec} => {
  if (u < L.u1) {
    const v = u / L.u1;
    return {r: TETHER_R + (1 - TETHER_R) * Math.sqrt(Math.max(0, 1 - (1 - v) ** 2)) ** 0.8, sec: 'tailCap'};
  }
  if (u < L.u2) return {r: anchorR((u - L.u1) / LEN.anchor, st.aT), sec: 'tailAnchor'};
  if (u < L.u3) return {r: 1.0 + 0.05 * Math.sin((Math.PI * (u - L.u2)) / LEN.collar), sec: 'collarT'};
  if (u < L.u4) {
    const v = (u - L.u3) / (L.u4 - L.u3);
    const lobe = 0.04 * Math.cos(4 * phi) * Math.sin(Math.PI * v) ** 0.3;
    return {r: 0.97 + lobe + 0.02 * st.gE, sec: 'ext'};
  }
  if (u < L.u5) return {r: 1.0 + 0.05 * Math.sin((Math.PI * (u - L.u4)) / LEN.collar), sec: 'collarH'};
  if (u < L.u6) return {r: anchorR((u - L.u5) / LEN.anchor, st.aH), sec: 'headAnchor'};
  const v = clamp((u - L.u6) / LEN.headCap);
  return {r: TIP_R + (1 - TIP_R) * Math.sqrt(Math.max(0, 1 - v ** 2.2)), sec: 'headCap'};
};

/** outer radius of the anchors (balloon plus flap tips) at axial position u, or 0 outside them; for the wall contact */
export const anchorOuter = (u: number, st: CrawlState, e: number) => {
  const L = layout(e);
  if (u >= L.u1 && u <= L.u2) return anchorR((u - L.u1) / LEN.anchor, st.aT) + flapTip(st.popT) * 0.55;
  if (u >= L.u5 && u <= L.u6) return anchorR((u - L.u5) / LEN.anchor, st.aH) + flapTip(st.popH) * 0.55;
  return 0;
};

const ringSamples = (L: ReturnType<typeof layout>) => {
  const us: number[] = [];
  const seg = (a: number, b: number, n: number, warp?: (x: number) => number) => {
    for (let i = 0; i < n; i++) us.push(a + (b - a) * (warp ? warp(i / n) : i / n));
  };
  seg(0, L.u1, 12, (x) => 1 - (1 - x) ** 1.6);
  seg(L.u1, L.u2, 30);
  seg(L.u2, L.u3, 3);
  seg(L.u3, L.u4, Math.max(10, Math.round((L.u4 - L.u3) * 3.4)));
  seg(L.u4, L.u5, 3);
  seg(L.u5, L.u6, 30);
  seg(L.u6, L.u7, 18, (x) => x ** 0.8);
  us.push(L.u7);
  return us;
};

export type RobotOpts = {
  /** world-space vector toward which the extender is bending (its outer chambers glow more) */
  bendGlow?: number;
  /** ink width multiplier (macro shots) */
  inkScale?: number;
  /** draw the tether this far back along the centreline */
  tetherLen?: number;
  /** tether centreline override (the lab) */
  tetherFrame?: FrameF;
  tetherDroop?: number;
  /** skip the tip face (a tool is drawn there instead) */
  tipOpen?: number;
};

const secCols = (sec: Sec) => (sec === 'tailAnchor' || sec === 'headAnchor' ? C.sleeve : sec === 'ext' ? C.body : C.cap);

/** all robot items for one frame. sTail: the tail end's arc length on `frame` */
export const robotItems = (B: Basis, Lt: Light, frame: FrameF, st: CrawlState, o: RobotOpts = {}): Item[] => {
  const items: Item[] = [];
  const L = layout(st.e);
  const us = ringSamples(L);
  const nU = us.length;
  const pxPer = (p: V3) => proj(B, p).s;
  /** depth for an item lying ON the surface at axial u: the nearest point of that ring, so it draws over its band */
  const zOn = (u: number, bias = 0.03) => depthOf(B, frame(st.sTail + u).p) - radius(u, 0, st, L).r - bias;
  const ink = (p: V3) => clamp(INK_PX * (o.inkScale ?? 1) * clamp(pxPer(p) / 140, 0.75, 1.6), 1.6, 5.5);
  // ---- vertices and normals
  const F: Fr[] = us.map((u) => frame(st.sTail + u));
  const P: V3[][] = [], Nn: V3[][] = [], R: number[][] = [], S: Sec[] = [];
  for (let i = 0; i < nU; i++) {
    const u = us[i];
    const f = F[i];
    const row: V3[] = [], nrow: V3[] = [], rrow: number[] = [];
    const du = 0.01;
    for (let j = 0; j < NPHI; j++) {
      const phi = (j / NPHI) * Math.PI * 2;
      const {r, sec} = radius(u, phi, st, L);
      if (j === 0) S.push(sec);
      const rho = add3(mul3(f.N, Math.cos(phi)), mul3(f.B, Math.sin(phi)));
      row.push(add3(f.p, mul3(rho, r)));
      const dr = (radius(Math.min(L.u7, u + du), phi, st, L).r - radius(Math.max(0, u - du), phi, st, L).r) / (2 * du);
      nrow.push(norm3(sub3(rho, mul3(f.T, clamp(dr, -6, 6)))));
      rrow.push(r);
    }
    P.push(row); Nn.push(nrow); R.push(rrow);
  }
  // ---- self-occlusion: the robot is a solid of revolution, so a point is hidden exactly when a nearer cross-section
  // disc covers it on screen (affine disc projection; exact enough for ink visibility)
  const DISC = F.map((f, i) => {
    const r = Math.max(...R[i]);
    const pc = proj(B, f.p);
    const pu = proj(B, add3(f.p, mul3(f.N, r))), pv = proj(B, add3(f.p, mul3(f.B, r)));
    const ux = pu.x - pc.x, uy = pu.y - pc.y, vx = pv.x - pc.x, vy = pv.y - pc.y;
    const det = ux * vy - uy * vx;
    return {z: depthOf(B, f.p), pc, ux, uy, vx, vy, det};
  });
  const occluded = (q: V3, margin = 0.955) => {
    const zq = depthOf(B, q);
    const pq = proj(B, q);
    for (const d of DISC) {
      if (d.z >= zq - 0.02 || Math.abs(d.det) < 1e-6) continue;
      const dx = pq.x - d.pc.x, dy = pq.y - d.pc.y;
      const a = (dx * d.vy - dy * d.vx) / d.det, b = (d.ux * dy - d.uy * dx) / d.det;
      if (a * a + b * b < margin) return true;
    }
    return false;
  };
  const ringZ = (i: number) => DISC[Math.max(0, Math.min(nU - 1, i))].z;
  /** ink is drawn above every surface item; visibility comes from occluded() */
  const INKZ = -1e5;

  // ---- surface: one band per ring interval over its front-facing arc, shaded smoothly by a gradient across it
  // (quads only where a band cannot be formed: an end dome seen nearly end-on)
  const FV = P.map((row, i) => row.map((p, j) => dot3(Nn[i][j], sub3(B.eye, p))));
  // signed curvature of the centreline toward +N at each ring
  const KN = us.map((u) => {
    const a = frame(st.sTail + u - 0.15).T, b = frame(st.sTail + u + 0.15).T;
    return dot3(sub3(b, a), frame(st.sTail + u).N) / 0.3;
  });
  const lerpP = (i: number, j: number) => {
    const j1 = (j + 1) % NPHI;
    const f0 = FV[i][j], f1 = FV[i][j1];
    return add3(P[i][j], mul3(sub3(P[i][j1], P[i][j]), f0 / (f0 - f1)));
  };
  type Arc = {js: number[]; start: V3; end: V3; jS: number; jE: number} | 'all' | null;
  const arcOf = (i: number): Arc => {
    const f = FV[i];
    let jS = -1;
    for (let j = 0; j < NPHI; j++) if (f[j] <= 0 && f[(j + 1) % NPHI] > 0) { jS = j; break; }
    if (jS < 0) return f[0] > 0 ? 'all' : null;
    const js: number[] = [];
    let j = (jS + 1) % NPHI;
    while (f[j] > 0 && js.length < NPHI) { js.push(j); j = (j + 1) % NPHI; }
    const jE = (j - 1 + NPHI) % NPHI;
    return {js, start: lerpP(i, jS), end: lerpP(i, jE), jS, jE};
  };
  const ARCS = us.map((_, i) => arcOf(i));
  const colorAt = (sec: Sec, i: number, j: number) => {
    const pm = mul3(add3(P[i][j], P[i + 1][j]), 0.5);
    const nm = norm3(add3(Nn[i][j], Nn[i + 1][j]));
    const phi = (j / NPHI) * Math.PI * 2;
    let tint: [string, number] | undefined;
    if (sec === 'ext') {
      const lobe = Math.max(0, Math.cos(4 * phi)) ** 2;
      // steering: the chambers on the outside of a bend are inflated harder (they glow more)
      const bend = clamp(1 - KN[i] * 4.5 * Math.cos(phi) + (o.bendGlow ?? 0) * Math.cos(phi), 0.3, 2.2);
      tint = [C.glow, clamp(st.gE * (0.08 + 0.3 * lobe) * bend, 0, 0.6)];
    }
    if (sec === 'tailAnchor' || sec === 'headAnchor') tint = [C.glow, 0.1 * (sec === 'tailAnchor' ? st.aT : st.aH)];
    const spec = sec === 'ext' ? 0.55 : sec === 'tailAnchor' || sec === 'headAnchor' ? 0.35 : 0.8;
    return {pm, c: shadeAt(B, Lt, secCols(sec), pm, nm, {spec, specPow: sec === 'ext' ? 22 : 36, rim: 0.35, tint, amb: 0.2})};
  };
  for (let i = 0; i < nU - 1; i++) {
    const sec = (us[i] < L.u1 ? 'tailCap' : S[i]) as Sec;
    const A0 = ARCS[i], A1 = ARCS[i + 1];
    if (A0 && A1 && A0 !== 'all' && A1 !== 'all' && A0.js.length >= 1 && A1.js.length >= 1) {
      const poly: V2[] = [proj(B, A0.start), ...A0.js.map((j) => proj(B, P[i][j])), proj(B, A0.end), proj(B, A1.end), ...[...A1.js].reverse().map((j) => proj(B, P[i + 1][j])), proj(B, A1.start)];
      const ga = proj(B, mul3(add3(A0.start, A1.start), 0.5)), gb = proj(B, mul3(add3(A0.end, A1.end), 0.5));
      const samples = A0.js.map((j) => {
        const {pm, c} = colorAt(sec, i, j);
        return {p: proj(B, pm), c};
      });
      // the grazing colour right at the silhouette
      const edgeS = colorAt(sec, i, A0.jS).c, edgeE = colorAt(sec, i, A0.jE).c;
      samples.unshift({p: ga, c: edgeS}); samples.push({p: gb, c: edgeE});
      items.push({z: (ringZ(i) + ringZ(i + 1)) / 2, d: `M${poly.map(P2).join('L')}Z`, grad: gradFrom(ga, gb, samples), sw: 1.0});
      continue;
    }
    for (let j = 0; j < NPHI; j++) {
      const j1 = (j + 1) % NPHI;
      const a = P[i][j], b = P[i][j1], c = P[i + 1][j1], d = P[i + 1][j];
      const ctr = mul3(add3(add3(a, b), add3(c, d)), 0.25);
      const n = norm3(add3(add3(Nn[i][j], Nn[i][j1]), add3(Nn[i + 1][j1], Nn[i + 1][j])));
      if (dot3(n, norm3(sub3(B.eye, ctr))) < -0.05) continue;
      const fill = colorAt(sec, i, j).c;
      const pts = [a, b, c, d].map((q) => proj(B, q));
      items.push({z: (ringZ(i) + ringZ(i + 1)) / 2 - 0.001 * dot3(n, norm3(sub3(B.eye, ctr))), d: `M${pts.map(P2).join('L')}Z`, fill, stroke: fill, sw: 0.9});
    }
  }
  // ---- kirigami flaps on both anchors
  const flaps = (u0: number, pop: number, a: number) => {
    const tip = flapTip(pop);
    const alpha = FLAP_MAX * clamp(pop, 0, 1.3);
    for (let rI = 0; rI < ROWS; rI++) {
      const v = 0.15 + (0.7 * (rI + 0.5)) / ROWS;
      const uc = u0 + v * LEN.anchor;
      const ub = uc + FLAP_H / 2, ua = uc - FLAP_H / 2;
      for (let k = 0; k < COLS; k++) {
        const phiC = ((k + (rI % 2) * 0.5) / COLS) * Math.PI * 2;
        const dphi = ((Math.PI * 2) / COLS) * 0.36;
        const at = (u: number, phi: number) => {
          const f = frame(st.sTail + u);
          const rho = add3(mul3(f.N, Math.cos(phi)), mul3(f.B, Math.sin(phi)));
          return {p: add3(f.p, mul3(rho, radius(u, phi, st, L).r)), rho, f};
        };
        const bm = at(ub, phiC);
        const b1 = at(ub, phiC - dphi).p, b2 = at(ub, phiC + dphi).p;
        const fa = at(ua, phiC).p;
        const tu = norm3(sub3(at(ub + 0.02, phiC).p, at(ub - 0.02, phiC).p));
        const nb = norm3(sub3(bm.rho, mul3(tu, dot3(bm.rho, tu))));
        const vis = dot3(nb, norm3(sub3(B.eye, bm.p)));
        if (vis < -0.3) continue;
        const pB = [b1, b2, fa].map((q) => proj(B, q));
        const sc = proj(B, bm.p).s;
        const zc = depthOf(B, frame(st.sTail + uc).p);
        if (pop < 0.03) {
          if (vis < 0.05) continue;
          // flat: just the cut line, slightly open as the sleeve stretches
          items.push({z: zc - 0.2, d: `M${P2(pB[0])}L${P2(pB[2])}L${P2(pB[1])}`, stroke: mix(C.sleeve[0], C.sleeve[1], 0.3 + 0.4 * (1 - a)), sw: clamp(sc * 0.016, 0.5, 3.2), op: 0.85, round: true});
          continue;
        }
        const apex = add3(bm.p, mul3(add3(mul3(tu, -Math.cos(alpha)), mul3(nb, Math.sin(alpha))), FLAP_H));
        // the opening left in the sleeve
        if (vis > 0) items.push({z: zc - 0.2, d: `M${pB.map(P2).join('L')}Z`, fill: C.hole, op: clamp(pop * 1.4) * 0.92});
        // the flap: outer face (sleeve) or underside
        const fn = norm3(cross3(sub3(b2, b1), sub3(apex, b1)));
        const fnO = dot3(fn, nb) < 0 ? mul3(fn, -1) : fn;
        const ctr = mul3(add3(add3(b1, b2), apex), 1 / 3);
        const outer = dot3(fnO, sub3(B.eye, ctr)) > 0;
        const fill = outer ? shadeAt(B, Lt, C.sleeve, ctr, fnO, {spec: 0.5, specPow: 18, amb: 0.3, tint: ['#B9FFF6', 0.12]}) : shadeAt(B, Lt, [C.flapUnder, '#11474F', '#1D6266', '#2F8282', '#55A9A3'], ctr, mul3(fnO, -1), {amb: 0.25});
        const pf = [b1, b2, apex].map((q) => proj(B, q));
        // unhidden flaps draw above the balloon's outline ink (they stand in front of it); hidden ones stay depth-sorted
        const zF = occluded(ctr, 0.9) ? zc - 0.3 - 0.001 * rI : INKZ - 10 - depthOf(B, ctr) * 1e-3;
        items.push({z: zF, d: `M${pf.map(P2).join('L')}Z`, fill, stroke: mix(fill, INK, 0.35), sw: clamp(sc * 0.034, 0.6, 16), round: true});
        items.push({z: zF - 0.0005, d: `M${pf.map(P2).join('L')}Z`, fill, stroke: mix(fill, INK, 0.6), sw: clamp(sc * 0.006, 0.4, 2.2), round: true, op: 0.9});
      }
    }
  };
  flaps(L.u1, st.popT, st.aT);
  flaps(L.u5, st.popH, st.aH);
  // ---- ink: silhouette chains (interpolated per ring), depth-sorted so a nearer balloon hides them
  // all sign changes on each ring; the two chains are the outermost crossings either side of the projected axis
  const crossA: (V3 | null)[] = [], crossB: (V3 | null)[] = [];
  for (let i = 0; i < nU; i++) {
    const fv = FV[i];
    const c2 = proj(B, F[i].p), t2 = proj(B, add3(F[i].p, F[i].T));
    let ax = t2.x - c2.x, ay = t2.y - c2.y;
    const al = Math.hypot(ax, ay) || 1;
    ax /= al; ay /= al;
    let A: V3 | null = null, Bc: V3 | null = null, sA = 0, sB = 0;
    for (let j = 0; j < NPHI; j++) {
      const j1 = (j + 1) % NPHI;
      const f0 = fv[j], f1 = fv[j1];
      if ((f0 > 0) === (f1 > 0)) continue;
      const q = add3(P[i][j], mul3(sub3(P[i][j1], P[i][j]), f0 / (f0 - f1)));
      const q2 = proj(B, q);
      const side = ax * (q2.y - c2.y) - ay * (q2.x - c2.x);
      if (side > sA) { sA = side; A = q; }
      if (side < sB) { sB = side; Bc = q; }
    }
    crossA.push(A); crossB.push(Bc);
  }
  const chain = (cs: (V3 | null)[]) => {
    for (let i = 0; i < cs.length - 1; i++) {
      const a = cs[i], b = cs[i + 1];
      if (!a || !b) continue;
      const m = mul3(add3(a, b), 0.5);
      if (occluded(m)) continue;
      items.push({z: INKZ, d: `M${P2(proj(B, a))}L${P2(proj(B, b))}`, stroke: INK, sw: ink(m), round: true});
    }
  };
  chain(crossA);
  chain(crossB);
  // seams between modules: the front arcs of the boundary rings
  const seamAt = (u: number, w = 0.6, col = INK) => {
    const f = frame(st.sTail + u);
    const pts: V3[] = [], vis: boolean[] = [];
    for (let j = 0; j <= NPHI; j++) {
      const phi = (j / NPHI) * Math.PI * 2;
      const rho = add3(mul3(f.N, Math.cos(phi)), mul3(f.B, Math.sin(phi)));
      const p = add3(f.p, mul3(rho, radius(u, phi, st, L).r + 0.004));
      pts.push(p);
      vis.push(dot3(rho, sub3(B.eye, p)) > 0);
    }
    for (let j = 0; j < NPHI; j++) {
      if (!vis[j] || !vis[j + 1]) continue;
      const m = mul3(add3(pts[j], pts[j + 1]), 0.5);
      if (occluded(m)) continue;
      items.push({z: INKZ + 1, d: `M${P2(proj(B, pts[j]))}L${P2(proj(B, pts[j + 1]))}`, stroke: col, sw: ink(m) * w, round: true});
    }
  };
  for (const u of [L.u1 + 0.005, L.u2 - 0.005, L.u3, L.u4, L.u5 + 0.005, L.u6 - 0.005]) seamAt(u, 0.55);
  seamAt(L.u1 * 0.55, 0.35, mix(C.cap[1], INK, 0.3));
  // extender fibre ribs: spread as it extends
  const NR = 9;
  for (let k = 1; k <= NR; k++) seamAt(L.u3 + ((L.u4 - L.u3) * k) / (NR + 1), 0.32, mix(C.body[1], INK, 0.25));
  // ---- the head tip: the central channel (imaging and tools) in a flat face
  const fT = frame(st.sTail + L.u7);
  const tipC = fT.p;
  if (facing(B, tipC, fT.T)) {
    const ringPts = (r: number, off: V3 = [0, 0, 0]) => {
      const out: V2[] = [];
      for (let j = 0; j < NPHI; j++) {
        const phi = (j / NPHI) * Math.PI * 2;
        out.push(proj(B, add3(add3(tipC, off), add3(mul3(fT.N, r * Math.cos(phi)), mul3(fT.B, r * Math.sin(phi))))));
      }
      return out;
    };
    const z0 = ringZ(nU - 1) - 0.4;
    const face = shadeAt(B, Lt, C.cap, tipC, fT.T, {spec: 0.6, amb: 0.3});
    items.push({z: z0, d: `M${ringPts(TIP_R).map(P2).join('L')}Z`, fill: face, stroke: INK, sw: ink(tipC) * 0.8});
    const open = o.tipOpen ?? 0;
    items.push({z: z0 - 0.001, d: `M${ringPts(CH_R).map(P2).join('L')}Z`, fill: '#0A1418', stroke: mix(face, INK, 0.5), sw: ink(tipC) * 0.5});
    // the imaging lens, set in the channel wall, and its glint
    const lensOff = add3(mul3(fT.N, -0.13), mul3(fT.B, 0.1));
    items.push({z: z0 - 0.002, d: `M${ringPts(0.105, lensOff).map(P2).join('L')}Z`, fill: '#1B3550', stroke: '#2E5878', sw: 1});
    const gl = add3(lensOff, add3(mul3(fT.N, -0.03), mul3(fT.B, 0.04)));
    items.push({z: z0 - 0.003, d: `M${ringPts(0.035, gl).map(P2).join('L')}Z`, fill: '#CFF4FF', op: 0.85 * (1 - open * 0)});
  } else {
    // close the outline round the back of the tip ring
    const i = nU - 1;
    const a = crossA[i], b = crossB[i];
    if (a && b) {
      const ref = proj(B, frame(st.sTail + L.u6).p);
      const arc = (dir: number) => {
        const pts: V3[] = [];
        const ang = (p: V3) => Math.atan2(dot3(sub3(p, fT.p), fT.B), dot3(sub3(p, fT.p), fT.N));
        let a0 = ang(a), a1 = ang(b);
        if (dir > 0 && a1 < a0) a1 += Math.PI * 2;
        if (dir < 0 && a1 > a0) a1 -= Math.PI * 2;
        for (let k = 0; k <= 16; k++) {
          const phi = a0 + ((a1 - a0) * k) / 16;
          pts.push(add3(fT.p, add3(mul3(fT.N, TIP_R * Math.cos(phi)), mul3(fT.B, TIP_R * Math.sin(phi)))));
        }
        return pts;
      };
      const A1 = arc(1), A2 = arc(-1);
      const far = (pts: V3[]) => {
        const q = proj(B, pts[8]);
        return Math.hypot(q.x - ref.x, q.y - ref.y);
      };
      const best = far(A1) > far(A2) ? A1 : A2;
      for (let k = 0; k < best.length - 1; k++) {
        const m = mul3(add3(best[k], best[k + 1]), 0.5);
        if (occluded(m)) continue;
        items.push({z: INKZ, d: `M${P2(proj(B, best[k]))}L${P2(proj(B, best[k + 1]))}`, stroke: INK, sw: ink(m), round: true});
      }
    }
  }
  // ---- the tether: from the tail cap back along the centreline (it carries the air lines and the tool channel)
  const tl = o.tetherLen ?? 40;
  if (tl > 0) {
    const tf = o.tetherFrame ?? frame;
    const s0 = o.tetherFrame ? 0 : st.sTail;
    const droop = o.tetherDroop ?? 0.55;
    const NT = 14;
    const rings: {p: V3[]; n: V3[]; c: V3}[] = [];
    let s = 0;
    while (s <= tl) {
      const f = tf(s0 - s);
      const dz = -droop * ss(s, 0.4, 4.5);
      const c = add3(f.p, mul3(f.B, dz));
      const p: V3[] = [], n: V3[] = [];
      for (let j = 0; j < NT; j++) {
        const phi = (j / NT) * Math.PI * 2;
        const rho = add3(mul3(f.N, Math.cos(phi)), mul3(f.B, Math.sin(phi)));
        p.push(add3(c, mul3(rho, TETHER_R)));
        n.push(rho);
      }
      rings.push({p, n, c});
      s += 0.22 + 0.05 * s;
    }
    for (let i = 0; i < rings.length - 1; i++) {
      const A = rings[i], Bq = rings[i + 1];
      let ca: V3 | null = null, cb: V3 | null = null, da: V3 | null = null, db: V3 | null = null;
      for (let j = 0; j < NT; j++) {
        const j1 = (j + 1) % NT;
        const ctr = mul3(add3(add3(A.p[j], A.p[j1]), add3(Bq.p[j1], Bq.p[j])), 0.25);
        const n = norm3(add3(A.n[j], A.n[j1]));
        if (dot3(n, sub3(B.eye, ctr)) < 0) continue;
        const fill = shadeAt(B, Lt, C.tether, ctr, n, {spec: 0.55, amb: 0.2, rim: 0.25});
        const pts = [A.p[j], A.p[j1], Bq.p[j1], Bq.p[j]].map((q) => proj(B, q));
        items.push({z: depthOf(B, ctr) + 0.02, d: `M${pts.map(P2).join('L')}Z`, fill, stroke: fill, sw: 0.9});
      }
      // silhouette
      const sil = (R: typeof A) => {
        const fv = R.p.map((p, j) => dot3(R.n[j], sub3(B.eye, p)));
        let a: V3 | null = null, b: V3 | null = null;
        for (let j = 0; j < NT; j++) {
          const j1 = (j + 1) % NT;
          if (fv[j] > 0 && fv[j1] <= 0 && !a) a = add3(R.p[j], mul3(sub3(R.p[j1], R.p[j]), fv[j] / (fv[j] - fv[j1])));
          if (fv[j] < 0 && fv[j1] >= 0 && !b) b = add3(R.p[j], mul3(sub3(R.p[j1], R.p[j]), fv[j] / (fv[j] - fv[j1])));
        }
        return [a, b];
      };
      [ca, cb] = sil(A);
      [da, db] = sil(Bq);
      for (const [p, q] of [[ca, da], [cb, db]] as [V3 | null, V3 | null][]) {
        if (!p || !q) continue;
        const m = mul3(add3(p, q), 0.5);
        if (occluded(m)) continue;
        items.push({z: depthOf(B, m) - 0.04, d: `M${P2(proj(B, p))}L${P2(proj(B, q))}`, stroke: INK, sw: ink(m) * 0.8, round: true});
      }
    }
  }
  return items;
};

/** the projected centre of the robot at axial position u (for camera targets and caption keep-outs) */
export const robotPoint = (frame: FrameF, st: CrawlState, which: 'tail' | 'tailAnchor' | 'mid' | 'headAnchor' | 'tip'): V3 => {
  const L = layout(st.e);
  const u = which === 'tail' ? 0 : which === 'tailAnchor' ? (L.u1 + L.u2) / 2 : which === 'mid' ? (L.u3 + L.u4) / 2 : which === 'headAnchor' ? (L.u5 + L.u6) / 2 : L.u7;
  return frame(st.sTail + u).p;
};
export const _unused = len3;
