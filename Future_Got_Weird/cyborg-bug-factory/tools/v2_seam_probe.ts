import {camA_C, camG} from '../source/src/v2/labShots2';
import {basis, orbitCam, proj} from '../source/src/core/three';
import {ambientBugs2, bugAt2, carrierX2} from '../source/src/v2/story2';
import {DUR} from '../source/src/lib';
for (const [t, cam] of [[0, camA_C], [DUR - 1 / 30, camG]] as [number, (t: number) => any][]) {
  const B = basis(orbitCam(cam(t)));
  const out: string[] = [];
  for (let k = -2; k <= 5; k++) {
    const b = bugAt2(k, t);
    const p = proj(B, b.st.body.o);
    out.push(`k${k} x${carrierX2(k, t).toFixed(0)} pos ${b.st.body.o.map((v) => v.toFixed(0)).join(',')} scr ${p.x.toFixed(0)},${p.y.toFixed(0)} z${p.z.toFixed(0)}`);
  }
  ambientBugs2(t).forEach((a, i) => { const p = proj(B, a.st.body.o); out.push(`amb${i} scr ${p.x.toFixed(0)},${p.y.toFixed(0)} z${p.z.toFixed(0)}`); });
  console.log('t', t.toFixed(3)); out.forEach((s) => console.log('  ', s));
}
