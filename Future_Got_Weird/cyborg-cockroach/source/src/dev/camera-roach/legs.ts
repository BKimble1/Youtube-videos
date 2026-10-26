import {medicPose, povCam, FW} from '../../shots/S08';
import {proj, depth} from '../../lib/cam';
import {dot, sub, norm, add, mul} from '../../lib/v3';
const t = 13.0, c = povCam(t), p = medicPose(t), o = (FW - 1080) / 2;
const camAbove = dot(norm(sub(c.eye, p.frame.o)), p.frame.y);
console.log('camAbove', camAbove.toFixed(2));
for (const l of p.legs) {
  const q = (v: any) => { const a = proj(c, v); return `(${(a[0] - o).toFixed(0)},${a[1].toFixed(0)})`; };
  const fw = l.def.front ? 0.6 : l.def.coxa[0] < 0 ? -0.6 : 0;
  const out = norm(add(mul(p.frame.z, l.def.side), mul(p.frame.x, fw)));
  console.log(l.def.name, 'up', l.up, 'coxa', q(l.coxa), 'knee', q(l.knee), 'ankle', q(l.ankle), 'foot', q(l.foot), 'near', dot(sub(c.eye, l.coxa), out).toFixed(1));
}
