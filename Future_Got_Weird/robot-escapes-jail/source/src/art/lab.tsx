// The lab (S5): a light, airy bench seen from above, a glass collection (petri) dish, a plastic transfer pipette, the
// scientist's gloved hands (Weird Crew hand in blue nitrile, white lab-coat sleeve), a two-part orange silicone mold
// (a hinged "book" mold: the cavity half + the lid half, both with the robot-shaped cavity) and the cooling frost.
//
// Space. Everything on the bench is placed in BENCH coordinates (bench px): bx to the right, bz toward the viewer, h up
// off the bench. A BenchCam maps them to the screen: a steep orthographic view (k = sin(elevation): 1 = straight down)
// with a gentle perspective magnification of raised points (PERS_D), so lifted things (the flipping lid, the hands) grow a
// little as they come toward the lens. The point (cx, cz) on the bench sits at screen (540, oy).
//
// The mold cavity is the robot's exact silhouette: robotSilhouette() rebuilds the solid robot's part polygons
// (robot units, same construction as robot.tsx's rig at melt 0, view 0) so the cavity, the liquid fill and the revealed
// <Robot> coincide. Robot units -> mold-face units: u = w/2 + x*SB, v = FEET_V - h*SB.
import React from 'react';
import {C, INK, INK_PX, NS} from './palette';
import {uid} from '../core/ids';
import {mix, rgba} from '../core/color';
import {clamp, lerp, noise1} from '../lib';
import {smoothPath, polyPath, V} from './liquid';
import {RobotPose} from './robot';
import {Hand, HandPose, digitTips} from '../dc/Hand';
import {Capsule} from '../dc/shade';
import {Inked} from '../dc/ink';

const f1 = (n: number) => (Math.abs(n) < 1e-4 ? '0' : n.toFixed(1));
const f3 = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(4));

// ---------------------------------------------------------------------------------------------------------------
// colours (lab-only; everything else comes from palette C)
export const GLOVE = '#5F8BEA'; // blue nitrile
export const GLOVE_DEEP = '#3F67C4';
export const SLEEVE = '#F3F6FA'; // lab coat
export const MAT = '#AEBFCE'; // bench mat (a touch darker than the bench, for contrast under the props)
export const MAT_LINE = '#97AABD';
/** reflection environment for liquid / chrome in the lab: bright sky top, cool bench below */
export const LAB_ENV = {top: '#FFFFFF', bottom: mix(C.benchDark, C.navy2, 0.45)};

// ---------------------------------------------------------------------------------------------------------------
// camera
export type BenchCam = {cx: number; cz: number; Z: number; k: number; oy: number};
export const PERS_D = 2600;
export type SP = V & {m: number};
/** bench point -> screen */
export const benchPt = (c: BenchCam, bx: number, bz: number, h = 0): SP => {
  const sk = Math.sqrt(Math.max(0, 1 - c.k * c.k));
  const x = 540 + c.Z * (bx - c.cx);
  const y = c.oy + c.Z * ((bz - c.cz) * c.k - h * sk);
  const m = 1 + h / PERS_D;
  return {x: 540 + (x - 540) * m, y: 960 + (y - 960) * m, m};
};
/** affine matrix mapping a planar face's local (u, v) to the screen, from three points of the face */
export const faceMatrix = (o: V, pu: V, pv: V, du: number, dv: number) =>
  `matrix(${f3((pu.x - o.x) / du)} ${f3((pu.y - o.y) / du)} ${f3((pv.x - o.x) / dv)} ${f3((pv.y - o.y) / dv)} ${f3(o.x)} ${f3(o.y)})`;
const mapAff = (o: V, pu: V, pv: V, du: number, dv: number) => (u: number, v: number): V => ({
  x: o.x + ((pu.x - o.x) * u) / du + ((pv.x - o.x) * v) / dv,
  y: o.y + ((pu.y - o.y) * u) / du + ((pv.y - o.y) * v) / dv,
});

// ---------------------------------------------------------------------------------------------------------------
// the room: bench top (+ mat grid, window light) and the pale back wall above the bench's far edge
export const WALL_Z = -1050;
export const LabRoom: React.FC<{c: BenchCam; t: number; light: number}> = ({c, t, light}) => {
  const id = {w: uid('lbW'), b: uid('lbB'), l: uid('lbL'), g: uid('lbG')};
  const P = (x: number, z: number, h = 0) => benchPt(c, x, z, h);
  const quad = (ps: V[]) => polyPath(ps);
  const e0 = P(-4000, WALL_Z), e1 = P(4000, WALL_Z);
  const bench = quad([e0, e1, P(4000, 6000), P(-4000, 6000)]);
  const sk = Math.sqrt(Math.max(0, 1 - c.k * c.k));
  const showWall = e0.y > -50;
  const wallTop = P(0, WALL_Z, 1600).y;
  // mat with a grid (cutting-mat style): reads the camera's motion
  const M0 = {x0: -900, x1: 1100, z0: -560, z1: 1300};
  const mat = quad([P(M0.x0, M0.z0), P(M0.x1, M0.z0), P(M0.x1, M0.z1), P(M0.x0, M0.z1)]);
  let grid = '';
  for (let x = M0.x0 + 100; x < M0.x1; x += 100) {
    const a = P(x, M0.z0), b = P(x, M0.z1);
    grid += `M${f1(a.x)},${f1(a.y)}L${f1(b.x)},${f1(b.y)}`;
  }
  for (let z = M0.z0 + 100; z < M0.z1; z += 100) {
    const a = P(M0.x0, z), b = P(M0.x1, z);
    grid += `M${f1(a.x)},${f1(a.y)}L${f1(b.x)},${f1(b.y)}`;
  }
  // window light: two soft slanted patches; they slide across the bench while the metal cools (time passing)
  const lx = -1050 + 520 * light;
  const patch = (x0: number, w: number) => quad([P(x0, -1050), P(x0 + w, -1050), P(x0 + w + 900, 2400), P(x0 + 900, 2400)]);
  // upright things at the back of the bench (billboards: local x right, y DOWN from the base, bench px)
  const up = (bx: number, bz: number) => {
    const o = P(bx, bz, 0);
    return `matrix(${f3(c.Z * o.m)} 0 0 ${f3(c.Z * sk * o.m)} ${f3(o.x)} ${f3(o.y)})`;
  };
  const glass = rgba(C.glass, 0.75);
  const ln = {stroke: INK, strokeWidth: 1.6, vectorEffect: NS};
  return (
    <g>
      <defs>
        <linearGradient id={id.w} gradientUnits="userSpaceOnUse" x1="0" y1={f1(wallTop)} x2="0" y2={f1(e0.y)}>
          <stop offset="0" stopColor={C.labBg0} />
          <stop offset="1" stopColor={C.labBg1} />
        </linearGradient>
        <linearGradient id={id.b} gradientUnits="userSpaceOnUse" x1="0" y1={f1(e0.y)} x2="0" y2={f1(P(0, 2400).y)}>
          <stop offset="0" stopColor={mix(C.bench, C.labBg0, 0.3)} />
          <stop offset="0.5" stopColor={C.bench} />
          <stop offset="1" stopColor={mix(C.bench, C.benchDark, 0.35)} />
        </linearGradient>
        <linearGradient id={id.l} gradientUnits="userSpaceOnUse" x1={f1(P(lx, 0).x)} y1="0" x2={f1(P(lx + 380, 0).x)} y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0.3} />
          <stop offset="0.7" stopColor="#FFFFFF" stopOpacity={0.3} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={id.g}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.85} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={showWall ? `url(#${id.w})` : C.bench} />
      {showWall && (
        <g>
          {/* tiled wall + a soft window glow */}
          <g transform={up(0, WALL_Z)}>
            {Array.from({length: 12}, (_, i) => (
              <path key={'h' + i} d={`M-4000,${-(i + 1) * 130} L4000,${-(i + 1) * 130}`} stroke={mix(C.labBg1, C.benchDark, 0.3)} strokeWidth={1.2} vectorEffect={NS} opacity={0.55} />
            ))}
            {Array.from({length: 34}, (_, i) => (
              <path key={'v' + i} d={`M${-2600 + i * 160},0 L${-2600 + i * 160},-1600`} stroke={mix(C.labBg1, C.benchDark, 0.3)} strokeWidth={1.2} vectorEffect={NS} opacity={0.3} />
            ))}
            <ellipse cx={-700} cy={-700} rx={1100} ry={520} fill={`url(#${id.g})`} />
            {/* a long shelf high on the wall */}
            <rect x={-2400} y={-900} width={4800} height={30} fill={C.labBg0} stroke={INK} strokeWidth={1.4} vectorEffect={NS} />
            <rect x={-2400} y={-870} width={4800} height={22} fill={mix(C.labBg1, C.benchDark, 0.5)} opacity={0.5} />
          </g>
          {/* glassware at the back of the bench */}
          <g transform={up(-560, -900)}>
            <path d="M-60,0 L-60,-150 Q-60,-166 -44,-166 L44,-166 Q60,-166 60,-150 L60,0 Z" fill={glass} {...ln} />
            <path d="M-56,0 L-56,-70 L56,-70 L56,0 Z" fill={rgba(C.field, 0.55)} />
            <path d="M-36,-30 L-36,-140" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" vectorEffect={NS} opacity={0.85} />
            {[-120, -90, -60].map((y) => <path key={y} d={`M40,${y} L60,${y}`} {...ln} />)}
          </g>
          <g transform={up(-330, -930)}>
            <path d="M-22,-250 L22,-250 L22,-150 L86,-12 Q90,0 74,0 L-74,0 Q-90,0 -86,-12 L-22,-150 Z" fill={glass} {...ln} />
            <path d="M-56,-62 L56,-62 L82,-12 Q86,0 72,0 L-72,0 Q-86,0 -82,-12 Z" fill={rgba(C.yellow, 0.75)} />
            <path d="M-40,-30 L-10,-120" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" vectorEffect={NS} opacity={0.85} />
          </g>
          <g transform={up(520, -920)}>
            {/* test-tube rack */}
            {[-90, -30, 30, 90].map((x, i) => (
              <g key={x}>
                <path d={`M${x - 16},-10 L${x - 16},-190 L${x + 16},-190 L${x + 16},-10 Q${x + 16},8 ${x},8 Q${x - 16},8 ${x - 16},-10 Z`} fill={glass} {...ln} />
                <path d={`M${x - 14},-60 L${x + 14},-60 L${x + 14},-10 Q${x + 14},6 ${x},6 Q${x - 14},6 ${x - 14},-10 Z`} fill={[C.field, C.stomach, C.yellow, C.field][i]} opacity={0.75} />
              </g>
            ))}
            <path d="M-130,-130 L130,-130 L130,-106 L-130,-106 Z" fill={C.labBg0} {...ln} />
            <path d="M-130,-30 L130,-30 L130,0 L-130,0 Z" fill={mix(C.labBg1, C.benchDark, 0.4)} {...ln} />
          </g>
          <g transform={up(860, -880)}>
            <path d="M-70,0 L-70,-120 Q-70,-132 -58,-132 L58,-132 Q70,-132 70,-120 L70,0 Z" fill={glass} {...ln} />
            <path d="M-66,0 L-66,-46 L66,-46 L66,0 Z" fill={rgba(C.field, 0.4)} />
          </g>
        </g>
      )}
      <path d={bench} fill={`url(#${id.b})`} />
      {showWall && <path d={`M${f1(e0.x)},${f1(e0.y)}L${f1(e1.x)},${f1(e1.y)}`} stroke={INK} strokeWidth={2} opacity={0.5} />}
      <path d={mat} fill={MAT} />
      <path d={grid} stroke={MAT_LINE} strokeWidth={1.3} fill="none" opacity={0.75} />
      <path d={mat} fill="none" stroke={mix(MAT_LINE, INK, 0.3)} strokeWidth={2} />
      {/* a lab notebook and pen lying on the bench (right) */}
      <g transform={faceMatrix(P(560, -380), P(900, -380), P(560, 80), 340, 460)}>
        <rect x={0} y={0} width={340} height={460} rx={12} fill="#F7F4EC" stroke={INK} strokeWidth={1.8} vectorEffect={NS} />
        <rect x={0} y={0} width={34} height={460} rx={8} fill={C.fieldDeep} opacity={0.85} />
        {Array.from({length: 11}, (_, i) => <path key={i} d={`M60,${50 + i * 36} L310,${50 + i * 36}`} stroke={C.field} strokeWidth={1.2} vectorEffect={NS} opacity={0.6} />)}
        <path d="M70,120 q30,-20 60,0 t60,0" fill="none" stroke={INK} strokeWidth={1.6} vectorEffect={NS} opacity={0.7} />
        <path d="M250,40 L330,420" stroke={INK} strokeWidth={18} strokeLinecap="round" vectorEffect={NS} opacity={0.15} transform="translate(8 6)" />
        <path d="M250,40 L330,420" stroke={C.navy3} strokeWidth={14} strokeLinecap="round" vectorEffect={NS} />
      </g>
      <path d={patch(lx, 380)} fill={`url(#${id.l})`} />
      <path d={patch(lx + 560, 160)} fill="#FFFFFF" opacity={0.1} />
      {void t}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// petri / collection dish (glass): back part (shadow, floor, far wall) and front part (near wall, rim)
export const DISH = {x: 0, z: 0, r: 370, h: 30};
const ellPath = (c: V, rx: number, ry: number, a0 = 0, a1 = Math.PI * 2, n = 64) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    d += `${i ? 'L' : 'M'}${f1(c.x + Math.cos(a) * rx)},${f1(c.y + Math.sin(a) * ry)}`;
  }
  return d;
};
const dishGeo = (c: BenchCam) => {
  const b = benchPt(c, DISH.x, DISH.z, 0), t = benchPt(c, DISH.x, DISH.z, DISH.h);
  return {b, t, rxB: c.Z * DISH.r * b.m, ryB: c.Z * DISH.r * c.k * b.m, rxT: c.Z * DISH.r * t.m, ryT: c.Z * DISH.r * c.k * t.m};
};
export const DishBack: React.FC<{c: BenchCam}> = ({c}) => {
  const g = dishGeo(c);
  const id = {s: uid('dsS'), f: uid('dsF')};
  const sh = benchPt(c, DISH.x + 26, DISH.z + 30, 0);
  // the glass body silhouette: far half of the rim + near half of the floor
  const body = ellPath(g.t, g.rxT, g.ryT, Math.PI, Math.PI * 2, 40) + ellPath(g.b, g.rxB, g.ryB, 0, Math.PI, 40).replace('M', 'L') + 'Z';
  return (
    <g>
      <defs>
        <radialGradient id={id.s}>
          <stop offset="0.75" stopColor={C.navy2} stopOpacity={0.28} />
          <stop offset="1" stopColor={C.navy2} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={id.f} gradientUnits="userSpaceOnUse" x1={f1(g.b.x - g.rxB)} y1={f1(g.b.y - g.ryB)} x2={f1(g.b.x + g.rxB)} y2={f1(g.b.y + g.ryB)}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset="0.5" stopColor={C.glass} stopOpacity={0.35} />
          <stop offset="1" stopColor={C.glass} stopOpacity={0.55} />
        </linearGradient>
      </defs>
      <ellipse cx={f1(sh.x)} cy={f1(sh.y)} rx={f1(g.rxB * 1.06)} ry={f1(g.ryB * 1.06 + 4)} fill={`url(#${id.s})`} />
      <path d={body} fill={rgba(C.glass, 0.35)} />
      <ellipse cx={f1(g.b.x)} cy={f1(g.b.y)} rx={f1(g.rxB)} ry={f1(g.ryB)} fill={`url(#${id.f})`} />
      {/* far inner wall: a faint band just inside the far rim */}
      <path d={ellPath(g.t, g.rxT, g.ryT, Math.PI * 1.05, Math.PI * 1.95, 30)} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(2, 5 * c.Z)} opacity={0.55} />
      <path d={ellPath(g.b, g.rxB, g.ryB, Math.PI * 1.1, Math.PI * 1.9, 30)} fill="none" stroke={mix(C.glass, C.benchDark, 0.4)} strokeWidth={1.4} opacity={0.6} />
    </g>
  );
};
export const DishFront: React.FC<{c: BenchCam}> = ({c}) => {
  const g = dishGeo(c);
  // near wall band (glass): between the floor's near arc and the rim's near arc
  const band = ellPath(g.t, g.rxT, g.ryT, 0, Math.PI, 40) + ellPath(g.b, g.rxB, g.ryB, Math.PI, 0, 40).replace('M', 'L') + 'Z';
  const lw = Math.max(2, 3.2 * c.Z);
  return (
    <g>
      <path d={band} fill="#FFFFFF" opacity={0.16} />
      {/* outer contour: rim far half + body sides + floor near half */}
      <path d={ellPath(g.t, g.rxT, g.ryT, Math.PI, Math.PI * 2, 40)} fill="none" stroke={INK} strokeWidth={1.8} opacity={0.75} />
      <path d={ellPath(g.b, g.rxB, g.ryB, 0, Math.PI, 40)} fill="none" stroke={INK} strokeWidth={2.2} opacity={0.8} />
      <path d={`M${f1(g.t.x - g.rxT)},${f1(g.t.y)}L${f1(g.b.x - g.rxB)},${f1(g.b.y)}M${f1(g.t.x + g.rxT)},${f1(g.t.y)}L${f1(g.b.x + g.rxB)},${f1(g.b.y)}`} stroke={INK} strokeWidth={2} opacity={0.75} />
      {/* rim: thick glass lip, bright */}
      <ellipse cx={f1(g.t.x)} cy={f1(g.t.y)} rx={f1(g.rxT)} ry={f1(g.ryT)} fill="none" stroke="#FFFFFF" strokeWidth={lw} opacity={0.9} />
      <path d={ellPath(g.t, g.rxT, g.ryT, 0.05, Math.PI - 0.05, 40)} fill="none" stroke={INK} strokeWidth={1.4} opacity={0.55} transform={`translate(0 ${f1(lw * 0.6)})`} />
      {/* glints on the near wall */}
      <path d={ellPath(g.t, g.rxT * 0.985, g.ryT * 0.985 + 4, Math.PI * 0.62, Math.PI * 0.8, 12)} fill="none" stroke="#FFFFFF" strokeWidth={lw * 1.6} strokeLinecap="round" opacity={0.85} />
      <path d={ellPath(g.t, g.rxT * 0.985, g.ryT * 0.985 + 4, Math.PI * 0.84, Math.PI * 0.88, 6)} fill="none" stroke="#FFFFFF" strokeWidth={lw * 1.6} strokeLinecap="round" opacity={0.85} />
      <path d={ellPath(g.t, g.rxT * 0.98, g.ryT * 0.98, Math.PI * 1.62, Math.PI * 1.78, 10)} fill="none" stroke="#FFFFFF" strokeWidth={lw * 1.2} strokeLinecap="round" opacity={0.75} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// transfer pipette (clear plastic): tip at `tip`, axis toward the bulb at screen angle `ang` (deg), `sc` px per bench px.
// fill 0..1: silver column in the barrel (from the tip up); squeeze 0..1 pinches the bulb.
export const PIPETTE = {nozzle: 80, barrel: 300, neck: 330, bulb0: 334, bulb1: 486, hwTip: 4.5, hwNoz: 12, hwBar: 22, hwNeck: 10, hwBulb: 44};
/** bench-px distance from the tip to the bulb centre (where the fingers pinch) */
export const PIPETTE_GRIP = (PIPETTE.bulb0 + PIPETTE.bulb1) / 2;
export const Pipette: React.FC<{tip: V; ang: number; sc: number; fill: number; squeeze: number; t: number; opacity?: number; part?: 'tube' | 'bulb' | 'all'}> = ({tip, ang, sc, fill, squeeze, t, opacity = 1, part = 'all'}) => {
  const P = PIPETTE;
  const id = {g: uid('ppG'), l: uid('ppL'), b: uid('ppB'), c: uid('ppC')};
  // outline (local: x along the axis, y across)
  const prof: [number, number][] = [
    [0, P.hwTip], [P.nozzle, P.hwNoz], [P.nozzle + 12, P.hwBar], [P.barrel, P.hwBar], [P.barrel + 16, P.hwNeck], [P.neck, P.hwNeck],
  ];
  const top = prof.map(([x, y]) => `${x},${-y}`), bot = [...prof].reverse().map(([x, y]) => `${x},${y}`);
  const body = `M${top.join('L')}L${bot.join('L')}Z`;
  // bulb: an egg, pinched in the middle when squeezed
  const sq = clamp(squeeze);
  const bulbPts: V[] = [];
  const bl = P.bulb1 - P.bulb0;
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const u = (1 - Math.cos(a)) / 2; // 0 at the neck, 1 at the far end
    const pinch = 1 - 0.5 * sq * Math.exp(-(((u - 0.5) / 0.22) ** 2));
    const hw = (P.hwNeck + (P.hwBulb - P.hwNeck) * Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 0.6) * pinch;
    bulbPts.push({x: P.bulb0 - 4 + u * bl * (1 + 0.04 * sq), y: Math.sin(a) >= 0 ? hw : -hw});
  }
  // liquid column: the interior from the tip up to the level (meniscus), clipped to the tube interior
  const lvl = 6 + clamp(fill) * (P.barrel - 14);
  const inner = `M${prof.map(([x, y]) => `${x},${-(y - 2.6)}`).join('L')}L${[...prof].reverse().map(([x, y]) => `${x},${y - 2.6}`).join('L')}Z`;
  const wob = 2.5 * Math.sin(t * 9);
  const ticks = [0.25, 0.5, 0.75].map((k) => P.nozzle + 30 + k * (P.barrel - P.nozzle - 40));
  return (
    <g transform={`translate(${f1(tip.x)} ${f1(tip.y)}) rotate(${ang.toFixed(2)}) scale(${f3(sc)})`} opacity={opacity}>
      <defs>
        <linearGradient id={id.g} x1="0" y1="-1" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.85} />
          <stop offset="0.35" stopColor={C.glass} stopOpacity={0.35} />
          <stop offset="1" stopColor={C.glass} stopOpacity={0.6} />
        </linearGradient>
        <linearGradient id={id.l} gradientUnits="userSpaceOnUse" x1="0" y1={-P.hwBar} x2="0" y2={P.hwBar}>
          <stop offset="0" stopColor={C.silverLit} />
          <stop offset="0.22" stopColor={C.chrome} />
          <stop offset="0.42" stopColor={C.silver} />
          <stop offset="0.6" stopColor={C.silverDark} />
          <stop offset="0.74" stopColor={C.silverDeep} />
          <stop offset="1" stopColor={C.silverMid} />
        </linearGradient>
        <linearGradient id={id.b} gradientUnits="userSpaceOnUse" x1="0" y1={-P.hwBulb} x2="0" y2={P.hwBulb}>
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#EEF4F8" />
          <stop offset="1" stopColor="#C4D2DE" />
        </linearGradient>
        <clipPath id={id.c}>
          <path d={inner} />
        </clipPath>
      </defs>
      {part !== 'bulb' && (
        <g>
          <path d={body} fill={`url(#${id.g})`} />
          {fill > 0.003 && (
            <g clipPath={`url(#${id.c})`}>
              <path d={`M-10,${-P.hwBar - 2} L${f1(lvl - 4 + wob * 0.3)},${-P.hwBar - 2} Q${f1(lvl + 6)},0 ${f1(lvl - 4 - wob * 0.3)},${P.hwBar + 2} L-10,${P.hwBar + 2} Z`} fill={`url(#${id.l})`} stroke={INK} strokeWidth={1.3} vectorEffect={NS} />
              <path d={`M5,-2.5 L${f1(Math.max(5, lvl - 12))},${-P.hwBar * 0.42}`} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.9} />
            </g>
          )}
          {ticks.map((x, i) => (
            <path key={i} d={`M${f1(x)},${-P.hwBar + 1} L${f1(x)},${-P.hwBar + 8}`} stroke={INK} strokeWidth={1.2} vectorEffect={NS} opacity={0.6} />
          ))}
          <path d={`M${P.nozzle + 16},${-P.hwBar + 5} L${P.barrel - 10},${-P.hwBar + 5}`} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
          <path d={body} fill="none" stroke={INK} strokeWidth={INK_PX * 0.8} vectorEffect={NS} strokeLinejoin="round" />
        </g>
      )}
      {part !== 'tube' && (
        <g>
          <path d={smoothPath(bulbPts)} fill={`url(#${id.b})`} stroke={INK} strokeWidth={INK_PX * 0.8} vectorEffect={NS} />
          <path d={`M${P.bulb0 + 22},${-P.hwBulb * 0.5 * (1 - 0.4 * sq)} Q${(P.bulb0 + P.bulb1) / 2},${-P.hwBulb * 0.78 * (1 - 0.45 * sq)} ${P.bulb1 - 28},${-P.hwBulb * 0.48}`} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" opacity={0.9} />
        </g>
      )}
    </g>
  );
};

/** where to put a hand's wrist so that the index fingertip and the thumb tip pinch around `target` */
export const pinchWrist = (target: V, ang: number, L: number, ts: 1 | -1, pose: HandPose): V => {
  const d = digitTips({x: 0, y: 0}, ang, L, ts, pose);
  const mid = {x: (d.tips[0].x + d.thumb.x) / 2, y: (d.tips[0].y + d.thumb.y) / 2};
  return {x: target.x - mid.x, y: target.y - mid.y};
};

// ---------------------------------------------------------------------------------------------------------------
// gloved hand + forearm (blue nitrile glove, rolled cuff, white lab-coat sleeve), from the Weird Crew hand (dc/Hand)
export const GloveArm: React.FC<{
  wrist: V;
  ang: number; // deg, wrist -> fingers
  L: number; // wrist to middle fingertip, px
  pose: HandPose;
  thumbSide: 1 | -1;
  view?: 'back' | 'palm';
  hold?: {front: (number | 't')[]; obj: React.ReactNode; palmFront?: boolean};
  /** bend of the forearm relative to the hand axis (deg) */
  bend?: number;
}> = ({wrist, ang, L, pose, thumbSide, view = 'back', hold, bend = 0}) => {
  const id = uid('gv');
  const a = ((ang + 180 + bend) * Math.PI) / 180;
  const back = {x: Math.cos(a), y: Math.sin(a)};
  const at = (k: number) => ({x: wrist.x + back.x * L * k, y: wrist.y + back.y * L * k});
  const ink = (INK_PX * 2) / 0.72;
  const cuff0 = at(0.5), cuff1 = at(0.62);
  return (
    <g>
      <Inked w={ink}>
        <Capsule id={`${id}-sl`} a={at(0.6)} b={at(2.6)} ra={0.235 * L} rb={0.26 * L} color={SLEEVE} spec={0.25} k={0.8} />
      </Inked>
      <Inked w={ink}>
        <Capsule id={`${id}-fa`} a={at(-0.05)} b={cuff0} ra={0.17 * L} rb={0.2 * L} color={GLOVE} spec={0.3} />
        <Capsule id={`${id}-cf`} a={cuff0} b={cuff1} ra={0.215 * L} rb={0.22 * L} color={mix(GLOVE, '#FFFFFF', 0.12)} spec={0.2} />
      </Inked>
      <Hand id={`${id}-h`} wrist={wrist} ang={ang} L={L} thumbSide={thumbSide} view={view} pose={pose} color={GLOVE} sheen={1.1} ink={ink} hold={hold} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// the robot's silhouette (robot units, x right, h up, feet base at 0,0): the same part polygons as robot.tsx's rig at
// melt 0, view 0 (copied construction: robot.tsx does not export its rig). Used for the mold cavity and the liquid fill.
const D = {
  headC: 8.4, headRx: 1.95, headRy: 1.6,
  neckH0: 6.4, neckH1: 6.95, neckW: 0.42,
  torsoTop: 6.62, torsoBot: 3.9, torsoTW: 1.55, torsoBW: 1.12,
  pelvisC: 3.55, pelvisW: 1.1, pelvisH: 0.4,
  hipX: 0.62, hipH: 3.3, thigh: 1.45, shin: 1.25, footH: 0.62, footW: 0.7,
  shX: 1.7, shH: 6.05, upper: 1.3, fore: 1.12, armR: 0.35,
  earX: 1.9, earH: 8.3,
};
const rotP = (p: V, o: V, deg: number): V => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const dx = p.x - o.x, dy = p.y - o.y;
  return {x: o.x + dx * c - dy * s, y: o.y + dx * s + dy * c};
};
const superE = (cx: number, cy: number, rx: number, ryT: number, ryB: number, nT: number, nB: number, N: number, wAt?: (h: number) => number): V[] => {
  const out: V[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const top = s >= 0;
    const n = top ? nT : nB;
    const ex = Math.sign(c) * Math.pow(Math.abs(c), 2 / n), ey = Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    const h = cy + ey * (top ? ryT : ryB);
    out.push({x: cx + ex * (wAt ? wAt(h) : rx), y: h});
  }
  return out;
};
const capPts = (a: V, b: V, ra: number, rb: number, N = 14): V[] => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.max(1e-4, Math.hypot(dx, dy));
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const s = clamp((ra - rb) / L, -0.95, 0.95), c = Math.sqrt(1 - s * s);
  const out: V[] = [];
  const a0 = Math.atan2(ny * c + uy * s, nx * c + ux * s);
  const a1 = Math.atan2(-ny * c + uy * s, -nx * c + ux * s);
  let span = a1 - a0;
  const mid = Math.atan2(uy, ux);
  const norm = (x: number) => Math.atan2(Math.sin(x), Math.cos(x));
  if (Math.abs(norm(a0 + span / 2 - mid)) > Math.PI / 2) span = span > 0 ? span - Math.PI * 2 : span + Math.PI * 2;
  for (let i = 0; i <= N; i++) {
    const t = a0 + (span * i) / N;
    out.push({x: b.x + Math.cos(t) * rb, y: b.y + Math.sin(t) * rb});
  }
  const b0 = a1, b1 = a0;
  let span2 = b1 - b0;
  const mid2 = Math.atan2(-uy, -ux);
  if (Math.abs(norm(b0 + span2 / 2 - mid2)) > Math.PI / 2) span2 = span2 > 0 ? span2 - Math.PI * 2 : span2 + Math.PI * 2;
  for (let i = 0; i <= N; i++) {
    const t = b0 + (span2 * i) / N;
    out.push({x: a.x + Math.cos(t) * ra, y: a.y + Math.sin(t) * ra});
  }
  return out;
};
const circPts = (c: V, rx: number, ry: number, N = 20, rot = 0): V[] => {
  const out: V[] = [];
  const cr = Math.cos(rot), sr = Math.sin(rot);
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push({x: c.x + x * cr - y * sr, y: c.y + x * sr + y * cr});
  }
  return out;
};
export type SilPart = {pts: V[]; smooth: boolean; kind?: string};
/** the solid robot's part polygons (robot units, y = h up) for a pose, melt 0, view 0 */
export const robotSilhouette = (pose: RobotPose): SilPart[] => {
  const P = pose;
  const rad = (d: number) => (d * Math.PI) / 180;
  const legs = [-1, 1].map((side) => {
    const hipA = side < 0 ? P.lHip : P.rHip, kneeA = side < 0 ? P.lKnee : P.rKnee;
    const hip = {x: side * D.hipX, y: D.hipH};
    const knee = {x: hip.x + side * Math.sin(rad(hipA)) * D.thigh, y: hip.y - Math.cos(rad(hipA)) * D.thigh};
    const sA = hipA - kneeA;
    const ankle = {x: knee.x + side * Math.sin(rad(sA)) * D.shin, y: knee.y - Math.cos(rad(sA)) * D.shin};
    return {side, hip, knee, ankle};
  });
  const lift = Math.min(...legs.map((l) => l.ankle.y)) - D.footH;
  for (const l of legs) for (const k of ['hip', 'knee', 'ankle'] as const) l[k] = {x: l[k].x, y: l[k].y - lift};
  const pelvisC = {x: 0, y: D.pelvisC - lift};
  const up = (p: V) => rotP({x: p.x, y: p.y - lift}, pelvisC, -P.lean);
  const neckPivot = {x: 0, y: 6.75};
  const headPt = (p: V) => up(rotP(p, neckPivot, -P.headTilt));
  const out: SilPart[] = [];
  for (const l of legs) {
    const fw = D.footW;
    const fc = {x: l.ankle.x + l.side * 0.12, y: l.ankle.y - D.footH};
    const foot: V[] = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI;
      foot.push({x: fc.x + Math.cos(a) * fw, y: fc.y + D.footH * Math.pow(Math.sin(a), 0.75)});
    }
    for (let i = 1; i < 6; i++) foot.push({x: fc.x - fw + (2 * fw * i) / 6, y: fc.y});
    out.push({pts: capPts(l.hip, l.knee, 0.5, 0.45), smooth: false});
    out.push({pts: capPts(l.knee, l.ankle, 0.43, 0.4), smooth: false});
    out.push({pts: circPts(l.knee, 0.4, 0.36, 18), smooth: false});
    out.push({pts: foot, smooth: false});
  }
  out.push({pts: superE(0, D.pelvisC, D.pelvisW, D.pelvisH, D.pelvisH, 4, 4, 40).map((p) => ({x: p.x, y: p.y - lift})), smooth: true});
  out.push({pts: superE(0, (D.neckH0 + D.neckH1) / 2, D.neckW, (D.neckH1 - D.neckH0) / 2, (D.neckH1 - D.neckH0) / 2, 6, 6, 24).map(up), smooth: true});
  const torsoHW = (h: number) => lerp(D.torsoBW, D.torsoTW, clamp((h - D.torsoBot) / (D.torsoTop - D.torsoBot)));
  const tMid = (D.torsoTop + D.torsoBot) / 2, tH = (D.torsoTop - D.torsoBot) / 2;
  out.push({pts: superE(0, tMid, 1, tH, tH, 4.2, 5, 60, torsoHW).map(up), smooth: true, kind: 'torso'});
  for (const side of [-1, 1]) {
    const a = side < 0 ? P.lSh : P.rSh, el = side < 0 ? P.lEl : P.rEl;
    const dir = (d: number) => ({x: side * Math.sin(rad(d)), y: -Math.cos(rad(d))});
    const sh = {x: side * D.shX, y: D.shH};
    const d1 = dir(a), d2 = dir(a + el);
    const elb = {x: sh.x + d1.x * D.upper, y: sh.y + d1.y * D.upper};
    const wr = {x: elb.x + d2.x * D.fore, y: elb.y + d2.y * D.fore};
    const hc = {x: wr.x + d2.x * 0.3, y: wr.y + d2.y * 0.3};
    const [S0, E0, W0, H0p] = [sh, elb, wr, hc].map(up);
    const ang = Math.atan2(W0.y - E0.y, W0.x - E0.x);
    out.push({pts: capPts(S0, E0, D.armR, 0.33), smooth: false});
    out.push({pts: capPts(E0, W0, 0.32, 0.3), smooth: false});
    out.push({pts: circPts(E0, 0.33, 0.33, 16), smooth: false});
    const hr = 0.45;
    const nIn = {x: -Math.sin(ang) * -side, y: Math.cos(ang) * -side};
    const th = {x: H0p.x + nIn.x * 0.36 - Math.cos(ang) * 0.12, y: H0p.y + nIn.y * 0.36 - Math.sin(ang) * 0.12};
    out.push({pts: circPts(H0p, hr * 1.12, hr * 0.92, 22, ang), smooth: false});
    out.push({pts: circPts(th, 0.19, 0.19, 14), smooth: false});
    out.push({pts: circPts(S0, 0.47, 0.47, 20), smooth: false});
  }
  for (const side of [-1, 1]) {
    const tn = clamp(P.headTurn, -1, 1);
    const kx = clamp(1 - 0.6 * side * tn, 0.45, 1.2);
    const c = headPt({x: side * D.earX - tn * 0.3, y: D.earH});
    out.push({pts: circPts(c, 0.3 * kx, 0.38, 18), smooth: false});
  }
  out.push({pts: superE(0, D.headC, D.headRx, D.headRy, D.headRy, 2.35, 3.1, 72).map(headPt), smooth: true});
  return out;
};

// ---------------------------------------------------------------------------------------------------------------
// the two-part silicone mold ("book" mold, hinged on the cavity half's left edge). Face-local units = bench px:
// u across (0 at the hinge), v along bz.
export type MoldGeo = {hinge: number; w: number; z0: number; z1: number; tau: number; sb: number; feetV: number; r: number};
export const MOLD: MoldGeo = {hinge: -10, w: 210, z0: 430, z1: 850, tau: 34, sb: 30, feetV: 790, r: 16};
/** robot units -> mold face local (u, v) */
export const silToFace = (g: MoldGeo, p: V): V => ({x: g.w / 2 + p.x * g.sb, y: g.feetV - p.y * g.sb});

const rrect = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${x0 + r},${y0}L${x1 - r},${y0}Q${x1},${y0} ${x1},${y0 + r}L${x1},${y1 - r}Q${x1},${y1} ${x1 - r},${y1}L${x0 + r},${y1}Q${x0},${y1} ${x0},${y1 - r}L${x0},${y0 + r}Q${x0},${y0} ${x0 + r},${y0}Z`;

/** cavity (robot-shaped depression) drawn in face-local units; `mirror` for nothing (the lid's mapping mirrors it) */
const Cavity: React.FC<{g: MoldGeo; sil: SilPart[]; depthK?: number}> = ({g, sil, depthK = 1}) => {
  const id = uid('mcC');
  const paths = sil.map((p) => {
    const q = p.pts.map((v) => silToFace(g, v));
    return p.smooth ? smoothPath(q) : polyPath(q);
  });
  const clear = 4.5; // cavity clearance around the figure (bench px)
  const sh = 7 * depthK;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          {paths.map((d, i) => <path key={i} d={d} stroke="#000" strokeWidth={clear * 2} />)}
        </clipPath>
      </defs>
      {/* rim ink + clearance */}
      {paths.map((d, i) => <path key={'i' + i} d={d} fill={INK} stroke={INK} strokeWidth={clear * 2 + 3.2} strokeLinejoin="round" />)}
      {paths.map((d, i) => <path key={'r' + i} d={d} fill={C.moldDeep} stroke={C.moldDeep} strokeWidth={clear * 2} strokeLinejoin="round" />)}
      {/* floor of the cavity, offset to leave the shaded upper-left wall */}
      <g clipPath={`url(#${id})`}>
        <g transform={`translate(${sh * 0.7} ${sh})`}>
          {paths.map((d, i) => <path key={'f' + i} d={d} fill={mix(C.mold, C.moldDeep, 0.45)} stroke={mix(C.mold, C.moldDeep, 0.45)} strokeWidth={clear * 2} strokeLinejoin="round" />)}
        </g>
      </g>
    </g>
  );
};

/** face fill: orange silicone with a soft top-left light and a gloss streak (face-local units) */
const MoldFace: React.FC<{w: number; h: number; r: number; tone?: number; gloss?: boolean}> = ({w, h, r, tone = 0, gloss = true}) => {
  const id = uid('mfG');
  const base = mix(C.mold, C.moldDeep, tone);
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2={h}>
          <stop offset="0" stopColor={mix(base, '#FFE2C8', 0.35)} />
          <stop offset="0.45" stopColor={base} />
          <stop offset="1" stopColor={mix(base, C.moldDeep, 0.35)} />
        </linearGradient>
      </defs>
      <path d={rrect(0, 0, w, h, r)} fill={`url(#${id})`} />
      {gloss && <path d={`M${r * 0.9},${h * 0.07} Q${r * 0.5},${r * 0.5} ${w * 0.3},${r * 0.6}`} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.55} />}
    </g>
  );
};

type Face3 = {pts: V[]; key: string};
/** 3D slab corners -> visible faces (back-face culled by screen winding) */
const visible = (q: V[]) => {
  let a = 0;
  for (let i = 0; i < q.length; i++) {
    const p = q[i], n = q[(i + 1) % q.length];
    a += p.x * n.y - n.x * p.y;
  }
  return a;
};

/** the cavity half (static, lying on the bench, hinge on its left edge) */
export const MoldBase: React.FC<{c: BenchCam; g?: MoldGeo; sil: SilPart[]; frost?: number; children?: React.ReactNode}> = ({c, g = MOLD, sil, children}) => {
  const P = (u: number, v: number, h: number) => benchPt(c, g.hinge + u, v, h);
  const L = g.z1 - g.z0;
  // shadow
  const s0 = P(14, g.z0 + 18, 0), s1 = P(g.w + 22, g.z1 + 26, 0);
  const idS = uid('mbS');
  // near side face (visible when the camera is not straight down)
  const top = [P(0, g.z0, g.tau), P(g.w, g.z0, g.tau), P(g.w, g.z1, g.tau), P(0, g.z1, g.tau)];
  const bot = [P(0, g.z0, 0), P(g.w, g.z0, 0), P(g.w, g.z1, 0), P(0, g.z1, 0)];
  const side = polyPath([top[3], top[2], bot[2], bot[3]]);
  const M = faceMatrix(top[0], top[1], top[3], g.w, L);
  const Mb = faceMatrix(bot[0], bot[1], bot[3], g.w, L);
  return (
    <g>
      <defs>
        <radialGradient id={idS}>
          <stop offset="0.6" stopColor={C.navy2} stopOpacity={0.3} />
          <stop offset="1" stopColor={C.navy2} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={f1((s0.x + s1.x) / 2)} cy={f1((s0.y + s1.y) / 2)} rx={f1(Math.abs(s1.x - s0.x) * 0.62)} ry={f1(Math.abs(s1.y - s0.y) * 0.6)} fill={`url(#${idS})`} />
      {/* body: bottom outline + side + top (union ink) */}
      <g transform={Mb}>
        <path d={rrect(0, g.z0 - g.z0, g.w, L, g.r)} fill={INK} stroke={INK} strokeWidth={INK_PX * 2} vectorEffect={NS} />
      </g>
      <path d={side} fill={INK} stroke={INK} strokeWidth={INK_PX * 2} />
      <g transform={M}>
        <path d={rrect(0, 0, g.w, L, g.r)} fill={INK} stroke={INK} strokeWidth={INK_PX * 2} vectorEffect={NS} />
      </g>
      <g transform={Mb}>
        <path d={rrect(0, 0, g.w, L, g.r)} fill={C.moldDeep} />
      </g>
      <path d={side} fill={mix(C.mold, C.moldDeep, 0.75)} />
      <g transform={M}>
        <MoldFace w={g.w} h={L} r={g.r} />
        <g transform={`translate(0 ${-g.z0})`}>
          <Cavity g={g} sil={sil} />
        </g>
      </g>
      {/* contents of the cavity (liquid fill / the figure) in screen space */}
      {children}
    </g>
  );
};

/** screen mapping of the cavity half's top face (face-local u, v(bench z) -> screen) */
export const moldTopMap = (c: BenchCam, g: MoldGeo = MOLD) => {
  const o = benchPt(c, g.hinge, g.z0, g.tau), pu = benchPt(c, g.hinge + g.w, g.z0, g.tau), pv = benchPt(c, g.hinge, g.z1, g.tau);
  const f = mapAff(o, pu, pv, g.w, g.z1 - g.z0);
  return (u: number, v: number) => f(u, v - g.z0);
};

/** the lid half, rotated about the hinge (theta 0 = lying open to the left, 180 = closed on the cavity half). Its free
 *  edge carries a pull tab at the near end. frost: 0..1 sweep progress over the closed outer face, frostK its strength. */
export const lidTab = (c: BenchCam, theta: number, g: MoldGeo = MOLD) => lidPt(c, theta, g, g.w + 30, g.z1 - 70, g.tau * 0.5);
const tabOutline = (c: BenchCam, theta: number, g: MoldGeo) => {
  const out: V[] = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const cu = Math.cos(a), sv = Math.sin(a);
    out.push(lidPt(c, theta, g, g.w + 14 + Math.sign(cu) * Math.pow(Math.abs(cu), 0.6) * 44, g.z1 - 70 + Math.sign(sv) * Math.pow(Math.abs(sv), 0.6) * 34, g.tau * 0.5));
  }
  return out;
};
/** the lid's pull tab alone (to draw it again between a gripping hand's palm and its index finger + thumb) */
export const LidTabShape: React.FC<{c: BenchCam; theta: number; g?: MoldGeo}> = ({c, theta, g = MOLD}) => {
  const d = smoothPath(tabOutline(c, theta, g));
  return (
    <g>
      <path d={d} fill={INK} stroke={INK} strokeWidth={INK_PX * 2} />
      <path d={d} fill={mix(C.mold, C.moldDeep, 0.2)} />
    </g>
  );
};
const lidPt = (c: BenchCam, theta: number, g: MoldGeo, u: number, v: number, w: number) => {
  // lid local: u from the hinge, v = bench z, w = thickness coordinate (0 = outer face, tau = inner face)
  const th = (theta * Math.PI) / 180;
  const U = {x: -Math.cos(th), h: Math.sin(th)};
  const N = {x: Math.sin(th), h: Math.cos(th)}; // inner-face normal
  const bx = g.hinge + u * U.x + (w - g.tau) * N.x;
  const h = g.tau + u * U.h + (w - g.tau) * N.h;
  return benchPt(c, bx, v, h);
};
export const MoldLid: React.FC<{c: BenchCam; theta: number; g?: MoldGeo; sil: SilPart[]; frost?: number; frostK?: number; t: number}> = ({c, theta, g = MOLD, sil, frost = 0, frostK = 0, t}) => {
  const L = g.z1 - g.z0;
  const P = (u: number, v: number, w: number) => lidPt(c, theta, g, u, v, w);
  const inner = [P(0, g.z0, g.tau), P(g.w, g.z0, g.tau), P(g.w, g.z1, g.tau), P(0, g.z1, g.tau)];
  const outer = [P(0, g.z0, 0), P(g.w, g.z0, 0), P(g.w, g.z1, 0), P(0, g.z1, 0)];
  // back-face culling with the 3D outward normals against the direction toward the camera (0, sqrt(1-k^2), k)
  const th = (theta * Math.PI) / 180;
  const sk = Math.sqrt(Math.max(0, 1 - c.k * c.k));
  const faces: Face3[] = [];
  if (Math.sin(th) * c.k > 0.004) faces.push({key: 'edge', pts: [inner[1], inner[2], outer[2], outer[1]]});
  if (sk > 0.01) faces.push({key: 'near', pts: [inner[3], inner[2], outer[2], outer[3]]});
  const showInner = Math.cos(th) > 0;
  const big = showInner ? inner : outer;
  const M = faceMatrix(big[0], big[1], big[3], g.w, L);
  // pull tab (on the free edge, near end): a rounded nub
  const tabD = smoothPath(tabOutline(c, theta, g));
  const sideFaces = faces.filter((f) => Math.abs(visible(f.pts)) > 0.5);
  return (
    <g>
      {/* union ink */}
      {sideFaces.map((f) => <path key={'i' + f.key} d={polyPath(f.pts)} fill={INK} stroke={INK} strokeWidth={INK_PX * 2} strokeLinejoin="round" />)}
      <g transform={M}>
        <path d={rrect(0, 0, g.w, L, g.r)} fill={INK} stroke={INK} strokeWidth={INK_PX * 2} vectorEffect={NS} />
      </g>
      <path d={tabD} fill={INK} stroke={INK} strokeWidth={INK_PX * 2} />
      <path d={tabD} fill={mix(C.mold, C.moldDeep, 0.2)} />
      {sideFaces.map((f) => <path key={'s' + f.key} d={polyPath(f.pts)} fill={mix(C.mold, C.moldDeep, f.key === 'edge' ? 0.35 : 0.7)} />)}
      <g transform={M}>
        <MoldFace w={g.w} h={L} r={g.r} tone={showInner ? 0 : 0.12} gloss />
        {showInner && (
          <g transform={`translate(0 ${-g.z0})`}>
            <Cavity g={g} sil={sil} depthK={1} />
          </g>
        )}
        {!showInner && <LidBack w={g.w} h={L} />}
        {!showInner && frostK > 0.005 && <Frost w={g.w} h={L} p={frost} k={frostK} t={t} />}
      </g>
    </g>
  );
};
/** the lid's outer face: molded registration dimples + a raised rim line */
const LidBack: React.FC<{w: number; h: number}> = ({w, h}) => (
  <g>
    <path d={rrect(12, 12, w - 12, h - 12, 10)} fill="none" stroke={C.moldDeep} strokeWidth={2} opacity={0.55} />
    {[[0.22, 0.1], [0.78, 0.1], [0.22, 0.9], [0.78, 0.9]].map(([a, b], i) => (
      <g key={i}>
        <circle cx={w * a} cy={h * b} r={9} fill={C.moldDeep} opacity={0.5} />
        <circle cx={w * a - 2} cy={h * b - 2} r={4} fill="#FFFFFF" opacity={0.35} />
      </g>
    ))}
  </g>
);

// ---------------------------------------------------------------------------------------------------------------
// cooling (passive, room air): a soft cool tint sweeps over a face (face-local units) from the head end to the feet end,
// with a faint bright front and a few small glints where the metal inside has set. No ice: the composite re-solidifies
// near room temperature, so the cue is "cooler", never "frozen".
export const Frost: React.FC<{w: number; h: number; p: number; k: number; t: number}> = ({w, h, p, k, t}) => {
  const id = {g: uid('frG'), c: uid('frC')};
  const y = lerp(-0.3 * h, 1.3 * h, p); // front position (sweeps from the head end to the feet end)
  const soft = 0.28 * h; // width of the soft leading edge
  const glints = Array.from({length: 9}, (_, i) => {
    const cx = (0.16 + 0.68 * (0.5 + 0.5 * noise1(i * 1.37 + 0.2, 11))) * w;
    const cy = ((i + 0.5) / 9) * h * 0.92 + 0.04 * h;
    const passed = clamp((y - cy) / (soft * 0.5));
    const life = passed * (1 - clamp((y - cy - soft * 1.2) / soft)); // flashes as the front passes, then fades
    const tw = 0.7 + 0.3 * Math.sin(t * 19 + i * 2.3);
    return {cx, cy, a: life * tw, r: 6 + 4 * (0.5 + 0.5 * noise1(i * 2.1, 5))};
  });
  return (
    <g opacity={k}>
      <defs>
        {/* cool behind the front (top), clear ahead of it (bottom): one smooth ramp, no hard edges */}
        <linearGradient id={id.g} gradientUnits="userSpaceOnUse" x1="0" y1={f1(y - soft)} x2="0" y2={f1(y + soft * 0.35)}>
          <stop offset="0" stopColor={C.ice} stopOpacity={0.3} />
          <stop offset="0.72" stopColor="#FFFFFF" stopOpacity={0.42} />
          <stop offset="0.8" stopColor={C.ice} stopOpacity={0.22} />
          <stop offset="1" stopColor={C.ice} stopOpacity={0} />
        </linearGradient>
        <clipPath id={id.c}>
          <path d={rrect(0, 0, w, h, 16)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id.c})`}>
        <rect x={-10} y={-10} width={w + 20} height={h + 20} fill={`url(#${id.g})`} />
      </g>
      {glints.map((q, i) =>
        q.a > 0.02 ? (
          <g key={i} transform={`translate(${f1(q.cx)} ${f1(q.cy)})`} opacity={q.a}>
            <path d={`M0,${-q.r}L${q.r * 0.2},${-q.r * 0.2}L${q.r},0L${q.r * 0.2},${q.r * 0.2}L0,${q.r}L${-q.r * 0.2},${q.r * 0.2}L${-q.r},0L${-q.r * 0.2},${-q.r * 0.2}Z`} fill="#FFFFFF" />
          </g>
        ) : null,
      )}
    </g>
  );
};

/** cold air: a few soft wisps curling up off an object (screen px) */
export const ColdWisps: React.FC<{x0: number; x1: number; y: number; k: number; t: number; s: number}> = ({x0, x1, y, k, t, s}) => {
  if (k <= 0.01) return null;
  return (
    <g opacity={k} fill="none" strokeLinecap="round">
      {Array.from({length: 5}, (_, i) => {
        const x = lerp(x0, x1, (i + 0.5) / 5) + 12 * Math.sin(t * 2 + i);
        const rise = ((t * 0.9 + i * 0.37) % 1) * 90 * s;
        const yy = y - rise;
        return (
          <path key={i} d={`M${f1(x)},${f1(yy)} c${f1(14 * s)},${f1(-18 * s)} ${f1(-14 * s)},${f1(-30 * s)} 0,${f1(-48 * s)}`} stroke="#FFFFFF" strokeWidth={Math.max(2, 5 * s)} opacity={0.5 * Math.sin(Math.PI * ((t * 0.9 + i * 0.37) % 1))} />
        );
      })}
    </g>
  );
};
