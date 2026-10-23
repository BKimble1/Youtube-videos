// V2 environment: a research-facility corridor at night, built in metres and drawn through whatever camera the shot
// uses (all faces are 3D quads clipped at the near plane and projected, so perspective, depth and parallax are real).
//   main corridor: x in [-1.6, 1.6], y in [0, 2.9], z from the back wall (-4) to the far wall (20)
//   - a side doorway in the left wall (z 1.25..2.35): the corner she comes round
//   - glass lab partitions in the right wall with lit interiors
//   - doors with red security indicators, ceiling light panels, an amber wall strip and a teal floor glow
//   - the back wall behind her (what the shield's lenses smear for the guard): a sliding lab door with a light bar,
//     hazard stripes, a red indicator, a wall screen and a sign
// Depth fog is per face (faces are split along z). `cut` removes the ceiling for the plan view.
import React from 'react';
import {mix} from '../lib/color';
import {Basis, circle3, d3, fmt, polyD, proj, projPoly, quad, s3, V2, V3, v3} from './p3';

export const LAY = {xw: 1.6, ht: 2.9, zb: -4, zf: 20, door: {z0: 1.25, z1: 2.35, h: 2.25}, side: {x: -4.6}};
export const ENV = {
  wall: '#2E4552', wallLo: '#263B47', floor: '#1A242C', floorLine: '#2A3843', ceil: '#141C24', fog: '#08111A',
  amber: '#FFB23F', teal: '#3FE0D0', tealDeep: '#1A8F8A', red: '#FF3B3B', glass: '#7FE6E8', panel: '#365563', seam: '#1D2E38',
  lab: '#0E2A33', labGlow: '#2FD0C4', door: '#3A5462', doorDeep: '#22333E', light: '#DFFBFF', hazard: '#F2B22E',
};

const fogK = (d: number) => 1 - Math.exp(-Math.max(0, d) / 13);
const fogC = (c: string, d: number, k = 0.85) => mix(c, ENV.fog, fogK(d) * k);
const depthAt = (b: Basis, p: V3) => d3(s3(p, b.pos), b.fwd);

type Face = {pts: V3[]; fill: string; op?: number; stroke?: string; sw?: number; blend?: 'screen'};

// frame stroke width in px for a frame member of width m metres, judged at a reference point; the reference can lie
// beside or behind the camera, so its scale is taken at no less than 0.6 m and the width is capped
const frameW = (b: Basis, p: V3, m: number) => Math.min(28, Math.max(1.2, (b.f / Math.max(0.6, proj(b, p).d)) * m));
export const Corridor: React.FC<{id: string; b: Basis; cut?: boolean; t: number; dim?: number}> = ({id, b, cut = false, t, dim = 0}) => {
  const {xw, ht, zb, zf} = LAY;
  const faces: React.ReactNode[] = [];
  let k = 0;
  const face = (f: Face) => {
    const pp = projPoly(b, f.pts);
    if (pp.length < 3) return;
    faces.push(<path key={k++} d={polyD(pp)} fill={f.fill} opacity={f.op} stroke={f.stroke} strokeWidth={f.sw} style={f.blend ? {mixBlendMode: f.blend} : undefined} />);
  };
  const seg = (z0: number, z1: number, mk: (a: number, c: number) => V3[], base: string, step = 1.5, kf = 0.85) => {
    for (let z = z0; z < z1 - 1e-6; z += step) {
      const zz = Math.min(z1, z + step);
      const pts = mk(z, zz);
      const cen = pts.reduce((s, p) => v3(s.x + p.x / pts.length, s.y + p.y / pts.length, s.z + p.z / pts.length), v3(0, 0, 0));
      face({pts, fill: fogC(base, depthAt(b, cen), kf)});
    }
  };
  // ---- ceiling
  if (!cut) {
    seg(zb, zf, (a, c) => [v3(-xw, ht, a), v3(xw, ht, a), v3(xw, ht, c), v3(-xw, ht, c)], ENV.ceil, 2);
    for (let z = zb + 1.5; z < zf; z += 3) {
      face({pts: quad(v3(-0.42, ht - 0.01, z - 0.6), v3(0.84, 0, 0), v3(0, 0, 1.2)), fill: fogC(ENV.light, depthAt(b, v3(0, ht, z)), 0.7)});
      face({pts: quad(v3(-0.55, ht - 0.005, z - 0.75), v3(1.1, 0, 0), v3(0, 0, 1.5)), fill: ENV.teal, op: 0.12, blend: 'screen'});
    }
  }
  // ---- back wall (behind her) and far wall
  const endWall = (z: number, far: boolean) => {
    const dz = far ? -0.001 : 0.001;
    face({pts: [v3(-xw, 0, z), v3(xw, 0, z), v3(xw, ht, z), v3(-xw, ht, z)], fill: fogC(ENV.wall, depthAt(b, v3(0, 1.4, z)))});
    const D = (pts: V3[], fill: string, op?: number, blend?: 'screen') => face({pts: pts.map((p) => v3(p.x, p.y, p.z + dz)), fill: fogC(fill, depthAt(b, v3(0, 1.4, z)), 0.7), op, blend});
    // sliding lab door: two leaves with a centre seam and vertical windows
    D(quad(v3(-0.78, 0, z), v3(1.56, 0, 0), v3(0, 2.35, 0)), ENV.doorDeep);
    D(quad(v3(-0.74, 0, z), v3(0.72, 0, 0), v3(0, 2.28, 0)), ENV.door);
    D(quad(v3(0.02, 0, z), v3(0.72, 0, 0), v3(0, 2.28, 0)), ENV.door);
    D(quad(v3(-0.5, 1.1, z), v3(0.14, 0, 0), v3(0, 0.8, 0)), ENV.labGlow, 0.85);
    D(quad(v3(0.36, 1.1, z), v3(0.14, 0, 0), v3(0, 0.8, 0)), ENV.labGlow, 0.85);
    // light bar over the door, hazard band at its foot
    D(quad(v3(-0.9, 2.38, z), v3(1.8, 0, 0), v3(0, 0.07, 0)), ENV.teal);
    D(quad(v3(-1.1, 2.3, z), v3(2.2, 0, 0), v3(0, 0.24, 0)), ENV.teal, 0.18, 'screen');
    for (let i = 0; i < 9; i++) D([v3(-0.74 + i * 0.17, 0, z), v3(-0.66 + i * 0.17, 0, z), v3(-0.56 + i * 0.17, 0.16, z), v3(-0.64 + i * 0.17, 0.16, z)], ENV.hazard, 0.9);
    // sign above
    D(quad(v3(-0.36, 2.52, z), v3(0.72, 0, 0), v3(0, 0.2, 0)), '#E8F7F5');
    for (let i = 0; i < 4; i++) D(quad(v3(-0.28 + i * 0.15, 2.57, z), v3(0.09, 0, 0), v3(0, 0.1, 0)), '#16323A');
    // red security indicator and a wall screen
    D(quad(v3(-1.16, 1.48, z), v3(0.14, 0, 0), v3(0, 0.22, 0)), '#3A1E24');
    const blinkA = 0.6 + 0.4 * Math.max(0, Math.sin(t * 5.2 + (far ? 1 : 0)));
    D(circle3(v3(-1.09, 1.59, z + dz * 2), v3(1, 0, 0), v3(0, 1, 0), 0.045, 14), ENV.red, blinkA);
    D(circle3(v3(-1.09, 1.59, z + dz * 3), v3(1, 0, 0), v3(0, 1, 0), 0.16, 18), ENV.red, 0.22 * blinkA, 'screen');
    D(quad(v3(0.92, 1.18, z), v3(0.42, 0, 0), v3(0, 0.3, 0)), '#0F2A33');
    D(quad(v3(0.95, 1.21, z), v3(0.36, 0, 0), v3(0, 0.24, 0)), ENV.labGlow, 0.55);
    for (let i = 0; i < 3; i++) D(quad(v3(0.99, 1.26 + i * 0.065, z), v3(0.2 + 0.07 * (i % 2), 0, 0), v3(0, 0.025, 0)), '#E8FFFB', 0.8);
    // panel seams on the wall
    [-1.3, 1.3].forEach((x) => D(quad(v3(x, 0, z), v3(0.02, 0, 0), v3(0, ht, 0)), ENV.seam));
  };
  endWall(zf, true);
  endWall(zb, false);
  // ---- side corridor seen through the doorway (drawn before the left wall)
  const dz0 = LAY.door.z0, dz1 = LAY.door.z1, dh = LAY.door.h, sx = LAY.side.x;
  const doorQ = [v3(-xw, 0, dz0), v3(-xw, 0, dz1), v3(-xw, dh, dz1), v3(-xw, dh, dz0)];
  // ---- floor
  seg(zb, zf, (a, c) => [v3(-xw, 0, a), v3(xw, 0, a), v3(xw, 0, c), v3(-xw, 0, c)], ENV.floor, 1.5, 0.9);
  // floor tile lines (across) and two lane lines (along)
  for (let z = zb; z < zf; z += 1.0) face({pts: quad(v3(-xw, 0.001, z), v3(2 * xw, 0, 0), v3(0, 0, 0.018)), fill: fogC(ENV.floorLine, depthAt(b, v3(0, 0, z)))});
  [-0.8, 0.8].forEach((x) => face({pts: quad(v3(x - 0.012, 0.001, zb), v3(0.024, 0, 0), v3(0, 0, zf - zb)), fill: ENV.floorLine, op: 0.8}));
  // floor reflections of the ceiling lights
  for (let z = zb + 1.5; z < zf; z += 3) {
    face({pts: circle3(v3(0, 0.002, z), v3(1, 0, 0), v3(0, 0, 1), 0.5, 18, 1.1), fill: ENV.light, op: 0.06, blend: 'screen'});
    face({pts: circle3(v3(0, 0.003, z), v3(1, 0, 0), v3(0, 0, 1), 0.22, 14, 0.7), fill: ENV.light, op: 0.08, blend: 'screen'});
  }
  // ---- side walls
  const wallX = (x: number, sgn: number) => {
    seg(zb, zf, (a, c) => [v3(x, 0, a), v3(x, 0, c), v3(x, ht, c), v3(x, ht, a)], ENV.wall, 1.2);
    const off = -sgn * 0.002;
    const F2 = (pts: V3[], fill: string, op?: number, blend?: 'screen', kf = 0.75) => {
      const cen = pts[0];
      face({pts: pts.map((p) => v3(p.x + off, p.y, p.z)), fill: fogC(fill, depthAt(b, cen), kf), op, blend});
    };
    // lower wall band (darker), seams, amber strip at hand height, teal floor glow, top pipe
    seg(zb, zf, (a, c) => [v3(x + off, 0, a), v3(x + off, 0, c), v3(x + off, 0.9, c), v3(x + off, 0.9, a)], ENV.wallLo, 1.2);
    for (let z = zb + 0.6; z < zf; z += 1.2) F2(quad(v3(x, 0, z), v3(0, 0, 0.025), v3(0, ht, 0)), ENV.seam);
    F2(quad(v3(x, 2.2, zb), v3(0, 0, zf - zb), v3(0, 0.02, 0)), ENV.seam);
    F2(quad(v3(x, 0.98, zb), v3(0, 0, zf - zb), v3(0, 0.035, 0)), ENV.amber, 0.95, undefined, 0.55);
    F2(quad(v3(x, 0.9, zb), v3(0, 0, zf - zb), v3(0, 0.2, 0)), ENV.amber, 0.1, 'screen', 0.4);
    F2(quad(v3(x, 0.02, zb), v3(0, 0, zf - zb), v3(0, 0.04, 0)), ENV.teal, 0.9, undefined, 0.5);
    F2(quad(v3(x, 0.0, zb), v3(0, 0, zf - zb), v3(0, 0.25, 0)), ENV.teal, 0.08, 'screen', 0.4);
    F2(quad(v3(x, 2.55, zb), v3(0, 0, zf - zb), v3(0, 0.09, 0)), '#4F6A78');
    // doors with red indicators
    const doors = sgn < 0 ? [8.2, 15.2] : [16.5];
    doors.forEach((z, i) => {
      F2(quad(v3(x, 0, z - 0.6), v3(0, 0, 1.2), v3(0, 2.3, 0)), ENV.doorDeep);
      F2(quad(v3(x, 0, z - 0.55), v3(0, 0, 1.1), v3(0, 2.24, 0)), ENV.door);
      F2(quad(v3(x, 1.2, z - 0.1), v3(0, 0, 0.2), v3(0, 0.6, 0)), ENV.labGlow, 0.5);
      const ba = 0.55 + 0.45 * Math.max(0, Math.sin(t * 4.6 + i * 1.7 + sgn));
      F2(circle3(v3(x + off * 2, 2.45, z), v3(0, 0, 1), v3(0, 1, 0), 0.04, 12), ENV.red, ba, undefined, 0.3);
      F2(circle3(v3(x + off * 3, 2.45, z), v3(0, 0, 1), v3(0, 1, 0), 0.15, 14), ENV.red, 0.2 * ba, 'screen', 0.3);
    });
  };
  // side corridor interior first (seen through the doorway), then the left wall over it with the opening cut out
  const sideInterior = () => {
    const inner: React.ReactNode[] = [];
    const save = faces.length;
    face({pts: [v3(sx, 0, dz0), v3(-xw, 0, dz0), v3(-xw, 0, dz1), v3(sx, 0, dz1)], fill: fogC('#121A22', depthAt(b, v3(-2.5, 0, 1.8)))});
    face({pts: [v3(sx, 0, dz0), v3(-xw, 0, dz0), v3(-xw, dh, dz0), v3(sx, dh, dz0)], fill: fogC('#1E2E38', depthAt(b, v3(-2.5, 1, dz0)))});
    face({pts: [v3(sx, 0, dz1), v3(-xw, 0, dz1), v3(-xw, dh, dz1), v3(sx, dh, dz1)], fill: fogC('#223441', depthAt(b, v3(-2.5, 1, dz1)))});
    face({pts: [v3(sx, 0, dz0), v3(sx, 0, dz1), v3(sx, dh, dz1), v3(sx, dh, dz0)], fill: fogC('#18262F', depthAt(b, v3(sx, 1, 1.8)))});
    face({pts: quad(v3(sx + 0.001, 0.02, dz0), v3(0, 0, dz1 - dz0), v3(0, 0.05, 0)), fill: ENV.teal, op: 0.7});
    face({pts: [v3(sx, dh, dz0), v3(-xw, dh, dz0), v3(-xw, dh, dz1), v3(sx, dh, dz1)], fill: '#0E151C'});
    inner.push(...faces.splice(save));
    return inner;
  };
  // left wall: draw segments, then the doorway hole (clip) with the side corridor inside it
  const leftWallStart = faces.length;
  wallX(-xw, -1);
  const leftWall = faces.splice(leftWallStart);
  const doorPoly = projPoly(b, doorQ);
  const sideNodes = sideInterior();
  // right wall with its glass partitions: lab interiors are drawn inside the window clips after the wall
  const rightStart = faces.length;
  wallX(xw, 1);
  const rightWall = faces.splice(rightStart);
  const windows: [number, number][] = [[3.4, 7.0], [10.2, 13.6]];
  const winNodes: React.ReactNode[] = [];
  windows.forEach(([z0, z1], wi) => {
    const wq = [v3(xw, 0.9, z0), v3(xw, 0.9, z1), v3(xw, 2.3, z1), v3(xw, 2.3, z0)];
    const wp = projPoly(b, wq);
    if (wp.length < 3) return;
    const save = faces.length;
    const lx = 3.6;
    face({pts: [v3(lx, 0, z0 - 1), v3(lx, 0, z1 + 1), v3(lx, ht, z1 + 1), v3(lx, ht, z0 - 1)], fill: fogC(ENV.lab, depthAt(b, v3(lx, 1.5, (z0 + z1) / 2)), 0.6)});
    face({pts: [v3(xw, 0.9, z0 - 1), v3(lx, 0.9, z0 - 1), v3(lx, 0.9, z1 + 1), v3(xw, 0.9, z1 + 1)], fill: '#0B1E25'});
    // cabinets with status lights, a bench, a monitor
    for (let i = 0; i < 3; i++) {
      const zc = z0 + 0.5 + i * ((z1 - z0 - 1) / 2);
      face({pts: [v3(lx - 0.01, 0.9, zc - 0.35), v3(lx - 0.01, 0.9, zc + 0.35), v3(lx - 0.01, 2.2, zc + 0.35), v3(lx - 0.01, 2.2, zc - 0.35)], fill: fogC('#173A44', depthAt(b, v3(lx, 1.5, zc)), 0.6)});
      for (let j = 0; j < 3; j++) face({pts: circle3(v3(lx - 0.02, 1.3 + j * 0.22, zc + 0.2), v3(0, 0, 1), v3(0, 1, 0), 0.025, 8), fill: j === 1 ? ENV.amber : ENV.labGlow, op: 0.9});
    }
    face({pts: [v3(2.4, 1.15, z0), v3(2.4, 1.15, z1), v3(2.9, 1.15, z1), v3(2.9, 1.15, z0)], fill: '#1E4450'});
    face({pts: [v3(2.65, 1.15, (z0 + z1) / 2 - 0.3), v3(2.65, 1.15, (z0 + z1) / 2 + 0.3), v3(2.65, 1.6, (z0 + z1) / 2 + 0.3), v3(2.65, 1.6, (z0 + z1) / 2 - 0.3)], fill: ENV.labGlow, op: 0.6});
    // glass tint and reflections
    face({pts: wq.map((p) => v3(p.x - 0.003, p.y, p.z)), fill: ENV.glass, op: 0.12});
    const rz = z0 + ((t * 0.0 + wi * 1.3) % (z1 - z0));
    face({pts: [v3(xw - 0.004, 2.3, rz), v3(xw - 0.004, 2.3, rz + 0.35), v3(xw - 0.004, 0.9, rz + 0.95), v3(xw - 0.004, 0.9, rz + 0.6)], fill: '#FFFFFF', op: 0.08});
    face({pts: [v3(xw - 0.004, 2.3, rz + 0.5), v3(xw - 0.004, 2.3, rz + 0.6), v3(xw - 0.004, 0.9, rz + 1.2), v3(xw - 0.004, 0.9, rz + 1.1)], fill: '#FFFFFF', op: 0.06});
    const inner = faces.splice(save);
    winNodes.push(
      <g key={`w${wi}`}>
        <defs>
          <clipPath id={`${id}-win${wi}`}>
            <path d={polyD(wp)} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-win${wi})`}>{inner}</g>
        <path d={polyD(wp)} fill="none" stroke="#5E7C8A" strokeWidth={frameW(b, v3(xw, 1.6, (z0 + z1) / 2), 0.03)} />
      </g>,
    );
  });
  // top caps of the walls for the plan view
  const caps: React.ReactNode[] = [];
  if (cut) {
    [[-xw - 0.18, -xw], [xw, xw + 0.18]].forEach(([x0, x1], i) => {
      const pp = projPoly(b, [v3(x0, ht, zb), v3(x1, ht, zb), v3(x1, ht, zf), v3(x0, ht, zf)]);
      caps.push(<path key={`cap${i}`} d={polyD(pp)} fill="#4A6573" />);
    });
  }
  return (
    <g>
      {faces}
      {leftWall}
      {doorPoly.length >= 3 && (
        <g>
          <defs>
            <clipPath id={`${id}-door`}>
              <path d={polyD(doorPoly)} />
            </clipPath>
          </defs>
          <path d={polyD(doorPoly)} fill="#0E151C" />
          <g clipPath={`url(#${id}-door)`}>{sideNodes}</g>
          <path d={polyD(doorPoly)} fill="none" stroke="#5E7C8A" strokeWidth={frameW(b, v3(-xw, 1.2, 1.8), 0.035)} />
        </g>
      )}
      {rightWall}
      {winNodes}
      {caps}
      {dim > 0 && <rect x={-50} y={-50} width={1200} height={2100} fill="#000" opacity={dim} />}
    </g>
  );
};

// ---- the guard's flashlight: a beam volume and a pool where its axis meets the first surface
export const beamHit = (o: V3, dir: V3): {p: V3; n: V3; t: number} | null => {
  const {xw, ht, zb, zf} = LAY;
  const planes: {n: V3; d: number}[] = [
    {n: v3(0, 1, 0), d: 0}, {n: v3(0, -1, 0), d: -ht}, {n: v3(1, 0, 0), d: -xw}, {n: v3(-1, 0, 0), d: -xw},
    {n: v3(0, 0, 1), d: zb}, {n: v3(0, 0, -1), d: -zf},
  ];
  let best: {p: V3; n: V3; t: number} | null = null;
  for (const pl of planes) {
    const den = d3(pl.n, dir);
    if (den >= -1e-6) continue;
    const tt = (pl.d - d3(pl.n, o)) / den;
    if (tt <= 0) continue;
    if (!best || tt < best.t) best = {p: v3(o.x + dir.x * tt, o.y + dir.y * tt, o.z + dir.z * tt), n: pl.n, t: tt};
  }
  return best;
};
export const Flashlight: React.FC<{id: string; b: Basis; o: V3; dir: V3; on: number; occluder?: {c: V3; n: V3; w: number; h: number}}> = ({id, b, o, dir, on, occluder}) => {
  if (on <= 0.01) return null;
  let hit = beamHit(o, dir);
  // the beam can land on the shield's face instead (handled by the caller as a glint); here: surfaces only
  if (!hit) return null;
  if (occluder) {
    const den = d3(occluder.n, dir);
    if (Math.abs(den) > 1e-6) {
      const tt = d3(s3(occluder.c, o), occluder.n) / den;
      if (tt > 0 && tt < hit.t) {
        const p = v3(o.x + dir.x * tt, o.y + dir.y * tt, o.z + dir.z * tt);
        const rel = s3(p, occluder.c);
        if (Math.abs(rel.x) < occluder.w / 2 + 0.05 && Math.abs(rel.y) < occluder.h / 2 + 0.05) hit = {p, n: occluder.n, t: tt};
      }
    }
  }
  const r = hit.t * 0.11; // ~6 degree half-angle
  // in-plane axes of the hit plane
  const n = hit.n;
  const u = Math.abs(n.y) > 0.9 ? v3(1, 0, 0) : v3(0, 1, 0);
  const w = Math.abs(n.y) > 0.9 ? v3(0, 0, 1) : Math.abs(n.x) > 0.9 ? v3(0, 0, 1) : v3(1, 0, 0);
  const lift = (p: V3) => v3(p.x + n.x * 0.004, p.y + n.y * 0.004, p.z + n.z * 0.004);
  const pool = (rr: number) => projPoly(b, circle3(lift(hit!.p), u, w, rr, 28));
  const lens = proj(b, o);
  const outer = pool(r);
  const gid = `${id}-bg`;
  // beam volume: hull of the lens point and the pool outline
  const pts: V2[] = [...outer];
  if (lens.d > 0.05) pts.push({x: lens.x, y: lens.y});
  const hullPts = (() => {
    const p = [...pts].sort((a, c) => a.x - c.x || a.y - c.y);
    if (p.length < 3) return p;
    const cr = (o2: V2, a: V2, c: V2) => (a.x - o2.x) * (c.y - o2.y) - (a.y - o2.y) * (c.x - o2.x);
    const lo: V2[] = [], up: V2[] = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  })();
  const hp = proj(b, hit.p);
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={on}>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={fmt(lens.x)} y1={fmt(lens.y)} x2={fmt(hp.x)} y2={fmt(hp.y)}>
          <stop offset="0" stopColor="#FFF1C8" stopOpacity={0.16} />
          <stop offset="1" stopColor="#FFE7A8" stopOpacity={0.035} />
        </linearGradient>
        <radialGradient id={`${id}-pg`} gradientUnits="userSpaceOnUse" cx={fmt(hp.x)} cy={fmt(hp.y)} r={fmt(Math.max(4, r * hp.k * 1.3))}>
          <stop offset="0" stopColor="#FFF6DC" stopOpacity={0.62} />
          <stop offset="0.5" stopColor="#FFE5A0" stopOpacity={0.28} />
          <stop offset="1" stopColor="#FFD27A" stopOpacity={0} />
        </radialGradient>
      </defs>
      {lens.d > 0.05 && hullPts.length >= 3 && <path d={polyD(hullPts)} fill={`url(#${gid})`} opacity={Math.min(1, Math.max(0, (lens.d - 0.6) / 2.2))} />}
      {outer.length >= 3 && <path d={polyD(pool(r * 1.15))} fill={`url(#${id}-pg)`} />}
      {outer.length >= 3 && <path d={polyD(pool(r * 0.5))} fill="#FFF8E6" opacity={0.16} />}
    </g>
  );
};
export const beamHitPoint = beamHit;
