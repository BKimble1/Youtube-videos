// V2: the side gorge (the Baren River) opening out of the Yangtze's far bank, built into the river set so the payoff
// is one connected flight: across the open water, into the mouth where the walls rise, and on between them. The walls
// rise from bank height at the mouth to 210 m within ~250 m. Each wall is vertical strips along the gorge (inner face),
// toned by its facing to the sun and by a slow tonal noise, with strata, cracks, dark seams, ledge shrubs and hanging
// greenery. The far-bank ridges carry a matching notch (gorgeNotch), so the mouth is a real opening in the hills.
import React from 'react';
import {hash, noise1} from '../dc/math';
import {f2, lit, mix, polyD, proj, shade} from '../eng/draw';
import {clipNear, d3, H, Lens, n3, s3, V3, v3, W} from '../eng/v3';

export type GorgeAt = {ox: number; oz: number};
/** centreline offset at distance u (m) into the gorge */
export const gcx = (u: number) => 14 * Math.sin(u / 160) + 5 * Math.sin(u / 57);
/** wall height scale at distance u: low at the mouth, full height inside */
export const ghk = (u: number) => Math.min(1, 0.13 + Math.max(0, u) / 260);
/** half-width at height y (local, before the height scale) on side s */
export const ghw = (u: number, y: number, s: number) => {
  const base = 26 + 6 * noise1(u / 60, s > 0 ? 3 : 4);
  const ledge = 3.5 * Math.max(0, noise1(y / 22 + u / 90, s > 0 ? 5 : 6));
  return base + y * 0.16 + ledge + 2.5 * noise1(u / 13 + y / 31, s > 0 ? 7 : 8);
};
export const GLEN = 900;
/** is ground point (x, z) inside the gorge cut (for the ridge notch)? */
export const gorgeNotch = (g: GorgeAt, x: number, z: number) => {
  const u = z - g.oz;
  if (u < -4 || u > GLEN) return false;
  return Math.abs(x - (g.ox + gcx(u))) < ghw(u, 40, 1) + 6;
};
const ROCK = '#CDBB9E';
const ROCKDEEP = '#7F705F';
const GREEN = '#6A8F52';
const YS = [0, 8, 20, 34, 50, 70, 92, 118, 146, 176, 210];

export const GorgeWalls: React.FC<{L: Lens; t: number; g: GorgeAt; water?: boolean}> = ({L, t, g, water = true}) => {
  const u0 = Math.max(0, Math.floor((L.pos.z - g.oz - 60) / 7) * 7);
  const strips: {d: string; color: string; dist: number; strata: string; shrubs: string; seams: string}[] = [];
  const P = (u: number, y: number, s: number) => v3(g.ox + gcx(u) + s * ghw(u, y, s), y * ghk(u), g.oz + u);
  for (const s of [-1, 1]) {
    for (let u = u0; u < Math.min(GLEN, u0 + 820); u += 7) {
      const ua = u, ub = u + 7;
      const A = YS.map((y) => P(ua, y, s));
      const Bp = YS.map((y) => P(ub, y, s));
      const cl = clipNear(L, [...A, ...Bp.slice().reverse()], 0.8);
      if (cl.length < 3) continue;
      const pp = proj(L, cl);
      if (pp.every((p) => p.x < -60) || pp.every((p) => p.x > W + 60) || pp.every((p) => p.y > H + 60) || pp.every((p) => p.y < -60)) continue;
      const tang = n3(s3(Bp[4], A[4]));
      const nrm = n3(v3(-s * tang.z, 0.15, s * tang.x));
      const lam = Math.max(0, d3(nrm, n3(v3(0.55, 0.6, -0.3))));
      const tone = mix(shade(ROCK, 0.58), lit(ROCK, 0.18), Math.min(1, Math.max(0, lam * 1.4 + 0.22 * noise1(u / 23, s > 0 ? 17 : 18))));
      const dist = d3(s3(P(u + 3.5, 60, 0), L.pos), L.f);
      const haze = 1 - Math.exp(-Math.max(0, dist) / 1000);
      const seg = (a: V3, b: V3) => {
        const q = clipNear(L, [a, b], 0.8, false);
        if (q.length < 2) return '';
        const pa = L.p(q[0]), pb = L.p(q[1]);
        return `M${f2(pa.x)},${f2(pa.y)}L${f2(pb.x)},${f2(pb.y)}`;
      };
      const st: string[] = [];
      for (const y of [14, 41, 63, 104, 131, 160, 190]) st.push(seg(P(ua, y, s), P(ub, y, s)));
      const sm: string[] = [];
      if (hash(Math.round(u) + (s > 0 ? 900 : 0), 15) > 0.55) {
        const y0 = 5 + hash(Math.round(u), 16) * 60, y1 = y0 + 40 + hash(Math.round(u), 17) * 110;
        sm.push(seg(P(ua, y0, s), P(ua + 1.5, (y0 + y1) / 2, s)), seg(P(ua + 1.5, (y0 + y1) / 2, s), P(ua + 0.5, y1, s)));
      }
      const sh: string[] = [];
      for (let k = 0; k < 4; k++) {
        if (hash(Math.round(u) * 3 + k + (s > 0 ? 500 : 0), 9) > 0.62) continue;
        const y = 10 + hash(Math.round(u) * 5 + k, 10) * 190;
        const q = v3(g.ox + gcx(u + 3.5) + s * (ghw(u + 3.5, y, s) - 0.6), y * ghk(u + 3.5), g.oz + u + 3.5);
        if (d3(s3(q, L.pos), L.f) < 1) continue;
        const p = L.p(q);
        const r = (2.4 + hash(Math.round(u) + k, 11) * 3) * p.k;
        if (r < 0.6 || p.x < -r || p.x > W + r) continue;
        // a clump of three rounded bushes on the ledge
        for (const [dx, dy, rr] of [[-0.7, 0.1, 0.65], [0, -0.25, 0.8], [0.75, 0.05, 0.6]]) {
          const cxp = p.x + dx * r, cyp = p.y + dy * r, R = rr * r;
          sh.push(`M${f2(cxp - R)},${f2(cyp)} a${f2(R)},${f2(R * 0.82)} 0 1,1 ${f2(2 * R)},0 a${f2(R)},${f2(R * 0.5)} 0 1,1 ${f2(-2 * R)},0 Z`);
        }
      }
      strips.push({d: polyD(pp), color: mix(tone, '#D6E2E4', haze * 0.85), dist, strata: st.join(''), shrubs: sh.join(''), seams: sm.join('')});
    }
  }
  strips.sort((a, b) => b.dist - a.dist);
  const floorPts: V3[] = [], riverPts: V3[] = [];
  const uEnd = Math.min(GLEN, u0 + 820);
  for (let u = u0; u <= uEnd; u += 10) floorPts.push(v3(g.ox + gcx(u) - 46, 0, g.oz + u));
  for (let u = uEnd; u >= u0; u -= 10) floorPts.push(v3(g.ox + gcx(u) + 46, 0, g.oz + u));
  for (let u = u0; u <= uEnd; u += 10) riverPts.push(v3(g.ox + gcx(u) - 13 - 4 * Math.max(0, 1 - u / 60) * 4, 0.01, g.oz + u));
  for (let u = uEnd; u >= u0; u -= 10) riverPts.push(v3(g.ox + gcx(u) + 13 + 4 * Math.max(0, 1 - u / 60) * 4, 0.01, g.oz + u));
  const fl = clipNear(L, floorPts, 0.8);
  const rv = clipNear(L, riverPts, 0.8);
  const gl: string[] = [];
  if (water) {
    for (let u = Math.max(0, Math.floor((L.pos.z - g.oz) / 4) * 4); u < L.pos.z - g.oz + 300 && u < GLEN; u += 4) {
      for (let k = 0; k < 2; k++) {
        const x = g.ox + gcx(u) + (hash(u * 2 + k, 13) - 0.5) * 22 - ((t * 1.2) % 4);
        const q = v3(x, 0.02, g.oz + u + hash(u + k, 14) * 4);
        if (d3(s3(q, L.pos), L.f) < 1) continue;
        const a = L.p(v3(q.x - 0.9, 0.02, q.z)), b = L.p(v3(q.x + 0.9, 0.02, q.z));
        gl.push(`M${f2(a.x)},${f2(a.y)}L${f2(b.x)},${f2(b.y)}`);
      }
    }
  }
  return (
    <g>
      {fl.length > 2 && <path d={polyD(proj(L, fl))} fill="#9A8C77" />}
      {rv.length > 2 && <path d={polyD(proj(L, rv))} fill="#3E7A70" />}
      <path d={gl.join('')} stroke="#E4F4EE" strokeWidth={1.5} strokeOpacity={0.6} strokeLinecap="round" />
      {strips.map((s, i) => (
        <g key={i}>
          <path d={s.d} fill={s.color} stroke={s.color} strokeWidth={0.8} />
          <path d={s.strata} stroke={ROCKDEEP} strokeWidth={1.7} opacity={0.5} fill="none" />
          <path d={s.seams} stroke="#5E5245" strokeWidth={2.4} opacity={0.55} fill="none" strokeLinecap="round" />
          <path d={s.shrubs} fill={mix(GREEN, '#D6E2E4', Math.min(0.8, Math.max(0, s.dist) / 1200))} />
        </g>
      ))}
    </g>
  );
};
