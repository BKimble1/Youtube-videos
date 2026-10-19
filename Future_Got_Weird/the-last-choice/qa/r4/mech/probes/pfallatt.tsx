import {unitAttach as uaA} from './mechapi';
import {unitAttach as uaB} from './mechapi_before';
import {PERSIST} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/persist';
const names = ['chest', 'backPlate', 'head', 'pelvis', 'kneeL', 'kneeR', 'footL', 'footR', 'handL', 'handR', 'elbowL', 'elbowR', 'shoulderL', 'shoulderR'];
for (const T of [200]) {
  for (const p of PERSIST) {
    if (p.kind !== 'unit') continue;
    const sp: any = {...p.spec(T), t: T};
    const a: any = uaA(sp), b: any = uaB(sp);
    let worst = 0, wn = '';
    const diffs: string[] = [];
    for (const n of names) { const d = Math.hypot(a[n].x - b[n].x, a[n].y - b[n].y, a[n].z - b[n].z); if (d > 0.02) diffs.push(`${n} ${d.toFixed(2)}`); if (d > worst) { worst = d; wn = n; } }
    console.log(p.key.padEnd(10), 'max attach shift', worst.toFixed(2), wn, '|', diffs.join(', '));
  }
}
