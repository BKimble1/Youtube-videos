import {combatUnit} from './mechapi';
import {xfPoint} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
import {PERSIST} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/persist';
const p = PERSIST.find((q) => q.key === 'd1_u2')!;
const sp: any = {...(p as any).spec(200), t: 200, lod: 'full'}; const g = sp.ground;
console.log('fall', JSON.stringify(sp.fall), 'dmg', Object.keys(sp.damage ?? {}).join(','));
for (const it of combatUnit(sp)) { if (it.kind !== 'mesh') continue; let lo = 1e9; for (const v of it.mesh.verts) { let q = it.xf ? xfPoint(v, it.xf) : v; if (it.fn) q = it.fn(q, -1); lo = Math.min(lo, q.y - g(q.x, q.z)); } if (lo < -0.02) console.log((it as any).key, lo.toFixed(2)); }
