import {solveHeavy as sh, straightPath} from API;
import {heavy1D3, heavy2D3} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/D3/machines';
import {heavy2At} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/D4/machines';
import {heavySpecB} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/army';
const path = straightPath({x: -20, y: 0, z: 0}, 90);
const cases: [string, (T: number) => any, number, number][] = [
  ['walk', (T) => ({id: 4, t: T, pos: {x: 0, y: 0, z: 0}, heading: 90, gait: {path, dist: T * 0.9, stride: 3}}), 2, 12],
  ['B heavy0', (T) => heavySpecB(0, T), 16, 36],
  ['D3 h1', heavy1D3, 117, 128],
  ['D3 h2', heavy2D3, 140, 149.86],
  ['D4 h2', heavy2At, 149.86, 168],
];
for (const [name, fn, a, b] of cases) {
  const X: any[] = []; for (let T = a; T <= b; T += 1 / 30) X.push(sh({...fn(T), t: T}).knee);
  let m = 0, mT = 0; for (let i = 1; i < X.length; i++) X[i].forEach((k: any, j: number) => { const d = Math.hypot(k.x - X[i - 1][j].x, k.y - X[i - 1][j].y, k.z - X[i - 1][j].z); if (d > m) { m = d; mT = a + i / 30; } });
  console.log(name.padEnd(9), 'max knee jump/frame', m.toFixed(2), 'at', mT.toFixed(2));
  if (name.startsWith('D')) { const L: string[] = []; for (let i = 1; i < X.length; i++) X[i].forEach((k: any, j: number) => { const d = Math.hypot(k.x - X[i - 1][j].x, k.y - X[i - 1][j].y, k.z - X[i - 1][j].z); if (d > 0.7) L.push(`${(a + i / 30).toFixed(2)}:L${j}:${d.toFixed(2)}`); }); console.log('   >0.7:', L.join(' ')); }
}
