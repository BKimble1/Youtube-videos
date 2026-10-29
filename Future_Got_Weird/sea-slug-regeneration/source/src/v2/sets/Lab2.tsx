// The V2 lab set, drawn through the shot camera in world units (1 unit ~ 0.2 mm; the slug is 100 long):
// a glass culture dish of seawater on a pale bench, its floor of fine pale sand with grains, shell grit and a few
// drifted algae fragments (references the crawling head passes), the dish wall and rim behind, and the FGW lab wall
// (teal band, shelves of coloured bottles) far behind, out of focus.
import React from 'react';
import {INK} from '../../kit/dc/ink';
import {Basis, P2, V3, proj, projPoly} from '../../kit/three';
import {lit, shade} from '../../kit/dc/color';
import {clamp, rng} from '../../lib';

const blobPts = (c: V3, rx: number, ry: number, rot: number, n: number, wob: number, R: () => number): V3[] =>
  Array.from({length: n}, (_, k) => {
    const a = (k / n) * Math.PI * 2;
    const r = 1 + wob * (R() - 0.5) * 2;
    const x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    return [c[0] + x * cr - y * sr, c[1] + x * sr + y * cr, c[2]];
  });

// sand grains, shell grit, pebbles: fixed in the world
type Grain = {c: V3; r: number; col: string; rot: number; kind: 'grain' | 'pebble' | 'shell'};
const R0 = rng(4040);
export const GRAINS: Grain[] = [];
for (let i = 0; i < 520; i++) {
  const c: V3 = [(R0() - 0.5) * 520, (R0() - 0.5) * 640 + 40, 0];
  const k = R0();
  GRAINS.push({c, r: k < 0.9 ? 0.35 + R0() * 0.9 : 1.6 + R0() * 2.6, col: ['#D8CDB8', '#C9BDA6', '#E6DDCB', '#B9AE98', '#EFE7D8'][Math.floor(R0() * 5)], rot: R0() * 6, kind: k < 0.9 ? 'grain' : k < 0.97 ? 'pebble' : 'shell'});
}

/** drifted algae fragments on the sand (small feathery Bryopsis pieces), placed as path landmarks */
export type Frag = {c: V3; ang: number; len: number; seed: number};
export const FRAGS: Frag[] = [
  {c: [16, -42, 0], ang: 0.6, len: 13, seed: 1},
  {c: [-22, -96, 0], ang: 2.4, len: 11, seed: 2},
  {c: [30, 40, 0], ang: -0.4, len: 10, seed: 3},
  {c: [-30, 30, 0], ang: 1.9, len: 12, seed: 4},
  {c: [6, -150, 0], ang: 1.1, len: 12, seed: 5},
  {c: [-44, -30, 0], ang: -1.2, len: 9, seed: 6},
];

const fragEls = (B: Basis, f: Frag, t: number, k: string) => {
  const R = rng(f.seed * 97);
  const pts: V3[] = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = f.ang + Math.sin(u * 3 + f.seed) * 0.3 + Math.sin(t * 0.9 + f.seed + u) * 0.04 * u;
    const prev = pts[i - 1] ?? f.c;
    pts.push(i === 0 ? f.c : [prev[0] + Math.cos(a) * (f.len / n), prev[1] + Math.sin(a) * (f.len / n), 0.3 + 0.8 * Math.sin(Math.PI * u)]);
  }
  const s = proj(B, f.c).s;
  const main = pts.map((q) => proj(B, q));
  // soft Bryopsis: a translucent stalk with two close rows of fine pinnules that curve gently toward the tip and
  // shorten along it (no outline: the filaments are thin, wet and see-through)
  const br: React.ReactNode[] = [];
  const m = 16;
  for (let i = 2; i < m; i++) {
    const u = i / m, j = Math.min(n - 1, Math.max(1, Math.round(u * n)));
    for (const sd of [1, -1]) {
      const p0 = pts[j];
      const tang = Math.atan2(pts[j + 1][1] - pts[j - 1][1], pts[j + 1][0] - pts[j - 1][0]);
      const L = (2.6 * Math.pow(1 - u, 0.8) + 0.7) * (0.8 + R() * 0.4);
      const a0 = tang + sd * (0.95 + R() * 0.2), a1 = tang + sd * (0.45 + R() * 0.15);
      const back = (u - j / n) * f.len;
      const o: V3 = [p0[0] + Math.cos(tang) * back, p0[1] + Math.sin(tang) * back, p0[2]];
      const q1: V3 = [o[0] + Math.cos(a0) * L * 0.5, o[1] + Math.sin(a0) * L * 0.5, o[2] + 0.25];
      const q2: V3 = [q1[0] + Math.cos(a1) * L * 0.5, q1[1] + Math.sin(a1) * L * 0.5, o[2] + 0.35];
      const A = proj(B, o), Q1 = proj(B, q1), Q2 = proj(B, q2);
      br.push(<path key={`${i}${sd}`} d={`M${P2(A)} Q${P2(Q1)} ${P2(Q2)}`} stroke="#6CBE4E" strokeWidth={Math.max(0.9, 0.24 * s)} fill="none" strokeLinecap="round" opacity={0.9} />);
    }
  }
  const d = `M${main.map(P2).join(' L')}`;
  return (
    <g key={k}>
      <path d={d} stroke="#3E7F34" strokeWidth={Math.max(1.3, 0.6 * s)} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
      <path d={d} stroke="#5DB044" strokeWidth={Math.max(1, 0.42 * s)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {br}
      <path d={d} stroke="#BDE99A" strokeWidth={Math.max(0.5, 0.14 * s)} fill="none" strokeLinecap="round" opacity={0.75} />
    </g>
  );
};

/** grains drawn as tiny shaded lumps; `near`/`far` limits let the caller put a band of them in a blurred layer */
const grainEls = (B: Basis, filter: (z: number) => boolean) => {
  const out: React.ReactNode[] = [];
  GRAINS.forEach((g, i) => {
    const P = proj(B, g.c);
    if (P.z < 5 || !filter(P.z)) return;
    if (P.x < -80 || P.x > 1160 || P.y < -80 || P.y > 2000) return;
    const rr = g.r * P.s;
    if (rr < 0.5) return;
    const R = rng(i + 11);
    const d = projPoly(B, blobPts([g.c[0], g.c[1], 0.02], g.r, g.r * 0.8, g.rot, 9, 0.25, R));
    if (!d) return;
    if (g.kind === 'grain') out.push(<path key={i} d={d} fill={g.col} opacity={0.9} />);
    else {
      const top = proj(B, [g.c[0] - g.r * 0.25, g.c[1] - g.r * 0.2, g.r * 0.5]);
      out.push(
        <g key={i}>
          <path d={d} fill={g.kind === 'shell' ? '#F3EEE3' : shade(g.col, 0.15)} stroke={INK} strokeWidth={Math.max(0.8, 0.12 * P.s)} />
          <ellipse cx={top.x} cy={top.y} rx={rr * 0.45} ry={rr * 0.28} fill={lit(g.col, 0.6)} opacity={0.7} />
          {g.kind === 'shell' && <path d={`M${P2(proj(B, [g.c[0] - g.r * 0.6, g.c[1], 0.3]))} Q${P2(proj(B, [g.c[0], g.c[1] + g.r * 0.4, 0.6]))} ${P2(proj(B, [g.c[0] + g.r * 0.6, g.c[1], 0.3]))}`} stroke="#C9BFAE" strokeWidth={Math.max(0.6, 0.1 * P.s)} fill="none" />}
        </g>,
      );
    }
  });
  return out;
};

/** the FGW lab wall far behind (pale wall, teal band, shelves of coloured bottles), scaled to this world */
const LabWall: React.FC<{B: Basis; id: string; wallY: number; blur: number; K: number}> = ({B, id, wallY, blur, K}) => {
  const P = (ax: number, ay: number): V3 => [ax * K - 600 * K, wallY, (1100 - ay) * K - 6];
  const o = proj(B, P(0, 0)), px = proj(B, P(1000, 0)), py = proj(B, P(0, 1000));
  if (o.z < 10) return null;
  const m = [(px.x - o.x) / 1000, (px.y - o.y) / 1000, (py.x - o.x) / 1000, (py.y - o.y) / 1000, o.x, o.y].map((v) => v.toFixed(5)).join(' ');
  const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
    `M${x0 + r},${y0} H${x1 - r} Q${x1},${y0} ${x1},${y0 + r} V${y1 - r} Q${x1},${y1} ${x1 - r},${y1} H${x0 + r} Q${x0},${y1} ${x0},${y1 - r} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} Z`;
  return (
    <g>
      <defs>
        <filter id={`${id}-b`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={blur.toFixed(2)} />
        </filter>
      </defs>
      <g filter={`url(#${id}-b)`}>
        <g transform={`matrix(${m})`}>
          <path d="M-4500,-3000 H6500 V1300 H-4500 Z" fill="#D6E5EC" />
          <path d="M-4500,960 H6500 V1010 H-4500 Z" fill="#2FA7A0" opacity={0.75} />
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
          <path d="M-4500,1010 H6500 V1300 H-4500 Z" fill="#E9EEF0" />
        </g>
      </g>
    </g>
  );
};

export const DISH2 = {c: [0, 40, 0] as V3, r: 260, wall: 46};

/** back layers: the lab wall, the bench, the dish's far wall and its sand floor with grains and fragments */
export const LabBack: React.FC<{B: Basis; id: string; t: number; dim?: number; focusZ: number; frags?: Frag[]}> = ({B, id, t, dim = 0, focusZ, frags = FRAGS}) => {
  const ring = (r: number, z: number, n = 120) => Array.from({length: n}, (_, i) => [DISH2.c[0] + Math.cos((i / n) * Math.PI * 2) * r, DISH2.c[1] + Math.sin((i / n) * Math.PI * 2) * r, z] as V3);
  const s0 = proj(B, DISH2.c).s;
  // depth of field: things far behind the subject blur with distance
  const bAt = (z: number) => clamp((z - focusZ) / focusZ * 9, 0, 16);
  const wallZ = proj(B, [0, 2400, 200]).z;
  // a caustic net of light on the sand, drifting slowly
  const caustics: React.ReactNode[] = [];
  const CR = rng(77);
  for (let i = 0; i < 34; i++) {
    const cx = (CR() - 0.5) * 420, cy = (CR() - 0.5) * 520 + 40, r = 14 + CR() * 26;
    const pts = blobPts([cx + Math.sin(t * 0.5 + i) * 6, cy + Math.cos(t * 0.4 + i) * 6, 0.05], r, r * 0.7, CR() * 6, 10, 0.3, rng(i + 300));
    caustics.push(<path key={i} d={projPoly(B, pts)} fill="none" stroke="#FFFDF4" strokeWidth={Math.max(1, 0.5 * s0)} opacity={0.35} />);
  }
  return (
    <g>
      <defs>
        <filter id={`${id}cs`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={Math.max(1.5, 0.9 * s0)} />
        </filter>
      </defs>
      <rect width={1080} height={1920} fill="#DDE7EC" />
      <LabWall B={B} id={`${id}lw`} wallY={1500} blur={bAt(wallZ) + 5} K={0.3} />
      {/* bench top */}
      <path d={projPoly(B, [[-3000, -1500, -6], [3000, -1500, -6], [3000, 1490, -6], [-3000, 1490, -6]])} fill="#EEF2F3" />
      {/* the dish: far wall (inner face), the floor of sand */}
      <path d={projPoly(B, ring(DISH2.r + 8, -6))} fill="#C9D6DC" opacity={0.6} />
      <path d={projPoly(B, ring(DISH2.r, 0))} fill="#E4DBC8" />
      <g opacity={0.45} filter={`url(#${id}cs)`}>{caustics}</g>
      {grainEls(B, (z) => z > 0)}
      {frags.map((f, i) => fragEls(B, f, t, `fr${i}`))}
      {dim > 0 && <rect width={1080} height={1920} fill="#123E47" opacity={dim} />}
    </g>
  );
};

/** the dish wall and rim (drawn over the floor, behind the animal where it is far) */
export const DishRim: React.FC<{B: Basis}> = ({B}) => {
  const n = 160;
  const pts = (r: number, z: number) => Array.from({length: n + 1}, (_, i) => proj(B, [DISH2.c[0] + Math.cos((i / n) * Math.PI * 2) * r, DISH2.c[1] + Math.sin((i / n) * Math.PI * 2) * r, z]));
  const top = pts(DISH2.r, DISH2.wall), bot = pts(DISH2.r, 0);
  const d = (a: {x: number; y: number}[]) => `M${a.map(P2).join(' L')}`;
  return (
    <g>
      <path d={d(bot)} fill="none" stroke="#B7C7CE" strokeWidth={4} opacity={0.7} />
      <path d={d(top)} fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.85} />
      <path d={d(top)} fill="none" stroke="#9FB3BC" strokeWidth={2} opacity={0.6} />
    </g>
  );
};

/** foreground grains very close to the lens (out of focus, parallax) */
/** large grains right by the lens, drawn very soft (they slide past fast as the camera moves: parallax) */
export const LensGrit: React.FC<{B: Basis; id: string; bits: {c: V3; r: number; col: string; op?: number}[]}> = ({B, id, bits}) => (
  <g>
    <defs>
      <filter id={`${id}lg`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={16} />
      </filter>
    </defs>
    <g filter={`url(#${id}lg)`}>
      {bits.map((b, i) => {
        const P = proj(B, [b.c[0], b.c[1], b.c[2] + b.r * 0.6]);
        if (P.z < 3) return null;
        const r = b.r * P.s;
        return (
          <g key={i} opacity={(b.op ?? 1) * 0.7}>
            <ellipse cx={P.x} cy={P.y} rx={r * 1.15} ry={r} fill={b.col} />
            <ellipse cx={P.x - r * 0.2} cy={P.y - r * 0.25} rx={r * 0.6} ry={r * 0.45} fill={lit(b.col, 0.6)} />
          </g>
        );
      })}
    </g>
  </g>
);

export const ForeGrit: React.FC<{B: Basis; id: string; near: number}> = ({B, id, near}) => (
  <g>
    <defs>
      <filter id={`${id}fg`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation={10} />
      </filter>
    </defs>
    <g filter={`url(#${id}fg)`} opacity={0.9}>{grainEls(B, (z) => z < near)}</g>
  </g>
);
