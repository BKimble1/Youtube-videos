// The future rubble: the sheltered space where the trapped person lies (S13-S15), and the primitives the rubble route
// (S12) shares: chipped concrete chunks with aggregate speckle, bent rebar, a dusty floor, a daylight shaft with drifting
// dust. World units are mm, the floor is y = 0. Original vector environments (no generated plates: Runway's output host
// is blocked in this environment; see production/ASSET_LOG.md).
import React from 'react';
import {Cam, proj, depth, scaleAt} from '../lib/cam';
import {V3, V2, add, sub, mul, norm, dot, cross, rotAxis, lerp3} from '../lib/v3';
import {projPoly, projSeg, polyPath, openPath, fmt, centroid} from '../lib/g3';
import {INK} from '../lib/ink';
import {lit, shade, mix} from '../lib/color';
import {lightW} from '../rig/Gear';
import {rnd, noise1, clamp} from '../lib/ease';
import {Item} from '../lib/scene';

export const ALC = {
  concrete: '#9C9590',
  concreteDeep: '#7E7772',
  concreteLight: '#B8B0A6',
  crevice: '#3A3633',
  rebar: '#8A4B2E',
  dust: '#C9BFAF',
  floor: '#A59C92',
  floorDeep: '#8C847B',
  day: '#FFE8B8',
  dark: '#2A2623',
};

/** where things are in the alcove (see production/SHOT_SPECS.md): she lies prone along x, head toward +x */
export const ALCOVE = {
  anchor: [0, 0, 0] as V3, // midway between her elbows
  hand: [215, 0, 40] as V3, // her near palm
  tips: [255, 0, 40] as V3, // her near fingertips
  gap: [335, 0, 360] as V3, // the gap the insect comes through, in front of her and toward the S13 camera
  sun: norm([-0.45, -1, -0.25]) as V3, // daylight direction (falling from above-right and behind)
};

export type ChunkDef = {c: V3; h: V3; yaw?: number; tilt?: number; roll?: number; seed: number; color?: string; chip?: number};

/** an irregular concrete block: a box whose corners are pulled in or out a little and chamfered (chipped) */
const chunkCorners = (d: ChunkDef): V3[] => {
  const ax: V3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((a) => {
    let v = a as V3;
    v = rotAxis(v, [0, 0, 1], d.tilt ?? 0);
    v = rotAxis(v, [1, 0, 0], d.roll ?? 0);
    v = rotAxis(v, [0, 1, 0], d.yaw ?? 0);
    return v;
  });
  const out: V3[] = [];
  let k = 0;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const j = (i: number) => 1 + (d.chip ?? 0.18) * (rnd(d.seed * 31 + k * 7 + i, 3) - 0.5) * 2;
    const p = add(add(add(d.c, mul(ax[0], sx * d.h[0] * j(0))), mul(ax[1], sy * d.h[1] * j(1))), mul(ax[2], sz * d.h[2] * j(2)));
    out.push(p);
    k++;
  }
  return out;
};
// faces as corner indices (corner index = (sx>0)*4 + (sy>0)*2 + (sz>0))
const FACES = [
  [4, 6, 7, 5], [0, 1, 3, 2], [2, 3, 7, 6], [0, 4, 5, 1], [1, 5, 7, 3], [0, 2, 6, 4],
];

/** concrete chunk: lit faces, ink edges, aggregate speckle, a crack or two; returns a depth-sortable item */
export const chunk = (id: string, cam: Cam, d: ChunkDef, opts: {sun?: number; haze?: number; ink?: number} = {}): Item => {
  const P = chunkCorners(d);
  const c = d.c;
  const col = d.color ?? ALC.concrete;
  const L = lightW(cam);
  const sun = opts.sun ?? 0;
  const hz = opts.haze ?? 0;
  const inkW = opts.ink ?? Math.max(1.2, Math.min(3.6, scaleAt(cam, c) * 0.9));
  const faces = FACES.map((f) => f.map((i) => P[i]))
    .map((pts) => {
      const n = norm(cross(sub(pts[1], pts[0]), sub(pts[3], pts[0])));
      const ctr = mul(add(add(pts[0], pts[1]), add(pts[2], pts[3])), 0.25);
      const out = dot(n, sub(ctr, c)) < 0 ? mul(n, -1) : n;
      return {pts, n: out, ctr};
    })
    .filter((fc) => dot(fc.n, sub(cam.eye, fc.ctr)) > 0);
  const el = (
    <g key={id}>
      {faces.map((fc, i) => {
        const q = projPoly(cam, fc.pts);
        if (!q) return null;
        const t = dot(fc.n, L) + sun * Math.max(0, -dot(fc.n, ALCOVE.sun)) * 1.2;
        const base = t >= 0 ? lit(col, 0.28 * t) : shade(col, -0.45 * t);
        const fill = hz ? mix(base, ALC.dark, hz) : base;
        const cc = centroid(q);
        const span = Math.max(...q.map((p) => Math.hypot(p[0] - cc[0], p[1] - cc[1])));
        const specks: React.ReactNode[] = [];
        const nS = Math.min(60, Math.floor(span / 9));
        for (let k = 0; k < nS; k++) {
          const a = rnd(d.seed * 97 + i * 13 + k, 5) * Math.PI * 2, r = Math.sqrt(rnd(d.seed * 53 + i * 17 + k, 6)) * span * 0.9;
          const big = rnd(d.seed + k * 3 + i, 7) > 0.8;
          specks.push(<circle key={k} cx={fmt(cc[0] + Math.cos(a) * r)} cy={fmt(cc[1] + Math.sin(a) * r)} r={fmt(big ? 2.2 : 1.2)} fill={rnd(k + i * 5, d.seed) > 0.5 ? shade(fill, 0.22) : lit(fill, 0.18)} />);
        }
        return (
          <g key={i}>
            <clipPath id={`${id}-f${i}`}>
              <path d={polyPath(q)} />
            </clipPath>
            <path d={polyPath(q)} fill={fill} />
            <g clipPath={`url(#${id}-f${i})`} opacity={0.55}>
              {specks}
              {rnd(d.seed + i, 9) > 0.55 && (
                <path d={`M${fmt(cc[0] - span * 0.5)} ${fmt(cc[1] - span * 0.2)} l${fmt(span * 0.25)} ${fmt(span * 0.12)} l${fmt(span * 0.15)} ${fmt(-span * 0.05)} l${fmt(span * 0.3)} ${fmt(span * 0.2)}`} stroke={ALC.crevice} strokeWidth={Math.max(1, inkW * 0.5)} fill="none" opacity={0.7} />
              )}
            </g>
            <path d={polyPath(q)} fill="none" stroke={INK} strokeWidth={inkW} strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
  return {z: depth(cam, c), el};
};

/** bent reinforcing bar: a rusty round bar along a 3D polyline */
export const rebar = (id: string, cam: Cam, pts: V3[], r = 3.2): Item => {
  // densify, then keep only the runs in front of a near plane (a bar passing beside the lens would wrap round)
  const dense: V3[] = [];
  for (let i = 0; i + 1 < pts.length; i++) for (let k = 0; k < 12; k++) dense.push(lerp3(pts[i], pts[i + 1], k / 12));
  dense.push(pts[pts.length - 1]);
  const runs: V3[][] = [];
  let cur: V3[] = [];
  for (const p of dense) {
    if (depth(cam, p) >= 60) cur.push(p);
    else if (cur.length) (runs.push(cur), (cur = []));
  }
  if (cur.length) runs.push(cur);
  const mid = pts[Math.floor(pts.length / 2)];
  return {
    z: depth(cam, mid),
    el: (
      <g key={id}>
        {runs.filter((run) => run.length > 1).map((run, j) => {
          const sp = run.map((p) => proj(cam, p));
          const w = r * 2 * scaleAt(cam, run[Math.floor(run.length / 2)]);
          return (
            <g key={j}>
              <path d={openPath(sp)} fill="none" stroke={INK} strokeWidth={w + 2.4} strokeLinecap="round" strokeLinejoin="round" />
              <path d={openPath(sp)} fill="none" stroke={ALC.rebar} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
              <path d={openPath(sp)} fill="none" stroke={lit(ALC.rebar, 0.35)} strokeWidth={w * 0.3} strokeLinecap="round" strokeDasharray={`${fmt(w * 0.6)} ${fmt(w * 0.9)}`} transform={`translate(${fmt(-w * 0.18)} ${fmt(-w * 0.18)})`} />
            </g>
          );
        })}
      </g>
    ),
  };
};

/** the dusty concrete floor: a broad plane, grit and small stones (pure functions of their index), darker toward the
 *  back, a warm pool of daylight where the shaft lands */
export const DustFloor: React.FC<{id: string; cam: Cam; x0?: number; x1?: number; z0?: number; z1?: number; pool?: V3; poolR?: number}> = ({id, cam, x0 = -900, x1 = 1400, z0 = -700, z1 = 700, pool, poolR = 220}) => {
  const q = projPoly(cam, [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]]);
  const grit: React.ReactNode[] = [];
  for (let k = 0; k < 520; k++) {
    const x = x0 + (x1 - x0) * rnd(k, 11), z = z0 + (z1 - z0) * rnd(k, 12);
    const p: V3 = [x, 0, z];
    const d = depth(cam, p);
    if (d < 20) continue;
    const s = scaleAt(cam, p);
    const r = (rnd(k, 13) > 0.92 ? 3.5 : 1.2) * s;
    if (r < 0.5) continue;
    const c = proj(cam, p);
    if (c[0] < -20 || c[0] > 1100 || c[1] < -20 || c[1] > 1940) continue;
    grit.push(<ellipse key={k} cx={fmt(c[0])} cy={fmt(c[1])} rx={fmt(r)} ry={fmt(r * 0.6)} fill={rnd(k, 14) > 0.5 ? ALC.floorDeep : ALC.concreteLight} opacity={0.7} />);
  }
  let poolEl: React.ReactNode = null;
  if (pool) {
    const c = proj(cam, pool), a = proj(cam, add(pool, [poolR, 0, 0])), b = proj(cam, add(pool, [0, 0, poolR]));
    const rx = Math.hypot(a[0] - c[0], a[1] - c[1]), ry = Math.hypot(b[0] - c[0], b[1] - c[1]);
    poolEl = (
      <g>
        <defs>
          <radialGradient id={`${id}-pool`}>
            <stop offset="0" stopColor={ALC.day} stopOpacity={0.55} />
            <stop offset="0.6" stopColor={ALC.day} stopOpacity={0.25} />
            <stop offset="1" stopColor={ALC.day} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={fmt(c[0])} cy={fmt(c[1])} rx={fmt(Math.max(rx, ry))} ry={fmt(Math.min(rx, ry))} fill={`url(#${id}-pool)`} />
      </g>
    );
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-fl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ALC.dark} />
          <stop offset="0.45" stopColor={ALC.floorDeep} />
          <stop offset="1" stopColor={ALC.floor} />
        </linearGradient>
      </defs>
      {q && <path d={polyPath(q)} fill={`url(#${id}-fl)`} />}
      {poolEl}
      {grit}
    </g>
  );
};

/** a soft daylight shaft in screen space: from a source off the top edge down to a target point, widening */
export const LightShaft: React.FC<{id: string; from: V2; to: V2; w0: number; w1: number; alpha?: number}> = ({id, from, to, w0, w1, alpha = 0.32}) => {
  const d: V2 = [to[0] - from[0], to[1] - from[1]];
  const L = Math.hypot(d[0], d[1]) || 1;
  const n: V2 = [-d[1] / L, d[0] / L];
  const pts: V2[] = [
    [from[0] + n[0] * w0, from[1] + n[1] * w0], [to[0] + n[0] * w1, to[1] + n[1] * w1],
    [to[0] - n[0] * w1, to[1] - n[1] * w1], [from[0] - n[0] * w0, from[1] - n[1] * w0],
  ];
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <linearGradient id={`${id}-sh`} gradientUnits="userSpaceOnUse" x1={fmt(from[0])} y1={fmt(from[1])} x2={fmt(to[0])} y2={fmt(to[1])}>
          <stop offset="0" stopColor={ALC.day} stopOpacity={alpha} />
          <stop offset="1" stopColor={ALC.day} stopOpacity={alpha * 0.45} />
        </linearGradient>
        <filter id={`${id}-bl`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(6, w0 * 0.25)} />
        </filter>
      </defs>
      <path d={polyPath(pts)} fill={`url(#${id}-sh)`} filter={`url(#${id}-bl)`} />
    </g>
  );
};

/** dust motes drifting slowly in a world-space box (lit ones bright inside the shaft), pure functions of time */
export const DustMotes: React.FC<{cam: Cam; t: number; box: [V3, V3]; n?: number; seed?: number; inShaft?: (p: V3) => number}> = ({cam, t, box, n = 60, seed = 1, inShaft}) => {
  const [a, b] = box;
  const out: React.ReactNode[] = [];
  for (let k = 0; k < n; k++) {
    const u = rnd(k, seed), v = rnd(k, seed + 1), w = rnd(k, seed + 2);
    const drift = (t * (6 + 6 * rnd(k, seed + 3))) % (b[1] - a[1]);
    const p: V3 = [
      a[0] + (b[0] - a[0]) * u + 12 * noise1(t * 0.3 + k, seed),
      b[1] - (((b[1] - a[1]) * v + drift) % (b[1] - a[1])),
      a[2] + (b[2] - a[2]) * w + 12 * noise1(t * 0.25 + k * 1.7, seed + 9),
    ];
    if (depth(cam, p) < 30) continue;
    const c = proj(cam, p);
    const lit_ = inShaft ? inShaft(p) : 0.5;
    const r = Math.max(0.8, 0.9 * scaleAt(cam, p));
    out.push(<circle key={k} cx={fmt(c[0])} cy={fmt(c[1])} r={fmt(r)} fill={ALC.day} opacity={clamp(0.15 + 0.7 * lit_)} />);
  }
  return <g>{out}</g>;
};

/** a dark recess behind everything (the depth of the collapse), with a faint warm glow toward the light */
export const RubbleBack: React.FC<{id: string; glow?: V2}> = ({id, glow = [900, 200]}) => (
  <g>
    <defs>
      <radialGradient id={`${id}-bk`} gradientUnits="userSpaceOnUse" cx={glow[0]} cy={glow[1]} r={1400}>
        <stop offset="0" stopColor="#5A5048" />
        <stop offset="0.5" stopColor="#3A3430" />
        <stop offset="1" stopColor="#1F1C1A" />
      </radialGradient>
    </defs>
    <rect x={-20} y={-20} width={1120} height={1960} fill={`url(#${id}-bk)`} />
  </g>
);

/** the alcove's fixed rubble around her (world): a slab leaning over her legs, the back wall, a low ceiling, the two
 *  blocks that frame the gap in front of her, and debris; each piece is a depth-sortable item */
export const alcovePieces = (cam: Cam, opts: {sun?: number} = {}): Item[] => {
  const s = opts.sun ?? 0.6;
  const C = (id: string, d: ChunkDef) => chunk(`alc-${id}`, cam, d, {sun: s});
  return [
    // the slab across her hips and legs (left of her ribs)
    C('legslab', {c: [-420, 120, 0], h: [260, 26, 260], tilt: -0.38, yaw: 0.08, seed: 3, color: ALC.concreteDeep}),
    // the back wall: a fallen floor panel standing on edge
    C('back', {c: [100, 230, -420], h: [760, 230, 34], tilt: 0.04, yaw: -0.03, seed: 5}),
    C('back2', {c: [900, 180, -330], h: [260, 180, 40], yaw: 0.5, tilt: 0.1, seed: 6, color: ALC.concreteDeep}),
    // a high slab resting on the back wall, well above her (the space is low but she can raise her head)
    C('ceil', {c: [60, 980, -260], h: [760, 26, 300], roll: 0.22, tilt: 0.05, seed: 7, color: ALC.concreteDeep}),
    // the gap the insect comes through: two blocks either side of its path, set back from her, and rubble beyond
    C('gapL', {c: [335 - 0.97 * 125 + 0.25 * 40, 50, 360 + 0.25 * 125 + 0.97 * 40], h: [70, 50, 85], yaw: 0.25, seed: 8}),
    C('gapR', {c: [335 + 0.97 * 130 + 0.25 * 40, 85, 360 - 0.25 * 130 + 0.97 * 40], h: [80, 85, 90], yaw: 0.3, seed: 9, color: ALC.concreteLight}),
    // debris on the floor
    C('deb1', {c: [420, 14, -150], h: [26, 14, 20], yaw: 0.7, seed: 11, chip: 0.3}),
    C('deb2', {c: [80, 10, 200], h: [18, 10, 15], yaw: 0.3, seed: 12, chip: 0.3}),
    C('deb3', {c: [520, 9, 150], h: [14, 9, 12], yaw: 1.1, seed: 13, chip: 0.3}),
    C('deb4', {c: [300, 8, -60], h: [10, 8, 9], yaw: 0.2, seed: 14, chip: 0.3}),
    rebar('alc-rb1', cam, [[560, 300, -300], [600, 220, -200], [640, 200, -120], [700, 230, -40]]),
    rebar('alc-rb2', cam, [[-200, 470, -260], [-120, 420, -150], [-60, 430, -40]], 3),
  ];
};
