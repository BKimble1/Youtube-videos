// V6 café (from V4/V5): an ordinary corner café on a sunny street. Every V6 shot looks at it from the street side (yaw
// near 0), so he always walks screen-left. The shopfront (z = FACADE) has two windows and a glazed door; behind it a
// room with a counter, a barista, two customers on their own devices, the café's ordinary Wi-Fi router on a shelf,
// and (just inside the right-hand end of the right window) a separate receiving and analysis setup: a receiver with
// three antennas and a laptop, its screen facing the window. A CCTV camera on the lamp post at the curb, aimed at the
// shopfront. Metres; y up; the sidewalk runs along x.
import React from 'react';
import {B, depth, P2, proj, projPoly, scaleAt, v3, V3} from '../world/cam';
import {Box, INK, Line3, Poly, rx, ry, rz} from '../world/draw';
import {f1, hash, useUid} from '../lib';

export const FACADE = 3.2;
export const PATH_Z = 1.75;
export const CURB_Z = 0.25;
export const ROOM = {x0: -3.6, x1: 3.1, z1: 7.4, h: 2.9};
export const WIN = {L: [-3.35, -1.05], R: [0.45, 2.8], y0: 0.55, y1: 2.35};
export const DOOR = {x0: -0.85, x1: 0.25, gy0: 0.95, gy1: 2.1};
/** the router, on a small shelf just inside the right-hand window (seen from the street) */
export const ROUTER = v3(2.4, 1.98, FACADE + 0.32);
/** the receiving and analysis setup on a small table just inside the right window */
export const RXT = {x: 2.2, z: FACADE + 0.55, y: 0.76};
export const RXANT = v3(RXT.x - 0.32, RXT.y + 0.22, RXT.z);
/** the laptop's screen (faces the window and the street) */
export const RXL = {x: RXT.x + 0.06, y: RXT.y + 0.16, z: RXT.z + 0.02, w: 0.34, h: 0.22};
/** the CCTV camera: on the left lamp post at the curb (x = LAMPS[0]), on a short arm, aimed at the shopfront */
export const CCTV = {base: v3(-2.35, 3.0, 0.45), head: v3(-2.35, 2.86, 0.74)};
export const CC = {
  sky: '#BFE3EE', skyHi: '#8FCBE3', brick: '#C9705A', brickDeep: '#A9584A', teal: '#2E8F8A', tealDeep: '#1F6E6A', cream: '#FFF4DF',
  glass: '#24495A', interior: '#F3D9B1', wallIn: '#EBD3AE', wallInLo: '#D9BE95', floorIn: '#9A6B47', floorInLo: '#7E5537', ceilIn: '#F6E7CC',
  wood: '#8A5A3B', woodLight: '#B07A52', walk: '#CFCBC2', walkLine: '#B3AEA4', curb: '#9C9890', road: '#4A5157', roadLine: '#E9E3D3',
  awnA: '#F6EEDC', awnB: '#E05D4F', plant: '#4E9A5E', plantDeep: '#357A47', pot: '#B06A45', metal: '#3A4650', lamp: '#FFD27A',
};
const X0 = -14, X1 = 14;

// ------------------------------------------------------------------ the glass openings (clip regions)
export const glassRects = (): [number, number, number, number][] => [
  [WIN.L[0], WIN.L[1], WIN.y0, WIN.y1], [WIN.R[0], WIN.R[1], WIN.y0, WIN.y1], [DOOR.x0 + 0.1, DOOR.x1 - 0.1, DOOR.gy0, DOOR.gy1],
];
/** the openings as one clip path (projected); null if none is in front of the camera */
export const GlassClip: React.FC<{b: B; id: string}> = ({b, id}) => {
  const paths = glassRects().map(([x0, x1, y0, y1]) => projPoly(b, rz(FACADE, x0, x1, y0, y1), 0.02)).filter((P) => P.length > 2);
  return (
    <clipPath id={id}>
      {paths.map((P, i) => <path key={i} d={`M${P.map((p: P2) => `${f1(p.x)},${f1(p.y)}`).join('L')}Z`} />)}
    </clipPath>
  );
};
/** is the camera inside the café */
export const inside = (b: B) => b.c.pos.z > FACADE + 0.005;

// ------------------------------------------------------------------ outside: the façade
export const Facade: React.FC<{b: B; t: number}> = ({b, t}) => {
  const k = scaleAt(b, v3(0, 1.2, FACADE));
  const hw = Math.max(0.8, Math.min(2.4, k * 0.0035));
  const z = FACADE;
  const bricks: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const yy = 2.95 + i * 0.09;
    const A = proj(b, v3(X0, yy, z)), Bq = proj(b, v3(X1, yy, z));
    bricks.push(<line key={`c${i}`} x1={f1(A.x)} y1={f1(A.y)} x2={f1(Bq.x)} y2={f1(Bq.y)} stroke={CC.brickDeep} strokeWidth={hw * 0.7} opacity={0.45} />);
  }
  const upper = [-5.4, -3.2, -1.0, 1.2, 3.4, 5.6].map((x) => (
    <g key={x}>
      <Poly b={b} pts={rz(z - 0.001, x - 0.55, x + 0.55, 3.35, 4.45)} fill={CC.cream} />
      <Poly b={b} pts={rz(z - 0.002, x - 0.47, x + 0.47, 3.43, 4.37)} fill="#8FB9C8" sw={0.6} />
      <Poly b={b} pts={rz(z - 0.003, x - 0.47, x + 0.47, 3.43, 3.7)} fill="#A9CCD8" stroke={false} />
      <Line3 b={b} pts={[v3(x, 3.43, z - 0.003), v3(x, 4.37, z - 0.003)]} stroke={CC.cream} w={0.05} />
      <Poly b={b} pts={rz(z - 0.004, x - 0.62, x + 0.62, 3.27, 3.35)} fill="#E9DCC4" sw={0.6} />
      {/* a window box with flowers on two of them */}
      {(x === -1.0 || x === 3.4) && <Box b={b} x0={x - 0.5} x1={x + 0.5} y0={3.18} y1={3.3} z0={z - 0.16} z1={z - 0.01} front="#6E4A30" side="#5A3B26" top={CC.plant} />}
    </g>
  ));
  const frame = (x0: number, x1: number, y0: number, y1: number, key: string) => (
    <g key={key}>
      <Poly b={b} pts={rz(z - 0.002, x0 - 0.06, x1 + 0.06, y1, y1 + 0.08)} fill={CC.tealDeep} />
      <Poly b={b} pts={rz(z - 0.002, x0 - 0.06, x1 + 0.06, y0 - 0.08, y0)} fill={CC.tealDeep} />
      <Poly b={b} pts={rz(z - 0.002, x0 - 0.06, x0, y0 - 0.08, y1 + 0.08)} fill={CC.tealDeep} />
      <Poly b={b} pts={rz(z - 0.002, x1, x1 + 0.06, y0 - 0.08, y1 + 0.08)} fill={CC.tealDeep} />
    </g>
  );
  return (
    <g>
      <Poly b={b} pts={rz(z, X0, X1, 2.9, 6.5)} fill={CC.brick} />
      {bricks}
      {upper}
      <Poly b={b} pts={rz(z, X0, X1, 0, 2.9)} fill={CC.teal} />
      {/* the neighbours: plain shopfronts either side */}
      <Poly b={b} pts={rz(z - 0.001, -8.6, -4.0, 0.0, 2.6)} fill="#7C8C93" />
      <Poly b={b} pts={rz(z - 0.002, -8.3, -4.3, 0.5, 2.3)} fill="#33505C" sw={0.6} />
      <Poly b={b} pts={rz(z - 0.001, 3.5, 8.4, 0.0, 2.6)} fill="#B9A27C" />
      <Poly b={b} pts={rz(z - 0.002, 3.8, 8.1, 0.5, 2.3)} fill="#33505C" sw={0.6} />
      <Poly b={b} pts={rz(z - 0.003, 4.4, 5.6, 0.9, 1.7)} fill="#E8D8B8" stroke={false} op={0.5} />
      {/* door frame (the glass is a clip opening) */}
      <Poly b={b} pts={rz(z - 0.001, DOOR.x0, DOOR.x1, 0, 2.25)} fill={CC.tealDeep} />
      <Poly b={b} pts={rz(z - 0.0015, DOOR.x0 + 0.1, DOOR.x1 - 0.1, 0.12, DOOR.gy0 - 0.05)} fill="#246F6B" stroke={false} />
      <Poly b={b} pts={rz(z - 0.003, DOOR.x1 - 0.2, DOOR.x1 - 0.14, 1.0, 1.25)} fill="#D9B44A" sw={0.5} />
      {/* fascia */}
      <Poly b={b} pts={rz(z - 0.01, -3.6, 3.0, 2.5, 2.9)} fill="#1D3B3A" />
      <text {...(() => { const p = proj(b, v3(-0.3, 2.62, z - 0.02)); return {x: p.x, y: p.y}; })()} textAnchor="middle" fontSize={f1(k * 0.24)} fill={CC.cream} fontFamily="Fredoka Variable, Fredoka, sans-serif" fontWeight={600} letterSpacing={k * 0.02}>CORNER CAFÉ</text>
      {void t}
    </g>
  );
};
/** frames, glass tint and reflections over the openings (outside) */
export const GlassFront: React.FC<{b: B; t: number}> = ({b, t}) => {
  const z = FACADE;
  const out: React.ReactNode[] = [];
  glassRects().forEach(([x0, x1, y0, y1], i) => {
    out.push(<Poly key={`t${i}`} b={b} pts={rz(z, x0, x1, y0, y1)} fill={CC.glass} stroke={false} op={0.18} />);
    // a reflection band that slides with the viewpoint (glass reads as glass)
    const s = ((b.c.pos.x * 0.35 + i * 0.7) % 1 + 1) % 1;
    const xa = x0 + (x1 - x0) * s;
    out.push(<Poly key={`r${i}`} b={b} pts={[v3(xa, y1, z - 0.001), v3(Math.min(x1, xa + 0.35), y1, z - 0.001), v3(Math.max(x0, xa - 0.25), y0, z - 0.001), v3(Math.max(x0, xa - 0.6), y0, z - 0.001)]} fill="#FFFFFF" stroke={false} op={0.1} />);
  });
  const frame = (x0: number, x1: number, y0: number, y1: number, key: string) => (
    <g key={key}>
      <Poly b={b} pts={rz(z - 0.002, x0 - 0.06, x1 + 0.06, y1, y1 + 0.08)} fill={CC.tealDeep} />
      <Poly b={b} pts={rz(z - 0.002, x0 - 0.06, x1 + 0.06, y0 - 0.08, y0)} fill={CC.tealDeep} />
      <Poly b={b} pts={rz(z - 0.002, x0 - 0.06, x0, y0 - 0.08, y1 + 0.08)} fill={CC.tealDeep} />
      <Poly b={b} pts={rz(z - 0.002, x1, x1 + 0.06, y0 - 0.08, y1 + 0.08)} fill={CC.tealDeep} />
    </g>
  );
  void t;
  return (
    <g>
      {out}
      {frame(WIN.L[0], WIN.L[1], WIN.y0, WIN.y1, 'fl')}
      {frame(WIN.R[0], WIN.R[1], WIN.y0, WIN.y1, 'fr')}
      {/* awning over the windows: striped, scalloped edge */}
      {[[WIN.L[0] - 0.15, WIN.L[1] + 0.15], [WIN.R[0] - 0.15, WIN.R[1] + 0.15]].map(([a, c], j) => {
        const n = 8;
        return (
          <g key={`aw${j}`}>
            {Array.from({length: n}, (_, i) => {
              const xa = a + ((c - a) * i) / n, xb = a + ((c - a) * (i + 1)) / n;
              return <Poly key={i} b={b} pts={[v3(xa, 2.48, z - 0.01), v3(xb, 2.48, z - 0.01), v3(xb, 2.28, z - 0.55), v3(xa, 2.28, z - 0.55)]} fill={i % 2 ? CC.awnA : CC.awnB} sw={0.6} />;
            })}
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ inside
export const Interior: React.FC<{b: B; t: number}> = ({b, t}) => {
  const z0 = FACADE, z1 = ROOM.z1, H = ROOM.h;
  const k = scaleAt(b, v3(0, 1.4, 5));
  const hw = Math.max(0.8, Math.min(2.4, k * 0.003));
  const boards: React.ReactNode[] = [];
  for (let x = ROOM.x0 + 0.2; x < ROOM.x1; x += 0.24) boards.push(<Line3 key={x.toFixed(2)} b={b} pts={[v3(x, 0.001, z0), v3(x, 0.001, z1)]} stroke={CC.floorInLo} w={hw} px op={0.45} />);
  const pend = [-2.2, -0.6, 1.2, 2.4].map((x, i) => {
    const zz = 4.6 + (i % 2) * 0.9;
    return (
      <g key={x}>
        <Line3 b={b} pts={[v3(x, H, zz), v3(x, 2.15, zz)]} stroke={INK} w={0.012} />
        <Poly b={b} pts={[v3(x - 0.17, 2.0, zz), v3(x + 0.17, 2.0, zz), v3(x + 0.08, 2.16, zz), v3(x - 0.08, 2.16, zz)]} fill={CC.lamp} sw={0.6} />
      </g>
    );
  });
  return (
    <g>
      <Poly b={b} pts={rz(z1, ROOM.x0, ROOM.x1, 0, H)} fill={CC.wallIn} />
      {b.c.pos.x > ROOM.x0 && <Poly b={b} pts={rx(ROOM.x0, z0, z1, 0, H)} fill={CC.wallInLo} />}
      {b.c.pos.x < ROOM.x1 && <Poly b={b} pts={rx(ROOM.x1, z0, z1, 0, H)} fill={CC.wallInLo} />}
      <Poly b={b} pts={ry(H, ROOM.x0, ROOM.x1, z0, z1)} fill={CC.ceilIn} />
      <Poly b={b} pts={ry(0, ROOM.x0, ROOM.x1, z0, z1)} fill={CC.floorIn} />
      {boards}
      {/* back wall: menu boards, shelves with jars, the router's shelf */}
      {[-1.4, -0.2].map((x) => (
        <g key={x}>
          <Poly b={b} pts={rz(z1 - 0.01, x, x + 1.0, 1.6, 2.3)} fill="#2E3B34" sw={0.8} />
          {Array.from({length: 4}, (_, n) => <Line3 key={n} b={b} pts={[v3(x + 0.1, 2.15 - n * 0.13, z1 - 0.012), v3(x + 0.35 + 0.45 * hash(n + Math.round(x * 10), 3), 2.15 - n * 0.13, z1 - 0.012)]} stroke="#F4EBD3" w={hw * 1.2} px />)}
        </g>
      ))}
      <Box b={b} x0={1.0} x1={2.9} y0={1.84} y1={1.88} z0={z1 - 0.25} z1={z1 - 0.01} front={CC.wood} side="#704630" top={CC.woodLight} />
      {[1.15, 1.35, 1.55].map((x, i) => <Box key={x} b={b} x0={x} x1={x + 0.12} y0={1.88} y1={2.05} z0={z1 - 0.18} z1={z1 - 0.06} front={['#E9C46A', '#F4A261', '#8AB17D'][i]} side="#B98D4A" top="#F7E6C4" />)}
      <Box b={b} x0={-2.8} x1={-1.8} y0={1.3} y1={1.34} z0={z1 - 0.25} z1={z1 - 0.01} front={CC.wood} side="#704630" top={CC.woodLight} />
      {/* the router's little shelf inside the right window */}
      <Box b={b} x0={ROUTER.x - 0.25} x1={ROUTER.x + 0.25} y0={ROUTER.y - 0.1} y1={ROUTER.y - 0.06} z0={ROUTER.z - 0.18} z1={ROUTER.z + 0.12} front={CC.wood} side="#704630" top={CC.woodLight} />
      {/* counter with an espresso machine and a cake stand */}
      <Box b={b} x0={-1.6} x1={2.0} y0={0} y1={1.02} z0={6.5} z1={6.95} front={CC.wood} side="#704630" top={CC.woodLight} />
      <Box b={b} x0={0.6} x1={1.2} y0={1.02} y1={1.42} z0={6.62} z1={6.9} front="#C9D1D6" side="#9AA6AD" top="#E3E8EB" />
      <Box b={b} x0={-1.1} x1={-0.75} y0={1.02} y1={1.2} z0={6.62} z1={6.86} front="#F7F1E6" side="#DCD3C2" top="#F2B8A8" />
      {pend}
      {void t}
    </g>
  );
};
/** the counter's front face, drawn after the barista so the counter hides his legs */
export const CounterFront: React.FC<{b: B}> = ({b}) => (
  <Box b={b} x0={-1.6} x1={2.0} y0={0} y1={1.02} z0={6.5} z1={6.95} front={CC.wood} side="#704630" top={CC.woodLight} />
);
/** a café table (round top on a post) with a chair, at (x, z) */
export const CafeTable: React.FC<{b: B; x: number; z: number; chairX?: number}> = ({b, x, z, chairX}) => (
  <g>
    {chairX !== undefined && (
      <g>
        <Line3 b={b} pts={[v3(chairX, 0, z), v3(chairX, 0.46, z)]} stroke={CC.metal} w={0.03} />
        <Poly b={b} pts={[v3(chairX - 0.2, 0.46, z - 0.2), v3(chairX + 0.2, 0.46, z - 0.2), v3(chairX + 0.2, 0.48, z + 0.2), v3(chairX - 0.2, 0.48, z + 0.2)]} fill="#55636D" />
      </g>
    )}
    <Line3 b={b} pts={[v3(x, 0, z), v3(x, 0.72, z)]} stroke={CC.metal} w={0.04} />
    <Box b={b} x0={x - 0.35} x1={x + 0.35} y0={0.72} y1={0.76} z0={z - 0.3} z1={z + 0.3} front="#F1EDE4" side="#D5CFC2" top="#FBF8F2" />
  </g>
);
/** a laptop on a table top at (x, y, z): base and lid; `face` 'street' (screen toward -z) or 'room' (toward +z) */
export const Laptop: React.FC<{b: B; x: number; y: number; z: number; face: 'street' | 'room'; screen?: string}> = ({b, x, y, z, face, screen = '#1E3A55'}) => {
  const s = face === 'room' ? 1 : -1;
  return (
    <g>
      <Box b={b} x0={x - 0.17} x1={x + 0.17} y0={y} y1={y + 0.015} z0={z - 0.12} z1={z + 0.12} front="#B8C2C8" side="#9AA6AD" top="#D3DADE" />
      <Poly b={b} pts={[v3(x - 0.17, y + 0.015, z - s * 0.12), v3(x + 0.17, y + 0.015, z - s * 0.12), v3(x + 0.17, y + 0.235, z - s * 0.16), v3(x - 0.17, y + 0.235, z - s * 0.16)]} fill={(face === 'room') === (b.c.pos.z > z) ? screen : '#C9D1D6'} />
    </g>
  );
};
/** the router on its shelf (a white box, two antennas, green LEDs) */
export const RouterBox: React.FC<{b: B; t: number}> = ({b, t}) => {
  const p = ROUTER;
  return (
    <g>
      <Box b={b} x0={p.x - 0.14} x1={p.x + 0.14} y0={p.y - 0.06} y1={p.y} z0={p.z - 0.12} z1={p.z + 0.02} front="#F2F4F5" side="#C9D1D6" top="#FFFFFF" />
      {[-0.09, 0.09].map((dx) => <Line3 key={dx} b={b} pts={[v3(p.x + dx, p.y, p.z - 0.04), v3(p.x + dx * 1.3, p.y + 0.18, p.z - 0.04)]} stroke={INK} w={0.016} />)}
      {[-0.06, -0.02, 0.02, 0.06].map((dx, i) => <Poly key={dx} b={b} pts={rz(p.z - 0.121, p.x + dx - 0.008, p.x + dx + 0.008, p.y - 0.035, p.y - 0.022)} fill={(Math.floor(t * 8 + i * 1.7) % 3) ? '#3BDB84' : '#BFFFD8'} stroke={false} />)}
    </g>
  );
};
/** the receiving and analysis setup: small table, receiver box with three antennas, laptop (screen toward the window) */
export const RxStation: React.FC<{b: B; t: number; screen?: React.ReactNode}> = ({b, t, screen}) => {
  const u = useUid();
  const T = RXT;
  const r = rxScreenRect(b);
  const seeScreen = b.c.pos.z < RXL.z;
  return (
    <g>
      <Line3 b={b} pts={[v3(T.x, 0, T.z), v3(T.x, T.y - 0.03, T.z)]} stroke={CC.metal} w={0.04} />
      <Box b={b} x0={T.x - 0.45} x1={T.x + 0.45} y0={T.y - 0.035} y1={T.y} z0={T.z - 0.28} z1={T.z + 0.28} front="#3E3027" side="#33271F" top="#5B4636" />
      {/* the receiver: a dark box with three short antennas */}
      <Box b={b} x0={RXANT.x - 0.08} x1={RXANT.x + 0.08} y0={T.y} y1={T.y + 0.09} z0={RXANT.z - 0.06} z1={RXANT.z + 0.06} front="#22313B" side="#1A262E" top="#33444F" />
      {[-0.05, 0, 0.05].map((dx) => <Line3 key={dx} b={b} pts={[v3(RXANT.x + dx, T.y + 0.09, RXANT.z), v3(RXANT.x + dx * 1.6, T.y + 0.25, RXANT.z)]} stroke={INK} w={0.012} />)}
      <Poly b={b} pts={rz(RXANT.z - 0.061, RXANT.x - 0.05, RXANT.x - 0.03, T.y + 0.05, T.y + 0.065)} fill={Math.floor(t * 6) % 2 ? '#5CE1FF' : '#2A8FB0'} stroke={false} />
      <Laptop b={b} x={RXL.x} y={T.y} z={RXL.z - 0.02} face="street" />
      {seeScreen && screen && (
        <g>
          <defs><clipPath id={`${u}rxs`}><rect x={r.x} y={r.y} width={r.w} height={r.h} /></clipPath></defs>
          <g clipPath={`url(#${u}rxs)`}>{screen}</g>
        </g>
      )}
    </g>
  );
};
/** the RX laptop's screen as a screen-space rect (its lid's projected corners, inset to the bezel) */
export const rxScreenRect = (b: B) => {
  const x = RXL.x, y = RXT.y, z = RXL.z - 0.02;
  const P = [v3(x - 0.155, y + 0.03, z + 0.118), v3(x + 0.155, y + 0.03, z + 0.118), v3(x + 0.155, y + 0.22, z + 0.153), v3(x - 0.155, y + 0.22, z + 0.153)].map((p) => proj(b, p));
  const xs = P.map((p) => p.x), ys = P.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
};

// ------------------------------------------------------------------ the street
export const Sky: React.FC<{b: B}> = ({b}) => {
  const u = useUid();
  void b;
  return (
    <g>
      <defs>
        <linearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={CC.skyHi} />
          <stop offset="0.6" stopColor={CC.sky} />
          <stop offset="1" stopColor="#F4EAD2" />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${u}sky)`} />
    </g>
  );
};
export const Ground: React.FC<{b: B}> = ({b}) => {
  const k = scaleAt(b, v3(0, 0, PATH_Z));
  const hw = Math.max(0.8, Math.min(2.6, k * 0.0028));
  const slabs: React.ReactNode[] = [];
  for (let x = X0; x <= X1; x += 1.1) slabs.push(<Line3 key={`s${x.toFixed(1)}`} b={b} pts={[v3(x, 0, CURB_Z), v3(x, 0, FACADE)]} stroke={CC.walkLine} w={hw} px />);
  return (
    <g>
      <Poly b={b} pts={ry(-0.14, X0, X1, -6.5, CURB_Z)} fill={CC.road} />
      {[-1.4, -4.6].map((zz) => <Poly key={zz} b={b} pts={ry(-0.139, X0, X1, zz, zz + 0.08)} fill={CC.roadLine} stroke={false} op={0.7} />)}
      <Poly b={b} pts={ry(0, X0, X1, CURB_Z, FACADE)} fill={CC.walk} />
      {slabs}
      {[1.0, 2.1].map((z) => <Line3 key={z} b={b} pts={[v3(X0, 0, z), v3(X1, 0, z)]} stroke={CC.walkLine} w={hw} px />)}
      <Poly b={b} pts={rz(CURB_Z, X0, X1, -0.14, 0)} fill={CC.curb} />
      {/* the café's light spilling onto the sidewalk */}
      {glassRects().slice(0, 2).map(([x0, x1], i) => <Poly key={`sp${i}`} b={b} pts={ry(0.002, x0, x1, FACADE - 1.3, FACADE)} fill="#FFE6B0" stroke={false} op={0.22} />)}
    </g>
  );
};
/** across the road (only seen from inside): a row of shops and trees */
export const Opposite: React.FC<{b: B}> = ({b}) => {
  const z = -6.5;
  return (
    <g>
      <Poly b={b} pts={rz(z, X0, X1, -0.14, 6)} fill="#D9C7A6" />
      {[-6, -3.6, -1.2, 1.2, 3.6, 6].map((x, i) => (
        <g key={x}>
          <Poly b={b} pts={rz(z + 0.01, x - 1.0, x + 1.0, 0, 2.5)} fill={['#7C8C93', '#C9705A', '#5E7A6B', '#B9A27C', '#6B7FA3', '#C98B5A'][i]} />
          <Poly b={b} pts={rz(z + 0.02, x - 0.8, x + 0.8, 0.5, 2.2)} fill="#33505C" sw={0.6} />
          {[3.2, 4.4].map((y) => <Poly key={y} b={b} pts={rz(z + 0.01, x - 0.45, x + 0.45, y, y + 0.8)} fill="#8FB9C8" sw={0.6} />)}
        </g>
      ))}
      <Poly b={b} pts={ry(-0.13, X0, X1, z, -4.9)} fill={CC.walk} />
      {[-5, -1, 3].map((x) => (
        <g key={x}>
          <Line3 b={b} pts={[v3(x, -0.13, -4.8), v3(x, 2.0, -4.8)]} stroke="#5B4636" w={0.12} />
          {[0, 1, 2].map((j) => {
            const c = proj(b, v3(x + (j - 1) * 0.35, 2.5 + 0.25 * (j % 2), -4.8));
            return <circle key={j} cx={f1(c.x)} cy={f1(c.y)} r={f1(scaleAt(b, v3(x, 2.5, -4.8)) * 0.7)} fill={j % 2 ? CC.plant : CC.plantDeep} stroke={INK} strokeWidth={1} />;
          })}
        </g>
      ))}
    </g>
  );
};
/** foreground: lamp posts and planters (close to the lens, they pass with parallax) */
export const LAMPS = [-2.35, 7.2];
export const Fore: React.FC<{b: B}> = ({b}) => (
  <g>
    {LAMPS.map((x) => (
      <g key={x}>
        <Line3 b={b} pts={[v3(x, -0.14, 0.45), v3(x, 4.6, 0.45)]} stroke={INK} w={0.12} />
        <Line3 b={b} pts={[v3(x, -0.14, 0.45), v3(x, 4.6, 0.45)]} stroke="#2E4A55" w={0.095} />
      </g>
    ))}
    {[6.3, -5.2].map((x) => (
      <g key={x}>
        <Box b={b} x0={x - 0.3} x1={x + 0.3} y0={0} y1={0.55} z0={0.5} z1={1.0} front={CC.pot} side="#8E5236" top="#6B3F2A" />
        {[0, 1, 2, 3, 4].map((i) => {
          const w = v3(x - 0.22 + i * 0.11, 0.75 + 0.12 * hash(i, 5), 0.7);
          if (depth(b, w) < 0.3) return null; // beside or behind the lens
          const c = proj(b, w);
          const r = scaleAt(b, v3(x, 0.8, 0.7)) * (0.17 + 0.05 * hash(i, 6));
          return <circle key={i} cx={f1(c.x)} cy={f1(c.y)} r={f1(r)} fill={i % 2 ? CC.plant : CC.plantDeep} stroke={INK} strokeWidth={Math.max(1, r * 0.04)} />;
        })}
      </g>
    ))}
  </g>
);
/** the CCTV camera on the lamp post: an arm from the post and a housing (an oriented box, its lens at the front) aimed
 *  at `aim` (it follows him); faces are drawn back to front, only those facing the lens */
export const Cctv: React.FC<{b: B; aim: V3}> = ({b, aim}) => {
  const h = CCTV.head;
  if (depth(b, h) < 0.25) return null;
  const d = {x: aim.x - h.x, y: aim.y - h.y, z: aim.z - h.z};
  const dl = Math.hypot(d.x, d.y, d.z) || 1;
  const f = {x: d.x / dl, y: d.y / dl, z: d.z / dl};
  const rl = Math.hypot(f.z, f.x) || 1;
  const rt = {x: f.z / rl, y: 0, z: -f.x / rl};
  const up = {x: rt.y * f.z - rt.z * f.y, y: rt.z * f.x - rt.x * f.z, z: rt.x * f.y - rt.y * f.x};
  const L = 0.44, W = 0.17, H = 0.16;
  const P = (a: number, c: number, e: number): V3 => v3(h.x + f.x * a * L / 2 + rt.x * c * W / 2 + up.x * e * H / 2, h.y + f.y * a * L / 2 + rt.y * c * W / 2 + up.y * e * H / 2, h.z + f.z * a * L / 2 + rt.z * c * W / 2 + up.z * e * H / 2);
  const faces: {pts: V3[]; n: V3; fill: string; front?: boolean}[] = [
    {pts: [P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1)], n: f, fill: '#2B3A44', front: true},
    {pts: [P(-1, -1, -1), P(-1, 1, -1), P(-1, 1, 1), P(-1, -1, 1)], n: {x: -f.x, y: -f.y, z: -f.z}, fill: '#DDE3E6'},
    {pts: [P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)], n: up, fill: '#F7F9FA'},
    {pts: [P(-1, -1, -1), P(1, -1, -1), P(1, 1, -1), P(-1, 1, -1)], n: {x: -up.x, y: -up.y, z: -up.z}, fill: '#B9C4CA'},
    {pts: [P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1), P(-1, 1, 1)], n: rt, fill: '#E6EBED'},
    {pts: [P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1)], n: {x: -rt.x, y: -rt.y, z: -rt.z}, fill: '#D3DADE'},
  ];
  const cam = b.c.pos;
  const vis = faces
    .map((q) => {
      const c = q.pts.reduce((a, p) => v3(a.x + p.x / 4, a.y + p.y / 4, a.z + p.z / 4), v3(0, 0, 0));
      return {...q, c, facing: q.n.x * (cam.x - c.x) + q.n.y * (cam.y - c.y) + q.n.z * (cam.z - c.z) > 0};
    })
    .filter((q) => q.facing)
    .sort((a, c) => depth(b, c.c) - depth(b, a.c));
  const k = scaleAt(b, h);
  const lw = Math.max(1, k * 0.004);
  const lens = proj(b, v3(h.x + f.x * (L / 2 + 0.002), h.y + f.y * (L / 2 + 0.002), h.z + f.z * (L / 2 + 0.002)));
  const led = proj(b, P(-0.6, 0.6, 1.05));
  return (
    <g>
      <Line3 b={b} pts={[v3(CCTV.base.x, CCTV.base.y, CCTV.base.z), v3(h.x, h.y + H * 0.6, h.z - 0.05)]} stroke={INK} w={0.035} />
      <Line3 b={b} pts={[v3(CCTV.base.x, CCTV.base.y, CCTV.base.z), v3(h.x, h.y + H * 0.6, h.z - 0.05)]} stroke="#C9D3D9" w={0.025} />
      {vis.map((q, i) => {
        const pp = q.pts.map((p) => proj(b, p));
        return <path key={i} d={`M${pp.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}Z`} fill={q.fill} stroke={INK} strokeWidth={lw} strokeLinejoin="round" />;
      })}
      {vis.some((q) => q.front) && <circle cx={f1(lens.x)} cy={f1(lens.y)} r={f1(k * 0.035)} fill="#0B1218" stroke="#5B6E7A" strokeWidth={lw} />}
      <circle cx={f1(led.x)} cy={f1(led.y)} r={f1(Math.max(1.5, k * 0.011))} fill="#FF3B3B" />
    </g>
  );
};
/** the hanging blade sign (the channel's mark, small) on the left-hand corner */
export const BladeSign4: React.FC<{b: B}> = ({b}) => {
  const X = -3.75;
  if (depth(b, v3(X, 2.15, FACADE - 0.35)) < 0.3) return null;
  const p = proj(b, v3(X, 2.15, FACADE - 0.35));
  const k = scaleAt(b, v3(X, 2.15, FACADE - 0.35));
  const r = 0.2 * k;
  const top = proj(b, v3(X, 2.62, FACADE - 0.35)), wallP = proj(b, v3(X, 2.62, FACADE));
  return (
    <g>
      <line x1={f1(wallP.x)} y1={f1(wallP.y)} x2={f1(top.x)} y2={f1(top.y)} stroke={INK} strokeWidth={f1(Math.max(1.5, k * 0.02))} />
      <line x1={f1(top.x)} y1={f1(top.y)} x2={f1(p.x)} y2={f1(p.y - r)} stroke={INK} strokeWidth={f1(Math.max(1, k * 0.008))} />
      <circle cx={f1(p.x)} cy={f1(p.y)} r={f1(r)} fill="#1D3B3A" stroke={INK} strokeWidth={f1(Math.max(1, k * 0.008))} />
      <circle cx={f1(p.x)} cy={f1(p.y)} r={f1(r * 0.86)} fill="none" stroke="#FFC744" strokeWidth={f1(r * 0.05)} />
      <text x={f1(p.x)} y={f1(p.y + r * 0.2)} textAnchor="middle" fontSize={f1(r * 0.62)} fill="#FFC744" fontFamily="Fredoka Variable, Fredoka, sans-serif" fontWeight={600}>FGW</text>
      <text x={f1(p.x)} y={f1(p.y + r * 0.56)} textAnchor="middle" fontSize={f1(r * 0.17)} fill={CC.cream} fontFamily="Nunito Variable, Nunito, sans-serif" fontWeight={800} letterSpacing={r * 0.01}>FUTURE GOT WEIRD</text>
    </g>
  );
};
export type {V3};
