// Section D1 set additions (pure: no React). The fractured slab on the crater's west rim that the Crew take cover
// behind at GAIN/BREATH (D1-9). It stands on the inner slope of the rim berm, leaning back toward the crater, so it is
// registered in ./persist.ts from the start of the film (it was always there; later sections regroup at it).
import type {Item} from '../../engine/scene';
import {prep, Prepped} from '../../engine/mesh';
import {brokenSlab} from '../../world/props';
import {V3, norm3} from '../../../kit/math';
import {groundH} from '../../world/ground';

export const COVER_SLAB = {
  o: {x: 47.78, y: groundH(47.78, 1.2) - 0.4, z: 1.15} as V3,
  U: norm3({x: 0.03, y: 0, z: 1}),
  V: norm3({x: -0.24, y: 0.97, z: 0}),
  w: 4.5, h: 2.7, thick: 0.4, seed: 4711,
};
let SLAB: Prepped | null = null;
export const coverSlabMesh = () => (SLAB ??= prep(brokenSlab(COVER_SLAB.o, COVER_SLAB.U, COVER_SLAB.V, COVER_SLAB.w, COVER_SLAB.h, COVER_SLAB.thick, COVER_SLAB.seed)));
export const coverSlabItems = (): Item[] => [{kind: 'mesh', mesh: coverSlabMesh(), key: 'd1_cover'}];
/** x of the slab's west face at world height y */
export const coverFaceX = (y: number) => COVER_SLAB.o.x + (COVER_SLAB.V.x / COVER_SLAB.V.y) * (y - COVER_SLAB.o.y);
