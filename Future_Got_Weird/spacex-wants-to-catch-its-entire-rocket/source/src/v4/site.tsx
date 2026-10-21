// V2 catch site: square lattice tower, carriage, two deep trussed catch arms, quick-disconnect arm (retracted), launch
// mount over a flame trench, hardstand, tank farm, coast. All geometry lives in one world frame (metres, see cam3.ts):
// tower centre at the origin, arms reach toward +X, the vehicle hangs between them at X = VX, Z = 0.
// Arm swing (about the vertical pivots on the carriage) and carriage travel (up the mast) are separate motions.
import React from 'react';
import {Cam3, V3, eyeOf, horizonY, poly, proj, projPoly, scaleAt, toCam} from './cam3';
import {Pal} from './vehicles';
import {rnd} from '../kit/anim';

export const TW = 6; // half-width of the mast
export const VX = 22; // vehicle axis X
export const CAR_DEFAULT = 98; // carriage height for the catch views
export const ARM_LEN = 30;
export const ARM_Z = 6.6; // pivot Z (±)
export const TOWER_H = 142;
const D = Math.PI / 180;

export type Light = 'day' | 'dusk' | 'night' | 'studio';
type L = {mast: string; mastBack: string; arm: string; armHi: string; armLo: string; rail: string; concrete: string; ground: string; sand: string; sea: string; tank: string; tankHi: string; haze: string; marsh: string; lagoon: string; road: string};
// Pad 2 steel reads light silver-grey in daylight (footage 06, 10); deep shadow tones carry the structure.
export const LIGHTS: Record<Light, L> = {
  day: {mast: '#76808a', mastBack: '#aeb6bd', arm: '#66707a', armHi: '#b3bbc2', armLo: '#454e57', rail: '#e2e6e8', concrete: '#d9d4c7', ground: '#c4b897', sand: '#cbbf9c', sea: '#4d8db4', tank: '#eef0f1', tankHi: '#ffffff', haze: 'rgba(214,230,242,0.6)', marsh: '#8d9867', lagoon: '#8fb5c6', road: '#aca599'},
  dusk: {mast: '#4f4c56', mastBack: '#86787e', arm: '#45444e', armHi: '#8a7d82', armLo: '#2c2c35', rail: '#e1c3ae', concrete: '#a08d86', ground: '#776a60', sand: '#8f7a68', sea: '#7d6b7e', tank: '#cdb6ac', tankHi: '#f2d6c2', haze: 'rgba(240,170,140,0.4)', marsh: '#6a6150', lagoon: '#a58a92', road: '#6e625c'},
  night: {mast: '#2a313b', mastBack: '#3a4452', arm: '#283039', armHi: '#46525f', armLo: '#161b21', rail: '#8094ad', concrete: '#3a404a', ground: '#262b31', sand: '#2e3236', sea: '#18223a', tank: '#4b5562', tankHi: '#6e7c8c', haze: 'rgba(40,55,80,0.5)', marsh: '#232a26', lagoon: '#1d2738', road: '#30353c'},
  studio: {mast: '#7a838c', mastBack: '#adb5bc', arm: '#6a747e', armHi: '#a6aeb6', armLo: '#48515a', rail: '#dfe3e6', concrete: '#d5d2c8', ground: '#c7c1ad', sand: '#c4b99f', sea: '#6c9cc2', tank: '#eceef0', tankHi: '#ffffff', haze: 'rgba(220,232,242,0.5)', marsh: '#9aa074', lagoon: '#9cbccc', road: '#a39e92'},
};
export const palFor = (l: Light): Pal => (l === 'studio' ? 'studio' : l);

const seg = (c: Cam3, a: V3, b: V3) => {
  const p = proj(c, a), q = proj(c, b);
  return {x1: p[0], y1: p[1], x2: q[0], y2: q[1]};
};
const segD = (c: Cam3, a: V3, b: V3) => (proj(c, a)[2] + proj(c, b)[2]) / 2;

// ---------------- tower mast ----------------
const BAY = 7.1;
export const Mast: React.FC<{c: Cam3; l: Light; top?: number}> = ({c, l, top = TOWER_H}) => {
  const C = LIGHTS[l];
  const w = Math.max(1, c.z * 0.55);
  const corners: [number, number][] = [[-TW, -TW], [TW, -TW], [TW, TW], [-TW, TW]];
  const faces = [0, 1, 2, 3].map((i) => {
    const a = corners[i], b = corners[(i + 1) % 4];
    const mid = proj(c, [(a[0] + b[0]) / 2, 50, (a[1] + b[1]) / 2]);
    return {a, b, d: mid[2]};
  });
  const centre = proj(c, [0, 50, 0])[2];
  const nb = Math.floor(top / BAY);
  const faceLines = (f: (typeof faces)[number], front: boolean) => {
    const out: React.ReactNode[] = [];
    const col = front ? C.mast : C.mastBack;
    const sw = front ? w : w * 0.7;
    for (let i = 0; i < nb; i++) {
      const y0 = i * BAY, y1 = y0 + BAY;
      const A0: V3 = [f.a[0], y0, f.a[1]], B0: V3 = [f.b[0], y0, f.b[1]], A1: V3 = [f.a[0], y1, f.a[1]], B1: V3 = [f.b[0], y1, f.b[1]];
      const M: V3 = i % 2 === 0 ? [(f.a[0] + f.b[0]) / 2, y1, (f.a[1] + f.b[1]) / 2] : [(f.a[0] + f.b[0]) / 2, y0, (f.a[1] + f.b[1]) / 2];
      const h = seg(c, A1, B1);
      out.push(<line key={`h${i}`} {...h} stroke={col} strokeWidth={sw * 1.0} />);
      // Pad 2 chevron bracing (V / inverted V alternating per bay), heavy members
      const d1 = i % 2 === 0 ? seg(c, A0, M) : seg(c, A1, M), d2 = i % 2 === 0 ? seg(c, B0, M) : seg(c, B1, M);
      const deep = front && c.z > 7;
      for (const [k, d] of [['d', d1], ['e', d2]] as const) {
        out.push(<line key={`${k}${i}`} {...d} stroke={deep ? C.armLo : col} strokeWidth={sw * (deep ? 1.25 : 0.95)} />);
        if (deep) out.push(<line key={`${k}h${i}`} {...d} stroke={C.mastBack} strokeWidth={sw * 0.55} />);
      }
      if (front && c.z > 6) {
        const m = proj(c, M);
        out.push(<circle key={`g${i}`} cx={m[0]} cy={m[1]} r={c.z * 0.7} fill={col} />);
      }
    }
    return out;
  };
  const legs = corners.map((p, i) => ({...seg(c, [p[0], 0, p[1]], [p[0], top, p[1]]), d: segD(c, [p[0], 0, p[1]], [p[0], top, p[1]]), i}));
  return (
    <g strokeLinecap="round">
      {faces.filter((f) => f.d < centre).map((f, i) => <g key={`bf${i}`}>{faceLines(f, false)}</g>)}
      {legs.sort((m, n) => m.d - n.d).map((g) => (
        <line key={g.i} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke={C.mast} strokeWidth={w * 2.1} />
      ))}
      {faces.filter((f) => f.d >= centre).map((f, i) => <g key={`ff${i}`}>{faceLines(f, true)}</g>)}
      {/* service platforms */}
      {[38, 76, 104, 128].filter((y) => y < top).map((y, i) => {
        const ps = ([[-TW - 1.6, -TW - 1.6], [TW + 1.6, -TW - 1.6], [TW + 1.6, TW + 1.6], [-TW - 1.6, TW + 1.6]] as [number, number][]).map(([x, z]) => proj(c, [x, y, z]));
        return <polygon key={i} points={poly(ps)} fill={C.mastBack} stroke={C.mast} strokeWidth={w * 0.8} opacity={0.9} />;
      })}
      {/* top: crane boom stub and lightning mast */}
      {top >= TOWER_H ? (
        <g>
          <line {...seg(c, [0, top, 0], [0, top + 12, 0])} stroke={C.mast} strokeWidth={w * 1.2} />
          <line {...seg(c, [-TW, top, -TW], [TW, top + 4, TW])} stroke={C.mast} strokeWidth={w * 0.8} />
        </g>
      ) : null}
    </g>
  );
};

// ---------------- carriage and arms ----------------
export type ArmState = {carY: number; open: number; len?: number; flex?: number};

const armFrame = (s: ArmState, side: 1 | -1) => {
  const b = (s.open * side) * D;
  const piv: V3 = [TW + 1.4, s.carY, side * ARM_Z];
  const dir: V3 = [Math.cos(b), 0, Math.sin(b)];
  const nrm: V3 = [-Math.sin(b), 0, Math.cos(b)]; // horizontal normal (toward +Z side for the near arm)
  return {piv, dir, nrm};
};

/** Point on an arm: u = 0..1 along, v = vertical offset (m), w = sideways offset (m) toward the arm's own outside. */
export const armPt = (s: ArmState, side: 1 | -1, u: number, v: number, w: number): V3 => {
  const {piv, dir, nrm} = armFrame(s, side);
  const L = (s.len ?? ARM_LEN) * u;
  const sag = (s.flex ?? 0) * u * u;
  return [piv[0] + dir[0] * L + nrm[0] * w * side, piv[1] + v - sag, piv[2] + dir[2] * L + nrm[2] * w * side];
};
/** Rail-top height (world Y) above the carriage centre. */
export const RAIL_DY = 2.6;

export const Arm: React.FC<{c: Cam3; s: ArmState; side: 1 | -1; l: Light; hiRail?: number; hiTruss?: number; load?: number}> = ({c, s, side, l, hiRail = 0, hiTruss = 0, load = -1}) => {
  const C = LIGHTS[l];
  const w = Math.max(1, c.z * 0.5);
  const depth = (u: number) => 6.6 - 2.4 * u; // truss depth tapers toward the tip
  const N = 9;
  // two truss planes: inner (w = -1.1, faces the vehicle) and outer (w = +1.1)
  const planes = [-1.5, 1.5].map((ww) => {
    const top = Array.from({length: N + 1}, (_, i) => armPt(s, side, i / N, RAIL_DY - 0.6, ww));
    const bot = Array.from({length: N + 1}, (_, i) => armPt(s, side, i / N, RAIL_DY - 0.6 - depth(i / N), ww));
    return {ww, top, bot, d: proj(c, top[4])[2]};
  }).sort((a, b) => a.d - b.d);
  const P = (v: V3) => proj(c, v);
  const hi = '#ffc93c';
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {planes.map((pl, k) => {
        const front = k === 1;
        const col = front ? C.arm : C.armLo;
        const els: React.ReactNode[] = [];
        // web panel (semi-solid plate behind the members)
        els.push(<polygon key="web" points={poly([...pl.top.map(P), ...pl.bot.slice().reverse().map(P)])} fill={front ? C.armHi : C.armLo} opacity={front ? 0.28 : 0.4} />);
        els.push(<polyline key="tc" points={poly(pl.top.map(P))} fill="none" stroke={col} strokeWidth={w * 1.6} />);
        els.push(<polyline key="bc" points={poly(pl.bot.map(P))} fill="none" stroke={col} strokeWidth={w * 1.6} />);
        for (let i = 0; i <= N; i++) {
          const a = P(pl.top[i]), b = P(pl.bot[i]);
          els.push(<line key={`v${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={col} strokeWidth={w * 0.9} />);
          if (i < N) {
            const q = i % 2 === 0 ? [P(pl.top[i]), P(pl.bot[i + 1])] : [P(pl.bot[i]), P(pl.top[i + 1])];
            const lit = load >= 0 ? Math.max(0, 1 - Math.abs(load * N - (N - i - 0.5)) / 1.6) * hiTruss : hiTruss;
            els.push(<line key={`d${i}`} x1={q[0][0]} y1={q[0][1]} x2={q[1][0]} y2={q[1][1]} stroke={lit > 0.02 ? hi : col} strokeOpacity={lit > 0.02 ? Math.min(1, 0.4 + lit) : 1} strokeWidth={w * (lit > 0.02 ? 1.4 : 0.9)} />);
          }
        }
        return <g key={k}>{els}</g>;
      })}
      {/* top deck and receiving rail on the inner edge */}
      <polygon points={poly([armPt(s, side, 0, RAIL_DY - 0.6, -1.7), armPt(s, side, 1, RAIL_DY - 0.6, -1.7), armPt(s, side, 1, RAIL_DY - 0.6, 1.7), armPt(s, side, 0, RAIL_DY - 0.6, 1.7)].map(P))} fill={C.armHi} stroke={C.arm} strokeWidth={w * 0.8} />
      <polyline points={poly([armPt(s, side, 0.12, RAIL_DY, -1.3), armPt(s, side, 0.96, RAIL_DY, -1.3)].map(P))} fill="none" stroke={C.armLo} strokeWidth={w * 3.6} />
      <polyline points={poly([armPt(s, side, 0.12, RAIL_DY, -1.3), armPt(s, side, 0.96, RAIL_DY, -1.3)].map(P))} fill="none" stroke={C.rail} strokeWidth={w * 2.0} />
      {hiRail > 0.01 ? <polyline points={poly([armPt(s, side, 0.12, RAIL_DY, -1.3), armPt(s, side, 0.96, RAIL_DY, -1.3)].map(P))} fill="none" stroke={hi} strokeWidth={w * 1.2} strokeOpacity={0.85 * hiRail} /> : null}
      {/* tip bumper */}
      <polygon points={poly([armPt(s, side, 1, RAIL_DY, -1.3), armPt(s, side, 1, RAIL_DY, 1.3), armPt(s, side, 1, RAIL_DY - 0.6 - depth(1), 1.3), armPt(s, side, 1, RAIL_DY - 0.6 - depth(1), -1.3)].map(P))} fill={C.arm} stroke={C.armLo} strokeWidth={w * 0.8} />
    </g>
  );
};

/** Carriage: box frame riding on the mast, with the two arm pivots on its +X face. */
export const Carriage: React.FC<{c: Cam3; s: ArmState; l: Light; hi?: number}> = ({c, s, l, hi = 0}) => {
  const C = LIGHTS[l];
  const w = Math.max(1, c.z * 0.5);
  const y0 = s.carY - 8, y1 = s.carY + 4;
  const e = TW + 1.6;
  const box = (y: number): V3[] => [[-e, y, -e], [e, y, -e], [e, y, e], [-e, y, e]];
  const P = (v: V3) => proj(c, v);
  const faces: V3[][] = [
    [[e, y0, -e], [e, y0, e], [e, y1, e], [e, y1, -e]],
    [[-e, y0, e], [e, y0, e], [e, y1, e], [-e, y1, e]],
  ];
  return (
    <g strokeLinejoin="round">
      {faces.map((f, i) => (
        <polygon key={i} points={poly(f.map(P))} fill={hi > 0 ? '#5a5030' : C.armHi} stroke={hi > 0 ? '#ffc93c' : C.arm} strokeWidth={w * (hi > 0 ? 1.8 : 1.2)} opacity={0.92} />
      ))}
      {faces.map((f, i) => {
        const p = f.map(P);
        return (
          <g key={`x${i}`} stroke={C.armLo} strokeWidth={w * 0.8}>
            <line x1={p[0][0]} y1={p[0][1]} x2={p[2][0]} y2={p[2][1]} />
            <line x1={p[1][0]} y1={p[1][1]} x2={p[3][0]} y2={p[3][1]} />
          </g>
        );
      })}
      <polygon points={poly(box(y1).map(P))} fill={C.arm} opacity={0.9} />
      {/* pivot drums */}
      {[1, -1].map((sd) => {
        const a = P([TW + 1.4, y0, sd * ARM_Z]), b = P([TW + 1.4, y1 + 1, sd * ARM_Z]);
        return <line key={sd} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.armLo} strokeWidth={w * 4} strokeLinecap="round" />;
      })}
    </g>
  );
};

/** Quick-disconnect arm (ship propellant/umbilical arm): a different, smaller arm higher on the tower, here retracted. */
export const QDArm: React.FC<{c: Cam3; l: Light}> = ({c, l}) => {
  const C = LIGHTS[l];
  const w = Math.max(1, c.z * 0.5);
  const y = 118;
  const pts3: V3[] = [[TW, y, -TW], [TW + 3, y, -TW - 8], [TW + 3, y - 2.4, -TW - 8], [TW, y - 2.4, -TW]];
  return <polygon points={poly(pts3.map((p) => proj(c, p)))} fill={C.armLo} stroke={C.mast} strokeWidth={w} />;
};

// ---------------- ground, foundations, mount, tank farm (V4: one perspective, everything anchored at Y = 0) ----------------
export const MOUNT_TOP = 19;
/** Sunlight direction for cast shadows: ground offset per metre of height (sun high in the south-west, behind-left). */
export const SUN: [number, number] = [0.5, 0.36];
/** Shoreline: the Gulf lies beyond Z < SHORE (Starbase pad is a few hundred metres from the beach). */
export const SHORE = -360;

const shade = (h: string, k: number) => {
  const n = parseInt(h.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

/** Vertical cylinder in perspective: side from projected silhouette edges, top as a projected ring. */
const Cyl: React.FC<{c: Cam3; x: number; z: number; r: number; y0: number; y1: number; fill: string; hi: string; stroke: string}> = ({c, x, z, r, y0, y1, fill, hi, stroke}) => {
  const ring = (y: number) => Array.from({length: 24}, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return [x + Math.cos(a) * r, y, z + Math.sin(a) * r] as V3;
  });
  const top = projPoly(c, ring(y1)), bot = projPoly(c, ring(y0));
  if (top.length < 3 || bot.length < 3) return null;
  const xs = (pp: number[][]) => [Math.min(...pp.map((p) => p[0])), Math.max(...pp.map((p) => p[0]))];
  const [ta, tb] = xs(top), [ba, bb] = xs(bot);
  const yAt = (pp: number[][], X: number) => pp.reduce((acc, p) => (Math.abs(p[0] - X) < Math.abs(acc[0] - X) ? p : acc))[1];
  const lowest = bot.reduce((m, p) => Math.max(m, p[1]), -1e9);
  const lw = Math.max(0.8, scaleAt(c, [x, (y0 + y1) / 2, z]) * 0.08);
  return (
    <g>
      <path d={`M${ta} ${yAt(top, ta)} L${tb} ${yAt(top, tb)} L${bb} ${yAt(bot, bb)} Q ${(ba + bb) / 2} ${lowest + (lowest - yAt(bot, bb)) * 0.05} ${ba} ${yAt(bot, ba)} Z`} fill={fill} stroke={stroke} strokeWidth={lw} />
      <path d={`M${ta + (tb - ta) * 0.16} ${yAt(top, ta + (tb - ta) * 0.16)} L${ba + (bb - ba) * 0.16} ${yAt(bot, ba + (bb - ba) * 0.16)} L${ba + (bb - ba) * 0.3} ${yAt(bot, ba + (bb - ba) * 0.3)} L${ta + (tb - ta) * 0.3} ${yAt(top, ta + (tb - ta) * 0.3)} Z`} fill={hi} opacity={0.55} />
      <path d={`M${ta + (tb - ta) * 0.72} ${yAt(top, ta + (tb - ta) * 0.72)} L${ba + (bb - ba) * 0.72} ${yAt(bot, ba + (bb - ba) * 0.72)} L${bb} ${yAt(bot, bb)} L${tb} ${yAt(top, tb)} Z`} fill="#000" opacity={0.12} />
      <polygon points={poly(top)} fill={hi} stroke={stroke} strokeWidth={lw} />
    </g>
  );
};

/** A box (axis-aligned) drawn by its visible faces. */
const Box: React.FC<{c: Cam3; x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; fill: string; stroke: string}> = ({c, x0, x1, y0, y1, z0, z1, fill, stroke}) => {
  const eye = eyeOf(c);
  const faces: {pts: V3[]; k: number; vis: boolean}[] = [
    {pts: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], k: 1.08, vis: eye[1] > y1},
    {pts: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], k: 0.92, vis: eye[2] > z1},
    {pts: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], k: 0.8, vis: eye[2] < z0},
    {pts: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], k: 0.85, vis: eye[0] > x1},
    {pts: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], k: 0.75, vis: eye[0] < x0},
  ];
  return (
    <g strokeLinejoin="round">
      {faces.filter((f) => f.vis).map((f, i) => {
        const pp = projPoly(c, f.pts);
        return pp.length > 2 ? <polygon key={i} points={poly(pp)} fill={shade(fill, f.k)} stroke={stroke} strokeWidth={0.8} /> : null;
      })}
    </g>
  );
};

/** Cast shadow of a vertical prism (footprint polygon, height h) on the ground. */
const castShadow = (foot: [number, number][], h: number): V3[] => {
  const pts = [...foot.map(([x, z]) => [x, z] as [number, number]), ...foot.map(([x, z]) => [x + SUN[0] * h, z + SUN[1] * h] as [number, number])];
  // convex hull (monotone chain)
  const s = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: number[][] = [], up: number[][] = [];
  for (const p of s) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of s.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)].map(([x, z]) => [x, 0.03, z] as V3);
};
const circle = (x: number, z: number, r: number, n = 16): [number, number][] => Array.from({length: n}, (_, i) => [x + Math.cos((i / n) * Math.PI * 2) * r, z + Math.sin((i / n) * Math.PI * 2) * r]);

// The pad complex (plan, metres): irregular hardstand around the tower and mount, apron to the tank farm, roads.
const HARDSTAND: [number, number][] = [[-118, -84], [-30, -92], [46, -70], [70, -34], [66, 30], [40, 56], [-8, 62], [-60, 50], [-118, 34]];
const ROADS: [number, number][][] = [
  [[-118, 22], [-1600, 40], [-1600, 52], [-118, 32]],       // access road inland along the coast
  [[30, 52], [52, 640], [62, 640], [40, 52]],               // service road toward the flats
  [[-40, -88], [-60, -230], [-52, -232], [-32, -88]],       // track toward the beach
];
const TRENCH: [number, number][] = [[VX - 5, -5], [VX + 46, -9], [VX + 46, 9], [VX - 5, 5]];
const scatter = (n: number, seed: number) => Array.from({length: n}, (_, i) => {
  const x = (rnd(i, seed) - 0.5) * 5000, z = SHORE + 15 + Math.pow(rnd(i, seed + 1), 1.4) * 3200;
  return {x, z, rx: 20 + rnd(i, seed + 2) * 180, rz: 10 + rnd(i, seed + 3) * 70, a: rnd(i, seed + 4) * Math.PI, lag: rnd(i, seed + 5) < 0.3, i};
}).filter((p) => Math.hypot(p.x + 20, p.z + 10) > 170);
const PATCHES = scatter(110, 61);

/** Ground: coastal flats to a real horizon, the Gulf beyond the beach, hardstand flush in the terrain, roads, trench,
 *  marsh and lagoons, scrub tufts near the camera, and the long shadows of the tall structures. */
export const Ground: React.FC<{c: Cam3; l: Light; shadows?: {foot: [number, number][]; h: number; k?: number}[]}> = ({c, l, shadows = []}) => {
  const C = LIGHTS[l];
  const hz = horizonY(c);
  if (hz > 1300) return null;
  const big = 60000;
  const G = (pts: [number, number][], y = 0) => projPoly(c, pts.map(([x, z]) => [x, y, z] as V3));
  const ellipse = (p: (typeof PATCHES)[number]) => G(Array.from({length: 14}, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return [p.x + Math.cos(a) * p.rx * Math.cos(p.a) - Math.sin(a) * p.rz * Math.sin(p.a), p.z + Math.cos(a) * p.rx * Math.sin(p.a) + Math.sin(a) * p.rz * Math.cos(p.a)] as [number, number];
  }), 0.01);
  const eye = eyeOf(c);
  // scrub tufts on a fixed world grid around the eye (anchored, not camera-relative)
  const tufts: React.ReactNode[] = [];
  const cell = 16;
  const gx0 = Math.floor((eye[0] - 260) / cell), gz0 = Math.floor((eye[2] - 260) / cell);
  for (let gx = gx0; gx < gx0 + 33; gx++) for (let gz = gz0; gz < gz0 + 33; gz++) {
    const k = gx * 7919 + gz * 104729;
    const x = gx * cell + rnd(k, 3) * cell, z = gz * cell + rnd(k, 4) * cell;
    if (z < SHORE + 10 || inPad(x, z) || rnd(k, 5) < 0.35) continue;
    const q = toCam(c, [x, 0, z]);
    if (q[2] < 22 || q[2] > 280) continue;
    const p = proj(c, [x, 0, z]);
    if (p[0] < -80 || p[0] > 2000 || p[1] < hz - 2 || p[1] > 1150) continue;
    const s = scaleAt(c, [x, 0, z]) * (0.7 + rnd(k, 6) * 1.1);
    const col = rnd(k, 7) < 0.5 ? C.marsh : shade(C.marsh, 0.78);
    tufts.push(
      <g key={k} fill={col} opacity={0.92}>
        <ellipse cx={p[0]} cy={p[1] - s * 0.22} rx={s} ry={s * 0.32} />
        <ellipse cx={p[0] - s * 0.7} cy={p[1] - s * 0.12} rx={s * 0.55} ry={s * 0.22} />
        <ellipse cx={p[0] + s * 0.8} cy={p[1] - s * 0.1} rx={s * 0.45} ry={s * 0.18} />
      </g>,
    );
  }
  return (
    <g>
      {/* land to the horizon, the sea beyond the beach */}
      <polygon points={poly(G([[-big, SHORE], [big, SHORE], [big, big], [-big, big]]))} fill={C.sand} />
      <polygon points={poly(G([[-big, -big], [big, -big], [big, SHORE - 24], [-big, SHORE - 24]]))} fill={C.sea} />
      <polygon points={poly(G([[-big, SHORE - 24], [big, SHORE - 24], [big, SHORE], [-big, SHORE]], 0.02))} fill={shade(C.sand, 1.12)} />
      {[-60, -140, -260, -420, -700, -1100].map((dz, i) => <polygon key={`w${i}`} points={poly(G([[-big, SHORE - 24 + dz], [big, SHORE - 24 + dz], [big, SHORE - 24 + dz - 6 - i * 4], [-big, SHORE - 24 + dz - 6 - i * 4]], 0.02))} fill="#e8f2f8" opacity={0.16} />)}
      {[-34, -52, -80].map((dz, i) => <polygon key={`s${i}`} points={poly(G([[-big, SHORE + dz], [big, SHORE + dz], [big, SHORE + dz - 2.5], [-big, SHORE + dz - 2.5]], 0.03))} fill="#ffffff" opacity={0.35 - i * 0.08} />)}
      {PATCHES.map((p) => {
        const pp = ellipse(p);
        return pp.length > 2 ? <polygon key={p.i} points={poly(pp)} fill={p.lag ? C.lagoon : C.marsh} opacity={p.lag ? 0.9 : 0.55} /> : null;
      })}
      {ROADS.map((r, i) => <polygon key={`r${i}`} points={poly(G(r, 0.04))} fill={C.road} />)}
      <polygon points={poly(G(HARDSTAND, 0.05))} fill={C.concrete} stroke={shade(C.concrete, 0.85)} strokeWidth={1.2} />
      {[[-118, -20, 66, -10], [-60, -88, -56, 54], [-10, -90, -6, 60]].map(([x0, z0, x1, z1], i) => (
        <polyline key={`j${i}`} points={poly(projPoly(c, [[x0, 0.06, z0], [x1, 0.06, z1]]).slice(0, 2))} stroke={shade(C.concrete, 0.86)} strokeWidth={1} fill="none" />
      ))}
      <polygon points={poly(G(TRENCH, 0.06))} fill="#3b3e42" />
      {shadows.map((s, i) => <polygon key={`sh${i}`} points={poly(projPoly(c, castShadow(s.foot, s.h)))} fill="#1d2228" opacity={0.22 * (s.k ?? 1)} />)}
      {tufts}
      {/* atmospheric haze toward the horizon */}
      <rect x={-50} y={hz - 22} width={2020} height={34} fill={C.haze} />
    </g>
  );
};
const inPad = (x: number, z: number) => x > -125 && x < 75 && z > -95 && z < 66;

/** Horizontal tank lying along X. */
const HTank: React.FC<{c: Cam3; x0: number; x1: number; z: number; r: number; fill: string; hi: string; stroke: string}> = ({c, x0, x1, z, r, fill, hi, stroke}) => {
  const a = proj(c, [x0, r + 1, z]), b = proj(c, [x1, r + 1, z]);
  const wa = 2 * r * scaleAt(c, [x0, r, z]), wb = 2 * r * scaleAt(c, [x1, r, z]);
  const n = (b[1] - a[1]) / (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1), m = -(b[0] - a[0]) / (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1);
  const q = (p: V3, w: number, s: number) => `${p[0] + n * w * s / 2},${p[1] + m * w * s / 2}`;
  return (
    <g>
      <polygon points={`${q(a, wa, 1)} ${q(b, wb, 1)} ${q(b, wb, -1)} ${q(a, wa, -1)}`} fill={fill} stroke={stroke} strokeWidth={1} />
      <polygon points={`${q(a, wa, 0.7)} ${q(b, wb, 0.7)} ${q(b, wb, 0.45)} ${q(a, wa, 0.45)}`} fill={hi} opacity={0.7} />
      <ellipse cx={a[0]} cy={a[1]} rx={wa * 0.18} ry={wa / 2} fill={shade(fill, 0.9)} stroke={stroke} strokeWidth={1} />
    </g>
  );
};

// fixed positions of the farm (plan) — used for drawing and for the cast shadows
const VT: [number, number, number, number][] = [[-62, -46, 7.5, 34], [-82, -40, 7.5, 34], [-40, -62, 3.2, 46]];
const HT: [number, number][] = [[-30, -28], [-30, -20], [-30, -12]];

/** Propellant farm as seen in the Pad 2 footage: two large vertical tanks, a tall slender tank, a bank of horizontal
 *  tanks on saddles, a pipe rack to the mount. Positions fixed for every shot. */
export const TankFarm: React.FC<{c: Cam3; l: Light}> = ({c, l}) => {
  const C = LIGHTS[l];
  const items: {d: number; el: React.ReactNode}[] = [];
  VT.forEach(([x, z, r, h], i) => items.push({d: proj(c, [x, 10, z])[2], el: <Cyl key={`v${i}`} c={c} x={x} z={z} r={r} y0={0} y1={h} fill={C.tank} hi={C.tankHi} stroke={C.mast} />}));
  HT.forEach(([z], i) => items.push({d: proj(c, [-60, 3, z])[2], el: <HTank key={`h${i}`} c={c} x0={-96} x1={-30} z={z} r={3.0} fill={C.tank} hi={C.tankHi} stroke={C.mast} />}));
  // service buildings
  [[-112, -78, -88, -64, 9], [-104, 6, -90, 24, 6], [44, 34, 58, 48, 5]].forEach(([x0, z0, x1, z1, h], i) =>
    items.push({d: proj(c, [(x0 + x1) / 2, h / 2, (z0 + z1) / 2])[2], el: <Box key={`bd${i}`} c={c} x0={x0} x1={x1} y0={0} y1={h} z0={z0} z1={z1} fill={i === 0 ? '#c9ccd0' : '#b9bec4'} stroke="#7d848c" />}));
  // pipe rack from the farm to the mount, on bents every 12 m
  const rack: React.ReactNode[] = [];
  for (let x = -28; x <= VX - 10; x += 12) {
    const a = proj(c, [x, 0, -14]), b = proj(c, [x, 4, -14]);
    rack.push(<line key={`b${x}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.armLo} strokeWidth={Math.max(1, scaleAt(c, [x, 2, -14]) * 0.4)} />);
  }
  const p0 = proj(c, [-30, 4, -14]), p1 = proj(c, [VX - 10, 4, -14]);
  rack.push(<line key="pipe" x1={p0[0]} y1={p0[1]} x2={p1[0]} y2={p1[1]} stroke={C.tank} strokeWidth={Math.max(1.2, scaleAt(c, [0, 4, -14]) * 1.1)} strokeLinecap="round" />);
  items.push({d: proj(c, [0, 2, -14])[2], el: <g key="rack">{rack}</g>});
  return <g>{items.sort((p, q) => p.d - q.d).map((p) => p.el)}</g>;
};
/** Shadow casters of the fixed site (tower, mount, tanks), for Ground. */
export const SITE_SHADOWS = (mastTop = TOWER_H) => [
  {foot: [[-TW, -TW], [TW, -TW], [TW, TW], [-TW, TW]] as [number, number][], h: mastTop, k: 0.75},
  {foot: circle(VX, 0, 9.5), h: MOUNT_TOP, k: 0.8},
  ...VT.map(([x, z, r, h]) => ({foot: circle(x, z, r), h, k: 1})),
];

/** Tower foundation: a concrete plinth the mast legs stand in. */
export const Foundation: React.FC<{c: Cam3; l: Light}> = ({c, l}) => {
  const C = LIGHTS[l];
  return <Box c={c} x0={-TW - 3} x1={TW + 3} y0={0} y1={2.4} z0={-TW - 3} z1={TW + 3} fill={C.concrete} stroke={shade(C.concrete, 0.7)} />;
};

/** Pad 2-style launch mount (footage 06): a launch table raised on angled steel legs over the flame trench, legs on
 *  concrete footings. The vehicle stands on the table ring at MOUNT_TOP. */
export const Mount: React.FC<{c: Cam3; l: Light}> = ({c, l}) => {
  const C = LIGHTS[l];
  const P = (v: V3) => proj(c, v);
  const legs = Array.from({length: 6}, (_, i) => (i / 6) * Math.PI * 2 + 0.3).map((a) => ({
    top: [VX + Math.cos(a) * 7.5, MOUNT_TOP - 3, Math.sin(a) * 7.5] as V3,
    bot: [VX + Math.cos(a) * 12, 1.2, Math.sin(a) * 12] as V3,
    a,
  }));
  const ld = legs.map((g) => ({...g, d: proj(c, g.top)[2]})).sort((p, q) => p.d - q.d);
  const cd = proj(c, [VX, MOUNT_TOP - 2, 0])[2];
  const legW = (g: (typeof legs)[number]) => Math.max(1.2, scaleAt(c, g.top) * 1.3);
  const footing = (g: (typeof legs)[number], i: number) => (
    <Box key={`ft${i}`} c={c} x0={g.bot[0] - 1.6} x1={g.bot[0] + 1.6} y0={0} y1={1.2} z0={g.bot[2] - 1.6} z1={g.bot[2] + 1.6} fill={C.concrete} stroke={shade(C.concrete, 0.7)} />
  );
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {ld.filter((g) => g.d < cd).map((g, i) => <g key={`b${i}`}>{footing(g, i)}<line x1={P(g.top)[0]} y1={P(g.top)[1]} x2={P(g.bot)[0]} y2={P(g.bot)[1]} stroke={C.armLo} strokeWidth={legW(g)} /></g>)}
      <Cyl c={c} x={VX} z={0} r={9.5} y0={MOUNT_TOP - 4} y1={MOUNT_TOP} fill={C.arm} hi={C.armHi} stroke={C.armLo} />
      <Cyl c={c} x={VX} z={0} r={6.2} y0={MOUNT_TOP} y1={MOUNT_TOP + 0.6} fill="#24282d" hi="#30353b" stroke={C.armLo} />
      {ld.filter((g) => g.d >= cd).map((g, i) => <g key={`f${i}`}>{footing(g, i + 6)}<line x1={P(g.top)[0]} y1={P(g.top)[1]} x2={P(g.bot)[0]} y2={P(g.bot)[1]} stroke={C.arm} strokeWidth={legW(g)} /></g>)}
    </g>
  );
};

/** Everything except the vehicle, in correct layering around a vehicle slot. */
export const CatchSet: React.FC<{
  c: Cam3; l: Light; s: ArmState; vehicle?: React.ReactNode; hiRail?: number; hiTruss?: number; load?: number; hiCarriage?: number;
  mount?: boolean; farm?: boolean; ground?: boolean; mastTop?: number; fore?: React.ReactNode;
}> = ({c, l, s, vehicle, hiRail = 0, hiTruss = 0, load = -1, hiCarriage = 0, mount = true, farm = true, ground = true, mastTop, fore}) => {
  const vd = proj(c, [VX, s.carY, 0])[2];
  const arms = ([1, -1] as const).map((side) => ({side, d: proj(c, armPt(s, side, 0.6, 0, 0))[2]}));
  const behind = arms.filter((a) => a.d < vd), front = arms.filter((a) => a.d >= vd);
  return (
    <g>
      {ground ? <Ground c={c} l={l} shadows={SITE_SHADOWS(mastTop)} /> : null}
      {farm && proj(c, [-60, 10, -40])[2] < proj(c, [0, 10, 0])[2] ? <TankFarm c={c} l={l} /> : null}
      <Foundation c={c} l={l} />
      <Mast c={c} l={l} top={mastTop} />
      {farm && proj(c, [-60, 10, -40])[2] >= proj(c, [0, 10, 0])[2] ? <TankFarm c={c} l={l} /> : null}
      <QDArm c={c} l={l} />
      {mount ? <Mount c={c} l={l} /> : null}
      {behind.map((a) => <Arm key={a.side} c={c} s={s} side={a.side} l={l} hiRail={hiRail} hiTruss={hiTruss} load={load} />)}
      <Carriage c={c} s={s} l={l} hi={hiCarriage} />
      {vehicle}
      {front.map((a) => <Arm key={a.side} c={c} s={s} side={a.side} l={l} hiRail={hiRail} hiTruss={hiTruss} load={load} />)}
      {fore}
    </g>
  );
};

/** A support feature (pin / fitting) resting on, or hovering over, the near rail: drawn after the near arm. */
export const PinMark: React.FC<{c: Cam3; s: ArmState; above: number; side?: 1 | -1; dx?: number; hi?: number; size?: number}> = ({c, s, above, side = 1, dx = 0, hi = 0, size = 1.2}) => {
  const zR = side * (ARM_Z - 1.3);
  const y0 = s.carY + RAIL_DY + above;
  const q = ([[VX + dx - size / 2, y0, zR], [VX + dx + size / 2, y0, zR], [VX + dx + size / 2, y0 + size * 0.85, zR], [VX + dx - size / 2, y0 + size * 0.85, zR]] as V3[]).map((p) => proj(c, p));
  const sh = proj(c, [VX + dx, s.carY + RAIL_DY, zR]);
  const contact = Math.max(0, 1 - Math.abs(above) / 1.5);
  return (
    <g>
      {contact > 0 ? <ellipse cx={sh[0]} cy={sh[1] + 1} rx={size * c.z * (0.9 + 0.3 * contact)} ry={Math.max(1.5, c.z * 0.18)} fill="#0e1114" opacity={0.55 * contact} /> : null}
      <polygon points={poly(q)} fill={hi > 0 ? '#e9b949' : '#8a949e'} stroke="#1c232b" strokeWidth={Math.max(1.5, c.z * 0.12)} strokeLinejoin="round" />
    </g>
  );
};

/** Place a vehicle (drawn in its local metre frame) with its base centre at world point p, tilted by `tilt` deg in screen. */
export const Place: React.FC<{c: Cam3; p: V3; tilt?: number; children: React.ReactNode}> = ({c, p, tilt = 0, children}) => {
  const s = proj(c, p);
  const k = scaleAt(c, p);
  const ky = Math.cos(c.pitch * D);
  return <g transform={`translate(${s[0]} ${s[1]}) rotate(${tilt + (c.roll ?? 0)}) scale(${k} ${k * ky})`}>{children}</g>;
};

/** Vehicle azimuth for a ship/booster whose heat-shield (or reference) side faces world heading h (deg from +Z toward +X). */
export const azFor = (c: Cam3, h: number) => -c.yaw - h;
