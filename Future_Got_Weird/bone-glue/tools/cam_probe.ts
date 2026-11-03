// Prints the V2 camera path every 6 frames and flags frame-to-frame jumps inside one world.
import {camAt, EV, LOOP_T, boneAt, instrAt} from '../source/src/story';
const rows: string[] = [];
let prev: any = null;
const N = Math.round(LOOP_T * 30);
for (let f = 0; f <= N; f++) {
  const t = f / 30;
  const c = camAt(t);
  const cam = c.cam;
  let jump = '';
  if (prev && prev.world === c.world) {
    const dlw = Math.abs(Math.log(cam.w / prev.cam.w));
    const dx = Math.hypot(cam.x - prev.cam.x, cam.y - prev.cam.y) / cam.w;
    if (dlw > 0.12 || dx > 0.06) jump = ` JUMP dlw=${dlw.toFixed(3)} dxy=${dx.toFixed(3)}`;
  }
  const b = boneAt(t, cam.w / 1080), ins = instrAt(t);
  if (f % 6 === 0 || jump || (prev && prev.world !== c.world))
    rows.push(`${f} ${t.toFixed(2)} ${c.world} x=${cam.x.toFixed(2)} y=${cam.y.toFixed(2)} w=${cam.w.toFixed(2)} k=${(cam.k ?? 1).toFixed(3)} rev=${(c.reveal ?? 0).toFixed(2)} C1=${b.glue.C1.b.toFixed(1)} C2=${b.glue.C2.b.toFixed(1)} C3a=${b.glue.C3.a.toFixed(1)} bridge=${b.heal.bridge.toFixed(2)} wet=${b.wet.toFixed(2)} app=${ins.app.tip.x.toFixed(1)},${ins.app.tip.y.toFixed(1)} L${ins.app.lift.toFixed(2)} on${ins.appOn.toFixed(2)} probe=${ins.probe.tip.x.toFixed(1)},${ins.probe.tip.y.toFixed(1)} L${ins.probe.lift.toFixed(2)} on${ins.probeOn.toFixed(2)}${jump}`);
  prev = c;
}
console.log(rows.join('\n'));
console.log('EV', JSON.stringify(Object.fromEntries(Object.entries(EV).map(([k, v]) => [k, +(v as number).toFixed(3)]))));
