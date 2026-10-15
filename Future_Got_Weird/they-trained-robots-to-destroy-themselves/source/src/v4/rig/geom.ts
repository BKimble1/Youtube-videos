// V4 2D geometry helpers: smooth outlines from authored points, point-list blending for in-between views,
// 2D affine matrices for forward kinematics (each part gets an explicit transform; draw order is chosen freely).
export type P = [number, number];
export type Mat = [number, number, number, number, number, number]; // SVG matrix(a b c d e f)

export const I: Mat = [1, 0, 0, 1, 0, 0];
export const mul = (m: Mat, n: Mat): Mat => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
export const T = (x: number, y: number): Mat => [1, 0, 0, 1, x, y];
export const S = (sx: number, sy = sx): Mat => [sx, 0, 0, sy, 0, 0];
/** Rotation by deg (positive = clockwise on screen, since y points down). */
export const R = (deg: number): Mat => {
  const a = (deg * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0];
};
export const apply = (m: Mat, p: P): P => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
export const ms = (m: Mat) => `matrix(${m.map((v) => +v.toFixed(4)).join(' ')})`;
export const inv = (m: Mat): Mat => {
  const det = m[0] * m[3] - m[1] * m[2];
  const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const mixPts = (a: P[], b: P[], t: number): P[] => a.map((p, i) => [lerp(p[0], b[i][0], t), lerp(p[1], b[i][1], t)]);
export const mirrorPts = (pts: P[]): P[] => pts.map(([x, y]) => [-x, y]);

const f = (v: number) => +v.toFixed(2);

/** Closed smooth outline through points (Catmull-Rom → cubic Bézier). `sharp` marks indices kept as corners. */
export const smooth = (pts: P[], tension = 1, sharp: number[] = []): string => {
  const n = pts.length;
  if (n < 3) return '';
  const k = tension / 6;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const s1 = sharp.includes(i) ? 0 : k, s2 = sharp.includes((i + 1) % n) ? 0 : k;
    const c1: P = [p1[0] + (p2[0] - p0[0]) * s1, p1[1] + (p2[1] - p0[1]) * s1];
    const c2: P = [p2[0] - (p3[0] - p1[0]) * s2, p2[1] - (p3[1] - p1[1]) * s2];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
};
/** Open smooth polyline. */
export const smoothOpen = (pts: P[], tension = 1): string => {
  const n = pts.length;
  if (n < 2) return '';
  const k = tension / 6;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const c1: P = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: P = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
};
export const poly = (pts: P[]) => 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z';

/** Tapered capsule from (0,0) to (0,L): width w0 at the top, w1 at the bottom, round ends. */
export const capsule = (L: number, w0: number, w1: number): string => {
  const r0 = w0 / 2, r1 = w1 / 2;
  return `M${f(-r0)} 0 A${f(r0)} ${f(r0)} 0 0 1 ${f(r0)} 0 L${f(r1)} ${f(L)} A${f(r1)} ${f(r1)} 0 0 1 ${f(-r1)} ${f(L)} Z`;
};
/** The shaded back strip of a capsule (side = -1 left / +1 right edge), as a closed path. */
export const capsuleShade = (L: number, w0: number, w1: number, side: -1 | 1, frac = 0.38): string => {
  const r0 = w0 / 2, r1 = w1 / 2;
  const x0 = side * r0, x1 = side * r1, i0 = side * r0 * (1 - 2 * frac), i1 = side * r1 * (1 - 2 * frac);
  const sw = side > 0 ? 0 : 1;
  return `M${f(i0)} ${f(-r0 * 0.6)} L${f(x0)} 0 L${f(x1)} ${f(L)} A${f(r1)} ${f(r1)} 0 0 ${sw} ${f(i1)} ${f(L + r1 * 0.8)} Z`;
};
export const circle = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;
export const ellipse = (cx: number, cy: number, rx: number, ry: number) => `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;
/** Rounded rectangle centred on (cx, cy). */
export const rrect = (cx: number, cy: number, w: number, h: number, r: number) => {
  const x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
  const rr = Math.min(r, w / 2, h / 2);
  return `M${f(x0 + rr)} ${f(y0)}H${f(x1 - rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(x1)} ${f(y0 + rr)}V${f(y1 - rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(x1 - rr)} ${f(y1)}H${f(x0 + rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(x0)} ${f(y1 - rr)}V${f(y0 + rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(x0 + rr)} ${f(y0)}Z`;
};
