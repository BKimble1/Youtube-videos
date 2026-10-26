// Glass Climbing V8: the microscopic section, rebuilt (replaces v5/Micro5 for the wedge beats).
// A side section through one tile's edge and the surface it is on, in the bay's own orientation: the surface on the
// LEFT (a fixed vertical band: clear glass, or rough fired brick), the tile on the RIGHT (its darker silicone backing
// sheet with the tile's rigid plate behind it), "down" is down. World units are microns, x = 0 is the glass face.
// A small group of large silicone wedges (about 100 um long, as on the Stanford pads) is rooted in the backing.
// Physics drawn (frictional adhesion, Hawkes/Cutkosky microwedges):
//  - Each wedge leans UP toward the surface, so its tip TRAILS the downward pull. Unloaded, only the tips touch.
//  - Shear: the backing slides DOWN. The tips that touch stay put (friction). Each blade is inextensible, so as its
//    root is dragged down the blade swings over and the backing is drawn in toward the glass (the blades are in
//    tension); the thin tip lies flat on the glass and the flat contact strip grows from the tip, from a point to a
//    long strip. That close contact is what lets the short-range attractions add up (Mol8).
//  - Unloading (shear back to 0) lets the blades spring back to their rest shape; only the tips touch again.
//  - Brick: only the tips that land on the brick's highest points touch; they can bend only a little; the rest hang
//    over the gaps. Slip: the backing drags on, the touching tips are pulled off their peaks, flick back and the pad
//    skids down. Nothing ever penetrates the brick (the profile is designed for it and a final guard enforces it).
// Every value is a pure function of the state (no randomness, no time).
import React from 'react';
import {INK} from '../dc/ink';
import {lit, mix, shade} from '../dc/color';
import {clamp, hash, lerp, V} from '../dc/math';
import {Cam} from '../dc/camera';
import {H, W} from '../lib';

// ------------------------------------------------------------------ constants
export const WG = {
  L: 100, // blade length (um), constant
  pitch: 60, // wedge spacing along the surface (um)
  lean: 32, // rest angle of the blade above the -x axis (deg): leaning up toward the surface
  wRoot: 24, // blade thickness at the root (um)
  wTip: 2.2, // blade thickness at the tip (um)
  gap: 16, // approach 0: how far every tip clears the surface (um)
  slide: 26, // shear 1: how far the backing slides down (um)
  strip: 32, // shear 1 on glass: the flat contact strip's length (um)
  rootTurn: 10, // shear 1: the blade's root tilts this much toward the surface (deg; the backing is compliant too)
  sheet: 30, // backing sheet thickness (um); the tile's plate is behind it
  brickSlide: 10, // shear 1 on brick: backing slide while the few touching tips hold (um)
  brickTurn: 0.3, // shear 1 on brick: fraction of the glass tip turn (they bend only a little)
  slipSlide: 50, // slip 1 on brick: further backing slide (um)
  peel: 16, // slip 1 on brick: the pad springs back off the brick (um)
};
export type WedgeSurface = 'glass' | 'brick';
export type WedgeState = {
  surface: WedgeSurface;
  /** 0: the backing held off, every tip clears the surface by WG.gap; 1: tips just touching the glass / the brick's peaks */
  approach: number;
  /** 0..1 downward shear of the backing (the integrator eases it) */
  shear: number;
  /** 0..1 brick only: the backing drags on, the touching tips are pulled off their peaks, flick and the pad skids down */
  slip?: number;
  /** index of a wedge to emphasise subtly (lighter fill, brighter lit edge) */
  focus?: number;
  /** 0..1 strength of that emphasis (default 1 when focus is given) */
  focusK?: number;
  /** um: a residual gap between the flat strips and the glass (the molecular gap; only visible deep in the zoom) */
  molGap?: number;
};

// palette (restrained: the pad's own silicone and plate colours, a pale teal glass, a fired-clay brick)
export const WCOL = {
  ground: '#172631',
  glassFace: '#A6D8D6',
  glassMid: '#7EBBBC',
  glassDeep: '#5C9AA0',
  glassEdge: '#ECFCF9',
  contact: '#3E7F88',
  wedge: '#DCE9EB',
  sheet: '#8CA6AE',
  plate: '#4F5D68',
  plateEdge: '#8E9CA6',
  brick: '#A65A3E',
  brickDeep: '#8C462F',
  brickLit: '#D08B6C',
  brickDark: '#6A3020',
};

/** the sheet's face tone: the blades' roots and the moulded fillets share it, so the joint has no seam */
const ROOT = lit(WCOL.sheet, 0.1);
const RAD = Math.PI / 180;
const PHI = WG.lean * RAD;
const HALF_PI = Math.PI / 2;
/** unit direction "up and toward the surface" at angle a above the -x axis */
const dirA = (a: number): V => ({x: -Math.cos(a), y: -Math.sin(a)});
/** the root's offset from the tip at rest */
const REST: V = {x: WG.L * Math.cos(PHI), y: WG.L * Math.sin(PHI)};
const sm = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// ------------------------------------------------------------------ the brick profile
// x(y) <= 0 of the brick face. Its highest points (x = 0) sit exactly where every third wedge's tip lands
// (wedge i = 1 mod 3); every other tip faces a recess, so it hangs over a gap. Angular, crisp facets.
const BRICK_P = 3 * WG.pitch;
const brickVerts = (m: number): [number, number][] => {
  const yA = WG.pitch + m * BRICK_P; // the apex under wedge 3m+1
  const h = (k: number) => hash(m * 17 + k, 911);
  return [
    [yA - 2.6, -1.2],
    [yA, 0],
    [yA + 2.4, -1.4],
    [yA + 22 + 3 * h(1), -29 - 4 * h(2)],
    [yA + 36 + 4 * h(3), -46 - 7 * h(4)],
    [yA + 58 + 5 * h(5), -38 - 5 * h(6)],
    [yA + 90 + 6 * h(7), -21 - 6 * h(8)],
    [yA + 104 + 3 * h(9), -30 - 4 * h(10)],
    [yA + 126 + 5 * h(11), -52 - 6 * h(12)],
    [yA + 150 + 3 * h(13), -31 - 5 * h(14)],
    [yA + 166, -13 - 2 * h(15)],
  ];
};
/** the brick face x at height y (um) */
export const brickX = (y: number) => {
  const m = Math.floor((y - WG.pitch + 2.6) / BRICK_P);
  const vs = [...brickVerts(m), ...brickVerts(m + 1).slice(0, 2)];
  for (let i = 0; i < vs.length - 1; i++) {
    const [ya, xa] = vs[i], [yb, xb] = vs[i + 1];
    if (y >= ya && y <= yb) return lerp(xa, xb, (y - ya) / (yb - ya || 1));
  }
  return -30;
};
const brickPoly = (y0: number, y1: number): V[] => {
  const out: V[] = [{x: brickX(y0), y: y0}];
  const m0 = Math.floor((y0 - WG.pitch) / BRICK_P) - 1, m1 = Math.ceil((y1 - WG.pitch) / BRICK_P) + 1;
  for (let m = m0; m <= m1; m++) for (const [y, x] of brickVerts(m)) if (y > y0 && y < y1) out.push({x, y});
  out.push({x: brickX(y1), y: y1});
  return out;
};
const touchesBrick = (i: number) => ((i % 3) + 3) % 3 === 1;
const surfX = (s: WedgeSurface, y: number) => (s === 'glass' ? 0 : brickX(y));

// ------------------------------------------------------------------ blade geometry
/** quintic Bezier (6 control points) */
const bez5 = (P: V[], t: number): V => {
  const u = 1 - t;
  const b = [u ** 5, 5 * u ** 4 * t, 10 * u ** 3 * t * t, 10 * u * u * t ** 3, 5 * u * t ** 4, t ** 5];
  let x = 0, y = 0;
  for (let i = 0; i < 6; i++) {
    x += b[i] * P[i].x;
    y += b[i] * P[i].y;
  }
  return {x, y};
};
export const HK = {a: 0.42, b: 0.3}; // handle fractions of the chord (root, strip end)
const NB = 40; // samples along the free (curved) part
const NS = 10; // samples along the flat strip
/** the gripping face (the face toward the surface) from the root R to the tip T: a curve leaving R along angle thR
 *  and arriving at Q = T - e c along e (angle thE), then the flat strip Q -> T (length c). The curve is a quintic
 *  whose end controls are collinear with the end tangents, so its curvature is zero at the root and where it meets
 *  the strip: the bend comes on smoothly (no corner on the thick back face) */
const gripLine = (R: V, thR: number, T: V, thE: number, c: number) => {
  const e = dirA(thE), dR = dirA(thR);
  const Q = {x: T.x - e.x * c, y: T.y - e.y * c};
  const ch = Math.hypot(Q.x - R.x, Q.y - R.y);
  // stiff root (long handle), compliant tip (short handle); the root handle never reaches past the surface
  const a = Math.min(HK.a * ch, (R.x - Q.x) * 0.9 / Math.max(0.05, Math.cos(thR))) / 2;
  const b = (HK.b * ch) / 2;
  const P = [R, {x: R.x + dR.x * a, y: R.y + dR.y * a}, {x: R.x + dR.x * 2 * a, y: R.y + dR.y * 2 * a}, {x: Q.x - e.x * 2 * b, y: Q.y - e.y * 2 * b}, {x: Q.x - e.x * b, y: Q.y - e.y * b}, Q];
  const pts: V[] = [];
  for (let i = 0; i <= NB; i++) pts.push(bez5(P, i / NB));
  for (let i = 1; i <= NS; i++) pts.push({x: Q.x + e.x * (c * i) / NS, y: Q.y + e.y * (c * i) / NS});
  const s: number[] = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return {pts, s, len: s[s.length - 1]};
};
type Pose = {thR: number; thE: number; c: number; dy: number};
/** the root x (with the tip pinned at T) that keeps the blade's length exactly WG.L */
const solveRootX = (T: V, p: Pose) => {
  let lo = T.x + 2, hi = T.x + REST.x + 40;
  for (let it = 0; it < 44; it++) {
    const mid = (lo + hi) / 2;
    const g = gripLine({x: mid, y: T.y + p.dy}, p.thR, T, p.thE, p.c);
    if (g.len > WG.L) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
};
const glassPose = (k: number): Pose => ({
  thR: PHI + WG.rootTurn * RAD * k,
  thE: PHI + (HALF_PI - PHI) * sm(0, 0.42, k),
  c: WG.strip * sm(0.05, 1, k),
  dy: REST.y + WG.slide * k,
});
/** brick: k the load, `extra` the creep of the backing before the held tips let go (um), `strain` 0..1 of it */
const brickPose = (k: number, extra: number, strain = 0): Pose => ({
  thR: PHI + WG.rootTurn * RAD * (0.4 + 0.5 * strain) * k,
  thE: PHI + (HALF_PI - PHI) * WG.brickTurn * (sm(0, 0.6, k) + 0.9 * strain),
  c: 0,
  dy: REST.y + WG.brickSlide * k + extra,
});
/** the held tips' strain during the creep before release (0..1) */
const strainOf = (slip: number) => sm(0, 0.2, slip);

/** the release of the touching brick tips over slip (0: held, 1: free) */
const relOf = (slip: number) => sm(0.16, 0.36, slip);
/** the brick slip's backing slide (um): a short creep while the tips hold, then the skid */
const slipY = (slip: number) => WG.slipSlide * (0.24 * sm(0, 0.26, slip) + 0.76 * sm(0.2, 1, slip) ** 1.15);

export type Backing = {x: number; y: number; k: number};
/** where the backing face is: x of its face, y its downward slide from rest (um), k the effective load */
export const backingAt = (st: WedgeState): Backing => {
  const ap = clamp(st.approach), sh = clamp(st.shear), slip = clamp(st.slip ?? 0);
  const k = sh * sm(0.85, 1, ap); // the blades only bend while the tips are on the surface
  const lift = WG.gap * (1 - ap);
  const mg = st.molGap ?? 0;
  if (st.surface === 'glass') {
    return {x: solveRootX({x: mg, y: 0}, glassPose(k)) + lift, y: WG.slide * sh, k};
  }
  const sy = slipY(slip);
  const held = solveRootX({x: 0, y: 0}, brickPose(k, sy * k, strainOf(slip) * k));
  const free = REST.x + WG.peel * sm(0.25, 0.95, slip);
  const r = relOf(slip);
  return {x: lerp(held, free, r) + lift, y: WG.brickSlide * sh + sy * sh, k};
};

type Blade = {
  grip: V[];
  back: V[];
  root: V;
  tip: V;
  /** the flat contact on the surface: [top, bottom] along the face, and how much it is in contact (0..1) */
  contact: {y0: number; y1: number; x: number; k: number} | null;
  i: number;
};

/** a blade's outline (gripping face + back face) from its gripping-face polyline */
const thick = (pts: V[], s: number[]) => {
  const n = pts.length;
  const back: V[] = [];
  let tx = 0, ty = -1;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
    // (a strip of zero length has coincident points: keep the last real direction)
    if (l > 1e-6) {
      tx = dx / l;
      ty = dy / l;
    }
    const nx = -ty, ny = tx; // the back side (away from the surface)
    const u = clamp(s[i] / WG.L);
    const w = WG.wTip + (WG.wRoot - WG.wTip) * (1 - u) ** 1.1;
    back.push({x: pts[i].x + nx * w, y: pts[i].y + ny * w});
  }
  return back;
};

/** wedge i's blade for a state */
export const bladeOf = (st: WedgeState, i: number, B: Backing = backingAt(st)): Blade => {
  const ap = clamp(st.approach), slip = clamp(st.slip ?? 0);
  const mg = st.molGap ?? 0;
  const k = B.k;
  const rootY = i * WG.pitch + REST.y + B.y;
  if (st.surface === 'glass') {
    // the solved shape for load k, pinned at (mg, 0) with its root at rest-y + slide*k, carried with the backing
    const p = glassPose(k);
    const R0 = {x: solveRootX({x: mg, y: 0}, p), y: p.dy};
    const g = gripLine(R0, p.thR, {x: mg, y: 0}, p.thE, p.c);
    const off = {x: B.x - R0.x, y: rootY - R0.y};
    const pts = g.pts.map((q) => ({x: q.x + off.x, y: q.y + off.y}));
    const back = thick(pts, g.s);
    const touch = sm(0.97, 1, ap);
    // contact: the strip that lies flat (within a hair of the face), plus the tip's point contact
    const flat = p.c > 0 ? Math.min(p.c, 0.25 / Math.max(1e-3, Math.cos(p.thE))) : 0;
    const tip = pts[pts.length - 1];
    return {grip: pts, back, root: pts[0], tip, i, contact: touch > 0.001 ? {x: mg, y0: tip.y - 0.4, y1: tip.y + Math.max(1.2, flat), k: touch} : null};
  }
  // brick
  const touching = touchesBrick(i);
  const restGrip = (thR: number, R: V) => {
    const T = {x: R.x - WG.L * Math.cos(thR), y: R.y - WG.L * Math.sin(thR)};
    return gripLine(R, thR, T, thR, 0);
  };
  const R = {x: B.x, y: rootY};
  if (!touching || k < 1e-4) {
    const g = restGrip(PHI, R);
    const pts = guard(g.pts);
    const back = guard(thick(pts, g.s));
    const tip = pts[pts.length - 1];
    const on = touching ? sm(0.97, 1, ap) : 0;
    return {grip: pts, back, root: pts[0], tip, i, contact: on > 0.001 ? {x: 0, y0: tip.y - 1.2, y1: tip.y + 1.2, k: on} : null};
  }
  const sy = slipY(slip);
  const p = brickPose(k, sy * k, strainOf(slip) * k);
  const apex = {x: 0, y: i * WG.pitch};
  const Rh = {x: solveRootX(apex, p), y: apex.y + p.dy};
  const held = gripLine(Rh, p.thR, apex, p.thE, 0);
  const r = relOf(slip);
  // the flick: released, the blade springs back past its rest angle and settles (a damped swing over slip)
  const ds = Math.max(0, slip - 0.2);
  const fl = 15 * RAD * k * Math.exp(-ds * 5.5) * Math.sin(ds * 21);
  const free = restGrip(PHI - fl, R);
  const off = {x: R.x - Rh.x, y: R.y - Rh.y};
  const pts = guard(held.pts.map((q, j) => {
    const h = {x: q.x + off.x, y: q.y + off.y};
    return {x: lerp(h.x, free.pts[j].x, r), y: lerp(h.y, free.pts[j].y, r)};
  }));
  const sArr = held.s.map((v, j) => lerp(v, free.s[j], r));
  const back = guard(thick(pts, sArr));
  const tip = pts[pts.length - 1];
  const on = (1 - sm(0, 0.35, r)) * sm(0.97, 1, ap);
  return {grip: pts, back, root: pts[0], tip, i, contact: on > 0.001 ? {x: 0, y0: tip.y - 1.2, y1: tip.y + 1.2, k: on} : null};
};
/** the no-penetration guard for brick (inactive by design; it only ever nudges a point back to the face) */
const guard = (pts: V[]) => pts.map((q) => {
  const sx = brickX(q.y);
  return q.x < sx ? {x: sx, y: q.y} : q;
});

/** world position (um) of wedge i's contact region: the strip on the face (top, bottom, mid). For a wedge not in
 *  contact it is where its tip is (or would land). Use it to zoom into one contact. */
export const contactRegion = (st: WedgeState, i: number) => {
  const b = bladeOf(st, i);
  if (b.contact) {
    const mid = {x: b.contact.x, y: (b.contact.y0 + b.contact.y1) / 2};
    return {x: b.contact.x, y0: b.contact.y0, y1: b.contact.y1, mid, inContact: b.contact.k};
  }
  return {x: surfX(st.surface, b.tip.y), y0: b.tip.y, y1: b.tip.y, mid: {x: surfX(st.surface, b.tip.y), y: b.tip.y}, inContact: 0};
};

// ------------------------------------------------------------------ cameras
/** the standard screen point of the focus contact (the glass face stays at x = 340 through the whole sequence) */
export const FACE_SX = 340;
export const FOCUS_SY = 1000;
export const FOCUS = 2;
/** the focus wedge's strip mid when fully loaded on glass (um) */
export const FOCUS_P: V = {x: 0, y: FOCUS * WG.pitch + WG.strip / 2};
/** a cam (at zoom z, px per um) that puts world point p at screen point (sx, sy) */
export const camAt = (p: V, z: number, sx = FACE_SX, sy = FOCUS_SY): Cam => ({x: p.x - (sx - W / 2) / z, y: p.y - (sy - H / 2) / z, z});
/** the section's camera for the whole wedge beat (unloaded, approach, shear): glass face fixed at x = 340 */
export const WEDGE_CAM: Cam = camAt(FOCUS_P, 5.2);
/** a slightly closer framing of the same (same glass face line, same focus point), for a slow push during the shear */
export const WEDGE_CAM_CLOSE: Cam = camAt(FOCUS_P, 6.0);
/** a brick framing at the section's scale: the apexes under wedges 1 and 4 at screen y 420 and 1356 (above the
 *  caption band), the face at x = 340 */
export const BRICK_CAM: Cam = camAt({x: 0, y: WG.pitch}, 5.2, FACE_SX, 420);

// ------------------------------------------------------------------ drawing
/** number formatting with enough decimals for the zoom, relative to an origin (deep zooms stay exact) */
const mkF = (z: number, org: V) => {
  const dp = Math.max(2, Math.min(9, Math.ceil(Math.log10(Math.max(1, z))) + 2));
  const n = (v: number) => (Math.abs(v) < 0.5 * 10 ** -dp ? '0' : v.toFixed(dp));
  const p = (q: V) => `${n(q.x - org.x)},${n(q.y - org.y)}`;
  const line = (pts: V[]) => `M${pts.map(p).join(' L')}`;
  return {n, p, line, dp, org};
};
type Fm = ReturnType<typeof mkF>;
/** the exact camera transform for content drawn relative to `org` */
export const camTransform = (cam: Cam, org: V = {x: 0, y: 0}) => {
  const f = mkF(cam.z, org);
  return `translate(${W / 2} ${H / 2}) scale(${cam.z.toFixed(6)}) translate(${f.n(-(cam.x - org.x))} ${f.n(-(cam.y - org.y))})`;
};
export type View = {x0: number; x1: number; y0: number; y1: number};
/** the world rect a cam sees (with a margin in screen px) */
export const viewOf = (cam: Cam, marginPx = 60): View => ({
  x0: cam.x - (W / 2 + marginPx) / cam.z,
  x1: cam.x + (W / 2 + marginPx) / cam.z,
  y0: cam.y - (H / 2 + marginPx) / cam.z,
  y1: cam.y + (H / 2 + marginPx) / cam.z,
});

const fillet = (f: Fm, C: V, u1: V, u2: V, d: number) => {
  const A = {x: C.x + u1.x * d, y: C.y + u1.y * d}, B = {x: C.x + u2.x * d, y: C.y + u2.y * d};
  return {fill: `M${f.p(C)} L${f.p(A)} Q${f.p(C)} ${f.p(B)} Z`, edge: `M${f.p(A)} Q${f.p(C)} ${f.p(B)}`};
};
const unit = (a: V, b: V): V => {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
  return {x: dx / l, y: dy / l};
};

const GlassBody: React.FC<{id: string; f: Fm; v: View; ink: number; z: number}> = ({id, f, v, ink, z}) => {
  const x0 = Math.min(v.x0, -1);
  const streaks: React.ReactNode[] = [];
  const k0 = Math.floor((v.y0 - 200) / 170), k1 = Math.ceil((v.y1 + 200) / 170);
  if (z < 400)
    for (let k = k0; k <= k1; k++) {
      const y = k * 170 + 40 * hash(k, 3);
      const w1 = 7 + 5 * hash(k, 5);
      streaks.push(<path key={k} d={`M${f.p({x: -66, y})} L${f.p({x: -24, y: y - 74})} L${f.p({x: -24 + w1, y: y - 74})} L${f.p({x: -66 + w1, y})} Z`} fill="#FFFFFF" opacity={0.09} />);
      streaks.push(<path key={`b${k}`} d={`M${f.p({x: -52, y: y + 26})} L${f.p({x: -14, y: y - 40})} L${f.p({x: -12, y: y - 40})} L${f.p({x: -50, y: y + 26})} Z`} fill="#FFFFFF" opacity={0.07} />);
    }
  const edgeW = Math.min(0.9, 3.2 / z);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-gl`} gradientUnits="userSpaceOnUse" x1={f.n(-90 - f.org.x)} y1="0" x2={f.n(0 - f.org.x)} y2="0">
          <stop offset="0" stopColor={WCOL.glassDeep} />
          <stop offset="0.55" stopColor={WCOL.glassMid} />
          <stop offset="0.93" stopColor={WCOL.glassFace} />
          <stop offset="1" stopColor={lit(WCOL.glassFace, 0.18)} />
        </linearGradient>
      </defs>
      <path d={`M${f.p({x: x0, y: v.y0})} L${f.p({x: 0, y: v.y0})} L${f.p({x: 0, y: v.y1})} L${f.p({x: x0, y: v.y1})} Z`} fill={`url(#${id}-gl)`} />
      {streaks}
      {/* the lit face edge (the air-glass reflection) */}
      <path d={`M${f.p({x: 0, y: v.y0})} L${f.p({x: 0, y: v.y1})} L${f.p({x: -edgeW, y: v.y1})} L${f.p({x: -edgeW, y: v.y0})} Z`} fill={WCOL.glassEdge} opacity={0.95} />
      <path d={`M${f.p({x: 0, y: v.y0})} L${f.p({x: 0, y: v.y1})}`} stroke={INK} strokeWidth={f.n(ink * 0.8)} opacity={0.55} />
    </g>
  );
};

const BrickBody: React.FC<{id: string; f: Fm; v: View; ink: number; z: number}> = ({id, f, v, ink, z}) => {
  const x0 = Math.min(v.x0, -80);
  const prof = brickPoly(v.y0, v.y1);
  const body = `M${f.p({x: x0, y: v.y0})} L${prof.map(f.p).join(' L')} L${f.p({x: x0, y: v.y1})} Z`;
  // the deeper clay a little inside the face (gives the solid its depth)
  const inner = `M${f.p({x: x0, y: v.y0})} L${prof.map((q) => f.p({x: Math.min(q.x, brickX(q.y - 4), brickX(q.y + 4)) - 9, y: q.y})).join(' L')} L${f.p({x: x0, y: v.y1})} Z`;
  // grains and pores of the fired clay, seeded by a fixed grid (fixed to the brick)
  const bits: React.ReactNode[] = [];
  const g0 = Math.floor(v.y0 / 7) - 1, g1 = Math.ceil(v.y1 / 7) + 1;
  for (let g = g0; g <= g1; g++)
    for (let c = 0; c < 9; c++) {
      const h1 = hash(g * 31 + c, 77), h2 = hash(g * 31 + c, 78), h3 = hash(g * 31 + c, 79), h4 = hash(g * 31 + c, 80);
      const y = g * 7 + h1 * 7;
      const x = -4 - c * 9.5 - h2 * 8;
      if (x > brickX(y) - 3.5 || x < x0) continue;
      if (h3 < 0.5) {
        // an angular grain
        const r = 1.1 + h4 * 2.2;
        const a = h1 * 6.28;
        const pts = [0, 1, 2, 3].map((j) => ({x: x + Math.cos(a + j * 1.7 + h2) * r * (0.7 + 0.5 * hash(g * 7 + j, c)), y: y + Math.sin(a + j * 1.7 + h2) * r * (0.7 + 0.5 * hash(g * 5 + j, c + 3))}));
        bits.push(<path key={`g${g}-${c}`} d={`M${pts.map(f.p).join(' L')} Z`} fill={h4 < 0.55 ? '#C27A5C' : '#7C3A27'} opacity={0.55} />);
      } else if (h3 < 0.68) {
        bits.push(<ellipse key={`p${g}-${c}`} cx={f.n(x - f.org.x)} cy={f.n(y - f.org.y)} rx={f.n(0.8 + h4 * 1.6)} ry={f.n(0.6 + h1 * 1.0)} fill="#4F2216" opacity={0.6} />);
      }
    }
  // facet edges: the faces turned up catch the light, the faces turned down fall in shade
  const edges: React.ReactNode[] = [];
  const ew = Math.min(1.6, 4 / z);
  for (let j = 0; j < prof.length - 1; j++) {
    const a = prof[j], b = prof[j + 1];
    const up = b.x > a.x; // the face rises toward x = 0 going down: it faces down (shade); else it faces up
    const col = up ? WCOL.brickDark : WCOL.brickLit;
    edges.push(<path key={j} d={`M${f.p(a)} L${f.p(b)} L${f.p({x: b.x - ew, y: b.y})} L${f.p({x: a.x - ew, y: a.y})} Z`} fill={col} opacity={up ? 0.55 : 0.8} />);
  }
  return (
    <g>
      <path d={body} fill={WCOL.brick} />
      <path d={inner} fill={WCOL.brickDeep} opacity={0.55} />
      {z < 300 && bits}
      {edges}
      <path d={`M${prof.map(f.p).join(' L')}`} fill="none" stroke={INK} strokeWidth={f.n(ink)} strokeLinejoin="miter" />
      <defs>
        <linearGradient id={`${id}-bk`} gradientUnits="userSpaceOnUse" x1={f.n(-60 - f.org.x)} y1="0" x2={f.n(0 - f.org.x)} y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity={0.18} />
          <stop offset="1" stopColor="#000000" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={body} fill={`url(#${id}-bk)`} />
    </g>
  );
};

/** the section in its own world units (um, x = 0 the glass face). `z`: screen px per um (line widths, detail);
 *  `view`: the world rect to cover; `org`: the coordinate origin the output is written relative to (pass the zoom
 *  target for deep zooms so coordinates stay exact); `bg` false leaves the air (ground) out. */
export const WedgeContent: React.FC<{id: string; st: WedgeState; z: number; view?: View; org?: V; bg?: boolean}> = ({id, st, z, view, org = {x: 0, y: 0}, bg = true}) => {
  const v = view ?? viewOf(WEDGE_CAM);
  const f = mkF(z, org);
  const ink = 2.3 / z;
  const B = backingAt(st);
  const fi = st.focus ?? -999;
  const fk = st.focus === undefined ? 0 : clamp(st.focusK ?? 1);
  // the wedges whose blade can reach the view
  const i0 = Math.floor((v.y0 - REST.y - B.y - 30) / WG.pitch), i1 = Math.ceil((v.y1 + 30) / WG.pitch);
  const blades: Blade[] = [];
  for (let i = i0; i <= i1; i++) blades.push(bladeOf(st, i, B));
  const xS = B.x, xP = B.x + WG.sheet;
  const x1 = Math.max(v.x1, xP + 10);
  // the backing face with a fillet at each root (the wedges are moulded in one piece with the sheet)
  const fillets: React.ReactNode[] = [];
  const faceSegs: string[] = [];
  let yFace = v.y0;
  blades.forEach((b) => {
    // where the back face leaves the sheet face
    let top: V = b.back[0];
    for (let j = 1; j < b.back.length; j++) {
      if (b.back[j].x <= xS) {
        const a = b.back[j - 1], c = b.back[j];
        const t = (a.x - xS) / (a.x - c.x || 1);
        top = {x: xS, y: lerp(a.y, c.y, t)};
        const ub = unit(top, b.back[Math.min(b.back.length - 1, j + 2)]);
        const ft = fillet(f, top, {x: 0, y: -1}, ub, 5.5);
        const ug = unit(b.grip[0], b.grip[3]);
        const fb = fillet(f, b.grip[0], {x: 0, y: 1}, ug, 3.2);
        fillets.push(<path key={`ft${b.i}`} d={ft.fill} fill={ROOT} />, <path key={`fb${b.i}`} d={fb.fill} fill={ROOT} />);
        faceSegs.push(`M${f.p({x: xS, y: yFace})} L${f.p({x: xS, y: top.y - 5.5})} ${ft.edge.replace(/^M[^Q]*/, '')}`);
        faceSegs.push(fb.edge);
        yFace = b.grip[0].y + 3.2;
        break;
      }
    }
  });
  faceSegs.push(`M${f.p({x: xS, y: yFace})} L${f.p({x: xS, y: v.y1})}`);
  const ord = [...blades].sort((a, b) => b.i - a.i);
  return (
    <g>
      {bg && <path d={`M${f.p({x: v.x0, y: v.y0})} L${f.p({x: x1, y: v.y0})} L${f.p({x: x1, y: v.y1})} L${f.p({x: v.x0, y: v.y1})} Z`} fill={WCOL.ground} />}
      {st.surface === 'glass' ? <GlassBody id={id} f={f} v={v} ink={ink} z={z} /> : <BrickBody id={id} f={f} v={v} ink={ink} z={z} />}
      {/* where the silicone truly touches: an unobtrusive darker band in the surface along the flat strip (the bright
          air-glass edge goes out there: optical contact) */}
      {blades.map((b) =>
        b.contact ? (
          <path
            key={`c${b.i}`}
            d={(() => {
              const bw = Math.min(2.6, 13 / z);
              return `M${f.p({x: 0, y: b.contact.y0})} L${f.p({x: 0, y: b.contact.y1})} L${f.p({x: -bw, y: b.contact.y1 - bw * 0.3})} L${f.p({x: -bw, y: b.contact.y0 + bw * 0.3})} Z`;
            })()}
            fill={st.surface === 'glass' ? WCOL.contact : '#5A2618'}
            opacity={b.contact.k * (1 - sm(300, 3000, z)) * (b.i === fi ? 1 : 1 - 0.15 * fk)}
          />
        ) : null,
      )}
      {/* the blades, the root shaded into the sheet's tone (one moulded material), a pale compliant tip */}
      {ord.map((b) => {
        const foc = b.i === fi ? fk : 0;
        const ext = (p: V, q: V): V => {
          const u = unit(q, p);
          return {x: p.x + u.x * 9, y: p.y + u.y * 9};
        };
        const g = [ext(b.grip[0], b.grip[2]), ...b.grip];
        const bk = [ext(b.back[0], b.back[2]), ...b.back];
        const tipG = g[g.length - 1], tipB = bk[bk.length - 1];
        const te = unit(g[g.length - 2], tipG);
        const capC = {x: (tipG.x + tipB.x) / 2 + te.x * WG.wTip * 0.7, y: (tipG.y + tipB.y) / 2 + te.y * WG.wTip * 0.7};
        const d = `M${g.map(f.p).join(' L')} Q${f.p(capC)} ${bk
          .slice()
          .reverse()
          .map(f.p)
          .join(' L')} Z`;
        // the selected wedge a touch lighter, the others a touch quieter (no outline, no callout)
        const fill = foc > 0 ? mix(WCOL.wedge, '#FFFFFF', 0.5 * foc) : mix(WCOL.wedge, WCOL.sheet, 0.22 * fk);
        // just inside the back face (toward the blade's interior)
        const rim = b.back.filter((_, j) => j > 6 && j < b.back.length - 4).map((q, j, arr) => {
          const u = unit(arr[Math.max(0, j - 1)], arr[Math.min(arr.length - 1, j + 1)]);
          const dIn = 1.7 / z;
          return {x: q.x + u.y * dIn, y: q.y - u.x * dIn};
        });
        return (
          <g key={b.i}>
            <defs>
              <linearGradient id={`${id}-w${b.i}`} gradientUnits="userSpaceOnUse" x1={f.n(b.root.x - f.org.x)} y1={f.n(b.root.y - f.org.y)} x2={f.n(b.tip.x - f.org.x)} y2={f.n(b.tip.y - f.org.y)}>
                <stop offset="0" stopColor={ROOT} />
                <stop offset="0.3" stopColor={mix(ROOT, fill, 0.8)} />
                <stop offset="0.6" stopColor={fill} />
                <stop offset="1" stopColor={lit(fill, 0.25)} />
              </linearGradient>
            </defs>
            <path d={d} fill={`url(#${id}-w${b.i})`} stroke={INK} strokeWidth={f.n(ink * (1 + 0.15 * foc))} strokeLinejoin="round" />
            {/* the lit upper (back) face, as a thin inner edge */}
            <path d={f.line(rim)} fill="none" stroke="#FFFFFF" strokeWidth={f.n((1.6 + 0.8 * foc) / z)} opacity={0.4 + 0.5 * foc} strokeLinecap="round" />
          </g>
        );
      })}
      {/* the backing: the silicone sheet (moves with the pull) and the tile's rigid plate behind it */}
      <defs>
        <linearGradient id={`${id}-sh`} gradientUnits="userSpaceOnUse" x1={f.n(xS - f.org.x)} y1="0" x2={f.n(xP - f.org.x)} y2="0">
          <stop offset="0" stopColor={ROOT} />
          <stop offset="0.3" stopColor={WCOL.sheet} />
          <stop offset="1" stopColor={shade(WCOL.sheet, 0.18)} />
        </linearGradient>
        <linearGradient id={`${id}-pl`} gradientUnits="userSpaceOnUse" x1={f.n(xP - f.org.x)} y1="0" x2={f.n(xP + 120 - f.org.x)} y2="0">
          <stop offset="0" stopColor={lit(WCOL.plate, 0.1)} />
          <stop offset="0.25" stopColor={WCOL.plate} />
          <stop offset="1" stopColor={shade(WCOL.plate, 0.2)} />
        </linearGradient>
      </defs>
      <path d={`M${f.p({x: xS, y: v.y0})} L${f.p({x: xP, y: v.y0})} L${f.p({x: xP, y: v.y1})} L${f.p({x: xS, y: v.y1})} Z`} fill={`url(#${id}-sh)`} />
      {/* specks in the sheet: they ride with it, so the slide reads */}
      {Array.from({length: Math.ceil((v.y1 - v.y0) / 23) + 4}).map((_, j) => {
        const n = Math.floor((v.y0 - B.y) / 23) - 2 + j;
        const y = n * 23 + B.y + 9 * hash(n, 41);
        const x = xS + 5 + (WG.sheet - 9) * hash(n, 42);
        return <circle key={`s${j}`} cx={f.n(x - f.org.x)} cy={f.n(y - f.org.y)} r={f.n(0.6 + 0.9 * hash(n, 43))} fill="#FFFFFF" opacity={0.22} />;
      })}
      <path d={`M${f.p({x: xP, y: v.y0})} L${f.p({x: x1, y: v.y0})} L${f.p({x: x1, y: v.y1})} L${f.p({x: xP, y: v.y1})} Z`} fill={`url(#${id}-pl)`} />
      {/* the plate's machined grooves ride with it too */}
      {Array.from({length: Math.ceil((v.y1 - v.y0) / 90) + 3}).map((_, j) => {
        const n = Math.floor((v.y0 - B.y) / 90) - 1 + j;
        const y = n * 90 + B.y + 30;
        return <path key={`g${j}`} d={`M${f.p({x: xP + 1.5, y})} L${f.p({x: x1, y})}`} stroke={shade(WCOL.plate, 0.35)} strokeWidth={f.n(1.6 / z)} opacity={0.6} />;
      })}
      <path d={`M${f.p({x: xP + 0.9 / Math.max(z / 3, 1), y: v.y0})} L${f.p({x: xP + 0.9 / Math.max(z / 3, 1), y: v.y1})}`} stroke={WCOL.plateEdge} strokeWidth={f.n(2.4 / z)} opacity={0.8} />
      <path d={`M${f.p({x: xP, y: v.y0})} L${f.p({x: xP, y: v.y1})}`} stroke={INK} strokeWidth={f.n(ink)} />
      {fillets}
      <path d={faceSegs.join(' ')} fill="none" stroke={INK} strokeWidth={f.n(ink)} strokeLinejoin="round" />
    </g>
  );
};

/** full-frame view of the section through a cam (world um). The glass stays put as long as the cam does. */
export const WedgeView: React.FC<{id: string; st: WedgeState; cam?: Cam; org?: V}> = ({id, st, cam = WEDGE_CAM, org}) => {
  const o = org ?? {x: Math.round(cam.x), y: Math.round(cam.y)};
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={WCOL.ground} />
      <g transform={camTransform(cam, o)}>
        <WedgeContent id={id} st={st} z={cam.z} view={viewOf(cam)} org={o} />
      </g>
    </g>
  );
};

/** the comparison: the same section on glass (top panel) and on brick (bottom panel), same orientation and scale, the
 *  surface face at the same screen x (FACE_SX) in both. `z`: zoom (px/um) of both; `gapPx`: the divider between the
 *  panels; `glassY` / `brickY`: the world y (um) placed at each panel's anchor (`glassSY` / `brickSY`, screen px). The
 *  defaults put a glass strip mid-panel above, and the brick apex under wedge 4 at y 1240 (clear of the caption band). */
export const WedgeSplit: React.FC<{id: string; glass: WedgeState; brick: WedgeState; z?: number; gapPx?: number; glassY?: number; brickY?: number; glassSY?: number; brickSY?: number}> = ({
  id,
  glass,
  brick,
  z = 4.6,
  gapPx = 24,
  glassY = 2 * WG.pitch + 16,
  brickY = 4 * WG.pitch,
  glassSY = 470,
  brickSY = 1240,
}) => {
  const half = (H - gapPx) / 2;
  const camT: Cam = camAt({x: 0, y: glassY}, z, FACE_SX, glassSY);
  const camB: Cam = camAt({x: 0, y: brickY}, z, FACE_SX, brickSY);
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill="#0C1419" />
      <defs>
        <clipPath id={`${id}-ct`}>
          <rect x={0} y={0} width={W} height={half} />
        </clipPath>
        <clipPath id={`${id}-cb`}>
          <rect x={0} y={H - half} width={W} height={half} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-ct)`}>
        <WedgeView id={`${id}-g`} st={glass} cam={camT} />
      </g>
      <g clipPath={`url(#${id}-cb)`}>
        <WedgeView id={`${id}-b`} st={brick} cam={camB} />
      </g>
    </g>
  );
};
