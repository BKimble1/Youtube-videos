// Ophiocordyceps unilateralis s.l. on a dead ant, from the field descriptions: a single stalk (stroma) grows from
// the back of the head (the dorsal pronotal/neck region), out and then downward; it is dark brown at the base and pale
// at the young growing tip. Partway along it, a lateral cushion (the fertile ascoma) swells on one side; its surface
// carries the openings of the flask-shaped perithecia, from which long thin ascospores are shot out and fall onto the
// forest floor below. White mycelium grows out of the body's joints and sutures and tethers the corpse to the leaf.
import React from 'react';
import {add3, Basis, capsule2, cross3, dot3, len3, lerp3, mul3, norm3, P2, proj, smoothClosed, smoothOpen, sub3, V3} from '../core/three';
import {ellipsoidItem, inkW, Item} from '../core/draw3';
import {lit, mix, shade} from '../core/color';
import {INK} from '../core/ink';
import {hash, noise1} from '../lib';
import {hw, Rig, STALK_BASE} from '../ant/rig';

export type StalkSpec = {seed: number; len: number; bend: number; lean: number};
const NS = 28;
/** the full-grown stalk's centreline (head coordinates are used for the start, then it curves under gravity) */
export const stalkLine = (R: Rig, sp: StalkSpec): V3[] => {
  const st = R.st, sc = st.scale ?? 1;
  const base = hw(st, R.head, STALK_BASE);
  const H = R.head;
  let d = norm3(add3(mul3(H.u, 1), add3(mul3(H.f, -0.3), mul3(H.l, sp.lean))));
  const pts: V3[] = [base];
  const step = (sp.len * sc) / NS;
  for (let k = 1; k <= NS; k++) {
    const w1 = noise1(k * 0.45, sp.seed) * 0.085, w2 = noise1(k * 0.45, sp.seed + 7) * 0.085;
    d = norm3(add3(d, add3([0, 0, -sp.bend * 0.045 * (k < 4 ? 0.3 : 1)], add3(mul3(H.l, w1), mul3(H.f, w2)))));
    pts.push(add3(pts[k - 1], mul3(d, step)));
  }
  return pts;
};
/** a point and tangent at arc fraction a along the full stalk */
export const stalkAt = (line: V3[], a: number) => {
  const f = Math.max(0, Math.min(NS - 1e-6, a * NS));
  const k = Math.floor(f), t = f - k;
  return {p: lerp3(line[k], line[k + 1], t), d: norm3(sub3(line[k + 1], line[k]))};
};
export const ASC_AT = 0.62;
/** the ascoma (V2): a cushion of perithecia on the stalk's lower side; centre, frame and size */
export const ascoma = (line: V3[], asc: number, open: number) => {
  const {p, d} = stalkAt(line, ASC_AT);
  let out = sub3([0, 0, -1], mul3(d, dot3([0, 0, -1], d)));
  if (len3(out) < 0.2) out = norm3(cross3(d, [1, 0, 0]));
  out = norm3(out);
  const side = norm3(cross3(d, out));
  const k = asc * (1 + 0.1 * open);
  return {p, d, out, side, k, c: add3(p, mul3(out, 0.35 * k)), ax: [mul3(d, 1.3 * k), mul3(out, 0.75 * k), mul3(side, 0.95 * k)] as [V3, V3, V3]};
};
/** the perithecia: unit positions on the cushion's dome (along, side, height) */
const PERI = (() => {
  const out: [number, number, number][] = [];
  for (let i = 0; i < 34; i++) {
    const r = Math.sqrt(hash(i * 3.3 + 0.7)) * 0.95;
    const a = hash(i * 7.1 + 2.1) * Math.PI * 2;
    out.push([r * Math.cos(a), r * Math.sin(a), Math.sqrt(Math.max(0, 1 - r * r))]);
  }
  return out;
})();
export const CUSH = {along: 1.25, side: 0.95, h: 0.95, bump: 0.19};
export const perithecia = (C: ReturnType<typeof ascoma>) =>
  PERI.map(([u, v, h]) => {
    const pos = add3(C.p, add3(mul3(C.d, u * CUSH.along * C.k), add3(mul3(C.side, v * CUSH.side * C.k), mul3(C.out, (0.12 + h * CUSH.h) * C.k))));
    const n = norm3(add3(mul3(C.out, h + 0.25), add3(mul3(C.d, u * 0.7), mul3(C.side, v * 0.7))));
    return {pos, n};
  });
/** the openings the spores are shot from */
export const ostioles = (C: ReturnType<typeof ascoma>): V3[] => perithecia(C).map((q) => add3(q.pos, mul3(q.n, CUSH.bump * C.k)));

const f2 = (n: number) => n.toFixed(2);
let fid = 0;
let fns = '';
export const resetFungusIds = (ns = '') => {
  fid = 0;
  fns = ns;
};
export const sporeGlowId = () => `${fns}sporeGlow`;
const STALK_BASE_COL = '#4E3322', STALK_MID = '#A27A50', STALK_TIP = '#E9DEC0';

/** the stalk (grown to fraction g of its length) and its ascoma */
export const stalkItems = (B: Basis, R: Rig, sp: StalkSpec, g: number, asc: number, open: number, o: {zBias?: number; fog?: number} = {}): Item[] => {
  if (g <= 0.002) return [];
  const line = stalkLine(R, sp);
  const sc = R.st.scale ?? 1;
  const n = Math.max(2, Math.ceil(g * NS));
  const pts: V3[] = [];
  for (let k = 0; k < n; k++) pts.push(line[k]);
  pts.push(stalkAt(line, g).p);
  const P = pts.map((p) => proj(B, p));
  const rad = (a: number) => (0.36 - 0.14 * a) * sc * (0.75 + 0.25 * Math.min(1, g * 3));
  // outline: offset both sides in screen space
  const L: {x: number; y: number}[] = [], Rr: {x: number; y: number}[] = [];
  for (let k = 0; k < P.length; k++) {
    const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const r = rad((k / (P.length - 1)) * g) * P[k].s;
    L.push({x: P[k].x - ty * r, y: P[k].y + tx * r});
    Rr.push({x: P[k].x + ty * r, y: P[k].y - tx * r});
  }
  // rounded tip
  const tipP = P[P.length - 1], prv = P[P.length - 2];
  let tx = tipP.x - prv.x, ty = tipP.y - prv.y;
  const tl = Math.hypot(tx, ty) || 1;
  tx /= tl; ty /= tl;
  const rt = rad(g) * tipP.s * 1.08;
  const cap = {x: tipP.x + tx * rt, y: tipP.y + ty * rt};
  const outline = [...L, cap, ...Rr.reverse()];
  const id = `${fns}sk${fid++}`;
  const w = inkW(P[0].s * sc, 0.8);
  const fog = o.fog ?? 0;
  const youth = Math.max(0, 1 - g * 1.4);
  const midC = mix(STALK_MID, '#5E826A', fog * 0.6);
  const zStalk = proj(B, stalkAt(line, Math.min(g, 0.3) * 0.6).p).z;
  const items: Item[] = [
    {
      z: zStalk + (o.zBias ?? 0),
      el: (
        <g key={id}>
          <defs>
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(P[0].x)} y1={f2(P[0].y)} x2={f2(tipP.x)} y2={f2(tipP.y)}>
              <stop offset="0" stopColor={mix(STALK_BASE_COL, '#5E826A', fog * 0.6)} />
              <stop offset={f2(0.35 + 0.3 * youth)} stopColor={midC} />
              <stop offset="0.86" stopColor={mix(midC, STALK_TIP, 0.45)} />
              <stop offset="1" stopColor={STALK_TIP} />
            </linearGradient>
          </defs>
          <path d={smoothClosed(outline)} fill={`url(#${id})`} stroke={INK} strokeWidth={f2(w)} strokeLinejoin="round" strokeOpacity={1 - fog * 0.6} />
          <path d={smoothOpen(L.slice(1, -1).map((q, k) => ({x: q.x * 0.6 + P[k + 1].x * 0.4, y: q.y * 0.6 + P[k + 1].y * 0.4})))} fill="none" stroke="#FFFFFF" strokeWidth={f2(Math.max(0.6, rad(0.4) * P[0].s * 0.35))} strokeLinecap="round" opacity={0.28} />
        </g>
      ),
    },
  ];
  if (asc > 0.01 && g > ASC_AT + 0.05) {
    const A = ascoma(line, asc, open);
    const ost = ostioles(A);
    const C = proj(B, A.c);
    const dots = ost
      .filter((q) => dot3(sub3(q, A.c), sub3(B.eye, q)) > 0)
      .map((q, k) => {
        const Q = proj(B, q);
        const r = (0.07 + 0.07 * open) * Q.s * sc;
        return (
          <g key={k}>
            <circle cx={f2(Q.x)} cy={f2(Q.y)} r={f2(r * 1.7)} fill={lit('#8A5530', 0.35)} opacity={0.35 + 0.4 * open} />
            <circle cx={f2(Q.x)} cy={f2(Q.y)} r={f2(r)} fill="#2A160C" opacity={0.25 + 0.75 * open} />
          </g>
        );
      });
    items.push(ellipsoidItem(B, A.c, A.ax, mix('#8E5A33', '#5E826A', fog * 0.6), {zBias: (o.zBias ?? 0) - 0.05, spec: 0.6, deco: <g>{dots}</g>}));
    void C;
  }
  return items;
};

/** white mycelium growing out of the joints and sutures; strands reach to the leaf from the feet */
export const tetherItems = (B: Basis, R: Rig, teth: number, leafPoint?: (p: V3) => V3, seed = 1): Item[] => {
  if (teth <= 0.01) return [];
  const sc = R.st.scale ?? 1;
  const sites: {p: V3; k: number}[] = [];
  R.legs.forEach((L, i) => {
    sites.push({p: L.knee, k: 0.8});
    sites.push({p: L.ankle, k: 0.6});
    sites.push({p: L.troch, k: 0.9});
  });
  sites.push({p: hw(R.st, R.head, [0.05, 0, 0.1]), k: 1.2});
  R.legs.forEach(() => undefined);
  const items: Item[] = [];
  const bodyC = proj(B, R.body.o);
  sites.forEach((s, j) => {
    const Pp = proj(B, s.p);
    // cottony mycelium: many short, curling filaments, mostly pointing away from the body, and a soft white mat
    const n = 13;
    const out = Math.atan2(Pp.y - bodyC.y, Pp.x - bodyC.x);
    const strokes: string[] = [];
    for (let m = 0; m < n; m++) {
      const a = out + (hash(j * 17 + m * 3.1 + seed) - 0.5) * 3.6;
      const L = (0.12 + 0.4 * hash(j * 5 + m * 7.3 + seed) ** 1.5) * s.k * teth * sc * Pp.s;
      const curl = (hash(j * 3 + m + seed) - 0.5) * 1.6;
      const ex = Pp.x + Math.cos(a) * L, ey = Pp.y + Math.sin(a) * L;
      const mx = Pp.x + Math.cos(a + curl) * L * 0.6, my = Pp.y + Math.sin(a + curl) * L * 0.6;
      strokes.push(`M${f2(Pp.x)},${f2(Pp.y)} Q${f2(mx)},${f2(my)} ${f2(ex)},${f2(ey)}`);
    }
    const w = Math.max(0.6, 0.035 * Pp.s * sc);
    const r = 0.2 * s.k * teth * sc * Pp.s;
    items.push({
      z: Pp.z - 0.3 * sc,
      el: (
        <g key={`tt${j}`} opacity={Math.min(1, teth * 1.6)}>
          <circle cx={f2(Pp.x)} cy={f2(Pp.y)} r={f2(r * 1.5)} fill="#F2EEE2" opacity={0.35} />
          <circle cx={f2(Pp.x)} cy={f2(Pp.y)} r={f2(r)} fill="#F5F1E6" opacity={0.85} />
          {strokes.map((d, m) => <path key={m} d={d} fill="none" stroke="#A9A190" strokeWidth={f2(w * 2.0)} strokeLinecap="round" opacity={0.25} />)}
          {strokes.map((d, m) => <path key={`w${m}`} d={d} fill="none" stroke="#F7F3E8" strokeWidth={f2(w)} strokeLinecap="round" opacity={0.9} />)}
        </g>
      ),
    });
  });
  // strands from the feet (and the head) to the leaf surface
  if (leafPoint) {
    const ends = [...R.legs.map((L) => L.foot), R.headC];
    ends.forEach((e, j) => {
      const q = leafPoint(e);
      const A = proj(B, e), Q = proj(B, lerp3(e, q, Math.min(1, teth * 1.3)));
      items.push({z: A.z - 0.2, el: <path key={`ts${j}`} d={`M${P2(A)} L${P2(Q)}`} stroke="#F3EFE2" strokeWidth={f2(Math.max(0.6, 0.05 * A.s * sc))} strokeLinecap="round" opacity={0.8 * Math.min(1, teth * 2)} />});
    });
  }
  return items;
};

/** one ascospore: a long thin sliver with a soft glow (drawn larger than life so it can be followed) */
export const sporeEl = (B: Basis, p: V3, d: V3, size: number, a: number, key: string, glow = 1, minPx = 0): {z: number; el: React.ReactNode} => {
  const P = proj(B, p);
  let half = mul3(norm3(d), size * 0.5);
  let A = proj(B, sub3(p, half)), Bq = proj(B, add3(p, half));
  const Lpx = Math.hypot(Bq.x - A.x, Bq.y - A.y);
  if (Lpx < minPx) {
    // keep a followable size on screen: stretch about the centre, keeping the projected direction
    const k = minPx / Math.max(Lpx, 0.5);
    const dx = (Bq.x - A.x) / 2, dy = (Bq.y - A.y) / 2;
    const ux = Lpx > 0.5 ? dx * k : 0, uy = Lpx > 0.5 ? dy * k : minPx / 2;
    A = {...A, x: P.x - ux, y: P.y - uy};
    Bq = {...Bq, x: P.x + ux, y: P.y + uy};
  }
  const r = Math.max(0.9, size * 0.11 * P.s, minPx * 0.13);
  const gl = Math.max(4, size * 0.9 * P.s, minPx * 1.5) * glow;
  return {
    z: P.z,
    el: (
      <g key={key} opacity={a}>
        {glow > 0 && <circle cx={f2(P.x)} cy={f2(P.y)} r={f2(gl)} fill={`url(#${sporeGlowId()})`} />}
        <path d={capsule2(A, Bq, r, r * 0.8)} fill="#F7F1DA" stroke="#6B5A3E" strokeWidth={f2(Math.max(0.5, r * 0.35))} />
      </g>
    ),
  };
};
/** a fading trail through earlier positions (screen space) */
export const trailEl = (B: Basis, pts: V3[], key: string, w = 3): React.ReactNode => {
  const P = pts.map((p) => proj(B, p)).filter((q) => q.z > 1);
  if (P.length < 2) return null;
  return (
    <g key={key}>
      {P.slice(1).map((q, i) => (
        <path key={i} d={`M${P2(P[i])} L${P2(q)}`} stroke="#FFF6D2" strokeWidth={f2(w * (1 - i / P.length))} strokeLinecap="round" opacity={0.5 * (1 - i / (P.length - 1))} />
      ))}
    </g>
  );
};
export const SporeDefs: React.FC = () => (
  <defs>
    <radialGradient id={sporeGlowId()}>
      <stop offset="0" stopColor="#FFF8DC" stopOpacity="0.75" />
      <stop offset="0.5" stopColor="#FFF3C4" stopOpacity="0.25" />
      <stop offset="1" stopColor="#FFF3C4" stopOpacity="0" />
    </radialGradient>
  </defs>
);
