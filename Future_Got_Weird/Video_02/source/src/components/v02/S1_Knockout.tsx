/**
 * S1_Knockout (review r2 N01, lead R2-L5): the world-px geometry of the light S1 draws over its "gap" leader, so the
 * leader can be knocked out UNDER the light (the light passes over a gap in it) and the clearances can be asserted.
 *
 * `lightPathShapes` and `scatterFanShapes` return the strokes (segments with half widths) and dots/rings (discs, ring
 * polylines) that components/v02/Optics' LightPath and ScatterFan draw for the same props: the same defaults, lane
 * offsets for out-and-back legs, partition nudges (clearPx), draw-on, release, hidden runs, pulse train sizes and
 * bounce rings (clipped to the room as LightPath clips them). `routeShapes` does the same for S1's dashed Route (dashes
 * treated as solid). Pass the very props object the JSX gets, so the two cannot drift; the replica is checked against
 * renderToStaticMarkup of the Optics components in the fix2 harness (qa/fix2/S1).
 *
 * Every shape carries the opacity it is drawn at (`op`: a fan's release fade, a ring's fade, the trailing pulse dots, the
 * route's and the blocked line's own fades). `knockout` cuts a polyline (the leader) into pieces that keep `clearW`
 * world px between their stroke edge and the edge of every shape drawn at >= `opFull` opacity; near fainter light the
 * leader is drawn at 1 - op / opFull, so it heals in step with light that fades out instead of popping back.
 * `clearanceTo` measures the gap.
 */
import {E} from '../../lib/motion';
import {rand} from '../../lib/anim';
import {firstOccluderHit, lerpP, occluderRect, pathCumulative, roomRect, segmentRectNearest, visibleIntervals, type OpticsLayout, type P2, type ScatterDir} from '../../lib/optics';
import type {ToPx} from './Optics';

export type KPt = {x: number; y: number};
/** A stroke: segment a-b with half width hw (round caps, so the distance to the segment is what counts), opacity op. */
export type KSeg = {a: KPt; b: KPt; hw: number; op: number};
/** A filled dot (radius includes its outline), opacity op. */
export type KDisc = {c: KPt; r: number; op: number};
export type KShapes = {segs: KSeg[]; discs: KDisc[]};

export const noShapes = (): KShapes => ({segs: [], discs: []});
export const mergeShapes = (...all: KShapes[]): KShapes => ({segs: all.flatMap((s) => s.segs), discs: all.flatMap((s) => s.discs)});
/** The same shapes drawn inside a group of opacity k. */
export const fadeShapes = (sh: KShapes, k: number): KShapes => ({segs: sh.segs.map((s) => ({...s, op: s.op * k})), discs: sh.discs.map((d) => ({...d, op: d.op * k}))});

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const hyp = (a: KPt, b: KPt) => Math.hypot(b.x - a.x, b.y - a.y);
const polySegs = (pts: KPt[], hw: number, op = 1): KSeg[] => pts.slice(1).map((b, i) => ({a: pts[i], b, hw, op}));

/** Distance from q to segment a-b. */
export const segDist = (q: KPt, a: KPt, b: KPt) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const u = l2 > 0 ? clamp01(((q.x - a.x) * dx + (q.y - a.y) * dy) / l2) : 0;
  return Math.hypot(q.x - a.x - u * dx, q.y - a.y - u * dy);
};

/** Gap (world px) between a point and the nearest edge of the shapes drawn at >= minOp opacity (negative inside). */
export const clearanceTo = (q: KPt, sh: KShapes, minOp = 0) => {
  let m = Infinity;
  for (const s of sh.segs) if (s.op >= minOp) m = Math.min(m, segDist(q, s.a, s.b) - s.hw);
  for (const d of sh.discs) if (d.op >= minOp) m = Math.min(m, Math.hypot(q.x - d.c.x, q.y - d.c.y) - d.r);
  return m;
};
/** The leader's opacity at q: 1, or 1 - op / opFull for the most opaque shape within clearW of its stroke edge. */
export const healAt = (q: KPt, sh: KShapes, clearW: number, hw: number, opFull: number) => {
  let a = 1;
  for (const s of sh.segs) if (segDist(q, s.a, s.b) - s.hw - hw < clearW) a = Math.min(a, Math.max(0, 1 - s.op / opFull));
  for (const d of sh.discs) if (Math.hypot(q.x - d.c.x, q.y - d.c.y) - d.r - hw < clearW) a = Math.min(a, Math.max(0, 1 - d.op / opFull));
  return a;
};

/** Props of Optics' LightPath that change its geometry (the same names and defaults). */
export type LightPathGeom = {
  points: P2[];
  toPx: ToPx;
  t: number;
  pulses?: number;
  pulseGap?: number;
  intensityFalloff?: number;
  width?: number;
  pulseRadius?: number;
  lane?: number;
  bounceRings?: boolean;
  ringRadius?: number;
  arrive?: 'hide' | 'hold';
  layout?: OpticsLayout;
  clearPx?: number;
  hidden?: (p: P2) => boolean;
};

/** Point-in-convex-polygon (either winding). */
const inConvex = (q: KPt, poly: KPt[]) => {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const c = (b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x);
    if (Math.abs(c) < 1e-9) continue;
    const sg = c > 0 ? 1 : -1;
    if (!sign) sign = sg;
    else if (sg !== sign) return false;
  }
  return true;
};

/** What LightPath draws (showFull false, dash false, ghost 0): its trail, bounce rings and pulse dots. */
export const lightPathShapes = ({
  points,
  toPx,
  t,
  pulses = 1,
  pulseGap = 0.16,
  intensityFalloff = 0.6,
  width = 7,
  pulseRadius = 13,
  lane = 14,
  bounceRings = true,
  ringRadius = 56,
  arrive = 'hide',
  layout,
  clearPx = 6,
  hidden,
}: LightPathGeom): KShapes => {
  const out = noShapes();
  const n = points.length;
  if (n < 2) return out;
  const ringClip = layout ? roomRect(layout) : undefined;
  const cum = pathCumulative(points);
  const total = cum[n - 1];
  const prog = clamp01(t);
  const head = prog * total;
  const same = (a: P2, b: P2) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.z - b.z) < 1e-6;
  const widthOf = (I: number) => width * (0.4 + 0.6 * I);
  const occ = layout && clearPx > 0 ? occluderRect(layout) : null;
  const raw = Array.from({length: n - 1}, (_, i) => {
    const a = points[i];
    const b = points[i + 1];
    const pa = toPx(a);
    const pb = toPx(b);
    const L = Math.max(1e-6, hyp(pa, pb));
    const nrm = {x: -(pb.y - pa.y) / L, y: (pb.x - pa.x) / L};
    const partner = points.findIndex((_, j) => j !== i && j + 1 < n && same(points[j], b) && same(points[j + 1], a));
    const base = partner >= 0 ? lane / 2 : 0;
    const I = Math.pow(intensityFalloff, i);
    let away = {x: 0, y: 0};
    let need = 0;
    if (occ) {
      const q = toPx(segmentRectNearest(a, b, occ).onRect);
      const side = (q.x - pa.x) * nrm.x + (q.y - pa.y) * nrm.y >= 0 ? 1 : -1;
      away = {x: -side * nrm.x, y: -side * nrm.y};
      const edgeGap = segDist(q, pa, pb) - base * side - widthOf(I) / 2;
      need = Math.max(0, clearPx - edgeGap);
    }
    return {a, b, nrm, partner, base, away, need, s0: cum[i], len: cum[i + 1] - cum[i], I};
  });
  const segs = raw.map((s) => {
    const shift = Math.max(s.need, s.partner >= 0 ? raw[s.partner].need : 0);
    const off = {x: s.nrm.x * s.base + s.away.x * shift, y: s.nrm.y * s.base + s.away.y * shift};
    const at = (u: number): KPt => {
      const p = toPx(lerpP(s.a, s.b, u));
      return {x: p.x + off.x, y: p.y + off.y};
    };
    const runs: [number, number][] = hidden ? visibleIntervals(s.a, s.b, hidden) : [[0, 1]];
    return {...s, at, runs, qb: at(1)};
  });
  // trail
  segs.forEach((s, i) => {
    const u = s.len > 0 ? clamp01((head - s.s0) / s.len) : 1;
    s.runs.forEach(([u0, u1]) => {
      const joint = u0 === 0 && i > 0 ? [segs[i - 1].qb] : [];
      const e = Math.min(u1, u);
      if (e > u0) out.segs.push(...polySegs([...joint, s.at(u0), s.at(e)], widthOf(s.I) / 2));
    });
  });
  // bounce rings (clipped to the room rectangle as drawn)
  if (bounceRings) {
    const ringLen = Math.min(0.55, total * 0.12);
    const clip = ringClip ? [toPx({x: ringClip.x0, z: ringClip.z0}), toPx({x: ringClip.x1, z: ringClip.z0}), toPx({x: ringClip.x1, z: ringClip.z1}), toPx({x: ringClip.x0, z: ringClip.z1})] : null;
    for (let v = 1; v < n - 1; v++) {
      const age = head - cum[v];
      if (age <= 0 || age >= ringLen || (hidden && hidden(points[v]))) continue;
      const u = age / ringLen;
      const p = toPx(points[v]);
      const r = 10 + (ringRadius - 10) * E.out(u);
      const hw = (5 * (1 - u * 0.6)) / 2;
      const op = (1 - u) * 0.9;
      let run: KPt[] = [];
      for (let k = 0; k <= 96; k++) {
        const a = (k / 96) * Math.PI * 2;
        const q = {x: p.x + r * Math.cos(a), y: p.y + r * Math.sin(a)};
        if (!clip || inConvex(q, clip)) run.push(q);
        else {
          if (run.length > 1) out.segs.push(...polySegs(run, hw, op));
          else if (run.length === 1) out.discs.push({c: run[0], r: hw, op});
          run = [];
        }
      }
      if (run.length > 1) out.segs.push(...polySegs(run, hw, op));
    }
  }
  // the pulse train
  if (prog > 0 && (prog < 1 || arrive === 'hold')) {
    for (let k = pulses - 1; k >= 0; k--) {
      const d = head - k * pulseGap;
      if (d < 0 || d > total) continue;
      let i = segs.findIndex((s) => d <= s.s0 + s.len);
      if (i < 0) i = segs.length - 1;
      const s = segs[i];
      const u = s.len > 0 ? (d - s.s0) / s.len : 0;
      if (hidden && hidden(lerpP(s.a, s.b, u))) continue;
      const r = Math.max(2.5, pulseRadius * (0.72 + 0.28 * s.I) * (k === 0 ? 1 : 0.62 - k * 0.1));
      out.discs.push({c: s.at(u), r: k === 0 ? r + 3.5 / 2 : r, op: k === 0 ? 1 : Math.max(0.25, 0.85 - k * 0.2)});
    }
  }
  return out;
};

/** Props of Optics' ScatterFan that change its geometry (the same names and defaults). */
export type ScatterFanGeom = {
  origin: P2;
  dirs: ScatterDir[];
  length: number;
  toPx: ToPx;
  t: number;
  release?: number;
  width?: number;
  seed?: number;
  tips?: boolean;
  layout?: OpticsLayout;
  stopMargin?: number;
  hidden?: (p: P2) => boolean;
};

/** What ScatterFan draws: each ray's visible, drawn-on, not-yet-released stretch, and its tip dot. */
export const scatterFanShapes = ({origin, dirs, length, toPx, t, release = 0, width = 4.5, seed = 1, tips = true, layout, stopMargin = 0.05, hidden}: ScatterFanGeom): KShapes => {
  const out = noShapes();
  if (t <= 0 || release >= 1) return out;
  const stagger = 0.3;
  const rel = clamp01(release);
  dirs.forEach((d, i) => {
    const L = length * (0.3 + 0.7 * d.w) * (0.85 + 0.3 * rand(seed * 53 + i * 7));
    let end: P2 = {x: origin.x + d.x * L, z: origin.z + d.z * L};
    if (layout) end = lerpP(origin, end, firstOccluderHit(origin, end, layout, stopMargin));
    const delay = rand(seed * 17 + i * 3) * stagger;
    const ti = E.out(clamp01((t - delay) / (1 - stagger)));
    if (ti <= 0) return;
    const u0 = 0.8 * E.inOut(rel) * ti;
    const u1 = ti;
    const P = (u: number) => toPx(lerpP(origin, end, u));
    const runs = (hidden ? visibleIntervals(origin, end, hidden, 16) : [[0, 1] as [number, number]]).map(([a, b]) => [Math.max(a, u0), Math.min(b, u1)]).filter(([a, b]) => b > a);
    const op = 1 - E.in(rel);
    for (const [a, b] of runs) out.segs.push({a: P(a), b: P(b), hw: (width * (0.75 + 0.25 * d.w)) / 2, op});
    if (tips && !(hidden && hidden(lerpP(origin, end, u1)))) out.discs.push({c: P(u1), r: width * 1.15 + 2.5 / 2, op});
  });
  return out;
};

/** What S1's dashed Route draws (dashes as solid): the visible runs of the polyline up to `head` metres. */
export const routeShapes = ({points, head, toPx, hidden, hw, op = 1}: {points: P2[]; head: number; toPx: ToPx; hidden: (p: P2) => boolean; hw: number; op?: number}): KShapes => {
  const out = noShapes();
  const runs: KPt[][] = [];
  let cur: KPt[] = [];
  let acc = 0;
  for (let i = 0; i < points.length - 1 && acc < head; i++) {
    const a = points[i];
    const b = points[i + 1];
    const L = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(2, Math.ceil(L / 0.02));
    for (let k = 0; k <= n; k++) {
      const d = (L * k) / n;
      if (acc + d > head) break;
      const p = {x: a.x + ((b.x - a.x) * d) / L, z: a.z + ((b.z - a.z) * d) / L};
      if (hidden(p)) {
        if (cur.length > 1) runs.push(cur);
        cur = [];
      } else cur.push(toPx(p));
    }
    acc += L;
  }
  if (cur.length > 1) runs.push(cur);
  for (const r of runs) out.segs.push(...polySegs(r, hw, op));
  return out;
};

/** A drawn piece of the leader and the opacity it is drawn at. */
export type KPiece = {pts: KPt[]; a: number};

/**
 * The pieces of polyline `pts` (world px, stroke half width `hw`) drawn up to arc length `head`: cut where a shape drawn
 * at >= opFull opacity comes within `clearW` of the stroke's edge (each cut refined by bisection), and drawn at
 * healAt's opacity (quantised to 1/20) near fainter light. A piece shorter than `fadeLen` (a speck left between two
 * cuts) is drawn fainter in proportion, so specks fade in and out instead of popping. Sampled every `step` px.
 */
export const knockout = (pts: KPt[], head: number, sh: KShapes, clearW: number, hw: number, opFull: number, fadeLen = 0, step = 1): KPiece[] => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + hyp(pts[i - 1], pts[i]));
  const total = cum[cum.length - 1];
  const H = Math.max(0, Math.min(total, head));
  const at = (m: number): KPt => {
    let i = 0;
    while (i < pts.length - 2 && m > cum[i + 1]) i++;
    const u = clamp01((m - cum[i]) / Math.max(1e-9, cum[i + 1] - cum[i]));
    return {x: pts[i].x + (pts[i + 1].x - pts[i].x) * u, y: pts[i].y + (pts[i + 1].y - pts[i].y) * u};
  };
  const level = (m: number) => Math.round(healAt(at(m), sh, clearW, hw, opFull) * 20) / 20;
  const pieces: KPiece[] = [];
  const emit = (m0: number, m1: number, a: number) => {
    const k = fadeLen > 0 ? Math.min(1, (m1 - m0) / fadeLen) : 1;
    if (a * k <= 0.02 || m1 - m0 < 0.25) return;
    const piece = [at(m0)];
    for (let i = 1; i < pts.length - 1; i++) if (cum[i] > m0 && cum[i] < m1) piece.push(pts[i]);
    piece.push(at(m1));
    pieces.push({pts: piece, a: Math.round(a * k * 100) / 100});
  };
  const n = Math.max(1, Math.ceil(H / step));
  let prevM = 0;
  let prevL = level(0);
  let start = 0;
  for (let k = 1; k <= n; k++) {
    const m = (H * k) / n;
    const L = level(m);
    if (L !== prevL) {
      // the edge between two levels (a full knock-out's edge included), refined by bisection
      let lo = prevM;
      let hi = m;
      for (let it = 0; it < 18; it++) {
        const mid = (lo + hi) / 2;
        if (level(mid) === prevL) lo = mid;
        else hi = mid;
      }
      const cut = prevL > 0 ? lo : hi;
      emit(start, cut, prevL);
      start = cut;
    }
    prevM = m;
    prevL = L;
  }
  emit(start, H, prevL);
  return pieces;
};

/** Arc length of a piece. */
export const pieceLength = (p: KPt[]) => p.slice(1).reduce((s, q, i) => s + hyp(p[i], q), 0);
