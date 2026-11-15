// S5: what else it can do (V2, matched to the published description: a hollow central channel carries a camera, CLIPS
// that take tissue biopsies, and a fluid SPRAYER). The robot holds position with its tail anchor gripping and steers
// its head toward the wall (the extender bends; the outer chambers glow). Two clearly different actions, each with its
// own framing:
//   1. biopsy: the clip jaws come out of the channel, open, close on a tiny piece of mucosa, and pull back holding it
//      (a small notch is left in the villi). Gentle: no tearing, no blood.
//   2. fluid delivery: the camera eases along to a neighbouring spot; a spray catheter comes out of the same channel
//      and releases a short, fine, localized spray of blue marker fluid that stains a small patch of mucosa.
import React from 'react';
import {add3, basis, Cam3, cross3, mul3, norm3, P2, proj, sub3, V2, V3} from '../core/three';
import {Item, lightFor} from '../core/render';
import {C3, heading, N3, T3, Z3} from '../world/path';
import {FrameF, layout, robotItems} from '../robot/geom';
import {pose} from '../robot/state';
import {GutShot} from './GutShot';
import {C, INK} from '../art/palette';
import {mix, rgba} from '../core/color';
import {clamp, hash, keyS, lerp, ss, ss5, word} from '../lib';
import {contactOf, gutFrame} from '../world/frames';

const S_TAIL = 30.0;
export const TOOLS_ST = pose({sTail: S_TAIL, e: 0.6, aT: 1, popT: 1, aH: 0, popH: 0, gE: 0.35});
const ST = TOOLS_ST;
const L = layout(ST.e);
const D_MAX = 0.78; // how far the head is steered toward the +N wall (the head stays clear of it)

/** the steered pose: on the gut's centreline to the mid extender, then bending toward +N (amount k in [0, 1]) */
export const steerFrame = (k: number): FrameF => {
  const off = (s: number) => D_MAX * k * ss(s - S_TAIL, L.u4 - 3.2, L.u7) ** 1.3;
  const P = (s: number) => add3(C3(s), mul3(N3(s), off(s)));
  return (s) => {
    const p = P(s);
    const T = norm3(sub3(P(s + 0.02), P(s - 0.02)));
    const N = norm3(cross3(T, Z3));
    return {p, T, N, B: Z3};
  };
};
void gutFrame;

// ---- timing (keyed to the words)
const tIt = word('it', 3).start; // "It could even ..."
const tTissue = word('tissue').start, tSamples = word('samples').start;
const tDeliver = word('deliver').start, tLiquid = word('liquid').start;
const T_IN = 16.8;

export const toolsState = (t: number) => {
  const bend = 0.85 + 0.15 * ss5(t, T_IN, T_IN + 0.5);
  // biopsy: reach out of the channel (closed), open on the way, advance to touch the mucosa, close, retract with it
  const fExt = ss5(t, T_IN, tTissue - 0.2) * (1 - ss5(t, tSamples - 0.22, tSamples + 0.3));
  const fOpen = ss5(t, tIt + 0.12, tTissue - 0.24) * (1 - ss5(t, tTissue - 0.02, tTissue + 0.12));
  const fContact = ss5(t, tTissue - 0.2, tTissue - 0.02) * (1 - ss5(t, tTissue + 0.14, tTissue + 0.3));
  const bitten = ss(t, tTissue + 0.08, tTissue + 0.14); // the sample exists only once the jaws have closed on it
  // spray catheter: out, a short burst of droplets, the stain spreads as they land
  const sExt = ss5(t, tSamples + 0.3, tDeliver + 0.22);
  return {bend, fExt, fOpen, fContact, bitten, sExt};
};
/** the spray burst: droplets are emitted over [SPRAY_T0, SPRAY_T1] and take SPRAY_FLIGHT s to reach the wall */
const SPRAY_N = 34, SPRAY_FLIGHT = 0.26;
const sprayT0 = () => tLiquid - 0.1, sprayT1 = () => tLiquid + 0.34;

const tipOf = (fr: FrameF) => fr(S_TAIL + L.u7);
const S_BITE = S_TAIL + L.u7 + 0.62, S_SPRAY = S_BITE + 1.05;
const rimPt = (s: number, depth: number): V3 => add3(C3(s), mul3(N3(s), 2.0 + depth));

/** a point along a tool's path: out of the channel along the tip's axis, curving onto the target */
const toolPath = (fr: FrameF, target: V3, u: number) => {
  const tp = tipOf(fr);
  const a = add3(tp.p, mul3(tp.T, 0.05));
  const b = add3(tp.p, mul3(tp.T, 0.9));
  const c = target;
  const q = (x: number): V3 => add3(add3(mul3(a, (1 - x) ** 2), mul3(b, 2 * (1 - x) * x)), mul3(c, x * x));
  const pts: V3[] = [];
  const n = 28;
  for (let k = 0; k <= n; k++) pts.push(q((k / n) * u));
  const end = q(u), pre = q(Math.max(0, u - 0.02));
  return {pts, end, dir: norm3(sub3(end, pre))};
};

/** the framing: on the biopsy site, then easing along to the spray site */
export const toolsCam = (t: number): Cam3 => {
  const fr = steerFrame(1);
  const tip = tipOf(fr).p;
  const move = ss5(t, tSamples - 0.12, tDeliver + 0.3);
  const site = lerp(S_BITE, S_SPRAY, move);
  // V3: framed tighter on the work (between the channel and the wall), so the instruments read immediately
  const tgt = add3(mul3(add3(mul3(tip, 0.4), mul3(rimPt(site, 0), 0.6)), 1), add3(mul3(T3(site), lerp(0.0, 0.3, move)), add3(mul3(N3(site), -0.25), mul3(Z3, 0.1))));
  const tilt = 0.14;
  const dir = norm3(add3(add3(mul3(Z3, Math.cos(tilt)), mul3(N3(site), -Math.sin(tilt))), mul3(T3(site), 0.1)));
  const dist = 14;
  const zoom = keyS(t, [[T_IN, 600], [tTissue, 640], [tSamples, 640], [tDeliver + 0.2, 660], [19.5, 680]]);
  return {eye: add3(tgt, mul3(dir, dist)), target: tgt, f: dist * zoom, roll: (heading(site) * 180) / Math.PI, cy: 900};
};

export const ToolsShot: React.FC<{t: number}> = ({t}) => {
  const S = toolsState(t);
  const fr = steerFrame(S.bend);
  const cam = toolsCam(t);
  const B = basis(cam);
  const dist = 14;
  const Lt = lightFor(B, dist, {fog0: dist * 1.02, fogLen: dist * 0.9, d0: dist * 2.4});
  const robot = robotItems(B, Lt, fr, ST, {tetherLen: 20, tetherDroop: 0.4, bendGlow: 0.6});
  const extra: Item[] = [];
  const pxs = (p: V3) => proj(B, p).s;
  const tube = (pts: V3[], r: number, cols: [string, string, string], z: number, op = 1) => {
    const sp = pts.map((p) => proj(B, p));
    const w = 2 * r * pxs(pts[pts.length - 1]);
    const d = `M${sp.map(P2).join('L')}`;
    extra.push({z, d, stroke: INK, sw: w + 4.5, round: true, op});
    extra.push({z: z - 0.001, d, stroke: cols[0], sw: w, round: true, op});
    extra.push({z: z - 0.002, d, stroke: cols[1], sw: w * 0.32, round: true, op: 0.85 * op});
    return w;
  };
  const zTool = -2e5;
  // ---- 1. the biopsy instrument: cable -> steel clevis -> two hinged cup jaws (one connected assembly)
  const JL = 0.24, JW = 0.085, CLEVIS = 0.11, GAP = 0.12;
  const contactPt = rimPt(S_BITE, -0.05); // the villus tips
  if (S.fExt > 0.01) {
    // the clevis sits JL + CLEVIS short of the contact point, plus a small approach gap that closes on contact
    const dirIn = norm3(sub3(contactPt, tipOf(fr).p));
    const hingeTarget = add3(contactPt, mul3(dirIn, -(JL + GAP * (1 - S.fContact))));
    const P = toolPath(fr, add3(hingeTarget, mul3(dirIn, -CLEVIS)), S.fExt);
    tube(P.pts, 0.07, [C.steel[2], C.steel[3], INK], zTool);
    const hinge = add3(P.end, mul3(P.dir, CLEVIS));
    // the clevis: a short steel collar joining the cable to the jaws
    const c0 = proj(B, P.end), c1 = proj(B, hinge);
    const cw = 2 * 0.085 * pxs(hinge);
    extra.push({z: zTool - 0.004, d: `M${P2(c0)}L${P2(c1)}`, stroke: INK, sw: cw + 4.5, round: true});
    extra.push({z: zTool - 0.005, d: `M${P2(c0)}L${P2(c1)}`, stroke: C.steel[1], sw: cw, round: true});
    extra.push({z: zTool - 0.006, d: `M${P2(c0)}L${P2(c1)}`, stroke: C.steel[3], sw: cw * 0.3, round: true, op: 0.8});
    // the jaws open in the cut plane, about the hinge
    const perp = norm3(cross3(P.dir, Z3));
    const open = 0.62 * S.fOpen;
    const jaw = (sgn: number) => {
      const a = sgn * open;
      const d = norm3(add3(mul3(P.dir, Math.cos(a)), mul3(perp, Math.sin(a))));
      const n = norm3(add3(mul3(P.dir, -Math.sin(a)), mul3(perp, Math.cos(a))));
      const pts: V2[] = [proj(B, hinge)];
      for (let k = 0; k <= 12; k++) {
        const th = (k / 12) * Math.PI; // a cup: from the hinge out to the tip and back along the jaw's inner edge
        const along = JL * (0.5 - 0.5 * Math.cos(th));
        const across = sgn * JW * Math.sin(th) ** 0.8;
        pts.push(proj(B, add3(add3(hinge, mul3(d, along)), mul3(n, across))));
      }
      extra.push({z: zTool - 0.01, d: `M${pts.map(P2).join('L')}Z`, fill: C.steel[2], stroke: INK, sw: 2.4});
      extra.push({z: zTool - 0.011, d: `M${pts.slice(3, 9).map(P2).join('L')}`, stroke: C.steel[3], sw: 2.2, round: true, op: 0.85});
    };
    jaw(1);
    jaw(-1);
    if (S.bitten > 0.01) {
      // the sample: a tiny piece of mucosa held in the closed cups, peeking out of the seam
      const c = proj(B, add3(hinge, mul3(P.dir, JL * 0.62)));
      const r = 0.05 * pxs(hinge) * S.bitten;
      extra.push({z: zTool - 0.012, d: blob(c, r, 1.1), fill: C.mucosa, stroke: mix(C.sample, INK, 0.45), sw: 1.8});
      extra.push({z: zTool - 0.013, d: blob({x: c.x - r * 0.2, y: c.y - r * 0.25}, r * 0.42, 0.3), fill: C.villus, op: 0.9});
    }
  }
  // ---- 2. the spray catheter
  const sprayTarget = rimPt(S_SPRAY, -0.62);
  const stainC = rimPt(S_SPRAY + 0.12, -0.02);
  if (S.sExt > 0.01) {
    const P = toolPath(fr, sprayTarget, S.sExt);
    void 0;
    // a translucent catheter with the blue fluid line inside, and a steel nozzle
    const w = tube(P.pts, 0.06, ['#DCEAF2', '#FFFFFF', INK], zTool, 0.95);
    const fluidLen = Math.max(2, Math.round(P.pts.length * clamp(S.sExt * 1.2)));
    extra.push({z: zTool - 0.003, d: `M${P.pts.slice(0, fluidLen).map((p) => P2(proj(B, p))).join('L')}`, stroke: C.dye, sw: w * 0.38, round: true, op: 0.9});
    const nz0 = proj(B, add3(P.end, mul3(P.dir, -0.06))), nz1 = proj(B, add3(P.end, mul3(P.dir, 0.05)));
    extra.push({z: zTool - 0.02, d: `M${P2(nz0)}L${P2(nz1)}`, stroke: INK, sw: w + 6, round: true});
    extra.push({z: zTool - 0.021, d: `M${P2(nz0)}L${P2(nz1)}`, stroke: C.steel[2], sw: w + 1.5, round: true});
    // the spray: a short burst of round droplets leaving the nozzle in a narrow cone, slowing, and settling on a
    // small patch of mucosa. Each droplet has its own fixed trajectory and birth time (no looping, no flicker).
    const from = add3(P.end, mul3(P.dir, 0.06));
    const to = stainC;
    const ax = sub3(to, from);
    const len = Math.hypot(ax[0], ax[1], ax[2]);
    const u = norm3(ax), v = norm3(cross3(u, Z3));
    const t0 = sprayT0(), t1 = sprayT1();
    for (let k = 0; k < SPRAY_N; k++) {
      const born = t0 + ((t1 - t0) * (k + 0.5 * hash(k * 2.3))) / SPRAY_N;
      const age = t - born;
      if (age < 0 || age > SPRAY_FLIGHT + 0.1) continue;
      const x = clamp(age / SPRAY_FLIGHT);
      const travel = 1 - (1 - x) ** 1.6; // fast out of the nozzle, slowing toward the wall
      const ang = (hash(k * 7.7) - 0.5) * 0.42; // narrow cone (about +-12 degrees)
      const q = add3(add3(from, mul3(u, len * travel)), mul3(v, Math.tan(ang) * len * travel));
      const pp = proj(B, q);
      const r = (0.016 + 0.014 * hash(k * 1.3)) * pxs(q) * (1 - 0.35 * clamp((age - SPRAY_FLIGHT) / 0.1));
      const op = clamp(age / 0.03) * (1 - clamp((age - SPRAY_FLIGHT) / 0.1));
      extra.push({z: zTool - 0.04, d: blob(pp, r, 0), fill: C.dye, stroke: mix(C.dye, INK, 0.4), sw: 1, op});
      extra.push({z: zTool - 0.041, d: blob({x: pp.x - r * 0.3, y: pp.y - r * 0.3}, r * 0.32, 0), fill: '#E4E8FF', op: op * 0.85});
    }
    // a faint mist only while the burst runs, close to the nozzle
    const mist = ss(t, t0, t0 + 0.08) * (1 - ss(t, t1, t1 + 0.12));
    if (mist > 0.01) {
      const e0 = proj(B, from), e1 = proj(B, add3(from, add3(mul3(u, len * 0.55), mul3(v, len * 0.12)))), e2 = proj(B, add3(from, add3(mul3(u, len * 0.55), mul3(v, -len * 0.12))));
      extra.push({z: zTool - 0.035, d: `M${P2(e0)}Q${P2(e1)} ${P2({x: (e1.x + e2.x) / 2, y: (e1.y + e2.y) / 2})}Q${P2(e2)} ${P2(e0)}Z`, fill: C.dyeLight, op: 0.12 * mist});
    }
  }
  // the stain left on the mucosa (local, on the surface: the villi turn blue)
  const stainItems: Item[] = [];
  const landed = clamp((t - sprayT0() - SPRAY_FLIGHT) / (sprayT1() - sprayT0()));
  const stain = ss5(landed, 0, 1);
  if (stain > 0.01) {
    const c = proj(B, stainC);
    const sc = pxs(stainC);
    const T = proj(B, add3(stainC, T3(S_SPRAY)));
    const ang = (Math.atan2(T.y - c.y, T.x - c.x) * 180) / Math.PI;
    for (const [k, op] of [[1.0, 0.22], [0.7, 0.32], [0.42, 0.45]] as [number, number][]) {
      stainItems.push({z: -1.5e5, d: ellipseD(c, 0.4 * sc * k * (0.35 + 0.65 * stain), 0.12 * sc * k * (0.5 + 0.5 * stain), ang), fill: k > 0.9 ? C.dyeLight : C.dye, op: op * clamp(stain * 1.6)});
    }
  }
  const sTip = S_TAIL + L.u7;
  return (
    <GutShot B={B} Lt={Lt} robot={robot} extra={[...extra, ...stainItems]}
      gut={{sFrom: sTip - 7, sTo: sTip + 6, contact: contactOf(ST), px: 6, villiPx: 6,
        notch: {side: 1, s: S_BITE, depth: 0.05 * S.bitten},
        shadow: {s0: S_TAIL + 0.3, s1: S_TAIL + L.u4, r: () => 1.1, op: 0.7}}} />
  );
};

/** a soft irregular blob (wob = irregularity) */
const blob = (c: V2, r: number, wob: number) => {
  const pts: V2[] = [];
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2;
    const rr = r * (1 + 0.12 * wob * Math.sin(a * 3 + 1) + 0.08 * wob * Math.sin(a * 5));
    pts.push({x: c.x + rr * Math.cos(a), y: c.y + rr * Math.sin(a)});
  }
  return `M${pts.map(P2).join('L')}Z`;
};
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
export const _t = [rgba];

export const TOOLS_T = {in: T_IN, it: tIt, tissue: tTissue, samples: tSamples, deliver: tDeliver, liquid: tLiquid};
