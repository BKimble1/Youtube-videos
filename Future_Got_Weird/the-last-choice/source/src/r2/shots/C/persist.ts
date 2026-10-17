// Section C: machines (and props) that outlive their shots — wrecks, fallen units, pinned heavies — so later shots
// show them where they fell. Pure data/specs only (no React). See src/r2/film/continuity.tsx.
//
// C breaks no machine. It adds one piece of set dressing on the ridge's west slope: the broken wall section the runner
// vaults (≈ x −5.5, z 1.5 … 3.7; see ./ground.ts WALL), registered from the start of the film (it was always there).
import type {Persist} from '../../film/continuity';
import {vaultWallItems} from './props';

export const PERSIST_C: Persist[] = [
  {key: 'c_wall', sec: 'C', from: 0, kind: 'items', items: () => vaultWallItems(), note: 'broken wall section on the ridge west slope terrace (x ≈ −5.5, z 1.5 … 3.7): the runner vaults it in C3'},
];
