// V2 lab figure: the real experiment's ~1 cm cast figure (a GENERIC blocky toy minifigure silhouette: cylinder-ish head
// with a stud, trapezoid torso, block hips and legs, simple arms and round hands; NO face, NO eyes, NO brand), in the
// same chrome engine as the hero robot. It is a material, not a character.
//
// melt 0..1: the structure loses rigidity from the top and the limbs first (head, stud, arms, then torso, hips, legs),
// each part slumps under gravity, rounds off and pours into a pool that spreads on the floor; the pool's size is solved
// every frame (flow.collapse) so the figure's frontal area is conserved. The pool also exists as a floor disc in the
// world (perspective-correct in the overhead camera); hand it to streamThroughGap(s) with labPoolCircle() for the
// stream through the cage bars.
import React from 'react';
import {Cam3, P3, project} from '../world';
import {clamp, lerp, ss} from '../lib';
import {Prim, projectPrims} from './liquid/sdf';
import {ChromeBody, ChromeEnv, FloorOpts} from './liquid/Chrome';
import {collapse, unionArea} from './liquid/flow';

/** figure units: feet at 0, top of the stud at FIG.H; x right */
export const FIG = {H: 9.05};

/** the rigid figure in local 2D (x right, y DOWN = -height), groups: 1 legs, 2 hips + torso, 3 arms, 4 head */
export const labFigureLocal = (): Prim[] => {
  const P: Prim[] = [];
  for (const sd of [-1, 1]) P.push({k: 'box', x: sd * 0.52, y: -1.7, hw: 0.48, hh: 1.7, r: 0.12, rot: 0, g: 1});
  P.push({k: 'box', x: 0, y: -3.72, hw: 1.04, hh: 0.36, r: 0.1, rot: 0, g: 2});
  P.push({k: 'trap', x: 0, y: -5.32, wt: 0.84, wb: 1.06, hh: 1.24, r: 0.14, rot: 0, g: 2});
  P.push({k: 'box', x: 0, y: -6.7, hw: 0.32, hh: 0.16, r: 0.05, rot: 0, g: 2});
  for (const sd of [-1, 1]) {
    P.push({k: 'cap', ax: sd * 0.92, ay: -6.25, bx: sd * 1.32, by: -4.62, ra: 0.33, rb: 0.3, g: 3});
    P.push({k: 'c', x: sd * 1.36, y: -4.22, r: 0.3, g: 3});
  }
  P.push({k: 'box', x: 0, y: -7.72, hw: 0.8, hh: 0.86, r: 0.3, rot: 0, g: 4});
  P.push({k: 'box', x: 0, y: -8.82, hw: 0.36, hh: 0.23, r: 0.07, rot: 0, g: 4});
  return P;
};
// arms (indices 5-8) droop in toward the body early; the rest follows the top-first collapse
const DELAY = [0, 0, 0, 0, 0, 0.3, 0.3, 0.3, 0.3, 0, 0];

/** map local 2D prims (figure units) to screen: origin o (px), k px per figure unit */
export const mapPrim = (p: Prim, ox: number, oy: number, k: number, z: number): Prim => {
  const X = (x: number) => ox + x * k, Y = (y: number) => oy + y * k;
  const base = {g: p.g, z, blend: p.blend !== undefined ? p.blend * k : undefined};
  switch (p.k) {
    case 'c':
      return {...base, k: 'c', x: X(p.x), y: Y(p.y), r: p.r * k};
    case 'cap':
      return {...base, k: 'cap', ax: X(p.ax), ay: Y(p.ay), bx: X(p.bx), by: Y(p.by), ra: p.ra * k, rb: p.rb * k};
    case 'box':
      return {...base, k: 'box', x: X(p.x), y: Y(p.y), hw: p.hw * k, hh: p.hh * k, r: p.r * k, rot: p.rot};
    case 'ell':
      return {...base, k: 'ell', x: X(p.x), y: Y(p.y), rx: p.rx * k, ry: p.ry * k, rot: p.rot};
    case 'trap':
      return {...base, k: 'trap', x: X(p.x), y: Y(p.y), wt: p.wt * k, wb: p.wb * k, hh: p.hh * k, r: p.r * k, rot: p.rot};
    case 'aff':
      return {...base, k: 'aff', x: X(p.x), y: Y(p.y), ux: p.ux * k, uy: p.uy * k, vx: p.vx * k, vy: p.vy * k};
    case 'mix':
      return {...base, k: 'mix', a: mapPrim(p.a, ox, oy, k, z), b: mapPrim(p.b, ox, oy, k, z), t: p.t};
  }
};

const BLEND_RIGID = 0.06, BLEND_LIQUID = 0.9;
export const LAB_FIG_AREA = unionArea(labFigureLocal(), BLEND_RIGID);

/** the melt state in figure-local 2D (y down, floor 0): prims, blend, area, pool half-width (figure units) */
export const labFigureMelt = (melt: number, t: number) => {
  const m = clamp(melt);
  if (m <= 0) return {prims: labFigureLocal(), blend: BLEND_RIGID, area: LAB_FIG_AREA, target: LAB_FIG_AREA, poolR: 0};
  return collapse({prims: labFigureLocal(), u: m, floor: 0, t, cx: 0, delay: DELAY, blendRigid: BLEND_RIGID, blendLiquid: BLEND_LIQUID, area: LAB_FIG_AREA});
};

/** the pool as a world circle on the floor (x, d, r in world units) for streamThroughGap(s) in floor coordinates */
export const labPoolCircle = (base: P3, height: number, melt: number, t: number) => {
  const k = height / FIG.H;
  const st = labFigureMelt(melt, t);
  // a floor pool holding the figure's material: its radius grows with the frontal pool width
  return {x: base.x, y: base.d, r: Math.max(0.01, st.poolR * k * 0.95)};
};

/** screen prims of the figure at a world base (feet centre), `height` world units tall */
export const labFigurePrims = (cam: Cam3, base: P3, height: number, melt: number, t: number) => {
  const k3 = height / FIG.H;
  const o = project(cam, base);
  const k = k3 * o.s; // px per figure unit
  const st = labFigureMelt(melt, t);
  const prims = st.prims.map((p) => mapPrim(p, o.x, o.y, k, base.d));
  // the same pool as a disc lying on the floor (perspective), so an overhead camera sees a real puddle
  if (st.poolR > 0.02) {
    const R = st.poolR * k3;
    const disc = projectPrims(cam, [{k: 'disc3', p: base, rx: R, rd: R * 0.9}]);
    prims.push(...disc);
  }
  const rigid = 1 - ss(clamp(melt), 0, 0.25);
  return {prims, blend: st.blend * k, k, rigid, area: st.area, target: st.target};
};

export const LabFigure: React.FC<{
  cam: Cam3;
  t: number;
  base: P3;
  /** world units (the real figure is ~10 mm: height 10 in a millimetre world) */
  height: number;
  melt?: number;
  /** warm heat glow (AC field) 0..1 */
  warm?: number;
  env?: ChromeEnv;
  floor?: FloorOpts;
  part?: 'all' | 'back' | 'front';
  d0?: number;
}> = ({cam, t, base, height, melt = 0, warm = 0, env, floor, part = 'all', d0 = 0}) => {
  const L = labFigurePrims(cam, base, height, melt, t);
  const r = L.rigid;
  return (
    <ChromeBody
      prims={L.prims}
      blend={L.blend}
      groupBlend={[L.blend, L.blend, L.blend, L.blend, L.blend]}
      rigid={[r, r, r, r, r]}
      groupR={[1.5, 0.6, 1.2, 0.45, 0.9].map((x) => x * L.k)}
      groupBand={[1, 0, 1, 0, 1]}
      R={lerp(1.6, 2.4, ss(melt, 0.3, 1)) * L.k}
      warm={warm}
      env={env}
      floor={floor}
      depthSplit={part !== 'all' ? {d0, part} : undefined}
    />
  );
};
