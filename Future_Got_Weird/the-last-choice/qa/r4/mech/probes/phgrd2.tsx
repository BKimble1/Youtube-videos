import {heavy} from './mechapi';
import {xfPoint} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
const g = () => 0;
for (const limp of [false, true]) {
  console.log('limp', limp);
  for (const leg of [0, 1, 2, 3] as const) {
    const items = heavy({id: 4, t: 8, pos: {x: 0, y: 0, z: 0}, heading: 30, ground: g, kneeBreak: {t0: 3, leg, dir: {x: 1, y: 0, z: 0.3}, limp}} as any);
    const per: string[] = [];
    for (const it of items) { if (it.kind !== 'mesh') continue; let lo = 1e9; for (const p of it.mesh.verts) { let q = it.xf ? xfPoint(p, it.xf) : p; if (it.fn) q = it.fn(q, -1); lo = Math.min(lo, q.y); } if (lo < -0.05) per.push(`${(it as any).key.replace('h4_', '')}:${lo.toFixed(2)}`); }
    console.log(' broken leg', leg, per.join(' '));
  }
}
