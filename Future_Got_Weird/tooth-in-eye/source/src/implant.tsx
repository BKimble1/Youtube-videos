// The one tooth-and-lens implant, drawn by the same code in every shot: the canine with its block of jaw bone,
// the trimmed lamina (root dentin + a strip of bone), the drilled hole, the PMMA optical cylinder and the tissue
// that later grows over the lamina. It is a real extruded solid (orthographic projection), so its geometry holds
// from every angle; the front face carries the drawn anatomy through an exact affine map.
// Object space is millimetres, y up, the tooth's long axis on +x (apex at x=0, cusp tip at x=27), the labial face
// toward +z.
import React from 'react';
import {clamp, hash, lerp} from './lib';

export type V3 = [number, number, number];
export type Rot = {yaw: number; pitch: number; roll: number; spin?: number};
const D = Math.PI / 180;

export const rotM = ({yaw, pitch, roll, spin = 0}: Rot) => {
  const cy = Math.cos(yaw * D), sy = Math.sin(yaw * D), cp = Math.cos(pitch * D), sp = Math.sin(pitch * D), cr = Math.cos(roll * D), sr = Math.sin(roll * D);
  // R = Rz(roll) Rx(pitch) Ry(yaw) Rz(spin): spin turns the object in its own face plane first
  const Ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]];
  const Rx = [[1, 0, 0], [0, cp, -sp], [0, sp, cp]];
  const Rz = [[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]];
  const mul = (A: number[][], B: number[][]) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  const cs = Math.cos(spin * D), ss_ = Math.sin(spin * D);
  const Rs = [[cs, -ss_, 0], [ss_, cs, 0], [0, 0, 1]];
  return mul(Rz, mul(Rx, mul(Ry, Rs)));
};
const ap = (R: number[][], p: V3): V3 => [R[0][0] * p[0] + R[0][1] * p[1] + R[0][2] * p[2], R[1][0] * p[0] + R[1][1] * p[1] + R[1][2] * p[2], R[2][0] * p[0] + R[2][1] * p[1] + R[2][2] * p[2]];

// ---------------- geometry (mm) ----------------
/** half width of the canine root at x (apex x=0 .. CEJ x=17) */
export const rootW = (x: number) => (x <= 0 ? 0 : 3.75 * Math.pow(Math.min(x, 17) / 17, 0.55));
const CROWN_UP: [number, number][] = [[17, 3.75], [18.2, 4.05], [19.6, 4.12], [21.4, 3.85], [23.2, 3.05], [24.9, 2.0], [26.2, 0.95], [27, 0.25]];
const CROWN_LO: [number, number][] = [[27, 0.25], [26.4, -0.6], [25.2, -1.6], [23.6, -2.7], [21.6, -3.6], [19.6, -4.0], [18.2, -3.9], [17, -3.6]];
export const ROOT: [number, number][] = (() => {
  const up: [number, number][] = [], lo: [number, number][] = [];
  for (let i = 0; i <= 24; i++) {
    const x = 17 * (i / 24) ** 1.4;
    up.push([x, rootW(x) + (i === 0 ? 0 : 0)]);
    lo.push([x, -0.95 * rootW(x)]);
  }
  // round apex
  return [...lo.reverse(), [-0.25, 0], ...up];
})();
export const CROWN: [number, number][] = [...CROWN_LO.slice().reverse(), ...CROWN_UP.slice().reverse().slice(1)];
const jag = (a: [number, number], b: [number, number], n: number, amp: number, seed: number): [number, number][] => {
  const out: [number, number][] = [];
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  for (let i = 0; i < n; i++) {
    const u = i / n, j = i === 0 ? 0 : (hash(seed + i * 7.3) - 0.5) * amp;
    out.push([a[0] + dx * u + nx * j, a[1] + dy * u + ny * j]);
  }
  return out;
};
/** the block lifted out of the jaw: tooth + surrounding bone (CCW) */
export const BLOCK: [number, number][] = [
  ...jag([-1.8, -5.6], [17.4, -6.1], 10, 0.35, 11), [17.4, -6.1], [17.5, -3.9],
  ...CROWN_LO.slice().reverse(), ...CROWN_UP.slice().reverse().slice(1), [17.5, 3.9], [17.4, 6.0],
  ...jag([17.4, 6.0], [-1.8, 5.7], 10, 0.35, 23), ...jag([-1.8, 5.7], [-1.8, -5.6], 6, 0.3, 37),
];
/** the trimmed lamina: root dentin with a strip of bone along its upper side (CCW) */
export const LAMINA: [number, number][] = (() => {
  const lo: [number, number][] = [];
  for (let i = 0; i <= 14; i++) {
    const x = lerp(2.4, 16.6, i / 14);
    lo.push([x, -0.92 * rootW(x)]);
  }
  return [[1.5, -0.2], ...lo, [16.6, 0.0], [16.6, 5.5], [9, 5.6], [1.5, 5.35]];
})();
export const HOLE: [number, number] = [10.0, -0.1];   // through the root dentin, near the plate's middle
export const HOLE_R = 1.8;
export const Z_F = 1.6, Z_B = -1.6;             // lamina faces (3.2 mm thick); the block is the same slab
export const CYL_Z0 = -5.5, CYL_Z1 = 3.8;       // optical cylinder: 4 mm behind the lamina, 2.2 mm proud in front
/** the centre of the implant (hole axis) is the anchor for placing it in a scene */
export const ANCHOR: V3 = [HOLE[0], HOLE[1], 0];

const P = (pts: [number, number][]) => 'M' + pts.map((p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).join('L') + 'Z';
const inRoot = (x: number, y: number) => x > 0 && x < 17.2 && y < rootW(x) && y > -0.95 * rootW(x);
const inCrown = (x: number) => x >= 17.2;

// ---------------- materials ----------------
const MAT = {
  dentin: [240, 228, 196], bone: [222, 196, 164], enamel: [236, 238, 236], tissue: [222, 138, 132],
} as const;
const shade = (c: readonly number[], k: number, tint?: readonly number[], g = 0) => {
  const m = tint ? c.map((v, i) => lerp(v, tint[i], g)) : c;
  return `rgb(${m.map((v) => Math.round(clamp(v * k, 0, 255))).join(',')})`;
};
const LIGHT: V3 = (() => {const l: V3 = [-0.45, 0.6, 0.66]; const n = Math.hypot(...l); return l.map((v) => v / n) as V3;})();

// ---------------- the front-face anatomy (object coords, y up) ----------------
const pores = (() => {
  const out: {x: number; y: number; r: number; a: number}[] = [];
  for (let i = 0; i < 150; i++) {
    const x = -1.6 + 19 * hash(i * 3.17 + 1), y = -6 + 12 * hash(i * 5.31 + 2);
    out.push({x, y, r: 0.18 + 0.32 * hash(i * 1.7 + 3), a: 360 * hash(i * 9.1)});
  }
  return out;
})();
const canal = (() => {
  const up: [number, number][] = [], lo: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const x = lerp(0.9, 17.4, i / 12), w = lerp(0.08, 0.55, i / 12) + (x > 16 ? (x - 16) * 0.5 : 0);
    up.push([x, 0.05 + w]); lo.push([x, 0.05 - w]);
  }
  return [...lo, ...up.reverse()];
})();

const FrontFace: React.FC<{id: string; outline: [number, number][]; withCrown: boolean; tissue: number; px: number; vessels: number}> = ({id, outline, withCrown, tissue, px, vessels}) => {
  const ink = 'rgba(52,32,22,0.9)';
  return (
    <g>
      <defs>
        <clipPath id={`${id}o`}><path d={P(outline)} /></clipPath>
        <clipPath id={`${id}r`}><path d={P(ROOT)} /></clipPath>
        <linearGradient id={`${id}bone`} x1="0" y1="1" x2="0.2" y2="0"><stop offset="0" stopColor="#D2B392" /><stop offset="1" stopColor="#E8D3B8" /></linearGradient>
        <linearGradient id={`${id}den`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFBEF" /><stop offset="0.55" stopColor="#F6EBD0" /><stop offset="1" stopColor="#E2CDA0" /></linearGradient>
        <linearGradient id={`${id}en`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.6" stopColor="#EEF1F2" /><stop offset="1" stopColor="#CFD8DC" /></linearGradient>
      </defs>
      <g clipPath={`url(#${id}o)`}>
        {/* bone everywhere, porous */}
        <path d={P(outline)} fill={`url(#${id}bone)`} />
        {pores.map((p, i) => (
          <ellipse key={i} cx={p.x} cy={p.y} rx={p.r * 0.8} ry={p.r * 0.55} transform={`rotate(${p.a} ${p.x} ${p.y})`} fill={i % 3 ? '#B48A6C' : '#B9726A'} opacity={0.6} />
        ))}
        {/* the root */}
        <path d={P(ROOT)} fill={`url(#${id}den)`} />
        <g clipPath={`url(#${id}r)`}>
          <path d={P(ROOT)} fill="none" stroke="#D2B47E" strokeWidth={0.55} />
          <path d={P(canal)} fill="#B9806C" />
          <path d={P(canal)} fill="none" stroke="#8E5848" strokeWidth={0.12} />
          {/* growth lines in the dentin */}
          {[0.45, 0.7].map((k, i) => (
            <path key={i} d={'M' + Array.from({length: 13}, (_, j) => {const x = lerp(1.5, 17, j / 12); return `${x},${rootW(x) * k}`;}).join('L')} fill="none" stroke="#E0C99C" strokeWidth={0.12} />
          ))}
          {[0.45, 0.7].map((k, i) => (
            <path key={`l${i}`} d={'M' + Array.from({length: 13}, (_, j) => {const x = lerp(1.5, 17, j / 12); return `${x},${-0.95 * rootW(x) * k}`;}).join('L')} fill="none" stroke="#E0C99C" strokeWidth={0.12} />
          ))}
        </g>
        <path d={P(ROOT)} fill="none" stroke="#C9A35E" strokeWidth={0.32} />
        <path d={P(ROOT)} fill="none" stroke="rgba(110,76,40,0.7)" strokeWidth={0.12} />
        {withCrown && (
          <g>
            <path d={P(CROWN)} fill={`url(#${id}en)`} />
            <path d="M18.6,2.9 C21,3.2 23.5,2.2 25.4,0.9" fill="none" stroke="#FFFFFF" strokeWidth={0.55} strokeLinecap="round" opacity={0.9} />
            <path d="M17.2,3.7 C17.6,1.2 17.6,-1.4 17.2,-3.5" fill="none" stroke="#C9B791" strokeWidth={0.22} />
            <path d={P(CROWN)} fill="none" stroke="rgba(90,90,90,0.5)" strokeWidth={0.14} />
          </g>
        )}
        {/* cortical rim of the sawn bone */}
        <path d={P(outline)} fill="none" stroke="#EBD3B2" strokeWidth={0.7} opacity={0.75} />
        {tissue > 0 && (
          <g opacity={tissue}>
            <path d={P(outline)} fill="#E79A94" opacity={0.78} />
            {VESSELS.map((v, i) => (
              <path key={i} d={v.d} fill="none" stroke="#B42F38" strokeWidth={v.w} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(vessels * 1.6 - v.lag)} opacity={0.85} />
            ))}
            <path d={P(outline)} fill="none" stroke="#C86E6C" strokeWidth={0.6} opacity={0.8} />
          </g>
        )}
      </g>
      <path d={P(outline)} fill="none" stroke={ink} strokeWidth={2.4 * px} strokeLinejoin="round" />
    </g>
  );
};
// fibrovascular tissue over the lamina (around the cylinder, never on it)
const VESSELS = (() => {
  const out: {d: string; w: number; lag: number}[] = [];
  const trunks: [number, number, number, number][] = [[1.5, 4.8, 15.8, 4.3], [2, 0.5, 9.5, 2.6], [16.4, -2.8, 14.5, 1.6], [2.4, 2.8, 8.6, -0.7], [16.5, 2.4, 13.9, 1.9]];
  trunks.forEach(([x0, y0, x1, y1], i) => {
    const mx = (x0 + x1) / 2 + (hash(i + 4) - 0.5) * 2, my = (y0 + y1) / 2 + (hash(i + 9) - 0.5) * 2;
    out.push({d: `M${x0},${y0} Q${mx},${my} ${x1},${y1}`, w: 0.28, lag: i * 0.08});
    for (let k = 0; k < 3; k++) {
      const u = 0.3 + 0.25 * k, bx = lerp(x0, x1, u), by = lerp(y0, y1, u);
      const ex = bx + (hash(i * 5 + k) - 0.5) * 4, ey = by + (hash(i * 7 + k + 2) - 0.5) * 3;
      out.push({d: `M${bx},${by} Q${(bx + ex) / 2 + 0.6},${(by + ey) / 2 - 0.4} ${ex},${ey}`, w: 0.14, lag: 0.25 + i * 0.05 + k * 0.06});
    }
  });
  return out;
})();

// ---------------- convex hull for cylinder silhouettes ----------------
const hull = (pts: [number, number][]) => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [], up: [number, number][] = [];
  for (const q of p) {while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q);}
  for (const q of p.slice().reverse()) {while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q);}
  return lo.slice(0, -1).concat(up.slice(0, -1));
};

export type ImplantProps = {
  id: string;
  x: number; y: number;           // where the hole axis lands (scene units)
  s: number;                       // scene units per mm
  rot: Rot;
  px: number;                      // one screen pixel in scene units
  piece?: 'block' | 'lamina';
  offset?: V3;                     // object-space offset of the whole piece (mm)
  hole?: number;                   // 0 none .. 1 drilled through
  cyl?: number;                    // 0 none, 1 present
  cylDz?: number;                  // cylinder offset along its axis (mm), + toward the viewer side
  cylMode?: 'clear' | 'eye';
  tissue?: number; vessels?: number;
  holeBg?: string;                 // colour seen through the empty hole
  opacity?: number;
  only?: 'all' | 'cylFront';
  outline?: [number, number][];    // a cut-off piece instead of the block or lamina
  glintFlip?: boolean;             // the implant is drawn mirrored (keep the glint upper-left)
  crown?: boolean;
};

export const Implant: React.FC<ImplantProps> = (pr) => {
  const {id, x, y, s, rot, px, piece = 'lamina', offset = [0, 0, 0], hole = 1, cyl = 1, cylDz = 0, cylMode = 'eye', tissue = 0, vessels = 0, holeBg = '#20323A', opacity = 1} = pr;
  const R = rotM(rot);
  const outline = pr.outline ?? (piece === 'block' ? BLOCK : LAMINA);
  const withCrown = pr.crown ?? piece === 'block';
  const ox = offset[0] - ANCHOR[0], oy = offset[1] - ANCHOR[1], oz = offset[2];
  const pr3 = (p: V3) => {const q = ap(R, [p[0] + ox, p[1] + oy, p[2] + oz]); return [x + s * q[0], y - s * q[1], q[2]] as [number, number, number];};
  const mat = (zf: number) => {
    const e = ap(R, [ox, oy, zf + oz]);
    return `matrix(${s * R[0][0]},${-s * R[1][0]},${s * R[0][1]},${-s * R[1][1]},${x + s * e[0]},${y - s * e[1]})`;
  };
  const front = R[2][2] > 0; // +z face toward the viewer
  const pxo = px / s; // one pixel in object mm
  // side walls
  const n = outline.length;
  const quads: {d: string; z: number; fill: string}[] = [];
  for (let i = 0; i < n; i++) {
    const a = outline[i], b = outline[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const nr = ap(R, [dy / L, -dx / L, 0]);
    if (nr[2] <= 0.0) continue;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const m = withCrown && inCrown(mx) ? MAT.enamel : inRoot(mx, my) || (piece === 'lamina' && Math.abs(mx - 16.6) < 0.01 && my < rootW(16.6)) ? MAT.dentin : MAT.bone;
    const k = 0.62 + 0.42 * Math.max(0, nr[0] * LIGHT[0] + nr[1] * LIGHT[1] + nr[2] * LIGHT[2]);
    const c = [pr3([a[0], a[1], Z_F]), pr3([b[0], b[1], Z_F]), pr3([b[0], b[1], Z_B]), pr3([a[0], a[1], Z_B])];
    quads.push({d: 'M' + c.map((p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).join('L') + 'Z', z: (c[0][2] + c[2][2]) / 2, fill: shade(m, k, MAT.tissue, tissue * 0.85)});
  }
  quads.sort((a, b) => a.z - b.z);
  const faceZ = front ? Z_F : Z_B;
  const backZ = front ? Z_B : Z_F;
  // the hole on the visible face
  const holeEl = hole > 0 && (
    <g transform={mat(faceZ)}>
      <circle cx={HOLE[0]} cy={HOLE[1]} r={HOLE_R} fill={tissue > 0.5 ? '#9E5752' : '#7A5A3A'} />
      {/* the bored wall in shadow, deeper as the drill goes on */}
      <circle cx={HOLE[0] + 0.25} cy={HOLE[1] - 0.25} r={HOLE_R * (0.55 + 0.3 * clamp(hole))} fill="#3E2A1A" opacity={0.55 + 0.35 * clamp(hole)} />
      <path d={`M${HOLE[0] - HOLE_R * 0.92},${HOLE[1] + 0.5} A${HOLE_R} ${HOLE_R} 0 0 1 ${HOLE[0] + 0.6},${HOLE[1] + HOLE_R * 0.9}`} fill="none" stroke="#E9D6AE" strokeWidth={0.22} opacity={0.8} />
      <circle cx={HOLE[0]} cy={HOLE[1]} r={HOLE_R} fill="none" stroke="rgba(60,40,25,0.9)" strokeWidth={1.8 * pxo} />
    </g>
  );
  const seeThrough = hole >= 1 && (() => {
    // the far opening seen through the near one: intersection of the two projected circles
    const e = ap(R, [0, 0, backZ - faceZ]);
    return (
      <g>
        <defs><clipPath id={`${id}hc`}><circle cx={HOLE[0]} cy={HOLE[1]} r={HOLE_R} transform={mat(faceZ)} /></clipPath></defs>
        <g clipPath={`url(#${id}hc)`}>
          <circle cx={HOLE[0]} cy={HOLE[1]} r={HOLE_R} transform={`translate(${s * e[0]},${-s * e[1]}) ${mat(faceZ)}`} fill={holeBg} />
        </g>
      </g>
    );
  })();
  // cylinder
  const cylSeg = (z0: number, z1: number, key: string) => {
    if (z1 - z0 < 0.01) return null;
    const N = 40, ring = (z: number) => Array.from({length: N}, (_, i) => {const a = (i / N) * 2 * Math.PI; return pr3([HOLE[0] + HOLE_R * Math.cos(a), HOLE[1] + HOLE_R * Math.sin(a), z]);});
    const r0 = ring(z0), r1 = ring(z1);
    const h = hull([...r0, ...r1].map((p) => [p[0], p[1]] as [number, number]));
    const capZ = R[2][2] > 0 ? z1 : z0;
    const capFar = R[2][2] > 0 ? z0 : z1;
    const capPts = capZ === z1 ? r1 : r0;
    const farPts = capFar === z1 ? r1 : r0;
    const d = (pts: number[][]) => 'M' + pts.map((p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`).join('L') + 'Z';
    // a highlight line along the side, on the lit side
    const hl = [pr3([HOLE[0] - HOLE_R * 0.55, HOLE[1] + HOLE_R * 0.75, z0 + 0.2]), pr3([HOLE[0] - HOLE_R * 0.55, HOLE[1] + HOLE_R * 0.75, z1 - 0.2])];
    const isCap = (capZ === CYL_Z1 + cylDz && R[2][2] > 0) || (capZ === CYL_Z0 + cylDz && R[2][2] <= 0);
    if (cylMode === 'clear') {
      const hl2 = [pr3([HOLE[0] + HOLE_R * 0.7, HOLE[1] - HOLE_R * 0.6, z0 + 0.3]), pr3([HOLE[0] + HOLE_R * 0.7, HOLE[1] - HOLE_R * 0.6, z1 - 0.3])];
      return (
        <g key={key}>
          <path d={d(h)} fill="rgba(205,238,250,0.42)" stroke="rgba(28,78,104,0.95)" strokeWidth={2.2 * px} strokeLinejoin="round" />
          <path d={d(farPts)} fill="rgba(150,205,228,0.25)" stroke="rgba(60,125,150,0.55)" strokeWidth={1.3 * px} />
          <path d={`M${hl[0][0]},${hl[0][1]}L${hl[1][0]},${hl[1][1]}`} stroke="rgba(255,255,255,0.95)" strokeWidth={4 * px} strokeLinecap="round" />
          <path d={`M${hl2[0][0]},${hl2[0][1]}L${hl2[1][0]},${hl2[1][1]}`} stroke="rgba(40,100,130,0.45)" strokeWidth={3 * px} strokeLinecap="round" />
          <path d={d(capPts)} fill={isCap ? 'rgba(230,248,255,0.6)' : 'rgba(200,232,245,0.3)'} stroke="rgba(28,78,104,0.95)" strokeWidth={2 * px} />
        </g>
      );
    }
    return (
      <g key={key}>
        <path d={d(h)} fill="#3B4A55" stroke="rgba(20,25,30,0.95)" strokeWidth={2.2 * px} strokeLinejoin="round" />
        <path d={`M${hl[0][0]},${hl[0][1]}L${hl[1][0]},${hl[1][1]}`} stroke="rgba(220,235,245,0.55)" strokeWidth={3 * px} strokeLinecap="round" />
        <path d={d(capPts)} fill={isCap ? '#0C1218' : '#1A242C'} stroke="rgba(150,175,190,0.9)" strokeWidth={1.6 * px} />
      </g>
    );
  };
  const capGlint = (z: number) => {
    // a specular glint and a faint reflection on the visible front cap of an in-eye cylinder
    if (cylMode !== 'eye' || !(R[2][2] > 0)) return null;
    const gf = pr.glintFlip ? -1 : 1;
    const c = pr3([HOLE[0] - 0.6, HOLE[1] + 0.7 * gf, z]);
    const c2 = pr3([HOLE[0] + 0.7, HOLE[1] - 0.5 * gf, z]);
    return (
      <g>
        <ellipse cx={c[0]} cy={c[1]} rx={0.42 * s} ry={0.28 * s} fill="rgba(255,255,255,0.92)" transform={`rotate(${-30 * gf} ${c[0]} ${c[1]})`} />
        <circle cx={c2[0]} cy={c2[1]} r={0.18 * s} fill="rgba(200,225,240,0.6)" />
      </g>
    );
  };
  const z0 = CYL_Z0 + cylDz, z1 = CYL_Z1 + cylDz;
  const behind = cyl > 0 ? (front ? cylSeg(z0, Math.min(z1, Z_B), 'cb') : cylSeg(Math.max(z0, Z_F), z1, 'cb')) : null;
  const inFront = cyl > 0 ? (front ? cylSeg(Math.max(z0, Z_F), z1, 'cf') : cylSeg(z0, Math.min(z1, Z_B), 'cf')) : null;
  if (pr.only === 'cylFront') return <g opacity={opacity}>{inFront}{front && cyl > 0 && capGlint(z1)}</g>;
  const ink = 'rgba(52,32,22,0.92)';
  const backD = P(outline);
  const seated = cyl > 0 && Math.abs(cylDz) < 0.3;
  return (
    <g opacity={opacity}>
      {behind}
      {/* silhouette pass: everything stroked wide in ink, then the fills cover the inner half */}
      <g>
        <path d={backD} transform={mat(backZ)} fill={ink} stroke={ink} strokeWidth={4.4 * pxo} strokeLinejoin="round" />
        {quads.map((q, i) => <path key={`s${i}`} d={q.d} fill={ink} stroke={ink} strokeWidth={4.4 * px} strokeLinejoin="round" />)}
        <path d={backD} transform={mat(faceZ)} fill={ink} stroke={ink} strokeWidth={4.4 * pxo} strokeLinejoin="round" />
      </g>
      <path d={backD} transform={mat(backZ)} fill={shade(MAT.bone, 0.7, MAT.tissue, tissue)} />
      {quads.map((q, i) => <path key={i} d={q.d} fill={q.fill} stroke={q.fill} strokeWidth={0.9 * px} strokeLinejoin="round" />)}
      {(() => {
        // the neck cut (x = 16.6): the root in cross-section, dentin round the pulp canal, a strip of bone
        if (pr.outline || piece !== 'lamina') return null;
        const X0 = 16.6, n = ap(R, [1, 0, 0]);
        if (n[2] <= 0.05) return null;
        const e0 = ap(R, [X0 + ox, oy, oz]);
        const m = `matrix(${s * R[0][1]},${-s * R[1][1]},${s * R[0][2]},${-s * R[1][2]},${x + s * e0[0]},${y - s * e0[1]})`;
        const rw = rootW(16.6), lo = -0.92 * rw;
        return (
          <g transform={m}>
            <rect x={lo} y={Z_B} width={5.5 - lo} height={Z_F - Z_B} fill="#C99B73" />
            {pores.filter((_, i) => i % 3 === 0).map((p, i) => <circle key={i} cx={rw + 0.3 + (p.x / 19) * (5.5 - rw - 0.5)} cy={Z_B + 0.3 + ((p.y + 6) / 12) * (Z_F - Z_B - 0.6)} r={0.16} fill="#8C5E40" opacity={0.7} />)}
            <rect x={lo} y={Z_B} width={rw - lo} height={Z_F - Z_B} fill="#FBF3DD" />
            <rect x={lo + 0.35} y={Z_B + 0.25} width={rw - lo - 0.7} height={Z_F - Z_B - 0.5} fill="none" stroke="#E6D2A6" strokeWidth={0.12} rx={0.6} />
            <ellipse cx={0.05} cy={0} rx={0.62} ry={0.55} fill="#A8695A" stroke="#7E4A3E" strokeWidth={0.08} />
            <line x1={rw} x2={rw} y1={Z_B} y2={Z_F} stroke="#D2B47E" strokeWidth={0.25} />
            <line x1={lo} x2={lo} y1={Z_B} y2={Z_F} stroke="#D2B47E" strokeWidth={0.25} />
            <rect x={lo} y={Z_B} width={5.5 - lo} height={Z_F - Z_B} fill="none" stroke="rgba(52,32,22,0.85)" strokeWidth={1.6 * pxo} />
          </g>
        );
      })()}
      <g transform={mat(faceZ)}>
        {front ? (
          <FrontFace id={`${id}f`} outline={outline} withCrown={withCrown} tissue={tissue} px={pxo} vessels={vessels} />
        ) : (
          <g>
            <path d={P(outline)} fill={shade(MAT.bone, 0.95, MAT.tissue, tissue * 0.85)} />
            <g clipPath={`url(#${id}bk)`} opacity={0.5}>
              <defs><clipPath id={`${id}bk`}><path d={P(outline)} /></clipPath></defs>
              {pores.filter((_, i) => i % 2 === 0).map((p, i) => <ellipse key={i} cx={p.x} cy={p.y} rx={p.r} ry={p.r * 0.7} fill="#9C6E4E" />)}
              <path d={P(ROOT)} fill="#E4D2AA" />
            </g>
            <path d={P(outline)} fill="none" stroke={ink} strokeWidth={2.4 * pxo} />
          </g>
        )}
      </g>
      {seated ? (
        <g transform={mat(faceZ)}><circle cx={HOLE[0]} cy={HOLE[1]} r={HOLE_R} fill={holeBg} opacity={cylMode === 'clear' ? 0.85 : 1} /></g>
      ) : (
        <>{holeEl}{seeThrough}</>
      )}
      {inFront}
      {cyl > 0 && capGlint(z1)}
    </g>
  );
};

// ---------------- the same implant cut through the hole axis (section views of the eye) ----------------
// Drawn in section-scene mm, the cylinder axis along +x (toward the front of the eye), y down. The lamina's own +y
// (the bone strip) is up. x is measured from the lamina's mid-plane.
export const ImplantSection: React.FC<{x: number; y: number; px: number; tissue: number; id: string}> = ({x, y, px, tissue, id}) => {
  const top = -(5.55 - HOLE[1]), bot = -(-0.92 * rootW(HOLE[0]) - HOLE[1]); // screen y of lamina top (bone) and bottom
  const rootTop = -(rootW(HOLE[0]) - HOLE[1]);
  const hy0 = -HOLE_R, hy1 = HOLE_R;
  return (
    <g transform={`translate(${x},${y})`}>
      <defs>
        <pattern id={`${id}pp`} width="0.9" height="0.9" patternUnits="userSpaceOnUse"><rect width="0.9" height="0.9" fill="#D7B28B" /><circle cx="0.3" cy="0.35" r="0.18" fill="#A5795A" /><circle cx="0.72" cy="0.7" r="0.12" fill="#A5795A" /></pattern>
      </defs>
      {tissue > 0 && <rect x={Z_B - 0.55 * tissue} y={top - 0.55 * tissue} width={Z_F - Z_B + 1.1 * tissue} height={bot - top + 1.1 * tissue} rx={0.6} fill="#E08F8A" opacity={clamp(tissue)} />}
      {/* bone strip */}
      <rect x={Z_B} y={top} width={Z_F - Z_B} height={rootTop - top} fill={`url(#${id}pp)`} />
      {/* dentin, split by the cylinder */}
      <rect x={Z_B} y={rootTop} width={Z_F - Z_B} height={hy0 - rootTop} fill="#F0E2BF" />
      <rect x={Z_B} y={hy1} width={Z_F - Z_B} height={bot - hy1} fill="#F0E2BF" />
      <rect x={Z_B} y={top} width={Z_F - Z_B} height={bot - top} fill="none" stroke="rgba(52,32,22,0.9)" strokeWidth={2.2 * px} />
      <line x1={Z_B} x2={Z_F} y1={rootTop} y2={rootTop} stroke="rgba(120,84,50,0.6)" strokeWidth={1.2 * px} />
      {/* the cylinder */}
      <rect x={CYL_Z0} y={hy0} width={CYL_Z1 - CYL_Z0} height={hy1 - hy0} rx={0.25} fill="rgba(180,220,238,0.55)" stroke="rgba(30,70,95,0.95)" strokeWidth={2 * px} />
      <line x1={CYL_Z0 + 0.4} x2={CYL_Z1 - 0.4} y1={hy0 + 0.5} y2={hy0 + 0.5} stroke="rgba(255,255,255,0.85)" strokeWidth={2.4 * px} strokeLinecap="round" />
    </g>
  );
};
export const SECTION_EXTENT = {top: -(5.55 - HOLE[1]), bot: -(-0.92 * rootW(HOLE[0]) - HOLE[1])};

/** the affine map of an object-space plane z=zf into the scene, for drawing on the implant's faces from outside */
export const faceMatrix = (x: number, y: number, s: number, rot: Rot, zf = Z_F, offset: V3 = [0, 0, 0]) => {
  const R = rotM(rot);
  const e = ap(R, [offset[0] - ANCHOR[0], offset[1] - ANCHOR[1], zf + offset[2]]);
  return `matrix(${s * R[0][0]},${-s * R[1][0]},${s * R[0][1]},${-s * R[1][1]},${x + s * e[0]},${y - s * e[1]})`;
};
/** project an object-space point into the scene */
export const projectPt = (x: number, y: number, s: number, rot: Rot, p: V3, offset: V3 = [0, 0, 0]): [number, number, number] => {
  const R = rotM(rot);
  const q = ap(R, [p[0] + offset[0] - ANCHOR[0], p[1] + offset[1] - ANCHOR[1], p[2] + offset[2]]);
  return [x + s * q[0], y - s * q[1], q[2]];
};
/** a point at fraction u along a closed polygon (by length) */
export const alongPoly = (poly: [number, number][], u: number): [number, number] => {
  const L: number[] = [0];
  for (let i = 0; i < poly.length; i++) {const a = poly[i], b = poly[(i + 1) % poly.length]; L.push(L[i] + Math.hypot(b[0] - a[0], b[1] - a[1]));}
  const target = clamp(u) * L[L.length - 1];
  for (let i = 0; i < poly.length; i++) {
    if (target <= L[i + 1]) {
      const a = poly[i], b = poly[(i + 1) % poly.length], k = (target - L[i]) / (L[i + 1] - L[i] || 1);
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
  }
  return poly[0];
};

/** the pieces the saw trims away: the crown (cut at the neck) and the offcut of bone round the apex and under the root */
export const CROWN_PIECE: [number, number][] = [[16.6, -3.45], ...CROWN_LO.slice().reverse(), ...CROWN_UP.slice().reverse().slice(1), [16.6, 3.8]];
export const OFFCUT: [number, number][] = (() => {
  const lo: [number, number][] = [];
  for (let i = 14; i >= 0; i--) {const x = lerp(2.4, 16.6, i / 14); lo.push([x, -0.92 * rootW(x)]);}
  return [...jag([-1.8, -5.6], [17.4, -6.1], 10, 0.35, 11), [17.4, -6.1], [17.5, -3.9], ...lo, [1.5, -0.2], [1.5, 5.35], [-1.8, 5.7]];
})();
