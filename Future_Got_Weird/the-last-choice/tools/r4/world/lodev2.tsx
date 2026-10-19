import {CITY, lodFor} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/city';
import {STREET_OBSTACLES} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/plan';
import {lodWindowAt, envelopeDist} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/lodwin';
import {camPath} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/film/stage';
import {AERIAL} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world';
import {M} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/timing';
import * as fs from 'node:fs';
const A1K = [{t: 0, pos: AERIAL.from.pos, target: AERIAL.from.target, fov: 44}, {t: M.TITLE_IN, pos: AERIAL.to.pos, target: AERIAL.to.target, fov: 42}];
const A1C = Array.from({length: 23}, (_, i) => camPath(A1K, (i / 22) * M.TITLE_IN, 0.35).pos);
const shots: any[] = JSON.parse(fs.readFileSync('cams.json', 'utf8'));
const city = CITY();
const cen = city.map((b) => ({b, c: {x: (b.x0 + b.x1) / 2, y: b.h / 2, z: (b.z0 + b.z1) / 2}}));
const rows: any[] = [];
for (const s of shots) {
  let nSw = 0, nBig = 0; const frames = new Set<number>();
  let prev: number[] | null = null;
  let camMove = 0; let pc: any = null;
  for (const c of s.cams) {
    if (pc) camMove += Math.hypot(c.x - pc.x, c.y - pc.y, c.z - pc.z); pc = c;
    const T = s.start + c.f / 30; const win = s.id === 'A1_aerial' ? {cams: A1C} : lodWindowAt(T);
    const lods = cen.map(({b, c: cc}) => { const dn = Math.hypot(cc.x - c.x, cc.y - c.y, cc.z - c.z); if (dn > 4200) return -1; const d = win ? Math.min(envelopeDist(win.cams, b, cc), dn) : dn; return lodFor(b, d); });
    if (prev) lods.forEach((l, i) => { if (l !== prev![i] && l >= 0 && prev![i] >= 0) { nSw++; frames.add(c.f); if (b0(cen[i].b)) nBig++; } });
    prev = lods;
  }
  rows.push({id: s.id, t0: s.start.toFixed(1), samples: s.cams.length, camMove: camMove.toFixed(0), switches: nSw, big: nBig, frames: [...frames].slice(0, 6).join(',')});
}
function b0(b: any) { return (b.h > 30 && b.x1 - b.x0 > 12); }
rows.filter((r) => r.switches > 0).forEach((r) => console.log(r.id.padEnd(14), 't0', r.t0, 'cam travel', r.camMove, 'm', 'LOD switches', r.switches, 'of big', r.big, 'at local frames', r.frames));
console.log('shots with LOD switches', rows.filter((r) => r.switches > 0).length, 'of', rows.length);
