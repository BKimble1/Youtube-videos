import type {Look} from '../components/Character';
import {CAST} from '../components/cast';

/**
 * Geometry helpers for placing the cutout rig so that a chosen foot sits exactly on a world point, whatever the lean and leg swing.
 * The rig leans about its hip pivot (local 0,-150) and swings each leg about its hip joint (local +-33,-165) before that (see Character.tsx).
 */
export const SC = 1.5; // hero scale: 440 px figure -> ~660 px on the 1080x1920 canvas
const rad = (d: number) => (d * Math.PI) / 180;
const rot = (x: number, y: number, a: number) => ({x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a)});

/** Offset (world px) from the hip pivot to the centre of the shoe on `side` (-1 viewer-left, +1 viewer-right). */
export const footOffset = (theta: number, swing: number, side: -1 | 1, sc = SC) => {
  const P = {x: 33 * side, y: -165};
  const A = {x: 34 * side, y: -6};
  const d = rot(A.x - P.x, A.y - P.y, rad(swing));
  const a1 = {x: P.x + d.x, y: P.y + d.y};
  const e = rot(a1.x, a1.y + 150, rad(theta)); // lean pivot at (0,-150)
  return {x: e.x * sc, y: e.y * sc}; // relative to the hip pivot (y already includes the +150 ground offset)
};

/** Hip pivot position that puts the shoe centre of `side` at (fx, fy). */
export const hipsFromFoot = (fx: number, fy: number, theta: number, swing: number, side: -1 | 1, sc = SC) => {
  const o = footOffset(theta, swing, side, sc);
  return {x: fx - o.x, y: fy - o.y};
};
/** Character (x, y) props for a given hip pivot position: the rig's ground point is 150*sc below the pivot. */
export const charXY = (hipX: number, hipY: number, sc = SC) => ({x: hipX, y: hipY + 150 * sc});

/** The blue-jacket, high-bun cast member (clerkB) in street clothes: same face, hair, skin, cardigan and glasses; the work nametag is dropped. */
export const HERO_LOOK: Look = {...CAST.clerkB, accessories: ['glasses', 'earring']};
