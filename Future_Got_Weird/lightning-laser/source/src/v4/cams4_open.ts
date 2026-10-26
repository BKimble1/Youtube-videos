// V4 A + H cameras on the loop clock (tau3).
//   W       the end of H2: from low on the summit's flank, out from the beam's plane (so the beam is seen from the
//           side, not end-on): the telescope firing lower left (its exit glow and the packets leaving it), the summit
//           station beside its terrace, the tower rising from its own base to the right, and the rod tip high in frame
//           with the beam running on past it, through the warm extended channel, into the storm deck.
//   H2  tau -2.76 .. 0     (30.74-33.5) the cut ("into the SKY") lands on W, which holds with a slow creep (a gentle
//                          rise) through "using the AIR ITSELF" to the end: the channel stays in frame to the last frame
//   seam                   one cut, on the same beam (it runs up and to the right on both sides of the cut), from W to
//                          A1's closer view of the launch. With a 2.3 m telescope and a 124 m tower one framing cannot
//                          show both a readable telescope and the channel above the tip, and the brief puts the final
//                          explanation first, so the loop cuts instead of forcing an exact frame match
//   A1  tau 0 .. CR0       the launch, close: the telescope large low-left and firing, the station behind it as human
//                          scale, the tower beyond ("They fired a LASER"), with a slow rise
//   A2  tau CR0 .. CR1     one crane up the beam with the packets onto openCam (V3's opening setup, B's start): the
//                          camera rises and draws back from the beam's plane while the view tilts up and levels, one way
//                          only; the beam stays the travelling centre and the tower passes on its right. Two speeds:
//                          slow while the station and the telescope are in frame, fast only high over the summit, then
//                          an ease onto openCam's own drift velocity (no stall, no snap)
//   A3  tau CR1 ..         openCam(t) exactly (A -> B contract)
import {clamp} from '../dc/math';
import {ss} from '../lib';
import {add3, basis, Cam3, EXIT3, len3, lookAt, mul3, projector, sub3, TIP3, v3, V3} from '../v2/p3';
import {OPEN0, openCam} from '../v3/cams3';
import {lookAtScreen} from '../v3/Open3_end';
import {B, tau3} from '../v3/timeline3';

/** a blendable camera key: position, a point on its view ray at the common distance D_KEY, focal length, roll */
type Key = {pos: V3; tgt: V3; f: number; roll: number};
const D_KEY = len3(sub3(OPEN0.target, OPEN0.pos));
const keyOf = (c: Cam3): Key => {
  const {f} = basis({...c, roll: 0});
  return {pos: c.pos, tgt: add3(c.pos, mul3(f, D_KEY)), f: c.f, roll: c.roll ?? 0};
};
const camOf = (k: Key): Cam3 => ({...lookAt(k.pos, k.tgt, k.f), roll: k.roll});
const shift = (k: Key, d: V3, dt: V3 = d): Key => ({...k, pos: add3(k.pos, d), tgt: add3(k.tgt, dt)});

/** a camera at pos that puts world point A at screen point a and world point Bp at screen point b (yaw, pitch, roll and
 *  focal length by Newton's method on a numeric Jacobian; deterministic, evaluated once at load) */
export const solveCam = (pos: V3, A: V3, a: {x: number; y: number}, Bp: V3, b: {x: number; y: number}, f0 = 900): Cam3 => {
  const mid = v3((A.x + Bp.x) / 2, (A.y + Bp.y) / 2, (A.z + Bp.z) / 2);
  const set = (x: number[]): Cam3 => ({pos, yaw: x[0], pitch: x[1], roll: x[2], f: Math.exp(x[3])});
  const res = (c: Cam3) => {
    const P = projector(c);
    const pa = P(A), pb = P(Bp);
    return [pa.x - a.x, pa.y - a.y, pb.x - b.x, pb.y - b.y];
  };
  const c0 = lookAt(pos, mid, f0);
  let x = [c0.yaw, c0.pitch, 0, Math.log(f0)];
  for (let it = 0; it < 40; it++) {
    const r0 = res(set(x));
    if (Math.max(...r0.map(Math.abs)) < 1e-4) break;
    const M = [0, 1, 2, 3].map((i) => [0, 0, 0, 0, -r0[i]]);
    for (let k = 0; k < 4; k++) {
      const h = k === 3 ? 1e-4 : 1e-3;
      const xp = [...x];
      xp[k] += h;
      const rp = res(set(xp));
      for (let i = 0; i < 4; i++) M[i][k] = (rp[i] - r0[i]) / h;
    }
    for (let i = 0; i < 4; i++) {
      let p = i;
      for (let j = i + 1; j < 4; j++) if (Math.abs(M[j][i]) > Math.abs(M[p][i])) p = j;
      [M[i], M[p]] = [M[p], M[i]];
      for (let j = i + 1; j < 4; j++) {
        const q = M[j][i] / M[i][i];
        for (let k = i; k < 5; k++) M[j][k] -= q * M[i][k];
      }
    }
    const d = [0, 0, 0, 0];
    for (let i = 3; i >= 0; i--) {
      let s = M[i][4];
      for (let k = i + 1; k < 4; k++) s -= M[i][k] * d[k];
      d[i] = s / M[i][i];
    }
    const sc = Math.min(1, 10 / Math.max(1e-9, ...d.slice(0, 3).map(Math.abs)));
    x = x.map((v, i) => v + d[i] * sc);
  }
  return set(x);
};

// ------------------------------------------------------------------ W: the shared framing (the seam, tau = 0)
/** the camera 1.6 m over the rock of the summit's flank, 50 m out from the beam's plane and 14 m west of the
 *  telescope: the exit window in the lower left corner (the telescope's foot above the caption band), the rod tip high
 *  in frame with the channel and the beam running on above it to the storm deck */
export const W = {pos: v3(-60, -17.6, -50), exitAt: {x: 110, y: 1480}, tipAt: {x: 700, y: 290}};
const W_KEY = keyOf(solveCam(W.pos, EXIT3, W.exitAt, TIP3, W.tipAt));
/** the creep (m/s): a slow rise beside the beam, the view tilting up with it */
const W_V = v3(0.12, 0.42, -0.1);
const W_VT = v3(0.25, 1.1, 0);
const wKey = (tau: number): Key => shift(W_KEY, mul3(W_V, tau), mul3(W_VT, tau));
export const wCam = (tau: number) => camOf(wKey(tau));

// ------------------------------------------------------------------ A1: the launch, close (frame 0)
/** A1 at tau = 0, just after the loop's cut from W: on the terrace beside the telescope, out from the beam's plane, so
 *  the telescope is large low-left and firing, the summit station is the human-scale context behind it and the tower
 *  rises beyond; the beam keeps W's screen direction (up and to the right) across the cut */
export const A1 = {pos: v3(-49.6, -15.9, -4.6), exitAt: {x: 340, y: 1330}, f: 560, roll: 2};
const A1_KEY = keyOf(lookAtScreen(A1.pos, EXIT3, A1.f, A1.exitAt.x, A1.exitAt.y, A1.roll));
/** A1's slow rise along the beam (m/s): the motion the crane grows out of */
const A1_V = v3(0.1, 0.45, -0.1);
const A1_VT = v3(0.3, 1.2, 0);
const a1Key = (tau: number): Key => shift(A1_KEY, mul3(A1_V, tau), mul3(A1_VT, tau));
export const a1Cam = (tau: number) => camOf(a1Key(tau));

// ------------------------------------------------------------------ A2: the crane up the beam onto openCam
export const CR0 = 0.55, CR1 = 2.4;
/** a normalised progress through [a, b] from a velocity profile vel (cumulative, tabulated; 0 and 1 at the ends) */
const progress = (a: number, b: number, vel: (t: number) => number, n = 400) => {
  const acc = [0];
  for (let i = 1; i <= n; i++) acc.push(acc[i - 1] + Math.max(0, vel(a + ((i - 0.5) / n) * (b - a))));
  const tab = acc.map((x) => x / acc[n]);
  return (t: number) => {
    const x = clamp((t - a) / (b - a)) * n;
    const i = Math.min(n - 1, Math.floor(x));
    return tab[i] + (tab[i + 1] - tab[i]) * (x - i);
  };
};
/** the crane's control point: it rises and draws back from the beam's plane together, toward openCam's side */
const CR_C = v3(-70, 25, -75);
/** two stages. While the station and the telescope are in frame (to about 1.2 s) the rise grows out of the creep
 *  slowly and stays slow (their windows move at most ~35 px a frame, so they leave the frame calmly, with the
 *  telescope still firing through "LASER"); once they are out, high over the summit with nothing near the lens, the
 *  rise speeds up (1.3-1.9) and then eases onto openCam's own drift (zero relative velocity at CR1) */
const craneW = progress(CR0, CR1, (t) => (0.35 * ss(t, CR0, CR0 + 0.55) + 0.65 * ss(t, 1.0, 1.5)) * (1 - ss(t, 1.55, CR1)));
const craneCam = (tau: number, t: number): Cam3 => {
  const a = a1Cam(tau), o = openCam(t);
  const w = craneW(tau);
  const pos = add3(add3(mul3(a.pos, (1 - w) * (1 - w)), mul3(CR_C, 2 * (1 - w) * w)), mul3(o.pos, w * w));
  // the view turns one way only (a slow tilt up, a slight turn left, the roll levelling): the beam stays the travelling
  // centre (it crosses the frame's centre row at x 370 -> 585) with the tower passing on its right
  const wo = ss(w, 0, 1);
  const ar = a.roll ?? 0;
  return {
    pos,
    yaw: a.yaw + (o.yaw - a.yaw) * wo,
    pitch: a.pitch + (o.pitch - a.pitch) * wo,
    roll: ar + ((o.roll ?? 0) - ar) * wo,
    // the lens lengthens with the distance the camera gains (the tower top grows steadily, no jump at the end)
    f: Math.exp(Math.log(a.f) + (Math.log(o.f) - Math.log(a.f)) * ss(w, 0.2, 1)),
  };
};

// ------------------------------------------------------------------ H2: the cut onto W
export const H2T0 = B.H2 - 33.5; // tau of the cut (30.74)

/** the loop camera: H2 (from the cut) through the seam, A1, the crane, then openCam (A3, B's start) */
export const loopCam = (t: number): Cam3 => {
  const tau = tau3(t);
  if (tau < 0) return wCam(tau);
  if (tau < CR0) return a1Cam(tau);
  if (tau < CR1) return craneCam(tau, t);
  return openCam(t);
};
