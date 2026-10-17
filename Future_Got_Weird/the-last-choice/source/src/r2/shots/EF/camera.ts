// E/F cameras (pure: no React — probed in node for speed, clearance and on-screen sizes).
//
// E2 → F1 is ONE camera (the cut at 199.30 is invisible: both shots render the same camera and the same scene):
//   E2 193.10–198.50  extreme close on his face (a slow push while he breathes his last; still after the eyes close)
//   A  198.50–201.50  off his still face — following her as she turns to the van door — a pan right with a truck to
//                     the radio, arriving as her hand turns the knob (twist 199.60–199.90, the click on 199.90); hold
//   B  201.50–230.40  the rising pullback: a crane that rises and swings clockwise round him (S → SW → WSW) so that
//                     the first wide (~203) holds the radio AND his body, the companions and the ring pass below, then
//                     the crater, the avenue with the streaming formations and the skyline with the fallen tower come
//                     into the top of frame; he stays in the lower frame until he is a speck. Fade to black at the end.
// The B path is a centripetal Catmull-Rom curve through position keys, reparameterised by arc length; the camera's
// distance along it follows a monotone C1 spline through the keys' times (zero speed at the start), so the speed has
// no jumps at the knots. The aim point and the lens follow the same curve parameter.
import type {V3} from '../../../kit/math';
import {add3, sub3, mul3, lerp, lerp3, clamp, smooth, norm3} from '../../../kit/math';
import type {Cam3} from '../../engine/camera';
import {M} from '../../timing';


// ------------------------------------------------------------------ curve helpers
const dist = (a: V3, b: V3) => Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
/** Centripetal Catmull-Rom point between P1 and P2 (u 0..1). Ends are extended by reflection. */
const crc = (P0: V3, P1: V3, P2: V3, P3: V3, u: number): V3 => {
  const a = 0.5;
  const t0 = 0, t1 = t0 + Math.pow(Math.max(1e-6, dist(P0, P1)), a), t2 = t1 + Math.pow(Math.max(1e-6, dist(P1, P2)), a), t3 = t2 + Math.pow(Math.max(1e-6, dist(P2, P3)), a);
  const t = t1 + (t2 - t1) * u;
  const L = (A: V3, B: V3, ta: number, tb: number) => add3(mul3(A, (tb - t) / (tb - ta)), mul3(B, (t - ta) / (tb - ta)));
  const A1 = L(P0, P1, t0, t1), A2 = L(P1, P2, t1, t2), A3 = L(P2, P3, t2, t3);
  const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
  return L(B1, B2, t1, t2);
};
const ext = (P: V3[]) => [sub3(mul3(P[0], 2), P[1]), ...P, sub3(mul3(P[P.length - 1], 2), P[P.length - 2])];

/** Aim so that `subject` lands at screen fraction (sx, sy) with no roll. */
export const aimFor = (pos: V3, subject: V3, fov: number, sx: number, sy: number): V3 => {
  const d0 = sub3(subject, pos);
  let yaw = Math.atan2(d0.x, -d0.z), pitch = Math.atan2(d0.y, Math.hypot(d0.x, d0.z));
  const hY = (fov / 2) * (Math.PI / 180), hX = Math.atan(Math.tan(hY) * (16 / 9));
  for (let it = 0; it < 60; it++) {
    const f = {x: Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(yaw) * Math.cos(pitch)};
    const r = norm3({x: -f.z, y: 0, z: f.x});
    const u = {x: r.y * f.z - r.z * f.y, y: r.z * f.x - r.x * f.z, z: r.x * f.y - r.y * f.x};
    const dz = d0.x * f.x + d0.y * f.y + d0.z * f.z;
    const px = 0.5 + (d0.x * r.x + d0.y * r.y + d0.z * r.z) / dz / Math.tan(hX) / 2;
    const py = 0.5 - (d0.x * u.x + d0.y * u.y + d0.z * u.z) / dz / Math.tan(hY) / 2;
    if (Math.abs(px - sx) < 1e-6 && Math.abs(py - sy) < 1e-6) break;
    yaw += (px - sx) * 2 * hX * 0.6;
    pitch -= (py - sy) * 2 * hY * 0.6;
  }
  const f = {x: Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(yaw) * Math.cos(pitch)};
  // the aim point sits at the subject's distance (so aims can be blended without the turn bunching up)
  return add3(pos, mul3(f, Math.hypot(d0.x, d0.y, d0.z)));
};

/** C1 cubic Hermite through (x_i, y_i) with finite-difference tangents (non-uniform knots). */
const hermite = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const m = xs.map((_, i) => (i === 0 ? (ys[1] - ys[0]) / (xs[1] - xs[0]) : i === n - 1 ? (ys[n - 1] - ys[n - 2]) / (xs[n - 1] - xs[n - 2]) : (ys[i + 1] - ys[i - 1]) / (xs[i + 1] - xs[i - 1])));
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h;
    return (2 * t * t * t - 3 * t * t + 1) * ys[i] + (t * t * t - 2 * t * t + t) * h * m[i] + (-2 * t * t * t + 3 * t * t) * ys[i + 1] + (t * t * t - t * t) * h * m[i + 1];
  };
};

/**
 * A camera move along keyed positions (centripetal Catmull-Rom, reparameterised by arc length: C1 in time for any
 * smooth speed). Timing comes from a speed profile v(t) (any smooth shape) integrated and scaled so the camera arrives
 * at the last key at t1. The framing is a composition track over the same arc length — the subject point, where it
 * sits on screen and the lens, each C1 — and the aim is solved from it every frame, so pan/tilt rates are continuous.
 */
export type PathKey = {pos: V3; subj: V3; sx: number; sy: number; fov: number};
export const makeMove = (keys: PathKey[], t0: number, t1: number, speed: (t: number) => number, samples = 400) => {
  const P = ext(keys.map((k) => k.pos));
  const nSeg = keys.length - 1;
  const tbl: {s: number; i: number; u: number}[] = [];
  let s = 0, prev = keys[0].pos;
  const sAt: number[] = [0];
  for (let i = 0; i < nSeg; i++) {
    for (let j = i === 0 ? 0 : 1; j <= samples; j++) {
      const u = j / samples;
      const p = crc(P[i], P[i + 1], P[i + 2], P[i + 3], u);
      s += dist(prev, p);
      prev = p;
      tbl.push({s, i, u});
    }
    sAt.push(s);
  }
  const total = s;
  const tr = {
    x: hermite(sAt, keys.map((k) => k.subj.x)), y: hermite(sAt, keys.map((k) => k.subj.y)), z: hermite(sAt, keys.map((k) => k.subj.z)),
    sx: hermite(sAt, keys.map((k) => k.sx)), sy: hermite(sAt, keys.map((k) => k.sy)), fov: hermite(sAt, keys.map((k) => k.fov)),
  };
  // s(t): the integral of the speed profile (5 ms steps), scaled to the path length
  const dt = 0.005, n = Math.ceil((t1 - t0) / dt);
  const acc: number[] = [0];
  for (let k = 1; k <= n; k++) acc.push(acc[k - 1] + 0.5 * (speed(t0 + (k - 1) * dt) + speed(t0 + k * dt)) * dt);
  const scale = total / acc[n];
  const sOf = (t: number) => {
    const x = clamp((t - t0) / dt, 0, n), k = Math.min(n - 1, Math.floor(x));
    return lerp(acc[k], acc[k + 1], x - k) * scale;
  };
  const locate = (sv: number) => {
    const x = clamp(sv, 0, total);
    let lo = 0, hi = tbl.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (tbl[mid].s < x) lo = mid; else hi = mid; }
    const a = tbl[lo], b = tbl[hi];
    const k = b.s > a.s ? (x - a.s) / (b.s - a.s) : 0;
    // across a segment boundary a is (i−1, u=1) = (i, u=0)
    return a.i === b.i ? {i: a.i, u: lerp(a.u, b.u, k)} : {i: b.i, u: lerp(0, b.u, k)};
  };
  const at = (t: number): Cam3 & {s: number} => {
    const sv = sOf(t);
    const {i, u} = locate(sv);
    const pos = crc(P[i], P[i + 1], P[i + 2], P[i + 3], u);
    const fov = tr.fov(sv);
    const target = aimFor(pos, {x: tr.x(sv), y: tr.y(sv), z: tr.z(sv)}, fov, tr.sx(sv), tr.sy(sv));
    return {pos, target, fov, s: sv};
  };
  /** the time the camera passes key i */
  const keyTime = (i: number) => {
    let lo = t0, hi = t1;
    for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (sOf(m) < sAt[i]) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };
  return {at, total, sAt, keyTime, sOf};
};

// ------------------------------------------------------------------ the places (world)
/** His head centre (slumped; the breath moves it about a centimetre) — the face the cameras look at. */
export const FACE: V3 = {x: 6.53, y: 1.095, z: 3.04};
/** The knob / dial area on the van floor (RADIO.knob ≈ (7.99, 0.95, 1.81)). */
export const RADIO_AIM: V3 = {x: 8.03, y: 0.93, z: 1.86};

// ------------------------------------------------------------------ E1: close, low, from his right-front
// He sits against the slab facing ESE; she comes in from the van side (frame right) and kneels at his left; the van's
// open door with the radio is behind her; the ridge and its small fire rise behind him.
export const camE1 = (T: number): Cam3 => {
  // low, at his right-front (bearing ~155°): his face three-quarter; she crawls in from frame right across the line
  // of view (not toward the lens, not behind him) and kneels at his left; the van's open door is behind her
  const k = smooth((T - M.FINAL_HIT) / (191.4 - M.FINAL_HIT));
  const pos = lerp3({x: 7.76, y: 0.84, z: 5.44}, {x: 7.68, y: 0.86, z: 5.2}, k);
  const target = lerp3({x: 7.16, y: 0.84, z: 2.92}, {x: 7.1, y: 0.85, z: 2.88}, k);
  return {pos, target, fov: 38};
};

// ------------------------------------------------------------------ E2: extreme close on his face, a little low
export const camE2 = (T: number): Cam3 => {
  // his face points ~111° (ESE), level; the lens sits in front of it, a touch to his left and below the eyes
  const k = smooth((T - 193.1) / 4.5);
  const head: V3 = {x: 6.53, y: 1.095, z: 3.04};
  const dirF = norm3({x: 0.9, y: -0.1, z: 0.42});
  const d = lerp(0.9, 0.82, k); // a slow, almost imperceptible push while he breathes his last
  return {pos: add3(head, mul3(dirF, d)), target: add3(head, {x: 0.09, y: -0.02, z: 0.035}), fov: 30};
};
/** E2's slow handheld drift (m): breathing life, dying away as he does. */
const driftE = (T: number, amp: number): V3 => {
  const n = (x: number, s: number) => Math.sin(x * 0.93 + s) * 0.55 + Math.sin(x * 1.87 + s * 1.7) * 0.3 + Math.sin(x * 3.3 + s * 0.6) * 0.15;
  return {x: n(T, 2) * amp, y: n(T, 6) * amp * 0.6, z: n(T, 10) * amp};
};
const e2Amp = (T: number) => 0.004 * (1 - smooth((T - M.EYES_CLOSE) / 1.2)) + 0.0012;

/** Where a world point sits on screen (fractions) for a camera (the engine's convention: no roll). */
const screenOf = (pos: V3, target: V3, fov: number, p: V3) => {
  const f = norm3(sub3(target, pos));
  const r = norm3({x: -f.z, y: 0, z: f.x});
  const u = {x: r.y * f.z - r.z * f.y, y: r.z * f.x - r.x * f.z, z: r.x * f.y - r.y * f.x};
  const d = sub3(p, pos);
  const dz = d.x * f.x + d.y * f.y + d.z * f.z;
  const hY = (fov / 2) * (Math.PI / 180), hX = Math.atan(Math.tan(hY) * (16 / 9));
  return {sx: 0.5 + (d.x * r.x + d.y * r.y + d.z * r.z) / dz / Math.tan(hX) / 2, sy: 0.5 - (d.x * u.x + d.y * u.y + d.z * u.z) / dz / Math.tan(hY) / 2};
};

// ------------------------------------------------------------------ F1
/**
 * Phase A: the move off his face to the knob. It starts at MOVE.a (inside E2) from E2's own framing and lands at MOVE.b
 * (in F1) on the knob seen from the south-south-east: her right arm reaches in from frame left, the hand side-on, the
 * knob face ~45° to the lens. The move's speed peaks early (a third of the way) and lands softly, so the camera is
 * almost settled while she turns the knob.
 */
export const MOVE = {a: 198.5, b: 200.35};
const E2_END = camE2(MOVE.a);
const E2_FACE: V3 = {x: 6.53, y: 1.075, z: 3.04};
const E2_SCREEN = screenOf(E2_END.pos, E2_END.target, E2_END.fov ?? 30, E2_FACE);
export const KNOB_POS: V3 = {x: 8.47, y: 1.27, z: 3.1};
/** The knob composition: the knob a little right of centre and below (her arm comes in across the left half). */
const KNOB_SUBJ: V3 = {x: 7.98, y: 0.96, z: 1.83}, KNOB_SX = 0.6, KNOB_SY = 0.56, KNOB_FOV = 32;
/** The move's progress: k(0)=0 with zero speed, speed peaking at a third, a long soft landing (k', k'' → 0 at 1). */
const moveK = (u: number) => { const x = clamp(u); return 1 - (1 - x) ** 3 * (1 + 3 * x); };
export const RISE_T0 = 201.5;

/** The point the pullback keeps in frame (his chest), and the polar keys around it. */
export const HIM: V3 = {x: 6.6, y: 0.85, z: 3.12};
const polar = (bearing: number, R: number, H: number): V3 => ({x: HIM.x + Math.sin((bearing * Math.PI) / 180) * R, y: H, z: HIM.z - Math.cos((bearing * Math.PI) / 180) * R});

/** [bearing from him (deg), distance (m), height (m), fov, his screen x, his screen y] */
const RISE_POLAR: [number, number, number, number, number, number][] = [
  [164, 9.8, 6.6, 41, 0.42, 0.5],
  [196, 17, 10.8, 44, 0.45, 0.56],
  [218, 27, 17.5, 48, 0.46, 0.68],
  [230, 40, 30, 52, 0.47, 0.8],
  [244, 58, 50, 55, 0.48, 0.86],
  [252, 72, 64, 58, 0.49, 0.89],
  // the end: west of him, just south of the avenue's axis, 78 m up and 42° down — over W5's roof, looking down the
  // avenue between its frontages to the skyline; at ≥ 42° the slab behind him never hides his chest
  [258, 85, 78, 60, 0.5, 0.9],
];
export const RISE_KEYS: PathKey[] = [
  // the radio (end of the pan), then the first wide: the radio and his body, her between them
  {pos: KNOB_POS, subj: KNOB_SUBJ, sx: KNOB_SX, sy: KNOB_SY, fov: KNOB_FOV},
  {pos: {x: 9.2, y: 2.45, z: 5.95}, subj: {x: 7.25, y: 0.82, z: 2.6}, sx: 0.5, sy: 0.5, fov: 39},
  ...RISE_POLAR.map(([b, R, H, fov, sx, sy]) => ({pos: polar(b, R, H), subj: HIM, sx, sy, fov})),
];
/** Speed profile (shape only; scaled to the path): a gentle start from rest, a steady growth, a slight settle. */
export const riseSpeed = (t: number) => smooth((t - RISE_T0) / 1.8) * Math.exp(0.072 * (t - RISE_T0)) * (1 - 0.2 * smooth((t - 225) / 5.4));
const RISE = makeMove(RISE_KEYS, RISE_T0, M.CREDITS_IN, riseSpeed);
export const riseTotal = RISE.total;
export const riseKeyTimes = () => RISE_KEYS.map((_, i) => RISE.keyTime(i));

/** Handheld life on the close part, fading to a crane-smooth move as it rises. */
const drift = (T: number, amp: number): V3 => {
  const n = (x: number, s: number) => Math.sin(x * 1.13 + s) * 0.55 + Math.sin(x * 2.31 + s * 1.7) * 0.3 + Math.sin(x * 4.07 + s * 0.6) * 0.15;
  return {x: n(T, 1) * amp, y: n(T, 5) * amp * 0.6, z: n(T, 9) * amp};
};

/**
 * E2 and F1's camera up to the rise: E2's framing (with its drift) until MOVE.a, then the move to the knob, then the hold.
 * The aim is solved from a composition track (subject: his face → the knob, and where it sits on screen), so the pan
 * rate has no kinks; E2's drift cross-fades into the crane's handheld drift.
 */
export const camClose = (T: number): Cam3 => {
  if (T < MOVE.a) {
    const c = camE2(T), d = driftE(T, e2Amp(T));
    return {pos: add3(c.pos, d), target: add3(c.target, mul3(d, 1.25)), fov: c.fov};
  }
  const u = (T - MOVE.a) / (MOVE.b - MOVE.a);
  const kP = moveK(u), kS = moveK(u * 1.08); // the pan leads the truck a little
  // the truck: a slight arc up and out (away from her) between the two ends
  const out = {x: 0.12, y: 0.1, z: 0.16};
  const pos = add3(lerp3(E2_END.pos, KNOB_POS, kP), mul3(out, Math.sin(Math.PI * kP)));
  const fov = lerp(E2_END.fov ?? 30, KNOB_FOV, kP);
  const target = aimFor(pos, lerp3(E2_FACE, KNOB_SUBJ, kS), fov, lerp(E2_SCREEN.sx, KNOB_SX, kS), lerp(E2_SCREEN.sy, KNOB_SY, kS));
  const kd = smooth(u);
  const d = add3(mul3(driftE(T, e2Amp(T)), 1 - kd), mul3(drift(T, 0.006), kd));
  return {pos: add3(pos, d), target: add3(target, mul3(d, 1.3)), fov};
};

export const camF1 = (T: number): Cam3 => {
  if (T < RISE_T0) return camClose(T);
  const c = RISE.at(T);
  const amp = 0.006 * (1 - smooth((T - RISE_T0) / 4));
  const dr = drift(T, amp);
  return {pos: add3(c.pos, dr), target: add3(c.target, mul3(dr, 1.3)), fov: c.fov};
};

/** F1's fade to black (0..1): the credits start at CREDITS_IN by fading a near-black field in over black. */
export const F1_FADE = {a: 228.3, b: M.CREDITS_IN - 1 / 30};
export const fadeF1 = (T: number) => smooth((T - F1_FADE.a) / (F1_FADE.b - F1_FADE.a));
