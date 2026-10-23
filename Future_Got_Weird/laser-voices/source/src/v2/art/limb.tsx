// Limb drawing in the Crew stroke construction (as the Contacts arms): an ink outline stroke under a colour stroke,
// round caps, so an upper segment and a lower segment join in a clean elbow or knee. 2-bone IK places the joint.
import React from 'react';
import {Pt, P, clamp, f3} from '../lib2';
import {C} from '../theme2';

// joint position for root a, end b, segment lengths l1, l2; bend = +1 / -1 picks the side (screen: +1 = clockwise)
export const ik = (a: Pt, b: Pt, l1: number, l2: number, bend: number): Pt => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  const ca = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const ang = Math.atan2(dy, dx) + bend * Math.acos(clamp(ca, -1, 1));
  return P(a.x + Math.cos(ang) * l1, a.y + Math.sin(ang) * l1);
};
// end point clamped to the reachable distance (so a target never stretches a limb)
export const reach = (a: Pt, b: Pt, l: number): Pt => {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  if (d <= l) return b;
  return P(a.x + ((b.x - a.x) * l) / d, a.y + ((b.y - a.y) * l) / d);
};
const seg = (a: Pt, b: Pt) => `M${f3(a.x)} ${f3(a.y)}L${f3(b.x)} ${f3(b.y)}`;
// a two-segment limb: widths w1 (upper) and w2 (lower), fill colours c1 and c2, ink outline `ol`
export const Limb: React.FC<{a: Pt; j: Pt; b: Pt; w1: number; w2: number; c1: string; c2?: string; ol?: number; ink?: string}> = ({a, j, b, w1, w2, c1, c2, ol = 7, ink = C.ink}) => (
  <g>
    <path d={seg(a, j)} stroke={ink} strokeWidth={w1 + ol} strokeLinecap="round" fill="none" />
    <path d={seg(j, b)} stroke={ink} strokeWidth={w2 + ol} strokeLinecap="round" fill="none" />
    <path d={seg(a, j)} stroke={c1} strokeWidth={w1} strokeLinecap="round" fill="none" />
    <path d={seg(j, b)} stroke={c2 ?? c1} strokeWidth={w2} strokeLinecap="round" fill="none" />
  </g>
);
// a tapered segment as a filled quad with round ends (thigh/shin with trouser taper)
export const Taper: React.FC<{a: Pt; b: Pt; wa: number; wb: number; fill: string; ol?: number}> = ({a, b, wa, wb, fill, ol = 3.4}) => {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  const d = `M${f3(a.x + nx * wa / 2)} ${f3(a.y + ny * wa / 2)}L${f3(b.x + nx * wb / 2)} ${f3(b.y + ny * wb / 2)}A${wb / 2} ${wb / 2} 0 0 0 ${f3(b.x - nx * wb / 2)} ${f3(b.y - ny * wb / 2)}L${f3(a.x - nx * wa / 2)} ${f3(a.y - ny * wa / 2)}A${wa / 2} ${wa / 2} 0 0 0 ${f3(a.x + nx * wa / 2)} ${f3(a.y + ny * wa / 2)}Z`;
  return <path d={d} fill={fill} stroke={C.ink} strokeWidth={ol} strokeLinejoin="round" />;
};

// a jointed leg (or any 2-segment tapered limb): both outlines first, then both fills, so the knee is seamless
const quad = (a: Pt, b: Pt, wa: number, wb: number) => {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  return `M${f3(a.x + nx * wa / 2)} ${f3(a.y + ny * wa / 2)}L${f3(b.x + nx * wb / 2)} ${f3(b.y + ny * wb / 2)}A${wb / 2} ${wb / 2} 0 0 0 ${f3(b.x - nx * wb / 2)} ${f3(b.y - ny * wb / 2)}L${f3(a.x - nx * wa / 2)} ${f3(a.y - ny * wa / 2)}A${wa / 2} ${wa / 2} 0 0 0 ${f3(a.x + nx * wa / 2)} ${f3(a.y + ny * wa / 2)}Z`;
};
export const Leg: React.FC<{hip: Pt; knee: Pt; ank: Pt; w: [number, number, number]; fill: string; crease?: string}> = ({hip, knee, ank, w, fill, crease}) => {
  const d1 = quad(hip, knee, w[0], w[1]), d2 = quad(knee, ank, w[1], w[2]);
  return (
    <g>
      <path d={d1} fill={C.ink} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
      <path d={d2} fill={C.ink} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
      <path d={d1} fill={fill} />
      <path d={d2} fill={fill} />
      {crease && <path d={`M${f3(knee.x)} ${f3(knee.y + 20)} L${f3(ank.x)} ${f3(ank.y - 40)}`} stroke={crease} strokeWidth={6} opacity={0.5} strokeLinecap="round" />}
    </g>
  );
};
