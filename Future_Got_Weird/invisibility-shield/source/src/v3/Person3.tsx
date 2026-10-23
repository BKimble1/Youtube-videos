// V3 characters: one articulated 3D skeleton per character, evaluated as a hierarchy every frame:
//   pelvis (ground point, heading, height limited by what the legs can reach)
//     -> lumbar -> thorax (two spine segments, so the back bends instead of tipping as one stick)
//        -> neck -> head (heading and pitch in world terms, so the eyes stay on their target while the body bends)
//        -> shoulders (with shrug) -> upper arm -> elbow -> forearm -> wrist -> hand (two-bone IK, anatomical elbow pole)
//     -> hips -> thigh -> knee -> shin -> ankle -> shoe (two-bone IK to the planted foot; the knee points over the toes)
// Feet come from v3/gait (planted or swinging, with heel and toe pivots). The drawing is the V2 ink style, rebuilt:
// torso as three convex hulls (hips-waist, waist-chest, chest-shoulders with deltoid caps, so arms hang from defined
// shoulders), each limb as two separately depth-sorted segments (a forearm crossing in front of the body is drawn in
// front of it while its upper arm stays behind), and a 3D shoe whose sole, heel, toe box and collar turn with the foot.
import React from 'react';
import {lit, shade} from '../lib/color';
import {Deco, INK, Inked, InkPath} from '../lib/ink';
import {Limb} from '../lib/limb';
import {Capsule} from '../lib/shade';
import {Hand, HandPose} from '../art/Hand';
import {clamp, lerp} from '../lib/math';
import {a3, Basis, c3, circle3, d3, fmt, fwdOf, hull, l3, m3, n3, proj, projPoly, s3, smoothClosed, V2, V3, v3} from '../v2/p3';
import {HeadExpr, HeadStyle} from '../v2/Head3';
import {HeadV3} from './HeadV3';
import {FootState} from './gait';
import {Cuffs, CuffsState} from './Cuffs';

export type Dims3 = {
  hip: number; hipCrouch: number; torso: number; neck: number; headR: number;
  shW: number; hipW: number; upper: number; fore: number; hand: number; thigh: number; shin: number;
  foot: {ankH: number; heel: number; ball: number; len: number; w: number; h: number};
  rings: {hipA: number; hipB: number; waistA: number; waistB: number; chestA: number; chestB: number; shA: number; shB: number};
  limb: {up: [number, number, number]; leg: [number, number, number]};
};
export const DIM_W3: Dims3 = {
  hip: 0.865, hipCrouch: 0.4, torso: 0.47, neck: 0.075, headR: 0.128, shW: 0.168, hipW: 0.092,
  upper: 0.285, fore: 0.25, hand: 0.168, thigh: 0.408, shin: 0.398,
  foot: {ankH: 0.072, heel: 0.055, ball: 0.135, len: 0.19, w: 0.047, h: 0.085},
  rings: {hipA: 0.16, hipB: 0.115, waistA: 0.128, waistB: 0.092, chestA: 0.158, chestB: 0.108, shA: 0.168, shB: 0.092},
  limb: {up: [0.047, 0.039, 0.031], leg: [0.073, 0.054, 0.04]},
};
export const DIM_G3: Dims3 = {
  hip: 0.955, hipCrouch: 0.55, torso: 0.535, neck: 0.075, headR: 0.132, shW: 0.205, hipW: 0.105,
  upper: 0.315, fore: 0.283, hand: 0.19, thigh: 0.448, shin: 0.437,
  foot: {ankH: 0.078, heel: 0.06, ball: 0.15, len: 0.215, w: 0.054, h: 0.095},
  rings: {hipA: 0.176, hipB: 0.132, waistA: 0.166, waistB: 0.132, chestA: 0.2, chestB: 0.14, shA: 0.196, shB: 0.112},
  limb: {up: [0.058, 0.048, 0.038], leg: [0.084, 0.064, 0.048]},
};
export type Look3 = {style: HeadStyle; dims: Dims3; top: string; topDeep: string; under: string; pants: string; shoe: string; shoeDeep: string; sole: string; skin: string; trim: string};
export const LOOK_W3: Look3 = {style: 'woman', dims: DIM_W3, top: '#1E8FA8', topDeep: '#13667A', under: '#F07C5A', pants: '#262A3E', shoe: '#ECE7DD', shoeDeep: '#B9B2A6', sole: '#6F675C', skin: '#E9B894', trim: '#9FE3EE'};
export const LOOK_G3: Look3 = {style: 'guard', dims: DIM_G3, top: '#3E5578', topDeep: '#2A3C59', under: '#2A3C59', pants: '#1C2335', shoe: '#1A1B21', shoeDeep: '#0E0F13', sole: '#2E2F35', skin: '#C68E66', trim: '#E8B84A'};

export type Arm3 = {W?: V3; hand: HandPose; dir?: V3; palm?: V3; pole?: V3};
export type Pose3 = {
  pos: V3; // pelvis ground point (y ignored)
  yaw: number; // hip heading (0 = +z, + toward +x)
  crouch: number; // 0 standing .. 1 deep crouch (desired pelvis height and spine fold)
  lean: number; // extra forward bend of the back (rad)
  side: number; // lateral bend (rad, + toward the body's right)
  twist: number; // shoulder heading relative to the hips (rad)
  bob: number; // pelvis vertical offset (m)
  shrug: number; // shoulders raised (m)
  headYaw: number; // absolute head heading (rad, same convention as yaw)
  headPitch: number; // absolute head pitch (rad, + looks down)
  headRoll: number;
  feet: {l: FootState; r: FootState};
  R: Arm3; L: Arm3;
  carriage: number; // free arms: 0 hang .. 1 running (elbows bent, pumping)
  expr: HeadExpr; blink: number; sway: number; lift?: number;
  hem?: V3; // jacket hem lag (world offset, m)
  torch?: boolean; // the guard's torch in his right hand
  cuffs?: CuffsState;
};

export const ik3 = (A: V3, T: V3, l1: number, l2: number, pole: V3) => {
  const d0 = s3(T, A);
  const dist = Math.max(0.02, Math.min(l3(d0), (l1 + l2) * 0.998));
  const dir = n3(d0);
  const E = a3(A, m3(dir, dist));
  const a = (l1 * l1 + dist * dist - l2 * l2) / (2 * dist);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let p = s3(pole, m3(dir, d3(pole, dir)));
  if (l3(p) < 1e-6) p = c3(dir, v3(0, 1, 0));
  p = n3(p);
  return {M: a3(a3(A, m3(dir, a)), m3(p, h)), E};
};
const rotA = (v: V3, axis: V3, ang: number) => a3(a3(m3(v, Math.cos(ang)), m3(c3(axis, v), Math.sin(ang))), m3(axis, d3(axis, v) * (1 - Math.cos(ang))));

export const joints3 = (pz: Pose3, D: Dims3) => {
  const F = fwdOf(pz.yaw);
  const Rv = v3(Math.cos(pz.yaw), 0, -Math.sin(pz.yaw));
  const U = v3(0, 1, 0);
  const cr = clamp(pz.crouch);
  // pelvis: desired height, then lowered until both planted legs reach their feet (weight on the legs, no stretch)
  let py = lerp(D.hip, D.hipCrouch, cr) + pz.bob;
  const base = a3(v3(pz.pos.x, 0, pz.pos.z), m3(F, -0.13 * cr));
  const Lmax = (D.thigh + D.shin) * 0.985;
  // (weights fade continuously through each swing, and the limit is a smooth minimum, so the pelvis never snaps)
  const smin = (a: number, b: number, k: number) => {
    const h = clamp(0.5 + (0.5 * (b - a)) / k);
    return lerp(b, a, h) - k * h * (1 - h);
  };
  (['l', 'r'] as const).forEach((k) => {
    const f = pz.feet[k];
    // a planted foot lets go as its heel peels (pitch -0.5 at lift-off); a swinging foot takes weight just before landing
    const w = f.contact > 0 ? clamp(1 + 1.2 * Math.min(0, f.pitch)) : f.swing > 0.6 ? (f.swing - 0.6) / 0.4 : 0;
    if (w <= 0) return;
    const hp = a3(base, m3(Rv, (k === 'r' ? 1 : -1) * D.hipW));
    const dx = hp.x - f.ank.x, dz = hp.z - f.ank.z;
    const dh = Math.hypot(dx, dz);
    const maxY = f.ank.y + Math.sqrt(Math.max(0, Lmax * Lmax - dh * dh));
    py = lerp(py, smin(py, maxY, 0.07), w * w * (3 - 2 * w));
  });
  const P = a3(base, v3(0, py, 0));
  // spine: lumbar and thoracic segments
  const lumbarA = pz.lean * 0.35 + cr * 0.32, thorA = pz.lean + cr * 0.55;
  const bend = (a: number) => n3(a3(a3(m3(U, Math.cos(a)), m3(F, Math.sin(a))), m3(Rv, Math.sin(pz.side))));
  const lum = bend(lumbarA), thor = bend(thorA);
  const Wst = a3(P, m3(lum, D.torso * 0.42));
  const S = a3(Wst, m3(thor, D.torso * 0.58));
  const Fs = fwdOf(pz.yaw + pz.twist);
  const Rs = v3(Math.cos(pz.yaw + pz.twist), 0, -Math.sin(pz.yaw + pz.twist));
  const neckDir = n3(a3(m3(thor, 0.55), m3(U, 0.45)));
  const N = a3(S, m3(neckDir, D.neck));
  // head frame: absolute heading and pitch, then roll
  let hF = fwdOf(pz.headYaw), hR = v3(Math.cos(pz.headYaw), 0, -Math.sin(pz.headYaw));
  let hU = U;
  hF = rotA(hF, hR, pz.headPitch);
  hU = rotA(hU, hR, pz.headPitch);
  hR = rotA(hR, hF, pz.headRoll);
  hU = rotA(hU, hF, pz.headRoll);
  const Hc = a3(a3(N, m3(neckDir, D.headR * 0.55)), m3(hU, D.headR * 0.62));
  // shoulders
  const shU = m3(U, pz.shrug);
  const sh = {r: a3(a3(a3(S, m3(Rs, D.shW)), m3(thor, -0.03)), shU), l: a3(a3(a3(S, m3(Rs, -D.shW)), m3(thor, -0.03)), shU)};
  const hip = {r: a3(P, m3(Rv, D.hipW)), l: a3(P, m3(Rv, -D.hipW))};
  // legs: knee pole along the foot's heading (knee over the toes), slight outward splay
  const leg = (k: 'l' | 'r') => {
    const f = pz.feet[k];
    const ff = fwdOf(f.yaw);
    const sd = k === 'r' ? 1 : -1;
    const pole = n3(a3(a3(ff, m3(Rv, sd * (0.08 + cr * 0.12))), v3(0, 0.05, 0)));
    const {M, E} = ik3(hip[k], f.ank, D.thigh, D.shin, pole);
    return {H: hip[k], K: M, A: E, yaw: f.yaw, pitch: f.pitch};
  };
  // arms: free arms hang or pump against the opposite leg; held arms reach their targets
  const L_ = leg('l'), R_ = leg('r');
  const fwdOff = (A: V3) => d3(s3(A, P), F);
  const arm = (k: 'R' | 'L', c: Arm3) => {
    const s = k === 'R' ? 1 : -1;
    const Sh = s > 0 ? sh.r : sh.l;
    const out = m3(Rs, s);
    let W: V3;
    let fkPole: V3 | undefined;
    if (c.W) W = c.W;
    else {
      // free arm, forward kinematics: the upper arm swings about the shoulder against the opposite leg, the elbow
      // flexes (slightly when walking, about 90 degrees when running)
      const opp = k === 'R' ? L_.A : R_.A;
      const run = pz.carriage;
      const swing = clamp(fwdOff(opp) * lerp(1.15, 1.25, run), -lerp(0.42, 0.62, run), lerp(0.42, 0.58, run));
      const down = m3(thor, -1);
      const upDir = n3(a3(rotA(down, Rs, -swing), m3(out, lerp(0.1, 0.16, run))));
      const flex = lerp(0.22, 1.62, run) + lerp(0.12, 0.25, run) * Math.max(0, swing);
      const foreDir = n3(rotA(upDir, Rs, -flex));
      const E0 = a3(Sh, m3(upDir, D.upper));
      W = a3(E0, m3(foreDir, D.fore));
      fkPole = n3(s3(E0, m3(a3(Sh, W), 0.5)));
    }
    // keep the hand out of the torso: push it out of the chest cylinder
    const rel = s3(W, P);
    const ax = d3(rel, thor);
    if (ax > 0.05 && ax < D.torso * 1.05) {
      const radial = s3(rel, m3(thor, ax));
      const rx = d3(radial, Rs), rz = d3(radial, Fs);
      const A = D.rings.chestA + 0.03, B = D.rings.chestB + 0.035;
      const e = (rx / A) ** 2 + (rz / B) ** 2;
      if (e < 1) {
        const k2 = 1 / Math.sqrt(Math.max(1e-6, e));
        W = a3(a3(a3(P, m3(thor, ax)), m3(Rs, rx * k2)), m3(Fs, rz * k2));
      }
    }
    // elbow: points back, down and out (never forward or through the chest)
    const pole = c.pole ?? fkPole ?? n3(a3(a3(m3(Fs, -0.55), m3(U, -0.7)), m3(out, 0.55)));
    const {M, E} = ik3(Sh, W, D.upper, D.fore, pole);
    const fd = n3(s3(E, M));
    const hd = c.dir ?? fd;
    return {S: Sh, E: M, W: E, dir: hd, palm: c.palm ?? n3(c3(hd, m3(Rs, s))), hand: c.hand};
  };
  return {F, Rv, U, P, Wst, S, N, Hc, hF, hR, hU, lum, thor, neckDir, Rs, Fs, sh, hip, legs: {l: L_, r: R_}, R: arm('R', pz.R), L: arm('L', pz.L)};
};
export type Joints3 = ReturnType<typeof joints3>;

const ring = (c: V3, ax: V3, az: V3, a: number, bb: number, n = 18): V3[] => circle3(c, ax, az, a, n, bb);
const sphere = (c: V3, r: number, n = 10): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < n; i++) for (let j = 1; j < 4; j++) {
    const az = (i / n) * Math.PI * 2, el = -Math.PI / 2 + (j / 4) * Math.PI;
    out.push(v3(c.x + r * Math.cos(el) * Math.cos(az), c.y + r * Math.sin(el), c.z + r * Math.cos(el) * Math.sin(az)));
  }
  out.push(v3(c.x, c.y + r, c.z), v3(c.x, c.y - r, c.z));
  return out;
};

/** the shoe in the foot's frame: points of the sole, the upper and the collar (metres, relative to the ankle) */
const shoePts = (D: Dims3['foot'], A: V3, yaw: number, pitch: number) => {
  const f0 = fwdOf(yaw), l0 = v3(Math.cos(yaw), 0, -Math.sin(yaw));
  const f = rotA(f0, l0, -pitch), u = rotA(v3(0, 1, 0), l0, -pitch);
  const P = (x: number, y: number, z: number) => a3(a3(a3(A, m3(f, x)), m3(u, y)), m3(l0, z));
  const prof: [number, number, number][] = [ // along the foot: x, half width, upper height above the sole
    [-D.heel - 0.012, 0.03, D.h * 1.02], [-D.heel * 0.5, D.w * 0.82, D.h * 1.0], [0.02, D.w * 0.92, D.h * 0.86], [D.ball * 0.6, D.w, D.h * 0.62],
    [D.ball, D.w * 1.02, D.h * 0.5], [D.len * 0.88, D.w * 0.85, D.h * 0.42], [D.len, D.w * 0.45, D.h * 0.32],
  ];
  const y0 = -D.ankH;
  const bottom: V3[] = [], sole: V3[] = [], top: V3[] = [];
  prof.forEach(([x, w, h]) => {
    [1, -1].forEach((sd) => {
      bottom.push(P(x, y0, sd * w));
      sole.push(P(x, y0 + 0.02, sd * w * 1.02));
      top.push(P(x, y0 + h, sd * w * 0.78));
    });
  });
  top.push(P(D.len + 0.008, y0 + 0.012, 0));
  const collar = circle3(P(-0.01, y0 + D.h * 1.08, 0), f, l0, 0.048, 10, 0.04);
  const lace = [P(0.03, y0 + D.h * 0.86, 0), P(D.ball * 0.75, y0 + D.h * 0.58, 0)];
  return {bottom, sole, top, collar, lace, toe: P(D.len, y0 + 0.02, 0), heel: P(-D.heel - 0.012, y0 + 0.02, 0)};
};

export const Person3: React.FC<{id: string; b: Basis; pz: Pose3; look: Look3; shadow?: boolean; light?: number; hideHead?: boolean}> = ({id, b, pz, look, shadow = true, light = 0, hideHead}) => {
  const D = look.dims;
  const j = joints3(pz, D);
  const pr = (p: V3) => proj(b, p);
  const dep = (p: V3) => pr(p).d;
  // any key joint at or behind the camera plane: the figure is not drawn (a part behind the camera would project
  // to an arbitrarily large shape)
  const keyJ = [j.P, j.S, j.Hc, j.R.W, j.L.W, j.R.E, j.L.E, j.legs.l.A, j.legs.r.A, j.legs.l.K, j.legs.r.K];
  if (Math.min(...keyJ.map(dep)) < 0.06) return null;
  const kP = pr(j.P).k;
  const OUT = Math.max(1.2, Math.min(9, 0.012 * kP)), IN = OUT * 0.75;
  const camDir = b.fwd;
  const facing = -d3(j.Fs, camDir);
  const isG = look.style === 'guard';
  const R_ = D.rings;
  // ---- torso: rings along the two spine segments, turning from the hip heading to the shoulder heading
  const latAt = (k: number) => n3(a3(m3(j.Rv, 1 - k), m3(j.Rs, k)));
  const axisAt = (k: number) => (k < 0.42 ? j.lum : j.thor);
  const ptAt = (k: number) => (k < 0.42 ? a3(j.P, m3(j.lum, D.torso * k)) : a3(j.Wst, m3(j.thor, D.torso * (k - 0.42))));
  const depAt = (k: number) => n3(c3(latAt(k), axisAt(k)));
  const ringAt = (k: number, a: number, bb: number, off: V3 = v3(0, 0, 0), n = 18) => ring(a3(ptAt(k), off), latAt(k), depAt(k), a, bb, n);
  const hem = pz.hem ?? v3(0, 0, 0);
  const P2 = (ps: V3[]) => ps.map(pr);
  const hipsHull = smoothClosed(hull(P2([...ringAt(0.0, R_.hipA, R_.hipB), ...ringAt(0.3, R_.waistA * 1.02, R_.waistB * 1.02),
    ...circle3(a3(j.hip.r, m3(j.U, -0.06)), j.Rv, j.F, D.limb.leg[0], 8), ...circle3(a3(j.hip.l, m3(j.U, -0.06)), j.Rv, j.F, D.limb.leg[0], 8)])), 0.12);
  const jLo = smoothClosed(hull(P2([...ringAt(0.04, R_.hipA * 1.05, R_.hipB * 1.06, hem), ...ringAt(0.42, R_.waistA, R_.waistB), ...ringAt(0.66, R_.chestA, R_.chestB)])), 0.13);
  const delt = (s: V3) => sphere(s, D.limb.up[0] * 1.25, 10);
  const jUp = smoothClosed(hull(P2([...ringAt(0.62, R_.chestA, R_.chestB), ...ringAt(0.9, R_.shA, R_.shB), ...ringAt(1.0, R_.shA * 0.7, R_.shB * 0.85), ...delt(j.sh.r), ...delt(j.sh.l)])), 0.13);
  const torsoDepth = dep(a3(j.Wst, m3(j.thor, D.torso * 0.25)));
  // ---- limb segments (each sorted on its own)
  type Item = {d: number; node: React.ReactNode};
  const items: Item[] = [];
  const front = (d: number) => d < torsoDepth - 0.025;
  const px = (p: V3, r: number) => r * pr(p).k;
  const legItems = (k: 'l' | 'r') => {
    const g = j.legs[k];
    const [ra, rb, rc] = D.limb.leg;
    const H = pr(g.H), K = pr(g.K), A = pr(g.A);
    const mid = (a: V3, c: V3) => v3((a.x + c.x) / 2, (a.y + c.y) / 2, (a.z + c.z) / 2);
    const thighM = mid(g.H, g.K), shinM = mid(g.K, g.A);
    items.push({d: dep(thighM), node: (
      <Inked key={`th${k}`} w={IN}>
        <Limb id={`${id}-th${k}`} A={H} B={pr(mid(g.H, g.K))} C={K} rA={px(g.H, ra)} rB={px(thighM, (ra + rb) / 2)} rC={px(g.K, rb)} color={look.pants} spec={0.08} capA="flat" />
      </Inked>
    )});
    const sh = shoePts(D.foot, g.A, g.yaw, g.pitch);
    const upper = hull(P2([...sh.top, ...sh.sole, ...sh.collar]));
    const soleH = hull(P2([...sh.bottom, ...sh.sole]));
    const lace = P2(sh.lace);
    items.push({d: dep(shinM), node: (
      <g key={`sn${k}`}>
        <Inked w={IN}>
          <Limb id={`${id}-sn${k}`} A={K} B={pr(shinM)} C={A} rA={px(g.K, rb)} rB={px(shinM, (rb + rc) / 2)} rC={px(g.A, rc)} color={look.pants} spec={0.08} />
        </Inked>
        <Inked w={IN}>
          <InkPath d={smoothClosed(upper, 0.12)} fill={look.shoe} />
          <InkPath d={smoothClosed(soleH, 0.1)} fill={look.sole} />
        </Inked>
        <Deco>
          <path d={`M${fmt(lace[0].x)},${fmt(lace[0].y)} L${fmt(lace[1].x)},${fmt(lace[1].y)}`} stroke={look.shoeDeep} strokeWidth={Math.max(1, px(g.A, 0.012))} strokeLinecap="round" />
        </Deco>
      </g>
    )});
  };
  const armItems = (k: 'R' | 'L') => {
    const a = j[k];
    const [ra, rb, rc] = D.limb.up;
    const S2 = pr(a.S), E2 = pr(a.E), W2 = pr(a.W);
    const um = v3((a.S.x + a.E.x) / 2, (a.S.y + a.E.y) / 2, (a.S.z + a.E.z) / 2);
    const fm = v3((a.E.x + a.W.x) / 2, (a.E.y + a.W.y) / 2, (a.E.z + a.W.z) / 2);
    const cuff = a3(a.W, m3(n3(s3(a.E, a.W)), 0.03));
    items.push({d: dep(um), node: (
      <Inked key={`ua${k}`} w={IN}>
        <Limb id={`${id}-ua${k}`} A={S2} B={pr(um)} C={E2} rA={px(a.S, ra * 1.12)} rB={px(um, (ra + rb) * 0.56)} rC={px(a.E, rb * 1.1)} color={look.top} spec={0.15} />
      </Inked>
    )});
    // hand
    const tip = pr(a3(a.W, m3(a.dir, 0.1)));
    const ang = (Math.atan2(tip.y - W2.y, tip.x - W2.x) * 180) / Math.PI;
    const projLen = Math.hypot(tip.x - W2.x, tip.y - W2.y) / 0.1;
    const Lpx = Math.max(0.6, Math.min(1, projLen / pr(a.W).k)) * D.hand * pr(a.W).k;
    const palmVis = -d3(a.palm, camDir) > 0;
    const side = k === 'R' ? 1 : -1;
    const thumbW = n3(c3(a.palm, a.dir));
    const th2 = pr(a3(a.W, m3(thumbW, side * 0.05)));
    const cr2 = (tip.x - W2.x) * (th2.y - W2.y) - (tip.y - W2.y) * (th2.x - W2.x);
    const ts = (cr2 > 0 ? 1 : -1) as 1 | -1;
    const torch = isG && pz.torch && k === 'R';
    const torchNode = torch ? (() => {
      const t0 = pr(a3(a.W, m3(a.dir, -0.05))), t1 = pr(a3(a.W, m3(a.dir, 0.15))), t2 = pr(a3(a.W, m3(a.dir, 0.24)));
      const lens = a3(a.W, m3(a.dir, 0.245));
      const facingLens = -d3(a.dir, camDir);
      const lr = px(lens, 0.034);
      return (
        <g>
          <Inked w={IN}>
            <Capsule id={`${id}-tb`} a={t0} b={t1} ra={px(a.W, 0.021)} rb={px(a.W, 0.022)} color="#2A2D35" k={1.2} spec={0.35} />
            <Capsule id={`${id}-th`} a={t1} b={t2} ra={px(a.W, 0.027)} rb={px(a.W, 0.035)} color="#3A3E48" k={1.2} spec={0.4} />
          </Inked>
          {facingLens > 0.15 && <ellipse cx={fmt(pr(lens).x)} cy={fmt(pr(lens).y)} rx={fmt(lr)} ry={fmt(lr * Math.max(0.2, facingLens))} fill="#FFF6D8" opacity={0.95} />}
        </g>
      );
    })() : null;
    const cuffsInHand = k === 'L' && pz.cuffs && pz.cuffs.where === 'hand';
    items.push({d: dep(fm), node: (
      <g key={`fa${k}`}>
        <Inked w={IN}>
          <Limb id={`${id}-fa${k}`} A={E2} B={pr(fm)} C={pr(cuff)} rA={px(a.E, rb * 1.1)} rB={px(fm, (rb + rc) * 0.56)} rC={px(a.W, rc * 1.15)} color={look.top} spec={0.15} capC="flat" />
        </Inked>
        {torchNode}
        {cuffsInHand && <Cuffs id={`${id}-cf`} b={b} st={pz.cuffs!} wrist={a.W} dir={a.dir} palm={a.palm} ink={IN} />}
        <Inked w={IN}>
          <Hand id={`${id}-h${k}`} wrist={W2} ang={ang} L={Lpx} thumbSide={ts} view={palmVis ? 'palm' : 'back'} pose={a.hand} color={look.skin} ink={IN * 0.9} />
        </Inked>
      </g>
    )});
  };
  legItems('l'); legItems('r'); armItems('R'); armItems('L');
  // ---- torso details
  const frontPt = (k: number, latOff: number, out = 1.0) => a3(a3(ptAt(k), m3(depAt(k), (k > 0.6 ? R_.chestB : R_.waistB) * out)), m3(latAt(k), latOff));
  const details: React.ReactNode[] = [];
  if (!isG) {
    if (facing > 0.05) {
      const v1 = pr(frontPt(0.98, -0.055, 0.95)), v2 = pr(frontPt(0.98, 0.055, 0.95)), v3_ = pr(frontPt(0.76, 0, 1.0));
      details.push(<path key="v" d={`M${fmt(v1.x)},${fmt(v1.y)} L${fmt(v3_.x)},${fmt(v3_.y)} L${fmt(v2.x)},${fmt(v2.y)} Z`} fill={look.under} stroke={INK} strokeWidth={IN * 0.7} strokeLinejoin="round" opacity={clamp(facing * 5)} />);
      const z1 = pr(frontPt(0.76, 0.004)), z2 = pr(frontPt(0.06, 0.004, 1.05));
      details.push(<path key="z" d={`M${fmt(z1.x)},${fmt(z1.y)} L${fmt(z2.x)},${fmt(z2.y)}`} stroke={look.topDeep} strokeWidth={IN * 0.9} opacity={clamp(facing * 5)} />);
    }
    const col = ring(a3(j.S, m3(j.thor, 0.03)), j.Rs, n3(c3(j.Rs, j.thor)), 0.072, 0.058, 14).map(pr);
    details.push(<path key="col" d={smoothClosed(hull(col), 0.15)} fill={look.topDeep} stroke={INK} strokeWidth={IN * 0.7} />);
    // jacket hem band
    const hb = ringAt(0.04, R_.hipA * 1.06, R_.hipB * 1.07, hem, 24).map(pr), ht = ringAt(0.1, R_.hipA * 1.03, R_.hipB * 1.04, hem, 24).map(pr);
    details.push(<path key="hem" d={smoothClosed(hull([...hb, ...ht]), 0.1)} fill={look.topDeep} opacity={0.55} />);
  } else {
    const bl = ringAt(0.08, R_.waistA * 1.13, R_.waistB * 1.13, v3(0, 0, 0), 24).map(pr);
    const bh = ringAt(0.15, R_.waistA * 1.13, R_.waistB * 1.13, v3(0, 0, 0), 24).map(pr);
    details.push(<path key="belt" d={smoothClosed(hull([...bl, ...bh]), 0.1)} fill="#121418" stroke={INK} strokeWidth={IN * 0.6} />);
    // cuff pouch on the left hip and the radio on the right chest
    const pouch = a3(a3(ptAt(0.11), m3(latAt(0.11), -R_.waistA * 1.12)), m3(depAt(0.11), 0.02));
    const pouchVis = -d3(n3(a3(m3(latAt(0.11), -1), m3(depAt(0.11), 0.3))), camDir);
    if (pouchVis > -0.2) {
      const pp = hull(P2([...circle3(pouch, depAt(0.11), j.thor, 0.05, 10, 0.045), ...circle3(a3(pouch, m3(latAt(0.11), -0.03)), depAt(0.11), j.thor, 0.05, 10, 0.045)]));
      details.push(<path key="pouch" d={smoothClosed(pp, 0.12)} fill="#17191F" stroke={INK} strokeWidth={IN * 0.6} />);
    }
    if (facing > 0.05) {
      const bd = pr(frontPt(0.8, -0.1)), s = px(j.S, 0.03);
      details.push(<path key="badge" d={`M${fmt(bd.x)},${fmt(bd.y - s)} L${fmt(bd.x + s * 0.8)},${fmt(bd.y - s * 0.3)} L${fmt(bd.x + s * 0.55)},${fmt(bd.y + s * 0.8)} L${fmt(bd.x - s * 0.55)},${fmt(bd.y + s * 0.8)} L${fmt(bd.x - s * 0.8)},${fmt(bd.y - s * 0.3)} Z`} fill={look.trim} stroke={INK} strokeWidth={IN * 0.6} />);
      const z1 = pr(frontPt(0.95, 0)), z2 = pr(frontPt(0.16, 0));
      details.push(<path key="pl" d={`M${fmt(z1.x)},${fmt(z1.y)} L${fmt(z2.x)},${fmt(z2.y)}`} stroke={look.topDeep} strokeWidth={IN * 0.6} opacity={0.7} />);
      const rd = pr(frontPt(0.82, 0.1));
      details.push(<rect key="radio" x={fmt(rd.x - s * 0.5)} y={fmt(rd.y - s * 0.9)} width={fmt(s)} height={fmt(s * 1.6)} rx={fmt(s * 0.2)} fill="#16181E" stroke={INK} strokeWidth={IN * 0.5} />);
      const bk = pr(frontPt(0.115, 0, 1.13)), s2 = px(j.P, 0.022);
      details.push(<rect key="buckle" x={fmt(bk.x - s2)} y={fmt(bk.y - s2 * 0.7)} width={fmt(s2 * 2)} height={fmt(s2 * 1.4)} fill="#B9BCC4" stroke={INK} strokeWidth={IN * 0.4} />);
    }
  }
  const cuffsOnBelt = isG && pz.cuffs && pz.cuffs.where === 'belt';
  // ---- neck and head
  const nA = pr(a3(j.S, m3(j.thor, -0.02))), nB = pr(a3(j.N, m3(j.neckDir, 0.04)));
  const hp = pr(j.Hc);
  const head = hideHead ? null : <HeadV3 id={`${id}-hd`} b={b} c={{x: hp.x, y: hp.y}} R={D.headR * hp.k} F={j.hF} Rt={j.hR} U={j.hU} style={look.style} e={pz.expr} blink={pz.blink} sway={pz.sway} lift={pz.lift ?? 0} inkW={OUT * 0.8} />;
  const jc = pr(j.S);
  const core = (
    <g key="core">
      <Inked w={IN}>
        <InkPath d={hipsHull} fill={look.pants} />
      </Inked>
      <Inked w={IN}>
        <Capsule id={`${id}-nk`} a={nA} b={nB} ra={px(j.N, 0.048)} rb={px(j.N, 0.043)} color={shade(look.skin, 0.12)} />
      </Inked>
      <Inked w={IN}>
        <InkPath d={jLo} fill={`url(#${id}-jk)`} />
        <InkPath d={jUp} fill={`url(#${id}-jk)`} />
      </Inked>
      <Deco>{details}</Deco>
      {cuffsOnBelt && <Cuffs id={`${id}-cb`} b={b} st={pz.cuffs!} wrist={a3(a3(ptAt(0.06), m3(latAt(0.06), -R_.waistA * 1.16)), m3(depAt(0.06), -0.03))} dir={v3(0, -1, 0)} palm={latAt(0.06)} ink={IN} />}
    </g>
  );
  const behind = items.filter((p) => !front(p.d)).sort((x, y) => y.d - x.d);
  const before = items.filter((p) => front(p.d)).sort((x, y) => y.d - x.d);
  // the head goes over the torso; a near arm raised in front of the face still covers it
  const headDepth = dep(j.Hc);
  const beforeHead = before.filter((p) => p.d > headDepth - 0.04);
  const afterHead = before.filter((p) => p.d <= headDepth - 0.04);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-jk`} gradientUnits="userSpaceOnUse" cx={fmt(jc.x - 0.12 * jc.k)} cy={fmt(jc.y)} r={fmt(Math.min(6000, 0.6 * jc.k))}>
          <stop offset="0" stopColor={lit(look.top, 0.22 + light * 0.3)} />
          <stop offset="0.6" stopColor={look.top} />
          <stop offset="1" stopColor={look.topDeep} />
        </radialGradient>
      </defs>
      {shadow && (() => {
        const pts = projPoly(b, circle3(v3(j.P.x, 0.004, j.P.z), v3(1, 0, 0), v3(0, 0, 1), 0.3 + 0.05 * pz.crouch, 20, 0.24));
        if (pts.length < 3) return null;
        return <path d={`M${pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join('L')}Z`} fill="#000" opacity={0.3} style={{filter: 'blur(2px)'}} />;
      })()}
      <Inked w={OUT}>
        {behind.map((p) => p.node)}
        {core}
        {beforeHead.map((p) => p.node)}
      </Inked>
      {head}
      {afterHead.length > 0 && <Inked w={OUT}>{afterHead.map((p) => p.node)}</Inked>}
    </g>
  );
};
export type {V2};
