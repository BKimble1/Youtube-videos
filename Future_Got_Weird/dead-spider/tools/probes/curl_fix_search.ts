// search per-leg-type curl corrections for segments 3..5 so no point of the leg enters the prosoma or abdomen
import {PRO, ABD, LEG_R} from '../../source/src/spider';
const LEG_LEN = [11.2, 10.1, 9.5, 12.6], FRAC = [0.09, 0.27, 0.12, 0.21, 0.2, 0.11];
const ATTACH = [32, 62, 98, 134], DIR_OPEN = [36, 74, 110, 150], DIR_CURL = [52, 82, 102, 128];
const TH_OPEN = [[6, 44, -16, -40, -60, -72],[6, 42, -18, -42, -62, -72],[6, 40, -20, -44, -62, -70],[6, 40, -14, -36, -56, -68]];
const TH_CURL = [[-4, 74, -62, -136, -204, -238],[-4, 72, -66, -140, -206, -236],[-4, 70, -66, -140, -204, -234],[-4, 68, -58, -130, -196, -228]];
const SWEEP = [[0, 0, -6, -12, -17, -20],[0, 0, -3, -6, -9, -10],[0, 0, 4, 8, 11, 12],[0, 0, 6, 11, 15, 18]];
const JIT = [0.6, -1.2, 0.9, -0.4, -0.8, 1.1, -0.5, 0.7];
const leg = (i: number, e: number, corr: number[]) => {
  const s = i < 4 ? 1 : -1, n = i % 4;
  const a = (ATTACH[n] * Math.PI) / 180;
  const A = [PRO.a * 0.8 * Math.cos(a), s * PRO.b * 0.8 * Math.sin(a), -0.42];
  const dirDeg = DIR_CURL[n] + (DIR_OPEN[n] - DIR_CURL[n]) * e + JIT[i] * 1.5;
  const pts = [A]; let p = A;
  for (let k = 0; k < 6; k++) {
    const d = ((dirDeg + SWEEP[n][k] * (0.35 + 0.65 * e)) * Math.PI) / 180;
    const th = TH_CURL[n][k] + corr[k] + (TH_OPEN[n][k] - TH_CURL[n][k] - corr[k]) * e + (k > 0 ? JIT[(i + k) % 8] : 0);
    const t = (th * Math.PI) / 180, seg = LEG_LEN[n] * FRAC[k];
    p = [p[0] + Math.cos(d) * seg * Math.cos(t), p[1] + s * Math.sin(d) * seg * Math.cos(t), p[2] + seg * Math.sin(t)];
    pts.push(p);
  }
  return pts;
};
const pen = (q: number[], r: number) => Math.max(1 - Math.hypot(q[0] / (PRO.a + r), q[1] / (PRO.b + r), q[2] / (PRO.c + r)), 1 - Math.hypot((q[0] - ABD.x) / (ABD.a + r), q[1] / (ABD.b + r), (q[2] - ABD.z) / (ABD.c + r)));
const bad = (i: number, corr: number[]) => {
  let worst = -1;
  for (let e = 0; e <= 1.0001; e += 0.05) { const L = leg(i, e, corr);
    for (let k = 2; k < 6; k++) for (const u of [0, 0.25, 0.5, 0.75, 1]) { const q = L[k].map((v, j) => v + (L[k + 1][j] - v) * u); const r = LEG_R[k] + (LEG_R[k + 1] - LEG_R[k]) * u; worst = Math.max(worst, pen(q, r)); } }
  return worst;
};
for (let n = 0; n < 4; n++) {
  let best: any = null;
  for (let c3 = 0; c3 <= 50; c3 += 5) for (let c4 = 0; c4 <= 70; c4 += 5) for (let c5 = 0; c5 <= 80; c5 += 5) for (let c2 = -10; c2 <= 10; c2 += 5) {
    const corr = [0, 0, c2, c3, c4, c5];
    const w = Math.max(bad(n, corr), bad(n + 4, corr));
    if (w <= 0) { const cost = Math.abs(c2) + c3 + c4 + c5; if (!best || cost < best.cost) best = {corr, cost, w}; }
  }
  console.log('leg type', n, 'orig worst', Math.max(bad(n, [0,0,0,0,0,0]), bad(n+4, [0,0,0,0,0,0])).toFixed(3), JSON.stringify(best));
}
