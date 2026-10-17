// Section C set dressing (pure: meshes and items, no React): the broken wall section the runner vaults on the west
// slope (geometry in ./ground.ts), with the rubble wedged behind it and a few bars of rebar out of its torn end. It was
// always there: registered in ./persist.ts from the start of the film, so later shots over the ridge show it too.
import type {Item, MeshItem} from '../../engine/scene';
import {prep, Prepped, slab} from '../../engine/mesh';
import {chunkMesh} from '../../world/props';
import {rebarAt} from '../../world/geom';
import {groundH} from '../../world/ground';
import {WALL, wallPoint} from './ground';

let WALLM: Prepped | null = null;
const wallMesh = () => (WALLM ??= prep({...slab(WALL.o, WALL.U, WALL.V, WALL.out.map(([u, v]) => ({u, v})), WALL.thick, 'concrete', 'concreteEdge', 'concrete'), crease: 30}));

/** rubble wedged against the wall's back and piled at its foot (x, z, size, seed, mat) */
const WEDGE: [number, number, number, number, string][] = [
  [-5.02, 1.75, 0.46, 5, 'rubble'], [-4.98, 3.42, 0.42, 12, 'rubbleDark'],
  [-5.85, 1.62, 0.3, 24, 'rubbleDark'], [-5.8, 3.62, 0.34, 8, 'rubble'],
];

export const vaultWallItems = (): Item[] => [
  {kind: 'mesh', mesh: wallMesh(), key: 'cWall'} as MeshItem,
  ...WEDGE.map(([x, z, s, seed, mat], i) => ({
    kind: 'mesh', mesh: chunkMesh(seed, mat), key: `cWallW${i}`, xf: {pos: {x, y: groundH(x, z) - s * 0.18, z}, scale: s, yaw: seed * 41}, asObject: true,
  } as MeshItem)),
  // bars out of the torn north end
  ...rebarAt('cWallReb', wallPoint(0.05, 0.62, 0.12), {x: -0.15, y: 0.5, z: -0.85}, 3, 0.55, 77),
];
