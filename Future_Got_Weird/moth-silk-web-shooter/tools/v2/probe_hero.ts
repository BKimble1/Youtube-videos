// prints the lead's frame-0 arm (street, screen = world at frame 0) for the loop match
import {heroAt} from '../../source/src/v2/Street2';
import {manJoints} from '../../source/src/v2/dc/Man';
for (const f of [-30, -10, -1, 0, 5]) {
  const h = heroAt(f);
  const j = manJoints(h.pose);
  const a = (v: {x: number; y: number}) => `(${v.x.toFixed(0)},${v.y.toFixed(0)})`;
  console.log(f, 'S', a(j.R.S), 'E', a(j.R.E), 'W', a(j.R.W), 'fore', ((Math.atan2(j.R.foreDir.y, j.R.foreDir.x) * 180) / Math.PI).toFixed(1), 'hand', j.R.handAng.toFixed(1), 'head', a(j.head), 'hip', a({x: h.pose.x, y: h.pose.y}), 'T', a({x: h.pose.rWx, y: h.pose.rWy}), 'wr', h.pose.rWr.toFixed(1));
}
