// Glass Climbing V8: the microscopic section, rebuilt (replaces v5/Micro5 for the wedge beats).
// A side section through one tile's edge and the surface it is on, in the bay's own orientation: the surface on the
// LEFT (a fixed vertical band: clear glass, or rough fired brick), the tile on the RIGHT (its silicone backing sheet,
// keyed into the tile's rigid plate behind it), "down" is down. World units are microns, x = 0 is the glass face.
// A small group of large silicone wedges (about 100 um long, as on the Stanford pads) is rooted in the backing.
// Physics drawn (frictional adhesion, Hawkes/Cutkosky microwedges):
//  - Each wedge's tip sits ABOVE its root (the blade leans up toward the surface), so the tip TRAILS the downward
//    pull. Unloaded, only the tips touch. (A blade leaning the other way would be pushed upright by a downward pull
//    and let go: that is the release direction.)
//  - Shear: the backing slides DOWN. The tips that touch stay put (friction). Each blade is inextensible, so as its
//    root is dragged down the blade swings over and the backing is drawn in toward the glass (the blades are in
//    tension: this is the adhesion); the thin tip end swings down onto the glass and the flat contact strip grows
//    from the tip, from a point to a long strip. That close contact lets the short-range attractions add up (Mol8).
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
  pitch: 50, // wedge spacing along the surface (um)
  lean: 20, // rest angle of the blade above the -x axis (deg): the tip sits above the root
  wRoot: 22, // blade thickness at the root (um)
  wTip: 2.4, // blade thickness at the tip (um)
  gap: 16, // approach 0: how far every tip clears the surface (um)
  slide: 38, // shear 1: how far the backing slides down (um)
  strip: 22, // shear 1 on glass: the flat contact strip's length (um)
  tip0: 6, // the straight tip end at rest (um): it swings down onto the glass and grows into the strip
  rootTurn: 6, // shear 1: the blade's root tilts this much toward the surface (deg; the backing is compliant too)
  sheet: 32, // backing sheet thickness (um); the tile's plate is behind it
  pegs: 90, // spacing of the sheet's keys into the plate (um)
  brickSlide: 8, // shear 1 on brick: backing slide while the few touching tips hold (um)
  brickTurn: 0.3, // shear 1 on brick: fraction of the glass tip turn (they bend only a little)
  slipSlide: 30, // slip 1 on brick: further backing slide (um)
  peel: 14, // slip 1 on brick: the pad springs back off the brick (um)
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
  plate: '#56636F',
  plateEdge: '#93A1AB',
  brick: '#A65A3E',
  brickLit: '#CF8A68',
  brickDark: '#6E3322',
  brickGrain: '#C98A6A',
  brickPore: '#4A2016',
  /** deep in the zoom the section's two sides blend to these: the mean tone of the molecular view's two sides (Mol8) */
  glassAtomic: '#9FD0CE',
  siliconeAtomic: '#D3E0E3',
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
// x(y) <= 0 of the brick face. Its highest points (x = 0, crisp apexes) sit exactly where a touching wedge's tip
// lands; every other tip faces a recess (at least 9 um deep), so it hangs over a gap. Which wedges touch is a fixed,
// irregular pattern (blocks of 5 wedges with one or two apexes, at least 2 pitches apart); between apexes the face
// runs through deep valleys and lower secondary ridges, with a long-wavelength variation, so it never reads as a
// regular sawtooth when zoomed out.
const BLOCK = 5;
const APEX_SETS = [[1, 4], [2], [1, 3], [2, 4], [1], [3], [2, 4], [1, 3]];
const blockSet = (b: number) => (b === 0 ? [1, 4] : b === -1 ? [3] : APEX_SETS[Math.floor(hash(b + 1000, 503) * APEX_SETS.length)]);
/** does wedge i's tip land on a brick apex (and so touch)? */
export const touchesBrick = (i: number) => {
  const b = Math.floor(i / BLOCK);
  return blockSet(b).includes(i - b * BLOCK);
};
const apexesNear = (y: number): number[] => {
  const b = Math.floor(y / (WG.pitch * BLOCK));
  const out: number[] = [];
  for (let k = b - 2; k <= b + 2; k++) for (const o of blockSet(k)) out.push(k * BLOCK + o);
  return out;
};
const longWave = (y: number) => 1 + 0.16 * Math.sin((2 * Math.PI * y) / 730 + 0.6) + 0.1 * Math.sin((2 * Math.PI * y) / 1930 + 2.1);
/** the vertices [y, x] from apex wedge ia to the next apex wedge ib (both apexes included) */
const stretchVerts = (ia: number, ib: number): [number, number][] => {
  const P = WG.pitch;
  const ya = ia * P, yb = ib * P, D = yb - ya;
  const h = (k: number) => hash(ia * 37 + k, 911);
  const v: [number, number][] = [[ya, 0], [ya + 2.4 + 0.8 * h(0), -1.8 - 0.8 * h(1)]];
  const n = 2 + Math.floor(D / 42);
  for (let k = 1; k <= n; k++) {
    const t = (k - 0.5 + 0.45 * (h(k * 3) - 0.5)) / n;
    const y = ya + 9 + (D - 18) * t;
    // valleys and secondary ridges, mostly alternating (sometimes two valleys running into each other)
    const valley = k % 2 === 1 || h(k * 3 + 2) < 0.3;
    const x = valley ? -(13 + 14 * h(k * 3 + 1)) * longWave(y) : -(7 + 7 * h(k * 3 + 1));
    v.push([y, x]);
  }
  v.push([yb - 2.4 - 0.8 * h(40), -1.8 - 0.8 * h(41)], [yb, 0]);
  return v;
};
/** the brick face x at height y (um) */
export const brickX = (y: number) => {
  const ap = apexesNear(y);
  for (let k = 0; k < ap.length - 1; k++) {
    const ya = ap[k] * WG.pitch, yb = ap[k + 1] * WG.pitch;
    if (y >= ya && y <= yb) {
      const vs = stretchVerts(ap[k], ap[k + 1]);
      for (let j = 0; j < vs.length - 1; j++) {
        const [y0, x0] = vs[j], [y1, x1] = vs[j + 1];
        if (y >= y0 && y <= y1) return lerp(x0, x1, (y - y0) / (y1 - y0 || 1));
      }
    }
  }
  return -30;
};
/** the brick face from y0 to y1 as a polyline (all vertices between) */
const brickPoly = (y0: number, y1: number): V[] => {
  const out: V[] = [{x: brickX(y0), y: y0}];
  const b0 = Math.floor(y0 / (WG.pitch * BLOCK)) - 1, b1 = Math.ceil(y1 / (WG.pitch * BLOCK)) + 1;
  const ap: number[] = [];
  for (let b = b0; b <= b1; b++) for (const o of blockSet(b)) ap.push(b * BLOCK + o);
  for (let k = 0; k < ap.length - 1; k++) {
    const vs = stretchVerts(ap[k], ap[k + 1]);
    for (let j = 0; j < vs.length - 1; j++) {
      const [y, x] = vs[j];
      if (y > y0 && y < y1) out.push({x, y});
    }
  }
  out.push({x: brickX(y1), y: y1});
  return out;
};
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
export const HK = {a: 0.42, b: 0.42}; // handle fractions of the chord (root, strip end)
const NB = 40; // samples along the free (curved) part
const NS = 10; // samples along the straight tip end / flat strip
/** the gripping face (the face toward the surface) from the root R to the tip T: a curve leaving R along angle thR
 *  and arriving at Q = T - e c along e (angle thE), then the straight end Q -> T (length c; flat on the glass once
 *  thE reaches 90 deg). The curve is a quintic whose end controls are collinear with the end tangents, so its
 *  curvature is zero at the root and where it meets the end: the bend comes on smoothly */
const gripLine = (R: V, thR: number, T: V, thE: number, c: number) => {
  const e = dirA(thE), dR = dirA(thR);
  const Q = {x: T.x - e.x * c, y: T.y - e.y * c};
  const ch = Math.hypot(Q.x - R.x, Q.y - R.y);
  // stiff root (long handle); the root handle never reaches past the surface
  const a = Math.min(HK.a * ch, ((R.x - Q.x) * 0.9) / Math.max(0.05, Math.cos(thR))) / 2;
  const b = (HK.b * ch) / 2;
  const P = [R, {x: R.x + dR.x * a, y: R.y + dR.y * a}, {x: R.x + dR.x * 2 * a, y: R.y + dR.y * 2 * a}, {x: Q.x - e.x * 2 * b, y: Q.y - e.y * 2 * b}, {x: Q.x - e.x * b, y: Q.y - e.y * b}, Q];
  const pts: V[] = [];
  for (let i = 0; i <= NB; i++) pts.push(bez5(P, i / NB));
  for (let i = 1; i <= NS; i++) pts.push({x: Q.x + (e.x * (c * i)) / NS, y: Q.y + (e.y * (c * i)) / NS});
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
/** glass, load k: the root is dragged down; the straight tip end swings down onto the glass (flat by k 0.7) while
 *  it lengthens into the strip, so the tip never curls into a hook with a short strip behind it */
const glassPose = (k: number): Pose => ({
  thR: PHI + WG.rootTurn * RAD * k,
  thE: PHI + (HALF_PI - PHI) * sm(0, 0.7, k),
  c: WG.tip0 + (WG.strip - WG.tip0) * sm(0.25, 1, k),
  dy: REST.y + WG.slide * k,
});
/** brick: k the load, `extra` the creep of the backing before the held tips let go (um), `strain` 0..1 of it */
const brickPose = (k: number, extra: number, strain = 0): Pose => ({
  thR: PHI + WG.rootTurn * RAD * (0.4 + 0.5 * strain) * k,
  thE: PHI + (HALF_PI - PHI) * WG.brickTurn * (sm(0, 0.6, k) + 0.9 * strain),
  c: WG.tip0,
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
    return {x: solveRootX({x: mg, y: 0}, glassPose(k)) + lift, y: WG.slide * k, k};
  }
  const sy = slipY(slip);
  const held = solveRootX({x: 0, y: 0}, brickPose(k, sy * k, strainOf(slip) * k));
  const free = REST.x + WG.peel * sm(0.25, 0.95, slip);
  const r = relOf(slip);
  return {x: lerp(held, free, r) + lift, y: WG.brickSlide * k + sy * k, k};
};

export type Blade = {
  grip: V[];
  back: V[];
  root: V;
  tip: V;
  /** the flat contact on the surface: [top, bottom] along the face, and how much it is in contact (0..1) */
  contact: {y0: number; y1: number; x: number; k: number} | null;
  i: number;
};

/** a blade's back face from its gripping-face polyline (a tapering thickness on the side away from the surface) */
const thick = (pts: V[], s: number[]) => {
  const n = pts.length;
  const back: V[] = [];
  let tx = 0, ty = -1;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
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
/** the no-penetration guard for brick (inactive by design; it only ever nudges a point back to the face) */
const guard = (pts: V[]) =>
  pts.map((q) => {
    const sx = brickX(q.y);
    return q.x < sx ? {x: sx, y: q.y} : q;
  });

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
    // contact: the part of the straight end that lies flat (within a hair of the face), at least the tip's point
    const flat = Math.min(p.c, 0.5 / Math.max(1e-3, Math.cos(p.thE)));
    const tip = pts[pts.length - 1];
    return {grip: pts, back, root: pts[0], tip, i, contact: touch > 0.001 ? {x: mg, y0: tip.y - 0.4, y1: tip.y + Math.max(1.2, flat), k: touch} : null};
  }
  // brick
  const touching = touchesBrick(i);
  const restGrip = (thR: number, R: V) => {
    const T = {x: R.x - WG.L * Math.cos(thR), y: R.y - WG.L * Math.sin(thR)};
    return gripLine(R, thR, T, thR, WG.tip0);
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
  const held = gripLine(Rh, p.thR, apex, p.thE, p.c);
  const r = relOf(slip);
  // the flick: released, the blade springs back past its rest angle and settles (a damped swing over slip)
  const ds = Math.max(0, slip - 0.2);
  const fl = 12 * RAD * k * Math.exp(-ds * 5.5) * Math.sin(ds * 21);
  const free = restGrip(PHI - fl, R);
  const off = {x: R.x - Rh.x, y: R.y - Rh.y};
  const pts = guard(
    held.pts.map((q, j) => {
      const h = {x: q.x + off.x, y: q.y + off.y};
      return {x: lerp(h.x, free.pts[j].x, r), y: lerp(h.y, free.pts[j].y, r)};
    }),
  );
  const sArr = held.s.map((v, j) => lerp(v, free.s[j], r));
  const back = guard(thick(pts, sArr));
  const tip = pts[pts.length - 1];
  const on = (1 - sm(0, 0.35, r)) * sm(0.97, 1, ap);
  return {grip: pts, back, root: pts[0], tip, i, contact: on > 0.001 ? {x: 0, y0: tip.y - 1.2, y1: tip.y + 1.2, k: on} : null};
};

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
/** the glass face's screen x through the whole sequence (section and the move into the molecules) */
export const FACE_SX = 280;
/** the focus strip's screen y: wedge 3's strip ends at y 1377 and wedge 4's tip lands at 1565, so the caption band
 *  (y 1380-1560) holds no contact */
export const FOCUS_SY = 960;
export const FOCUS = 2;
/** the section's zoom (screen px per um): about 5.6 wedges in frame */
export const WEDGE_Z = 6.8;
/** the focus wedge's strip mid when fully loaded on glass (um) */
export const FOCUS_P: V = {x: 0, y: FOCUS * WG.pitch + WG.strip / 2};
/** a cam (at zoom z, px per um) that puts world point p at screen point (sx, sy) */
export const camAt = (p: V, z: number, sx = FACE_SX, sy = FOCUS_SY): Cam => ({x: p.x - (sx - W / 2) / z, y: p.y - (sy - H / 2) / z, z});
/** the section's camera for the whole wedge beat (unloaded, approach, shear): glass face fixed at x = 280 */
export const WEDGE_CAM: Cam = camAt(FOCUS_P, WEDGE_Z);
/** a closer framing of the same (same glass face line, same focus point): about 4.9 wedges */
export const WEDGE_CAM_CLOSE: Cam = camAt(FOCUS_P, 7.8);
/** the brick at the section's scale and face line: the apexes under wedges 1 and 4 (the two touching tips in
 *  frame) at screen y 335 and 1355, both clear of the caption band */
export const BRICK_CAM: Cam = camAt({x: 0, y: WG.pitch}, WEDGE_Z, FACE_SX, 335);

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

/** walk distance d along a polyline from point index j0 (with a start point S on segment j0-1..j0): the point and its index */
const along = (pts: V[], S: V, j0: number, d: number): {p: V; j: number} => {
  let left = d, prev = S;
  for (let j = j0; j < pts.length; j++) {
    const l = Math.hypot(pts[j].x - prev.x, pts[j].y - prev.y);
    if (l >= left) {
      const t = left / (l || 1);
      return {p: {x: lerp(prev.x, pts[j].x, t), y: lerp(prev.y, pts[j].y, t)}, j};
    }
    left -= l;
    prev = pts[j];
  }
  return {p: pts[pts.length - 1], j: pts.length - 1};
};
const unit = (a: V, b: V): V => {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
  return {x: dx / l, y: dy / l};
};

/** deep-zoom tone blend (0 at the section's scale, 1 by 30000 px/um): the section's flat fields take the molecular
 *  view's mean tones, so the dissolve into the molecules changes texture, not tone */
export const deepK = (z: number) => sm(Math.log(300), Math.log(30000), Math.log(Math.max(z, 1e-6)));

const GlassBody: React.FC<{id: string; f: Fm; v: View; ink: number; z: number}> = ({id, f, v, ink, z}) => {
  const x0 = Math.min(v.x0, -1);
  const dz = deepK(z);
  const streaks: React.ReactNode[] = [];
  const k0 = Math.floor((v.y0 - 200) / 170), k1 = Math.ceil((v.y1 + 200) / 170);
  if (z < 400 && k1 - k0 < 400)
    for (let k = k0; k <= k1; k++) {
      const y = k * 170 + 40 * hash(k, 3);
      const w1 = 7 + 5 * hash(k, 5);
      streaks.push(<path key={k} d={`M${f.p({x: -66, y})} L${f.p({x: -24, y: y - 74})} L${f.p({x: -24 + w1, y: y - 74})} L${f.p({x: -66 + w1, y})} Z`} fill="#FFFFFF" opacity={0.08} />);
      streaks.push(<path key={`b${k}`} d={`M${f.p({x: -52, y: y + 26})} L${f.p({x: -14, y: y - 40})} L${f.p({x: -12, y: y - 40})} L${f.p({x: -50, y: y + 26})} Z`} fill="#FFFFFF" opacity={0.06} />);
    }
  const edgeW = Math.min(0.9, 3.2 / z);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-gl`} gradientUnits="userSpaceOnUse" x1={f.n(-90 - f.org.x)} y1="0" x2={f.n(0 - f.org.x)} y2="0">
          <stop offset="0" stopColor={WCOL.glassDeep} />
          <stop offset="0.55" stopColor={WCOL.glassMid} />
          <stop offset="0.93" stopColor={mix(WCOL.glassFace, WCOL.glassAtomic, dz)} />
          <stop offset="1" stopColor={mix(lit(WCOL.glassFace, 0.18), WCOL.glassAtomic, dz)} />
        </linearGradient>
      </defs>
      <path d={`M${f.p({x: x0, y: v.y0})} L${f.p({x: 0, y: v.y0})} L${f.p({x: 0, y: v.y1})} L${f.p({x: x0, y: v.y1})} Z`} fill={`url(#${id}-gl)`} />
      {streaks}
      {/* the lit face edge (the air-glass reflection) */}
      <path d={`M${f.p({x: 0, y: v.y0})} L${f.p({x: 0, y: v.y1})} L${f.p({x: -edgeW, y: v.y1})} L${f.p({x: -edgeW, y: v.y0})} Z`} fill={WCOL.glassEdge} opacity={0.95 - 0.55 * dz} />
      <path d={`M${f.p({x: 0, y: v.y0})} L${f.p({x: 0, y: v.y1})}`} stroke={INK} strokeWidth={f.n(ink * 0.8)} opacity={0.55} />
    </g>
  );
};

const BrickBody: React.FC<{id: string; f: Fm; v: View; ink: number; z: number}> = ({id, f, v, ink, z}) => {
  const x0 = Math.min(v.x0, -80);
  const prof = brickPoly(v.y0, v.y1);
  const body = `M${f.p({x: x0, y: v.y0})} L${prof.map(f.p).join(' L')} L${f.p({x: x0, y: v.y1})} Z`;
  // fired clay: sparse small sand grains and pores, fixed to the brick (a fixed grid of cells)
  const bits: React.ReactNode[] = [];
  const CELL = 11;
  if (z > 1.5) {
    const g0 = Math.floor(v.y0 / CELL) - 1, g1 = Math.ceil(v.y1 / CELL) + 1;
    const cols = Math.min(14, Math.ceil((-x0 + 10) / CELL));
    for (let g = g0; g <= g1; g++)
      for (let c = 0; c < cols; c++) {
        const key = g * 53 + c;
        const h1 = hash(key, 77), h2 = hash(key, 78), h3 = hash(key, 79), h4 = hash(key, 80);
        const y = g * CELL + h1 * CELL;
        const x = -5 - c * CELL - h2 * CELL;
        if (x > brickX(y) - 3 || x < x0) continue;
        if (h3 < 0.38) {
          // an angular sand grain
          const r = 0.7 + h4 * 0.9;
          const a = h1 * 6.28;
          const pts = [0, 1, 2, 3].map((j) => ({x: x + Math.cos(a + j * 1.65 + h2) * r * (0.75 + 0.45 * hash(key * 7 + j, 5)), y: y + Math.sin(a + j * 1.65 + h2) * r * (0.75 + 0.45 * hash(key * 5 + j, 9))}));
          bits.push(<path key={`g${key}`} d={`M${pts.map(f.p).join(' L')} Z`} fill={WCOL.brickGrain} opacity={0.75} />);
        } else if (h3 < 0.5) {
          bits.push(<ellipse key={`p${key}`} cx={f.n(x - f.org.x)} cy={f.n(y - f.org.y)} rx={f.n(0.6 + h4 * 0.8)} ry={f.n(0.45 + h1 * 0.5)} fill={WCOL.brickPore} opacity={0.6} />);
        }
      }
  }
  // the facets: up-facing ones (rising toward x = 0 going down) catch the light along a crisp edge; down-facing ones
  // fall in shade. Flat bands, constant on screen, no rim following the whole profile.
  const facets: React.ReactNode[] = [];
  const ew = Math.min(2.2, 6 / z);
  for (let j = 0; j < prof.length - 1; j++) {
    const a = prof[j], b = prof[j + 1];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    // inward normal (into the brick)
    const nx = -dy / l, ny = dx / l;
    const inx = nx < 0 ? nx : -nx, iny = nx < 0 ? ny : -ny;
    const up = b.x > a.x;
    const w = ew * (up ? 1 : 1.3);
    facets.push(<path key={j} d={`M${f.p(a)} L${f.p(b)} L${f.p({x: b.x + inx * w, y: b.y + iny * w})} L${f.p({x: a.x + inx * w, y: a.y + iny * w})} Z`} fill={up ? WCOL.brickLit : WCOL.brickDark} opacity={up ? 0.95 : 0.5} />);
  }
  // one or two hard hairline fractures running in from a valley
  const cracks: React.ReactNode[] = [];
  if (z > 1.5)
    for (let j = 1; j < prof.length - 1; j++) {
      const q = prof[j];
      if (q.x > -24) continue;
      const key = Math.round(q.y * 10);
      if (hash(key, 301) > 0.28) continue;
      const pts: V[] = [q];
      let p = q;
      for (let s = 0; s < 3; s++) {
        p = {x: p.x - 6 - 7 * hash(key + s, 302), y: p.y + (hash(key + s, 303) - 0.5) * 12};
        pts.push(p);
      }
      cracks.push(<path key={`k${j}`} d={f.line(pts)} fill="none" stroke={WCOL.brickPore} strokeWidth={f.n(1.4 / z)} opacity={0.7} strokeLinejoin="miter" />);
    }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-bk`} gradientUnits="userSpaceOnUse" x1={f.n(-90 - f.org.x)} y1="0" x2={f.n(0 - f.org.x)} y2="0">
          <stop offset="0" stopColor={shade(WCOL.brick, 0.32)} />
          <stop offset="0.7" stopColor={shade(WCOL.brick, 0.08)} />
          <stop offset="1" stopColor={WCOL.brick} />
        </linearGradient>
      </defs>
      <path d={body} fill={`url(#${id}-bk)`} />
      {bits}
      {cracks}
      {facets}
      <path d={`M${prof.map(f.p).join(' L')}`} fill="none" stroke={INK} strokeWidth={f.n(ink)} strokeLinejoin="miter" strokeMiterlimit={6} />
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
  const dz = deepK(z);
  // the wedges whose blade can reach the view
  const i0 = Math.floor((v.y0 - REST.y - B.y - WG.wRoot - 40) / WG.pitch), i1 = Math.ceil((v.y1 + 40) / WG.pitch);
  const blades: Blade[] = [];
  for (let i = i0; i <= i1; i++) blades.push(bladeOf(st, i, B));
  const xS = B.x, xP = B.x + WG.sheet;
  const x1 = Math.max(v.x1, xP + 10);
  // each blade meets the sheet face in a moulded fillet on both sides; the blade's ink line ends exactly where the
  // fillet takes over, so every root is one clean curve into the sheet
  const DB = 6, DG = 3.4; // fillet sizes (um): back face (upper), gripping face (lower)
  type Root = {fillB: string; fillG: string; edgeB: string; edgeG: string; jB: number; pB: V; jG: number; pG: V; topY: number; botY: number; hold: number};
  const roots: (Root | null)[] = blades.map((b) => {
    let jx = -1;
    for (let j = 1; j < b.back.length; j++)
      if (b.back[j].x <= xS) {
        jx = j;
        break;
      }
    if (jx < 0) return null;
    const a = b.back[jx - 1], c = b.back[jx];
    const t = (a.x - xS) / (a.x - c.x || 1);
    const Cb = {x: xS, y: lerp(a.y, c.y, t)};
    const tb = along(b.back, Cb, jx, DB);
    const Ab = {x: xS, y: Cb.y - DB};
    const Cg = b.grip[0];
    const tg = along(b.grip, Cg, 1, DG);
    const Ag = {x: xS, y: Cg.y + DG};
    // the blade's tone holds the sheet's root tone over the whole root and its fillets (no seam where they meet)
    const ax = b.tip.x - Cg.x, ay = b.tip.y - Cg.y, al = ax * ax + ay * ay || 1;
    const pr = (q: V) => ((q.x - Cg.x) * ax + (q.y - Cg.y) * ay) / al;
    const hold = clamp(Math.max(pr(Cb), pr(tb.p), pr(Ab), pr(tg.p), 0) + 0.03, 0, 0.5);
    return {
      hold,
      fillB: `M${f.p(Cb)} L${f.p(Ab)} Q${f.p(Cb)} ${f.p(tb.p)} Z`,
      fillG: `M${f.p(Cg)} L${f.p(Ag)} Q${f.p(Cg)} ${f.p(tg.p)} Z`,
      edgeB: `Q${f.p(Cb)} ${f.p(tb.p)}`,
      edgeG: `M${f.p(tg.p)} Q${f.p(Cg)} ${f.p(Ag)}`,
      jB: tb.j,
      pB: tb.p,
      jG: tg.j,
      pG: tg.p,
      topY: Ab.y,
      botY: Ag.y,
    };
  });
  // the sheet face, top to bottom, in runs between the blades (each run ends in the fillet curves; each blade's own
  // outline joins it at the fillet ends)
  const faceRuns: string[] = [];
  {
    let y = v.y0 - 20;
    blades.forEach((b, k) => {
      const r = roots[k];
      if (!r) return;
      faceRuns.push(`M${f.p({x: xS, y})} L${f.p({x: xS, y: r.topY})} ${r.edgeB}`);
      faceRuns.push(r.edgeG);
      y = r.botY;
    });
    faceRuns.push(`M${f.p({x: xS, y})} L${f.p({x: xS, y: v.y1 + 20})}`);
  }
  // the sheet's keys into the plate (they ride with the backing, so the downward slide reads) and its inclusions
  const PEG = WG.pegs, pegH = 12, pegD = 15, pegR = 3;
  const pegs: number[] = [];
  for (let n = Math.floor((v.y0 - B.y) / PEG) - 1; n <= Math.ceil((v.y1 - B.y) / PEG) + 1; n++) pegs.push(n * PEG + B.y + 20);
  const sheetFar = shade(WCOL.sheet, 0.16);
  const dots: React.ReactNode[] = [];
  if (z > 1.2) {
    const DS = 17;
    for (let n = Math.floor((v.y0 - B.y) / DS) - 2; n <= Math.ceil((v.y1 - B.y) / DS) + 2; n++) {
      const y = n * DS + B.y + 8 * hash(n, 41);
      const x = xS + 6 + (WG.sheet - 11) * hash(n, 42);
      const r = 1.3 + 2.0 * hash(n, 43);
      dots.push(<circle key={`s${n}`} cx={f.n(x - f.org.x)} cy={f.n(y - f.org.y)} r={f.n(r)} fill={shade(WCOL.sheet, 0.5)} opacity={0.55} />);
    }
  }
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
              const bw = Math.min(3.4, 22 / z); // (V8 QA) wide enough to read at phone size
              return `M${f.p({x: 0, y: b.contact.y0})} L${f.p({x: 0, y: b.contact.y1})} L${f.p({x: -bw, y: b.contact.y1 - bw * 0.3})} L${f.p({x: -bw, y: b.contact.y0 + bw * 0.3})} Z`;
            })()}
            fill={st.surface === 'glass' ? WCOL.contact : '#5A2618'}
            opacity={b.contact.k * (1 - sm(300, 3000, z)) * (b.i === fi ? 1 : 1 - 0.15 * fk)}
          />
        ) : null,
      )}
      {/* the blades: the root shaded into the sheet's tone (one moulded material), a pale compliant tip */}
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
        const d = `M${g.map(f.p).join(' L')} Q${f.p(capC)} ${bk.slice().reverse().map(f.p).join(' L')} Z`;
        // the selected wedge a touch lighter, the others a touch quieter (no outline, no callout)
        const fill0 = foc > 0 ? mix(WCOL.wedge, '#FFFFFF', 0.5 * foc) : mix(WCOL.wedge, WCOL.sheet, 0.22 * fk);
        const hold = roots[blades.indexOf(b)]?.hold ?? 0;
        const fill = mix(fill0, WCOL.siliconeAtomic, dz);
        const tipC = mix(lit(fill0, 0.25), WCOL.siliconeAtomic, dz);
        return (
          <g key={b.i}>
            <defs>
              <linearGradient id={`${id}-w${b.i}`} gradientUnits="userSpaceOnUse" x1={f.n(b.root.x - f.org.x)} y1={f.n(b.root.y - f.org.y)} x2={f.n(b.tip.x - f.org.x)} y2={f.n(b.tip.y - f.org.y)}>
                <stop offset="0" stopColor={ROOT} />
                <stop offset={hold.toFixed(4)} stopColor={ROOT} />
                <stop offset={(hold + 0.22).toFixed(4)} stopColor={mix(ROOT, fill, 0.8)} />
                <stop offset={Math.max(0.6, hold + 0.4).toFixed(4)} stopColor={fill} />
                <stop offset="1" stopColor={tipC} />
              </linearGradient>
            </defs>
            <path d={d} fill={`url(#${id}-w${b.i})`} />
          </g>
        );
      })}
      {/* the backing: the silicone sheet (moves with the pull) and the tile's rigid plate behind it */}
      <defs>
        <linearGradient id={`${id}-sh`} gradientUnits="userSpaceOnUse" x1={f.n(xS - f.org.x)} y1="0" x2={f.n(xP - f.org.x)} y2="0">
          <stop offset="0" stopColor={ROOT} />
          <stop offset="0.3" stopColor={WCOL.sheet} />
          <stop offset="1" stopColor={sheetFar} />
        </linearGradient>
        <linearGradient id={`${id}-pl`} gradientUnits="userSpaceOnUse" x1={f.n(xP - f.org.x)} y1="0" x2={f.n(xP + 110 - f.org.x)} y2="0">
          <stop offset="0" stopColor={lit(WCOL.plate, 0.08)} />
          <stop offset="0.3" stopColor={WCOL.plate} />
          <stop offset="1" stopColor={shade(WCOL.plate, 0.25)} />
        </linearGradient>
      </defs>
      <path d={`M${f.p({x: xS, y: v.y0 - 20})} L${f.p({x: xP + 1, y: v.y0 - 20})} L${f.p({x: xP + 1, y: v.y1 + 20})} L${f.p({x: xS, y: v.y1 + 20})} Z`} fill={`url(#${id}-sh)`} />
      {dots}
      <path d={`M${f.p({x: xP, y: v.y0 - 20})} L${f.p({x: x1, y: v.y0 - 20})} L${f.p({x: x1, y: v.y1 + 20})} L${f.p({x: xP, y: v.y1 + 20})} Z`} fill={`url(#${id}-pl)`} />
      {/* the plate's lit edge and ink line, broken where the sheet's keys run into it */}
      {(() => {
        const runs: string[] = [];
        const lip: string[] = [];
        const lx = xP + Math.min(1.2, 3 / z);
        let y = v.y0 - 20;
        for (const py of pegs) {
          if (py + pegH < v.y0 - 20 || py > v.y1 + 20) continue;
          runs.push(`M${f.p({x: xP, y})} L${f.p({x: xP, y: py})}`);
          lip.push(`M${f.p({x: lx, y: y})} L${f.p({x: lx, y: py})}`);
          y = py + pegH;
        }
        runs.push(`M${f.p({x: xP, y})} L${f.p({x: xP, y: v.y1 + 20})}`);
        lip.push(`M${f.p({x: lx, y})} L${f.p({x: lx, y: v.y1 + 20})}`);
        return (
          <g>
            {pegs.map((py, n) => (
              <path
                key={`k${n}`}
                d={`M${f.p({x: xP - 1, y: py})} L${f.p({x: xP + pegD - pegR, y: py})} Q${f.p({x: xP + pegD, y: py})} ${f.p({x: xP + pegD, y: py + pegR})} L${f.p({x: xP + pegD, y: py + pegH - pegR})} Q${f.p({x: xP + pegD, y: py + pegH})} ${f.p({x: xP + pegD - pegR, y: py + pegH})} L${f.p({x: xP - 1, y: py + pegH})} Z`}
                fill={sheetFar}
              />
            ))}
            {pegs.map((py, n) => (
              <path
                key={`ke${n}`}
                d={`M${f.p({x: xP, y: py})} L${f.p({x: xP + pegD - pegR, y: py})} Q${f.p({x: xP + pegD, y: py})} ${f.p({x: xP + pegD, y: py + pegR})} L${f.p({x: xP + pegD, y: py + pegH - pegR})} Q${f.p({x: xP + pegD, y: py + pegH})} ${f.p({x: xP + pegD - pegR, y: py + pegH})} L${f.p({x: xP, y: py + pegH})}`}
                fill="none"
                stroke={INK}
                strokeWidth={f.n(ink)}
                strokeLinejoin="round"
              />
            ))}
            <path d={lip.join(' ')} stroke={WCOL.plateEdge} strokeWidth={f.n(2.4 / z)} opacity={0.8} />
            <path d={runs.join(' ')} stroke={INK} strokeWidth={f.n(ink)} />
          </g>
        );
      })()}
      {/* (V8 QA: a hairline stroke in the same tone closes the anti-aliasing seam where a fillet meets the sheet and
          the blade, which otherwise traces the square corner as a faint grey line) */}
      {roots.map((r, k) => (r ? <path key={`fb${k}`} d={r.fillB} fill={ROOT} stroke={ROOT} strokeWidth={f.n(1.2 / z)} strokeLinejoin="round" /> : null))}
      {roots.map((r, k) => (r ? <path key={`fg${k}`} d={r.fillG} fill={ROOT} stroke={ROOT} strokeWidth={f.n(1.2 / z)} strokeLinejoin="round" /> : null))}
      {/* the lit upper (back) face, as a thin inner edge; then each blade's ink outline from fillet to fillet */}
      {ord.map((b) => {
        const k = blades.indexOf(b);
        const r = roots[k];
        const foc = b.i === fi ? fk : 0;
        const jB = r ? r.jB : 1, jG = r ? r.jG : 1;
        const rim = b.back
          .filter((_, j) => j > jB + 3 && j < b.back.length - 4)
          .map((q, j, arr) => {
            const u = unit(arr[Math.max(0, j - 1)], arr[Math.min(arr.length - 1, j + 1)]);
            const dIn = 1.7 / z;
            return {x: q.x + u.y * dIn, y: q.y - u.x * dIn};
          });
        const backRun = [r ? r.pB : b.back[0], ...b.back.slice(jB)];
        const gripRun = [r ? r.pG : b.grip[0], ...b.grip.slice(jG)];
        const tipG = b.grip[b.grip.length - 1], tipB = b.back[b.back.length - 1];
        const te = unit(b.grip[b.grip.length - 2], tipG);
        const capC = {x: (tipG.x + tipB.x) / 2 + te.x * WG.wTip * 0.7, y: (tipG.y + tipB.y) / 2 + te.y * WG.wTip * 0.7};
        const outline = `M${backRun.map(f.p).join(' L')} Q${f.p(capC)} ${gripRun.slice().reverse().map(f.p).join(' L')}`;
        return (
          <g key={`o${b.i}`}>
            {rim.length > 1 && <path d={f.line(rim)} fill="none" stroke="#FFFFFF" strokeWidth={f.n((1.6 + 0.9 * foc) / z)} opacity={(0.4 + 0.5 * foc) * (1 - dz)} strokeLinecap="round" />}
            <path d={outline} fill="none" stroke={INK} strokeWidth={f.n(ink)} strokeLinejoin="round" strokeLinecap="round" />
          </g>
        );
      })}
      <path d={faceRuns.join(' ')} fill="none" stroke={INK} strokeWidth={f.n(ink)} strokeLinejoin="round" strokeLinecap="round" />
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
 *  defaults put the glass strips of wedges 1-3 mid-panel above, and the brick apex under wedge 1 at y 1250 (above the
 *  caption band) with wedge 0 and 2 hanging over gaps either side. */
export const WedgeSplit: React.FC<{id: string; glass: WedgeState; brick: WedgeState; z?: number; gapPx?: number; glassY?: number; brickY?: number; glassSY?: number; brickSY?: number}> = ({
  id,
  glass,
  brick,
  z = 5.2,
  gapPx = 20,
  glassY = 2 * WG.pitch + WG.strip / 2,
  brickY = WG.pitch,
  glassSY = 470,
  brickSY = 1250,
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
