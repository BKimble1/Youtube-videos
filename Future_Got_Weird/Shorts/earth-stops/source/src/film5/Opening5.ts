import {SidePose, sideFK, THIGH, SHIN} from '../v2/side';
import {GSY, SC} from '../v2/choreo2';
import {E} from '../lib/motion';
import {T} from './timeline5';

/**
 * V5 opening street shot (f20-48): a grounded step becomes loss of footing. Pure functions of the frame (no React) so the picture, the cue builder and the probe read the same numbers.
 *
 * World/camera: the camera rides east with her at CAM_V world px per frame (her momentum is retained; the ground is what stopped), so her hip stays on screen at HERO_X while the pavement streams left.
 * The near foot (legN) is PINNED to the pavement in world coordinates for U_REL frames: heel strike -> flat -> toe, solved with a two-bone IK from the hip to the ankle that puts the lowest point of the
 * shoe on the ground at the pinned contact point. The leg compresses as the body passes over it and is pulled to full extension; the foot is then dragged off the pavement (a scuff mark stays on the ground).
 * After the release she is ballistic: a short parabola (a little vault velocity, then gravity), never a launch from the floor.
 */
export const HERO_X = 330;
export const Z1 = 1.18;
export const CAM_V = 32;                                 // world px per frame
export const U_REL = 6;                                  // frames since the cut at which the supporting foot loses contact (f26)
const rad = (d: number) => (d * Math.PI) / 180;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
type Leg = {h: number; k: number; f?: number};
type Arm = {s: number; e: number};

export const zoomP1 = (f: number) => lerp(Z1, 1.4, E.inOut(clamp01((f - T.cutStreet - 10) / 18)));
export const camP1 = (f: number) => 900 + CAM_V * (f - T.cutStreet);
export const heroWorldX = (f: number) => camP1(f) + (HERO_X - 540) / zoomP1(f);

/** piecewise-linear keyframe table {u: value} sampled with a smoothstep between keys */
const tab = (ks: [number, number][], u: number) => {
  if (u <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) if (u <= ks[i + 1][0]) return lerp(ks[i][1], ks[i + 1][1], smooth((u - ks[i][0]) / (ks[i + 1][0] - ks[i][0])));
  return ks[ks.length - 1][1];
};

/* ------------------------------------------------------------------ stance: the pinned near foot */
const FOOT_ANG: [number, number][] = [[0, 12], [1, 8], [2, 2], [3, 0], [4, 0], [5, -4], [6, -10], [7, -16]];                  // + = toes up
const HIP_H: [number, number][] = [[0, 260], [1, 246], [2, 230], [3, 220], [4, 218], [5, 224], [6, 234], [7, 242]];            // hip height above the pavement at z = 1.18 (px)
const CONTACT_AHEAD = 110;                               // the heel strike is this far ahead of the hip (screen px at z = 1.18)
const footExt = (fd: number, sc: number) => {            // lowest point of the shoe ellipse (rx 34, ry 14, rotated by the foot angle) relative to its centre
  const a = rad(fd); let best = {x: 0, y: -1e9};
  for (let i = 0; i < 72; i++) { const th = (i / 72) * Math.PI * 2, ex = 34 * Math.cos(th), ey = 14 * Math.sin(th); const x = ex * Math.cos(a) + ey * Math.sin(a), y = -ex * Math.sin(a) + ey * Math.cos(a); if (y > best.y) best = {x, y}; }
  return {x: best.x * sc, y: best.y * sc};
};
/** screen x of the pinned contact point at frame offset u (z is constant over the stance) */
export const contactScreenX = (u: number) => HERO_X + CONTACT_AHEAD - CAM_V * Z1 * u;
/** world x of the pinned contact (constant) */
export const CONTACT_WORLD_X = camP1(T.cutStreet) + (HERO_X + CONTACT_AHEAD - 540) / Z1;
const stanceLeg = (u: number) => {
  const sc = SC * Z1, f = tab(FOOT_ANG, u), hh = tab(HIP_H, u), hip = {x: HERO_X, y: GSY - hh};
  const ext = footExt(f, sc), S = {x: contactScreenX(u) - ext.x, y: GSY - ext.y};
  const A = {x: S.x - 13 * sc * Math.cos(rad(f)), y: S.y + 13 * sc * Math.sin(rad(f))};      // ankle: the shoe centre is 13 sc along the foot from the ankle
  const dx = A.x - hip.x, dy = A.y - hip.y, d = Math.hypot(dx, dy), L = THIGH * sc, reach = 2 * L;
  const dd = Math.min(d, reach * 0.9995);
  const k = 180 - (Math.acos(Math.max(-1, Math.min(1, 1 - (dd * dd) / (2 * L * L)))) * 180) / Math.PI;
  const phi = (Math.atan2(dx, dy) * 180) / Math.PI;
  return {leg: {h: phi + k / 2, k, f} as Leg, hip, ankle: A, ext: d / reach, shoe: S, hh};
};
export const stanceInfo = (u: number) => stanceLeg(Math.min(u, U_REL));

/* ------------------------------------------------------------------ acting keys (torso, head, arms, free leg, cup) */
type PKey = {u: number; tilt: number; pose: SidePose};
const mix = (a: SidePose, b: SidePose, k: number): SidePose => {
  const L = (x: number, y: number) => x + (y - x) * k;
  const arm = (p: Arm, q: Arm) => ({s: L(p.s, q.s), e: L(p.e, q.e)});
  const leg = (p: Leg, q: Leg) => ({h: L(p.h, q.h), k: L(p.k, q.k), f: L(p.f ?? 0, q.f ?? 0)});
  return {
    lean: L(a.lean, b.lean), head: L(a.head, b.head), armN: arm(a.armN, b.armN), armF: arm(a.armF, b.armF), legN: leg(a.legN, b.legN), legF: leg(a.legF, b.legF),
    mouth: k < 0.5 ? a.mouth : b.mouth, brows: L(a.brows ?? 0.9, b.brows ?? 0.9), lookX: L(a.lookX ?? 1, b.lookX ?? 1), lookY: L(a.lookY ?? 0.1, b.lookY ?? 0.1),
    squint: L(a.squint ?? 0, b.squint ?? 0), mouthScale: L(a.mouthScale ?? 1, b.mouthScale ?? 1),
  };
};
export const PKEYS: PKey[] = [
  // a grounded step: upright, the cup upright, the near heel arriving, eyes on the pavement
  {u: 0, tilt: 5, pose: {lean: 6, head: 4, armN: {s: 28, e: 62}, armF: {s: -22, e: 18}, legN: {h: 20, k: 10, f: 12}, legF: {h: -28, k: 62, f: -24}, mouth: 'o', mouthScale: 0.65, brows: 0.7, lookX: 1, lookY: 0.9}},
  // the foot has caught: the torso keeps going, the free leg swings through to catch, the far arm counter-swings
  {u: 3, tilt: 8, pose: {lean: 13, head: 6, armN: {s: 34, e: 58}, armF: {s: -34, e: 20}, legN: {h: 20, k: 10, f: 0}, legF: {h: -10, k: 96, f: -20}, mouth: 'o', mouthScale: 0.8, brows: 0.9, lookX: 1, lookY: 0.7}},
  {u: 5, tilt: 24, pose: {lean: 26, head: 8, armN: {s: 54, e: 52}, armF: {s: 20, e: 30}, legN: {h: 20, k: 10, f: -4}, legF: {h: 14, k: 98, f: -12}, mouth: 'o', mouthScale: 1.0, brows: 1, lookX: 1, lookY: 0.4}},
  // balance breaks: the torso pitches, the near arm throws the cup out, the far arm flings up, the foot is pulled off the pavement
  {u: 7, tilt: 88, pose: {lean: 40, head: 9, armN: {s: 82, e: 38}, armF: {s: 104, e: 22}, legN: {h: -4, k: 40, f: -22}, legF: {h: 30, k: 104, f: -8}, mouth: 'o', mouthScale: 1.2, brows: 1, lookX: 1, lookY: 0.15}},
  {u: 9, tilt: 102, pose: {lean: 46, head: 10, armN: {s: 94, e: 30}, armF: {s: 124, e: 14}, legN: {h: -22, k: 56, f: -24}, legF: {h: 32, k: 96, f: -10}, mouth: 'o', mouthScale: 1.3, brows: 1, lookX: 1, lookY: 0.05}},
  {u: 12, tilt: 110, pose: {lean: 50, head: 10, armN: {s: 80, e: 32}, armF: {s: 136, e: 8}, legN: {h: -36, k: 62, f: -26}, legF: {h: 12, k: 84, f: -22}, mouth: 'o', mouthScale: 1.35, brows: 1, lookX: 1, lookY: 0.1}},
  {u: 18, tilt: 114, pose: {lean: 62, head: 12, armN: {s: 98, e: 24}, armF: {s: 152, e: 6}, legN: {h: -56, k: 70, f: -30}, legF: {h: -34, k: 76, f: -30}, mouth: 'o', mouthScale: 1.5, brows: 1, lookX: 1, lookY: -0.15}},
  {u: 23, tilt: 116, pose: {lean: 54, head: -2, armN: {s: 96, e: 30}, armF: {s: 96, e: 82}, legN: {h: -8, k: 84, f: -20}, legF: {h: -44, k: 92, f: -30}, mouth: 'o', mouthScale: 1.4, brows: 0.3, lookX: 1, lookY: 0, squint: 0.45}},
  {u: 28, tilt: 118, pose: {lean: 48, head: -6, armN: {s: 88, e: 36}, armF: {s: 104, e: 90}, legN: {h: -2, k: 100, f: -16}, legF: {h: -36, k: 104, f: -26}, mouth: 'o', mouthScale: 1.2, brows: 0.1, lookX: 1, lookY: 0, squint: 0.7}},
];
/** C1-continuous (Catmull-Rom) interpolation through the keys of one channel: limbs do not stop at every key */
export const crom = (us: number[], vs: number[], u: number) => {
  const n = us.length; if (u <= us[0]) return vs[0]; if (u >= us[n - 1]) return vs[n - 1];
  let i = 0; while (i < n - 2 && u > us[i + 1]) i++;
  const h = us[i + 1] - us[i], t = (u - us[i]) / h;
  const tan = (j: number) => { const a = Math.max(0, j - 1), b = Math.min(n - 1, j + 1); return (vs[b] - vs[a]) / (us[b] - us[a]); };
  const m0 = tan(i) * h, m1 = tan(i + 1) * h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * vs[i] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * vs[i + 1] + (t3 - t2) * m1;
};
const US = PKEYS.map((k) => k.u);
const ch = (g: (p: SidePose) => number) => PKEYS.map((k) => g(k.pose));
const CH = {
  lean: ch((p) => p.lean), head: ch((p) => p.head), ans: ch((p) => p.armN.s), ane: ch((p) => p.armN.e), afs: ch((p) => p.armF.s), afe: ch((p) => p.armF.e),
  lnh: ch((p) => p.legN.h), lnk: ch((p) => p.legN.k), lnf: ch((p) => p.legN.f ?? 0), lfh: ch((p) => p.legF.h), lfk: ch((p) => p.legF.k), lff: ch((p) => p.legF.f ?? 0),
  brows: ch((p) => p.brows ?? 0.9), lookY: ch((p) => p.lookY ?? 0.1), ms: ch((p) => p.mouthScale ?? 1), squint: ch((p) => p.squint ?? 0), tilt: PKEYS.map((k) => k.tilt),
};
export const keyAt = (u: number) => {
  const c = (a: number[]) => crom(US, a, Math.max(0, Math.min(US[US.length - 1], u)));
  const pose: SidePose = {lean: c(CH.lean), head: c(CH.head), armN: {s: c(CH.ans), e: c(CH.ane)}, armF: {s: c(CH.afs), e: c(CH.afe)}, legN: {h: c(CH.lnh), k: c(CH.lnk), f: c(CH.lnf)}, legF: {h: c(CH.lfh), k: c(CH.lfk), f: c(CH.lff)},
    mouth: 'o', mouthScale: c(CH.ms), brows: Math.max(-1, Math.min(1, c(CH.brows))), lookX: 1, lookY: c(CH.lookY), squint: Math.max(0, Math.min(1, c(CH.squint)))};
  return {pose, tilt: Math.max(0, c(CH.tilt))};
};

/* ------------------------------------------------------------------ the figure */
const V0 = 7.5, G = 0.55;                                   // vault velocity (px/frame at z = 1) and gravity once the foot has left the pavement
/** height of the body above its stance height (rig px at z = 1): zero until the foot is off the pavement, then a parabola */
export const liftP1 = (fr: number) => { const tau = Math.max(0, fr - T.cutStreet - U_REL); return V0 * tau - 0.5 * G * tau * tau; };
export const poseP1 = (fr: number): SidePose => {
  const u = fr - T.cutStreet, base = keyAt(u).pose, k = keyAt(u - 3).pose;
  const fl = Math.sin(u * 0.9) * clamp01((u - 6) / 6) * 4;
  let legN: Leg = base.legN;
  if (u <= U_REL + 4) {
    const st = stanceLeg(Math.min(u, U_REL)).leg, w = smooth((u - U_REL) / 4);
    legN = {h: lerp(st.h, base.legN.h, w), k: lerp(st.k, base.legN.k, w), f: lerp(st.f ?? 0, base.legN.f ?? 0, w)};
  }
  return {...base, legN, armN: {s: base.armN.s + fl, e: base.armN.e}, armF: {s: base.armF.s - (u < 20 ? fl : 0), e: base.armF.e}, legF: {...base.legF, k: base.legF.k - fl * 0.8},
    bun: Math.max(-34, Math.min(34, -1.5 * (base.lean - k.lean) - 3 * clamp01(u / 8) * Math.sin(u * 0.8)))};
};
export const hipP1 = (fr: number, z: number) => {
  const u = fr - T.cutStreet, st = stanceLeg(Math.min(u, U_REL)), s = z / Z1;
  return {x: HERO_X, y: GSY - (st.hh / Z1 + liftP1(fr)) * z + (u > U_REL ? 0 : 0) * s};
};
export const footBottomY = (fr: number, z: number) => { const fk = sideFK(poseP1(fr), hipP1(fr, z), SC * z); return {n: fk.shoeN.y + 14 * SC * z, f: fk.shoeF.y + 14 * SC * z}; };
/** the scuff left on the pavement when the foot is pulled off: world x range, grows over the 3 frames after the release */
export const scuffP1 = (fr: number) => { const u = fr - T.cutStreet; return {x0: CONTACT_WORLD_X - 6, len: 72 * smooth((u - (U_REL - 1)) / 4), on: u >= U_REL - 1}; };
void THIGH; void SHIN;
