// Walking on a planned floor path: the ground point follows a smooth path at a keyed distance, every foot contact is
// an explicit plant (steps.footAt), so a loaded foot never slides; the plants are placed from the path itself.
import {Body4} from './rig/cast';
import {Pose4} from './rig/Crew';
import {footAt, Plant} from './rig/steps';
import {U, v3, V3, worldToCard} from './rig/geo';
import {clamp, sm} from './lib';

export type XZ = {x: number; z: number};
/** a polyline path smoothed with Catmull-Rom; returned as a dense sample table with arc lengths */
export const pathTable = (pts: XZ[], n = 400) => {
  const P = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  const cr = (u: number) => {
    const s = u * (pts.length - 1);
    const i = Math.min(pts.length - 2, Math.floor(s));
    const f = s - i;
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c = (a: number, b: number, c2: number, d: number) => 0.5 * (2 * b + (-a + c2) * f + (2 * a - 5 * b + 4 * c2 - d) * f * f + (-a + 3 * b - 3 * c2 + d) * f * f * f);
    return {x: c(p0.x, p1.x, p2.x, p3.x), z: c(p0.z, p1.z, p2.z, p3.z)};
  };
  const tab: {x: number; z: number; s: number}[] = [];
  let s = 0;
  let prev = cr(0);
  for (let k = 0; k <= n; k++) {
    const q = cr(k / n);
    s += Math.hypot(q.x - prev.x, q.z - prev.z);
    tab.push({...q, s});
    prev = q;
  }
  const L = s;
  const at = (d: number) => {
    const dd = clamp(d, 0, L);
    let lo = 0, hi = tab.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (tab[m].s < dd) lo = m;
      else hi = m;
    }
    const a = tab[lo], b = tab[hi];
    const f = (dd - a.s) / (b.s - a.s || 1);
    return {x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f};
  };
  const dir = (d: number) => {
    const a = at(d - 0.04), b = at(d + 0.04);
    return (Math.atan2(b.x - a.x, b.z - a.z) * 180) / Math.PI;
  };
  return {L, at, dir};
};

/** one walk: from t0 to t1 along the path, eased start and stop; stride in metres */
export type Walk = {t0: number; t1: number; path: ReturnType<typeof pathTable>; stride: number; h0: number; h1: number};
/** distance along the path at time t: an eased profile (accelerate over the first step, brake over the last) */
export const distAt = (w: Walk, t: number) => {
  const u = clamp((t - w.t0) / (w.t1 - w.t0));
  const a = Math.min(0.3, 0.5 / (w.t1 - w.t0)); // accel fraction: about half a second to reach speed
  // trapezoid velocity integrated: smooth ramp up/down
  const vmax = 1 / (1 - a);
  const f = u < a ? (vmax * u * u) / (2 * a) : u > 1 - a ? 1 - (vmax * (1 - u) * (1 - u)) / (2 * a) : vmax * (u - a / 2);
  return w.path.L * clamp(f);
};
/** plants for a walk: alternate feet each half stride, starting with `lead`; lateral offset half the hip spacing */
export const walkPlants = (w: Walk, half = 0.11, lead: 'L' | 'R' = 'L') => {
  const L: Plant[] = [], R: Plant[] = [];
  const tOf = (d: number) => {
    let lo = w.t0, hi = w.t1;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (distAt(w, m) < d) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  const place = (d: number, side: number, hDeg?: number) => {
    const p = w.path.at(d), h = ((hDeg ?? w.path.dir(d)) * Math.PI) / 180;
    // local left (+X) for heading h: (cos h, 0, -sin h)
    return {x: p.x + side * half * Math.cos(h), z: p.z - side * half * Math.sin(h)};
  };
  const n = Math.max(2, Math.round(w.path.L / (w.stride / 2)));
  const step = w.path.L / n;
  // standing plants at the start
  const s0L = place(0, 1, w.h0), s0R = place(0, -1, w.h0);
  L.push({t0: -1e3, t1: 1e3, ...s0L});
  R.push({t0: -1e3, t1: 1e3, ...s0R});
  let foot = lead;
  const times: number[] = [];
  for (let k = 1; k <= n; k++) times.push(tOf(k * step));
  for (let k = 1; k <= n; k++) {
    const d = Math.min(w.path.L, k * step + step * 0.35);
    const side = foot === 'L' ? 1 : -1;
    const tl = times[k - 1];
    const lift = 1e3;
    // the last step lands square to the final facing (so the stance is not crossed when the body turns at the end)
    const p = k === n ? place(w.path.L, side, w.h1) : place(d, side);
    (foot === 'L' ? L : R).push({t0: tl, t1: lift, ...p});
    foot = foot === 'L' ? 'R' : 'L';
  }
  // the trailing foot closes to a stand beside the last one
  const last = foot; // the foot that did not take the final step
  const tEnd = times[n - 1];
  const fin = place(w.path.L, last === 'L' ? 1 : -1, w.h1);
  (last === 'L' ? L : R).push({t0: tEnd + 0.22, t1: 1e3, ...fin});
  // each foot lifts a swing-time before its next landing (about 40% of its stride cycle), never before the walk starts
  const fix = (arr: Plant[]) => arr.forEach((p, i) => {
    if (i >= arr.length - 1) return;
    const nx = arr[i + 1].t0;
    const cyc = i === 0 ? 2 * (nx - w.t0) : nx - p.t0;
    p.t1 = Math.max(w.t0, nx - clamp(0.42 * cyc, 0.22, 0.45));
  });
  fix(L);
  fix(R);
  return {L, R};
};

/** the walking body at time t: ground point, heading, and the legs/arms/pelvis of a pose (others left as given) */
export const walkPose = (b: Body4, w: Walk, plants: {L: Plant[]; R: Plant[]}, t: number, base: Pose4) => {
  const d = distAt(w, t);
  const p = w.path.at(d);
  const moving = clamp(Math.min((t - w.t0) / 0.3, (w.t1 - t) / 0.3));
  const tan = w.path.dir(d);
  const u = clamp((t - w.t0) / (w.t1 - w.t0));
  const hd = t <= w.t0 ? w.h0 : t >= w.t1 ? w.h1 : angMix(angMix(w.h0, tan, sm(clamp((t - w.t0) / 0.35))), w.h1, sm(clamp((t - (w.t1 - 0.35)) / 0.35)));
  void u;
  const g = v3(p.x, 0, p.z);
  const fl = footAt(plants.L, t), fr = footAt(plants.R, t);
  const loc = (f: {x: number; z: number; y: number}) => {
    const q = worldToCard(g, hd, v3(f.x, 0, f.z));
    return v3(q.x, 14 + f.y * U, q.z);
  };
  const FL = loc(fl), FR = loc(fr);
  // pelvis: lowest at double support, highest mid-stance; a small side shift over the loaded foot
  const air = Math.max(fl.y, fr.y);
  const bob = moving * (-6 + 14 * clamp(air / 0.1));
  const shift = moving * (fl.contact && !fr.contact ? 4 : !fl.contact && fr.contact ? -4 : 0);
  const fwd = (FL.z - FR.z) / 60; // + when the left foot is ahead
  const sw = clamp(fwd, -1, 1) * moving;
  const pose: Pose4 = {
    ...base,
    pel: v3(shift, b.hipY + bob, 0),
    footL: FL, footR: FR, toeL: fl.toe, toeR: fr.toe,
    pitch: base.pitch + 4 * moving, twist: base.twist - 6 * sw, hipYaw: base.hipYaw + 5 * sw,
  };
  return {g, h: hd, pose, swing: sw, moving};
};
export const angMix = (a: number, b: number, u: number) => {
  let d = b - a;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return a + d * u;
};
export type {V3};
