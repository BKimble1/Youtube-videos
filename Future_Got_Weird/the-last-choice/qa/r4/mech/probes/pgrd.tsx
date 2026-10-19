import {combatUnit} from API;
import {xfPoint} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
const BUMP = (x: number, z: number) => 0.16 * Math.sin(0.9 * x + 0.4) * Math.cos(0.7 * z) + 0.05 * x + 0.04 * Math.sin(2.3 * x + 1.7 * z);
const lowest = (items: any[], g: (x: number, z: number) => number) => {
  let lo = 1e9, hi = -1e9, at = '';
  for (const it of items) {
    if (it.kind !== 'mesh') continue;
    for (const p of it.mesh.verts) {
      let q = it.xf ? xfPoint(p, it.xf) : p; if (it.fn) q = it.fn(q, -1);
      const h = q.y - g(q.x, q.z);
      if (h < lo) { lo = h; at = it.key; }
      hi = Math.max(hi, h);
    }
  }
  return {lo, hi, at};
};
for (const [gname, g] of [['flat', () => 0], ['bump', BUMP]] as [string, any][]) {
  let worstPen = 0, worstHover = 0, ctxP = '', ctxH = '';
  for (let di = 0; di < 8; di++) {
    const ang = di * Math.PI / 4;
    const dir = {x: Math.cos(ang), y: 0, z: Math.sin(ang)};
    for (const t of [3.0, 4.5]) {
      const items = combatUnit({id: 9, t, pos: {x: 1, y: 0, z: 1}, heading: di * 45, ground: g, idle: 0, fall: {t0: 0.5, dir}, damage: {dead: {t0: 0.5}}} as any);
      const r = lowest(items, g);
      if (-r.lo > worstPen) { worstPen = -r.lo; ctxP = `dir${di} t${t} ${r.at}`; }
      if (r.lo > worstHover) { worstHover = r.lo; ctxH = `dir${di} t${t}`; }
    }
  }
  console.log(`${gname}: wreck deepest vertex below ground ${worstPen.toFixed(3)} m (${ctxP}); lowest vertex hovering ${worstHover.toFixed(3)} m (${ctxH})`);
}
