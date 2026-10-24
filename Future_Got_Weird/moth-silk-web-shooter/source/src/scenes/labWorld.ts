// The real tabletop experiment, in metres at true scale (bench top y = 0, floor y = -0.92; the camera looks toward
// -Z, so +X is screen right). Everything the lab shots show is a pure function of film time t:
//  - her performance (she stands behind the bench, facing the camera), with world-space hand targets;
//  - the handheld coaxial nozzle ("wand"), fed by two tubes from a syringe pump;
//  - the fiber: forming and crossing the ~12 cm gap, sticking to the exposed end of a scalpel blade half buried in sand;
//  - the blade: a small rigid body (two points, Verlet + constraints) pulled out of the sand by the fiber, carried
//    to the collection tray, steadied, then lowered into it. Gravity, sand drag and the inextensible fiber decide its
//    motion, so tension always comes before movement and nothing teleports.
import {BODY_P} from '../rig/cast';
import {joints4, Pose4} from '../rig/Crew';
import {add3, cardToWorld, len3, mul3, norm3, sub3, V3, v3, worldToCard} from '../rig/geo';
import {FACES, mix, stand} from '../rig/poses';
import {clamp, keyS, lerp, ss, ss5} from '../lib';

// ------------------------------------------------------------------ layout
export const DISH = {x: 0.135, z: 0, r: 0.045, wall: 0.021, sand: 0.018};
export const TRAY = {x0: 0.192, x1: 0.31, z0: -0.04, z1: 0.04, h: 0.016, floor: 0.003};
export const PUMP = {x0: -0.56, x1: -0.33, z0: -0.25, z1: -0.08, h: 0.075};
export const SYR = [
  {name: 'silk', z: -0.2, col: '#F2D48A'},
  {name: 'acetone', z: -0.13, col: '#9EE6DD'},
];
export const SYR_Y = PUMP.h + 0.016, SYR_R = 0.011, SYR_X0 = -0.52, SYR_X1 = -0.36;
export const COCOON_DISH = {x: -0.25, z: 0.0, r: 0.038};
export const COCOON_SPOT = v3(0.035, 0.011, 0.05); // where she sets the cocoon down, beside the nozzle
export const STAND = {x: -0.11, z: 0.03}; // the wand rest
// the mounted test fiber: a paper frame on a clamp at the front right of the bench, turned to face front-left
export const FRAME = {c: v3(0.43, 0.075, 0.13), hw: 0.02, hh: 0.015, m: 0.012, yaw: 40};
export const frameP = (u: number, w: number, n = 0) => {
  const a = (FRAME.yaw * Math.PI) / 180;
  const r = v3(Math.cos(a), 0, Math.sin(a)), nn = v3(-Math.sin(a), 0, Math.cos(a));
  return add3(add3(add3(FRAME.c, mul3(r, u)), v3(0, w, 0)), mul3(nn, n));
};
export const HER_G = v3(-0.1, -0.92, -0.5);
export const HER_H = 0;

// ------------------------------------------------------------------ times (film seconds)
export const LT = {
  start: 5.3,
  frameOff: [5.45, 6.05], // her left hand leaves the mounted fiber
  reach: [6.25, 6.85], grasp: [6.85, 7.02], lift: [7.02, 7.35], carry: [7.35, 8.05], set: [8.05, 8.22], release: [8.22, 8.4],
  macro: 8.75,
  back: 16.55, // back in the lab: the fiber is leaving the nozzle
  contact: 18.95,
  pull0: 20.62, carry0: 22.55, carry1: 23.6, steady0: 24.0, steady1: 24.6, lower0: 27.95, lower1: 28.8, rest0: 28.85, rest1: 29.95, end: 31.75,
};

// ------------------------------------------------------------------ the blade (a #10-style scalpel blade, 42 mm)
export const LB = 0.042;
/** outline in blade-local (u from the tang end toward the tip, v across; metres) */
export const BLADE_OUT: [number, number][] = [
  [0, 0.0029], [0.012, 0.0032], [0.027, 0.0036], [0.035, 0.0028], [0.0405, 0.0008], [0.042, -0.0004], [0.039, -0.0024],
  [0.032, -0.0044], [0.023, -0.0053], [0.014, -0.0047], [0.008, -0.0033], [0.003, -0.0029], [0, -0.0029],
];
export const BLADE_SLOT: [number, number][] = [[0.0035, 0.0008], [0.0125, 0.0008], [0.0125, -0.0008], [0.0035, -0.0008]];
const A0 = {x: DISH.x - 0.013, y: DISH.sand + 0.008}; // the exposed tang end, where the fiber sticks
const TH0 = (-35 * Math.PI) / 180; // two thirds buried, tip down at 35 degrees
export const BLADE0 = {a: A0, b: {x: A0.x + LB * Math.cos(TH0), y: A0.y + LB * Math.sin(TH0)}};

// ------------------------------------------------------------------ the wand: nozzle tip N and axis direction (rear -> tip), in the XY plane at z = 0
export const WAND = {len: 0.13, needle: 0.022, r: 0.0075, grip: 0.112};
const N_REST = {x: -0.03, y: 0.028}; // lying on its rest during the opening lab shots (z = STAND.z)
export const N_FIRE = {x: A0.x - 0.118, y: A0.y + 0.016};
export const N_END = {x: DISH.x - DISH.r - 0.022, y: DISH.wall + 0.016}; // set back down, aimed across the dish at the tray
const nKeys: [number, number, number][] = [
  // t, x, y
  [LT.back, N_FIRE.x, N_FIRE.y],
  [LT.pull0, N_FIRE.x, N_FIRE.y],
  [21.2, N_FIRE.x - 0.012, N_FIRE.y + 0.035],
  [21.75, N_FIRE.x + 0.03, N_FIRE.y + 0.085],
  [22.15, N_FIRE.x + 0.083, N_FIRE.y + 0.13],
  [LT.carry0, N_FIRE.x + 0.1, N_FIRE.y + 0.17],
  [LT.carry1, (TRAY.x0 + TRAY.x1) / 2 + 0.004, N_FIRE.y + 0.18],
  [LT.lower0, (TRAY.x0 + TRAY.x1) / 2 + 0.004, N_FIRE.y + 0.18],
  [LT.lower1, TRAY.x0 + 0.016, N_FIRE.y + 0.085],
  [LT.rest0, TRAY.x0 + 0.012, N_FIRE.y + 0.08],
  [LT.rest1, N_END.x, N_END.y],
];
const nAt = (t: number) => {
  for (let i = 1; i < nKeys.length; i++) {
    if (t <= nKeys[i][0]) {
      const [t0, x0, y0] = nKeys[i - 1], [t1, x1, y1] = nKeys[i];
      const u = ss5(t, t0, t1);
      return {x: lerp(x0, x1, u), y: lerp(y0, y1, u)};
    }
  }
  const l = nKeys[nKeys.length - 1];
  return {x: l[1], y: l[2]};
};
/** wand axis angle (rad, in XY): aimed at the blade when firing, tipping down to carry the hanging blade */
const axisAng = (t: number) => {
  const fire = Math.atan2(A0.y + 0.002 - N_FIRE.y, A0.x - N_FIRE.x);
  return keyS(t, [[LT.pull0, fire], [21.4, -0.45], [22.4, -0.95], [LT.carry1, -1.0], [LT.lower0, -1.0], [LT.lower1, -0.8], [LT.rest0, -0.75], [LT.rest1, -0.12]]);
};
export const wandAt = (t: number) => {
  if (t < LT.back) {
    const N = v3(N_REST.x, N_REST.y, STAND.z);
    return {N, a: v3(1, 0, 0), held: false};
  }
  const n = nAt(t), ang = axisAng(t);
  return {N: v3(n.x, n.y, 0), a: v3(Math.cos(ang), Math.sin(ang), 0), held: true};
};

// ------------------------------------------------------------------ the fiber before it lands
export const FLIGHT = {t0: LT.back - 0.25, t1: LT.contact};
/** head of the forming fiber: 0 at the nozzle, 1 at the blade (decelerating as it arrives) */
export const flightS = (t: number) => {
  const x = clamp((t - FLIGHT.t0) / (FLIGHT.t1 - FLIGHT.t0));
  return 1 - (1 - x) ** 1.6;
};
export const L0 = Math.hypot(A0.x - N_FIRE.x, A0.y - N_FIRE.y) * 1.1; // rest length: it lands with some slack

// ------------------------------------------------------------------ blade simulation
type P = {x: number; y: number};
type St = {a: P; b: P; pa: P; pb: P; stuck: boolean};
const DT = 1 / 480;
const floorAt = (x: number) => {
  if (x > DISH.x - DISH.r + 0.002 && x < DISH.x + DISH.r - 0.002) return 0.0012; // dish floor (under the sand)
  if (x > TRAY.x0 + 0.002 && x < TRAY.x1 - 0.002) return TRAY.floor;
  return 0;
};
const inSand = (p: P) => p.x > DISH.x - DISH.r && p.x < DISH.x + DISH.r && p.y < DISH.sand;
let cache: {i: number; s: St} | null = null;
const step = (s: St, t: number): St => {
  const g = 9.8;
  const N = nAt(t);
  const nx = {a: {...s.a}, b: {...s.b}};
  if (!s.stuck) {
    for (const k of ['a', 'b'] as const) {
      const cur = s[k], prev = k === 'a' ? s.pa : s.pb;
      let vx = cur.x - prev.x, vy = cur.y - prev.y;
      const drag = inSand(cur) ? 0.82 : 0.992; // sand holds; the air (and her steady hand) damp the swing
      vx *= drag; vy *= drag;
      nx[k] = {x: cur.x + vx, y: cur.y + vy - g * DT * DT};
    }
  }
  let stuck = s.stuck;
  // the fiber: inextensible; while the blade is held by the sand it waits for tension
  const d = Math.hypot(nx.a.x - N.x, nx.a.y - N.y);
  if (stuck && d > L0 * 1.0005) stuck = false;
  for (let it = 0; it < 10; it++) {
    if (!stuck) {
      const da = Math.hypot(nx.a.x - N.x, nx.a.y - N.y);
      if (da > L0) {
        const k = L0 / da;
        nx.a = {x: N.x + (nx.a.x - N.x) * k, y: N.y + (nx.a.y - N.y) * k};
      }
      // the rod
      const dx = nx.b.x - nx.a.x, dy = nx.b.y - nx.a.y, l = Math.hypot(dx, dy) || 1e-9;
      const e = (l - LB) / l / 2;
      // the tang end is tied to the fiber: let it give less while taut
      const wa = Math.hypot(nx.a.x - N.x, nx.a.y - N.y) >= L0 * 0.999 ? 0.25 : 0.5;
      nx.a = {x: nx.a.x + dx * e * 2 * wa, y: nx.a.y + dy * e * 2 * wa};
      nx.b = {x: nx.b.x - dx * e * 2 * (1 - wa), y: nx.b.y - dy * e * 2 * (1 - wa)};
      for (const k of ['a', 'b'] as const) {
        const f = floorAt(nx[k].x);
        if (nx[k].y < f) nx[k] = {x: nx[k].x, y: f};
        // sand lets things out, never further in: a point under the surface cannot sink below where it was
        const cur = s[k];
        if (inSand(nx[k]) && nx[k].y < Math.min(cur.y, DISH.sand)) nx[k] = {x: nx[k].x, y: Math.min(cur.y, DISH.sand)};
        // the glass rim
        for (const rx of [DISH.x - DISH.r, DISH.x + DISH.r]) if (Math.abs(nx[k].x - rx) < 0.003 && nx[k].y < DISH.wall) nx[k] = {x: nx[k].x, y: DISH.wall};
      }
    }
  }
  if (stuck) return {...s, stuck};
  return {a: nx.a, b: nx.b, pa: s.a, pb: s.b, stuck};
};
// Extraction is exact kinematics with the fiber taut: first the tang end rises, pivoting about the buried tip
// (the tang stays on the circle |N - a| = L0); then the tip slides out of the sand along the blade's own axis while
// the tang keeps to that circle. Once the tip clears the surface, the free simulation takes over from that state.
const circleX = (c1: P, r1: number, c2: P, r2: number): P => {
  // the upper intersection of two circles (the tang end sits above the tip)
  const dx = c2.x - c1.x, dy = c2.y - c1.y, d = Math.hypot(dx, dy) || 1e-9;
  const aa = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - aa * aa));
  const mx = c1.x + (dx * aa) / d, my = c1.y + (dy * aa) / d;
  const p1 = {x: mx + (h * -dy) / d, y: my + (h * dx) / d}, p2 = {x: mx - (h * -dy) / d, y: my - (h * dx) / d};
  return p1.y > p2.y ? p1 : p2;
};
export const T_TAUT = (() => {
  for (let t = LT.pull0; t < LT.pull0 + 1; t += 0.001) if (Math.hypot(nAt(t).x - A0.x, nAt(t).y - A0.y) >= L0) return t;
  return LT.pull0 + 0.3;
})();
export const SLIDE = {t0: 21.25, t1: 22.15, dist: 0.033};
const AX = {x: Math.cos(TH0 + Math.PI), y: Math.sin(TH0 + Math.PI)}; // tip -> tang
const kinBlade = (t: number): {a: P; b: P} => {
  const N = nAt(t);
  const s = SLIDE.dist * ss(t, SLIDE.t0, SLIDE.t1);
  const bp = {x: BLADE0.b.x + AX.x * s, y: BLADE0.b.y + AX.y * s};
  return {a: circleX(N, L0, bp, LB), b: bp};
};
/** the blade at time t: tang end a (where the fiber is stuck), tip b */
export const bladeAt = (t: number): {a: P; b: P} => {
  if (t <= T_TAUT) return BLADE0;
  if (t <= SLIDE.t1) return kinBlade(t);
  const n = Math.floor((t - SLIDE.t1) / DT);
  const k0 = kinBlade(SLIDE.t1), k1 = kinBlade(SLIDE.t1 - DT);
  let i = 0, st: St = {a: k0.a, b: k0.b, pa: k1.a, pb: k1.b, stuck: false};
  if (cache && cache.i <= n) {
    i = cache.i;
    st = cache.s;
  }
  for (; i < n; i++) st = step(st, SLIDE.t1 + (i + 1) * DT);
  cache = {i, s: st};
  return {a: st.a, b: st.b};
};

/** the fiber at time t: polyline from the nozzle tip to its far end (the flying head, or the blade's tang end) */
export const fiberAt = (t: number) => {
  const w = wandAt(t);
  const N = w.N;
  if (t < FLIGHT.t0) return null;
  if (t < LT.contact) {
    const s = flightS(t);
    const H = v3(lerp(N.x, A0.x, s), lerp(N.y, A0.y, s), 0);
    const pts: V3[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      pts.push(v3(lerp(N.x, H.x, u), lerp(N.y, H.y, u) + 0.006 * s * Math.sin(Math.PI * u) - 0.004 * s * s * u * u, 0));
    }
    return {pts, head: H, landed: false, sag: 0};
  }
  const bl = bladeAt(t);
  const A = v3(bl.a.x, bl.a.y, 0);
  // where the straight chord would pass through the dish's far rim or the tray's near wall, the fiber rests on them
  const route: V3[] = [N];
  for (const [sx, sy] of [[DISH.x + DISH.r, DISH.wall + 0.0008], [TRAY.x0, TRAY.h + 0.0008]]) {
    const P0 = route[route.length - 1];
    if ((sx - P0.x) * (A.x - sx) <= 0) continue;
    const yLine = P0.y + ((A.y - P0.y) * (sx - P0.x)) / (A.x - P0.x);
    if (yLine < sy) route.push(v3(sx, sy, 0));
  }
  route.push(A);
  let total = 0;
  for (let i = 1; i < route.length; i++) total += len3(sub3(route[i], route[i - 1]));
  const D = len3(sub3(route[1], N));
  const slack = Math.max(0, L0 - total);
  const sag = Math.sqrt((3 * Math.max(D, 1e-4) * slack) / 8);
  const pts: V3[] = [];
  for (let i = 0; i <= 28; i++) {
    const u = i / 28;
    pts.push(add3(add3(N, mul3(sub3(route[1], N), u)), v3(0, -4 * sag * u * (1 - u), 0)));
  }
  for (let i = 2; i < route.length; i++) pts.push(route[i]);
  return {pts, head: A, landed: true, sag};
};

/** sand grains shaken off the buried part as it comes out (and a couple later, during the hold) */
export const grainsAt = (t: number) => {
  const out: {p: V3; r: number; a: number}[] = [];
  const bl0 = BLADE0;
  void bl0;
  const N = 22;
  for (let i = 0; i < N; i++) {
    const late = i >= 19;
    const u = 0.45 + 0.5 * ((i * 0.618) % 1); // along the blade, buried half
    const v = ((i * 0.37) % 1 - 0.5) * 0.008;
    const td = late ? 24.6 + (i - 19) * 1.15 : 22.0 + (i / N) * 0.8;
    if (t < td) {
      // still clinging (only drawn once the blade is out of the sand)
      if (t < 22.0) continue;
      const bl = bladeAt(t);
      const dx = bl.b.x - bl.a.x, dy = bl.b.y - bl.a.y, l = Math.hypot(dx, dy);
      const p = v3(bl.a.x + dx * u - (dy / l) * v, bl.a.y + dy * u + (dx / l) * v, 0.0005);
      if (p.y > DISH.sand + 0.001) out.push({p, r: 0.0007, a: 1});
      continue;
    }
    const bl = bladeAt(td);
    const dx = bl.b.x - bl.a.x, dy = bl.b.y - bl.a.y, l = Math.hypot(dx, dy);
    const p0 = v3(bl.a.x + dx * u - (dy / l) * v, bl.a.y + dy * u + (dx / l) * v, 0.0005);
    const ft = t - td;
    const y = p0.y - 0.5 * 9.8 * ft * ft;
    const ground = floorAt(p0.x) + (p0.x > DISH.x - DISH.r && p0.x < DISH.x + DISH.r ? DISH.sand - 0.003 : 0);
    if (y < ground) continue;
    out.push({p: v3(p0.x + ((i % 3) - 1) * 0.002 * ft, y, p0.z), r: 0.0007, a: 1});
  }
  return out;
};

// ------------------------------------------------------------------ her performance
const RIGHT_REST = v3(-0.26, 0.016, -0.2);
const LEFT_REST = v3(0.1, 0.016, -0.25);
const DISH_GRAB = v3(COCOON_DISH.x + 0.006, 0.03, COCOON_DISH.z);
/** the cocoon she picks up: in the dish, in her right hand, then set beside the nozzle */
export const cocoonAt = (t: number, hand?: V3): {p: V3; held: boolean} => {
  if (t < LT.grasp[1]) return {p: v3(COCOON_DISH.x + 0.006, 0.013, COCOON_DISH.z), held: false};
  if (t < LT.release[0]) return {p: add3(hand ?? v3(0, 0, 0), v3(0.0, -0.016, 0.004)), held: true};
  return {p: COCOON_SPOT, held: false};
};
const handPath = (t: number): {R: V3; L: V3; shapeR: 'grip' | 'mitt' | 'open'; shapeL: 'grip' | 'mitt' | 'open'; splayR: number} => {
  // left hand: on the mounted fiber's clamp at first, then resting on the bench; later it steadies the wand
  let L = LEFT_REST;
  let shapeL: 'grip' | 'mitt' | 'open' = 'mitt';
  let R = RIGHT_REST;
  let shapeR: 'grip' | 'mitt' | 'open' = 'mitt';
  let splayR = 0.5;
  if (t < LT.back) {
    const up = v3(DISH_GRAB.x, 0.085, DISH_GRAB.z);
    const above = add3(COCOON_SPOT, v3(0, 0.06, 0));
    const setP = add3(COCOON_SPOT, v3(0, 0.018, -0.004));
    R = mixV(RIGHT_REST, add3(DISH_GRAB, v3(0, 0.03, 0)), ss(t, LT.reach[0], LT.reach[0] + 0.45));
    R = mixV(R, DISH_GRAB, ss(t, LT.reach[1] - 0.2, LT.grasp[1]));
    R = mixV(R, up, ss(t, LT.lift[0], LT.lift[1]));
    R = mixV(R, above, ss(t, LT.carry[0], LT.carry[1]));
    R = mixV(R, setP, ss(t, LT.set[0], LT.set[1]));
    R = mixV(R, add3(setP, v3(-0.2, 0.03, -0.32)), ss(t, LT.release[0] + 0.04, LT.release[0] + 0.24)); // low and back toward her, under the push-in camera
    shapeR = t < LT.reach[0] + 0.25 ? 'mitt' : t < LT.grasp[0] ? 'open' : t < LT.release[0] + 0.04 ? 'grip' : 'open';
    splayR = t < LT.grasp[0] ? 0.9 : 0.6;
  } else {
    // the wand is in her left hand (the near side of the action); the right rests on the bench
    const w = wandAt(t);
    L = sub3(w.N, mul3(w.a, WAND.grip)); // she holds it near the rear, clear of the work
    shapeL = 'grip';
    R = RIGHT_REST;
    shapeR = 'mitt';
  }
  return {R, L, shapeR, shapeL, splayR};
};
const mixV = (a: V3, b: V3, u: number) => v3(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u);

/** her pose and her arms' world joints */
export const herLab = (t: number) => {
  const hp = handPath(t);
  // what she watches
  let look: V3;
  if (t < LT.frameOff[1]) look = FRAME.c;
  else if (t < LT.back) look = mixV(v3(COCOON_DISH.x, 0.02, COCOON_DISH.z), COCOON_SPOT, ss(t, LT.carry[0], LT.carry[1]));
  else if (t < LT.contact + 0.3) look = fiberAt(t)?.head ?? v3(0.1, 0.02, 0);
  else look = add3(v3(bladeAt(t).a.x, bladeAt(t).a.y, 0), v3(0, -0.01, 0));
  if (t < LT.frameOff[1]) look = mixV(look, v3(COCOON_DISH.x, 0.02, COCOON_DISH.z), ss(t, LT.frameOff[0] + 0.2, LT.frameOff[1] + 0.25));
  const f = t < LT.back ? mix(FACES.neutral, {...FACES.focus, lid: 0.1}, ss(t, LT.reach[0], LT.reach[1])) : t < LT.contact ? FACES.focus : t < 22.6 ? {...FACES.focus, brow: -0.1, browIn: 0.2} : t < 26.5 ? {...FACES.relief, lid: 0.25, curve: 0.3} : {...FACES.smug, smirk: 0.3, curve: 0.6};
  const pose: Pose4 = {...stand(BODY_P, f)};
  const lean = t < LT.back ? 10 + 6 * ss(t, LT.reach[0], LT.carry[1]) : 15;
  pose.pitch = lean;
  pose.pel = v3(0, BODY_P.hipY - 4, -6);
  pose.twist = t < LT.back ? -6 * ss(t, LT.reach[0], LT.reach[1]) * (1 - ss(t, LT.carry[0], LT.carry[1])) + 8 * (1 - ss(t, LT.frameOff[0], LT.frameOff[1])) : 4;
  // breathing: a very small rise, only so a held pose is not frozen
  pose.pel = add3(pose.pel, v3(0, 1.2 * Math.sin(t * 2.1), 0));
  const j0 = joints4(BODY_P, pose);
  const lk = worldToCard(HER_G, HER_H, look);
  const hd = norm3(sub3(lk, j0.Hc));
  pose.hy = (Math.atan2(hd.x, hd.z) * 180) / Math.PI - pose.twist;
  pose.hp = Math.max(-10, Math.min(40, -(Math.asin(hd.y) * 180) / Math.PI - lean * 0.6));
  pose.face = {...pose.face, gx: clamp(pose.hy / 70, -0.6, 0.6) * 0.5, gy: 0.4};
  pose.armR = {hand: worldToCard(HER_G, HER_H, hp.R), shape: hp.shapeR, splay: hp.splayR, pole: v3(-0.7, -0.6, -0.1)};
  pose.armL = {hand: worldToCard(HER_G, HER_H, hp.L), shape: hp.shapeL, pole: v3(0.7, -0.6, -0.1)};
  const j = joints4(BODY_P, pose);
  const W = (p: V3) => cardToWorld(HER_G, HER_H, p);
  return {
    pose, j,
    armR: {S: W(j.SR), E: W(j.ER), W: W(j.WR), shape: hp.shapeR, splay: hp.splayR},
    armL: {S: W(j.SL), E: W(j.EL), W: W(j.WL), shape: hp.shapeL, splay: 0.5},
    short: j.armShort,
  };
};
export {A0};
