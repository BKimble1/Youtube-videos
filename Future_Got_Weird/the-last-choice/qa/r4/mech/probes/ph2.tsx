import {solveHeavy, heavyAttach, HEAVY_DIM} from './mechapi';
import {heavy2D3} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/D3/machines';
import {PIPE, PIPE_HALF} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/D3/geo';
const HV = HEAVY_DIM as any;
type V = {x: number; y: number; z: number};
const sub = (a: V, b: V) => ({x: a.x - b.x, y: a.y - b.y, z: a.z - b.z});
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y + a.z * b.z;
const segSeg = (p1: V, q1: V, p2: V, q2: V) => {
  // closest distance between two segments
  const d1 = sub(q1, p1), d2 = sub(q2, p2), r = sub(p1, p2);
  const a = dot(d1, d1), e = dot(d2, d2), f = dot(d2, r);
  const c = dot(d1, r), b = dot(d1, d2), den = a * e - b * b;
  let s = den > 1e-9 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0;
  let t = (b * s + f) / e;
  if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); }
  const c1 = {x: p1.x + d1.x * s, y: p1.y + d1.y * s, z: p1.z + d1.z * s}, c2 = {x: p2.x + d2.x * t, y: p2.y + d2.y * t, z: p2.z + d2.z * t};
  return Math.hypot(c1.x - c2.x, c1.y - c2.y, c1.z - c2.z);
};
const LEG = ['FL', 'FR', 'RL', 'RR'];
const worst: Record<string, [number, number]> = {};
const USE = process.argv[2] === 'clear';
let prevK: any = null; let kjump = 0, kjT = 0;
for (let T = 140; T <= 149.86; T += 1 / 30) {
  const sp: any = heavy2D3(T);
  if (USE) sp.clear = PIPE.map((s) => ({a: s.a, b: s.b, r: PIPE_HALF}));
  const r = solveHeavy({...sp, t: T});
  if (prevK) r.knee.forEach((k, i) => { const j = Math.hypot(k.x - prevK[i].x, k.y - prevK[i].y, k.z - prevK[i].z); if (j > kjump) { kjump = j; kjT = T; } });
  prevK = r.knee;
  r.hip.forEach((H, i) => {
    for (const [name, a, b] of [['thigh', H, r.knee[i]], ['shin', r.knee[i], r.foot[i]]] as [string, V, V][]) {
      for (const s of PIPE) {
        const d = segSeg(a, b, s.a, s.b) - (PIPE_HALF + (name === 'thigh' ? 0.4 : 0.3)); // bone radius ~0.3-0.4
        const k = `${LEG[i]} ${name}`;
        if (!worst[k] || d < worst[k][0]) worst[k] = [d, T];
      }
    }
  });
}
for (const [k, [d, T]] of Object.entries(worst)) console.log(k, 'min clearance to pipe (centre of bone to pipe surface minus bone radius):', d.toFixed(2), 'at', T.toFixed(2));

console.log('max knee jump per frame', kjump.toFixed(2), 'at', kjT.toFixed(2));
