import {robot1, JUMP1} from '../shots/HookFoundry';
for (const tau of [0.5, 0.8, 1.0, 1.17, 2.0, 2.87, 3.2]) {
  const s = robot1(tau);
  console.log(tau, s.phase, s.t.toFixed(3), s.pose.pos.map((v) => v.toFixed(1)).join(','), JUMP1.phys(tau).toFixed(3));
}
console.log('v0', JUMP1.v0, 'T', JUMP1.T, 'p0', JUMP1.p0, 'p1', JUMP1.p1);
