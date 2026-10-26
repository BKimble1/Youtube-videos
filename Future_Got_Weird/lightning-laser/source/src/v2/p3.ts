// V2: one small 3D model of the experiment, so every perspective view (low angle, beneath the tower, the tip close-up,
// the side view, the telescope's view) shows the same geometry. It is derived from the V1 site (world/site.ts):
// site pixels -> metres with X to the right, Y up, Z away from the V1 camera; the tower stands at X = Z = 0, the
// beam and the bolt's guided section lie in the plane Z = 0. Drawing stays flat 2D ink and fills (see Tower3D,
// Bolt3D); only positions are projected.
import {hash, noise1} from '../dc/math';
import {axisPt, BOLT, EXIT_H, G, TIP, TOWER_BASE_Y} from '../world/site';

export type V3 = {x: number; y: number; z: number};
export const v3 = (x: number, y: number, z: number): V3 => ({x, y, z});
export const add3 = (a: V3, b: V3): V3 => ({x: a.x + b.x, y: a.y + b.y, z: a.z + b.z});
export const sub3 = (a: V3, b: V3): V3 => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
export const mul3 = (a: V3, s: number): V3 => ({x: a.x * s, y: a.y * s, z: a.z * s});
export const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross3 = (a: V3, b: V3): V3 => ({x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x});
export const len3 = (a: V3) => Math.sqrt(dot3(a, a));
export const norm3 = (a: V3) => mul3(a, 1 / (len3(a) || 1));
export const lerp3 = (a: V3, b: V3, t: number): V3 => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t});

/** site px -> metres (the tower's 730 px are its 124 m) */
export const K = 124 / (TOWER_BASE_Y - TIP.y);
export const fromSite = (p: {x: number; y: number}, z = 0): V3 => ({x: (p.x - TIP.x) * K, y: (TOWER_BASE_Y - p.y) * K, z});
export const TIP3 = fromSite(TIP);
export const axis3 = (h: number): V3 => fromSite(axisPt(h));
export const EXIT3 = axis3(EXIT_H);
export const BEAM_DIR = norm3(sub3(axis3(100), axis3(0)));
export const GUIDED_TOP3 = axis3(G);

// ------------------------------------------------------------------ camera
export type Cam3 = {pos: V3; yaw: number; pitch: number; roll?: number; f: number; cx?: number; cy?: number};
export const basis = (c: Cam3) => {
  const ps = (c.yaw * Math.PI) / 180, ph = (c.pitch * Math.PI) / 180;
  const f = v3(Math.sin(ps) * Math.cos(ph), Math.sin(ph), Math.cos(ps) * Math.cos(ph));
  let r = v3(Math.cos(ps), 0, -Math.sin(ps));
  let u = cross3(f, r);
  const ro = ((c.roll ?? 0) * Math.PI) / 180;
  if (ro) {
    const r2 = add3(mul3(r, Math.cos(ro)), mul3(u, Math.sin(ro)));
    u = add3(mul3(u, Math.cos(ro)), mul3(r, -Math.sin(ro)));
    r = r2;
  }
  return {f, r, u};
};
export type Proj = {x: number; y: number; z: number; ok: boolean};
export const projector = (c: Cam3) => {
  const {f, r, u} = basis(c);
  const cx = c.cx ?? 540, cy = c.cy ?? 960;
  return (p: V3): Proj => {
    const d = sub3(p, c.pos);
    const z = dot3(d, f);
    const ok = z > 0.3;
    const zz = Math.max(z, 0.3);
    return {x: cx + (c.f * dot3(d, r)) / zz, y: cy - (c.f * dot3(d, u)) / zz, z, ok};
  };
};
/** look from a position at a target: yaw/pitch for the camera */
export const lookAt = (pos: V3, target: V3, f: number, roll = 0, cx?: number, cy?: number): Cam3 => {
  const d = sub3(target, pos);
  const yaw = (Math.atan2(d.x, d.z) * 180) / Math.PI;
  const pitch = (Math.atan2(d.y, Math.hypot(d.x, d.z)) * 180) / Math.PI;
  return {pos, yaw, pitch, roll, f, cx, cy};
};
export const lerpCam = (a: Cam3, b: Cam3, t: number): Cam3 => ({
  pos: lerp3(a.pos, b.pos, t), yaw: a.yaw + (b.yaw - a.yaw) * t, pitch: a.pitch + (b.pitch - a.pitch) * t,
  roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * t, f: Math.exp(Math.log(a.f) + (Math.log(b.f) - Math.log(a.f)) * t),
});

// ------------------------------------------------------------------ the tower (metres)
const s = (px: number) => px * K;
export const TW = {
  plinthTop: s(34), plinthR: s(48),
  shaftTop: (TOWER_BASE_Y - 1040) * K, shaftR0: s(34), shaftR1: s(24),
  ring1: {y: (TOWER_BASE_Y - 1160) * K, r: s(74), h: s(20)},
  ring2: {y: (TOWER_BASE_Y - 1050) * K, r: s(58), h: s(16)},
  mastTop: (TOWER_BASE_Y - 768) * K, mastW0: s(18), mastW1: s(7), bays: 9,
  rodTop: TIP3.y,
};

// ------------------------------------------------------------------ the bolt in 3D
export type P3 = V3 & {s: number};
export type Br3 = {pts: P3[]; s0: number; len: number};
/** the V1 path lifted into 3D: the guided section stays on the beam (Z = 0); past it the path wanders in depth, and
 *  each branch leaves the plane at its own angle, so perspective views see real branching rather than a flat fork */
export const BOLT3 = (() => {
  const gi = BOLT.pts.findIndex((p) => p.s >= BOLT.guidedS);
  const pts: P3[] = BOLT.pts.map((p, i) => {
    const past = i > gi ? (p.s - BOLT.guidedS) : 0;
    const z = past > 0 ? 9 * noise1(past / 60, 71) + 0.04 * past * Math.sin(past / 140) : 0;
    return {...fromSite(p, z), s: p.s * K};
  });
  const branches: Br3[] = BOLT.branches.map((b, bi) => {
    const zDir = (hash(bi, 81) - 0.5) * 2;
    const base = pts.find((q) => q.s >= b.s0 * K) ?? pts[pts.length - 1];
    return {
      s0: b.s0 * K,
      len: b.len * K,
      pts: b.pts.map((q, k) => {
        const f = fromSite(q, base.z + zDir * q.s * K * 0.55);
        return {...f, s: q.s * K};
      }),
    };
  });
  // short stalled streamers along the guided section and at the rod tip (they light while the leader passes)
  const streamers: (Br3 & {at: number})[] = [];
  for (let k = 0; k < 16; k++) {
    const h = 4 + k * 18.5 + 9 * hash(k, 91);
    const base = pts.find((q) => q.s >= h * K) ?? pts[0];
    const side = k % 2 ? 1 : -1;
    const n = 3 + Math.floor(hash(k, 93) * 3);
    const bp: P3[] = [{...base, s: 0}];
    let q = base, acc = 0;
    for (let m = 0; m < n; m++) {
      const L = (1.8 + 3.2 * hash(k * 7 + m, 95)) * (k < 2 ? 0.7 : 1);
      const ang = side * (40 + 35 * hash(k * 11 + m, 97));
      const a = (ang * Math.PI) / 180;
      const dz = (hash(k * 13 + m, 99) - 0.5) * 2.2;
      const nq = {x: q.x + Math.sin(a) * L, y: q.y + Math.cos(a) * L * 0.6, z: q.z + dz};
      acc += Math.hypot(nq.x - q.x, nq.y - q.y, nq.z - q.z);
      bp.push({...nq, s: acc});
      q = {...nq, s: acc};
    }
    streamers.push({pts: bp, s0: base.s, len: acc, at: base.s});
  }
  return {pts, branches, streamers, guidedS: BOLT.guidedS * K, total: pts[pts.length - 1].s};
})();
