import {climbAt, loopApex} from '../../source/src/v4/climb4';
import {manJoints} from '../../source/src/dc/Man';
import {gripOf, prPad} from '../../source/src/world/geo';
for (const f of process.argv.slice(2).map(Number)) {
  const s = climbAt(f), j = manJoints(s.pose);
  const r = (v: any) => `${v.x.toFixed(0)},${v.y.toFixed(0)}`;
  console.log(f, 'H', r(j.H), 'head', r(j.head), 'gripL', r(prPad(gripOf(s.padL))), 'gripR', r(prPad(gripOf(s.padR))), 'ankL', r(s.footL.ankle), 'ankR', r(s.footR.ankle), 'barL', r(s.footL.bar), 'barR', r(s.footR.bar));
}
