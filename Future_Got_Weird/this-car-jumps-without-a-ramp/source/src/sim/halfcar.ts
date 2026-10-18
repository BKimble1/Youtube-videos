// Half-car model over a road profile (side view): body heave and pitch, front and rear wheel sets, tyres that only
// push, end-of-travel stops, and an optional "active" force at each axle that resists body motion (sky-hook style)
// but is limited in size. It is a teaching model: round, plausible numbers, not the U9's tuning. What it shows is
// qualitative and robust: the wheels follow the road, the cabin moves much less but not zero, and a big enough bump
// still uses up the travel.

const MS = 2100, IY = 3100, MU = 190; // kg, kg m^2, per-axle unsprung kg
const A = 1.49, B = 1.41; // COM to front / rear axle (m)
const KS = 104e3, CS = 6500; // per axle spring and passive damper
const KT = 660e3; // per axle tyre
const LIM_C = -0.07, LIM_E = 0.08; // travel from static (m)
const KLIM = 3e6;
const F_MAX = 7000; // active force limit per axle (N)
const NSF = 11.9e3, NSR = 12.4e3; // static tyre loads per axle (N): the dynamic part can't pull below -static
const C_SKY = 26e3;

export type HalfState = {t: number; x: number; z: number; th: number; zf: number; zr: number; rf: number; rr: number; Ff: number; Fr: number; limF: number; limR: number};

/**
 * Simulate from t0 to t1 with car position x(t) (m) and road profile road(x) (m). active(t) in [0,1] blends the active
 * force in. Returns states every `every` s; z/th/zf/zr are offsets from static (m, rad, + = nose up).
 */
export const simulateHalf = (t0: number, t1: number, xAt: (t: number) => number, road: (x: number) => number, active: (t: number) => number, every = 1 / 120): HalfState[] => {
  let z = 0, vz = 0, th = 0, w = 0, zf = 0, vf = 0, zr = 0, vr = 0;
  const dt = 1 / 2000;
  const out: HalfState[] = [];
  let next = t0;
  let limF = 0, limR = 0;
  for (let t = t0; t <= t1 + 1e-9; t += dt) {
    const x = xAt(t);
    const rf = road(x + 1.45), rr = road(x - 1.45);
    // body points above the axles (small angles)
    const bf = z + A * th, br = z - B * th;
    const vbf = vz + A * w, vbr = vz - B * w;
    const df = bf - zf, dr = br - zr; // suspension extension (m)
    const lim = (d: number) => (d < LIM_C ? -KLIM * (d - LIM_C) : d > LIM_E ? -KLIM * (d - LIM_E) : 0);
    const a = active(t);
    const sat = (f: number) => Math.max(-F_MAX, Math.min(F_MAX, f));
    const Ff = a * sat(-C_SKY * vbf), Fr = a * sat(-C_SKY * vbr);
    const cs = CS;
    const Pf = -KS * df - cs * (vbf - vf) + lim(df) + Ff; // force on body at front (up)
    const Pr = -KS * dr - cs * (vbr - vr) + lim(dr) + Fr;
    const Nf = Math.max(-NSF, KT * (rf - zf)), Nr = Math.max(-NSR, KT * (rr - zr)); // dynamic part (static preload cancels)
    const az = (Pf + Pr) / MS;
    const aw = (A * Pf - B * Pr) / IY;
    const af = (-Pf + Nf) / MU;
    const ar = (-Pr + Nr) / MU;
    limF = Math.max(limF * 0.999, df < LIM_C + 0.004 || df > LIM_E - 0.004 ? 1 : 0);
    limR = Math.max(limR * 0.999, dr < LIM_C + 0.004 || dr > LIM_E - 0.004 ? 1 : 0);
    if (t >= next - 1e-9) {
      out.push({t, x, z, th, zf, zr, rf, rr, Ff, Fr, limF, limR});
      next += every;
    }
    vz += az * dt; w += aw * dt; vf += af * dt; vr += ar * dt;
    z += vz * dt; th += w * dt; zf += vf * dt; zr += vr * dt;
  }
  return out;
};

export const sampleHalf = (arr: HalfState[], t: number): HalfState => {
  const step = arr[1].t - arr[0].t;
  const i = Math.max(0, Math.min(arr.length - 2, Math.floor((t - arr[0].t) / step)));
  const a = arr[i], b = arr[i + 1];
  const u = Math.max(0, Math.min(1, (t - a.t) / step));
  const m = (p: number, q: number) => p + (q - p) * u;
  return {t, x: m(a.x, b.x), z: m(a.z, b.z), th: m(a.th, b.th), zf: m(a.zf, b.zf), zr: m(a.zr, b.zr), rf: m(a.rf, b.rf), rr: m(a.rr, b.rr), Ff: m(a.Ff, b.Ff), Fr: m(a.Fr, b.Fr), limF: m(a.limF, b.limF), limR: m(a.limR, b.limR)};
};
