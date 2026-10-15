// V5 camera helpers: a low-pass "operator" camera (no snaps, no overshoot) and framing utilities.
import {Cam} from '../../v4/kit/scene';

/** Gaussian-weighted average of a camera function around t (x, y linear; zoom in log space). Removes corners at key
 *  changes so a follow camera eases in and out on its own. win = ± seconds covered. */
export const smoothCam = (fn: (t: number) => Cam, t: number, win = 0.25, n = 13): Cam => {
  let wx = 0, wy = 0, wz = 0, wr = 0, ws = 0;
  for (let i = 0; i < n; i++) {
    const u = (i / (n - 1)) * 2 - 1;
    const w = Math.exp(-4 * u * u);
    const c = fn(t + u * win);
    wx += c.x * w; wy += c.y * w; wz += Math.log(c.z) * w; wr += (c.rot ?? 0) * w; ws += w;
  }
  return {x: wx / ws, y: wy / ws, z: Math.exp(wz / ws), rot: wr / ws};
};

/** Camera that frames a world box [x0..x1]×[y0..y1] with a margin (fraction of frame). */
export const frameBox = (x0: number, y0: number, x1: number, y1: number, margin = 0.08): Cam => {
  const w = (x1 - x0) / (1 - 2 * margin), h = (y1 - y0) / (1 - 2 * margin);
  const z = Math.min(1920 / w, 1080 / h);
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, z};
};

/** Camera at zoom z that puts world point (wx, wy) at screen point (sx, sy). */
export const camPutting = (wx: number, wy: number, sx: number, sy: number, z: number): Cam => ({x: wx - (sx - 960) / z, y: wy - (sy - 540) / z, z});

/** Small deterministic hand-held shake (px in screen space converted to world). */
export const shake = (c: Cam, t: number, amp: number, freq = 22): Cam => {
  if (amp <= 0) return c;
  const n = (k: number) => Math.sin(t * freq * (1 + k * 0.37) + k * 1.7) * 0.6 + Math.sin(t * freq * 1.93 + k) * 0.4;
  return {...c, x: c.x + (n(1) * amp) / c.z, y: c.y + (n(2) * amp) / c.z};
};

/** Shift a camera (position only) so that world points stay inside the frame with margins (px). */
export const keepIn = (c: Cam, pts: [number, number][], m = {top: 80, bottom: 60, left: 80, right: 80}): Cam => {
  let {x, y} = c;
  const sx = (px: number) => 960 + (px - x) * c.z, sy = (py: number) => 540 + (py - y) * c.z;
  const top = Math.min(...pts.map((p) => sy(p[1]))), bot = Math.max(...pts.map((p) => sy(p[1])));
  const lft = Math.min(...pts.map((p) => sx(p[0]))), rgt = Math.max(...pts.map((p) => sx(p[0])));
  if (top < m.top) y -= (m.top - top) / c.z;
  else if (bot > 1080 - m.bottom) y += (bot - (1080 - m.bottom)) / c.z;
  if (lft < m.left) x -= (m.left - lft) / c.z;
  else if (rgt > 1920 - m.right) x += (rgt - (1920 - m.right)) / c.z;
  return {...c, x, y};
};

/** Like keepIn, but first lowers the zoom (never raises it) so that all points can fit inside the margins. */
export const fitIn = (c: Cam, pts: [number, number][], m = {top: 80, bottom: 60, left: 80, right: 80}): Cam => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
  const z = Math.min(c.z, (1920 - m.left - m.right) / Math.max(1, bw), (1080 - m.top - m.bottom) / Math.max(1, bh));
  return keepIn({...c, z}, pts, m);
};

/** A slow, one-way camera creep (push and drift) between t0 and t1, so held shots never sit on identical frames.
 * Apply it before the camera's next move so that move starts from wherever the creep left off. */
export const creep = (c: Cam, t: number, t0: number, t1: number, dz = 0.05, dx = 0, dy = 0): Cam => {
  const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
  const k = u * u * (3 - 2 * u);
  return {...c, x: c.x + dx * k, y: c.y + dy * k, z: c.z * (1 + dz * k)};
};
