// The graveyard: other ants that died the same way on nearby leaves, each with its own pose and stage of the fungus
// (fresh: only white mycelium at the joints; then a short stalk; then a full stalk with its cushion; old: paler, the
// stalk weathered). Spread through the understory around plant P2, at different heights and distances.
import {add3, norm3, orbitCam, unproj, V3} from '../core/three';
import {WIDE_END} from './shots';
import {frame, rotA, toW} from '../core/frame';
import {AntState} from '../ant/rig';
import {hash} from '../lib';
import {Leaf} from './plant';
import {biteAnchor, biteState} from './story';
import {StalkSpec} from '../fungus/fungus';

export type Grave = {id: string; leaf: Leaf; extra: Leaf[]; stem: V3[]; ub: number; st: AntState; sp: StalkSpec; g: number; asc: number; open: number; teth: number; age: number};
// placed in the final wide frame's own screen space (x, y in px at 1080 x 1920, depth in mm from the lens), so each
// dead ant lands where it reads; the stage of the fungus, the pose and the leaf vary from ant to ant
type Spec = {id: string; sx: number; sy: number; d: number; az: number; L: number; droop: number; ub: number; roll: number; hang: number; g: number; asc: number; teth: number; age: number; hold: boolean; len: number};
const SPECS: Spec[] = [
  {id: 'G1', sx: 230, sy: 600, d: 118, az: 140, L: 30, droop: 20, ub: 0.42, roll: 14, hang: 6, g: 1, asc: 1, teth: 1, age: 0.9, hold: true, len: 19},
  {id: 'G2', sx: 800, sy: 470, d: 200, az: 20, L: 28, droop: 14, ub: 0.38, roll: -18, hang: 12, g: 0.55, asc: 0, teth: 0.8, age: 0.2, hold: false, len: 16},
  {id: 'G3', sx: 400, sy: 760, d: 290, az: 200, L: 30, droop: 18, ub: 0.4, roll: 8, hang: 3, g: 0, asc: 0, teth: 0.55, age: 0, hold: true, len: 15},
  {id: 'G4', sx: 870, sy: 960, d: 138, az: 120, L: 32, droop: 22, ub: 0.45, roll: -10, hang: 9, g: 1, asc: 1, teth: 1, age: 0.4, hold: false, len: 17},
  {id: 'G5', sx: 170, sy: 1120, d: 190, az: 60, L: 26, droop: 12, ub: 0.36, roll: 20, hang: 14, g: 0.3, asc: 0, teth: 0.7, age: 0.1, hold: true, len: 15},
  {id: 'G6', sx: 620, sy: 300, d: 245, az: 250, L: 28, droop: 18, ub: 0.4, roll: -6, hang: 4, g: 0.85, asc: 0.8, teth: 0.9, age: 0.3, hold: false, len: 18},
  {id: 'G7', sx: 690, sy: 1210, d: 330, az: 160, L: 30, droop: 16, ub: 0.44, roll: 12, hang: 8, g: 1, asc: 1, teth: 1, age: 1, hold: false, len: 20},
  {id: 'G8', sx: 330, sy: 250, d: 350, az: 300, L: 28, droop: 20, ub: 0.4, roll: -14, hang: 10, g: 0.7, asc: 0.5, teth: 0.9, age: 0.5, hold: true, len: 17},
  {id: 'G9', sx: 990, sy: 1420, d: 380, az: 80, L: 28, droop: 18, ub: 0.4, roll: 10, hang: 7, g: 1, asc: 1, teth: 1, age: 0.7, hold: false, len: 16},
  {id: 'G10', sx: 90, sy: 300, d: 300, az: 20, L: 26, droop: 16, ub: 0.4, roll: -8, hang: 5, g: 0.9, asc: 0.7, teth: 0.9, age: 0.6, hold: true, len: 15},
];
const WC = orbitCam(WIDE_END());
export const GRAVES: Grave[] = SPECS.map((s, k) => {
  const a = (s.az * Math.PI) / 180;
  const dir = norm3([Math.cos(a), Math.sin(a), 0.06]);
  // the ant's head (the vein) at the chosen spot; the leaf base back along the midrib from it
  const veinAt = unproj(WC, s.sx, s.sy - 60, s.d);
  const base: V3 = [veinAt[0] - dir[0] * s.ub * s.L, veinAt[1] - dir[1] * s.ub * s.L, Math.max(18, veinAt[2] + 0.4)];
  // leaves droop and tilt on their stalks: roll the blade about its midrib so its underside shows
  const up = rotA([0, 0, 1], dir, (k % 2 ? 1 : -1) * (14 + 10 * hash(k * 2.7)));
  const leaf: Leaf = {id: s.id, base, dir, up, L: s.L, Wd: s.L * 0.5, droop: s.droop, cup: 1.2, hue: s.age * 0.25};
  const A0 = biteAnchor(leaf, s.ub, k % 2 === 0 ? 1 : -1);
  // a little variety in how the body hangs from the head: turn the dorsal side about the head's axis
  const A = {...A0, u: rotA(A0.u, A0.f, s.roll)};
  const st = biteState(A, 100, 0, {hang0: 90, hang1: s.hang, tHang: [0, 1], relax: [0, 1], holdFront: s.hold});
  st.dead = 1;
  // a leaning stem from the floor, and one or two more leaves lower down (a plant, not a signpost)
  const sx = base[0] - dir[0] * 2, sy = base[1] - dir[1] * 2;
  // low leaves on seedlings from the floor; high ones on twigs that come down from branches above the frame
  const high = base[2] > 55;
  const stem: V3[] = high
    ? [[sx + 6 * Math.sin(k), sy + 4, base[2] + 140], [sx + 3, sy + 2, base[2] + 60], [sx + 1, sy + 0.6, base[2] + 18], base]
    : [[sx + 3 * Math.sin(k), sy + 2, 0], [sx + 2 * Math.sin(k), sy + 1, base[2] * 0.35], [sx + 0.8, sy + 0.4, base[2] * 0.72], base];
  const extra: Leaf[] = [0, 1].slice(0, 1 + (k % 2)).map((j) => {
    const b = 0.35 + 0.25 * j;
    const a2 = a + Math.PI * (0.7 + 0.5 * hash(k * 7 + j));
    return {id: `${s.id}x${j}`, base: [sx + 1.5 * Math.sin(k), sy + 0.7, high ? base[2] + 20 + 25 * j : base[2] * b] as V3, dir: norm3([Math.cos(a2), Math.sin(a2), 0.05]), up: [0, 0, 1] as V3, L: 18 + 8 * hash(k + j), Wd: 9 + 3 * hash(k * 3 + j), droop: 20 + 10 * hash(k * 5 + j), cup: 1, hue: s.age * 0.2};
  });
  return {id: s.id, leaf, extra, stem, ub: s.ub, st, sp: {seed: 40 + k * 7, len: s.len, bend: 0.7 + hash(k * 3.3) * 0.4, lean: (hash(k * 5.7) - 0.5) * 0.4}, g: s.g, asc: s.asc, open: s.asc, teth: s.teth, age: s.age};
});
/** leaves without ants along the camera's way out (the vegetation it pulls back through) */
export const PASS_LEAVES: Leaf[] = [
  {id: 'V2', base: [-120, 34, 62], dir: norm3([-0.5, 0.86, 0.04]), up: [0, 0, 1], L: 30, Wd: 14, droop: 22, cup: 1.4},
  {id: 'V3', base: [-175, -36, 50], dir: norm3([-0.2, -0.98, 0.04]), up: [0, 0, 1], L: 32, Wd: 15, droop: 24, cup: 1.5},
];
export const PASS_STEMS: V3[][] = PASS_LEAVES.map((l) => [[l.base[0] - 1, l.base[1], 0], [l.base[0] - 0.8, l.base[1], l.base[2] * 0.5], l.base]);
