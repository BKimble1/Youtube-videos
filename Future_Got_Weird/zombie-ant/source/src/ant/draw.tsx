// Drawing the ant rig in the FGW finish (ink contour per part, gradient fills from the upper-left key light). Every
// part is an Item with a camera depth, so near legs pass in front of the body and far legs behind it from any view.
import React from 'react';
import {Basis, capsule2, dot3, mul3, norm3, P2, proj, smoothClosed, smoothOpen, sub3, V3, add3, lerp3} from '../core/three';
import {capsuleItem, ellipsoidItem, ellipsoidPath, inkW, Item} from '../core/draw3';
import {lit, mix, shade} from '../core/color';
import {INK} from '../core/ink';
import {dirW, Frame, pitchF, toW} from '../core/frame';
import {AntState, bw, HEAD_AX, HEAD_C, hw, LegJ, pair, RAD, Rig} from './rig';

export const ANT_COL = {
  head: '#5E2F1E',
  thorax: '#6E3A24',
  gaster: '#4E2B1E',
  rim: '#9A6844',
  leg: '#5A3020',
  mand: '#3E2015',
  eye: '#20160F',
};
/** a living colour dulled toward a grey-brown as the ant dies */
export const deadCol = (c: string, dead: number) => mix(c, '#6A5A4C', dead * 0.45);

const f2 = (n: number) => n.toFixed(2);
const ax3 = (F: Frame, a: V3, sc: number): [V3, V3, V3] => [mul3(F.f, a[0] * sc), mul3(F.l, a[1] * sc), mul3(F.u, a[2] * sc)];

/** visible half of a ring around an ellipsoid's long axis (tergite rims) */
const ringPath = (B: Basis, F: Frame, c: V3, ry: number, rz: number) => {
  const pts: {x: number; y: number}[] = [];
  let started = false;
  let d = '';
  for (let k = 0; k <= 36; k++) {
    const th = (k / 36) * Math.PI * 2;
    const n = add3(mul3(F.l, Math.cos(th)), mul3(F.u, Math.sin(th)));
    const p = add3(c, add3(mul3(F.l, ry * Math.cos(th)), mul3(F.u, rz * Math.sin(th))));
    const vis = dot3(n, sub3(B.eye, p)) > 0;
    if (vis) {
      const q = proj(B, p);
      d += `${started ? ' L' : ' M'}${P2(q)}`;
      started = true;
      pts.push(q);
    } else started = false;
  }
  return d;
};

export type AntDrawOpts = {xray?: boolean; key?: string; shell?: number};

export const antItems = (B: Basis, R: Rig, o: AntDrawOpts = {}): Item[] => {
  const st = R.st;
  const sc = st.scale ?? 1;
  // x-ray: the exoskeleton as a light amber, translucent shell that keeps its contour
  // V3: a dark, translucent shell, so the fungus inside reads against it
  const dc = (c: string) => (o.xray ? mix('#3A2418', c, 0.35) : deadCol(c, st.dead));
  const fo = o.xray ? 0.55 : undefined;
  const items: Item[] = [];
  const op = o.shell; // whole-part opacity
  const body = st.body;
  // ---- mesosoma: pronotum, mesonotum, propodeum
  const meso: [V3, V3][] = [[[1.3, 0, 0.32], [0.95, 0.74, 0.78]], [[0.1, 0, 0.28], [1.2, 0.56, 0.66]], [[-1.12, 0, 0.3], [0.66, 0.5, 0.58]]];
  meso.forEach(([c, a], k) => items.push(ellipsoidItem(B, bw(st, c), ax3(pitchF(body, [6, 0, -12][k]), a, sc), dc(ANT_COL.thorax), {opacity: op, spec: 0.8, fillOpacity: fo})));
  // petiole node (upright scale)
  items.push(ellipsoidItem(B, bw(st, [-1.86, 0, 0.32]), ax3(body, [0.27, 0.36, 0.56], sc), dc(ANT_COL.thorax), {opacity: op, spec: 0.5, fillOpacity: fo}));
  // gaster with tergite rims
  const gF = pitchF(body, -st.gasterPitch, bw(st, [-2.0, 0, 0.3]));
  const gc = toW(gF, mul3([-3.55 + 0, 0, 0.42 - 0.3], sc));
  const gC = add3(gc, [0, 0, 0]);
  const gA: V3 = [1.85, 1.42, 1.3];
  const rims = [-0.62, -0.18, 0.24, 0.62].map((xb) => {
    const k = Math.sqrt(Math.max(0, 1 - xb * xb));
    return ringPath(B, gF, add3(gC, mul3(gF.f, xb * gA[0] * sc)), gA[1] * k * sc * 1.005, gA[2] * k * sc * 1.005);
  });
  const gS = proj(B, gC).s;
  items.push(ellipsoidItem(B, gC, ax3(gF, gA, sc), dc(ANT_COL.gaster), {opacity: op, spec: 1, glossy: true, fillOpacity: fo, deco: <g>{rims.map((d, k) => <path key={k} d={d} fill="none" stroke={dc(ANT_COL.rim)} strokeWidth={f2(Math.max(0.8, 0.09 * gS * sc))} strokeLinecap="round" opacity={0.75} />)}</g>}));
  // ---- head
  const H = R.head;
  items.push(ellipsoidItem(B, R.headC, ax3(H, HEAD_AX, sc), dc(ANT_COL.head), {opacity: op, spec: 0.9, glossy: true, fillOpacity: fo}));
  // compound eyes on the sides
  [1, -1].forEach((s) => {
    const c = hw(st, H, [HEAD_C[0] + 0.22, 1.2 * s, HEAD_C[2] + 0.0]);
    const n = dirW(H, [0.2, s, 0]);
    if (dot3(n, sub3(B.eye, c)) > -0.2) items.push(ellipsoidItem(B, c, [mul3(H.f, 0.44 * sc), mul3(norm3(n), 0.17 * sc), mul3(H.u, 0.36 * sc)], ANT_COL.eye, {zBias: -0.05 * sc, spec: 1.4, glossy: true, opacity: op}));
  });
  // mandibles
  R.mand.forEach((m) => {
    const pts = m.pts.map((p) => proj(B, p));
    const d = smoothClosed(pts);
    const z = proj(B, lerp3(m.base, m.tip, 0.5)).z;
    const w = inkW(proj(B, m.base).s * sc, 0.9);
    items.push({
      z,
      el: (
        <g key={`m${m.s}`} opacity={op}>
          <path d={d} fill={dc(ANT_COL.mand)} stroke={INK} strokeWidth={f2(w)} strokeLinejoin="round" />
          <path d={smoothOpen([pts[1], pts[3], pts[5]])} fill="none" stroke={lit(ANT_COL.mand, 0.55)} strokeWidth={f2(w * 1.1)} strokeLinecap="round" opacity={0.85} />
          <path d={smoothOpen([pts[7], pts[9], pts[11], pts[13]])} fill="none" stroke={shade(ANT_COL.mand, 0.5)} strokeWidth={f2(w * 0.6)} strokeLinecap="round" opacity={0.7} />
        </g>
      ),
    });
  });
  // antennae: scape and funiculus
  R.ants.forEach((a, j) => {
    items.push(capsuleItem(B, a.socket, a.elbow, 0.1 * sc, 0.085 * sc, dc(ANT_COL.leg), {key: `as${j}`, spec: 0.4, opacity: op}));
    for (let k = 0; k < a.pts.length - 1; k++) {
      items.push(capsuleItem(B, a.pts[k], a.pts[k + 1], (0.075 + 0.006 * k) * sc, (0.08 + 0.008 * k) * sc, dc(ANT_COL.leg), {key: `af${j}${k}`, spec: 0.3, opacity: op}));
    }
  });
  // ---- legs
  R.legs.forEach((L: LegJ) => {
    const k = pair(L.i);
    const c = dc(ANT_COL.leg);
    items.push(capsuleItem(B, L.socket, L.troch, RAD.coxa * sc, RAD.coxa * 0.8 * sc, dc(ANT_COL.thorax), {key: `c${L.i}`, spec: 0.4, opacity: op, fillOpacity: fo}));
    items.push(capsuleItem(B, L.troch, L.knee, RAD.femur[0] * sc * (k === 2 ? 1.05 : 1), RAD.femur[1] * sc, c, {key: `f${L.i}`, spec: 0.6, opacity: op, fillOpacity: fo}));
    items.push(capsuleItem(B, L.knee, L.ankle, RAD.tibia[0] * sc, RAD.tibia[1] * sc, c, {key: `t${L.i}`, spec: 0.5, opacity: op, fillOpacity: fo}));
    // the tarsus in two pieces with a slight droop, ending in a claw
    const mid = lerp3(L.ankle, L.foot, 0.55);
    items.push(capsuleItem(B, L.ankle, mid, RAD.tarsus[0] * sc, 0.07 * sc, c, {key: `s${L.i}a`, spec: 0.3, opacity: op, fillOpacity: fo}));
    items.push(capsuleItem(B, mid, L.foot, 0.065 * sc, RAD.tarsus[1] * sc, c, {key: `s${L.i}b`, spec: 0.2, opacity: op, fillOpacity: fo}));
  });
  return items;
};

/** all of an ant's items flattened into one group item (sorted inside), for placing an ant as a single layer */
export const groupItem = (items: Item[], z: number, key: string, extra?: {opacity?: number; mask?: string; filter?: string}): Item => ({
  z,
  el: (
    <g key={key} opacity={extra?.opacity} mask={extra?.mask} filter={extra?.filter}>
      {items.filter((it) => it.z > 0.5).sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>)}
    </g>
  ),
});

/** the outlines of the mesosoma, petiole and gaster (screen paths), to clip what is seen inside the body */
export const bodyClipPaths = (B: Basis, R: Rig): string[] => {
  const st = R.st, sc = st.scale ?? 1, body = st.body;
  const meso: [V3, V3][] = [[[1.3, 0, 0.32], [0.95, 0.74, 0.78]], [[0.1, 0, 0.28], [1.2, 0.56, 0.66]], [[-1.12, 0, 0.3], [0.66, 0.5, 0.58]]];
  const out = meso.map(([c, a], k) => ellipsoidPath(B, bw(st, c), ax3(pitchF(body, [6, 0, -12][k]), a, sc)));
  out.push(ellipsoidPath(B, bw(st, [-1.86, 0, 0.32]), ax3(body, [0.27, 0.36, 0.56], sc)));
  const gF = pitchF(body, -st.gasterPitch, bw(st, [-2.0, 0, 0.3]));
  out.push(ellipsoidPath(B, toW(gF, mul3([-3.55, 0, 0.12], sc)), ax3(gF, [1.85, 1.42, 1.3], sc)));
  out.push(ellipsoidPath(B, R.headC, ax3(R.head, HEAD_AX, sc)));
  return out;
};
