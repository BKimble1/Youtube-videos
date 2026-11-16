// One 3D model (millimetres) of the upper dental arch, the palate and the MouthPad, projected for every view in the
// film: the open mouth (front, from slightly below), the product turn, the side cut-away and the view from below.
// The device is drawn after the sourced description: a clear, custom-fit retainer of dental resin over the upper
// teeth with a palatal plate; a gold flexible-circuit sensor pad on the palate; gold serpentine traces; battery
// modules at the rear molars; about 1 mm thick. It is never a loose chip.
//
// Axes: x lateral (+ = viewer's right in the front view), y up (0 = biting edge of the incisors, palate vault above),
// z anterior (+ = toward the lips). View: yaw about y, then pitch about x (pitch < 0 looks up from below), then roll.
import React from 'react';
import {clamp, lerp, P, smoothPath} from '../lib';

export type View = {yaw: number; pitch: number; roll?: number; persp?: number};
export type V3 = {x: number; y: number; z: number};
export type Proj = {x: number; y: number; d: number};

const D2R = Math.PI / 180;
export const projector = (v: View) => {
  const cy = Math.cos(v.yaw * D2R), sy = Math.sin(v.yaw * D2R);
  const cp = Math.cos(v.pitch * D2R), sp = Math.sin(v.pitch * D2R);
  const cr = Math.cos((v.roll ?? 0) * D2R), sr = Math.sin((v.roll ?? 0) * D2R);
  const F = v.persp ?? 320;
  return (p: V3): Proj => {
    // yaw
    const x1 = p.x * cy + p.z * sy;
    const z1 = -p.x * sy + p.z * cy;
    // pitch
    const y2 = p.y * cp - z1 * sp;
    const z2 = p.y * sp + z1 * cp;
    // roll
    const x3 = x1 * cr - y2 * sr;
    const y3 = x1 * sr + y2 * cr;
    const s = F / (F - z2);
    return {x: x3 * s, y: -y3 * s, d: -z2};
  };
};
/** direction (unit normal) toward the viewer: positive when a surface with normal n faces the camera */
export const facing = (v: View, n: V3) => {
  const cy = Math.cos(v.yaw * D2R), sy = Math.sin(v.yaw * D2R);
  const cp = Math.cos(v.pitch * D2R), sp = Math.sin(v.pitch * D2R);
  const z1 = -n.x * sy + n.z * cy;
  return n.y * sp + z1 * cp;
};

// ---------------------------------------------------------------- geometry (computed once)
const C0 = Math.cos(1.32);
const archAt = (th: number) => ({x: 25.5 * Math.sin(th), z: -21 + 41 * Math.pow(Math.max(0, (Math.cos(th) - C0) / (1 - C0)), 0.82)});
// arc-length table for the half arch
const TABLE: {th: number; s: number}[] = [];
{
  let s = 0, prev = archAt(0);
  for (let i = 0; i <= 400; i++) {
    const th = (1.32 * i) / 400;
    const q = archAt(th);
    s += Math.hypot(q.x - prev.x, q.z - prev.z);
    prev = q;
    TABLE.push({th, s});
  }
}
const thAtS = (s: number) => {
  for (let i = 1; i < TABLE.length; i++) if (TABLE[i].s >= s) return lerp(TABLE[i - 1].th, TABLE[i].th, (s - TABLE[i - 1].s) / (TABLE[i].s - TABLE[i - 1].s || 1));
  return 1.32;
};
const frameAt = (th: number) => {
  const a = archAt(th), b = archAt(th + 0.002);
  const tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1;
  const t = {x: tx / l, z: tz / l};
  const n = {x: t.z, z: -t.x}; // outward (labial) for th >= 0
  return {a, t, n};
};

type Tooth = {side: -1 | 1; i: number; c: {x: number; z: number}; t: {x: number; z: number}; n: {x: number; z: number}; w: number; b: number; h: number; edge: number};
const WID = [8.6, 6.6, 7.6, 7.0, 6.6, 10.0, 9.2];
const THK = [7.0, 6.4, 8.0, 9.0, 9.0, 11.0, 10.4];
const HGT = [10.5, 9.2, 10.4, 8.6, 8.2, 7.6, 7.2];
const EDGE = [0, 0.6, -0.4, 0.9, 1.1, 1.5, 1.8]; // the biting edge rises slightly toward the back (curve of Spee)
export const TEETH: Tooth[] = [];
for (const side of [-1, 1] as const) {
  let s = 0.15;
  for (let i = 0; i < 7; i++) {
    const sc = s + WID[i] / 2;
    s += WID[i] + 0.25;
    const f = frameAt(thAtS(sc));
    TEETH.push({side, i, c: {x: f.a.x * side, z: f.a.z}, t: {x: f.t.x * side, z: f.t.z}, n: {x: f.n.x * side, z: f.n.z}, w: WID[i], b: THK[i], h: HGT[i], edge: EDGE[i]});
  }
}
const GUM_Y = 10.2;
/** inner (lingual) arch line at gum level, from the left rear molar round to the right rear molar */
export const INNER: {x: number; z: number}[] = (() => {
  const out: {x: number; z: number}[] = [];
  const total = TABLE[TABLE.length - 1].s;
  for (let k = -40; k <= 40; k++) {
    const s = (Math.abs(k) / 40) * Math.min(total, 57);
    const f = frameAt(thAtS(s));
    const side = k < 0 ? -1 : 1;
    const ti = Math.min(6, Math.floor((s / 57) * 7));
    const off = THK[ti] / 2 + 0.6;
    out.push({x: (f.a.x - f.n.x * off) * side, z: f.a.z - f.n.z * off});
  }
  return out;
})();
const halfW = (z: number) => {
  // inner half width of the arch at depth z (from INNER, right half)
  let best = 0;
  for (let k = 40; k < INNER.length - 1; k++) {
    const a = INNER[k], b = INNER[k + 1];
    if ((a.z - z) * (b.z - z) <= 0) best = Math.max(best, lerp(a.x, b.x, (z - a.z) / (b.z - a.z || 1)));
  }
  return Math.max(best, 0.5);
};
/** the palate vault: height of the roof of the mouth at (x, z) */
export const vault = (x: number, z: number) => {
  const hw = halfW(clamp(z, -21, 13));
  const u = clamp(Math.abs(x) / hw);
  const along = clamp((14 - z) / 12) * (1 - 0.25 * clamp((-8 - z) / 14)); // rises behind the incisors, levels off
  return GUM_Y + 9.5 * along * Math.pow(1 - u * u, 0.62);
};
export const PAD = {cx: 0, cz: 0.5, w: 14.5, h: 12.5};
export const padPoint = (u: number, v: number, lift = 0.35): V3 => {
  // u, v in -1..1 across the pad (u: right, v: forward)
  const x = PAD.cx + (u * PAD.w) / 2, z = PAD.cz + (v * PAD.h) / 2;
  return {x, y: vault(x, z) - lift, z};
};
const PLATE_BACK = (x: number, hw: number) => -12.5 + 2.2 * (1 - (x / hw) ** 2);
const POD = (side: -1 | 1) => ({a: {x: 15.8 * side, y: 7.6, z: -9.5}, b: {x: 17.2 * side, y: 7.4, z: -20.5}, r: 2.9});

// ---------------------------------------------------------------- helpers
const hull = (ps: P[]): P[] => {
  const p = [...ps].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: P, a: P, b: P) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: P[] = [], up: P[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
const poly = (ps: P[]) => (ps.length ? 'M' + ps.map((q) => `${q.x.toFixed(3)},${q.y.toFixed(3)}`).join('L') + 'Z' : '');
const line = (ps: P[]) => (ps.length ? 'M' + ps.map((q) => `${q.x.toFixed(3)},${q.y.toFixed(3)}`).join('L') : '');
/** a rounded tooth cross-section (superellipse) at height y, scaled */
const toothRing = (T: Tooth, y: number, grow: number, k = 1, N = 14): V3[] => {
  const out: V3[] = [];
  for (let j = 0; j < N; j++) {
    const a = (j / N) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const e = 0.55;
    const u = Math.sign(ca) * Math.pow(Math.abs(ca), e) * (T.w / 2 + grow) * k;
    const v = Math.sign(sa) * Math.pow(Math.abs(sa), e) * (T.b / 2 + grow) * k;
    out.push({x: T.c.x + T.t.x * u + T.n.x * v, y, z: T.c.z + T.t.z * u + T.n.z * v});
  }
  return out;
};

/** a tooth cross-section with separate width (mesiodistal) and thickness (labiolingual) scales */
const toothRingWB = (T: Tooth, y: number, grow: number, kw: number, kb: number, N = 14): V3[] => {
  const out: V3[] = [];
  for (let j = 0; j < N; j++) {
    const a = (j / N) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const e = 0.55;
    const u = Math.sign(ca) * Math.pow(Math.abs(ca), e) * (T.w / 2 + grow) * kw;
    const v = Math.sign(sa) * Math.pow(Math.abs(sa), e) * (T.b / 2 + grow) * kb;
    out.push({x: T.c.x + T.t.x * u + T.n.x * v, y, z: T.c.z + T.t.z * u + T.n.z * v});
  }
  return out;
};

export const DEV = {
  resin: 'rgba(205,236,250,0.42)',
  resinEdge: 'rgba(240,252,255,0.95)',
  gold0: '#FFE08A', gold1: '#E7B33A', gold2: '#B8801C', gold3: '#7A5110',
  pod0: '#E9C15A', pod1: '#A9781E',
  tooth0: '#FFFDF6', tooth1: '#EADFC8', tooth2: '#CDBE9F',
  palate0: '#E9939A', palate1: '#C9646F', rugae: '#B9535F',
  ink: '#162A32',
};

export type JawShow = {teeth?: number; palate?: number; shell?: number; plate?: number; pad?: number; traces?: number; pods?: number};
export type Contact = {u: number; v: number; r?: number; press?: number; glow?: number};

/**
 * The upper arch + MouthPad. Drawn in millimetres around the model origin; the parent scales it. `px` = screen
 * pixels per millimetre (ink widths stay constant on screen). `explode` lifts the pad, traces and pods off the
 * plate toward the tongue (an exploded product view). `contact` puts the tongue's touch on the pad (u, v in -1..1).
 */
export const Jaw: React.FC<{
  view: View; px: number; id: string; show?: JawShow; explode?: number; padGlow?: number; contact?: Contact | null;
  tongueX?: number; // 0..1: draw the tongue as a see-through silhouette under the pad (view from below)
  light?: number;
  near?: number; // opacity of the half nearer the camera (0 = a clean sagittal cut-away: only the far half remains)
}> = ({view, px, id, show = {}, explode = 0, padGlow = 0, contact = null, tongueX = 0, light = 1, near = 1}) => {
  // which lateral side is nearer the camera (sign of x for the near half)
  const nearSign = projector(view)({x: 1, y: 0, z: 0}).d < projector(view)({x: -1, y: 0, z: 0}).d ? 1 : -1;
  const nf = (x: number) => (x * nearSign > 0.01 ? near : 1);
  const S = {teeth: 1, palate: 1, shell: 1, plate: 1, pad: 1, traces: 1, pods: 1, ...show};
  const pr = projector(view);
  const ink = (w: number) => ({stroke: DEV.ink, strokeWidth: w, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const});
  const W1 = clamp(px * 0.32, 1.2, 3.2), W2 = clamp(px * 0.2, 0.8, 2.0);
  const items: {d: number; el: React.ReactNode}[] = [];
  const ex = explode;
  const lift = (p: V3, amt: number): V3 => ({...p, y: p.y - amt * ex});
  const fromBelow = facing(view, {x: 0, y: -1, z: 0}); // >0 when the underside (pad side) faces us

  // ---- palate (soft tissue roof) as one surface
  if (S.palate > 0.01) {
    const ring: V3[] = INNER.map((q) => ({x: q.x, y: GUM_Y, z: q.z}));
    const back: V3[] = [];
    const hwB = halfW(-21);
    for (let k = 10; k >= -10; k--) {
      const x = (k / 10) * hwB;
      back.push({x, y: vault(x, -21.5), z: -21.5});
    }
    const P2 = [...ring, ...back].map(pr);
    // rugae (transverse ridges behind the incisors) and the midline raphe
    const rug: React.ReactNode[] = [];
    for (let r = 0; r < 4; r++) {
      const z0 = 9 - r * 3.2;
      const hw = halfW(z0) * (0.62 - r * 0.06);
      for (const sd of [-1, 1]) {
        const ps: P[] = [];
        for (let k = 0; k <= 8; k++) {
          const x = sd * (1.2 + (k / 8) * hw);
          const z = z0 + Math.sin((k / 8) * Math.PI) * 1.1 - (k / 8) * 1.5;
          ps.push(pr({x, y: vault(x, z) - 0.05, z}));
        }
        rug.push(<path key={`r${r}${sd}`} d={line(ps)} fill="none" stroke={DEV.rugae} strokeWidth={W1 * 1.1} vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity={0.55 * S.palate} />);
      }
    }
    const raphe: P[] = [];
    for (let k = 0; k <= 12; k++) {
      const z = 10 - (k / 12) * 30;
      raphe.push(pr({x: 0, y: vault(0, z) - 0.05, z}));
    }
    const c = pr({x: 0, y: vault(0, -2), z: -2});
    items.push({
      d: c.d + 40, // the roof is always behind what hangs below it
      el: (
        <g key="palate" opacity={S.palate}>
          <defs>
            <radialGradient id={`${id}-pal`} cx="50%" cy="45%" r="70%">
              <stop offset="0" stopColor={DEV.palate0} />
              <stop offset="1" stopColor={DEV.palate1} />
            </radialGradient>
          </defs>
          <path d={poly(P2)} fill={`url(#${id}-pal)`} />
          {rug}
          <path d={line(raphe)} fill="none" stroke={DEV.rugae} strokeWidth={W2} vectorEffect="non-scaling-stroke" opacity={0.45} />
        </g>
      ),
    });
  }

  // ---- the palatal plate (clear resin, about 1 mm thick): a shaded mesh on the palate, composited once (group
  //      opacity) so overlapping facets never stack and its silhouette is right from every angle
  if (S.plate > 0.01) {
    const hwB = halfW(-12);
    const NZ = 16, NX = 14;
    const zf = 13.2;
    const rows: V3[][] = [];
    for (let j = 0; j <= NZ; j++) {
      const row: V3[] = [];
      for (let i = 0; i <= NX; i++) {
        const u = (i / NX) * 2 - 1;
        const zb = PLATE_BACK(u * hwB, hwB);
        const z = lerp(zb, zf, j / NZ);
        const hw = Math.min(halfW(z) + 0.3, hwB + 1) * Math.sqrt(1 - Math.pow(Math.max(0, (z - 9) / (zf - 9 + 0.01)), 2) * 0.5);
        const x = u * hw;
        row.push({x, y: Math.min(vault(x, z), GUM_Y + 0.4) - 1.0, z});
      }
      rows.push(row);
    }
    const quads: {d: number; path: string; shade: number}[] = [];
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
      const q = [rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]];
      const P4 = q.map(pr);
      const e1 = {x: q[1].x - q[0].x, y: q[1].y - q[0].y, z: q[1].z - q[0].z}, e2 = {x: q[3].x - q[0].x, y: q[3].y - q[0].y, z: q[3].z - q[0].z};
      let n = {x: e1.y * e2.z - e1.z * e2.y, y: e1.z * e2.x - e1.x * e2.z, z: e1.x * e2.y - e1.y * e2.x};
      const nl = Math.hypot(n.x, n.y, n.z) || 1;
      n = {x: n.x / nl, y: n.y / nl, z: n.z / nl};
      const f = Math.abs(facing(view, n));
      const cx0 = (q[0].x + q[2].x) / 2;
      if (nf(cx0) > 0.02) quads.push({d: (P4[0].d + P4[2].d) / 2, path: poly(P4), shade: f * nf(cx0) + (1 - nf(cx0)) * 0});
    }
    quads.sort((a1, b1) => b1.d - a1.d);
    const ringE = [...rows.map((r) => r[0]), ...rows[NZ], ...[...rows].reverse().map((r) => r[NX]), ...[...rows[0]].reverse()].map(pr);
    const c = pr({x: 0, y: vault(0, -2) - 1, z: -2});
    items.push({
      d: c.d + 20,
      el: (
        <g key="plate">
          <g opacity={0.5 * S.plate}>
            {quads.map((q, k) => {
              const l = Math.round(205 + 45 * q.shade);
              const col = `rgb(${Math.min(255, l - 12)},${Math.min(255, l + 18)},${Math.min(255, l + 30)})`;
              return <path key={k} d={q.path} fill={col} stroke={col} strokeWidth={0.12} />;
            })}
          </g>
          <path d={poly(hull(ringE))} fill="none" stroke={DEV.resinEdge} strokeWidth={W1 * 1.3} vectorEffect="non-scaling-stroke" strokeLinejoin="round" opacity={0.85 * S.plate * near} />
          <path d={poly(hull(ringE))} fill="none" {...ink(W2)} opacity={0.45 * S.plate * near} />
        </g>
      ),
    });
  }

  // ---- traces (gold serpentine flex circuit) from the pad to the battery pods
  if (S.traces > 0.01) {
    const tr: React.ReactNode[] = [];
    for (const sd of [-1, 1] as const) {
      for (const lane of [0, 1]) {
        const a = {x: sd * (PAD.w / 2 - 2 - lane * 2.2), z: PAD.cz - PAD.h / 2 + 0.6};
        const b = {x: sd * (14.4 - lane * 0.8), z: -10.2 - lane * 1.2};
        const ps: P[] = [];
        for (let k = 0; k <= 40; k++) {
          const u = k / 40;
          let x = lerp(a.x, b.x, u), z = lerp(a.z, b.z, u) - Math.sin(u * Math.PI) * 2.4;
          const nx = -(b.z - a.z), nz = b.x - a.x, nl = Math.hypot(nx, nz);
          const w = Math.sin(u * Math.PI * 9) * 0.7 * Math.sin(u * Math.PI);
          x += (nx / nl) * w;
          z += (nz / nl) * w;
          ps.push(pr(lift({x, y: vault(x, z) - 0.45, z}, 2.2)));
        }
        tr.push(<path key={`t${sd}${lane}`} d={line(ps)} fill="none" stroke={DEV.gold2} strokeWidth={clamp(px * 0.55, 1.2, 9)} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />);
        tr.push(<path key={`h${sd}${lane}`} d={line(ps)} fill="none" stroke={DEV.gold0} strokeWidth={clamp(px * 0.22, 0.6, 4)} vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity={0.85} />);
      }
    }
    const c = pr({x: 0, y: vault(0, -6) - 0.5, z: -6});
    items.push({d: c.d + 12, el: <g key="traces" opacity={S.traces * (0.35 + 0.65 * clamp(fromBelow * 3 + 0.2))}>{tr}</g>});
  }

  // ---- the gold sensor pad
  if (S.pad > 0.01) {
    const N = 8;
    const grid: P[][] = [];
    for (let j = 0; j <= N; j++) {
      const row: P[] = [];
      for (let i = 0; i <= N; i++) row.push(pr(lift(padPoint((i / N) * 2 - 1, (j / N) * 2 - 1), 3.2)));
      grid.push(row);
    }
    const outline = [...grid[0], ...grid.map((r) => r[N]).slice(1), ...[...grid[N]].reverse().slice(1), ...grid.map((r) => r[0]).reverse().slice(1)];
    // a capacitive electrode pattern: a lattice of small diamonds in the gold, with a thin border trace
    const lines: React.ReactNode[] = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      if ((i + j) % 2) continue;
      const m = (a1: number, b1: number) => pr(lift(padPoint(((i + a1) / N) * 2 - 1, ((j + b1) / N) * 2 - 1), 3.2));
      lines.push(<path key={`d${i}-${j}`} d={poly([m(0.5, 0.08), m(0.92, 0.5), m(0.5, 0.92), m(0.08, 0.5)])} />);
    }
    const c = pr(padPoint(0, 0));
    const vis = clamp(fromBelow * 4 + 0.15);
    let touch: React.ReactNode = null;
    if (contact) {
      const cp = pr(lift(padPoint(contact.u, contact.v, 0.5), 3.2));
      const r = (contact.r ?? 3.2) * (1 + 0.25 * (contact.press ?? 0));
      const g = contact.glow ?? 1;
      touch = (
        <g>
          <circle cx={cp.x} cy={cp.y} r={r * 2.4} fill={`url(#${id}-tg)`} opacity={g} />
          <circle cx={cp.x} cy={cp.y} r={r * (1.1 + 0.6 * (contact.press ?? 0))} fill="none" stroke="#FFFFFF" strokeWidth={clamp(px * 0.45, 1, 6)} vectorEffect="non-scaling-stroke" opacity={0.85 * g} />
        </g>
      );
    }
    items.push({
      d: c.d + 8,
      el: (
        <g key="pad" opacity={S.pad}>
          <defs>
            <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={DEV.gold0} />
              <stop offset="0.45" stopColor={DEV.gold1} />
              <stop offset="1" stopColor={DEV.gold2} />
            </linearGradient>
            <radialGradient id={`${id}-tg`}>
              <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
              <stop offset="0.35" stopColor="#FFF3B0" stopOpacity={0.7} />
              <stop offset="1" stopColor="#FFE08A" stopOpacity={0} />
            </radialGradient>
          </defs>
          <path d={poly(outline)} fill={`url(#${id}-gold)`} opacity={0.4 + 0.6 * vis} />
          <g fill={DEV.gold0} stroke={DEV.gold2} strokeWidth={W2 * 0.6} vectorEffect="non-scaling-stroke" opacity={0.7 * vis}>{lines}</g>
          {padGlow > 0 && <path d={poly(outline)} fill="#FFF6C8" opacity={0.55 * padGlow} />}
          <path d={poly(outline)} fill="none" {...ink(W1)} />
          {touch}
        </g>
      ),
    });
  }

  // ---- battery pods (rear molars, lingual side, sealed in the resin)
  if (S.pods > 0.01) {
    for (const sd of [-1, 1] as const) {
      const P0 = POD(sd);
      const a = pr(lift(P0.a, 2.0)), b = pr(lift(P0.b, 2.0));
      const sc = (pr({x: P0.a.x + 1, y: P0.a.y, z: P0.a.z}).x - a.x) || 1;
      const rr = P0.r * Math.max(0.6, Math.abs(projector(view)({x: 0, y: P0.r, z: 0}).y - projector(view)({x: 0, y: 0, z: 0}).y) / P0.r);
      void sc;
      const wpx = rr * 2;
      items.push({
        d: (a.d + b.d) / 2,
        el: (
          <g key={`pod${sd}`} opacity={S.pods * nf(sd)}>
            <path d={`M${a.x},${a.y}L${b.x},${b.y}`} stroke={DEV.ink} strokeWidth={wpx + (W1 * 2) / Math.max(px, 0.01)} strokeLinecap="round" />
            <path d={`M${a.x},${a.y}L${b.x},${b.y}`} stroke={DEV.pod1} strokeWidth={wpx} strokeLinecap="round" />
            <path d={`M${a.x},${a.y - rr * 0.25}L${b.x},${b.y - rr * 0.25}`} stroke={DEV.pod0} strokeWidth={wpx * 0.45} strokeLinecap="round" opacity={0.9} />
          </g>
        ),
      });
    }
  }

  // ---- teeth (tapered crowns) and the resin shell over them. The shell cups are split into the half behind the
  //      palate and the half in front of it; each half is composited once, so cups never stack where they overlap
  if (S.teeth > 0.01 || S.shell > 0.01) {
    const padD = pr(padPoint(0, 0)).d;
    const back: React.ReactNode[] = [], front: React.ReactNode[] = [], tb: {d: number; el: React.ReactNode}[] = [], sb: React.ReactNode[] = [], sf: React.ReactNode[] = [];
    for (const T of TEETH) {
      const thin = T.i < 2 ? 0.32 : T.i === 2 ? 0.55 : 0.8; // incisal edges are thin; molars are blocky
      const edge = toothRingWB(T, T.edge, 0, 0.82, thin);
      const mid = toothRingWB(T, T.edge + T.h * 0.42, 0, 1, 1);
      const cerv = toothRingWB(T, T.h + 1.4, 0, 0.84, 0.92);
      const pb = edge.map(pr);
      const H = hull([...pb, ...mid.map(pr), ...cerv.map(pr)]);
      const cc = pr({x: T.c.x, y: (T.edge + T.h) / 2, z: T.c.z});
      const lab = facing(view, {x: T.n.x, y: 0, z: T.n.z});
      const occ = facing(view, {x: 0, y: -1, z: 0});
      const fill = lab > 0.3 ? DEV.tooth0 : DEV.tooth1;
      if (S.teeth > 0.01) {
        tb.push({d: cc.d, el: (
          <g key={`t${T.side}${T.i}`} opacity={S.teeth * nf(T.c.x)}>
            <path d={poly(H)} fill={fill} />
            {occ > 0.15 && <path d={poly(hull(pb))} fill={DEV.tooth1} opacity={clamp((occ - 0.15) * 3) * 0.8} />}
            <path d={poly(H)} fill="none" {...ink(W2 * 1.1)} />
          </g>
        )});
      }
      if (S.shell > 0.01) {
        const SH = hull([...toothRingWB(T, T.edge - 0.9, 0.9, 0.9, Math.max(thin, 0.6)).map(pr), ...toothRingWB(T, T.edge + T.h * 0.42, 0.9, 1, 1).map(pr), ...toothRingWB(T, T.h + 2.4, 0.9, 0.9, 0.95).map(pr)]);
        const el = <path key={`s${T.side}${T.i}`} d={poly(SH)} fill="#DDF3FB" stroke="#DDF3FB" strokeWidth={0.2} />;
        const edgeEl = <path key={`se${T.side}${T.i}`} d={poly(SH)} fill="none" stroke={DEV.resinEdge} strokeWidth={W1 * 1.1} vectorEffect="non-scaling-stroke" opacity={0.75} />;
        if (nf(T.c.x) < 0.02) continue;
        if (cc.d > padD) { sb.push(el); back.push(edgeEl); } else { sf.push(<g key={`n${T.side}${T.i}`} opacity={nf(T.c.x)}>{el}</g>); front.push(<g key={`ne${T.side}${T.i}`} opacity={nf(T.c.x)}>{edgeEl}</g>); }
      }
    }
    for (const q of tb) items.push(q);
    const shellOp = (S.teeth > 0.5 ? 0.42 : 0.55) * S.shell;
    if (sb.length) items.push({d: padD + 6, el: <g key="shell-back"><g opacity={shellOp}>{sb}</g><g opacity={S.shell}>{back}</g></g>});
    if (sf.length) items.push({d: -1e6, el: <g key="shell-front"><g opacity={shellOp}>{sf}</g><g opacity={S.shell}>{front}</g></g>});
  }

  // ---- tongue silhouette (see-through, view from below)
  if (tongueX > 0.01 && contact) {
    const cp = padPoint(contact.u, contact.v, 0.6);
    const ps: P[] = [];
    // tongue outline: a rounded tip at the contact, widening toward the throat (−z)
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI + (k / 12) * Math.PI; // tip semicircle (front)
      ps.push(pr({x: cp.x + Math.cos(a) * 5.5, y: 2, z: cp.z - Math.sin(a) * 5.5}));
    }
    for (let k = 0; k <= 10; k++) {
      const u = k / 10;
      ps.push(pr({x: cp.x * (1 - u) + 5.5 + 12 * Math.sin(u * Math.PI * 0.5), y: 2, z: cp.z - u * 30}));
    }
    for (let k = 10; k >= 0; k--) {
      const u = k / 10;
      ps.push(pr({x: cp.x * (1 - u) - 5.5 - 12 * Math.sin(u * Math.PI * 0.5), y: 2, z: cp.z - u * 30}));
    }
    const c = pr({x: cp.x, y: 2, z: cp.z - 8});
    items.push({
      d: c.d - 50,
      el: <path key="tongue" d={smoothPath(ps)} fill="#E87C86" opacity={0.62 * tongueX} stroke="#B84A57" strokeWidth={W1} vectorEffect="non-scaling-stroke" />,
    });
  }

  items.sort((a, b) => b.d - a.d);
  return <g opacity={light}>{items.map((i) => i.el)}</g>;
};

/** screen position (model units after projection) of a pad point, for effects drawn by a scene */
export const padScreen = (view: View, u: number, v: number) => projector(view)(padPoint(u, v));
