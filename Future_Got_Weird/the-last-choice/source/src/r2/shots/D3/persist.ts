// Section D3: machines (and props) that outlive their shots, for later shots (src/r2/film/continuity.tsx).
//   d3_heavy1  heavy 1's wreck: blinded (119.38), pinned by the front-left shin (122.9), its rear-left knee split by the
//              breaker (124.75); gone over onto its left side across the crater's north part (lands 126.25), hull at
//              ≈ (62.8, −5.0), nose north under the girder, the free legs limp on the ground; its left side plate torn off
//              at the crash; heavy 2 walks over it at 144–149 (E/F's machines and D4 draw this instead of the tableau's
//              fallback heavy 1)
//   d3_ally    the allied drone, struck down by two drones at 141.35: on the ground at the crater's west rim, smoking
//   d3_blast   heavy 2's round on the rim crest (145.45): its smoke and the scorch, for the next shots
import type {Persist} from '../../film/continuity';
import {heavy1D3, allyPose3, ALLY_KILL_DIR, ALLY_CRASH_GROUND, BLAST_AT} from './machines';
import {EV3} from './times';
import {BLAST_DIR} from './marks';
import {allyDrone, blast} from '../../fx';
import {groundH} from '../../world/ground';

export const PERSIST_D3: Persist[] = [
  {key: 'd3_heavy1', sec: 'D3', from: EV3.knee, kind: 'heavy', spec: (T) => heavy1D3(T), note: 'heavy 1: blinded, pinned, knee split, toppled onto its left side across the crater (land 126.25); wreck'},
  {key: 'd3_ally', sec: 'D3', from: EV3.kill + 0.8, kind: 'items', note: 'the allied drone, run down at 141.35: a smoking wreck on the west rim',
    items: (_v, T) => allyDrone({key: 'd2ally', t: T, seed: 3, ground: ALLY_CRASH_GROUND, pose: allyPose3, destroyAt: EV3.kill, destroyDir: ALLY_KILL_DIR}).items},
  {key: 'd3_blast', sec: 'D3', from: EV3.blast, until: EV3.blast + 14, kind: 'items', note: 'heavy 2\'s round on the rim crest: smoke and scorch',
    items: (_v, T) => blast({at: BLAST_AT, t: T, t0: EV3.blast, key: 'd3blast', size: 2.5, terrainChips: true, groundH, ground: groundH(BLAST_AT.x, BLAST_AT.z), seed: 131, debris: 'concrete', dir: BLAST_DIR}).items},
];
