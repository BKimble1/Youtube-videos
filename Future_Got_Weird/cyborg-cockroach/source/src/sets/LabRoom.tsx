// The lab at human scale, in the same world coordinates as the macro shots (mm; the arena mat and the bench top are
// y = 0): the bench, the arena's clear acrylic walls, a monitor at the back of the bench. The operator stands behind
// the bench's far edge, to the right of the arena, and faces screen-left toward it.
import React from 'react';
import {Cam, depth, scaleAt, proj} from '../lib/cam';
import {V3, V2} from '../lib/v3';
import {projPoly, polyPath, fmt} from '../lib/g3';
import {INK} from '../lib/ink';
import {lit, shade, mix} from '../lib/color';
import {Solid, LAB} from './Lab';
import {Item} from '../lib/scene';

export const ROOM = {
  bench: {x0: -520, x1: 980, z0: -460, z1: 330, top: 0, thick: 34},
  arena: {x0: -260, x1: 320, z0: -240, z1: 240, wall: 70},
  monitor: {c: [-330, 0, -520] as V3, w: 420, h: 250, lift: 150},
  /** where the operator stands: a ground anchor at bench-top height under his hips (world mm) */
  operator: {hip: [300, -80, -380] as V3},
  benchCol: '#E9EDEF',
  benchEdge: '#C9D1D6',
  acrylic: '#CFE7F1',
  monitorCol: '#2C3640',
};

/** the bench slab (top face and front edge), drawn first */
export const Bench: React.FC<{cam: Cam}> = ({cam}) => {
  const b = ROOM.bench;
  const top = projPoly(cam, [[b.x0, 0, b.z0], [b.x1, 0, b.z0], [b.x1, 0, b.z1], [b.x0, 0, b.z1]]);
  const front = projPoly(cam, [[b.x0, 0, b.z1], [b.x1, 0, b.z1], [b.x1, -b.thick, b.z1], [b.x0, -b.thick, b.z1]]);
  const ink = Math.max(1.2, Math.min(3, scaleAt(cam, [0, 0, 0]) * 0.25));
  return (
    <g>
      {top && <path d={polyPath(top)} fill={ROOM.benchCol} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />}
      {front && <path d={polyPath(front)} fill={shade(ROOM.benchEdge, 0.1)} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />}
    </g>
  );
};

/** clear acrylic arena walls: each wall a translucent panel with a bright top edge; returns depth-sortable items */
export const arenaWalls = (cam: Cam, opts: {skip?: ('n' | 's' | 'e' | 'w')[]} = {}): Item[] => {
  const a = ROOM.arena, h = a.wall;
  const walls: [string, V3[]][] = [
    ['n', [[a.x0, 0, a.z0], [a.x1, 0, a.z0], [a.x1, h, a.z0], [a.x0, h, a.z0]]],
    ['s', [[a.x0, 0, a.z1], [a.x1, 0, a.z1], [a.x1, h, a.z1], [a.x0, h, a.z1]]],
    ['w', [[a.x0, 0, a.z0], [a.x0, 0, a.z1], [a.x0, h, a.z1], [a.x0, h, a.z0]]],
    ['e', [[a.x1, 0, a.z0], [a.x1, 0, a.z1], [a.x1, h, a.z1], [a.x1, h, a.z0]]],
  ];
  return walls
    .filter(([k]) => !(opts.skip ?? []).includes(k as 'n'))
    .map(([k, pts]) => {
      const q = projPoly(cam, pts);
      const c: V3 = [(pts[0][0] + pts[2][0]) / 2, h / 2, (pts[0][2] + pts[2][2]) / 2];
      const topEdge = projPoly(cam, [pts[2], pts[3], [pts[3][0], h - 2, pts[3][2]], [pts[2][0], h - 2, pts[2][2]]]);
      const ink = Math.max(1, Math.min(2.6, scaleAt(cam, c) * 0.25));
      return {
        z: depth(cam, c),
        el: q ? (
          <g key={`wall${k}`}>
            <path d={polyPath(q)} fill={ROOM.acrylic} opacity={0.22} />
            <path d={polyPath(q)} fill="none" stroke={mix(INK, ROOM.acrylic, 0.45)} strokeWidth={ink} opacity={0.7} strokeLinejoin="round" />
            {topEdge && <path d={polyPath(topEdge)} fill="#FFFFFF" opacity={0.75} />}
          </g>
        ) : null,
      };
    });
};

/** monitor on a stand at the back of the bench, facing the operator and the camera (+z, tilted toward -x a little);
 *  `screen` is drawn clipped into the screen quad (a React node in screen px that fills the given box) */
export const Monitor: React.FC<{cam: Cam; screen?: (box: {pts: V2[]; w: number; h: number}) => React.ReactNode; id: string}> = ({cam, screen, id}) => {
  const m = ROOM.monitor;
  const yaw = 0.35; // turned toward the camera side
  const ux: V3 = [Math.cos(yaw), 0, Math.sin(yaw)];
  const P = (u: number, v: number, d = 0): V3 => [m.c[0] + ux[0] * u + -ux[2] * d * 0, m.lift + v, m.c[2] + ux[2] * u + d];
  const hw = m.w / 2;
  const bez = projPoly(cam, [P(-hw - 14, -14), P(hw + 14, -14), P(hw + 14, m.h + 14), P(-hw - 14, m.h + 14)]);
  const scr = projPoly(cam, [P(-hw, 0), P(hw, 0), P(hw, m.h), P(-hw, m.h)]);
  const stand = projPoly(cam, [P(-16, -m.lift), P(16, -m.lift), P(16, 0), P(-16, 0)]);
  const foot = projPoly(cam, [P(-70, -m.lift, 40), P(70, -m.lift, 40), P(70, -m.lift, -40), P(-70, -m.lift, -40)]);
  const ink = Math.max(1.2, Math.min(3, scaleAt(cam, m.c) * 0.25));
  return (
    <g>
      {foot && <path d={polyPath(foot)} fill={shade(ROOM.monitorCol, 0.1)} stroke={INK} strokeWidth={ink} />}
      {stand && <path d={polyPath(stand)} fill={lit(ROOM.monitorCol, 0.1)} stroke={INK} strokeWidth={ink} />}
      {bez && <path d={polyPath(bez)} fill={ROOM.monitorCol} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />}
      {scr && (
        <g>
          <clipPath id={`${id}-scr`}>
            <path d={polyPath(scr)} />
          </clipPath>
          <path d={polyPath(scr)} fill="#1B2A36" />
          {screen && <g clipPath={`url(#${id}-scr)`}>{screen({pts: scr, w: m.w, h: m.h})}</g>}
          <path d={polyPath(scr)} fill="url(#none)" stroke={INK} strokeWidth={ink * 0.6} opacity={0.6} />
        </g>
      )}
    </g>
  );
};
