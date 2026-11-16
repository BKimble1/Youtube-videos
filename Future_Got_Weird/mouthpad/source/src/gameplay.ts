// The game's script: where Zip is, where the crosshair points, which goo-bot gets splatted and when. Every event is
// placed on a measured word of the narration (T in story.ts), so the screen answers the mouth on the same beat.
import {clamp, keys, lerp, ss, blip, P} from './lib';
import {T, FIRE} from './story';
import {Enemy, GameState, Orb, Shot, projectG} from './art/game';

// lateral position of Zip in the arena (world units); tongue left/right = A/D strafes
export const ZIPX: [number, number][] = [
  [-1.0, -1.0], [0.06, -1.0], [0.42, 0.25], // the opening dodge: an orb passes where he was
  [T.video1 - 0.02, 0.25], [T.video1 + 0.33, -1.25], // tongue swipes left in the mouth → he strafes left
  [T.this2 - 0.15, -1.25], [T.this2 + 0.12, -2.6], // "Watch this": a flick and a dodge
  [T.move + 0.1, -2.6], [T.tongue2 + 0.3, -4.3], // split screen: tongue slides left → A
  [T.moves - 0.05, -4.3], [T.moves + 0.35, -3.0], // ... and right → D
  [T.but, -3.0], [T.craziest + 0.4, -2.2], [T.close, -2.2], [T.mouth3 + 0.4, -3.2], [T.see, -3.2], [T.controller + 0.3, -2.0],
  // versus: Rex fires, Zip slips each orb with a tiny strafe
  [T.so, -2.0], [26.3, -1.0], [27.1, -2.3], [27.9, -1.1], [28.7, -2.5], [29.45, -1.5], [30.15, -2.4], [31.5, -2.4],
];
// forward travel: always strolling (the world stays alive), a burst on W
const fwdAt = (t: number) => 0.9 * t + 3.2 * ss(t, T.character - 0.05, T.moves) + 0.6 * ss(t, T.so, 31);

type EDef = {id: number; x: number; z: number; t0: number; hit: number};
export const ENEMIES: EDef[] = [
  {id: 1, x: 1.6, z: 9.5, t0: -3, hit: FIRE.tongue + 0.08},
  {id: 2, x: -3.6, z: 11, t0: T.seriously - 0.1, hit: FIRE.watch + 0.08},
  {id: 3, x: 0.6, z: 10.5, t0: T.tilt - 0.6, hit: FIRE.click + 0.08},
  {id: 4, x: -1.0, z: 12, t0: T.but - 0.4, hit: FIRE.part + 0.08},
  {id: 5, x: -5.0, z: 10.5, t0: T.part + 0.4, hit: FIRE.nobody + 0.08},
];
export const FIRES: {t: number; target: number | 'rex'}[] = [
  {t: FIRE.tongue, target: 1},
  {t: FIRE.watch, target: 2},
  {t: FIRE.click, target: 3},
  {t: FIRE.part, target: 4},
  {t: FIRE.nobody, target: 5},
  {t: FIRE.shut, target: 'rex'},
];
export const FLIGHT = 0.08;
const LOCKS: [number, number, number | 'rex'][] = [
  [T.games - 0.1, FIRE.tongue + 0.08, 1],
  [T.this2 + 0.0, FIRE.watch + 0.08, 2],
  [T.aim - 0.08, FIRE.click + 0.08, 3],
  [T.craziest + 0.4, FIRE.part + 0.08, 4],
  [T.nobody - 0.2, FIRE.nobody + 0.08, 5],
  [T.mouth4 - 0.2, FIRE.shut + 0.08, 'rex'],
];
export const REX_FIRES = [26.0, 26.8, 27.6, 28.4, 29.15, 29.85];
const VS = T.so - 0.35; // versus round begins

const zipX = (t: number) => keys(t, ZIPX);
const vel = (t: number) => (zipX(t + 0.04) - zipX(t - 0.04)) / 0.08;

const enemyAt = (e: EDef, t: number): Enemy => {
  const spawn = clamp((t - e.t0) / 0.25);
  const sp = spawn < 1 ? 1 - Math.pow(1 - spawn, 3) * Math.cos(spawn * 9) : 1;
  const hit = clamp((t - e.hit) / 0.22);
  const alive = t < e.t0 ? 0 : t < e.hit + 0.22 ? 1 : 0;
  const x = e.x + Math.sin(t * 1.3 + e.id) * 0.5;
  return {id: e.id, x, z: e.z + Math.sin(t * 0.8 + e.id * 2) * 0.4, hover: 0.25 + Math.sin(t * 2.6 + e.id) * 0.12, hit: t >= e.hit ? hit : 0, alive, spawn: sp, wob: e.id * 1.7};
};
const rexAt = (t: number) => {
  if (t < VS - 0.4) return null;
  const hitT = FIRE.shut + FLIGHT;
  const fire = REX_FIRES.reduce((m, f) => Math.max(m, blip(t, f, 0.12)), 0);
  return {x: zipX(t) + 0.6 + Math.sin(t * 1.7) * 1.8, z: 7.2, hit: clamp((t - hitT) / 0.5), fire, alive: clamp((t - (VS - 0.4)) / 0.3) * (1 - clamp((t - 31.45) / 0.15))};
};
const targetScreen = (target: number | 'rex', t: number, camX: number): P => {
  if (target === 'rex') {
    const r = rexAt(t)!;
    const p = projectG(camX, r.x, r.z, 1.25);
    return {x: p.x, y: p.y};
  }
  const e = enemyAt(ENEMIES.find((q) => q.id === target)!, t);
  const p = projectG(camX, e.x, e.z, 0.9 + e.hover - 0.15);
  return {x: p.x, y: p.y};
};

/** the head-aim beat: the crosshair follows the head (tilt left, then right onto goo-bot 3) */
const freeCross = (t: number): P => ({
  x: 320 + Math.sin(t * 1.3) * 26 + keys(t, [[T.tilt, 0], [T.head + 0.05, -120], [T.you3 + 0.05, 30]]),
  y: 196 + Math.sin(t * 1.7 + 1) * 12 + keys(t, [[T.tilt, 0], [T.head + 0.05, 34], [T.you3 + 0.05, -10]]),
});

const raw = (t: number): GameState => {
  const camX = zipX(t);
  const v = vel(t);
  const enemies = t >= VS ? [] : ENEMIES.map((e) => enemyAt(e, t)).filter((e) => e.alive > 0);
  const rex = rexAt(t);
  // crosshair: free drift, pulled onto the locked target
  let cross = freeCross(t), lock = 0;
  for (const [a, b, tg] of LOCKS) {
    const w = ss(t, a, a + 0.18) * (1 - ss(t, b, b + 0.2));
    if (w > 0) {
      const p = targetScreen(tg, Math.min(t, b), camX);
      cross = {x: lerp(cross.x, p.x, w), y: lerp(cross.y, p.y, w)};
      lock = Math.max(lock, ss(t, a + 0.1, a + 0.25) * (1 - ss(t, b - 0.02, b + 0.05)));
    }
  }
  const zipScreen = clamp(v * 30, -95, 95);
  const shots: Shot[] = [];
  const splats: GameState['splats'] = [];
  let recoil = 0;
  for (const f of FIRES) {
    recoil = Math.max(recoil, blip(t, f.t, 0.12));
    const u = (t - f.t) / FLIGHT;
    const to = targetScreen(f.target, f.t + FLIGHT, zipX(f.t + FLIGHT));
    if (u >= 0 && u < 1) shots.push({from: {x: 320 + zipScreen + 110, y: 285}, to, u});
    const age = t - (f.t + FLIGHT);
    if (age >= 0 && age < 0.9) {
      // the splat sticks to where it hit (moves with the world)
      const now = targetScreen(f.target, f.t + FLIGHT, camX);
      splats.push({x: now.x, y: now.y, s: f.target === 'rex' ? 46 : 34, age, seed: typeof f.target === 'number' ? f.target * 13 : 99});
    }
  }
  const orbs: Orb[] = [];
  // the opening orb (from goo-bot 1 toward where Zip stood)
  {
    const u = (t + 0.35) / 0.9;
    if (u > 0 && u < 1) orbs.push({x: lerp(1.6, -1.0, u), z: lerp(9.5, 0.8, u), a: clamp((1 - u) * 6)});
  }
  // "Watch this": goo-bot 2 lobs one, Zip flicks aside
  {
    const t0 = T.watch - 0.1, u = (t - t0) / 0.6;
    if (u > 0 && u < 1) orbs.push({x: lerp(-3.6, -1.25, u), z: lerp(11, 0.8, u), a: clamp((1 - u) * 6)});
  }
  for (const f of REX_FIRES) {
    const u = (t - f) / 0.55;
    if (u > 0 && u < 1) {
      const r = rexAt(f)!;
      const aimX = zipX(f);
      orbs.push({x: lerp(r.x + 0.8, aimX, u), z: lerp(7.0, 0.8, u), a: clamp((1 - u) * 6)});
    }
  }
  const kOn = (a: number, b: number) => ss(t, a, a + 0.05) * (1 - ss(t, b, b + 0.08));
  const showKeys = ss(t, T.move - 0.5, T.move - 0.2) * (1 - ss(t, T.moves + 0.6, T.moves + 0.8));
  return {
    t, camX, zipScreen, zipLean: clamp(v / 5, -1, 1), run: t * 3.4, runAmt: clamp(0.35 + Math.abs(v) * 0.25 + 1.5 * (ss(t, T.character - 0.05, T.character + 0.1) - ss(t, T.moves - 0.1, T.moves + 0.1))),
    fwd: fwdAt(t), cross, lock, recoil, enemies, orbs, shots, splats, rex,
    keys: showKeys > 0.01 ? {w: kOn(T.character - 0.05, T.moves - 0.05), a: kOn(T.move + 0.1, T.tongue2 + 0.35), s: 0, d: kOn(T.moves - 0.02, T.moves + 0.4)} : null,
    win: clamp((t - (FIRE.shut + 0.25)) / 0.4) * (1 - ss(t, 31.55, 31.66)),
  };
};

/** the game at film time t. The last half second wipes into a new round whose state is the film's frame 0, so the
 *  screen loops with the picture. */
export const gameAt = (t: number): GameState => {
  const W0 = 31.55, W1 = 31.95;
  if (t < W0) return raw(t);
  const w = clamp((t - W0) / (W1 - W0));
  const g = w < 0.5 ? raw(t) : raw(t - 32);
  return {...g, wipe: w < 1 ? w : 0};
};
