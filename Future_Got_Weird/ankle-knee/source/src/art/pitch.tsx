// The soccer pitch, seen side-on from a low lens: sky, a distant tree line, a small goal down the field, the turf
// receding to the horizon in mowing stripes (bands of constant distance), a touchline, and grass tufts on the subject
// plane and in the foreground. Everything is projected through the camera (camera.tsx proj), so the field
// recedes with true parallax as the camera tracks, rises or pushes in. Flat Weird Crew colours, ink only on props.
import React from 'react';
import {Cam, D0, H, W, groundD, horizonY, proj} from '../camera';
import {mix, shade, lit} from '../dc/color';
import {INK} from '../dc/ink';
import {fmt} from '../dc/math';
import {hash} from '../lib';
import {C} from './pal';

const S = (p: {x: number; y: number}) => `${fmt(p.x)},${fmt(p.y)}`;

export const Pitch: React.FC<{c: Cam; id: string; goalX?: number}> = ({c, id, goalX = -760}) => {
  const yh = horizonY(c);
  const k0 = W / c.w;
  // turf bands: constant-distance stripes 180 cm deep
  const bands: React.ReactNode[] = [];
  const dBottom = groundD(c, H + 20);
  const dStart = Math.max(40, Math.min(D0, dBottom));
  const step = 180;
  let i0 = Math.floor(dStart / step);
  for (let i = i0; i < 60; i++) {
    const dn = Math.max(dStart, i * step), df = (i + 1) * step;
    const yn = Math.min(H + 20, yh + (k0 * D0 * (0 - c.eye)) / dn), yf = yh + (k0 * D0 * (0 - c.eye)) / df;
    if (yn - yf < 0.3) break;
    const haze = Math.min(0.55, (df / 9000) * 0.9);
    const base = i % 2 ? C.turf : C.turfLight;
    bands.push(<rect key={i} x={-10} y={fmt(yf)} width={W + 20} height={fmt(yn - yf + 0.6)} fill={mix(base, C.sky, haze)} />);
  }
  // the far haze strip at the horizon
  const lineBand = (D: number, depth: number, op = 1) => {
    const a = yh + (k0 * D0 * (0 - c.eye)) / D, b = yh + (k0 * D0 * (0 - c.eye)) / (D + depth);
    return a > -10 && b < H + 10 ? <rect x={-10} y={fmt(b)} width={W + 20} height={fmt(Math.max(0.6, a - b))} fill={C.line} opacity={op} /> : null;
  };
  // trees (far)
  const DT = 9000;
  const trees: React.ReactNode[] = [];
  const kT = k0 * (D0 / DT);
  const span = (W / 2) / kT + 800;
  const t0 = Math.floor((c.x - span) / 260), t1 = Math.ceil((c.x + span) / 260);
  for (let i = t0; i <= t1; i++) {
    const x = i * 260 + hash(i * 3.1) * 120;
    const h = 900 + hash(i * 7.7) * 600, r = 240 + hash(i * 1.9) * 160;
    const p = proj(c, DT, {x, y: -h * 0.6}), q = proj(c, DT, {x, y: 0});
    const rr = r * kT;
    trees.push(
      <g key={i}>
        <rect x={fmt(q.x - 14 * kT)} y={fmt(p.y)} width={fmt(28 * kT)} height={fmt(q.y - p.y)} fill={mix(C.treesDeep, C.sky, 0.45)} />
        <ellipse cx={fmt(p.x)} cy={fmt(p.y - rr * 0.2)} rx={fmt(rr)} ry={fmt(rr * 1.15)} fill={mix(i % 2 ? C.trees : C.treesDeep, C.sky, 0.42)} />
      </g>,
    );
  }
  // the goal down the field (a small youth goal, 180 x 500 cm, side-on: we see one post, the crossbar running away and
  // the net's side panel)
  const DG = 1500, DG2 = 1500 + 200;
  const gp = (x: number, y: number, D = DG) => proj(c, D, {x, y});
  const gh = 180;
  const goal = (
    <g opacity={0.95}>
      <polygon points={[gp(goalX, 0), gp(goalX, -gh), gp(goalX, -gh, DG2), gp(goalX + 110, 0, DG2)].map(S).join(' ')} fill="#FFFFFF" opacity={0.16} />
      {Array.from({length: 9}, (_, i) => {
        const u = i / 8;
        const a = gp(goalX, -gh * (1 - u)), b = gp(goalX + 110 * u, 0, DG2);
        return <line key={i} x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} stroke="#FFFFFF" strokeWidth={1.2} opacity={0.5} />;
      })}
      {Array.from({length: 7}, (_, i) => {
        const u = i / 6;
        const a = gp(goalX + 110 * u * 0.0, -gh * u), b = gp(goalX + 110 * u, -gh * u * 0.0 - gh * (u > 0 ? 0 : 0), DG2);
        void b;
        const p1 = gp(goalX, -gh * u), p2 = {x: gp(goalX, -gh, DG2).x + (gp(goalX + 110, 0, DG2).x - gp(goalX, -gh, DG2).x) * (1 - u), y: gp(goalX, -gh, DG2).y + (gp(goalX + 110, 0, DG2).y - gp(goalX, -gh, DG2).y) * (1 - u)};
        void a;
        return <line key={`h${i}`} x1={fmt(p1.x)} y1={fmt(p1.y)} x2={fmt(p2.x)} y2={fmt(p2.y)} stroke="#FFFFFF" strokeWidth={1.1} opacity={0.42} />;
      })}
      <line x1={fmt(gp(goalX, 0).x)} y1={fmt(gp(goalX, 0).y)} x2={fmt(gp(goalX, -gh).x)} y2={fmt(gp(goalX, -gh).y)} stroke="#FFFFFF" strokeWidth={fmt(9 * k0 * (D0 / DG))} strokeLinecap="round" />
      <line x1={fmt(gp(goalX, -gh).x)} y1={fmt(gp(goalX, -gh).y)} x2={fmt(gp(goalX, -gh, DG2).x)} y2={fmt(gp(goalX, -gh, DG2).y)} stroke="#F2F4F6" strokeWidth={fmt(8 * k0 * (D0 / DG2))} strokeLinecap="round" />
    </g>
  );
  // grass tufts on a plane at distance D (y = 0), every `gap` cm
  const tufts = (D: number, gap: number, size: number, seed: number, dark: number) => {
    const k = k0 * (D0 / D);
    const half = (W / 2) / k + 20;
    const xa = Math.floor((c.x - half) / gap), xb = Math.ceil((c.x + half) / gap);
    const out: React.ReactNode[] = [];
    for (let i = xa; i <= xb; i++) {
      const x = i * gap + (hash(i * 1.37 + seed) - 0.5) * gap * 0.8;
      const b = proj(c, D, {x, y: 0});
      if (b.y < -20 || b.y > H + 40) continue;
      const s = size * k * (0.7 + 0.6 * hash(i * 2.9 + seed));
      const col = shade(i % 3 ? C.turfDeep : C.turf, dark);
      const blades = [-0.5, 0, 0.45].map((o, j) => {
        const lean = (hash(i * 5.1 + j + seed) - 0.5) * 0.9 + o * 0.6;
        const tip = {x: b.x + lean * s * 0.7, y: b.y - s * (0.8 + 0.4 * hash(i + j * 3 + seed))};
        const w = s * 0.13;
        return `M${fmt(b.x - w + o * s * 0.3)},${fmt(b.y)} Q${fmt((b.x + tip.x) / 2 + o * s * 0.2)},${fmt((b.y + tip.y) / 2)} ${fmt(tip.x)},${fmt(tip.y)} Q${fmt((b.x + tip.x) / 2 + o * s * 0.3 + w)},${fmt((b.y + tip.y) / 2)} ${fmt(b.x + w + o * s * 0.3)},${fmt(b.y)} Z`;
      });
      out.push(<path key={i} d={blades.join(' ')} fill={col} />);
    }
    return out;
  };
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.skyHigh} />
          <stop offset="1" stopColor={lit(C.sky, 0.25)} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={fmt(Math.max(0, yh + 2))} fill={`url(#${id}-sky)`} />
      <g style={{filter: 'blur(2.5px)'}}>{trees}</g>
      <rect x={0} y={fmt(yh)} width={W} height={fmt(Math.max(0, H - yh))} fill={mix(C.turfLight, C.sky, 0.5)} />
      {bands}
      {lineBand(1100, 14, 0.75)}
      {goal}
      {lineBand(470, 10)}
      {tufts(900, 26, 9, 11, 0.05)}
      {tufts(D0 + 40, 10, 5.5, 3, 0.08)}
      {tufts(D0, 7, 4.5, 5, 0.0)}
    </svg>
  );
};
/** foreground grass between the lens and the subject (drawn over the subject's feet only at the very bottom) */
export const ForeGrass: React.FC<{c: Cam}> = ({c}) => {
  const k0 = W / c.w;
  const D = 170;
  const k = k0 * (D0 / D);
  const half = (W / 2) / k + 10;
  const gap = 4;
  const xa = Math.floor((c.x - half) / gap), xb = Math.ceil((c.x + half) / gap);
  const out: React.ReactNode[] = [];
  for (let i = xa; i <= xb; i++) {
    const x = i * gap + (hash(i * 4.1) - 0.5) * gap;
    const b = proj(c, D, {x, y: 0});
    if (b.y > H + 60 || b.y < 0) continue;
    const s = 4.5 * k * (0.6 + 0.6 * hash(i * 2.3));
    const lean = (hash(i * 9.3) - 0.5) * 1.2;
    out.push(<path key={i} d={`M${fmt(b.x - s * 0.12)},${fmt(b.y + 30)} Q${fmt(b.x + lean * s * 0.3)},${fmt(b.y - s * 0.4)} ${fmt(b.x + lean * s * 0.7)},${fmt(b.y - s)} Q${fmt(b.x + lean * s * 0.3 + s * 0.12)},${fmt(b.y - s * 0.4)} ${fmt(b.x + s * 0.12)},${fmt(b.y + 30)} Z`} fill={shade(C.turfDeep, 0.15 + 0.15 * hash(i * 1.1))} />);
  }
  return <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>{out}</svg>;
};

/** the team bench at the touchline, seen end-on (it runs away from the lens), so a boy can sit on it facing left */
export const Bench: React.FC<{c: Cam; x: number; iw: number}> = ({c, x, iw}) => {
  const seatY = -37, depth = 32, thick = 4.5, back = -74;
  const Dn = D0 - 12, Df = D0 + 110;
  const pp = (px: number, py: number, D: number) => proj(c, D, {x: px, y: py});
  const poly = (pts: {x: number; y: number}[], fill: string, op = 1) => (
    <polygon points={pts.map(S).join(' ')} fill={fill} stroke={INK} strokeWidth={iw} strokeLinejoin="round" opacity={op} />
  );
  const xf = x - depth / 2, xb = x + depth / 2;
  const legs = [Dn + 6, Df - 6];
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      {/* far legs, then the seat's top surface receding, the backrest, the near end */}
      {legs.map((D, i) => (
        <g key={i}>
          {poly([pp(xf + 3, seatY, D), pp(xf + 6, seatY, D), pp(xf + 6, 0, D), pp(xf + 3, 0, D)], shade(C.metal, i ? 0.25 : 0.05))}
          {poly([pp(xb - 6, seatY, D), pp(xb - 3, seatY, D), pp(xb - 3, 0, D), pp(xb - 6, 0, D)], shade(C.metal, i ? 0.3 : 0.1))}
        </g>
      ))}
      {poly([pp(xb - 2, back, Dn), pp(xb + 2, back, Dn), pp(xb + 2, back, Df), pp(xb - 2, back, Df)], shade(C.bench, 0.2))}
      {poly([pp(xb - 1, back + 2, Dn + 4), pp(xb + 1, back + 2, Dn + 4), pp(xb + 1, seatY, Dn + 4), pp(xb - 1, seatY, Dn + 4)], C.metal)}
      {poly([pp(xf, seatY, Dn), pp(xb, seatY, Dn), pp(xb, seatY, Df), pp(xf, seatY, Df)], lit(C.bench, 0.12))}
      {poly([pp(xf, seatY, Dn), pp(xb, seatY, Dn), pp(xb, seatY + thick, Dn), pp(xf, seatY + thick, Dn)], C.benchDeep)}
      {poly([pp(xb - 2, back, Dn), pp(xb + 2, back, Dn), pp(xb + 2, back + 9, Dn), pp(xb - 2, back + 9, Dn)], C.benchDeep)}
    </svg>
  );
};
