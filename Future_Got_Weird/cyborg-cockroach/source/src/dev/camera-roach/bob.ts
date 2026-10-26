import {povCam, FW, medicPose} from '../../shots/S08';
import {s07Cam, obsPose} from '../../shots/S07';
import {proj} from '../../lib/cam';
import {toW, cross, norm, dot} from '../../lib/v3';
const o = (FW - 1080) / 2;
let prev: number[] | null = null;
const rows: string[] = [];
for (let f = 372; f < 462; f++) {
  const c = povCam(f / 30);
  const p = proj(c, [-8, 30, 0]);
  const hr = norm(cross(c.fwd, [0, 1, 0]));
  const roll = (Math.atan2(-dot(hr, c.up), dot(hr, c.right)) * 180) / Math.PI;
  const d = prev ? [p[0] - prev[0], p[1] - prev[1]] : [0, 0];
  rows.push(`${f} tgt(${(p[0] - o).toFixed(1)},${p[1].toFixed(1)}) d(${d[0].toFixed(1)},${d[1].toFixed(1)}) roll${roll.toFixed(2)}`);
  prev = [p[0], p[1]];
}
console.log(rows.join('\n'));
// S07: the lens on screen per frame
let pl: number[] | null = null;
for (let f = 315; f < 372; f++) {
  const c = s07Cam(f / 30), fr = obsPose(f / 30).frame;
  const q = proj(c, toW(fr, [26, 27, 0]));
  console.log('s07', f, q[0].toFixed(0), q[1].toFixed(0), pl ? (q[0] - pl[0]).toFixed(1) + ',' + (q[1] - pl[1]).toFixed(1) : '');
  pl = [q[0], q[1]];
}
