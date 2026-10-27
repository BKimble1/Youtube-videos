// Group D (V3): the lab trial D1-D5 as one continuous performance (a pure function of film time t, seconds).
//   D1  the medic walks the last steps toward a clear silicone target (its face 42 mm ahead of the stance, as in A1),
//       stops on planted feet (D_STOP_T), settles, corrects its heading by a few degrees on its planted feet and feels
//       the face with its antennae (they flex along the silicone); lined up, the board arms (LED) and the coil warms
//       faintly (standby).
//   DT  the operator's thumb presses the fire button (D_PRESS: the cap bottoms out); the coil goes hot.
//   D2  the coil parts the latch line (D_FIRE, spark), the compressed spring drives the injector along the tube
//       (D_STROKE, accelerating, speed streaks), the needle meets the clear silicone (D_IMPACT), goes 5 mm in (the block
//       squashes and wobbles), the injector rebounds a little and seats; the body recoils on its planted feet.
//   D3  the activator seal opens (D_SEAL), gas pushes the plunger (D_PLUNGE0..1), the amber dose blooms in the silicone.
//   D5  the spent injector stays in the target while the medic waits.
import {V3} from '../../../lib/v3';
import {poseRoach, straightPath, plantedStop, RoachPose} from '../../../rig/roach';
import {INJ, PACK} from '../../../rig/gear';
import {clamp, sr, lerp} from '../../../lib/ease';
import {SPRING_FREE} from '../../roach/Gear2D';

/** the target face (world x) for the stance at the origin heading +x (as A1) */
export const D_FACE = 42;
/** the loaded needle tip (body x), the gap to the face and the injector's whole travel (5 mm into the silicone) */
const TIP0 = INJ.loadedRear + INJ.barrelLen + 1.2 + INJ.needleLen;
export const D_GAP = D_FACE - TIP0;
export const D_TRAVEL = D_GAP + 5;
/** the stop and the alignment (D1, 15.53-16.23 s) */
export const D_STOP_T = 15.88;
export const D_YAW_T0 = 15.92, D_YAW_T1 = 16.16;
/** lined up: the board arms (LED on) and the coil warms a little (standby) */
export const D_ARM = 16.14;
/** the operator's press (DT): the cap bottoms out */
export const D_PRESS = 16.49;
/** the release (the line parts, frame 498), the spring's stroke to the face, the needle's 5 mm into the silicone */
export const D_FIRE = 16.6;
export const D_STROKE = 0.17;
export const D_IMPACT = D_FIRE + D_STROKE;
const T_PEN = 0.045;
/** the activator seal opens; the plunger runs; the dose blooms (time-compressed, all inside D3 17.27-18.1 s) */
export const D_SEAL = 17.3;
export const D_PLUNGE0 = D_SEAL + 0.05;
export const D_PLUNGE1 = D_SEAL + 0.62;

const S_STOP = plantedStop(36);
const V_WALK = 52; // mm/s
const T_DEC = 0.42; // s: the deceleration into the stop
/** the approach comes in a few degrees off the target's axis; the medic corrects it on planted feet */
export const D_YAW0 = 0.12;
const PATH = straightPath([-S_STOP * Math.cos(D_YAW0), 0, S_STOP * Math.sin(D_YAW0)], D_YAW0);

export const dWalkS = (t: number) => {
  const ta = D_STOP_T - T_DEC;
  if (t < ta) return S_STOP - (V_WALK * T_DEC) / 2 - V_WALK * (ta - t);
  const u = clamp((t - ta) / T_DEC);
  return S_STOP - ((V_WALK * T_DEC) / 2) * Math.pow(1 - u, 2);
};
const bump = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)));

/** the launch: injector rear (body x along the tube), latch, coil heat, body recoil, time since contact, stroke speed
 *  (0..1 of its top speed, for the streaks), the block's squash (mm, along +x) and the spring's front */
export const dLaunch = (t: number) => {
  // the coil: a faint standby warmth once lined up, hot from the press, gone soon after the line parts
  const heat = t < D_FIRE ? 0.22 * sr(t, D_ARM, D_ARM + 0.12) + 0.78 * clamp((t - D_PRESS + 0.01) / 0.1) : Math.max(0, 1 - (t - D_FIRE) / 0.3);
  const dt = t - D_FIRE;
  if (dt < 0) return {injRear: INJ.loadedRear, latched: true, heat, recoil: 0, impact: -1, speed: 0, squash: 0, springFree: SPRING_FREE};
  let x: number, speed: number;
  if (dt < D_STROKE) {
    // the spring drives it: quick off the latch, still gaining speed at the face
    const u = dt / D_STROKE;
    x = D_GAP * Math.pow(u, 1.55);
    speed = Math.min(1, 0.25 + 0.75 * Math.pow(u, 0.55));
  } else if (dt < D_STROKE + T_PEN) {
    const u = (dt - D_STROKE) / T_PEN;
    x = D_GAP + 5 * Math.sin((u * Math.PI) / 2);
    speed = 1 - u;
  } else {
    const u = dt - D_STROKE - T_PEN;
    x = D_TRAVEL - 1.4 * Math.exp(-u / 0.08) * Math.sin(u * 30); // a small rebound, then it seats
    speed = 0;
  }
  const imp = dt - D_STROKE;
  const recoil = dt < 0.04 ? dt / 0.04 : Math.max(0, 1 - (dt - 0.04) / 0.35);
  // the silicone gives under the needle's arrival and wobbles back (a soft solid)
  const squash = imp < 0 ? 0 : imp < 0.04 ? 1.6 * (imp / 0.04) : 1.6 * Math.exp(-(imp - 0.04) / 0.1) * Math.cos((imp - 0.04) * 40);
  // the spring follows the injector to its free length, then rings a little there
  const rear = INJ.loadedRear + x;
  const tFree = Math.pow((SPRING_FREE - INJ.loadedRear) / D_GAP, 1 / 1.55) * D_STROKE;
  const ring = dt > tFree ? 0.9 * Math.exp(-(dt - tFree) / 0.07) * Math.sin((dt - tFree) * 70) : 0;
  return {injRear: rear, latched: false, heat, recoil, impact: imp, speed, squash, springFree: SPRING_FREE + ring};
};

/** plunger travel 0..1: the gas pushes hardest as it forms, then the plunger slows into the barrel's front */
export const dPlunger = (t: number) => {
  const u = clamp((t - D_PLUNGE0) / (D_PLUNGE1 - D_PLUNGE0));
  return u <= 0 ? 0 : 1 - Math.pow(1 - u, 1.9) * (1 - 0.35 * Math.exp(-u * 30));
};
/** delivered fraction of the dose (the bloom's volume follows it) */
export const dBloom = (t: number) => sr(t, D_PLUNGE0 + 0.05, D_PLUNGE1 + 0.1);

// ------------------------------------------------------------------ antennae against the silicone
/** the silicone block (and a little clearance for the antenna's thickness) */
const boxAt = (face: number) => ({x0: face - 0.45, x1: face + 30.6, y1: 34.45, z: 18.45});
/** an antenna that meets the silicone flexes along it instead of going in: each segment that would enter the block
 *  keeps its length and slides along the face it meets (the free shape is the rig's) */
export const constrainAntenna = (pts: V3[], face = D_FACE): V3[] => {
  const BOX = boxAt(face);
  const inBox = (p: V3) => p[0] > BOX.x0 && p[0] < BOX.x1 && p[1] < BOX.y1 && Math.abs(p[2]) < BOX.z;
  const out: V3[] = [pts[0]];
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const d: V3 = [(b[0] - a[0]) / seg, (b[1] - a[1]) / seg, (b[2] - a[2]) / seg];
    const p = out[i];
    let q: V3 = [p[0] + d[0] * seg, p[1] + d[1] * seg, p[2] + d[2] * seg];
    if (inBox(q)) {
      const n: V3 = p[0] <= BOX.x0 + 1e-6 ? [1, 0, 0] : p[1] >= BOX.y1 - 1e-6 ? [0, 1, 0] : [0, 0, Math.sign(p[2]) || 1];
      const dn = d[0] * n[0] + d[1] * n[1] + d[2] * n[2];
      let e: V3 = [d[0] - n[0] * dn, d[1] - n[1] * dn, d[2] - n[2] * dn];
      let el = Math.hypot(e[0], e[1], e[2]);
      if (el < 0.25) {
        e = [0, 0.35, Math.sign(p[2]) || 1];
        el = Math.hypot(e[0], e[1], e[2]);
      }
      const e1: V3 = [e[0] / el, e[1] / el, e[2] / el];
      // go straight to the face, then slide along it for the rest of the segment
      const ax = n[0] ? 0 : n[1] ? 1 : 2;
      const lim = ax === 0 ? BOX.x0 : ax === 1 ? BOX.y1 : n[2] > 0 ? BOX.z : -BOX.z;
      const th = Math.abs(d[ax]) > 1e-6 ? clamp((lim - p[ax]) / d[ax], 0, seg) : 0;
      const hit: V3 = [p[0] + d[0] * th, p[1] + d[1] * th, p[2] + d[2] * th];
      hit[ax] = lim;
      q = [hit[0] + e1[0] * (seg - th), hit[1] + e1[1] * (seg - th), hit[2] + e1[2] * (seg - th)];
      q[ax] = lim;
    }
    out.push(q);
  }
  return out;
};

/** the medic through D1-D5 */
export const dPoseFull = (t: number, recoilOn = true): RoachPose => {
  const d = dLaunch(t);
  const rc = recoilOn ? d.recoil : 0;
  const settle = bump(t, D_STOP_T - 0.03, D_STOP_T + 0.3);
  const yawFix = -D_YAW0 * sr(t, D_YAW_T0, D_YAW_T1);
  // the antennae: searching on the approach, then reaching for the face and feeling it (a slow alternating tap);
  // at the release they come off the face and sweep low and wide (clear of the silicone, out past its sides) and
  // search slowly while it waits
  const reach = sr(t, D_STOP_T - 0.4, D_STOP_T + 0.08);
  const lift = sr(t, D_FIRE + 0.01, D_FIRE + 0.22);
  const tap = (ph: number) => 0.13 * Math.sin(2 * Math.PI * 2.6 * t + ph) * reach * (1 - lift);
  const ant = (ph: number) => ({
    yaw: lerp(0.62 - 0.3 * reach, 1.18, lift),
    pitch: lerp(0.2 - 0.1 * reach, 0.02, lift) + tap(ph),
    curl: lerp(0.95 - 0.55 * reach, 0.45, lift),
  });
  const p = poseRoach({
    path: PATH, s: dWalkS(t), t, search: lerp(0.85 - 0.35 * reach, 0.45, lift), seed: 3,
    offset: [0.45 * settle - 1.5 * rc, -0.55 * settle - 0.3 * rc, 0],
    yawAdd: yawFix,
    antL: ant(0),
    antR: ant(2.2),
  });
  return {...p, antL: constrainAntenna(p.antL), antR: constrainAntenna(p.antR)};
};
/** the gear state for the medic at t (the injector in its own, un-recoiled frame once released, so the needle stays
 *  put in the silicone while the body recoils on its feet) */
export const dGear = (t: number) => {
  const d = dLaunch(t);
  const p0 = dPoseFull(t, false);
  const released = !d.latched;
  return {
    kind: 'injector' as const,
    injRear: d.injRear,
    injFrame: released ? p0.frame : undefined,
    // (the spring is drawn in the recoiling body frame: the injector's rear sits 1.5 recoil mm further along it)
    springFront: released ? Math.min(d.injRear + 1.5 * d.recoil, d.springFree) : undefined,
    latched: d.latched,
    heat: d.heat,
    led: t >= D_ARM ? (t < D_FIRE ? 1 : Math.max(0.35, 1 - (t - D_FIRE) / 0.6)) : 0,
    plunger: dPlunger(t),
  };
};
export const D_TUBE_Y = PACK.tube.a[1];
/** the needle tip in the silicone (world, stance frame) once seated */
export const D_TIP: V3 = [D_FACE + 5, D_TUBE_Y, 0];
