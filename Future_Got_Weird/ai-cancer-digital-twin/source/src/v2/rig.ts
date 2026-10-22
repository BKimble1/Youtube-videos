// V2 camera rig. One rule for every move: a camera path is a list of keys interpolated with a single smooth curve
// (position linear in the eased parameter, zoom in log space), and consecutive segments share velocity at the joins
// (cubic Hermite on log-zoom and position), so there are no snaps, no overshoot and no accidental scale changes.
//
// Scale travel between worlds (body → tissue → cell → nucleus …) is a ZOOM-THROUGH: the outgoing world's camera keeps
// zooming exponentially into a target point; at the handoff the incoming world's camera starts with its counterpart
// object at the SAME screen position and SIZE and keeps the SAME log-zoom rate. The two worlds cross-dissolve over a
// short window while both cameras move identically, so the viewer sees one continuous dive.
import {Cam} from '../kit/cam';
import {clamp01} from '../kit/core';

export type K = {t: number; x: number; y: number; z: number; rot?: number};

/** Monotone cubic Hermite through keys: C1-continuous position, log-zoom and roll; holds before/after. Tangents are
 *  Fritsch–Carlson limited so a hold between two keys never overshoots. */
export const path = (keys: K[]) => {
  const n = keys.length;
  for (let i = 1; i < n; i++) if (!(keys[i].t > keys[i - 1].t)) throw new Error(`camera keys out of order at ${i}: ${keys[i - 1].t} → ${keys[i].t}`);
  const ch = (f: (k: K) => number) => {
    const v = keys.map(f);
    const d: number[] = [];
    for (let i = 0; i < n - 1; i++) d.push((v[i + 1] - v[i]) / Math.max(1e-6, keys[i + 1].t - keys[i].t));
    const m: number[] = v.map((_, i) => {
      if (i === 0 || i === n - 1) return 0; // ease in from rest, ease out to rest
      if (d[i - 1] * d[i] <= 0) return 0;
      const w1 = 2 * (keys[i + 1].t - keys[i].t) + (keys[i].t - keys[i - 1].t);
      const w2 = (keys[i + 1].t - keys[i].t) + 2 * (keys[i].t - keys[i - 1].t);
      return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    });
    return (t: number) => {
      if (t <= keys[0].t) return v[0];
      if (t >= keys[n - 1].t) return v[n - 1];
      let i = 0;
      while (i < n - 2 && t > keys[i + 1].t) i++;
      const h = keys[i + 1].t - keys[i].t, s = (t - keys[i].t) / h;
      const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
      return h00 * v[i] + h10 * h * m[i] + h01 * v[i + 1] + h11 * h * m[i + 1];
    };
  };
  const fx = ch((k) => k.x), fy = ch((k) => k.y), fz = ch((k) => Math.log(k.z)), fr = ch((k) => k.rot ?? 0);
  return (t: number): Cam => ({x: fx(t), y: fy(t), z: Math.exp(fz(t)), rot: fr(t)});
};

/** Exponential dive into world point (px, py): zoom z0 at time t0, multiplying by e^rate per second, while the camera
 *  centre glides from (x0,y0) to the target with the same exponential law (the target's screen offset shrinks
 *  smoothly — no lateral jerk). Valid for t >= t0. */
export const dive = (t: number, t0: number, x0: number, y0: number, z0: number, px: number, py: number, rate: number, glide = 1.6): Cam => {
  const u = Math.max(0, t - t0);
  const z = z0 * Math.exp(rate * u);
  const k = 1 - Math.exp(-glide * u);
  return {x: x0 + (px - x0) * k, y: y0 + (py - y0) * k, z};
};

/** Map a camera in world A to world B for a zoom-through handoff. `a` is world-A coordinates of the anchor, `b` the
 *  matching anchor in world B, `scale` = (size of the anchor object in B units) / (in A units). The returned camera
 *  shows B with the anchor at the same screen place and size as A's camera shows A's anchor. */
export const handoff = (camA: Cam, a: [number, number], b: [number, number], scale: number): Cam => ({
  // screen position of anchor in A: (a - camA.xy) * camA.z ; keep it: (b - camB.xy) * camB.z with camB.z = camA.z / scale
  x: b[0] - ((a[0] - camA.x) * camA.z) / (camA.z / scale),
  y: b[1] - ((a[1] - camA.y) * camA.z) / (camA.z / scale),
  z: camA.z / scale,
  rot: camA.rot,
});

/** Cross-dissolve weight for a handoff window [t0, t1] (smootherstep). */
export const xfade = (t: number, t0: number, t1: number) => {
  const u = clamp01((t - t0) / Math.max(1e-6, t1 - t0));
  return u * u * u * (u * (u * 6 - 15) + 10);
};

/** Numerical camera speed (screen px/s of the frame centre + log-zoom rate) for QA. */
export const camSpeed = (f: (t: number) => Cam, t: number, dt = 1 / 30) => {
  const a = f(t - dt / 2), b = f(t + dt / 2);
  return {pan: Math.hypot(b.x - a.x, b.y - a.y) * ((a.z + b.z) / 2) / dt, zoom: Math.log(b.z / a.z) / dt};
};
