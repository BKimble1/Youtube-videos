import {unitWorld, U_DIM} from './mechapi';
import {unitD2} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/D2/machines';
const U = U_DIM as any;
for (const n of ['A', 'B', 'C', 'D', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6']) {
  let spf: any; try { spf = unitD2(n, 98.0); } catch { continue; }
  const out: string[] = [];
  for (let T = 97.8; T <= 99.6; T += 1 / 30) {
    const sp: any = unitD2(n, T); const r = unitWorld(sp); const g = sp.ground ?? (() => 0);
    r.an.forEach((a, i) => { const e = a.y - g(a.x, a.z) - U.ankleH; if (e < -0.04) out.push(`${T.toFixed(2)}${i ? 'R' : 'L'}:${e.toFixed(2)}`); });
  }
  console.log(n, out.join(' '));
}
