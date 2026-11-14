// S5: what else it can do. The robot holds position with its tail anchor and steers its head toward the wall (the
// extender bends; the outer chambers glow). From the central channel: biopsy forceps reach the mucosa at the cut rim,
// open, bite a tiny sample (a small notch is left in the villi), and retract with it; then a fine injection needle
// reaches a neighbouring spot and releases a small, local bloom of blue marker dye into the tissue. Restrained: no
// sprays, no tearing.
import React from 'react';
import {add3, basis, Cam3, mul3, norm3, P2, proj, sub3, V2, V3} from '../core/three';
import {Item, lightFor} from '../core/render';
import {C3, heading, N3, T3, Z3} from '../world/path';
import {FrameF, layout, robotItems} from '../robot/geom';
import {pose} from '../robot/state';
import {GutShot} from './GutShot';
import {C, INK} from '../art/palette';
import {mix, rgba} from '../core/color';
import {clamp, lerp, ss, ss5, word} from '../lib';
import {contactOf} from '../world/frames';

const S_TAIL = 30.0;
const ST = pose({sTail: S_TAIL, e: 0.62, aT: 1, popT: 1, aH: 0, popH: 0, gE: 0.0});
const L = layout(ST.e);
const UB = L.u3 + 0.3; // the bend starts just into the extender
const KAPPA = 0.075;
const T0 = T3(S_TAIL), N0 = N3(S_TAIL), BASE = C3(S_TAIL);

/** the steered pose: straight to UB, then an arc toward +N (bend amount k in [0, 1]) */
export const steerFrame = (k: number): FrameF => (s) => {
  const u = s - S_TAIL;
  const kap = KAPPA * k;
  if (u <= UB || kap < 1e-5) return {p: add3(BASE, mul3(T0, u)), T: T0, N: N0, B: Z3};
  const th = kap * (u - UB);
  const p = add3(add3(BASE, mul3(T0, UB)), add3(mul3(T0, Math.sin(th) / kap), mul3(N0, (1 - Math.cos(th)) / kap)));
  const T = add3(mul3(T0, Math.cos(th)), mul3(N0, Math.sin(th)));
  const N = add3(mul3(T0, -Math.sin(th)), mul3(N0, Math.cos(th)));
  return {p, T, N, B: Z3};
};

// ---- timing (keyed to the words)
const tIt = word('it', 3).start; // "It could even ..."
const tTissue = word('tissue').start, tSamples = word('samples').start;
const tDeliver = word('deliver').start, tLiquid = word('liquid').start;
const T_IN = 16.8;

export const toolsState = (t: number) => {
  const bend = 0.82 + 0.18 * ss5(t, T_IN, T_IN + 0.5);
  // forceps: reach, open, bite, retract
  const fExt = ss5(t, T_IN + 0.02, tTissue - 0.05) * (1 - ss5(t, tSamples - 0.25, tSamples + 0.3));
  const fOpen = ss(t, tIt + 0.15, tTissue - 0.05) * (1 - ss(t, tTissue + 0.02, tTissue + 0.16));
  const bitten = ss(t, tTissue + 0.1, tTissue + 0.2);
  // needle: reach, enter, release
  const nExt = ss5(t, tSamples + 0.32, tDeliver + 0.12) * 1;
  const nIn = ss(t, tDeliver + 0.1, tLiquid - 0.02);
  const dye = ss(t, tLiquid - 0.04, tLiquid + 0.75);
  const stream = ss(t, tLiquid - 0.06, tLiquid + 0.05) * (1 - ss(t, tLiquid + 0.45, tLiquid + 0.75));
  return {bend, fExt, fOpen, bitten, nExt, nIn, dye, stream};
};

const tipOf = (fr: FrameF) => fr(S_TAIL + L.u7);
const S_BITE = S_TAIL + L.u7 + 0.55, S_INJ = S_BITE + 0.7;
const rimPt = (s: number, depth: number): V3 => add3(C3(s), mul3(N3(s), 2.0 + depth));

/** a point along the tool path: out of the channel along the tip's axis, curving onto the target */
const toolPath = (fr: FrameF, target: V3, u: number) => {
  const tp = tipOf(fr);
  const a = add3(tp.p, mul3(tp.T, 0.05));
  const b = add3(tp.p, mul3(tp.T, 0.75));
  const c = target;
  const q = (x: number): V3 => add3(add3(mul3(a, (1 - x) ** 2), mul3(b, 2 * (1 - x) * x)), mul3(c, x * x));
  const pts: V3[] = [];
  const n = 24;
  for (let k = 0; k <= n; k++) pts.push(q((k / n) * u));
  const end = q(u), pre = q(Math.max(0, u - 0.02));
  return {pts, end, dir: norm3(sub3(end, pre))};
};

export const toolsCam = (t: number): Cam3 => {
  const fr = steerFrame(1);
  const tip = tipOf(fr).p;
  const tgt = add3(mul3(add3(tip, rimPt(S_BITE + 0.3, 0)), 0.5), add3(mul3(T0, -0.12), add3(mul3(N0, 0.05), mul3(Z3, 0.1))));
  const push = ss5(t, T_IN, 19.6);
  const tilt = 0.12;
  const dir = norm3(add3(add3(mul3(Z3, Math.cos(tilt)), mul3(N0, -Math.sin(tilt))), mul3(T0, 0.12)));
  const dist = 14;
  const at = add3(tgt, mul3(T0, 0.18 * push));
  return {eye: add3(at, mul3(dir, dist)), target: at, f: dist * 345 * (1 + 0.06 * push), roll: (heading(S_TAIL) * 180) / Math.PI};
};

export const ToolsShot: React.FC<{t: number}> = ({t}) => {
  const S = toolsState(t);
  const fr = steerFrame(S.bend);
  const cam = toolsCam(t);
  const B = basis(cam);
  const dist = 14;
  const Lt = lightFor(B, dist, {fog0: dist * 1.02, fogLen: dist * 0.9, d0: dist * 2.4});
  const robot = robotItems(B, Lt, fr, ST, {tetherLen: 20, tetherFrame: (s) => ({p: add3(BASE, mul3(T0, s - S_TAIL)), T: T0, N: N0, B: Z3}), tetherDroop: 0.5});
  const extra: Item[] = [];
  const pxs = (p: V3) => proj(B, p).s;
  const tube = (pts: V3[], r: number, col: string[], z: number) => {
    const sp = pts.map((p) => proj(B, p));
    const w = 2 * r * pxs(pts[pts.length - 1]);
    const d = `M${sp.map(P2).join('L')}`;
    extra.push({z, d, stroke: INK, sw: w + 4.5, round: true});
    extra.push({z: z - 0.001, d, stroke: col[1], sw: w, round: true});
    extra.push({z: z - 0.002, d, stroke: col[3], sw: w * 0.3, round: true, op: 0.8});
  };
  const zTool = -2e5;
  // ---- biopsy forceps
  const biteTarget = rimPt(S_BITE, -0.04);
  if (S.fExt > 0.01) {
    const P = toolPath(fr, biteTarget, S.fExt);
    tube(P.pts, 0.07, C.steel, zTool);
    // the cup jaws, opening about the tool axis in the cut plane
    const side = norm3(sub3(Z3, mul3(P.dir, P.dir[2])));
    const perp = norm3([P.dir[1] * side[2] - P.dir[2] * side[1], P.dir[2] * side[0] - P.dir[0] * side[2], P.dir[0] * side[1] - P.dir[1] * side[0]]);
    const open = 0.75 * S.fOpen;
    const jaw = (sgn: number) => {
      const a = sgn * open;
      const d = norm3(add3(mul3(P.dir, Math.cos(a)), mul3(perp, Math.sin(a))));
      const n = norm3(add3(mul3(P.dir, -Math.sin(a)), mul3(perp, Math.cos(a))));
      const pts: V2[] = [];
      for (let k = 0; k <= 10; k++) {
        const th = (k / 10) * Math.PI;
        const q = add3(add3(P.end, mul3(d, 0.13 + 0.14 * Math.sin(th))), mul3(n, sgn * 0.1 * Math.cos(th) * 0.9));
        pts.push(proj(B, add3(q, mul3(n, sgn * 0.045))));
      }
      extra.push({z: zTool - 0.01, d: `M${pts.map(P2).join('L')}Z`, fill: C.steel[2], stroke: INK, sw: 2.2});
      const hl = pts.slice(2, 7);
      extra.push({z: zTool - 0.011, d: `M${hl.map(P2).join('L')}`, stroke: C.steel[3], sw: 2, round: true, op: 0.8});
    };
    if (S.bitten > 0.5) {
      // the sample, held in the closed jaws
      const c = proj(B, add3(P.end, mul3(P.dir, 0.15)));
      const r = 0.085 * pxs(P.end);
      extra.push({z: zTool - 0.005, d: circle(c, r), fill: C.sample, stroke: mix(C.sample, INK, 0.5), sw: 1.6});
    }
    jaw(1);
    jaw(-1);
  }
  // ---- injection needle and the dye
  const injTarget = rimPt(S_INJ, 0.05 * S.nIn);
  if (S.nExt > 0.01) {
    const P = toolPath(fr, injTarget, S.nExt);
    tube(P.pts.slice(0, -3), 0.05, ['#5E6E7A', '#BFD3DD', '#E3EEF3', '#FFFFFF'], zTool);
    // the metal needle tip
    const tipA = P.pts[P.pts.length - 4], tipB = P.end;
    const pa = proj(B, tipA), pb = proj(B, tipB);
    extra.push({z: zTool - 0.02, d: `M${P2(pa)}L${P2(pb)}`, stroke: INK, sw: 6, round: true});
    extra.push({z: zTool - 0.021, d: `M${P2(pa)}L${P2(pb)}`, stroke: C.steel[3], sw: 3, round: true});
    if (S.stream > 0.01) {
      const q0 = proj(B, add3(tipB, mul3(P.dir, -0.02))), q1 = proj(B, add3(tipB, mul3(P.dir, 0.16)));
      extra.push({z: zTool - 0.03, d: `M${P2(q0)}L${P2(q1)}`, stroke: C.dye, sw: 7 * S.stream, round: true, op: 0.9});
    }
  }
  const dyeItems: Item[] = [];
  if (S.dye > 0.01) {
    const c = proj(B, rimPt(S_INJ, 0.14));
    const s = pxs(rimPt(S_INJ, 0));
    const T = proj(B, add3(rimPt(S_INJ, 0.14), T3(S_INJ)));
    const ang = (Math.atan2(T.y - c.y, T.x - c.x) * 180) / Math.PI;
    for (const [k, op] of [[1.0, 0.25], [0.72, 0.35], [0.45, 0.5]] as [number, number][]) {
      dyeItems.push({z: -1.5e5, d: ellipseD(c, 0.5 * s * k * S.dye, 0.21 * s * k * (0.6 + 0.4 * S.dye), ang), fill: k > 0.9 ? C.dyeLight : C.dye, op: op * clamp(S.dye * 1.5)});
    }
  }
  const sTip = S_TAIL + L.u7;
  return (
    <>
      <GutShot B={B} Lt={Lt} robot={robot} extra={[...extra, ...dyeItems]}
        gut={{sFrom: sTip - 7, sTo: sTip + 6, contact: contactOf(ST), px: 6, villiPx: 6,
          notch: {side: 1, s: S_BITE, depth: 0.055 * S.bitten},
          shadow: {s0: S_TAIL + 0.3, s1: S_TAIL + L.u4, r: () => 1.1, op: 0.7}}} />
    </>
  );
};

const circle = (c: V2, r: number) => `M${(c.x - r).toFixed(2)},${c.y.toFixed(2)}a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(2 * r).toFixed(2)},0a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(-2 * r).toFixed(2)},0Z`;
const ellipseD = (c: V2, rx: number, ry: number, rot: number) => {
  const a = (rot * Math.PI) / 180;
  const pts: V2[] = [];
  for (let k = 0; k < 28; k++) {
    const t = (k / 28) * Math.PI * 2;
    const x = rx * Math.cos(t), y = ry * Math.sin(t);
    pts.push({x: c.x + x * Math.cos(a) - y * Math.sin(a), y: c.y + x * Math.sin(a) + y * Math.cos(a)});
  }
  return `M${pts.map(P2).join('L')}Z`;
};
export const _t = [lerp, rgba];

export const TOOLS_T = {in: T_IN, it: tIt, tissue: tTissue, samples: tSamples, deliver: tDeliver, liquid: tLiquid};
