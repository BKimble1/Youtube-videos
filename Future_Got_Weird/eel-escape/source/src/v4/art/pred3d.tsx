// V4 package P: THE predator (a dark sleeper, Odontobutis obscura) as ONE 3D model, drawn through any camera
// (v4/three.ts Basis), so every exterior shot shows the same animal: the rear three-quarter behind the cheek (S1),
// the side view gulping (S2), over the back (S8), tight on the gill edge (S9), low beside (S10), far away (S11).
//
// How it is built (Weird Crew finish, like V3 art/fish.tsx, not a faceted mesh):
// - The body is a loft along x of superellipse sections: the V3 dorsal and ventral profiles (anatomy.ts BODY, as the
//   same Catmull-Rom curve fish.tsx draws) for the top and bottom, a half-width profile (a broad, slightly depressed
//   head, 7.5 u at the cheeks; a compressed tail), a flat belly. Every surface point is a pure function of (x, ψ)
//   (ψ = angle round the section: 0 the back, π/2 the near side, π the belly), then the mouth and the bend deform it.
// - Each piece (the near and far halves of the body, the dropped lower jaw, the two gill covers) is sampled on a grid
//   that adapts to the camera (≈ 8 px cells on screen, coarse off screen), with world normals from the analytic
//   surface (so nothing depends on the grid). Every region painted on the skin (the pigment steps from the dark back to
//   the pale belly, the saddles and blotches, the lips, the shadow and light bands, the wet highlight, the rim light)
//   is the set {field ≥ 0} ∩ {N·V ≥ 0}: a smooth scalar field on the surface (pigment height, a blob field, N·L with
//   the key light FIXED IN CAMERA SPACE at the upper left and a little in front, N·H), extracted with oriented
//   marching squares and drawn as smoothed polygons. So band edges are smooth curves that follow the form, the
//   markings stay fixed to the body, and the far side is never drawn through the near side.
// - The ink silhouette is the part of each piece's visible-region boundary that lies on the limb (N·V = 0): one
//   clean line round the union; seams between pieces are never inked.
// - Gill cover: a plate on the cheek between the preopercle and OPERCLE_EDGE; `gill` lifts its rear edge outward
//   about the front hinge (up to 3.5 u near the top), swinging it a little forward; behind it, the dark red opening
//   with a fringe of filaments. The near edge passes through EXIT at rest.
// - Mouth: the lower jaw is its own piece below the V3 cleft, rotated down about the mouth corner (with the throat
//   following smoothly and widening); the gape shows a dark pharynx with pink lips inside.
// - Fins: the V3 fin designs (fish.tsx finsFor, so the side view matches exactly) lifted into 3D planes: the median
//   fins in the mid-plane (following the bend), the paired fins splayed from the flank; translucent amber
//   membranes, rays, spots, ink. Depth order: far paired fins, far half (with its cover and eye), median fins, near
//   half, near cover, near eye, near paired fins (the caudal fin moves in front when the camera is behind the tail).
import React from 'react';
import {BODY, DORSAL, EXIT, EYE, OPERCLE_EDGE, PECTORAL, PELVIC, PHARYNX, PREOPERCLE} from '../../anatomy';
import {closed, P, pt} from '../../core/geo';
import {lit, mix, shade} from '../../core/color';
import {uid} from '../../core/ids';
import {clamp, hash, lerp} from '../../lib';
import {C, INK, INK_PX, NS} from '../../art/palette';
import {EDGE_REST, Fin, finsFor, FishLook, sampleCurve} from '../../art/fish';
import {Basis, V3, add3, cross3, dot3, len3, mul3, norm3, proj, sub3} from '../three';

// ================================================================ API types
export type PredPose = {t: number; gill: number; mouth: number; bend: number; finPhase: number; startle: number; look: V3 | null};
/** at rest: cover closed (its near edge through EXIT), mouth shut, body straight */
export const PRED_REST: PredPose = {t: 0, gill: 0, mouth: 0, bend: 0, finPhase: 0, startle: 0, look: null};

// ================================================================ constants and colours
const D2R = Math.PI / 180;
/** the mouth corner (end of the V3 cleft): the lower jaw's hinge */
const X_C = -41.3;
/** the bend pivots just behind the gill cover, so the head (and EXIT) never move */
const XP = -21;
const X_END = 34.6;
/** target on-screen cell size of the sampling grids (px) */
const CELL = 8;
const EPS_PSI = 0.045;
/** the cover lift at gill = 1 (u), and how far the lifted edge swings forward per unit of lift */
const LIFT_MAX = 3.5;
const LIFT_FWD = 0.22;

const WARM = lit(C.fishBelly, 0.62);
const GLOSS = lit(C.mote, 0.7);
const DEEP = C.pupil;
const SHADOW = mix(INK, C.fishDark, 0.42);
const BOUNCE = lit(C.sand, 0.35);
const LIP_UP = mix(C.fishCheek, C.fishBelly, 0.3);
const LIP_LO = mix(C.fishCheek, C.fishBelly, 0.5);
const GAPE = mix(C.gillDark, DEEP, 0.5);
const GAPE_IN = mix(C.pharynx, C.gillDark, 0.25);
const COVER_INNER = mix(C.fishLip, C.pharynx, 0.4);
const MARGIN = lit(C.fishCheek, 0.35);

// tags of region boundaries (marching squares): what the outside vertex was
const LIMB = 1, SEAM = 2, LIP = 3, HINGE = 4, EDGE = 5;

// ================================================================ small helpers
const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const fx = (n: number) => (Math.round(n * 10) / 10).toString();
const spow = (v: number, e: number) => (v >= 0 ? Math.pow(v, e) : -Math.pow(-v, e));
type S2 = {x: number; y: number};

/** monotone cubic (Fritsch–Carlson) through knots */
const pchip = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d = xs.slice(0, -1).map((x, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - x));
  const m = xs.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], s = (x - xs[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * m[i + 1];
  };
};

// ================================================================ the body profiles (the same curve fish.tsx draws)
const BODY_S = sampleCurve(BODY, 1, 16, true);
const NBS = BODY_S.length;
const IL = BODY_S.reduce((b, p, i) => (p.x < BODY_S[b].x ? i : b), 0);
const chain = (step: 1 | -1, end: number) => {
  const out: P[] = [];
  for (let k = IL; ; k = (k + step + NBS) % NBS) {
    const p = BODY_S[k];
    out.push(out.length ? pt(Math.max(p.x, out[out.length - 1].x + 1e-4), p.y) : p);
    if (k === end) break;
  }
  return out;
};
const UPPER = chain(1, (DORSAL.length - 1) * 16);
const LOWER = chain(-1, DORSAL.length * 16);
/** the snout's foremost point (the jutting lower lip) */
export const X_MIN = BODY_S[IL].x;
const Y_TIP = BODY_S[IL].y;
const profY = (ch: P[], x: number) => {
  if (x <= ch[0].x) return ch[0].y;
  if (x >= ch[ch.length - 1].x) return ch[ch.length - 1].y;
  let lo = 0, hi = ch.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (ch[m].x <= x) lo = m; else hi = m;
  }
  return lerp(ch[lo].y, ch[hi].y, (x - ch[lo].x) / (ch[hi].x - ch[lo].x));
};
/** half-width: broad head (7.5 u at the cheeks), 5.5 at mid-body, 3 at x = 25, 1.8 at the peduncle */
const WIDTH = pchip(
  [X_MIN, X_MIN + 0.3, -50.5, -50.0, -48.6, -46.0, -43.0, -40.0, -36.0, -31.0, -27.0, -23.0, -16.0, -8.0, 0.0, 10.0, 18.0, 25.0, 30.0, 33.0, 33.9, X_END],
  [0.0, 1.9, 3.0, 3.75, 4.75, 5.6, 6.25, 6.75, 7.15, 7.45, 7.42, 7.05, 6.55, 6.05, 5.5, 4.6, 3.75, 3.0, 2.3, 1.8, 1.2, 0.3],
);
/** the closed mouth's cleft (V3 fish.tsx CLEFT), snout tip → corner */
const CLEFT: P[] = [pt(-50.85, 0.2), pt(-48.6, 0.86), pt(-46.2, 1.5), pt(-43.7, 2.12), pt(-41.3, 2.66)];
const CLEFT_S = sampleCurve(CLEFT, 1, 10).map((p, i, a) => (i ? pt(Math.max(p.x, a[i - 1].x + 1e-4), p.y) : p));

// section table: top, bottom, widest level, half-width, upper/lower superellipse exponents, cleft y and cleft ψ
const SN = 1800;
const SDX = (X_END - X_MIN) / (SN - 1);
const T_TOP = new Float64Array(SN), T_BOT = new Float64Array(SN), T_YW = new Float64Array(SN), T_W = new Float64Array(SN);
const T_NT = new Float64Array(SN), T_NB = new Float64Array(SN), T_YC = new Float64Array(SN), T_PC = new Float64Array(SN);
type Sec = {top: number; bot: number; yw: number; w: number; nt: number; nb: number; yc: number; pc: number};
const yOnSec = (S: Sec, psi: number) => {
  const c = Math.cos(psi);
  return c >= 0 ? S.yw - (S.yw - S.top) * Math.pow(c, 2 / S.nt) : S.yw + (S.bot - S.yw) * Math.pow(-c, 2 / S.nb);
};
/** ψ on the near side (0..π) where the section reaches height y */
const psiForY = (S: Sec, y: number) => {
  let lo = 0, hi = Math.PI;
  if (y <= S.top) return 0;
  if (y >= S.bot) return Math.PI;
  for (let k = 0; k < 30; k++) {
    const m = (lo + hi) / 2;
    if (yOnSec(S, m) < y) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
};
for (let k = 0; k < SN; k++) {
  const x = X_MIN + k * SDX;
  const top = profY(UPPER, x), bot = profY(LOWER, x);
  const h = bot - top;
  T_TOP[k] = top;
  T_BOT[k] = bot;
  T_YW[k] = top + h * lerp(0.57, 0.5, sstep(-34, -5, x));
  T_W[k] = WIDTH(x);
  T_NT[k] = x < -30 ? lerp(2.85, 2.32, sstep(-40, -30, x)) : lerp(2.32, 2.15, sstep(-30, -10, x));
  T_NB[k] = x < 0 ? lerp(3.0, 2.6, sstep(-36, 0, x)) : lerp(2.6, 2.25, sstep(0, 33, x));
  let yc: number;
  if (x <= CLEFT[0].x) yc = lerp(Y_TIP, CLEFT[0].y, sstep(X_MIN, CLEFT[0].x, x));
  else if (x >= X_C) yc = CLEFT[CLEFT.length - 1].y + 0.2 * (x - X_C);
  else yc = profY(CLEFT_S, x);
  T_YC[k] = clamp(yc, top + 0.08 * h, bot - 0.08 * h);
  T_PC[k] = psiForY({top, bot, yw: T_YW[k], w: T_W[k], nt: T_NT[k], nb: T_NB[k], yc: 0, pc: 0}, T_YC[k]);
}
const SEC: Sec = {top: 0, bot: 0, yw: 0, w: 0, nt: 2, nb: 2, yc: 0, pc: 0};
const secAt = (x: number, S: Sec = SEC): Sec => {
  let f = (x - X_MIN) / SDX;
  f = f < 0 ? 0 : f > SN - 1 ? SN - 1 : f;
  const i = Math.min(SN - 2, Math.floor(f)), u = f - i;
  S.top = T_TOP[i] + (T_TOP[i + 1] - T_TOP[i]) * u;
  S.bot = T_BOT[i] + (T_BOT[i + 1] - T_BOT[i]) * u;
  S.yw = T_YW[i] + (T_YW[i + 1] - T_YW[i]) * u;
  S.w = T_W[i] + (T_W[i + 1] - T_W[i]) * u;
  S.nt = T_NT[i] + (T_NT[i + 1] - T_NT[i]) * u;
  S.nb = T_NB[i] + (T_NB[i + 1] - T_NB[i]) * u;
  S.yc = T_YC[i] + (T_YC[i + 1] - T_YC[i]) * u;
  S.pc = T_PC[i] + (T_PC[i + 1] - T_PC[i]) * u;
  return S;
};
/** the body's top / bottom edge and the cleft height at x (side-view coordinates) */
export const predTopY = (x: number) => secAt(x).top;
export const predBotY = (x: number) => secAt(x).bot;
const cleftY = (x: number) => secAt(x).yc;
const HX = X_C, HY = CLEFT[CLEFT.length - 1].y;

/** rest surface point at (x, ψ) */
const restAt = (x: number, psi: number, out: number[]) => {
  const S = secAt(x);
  const c = Math.cos(psi), s = Math.sin(psi);
  if (c >= 0) {
    const e = 2 / S.nt;
    out[1] = S.yw - (S.yw - S.top) * Math.pow(c, e);
    out[2] = S.w * spow(s, e);
  } else {
    const e = 2 / S.nb;
    out[1] = S.yw + (S.bot - S.yw) * Math.pow(-c, e);
    out[2] = S.w * spow(s, e);
  }
  out[0] = x;
  return out;
};

// ================================================================ deformation: the mouth (jaw drop, throat) and the bend
type Def = {mouth: number; phi: number; bx: Float64Array; bz: Float64Array; ba: Float64Array; bendOn: boolean};
const BSTEP = 0.25;
const BN = Math.ceil((53 - XP) / BSTEP) + 2;
const makeDef = (pose: PredPose): Def => {
  const ba = new Float64Array(BN), bx = new Float64Array(BN), bz = new Float64Array(BN);
  let any = Math.abs(pose.bend) > 1e-5;
  for (let k = 0; k < BN; k++) {
    const x = XP + k * BSTEP;
    const q = clamp((x - XP) / (50 - XP), 0, 1.2);
    // the bend (total turn at the tail) grows toward the tail; a small idle sway travels down the body
    const sway = 0.035 * Math.sin(2 * Math.PI * (pose.t / 2.7) - (x - XP) / 15) * q;
    ba[k] = pose.bend * q * q + sway;
    if (Math.abs(sway) > 1e-6) any = true;
  }
  bx[0] = XP;
  for (let k = 1; k < BN; k++) {
    const a = (ba[k - 1] + ba[k]) / 2;
    bx[k] = bx[k - 1] + BSTEP * Math.cos(a);
    bz[k] = bz[k - 1] + BSTEP * Math.sin(a);
  }
  const mouth = clamp(pose.mouth, 0, 1);
  return {mouth, phi: mouth * 58 * D2R, bx, bz, ba, bendOn: any};
};
/** deform a rest point (x, y, z) → world (out). `jaw`: the point belongs to the lower jaw (in front of the corner) */
const deform = (D: Def, x: number, y: number, z: number, jaw: boolean, out: number[]) => {
  let X = x, Y = y, Z = z;
  if (D.mouth > 1e-4 && !jaw && x < X_C) {
    // the upper lip lifts a little as the jaws part (the snout top and the eye stay)
    const dx = x - HX, dy = y - HY;
    if (y <= cleftY(x)) {
      const al = Math.atan2(dy, -dx) / D2R;
      const w = 1 - sstep(-12, -75, al);
      if (w > 0) {
        const ang = -D.phi * 0.12 * w, ca = Math.cos(ang), sa = Math.sin(ang);
        X = HX + dx * ca + dy * sa;
        Y = HY - dx * sa + dy * ca;
      }
    }
  }
  if (D.mouth > 1e-4 && x < X_C + 16 && (jaw || x >= X_C)) {
    const d = y - cleftY(x);
    if (jaw || d > 0) {
      // the lower jaw opens like a fan about the mouth corner: fully in front, not at all behind/below the hinge, so
      // the jaw drops like a door and the throat under the corner follows without folding
      const dx = x - HX, dy = y - HY;
      const al = Math.atan2(dy, -dx) / D2R;
      const w = 1 - sstep(15, 125, al);
      if (w > 0) {
        const ang = D.phi * w, ca = Math.cos(ang), sa = Math.sin(ang);
        X = HX + dx * ca + dy * sa;
        Y = HY - dx * sa + dy * ca;
        Z *= 1 + 0.14 * D.mouth * w;
      }
    }
    if (d > 0) {
      // the floor of the mouth and the throat drop and widen (buccal expansion)
      const tb = sstep(X_C - 7, X_C - 1, x) * (1 - sstep(X_C + 4, X_C + 15, x));
      if (tb > 0) {
        const S = secAt(x);
        const k = clamp(d / Math.max(0.5, S.bot - S.yc));
        Y += D.mouth * 1.6 * tb * k;
        Z *= 1 + 0.07 * D.mouth * tb * k;
      }
    }
  }
  if (D.bendOn && x > XP) {
    let f = (x - XP) / BSTEP;
    if (f > BN - 1.001) f = BN - 1.001;
    const i = Math.floor(f), u = f - i;
    const a = D.ba[i] + (D.ba[i + 1] - D.ba[i]) * u;
    const cx = D.bx[i] + (D.bx[i + 1] - D.bx[i]) * u, cz = D.bz[i] + (D.bz[i + 1] - D.bz[i]) * u;
    const ex = x - (XP + f * BSTEP); // beyond the table (never in practice)
    X = cx + ex - Math.sin(a) * Z;
    Z = cz + Math.cos(a) * Z;
  }
  out[0] = X;
  out[1] = Y;
  out[2] = Z;
  return out;
};
/** world point of a rest point (fins, eye, marks): the bend only (none of these are on the jaw) */
const bendPt = (D: Def, p: V3): V3 => {
  const o = [0, 0, 0];
  deform(D, p[0], p[1], p[2], false, o);
  return [o[0], o[1], o[2]];
};

// ================================================================ the camera-space light
type Cam = {B: Basis; L: V3; eye: V3};
const camOf = (B: Basis): Cam => {
  // the key light: from the upper left of the SCREEN, 38° toward the viewer (the eel renderer's light, art/eelArt.tsx)
  const LL = Math.hypot(0.62, 0.78);
  const ce = Math.cos(38 * D2R), se = Math.sin(38 * D2R);
  const L = norm3(add3(add3(mul3(B.r, (-0.62 / LL) * ce), mul3(B.u, (0.78 / LL) * ce)), mul3(B.fw, -se)));
  return {B, L, eye: B.eye};
};

// ================================================================ grids (one per piece) and marching squares
type Grid = {
  ni: number;
  nj: number;
  sx: Float32Array; sy: Float32Array;
  wx: Float32Array; wy: Float32Array; wz: Float32Array;
  nx: Float32Array; ny: Float32Array; nz: Float32Array;
  nv: Float32Array; nl: Float32Array; nh: Float32Array;
  xr: Float32Array; yr: Float32Array; aux: Float32Array; lf: Float32Array;
  ok: Uint8Array;
  /** boundary tags: first row, last row, first col, last col, excluded across rows, excluded across cols */
  tg: number[];
};
const newGrid = (ni: number, nj: number, tg: number[]): Grid => {
  const n = ni * nj;
  const F = () => new Float32Array(n);
  return {ni, nj, sx: F(), sy: F(), wx: F(), wy: F(), wz: F(), nx: F(), ny: F(), nz: F(), nv: F(), nl: F(), nh: F(), xr: F(), yr: F(), aux: F(), lf: F(), ok: new Uint8Array(n).fill(1), tg};
};
/** project vertex k (world point and normal already set) and compute N·V, N·L, N·H */
const shadeVertex = (G: Grid, k: number, cam: Cam) => {
  const p: V3 = [G.wx[k], G.wy[k], G.wz[k]];
  const q = proj(cam.B, p);
  G.sx[k] = q.x;
  G.sy[k] = q.y;
  G.ok[k] = q.z < 0.4 || q.x < -900 || q.x > 1980 || q.y < -900 || q.y > 2820 ? 0 : 1;
  const vx = cam.eye[0] - p[0], vy = cam.eye[1] - p[1], vz = cam.eye[2] - p[2];
  const vl = Math.hypot(vx, vy, vz) || 1;
  const Vx = vx / vl, Vy = vy / vl, Vz = vz / vl;
  const nx = G.nx[k], ny = G.ny[k], nz = G.nz[k];
  G.nv[k] = nx * Vx + ny * Vy + nz * Vz;
  const L = cam.L;
  G.nl[k] = nx * L[0] + ny * L[1] + nz * L[2];
  const hx = L[0] + Vx, hy = L[1] + Vy, hz = L[2] + Vz, hl = Math.hypot(hx, hy, hz) || 1;
  G.nh[k] = (nx * hx + ny * hy + nz * hz) / hl;
};

type Loop = {x: number[]; y: number[]; tag: number[]};
let BUF_NEXT = new Int32Array(0), BUF_STAMP = new Int32Array(0), BUF_VIS = new Int32Array(0);
let BUF_X = new Float32Array(0), BUF_Y = new Float32Array(0), BUF_T = new Uint8Array(0), BUF_G = new Float32Array(0);
let STAMP = 1;
/** oriented marching squares on the padded grid (outside the grid counts as outside): closed loops of the region
 *  g ≥ 0, in screen px; with `tags`, each point records what bounds it there (LIMB / the grid's border tags) */
const contour = (G: Grid, g: Float32Array, tags: boolean): Loop[] => {
  const ni = G.ni, nj = G.nj, W2 = nj + 2, H2 = ni + 2;
  const nE = H2 * W2 * 2;
  if (BUF_NEXT.length < nE) {
    const nn = Math.ceil(nE * 1.5);
    BUF_NEXT = new Int32Array(nn);
    BUF_STAMP = new Int32Array(nn);
    BUF_VIS = new Int32Array(nn);
    BUF_X = new Float32Array(nn);
    BUF_Y = new Float32Array(nn);
    BUF_T = new Uint8Array(nn);
  }
  if (BUF_G.length < H2 * W2) BUF_G = new Float32Array(Math.ceil(H2 * W2 * 1.5));
  const gp = BUF_G;
  for (let I = 0; I < H2; I++) {
    for (let J = 0; J < W2; J++) {
      const i = I - 1, j = J - 1;
      gp[I * W2 + J] = i < 0 || j < 0 || i >= ni || j >= nj ? -1 : G.ok[i * nj + j] ? g[i * nj + j] : -1;
    }
  }
  const stamp = ++STAMP;
  const next = BUF_NEXT, st = BUF_STAMP, ex = BUF_X, ey = BUF_Y, et = BUF_T;
  const starts: number[] = [];
  const vid = (I: number, J: number) => Math.min(ni - 1, Math.max(0, I - 1)) * nj + Math.min(nj - 1, Math.max(0, J - 1));
  // the crossing point on edge e (canonical endpoints a = (I, J), b = (I, J+1) or (I+1, J))
  const cross = (e: number) => {
    if (st[e] === stamp) return;
    st[e] = stamp;
    const v = e >> 1, I = Math.floor(v / W2), J = v - I * W2;
    const Ib = e & 1 ? I + 1 : I, Jb = e & 1 ? J : J + 1;
    const ga = gp[I * W2 + J], gb = gp[Ib * W2 + Jb];
    const t = ga / (ga - gb);
    const a = vid(I, J), b = vid(Ib, Jb);
    ex[e] = G.sx[a] + (G.sx[b] - G.sx[a]) * t;
    ey[e] = G.sy[a] + (G.sy[b] - G.sy[a]) * t;
    if (tags) {
      const outA = ga < 0;
      const Io = outA ? I : Ib, Jo = outA ? J : Jb;
      let tg = G.xr[outA ? vid(Ib, Jb) : vid(I, J)] > 32.7 ? SEAM : LIMB;
      if (Io === 0) tg = G.tg[0];
      else if (Io === H2 - 1) tg = G.tg[1];
      else if (Jo === 0) tg = G.tg[2];
      else if (Jo === W2 - 1) tg = G.tg[3];
      else if (!G.ok[(Io - 1) * nj + (Jo - 1)]) tg = e & 1 ? G.tg[4] : G.tg[5];
      et[e] = tg;
    }
  };
  const link = (a: number, b: number) => {
    cross(a);
    cross(b);
    next[a] = b;
    starts.push(a);
  };
  for (let I = 0; I < H2 - 1; I++) {
    for (let J = 0; J < W2 - 1; J++) {
      const g0 = gp[I * W2 + J], g1 = gp[I * W2 + J + 1], g2 = gp[(I + 1) * W2 + J + 1], g3 = gp[(I + 1) * W2 + J];
      const c = (g0 >= 0 ? 1 : 0) | (g1 >= 0 ? 2 : 0) | (g2 >= 0 ? 4 : 0) | (g3 >= 0 ? 8 : 0);
      if (c === 0 || c === 15) continue;
      const e0 = (I * W2 + J) * 2, e1 = (I * W2 + J + 1) * 2 + 1, e2 = ((I + 1) * W2 + J) * 2, e3 = (I * W2 + J) * 2 + 1;
      if (c === 5 || c === 10) {
        const inC = (g0 + g1 + g2 + g3) / 4 >= 0;
        if (c === 5) {
          if (inC) { link(e1, e0); link(e3, e2); } else { link(e3, e0); link(e1, e2); }
        } else {
          if (inC) { link(e0, e3); link(e2, e1); } else { link(e0, e1); link(e2, e3); }
        }
        continue;
      }
      // walk q0 → q1 → q2 → q3 → q0: one entry (out → in) and one exit (in → out)
      const b0 = c & 1, b1 = (c >> 1) & 1, b2 = (c >> 2) & 1, b3 = (c >> 3) & 1;
      let en = -1, xt = -1;
      if (b0 !== b1) { if (b0) xt = e0; else en = e0; }
      if (b1 !== b2) { if (b1) xt = e1; else en = e1; }
      if (b2 !== b3) { if (b2) xt = e2; else en = e2; }
      if (b3 !== b0) { if (b3) xt = e3; else en = e3; }
      link(en, xt);
    }
  }
  const vis = BUF_VIS;
  const loops: Loop[] = [];
  for (const s of starts) {
    if (vis[s] === stamp) continue;
    const L: Loop = {x: [], y: [], tag: []};
    let e = s, guard = 0;
    do {
      vis[e] = stamp;
      L.x.push(ex[e]);
      L.y.push(ey[e]);
      L.tag.push(et[e]);
      e = next[e];
    } while (e !== s && vis[e] !== stamp && ++guard < 200000);
    if (L.x.length >= 3) loops.push(L);
  }
  return loops;
};
const loopArea = (L: {x: number[]; y: number[]}) => {
  let a = 0;
  for (let i = 0, n = L.x.length; i < n; i++) {
    const j = (i + 1) % n;
    a += L.x[i] * L.y[j] - L.x[j] * L.y[i];
  }
  return a / 2;
};
/** Douglas–Peucker keep-flags for an open run [i0, i1] */
const dpMark = (xs: number[], ys: number[], i0: number, i1: number, tol: number, keep: Uint8Array) => {
  const st: number[] = [i0, i1];
  while (st.length) {
    const b = st.pop()!, a = st.pop()!;
    if (b - a < 2) continue;
    const ax = xs[a], ay = ys[a], dx = xs[b] - ax, dy = ys[b] - ay, l = Math.hypot(dx, dy) || 1e-9;
    let mx = -1, mi = -1;
    for (let i = a + 1; i < b; i++) {
      const dd = Math.abs((xs[i] - ax) * dy - (ys[i] - ay) * dx) / l;
      if (dd > mx) { mx = dd; mi = i; }
    }
    // keep a point at least every 40 px so the quadratics follow the curve
    if (mx > tol || Math.hypot(dx, dy) > 40) {
      keep[mi] = 1;
      st.push(a, mi, mi, b);
    }
  }
};
const simplify = (xs: number[], ys: number[], closedLoop: boolean, tol = 0.45) => {
  const n = xs.length;
  if (n < 4) return {px: xs, py: ys};
  const keep = new Uint8Array(n);
  keep[0] = 1;
  if (closedLoop) {
    let far = 0, fd = -1;
    for (let i = 1; i < n; i++) { const d = Math.hypot(xs[i] - xs[0], ys[i] - ys[0]); if (d > fd) { fd = d; far = i; } }
    keep[far] = 1;
    dpMark(xs, ys, 0, far, tol, keep);
    const xx = [...xs.slice(far), xs[0]], yy = [...ys.slice(far), ys[0]];
    const k2 = new Uint8Array(xx.length);
    dpMark(xx, yy, 0, xx.length - 1, tol, k2);
    for (let i = 1; i < xx.length - 1; i++) if (k2[i]) keep[far + i] = 1;
  } else {
    keep[n - 1] = 1;
    dpMark(xs, ys, 0, n - 1, tol, keep);
  }
  const px: number[] = [], py: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) { px.push(xs[i]); py.push(ys[i]); }
  return {px, py};
};
/** a smooth closed path through loop points (simplified, midpoint quadratics: never overshoots) */
const smoothLoop = (xs0: number[], ys0: number[], minD = 2.2): string => {
  const {px: xs, py: ys} = simplify(xs0, ys0, true);
  const px: number[] = [], py: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    if (px.length && Math.hypot(xs[i] - px[px.length - 1], ys[i] - py[py.length - 1]) < minD) continue;
    px.push(xs[i]);
    py.push(ys[i]);
  }
  while (px.length > 3 && Math.hypot(px[0] - px[px.length - 1], py[0] - py[py.length - 1]) < minD) { px.pop(); py.pop(); }
  const n = px.length;
  if (n < 3) return '';
  let d = `M${fx((px[n - 1] + px[0]) / 2)} ${fx((py[n - 1] + py[0]) / 2)}`;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    d += `Q${fx(px[i])} ${fx(py[i])} ${fx((px[i] + px[j]) / 2)} ${fx((py[i] + py[j]) / 2)}`;
  }
  return d + 'Z';
};
const smoothOpenPath = (xs0: number[], ys0: number[], minD = 2.2): string => {
  const {px: xs, py: ys} = simplify(xs0, ys0, false);
  const px: number[] = [], py: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    if (px.length && i < xs.length - 1 && Math.hypot(xs[i] - px[px.length - 1], ys[i] - py[py.length - 1]) < minD) continue;
    px.push(xs[i]);
    py.push(ys[i]);
  }
  const n = px.length;
  if (n < 2) return '';
  if (n === 2) return `M${fx(px[0])} ${fx(py[0])}L${fx(px[1])} ${fx(py[1])}`;
  let d = `M${fx(px[0])} ${fx(py[0])}L${fx((px[0] + px[1]) / 2)} ${fx((py[0] + py[1]) / 2)}`;
  for (let i = 1; i < n - 1; i++) d += `Q${fx(px[i])} ${fx(py[i])} ${fx((px[i] + px[i + 1]) / 2)} ${fx((py[i] + py[i + 1]) / 2)}`;
  return d + `L${fx(px[n - 1])} ${fx(py[n - 1])}`;
};
const loopsPath = (loops: Loop[], flip = 1) =>
  loops.map((L) => {
    const rev = Math.sign(loopArea(L)) * flip < 0;
    return rev ? smoothLoop([...L.x].reverse(), [...L.y].reverse()) : smoothLoop(L.x, L.y);
  }).join('');
/** open polylines of the loop runs whose tag is in `set` */
const tagRuns = (loops: Loop[], set: number[]): string => {
  let d = '';
  for (const L of loops) {
    const n = L.x.length;
    const on = L.tag.map((t) => set.includes(t));
    if (on.every(Boolean)) { d += smoothLoop(L.x, L.y); continue; }
    let s0 = on.findIndex((v) => !v);
    for (let k = 1; k <= n; k++) {
      const i = (s0 + k) % n;
      if (on[i] && !on[(i - 1 + n) % n]) {
        const xs: number[] = [], ys: number[] = [];
        // include the boundary points either side so the run reaches the corner
        let j = (i - 1 + n) % n;
        xs.push(L.x[j]); ys.push(L.y[j]);
        j = i;
        while (on[j]) { xs.push(L.x[j]); ys.push(L.y[j]); j = (j + 1) % n; if (j === i) break; }
        xs.push(L.x[j]); ys.push(L.y[j]);
        d += smoothOpenPath(xs, ys);
      }
    }
    s0 = 0;
  }
  return d;
};
/** the region {f ≥ 0} ∩ {N·V ≥ 0} of a grid as a path */
let REG_G = new Float32Array(0);
const regionD = (G: Grid, f: (k: number) => number, vis = 1): string => {
  const n = G.ni * G.nj;
  if (REG_G.length < n) REG_G = new Float32Array(Math.ceil(n * 1.5));
  const g = REG_G;
  let any = false;
  for (let k = 0; k < n; k++) {
    const a = f(k), b = G.nv[k] * vis;
    const v = a < b ? a : b;
    g[k] = v;
    if (v >= 0 && G.ok[k]) any = true;
  }
  return any ? loopsPath(contour(G, g, false)) : '';
};

// ================================================================ skin pattern fields (side-view coordinates, both sides)
type Blob = {cx: number; cy: number; rx: number; ry: number; ang: number; rough: number; h: number[]};
const mkBlob = (c: P, rx: number, ry: number, ang: number, seed: number, n: number, rough: number): Blob => ({
  cx: c.x, cy: c.y, rx, ry, ang, rough, h: Array.from({length: n}, (_, i) => hash(seed * 13.7 + i * 3.1) * 2 - 1),
});
/** signed blob field: > 0 inside (≈ 1 - normalised radius), with a smooth irregular rim */
const blobF = (b: Blob, x: number, y: number) => {
  const dx = x - b.cx, dy = y - b.cy;
  const ca = Math.cos(b.ang), sa = Math.sin(b.ang);
  const u = (dx * ca + dy * sa) / b.rx, v = (-dx * sa + dy * ca) / b.ry;
  const r = Math.hypot(u, v);
  if (r > 1 + b.rough + 0.3) return 1 - r;
  const n = b.h.length;
  let a = (Math.atan2(v, u) / (2 * Math.PI)) * n;
  if (a < 0) a += n;
  const i0 = Math.floor(a) % n, f = a - Math.floor(a);
  const w = f * f * (3 - 2 * f);
  const R = 1 + b.rough * (b.h[i0] * (1 - w) + b.h[(i0 + 1) % n] * w);
  return 1 - r / R;
};
/** dark saddles over the back (V3 SADDLES) and the flank blotches (V3 BLOTCHES) */
const SADDLES: Blob[] = (
  [[pt(-24.8, -10.2), 3.3, 6.4, 0.16], [pt(-10.2, -9.4), 4.3, 8.6, 0.17], [pt(4.6, -8.6), 4.0, 8.2, 0.2],
    [pt(17.6, -6.8), 3.5, 7.2, 0.22], [pt(28.6, -3.6), 2.6, 5.6, 0.12], [pt(-34.5, -11.6), 3.0, 3.2, 0.1]] as [P, number, number, number][]
).map(([c, rx, ry, a], i) => mkBlob(c, rx, ry, a, i + 1, 14, 0.24));
const BLOTCHES: Blob[] = (
  [[pt(-17.2, 1.4), 2.2, 1.6], [pt(-2.6, 2.4), 2.5, 1.8], [pt(11.4, 1.6), 2.2, 1.6], [pt(23.4, 0.9), 1.9, 1.4],
    [pt(-9.6, 6.6), 1.8, 1.3], [pt(4.6, 6.9), 2.0, 1.3], [pt(17.0, 5.0), 1.6, 1.2], [pt(30.6, 1.6), 1.3, 1.1],
    [pt(-24.0, 4.6), 1.3, 1.0], [pt(-4.0, -3.4), 1.5, 1.1], [pt(10.6, -2.6), 1.4, 1.0], [pt(-16.6, -4.4), 1.4, 1.0]] as [P, number, number][]
).map(([c, rx, ry], i) => mkBlob(c, rx, ry, 0.3 * (hash(i) - 0.5), i + 20, 9, 0.24));
/** blots on the gill cover (V3 Operculum) */
const COVER_BLOTS: Blob[] = (
  [[pt(-27.6, -8.4), 2.2, 2.4, 0.2], [pt(-31.2, -4.6), 1.7, 1.25, -0.2], [pt(-28.6, 2.6), 1.4, 1.05, 0.3],
    [pt(-33.2, 4.8), 1.15, 0.9, 0.1], [pt(-25.6, -2.2), 1.0, 0.8, 0.0]] as [P, number, number, number][]
).map(([c, rx, ry, a], i) => mkBlob(c, rx, ry, a, 41 + i, 10, 0.2));
const unionF = (bs: Blob[], x: number, y: number) => {
  let m = -1;
  for (const b of bs) {
    if (Math.abs(x - b.cx) > b.rx * 2.2 + b.ry || Math.abs(y - b.cy) > b.ry * 1.6 + b.rx) continue;
    const v = blobF(b, x, y);
    if (v > m) m = v;
  }
  return m;
};
/** small dark spots (V3 speckle and head spots): side-view positions and radii */
const SPOTS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  const top0 = (x: number) => profY(UPPER, x), bot0 = (x: number) => profY(LOWER, x);
  for (let i = 0; i < 90; i++) {
    const x = lerp(-47, 31, hash(i * 3.71 + 0.5));
    const top = top0(x), bot = bot0(x);
    const y = lerp(top + 0.7, top + (bot - top) * 0.62, hash(i * 5.13 + 1.7));
    if (Math.hypot(x - EYE.c.x, y - EYE.c.y) < 3.62) continue;
    if (x < -40 && y > -1) continue;
    out.push([x, y, lerp(0.14, 0.32, hash(i * 9.7))]);
  }
  ([[-46.6, -4.6, 0.42], [-44.2, -2.2, 0.5], [-46.0, -1.6, 0.34], [-42.0, -2.0, 0.36], [-39.2, -2.6, 0.44], [-43.4, -10.0, 0.34], [-37.6, -1.0, 0.32], [-41.6, 5.6, 0.36], [-44.6, 4.6, 0.3]] as [number, number, number][]).forEach((s) => out.push(s));
  return out;
})();

// pigment (cel): four tones by the height on the section v (0 the back, 1 the belly): the dark olive back, the
// olive-brown flank, the warm lower flank, the pale belly; one soft intermediate step at each boundary, and the
// boundaries wander a little along the body (pigment, not contour lines)
const TONE_BACK = mix(C.fishDark, C.fishBody, 0.42);
const TONE_FLANK = C.fishBody;
const TONE_LOW = mix(C.fishCheek, C.fishBelly, 0.32);
const PIG_BASE = mix(C.fishBelly, C.fishCheek, 0.12);
const wav = (x: number, a: number, b: number, k: number) => a * Math.sin(x / 3.3 + k) + b * Math.sin(x / 7.9 + 2.1 * k);
const PIG: {bound: (x: number) => number; col: string}[] = [
  {bound: (x) => 0.795 + wav(x, 0.012, 0.018, 1), col: mix(TONE_LOW, PIG_BASE, 0.5)},
  {bound: (x) => 0.765 + wav(x, 0.012, 0.018, 1), col: TONE_LOW},
  {bound: (x) => 0.585 + wav(x, 0.014, 0.025, 2), col: mix(TONE_FLANK, TONE_LOW, 0.5)},
  {bound: (x) => 0.55 + wav(x, 0.014, 0.025, 2), col: TONE_FLANK},
  {bound: (x) => 0.235 + wav(x, 0.02, 0.03, 3), col: mix(TONE_BACK, TONE_FLANK, 0.5)},
  {bound: (x) => 0.19 + wav(x, 0.02, 0.03, 3), col: TONE_BACK},
];
const vOf = (x: number, y: number) => {
  const S = secAt(x);
  return S.bot > S.top ? (y - S.top) / (S.bot - S.top) : 0.5;
};

// ================================================================ station and column placement (camera adaptive)
const onScr = (q: {x: number; y: number; z: number}, m = 180) => q.z > 0.4 && q.x > -m && q.x < 1080 + m && q.y > -m && q.y < 1920 + m;
const RING = [0, 0.8, 1.57, 2.36, 3.14, 3.93, 4.71, 5.5];
const TMP = [0, 0, 0], TMP2 = [0, 0, 0], TMP3 = [0, 0, 0];
/** cumulative on-screen arc (px) along a sampled parameter, coarse off screen */
const invertCum = (cum: Float64Array, M: number, n: number, map: (u: number) => number) => {
  const total = cum[M];
  const out: number[] = [];
  let k = 0;
  for (let i = 0; i < n; i++) {
    const target = (total * i) / (n - 1);
    while (k < M - 1 && cum[k + 1] < target) k++;
    const u = (target - cum[k]) / (cum[k + 1] - cum[k] || 1);
    out.push(map((k + clamp(u)) / M));
  }
  return out;
};
const pickStations = (cam: Cam, D: Def) => {
  const M = 240;
  const cum = new Float64Array(M + 1);
  let prev: {x: number; y: number; z: number}[] = [];
  const xAt = (u: number) => X_MIN + (X_END - X_MIN) * u;
  for (let k = 0; k <= M; k++) {
    const x = xAt(k / M);
    const cur = RING.map((psi) => {
      restAt(x, psi, TMP);
      deform(D, TMP[0], TMP[1], TMP[2], false, TMP2);
      return proj(cam.B, [TMP2[0], TMP2[1], TMP2[2]]);
    });
    if (k > 0) {
      let d = 0, on = false;
      for (let r = 0; r < RING.length; r++) {
        if (cur[r].z > 0.4 && prev[r].z > 0.4) d = Math.max(d, Math.hypot(cur[r].x - prev[r].x, cur[r].y - prev[r].y));
        if (onScr(cur[r])) on = true;
      }
      cum[k] = cum[k - 1] + Math.min(d, 400) * (on ? 1 : 0.05) + 0.05;
    }
    prev = cur;
  }
  const n = Math.round(clamp(cum[M] / CELL, 40, 190));
  const xs = invertCum(cum, M, n, xAt);
  let ic = 1;
  for (let i = 1; i < n - 1; i++) if (Math.abs(xs[i] - X_C) < Math.abs(xs[ic] - X_C)) ic = i;
  ic = Math.max(3, Math.min(n - 3, ic));
  xs[ic] = X_C;
  xs.splice(ic + 1, 0, X_C);
  for (let i = ic - 1; i >= 0; i--) xs[i] = Math.min(xs[i], xs[i + 1] - 0.004);
  for (let i = ic + 2; i < xs.length; i++) xs[i] = Math.max(xs[i], xs[i - 1] + 0.004);
  xs[0] = X_MIN;
  return {xs, ic};
};
/** columns s ∈ [0, 1] for a piece, adaptive; a duplicate column at `split` (the cleft) when given */
const pickCols = (cam: Cam, D: Def, xs: number[], psiOf: (x: number, s: number) => number, split: number, jaw: boolean, nMin: number, nMax: number) => {
  const M = 140;
  const probe = Array.from({length: 9}, (_, i) => xs[Math.round((i / 8) * (xs.length - 1))]);
  const cum = new Float64Array(M + 1);
  let prev: {x: number; y: number; z: number}[] = [];
  for (let k = 0; k <= M; k++) {
    const s = k / M;
    const cur = probe.map((x) => {
      restAt(x, psiOf(x, s), TMP);
      deform(D, TMP[0], TMP[1], TMP[2], jaw, TMP2);
      return proj(cam.B, [TMP2[0], TMP2[1], TMP2[2]]);
    });
    if (k > 0) {
      let d = 0, on = false;
      for (let r = 0; r < probe.length; r++) {
        if (cur[r].z > 0.4 && prev[r].z > 0.4) d = Math.max(d, Math.hypot(cur[r].x - prev[r].x, cur[r].y - prev[r].y));
        if (onScr(cur[r])) on = true;
      }
      cum[k] = cum[k - 1] + Math.min(d, 400) * (on ? 1 : 0.05) + 0.05;
    }
    prev = cur;
  }
  const n = Math.round(clamp(cum[M] / CELL, nMin, nMax));
  if (split < 0) return {ss: invertCum(cum, M, n, (u) => u), a: -1};
  const ks = Math.round(split * M);
  const n1 = Math.max(4, Math.round((n * cum[ks]) / cum[M])), n2 = Math.max(4, n - n1);
  const c1 = cum.slice(0, ks + 1), c2 = cum.slice(ks).map((v) => v - cum[ks]);
  const s1 = invertCum(c1, ks, n1, (u) => u * split);
  const s2 = invertCum(c2, M - ks, n2, (u) => split + u * (1 - split));
  s1[s1.length - 1] = split;
  s2[0] = split;
  return {ss: [...s1, ...s2], a: s1.length - 1};
};

// ================================================================ the body pieces
const S_A = 0.55; // near half: [top .. cleft] = s ∈ [0, S_A], [cleft .. belly] = [S_A, 1]
const S_B = 0.45; // far half: [belly .. cleft] = [0, S_B], [cleft .. top] = [S_B, 1]
const psiNear = (x: number, s: number) => {
  const pc = secAt(x).pc;
  return s <= S_A ? -EPS_PSI + (pc + EPS_PSI) * (s / S_A) : pc + (Math.PI + EPS_PSI - pc) * ((s - S_A) / (1 - S_A));
};
const psiFar = (x: number, s: number) => {
  const pc = secAt(x).pc;
  return s <= S_B ? Math.PI - EPS_PSI + (Math.PI - pc + EPS_PSI) * (s / S_B) : 2 * Math.PI - pc + (pc + EPS_PSI) * ((s - S_B) / (1 - S_B));
};
const psiJaw = (x: number, s: number) => {
  const pc = secAt(x).pc;
  return pc + s * (2 * Math.PI - 2 * pc);
};
/** fill a body vertex: world point, analytic normal (finite differences of the deformed surface), rest attributes */
const bodyVertex = (G: Grid, k: number, cam: Cam, D: Def, x: number, psi: number, jaw: boolean) => {
  restAt(x, psi, TMP);
  const yr = TMP[1];
  deform(D, TMP[0], TMP[1], TMP[2], jaw, TMP2);
  const P0x = TMP2[0], P0y = TMP2[1], P0z = TMP2[2];
  const hx = x + 0.012 <= X_END ? 0.012 : -0.012;
  restAt(x + hx, psi, TMP);
  deform(D, TMP[0], TMP[1], TMP[2], jaw, TMP3);
  const ax = (TMP3[0] - P0x) * Math.sign(hx), ay = (TMP3[1] - P0y) * Math.sign(hx), az = (TMP3[2] - P0z) * Math.sign(hx);
  const xq = Math.max(x, X_MIN + 0.03);
  restAt(xq, psi, TMP);
  deform(D, TMP[0], TMP[1], TMP[2], jaw, TMP3);
  const qx = TMP3[0], qy = TMP3[1], qz = TMP3[2];
  restAt(xq, psi + 0.003, TMP);
  deform(D, TMP[0], TMP[1], TMP[2], jaw, TMP3);
  const bx = TMP3[0] - qx, by = TMP3[1] - qy, bz = TMP3[2] - qz;
  let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
  const nl = Math.hypot(nx, ny, nz);
  if (nl < 1e-12) { nx = -1; ny = 0; nz = 0; } else { nx /= nl; ny /= nl; nz /= nl; }
  G.wx[k] = P0x; G.wy[k] = P0y; G.wz[k] = P0z;
  G.nx[k] = nx; G.ny[k] = ny; G.nz[k] = nz;
  G.xr[k] = x;
  G.yr[k] = yr;
  shadeVertex(G, k, cam);
};
type BodyGrids = {near: Grid; far: Grid; jaw: Grid | null; xs: number[]; ic: number; aN: number; bF: number; jawSS: number[]};
const buildBody = (cam: Cam, D: Def): BodyGrids => {
  const {xs, ic} = pickStations(cam, D);
  const ni = xs.length;
  const open = D.mouth > 0.01;
  const cn = pickCols(cam, D, xs, psiNear, S_A, false, 20, 110);
  const cf = pickCols(cam, D, xs, psiFar, S_B, false, 20, 110);
  const near = newGrid(ni, cn.ss.length, [SEAM, SEAM, SEAM, SEAM, SEAM, LIP]);
  const far = newGrid(ni, cf.ss.length, [SEAM, SEAM, SEAM, SEAM, SEAM, LIP]);
  for (let i = 0; i < ni; i++) {
    const x = xs[i];
    for (let j = 0; j < cn.ss.length; j++) {
      const k = i * cn.ss.length + j;
      bodyVertex(near, k, cam, D, x, psiNear(x, cn.ss[j]), false);
      if (open && i <= ic && j > cn.a) near.ok[k] = 0;
    }
    for (let j = 0; j < cf.ss.length; j++) {
      const k = i * cf.ss.length + j;
      bodyVertex(far, k, cam, D, x, psiFar(x, cf.ss[j]), false);
      if (open && i <= ic && j <= cf.a) far.ok[k] = 0;
    }
  }
  let jaw: Grid | null = null, jawSS: number[] = [];
  if (open) {
    const xj = xs.slice(0, ic + 1);
    const cj = pickCols(cam, D, xj, psiJaw, -1, true, 16, 90);
    jawSS = cj.ss;
    jaw = newGrid(xj.length, cj.ss.length, [SEAM, SEAM, LIP, LIP, SEAM, SEAM]);
    for (let i = 0; i < xj.length; i++) for (let j = 0; j < cj.ss.length; j++) bodyVertex(jaw, i * cj.ss.length + j, cam, D, xj[i], psiJaw(xj[i], cj.ss[j]), true);
  }
  return {near, far, jaw, xs, ic, aN: cn.a, bF: cf.a, jawSS};
};

// ================================================================ the gill cover (a plate on the cheek; fixed grid, precomputed)
const resampleN = (ps: P[], n: number): P[] => {
  const s = [0];
  for (let i = 1; i < ps.length; i++) s.push(s[i - 1] + Math.hypot(ps[i].x - ps[i - 1].x, ps[i].y - ps[i - 1].y));
  const L = s[s.length - 1], out: P[] = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const t = (L * i) / (n - 1);
    while (j < ps.length - 2 && s[j + 1] < t) j++;
    const u = clamp((t - s[j]) / (s[j + 1] - s[j] || 1));
    out.push(pt(lerp(ps[j].x, ps[j + 1].x, u), lerp(ps[j].y, ps[j + 1].y, u)));
  }
  return out;
};
const CA = 30, CB = 88;
/** the rest edge (top → bottom), nudged so it passes exactly through EXIT */
const E_REST: P[] = (() => {
  const e = resampleN(EDGE_REST, CB);
  let bi = 0;
  e.forEach((q, i) => { if (Math.hypot(q.x - EXIT.x, q.y - EXIT.y) < Math.hypot(e[bi].x - EXIT.x, e[bi].y - EXIT.y)) bi = i; });
  const dx = EXIT.x - e[bi].x, dy = EXIT.y - e[bi].y;
  return e.map((q, i) => {
    const w = Math.exp(-(((i - bi) / (0.1 * CB)) ** 2));
    return pt(q.x + dx * w, q.y + dy * w);
  });
})();
const B_EXIT = E_REST.reduce((b, q, i) => (Math.hypot(q.x - EXIT.x, q.y - EXIT.y) < Math.hypot(E_REST[b].x - EXIT.x, E_REST[b].y - EXIT.y) ? i : b), 0);
/** the cover's attached border (top → bottom): the upper border forward, down the preopercle groove, the lower border back */
const F_FRONT: P[] = (() => {
  const top = OPERCLE_EDGE[0], bot = OPERCLE_EDGE[OPERCLE_EDGE.length - 1];
  const cps = [top, pt(-30.4, -10.95), pt(-33.7, -10.5), ...PREOPERCLE, pt(-37.4, 9.0), pt(-34.7, 9.95), pt(-31.6, 10.45), bot];
  return resampleN(sampleCurve(cps, 0.9, 10), CB);
})();
/** where the preopercle groove runs along F_FRONT (b indices) */
const F_PRE0 = F_FRONT.findIndex((q) => q.x < PREOPERCLE[0].x + 0.2);
const F_PRE1 = CB - 1 - [...F_FRONT].reverse().findIndex((q) => q.x < PREOPERCLE[PREOPERCLE.length - 1].x + 1.6);
/** the lift profile along the edge (0 at both ends, greatest in the upper third) */
const PROF: number[] = (() => {
  const raw = Array.from({length: CB}, (_, i) => {
    const b = i / (CB - 1);
    return Math.pow(Math.sin(Math.PI * b), 0.9) * (1.3 - 0.85 * b);
  });
  const m = Math.max(...raw);
  return raw.map((v) => v / m);
})();
/** precomputed rest data of the cover grid: side-view (x, y), ψ on the near side, distance to the free edge */
const COV = (() => {
  const n = CA * CB;
  const x = new Float64Array(n), y = new Float64Array(n), psi = new Float64Array(n), toEdge = new Float64Array(n), a = new Float64Array(n);
  for (let ia = 0; ia < CA; ia++) {
    for (let ib = 0; ib < CB; ib++) {
      const k = ia * CB + ib;
      const u = ia / (CA - 1);
      const F = F_FRONT[ib], E = E_REST[ib];
      x[k] = lerp(F.x, E.x, u);
      y[k] = lerp(F.y, E.y, u);
      psi[k] = psiForY({...secAt(x[k])}, y[k]);
      toEdge[k] = (1 - u) * Math.hypot(E.x - F.x, E.y - F.y);
      a[k] = u;
    }
  }
  return {x, y, psi, toEdge, a};
})();
/** the cover's thickness over the skin, so its near edge passes through EXIT exactly (z = 6.4) */
const COVER_THICK = (() => {
  const S = secAt(EXIT.x);
  const r = restAt(EXIT.x, psiForY({...S}, EXIT.y), [0, 0, 0]);
  return Math.max(0.02, EXIT.z - r[2]);
})();
/** (diagnostic) the cover's thickness over the skin at EXIT */
export const PRED_COVER_THICK = COVER_THICK;
/** the gap's body-side margin direction (side view): the rear normal of the rest edge */
const E_NRM: P[] = E_REST.map((_, i) => {
  const a = E_REST[Math.max(0, i - 1)], b = E_REST[Math.min(CB - 1, i + 1)];
  const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return pt((b.y - a.y) / l, -(b.x - a.x) / l);
});
const bumpB = (i: number) => Math.min(1, i / 6, (CB - 1 - i) / 6);

type CoverG = {G: Grid; side: number; edge: V3[]; edgeS: (S2 & {z: number})[]; front: S2[]; frontOk: boolean[]; edgeOk: boolean[]; margin: V3[]; marginS: S2[]; marginNv: number[]; lift: number[]; normals: V3[]};
/** the gill cover on one side (side +1 near, -1 far): grid, its free edge (world and screen) and the gap margin */
const buildCover = (cam: Cam, D: Def, pose: PredPose, side: number): CoverG => {
  const fl = pose.startle * 0.32 * Math.abs(Math.sin(pose.t * 14.5));
  const g = clamp(pose.gill + fl, 0, 1.3);
  const G = newGrid(CA, CB, [HINGE, EDGE, SEAM, SEAM, SEAM, SEAM]);
  const lift: number[] = [];
  const P: V3[] = [];
  const tmpG = newGrid(1, 1, []);
  for (let ia = 0; ia < CA; ia++) {
    const a = ia / (CA - 1);
    for (let ib = 0; ib < CB; ib++) {
      const k = ia * CB + ib;
      const x = COV.x[k], psi = side > 0 ? COV.psi[k] : 2 * Math.PI - COV.psi[k];
      bodyVertex(tmpG, 0, cam, D, x, psi, false);
      const n: V3 = [tmpG.nx[0], tmpG.ny[0], tmpG.nz[0]];
      const L = g * LIFT_MAX * Math.pow(a, 1.7) * PROF[ib];
      if (ia === CA - 1) lift.push(L);
      // toward the hinge, in the skin's plane (the edge swings a little forward as it lifts)
      const F = F_FRONT[ib], E = E_REST[ib];
      const fw = norm3([F.x - E.x, F.y - E.y, 0]);
      const th = COVER_THICK * (0.55 + 0.45 * a);
      P.push([
        tmpG.wx[0] + n[0] * L + fw[0] * L * LIFT_FWD,
        tmpG.wy[0] + n[1] * L + fw[1] * L * LIFT_FWD,
        tmpG.wz[0] + n[2] * L + side * th,
      ]);
      G.lf[k] = L;
      G.xr[k] = x;
      G.yr[k] = COV.y[k];
      G.aux[k] = COV.toEdge[k];
    }
  }
  // normals from the grid (central differences; the lens corners borrow their neighbour's)
  const normals: V3[] = [];
  for (let ia = 0; ia < CA; ia++) {
    for (let ib = 0; ib < CB; ib++) {
      const k = ia * CB + ib;
      const ib2 = Math.min(CB - 2, Math.max(1, ib));
      const a0 = P[Math.max(0, ia - 1) * CB + ib2], a1 = P[Math.min(CA - 1, ia + 1) * CB + ib2];
      const b0 = P[ia * CB + Math.max(0, ib - 1)], b1 = P[ia * CB + Math.min(CB - 1, ib + 1)];
      let n = cross3(sub3(a1, a0), sub3(b1, b0));
      if (len3(n) < 1e-9) n = [0, 0, side];
      n = mul3(norm3(n), side);
      normals.push(n);
      G.wx[k] = P[k][0]; G.wy[k] = P[k][1]; G.wz[k] = P[k][2];
      G.nx[k] = n[0]; G.ny[k] = n[1]; G.nz[k] = n[2];
      shadeVertex(G, k, cam);
    }
  }
  const edge = Array.from({length: CB}, (_, ib) => P[(CA - 1) * CB + ib]);
  const edgeS = edge.map((p) => proj(cam.B, p));
  const front = Array.from({length: CB}, (_, ib) => proj(cam.B, P[ib]));
  const frontOk = Array.from({length: CB}, (_, ib) => G.nv[ib] > 0 && G.ok[ib] === 1);
  // the gap's body-side margin: just behind the rest edge, on the skin
  const marginNv: number[] = [];
  const margin: V3[] = E_REST.map((q, ib) => {
    const w = (0.1 + 0.35 * g) * bumpB(ib);
    const mx = q.x + E_NRM[ib].x * w, my = q.y + E_NRM[ib].y * w;
    const psi0 = psiForY({...secAt(mx)}, my);
    bodyVertex(tmpG, 0, cam, D, mx, side > 0 ? psi0 : 2 * Math.PI - psi0, false);
    marginNv.push(tmpG.nv[0]);
    return [tmpG.wx[0], tmpG.wy[0], tmpG.wz[0]];
  });
  const edgeOk = Array.from({length: CB}, (_, ib) => {
    const k = (CA - 1) * CB + ib;
    return G.ok[k] === 1 && (G.nv[k] > -0.02 || (lift[ib] > 0.3 && marginNv[ib] > 0));
  });
  const marginS = margin.map((p) => proj(cam.B, p));
  return {G, side, edge, edgeS, front, frontOk, edgeOk, margin, marginS, marginNv, lift, normals};
};
/** the visible opening under the cover's edge (screen polygon), or null */
const gapPoly = (cv: CoverG, cam: Cam): {e: S2[]; m: S2[]} | null => {
  const n = CB;
  const e: S2[] = [], m: S2[] = [];
  let any = false;
  for (let ib = 0; ib < n; ib++) {
    const a = cv.edgeS[Math.max(0, ib - 1)], b = cv.edgeS[Math.min(n - 1, ib + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    // the cover side of the edge on screen: toward the plate's interior
    const inner = proj(cam.B, [cv.G.wx[(CA - 4) * CB + ib], cv.G.wy[(CA - 4) * CB + ib], cv.G.wz[(CA - 4) * CB + ib]]);
    const E = cv.edgeS[ib], M = cv.marginS[ib];
    const sideIn = (inner.x - E.x) * -ty + (inner.y - E.y) * tx;
    const dm = (M.x - E.x) * -ty + (M.y - E.y) * tx;
    // the skin at the margin must face the camera
    const facing = cv.marginNv[ib] > 0;
    const vis = facing && cv.edgeOk[ib] && dm * sideIn < 0 && E.z > 0.4 ? 1 : 0;
    e.push({x: E.x, y: E.y});
    m.push(vis ? {x: M.x, y: M.y} : {x: E.x, y: E.y});
    if (vis && Math.abs(dm) > 0.8) any = true;
  }
  return any ? {e, m} : null;
};

// ================================================================ fins (V3 designs lifted into 3D planes)
type Fin3 = {outline: V3[]; tension: number; rays: [V3, V3, V3][]; spots: [V3, V3, V3][]; g0: V3; g1: V3};
const quadAt = (a: P, c: P, b: P, u: number) => {
  const v = 1 - u;
  return pt(v * v * a.x + 2 * v * u * c.x + u * u * b.x, v * v * a.y + 2 * v * u * c.y + u * u * b.y);
};
const quadTan = (a: P, c: P, b: P, u: number) => {
  const x = 2 * (1 - u) * (c.x - a.x) + 2 * u * (b.x - c.x), y = 2 * (1 - u) * (c.y - a.y) + 2 * u * (b.y - c.y);
  const l = Math.hypot(x, y) || 1;
  return pt(x / l, y / l);
};
const liftFin = (f: Fin, lift: (p: P) => V3, o: P = pt(0, 0)): Fin3 => {
  const L = (p: P) => lift(pt(p.x - o.x, p.y - o.y));
  const spots: [V3, V3, V3][] = [];
  const n = f.rays.length;
  f.rays.forEach((r, i) => {
    const nb = f.rays[Math.min(n - 1, i + 1)], pb = f.rays[Math.max(0, i - 1)];
    f.bands.forEach((u0, k) => {
      const u = clamp(u0 + (i % 2 ? 0.035 : -0.02) + 0.03 * (hash(i * 7.1 + k * 3.3) - 0.5));
      const c = quadAt(r.b, r.c, r.t, u);
      const gap = (Math.hypot(nb.t.x - pb.t.x, nb.t.y - pb.t.y) / (nb === pb ? 1 : i === 0 || i === n - 1 ? 1 : 2)) * u;
      const tg = quadTan(r.b, r.c, r.t, u);
      const rx = clamp(gap * 0.4, 0.18, 0.6) * f.spot * (0.8 + 0.35 * hash(i * 1.7 + k));
      const ry = clamp(gap * 0.27, 0.13, 0.4) * f.spot;
      const c3 = L(c);
      spots.push([c3, sub3(L(pt(c.x + tg.x * rx, c.y + tg.y * rx)), c3), sub3(L(pt(c.x - tg.y * ry, c.y + tg.x * ry)), c3)]);
    });
  });
  return {outline: f.outline.map(L), tension: f.tension, rays: f.rays.map((r) => [L(r.b), L(r.c), L(r.t)]), spots, g0: L(f.g0), g1: L(f.g1)};
};
/** an ellipse from two conjugate semi-diameters (screen) */
const conjAxes = (e1: S2, e2: S2) => {
  const a = e1.x, c = e1.y, b = e2.x, d = e2.y;
  const p = a * a + b * b, q = a * c + b * d, r = c * c + d * d;
  const th = 0.5 * Math.atan2(2 * q, p - r);
  const T = (p + r) / 2, det = Math.sqrt(Math.max(0, ((p - r) / 2) ** 2 + q * q));
  return {rx: Math.sqrt(Math.max(0, T + det)), ry: Math.sqrt(Math.max(0, T - det)), th};
};
const ellD = (cx: number, cy: number, rx: number, ry: number, th: number) => {
  const ca = Math.cos(th), sa = Math.sin(th), deg = fx(th / D2R);
  const ax = cx - rx * ca, ay = cy - rx * sa;
  return `M${fx(ax)} ${fx(ay)}a${fx(rx)} ${fx(ry)} ${deg} 1 0 ${fx(2 * rx * ca)} ${fx(2 * rx * sa)}a${fx(rx)} ${fx(ry)} ${deg} 1 0 ${fx(-2 * rx * ca)} ${fx(-2 * rx * sa)}Z`;
};
const projEll = (B: Basis, c: V3, e1: V3, e2: V3) => {
  const q = proj(B, c), a = proj(B, add3(c, e1)), b = proj(B, add3(c, e2));
  return {c: q, ...conjAxes({x: a.x - q.x, y: a.y - q.y}, {x: b.x - q.x, y: b.y - q.y})};
};

const FinArt3: React.FC<{f: Fin3; cam: Cam; dim: number; K: (c: string) => string}> = ({f, cam, dim, K}) => {
  const B = cam.B;
  const pr = (p: V3) => proj(B, p);
  if (f.outline.some((p) => pr(p).z < 0.5)) return null;
  const outline = f.outline.map((p) => {
    const q = pr(p);
    return pt(q.x, q.y);
  });
  const d = closed(outline, f.tension);
  // the membrane faces the light or not: a little darker on its unlit side
  const r0 = f.rays[0], r1 = f.rays[f.rays.length - 1];
  let n = cross3(sub3(r0[2], r0[0]), sub3(r1[2], r1[0]));
  if (len3(n) < 1e-9) n = [0, 0, 1];
  n = norm3(n);
  const ctr = f.outline.reduce((s, p) => add3(s, mul3(p, 1 / f.outline.length)), [0, 0, 0] as V3);
  const toCam = dot3(n, sub3(cam.eye, ctr)) >= 0 ? 1 : -1;
  const lf = dot3(mul3(n, toCam), cam.L);
  const dd = clamp(dim + (lf < 0 ? 0.16 * Math.min(1, -lf * 2) : 0), 0, 1);
  const col = (c: string) => K(shade(c, dd));
  const g = uid('pfin');
  const g0 = pr(f.g0), g1 = pr(f.g1);
  let rays = '';
  for (const [b, c, t] of f.rays) {
    const qb = pr(b), qc = pr(c), qt = pr(t);
    rays += `M${fx(qb.x)} ${fx(qb.y)}Q${fx(qc.x)} ${fx(qc.y)} ${fx(qt.x)} ${fx(qt.y)}`;
  }
  let spots = '';
  const s0 = pr(f.g0).s;
  for (const [c, e1, e2] of f.spots) {
    const E = projEll(B, c, e1, e2);
    if (E.rx < 0.35) continue;
    spots += ellD(E.c.x, E.c.y, E.rx, Math.max(0.25, E.ry), E.th);
  }
  return (
    <g>
      <defs>
        <linearGradient id={g} gradientUnits="userSpaceOnUse" x1={fx(g0.x)} y1={fx(g0.y)} x2={fx(g1.x)} y2={fx(g1.y)}>
          <stop offset="0" stopColor={col(mix(C.fin, C.finDark, 0.22))} />
          <stop offset="0.55" stopColor={col(C.fin)} />
          <stop offset="1" stopColor={col(lit(C.fin, 0.2))} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${g})`} fillOpacity={0.9} />
      <path d={rays} fill="none" stroke={col(C.finRay)} strokeWidth={s0 > 40 ? 2 : 1.35} vectorEffect={NS} strokeLinecap="round" opacity={0.9} />
      {spots && <path d={spots} fill={col(C.finDark)} opacity={0.78} />}
      <path d={d} fill="none" stroke={K(INK)} strokeWidth={INK_PX * 0.86} vectorEffect={NS} strokeLinejoin="round" />
    </g>
  );
};

// ================================================================ the model (everything for one camera and pose)
type EyeG = {c: S2; rx: number; ry: number; th: number; vis: number; pu: number; pv: number; R: number};
type Model = {
  cam: Cam;
  D: Def;
  pose: PredPose;
  nearFront: boolean;
  body: BodyGrids;
  covers: [CoverG, CoverG];
  gap: {e: S2[]; m: S2[]} | null;
  gapFar: {e: S2[]; m: S2[]} | null;
  gape: {d: string; lips: S2[][]; c: S2; r: number} | null;
  fins: {d1: Fin3; d2: Fin3; anal: Fin3; caudal: Fin3; pecN: Fin3; pecF: Fin3; pelN: Fin3; pelF: Fin3};
  eyes: [EyeG | null, EyeG | null];
  exit: {p: V3; out: V3; n: V3};
  mouthIn: {p: V3; dir: V3};
  outline: string;
  baseNear: Loop[];
  baseFar: Loop[];
  baseJaw: Loop[];
  coverBase: [Loop[], Loop[]];
};

/** the eye on one side: a bulging gold disc high on the head, facing mostly sideways */
const EYE_REST = (() => {
  const S = {...secAt(EYE.c.x)};
  return {x: EYE.c.x, psi: psiForY(S, EYE.c.y)};
})();
const eyeGeom = (cam: Cam, D: Def, side: number, look: V3 | null): EyeG | null => {
  const G = newGrid(1, 1, []);
  bodyVertex(G, 0, cam, D, EYE_REST.x, side > 0 ? EYE_REST.psi : 2 * Math.PI - EYE_REST.psi, false);
  const Ps: V3 = [G.wx[0], G.wy[0], G.wz[0]], Ns: V3 = [G.nx[0], G.ny[0], G.nz[0]];
  // dorsolateral: the eye looks out and up (both eyes show from above), drawn as a dome so it stays round side on
  const ne = norm3(add3(mul3(Ns, 0.35), mul3(norm3([0.04, -0.56, side * 0.83]), 0.65)));
  const c = add3(Ps, mul3(Ns, 0.3));
  const vis = dot3(ne, norm3(sub3(cam.eye, c)));
  if (vis < 0.03) return null;
  let t1 = cross3(ne, [0, 1, 0]);
  t1 = norm3(len3(t1) < 1e-6 ? [1, 0, 0] : t1);
  const t2 = norm3(cross3(ne, t1));
  const r = EYE.r;
  const E = projEll(cam.B, c, mul3(t1, r), mul3(t2, r));
  if (E.c.z < 0.5) return null;
  // a bulging eye (a dome): rounder than its rim's ellipse, never a sliver
  const ry = Math.min(E.rx, Math.max(E.ry, E.rx * (0.5 + 0.5 * Math.min(1, vis + 0.15))));
  // the pupil: toward the look target, within the iris
  let off: V3 = [0, 0.08, 0];
  if (look) {
    const dl = norm3(sub3(look, c));
    const q = sub3(dl, mul3(ne, dot3(dl, ne)));
    const ql = len3(q);
    if (ql > 1e-6) off = mul3(q, (0.62 * Math.min(1, ql * 1.6)) / ql);
  }
  const qo = proj(cam.B, add3(c, off));
  const dx = qo.x - E.c.x, dy = qo.y - E.c.y;
  const ct = Math.cos(E.th), st = Math.sin(E.th);
  const pu = (dx * ct + dy * st) / E.rx, pv = (-dx * st + dy * ct) / ry;
  return {c: {x: E.c.x, y: E.c.y}, rx: E.rx, ry, th: E.th, vis: clamp((vis - 0.03) / 0.12), pu: clamp(pu, -0.45, 0.45), pv: clamp(pv, -0.45, 0.45), R: E.rx};
};

let CACHE: {key: string; m: Model}[] = [];
const keyOf = (B: Basis, pose: PredPose) => JSON.stringify([B.eye, B.r, B.u, B.f, B.cx, B.cy, B.roll, pose.t, pose.gill, pose.mouth, pose.bend, pose.finPhase, pose.startle, pose.look]);
const model = (B: Basis, pose: PredPose): Model => {
  const key = keyOf(B, pose);
  const hit = CACHE.find((c) => c.key === key);
  if (hit) return hit.m;
  const m = buildModel(B, pose);
  CACHE = [{key, m}, ...CACHE.slice(0, 5)];
  return m;
};

const buildModel = (B: Basis, pose: PredPose): Model => {
  const cam = camOf(B);
  const D = makeDef(pose);
  const body = buildBody(cam, D);
  const covers: [CoverG, CoverG] = [buildCover(cam, D, pose, 1), buildCover(cam, D, pose, -1)];
  const nearFront = B.eye[2] >= 0;
  const gap = gapPoly(covers[0], cam);
  const gapFar = gapPoly(covers[1], cam);

  // ---- the gape (open mouth): side openings and the front opening, between the upper lips (body) and the lower
  // lips (jaw)
  let gape: Model['gape'] = null;
  let mouthC: V3 = [-48, 1.8, 0];
  if (body.jaw) {
    const {near, far, jaw, ic, aN, bF} = body;
    const col = (G: Grid, j: number, i0: number, i1: number) => {
      const out: {s: S2; w: V3}[] = [];
      const step = i1 >= i0 ? 1 : -1;
      for (let i = i0; ; i += step) {
        const k = i * G.nj + j;
        out.push({s: {x: G.sx[k], y: G.sy[k]}, w: [G.wx[k], G.wy[k], G.wz[k]]});
        if (i === i1) break;
      }
      return out;
    };
    const nu = col(near, aN, ic, 0), fu = col(far, bF + 1, 0, ic);
    const fl = col(jaw, jaw.nj - 1, ic, 0), nl = col(jaw, 0, 0, ic);
    const polyD = (pts: S2[]) => {
      const L = {x: pts.map((p) => p.x), y: pts.map((p) => p.y)};
      const a = loopArea(L);
      const ps = a < 0 ? [...pts].reverse() : pts;
      return Math.abs(a) < 4 ? '' : `M${ps.map((p) => `${fx(p.x)} ${fx(p.y)}`).join('L')}Z`;
    };
    const sideN = [...nu.map((q) => q.s), ...nl.map((q) => q.s)];
    const sideF = [...[...fu].reverse().map((q) => q.s), ...[...fl].reverse().map((q) => q.s)];
    const front = [...nu.map((q) => q.s), ...fu.map((q) => q.s), ...fl.map((q) => q.s), ...nl.map((q) => q.s)];
    const d = polyD(sideN) + polyD(sideF) + polyD(front);
    const all = [...nu, ...fu, ...fl, ...nl];
    mouthC = all.reduce((s, q) => add3(s, mul3(q.w, 1 / all.length)), [0, 0, 0] as V3);
    const cs = proj(B, mouthC);
    const span = Math.max(...all.map((q) => Math.hypot(q.s.x - cs.x, q.s.y - cs.y)));
    if (d && D.mouth > 0.03) gape = {d, lips: [nu.map((q) => q.s), nl.map((q) => q.s), fu.map((q) => q.s), fl.map((q) => q.s)], c: {x: cs.x, y: cs.y}, r: span};
  }

  // ---- fins
  const look: FishLook = {t: pose.t, gill: pose.gill, finPhase: pose.finPhase, startle: pose.startle, prop: 0, look: 0};
  const F = finsFor(look);
  const mid = (p: P): V3 => bendPt(D, [p.x, p.y, 0]);
  const pecBase = lerpP2(PECTORAL.base[0], PECTORAL.base[1], 0.5);
  const pecZ = surfZ(pecBase.x, pecBase.y) + 0.25;
  // the paired fins: a plane spanned by "back and out" (splay σ about the vertical) and "down and out" (tilt γ about
  // the body axis), so the fan reads from the side (the V3 shape, only foreshortened by cos γ vertically), from above
  // and from behind; fanning swings both
  const ph = pose.finPhase, st = pose.startle;
  const pecPlane = (sig: number, gam: number) => ({ts: Math.tan(sig * D2R), cg: Math.cos(gam * D2R), sg: Math.sin(gam * D2R)});
  const pecN = pecPlane(22 + 9 * Math.sin(ph) + 16 * st, 30 + 5 * Math.sin(ph + 0.7) + 8 * st);
  const pecF = pecPlane(22 + 9 * Math.sin(ph + Math.PI * 0.8) + 16 * st, 30 + 5 * Math.sin(ph + Math.PI * 0.8 + 0.7) + 8 * st);
  const pec = (side: number, k: {ts: number; cg: number; sg: number}) => (p: P): V3 => {
    const dx = p.x - pecBase.x, dy = p.y - pecBase.y;
    return bendPt(D, [p.x, pecBase.y + dy * k.cg, side * (pecZ + Math.max(0, dx) * k.ts + dy * k.sg)]);
  };
  const pelZ = 2.9;
  const pel = (side: number) => (p: P): V3 => {
    const dx = p.x - PELVIC.base.x, dy = p.y - PELVIC.base.y;
    return bendPt(D, [p.x, Math.min(12.9, PELVIC.base.y + dy * 0.7), side * (pelZ + Math.max(0, dx) * 0.45 + Math.abs(dy) * 0.7)]);
  };
  const fins = {
    d1: liftFin(F.d1, mid), d2: liftFin(F.d2, mid), anal: liftFin(F.anal, mid), caudal: liftFin(F.caudal, mid),
    pecN: liftFin(F.pectoral, pec(1, pecN)), pecF: liftFin(F.pectoralFar, pec(-1, pecF), pt(0.9, -0.6)),
    pelN: liftFin(F.pelvic, pel(1)), pelF: liftFin(F.pelvicFar, pel(-1), pt(0.9, -0.35)),
  };

  // ---- eyes
  const eyes: [EyeG | null, EyeG | null] = [eyeGeom(cam, D, 1, pose.look), eyeGeom(cam, D, -1, pose.look)];

  // ---- the exit on the near cover's edge
  const cv = covers[0];
  const ke = (CA - 1) * CB + B_EXIT;
  const pE: V3 = [cv.G.wx[ke], cv.G.wy[ke], cv.G.wz[ke]];
  const nE = cv.normals[ke];
  const liftE = cv.lift[B_EXIT];
  // outward from under the cover: across the edge along the skin (back and up, the edge's rear normal), turning
  // outward as the cover lifts
  const skinAt = (x: number, y: number): V3 => {
    const G1 = newGrid(1, 1, []);
    bodyVertex(G1, 0, cam, D, x, psiForY({...secAt(x)}, y), false);
    return [G1.wx[0], G1.wy[0], G1.wz[0]];
  };
  const eR = E_REST[B_EXIT], eN = E_NRM[B_EXIT];
  const rear = norm3(sub3(skinAt(eR.x + eN.x * 0.6, eR.y + eN.y * 0.6), skinAt(eR.x, eR.y)));
  const out = norm3(add3(rear, mul3(nE, 0.25 + 0.2 * liftE)));
  const exit = {p: pE, out, n: nE};
  const pb: V3 = [PHARYNX.back.x, PHARYNX.back.y, 0];
  const mouthIn = {p: mouthC, dir: norm3(sub3(pb, mouthC))};

  // ---- visible-region boundaries (the ink silhouette and the occlusion outline)
  const baseNear = contour(body.near, body.near.nv, true);
  const baseFar = contour(body.far, body.far.nv, true);
  const baseJaw = body.jaw ? contour(body.jaw, body.jaw.nv, true) : [];
  const coverBase: [Loop[], Loop[]] = [contour(covers[0].G, covers[0].G.nv, true), contour(covers[1].G, covers[1].G.nv, true)];
  // a common orientation (the far half and the far cover are mirror images) so the union fills with nonzero
  const orient = (ls: Loop[]) => {
    if (!ls.length) return 1;
    const big = ls.reduce((b, L) => (Math.abs(loopArea(L)) > Math.abs(loopArea(b)) ? L : b), ls[0]);
    return Math.sign(loopArea(big)) || 1;
  };
  const outline = [baseNear, baseFar, baseJaw, coverBase[0], coverBase[1]].map((ls) => loopsPath(ls, orient(ls))).join('');

  return {cam, D, pose, nearFront, body, covers, gap, gapFar, gape, fins, eyes, exit, mouthIn, outline, baseNear, baseFar, baseJaw, coverBase};
};
function lerpP2(a: P, b: P, u: number): P {
  return pt(lerp(a.x, b.x, u), lerp(a.y, b.y, u));
}
/** the rest skin's z on the near side at side-view (x, y) */
function surfZ(x: number, y: number) {
  const S = {...secAt(x)};
  return restAt(x, psiForY(S, y), [0, 0, 0])[2];
}

// ================================================================ painting
type Paint = {d: string; fill: string; op: number};
/** the standard skin stack for a body piece: pigment steps, markings, lips, shade, light, gloss, rim */
const skinLayers = (G: Grid, K: (c: string) => string, px: number, extra: (layers: Paint[]) => void = () => {}): {pig: Paint[]; light: Paint[]} => {
  const n = G.ni * G.nj;
  const v = new Float32Array(n), sad = new Float32Array(n), blo = new Float32Array(n), dc = new Float32Array(n), up = new Float32Array(n);
  let xMin = 1e9, xMax = -1e9;
  for (let k = 0; k < n; k++) {
    const x = G.xr[k], y = G.yr[k];
    v[k] = vOf(x, y);
    sad[k] = unionF(SADDLES, x, y);
    blo[k] = unionF(BLOTCHES, x, y);
    dc[k] = y - cleftY(x);
    up[k] = -G.ny[k];
    if (G.ok[k] && G.nv[k] > 0) { xMin = Math.min(xMin, x); xMax = Math.max(xMax, x); }
  }
  const L: Paint[] = [];
  const add = (f: (k: number) => number, fill: string, op = 1) => {
    const d = regionD(G, f);
    if (d) L.push({d, fill: K(fill), op});
  };
  for (const p of PIG) add((k) => p.bound(G.xr[k]) - v[k], p.col);
  // the tail darkens a little toward the caudal fin
  add((k) => (G.xr[k] - 14) / 10, C.fishDark, 0.1);
  add((k) => (G.xr[k] - 24) / 10, C.fishDark, 0.1);
  // markings
  add((k) => sad[k], C.fishSaddle, 0.55);
  add((k) => Math.min(sad[k], 0.3 - v[k]), mix(C.fishSaddle, C.fishDark, 0.45), 0.4);
  add((k) => blo[k], C.fishSaddle, 0.5);
  extra(L);
  // lips (closed mouth: both bands; open: each stays on its own side of the cut)
  if (xMin < X_C + 2) {
    const lipEnd = (x: number) => (x <= X_C ? 1 : 1 - (x - X_C) / 1.6);
    const du = (x: number) => lerp(1.05, 0.55, clamp((x - X_MIN) / (X_C - X_MIN)));
    const dl = (x: number) => lerp(1.45, 0.8, clamp((x - X_MIN) / (X_C - X_MIN)));
    add((k) => Math.min(dc[k] + du(G.xr[k]), -dc[k] + 0.001, lipEnd(G.xr[k] - 0.4)), LIP_UP, 0.75);
    add((k) => Math.min(dc[k] + 0.001, dl(G.xr[k]) - dc[k], lipEnd(G.xr[k] + 0.3)), LIP_LO, 0.7);
  }
  const pig = L.splice(0, L.length);
  // light (key light in camera space, upper left)
  add((k) => 0.12 - G.nl[k], SHADOW, 0.22);
  add((k) => -0.34 - G.nl[k], SHADOW, 0.16);
  add((k) => G.nl[k] - 0.7, WARM, 0.11);
  // wet gloss: a streak with a faint halo
  add((k) => G.nh[k] - 0.95, GLOSS, 0.07);
  add((k) => G.nh[k] - 0.978, GLOSS, 0.2);
  // rim light along the back (toward the key light) and a warm bounce from the sand along the belly
  const rimW = clamp(14 / Math.max(1, px), 0.06, 0.2);
  add((k) => Math.min(rimW - G.nv[k], up[k] - 0.35, 32.4 - G.xr[k]), WARM, 0.3);
  add((k) => Math.min(rimW * 1.2 - G.nv[k], -up[k] - 0.45, 32.4 - G.xr[k]), BOUNCE, 0.22);
  return {pig, light: L};
};
const Layers: React.FC<{L: Paint[]}> = ({L}) => (
  <>
    {L.map((l, i) => (
      <path key={i} d={l.d} fill={l.fill} opacity={l.op === 1 ? undefined : l.op} />
    ))}
  </>
);

/** small dark spots on one side (speckle, head spots): projected discs, only where the skin faces the camera */
const spotsD = (cam: Cam, D: Def, side: number, scale: number) => {
  if (scale < 2.5) return '';
  let d = '';
  const G = newGrid(1, 1, []);
  for (const [x, y, r] of SPOTS) {
    const psi0 = psiForY({...secAt(x)}, y);
    bodyVertex(G, 0, cam, D, x, side > 0 ? psi0 : 2 * Math.PI - psi0, false);
    if (!G.ok[0] || G.nv[0] < 0.15) continue;
    const n: V3 = [G.nx[0], G.ny[0], G.nz[0]];
    let t1 = cross3(n, [0, 1, 0]);
    t1 = norm3(len3(t1) < 1e-6 ? [1, 0, 0] : t1);
    const t2 = norm3(cross3(n, t1));
    const E = projEll(cam.B, [G.wx[0], G.wy[0], G.wz[0]], mul3(t1, r), mul3(t2, r));
    if (E.rx < 0.5) continue;
    d += ellD(E.c.x, E.c.y, E.rx, Math.max(0.3, E.ry), E.th);
  }
  return d;
};

/** the scale lattice (V3's tile: 1.9 × 2.2 u, alternate columns offset, tilted 6°) over the trunk behind the cover,
 *  side-view (x, y) and ψ on the near side, precomputed */
const SCALES: {x: number; y: number; psi: number[]; v: number}[] = (() => {
  const out: {x: number; y: number; psi: number[]; v: number}[] = [];
  const W = 1.9, H = 2.2, r = H * 0.52, ca = Math.cos(-6 * D2R), sa = Math.sin(-6 * D2R);
  for (let ix = -16; ix <= 34; ix++) {
    for (let iy = -8; iy <= 8; iy++) {
      const u = ix * (W / 2), w = iy * H + (ix % 2 ? H / 2 : 0);
      const x = u * ca - w * sa, y = u * sa + w * ca;
      if (x < -26.5 || x > 31) continue;
      const S = {...secAt(x)};
      if (y < S.top + 0.6 || y > S.bot - 0.6) continue;
      const ys = [y - r, y, y + r].map((q) => clamp(q, S.top + 0.05, S.bot - 0.05));
      const xs = [x, x + r * 0.9, x];
      out.push({x, y, psi: ys.map((q, i) => psiForY({...secAt(xs[i])}, q)), v: (y - S.top) / (S.bot - S.top)});
    }
  }
  return out;
})();
/** faint rear-facing scale edges on one side (only at close range) */
const scalesD = (cam: Cam, D: Def, side: number, px: number) => {
  if (px < 9) return null;
  const G = newGrid(1, 1, []);
  const r = 2.2 * 0.52;
  let d = '', hi = '';
  for (const sc of SCALES) {
    // fade toward the dark back and the pale belly
    if (sc.v < 0.16 || sc.v > 0.84) continue;
    const xs = [sc.x, sc.x + r * 0.9, sc.x];
    const q: S2[] = [];
    let ok = true;
    for (let i = 0; i < 3; i++) {
      bodyVertex(G, 0, cam, D, xs[i], side > 0 ? sc.psi[i] : 2 * Math.PI - sc.psi[i], false);
      if (!G.ok[0] || G.nv[0] < 0.22) { ok = false; break; }
      q.push({x: G.sx[0], y: G.sy[0]});
    }
    if (!ok) continue;
    if (q.every((p) => p.x < -50 || p.x > 1130 || p.y < -50 || p.y > 1970)) continue;
    const cx = 2 * q[1].x - (q[0].x + q[2].x) / 2, cy = 2 * q[1].y - (q[0].y + q[2].y) / 2;
    d += `M${fx(q[0].x)} ${fx(q[0].y)}Q${fx(cx)} ${fx(cy)} ${fx(q[2].x)} ${fx(q[2].y)}`;
    // the lit lip of the scale, just inside its upper half
    const m0 = {x: lerp(q[0].x, q[1].x, 0.12), y: lerp(q[0].y, q[1].y, 0.12)};
    hi += `M${fx(m0.x)} ${fx(m0.y)}Q${fx(lerp(cx, q[1].x, 0.35))} ${fx(lerp(cy, q[1].y, 0.35))} ${fx(lerp(q[1].x, q[0].x, 0.1))} ${fx(lerp(q[1].y, q[0].y, 0.1))}`;
  }
  return d ? {d, hi, w: clamp(0.075 * px, 0.8, 3.2), op: clamp((px - 9) / 12)} : null;
};

const pxPerU = (cam: Cam, p: V3) => proj(cam.B, p).s;

/** one half of the body (side +1 near, -1 far), with its features */
const Half: React.FC<{m: Model; side: number; K: (c: string) => string}> = ({m, side, K}) => {
  const G = side > 0 ? m.body.near : m.body.far;
  const base = side > 0 ? m.baseNear : m.baseFar;
  const px = pxPerU(m.cam, [-20, 0, 6 * side]);
  const baseD = loopsPath(base);
  if (!baseD) return null;
  const L = skinLayers(G, K, px);
  const clip = uid('phalf');
  const spots = spotsD(m.cam, m.D, side, px);
  const scales = scalesD(m.cam, m.D, side, px);
  const ink = tagRuns(base, [LIMB]);
  const lipInk = m.body.jaw ? tagRuns(base, [LIP]) : '';
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={baseD} />
        </clipPath>
      </defs>
      <path d={baseD} fill={K(PIG_BASE)} />
      <Layers L={L.pig} />
      {scales && (
        <g clipPath={`url(#${clip})`} opacity={scales.op}>
          <path d={scales.d} fill="none" stroke={K(C.fishDark)} strokeWidth={scales.w} strokeLinecap="round" opacity={0.5} />
          <path d={scales.hi} fill="none" stroke={K(WARM)} strokeWidth={scales.w * 0.8} strokeLinecap="round" opacity={0.3} />
        </g>
      )}
      {spots && <path d={spots} fill={K(C.fishDark)} opacity={0.45} clipPath={`url(#${clip})`} />}
      <Layers L={L.light} />
      {lipInk && <path d={lipInk} fill="none" stroke={K(INK)} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" />}
      <path d={ink} fill="none" stroke={K(INK)} strokeWidth={INK_PX} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** the closed mouth's cleft, the nostrils (one side) */
const HeadMarks: React.FC<{m: Model; side: number; K: (c: string) => string}> = ({m, side, K}) => {
  const {cam, D} = m;
  const G = newGrid(1, 1, []);
  const at = (x: number, y: number) => {
    const psi0 = psiForY({...secAt(x)}, y);
    bodyVertex(G, 0, cam, D, x, side > 0 ? psi0 : 2 * Math.PI - psi0, false);
    return {s: {x: G.sx[0], y: G.sy[0]}, w: [G.wx[0], G.wy[0], G.wz[0]] as V3, n: [G.nx[0], G.ny[0], G.nz[0]] as V3, v: G.nv[0], ok: G.ok[0] === 1};
  };
  let cleft = '';
  if (!m.body.jaw) {
    // the cleft: along the cleft line from the snout tip to the corner, then the little hook down behind it
    const pts: {s: S2; v: number}[] = [];
    for (let i = 0; i <= 26; i++) {
      const x = lerp(CLEFT[0].x, X_C, i / 26);
      pts.push(at(x, cleftY(x)));
    }
    pts.push(at(-40.75, 2.9), at(-40.5, 3.2));
    let run: S2[] = [];
    const flush = () => { if (run.length > 1) cleft += smoothOpenPath(run.map((q) => q.x), run.map((q) => q.y), 1.5); run = []; };
    for (const q of pts) { if (q.v > 0.15) run.push(q.s); else flush(); }
    flush();
  }
  const nos = ([[-47.7, -3.35, 0.34, true], [-45.5, -5.15, 0.22, false]] as [number, number, number, boolean][]).map(([x, y, r, ink]) => {
    const q = at(x, y);
    if (!q.ok || q.v < 0.12) return null;
    let t1 = cross3(q.n, [0, 1, 0]);
    t1 = norm3(len3(t1) < 1e-6 ? [1, 0, 0] : t1);
    const t2 = norm3(cross3(q.n, t1));
    const E = projEll(cam.B, q.w, mul3(t1, r), mul3(t2, r));
    if (E.rx < 0.8) return null;
    return {d: ellD(E.c.x, E.c.y, E.rx, Math.max(0.5, E.ry), E.th), ink};
  });
  return (
    <g>
      {cleft && <path d={cleft} fill="none" stroke={K(INK)} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" />}
      {nos.map((q, i) => q && <path key={i} d={q.d} fill={K(C.fishDark)} stroke={q.ink ? K(INK) : undefined} strokeWidth={1.1} opacity={q.ink ? 0.9 : 0.75} />)}
    </g>
  );
};

/** the dark opening under one cover's edge: a deep red-brown cavity, a fringe of red gill filaments hanging from
 *  under the cover, the cover's shadow inside */
const GapArt: React.FC<{gp: {e: S2[]; m: S2[]}; pose: PredPose; px: number; K: (c: string) => string}> = ({gp, pose, px, K}) => {
  const id = {clip: uid('pgClip'), grad: uid('pgGrad')};
  const pts = [...gp.e, ...[...gp.m].reverse()];
  const d = `M${pts.map((p) => `${fx(p.x)} ${fx(p.y)}`).join('L')}Z`;
  const n = gp.e.length;
  // the widest part of the opening sets the gradient axis
  let mi = 0, wm = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.hypot(gp.m[i].x - gp.e[i].x, gp.m[i].y - gp.e[i].y);
    if (w > wm) { wm = w; mi = i; }
  }
  const e = gp.e[mi], mm = gp.m[mi];
  const g = clamp(pose.gill, 0, 1.3);
  // filaments: short lamellae from under the cover's edge into the opening (two staggered rows)
  let fil = '', fil2 = '';
  const per = Math.max(1, Math.round(n / clamp(wm / 3, 18, 70)));
  for (let i = 1; i < n - 1; i += per) {
    for (let k = 0; k < 2; k++) {
      const u = Math.min(n - 1.001, i + k * 0.5 * per);
      const ia = Math.floor(u), f = u - ia;
      const A = {x: lerp(gp.e[ia].x, gp.e[ia + 1].x, f), y: lerp(gp.e[ia].y, gp.e[ia + 1].y, f)};
      const Bm = {x: lerp(gp.m[ia].x, gp.m[ia + 1].x, f), y: lerp(gp.m[ia].y, gp.m[ia + 1].y, f)};
      const tx = Bm.x - A.x, ty = Bm.y - A.y, w = Math.hypot(tx, ty);
      if (w < 2) continue;
      const len = Math.min(w * (0.3 + 0.3 * hash(i * 3.7 + k * 1.3)), 1.4 * px * (0.6 + 0.4 * hash(i * 2.1 + k)));
      const sk = 0.3 * (hash(i * 1.3 + k) - 0.5);
      const ux = tx / w, uy = ty / w;
      const s0 = {x: A.x - ux * 2, y: A.y - uy * 2};
      const t = {x: A.x + (ux - uy * sk) * len, y: A.y + (uy + ux * sk) * len};
      const seg = `M${fx(s0.x)} ${fx(s0.y)}L${fx(t.x)} ${fx(t.y)}`;
      if (k === 0) fil += seg; else fil2 += seg;
    }
  }
  const fw = clamp(0.2 * px, 1.1, 7);
  const edgeD = smoothOpenPath(gp.e.map((p) => p.x), gp.e.map((p) => p.y));
  return (
    <g>
      <defs>
        <clipPath id={id.clip}>
          <path d={d} />
        </clipPath>
        <linearGradient id={id.grad} gradientUnits="userSpaceOnUse" x1={fx(e.x)} y1={fx(e.y)} x2={fx(mm.x)} y2={fx(mm.y)}>
          <stop offset="0" stopColor={K(mix(C.gillDark, DEEP, 0.6))} />
          <stop offset="0.55" stopColor={K(mix(C.chamber, DEEP, 0.25))} />
          <stop offset="1" stopColor={K(mix(C.chamber, C.gillRed, 0.22))} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id.grad})`} />
      <g clipPath={`url(#${id.clip})`}>
        <path d={fil} fill="none" stroke={K(mix(C.gillRed, C.gillDark, 0.35))} strokeWidth={fw} strokeLinecap="round" opacity={0.9 * clamp(g * 1.5 + 0.3)} />
        <path d={fil2} fill="none" stroke={K(mix(C.gillFilament, C.gillRed, 0.3))} strokeWidth={fw * 0.7} strokeLinecap="round" opacity={0.75 * clamp(g * 1.5)} />
        {/* the cover's shadow just under its edge */}
        <path d={edgeD} fill="none" stroke={K(DEEP)} strokeWidth={clamp(0.45 * px, 2, 16)} opacity={0.5} />
      </g>
      {/* the skin's lit rim behind the opening, and its ink */}
      <path d={smoothOpenPath(gp.m.slice(2, -2).map((p) => p.x), gp.m.slice(2, -2).map((p) => p.y))} fill="none" stroke={K(lit(C.fishCheek, 0.3))} strokeWidth={1.8} opacity={0.5} strokeLinecap="round" />
      <path d={smoothOpenPath(gp.m.map((p) => p.x), gp.m.map((p) => p.y))} fill="none" stroke={K(INK)} strokeWidth={1.5} opacity={0.75} strokeLinecap="round" />
    </g>
  );
};

/** one gill cover: inner face (seen when lifted), plate with the skin stack, membrane margin, ink */
const CoverArt: React.FC<{m: Model; side: number; K: (c: string) => string}> = ({m, side, K}) => {
  const cv = m.covers[side > 0 ? 0 : 1];
  const G = cv.G;
  const base = m.coverBase[side > 0 ? 0 : 1];
  const n = G.ni * G.nj;
  const neg = new Float32Array(n);
  const front = side > 0 === m.nearFront;
  for (let k = 0; k < n; k++) neg[k] = front ? Math.min(-G.nv[k], G.lf[k] - 0.12) : -1;
  const innerD = loopsPath(contour(G, neg, false));
  const baseD = loopsPath(base);
  if (!baseD && !innerD) return null;
  const px = pxPerU(m.cam, [-30, 0, 7 * side]);
  const cbl = new Float32Array(n);
  for (let k = 0; k < n; k++) cbl[k] = unionF(COVER_BLOTS, G.xr[k], G.yr[k]);
  const L = baseD
    ? skinLayers(G, K, px, (Ls) => {
        const d1 = regionD(G, (k) => cbl[k]);
        if (d1) Ls.push({d: d1, fill: K(C.fishSaddle), op: 0.5});
        // a soft sheen across the convex plate (upper front), and the pale membrane margin inside the free edge
        const sh = regionD(G, (k) => 1 - Math.hypot(G.xr[k] + 33, (G.yr[k] + 6.5) * 0.8) / 7.5);
        if (sh) Ls.push({d: sh, fill: K(WARM), op: 0.1});
        const mg = regionD(G, (k) => 0.62 - G.aux[k]);
        if (mg) Ls.push({d: mg, fill: K(MARGIN), op: 0.4});
      })
    : {pig: [], light: []};
  const ink = tagRuns(base, [LIMB]);
  // the free edge: the strong line; the attached border: the preopercle groove firm, the upper/lower borders light
  const runs = (pts: S2[], ok: boolean[], i0: number, i1: number) => {
    let d = '';
    let run: S2[] = [];
    const flush = () => { if (run.length > 1) d += smoothOpenPath(run.map((q) => q.x), run.map((q) => q.y), 1.5); run = []; };
    for (let i = i0; i <= i1; i++) { if (ok[i]) run.push(pts[i]); else flush(); }
    flush();
    return d;
  };
  const edgeD = runs(cv.edgeS, cv.edgeOk, 0, CB - 1);
  const preD = runs(cv.front, cv.frontOk, F_PRE0, F_PRE1);
  const bordD = runs(cv.front, cv.frontOk, 0, F_PRE0 + 1) + runs(cv.front, cv.frontOk, F_PRE1 - 1, CB - 1);
  return (
    <g>
      {innerD && <path d={innerD} fill={K(COVER_INNER)} />}
      {baseD && <path d={baseD} fill={K(PIG_BASE)} />}
      <Layers L={L.pig} />
      <Layers L={L.light} />
      <path d={ink} fill="none" stroke={K(INK)} strokeWidth={INK_PX} strokeLinecap="round" />
      <path d={preD} fill="none" stroke={K(INK)} strokeWidth={2} strokeLinecap="round" opacity={0.85} />
      <path d={bordD} fill="none" stroke={K(INK)} strokeWidth={1.3} strokeLinecap="round" opacity={0.4} />
      <path d={edgeD} fill="none" stroke={K(INK)} strokeWidth={INK_PX} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** the eye: orbit, gold iris, pupil on the look target, lid shade, ink ring, gloss */
const EyeArt: React.FC<{e: EyeG; K: (c: string) => string}> = ({e, K}) => {
  const id = {iris: uid('peIris'), orb: uid('peOrb'), clip: uid('peClip')};
  const ct = Math.cos(e.th), st = Math.sin(e.th);
  const M = `matrix(${[e.rx * ct, e.rx * st, -e.ry * st, e.ry * ct, e.c.x, e.c.y].map((v) => v.toFixed(3)).join(' ')})`;
  // the light's direction (screen upper left) in the eye's unit coordinates, for the gradients' focal points
  const toU = (dx: number, dy: number) => ({u: (dx * ct + dy * st) / e.rx, v: (-dx * st + dy * ct) / e.ry});
  const f = toU(-0.3 * e.R, -0.33 * e.R);
  const R = e.R;
  const hl = {x: e.c.x - 0.27 * R, y: e.c.y - 0.29 * R};
  return (
    <g opacity={e.vis < 1 ? e.vis : undefined}>
      <defs>
        <radialGradient id={id.iris} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" fx={f.u.toFixed(3)} fy={f.v.toFixed(3)}>
          <stop offset="0" stopColor={K(lit(C.eyeIris, 0.35))} />
          <stop offset="0.55" stopColor={K(C.eyeIris)} />
          <stop offset="0.86" stopColor={K(mix(C.eyeIris, C.eyeRing, 0.6))} />
          <stop offset="1" stopColor={K(C.eyeRing)} />
        </radialGradient>
        <radialGradient id={id.orb} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1.12" fx={(f.u * 1.2).toFixed(3)} fy={(f.v * 1.6).toFixed(3)}>
          <stop offset="0.75" stopColor={K(mix(C.fishBody, C.fishCheek, 0.5))} />
          <stop offset="1" stopColor={K(C.fishDark)} />
        </radialGradient>
        <clipPath id={id.clip}>
          <circle cx={0} cy={0} r={1} transform={M} />
        </clipPath>
      </defs>
      <g transform={M}>
        <circle cx={0} cy={0} r={1.12} fill={`url(#${id.orb})`} />
        <circle cx={0} cy={0} r={1} fill={`url(#${id.iris})`} />
        <circle cx={e.pu} cy={e.pv} r={0.5} fill={K(C.pupil)} />
      </g>
      {/* the upper lid's shade (screen space: the light is above) */}
      <ellipse cx={e.c.x} cy={e.c.y - R * 0.95} rx={R * 1.15} ry={R * 0.62} fill={K(C.fishDark)} opacity={0.36} clipPath={`url(#${id.clip})`} />
      <g transform={M}>
        <circle cx={0} cy={0} r={1} fill="none" stroke={K(INK)} strokeWidth={R > 30 ? 3 : 2.2} vectorEffect={NS} />
      </g>
      <ellipse cx={hl.x} cy={hl.y} rx={R * 0.23} ry={R * 0.155} transform={`rotate(-32 ${fx(hl.x)} ${fx(hl.y)})`} fill={GLOSS} opacity={0.92} />
      <circle cx={e.c.x + (e.pu * ct - e.pv * (e.ry / e.rx) * st) * R + 0.23 * R} cy={e.c.y + (e.pu * st + e.pv * (e.ry / e.rx) * ct) * R + 0.22 * R} r={R * 0.07} fill={GLOSS} opacity={0.6} />
    </g>
  );
};

/** the open mouth: dark pharynx, pink lip linings, the deep throat */
const GapeArt: React.FC<{g: NonNullable<Model['gape']>; px: number; K: (c: string) => string}> = ({g, px, K}) => {
  const clip = uid('pmClip');
  const lw = clamp(1.1 * px, 2, 40);
  const lips = g.lips.map((ps) => smoothOpenPath(ps.map((p) => p.x), ps.map((p) => p.y), 1.5)).join('');
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={g.d} />
        </clipPath>
      </defs>
      <path d={g.d} fill={K(GAPE)} />
      <g clipPath={`url(#${clip})`}>
        <path d={lips} fill="none" stroke={K(GAPE_IN)} strokeWidth={lw} strokeLinecap="round" opacity={0.85} />
        <path d={lips} fill="none" stroke={K(mix(C.pharynx, C.fishBelly, 0.3))} strokeWidth={lw * 0.35} strokeLinecap="round" opacity={0.5} />
        <ellipse cx={g.c.x + 0.15 * g.r} cy={g.c.y + 0.05 * g.r} rx={g.r * 0.42} ry={g.r * 0.3} fill={K(DEEP)} opacity={0.55} />
      </g>
    </g>
  );
};

/** the jaw piece (open mouth): skin stack, limb ink, the lower lip's edge */
const JawArt: React.FC<{m: Model; K: (c: string) => string}> = ({m, K}) => {
  const G = m.body.jaw;
  if (!G) return null;
  const baseD = loopsPath(m.baseJaw);
  if (!baseD) return null;
  const px = pxPerU(m.cam, [-46, 4, 3]);
  const L = skinLayers(G, K, px);
  return (
    <g>
      <path d={baseD} fill={K(PIG_BASE)} />
      <Layers L={L.pig} />
      <Layers L={L.light} />
      <path d={tagRuns(m.baseJaw, [LIP])} fill="none" stroke={K(INK)} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" />
      <path d={tagRuns(m.baseJaw, [LIMB])} fill="none" stroke={K(INK)} strokeWidth={INK_PX} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** the pectoral fin's fleshy base lobe (one side) */
const PecLobe: React.FC<{m: Model; side: number; K: (c: string) => string}> = ({m, side, K}) => {
  const [B0, B1] = PECTORAL.base;
  const bc = lerpP2(B0, B1, 0.5);
  const ax = {x: B1.x - B0.x, y: B1.y - B0.y};
  const al = Math.hypot(ax.x, ax.y);
  const ux = ax.x / al, uy = ax.y / al, nx = uy, ny = -ux;
  const z0 = surfZ(bc.x, bc.y) + 0.2;
  const ptAt = (a: number): V3 => {
    const x = bc.x + ux * -Math.cos(a) * 2.6 + nx * Math.sin(a) * 0.7, y = bc.y + uy * -Math.cos(a) * 2.6 + ny * Math.sin(a) * 0.7;
    return bendPt(m.D, [x, y, side * (z0 + 0.15 * Math.sin(a))]);
  };
  const pts = Array.from({length: 24}, (_, i) => proj(m.cam.B, ptAt((i / 24) * 2 * Math.PI)));
  if (pts.some((q) => q.z < 0.5)) return null;
  // the lobe faces the camera?
  const c = bendPt(m.D, [bc.x, bc.y, side * z0]);
  if (dot3(sub3(m.cam.eye, c), [0, 0, side]) < 0) return null;
  const d = closed(pts.map((q) => pt(q.x, q.y)), 1);
  const edge = Array.from({length: 13}, (_, i) => proj(m.cam.B, ptAt(0.18 + (i / 12) * (Math.PI - 0.36))));
  const id = uid('ppl');
  const q = proj(m.cam.B, c);
  return (
    <g>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={fx(q.x - 0.6 * q.s)} cy={fx(q.y - 1.6 * q.s)} r={fx(3.6 * q.s)}>
          <stop offset="0" stopColor={K(mix(C.fishBody, C.fishBelly, 0.45))} />
          <stop offset="0.7" stopColor={K(mix(C.fishBody, C.fishBelly, 0.2))} />
          <stop offset="1" stopColor={K(mix(C.fishBody, C.fishDark, 0.25))} />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
      <path d={smoothOpenPath(edge.map((p) => p.x), edge.map((p) => p.y), 1)} fill="none" stroke={K(INK)} strokeWidth={1.5} strokeLinecap="round" opacity={0.8} />
    </g>
  );
};

// ================================================================ the API
/** the whole predator in SCREEN px for this camera (wrap nothing around it) */
export const Predator: React.FC<{B: Basis; pose: PredPose; dim?: number}> = ({B, pose, dim = 0}) => {
  const m = model(B, pose);
  const K = (c: string) => (dim > 0 ? shade(c, clamp(dim)) : c);
  const nearS = m.nearFront ? 1 : -1;
  const farS = -nearS;
  const pxHead = pxPerU(m.cam, [-30, 0, 7]);
  // the caudal fin goes in front of the body when the camera is behind the tail end
  const tailEnd = bendPt(m.D, [33, 0, 0]);
  const tailDir = norm3(sub3(bendPt(m.D, [34, 0, 0]), tailEnd));
  const caudalFront = dot3(sub3(B.eye, tailEnd), tailDir) > 0;
  const fin = (f: Fin3, d = 0) => <FinArt3 f={f} cam={m.cam} dim={d} K={K} />;
  const pecFar = nearS > 0 ? m.fins.pecF : m.fins.pecN, pelFar = nearS > 0 ? m.fins.pelF : m.fins.pelN;
  const pecNear = nearS > 0 ? m.fins.pecN : m.fins.pecF, pelNear = nearS > 0 ? m.fins.pelN : m.fins.pelF;
  const gapS = (s: number) => (s === nearS ? (s > 0 ? m.gap : m.gapFar) : null);
  const side = (s: number) => {
    const gp = gapS(s);
    const eye = m.eyes[s > 0 ? 0 : 1];
    return (
      <g>
        <Half m={m} side={s} K={K} />
        <HeadMarks m={m} side={s} K={K} />
        {gp && <GapArt gp={gp} pose={pose} px={pxHead} K={K} />}
        <CoverArt m={m} side={s} K={K} />
        {eye && <EyeArt e={eye} K={K} />}
      </g>
    );
  };
  return (
    <g>
      {fin(pecFar, 0.3)}
      {fin(pelFar, 0.3)}
      {m.gape && <GapeArt g={m.gape} px={pxPerU(m.cam, m.mouthIn.p)} K={K} />}
      <JawArt m={m} K={K} />
      {side(farS)}
      {!caudalFront && fin(m.fins.caudal)}
      {fin(m.fins.d2)}
      {fin(m.fins.d1)}
      {fin(m.fins.anal)}
      {side(nearS)}
      {caudalFront && fin(m.fins.caudal)}
      {fin(pelNear)}
      {fin(pecNear)}
      <PecLobe m={m} side={nearS} K={K} />
    </g>
  );
};

/** geometry for compositing the eel against the predator (all screen px unless noted) */
export const predGeom = (B: Basis, pose: PredPose) => {
  const m = model(B, pose);
  const gp = m.gap;
  let gap = '';
  if (gp) {
    const pts = [...gp.e, ...[...gp.m].reverse()];
    gap = `M${pts.map((p) => `${fx(p.x)} ${fx(p.y)}`).join('L')}Z`;
  }
  const e = m.eyes[0];
  const pe = proj(B, [EYE.c.x, EYE.c.y, 5]);
  return {
    /** path d: the body outline (no fins), for occlusion */
    outline: m.outline,
    /** path d: the visible near-side gill gap (the opening under the cover's rear edge); '' if not visible */
    gap,
    /** path d: the open mouth's dark interior; '' when closed or not visible */
    mouthHole: m.gape ? m.gape.d : '',
    /** WORLD: the exit point on the near cover's rear edge (moves with the flare), the outward direction from under
     *  the cover, the cover's surface normal */
    exit: m.exit,
    /** WORLD: the centre of the gape and the direction into the throat */
    mouthIn: m.mouthIn,
    eye: e ? {x: e.c.x, y: e.c.y, r: e.R} : {x: pe.x, y: pe.y, r: 0},
  };
};

/** a gentle swimming bend for a receding predator (radians of total turn at the tail), for `pose.bend` */
export const swimBend = (t: number, amp = 0.32, period = 1.1) => amp * Math.sin((2 * Math.PI * t) / period);
