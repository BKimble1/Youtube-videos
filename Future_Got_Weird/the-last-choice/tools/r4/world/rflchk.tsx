import {_debug} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/set';
import {groundH} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/world/ground';
import {xfPoint} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/engine';
const {S} = _debug.getStatic();
const items = S.map((s: any) => s.item).filter((it: any) => /^(rfloor_|rfsup_)/.test(it.key));
const W = (it: any) => it.mesh.verts.map((v: any) => (it.xf ? xfPoint(v, it.xf) : v));
for (const it of items.filter((i: any) => i.key.startsWith('rfloor_'))) {
  const w = W(it);
  const gaps = w.map((p: any) => p.y - groundH(p.x, p.z));
  const idx = it.key.split('_')[1];
  console.log(it.key, 'minGap', Math.min(...gaps).toFixed(2), 'maxGap(underside)', Math.max(...gaps.slice(0, Math.floor(gaps.length / 2))).toFixed(2), 'y', Math.min(...w.map((p: any) => p.y)).toFixed(2), Math.max(...w.map((p: any) => p.y)).toFixed(2));
  // supports
  const sups = items.filter((i: any) => i.key.startsWith(`rfsup_${idx}_`));
  console.log('   supports', sups.length);
  // underside plane fit from the first half of the slab's vertices (the bottom cap: unsplit mesh has n verts per cap; the split mesh has different layout) -> use all verts with lowest local height: approximate by nearest vertex y below the support
  for (const sp of sups) {
    const sw = W(sp);
    const top = Math.max(...sw.map((p: any) => p.y));
    const cx = sw.reduce((m: number, p: any) => m + p.x, 0) / sw.length, cz = sw.reduce((m: number, p: any) => m + p.z, 0) / sw.length;
    // slab underside near (cx,cz): the lowest slab vertex y within 1.2 m horizontally
    const near = w.filter((p: any) => Math.hypot(p.x - cx, p.z - cz) < 1.4).map((p: any) => p.y);
    console.log('   ', sp.key, 'at', cx.toFixed(1), cz.toFixed(1), 'ground', groundH(cx, cz).toFixed(2), 'support top', top.toFixed(2), 'slab verts nearby y', near.length ? Math.min(...near).toFixed(2) + '..' + Math.max(...near).toFixed(2) : 'none');
  }
}
