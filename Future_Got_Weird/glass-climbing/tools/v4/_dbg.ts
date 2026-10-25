import {climbAt, loopApex} from '../../source/src/v4/climb4';
import {manJoints} from '../../source/src/dc/Man';
const f = +process.argv[2];
const s = climbAt(f), j = manJoints(s.pose);
const r = (v: any) => `${v.x.toFixed(0)},${v.y.toFixed(0)}`;
console.log(f, 'ringL', r(s.ringL), 'apexL', r(loopApex(s.footL.bar)), 'L hp/K/A', r(j.lLeg.hp), r(j.lLeg.K), r(j.lLeg.A), 'fs', s.pose.lFs?.toFixed(2));
console.log(f, 'ringR', r(s.ringR), 'apexR', r(loopApex(s.footR.bar)), 'R hp/K/A', r(j.rLeg.hp), r(j.rLeg.K), r(j.rLeg.A), 'fs', s.pose.rFs?.toFixed(2), 'gapR', s.padR.gap.toFixed(1), 'gapL', s.padL.gap.toFixed(1));
