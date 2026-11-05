import {s1Wearer, slotGeoMini, MINI_BASE} from '../../source/src/film/s1';
import {slotGeo} from '../../source/src/film/cast';
for (const t of [3.6, 4.4, 5.2, 6.3]) {
  const w = s1Wearer(t);
  const ur = w.arms.find((a) => a.tid === 'UR')!.pose;
  const g = slotGeo(w.pose, 'UR', ur);
  const m = slotGeoMini(ur);
  const f = (a: any, b: any, k = 1) => [(a.x - b.x) * k, (a.y - b.y) * k, (a.z - b.z) * k].map((x) => x.toFixed(1)).join(',');
  console.log(t, 'full W-base', f(g.W, g.base), ' mini W-base x2', f(m.W, m.base, 2), ' pose', JSON.stringify(ur, (k, v) => (typeof v === 'number' ? +v.toFixed(1) : v)));
}
void MINI_BASE;
