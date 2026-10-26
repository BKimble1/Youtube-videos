// The research site as one world (the camera's depth-1 plane), with every position a constant, so the tower tip,
// the optical exit, the beam axis, the guided channel and the bolt agree in every shot. Units are pixels of the wide
// establishing frame (camera {x: 540, y: 960, z: 1}).
//
// Scale: the tower is 730 px from its rock base (y 1430) to the rod tip (y 700) and stands for the real 124 m
// telecom tower, so 50 m (about 160 ft) is 300 px. The guided section of the channel is G = 300 px along the axis.
// The apparatus and the control shelter are drawn larger than this scale so they read in the wide (see
// production/SOURCE_NOTES.md).
import {hash, noise1, V} from '../dc/math';

export const TIP: V = {x: 700, y: 700};
export const TOWER_BASE_Y = 1430;
export const TOWER_X = 700;
/** the beam axis: through A0 (just above and beside the rod tip), tilted 18 deg from vertical toward screen-right */
export const AX_ANG = 18;
export const U: V = {x: Math.sin((AX_ANG * Math.PI) / 180), y: -Math.cos((AX_ANG * Math.PI) / 180)};
export const NRM: V = {x: -U.y, y: U.x}; // to the axis's right (screen-right, slightly down)
export const A0: V = {x: 704, y: 690};
export const axisPt = (h: number, off = 0): V => ({x: A0.x + U.x * h + NRM.x * off, y: A0.y + U.y * h + NRM.y * off});
/** the optical exit (top of the launch telescope): the beam starts here; h is negative below A0 */
export const EXIT_H = -880;
export const EXIT: V = axisPt(EXIT_H);
/** the guided section: G px of the axis above A0 (about 50 m, "over 160 feet") */
export const G = 300;
/** the opening / ending close-up: a point on the guided channel and the camera on it */
export const H0 = 150;
export const P0: V = axisPt(H0);
export const CAM0 = {x: P0.x, y: P0.y, z: 12};
/** cloud base (world y) */
export const CLOUD_Y = 70;

// ---------------------------------------------------------------- the upward leader (one deterministic path)
export type Pt = V & {s: number};
export type Branch = {pts: Pt[]; s0: number; len: number};

const build = () => {
  const pts: V[] = [];
  // the rod tip, then a short hop to the axis (the leader incepts at the tip and joins the laser channel)
  pts.push({...TIP});
  pts.push({x: TIP.x + 1.5, y: TIP.y - 5});
  pts.push(axisPt(6, -1.2));
  // guided: close to the axis (within about +-2.3 px), fine jagged detail for the close-ups
  for (let h = 8; h <= G; h += 1.5) {
    const off = 1.5 * noise1(h / 11, 3) + 0.65 * noise1(h / 3.1, 7) + 0.28 * (hash(Math.round(h * 3), 11) - 0.5);
    pts.push(axisPt(h, off));
  }
  const guidedN = pts.length;
  // unguided: a tortuous path to the cloud base, drifting back toward vertical and a little left
  let p = pts[pts.length - 1];
  let i = 0;
  while (p.y > CLOUD_Y - 30 && i < 200) {
    const base = -8 - 10 * Math.min(1, i / 8); // heading (deg from vertical, + = to screen-left)
    const a = ((base + 46 * (hash(i, 21) - 0.5)) * Math.PI) / 180;
    const L = 16 + 22 * hash(i, 23);
    // sub-steps with small jitter so long segments are not ruler-straight
    const n = 3;
    for (let k = 1; k <= n; k++) {
      const j = 2.2 * (hash(i * 7 + k, 29) - 0.5);
      pts.push({x: p.x - Math.sin(a) * (L * k) / n + j, y: p.y - Math.cos(a) * (L * k) / n});
    }
    p = pts[pts.length - 1];
    i++;
  }
  // arc length
  const out: Pt[] = [];
  let s = 0;
  pts.forEach((q, k) => {
    if (k > 0) s += Math.hypot(q.x - pts[k - 1].x, q.y - pts[k - 1].y);
    out.push({...q, s});
  });
  // branches: from unguided vertices, short upward-outward forks that stall
  const branches: Branch[] = [];
  const cands = [0.12, 0.27, 0.41, 0.55, 0.7, 0.84];
  cands.forEach((fr, bi) => {
    const k = Math.floor(guidedN + (out.length - guidedN) * fr);
    const o = out[k];
    const side = bi % 2 === 0 ? 1 : -1;
    const bp: V[] = [{x: o.x, y: o.y}];
    let q = bp[0];
    const nseg = 3 + Math.floor(hash(bi, 41) * 4);
    for (let m = 0; m < nseg; m++) {
      const a = ((side * (35 + 30 * hash(bi * 13 + m, 43)) + (hash(m, 47) - 0.5) * 30) * Math.PI) / 180;
      const L = 10 + 16 * hash(bi * 17 + m, 53);
      q = {x: q.x - Math.sin(a) * L, y: q.y - Math.cos(a) * L};
      bp.push(q);
    }
    let bs = 0;
    const bpts: Pt[] = bp.map((r, m) => {
      if (m > 0) bs += Math.hypot(r.x - bp[m - 1].x, r.y - bp[m - 1].y);
      return {...r, s: bs};
    });
    branches.push({pts: bpts, s0: o.s, len: bs});
  });
  return {pts: out, branches, guidedS: out[guidedN - 1].s, total: out[out.length - 1].s};
};
export const BOLT = build();

// ---------------------------------------------------------------- leader growth (arc length revealed) and light
/** The loop leader as a function of loop time tau (tau = t at the start of the film, t - DUR at the end): it incepts
 *  at the rod tip at tau = -1.527 s, passes the close-up point P0 (s = H0 + the hop) at tau = 0, and reaches the cloud
 *  at about tau = 1.3. The same function draws the end and the start, so the seam is exact. */
export const LOOP_START = -Math.log(2.5) / 0.6;
const hopS = () => BOLT.pts[2].s;
export const loopS = (tau: number) => {
  if (tau < LOOP_START) return -1;
  const e = 100 * (2.5 * Math.exp(0.6 * tau) - 1);
  const x = Math.max(0, tau - 0.3);
  return hopS() + e + 640 * x * x * x;
};
/** time when a growth function reaches the end of the path (connection) */
export const LOOP_CONNECT = (() => {
  let t = 0;
  while (loopS(t) < BOLT.total && t < 5) t += 1 / 300;
  return t;
})();

/** The demonstration leader (shots J/K): incepts at t = 19.5, climbs the guided section by 21.05 (time-expanded,
 *  the camera tracks its tip), then races to the cloud by about 21.75. */
export const DEMO_T0 = 19.5;
export const demoS = (t: number) => {
  const u = t - DEMO_T0;
  if (u < 0) return -1;
  const g = BOLT.guidedS;
  const v = g / 0.9 / 1.55; // px/s once moving
  if (u < 1.55) {
    // the speed ramps up over the first 0.31 s, then a steady climb through the guided section
    const x = u / 1.55;
    return x < 0.2 ? (g / 0.9) * (x * x) / 0.4 : (g / 0.9) * (x - 0.1);
  }
  // past the guided section it accelerates (same speed at the hand-over) to the cloud in 0.7 s
  const w = u - 1.55;
  const a = (BOLT.total - g - v * 0.7) / 0.49;
  return Math.min(BOLT.total, g + v * w + a * w * w);
};
export const DEMO_CONNECT = DEMO_T0 + 1.55 + 0.7;

/** Brightness of the discharge (1 = a growing leader's core) and the light it throws on the scene (0..1) for a time
 *  measured from connection (dt < 0: still growing). Deterministic flicker: a few re-brightenings that decay. */
export const boltLight = (dt: number, sustain = 1.3) => {
  if (dt < 0) return {core: 0.85 + 0.15 * noise1(dt * 40, 5), scene: 0.1 + 0.04 * noise1(dt * 30, 6)};
  const decay = Math.exp(-dt / (0.45 * sustain));
  const pulses = [0, 0.16, 0.38, 0.7].reduce((a, p0, k) => a + (dt >= p0 ? Math.exp(-(dt - p0) / 0.07) * (1 - 0.18 * k) : 0), 0);
  const fl = 0.85 + 0.15 * noise1(dt * 55, 9);
  const tail = Math.max(0, 1 - Math.max(0, dt - sustain) / 0.5);
  return {core: Math.min(1.6, (0.9 + 0.7 * pulses) * fl) * (0.35 + 0.65 * decay) * tail, scene: Math.min(1, 0.25 * decay + 0.75 * pulses * decay) * tail};
};
