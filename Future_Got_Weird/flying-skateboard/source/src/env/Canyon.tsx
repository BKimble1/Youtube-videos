// The canyon (the Baren River gorge at Badong, a separate demonstration from the Yangtze crossing): towering limestone
// walls either side of a narrow green river, following a gentle bend. Each wall is built from vertical strips along the
// gorge (inner face only), each strip shaded by its facing to the sun, with horizontal strata, ledges carrying shrubs
// and hanging greenery. Sky shows as the slot overhead. Path: centreline x = cx(z); floor (river) y = 0.
import React from 'react';
import {hash, noise1} from '../dc/math';
import {f2, lit, mix, polyD, proj, shade} from '../eng/draw';
import {clipNear, d3, H, Lens, n3, s3, V3, v3, W} from '../eng/v3';
import {Sky} from './River';

export const CANYON = {height: 210};
/** centreline of the gorge (gentle bend) */
export const cx = (z: number) => 16 * Math.sin(z / 170) + 4 * Math.sin(z / 61);
/** half-width at height y on side s (+1 right, -1 left) */
const hw = (z: number, y: number, s: number) => {
  const base = 21 + 6 * noise1(z / 60, s > 0 ? 3 : 4);
  const ledge = 3.2 * Math.max(0, noise1(y / 22 + z / 90, s > 0 ? 5 : 6));
  return base + y * 0.16 + ledge + 2.5 * noise1(z / 13 + y / 31, s > 0 ? 7 : 8);
};
const ROCK = '#CDBB9E';
const ROCKDEEP = '#8F7F6C';
const GREEN = '#6E9157';

const YS = [0, 8, 20, 34, 50, 70, 92, 118, 146, 176, 210];

export const CanyonBack: React.FC<{id: string; L: Lens; t: number}> = ({id, L, t}) => {
  const z0 = Math.floor((L.pos.z - 40) / 7) * 7;
  const strips: {d: string; color: string; dist: number; strata: string; shrubs: string}[] = [];
  for (const s of [-1, 1]) {
    for (let z = z0; z < z0 + 760; z += 7) {
      const za = z, zb = z + 7;
      const A: V3[] = YS.map((y) => v3(cx(za) + s * hw(za, y, s), y, za));
      const Bp: V3[] = YS.map((y) => v3(cx(zb) + s * hw(zb, y, s), y, zb));
      const poly = [...A, ...Bp.slice().reverse()];
      const cl = clipNear(L, poly, 0.8);
      if (cl.length < 3) continue;
      const pp = proj(L, cl);
      if (pp.every((p) => p.x < -60) || pp.every((p) => p.x > W + 60) || pp.every((p) => p.y > H + 60)) continue;
      // facing: inward normal of the strip (roughly), toned by the sun from the left
      const tang = n3(s3(Bp[4], A[4]));
      const nrm = n3(v3(-s * tang.z, 0.15, s * tang.x));
      const sun = n3(v3(0.55, 0.6, -0.3));
      const lam = Math.max(0, d3(nrm, sun));
      const tone = mix(shade(ROCK, 0.55), lit(ROCK, 0.16), Math.min(1, Math.max(0, lam * 1.4 + 0.18 * noise1(z / 23, s > 0 ? 17 : 18))));
      const dist = d3(s3(v3(cx(z), 60, z + 3.5), L.pos), L.f);
      const haze = 1 - Math.exp(-Math.max(0, dist) / 900);
      // strata: a few horizontal lines across the strip
      const st: string[] = [];
      for (const y of [14, 41, 63, 104, 131, 160, 190]) {
        const a = v3(cx(za) + s * hw(za, y, s), y, za), b = v3(cx(zb) + s * hw(zb, y, s), y, zb);
        const q = clipNear(L, [a, b], 0.8, false);
        if (q.length === 2) {
          const pa = L.p(q[0]), pb = L.p(q[1]);
          st.push(`M${f2(pa.x)},${f2(pa.y)}L${f2(pb.x)},${f2(pb.y)}`);
        }
      }
      // shrubs on ledges
      const sh: string[] = [];
      for (let k = 0; k < 3; k++) {
        if (hash(Math.round(z) * 3 + k + (s > 0 ? 500 : 0), 9) > 0.55) continue;
        const y = 10 + hash(Math.round(z) * 5 + k, 10) * 170;
        const q = v3(cx(z + 3.5) + s * (hw(z + 3.5, y, s) - 0.5), y, z + 3.5);
        if (d3(s3(q, L.pos), L.f) < 1) continue;
        const p = L.p(q);
        const r = (2.2 + hash(Math.round(z) + k, 11) * 2.5) * p.k;
        if (r < 0.6) continue;
        sh.push(`M${f2(p.x - r)},${f2(p.y)} a${f2(r)},${f2(r * 0.75)} 0 1,1 ${f2(2 * r)},0 a${f2(r * 0.8)},${f2(r * 0.5)} 0 1,1 ${f2(-2 * r)},0 Z`);
      }
      // a vertical crack at some strip edges
      if (hash(Math.round(z) + (s > 0 ? 900 : 0), 15) > 0.62) {
        const y0 = 5 + hash(Math.round(z), 16) * 60, y1 = y0 + 40 + hash(Math.round(z), 17) * 110;
        const q = clipNear(L, [v3(cx(za) + s * hw(za, y0, s), y0, za), v3(cx(za) + s * hw(za, (y0 + y1) / 2, s) - s * 0.4, (y0 + y1) / 2, za + 1.5), v3(cx(za) + s * hw(za, y1, s), y1, za + 0.5)], 0.8, false);
        if (q.length > 1) st.push('M' + proj(L, q).map((p) => `${f2(p.x)},${f2(p.y)}`).join(' L'));
      }
      strips.push({d: polyD(pp), color: mix(tone, '#D9E4E6', haze * 0.85), dist, strata: st.join(''), shrubs: sh.join('')});
    }
  }
  strips.sort((a, b) => b.dist - a.dist);
  // the gorge floor (boulders and gravel) under the walls, then the river in it
  const floorPts: V3[] = [];
  for (let z = z0; z < z0 + 760; z += 10) floorPts.push(v3(cx(z) - 40, 0, z));
  for (let z = z0 + 750; z >= z0; z -= 10) floorPts.push(v3(cx(z) + 40, 0, z));
  const fl = clipNear(L, floorPts, 0.8);
  const riverPts: V3[] = [];
  for (let z = z0; z < z0 + 760; z += 10) riverPts.push(v3(cx(z) - 12, 0, z));
  for (let z = z0 + 750; z >= z0; z -= 10) riverPts.push(v3(cx(z) + 12, 0, z));
  const rv = clipNear(L, riverPts, 0.8);
  // glints on the canyon river
  const gl: string[] = [];
  for (let z = Math.floor(L.pos.z / 4) * 4; z < L.pos.z + 300; z += 4) {
    for (let k = 0; k < 2; k++) {
      const x = cx(z) + (hash(z * 2 + k, 13) - 0.5) * 20 + (t * 0.8) % 4;
      const q = v3(x, 0.02, z + hash(z + k, 14) * 4);
      if (d3(s3(q, L.pos), L.f) < 1) continue;
      const a = L.p(v3(q.x - 0.8, 0.02, q.z)), b = L.p(v3(q.x + 0.8, 0.02, q.z));
      gl.push(`M${f2(a.x)},${f2(a.y)}L${f2(b.x)},${f2(b.y)}`);
    }
  }
  return (
    <g>
      <Sky id={id} L={L} />
      {fl.length > 2 && <path d={polyD(proj(L, fl))} fill="#9C8F7A" />}
      {rv.length > 2 && <path d={polyD(proj(L, rv))} fill="#3F7C72" />}
      <path d={gl.join('')} stroke="#E4F4EE" strokeWidth={1.4} strokeOpacity={0.6} strokeLinecap="round" />
      {strips.map((s, i) => (
        <g key={i}>
          <path d={s.d} fill={s.color} stroke={s.color} strokeWidth={0.8} />
          <path d={s.strata} stroke={ROCKDEEP} strokeWidth={1.6} opacity={0.5} fill="none" />
          <path d={s.shrubs} fill={mix(GREEN, '#D9E4E6', Math.min(0.8, Math.max(0, s.dist) / 1100))} />
        </g>
      ))}
    </g>
  );
};
export {GREEN};
