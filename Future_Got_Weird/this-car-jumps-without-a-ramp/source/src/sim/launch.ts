// Simplified vertical model of a stationary hop (whole car, front and rear treated alike, no pitch).
//
// Two masses: the sprung body and the four wheel assemblies lumped together. Between them: a spring (with preload), a
// damper, an actuator force Fa (positive pushes body up and wheels down) and end-of-travel stops. Under the wheels:
// tyres that can push on the road but never pull (N = 0 once they lift). Gravity acts on both masses at all times.
//
// This is a teaching model, not BYD's control sequence: the numbers are round, plausible values chosen so the hop,
// the travel and the landing read clearly. The diagram draws N (road on tyres) and the weight from these states,
// so the arrows obey the brief: N balances weight at rest, exceeds it while the car accelerates upward, is zero in
// the air and returns on landing; gravity never switches off.

export const G = 9.81;
export const MS = 2100; // sprung mass, kg
export const MU = 380; // four wheel assemblies, kg
export const MTOT = MS + MU;
export const R_TYRE = 0.36; // unloaded tyre radius, m
const KT = 4 * 330e3; // tyre stiffness, N/m
const CT = 4 * 600;
const KS = 4 * 52e3; // suspension spring, N/m
const CS = 4 * 3600; // passive damper, N s/m
const F0 = MS * G; // spring preload: static deflection d = 0 at rest
export const D_MIN = -0.075; // compression stop (m, relative to static)
export const D_MAX = 0.095; // extension stop
const KLIM = 4e6;
const CLIM = 4e4;
export const COM_H = 0.47; // body centre-of-mass height at rest, m

export type LaunchParams = {
  tCrouch: number; // start of the crouch
  crouchDur: number;
  crouchF: number; // N (pull body down)
  pushF: number; // N (push body up)
  landDamp: number; // extra damping after landing, N s/m
};
export const DEFAULT_LAUNCH: LaunchParams = {tCrouch: 0.5, crouchDur: 0.42, crouchF: 12e3, pushF: 42e3, landDamp: 38e3};

export type LaunchState = {
  t: number;
  zb: number; // body COM height (m)
  vb: number;
  zw: number; // wheel centre height (m)
  vw: number;
  d: number; // suspension extension relative to static (m, + = extended)
  N: number; // total road force on the tyres (N), >= 0
  Fa: number; // actuator force (N)
  air: boolean;
  phase: 'rest' | 'crouch' | 'push' | 'air' | 'land';
};

const ZW0 = R_TYRE - MTOT * G / KT; // static wheel-centre height
const L0 = COM_H - ZW0; // static body-to-wheel distance

export const simulateLaunch = (p: LaunchParams = DEFAULT_LAUNCH, tEnd = 3.2, dt = 1 / 4000, every = 1 / 240): LaunchState[] => {
  let zb = COM_H, vb = 0, zw = ZW0, vw = 0;
  let phase: LaunchState['phase'] = 'rest';
  let tTake = -1, tLand = -1;
  const out: LaunchState[] = [];
  let nextOut = 0;
  for (let t = 0; t <= tEnd + 1e-9; t += dt) {
    const d = zb - zw - L0;
    const dv = vb - vw;
    const comp = R_TYRE - zw;
    const N = comp > 0 ? Math.max(0, KT * comp - CT * vw) : 0;
    // phase logic
    if (phase === 'rest' && t >= p.tCrouch) phase = 'crouch';
    if (phase === 'crouch' && t >= p.tCrouch + p.crouchDur) phase = 'push';
    if (phase === 'push' && N === 0 && zw > R_TYRE + 0.002) {
      phase = 'air';
      tTake = t;
    }
    if (phase === 'air' && N > 0) {
      phase = 'land';
      tLand = t;
    }
    let Fa = 0;
    if (phase === 'crouch') Fa = -p.crouchF * Math.min(1, (t - p.tCrouch) / 0.12);
    if (phase === 'push') {
      const ramp = Math.min(1, (t - p.tCrouch - p.crouchDur) / 0.05);
      Fa = p.pushF * ramp * (d > D_MAX - 0.01 ? 0.3 : 1);
    }
    if (phase === 'air') Fa = 0;
    if (phase === 'land') Fa = -p.landDamp * dv * Math.exp(-(t - tLand) / 0.9);
    const Fs = F0 - KS * d;
    const Fd = -CS * dv;
    let Flim = 0;
    if (d < D_MIN) Flim = -KLIM * (d - D_MIN) - CLIM * dv;
    if (d > D_MAX) Flim = -KLIM * (d - D_MAX) - CLIM * dv;
    const Fsus = Fs + Fd + Fa + Flim; // force on body (up), and its reaction on the wheels (down)
    const ab = Fsus / MS - G;
    const aw = (-Fsus + N) / MU - G;
    if (t >= nextOut - 1e-9) {
      out.push({t, zb, vb, zw, vw, d, N, Fa, air: N === 0, phase});
      nextOut += every;
    }
    vb += ab * dt;
    vw += aw * dt;
    zb += vb * dt;
    zw += vw * dt;
  }
  (out as unknown as {tTake: number; tLand: number}).tTake = tTake;
  (out as unknown as {tTake: number; tLand: number}).tLand = tLand;
  return out;
};

/** Interpolated state at sim time t. */
export const sampleLaunch = (arr: LaunchState[], t: number): LaunchState => {
  const step = arr[1].t - arr[0].t;
  const i = Math.max(0, Math.min(arr.length - 2, Math.floor((t - arr[0].t) / step)));
  const a = arr[i], b = arr[i + 1];
  const u = Math.max(0, Math.min(1, (t - a.t) / step));
  const m = (x: number, y: number) => x + (y - x) * u;
  return {t, zb: m(a.zb, b.zb), vb: m(a.vb, b.vb), zw: m(a.zw, b.zw), vw: m(a.vw, b.vw), d: m(a.d, b.d), N: m(a.N, b.N), Fa: m(a.Fa, b.Fa), air: u < 0.5 ? a.air : b.air, phase: u < 0.5 ? a.phase : b.phase};
};

export const LAUNCH = simulateLaunch();
export const launchEvents = (arr: LaunchState[]) => {
  const take = arr.find((s, i) => i > 0 && s.air && !arr[i - 1].air);
  const land = arr.find((s, i) => i > 0 && !s.air && arr[i - 1].air && s.t > (take?.t ?? 0));
  const push = arr.find((s) => s.phase === 'push');
  const crouch = arr.find((s) => s.phase === 'crouch');
  let apex = arr[0];
  for (const s of arr) if (take && land && s.t > take.t && s.t < land.t && s.zb > apex.zb) apex = s;
  return {crouch: crouch?.t ?? 0, push: push?.t ?? 0, take: take?.t ?? 0, apex: apex.t, land: land?.t ?? 0, apexClear: apex.zw - R_TYRE};
};
export const STATIC = {zw: ZW0, L0, N: MTOT * G};
