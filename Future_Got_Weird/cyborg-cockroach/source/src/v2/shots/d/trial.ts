// Group D: the lab trial D1-D5 as one continuous performance (a pure function of film time t, seconds). The medic
// walks up to the silicone target (target face 40 mm ahead of its stance, as in A1), stops on planted feet, settles,
// corrects its heading by a few degrees and feels the face with its antennae; on the second "fire" the coil parts
// the latch line and the spring drives the injector along the tube until the needle is 5 mm into the silicone
// (Gear2D deployAt); then the activator seal opens, gas pushes the plunger and the dose blooms in the silicone (D3);
// the spent injector stays in the target while the medic waits (D5).
import {V3} from '../../../lib/v3';
import {poseRoach, straightPath, plantedStop, RoachPose} from '../../../rig/roach';
import {INJ, PACK} from '../../../rig/gear';
import {clamp, sr, lerp} from '../../../lib/ease';
import {deployAt} from '../../roach/Gear2D';
import {word} from '../../../timeline';

/** the target face (world x) for the stance at the origin heading +x */
export const D_FACE = 40;
/** the injector's travel along the tube: the needle ends 5 mm into the silicone */
export const D_TRAVEL = D_FACE + 5 - (INJ.barrelLen + 1.2 + INJ.needleLen) - INJ.loadedRear;
/** the release: on the second "fire" (word start 16.515 s, voiced onset about 16.59 s) */
export const D_FIRE = word('fire', 1).start + 0.05;
/** the activator seal opens on "they've"; the plunger runs, the dose blooms (time-compressed) */
export const D_SEAL = word("they've", 0).start;
export const D_PLUNGE0 = D_SEAL + 0.05;
export const D_PLUNGE1 = D_SEAL + 1.0;
/** the stop: the walk ends with all six feet planted */
export const D_STOP_T = 16.0;
const S_STOP = plantedStop(36);
const V_WALK = 55; // mm/s
const T_DEC = 0.26; // s: the deceleration into the stop
/** the approach comes in a few degrees off the target's axis; the medic corrects it on planted feet */
export const D_YAW0 = 0.085;
const PATH = straightPath([-S_STOP * Math.cos(D_YAW0), 0, S_STOP * Math.sin(D_YAW0)], D_YAW0);

export const dWalkS = (t: number) => {
  const ta = D_STOP_T - T_DEC;
  if (t < ta) return S_STOP - (V_WALK * T_DEC) / 2 - V_WALK * (ta - t);
  const u = clamp((t - ta) / T_DEC);
  return S_STOP - ((V_WALK * T_DEC) / 2) * Math.pow(1 - u, 2);
};
/** the small yaw correction after the stop */
export const D_YAW_T0 = 16.05, D_YAW_T1 = 16.3;
const bump = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)));

export const dDeploy = (t: number) => deployAt(t, D_FIRE, D_TRAVEL);
/** plunger travel 0..1: the gas pushes hardest as it forms, then the plunger slows into the barrel's front */
export const dPlunger = (t: number) => {
  const u = clamp((t - D_PLUNGE0) / (D_PLUNGE1 - D_PLUNGE0));
  return u <= 0 ? 0 : 1 - Math.pow(1 - u, 1.9) * (1 - 0.35 * Math.exp(-u * 30));
};

// ------------------------------------------------------------------ antennae against the silicone
/** the silicone block (and a little clearance for the antenna's thickness) */
const BOX = {x0: D_FACE - 0.45, x1: D_FACE + 30.6, y1: 34.45, z: 18.45};
const inBox = (p: V3) => p[0] > BOX.x0 && p[0] < BOX.x1 && p[1] < BOX.y1 && Math.abs(p[2]) < BOX.z;
/** an antenna that meets the silicone flexes along it instead of going in: each segment that would enter the block
 *  keeps its length and slides along the face it meets (the free shape is the rig's) */
export const constrainAntenna = (pts: V3[]): V3[] => {
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
  const d = dDeploy(t);
  const rc = recoilOn ? d.recoil : 0;
  const settle = bump(t, D_STOP_T - 0.03, D_STOP_T + 0.3);
  const yawFix = -D_YAW0 * sr(t, D_YAW_T0, D_YAW_T1);
  // the antennae: searching on the approach, then reaching for the face and feeling it (a slow alternating tap);
  // at the release they come off the face and sweep low and wide (clear of the silicone, out past its sides) and search slowly while it waits
  const reach = sr(t, D_STOP_T - 0.45, D_STOP_T + 0.05);
  const lift = sr(t, D_FIRE + 0.03, D_FIRE + 0.33);
  const tap = (ph: number) => 0.13 * Math.sin(2 * Math.PI * 2.6 * t + ph) * reach * (1 - lift);
  const ant = (ph: number) => ({
    yaw: lerp(0.62 - 0.27 * reach, 1.18, lift),
    pitch: lerp(0.2 + 0.6 * reach, 0.02, lift) + tap(ph),
    curl: lerp(0.95 - 0.65 * reach, 0.45, lift),
  });
  const p = poseRoach({
    path: PATH, s: dWalkS(t), t, search: lerp(0.85 - 0.35 * reach, 0.45, lift), seed: 3,
    offset: [0.45 * settle - 1.4 * rc, -0.55 * settle - 0.3 * rc, 0],
    yawAdd: yawFix,
    antL: ant(0),
    antR: ant(2.2),
  });
  return {...p, antL: constrainAntenna(p.antL), antR: constrainAntenna(p.antR)};
};
/** the gear state for the medic at t (injector in its own, un-recoiled frame once released, so the needle stays put
 *  in the silicone while the body recoils on its feet) */
export const dGear = (t: number, heatK = 1) => {
  const d = dDeploy(t);
  const p0 = dPoseFull(t, false);
  const released = !d.latched;
  return {
    kind: 'injector' as const,
    injRear: d.injRear,
    injFrame: released ? p0.frame : undefined,
    springFront: released ? d.injRear + 1.4 * d.recoil : undefined,
    latched: d.latched,
    heat: d.heat * heatK,
    led: d.heat > 0.2 ? 1 : 0,
    plunger: dPlunger(t),
  };
};
/** world points of the deployed injector (in the un-recoiled frame: it is the same as the stance frame at rest) */
export const D_TUBE_Y = PACK.tube.a[1];
/** the needle tip in the silicone (world, stance frame) once seated */
export const D_TIP: V3 = [D_FACE + 5, D_TUBE_Y, 0];
