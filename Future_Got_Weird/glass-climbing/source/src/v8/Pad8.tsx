// Glass Climbing V8 (from V6's Pad6): the climbing pad as ONE 3D assembly, drawn from any angle in the Crew's flat
// vector finish (flat faces with one key-light shade each, ink edges). Same device, same 4 x 6 tile layout and
// proportions as V6, so every close-up matches the rest of the film:
//   - a rigid frame: a front plate carrying the tiles, a rim round a rear bay, closed by a rear cover (cut away by a
//     section plane for the cutaway, never faded) carrying a raised backplate with two slots the posts ride in;
//   - 24 adhesive tiles (4 x 6, 25 mm) on the front, the glass side;
//   - behind each tile a tendon through the front plate (a grommet) to its own coil spring; the springs hook onto one
//     rail per row; the rails hang from a central spine by clamps and ride in guide slots in the side walls;
//   - the handle: two posts from bosses on the spine out through the cover's slots (collars ride on the backplate) to a
//     rubber grip bar, clamped to it by collars (the brackets);
//   - a lug at the spine's foot, out through a slot in the bottom wall, with the D-ring the foot strap is sewn to.
// Load path: the foot strap and the hand both pull the spine down; the spine pulls the rails; each rail stretches its
// row's springs; each spring pulls its tile's tendon (shear along the glass), so every tile carries a share. The
// tiles stay where they touch; the spine, rails, posts, bar and lug travel (a few mm, drawn exaggerated).
// Pad-local axes (mm): u out of the glass toward the hand (the glass face is u = 0), v down, w across. With the climber
// facing the glass, +w is HIS LEFT side: a camera at +w (yaw 0..90, as the bay sees him) looks at his left side, and the
// default hand (handSide 1, the back of the hand toward +w) is his LEFT hand. handSide -1 is his right hand.
// V8 additions: an optional perspective camera (persp), the pad's reflection in the glass (a mirrored pass of the
// device only), a solved grip (a 3D hand closed round the bar, parented to it: fingers wrap the far side, the thumb
// comes round the near side over the index finger, the palm on the bar, never through it; each part of the palm is
// drawn on its own side of the bar) with the forearm, elbow, upper arm and the striped tee's sleeve, the strap's tension
// (slack -> straight), per-tile slip, a section-plane cutaway of the rear cover and the near side wall, and an
// unobtrusive load emphasis (spring tension shown as warmth, the housing knocked back a little).
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {Deco, INK, Inked, OUTLINE_K, useInk} from '../dc/ink';
import {clamp, fmt, lerp, P, V} from '../dc/math';
import {HandPose} from '../dc/Hand';
import {Blob, Capsule} from '../dc/shade';
import {HERO} from '../world/pose';

export const P3D = {TILE: 25, GAP: 3.4, RIM: 7, COLS: 4, ROWS: 6, T_TILE: 3, U_PLATE: 6, U_BACK: 24, POST: 72, BAR_R: 13.5, BAR_H: 62};
export const PW = P3D.COLS * P3D.TILE + (P3D.COLS - 1) * P3D.GAP + 2 * P3D.RIM;
export const PH = P3D.ROWS * P3D.TILE + (P3D.ROWS - 1) * P3D.GAP + 2 * P3D.RIM;
export const BAR_U = P3D.U_BACK + P3D.POST;
/** tile centre (v, w) for column c, row r */
export const tileVW = (c: number, r: number) => ({v: -PH / 2 + P3D.RIM + r * (P3D.TILE + P3D.GAP) + P3D.TILE / 2, w: -PW / 2 + P3D.RIM + c * (P3D.TILE + P3D.GAP) + P3D.TILE / 2});
/** the spine's travel (mm) at a load 0..1 (as V6) */
export const travelOf = (load: number) => 2 + 12 * load;
/** the strap's tension (0 slack .. 1 straight) at a load 0..1: webbing carrying any real share of his weight is
 *  straight (0.9 or more from a load of 0.3); only an unloaded strap hangs in a belly */
export const tetherOf = (load: number) => {
  const s = (x: number) => {
    const t = clamp(x);
    return t * t * (3 - 2 * t);
  };
  return 0.9 * s(load / 0.3) + 0.1 * s((load - 0.3) / 0.7);
};

export type P3 = {u: number; v: number; w: number};
/** the arm: elbow as an offset from the wrist, shoulder as an offset from the elbow (mm, pad axes, for the hand whose
 *  back faces +w, his left hand; mirrored in w with handSide -1). Without a shoulder only the forearm is drawn (make it
 *  long enough to leave the frame). The sleeve runs from just past the shoulder to a hem a little over halfway down the
 *  upper arm; frame the shot so the shoulder end is outside the picture (there is no torso). */
export type ArmSpec = {elbow: P3; shoulder?: P3};
/** standing in the stirrups as the bay draws him (the rig's near arm at frames 24-70 and 664, climb8 manJoints): the
 *  forearm runs back from the bar, a little up, to the elbow out at his side; the upper arm goes up to the shoulder.
 *  Use it where a close-up hands over to the bay. */
export const ARM_BAY: ArmSpec = {elbow: {u: 214, v: -60, w: 96}, shoulder: {u: 30, v: -262, w: -150}};
/** hanging from the handle: the forearm drops from the wrist, the upper arm goes back up to his shoulder */
export const ARM_HANG: ArmSpec = {elbow: {u: 95, v: 228, w: 46}, shoulder: {u: 235, v: -178, w: 22}};
/** reaching up to a pad placed high: the arm nearly straight, down and out from the hand to his shoulder */
export const ARM_REACH: ArmSpec = {elbow: {u: 62, v: 222, w: 100}, shoulder: {u: 96, v: 236, w: 92}};
/** the default when no arm is given (as V6): only the forearm, toward his elbow and on past the frame's edge, so in any
 *  close-up the arm leaves the picture at an edge and never ends in the air */
export const ARM_FOREARM: ArmSpec = {elbow: {u: 860, v: 700, w: 560}};
/** standing in the stirrups, the hand on the handle for balance: the forearm drops away below the frame (no upper arm
 *  or sleeve, so a camera going round behind the pad never meets his shoulder) */
export const ARM_DROP: ArmSpec = {elbow: {u: 120, v: 640, w: 150}};

export type Pad3DState = {
  yaw: number; // deg: 0 side-on (glass on the left), +90 from behind (the handle side), -90 through the glass
  pitch: number; // deg: looking down (+)
  load: number; // 0..1: the spine's travel (springs stretch together)
  /** per-tile contact 0..1 (dark where the tile touches) */
  contact: number[];
  /** per-tile spring stretch multiplier (1 = its even share); brick: the few touching tiles take it all */
  share?: number[];
  cover: number; // rear cover: 1 on, 0 cut away (a section plane sweeps across it; it never fades)
  gap: number; // stand-off from the surface (mm)
  tilt: number; // deg: peel about the top edge of the face (+: bottom comes away)
  slide: number; // whole pad down (mm)
  surface: 'glass' | 'brick' | 'none';
  hand?: HandPose | null;
  /** the bay's oblique projection (screen = (u + kx w, v + ky w)) instead of a rotated view; yaw/pitch ignored */
  obl?: {kx: number; ky: number};
  /** false: leave the grip bar out */
  bar?: boolean;
  /** the tiles' ridges (rows of wedges) on their faces, seen close through the glass: opacity 0..1 */
  ridges?: number;
  strap?: number; // strap length drawn (mm), 0 = none
  // ---- V8
  /** perspective: the camera's distance from the pad centre (mm); omitted: orthographic (as V6). 700-1400 for close-ups */
  persp?: number;
  /** the strap's tension 0 slack .. 1 straight (default 1) */
  tether?: number;
  /** the strap's lean per mm of drop toward the foot support (default {u: 0.14, w: 0.03}) */
  strapLean?: {u: number; w: number};
  /** 0..1: the near side wall sectioned away (shown only while the cover is off) */
  cut?: number;
  /** 0..1: load emphasis: spring tension shown as warmth, tendons darker, the housing knocked back a little */
  emph?: number;
  /** per-tile slide down the glass (mm): a tile whose patch has let go */
  slip?: number[];
  /** the arm from the wrist on (default ARM_FOREARM: a forearm leaving the frame, as V6); null: hand only */
  arm?: ArmSpec | null;
  /** +1: the back of the hand faces +w (his LEFT hand, the near hand as the bay sees him, default); -1: his right hand */
  handSide?: 1 | -1;
  /** 0..1 grip closure; overrides the closure taken from `hand` */
  grip?: number;
  /** 0..1: the pad's (and hand's) reflection in the glass, drawn behind the pad (seen from outside) */
  reflect?: number;
  /** 0..1: the contact shadow on the surface and the dark contact line round the tiles' footprint (default 1 with a
   *  surface, else 0) */
  shadow?: number;
  /** the contact line's width (scale, default 0.5; the contact close-up uses 1) */
  contactLine?: number;
  /** where the shadow falls on the glass (mm offset in v and w; default {v: 9, w: -5}: down, away from +w) */
  shadowDir?: {v: number; w: number};
  /** the cover's cutting plane: its normal in (v, w) (default {v: -0.5, w: 0.866}: the cut opens from the top +w corner) */
  cutDir?: {v: number; w: number};
  /** true: the housing alone (tiles, plate, rim, cover), without the handle, hand, lug, D-ring and strap (the
   *  reflection pass) */
  bodyOnly?: boolean;
  /** false: a plain white sleeve (default true: the tee's saffron stripes on it) */
  sleeve?: boolean;
};
export const allTiles = (x: number) => Array.from({length: P3D.COLS * P3D.ROWS}).map(() => x);

const rad = (d: number) => (d * Math.PI) / 180;
const L_KEY = (() => {
  const l = {x: -0.55, y: -0.65, z: 0.52};
  const n = Math.hypot(l.x, l.y, l.z);
  return {x: l.x / n, y: l.y / n, z: l.z / n};
})();

export type Cs = {X: number; Y: number; D: number};
export type Proj = {x: number; y: number; d: number; s: number};

/** the view: pad-local -> camera space (X right, Y down, D toward the camera) -> screen (x, y; mm at the pad centre's
 *  depth, so a Layer's cam.z still maps mm to px there) with the perspective scale s. mirror: the pad seen in the glass
 *  (u -> -u), for its reflection. */
export const viewOf = (st: Pad3DState, mirror = false) => {
  const ps = rad(st.yaw), th = rad(st.pitch);
  const cp = Math.cos(ps), sp = Math.sin(ps), ct = Math.cos(th), sth = Math.sin(th);
  const ta = rad(st.tilt);
  const mu = mirror ? -1 : 1;
  // the pad's own rigid motion: peel about the face's top edge, stand-off, slide
  const rig = (p: P3): P3 => {
    const v0 = -PH / 2;
    const du = p.u, dv = p.v - v0;
    return {u: st.gap + du * Math.cos(ta) + dv * Math.sin(ta), v: st.slide + v0 - du * Math.sin(ta) + dv * Math.cos(ta), w: p.w};
  };
  const ob = st.obl;
  const on = ob ? Math.hypot(ob.kx, ob.ky, 1) : 1;
  const persp = st.persp && st.persp > 0 ? st.persp : 0;
  const rot = (p: P3): Cs => {
    const u = p.u * mu;
    if (ob) return {X: u + ob.kx * p.w, Y: p.v + ob.ky * p.w, D: (-ob.kx * u - ob.ky * p.v + p.w) / on};
    const X = u * cp - p.w * sp;
    const D0 = u * sp + p.w * cp;
    return {X, Y: p.v * ct + D0 * sth, D: D0 * ct - p.v * sth};
  };
  const pr = (c: Cs): Proj => {
    if (!persp) return {x: c.X, y: c.Y, d: c.D, s: 1};
    const s = persp / Math.max(persp * 0.14, persp - c.D);
    return {x: c.X * s, y: c.Y * s, d: c.D, s};
  };
  const cs = (p: P3) => rot(rig(p)); // a pad part (moves with the pad)
  const csF = (p: P3) => rot(p); // the surface and the world (fixed)
  const world = (p: P3) => pr(cs(p));
  const fixed = (p: P3) => pr(csF(p));
  // a direction (face normals), rigid-rotated with the pad
  const dir = (n: P3, moving = true) => {
    const a0 = moving ? {u: n.u * Math.cos(ta) + n.v * Math.sin(ta), v: -n.u * Math.sin(ta) + n.v * Math.cos(ta), w: n.w} : n;
    const a = {u: a0.u * mu, v: a0.v, w: a0.w};
    if (ob) return {x: a.u * 0.85 - a.w * 0.5, y: a.v, z: (-ob.kx * a.u - ob.ky * a.v + a.w) / on};
    const X = a.u * cp - a.w * sp;
    const D = a.u * sp + a.w * cp;
    return {x: X, y: a.v * ct + D * sth, z: D * ct - a.v * sth};
  };
  /** > 0 when a face with normal n (pad axes) through p looks toward the camera */
  const facing = (n: P3, p: P3, moving = true) => {
    const nn = dir(n, moving);
    if (!persp) return nn.z;
    const c = moving ? cs(p) : csF(p);
    const vx = -c.X, vy = -c.Y, vz = persp - c.D;
    const l = Math.hypot(vx, vy, vz) || 1;
    return (nn.x * vx + nn.y * vy + nn.z * vz) / l;
  };
  /** a fixed polygon cut to the space in front of the camera, projected (null if nothing is left) */
  const clipFixed = (pts: P3[]): Proj[] | null => {
    const c = pts.map(csF);
    if (!persp) return c.map(pr);
    const Dm = persp * 0.86;
    const out: Cs[] = [];
    for (let i = 0; i < c.length; i++) {
      const a = c[i], b = c[(i + 1) % c.length];
      const ai = a.D <= Dm, bi = b.D <= Dm;
      if (ai) out.push(a);
      if (ai !== bi) {
        const t = (Dm - a.D) / (b.D - a.D);
        out.push({X: a.X + (b.X - a.X) * t, Y: a.Y + (b.Y - a.Y) * t, D: Dm});
      }
    }
    return out.length >= 3 ? out.map(pr) : null;
  };
  /** the screen point a direction (pad axes, fixed) vanishes to, or null if it points behind the camera */
  const vanish = (d: P3): {x: number; y: number} | null => {
    const c = rot(d);
    if (!persp) return null;
    if (c.D >= -1e-6) return null;
    return {x: (c.X * persp) / -c.D, y: (c.Y * persp) / -c.D};
  };
  return {world, fixed, dir, cs, csF, pr, facing, clipFixed, vanish, persp, mirror};
};
export type PadView = ReturnType<typeof viewOf>;

type Item = {d: number; g: number; node: React.ReactNode};
/** structural layers, from the glass outward (drawn in this order seen from behind, reversed seen through the glass) */
const G = {tiles: 0, plate: 1, rimFar: 2, inner: 3, rimNear: 4, cover: 5, handle: 6};

/** Lambert-ish flat shade for a face of base colour c with camera-space normal n */
const faceColor = (c: string, n: {x: number; y: number; z: number}) => {
  const k = n.x * L_KEY.x + n.y * L_KEY.y + n.z * L_KEY.z;
  return k >= 0 ? lit(c, 0.28 * k) : shade(c, -0.32 * k);
};

export const COL = {
  tileDry: '#D4E7EA',
  tileWet: '#2F4E58',
  plate: '#4F5D68',
  rim: '#8E9CA6',
  bevel: '#B9C5CD',
  accent: '#D8663B',
  cover: '#56656F',
  backplate: '#6B7A84',
  screw: '#C5CFD6',
  rail: '#6A767E',
  spine: '#59656D',
  lug: '#7A8790',
  post: '#AEBBC5',
  bar: '#2C3338',
  spring: '#DDE5EA',
  springHot: '#EFAE62',
  tendon: '#22282C',
  strap: '#D8663B',
  ring: '#C7D0D6',
  section: '#C9D3D9',
};

/** the grip closure 0..1 from a hand pose (H_BAR -> 1, H_BAR_OPEN -> about 0.15) */
export const gripOf = (h: HandPose) => clamp(((h.curl[0] + h.curl[1] + h.curl[2] + h.curl[3]) / 4 - 0.42) / (0.81 - 0.42));

// ------------------------------------------------------------------------------------------------ the hand (3D)
type Seg = {a: P3; b: P3; ra: number; rb: number; tag: string};
type Sph = {c: P3; r: number};
/** the fingers (index .. pinky, top to bottom along the bar): v offset, radius, phalanx lengths */
const FING = [
  {dv: -29.4, r: 9.3, L: [29, 21, 17]},
  {dv: -9.8, r: 9.7, L: [31, 23, 18]},
  {dv: 9.8, r: 9.3, L: [29.5, 21.5, 17]},
  {dv: 29.0, r: 8.1, L: [24, 17, 14.5]},
];
const PHI0 = 120; // the knuckles' angle round the bar (deg; 0 = +u toward him, 90 = +w the back of the hand's side)

/** the solved grip: the hand closed round the bar (axis u = BAR_U, w = 0, along v; vb = the grip's centre on it).
 *  g: closure 0..1; side: +1 the back of the hand faces +w. Returns the finger, thumb and palm geometry, the wrist
 *  and the arm. Built in the bar's own frame, so it stays on the bar from every view. */
export const gripGeo = (vb: number, g: number, side: 1 | -1, arm: ArmSpec | null) => {
  const B = BAR_U, R0 = P3D.BAR_R;
  const lift = (1 - g) * 7; // the palm comes off the bar as the hand opens
  // local (x along +u from the bar axis, y toward the back of the hand) -> pad axes
  const L = (x: number, y: number, v: number): P3 => ({u: B + x, v: vb + v, w: side * (y + lift)});
  const polar = (phi: number, R: number) => ({x: R * Math.cos(rad(phi)), y: R * Math.sin(rad(phi))});
  const fingers: Seg[][] = FING.map((F, k) => {
    const Rw = R0 + F.r + 0.8;
    // closed: the joints lie on the wrap circle, one chord per phalanx
    const phis = [PHI0];
    for (const l of F.L) phis.push(phis[phis.length - 1] + (2 * Math.asin(Math.min(1, l / (2 * Rw))) * 180) / Math.PI);
    const th = F.L.map((_, i) => (phis[i] + phis[i + 1]) / 2 + 90);
    // opening: the first phalanx swings back off the bar and every bend relaxes (the fingers move away from it)
    const open = 1 - g;
    const th2: number[] = [];
    th2.push(th[0] - open * 42);
    for (let i = 1; i < th.length; i++) th2.push(th2[i - 1] + (th[i] - th[i - 1]) * (0.25 + 0.75 * g));
    let p = polar(PHI0, Rw + 1.4);
    const segs: Seg[] = [];
    const rr = [F.r, F.r * 0.95, F.r * 0.9, F.r * 0.84];
    F.L.forEach((l, i) => {
      const q = {x: p.x + l * Math.cos(rad(th2[i])), y: p.y + l * Math.sin(rad(th2[i]))};
      segs.push({a: L(p.x, p.y, F.dv), b: L(q.x, q.y, F.dv), ra: rr[i], rb: rr[i + 1], tag: `f${k}${i}`});
      p = q;
    });
    return segs;
  });
  // the thumb: its metacarpal is inside the thenar (part of the palm); the visible thumb comes round the bar's near
  // (+u) face from the top of the fist, its tip on the index finger's tip on the far side
  const o = 1 - g;
  const cmc = {...L(40, 18, -14), r: 13};
  const tmcp = (() => { const q = polar(34, 27.5 + o * 3); return {...L(q.x, q.y, -29), r: 10.6}; })();
  const tip0 = (() => { const q = polar(-22 + o * 50, 25 + o * 6); return {...L(q.x, q.y, -33), r: 9.6}; })();
  const tip1 = (() => { const q = polar(-60 + o * 80, 24.2 + o * 10); return {...L(q.x, q.y, -32), r: 8.6}; })();
  const thumb: Seg[] = [
    {a: tmcp, b: tip0, ra: tmcp.r, rb: tip0.r, tag: 't0'},
    {a: tip0, b: tip1, ra: tip0.r, rb: tip1.r, tag: 't1'},
  ];
  // the palm: a hull round the knuckles, the back of the hand, the thenar (with the thumb's metacarpal) and the heel,
  // and the wrist
  const palm: Sph[] = [
    ...FING.map((F) => {
      const q = polar(PHI0, R0 + F.r + 2.2);
      return {c: L(q.x, q.y, F.dv), r: F.r + 1.6};
    }),
    {c: L(12, 27, -17), r: 12},
    {c: L(12, 27, 14), r: 12},
    {c: L(32, 26, -12), r: 14},
    {c: L(32, 26, 14), r: 14},
    {c: cmc, r: cmc.r},
    {c: lerp3(cmc, tmcp, 0.5), r: 12},
    {c: tmcp, r: tmcp.r},
    {c: L(44, 17, 26), r: 13},
    {c: L(58, 20, 8), r: 19},
  ];
  const wrist = L(64, 21, 10);
  const sd = (p: P3): P3 => ({u: p.u, v: p.v, w: side * p.w});
  const elbow = arm ? add3(wrist, sd(arm.elbow)) : null;
  const shoulder = arm && arm.shoulder && elbow ? add3(elbow, sd(arm.shoulder)) : null;
  return {fingers, thumb, palm, wrist, elbow, shoulder, palmC: L(30, 22, 0)};
};
const add3 = (a: P3, b: P3): P3 => ({u: a.u + b.u, v: a.v + b.v, w: a.w + b.w});
const sub3 = (a: P3, b: P3): P3 => ({u: a.u - b.u, v: a.v - b.v, w: a.w - b.w});
const mul3 = (a: P3, s: number): P3 => ({u: a.u * s, v: a.v * s, w: a.w * s});
const lerp3 = (a: P3, b: P3, t: number): P3 => ({u: lerp(a.u, b.u, t), v: lerp(a.v, b.v, t), w: lerp(a.w, b.w, t)});
const len3 = (a: P3) => Math.hypot(a.u, a.v, a.w);
const norm3 = (a: P3): P3 => mul3(a, 1 / (len3(a) || 1));
const cross3 = (a: P3, b: P3): P3 => ({u: a.v * b.w - a.w * b.v, v: a.w * b.u - a.u * b.w, w: a.u * b.v - a.v * b.u});
/** a polygon (pad axes) cut to the half-space f(p) <= 0 (f linear in p) */
const clipPoly = (pts: P3[], f: (p: P3) => number): P3[] => {
  const out: P3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const fa = f(a), fb = f(b);
    if (fa <= 0) out.push(a);
    if (fa <= 0 !== fb <= 0) out.push(lerp3(a, b, fa / (fa - fb)));
  }
  return out;
};

/** convex hull (monotone chain) */
const hull = (pts: V[]): V[] => {
  const p = [...pts].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  if (p.length < 3) return p;
  const cr = (o: V, a: V, b: V) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: V[] = [], up: V[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
/** a smooth closed path through points (Catmull-Rom as cubics) */
const smoothClosed = (pts: V[], k = 1 / 6) => {
  const n = pts.length;
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C${fmt(p1.x + (p2.x - p0.x) * k)},${fmt(p1.y + (p2.y - p0.y) * k)} ${fmt(p2.x - (p3.x - p1.x) * k)},${fmt(p2.y - (p3.y - p1.y) * k)} ${P(p2)}`;
  }
  return d + ' Z';
};
/** the visible outline of a tube (truncated cone) between two circles in 3D: the hull of both projected rims */
const tubeOutline = (pj: (p: P3) => Proj, a: P3, b: P3, ra: number, rb: number, n = 20): V[] => {
  const ax = norm3(sub3(b, a));
  const t0 = Math.abs(ax.v) < 0.9 ? {u: 0, v: 1, w: 0} : {u: 1, v: 0, w: 0};
  const e1 = norm3(cross3(ax, t0)), e2 = cross3(ax, e1);
  const pts: V[] = [];
  for (const [c, r] of [[a, ra], [b, rb]] as [P3, number][])
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const q = pj(add3(c, add3(mul3(e1, r * Math.cos(t)), mul3(e2, r * Math.sin(t)))));
      pts.push({x: q.x, y: q.y});
    }
  return hull(pts);
};
/** the front-facing arc of a circle round an axis (for the hem, stripes, grip rings): projected points */
const ringArc = (vw: PadView, c: P3, axis: P3, r: number, n = 24, whole = false) => {
  const ax = norm3(axis);
  const t0 = Math.abs(ax.v) < 0.9 ? {u: 0, v: 1, w: 0} : {u: 1, v: 0, w: 0};
  const e1 = norm3(cross3(ax, t0)), e2 = cross3(ax, e1);
  const out: {p: Proj; front: boolean}[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const rd = add3(mul3(e1, Math.cos(t)), mul3(e2, Math.sin(t)));
    const q = add3(c, mul3(rd, r));
    out.push({p: vw.world(q), front: whole || vw.facing(rd, q) > 0});
  }
  return out;
};

/** the contiguous front-facing run of a closed ring sample (rotated so it does not wrap round the start) */
const frontRun = (ring: {p: Proj; front: boolean}[]) => {
  const n = ring.length - 1; // the last sample repeats the first
  const pts = ring.slice(0, n);
  let start = pts.findIndex((q, i) => q.front && !pts[(i - 1 + n) % n].front);
  if (start < 0) start = 0;
  const out: {x: number; y: number}[] = [];
  for (let k = 0; k < n; k++) {
    const q = pts[(start + k) % n];
    if (!q.front) break;
    out.push({x: q.p.x, y: q.p.y});
  }
  return out;
};
/** the hand on the bar, the bar itself between the fingers, and the arm: one node in a deliberate layer order. Every
 *  part is placed on its own side of the bar, part by part: behind the bar the digits on its far side and the part of
 *  the palm that lies beyond it; then the bar (with its collars); in front the part of the palm on the camera's side,
 *  the digits on the near side, the thumb. The forearm (and the upper arm and sleeve) belong to the palm's heel, so
 *  they go with whichever part holds the wrist; one outline runs round palm, wrist and arm (no line at the wrist). */
const GripNode: React.FC<{id: string; vw: PadView; vb: number; g: number; side: 1 | -1; arm: ArmSpec | null; barNode: React.ReactNode; iw: number; stripes: boolean}> = ({id, vw, vb, g, side, arm, barNode, iw, stripes}) => {
  const geo = gripGeo(vb, g, side, arm);
  const skin = HERO.skin;
  const barD = (v: number) => vw.cs({u: BAR_U, v, w: 0}).D;
  const inFront = (p: P3) => vw.cs(p).D > barD(p.v);
  const pj = (p: P3) => vw.world(p);
  type Piece = {d: number; front: boolean; node: React.ReactNode};
  const pieces: Piece[] = [];
  // each phalanx in two halves, each on its own side of the bar
  const capsule = (s: Seg, key: string, color: string) => {
    const A = pj(s.a), Bp = pj(s.b);
    return <Capsule key={key} id={`${id}-${key}`} a={{x: A.x, y: A.y}} b={{x: Bp.x, y: Bp.y}} ra={s.ra * A.s} rb={s.rb * Bp.s} color={color} spec={0.22} k={1.05} />;
  };
  // a digit's phalanges in halves; consecutive halves on the same side of the bar form one outlined group (a joint
  // crease is drawn only where the digit bends past the bar's silhouette)
  const digit = (segs: Seg[], key: string, color: (i: number) => string) => {
    type Half = {a: P3; b: P3; ra: number; rb: number; front: boolean; d: number; i: number; h: number};
    const halves: Half[] = [];
    segs.forEach((s, i) => {
      for (const h of [0, 1]) {
        const a = lerp3(s.a, s.b, h * 0.5), b = lerp3(s.a, s.b, h * 0.5 + 0.5);
        const m = lerp3(a, b, 0.5);
        const d = vw.cs(m).D;
        halves.push({a, b, ra: lerp(s.ra, s.rb, h * 0.5), rb: lerp(s.ra, s.rb, h * 0.5 + 0.5), front: d > barD(m.v), d, i, h});
      }
    });
    let run: Half[] = [];
    const flush = () => {
      if (!run.length) return;
      const r = run;
      const k0 = `${key}${r[0].i}${r[0].h}`;
      pieces.push({
        d: r.reduce((x, q) => x + q.d, 0) / r.length,
        front: r[0].front,
        node: (
          <Inked key={k0} w={iw}>
            {r.map((q) => capsule({a: q.a, b: q.b, ra: q.ra, rb: q.rb, tag: ''}, `${key}${q.i}${q.h}`, color(q.i)))}
          </Inked>
        ),
      });
      run = [];
    };
    for (const q of halves) {
      if (run.length && run[0].front !== q.front) flush();
      run.push(q);
    }
    flush();
  };
  geo.fingers.forEach((f, k) => digit(f, `f${k}`, (i) => (i === 0 ? skin : mix(skin, lit(skin, 0.2), 0.12 * i))));
  digit(geo.thumb, 't', (i) => (i === 0 ? skin : lit(skin, 0.04)));
  // the palm: one hull per side of the bar (each sphere goes with the side its centre is on); both parts share one
  // shading centre, so they read as one hand
  const hullPath = (sph: Sph[]) => {
    if (!sph.length) return null;
    const hp: V[] = [];
    for (const s of sph) {
      const c = pj(s.c);
      const r = s.r * c.s;
      for (let i = 0; i < 16; i++) {
        const t = (i / 16) * Math.PI * 2;
        hp.push({x: c.x + r * Math.cos(t), y: c.y + r * Math.sin(t)});
      }
    }
    return smoothClosed(hull(hp), 1 / 14);
  };
  const HEEL = geo.palm.length - 1;
  const heelFront = inFront(geo.palm[HEEL].c);
  const palmF = hullPath(geo.palm.filter((s) => inFront(s.c)));
  const palmB = hullPath(geo.palm.filter((s) => !inFront(s.c)));
  const pc = pj(geo.palmC);
  const palmBlob = (d: string | null, key: string) => (d ? <Blob key={key} id={`${id}-${key}`} d={d} c={{x: pc.x, y: pc.y}} r={46 * pc.s} color={skin} k={0.9} /> : null);
  // the arm's tubes share one shading: the same normal (across the wrist -> elbow line, toward the key light) and the
  // same centre at the elbow, so there is no tonal seam where forearm and upper arm meet
  const W0 = geo.wrist;
  const forearm = geo.elbow ? {a: lerp3(geo.palmC, W0, 0.55), b: geo.elbow, ra: 21, rb: 28} : null;
  const shared = (() => {
    if (!geo.elbow) return null;
    const A = pj(W0), E = pj(geo.elbow);
    const ax = {x: E.x - A.x, y: E.y - A.y};
    const l = Math.hypot(ax.x, ax.y) || 1;
    let n = {x: -ax.y / l, y: ax.x / l};
    if (n.x * -0.62 + n.y * -0.78 < 0) n = {x: -n.x, y: -n.y};
    return {n, m: {x: E.x, y: E.y}, r: 28 * E.s * 1.05};
  })();
  const gradId = `${id}-armg`;
  const armGrad = shared && (
    <defs>
      <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={fmt(shared.m.x + shared.n.x * shared.r)} y1={fmt(shared.m.y + shared.n.y * shared.r)} x2={fmt(shared.m.x - shared.n.x * shared.r)} y2={fmt(shared.m.y - shared.n.y * shared.r)}>
        <stop offset="0" stopColor={lit(skin, 0.26)} />
        <stop offset="0.3" stopColor={lit(skin, 0.08)} />
        <stop offset="0.62" stopColor={skin} />
        <stop offset="0.9" stopColor={shade(skin, 0.3)} />
        <stop offset="1" stopColor={mix(shade(skin, 0.3), skin, 0.35)} />
      </linearGradient>
    </defs>
  );
  const tube = (a: P3, b: P3, ra: number, rb: number, key: string, fill: string) => {
    const out = tubeOutline(pj, a, b, ra, rb);
    const d = `M${out.map((q) => P(q)).join(' L')} Z`;
    return <InkFill key={key} d={d} fill={fill} />;
  };
  const skinFill = `url(#${gradId})`;
  let armBody: React.ReactNode = null;
  let sleeveNode: React.ReactNode = null;
  let hemFacing = 0;
  if (forearm && geo.elbow && geo.shoulder) {
    const E = geo.elbow, S = geo.shoulder;
    const upper = {a: E, b: S, ra: 29, rb: 35};
    const foreD = vw.cs(lerp3(W0, E, 0.5)).D;
    const upD = vw.cs(lerp3(E, S, 0.5)).D;
    // the sleeve: from past the shoulder (beyond the frame in every framing this is used with) to the hem a little
    // over halfway down the upper arm
    const ax = sub3(E, S);
    const HEM = 0.56;
    const hem = add3(S, mul3(ax, HEM));
    const top = add3(S, mul3(ax, -0.14));
    const sleeveC = '#FFFFFF';
    const sv = norm3(ax);
    const band = (t0: number, t1: number) => {
      const a = add3(S, mul3(ax, t0)), b = add3(S, mul3(ax, t1));
      const ra = lerp(46, 43, (t0 + 0.25) / (HEM + 0.25)), rb = lerp(46, 43, (t1 + 0.25) / (HEM + 0.25));
      const fa = frontRun(ringArc(vw, a, sv, ra + 0.4, 36));
      const fb = frontRun(ringArc(vw, b, sv, rb + 0.4, 36));
      if (fa.length < 2 || fb.length < 2) return null;
      return `M${[...fa, ...fb.reverse()].map((q) => P(q)).join(' L')} Z`;
    };
    const hemRing = ringArc(vw, hem, sv, 43, 32, true).map((q) => ({x: q.p.x, y: q.p.y}));
    hemFacing = vw.facing(mul3(sv, 1), hem); // > 0: we look into the sleeve's opening
    // the sleeve's own soft shading (white cotton: a cool shadow down the side away from the key light)
    const T0 = pj(top), H0 = pj(hem);
    const sax = {x: H0.x - T0.x, y: H0.y - T0.y};
    const sl = Math.hypot(sax.x, sax.y) || 1;
    let sn = {x: -sax.y / sl, y: sax.x / sl};
    if (sn.x * -0.62 + sn.y * -0.78 < 0) sn = {x: -sn.x, y: -sn.y};
    const sm = {x: (T0.x + H0.x) / 2, y: (T0.y + H0.y) / 2}, sr = 46 * ((T0.s + H0.s) / 2);
    sleeveNode = (
      <g key="sl">
        <defs>
          <linearGradient id={`${id}-slg`} gradientUnits="userSpaceOnUse" x1={fmt(sm.x + sn.x * sr)} y1={fmt(sm.y + sn.y * sr)} x2={fmt(sm.x - sn.x * sr)} y2={fmt(sm.y - sn.y * sr)}>
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.55" stopColor="#F4F6F8" />
            <stop offset="1" stopColor="#C9D3DC" />
          </linearGradient>
        </defs>
        <Inked w={iw}>{tube(top, hem, 46, 43, 'slv', `url(#${id}-slg)`)}</Inked>
        <Deco>
          {stripes && [band(-0.12, 0.02), band(0.17, 0.32), band(0.45, HEM - 0.03)].map((d, i) => d && <path key={i} d={d} fill="#FFC744" opacity={0.95} />)}
          {/* the hem's opening: the inside of the sleeve, where we can see into it */}
          {hemFacing > 0 && <path d={`M${hemRing.map((q) => P(q)).join(' L')} Z`} fill={shade('#DCE3EA', 0.35)} opacity={clamp(hemFacing * 3)} />}
          <path d={`M${hemRing.map((q) => P(q)).join(' L')}`} fill="none" stroke="#B4C3D1" strokeWidth={fmt(iw * 0.35)} opacity={0.7} />
        </Deco>
      </g>
    );
    const foreTube = tube(forearm.a, forearm.b, forearm.ra, forearm.rb, 'fa', skinFill);
    const upTube = tube(upper.a, lerp3(upper.a, upper.b, 1 - HEM + 0.02), upper.ra, lerp(upper.ra, upper.rb, 1 - HEM), 'ua', skinFill);
    // the elbow: a ball of the joint's radius in the same fill, so the two tubes meet without a step in the outline
    const Ep = pj(E);
    const er = 28.6 * Ep.s;
    const elbowBall = <InkFill key="eb" d={`M${fmt(Ep.x - er)},${fmt(Ep.y)} a${fmt(er)},${fmt(er)} 0 1 0 ${fmt(2 * er)},0 a${fmt(er)},${fmt(er)} 0 1 0 ${fmt(-2 * er)},0 Z`} fill={skinFill} />;
    armBody = (
      <g key="ab">
        {upD < foreD ? upTube : foreTube}
        {elbowBall}
        {upD < foreD ? foreTube : upTube}
      </g>
    );
  } else if (forearm && geo.elbow) {
    armBody = tube(forearm.a, forearm.b, forearm.ra, 34, 'fa', skinFill);
  }
  // the part of the palm holding the wrist carries the arm (one outline); where we look into the sleeve's opening the
  // arm comes out of it toward us (sleeve first), otherwise the sleeve covers the arm where it goes in
  const heelPart = (
    <g key="hp">
      {armGrad}
      {hemFacing > 0 && sleeveNode}
      <Inked w={iw}>
        {armBody}
        {palmBlob(heelFront ? palmF : palmB, 'palmh')}
      </Inked>
      {!(hemFacing > 0) && sleeveNode}
    </g>
  );
  const otherPart = <Inked key="op" w={iw}>{palmBlob(heelFront ? palmB : palmF, 'palmo')}</Inked>;
  const armFront = heelFront ? heelPart : otherPart;
  const armBack = heelFront ? otherPart : heelPart;
  const back = pieces.filter((p) => !p.front).sort((a, b) => a.d - b.d);
  const front = pieces.filter((p) => p.front).sort((a, b) => a.d - b.d);
  // knuckle highlights on the back of the hand: each only where its knuckle is on the camera's side of the bar and
  // faces the camera
  const nOut: P3 = {u: Math.cos(rad(PHI0)), v: 0, w: side * Math.sin(rad(PHI0))};
  const knuckles = geo.fingers.map((f, k) => {
    const kc = geo.palm[k].c;
    const fc = vw.facing(nOut, kc);
    if (!inFront(kc) || fc < 0.2) return null;
    const q = pj(lerp3(f[0].a, f[0].b, 0.12));
    return <ellipse key={k} cx={fmt(q.x - 2.2 * q.s)} cy={fmt(q.y - 2 * q.s)} rx={fmt(3.6 * q.s)} ry={fmt(2 * q.s)} fill="#FFFFFF" opacity={0.28 * clamp((fc - 0.2) * 4)} />;
  });
  return (
    <g>
      {armBack}
      {back.map((p) => p.node)}
      {barNode}
      {armFront}
      {front.map((p) => p.node)}
      <Deco>{knuckles}</Deco>
    </g>
  );
};
/** a path that takes part in an <Inked> group's silhouette with an arbitrary fill (e.g. a gradient url): ink in the
 *  group's ink pass, the fill in its fill pass */
const InkFill: React.FC<{d: string; fill: string}> = ({d, fill}) => {
  const ink = useInk();
  if (ink.pass === 'ink') return <path d={d} fill={INK} stroke={INK} strokeWidth={ink.w * 2 * OUTLINE_K} strokeLinejoin="round" />;
  return <path d={d} fill={fill} />;
};

// ------------------------------------------------------------------------------------------------ the pad
const buildItems = (id: string, st: Pad3DState, vw: PadView, z: number, k: number) => {
  const ink = (1.5 / Math.max(1e-6, z)) * 1.4 * k;
  const items: Item[] = [];
  let key = 0;
  let grp = 0;
  const travel = travelOf(st.load);
  const emph = clamp(st.emph ?? 0);
  const housing = (c: string) => (emph > 0 ? mix(c, '#C3CDD3', 0.22 * emph) : c);
  const poly = (pts0: P3[], normal: P3, color: string, opts: {moving?: boolean; stroke?: number; opacity?: number; cull?: boolean; bias?: number; clip?: (p: P3) => number} = {}) => {
    const moving = opts.moving ?? true;
    const pts = opts.clip ? clipPoly(pts0, opts.clip) : pts0;
    if (pts.length < 3) return;
    const c = pts.reduce((s, p) => ({u: s.u + p.u / pts.length, v: s.v + p.v / pts.length, w: s.w + p.w / pts.length}), {u: 0, v: 0, w: 0});
    if ((opts.cull ?? true) && vw.facing(normal, c, moving) <= 1e-4) return;
    const n = vw.dir(normal, moving);
    const sp = pts.map((p) => (moving ? vw.world(p) : vw.fixed(p)));
    const d = sp.reduce((s, p) => s + p.d, 0) / sp.length + (opts.bias ?? 0);
    items.push({
      d,
      g: grp,
      node: <path key={key++} d={`M${sp.map((p) => P(p)).join(' L')} Z`} fill={faceColor(color, n)} stroke={INK} strokeWidth={fmt(ink * (opts.stroke ?? 1))} strokeLinejoin="round" opacity={opts.opacity ?? 1} />,
    });
  };
  const box = (u0: number, u1: number, v0: number, v1: number, w0: number, w1: number, color: string, opts: {stroke?: number; opacity?: number; skip?: string[]; bias?: number; clip?: (p: P3) => number} = {}) => {
    const f: [string, P3[], P3][] = [
      ['u0', [{u: u0, v: v0, w: w0}, {u: u0, v: v1, w: w0}, {u: u0, v: v1, w: w1}, {u: u0, v: v0, w: w1}], {u: -1, v: 0, w: 0}],
      ['u1', [{u: u1, v: v0, w: w0}, {u: u1, v: v0, w: w1}, {u: u1, v: v1, w: w1}, {u: u1, v: v1, w: w0}], {u: 1, v: 0, w: 0}],
      ['v0', [{u: u0, v: v0, w: w0}, {u: u0, v: v0, w: w1}, {u: u1, v: v0, w: w1}, {u: u1, v: v0, w: w0}], {u: 0, v: -1, w: 0}],
      ['v1', [{u: u0, v: v1, w: w0}, {u: u1, v: v1, w: w0}, {u: u1, v: v1, w: w1}, {u: u0, v: v1, w: w1}], {u: 0, v: 1, w: 0}],
      ['w0', [{u: u0, v: v0, w: w0}, {u: u1, v: v0, w: w0}, {u: u1, v: v1, w: w0}, {u: u0, v: v1, w: w0}], {u: 0, v: 0, w: -1}],
      ['w1', [{u: u0, v: v0, w: w1}, {u: u0, v: v1, w: w1}, {u: u1, v: v1, w: w1}, {u: u1, v: v0, w: w1}], {u: 0, v: 0, w: 1}],
    ];
    for (const [nm, pts, n] of f) if (!opts.skip?.includes(nm)) poly(pts, n, color, opts);
  };
  /** a round rod between two pad-local points: a tapered capsule (perspective) at its mean depth */
  const rod = (a: P3, b: P3, r: number, color: string, extra = 0, op = 1) => {
    const A = vw.world(a), B = vw.world(b);
    const ra = r * A.s, rb = r * B.s;
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const path = `M${fmt(A.x + nx * ra)},${fmt(A.y + ny * ra)} L${fmt(B.x + nx * rb)},${fmt(B.y + ny * rb)} A${fmt(rb)},${fmt(rb)} 0 0 1 ${fmt(B.x - nx * rb)},${fmt(B.y - ny * rb)} L${fmt(A.x - nx * ra)},${fmt(A.y - ny * ra)} A${fmt(ra)},${fmt(ra)} 0 0 1 ${fmt(A.x + nx * ra)},${fmt(A.y + ny * ra)} Z`;
    items.push({
      d: (A.d + B.d) / 2 + extra,
      g: grp,
      node: (
        <g key={key++} opacity={op}>
          <path d={path} fill={color} stroke={INK} strokeWidth={fmt(ink)} />
          <path d={`M${fmt(A.x + nx * ra * 0.45)},${fmt(A.y + ny * ra * 0.45)} L${fmt(B.x + nx * rb * 0.45)},${fmt(B.y + ny * rb * 0.45)}`} stroke={lit(color, 0.55)} strokeWidth={fmt((ra + rb) * 0.17)} strokeLinecap="round" opacity={0.6} />
        </g>
      ),
    });
    return {A, B};
  };
  /** a projected polyline stroked as a wire (dark outline, light core), width in mm at its depth */
  const wire = (pts: P3[], wmm: number, color: string, extra = 0, opts: {outline?: string; core?: number} = {}) => {
    const sp = pts.map((p) => vw.world(p));
    const s = sp.reduce((a, p) => a + p.s, 0) / sp.length;
    const d = `M${sp.map((p) => P(p)).join(' L')}`;
    items.push({
      d: sp.reduce((a, p) => a + p.d, 0) / sp.length + extra,
      g: grp,
      node: (
        <g key={key++}>
          <path d={d} stroke={opts.outline ?? '#20262A'} strokeWidth={fmt(wmm * s + 2 * ink)} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d={d} stroke={color} strokeWidth={fmt(wmm * s * (opts.core ?? 1))} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </g>
      ),
    });
  };

  /** a short cylinder (collar, boss) between two pad-local points: its projected hull, its near end ring */
  const cylNode = (a: P3, b: P3, r: number, color: string, k0: string) => {
    const out = tubeOutline(vw.world, a, b, r, r, 24);
    const ax = sub3(b, a);
    const endA = vw.facing(mul3(ax, -1), a) > 0, endB = vw.facing(ax, b) > 0;
    const capOf = (c: P3) => ringArc(vw, c, ax, r, 24, true).map((q) => q.p);
    const cap = endA ? capOf(a) : endB ? capOf(b) : null;
    return (
      <g key={k0}>
        <path d={`M${out.map((q) => P(q)).join(' L')} Z`} fill={color} stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
        {cap && <path d={`M${cap.map((q) => P(q)).join(' L')} Z`} fill={lit(color, 0.22)} stroke={INK} strokeWidth={fmt(ink * 0.8)} />}
      </g>
    );
  };
  const cyl = (a: P3, b: P3, r: number, color: string, extra = 0) => {
    const A = vw.world(a), B = vw.world(b);
    items.push({d: (A.d + B.d) / 2 + extra, g: grp, node: cylNode(a, b, r, color, `c${key++}`)});
  };
  const {TILE, GAP, RIM, COLS, ROWS, T_TILE, U_PLATE, U_BACK} = P3D;
  const slipOf = (i: number) => st.slip?.[i] ?? 0;
  // ---- the tiles (front, on the surface)
  grp = G.tiles;
  const faceSeen = vw.facing({u: -1, v: 0, w: 0}, {u: 0, v: 0, w: 0}) > 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const t0 = tileVW(c, r), i = r * COLS + c;
      const t = {v: t0.v + slipOf(i), w: t0.w};
      const ct = clamp(st.contact[i] ?? 0);
      // seen side-on the tile's edge darkens as it wets; its face (seen through the glass) carries a contact patch
      const col = faceSeen ? mix(COL.tileDry, COL.tileWet, 0.18 * ct) : mix('#CADDE2', '#93AFB8', 0.3 * ct);
      box(0, T_TILE, t.v - TILE / 2, t.v + TILE / 2, t.w - TILE / 2, t.w + TILE / 2, col, {stroke: 0.7});
      if (faceSeen) {
        const face = (v0: number, v1: number, w0: number, w1: number) => [{u: -0.02, v: v0, w: w0}, {u: -0.02, v: v0, w: w1}, {u: -0.02, v: v1, w: w1}, {u: -0.02, v: v1, w: w0}].map((p) => vw.world(p));
        const q0 = vw.world({u: 0, v: t.v, w: t.w});
        // ridges: rows of wedges across the dry tile (fade where it wets)
        const rid = (st.ridges ?? 0) * (1 - 0.85 * ct);
        const nodes: React.ReactNode[] = [];
        if (rid > 0.01) {
          const RIDGE = 2.2;
          for (let kk = 0; kk * RIDGE < TILE - 0.5; kk++) {
            const v = t.v - TILE / 2 + (kk + 0.5) * RIDGE;
            const a0 = vw.world({u: -0.05, v, w: t.w - TILE / 2 + 0.6}), a1 = vw.world({u: -0.05, v, w: t.w + TILE / 2 - 0.6});
            nodes.push(<path key={kk} d={`M${P(a0)} L${P(a1)}`} stroke="#F4FFFF" strokeWidth={fmt(ink * 1.1)} opacity={0.75 * rid} />);
          }
        }
        // the contact patch: wet from the middle out to the whole tile as the load comes on (the same in every tile)
        if (ct > 0.01) {
          const h = (TILE / 2) * (0.3 + 0.7 * ct) - 0.6 * ct;
          const rr = h * (0.55 - 0.45 * ct);
          const pts = face(t.v - h, t.v + h, t.w - h, t.w + h);
          // a rounded square: corners eased by rr (in mm, at the face's scale)
          const rs = rr * q0.s;
          const corner = pts.map((p) => ({x: p.x, y: p.y}));
          const ease = (a: {x: number; y: number}, b: {x: number; y: number}, dd: number) => {
            const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
            return {x: a.x + ((b.x - a.x) / l) * dd, y: a.y + ((b.y - a.y) / l) * dd};
          };
          let dd = '';
          for (let j = 0; j < 4; j++) {
            const p = corner[j], prev = corner[(j + 3) % 4], next = corner[(j + 1) % 4];
            const s0 = ease(p, prev, rs), s1 = ease(p, next, rs);
            dd += `${j === 0 ? 'M' : 'L'}${P(s0)} Q${P(p)} ${P(s1)} `;
          }
          dd += 'Z';
          nodes.push(<path key="wet" d={dd} fill={COL.tileWet} opacity={clamp(0.25 + 0.75 * ct)} />);
          // a faint sheen on the wet patch (it is optically flat against the glass)
          const s0 = vw.world({u: -0.03, v: t.v - h * 0.7, w: t.w - h * 0.75}), s1 = vw.world({u: -0.03, v: t.v - h * 0.7, w: t.w + h * 0.1});
          nodes.push(<path key="sh" d={`M${P(s0)} L${P(s1)}`} stroke="#9CC3CC" strokeWidth={fmt(ink * 1.3)} strokeLinecap="round" opacity={0.35 * ct} />);
        }
        if (nodes.length) items.push({d: q0.d + 0.02, g: grp, node: <g key={key++}>{nodes}</g>});
      }
    }
  // ---- the frame: front plate, rim (each rim wall is near or far: does its outer face look toward the camera?)
  grp = G.plate;
  {
    // the front plate: a slab chamfered on its glass side, so the tiles stand proud of it as their own thin layer
    // (the contact edge) from any oblique view
    const pc = housing(COL.plate);
    const ci = 6;
    const a = {v: PH / 2 - ci, w: PW / 2 - ci}, b = {v: PH / 2, w: PW / 2};
    poly([{u: U_PLATE, v: -b.v, w: -b.w}, {u: U_PLATE, v: -b.v, w: b.w}, {u: U_PLATE, v: b.v, w: b.w}, {u: U_PLATE, v: b.v, w: -b.w}], {u: 1, v: 0, w: 0}, pc);
    poly([{u: T_TILE, v: -a.v, w: -a.w}, {u: T_TILE, v: a.v, w: -a.w}, {u: T_TILE, v: a.v, w: a.w}, {u: T_TILE, v: -a.v, w: a.w}], {u: -1, v: 0, w: 0}, pc);
    const k = Math.hypot(U_PLATE - T_TILE, ci);
    const nu = -ci / k, nn = (U_PLATE - T_TILE) / k;
    poly([{u: T_TILE, v: -a.v, w: a.w}, {u: T_TILE, v: a.v, w: a.w}, {u: U_PLATE, v: b.v, w: b.w}, {u: U_PLATE, v: -b.v, w: b.w}], {u: nu, v: 0, w: nn}, pc);
    poly([{u: T_TILE, v: -a.v, w: -a.w}, {u: U_PLATE, v: -b.v, w: -b.w}, {u: U_PLATE, v: b.v, w: -b.w}, {u: T_TILE, v: a.v, w: -a.w}], {u: nu, v: 0, w: -nn}, pc);
    poly([{u: T_TILE, v: a.v, w: -a.w}, {u: U_PLATE, v: b.v, w: -b.w}, {u: U_PLATE, v: b.v, w: b.w}, {u: T_TILE, v: a.v, w: a.w}], {u: nu, v: nn, w: 0}, pc);
    poly([{u: T_TILE, v: -a.v, w: -a.w}, {u: T_TILE, v: -a.v, w: a.w}, {u: U_PLATE, v: -b.v, w: b.w}, {u: U_PLATE, v: -b.v, w: -b.w}], {u: nu, v: -nn, w: 0}, pc);
  }
  const RW = 6;
  const near = (n: P3, p: P3) => vw.facing(n, p) > 0;
  const coverOff = st.cover < 0.999;
  const cut = coverOff ? clamp(st.cut ?? 0) * clamp((1 - st.cover) * 1.5) : 0;
  // which side wall is the near one (sectioned in the cutaway)
  const nearW = vw.facing({u: 0, v: 0, w: 1}, {u: 15, v: 0, w: PW / 2}) > vw.facing({u: 0, v: 0, w: -1}, {u: 15, v: 0, w: -PW / 2}) ? 1 : -1;
  const uTop = (w: number) => (cut > 0 && Math.sign(w) === nearW ? lerp(U_BACK, U_PLATE + 1.2, cut) : U_BACK);
  const rimC = housing(COL.rim);
  grp = near({u: 0, v: -1, w: 0}, {u: 15, v: -PH / 2, w: 0}) ? G.rimNear : G.rimFar;
  box(U_PLATE, U_BACK, -PH / 2, -PH / 2 + RW, -PW / 2, PW / 2, rimC);
  grp = near({u: 0, v: 1, w: 0}, {u: 15, v: PH / 2, w: 0}) ? G.rimNear : G.rimFar;
  box(U_PLATE, U_BACK, PH / 2 - RW, PH / 2, -PW / 2, PW / 2, rimC);
  // the lug's slot in the bottom wall (where the spine's foot comes out)
  poly([{u: 11, v: PH / 2 + 0.05, w: -4.2}, {u: 23, v: PH / 2 + 0.05, w: -4.2}, {u: 23, v: PH / 2 + 0.05, w: 4.2}, {u: 11, v: PH / 2 + 0.05, w: 4.2}], {u: 0, v: 1, w: 0}, '#1E262B', {stroke: 0.5, bias: 0.2});
  for (const sw of [-1, 1]) {
    const w0 = sw < 0 ? -PW / 2 : PW / 2 - RW, w1 = sw < 0 ? -PW / 2 + RW : PW / 2;
    grp = near({u: 0, v: 0, w: sw}, {u: 15, v: 0, w: sw * PW / 2}) ? G.rimNear : G.rimFar;
    const ut = uTop(sw);
    box(U_PLATE, ut, -PH / 2 + RW, PH / 2 - RW, w0, w1, rimC);
    if (ut < U_BACK - 0.5) {
      // the section: the cut face of the wall, a lighter tone, so it reads as cut (not as a missing part)
      poly([{u: ut + 0.02, v: -PH / 2 + RW, w: w0}, {u: ut + 0.02, v: -PH / 2 + RW, w: w1}, {u: ut + 0.02, v: PH / 2 - RW, w: w1}, {u: ut + 0.02, v: PH / 2 - RW, w: w0}], {u: 1, v: 0, w: 0}, COL.section, {stroke: 0.9, bias: 0.3});
    }
  }
  grp = near({u: 0, v: -1, w: 0}, {u: 15, v: -PH / 2, w: 0}) ? G.rimNear : G.rimFar;
  // the orange edge stripe on the rim's top face (the crew's accent colour, as on the bay drawings)
  poly([{u: U_BACK - 6, v: -PH / 2 - 0.2, w: -PW / 2 + 8}, {u: U_BACK - 6, v: -PH / 2 - 0.2, w: PW / 2 - 8}, {u: U_BACK - 2, v: -PH / 2 - 0.2, w: PW / 2 - 8}, {u: U_BACK - 2, v: -PH / 2 - 0.2, w: -PW / 2 + 8}], {u: 0, v: -1, w: 0}, COL.accent, {stroke: 0.3});
  // a bevel round the rim's back edge (four sloped faces), so the frame reads as a machined part with thickness
  {
    const B = 3.2, u0 = U_BACK - B, u1 = U_BACK;
    const o = {v0: -PH / 2, v1: PH / 2, w0: -PW / 2, w1: PW / 2};
    const sides: [P3[], P3, number][] = [
      [[{u: u0, v: o.v0, w: o.w0}, {u: u0, v: o.v0, w: o.w1}, {u: u1, v: o.v0 + B, w: o.w1 - B}, {u: u1, v: o.v0 + B, w: o.w0 + B}], {u: 0.7, v: -0.7, w: 0}, 0],
      [[{u: u0, v: o.v1, w: o.w0}, {u: u1, v: o.v1 - B, w: o.w0 + B}, {u: u1, v: o.v1 - B, w: o.w1 - B}, {u: u0, v: o.v1, w: o.w1}], {u: 0.7, v: 0.7, w: 0}, 0],
      [[{u: u0, v: o.v0, w: o.w0}, {u: u1, v: o.v0 + B, w: o.w0 + B}, {u: u1, v: o.v1 - B, w: o.w0 + B}, {u: u0, v: o.v1, w: o.w0}], {u: 0.7, v: 0, w: -0.7}, -1],
      [[{u: u0, v: o.v0, w: o.w1}, {u: u0, v: o.v1, w: o.w1}, {u: u1, v: o.v1 - B, w: o.w1 - B}, {u: u1, v: o.v0 + B, w: o.w1 - B}], {u: 0.7, v: 0, w: 0.7}, 1],
    ];
    grp = G.rimNear;
    for (const [pts, n, sw] of sides) if (!(cut > 0.02 && sw === nearW)) poly(pts, n, housing(COL.bevel), {stroke: 0.5});
  }
  grp = G.inner;
  // ---- inside the bay (only drawn while the cover is off: closed, nothing in it can be seen)
  const open = st.cover < 0.999;
  // the front plate is a lattice: through each cell we see the back of its tile, dark where its patch holds the glass,
  // pale where it has let go (a tile that slides shows the gap it leaves at the top of its cell)
  if (open && vw.facing({u: 1, v: 0, w: 0}, {u: U_PLATE, v: 0, w: 0}) > 0) {
    const cells: React.ReactNode[] = [];
    const inset = 1.3;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const t = tileVW(c, r), i = r * COLS + c;
        const ct = clamp(st.contact[i] ?? 0);
        const sl = Math.max(0, slipOf(i));
        const h = TILE / 2 - inset;
        const cellPts = (v0: number, v1: number) => [{u: U_PLATE + 0.03, v: v0, w: t.w - h}, {u: U_PLATE + 0.03, v: v0, w: t.w + h}, {u: U_PLATE + 0.03, v: v1, w: t.w + h}, {u: U_PLATE + 0.03, v: v1, w: t.w - h}].map((p) => vw.world(p));
        const pth = (pp: Proj[]) => `M${pp.map((p) => P(p)).join(' L')} Z`;
        const back = mix('#BFD3D9', '#24414A', 0.9 * ct);
        cells.push(<path key={`c${i}`} d={pth(cellPts(t.v - h, t.v + h))} fill="#121A1E" />);
        cells.push(<path key={`t${i}`} d={pth(cellPts(t.v - h + Math.min(sl, 2 * h), t.v + h))} fill={back} />);
        // the cell's depth: a shadow along its top and left inner edges
        const a = vw.world({u: U_PLATE + 0.05, v: t.v - h, w: t.w + h}), b = vw.world({u: U_PLATE + 0.05, v: t.v - h, w: t.w - h}), d = vw.world({u: U_PLATE + 0.05, v: t.v + h, w: t.w - h});
        cells.push(<path key={`s${i}`} d={`M${P(a)} L${P(b)} L${P(d)}`} fill="none" stroke="#0E1519" strokeWidth={fmt(ink * 2.2)} opacity={0.55} />);
      }
    items.push({d: -1.1e5, g: grp, node: <g key={key++}>{cells}</g>});
  }
  // the plate's back face: grooves at the tile divisions (each spring sits in its own cell) and the tendon grommets
  if (open) {
    const lines: string[] = [];
    for (let r = 1; r < ROWS; r++) {
      const v = -PH / 2 + RIM + r * (TILE + GAP) - GAP / 2;
      const a = vw.world({u: U_PLATE + 0.05, v, w: -PW / 2 + RW}), b = vw.world({u: U_PLATE + 0.05, v, w: PW / 2 - RW});
      lines.push(`M${P(a)} L${P(b)}`);
    }
    for (let c = 1; c < COLS; c++) {
      const w = -PW / 2 + RIM + c * (TILE + GAP) - GAP / 2;
      const a = vw.world({u: U_PLATE + 0.05, v: -PH / 2 + RW, w}), b = vw.world({u: U_PLATE + 0.05, v: PH / 2 - RW, w});
      lines.push(`M${P(a)} L${P(b)}`);
    }
    if (vw.facing({u: 1, v: 0, w: 0}, {u: U_PLATE, v: 0, w: 0}) > 0)
      items.push({d: -1e5, g: grp, node: <g key={key++}>
        <path d={lines.join(' ')} stroke="#38444D" strokeWidth={fmt(ink * 1.7)} fill="none" opacity={0.9} />
        <path d={lines.join(' ')} stroke="#77858F" strokeWidth={fmt(ink * 0.6)} fill="none" opacity={0.6} transform={`translate(${fmt(ink * 0.9)} ${fmt(ink * 0.9)})`} />
      </g>});
  }
  // Per tile cell: the tendon leaves the plate at the top of the cell and turns down to its spring; the spring hooks
  // onto its row's rail. The rails hang from the spine by clamps, their ends riding in guide slots in the side walls.
  // Under load the spine pulls every rail down, so every spring stretches by the same amount (its share) while the
  // tiles stay put. Where one tile's patch lets go, it slides a little, its spring goes slack, and the rail gives a
  // little round it, so the springs beside it stretch further (they take up its share).
  const REST = 9; // a spring's closed length (mm)
  const base = Math.max(0, travel - 2); // the even stretch
  const FULL = 12;
  const shareOf = (c: number, r: number) => (c < 0 || c >= COLS || r < 0 || r >= ROWS ? 1 : st.share ? st.share[r * COLS + c] ?? 1 : 1);
  const U_SP = 12.4; // the springs' and rails' plane
  for (let r = 0; r < ROWS && open; r++) {
    const t0 = tileVW(0, r);
    const railV = t0.v - 3 + travel;
    // the rail's local give (only in a row where one spring has gone slack; the few per cent every other spring takes
    // on is the spine's own extra travel): the springs pull the rail up toward their tiles, so where one lets go
    // nothing holds the rail up there and it bows down most under the slack spring, pulling its neighbours' hooks
    // down with it: they stretch further and take up its share
    const ex = (c: number) => Math.max(0, shareOf(c, r) - 1.06);
    const sag = (c: number) => base * 0.9 * (shareOf(c, r) < 0.6 ? 1.2 * Math.max(ex(c - 1), ex(c + 1)) : ex(c));
    const hookV = (c: number) => railV + 2 + sag(c);
    const pts: P3[] = [];
    const wL = -PW / 2 + RW + 0.6, wR = PW / 2 - RW - 0.6;
    pts.push({u: U_SP, v: railV, w: wL});
    for (let c = 0; c < COLS; c++) {
      const w = tileVW(c, r).w;
      pts.push({u: U_SP, v: railV + sag(c) * 0.55, w: w - 9}, {u: U_SP, v: railV + sag(c), w}, {u: U_SP, v: railV + sag(c) * 0.55, w: w + 9});
    }
    pts.push({u: U_SP, v: railV, w: wR});
    wire(pts, 3.2, housing(COL.rail), 0.4, {outline: '#2B3338', core: 1});
    // the guide slots in the side walls the rail's ends ride in (fixed to the frame)
    for (const sw of [-1, 1]) {
      const wf = sw * (PW / 2 - RW) - sw * 0.05;
      const sv0 = t0.v - 1 - 3, sv1 = t0.v + 11 + 3;
      if (uTop(sw) > 16) poly([{u: U_SP - 2.6, v: sv0, w: wf}, {u: U_SP + 2.6, v: sv0, w: wf}, {u: U_SP + 2.6, v: sv1, w: wf}, {u: U_SP - 2.6, v: sv1, w: wf}], {u: 0, v: 0, w: -sw}, '#262E33', {stroke: 0.4, bias: 0.3});
    }
    // the clamp where the rail hangs from the spine
    box(U_SP - 2.4, 17.6, railV - 2.2, railV + 2.2, -6.4, 6.4, housing('#7F8B93'), {stroke: 0.7, bias: 0.6});
    for (let c = 0; c < COLS; c++) {
      const t = tileVW(c, r), i = r * COLS + c;
      const share = shareOf(c, r);
      const sl = slipOf(i);
      const stretch = Math.min(18, base * share);
      const hook = hookV(c);
      const top = hook - REST - stretch;
      // tendon: out of the plate at the top of the cell, then down to the spring's top; a tile that slides drags it
      // down, and where the spring has gone slack the tendon hangs loose
      const tab = t.v - 11 + sl;
      const natural = (t.v - 3 + 2 + 2 - REST) - (t.v - 11); // tendon length (its spring's top, at even share)
      const need = top - tab;
      const slackT = Math.max(0, natural - need);
      const tpts: P3[] = [{u: U_PLATE, v: tab, w: t.w}, {u: U_SP - 1.4, v: tab + 0.6, w: t.w}];
      for (let j = 1; j <= 8; j++) {
        const s2 = j / 8;
        tpts.push({u: U_SP + Math.sin(Math.PI * s2) * Math.min(3.5, slackT * 0.9), v: lerp(tab + 1.4, top, s2), w: t.w - Math.sin(Math.PI * s2) * Math.min(2.5, slackT * 0.6)});
      }
      wire(tpts, 1.25, emph > 0 ? mix('#4A545B', '#1C2226', emph) : '#3A444B', -0.5, {outline: '#151B1F', core: 1});
      // the grommet where the tendon passes the plate
      const gq = vw.world({u: U_PLATE + 0.06, v: t.v - 11, w: t.w});
      if (vw.facing({u: 1, v: 0, w: 0}, {u: U_PLATE, v: t.v, w: t.w}) > 0)
        items.push({d: -9e4, g: grp, node: <ellipse key={key++} cx={fmt(gq.x)} cy={fmt(gq.y)} rx={fmt(2.3 * gq.s)} ry={fmt(1.5 * gq.s)} fill="#151B1F" stroke="#8796A0" strokeWidth={fmt(ink * 0.7)} />});
      // the coil: a helix round its axis (reads as a coil from any side); its pitch opens as it stretches
      const turns = 5;
      const n = turns * 12;
      const hp: P3[] = [];
      const R = 3.3;
      const c0 = top + 1.4, c1 = hook - 1.4;
      hp.push({u: U_SP, v: top, w: t.w});
      for (let j = 0; j <= n; j++) {
        const s2 = j / n;
        const a = s2 * turns * Math.PI * 2;
        hp.push({u: U_SP + R * Math.cos(a), v: lerp(c0, c1, s2), w: t.w + R * Math.sin(a)});
      }
      hp.push({u: U_SP, v: hook, w: t.w});
      const tens = clamp(stretch / FULL);
      const hot = emph * clamp(tens * 0.26 + Math.max(0, share - 1.06) * 2.6);
      const cold = emph * clamp(1 - share * 1.3);
      const scol = mix(mix(COL.spring, COL.springHot, hot), '#8E9BA3', cold);
      wire(hp, 1.05, scol, 0, {outline: '#1E252A', core: 1});
    }
  }
  // real separation between the moving layers and the plate: the spine and the rails cast soft shadows on it (they
  // ride a few mm above it; the shadows travel with them)
  if (open && vw.facing({u: 1, v: 0, w: 0}, {u: U_PLATE, v: 0, w: 0}) > 0) {
    const sh: string[] = [];
    const off = {v: 3.2, w: -2.4};
    const a0 = vw.world({u: U_PLATE + 0.1, v: -PH / 2 + RW + 4 + travel + off.v, w: off.w}), a1 = vw.world({u: U_PLATE + 0.1, v: PH / 2 - RW - 3 + travel + off.v, w: off.w});
    sh.push(`M${P(a0)} L${P(a1)}`);
    for (let r = 0; r < ROWS; r++) {
      const rv = tileVW(0, r).v - 3 + travel + off.v;
      const b0 = vw.world({u: U_PLATE + 0.1, v: rv, w: -PW / 2 + RW + 1}), b1 = vw.world({u: U_PLATE + 0.1, v: rv, w: PW / 2 - RW - 1});
      sh.push(`M${P(b0)} L${P(b1)}`);
    }
    items.push({d: -1.05e5, g: grp, node: <g key={key++} opacity={0.32}>
      <path d={sh[0]} stroke="#071014" strokeWidth={fmt(9 * a0.s)} strokeLinecap="round" fill="none" />
      <path d={sh.slice(1).join(' ')} stroke="#071014" strokeWidth={fmt(3.6 * a0.s)} strokeLinecap="round" fill="none" />
    </g>});
  }
  // the spine (the load spreader the rails hang from)
  const spV0 = -PH / 2 + RW + 4 + travel, spV1 = PH / 2 - RW - 3 + travel;
  // (a flat bar in the springs' own layer, narrow, so from an oblique view it sits between two spring columns)
  if (open) box(13.4, 17.4, spV0, spV1, -3.4, 3.4, housing(COL.spine), {stroke: 0.8, bias: 0.3});
  // the post feet on the spine (bosses) and the posts' inner part (hidden by the cover when it is on)
  for (const v of [-46, 46]) {
    if (!open) break;
    box(17.4, 21.4, v + travel - 6, v + travel + 6, -5.4, 5.4, housing('#808D96'), {stroke: 0.7, bias: 0.5});
    rod({u: 19.4, v: v + travel, w: 0}, {u: U_BACK + 2, v: v + travel, w: 0}, 4.6, COL.post, 0.4);
  }
  // the lug: the spine's foot, a plate down through the bottom wall's slot, with the eye for the D-ring
  const eyeV = PH / 2 + 3 + travel;
  if (open) box(12, 22, spV1 - 2, PH / 2 - RW, -3, 3, housing(COL.lug), {stroke: 0.8, bias: 0.4});
  // ---- the rear cover: a plate (2.5 mm) with a raised backplate (4 mm) the posts ride in. The cutaway is a section
  // plane sweeping across it (cover 1 -> 0): what lies beyond the plane is cut away, the cut faces show in the light
  // section tone; nothing fades and nothing slides off the posts.
  grp = G.cover;
  if (st.cover > 0.002) {
    const cd = st.cutDir ?? {v: -0.5, w: 0.866};
    const cl = Math.hypot(cd.v, cd.w) || 1;
    const cn = {v: cd.v / cl, w: cd.w / cl};
    const ext = Math.abs(cn.v) * PH / 2 + Math.abs(cn.w) * PW / 2 + 3;
    const cc = lerp(-ext, ext, clamp(st.cover));
    const cutting = st.cover < 0.998;
    const fCut = (p: P3) => cn.v * p.v + cn.w * p.w - cc;
    const clip = cutting ? fCut : undefined;
    const U = U_BACK;
    const T_COV = 2.5;
    const ci = 2; // the cover sits inside the bevel
    const coverRect = (u: number): P3[] => [{u, v: -PH / 2 + ci, w: -PW / 2 + ci}, {u, v: -PH / 2 + ci, w: PW / 2 - ci}, {u, v: PH / 2 - ci, w: PW / 2 - ci}, {u, v: PH / 2 - ci, w: -PW / 2 + ci}];
    poly(coverRect(U), {u: 1, v: 0, w: 0}, housing(COL.cover), {clip});
    // the raised backplate the handle posts pass through (a second, smaller layer)
    const bi = 16;
    const bp = {v0: -PH / 2 + bi, v1: PH / 2 - bi, w0: -PW / 2 + bi + 8, w1: PW / 2 - bi - 8};
    box(U, U + 4, bp.v0, bp.v1, bp.w0, bp.w1, housing(COL.backplate), {stroke: 0.8, clip, skip: ['u0']});
    // the section faces where the plane cuts the plate and the backplate (light, so the cut reads as a cut)
    if (cutting) {
      const sectionOf = (rect: P3[], u0: number, u1: number, bias: number) => {
        const cutR = clipPoly(rect, fCut);
        const on = cutR.filter((p) => Math.abs(fCut(p)) < 1e-6);
        if (on.length < 2) return;
        const [a, b] = [on[0], on[on.length - 1]];
        poly([{...a, u: u0}, {...b, u: u0}, {...b, u: u1}, {...a, u: u1}], {u: 0, v: cn.v, w: cn.w}, COL.section, {stroke: 0.7, bias});
      };
      sectionOf(coverRect(U), U - T_COV, U, 0.2);
      sectionOf([{u: U + 4, v: bp.v0, w: bp.w0}, {u: U + 4, v: bp.v0, w: bp.w1}, {u: U + 4, v: bp.v1, w: bp.w1}, {u: U + 4, v: bp.v1, w: bp.w0}], U, U + 4, 0.25);
    }
    // the slots and the fasteners sit just in front of their faces (depth tied to the face, so they never sort
    // behind it)
    const dFace = (u: number) => vw.world({u, v: 0, w: 0}).d;
    const nb = vw.facing({u: 1, v: 0, w: 0}, {u: U + 4, v: 0, w: 0});
    if (nb > 0) {
      // the slots the posts ride in (the travel reads against them)
      for (const v of [-46, 46]) {
        const s0 = v - 4, s1 = v + 20;
        let corners: P3[] = [];
        const rr = 5.4;
        for (let j = 0; j <= 8; j++) {
          const a = (j / 8) * Math.PI;
          corners.push({u: U + 4.05, v: s0 + rr - rr * Math.sin(a), w: -rr * Math.cos(a)});
        }
        for (let j = 0; j <= 8; j++) {
          const a = (j / 8) * Math.PI;
          corners.push({u: U + 4.05, v: s1 - rr + rr * Math.sin(a), w: rr * Math.cos(a)});
        }
        if (cutting) corners = clipPoly(corners, fCut);
        if (corners.length < 3) continue;
        const sp = corners.map((p) => vw.world(p));
        items.push({d: dFace(U + 4) + 0.6, g: grp, node: <path key={key++} d={`M${sp.map((p) => P(p)).join(' L')} Z`} fill="#20282D" stroke={INK} strokeWidth={fmt(ink * 0.6)} />});
      }
      const screws: [number, number, number][] = [];
      for (const v of [-PH / 2 + 8, PH / 2 - 8]) for (const w of [-PW / 2 + 8, PW / 2 - 8]) screws.push([U + 0.05, v, w]);
      for (const v of [-PH / 2 + bi + 6, PH / 2 - bi - 6]) for (const w of [-PW / 2 + bi + 14, PW / 2 - bi - 14]) screws.push([U + 4.05, v, w]);
      for (const [u, v, w] of screws) {
        if (cutting && fCut({u, v, w}) > -3) continue;
        const ring = ringArc(vw, {u, v, w}, {u: 1, v: 0, w: 0}, 2.5, 14, true).map((q) => q.p);
        const a1 = vw.world({u, v: v - 1.6, w: w - 1.6}), a2 = vw.world({u, v: v + 1.6, w: w + 1.6});
        items.push({d: dFace(u) + 0.7, g: grp, node: (
          <g key={key++}>
            <path d={`M${ring.map((p) => P(p)).join(' L')} Z`} fill={COL.screw} stroke={INK} strokeWidth={fmt(ink * 0.6)} />
            <path d={`M${P(a1)} L${P(a2)}`} stroke="#3B454C" strokeWidth={fmt(ink * 0.7)} />
          </g>
        )});
      }
    }
  }
  if (!st.bodyOnly) {
  // ---- the handle: the posts' outer part from the cover to the bar, collars where they leave the backplate; the
  // bar with its two brackets (collars clamped round it where the posts meet it) is one node, so the brackets always
  // draw over the bar (and the bar's ends over the brackets where we look at a bracket's outer face)
  grp = G.handle;
  for (const v of [-46, 46]) {
    rod({u: U_BACK + 2, v: v + travel, w: 0}, {u: BAR_U, v: v + travel, w: 0}, 4.6, COL.post);
    cyl({u: U_BACK + 4.4, v: v + travel, w: 0}, {u: U_BACK + 9, v: v + travel, w: 0}, 6.6, '#98A6B0', 0.05);
  }
  const barA = {u: BAR_U, v: -P3D.BAR_H + travel, w: 0}, barB = {u: BAR_U, v: P3D.BAR_H + travel, w: 0};
  const BA = vw.world(barA), BB = vw.world(barB);
  /** a length of the rubber bar between v0 and v1 (its outline, its highlight, the rings that fall in it) */
  const barSeg = (v0: number, v1: number, key: string) => {
    const a = {u: BAR_U, v: v0, w: 0}, b = {u: BAR_U, v: v1, w: 0};
    const out = tubeOutline(vw.world, a, b, P3D.BAR_R, P3D.BAR_R, 24);
    const d = `M${out.map((q) => P(q)).join(' L')} Z`;
    const rings = [-0.42, -0.25, 0.25, 0.42].map((t, i) => {
      const rv = lerp(barA.v, barB.v, 0.5 + t);
      if (rv < Math.min(v0, v1) + 0.5 || rv > Math.max(v0, v1) - 0.5) return null;
      const arc = ringArc(vw, {u: BAR_U, v: rv, w: 0}, {u: 0, v: 1, w: 0}, P3D.BAR_R + 0.1, 24);
      const segs: string[] = [];
      let cur: string[] = [];
      for (const q of arc) {
        if (q.front) cur.push(P(q.p));
        else if (cur.length) {
          segs.push(`M${cur.join(' L')}`);
          cur = [];
        }
      }
      if (cur.length) segs.push(`M${cur.join(' L')}`);
      return <path key={i} d={segs.join(' ')} stroke="#4A555D" strokeWidth={fmt(1.3 * BA.s)} fill="none" />;
    });
    const A = vw.world(a), B = vw.world(b);
    const dx = BB.x - BA.x, dy = BB.y - BA.y, L = Math.hypot(dx, dy) || 1;
    let nx = -dy / L, ny = dx / L;
    if (nx * -0.62 + ny * -0.78 < 0) {
      nx = -nx;
      ny = -ny;
    }
    const r = P3D.BAR_R * (A.s + B.s) / 2;
    const e = Math.abs(v1 - v0) > P3D.BAR_H ? 0.06 : 0.12;
    const ex = B.x - A.x, ey = B.y - A.y;
    return (
      <g key={key}>
        <path d={d} fill={COL.bar} stroke={INK} strokeWidth={fmt(ink * 1.2)} />
        <path d={`M${fmt(A.x + ex * e + nx * r * 0.45)},${fmt(A.y + ey * e + ny * r * 0.45)} L${fmt(B.x - ex * e + nx * r * 0.45)},${fmt(B.y - ey * e + ny * r * 0.45)}`} stroke="#66737C" strokeWidth={fmt(r * 0.28)} strokeLinecap="round" opacity={0.75} />
        {rings}
      </g>
    );
  };
  const barNode = (() => {
    const CH = 5.5; // the collars' half-height
    const collars = [-46, 46].map((v) => cylNode({u: BAR_U, v: v + travel - CH, w: 0}, {u: BAR_U, v: v + travel + CH, w: 0}, P3D.BAR_R + 1.8, '#9AA8B2', `cl${v}`));
    // a bar end over its collar where we look at that collar's outer face (the bar comes out of it toward us)
    const topOut = vw.facing({u: 0, v: -1, w: 0}, {u: BAR_U, v: -46 + travel - CH, w: 0}) > 0;
    const botOut = vw.facing({u: 0, v: 1, w: 0}, {u: BAR_U, v: 46 + travel + CH, w: 0}) > 0;
    return (
      <g>
        {barSeg(barA.v, barB.v, 'bar')}
        {collars}
        {topOut && barSeg(barA.v, -46 + travel - CH, 'bt')}
        {botOut && barSeg(46 + travel + CH, barB.v, 'bb')}
      </g>
    );
  })();
  const g = st.grip ?? (st.hand ? gripOf(st.hand) : 1);
  if (st.hand || st.grip !== undefined) {
    const side = st.handSide ?? 1;
    const arm = st.arm === undefined ? ARM_FOREARM : st.arm;
    // the hand centred between the brackets (about 2.5 mm clear of each)
    items.push({
      d: (BA.d + BB.d) / 2,
      g: grp,
      node: <GripNode key={key++} id={`${id}-hd`} vw={vw} vb={travel + 0.8} g={g} side={side} arm={arm} barNode={st.bar === false ? null : barNode} iw={(4.6 / Math.max(0.3, z)) * k} stripes={st.sleeve !== false} />,
    });
  } else if (st.bar !== false) items.push({d: (BA.d + BB.d) / 2, g: grp, node: <g key={key++}>{barNode}</g>});
  // ---- the lug's outer part, its eye, the D-ring and the strap
  box(12, 22, PH / 2 - RW + 0.2, eyeV + 4.6, -3, 3, housing(COL.lug), {stroke: 0.8});
  for (const sw of [-1, 1]) {
    const e = ringArc(vw, {u: 17, v: eyeV, w: sw * 3.05}, {u: 0, v: 0, w: 1}, 2.9, 16, true).map((q) => q.p);
    if (vw.facing({u: 0, v: 0, w: sw}, {u: 17, v: eyeV, w: sw * 3}) > 0) items.push({d: e[0].d + 0.5, g: grp, node: <path key={key++} d={`M${e.map((p) => P(p)).join(' L')} Z`} fill="#161C20" />});
  }
  // the D-ring: through the eye, hanging in the plane across the pad (v-w); its straight bar at the bottom
  const dPts: P3[] = [];
  const rw = 11, rtop = eyeV - 1.4, rbot = eyeV + 19;
  for (let j = 0; j <= 16; j++) {
    const a = (j / 16) * Math.PI;
    dPts.push({u: 17, v: rtop + rw - rw * Math.sin(a), w: -rw * Math.cos(a)});
  }
  dPts.push({u: 17, v: rbot, w: rw}, {u: 17, v: rbot, w: -rw}, dPts[0]);
  const ringN = dPts.map((p) => vw.world(p));
  const ringNode = (
    <g>
      <path d={`M${ringN.map((p) => P(p)).join(' L')}`} fill="none" stroke={INK} strokeWidth={fmt(3.6 * ringN[0].s + 2 * ink)} strokeLinejoin="round" />
      <path d={`M${ringN.map((p) => P(p)).join(' L')}`} fill="none" stroke={COL.ring} strokeWidth={fmt(3.6 * ringN[0].s)} strokeLinejoin="round" />
      <path d={`M${ringN.slice(2, 9).map((p) => P(p)).join(' L')}`} fill="none" stroke="#F2F6F8" strokeWidth={fmt(1.1 * ringN[0].s)} strokeLinecap="round" opacity={0.8} />
    </g>
  );
  items.push({d: ringN[8].d + 0.6, g: grp, node: <g key={key++}>{ringNode}</g>});
  if ((st.strap ?? 0) > 0) {
    const Ls = st.strap ?? 0;
    const lean = st.strapLean ?? {u: 0.14, w: 0.03};
    const ten = clamp(st.tether ?? 1);
    const a = {u: 17, v: rbot + 1, w: 0};
    const b = {u: a.u + lean.u * Ls, v: a.v + Ls, w: a.w + lean.w * Ls};
    // slack: the strap hangs nearer the wall below the ring and swings out to the foot; taut: one straight line
    const slack = 1 - ten;
    const N = 56;
    const sp: Proj[] = [];
    for (let j = 0; j <= N; j++) {
      const t = Math.pow(j / N, 1.9);
      const p = lerp3(a, b, t);
      // slack: it hangs straight down from the ring before swinging out to the foot (a long sag), with a loose
      // wave in its first half-metre; taut: one straight line along its lean
      const near = clamp((t * Ls) / 600);
      const sag = Math.sin(Math.PI * t) * slack * Ls * 0.05;
      const hang = (1 - Math.pow(1 - near, 2)) * slack * lean.u * Math.min(t * Ls, 600) * 0.9;
      // a loose belly in its first 0.6 m, swinging out to the side and back (it settles as the slack is taken up)
      const wav = Math.sin(Math.PI * near) * slack * 62;
      const bel = Math.sin(Math.PI * near) * slack * 30;
      sp.push(vw.world({u: p.u - sag - hang + bel, v: p.v - bel * 0.3, w: p.w + wav - lean.w * slack * Math.min(t * Ls, 600) * 0.8}));
    }
    // a flat webbing as a ribbon: its width at each point's depth
    const L2: V[] = [], R2: V[] = [], L3: V[] = [], R3: V[] = [];
    for (let j = 0; j <= N; j++) {
      const p = sp[j], q = sp[Math.min(N, j + 1)], o = sp[Math.max(0, j - 1)];
      const tx = q.x - o.x, ty = q.y - o.y, tl = Math.hypot(tx, ty) || 1;
      const hw = 8.5 * p.s, he = 6.9 * p.s;
      L2.push({x: p.x - (ty / tl) * hw, y: p.y + (tx / tl) * hw});
      R2.push({x: p.x + (ty / tl) * hw, y: p.y - (tx / tl) * hw});
      L3.push({x: p.x - (ty / tl) * he, y: p.y + (tx / tl) * he});
      R3.push({x: p.x + (ty / tl) * he, y: p.y - (tx / tl) * he});
    }
    const ribbon = `M${L2.map((q) => P(q)).join(' L')} L${[...R2].reverse().map((q) => P(q)).join(' L')} Z`;
    // flat webbing: its two woven edges as fine lines (no round-hose highlight)
    const edges = `M${L3.map((q) => P(q)).join(' L')} M${R3.map((q) => P(q)).join(' L')}`;
    // the sewn loop round the D-ring's bar: a small box-X bar-tack in a thread close to the webbing's colour
    const st0 = vw.world({u: a.u + 0.6, v: a.v + 10, w: 0}), st1 = vw.world({u: a.u + 1.0, v: a.v + 22, w: 0});
    const hw0 = 4.4 * st0.s;
    const tx = st1.x - st0.x, ty = st1.y - st0.y, tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl, ny = tx / tl;
    const c1 = {x: st0.x + nx * hw0, y: st0.y + ny * hw0}, c2 = {x: st0.x - nx * hw0, y: st0.y - ny * hw0};
    const c3 = {x: st1.x - nx * hw0, y: st1.y - ny * hw0}, c4 = {x: st1.x + nx * hw0, y: st1.y + ny * hw0};
    items.push({
      d: ringN[8].d - 0.5,
      g: grp,
      node: (
        <g key={key++}>
          <path d={ribbon} fill={COL.strap} stroke={INK} strokeWidth={fmt(ink * 1.2)} strokeLinejoin="round" />
          <path d={edges} stroke={shade(COL.strap, 0.2)} strokeWidth={fmt(0.7 * sp[0].s)} fill="none" opacity={0.8} />
          <path d={`M${P(c1)} L${P(c2)} L${P(c3)} L${P(c4)} Z M${P(c1)} L${P(c3)} M${P(c2)} L${P(c4)}`} stroke={shade(COL.strap, 0.32)} strokeWidth={fmt(0.75 * st0.s)} strokeDasharray={`${fmt(1.1 * st0.s)} ${fmt(0.7 * st0.s)}`} fill="none" opacity={0.85} />
        </g>
      ),
    });
  }
  }
  // seen from behind (the handle side) the layers stack from the glass outward; seen through the glass, the reverse
  const back = vw.facing({u: 1, v: 0, w: 0}, {u: U_BACK, v: 0, w: 0}) >= 0;
  items.sort((a, b) => (a.g !== b.g ? (back ? a.g - b.g : b.g - a.g) : a.d - b.d));
  return items.map((it) => it.node);
};

/** the contact shadow on the glass (a crisp core and a narrow penumbra, offset along shadowDir; it grows, softens and
 *  fades as the pad stands off) and the contact line: a continuous dark line on the glass hugging the housing's outline
 *  (the shade under the 3 mm the tiles hold it off the glass), darker as the contact grows. Drawn behind the pad, so
 *  the outer half of the line shows all round its glass edge from any outside view. */
const ContactShadow: React.FC<{id: string; st: Pad3DState; vw: PadView; z: number}> = ({st, vw}) => {
  const k = st.shadow ?? (st.surface === 'none' ? 0 : 1);
  if (k <= 0.001) return null;
  const dir = st.shadowDir ?? {v: 9, w: -5};
  const g = Math.max(0, st.gap);
  const sl = st.slide;
  const spread = 1 + g * 0.06;
  const rect = (hv: number, hw: number, dv: number, dw: number, grow: number) =>
    [
      {u: 0, v: -hv - grow + dv + sl, w: -hw - grow + dw},
      {u: 0, v: -hv - grow + dv + sl, w: hw + grow + dw},
      {u: 0, v: hv + grow + dv + sl, w: hw + grow + dw},
      {u: 0, v: hv + grow + dv + sl, w: -hw - grow + dw},
    ].map((p) => vw.fixed(p));
  const pth = (pp: Proj[]) => `M${pp.map((q) => P(q)).join(' L')} Z`;
  const a = clamp(0.3 + 0.16 * st.load) * Math.exp(-g / 26) * k;
  const ct = st.contact.reduce((s, x) => s + x, 0) / st.contact.length;
  const lineK = clamp(1 - g * 0.5) * k;
  const c0 = vw.fixed({u: 0, v: sl, w: 0});
  return (
    <g>
      <path d={pth(rect(PH / 2, PW / 2, dir.v * spread, dir.w * spread, 2.2 + g * 0.35))} fill="#0B1A20" opacity={a * 0.38} />
      <path d={pth(rect(PH / 2, PW / 2, dir.v * spread, dir.w * spread, 0))} fill="#0B1A20" opacity={a} />
      {lineK > 0.01 && (
        <path d={pth(rect(PH / 2, PW / 2, 0, 0, 0))} fill="#0E1D24" fillOpacity={0.6 * lineK} stroke="#071116" strokeOpacity={lineK * (0.55 + 0.45 * ct)} strokeWidth={fmt((2.6 + 2.6 * ct) * c0.s * (st.contactLine ?? 0.5))} strokeLinejoin="round" />
      )}
    </g>
  );
};

/** the pad: legacy surface (V6, when surface is 'glass' or 'brick'), its reflection (st.reflect), its contact shadow
 *  and the assembly. Drawn in pad mm; place it in a Layer (depth 1) whose cam maps the pad centre to the screen. */
export const Pad3D: React.FC<{id: string; st: Pad3DState; z: number; k?: number}> = ({id, st, z, k = 1}) => {
  const vw = viewOf(st);
  const ink = (1.5 / Math.max(1e-6, z)) * 1.4 * k;
  const nodes = buildItems(id, st, vw, z, k);
  const refl = clamp(st.reflect ?? 0);
  const fromBack = vw.facing({u: 1, v: 0, w: 0}, {u: 0, v: 0, w: 0}, false) > 0;
  // ---- the legacy surface (as V6): glass slab or brick, behind the pad seen from the handle side, in front seen
  // through it (the V8 scenes draw their own world and pass surface 'none')
  const S = 2600;
  const face0 = vw.clipFixed([{u: 0, v: -S, w: -S}, {u: 0, v: -S, w: S}, {u: 0, v: S, w: S}, {u: 0, v: S, w: -S}]) ?? [];
  const slice = vw.clipFixed([{u: -14, v: -S, w: 0}, {u: 0, v: -S, w: 0}, {u: 0, v: S, w: 0}, {u: -14, v: S, w: 0}]) ?? [];
  const sideK = Math.max(0, 1 - Math.abs(vw.dir({u: 1, v: 0, w: 0}, false).z) / 0.35); // how edge-on the pane is
  const pathOf = (pp: Proj[]) => (pp.length >= 3 ? `M${pp.map((p) => P(p)).join(' L')} Z` : '');
  const surfaceNode = (front: boolean) => {
    if (st.surface === 'none') return null;
    if (st.surface === 'glass') {
      return (
        <g opacity={front ? 0.3 : 0.5}>
          <path d={pathOf(face0)} fill={front ? '#BFE6EA' : '#8FC0CB'} />
          {[-900, -300, 500].map((w0, i) => {
            const q = vw.clipFixed([{u: 0, v: -S, w: w0}, {u: 0, v: -S, w: w0 + 160}, {u: 0, v: S, w: w0 + 160 - 1400}, {u: 0, v: S, w: w0 - 1400}]) ?? [];
            return <path key={i} d={pathOf(q)} fill="#FFFFFF" opacity={front ? 0.25 : 0.14} />;
          })}
        </g>
      );
    }
    const blots = Array.from({length: 140}).map((_, i) => {
      const v = -1300 + ((i * 337) % 2600), w = -1300 + ((i * 971) % 2600);
      const q = vw.fixed({u: 0, v, w});
      return <ellipse key={i} cx={fmt(q.x)} cy={fmt(q.y)} rx={fmt((4 + (i % 5) * 3) * q.s)} ry={fmt((3 + (i % 4) * 2.5) * q.s)} fill={i % 3 ? '#7F3B28' : '#C77A5C'} opacity={0.6} />;
    });
    return (
      <g opacity={front ? 0.5 : 1}>
        <path d={pathOf(face0)} fill="#A4573E" />
        {blots}
      </g>
    );
  };
  return (
    <g>
      {st.surface === 'glass' && sideK > 0.01 && slice.length >= 4 && (
        <g opacity={sideK}>
          <path d={pathOf(slice)} fill="#8FD0D3" stroke={INK} strokeWidth={fmt(ink)} />
          <path d={`M${P(slice[1])} L${P(slice[2])}`} stroke="#E8FCFC" strokeWidth={fmt(ink * 1.6)} />
        </g>
      )}
      {fromBack && surfaceNode(false)}
      {fromBack && refl > 0.001 && <PadReflection id={`${id}-rf`} st={st} z={z} k={k} opacity={refl} />}
      {fromBack && <ContactShadow id={id} st={st} vw={vw} z={z} />}
      {nodes}
      {!fromBack && surfaceNode(true)}
    </g>
  );
};

/** the pad seen in the glass: its housing mirrored in the glass plane (u -> -u), faint, meeting the pad at the contact
 *  line; the handle, hand, arm, lug, D-ring and strap are left out (their reflections read as separate objects). Draw
 *  it behind the pad, under the glass's own tint, clipped to the pane. */
export const PadReflection: React.FC<{id: string; st: Pad3DState; z: number; k?: number; opacity: number}> = ({id, st, z, k = 1, opacity}) => {
  const vw = viewOf(st, true);
  const nodes = buildItems(id, {...st, emph: 0, hand: null, grip: undefined, arm: null, bodyOnly: true}, vw, z, k);
  return <g opacity={opacity}>{nodes}</g>;
};
