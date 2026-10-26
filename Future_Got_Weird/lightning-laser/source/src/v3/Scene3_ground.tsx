// V3 scenery: the summit rock. A low-poly mesh on a polar grid round the tower (a built platform at the top for the
// tower footing, a level ledge at -19.2 m on the -X side for the laser terrace), flat-shaded from the cool storm key
// light plus the discharge's local light, with an ink silhouette (contour edges) and a few crease lines so the summit
// outline reads at any angle. Far facets fade a little toward the haze.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash} from '../dc/math';
import {Cam3, cross3, dot3, len3, mul3, norm3, projector, sub3, v3, V3} from '../v2/p3';
import {LOW_BOLT, lightAt} from './Scene3_light';
import {elevOf, skyAt} from './Scene3_sky';

/** the platform the tower stands on: rock rim radius and level (m); the retaining wall (Tower3D) stands on it */
export const PLAT_R = 14.6, PLAT_Y = -2.5;

const R = [0, PLAT_R, 18, 25, 38, 52, 70, 95, 130, 175, 230, 300, 380, 470];
const NA = 40;
const hAt = (r: number, a: number, i: number, j: number) => {
  if (r <= PLAT_R + 0.01) return PLAT_Y;
  if (r <= 18.5) return PLAT_Y - 0.4 - 1.4 * hash(i * 97 + j, 509);
  let h = -Math.pow(r - 12, 1.12) * (0.5 + 0.28 * (0.5 + 0.5 * Math.sin(a * 3 + 1.3)) + 0.14 * Math.sin(a * 7)) - 9 * hash(i * 97 + j, 501) * (r > 20 ? 1 : 0);
  // the laser terrace: a level ledge at -19.2 m round the -X direction (angle near pi)
  const da = Math.abs(((a - Math.PI + 9.42) % 6.283) - 3.1416);
  if (r >= 30 && r <= 66 && da < 0.42) h = -19.2 - (r > 60 ? (r - 60) * 1.2 : 0);
  return h;
};
type Tri = {a: number; b: number; c: number; n: V3; m: V3};
const MESH = (() => {
  // one centre vertex, then NA vertices per ring
  const V: V3[] = [v3(0, PLAT_Y, 0)];
  R.forEach((r, i) => {
    if (i === 0) return;
    for (let j = 0; j < NA; j++) {
      const a = (j / NA) * 6.2832 + (i % 2) * (3.1416 / NA);
      const rr = r * (1 + 0.12 * (hash(i * 31 + j, 503) - 0.5) * (r > 30 ? 1 : 0));
      V.push(v3(Math.cos(a) * rr, hAt(rr, a, i, j), Math.sin(a) * rr));
    }
  });
  const id = (i: number, j: number) => (i === 0 ? 0 : 1 + (i - 1) * NA + (j % NA));
  const ringOf = (u: number) => (u === 0 ? 0 : 1 + Math.floor((u - 1) / NA));
  const tris: Tri[] = [];
  const add = (a: number, b: number, c: number) => {
    const n0 = cross3(sub3(V[b], V[a]), sub3(V[c], V[a]));
    if (len3(n0) < 1e-6) return;
    let n = norm3(n0);
    if (n.y < 0) n = mul3(n, -1);
    tris.push({a, b, c, n, m: v3((V[a].x + V[b].x + V[c].x) / 3, (V[a].y + V[b].y + V[c].y) / 3, (V[a].z + V[b].z + V[c].z) / 3)});
  };
  for (let i = 0; i + 1 < R.length; i++) for (let j = 0; j < NA; j++) {
    const a = id(i, j), b = id(i, j + 1), c = id(i + 1, j), d = id(i + 1, j + 1);
    add(a, c, d);
    add(a, d, b);
  }
  // edges with their one or two triangles
  const em = new Map<string, {u: number; w: number; t: number[]}>();
  tris.forEach((t, k) => {
    for (const [u, w] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) {
      const key = u < w ? `${u}-${w}` : `${w}-${u}`;
      const e = em.get(key);
      if (e) e.t.push(k);
      else em.set(key, {u, w, t: [k]});
    }
  });
  const edges = [...em.values()].map((e) => ({
    ...e,
    crease: e.t.length === 2 ? Math.acos(clamp(dot3(tris[e.t[0]].n, tris[e.t[1]].n), -1, 1)) : 0,
    outer: ringOf(e.u) === R.length - 1 && ringOf(e.w) === R.length - 1,
  }));
  return {V, tris, edges};
})();

const LIGHT3 = norm3(v3(-0.4, 0.85, -0.35));
export const Summit3D: React.FC<{cam: Cam3; flash: number}> = ({cam, flash}) => {
  const P = projector(cam);
  const PV = MESH.V.map(P);
  const items: {z: number; el: React.ReactNode}[] = [];
  const front = MESH.tris.map((t) => dot3(t.n, sub3(cam.pos, t.m)) > 0);
  // a facet reaching behind the camera is clipped at a near plane (not dropped: a camera low over the terrace has
  // big facets beside it, and dropping one opened a hole to the sky in a single frame, V4 W-6)
  const ZN = 0.31; // (the projector's own limit: every facet drawn before is drawn exactly as before)
  const clipped = (ids: number[]) => {
    if (ids.every((i) => PV[i].z >= ZN)) return ids.map((i) => PV[i]);
    const out: {x: number; y: number}[] = [];
    for (let i = 0; i < ids.length; i++) {
      const a = ids[i], b = ids[(i + 1) % ids.length];
      const za = PV[a].z, zb = PV[b].z;
      if (za >= ZN) out.push(PV[a]);
      if ((za - ZN) * (zb - ZN) < 0) {
        const u = (ZN - za) / (zb - za), A = MESH.V[a], B = MESH.V[b];
        out.push(P(v3(A.x + (B.x - A.x) * u, A.y + (B.y - A.y) * u, A.z + (B.z - A.z) * u)));
      }
    }
    return out;
  };
  const polys = MESH.tris.map((t) => clipped([t.a, t.b, t.c]));
  const vis = polys.map((q) => {
    if (q.length < 3) return false;
    const xs = q.map((p) => p.x), ys = q.map((p) => p.y);
    return !(Math.max(...xs) < -50 || Math.min(...xs) > 1130 || Math.max(...ys) < -50 || Math.min(...ys) > 1970);
  });
  // every camera is above the rock surface (a height field), so a facet turned away from it is always hidden behind
  // one turned toward it: skip those (no painter's-order overdraw at the platform rim, half the paths)
  MESH.tris.forEach((t, k) => {
    if (!vis[k] || !front[k]) return;
    const q = polys[k];
    const lam = clamp(dot3(t.n, LIGHT3) * 0.8 + 0.2);
    const base = mix('#111A22', '#4A5862', lam * lam);
    // the discharge lights the rock near the tower (falls off with distance; faces turned to the bolt catch most)
    const k2 = flash * lightAt(t.m, LOW_BOLT, 115, t.n);
    const haze = clamp((len3(sub3(t.m, cam.pos)) - 220) / 1400) * 0.55;
    const col = mix(mix(base, '#A3ADE6', 0.85 * k2), skyAt(elevOf(cam, t.m), flash), haze);
    const d = `M${q.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} Z`;
    // (depth from the facet's own vertices, as before, so the painter's order of whole facets is unchanged)
    items.push({z: (PV[t.a].z + PV[t.b].z + PV[t.c].z) / 3, el: <path key={`t${k}`} d={d} fill={col} stroke={col} strokeWidth={1.2} strokeLinejoin="round" />});
  });
  // ink: the silhouette (an edge between a facet turned to the camera and one turned away) and the sharper creases
  MESH.edges.forEach((e, k) => {
    if (e.outer) return;
    const ce = clipped([e.u, e.w]);
    if (ce.length < 2) return;
    const pu = {...ce[0], z: PV[e.u].z}, pw = {...ce[1], z: PV[e.w].z};
    const anyVis = e.t.some((ti) => vis[ti]);
    if (!anyVis) return;
    const fr = e.t.map((ti) => front[ti]);
    const contour = e.t.length === 2 ? fr[0] !== fr[1] : fr[0];
    const crease = !contour && e.crease > 0.5 && fr.every(Boolean);
    if (!contour && !crease) return;
    const z = (pu.z + pw.z) / 2;
    const w = contour ? clamp((cam.f * 0.012) / Math.max(1, z) * 40, 1.6, 3.4) : 1.3;
    items.push({
      z: z - 0.3,
      el: <path key={`e${k}`} d={`M${fmt(pu.x)},${fmt(pu.y)} L${fmt(pw.x)},${fmt(pw.y)}`} stroke="#0B151C" strokeOpacity={contour ? 0.85 : 0.3} strokeWidth={fmt(w)} strokeLinecap="round" fill="none" />,
    });
  });
  items.sort((p, q) => q.z - p.z);
  return <g>{items.map((it) => it.el)}</g>;
};
