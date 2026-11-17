import {manJoints} from '../source/src/dc/Man';
import {BASE, LS} from '../source/src/lab/cast';
const p = {...BASE, x: -120, y: 1500, s: LS, torso: 7, chest: 9, neck: 10, turn: 0.42};
const j = manJoints(p as any);
const r = (v: any) => `(${v.x.toFixed(0)},${v.y.toFixed(0)})`;
console.log('head', r(j.head), 'L.S', r(j.L.S), 'R.S', r(j.R.S), 'hipish y', p.y);
console.log(Object.keys(j).join(' '));
