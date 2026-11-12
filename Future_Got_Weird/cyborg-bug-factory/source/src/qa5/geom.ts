// Geometry for the V5 integrity checks: the insect's body as the same ellipsoids the renderer draws, oriented boxes
// (packs, gripper fingers, rubble), capsules (legs, arm links, rods), and simple inside / distance tests. Shared by
// the V4 (before) and V5 (after) audits so both are measured the same way.
import {add3, dot3, len3, lerp3, mul3, sub3, V3} from '../core/three';
import {Frame, pitchF, toL, toW} from '../core/frame';
import {HEAD_AX, PRONOTUM, Rig, RoachState, TERGITES, THORAX, VENTER} from '../roach/rig';

export type Ell = {F: Frame; a: V3; name: string};
/** the drawn body: venter, tergites, thorax plates, pronotum, head (as drawn by roach/draw.tsx) */
export const bodyElls = (R: Rig): Ell[] => {
  const st = R.st;
  const sc = st.scale ?? 1;
  const out: Ell[] = [];
  const plate = (P: {c: V3; a: V3; pitch: number}, name: string) => {
    const F = pitchF(st.body, P.pitch);
    out.push({F: {...F, o: toW(st.body, mul3(P.c, sc))}, a: mul3(P.a, sc), name});
  };
  out.push({F: {...st.body, o: toW(st.body, mul3(VENTER.c, sc))}, a: mul3(VENTER.a, sc), name: 'venter'});
  TERGITES.forEach((P, i) => plate(P, `tergite${i + 1}`));
  THORAX.forEach((P, i) => plate(P, i ? 'metanotum' : 'mesonotum'));
  plate(PRONOTUM, 'pronotum');
  out.push({F: {...R.head, o: R.headC}, a: mul3(HEAD_AX, sc), name: 'head'});
  return out;
};
/** normalised radius of p in an ellipsoid (< 1 inside) */
export const ellR = (E: Ell, p: V3) => {
  const q = toL(E.F, p);
  return Math.hypot(q[0] / E.a[0], q[1] / E.a[1], q[2] / E.a[2]);
};
/** approximate penetration depth (mm) of p into an ellipsoid (0 if outside) */
export const ellDepth = (E: Ell, p: V3) => {
  const r = ellR(E, p);
  return r >= 1 ? 0 : (1 - r) * Math.min(E.a[0], E.a[1], E.a[2]);
};
/** top of the body (highest drawn surface) above body-local (x, y), in body-local z; -inf if nothing there */
export const bodyTopLocal = (st: RoachState, R: Rig, x: number, y: number): number => {
  let best = -1e9;
  for (const E of bodyElls(R)) {
    if (E.name === 'head') continue;
    // search down from above along the body's up axis
    for (let z = 20; z > -2; z -= 0.02) {
      const p = toW(st.body, [x, y, z]);
      if (ellR(E, p) < 1) { best = Math.max(best, z); break; }
    }
  }
  return best;
};

export type Box = {F: Frame; h: V3; name: string};
export const boxDepth = (B: Box, p: V3) => {
  const q = toL(B.F, p);
  const d = [B.h[0] - Math.abs(q[0]), B.h[1] - Math.abs(q[1]), B.h[2] - Math.abs(q[2])];
  return Math.min(...d) > 0 ? Math.min(...d) : 0;
};
export const boxPts = (B: Box, n = 4): V3[] => {
  const pts: V3[] = [];
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) for (let k = 0; k <= n; k++) {
    if (i % n && j % n && k % n) continue; // surface only
    pts.push(toW(B.F, [B.h[0] * (2 * i / n - 1), B.h[1] * (2 * j / n - 1), B.h[2] * (2 * k / n - 1)]));
  }
  return pts;
};
export type Cap = {a: V3; b: V3; r: number; name: string};
export const capPts = (C: Cap, n = 8): V3[] => Array.from({length: n + 1}, (_, i) => lerp3(C.a, C.b, i / n));
export const segDist = (p: V3, a: V3, b: V3) => {
  const ab = sub3(b, a);
  const t = Math.max(0, Math.min(1, dot3(sub3(p, a), ab) / (dot3(ab, ab) || 1)));
  return len3(sub3(p, add3(a, mul3(ab, t))));
};
/** the insect's legs as capsules (coxa excluded: it sits in the body) */
export const legCaps = (R: Rig): Cap[] => R.legs.flatMap((L) => [
  {a: L.troch, b: L.knee, r: 1.2, name: `femur${L.i}`},
  {a: L.knee, b: L.ankle, r: 0.8, name: `tibia${L.i}`},
  {a: L.ankle, b: L.foot, r: 0.4, name: `tarsus${L.i}`},
]);
export const antPts = (R: Rig): V3[] => R.ants.flatMap((a) => a.pts);
export const fmt = (n: number, d = 2) => Number(n.toFixed(d));
