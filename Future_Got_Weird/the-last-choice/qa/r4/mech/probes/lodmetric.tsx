import fs from 'node:fs';
import {svgOf, makeView, orbit} from './labkit';
import {combatUnit} from './mechapi';
const OUT = process.argv[2]; fs.mkdirSync(OUT, {recursive: true});
const dists = (process.argv[3] ?? '30,50,80').split(',').map(Number);
const azs = [0, 60, 120, 180];
const posts: any[] = ['idle', 'guard'];
for (const d of dists) for (const az of azs) {
  const cam = orbit({x: 0, y: 1.2, z: 0}, d, 180 + az, 6, 40);
  const v = makeView(cam);
  fs.writeFileSync(`${OUT}/bg_d${d}_a${az}.svg`, svgOf(v, [], 1.0, ''));
  for (const po of posts) for (const lod of ['full', 'mid', 'far'] as const) {
    const items = combatUnit({id: 7, t: 1.0, pos: {x: 0, y: 0, z: 0}, heading: 180, lod, posture: po, idle: 0.2} as any);
    fs.writeFileSync(`${OUT}/u_d${d}_a${az}_${po}_${lod}.svg`, svgOf(v, items, 1.0, ''));
  }
}
