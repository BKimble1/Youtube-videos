// Measures how smoothly the helmet and visor outlines change during head motion (area per frame, three views).
// Smooth motion: frame-to-frame changes stay near their median and second differences stay small; popping shows as
// isolated jumps. `mode` picks the old world-grid sampling or the V5 head-frame outline.
import {DIMS, pilotJoints, POSE0} from '../art/rig';
import {spherePatch, sphereRegion} from '../eng/draw';
import {a3, d3, frameYPR, lens, m3, n3, orbit, v3, V3} from '../eng/v3';
const area = (p: {x: number; y: number}[]) => {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
};
const B = frameYPR(v3(0, 1, 0), 0, 0, 0);
const R = DIMS.headR;
for (const mode of ['old', 'v5']) {
  for (const [az, el] of [[-40, 10], [-90, 5], [20, 15], [160, 20]]) {
    const areas: number[] = [], vis: number[] = [];
    for (let f = 0; f <= 90; f++) {
      const look = 20 + (70 * f) / 90;
      const nod = 6 + 30 * Math.sin((f / 90) * Math.PI);
      const listen = 0.5 + 0.5 * Math.sin(f / 9);
      const j = pilotJoints(B, {...POSE0, look, nod, listen, level: 0.8, upright: 0.75});
      const L = lens(orbit(a3(j.Hc, v3(0, -0.05, 0)), az, el, 1.6, 0, 40));
      const loc = (d: V3) => ({f: d3(d, j.hF), u: d3(d, j.hU)});
      const shellIn = (d: V3) => loc(d).u + 0.5 * Math.max(0, -loc(d).f) > 0.12;
      const visIn = (d: V3) => loc(d).f > 0.42 && loc(d).u < 0.36 && loc(d).u > -0.12;
      if (mode === 'old') {
        areas.push(area(spherePatch(L, j.Hc, R * 1.06, shellIn)));
        const vp = spherePatch(L, j.Hc, R, visIn);
        vis.push(vp.length > 2 ? area(vp) : 0);
      } else {
        const HD = (f: number, u: number, l: number) => n3(a3(a3(m3(j.hF, f), m3(j.hU, u)), m3(j.hL, l)));
        const rim = Array.from({length: 96}, (_, i) => {
          const ps = (i / 96) * Math.PI * 2, cp = Math.cos(ps), sp = Math.sin(ps), k = Math.max(0, -0.5 * cp);
          const th = Math.asin(0.12 / Math.sqrt(1 + k * k)) - Math.atan(k);
          return HD(Math.cos(th) * cp, Math.sin(th), Math.cos(th) * sp);
        });
        areas.push(area(sphereRegion(L, j.Hc, R * 1.06, rim, shellIn)));
        const th0 = Math.asin(-0.12), th1 = Math.asin(0.36);
        const pm = (th: number) => Math.acos(Math.min(1, 0.42 / Math.cos(th)));
        const at = (th: number, ps: number) => HD(Math.cos(th) * Math.cos(ps), Math.sin(th), Math.cos(th) * Math.sin(ps));
        const loop: V3[] = [];
        const N = 16;
        for (let i = 0; i <= N; i++) loop.push(at(th0, -pm(th0) + (2 * pm(th0) * i) / N));
        for (let i = 1; i <= N; i++) loop.push(at(th0 + ((th1 - th0) * i) / N, pm(th0 + ((th1 - th0) * i) / N)));
        for (let i = 1; i <= N; i++) loop.push(at(th1, pm(th1) - (2 * pm(th1) * i) / N));
        for (let i = 1; i < N; i++) loop.push(at(th1 - ((th1 - th0) * i) / N, -pm(th1 - ((th1 - th0) * i) / N)));
        const vp = sphereRegion(L, j.Hc, R, loop, visIn);
        vis.push(vp.length > 2 ? area(vp) : 0);
      }
    }
    const steps = (a: number[]) => a.slice(1).map((x, i) => Math.abs(x - a[i]));
    const d2 = (a: number[]) => Math.max(...a.slice(2).map((x, i) => Math.abs(x - 2 * a[i + 1] + a[i])));
    const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
    const rep = (a: number[]) => `mean ${mean(a).toFixed(0)} | max step ${(Math.max(...steps(a))).toFixed(0)} (${(100 * Math.max(...steps(a)) / mean(a)).toFixed(1)}% of mean) | max 2nd diff ${d2(a).toFixed(0)}`;
    console.log(`${mode} az${az} el${el}  helmet: ${rep(areas)}  ||  visor: ${rep(vis)}`);
  }
}
