import {crewC, ROLES_C} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/crew';
import {TT, TR, TB2, T3} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/C/beats';
const starts: Record<string, [number, number]> = {tether: [TT.commit, TT.commitEnd], runner: [TR.commit, TR.commitEnd], breaker: [TB2.commit, TB2.commitEnd], drone: [T3.commitP, T3.commitPEnd], flares: [T3.commitF, T3.commitFEnd], decoy: [T3.commitD, T3.commitDEnd], director: [57.78, 58.55]};
for (const r of ROLES_C) {
  const [t0, t1] = starts[r];
  const a = crewC(t0 - 0.01)[r].body, b = crewC(59.9)[r].body;
  console.log(r, 'commit', t0, '->', t1, 'dist', Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z).toFixed(2), 'drop', (a.pos.y - b.pos.y).toFixed(2), 'footL y', a.footL.y.toFixed(2), '->', b.footL.y.toFixed(2), 'footR y', a.footR.y.toFixed(2), '->', b.footR.y.toFixed(2));
}
