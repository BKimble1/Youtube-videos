// Reveal masks for the flank cutaway (screen-space paths, anchored to the body): a feather-tipped edge that sweeps
// across the near flank (opened and closed by the wing's downstrokes), and a radial reveal around a body point.
import {clamp, lerp} from './lib';
import {Basis, Frame, poly, proj, V2, xf} from './three';

// ------------------------------------------------------------------ reveal masks (screen-space paths, anchored to the body)
/** z of the near body surface at body-local (x, y) (chest/rear ellipsoids), so a mask drawn on the flank projects onto it */
export const surfZ = (x: number, y: number) => {
  const a = 1 - ((x - 2) / 10.5) ** 2 - (y / 7) ** 2;
  const b = 1 - ((x + 7.5) / 8.5) ** 2 - ((y - 0.7) / 5.3) ** 2;
  return Math.max(7.2 * Math.sqrt(Math.max(0.03, a)), 5.6 * Math.sqrt(Math.max(0.03, b)));
};
const X0 = -6, X1 = 10.5, YT = 7.0, YB = -8.0;
const onFlank = (B: Basis, F: Frame, x: number, y: number): V2 => {
  const p = proj(B, xf(F, [x, y, surfZ(x, y) + 0.3]));
  return {x: p.x, y: p.y};
};
/** a feather-tipped edge across the flank at fraction e (0 = top of the window, 1 = bottom); open 'above' or 'below' it */
export const sweepPath = (B: Basis, F: Frame, e: number, mode: 'above' | 'below') => {
  if (mode === 'above' && e <= 0) return null;
  if (mode === 'below' && e >= 1) return null;
  const yc = lerp(YT - 0.3, YB + 0.3, clamp(e));
  const edge: V2[] = [];
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const x = lerp(X1, X0, i / n);
    // a wing-like trailing edge: tilted down toward the tail, with feather-tip scallops
    const y = yc + 0.16 * (x - 2.5) - 0.22 * Math.abs(Math.sin((x * Math.PI) / 1.7)); // soft feather-tip scallops
    edge.push(onFlank(B, F, x, y));
  }
  const far = mode === 'above' ? YT + 3 : YB - 3;
  // edge runs from X1 back to X0, so [cap at X0, cap at X1, edge] is a simple closed polygon
  return poly([onFlank(B, F, X0, far), onFlank(B, F, X1, far), ...edge]);
};
/** a radial reveal around body-local centre c (feather-tipped rim) of radius r cm */
export const radialPath = (B: Basis, F: Frame, c: [number, number], r: number) => {
  if (r <= 2.6) return null; // no pinhole or leftover dot: the window appears and leaves at a readable size
  const pts: V2[] = [];
  const n = 120; // a smooth round iris (no visible facets)
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r;
    pts.push(onFlank(B, F, c[0] + rr * Math.cos(a), c[1] + rr * Math.sin(a) * 0.9));
  }
  return poly(pts);
};

