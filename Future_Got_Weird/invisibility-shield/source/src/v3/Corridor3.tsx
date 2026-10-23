// V3 environment: the same night-time research corridor as V2, rebuilt so the loop can match exactly. Everything a
// loop-point camera can see repeats every PERIOD metres along z (one module = PERIOD / 2): ceiling light panels, floor
// tiles, wall seams, a door with a red security indicator on the left wall, a glass lab window with a lit interior on
// the right wall, the amber stripe at 0.98 m and the teal floor lights. Face splits for depth fog are aligned to the
// same grid, indicator blinks complete whole cycles over the film, and beyond 40 m everything fades fully into the fog,
// so the frame at the loop point and the opening frame are the same picture.
// Landmark: the sealed lab door with its light bar, hazard band and sign closes the -z end (the way she runs).
import React from 'react';
import {mix} from '../lib/color';
import {Basis, circle3, d3, fmt, polyD, proj, projPoly, quad, s3, V3, v3} from '../v2/p3';
import {DUR} from '../world';
import {ENV} from '../v2/Corridor';

export const PERIOD = 7.78;
export const MOD = PERIOD / 2;
export const LAY3 = {xw: 1.6, ht: 2.9, zb: -11.67, zf: 62.24};
const loopHz = (f: number) => Math.round(f * DUR) / DUR;

const fogK = (d: number) => (d > 40 ? 1 : 1 - Math.exp(-Math.max(0, d) / 13) * (d > 32 ? 1 - (d - 32) / 8 : 1));
const fogC = (c: string, d: number, k = 0.85) => mix(c, ENV.fog, Math.min(1, fogK(d) * (d > 32 ? 1 : k)));
const depthAt = (b: Basis, p: V3) => d3(s3(p, b.pos), b.fwd);
const frameW = (b: Basis, p: V3, m: number) => Math.min(28, Math.max(1.2, (b.f / Math.max(0.6, proj(b, p).d)) * m));

type Face = {pts: V3[]; fill: string; op?: number; blend?: 'screen'};

export const Corridor3: React.FC<{id: string; b: Basis; cut?: boolean; t: number}> = ({id, b, cut = false, t}) => {
  const {xw, ht, zb, zf} = LAY3;
  const faces: React.ReactNode[] = [];
  let k = 0;
  const vis = (z0: number, z1: number) => {
    // skip modules entirely behind the camera
    const a = depthAt(b, v3(0, 1.4, z0)), c = depthAt(b, v3(0, 1.4, z1));
    return Math.max(a, c) > -2;
  };
  const face = (f: Face) => {
    const pp = projPoly(b, f.pts);
    if (pp.length < 3) return;
    faces.push(<path key={k++} d={polyD(pp)} fill={f.fill} opacity={f.op} style={f.blend ? {mixBlendMode: f.blend} : undefined} />);
  };
  // fog-split faces on a grid aligned to the period
  const seg = (mk: (a: number, c: number) => V3[], base: string, step: number, kf = 0.85) => {
    for (let z = zb; z < zf - 1e-6; z += step) {
      const zz = Math.min(zf, z + step);
      if (!vis(z, zz)) continue;
      const pts = mk(z, zz);
      const cen = pts.reduce((s, p) => v3(s.x + p.x / pts.length, s.y + p.y / pts.length, s.z + p.z / pts.length), v3(0, 0, 0));
      face({pts, fill: fogC(base, depthAt(b, cen), kf)});
    }
  };
  const S8 = PERIOD / 8, S6 = PERIOD / 6;
  // ---- ceiling with two light panels per module
  if (!cut) {
    seg((a, c) => [v3(-xw, ht, a), v3(xw, ht, a), v3(xw, ht, c), v3(-xw, ht, c)], ENV.ceil, S8);
    for (let z = zb + MOD / 4; z < zf; z += MOD / 2) {
      if (!vis(z - 0.8, z + 0.8)) continue;
      face({pts: quad(v3(-0.42, ht - 0.01, z - 0.6), v3(0.84, 0, 0), v3(0, 0, 1.2)), fill: fogC(ENV.light, depthAt(b, v3(0, ht, z)), 0.7)});
      face({pts: quad(v3(-0.55, ht - 0.005, z - 0.75), v3(1.1, 0, 0), v3(0, 0, 1.5)), fill: ENV.teal, op: 0.12, blend: 'screen'});
    }
  }
  // ---- end walls: the lab door at -z; the +z end lies beyond the fog
  const endWall = (z: number) => {
    const dz = 0.001;
    const dd = depthAt(b, v3(0, 1.4, z));
    if (dd < -1) return;
    face({pts: [v3(-xw, 0, z), v3(xw, 0, z), v3(xw, ht, z), v3(-xw, ht, z)], fill: fogC(ENV.wall, dd)});
    const D = (pts: V3[], fill: string, op?: number, blend?: 'screen') => face({pts: pts.map((p) => v3(p.x, p.y, p.z + dz)), fill: fogC(fill, dd, 0.7), op, blend});
    D(quad(v3(-0.78, 0, z), v3(1.56, 0, 0), v3(0, 2.35, 0)), ENV.doorDeep);
    D(quad(v3(-0.74, 0, z), v3(0.72, 0, 0), v3(0, 2.28, 0)), ENV.door);
    D(quad(v3(0.02, 0, z), v3(0.72, 0, 0), v3(0, 2.28, 0)), ENV.door);
    D(quad(v3(-0.5, 1.1, z), v3(0.14, 0, 0), v3(0, 0.8, 0)), ENV.labGlow, 0.85);
    D(quad(v3(0.36, 1.1, z), v3(0.14, 0, 0), v3(0, 0.8, 0)), ENV.labGlow, 0.85);
    D(quad(v3(-0.9, 2.38, z), v3(1.8, 0, 0), v3(0, 0.07, 0)), ENV.teal);
    D(quad(v3(-1.1, 2.3, z), v3(2.2, 0, 0), v3(0, 0.24, 0)), ENV.teal, 0.18, 'screen');
    for (let i = 0; i < 9; i++) D([v3(-0.74 + i * 0.17, 0, z), v3(-0.66 + i * 0.17, 0, z), v3(-0.56 + i * 0.17, 0.16, z), v3(-0.64 + i * 0.17, 0.16, z)], ENV.hazard, 0.9);
    D(quad(v3(-0.36, 2.52, z), v3(0.72, 0, 0), v3(0, 0.2, 0)), '#E8F7F5');
    for (let i = 0; i < 4; i++) D(quad(v3(-0.28 + i * 0.15, 2.57, z), v3(0.09, 0, 0), v3(0, 0.1, 0)), '#16323A');
    D(quad(v3(-1.16, 1.48, z), v3(0.14, 0, 0), v3(0, 0.22, 0)), '#3A1E24');
    const blinkA = 0.6 + 0.4 * Math.max(0, Math.sin(t * 2 * Math.PI * loopHz(0.83)));
    D(circle3(v3(-1.09, 1.59, z + dz * 2), v3(1, 0, 0), v3(0, 1, 0), 0.045, 14), ENV.red, blinkA);
    D(circle3(v3(-1.09, 1.59, z + dz * 3), v3(1, 0, 0), v3(0, 1, 0), 0.16, 18), ENV.red, 0.22 * blinkA, 'screen');
    D(quad(v3(0.92, 1.18, z), v3(0.42, 0, 0), v3(0, 0.3, 0)), '#0F2A33');
    D(quad(v3(0.95, 1.21, z), v3(0.36, 0, 0), v3(0, 0.24, 0)), ENV.labGlow, 0.55);
    [-1.3, 1.3].forEach((x) => D(quad(v3(x, 0, z), v3(0.02, 0, 0), v3(0, ht, 0)), ENV.seam));
  };
  endWall(zb);
  // ---- floor: tiles every PERIOD / 8, two lane lines, reflections of the lights
  seg((a, c) => [v3(-xw, 0, a), v3(xw, 0, a), v3(xw, 0, c), v3(-xw, 0, c)], ENV.floor, S8, 0.9);
  for (let z = zb; z < zf; z += S8) {
    if (!vis(z - 0.1, z + 0.1)) continue;
    face({pts: quad(v3(-xw, 0.001, z), v3(2 * xw, 0, 0), v3(0, 0, 0.018)), fill: fogC(ENV.floorLine, depthAt(b, v3(0, 0, z)))});
  }
  [-0.8, 0.8].forEach((x) => face({pts: quad(v3(x - 0.012, 0.001, zb), v3(0.024, 0, 0), v3(0, 0, zf - zb)), fill: ENV.floorLine, op: 0.8}));
  for (let z = zb + MOD / 4; z < zf; z += MOD / 2) {
    if (!vis(z - 1.2, z + 1.2)) continue;
    face({pts: circle3(v3(0, 0.002, z), v3(1, 0, 0), v3(0, 0, 1), 0.5, 18, 1.1), fill: ENV.light, op: 0.06 * (1 - fogK(depthAt(b, v3(0, 0, z)))), blend: 'screen'});
    face({pts: circle3(v3(0, 0.003, z), v3(1, 0, 0), v3(0, 0, 1), 0.22, 14, 0.7), fill: ENV.light, op: 0.08 * (1 - fogK(depthAt(b, v3(0, 0, z)))), blend: 'screen'});
  }
  // ---- side walls
  const winNodes: React.ReactNode[] = [];
  const wallX = (x: number, sgn: number) => {
    seg((a, c) => [v3(x, 0, a), v3(x, 0, c), v3(x, ht, c), v3(x, ht, a)], ENV.wall, S8);
    const off = -sgn * 0.002;
    const F2 = (pts: V3[], fill: string, op?: number, blend?: 'screen', kf = 0.75) => face({pts: pts.map((p) => v3(p.x + off, p.y, p.z)), fill: fogC(fill, depthAt(b, pts[0]), kf), op, blend});
    seg((a, c) => [v3(x + off, 0, a), v3(x + off, 0, c), v3(x + off, 0.9, c), v3(x + off, 0.9, a)], ENV.wallLo, S8);
    for (let z = zb + S6 / 2; z < zf; z += S6) if (vis(z - 0.1, z + 0.1)) F2(quad(v3(x, 0, z), v3(0, 0, 0.025), v3(0, ht, 0)), ENV.seam);
    const strip = (y: number, h: number, c: string, op?: number, blend?: 'screen', kf = 0.55) => seg((a, cc) => [v3(x + off * 1.5, y, a), v3(x + off * 1.5, y, cc), v3(x + off * 1.5, y + h, cc), v3(x + off * 1.5, y + h, a)], c, S8, kf);
    strip(2.2, 0.02, ENV.seam);
    strip(0.98, 0.035, ENV.amber);
    strip(0.02, 0.04, ENV.teal);
    strip(2.55, 0.09, '#4F6A78');
    F2(quad(v3(x, 0.9, zb), v3(0, 0, zf - zb), v3(0, 0.2, 0)), ENV.amber, 0.1, 'screen', 0.4);
    F2(quad(v3(x, 0.0, zb), v3(0, 0, zf - zb), v3(0, 0.25, 0)), ENV.teal, 0.08, 'screen', 0.4);
    for (let m = 0; zb + m * MOD < zf; m++) {
      const z0 = zb + m * MOD;
      if (sgn < 0) {
        // left wall: a door with a red security indicator
        const z = z0 + MOD * 0.62;
        if (!vis(z - 0.7, z + 0.7)) continue;
        F2(quad(v3(x, 0, z - 0.6), v3(0, 0, 1.2), v3(0, 2.3, 0)), ENV.doorDeep);
        F2(quad(v3(x, 0, z - 0.55), v3(0, 0, 1.1), v3(0, 2.24, 0)), ENV.door);
        F2(quad(v3(x, 1.2, z - 0.1), v3(0, 0, 0.2), v3(0, 0.6, 0)), ENV.labGlow, 0.5);
        F2(quad(v3(x, 1.02, z + 0.38), v3(0, 0, 0.08), v3(0, 0.04, 0)), '#AFC3CB');
        const ba = 0.55 + 0.45 * Math.max(0, Math.sin(t * 2 * Math.PI * loopHz(0.74) + m * 1.7));
        F2(circle3(v3(x + off * 2, 2.45, z), v3(0, 0, 1), v3(0, 1, 0), 0.04, 12), ENV.red, ba, undefined, 0.3);
        F2(circle3(v3(x + off * 3, 2.45, z), v3(0, 0, 1), v3(0, 1, 0), 0.15, 14), ENV.red, 0.2 * ba, 'screen', 0.3);
      } else {
        // right wall: a glass lab window with an interior
        const wz0 = z0 + MOD * 0.18, wz1 = z0 + MOD * 0.82;
        if (!vis(wz0, wz1)) continue;
        const wq = [v3(xw, 0.9, wz0), v3(xw, 0.9, wz1), v3(xw, 2.3, wz1), v3(xw, 2.3, wz0)];
        const wp = projPoly(b, wq);
        if (wp.length < 3) continue;
        const save = faces.length;
        const lx = 3.6;
        face({pts: [v3(lx, 0, wz0 - 1), v3(lx, 0, wz1 + 1), v3(lx, ht, wz1 + 1), v3(lx, ht, wz0 - 1)], fill: fogC(ENV.lab, depthAt(b, v3(lx, 1.5, (wz0 + wz1) / 2)), 0.6)});
        face({pts: [v3(xw, 0.9, wz0 - 1), v3(lx, 0.9, wz0 - 1), v3(lx, 0.9, wz1 + 1), v3(xw, 0.9, wz1 + 1)], fill: fogC('#0B1E25', depthAt(b, v3(2.6, 0.9, (wz0 + wz1) / 2)), 0.6)});
        for (let i = 0; i < 2; i++) {
          const zc = wz0 + 0.55 + i * (wz1 - wz0 - 1.1);
          face({pts: [v3(lx - 0.01, 0.9, zc - 0.35), v3(lx - 0.01, 0.9, zc + 0.35), v3(lx - 0.01, 2.2, zc + 0.35), v3(lx - 0.01, 2.2, zc - 0.35)], fill: fogC('#173A44', depthAt(b, v3(lx, 1.5, zc)), 0.6)});
          for (let j = 0; j < 3; j++) face({pts: circle3(v3(lx - 0.02, 1.3 + j * 0.22, zc + 0.2), v3(0, 0, 1), v3(0, 1, 0), 0.025, 8), fill: j === 1 ? ENV.amber : ENV.labGlow, op: 0.9 * (1 - fogK(depthAt(b, v3(lx, 1.5, zc))))});
        }
        face({pts: [v3(2.4, 1.15, wz0), v3(2.4, 1.15, wz1), v3(2.9, 1.15, wz1), v3(2.9, 1.15, wz0)], fill: fogC('#1E4450', depthAt(b, v3(2.6, 1.15, (wz0 + wz1) / 2)), 0.6)});
        face({pts: [v3(2.65, 1.15, (wz0 + wz1) / 2 - 0.3), v3(2.65, 1.15, (wz0 + wz1) / 2 + 0.3), v3(2.65, 1.6, (wz0 + wz1) / 2 + 0.3), v3(2.65, 1.6, (wz0 + wz1) / 2 - 0.3)], fill: ENV.labGlow, op: 0.6 * (1 - fogK(depthAt(b, v3(2.6, 1.4, (wz0 + wz1) / 2))))});
        face({pts: wq.map((p) => v3(p.x - 0.003, p.y, p.z)), fill: ENV.glass, op: 0.12});
        const rz = wz0 + 0.5;
        face({pts: [v3(xw - 0.004, 2.3, rz), v3(xw - 0.004, 2.3, rz + 0.35), v3(xw - 0.004, 0.9, rz + 0.95), v3(xw - 0.004, 0.9, rz + 0.6)], fill: '#FFFFFF', op: 0.08});
        const inner = faces.splice(save);
        winNodes.push(
          <g key={`w${m}`}>
            <defs>
              <clipPath id={`${id}-win${m}`}>
                <path d={polyD(wp)} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id}-win${m})`}>{inner}</g>
            <path d={polyD(wp)} fill="none" stroke={fogC('#5E7C8A', depthAt(b, v3(xw, 1.6, (wz0 + wz1) / 2)))} strokeWidth={frameW(b, v3(xw, 1.6, (wz0 + wz1) / 2), 0.03)} />
          </g>,
        );
      }
    }
  };
  wallX(-xw, -1);
  const leftN = faces.splice(0);
  wallX(xw, 1);
  const rightN = faces.splice(0);
  const caps: React.ReactNode[] = [];
  if (cut) {
    [[-xw - 0.18, -xw], [xw, xw + 0.18]].forEach(([x0, x1], i) => {
      const pp = projPoly(b, [v3(x0, ht, zb), v3(x1, ht, zb), v3(x1, ht, zf), v3(x0, ht, zf)]);
      caps.push(<path key={`cap${i}`} d={polyD(pp)} fill="#4A6573" />);
    });
  }
  return (
    <g>
      {leftN}
      {rightN}
      {winNodes}
      {caps}
    </g>
  );
};
export {fmt};
