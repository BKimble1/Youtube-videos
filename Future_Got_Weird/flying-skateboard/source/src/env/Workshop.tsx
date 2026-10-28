// Inside the workshop shed (a converted wooden work shed): concrete floor with oil stains, plank walls, a window with a
// warm shaft of daylight, the open door, a long workbench with tools, a pegboard, shelves of parts, a hanging lamp and
// a red extinguisher. The test stand sits in the middle of the floor at the origin. Floor y = 0.
import React from 'react';
import {hash} from '../dc/math';
import {circ3, f2, lit, mix, polyD, proj, shade, hull, smoothD} from '../eng/draw';
import {clipNear, d3, H, Lens, s3, V3, v3, W} from '../eng/v3';

export const ROOM = {x0: -4.6, x1: 4.6, z0: -4.2, z1: 3.6, h: 3.1, ridge: 4.2};
export const BENCH = {x0: -3.6, x1: 0.8, z0: 2.75, z1: 3.55, y: 0.92};
const C = {
  floor: '#9C9890',
  floorDeep: '#7F7A72',
  plank: '#B48A5E',
  plankDeep: '#8C6642',
  beam: '#6E4E33',
  bench: '#8F6A45',
  benchTop: '#B79066',
  metal: '#7D8891',
  peg: '#C9B793',
};

type Face = {pts: V3[]; color: string; n: V3; planks?: 'v' | 'h'};
const P = v3;
const faces = (): Face[] => {
  const {x0, x1, z0, z1, h, ridge} = ROOM;
  const zm = (z0 + z1) / 2;
  return [
    {pts: [P(x0, 0, z1), P(x1, 0, z1), P(x1, h, z1), P(x0, h, z1)], color: C.plank, n: P(0, 0, -1), planks: 'v'},
    {pts: [P(x1, 0, z0), P(x0, 0, z0), P(x0, h, z0), P(x1, h, z0)], color: shade(C.plank, 0.1), n: P(0, 0, 1), planks: 'v'},
    {pts: [P(x0, 0, z0), P(x0, 0, z1), P(x0, h, z1), P(x0, ridge, zm), P(x0, h, z0)], color: shade(C.plank, 0.18), n: P(1, 0, 0), planks: 'v'},
    {pts: [P(x1, 0, z1), P(x1, 0, z0), P(x1, h, z0), P(x1, ridge, zm), P(x1, h, z1)], color: shade(C.plank, 0.05), n: P(-1, 0, 0), planks: 'v'},
    {pts: [P(x0, h, z1), P(x1, h, z1), P(x1, ridge, zm), P(x0, ridge, zm)], color: shade(C.plank, 0.35), n: P(0, -0.8, -0.6)},
    {pts: [P(x0, h, z0), P(x1, h, z0), P(x1, ridge, zm), P(x0, ridge, zm)], color: shade(C.plank, 0.4), n: P(0, -0.8, 0.6)},
  ];
};

const box = (L: Lens, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: string, key: string) => {
  const c: V3[] = [];
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) c.push(P(x, y, z));
  if (c.some((q) => d3(s3(q, L.pos), L.f) < 0.15)) return null;
  const pts = hull(proj(L, c));
  // the visible top face, lighter
  const top = proj(L, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)]);
  const showTop = L.pos.y > y1;
  return (
    <g key={key}>
      <path d={polyD(pts)} fill={shade(color, 0.18)} stroke="#2E2218" strokeWidth={1.4} strokeLinejoin="round" />
      {showTop && <path d={polyD(top)} fill={lit(color, 0.12)} stroke="#2E2218" strokeWidth={1.1} strokeLinejoin="round" />}
    </g>
  );
};

/** V5: the bright window and door openings as world quads (caption placement keeps text off them) */
export const WS_OPENINGS: V3[][] = [
  [P(ROOM.x0 + 0.01, 1.2, -1.6), P(ROOM.x0 + 0.01, 1.2, 0.2), P(ROOM.x0 + 0.01, 2.3, 0.2), P(ROOM.x0 + 0.01, 2.3, -1.6)],
  [P(ROOM.x1 - 0.01, 0, -2.8), P(ROOM.x1 - 0.01, 0, -0.6), P(ROOM.x1 - 0.01, 2.4, -0.6), P(ROOM.x1 - 0.01, 2.4, -2.8)],
];
export const WorkshopBack: React.FC<{id: string; L: Lens; t: number; smoke?: number; glow?: number}> = ({id, L, t, smoke = 0, glow = 0}) => {
  const fs = faces().filter((f) => {
    const c = f.pts.reduce((a, q) => P(a.x + q.x / f.pts.length, a.y + q.y / f.pts.length, a.z + q.z / f.pts.length), P(0, 0, 0));
    return d3(s3(L.pos, c), f.n) > 0;
  });
  const floor = clipNear(L, [P(ROOM.x0, 0, ROOM.z0), P(ROOM.x1, 0, ROOM.z0), P(ROOM.x1, 0, ROOM.z1), P(ROOM.x0, 0, ROOM.z1)], 0.12);
  const line = (a: V3, b: V3) => {
    const q = clipNear(L, [a, b], 0.12, false);
    if (q.length < 2) return '';
    const pa = L.p(q[0]), pb = L.p(q[1]);
    return `M${f2(pa.x)},${f2(pa.y)}L${f2(pb.x)},${f2(pb.y)}`;
  };
  // planks on the walls
  const plankLines: string[] = [];
  for (let x = ROOM.x0 + 0.22; x < ROOM.x1; x += 0.22) plankLines.push(line(P(x, 0, ROOM.z1 - 0.005), P(x, ROOM.h, ROOM.z1 - 0.005)), line(P(x, 0, ROOM.z0 + 0.005), P(x, ROOM.h, ROOM.z0 + 0.005)));
  for (let z = ROOM.z0 + 0.22; z < ROOM.z1; z += 0.22) plankLines.push(line(P(ROOM.x0 + 0.005, 0, z), P(ROOM.x0 + 0.005, ROOM.h, z)), line(P(ROOM.x1 - 0.005, 0, z), P(ROOM.x1 - 0.005, ROOM.h, z)));
  // floor seams and stains
  const seams: string[] = [];
  for (let x = -4; x <= 4; x += 2) seams.push(line(P(x, 0.002, ROOM.z0), P(x, 0.002, ROOM.z1)));
  for (let z = -4; z <= 3; z += 2) seams.push(line(P(ROOM.x0, 0.002, z), P(ROOM.x1, 0.002, z)));
  const stains = [[-1.2, 0.8, 0.5], [1.4, -0.6, 0.35], [-2.6, -1.8, 0.6], [0.3, 1.9, 0.4]].map(([x, z, r], i) => {
    const q = clipNear(L, circ3(P(x, 0.003, z), P(1, 0, 0), P(0, 0, 1), r, 18), 0.12);
    return q.length > 2 ? <path key={i} d={polyD(proj(L, q))} fill={C.floorDeep} opacity={0.35} /> : null;
  });
  // window (left wall) and door (right wall): bright openings
  const win = clipNear(L, [P(ROOM.x0 + 0.01, 1.2, -1.6), P(ROOM.x0 + 0.01, 1.2, 0.2), P(ROOM.x0 + 0.01, 2.3, 0.2), P(ROOM.x0 + 0.01, 2.3, -1.6)], 0.12);
  const door = clipNear(L, [P(ROOM.x1 - 0.01, 0, -2.8), P(ROOM.x1 - 0.01, 0, -0.6), P(ROOM.x1 - 0.01, 2.4, -0.6), P(ROOM.x1 - 0.01, 2.4, -2.8)], 0.12);
  const shaft = clipNear(L, [P(ROOM.x0 + 0.02, 2.3, -1.6), P(ROOM.x0 + 0.02, 2.3, 0.2), P(-1.4, 0.003, 1.2), P(-1.4, 0.003, -0.6)], 0.12);
  // workbench along the back wall, pegboard and shelves above it
  const B = BENCH;
  const bench = [
    box(L, B.x0, B.x1, B.y - 0.06, B.y, B.z0, B.z1, C.benchTop, 'top'),
    box(L, B.x0 + 0.05, B.x0 + 0.13, 0, B.y - 0.06, B.z0 + 0.05, B.z0 + 0.13, C.bench, 'l1'),
    box(L, B.x1 - 0.13, B.x1 - 0.05, 0, B.y - 0.06, B.z0 + 0.05, B.z0 + 0.13, C.bench, 'l2'),
    box(L, B.x0 + 0.05, B.x1 - 0.05, 0.25, 0.3, B.z0 + 0.1, B.z1 - 0.05, C.bench, 'sh'),
  ];
  const peg = clipNear(L, [P(-3.2, 1.25, ROOM.z1 - 0.02), P(0.4, 1.25, ROOM.z1 - 0.02), P(0.4, 2.2, ROOM.z1 - 0.02), P(-3.2, 2.2, ROOM.z1 - 0.02)], 0.12);
  const tools = Array.from({length: 11}, (_, i) => {
    const x = -3.0 + i * 0.32, y = 1.55 + hash(i, 3) * 0.4;
    const a = line(P(x, y + 0.25, ROOM.z1 - 0.03), P(x + (hash(i, 4) - 0.5) * 0.1, y - 0.12, ROOM.z1 - 0.03));
    return <path key={i} d={a} stroke={i % 3 ? '#3C4650' : '#C0392B'} strokeWidth={f2(Math.max(1.5, 0.03 * L.p(P(x, y, ROOM.z1)).k))} strokeLinecap="round" />;
  });
  const shelves = [2.45, 2.85].map((y, i) => box(L, 1.4, 4.2, y, y + 0.04, ROOM.z1 - 0.45, ROOM.z1 - 0.02, C.bench, `s${i}`));
  const parts = Array.from({length: 9}, (_, i) => {
    const x = 1.55 + i * 0.3, y = i % 2 ? 2.49 : 2.89;
    return box(L, x, x + 0.18, y, y + 0.14 + hash(i, 6) * 0.1, ROOM.z1 - 0.35, ROOM.z1 - 0.12, ['#4F6B7A', '#C77D3A', '#8E9AA3', '#5E7F55'][i % 4], `p${i}`);
  });
  // extinguisher by the door
  const ext = (() => {
    const c = P(ROOM.x1 - 0.35, 0, 0.4);
    if (d3(s3(c, L.pos), L.f) < 0.3) return null;
    const pts = hull(proj(L, [...circ3(c, P(1, 0, 0), P(0, 0, 1), 0.09, 12), ...circ3(P(c.x, 0.55, c.z), P(1, 0, 0), P(0, 0, 1), 0.09, 12)]));
    return <path d={smoothD(pts, 0.1)} fill="#D23A2C" stroke="#3A1410" strokeWidth={1.4} paintOrder="stroke" />;
  })();
  // hanging lamp over the stand
  const lamp = (() => {
    const top = P(0, ROOM.ridge - 0.3, 0.3), bot = P(0, 2.35, 0.3);
    if (d3(s3(bot, L.pos), L.f) < 0.2) return null;
    const a = L.p(top), b = L.p(bot);
    const shade_ = hull(proj(L, [...circ3(P(0, 2.45, 0.3), P(1, 0, 0), P(0, 0, 1), 0.06, 10), ...circ3(P(0, 2.3, 0.3), P(1, 0, 0), P(0, 0, 1), 0.2, 16)]));
    return (
      <g>
        <path d={`M${f2(a.x)},${f2(a.y)} L${f2(b.x)},${f2(b.y)}`} stroke="#2A2A2A" strokeWidth={1.4} />
        <path d={polyD(shade_)} fill="#3E5560" stroke="#1C2A30" strokeWidth={1.2} />
        <circle cx={f2(L.p(P(0, 2.27, 0.3)).x)} cy={f2(L.p(P(0, 2.27, 0.3)).y)} r={f2(0.06 * L.p(P(0, 2.27, 0.3)).k)} fill="#FFF3C4" />
      </g>
    );
  })();
  return (
    <g>
      <rect x={-20} y={-20} width={W + 40} height={H + 40} fill="#3A2C20" />
      {fs.map((f, i) => {
        const q = clipNear(L, f.pts, 0.12);
        return q.length > 2 ? <path key={i} d={polyD(proj(L, q))} fill={f.color} /> : null;
      })}
      <path d={plankLines.join('')} stroke={C.plankDeep} strokeWidth={1.3} opacity={0.55} />
      {floor.length > 2 && <path d={polyD(proj(L, floor))} fill={C.floor} />}
      <path d={seams.join('')} stroke={C.floorDeep} strokeWidth={1.2} opacity={0.5} />
      {stains}
      {/* V5 (final): the window shows the sky, with a frame cross (a near-white pane read as a whiteboard and a white
          caption over it lost its contrast) */}
      {win.length > 2 && <path d={polyD(proj(L, win))} fill="#A8CCDC" stroke={C.beam} strokeWidth={3} />}
      {win.length > 2 && (() => {
        const bars = [[P(ROOM.x0 + 0.02, 1.75, -1.6), P(ROOM.x0 + 0.02, 1.75, 0.2)], [P(ROOM.x0 + 0.02, 1.2, -0.7), P(ROOM.x0 + 0.02, 2.3, -0.7)]]
          .map((b) => clipNear(L, b, 0.12, false))
          .filter((b) => b.length === 2)
          .map((b) => {
            const [a, c] = proj(L, b);
            return `M${f2(a.x)},${f2(a.y)}L${f2(c.x)},${f2(c.y)}`;
          });
        return <path d={bars.join('')} stroke={C.beam} strokeWidth={f2(Math.max(2, 0.05 * L.p(P(ROOM.x0, 1.75, -0.7)).k))} />;
      })()}
      {door.length > 2 && <path d={polyD(proj(L, door))} fill="#CFE6D2" stroke={C.beam} strokeWidth={3} />}
      {shaft.length > 2 && <path d={polyD(proj(L, shaft))} fill="#FFF1C8" opacity={0.16} />}
      {peg.length > 2 && <path d={polyD(proj(L, peg))} fill={C.peg} stroke={C.beam} strokeWidth={1.5} />}
      {tools}
      {shelves}
      {parts}
      {bench}
      {ext}
      {lamp}
      {glow > 0 && <rect x={0} y={0} width={W} height={H} fill="#FF8A3A" opacity={glow * 0.12} style={{mixBlendMode: 'screen'}} />}
      {smoke > 0 && <rect x={0} y={0} width={W} height={H} fill="#5E5A55" opacity={smoke * 0.18} />}
    </g>
  );
};
export {mix};
