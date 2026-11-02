import {camAt, EV, T, LOOP_T, laidAt, armAt, instrAt} from '../source/src/story';
import {BEAD_TOTAL} from '../source/src/art/bone';
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
  if (f % 6 === 0 || jump || (prev && prev.world !== c.world)) rows.push(`${f} ${t.toFixed(2)} ${c.world} x=${cam.x.toFixed(2)} y=${cam.y.toFixed(2)} w=${cam.w.toFixed(2)} k=${(cam.k ?? 1).toFixed(3)} mix=${(c.mix ?? 0).toFixed(2)} laid=${laidAt(t).toFixed(1)}${jump}`);
  prev = c;
}
console.log(rows.join('\n'));
console.log('EV', JSON.stringify(EV));
console.log('BEAD_TOTAL', BEAD_TOTAL, 'laid(0)', laidAt(0), 'laid(-0.66)', laidAt(-0.66));
