// The experiment's hardware in the shared mm world, drawn through a shot camera.
// - The needle: a 25-gauge (0.5 mm) steel needle on an orange luer hub; it enters the top of the prosoma, and a small
//   glue bead seals the puncture (Yap et al. 2022). Its hub is held by a clamp on an arm that runs back to a post: the
//   external support that carries the gripper. The specimen never carries itself.
// - The tube: clear tubing from the hub to the operator's 1 mL syringe.
import React from 'react';
import {lit, mix, shade} from './dc/color';
import {INK} from './dc/ink';
import {boxItem, capsuleItem, cylinderItem, ellipsoidItem, inkW, Item, shadowItem, tubeItem} from './draw3';
import {add3, Basis, lerp3, mul3, norm3, P2, proj, projPoly, smoothClosed, sub3, V3} from './three';

export const STEEL = '#C3CFD8';
export const HUB = '#E58A3A';
export const ARM = '#5D6B76';
export const PAD = '#F6F8F9';
export const BLOCK_C = '#5FB7C9';
export const WEIGHT_C = '#3E7C8C';
export const GLASS = '#DCEFF6';

/** the needle assembly above a gripper: entry point on the carapace, how far the tip is above it (mm, negative =
 *  inserted), the glue bead (0..1) and where the support arm runs to (direction in plan) */
export type NeedleRig = {entry: V3; tipAbove: number; glue: number; armDir: number; armLen: number; postFoot?: number; hubLen?: number; shaft?: number};
export const hubOf = (n: NeedleRig) => {
  const shaft = n.shaft ?? 11;
  const tipZ = n.entry[2] + n.tipAbove;
  const base: V3 = [n.entry[0], n.entry[1], tipZ + shaft];
  const top: V3 = [n.entry[0], n.entry[1], tipZ + shaft + (n.hubLen ?? 7)];
  return {tip: [n.entry[0], n.entry[1], tipZ] as V3, base, top};
};

export const needleItems = (B: Basis, n: NeedleRig, o: {noArm?: boolean; noPost?: boolean} = {}): Item[] => {
  const items: Item[] = [];
  const h = hubOf(n);
  // the visible shaft: from the carapace (or the tip, while it is still above) to the hub
  const from: V3 = n.tipAbove > 0 ? h.tip : n.entry;
  items.push(capsuleItem(B, from, h.base, 0.25, 0.27, STEEL, {spec: 1, zBias: -0.2}));
  if (n.tipAbove > 0) {
    // the bevel at the tip
    const q = proj(B, h.tip);
    items.push({z: q.z - 0.3, el: <circle key="nt" cx={q.x.toFixed(1)} cy={q.y.toFixed(1)} r={(0.12 * q.s).toFixed(2)} fill="#FFFFFF" opacity={0.85} />});
  }
  if (n.glue > 0.01) {
    items.push(ellipsoidItem(B, add3(n.entry, [0, 0, 0.08]), [[0.75 * n.glue, 0, 0], [0, 0.65 * n.glue, 0], [0, 0, 0.3 * n.glue]], '#EAF4F8', {opacity: 0.55 * n.glue, spec: 1.6, glossy: true, zBias: -0.25, ink: 1}));
  }
  // the hub: a stepped luer hub, orange (25 G)
  items.push(cylinderItem(B, h.base, add3(h.base, [0, 0, 2.2]), 0.75, HUB, {glass: true}));
  items.push(cylinderItem(B, add3(h.base, [0, 0, 2.2]), h.top, 1.45, HUB, {glass: true}));
  // the clamp round the hub, the arm, the post
  if (!o.noArm) {
    const a = (n.armDir * Math.PI) / 180;
    const d: V3 = [Math.cos(a), Math.sin(a), 0];
    const cz = h.base[2] + 4.6;
    const cc: V3 = [h.base[0], h.base[1], cz];
    items.push(boxItem(B, add3(cc, mul3(d, 1.2)), [2.1, 2.1, 1.6], '#47545E', {yaw: n.armDir}));
    const end = add3(cc, mul3(d, n.armLen));
    items.push(boxItem(B, lerp3(add3(cc, mul3(d, 3)), end, 0.5), [(n.armLen - 3) / 2, 0.9, 0.9], ARM, {yaw: n.armDir}));
    if (!o.noPost) {
      items.push(cylinderItem(B, [end[0], end[1], n.postFoot ?? -3], add3(end, [0, 0, 2.5]), 2.6, '#6B7A85'));
      items.push(boxItem(B, add3(end, [0, 0, 0]), [3.4, 3.4, 2.6], '#3E4A53'));
    }
  }
  return items;
};

/** the 1 mL syringe: luer tip at `tip`, axis toward `back` (unit), plunger travel 0..1 (1 = pushed home) */
export const SYR = {barrel: 100, r: 11, travel: 55, nozzle: 9};
export const syringeGeo = (tip: V3, axis: V3, plunger: number) => {
  const u = norm3(axis);
  const at = (d: number) => add3(tip, mul3(u, d));
  const n = SYR.nozzle;
  const stopper = 5 + (1 - plunger) * SYR.travel; // distance of the plunger stopper from the tip end of the barrel
  return {u, at, nozzle: at(0), barrel0: at(n), barrel1: at(n + SYR.barrel), flange: at(n + SYR.barrel), stopper: at(n + stopper), rodEnd: at(n + stopper + SYR.barrel + 8), thumb: at(n + stopper + SYR.barrel + 10)};
};
export const syringeItems = (B: Basis, tip: V3, axis: V3, plunger: number, o: {zBias?: number} = {}): Item[] => {
  const g = syringeGeo(tip, axis, plunger);
  const items: Item[] = [];
  const zb = o.zBias ?? 0;
  items.push(cylinderItem(B, g.nozzle, g.barrel0, 2.2, '#E8EEF1', {zBias: zb}));
  // plunger rod and thumb rest (behind the barrel's front face)
  items.push(cylinderItem(B, g.stopper, g.rodEnd, 4.2, '#EEF2F4', {zBias: zb + 0.4}));
  items.push(cylinderItem(B, g.rodEnd, g.thumb, 14, '#D5DEE4', {zBias: zb - 0.6, cap: '#EEF3F6'}));
  // the rubber stopper inside the barrel
  items.push(cylinderItem(B, g.stopper, add3(g.stopper, mul3(g.u, 6)), SYR.r * 0.93, '#3B4A55', {zBias: zb + 0.3}));
  // barrel (clear) and finger flange
  items.push(cylinderItem(B, g.barrel0, g.barrel1, SYR.r, GLASS, {glass: true, zBias: zb, spec: 1.4}));
  items.push(boxItem(B, g.flange, [24, 7, 1.8], '#E6ECEF', {zBias: zb - 0.1, yaw: (Math.atan2(g.u[1], g.u[0]) * 180) / Math.PI + 90}));
  // graduation ticks
  for (let k = 1; k < 10; k++) {
    const p = proj(B, g.at(SYR.nozzle + k * 10));
    const q = proj(B, add3(g.at(SYR.nozzle + k * 10), [-SYR.r * 0.45, -SYR.r * 0.9, 0]));
    items.push({z: p.z - 3.5 + zb, el: <path key={`gt${k}`} d={`M${P2(p)} L${P2(q)}`} stroke="#5E7684" strokeWidth={Math.max(0.8, 0.12 * p.s).toFixed(2)} opacity={0.7} />});
  }
  return items;
};

/** a tube from a to b with a natural sag (control points between) */
export const tubePath = (a: V3, aDir: V3, b: V3, bDir: V3, sag = 0, n = 14, la?: number, lb?: number): V3[] => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const c1 = add3(a, mul3(norm3(aDir), la ?? L * 0.35));
  const c2 = add3(b, mul3(norm3(bDir), lb ?? L * 0.35));
  return Array.from({length: n + 1}, (_, i) => {
    const t = i / n;
    const m = 1 - t;
    const p = add3(add3(mul3(a, m * m * m), mul3(c1, 3 * m * m * t)), add3(mul3(c2, 3 * m * t * t), mul3(b, t * t * t)));
    return add3(p, [0, 0, -sag * Math.sin(Math.PI * t)]);
  });
};
/** the ring stand at B: base plate on the bench, the upright rod */
export const standItems = (B: Basis, base: V3, rodTop: number): Item[] => [
  boxItem(B, add3(base, [0, 0, 3]), [55, 40, 3], '#46535C', {top: '#56646D'}),
  cylinderItem(B, add3(base, [-30, 20, 6]), add3(base, [-30, 20, rodTop]), 5, '#8C9AA4'),
];
/** the ring-stand clamp that holds the syringe barrel (a padded ring and a rod back to the stand) */
export const syringeClampItems = (B: Basis, at: V3, axis: V3, rodDir: V3, rodLen: number): Item[] => {
  const u = norm3(axis);
  const it: Item[] = [];
  it.push(cylinderItem(B, add3(at, mul3(u, -7)), add3(at, mul3(u, 7)), SYR.r + 2.4, '#4C5963', {zBias: 2}));
  const d = norm3(rodDir);
  it.push(cylinderItem(B, add3(at, mul3(d, SYR.r + 2)), add3(at, mul3(d, rodLen)), 2.6, '#7D8B95', {zBias: 3}));
  return it;
};
export const tube = (B: Basis, pts: V3[], o: {z?: number; flow?: number} = {}) => tubeItem(B, pts, 0.85, {z: o.z, flow: o.flow, color: '#E3EEF3', inner: '#CADBE3'});

// ------------------------------------------------------------------ surfaces drawn under everything (no depth sort)
/** a flat horizontal rectangle at height z (bench top, pad top), as a path */
export const flatRect = (B: Basis, x0: number, x1: number, y0: number, y1: number, z: number, n = 12) => {
  const pts: V3[] = [];
  for (let i = 0; i <= n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y0, z]);
  for (let i = 1; i <= n; i++) pts.push([x1, y0 + ((y1 - y0) * i) / n, z]);
  for (let i = 1; i <= n; i++) pts.push([x1 - ((x1 - x0) * i) / n, y1, z]);
  for (let i = 1; i < n; i++) pts.push([x0, y1 - ((y1 - y0) * i) / n, z]);
  return projPoly(B, pts);
};

/** the specimen pad (a white tile with a faint grid) on the bench */
export const Pad: React.FC<{B: Basis; c: V3; half: number; th: number}> = ({B, c, half, th}) => {
  const top = flatRect(B, c[0] - half, c[0] + half, c[1] - half, c[1] + half, c[2]);
  const front = projPoly(B, [[c[0] - half, c[1] - half, c[2]], [c[0] + half, c[1] - half, c[2]], [c[0] + half, c[1] - half, c[2] - th], [c[0] - half, c[1] - half, c[2] - th]]);
  const s = proj(B, c).s;
  return (
    <g>
      <path d={front} fill="#C9D3D9" stroke={INK} strokeWidth={inkW(s * 0.6)} strokeLinejoin="round" />
      <path d={top} fill={PAD} stroke={INK} strokeWidth={inkW(s * 0.6)} strokeLinejoin="round" />
      {Array.from({length: 7}).map((_, i) => {
        const x = c[0] - half + ((i + 1) * 2 * half) / 8;
        const y = c[1] - half + ((i + 1) * 2 * half) / 8;
        return (
          <g key={i} opacity={0.3}>
            <path d={`M${P2(proj(B, [x, c[1] - half, c[2]]))} L${P2(proj(B, [x, c[1] + half, c[2]]))}`} stroke="#AFC3CD" strokeWidth={0.8} />
            <path d={`M${P2(proj(B, [c[0] - half, y, c[2]]))} L${P2(proj(B, [c[0] + half, y, c[2]]))}`} stroke="#AFC3CD" strokeWidth={0.8} />
          </g>
        );
      })}
    </g>
  );
};

/** the bench top (dark laminate) and its front edge */
export const BenchTop: React.FC<{B: Basis; z: number; x0?: number; x1?: number; front?: number; back?: number}> = ({B, z, x0 = -1400, x1 = 1400, front = -160, back = 520}) => (
  <g>
    <path d={flatRect(B, x0, x1, front, back, z, 24)} fill="#56656E" />
    <path d={flatRect(B, x0, x1, front, front + 4, z, 24)} fill="#6E7E87" opacity={0.6} />
    <path d={projPoly(B, [[x0, front, z], [x1, front, z], [x1, front, z - 900], [x0, front, z - 900]])} fill="#33656F" />
  </g>
);

/** a soft shadow on a surface (for the drawn-first pass) */
export const FlatShadow: React.FC<{B: Basis; c: V3; rx: number; ry: number; alpha: number; yaw?: number}> = ({B, c, rx, ry, alpha, yaw}) => <>{shadowItem(B, c, rx, ry, alpha, c[2], {yaw}).el}</>;

/** the lab wall far behind (the Real Web Fluid lab: pale wall, teal band, shelves of coloured bottles), mapped onto
 *  the plane y = wallY with an affine fit, blurred for depth of field */
export const LabWallFar: React.FC<{B: Basis; id: string; wallY: number; blur: number; tint?: number}> = ({B, id, wallY, blur, tint = 0}) => {
  // art units: x across, y down; 1 art unit = 0.55 mm; art y = 1100 sits on the bench line
  const K = 0.55;
  const P = (ax: number, ay: number): V3 => [ax * K - 300, wallY, (1100 - ay) * K - 3];
  const o = proj(B, P(0, 0)), px = proj(B, P(1000, 0)), py = proj(B, P(0, 1000));
  const m = [(px.x - o.x) / 1000, (px.y - o.y) / 1000, (py.x - o.x) / 1000, (py.y - o.y) / 1000, o.x, o.y].map((v) => v.toFixed(5)).join(' ');
  const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
    `M${x0 + r},${y0} H${x1 - r} Q${x1},${y0} ${x1},${y0 + r} V${y1 - r} Q${x1},${y1} ${x1 - r},${y1} H${x0 + r} Q${x0},${y1} ${x0},${y1 - r} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} Z`;
  return (
    <g>
      <defs>
        <filter id={`${id}-b`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={blur.toFixed(2)} />
        </filter>
        <linearGradient id={`${id}-w`} x1="0" y1="-400" x2="0" y2="1400" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#C9DCE6" />
          <stop offset="1" stopColor="#E3EDF1" />
        </linearGradient>
      </defs>
      <g filter={blur > 0.2 ? `url(#${id}-b)` : undefined}>
        <g transform={`matrix(${m})`}>
          <path d="M-3500,-3000 H5500 V1200 H-3500 Z" fill={`url(#${id}-w)`} />
          <path d="M-3500,960 H5500 V1010 H-3500 Z" fill="#2FA7A0" opacity={0.75} />
          {[-2400, -1200, 0, 1200, 2400, 3600].map((x, i) => (
            <g key={i}>
              <path d={`M${x - 360},${420} H${x + 360} V${436} H${x - 360} Z`} fill="#9AAAB3" />
              <path d={`M${x - 360},${700} H${x + 360} V${716} H${x - 360} Z`} fill="#9AAAB3" />
              {[0, 1, 2, 3, 4, 5].map((k) => {
                const bx = x - 300 + k * 110;
                const h = 90 + ((k * 37 + i * 13) % 50);
                const c = ['#7FC9C2', '#F2C46A', '#E98F7A', '#BFD8E6', '#9ED0B0', '#F0E2C0'][(k + i) % 6];
                return (
                  <g key={k}>
                    <path d={rr(bx, 420 - h, bx + 56, 420, 12)} fill={c} opacity={0.85} />
                    <path d={rr(bx + 4, 700 - h * 0.8, bx + 52, 700, 10)} fill={['#BFD8E6', '#F2C46A', '#7FC9C2'][(k + i * 2) % 3]} opacity={0.75} />
                  </g>
                );
              })}
            </g>
          ))}
          <path d="M1650,120 H2100 V860 H1650 Z" fill="#EAF6FB" stroke="#9AAAB3" strokeWidth={16} />
          <path d="M1875,120 V860 M1650,490 H2100" stroke="#9AAAB3" strokeWidth={10} />
        </g>
      </g>
      {tint > 0 && <rect x={-200} y={-200} width={1480} height={2320} fill="#DDE8EE" opacity={tint} />}
    </g>
  );
};

// ------------------------------------------------------------------ payloads and stations
/** the small block grasped at D (a light foam cube, ~5 mm) */
export const blockItems = (B: Basis, c: V3, h: V3, yaw: number): Item[] => [boxItem(B, c, h, BLOCK_C, {yaw, top: lit(BLOCK_C, 0.3)})];

/** the 43.6 mg polymer weight at E, with a knurled band */
export const weightItems = (B: Basis, c: V3): Item[] => {
  const r = 1.5, h = 2.0;
  return [cylinderItem(B, [c[0], c[1], c[2] - h], [c[0], c[1], c[2] + h], r, WEIGHT_C, {cap: lit(WEIGHT_C, 0.28)})];
};

/** the analytical balance at E: a round pan on a stem, the housing behind with its display */
export const Balance: React.FC<{B: Basis; x: number; reading: number; id: string}> = ({B, x, reading, id}) => {
  const items: Item[] = [];
  items.push(boxItem(B, [x, 26, 4.5], [34, 24, 7.5], '#E5EAED', {top: '#F1F4F6'}));
  items.push(cylinderItem(B, [x, 0, 1], [x, 0, 7.6], 1.6, '#9AA8B2'));
  items.push(cylinderItem(B, [x, 0, 7.6], [x, 0, 9], 13, '#D9E1E6', {cap: '#EEF2F5'}));
  // the display: a small panel on the housing's front, below and left of the pan
  const d0 = proj(B, [x + 9, 1.7, 4.4]);
  const d1 = proj(B, [x + 23, 1.7, 0.8]);
  const w = Math.abs(d1.x - d0.x), h = Math.abs(d1.y - d0.y);
  const X0 = Math.min(d0.x, d1.x), Y0 = Math.min(d0.y, d1.y);
  return (
    <g>
      {items.sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>)}
      <rect x={X0.toFixed(1)} y={Y0.toFixed(1)} width={w.toFixed(1)} height={h.toFixed(1)} rx={Math.min(8, h * 0.12).toFixed(1)} fill="#1C2D36" stroke={INK} strokeWidth={Math.max(1.5, h * 0.03).toFixed(2)} />
      <text x={(X0 + w * 0.72).toFixed(1)} y={(Y0 + h * 0.74).toFixed(1)} textAnchor="end" fontFamily='"JetBrains Mono", monospace' fontWeight={700} fontSize={(h * 0.62).toFixed(1)} fill="#7EE3C8">
        {reading.toFixed(1)}
      </text>
      <text x={(X0 + w * 0.93).toFixed(1)} y={(Y0 + h * 0.74).toFixed(1)} textAnchor="end" fontFamily='"JetBrains Mono", monospace' fontWeight={700} fontSize={(h * 0.34).toFixed(1)} fill="#7EE3C8" opacity={0.8}>
        mg
      </text>
    </g>
  );
};

/** the shallow tray at F (floor at TRAY_FLOOR, a raised rim); the rim's front is drawn by TrayRimFront over the scene */
export const TrayFloor: React.FC<{B: Basis; x: number; floor: number; half: [number, number]}> = ({B, x, floor, half}) => (
  <g>
    <path d={flatRect(B, x - half[0], x + half[0], -half[1], half[1], floor)} fill="#EEF2F3" stroke={INK} strokeWidth={1.5} />
    <path d={flatRect(B, x - half[0] + 3, x + half[0] - 3, -half[1] + 3, half[1] - 3, floor)} fill="#F7F9FA" />
  </g>
);
export const trayRimItems = (B: Basis, x: number, floor: number, half: [number, number], rimH: number): Item[] => {
  const c = '#CFE3EA';
  const t = 1.2;
  return [
    boxItem(B, [x, -half[1], floor + rimH / 2 - 1], [half[0], t, rimH / 2 + 1], c, {zBias: 0}),
    boxItem(B, [x, half[1], floor + rimH / 2 - 1], [half[0], t, rimH / 2 + 1], c, {zBias: 0}),
    boxItem(B, [x - half[0], 0, floor + rimH / 2 - 1], [t, half[1], rimH / 2 + 1], c),
    boxItem(B, [x + half[0], 0, floor + rimH / 2 - 1], [t, half[1], rimH / 2 + 1], c),
  ];
};

export {lit, mix, shade, smoothClosed, sub3, lerp3};
