// E/F cameras (pure: no React — probed in node for speed, clearance and on-screen sizes).
//
// E2 → F1 is ONE camera (the cut at 198.30 is invisible: both shots render the same camera and the same scene):
//   E2 193.10–198.30  extreme close on his face (a slow push while he breathes his last; still after the eyes close)
//   A  198.30–199.45  F1 opens on E2's framing of his still face and leaves it: a truck right and a pan across the pair
//                     (her bowed head passes below frame left) to the radio on the van floor — nobody near it; the radio
//                     is in frame before its indicator flutters (199.0) and the move has landed before the song catches
//                     (199.6); a slow push on the radio while the reception recovers
//   B  200.55–231.60  the rising pullback: a crane that pulls back off the radio, finds the pair beside it (the first
//                     wide, ~203: radio, her bowed over his hand, him), rises and swings clockwise round him (S → SW → W)
//                     past the held Crew, the ring, heavy 2, the crater, the avenue with the halted block and the
//                     streaming columns, the intersections the machines take and the fires spreading, to the skyline;
//                     he stays in the lower frame until he is a speck. Fade to black over the last ~1.2 s.
// The B path is a centripetal Catmull-Rom curve through position keys, reparameterised by arc length; the camera's
// distance along it follows a smooth speed profile (zero speed at the start), so the speed has no jumps at the knots.
// The aim point and the lens follow the same curve parameter.
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


// ------------------------------------------------------------------ F1
/**
 * Phase A: the move off his still face to the radio. It starts at MOVE.a (F1's first frame, E2's own framing) and
 * lands at MOVE.b on the radio seen from the south-south-east through the van's open door: a truck right that bows out
 * to the south (her bowed head passes ~0.8 m from the lens, below frame left) and a pan right. The speed rises from
 * zero, peaks a third of the way and lands softly; the radio is in frame before 199.0 (the flutter).
 */
export const MOVE = {a: 198.3, b: 199.6};
const E2_END = camE2(MOVE.a);
/** The radio framing: ~1.5 m from the radio at bearing ~165°, a little above it (looking down onto the van floor). */
export const RAD_POS: V3 = {x: 8.72, y: 1.6, z: 3.5};
/** The move bows out to the south, away from her. */
const MOVE_CTRL: V3 = {x: 8.0, y: 1.42, z: 4.12};
/** The radio composition: the dial a little right of centre, the radio low-centre, the door frame and floor round it. */
export const RAD_SUBJ: V3 = {x: 8.08, y: 0.99, z: 1.86};
const RAD_SX = 0.55, RAD_SY = 0.52, RAD_FOV = 35;
/** (R2 names, kept for compatibility) */
export const KNOB_POS = RAD_POS;
export const RADIO_AIM = RAD_SUBJ;
/** Camera heading/elevation (deg) of an aim, and back (the engine's convention: yaw 0 = north (−z), 90 = east). */
const yawPitch = (pos: V3, target: V3) => { const f = norm3(sub3(target, pos)); return {yaw: (Math.atan2(f.x, -f.z) * 180) / Math.PI, pitch: (Math.asin(f.y) * 180) / Math.PI}; };
const aimYP = (pos: V3, yaw: number, pitch: number): V3 => {
  const y = (yaw * Math.PI) / 180, p = (pitch * Math.PI) / 180;
  return add3(pos, {x: Math.sin(y) * Math.cos(p), y: Math.sin(p), z: -Math.cos(y) * Math.cos(p)});
};
const A0 = yawPitch(E2_END.pos, E2_END.target);
const A1 = yawPitch(RAD_POS, aimFor(RAD_POS, RAD_SUBJ, RAD_FOV, RAD_SX, RAD_SY));
/**
 * The move's progress (0..1): speed ∝ u^1.5 (1−u)^2.6 — it leaves his face gently (speed and acceleration start at
 * zero), peaks a third of the way in and lands softly. Integrated once into a table.
 */
const MOVE_TBL = (() => {
  const n = 400, acc = [0];
  const v = (u: number) => u ** 1.5 * (1 - u) ** 2.6;
  for (let i = 1; i <= n; i++) acc.push(acc[i - 1] + (v((i - 1) / n) + v(i / n)) / 2);
  return acc.map((a) => a / acc[n]);
})();
const moveK = (u: number) => { const x = clamp(u) * (MOVE_TBL.length - 1), i = Math.min(MOVE_TBL.length - 2, Math.floor(x)); return lerp(MOVE_TBL[i], MOVE_TBL[i + 1], x - i); };
/** After landing: a slow push toward the radio while the reception recovers and the song catches. */
const PUSH = 0.1;
export const RISE_T0 = 200.55;
const PUSH_DIR = norm3(sub3(RAD_SUBJ, RAD_POS));
const pushAt = (T: number) => PUSH * smooth((T - (MOVE.b - 0.25)) / (RISE_T0 - MOVE.b + 0.25));
/** Where the hold ends (the rise starts from rest here). */
const HOLD_END: V3 = add3(RAD_POS, mul3(PUSH_DIR, PUSH));

/** The point the pullback keeps in frame (his chest), and the polar keys around it. */
export const HIM: V3 = {x: 6.6, y: 0.85, z: 3.12};
const polar = (bearing: number, R: number, H: number): V3 => ({x: HIM.x + Math.sin((bearing * Math.PI) / 180) * R, y: H, z: HIM.z - Math.cos((bearing * Math.PI) / 180) * R});

/**
 * [bearing from him (deg), distance (m), height (m), fov, his screen x, his screen y]. The crane rises over the open
 * ground round the ridge (the plaza between W1 and W3, the west ruin's rubble) and ends high over the avenue's
 * western continuation between W4 and W5 (≥ 10 m clear of both), looking straight down the avenue over him: the two
 * frontages frame the canyon, the battlefield at the bottom, the burning skyline at the top. Through the mid-rise he is
 * kept a little right of centre so the tall block south-east of him (FS0) stays toward the right edge.
 */
const RISE_POLAR: [number, number, number, number, number, number][] = [
  [166, 10.2, 6.4, 42, 0.43, 0.52],
  [198, 17.0, 10.8, 45, 0.46, 0.6],
  [224, 25.5, 18.5, 48, 0.5, 0.7],
  [244, 36, 30, 51, 0.55, 0.77],
  [260, 50, 47, 53, 0.55, 0.8],
  [272, 66, 63, 55, 0.5, 0.84],
];
export const RISE_KEYS: PathKey[] = [
  // the radio (end of the push), then pulling back off it until the pair is in frame beside it
  {pos: HOLD_END, subj: RAD_SUBJ, sx: RAD_SX, sy: RAD_SY, fov: RAD_FOV},
  // (a crane up off the radio, not a truck right: a right truck against the left pan holds her on the frame's edge as a
  // coral wedge; from above she comes into the frame as her bowed head and back together)
  {pos: {x: 8.5, y: 3.3, z: 4.25}, subj: {x: 7.7, y: 0.9, z: 2.35}, sx: 0.56, sy: 0.46, fov: 38},
  // the first wide: the radio (frame right), her bowed over his hand, him against the slab
  {pos: {x: 9.7, y: 2.85, z: 6.2}, subj: {x: 7.3, y: 0.85, z: 2.6}, sx: 0.5, sy: 0.53, fov: 40},
  ...RISE_POLAR.map(([b, R, H, fov, sx, sy]) => ({pos: polar(b, R, H), subj: HIM, sx, sy, fov})),
];
/** Speed profile (shape only; scaled to the path): a gentle start from rest, a steady growth, a slight settle. */
export const riseSpeed = (t: number) => smooth((t - RISE_T0) / 1.6) * Math.exp(0.07 * (t - RISE_T0)) * (1 - 0.25 * smooth((t - 225) / 5.6));
const RISE = makeMove(RISE_KEYS, RISE_T0, M.CARD_IN, riseSpeed);
export const riseTotal = RISE.total;
export const riseKeyTimes = () => RISE_KEYS.map((_, i) => RISE.keyTime(i));

/** Handheld life on the close part, fading to a crane-smooth move as it rises. */
const drift = (T: number, amp: number): V3 => {
  const n = (x: number, s: number) => Math.sin(x * 1.13 + s) * 0.55 + Math.sin(x * 2.31 + s * 1.7) * 0.3 + Math.sin(x * 4.07 + s * 0.6) * 0.15;
  return {x: n(T, 1) * amp, y: n(T, 5) * amp * 0.6, z: n(T, 9) * amp};
};

/**
 * E2 and F1's camera up to the rise: E2's framing (with its drift) until MOVE.a, then the move to the radio, then the
 * push. The pan turns monotonically from E2's aim to the radio's, a touch ahead of the truck; E2's drift cross-fades
 * into the crane's handheld drift.
 */
export const camClose = (T: number): Cam3 => {
  if (T < MOVE.a) {
    const c = camE2(T), d = driftE(T, e2Amp(T));
    return {pos: add3(c.pos, d), target: add3(c.target, mul3(d, 1.25)), fov: c.fov};
  }
  const u = (T - MOVE.a) / (MOVE.b - MOVE.a);
  const kP = moveK(u), kS = moveK(u * 1.3); // the pan leads the truck (the radio is in frame before the flutter)
  const pos0 = add3(add3(mul3(E2_END.pos, (1 - kP) ** 2), mul3(MOVE_CTRL, 2 * kP * (1 - kP))), mul3(RAD_POS, kP * kP));
  const pos = add3(pos0, mul3(PUSH_DIR, pushAt(T)));
  const fov = lerp(E2_END.fov ?? 30, RAD_FOV, kP);
  const target = aimYP(pos, A0.yaw + (((A1.yaw - A0.yaw + 540) % 360) - 180) * kS, lerp(A0.pitch, A1.pitch, kS));
  const kd = smooth(u);
  const d = add3(mul3(driftE(T, e2Amp(T)), 1 - kd), mul3(drift(T, 0.005), kd));
  return {pos: add3(pos, d), target: add3(target, mul3(d, 1.3)), fov};
};

export const camF1 = (T: number): Cam3 => {
  if (T < RISE_T0) return camClose(T);
  const c = RISE.at(T);
  const amp = 0.005 * (1 - smooth((T - RISE_T0) / 4));
  const dr = drift(T, amp);
  return {pos: add3(c.pos, dr), target: add3(c.target, mul3(dr, 1.3)), fov: c.fov};
};

/** F1's fade to black (0..1) over the last ~1.2 s: the end card (G_card) comes up out of black at CARD_IN. */
export const F1_FADE = {a: M.CARD_IN - 1.2, b: M.CARD_IN - 1 / 30};
export const fadeF1 = (T: number) => smooth((T - F1_FADE.a) / (F1_FADE.b - F1_FADE.a));
