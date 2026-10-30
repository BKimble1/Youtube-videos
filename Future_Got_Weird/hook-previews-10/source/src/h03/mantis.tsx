// HOOK 03: a green praying mantis (Hierodula-like, about 78 mm long) built in world millimetres and drawn in the FGW
// finish (one ink contour per part, gradient fills from the upper-left key light). Body frame: x forward, y left,
// z dorsal; the origin is the joint between the prothorax and the mesothorax.
// Anatomy: triangular mobile head (two large compound eyes at the outer upper corners, thread-like antennae between
// them, short palps below), a long narrow prothorax raised in front, the two raptorial forelegs attached under the
// FRONT of the prothorax (long coxa, thick spined femur, the spined tibia folded into the femur, a small tarsus),
// mid and hind legs attached under the meso- and metathorax (coxa, femur, tibia, two-part tarsus), forewings folded
// flat over a long segmented abdomen that is wider than the thorax, and two short cerci at the tip.
import React from 'react';
import {add3, Basis, dot3, hull, len3, lerp3, mul3, norm3, P2, proj, smoothClosed, smoothOpen, spline3, sub3, V3} from '../shared/three';
import {capsuleItem, ellipsoidItem, ellipsoidPath, inkW, Item, resample} from './core/draw3';
import {tubeItem} from './core/tube';
import {Frame, dirW, pitchF, rollF, toW, yawF, frame} from './core/frame';
import {lit, mix, shade} from '../shared/color';
import {INK} from '../shared/ink';

const f2 = (n: number) => n.toFixed(2);
const rad = (d: number) => (d * Math.PI) / 180;

export const MCOL = {
  body: '#7FAE3F',
  thorax: '#86B446',
  abd: '#7AA83E',
  stern: '#9DBF55',
  wing: '#8EBF4F',
  costa: '#B7D66C',
  stigma: '#F2EDC6',
  eye: '#A8CB60',
  pupil: '#26361C',
  leg: '#7AAA3D',
  spine: '#3E2F1C',
  face: '#9BBB58',
  ant: '#6C9436',
  membrane: '#E7D9B0',
};

export type LegAng = {a: number; b: number; a2: number; b2: number; a3: number; b3: number};
export type MState = {
  body: Frame;
  raise: number; // prothorax raised above the body axis (deg)
  headPitch: number; // nose down + (deg, relative to the body)
  headYaw: number; // toward the viewer - (deg)
  fore: {f: number; open: number}[]; // raptorial legs [right, left]: femur angle above the prothorax axis, tibia opening
  legs: LegAng[]; // [mid R, mid L, hind R, hind L]
  antW: number; // antenna sway phase
  tint: number; // 0 dry .. 1 underwater tint
  slack: number; // 0 full abdomen .. 1 emptied (slightly flatter) as the worm leaves
  part: number; // 0 closed .. 1 the last segments parted at the tip (membrane showing)
};

/** the body frame from position and yaw, pitch (nose down +), roll */
export const bodyFrame = (o: V3, yaw: number, pitch: number, roll: number): Frame => {
  let F = frame(o, [1, 0, 0], [0, 0, 1]);
  F = yawF(F, yaw);
  F = pitchF(F, pitch);
  F = rollF(F, roll);
  return F;
};
export const proFrame = (st: MState): Frame => pitchF(st.body, -st.raise);

// abdomen and thorax ellipsoids (body coordinates)
export const ABD = {c: [-29.8, 0, 0.3] as V3, a: [19.2, 4.7, 3.5] as V3};
export const THX = {c: [-5.6, 0, -0.1] as V3, a: [6.4, 2.6, 2.4] as V3};
/** the exit point of the worm (between the last segments, ventral of the cerci) and its outward direction */
export const EXIT_L: V3 = [-48.6, 0, -0.2];
export const EXIT_D: V3 = norm3([-1, 0, -0.12]);

const abdA = (st: MState): V3 => [ABD.a[0], ABD.a[1] * (1 - 0.05 * st.slack), ABD.a[2] * (1 - 0.12 * st.slack)];
export const abdCenterW = (st: MState) => toW(st.body, ABD.c);
export const abdPath = (B: Basis, st: MState) => {
  const F = st.body, a = abdA(st);
  return ellipsoidPath(B, toW(F, ABD.c), [mul3(F.f, a[0]), mul3(F.l, a[1]), mul3(F.u, a[2])]);
};

/** cross-section of the body (thorax or abdomen ellipsoid) at body x: half width, half height, centre z */
const section = (st: MState, x: number) => {
  const a = abdA(st);
  const qa = 1 - ((x - ABD.c[0]) / a[0]) ** 2, qt = 1 - ((x - THX.c[0]) / THX.a[0]) ** 2;
  const sa = {ry: a[1] * Math.sqrt(Math.max(0, qa)), rz: a[2] * Math.sqrt(Math.max(0, qa)), zc: ABD.c[2]};
  const sth = {ry: THX.a[1] * Math.sqrt(Math.max(0, qt)), rz: THX.a[2] * Math.sqrt(Math.max(0, qt)), zc: THX.c[2]};
  return sa.rz >= sth.rz ? sa : sth;
};

/** visible arc of a body ring (segment rim) on the lower half (below the wings) */
const rimPath = (B: Basis, F: Frame, x: number, ry: number, rz: number, zc: number) => {
  let d = '';
  let on = false;
  for (let k = 0; k <= 30; k++) {
    const th = Math.PI * (1.02 + (k / 30) * 0.96); // the underside half, from one flank to the other
    const n = add3(mul3(F.l, Math.cos(th)), mul3(F.u, Math.sin(th)));
    const p = toW(F, [x, ry * Math.cos(th), zc + rz * Math.sin(th)]);
    if (dot3(n, sub3(B.eye, p)) > 0) {
      d += `${on ? ' L' : ' M'}${P2(proj(B, p))}`;
      on = true;
    } else on = false;
  }
  return d;
};

const sph = (a: number, b: number, s: number): V3 => [Math.cos(rad(b)) * Math.cos(rad(a)), s * Math.cos(rad(b)) * Math.sin(rad(a)), Math.sin(rad(b))];

export type MantisOut = {items: Item[]; abdZ: number; wingZ: number};

export const mantisItems = (B: Basis, st: MState): MantisOut => {
  const F = st.body;
  const T = (c: string) => mix(c, '#3C7E7A', 0.16 * st.tint);
  const items: Item[] = [];
  const bw = (p: V3) => toW(F, p);
  // ---- thorax (meso + meta) and abdomen
  items.push(ellipsoidItem(B, bw(THX.c), [mul3(F.f, THX.a[0]), mul3(F.l, THX.a[1]), mul3(F.u, THX.a[2])], T(MCOL.thorax), {spec: 0}));
  const a = abdA(st);
  const rims: string[] = [];
  for (let k = 0; k < 8; k++) {
    const x = -13.5 - k * 4.4;
    const q = 1 - ((x - ABD.c[0]) / a[0]) ** 2;
    if (q <= 0) continue;
    rims.push(rimPath(B, F, x, a[1] * Math.sqrt(q) * 1.01, a[2] * Math.sqrt(q) * 1.01, ABD.c[2]));
  }
  const sA = proj(B, bw(ABD.c)).s;
  const abdItem = ellipsoidItem(B, bw(ABD.c), [mul3(F.f, a[0]), mul3(F.l, a[1]), mul3(F.u, a[2])], T(MCOL.abd), {
    spec: 0,
    deco: (
      <g>
        {/* paler sternites on the underside */}
        <path d={smoothClosed(Array.from({length: 24}, (_, i) => {
          const u = i / 23;
          const x = ABD.c[0] + a[0] * (0.9 - 1.8 * u);
          const sc = section(st, x);
          return proj(B, bw([x, -sc.ry * 0.55, sc.zc - sc.rz * 0.85]));
        }).concat(Array.from({length: 24}, (_, i) => {
          const u = 1 - i / 23;
          const x = ABD.c[0] + a[0] * (0.9 - 1.8 * u);
          const sc = section(st, x);
          return proj(B, bw([x, -sc.ry * 1.0, sc.zc - sc.rz * 0.15]));
        })))} fill={T(MCOL.stern)} opacity={0.55} />
        {rims.map((d, k) => <path key={k} d={d} fill="none" stroke={shade(T(MCOL.abd), 0.55)} strokeWidth={f2(Math.max(0.8, 0.16 * sA))} strokeLinecap="round" opacity={0.8} />)}
      </g>
    ),
  });
  items.push(abdItem);
  // the parted tip: pale intersegmental membrane bulging between the last plates
  if (st.part > 0.01) {
    const c = bw([EXIT_L[0] + 0.9, 0, EXIT_L[2]]);
    const r = 1.25 * st.part;
    items.push(ellipsoidItem(B, c, [mul3(F.f, r * 0.8), mul3(F.l, r * 1.1), mul3(F.u, r)], T(MCOL.membrane), {spec: 0.6, zBias: -3, ink: inkW(sA, 0.7)}));
  }
  // cerci
  [-1, 1].forEach((s) => {
    const b0 = bw([-47.4, 0.8 * s, 0.9]);
    const b1 = bw([-50.4, 1.6 * s, 2.0]);
    const b2 = bw([-52.4, 2.2 * s, 2.5]);
    items.push(capsuleItem(B, b0, b1, 0.34, 0.24, T(MCOL.abd), {spec: 0.3}));
    items.push(capsuleItem(B, b1, b2, 0.24, 0.12, T(MCOL.abd), {spec: 0.3}));
  });
  // ---- wings (tegmina) folded flat over the abdomen
  let wingZ = 1e9;
  [-1, 1].forEach((s) => {
    const N = 26;
    const x0 = -2.2, x1 = -46.5;
    const inner: V3[] = [], outer: V3[] = [], mid1: V3[] = [], mid2: V3[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = x0 + (x1 - x0) * u;
      const sc = section(st, x);
      const ry = Math.max(sc.ry, 1.2) + 0.45, rz = Math.max(sc.rz, 1.0) + 0.45;
      const phMax = (u < 0.12 ? 30 + 55 * (u / 0.12) : u > 0.82 ? 85 * Math.sqrt(Math.max(0, 1 - ((u - 0.82) / 0.18) ** 2)) : 85) * (Math.PI / 180);
      const pt = (ph: number): V3 => bw([x, s * ry * Math.sin(ph), sc.zc + rz * Math.cos(ph) + (s < 0 ? 0.25 : 0)]);
      const ph0 = s < 0 ? -0.08 : -0.02; // the right wing overlaps the left a little across the midline
      inner.push(pt(ph0 * -s));
      outer.push(pt(phMax));
      mid1.push(pt(phMax * 0.42));
      mid2.push(pt(phMax * 0.72));
    }
    const P = [...inner, ...[...outer].reverse()].map((p) => proj(B, p));
    const d = smoothClosed(P);
    const cW = lerp3(inner[N >> 1], outer[N >> 1], 0.5);
    const C = proj(B, cW);
    const R = Math.max(...P.map((q) => Math.hypot(q.x - C.x, q.y - C.y)));
    const id = `mw${s > 0 ? 'l' : 'r'}`;
    const col = T(MCOL.wing);
    const st0 = proj(B, lerp3(outer[6], inner[6], 0.22)), st1 = proj(B, lerp3(outer[8], inner[8], 0.2));
    const z = C.z - 0.6;
    if (s < 0) wingZ = z;
    items.push({
      z,
      el: (
        <g key={id}>
          <defs>
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(C.x - R * 0.35)} y1={f2(C.y - R * 0.45)} x2={f2(C.x + R * 0.3)} y2={f2(C.y + R * 0.4)}>
              <stop offset="0" stopColor={lit(col, 0.32)} />
              <stop offset="0.5" stopColor={col} />
              <stop offset="1" stopColor={shade(col, 0.35)} />
            </linearGradient>
            <clipPath id={`${id}c`}><path d={d} /></clipPath>
          </defs>
          <path d={d} fill={`url(#${id})`} />
          <g clipPath={`url(#${id}c)`}>
            <path d={smoothOpen(outer.slice(1, -1).map((p) => proj(B, p)))} fill="none" stroke={T(MCOL.costa)} strokeWidth={f2(0.9 * C.s)} strokeLinecap="round" opacity={0.8} />
            <path d={smoothOpen(mid1.slice(2, -2).map((p) => proj(B, p)))} fill="none" stroke={shade(col, 0.3)} strokeWidth={f2(Math.max(0.7, 0.12 * C.s))} opacity={0.7} />
            <path d={smoothOpen(mid2.slice(2, -3).map((p) => proj(B, p)))} fill="none" stroke={lit(col, 0.35)} strokeWidth={f2(Math.max(0.7, 0.1 * C.s))} opacity={0.7} />
            <ellipse cx={f2((st0.x + st1.x) / 2)} cy={f2((st0.y + st1.y) / 2)} rx={f2(Math.hypot(st1.x - st0.x, st1.y - st0.y) * 0.75 + 0.6 * C.s)} ry={f2(0.45 * C.s)} transform={`rotate(${f2((Math.atan2(st1.y - st0.y, st1.x - st0.x) * 180) / Math.PI)} ${f2((st0.x + st1.x) / 2)} ${f2((st0.y + st1.y) / 2)})`} fill={MCOL.stigma} opacity={0.85} />
          </g>
          <path d={d} fill="none" stroke={INK} strokeWidth={f2(inkW(C.s, 1.0))} strokeLinejoin="round" />
        </g>
      ),
    });
  });
  // ---- prothorax
  const Fp = proFrame(st);
  const pw = (p: V3) => toW(Fp, p);
  const PX = [-1.0, 2, 6, 10, 13.5, 16.2, 17.8, 20, 22.2];
  const PR = [2.3, 1.75, 1.45, 1.4, 1.5, 2.1, 2.2, 1.85, 1.5];
  items.push(tubeItem(B, PX.map((x) => pw([x, 0, 0])), PR, T(MCOL.body), {spec: 0.6}));
  // ---- head
  let H = pitchF({...F, o: pw([22.2, 0, 0.6])}, st.headPitch);
  H = yawF(H, st.headYaw);
  const HS = 1.3; // head scale (a Hierodula head is about 8-9 mm across the eyes)
  const hw = (p: V3) => toW(H, mul3(p, HS));
  const hax = (a: V3): [V3, V3, V3] => [mul3(H.f, a[0] * HS), mul3(H.l, a[1] * HS), mul3(H.u, a[2] * HS)];
  items.push(capsuleItem(B, pw([20.5, 0, 0.2]), hw([0.9, 0, 0.2]), 1.15, 1.0, T(MCOL.body), {spec: 0.2}));
  // the head capsule as ONE triangular shape: the hull of a wide vertex, a narrowing face and the mouthparts
  const lobes: [V3, V3][] = [[[1.3, 0, 1.15], [1.2, 2.55, 1.25]], [[1.8, 0, -0.9], [0.9, 1.35, 1.45]], [[2.3, 0, -2.55], [0.55, 0.78, 0.55]]];
  const hp: {x: number; y: number}[] = [];
  lobes.forEach(([c, a]) => {
    for (let i = 0; i < 10; i++) for (let j = 0; j < 16; j++) {
      const th = (i / 9) * Math.PI, ph = (j / 16) * 2 * Math.PI;
      hp.push(proj(B, hw([c[0] + a[0] * Math.sin(th) * Math.cos(ph), c[1] + a[1] * Math.sin(th) * Math.sin(ph), c[2] + a[2] * Math.cos(th)])));
    }
  });
  const hd = smoothClosed(resample(hull(hp), 36));
  const hc = proj(B, hw([1.6, 0, 0]));
  const hR = 3.2 * HS * hc.s;
  const hcol = T(MCOL.face);
  // face marks: the frontal shield between the antennae, three ocelli, the clypeus seam
  const fm = (p: V3) => proj(B, hw(p));
  const fs = [fm([2.45, -0.9, 0.9]), fm([2.65, 0, 0.2]), fm([2.45, 0.9, 0.9])];
  const cl = [fm([2.45, -0.85, -1.95]), fm([2.6, 0, -1.85]), fm([2.45, 0.85, -1.95])];
  const oc = [fm([2.2, 0, 1.75]), fm([2.05, -0.45, 1.95]), fm([2.05, 0.45, 1.95])];
  const fw = Math.max(0.8, 0.09 * hc.s);
  items.push({
    z: hc.z,
    el: (
      <g key="head">
        <defs>
          <radialGradient id="h3hd" gradientUnits="userSpaceOnUse" cx={f2(hc.x - 0.62 * hR * 0.4)} cy={f2(hc.y - 0.78 * hR * 0.4)} r={f2(hR * 1.3)}>
            <stop offset="0" stopColor={lit(hcol, 0.38)} />
            <stop offset="0.45" stopColor={hcol} />
            <stop offset="1" stopColor={shade(hcol, 0.5)} />
          </radialGradient>
        </defs>
        <path d={hd} fill="url(#h3hd)" stroke={INK} strokeWidth={f2(inkW(hc.s, 1.1))} strokeLinejoin="round" />
        <path d={smoothOpen(fs)} fill="none" stroke={shade(hcol, 0.4)} strokeWidth={f2(fw)} strokeLinecap="round" opacity={0.8} />
        <path d={smoothOpen(cl)} fill="none" stroke={shade(hcol, 0.45)} strokeWidth={f2(fw)} strokeLinecap="round" opacity={0.8} />
        {oc.map((p, i) => <circle key={i} cx={f2(p.x)} cy={f2(p.y)} r={f2(Math.max(0.8, 0.17 * p.s))} fill={lit(hcol, 0.5)} opacity={0.9} />)}
      </g>
    ),
  });
  // compound eyes with the dark pseudopupil that seems to look at the viewer
  [-1, 1].forEach((s) => {
    const c = hw([1.35, 2.6 * s, 1.35]);
    const ax = hax([1.2, 1.0, 1.55]);
    const toCam = norm3(sub3(B.eye, c));
    // point on the ellipsoid surface toward the camera
    const lc: V3 = [dot3(toCam, H.f), dot3(toCam, H.l), dot3(toCam, H.u)];
    const sc: V3 = [lc[0] * 1.2, lc[1] * 1.0, lc[2] * 1.55];
    const k = 1 / Math.sqrt((sc[0] / 1.2) ** 2 + (sc[1] / 1.0) ** 2 + (sc[2] / 1.55) ** 2 || 1);
    const surf = hw([1.35 + sc[0] * k * 0.98, 2.6 * s + sc[1] * k * 0.98, 1.35 + sc[2] * k * 0.98]);
    const out: V3 = [0, s, 0.25];
    const facing = dot3(norm3(dirW(H, out)), toCam);
    const pp = proj(B, surf);
    const deco = facing > -0.3 ? <ellipse cx={f2(pp.x)} cy={f2(pp.y)} rx={f2(0.24 * pp.s)} ry={f2(0.28 * pp.s)} fill={MCOL.pupil} opacity={0.85} /> : undefined;
    items.push(ellipsoidItem(B, c, ax, T(MCOL.eye), {spec: 1.2, glossy: true, deco, zBias: -1.5}));
  });
  // antennae (thread-like, from between the eyes)
  [-1, 1].forEach((s) => {
    const sw = Math.sin(st.antW + s) * 1.2, sw2 = Math.sin(st.antW * 1.3 + 2 * s) * 1.5;
    const ctrl: V3[] = [
      [2.5, 0.75 * s, 1.6],
      [3.6, 1.4 * s, 4.2],
      [5.4, 2.6 * s + sw * 0.3, 7.6 + sw * 0.4],
      [8.6, 4.2 * s + sw, 10.0 + sw2 * 0.4],
      [12.6, 5.6 * s + sw * 1.4, 11.0 + sw2],
    ];
    const pts = spline3(ctrl.map(hw), 6);
    pts.push(hw(ctrl[ctrl.length - 1]));
    items.push(tubeItem(B, pts, pts.map((_, i) => 0.17 - (0.09 * i) / pts.length), T(MCOL.ant), {spec: 0.2}));
  });
  // palps
  [-1, 1].forEach((s) => {
    const a0 = hw([2.0, 0.85 * s, -2.75]), a1 = hw([2.5, 1.15 * s, -3.9]), a2 = hw([2.4, 1.2 * s, -4.9]);
    items.push(capsuleItem(B, a0, a1, 0.24, 0.2, T(MCOL.face), {spec: 0.2}));
    items.push(capsuleItem(B, a1, a2, 0.2, 0.17, T(mix(MCOL.face, '#C9B46A', 0.4)), {spec: 0.2}));
  });
  // ---- raptorial forelegs (attached under the front of the prothorax)
  [-1, 1].forEach((s, j) => {
    const fo = st.fore[j];
    const c0 = pw([17.0, 1.25 * s, -1.2]);
    const cd = norm3(dirW(Fp, [-0.05, 0.22 * s, -0.97]));
    const c1 = add3(c0, mul3(cd, 9.6));
    const fd = norm3(dirW(Fp, [Math.cos(rad(fo.f)), 0.07 * s, Math.sin(rad(fo.f))]));
    const f1 = add3(c1, mul3(fd, 12.8));
    const ta = fo.f + 192 + fo.open;
    const td = norm3(dirW(Fp, [Math.cos(rad(ta)), 0.02 * s, Math.sin(rad(ta))]));
    const t1 = add3(f1, mul3(td, 7.6));
    const col = T(MCOL.leg);
    items.push(capsuleItem(B, c0, c1, 1.25, 1.0, col, {spec: 0.5}));
    items.push(capsuleItem(B, c1, f1, 1.15, 1.55, col, {spec: 0.6, zBias: -0.1}));
    items.push(capsuleItem(B, f1, t1, 0.8, 0.62, col, {spec: 0.5, zBias: -0.15}));
    // femur spines on the side facing the tibia, tibia spines facing the femur
    const fn = norm3(sub3(lerp3(f1, t1, 0.5), add3(lerp3(c1, f1, 0.5), mul3(fd, dot3(sub3(lerp3(f1, t1, 0.5), lerp3(c1, f1, 0.5)), fd)))));
    for (let k = 0; k < 6; k++) {
      const u = 0.32 + k * 0.11;
      const r = 1.15 + (1.55 - 1.15) * u;
      const b0 = add3(lerp3(c1, f1, u), mul3(fn, r * 0.8));
      const b1 = add3(b0, add3(mul3(fn, k % 2 ? 0.8 : 1.3), mul3(fd, -0.35)));
      items.push(capsuleItem(B, b0, b1, 0.26, 0.06, T(mix(MCOL.leg, MCOL.spine, 0.55)), {spec: 0, zBias: 0.05, ink: inkW(proj(B, b0).s, 0.6)}));
    }
    const tn = mul3(fn, -1);
    for (let k = 0; k < 4; k++) {
      const u = 0.25 + k * 0.17;
      const b0 = add3(lerp3(f1, t1, u), mul3(tn, 0.6));
      const b1 = add3(b0, add3(mul3(tn, 0.75), mul3(td, 0.3)));
      items.push(capsuleItem(B, b0, b1, 0.2, 0.05, T(mix(MCOL.leg, MCOL.spine, 0.55)), {spec: 0, zBias: 0.05, ink: inkW(proj(B, b0).s, 0.6)}));
    }
    // the tarsus hangs from the tibia tip
    const ar = add3(t1, mul3(norm3(add3(mul3(td, 0.4), dirW(Fp, [0.5, 0.1 * s, -1]))), 3.0));
    const ar2 = add3(ar, mul3(norm3(dirW(Fp, [0.6, 0.1 * s, -0.8])), 2.6));
    items.push(capsuleItem(B, t1, ar, 0.36, 0.28, col, {spec: 0.3}));
    items.push(capsuleItem(B, ar, ar2, 0.28, 0.2, col, {spec: 0.3}));
  });
  // ---- mid and hind legs (under the meso- and metathorax)
  const SOCK: V3[] = [[-2.0, 2.0, -1.8], [-8.6, 2.1, -1.7]];
  const LEN = [[2.8, 13.0, 12.0, 7.0], [3.3, 16.5, 16.5, 9.0]];
  const RADS = [[0.78, 0.62, 0.56, 0.46, 0.36, 0.24], [0.84, 0.66, 0.58, 0.48, 0.36, 0.24]];
  st.legs.forEach((L, i) => {
    const pr = i >> 1, s = i % 2 === 0 ? -1 : 1;
    const so = bw([SOCK[pr][0], SOCK[pr][1] * s, SOCK[pr][2]]);
    const cx = add3(so, mul3(norm3(dirW(F, [pr === 0 ? 0.2 : -0.25, 0.55 * s, -0.8])), LEN[pr][0]));
    const kn = add3(cx, mul3(dirW(F, sph(L.a, L.b, s)), LEN[pr][1]));
    const an = add3(kn, mul3(dirW(F, sph(L.a2, L.b2, s)), LEN[pr][2]));
    const tm = add3(an, mul3(dirW(F, sph(L.a3, L.b3, s)), LEN[pr][3] * 0.55));
    const ft = add3(tm, mul3(dirW(F, sph(L.a3, L.b3 - 18, s)), LEN[pr][3] * 0.45));
    const col = T(MCOL.leg), R = RADS[pr];
    items.push(capsuleItem(B, so, cx, 1.0, 0.85, T(MCOL.thorax), {spec: 0.3}));
    items.push(capsuleItem(B, cx, kn, R[0], R[1], col, {spec: 0.6}));
    items.push(capsuleItem(B, kn, an, R[2], R[3], col, {spec: 0.5, band: shade(col, 0.25), bandAt: 0.86}));
    items.push(capsuleItem(B, an, tm, R[4], R[4] * 0.85, col, {spec: 0.3}));
    items.push(capsuleItem(B, tm, ft, R[4] * 0.8, R[5], col, {spec: 0.2}));
  });
  return {items, abdZ: abdItem.z, wingZ};
};
