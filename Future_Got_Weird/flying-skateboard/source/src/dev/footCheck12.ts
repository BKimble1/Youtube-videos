// V12 QC (V6 check on the V7 film): foot contact and knee direction for every frame the rider is seen. The legs are two-bone IK chains from the
// hips to ankles planted on the deck; if a hip moves out of reach the solver stops short and the foot leaves its
// support point. Reports the largest gap between each solved ankle and its planted point (mm) and any frame where a
// knee bends backward (toward the heel side). usage: esbuild source/src/dev/footCheck7.ts --bundle ... && node out.cjs
import {FRAMES} from '../v10/time10';
import {pilotJoints} from '../art/rig';
import {d3, l3, s3} from '../eng/v3';
import {riderView12} from '../v12/shots12';
let worst = {f: -1, mm: 0};
const bad: number[] = [];
let n = 0;
for (let f = 0; f < FRAMES; f++) {
  const v = riderView12(f / 30);
  if (!v) continue;
  n++;
  const j = pilotJoints(v.st.B, v.st.pose);
  const gap = Math.max(l3(s3(j.ankF, j.ankFt)), l3(s3(j.ankR, j.ankRt))) * 1000;
  if (gap > worst.mm) worst = {f, mm: gap};
  // a knee must sit on the toe side of its hip-ankle line
  for (const [hip, knee, ank] of [[j.hipF, j.kneeF, j.ankF], [j.hipR, j.kneeR, j.ankR]]) {
    const mid = {x: (hip.x + ank.x) / 2, y: (hip.y + ank.y) / 2, z: (hip.z + ank.z) / 2};
    if (d3(s3(knee, mid), j.B.x) < 0) bad.push(f);
  }
}
console.log('frames with the rider', n);
console.log('largest ankle gap from its planted point (mm):', worst.mm.toFixed(2), 'at frame', worst.f);
console.log('frames with a knee bent backward:', bad.length ? [...new Set(bad)].join(',') : 'none');
