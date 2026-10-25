// Glass Climbing V2: one wedge's shape under load, against any surface profile (V1's scenes/Micro.tsx wedgeShape, with
// the surface given as a function, so the 2.5D field can vary it across the tile). Section coordinates in microns:
// x toward the backing (the surface is at x <= 0), y down, the wedge rooted at R on the backing face.
import {add, clamp, lerp, lerpV, mul, norm, perp, sub, V} from '../dc/math';
import {MW} from '../scenes/Micro';

export const D0: V = norm({x: -Math.cos((MW.lean * Math.PI) / 180), y: Math.sin((MW.lean * Math.PI) / 180)});
/** the backing's face when the tips just touch a surface at x = 0 */
export const B0 = MW.L * Math.cos((MW.lean * Math.PI) / 180) + 1;

export type WedgeShape = {left: V[]; right: V[]; strip: [V, V] | null; gap: number; root: V; tip: V; touching: boolean; l: number};

/** `surf(y)`: the surface's x at height y (<= 0); `stiff` < 1 for a surface the tips cannot follow (brick: the few
 *  tips on a peak bend only a little before the backing drags them off) */
export const wedgeShape2 = (R: V, lam: number, surf: (y: number) => number, stiff = 1): WedgeShape => {
  const tip0 = add(R, mul(D0, MW.L));
  const sx = surf(tip0.y);
  const reach = tip0.x - sx;
  const touching = reach < 1.5;
  const l = touching ? clamp(lam) * stiff : 0;
  const c = MW.contact * l * (stiff < 1 ? 0.35 : 1);
  const straight: V[] = [add(R, mul(D0, -10))];
  for (let i = 0; i <= 16; i++) straight.push(add(R, mul(D0, (MW.L * i) / 16)));
  for (let i = 1; i <= 6; i++) straight.push(straight[17]);
  let pts: V[] = straight;
  const dirs: (V | null)[] = Array(24).fill(null);
  let strip: [V, V] | null = null;
  let gap = 0;
  if (touching && l >= 0.001) {
    const hair = l < 0.88 ? 0.85 * Math.min(1, l / 0.3) : (0.85 * Math.max(0, 1 - l)) / 0.12;
    const Q0x = sx + MW.tc * Math.min(1, 0.4 + l * 4) + hair;
    const rem = (MW.L - c) * lerp(1, 0.93, Math.min(1, l * 3));
    const dx = R.x - Q0x;
    const dy = Math.sqrt(Math.max(1, rem * rem - dx * dx));
    const Q: V = {x: Q0x, y: R.y + dy};
    const tq = norm(lerpV(D0, {x: 0, y: 1}, Math.min(1, l * 6)));
    const b: V[] = [add(R, mul(D0, -10))];
    const c1 = add(R, mul(D0, rem * 0.38));
    const c2 = sub(Q, mul(tq, rem * 0.38));
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, u = 1 - t;
      b.push({x: u * u * u * R.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * Q.x, y: u * u * u * R.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * Q.y});
    }
    for (let i = 1; i <= 6; i++) b.push({x: Q.x, y: Q.y + (c * i) / 6});
    const ds = norm(lerpV(tq, {x: 0, y: 1}, Math.min(1, c / (2 * MW.tc))));
    for (let i = 17; i < 24; i++) dirs[i] = ds;
    const kb = Math.min(1, l / 0.15);
    pts = b.map((p, i) => lerpV(straight[i], p, kb));
    gap = Q0x - MW.tc - sx;
    strip = [{x: sx, y: Q.y - 1}, {x: sx, y: Q.y + c}];
  }
  const n = pts.length;
  const left: V[] = [], right: V[] = [];
  let d0: V = D0;
  const k = strip ? Math.min(1, l / 0.15) : 0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], bb = pts[Math.min(n - 1, i + 1)];
    const ab = sub(bb, a);
    const d = dirs[i] ?? (Math.hypot(ab.x, ab.y) > 1e-3 ? norm(ab) : d0);
    d0 = d;
    const nn = perp(d);
    const t = Math.min(1, i / 17);
    const h = lerp(MW.wb / 2, lerp(1.2, MW.tc, k), t ** 0.85);
    left.push(add(pts[i], mul(nn, h)));
    right.push(add(pts[i], mul(nn, -h)));
  }
  return {left, right, strip, gap, root: R, tip: pts[n - 1], touching, l};
};
