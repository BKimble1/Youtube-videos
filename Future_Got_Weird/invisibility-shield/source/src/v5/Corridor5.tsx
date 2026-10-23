// V4 corridor: an after-hours research corridor drawn as flat, ink-outlined illustration planes (walls, floor tiles,
// doors, lab windows, a notice board, ceiling light panels, the sealed lab door at the far end) placed in one
// perspective space, so a camera move gives parallax between the layers without any 3D modelling or lighting.
// Every element darkens with distance (night air) by colour mixing. The corridor repeats every MOD metres along Z,
// which is what lets the last frame continue into the first.
import React from 'react';
import {B, dot3, pathOf, proj, projPoly, sub3, V3, v3} from './geo5';
import {LAY} from './layout5';

export const NIGHT = {
  fog: '#0A151B',
  ink: '#0B1A21',
  wallUp: '#2E5A6A', wallLo: '#224654', stripe: '#D2A043', skirt: '#163039',
  floor: '#28424F', floorLine: '#335A6B', ceil: '#1A3240', ceilLine: '#24414F',
  door: '#3A6878', doorFrame: '#5C93A2', glowTeal: '#86DCD5', glowWarm: '#F2C77A', dark: '#11252D',
  board: '#8A6440', paperA: '#F4EFE3', paperB: '#EF8A72', paperC: '#7FC7C0',
  ext: '#E2553F', extDark: '#9E3426', lightPanel: '#BFE3E6', pipe: '#3E6573', sign: '#3FD18A',
  endDoor: '#41646F', hazard: '#E9B23A',
};
const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const mixHex = (a: string, b: string, t: number) => {
  const x = hex(a), y = hex(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
export const fogAt = (d: number) => 1 - Math.exp(-Math.max(0, d - 2.2) / 6.5);
const inkW = (d: number) => Math.max(0.7, Math.min(3.4, 7.5 / Math.max(d, 0.5)));

type El = {pts: V3[]; fill: string; stroke?: boolean; op?: number; glow?: boolean; sw?: number};

const X0 = -LAY.halfW, X1 = LAY.halfW, YC = LAY.height;
const wallQ = (x: number, z0: number, z1: number, y0: number, y1: number): V3[] => [v3(x, y0, z0), v3(x, y0, z1), v3(x, y1, z1), v3(x, y1, z0)];
const floorQ = (y: number, x0: number, x1: number, z0: number, z1: number): V3[] => [v3(x0, y, z0), v3(x1, y, z0), v3(x1, y, z1), v3(x0, y, z1)];
// tiny offset off the wall so details sit on top of the wall plane
const E = 0.004;

/** Elements of one module starting at z (detail on both walls, ceiling panel, floor joints). */
const moduleEls = (z: number): El[] => {
  const M = LAY.mod, els: El[] = [];
  const xr = X1 - E, xl = X0 + E;
  // +X wall: lab door, extinguisher, lab window
  const d0 = z + M * 0.1, d1 = d0 + 0.95;
  els.push({pts: wallQ(xr, d0 - 0.08, d1 + 0.08, 0, 2.18), fill: NIGHT.doorFrame, stroke: true});
  els.push({pts: wallQ(xr - E, d0, d1, 0.02, 2.1), fill: NIGHT.door, stroke: true});
  els.push({pts: wallQ(xr - 2 * E, d0 + 0.28, d0 + 0.52, 1.22, 1.86), fill: NIGHT.glowTeal, stroke: true, glow: true});
  els.push({pts: wallQ(xr - 2 * E, d1 - 0.2, d1 - 0.08, 0.98, 1.04), fill: NIGHT.stripe, stroke: true});
  const e0 = d1 + 0.12;
  els.push({pts: wallQ(xr, e0, e0 + 0.26, 0.62, 1.32), fill: NIGHT.dark, stroke: true});
  els.push({pts: wallQ(xr - E, e0 + 0.06, e0 + 0.2, 0.68, 1.16), fill: NIGHT.ext, stroke: true});
  els.push({pts: wallQ(xr - 2 * E, e0 + 0.09, e0 + 0.17, 1.16, 1.24), fill: NIGHT.extDark, stroke: true});
  const w0 = z + M * 0.64, w1 = z + M * 0.97;
  els.push({pts: wallQ(xr, w0 - 0.06, w1 + 0.06, 1.1, 2.08), fill: NIGHT.doorFrame, stroke: true});
  els.push({pts: wallQ(xr - E, w0, w1, 1.16, 2.02), fill: '#173A45', stroke: true});
  // lab interior silhouettes behind the glass: a bench line and a few glassware shapes, lit from inside
  els.push({pts: wallQ(xr - 2 * E, w0, w1, 1.16, 1.36), fill: '#0E252D'});
  // lab equipment behind the glass: round flasks, a stand, a microscope, a monitor glowing on the bench
  const wp = (pts: [number, number][], dx = 2 * E) => pts.map(([zz, yy]) => v3(xr - dx, yy, zz));
  const fl = (zc: number, r: number, neck: number, col: string) => {
    const ring: [number, number][] = [];
    for (let a = 0; a < 14; a++) {
      const ang = Math.PI * 0.62 + (a / 13) * Math.PI * 1.76;
      ring.push([zc + Math.cos(ang) * r, 1.36 + r + Math.sin(ang) * r]);
    }
    ring.push([zc + r * 0.28, 1.36 + 2 * r + neck], [zc - r * 0.28, 1.36 + 2 * r + neck]);
    els.push({pts: wp(ring), fill: col, stroke: true, op: 0.95});
  };
  fl(w0 + (w1 - w0) * 0.16, 0.075, 0.09, '#3FA9A3');
  fl(w0 + (w1 - w0) * 0.33, 0.05, 0.12, '#58C7BF');
  els.push({pts: wp([[w0 + (w1 - w0) * 0.48, 1.36], [w0 + (w1 - w0) * 0.5, 1.36], [w0 + (w1 - w0) * 0.5, 1.62], [w0 + (w1 - w0) * 0.48, 1.62]]), fill: '#244E57', stroke: true});
  els.push({pts: wp([[w0 + (w1 - w0) * 0.6, 1.36], [w0 + (w1 - w0) * 0.72, 1.36], [w0 + (w1 - w0) * 0.7, 1.42], [w0 + (w1 - w0) * 0.68, 1.6], [w0 + (w1 - w0) * 0.74, 1.66], [w0 + (w1 - w0) * 0.71, 1.7], [w0 + (w1 - w0) * 0.63, 1.58], [w0 + (w1 - w0) * 0.66, 1.42]]), fill: '#1C3F48', stroke: true});
  els.push({pts: wp([[w0 + (w1 - w0) * 0.8, 1.5], [w0 + (w1 - w0) * 0.96, 1.5], [w0 + (w1 - w0) * 0.96, 1.66], [w0 + (w1 - w0) * 0.8, 1.66]]), fill: '#86DCD5', stroke: true, glow: true, op: 0.9});
  els.push({pts: wallQ(xr - 3 * E, w0, w1, 1.7, 1.72), fill: '#2D6670'});
  // -X wall: door, notice board with blank sheets, emergency light
  const g0 = z + M * 0.58, g1 = g0 + 0.95;
  els.push({pts: wallQ(xl, g0 - 0.08, g1 + 0.08, 0, 2.18), fill: NIGHT.doorFrame, stroke: true});
  els.push({pts: wallQ(xl + E, g0, g1, 0.02, 2.1), fill: NIGHT.door, stroke: true});
  els.push({pts: wallQ(xl + 2 * E, g0 + 0.43, g0 + 0.67, 1.22, 1.86), fill: (Math.round(z / M) % 2) ? NIGHT.glowWarm : NIGHT.dark, stroke: true, glow: true});
  const n0 = z + M * 0.1, n1 = n0 + 1.0;
  els.push({pts: wallQ(xl, n0, n1, 1.18, 1.86), fill: NIGHT.board, stroke: true});
  [[0.08, 0.3, 1.32, 1.74, NIGHT.paperA], [0.36, 0.55, 1.46, 1.8, NIGHT.paperC], [0.6, 0.9, 1.26, 1.62, NIGHT.paperA], [0.66, 0.86, 1.66, 1.8, NIGHT.paperB]].forEach(([a, bb, y0, y1, c]) => {
    els.push({pts: wallQ(xl + E, n0 + (n1 - n0) * (a as number), n0 + (n1 - n0) * (bb as number), y0 as number, y1 as number), fill: c as string, stroke: true});
  });
  els.push({pts: wallQ(xl + E, z + M * 0.97 - 0.1, z + M * 0.97 + 0.1, 2.26, 2.38), fill: NIGHT.sign, stroke: true, glow: true});
  // ceiling light panel (dim, night mode)
  els.push({pts: floorQ(YC - E, -0.32, 0.32, z + M * 0.35, z + M * 0.35 + 0.9), fill: NIGHT.lightPanel, stroke: true, glow: true, op: 0.8});
  return els;
};

export const Corridor4: React.FC<{b: B; zMin?: number; zMax?: number}> = ({b, zMin, zMax}) => {
  const c = b.c.pos;
  const M = LAY.mod;
  const lo = zMin ?? c.z - 18, hi = Math.min(zMax ?? c.z + 18, LAY.endZ);
  const k0 = Math.floor((lo - LAY.z0) / M), k1 = Math.ceil((hi - LAY.z0) / M);
  const dist = (p: V3) => Math.max(0.05, dot3(sub3(p, c), b.fwd));
  const nodes: React.ReactNode[] = [];
  const defs: React.ReactNode[] = [];
  // big planes per half module with a fog gradient along Z
  const plane = (key: string, pts: V3[], col: string, za: number, zb: number, refY: number, refX: number) => {
    const P = projPoly(b, pts);
    if (P.length < 3) return;
    const pa = proj(b, v3(refX, refY, za)), pb = proj(b, v3(refX, refY, zb));
    const fa = fogAt(dist(v3(refX, refY, za))), fb = fogAt(dist(v3(refX, refY, zb)));
    defs.push(
      <linearGradient key={`g${key}`} id={`cg${key}`} gradientUnits="userSpaceOnUse" x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}>
        <stop offset="0" stopColor={mixHex(col, NIGHT.fog, fa)} />
        <stop offset="1" stopColor={mixHex(col, NIGHT.fog, fb)} />
      </linearGradient>,
    );
    nodes.push(<path key={key} d={pathOf(P)} fill={`url(#cg${key})`} />);
  };
  const half = M / 2;
  for (let k = k0; k < k1; k++) {
    for (let h = 0; h < 2; h++) {
      const za = LAY.z0 + k * M + h * half, zb = za + half;
      if (zb < lo || za > hi) continue;
      const key = `${k}_${h}`;
      plane(`f${key}`, floorQ(0, X0, X1, za, zb), NIGHT.floor, za, zb, 0, 0);
      plane(`c${key}`, floorQ(YC, X0, X1, za, zb), NIGHT.ceil, za, zb, YC, 0);
      plane(`wr${key}`, wallQ(X1, za, zb, 1.02, YC), NIGHT.wallUp, za, zb, 1.6, X1);
      plane(`wrl${key}`, wallQ(X1, za, zb, 0, 1.02), NIGHT.wallLo, za, zb, 0.5, X1);
      plane(`wl${key}`, wallQ(X0, za, zb, 1.02, YC), NIGHT.wallUp, za, zb, 1.6, X0);
      plane(`wll${key}`, wallQ(X0, za, zb, 0, 1.02), NIGHT.wallLo, za, zb, 0.5, X0);
    }
  }
  // lines and details
  const line = (key: string, a: V3, c2: V3, col: string, w = 1) => {
    const P = projPoly(b, [a, c2]);
    if (P.length < 2) return;
    const d = dist(lerpMid(a, c2));
    nodes.push(<line key={key} x1={P[0].x} y1={P[0].y} x2={P[1].x} y2={P[1].y} stroke={mixHex(col, NIGHT.fog, fogAt(d))} strokeWidth={inkW(d) * w} strokeLinecap="round" />);
  };
  const lerpMid = (a: V3, c2: V3) => v3((a.x + c2.x) / 2, (a.y + c2.y) / 2, (a.z + c2.z) / 2);
  for (let k = k0; k < k1; k++) {
    const z = LAY.z0 + k * M;
    if (z > hi || z + M < lo) continue;
    // floor joints: across every fifth of a module, along at thirds of the width
    for (let i = 0; i < 5; i++) {
      const zz = z + (M * i) / 5;
      if (zz > lo && zz < hi) line(`fl${k}_${i}`, v3(X0, 0.002, zz), v3(X1, 0.002, zz), NIGHT.floorLine, 0.8);
    }
    [-0.43, 0.43].forEach((x, i) => line(`fz${k}_${i}`, v3(x, 0.002, Math.max(z, lo)), v3(x, 0.002, Math.min(z + M, hi)), NIGHT.floorLine, 0.8));
    // wall bands: saffron stripe and skirting
    [X0, X1].forEach((x, i) => {
      const xe = x + (i ? -E : E);
      const za = Math.max(z, lo), zb = Math.min(z + M, hi);
      if (zb <= za) return;
      const st = projPoly(b, wallQ(xe, za, zb, 0.98, 1.05));
      const dm = dist(v3(x, 1, (za + zb) / 2));
      if (st.length > 2) nodes.push(<path key={`st${k}${i}`} d={pathOf(st)} fill={mixHex(NIGHT.stripe, NIGHT.fog, fogAt(dm))} />);
      const sk = projPoly(b, wallQ(xe, za, zb, 0, 0.1));
      if (sk.length > 2) nodes.push(<path key={`sk${k}${i}`} d={pathOf(sk)} fill={mixHex(NIGHT.skirt, NIGHT.fog, fogAt(dm))} />);
      // pipe along the top of the -X wall
      if (!i) {
        const pp = projPoly(b, wallQ(xe + 0.002, za, zb, 2.48, 2.58));
        if (pp.length > 2) nodes.push(<path key={`pp${k}`} d={pathOf(pp)} fill={mixHex(NIGHT.pipe, NIGHT.fog, fogAt(dm))} stroke={mixHex(NIGHT.ink, NIGHT.fog, fogAt(dm))} strokeWidth={inkW(dm) * 0.8} />);
      }
    });
    // corners where walls meet floor and ceiling
    [[X0, 0], [X1, 0], [X0, YC], [X1, YC]].forEach(([x, y], i) => line(`cn${k}_${i}`, v3(x, y, Math.max(z, lo)), v3(x, y, Math.min(z + M, hi)), NIGHT.ink, 1.1));
    moduleEls(z).forEach((el, i) => {
      const zc = el.pts.reduce((s, p) => s + p.z, 0) / el.pts.length;
      if (zc < lo - 1 || zc > hi + 1) return;
      const P = projPoly(b, el.pts);
      if (P.length < 3) return;
      const ctr = v3(el.pts.reduce((s, p) => s + p.x, 0) / el.pts.length, el.pts.reduce((s, p) => s + p.y, 0) / el.pts.length, zc);
      const d = dist(ctr);
      const fog = fogAt(d) * (el.glow ? 0.55 : 1);
      nodes.push(<path key={`m${k}_${i}`} d={pathOf(P)} fill={mixHex(el.fill, NIGHT.fog, fog)} opacity={el.op ?? 1} stroke={el.stroke ? mixHex(NIGHT.ink, NIGHT.fog, fogAt(d)) : 'none'} strokeWidth={inkW(d)} strokeLinejoin="round" />);
      if (el.glow) {
        const q = proj(b, ctr);
        const r = (b.c.f * 0.55) / d;
        nodes.push(<circle key={`gl${k}_${i}`} cx={q.x} cy={q.y} r={r} fill="url(#cglow)" opacity={0.35 * (1 - fogAt(d) * 0.6)} />);
      }
    });
    // light pool on the floor under each ceiling panel
    const lp = projPoly(b, floorQ(0.003, -0.9, 0.9, z + M * 0.35 - 0.5, z + M * 0.35 + 1.4));
    const dl = dist(v3(0, 0, z + M * 0.35 + 0.45));
    if (lp.length > 2) nodes.push(<path key={`lp${k}`} d={pathOf(lp)} fill="url(#cpool)" opacity={0.35 * (1 - fogAt(dl))} />);
  }
  // the sealed lab door that closes the far end
  if (hi >= LAY.endZ - 0.01 && b.fwd.z > 0.2) {
    const ez = LAY.endZ;
    const P = projPoly(b, [v3(X0, 0, ez), v3(X1, 0, ez), v3(X1, YC, ez), v3(X0, YC, ez)]);
    const d = dist(v3(0, 1.2, ez));
    const fg = fogAt(d);
    const col = (h: string) => mixHex(h, NIGHT.fog, fg);
    if (P.length > 2) {
      nodes.push(<path key="end" d={pathOf(P)} fill={col('#25404A')} />);
      const dd = projPoly(b, [v3(-0.95, 0, ez - E), v3(0.95, 0, ez - E), v3(0.95, 2.3, ez - E), v3(-0.95, 2.3, ez - E)]);
      nodes.push(<path key="endd" d={pathOf(dd)} fill={col(NIGHT.endDoor)} stroke={col(NIGHT.ink)} strokeWidth={inkW(d)} />);
      const hz = projPoly(b, [v3(-1.05, 2.3, ez - E), v3(1.05, 2.3, ez - E), v3(1.05, 2.42, ez - E), v3(-1.05, 2.42, ez - E)]);
      nodes.push(<path key="endh" d={pathOf(hz)} fill={col(NIGHT.hazard)} stroke={col(NIGHT.ink)} strokeWidth={inkW(d)} />);
      const seam = projPoly(b, [v3(0, 0, ez - 2 * E), v3(0, 2.3, ez - 2 * E)]);
      if (seam.length > 1) nodes.push(<line key="ends" x1={seam[0].x} y1={seam[0].y} x2={seam[1].x} y2={seam[1].y} stroke={col(NIGHT.ink)} strokeWidth={inkW(d)} />);
      // one wide wired-glass window across both leaves (lit from the lab beyond)
      const win = projPoly(b, [v3(-0.7, 1.35, ez - 2 * E), v3(0.7, 1.35, ez - 2 * E), v3(0.7, 1.75, ez - 2 * E), v3(-0.7, 1.75, ez - 2 * E)]);
      nodes.push(<path key="epw" d={pathOf(win)} fill={mixHex(NIGHT.glowTeal, NIGHT.fog, fg * 0.6)} stroke={col(NIGHT.ink)} strokeWidth={inkW(d)} />);
      const q = proj(b, v3(0, 1.55, ez));
      nodes.push(<circle key="epg" cx={q.x} cy={q.y} r={(b.c.f * 1.1) / d} fill="url(#cglow)" opacity={0.4} />);
    }
  }
  return (
    <g>
      <defs>
        {defs}
        <radialGradient id="cglow"><stop offset="0" stopColor="#9FE6E0" stopOpacity={0.55} /><stop offset="1" stopColor="#9FE6E0" stopOpacity={0} /></radialGradient>
        <radialGradient id="cpool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#7FB9C2" stopOpacity={0.6} /><stop offset="1" stopColor="#7FB9C2" stopOpacity={0} /></radialGradient>
      </defs>
      {nodes}
    </g>
  );
};
export type {El};
