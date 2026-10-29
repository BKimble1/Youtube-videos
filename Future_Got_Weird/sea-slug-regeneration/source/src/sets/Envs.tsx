// The three environments (bright lab dish, dark-teal anatomy space, natural algae seabed), the microscopic tissue
// layer, and the props. World-space pieces are drawn through the shot camera so they move with it in parallax.
import React from 'react';
import {H, W, clamp, lerp, mix, rng} from '../lib';
import {P2, P3, Proj, polyPath, smoothPath} from '../geo';

const circle = (pr: Proj, cx: number, cy: number, r: number, z = 0, n = 96): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < n; i++) out.push(pr([cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r, z]));
  return out;
};
const quad = (pr: Proj, x0: number, y0: number, x1: number, y1: number, z = 0) => polyPath([pr([x0, y0, z]), pr([x1, y0, z]), pr([x1, y1, z]), pr([x0, y1, z])]);

// ---------------------------------------------------------------- lab: a shallow glass dish on a pale bench
export const DISH = {x: 30, y: 40, r: 128};
export const LabEnv: React.FC<{pr: Proj; t: number}> = ({pr, t}) => {
  const R = rng(9);
  const blobs = Array.from({length: 9}, () => ({x: lerp(-160, 150, R()), y: lerp(-200, 220, R()), r: lerp(18, 46, R()), ph: R() * 6}));
  return (
    <g>
      <rect width={W} height={H} fill="#D5DEE1" />
      <path d={quad(pr, -1400, -1400, 1400, 1400)} fill="#D9E1E4" />
      <path d={smoothPath(circle(pr, DISH.x, DISH.y, DISH.r + 6, 0))} fill="#C7D3D7" opacity={0.6} filter="url(#blur10)" />
      <path d={smoothPath(circle(pr, DISH.x, DISH.y, DISH.r, 0))} fill="#E8EFF1" />
      {/* soft caustic light in the water */}
      <g filter="url(#blur20)" opacity={0.22}>
        {blobs.map((b, i) => {
          const c = pr([b.x + Math.sin(t * 0.35 + b.ph) * 10, b.y + Math.cos(t * 0.3 + b.ph) * 8, 0]);
          const s = pr.scaleAt([b.x, b.y, 0]);
          return <ellipse key={i} cx={c[0]} cy={c[1]} rx={b.r * s} ry={b.r * s * 0.7} fill="#FFFFFF" />;
        })}
      </g>
      {/* the dish wall and rim */}
      <path d={smoothPath(circle(pr, DISH.x, DISH.y, DISH.r, 14))} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.75} />
      <path d={smoothPath(circle(pr, DISH.x, DISH.y, DISH.r, 0))} fill="none" stroke="#AFC2C8" strokeWidth={3} opacity={0.8} />
      <path d={smoothPath(circle(pr, DISH.x, DISH.y, DISH.r - 3, 7))} fill="none" stroke="#C3D4DA" strokeWidth={12} opacity={0.35} />
    </g>
  );
};

// ---------------------------------------------------------------- dark-teal anatomy space
export const TealEnv: React.FC<{pr: Proj; t: number; focus: [number, number]}> = ({pr, t, focus}) => {
  const R = rng(31);
  const motes = Array.from({length: 46}, () => ({x: lerp(-260, 260, R()), y: lerp(-320, 320, R()), z: lerp(10, 140, R()), r: lerp(0.6, 1.8, R()), ph: R() * 6}));
  const pool = circle(pr, focus[0], focus[1], 120, 0, 64);
  return (
    <g>
      <defs>
        <radialGradient id="tealbg" cx="50%" cy="46%" r="75%">
          <stop offset="0" stopColor="#2A6670" />
          <stop offset="0.55" stopColor="#174750" />
          <stop offset="1" stopColor="#0B2A31" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#tealbg)" />
      <path d={smoothPath(pool)} fill="#3C8086" opacity={0.35} filter="url(#blur20)" />
      {motes.map((m, i) => {
        const c = pr([m.x + Math.sin(t * 0.4 + m.ph) * 6, m.y + Math.cos(t * 0.3 + m.ph) * 6, m.z]);
        const s = pr.scaleAt([m.x, m.y, m.z]);
        return <circle key={i} cx={c[0]} cy={c[1]} r={Math.max(0.8, m.r * s * 0.5)} fill="#BFE8E4" opacity={0.18} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------- the natural algae seabed
type Frond = {x: number; y: number; ang: number; len: number; ph: number; branches: number; side: number; tuft: number};
const R4 = rng(515);
// tuft 0 is the one the head feeds on: rooted just ahead of it, its fronds reach back (+y) toward the head
export const TUFTS: {x: number; y: number; n: number; ang: number}[] = [
  {x: -2, y: -36, n: 9, ang: 90},
  {x: -50, y: -14, n: 9, ang: 55},
  {x: 48, y: -4, n: 9, ang: 125},
  {x: -60, y: 70, n: 8, ang: 15},
  {x: 56, y: 84, n: 8, ang: 165},
  {x: -22, y: -112, n: 10, ang: 75},
  {x: 42, y: -104, n: 9, ang: 105},
  {x: -78, y: -74, n: 8, ang: 40},
  {x: 82, y: -62, n: 8, ang: 140},
  {x: -4, y: 158, n: 8, ang: -90},
  {x: -66, y: 176, n: 7, ang: -30},
  {x: 64, y: 196, n: 7, ang: 210},
  {x: -30, y: -190, n: 9, ang: 80},
  {x: 50, y: -200, n: 9, ang: 100},
];
export const FRONDS: Frond[] = [];
TUFTS.forEach((tf, ti) => {
  for (let i = 0; i < tf.n; i++)
    FRONDS.push({x: tf.x + lerp(-6, 6, R4()), y: tf.y + lerp(-6, 6, R4()), ang: tf.ang + lerp(-55, 55, (i + R4()) / tf.n), len: lerp(34, 62, R4()), ph: R4() * 6, branches: 9 + Math.floor(R4() * 5), side: R4() < 0.5 ? 1 : -1, tuft: ti});
});
const ROCKS = (() => {
  const R = rng(88);
  return Array.from({length: 26}, () => ({x: lerp(-330, 330, R()), y: lerp(-420, 420, R()), r: lerp(20, 75, R()), e: lerp(0.5, 0.9, R()), a: R() * Math.PI, light: R() < 0.5}));
})();
const PEBBLES = (() => {
  const R = rng(91);
  return Array.from({length: 40}, () => ({x: lerp(-320, 320, R()), y: lerp(-420, 420, R()), r: lerp(2, 6, R())}));
})();

/** a frond as world-space points: main axis and branchlets; `eat` (0..1) empties its cells from the tip back */
const frondGeo = (fr: Frond, t: number) => {
  const a0 = (fr.ang * Math.PI) / 180 + Math.sin(t * 0.8 + fr.ph) * 0.05;
  const axis: P3[] = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10, a = a0 + fr.side * 0.35 * u * u + Math.sin(t * 1.1 + fr.ph + u * 3) * 0.04 * u;
    const prev = axis[i - 1] ?? [fr.x, fr.y, 0];
    const step = fr.len / 10;
    axis.push(i === 0 ? [fr.x, fr.y, 0] : [prev[0] + Math.cos(a) * step, prev[1] + Math.sin(a) * step, 1.5 + u * 5]);
  }
  return axis;
};
export const frondTip = (i: number, t: number) => frondGeo(FRONDS[i], t)[10];

export const AlgaeEnv: React.FC<{pr: Proj; t: number; eaten: (i: number) => number; dim?: number}> = ({pr, t, eaten}) => {
  const s0 = pr.scaleAt([0, 0, 0]);
  return (
    <g>
      <rect width={W} height={H} fill="#6F9C98" />
      <path d={quad(pr, -1400, -1400, 1400, 1400)} fill="#A7BDB1" />
      {ROCKS.map((r, i) => {
        const pts: P2[] = [];
        for (let k = 0; k < 14; k++) {
          const th = (k / 14) * Math.PI * 2;
          const rr = r.r * (1 + 0.12 * Math.sin(th * 3 + i));
          pts.push(pr([r.x + Math.cos(th + r.a) * rr, r.y + Math.sin(th + r.a) * rr * r.e, 0]));
        }
        return <path key={i} d={smoothPath(pts)} fill={r.light ? '#B8CBBF' : '#93AC9F'} opacity={0.6} />;
      })}
      {PEBBLES.map((p, i) => {
        const c = pr([p.x, p.y, 0]);
        const s = pr.scaleAt([p.x, p.y, 0]);
        return <ellipse key={i} cx={c[0]} cy={c[1]} rx={p.r * s} ry={p.r * s * 0.75} fill="#C9D6CB" stroke="#7D9688" strokeWidth={1.2} />;
      })}
      {/* rippling caustic light */}
      <g opacity={0.28} filter="url(#blur5)">
        {Array.from({length: 14}, (_, i) => {
          const pts: P2[] = [];
          for (let k = 0; k <= 16; k++) {
            const x = -320 + k * 40, y = -420 + i * 62 + Math.sin(k * 0.9 + t * 0.9 + i) * 14 + Math.sin(k * 0.37 - t * 0.6) * 9;
            pts.push(pr([x, y, 0]));
          }
          return <path key={i} d={smoothPath(pts, false)} fill="none" stroke="#F4FFF4" strokeWidth={5 * s0 / 10} />;
        })}
      </g>
      {FRONDS.map((fr, i) => {
        const axis = frondGeo(fr, t);
        const e = eaten(i);
        const col = mix('#4FAE3E', '#D9EBCB', e), dark = mix('#2B6F2A', '#9FBF95', e);
        const sc = pr.scaleAt(axis[5]);
        const branches: React.ReactNode[] = [];
        for (let b = 1; b < fr.branches; b++) {
          const u = b / fr.branches, k = Math.min(9, Math.floor(u * 10));
          const p0 = axis[k], p1 = axis[k + 1];
          const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy);
          const bl = (1 - u * 0.55) * 9;
          for (const sd of [1, -1]) {
            const ang = Math.atan2(dy, dx) + sd * 0.75;
            const q: P3 = [p0[0] + Math.cos(ang) * bl, p0[1] + Math.sin(ang) * bl, p0[2] + 1.5];
            const a = pr(p0), bq = pr(q);
            branches.push(<line key={`${b}${sd}`} x1={a[0]} y1={a[1]} x2={bq[0]} y2={bq[1]} stroke={col} strokeWidth={Math.max(1.4, 1.1 * sc)} strokeLinecap="round" />);
          }
          void l;
        }
        const pts = axis.map((q) => pr(q));
        return (
          <g key={i}>
            <path d={smoothPath(pts, false)} fill="none" stroke={dark} strokeWidth={Math.max(3, 2.6 * sc)} strokeLinecap="round" />
            {branches}
            <path d={smoothPath(pts, false)} fill="none" stroke={col} strokeWidth={Math.max(1.8, 1.6 * sc)} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

/** depth haze for the seabed (screen space) */
export const SeaHaze: React.FC<{op: number}> = ({op}) => (
  <g opacity={op}>
    <defs>
      <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4F8C8C" stopOpacity={0.75} />
        <stop offset="0.3" stopColor="#5E9896" stopOpacity={0.15} />
        <stop offset="0.8" stopColor="#5E9896" stopOpacity={0} />
        <stop offset="1" stopColor="#2F6866" stopOpacity={0.35} />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#haze)" />
  </g>
);

// ---------------------------------------------------------------- microscopic tissue inside the abandoned body
export const MicroLayer: React.FC<{pr: Proj; c: P3; op: number; t: number; para: number}> = ({pr, c, op, t, para}) => {
  if (op <= 0.001) return null;
  const cells: React.ReactNode[] = [];
  const R = rng(3);
  const r = 0.62;
  for (let i = -9; i <= 9; i++)
    for (let j = -12; j <= 12; j++) {
      const x = c[0] + (i + (j % 2 ? 0.5 : 0)) * r * 1.74 + (R() - 0.5) * 0.18, y = c[1] + j * r * 1.5 + (R() - 0.5) * 0.18;
      const pts: P2[] = [];
      for (let k = 0; k < 6; k++) {
        const th = (k / 6) * Math.PI * 2 + Math.PI / 6;
        pts.push(pr([x + Math.cos(th) * r * 0.97, y + Math.sin(th) * r * 0.97, c[2]]));
      }
      const chl: React.ReactNode[] = [];
      for (let k = 0; k < 5; k++) {
        const q = pr([x + (R() - 0.5) * r * 1.1, y + (R() - 0.5) * r * 1.1, c[2]]);
        const s = pr.scaleAt([x, y, c[2]]);
        chl.push(<ellipse key={k} cx={q[0]} cy={q[1]} rx={0.13 * s} ry={0.085 * s} fill="#3F8F37" opacity={0.85} transform={`rotate(${R() * 180} ${q[0]} ${q[1]})`} />);
      }
      cells.push(
        <g key={`${i},${j}`}>
          <path d={polyPath(pts)} fill="#CFE7B7" stroke="#7DAF68" strokeWidth={2} />
          {chl}
        </g>,
      );
    }
  // two copepod-like parasites, drawn as a hypothesis (ghosted, dashed)
  const bugs = [
    {x: c[0] - 1.1, y: c[1] - 1.5, a: 0.5, ph: 0},
    {x: c[0] + 1.3, y: c[1] + 1.0, a: 2.6, ph: 2},
  ].map((b, i) => {
    const s = pr.scaleAt([b.x, b.y, c[2]]);
    const q = pr([b.x + Math.sin(t * 1.3 + b.ph) * 0.25, b.y + Math.cos(t * 1.1 + b.ph) * 0.2, c[2]]);
    const ang = (b.a + Math.sin(t * 1.7 + b.ph) * 0.15) * (180 / Math.PI);
    const L = 1.9 * s;
    return (
      <g key={i} transform={`translate(${q[0]},${q[1]}) rotate(${ang})`} opacity={para}>
        <path d={`M${-L},0 C${-L * 0.6},${-L * 0.42} ${L * 0.35},${-L * 0.36} ${L * 0.62},0 C${L * 0.35},${L * 0.36} ${-L * 0.6},${L * 0.42} ${-L},0Z`} fill="#5A3A4E" fillOpacity={0.62} stroke="#2E1A28" strokeWidth={4} strokeDasharray="12 8" />
        {[-0.45, -0.15, 0.15].map((x, k) => <line key={k} x1={x * L} y1={-L * 0.33} x2={x * L} y2={L * 0.33} stroke="#3B2534" strokeWidth={2} opacity={0.6} />)}
        <path d={`M${-L * 0.9},${-L * 0.1} q${-L * 0.4},${-L * 0.5} ${-L * 0.25},${-L * 0.95}`} fill="none" stroke="#3B2534" strokeWidth={3} strokeLinecap="round" />
        <path d={`M${-L * 0.9},${L * 0.1} q${-L * 0.4},${L * 0.5} ${-L * 0.25},${L * 0.95}`} fill="none" stroke="#3B2534" strokeWidth={3} strokeLinecap="round" />
        <path d={`M${L * 0.6},0 l${L * 0.45},${-L * 0.18} M${L * 0.6},0 l${L * 0.45},${L * 0.18}`} stroke="#3B2534" strokeWidth={3} strokeLinecap="round" />
      </g>
    );
  });
  return (
    <g opacity={op}>
      <rect width={W} height={H} fill="#B9DA9F" />
      {cells}
      {bugs}
    </g>
  );
};

// ---------------------------------------------------------------- a fine paintbrush (the gentle touch)
export const Brush: React.FC<{tip: P2; press: number; op: number; scale?: number}> = ({tip, press, op, scale = 1}) => {
  if (op <= 0.001) return null;
  const ang = -56; // handle runs up and to the right
  const k = scale;
  const bend = press * 26 * k;
  return (
    <g transform={`translate(${tip[0]},${tip[1]}) rotate(${ang})`} opacity={op}>
      {/* bristles (tip at origin, pointing along -x) */}
      <path d={`M0,0 C${40 * k},${-10 * k - bend * 0.3} ${110 * k},${-22 * k - bend} ${150 * k},${-17 * k} L${150 * k},${17 * k} C${110 * k},${22 * k - bend * 0.4} ${40 * k},${10 * k} 0,0Z`} fill="#6B4A31" stroke="#2A1C12" strokeWidth={3} />
      <path d={`M${20 * k},${-2 * k} C${60 * k},${-8 * k - bend * 0.4} ${100 * k},${-12 * k - bend * 0.7} ${140 * k},${-8 * k}`} fill="none" stroke="#9C7452" strokeWidth={3} opacity={0.8} />
      <rect x={148 * k} y={-21 * k} width={78 * k} height={42 * k} rx={6 * k} fill="#C4CBD0" stroke="#3D454B" strokeWidth={3} />
      <rect x={156 * k} y={-21 * k} width={10 * k} height={42 * k} fill="#9AA4AB" />
      <path d={`M${226 * k},${-19 * k} L${900 * k},${-30 * k} L${900 * k},${30 * k} L${226 * k},${19 * k}Z`} fill="#C98A4E" stroke="#4A2E17" strokeWidth={3} />
      <path d={`M${240 * k},${-9 * k} L${900 * k},${-14 * k}`} stroke="#E0A86F" strokeWidth={6 * k} opacity={0.8} />
    </g>
  );
};

// ---------------------------------------------------------------- small discreet labels (top left)
export const Label: React.FC<{text: string; op: number; y?: number; icon?: 'ff' | 'rw' | 'none'}> = ({text, op, y = 118, icon = 'none'}) => {
  if (op <= 0.001) return null;
  return (
    <g opacity={clamp(op)} transform={`translate(64, ${y})`}>
      {icon !== 'none' && (
        <g transform={icon === 'rw' ? 'translate(44,0) scale(-1,1)' : ''} fill="#FFFFFF" stroke="#0D1A1D" strokeWidth={3} strokeLinejoin="round">
          <path d="M0,-14 L16,0 L0,14Z" />
          <path d="M18,-14 L34,0 L18,14Z" />
        </g>
      )}
      <text x={icon === 'none' ? 0 : 52} y={11} fontFamily='"Nunito Variable", Nunito, sans-serif' fontWeight={900} fontSize={32} letterSpacing="0.12em" fill="#FFFFFF" stroke="#0D1A1D" strokeWidth={7} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
};
