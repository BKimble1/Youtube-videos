// Group C world: the miniature foam course on the lab tray that the observer's camera looks through (C3 feed, reused by
// group A's monitor in C4), and the forward-looking 2.5D layering used to draw it.
//
// The feed is NOT a perspective render: every object (foam block, curb piece, the medic, the target) is drawn as flat
// illustration through its own orthographic view (ortho.ts), looked at along the line from the lens to the object, and
// scaled by its depth ahead of the lens (s = focal / depth) at the screen point where its centre lies. Near layers are
// big and move fast, far layers small and slow: real parallax from flat cut-outs. The lens rides on the observer's back
// (camera module, CAM2), so the view turns when the observer turns.
import {V3, Frame, toW} from '../../../lib/v3';
import {Path, poseRoach, RoachPose} from '../../../rig/roach';
import {View, viewAt} from '../../roach/ortho';
import {CAM2} from '../../roach/Gear2D';
import {LAB2} from '../../sets/Lab2';
import {rnd} from '../../../lib/ease';

// ------------------------------------------------------------------ the course centreline (mm, ground y = 0)
/** straight along +x, a right-hand bend of radius R through THETA, then straight to the target */
export const CRS = {S1: 60, R: 130, THETA: (60 * Math.PI) / 180, LANE: 46};
export const BEND_END = CRS.S1 + CRS.R * CRS.THETA;
/** centreline point and heading (yaw, the rig's convention: 0 = +x, negative = turned right toward +z) */
export const centre = (s: number): {p: V3; yaw: number} => {
  const {S1, R, THETA} = CRS;
  if (s <= S1) return {p: [s, 0, 0], yaw: 0};
  if (s <= BEND_END) {
    const th = (s - S1) / R;
    return {p: [S1 + R * Math.sin(th), 0, R - R * Math.cos(th)], yaw: -th};
  }
  const e: V3 = [S1 + R * Math.sin(THETA), 0, R - R * Math.cos(THETA)];
  const u = s - BEND_END;
  return {p: [e[0] + Math.cos(THETA) * u, 0, e[2] + Math.sin(THETA) * u], yaw: -THETA};
};
/** right-hand normal of a heading */
export const rightOf = (yaw: number): V3 => [Math.sin(yaw), 0, Math.cos(yaw)];
export const headOf = (yaw: number): V3 => [Math.cos(yaw), 0, -Math.sin(yaw)];
/** a point off the centreline: `off` mm to the right (negative = left) */
export const courseAt = (s: number, off: number): V3 => {
  const c = centre(s), n = rightOf(c.yaw);
  return [c.p[0] + n[0] * off, 0, c.p[2] + n[2] * off];
};
/** the centreline as the rig's Path (ground point and heading by distance s) */
export const MEDIC_PATH: Path = (s) => centre(s);

// ------------------------------------------------------------------ who is where (feed time)
export const FEED_T0 = 372 / 30; // C3's first frame
/** the medic walks the centreline at 55 mm/s: in the bend as the feed opens, near the target by frame 465 */
export const MEDIC_V = 55;
export const MEDIC_S0 = 122;
export const medicS = (t: number) => MEDIC_S0 + MEDIC_V * (t - FEED_T0);
/** the silicone target's face on the centreline (the medic's head is about 30 mm from it at frame 465) */
export const TARGET_S = 362;
export const feedMedicPose = (t: number): RoachPose =>
  poseRoach({path: MEDIC_PATH, s: medicS(t), t, seed: 1, search: 0.7, antL: {yaw: 0.7, pitch: 0.2}, antR: {yaw: 0.7, pitch: 0.2}});
/** the observer follows down the lane at 50 mm/s, steering for a point LA mm ahead on the centreline with a short lag
 *  (so it takes the bend a little early and the lens turns with the course). Integrated once at a fixed step from a
 *  settled start (deterministic), then looked up by time. */
export const OBS = {v: 50, tau: 0.3, LA: 30, s0: -25, tStart: 10.4, dt: 1 / 240, tEnd: 17.5};
type ObsState = {p: [number, number]; yaw: number; s: number};
const OBS_TAB: ObsState[] = (() => {
  const out: ObsState[] = [];
  let s = OBS.s0 - OBS.v * (FEED_T0 - OBS.tStart);
  let p: [number, number] = [s, 0];
  let yaw = 0;
  for (let t = OBS.tStart; t <= OBS.tEnd + OBS.dt; t += OBS.dt) {
    out.push({p: [p[0], p[1]], yaw, s});
    const a = centre(medicS(t) + OBS.LA);
    const want = Math.atan2(-(a.p[2] - p[1]), a.p[0] - p[0]);
    yaw += (want - yaw) * (OBS.dt / OBS.tau);
    p = [p[0] + Math.cos(yaw) * OBS.v * OBS.dt, p[1] - Math.sin(yaw) * OBS.v * OBS.dt];
    s += OBS.v * OBS.dt;
  }
  return out;
})();
export const obsState = (t: number): ObsState => {
  const u = Math.max(0, Math.min(OBS_TAB.length - 1.001, (t - OBS.tStart) / OBS.dt));
  const i = Math.floor(u), k = u - i, a = OBS_TAB[i], b = OBS_TAB[i + 1];
  return {p: [a.p[0] + (b.p[0] - a.p[0]) * k, a.p[1] + (b.p[1] - a.p[1]) * k], yaw: a.yaw + (b.yaw - a.yaw) * k, s: a.s + (b.s - a.s) * k};
};
export const feedObsPose = (t: number): RoachPose => {
  const o = obsState(t);
  const h = headOf(o.yaw);
  // a locally straight path through the current position (the observer's own legs are out of the feed)
  const path: Path = (s) => ({p: [o.p[0] + h[0] * (s - o.s), 0, o.p[1] + h[2] * (s - o.s)], yaw: o.yaw});
  return poseRoach({path, s: o.s, t, seed: 4, search: 0.9, antL: {yaw: 0.5, pitch: 0.12}, antR: {yaw: 0.5, pitch: 0.12}});
};

// ------------------------------------------------------------------ the lens and its 2.5D layering
export type Lens = {p: V3; yaw: number; fwd: V3; rt: V3; F: number; cx: number; hz: number};
/** lens position in the observer's body frame (front face of the camera module) */
export const LENS_BODY: V3 = [CAM2.c[0] + CAM2.h[0] + 0.2, CAM2.c[1], 0];
/** focal length and horizon for a w x h box (portrait 1080 x 1920: F 1400 px, the horizon a little below mid-height: the blocks tower) */
export const lensFrame = (w: number, h: number) => ({F: 1.3 * Math.max(w, h * 0.5625), cx: w / 2, hz: h * (h > w ? 0.57 : 0.47)});
/** the lens: fixed to the observer's body (no gait bob: the module rides smooth) */
export const lensAt = (t: number, w: number, h: number): Lens => {
  const o = obsState(t);
  const fr: Frame = {o: [o.p[0], 0, o.p[1]], x: headOf(o.yaw), y: [0, 1, 0], z: rightOf(o.yaw)};
  const p = toW(fr, LENS_BODY);
  return {p, yaw: o.yaw, fwd: headOf(o.yaw), rt: rightOf(o.yaw), ...lensFrame(w, h)};
};
/** pinhole placement of a world point: screen x, y and depth ahead of the lens */
export const place = (L: Lens, q: V3) => {
  const r: V3 = [q[0] - L.p[0], q[1] - L.p[1], q[2] - L.p[2]];
  const d = r[0] * L.fwd[0] + r[2] * L.fwd[2];
  const x = r[0] * L.rt[0] + r[2] * L.rt[2];
  const dd = Math.max(1e-3, d);
  return {x: L.cx + (L.F * x) / dd, y: L.hz - (L.F * r[1]) / dd, d};
};
/** the flat orthographic view an object is drawn through: looked at along the line from the lens to its centre (in
 *  the object's own frame: origin `o`, heading `yaw`), scaled by its depth, its anchor (local) on its placed centre */
export const objView = (L: Lens, o: V3, yaw: number, anchor: V3): {v: View; d: number} | null => {
  const hx = headOf(yaw), hz = rightOf(yaw);
  const cW: V3 = [o[0] + hx[0] * anchor[0] + hz[0] * anchor[2], anchor[1], o[2] + hx[2] * anchor[0] + hz[2] * anchor[2]];
  const pl = place(L, cW);
  if (pl.d < 6) return null;
  const u: V3 = [L.p[0] - cW[0], L.p[1] - cW[1], L.p[2] - cW[2]];
  const n = Math.hypot(u[0], u[1], u[2]);
  const lx = (u[0] * hx[0] + u[2] * hx[2]) / n, lz = (u[0] * hz[0] + u[2] * hz[2]) / n, ly = u[1] / n;
  const az = (Math.atan2(lx, lz) * 180) / Math.PI;
  const el = (Math.asin(Math.max(-1, Math.min(1, ly))) * 180) / Math.PI;
  return {v: viewAt(az, el, L.F / pl.d, anchor, pl.x, pl.y), d: pl.d};
};
/** the same for something already in world coordinates (the medic): its view's anchor is the world point */
export const worldView = (L: Lens, c: V3): {v: View; d: number} | null => {
  const pl = place(L, c);
  if (pl.d < 6) return null;
  const u: V3 = [L.p[0] - c[0], L.p[1] - c[1], L.p[2] - c[2]];
  const n = Math.hypot(u[0], u[1], u[2]);
  const az = (Math.atan2(u[0] / n, u[2] / n) * 180) / Math.PI;
  const el = (Math.asin(u[1] / n) * 180) / Math.PI;
  return {v: viewAt(az, el, L.F / pl.d, c, pl.x, pl.y), d: pl.d};
};

// ------------------------------------------------------------------ the course furniture (object frames)
export type Block = {s: number; off: number; yawAdd?: number; L: number; W: number; H: number; color: string};
const FOAMS = [LAB2.foamB, LAB2.foamY, LAB2.foamR, '#9ED0B0'];
/** foam blocks walling the lane on both sides (gaps between them), one big block on the inside of the bend, and a
 *  pair flanking the target like a gate */
export const BLOCKS: Block[] = (() => {
  const out: Block[] = [];
  let k = 0;
  for (const sd of [-1, 1] as const) {
    let s = -110 + (sd > 0 ? 18 : 0);
    while (s < BEND_END + 150) {
      const L = 46 + rnd(k, 1) * 26, W = 40 + rnd(k, 2) * 18, H = 58 + rnd(k, 3) * 60, gap = 16 + rnd(k, 4) * 16;
      const c = s + L / 2;
      // the inside of the bend (right) is a single big corner block (below)
      const inside = sd > 0 && c > CRS.S1 - 30 && c < BEND_END + 25;
      if (!inside) out.push({s: c, off: sd * (CRS.LANE + 8 + W / 2), L, W, H, color: FOAMS[k % FOAMS.length]});
      s += L + gap;
      k++;
    }
  }
  // two posts at the lane's edges: the lens passes them close
  out.push({s: 8, off: -42, L: 16, W: 16, H: 52, color: LAB2.foamY});
  out.push({s: 52, off: 42, L: 16, W: 16, H: 46, color: LAB2.foamB});
  const mid = CRS.S1 + (CRS.R * CRS.THETA) / 2;
  out.push({s: mid, off: CRS.LANE + 36 + 30, L: 64, W: 60, H: 72, color: LAB2.foamR});
  out.push({s: TARGET_S + 20, off: -(CRS.LANE + 34), L: 46, W: 40, H: 92, color: LAB2.foamB});
  out.push({s: TARGET_S + 20, off: CRS.LANE + 34, L: 46, W: 40, H: 84, color: LAB2.foamY});
  return out.filter((b) => !(b.s > TARGET_S - 40 && b.s < TARGET_S + 10));
})();
/** the course edges: low curb pieces either side of the lane, alternating colours */
export const CURB = {off: CRS.LANE, L: 20, gap: 6, W: 7, H: 6, from: -120, to: TARGET_S - 4};
export const curbs = () => {
  const out: {s: number; off: number; color: string}[] = [];
  let k = 0;
  for (let s = CURB.from; s < CURB.to; s += CURB.L + CURB.gap, k++)
    for (const sd of [-1, 1]) {
      const c = s + CURB.L / 2;
      // the inside of the bend is open (the corner block stands back from it): the observer cuts across there
      if (sd > 0 && c > CRS.S1 - 25 && c < BEND_END + 35) continue;
      out.push({s: c, off: sd * CURB.off, color: k % 2 ? '#F4F1EA' : sd < 0 ? LAB2.foamB : LAB2.foamR});
    }
  return out;
};
/** crumbs on the tray (motion cue near the bottom of the feed) */
export const specks = () => {
  const out: {p: V3; r: number}[] = [];
  for (let i = 0; i < 60; i++) {
    const s = -60 + rnd(i, 3) * 440, off = (rnd(i, 7) - 0.5) * 2 * (CRS.LANE - 4);
    out.push({p: courseAt(s, off), r: 0.45 + rnd(i, 11) * 0.8});
  }
  return out;
};
