// V6 QC (copy of helmetFilm.ts on the V6 shot list): the helmet shell and visor outline areas, normalised by the head's projected size, for every frame of the
// film in which the rider is seen; reports the largest frame-to-frame changes within a shot (pops show as isolated
// jumps). usage: esbuild source/src/dev/helmetFilm.ts --bundle --platform=node ... && node out.cjs
import {FRAMES} from '../v10/time10';
import {DIMS, pilotJoints} from '../art/rig';
import {sphereRegion} from '../eng/draw';
import {a3, d3, m3, n3, s3, V3} from '../eng/v3';
import {CUTS12, riderView12} from '../v12/shots12';
const area = (p: {x: number; y: number}[]) => {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
};
const cutF = new Set(CUTS12.map((c) => {
  let f = Math.round(c * 30);
  if (f / 30 < c) f++;
  return f;
}));
const R = DIMS.headR;
const rows: {f: number; shell: number; visor: number}[] = [];
for (let f = 0; f < FRAMES; f++) {
  const v = riderView12(f / 30);
  if (!v) continue;
  const j = pilotJoints(v.st.B, v.st.pose);
  if (d3(s3(j.Hc, v.L.pos), v.L.f) < 0.2) continue;
  const L = v.L;
  const loc = (d: V3) => ({f: d3(d, j.hF), u: d3(d, j.hU)});
  const HD = (fw: number, u: number, l: number) => n3(a3(a3(m3(j.hF, fw), m3(j.hU, u)), m3(j.hL, l)));
  const shellIn = (d: V3) => loc(d).u + 0.5 * Math.max(0, -loc(d).f) > 0.12;
  const visIn = (d: V3) => loc(d).f > 0.42 && loc(d).u < 0.36 && loc(d).u > -0.12;
  const rim = Array.from({length: 96}, (_, i) => {
    const ps = (i / 96) * Math.PI * 2, cp = Math.cos(ps), sp = Math.sin(ps), k = Math.max(0, -0.5 * cp);
    const th = Math.asin(0.12 / Math.sqrt(1 + k * k)) - Math.atan(k);
    return HD(Math.cos(th) * cp, Math.sin(th), Math.cos(th) * sp);
  });
  const vl: V3[] = [];
  {
    const th0 = Math.asin(-0.12), th1 = Math.asin(0.36);
    const pm = (th: number) => Math.acos(Math.min(1, 0.42 / Math.cos(th)));
    const at = (th: number, ps: number) => HD(Math.cos(th) * Math.cos(ps), Math.sin(th), Math.cos(th) * Math.sin(ps));
    const N = 16;
    for (let i = 0; i <= N; i++) vl.push(at(th0, -pm(th0) + (2 * pm(th0) * i) / N));
    for (let i = 1; i <= N; i++) vl.push(at(th0 + ((th1 - th0) * i) / N, pm(th0 + ((th1 - th0) * i) / N)));
    for (let i = 1; i <= N; i++) vl.push(at(th1, pm(th1) - (2 * pm(th1) * i) / N));
    for (let i = 1; i < N; i++) vl.push(at(th1 - ((th1 - th0) * i) / N, -pm(th1 - ((th1 - th0) * i) / N)));
  }
  const k = L.p(j.Hc).k;
  const norm = Math.PI * (R * k) ** 2;
  const sp = sphereRegion(L, j.Hc, R * 1.06, rim, shellIn);
  const vp = sphereRegion(L, j.Hc, R, vl, visIn);
  rows.push({f, shell: area(sp) / norm, visor: vp.length > 2 ? area(vp) / norm : 0});
}
const steps: {f: number; ds: number; dv: number}[] = [];
for (let i = 1; i < rows.length; i++) {
  if (rows[i].f !== rows[i - 1].f + 1 || cutF.has(rows[i].f)) continue;
  steps.push({f: rows[i].f, ds: Math.abs(rows[i].shell - rows[i - 1].shell), dv: Math.abs(rows[i].visor - rows[i - 1].visor)});
}
const med = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
console.log('frames measured', rows.length, 'steps', steps.length);
console.log('median step (fraction of head disc): shell', med(steps.map((s) => s.ds)).toFixed(4), 'visor', med(steps.map((s) => s.dv)).toFixed(4));
console.log('largest shell steps', JSON.stringify([...steps].sort((a, b) => b.ds - a.ds).slice(0, 6).map((s) => ({t: (s.f / 30).toFixed(2), d: s.ds.toFixed(4)}))));
console.log('largest visor steps', JSON.stringify([...steps].sort((a, b) => b.dv - a.dv).slice(0, 6).map((s) => ({t: (s.f / 30).toFixed(2), d: s.dv.toFixed(4)}))));
// a pop is a step much larger than both of its neighbours; a smooth turn has neighbours of similar size
const iso = steps
  .map((s, i) => ({s, n: Math.max(steps[i - 1]?.f === s.f - 1 ? steps[i - 1].ds : 0, steps[i + 1]?.f === s.f + 1 ? steps[i + 1].ds : 0)}))
  .filter((x) => x.s.ds > 0.004)
  .map((x) => ({t: (x.s.f / 30).toFixed(2), d: x.s.ds.toFixed(4), ratio: (x.s.ds / Math.max(1e-5, x.n)).toFixed(1)}))
  .sort((a, b) => +b.ratio - +a.ratio);
console.log('most isolated shell steps above 0.4% (step / larger neighbour)', JSON.stringify(iso.slice(0, 6)));
