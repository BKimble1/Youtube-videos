import {chips3} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/fx';
import {groundH} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/ground';
import * as fs from 'node:fs';
const opts: any[] = JSON.parse(fs.readFileSync('chipopts.json', 'utf8'));
const rows: any[] = [];
for (const o of opts) {
  const life = o.life ?? 3.5;
  const t = o.t0 + Math.min(life, 2.8);
  const o2 = /^a1e[23]_deb$/.test(o.key) ? {...o, ground: undefined} : o;
  const items = chips3({...o2, t}) as any[];
  const size = o.size ?? [0.05, 0.16];
  const off = o2.ground !== undefined && o2.ground !== 0 ? o2.ground - groundH(o.at.x, o.at.z) : 0;
  let worst = 0, n = 0, inAir = 0;
  for (const it of items) {
    const h = it.pos.y - groundH(it.pos.x, it.pos.z);
    // a landed chip rests at off + 0.3 sz (sz in [size0, size1]); an airborne one is higher
    const lo = off - 0.02, hi = off + 0.3 * size[1] + 0.02;
    const r = h < lo ? lo - h : h > hi ? h - hi : 0;
    if (r > worst) worst = r;
    if (h > hi + 0.5) inAir++;
    n++;
  }
  rows.push({key: o.key, shot: o.shot, n, worst, inAir, ground: o.ground, hasGround: o.ground !== undefined});
}
rows.sort((a, b) => b.worst - a.worst);
console.log('emitters', rows.length, 'with residual > 0.15 m:', rows.filter((r) => r.worst > 0.15).length, ' > 0.5 m:', rows.filter((r) => r.worst > 0.5).length);
rows.filter((r) => r.worst > 0.15).slice(0, 25).forEach((r) => console.log(r.key.padEnd(24), r.shot.padEnd(10), 'n', r.n, 'residual', r.worst.toFixed(2), 'airborne', r.inAir, 'ground', r.ground));
