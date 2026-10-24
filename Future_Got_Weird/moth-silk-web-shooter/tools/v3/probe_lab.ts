// V3 probe: the lead's shoulders and reach in the lab pose (no rendering), for staging.
import {manJoints} from '../../source/src/v3/dc/Man';
import {BASE} from '../../source/src/v3/cast3';
for (const x of [1000, 1100, 1300]) {
  const p = {...BASE, x, y: 1470, s: 1.25, torso: 5, chest: 5, neck: 4, turn: 0.45, rW: 1, rElb: -1, lW: 1, lElb: -1, lWx: 1330, lWy: 1284, rWx: 800, rWy: 1200};
  const j = manJoints(p);
  console.log(x, 'L.S', j.L.S.x.toFixed(0), j.L.S.y.toFixed(0), 'R.S', j.R.S.x.toFixed(0), j.R.S.y.toFixed(0), 'reach', ((199 + 178) * 1.25).toFixed(0));
}
