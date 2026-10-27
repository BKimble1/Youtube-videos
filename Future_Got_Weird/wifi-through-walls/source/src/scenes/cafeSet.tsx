// The café street: a storefront seen from across the sidewalk (facade plane z = FACADE), the sidewalk he walks along
// (toward screen-left, z = PATH_Z), a front table by the curb with a customer on a laptop, a lamp post and planters in
// the foreground for parallax. Inside the window: the café's ordinary Wi-Fi router on a shelf, and a laptop on the
// window ledge with a small USB antenna (the monitoring system that records the routers' feedback traffic).
import React from 'react';
import {B, proj, scaleAt, v3, V3} from '../world/cam';
import {Box, INK, Line3, Poly, rx, ry, rz} from '../world/draw';
import {f1, hash, mixHex, useUid} from '../lib';

export const FACADE = 3.2;
export const PATH_Z = 1.75;
export const CURB_Z = 0.25;
export const ROUTER = v3(0.15, 1.36, FACADE + 0.12);
export const TABLE = {x: -1.75, z: 0.85, y: 0.74};
export const LAPTOP = v3(TABLE.x + 0.12, TABLE.y + 0.13, TABLE.z - 0.02);
/** the monitoring laptop on the inside window ledge: its screen (faces the street) */
export const MONI = {x: -2.75, y: 1.42, z: FACADE + 0.06, w: 0.5, h: 0.31};
export const CC = {
  sky: '#BFE3EE', brick: '#C9705A', brickDeep: '#A9584A', mortar: '#E3B7A6', teal: '#2E8F8A', tealDeep: '#1F6E6A', cream: '#FFF4DF',
  glass: '#2C4D5C', glassLit: '#3E6A7A', interior: '#F3D9B1', interiorDeep: '#D9B98E', wood: '#8A5A3B', woodLight: '#B07A52',
  walk: '#C9C6BE', walkLine: '#ADA9A0', walkDeep: '#B7B3AA', curb: '#9C9890', road: '#4A5157', roadLine: '#E9E3D3',
  awnA: '#F1E7D2', awnB: '#E05D4F', plant: '#4E9A5E', plantDeep: '#357A47', pot: '#B06A45', metal: '#3A4650',
};
const X0 = -12, X1 = 12;

/** the street behind and around him (drawn before the characters) */
export const CafeBack: React.FC<{b: B; t: number}> = ({b, t}) => {
  const k = scaleAt(b, v3(0, 1.2, FACADE));
  const hw = Math.max(0.8, Math.min(2.4, k * 0.0035));
  const z = FACADE;
  const winL = [-3.35, -1.05], winR = [0.45, 2.8];
  const door = [-0.85, 0.25];
  const bricks: React.ReactNode[] = [];
  // brick courses on the upper storey and the piers
  for (let i = 0; i < 26; i++) {
    const yy = 2.95 + i * 0.09;
    const A = proj(b, v3(X0, yy, z)), Bq = proj(b, v3(X1, yy, z));
    bricks.push(<line key={`c${i}`} x1={f1(A.x)} y1={f1(A.y)} x2={f1(Bq.x)} y2={f1(Bq.y)} stroke={CC.brickDeep} strokeWidth={hw * 0.7} opacity={0.5} />);
  }
  const upperWin = [-5.4, -3.2, -1.0, 1.2, 3.4, 5.6].map((x) => (
    <g key={x}>
      <Poly b={b} pts={rz(z - 0.001, x - 0.55, x + 0.55, 3.35, 4.45)} fill={CC.cream} />
      <Poly b={b} pts={rz(z - 0.002, x - 0.47, x + 0.47, 3.43, 4.37)} fill="#8FB9C8" sw={0.6} />
      <Poly b={b} pts={rz(z - 0.003, x - 0.47, x + 0.47, 3.43, 3.7)} fill="#A9CCD8" stroke={false} />
      <Line3 b={b} pts={[v3(x, 3.43, z - 0.003), v3(x, 4.37, z - 0.003)]} stroke={CC.cream} w={0.05} />
      <Poly b={b} pts={rz(z - 0.004, x - 0.62, x + 0.62, 3.27, 3.35)} fill="#E9DCC4" sw={0.6} />
    </g>
  ));
  const win = (x0: number, x1: number, key: string) => (
    <g key={key}>
      {/* interior seen through the glass: back wall, menu boards, shelves, pendant lamps, counter */}
      <Poly b={b} pts={rz(z + 2.2, x0, x1, 0, 2.6)} fill={CC.interior} stroke={false} />
      <Poly b={b} pts={rz(z + 2.19, x0, x1, 0, 0.9)} fill={CC.woodLight} stroke={false} />
      {[0, 1].map((i) => <Poly key={i} b={b} pts={rz(z + 2.18, x0 + 0.3 + i * 0.95, x0 + 1.05 + i * 0.95, 1.6, 2.15)} fill="#2E3B34" sw={0.6} />)}
      {[0, 1].map((i) => Array.from({length: 4}, (_, n) => <Line3 key={`${i}${n}`} b={b} pts={[v3(x0 + 0.38 + i * 0.95, 2.02 - n * 0.11, z + 2.17), v3(x0 + 0.38 + i * 0.95 + 0.3 + 0.25 * hash(n + i * 7, 3), 2.02 - n * 0.11, z + 2.17)]} stroke="#F4EBD3" w={hw * 1.2} px />))}
      <Poly b={b} pts={ry(1.25, x0, x1, z + 1.5, z + 2.18)} fill={CC.wood} />
      <Box b={b} x0={x0 + 0.2} x1={x1 - 0.2} y0={0} y1={1.0} z0={z + 1.2} z1={z + 1.5} front={CC.wood} side="#704630" top={CC.woodLight} />
      {[0.35, 0.75].map((q) => {
        const px = x0 + (x1 - x0) * q;
        return (
          <g key={q}>
            <Line3 b={b} pts={[v3(px, 2.6, z + 0.9), v3(px, 2.05, z + 0.9)]} stroke={INK} w={0.012} />
            <Poly b={b} pts={[v3(px - 0.14, 1.95, z + 0.9), v3(px + 0.14, 1.95, z + 0.9), v3(px + 0.07, 2.08, z + 0.9), v3(px - 0.07, 2.08, z + 0.9)]} fill="#FFD27A" sw={0.6} />
          </g>
        );
      })}
      {/* people inside (soft silhouettes behind the glass) */}
      {[0.25, 0.68].map((q, i) => {
        const px = x0 + (x1 - x0) * q + 0.06 * Math.sin(t * 1.3 + i * 2);
        const c = proj(b, v3(px, 1.35, z + 0.8)), sc = scaleAt(b, v3(px, 1.35, z + 0.8));
        return (
          <g key={`p${i}`} opacity={0.75}>
            <ellipse cx={f1(c.x)} cy={f1(c.y - sc * 0.28)} rx={f1(sc * 0.11)} ry={f1(sc * 0.13)} fill={i ? '#6B4F3C' : '#A06B4F'} />
            <path d={`M${f1(c.x - sc * 0.2)},${f1(c.y + sc * 0.3)} Q${f1(c.x)},${f1(c.y - sc * 0.25)} ${f1(c.x + sc * 0.2)},${f1(c.y + sc * 0.3)} Z`} fill={i ? '#4F7C9A' : '#7A5C8E'} />
          </g>
        );
      })}
      {/* the glass: tint and a diagonal reflection */}
      <Poly b={b} pts={rz(z, x0, x1, 0.55, 2.35)} fill={CC.glass} stroke={false} op={0.28} />
      <Poly b={b} pts={[v3(x0 + 0.2, 2.35, z - 0.001), v3(x0 + 0.65, 2.35, z - 0.001), v3(x0 + 0.05, 0.55, z - 0.001), v3(x0, 0.55, z - 0.001), v3(x0, 1.2, z - 0.001)]} fill="#FFFFFF" stroke={false} op={0.12} />
      {/* frame */}
      <Poly b={b} pts={rz(z - 0.002, x0 - 0.06, x1 + 0.06, 2.35, 2.43)} fill={CC.tealDeep} />
      <Poly b={b} pts={rz(z - 0.002, x0 - 0.06, x1 + 0.06, 0.47, 0.55)} fill={CC.tealDeep} />
      <Poly b={b} pts={rz(z - 0.002, x0 - 0.06, x0, 0.47, 2.43)} fill={CC.tealDeep} />
      <Poly b={b} pts={rz(z - 0.002, x1, x1 + 0.06, 0.47, 2.43)} fill={CC.tealDeep} />
    </g>
  );
  return (
    <g>
      {/* storeys above: brick */}
      <Poly b={b} pts={rz(z, X0, X1, 2.9, 5.5)} fill={CC.brick} />
      {bricks}
      {upperWin}
      {/* shopfront panels */}
      <Poly b={b} pts={rz(z, X0, X1, 0, 2.9)} fill={CC.teal} />
      {/* the neighbours: plain shopfronts either side */}
      <Poly b={b} pts={rz(z - 0.001, -7.2, -4.0, 0.0, 2.6)} fill="#7C8C93" />
      <Poly b={b} pts={rz(z - 0.002, -6.9, -4.3, 0.5, 2.3)} fill={CC.glass} op={0.8} sw={0.6} />
      <Poly b={b} pts={rz(z - 0.001, 3.5, 7.0, 0.0, 2.6)} fill="#B9A27C" />
      <Poly b={b} pts={rz(z - 0.002, 3.8, 6.7, 0.5, 2.3)} fill={CC.glass} op={0.8} sw={0.6} />
      {win(winL[0], winL[1], 'wl')}
      {win(winR[0], winR[1], 'wr')}
      {/* door */}
      <Poly b={b} pts={rz(z + 0.05, door[0], door[1], 0, 2.25)} fill={CC.tealDeep} />
      <Poly b={b} pts={rz(z + 0.04, door[0] + 0.1, door[1] - 0.1, 0.9, 2.12)} fill={CC.glass} op={0.75} sw={0.6} />
      <Poly b={b} pts={rz(z + 0.03, door[1] - 0.2, door[1] - 0.14, 1.0, 1.25)} fill="#D9B44A" sw={0.5} />
      {/* fascia sign and awning */}
      <Poly b={b} pts={rz(z - 0.01, -3.6, 3.0, 2.5, 2.9)} fill="#1D3B3A" />
      <text {...(() => { const p = proj(b, v3(-0.3, 2.62, z - 0.02)); return {x: p.x, y: p.y}; })()} textAnchor="middle" fontSize={f1(k * 0.24)} fill={CC.cream} fontFamily="Fredoka Variable, Fredoka, sans-serif" fontWeight={600} letterSpacing={k * 0.02}>CORNER CAFÉ</text>
      {/* the router on the shelf inside the right-hand window */}
      <Box b={b} x0={ROUTER.x - 0.32} x1={ROUTER.x + 0.42} y0={ROUTER.y - 0.09} y1={ROUTER.y - 0.06} z0={ROUTER.z - 0.05} z1={ROUTER.z + 0.22} front={CC.wood} side="#704630" top={CC.woodLight} />
      <Router b={b} p={ROUTER} />
      {/* the monitoring laptop on the left window's inside ledge */}
      <Box b={b} x0={MONI.x - 0.62} x1={MONI.x + 0.58} y0={1.18} y1={1.23} z0={FACADE + 0.02} z1={FACADE + 0.32} front={CC.wood} side="#704630" top={CC.woodLight} />
    </g>
  );
};

export const Router: React.FC<{b: B; p: V3; blink?: number}> = ({b, p}) => {
  return (
    <g>
      <Box b={b} x0={p.x - 0.13} x1={p.x + 0.13} y0={p.y - 0.06} y1={p.y} z0={p.z - 0.02} z1={p.z + 0.12} front="#F2F4F5" side="#C9D1D6" top="#FFFFFF" />
      {[-0.09, 0.09].map((dx) => <Line3 key={dx} b={b} pts={[v3(p.x + dx, p.y, p.z + 0.08), v3(p.x + dx * 1.3, p.y + 0.17, p.z + 0.08)]} stroke={INK} w={0.016} />)}
      {[-0.06, -0.02, 0.02, 0.06].map((dx, i) => <Poly key={dx} b={b} pts={rz(p.z - 0.021, p.x + dx - 0.008, p.x + dx + 0.008, p.y - 0.035, p.y - 0.022)} fill={i % 2 ? '#3BDB84' : '#8FF0B6'} stroke={false} />)}
    </g>
  );
};

/** sidewalk, curb and road (drawn behind the characters) */
export const CafeGround: React.FC<{b: B}> = ({b}) => {
  const k = scaleAt(b, v3(0, 0, PATH_Z));
  const hw = Math.max(0.8, Math.min(2.6, k * 0.0028));
  const slabs: React.ReactNode[] = [];
  for (let x = -12; x <= 12; x += 1.1) slabs.push(<Line3 key={`s${x.toFixed(1)}`} b={b} pts={[v3(x, 0, CURB_Z), v3(x, 0, FACADE)]} stroke={CC.walkLine} w={hw} px />);
  return (
    <g>
      <Poly b={b} pts={ry(0, X0, X1, CURB_Z, FACADE)} fill={CC.walk} />
      {slabs}
      {[1.0, 2.1].map((z) => <Line3 key={z} b={b} pts={[v3(X0, 0, z), v3(X1, 0, z)]} stroke={CC.walkLine} w={hw} px />)}
      <Poly b={b} pts={rz(CURB_Z, X0, X1, -0.14, 0)} fill={CC.curb} />
      <Poly b={b} pts={ry(-0.14, X0, X1, -3, CURB_Z)} fill={CC.road} />
      <Poly b={b} pts={ry(-0.139, X0, X1, -1.4, -1.32)} fill={CC.roadLine} stroke={false} op={0.8} />
    </g>
  );
};

/** the front table by the curb: two chairs, the table, a laptop (its lid faces the customer) */
export const Table: React.FC<{b: B; part: 'back' | 'front'}> = ({b, part}) => {
  const T = TABLE;
  if (part === 'back')
    return (
      <g>
        <Line3 b={b} pts={[v3(T.x, 0, T.z), v3(T.x, T.y - 0.03, T.z)]} stroke={CC.metal} w={0.04} />
        <Poly b={b} pts={[v3(T.x - 0.25, 0.005, T.z - 0.12), v3(T.x + 0.25, 0.005, T.z - 0.12), v3(T.x + 0.25, 0.005, T.z + 0.12), v3(T.x - 0.25, 0.005, T.z + 0.12)]} fill={CC.metal} sw={0.6} />
      </g>
    );
  return (
    <g>
      <Box b={b} x0={T.x - 0.38} x1={T.x + 0.38} y0={T.y - 0.035} y1={T.y} z0={T.z - 0.32} z1={T.z + 0.32} front="#F1EDE4" side="#D5CFC2" top="#FBF8F2" />
      {/* laptop: base and lid; the lid's back faces us */}
      <Box b={b} x0={LAPTOP.x - 0.17} x1={LAPTOP.x + 0.17} y0={T.y} y1={T.y + 0.015} z0={LAPTOP.z - 0.12} z1={LAPTOP.z + 0.12} front="#B8C2C8" side="#9AA6AD" top="#D3DADE" />
      <Poly b={b} pts={[v3(LAPTOP.x + 0.17, T.y + 0.015, LAPTOP.z - 0.12), v3(LAPTOP.x + 0.21, T.y + 0.24, LAPTOP.z - 0.12), v3(LAPTOP.x + 0.21, T.y + 0.24, LAPTOP.z + 0.12), v3(LAPTOP.x + 0.17, T.y + 0.015, LAPTOP.z + 0.12)]} fill="#C9D1D6" />
      {/* a cup */}
      <Box b={b} x0={T.x - 0.27} x1={T.x - 0.19} y0={T.y} y1={T.y + 0.1} z0={T.z - 0.04} z1={T.z + 0.04} front="#FFFFFF" side="#E3E3E3" top="#7A4E33" />
    </g>
  );
};
/** foreground: lamp post and a planter (drawn over everything, they pass close to the lens) */
export const CafeFore: React.FC<{b: B}> = ({b}) => (
  <g>
    {[-6.6, 3.9].map((x) => (
      <g key={x}>
        <Line3 b={b} pts={[v3(x, -0.14, 0.12), v3(x, 4.6, 0.12)]} stroke={INK} w={0.11} />
        <Line3 b={b} pts={[v3(x, -0.14, 0.12), v3(x, 4.6, 0.12)]} stroke="#2E4A55" w={0.085} />
      </g>
    ))}
    {[-7.6, 1.9].map((x) => (
      <g key={x}>
        <Box b={b} x0={x - 0.3} x1={x + 0.3} y0={0} y1={0.55} z0={0.35} z1={0.85} front={CC.pot} side="#8E5236" top="#6B3F2A" />
        {[0, 1, 2, 3, 4].map((i) => {
          const c = proj(b, v3(x - 0.22 + i * 0.11, 0.75 + 0.12 * hash(i, 5), 0.55));
          const r = scaleAt(b, v3(x, 0.8, 0.55)) * (0.17 + 0.05 * hash(i, 6));
          return <circle key={i} cx={f1(c.x)} cy={f1(c.y)} r={f1(r)} fill={i % 2 ? CC.plant : CC.plantDeep} stroke={INK} strokeWidth={Math.max(1, r * 0.04)} />;
        })}
      </g>
    ))}
  </g>
);

/** the hanging blade sign: the channel's mark, small, on the café's own sign bracket */
export const BladeSign: React.FC<{b: B}> = ({b}) => {
  const u = useUid();
  const p = proj(b, v3(3.15, 2.15, FACADE - 0.35));
  const k = scaleAt(b, v3(3.15, 2.15, FACADE - 0.35));
  const r = 0.2 * k;
  const top = proj(b, v3(3.15, 2.62, FACADE - 0.35)), wallP = proj(b, v3(3.15, 2.62, FACADE));
  return (
    <g>
      <line x1={f1(wallP.x)} y1={f1(wallP.y)} x2={f1(top.x)} y2={f1(top.y)} stroke={INK} strokeWidth={f1(Math.max(1.5, k * 0.02))} />
      <line x1={f1(top.x)} y1={f1(top.y)} x2={f1(p.x)} y2={f1(p.y - r)} stroke={INK} strokeWidth={f1(Math.max(1, k * 0.008))} />
      <defs>
        <clipPath id={`${u}blade`}><circle cx={f1(p.x)} cy={f1(p.y)} r={f1(r)} /></clipPath>
      </defs>
      <circle cx={f1(p.x)} cy={f1(p.y)} r={f1(r)} fill="#1D3B3A" stroke={INK} strokeWidth={f1(Math.max(1, k * 0.008))} />
      <circle cx={f1(p.x)} cy={f1(p.y)} r={f1(r * 0.86)} fill="none" stroke="#FFC744" strokeWidth={f1(r * 0.05)} />
      <text x={f1(p.x)} y={f1(p.y + r * 0.2)} textAnchor="middle" fontSize={f1(r * 0.62)} fill="#FFC744" fontFamily="Fredoka Variable, Fredoka, sans-serif" fontWeight={600}>FGW</text>
      <text x={f1(p.x)} y={f1(p.y + r * 0.56)} textAnchor="middle" fontSize={f1(r * 0.17)} fill={CC.cream} fontFamily="Nunito Variable, Nunito, sans-serif" fontWeight={800} letterSpacing={r * 0.01}>FUTURE GOT WEIRD</text>
    </g>
  );
};
export {mixHex, rx};
