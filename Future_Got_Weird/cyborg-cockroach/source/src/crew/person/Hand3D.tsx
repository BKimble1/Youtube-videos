// Her near (right) hand lying palm-down on the floor, as projected solids (for S15's extreme low close-up, where the 2D
// survivor card cannot hold perspective): forearm, palm, thumb and four fingers as ellipsoids in the hand frame, each
// with the crew's ink contour and skin fill lit from the fixed upper-left key light. Hand frame: origin at the middle
// fingertip on the floor, x = the way the fingers point, y up, z toward the little finger (right hand, palm down).
import React from 'react';
import {Cam, depth, proj, scaleAt} from '../../lib/cam';
import {Frame, V3, toW} from '../../lib/v3';
import {ellContour, closedPath, centroid, extent, EllW} from '../../lib/g3';
import {Inked} from '../../lib/ink';
import {Blob, SoftShadow} from '../../lib/shade';
import {ypr} from '../../lib/v3';
import {noise1} from '../../lib/ease';
import {PERSON} from './cast';

type Part = {name: string; c: V3; r: V3; yaw?: number; pitch?: number; base?: V3; color?: string};
const SKIN = PERSON.skin;
const NAIL = '#FBE4D8';
/** the hand at rest: fingers arched (knuckles up, fingertips on the floor), a little apart (mm, hand frame) */
const parts = (t: number, relax: number): Part[] => {
  const tw = (k: number) => 0.03 * noise1(t * 0.7 + k * 3.1); // tiny living drift of the fingers
  const out: Part[] = [
    {name: 'forearm', c: [-330, 31, 10], r: [175, 31, 40], yaw: 0.04},
    {name: 'palm', c: [-122, 19, 0], r: [58, 19, 46]},
    {name: 'thumb', c: [-100, 13, -52], r: [36, 12, 13], yaw: 0.5 + 0.1 * relax, pitch: -0.12},
  ];
  // [name, knuckle z, proximal length, distal length, radius, yaw]
  const F: [string, number, number, number, number, number][] = [
    ['index', -30, 38, 30, 9.8, 0.07 * relax],
    ['middle', -10, 41, 32, 10.2, 0.01],
    ['ring', 10, 38, 30, 9.8, -0.05 * relax],
    ['pinky', 29, 30, 24, 8.4, -0.12 * relax],
  ];
  const P1 = -0.2, P2 = -0.46;
  F.forEach(([name, kz, Lp, Ld, r, yaw], i) => {
    const y = yaw + tw(i);
    const dx = Math.cos(y), dz = -Math.sin(y);
    // knuckle so the middle fingertip lands at the origin (others by their lengths, from the same knuckle line)
    const K: V3 = [-(41 * Math.cos(P1) + 32 * Math.cos(P2)) - 2 + (name === 'pinky' ? -10 : 0), 30, kz];
    const pip: V3 = [K[0] + dx * Lp * Math.cos(P1), K[1] + Lp * Math.sin(P1), K[2] + dz * Lp * Math.cos(P1)];
    out.push({name: `${name}1`, base: K, c: [Lp / 2 + 3, 0, 0], r: [Lp / 2 + 5, r, r * 1.05], yaw: y, pitch: P1});
    out.push({name: `${name}2`, base: pip, c: [Ld / 2, 0, 0], r: [Ld / 2 + 3, r * 0.86, r * 0.92], yaw: y, pitch: P2});
    out.push({name: `${name}n`, base: pip, c: [Ld - 7, r * 0.8, 0], r: [6.5, 1.6, r * 0.62], yaw: y, pitch: P2, color: NAIL});
  });
  return out;
};
/** a part's ellipsoid in world space: its own frame (yaw, pitch) placed at its base point (or at its proximal end) */
const ellOf = (hf: Frame, p: Part): EllW => {
  const yaw = p.yaw ?? 0;
  const hy = Math.atan2(-hf.x[2], hf.x[0]);
  if (p.base) return {f: ypr(toW(hf, p.base), hy + yaw, p.pitch ?? 0), c: p.c, r: p.r};
  const base: V3 = [p.c[0] - p.r[0], p.c[1], p.c[2]];
  return {f: ypr(toW(hf, base), hy + yaw, p.pitch ?? 0), c: [p.r[0], 0, 0], r: p.r};
};

export const Hand3D: React.FC<{id: string; cam: Cam; frame: Frame; t: number; relax?: number}> = ({id, cam, frame, t, relax = 1}) => {
  const ps = parts(t, relax).map((p) => {
    const e = ellOf(frame, p);
    const pts = ellContour(e, cam);
    const c = toW(e.f, e.c);
    return {p, pts, z: depth(cam, c)};
  }).filter((q) => q.pts.length > 2);
  ps.sort((a, b) => b.z - a.z);
  const sh = proj(cam, toW(frame, [-110, 0, 0]));
  const k = scaleAt(cam, toW(frame, [-60, 0, 0]));
  const ink = Math.max(1.6, Math.min(9, 0.62 * k));
  return (
    <g>
      <SoftShadow id={`${id}-sh`} c={{x: sh[0], y: sh[1] + 6 * k}} rx={150 * k} ry={22 * k} alpha={0.32} color="#1A1612" core={0.5} />
      {ps.map(({p, pts}) => {
        const d = closedPath(pts);
        const c = centroid(pts);
        return (
          <Inked key={p.name} w={p.color ? ink * 0.45 : ink} id={`${id}-${p.name}`}>
            <Blob id={`${id}-${p.name}-b`} d={d} c={{x: c[0], y: c[1]}} r={extent(pts, c) * 1.02} color={p.color ?? SKIN} k={p.color ? 0.4 : 0.9} focal={0.5} />
          </Inked>
        );
      })}
    </g>
  );
};
