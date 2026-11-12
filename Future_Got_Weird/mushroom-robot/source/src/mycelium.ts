// One mycelium network, generated once from a fixed seed, in scaffold-disc coordinates (cm; the disc has radius
// DISC_R and sits on top of the robot's hub). The same data is drawn in the robot shots (projected onto the disc) and
// in the macro shots, so topology and scale never change between views.
import {mulberry, clamp} from './lib';
import {DISC_R} from './robot';
import {EVENTS_EXT} from './timing';

export type P2 = [number, number];
export type Hypha = {pts: P2[]; w: number; tier: 0 | 1 | 2; tipFrom: number}; // tipFrom: index where the growing tip starts
/** electrodes embedded in the scaffold (disc coords, cm) */
export const ELECTRODES: P2[] = [[0.55, 0.62], [-0.72, 0.38]];
const R = DISC_R * 0.97;

const gen = () => {
  const rnd = mulberry(20240828);
  const out: Hypha[] = [];
  const inside = (p: P2) => Math.hypot(p[0], p[1]) < R;
  // tier 0: cords (bundled hyphae) from three inoculation points
  const grow = (start: P2, dir: number, step: number, n: number, turn: number, tier: 0 | 1 | 2, w: number,
    branchP: number, depth: number) => {
    const pts: P2[] = [start];
    let a = dir, p = start;
    for (let i = 0; i < n; i++) {
      a += (rnd() - 0.5) * turn;
      // electrodes attract nearby hyphae a little (they grow around and over them)
      for (const e of ELECTRODES) {
        const dx = e[0] - p[0], dy = e[1] - p[1], d = Math.hypot(dx, dy);
        if (d < 0.25 && d > 0.06) {
          const ta = Math.atan2(dy, dx);
          let da = ta - a; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
          a += da * 0.05;
        }
      }
      const q: P2 = [p[0] + Math.cos(a) * step, p[1] + Math.sin(a) * step];
      if (!inside(q)) break;
      pts.push(q); p = q;
      if (depth > 0 && rnd() < branchP && i > 2) {
        const side = rnd() < 0.5 ? -1 : 1;
        const childTier = (tier === 0 ? (rnd() < 0.35 ? 0 : 1) : 2) as 0 | 1 | 2;
        const cw = childTier === 0 ? w * 0.8 : childTier === 1 ? 1.4 : 0.8;
        grow(q, a + side * (0.5 + rnd() * 0.6), step * (childTier === 2 ? 0.7 : 1),
          Math.floor(n * (childTier === 2 ? 0.25 : 0.55) * (0.6 + rnd() * 0.6)), turn * (childTier === 2 ? 1.6 : 1.1),
          childTier, cw, childTier === 2 ? 0.05 : branchP * 0.85, depth - 1);
      }
    }
    if (pts.length > 1) out.push({pts, w, tier, tipFrom: Math.max(1, Math.floor(pts.length * 0.86))});
  };
  const seeds: P2[] = [[-0.15, -0.35], [0.4, 0.05], [-0.5, 0.15]];
  for (const s of seeds) {
    const k = 7;
    for (let j = 0; j < k; j++) {
      const a = (j / k) * Math.PI * 2 + rnd() * 0.6;
      grow(s, a, 0.028, 70, 0.32, 0, 2.6, 0.13, 4);
    }
  }
  return out;
};
export const NET: Hypha[] = gen();
export const NET_STATS = {hyphae: NET.length, points: NET.reduce((a, h) => a + h.pts.length, 0)};

/** growth (time-lapse) of the youngest tips, in the macro shot only: 0 = tips not yet grown, 1 = full network.
 * The growing part is the last 14% of each hypha: at robot scale these are sub-millimetre and identical. */
export const tipGrowth = (t: number) => clamp((t - 2.5) / 3.6);

// ------------------------------------------------------------------------------------------------ spike propagation
/** each detected spike is drawn as a wave of activity that sweeps through the network and reaches an electrode at
 * the spike time (illustrative: the real fungal spikes are much slower; see SCIENCE_NOTES.md) */
export const WAVE_V = 5.5; // cm/s along the drawing
const origins = EVENTS_EXT.map((e, k) => {
  const rnd = mulberry(1000 + Math.round(e.spike * 100));
  const feat = e.kind === 'featured';
  const el = feat ? ELECTRODES[0] : ELECTRODES[k % 2];
  const a = feat ? -2.1 : rnd() * Math.PI * 2, r = feat ? 1.25 : 0.9 + rnd() * 0.5;
  let o: P2 = [el[0] + Math.cos(a) * r, el[1] + Math.sin(a) * r];
  const d = Math.hypot(o[0], o[1]);
  if (d > R * 0.9) o = [o[0] * (R * 0.9) / d, o[1] * (R * 0.9) / d];
  const dist = Math.hypot(o[0] - el[0], o[1] - el[1]);
  return {o, el, t0: e.spike - dist / WAVE_V, amp: e.amp, spike: e.spike};
});
// the featured spike (7.83 s) arrives at electrode 0 from the far side, so the macro shot can follow it
export const waves = (t: number) => origins.filter((w) => t > w.t0 - 0.05 && t < w.spike + 0.45);
/** glow (0..1+) at a disc point, at time t */
export const glowAt = (p: P2, t: number) => {
  let g = 0;
  for (const w of waves(t)) {
    const r = (t - w.t0) * WAVE_V;
    const d = Math.hypot(p[0] - w.o[0], p[1] - w.o[1]);
    const band = d - r;
    g += w.amp * Math.exp(-(band * band) / 0.012) * (d < Math.hypot(w.el[0] - w.o[0], w.el[1] - w.o[1]) + 0.25 ? 1 : 0.25);
  }
  return g;
};
/** electrode flash: when a wave reaches an electrode */
export const electrodeFlash = (t: number, idx: number) => {
  let g = 0;
  for (const w of origins) {
    if (w.el !== ELECTRODES[idx]) continue;
    const dt = t - w.spike;
    if (dt > -0.03 && dt < 0.5) g += w.amp * Math.exp(-dt * 9) * (dt < 0 ? 0.4 : 1);
  }
  return g;
};
