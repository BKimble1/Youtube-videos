// V3 scene assembly: the world art, every resolved link as sortable solids, and ground shadows.
import {Item, Proj} from '../lib/r3';
import {add, mul, norm, sub, V3} from '../lib/v3';
import {resolve, Resolved, RigState, RB} from './rig';
import {linkItems3} from './draw';
import {groundY, shadowOf, worldArt} from './world';
import {H, H2, world} from './story';

export const linkSolids = (P: Proj, R: Resolved, mod?: (id: string) => {cut?: number; secA?: number; secB?: number} | undefined): Item[] => {
  const out: Item[] = [];
  for (const l0 of R.links) {
    const m = mod?.(l0.id);
    const l = m ? {...l0, ...m} : l0;
    out.push(...linkItems3(P, l, {A: l.jA ? R.joints[l.jA] : undefined, B: l.jB ? R.joints[l.jB] : undefined}));
  }
  return out;
};

export const shadows = (P: Proj, R: Resolved): (Item | null)[] => {
  const out: (Item | null)[] = [];
  for (const l of R.links) {
    out.push(shadowOf(P, l.Ca, l.Cb, 0.014, l.dead ? 0.12 : 0.15));
    // contact darkening under balls resting on the ground
    for (const c of [l.Ca, l.Cb]) {
      const gy = groundY(c.x, c.z);
      if (c.y - gy < RB + 0.004) out.push(shadowOf(P, add(c, mul(norm({x: 1, y: 0, z: 0}), -0.006)), add(c, {x: 0.006, y: 0, z: 0}), 0.016, 0.2));
    }
  }
  return out;
};

/** everything at time t through projector P */
export const sceneItems = (P: Proj, t: number, mod?: (id: string) => {cut?: number; secA?: number; secB?: number} | undefined, st?: RigState) => {
  const R = resolve(st ?? world(t));
  return [...worldArt(P, {H, H2}), ...shadows(P, R), ...linkSolids(P, R, mod)];
};

export {sub};
export type {V3};
