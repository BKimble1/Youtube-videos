import {slabPoint, supportItems} from '/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source/src/r2/shots/B/rubble';
const underY = (x: number, z: number, T: number): number => {
  const a = slabPoint(0, 0, T), b = slabPoint(1, 0, T), c = slabPoint(0, 1, T);
  const bx = b.x - a.x, by = b.y - a.y, bz = b.z - a.z, cx = c.x - a.x, cy = c.y - a.y, cz = c.z - a.z;
  const det = bx * cz - bz * cx;
  const p = (by * cz - bz * cy) / det, q = (bx * cy - by * cx) / det;
  return a.y + p * (x - a.x) + q * (z - a.z);
};
const piers = supportItems().filter((i: any) => i.key.startsWith('bPier')) as any[];
console.log('gap = slab underside - pier top (m); + gap, - penetration');
for (const T of [9.5, 12.4, 13.2, 13.5, 13.9, 14.0, 14.3, 20, 40]) {
  const row = piers.map((it) => {
    const m = it.mesh, n = m.verts.length / 3;
    const tops = m.verts.slice(2 * n);
    const g = tops.map((v: any) => underY(v.x, v.z, T) - v.y);
    return it.key + ' [' + Math.min(...g).toFixed(3) + ' .. ' + Math.max(...g).toFixed(3) + ']';
  });
  console.log('T', T, row.join('   '));
}
