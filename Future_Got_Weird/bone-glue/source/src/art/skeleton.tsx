// The patient's skeleton except the radius (art/bone.tsx draws the radius): the ulna, the eight carpals, the five
// metacarpals and the phalanges of the RIGHT hand, palmar view, radial (thumb) side on screen right, in the inside
// layer's world millimetres (anatomy.ts). Anatomical cutaway finish: cream bone, cel shading from the upper-left key
// light, colour-matched ink, articular surfaces a little lighter (cartilage).
//
// The carpus is built from shared joint lines: each joint is one mid-line, and the two bones on either side are its
// offsets by half the joint space, so every joint space stays tight and even (G2 = 1.3 mm). The radiocarpal surfaces
// are offsets of anatomy.RADIUS' articular edge, so the scaphoid and lunate sit exactly on the real radius.
// Ink widths are screen pixels (vector-effect: non-scaling-stroke), so the line weight is the same at every zoom and
// matches bone.tsx' radius (2.8 px).
import React from 'react';
import {P, pt, add, sub, mul, nrm, perp, len, lerpP, closed, open, poly} from '../core/geo';
import {mix, rgba} from '../core/color';
import {clamp} from '../lib';
import {C} from './palette';
import {Digit, FINGERS, RADIUS, THUMB, fingerChain, thumbChain} from './anatomy';

export const LIGHT = nrm(pt(-0.62, -0.78));
/** articular cartilage (matches the radius' articular line in bone.tsx) */
export const CARTILAGE = '#EEF3F2';
/** ink width of the bones in screen pixels */
export const BONE_INK = 2.6;
const NS = 'non-scaling-stroke' as const;
const G = 0.6; // half a joint space (mm)

// ---------------------------------------------------------------- polyline helpers
const tan = (ps: P[], i: number) => nrm(sub(ps[Math.min(ps.length - 1, i + 1)], ps[Math.max(0, i - 1)]));
/** offset a polyline by d along perp(t) (for a polyline running left -> right on screen, +d moves it DOWN) */
export const offsetPL = (ps: P[], d: number): P[] => ps.map((p, i) => add(p, mul(perp(tan(ps, i)), d)));
const rev = <T,>(a: T[]): T[] => [...a].reverse();
/** linear resampling of an open polyline every `step` mm (keeps the end points) */
export const resample = (ps: P[], step: number): P[] => {
  const out: P[] = [ps[0]];
  for (let i = 0; i < ps.length - 1; i++) {
    const a = ps[i], b = ps[i + 1];
    const L = len(sub(b, a));
    const n = Math.max(1, Math.ceil(L / step));
    for (let k = 1; k <= n; k++) out.push(lerpP(a, b, k / n));
  }
  return out;
};
/** the part of an x-monotonic polyline with x in [x0, x1] */
const clipX = (ps: P[], x0: number, x1: number): P[] => {
  const out: P[] = [];
  for (let i = 0; i < ps.length - 1; i++) {
    const a = ps[i], b = ps[i + 1];
    const lo = Math.min(a.x, b.x), hi = Math.max(a.x, b.x);
    if (hi < x0 || lo > x1) continue;
    const at = (x: number) => lerpP(a, b, (x - a.x) / (b.x - a.x || 1e-9));
    const p0 = a.x < x0 ? at(x0) : a, p1 = b.x > x1 ? at(x1) : b;
    if (!out.length || len(sub(out[out.length - 1], p0)) > 1e-6) out.push(p0);
    out.push(p1);
  }
  return out;
};
/** points on a circle (degrees, screen convention: 90 = down) */
const arc = (c: P, r: number, a0: number, a1: number, step = 6): P[] => {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step));
  const out: P[] = [];
  for (let k = 0; k <= n; k++) {
    const a = ((a0 + ((a1 - a0) * k) / n) * Math.PI) / 180;
    out.push(pt(c.x + r * Math.cos(a), c.y + r * Math.sin(a)));
  }
  return out;
};
const ellipsePts = (c: P, rx: number, ry: number, rotDeg: number, n = 40): P[] => {
  const r = (rotDeg * Math.PI) / 180, cs = Math.cos(r), sn = Math.sin(r);
  const out: P[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const x = rx * Math.cos(a), y = ry * Math.sin(a);
    out.push(pt(c.x + x * cs - y * sn, c.y + x * sn + y * cs));
  }
  return out;
};
const segHit = (p: P, p2: P, q: P, q2: P): {t: number; u: number} | null => {
  const r = sub(p2, p), s = sub(q2, q);
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-12) return null;
  const qp = sub(q, p);
  const t = (qp.x * s.y - qp.y * s.x) / den, u = (qp.x * r.y - qp.y * r.x) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? {t, u} : null;
};
const extend = (ps: P[], e = 2.6): P[] => {
  if (ps.length < 2) return ps;
  const a = nrm(sub(ps[0], ps[1])), b = nrm(sub(ps[ps.length - 1], ps[ps.length - 2]));
  return [add(ps[0], mul(a, e)), ...ps, add(ps[ps.length - 1], mul(b, e))];
};

type Edge = {pts: P[]; art: boolean};
type Built = {pts: P[]; art: boolean[]};
/** Join a cycle of edges into one outline: consecutive edges are cut at their crossing (edges are extended a little at
 *  both ends so neighbouring joint offsets always meet), or simply chained when they do not cross. */
const joinEdges = (edges: Edge[]): Built => {
  const n = edges.length;
  const ex = edges.map((e) => extend(resample(e.pts, 0.6)));
  // the cut on edge i where it meets edge i+1: index into ex[i] (segment, t) and into ex[i+1]
  const endCut: (null | {seg: number; t: number})[] = new Array(n).fill(null);
  const startCut: (null | {seg: number; t: number})[] = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    const A = ex[i], B = ex[(i + 1) % n];
    let best: null | {sa: number; sb: number; score: number} = null;
    const aFrom = Math.max(0, A.length - 1 - 40), bTo = Math.min(B.length - 1, 40);
    for (let a = A.length - 2; a >= aFrom; a--) {
      for (let b = 0; b < bTo; b++) {
        const h = segHit(A[a], A[a + 1], B[b], B[b + 1]);
        if (!h) continue;
        const sa = a + h.t, sb = b + h.u;
        const score = (A.length - 1 - sa) + sb;
        if (!best || score < best.score) best = {sa, sb, score};
      }
    }
    if (best) {
      endCut[i] = {seg: Math.floor(best.sa), t: best.sa - Math.floor(best.sa)};
      startCut[(i + 1) % n] = {seg: Math.floor(best.sb), t: best.sb - Math.floor(best.sb)};
    }
  }
  const pts: P[] = [], art: boolean[] = [];
  for (let i = 0; i < n; i++) {
    const A = ex[i];
    // without a cut, drop the extension
    const s0 = startCut[i] ?? {seg: 1, t: 0};
    const s1 = endCut[i] ?? {seg: A.length - 3, t: 1};
    const seq: P[] = [lerpP(A[s0.seg], A[s0.seg + 1], s0.t)];
    for (let k = s0.seg + 1; k <= s1.seg; k++) seq.push(A[k]);
    seq.push(lerpP(A[s1.seg], A[s1.seg + 1], s1.t));
    for (const p of seq) {
      if (pts.length && len(sub(pts[pts.length - 1], p)) < 0.08) continue;
      pts.push(p);
      art.push(edges[i].art);
    }
  }
  return {pts, art};
};
/** uniform resampling of a closed outline + a light smoothing (rounds the joint corners by ~0.6 mm) */
const smoothClosed = (b: Built, step = 0.4, passes = 12): Built => {
  const src = [...b.pts, b.pts[0]];
  const pts: P[] = [], art: boolean[] = [];
  for (let i = 0; i < src.length - 1; i++) {
    const a = src[i], c = src[i + 1];
    const L = len(sub(c, a));
    const k = Math.max(1, Math.round(L / step));
    for (let j = 0; j < k; j++) {
      pts.push(lerpP(a, c, j / k));
      art.push(b.art[i] && b.art[(i + 1) % b.art.length]);
    }
  }
  let cur = pts;
  for (let p = 0; p < passes; p++) {
    const m = cur.length;
    cur = cur.map((q, i) => {
      const a = cur[(i - 1 + m) % m], c = cur[(i + 1) % m];
      return pt(0.25 * a.x + 0.5 * q.x + 0.25 * c.x, 0.25 * a.y + 0.5 * q.y + 0.25 * c.y);
    });
  }
  return {pts: cur, art};
};
/** runs of articular points (open polylines) */
const artRuns = (b: Built): P[][] => {
  const n = b.pts.length;
  const start = b.art.findIndex((a, i) => !a && b.art[(i + 1) % n]);
  if (start < 0) return b.art[0] ? [[...b.pts, b.pts[0]]] : [];
  const runs: P[][] = [];
  let cur: P[] | null = null;
  for (let k = 1; k <= n; k++) {
    const i = (start + k) % n;
    if (b.art[i]) {
      if (!cur) cur = [];
      cur.push(b.pts[i]);
    } else if (cur) {
      if (cur.length > 2) runs.push(cur);
      cur = null;
    }
  }
  if (cur && cur.length > 2) runs.push(cur);
  return runs;
};

// ---------------------------------------------------------------- the joint lines of the carpus
const RA = resample(RADIUS.slice(0, 9), 0.5); // the radius' articular edge, ulnar corner -> styloid tip
const RC = 1.55; // radiocarpal joint space
const raFacet = (x0: number, x1: number) => clipX(offsetPL(RA, -RC), x0, x1);
/** the capitate's head (a circle) and the cup of lunate + scaphoid around it */
export const HEAD_C = pt(-4.0, -49.4);
export const HEAD_R = 6.6;
const SL: P[] = [pt(0.8, -31.3), pt(0.35, -36.6), pt(0.55, -42.6)]; // scapholunate (upward; + = scaphoid)
const LT: P[] = [pt(-14.4, -29.6), pt(-14.55, -36.2), pt(-12.7, -44.6)]; // lunotriquetral (upward; + = lunate)
const TH: P[] = [pt(-12.4, -45.6), pt(-15.6, -48.6), pt(-19.2, -51.6), pt(-22.6, -54.6), pt(-25.4, -57.4)]; // triquetrohamate (+ = hamate)
const CH: P[] = [pt(-11.45, -48.4), pt(-10.4, -54.0), pt(-10.3, -59.0), pt(-10.75, -64.5), pt(-10.9, -68.8), pt(-10.6, -72.15)]; // capitohamate (upward; + = capitate)
const T1 = arc(HEAD_C, HEAD_R + G, -40, -40)[0]; // scaphoid / capitate / trapezoid
const CTD: P[] = [T1, pt(2.9, -57.6), pt(3.9, -62.0), pt(4.55, -66.5), pt(4.4, -72.2)]; // capitate-trapezoid (upward; + = trapezoid)
const T2 = pt(11.6, -60.0); // scaphoid / trapezoid / trapezium
const STT: P[] = [T1, pt(4.0, -56.9), pt(7.5, -59.0), T2, pt(15.5, -59.9), pt(19.2, -58.4), pt(22.2, -55.9)]; // scaphoid-trapezium-trapezoid (+ = scaphoid)
const TDTM: P[] = [T2, pt(12.6, -63.5), pt(13.7, -67.2), pt(14.0, -71.2)]; // trapezoid-trapezium (upward; + = trapezium)
const CMC23: P[] = [pt(-12.0, -72.1), pt(-10.6, -72.15), pt(-6.0, -72.55), pt(-2.0, -72.6), pt(2.0, -72.3), pt(4.4, -71.9), pt(6.5, -72.6), pt(8.6, -73.1), pt(10.8, -72.7), pt(13.6, -71.9), pt(15.6, -71.4)]; // + = carpals
const CMC45: P[] = [pt(-28.0, -66.4), pt(-26.6, -67.0), pt(-23.5, -68.4), pt(-20.8, -69.6), pt(-18.6, -71.1), pt(-16.4, -71.6), pt(-14.0, -72.0), pt(-11.6, -72.15), pt(-9.0, -72.15)]; // + = hamate
/** the first CMC joint (saddle), across the first metacarpal's axis */
const A1 = nrm(sub(THUMB.head, THUMB.base));
const N1 = perp(A1); // across the thumb ray, toward screen lower-right
const B1 = add(THUMB.base, mul(A1, -G));
const CMC1: P[] = [-6.6, -5.9, -3, 0, 3, 5.9, 6.6].map((k) => add(add(B1, mul(N1, k)), mul(A1, 0.55 * (k / 5.9) ** 2 - 0.05))); // + = trapezium

// ---------------------------------------------------------------- the carpals
const edgesOf: Record<string, Edge[]> = {
  lunate: [
    {pts: raFacet(-14.6, 1.2), art: true},
    {pts: offsetPL(SL, -G), art: true},
    {pts: arc(HEAD_C, HEAD_R + 2 * G, 52, 150), art: true},
    {pts: rev(offsetPL(LT, G)), art: true},
  ],
  scaphoid: [
    {pts: raFacet(0.4, 15.5), art: true},
    {pts: [pt(15.6, -40.3), pt(16.2, -41.8), pt(16.9, -43.8), pt(18.3, -46.2), pt(20.4, -48.6), pt(22.2, -51.0), pt(23.0, -53.6), pt(22.6, -55.8)], art: false},
    {pts: rev(offsetPL(STT, G)), art: true},
    {pts: arc(HEAD_C, HEAD_R + 2 * G, -40, 66), art: true},
    {pts: rev(offsetPL(SL, G)), art: true},
  ],
  capitate: [
    {pts: arc(HEAD_C, HEAD_R, -42, 186), art: true},
    {pts: offsetPL(CH, G), art: true},
    {pts: clipX(offsetPL(CMC23, G), -12, 5), art: true},
    {pts: rev(offsetPL(CTD, -G)), art: true},
  ],
  trapezoid: [
    {pts: clipX(offsetPL(STT, -G), 1.5, 13.5), art: true},
    {pts: offsetPL(TDTM, -G), art: true},
    {pts: rev(clipX(offsetPL(CMC23, G), 3.5, 14.0)), art: true},
    {pts: rev(offsetPL(CTD, G)), art: true},
  ],
  trapezium: [
    {pts: clipX(offsetPL(STT, -G), 10.0, 23.6), art: true},
    {pts: [pt(23.4, -56.6), pt(25.4, -58.4), pt(27.2, -60.9), pt(28.2, -63.4), pt(28.3, -65.6)], art: false},
    {pts: rev(offsetPL(CMC1, G)), art: true},
    {pts: [pt(15.4, -71.0), pt(14.5, -70.6)], art: false},
    {pts: rev(offsetPL(TDTM, G)), art: true},
  ],
  hamate: [
    {pts: rev(offsetPL(TH, G)), art: true},
    {pts: offsetPL(CH, -G), art: true},
    {pts: rev(offsetPL(CMC45, G)), art: true},
    {pts: [pt(-27.0, -66.6), pt(-27.7, -64.0), pt(-27.7, -61.0), pt(-26.9, -58.8)], art: false},
  ],
  triquetrum: [
    {pts: offsetPL(LT, -G), art: true},
    {pts: offsetPL(TH, -G), art: true},
    {pts: [pt(-26.5, -56.0), pt(-27.7, -52.4), pt(-28.2, -48.0), pt(-27.8, -43.4), pt(-26.5, -39.2), pt(-24.4, -35.8)], art: false},
    {pts: [pt(-23.4, -34.6), pt(-20.4, -32.7), pt(-17.6, -31.3), pt(-14.4, -30.0)], art: true},
  ],
};
/** the pisiform (on the triquetrum's palmar face) and the hook of the hamate: they lie toward the viewer */
const egg = (c: P, rx: number, ry: number, rotDeg: number, k: number, n = 44) =>
  ellipsePts(pt(0, 0), rx, ry, 0, n).map((p) => {
    const q = pt(p.x * (1 + k * (p.y / ry)), p.y); // wider toward +y
    const r = (rotDeg * Math.PI) / 180;
    return pt(c.x + q.x * Math.cos(r) - q.y * Math.sin(r), c.y + q.x * Math.sin(r) + q.y * Math.cos(r));
  });
const PISIFORM = egg(pt(-25.5, -47.2), 4.5, 5.5, -18, 0.12);
const HOOK = smoothClosed({pts: [pt(-22.2, -57.8), pt(-20.4, -57.0), pt(-18.6, -58.2), pt(-17.4, -60.8), pt(-17.3, -63.8), pt(-18.2, -66.2), pt(-19.6, -66.8), pt(-20.5, -65.4), pt(-20.6, -62.8), pt(-21.4, -60.6), pt(-22.6, -59.2)], art: new Array(11).fill(false)}, 0.3, 8).pts;

const built: Record<string, Built> = {};
for (const k of Object.keys(edgesOf)) built[k] = smoothClosed(joinEdges(edgesOf[k]));
built.pisiform = {pts: PISIFORM, art: PISIFORM.map((p) => p.x > -25.5 && p.y > -46)}; // facet for the triquetrum (hidden side; a hint)
built.hook = {pts: HOOK, art: HOOK.map(() => false)};

/** refined carpal outlines (closed polygons, world mm), superseding anatomy.CARPALS */
export const CARPAL_SHAPES: Record<string, P[]> = Object.fromEntries(Object.entries(built).map(([k, b]) => [k, b.pts]));

// ---------------------------------------------------------------- the ulna
const ULNA_EDGES: Edge[] = [
  // the seat for the radius' sigmoid notch (DRUJ), then the dome under the TFCC
  {pts: [pt(-17.0, -12.0), pt(-17.3, -14.6), pt(-17.55, -18.0), pt(-17.6, -22.0), pt(-17.2, -24.6)], art: true},
  {pts: [pt(-17.2, -24.6), pt(-18.5, -26.7), pt(-20.8, -28.0), pt(-23.6, -28.5), pt(-26.2, -28.3), pt(-28.0, -28.4)], art: true},
  // the styloid, the ulnar border, the shaft
  {pts: [pt(-28.0, -28.4), pt(-29.6, -29.4), pt(-30.6, -30.8), pt(-31.3, -32.2), pt(-32.0, -33.0), pt(-32.8, -32.8), pt(-33.5, -31.4), pt(-34.0, -29.4),
    pt(-34.4, -27.0), pt(-34.6, -24.4), pt(-34.7, -20.0), pt(-34.2, -14.5), pt(-33.1, -9.0), pt(-32.2, -3.0), pt(-31.7, 5.0), pt(-31.5, 15.0), pt(-31.6, 40.0), pt(-32.0, 80.0),
    pt(-32.6, 130.0), pt(-33.0, 175.0), pt(-33.2, 200.0), pt(-28.0, 202.0), pt(-23.0, 200.0), pt(-22.8, 175.0), pt(-22.3, 130.0), pt(-21.8, 80.0),
    pt(-21.5, 40.0), pt(-21.3, 20.0), pt(-20.6, 8.0), pt(-19.5, 0.0), pt(-18.2, -6.5), pt(-17.0, -12.0)], art: false},
];
const ulnaBuilt = smoothClosed({pts: ULNA_EDGES.flatMap((e) => e.pts.slice(0, -1)), art: ULNA_EDGES.flatMap((e) => e.pts.slice(0, -1).map(() => e.art))}, 0.5, 4);
/** the ulna (head with its styloid, shaft down past the window), closed outline in world mm; supersedes anatomy.ULNA */
export const ULNA_OUTLINE: P[] = ulnaBuilt.pts;

// ---------------------------------------------------------------- long bones (metacarpals, phalanges)
type LongSpec = {base: P[]; end: P; ws: number; wh: number; tuft?: number};
type Long = {pts: P[]; baseArt: P[]; headArt: P[]; u: P; n: P; mid: P; hw: number; L: number; blob?: {c: P; rx: number; ry: number; ang: number}};
const smoothstep = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** a long bone from its proximal edge (left -> right across the bone, looking distally) to its distal end point */
const longBone = ({base, end, ws, wh, tuft}: LongSpec): Long => {
  const B = lerpP(base[0], base[base.length - 1], 0.5);
  const u = nrm(sub(end, B));
  const n = perp(u); // screen right of a bone pointing up
  const L = Math.max(0.6, len(sub(end, B)));
  const wbL = Math.abs((base[0].x - B.x) * n.x + (base[0].y - B.y) * n.y);
  const wbR = Math.abs((base[base.length - 1].x - B.x) * n.x + (base[base.length - 1].y - B.y) * n.y);
  const wEnd = tuft ?? wh;
  const hd = Math.min(tuft ? 0.75 * wEnd : 0.85 * wEnd, 0.45 * L); // the length of the head's dome
  const sH = L - hd;
  const prof = (s: number, wb: number) => {
    const f = s / Math.max(1e-6, sH);
    const flare = 1 - smoothstep((f - 0.03) / 0.3);
    const headF = smoothstep((f - 0.62) / 0.38);
    const waist = 1 - 0.05 * Math.sin(Math.PI * clamp((f - 0.2) / 0.6));
    if (tuft) {
      // distal phalanx: flared base, slim shaft, a spade-shaped tuft
      return ws * waist + (wb - ws) * flare + (wEnd - ws) * smoothstep((f - 0.55) / 0.45);
    }
    return ws * waist + (wb - ws) * flare + (wEnd - ws) * headF;
  };
  const at = (s: number, side: number, wb: number) => add(add(B, mul(u, s)), mul(n, side * prof(s, wb)));
  const fr = [0.06, 0.14, 0.24, 0.36, 0.5, 0.64, 0.76, 0.87, 0.95, 1];
  const right = fr.map((f) => at(f * sH, 1, wbR));
  const left = rev(fr.map((f) => at(f * sH, -1, wbL)));
  const dome: P[] = [];
  const Dc = add(B, mul(u, sH));
  for (let k = 1; k < 12; k++) {
    const a = (k / 12) * Math.PI;
    dome.push(add(add(Dc, mul(n, wEnd * Math.cos(a))), mul(u, hd * Math.sin(a) * (tuft ? 1 : 1 - 0.1 * Math.sin(a) ** 8))));
  }
  const pts = [...base, ...right, ...dome, ...left];
  const headArt = tuft ? [] : [at(sH - 0.1 * hd, 1, wbR), ...dome, at(sH - 0.1 * hd, -1, wbL)];
  return {pts, baseArt: base, headArt, u, n, mid: add(B, mul(u, L * 0.5)), hw: Math.max(ws, 0.5 * (wbL + wbR)), L};
};
/** a concave articular base across a bone at P (pointing along u) */
const concaveBase = (P0: P, u: P, wb: number): P[] => {
  const n = perp(u);
  return [-1, -0.75, -0.4, 0, 0.4, 0.75, 1].map((k) => add(add(P0, mul(n, k * wb)), mul(u, 0.42 * wb * (1 - k * k) * 0.55)));
};

// the metacarpals' proximal edges sit on the CMC joint lines
const MC_BASE: P[][] = [
  clipX(offsetPL(CMC23, -G), 2.9, 15.2), // index (trapezoid, capitate, trapezium)
  clipX(offsetPL(CMC23, -G), -9.5, 2.2), // middle (capitate)
  clipX(offsetPL(CMC45, -G), -17.6, -10.3), // ring (hamate)
  clipX(offsetPL(CMC45, -G), -27.0, -18.4), // little (hamate)
];
const MC1_BASE = offsetPL(CMC1, -G).slice(1, -1);

/** all the long bones of the hand for a finger curl and a thumb flexion */
export const handBones = (curl: number, thumb: number) => {
  const mcs: Long[] = [], phal: Long[][] = [[], [], []];
  FINGERS.forEach((d: Digit, i) => {
    const ch = fingerChain(d, curl);
    const w = d.w;
    const uMc = nrm(sub(d.head, d.base));
    mcs.push(longBone({base: MC_BASE[i], end: add(d.head, mul(uMc, -0.7)), ws: 0.45 * w, wh: 0.7 * w}));
    const u = nrm(sub(ch[3], ch[0]));
    const gaps = [0.7, 0.6, 0.55];
    const ends = [0.6, 0.55, 0];
    const widths = [[0.64, 0.4, 0.5], [0.54, 0.34, 0.42], [0.45, 0.25, 0.36]];
    for (let k = 0; k < 3; k++) {
      const p0 = add(ch[k], mul(u, gaps[k])), p1 = add(ch[k + 1], mul(u, -ends[k]));
      const [wb, ws, wh] = widths[k].map((x) => x * w);
      const Lp = len(sub(p1, p0));
      if (k === 2 && Lp < 1.6 * wh) {
        // the fingertip seen end-on: the tuft as a rounded disc
        const c = lerpP(p0, p1, 0.5);
        phal[k].push({pts: ellipsePts(c, wh * 1.05, Math.max(wh * 0.9, Lp * 0.5 + wh * 0.55), (Math.atan2(u.y, u.x) * 180) / Math.PI + 90, 30), baseArt: [], headArt: [], u, n: perp(u), mid: c, hw: wh, L: Lp});
        continue;
      }
      phal[k].push(longBone({base: concaveBase(p0, u, wb), end: p1, ws, wh, tuft: k === 2 ? wh : undefined}));
    }
  });
  // the thumb: first metacarpal on the trapezium saddle, then two phalanges
  const tc = thumbChain(thumb);
  const ut = nrm(sub(tc[2], tc[0]));
  const w = THUMB.w;
  const mc1 = longBone({base: MC1_BASE, end: add(THUMB.head, mul(A1, -0.7)), ws: 0.5 * w, wh: 0.7 * w});
  const tp0 = longBone({base: concaveBase(add(tc[0], mul(ut, 0.7)), ut, 0.64 * w), end: add(tc[1], mul(ut, -0.6)), ws: 0.42 * w, wh: 0.54 * w});
  const tp1 = longBone({base: concaveBase(add(tc[1], mul(ut, 0.6)), ut, 0.52 * w), end: tc[2], ws: 0.3 * w, wh: 0.42 * w, tuft: 0.42 * w});
  return {mcs, phal, mc1, tp0, tp1};
};

// ---------------------------------------------------------------- drawing
const centroid = (ps: P[]) => {
  let x = 0, y = 0;
  for (const p of ps) { x += p.x; y += p.y; }
  return pt(x / ps.length, y / ps.length);
};
const extentFrom = (c: P, ps: P[]) => ps.reduce((m, p) => Math.max(m, len(sub(p, c))), 0);

/** a compact bone with ball shading (carpals, sesamoids, the pisiform) */
const Compact: React.FC<{id: string; b: Built; detail: number; shadow?: boolean}> = ({id, b, detail, shadow}) => {
  const c = centroid(b.pts);
  const r = extentFrom(c, b.pts);
  const f = add(c, mul(LIGHT, r * 0.42));
  const d = poly(b.pts);
  const runs = artRuns(b);
  const gl = add(c, mul(LIGHT, r * 0.5));
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" cx={c.x} cy={c.y} r={r * 1.08} fx={f.x} fy={f.y}>
          <stop offset={0} stopColor={C.boneLit} />
          <stop offset={0.36} stopColor={mix(C.boneLit, C.bone, 0.6)} />
          <stop offset={0.66} stopColor={C.bone} />
          <stop offset={0.88} stopColor={C.boneShade} />
          <stop offset={1} stopColor={mix(C.boneShade, C.boneDeep, 0.45)} />
        </radialGradient>
        <linearGradient id={`${id}-r`} gradientUnits="userSpaceOnUse" x1={c.x + LIGHT.x * r} y1={c.y + LIGHT.y * r} x2={c.x - LIGHT.x * r} y2={c.y - LIGHT.y * r}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={0.75} />
          <stop offset={0.4} stopColor={C.boneLit} stopOpacity={0} />
          <stop offset={0.58} stopColor={C.boneShade} stopOpacity={0} />
          <stop offset={1} stopColor={mix(C.boneShade, C.boneDeep, 0.6)} stopOpacity={0.9} />
        </linearGradient>
        <clipPath id={`${id}-c`}><path d={d} /></clipPath>
      </defs>
      {shadow && (
        <g>
          <defs>
            <filter id={`${id}-sf`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={0.45} />
            </filter>
          </defs>
          <path d={d} fill={rgba('#3A1A10', 0.42)} transform="translate(0.55 0.8)" filter={`url(#${id}-sf)`} />
        </g>
      )}
      <path d={d} fill={`url(#${id}-g)`} />
      <g clipPath={`url(#${id}-c)`}>
        <path d={d} fill="none" stroke={`url(#${id}-r)`} strokeWidth={Math.min(2.2, r * 0.4)} />
        {runs.map((rn, i) => <path key={i} d={open(rn, 0.5)} stroke={CARTILAGE} strokeWidth={1.0} fill="none" opacity={0.6} strokeLinecap="round" />)}
        <ellipse cx={gl.x} cy={gl.y} rx={r * 0.2} ry={r * 0.1} transform={`rotate(-38 ${gl.x} ${gl.y})`} fill="#FFFFFF" opacity={0.42 * detail} />
      </g>
      <path d={d} fill="none" stroke={C.boneInk} strokeWidth={BONE_INK} strokeLinejoin="round" vectorEffect={NS} />
    </g>
  );
};

/** a long bone with cylindrical shading across its axis */
const LongB: React.FC<{id: string; b: Long; detail: number}> = ({id, b, detail}) => {
  if (b.pts.length < 3) return null;
  const nl = b.n.x * LIGHT.x + b.n.y * LIGHT.y >= 0 ? b.n : mul(b.n, -1);
  const A = add(b.mid, mul(nl, b.hw)), Bp = add(b.mid, mul(nl, -b.hw));
  const d = closed(b.pts, 0.85);
  const sheen = [add(b.mid, add(mul(nl, b.hw * 0.42), mul(b.u, -b.L * 0.32))), add(b.mid, add(mul(nl, b.hw * 0.42), mul(b.u, b.L * 0.3)))];
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={A.x} y1={A.y} x2={Bp.x} y2={Bp.y}>
          <stop offset={0} stopColor={C.boneLit} />
          <stop offset={0.3} stopColor={mix(C.boneLit, C.bone, 0.55)} />
          <stop offset={0.58} stopColor={C.bone} />
          <stop offset={0.82} stopColor={C.boneShade} />
          <stop offset={0.94} stopColor={mix(C.boneShade, C.boneDeep, 0.3)} />
          <stop offset={1} stopColor={mix(C.boneShade, '#B8A7B4', 0.4)} />
        </linearGradient>
        <clipPath id={`${id}-c`}><path d={d} /></clipPath>
      </defs>
      <path d={d} fill={`url(#${id}-g)`} />
      <g clipPath={`url(#${id}-c)`}>
        {b.L > 6 && <path d={open(sheen, 1)} stroke={C.boneLit} strokeWidth={b.hw * 0.42} strokeLinecap="round" fill="none" opacity={0.55 * detail} />}
        {b.headArt.length > 2 && <path d={open(b.headArt, 0.7)} stroke={CARTILAGE} strokeWidth={1.2} fill="none" opacity={0.78} />}
        {b.baseArt.length > 2 && <path d={open(b.baseArt, 0.7)} stroke={CARTILAGE} strokeWidth={1.2} fill="none" opacity={0.7} />}
      </g>
      <path d={d} fill="none" stroke={C.boneInk} strokeWidth={BONE_INK} strokeLinejoin="round" vectorEffect={NS} />
    </g>
  );
};

const ULNA_D = poly(ULNA_OUTLINE);
const Ulna: React.FC<{id: string; detail: number}> = ({id, detail}) => {
  const runs = artRuns(ulnaBuilt);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={-33.5} y1={-8} x2={-20.5} y2={0}>
          <stop offset={0} stopColor={C.boneLit} />
          <stop offset={0.3} stopColor={mix(C.boneLit, C.bone, 0.55)} />
          <stop offset={0.58} stopColor={C.bone} />
          <stop offset={0.84} stopColor={C.boneShade} />
          <stop offset={1} stopColor={mix(C.boneShade, C.boneDeep, 0.35)} />
        </linearGradient>
        <radialGradient id={`${id}-h`} gradientUnits="userSpaceOnUse" cx={-26} cy={-22} r={11} fx={-29} fy={-26}>
          <stop offset={0} stopColor={C.boneLit} stopOpacity={0.7} />
          <stop offset={1} stopColor={C.boneLit} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-c`}><path d={ULNA_D} /></clipPath>
      </defs>
      <path d={ULNA_D} fill={`url(#${id}-g)`} />
      <g clipPath={`url(#${id}-c)`}>
        <circle cx={-26} cy={-22} r={11} fill={`url(#${id}-h)`} />
        <path d={open([pt(-29.4, -6), pt(-29.0, 40), pt(-29.6, 120), pt(-30.2, 190)], 1)} stroke={C.boneLit} strokeWidth={2.2} fill="none" opacity={0.5 * detail} strokeLinecap="round" />
        {runs.map((rn, i) => <path key={i} d={open(rn, 0.5)} stroke={CARTILAGE} strokeWidth={1.3} fill="none" opacity={0.8} />)}
      </g>
      <path d={ULNA_D} fill="none" stroke={C.boneInk} strokeWidth={BONE_INK} strokeLinejoin="round" vectorEffect={NS} />
    </g>
  );
};

/** the ulna, carpals, metacarpals and phalanges (not the radius), back to front */
export const Skeleton: React.FC<{id: string; curl: number; thumb: number; detail?: number}> = ({id, curl, thumb, detail = 1}) => {
  const dt = clamp(detail);
  const h = handBones(curl, thumb);
  const ses = [-1, 1].map((k) => ({pts: ellipsePts(add(add(THUMB.head, mul(A1, -3.6)), mul(N1, 2.4 * k)), 1.3, 1.65, (Math.atan2(A1.y, A1.x) * 180) / Math.PI + 90, 20), art: new Array(20).fill(false)}));
  const order = ['lunate', 'scaphoid', 'capitate', 'trapezoid', 'trapezium', 'hamate', 'triquetrum'];
  return (
    <g>
      <Ulna id={`${id}-ul`} detail={dt} />
      {order.map((k) => <Compact key={k} id={`${id}-${k}`} b={built[k]} detail={dt} />)}
      <Compact id={`${id}-hook`} b={built.hook} detail={dt} shadow />
      <Compact id={`${id}-pis`} b={built.pisiform} detail={dt} shadow />
      <LongB id={`${id}-mc1`} b={h.mc1} detail={dt} />
      {h.mcs.map((b, i) => <LongB key={i} id={`${id}-mc${i + 2}`} b={b} detail={dt} />)}
      {ses.map((s, i) => <Compact key={i} id={`${id}-ses${i}`} b={s} detail={dt} shadow />)}
      <LongB id={`${id}-tp0`} b={h.tp0} detail={dt} />
      <LongB id={`${id}-tp1`} b={h.tp1} detail={dt} />
      {h.phal.map((row, k) => row.map((b, i) => <LongB key={`${k}_${i}`} id={`${id}-p${k}${i}`} b={b} detail={dt} />))}
    </g>
  );
};
