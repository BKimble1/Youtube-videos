// V2 timeline: every camera, pose and state as a function of time, keyed to the measured narration
// (data/timeline.json). One 3D world (the fish's mouth with its tongue, gill arches and face), one camera:
//   0.0-2.0   the result first: the mouth snaps open on a living parasite; a fast, smooth push in
//   2.0-4.0   rewind: the tongue grows back, the parasite shrinks to a juvenile and backs out into the gills
//   4.0-6.5   forward: the juvenile crawls out between the gill arches, across the floor and onto the tongue
//   6.5-9.05  it bites: claws in the tongue, blood drawn from the surface vessels (the camera circles to the claws)
//   9.05-11.6 time-lapse: the tongue withers to a stub while the parasite grows over it
//   11.6-13.9 low along its side: the claws anchored in the stub and the floor
//   13.9-17.6 head-on inside the mouth as it works, then the camera backs out through the lips to the fish's face
//   17.6-20.9 the fish eats; 20.9-24 the parasite rears up, the camera pulls back to the opening frame
// Periodic motions use periods that divide the film's length, so the last frame flows into the first.
import {Cam3, norm3, sub3, V3} from './core/three';
import {floorAt, roofAt, tongueZ} from './anatomy';
import {IsoPose} from './isopod';
import {Food} from './food';
import {TongueState} from './front';
import {clamp, DUR, lerp, ss, word} from './lib';

const TAU = 2 * Math.PI;
// ---------------- narration anchors
export const W = {
  crawls: word('crawls').start,
  gills: word('gills').start,
  latches: word('latches').start,
  tongue2: word('tongue', 1).start,
  starts: word('starts').start,
  stealing: word('stealing').start,
  blood: word('blood').start,
  eventually: word('eventually').start,
  withers: word('withers').start,
  away: word('away').end,
  but: word('but').start,
  part: word('part').end,
  parasite2: word('parasite', 1).start,
  attached: word('attached').start,
  becoming: word('becoming').start,
  newW: word('new').start,
  tongue3: word('tongue', 3).end,
  and: word('and', 1).start,
  eating: word('eating').start,
  living: word('living').start,
  mouth: word('mouth').end,
};
// ---------------- phase boundaries
export const T = {
  open: 0.45, // the mouth has snapped open
  rw0: 2.0, // rewind starts
  rwGrow: 3.3, // rewind: tongue whole again, parasite a juvenile again
  rw1: 4.0, // rewind ends (juvenile back in the gill slit)
  latch: W.tongue2,
  lapse0: W.eventually,
  lapse1: W.away + 0.3,
  low0: 11.6,
  out0: 13.9, // over its back to a head-on view inside the lips
  exit: 15.9, // the camera backs out past the lips
  eat0: 17.6,
  rear0: 20.9,
  rear1: 22.4,
  close0: 22.6, // the mouth eases back to the opening frame's gape
};

// ---------------- a smooth path through timed keys (cubic Hermite, Catmull-Rom tangents; `stop` keys have none)
type Key = {t: number; v: number[]; stop?: boolean};
export const path = (keys: Key[], t: number): number[] => {
  if (t <= keys[0].t) return keys[0].v;
  const n = keys.length;
  if (t >= keys[n - 1].t) return keys[n - 1].v;
  let i = 0;
  while (keys[i + 1].t < t) i++;
  const a = keys[i], b = keys[i + 1];
  const h = b.t - a.t;
  const u = (t - a.t) / h;
  const tan = (k: number) => {
    const K = keys[k];
    if (K.stop || k === 0 || k === n - 1) return K.v.map(() => 0);
    const p = keys[k - 1], q = keys[k + 1];
    return K.v.map((_, j) => (q.v[j] - p.v[j]) / (q.t - p.t));
  };
  const ma = tan(i), mb = tan(i + 1);
  const u2 = u * u, u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  return a.v.map((_, j) => h00 * a.v[j] + h10 * h * ma[j] + h01 * b.v[j] + h11 * h * mb[j]);
};
const v3 = (a: number[]): V3 => [a[0], a[1], a[2]];
export const F_FRONT = 1500;

// ---------------- the camera
const OPEN_EYE: V3 = [-62, 0, 25];
const OPEN_TGT: V3 = [8, 0, 12];
const camKeys: {t: number; e: V3; c: V3; stop?: boolean}[] = [
  {t: 0, e: OPEN_EYE, c: OPEN_TGT},
  {t: T.open, e: [-54, 0, 24], c: [9, 0, 11]},
  {t: T.rw0, e: [-9, 1, 16.5], c: [16, 0, 2]},
  {t: T.rwGrow, e: [-7, 4, 21], c: [17, 0, 1.5]},
  {t: T.rw1, e: [-2, 5, 22], c: [30, -7, 6]},
  {t: 4.6, e: [10, 3, 18], c: [35, -10, 8]},
  {t: 5.4, e: [8, 3, 17], c: [27, -6, 2]},
  {t: T.latch, e: [0, 3, 15.5], c: [15, -0.5, 3]},
  {t: 7.0, e: [5, -6, 11], c: [14, 0, 3.5]},
  {t: 7.95, e: [17.5, -12, 9], c: [17.5, 0, 6]},
  {t: T.lapse0, e: [8, 2, 20.5], c: [16, 0, 1.5]},
  {t: 11.4, e: [5, 3, 21.5], c: [17, 0, 1]},
  {t: 12.4, e: [-2, 9, 17], c: [10, 0, 1]},
  {t: 13.35, e: [22, 9, 18], c: [14, 0, 1]},
  {t: T.out0, e: [4, 2, 19], c: [12, 0, 2]},
  {t: 14.45, e: [-1, 0, 10], c: [14, 0, 2.5]},
  {t: 15.4, e: [-2, 0.5, 10.5], c: [14, 0, 2.5]},
  {t: 16.5, e: [-30, -4, 18], c: [11, 0, 6]},
  {t: 17.1, e: [-42, -14, 24], c: [5, 0, 11]},
  {t: T.eat0, e: [-54, -22, 28], c: [5, 0, 11]},
  {t: 18.6, e: [-46, -10, 26], c: [6, 0, 10]},
  {t: 20.4, e: [-40, 0, 24], c: [10, 0, 8]},
  {t: T.rear0, e: [-34, 0, 23], c: [12, 0, 7]},
  {t: 21.9, e: [-15, 0, 18], c: [14, 0, 4], stop: true},
  {t: DUR, e: OPEN_EYE, c: OPEN_TGT, stop: true},
];
/** the fish's swimming sway seen as a gentle drift of the view, outside the mouth */
const sway = (t: number) => (ss(t, 15.8, 16.8) * (1 - ss(t, 21.0, 21.8))) * Math.sin((TAU * t) / 2);
export const frontCam = (t: number): Cam3 => {
  const v = path(camKeys.map((k) => ({t: k.t, v: [...k.e, ...k.c], stop: k.stop})), t);
  const e = v3(v.slice(0, 3)), c = v3(v.slice(3, 6));
  const sw = sway(t);
  return {eye: [e[0], e[1] + 4 * sw, e[2] + 1.2 * Math.sin((TAU * t) / 1.5) * Math.abs(sw)], target: [c[0], c[1] + 1.5 * sw, c[2]], f: F_FRONT, roll: 2.5 * sw};
};

// ---------------- the fish
export const gapeAt = (t: number) => {
  let g = 0.92 + 0.04 * Math.sin((TAU * t) / 1.5);
  // inside, looking out: the fish breathes deeper, the mouth pumps
  g += 0.1 * Math.sin((TAU * t) / 0.75) * ss(t, T.out0 - 0.3, T.out0 + 0.3) * (1 - ss(t, 15.6, 16.2)) - 0.06 * ss(t, T.out0 - 0.3, T.out0 + 0.3) * (1 - ss(t, 15.6, 16.2));
  // the meal: the jaws snap shut on the shrimp, two chewing pumps, a swallow, then open again
  const close = ss(t, W.eating + 0.02, W.eating + 0.22) * (1 - ss(t, 20.35, 20.85));
  const chew = 0.1 * Math.max(0, Math.sin((TAU * (t - 19.05)) / 0.5)) * (t > 19.05 && t < 20.05 ? 1 : 0);
  g = lerp(g, 0.2 + chew, close);
  // the opening frame's half-open mouth (frame 0 and the loop's last frame), snapping open at the start
  const shut = t < 1 ? 1 - ss(t, 0.02, T.open) : ss(t, T.close0, DUR);
  return lerp(g, 0.35, shut);
};
export const swallowAt = (t: number) => Math.sin(Math.PI * clamp((t - 19.9) / 0.55));
/** the rewind look (desaturated, cooler) */
export const rewindAt = (t: number) => ss(t, T.rw0, T.rw0 + 0.15) * (1 - ss(t, T.rw1 - 0.12, T.rw1 + 0.05));
/** days passing in the time-lapse: the light through the mouth dims and returns */
export const dayDimAt = (t: number) => (t > T.lapse0 && t < T.lapse1 ? 0.5 * Math.pow(Math.sin((Math.PI * (t - T.lapse0)) / ((T.lapse1 - T.lapse0) / 3)), 2) : 0);

// ---------------- the tongue
const growK = (t: number) => (t < T.rw1 ? 1 - ss(t, T.rw0, T.rwGrow) : ss(t, T.lapse0, T.lapse1));
export const tongueAt = (t: number, biteX: number | null): TongueState => {
  const w = growK(t); // 1 = withered stub, 0 = whole tongue
  const bead = t < T.rw1 ? 1 - ss(t, T.rw0 + 0.6, T.rw0 + 1.0) : ss(t, W.starts - 0.05, W.starts + 0.45) * (1 - 0.5 * w);
  return {shrink: lerp(1, 0.22, w), pale: ss(w, 0.1, 1), flow: lerp(1, 0.12, w), biteX, bead: t < 1 || t > T.low0 ? 0 : bead};
};

// ---------------- the parasite
export const JUV_L = 9;
const juvKeys: Key[] = [
  {t: T.rw1, v: [37.2, -10.6, 12.5]},
  {t: 4.75, v: [35.6, -10.4, 6.5]},
  {t: 5.25, v: [32, -8.5, 1.4]},
  {t: 5.85, v: [24, -3.5, 0.4]},
  {t: 6.25, v: [18.5, -1, 2.5]},
  {t: T.latch, v: [13.5, 0, 0], stop: true},
];
const juvPos = (tf: number): V3 => {
  const p = path(juvKeys, tf);
  // settle onto the floor and then the tongue's surface
  const surf = tongueZ(p[0] + 2, p[1], 1) + 0.2;
  if (tf > 5.0) p[2] = lerp(p[2], Math.max(surf, floorAt(p[0]) + 0.2), ss(tf, 5.0, 5.3) * (tf > 6.0 ? 1 : 0.6));
  if (tf >= 6.0) p[2] = surf;
  return v3(p);
};
/** the juvenile's crawl in forward time tf (T.rw1 .. latch): on the gill wall, then the floor, then the tongue */
const juvCrawl = (tf: number, t: number, reverse: boolean): IsoPose => {
  const p = juvPos(tf);
  const q = juvPos(Math.min(T.latch, tf + 0.03));
  let fwd = norm3(sub3(q, p));
  if (tf >= T.latch - 0.02 || !isFinite(fwd[0]) || Math.hypot(...sub3(q, p)) < 1e-4) fwd = [-1, 0, 0];
  const onWall = 1 - ss(tf, 4.7, 5.25);
  const up = norm3([0, onWall, 1 - onWall + 0.001]);
  const walking = tf < T.latch - 0.02;
  return {
    o: p, fwd, up, L: JUV_L, k: 0,
    walk: walking ? (reverse ? -1 : 1) * TAU * t * 3.4 : undefined, step: 0.06,
    grip: walking ? 0.25 : 1, segFlex: 0.6, segPh: TAU * t * 1.3,
  };
};
/** on the tongue (feeding and the time-lapse) or growing back down in the rewind: k is the growth (0 .. 1) */
const onTongue = (t: number, k: number): IsoPose => {
  const sh = tongueAt(t, null).shrink;
  const hx = lerp(13.5, 4, k);
  const L = lerp(JUV_L, 30, k);
  const z = lerp(tongueZ(hx + 2, 0, sh) + 0.2, floorAt(hx) + 0.25, k);
  const bite = 0.5 + 0.5 * Math.sin((TAU * t) / 0.75);
  const feeding = t > W.starts - 0.1 && t < T.lapse1 ? 1 : 0;
  return {
    o: [hx, 0, z], fwd: [-1, 0, 0], up: [0, 0, 1], L, k, grip: 1,
    lift: 0.025 * bite * feeding * (1 - k),
    gut: t < T.rw1 ? 1 - ss(t, T.rw0 + 0.6, T.rw0 + 1.1) : ss(t, W.starts, W.blood + 0.3),
    wave: 0.01, wavePh: (TAU * t) / 1.5, segFlex: 0.7, segPh: (TAU * t) / 0.75, arch: 0.01 * k,
    // in the time-lapse the legs let go and re-grip in turn as the body widens (new attachment points, not a jump)
    walk: t > T.lapse0 && t < T.lapse1 ? TAU * t * 1.5 : undefined, step: 0.02,
  };
};
/** the adult in its place on the stub */
const adult = (t: number): IsoPose => {
  const lw = TAU * t;
  // a living, restless parasite: the head lifts and the legs re-grip in a wave (strong in the first two seconds)
  const restless = t < 3 ? 1 : 0.5;
  const rear = Math.sin(Math.PI * clamp((t - T.rear0) / (T.rear1 - T.rear0)));
  const push = Math.sin(Math.PI * clamp((t - 18.9) / 1.2));
  const press = Math.sin(Math.PI * clamp((t - T.out0) / 1.5)) + Math.sin(Math.PI * clamp((t - 15.0) / 1.2)); // working as a tongue
  return {
    o: [4, 0, floorAt(4) + 0.25], fwd: [-1, 0, 0], up: [0, 0, 1], L: 30, k: 1, grip: 1,
    wave: 0.018 * restless + 0.012 * press + 0.02 * rear,
    wavePh: lw / 0.75,
    lift: 0.045 * restless * (0.5 + 0.5 * Math.sin(lw / 1.5)) + 0.05 * press + 0.09 * push + 0.2 * rear,
    arch: 0.02 * press + 0.05 * push + 0.05 * rear,
    tailLift: 0.02 * Math.sin(lw / 0.75 + 1),
    segFlex: 1, segPh: lw / 0.75,
    walk: lw * 1.5, step: 0.012 + 0.012 * restless + 0.02 * rear,
  };
};
export const parasiteAt = (t: number): IsoPose => {
  if (t < T.rw0 || t >= T.low0) return adult(t);
  if (t < T.rwGrow) return onTongue(t, 1 - ss(t, T.rw0, T.rwGrow));
  if (t < T.rw1) return juvCrawl(lerp(T.latch, T.rw1, ss(t, T.rwGrow, T.rw1)), t, true);
  if (t < T.latch) return juvCrawl(t, t, false);
  if (t < T.lapse0) return onTongue(t, 0);
  if (t < T.low0) return onTongue(t, ss(t, T.lapse0, T.lapse1));
  return adult(t);
};
/** where it bites (the head's front, while it is on the tongue) */
export const biteXAt = (t: number) => (t >= T.rw0 && t < T.rwGrow) || (t >= T.latch && t < T.low0) ? parasiteAt(t).o[0] + 0.4 : null;

// ---------------- the meal
export const foodAt = (t: number): (Food & {outside: boolean}) | null => {
  if (t < T.eat0 || t > 20.2) return null;
  const keys: Key[] = [
    {t: T.eat0, v: [-40, -16, 32]},
    {t: 18.3, v: [-16, -5, 21]},
    {t: W.eating + 0.05, v: [4, 0.5, 11]},
    {t: 19.2, v: [12, 0, 8.6]},
    {t: 19.7, v: [30, 0, 8]},
    {t: 20.15, v: [46, 0, 7], stop: true},
  ];
  const p = v3(path(keys, t));
  const q = v3(path(keys, t + 0.04));
  const d = sub3(q, p);
  const dir: V3 = Math.hypot(...d) > 1e-4 ? norm3(d) : [1, 0, 0];
  const grabbed = ss(t, W.eating, W.eating + 0.3);
  return {p, dir, L: 12, curl: lerp(0.25, 0.9, grabbed), kick: TAU * t * (3 - 2 * grabbed), op: 1 - ss(t, 19.9, 20.15), dark: ss(t, 19.45, 20.0) * 0.85, outside: p[0] < -2.5};
};

// ---------------- sound cues (exported for the mix)
export const CUES = {
  open: 0.02,
  push: 0.5,
  rewind: T.rw0,
  regrow: 2.3,
  backOut: T.rwGrow,
  rwEnd: T.rw1,
  emerge: 4.1,
  wallDown: 4.75,
  floor: 5.25,
  climb: 6.1,
  latch: T.latch,
  bite: W.starts,
  lapse: T.lapse0,
  lapseEnd: T.lapse1,
  low: 12.0,
  out0: T.out0,
  exit: T.exit,
  foodIn: T.eat0,
  snap: W.eating + 0.05,
  chew1: 19.1,
  chew2: 19.6,
  swallow: 19.95,
  reopen: 20.4,
  rear: T.rear0,
  close: T.close0,
  roof: roofAt(0.9),
};
