// The gameplay, as a pure function of film time. It is an illustrative recreation (original art, scripted moves): it is
// NOT footage of the experiment. Three stretches of play, joined only where the monitor is out of view:
//   A  corridor: the opening fight (also the film's last seconds, so the end runs straight into frame 0), the turn
//      to the passage and the second enemy        film [-5, 9) and [24, 29) (as t - 29)
//   C  the tech room: an enemy appears on the left; MOVE, TURN, FIRE in the control loop            [9, 19)
//   C' the same room, clumsy: shots into the wall, a late reaction to an enemy from the right       [19, 24)
import {GameState, Puff, Sprite, cell} from './engine';
import {Pose} from './art';

const D = Math.PI / 180;
type K = [number, number]; // [t, value]
const ease = (x: number) => x * x * (3 - 2 * x);
/** piecewise track: 'e' eased segments (the default), 'l' linear */
const track = (t: number, keys: K[], mode: 'e' | 'l' = 'e') => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++)
    if (t <= keys[i][0]) {
      const [t0, a] = keys[i - 1], [t1, b] = keys[i];
      const u = (t - t0) / (t1 - t0 || 1);
      return a + (b - a) * (mode === 'l' ? u : ease(u));
    }
  return keys[keys.length - 1][1];
};

export type Shot = {t: number; target: string | null}; // target: an enemy id, or null (the wall)
type Enemy = {
  id: string;
  path: K[][]; // x keys, y keys
  hits: number[]; // times it is hit (the last one kills when `dies`)
  dies: boolean;
  attack?: [number, number];
  from?: number; // visible from this time
};
type Seg = {t0: number; t1: number; x: K[]; y: K[]; a: K[]; walk: K[]; shots: Shot[]; enemies: Enemy[]; health: K[]; ammo0: number};

// ------------------------------------------------------------------ A: the corridor (t in [-5, 9))
const A: Seg = {
  t0: -5, t1: 9,
  x: [[-5, 2.6], [-0.9, 5.95], [0, 6.12], [2.8, 6.55], [3.5, 6.95], [4.3, 7.0], [9, 7.0]],
  y: [[-5, 21.5], [4.3, 21.5], [5.7, 21.45], [9, 17.9]],
  a: [[-5, 2 * D], [-2.5, -2 * D], [-0.9, 0.5 * D], [0.25, 0], [1.6, 1.6 * D], [3.4, 0], [4.25, -90 * D], [5.1, -92 * D], [6.2, -89 * D], [9, -90 * D]],
  walk: [[-5, 0], [-0.9, 14], [0, 15.2], [3.5, 16.6], [4.3, 17.2], [5.7, 17.4], [9, 26]],
  shots: [{t: -0.45, target: 'E1'}, {t: 0, target: 'E1'}, {t: 0.3, target: 'E1'}, {t: 2.7, target: 'E1'}, {t: 5.0, target: 'E2'}, {t: 5.6, target: 'E2'}],
  enemies: [
    {id: 'E1', path: [[[-5, 14.5], [-0.6, 8.55], [-0.45, 8.55], [-0.3, 8.7], [-0.02, 8.45], [0, 8.45], [0.14, 8.62], [0.3, 8.62], [0.45, 8.8], [2.68, 8.5], [2.85, 8.68]], [[-5, 21.5]]], hits: [-0.45, 0, 0.3, 2.7], dies: true},
    {id: 'E2', path: [[[-5, 7.0]], [[-5, 13.2], [3.6, 13.2], [4.95, 15.6], [5.1, 15.4], [5.58, 16.2], [5.75, 16.0]]], hits: [5.0, 5.6], dies: true},
  ],
  health: [[-5, 87]],
  ammo0: 52,
};
// ------------------------------------------------------------------ C: the tech room (t in [9, 24))
const C: Seg = {
  t0: 9, t1: 24,
  x: [[9, 22.5], [17.36, 22.5], [17.62, 23.0], [24, 23.0]],
  y: [[9, 7.5]],
  a: [
    [9, -14 * D], [12.5, -12 * D], [15.5, -16 * D], [17.84, -14 * D], [18.12, -35.7 * D], [19.3, -35.7 * D],
    // clumsy: a wild turn right, past the target, to the wall
    [19.72, 100 * D], [19.95, 96 * D], [20.15, 84 * D], [20.33, 95 * D], [20.6, 92 * D], [21.05, 80 * D],
    // hit, then a late jerk toward the attacker that overshoots, and the correction
    [21.5, 82 * D], [21.9, 141 * D], [22.2, 139 * D], [22.42, 124 * D], [24, 124 * D],
  ],
  walk: [[9, 0], [17.36, 0.3], [17.62, 1.6], [24, 1.6]],
  shots: [{t: 18.41, target: 'E3'}, {t: 19.85, target: null}, {t: 20.35, target: null}, {t: 22.05, target: null}, {t: 22.55, target: 'E4'}, {t: 22.85, target: 'E4'}],
  enemies: [
    {id: 'E3', from: 11.25, path: [[[9, 27.5], [11.25, 27.5], [13.2, 26.7], [17.3, 26.25]], [[9, 1.4], [11.25, 1.4], [13.2, 4.7], [17.3, 5.15]]], hits: [18.41], dies: true},
    {id: 'E4', from: 20.15, path: [[[9, 20.5], [20.2, 20.5], [20.9, 21.15], [21.22, 21.95], [24, 21.95]], [[9, 12.45], [20.2, 12.45], [20.9, 10.25], [21.22, 8.85], [24, 8.85]]], hits: [22.55, 22.85], dies: true, attack: [21.2, 21.45]},
  ],
  health: [[9, 87], [21.33, 87], [21.38, 64], [24, 64]],
  ammo0: 31,
};

const SEGS = [A, C];
/** film time -> segment and its local time */
export const segAt = (t: number): {s: Seg; u: number} => (t >= 24 ? {s: A, u: t - 29} : t >= 9 ? {s: C, u: t} : {s: A, u: t});

const enemyAt = (e: Enemy, u: number, shots: Shot[]): Sprite | null => {
  if (e.from !== undefined && u < e.from) return null;
  const x = track(u, e.path[0], 'l'), y = track(u, e.path[1], 'l');
  const lastHit = e.hits.filter((h) => h <= u).pop();
  const killed = e.dies && e.hits.length > 0 && u >= e.hits[e.hits.length - 1];
  let pose: Pose;
  if (killed) {
    const k = u - e.hits[e.hits.length - 1];
    pose = k < 0.09 ? 'pain' : k < 0.18 ? 'die1' : k < 0.3 ? 'die2' : 'die3';
  } else if (lastHit !== undefined && u - lastHit < 0.14) pose = 'pain';
  else if (e.attack && u >= e.attack[0] && u < e.attack[1]) pose = 'attack';
  else {
    const dx = track(u + 0.05, e.path[0], 'l') - track(u - 0.05, e.path[0], 'l');
    const dy = track(u + 0.05, e.path[1], 'l') - track(u - 0.05, e.path[1], 'l');
    const moving = Math.hypot(dx, dy) > 0.004;
    pose = moving ? (Math.floor(u / 0.17) % 2 ? 'walkA' : 'walkB') : Math.floor(u / 0.5) % 2 ? 'walkA' : 'walkB';
  }
  return {x, y, pose, bright: pose === 'pain' ? 0.25 : 0};
};

/** where the centre ray first meets a wall (for impact puffs) */
const wallHit = (x: number, y: number, a: number) => {
  const dx = Math.cos(a), dy = Math.sin(a);
  for (let d = 0.05; d < 30; d += 0.02) if (cell(x + dx * d, y + dy * d)) return {x: x + dx * (d - 0.06), y: y + dy * (d - 0.06)};
  return {x, y};
};

export const gameState = (t: number): GameState => {
  const {s, u} = segAt(t);
  const x = track(u, s.x), y = track(u, s.y), a = track(u, s.a);
  const walk = track(u, s.walk, 'l');
  const sinceShot = s.shots.filter((q) => q.t <= u).map((q) => u - q.t);
  const ls = sinceShot.length ? Math.min(...sinceShot) : 9;
  const kick = ls < 0.2 ? Math.pow(1 - ls / 0.2, 1.6) : 0;
  const fl = ls < 0.1 ? 1 - ls / 0.1 : 0;
  const enemies = s.enemies.map((e) => enemyAt(e, u, s.shots)).filter(Boolean) as Sprite[];
  const puffs: Puff[] = [];
  for (const q of s.shots) {
    const k = u - q.t;
    if (k < 0 || k >= 0.24) continue;
    const f = Math.min(2, Math.floor(k / 0.08));
    if (q.target) {
      const e = s.enemies.find((z) => z.id === q.target)!;
      const ex = track(q.t, e.path[0], 'l'), ey = track(q.t, e.path[1], 'l');
      const px = track(q.t, s.x), py = track(q.t, s.y);
      const d = Math.hypot(ex - px, ey - py);
      puffs.push({x: ex + ((px - ex) / d) * 0.35, y: ey + ((py - ey) / d) * 0.35, z: 0.42, kind: 'blood', f});
    } else {
      const w = wallHit(track(q.t, s.x), track(q.t, s.y), track(q.t, s.a));
      puffs.push({...w, z: 0.38, kind: 'spark', f});
    }
  }
  const hurtT = s === C ? u - 21.36 : -1;
  const hurt = hurtT >= 0 && hurtT < 0.45 ? Math.pow(1 - hurtT / 0.45, 1.3) : 0;
  const moving = Math.abs(track(u + 0.05, s.walk, 'l') - track(u - 0.05, s.walk, 'l')) > 0.02;
  return {
    x, y, a,
    bob: moving ? Math.sin(walk * Math.PI) * 2.2 : Math.sin(u * 2.1) * 0.6,
    walk: walk * Math.PI * 0.5,
    kick, flash: fl, hurt,
    enemies, puffs,
    health: track(u, s.health, 'l'),
    ammo: s.ammo0 - s.shots.filter((q) => q.t <= u).length,
  };
};

/** every shot in film time (for sound and the decoder's FIRE light) */
export const filmShots = (): {t: number; target: string | null; kill: boolean}[] => {
  const out: {t: number; target: string | null; kill: boolean}[] = [];
  for (const s of SEGS)
    for (const q of s.shots) {
      const e = s.enemies.find((z) => z.id === q.target);
      const kill = !!e && e.dies && q.t === e.hits[e.hits.length - 1];
      for (const t of s === A ? [q.t, q.t + 29] : [q.t]) {
        const inA = t < 9 || t >= 24;
        if (t >= 0 && t < 29 && (s === A ? inA : t >= 9 && t < 24)) out.push({t, target: q.target, kill});
      }
    }
  return out.sort((p, q) => p.t - q.t);
};
export const SEG_C_ENEMY_APPEARS = 11.25;
