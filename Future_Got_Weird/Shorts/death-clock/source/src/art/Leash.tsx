// V4: the dog's leash as one physical prop, drawn once by Scene (between the dog and the man) in every street shot.
// It runs from the collar ring (derived from the dog's pose, so it follows the lean and the sit) in a J-shaped hang
// to the grass just ahead of the forepaws, lies on the lawn in a lazy curve, and ends in the released handle loop at
// ONE fixed world point on the grass between the dog and the man, outside his silhouette. He never holds it: his
// hands brace and clutch. When the dog is off screen the cord simply leaves the frame toward it.
// World units, depth-1 street layer; a pure function of the dog pose and the frame (the sway).
import React from 'react';
import {collarRing, dogPoint, DogPose} from './Dog';
import {INK, OUTLINE_K} from '../lib/ink';
import {shade} from '../lib/color';
import {SoftShadow} from '../lib/shade';
import {add, fmt, mul, P, V} from '../lib/math';

export const LEASH = {
  /** the collar's teal (Dog.tsx collar) */
  color: '#1CA7A0',
  light: '#9FE3DD',
  /** cord width (world units), constant in every shot */
  w: 8,
  /** the collar's contour width (Dog.tsx: Inked w = OUT * 0.8 = 6 * 1.4 * 0.8), so the cord's outline matches it */
  inkW: 6.72,
  /** the released handle: on the grass (GROUND + 62), right of his seat and left of the forepaws */
  handle: {c: {x: 780, y: 1862} as V, ang: -10, len: 78, wid: 24},
};

const rad = (a: number) => (a * Math.PI) / 180;
const bez = (p1: V, p2: V, p3: V) => `C${P(p1)} ${P(p2)} ${P(p3)}`;

/** Leash geometry (also read by QA probes). f: frame, used only for the tiny sway of the hanging part. */
export const leashGeo = (dog: DogPose, f: number) => {
  const H = LEASH.handle;
  const u: V = {x: Math.cos(rad(H.ang)), y: Math.sin(rad(H.ang))};
  const n: V = {x: -u.y, y: u.x};
  const eye = add(H.c, mul(u, H.len / 2));
  const R = collarRing(dog);
  // touchdown: tied to the dog's body (not its lean or sit), so the startle step drags it once and it never slides back
  const T = dogPoint({...dog, lean: 0, sit: 0}, 134, 12);
  const h = T.y - R.y;
  // a tiny secondary sway on the hang only (<= 3.7 units); the cord on the grass stays put
  const sw = 2.6 * Math.sin((2 * Math.PI * f) / 52) + 1.1 * Math.sin((2 * Math.PI * f) / 23 + 1);
  const h1 = {x: R.x - 3 + sw, y: R.y + 0.55 * h};
  const h2 = {x: T.x + 16 + 0.3 * sw, y: T.y - 6};
  // lying part: leaves the touchdown on the hang's own tangent, enters the handle's eye along the handle axis
  const tin = {x: -0.936, y: 0.351};
  const k = 0.38 * Math.max(Math.hypot(eye.x - T.x, eye.y - T.y), 40);
  const g1 = add(T, mul(tin, k));
  const g2 = add(eye, mul(u, k));
  // the handle: a flat teardrop loop lying on the grass, pointed at the eye
  const loop: V[] = [];
  for (let i = 0; i <= 32; i++) {
    const a = (2 * Math.PI * i) / 32;
    const r = 0.5 * (1 - Math.cos(a));
    const x = H.len / 2 - H.len * r;
    const y = (H.wid / 2) * Math.sin(a) * (0.55 + 0.45 * r);
    loop.push(add(H.c, add(mul(u, x), mul(n, y))));
  }
  const hangD = `M${P(R)} ${bez(h1, h2, T)}`;
  const groundD = `M${P(T)} ${bez(g1, g2, eye)}`;
  const loopD = `M${loop.map(P).join(' L')} Z`;
  return {R, T, eye, u, sway: sw, hangD, groundD, loopD, cordD: `${hangD} ${bez(g1, g2, eye)} ${loopD}`};
};

/** One cord, one style everywhere: ink contour, teal body, shaded side, lit edge; grass contact only where it lies. */
export const Leash: React.FC<{id: string; dog: DogPose; f: number}> = ({id, dog, f}) => {
  const g = leashGeo(dog, f);
  const H = LEASH.handle;
  const inkW = LEASH.w + 2 * OUTLINE_K * LEASH.inkW;
  const stroke = (d: string, color: string, w: number, extra: React.SVGProps<SVGPathElement> = {}) => (
    <path d={d} fill="none" stroke={color} strokeWidth={fmt(w)} strokeLinecap="round" strokeLinejoin="round" {...extra} />
  );
  const eyeFold = `M${P(add(g.eye, mul(g.u, -6)))} L${P(add(g.eye, mul(g.u, 10)))}`;
  const hook = `M${P(g.R)} L${P(add(g.R, {x: -1, y: 13}))}`;
  return (
    <g>
      {/* contact with the grass: the handle's footprint and a thin shadow under the lying cord */}
      <SoftShadow id={`${id}-hs`} c={add(H.c, {x: 3, y: 5})} rx={H.len * 0.6} ry={H.wid * 0.45} rotate={H.ang} alpha={0.22} />
      {stroke(`${g.groundD} ${g.loopD}`, '#2F3D24', LEASH.w + 4, {opacity: 0.18, transform: 'translate(2 4)'})}
      {stroke(g.cordD, INK, inkW)}
      {stroke(g.cordD, LEASH.color, LEASH.w)}
      {stroke(g.cordD, shade(LEASH.color, 0.28), LEASH.w * 0.4, {transform: 'translate(1.4 1.8)', opacity: 0.55})}
      {stroke(g.cordD, LEASH.light, 2.2, {transform: 'translate(-1.2 -1.6)', opacity: 0.8})}
      {/* stitched fold where the strap returns into the cord at the handle's eye */}
      {stroke(eyeFold, INK, LEASH.w + 6)}
      {stroke(eyeFold, shade(LEASH.color, 0.12), LEASH.w + 2)}
      {/* snap hook on the collar ring (the ring's grey) */}
      {stroke(hook, INK, 9)}
      {stroke(hook, '#C9CED4', 5.5)}
    </g>
  );
};
