// V5 hook cameras (HOOK owner). Everything runs on the loop clock (tau3: the end of the film is negative time), so
// the room shot at the end of the film (H3, 31.88-33.5) and the opening (A, 0-4.31) are one continuous camera across
// the seam.
//   roomCam5   the control room (2D stage, Room5.tsx), with a constant Dutch angle (ROOM_ROLL): H3's medium on her and
//              the big window (the extended channel outside), one push that runs on across the seam into A1's medium
//              close-up of the press (monotone cubic keys: it gathers pace with her reach, peaks round the press and
//              eases through "LASER"), a slow creep in toward her through the surge; after the crack it tracks her
//              recoil sideways (her face stays in frame, moving one way only); then the whip: a fast tilt up (2.12-2.25)
//              that the cut to the exterior carries on
//   winCam5    the view through the window: a fixed screen-space camera on the site from the room's position down the
//              slope (as V3's shelter), the rod tip on a stage point at depth WIN_DEPTH (the distant view parallaxes
//              less than the room on the dolly; on the whip, a rotation, it moves with the room)
//   extCam5    A3/A4 outside: the rocket (from low beside the tower's base, looking up the tower and the beam, rising
//              at the whip's speed and decelerating the whole way, the lens lengthening) into the storm wide (the deck
//              spread over the frame, the tower top and the beam into it) which drifts while the leader climbs and
//              connects; after the connection one push in onto V3's openCam, exact (zero relative velocity) at HAND5
//              (4.2, the A -> B contract), the push B's own push into the air beside the channel continues
import {clamp} from '../dc/math';
import {add3, basis, Cam3, len3, lookAt, mul3, sub3, TIP3, v3, V3} from '../v2/p3';
import {camScreen} from '../v2/Composite';
import {openCam, OPEN0} from '../v3/cams3';
import {tau3} from '../v3/timeline3';
import {ss} from '../lib';
import {manJoints} from '../dc/Man';
import {op5, T_REC, T_REC1} from './Room5_op';

// ------------------------------------------------------------------ monotone cubic keys (C1, no overshoot)
type K1 = [number, number];
/** a monotone piecewise cubic through keys (Fritsch-Carlson): continuous velocity, never overshoots a key */
export const pchip = (keys: K1[]) => {
  const n = keys.length;
  const h = keys.slice(0, -1).map((k, i) => keys[i + 1][0] - k[0]);
  const d = keys.slice(0, -1).map((k, i) => (keys[i + 1][1] - k[1]) / h[i]);
  const m: number[] = keys.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return d[n - 2];
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (t: number) => {
    if (t <= keys[0][0]) return keys[0][1] + m[0] * (t - keys[0][0]);
    if (t >= keys[n - 1][0]) return keys[n - 1][1] + m[n - 1] * (t - keys[n - 1][0]);
    let i = 0;
    while (t > keys[i + 1][0]) i++;
    const x = (t - keys[i][0]) / h[i], x2 = x * x, x3 = x2 * x;
    return (2 * x3 - 3 * x2 + 1) * keys[i][1] + (x3 - 2 * x2 + x) * h[i] * m[i] + (-2 * x3 + 3 * x2) * keys[i + 1][1] + (x3 - x2) * h[i] * m[i + 1];
  };
};

// ------------------------------------------------------------------ the room
export type RoomCam5 = {x: number; y: number; z: number; roll: number; whip: number};
/** the shot boundaries this camera serves (film seconds / loop clock) */
export const H3_T0 = 31.88; // the cut into the room (END hands over)
export const WHIP0 = 2.12; // the whip up starts
export const CUT_X = 2.25; // the cut to the exterior (between frames 67 and 68), on the whip
/** the stage camera keys on the loop clock: [tau, centre x, centre y, ln z]. H3 opens wider on her and the window,
 *  pushes in slowly, gathers pace as her hand goes to the control, peaks round the press, eases through "LASER", and
 *  creeps in toward her face through the surge */
const KX: K1[] = [[-1.65, 668], [-0.6, 652], [0.0, 640], [0.3, 638], [1.2, 628], [1.8, 622]];
const KY: K1[] = [[-1.65, 842], [-0.6, 880], [0.0, 930], [0.3, 958], [1.2, 970], [1.8, 966]];
const KZ: K1[] = [[-1.65, Math.log(1.24)], [-0.6, Math.log(1.4)], [0.0, Math.log(1.72)], [0.3, Math.log(1.98)], [1.2, Math.log(2.1)], [1.8, Math.log(2.2)]];
const fx = pchip(KX), fy = pchip(KY), fz = pchip(KZ);
/** a constant Dutch angle for the whole room set (deg, + clockwise): the window side is the high side */
export const ROOM_ROLL = -3.5;
/** the whip: a fast tilt up (stage px the camera centre rises), accelerating from WHIP0 into the cut (a rotation:
 *  the room and the view through the window move together) */
const WHIP_Y = (tau: number) => {
  const u = clamp((tau - WHIP0) / (CUT_X - WHIP0));
  return 760 * u * u * u;
};
/** after the crack the camera tracks her recoil (it follows her head sideways, so her face stays in frame and moves
 *  one way only), then holds */
const headX = (t: number) => 1080 - manJoints(op5(t).pose).head.x;
const HX0 = headX(T_REC);
export const roomCam5 = (t: number): RoomCam5 => {
  const tau = tau3(t);
  const k = Math.min(tau, 1.8);
  const whip = tau > WHIP0 ? WHIP_Y(tau) : 0;
  const track = tau > T_REC ? 0.85 * (headX(Math.min(tau, T_REC1 + 0.2)) - HX0) : 0;
  return {x: fx(k) + track, y: fy(k) - whip, z: Math.exp(fz(k) + (tau > 1.8 ? 0.05 * Math.min(tau - 1.8, 0.4) : 0)), roll: ROOM_ROLL, whip};
};
/** the room's screen transform (stage -> screen) */
export const roomTr = (c: RoomCam5) => `translate(540 960) rotate(${c.roll.toFixed(3)}) scale(${c.z.toFixed(5)}) translate(${(-c.x).toFixed(3)} ${(-c.y).toFixed(3)})`;
export const toScreenR = (c: RoomCam5, p: {x: number; y: number}) => {
  const a = (c.roll * Math.PI) / 180, dx = (p.x - c.x) * c.z, dy = (p.y - c.y) * c.z;
  return {x: 540 + dx * Math.cos(a) - dy * Math.sin(a), y: 960 + dx * Math.sin(a) + dy * Math.cos(a)};
};

// ------------------------------------------------------------------ the window view
/** where the room is: down the slope south-east of the tower (as V3's shelter), so the window frames the tower top,
 *  the beam rising past it and the storm deck over it */
export const WIN_POS = v3(92, -14, -126);
/** the rod tip's stage point and depth (a layer WIN_DEPTH times the subject plane's distance) */
export const WIN_TIP = {x: 800, y: 470};
export const WIN_DEPTH = 3;
const WIN_F = 760;
/** the window camera for a room camera (no roll: the window group is rolled with the room) */
export const winCam5 = (t: number, c: RoomCam5): Cam3 => {
  const zz = 1 + (c.z - 1) / WIN_DEPTH;
  // parallax from the dolly (depth WIN_DEPTH); the whip is a rotation, so the view moves with the room
  const sx = 540 + (WIN_TIP.x - c.x) * zz, sy = 960 + (WIN_TIP.y - (c.y + c.whip)) * zz + c.whip * c.z;
  const tau = tau3(t);
  // the storm's slow drift past the window (the camera creeps sideways a little)
  return camScreen(add3(WIN_POS, v3(0.35 * tau, 0, 0)), TIP3, WIN_F * zz, sx, sy);
};

// ------------------------------------------------------------------ outside (A3, A4)
export const HAND5 = 4.2;
/** a blendable camera key: position, a point on its view ray at a common distance, focal length, roll */
type Key = {pos: V3; tgt: V3; f: number; roll: number};
const D_KEY = len3(sub3(OPEN0.target, OPEN0.pos));
const keyOf = (c: Cam3): Key => {
  const {f} = basis({...c, roll: 0});
  return {pos: c.pos, tgt: add3(c.pos, mul3(f, D_KEY)), f: c.f, roll: c.roll ?? 0};
};
const camOf = (k: Key): Cam3 => ({...lookAt(k.pos, k.tgt, k.f), roll: k.roll});
/** a camera from yaw / pitch / roll / focal length at a position */
const ypr = (pos: V3, yaw: number, pitch: number, f: number, roll: number): Cam3 => ({pos, yaw, pitch, f, roll});
/** the rocket's start (the cut on the whip): low on the summit's flank beside the beam, looking up: the beam rising
 *  from the lower left to the rod tip at the centre, the storm deck over the top of the frame */
export const EXT0 = ypr(v3(-40, 0, -46), 38, 34, 470, -7);
/** the wide it rises into: below and in front of openCam, the deck spread over the frame, the tower's top third */
export const EXTW = ypr(v3(-59, 66, -84), 35, 41.5, 760, -4);
/** the rise: it leaves at the whip's speed and decelerates the whole way into the wide (an ease-out), arriving by
 *  ROCK1 on the wide's own slow drift */
export const ROCK1 = 3.05;
/** after the connection, one push in onto openCam (sm5, zero relative velocity at HAND5): into the channel, as B's
 *  push into the air beside it continues */
export const PUSH0 = 3.58;
const W_DRIFT = v3(0.5, 0.6, 0.3); // m/s: the wide drifts on up slowly (never dead still)
const rockW = (t: number) => {
  const u = clamp((t - CUT_X) / (ROCK1 - CUT_X));
  return 1 - Math.pow(1 - u, 3.8);
};
const lerpKey = (a: Key, b: Key, w: number): Key => ({
  pos: add3(mul3(a.pos, 1 - w), mul3(b.pos, w)),
  tgt: add3(mul3(a.tgt, 1 - w), mul3(b.tgt, w)),
  f: Math.exp(Math.log(a.f) + (Math.log(b.f) - Math.log(a.f)) * w),
  roll: a.roll + (b.roll - a.roll) * w,
});
const KA = keyOf(EXT0), KW0 = keyOf(EXTW);
const kW = (t: number): Key => {
  const d = mul3(W_DRIFT, t - ROCK1);
  return {...KW0, pos: add3(KW0.pos, d), tgt: add3(KW0.tgt, d)};
};
export const extCam5 = (t: number): Cam3 => {
  if (t >= HAND5) return openCam(t);
  const w = rockW(t);
  // the rise: position and view together (the lens lengthens a little later, so the deck stays wide on the way up)
  let k = lerpKey(KA, kW(t), w);
  k = {...k, f: Math.exp(Math.log(KA.f) + (Math.log(KW0.f) - Math.log(KA.f)) * ss(w, 0.25, 1))};
  if (t > PUSH0) {
    const p = ss(t, PUSH0, HAND5);
    const q = p * p * p * (p * (p * 6 - 15) + 10);
    k = lerpKey(k, keyOf(openCam(t)), q);
  }
  return camOf(k);
};
