// The film's timeline: every camera, pose and state as a function of time, keyed to the measured narration
// (data/timeline.json). Three spans: the front set (hook, pull back, dive through the gills), the side set (the
// juvenile's entry, the feeding close-up, the time-lapse, the push to its head) and the front set again (the new
// tongue, the meal, the push back into the opening frame). Periodic motions use periods that divide the film's
// length, so the last frame flows into the first.
import {Cam3, norm3, sub3, V3} from './core/three';
import {floorAt, roofAt} from './anatomy';
import {IsoPose} from './isopod';
import {Food} from './food';
import {tongueSurfaceZ} from './side';
import {clamp, DUR, lerp, ss, ss5, word} from './lib';

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
// ---------------- spans
export const X1 = [2.33, 2.47] as const; // front -> side (through the gills)
export const X2 = [13.3, 13.62] as const; // side -> front (on the parasite's head)

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

// ---------------- the opening composition (frame 0 and the loop's last frame)
const HOOK_EYE: V3 = [-9.5, 0, 18.5];
const HOOK_TGT: V3 = [17, 0, 1.5];
export const F_FRONT = 1500;
export const F_SIDE = 2400;

// ---------------- cameras
const frontAKeys: {t: number; e: V3; c: V3; stop?: boolean}[] = [
  {t: 0, e: HOOK_EYE, c: HOOK_TGT},
  {t: 0.35, e: [-8.5, 0, 17.8], c: [17, 0, 1.5]},
  {t: 0.85, e: [-5, 0, 14.5], c: [14, 0, 1.2], stop: true},
  {t: 1.42, e: [-82, 0, 26], c: [8, 0, 15], stop: true},
  {t: 1.95, e: [-8, 0, 17.5], c: [30, -3, 8]},
  {t: 2.22, e: [29, -4, 12.6], c: [37, -30, 11]},
  {t: 2.5, e: [37, -11.6, 11.5], c: [37, -40, 11]},
];
const frontBKeys: {t: number; e: V3; c: V3; stop?: boolean}[] = [
  {t: X2[0], e: [-6, 0, 8.5], c: [12, 0, 2.5]},
  {t: X2[1], e: [-7.5, 0, 9.5], c: [12, 0, 2.5]},
  {t: 15.3, e: [-37, 0, 21.5], c: [12, 0, 6], stop: true},
  {t: 17.2, e: [-32, 0, 20.5], c: [12, 0, 6]},
  {t: 18.4, e: [-46, 3, 27], c: [5, 0, 10.5]},
  {t: 20.5, e: [-35, 0, 22], c: [12, 0, 6]},
  {t: 21.5, e: [-28, 0, 21], c: [14, 0, 4]},
  {t: DUR, e: HOOK_EYE, c: HOOK_TGT, stop: true},
];
const camFrom = (keys: typeof frontAKeys, t: number): Cam3 => {
  const K = keys.map((k) => ({t: k.t, v: [...k.e, ...k.c], stop: k.stop}));
  const v = path(K, t);
  return {eye: v3(v.slice(0, 3)), target: v3(v.slice(3, 6)), f: F_FRONT};
};
export const frontCam = (t: number): Cam3 => (t < 7 ? camFrom(frontAKeys, t) : camFrom(frontBKeys, t));

const sideKeys: Key[] = [
  {t: X1[0], v: [53, 5, 26]},
  {t: 2.75, v: [56, 6, 85]},
  {t: 3.35, v: [62, 8, 205]},
  {t: 3.95, v: [84, 7, 135]},
  {t: 4.5, v: [75, 5, 118]},
  {t: 5.3, v: [55, 5, 118]},
  {t: 6.2, v: [22, 4.5, 64]},
  {t: 6.75, v: [17.2, 4.4, 17], stop: true},
  {t: 8.75, v: [16.8, 4.6, 13.5], stop: true},
  {t: 9.5, v: [17, 4.5, 58]},
  {t: 11.5, v: [16.5, 4, 54], stop: true},
  {t: 13.3, v: [6, 2.6, 13]},
  {t: X2[1], v: [5.6, 2.6, 12], stop: true},
];
export const sideCam = (t: number): Cam3 => {
  // distance is interpolated in log space (a push reads at an even rate)
  const v = path(sideKeys.map((k) => ({...k, v: [k.v[0], k.v[1], Math.log(k.v[2])]})), t);
  const D = Math.exp(v[2]);
  return {eye: [v[0], -17 - D, v[1]], target: [v[0], 0, v[1]], f: F_SIDE};
};

// ---------------- the fish
export const gapeAt = (t: number) => {
  let g = 0.9 + 0.04 * Math.sin((TAU * t) / 1.5);
  // the new tongue: the fish gapes wider twice
  g += 0.08 * Math.sin(Math.PI * clamp((t - 14.1) / 1.4)) + 0.08 * Math.sin(Math.PI * clamp((t - 15.9) / 1.4));
  // the meal: the jaws snap shut on the shrimp, two chewing pumps, a swallow, then open again
  const close = ss(t, W.eating + 0.02, W.eating + 0.22) * (1 - ss(t, 20.35, 20.85));
  const chew = 0.1 * Math.max(0, Math.sin((TAU * (t - 19.05)) / 0.5)) * (t > 19.05 && t < 20.05 ? 1 : 0);
  return lerp(g, 0.2 + chew, close);
};
export const swallowAt = (t: number) => Math.sin(Math.PI * clamp((t - 19.9) / 0.55));
export const flareAt = (t: number) => {
  const base = 0.16 + 0.08 * Math.sin((TAU * t) / 1.5);
  const start = 0;
  const entry = 0.22 * Math.sin(Math.PI * clamp((t - 4.25) / 0.75)); // opens as the juvenile slips under
  return clamp(Math.max(base + entry, start));
};
// open where the camera comes out of the gills, closing as it pulls out; open again as the juvenile goes in
export const cutAt = (t: number) => (t < 4 ? 1 - ss(t, 2.55, 3.15) : ss(t, 4.55, 5.3));
export const shrinkAt = (t: number) => lerp(1, 0.22, ss(t, W.eventually, W.away + 0.25));
export const flowAt = (t: number) => lerp(1, 0.12, ss(t, W.eventually, W.away + 0.25));
export const drawAt = (t: number) => ss(t, W.starts - 0.05, W.starts + 0.35) * (1 - 0.7 * ss(t, 9.6, W.away + 0.25));
export const paleAt = (t: number) => ss(t, W.eventually + 0.2, W.away + 0.25);
export const growAt = (t: number) => ss(t, W.eventually, W.away + 0.35);

// ---------------- the parasite
export const JUV_L = 9;
const juvKeys: Key[] = [
  {t: 2.85, v: [138, -40, 13]},
  {t: 3.6, v: [104, -34, 10]},
  {t: 4.2, v: [85, -26, 6]},
  {t: 4.5, v: [77, -20, 4]},
  {t: 4.85, v: [70.5, -14.5, 5]},
  {t: 5.25, v: [61, -11.5, 7]},
  {t: 5.62, v: [50, -11, 8]},
  {t: 5.95, v: [39, -7.5, 6]},
  {t: 6.25, v: [27, -2.5, 4.6]},
  {t: W.tongue2, v: [13.5, 0, 0], stop: true},
];
const juvPos = (t: number): V3 => {
  const p = path(juvKeys, t);
  if (t > 6.0) {
    // settle onto the tongue's surface
    const z = tongueSurfaceZ(p[0] + 2, 1) + 0.25;
    p[2] = lerp(p[2], z, ss(t, 6.0, W.tongue2));
  }
  return v3(p);
};
/** the juvenile while it swims and crawls (2.85 .. tongue2): outside the fish or under the skin */
export const juvenile = (t: number): {pose: IsoPose; outside: boolean} | null => {
  if (t < 2.85 || t > 9.5) return null;
  const tt = Math.min(t, W.tongue2);
  const p = juvPos(tt);
  const q = juvPos(tt + 0.03);
  let fwd = norm3(sub3(q, p));
  if (t >= W.tongue2 - 0.05 || !isFinite(fwd[0]) || Math.hypot(...sub3(q, p)) < 1e-4) fwd = [-1, 0, 0];
  // dorsal side to the camera while it crawls over the gill arches, upright when it swims and on the tongue
  const crawl = ss(t, 4.45, 4.85) * (1 - ss(t, 5.9, 6.35));
  const up = norm3([0, -crawl, 1 - crawl + 0.001]);
  const swim = 1 - ss(t, 4.35, 4.7);
  const walking = t > 4.6 && t < W.tongue2;
  const grip = ss(t, W.tongue2 - 0.1, W.tongue2 + 0.12);
  const bite = 0.5 + 0.5 * Math.sin((TAU * t) / 0.75);
  return {
    pose: {
      o: p,
      fwd,
      up,
      L: JUV_L,
      k: 0,
      swim,
      walk: walking ? TAU * t * 3.2 : undefined,
      step: 0.06,
      grip: Math.max(grip, walking ? 0.2 : 0),
      wave: swim * 0.03,
      wavePh: TAU * t * 2.5,
      tailLift: swim * 0.04 * Math.sin(TAU * t * 2.5),
      lift: grip * 0.02 * bite * ss(t, W.starts - 0.1, W.starts + 0.3),
      gut: ss(t, W.starts, W.blood + 0.3),
      segFlex: 0.6,
      segPh: TAU * t * 1.3,
    },
    outside: t < 4.62,
  };
};
/** the parasite on the tongue through the feeding and the time-lapse (side set), then the adult (front set) */
export const parasiteOnTongue = (t: number): IsoPose => {
  const k = growAt(t);
  const sh = shrinkAt(t);
  const hx = lerp(13.5, 4, k);
  const z = lerp(tongueSurfaceZ(hx + 2, sh) + 0.25, 0.25, k);
  const pulse = 0.5 + 0.5 * Math.sin((TAU * t) / 0.75);
  return {
    o: [hx, 0, z],
    fwd: [-1, 0, 0],
    up: [0, 0, 1],
    L: lerp(JUV_L, 30, k),
    k,
    grip: 1,
    lift: 0.02 * pulse * (1 - k),
    gut: ss(t, W.starts, W.blood + 0.3),
    wave: 0.008,
    wavePh: TAU * t / 1.5,
    segFlex: 0.6,
    segPh: (TAU * t) / 0.75,
    arch: 0.01 * k,
  };
};
/** the adult in the front set (hook, reveal, meal, loop) */
export const adult = (t: number): IsoPose => {
  // the tongue disguise: on at frame 0 (and again at the loop's end), dropped as the camera pushes in
  const disguise = t < 7 ? 1 - ss(t, 0.35, 0.8) : ss(t, 22.6, DUR);
  const tuck = t < 7 ? 1 - ss(t, 0.42, 0.82) : ss(t, 22.8, DUR);
  const grip = t < 7 ? lerp(0.3, 1, ss(t, 0.5, 0.85)) : lerp(1, 0.3, ss(t, 22.8, DUR));
  const wr = 0.6 + 0.4 * disguise; // the wriggle is strongest while it passes for a tongue
  const lw = TAU * t;
  // the new tongue: segments ripple and the head lifts as the fish gapes; it pushes the food back
  const show = t > 7 ? Math.sin(Math.PI * clamp((t - 14.1) / 1.6)) + Math.sin(Math.PI * clamp((t - 15.8) / 1.6)) : 0;
  const push = t > 7 ? Math.sin(Math.PI * clamp((t - 18.9) / 1.2)) : 0;
  const regrip = t > 7 && t > 20.4 && t < 21.6;
  return {
    o: [4, 0, floorAt(4) + 0.25],
    fwd: [-1, 0, 0],
    up: [0, 0, 1],
    L: 30,
    k: 1,
    tongue: disguise,
    tuck,
    grip,
    wave: 0.022 * wr + 0.02 * show,
    wavePh: lw / 0.75,
    lift: (0.045 * wr) * (0.5 + 0.5 * Math.sin(lw / 1.5)) + 0.05 * show + 0.09 * push,
    arch: 0.02 * show + 0.05 * push,
    tailLift: 0.02 * Math.sin(lw / 0.75 + 1),
    segFlex: 1,
    segPh: lw / 0.75,
    walk: regrip ? lw * 2 : undefined,
    step: 0.025,
  };
};

// ---------------- the meal
export const foodAt = (t: number): (Food & {outside: boolean}) | null => {
  if (t < 17.3 || t > 20.2) return null;
  const keys: Key[] = [
    {t: 17.3, v: [-40, 9, 34]},
    {t: 18.2, v: [-15, 4, 22]},
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
  return {
    p,
    dir,
    L: 12,
    curl: lerp(0.25, 0.9, grabbed),
    kick: TAU * t * (3 - 2 * grabbed),
    op: 1 - ss(t, 19.9, 20.15),
    dark: ss(t, 19.45, 20.0) * 0.85,
    outside: p[0] < -2.5,
  };
};

// ---------------- sound cues (exported for the mix)
export const CUES = {
  hookWet: 0.0,
  reveal: 0.42,
  legsGrip: 0.62,
  pullBack: 0.9,
  dive: 1.5,
  gills: 2.2,
  out: X1[0],
  juvSwim: 2.9,
  underCover: 4.5,
  cut: 4.6,
  arches: 5.0,
  latch: W.tongue2,
  bite: W.starts,
  feed: W.stealing,
  lapse: W.eventually,
  lapseEnd: W.away + 0.35,
  pushHead: 11.6,
  toFront: X2[0],
  gape1: 14.1,
  gape2: 15.9,
  foodIn: 17.3,
  snap: W.eating + 0.05,
  chew1: 19.1,
  chew2: 19.6,
  swallow: 19.95,
  reopen: 20.4,
  loopPush: 21.5,
  roof: roofAt(0.9),
};
