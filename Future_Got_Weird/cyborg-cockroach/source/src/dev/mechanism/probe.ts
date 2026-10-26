// numeric checks for S09/S10 (bundle with the scratchpad build script and run with node)
import {s10Cam} from '../../shots/S10';
import {proj, scaleAt} from '../../lib/cam';
const pts: [string, [number, number, number]][] = [['face', [0, 30, 0]], ['inj', [10, 26.5, 0]], ['body', [58, 12, 0]], ['rear', [105, 10, 0]], ['base', [-38, 0, 30]]];
for (let f = 570; f <= 618; f += 3) {
  const c = s10Cam(f / 30);
  console.log(f, pts.map(([k, p]) => `${k} ${proj(c, p).map((v) => v.toFixed(0)).join(',')}`).join(' | '), 'sc', scaleAt(c, [10, 26.5, 0]).toFixed(1));
}
