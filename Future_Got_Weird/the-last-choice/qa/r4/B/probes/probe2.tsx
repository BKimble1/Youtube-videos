// per-frame joint audit of the Director in B2: heights over ground, clearance under the slab, foot/hand speeds
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {makeView} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {figureRig} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/rig';
import {groundH} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/ground';
import {dirB} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/director';
import {dirSpec} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/kit';
import {CAM_B2} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/cams';
import {slabPoint} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/rubble';
const T0 = Number(process.env.T0 ?? 12.4), T1 = Number(process.env.T1 ?? 16.8), ST = Number(process.env.ST ?? 2);
const OUT: [number, number][] = [[0, 0.06], [0.3, 0], [0.45, 0.3], [0.62, 0.45], [0.86, 0.46], [1.1, 0.52], [1.17, 0.86], [1.2, 1.25], [1.12, 1.62], [1.2, 2.02], [1.16, 2.45], [0.62, 2.4], [0.06, 2.45], [0, 1.6], [0.05, 0.9]];
const inPoly = (P: [number, number][], u: number, v: number) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [ui, vi] = P[i], [uj, vj] = P[j]; if (vi > v !== vj > v && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui) c = !c; } return c; };
const underY = (x: number, z: number, T: number): number | null => {
  const u = x + 0.3, v = 2.62 - z;
  if (!inPoly(OUT, u, v)) return null;
  const a = slabPoint(0, 0, T), b = slabPoint(1, 0, T), c = slabPoint(0, 1, T);
  // plane through a,b,c: y = a.y + p*(x-a.x) + q*(z-a.z)
  const bx = b.x - a.x, by = b.y - a.y, bz = b.z - a.z, cx = c.x - a.x, cy = c.y - a.y, cz = c.z - a.z;
  const det = bx * cz - bz * cx;
  const p = (by * cz - bz * cy) / det, q = (bx * cy - by * cx) / det;
  return a.y + p * (x - a.x) + q * (z - a.z);
};
const fmt = (n: number) => n.toFixed(2).padStart(5);
let prev: any = null;
console.log('T      | pel h clr | head h clr | ankL h v | ankR h v | wrL h v | wrR h v | kL h | kR h | armL armR legL legR reach | errs hL hR fL fR | minClr');
for (let T = T0; T <= T1 + 1e-6; T += ST / 30) {
  const view = makeView(camPath(CAM_B2, T - 12.4, 0.6));
  const R = figureRig(view, dirSpec(T));
  const r = R.rig, W = R.W;
  const pts: Record<string, any> = {pel: W(r.P), head: W(r.headC), chest: R.chest, ankL: W(r.ankle[0]), ankR: W(r.ankle[1]), wrL: W(r.wr[0]), wrR: W(r.wr[1]), kL: W(r.knee[0]), kR: W(r.knee[1]), elL: W(r.el[0]), elR: W(r.el[1]), shL: W(r.sh[0]), shR: W(r.sh[1])};
  const h = (k: string) => pts[k].y - groundH(pts[k].x, pts[k].z);
  const clr = (k: string) => { const y = underY(pts[k].x, pts[k].z, T); return y === null ? NaN : y - pts[k].y; };
  const dt = ST / 30;
  const sp = (k: string) => (prev ? Math.hypot(pts[k].x - prev[k].x, pts[k].z - prev[k].z, pts[k].y - prev[k].y) / dt : 0);
  // min clearance of the body points under the slab
  const aTop = (k: string) => { const y = underY(pts[k].x, pts[k].z, T); return y === null ? NaN : y - (pts[k].y + 0.1); };
  const cl = [...['pel', 'head', 'chest', 'shL', 'shR', 'elL', 'elR', 'kL', 'kR'].map((k) => clr(k) - 0.1), aTop('ankL'), aTop('ankR')].filter((x) => !isNaN(x));
  const minC = cl.length ? Math.min(...cl) : NaN;
  const d3 = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const ra = (i: number) => (d3(W(r.sh[i]), W(r.wr[i])) / (162 / 251.4)).toFixed(2);
  const rl = (i: number) => (d3(W(r.hip[i]), W(r.ankle[i])) / (155 / 251.4)).toFixed(2);
  console.log(T.toFixed(2).padStart(5), '|', fmt(h('pel')), fmt(clr('pel')), '|', fmt(h('head')), fmt(clr('head')), '|', fmt(h('ankL')), fmt(sp('ankL')), '|', fmt(h('ankR')), fmt(sp('ankR')), '|', fmt(h('wrL')), fmt(sp('wrL')), '|', fmt(h('wrR')), fmt(sp('wrR')), '|', fmt(h('kL')), '|', fmt(h('kR')), '|', ra(0), ra(1), rl(0), rl(1), '|', (() => { const w = dirB(T).world as any; const e = (a: any, b: any) => (a && b ? d3(a, b).toFixed(2) : ' -- '); return [e(w.handL, W(r.wr[0])), e(w.handR, W(r.wr[1])), e(w.footL, W(r.ankle[0])), e(w.footR, W(r.ankle[1]))].join(' '); })(), '|', fmt(minC));
  prev = pts;
}
