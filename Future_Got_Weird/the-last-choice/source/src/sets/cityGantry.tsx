// Gantry — the maintenance crossing over the broken span. Two lattice legs on the deck sections (near x = 10200, far
// x = 12800, both standing on y = −1600), a box top beam (y ≈ −2560 … −2440), a trolley riding under the beam with a
// hanging basket platform, a narrow suspended walkway (behind the basket's path) on hanger rods, and the control box with
// the dead-man lever on the near deck (x ≈ 10380).
//
// State (all optional except u):
//   u        trolley position 0 (near, basket beside the near edge) … 1 (far, docked at the landing)
//   swing    basket swing (deg, + = bottom swings toward +x)
//   lever    lever angle (deg from vertical, + = pushed east / engaged)
//   split    walkway severed at x: {x, p 0…1, sagNear (deg), sagFar (deg)} — halves droop about their last hanger
//   collapse 0…1: the near leg topples west about its base (onto the near deck), then the beam swings down about the
//            far leg top until its near end rests on the near deck
//
// Layers (draw in this order around the figures):
//   'back'        legs, beam, trolley, walkway deck + back rail + hangers, control box and lever
//   (walkway walkers)
//   'walkFront'   walkway front rail
//   'basketBack'  basket floor, back rail, back cables
//   (basket riders)
//   'basketFront' basket front rail, posts, front cables
// 'all' draws everything (no figures).
import React from 'react';
import {f2, range, polyPath, INK, K, clamp, lerp} from './cityKit';
import {easeIn} from '../kit/math';

export const GANTRY = {
  nearLeg: 10200, farLeg: 12800, deck: -1600, beamTop: -2560, beamBot: -2440, sheaveY: -2410, cable: 810,
  basketW: 760, railH: 260, uX0: 10880, uX1: 12120, walkY: -1600, hangers: [10650, 10950, 11250, 11550, 11850, 12150, 12450],
  box: {x: 10380, w: 140, h: 280}, leverPivot: {x: 10380, y: -1890}, leverLen: 190,
};
export type GantryState = {u: number; swing?: number; lever?: number; split?: {x: number; p: number; sagNear?: number; sagFar?: number}; collapse?: number};

type P = {x: number; y: number};
const NEAR_EDGE_X = 10500, FAR_EDGE_X = 12500;
const rot = (p: P, c: P, deg: number): P => {
  const a = (deg * Math.PI) / 180, s = Math.sin(a), co = Math.cos(a);
  const dx = p.x - c.x, dy = p.y - c.y;
  return {x: c.x + dx * co - dy * s, y: c.y + dx * s + dy * co};
};
const PIVOT = {x: GANTRY.farLeg, y: GANTRY.beamTop + 60};
/** Beam rotation (deg, negative = near end down) and near-leg topple angle for a collapse progress. */
export const collapseAngles = (c = 0) => {
  const leg = -90 * easeIn(clamp(c / 0.75));
  const beam = -18.6 * easeIn(clamp((c - 0.12) / 0.88));
  return {leg, beam};
};
/** A point fixed to the beam (given in its rest position) after collapse. */
const onBeam = (p: P, st: GantryState) => rot(p, PIVOT, collapseAngles(st.collapse).beam);

export const trolleyX = (u: number) => lerp(GANTRY.uX0, GANTRY.uX1, clamp(u));
/** Sheave (cable hang point) under the trolley, world. */
export const sheavePoint = (st: GantryState) => onBeam({x: trolleyX(st.u), y: GANTRY.sheaveY}, st);
/** Basket floor centre (top surface), world. */
export const basketFloor = (st: GantryState) => {
  const s = sheavePoint(st);
  return rot({x: s.x, y: s.y + GANTRY.cable}, s, -(st.swing ?? 0));
};
/** Map a point in basket-local coordinates (origin floor centre, x along the basket, y up negative) to world. */
export const basketPoint = (st: GantryState, lx: number, ly: number) => {
  const f = basketFloor(st);
  return rot({x: f.x + lx, y: f.y + ly}, f, -(st.swing ?? 0));
};
/** Lever handle (world) for a lever angle. */
export const leverHandle = (deg = 0) => {
  const a = (deg * Math.PI) / 180;
  return {x: GANTRY.leverPivot.x + Math.sin(a) * GANTRY.leverLen, y: GANTRY.leverPivot.y - Math.cos(a) * GANTRY.leverLen};
};
/** Walkway hinge geometry for a split. */
const splitGeom = (st: GantryState) => {
  const sp = st.split;
  if (!sp) return null;
  // the hanger nearest each side of the cut fails too, so each half pivots on the second hanger back
  const before = GANTRY.hangers.filter((h) => h < sp.x - 60), after = GANTRY.hangers.filter((h) => h > sp.x + 60);
  const hn = before.length > 1 ? before[before.length - 2] : NEAR_EDGE_X;
  const hf = after.length > 1 ? after[1] : FAR_EDGE_X;
  return {hn, hf, aN: (sp.sagNear ?? 24) * clamp(sp.p), aF: -(sp.sagFar ?? 42) * clamp(sp.p), gap: 30 * clamp(sp.p * 3)};
};
/** Walkway top-surface point at x (world), following the split droop and the collapse. */
export const walkPoint = (st: GantryState, x: number): P => {
  let p: P = {x, y: GANTRY.walkY};
  const g = splitGeom(st);
  if (g && st.split) {
    if (x >= g.hn && x <= st.split.x) p = rot({x: Math.min(x, st.split.x - g.gap), y: GANTRY.walkY}, {x: g.hn, y: GANTRY.walkY}, g.aN);
    if (x <= g.hf && x > st.split.x) p = rot({x: Math.max(x, st.split.x + g.gap), y: GANTRY.walkY}, {x: g.hf, y: GANTRY.walkY}, g.aF);
  }
  return (st.collapse ?? 0) > 0 && x > 10500 ? onBeam({x: p.x, y: p.y}, st) : p;
};
/** The two broken walkway edges (world) for a split. */
export const splitEdges = (st: GantryState) => {
  if (!st.split) return null;
  return {near: walkPoint(st, st.split.x - 1), far: walkPoint(st, st.split.x + 1)};
};
/** Where the toppled near leg's top lands (for impact effects). */
export const legTop = (st: GantryState) => rot({x: GANTRY.nearLeg, y: GANTRY.beamBot}, {x: GANTRY.nearLeg, y: GANTRY.deck}, collapseAngles(st.collapse).leg);

// ------------------------------------------------------------------ drawing
const Lattice: React.FC<{a: P; b: P; w: number; ink: number; n?: number}> = ({a, b, w, ink, n = 6}) => {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * w / 2, ny = (dx / L) * w / 2;
  const A1 = {x: a.x + nx, y: a.y + ny}, A2 = {x: a.x - nx, y: a.y - ny}, B1 = {x: b.x + nx, y: b.y + ny}, B2 = {x: b.x - nx, y: b.y - ny};
  const diag = range(n).map((i) => {
    const u0 = i / n, u1 = (i + 1) / n;
    const p0 = i % 2 ? {x: A1.x + (B1.x - A1.x) * u0, y: A1.y + (B1.y - A1.y) * u0} : {x: A2.x + (B2.x - A2.x) * u0, y: A2.y + (B2.y - A2.y) * u0};
    const p1 = i % 2 ? {x: A2.x + (B2.x - A2.x) * u1, y: A2.y + (B2.y - A2.y) * u1} : {x: A1.x + (B1.x - A1.x) * u1, y: A1.y + (B1.y - A1.y) * u1};
    return <line key={i} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={K.steelDark} strokeWidth={ink * 1.6} />;
  });
  return (
    <g>
      {diag}
      {[[A1, B1], [A2, B2]].map(([p, q], i) => (
        <g key={`c${i}`}>
          <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={INK} strokeWidth={34 + ink * 2} strokeLinecap="square" />
          <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#C9A033" strokeWidth={34} strokeLinecap="square" />
        </g>
      ))}
    </g>
  );
};

const railLine = (pts: P[], w: number, color: string, ink: number, key: string) => (
  <g key={key}>
    <polyline points={pts.map((p) => `${f2(p.x)},${f2(p.y)}`).join(' ')} fill="none" stroke={INK} strokeWidth={w + ink * 2} strokeLinecap="round" strokeLinejoin="round" />
    <polyline points={pts.map((p) => `${f2(p.x)},${f2(p.y)}`).join(' ')} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

export const Gantry: React.FC<GantryState & {t?: number; ink?: number; layer?: 'back' | 'walkFront' | 'basketBack' | 'basketFront' | 'all'}> = (st) => {
  const ink = st.ink ?? 6;
  const layer = st.layer ?? 'all';
  const show = (l: string) => layer === 'all' || layer === l;
  const {leg} = collapseAngles(st.collapse);
  const els: React.ReactElement[] = [];
  const Y = GANTRY;

  if (show('back')) {
    // far leg (stands), near leg (topples west about its base)
    els.push(<Lattice key="farleg" a={{x: Y.farLeg, y: Y.deck}} b={{x: Y.farLeg, y: Y.beamBot}} w={170} ink={ink} />);
    els.push(<Lattice key="nearleg" a={{x: Y.nearLeg, y: Y.deck}} b={rot({x: Y.nearLeg, y: Y.beamBot}, {x: Y.nearLeg, y: Y.deck}, leg)} w={170} ink={ink} />);
    [Y.nearLeg, Y.farLeg].forEach((lx, i) => els.push(<rect key={`foot${i}`} x={lx - 140} y={Y.deck - 30} width={280} height={30} fill={K.steelDark} stroke={INK} strokeWidth={ink} />));
    // beam (box girder) with a walkway-hanger flange
    const b0 = onBeam({x: Y.nearLeg - 120, y: Y.beamTop}, st), b1 = onBeam({x: Y.farLeg + 120, y: Y.beamTop}, st);
    const b2 = onBeam({x: Y.farLeg + 120, y: Y.beamBot}, st), b3 = onBeam({x: Y.nearLeg - 120, y: Y.beamBot}, st);
    els.push(<path key="beam" d={polyPath([b0, b1, b2, b3])} fill="#D7AE3A" stroke={INK} strokeWidth={ink} strokeLinejoin="round" />);
    range(9).forEach((i) => {
      const u = (i + 0.5) / 9;
      const p = onBeam({x: lerp(Y.nearLeg - 120, Y.farLeg + 120, u), y: Y.beamTop + 6}, st), q = onBeam({x: lerp(Y.nearLeg - 120, Y.farLeg + 120, u), y: Y.beamBot - 6}, st);
      els.push(<line key={`bs${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#A9842A" strokeWidth={ink * 1.2} />);
    });
    // hazard stripes at the ends (shapes only)
    [0, 1].forEach((e) => {
      const xe = e ? Y.farLeg + 120 : Y.nearLeg - 120;
      range(3).forEach((k) => {
        const p = onBeam({x: xe + (e ? -1 : 1) * (20 + k * 40), y: Y.beamTop + 10}, st), q = onBeam({x: xe + (e ? -1 : 1) * (40 + k * 40), y: Y.beamBot - 10}, st);
        els.push(<line key={`hz${e}${k}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#2A2426" strokeWidth={14} />);
      });
    });
    // walkway: hangers, deck and back rail (behind the basket's path)
    const g = splitGeom(st);
    const xs = [Y.nearLeg + 60, ...range(26).map((i) => Y.nearLeg + 100 + (i * (Y.farLeg - Y.nearLeg - 200)) / 25), Y.farLeg - 60];
    const sp = st.split;
    const nearPts = xs.filter((x) => !sp || x < sp.x).map((x) => walkPoint(st, x));
    const farPts = xs.filter((x) => sp && x > sp.x).map((x) => walkPoint(st, x));
    if (sp) { nearPts.push(walkPoint(st, sp.x - 1)); farPts.unshift(walkPoint(st, sp.x + 1)); }
    Y.hangers.forEach((hx, i) => {
      const top = onBeam({x: hx, y: Y.beamBot}, st);
      const broken = g && sp && ((hx > g.hn && hx < sp.x) || (hx < g.hf && hx > sp.x));
      const bot = walkPoint(st, hx);
      if (broken) {
        const p = clamp(sp!.p * 4);
        els.push(<line key={`hg${i}`} x1={top.x} y1={top.y} x2={top.x} y2={top.y + 120 + 300 * (1 - p)} stroke={K.steelDark} strokeWidth={ink * 1.3} />);
        els.push(<line key={`hgb${i}`} x1={bot.x} y1={bot.y - 250} x2={bot.x + 30 * p} y2={bot.y - 250 - 120 * (1 - p * 0.5)} stroke={K.steelDark} strokeWidth={ink * 1.3} />);
      } else els.push(<line key={`hg${i}`} x1={top.x} y1={top.y} x2={bot.x} y2={bot.y - 250} stroke={K.steelDark} strokeWidth={ink * 1.3} />);
    });
    [nearPts, farPts].forEach((pts, j) => {
      if (pts.length < 2) return;
      // deck: offset back up by 16 to read as behind the basket's plane
      els.push(railLine(pts.map((p) => ({x: p.x, y: p.y + 10})), 26, K.steelDark, ink, `wd${j}`));
      els.push(railLine(pts.map((p) => ({x: p.x + 14, y: p.y - 236})), 12, K.steel, ink * 0.7, `wb${j}`));
    });
    // trolley
    const s = sheavePoint(st);
    const tr = onBeam({x: trolleyX(st.u), y: Y.beamBot}, st);
    els.push(<g key="trolley" transform={`rotate(${f2(collapseAngles(st.collapse).beam)} ${f2(tr.x)} ${f2(tr.y)})`}>
      <rect x={tr.x - 110} y={tr.y - 20} width={220} height={70} rx={10} fill={K.steelDark} stroke={INK} strokeWidth={ink} />
      {[-70, 70].map((dx, k) => <circle key={k} cx={tr.x + dx} cy={tr.y - 22} r={24} fill={K.steel} stroke={INK} strokeWidth={ink * 0.8} />)}
      <circle cx={tr.x} cy={tr.y + 52} r={26} fill={K.steel} stroke={INK} strokeWidth={ink * 0.8} />
    </g>);
    void s;
    // control box + lever
    const bx = Y.box;
    const h = leverHandle(st.lever ?? 0);
    els.push(<g key="box">
      <rect x={bx.x - bx.w / 2} y={Y.deck - bx.h} width={bx.w} height={bx.h} rx={10} fill={K.sysShade} stroke={INK} strokeWidth={ink} />
      <rect x={bx.x - bx.w / 2 + 20} y={Y.deck - bx.h + 40} width={bx.w - 40} height={70} rx={6} fill={K.sysDark} />
      <circle cx={bx.x - 20} cy={Y.deck - bx.h + 75} r={12} fill={(st.lever ?? 0) > 15 ? '#7BE08A' : '#E0543E'} />
      <rect x={bx.x - bx.w / 2 - 10} y={Y.deck - bx.h - 16} width={bx.w + 20} height={20} rx={6} fill={K.sysSlate} stroke={INK} strokeWidth={ink * 0.8} />
      <line x1={Y.leverPivot.x} y1={Y.leverPivot.y} x2={h.x} y2={h.y} stroke={INK} strokeWidth={18 + ink * 2} strokeLinecap="round" />
      <line x1={Y.leverPivot.x} y1={Y.leverPivot.y} x2={h.x} y2={h.y} stroke={K.steel} strokeWidth={18} strokeLinecap="round" />
      <circle cx={h.x} cy={h.y} r={24} fill="#E0543E" stroke={INK} strokeWidth={ink} />
      <circle cx={Y.leverPivot.x} cy={Y.leverPivot.y} r={16} fill={K.sysSlate} stroke={INK} strokeWidth={ink * 0.8} />
    </g>);
  }
  if (show('walkFront')) {
    const sp = st.split;
    const xs = [Y.nearLeg + 60, ...range(26).map((i) => Y.nearLeg + 100 + (i * (Y.farLeg - Y.nearLeg - 200)) / 25), Y.farLeg - 60];
    const nearPts = xs.filter((x) => !sp || x < sp.x).map((x) => walkPoint(st, x));
    const farPts = xs.filter((x) => sp && x > sp.x).map((x) => walkPoint(st, x));
    if (sp) { nearPts.push(walkPoint(st, sp.x - 1)); farPts.unshift(walkPoint(st, sp.x + 1)); }
    [nearPts, farPts].forEach((pts, j) => {
      if (pts.length < 2) return;
      els.push(railLine(pts.map((p) => ({x: p.x, y: p.y - 250})), 14, K.steel, ink * 0.7, `wf${j}`));
      els.push(railLine(pts.map((p) => ({x: p.x, y: p.y - 125})), 9, K.steel, ink * 0.5, `wm${j}`));
      els.push(railLine(pts.map((p) => ({x: p.x, y: p.y + 14})), 16, K.steelDark, ink * 0.6, `wt${j}`));
      pts.filter((_, i) => i % 3 === 0).forEach((p, i) => els.push(<line key={`wp${j}${i}`} x1={p.x} y1={p.y} x2={p.x} y2={p.y - 250} stroke={K.steelDark} strokeWidth={ink * 1.2} />));
    });
  }
  const W = Y.basketW / 2, RH = Y.railH;
  const bp = (lx: number, ly: number) => basketPoint(st, lx, ly);
  const s = sheavePoint(st);
  if (show('basketBack')) {
    const back = (lx: number, ly: number) => { const q = bp(lx + 10, ly - 14); return q; };
    els.push(<path key="bfloor" d={polyPath([bp(-W, 0), bp(W, 0), bp(W, 34), bp(-W, 34)])} fill={K.steelDark} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />);
    els.push(<path key="bfloort" d={polyPath([bp(-W, 0), bp(W, 0), back(W, 0), back(-W, 0)])} fill={K.steel} stroke={INK} strokeWidth={ink * 0.6} />);
    els.push(railLine([back(-W, -RH), back(W, -RH)], 12, '#C9A033', ink * 0.7, 'bbr'));
    els.push(railLine([back(-W, -RH / 2), back(W, -RH / 2)], 9, '#C9A033', ink * 0.5, 'bbm'));
    [-W, 0, W].forEach((lx, i) => els.push(railLine([back(lx, 0), back(lx, -RH)], 10, '#B08A28', ink * 0.5, `bbp${i}`)));
    els.push(<line key="cbk" x1={s.x} y1={s.y} x2={back(-W, -RH).x} y2={back(-W, -RH).y} stroke="#2A2E33" strokeWidth={ink * 1.2} />);
    els.push(<line key="cbk2" x1={s.x} y1={s.y} x2={back(W, -RH).x} y2={back(W, -RH).y} stroke="#2A2E33" strokeWidth={ink * 1.2} />);
  }
  if (show('basketFront')) {
    els.push(railLine([bp(-W, -RH), bp(W, -RH)], 16, '#E2B53C', ink, 'bfr'));
    els.push(railLine([bp(-W, -RH / 2), bp(W, -RH / 2)], 11, '#E2B53C', ink * 0.8, 'bfm'));
    els.push(<path key="toe" d={polyPath([bp(-W, 0), bp(W, 0), bp(W, -44), bp(-W, -44)])} fill="#D7AE3A" stroke={INK} strokeWidth={ink} strokeLinejoin="round" />);
    [-W, -W / 3, W / 3, W].forEach((lx, i) => els.push(railLine([bp(lx, 0), bp(lx, -RH)], 14, '#C9A033', ink * 0.8, `bfp${i}`)));
    els.push(<line key="cf1" x1={s.x} y1={s.y} x2={bp(-W, -RH).x} y2={bp(-W, -RH).y} stroke={INK} strokeWidth={ink * 1.5} />);
    els.push(<line key="cf2" x1={s.x} y1={s.y} x2={bp(W, -RH).x} y2={bp(W, -RH).y} stroke={INK} strokeWidth={ink * 1.5} />);
    els.push(<circle key="hook" cx={s.x} cy={s.y} r={16} fill={K.steelDark} stroke={INK} strokeWidth={ink * 0.8} />);
  }
  return <g>{els}</g>;
};
