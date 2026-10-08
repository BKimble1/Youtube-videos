import type {CSSProperties} from 'react';
import layoutJson from '../data/layout.json';
import {E, Ease, tw} from './motion';

/**
 * ONE projection for the whole episode: plan coordinates (metres, from layout.json) to world pixels (1920x1080).
 *
 * Plan axes: x to the right, z = distance from the relay wall toward the camera (wall at z = 0), h = height.
 *
 *  - tilt 0, the ROOM VIEW: a parallel oblique ("dollhouse") projection. The relay wall stands at the back, the floor
 *    recedes upward foreshortened to 0.35, heights are drawn at full scale and there is no perspective scaling. The
 *    receding axis leans to the upper left (shear): near things sit a little to the right of far things, as if the
 *    camera stood front-LEFT and slightly above. That is what lets the right side wall and the sensor-side face of the
 *    partition show. From any front-left camera the opening between the partition's far end and the wall lies BEHIND
 *    the far end, so a wall -> person leg is seen going behind the far end's vertical edge; the light-path rule
 *    (assertAroundTheEnd) keeps it from ever showing across the partition's top. Hide overlay light with
 *    hiddenByPartition / partitionHides (the partition as drawn), or paint it in RoomSet's `backdrop`.
 *  - tilt 1, the PLAN VIEW: straight down, wall at the top, the same scale in x and z (circles stay circles), the room
 *    centred in frame.
 *  - between: the camera's elevation angle phi rises from asin(0.35) to 90 deg, so floor foreshortening = sin(phi)
 *    (0.35 -> 1) and height scale = cos(phi)/cos(phi0) (1 -> 0); the shear fades with the height scale, and the scale
 *    and the anchor glide from the room framing to the plan framing. Every quantity is smooth in tilt; drive tilt over
 *    time with `tiltAt()` (eased), never step it.
 *
 * The map is affine for a given tilt, so straight lines stay straight, planar shapes can be drawn with one SVG matrix
 * (`planeMatrix`) and a screen point can be inverted back onto any horizontal plane (`screenToFloor`).
 */

/* ------------------------------------------------------------------ layout */

export type Layout = {
  note?: string;
  units: string;
  room: {x0: number; x1: number; z0: number; z1: number; wallHeight: number};
  relayWall: {x0: number; x1: number; z: number};
  occluder: {x: number; z0: number; z1: number; thickness: number; height: number};
  sensor: {x: number; z: number; h: number};
  operator: {x: number; z: number};
  hidden: {x: number; z: number; h: number};
  wallSamples: {id: string; x: number}[];
  c_m_per_ns: number;
};

/** The declared geometry (metres). Everything physical is drawn from this. */
export const LAYOUT: Layout = layoutJson as Layout;

/** A point in plan coordinates (metres). `h` defaults to 0 (the floor). */
export type PlanPt = {x: number; z: number; h?: number};
/** A projected point in world px. `depth` grows toward the camera (metres along the view direction). */
export type ScreenPt = {x: number; y: number; depth: number};

/** Named plan points from the layout. Wall samples sit on the relay wall at the sensor's height (2D model). */
export const PTS = {
  S: {x: LAYOUT.sensor.x, z: LAYOUT.sensor.z, h: LAYOUT.sensor.h} as PlanPt,
  H: {x: LAYOUT.hidden.x, z: LAYOUT.hidden.z, h: LAYOUT.hidden.h} as PlanPt,
  operator: {x: LAYOUT.operator.x, z: LAYOUT.operator.z, h: 0} as PlanPt,
  W: Object.fromEntries(LAYOUT.wallSamples.map((w) => [w.id, {x: w.x, z: LAYOUT.relayWall.z, h: LAYOUT.sensor.h} as PlanPt])) as Record<string, PlanPt>,
};

/** Wall thickness (m). In the plan view the ink wall lines are this thick. */
export const WALL_T = 0.07;
/** Floor slab thickness (m) of the dollhouse. */
export const SLAB_T = 0.14;

/* ------------------------------------------------------------------ view */

export type ViewConfig = {
  /** tilt 0: pixels per metre (x and h), floor foreshortening, x-shear (a metre of z toward the camera moves a point
   *  right by ppm * shear px: camera front-left), anchor px */
  room: {ppm: number; floor: number; shear: number; anchor: {x: number; y: number}};
  /** tilt 1: pixels per metre (x and z), anchor px */
  plan: {ppm: number; anchor: {x: number; y: number}};
  /** the plan point that lands on the anchor (the camera orbits around it) */
  pivot: Required<PlanPt>;
};

/**
 * Default framing. Room view: 340 px/m, so the 4.4 m room is 1496 px wide; the receding right wall adds ~320 px, so the
 * dollhouse spans x ~ 50..1890; a 1.7 m person is 578 px tall; the operator's feet land at y ~ 986. The 2.6 m wall
 * top is above the frame at tilt 0 (1080 px cannot hold 2.6 m of wall + 1.3 m of foreshortened floor at this width;
 * the visible wall reaches ~2 m); it comes into view as the camera rises. For the whole dollhouse with headroom use
 * WIDE_VIEW (or frame roomBounds() with the camera). Plan view: 240 px/m, room 1056 x 864 px centred.
 */
export const DEFAULT_VIEW: ViewConfig = {
  room: {ppm: 340, floor: 0.35, shear: 0.26, anchor: {x: 960, y: 545}},
  plan: {ppm: 240, anchor: {x: 960, y: 540}},
  pivot: {x: (LAYOUT.room.x0 + LAYOUT.room.x1) / 2, z: (LAYOUT.room.z0 + LAYOUT.room.z1) / 2, h: 1.0},
};

/**
 * Wide room view: the whole dollhouse (wall tops, floor slab, cut edges) fits in frame with headroom, 4 px outlines
 * kept (rather than zooming the camera out on DEFAULT_VIEW). 243 px/m: room 1069 px wide, a person ~413 px tall.
 * Same plan framing as DEFAULT_VIEW, so a tilt from here also lands on the standard PlanBoard.
 */
export const WIDE_VIEW: ViewConfig = {
  room: {ppm: 243, floor: 0.35, shear: 0.26, anchor: {x: 954, y: 598}},
  plan: DEFAULT_VIEW.plan,
  pivot: DEFAULT_VIEW.pivot,
};

/** Resolved projection parameters for one tilt. */
export type ViewState = {
  tilt: number;
  /** px per metre along x */
  ppm: number;
  /** floor foreshortening: px per metre of z = ppm * floor */
  floor: number;
  /** height scale: px per metre of h = ppm * height */
  height: number;
  /** x-shear: a metre of z (toward the camera) moves the point right by ppm * shear px */
  shear: number;
  ax: number;
  ay: number;
  pivot: Required<PlanPt>;
  /** unit vector (x, z, h) pointing from the scene toward the camera */
  toCam: [number, number, number];
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Hermite smoothstep of v between e0 and e1 (0 below, 1 above). */
export const smoothstep = (e0: number, e1: number, v: number) => {
  const u = clamp01((v - e0) / (e1 - e0));
  return u * u * (3 - 2 * u);
};

/** Projection parameters at a tilt (0 = room view, 1 = plan view). */
export const viewAt = (tilt: number, view: ViewConfig = DEFAULT_VIEW): ViewState => {
  const t = clamp01(tilt);
  const phi0 = Math.asin(view.room.floor);
  const phi = phi0 + (Math.PI / 2 - phi0) * t;
  const floor = t >= 1 ? 1 : Math.sin(phi);
  const height = t >= 1 ? 0 : Math.max(0, Math.cos(phi) / Math.cos(phi0));
  const shear = view.room.shear * height;
  // scale glides geometrically (a uniform zoom feel); the anchor glides with it
  const ppm = view.room.ppm * Math.pow(view.plan.ppm / view.room.ppm, t);
  const ax = lerp(view.room.anchor.x, view.plan.anchor.x, t);
  const ay = lerp(view.room.anchor.y, view.plan.anchor.y, t);
  // null direction of the map (toward the camera): (-shear, 1, floor/height); scaled by `height` so it stays finite
  const d: [number, number, number] = [-shear * height, height, floor];
  const n = Math.hypot(d[0], d[1], d[2]) || 1;
  return {tilt: t, ppm, floor, height, shear, ax, ay, pivot: view.pivot, toCam: [d[0] / n, d[1] / n, d[2] / n]};
};

/** Project with already-resolved parameters (use inside loops). */
export const projectWith = (s: ViewState, p: PlanPt): ScreenPt => {
  const h = p.h ?? 0;
  const dx = p.x - s.pivot.x;
  const dz = p.z - s.pivot.z;
  const dh = h - s.pivot.h;
  return {
    x: s.ax + s.ppm * (dx + s.shear * dz),
    y: s.ay + s.ppm * (s.floor * dz - s.height * dh),
    depth: s.toCam[0] * p.x + s.toCam[1] * p.z + s.toCam[2] * h,
  };
};

/** Plan point -> world px at a tilt (0 room view .. 1 plan view). */
export const project = (p: PlanPt, tilt: number, view: ViewConfig = DEFAULT_VIEW): ScreenPt => projectWith(viewAt(tilt, view), p);

/** A fast projector for one tilt: P(x, z, h = 0) -> [x, y]. */
export const projector = (tilt: number, view: ViewConfig = DEFAULT_VIEW) => {
  const s = viewAt(tilt, view);
  return (x: number, z: number, h = 0): [number, number] => {
    const q = projectWith(s, {x, z, h});
    return [q.x, q.y];
  };
};

/** Eased tilt for a camera move from `start` lasting `dur` frames (0 before, 1 after). */
export const tiltAt = (g: number, start: number, dur: number, ease: Ease = E.inOut) => tw(g, start, dur, ease);

/* ------------------------------------------------------------------ scale helpers */

/** Pixels per metre along x (and z in plan view) at a tilt. */
export const ppmAt = (tilt: number, view: ViewConfig = DEFAULT_VIEW) => viewAt(tilt, view).ppm;

/** Screen displacement (px) per metre along each plan axis at a tilt. */
export const axesAt = (tilt: number, view: ViewConfig = DEFAULT_VIEW) => {
  const s = viewAt(tilt, view);
  return {
    x: {dx: s.ppm, dy: 0},
    z: {dx: s.ppm * s.shear, dy: s.ppm * s.floor},
    h: {dx: 0, dy: -s.ppm * s.height},
  };
};

/** A length in metres measured along x (or any plan direction in the plan view) in px. */
export const mToPx = (m: number, tilt: number, view: ViewConfig = DEFAULT_VIEW) => m * ppmAt(tilt, view);

/* ------------------------------------------------------------------ inverses */

/** World px -> plan point on the horizontal plane at height h (any tilt; the floor by default). */
export const screenToFloor = (sx: number, sy: number, tilt: number, h = 0, view: ViewConfig = DEFAULT_VIEW): Required<PlanPt> => {
  const s = viewAt(tilt, view);
  const A = (sx - s.ax) / s.ppm;
  const B = (sy - s.ay) / s.ppm;
  const dz = (B + s.height * (h - s.pivot.h)) / s.floor;
  const dx = A - s.shear * dz;
  return {x: s.pivot.x + dx, z: s.pivot.z + dz, h};
};

/** Plan-view inverse: world px -> plan point (x, z) at tilt 1. */
export const screenToPlan = (sx: number, sy: number, view: ViewConfig = DEFAULT_VIEW) => {
  const p = screenToFloor(sx, sy, 1, 0, view);
  return {x: p.x, z: p.z};
};

/**
 * World-px bounds of the whole dollhouse at a tilt (walls, floor slab), for framing it with the camera, e.g.
 * frameRect(b.x0, b.y0, b.x1, b.y1) from lib/motion for an establishing shot of the entire room at tilt 0.
 */
export const roomBounds = (tilt: number, view: ViewConfig = DEFAULT_VIEW, layout: Layout = LAYOUT, wallT = WALL_T, slabT = SLAB_T) => {
  const s = viewAt(tilt, view);
  const {x0, x1, z0, z1, wallHeight} = layout.room;
  const xs: number[] = [];
  const ys: number[] = [];
  for (const x of [x0, x1 + wallT]) for (const z of [z0 - wallT, z1]) for (const h of [-slabT, wallHeight]) {
    const q = projectWith(s, {x, z, h});
    xs.push(q.x);
    ys.push(q.y);
  }
  return {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys)};
};

/* ------------------------------------------------------------------ drawing helpers */

type Vec = {x: number; z: number; h?: number};

/**
 * SVG matrix(a b c d e f) that maps local plane coordinates (u, v), in METRES, to world px: the point
 * origin + u * U + v * V. Draw a shape on any plane (a wall, the floor, the partition face) in metres inside
 * <g transform={planeMatrix(...)}>. Note strokes inside are scaled by the matrix: draw outlines as projected paths
 * (`pathOf`) when they must stay 4 px.
 */
export const planeMatrix = (origin: PlanPt, U: Vec, V: Vec, tilt: number, view: ViewConfig = DEFAULT_VIEW) => {
  const s = viewAt(tilt, view);
  const o = projectWith(s, origin);
  const lin = (w: Vec) => ({x: s.ppm * (w.x + s.shear * w.z), y: s.ppm * (s.floor * w.z - s.height * (w.h ?? 0))});
  const a = lin(U);
  const b = lin(V);
  return `matrix(${a.x} ${a.y} ${b.x} ${b.y} ${o.x} ${o.y})`;
};

/** SVG path data through projected plan points (closed by default). */
export const pathOf = (pts: PlanPt[], tilt: number, view: ViewConfig = DEFAULT_VIEW, closed = true) => {
  const s = viewAt(tilt, view);
  return pts.map((p, i) => {
    const q = projectWith(s, p);
    return `${i ? 'L' : 'M'} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`;
  }).join(' ') + (closed ? ' Z' : '');
};

/** Same as pathOf with resolved parameters. */
export const pathWith = (s: ViewState, pts: PlanPt[], closed = true) =>
  pts.map((p, i) => {
    const q = projectWith(s, p);
    return `${i ? 'L' : 'M'} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`;
  }).join(' ') + (closed ? ' Z' : '');

/** Convex hull (monotone chain) of screen points, counter-clockwise. */
export const hull = (pts: {x: number; y: number}[]) => {
  const p = [...pts].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  if (p.length < 3) return p;
  const cross = (o: {x: number; y: number}, a: {x: number; y: number}, b: {x: number; y: number}) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: {x: number; y: number}[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: {x: number; y: number}[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};

/* ------------------------------------------------------------------ boxes, occlusion, depth order */

/** Axis-aligned box in plan coordinates (metres). */
export type Box = {x0: number; x1: number; z0: number; z1: number; h0: number; h1: number};

/** The occluder (partition) as a box. */
export const occluderBox = (layout: Layout = LAYOUT): Box => ({
  x0: layout.occluder.x - layout.occluder.thickness / 2,
  x1: layout.occluder.x + layout.occluder.thickness / 2,
  z0: layout.occluder.z0,
  z1: layout.occluder.z1,
  h0: 0,
  h1: layout.occluder.height,
});

/** Does the ray from p toward the camera pass through the box? (i.e. is p hidden by it on screen) */
export const hiddenByBox = (p: PlanPt, box: Box, tilt: number, view: ViewConfig = DEFAULT_VIEW) => {
  const s = viewAt(tilt, view);
  const o = [p.x, p.z, p.h ?? 0];
  const lo = [box.x0, box.z0, box.h0];
  const hi = [box.x1, box.z1, box.h1];
  let t0 = 1e-6;
  let t1 = Infinity;
  for (let i = 0; i < 3; i++) {
    const d = s.toCam[i];
    if (Math.abs(d) < 1e-9) {
      if (o[i] < lo[i] || o[i] > hi[i]) return false;
      continue;
    }
    let a = (lo[i] - o[i]) / d;
    let b = (hi[i] - o[i]) / d;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return false;
  }
  return true;
};

/** Is a plan point hidden behind the partition from the camera at this tilt? (for splitting light paths) */
export const isHiddenByOccluder = (p: PlanPt, tilt: number, view: ViewConfig = DEFAULT_VIEW, layout: Layout = LAYOUT) =>
  hiddenByBox(p, occluderBox(layout), tilt, view);

/** Screen silhouette (convex polygon) of the partition at a tilt, e.g. for an SVG clipPath/mask. */
export const occluderSilhouette = (tilt: number, view: ViewConfig = DEFAULT_VIEW, layout: Layout = LAYOUT) => {
  const s = viewAt(tilt, view);
  const b = occluderBox(layout);
  const pts: {x: number; y: number}[] = [];
  for (const x of [b.x0, b.x1]) for (const z of [b.z0, b.z1]) for (const h of [b.h0, b.h1]) pts.push(projectWith(s, {x, z, h}));
  return hull(pts);
};

/**
 * A rough body box for an upright thing standing at (x, z): `w` half-width across x, `d` half-depth along z, `height`
 * metres tall. Use with hiddenByBox / VisibleOpts.hidden to hide the stretch of an overlay path that passes behind a
 * person in the room view. (The rig is drawn at its metric height on the set's height scale, rigScale, and fades out
 * over tilt 0.45..0.75, figureMix.)
 */
export const uprightBox = (x: number, z: number, opts: {w?: number; d?: number; height?: number; h?: number} = {}): Box => ({
  x0: x - (opts.w ?? 0.26),
  x1: x + (opts.w ?? 0.26),
  z0: z - (opts.d ?? 0.12),
  z1: z + (opts.d ?? 0.12),
  h0: opts.h ?? 0,
  h1: (opts.h ?? 0) + (opts.height ?? PERSON_M),
});

/** Plan-view test: does the straight segment a -> b cross the partition footprint? (Liang-Barsky in x, z) */
export const crossesOccluder = (a: PlanPt, b: PlanPt, layout: Layout = LAYOUT) => {
  const box = occluderBox(layout);
  let t0 = 0;
  let t1 = 1;
  const d = [b.x - a.x, b.z - a.z];
  const o = [a.x, a.z];
  const lo = [box.x0, box.z0];
  const hi = [box.x1, box.z1];
  for (let i = 0; i < 2; i++) {
    if (Math.abs(d[i]) < 1e-12) {
      if (o[i] < lo[i] || o[i] > hi[i]) return false;
      continue;
    }
    let u = (lo[i] - o[i]) / d[i];
    let v = (hi[i] - o[i]) / d[i];
    if (u > v) [u, v] = [v, u];
    t0 = Math.max(t0, u);
    t1 = Math.min(t1, v);
    if (t0 > t1) return false;
  }
  return true;
};

/** A visibility test for a plan point: true = the camera cannot see it. */
export type HiddenTest = (p: PlanPt) => boolean;

export type VisibleOpts = {
  view?: ViewConfig;
  layout?: Layout;
  /** Extra things that hide points (e.g. a person's box), OR-ed with the partition. */
  hidden?: HiddenTest;
  /** Ignore the partition (only `hidden` counts). */
  noOccluder?: boolean;
  /** Coarse samples per segment before the boundaries are refined (default 48). */
  steps?: number;
};

const lerpPt = (a: PlanPt, b: PlanPt, u: number): PlanPt => ({x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, h: (a.h ?? 0) + ((b.h ?? 0) - (a.h ?? 0)) * u});

/**
 * The parts [u0, u1] (0..1 along a -> b) of a straight 3D segment that the camera sees at this tilt (not behind the
 * partition, not `hidden`). Boundaries are refined by bisection to well under a pixel, so a split light path does not
 * step frame to frame while the camera tilts.
 */
export const visibleSpans = (a: PlanPt, b: PlanPt, tilt: number, opts: VisibleOpts = {}): [number, number][] => {
  const view = opts.view ?? DEFAULT_VIEW;
  const box = occluderBox(opts.layout ?? LAYOUT);
  const hid = (u: number) => {
    const p = lerpPt(a, b, u);
    return (!opts.noOccluder && hiddenByBox(p, box, tilt, view)) || (opts.hidden ? opts.hidden(p) : false);
  };
  const n = Math.max(2, opts.steps ?? 48);
  const edge = (u0: number, u1: number, v0: boolean) => {
    let lo = u0;
    let hi = u1;
    for (let i = 0; i < 18; i++) {
      const m = (lo + hi) / 2;
      if (hid(m) === v0) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  const out: [number, number][] = [];
  let prev = hid(0);
  let start: number | null = prev ? null : 0;
  for (let k = 1; k <= n; k++) {
    const u = k / n;
    const cur = hid(u);
    if (cur !== prev) {
      const e = edge((k - 1) / n, u, prev);
      if (cur) {
        if (start !== null && e > start) out.push([start, e]);
        start = null;
      } else start = e;
    }
    prev = cur;
  }
  if (start !== null && start < 1) out.push([start, 1]);
  return out;
};

/**
 * Visible runs of a 3D polyline (e.g. S -> W -> H) as SVG path data, one string per unbroken run, with the parts the
 * partition (and `opts.hidden`) hides from the camera removed.
 *
 * When to use: for overlays painted ABOVE the set (RoomSet `children`). A light path painted in RoomSet's `backdrop`
 * needs no splitting: the drawn partition and people cover it exactly, also while the partition wobbles (this test
 * uses the partition at rest).
 */
export const visibleRuns = (pts: PlanPt[], tilt: number, opts: VisibleOpts = {}): string[] => {
  const s = viewAt(tilt, opts.view ?? DEFAULT_VIEW);
  const runs: string[] = [];
  let cur: string[] = [];
  let open = false; // is the current run still connected to the end of the previous segment?
  const put = (p: PlanPt) => {
    const q = projectWith(s, p);
    cur.push(`${cur.length ? 'L' : 'M'} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`);
  };
  const flush = () => {
    if (cur.length > 1) runs.push(cur.join(' '));
    cur = [];
  };
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const spans = visibleSpans(a, b, tilt, opts);
    spans.forEach(([u0, u1]) => {
      if (!(open && u0 === 0)) flush();
      put(lerpPt(a, b, u0));
      put(lerpPt(a, b, u1));
    });
    const last = spans[spans.length - 1];
    open = !!last && last[1] === 1;
    if (!open) flush();
  }
  flush();
  return runs;
};

/* ------------------------------------------------------------------ the partition AS DRAWN (light-path legibility) */

/** Drawn partition panel tops (components/v02/Partition imports these): one arch per panel; the panel corners and the
 *  hinges are PARTITION_ARCH lower than the panel middles. The panels stand on stubby feet PARTITION_FOOT_H high. */
export const PARTITION_ARCH = 0.09;
export const PARTITION_FOOT_H = 0.07;

/** Height (m) of the drawn partition's top at plan z (clamped to its length). */
export const partitionTopH = (z: number, layout: Layout = LAYOUT) => {
  const o = layout.occluder;
  const Lp = (o.z1 - o.z0) / 3;
  const v = (Math.max(o.z0, Math.min(o.z1, z)) - o.z0) / Lp;
  const u = clamp01(v - Math.floor(Math.min(2.9999, v)));
  return o.height - PARTITION_ARCH * (1 - Math.sin(Math.PI * u));
};

export type PartitionTestOpts = {
  layout?: Layout;
  /** world px of ink outline counted as partition (default 3: half the 4-5 px outline plus 1 px of antialiasing) */
  padPx?: number;
};

/** The camera ray through p meets the partition's centre plane (x = occluder.x) at (z, h). */
const onPartitionPlane = (p: PlanPt, s: ViewState, layout: Layout) => {
  const t = (layout.occluder.x - p.x) / s.toCam[0];
  return {z: p.z + s.toCam[1] * t, h: (p.h ?? 0) + s.toCam[2] * t, t};
};

/**
 * Is p hidden from the camera by the partition AS DRAWN: both long faces, the arched top band between them, the end
 * faces, plus `padPx` of ink outline? This is THE test for light drawn over the set (LightPath / ScatterFan / dot
 * `hidden`): the box test (isHiddenByOccluder) ignores the arches (up to 9 cm too high), and the scenes' old
 * face-polygon tests ignored the top band, so light was painted on the screen's rim. The partition at rest (no wobble);
 * pass a moved layout for S9's push. Points on the camera's side of the partition are never hidden by it.
 */
export const hiddenByPartition = (p: PlanPt, s: ViewState, opts: PartitionTestOpts = {}) => {
  const L = opts.layout ?? LAYOUT;
  const o = L.occluder;
  const pad = opts.padPx ?? 3;
  const [dx, dz, dh] = s.toCam;
  if (dx > -1e-9) return false; // the room's cameras always stand front-left (toCam.x < 0)
  const x0 = o.x - o.thickness / 2 - pad / s.ppm;
  const x1 = o.x + o.thickness / 2 + pad / s.ppm;
  if (p.x <= x0) return false;
  const padH = pad / (s.ppm * Math.max(s.height, 1e-3));
  const padZ = pad / (s.ppm * Math.max(s.shear, 1e-3));
  const h = p.h ?? 0;
  const tA = Math.max(0, (x1 - p.x) / dx);
  const tB = (x0 - p.x) / dx;
  for (let i = 0; i <= 6; i++) {
    const t = tA + ((tB - tA) * i) / 6;
    const z = p.z + dz * t;
    const hh = h + dh * t;
    if (z >= o.z0 - padZ && z <= o.z1 + padZ && hh >= PARTITION_FOOT_H - padH && hh <= partitionTopH(z, L) + padH) return true;
  }
  return false;
};

/** A HiddenTest at the light-path plane for LightPath / ScatterFan (plan points in, `h` added). */
export const partitionHides = (s: ViewState, h: number, opts: PartitionTestOpts = {}): HiddenTest => (p) => hiddenByPartition({x: p.x, z: p.z, h: p.h ?? h}, s, opts);

export type PartitionEdge = 'far' | 'near' | 'top';
/** One place where a segment goes behind ('in') or comes out from behind ('out') the drawn partition, on screen. */
export type PartitionCrossing = {u: number; dir: 'in' | 'out'; edge: PartitionEdge; belowCornerPx: number};
export type PartitionReport = {
  /** visible parts [u0, u1] of a -> b */
  spans: [number, number][];
  crossings: PartitionCrossing[];
  /** screen px (at `zoom`) of visible segment that lies on or above the partition's top edge between its two ends,
   *  on the far side of it: what reads as "over the top" (must be 0 for a light leg) */
  overPx: number;
  /** min screen px (at `zoom`) between the visible segment and the partition's silhouette where the segment is on the
   *  camera's side of it (S -> W legs); Infinity if it never comes near; negative if it is drawn across the screen */
  frontClearPx: number;
};

/**
 * How a straight 3D segment a -> b meets the drawn partition at a view: its visible spans, and for every place it goes
 * behind or comes out from behind the partition, by which silhouette edge ('far' = the far end's vertical edge, by the
 * wall; 'near' = the near end's vertical edge; 'top' = across the arched top band) and how far below that end's top
 * corner (screen px at `zoom`; negative = above the corner, which is a 'top' crossing). Use assertAroundTheEnd.
 */
export const partitionCrossings = (a: PlanPt, b: PlanPt, s: ViewState, opts: PartitionTestOpts & {zoom?: number; steps?: number} = {}): PartitionReport => {
  const L = opts.layout ?? LAYOUT;
  const o = L.occluder;
  const zoom = opts.zoom ?? 1;
  const n = Math.max(8, opts.steps ?? 400);
  const pxPerH = s.ppm * s.height * zoom;
  const pxPerZ = s.ppm * Math.max(s.shear, 1e-3) * zoom;
  const at = (u: number) => lerpPt(a, b, u);
  const hid = (u: number) => hiddenByPartition(at(u), s, opts);
  const spans: [number, number][] = [];
  const crossings: PartitionCrossing[] = [];
  let overPx = 0;
  let frontClearPx = Infinity;
  const segPx = Math.hypot(projectWith(s, b).x - projectWith(s, a).x, projectWith(s, b).y - projectWith(s, a).y) * zoom / n;
  let prev = hid(0);
  let start: number | null = prev ? null : 0;
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    const cur = hid(u);
    if (k > 0 && cur !== prev) {
      let lo = (k - 1) / n;
      let hi = u;
      for (let i = 0; i < 20; i++) {
        const m = (lo + hi) / 2;
        if (hid(m) === prev) lo = m;
        else hi = m;
      }
      const ue = (lo + hi) / 2;
      const q = onPartitionPlane(at(ue), s, L);
      const top = partitionTopH(q.z, L);
      const far = q.z < (o.z0 + o.z1) / 2;
      const corner = partitionTopH(far ? o.z0 : o.z1, L);
      const edge: PartitionEdge = q.h >= top - 0.03 ? 'top' : far ? 'far' : 'near';
      crossings.push({u: ue, dir: cur ? 'in' : 'out', edge, belowCornerPx: (corner - q.h) * pxPerH});
      if (cur) {
        if (start !== null && ue > start) spans.push([start, ue]);
        start = null;
      } else start = ue;
    }
    prev = cur;
    if (!cur) {
      const p = at(u);
      const q = onPartitionPlane(p, s, L);
      const inStrip = q.z >= o.z0 && q.z <= o.z1;
      const above = q.h - partitionTopH(q.z, L);
      if (p.x > o.x + o.thickness / 2 && inStrip && above >= 0) overPx += segPx;
      if (p.x < o.x - o.thickness / 2) {
        // distance on screen to the silhouette, from the far side: past an end (z) or above the top (h)
        const dzOut = q.z < o.z0 ? (o.z0 - q.z) * pxPerZ : q.z > o.z1 ? (q.z - o.z1) * pxPerZ : 0;
        const dhOut = Math.max(0, above) * pxPerH;
        const d = Math.hypot(dzOut, dhOut);
        frontClearPx = Math.min(frontClearPx, d > 0 ? d : -1);
      }
    }
  }
  if (start !== null && start < 1) spans.push([start, 1]);
  return {spans, crossings, overPx, frontClearPx};
};

/**
 * The light-path rule for the room view (STORYBOARD continuity rules): every leg goes round the partition's END, never
 * over it. For each segment of each polyline: wherever it goes behind or comes out from behind the drawn partition it
 * does so by the far or near end's vertical edge at least `minBelowCornerPx` (screen px at `zoom`) below that end's top
 * corner, never across the top band; no visible part on the far side lies above the top edge between the ends; legs on
 * the camera's side stay `minFrontClearPx` clear of the silhouette (unless `allowFront`, e.g. the blocked ghost line).
 * Throws with a per-leg report. Run it at module load for every tilt the shot draws light at (e.g. [0, RAISED_TILT]).
 */
export const assertAroundTheEnd = (
  label: string,
  polylines: PlanPt[][],
  s: ViewState,
  opts: PartitionTestOpts & {zoom: number; minBelowCornerPx?: number; minFrontClearPx?: number; allowFront?: boolean},
) => {
  const minC = opts.minBelowCornerPx ?? 24;
  const minF = opts.minFrontClearPx ?? 18;
  const bad: string[] = [];
  polylines.forEach((pl, j) =>
    pl.slice(0, -1).forEach((a, i) => {
      const r = partitionCrossings(a, pl[i + 1], s, opts);
      const tag = `${label} path ${j} leg ${i} @tilt ${s.tilt.toFixed(3)}`;
      for (const c of r.crossings) if (c.edge === 'top' || c.belowCornerPx < minC) bad.push(`${tag}: goes ${c.dir} across the ${c.edge} (${c.belowCornerPx.toFixed(0)} px below the corner, needs ${minC})`);
      if (r.overPx > 0.5) bad.push(`${tag}: ${r.overPx.toFixed(0)} px drawn over the partition's top`);
      // a leg that comes out from behind the far end runs beside it by construction: only legs that never go behind the
      // partition (S -> W) must keep clear of it
      if (!opts.allowFront && r.crossings.length === 0 && r.frontClearPx < minF) bad.push(`${tag}: ${r.frontClearPx.toFixed(0)} px from the partition on the camera side (needs ${minF})`);
    }),
  );
  if (bad.length) throw new Error(`assertAroundTheEnd: ${bad.join('; ')}`);
};

/**
 * Something to depth-sort. A point item is an upright thing standing at (x, z) (a figure, a plant, a prop): `w` is
 * its half-width and `height` its height in metres (used to test occlusion against boxes). A box item (`box`) is an
 * extended solid like the partition. Missing x defaults to the room centre.
 */
export type DepthItem = {z: number; x?: number; h?: number; w?: number; height?: number; box?: Box};

const baseDepth = (s: ViewState, it: DepthItem, view: ViewConfig) => {
  if (it.box) {
    const b = it.box;
    return projectWith(s, {x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2, h: 0}).depth;
  }
  return projectWith(s, {x: it.x ?? view.pivot.x, z: it.z, h: it.h ?? 0}).depth;
};

type Rect = {x0: number; y0: number; x1: number; y1: number};
const overlaps = (a: Rect, b: Rect) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** Screen bounding rectangle of an item (an upright billboard, or the projected box). */
const screenRect = (s: ViewState, it: DepthItem, view: ViewConfig): Rect => {
  if (it.box) {
    const b = it.box;
    const xs: number[] = [];
    const ys: number[] = [];
    for (const x of [b.x0, b.x1]) for (const z of [b.z0, b.z1]) for (const h of [b.h0, b.h1]) {
      const q = projectWith(s, {x, z, h});
      xs.push(q.x);
      ys.push(q.y);
    }
    return {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys)};
  }
  const q = projectWith(s, {x: it.x ?? view.pivot.x, z: it.z, h: it.h ?? 0});
  // upright things are uniform-scaled billboards on the set's height scale (rigScale) while visible (figureMix); in the
  // plan they are discs (~w)
  const upright = s.tilt < 0.75;
  const w = (it.w ?? 0.3) * s.ppm * (upright ? Math.max(s.height, 0.3) : 1);
  const up = upright ? (it.height ?? PERSON_M) * s.ppm * s.height : w;
  return {x0: q.x - w, x1: q.x + w, y0: q.y - up, y1: q.y + w * Math.max(0.35, s.floor)};
};

/** Is point item `p` (partly) hidden behind box `box`? Sample points inside the box itself are ignored. */
const pointBehindBox = (s: ViewState, p: DepthItem, box: Box, tilt: number, view: ViewConfig) => {
  const x = p.x ?? view.pivot.x;
  const w = p.w ?? 0.3;
  const ht = p.height ?? PERSON_M;
  const h0 = p.h ?? 0;
  for (const dx of [-w, -w / 2, 0, w / 2, w]) {
    for (const fh of [0.05, 0.5, 0.95]) {
      const q = {x: x + dx, z: p.z, h: h0 + fh * ht};
      const inside = q.x >= box.x0 && q.x <= box.x1 && q.z >= box.z0 && q.z <= box.z1 && q.h >= box.h0 && q.h <= box.h1;
      if (!inside && hiddenByBox(q, box, tilt, view)) return true;
    }
  }
  return false;
};

/**
 * Sort items far -> near for painting at this tilt. Only items whose screen rectangles overlap constrain each other:
 * two upright items order by depth along the view direction (nearer the camera = later; at equal z the one further
 * LEFT in the room view is nearer); an upright item is painted before a box (the partition) if any part of it is
 * hidden behind the box from the camera, after it otherwise. Unconstrained items keep depth order; ties keep input
 * order. Deterministic.
 */
export const depthSort = <T extends DepthItem>(items: T[], tilt: number, view: ViewConfig = DEFAULT_VIEW): T[] => {
  const s = viewAt(tilt, view);
  const key = items.map((it) => baseDepth(s, it, view));
  const rect = items.map((it) => screenRect(s, it, view));
  // before(i, j): i must be painted before j
  const before = (i: number, j: number): boolean => {
    if (!overlaps(rect[i], rect[j])) return false;
    const a = items[i];
    const b = items[j];
    if (a.box && !b.box) return !pointBehindBox(s, b, a.box, tilt, view);
    if (!a.box && b.box) return pointBehindBox(s, a, b.box, tilt, view);
    return key[i] < key[j] - 1e-9 || (Math.abs(key[i] - key[j]) <= 1e-9 && i < j);
  };
  const order = items.map((_, i) => i).sort((p, q) => key[p] - key[q] || p - q);
  const out: T[] = [];
  const left = new Set(order);
  while (left.size) {
    let pick = order.find((i) => left.has(i) && ![...left].some((j) => j !== i && before(j, i)));
    if (pick === undefined) pick = order.find((i) => left.has(i)) as number; // cycle: fall back to depth
    out.push(items[pick]);
    left.delete(pick);
  }
  return out;
};

/** Depth of a plan point along the view direction (bigger = nearer the camera). */
export const depthOf = (p: PlanPt, tilt: number, view: ViewConfig = DEFAULT_VIEW) => project(p, tilt, view).depth;

/* ------------------------------------------------------------------ characters: upright rig <-> overhead token */

/** The frontal rig (components/Character) is ~440 px from soles to hair top at scale 1. */
export const RIG_PX = 440;
/** Default standing height of a person in metres. */
export const PERSON_M = 1.7;

/**
 * Rig scale for an upright billboard (person, plant) `heightM` metres tall at a resolved view: it follows the SET's
 * height scale (px per metre of h = ppm * height), uniformly (never squashed), so a 1.7 m person stands exactly as tall
 * as 1.7 m of wall or partition at every tilt. 1.31 at tilt 0 (unchanged room view), 1.20 at RAISED_TILT 0.10, 0.66
 * where figureMix starts fading the rig (tilt 0.45).
 */
export const rigScale = (s: ViewState, heightM = PERSON_M) => (heightM * s.ppm * s.height) / RIG_PX;

/**
 * Where to draw a frontal rig standing at (x, z): feet at the projected floor point, scale rigScale (a person of
 * `heightM` metres is exactly that tall against the set at this tilt). Pass {x, y, scale} straight to
 * <Character>/<Character2>; use `figureMix`/`rigStyle` to fade it into the token.
 *
 * Staging note: the rig is a chibi (big head). At 1.7 m its shoulders are at ~1.13 m, its chin at ~1.21 m and its chest
 * at ~0.95 m, the light-path plane (layout sensor.h / hidden.h): a prop or a light point at that height sits on the
 * chest at every tilt (rig and set share one height scale). Horizontal reaches in rig units change with the tilt (x is
 * not foreshortened), so place hands with reach/reach2 on the projected point every frame (see dev/KitRoom).
 */
export const rigAt = (x: number, z: number, tilt: number, opts: {heightM?: number; view?: ViewConfig} = {}) => {
  const s = viewAt(tilt, opts.view ?? DEFAULT_VIEW);
  const q = projectWith(s, {x, z, h: 0});
  return {x: q.x, y: q.y, scale: rigScale(s, opts.heightM ?? PERSON_M), depth: q.depth};
};

/**
 * How much of the upright rig vs the overhead token to show at a tilt. The rig fades out over tilt 0.45..0.75 with a
 * mild settle (shrinks to 94 % wide, 84 % tall, anchored at the feet: it reads as "sinking into the plan", never as a
 * squash, because it is mostly transparent by then); the token fades in over 0.5..0.8 and grows from 70 % to 100 %.
 */
export const figureMix = (tilt: number) => {
  const out = smoothstep(0.45, 0.75, tilt);
  const inn = smoothstep(0.5, 0.8, tilt);
  return {
    rig: 1 - out,
    token: inn,
    rigScaleX: 1 - 0.06 * out,
    rigScaleY: 1 - 0.16 * out,
    tokenScale: 0.7 + 0.3 * inn,
  };
};

/** CSS for <Character style={...}> at a tilt: opacity plus the feet-anchored settle from figureMix. */
export const rigStyle = (tilt: number, scale: number): CSSProperties => {
  const m = figureMix(tilt);
  return {
    opacity: m.rig,
    transform: m.rig < 1 ? `scale(${m.rigScaleX}, ${m.rigScaleY})` : undefined,
    transformOrigin: `${200 * scale}px ${500 * scale}px`,
    visibility: m.rig <= 0.001 ? 'hidden' : undefined,
  };
};

/** Token height (m) used to place an overhead token during the tilt: the rig's chest (the light-path plane, 0.95 m), so
 *  it appears inside the fading rig. */
export const TOKEN_H = LAYOUT.sensor.h;
/** Default token radius (m): a person seen from above, shoulders included. */
export const TOKEN_R = 0.26;

/**
 * Where to draw a character's overhead token at a tilt: centre (px), radius (px) and the fade/scale from figureMix.
 * During the tilt the centre sits at chest height over (x, z), so it fades in inside the upright rig; at tilt 1 it is
 * exactly over the floor point.
 */
export const tokenAt = (x: number, z: number, tilt: number, opts: {radiusM?: number; h?: number; view?: ViewConfig} = {}) => {
  const s = viewAt(tilt, opts.view ?? DEFAULT_VIEW);
  const q = projectWith(s, {x, z, h: opts.h ?? TOKEN_H});
  const m = figureMix(tilt);
  return {x: q.x, y: q.y, r: (opts.radiusM ?? TOKEN_R) * s.ppm, opacity: m.token, scale: m.tokenScale, depth: q.depth};
};
