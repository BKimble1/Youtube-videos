// From the Death Clock pipeline (Future_Got_Weird/Shorts/death-clock, branch claude/intelligent-fermat-pz7wjt): the
// Weird Crew vector finish shared across the channel. Unchanged except where noted.
// V3 limb construction. A limb (shoulder -> elbow -> wrist, hip -> knee -> ankle) is ONE closed contour: the two
// segments' side lines meet in a smooth arc round the outside of the joint and a soft fold on the inside, so no
// round joint piece (elbow sphere, capsule end) ever shows on the silhouette or inside it. Shading follows each
// segment's own cylinder from the fixed key light, and the two gradients cross-fade across the joint's bisector,
// so the tone turns with the limb instead of stepping at a seam. A short crease is drawn only on the inside of a
// clearly bent joint.
import React from 'react';
import {useInk, inkUnder, InkLine} from './ink';
import {lit, mix, shade} from './color';
import {add, clamp, dot, fmt, len, mul, norm, P, perp, sub, V} from './math';
import {LIGHT} from './shade';

const cross = (a: V, b: V) => a.x * b.y - a.y * b.x;

/** Intersection of lines p + t*r and q + u*s (null when parallel). */
const meet = (p: V, r: V, q: V, s: V): V | null => {
  const d = cross(r, s);
  if (Math.abs(d) < 1e-6) return null;
  const t = cross(sub(q, p), s) / d;
  return add(p, mul(r, t));
};

export type LimbGeo = {
  d: string;
  /** inner fold point (null when the joint is nearly straight) */
  fold: V | null;
  /** bend in degrees (0 = straight) */
  bend: number;
  /** unit direction of the bisector, pointing into the joint's inside */
  inward: V;
  u1: V;
  u2: V;
};

/**
 * Closed outline of a two-segment limb A -> B -> C with radii rA, rB, rC.
 * capA / capC: 'round' (default) or 'flat' end; a flat end is used where the limb disappears into a sleeve,
 * a palm or a shoe, so no rounded end can ever peek out.
 */
export const limbGeo = (A: V, B: V, C: V, rA: number, rB: number, rC: number, capA: 'round' | 'flat' = 'round', capC: 'round' | 'flat' = 'round'): LimbGeo => {
  const u1 = norm(sub(B, A));
  const u2 = norm(sub(C, B));
  const n1 = perp(u1);
  const n2 = perp(u2);
  const cr = cross(u1, u2);
  const bend = (Math.acos(clamp(dot(u1, u2), -1, 1)) * 180) / Math.PI;
  // side +1 is the inside of the bend when cr > 0
  const inSide = cr >= 0 ? 1 : -1;
  type Pt = {p: V; ctrl?: boolean};
  let fold: V | null = null;
  const side = (s: number): Pt[] => {
    const a0 = add(A, mul(n1, s * rA));
    const a1 = add(B, mul(n1, s * rB));
    const b0 = add(B, mul(n2, s * rB));
    const b1 = add(C, mul(n2, s * rC));
    const pts: Pt[] = [{p: a0}];
    if (bend < 3) {
      pts.push({p: mul(add(a1, b0), 0.5)});
    } else if (s === inSide) {
      // inside: the two side lines meet in a fold, softened by a short curve
      let m = meet(a0, sub(a1, a0), b0, sub(b1, b0)) ?? mul(add(a1, b0), 0.5);
      const lim = rB * 2.4;
      if (len(sub(m, B)) > lim) m = add(B, mul(norm(sub(m, B)), lim));
      const soft = rB * clamp(0.25 + bend / 220, 0.25, 0.7);
      const p1 = add(m, mul(norm(sub(a0, m)), Math.min(soft, len(sub(a0, m)) * 0.5)));
      const p2 = add(m, mul(norm(sub(b1, m)), Math.min(soft, len(sub(b1, m)) * 0.5)));
      fold = m;
      pts.push({p: p1}, {p: m, ctrl: true}, {p: p2});
    } else {
      // outside: an arc round the joint, radius rB, from n1 to n2
      const a = Math.atan2(n1.y * s, n1.x * s);
      const b = Math.atan2(n2.y * s, n2.x * s);
      let db = b - a;
      while (db > Math.PI) db -= 2 * Math.PI;
      while (db < -Math.PI) db += 2 * Math.PI;
      const n = Math.max(2, Math.ceil(Math.abs(db) / 0.25));
      for (let i = 0; i <= n; i++) {
        const t = a + (db * i) / n;
        pts.push({p: add(B, {x: Math.cos(t) * rB, y: Math.sin(t) * rB})});
      }
    }
    pts.push({p: b1});
    return pts;
  };
  const cmds = (pts: Pt[]) => {
    const out: string[] = [];
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].ctrl && i + 1 < pts.length) {
        out.push(`Q${P(pts[i].p)} ${P(pts[i + 1].p)}`);
        i++;
      } else out.push(`L${P(pts[i].p)}`);
    }
    return out.join(' ');
  };
  const capCmd = (O: V, r: number, from: V, flat: boolean, ax: V) => {
    const to = add(O, sub(O, from));
    if (flat) return `Q${P(add(O, mul(ax, r * 0.44)))} ${P(to)}`;
    return `A${fmt(r)} ${fmt(r)} 0 0 ${cross(sub(from, O), ax) > 0 ? 1 : 0} ${P(to)}`;
  };
  const plus = side(1);
  const minus = side(-1).reverse();
  let d = `M${P(plus[0].p)} ${cmds(plus.slice(1))}`;
  d += ` ${capCmd(C, rC, plus[plus.length - 1].p, capC === 'flat', u2)}`;
  d += ` ${cmds(minus.slice(1))}`;
  d += ` ${capCmd(A, rA, minus[minus.length - 1].p, capA === 'flat', mul(u1, -1))} Z`;
  const bis = sub(u2, u1);
  const inward = len(bis) < 1e-3 ? mul(n1, inSide) : norm(bis);
  return {d, fold, bend, inward, u1, u2};
};

type LimbProps = {
  id: string;
  A: V;
  B: V;
  C: V;
  rA: number;
  rB: number;
  rC: number;
  color: string;
  capA?: 'round' | 'flat';
  capC?: 'round' | 'flat';
  /** specular streak opacity on each segment */
  spec?: number;
  k?: number;
  /** ink width for the inner crease (0 = none) */
  crease?: number;
  opacity?: number;
};

/** One continuous, cylinder-shaded limb. Takes part in the surrounding <Inked> group's silhouette. */
export const Limb: React.FC<LimbProps> = ({id, A, B, C, rA, rB, rC, color, capA, capC, spec = 0, k = 1, crease = 0, opacity = 1}) => {
  const ink = useInk();
  const g = limbGeo(A, B, C, rA, rB, rC, capA, capC);
  if (ink.pass === 'ink') return inkUnder(ink.w, {d: g.d}, opacity);
  const grad = (gid: string, a0: V, b0: V, r: number) => {
    const ax = norm(sub(b0, a0));
    let n = perp(ax);
    const m = dot(n, LIGHT);
    if (m < 0) n = mul(n, -1);
    const kk = Math.sqrt(Math.abs(m)) * k;
    const mid = mul(add(a0, b0), 0.5);
    const L = add(mid, mul(n, r));
    const S = add(mid, mul(n, -r));
    const sh = shade(color, 0.34 * kk);
    return (
      <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={fmt(L.x)} y1={fmt(L.y)} x2={fmt(S.x)} y2={fmt(S.y)}>
        <stop offset="0" stopColor={lit(color, 0.28 * kk)} />
        <stop offset="0.24" stopColor={lit(color, 0.09 * kk)} />
        <stop offset="0.56" stopColor={color} />
        <stop offset="0.88" stopColor={sh} />
        <stop offset="1" stopColor={mix(sh, color, 0.35)} />
      </linearGradient>
    );
  };
  // cross-fade axis: along the mean of the two segment directions, centred on the joint
  const m = norm(add(g.u1, g.u2));
  const w = rB * 0.9;
  const f0 = add(B, mul(m, -w));
  const f1 = add(B, mul(m, w));
  const streak = (a0: V, b0: V, r: number) => {
    const ax = norm(sub(b0, a0));
    let n = perp(ax);
    if (dot(n, LIGHT) < 0) n = mul(n, -1);
    const c = add(mul(add(a0, b0), 0.5), mul(n, r * 0.5));
    const l = len(sub(b0, a0));
    const ang = (Math.atan2(ax.y, ax.x) * 180) / Math.PI;
    return <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(Math.max(r * 0.4, l * 0.3))} ry={fmt(Math.max(0.6, r * 0.12))} transform={`rotate(${fmt(ang)} ${fmt(c.x)} ${fmt(c.y)})`} fill="#FFFFFF" opacity={spec} />;
  };
  // the segments' own extents for the streaks (kept off the joint)
  const bA = add(B, mul(g.u1, -rB * 1.1));
  const bC = add(B, mul(g.u2, rB * 1.1));
  return (
    <g opacity={opacity}>
      <defs>
        {grad(`${id}-g1`, A, B, (rA + rB) / 2)}
        {grad(`${id}-g2`, B, C, (rB + rC) / 2)}
        <linearGradient id={`${id}-fm`} gradientUnits="userSpaceOnUse" x1={fmt(f0.x)} y1={fmt(f0.y)} x2={fmt(f1.x)} y2={fmt(f1.y)}>
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#FFF" />
        </linearGradient>
        <mask id={`${id}-mk`}>
          <rect x="-20000" y="-20000" width="40000" height="40000" fill={`url(#${id}-fm)`} />
        </mask>
        <clipPath id={`${id}-cp`}>
          <path d={g.d} />
        </clipPath>
      </defs>
      <path d={g.d} fill={`url(#${id}-g1)`} />
      <path d={g.d} fill={`url(#${id}-g2)`} mask={`url(#${id}-mk)`} />
      {spec > 0 && (
        <g clipPath={`url(#${id}-cp)`}>
          {len(sub(bA, A)) > rA && streak(A, bA, (rA + rB) / 2)}
          {len(sub(C, bC)) > rC && streak(bC, C, (rB + rC) / 2)}
        </g>
      )}
      {crease > 0 && g.fold && g.bend > 28 && (
        <InkLine
          d={`M${P(add(g.fold, mul(g.inward, -rB * 0.08)))} Q${P(add(g.fold, add(mul(g.inward, -rB * 0.45), mul(add(g.u1, g.u2), rB * 0.08))))} ${P(add(g.fold, mul(g.inward, -rB * 0.78)))}`}
          w={crease}
          opacity={clamp((g.bend - 28) / 40) * 0.75}
        />
      )}
    </g>
  );
};
