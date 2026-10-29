// The surrounding understory: seedlings and low plants at mid distance, hazier with distance. No ants on these.
import {norm3, V3} from '../core/three';
import {hash} from '../lib';
import {Leaf} from './plant';

export type Plant = {id: string; stem: V3[]; r: [number, number]; leaves: Leaf[]; fog: number};
const keepOut = (x: number, y: number) => x > -150 && x < 80 && y > -80 && y < 70;
export const FOREST: Plant[] = (() => {
  const out: Plant[] = [];
  let k = 0, n = 0;
  while (out.length < 24 && n < 400) {
    n++;
    const x = -320 + hash(n * 3.17) * 640;
    const y = -120 + hash(n * 5.31) * 520;
    if (keepOut(x, y)) continue;
    const dist = Math.hypot(x + 30, y - 20);
    if (dist < 120) continue;
    const h = 25 + hash(n * 7.7) * 95;
    const lean = (hash(n * 2.2) - 0.5) * 0.25;
    const stem: V3[] = [0, 0.33, 0.66, 1].map((u) => [x + lean * h * u + Math.sin(u * 3 + n) * 1.5, y + lean * h * u * 0.3, u * h] as V3);
    const nl = 2 + Math.floor(hash(n * 9.1) * 3);
    const leaves: Leaf[] = [];
    for (let j = 0; j < nl; j++) {
      const a = hash(n * 11 + j * 3.3) * Math.PI * 2;
      const zt = h * (0.55 + 0.45 * hash(n * 13 + j));
      const L = 18 + hash(n * 17 + j) * 30;
      leaves.push({
        id: `F${k}_${j}`,
        base: [x + lean * zt, y + lean * zt * 0.3, zt],
        dir: norm3([Math.cos(a), Math.sin(a), 0.15 + hash(n * 19 + j) * 0.3]),
        up: [0, 0, 1],
        L,
        Wd: L * (0.36 + hash(n * 23 + j) * 0.18),
        droop: 12 + hash(n * 29 + j) * 30,
        cup: 0.8 + hash(n * 31 + j) * 1.5,
        hue: hash(n * 37 + j) < 0.15 ? 0.6 : 0,
      });
    }
    out.push({id: `F${k}`, stem, r: [0.9 + h * 0.006, 0.6], leaves, fog: Math.min(0.85, 0.35 + Math.max(0, (dist - 120) / 400))});
    k++;
  }
  return out;
})();
