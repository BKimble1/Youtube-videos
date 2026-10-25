// Glass Climbing: the test bay's world geometry.
// World units are the Crew rig's own units at s = 1 (a standing figure is about 1080 tall, so 1 cm ~ 6.2 units).
// The bay is staged side-on, as a section: the glass wall's face is the plane x = 0 with the climber on its +x side,
// facing it (screen-left). The wall itself is drawn as a slab in section (art/Bay.tsx). Depth z points toward the camera;
// a mild oblique projection opens the pads' plates into narrow parallelograms, so they read as plates (2.5D) and the
// near and far pads separate: screen = (x + KX z, y + KY z).
// y points down; the floor is y = 0.
import {add, mul, sub, V} from '../dc/math';

export const KX = -0.24;
export const KY = 0.04;
export type P3 = {x: number; y: number; z: number};
export const pr = (p: P3): V => ({x: p.x + KX * p.z, y: p.y + KY * p.z});
export const p3 = (x: number, y: number, z: number): P3 => ({x, y, z});

export const FLOOR = 0;
/** cm -> world units */
export const CM = 6.2;

/** The adhesive pad (Hawkes et al. 2015: about 140 cm^2 of adhesive per hand on 24 postage-stamp-sized tiles): a
 *  4 x 6 grid of 2.5 cm tiles on a 14 x 20 cm plate. */
export const PAD = {
  w: 14 * CM, // along z (across the glass)
  h: 20 * CM, // along y
  t: 2.4 * CM, // plate thickness (x)
  tile: 0.9 * CM, // adhesive tile layer
  cols: 4,
  rows: 6,
  /** handle: two posts from the back plate, a vertical grip bar */
  post: 7.2 * CM,
  postY: 7.4 * CM,
  barR: 1.35 * CM,
};
/** depth of each pad's centre line (near = his left side = toward the camera) */
export const Z_NEAR = 18 * CM;
export const Z_FAR = -18 * CM;

/** a pad placed on the glass: centre height y, depth z, gap (x stand-off from the glass while released), tilt (deg,
 *  rotation in the x-y plane about the pad's top edge while peeling) */
export type PadState = {y: number; z: number; gap: number; tilt: number; load: number; obl?: number};
/** under load the plate (and its handle) shears down a hair against the tile layer that is gripping the glass (the
 *  wedges bending); drawn at 4 units so it reads in the close-ups */
export const SHEAR = 4;

/** a point in pad-local coordinates (u across the face along x from the glass, v along y from the centre) */
export const padPt = (s: PadState, u: number, v: number, dz = 0): P3 => {
  // tilt about the top edge (v = -h/2), at the glass face
  const a = (s.tilt * Math.PI) / 180;
  const v0 = -PAD.h / 2;
  const du = u, dv = v - v0;
  const x = s.gap + du * Math.cos(a) + dv * Math.sin(a);
  const y = s.y + v0 + -du * Math.sin(a) + dv * Math.cos(a) + (u > PAD.tile * 0.5 ? SHEAR * s.load : 0);
  return {x, y, z: dz * (s.obl ?? 1)};
};
/** pads are drawn with the oblique growing from nothing at the glass face to full at the back plate, so the contact
 *  face stays on the glass section line while the plate, posts and bar open into a three-quarter view */
export const prPad = (p: P3): V => {
  const k = Math.min(1, Math.max(0, p.x / (PAD.tile + PAD.t)));
  return {x: p.x + KX * p.z * k, y: p.y + KY * p.z * k};
};
export const gripOf = (s: PadState): P3 => padPt(s, PAD.tile + PAD.t + PAD.post, 0);
/** the D-ring at the bottom edge of the plate, where the foot strap hangs */
export const ringOf = (s: PadState): P3 => padPt(s, PAD.tile + PAD.t * 0.55, PAD.h / 2 + 1.6 * CM);

export const STRAP_LEN = 100 * CM; // ring to the stirrup's foot bar

export const lerp3 = (a: P3, b: P3, t: number): P3 => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t});
export const len3 = (a: P3, b: P3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const vsub = sub;
export const vadd = add;
export const vmul = mul;
