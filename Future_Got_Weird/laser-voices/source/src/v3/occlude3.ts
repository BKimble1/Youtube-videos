// The companion's outline on screen (L0), for cutting the drawn path exactly where it meets her silhouette while she
// blocks it: head (with the bun), neck and torso, posed as ClerkFigure poses them.
import {P, Pt, rot} from './lib3';
import {figXf, GROUND_U, pp, EXIT, EAR, v3} from './world3';
import {CHEAD_PTS, CNECK} from './art/Clerk';
import {clerkBody, clerkHead, clerkFeet} from './story3';

const NECKQ = [P(-40, 180), P(-46, 300), P(60, 300), P(56, 190)];
const TORSOQ = [P(100, 262), P(-30, 258), P(-150, 320), P(-170, 520), P(-172, 880), P(190, 890), P(200, 600), P(180, 300)];
const BUN = Array.from({length: 12}, (_, i) => P(110 + 78 * Math.cos((i / 12) * 2 * Math.PI), -370 + 78 * Math.sin((i / 12) * 2 * Math.PI)));
export const clerkOutline = (t: number, xp?: number): Pt[][] => {
  const b = clerkBody(t), h = clerkHead(t), ft = clerkFeet(t), f = figXf(xp === undefined ? ft : {...ft, x: xp});
  const lean = (q: Pt) => rot(q, -b.lean, P(0, GROUND_U));
  const L0 = (q: Pt) => P(f.x + q.x * f.k, f.y + q.y * f.k);
  const upper = (q: Pt) => L0(lean(P(q.x, q.y + b.bob)));
  const head = (q: Pt) => upper(rot(q, h.tilt, CNECK));
  return [CHEAD_PTS.map(head), BUN.map(head), NECKQ.map(upper), TORSOQ.map(upper)];
};
export const inPoly = (p: Pt, poly: Pt[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], q = poly[j];
    if (a.y > p.y !== q.y > p.y && p.x < ((q.x - a.x) * (p.y - a.y)) / (q.y - a.y) + a.x) c = !c;
  }
  return c;
};
// the drawn path (source -> ear) on screen: where it first meets her outline, if it does
const pathPt = (u: number) => pp(v3(EXIT.x + (EAR.x - EXIT.x) * u, EXIT.y + (EAR.y - EXIT.y) * u, EXIT.z + (EAR.z - EXIT.z) * u));
const SAMPLES = Array.from({length: 401}, (_, i) => i / 400);
export const screenEntry = (t: number, xp?: number): number | null => {
  const polys = clerkOutline(t, xp);
  for (const u of SAMPLES) {
    const q = pathPt(u);
    if (polys.some((pl) => inPoly(q, pl))) return u;
  }
  return null;
};
export const screenBlocked = (t: number, xp?: number) => screenEntry(t, xp) !== null;
