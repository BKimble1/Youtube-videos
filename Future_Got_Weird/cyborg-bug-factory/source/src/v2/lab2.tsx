// V2 lab set, dark: a slate bench with a faint grid lit by soft pools of light (the station, the test passage), a
// linear conveyor of insect carriers (the paper's "insect fixation structure driven by a slide motor"; teal clamps),
// the backpack tray, the arena's clear walls, the NARROW TEST PASSAGE (machined blocks: an approach corridor ending in a
// slot, with a side passage to the right; the opening and the loop take place here) and a parked tiny wheeled robot.
import React from 'react';
import {add3, Basis, P2, proj, smoothClosed, V3} from '../core/three';
import {projPolyClip} from './clip';
import {boxItem, cylinderItem, Item} from '../core/draw3';
import {obbItem} from '../core/obb';
import {frame, Frame} from '../core/frame';
import {lit, rgba, shade} from '../core/color';

export const BENCH2 = '#1C2A35';
export const GRID2 = '#2A3D4B';
export const CARRIER2 = '#3A4A57';
export const CLAMP2 = '#2FB8B2';
export const STEEL = '#8E9CA8';
export const CARRIER_PITCH = 110;
export const TRAY2_SLOTS: V3[] = [[-112, -70, 3.2], [-92, -70, 3.2], [-72, -70, 3.2]];
export const ARENA2 = {x0: -260, x1: 260, y1: 560};
/** pools of light on the bench: centre, radius (mm), strength */
export const POOLS: {c: V3; r: number; k: number}[] = [{c: [0, 10, 0], r: 150, k: 1}, {c: [110, 260, 0], r: 230, k: 1}, {c: [-90, -70, 0], r: 90, k: 0.6}];

const f2 = (n: number) => n.toFixed(2);

export const benchEl2 = (B: Basis, key = 'bench') => {
  const quad: V3[] = [[-1200, -900, 0], [1200, -900, 0], [1200, 1600, 0], [-1200, 1600, 0]];
  const d = projPolyClip(B, quad, 4);
  const lines: React.ReactNode[] = [];
  for (let x = -400; x <= 400; x += 20) {
    const p = projPolyClip(B, [[x - 0.3, -500, 0.01], [x + 0.3, -500, 0.01], [x + 0.3, 900, 0.01], [x - 0.3, 900, 0.01]], 6);
    if (p) lines.push(<path key={`x${x}`} d={p} fill={GRID2} opacity={x % 100 === 0 ? 0.9 : 0.45} />);
  }
  for (let y = -500; y <= 900; y += 20) {
    const p = projPolyClip(B, [[-400, y - 0.3, 0.01], [400, y - 0.3, 0.01], [400, y + 0.3, 0.01], [-400, y + 0.3, 0.01]], 6);
    if (p) lines.push(<path key={`y${y}`} d={p} fill={GRID2} opacity={y % 100 === 0 ? 0.9 : 0.45} />);
  }
  const pools = POOLS.map((P, i) => {
    // the pool's disc, clipped at the near plane (never dropped or popped as the camera moves)
    const C = proj(B, P.c);
    if (C.z < 6) return null;
    const ring3: V3[] = Array.from({length: 48}, (_, k) => {
      const a = (k / 48) * Math.PI * 2;
      return [P.c[0] + Math.cos(a) * P.r, P.c[1] + Math.sin(a) * P.r, 0.02];
    });
    const pd = projPolyClip(B, ring3, 4);
    if (!pd) return null;
    // gradient radius: the projected distance to the rim, measured on the points in front of the camera
    const R = Math.max(40, ...ring3.map((q) => proj(B, q)).filter((q) => q.z > 4).map((q) => Math.hypot(q.x - C.x, q.y - C.y)).map((r) => Math.min(r, 4000)));
    return (
      <g key={`pool${i}`}>
        <defs>
          <radialGradient id={`${key}pg${i}`} gradientUnits="userSpaceOnUse" cx={f2(C.x)} cy={f2(C.y)} r={f2(R)}>
            <stop offset="0" stopColor="#5C7484" stopOpacity={0.85 * P.k} />
            <stop offset="0.55" stopColor="#3E5363" stopOpacity={0.55 * P.k} />
            <stop offset="1" stopColor="#3E5363" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={pd} fill={`url(#${key}pg${i})`} />
      </g>
    );
  });
  return (
    <g key={key}>
      <path d={d} fill={BENCH2} />
      {pools}
      {lines}
    </g>
  );
};

export const conveyorEls2 = (B: Basis): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  out.push(<path key="conv" d={projPolyClip(B, [[-900, -30, 0.02], [900, -30, 0.02], [900, 30, 0.02], [-900, 30, 0.02]], 4)} fill="#141F28" opacity={0.85} />);
  [-30, 30].forEach((y) => out.push(<path key={`rail${y}`} d={projPolyClip(B, [[-900, y - 1.2, 0.04], [900, y - 1.2, 0.04], [900, y + 1.2, 0.04], [-900, y + 1.2, 0.04]], 4)} fill="#5E7180" />));
  return out;
};

export const carrierItems2 = (B: Basis, x: number, open: number, key: string): {flat: React.ReactNode; items: Item[]} => {
  const C = proj(B, [x, 0, 0]);
  const flat = (
    <g key={`${key}pl`}>
      <path d={projPolyClip(B, [[x - 27, -48, 0.06], [x + 27, -48, 0.06], [x + 27, 26, 0.06], [x - 27, 26, 0.06]], 4)} fill={CARRIER2} stroke={shade(CARRIER2, 0.4)} strokeWidth={f2(Math.max(1, 0.25 * C.s))} />
      <path d={projPolyClip(B, [[x - 23, -44, 0.07], [x + 23, -44, 0.07], [x + 23, 22, 0.07], [x - 23, 22, 0.07]], 4)} fill="none" stroke={rgba(CLAMP2, 0.55)} strokeWidth={f2(Math.max(1, 0.3 * C.s))} strokeDasharray={`${f2(2 * C.s)} ${f2(1.6 * C.s)}`} />
    </g>
  );
  const items: Item[] = [];
  [1, -1].forEach((s) => {
    const jawIn = 15.4 + 8 * open;
    const z = 4.4 - 2.6 * open;
    items.push(boxItem(B, [x + s * 24, -20, 3.2], [1.6, 4, 3.2], '#56656F', {key: `${key}po${s}`}));
    items.push(boxItem(B, [x + s * (jawIn + (24 - jawIn) / 2), -20, z], [(24 - jawIn) / 2 + 0.4, 3, 1.1], CLAMP2, {key: `${key}jw${s}`}));
  });
  return {flat, items};
};

export const trayItems2 = (B: Basis): Item[] => [boxItem(B, [-92, -70, 1.6], [34, 13, 1.6], '#3C4B57', {key: 'tray'})];

/** (V2 has no arena walls: the camera crosses that ground; kept for reference, unused) */
export const arenaItems2 = (B: Basis): Item[] => {
  const A = ARENA2;
  const h = 26;
  const walls: [V3, V3][] = [[[A.x0, A.y1, 0], [A.x1, A.y1, 0]], [[A.x1, 92, 0], [A.x1, A.y1, 0]]];
  return walls.map(([a, b], i) => {
    const d = projPolyClip(B, [a, b, add3(b, [0, 0, h]), add3(a, [0, 0, h])], 4);
    const top = projPolyClip(B, [add3(a, [0, 0, h]), add3(b, [0, 0, h]), add3(b, [0, 0, h - 1.5]), add3(a, [0, 0, h - 1.5])], 4);
    const m = proj(B, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, h / 2]);
    return {z: m.z, el: <g key={`aw${i}`}><path d={d} fill="#5CF2FF" opacity={0.06} stroke={rgba('#5CF2FF', 0.35)} strokeWidth={1.5} /><path d={top} fill="#7FE9F5" opacity={0.5} /></g>};
  });
};

// ------------------------------------------------------------------ the narrow test passage
/** the passage's frame: origin where the insect stands at frame 0 (the slot ahead), x along its heading */
export const Q0: V3 = [40, 230, 0];
export const H0 = 200; // heading at frame 0 (deg)
export const passageFrame = (): Frame => frame(Q0, [Math.cos((H0 * Math.PI) / 180), Math.sin((H0 * Math.PI) / 180), 0], [0, 0, 1]);
const WH = 4.5; // half height of the walls (9 mm tall: low enough for the camera to see the insect over them)
/** blocks in passage coordinates: centre (x, y), half length, half width, yaw (deg) */
export const PASSAGE: {c: [number, number]; hl: number; hw: number; yaw: number}[] = [
  {c: [-52, 33], hl: 92, hw: 4, yaw: 0}, // approach corridor, left wall
  {c: [-82, -33], hl: 62, hw: 4, yaw: 0}, // approach corridor, right wall (ends at x = -20)
  {c: [-10, -35], hl: 10, hw: 4.5, yaw: 0}, // corner
  {c: [42, 19], hl: 4, hw: 14, yaw: 0}, // end wall, left of the slot
  {c: [42, -10], hl: 4, hw: 5, yaw: 0}, // end wall, right of the slot (the slot is y -5..5)
  {c: [56.2, -73.8], hl: 60, hw: 4, yaw: -80}, // side passage, left wall
  {c: [10.4, -95.1], hl: 60, hw: 4, yaw: -80}, // side passage, right wall
];
export const passageItems = (B: Basis): Item[] => {
  const P = passageFrame();
  return PASSAGE.map((b, i) => {
    const r = ((H0 + b.yaw) * Math.PI) / 180;
    const c = add3(P.o, add3([P.f[0] * b.c[0], P.f[1] * b.c[0], 0], [P.l[0] * b.c[1], P.l[1] * b.c[1], WH]));
    return obbItem(B, frame(c, [Math.cos(r), Math.sin(r), 0], [0, 0, 1]), [b.hl, b.hw, WH], STEEL, {key: `ps${i}`, top: lit(STEEL, 0.35)});
  });
};

// ------------------------------------------------------------------ a parked tiny wheeled robot (the comparison's)
export const ROBOT_PARK: V3 = [62, 318, 0];
export const robotItemsAt = (B: Basis, c: V3, yawDeg: number, pitch = 0, spin = 0, key = 'tr', led = 0.4): Item[] => {
  const pr = (pitch * Math.PI) / 180, yr = (yawDeg * Math.PI) / 180;
  const f: V3 = [Math.cos(yr) * Math.cos(pr), Math.sin(yr) * Math.cos(pr), Math.sin(pr)];
  const F = frame(add3(c, [0, 0, 9 + 9 * Math.sin(pr)]), f, [0, 0, 1]);
  const W = (p: V3): V3 => add3(F.o, add3([F.f[0] * p[0], F.f[1] * p[0], F.f[2] * p[0]], add3([F.l[0] * p[1], F.l[1] * p[1], F.l[2] * p[1]], [F.u[0] * p[2], F.u[1] * p[2], F.u[2] * p[2]])));
  const it: Item[] = [];
  it.push(obbItem(B, {...F, o: W([0, 0, 1])}, [20, 15, 5.5], '#3E5C8A', {key: `${key}b`, top: '#5577AA'}));
  it.push(obbItem(B, {...F, o: W([13, 0, 7.5])}, [6, 5, 2.6], '#2A3440', {key: `${key}s`}));
  const eye = proj(B, W([19.2, 0, 7.6]));
  it.push({z: eye.z - 2, el: <circle key={`${key}e`} cx={eye.x.toFixed(1)} cy={eye.y.toFixed(1)} r={(1.8 * eye.s).toFixed(1)} fill="#5CF2FF" opacity={0.35 + 0.65 * led} stroke="#0B1218" strokeWidth={2} />});
  it.push(cylinderItem(B, W([-8, 6, 6]), W([-11, 8, 20]), 0.6, '#2A3440', {key: `${key}a`}));
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sy], i) => {
    const wc = W([sx * 13, sy * 21.5, -4.6]);
    const a = add3(wc, [F.l[0] * -2.5, F.l[1] * -2.5, 0]), b = add3(wc, [F.l[0] * 2.5, F.l[1] * 2.5, 0]);
    it.push(cylinderItem(B, a, b, 4.6, '#1E2329', {key: `${key}w${i}`, cap: '#55606B'}));
    const P = proj(B, sy > 0 ? b : a);
    const r = 3.4 * P.s;
    it.push({z: P.z - 1, el: <g key={`${key}sp${i}`}>{[0, 1, 2].map((k) => { const an = spin + (k * 2 * Math.PI) / 3; return <line key={k} x1={f2(P.x)} y1={f2(P.y)} x2={f2(P.x + Math.cos(an) * r * 0.35)} y2={f2(P.y + Math.sin(an) * r)} stroke="#AAB4BE" strokeWidth={2} />; })}</g>});
  });
  return it;
};
export {P2};
