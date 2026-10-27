// leg-against-leg: closest approach between segments of different legs (k >= 1) vs. the sum of their radii
import {hookPose, natPose, leafPose, labPose, s2At} from '../../source/src/v6/world3';
import {legsWorld, LEG_R, SpiderPose} from '../../source/src/spider';
type V = number[];
const segDist = (p1: V, q1: V, p2: V, q2: V) => {
  let best = 1e9;
  for (let a = 0; a <= 8; a++) for (let b = 0; b <= 8; b++) {
    const u = a / 8, v = b / 8;
    const x = [0, 1, 2].map((j) => p1[j] + (q1[j] - p1[j]) * u - (p2[j] + (q2[j] - p2[j]) * v));
    best = Math.min(best, Math.hypot(x[0], x[1], x[2]));
  }
  return best;
};
const check = (P: SpiderPose, Q?: SpiderPose) => {
  const A = legsWorld(P), sa = P.s ?? 1;
  const Bl = Q ? legsWorld(Q) : A, sb = Q ? (Q.s ?? 1) : sa;
  let worst = 0, where = '';
  for (let i = 0; i < 8; i++) for (let j = Q ? 0 : i + 1; j < 8; j++) for (let k = 1; k < 6; k++) for (let m = 1; m < 6; m++) {
    if (!Q && Math.abs(i - j) === 0) continue;
    const d = segDist(A[i][k], A[i][k + 1], Bl[j][m], Bl[j][m + 1]);
    const pen = (LEG_R[k + 1] * sa + LEG_R[m + 1] * sb) * 0.9 - d;
    if (pen > worst) { worst = pen; where = `${i}.${k}x${j}.${m}`; }
  }
  return {worst, where};
};
const rows: string[] = [];
for (let f = 0; f < 906; f += 2) {
  const t = f / 30;
  const P = t < 4.52 ? hookPose(t) : t < 7.8 ? natPose(t) : t < 13.48 ? leafPose(t) : labPose(t);
  const r = check(P);
  const r2 = t > 26 ? check(P, s2At(t)) : {worst: 0, where: ''};
  if (r.worst > 0.05 || r2.worst > 0.05) rows.push(`${f} self ${r.worst.toFixed(2)} ${r.where} | other ${r2.worst.toFixed(2)} ${r2.where}`);
}
console.log(rows.length); console.log(rows.join('\n'));
