// V3 2.5D camera. One 3D test bay (x right, d toward the viewer, h up from the floor) is drawn through an oblique
// orthographic projection whose elevation e varies per shot (blade level ~8°, side ~18°, high angle ~58°):
//   X = x,   Y = d·sin e − h·cos e
// Horizontal shapes are drawn in their (x, d) plane, vertical shapes in their (x, −h) plane, each through one SVG
// matrix, so every view is the same model rather than a separate drawing.
export type V3 = {x: number; d: number; h: number};
export type Cam3 = {x: number; d: number; h: number; z: number; e: number; ay: number}; // look-at point, zoom, elevation (deg), screen anchor y

export const rad = (deg: number) => (deg * Math.PI) / 180;
export const se = (c: Cam3) => Math.sin(rad(c.e));
export const ce = (c: Cam3) => Math.cos(rad(c.e));
export const projY = (c: Cam3, d: number, h: number) => d * se(c) - h * ce(c);
// world -> projected plane (before the camera's zoom/offset)
export const P = (c: Cam3, p: V3) => ({x: p.x, y: projY(c, p.d, p.h)});
// projected plane -> screen
export const camTransform = (c: Cam3) => `translate(540 ${c.ay}) scale(${c.z}) translate(${-c.x} ${-projY(c, c.d, c.h)})`;
export const toScreen = (c: Cam3, p: V3) => ({x: (p.x - c.x) * c.z + 540, y: (projY(c, p.d, p.h) - projY(c, c.d, c.h)) * c.z + c.ay});
// SVG matrices: draw in local plane coordinates
export const horiz = (c: Cam3, h: number) => `matrix(1 0 0 ${se(c)} 0 ${-h * ce(c)})`; // local (x, d) at height h
export const vert = (c: Cam3, d: number) => `matrix(1 0 0 ${ce(c)} 0 ${d * se(c)})`; // local (x, -h) in plane d

export const lerp = (a: number, b: number, s: number) => a + (b - a) * s;
export const lerpCam3 = (a: Cam3, b: Cam3, s: number): Cam3 => ({x: lerp(a.x, b.x, s), d: lerp(a.d, b.d, s), h: lerp(a.h, b.h, s), z: lerp(a.z, b.z, s), e: lerp(a.e, b.e, s), ay: lerp(a.ay, b.ay, s)});
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
// minimum-jerk 0..1
export const mj = (t: number) => {
  const c = clamp01(t);
  return c * c * c * (10 - 15 * c + 6 * c * c);
};
export const ramp = (t: number, a: number, b: number) => mj((t - a) / (b - a));
export const easeIn = (t: number, a: number, b: number) => clamp01((t - a) / (b - a)) ** 3;
export const easeOut = (t: number, a: number, b: number) => 1 - (1 - clamp01((t - a) / (b - a))) ** 3;
