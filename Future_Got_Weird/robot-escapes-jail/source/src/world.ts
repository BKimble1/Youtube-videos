// The jail world: a light perspective "2.5D" space so the camera can track, push low to the floor and cross the bar
// line continuously, while every character stays a hand-drawn 2D billboard (Weird Crew finish).
//
// World units (u): the robot is 10 u tall. Axes: x to the right, h up (floor h = 0), d away from the viewer (depth).
// The bar row stands on the line d = 0, from x = -BAR_SPAN to +BAR_SPAN. The cell is BEHIND the bars (d > 0, up to the
// back wall at CELL_D); the corridor where the guard stands is IN FRONT (d < 0).
//
// Camera: position (x, h, d), yaw (deg, + turns the view to the right), pitch (deg, + looks DOWN), focal f in px.
// project(p) -> screen {x, y, s, z}: s = px per world unit at that depth (billboard scale), z = camera-space depth.

export type P3 = {x: number; h: number; d: number};
export type Cam3 = {x: number; h: number; d: number; yaw: number; pitch: number; f: number};
export type Scr = {x: number; y: number; s: number; z: number};

export const W = 1080, H = 1920;

// ---- jail layout (world units) ----
export const BAR_R = 0.62;          // bar radius
export const BAR_GAP = 5.2;         // centre-to-centre spacing (clear gap = BAR_GAP - 2*BAR_R = 3.96 u)
export const BAR_N = 16;            // bars in the row, at x = (i - 7.5) * BAR_GAP: x = 0 is the CENTRE OF A GAP
export const BAR_SPAN = 7.5 * BAR_GAP; // outermost bar x (+-39)
export const BAR_H = 26;            // bar height (top rail at h = BAR_H)
export const RAIL_H = 1.4;          // top / bottom rail thickness
export const CELL_D = 24;           // back wall depth
export const CELL_HALF = 22;        // side walls at x = +-CELL_HALF (cell interior)
export const WALL_H = 34;           // wall height
export const DOOR = {x0: -10.4, x1: 10.4}; // the sliding door section (holds the bars at +-2.6 and +-7.8); slides right to open
export const ALARM: P3 = {x: 15, h: 30.5, d: 0.6};  // red beacon on the wall above the bars, right of centre
export const GUARD_AT: P3 = {x: 13, h: 0, d: -11};  // where the guard stands in the corridor (feet)
export const ESCAPE_X = 0;          // the gap the robot uses
export const BAR_XS: number[] = Array.from({length: BAR_N}, (_, i) => (i - 7.5) * BAR_GAP);

const rad = (a: number) => (a * Math.PI) / 180;

/** world -> camera space (X right, Y up, Z forward) */
export const toCam = (c: Cam3, p: P3) => {
  let x = p.x - c.x, y = p.h - c.h, z = p.d - c.d;
  // yaw about the vertical axis
  const cy = Math.cos(rad(c.yaw)), sy = Math.sin(rad(c.yaw));
  [x, z] = [x * cy - z * sy, x * sy + z * cy];
  // pitch (+ looks down): rotate about X
  const cp = Math.cos(rad(c.pitch)), sp = Math.sin(rad(c.pitch));
  [y, z] = [y * cp + z * sp, -y * sp + z * cp];
  return {x, y, z};
};

export const NEAR = 0.5;
/** project a world point to the screen (px). s = px per world unit at that point's depth. */
export const project = (c: Cam3, p: P3): Scr => {
  const q = toCam(c, p);
  const z = Math.max(NEAR, q.z);
  const s = c.f / z;
  return {x: W / 2 + q.x * s, y: H / 2 - q.y * s, s, z: q.z};
};

/** a floor-plane polygon (points given as {x, d} on h = hh) projected to an SVG path */
export const floorPath = (c: Cam3, pts: {x: number; d: number}[], hh = 0) =>
  pts.map((q, i) => {
    const s = project(c, {x: q.x, h: hh, d: q.d});
    return `${i ? 'L' : 'M'}${s.x.toFixed(1)},${s.y.toFixed(1)}`;
  }).join(' ') + ' Z';

/** the screen-space half-plane in front of (nearer than) the line d = d0 on the floor, as a big clip polygon.
 *  Everything drawn inside this clip is on the viewer's side of that line. (Assumes the line is in view and the camera
 *  is in front of it, d_cam < d0.) */
export const nearSideClip = (c: Cam3, d0: number, x0 = -400, x1 = 400) => {
  const a = project(c, {x: x0, h: 0, d: d0}), b = project(c, {x: x1, h: 0, d: d0});
  // extend the line across the frame, then close below it
  const k = (b.y - a.y) / (b.x - a.x || 1e-6);
  const yAt = (x: number) => a.y + k * (x - a.x);
  return `M-200,${yAt(-200).toFixed(1)} L${W + 200},${yAt(W + 200).toFixed(1)} L${W + 200},${H + 400} L-200,${H + 400} Z`;
};

export const lerpCam = (a: Cam3, b: Cam3, u: number): Cam3 => ({
  x: a.x + (b.x - a.x) * u, h: a.h + (b.h - a.h) * u, d: a.d + (b.d - a.d) * u,
  yaw: a.yaw + (b.yaw - a.yaw) * u, pitch: a.pitch + (b.pitch - a.pitch) * u, f: a.f + (b.f - a.f) * u,
});
