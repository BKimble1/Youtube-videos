import React from 'react';
import {interpolateColors} from 'remotion';
import {C, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';
import {BOT, BOT_UNITS_PER_M} from './DeliveryBot';

/**
 * WarehouseSet: the act-5 illustrative application. A warehouse corner seen as a cut-away diorama, drawn from one
 * declared plan geometry (WAREHOUSE, metres) through a small local projection (same idea as lib/room, kept separate
 * on purpose so the two sets can be tuned independently).
 *
 * Plan axes (same convention as the room): x to the right, z = distance from the back wall toward the camera (back
 * wall at z = 0), h = height above the floor.
 *
 *          z = 0  ================= back wall ============[door]========|
 *                 |  S0 (back run)                    |S2|: aisle B    |S3|
 *                 |                                   |  |: (person    |__|  right wall x = 6.0
 *                 |==== S1 (front run) ====================|   comes +z)     |
 *                 |                                       C                 |  <- relay section: plain,
 *                 |   aisle A  (robot drives +x)  -->  |stop|   junction     |     light, matte wall
 *                 |                                                         |     across the junction
 *
 *  - S1 (along x) and S2 (along z) are the two shelving runs that meet at the L corner. Their outer vertex C is the
 *    blind corner: a robot driving along aisle A cannot see a person coming down aisle B (the straight line between
 *    them crosses S1/S2).
 *  - The right wall (x = 6.0) in front of S3 is a plain light matte wall across the junction: it closes aisle A and is
 *    visible from aisle A and from aisle B. That is the relay surface (`WAREHOUSE.relaySection`).
 *  - S0 is a taller run against the back wall (depth above S1 in the front view); S3 is a short run on the far side
 *    of aisle B, so B reads as an aisle; it stops short of the junction, leaving the relay section in view.
 *  - Racking is 2.5 m (S0 2.9 m), taller than a person. People in aisle B walk its marked walkway (`walkway`, lane
 *    x = 4.5). In the front view the corner of the L overlaps a person there: far down the aisle they are mostly
 *    behind it, and they come out from behind the corner as they approach the junction (still unseen by the robot).
 *
 * tilt 0 = front view: an oblique view from the front, a little above and to the LEFT (near things sit right of far
 * things), like the room. We see shelf fronts (+z faces), the left faces (-x) of things, and the inner face of the
 * relay wall. tilt 1 = plan view: straight down, the same scale in x and z, walls as ink lines, shelving as blocks.
 * Every quantity is smooth in tilt, so the tilt can be animated (ease it, never step it).
 *
 * Rendering: one world-px stage (1920x1080, overflow visible). Put it inside a camera <Layer> if the shot moves.
 * Slots: `backdrop` is painted on the shell (floor and walls) before anything standing; `items` are standing things
 * (robot, people, carts) interleaved with the shelving by occlusion; `children` are overlays on top.
 */

/* ------------------------------------------------------------------ geometry (plan, metres) */

/** A point in plan coordinates (metres). */
export type WhPt = {x: number; z: number; h?: number};
/** Axis-aligned solid (metres). */
export type WhBox = {x0: number; x1: number; z0: number; z1: number; h0: number; h1: number};
/** Axis-aligned floor rectangle (metres). */
export type WhRect = {x0: number; x1: number; z0: number; z1: number};

const WALL_T = 0.12;

/**
 * The declared warehouse geometry (metres). Everything in the set, and every optical path drawn over it, comes from
 * here. Checked facts (see `whCheck()`): from the robot's stop pose no part of a person on the lane with z <= 2.0 is visible;
 * both see every point of `relaySection`.
 */
export const WAREHOUSE = {
  units: 'm' as const,
  wallT: WALL_T,
  /** floor slab (extends well past the frame on the left and the front) */
  floor: {x0: -5, x1: 6.0, z0: 0, z1: 8} as WhRect,
  backWall: {z: 0, x0: -5, x1: 6.0, height: 3.4},
  /** the right wall; its inner face is the plane x = 6.0. In front of S3 it is plain, light and matte */
  relayWall: {x: 6.0, z0: 0, z1: 8, height: 3.4},
  /** the plain wall section across the junction (closes aisle A, seen by both aisles): the relay surface */
  relaySection: {x: 6.0, z0: 2.3, z1: 4.6},
  /** swing doors in the back wall at the end of aisle B (where the person comes from) */
  door: {x0: 4.2, x1: 5.2, height: 2.15},
  /**
   * The shelving: S1 (along x) and S2 (along z) meet at the L corner; S0 stands against the back wall behind S1;
   * S3 is a short run on the far side of aisle B (so B reads as an aisle), stopping well short of the junction.
   */
  shelves: {
    S0: {x0: -5, x1: 3.1, z0: 0.0, z1: 0.8, h0: 0, h1: 2.9} as WhBox,
    S1: {x0: -5, x1: 3.9, z0: 2.2, z1: 3.0, h0: 0, h1: 2.5} as WhBox,
    S2: {x0: 3.1, x1: 3.9, z0: 0.0, z1: 2.2, h0: 0, h1: 2.5} as WhBox,
    S3: {x0: 5.5, x1: 6.0, z0: 0.0, z1: 1.6, h0: 0, h1: 2.5} as WhBox,
  },
  /** the blind corner: the outer vertex of the L (S1's front-right edge) */
  corner: {x: 3.9, z: 3.0},
  /** saffron corner guard post wrapped round the corner */
  cornerGuard: {x0: 3.84, x1: 4.0, z0: 2.94, z1: 3.1, h0: 0, h1: 0.45} as WhBox,
  /** the robot's aisle (along x) and its lane centre line */
  aisleA: {x0: -5, x1: 6.0, z0: 3.0, z1: 4.6} as WhRect,
  robotLaneZ: 3.8,
  /** the person's aisle (along z) and its marked pedestrian walkway; people walk its centre line */
  aisleB: {x0: 3.9, x1: 5.5, z0: 0, z1: 3.0} as WhRect,
  walkway: {x0: 4.12, x1: 4.88},
  personLaneX: 4.5,
  /** where aisle A meets aisle B */
  junction: {x0: 3.9, x1: 6.0, z0: 3.0, z1: 4.6} as WhRect,
  /** painted stop bar across aisle A, short of the corner */
  stopBar: {x0: 2.98, x1: 3.16},
  /** robot footprint centre when it waits at the stop bar (front edge ~0.2 m short of the bar) */
  robotStop: {x: 2.5, z: 3.8},
  /** robot sensor (emitter window) height above the floor (from the rig) */
  sensorH: BOT.sensorH,
  /** sample points on the relay section (wall face x = relaySection.x), for optics */
  relaySamples: [
    {id: 'R1', z: 2.6},
    {id: 'R2', z: 3.1},
    {id: 'R3', z: 3.6},
    {id: 'R4', z: 4.1},
  ],
};

/** Shelving footprints that block sight lines, in paint order (far to near in the front view). */
export const WH_BLOCKERS: {id: 'S0' | 'S3' | 'S2' | 'S1'; box: WhBox}[] = [
  {id: 'S0', box: WAREHOUSE.shelves.S0},
  {id: 'S3', box: WAREHOUSE.shelves.S3},
  {id: 'S2', box: WAREHOUSE.shelves.S2},
  {id: 'S1', box: WAREHOUSE.shelves.S1},
];

/** Plan test: does the straight segment a -> b cross any shelving footprint (Liang-Barsky in x, z)? */
export const whSightBlocked = (a: WhPt, b: WhPt, boxes: WhBox[] = WH_BLOCKERS.map((q) => q.box)) =>
  boxes.some((box) => {
    let t0 = 0;
    let t1 = 1;
    const d = [b.x - a.x, b.z - a.z];
    const o = [a.x, a.z];
    const lo = [box.x0, box.z0];
    const hi = [box.x1, box.z1];
    for (let i = 0; i < 2; i++) {
      if (Math.abs(d[i]) < 1e-12) {
        if (o[i] <= lo[i] || o[i] >= hi[i]) return false;
        continue;
      }
      let u = (lo[i] - o[i]) / d[i];
      let v = (hi[i] - o[i]) / d[i];
      if (u > v) [u, v] = [v, u];
      t0 = Math.max(t0, u);
      t1 = Math.min(t1, v);
      if (t0 >= t1) return false;
    }
    return true;
  });

/** Named plan points (metres) for optics: the sensor at the stop pose, the relay samples, the corner. */
export const WH_PTS = {
  /** robot sensor at the stop pose (emitter window, slightly ahead of the robot centre) */
  sensorAtStop: {x: WAREHOUSE.robotStop.x + BOT.sensorAhead, z: WAREHOUSE.robotLaneZ, h: WAREHOUSE.sensorH} as WhPt,
  corner: {x: WAREHOUSE.corner.x, z: WAREHOUSE.corner.z, h: 0} as WhPt,
  relay: Object.fromEntries(WAREHOUSE.relaySamples.map((r) => [r.id, {x: WAREHOUSE.relaySection.x, z: r.z, h: WAREHOUSE.sensorH} as WhPt])) as Record<string, WhPt>,
  /** a person on the lane, chest height, at a given z */
  personAt: (z: number): WhPt => ({x: WAREHOUSE.personLaneX, z, h: 1.2}),
};

/**
 * The z (on the person lane) beyond which the person becomes directly visible from a sensor at `sensor`: the line
 * from the sensor past the corner C hits the lane there. A person whose shoulders stay below this z is hidden.
 */
export const whVisibleFromZ = (sensor: WhPt = WH_PTS.sensorAtStop) => {
  const c = WAREHOUSE.corner;
  const slope = (c.z - sensor.z) / (c.x - sensor.x);
  return sensor.z + slope * (WAREHOUSE.personLaneX - sensor.x);
};

/** Furthest z on the person lane (centre) for which a whole person (radius 0.26 m) stays hidden from the stop pose. */
export const WH_PERSON_HIDDEN_MAX_Z = 2.0;

/**
 * Self-check of the declared geometry (dev only). Returns a list of problems (empty = ok): from the stop pose the
 * sensor sees no part of a person (disc r = 0.26 m) on the lane up to WH_PERSON_HIDDEN_MAX_Z, and both the sensor and
 * the person see every relay sample.
 */
export const whCheck = () => {
  const problems: string[] = [];
  const S = WH_PTS.sensorAtStop;
  const zs = [0.6, 1.2, WH_PERSON_HIDDEN_MAX_Z];
  for (const z of zs) {
    const c = WH_PTS.personAt(z);
    for (const [dx, dz] of [[0, 0], [-0.26, 0], [0.26, 0], [0, -0.26], [0, 0.26], [-0.18, 0.18]]) {
      if (!whSightBlocked(S, {x: c.x + dx, z: c.z + dz})) problems.push(`robot sees person at z=${z} (${dx},${dz})`);
    }
  }
  for (const r of Object.values(WH_PTS.relay)) {
    if (whSightBlocked(S, r)) problems.push(`sensor cannot see relay point z=${r.z}`);
    for (const z of zs) if (whSightBlocked(WH_PTS.personAt(z), r)) problems.push(`person z=${z} cannot see relay z=${r.z}`);
  }
  return problems;
};

/* ------------------------------------------------------------------ projection (local to this set) */

export type WhViewConfig = {
  /** tilt 0: px per metre, floor foreshortening, x-shear (a metre of z toward the camera moves a point right by
   *  ppm * shear px: camera front-left), anchor px */
  front: {ppm: number; floor: number; shear: number; anchor: {x: number; y: number}};
  /** tilt 1: px per metre (x and z), anchor px */
  plan: {ppm: number; anchor: {x: number; y: number}};
  /** the plan point that lands on the anchor */
  pivot: {x: number; z: number; h: number};
};

/**
 * Default framing. Front view: 280 px/m; the frame shows aisle A from x ~ 0.3 m to the junction, S1's front, the
 * tops of S0 and S2, aisle B with its door and S3, and the relay wall's inner face on the right. A 1.7 m person is
 * 476 px tall, the robot (0.86 m to the top of its sensor head) ~240 px. Plan view: 200 px/m, the corner region
 * (x -1.9 .. 7.7 m, z -0.25 .. 5.15 m) centred.
 */
export const WH_VIEW: WhViewConfig = {
  front: {ppm: 280, floor: 0.4, shear: 0.3, anchor: {x: 960, y: 512}},
  plan: {ppm: 200, anchor: {x: 1120, y: 650}},
  pivot: {x: 3.7, z: 3.0, h: 1.25},
};

export type WhViewState = {
  tilt: number;
  ppm: number;
  floor: number;
  height: number;
  shear: number;
  ax: number;
  ay: number;
  pivot: {x: number; z: number; h: number};
  /** unit vector (x, z, h) pointing from the scene toward the camera */
  toCam: [number, number, number];
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Hermite smoothstep of v between e0 and e1. */
export const whSmooth = (e0: number, e1: number, v: number) => {
  const u = clamp01((v - e0) / (e1 - e0));
  return u * u * (3 - 2 * u);
};

/** Resolve the tilt from the `view` shorthand and an optional explicit tilt. */
export const whTiltOf = (view: 'front' | 'plan' = 'front', tilt?: number) => clamp01(tilt ?? (view === 'plan' ? 1 : 0));

/** Projection parameters at a tilt (0 front view .. 1 plan view). */
export const whViewAt = (tilt: number, view: WhViewConfig = WH_VIEW): WhViewState => {
  const t = clamp01(tilt);
  const phi0 = Math.asin(view.front.floor);
  const phi = phi0 + (Math.PI / 2 - phi0) * t;
  const floor = t >= 1 ? 1 : Math.sin(phi);
  const height = t >= 1 ? 0 : Math.max(0, Math.cos(phi) / Math.cos(phi0));
  const shear = view.front.shear * height;
  const ppm = view.front.ppm * Math.pow(view.plan.ppm / view.front.ppm, t);
  const ax = lerp(view.front.anchor.x, view.plan.anchor.x, t);
  const ay = lerp(view.front.anchor.y, view.plan.anchor.y, t);
  const d: [number, number, number] = [-shear * height, height, floor];
  const n = Math.hypot(d[0], d[1], d[2]) || 1;
  return {tilt: t, ppm, floor, height, shear, ax, ay, pivot: view.pivot, toCam: [d[0] / n, d[1] / n, d[2] / n]};
};

/** Plan point -> world px with resolved parameters. `depth` grows toward the camera. */
export const whProjectWith = (s: WhViewState, p: WhPt) => {
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

/** Plan point -> world px at a tilt. */
export const whProject = (p: WhPt, tilt: number, view: WhViewConfig = WH_VIEW) => whProjectWith(whViewAt(tilt, view), p);

/** SVG path data through projected plan points. */
export const whPathWith = (s: WhViewState, pts: WhPt[], closed = true) =>
  pts.map((p, i) => {
    const q = whProjectWith(s, p);
    return `${i ? 'L' : 'M'} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`;
  }).join(' ') + (closed ? ' Z' : '');

/** World px -> plan point on the floor (h = 0) at a tilt. */
export const whScreenToFloor = (sx: number, sy: number, tilt: number, h = 0, view: WhViewConfig = WH_VIEW): WhPt => {
  const s = whViewAt(tilt, view);
  const A = (sx - s.ax) / s.ppm;
  const B = (sy - s.ay) / s.ppm;
  const dz = (B + s.height * (h - s.pivot.h)) / s.floor;
  const dx = A - s.shear * dz;
  return {x: s.pivot.x + dx, z: s.pivot.z + dz, h};
};

/* ------------------------------------------------------------------ figures in the set */

/**
 * Upright figure vs plan glyph at a tilt (same timing as lib/room's figureMix, so the warehouse and the room tilt
 * alike): the upright cutout fades over tilt 0.45..0.75 with a slight feet-anchored settle; the glyph fades in over
 * 0.5..0.8 growing from 70 % to 100 %.
 */
export const whFigureMix = (tilt: number) => {
  const out = whSmooth(0.45, 0.75, tilt);
  const inn = whSmooth(0.5, 0.8, tilt);
  return {rig: 1 - out, token: inn, rigScaleX: 1 - 0.06 * out, rigScaleY: 1 - 0.16 * out, tokenScale: 0.7 + 0.3 * inn};
};

/** Where to draw a frontal Character rig (440 px tall at scale 1) standing at (x, z): pass {x, y, scale} to it. */
export const whRigAt = (x: number, z: number, tilt: number, heightM = 1.7, view: WhViewConfig = WH_VIEW) => {
  const s = whViewAt(tilt, view);
  const q = whProjectWith(s, {x, z, h: 0});
  return {x: q.x, y: q.y, scale: (heightM * s.ppm) / 440, depth: q.depth};
};

/** CSS for a Character rig at a tilt (fade + feet-anchored settle). */
export const whRigStyle = (tilt: number, scale: number): React.CSSProperties => {
  const m = whFigureMix(tilt);
  return {
    opacity: m.rig,
    transform: m.rig < 1 ? `scale(${m.rigScaleX}, ${m.rigScaleY})` : undefined,
    transformOrigin: `${200 * scale}px ${500 * scale}px`,
    visibility: m.rig <= 0.001 ? 'hidden' : undefined,
  };
};

/**
 * Where to draw the DeliveryBot side rig whose footprint centre is at (x, z): ground point px and the rig scale that
 * makes it true size (BOT.lengthM long). The rig is a billboard: it stays upright and unsquashed during the tilt;
 * fade it with whFigureMix(tilt).rig and bring in <BotTop/> at whBotTopAt().
 */
export const whBotAt = (x: number, z: number, tilt: number, view: WhViewConfig = WH_VIEW) => {
  const s = whViewAt(tilt, view);
  const q = whProjectWith(s, {x, z, h: 0});
  return {x: q.x, y: q.y, scale: s.ppm / BOT_UNITS_PER_M, depth: q.depth};
};

/**
 * Where to draw the plan glyph <BotTop/> for a robot at (x, z): during the tilt the glyph sits at body height
 * (h = 0.35 m), so it appears inside the fading side rig; at tilt 1 it is exactly over the footprint.
 * Pass `ppm` straight to BotTop.
 */
export const whBotTopAt = (x: number, z: number, tilt: number, view: WhViewConfig = WH_VIEW) => {
  const s = whViewAt(tilt, view);
  const q = whProjectWith(s, {x, z, h: 0.35 * (1 - whSmooth(0.6, 1, tilt))});
  const m = whFigureMix(tilt);
  return {x: q.x, y: q.y, ppm: s.ppm, floor: s.floor, opacity: m.token, scale: m.tokenScale};
};

/** Where to draw a person's overhead token at (x, z): centre px (chest height during the tilt), radius px. */
export const whTokenAt = (x: number, z: number, tilt: number, radiusM = 0.26, view: WhViewConfig = WH_VIEW) => {
  const s = whViewAt(tilt, view);
  const q = whProjectWith(s, {x, z, h: 1.2 * (1 - whSmooth(0.6, 1, tilt))});
  const m = whFigureMix(tilt);
  return {x: q.x, y: q.y, r: radiusM * s.ppm, opacity: m.token, scale: m.tokenScale};
};

/* ------------------------------------------------------------------ palette */

export const WH_COLORS = {
  backdrop: C.paper,
  floor: '#E6DDCA',
  planFloor: C.cream,
  floorShadow: 'rgba(22,42,50,0.10)',
  backWall: '#E2CFAB',
  relayWall: '#F4E4C4',
  cut: C.cream,
  skirting: C.cream,
  lane: C.saffron,
  stop: C.saffronDeep,
  upright: C.blue,
  beam: C.coral,
  bayBack: '#D9CAAB',
  deck: '#E2EAF6',
  planDeck: C.blueLight,
  endPanel: C.blueLight,
  guard: C.saffron,
  door: C.blueLight,
  doorFrame: C.blue,
  window: C.cream,
  box: C.woodLight,
  boxTape: C.wood,
  tote: C.teal,
  toteDeep: C.tealDeep,
  carton: '#F1E4C6',
  label: C.white,
};

/* ------------------------------------------------------------------ shelving */

type Face = '+z' | '-z' | '+x' | '-x';
const NORMAL: Record<Face, [number, number, number]> = {'+z': [0, 1, 0], '-z': [0, -1, 0], '+x': [1, 0, 0], '-x': [-1, 0, 0]};
const faceLen = (b: WhBox, f: Face) => (f === '+z' || f === '-z' ? b.x1 - b.x0 : b.z1 - b.z0);
/** A point on a vertical face: u runs left -> right as seen from outside the face, v is the height. */
const facePt = (b: WhBox, f: Face, u: number, v: number, out = 0): WhPt => {
  switch (f) {
    case '+z':
      return {x: b.x0 + u, z: b.z1 + out, h: v};
    case '-z':
      return {x: b.x1 - u, z: b.z0 - out, h: v};
    case '-x':
      return {x: b.x0 - out, z: b.z0 + u, h: v};
    case '+x':
    default:
      return {x: b.x1 + out, z: b.z1 - u, h: v};
  }
};
const faceRect = (b: WhBox, f: Face, u0: number, u1: number, v0: number, v1: number, out = 0): WhPt[] => [
  facePt(b, f, u0, v0, out),
  facePt(b, f, u1, v0, out),
  facePt(b, f, u1, v1, out),
  facePt(b, f, u0, v1, out),
];
const faceVisible = (s: WhViewState, f: Face) => {
  const n = NORMAL[f];
  return n[0] * s.toCam[0] + n[1] * s.toCam[1] + n[2] * s.toCam[2] > 1e-3;
};

type ShelfSpec = {
  id: string;
  box: WhBox;
  /** faces with open shelving (boxes on beams); other vertical faces are closed end frames */
  open: Face[];
  /** beam heights (m, centre line), bottom to top */
  beams: number[];
  /** bay width (m); bays are laid out from the face end named by `from` */
  bay: number;
  from: 'start' | 'end';
  seed: number;
};

const UPRIGHT_W = 0.08;
const BEAM_H = 0.085;

const SHELF_SPECS: Record<'S0' | 'S1' | 'S2' | 'S3', ShelfSpec> = {
  S0: {id: 'S0', box: WAREHOUSE.shelves.S0, open: ['+z'], beams: [0.1, 0.8, 1.5, 2.2, 2.86], bay: 1.36, from: 'end', seed: 11},
  S1: {id: 'S1', box: WAREHOUSE.shelves.S1, open: ['+z', '-z'], beams: [0.1, 0.72, 1.32, 1.9, 2.46], bay: 1.36, from: 'end', seed: 23},
  S2: {id: 'S2', box: WAREHOUSE.shelves.S2, open: ['-x', '+x'], beams: [0.1, 0.72, 1.32, 1.9, 2.46], bay: 1.1, from: 'start', seed: 37},
  S3: {id: 'S3', box: WAREHOUSE.shelves.S3, open: ['-x'], beams: [0.1, 0.72, 1.32, 1.9, 2.46], bay: 0.8, from: 'start', seed: 53},
};

/** Upright positions (u, metres along the face) for a face of length L. */
const uprightsFor = (L: number, bay: number, from: 'start' | 'end') => {
  const us: number[] = [];
  const n = Math.max(1, Math.round(L / bay));
  const exact = L / n;
  const step = Math.abs(exact - bay) < 0.25 ? exact : bay;
  if (from === 'start') for (let u = 0; u <= L + 1e-6; u += step) us.push(Math.min(u, L));
  else for (let u = L; u >= -1e-6; u -= step) us.unshift(Math.max(u, 0));
  if (us[0] > 0.05) us.unshift(0);
  if (us[us.length - 1] < L - 0.05) us.push(L);
  return us;
};

type BoxKind = 'card' | 'tote' | 'carton';
type StockBox = {u0: number; u1: number; v0: number; v1: number; kind: BoxKind; label: boolean};

/** Seeded, static stock for one face: boxes standing on the beams of every bay. */
const stockFor = (spec: ShelfSpec, f: Face): StockBox[] => {
  const L = faceLen(spec.box, f);
  const ups = uprightsFor(L, spec.bay, spec.from);
  const out: StockBox[] = [];
  const faceSeed = spec.seed * 101 + (f === '+z' ? 1 : f === '-z' ? 2 : f === '-x' ? 3 : 4) * 17;
  for (let b = 0; b < ups.length - 1; b++) {
    for (let l = 0; l < spec.beams.length - 1; l++) {
      const floorV = spec.beams[l] + BEAM_H / 2;
      const ceil = spec.beams[l + 1] - BEAM_H / 2 - 0.07;
      let u = ups[b] + UPRIGHT_W / 2 + 0.05;
      const end = ups[b + 1] - UPRIGHT_W / 2 - 0.04;
      let k = 0;
      while (u < end - 0.2 && k < 6) {
        const r = (i: number) => rand(faceSeed + b * 131 + l * 37 + k * 7 + i);
        const w = Math.min(end - u, 0.26 + r(1) * 0.34);
        if (w < 0.2) break;
        const tall = Math.min(ceil - floorV, 0.24 + r(2) * 0.32);
        const pick = r(3);
        if (pick > 0.88) {
          u += w * 0.7; // a gap
        } else {
          const kind: BoxKind = pick < 0.62 ? 'card' : pick < 0.78 ? 'tote' : 'carton';
          const h = kind === 'tote' ? Math.min(tall, 0.28) : tall;
          out.push({u0: u, u1: u + w, v0: floorV, v1: floorV + h, kind, label: kind === 'card' && r(4) > 0.72});
          u += w + 0.03 + r(5) * 0.05;
        }
        k++;
      }
    }
  }
  return out;
};

const STOCK: Record<string, StockBox[]> = {};
const stockCached = (spec: ShelfSpec, f: Face) => {
  const key = `${spec.id}${f}`;
  if (!STOCK[key]) STOCK[key] = stockFor(spec, f);
  return STOCK[key];
};

const ink = (w = OUTLINE) => ({stroke: C.ink, strokeWidth: w, strokeLinejoin: 'round' as const});

/** One shelving unit at a tilt: visible faces with uprights, beams and stock; top deck; plan upright marks. */
const ShelfUnit: React.FC<{spec: ShelfSpec; s: WhViewState}> = ({spec, s}) => {
  const b = spec.box;
  const faces: Face[] = (['-z', '+x', '-x', '+z'] as Face[]).filter((f) => faceVisible(s, f));
  const P = (pts: WhPt[]) => whPathWith(s, pts);
  const planT = whSmooth(0.55, 0.95, s.tilt);
  const tall = s.height * s.ppm; // px per metre of height: details vanish when faces are thin
  const detail = tall > 30;
  const nodes: React.ReactNode[] = [];

  for (const f of faces) {
    const L = faceLen(b, f);
    const H = b.h1 - b.h0;
    const key = `${spec.id}${f}`;
    if (spec.open.includes(f)) {
      // recessed bay back, then stock, then the frame (beams per bay, full-height uprights)
      nodes.push(<path key={`${key}bg`} d={P(faceRect(b, f, 0, L, b.h0, b.h1))} fill={WH_COLORS.bayBack} {...ink()} />);
      if (detail) {
        const ups = uprightsFor(L, spec.bay, spec.from);
        for (const [i, bx] of stockCached(spec, f).entries()) {
          const fill = bx.kind === 'card' ? WH_COLORS.box : bx.kind === 'tote' ? WH_COLORS.tote : WH_COLORS.carton;
          nodes.push(<path key={`${key}b${i}`} d={P(faceRect(b, f, bx.u0, bx.u1, bx.v0, bx.v1, 0.002))} fill={fill} {...ink(3)} />);
          const cu = (bx.u0 + bx.u1) / 2;
          if (bx.kind === 'card') {
            // packing tape: a short band down from the top edge
            nodes.push(<path key={`${key}t${i}`} d={P(faceRect(b, f, cu - 0.03, cu + 0.03, bx.v1 - Math.min(0.12, (bx.v1 - bx.v0) * 0.4), bx.v1, 0.003))} fill={WH_COLORS.boxTape} />);
          }
          if (bx.kind === 'tote') {
            nodes.push(<path key={`${key}h${i}`} d={P(faceRect(b, f, cu - 0.07, cu + 0.07, bx.v1 - 0.1, bx.v1 - 0.05, 0.003))} fill={WH_COLORS.toteDeep} />);
          }
          if (bx.label) {
            const lu = bx.u0 + 0.05;
            nodes.push(<path key={`${key}l${i}`} d={P(faceRect(b, f, lu, lu + 0.11, bx.v0 + 0.05, bx.v0 + 0.12, 0.003))} fill={WH_COLORS.label} {...ink(2.5)} />);
          }
        }
        for (let k = 0; k < ups.length - 1; k++) {
          for (const bv of spec.beams) {
            const v0 = Math.max(b.h0, bv - BEAM_H / 2);
            const v1 = Math.min(b.h1, bv + BEAM_H / 2);
            nodes.push(<path key={`${key}bm${k}-${bv}`} d={P(faceRect(b, f, ups[k] + UPRIGHT_W / 2, ups[k + 1] - UPRIGHT_W / 2, v0, v1, 0.004))} fill={WH_COLORS.beam} {...ink(3)} />);
          }
        }
        for (const [k, uu] of ups.entries()) {
          const u0 = Math.max(0, uu - UPRIGHT_W / 2);
          const u1 = Math.min(L, uu + UPRIGHT_W / 2);
          nodes.push(<path key={`${key}u${k}`} d={P(faceRect(b, f, u0, u1, b.h0, b.h1, 0.005))} fill={WH_COLORS.upright} {...ink(3)} />);
        }
      }
    } else {
      // closed end frame
      nodes.push(<path key={`${key}end`} d={P(faceRect(b, f, 0, L, b.h0, b.h1))} fill={WH_COLORS.endPanel} {...ink()} />);
      if (detail) {
        nodes.push(<path key={`${key}e0`} d={P(faceRect(b, f, 0, UPRIGHT_W, b.h0, b.h1, 0.004))} fill={WH_COLORS.upright} {...ink(3)} />);
        nodes.push(<path key={`${key}e1`} d={P(faceRect(b, f, L - UPRIGHT_W, L, b.h0, b.h1, 0.004))} fill={WH_COLORS.upright} {...ink(3)} />);
      }
    }
  }

  // top deck (in the plan view the whole block), with upright marks along the open long edges in the plan
  const top = P([
    {x: b.x0, z: b.z0, h: b.h1},
    {x: b.x1, z: b.z0, h: b.h1},
    {x: b.x1, z: b.z1, h: b.h1},
    {x: b.x0, z: b.z1, h: b.h1},
  ]);
  nodes.push(<path key="top" d={top} fill={interpolateColors(planT, [0, 1], [WH_COLORS.deck, WH_COLORS.planDeck])} {...ink()} />);
  if (planT > 0.001) {
    const marks: React.ReactNode[] = [];
    const m = 0.11;
    for (const f of spec.open) {
      const L = faceLen(b, f);
      for (const [k, uu] of uprightsFor(L, spec.bay, spec.from).entries()) {
        const c = facePt(b, f, Math.max(m / 2, Math.min(L - m / 2, uu)), b.h1, -m / 2);
        marks.push(
          <path
            key={`pm${f}${k}`}
            d={P([
              {x: c.x - m / 2, z: c.z - m / 2, h: b.h1},
              {x: c.x + m / 2, z: c.z - m / 2, h: b.h1},
              {x: c.x + m / 2, z: c.z + m / 2, h: b.h1},
              {x: c.x - m / 2, z: c.z + m / 2, h: b.h1},
            ])}
            fill={WH_COLORS.upright}
            {...ink(2.5)}
          />,
        );
      }
    }
    nodes.push(
      <g key="planmarks" opacity={planT}>
        {marks}
      </g>,
    );
  }
  return <>{nodes}</>;
};

/** The saffron corner guard wrapped round the blind corner. */
const CornerGuard: React.FC<{s: WhViewState}> = ({s}) => {
  const g = WAREHOUSE.cornerGuard;
  const P = (pts: WhPt[]) => whPathWith(s, pts);
  const faces: Face[] = (['+x', '-x', '+z'] as Face[]).filter((f) => faceVisible(s, f));
  return (
    <>
      {faces.map((f) => (
        <path key={f} d={P(faceRect(g, f, 0, faceLen(g, f), g.h0, g.h1))} fill={f === '+z' ? WH_COLORS.guard : C.saffronDeep} {...ink(3)} />
      ))}
      <path d={P([{x: g.x0, z: g.z0, h: g.h1}, {x: g.x1, z: g.z0, h: g.h1}, {x: g.x1, z: g.z1, h: g.h1}, {x: g.x0, z: g.z1, h: g.h1}])} fill={C.saffronLight} {...ink(3)} />
    </>
  );
};

/* ------------------------------------------------------------------ occlusion of items by the shelving */

/** A standing thing in the set: footprint centre (x, z), half-width w (m) and height (m). */
export type WhItem = {key?: string; x: number; z: number; w?: number; height?: number; node: React.ReactNode};

const rayHitsBox = (o: [number, number, number], d: [number, number, number], box: WhBox) => {
  const lo = [box.x0, box.z0, box.h0];
  const hi = [box.x1, box.z1, box.h1];
  let t0 = 1e-6;
  let t1 = Infinity;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      if (o[i] < lo[i] || o[i] > hi[i]) return false;
      continue;
    }
    let a = (lo[i] - o[i]) / d[i];
    let b = (hi[i] - o[i]) / d[i];
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return false;
  }
  return true;
};

/** Is any part of the item hidden behind the box from the camera? */
const itemBehind = (s: WhViewState, it: WhItem, box: WhBox) => {
  const w = it.w ?? 0.3;
  const ht = it.height ?? 1.7;
  for (const dx of [-w, -w / 2, 0, w / 2, w]) {
    for (const fh of [0.05, 0.5, 0.95]) {
      const o: [number, number, number] = [it.x + dx, it.z, fh * ht];
      if (rayHitsBox(o, s.toCam, box)) return true;
    }
  }
  return false;
};

/* ------------------------------------------------------------------ the set */

export type WarehouseSetProps = {
  /** shorthand for the two end states; `tilt` overrides it */
  view?: 'front' | 'plan';
  /** 0 = front view .. 1 = plan view (animate it eased) */
  tilt?: number;
  /** standing things (robot, people, carts): painted in occlusion order with the shelving */
  items?: WhItem[];
  /** painted on the shell (floor markings, wall decals, light spots) before anything standing */
  backdrop?: React.ReactNode;
  /** overlays on top of everything (light paths, labels) */
  children?: React.ReactNode;
  /** show the back-wall door (default true) */
  door?: boolean;
  /** show the floor lane markings (default true) */
  markings?: boolean;
  /** projection framing (default WH_VIEW) */
  viewConfig?: WhViewConfig;
};

const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {children}
  </svg>
);

export const WarehouseSet: React.FC<WarehouseSetProps> = ({view = 'front', tilt: tiltProp, items = [], backdrop, children, door = true, markings = true, viewConfig = WH_VIEW}) => {
  const tilt = whTiltOf(view, tiltProp);
  const s = whViewAt(tilt, viewConfig);
  const W = WAREHOUSE;
  const T = W.wallT;
  const P = (pts: WhPt[], closed = true) => whPathWith(s, pts, closed);
  const rect = (r: WhRect, h = 0): WhPt[] => [
    {x: r.x0, z: r.z0, h},
    {x: r.x1, z: r.z0, h},
    {x: r.x1, z: r.z1, h},
    {x: r.x0, z: r.z1, h},
  ];
  const faces = s.height > 0.004;
  const planT = whSmooth(0.55, 0.95, tilt);
  const inkT = whSmooth(0.78, 0.97, tilt);
  const floorColor = interpolateColors(planT, [0, 1], [WH_COLORS.floor, WH_COLORS.planFloor]);
  const topColor = interpolateColors(inkT, [0, 1], [WH_COLORS.cut, C.ink]);
  const HW = W.backWall.height;
  const RX = W.relayWall.x;

  // floor markings: a few wide painted bands (no fine stripes)
  const lane = 0.1;
  const A = W.aisleA;
  const B = W.aisleB;
  const zA0 = A.z0 + 0.2;
  const zA1 = A.z1 - 0.14;
  const markingPaths: {d: string; fill: string}[] = markings
    ? [
        // aisle A edge lines (back line stops at the stop bar, front line runs on past the junction)
        {d: P(rect({x0: W.floor.x0, x1: W.stopBar.x0 - 0.06, z0: zA0 - lane / 2, z1: zA0 + lane / 2})), fill: WH_COLORS.lane},
        {d: P(rect({x0: W.floor.x0, x1: RX - 0.18, z0: zA1 - lane / 2, z1: zA1 + lane / 2})), fill: WH_COLORS.lane},
        // stop bar across aisle A
        {d: P(rect({x0: W.stopBar.x0, x1: W.stopBar.x1, z0: zA0 - lane / 2, z1: zA1 - lane / 2 - 0.06})), fill: WH_COLORS.stop},
        // aisle B: the pedestrian walkway along S2 (two lines) and the far edge line
        {d: P(rect({x0: W.walkway.x0, x1: W.walkway.x0 + lane, z0: 0.3, z1: B.z1 - 0.06})), fill: WH_COLORS.lane},
        {d: P(rect({x0: W.walkway.x1 - lane, x1: W.walkway.x1, z0: 0.3, z1: B.z1 - 0.06})), fill: WH_COLORS.lane},
        // flow arrows: both lanes point at the junction
        {d: P(arrow(0.75, W.robotLaneZ, 1, 0, 1.0, 0.5)), fill: WH_COLORS.lane},
        {d: P(arrow(W.personLaneX, 2.42, 0, 1, 0.7, 0.42)), fill: WH_COLORS.lane},
      ]
    : [];

  // contact shadow along the base of S1's front (grounds the run)
  const S1 = W.shelves.S1;
  const shadowA = P(rect({x0: W.floor.x0, x1: S1.x1, z0: S1.z1, z1: S1.z1 + 0.11}));

  // wall tops (cream cut edges, ink lines in the plan) and the back-wall door
  const backTop = P([
    {x: W.backWall.x0, z: -T, h: HW},
    {x: RX + T, z: -T, h: HW},
    {x: RX + T, z: W.relayWall.z1, h: HW},
    {x: RX, z: W.relayWall.z1, h: HW},
    {x: RX, z: 0, h: HW},
    {x: W.backWall.x0, z: 0, h: HW},
  ]);

  // items: insert each before the first shelving unit (in paint order) that hides part of it
  const units = [
    {id: 'S0', node: <ShelfUnit spec={SHELF_SPECS.S0} s={s} />, box: W.shelves.S0},
    {id: 'S3', node: <ShelfUnit spec={SHELF_SPECS.S3} s={s} />, box: W.shelves.S3},
    {id: 'S2', node: <ShelfUnit spec={SHELF_SPECS.S2} s={s} />, box: W.shelves.S2},
    {id: 'S1', node: <ShelfUnit spec={SHELF_SPECS.S1} s={s} />, box: W.shelves.S1},
    {id: 'guard', node: <CornerGuard s={s} />, box: W.cornerGuard},
  ];
  const slots: WhItem[][] = units.map(() => []);
  const last: WhItem[] = [];
  for (const it of items) {
    const i = units.findIndex((u) => itemBehind(s, it, u.box));
    (i < 0 ? last : slots[i]).push(it);
  }
  const byDepth = (a: WhItem, b: WhItem) => whProjectWith(s, {x: a.x, z: a.z}).depth - whProjectWith(s, {x: b.x, z: b.z}).depth;
  const renderItems = (list: WhItem[]) =>
    [...list].sort(byDepth).map((it, i) => (
      <div key={it.key ?? `it${i}`} style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
        {it.node}
      </div>
    ));

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
      <Stage>
        <rect x={-4000} y={-4000} width={12000} height={12000} fill={WH_COLORS.backdrop} />
        {/* floor */}
        <path d={P(rect(W.floor))} fill={floorColor} {...ink()} />
        <path d={shadowA} fill={WH_COLORS.floorShadow} opacity={1 - planT} />
        {markingPaths.map((m, i) => (
          <path key={i} d={m.d} fill={m.fill} />
        ))}
        {faces && (
          <g>
            {/* back wall, inner face */}
            <path d={P([{x: W.backWall.x0, z: 0, h: 0}, {x: RX, z: 0, h: 0}, {x: RX, z: 0, h: HW}, {x: W.backWall.x0, z: 0, h: HW}])} fill={WH_COLORS.backWall} {...ink()} />
            <path d={P([{x: W.backWall.x0, z: 0.012, h: 0}, {x: RX, z: 0.012, h: 0}, {x: RX, z: 0.012, h: 0.1}, {x: W.backWall.x0, z: 0.012, h: 0.1}])} fill={WH_COLORS.skirting} {...ink(3)} />
            {door && <BackDoor s={s} />}
            {/* relay wall, inner face: plain, matte, light */}
            <path d={P([{x: RX, z: 0, h: 0}, {x: RX, z: W.relayWall.z1, h: 0}, {x: RX, z: W.relayWall.z1, h: HW}, {x: RX, z: 0, h: HW}])} fill={WH_COLORS.relayWall} {...ink()} />
            <path d={P([{x: RX - 0.012, z: 0, h: 0}, {x: RX - 0.012, z: W.relayWall.z1, h: 0}, {x: RX - 0.012, z: W.relayWall.z1, h: 0.1}, {x: RX - 0.012, z: 0, h: 0.1}])} fill={WH_COLORS.skirting} {...ink(3)} />
          </g>
        )}
        <path d={backTop} fill={topColor} {...ink()} />
        {/* plan: the door as a gap in the back wall line */}
        {door && planT > 0.001 && (
          <g opacity={whSmooth(0.75, 1, tilt)}>
            <path d={P([{x: W.door.x0, z: -T - 0.01, h: HW}, {x: W.door.x1, z: -T - 0.01, h: HW}, {x: W.door.x1, z: 0.01, h: HW}, {x: W.door.x0, z: 0.01, h: HW}])} fill={WH_COLORS.planFloor} />
            <path d={P([{x: W.door.x0, z: -T * 0.7, h: HW}, {x: W.door.x1, z: -T * 0.7, h: HW}, {x: W.door.x1, z: -T * 0.3, h: HW}, {x: W.door.x0, z: -T * 0.3, h: HW}])} fill={WH_COLORS.door} stroke={C.ink} strokeWidth={2.5} />
            <path d={P([{x: W.door.x0, z: -T, h: HW}, {x: W.door.x0, z: 0, h: HW}], false)} stroke={C.ink} strokeWidth={OUTLINE} />
            <path d={P([{x: W.door.x1, z: -T, h: HW}, {x: W.door.x1, z: 0, h: HW}], false)} stroke={C.ink} strokeWidth={OUTLINE} />
          </g>
        )}
      </Stage>

      {backdrop}

      {units.map((u, i) => (
        <React.Fragment key={u.id}>
          {renderItems(slots[i])}
          <Stage>{u.node}</Stage>
        </React.Fragment>
      ))}
      {renderItems(last)}

      {children}
    </div>
  );
};

/** A chunky floor arrow (plan polygon) centred at (cx, cz), pointing along (dx, dz), length L, width Wd (m). */
const arrow = (cx: number, cz: number, dx: number, dz: number, L: number, Wd: number): WhPt[] => {
  const px = -dz;
  const pz = dx;
  const shaft = Wd * 0.36;
  const headL = L * 0.42;
  const p = (a: number, b: number): WhPt => ({x: cx + dx * a + px * b, z: cz + dz * a + pz * b, h: 0});
  return [p(-L / 2, -shaft / 2), p(L / 2 - headL, -shaft / 2), p(L / 2 - headL, -Wd / 2), p(L / 2, 0), p(L / 2 - headL, Wd / 2), p(L / 2 - headL, shaft / 2), p(-L / 2, shaft / 2)];
};

/** Swing doors with round windows, in the back wall at the end of aisle B. */
const BackDoor: React.FC<{s: WhViewState}> = ({s}) => {
  const {x0, x1, height: Hd} = WAREHOUSE.door;
  const z = 0.006;
  const P = (pts: [number, number][]) => whPathWith(s, pts.map(([x, h]) => ({x, z, h})));
  const r = (a: number, b: number, h0: number, h1: number): [number, number][] => [[a, h0], [b, h0], [b, h1], [a, h1]];
  const mid = (x0 + x1) / 2;
  const win = (cx: number) => {
    const q = whProjectWith(s, {x: cx, z, h: 1.5});
    return <ellipse key={cx} cx={q.x} cy={q.y} rx={0.12 * s.ppm} ry={0.12 * s.ppm * s.height} fill={WH_COLORS.window} {...ink(3)} />;
  };
  return (
    <g>
      <path d={P(r(x0 - 0.08, x1 + 0.08, 0, Hd + 0.08))} fill={WH_COLORS.doorFrame} {...ink()} />
      <path d={P(r(x0, mid - 0.01, 0, Hd))} fill={WH_COLORS.door} {...ink()} />
      <path d={P(r(mid + 0.01, x1, 0, Hd))} fill={WH_COLORS.door} {...ink()} />
      <path d={P(r(x0 + 0.06, x1 - 0.06, 0.06, 0.28))} fill={C.blue} opacity={0.35} />
      {s.height > 0.25 && [win((x0 + mid) / 2), win((mid + x1) / 2)]}
    </g>
  );
};

/** Convenience: the robot's nominal size in metres (from the rig), for footprints and spacing. */
export const WH_BOT_FOOTPRINT = {length: BOT.lengthM, width: BOT.widthM};
