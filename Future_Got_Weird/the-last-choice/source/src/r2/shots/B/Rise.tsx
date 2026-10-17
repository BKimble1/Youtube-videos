// B1 (9.30–12.40): ground level on the crest, looking west across the rubble — his bloodied right hand comes out from
// under the slab and braces palm-down; chips skitter. B2 (12.40–16.76): low, south-east of him, looking north-west and
// up — the rise in distinct poses (drag, chest up, a knee under him, the rebar, weight onto the foot, standing).
import React from 'react';
import {Stage, useShotTime, camPath} from '../../film/stage';
import {V3, add3, clamp, rnd} from '../../../kit/math';
import type {Item, View} from '../../engine';
import {project} from '../../engine';
import {figureRig} from '../../rig';
import {groundH} from '../../world/ground';
import {chunkMesh} from '../../world/props';
import {chips3, dust3} from '../../fx';
import {TB, HAND_OUT, R0, R1, rootB, REBAR, dirB} from './director';
import {slabItem, chunkItems, chunkHits, slabPoint, supportItems, SLAB_SOUTH_Z} from './rubble';
import {dirSpec, dirSprite, dirShaded, underShade, rebarItems, motes, B_COLUMNS} from './kit';
import {CAM_B1, CAM_B2} from './cams';
import {figureSprite} from '../../rig';
import {M} from '../../timing';

const gp = (x: number, z: number, up = 0): V3 => ({x, y: groundH(x, z) + up, z});

/** foreground rubble near the lens (static set dressing for the two close shots) */
const fgChunk = (key: string, x: number, z: number, size: number, seed: number, yaw: number, o: {bias?: number; mat?: string} = {}): Item => ({
  kind: 'mesh', mesh: chunkMesh(seed, o.mat ?? 'rubble'), key, xf: {pos: {x, y: groundH(x, z) - size * 0.15, z}, scale: size, yaw}, asObject: true, bias: o.bias,
});

// ------------------------------------------------------------------ B1
/** grit and small broken stones around where the hand lands (kept off the palm's spot and the arm's path) */
const GRAVEL: Item[] = (() => {
  const out: Item[] = [];
  const h = HAND_OUT;
  for (let i = 0; out.length < 46 && i < 400; i++) {
    const a = rnd(i * 3 + 1) * Math.PI * 2, r = 0.1 + Math.pow(rnd(i * 7 + 2), 0.7) * 0.55;
    const x = h.x + Math.cos(a) * r, z = h.z + Math.sin(a) * r;
    if (Math.hypot(x - h.x, z - h.z) < 0.14) continue;
    if (z < h.z - 0.05 && x < h.x + 0.1 && x > h.x - 0.45) continue; // the forearm's path under the slab edge
    const s = 0.025 + Math.pow(rnd(i * 11 + 3), 2.2) * 0.075;
    out.push(fgChunk(`b1g${i}`, x, z, s, 7 + i, rnd(i * 13) * 360, {mat: rnd(i * 17) > 0.5 ? 'rubble' : rnd(i * 19) > 0.5 ? 'rubbleDark' : 'concrete'}));
  }
  return out;
})();
export const B1_START = M.SOLO, B1_END = 12.4;
export const ShotB1: React.FC = () => {
  const {t, T} = useShotTime(B1_START);
  const h = HAND_OUT;
  const cam = camPath(CAM_B1, t, 0.3);
  const anchor = add3(h, {x: -0.07, y: 0.05, z: -0.05});
  const items = (v: View): Item[] => {
    return [
      underShade(T, R0, 0.9, 0.55),
      dirShaded(T, {anchor, bias: 1.2, k: 0.74, full: true, edge: {p: {x: 0, y: 0, z: SLAB_SOUTH_Z}, n: {x: 0, y: 0, z: 1}}}),
      slabItem(T, {bias: 2.5}), ...supportItems(),
      ...chunkItems(T),
      // chips kicked out from under the palm when it slaps down, and the dust it raises
      ...chips3({at: add3(h, {x: 0, y: 0.01, z: 0}), t: T, t0: TB.slap, key: 'b1chips', seed: 4, n: 9, dir: {x: 0.6, y: 0.55, z: 0.25}, spread: 70, speed: [0.5, 1.6], size: [0.006, 0.018], ground: h.y - 0.02, life: 6}),
      ...chips3({at: add3(h, {x: 0.06, y: 0.01, z: -0.05}), t: T, t0: TB.slap + 0.02, key: 'b1chipsB', seed: 9, n: 6, dir: {x: -0.2, y: 0.5, z: -0.8}, spread: 60, speed: [0.3, 1.1], size: [0.005, 0.014], ground: h.y - 0.02, life: 6}),
      ...dust3({at: h, t: T, t0: TB.slap, key: 'b1dust', seed: 3, n: 6, speed: 0.35, size: 0.035, grow: 0.12, life: 1.8, rise: 0.08, color: '#A89A8A', opacity: 0.7}),
      ...dust3({at: slabPoint(0.95, 0.35, T), t: T, t0: TB.strain, key: 'b1trickle', seed: 5, n: 4, dir: {x: 0, y: -1, z: 0}, spread: 20, speed: 0.15, size: 0.02, grow: 0.06, life: 1.6, rise: -0.05, color: '#B0A494', opacity: 0.55}),
      // the rubble at the hand: grit and small stones (the macro set for this close)
      ...GRAVEL,
      // the hand's contact shadow on the rubble (grows as the palm comes down)
      {kind: 'sprite', key: 'b1hs', pos: h, bias: 0.9, draw: (c) => {
        const hr = dirB(T).world.handR ?? h;
        const lift = Math.max(0, hr.y - h.y);
        const k = clamp(1 - lift / 0.12) * clamp((T - TB.slideOut) / 0.3);
        if (k <= 0.01) return null;
        const s = project(c.view, {x: hr.x + 0.02, y: h.y - 0.01, z: hr.z + 0.02});
        return <ellipse cx={s.x} cy={s.y} rx={0.1 * s.k} ry={0.05 * s.k} fill="#0E0B0A" opacity={0.45 * k} />;
      }},
      ...motes('b1m', add3(h, {x: 0.1, y: 0.18, z: 0}), {x: 0.4, y: 0.2, z: 0.4}, T, 30, 0.004),
    ];
  };
  return <Stage T={T} cam={cam} items={items} drift={0.004} atmos={{haze: 0.4}} vignette={0.75} black={clamp(1 - t / 0.35)} />;
};

// ------------------------------------------------------------------ B2
export const B2_START = 12.4, B2_END = M.ORCH;
export const ShotB2: React.FC = () => {
  const {t, T} = useShotTime(B2_START);
  const cam = camPath(CAM_B2, t, 0.6);
  const items = (v: View): Item[] => {
    const hits = chunkHits();
    return [
      underShade(T, R0, 0.85, 0.5),
      dirShaded(T, {bias: 0.9, k: 0.55}),
      // while he is under the slab it covers him; once he is out it lies behind him (from this side)
      slabItem(T, {bias: T < TB.chestUp - 0.1 ? 2.2 : -1.2}), ...supportItems(),
      ...chunkItems(T),
      ...rebarItems(T, {bias: 1.4}),
      // effort dust: palms, knees, the slab dropping back, the chunks landing
      ...dust3({at: slabPoint(0.9, 0.5, T), t: T, t0: TB.slabLand, key: 'b2slab', seed: 7, n: 9, dir: {x: 0.6, y: 0.3, z: 0.4}, spread: 80, speed: 1.1, size: 0.12, grow: 0.45, life: 2.2, rise: 0.15, color: '#A3978A', opacity: 0.75}),
      ...chips3({at: slabPoint(0.98, 0.45, T), t: T, t0: TB.slabLand, key: 'b2slabC', seed: 8, n: 7, dir: {x: 1, y: 0.4, z: 0.2}, spread: 60, speed: [0.8, 2.2], size: [0.02, 0.05], ground: groundH(1.1, 1.6), life: 5}),
      ...hits.flatMap((hh, i) => dust3({at: hh.p, t: T, t0: hh.t, key: `b2ch${i}`, seed: 20 + i, n: 4, speed: 0.4, size: 0.07, grow: 0.25, life: 1.4, color: '#A3978A', opacity: 0.6})),
      ...dust3({at: gp(R1.x - 0.45, R1.z + 0.12, 0.05), t: T, t0: TB.knee, key: 'b2knee', seed: 11, n: 5, speed: 0.5, size: 0.06, grow: 0.25, life: 1.5, color: '#A3978A', opacity: 0.6}),
      ...dust3({at: gp(R1.x + 0.3, R1.z - 0.15, 0.03), t: T, t0: TB.kneel, key: 'b2foot', seed: 12, n: 5, speed: 0.5, size: 0.06, grow: 0.25, life: 1.5, color: '#A3978A', opacity: 0.6}),
      ...chips3({at: REBAR.grip, t: T, t0: TB.rebar, key: 'b2rust', seed: 13, n: 5, dir: {x: 0, y: -1, z: 0}, spread: 40, speed: [0.1, 0.4], size: [0.004, 0.01], ground: REBAR.base.y, life: 4, material: 'brick'}),
      fgChunk('b2fg1', R1.x + 1.15, R1.z + 2.05, 0.42, 17, 20, {bias: 0.3}),
      fgChunk('b2fg2', R1.x + 0.55, R1.z + 2.45, 0.3, 19, 65, {mat: 'rubbleDark'}),
      ...motes('b2m', gp(R1.x + 0.8, R1.z + 1.4, 0.9), {x: 1.2, y: 0.7, z: 1.2}, T, 26, 0.008),
    ];
  };
  return <Stage T={T} cam={cam} items={items} drift={0.012} atmos={{columns: B_COLUMNS}} vignette={0.6} />;
};
void [figureRig, R1, dirSpec, dirSprite, figureSprite];
