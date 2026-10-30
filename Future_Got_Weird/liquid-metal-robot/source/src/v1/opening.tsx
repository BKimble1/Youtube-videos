// Scenes 1-2 (the winning preview's opening), as state for the film's renderer. The code is the preview's, run in
// preview time tp (see timeline.warpPrev), so the opening is kept frame for frame apart from the word sync.
import React from 'react';
import {clamp, keyCR as keyCRl, ss} from '../shared/lib';
import {a3, Cam, ellipsoid, Ell, l3, m3, project, V3, v3} from './cam';
import {FIG_H, FIG_T, meltDeform, P2, PARTS, partPath} from './figure';
import {Goo} from './liquid';
import {C_POOL, CAV, magnetAt, meltState, TP} from './motion';
import {boxFaces, CORAL_C, MOULD, RC, ZT} from './props';
import {SoftShadow} from './shade';
import {lit} from '../shared/color';

export type Aff = {a: number; b: number; c: number; d: number; e: number; f: number};
export const affine = (cam: Cam, O3: V3, U3: V3, V3_: V3): Aff => {
  const o = project(cam, O3), u = project(cam, a3(O3, U3)), v = project(cam, a3(O3, V3_));
  return {a: u.x - o.x, b: u.y - o.y, c: v.x - o.x, d: v.y - o.y, e: o.x, f: o.y};
};
export const affStr = (A: Aff) => `matrix(${[A.a, A.b, A.c, A.d, A.e, A.f].map((x) => x.toFixed(4)).join(' ')})`;
export const ap = (A: Aff, p: P2) => ({x: A.a * p.x + A.c * p.y + A.e, y: A.b * p.x + A.d * p.y + A.f});
/** screen offset -> local units under A */
export const toLocal = (A: Aff, dx: number, dy: number): P2 => {
  const det = A.a * A.d - A.b * A.c;
  return {x: (A.d * dx - A.c * dy) / det, y: (-A.b * dx + A.a * dy) / det};
};
export const pathScreen = (A: Aff, pts: P2[], off?: P2) => partPath(pts.map((q) => ap(A, off ? {x: q.x + off.x, y: q.y + off.y} : q)));

/** a flat liquid ellipsoid lying on the surface (centre on the surface) */
export const lump = (c: Cam, p: V3, ra: number, rb: number, h: number, ang = 0): Ell => {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  return ellipsoid(c, v3(p.x, p.y, p.z + h * 0.45), [v3(ra * ca, ra * sa, 0), v3(-rb * sa, rb * ca, 0), v3(0, 0, h * 0.55)]);
};

// cavity sample points (figure-local), for the filling liquid
export const inside = (pts: P2[], p: P2) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};
export const CAV_PTS: P2[] = (() => {
  const out: P2[] = [];
  for (let v = 0.02; v <= FIG_H; v += 0.075)
    for (let u = -0.6; u <= 0.6; u += 0.075) if (PARTS.some((p) => inside(p.pts, {x: u, y: v}))) out.push({x: u, y: v});
  return out;
})();

const GAPS = [
  {phi: -30, a: TP.esc0, b: TP.esc1 - 0.08, w: 1},
  {phi: -60, a: TP.esc0 + 0.1, b: TP.esc1, w: 1},
  {phi: -90, a: TP.esc0 + 0.26, b: TP.esc1 - 0.14, w: 0.72},
];
const DRIPS = [
  {u: -0.46, v: 0.82, t0: 0.22, d: 0.5},
  {u: 0.44, v: 0.98, t0: 0.38, d: 0.5},
  {u: 0.12, v: 1.32, t0: 0.55, d: 0.55},
  {u: -0.2, v: 1.12, t0: 0.66, d: 0.5},
];


export const s3v = (a: V3, b: V3) => v3(a.x - b.x, a.y - b.y, a.z - b.z);

/** pool centre while it is steered (keyed with the magnet's lead) */
const keyP = (t: number, ax: 'x' | 'y') => {
  const X: [number, number][] = [[2.3, 1.35], [2.5, 1.37], [2.82, 1.22], [3.08, 1.0], [3.3, 0.92], [TP.fill1, 0.9]];
  const Y: [number, number][] = [[2.3, -1.45], [2.5, -1.55], [2.82, -2.0], [3.08, -2.45], [3.3, -2.92], [TP.fill1, -4.3]];
  return keyCRl(t, ax === 'x' ? X : Y);
};


/** the mould's top strip in front of the cavity, redrawn over the soles while they are still below the top */
export const Lip: React.FC<{c: Cam}> = ({c}) => {
  const f = boxFaces(c, v3(MOULD.x0 + 0.01, MOULD.y0 + 0.01, 0), v3(MOULD.x1 - 0.01, CAV.yF - 0.03, ZT), {
    top: lit(CORAL_C, 0.1), nx: 'none', px: 'none', ny: 'none', py: 'none',
  }).filter((q) => q.top);
  return <g>{f.map((q, i) => <path key={i} d={q.d} fill={q.col} />)}</g>;
};


export const openingState = (c: Cam, tp: number) => {
  const k0 = c.s;
  const ms = meltState(tp);
  const power = 1 - ss(tp, TP.power0, TP.power0 + 0.35);

  // ---------------------------------------------------------------- the figure in the cage (billboard)
  const yr = (c.yaw * Math.PI) / 180;
  const right = v3(Math.cos(yr), -Math.sin(yr), 0), away = v3(Math.sin(yr), Math.cos(yr), 0);
  const Ffront = a3(v3(0, 0, ZT), m3(away, -FIG_T / 2));
  const Afig = affine(c, Ffront, right, v3(0, 0, 1));
  const so = project(c, a3(Ffront, m3(away, FIG_T))), sf = project(c, Ffront);
  const sweepFig = toLocal(Afig, so.x - sf.x, so.y - sf.y);
  const deformed = PARTS.map((p) => ({name: p.name, tone: p.tone, pts: p.pts.map((q) => meltDeform(q, !!p.arm, ms.slump, tp))}));
  const figGone = ms.slump > 0.995 || tp > TP.esc0 + 0.35;
  const kf = project(c, Ffront).k;

  // ---------------------------------------------------------------- liquid (one height field, screen space)
  const items: Goo[] = [];
  const shadows: React.ReactNode[] = [];
  if (!figGone) {
    const shrink = 1 - ss(tp, TP.slump1 - 0.1, TP.esc0 + 0.35);
    for (const p of deformed) {
      const pts = p.pts.map((q) => ({x: q.x * shrink, y: q.y * shrink}));
      const sp = pts.map((q) => ap(Afig, q));
      const b = {x0: Math.min(...sp.map((q) => q.x)), x1: Math.max(...sp.map((q) => q.x)), y0: Math.min(...sp.map((q) => q.y)) - 40, y1: Math.max(...sp.map((q) => q.y))};
      items.push({k: 'p', d: pathScreen(Afig, pts), g: 'dome', b});
      items.push({k: 'p', d: pathScreen(Afig, pts, {x: sweepFig.x * 0.6, y: sweepFig.y * 0.6}), g: 'dome', b});
    }
    for (const dr of DRIPS) {
      const u = clamp((tp - dr.t0) / dr.d);
      if (u <= 0 || u >= 1) continue;
      const lp = meltDeform({x: dr.u * (1 + 0.15 * u), y: dr.v * (1 - u * u)}, false, ms.slump, tp);
      const sp = ap(Afig, lp);
      const r = 0.07 * kf * Math.sin(Math.PI * Math.min(1, u * 1.6)) ** 0.5;
      items.push({k: 'e', e: {cx: sp.x, cy: sp.y, rx: r, ry: r * 1.15, rot: 0}, g: 'dome'});
    }
  }
  // the puddle in the cage
  const rin = (0.15 + 0.45 * ss(tp, 0.0, 1.45)) * (1 - ss(tp, TP.esc0 + 0.25, TP.esc1 - 0.04));
  const pc = v3(0.3 * ss(tp, TP.esc0, 2.0), -0.3 * ss(tp, TP.esc0, 2.0), ZT);
  if (rin > 0.01) {
    items.push({k: 'e', e: lump(c, pc, rin, rin * 0.96, 0.22 + 0.06 * (1 - ms.slump)), g: 'flat'});
    const lobe = 1 - ss(tp, 1.4, 1.8);
    for (let i = 0; i < (lobe > 0.02 ? 6 : 0); i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4 + 0.25 * Math.sin(tp * 2.3 + i);
      const rr = rin * (0.62 + 0.06 * Math.sin(tp * 3.1 + i * 1.7));
      items.push({k: 'e', e: lump(c, v3(pc.x + rr * Math.cos(a), pc.y + rr * Math.sin(a), ZT), rin * 0.42 * lobe, rin * 0.36 * lobe, 0.18, a), g: 'dome'});
    }
    shadows.push(<SoftShadow key="ps" id="pud-sh" c={{x: project(c, pc).x + 6, y: project(c, pc).y + 5}} rx={rin * project(c, pc).k * 1.25} ry={rin * project(c, pc).k * 0.62} alpha={0.45} color="#03090C" />);
  }
  // streams through the bar gaps
  for (const g of GAPS) {
    const p = (tp - g.a) / (g.b - g.a);
    if (p <= 0 || p >= 1.02) continue;
    const ph = (g.phi * Math.PI) / 180;
    const n = v3(Math.cos(ph), Math.sin(ph), 0);
    const G = v3(RC * n.x, RC * n.y, ZT);
    const I = v3(pc.x + n.x * rin * 0.8, pc.y + n.y * rin * 0.8, ZT);
    const O = a3(G, m3(n, 0.16 + 0.34 * ss(p, 0, 0.6)));
    const B = l3(O, C_POOL, ss(p, 0.42, 1.0));
    const rn = 0.125 * g.w * ss(p, 0, 0.1) * (1 - ss(p, 0.76, 0.96));
    const rb = 0.27 * g.w * Math.sqrt(ss(p, 0.02, 0.62)) * (1 - 0.5 * ss(p, 0.8, 1.0));
    const jig = 1 + 0.06 * Math.sin(tp * 19 + g.phi) * ss(p, 0.75, 1);
    for (let i = 0; i <= 4; i++) {
      const f = i / 4;
      const q = l3(I, G, f);
      const r = Math.max(rn, Math.min(0.24, rin * 0.5) * (1 - f) + rn * f);
      if (r > 0.012) items.push({k: 'e', e: lump(c, q, r, r * 0.9, 0.2), g: 'dome'});
    }
    for (let i = 1; i <= 4; i++) {
      const f = i / 4;
      const q = l3(G, B, f * 0.8);
      const r = rn + (rb * 0.6 - rn) * f;
      if (r > 0.012 && rn > 0.008) items.push({k: 'e', e: lump(c, q, r, r * 0.9, 0.2), g: 'dome'});
    }
    if (rb > 0.01) items.push({k: 'e', e: lump(c, B, rb * jig, rb / jig, 0.3), g: 'dome'});
  }
  // the collected pool, then steered by the magnet
  const fillU = clamp((tp - 3.22) / (TP.fill1 - 3.22));
  const P = v3(
    tp < 2.3 ? C_POOL.x : keyP(tp, 'x'),
    tp < 2.3 ? C_POOL.y : keyP(tp, 'y'),
    ZT,
  );
  const rP = (0.5 * ss(tp, 1.62, 2.32)) * Math.sqrt(Math.max(0, 1 - fillU * 1.02));
  const M0 = magnetAt(tp);
  if (rP > 0.015) {
    const dmx = M0.x - P.x, dmy = M0.y - P.y;
    const dh = Math.hypot(dmx, dmy) || 1;
    const dist = Math.hypot(dh, M0.z - ZT);
    const att = tp > TP.mag0 ? Math.exp(-Math.max(0, dist - 0.65) / 0.55) : 0;
    const ang = Math.atan2(dmy, dmx);
    // stretch along the motion while it is being dragged
    const vx = keyP(tp + 0.04, 'x') - keyP(tp - 0.04, 'x'), vy = keyP(tp + 0.04, 'y') - keyP(tp - 0.04, 'y');
    const sp = tp > 2.32 ? Math.min(1, Math.hypot(vx, vy) / 0.12) : 0;
    const va = sp > 0.02 ? Math.atan2(vy, vx) : ang;
    const wob = 1 + 0.05 * Math.sin(tp * 9.5);
    items.push({k: 'e', e: lump(c, P, rP * (1 + 0.35 * sp) * wob, rP * (1 - 0.18 * sp) / wob, 0.3, va), g: 'flat'});
    if (att > 0.02) {
      const tq = v3(P.x + Math.cos(ang) * rP * 0.7 * att, P.y + Math.sin(ang) * rP * 0.7 * att, ZT);
      items.push({k: 'e', e: lump(c, tq, rP * 0.55, rP * 0.42, 0.28, ang), g: 'dome'});
      // the liquid heaps up toward the magnet
      const pk = v3(P.x + Math.cos(ang) * rP * 0.55 * att, P.y + Math.sin(ang) * rP * 0.55 * att, ZT + 0.12 + 0.16 * att);
      const pr = rP * (0.2 + 0.18 * att);
      items.push({k: 'e', e: ellipsoid(c, pk, [v3(pr, 0, 0), v3(0, pr, 0), v3(0, 0, 0.1 + 0.2 * att)]), g: 'dome'});
    }
    if (sp > 0.05) {
      // trailing beads
      for (let i = 1; i <= 2; i++) {
        const q = v3(P.x - Math.cos(va) * rP * (1.1 + 0.55 * i), P.y - Math.sin(va) * rP * (1.1 + 0.55 * i), ZT);
        const r = rP * 0.28 * sp / i;
        if (r > 0.02) items.push({k: 'e', e: lump(c, q, r, r, 0.15), g: 'dome'});
      }
    }
    const pp = project(c, P);
    shadows.push(<SoftShadow key="pls" id="pool-sh" c={{x: pp.x + 6, y: pp.y + 6}} rx={rP * pp.k * 1.35} ry={rP * pp.k * 0.7} alpha={0.4} color="#03090C" />);
  }

  // ---------------------------------------------------------------- the cavity and its fill
  const Acav = affine(c, v3(CAV.x, CAV.yF, ZT), v3(1, 0, 0), v3(0, 1, 0));
  const Afloor = affine(c, v3(CAV.x, CAV.yF, ZT - FIG_T), v3(1, 0, 0), v3(0, 1, 0));
  const fv = FIG_H + 0.08 - (FIG_H + 0.22) * fillU;
  const cavItems: Goo[] = [];
  if (tp > 3.15 && tp < TP.freeze1 + 0.05) {
    for (const q of CAV_PTS) {
      const r = 0.12 * ss(q.y - fv, -0.04, 0.12);
      if (r < 0.01) continue;
      cavItems.push({k: 'e', e: lump(c, v3(CAV.x + q.x, CAV.yF + q.y, ZT - 0.06), r, r, 0.08), g: 'flat'});
    }
  }


  return {items, shadows, cavItems, Acav, Afloor, ms, power, figGone, deformed, Afig, sweepFig, kf};
};
