// numeric checks for S09/S10 (run with: npx tsx src/dev/mechanism/probe.ts)
import {s09Pose} from '../../shots/S09';
for (let f = 462; f < 537; f += 6) {
  const p = s09Pose(f / 30);
  const tip = (a: number[][]) => a[a.length - 1].map((v) => v.toFixed(1)).join(',');
  const minY = (a: number[][]) => Math.min(...a.filter((q) => q[0] < 12).map((q) => q[1])).toFixed(1);
  console.log(f, 'L', tip(p.antL), 'R', tip(p.antR), 'minY(x<12)', minY(p.antL), minY(p.antR));
}
