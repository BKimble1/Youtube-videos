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
import {mix, rgba} from '../core/color';
import {clamp, ss} from '../lib';
import {CrawlState, extLen, LEN, R_ANCHOR_MAX} from './state';

export type Fr = {p: V3; T: V3; N: V3; B: V3};
export type FrameF = (s: number) => Fr;

type Sec = 'tailCap' | 'tailAnchor' | 'collarT' | 'ext' | 'collarH' | 'headAnchor' | 'headCap';
export const layout = (e: number) => {
  const u1 = LEN.tailCap, u2 = u1 + LEN.anchor, u3 = u2 + LEN.collar, u4 = u3 + extLen(e), u5 = u4 + LEN.collar, u6 = u5 + LEN.anchor, u7 = u6 + LEN.headCap;
  return {u1, u2, u3, u4, u5, u6, u7};
};
const TIP_R = 0.62, CH_R = 0.3, TETHER_R = 0.34;
// V3: scale-like tabs of a FIXED size cut in the sleeve material (they no longer grow with the balloon), blunt-tipped,
// lifting at most 38 degrees, progressively as the sleeve stretches
const FLAP_H = 0.12, FLAP_MAX = (38 * Math.PI) / 180, ROWS = 8, COLS = 16, FLAP_HW = 0.085, FLAP_TIP = 0.028;
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
  // V3: the wall rests ON the tab tips (they meet the mucosa, they do not enter it)
  if (u >= L.u1 && u <= L.u2) return anchorR((u - L.u1) / LEN.anchor, st.aT) + flapTip(st.popT) + 0.012;
  if (u >= L.u5 && u <= L.u6) return anchorR((u - L.u5) / LEN.anchor, st.aH) + flapTip(st.popH) + 0.012;
  return 0;
};

const ringSamples = (L: ReturnType<typeof layout>) => {
  const us: number[] = [];
  const seg = (a: number, b: number, n: number, warp?: (x: number) => number) => {
    for (let i = 0; i < n; i++) us.push(a + (b - a) * (warp ? warp(i / n) : i / n));
  };
  seg(0, L.u1, 9, (x) => 1 - (1 - x) ** 1.6);
  seg(L.u1, L.u2, 30);
  seg(L.u2, L.u3, 3);
  // V4: a FIXED ring count on the extender (V3 varied it with length, which re-cut the shading bands as it extended):
  // the same material rings now simply spread apart as it lengthens
  seg(L.u3, L.u4, 30);
  seg(L.u4, L.u5, 3);
  seg(L.u5, L.u6, 30);
  seg(L.u6, L.u7, 12, (x) => x ** 0.8);
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
  /** 0..1: open a cutaway window in the extender's near side showing two of its four air chambers and the channel */
  cutaway?: number;
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
  /** V4: a segment a-b clipped to where vis() holds, the boundary found by bisection (so ink ends move continuously
   *  instead of whole segments switching on and off) */
  const clipSeg = (a: V3, b: V3, vis: (q: V3) => boolean): [V3, V3] | null => {
    const va = vis(a), vb = vis(b);
    if (va && vb) return [a, b];
    if (!va && !vb) return null;
    let lo = 0, hi = 1;
    for (let it = 0; it < 10; it++) {
      const m = (lo + hi) / 2;
      if (vis(add3(a, mul3(sub3(b, a), m))) === va) lo = m; else hi = m;
    }
    const c = add3(a, mul3(sub3(b, a), (lo + hi) / 2));
    return va ? [a, c] : [c, b];
  };
  const notOcc = (q: V3) => !occluded(q);
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
  type Arc = {js: number[]; start: V3; end: V3; jS: number; jE: number; full?: boolean} | 'all' | null;
  const arcOf = (i: number): Arc => {
    const f = FV[i];
    let jS = -1;
    for (let j = 0; j < NPHI; j++) if (f[j] <= 0 && f[(j + 1) % NPHI] > 0) { jS = j; break; }
    if (jS < 0) {
      if (f[0] <= 0) return null;
      // V4: a ring facing the camera all the way round (a collar seen at a steep angle) is a CLOSED band starting at its
      // least-facing vertex. V3 fell back to separately stroked quads here, which flickered as a hatched patch.
      let jm = 0;
      for (let j = 1; j < NPHI; j++) if (f[j] < f[jm]) jm = j;
      const js: number[] = [];
      for (let k = 1; k < NPHI; k++) js.push((jm + k) % NPHI);
      return {js, start: P[i][jm], end: P[i][jm], jS: jm, jE: jm, full: true};
    }
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
  /** V4: emit one band between two ring polylines as BAND_SEG short segments, each shaded by a two-stop gradient
   *  between its own end colours. Both polylines are resampled at the same fractions of their length, so the segment
   *  boundaries move continuously with the geometry. (V3 shaded a whole curved arc with ONE straight linear gradient;
   *  where the arc curves back on itself on screen, as on a collar seen from above, the sorted stops scrambled into
   *  a flickering sawtooth.) */
  const BAND_SEG = 12;
  const resample = (pts: V3[], cols: string[] | null, m: number) => {
    const cum = [0];
    for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + len3(sub3(pts[k], pts[k - 1])));
    const tot = cum[cum.length - 1] || 1;
    const P_: V3[] = [], C_: string[] = [];
    let k = 1;
    for (let q = 0; q <= m; q++) {
      const d = (tot * q) / m;
      while (k < pts.length - 1 && cum[k] < d) k++;
      const u = clamp((d - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1));
      P_.push(add3(pts[k - 1], mul3(sub3(pts[k], pts[k - 1]), u)));
      if (cols) C_.push(mix(cols[k - 1], cols[k], u));
    }
    return {P_, C_};
  };
  const emitBand = (ptsA: V3[], colsA: string[], ptsB: V3[], z: number) => {
    if (ptsA.length < 2 || ptsB.length < 2) return;
    const a = resample(ptsA, colsA, BAND_SEG), b = resample(ptsB, null, BAND_SEG);
    const pa = a.P_.map((q) => proj(B, q)), pb = b.P_.map((q) => proj(B, q));
    for (let q = 0; q < BAND_SEG; q++) {
      const g0 = {x: (pa[q].x + pb[q].x) / 2, y: (pa[q].y + pb[q].y) / 2}, g1 = {x: (pa[q + 1].x + pb[q + 1].x) / 2, y: (pa[q + 1].y + pb[q + 1].y) / 2};
      items.push({z: z - q * 1e-7, d: `M${P2(pa[q])}L${P2(pa[q + 1])}L${P2(pb[q + 1])}L${P2(pb[q])}Z`,
        grad: {x1: g0.x, y1: g0.y, x2: g1.x, y2: g1.y, stops: [[0, a.C_[q]], [1, a.C_[q + 1]]]}, sw: 1.0});
    }
  };
  for (let i = 0; i < nU - 1; i++) {
    const sec = (us[i] < L.u1 ? 'tailCap' : S[i]) as Sec;
    const A0 = ARCS[i], A1 = ARCS[i + 1];
    // V4: when exactly one ring of the pair faces the camera (a collar curving into an anchor), shade the strip as ONE band
    // on the facing ring's vertex indices (on both rings), never as separately stroked quads (V3's hatched collar patch)
    const one = (A0 && A0 !== 'all' && !A0.full && A0.js.length >= 2 && !(A1 && A1 !== 'all' && A1.js.length >= 1)) ? A0
      : (A1 && A1 !== 'all' && !A1.full && A1.js.length >= 2 && !(A0 && A0 !== 'all' && A0.js.length >= 1)) ? A1 : null;
    if (one) {
      const js = one.js;
      emitBand(js.map((j) => P[i][j]), js.map((j) => colorAt(sec, i, j).c), js.map((j) => P[i + 1][j]), (ringZ(i) + ringZ(i + 1)) / 2);
      continue;
    }
    if (A0 && A1 && A0 !== 'all' && A1 !== 'all' && (A0.full || A1.full)) {
      // V4: a ring pair where either ring faces the camera all the way round: two half-bands that use the SAME vertex
      // indices on both rings (split at ring i's two screen-extreme vertices), so the polygon can never self-intersect.
      // Each half is shaded by a gradient across it; the farther half is drawn first.
      const c2 = proj(B, F[i].p), t2 = proj(B, add3(F[i].p, F[i].T));
      const ax = t2.x - c2.x, ay = t2.y - c2.y, al = Math.hypot(ax, ay) || 1;
      let jLo = 0, jHi = 0, lo = 1e9, hi = -1e9;
      for (let j = 0; j < NPHI; j++) {
        const q = proj(B, P[i][j]);
        const sd = (ax * (q.y - c2.y) - ay * (q.x - c2.x)) / al;
        if (sd < lo) { lo = sd; jLo = j; }
        if (sd > hi) { hi = sd; jHi = j; }
      }
      const half = (from: number, to: number) => {
        const js: number[] = [];
        for (let j = from; ; j = (j + 1) % NPHI) { js.push(j); if (j === to || js.length > NPHI) break; }
        return js;
      };
      for (const js of [half(jLo, jHi), half(jHi, jLo)]) {
        if (js.length < 2) continue;
        const zH = js.reduce((m, j) => m + depthOf(B, mul3(add3(P[i][j], P[i + 1][j]), 0.5)), 0) / js.length;
        emitBand(js.map((j) => P[i][j]), js.map((j) => colorAt(sec, i, j).c), js.map((j) => P[i + 1][j]), zH);
      }
      continue;
    }
    if (A0 && A1 && A0 !== 'all' && A1 !== 'all' && A0.js.length >= 1 && A1.js.length >= 1) {
      const cols = [colorAt(sec, i, A0.jS).c, ...A0.js.map((j) => colorAt(sec, i, j).c), colorAt(sec, i, A0.jE).c];
      emitBand([A0.start, ...A0.js.map((j) => P[i][j]), A0.end], cols, [A1.start, ...A1.js.map((j) => P[i + 1][j]), A1.end], (ringZ(i) + ringZ(i + 1)) / 2);
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
        const dphi = FLAP_HW / radius(ub, phiC, st, L).r;
        const dtip = FLAP_TIP / radius(ua, phiC, st, L).r;
        const at = (u: number, phi: number) => {
          const f = frame(st.sTail + u);
          const rho = add3(mul3(f.N, Math.cos(phi)), mul3(f.B, Math.sin(phi)));
          return {p: add3(f.p, mul3(rho, radius(u, phi, st, L).r)), rho, f};
        };
        const bm = at(ub, phiC);
        const b1 = at(ub, phiC - dphi).p, b2 = at(ub, phiC + dphi).p;
        const fa1 = at(ua, phiC - dtip).p, fa2 = at(ua, phiC + dtip).p;
        const tu = norm3(sub3(at(ub + 0.02, phiC).p, at(ub - 0.02, phiC).p));
        const nb = norm3(sub3(bm.rho, mul3(tu, dot3(bm.rho, tu))));
        const vis = dot3(nb, norm3(sub3(B.eye, bm.p)));
        // V4: no hard culls or representation switches. The flat cut line and the lifted tab cross-fade by lift amount,
        // and everything fades with the facing angle, so a tab never pops in, out or into a different drawing.
        const kLift = ss(pop, 0.0, 0.14);
        const vFlat = ss(vis, -0.02, 0.14), vTab = ss(vis, -0.4, -0.2);
        if (vTab < 0.004 && vFlat < 0.004) continue;
        const pB = [b1, b2, fa2, fa1].map((q) => proj(B, q));
        const sc = proj(B, bm.p).s;
        const zc = depthOf(B, frame(st.sTail + uc).p);
        if ((1 - kLift) * vFlat > 0.004) {
          // flat: just the cut line, slightly open as the sleeve stretches
          items.push({z: zc - 0.2, d: `M${P2(pB[0])}L${P2(pB[3])}L${P2(pB[2])}L${P2(pB[1])}`, stroke: mix(C.sleeve[0], C.sleeve[1], 0.3 + 0.4 * (1 - a)), sw: clamp(sc * 0.016, 0.5, 3.2), op: 0.85 * (1 - kLift) * vFlat, round: true});
        }
        if (kLift < 0.004) continue;
        const lift = add3(mul3(tu, -Math.cos(alpha)), mul3(nb, Math.sin(alpha)));
        const cdir = norm3(sub3(b2, b1));
        const apex = add3(bm.p, mul3(lift, FLAP_H));
        const a1 = add3(apex, mul3(cdir, -FLAP_TIP)), a2 = add3(apex, mul3(cdir, FLAP_TIP));
        // the opening left in the sleeve
        if (vFlat > 0.004) items.push({z: zc - 0.2, d: `M${pB.map(P2).join('L')}Z`, fill: C.hole, op: clamp(pop * 1.4) * 0.92 * vFlat});
        // the flap: outer face (sleeve) or underside
        const fn = norm3(cross3(sub3(b2, b1), sub3(apex, b1)));
        const fnO = dot3(fn, nb) < 0 ? mul3(fn, -1) : fn;
        const ctr = mul3(add3(add3(b1, b2), apex), 1 / 3);
        const outer = dot3(fnO, sub3(B.eye, ctr)) > 0;
        const fill = outer ? shadeAt(B, Lt, C.sleeve, ctr, fnO, {spec: 0.5, specPow: 18, amb: 0.3, tint: ['#B9FFF6', 0.12]}) : shadeAt(B, Lt, [C.sleeve[1], C.sleeve[1], C.sleeve[2], C.sleeve[3], C.sleeve[4]], ctr, mul3(fnO, -1), {amb: 0.35});
        const pf = [b1, b2, a2, a1].map((q) => proj(B, q));
        // unhidden flaps draw above the balloon's outline ink (they stand in front of it); hidden ones stay depth-sorted
        const zF = occluded(ctr, 0.9) ? zc - 0.3 - 0.001 * rI : INKZ - 10 - depthOf(B, ctr) * 1e-3;
        items.push({z: zF, d: `M${pf.map(P2).join('L')}Z`, fill, stroke: mix(fill, INK, 0.18), sw: clamp(sc * 0.022, 0.6, 10), round: true, op: kLift * vTab});
        items.push({z: zF - 0.0005, d: `M${pf.map(P2).join('L')}Z`, fill, stroke: mix(fill, INK, 0.6), sw: clamp(sc * 0.006, 0.4, 2.2), round: true, op: 0.9 * kLift * vTab});
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
      const seg = clipSeg(a, b, notOcc);
      if (!seg) continue;
      items.push({z: INKZ, d: `M${P2(proj(B, seg[0]))}L${P2(proj(B, seg[1]))}`, stroke: INK, sw: ink(m), round: true});
    }
  };
  chain(crossA);
  chain(crossB);
  // ---- the chamber cutaway: a window in the extender's skin (screen-aligned with its silhouette), showing two of the
  // four Kevlar-reinforced chambers along its sides filling with air as it extends, and the central tool channel
  const cw = o.cutaway ?? 0;
  if (cw > 0.01) {
    const rows: {c: V2; a: V2; b: V2; u: number}[] = [];
    for (let i = 0; i < nU; i++) {
      if (us[i] < L.u3 + 0.35 || us[i] > L.u4 - 0.35) continue;
      const A = crossA[i], Bc = crossB[i];
      if (!A || !Bc) continue;
      const a = proj(B, A), b = proj(B, Bc);
      rows.push({a, b, c: {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}, u: us[i]});
    }
    if (rows.length > 3) {
      const at = (r: (typeof rows)[0], t: number): V2 => ({x: r.c.x + (r.a.x - r.c.x) * t, y: r.c.y + (r.a.y - r.c.y) * t});
      const band = (t0: number, t1: number) => `M${rows.map((r) => P2(at(r, t0))).join('L')}L${[...rows].reverse().map((r) => P2(at(r, t1))).join('L')}Z`;
      const zW = INKZ - 4;
      const reveal = cw;
      // the window opens from the centre line outward
      const half = 0.8 * reveal;
      items.push({z: zW, d: band(-half, half), fill: '#0A2A31', stroke: '#E8F2F2', sw: 2.4, op: 0.96});
      // chambers: their width grows with pressure; the outer chamber of a bend is fuller
      const kMid = KN[Math.floor((us.findIndex((u) => u >= (L.u3 + L.u4) / 2) + 0) || 0)] || 0;
      const fill = (side: number) => clamp(0.25 + 0.75 * st.gE * (1 - side * kMid * 5), 0.15, 1);
      for (const side of [1, -1]) {
        const f = fill(side);
        const w = (0.17 + 0.07 * f) * reveal;
        const ctr = side * 0.47 * reveal;
        items.push({z: zW - 1, d: band(ctr - w, ctr + w), fill: mix('#16525A', C.glow, f), stroke: mix('#2E8C92', '#CFFFFA', f), sw: 2, op: 0.95});
        // the fibre reinforcement: fine rings across each chamber
        const rings: string[] = [];
        for (let k = 1; k < rows.length - 1; k += 2) rings.push(`M${P2(at(rows[k], ctr - w))}L${P2(at(rows[k], ctr + w))}`);
        items.push({z: zW - 1.5, d: rings.join(''), stroke: rgba('#0A2A31', 0.45), sw: 1.4});
      }
      // the central channel and the tool cable inside it
      items.push({z: zW - 2, d: band(-0.13 * reveal, 0.13 * reveal), fill: '#123138', stroke: '#5E7A80', sw: 1.4});
      items.push({z: zW - 2.5, d: band(-0.035 * reveal, 0.035 * reveal), fill: C.steel[2]});
    }
  }
  // seams between modules: the front arcs of the boundary rings
  const seamAt = (u: number, w = 0.6, col = INK) => {
    const f = frame(st.sTail + u);
    const at = (phi: number) => {
      const rho = add3(mul3(f.N, Math.cos(phi)), mul3(f.B, Math.sin(phi)));
      return {p: add3(f.p, mul3(rho, radius(u, phi, st, L).r + 0.004)), rho};
    };
    // visible = on the camera-facing half of the ring AND not hidden by a nearer part of the robot
    const visPhi = (phi: number) => { const q = at(phi); return dot3(q.rho, sub3(B.eye, q.p)) > 0 && !occluded(q.p); };
    for (let j = 0; j < NPHI; j++) {
      const p0 = (j / NPHI) * Math.PI * 2, p1 = ((j + 1) / NPHI) * Math.PI * 2;
      const v0 = visPhi(p0), v1 = visPhi(p1);
      if (!v0 && !v1) continue;
      let a0 = p0, a1 = p1;
      if (v0 !== v1) {
        let lo = p0, hi = p1;
        for (let it = 0; it < 10; it++) { const m = (lo + hi) / 2; if (visPhi(m) === v0) lo = m; else hi = m; }
        if (v0) a1 = (lo + hi) / 2; else a0 = (lo + hi) / 2;
      }
      const A = at(a0).p, Bp = at(a1).p, M = at((a0 + a1) / 2).p;
      items.push({z: INKZ + 1, d: `M${P2(proj(B, A))}L${P2(proj(B, M))}L${P2(proj(B, Bp))}`, stroke: col, sw: ink(M) * w, round: true});
    }
  };

  for (const u of [L.u1 + 0.005, L.u2 - 0.005, L.u3, L.u4, L.u5 + 0.005, L.u6 - 0.005]) seamAt(u, 0.55);
  seamAt(L.u1 * 0.55, 0.35, mix(C.cap[1], INK, 0.3));
  // extender fibre ribs: spread as it extends
  const NR = 16;
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
