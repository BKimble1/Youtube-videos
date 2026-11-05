// The living culture on the CL1's microelectrode array (MEA), in micrometres, origin at the array centre.
//
// The array: an 8 x 8 grid of 30 um electrodes at a 200 um pitch, the four corners absent (60 sites; channel 4 is not
// used, so 59 are live), each with a gold lead to the chip's edge. The channel numbers and electrode groups follow the
// public DOOM demo code (SeanCole02/doom-neuron, ppo_doom.py): forward 41/42/49, turn left 29/30/31/37, turn right
// 59-62, attack 32/33/34. Mapping the channel index to a physical row and column (row = c div 8, col = c mod 8) is our
// assumption; the pitch and diameter are generic MEA values, not CL1 specifications.
//
// The neurons: human cortical-type neurons (soma 12-18 um) with branching dendrites and one long axon, laid out in
// 80 um tiles, deterministic. Activity is spikes: rare spontaneous firing, responses to stimulation near the
// stimulated electrodes, scripted response volleys in the decoder's electrode groups, and network bursts. Activity is
// slowed for visibility (real spikes last about a millisecond).
import {hash} from '../lib';

export const PITCH = 200, ER = 15; // electrode pitch and radius (um)
export type Electrode = {c: number; row: number; col: number; x: number; y: number; lead: [number, number][]; live: boolean};
const ABSENT = new Set([0, 7, 56, 63]);
export const GROUPS = {
  move: [41, 42, 49],
  turn: [29, 30, 31, 37],
  turnR: [59, 60, 61, 62],
  fire: [32, 33, 34],
  // the encoding (stimulation) electrodes: the demo uses nine; which nine is our illustrative choice
  enc: [11, 12, 18, 19, 20, 21, 26, 27, 28],
};
export type GroupName = keyof typeof GROUPS;
export const groupOf = (c: number): GroupName | null => {
  for (const k of Object.keys(GROUPS) as GroupName[]) if (GROUPS[k].includes(c)) return k;
  return null;
};

/** lead route: from the electrode a short jog into the gap between rows (a lane per column), then straight out to the
 *  array's left or right edge, then on to the chip edge (fan-out). */
const leadOf = (row: number, col: number): [number, number][] => {
  const x = (col - 3.5) * PITCH, y = (row - 3.5) * PITCH;
  const left = col < 4;
  const up = row < 4;
  const lane = left ? col : 7 - col; // 0 = the outer column: it takes the lane nearest its own row, so no lead crosses
  const gy = y + (up ? -1 : 1) * (39 + lane * 13);
  const sx = left ? -1 : 1;
  const ex = sx * (4 * PITCH + 40);
  // the fan-out to the carrier's contact pads (about 10 mm out), ordered like the lanes, so the fan never crosses
  return [[x, y], [x, gy], [ex, gy], [ex + sx * 900, gy * 1.8], [sx * 10400, gy * 13], [sx * 11200, gy * 13]];
};
export const ELECTRODES: Electrode[] = [];
for (let c = 0; c < 64; c++) {
  if (ABSENT.has(c)) continue;
  const row = Math.floor(c / 8), col = c % 8;
  ELECTRODES.push({c, row, col, x: (col - 3.5) * PITCH, y: (row - 3.5) * PITCH, lead: leadOf(row, col), live: c !== 4});
}
export const electrode = (c: number) => ELECTRODES.find((e) => e.c === c)!;

// ------------------------------------------------------------------ neurons
export type Neurite = {d: string; w: number};
export type Neuron = {
  id: number; x: number; y: number; r: number;
  soma: string; nucleus: [number, number, number];
  dend: Neurite[]; axon: [number, number][]; axCum: number[]; axD: string;
  tone: number; // 0..1 colour variation
};
const R = (id: number, k: number) => hash(id * 13.17 + k * 7.31);
const smooth = (p: [number, number][]) => {
  if (p.length < 3) return `M${p.map((q) => q.map((v) => v.toFixed(1)).join(' ')).join(' L')}`;
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
    d += ` Q${p[i][0].toFixed(1)} ${p[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const L = p[p.length - 1];
  return d + ` L${L[0].toFixed(1)} ${L[1].toFixed(1)}`;
};
const walk = (id: number, k: number, x: number, y: number, a: number, n: number, step: number, wig: number): [number, number][] => {
  const p: [number, number][] = [[x, y]];
  for (let i = 0; i < n; i++) {
    a += (R(id, k * 50 + i) - 0.5) * 2 * wig;
    x += Math.cos(a) * step; y += Math.sin(a) * step;
    p.push([x, y]);
  }
  return p;
};
const TILE = 80, SPAN = 1040;
export const NEURONS: Neuron[] = [];
{
  let id = 1;
  for (let ty = -SPAN; ty < SPAN; ty += TILE)
    for (let tx = -SPAN; tx < SPAN; tx += TILE) {
      const tid = Math.round((ty + SPAN) / TILE) * 100 + Math.round((tx + SPAN) / TILE);
      const n = 2 + (hash(tid * 3.3) < 0.45 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const nid = id++;
        const x = tx + 8 + R(nid, 1) * (TILE - 16), y = ty + 8 + R(nid, 2) * (TILE - 16);
        const r = 6 + R(nid, 3) * 3;
        // soma: an irregular blob, sometimes pyramidal
        const pyr = R(nid, 4) < 0.45;
        const rot = R(nid, 5) * Math.PI * 2;
        const pts: [number, number][] = [];
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          let rr = r * (0.86 + R(nid, 10 + i) * 0.26);
          if (pyr) rr *= 1 + 0.38 * Math.max(0, Math.cos(a - rot)) ** 3 - 0.12 * Math.max(0, Math.cos(a - rot - Math.PI));
          pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.92]);
        }
        let soma = '';
        for (let i = 0; i < 12; i++) {
          const p = pts[i], q = pts[(i + 1) % 12];
          const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
          soma += (i === 0 ? `M${m[0].toFixed(2)} ${m[1].toFixed(2)}` : '') + ` Q${q[0].toFixed(2)} ${q[1].toFixed(2)} ${((q[0] + pts[(i + 2) % 12][0]) / 2).toFixed(2)} ${((q[1] + pts[(i + 2) % 12][1]) / 2).toFixed(2)}`;
        }
        soma += ' Z';
        // dendrites (tapered: drawn in three widths), one or two branch
        const dend: Neurite[] = [];
        const nd = 3 + Math.floor(R(nid, 6) * 3);
        for (let j = 0; j < nd; j++) {
          const a = rot + (j / nd) * Math.PI * 2 + (R(nid, 20 + j) - 0.5) * 0.9 + (pyr && j === 0 ? 0 : 0.4);
          const len = (pyr && j === 0 ? 70 : 28) + R(nid, 30 + j) * 42;
          const steps = Math.max(4, Math.round(len / 6));
          const p = walk(nid, 40 + j, x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85, a, steps, len / steps, 0.28);
          const third = Math.ceil(steps / 3);
          dend.push({d: smooth(p.slice(0, third + 1)), w: 2.9});
          dend.push({d: smooth(p.slice(third, 2 * third + 1)), w: 2.0});
          dend.push({d: smooth(p.slice(2 * third)), w: 1.1});
          if (R(nid, 60 + j) < 0.6) {
            const b = p[third + 1] ?? p[p.length - 1];
            const bb = walk(nid, 70 + j, b[0], b[1], a + (R(nid, 80 + j) < 0.5 ? -0.7 : 0.7), Math.max(3, steps - third), 5.5, 0.3);
            dend.push({d: smooth(bb), w: 1.15});
          }
        }
        // the axon: long and smooth, leaving opposite the apical dendrite
        const aa = rot + Math.PI + (R(nid, 90) - 0.5) * 0.8;
        const alen = 130 + R(nid, 91) * 170;
        const ast = Math.round(alen / 8);
        const axon = walk(nid, 92, x + Math.cos(aa) * r, y + Math.sin(aa) * r, aa, ast, alen / ast, 0.13);
        const axCum = [0];
        for (let i = 1; i < axon.length; i++) axCum.push(axCum[i - 1] + Math.hypot(axon[i][0] - axon[i - 1][0], axon[i][1] - axon[i - 1][1]));
        const nr = r * (0.42 + R(nid, 7) * 0.1);
        NEURONS.push({id: nid, x, y, r, soma, nucleus: [x + Math.cos(rot) * r * 0.12, y + Math.sin(rot) * r * 0.1, nr], dend, axon, axCum, axD: smooth(axon), tone: R(nid, 8)});
      }
    }
}
/** neurons whose soma is within d of (x, y) */
export const near = (x: number, y: number, d: number) => NEURONS.filter((n) => Math.hypot(n.x - x, n.y - y) < d);
const NEAR_E = new Map<number, Neuron[]>();
export const nearElectrode = (c: number) => {
  if (!NEAR_E.has(c)) {
    const e = electrode(c);
    NEAR_E.set(c, near(e.x, e.y, 62));
  }
  return NEAR_E.get(c)!;
};

// ------------------------------------------------------------------ activity
export type Stim = {t: number; cs: number[]; pulses?: number};
export type Resp = {t: number; cs: number[]; spread?: number; p?: number};
export type Burst = {t: number; x: number; y: number; speed: number; radius: number; p?: number};
export const ACT = {stims: [] as Stim[], resps: [] as Resp[], bursts: [] as Burst[]};
export const setActivity = (a: typeof ACT) => {
  ACT.stims = a.stims; ACT.resps = a.resps; ACT.bursts = a.bursts;
};
const RATE = 0.075; // spontaneous spikes per second per neuron (shown)
/** the spike times of neuron n in [t0, t1] */
export const spikes = (n: Neuron, t0: number, t1: number): number[] => {
  const out: number[] = [];
  for (let b = Math.floor(t0); b <= Math.floor(t1); b++) {
    if (hash(n.id * 0.731 + b * 19.13) < RATE) {
      const ts = b + hash(n.id * 1.37 + b * 3.71);
      if (ts >= t0 && ts <= t1) out.push(ts);
    }
  }
  ACT.stims.forEach((s, si) => {
    if (s.t > t1 || s.t < t0 - 0.8) return;
    let best = 1e9;
    for (const c of s.cs) {
      const e = electrode(c);
      best = Math.min(best, Math.hypot(n.x - e.x, n.y - e.y));
    }
    if (best < 135 && hash(n.id * 2.11 + si * 5.3) < 0.88 * (1 - best / 135) + 0.12) {
      const ts = s.t + 0.03 + best / 950;
      if (ts >= t0 && ts <= t1) out.push(ts);
    }
  });
  ACT.resps.forEach((r, ri) => {
    if (r.t > t1 || r.t < t0 - 1) return;
    let best = 1e9;
    for (const c of r.cs) {
      const e = electrode(c);
      best = Math.min(best, Math.hypot(n.x - e.x, n.y - e.y));
    }
    const p = (r.p ?? 0.92) * Math.max(0, 1 - best / 120);
    if (hash(n.id * 3.07 + ri * 11.9) < p) {
      const ts = r.t + hash(n.id * 4.1 + ri) * (r.spread ?? 0.16);
      if (ts >= t0 && ts <= t1) out.push(ts);
      if (hash(n.id * 5.3 + ri) < 0.5 && ts + 0.11 <= t1 && ts + 0.11 >= t0) out.push(ts + 0.11);
    }
  });
  ACT.bursts.forEach((b, bi) => {
    const d = Math.hypot(n.x - b.x, n.y - b.y);
    if (d > b.radius) return;
    if (hash(n.id * 6.7 + bi * 2.9) > (b.p ?? 0.75)) return;
    const ts = b.t + d / b.speed + hash(n.id * 7.9 + bi) * 0.08;
    if (ts >= t0 && ts <= t1) out.push(ts);
  });
  return out;
};
/** soma brightness of a spike at age a (s) */
export const spikeGlow = (a: number) => (a < 0 ? 0 : a < 0.025 ? a / 0.025 : Math.exp(-(a - 0.025) / 0.13));
/** the latest spike age of neuron n at t (or Infinity) */
export const lastSpikeAge = (n: Neuron, t: number, win = 0.9) => {
  const s = spikes(n, t - win, t);
  return s.length ? t - Math.max(...s) : Infinity;
};
/** recorded signal on electrode c at t (0..~2): the spikes of the neurons over and around it */
export const recorded = (c: number, t: number) => {
  let v = 0;
  for (const n of nearElectrode(c)) for (const s of spikes(n, t - 0.5, t)) v += Math.exp(-(t - s) / 0.09) * (1 - Math.hypot(n.x - electrode(c).x, n.y - electrode(c).y) / 70);
  return v;
};
/** stimulation on electrode c at t: 0..1 (biphasic pulse trains, shown as a brief glow per pulse) */
export const stimOn = (c: number, t: number) => {
  let v = 0;
  for (const s of ACT.stims) {
    if (!s.cs.includes(c)) continue;
    for (let k = 0; k < (s.pulses ?? 1); k++) {
      const a = t - (s.t + k * 0.09);
      if (a >= 0 && a < 0.3) v = Math.max(v, Math.exp(-a / 0.08));
    }
  }
  return v;
};
