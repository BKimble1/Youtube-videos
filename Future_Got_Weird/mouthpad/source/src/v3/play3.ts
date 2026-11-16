// V2 game script. Every shot, dodge and splat is placed on a measured word (T) so the screen answers the mouth on
// the beat. The round loops: from LOOP_SWAP on, the game shows the state of the film's first frames again (that swap
// happens while the camera is on the winner's face, so it is never seen).
import {clamp, keys, lerp, ss, blip, P} from '../lib';
import {T} from '../story';
import {Enemy, GameState, Orb, Shot, projectG} from '../art/game';

export const DUR2 = 31.9;
export const LOOP_SWAP = T.mouth4; // on the cut to the winner's close-up (the screen is out of frame there)
export const FLIGHT = 0.07;
/** the shots: when each leaves the blaster, and what it hits */
export const FIRE2 = {
  open: 0.32, // the opening perfect shot (before "THIS")
  tap: T.can + 0.1, // the tongue's tap → cut → the blaster fires
  tongue: T.tongue1 + 0.44, // after "TONGUE." (low-angle shot, the monitor flashes)
  watchA: T.this2 + 0.26, watchB: T.this2 + 0.34, // "Watch this." → a double
  click: T.click + 0.06, // "CLICK" → the shot leaves on the word
  still: T.even + 0.12, // "nobody can even SEE": the game still answering
  tag: T.whos + 0.1, // escalation: Zip tags Rex (a flinch, not the win)
  ko: T.just + 0.2, // "just sitting there": the charged winning shot
};
type EDef = {id: number; x: number; z: number; t0: number; hit: number; big?: boolean};
export const ENEMIES2: EDef[] = [
  {id: 1, x: 1.1, z: 8.5, t0: -3, hit: FIRE2.open + FLIGHT, big: true},
  {id: 2, x: -1.6, z: 9.5, t0: 0.9, hit: FIRE2.tap + FLIGHT},
  {id: 3, x: 1.8, z: 10.5, t0: 2.0, hit: FIRE2.tongue + FLIGHT},
  {id: 4, x: -2.2, z: 10, t0: T.seriously, hit: FIRE2.watchA + FLIGHT},
  {id: 5, x: 1.2, z: 11, t0: T.seriously + 0.1, hit: FIRE2.watchB + FLIGHT},
  {id: 6, x: 0.2, z: 10.5, t0: T.tilt - 0.7, hit: FIRE2.click + FLIGHT, big: true},
  {id: 7, x: -1.4, z: 10, t0: T.close, hit: FIRE2.still + FLIGHT},
  // the next round (seen at the very end and at the start of the film): goo-bot 1 again, in flight from t < 0
];
const FIRES: {t: number; target: number | 'rex'}[] = [
  {t: FIRE2.open, target: 1}, {t: FIRE2.tap, target: 2}, {t: FIRE2.tongue, target: 3}, {t: FIRE2.watchA, target: 4}, {t: FIRE2.watchB, target: 5},
  {t: FIRE2.click, target: 6}, {t: FIRE2.still, target: 7}, {t: FIRE2.tag, target: 'rex'}, {t: FIRE2.ko, target: 'rex'},
];
export const FIRES2 = FIRES;
const LOCKS: [number, number, number | 'rex'][] = [
  [-0.1, FIRE2.open + FLIGHT, 1], [FIRE2.tap - 0.25, FIRE2.tap + FLIGHT, 2], [FIRE2.tongue - 0.3, FIRE2.tongue + FLIGHT, 3],
  [FIRE2.watchA - 0.18, FIRE2.watchA + FLIGHT, 4], [FIRE2.watchA + 0.02, FIRE2.watchB + FLIGHT, 5],
  [T.aim - 0.05, FIRE2.click + FLIGHT, 6], [FIRE2.still - 0.3, FIRE2.still + FLIGHT, 7], [FIRE2.tag - 0.2, FIRE2.tag + FLIGHT, 'rex'], [FIRE2.ko - 0.35, FIRE2.ko + FLIGHT, 'rex'],
];
const VS = T.so - 0.2;
export const REX_FIRES2 = [T.video2 - 0.1, T.video2 + 0.06, T.video2 + 0.22, T.video2 + 0.38, T.literally - 0.1];

// Zip's lateral position: dodges and strafes
export const ZIPX2: [number, number][] = [
  [-1, -0.7], [0.0, -0.7], [0.16, 0.55], // the opening dodge (the orb arrives at 0.2 where he was)
  [T.video1 + 0.05, 0.55], [T.video1 + 0.4, 1.7], // a strafe right as the second orb passes
  [T.watch, 1.7], [T.watch + 0.12, 0.8], [T.watch + 0.26, 1.9], [T.watch + 0.4, 1.0], // "Watch this": weave through three orbs
  [T.move + 0.1, 1.0], [T.tongue2 + 0.25, -0.9], // tongue sweeps left → A: strafe left
  [T.character - 0.12, -0.9], [T.moves + 0.2, 2.1], [T.moves + 0.4, 2.1], // tongue sweeps right → D: strafe right
  [T.close, 0.4], [T.nobody + 0.3, -0.4],
  [T.video2 - 0.05, -0.4], [T.video2 + 0.13, 0.35], [T.video2 + 0.29, -0.45], [T.video2 + 0.45, 0.3], [T.video2 + 0.6, -0.1], // precise side-steps
  [T.literally - 0.05, -0.1], [T.literally + 0.18, 0.6], [T.just - 0.1, 0.6], [31.0, 0.6],
];
const zipX = (t: number) => keys(t, ZIPX2);
const vel = (t: number) => (zipX(t + 0.03) - zipX(t - 0.03)) / 0.06;
// forward run: W in the split screen, and a steady stroll
const fwdAt = (t: number) => 0.9 * t + 0.5 * ss(t, T.so, 31);
// head aim: the game camera yaws a little with the head, the crosshair follows the head
export const headAim = (t: number) => keys(t, [[T.tilt - 0.05, 0], [T.head + 0.06, -1], [T.you3 + 0.1, 1], [T.aim + 0.4, 0.85], [T.press, 0]]);

const enemyAt = (e: EDef, t: number): Enemy => {
  const spawn = clamp((t - e.t0) / 0.25);
  const sp = spawn < 1 ? 1 - Math.pow(1 - spawn, 3) * Math.cos(spawn * 9) : 1;
  const hit = clamp((t - e.hit) / 0.22);
  const alive = t < e.t0 ? 0 : t < e.hit + 0.22 ? 1 : 0;
  const x = e.x + Math.sin(t * 1.3 + e.id) * 0.35;
  return {id: e.id, x, z: e.z + Math.sin(t * 0.8 + e.id * 2) * 0.3, hover: 0.25 + Math.sin(t * 2.6 + e.id) * 0.12, hit: t >= e.hit ? hit : 0, alive, spawn: sp, wob: e.id * 1.7};
};
export const rexAt = (t: number) => {
  if (t < VS - 0.4) return null;
  const hitT = FIRE2.ko + FLIGHT;
  const fire = REX_FIRES2.reduce((m, f) => Math.max(m, blip(t, f, 0.12)), 0);
  // Rex strafes while he fights, freezes when the winning shot is charging
  // ...and for the final duel he squares up well to Zip's right, so the winning shot crosses the screen
  const duel = ss(t, T.literally + 0.15, T.just - 0.15);
  const rx = lerp(0.5 + Math.sin(Math.min(t, FIRE2.ko - 0.3) * 1.9) * 1.4, 3.3, duel);
  return {x: zipX(Math.min(t, FIRE2.ko - 0.3)) + rx, z: 7.0, hit: t > hitT ? (t - hitT) : 0, fire, alive: clamp((t - (VS - 0.4)) / 0.3) * (1 - clamp((t - (hitT + 0.42)) / 0.08))};
};
const targetScreen = (target: number | 'rex', t: number, camX: number): P => {
  if (target === 'rex') {
    const r = rexAt(t)!;
    const p = projectG(camX, r.x, r.z, 1.25);
    return {x: p.x, y: p.y};
  }
  const e = enemyAt(ENEMIES2.find((q) => q.id === target)!, t);
  const p = projectG(camX, e.x, e.z, 0.9 + e.hover - 0.15);
  return {x: p.x, y: p.y};
};
const freeCross = (t: number): P => ({x: 320 + Math.sin(t * 1.3) * 22 + 130 * headAim(t), y: 192 + Math.sin(t * 1.7 + 1) * 10 - 20 * Math.abs(headAim(t))});

// in the split-screen move demo the game camera holds still, so Zip visibly travels left then right with the tongue
const SPLIT_HOLD: [number, number] = [T.mouth2 + 0.0, T.moves + 0.45];
const raw = (t: number): GameState => {
  const hold = ss(t, SPLIT_HOLD[0], SPLIT_HOLD[0] + 0.2) * (1 - ss(t, SPLIT_HOLD[1], SPLIT_HOLD[1] + 0.35));
  const camFree = zipX(t) + 0.9 * headAim(t);
  const camX = lerp(camFree, 0.6, hold);
  const v = vel(t);
  const enemies = t >= VS ? [] : ENEMIES2.map((e) => enemyAt(e, t)).filter((e) => e.alive > 0);
  const rex = rexAt(t);
  let cross = freeCross(t), lock = 0;
  for (const [a, b, tg] of LOCKS) {
    const w = ss(t, a, a + 0.14) * (1 - ss(t, b, b + 0.18));
    if (w > 0) {
      const p = targetScreen(tg, Math.min(t, b), camX);
      cross = {x: lerp(cross.x, p.x, w), y: lerp(cross.y, p.y, w)};
      lock = Math.max(lock, ss(t, a + 0.08, a + 0.2) * (1 - ss(t, b - 0.02, b + 0.05)));
    }
  }
  const zipScreen = clamp(v * 26, -95, 95) * (1 - hold) + (zipX(t) - camX) * 105 * hold;
  const shots: Shot[] = [];
  const splats: GameState['splats'] = [];
  let recoil = 0, muzzle = 0, hitMark = 0, shake = 0;
  for (const f of FIRES) {
    recoil = Math.max(recoil, blip(t, f.t, 0.12));
    muzzle = Math.max(muzzle, t >= f.t && t < f.t + 0.08 ? 1 - (t - f.t) / 0.08 : 0);
    const u = (t - f.t) / FLIGHT;
    const to = targetScreen(f.target, f.t + FLIGHT, zipX(f.t + FLIGHT) + 0.9 * headAim(f.t + FLIGHT));
    if (u >= 0 && u < 1) shots.push({from: {x: 320 + zipScreen + 110, y: 285}, to, u});
    const age = t - (f.t + FLIGHT);
    if (age >= 0 && age < 0.9) {
      const now = targetScreen(f.target, f.t + FLIGHT, camX);
      const big = f.target === 'rex' || ENEMIES2.find((q) => q.id === f.target)?.big;
      splats.push({col: f.target === 'rex' ? '#4FC36A' : undefined, x: now.x, y: now.y, s: f.target === 'rex' ? (f.t === FIRE2.ko ? 44 : 26) : big ? 46 : 34, age, seed: typeof f.target === 'number' ? f.target * 13 : 99});
      hitMark = Math.max(hitMark, 1 - clamp(age / 0.28));
      shake = Math.max(shake, (big ? 1 : 0.5) * (1 - clamp(age / 0.2)));
    }
  }
  const orbs: Orb[] = [];
  const orb = (t0: number, dur: number, x0: number, z0: number, x1: number) => {
    const u = (t - t0) / dur;
    if (u > 0 && u < 1) orbs.push({x: lerp(x0, x1, u), z: lerp(z0, 0.6, u), a: clamp((1 - u) * 6)});
  };
  orb(-0.45, 0.65, 1.1, 8.5, -0.7); // the opening orb, aimed where Zip stood
  orb(T.video1 - 0.2, 0.6, 1.8, 10.5, 0.55);
  orb(T.watch - 0.15, 0.4, -2.2, 10, 1.7); orb(T.watch, 0.4, 1.2, 11, 0.8); orb(T.watch + 0.15, 0.4, -2.2, 10, 1.9);
  for (const f of REX_FIRES2) { const r = rexAt(f)!; orb(f, 0.5, r.x + 0.6, 7.0, zipX(f)); }
  const kOn = (a: number, b: number) => ss(t, a, a + 0.05) * (1 - ss(t, b, b + 0.08));
  const showKeys = ss(t, T.move - 0.5, T.move - 0.2) * (1 - ss(t, T.moves + 0.3, T.moves + 0.4));
  const sk = shake * 7;
  return {
    t, camX, zipScreen, zipLean: clamp(v / 5, -1, 1), run: t * 3.4,
    runAmt: clamp(0.35 + Math.abs(v) * 0.25),
    fwd: fwdAt(t), cross, lock, recoil, enemies, orbs, shots, splats, rex,
    keys: showKeys > 0.01 ? {w: 0, a: kOn(T.move + 0.1, T.tongue2 + 0.3), s: 0, d: kOn(T.character - 0.12, T.moves + 0.25)} : null,
    win: clamp((t - (FIRE2.ko + 0.45)) / 0.3),
    muzzle, hitMark, shake: {x: Math.sin(t * 90) * sk, y: Math.cos(t * 77) * sk},
    charge: ss(t, FIRE2.ko - 0.3, FIRE2.ko) * (t < FIRE2.ko ? 1 : 0),
    hop: (() => { const u = (t - (FIRE2.ko + 0.32)) / 0.4; return u > 0 && u < 2 ? 52 * Math.abs(Math.sin(Math.min(u, 2) * Math.PI)) * (u < 1 ? 1 : 0.45) : 0; })(),
    confetti: t >= FIRE2.ko + FLIGHT + 0.42 ? t - (FIRE2.ko + FLIGHT + 0.42) : -1,
    flinch: clamp((t - (FIRE2.tag + FLIGHT)) / 0.3) * (t < FIRE2.tag + FLIGHT + 0.3 ? 1 : 0),
    winX: 320 + clamp(v * 26, -95, 95),
  };
};

/** the game at film time t (the next round is already running from LOOP_SWAP, matching frame 0) */
export const game2 = (t: number): GameState => (t < LOOP_SWAP ? raw(t) : raw(t - DUR2));
export const zip2 = zipX;
