import {camG} from '../source/src/scenes/labShots2';
import {orbitCam} from '../source/src/core/three';
for (const f of [880, 900, 910, 915, 920, 925, 930, 935, 940, 945]) {
  const o = camG(f / 30);
  const c = orbitCam(o);
  console.log(f, 'tgt', o.target.map((x) => x.toFixed(0)).join(','), 'az', o.az.toFixed(0), 'el', o.el.toFixed(0), 'd', o.d.toFixed(0), 'eye', c.eye.map((x) => x.toFixed(0)).join(','));
}
