// HOOK 02 environment: a flooded concrete test tunnel. Everything is placed in world millimetres and drawn through the
// perspective camera (cam.ts) so it parallaxes against the insect: the hazy far wall, the walkway ramp with its panel
// joints, silt, gravel and rubble, the step down to the deeper tank bottom, animated caustics, light shafts from the
// surface, suspended particles, a few bubble streams from cracks, and the fallen slab the insect walks beneath.
import React from 'react';
import {V2, V3} from './rig/v3';
import {INK} from '../shared/ink';
import {lit, shade, mix} from '../shared/color';
import {Cam, Q, kAt, depth} from './cam';
import {f2, hull, smoothClosed} from './rig/ortho';
import {clamp, hash, noise1} from '../shared/lib';
import {ground, EDGE_Z, BOTTOM_Y, WALL_Z, SLAB} from './world';

export const EC = {
  waterTop: '#5FA2A6',
  waterMid: '#2F6A73',
  waterDeep: '#163845',
  wall: '#4E7B7C',
  floor: '#7D9C93',
  floorFar: '#557E7A',
  face: '#3F6466',
  bottom: '#24484F',
  rubble: '#8A9A90',
  slab: '#8C9C95',
  silt: '#9DB3A3',
  caustic: '#D6FFF4',
  particle: '#D9F2EC',
};

const fogK = (c: Cam, p: V3) => clamp(-depth(c, p) / 400) * 0.85;
const fogC = (c: Cam, p: V3, col: string, deep: number) => mix(col, mix(EC.waterMid, EC.waterDeep, deep * 0.6), fogK(c, p));
const ok = (c: Cam, p: V3) => kAt(c, p) < 3.2;
const pd = (pts: V2[]) => (pts.length ? `M${pts.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')} Z` : '');
const onScreen = (pts: V2[], m = 200) => pts.some((p) => p[0] > -m && p[0] < 1080 + m && p[1] > -m && p[1] < 1920 + m);

/** the near edge of anything on the walkway, pulled in where it would pass the camera's near plane */
const nearZ = (c: Cam, x: number, y: number, zMax: number) => {
  const F = c.v.F;
  if (Math.abs(F[2]) < 1e-3) return zMax;
  const lim = c.D0 * 0.7 + (c.T[0] * F[0] + c.T[1] * F[1] + c.T[2] * F[2]);
  const z = (lim - x * F[0] - y * F[1]) / F[2];
  return Math.min(zMax, z);
};

export const WaterBG: React.FC<{c: Cam; t: number; deep: number}> = ({c, t, deep}) => {
  const top = mix(EC.waterTop, EC.waterMid, deep * 0.5), mid = mix(EC.waterMid, EC.waterDeep, deep * 0.35), bot = mix(EC.waterDeep, '#0E2730', deep * 0.5);
  // light shafts from the surface: anchored to the world with weak parallax, swaying slowly
  const shafts = Array.from({length: 6}, (_, i) => {
    const xw = -160 + i * 120 + 30 * hash(i * 3.3);
    const x = 540 + (xw - c.T[0]) * c.s * 0.16 + 40 * Math.sin(t * 0.6 + i * 1.7);
    const w0 = 40 + 50 * hash(i * 5.1), w1 = w0 * 3.2;
    const sk = 260;
    return {d: `M${f2(x - w0)},-60 L${f2(x + w0)},-60 L${f2(x + w1 + sk)},1500 L${f2(x - w1 + sk)},1500 Z`, a: (0.07 + 0.06 * hash(i * 9.9)) * (1 - 0.5 * deep) * (0.75 + 0.25 * Math.sin(t * 1.3 + i))};
  });
  return (
    <g>
      <defs>
        <linearGradient id="h02-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="0.5" stopColor={mid} />
          <stop offset="1" stopColor={bot} />
        </linearGradient>
        <linearGradient id="h02-shaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8FFFA" stopOpacity={1} />
          <stop offset="0.75" stopColor="#E8FFFA" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#h02-bg)" />
      {shafts.map((q, i) => (
        <path key={i} d={q.d} fill="url(#h02-shaft)" opacity={f2(q.a)} />
      ))}
    </g>
  );
};

/** the far wall, the walkway top and its near face, the deeper bottom beyond, and floor detail + caustics */
export const Floor: React.FC<{c: Cam; t: number; deep: number}> = ({c, t, deep}) => {
  const xs: number[] = [];
  const x0 = c.T[0] - 520, x1 = c.T[0] + 620;
  for (let i = 0; i <= 48; i++) xs.push(x0 + ((x1 - x0) * i) / 48);
  // far wall: concrete panels, very hazy
  const wallTop = 420;
  const wallPts: V2[] = [...xs.map((x) => Q(c, [x, ground(x), WALL_Z])), ...xs.slice().reverse().map((x) => Q(c, [x, wallTop, WALL_Z]))];
  const wallCol = fogC(c, [c.T[0], 0, WALL_Z], EC.wall, deep);
  const wallSeams: string[] = [];
  for (let y = 40; y < wallTop; y += 70) wallSeams.push(`M${xs.map((x) => Q(c, [x, ground(x) + y, WALL_Z])).map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')}`);
  for (let xx = Math.ceil(x0 / 140) * 140; xx < x1; xx += 140) {
    const a = Q(c, [xx, ground(xx), WALL_Z]), b = Q(c, [xx, wallTop, WALL_Z]);
    wallSeams.push(`M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`);
  }
  // a pipe run along the wall
  const pipeY = 120;
  const pipeTop = xs.map((x) => Q(c, [x, ground(x) * 0.3 + pipeY + 22, WALL_Z + 30]));
  const pipeBot = xs.map((x) => Q(c, [x, ground(x) * 0.3 + pipeY - 22, WALL_Z + 30]));
  const pipeCol = fogC(c, [c.T[0], 0, WALL_Z + 30], '#6E8F8A', deep);
  // walkway top
  const topFar = xs.map((x) => Q(c, [x, ground(x), WALL_Z]));
  const topNear = xs.map((x) => Q(c, [x, ground(x), nearZ(c, x, ground(x), EDGE_Z)]));
  const faceBot = xs.map((x) => Q(c, [x, BOTTOM_Y, nearZ(c, x, BOTTOM_Y, EDGE_Z)]));
  const bottomNear = xs.map((x) => Q(c, [x, BOTTOM_Y, nearZ(c, x, BOTTOM_Y, 900)]));
  const gFar = Q(c, [c.T[0], ground(c.T[0]), WALL_Z]), gNear = Q(c, [c.T[0], ground(c.T[0]), nearZ(c, c.T[0], 0, EDGE_Z)]);
  // panel joints across and along the walkway
  const joints: string[] = [];
  for (const z of [-250, -175, -100, -28, 46]) {
    const pts = xs.map((x) => Q(c, [x, ground(x), Math.min(z, nearZ(c, x, ground(x), EDGE_Z))]));
    if (z < nearZ(c, c.T[0], 0, EDGE_Z)) joints.push(`M${pts.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')}`);
  }
  for (let xx = Math.ceil(x0 / 160) * 160 + 70; xx < x1; xx += 160) {
    const zn = nearZ(c, xx, ground(xx), EDGE_Z);
    const a = Q(c, [xx, ground(xx), WALL_Z]), b = Q(c, [xx, ground(xx), zn]);
    joints.push(`M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`);
  }
  // silt patches and gravel (world-fixed)
  const gravel: React.ReactNode[] = [];
  for (let i = 0; i < 260; i++) {
    const x = -300 + 900 * hash(i * 1.31 + 0.2), z = WALL_Z + 20 + (EDGE_Z - WALL_Z - 26) * hash(i * 2.77 + 0.9);
    if (x < x0 || x > x1) continue;
    const p: V3 = [x, ground(x), z];
    if (!ok(c, p)) continue;
    const q = Q(c, p), k = kAt(c, p);
    if (q[0] < -40 || q[0] > 1120 || q[1] < -40 || q[1] > 1960) continue;
    const r = (0.35 + 1.1 * hash(i * 7.3) ** 2) * c.s * k;
    const col = fogC(c, p, i % 3 ? shade(EC.floor, 0.35) : lit(EC.silt, 0.15), deep);
    gravel.push(<ellipse key={i} cx={f2(q[0])} cy={f2(q[1])} rx={f2(r)} ry={f2(r * (0.35 + 0.2 * Math.abs(c.v.F[1])))} fill={col} opacity={0.8} />);
  }
  const silt = Array.from({length: 14}, (_, i) => {
    const x = -250 + 800 * hash(i * 4.1), z = -280 + 330 * hash(i * 8.3);
    const r = 22 + 30 * hash(i * 2.2);
    const pts = Array.from({length: 14}, (_, j) => {
      const th = (j / 14) * Math.PI * 2;
      const rr = r * (1 + 0.25 * noise1(j * 0.9 + i, 2));
      const xx = x + Math.cos(th) * rr;
      return Q(c, [xx, ground(xx), Math.min(z + Math.sin(th) * rr * 0.7, EDGE_Z - 4)]);
    });
    return <path key={i} d={smoothClosed(pts)} fill={fogC(c, [x, 0, z], EC.silt, deep)} opacity={0.32} />;
  });
  // caustics: a jittered cell net on the walkway top, flickering slowly; three depth bands
  const cs = 17;
  const cx0 = Math.floor((c.T[0] - 190) / cs), cx1 = Math.ceil((c.T[0] + 230) / cs);
  const bands: string[][] = [[], [], []];
  const vtx = (i: number, j: number): V3 => {
    const x = i * cs + (j % 2) * cs * 0.5 + cs * 0.42 * noise1(t * 0.9 + i * 1.7 + j * 2.3, 1), z = j * cs + cs * 0.42 * noise1(t * 0.8 + j * 1.9 + i * 2.1, 2);
    return [x, ground(x) + 0.2, z];
  };
  for (let i = cx0; i <= cx1; i++)
    for (let j = Math.floor(-230 / cs); j <= Math.floor((EDGE_Z - 4) / cs); j++) {
      const p = vtx(i, j);
      if (!ok(c, p)) continue;
      const b = j * cs < -150 ? 0 : j * cs < -40 ? 1 : 2;
      const a = Q(c, p);
      for (const [di, dj] of [[1, 0], [0, 1]]) {
        const q2 = vtx(i + di, j + dj);
        if (q2[2] > EDGE_Z - 2 || !ok(c, q2)) continue;
        const bq = Q(c, q2);
        const m = Q(c, [(p[0] + q2[0]) / 2 + 5 * noise1(t * 1.2 + i * 1.3 + j, 5), (p[1] + q2[1]) / 2, (p[2] + q2[2]) / 2 + 5 * noise1(t * 1.1 + i - j * 1.7, 6)]);
        if (!onScreen([a, bq], 40)) continue;
        bands[b].push(`M${f2(a[0])},${f2(a[1])} Q${f2(m[0])},${f2(m[1])} ${f2(bq[0])},${f2(bq[1])}`);
      }
    }
  const kMid = (z: number) => kAt(c, [c.T[0], ground(c.T[0]), z]);
  const floorGrad = (
    <linearGradient id="h02-fl" gradientUnits="userSpaceOnUse" x1={f2(gFar[0])} y1={f2(gFar[1])} x2={f2(gNear[0])} y2={f2(gNear[1])}>
      <stop offset="0" stopColor={fogC(c, [c.T[0], 0, WALL_Z], EC.floorFar, deep)} />
      <stop offset="0.55" stopColor={mix(EC.floor, EC.waterMid, 0.18 + 0.2 * deep)} />
      <stop offset="1" stopColor={lit(mix(EC.floor, EC.waterMid, 0.1 + 0.2 * deep), 0.06)} />
    </linearGradient>
  );
  return (
    <g>
      <defs>{floorGrad}</defs>
      <path d={pd(wallPts)} fill={wallCol} />
      <path d={wallSeams.join(' ')} stroke={shade(wallCol, 0.25)} strokeWidth={f2(Math.max(1, 0.5 * c.s * kMid(WALL_Z)))} fill="none" opacity={0.6} />
      <path d={pd([...pipeTop, ...pipeBot.slice().reverse()])} fill={pipeCol} />
      <path d={`M${pipeTop.map((p) => `${f2(p[0])},${f2(p[1] + 4)}`).join(' L')}`} stroke={lit(pipeCol, 0.25)} strokeWidth={f2(Math.max(2, 3 * c.s * kMid(WALL_Z)))} fill="none" opacity={0.7} />
      {/* deeper tank bottom beyond the walkway's near edge */}
      <path d={pd([...faceBot, ...bottomNear.slice().reverse()])} fill={mix(EC.bottom, EC.waterDeep, 0.3)} />
      {/* walkway near face */}
      <path d={pd([...topNear, ...faceBot.slice().reverse()])} fill={mix(EC.face, EC.waterDeep, 0.15 + 0.2 * deep)} />
      <path d={pd([...topFar, ...topNear.slice().reverse()])} fill="url(#h02-fl)" />
      {silt}
      <path d={joints.join(' ')} stroke={shade(EC.floor, 0.45)} strokeWidth={f2(Math.max(1.2, 0.55 * c.s))} fill="none" opacity={0.45} />
      {gravel}
      {bands.map((b, i) => (
        <path key={i} d={b.join(' ')} stroke={EC.caustic} strokeWidth={f2(Math.max(1, (0.42 + 0.18 * i) * c.s * kMid([-200, -90, 20][i])))} fill="none" strokeLinecap="round" opacity={[0.08, 0.12, 0.17][i] * (1 - 0.35 * deep)} />
      ))}
      {/* the walkway's lit lip */}
      <path d={`M${topNear.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')}`} stroke={lit(EC.floor, 0.25)} strokeWidth={f2(Math.max(1.5, 0.8 * c.s))} fill="none" opacity={0.6} />
    </g>
  );
};

type Chunk = {x: number; z: number; r: number; h: number; seed: number; y?: number};
export const RUBBLE: Chunk[] = [
  {x: 70, z: -215, r: 26, h: 18, seed: 1},
  {x: 165, z: -165, r: 17, h: 11, seed: 2},
  {x: 290, z: -250, r: 32, h: 22, seed: 3},
  {x: -70, z: -185, r: 20, h: 13, seed: 4},
  {x: 360, z: -135, r: 16, h: 10, seed: 5},
  {x: 118, z: -64, r: 9, h: 6, seed: 6},
  {x: 22, z: -88, r: 8, h: 5, seed: 7},
  {x: 300, z: -60, r: 11, h: 7, seed: 8},
  {x: -40, z: -48, r: 6, h: 4, seed: 9},
  {x: 84, z: 60, r: 8, h: 5.5, seed: 10},
  {x: 158, z: 64, r: 10, h: 7, seed: 11},
  {x: 10, z: 58, r: 7, h: 5, seed: 12},
  {x: 262, z: 60, r: 9, h: 6, seed: 13},
];

const chunkEl = (c: Cam, ch: Chunk, deep: number, key: string) => {
  const g = ch.y ?? ground(ch.x);
  const n = 7;
  const top: V3[] = [], bot: V3[] = [];
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2 + ch.seed;
    const r = ch.r * (0.7 + 0.45 * hash(ch.seed * 13.1 + i));
    const ht = ch.h * (0.75 + 0.4 * hash(ch.seed * 7.7 + i));
    top.push([ch.x + Math.cos(th) * r * 0.82, g + ht, ch.z + Math.sin(th) * r * 0.7]);
    bot.push([ch.x + Math.cos(th) * r, g, ch.z + Math.sin(th) * r * 0.85]);
  }
  if (![...top, ...bot].every((p) => ok(c, p))) return null;
  const tp = top.map((p) => Q(c, p)), bp = bot.map((p) => Q(c, p));
  if (!onScreen([...tp, ...bp], 60)) return null;
  const all = hull([...tp, ...bp]);
  const col = fogC(c, [ch.x, g, ch.z], EC.rubble, deep);
  const k = kAt(c, [ch.x, g, ch.z]);
  const iw = Math.max(0.8, 0.22 * c.s * k) * (1 - fogK(c, [ch.x, g, ch.z]));
  const ys = all.map((p) => p[1]);
  return (
    <g key={key}>
      <defs>
        <linearGradient id={`h02-ch${key}`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(Math.min(...ys))} x2="0" y2={f2(Math.max(...ys))}>
          <stop offset="0" stopColor={lit(col, 0.12)} />
          <stop offset="1" stopColor={shade(col, 0.45)} />
        </linearGradient>
      </defs>
      <ellipse cx={f2((Math.min(...all.map((p) => p[0])) + Math.max(...all.map((p) => p[0]))) / 2 + 0.2 * ch.r * c.s * k)} cy={f2(Math.max(...ys))} rx={f2(ch.r * c.s * k * 1.15)} ry={f2(ch.r * c.s * k * 0.28)} fill="#0E2328" opacity={0.18} />
      <path d={pd(all)} fill={`url(#h02-ch${key})`} stroke={INK} strokeWidth={f2(iw)} strokeLinejoin="round" strokeOpacity={0.6} />
      <path d={pd(hull(tp))} fill={lit(col, 0.18)} opacity={0.85} />
      <path d={`M${f2(tp[1][0])},${f2(tp[1][1])} L${f2(tp[3][0])},${f2(tp[3][1])}`} stroke={shade(col, 0.4)} strokeWidth={f2(iw * 0.8)} opacity={0.5} />
    </g>
  );
};

export const Rubble: React.FC<{c: Cam; deep: number; layer: 'back' | 'front'}> = ({c, deep, layer}) => {
  const list = RUBBLE.filter((q) => (layer === 'front' ? q.z > 30 : q.z <= 30)).sort((a, b) => a.z - b.z);
  if (layer === 'back') return <g>{list.map((q, i) => chunkEl(c, q, deep, `${layer}${i}`))}</g>;
  // near chunks: out of focus once they loom large in a close-up
  return (
    <g>
      {list.map((q, i) => {
        const k = kAt(c, [q.x, ground(q.x), q.z]);
        const b = clamp((k - 1.25) / 0.8) * Math.min(14, 0.5 * c.s);
        const el = chunkEl(c, q, deep, `${layer}${i}`);
        if (!el) return null;
        if (b < 0.6) return el;
        return (
          <g key={i} filter={`url(#h02-rb${i})`} opacity={f2(1 - 0.35 * clamp((k - 1.25) / 0.8))}>
            <defs>
              <filter id={`h02-rb${i}`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation={f2(b)} />
              </filter>
            </defs>
            {el}
          </g>
        );
      })}
    </g>
  );
};

/** the fallen slab and its supports. part: 'farSupport' (behind the insect), 'shadow', 'slab' (over it) */
export const Slab: React.FC<{c: Cam; deep: number; part: 'farSupport' | 'shadow' | 'slab'}> = ({c, deep, part}) => {
  const S = SLAB;
  const g = ground(S.xc);
  const box = (xa: number, xb: number, ya: number, yb: number, za: number, zb: number, col: string, key: string, chip = 0) => {
    const corners: V3[] = [];
    for (const x of [xa, xb]) for (const y of [ya, yb]) for (const z of [za, zb]) corners.push([x, y, z]);
    // clip the near end to the camera's near plane
    const cc = corners.map((p) => (ok(c, p) ? p : ([p[0], p[1], Math.min(p[2], nearZ(c, p[0], p[1], p[2]))] as V3)));
    const q = cc.map((p) => Q(c, p));
    if (!onScreen(q, 100)) return null;
    // perspective visibility: a face shows when the camera's eye is on its outer side
    const eye: V3 = [c.T[0] + c.v.F[0] * c.D0, c.T[1] + c.v.F[1] * c.D0, c.T[2] + c.v.F[2] * c.D0];
    const face = (idx: number[], n: V3, shadeK: number, fk: string) => {
      const m = idx.map((i) => cc[i]).reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4, a[2] + p[2] / 4] as V3, [0, 0, 0] as V3);
      const f = (eye[0] - m[0]) * n[0] + (eye[1] - m[1]) * n[1] + (eye[2] - m[2]) * n[2];
      if (f <= 0) return null;
      const pts = idx.map((i) => q[i]);
      return <path key={fk} d={pd(pts)} fill={shadeK >= 0 ? shade(col, shadeK) : lit(col, -shadeK)} />;
    };
    // index: x(0/1)*4 + y(0/1)*2 + z(0/1)
    const iw = Math.max(1, 0.3 * c.s * kAt(c, [S.xc, g + S.y1, 0]));
    return (
      <g key={key}>
        <path d={pd(hull(q))} fill={col} stroke={INK} strokeWidth={f2(iw * 2)} strokeLinejoin="round" strokeOpacity={0.75} />
        {face([2, 3, 7, 6], [0, 1, 0], -0.14, 'top')}
        {face([4, 5, 7, 6], [1, 0, 0], 0.12, 'fr')}
        {face([0, 1, 3, 2], [-1, 0, 0], 0.3, 'bk')}
        {face([1, 3, 7, 5], [0, 0, 1], 0.36, 'ne')}
        {face([0, 2, 6, 4], [0, 0, -1], 0.35, 'fe')}
        {face([0, 1, 5, 4], [0, -1, 0], 0.5, 'bt')}
        {chip > 0 && <path d={pd(hull(q))} fill="none" stroke={INK} strokeWidth={f2(iw)} strokeOpacity={0.5} />}
      </g>
    );
  };
  const slabCol = fogC(c, [S.xc, g + S.y1, 0], mix(EC.slab, EC.waterMid, 0.25), deep);
  const supCol = fogC(c, [S.xc, g, S.z0], shade(EC.rubble, 0.1), deep);
  if (part === 'farSupport')
    return (
      <g>
        {box(S.xc - 30, S.xc + 26, g, g + S.y0 * 0.55, S.z0 - 5, S.z0 + 72, supCol, 'fs0')}
        {box(S.xc - 24, S.xc + 20, g + S.y0 * 0.55, g + S.y0, S.z0 + 4, S.z0 + 60, lit(supCol, 0.05), 'fs1')}
      </g>
    );
  if (part === 'shadow') {
    const pts: V3[] = [];
    for (const x of [S.xc - S.hx - 3, S.xc + S.hx + 3])
      for (const zz of [-115, 110]) {
        pts.push([x, g + S.y0, zz > 0 ? nearZ(c, x, g + S.y0, zz) : zz], [x + 8, g, zz > 0 ? nearZ(c, x + 8, g, zz) : zz]);
      }
    const q = pts.map((p) => Q(c, p));
    if (q.length < 3 || !onScreen(q, 100)) return null;
    const blur = Math.max(4, 2.2 * c.s);
    return (
      <g>
        <defs>
          <filter id="h02-shb" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={f2(blur)} />
          </filter>
        </defs>
        <path d={pd(hull(q))} fill="#06161C" opacity={0.5} filter="url(#h02-shb)" />
      </g>
    );
  }
  // the slab, a rebar stub, the near support
  const rebar: V3[] = [[S.xc + S.hx, g + (S.y0 + S.y1) / 2, -40], [S.xc + S.hx + 9, g + (S.y0 + S.y1) / 2 - 1.5, -44]];
  const rebar2: V3[] = [[S.xc + S.hx, g + S.y0 + 3, 22], [S.xc + S.hx + 6, g + S.y0 + 1, 26]];
  const rb = [rebar, rebar2].filter((r) => r.every((p) => ok(c, p))).map((r) => r.map((p) => Q(c, p)));
  const rw = Math.max(1.5, 1.1 * c.s * kAt(c, [S.xc, g + S.y1, 0]));
  // the slab's front face: aggregate speckles, grime along the lower edge, a crack
  const fx = S.xc + S.hx + 0.2;
  const faceDeco: React.ReactNode[] = [];
  if (c.v.F[0] > 0.05) {
    for (let i = 0; i < 90; i++) {
      const z = S.z0 + 30 + (S.z1 - S.z0 - 34) * hash(i * 1.73 + 0.4), y = g + S.y0 + 1 + (S.y1 - S.y0 - 2) * hash(i * 3.17 + 0.8);
      const p: V3 = [fx, y, z];
      if (!ok(c, p)) continue;
      const q = Q(c, p), k = kAt(c, p);
      if (q[0] < -20 || q[0] > 1100 || q[1] < -20 || q[1] > 1940) continue;
      const r = (0.25 + 0.55 * hash(i * 5.9)) * c.s * k;
      faceDeco.push(<circle key={`a${i}`} cx={f2(q[0])} cy={f2(q[1])} r={f2(r)} fill={i % 3 ? shade(slabCol, 0.3) : lit(slabCol, 0.25)} opacity={0.6} />);
    }
    const zz = Array.from({length: 24}, (_, i) => S.z0 + 30 + ((S.z1 - S.z0 - 34) * i) / 23);
    const lo = zz.map((z) => [fx, g + S.y0 + 0.2, z] as V3).filter((p) => ok(c, p)).map((p) => Q(c, p));
    const mid = zz.map((z) => [fx, g + S.y0 + 5, z] as V3).filter((p) => ok(c, p)).map((p) => Q(c, p));
    if (lo.length > 2 && mid.length > 2)
      faceDeco.push(<path key="grime" d={pd([...lo, ...mid.slice().reverse()])} fill={shade(slabCol, 0.55)} opacity={0.45} />);
    const crack: V3[] = [[fx, g + S.y1, -20], [fx, g + S.y1 - 5, -14], [fx, g + S.y1 - 8, -17], [fx, g + S.y0 + 6, -8], [fx, g + S.y0 + 2, -11]];
    if (crack.every((p) => ok(c, p))) {
      const cq = crack.map((p) => Q(c, p));
      faceDeco.push(<path key="crack" d={`M${cq.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')}`} stroke={INK} strokeWidth={f2(Math.max(1, 0.3 * c.s))} fill="none" opacity={0.55} strokeLinejoin="round" />);
    }
  }
  return (
    <g>
      {box(S.xc - S.hx, S.xc + S.hx, g + S.y0, g + S.y1, S.z0, S.z1, slabCol, 'sl', 1)}
      {faceDeco}
      {rb.map((r, i) => (
        <g key={i}>
          <path d={`M${f2(r[0][0])},${f2(r[0][1])} L${f2(r[1][0])},${f2(r[1][1])}`} stroke={INK} strokeWidth={f2(rw + 2)} strokeLinecap="round" />
          <path d={`M${f2(r[0][0])},${f2(r[0][1])} L${f2(r[1][0])},${f2(r[1][1])}`} stroke="#8A5A40" strokeWidth={f2(rw)} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};

/** suspended particles (marine snow) and bubble streams. layer: behind or in front of the insect (by depth) */
export const Particles: React.FC<{c: Cam; t: number; layer: 'back' | 'front'}> = ({c, t, layer}) => {
  const out: React.ReactNode[] = [];
  const blurred: React.ReactNode[] = [];
  for (let i = 0; i < 300; i++) {
    const p: V3 = [
      -250 + 850 * hash(i * 1.17 + 3) + 6 * noise1(t * 0.35 + i, 1) + 3 * t,
      -40 + 260 * hash(i * 2.91 + 5) - 2.5 * t + 3 * noise1(t * 0.4 + i * 0.3, 2),
      -300 + 440 * hash(i * 4.43 + 7),
    ];
    const dz = depth(c, p);
    if ((layer === 'front') !== dz > 0) continue;
    const k = kAt(c, p);
    if (!isFinite(k) || k > 6) continue;
    const q = Q(c, p);
    if (q[0] < -60 || q[0] > 1140 || q[1] < -60 || q[1] > 1980) continue;
    const r = (0.22 + 0.4 * hash(i * 9.1)) * c.s * k;
    const a = (0.35 + 0.4 * hash(i * 3.3)) * (1 - clamp(-dz / 600) * 0.6);
    const el = <circle key={i} cx={f2(q[0])} cy={f2(q[1])} r={f2(Math.min(r, 26))} fill={EC.particle} opacity={f2(a * (k > 1.6 ? 0.45 : 1))} />;
    (k > 1.6 ? blurred : out).push(el);
  }
  // bubble streams from cracks in the floor (world-fixed)
  const bub: React.ReactNode[] = [];
  const sources: V3[] = layer === 'back' ? [[128, ground(128), -95], [312, ground(312), -150], [-20, ground(-20), -60]] : [[262, ground(262), 40]];
  sources.forEach((src, si) => {
    for (let j = 0; j < 9; j++) {
      const ph = t * (1.4 + 0.3 * si) / 1.0 + j / 9 + si * 0.37;
      const age = ph - Math.floor(ph);
      const life = 2.6;
      const y = src[1] + age * life * 46;
      const p: V3 = [src[0] + 2.4 * Math.sin(age * 14 + j) + age * 8, y, src[2] + 1.5 * Math.cos(age * 11 + j)];
      // bubbles stop at the slab's underside
      if (Math.abs(p[0] - SLAB.xc) < SLAB.hx + 2 && y > ground(SLAB.xc) + SLAB.y0 - 1 && p[2] > SLAB.z0 && p[2] < SLAB.z1) continue;
      if (!ok(c, p)) continue;
      const k = kAt(c, p), q = Q(c, p);
      const r = (0.6 + 0.9 * hash(j * 5.5 + si)) * (1 + age * 0.4) * c.s * k;
      if (q[0] < -40 || q[0] > 1120 || q[1] < -40 || q[1] > 1960) continue;
      const a = clamp(age / 0.08) * clamp((1 - age) / 0.15) * (0.6 - 0.35 * fogK(c, p));
      bub.push(
        <g key={`${si}-${j}`} opacity={f2(a)}>
          <circle cx={f2(q[0])} cy={f2(q[1])} r={f2(r)} fill="#CFF6F2" fillOpacity={0.18} stroke="#E6FFFB" strokeWidth={f2(Math.max(0.8, r * 0.18))} />
          <circle cx={f2(q[0] - r * 0.35)} cy={f2(q[1] - r * 0.35)} r={f2(r * 0.28)} fill="#FFFFFF" />
        </g>,
      );
    }
  });
  return (
    <g>
      {layer === 'front' && (
        <defs>
          <filter id="h02-pb" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
      )}
      {out}
      {blurred.length > 0 && <g filter={layer === 'front' ? 'url(#h02-pb)' : undefined}>{blurred}</g>}
      {bub}
    </g>
  );
};
