import {camG} from '../source/src/v2/labShots2';
import {orbitCam, basis, proj} from '../source/src/core/three';
import {POOLS} from '../source/src/v2/lab2';
import {ambientBugs2, ocState} from '../source/src/v2/story2';
for (const f of [886, 888, 889, 890, 891, 893]) {
  const t = f / 30;
  const o = camG(t);
  const c = orbitCam(o);
  const B = basis(c);
  const pools = POOLS.map((p) => { const q = proj(B, p.c); return `${q.z.toFixed(0)}@${q.x.toFixed(0)},${q.y.toFixed(0)}`; }).join(' ');
  const amb = ambientBugs2(t).map((a) => proj(B, a.st.body.o).z.toFixed(0)).join(',');
  console.log(f, 'eye', c.eye.map((x) => x.toFixed(0)).join(','), 'tgt', o.target.map((x) => x.toFixed(0)).join(','), 'az', o.az.toFixed(0), 'el', o.el.toFixed(1), 'pools', pools, 'amb z', amb);
}
