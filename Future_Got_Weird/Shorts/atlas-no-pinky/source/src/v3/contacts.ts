/**
 * Pure geometry used by the contact check (tools/check_contacts.mjs): how far each rendered fingertip pad is from
 * the object it claims to hold. A digit is drawn as a round-capped capsule of width `def.w` swept along its three
 * segments, so the visible pad surface is the distal segment's centre line offset by w/2 (hand scale applied).
 */
import {LAYOUTS, ptsWorld, V, Place, HandPose, DigitName} from '../hand/Hand';

export const OUTLINE_PX = 4; // ink outline drawn around every digit (half of it is outside the capsule)

const segDist = (p: V, a: V, b: V): number => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

/** distance between two segments (min over endpoint-to-segment distances; segments do not cross in our poses) */
const segSeg = (a: V, b: V, c: V, d: V): number => Math.min(segDist(a, c, d), segDist(b, c, d), segDist(c, a, b), segDist(d, a, b));

export const polyEdges = (poly: V[]): [V, V][] => poly.map((p, i) => [p, poly[(i + 1) % poly.length]] as [V, V]);

/** rotated square (centre, side, degrees) corners */
export const squareCorners = (c: V, s: number, rotDeg: number): V[] => {
  const t = (rotDeg * Math.PI) / 180, h = s / 2;
  return [[-h, -h], [h, -h], [h, h], [-h, h]].map(([x, y]) => ({x: c.x + x * Math.cos(t) - y * Math.sin(t), y: c.y + x * Math.sin(t) + y * Math.cos(t)}));
};

/** visible gap (px) between a digit's pad capsule and a convex polygon; <= 0 means touching or overlapping */
export const padGap = (kind: 'robot' | 'human', view: 'front' | 'side', name: DigitName, pose: HandPose, pl: Place, poly: V[]): number => {
  const def = LAYOUTS[`${kind}-${view}`].digits[name]!;
  const pts = ptsWorld(kind, view, name, pose, pl);
  const a = pts[2], b = pts[3];
  const r = (def.w / 2) * pl.scale + OUTLINE_PX / 2;
  let best = Infinity;
  for (const [c, d] of polyEdges(poly)) best = Math.min(best, segSeg(a, b, c, d));
  // tip inside the polygon -> negative
  const inside = polyEdges(poly).every(([c, d]) => (d.x - c.x) * (b.y - c.y) - (d.y - c.y) * (b.x - c.x) >= 0) || polyEdges(poly).every(([c, d]) => (d.x - c.x) * (b.y - c.y) - (d.y - c.y) * (b.x - c.x) <= 0);
  return (inside ? -best : best) - r;
};

/** visible gap between a digit's pad capsule and a circle (centre c, radius r) */
export const padGapCircle = (kind: 'robot' | 'human', view: 'front' | 'side', name: DigitName, pose: HandPose, pl: Place, c: V, r: number): number => {
  const def = LAYOUTS[`${kind}-${view}`].digits[name]!;
  const pts = ptsWorld(kind, view, name, pose, pl);
  return segDist(c, pts[2], pts[3]) - r - (def.w / 2) * pl.scale - OUTLINE_PX / 2;
};

const cross = (o: V, a: V, b: V) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
const segsCross = (a: V, b: V, c: V, d: V) => cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
const insidePoly = (p: V, poly: V[]) => {
  let inside = false;
  for (const [a, b] of polyEdges(poly)) if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  return inside;
};
/** signed distance from a segment to a polygon (negative when they overlap) */
export const segPolyDist = (a: V, b: V, poly: V[]): number => {
  let d = Infinity;
  for (const [c, e] of polyEdges(poly)) d = Math.min(d, segSeg(a, b, c, e));
  const hit = insidePoly(a, poly) || insidePoly(b, poly) || polyEdges(poly).some(([c, e]) => segsCross(a, b, c, e));
  return hit ? -d : d;
};

/**
 * Where must a fingertip be so that its pad capsule (distal segment of length `segLen` pointing along `dir`, pad radius `r`) just
 * touches the polygon? Search outward from the polygon centre `c` along `axis*side`, with the tip held `fwd` px ahead along `dir`.
 * `overlap` (px) lets the pad sink slightly into the object so the two ink outlines read as pressed together.
 */
export const solveTip = (poly: V[], c: V, axis: V, dir: V, side: 1 | -1, fwd: number, segLen: number, r: number, overlap = 3): V => {
  const at = (d: number): V => ({x: c.x + axis.x * side * d + dir.x * fwd, y: c.y + axis.y * side * d + dir.y * fwd});
  const clear = (d: number) => {
    const tip = at(d);
    return segPolyDist({x: tip.x - dir.x * segLen, y: tip.y - dir.y * segLen}, tip, poly) - r + overlap;
  };
  let lo = 0, hi = 400;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (clear(mid) < 0) lo = mid; else hi = mid;
  }
  return at(hi);
};
