// V3 states and cameras. Every transition rides on something visible: the ship, its window, his wrist, the clock at
// home, the window of the house, the garden, the front door, the photograph, his watch.
import {clamp, DUR, lerp, ss, sm} from '../lib';
import {Cam, keyCam, mixCam, toInner, Map2} from '../story';
import {T3, spaceTau} from './timing';
import {CAPSULE2} from '../v2/craft';
import {COCKPIT_ASTRO} from '../v2/cockpit';
import {ArmA, astroReach, astroHandLocal, HEAD_Y} from '../art/figures';
import {ROOM} from '../v2/room';
import {YARD, yardPath} from '../v2/yard';

const e5 = (x: number) => {
  const u = clamp(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const lg = Math.log;

// ==== 1-2 space: the ship (M units, the hole at the origin) ===========================================================
/** M per capsule drawing unit (the capsule is 8.4 M tall) */
export const SM = 8.4 / CAPSULE2.height;
const P0 = {x: 9.4, y: 15.0};
const VX = 0.55, VY = -1.55;
/** the ship drifts up and to the right, straightening to fly straight up while the camera closes on its window */
const vxInt = (tau: number) => {
  // integral of VX * (1 - ss(s, a, b)) ds from 0 to tau (closed form of the smoothstep integral)
  const a = 2.9, b = 3.9;
  if (tau <= a) return VX * tau;
  const u = Math.min(1, (tau - a) / (b - a));
  return VX * (a + (b - a) * (u - (u * u * u - (u * u * u * u) / 2)));
};
export const shipPos = (tau: number) => ({x: P0.x + vxInt(tau), y: P0.y + VY * tau});
/** nose along the direction of travel (deg, 0 = nose up) */
export const shipRot = (tau: number) => (Math.atan2(VX * (1 - ss(tau, 2.9, 3.9)), -VY) * 180) / Math.PI;
/** the cockpit window's centre (M) */
export const winPos = (tau: number) => {
  const p = shipPos(tau), r = (shipRot(tau) * Math.PI) / 180, d = -CAPSULE2.win.y * SM;
  return {x: p.x + d * Math.sin(r), y: p.y - d * Math.cos(r)};
};
export const WIN_R = CAPSULE2.win.r * SM; // window glass radius (M)
/** the camera follows the ship, holding it low right of frame; the hole dominates upper left */
const SHIP_SCREEN = {x: 250, y: 370}; // ship offset from screen centre (px)
const follow = (tau: number, z: number): Cam => {
  const p = shipPos(tau);
  return {x: p.x - SHIP_SCREEN.x / z, y: p.y - SHIP_SCREEN.y / z, z};
};
export const CAM_OPEN = follow(0, 38);
/** the cockpit window as a portal: its glass maps to a circle of r 1230 cockpit px around (540, 990) */
export const COCKPIT_VIEW = {x: 540, y: 990, r: 1230};
const Z_HANDOFF = COCKPIT_VIEW.r / WIN_R; // the space zoom at which the cockpit camera is z = 1
export const windowMap = (tau: number): Map2 => ({o: winPos(tau), s: WIN_R / COCKPIT_VIEW.r, q: {x: COCKPIT_VIEW.x, y: COCKPIT_VIEW.y}});
const winScreen = (tau: number, c: Cam) => {
  const w = winPos(tau);
  return {x: 540 + (w.x - c.x) * c.z, y: 960 + (w.y - c.y) * c.z};
};
const camOnWin = (tau: number, sx: number, sy: number, z: number): Cam => {
  const w = winPos(tau);
  return {x: w.x - (sx - 540) / z, y: w.y - (sy - 960) / z, z};
};

/** the loop: the watch face at the end matches the ship's window at this screen circle (set from the room camera) */
export const LOOP_WIN = {x: 540, y: 900, r: 210};
export const camSpace = (t: number): Cam => {
  const tau = spaceTau(t);
  if (tau < 0) {
    // the pull-back out of the window, decelerating into the opening frame (continuous with frame 0)
    const v = (tau - (T3.loopCut - DUR)) / (DUR - T3.loopCut);
    const e = 1 - (1 - clamp(v)) ** 3;
    const z = Math.exp(lerp(lg(LOOP_WIN.r / WIN_R), lg(CAM_OPEN.z), e));
    const s0 = {x: LOOP_WIN.x, y: LOOP_WIN.y}, s1 = winScreen(0, CAM_OPEN);
    const ee = 1 - (1 - clamp(v)) ** 2.4;
    return camOnWin(tau, lerp(s0.x, s1.x, ee), lerp(s0.y, s1.y, ee), z);
  }
  if (tau < T3.push) {
    // a controlled follow: a slow push from 38 to 40 px/M (eased in from rest at the loop seam)
    const z = lerp(38, 40, ss(tau, 0, T3.push));
    return follow(tau, z);
  }
  // toward the cockpit window, then into it (S-curve in log zoom; the window slides to the centre early)
  const u = clamp((tau - T3.push) / (T3.windowIn - T3.push));
  const z = Math.exp(lerp(lg(40), lg(Z_HANDOFF), e5(u)));
  const c0 = follow(T3.push, 40);
  const s0 = winScreen(T3.push, c0);
  const k = ss(u, 0, 0.62);
  return camOnWin(Math.min(tau, T3.windowIn), lerp(s0.x, 540, k), lerp(s0.y, 960 + (COCKPIT_VIEW.y - 980) * 0, k), z);
};

// ==== 3-4 cockpit (cockpit px; the seated astronaut at COCKPIT_ASTRO) ==================================================
const A = COCKPIT_ASTRO;
const REST_L: ArmA = {a: 16, b: 8};
/** the raised wrist: elbow out at his side, forearm level across the left of his chest, the glove beside (not on) the
 *  chest unit and well below his face; the dial reads upright (its 3 o'clock toward the hand) */
export const WATCH_HAND = {x: -76, y: -236};
const handAt = (arm: ArmA) => astroHandLocal(arm, -1);
const H0 = (() => {
  const P = handAt(REST_L);
  return {x: P.hx, y: P.hy};
})();
const RAISED: ArmA = astroReach(WATCH_HAND.x, WATCH_HAND.y, -1, -1);
/** his left-on-screen arm through the raise: the HAND travels on an arc and the arm is solved each frame */
export const cockpitArm = (t: number): ArmA => {
  const u = e5((t - T3.raise) / (T3.raiseEnd - T3.raise));
  if (u <= 0) return REST_L;
  if (u >= 1) return RAISED;
  const c = {x: (H0.x + WATCH_HAND.x) / 2 - 30, y: (H0.y + WATCH_HAND.y) / 2 + 24};
  const x = (1 - u) * (1 - u) * H0.x + 2 * u * (1 - u) * c.x + u * u * WATCH_HAND.x;
  const y = (1 - u) * (1 - u) * H0.y + 2 * u * (1 - u) * c.y + u * u * WATCH_HAND.y;
  const ik = astroReach(x, y, -1, -1);
  const k = clamp(u / 0.2);
  return {a: lerp(REST_L.a, ik.a, k), b: lerp(REST_L.b, ik.b, k)};
};
/** the watch on that wrist: 66% along the forearm (as the rig draws it); dial size and orientation */
export const WATCH_R = 22; // Watch2 r (rig units)
export const watchLocal = (arm: ArmA) => {
  const P = handAt(arm);
  return {x: P.ex + (P.hx - P.ex) * 0.66, y: P.ey + (P.hy - P.ey) * 0.66, angle: P.angle};
};
/** the dial turns with the wrist: its 3 o'clock points along the forearm toward the hand */
export const watchRot = (angle: number) => angle - 90;
export const watchWorld = (t: number) => {
  const w = watchLocal(cockpitArm(t));
  return {x: A.x + w.x * A.s, y: A.y + w.y * A.s, rot: watchRot(w.angle)};
};
/** the dial radius on screen when the camera holds the watch close */
export const WATCH_DIAL = 99 * (WATCH_R / 100); // rig units
/** the dial's tilt with the wrist raised (degrees) */
const WATCH_ROT_END = watchRot(watchLocal(RAISED).angle);
const ZW = 290 / (WATCH_DIAL * A.s);
export const camCockpitOwn = (t: number): Cam => {
  const base: Cam = {x: 540, y: lerp(975, 990, ss(t, T3.windowIn, T3.raise)), z: lerp(1.0, 1.04, ss(t, T3.windowIn, T3.pushWatch))};
  if (t < T3.pushWatch) return base;
  const u = clamp((t - T3.pushWatch) / (T3.watchClose - T3.pushWatch));
  const e = e5(u);
  const z = Math.exp(lerp(lg(base.z), lg(ZW), e)) * lerp(1, 1.035, ss(t, T3.watchClose, T3.match));
  const W = watchWorld(t);
  const sp0 = {x: 540 + (W.x - base.x) * base.z, y: 960 + (W.y - base.y) * base.z};
  const sx = lerp(sp0.x, 540, e), sy = lerp(sp0.y, 960, e);
  // a gentle roll that follows the forearm, so the dial ends upright (for the match to the wall clock)
  const r = -WATCH_ROT_END * e;
  const q = (-r * Math.PI) / 180, dx = sx - 540, dy = sy - 960;
  const vx = dx * Math.cos(q) - dy * Math.sin(q), vy = dx * Math.sin(q) + dy * Math.cos(q);
  return {x: W.x - vx / z, y: W.y - vy / z, z, r};
};
export const camCockpit = (t: number): Cam => {
  if (t >= T3.windowIn + 0.35) return camCockpitOwn(t); // (keeps the roll)
  const tau = Math.min(t, T3.windowIn);
  return mixCam(toInner(camSpace(tau), windowMap(tau)), camCockpitOwn(t), ss(t, T3.windowIn, T3.windowIn + 0.35));
};
/** outline weight in a close-up: grows with the square root of the zoom, not linearly */
export const inkFor = (z: number) => clamp(1 / Math.sqrt(Math.max(1, z)), 0.4, 1);
/** the dial on screen at the match (centre and radius) */
export const WATCH_SCREEN = (() => {
  const c = camCockpitOwn(T3.match - 1 / 30), W = watchWorld(T3.match - 1 / 30);
  return {x: 540 + (W.x - c.x) * c.z, y: 960 + (W.y - c.y) * c.z, r: WATCH_DIAL * A.s * c.z};
})();
/** his face while it is in view: the porthole (wonder), concern creeping in, then down at his wrist */
export const cockpitFace = (t: number) => {
  const down = ss(t, T3.glance, T3.glance + 0.18);
  const concern = ss(t, 4.45, 4.85);
  return {
    mouth: (t < 4.55 ? 'o' : 'flat') as 'o' | 'flat', open: 0.22, wide: 0.45 * (1 - down) + 0.15, brows: 0.45 * (1 - down) + 0.2 * concern,
    sad: 0.35 * concern, turn: lerp(-0.35, -0.1, down), lookX: lerp(-0.85, -0.25, down), lookY: lerp(-0.7, 0.85, down),
    blink: t > 4.68 && t < 4.73 ? 0.2 : 1,
  };
};

// ==== 5 the room (V3 draws the room MIRRORED about the window's centre: door and clock right of the window) ==========
export const MIRROR_X = 2 * ROOM.win.cx; // 1660
export const rx = (x: number) => MIRROR_X - x;
export const CLOCK3 = {x: rx(ROOM.clock.x), y: ROOM.clock.y, r: ROOM.clock.r};
const ZC = WATCH_SCREEN.r / CLOCK3.r;
const CAM_CLOCK3: Cam = {x: CLOCK3.x - (WATCH_SCREEN.x - 540) / ZC, y: CLOCK3.y - (WATCH_SCREEN.y - 960) / ZC, z: ZC};
/** at the match from inside to outside, the window glass spans this screen rect (the same for the house front) */
export const WIN_MATCH = {cx: 540, cy: 960, h: 1460};
const ZWIN = WIN_MATCH.h / ROOM.win.h;
export const camRoomPast = (t: number): Cam =>
  keyCam(t, [
    [T3.match, CAM_CLOCK3],
    [T3.toWindow, {...CAM_CLOCK3, z: ZC * 0.97}],
    [T3.windowMatch - 0.3, {x: ROOM.win.cx, y: ROOM.win.cy, z: ZWIN * 0.8}],
    [T3.windowMatch, {x: ROOM.win.cx, y: ROOM.win.cy, z: ZWIN}, 'stop'],
  ], true);
/** the wall clock races from the match (11:00): years */
export const homeClockMinutes = (t: number) => {
  const x = Math.max(0, t - T3.match);
  const K = 720 / 0.15 ** 3;
  return 660 + (x < 0.25 ? K * x ** 3 : K * 0.25 ** 3 + 3 * K * 0.25 ** 2 * (x - 0.25));
};
export const homeClockBlur = (t: number) => ss(t, T3.match + 0.05, T3.match + 0.22);

// ==== 6-9 the garden and the house front (V2 yard, unmirrored; the family-room window is YARD.windowV3) ==============
const WV = YARD.windowV3;
const ZEXT = WIN_MATCH.h / (WV.y1 - WV.y0);
const CAM_EXT: Cam = {x: WV.cx, y: (WV.y0 + WV.y1) / 2, z: ZEXT};
/** the years: the house front (window, door), the garden and tree, the fence and gate, the friend, the street */
export const CAM_YEARS: Cam = {x: 1290, y: 1270, z: 0.9};
export const CAM_YEARS_END: Cam = {x: 1230, y: 1330, z: 1.04};
export const YS = 0.62; // figure scale in the garden (the V2 two-shot scale)
export const FEET = 1630; // the pavement line where the friend waits
export const FRIEND_X = 1268, ASTRO_MEET_X = 1163;
export const LAND = {x: 960, y: FEET + 62};
export const CAP_S = 0.93;
/** the two faces together (heads at y ~1399) */
const CAM_FACES: Cam = {x: (FRIEND_X + ASTRO_MEET_X) / 2, y: 1470, z: 2.75};
export const camYard = (t: number): Cam => {
  if (t < T3.windowMatch + 0.75) {
    // pull back from the house's window to the garden (zoom to point)
    const u = clamp((t - T3.windowMatch) / 0.75);
    const e = 1 - (1 - u) ** 3;
    const z = Math.exp(lerp(lg(CAM_EXT.z), lg(CAM_YEARS.z), e));
    const w = (1 / CAM_EXT.z - 1 / z) / (1 / CAM_EXT.z - 1 / CAM_YEARS.z);
    return {x: lerp(CAM_EXT.x, CAM_YEARS.x, w), y: lerp(CAM_EXT.y, CAM_YEARS.y, w), z};
  }
  const a = astroDoor(t);
  return keyCam(t, [
    [T3.windowMatch + 0.75, CAM_YEARS],
    [T3.yearsEnd, CAM_YEARS_END],
    [T3.landing + 0.1, {x: 1170, y: 1330, z: 1.05}],
    [T3.arrive - 0.1, {x: 1200, y: 1420, z: 1.5}],
    [T3.faces + 0.4, CAM_FACES],
    [T3.turnToHouse, {...CAM_FACES, x: CAM_FACES.x + 6, z: CAM_FACES.z * 1.02}],
    [T3.turnToHouse + 0.35, {x: a.x + 40, y: a.y - 200, z: 1.75}],
    [T3.inside, {x: YARD.door.cx + 10, y: YARD.door.y0 + 150, z: 2.25}],
  ], true);
};
/** seasons cycle, the tree grows, the neighbourhood changes, the friend ages - continuously, in view */
export const yardD = (t: number) => lerp(0.04, 1, ss(t, T3.windowMatch + 0.1, T3.yearsEnd));
export const yardSeason = (t: number) => {
  const u = clamp((t - (T3.windowMatch + 0.1)) / (T3.yearsEnd - T3.windowMatch - 0.1));
  return t < T3.windowMatch + 0.1 ? 0.06 : 0.06 + u; // one year round, spring to spring (the tree, the city and the friend show the years)
};
export const friendAge = (t: number) => lerp(0.05, 1, ss(t, T3.windowMatch + 0.15, T3.yearsEnd - 0.1));
/** the capsule descends to its landing spot in the street (visible all through the years) */
export const capsuleYard = (t: number) => {
  const u = clamp((t - T3.descent) / (T3.landing - T3.descent));
  const y = lerp(LAND.y - 2300, LAND.y, 1 - (1 - u) * (1 - u) * (1 - u) * 0.15 - (1 - u) * (1 - u) * 0.85);
  return {x: LAND.x, y: t < T3.descent ? LAND.y - 2600 : y, retro: 1 - ss(t, T3.landing - 0.1, T3.landing + 0.02), legs: ss(t, T3.landing - 0.5, T3.landing - 0.15), hatch: ss(t, T3.hatch, T3.hatch + 0.2)};
};
export const HATCH_W = {x: LAND.x + CAPSULE2.hatch.x * CAP_S, y: LAND.y + CAPSULE2.hatch.y * CAP_S, rx: CAPSULE2.hatch.rx * CAP_S, ry: CAPSULE2.hatch.ry * CAP_S};
export const SILL_Y = LAND.y + CAPSULE2.sill * CAP_S + 6;
export const ROAD_Y = LAND.y + 24;
/** a walk's progress 0..1 with an even pace: accelerate over the first k of the time, decelerate over the last k */
export const trap = (t: number, t0: number, t1: number, k = 0.2) => {
  const x = clamp((t - t0) / (t1 - t0));
  const c = 1 / (2 * k * (1 - k));
  return x < k ? c * x * x : x < 1 - k ? (x - k / 2) / (1 - k) : 1 - c * (1 - x) * (1 - x);
};
const keyX = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], sm((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  return keys[keys.length - 1][1];
};
export const astroReturnX = (t: number) => keyX(t, [[T3.stepOut, HATCH_W.x], [T3.stepDown, HATCH_W.x + 46], [T3.arrive, ASTRO_MEET_X]]);
export const astroReturnFeet = (t: number) => (t < T3.stepDown ? lerp(SILL_Y, ROAD_Y, ss(t, T3.stepOut + 0.06, T3.stepDown)) : lerp(ROAD_Y, FEET, ss(t, T3.stepDown + 0.04, T3.arrive - 0.06)));
export const inHatch = (t: number) => t < T3.stepOut + 0.06;
/** up the path to the front door (feet on the path, a little smaller with depth) */
export const astroDoor = (t: number) => {
  const u = t < T3.atDoor ? 0.97 * trap(t, T3.turnToHouse + 0.12, T3.atDoor, 0.22) : lerp(0.97, 1, ss(t, T3.atDoor, T3.inside));
  const p = yardPath(u);
  const lead = clamp(u * 6);
  return {x: lerp(ASTRO_MEET_X, p.x, lead), y: lerp(FEET, p.y, lead), s: YS * lerp(1, p.depth, lead), u};
};

// ==== 10-12 the room, present (mirrored coordinates) ===================================================================
export const RS = ROOM.figScale; // 1.4
export const F3 = ROOM.floor;
export const DOOR3 = {x0: rx(60), x1: rx(-200), cx: rx(-70), y0: 830};
export const STOP3 = 1510; // where he stands, an arm's length from the photograph on the table
export const FRIEND_DOOR_X = DOOR3.cx + 118; // just inside, beside the open door leaf
/** he steps in through the doorway (walking left, into the room) and stops by the table */
export const roomAstroX = (t: number) => lerp(DOOR3.cx - 10, STOP3, trap(t, T3.inside, T3.roomStop, 0.3));
/** the photograph (mirrored room coords): print rect, centre, the young faces */
import {V3_PHOTO} from '../v2/room';
const PR = V3_PHOTO.print;
export const PHOTO3 = {x0: rx(PR.x + PR.w), x1: rx(PR.x), y0: PR.y, y1: PR.y + PR.h, cx: rx(PR.x + PR.w / 2), cy: PR.y + PR.h / 2};
export const PHOTO_FACES = V3_PHOTO.faces.map((f) => ({who: f.who, x: rx(f.x), y: f.y, r: f.r}));
const SON = PHOTO_FACES.find((f) => f.who === 'son')!, FR = PHOTO_FACES.find((f) => f.who === 'fr')!;
const ASTRO_HEAD = {x: STOP3, y: F3 + (HEAD_Y + 0) * RS};
/** his watch in the room (raised pose) */
export const roomWatchWorld = () => {
  const arm = astroReach(WATCH_HAND.x, WATCH_HAND.y, -1, -1);
  const w = watchLocal(arm);
  return {x: STOP3 + w.x * RS, y: F3 + w.y * RS};
};
const ZLOOP = LOOP_WIN.r / (WATCH_DIAL * RS);
export const camRoomPresent = (t: number): Cam => {
  const main = (tt: number) =>
    keyCam(tt, [
      [T3.inside, {x: DOOR3.cx - 60, y: 1190, z: 1.32}],
      [T3.roomStop, {x: STOP3 - 40, y: 1190, z: 1.4}],
      [T3.realise + 0.2, {x: (STOP3 + PHOTO3.cx) / 2, y: 1170, z: 1.75}],
      [T3.photoClose, {x: PHOTO3.cx - 30, y: PHOTO3.cy - 4, z: 4.4}],
      [T3.toFace, {x: (SON.x + FR.x) / 2, y: (SON.y + FR.y) / 2, z: 5.2}],
      [T3.toFace + 0.75, {x: ASTRO_HEAD.x - 10, y: ASTRO_HEAD.y + 30, z: 2.9}],
      [T3.friendIn + 0.75, {x: 1648, y: 1215, z: 1.38}],
      [T3.loopPush - 0.15, {x: 1634, y: 1222, z: 1.43}],
    ], true);
  if (t < T3.loopPush - 0.15) return main(t);
  // into the watch face: its dial lands on LOOP_WIN, where the ship's window takes over
  const c0 = main(T3.loopPush - 0.15);
  const u = clamp((t - (T3.loopPush - 0.15)) / (T3.loopCut - (T3.loopPush - 0.15)));
  const e = u * u * (3 - 2 * u) * 0.35 + u * u * 0.65;
  const z = Math.exp(lerp(lg(c0.z), lg(ZLOOP), e));
  const wv = roomWatchWorld();
  const s0 = {x: 540 + (wv.x - c0.x) * c0.z, y: 960 + (wv.y - c0.y) * c0.z};
  const sx = lerp(s0.x, LOOP_WIN.x, e), sy = lerp(s0.y, LOOP_WIN.y, e);
  return {x: wv.x - (sx - 540) / z, y: wv.y - (sy - 960) / z, z};
};
