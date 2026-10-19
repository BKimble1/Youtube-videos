import {unitWorld as uA} from './mechapi';
import {unitWorld as uB} from './mechapi_before';
import {unitD2} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/D2/machines';
for (const n of ['A', 'B', 'C', 'D']) {
  const sp: any = unitD2(n, 116.92);
  const tilt = (w: any) => { const d = {x: w.head.pos.x - w.pelvis.pos.x, y: w.head.pos.y - w.pelvis.pos.y, z: w.head.pos.z - w.pelvis.pos.z}; return (Math.acos(d.y / Math.hypot(d.x, d.y, d.z)) * 57.3).toFixed(0); };
  const row = (w: any) => `tilt ${tilt(w)} deg, pelvis y ${w.pelvis.pos.y.toFixed(2)} head y ${w.head.pos.y.toFixed(2)}`;
  console.log(n, 'fall', JSON.stringify({ang: sp.fall?.ang, t0: sp.fall?.t0, feet: !!sp.feet, crouch: sp.crouch}), '| before:', row(uB({...sp, t: 116.92})), '| after:', row(uA({...sp, t: 116.92})));
}
