// V3 states and cameras. Every transition rides on something visible: the ship, its window, his wrist, the clock at
// home, the window of the house, the garden, the front door, the photograph, his watch.
import {clamp, DUR, lerp, ss, sm} from '../lib';
import {Cam, keyCam} from '../story';
import {T3, spaceTau} from './timing';
import {CAPSULE2} from '../v2/craft';
import {COCKPIT_ASTRO} from '../v2/cockpit';
import {ArmA, astroHandLocal, HEAD_Y} from '../art/figures';
import {ROOM, V3_PHOTO} from '../v2/room';
import {YARD, yardPath} from '../v2/yard';
import {evenPlants, gait, GaitOpts, landings, Pt, Route} from './gait';

export const e5 = (x: number) => {
  const u = clamp(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const lg = Math.log;
const rad = (d: number) => (d * Math.PI) / 180;
/** the camera that puts world point W at screen point (sx, sy) with zoom z and roll r (degrees) */
export const camAt = (W: {x: number; y: number}, sx: number, sy: number, z: number, r = 0): Cam => {
  const q = rad(-r), dx = sx - 540, dy = sy - 960;
  const vx = dx * Math.cos(q) - dy * Math.sin(q), vy = dx * Math.sin(q) + dy * Math.cos(q);
  return r ? {x: W.x - vx / z, y: W.y - vy / z, z, r} : {x: W.x - vx / z, y: W.y - vy / z, z};
};
/** where world point P lands on screen under camera c */
export const onScreen = (P: {x: number; y: number}, c: Cam) => {
  const q = rad(c.r ?? 0), dx = (P.x - c.x) * c.z, dy = (P.y - c.y) * c.z;
  return {x: 540 + dx * Math.cos(q) - dy * Math.sin(q), y: 960 + dx * Math.sin(q) + dy * Math.cos(q)};
};

// ==== 1-2 space: the ship (M units, the hole at the origin) ===========================================================
/** M per capsule drawing unit (the capsule is 8.4 M tall) */
export const SM = 8.4 / CAPSULE2.height;
const P0 = {x: 9.4, y: 15.0};
const VX = 0.55, VY = -1.55;
/** the ship keeps one heading the whole time (it never turns); the camera banks to it on the way into the window */
export const shipPos = (tau: number) => ({x: P0.x + VX * tau, y: P0.y + VY * tau});
export const SHIP_ROT = (Math.atan2(VX, -VY) * 180) / Math.PI; // 19.5 deg right of up
export const shipRot = (_tau: number) => SHIP_ROT;
/** the cockpit window's centre (M) */
export const winPos = (tau: number) => {
  const p = shipPos(tau), r = rad(SHIP_ROT), d = -CAPSULE2.win.y * SM;
  return {x: p.x + d * Math.sin(r), y: p.y - d * Math.cos(r)};
};
export const WIN_R = CAPSULE2.win.r * SM; // window glass radius (M)
/** the camera follows the ship, holding it low right of frame; the hole dominates upper left. The ship drifts a little
 *  up and right in frame (it is flying; the camera lags), at rest at the loop seam. */
const SHIP_SCREEN = {x: 250, y: 370}; // ship offset from screen centre (px) at the seam
const DRIFT = {x: 24, y: -34};
const follow = (tau: number, z: number): Cam => {
  const p = shipPos(tau), k = ss(tau, 0, T3.push + 0.4);
  return {x: p.x - (SHIP_SCREEN.x + DRIFT.x * k) / z, y: p.y - (SHIP_SCREEN.y + DRIFT.y * k) / z, z};
};
export const CAM_OPEN = follow(0, 38);
/** the cockpit window as a portal: its glass maps to a circle of r 1230 cockpit px around (540, 990) */
export const COCKPIT_VIEW = {x: 540, y: 990, r: 1230};
const Z_HANDOFF = COCKPIT_VIEW.r / WIN_R; // the space zoom at which the cockpit camera is z = 1
/** a space camera seen from inside the cockpit (the cockpit is drawn in the ship's frame, rotated by SHIP_ROT) */
const toCockpit = (c: Cam, tau: number): Cam => {
  const o = winPos(tau), s = WIN_R / COCKPIT_VIEW.r, q = rad(-SHIP_ROT);
  const dx = (c.x - o.x) / s, dy = (c.y - o.y) / s;
  return {x: COCKPIT_VIEW.x + dx * Math.cos(q) - dy * Math.sin(q), y: COCKPIT_VIEW.y + dx * Math.sin(q) + dy * Math.cos(q), z: c.z * s, r: (c.r ?? 0) + SHIP_ROT};
};
const winScreen = (tau: number, c: Cam) => onScreen(winPos(tau), c);

/** the loop: the watch face at the end matches the ship's window at this screen circle, both upright */
export const LOOP_WIN = {x: 540, y: 900, r: 210};
const Z_MATCH = LOOP_WIN.r / WIN_R;
export const camSpace = (t: number): Cam => {
  const tau = spaceTau(t);
  if (tau < 0) {
    // out of the window (upright, at rest on the match), easing back to the opening frame (at rest at the seam): the
    // reverse of the opening push, roll included
    const v = (tau - (T3.loopCut - DUR)) / (DUR - T3.loopCut);
    const e = e5(v);
    const z = Math.exp(lerp(lg(Z_MATCH), lg(CAM_OPEN.z), e));
    const s1 = winScreen(0, CAM_OPEN);
    const ee = e5(clamp(v * 1.08));
    return camAt(winPos(tau), lerp(LOOP_WIN.x, s1.x, ee), lerp(LOOP_WIN.y, s1.y, ee), z, -SHIP_ROT * (1 - sm(v)));
  }
  if (tau < T3.push) {
    // a controlled follow: a slow push from 38 to 40 px/M (eased in from rest at the loop seam)
    return follow(tau, lerp(38, 40, ss(tau, 0, T3.push)));
  }
  // toward the cockpit window, then into it (S-curve in log zoom); the window slides to the centre early and the camera
  // banks to the ship's heading, so the cockpit is upright when it takes over
  const u = clamp((tau - T3.push) / (T3.windowIn - T3.push));
  const z = Math.exp(lerp(lg(40), lg(Z_HANDOFF), e5(u)));
  const c0 = follow(T3.push, 40);
  const s0 = winScreen(T3.push, c0);
  const k = ss(u, 0, 0.62);
  const tt = Math.min(tau, T3.windowIn);
  return camAt(winPos(tt), lerp(s0.x, 540, k), lerp(s0.y, 960, k), z, -SHIP_ROT * ss(u, 0.05, 0.8));
};
/** magnification of the ray-traced frames on screen (1 = one image pixel per screen pixel) */
export const bhMag = (c: Cam) => c.z / 36.92;

// ==== 3-4 cockpit (cockpit px; the seated astronaut at COCKPIT_ASTRO) ==================================================
const A = COCKPIT_ASTRO;
/** at rest his left hand lies in his lap (the watch sits just above the console's edge) */
export const REST_L: ArmA = {a: 14, b: -50};
/** the raised wrist: upper arm down at his side, elbow bent about a right angle, the forearm level across his body just
 *  below the chest unit (the glove clear of it and far below his face). The arm swings up about the elbow. */
export const RAISED: ArmA = {a: 8, b: -88};
const handAt = (arm: ArmA) => astroHandLocal(arm, -1);
export const raiseArm = (u0: number): ArmA => {
  const u = e5(u0);
  return {a: lerp(REST_L.a, RAISED.a, u), b: lerp(REST_L.b, RAISED.b, u)};
};
export const cockpitArm = (t: number): ArmA => raiseArm((t - T3.raise) / (T3.raiseEnd - T3.raise));
/** the watch: a little behind the cuff (WATCH_AT along the forearm), as the rig draws it */
export const WATCH_AT = 0.46; // (the case and crown clear the glove; a band of the cuff shows between them)
export const WATCH_R = 16.5; // Watch2 r (rig units): the case a little narrower than the sleeve, the strap wraps it
export const watchLocal = (arm: ArmA) => {
  const P = handAt(arm);
  return {x: P.ex + (P.hx - P.ex) * WATCH_AT, y: P.ey + (P.hy - P.ey) * WATCH_AT, angle: P.angle};
};
/** the dial turns with the wrist: its 3 o'clock points along the forearm toward the hand, its strap (12-6) across it */
export const watchRot = (angle: number) => 90 - angle;
export const watchWorld = (t: number) => {
  const w = watchLocal(cockpitArm(t));
  return {x: A.x + w.x * A.s, y: A.y + w.y * A.s, rot: watchRot(w.angle)};
};
/** the dial radius (rig units) */
export const WATCH_DIAL = 99 * (WATCH_R / 100);
/** the dial's tilt with the wrist raised (degrees) */
export const WATCH_ROT_END = watchRot(watchLocal(RAISED).angle);
const ZW = 290 / (WATCH_DIAL * A.s);
export const camCockpitOwn = (t: number): Cam => {
  // held exactly at the hand-off framing (the window's portal: z 1 about (540, 990)) until the one eased push to the watch
  const base: Cam = {x: 540, y: 990, z: 1.0};
  if (t < T3.pushWatch) return base;
  const u = clamp((t - T3.pushWatch) / (T3.watchClose - T3.pushWatch));
  const e = e5(u);
  const z = Math.exp(lerp(lg(base.z), lg(ZW), e)) * lerp(1, 1.035, ss(t, T3.watchClose, T3.match));
  const W = watchWorld(t);
  const sp0 = onScreen(W, base);
  // a gentle roll that follows the forearm, so the dial ends upright (for the match to the wall clock)
  return camAt(W, lerp(sp0.x, 540, e), lerp(sp0.y, 960, e), z, -WATCH_ROT_END * e);
};
export const camCockpit = (t: number): Cam => {
  if (t >= T3.windowIn + 0.35) return camCockpitOwn(t);
  const tau = Math.min(t, T3.windowIn);
  const a = toCockpit(camSpace(tau), tau), b = camCockpitOwn(t), u = ss(t, T3.windowIn, T3.windowIn + 0.35);
  return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: Math.exp(lerp(lg(a.z), lg(b.z), u)), r: lerp(a.r ?? 0, b.r ?? 0, u)};
};
/** outline weight in a close-up: grows with the square root of the zoom, not linearly */
export const inkFor = (z: number) => clamp(1 / Math.sqrt(Math.max(1, z)), 0.4, 1);
/** the dial on screen at the match (centre and radius) */
export const WATCH_SCREEN = (() => {
  const c = camCockpitOwn(T3.match - 1 / 30), W = watchWorld(T3.match - 1 / 30);
  const s = onScreen(W, c);
  return {x: s.x, y: s.y, r: WATCH_DIAL * A.s * c.z};
})();
/** a mouth change spread over a few frames: [time, mouth] keys, each change blended over `d` seconds */
type M = 'smile' | 'flat' | 'o' | 'frown' | 'gasp' | 'soft' | 'tremble';
export const mouthAt = (t: number, keys: [number, M][], d = 0.12) => {
  let i = 0;
  while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  if (i + 1 < keys.length && t > keys[i + 1][0] - d) return {mouth: keys[i][1], mouthTo: keys[i + 1][1], mouthK: sm((t - (keys[i + 1][0] - d)) / d)};
  return {mouth: keys[i][1]};
};
/** his face in the cockpit: the porthole (wonder), concern creeping in, then down at his wrist, held until the raise */
/** V3 faces: the spiky fringe a little higher and the brows on the skin below it; 'sad' drawn as a symmetric knit */
export const v3Face = <E extends {sad?: number; knit?: number}>(e: E): E & {fringe: number; browDy: number} => ({fringe: 9, browDy: 1, ...e, knit: Math.max(e.knit ?? 0, e.sad ?? 0), sad: 0});
export const cockpitFace = (t: number) => {
  const down = ss(t, T3.glance, T3.glance + 0.16);
  const concern = ss(t, 4.3, 4.58);
  const raised = ss(t, T3.raise + 0.1, T3.raiseEnd);
  const m = mouthAt(t, [[0, 'o'], [4.5, 'flat']], 0.14);
  return v3Face({
    // concern: the mouth closes from the 'o' of wonder to a line whose corners turn down a little
    ...(t >= 4.5 ? {mouth: 'flat' as M, mouthTo: 'frown' as M, mouthK: 0.4 * ss(t, 4.5, 4.66)} : m), open: 0.22,
    wide: 0.45 * (1 - concern) + 0.12, brows: 0.4 * (1 - concern) - 0.05 * concern,
    knit: concern * (1 - 0.3 * raised), turn: lerp(-0.35, -0.5, down * (1 - raised)), lookX: lerp(lerp(-0.85, -0.6, concern), lerp(-1.05, -0.7, raised), down),
    lookY: lerp(-0.7, lerp(1.25, 1.0, raised), down),
    // a 4-frame blink as the eyes drop to the wrist (closed on the middle frame); the lids stay lowered while he looks down
    blink: Math.min(1 - 0.96 * Math.sin(Math.PI * clamp((t - (T3.glance - 0.03)) / 0.14)) ** 2, 1 - 0.38 * down),
  });
};

// ==== 5 the room (V3 draws the room MIRRORED about the window's centre: door and clock right of the window) ==========
export const MIRROR_X = 2 * ROOM.win.cx; // 1660
export const rx = (x: number) => MIRROR_X - x;
export const CLOCK3 = {x: rx(ROOM.clock.x), y: ROOM.clock.y, r: ROOM.clock.r};
/** the clock's cream face (0.82 r) matches the watch's dial at the cut: rim on bezel, markers and hands on theirs */
const ZC = WATCH_SCREEN.r / (CLOCK3.r * 0.82);
const CAM_CLOCK3: Cam = {x: CLOCK3.x - (WATCH_SCREEN.x - 540) / ZC, y: CLOCK3.y - (WATCH_SCREEN.y - 960) / ZC, z: ZC};
/** at the match from inside to outside, the window glass spans this screen height (the same for the house front) */
export const WIN_MATCH = {cx: 540, cy: 960, h: 820};
const ZWIN = WIN_MATCH.h / ROOM.win.h;
export const camRoomPast = (t: number): Cam =>
  keyCam(t, [
    [T3.match, CAM_CLOCK3],
    [T3.toWindow, {...CAM_CLOCK3, z: ZC * 0.985}],
    [T3.windowMatch, {x: ROOM.win.cx, y: ROOM.win.cy, z: ZWIN}],
  ], true);
/** the wall clock races from the match (11:00): the minute hand steps clockwise, at most ~33 deg a frame (readable) */
export const homeClockMinutes = (t: number) => {
  const x = Math.max(0, t - T3.match);
  // minutes per second: ramps from 0 to 165 (= 33 deg per frame on the minute hand) over 0.4 s, then holds
  const R = 165, ramp = 0.4;
  return 660 + (x < ramp ? (R * x * x) / (2 * ramp) : (R * ramp) / 2 + R * (x - ramp));
};
/** the smear trails about one frame of the hands' travel (never a fan that hides where the hands are) */
export const homeClockBlur = (t: number) => 0.11 * ss(t, T3.match + 0.08, T3.match + 0.4);

// ==== 6-9 the garden and the house front (V2 yard, unmirrored; the family-room window is YARD.windowV3) ==============
const WV = YARD.windowV3;
const ZEXT = WIN_MATCH.h / (WV.y1 - WV.y0);
const CAM_EXT: Cam = {x: WV.cx, y: (WV.y0 + WV.y1) / 2, z: ZEXT};
/** the years: the house front (window, door), the garden and tree, the fence and gate, the friend, the landing spot */
export const CAM_YEARS: Cam = {x: 1215, y: 1265, z: 0.9};
export const YS = 0.62; // figure scale in the garden (the V2 two-shot scale)
/** the friend waits on the pavement LEFT of the gate, clear of its opening (the way to the door never passes him) */
export const FRIEND = {x: 1030, y: 1610};
export const FRIEND_X = FRIEND.x;
export const FEET = 1630; // the pavement line
/** where he stops: in front of the right half of the gate, a step nearer the camera than his friend */
export const ASTRO_MEET = {x: 1200, y: 1650};
export const ASTRO_MEET_X = ASTRO_MEET.x;
/** the ship lands in the street left of them, well clear of the friend (hull, legs and retro jets) */
export const LAND = {x: 665, y: FEET + 62};
export const CAP_S = 0.93;
export const LEG_SPREAD = 0;
/** the two faces together */
const HEADY = (feetY: number) => feetY + (HEAD_Y + 6) * YS;
const CAM_FACES: Cam = {x: (FRIEND.x + ASTRO_MEET.x) / 2 + 4, y: (HEADY(FRIEND.y) + HEADY(ASTRO_MEET.y)) / 2 + 66, z: 2.4};
const CAM_LAND: Cam = {x: 930, y: 1330, z: 1.04};
/** the walk to the door ends on a framing that holds the path and the door */
const CAM_DOOR: Cam = {x: 1480, y: 1250, z: 1.6};
const T_PULL = T3.turnToHouse + 0.05;
export const camYard = (t: number): Cam => {
  if (t < T3.pullEnd) {
    // pull back from the house's window to the garden (zoom to point), starting and ending at rest
    const e = e5((t - T3.windowMatch) / (T3.pullEnd - T3.windowMatch));
    const z = Math.exp(lerp(lg(CAM_EXT.z), lg(CAM_YEARS.z), e));
    const w = (1 / CAM_EXT.z - 1 / z) / (1 / CAM_EXT.z - 1 / CAM_YEARS.z);
    const wx = w + 0.28 * Math.sin(Math.PI * w); // lead the pan a little, so the garden and the friend come in early
    return {x: lerp(CAM_EXT.x, CAM_YEARS.x, wx), y: lerp(CAM_EXT.y, CAM_YEARS.y, w), z};
  }
  if (t >= T_PULL) {
    // from the faces to the door in ONE eased move: x/y on a single S-curve over the whole walk, the zoom-out finishing
    // in the first 60% of it (no stop between the pull-out and the track)
    const u = clamp((t - T_PULL) / (T3.inside - T_PULL));
    const ep = e5(u), ez = e5(clamp(u / 0.6));
    const a = {...CAM_FACES, x: CAM_FACES.x + 4};
    return {x: lerp(a.x, CAM_DOOR.x, ep), y: lerp(a.y, CAM_DOOR.y, ep), z: Math.exp(lerp(lg(a.z), lg(CAM_DOOR.z), ez))};
  }
  return keyCam(t, [
    [T3.pullEnd, CAM_YEARS],
    [T3.descent, CAM_YEARS],
    [T3.landing + 0.08, CAM_LAND],
    [T3.faces + 0.12, CAM_FACES],
    [T_PULL, {...CAM_FACES, x: CAM_FACES.x + 4}],
  ], true);
};
/** seasons cycle (twice, spring to spring), the tree grows, the neighbourhood changes, the friend ages - in view */
export const GROW0 = 10.2; // the tree is in frame from here on
export const yardD = (t: number) => lerp(0.04, 1, ss(t, GROW0, T3.yearsEnd));
export const yardSeason = (t: number) => 0.06 + 2 * clamp((t - (T3.windowMatch + 0.05)) / (T3.yearsEnd - T3.windowMatch - 0.05));
/** he is seen young in the street view first (the pull-back brings him in), then ages in his place */
export const AGE0 = 10.2;
export const friendAge = (t: number) => lerp(0.05, 1, ss(t, AGE0, T3.yearsEnd + 0.05));
/** the capsule descends to its landing spot in the street, still moving a little at contact: it settles on its legs
 *  (a compression and a small rebound), and the fold-down step drops under the hatch as it opens */
export const capsuleYard = (t: number) => {
  const u = clamp((t - T3.descent) / (T3.landing - T3.descent));
  const y = lerp(LAND.y - 2300, LAND.y, 1 - (1 - u) * (1 - u) * (1 - u) * 0.15 - (1 - u) * (1 - u) * 0.85);
  const k = clamp((t - T3.landing) / 0.32);
  const dip = 7 * Math.sin(Math.PI * Math.min(1, k / 0.45)) * (k < 0.45 ? 1 : 0) - 2 * Math.sin(Math.PI * clamp((k - 0.45) / 0.55));
  const opened = ss(t, T3.hatch, T3.hatch + 0.2) * (1 - 0.8 * ss(t, T3.arrive + 0.2, T3.arrive + 0.7));
  return {x: LAND.x, y: t < T3.descent ? LAND.y - 2600 : y + dip, retro: 1 - ss(t, T3.landing - 0.1, T3.landing + 0.02), legs: ss(t, T3.landing - 0.42, T3.landing - 0.1), hatch: opened, dip,
    step: ss(t, T3.hatch + 0.06, T3.hatch + 0.22) * (1 - ss(t, T3.arrive + 0.2, T3.arrive + 0.6))};
};
export const HATCH_W = {x: LAND.x + CAPSULE2.hatch.x * CAP_S, y: LAND.y + CAPSULE2.hatch.y * CAP_S, rx: CAPSULE2.hatch.rx * CAP_S, ry: CAPSULE2.hatch.ry * CAP_S};
export const SILL_Y = LAND.y + CAPSULE2.sill * CAP_S + 6;
/** the fold-down step's tread (world y) */
export const STEP_TREAD = LAND.y - 16;
export const ROAD_Y = LAND.y + 30;
/** a walk's progress 0..1 with an even pace: accelerate over the first k of the time, decelerate over the last k */
export const trap = (t: number, t0: number, t1: number, k = 0.2) => {
  const x = clamp((t - t0) / (t1 - t0));
  const c = 1 / (2 * k * (1 - k));
  return x < k ? c * x * x : x < 1 - k ? (x - k / 2) / (1 - k) : 1 - c * (1 - x) * (1 - x);
};
/** a walk's progress with its own ramps: ka of the time accelerating from rest (0 = already walking), kd decelerating
 *  to rest (0 = still walking at the end, e.g. into a cut) */
export const trap2 = (t: number, t0: number, t1: number, ka: number, kd: number) => {
  const x = clamp((t - t0) / (t1 - t0));
  const v = 1 / (1 - (ka + kd) / 2);
  if (ka > 0 && x < ka) return (v * x * x) / (2 * ka);
  if (kd > 0 && x > 1 - kd) return 1 - (v * (1 - x) * (1 - x)) / (2 * kd);
  return v * (ka / 2 + (x - ka));
};
/** a polyline route sampled by walking distance: screen-vertical moves are moves in depth, foreshortened on screen,
 *  so they count `ky` times their screen length (more, shorter-looking steps when walking toward or away from us) */
const KY = 1.5;
const segLen = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, KY * (b.y - a.y));
const route = (pts: Pt[]): Route => {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + segLen(pts[i - 1], pts[i]));
  const total = L[L.length - 1];
  const at = (s0: number): Pt => {
    const s = clamp(s0, 0, total);
    let i = 1;
    while (i < L.length - 1 && L[i] < s) i++;
    const u = (s - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
    return {x: lerp(pts[i - 1].x, pts[i].x, u), y: lerp(pts[i - 1].y, pts[i].y, u)};
  };
  /** unit direction of travel at arc length s (smoothed over a short window) */
  const dir = (s: number) => {
    const a = at(Math.max(0, s - 12)), b = at(Math.min(total, s + 12));
    const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return {dx: (b.x - a.x) / L, dy: (b.y - a.y) / L};
  };
  return {total, at, dir};
};
const bez = (a: Pt, c: Pt, b: Pt, n = 24) => Array.from({length: n + 1}, (_, k) => {
  const u = k / n;
  return {x: (1 - u) * (1 - u) * a.x + 2 * u * (1 - u) * c.x + u * u * b.x, y: (1 - u) * (1 - u) * a.y + 2 * u * (1 - u) * c.y + u * u * b.y};
});
/** the time at which a walk's body (arc s(t), increasing) reaches each arc length in `arcs` */
const timesAt = (sAt: (t: number) => number, t0: number, t1: number, arcs: number[]) =>
  arcs.map((a) => {
    for (let t = t0; t <= t1 + 1e-6; t += 1 / 240) if (sAt(t) >= a - 1e-3) return Math.round(t * 1000) / 1000;
    return t1;
  });
/** out of the hatch: from inside it a step forward and down onto the fold-down step, a step down to the road, then along
 *  the road in front of his friend - low, nearer the camera, so his helmet passes below his friend's face - and up to
 *  the kerb at the gate */
/** standing inside the hatch: feet behind its sill (hidden by the rim) */
export const B0 = {x: HATCH_W.x, y: HATCH_W.y + HATCH_W.ry - 6};
const B1 = {x: HATCH_W.x + 14, y: STEP_TREAD};
const B2 = {x: HATCH_W.x + 46, y: ROAD_Y + 6};
const RET = route([B0, B1, ...bez(B2, {x: 1070, y: 1842}, ASTRO_MEET, 30)]);
const ARC_B1 = segLen(B0, B1);
const ARC_B2 = ARC_B1 + segLen(B1, B2);
export const RET_STEP = 175; // rig units per step on the way to his friend (a hurried walk)
export const RET_PLANTS = evenPlants(ARC_B2, RET.total, RET_STEP * YS, [0, ARC_B1]);
export const RET_GAIT: GaitOpts = {plants: RET_PLANTS, first: 1, scale: YS, lane: 12, near: 0, lift: 20, bend: 3};
/** body arc length along the way back: the climb-down (slow, eased), then the walk (accelerates, settles at his friend) */
export const retArc = (t: number) =>
  t < T3.stepDown ? ARC_B2 * ss(t, T3.stepOut, T3.stepDown) : lerp(ARC_B2, RET.total, trap2(t, T3.stepDown, T3.arrive, 0.16, 0.24));
export const astroReturn = (t: number) => {
  const s = retArc(t);
  const g = gait(RET, s, RET_GAIT);
  return {...g.body, s, g, walking: t > T3.stepOut && t < T3.arrive, ...RET.dir(s)};
};
export const astroReturnX = (t: number) => astroReturn(t).x;
/** the climb-down's phases: inside the hatch (behind its rim), coming out over the sill, out in front of the capsule */
// -1 not yet visible; 0 standing inside (clipped to the opening, rim drawn over him); 1 climbing down (the opening plus
// the space in front of the capsule: his trailing foot stays hidden behind the sill until it swings out); 2 out
const HATCH_OUT = (ARC_B1 + ARC_B2) / 2; // the trailing foot has landed on the road
export const hatchPhase = (t: number) => (t < T3.hatch + 0.05 ? -1 : t < T3.stepOut ? 0 : retArc(t) < HATCH_OUT ? 1 : 2);
export const inHatch = (t: number) => hatchPhase(t) <= 0;
export const returnSteps = () => timesAt(retArc, T3.stepOut, T3.arrive + 0.3, landings(RET_PLANTS, 1));
/** up the path to the front door: straight up from where he stood through the right half of the gate (clear of his
 *  friend), then along the path (a little smaller with depth) */
const DOOR_PATH = route([ASTRO_MEET, {x: 1198, y: YARD.fenceY + 8}, ...Array.from({length: 40}, (_, k) => {
  const u = 0.06 + (0.94 * k) / 39;
  const p = yardPath(u);
  return {x: p.x + 22 * (1 - ss(u, 0.05, 0.5)), y: p.y};
})]);
export const PATH_STEP = 200;
export const DOOR_PLANTS = evenPlants(0, DOOR_PATH.total, PATH_STEP * YS * 0.97);
export const DOOR_GAIT: GaitOpts = {plants: DOOR_PLANTS, first: 1, scale: YS, lane: 10, near: 0, lift: 22, back: true, bend: 3};
export const doorArc = (t: number) => DOOR_PATH.total * trap2(t, T3.walk, T3.inside, 0.2, 0.06);
export const astroDoor = (t: number) => {
  // an even walk that carries him over the doorstep at the cut (the door has swung open in front of him)
  const s = doorArc(t);
  const g = gait(DOOR_PATH, s, DOOR_GAIT);
  const p = g.body;
  // depth scale from the path (1 at the gate .. ~0.94 at the door)
  const depth = lerp(1, 0.938, clamp((YARD.fenceY - p.y) / (YARD.fenceY - YARD.door.y1 - 26)));
  return {x: p.x, y: p.y, s: YS * depth, dist: s, g, ...DOOR_PATH.dir(s)};
};
export const doorWalkSteps = () => timesAt(doorArc, T3.walk, T3.inside, landings(DOOR_PLANTS, 1)).filter((t) => t < T3.inside - 0.01);
/** when his feet cross the gate line (he goes behind the fence layer) */
export const T_GATE = (() => {
  for (let t = T3.walk; t < T3.atDoor; t += 1 / 240) if (astroDoor(t).y < YARD.fenceY + 2) return t;
  return T3.walk + 0.3;
})();

// ==== 10-12 the room, present (mirrored coordinates) ===================================================================
export const RS = ROOM.figScale; // 1.4
export const F3 = ROOM.floor;
export const DOOR3 = {x0: rx(60), x1: rx(-200), cx: rx(-70), y0: 830};
export const STOP3 = 1440; // where he stands, an arm's length from the photograph on the table (clear of the doorway)
/** his old friend stands in the open doorway, on the threshold, wholly inside the opening (the leaf is on the other jamb) */
export const FRIEND_DOOR_X = DOOR3.cx + 30;
/** he comes in over the threshold mid-stride (walking left, into the room) and stops by the table: planted feet along a
 *  straight line from the porch, decelerating over his last steps */
const ROOM_ROUTE = route([{x: DOOR3.cx + 90, y: F3}, {x: STOP3, y: F3}]);
const ROOM_S0 = 100; // where he is at the cut (just inside the door)
export const ROOM_PLANTS = evenPlants(0, ROOM_ROUTE.total, 92 * RS);
export const ROOM_GAIT: GaitOpts = {plants: ROOM_PLANTS, first: 1, scale: RS, lane: 8, near: 1, lift: 16, bend: 3};
export const roomArc = (t: number) => lerp(ROOM_S0, ROOM_ROUTE.total, trap2(t, T3.inside, T3.roomStop, 0, 0.55));
export const roomAstro = (t: number) => gait(ROOM_ROUTE, roomArc(t), ROOM_GAIT);
export const roomAstroX = (t: number) => roomAstro(t).body.x;
export const roomWalkSteps = () => timesAt(roomArc, T3.inside, T3.roomStop + 0.3, landings(ROOM_PLANTS, 1).filter((a) => a > ROOM_S0 + 1));
/** the photograph (mirrored room coords): print rect, centre, the young faces */
const PR = V3_PHOTO.print;
export const PHOTO3 = {x0: rx(PR.x + PR.w), x1: rx(PR.x), y0: PR.y, y1: PR.y + PR.h, cx: rx(PR.x + PR.w / 2), cy: PR.y + PR.h / 2};
export const PHOTO_FACES = V3_PHOTO.faces.map((f) => ({who: f.who, x: rx(f.x), y: f.y, r: f.r}));
const SON = PHOTO_FACES.find((f) => f.who === 'son') ?? PHOTO_FACES[0], FR = PHOTO_FACES.find((f) => f.who === 'fr') ?? PHOTO_FACES[1];
const ASTRO_HEAD = {x: STOP3, y: F3 + (HEAD_Y + 0) * RS};
/** his watch in the room (raised pose) */
export const roomWatchWorld = () => {
  const w = watchLocal(RAISED);
  return {x: STOP3 + w.x * RS, y: F3 + w.y * RS};
};
const ZLOOP = LOOP_WIN.r / (WATCH_DIAL * RS);
/** an eased move between two cameras at rest: log zoom on e5, position on the zoom-to-point path (pans when the zoom
 *  barely changes) - velocity is zero at both ends, so a chain of these never kinks */
const move = (a: Cam, b: Cam, u0: number): Cam => {
  const u = e5(u0);
  const la = lg(a.z), lb = lg(b.z);
  const z = Math.exp(lerp(la, lb, u));
  if (Math.abs(lb - la) < 0.15) return {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z};
  const w = (1 / a.z - 1 / z) / (1 / a.z - 1 / b.z);
  return {x: lerp(a.x, b.x, w), y: lerp(a.y, b.y, w), z};
};
const chain = (t: number, keys: [number, number, Cam][]): Cam => {
  // keys: [t0, t1, camera at t1]; the first key's camera is held before it, each move starts from the previous camera
  let c = keys[0][2];
  for (let i = 1; i < keys.length; i++) {
    const [t0, t1, b] = keys[i];
    if (t < t0) return c;
    if (t < t1) return move(c, b, (t - t0) / (t1 - t0));
    c = b;
  }
  return c;
};
/** the room shots: the frame holds while he walks in and stops; a slow drift toward him and the photograph while the
 *  change comes over him; one eased push into the young faces in the photograph; out to his face, held; out to the
 *  two-shot as his old friend steps into the doorway */
const ROOM_IN: Cam = {x: 1566, y: 1162, z: 1.36};
const ROOM_HIM: Cam = {x: 1408, y: 1182, z: 1.75};
const YOUNG: Cam = {x: (SON.x + FR.x) / 2, y: (SON.y + FR.y) / 2, z: 5.0};
// (his face high in frame, so his hanging hands and the watch stay above the caption)
const FACE: Cam = {x: ASTRO_HEAD.x - 6, y: ASTRO_HEAD.y + 112, z: 2.05};
const TWO_SHOT: Cam = {x: 1546, y: 1150, z: 1.1};
const roomMain = (t: number): Cam =>
  chain(t, [
    [T3.inside, T3.inside, ROOM_IN],
    [T3.inside, T3.photoPush, ROOM_HIM],
    [T3.photoPush, T3.toFace, YOUNG],
    [T3.toFace + 0.1, T3.faceHold, FACE],
    [T3.faceHold + 0.2, T3.friendIn + 0.85, TWO_SHOT],
    [T3.friendIn + 0.85, T3.loopPush, {...TWO_SHOT, x: TWO_SHOT.x - 8, z: 1.17}],
  ]);
export const camRoomPresent = (t: number): Cam => {
  if (t < T3.loopPush) return roomMain(t);
  // into the watch face, eased in and out: the dial arrives upright on LOOP_WIN, at rest, on the last frame before the cut
  const c0 = roomMain(T3.loopPush);
  const e = e5((t - T3.loopPush) / (T3.loopCut - 1 / 30 - T3.loopPush));
  const z = Math.exp(lerp(lg(c0.z), lg(ZLOOP), e));
  const wv = roomWatchWorld();
  const s0 = onScreen(wv, c0);
  const ee = e5(clamp(((t - T3.loopPush) / (T3.loopCut - 1 / 30 - T3.loopPush)) * 1.1));
  return camAt(wv, lerp(s0.x, LOOP_WIN.x, ee), lerp(s0.y, LOOP_WIN.y, ee), z, -WATCH_ROT_END * e);
};
