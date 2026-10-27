import {hookPose, natPose, leafPose, labPose, s2At} from '../../source/src/v6/world3';
import {legLocal, PRO, ABD, LEG_R, toLocal, toWorld, SpiderPose} from '../../source/src/spider';
const inEll = (q: number[], c: number[], a: number, b: number, cc: number, r: number) => ((q[0]-c[0])/(a+r))**2 + ((q[1]-c[1])/(b+r))**2 + ((q[2]-c[2])/(cc+r))**2 < 1;
const check = (name: string, P: SpiderPose, t: number, other?: SpiderPose) => {
  const hits: string[] = [];
  P.e.forEach((e, i) => {
    const L = legLocal(i, e, P.dth?.[i] ?? 0);
    for (let k = 2; k < 6; k++) for (const u of [0, 0.5, 1]) {
      const q = L[k].map((v, j) => v + (L[k+1][j]-v)*u);
      const r = (LEG_R[k] + (LEG_R[k+1]-LEG_R[k])*u) * 0.5;
      if (inEll(q, [0,0,0], PRO.a, PRO.b, PRO.c, r)) hits.push(`L${i}s${k} pro`);
      if (inEll(q, [ABD.x,0,ABD.z], ABD.a, ABD.b, ABD.c, r)) hits.push(`L${i}s${k} abd`);
      if (other) { const w = toWorld(P, q as any); const ql = toLocal(other, w); const so = other.s ?? 1;
        if (inEll(ql, [0,0,0], PRO.a, PRO.b, PRO.c, r/so) || inEll(ql, [ABD.x,0,ABD.z], ABD.a, ABD.b, ABD.c, r/so)) hits.push(`L${i}s${k} OTHER`); }
    }
  });
  return [...new Set(hits)];
};
const agg: Record<string, string[]> = {};
for (let f = 0; f < 906; f++) {
  const t = f / 30;
  let r: string[] = [];
  if (t < 4.52) r = check('hook', hookPose(t), t);
  else if (t < 7.8) r = check('nat', natPose(t), t);
  else if (t < 13.48) r = check('leaf', leafPose(t), t);
  else r = check('lab', labPose(t), t, t > 25.9 ? s2At(t) : undefined).concat(t > 25.9 ? check('s2', s2At(t), t).map(x => 's2:' + x) : []);
  for (const h of r) (agg[h] = agg[h] ?? []).push(String(f));
}
for (const [k, v] of Object.entries(agg)) console.log(k, v.length, v[0], v[v.length-1]);
