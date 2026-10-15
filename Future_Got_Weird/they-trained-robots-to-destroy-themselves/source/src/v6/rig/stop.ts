// Walk-and-stop without foot sliding. The walk covers a whole number of strides and ends with one foot just planted;
// the stop is a short step of the other foot into the ready stance while the planted foot stays exactly where it is.
// Optionally the first step starts from a given trailing-foot position (when the walk begins from a stance).
import {RPose} from '../../v4/rig/Robot2D';
import {walk, blend} from '../../v4/rig/poses';

const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const STOP_DUR = 0.36;
export type WalkStop = {
  x0: number; ground: number; s: number; n: number; stride?: number; face?: 1 | -1; o?: Partial<RPose>;
  t0: number; t1: number;          // the walk (n strides, easing out) runs t0 → t1; the stop step runs t1 → t1 + STOP_DUR
  ready: RPose;                    // must have the lead foot's target at footX(n) (see leadFootX)
  trailStartX?: number;            // where the trailing foot stands before the first step (default: one stride back)
};
/** x of the foot planted at the end of an n-stride walk (the "lead" foot: N if n is even, F if odd). */
export const leadFootX = (x0: number, s: number, n: number, stride = 150, face: 1 | -1 = 1) => x0 + face * (n + 0.25) * stride * s;
export const leadFoot = (n: number): 'N' | 'F' => (n % 2 === 0 ? 'N' : 'F');

export const walkStop = (w: WalkStop, t: number): RPose => {
  const stride = w.stride ?? 150, face = w.face ?? 1;
  const sw = stride * w.s;
  if (t < w.t1) {
    const u = seg(t, w.t0, w.t1);
    const dist = w.n * sw * (0.15 * u + 0.85 * smooth(u));
    const p = walk(w.x0, w.ground, w.s, dist, face, w.o ?? {}, stride);
    if (w.trailStartX !== undefined && dist < sw) {
      // first step: the swing foot leaves from where it actually stood
      const e = smooth(dist / sw);
      const to = w.x0 + face * 1.25 * sw;
      const ft = p.footF!;
      p.footF = {...ft, x: lerp(w.trailStartX, to, e)};
    }
    return p;
  }
  const v = smooth(seg(t, w.t1, w.t1 + STOP_DUR));
  const end = walk(w.x0, w.ground, w.s, w.n * sw, face, w.o ?? {}, stride);
  const p = blend(end, w.ready, v);
  const lead = leadFoot(w.n), trail = lead === 'N' ? 'F' : 'N';
  const key = (k: 'N' | 'F') => (k === 'N' ? 'footN' : 'footF') as 'footN' | 'footF';
  p[key(lead)] = end[key(lead)];
  const a = end[key(trail)]!, b = w.ready[key(trail)]!;
  p[key(trail)] = {x: lerp(a.x, b.x, v), y: lerp(a.y, b.y, v) - Math.sin(Math.PI * v) * 26 * w.s, pitch: 6 * Math.sin(Math.PI * v)};
  return p;
};

/** Times at which a foot lands: each whole stride of the walk, then the stop step. */
export const footfalls = (w: WalkStop): number[] => {
  const ease = (u: number) => 0.15 * u + 0.85 * smooth(u);
  const out: number[] = [];
  for (let k = 1; k <= w.n; k++) {
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (ease(m) < k / w.n) lo = m; else hi = m;
    }
    out.push(w.t0 + lo * (w.t1 - w.t0));
  }
  out.push(w.t1 + STOP_DUR * 0.9);
  return out;
};
