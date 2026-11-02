// The timeline, every state and the one camera chain.
//
// Eight worlds, joined by continuous moves through "portals" (a region of one world that shows another: the helmet
// visor's reflection, the ship's porthole, the watch's Earth sub-dial, a doorway, the eye's reflection). A portal
// is an affine map inner -> outer. When the portal region covers the screen, the film switches to drawing the inner
// world on its own, with the camera CONVERTED through the map (identical pixels), and then blends from that converted
// camera into the inner world's own path with a C2 ease, so position, zoom and speed carry across every boundary.
//
//   A street hook (also the loop tail)   -> visor reflection -> B space (black hole, ship)
//   B -> porthole -> C cabin (astronaut, wristwatch)    -> Earth sub-dial -> D Earth
//   D -> cloud pass -> E neighbourhood (decades, return, recognition)       -> doorway -> F hallway (photos, memorial)
//   F -> eye reflection -> G warped space (light bending, two clocks)       -> watch match -> H hallway (his hand)
//   H -> visor reflection -> A (the opening frame)
import {DUR, keyS, lerp, ss, ss5, word} from './lib';
import {astroReach, astroWatchLocal, HEAD_Y, HELMET, SHIP_WIN_EXPORT} from './rigs';
import {orbitAngle, orbitPos} from './art/space';

export type Cam = {x: number; y: number; z: number};
export const SW = 1080, SH = 1920;
export const camT = (c: Cam) => `translate(540 960) scale(${c.z}) translate(${-c.x} ${-c.y})`;
/** affine portal map: outer = o + s * (inner - q) */
export type Map2 = {o: {x: number; y: number}; s: number; q: {x: number; y: number}};
export const toInner = (c: Cam, m: Map2): Cam => ({x: m.q.x + (c.x - m.o.x) / m.s, y: m.q.y + (c.y - m.o.y) / m.s, z: c.z * m.s});
export const toOuter = (c: Cam, m: Map2): Cam => ({x: m.o.x + (c.x - m.q.x) * m.s, y: m.o.y + (c.y - m.q.y) * m.s, z: c.z / m.s});
export const mixCam = (a: Cam, b: Cam, u: number): Cam => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), u))});
/** keyed camera path. The zoom (log z) is a C1 Hermite spline through the keys (the camera never stops at an inner
 *  key unless that key is marked 'stop'); x/y follow the zoom within each segment so a push stays locked on its
 *  target ("zoom to point"). End keys have zero velocity. */
/** monotone tangent (Fritsch-Carlson style): zero at a local extremum, never more than 3x either neighbouring slope,
 *  so a key is never overshot (no zoom-in-then-out wobble) */
const monoTan = (v: number[], ts: number[], i: number) => {
  const d0 = (v[i] - v[i - 1]) / (ts[i] - ts[i - 1]), d1 = (v[i + 1] - v[i]) / (ts[i + 1] - ts[i]);
  if (d0 * d1 <= 0) return 0;
  const m = (v[i + 1] - v[i - 1]) / (ts[i + 1] - ts[i - 1]);
  return Math.sign(m) * Math.min(Math.abs(m), 3 * Math.abs(d0), 3 * Math.abs(d1));
};
export const keyCam = (t: number, keys: ([number, Cam] | [number, Cam, 'stop'])[], monotone = false): Cam => {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  const L = keys.map((k) => Math.log(k[1].z));
  const TS = keys.map((k) => k[0]);
  const tan = keys.map((k, i) => (i === 0 || i === n - 1 || k[2] === 'stop' ? 0 : monotone ? monoTan(L, TS, i) : (L[i + 1] - L[i - 1]) / (keys[i + 1][0] - keys[i - 1][0])));
  let i = 1;
  while (t > keys[i][0]) i++;
  const [t0, a] = keys[i - 1], [t1, b] = keys[i];
  const h = t1 - t0, u = (t - t0) / h;
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  const lz = h00 * L[i - 1] + h10 * h * tan[i - 1] + h01 * L[i] + h11 * h * tan[i];
  const z = Math.exp(lz);
  if (Math.abs(L[i] - L[i - 1]) < 0.3) {
    // a pan or gentle push: x/y on their own C1 spline
    const tv = (f: (c: Cam) => number) => keys.map((k, j) => (j === 0 || j === n - 1 || k[2] === 'stop' ? 0 : monotone ? monoTan(keys.map((q) => f(q[1])), TS, j) : (f(keys[j + 1][1]) - f(keys[j - 1][1])) / (keys[j + 1][0] - keys[j - 1][0])));
    const TX = tv((c) => c.x), TY = tv((c) => c.y);
    return {x: h00 * a.x + h10 * h * TX[i - 1] + h01 * b.x + h11 * h * TX[i], y: h00 * a.y + h10 * h * TY[i - 1] + h01 * b.y + h11 * h * TY[i], z};
  }
  const w = (1 / a.z - 1 / z) / (1 / a.z - 1 / b.z);
  return {x: lerp(a.x, b.x, w), y: lerp(a.y, b.y, w), z};
};
/** interpolate a camera so that the screen point of the target moves consistently with the zoom (a "zoom to point") */
export const zoomTo = (a: Cam, b: Cam, u: number): Cam => {
  const la = Math.log(a.z), lb = Math.log(b.z);
  const z = Math.exp(lerp(la, lb, u));
  if (Math.abs(lb - la) < 1e-4) return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z};
  // position weight follows 1/z (the classic smooth zoom path, van Wijk-style without the arc)
  const w = (1 / a.z - 1 / z) / (1 / a.z - 1 / b.z);
  return {x: lerp(a.x, b.x, w), y: lerp(a.y, b.y, w), z};
};

// --- narration anchors ----------------------------------------------------------------------------------------------
export const T = {
  hole: word('hole,').start, future: word('future.').start, youd: word("You'd").start, clock: word('clock').start, hour: word('hour.').start,
  but: word('But').start, earth: word('Earth,').start, years: word('years').start, passing: word('passing.').start,
  and: word('And').start, returned: word('returned,').start, friends: word('friends').start, old: word('old.').start,
  family: word('family').start, gone: word('gone.').start, because: word('Because').start, space: word('space.').start,
  youT: word('You', 1).start, time: word('time.').start,
};
// shot boundaries (portal hand-offs)
export const S = {A1: 1.75, B1: 4.95, C1: 7.0, D1: 8.75, E1: 15.25, F1: 18.85, G1: 20.95, H1: 22.75};
export const LOOP_T0 = S.H1 - DUR; // hook-local time at which the loop tail starts (negative)

// --- A: the street hook -----------------------------------------------------------------------------------------------
export const A_POS = {astro: {x: 330, y: 1830}, friend: {x: 770, y: 1830}, s: 2.15};
/** hook-local time: 0..S.A1 at the start of the film, LOOP_T0..0 at its end */
export const hookT = (t: number) => (t >= S.H1 ? t - DUR : t);
// already mid-change at frame 0 (salt-and-pepper temples, the first lines); old by 1.35 s
export const friendAge = (th: number) => (th < 0 ? 0.42 * Math.pow(ss(th, -0.72, 0), 1.15) : keyS(th, [[0, 0.42], [1.3, 1]], (x) => x * (2 - x) * 0.55 + x * x * (3 - 2 * x) * 0.45));
/** the reflection in the visor, head-local: centre and scale (head units per M), and the space point shown there */
export const REFL = {rx: HELMET.cx + 14, ry: HELMET.cy - 10, k: 3, q: {x: 0, y: 0.5}};
/** street <- space map for the visor reflection (astronaut upright, no lean / tilt at the hand-offs) */
export const visorMap = (ax: number, ay: number, s: number): Map2 => ({o: {x: ax + s * REFL.rx, y: ay + s * (HEAD_Y + REFL.ry)}, s: s * REFL.k, q: REFL.q});
export const A_MAP = visorMap(A_POS.astro.x, A_POS.astro.y, A_POS.s);
const A_COVER: Cam = {x: A_MAP.o.x, y: A_MAP.o.y, z: 7.6};
const A_WIDE: Cam = {x: 540, y: 1000, z: 1};
// mid-push: both faces in frame (the friend finishes ageing at the right edge), weighted to the astronaut
const A_FACE: Cam = {x: 505, y: A_POS.astro.y + A_POS.s * (HEAD_Y + 10), z: 1.55};
export const camA = (th: number): Cam =>
  keyCam(th, [
    [LOOP_T0, A_COVER],
    [0.06, A_WIDE, 'stop'],
    [0.35, {...A_WIDE, z: 1.02}],
    [1.15, A_FACE],
    [S.A1 + 0.25, {...A_COVER, z: A_COVER.z * 1.35}],
  ]);

// --- B: space -----------------------------------------------------------------------------------------------------------
/** ship: orbit angle over time (crosses the front of the hole left to right), then its approach to the camera */
export const shipTh = (t: number) => lerp(2.55, 0.62, ss(t, 1.6, 4.4) * 0.6 + ((t - 1.6) / 2.8) * 0.4);
export const B_APPROACH = {t0: 3.85, t1: S.B1};
export const camB_own = (t: number): Cam =>
  keyCam(t, [
    [S.A1, toInner(camA(S.A1), A_MAP)],
    [2.75, {x: 0.6, y: 1.4, z: 33}],
    [S.B1 + 0.4, {x: 1.2, y: 1.8, z: 30.5}],
  ]);
export const camB = (t: number): Cam => mixCam(toInner(camA(t), A_MAP), camB_own(t), ss5(t, S.A1, S.A1 + 0.5));
/** ship placement in space at time t: position (M), angle (deg), scale (M per ship unit) */
export const shipAt = (t: number) => {
  const th = shipTh(t);
  const p0 = orbitPos(th);
  const a = ss5(t, B_APPROACH.t0, B_APPROACH.t1);
  const g = ss(t, B_APPROACH.t0, B_APPROACH.t1);
  const k = 0.012 * Math.exp(Math.log(150) * Math.pow(g, 1.7));
  const ang = lerp(orbitAngle(th), 0, a);
  const c = camB_own(t);
  // during the approach the ship comes toward the camera: its porthole slides to the screen centre
  const winOff = {x: SHIP_WIN_EXPORT.x * k, y: SHIP_WIN_EXPORT.y * k};
  const target = {x: c.x - winOff.x, y: c.y - winOff.y};
  return {x: lerp(p0.x, target.x, Math.pow(a, 1.3)), y: lerp(p0.y, target.y, Math.pow(a, 1.3)), ang, k};
};
/** space <- cabin map through the porthole (ship angle is 0 at the hand-off) */
export const C_ASTRO = {x: 540, y: 1580, s: 2.05};
const C_FACE = {x: 540, y: C_ASTRO.y + C_ASTRO.s * (HEAD_Y - 8)};
export const KC = 21 / 300; // ship units per cabin px: the porthole shows a 300 px radius of the cabin
export const portholeMap = (t: number): Map2 => {
  const sh = shipAt(t);
  return {o: {x: sh.x + SHIP_WIN_EXPORT.x * sh.k, y: sh.y + SHIP_WIN_EXPORT.y * sh.k}, s: sh.k * KC, q: C_FACE};
};

// --- C: cabin -------------------------------------------------------------------------------------------------------------
/** his raised left wrist, cabin coordinates of the watch centre, and the watch radius (cabin px) */
export const C_ARM_L = astroReach(36, -248, -1, 1);
const cw = astroWatchLocal(C_ARM_L);
export const C_WATCH = {x: C_ASTRO.x + C_ASTRO.s * cw.x, y: C_ASTRO.y + C_ASTRO.s * cw.y, r: 17 * C_ASTRO.s};
export const SUB = {x: C_WATCH.x, y: C_WATCH.y + C_WATCH.r * 0.48, r: C_WATCH.r * 0.25};
export const camC_own = (t: number): Cam =>
  keyCam(t, [
    [S.B1, toInner(camB(S.B1), portholeMap(S.B1))],
    [5.7, {x: C_WATCH.x - 10, y: C_WATCH.y + 20, z: 7.0}],
    [6.35, {x: C_WATCH.x - 4, y: C_WATCH.y + 30, z: 8.2}],
    [S.C1, {x: SUB.x, y: SUB.y, z: 1101 / (SUB.r * 0.98)}],
    [S.C1 + 0.3, {x: SUB.x, y: SUB.y, z: (1101 / (SUB.r * 0.98)) * 1.12}],
  ]);
export const camC = (t: number): Cam => mixCam(toInner(camB(t), portholeMap(t)), camC_own(t), ss5(t, S.B1, S.B1 + 0.45));

// --- D: Earth ---------------------------------------------------------------------------------------------------------------
export const EARTH = {x: 540, y: 900, r: 430};
/** cabin <- earth map through the sub-dial: the globe fills 40% of the dial window */
export const SUB_MAP: Map2 = {o: {x: SUB.x, y: SUB.y}, s: (SUB.r * 0.4) / EARTH.r, q: {x: EARTH.x, y: EARTH.y}};
export const EARTH_TARGET = {x: EARTH.x - 120, y: EARTH.y - 170};
const D0 = toInner(camC(S.C1), SUB_MAP);
export const camD_own = (t: number): Cam =>
  keyCam(t, [
    [S.C1, D0],
    [7.6, {x: EARTH.x, y: EARTH.y + 10, z: D0.z * 1.17}],
    [8.2, {x: EARTH.x - 20, y: EARTH.y - 20, z: D0.z * 1.3}],
    [S.D1 + 0.15, {x: EARTH_TARGET.x, y: EARTH_TARGET.y, z: 9}],
  ]);
export const camD = (t: number): Cam => mixCam(toInner(camC(t), SUB_MAP), camD_own(t), ss5(t, S.C1, S.C1 + 0.4));
export const earthLon = (t: number) => -100 + 40 * (t - S.C1) + 520 * Math.pow(ss(t, S.C1, 8.4), 1.0) * (t - S.C1);
export const earthYears = (t: number) => ss(t, S.C1 + 0.1, S.D1);
export const cloudP = (t: number) => (t - 8.4) / 0.8; // covered around 8.8

// --- E: neighbourhood -------------------------------------------------------------------------------------------------------
export const E = {friend: {x: 700, y: 1640}, s: 0.78, capsuleX: 1190, capsuleY: 1720, homeDoor: 1640};
export const decades = (t: number) => ss(t, 9.1, 10.95);
export const capsuleY = (t: number) => keyS(t, [[11.0, -1700], [12.0, 900], [12.55, E.capsuleY]], (x) => 1 - (1 - x) * (1 - x));
export const T_LAND = 12.55;
/** astronaut x in the neighbourhood: steps out of the hatch, walks toward his friend, then runs to his home door */
export const astroEX = (t: number) => keyS(t, [[12.95, E.capsuleX - 30], [13.45, 960], [14.35, 960], [15.0, E.homeDoor - 140]]);
export const camE = (t: number): Cam => {
  const cy = capsuleY(t);
  return keyCam(t, [
    [S.D1 - 0.1, {x: 640, y: -700, z: 0.85}],
    [9.15, {x: 850, y: 1235, z: 1.18}],
    [10.95, {x: 862, y: 1225, z: 1.27}, 'stop'],
    [11.5, {x: 930, y: 470, z: 0.9}],
    [12.1, {x: 980, y: Math.min(1200, cy - 80), z: 0.82}],
    [12.75, {x: 980, y: 1250, z: 0.95}],
    [13.5, {x: 830, y: 1370, z: 1.75}],
    [14.3, {x: 828, y: 1365, z: 1.9}],
    [14.95, {x: E.homeDoor, y: 1470, z: 2.6}],
    [S.E1, {x: E.homeDoor, y: 1600 - 115, z: 9.6}],
    [S.E1 + 0.3, {x: E.homeDoor, y: 1600 - 115, z: 12}],
  ]);
};
/** neighbourhood <- hallway map through the doorway */
export const DOOR_MAP: Map2 = {o: {x: E.homeDoor, y: 1600 - 115}, s: 0.105, q: {x: 330, y: 980}};

// --- F: hallway ----------------------------------------------------------------------------------------------------------------
export const F_ASTRO = {y: 1560, s: 1.0};
export const astroFX = (t: number) => keyS(t, [[15.2, -560], [16.95, 1590]], (x) => 1 - (1 - x) * (1 - x) * 0.6 - 0.4 * (1 - x));
export const F_EYE_SIDE = 1; // his left eye on screen right (nearer the portrait)
export const F_HEAD = {x: 1590, y: F_ASTRO.y + F_ASTRO.s * HEAD_Y};
export const fEyeAt = (turn: number, lookX: number, lookY: number) => ({x: F_HEAD.x + F_ASTRO.s * (21 * F_EYE_SIDE + turn * 9 + lookX * 5), y: F_HEAD.y + F_ASTRO.s * (-6 + lookY * 4)});
export const F_LOOK = {turn: 0.35, lookX: 0.75, lookY: -0.7};
export const F_PUPIL = fEyeAt(F_LOOK.turn, F_LOOK.lookX, F_LOOK.lookY);
/** hallway <- space map through the eye's reflection: the pupil is the shadow of the hole */
export const EYE_MAP: Map2 = {o: F_PUPIL, s: (F_ASTRO.s * 5.5) / Math.sqrt(27), q: {x: 0, y: 0}};
export const camF_own = (t: number): Cam =>
  keyCam(t, [
    [S.E1, toInner(camE(S.E1), DOOR_MAP)],
    [15.75, {x: 520, y: 900, z: 1.55}],
    [16.5, {x: 1330, y: 880, z: 1.6}],
    [16.95, {x: 1720, y: 960, z: 1.3}, 'stop'],
    [17.45, {x: 1700, y: 990, z: 1.34}],
    [18.25, {x: F_HEAD.x + 6, y: F_HEAD.y - 4, z: 4.2}],
    [S.F1, {x: F_PUPIL.x, y: F_PUPIL.y, z: 1101 / (F_ASTRO.s * 12.2)}],
    [S.F1 + 0.3, {x: F_PUPIL.x, y: F_PUPIL.y, z: (1101 / (F_ASTRO.s * 12.2)) * 1.3}],
  ]);
export const camF = (t: number): Cam => mixCam(toInner(camE(t), DOOR_MAP), camF_own(t), ss5(t, S.E1, S.E1 + 0.45));

// --- G: warped space ------------------------------------------------------------------------------------------------------------
export const G_WATCH = {x: -10.5, y: 23.5, r: 6.6};
export const G_EARTH = {x: 9.5, y: -31, r: 5.0};
export const G_CLOCK = {x: -4.0, y: -31, r: 6.2};
/** screen angle (deg) from the hole toward Earth: the rays arrive from there */
export const G_FROM = (Math.atan2(G_EARTH.y, G_EARTH.x) * 180) / Math.PI;
export const camG_own = (t: number): Cam =>
  keyCam(t, [
    [S.F1, toInner(camF(S.F1), EYE_MAP)],
    [19.95, {x: 0.5, y: -6, z: 13.6}, 'stop'],
    [20.45, {x: -1.0, y: -2, z: 14.5}],
    [S.G1, {x: G_WATCH.x, y: G_WATCH.y, z: 340 / G_WATCH.r}],
  ]);
export const camG = (t: number): Cam => mixCam(toInner(camF(t), EYE_MAP), camG_own(t), ss5(t, S.F1, S.F1 + 0.4));

// --- H: hallway, his hand ------------------------------------------------------------------------------------------------------
export const H_WATCH_R = 17 * F_ASTRO.s;
export const H_ARM_L = astroReach(30, -232, -1, 1);
const hw = astroWatchLocal(H_ARM_L);
export const H_WATCH = {x: F_HEAD.x + F_ASTRO.s * hw.x, y: F_ASTRO.y + F_ASTRO.s * hw.y};
/** his raised left hand (head-local target) and the watch centre in hallway coordinates, set in Scene from the rig */
export const H_VISOR_MAP = visorMap(F_HEAD.x, F_ASTRO.y, F_ASTRO.s);
export const camH = (t: number, watch: {x: number; y: number} = H_WATCH): Cam => {
  // the effective space camera at the swap must equal the street's at the start of the loop tail
  const swap = toOuter(toInner(camA(LOOP_T0), A_MAP), H_VISOR_MAP);
  return keyCam(t, [
    [S.G1, {x: watch.x, y: watch.y, z: 340 / H_WATCH_R}],
    [21.5, {x: watch.x - 40, y: watch.y - 60, z: 3.0}, 'stop'],
    [21.95, {x: F_HEAD.x + 10, y: F_HEAD.y - 10, z: 3.4}],
    [S.H1, swap],
  ]);
};
export const reflOpacityH = (t: number) => lerp(0.22, 1, ss(t, 21.6, 22.6));
export const reflOpacityA = (th: number) => (th < 0 ? lerp(1, 0.3, ss(th, LOOP_T0, -0.05)) : lerp(0.3, 1, ss(th, 0.9, S.A1 - 0.05)));
export {HEAD_Y};
