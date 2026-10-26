// V4: the summit rock's height under a point (metres). V3's rock (v3/Scene3_ground.tsx) is a low-poly height field on
// a polar grid; its mesh is not exported, so this rebuilds the same mesh from the same rules and hashes (a
// deterministic copy; V3's file is unchanged) and interpolates its facets. Only the summit station (Station4) uses it,
// to seat its walls on the rock exactly where the facets are.
import {hash} from '../dc/math';

const PLAT_R = 14.6, PLAT_Y = -2.5;
const R = [0, PLAT_R, 18, 25, 38, 52, 70, 95, 130, 175, 230, 300, 380, 470];
const NA = 40;
const hAt = (r: number, a: number, i: number, j: number) => {
  if (r <= PLAT_R + 0.01) return PLAT_Y;
  if (r <= 18.5) return PLAT_Y - 0.4 - 1.4 * hash(i * 97 + j, 509);
  let h = -Math.pow(r - 12, 1.12) * (0.5 + 0.28 * (0.5 + 0.5 * Math.sin(a * 3 + 1.3)) + 0.14 * Math.sin(a * 7)) - 9 * hash(i * 97 + j, 501) * (r > 20 ? 1 : 0);
  const da = Math.abs(((a - Math.PI + 9.42) % 6.283) - 3.1416);
  if (r >= 30 && r <= 66 && da < 0.42) h = -19.2 - (r > 60 ? (r - 60) * 1.2 : 0);
  return h;
};
type P = {x: number; y: number; z: number};
const MESH = (() => {
  // only the inner rings matter here (the station stands within 60 m of the tower)
  const rings = 7;
  const V: P[] = [{x: 0, y: PLAT_Y, z: 0}];
  R.forEach((r, i) => {
    if (i === 0 || i > rings) return;
    for (let j = 0; j < NA; j++) {
      const a = (j / NA) * 6.2832 + (i % 2) * (3.1416 / NA);
      const rr = r * (1 + 0.12 * (hash(i * 31 + j, 503) - 0.5) * (r > 30 ? 1 : 0));
      V.push({x: Math.cos(a) * rr, y: hAt(rr, a, i, j), z: Math.sin(a) * rr});
    }
  });
  const id = (i: number, j: number) => (i === 0 ? 0 : 1 + (i - 1) * NA + (j % NA));
  const tris: [P, P, P][] = [];
  for (let i = 0; i < rings; i++) for (let j = 0; j < NA; j++) {
    const a = id(i, j), b = id(i, j + 1), c = id(i + 1, j), d = id(i + 1, j + 1);
    tris.push([V[a], V[c], V[d]]);
    tris.push([V[a], V[d], V[b]]);
  }
  return tris;
})();
/** the rock's height at (x, z) (NaN outside the inner rings) */
export const groundY = (x: number, z: number) => {
  for (const [A, B, C] of MESH) {
    const d = (B.z - C.z) * (A.x - C.x) + (C.x - B.x) * (A.z - C.z);
    if (Math.abs(d) < 1e-9) continue;
    const l1 = ((B.z - C.z) * (x - C.x) + (C.x - B.x) * (z - C.z)) / d;
    const l2 = ((C.z - A.z) * (x - C.x) + (A.x - C.x) * (z - C.z)) / d;
    const l3 = 1 - l1 - l2;
    if (l1 >= -1e-9 && l2 >= -1e-9 && l3 >= -1e-9) return l1 * A.y + l2 * B.y + l3 * C.y;
  }
  return NaN;
};
