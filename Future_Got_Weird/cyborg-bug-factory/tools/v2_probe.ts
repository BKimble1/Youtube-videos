import {OC_PATH, OC_LEN0, ocS, ocState} from '../source/src/v2/story2';
import {pathAt} from '../source/src/roach/gait';
console.log('start', OC_PATH.p0.map((x) => x.toFixed(0)).join(','), 'yaw', OC_PATH.yaw0.toFixed(0), 'len0', OC_LEN0);
for (const tau of [-4.79, -3.9, -3.0, -2.0, -1.0, -0.5, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.2, 2.0]) {
  const s = ocS(tau);
  const q = pathAt(OC_PATH, s);
  console.log(tau.toFixed(2), 's', s.toFixed(1), 'p', q.p.map((x) => x.toFixed(0)).join(','), 'yaw', q.yaw.toFixed(0));
}
