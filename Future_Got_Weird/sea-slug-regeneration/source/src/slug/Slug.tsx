// The sea slug renderer. One rig for every shot: a "piece" is a run of the body (whole animal, the detached head, the
// abandoned body, or the head regrowing a body) laid along a path on the substrate and projected by the shot camera.
import React from 'react';
import {clamp, lerp, mix, smooth} from '../lib';
import {P2, P3, Path, Proj, polyPath, smoothPath} from '../geo';
import {A_CUT, A_HEART, BLOTS, C, F0, F1, N0, N1, SPOTS, TUBULES, angleOf, halfW, heightOf, spreadOf} from './anatomy';

export type Piece = {
  id: string;
  path: Path;
  /** arc position on the path of the snout tip (a = 0); the body extends back along decreasing arc */
  tip: number;
  a0: number;
  a1: number;
  scale?: number;
  /** extra length in the neck region (it stretches as the head pulls away) */
  gap?: number;
  /** neck waist pinch 0..1 (1 = closed at the autotomy plane) */
  pinch?: number;
  /** 0..1 the open end rounds over into a sealed wound */
  seal?: number;
  /** regrowth of the body behind the head (1 = complete, the original anatomy) */
  grow?: number;
  /** 0..1 contraction of the trunk (parapodia curl up, trunk shortens) */
  flinch?: number;
  /** 0..1 see-through tissue */
  xray?: number;
  /** heart visibility 0..1 and pulse 0..1 */
  heart?: number;
  beat?: number;
  /** seconds, for idle motion */
  t?: number;
  /** 0..1 head greening after feeding */
  green?: number;
  /** extra lateral bend of the trunk (units at the tail) */
  bend?: number;
  /** rhinophore sway amplitude */
  sway?: number;
  /** extra stretch of the whole animal while gliding (fraction) */
  surge?: number;
};

const growLen = (g: number) => lerp(0.05, 1, smooth(clamp(g)));
const growWid = (g: number) => lerp(0.62, 1, smooth(clamp(g * 1.3)));
const growFlap = (g: number) => smooth(clamp((g - 0.26) / 0.6));
export const growPale = (g: number) => 1 - smooth(clamp((g - 0.15) / 0.85));
const growSpots = (g: number) => smooth(clamp((g - 0.45) / 0.45));

/** distance back from the tip along the path for anatomical a */
const dist = (p: Piece, a: number) => {
  const gap = p.gap ?? 0, g = p.grow ?? 1, fl = p.flinch ?? 0, su = p.surge ?? 0;
  let d = a * (1 + su);
  if (a > A_CUT) d = A_CUT * (1 + su) + (a - A_CUT) * growLen(g) * (1 + su);
  d += gap * clamp((a - N0) / (N1 - N0));
  if (a > N1) d -= (a - N1) * 0.085 * fl * growLen(g);
  return d;
};
/** width factor in the neck (pinch / seal) and regrowth */
const wf = (p: Piece, a: number) => {
  let f = 1;
  if (p.grow !== undefined) {
    // a regrowing piece: the sealed head wound opens into new tissue that thickens as it grows
    const g = p.grow;
    if (a > N0 && a <= A_CUT) f = lerp(1, Math.sqrt(Math.max(0, 1 - Math.pow((a - N0) / (A_CUT - N0), 2))), 1 - smooth(clamp(g / 0.12)));
    if (a > A_CUT) f = lerp(1, growWid(g), smooth(clamp((a - A_CUT) / 6))) * smooth(clamp(g / 0.08));
    return f;
  }
  if (a > N0 && a < N1) {
    const u = (a - N0) / (N1 - N0);
    const pin = 1 - (p.pinch ?? 0) * 0.5 * (1 - Math.cos(2 * Math.PI * u));
    const dome = a <= A_CUT ? Math.sqrt(Math.max(0, 1 - Math.pow((a - N0) / (A_CUT - N0), 2))) : Math.sqrt(Math.max(0, 1 - Math.pow((N1 - a) / (N1 - A_CUT), 2)));
    f = lerp(pin, dome, p.seal ?? 0);
  }
  if (a > A_CUT && (p.grow ?? 1) < 1) f *= lerp(1, growWid(p.grow ?? 1), smooth(clamp((a - A_CUT) / 6)));
  return f;
};

type Geo = {w3: (a: number, v: number, z: number) => P3; w: (a: number) => number; h: (a: number) => number; sp: (a: number) => number; al: (a: number) => number; ripple: (a: number, side: number) => number};
const geo = (p: Piece): Geo => {
  const sc = p.scale ?? 1, t = p.t ?? 0, fl = p.flinch ?? 0, bend = p.bend ?? 0;
  const w = (a: number) => halfW(a) * wf(p, a);
  const h = (a: number) => heightOf(a) * Math.min(1, wf(p, a) * 1.15 + 0.1);
  const g = p.grow ?? 1;
  const sp = (a: number) => spreadOf(a) * growFlap(g) * (1 - 0.14 * fl);
  const al = (a: number) => angleOf(a) + 30 * fl;
  const ripple = (a: number, side: number) => 0.7 * Math.sin(a * 0.52 + t * 1.3 + side * 1.7) + 0.35 * Math.sin(a * 1.31 - t * 0.9 + side);
  const w3 = (a: number, v: number, z: number): P3 => {
    const pt = p.path.at(p.tip - dist(p, a) * sc);
    const nx = -pt.ty, ny = pt.tx;
    const b = bend * Math.pow(clamp((a - 30) / 70), 2);
    return [pt.x + nx * (v + b) * sc, pt.y + ny * (v + b) * sc, z * sc];
  };
  return {w3, w, h, sp, al, ripple};
};

const samples = (a0: number, a1: number, n: number) => {
  const out: number[] = [];
  for (let i = 0; i <= n; i++) out.push(lerp(a0, a1, i / n));
  return out;
};

/** a point on a parapodium: side ±1, a along the body, s 0 (base) .. 1 (margin) */
const flapPt = (G: Geo, side: number, a: number, s: number): P3 => {
  const w = G.w(a), h = G.h(a), sp = G.sp(a), al = (G.al(a) * Math.PI) / 180;
  const lat = w * (0.34 + 0.07 * Math.sin(a * 0.33 + side * 1.3)) * (1 - 0.25 * s) + s * (sp * Math.cos(al) + G.ripple(a, side) * Math.min(1, sp / 6));
  const z = 0.97 * h + s * sp * Math.sin(al) + Math.sin(Math.PI * s) * 1.2;
  return G.w3(a, side * lat, z);
};

/** footprint on the substrate (for the cast shadow) */
export const footprint = (p: Piece, pr: Proj, grow = 1): P2[] => {
  const G = geo(p);
  const as = samples(p.a0, p.a1, 60);
  const ext = (a: number) => {
    const sp = G.sp(a), al = (G.al(a) * Math.PI) / 180;
    return 0.82 * G.w(a) + sp * Math.cos(al) * 0.9 * grow + Math.max(G.w(a) * 0.25, 0);
  };
  const L = as.map((a) => pr(G.w3(a, ext(a) + 0.6, 0)));
  const Rr = as.map((a) => pr(G.w3(a, -ext(a) - 0.6, 0))).reverse();
  return [...L, ...Rr];
};

const r2 = (n: number) => Math.round(n * 100) / 100;

export const SlugPiece: React.FC<{p: Piece; pr: Proj}> = ({p, pr}) => {
  const G = geo(p);
  const sc = p.scale ?? 1;
  const xr = p.xray ?? 0;
  const g = p.grow ?? 1;
  const pale = p.grow !== undefined ? growPale(g) : 0;
  const green = p.green ?? 0;
  const mid = pr(G.w3((p.a0 + p.a1) / 2, 0, 3));
  const px = pr.scaleAt(G.w3((p.a0 + p.a1) / 2, 0, 3)) * sc; // px per unit near the piece
  const lw = clamp(0.24 * px, 1.4, 4.2); // outline width
  const hasHead = p.a0 < 1;
  const hasTrunk = p.a1 > A_CUT + 0.5 && (p.grow === undefined || p.grow > 0.015);
  const surf = 1 - 0.6 * xr; // surface opacity under x-ray
  const T = (col: string) => (pale > 0 ? mix(col, C.pale, pale * 0.85) : col);
  const headCol = mix(C.head, '#76B955', green), headHi = mix(C.headHi, '#A9D884', green);

  // ---- outlines ----
  const silhouette = (a0: number, a1: number, n: number) => {
    const as = samples(a0, a1, n);
    const left = as.map((a) => pr(G.w3(a, G.w(a), G.h(a) * 0.5)));
    const right = as.map((a) => pr(G.w3(a, -G.w(a), G.h(a) * 0.5)));
    return {left, right};
  };
  const foot = (() => {
    const as = samples(p.a0, p.a1, 70);
    const left = as.map((a) => pr(G.w3(a, G.w(a) * 1.1 + 0.3, 0)));
    const right = as.map((a) => pr(G.w3(a, -G.w(a) * 1.1 - 0.3, 0))).reverse();
    return smoothPath([...left, ...right]);
  })();

  const parts: React.ReactNode[] = [];
  parts.push(<path key="foot" d={foot} fill={T(C.foot)} stroke={C.outline} strokeWidth={lw * 0.6} strokeOpacity={0.55} opacity={0.9} />);

  // trunk (behind the neck)
  if (hasTrunk) {
    const ta0 = hasHead ? A_CUT - 1.5 : Math.max(p.a0, A_CUT);
    const {left, right} = silhouette(ta0, p.a1, 70);
    const fill = smoothPath([...left, ...[...right].reverse()]);
    const open = hasHead; // the front edge is inside the animal
    const stroke = open ? smoothPath([...left, ...[...right].reverse()], false) : fill;
    const mids = samples(Math.max(ta0, A_CUT + 2), p.a1 - 4, 30).map((a) => pr(G.w3(a, 0, G.h(a))));
    parts.push(
      <g key="trunk" opacity={surf}>
        <path d={fill} fill={T(C.dorsum)} />
        <path d={smoothPath(mids, false)} fill="none" stroke={T(C.dorsumHi)} strokeWidth={1.3 * px} strokeLinecap="round" opacity={0.4} />
        <path d={stroke} fill="none" stroke={C.outline} strokeWidth={lw} strokeLinejoin="round" />
      </g>,
    );
    // pericardial hump: a faint lighter swelling over the heart
    if (p.a0 <= A_HEART && p.a1 >= A_HEART) {
      const c = pr(G.w3(A_HEART, 0, G.h(A_HEART) + 0.2));
      const s = pr.scaleAt(G.w3(A_HEART, 0, G.h(A_HEART))) * sc;
      parts.push(<ellipse key="hump" cx={c[0]} cy={c[1]} rx={3.1 * s * wf(p, A_HEART)} ry={2.6 * s} fill={T(C.dorsumHi)} opacity={0.35 * surf} />);
    }
  }

  // heart (internal; shown under x-ray)
  // on a regrowing body the heart forms a few units behind the head, then keeps its place as the body grows
  const heartA = p.grow !== undefined && g < 1 ? A_CUT + lerp(3.4, A_HEART - A_CUT, smooth(g)) / growLen(g) : A_HEART;
  if ((p.heart ?? 0) > 0.01 && p.a0 <= heartA && p.a1 >= heartA) {
    const c = pr(G.w3(heartA, 0, 3.2));
    const s = pr.scaleAt(G.w3(heartA, 0, 3.2)) * sc;
    const bt = p.beat ?? 0;
    const k = (p.heart ?? 0);
    const ax = pr(G.w3(heartA - 1, 0, 3.2)), bx = pr(G.w3(heartA + 1, 0, 3.2));
    const ang = (Math.atan2(bx[1] - ax[1], bx[0] - ax[0]) * 180) / Math.PI;
    const vs = (1 + 0.16 * bt) * lerp(0.45, 1, smooth(k)) * (p.grow !== undefined ? lerp(0.62, 1, smooth(g)) : 1);
    parts.push(
      <g key="heart" transform={`translate(${r2(c[0])},${r2(c[1])}) rotate(${r2(ang)})`} opacity={clamp(k * 1.2)}>
        <ellipse rx={3.6 * s} ry={2.9 * s} fill={C.peri} opacity={0.55} stroke="#C98C80" strokeWidth={lw * 0.5} />
        <g transform={`scale(${r2(vs)})`}>
          <ellipse cx={-0.7 * s} rx={1.9 * s} ry={1.45 * s} fill={C.heart} stroke="#8E2E2A" strokeWidth={lw * 0.6} />
          <ellipse cx={1.5 * s} cy={0.2 * s} rx={1.05 * s} ry={0.95 * s} fill="#EA7A6E" stroke="#8E2E2A" strokeWidth={lw * 0.5} />
          <ellipse cx={-1.2 * s} cy={-0.45 * s} rx={0.7 * s} ry={0.35 * s} fill={C.heartHi} opacity={0.8} />
        </g>
      </g>,
    );
  }

  // dorsum spots
  const spotEl = (key: string, q: P3, r: number, paleSpot: boolean | undefined, op: number) => {
    const c = pr(q), s = pr.scaleAt(q) * sc;
    return <circle key={key} cx={r2(c[0])} cy={r2(c[1])} r={r2(Math.max(0.6, r * s))} fill={paleSpot ? C.speck : C.spot} opacity={op} />;
  };
  const spotOp = (a: number) => (a > A_CUT && p.grow !== undefined ? growSpots(g) : 1) * (1 - 0.45 * xr);
  if (hasTrunk) {
    const ds: React.ReactNode[] = [];
    SPOTS.forEach((sp, i) => {
      if (sp.part !== 'dorsum' || sp.a < Math.max(p.a0, A_CUT + 1) || sp.a > p.a1 - 1) return;
      ds.push(spotEl(`d${i}`, G.w3(sp.a, sp.v * G.w(sp.a) * 0.8, G.h(sp.a) * 0.92), sp.r, sp.pale, spotOp(sp.a)));
    });
    parts.push(<g key="dspots">{ds}</g>);
  }

  // parapodia, the farther one first
  if (hasTrunk && p.a1 > F0 + 1 && G.sp((F0 + F1) / 2) > 0.6) {
    const fa0 = Math.max(F0, p.a0), fa1 = Math.min(F1, p.a1);
    const order = [1, -1].sort((s1, s2) => pr.scaleAt(flapPt(G, s1, (fa0 + fa1) / 2, 0.6)) - pr.scaleAt(flapPt(G, s2, (fa0 + fa1) / 2, 0.6)));
    for (const side of order) {
      const as = samples(fa0, fa1, 64);
      const base = as.map((a) => pr(flapPt(G, side, a, 0)));
      const marg = as.map((a) => pr(flapPt(G, side, a, 1)));
      const poly = smoothPath([...base, ...[...marg].reverse()]);
      const am = (fa0 + fa1) / 2;
      const g0 = pr(flapPt(G, side, am, 0)), g1 = pr(flapPt(G, side, am, 1));
      const gid = `${p.id}-fl${side > 0 ? 'L' : 'R'}`;
      const veins = TUBULES.filter((tb) => tb.side === side).map((tb, i) => {
        const pts = tb.pts.filter(([a]) => a > fa0 && a < fa1).map(([a, s]) => pr(flapPt(G, side, a, s)));
        return pts.length > 1 ? <path key={i} d={smoothPath(pts, false)} fill="none" stroke={T(C.vein)} strokeWidth={0.55 * px} strokeLinecap="round" opacity={0.3 + 0.5 * xr} /> : null;
      });
      const blots = BLOTS.filter((b) => b.side === side && b.a > fa0 + 2 && b.a < fa1 - 2 && G.sp(b.a) > 4).map((b, i) => {
        const ring: P2[] = [];
        for (let k = 0; k < 10; k++) {
          const th = (k / 10) * Math.PI * 2;
          ring.push(pr(flapPt(G, side, b.a + Math.cos(th) * b.ra, clamp(b.s + Math.sin(th) * b.rs, 0.02, 0.98))));
        }
        return <path key={i} d={smoothPath(ring)} fill={T('#4E8A3C')} opacity={0.22 * surf} />;
      });
      const fs: React.ReactNode[] = [];
      SPOTS.forEach((sp, i) => {
        if (sp.part !== 'flap' || sp.side !== side || sp.a < fa0 + 1 || sp.a > fa1 - 1) return;
        if (G.sp(sp.a) < 1.5) return;
        fs.push(spotEl(`f${i}`, flapPt(G, side, sp.a, sp.v), sp.r, sp.pale, spotOp(sp.a)));
      });
      parts.push(
        <g key={`flap${side}`}>
          <defs>
            <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={g0[0]} y1={g0[1]} x2={g1[0]} y2={g1[1]}>
              <stop offset="0" stopColor={T(C.flapBase)} />
              <stop offset="0.55" stopColor={T(C.flapMid)} />
              <stop offset="1" stopColor={T(C.flapEdge)} />
            </linearGradient>
          </defs>
          <path d={poly} fill={`url(#${gid})`} opacity={0.97 * surf + 0.0} />
          {blots}
          <g opacity={1}>{veins}</g>
          {fs}
          <path d={smoothPath(marg, false)} fill="none" stroke={T(C.edge)} strokeWidth={Math.max(1.2, 0.5 * px)} strokeLinecap="round" opacity={0.9} />
          <path d={poly} fill="none" stroke={C.outline} strokeWidth={lw * 0.85} strokeLinejoin="round" opacity={0.85} />
        </g>,
      );
    }
  }

  // head
  if (hasHead) {
    const ha1 = Math.min(p.a1, hasTrunk ? A_CUT + 1.5 : A_CUT);
    const {left, right} = silhouette(0, ha1, 50);
    const fill = smoothPath([...left, ...[...right].reverse()]);
    const stroke = hasTrunk ? smoothPath([...[...right].reverse(), ...left], false) : fill;
    const hi = samples(3, Math.min(ha1, 20), 14).map((a) => pr(G.w3(a, 0, G.h(a) * 0.95)));
    const hs: React.ReactNode[] = [];
    SPOTS.forEach((sp, i) => {
      if (sp.part !== 'head' || sp.a > ha1 - 0.6) return;
      hs.push(spotEl(`h${i}`, G.w3(sp.a, sp.v * G.w(sp.a) * 0.85, G.h(sp.a) * 0.85), sp.r * 0.9, sp.pale, 1 - 0.45 * xr));
    });
    const hveins = TUBULES.filter((tb) => Math.abs(tb.side) === 2).map((tb, i) => {
      const pts = tb.pts.filter(([a]) => a < ha1).map(([a, v]) => pr(G.w3(a, v * G.w(a) * 1.6, G.h(a) * 0.9)));
      return pts.length > 1 ? <path key={i} d={smoothPath(pts, false)} fill="none" stroke={C.vein} strokeWidth={0.45 * px} strokeLinecap="round" opacity={0.18 + 0.5 * xr} /> : null;
    });
    parts.push(
      <g key="head">
        <defs>
          <linearGradient id={`${p.id}-hd`} gradientUnits="userSpaceOnUse" x1={pr(G.w3(4, 0, 3))[0]} y1={pr(G.w3(4, 0, 3))[1]} x2={pr(G.w3(ha1, 0, 3))[0]} y2={pr(G.w3(ha1, 0, 3))[1]}>
            <stop offset="0" stopColor={headCol} />
            <stop offset="0.6" stopColor={headCol} />
            <stop offset="1" stopColor={hasTrunk ? T(C.dorsum) : headCol} />
          </linearGradient>
        </defs>
        <path d={fill} fill={`url(#${p.id}-hd)`} opacity={surf * 0.6 + 0.4} />
        <path d={smoothPath(hi, false)} fill="none" stroke={headHi} strokeWidth={3.0 * px} strokeLinecap="round" opacity={0.6} />
        {hveins}
        {hs}
        <path d={stroke} fill="none" stroke={C.outline} strokeWidth={lw} strokeLinejoin="round" />
      </g>,
    );
    // rhinophores: rolled sensory tentacles with orange-yellow tips
    const t = p.t ?? 0, sw = p.sway ?? 1;
    for (const side of [1, -1]) {
      const bA = 7, h0 = G.h(bA);
      const swA = sw * (0.9 * Math.sin(t * 1.9 + side * 0.8)), swV = sw * 0.7 * Math.sin(t * 1.4 + side * 2.1);
      const P0 = G.w3(bA, side * 2.4, h0 * 0.95), P1 = G.w3(2.0 + swA * 0.3, side * 4.4, h0 + 6.0), P2 = G.w3(-6.5 + swA, side * (7.2 + swV), h0 + 9.5);
      const pts: P2[] = [];
      const wds: number[] = [];
      for (let i = 0; i <= 12; i++) {
        const u = i / 12;
        const q: P3 = [0, 1, 2].map((k) => (1 - u) * (1 - u) * P0[k] + 2 * u * (1 - u) * P1[k] + u * u * P2[k]) as P3;
        pts.push(pr(q));
        wds.push(pr.scaleAt(q) * sc * (lerp(1.8, 0.42, Math.pow(u, 1.3)) + 0.25 * Math.sin(Math.PI * u)));
      }
      const outline = (from: number, to: number) => {
        const L: P2[] = [], Rr: P2[] = [];
        for (let i = from; i <= to; i++) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
          const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
          const nx = -dy / l, ny = dx / l, ww = wds[i];
          L.push([pts[i][0] + nx * ww, pts[i][1] + ny * ww]);
          Rr.push([pts[i][0] - nx * ww, pts[i][1] - ny * ww]);
        }
        return [...L, ...Rr.reverse()];
      };
      const whole = outline(0, 12), tip = outline(8, 12);
      const end = pts[12];
      parts.push(
        <g key={`rh${side}`}>
          <path d={smoothPath(whole)} fill={headCol} stroke={C.outline} strokeWidth={lw * 0.85} strokeLinejoin="round" />
          <path d={smoothPath(tip)} fill={C.rhinoTip} />
          <path d={smoothPath(outline(10, 12))} fill={C.rhinoTip2} />
          <circle cx={end[0]} cy={end[1]} r={wds[12] * 0.95} fill={C.rhinoTip2} />
          <path d={smoothPath(pts.slice(2, 11), false)} fill="none" stroke={C.outline} strokeWidth={lw * 0.45} opacity={0.45} />
          <path d={smoothPath(whole, false)} fill="none" stroke={C.outline} strokeWidth={lw * 0.85} strokeLinejoin="round" />
        </g>,
      );
    }
  }
  return <g>{parts}</g>;
};

/** soft cast shadow under a piece */
export const SlugShadow: React.FC<{p: Piece; pr: Proj; op?: number; blur?: number}> = ({p, pr, op = 0.22, blur = 7}) => (
  <path d={polyPath(footprint(p, pr))} fill="#17302A" opacity={op} filter={`url(#blur${blur})`} />
);

/** the mucus trail a gliding piece leaves behind it */
export const Trail: React.FC<{path: Path; from: number; to: number; pr: Proj; w?: number; op?: number}> = ({path, from, to, pr, w = 5, op = 0.5}) => {
  if (to - from < 0.5) return null;
  const n = Math.max(2, Math.round((to - from) / 2));
  const pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const q = path.at(lerp(from, to, i / n));
    pts.push(pr([q.x, q.y, 0]));
  }
  const s = pr.scaleAt([path.at(to).x, path.at(to).y, 0]);
  return (
    <g opacity={op}>
      <path d={smoothPath(pts, false)} fill="none" stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={w * s} strokeLinecap="round" />
      <path d={smoothPath(pts, false)} fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={w * 0.12 * s} strokeLinecap="round" strokeDasharray={`${3 * s} ${5 * s}`} />
    </g>
  );
};

export const BlurDefs: React.FC = () => (
  <defs>
    {[3, 5, 7, 10, 14, 20].map((b) => (
      <filter key={b} id={`blur${b}`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation={b} />
      </filter>
    ))}
  </defs>
);

/** world position of an anatomical point of a piece */
export const piecePoint = (p: Piece, a: number, v = 0, z = 0): P3 => geo(p).w3(a, v, z);
/** world position of a point on a parapodium (side ±1, s 0 base .. 1 margin) */
export const flapPoint = (p: Piece, side: number, a: number, s: number): P3 => flapPt(geo(p), side, a, s);
