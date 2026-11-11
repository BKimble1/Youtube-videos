// The assembly cell (one world, mm, bench top z = 0): a light lab bench with a faint grid, a linear conveyor along x
// carrying insect carriers (each a plate with two soft clamps that hold an anaesthetised cockroach still), the backpack
// tray, the overhead vision camera on its post, the robot arm (arm.tsx), and a low-walled arena beyond the station
// (+y) where finished cyborgs walk. One insect is assembled at a time at the station (x = 0), as in the NTU prototype.
import React from 'react';
import {add3, Basis, P2, proj, projPoly, V3} from '../core/three';
import {boxItem, cylinderItem, Item} from '../core/draw3';
import {lit, mix, rgba, shade} from '../core/color';
import {INK} from '../core/ink';

export const BENCH = '#CBD8E0';
export const GRID = '#B2C3CD';
export const CARRIER = '#EEF2F5';
export const CLAMP = '#F08A24';
export const STATION: V3 = [0, 0, 0];
export const CARRIER_PITCH = 110; // spacing of carriers on the conveyor
export const TRAY_C: V3 = [-92, -70, 0];
export const TRAY_SLOTS: V3[] = [[-112, -70, 3.2], [-92, -70, 3.2], [-72, -70, 3.2]];
export const ARENA = {x0: -260, x1: 260, y0: 92, y1: 560};

const f2 = (n: number) => n.toFixed(2);

/** the bench: a big quad, gradient by depth, with a grid that fades with distance */
export const benchEl = (B: Basis, key = 'bench') => {
  const quad: V3[] = [[-900, -700, 0], [900, -700, 0], [900, 1400, 0], [-900, 1400, 0]];
  const d = projPoly(B, quad, 4);
  const lines: React.ReactNode[] = [];
  const step = 20;
  for (let x = -400; x <= 400; x += step) {
    const p = projPoly(B, [[x - 0.35, -500, 0.01], [x + 0.35, -500, 0.01], [x + 0.35, 900, 0.01], [x - 0.35, 900, 0.01]], 6);
    if (p) lines.push(<path key={`x${x}`} d={p} fill={GRID} opacity={x % 100 === 0 ? 0.9 : 0.5} />);
  }
  for (let y = -500; y <= 900; y += step) {
    const p = projPoly(B, [[-400, y - 0.35, 0.01], [400, y - 0.35, 0.01], [400, y + 0.35, 0.01], [-400, y + 0.35, 0.01]], 6);
    if (p) lines.push(<path key={`y${y}`} d={p} fill={GRID} opacity={y % 100 === 0 ? 0.9 : 0.5} />);
  }
  return (
    <g key={key}>
      <path d={d} fill={BENCH} />
      {lines}
    </g>
  );
};

/** the conveyor: a recessed channel along x with two rails */
export const conveyorEls = (B: Basis): Item[] => {
  const out: Item[] = [];
  const ch = projPoly(B, [[-900, -30, 0.02], [900, -30, 0.02], [900, 30, 0.02], [-900, 30, 0.02]], 4);
  out.push({z: 1e7, el: <path key="conv" d={ch} fill="#AEBFCA" />});
  [-30, 30].forEach((y) => {
    const r = projPoly(B, [[-900, y - 1.2, 0.04], [900, y - 1.2, 0.04], [900, y + 1.2, 0.04], [-900, y + 1.2, 0.04]], 4);
    out.push({z: 1e7 - 1, el: <path key={`rail${y}`} d={r} fill="#7E909C" />});
  });
  return out;
};

/** a carrier plate at x, its clamps (open 0..1) */
export const carrierItems = (B: Basis, x: number, open: number, key: string): Item[] => {
  const out: Item[] = [];
  const c: V3 = [x, 0, 0];
  const plate = projPoly(B, [[x - 27, -48, 0.06], [x + 27, -48, 0.06], [x + 27, 26, 0.06], [x - 27, 26, 0.06]], 4);
  const C = proj(B, c);
  out.push({
    z: 1e7 - 2,
    el: (
      <g key={`${key}pl`}>
        <path d={plate} fill={CARRIER} stroke={shade(CARRIER, 0.35)} strokeWidth={f2(Math.max(1, 0.25 * C.s))} />
        <path d={projPoly(B, [[x - 23, -44, 0.07], [x + 23, -44, 0.07], [x + 23, 22, 0.07], [x - 23, 22, 0.07]], 4)} fill="none" stroke={rgba(CLAMP, 0.6)} strokeWidth={f2(Math.max(1, 0.35 * C.s))} strokeDasharray={`${f2(2 * C.s)} ${f2(1.6 * C.s)}`} />
      </g>
    ),
  });
  // clamps on the abdomen (roach faces +y; abdomen toward -y): a post and a padded jaw each side
  [1, -1].forEach((s) => {
    const px = x + s * 24;
    const jawIn = 15.4 + 8 * open;
    const z = 4.4 - 2.6 * open;
    out.push(boxItem(B, [px, -20, 3.2], [1.6, 4, 3.2], '#D4DCE2', {key: `${key}po${s}`}));
    out.push(boxItem(B, [x + s * (jawIn + (24 - jawIn) / 2), -20, z], [(24 - jawIn) / 2 + 0.4, 3, 1.1], CLAMP, {key: `${key}jw${s}`}));
  });
  return out;
};

/** the backpack tray (packs are drawn separately, sitting in the slots) */
export const trayItems = (B: Basis): Item[] => [
  boxItem(B, [TRAY_C[0], TRAY_C[1], 1.6], [34, 13, 1.6], '#9AABB7', {key: 'tray'}),
];

/** the vision camera post and head (looks straight down at the station) */
export const visionItems = (B: Basis): Item[] => [
  cylinderItem(B, [95, -70, 0], [95, -70, 240], 7, '#3A4652', {key: 'vp'}),
  boxItem(B, [48, -35, 240], [58, 6, 6], '#3A4652', {key: 'vb', yaw: 36}),
  boxItem(B, [0, 0, 236], [12, 12, 10], '#1F262E', {key: 'vc'}),
  cylinderItem(B, [0, 0, 226], [0, 0, 220], 6.5, '#11161B', {key: 'vl', cap: '#2E6CA8'}),
];

/** the arena's low clear walls */
export const arenaItems = (B: Basis): Item[] => {
  const A = ARENA;
  const h = 26;
  const walls: [V3, V3][] = [[[A.x0, A.y1, 0], [A.x1, A.y1, 0]], [[A.x0, A.y0, 0], [A.x0, A.y1, 0]], [[A.x1, A.y0, 0], [A.x1, A.y1, 0]]];
  return walls.map(([a, b], i) => {
    const q = [a, b, add3(b, [0, 0, h]), add3(a, [0, 0, h])];
    const d = projPoly(B, q, 4);
    const top = projPoly(B, [add3(a, [0, 0, h]), add3(b, [0, 0, h]), add3(b, [0, 0, h - 1.5]), add3(a, [0, 0, h - 1.5])], 4);
    const m = proj(B, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, h / 2]);
    return {
      z: m.z,
      el: (
        <g key={`aw${i}`}>
          <path d={d} fill="#DDF3FA" opacity={0.28} stroke={rgba('#7FB6C9', 0.6)} strokeWidth={1.5} />
          <path d={top} fill="#BFE3EF" opacity={0.85} />
        </g>
      ),
    };
  });
};

/** a soft vignette and the cool lab light, in screen space */
export const LabLight: React.FC<{k?: number}> = ({k = 1}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    <defs>
      <radialGradient id="labvig" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0.55" stopColor="#0A1520" stopOpacity="0" />
        <stop offset="1" stopColor="#0A1520" stopOpacity={0.55 * k} />
      </radialGradient>
      <linearGradient id="labkey" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFF6EA" stopOpacity={0.14 * k} />
        <stop offset="0.6" stopColor="#FFF6EA" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#labkey)" />
    <rect width={1080} height={1920} fill="url(#labvig)" />
  </svg>
);
export {INK, lit, mix, P2};
