// S6: "It's still experimental." The same robot, out of the body: lying in a clear acrylic test tube on a lab bench,
// its tether running out of the tube to a small pneumatic controller (four air lines and the tool channel). It keeps
// working: the head anchor inflates and its scales pop, the middle extends; the camera drifts in slowly.
import React from 'react';
import {add3, basis, cross3, mul3, norm3, P2, proj, sub3, V2, V3} from '../core/three';
import {depthOf, Item, lightFor, shadeAt} from '../core/render';
import {FrameF, robotItems} from '../robot/geom';
import {POP_ON} from '../robot/state';
import {C, INK} from '../art/palette';
import {mix, rgba} from '../core/color';
import {clamp, ring, ss, ss5} from '../lib';
import {RenderItems} from './RenderItems';

const Z: V3 = [0, 0, 1];
const A = norm3([0.42, 0.9, 0]);
const ORIGIN: V3 = [0, 0, 0];
const TUBE_R = 2.05, BENCH_Z = -TUBE_R - 0.06;
/** the robot's centreline in the test tube: straight along A */
const labFrame: FrameF = (s) => {
  const p = add3(ORIGIN, mul3(A, s));
  const T = A;
  return {p, T, N: norm3(cross3(T, Z)), B: Z};
};
const TUBE_S0 = -2.2, TUBE_S1 = 12.8;
/** the tether: out of the tube's open tail end, down onto the bench, round to the controller */
const CTRL: V3 = add3(add3(ORIGIN, mul3(A, -6.4)), [1.2, -0.4, BENCH_Z + 1.0]);
const tetherPts: V3[] = (() => {
  const pts: V3[] = [];
  const a = add3(ORIGIN, mul3(A, 0.2));
  const b = add3(ORIGIN, mul3(A, TUBE_S0 - 0.6));
  const c = add3(add3(ORIGIN, mul3(A, TUBE_S0 - 3.2)), [-0.6, 0, BENCH_Z + 0.35]);
  const d = add3(CTRL, [1.9, 0.7, -0.75]);
  const ctrl = [a, b, c, d];
  for (let i = 0; i < ctrl.length - 1; i++) for (let k = 0; k < 10; k++) {
    const u = k / 10;
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(3, i + 2)];
    pts.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u * u + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u * u * u)) as V3);
  }
  pts.push(d);
  return pts;
})();
const TL: number[] = [0];
for (let i = 1; i < tetherPts.length; i++) TL.push(TL[i - 1] + Math.hypot(...(sub3(tetherPts[i], tetherPts[i - 1]) as [number, number, number])));
/** tether frame by arc length back from the tail (s = 0 at the tail, decreasing) */
const tetherFrame: FrameF = (s) => {
  const l = Math.min(TL[TL.length - 1], Math.max(0, -s));
  let i = 1;
  while (i < TL.length - 1 && TL[i] < l) i++;
  const u = (l - TL[i - 1]) / (TL[i] - TL[i - 1] || 1);
  const p = add3(mul3(tetherPts[i - 1], 1 - u), mul3(tetherPts[i], u));
  const T = norm3(sub3(tetherPts[i - 1], tetherPts[i]));
  const N = norm3(cross3(T, Z));
  return {p, T, N, B: norm3(cross3(N, T))};
};

export const labState = (t: number) => {
  const e = 0.25 + 0.6 * ss5(t, 19.62, 20.5);
  const aH = ss(t, 20.45, 20.95) ** 0.9;
  const tc = 20.45 + 0.5 * 0.62;
  const popH = ss(aH, POP_ON - 0.06, POP_ON + 0.12) * (1 + 0.3 * ring(t, tc, 6.5, 0.11));
  return {sTail: 0, e, aT: 1, aH, popT: 1, popH, gE: ss(t, 19.6, 19.8) * (1 - ss(t, 20.55, 20.8))};
};

export const labCam = (t: number) => {
  const push = ss5(t, 19.45, 21.3);
  const tgt = add3(add3(ORIGIN, mul3(A, 3.2 + 0.6 * push)), [0.2, 0, -0.6]);
  const dir = norm3([-0.18, 0.62, 0.78]);
  const dist = 24 - 2.2 * push;
  return {cam: {eye: add3(tgt, mul3(dir, dist)), target: tgt, f: dist * 92}, dist};
};
export const LAB_FRAME = (s: number) => labFrame(s);

export const LabShot: React.FC<{t: number}> = ({t}) => {
  const st = labState(t);
  const {cam, dist} = labCam(t);
  const B = basis(cam);
  const Lt = lightFor(B, dist, {fogColor: '#C9D5DA', fog0: dist * 1.1, fogLen: dist * 2.2, d0: dist * 3, gain: 1.05});
  const items: Item[] = [];
  // ---- bench: a pale cutting mat with a grid, receding into the soft lab background
  const pl = (x: number, y: number): V3 => [x, y, BENCH_Z];
  const mat: V2[] = [pl(-14, -18), pl(14, -18), pl(14, 22), pl(-14, 22)].map((p) => proj(B, p));
  const grid: string[] = [];
  for (let k = -14; k <= 14; k++) grid.push(`M${P2(proj(B, pl(k, -18)))}L${P2(proj(B, pl(k, 22)))}`);
  for (let k = -18; k <= 22; k++) grid.push(`M${P2(proj(B, pl(-14, k)))}L${P2(proj(B, pl(14, k)))}`);
  // soft shadow of the tube on the mat
  const sh = (w: number, op: number) => {
    const a: V2[] = [], b: V2[] = [];
    const N = norm3(cross3(A, Z));
    for (let s = TUBE_S0; s <= TUBE_S1; s += 0.5) {
      const c = add3(add3(ORIGIN, mul3(A, s)), [0.35, 0.25, BENCH_Z]);
      a.push(proj(B, add3(c, mul3(N, w)))); b.push(proj(B, add3(c, mul3(N, -w))));
    }
    return <path d={`M${[...a, ...b.reverse()].map(P2).join('L')}Z`} fill={rgba('#2A3B44', op)} />;
  };
  // ---- the clear test tube: back wall, then (after the robot) front glints
  const tubeSil = (side: number, s0 = TUBE_S0, s1 = TUBE_S1) => {
    const pts: V2[] = [];
    for (let s = s0; s <= s1 + 1e-6; s += 0.25) {
      const c = add3(ORIGIN, mul3(A, s));
      const v = norm3(sub3(B.eye, c));
      const off = norm3(cross3(A, v));
      pts.push(proj(B, add3(c, mul3(off, side * TUBE_R))));
    }
    return pts;
  };
  const left = tubeSil(1), right = tubeSil(-1);
  const tubeBody = `M${[...left, ...[...right].reverse()].map(P2).join('L')}Z`;
  const endEllipse = (s: number) => {
    const c = add3(ORIGIN, mul3(A, s));
    const N = norm3(cross3(A, Z));
    const pts: V2[] = [];
    for (let k = 0; k <= 32; k++) {
      const a = (k / 32) * Math.PI * 2;
      pts.push(proj(B, add3(c, add3(mul3(N, TUBE_R * Math.cos(a)), mul3(Z, TUBE_R * Math.sin(a))))));
    }
    return `M${pts.map(P2).join('L')}Z`;
  };
  const robot = robotItems(B, Lt, labFrame, st, {tetherLen: TL[TL.length - 1] - 0.2, tetherFrame, tetherDroop: 0, inkScale: 1.1});
  // ---- the controller: a small box with four air-line ports and a status light
  const box = (c: V3, sx: number, sy: number, sz: number) => {
    const P = (dx: number, dy: number, dz: number): V3 => [c[0] + dx * sx, c[1] + dy * sy, c[2] + dz * sz];
    const faces: {pts: V3[]; n: V3; col: string[]}[] = [
      {pts: [P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)], n: [0, 0, 1], col: C.cap},
      {pts: [P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1), P(-1, 1, 1)], n: [0, 1, 0], col: C.cap},
      {pts: [P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1)], n: [1, 0, 0], col: C.cap},
    ];
    return faces.filter((f) => depthOf(B, f.pts[0]) > 0).map((f, k) => {
      const ctr = mul3(f.pts.reduce((a, b) => add3(a, b), [0, 0, 0] as V3), 0.25);
      return <path key={k} d={`M${f.pts.map((p) => P2(proj(B, p))).join('L')}Z`} fill={shadeAt(B, Lt, f.col, ctr, f.n, {amb: 0.45, spec: 0.2})} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />;
    });
  };
  const portBase = add3(CTRL, [1.9, 0.7, -0.75]);
  const lines = [0, 1, 2, 3].map((k) => {
    const p0 = add3(CTRL, [1.25 + 0.0 * k, 1.4, -0.9 + 0.38 * k]);
    const p1 = add3(portBase, [-0.1, -0.05 * k, 0.05 * k]);
    const m = add3(mul3(add3(p0, p1), 0.5), [0.3, 0.6, 0]);
    const pts: V2[] = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      pts.push(proj(B, add3(add3(mul3(p0, (1 - u) ** 2), mul3(m, 2 * u * (1 - u))), mul3(p1, u * u))));
    }
    return pts;
  });
  const lineCols = ['#56D3C8', '#4CB0E8', '#7DE0A8', '#E8C35A'];
  const led = proj(B, add3(CTRL, [1.6, 1.42, 0.85]));
  const blink = 0.55 + 0.45 * Math.sin(t * 9);
  const sTube = proj(B, ORIGIN).s;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="labbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FA3AD" />
          <stop offset="0.35" stopColor="#B9C8CF" />
          <stop offset="1" stopColor="#DCE4E7" />
        </linearGradient>
        <radialGradient id="labglow" cx="38%" cy="22%" r="70%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#labbg)" />
      <path d={`M${mat.map(P2).join('L')}Z`} fill="#E3EAEC" />
      <path d={grid.join('')} stroke="#B9C9CF" strokeWidth={1.6} fill="none" />
      <rect width={1080} height={1920} fill="url(#labglow)" />
      {sh(2.6, 0.08)}{sh(2.0, 0.1)}{sh(1.4, 0.12)}
      {box(CTRL, 2.0, 1.4, 1.0)}
      {lines.map((pts, k) => <path key={k} d={`M${pts.map(P2).join('L')}`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />)}
      {lines.map((pts, k) => <path key={`c${k}`} d={`M${pts.map(P2).join('L')}`} fill="none" stroke={lineCols[k]} strokeWidth={5.5} strokeLinecap="round" />)}
      <circle cx={led.x} cy={led.y} r={8} fill={mix('#1E6E73', '#9BFFF2', blink)} stroke={INK} strokeWidth={2} />
      {/* tube: back half */}
      <path d={tubeBody} fill={rgba('#CFE9F0', 0.28)} />
      <path d={endEllipse(TUBE_S0)} fill={rgba('#E8F6FA', 0.35)} stroke={rgba('#5E7F8C', 0.8)} strokeWidth={2.4} />
      <RenderItems items={[...robot].sort((a, b) => b.z - a.z)} />
      {/* tube: front glints and rims */}
      <path d={`M${left.map(P2).join('L')}`} fill="none" stroke={rgba('#5E7F8C', 0.85)} strokeWidth={2.6} />
      <path d={`M${right.map(P2).join('L')}`} fill="none" stroke={rgba('#5E7F8C', 0.85)} strokeWidth={2.6} />
      <path d={`M${tubeSil(0.62).map(P2).join('L')}`} fill="none" stroke={rgba('#FFFFFF', 0.55)} strokeWidth={sTube * 0.12} strokeLinecap="round" />
      <path d={`M${tubeSil(0.45).map(P2).join('L')}`} fill="none" stroke={rgba('#FFFFFF', 0.3)} strokeWidth={sTube * 0.04} strokeLinecap="round" />
      <path d={endEllipse(TUBE_S1)} fill={rgba('#E8F6FA', 0.18)} stroke={rgba('#5E7F8C', 0.85)} strokeWidth={2.6} />
    </svg>
  );
};
export const _l = [clamp];
