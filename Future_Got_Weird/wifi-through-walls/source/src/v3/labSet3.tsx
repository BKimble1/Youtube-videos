// V3 lab: one building cut open along a vertical plane (dollhouse section), so both rooms and the dividing wall's
// thickness show at once. The wall is 0.32 m of reinforced concrete (formwork seams and tie holes on its faces, the
// cut face shows the concrete section with its rebar). Left: the office he hides in, watched by a security camera
// mounted high on the dividing wall (its blind spot is the strip right beside the wall). Right: the RF lab, with the
// research radio (FMCW unit, T-shaped antenna array, RF-Pose style) aimed at the wall and the observation stand: the
// security camera's picture above, the radio's skeleton below (the RF-Pose demonstration format).
// Metres; floor y = 0; the cut plane is z = Z_CUT. The floors run on toward the camera so a low or wide shot never
// shows an empty slab at the bottom of the frame.
import React from 'react';
import {B, depth, proj, scaleAt, v3, V3} from '../world/cam';
import {Box, INK, Line3, Poly, rx, ry, rz} from '../world/draw';
import {clamp, f1, hash, mixHex, useUid} from '../lib';

export const Z_CUT = 0.6;
export const Z_BACK = 3.6;
export const ROOM_H = 2.7;
export const WALL = {x0: -0.16, x1: 0.16};
/** his office's far (left) wall: the security camera sees it */
export const OFFICE_X = -3.0;
export const FLOOR_NEAR = -5;
/** an ordinary Wi-Fi router on the office's filing cabinet */
export const OFFICE_ROUTER = v3(-0.9, 1.06, Z_BACK - 0.12);
export const C = {
  hideWall: '#EADBC0', hideWallLo: '#DCC8A6', hideFloor: '#C39A6B', hideFloorDeep: '#A57C50', hideBase: '#F7EFDF',
  devWall: '#D3E4EA', devFloor: '#A4B9C2', devFloorDeep: '#8DA3AD', devBase: '#EEF6F8',
  ceil: '#E6E9E4', ceilDev: '#DCE5E8',
  conc: '#AEB5B8', concLo: '#9CA4A8', concSeam: '#8A9296', concCut: '#8F989D', concDot: '#6F787D', rebar: '#5A3E33', slab: '#98A2A7',
  metal: '#C9D3D9', metalDeep: '#93A1AA', dark: '#22313B', darker: '#16222B', screen: '#050C14', teal: '#1CA7A0', amber: '#FFC744',
  rf: '#5CE1FF',
};

// ------------------------------------------------------------------ fixed props
/** the research radio: tripod mast, FMCW box, T-shaped antenna array facing the wall (yawed toward the camera) */
export const ANT = {x: 1.32, z: 2.35, y: 1.04, yaw: 58};
export const antAxes = () => {
  const a = (ANT.yaw * Math.PI) / 180;
  return {n: v3(-Math.cos(a), 0, -Math.sin(a)), h: v3(Math.sin(a), 0, -Math.cos(a))};
};
export const antPt = (u: number, yy: number, nn = 0) => {
  const {n, h} = antAxes();
  return v3(ANT.x + h.x * u + n.x * nn, yy, ANT.z + h.z * u + n.z * nn);
};
/** the observation stand: the camera picture (top) and the RF skeleton (bottom), screens facing the camera */
export const STAND = {x: 0.6, z: 0.95};
export const RFMON = {x: STAND.x, y: 1.26, z: STAND.z, w: 0.84, h: 0.64};
export const CAMMON = {x: STAND.x, y: 1.94, z: STAND.z, w: 0.6, h: 0.38};
/** the security camera on the office side of the dividing wall: lens position and aim */
// it hangs right above his hiding place and looks out into the room (pitched down 30 deg): the strip along the wall
// below it is out of its picture
export const CCTV = {pos: v3(WALL.x0 - 0.16, 2.35, 1.12), aim: v3(-2.6, 1.12, 0.95)};

export type Rect = {x: number; y: number; w: number; h: number};
export const screenRect = (b: B, m: {x: number; y: number; z: number; w: number; h: number}): Rect => {
  const tl = proj(b, v3(m.x - m.w / 2, m.y + m.h / 2, m.z)), br = proj(b, v3(m.x + m.w / 2, m.y - m.h / 2, m.z));
  return {x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y};
};

// ------------------------------------------------------------------ rooms
/** the office: floor, back wall with its door, the far wall, ceiling (also drawn by the security camera's own view) */
export const Office: React.FC<{b: B; front?: boolean}> = ({b, front}) => {
  const hw = Math.max(0.8, Math.min(3, scaleAt(b, v3(-1, 1.3, 1.5)) * 0.0022));
  return (
    <g>
      <Poly b={b} pts={rx(OFFICE_X, FLOOR_NEAR, Z_BACK, 0, ROOM_H)} fill={C.hideWallLo} />
      <Poly b={b} pts={rz(Z_BACK, OFFICE_X, WALL.x0, 0, ROOM_H)} fill={C.hideWall} />
      <Poly b={b} pts={rz(Z_BACK - 0.001, OFFICE_X, WALL.x0, 0, 0.12)} fill={C.hideBase} sw={0.6} />
      {/* door, frame and handle */}
      <Poly b={b} pts={rz(Z_BACK - 0.002, -2.45, -1.55, 0, 2.08)} fill="#F4EEE2" />
      <Poly b={b} pts={rz(Z_BACK - 0.003, -2.38, -1.62, 0, 2.02)} fill="#B9855A" />
      <Poly b={b} pts={rz(Z_BACK - 0.004, -2.3, -1.7, 1.08, 1.86)} fill="#A97549" stroke={false} />
      <Poly b={b} pts={rz(Z_BACK - 0.004, -2.3, -1.7, 0.14, 0.92)} fill="#A97549" stroke={false} />
      <Poly b={b} pts={rz(Z_BACK - 0.005, -1.74, -1.66, 0.98, 1.02)} fill={C.amber} sw={0.6} />
      {/* a pin board and a filing cabinet: something to read the room by */}
      <Poly b={b} pts={rz(Z_BACK - 0.002, -1.2, -0.6, 1.3, 1.85)} fill="#C79B62" sw={0.8} />
      {[0, 1, 2, 3].map((i) => <Poly key={i} b={b} pts={rz(Z_BACK - 0.004, -1.14 + (i % 2) * 0.27, -0.94 + (i % 2) * 0.27, 1.38 + Math.floor(i / 2) * 0.22, 1.55 + Math.floor(i / 2) * 0.22)} fill={['#FFF6D6', '#E7F1FF', '#FFE3E3', '#F2FFE8'][i]} sw={0.5} />)}
      <Box b={b} x0={-2.95} x1={-2.5} y0={0} y1={1.3} z0={Z_BACK - 0.6} z1={Z_BACK - 0.02} front="#8E9AA2" side="#7A868E" top="#A9B4BB" />
      {/* the office's ordinary Wi-Fi router, on the cabinet */}
      <Box b={b} x0={OFFICE_ROUTER.x - 0.22} x1={OFFICE_ROUTER.x + 0.22} y0={OFFICE_ROUTER.y - 0.06} y1={OFFICE_ROUTER.y - 0.03} z0={Z_BACK - 0.2} z1={Z_BACK - 0.002} front="#B9855A" side="#A97549" top="#CFA27A" />
      <Box b={b} x0={OFFICE_ROUTER.x - 0.13} x1={OFFICE_ROUTER.x + 0.13} y0={OFFICE_ROUTER.y - 0.03} y1={OFFICE_ROUTER.y + 0.03} z0={OFFICE_ROUTER.z - 0.06} z1={OFFICE_ROUTER.z + 0.08} front="#F2F4F5" side="#C9D1D6" top="#FFFFFF" />
      {[-0.09, 0.09].map((dx) => <Line3 key={dx} b={b} pts={[v3(OFFICE_ROUTER.x + dx, OFFICE_ROUTER.y + 0.03, OFFICE_ROUTER.z + 0.05), v3(OFFICE_ROUTER.x + dx * 1.3, OFFICE_ROUTER.y + 0.2, OFFICE_ROUTER.z + 0.05)]} stroke={INK} w={0.016} />)}
      {/* on the far wall: a window (daylight) and a wall clock */}
      <Poly b={b} pts={rx(OFFICE_X + 0.002, 1.2, 2.4, 0.95, 2.05)} fill="#F4EEE2" />
      <Poly b={b} pts={rx(OFFICE_X + 0.004, 1.28, 2.32, 1.03, 1.97)} fill="#BFE3EE" sw={0.6} />
      <Line3 b={b} pts={[v3(OFFICE_X + 0.005, 1.5, 1.8), v3(OFFICE_X + 0.005, 1.5, 1.8)]} stroke="#F4EEE2" w={0.03} />
      <Poly b={b} pts={rx(OFFICE_X + 0.005, 1.78, 1.82, 1.03, 1.97)} fill="#F4EEE2" stroke={false} />
      <Poly b={b} pts={rx(OFFICE_X + 0.002, 0.7, 0.95, 2.05, 2.3)} fill="#FFFFFF" sw={0.8} />
      <Poly b={b} pts={ry(0, OFFICE_X, WALL.x0, FLOOR_NEAR, Z_BACK)} fill={C.hideFloor} />
      {!front && <Poly b={b} pts={ry(0, WALL.x0, WALL.x1, FLOOR_NEAR, Z_CUT)} fill="#B7BCBE" />}
      {[-3.4, -2.2, -1, 0.2, 1.25, 2.4].map((z) => <Line3 key={z} b={b} pts={[v3(OFFICE_X, 0, z), v3(WALL.x0, 0, z)]} stroke={C.hideFloorDeep} w={hw} px op={0.55} />)}
      <Poly b={b} pts={ry(ROOM_H, OFFICE_X, WALL.x0, Z_CUT, Z_BACK)} fill={C.ceil} />
      <Poly b={b} pts={ry(ROOM_H - 0.01, -1.85, -1.05, 1.6, 2.4)} fill="#FFF9E8" sw={0.6} />
      {/* the room's front wall: only the security camera sees it (the cutaway removes it for us) */}
      {front && <Poly b={b} pts={rz(Z_CUT, OFFICE_X, WALL.x0, 0, ROOM_H)} fill={C.hideWall} />}
    </g>
  );
};

/** the RF lab's room */
export const DevRoom: React.FC<{b: B}> = ({b}) => {
  const hw = Math.max(0.8, Math.min(3, scaleAt(b, v3(1, 1.3, 1.5)) * 0.0022));
  const X1 = 4.6;
  return (
    <g>
      <Poly b={b} pts={rz(Z_BACK, WALL.x1, X1, 0, ROOM_H)} fill={C.devWall} />
      <Poly b={b} pts={rz(Z_BACK - 0.001, WALL.x1, X1, 1.02, 1.1)} fill={C.teal} sw={0.6} />
      <Poly b={b} pts={rz(Z_BACK - 0.001, WALL.x1, X1, 0, 0.12)} fill={C.devBase} sw={0.6} />
      {/* whiteboard with a plot, back bench with an instrument */}
      <Poly b={b} pts={rz(Z_BACK - 0.002, 2.0, 3.25, 1.3, 2.1)} fill="#FBFDFD" />
      <Line3 b={b} pts={Array.from({length: 13}, (_, i) => v3(2.1 + i * 0.085, 1.55 + 0.22 * Math.exp(-((i - 6) ** 2) / 5) + 0.03 * Math.sin(i * 1.7), Z_BACK - 0.004))} stroke="#3A5FA0" w={hw * 1.2} px />
      <Box b={b} x0={2.6} x1={4.4} y0={0} y1={0.9} z0={Z_BACK - 0.6} z1={Z_BACK - 0.01} front="#C2D2D8" side="#AFC1C8" top="#E9F0F2" />
      <Box b={b} x0={2.85} x1={3.25} y0={0.9} y1={1.15} z0={Z_BACK - 0.45} z1={Z_BACK - 0.15} front="#5C6F7B" side="#4A5B66" top="#7E909B" />
      <Poly b={b} pts={ry(0, WALL.x1, X1, FLOOR_NEAR, Z_BACK)} fill={C.devFloor} />
      {[-3.5, -2.3, -1.1, 0.1, 1.3, 2.5].map((z) => <Line3 key={z} b={b} pts={[v3(WALL.x1, 0, z), v3(X1, 0, z)]} stroke={C.devFloorDeep} w={hw} px op={0.4} />)}
      {[0.75, 1.55, 2.35, 3.15].map((x) => <Line3 key={x} b={b} pts={[v3(x, 0, FLOOR_NEAR), v3(x, 0, Z_BACK)]} stroke={C.devFloorDeep} w={hw} px op={0.4} />)}
      <Poly b={b} pts={ry(ROOM_H, WALL.x1, X1, Z_CUT, Z_BACK)} fill={C.ceilDev} />
      <Poly b={b} pts={ry(ROOM_H - 0.01, 0.9, 1.7, 1.5, 2.3)} fill="#F4FBFF" sw={0.6} />
    </g>
  );
};

// ------------------------------------------------------------------ the concrete wall
const seams = (b: B, x: number, hw: number, op: number) => {
  // formwork panel seams (1.2 m panels, 0.9 m lifts) and tie holes on a long face of the wall
  const out: React.ReactNode[] = [];
  for (let z = Z_CUT + 0.45; z < Z_BACK; z += 1.2) out.push(<Line3 key={`v${z.toFixed(2)}`} b={b} pts={[v3(x, 0, z), v3(x, ROOM_H, z)]} stroke={C.concSeam} w={hw} px op={op} />);
  for (const y of [0.9, 1.8]) out.push(<Line3 key={`h${y}`} b={b} pts={[v3(x, y, Z_CUT), v3(x, y, Z_BACK)]} stroke={C.concSeam} w={hw} px op={op} />);
  for (let z = Z_CUT + 0.15; z < Z_BACK; z += 0.6) {
    for (const y of [0.45, 1.35, 2.25]) {
      const p = proj(b, v3(x, y, z));
      const r = Math.max(0.8, scaleAt(b, v3(x, y, z)) * 0.012);
      out.push(<circle key={`t${z.toFixed(2)}${y}`} cx={f1(p.x)} cy={f1(p.y)} r={f1(r)} fill={C.concDot} opacity={0.7 * op} />);
    }
  }
  return out;
};
/** the wall's long faces (whichever the camera sees), drawn with the rooms */
export const WallFaces: React.FC<{b: B}> = ({b}) => {
  const hw = Math.max(0.7, Math.min(2.4, scaleAt(b, v3(0, 1.3, 1.5)) * 0.0016));
  const cx = b.c.pos.x;
  return (
    <g>
      {cx < WALL.x0 && <Poly b={b} pts={rx(WALL.x0, Z_CUT, Z_BACK, 0, ROOM_H)} fill={C.conc} />}
      {cx < WALL.x0 && seams(b, WALL.x0 - 0.001, hw, 0.8)}
      {cx > WALL.x1 && <Poly b={b} pts={rx(WALL.x1, Z_CUT, Z_BACK, 0, ROOM_H)} fill={C.concLo} />}
      {cx > WALL.x1 && seams(b, WALL.x1 + 0.001, hw, 0.8)}
    </g>
  );
};
/** rebar positions in the section (x, y): two mats, one near each face */
const REBAR: [number, number][] = [];
for (let y = 0.1; y < ROOM_H; y += 0.2) {
  REBAR.push([WALL.x0 + 0.05, y]);
  REBAR.push([WALL.x1 - 0.05, y + 0.1]);
}
/** the cut face at Z_CUT: the concrete section (aggregate, rebar), the floor and ceiling slabs.
 *  `glow` tints it while the waves cross; `waveIn` lists wavefront positions inside the wall (for the slowed arcs). */
export const Section: React.FC<{b: B; glow?: number}> = ({b, glow = 0}) => {
  const z = Z_CUT;
  const k = scaleAt(b, v3(0, 1.3, z));
  const hw = Math.max(0.7, Math.min(2.6, k * 0.0016));
  const dots: React.ReactNode[] = [];
  // aggregate: stable scattered stones, more of them when the face is close (they stay put on the face)
  const n = Math.min(260, Math.round(k * 0.12));
  for (let i = 0; i < n; i++) {
    const x = WALL.x0 + 0.015 + (WALL.x1 - WALL.x0 - 0.03) * hash(i, 11);
    const y = 0.02 + (ROOM_H - 0.04) * hash(i, 12);
    const p = proj(b, v3(x, y, z));
    const r = Math.max(0.5, k * (0.004 + 0.007 * hash(i, 13)));
    dots.push(<circle key={i} cx={f1(p.x)} cy={f1(p.y)} r={f1(r)} fill={hash(i, 14) > 0.5 ? C.concDot : '#B9C0C3'} opacity={0.75} />);
  }
  return (
    <g>
      <Poly b={b} pts={rz(z, -8, 8, ROOM_H, ROOM_H + 1.6)} fill={C.slab} />
      <Line3 b={b} pts={[v3(-8, ROOM_H + 0.3, z - 0.001), v3(8, ROOM_H + 0.3, z - 0.001)]} stroke={C.concSeam} w={hw} px />
      <Poly b={b} pts={rz(z, WALL.x0, WALL.x1, 0, ROOM_H)} fill={C.concCut} />
      {dots}
      {REBAR.map(([x, y], i) => {
        const p = proj(b, v3(x, y, z));
        return <circle key={`r${i}`} cx={f1(p.x)} cy={f1(p.y)} r={f1(Math.max(1, k * 0.008))} fill={C.rebar} stroke={INK} strokeWidth={Math.max(0.5, hw * 0.5)} />;
      })}
      {glow > 0 && <Poly b={b} pts={rz(z - 0.001, WALL.x0, WALL.x1, 0, ROOM_H)} fill={C.rf} stroke={false} op={0.14 * glow} />}
    </g>
  );
};

// ------------------------------------------------------------------ the research radio
/** tripod, FMCW box (front cover opens 0..1 to show the board: TX chirp generator, RX mixer), its range readout, the T
 *  array (horizontal bar: transmit patches; vertical bar: receive patches). `tx` 0..1 lights the transmit patches,
 *  `rx` (per receive patch, 0..1) lights the receive patches as echoes arrive. */
export const Radio: React.FC<{b: B; open?: number; tx?: number; rx?: number[]; lcd?: React.ReactNode}> = ({b, open = 0, tx = 0, rx = [0, 0, 0, 0], lcd}) => {
  const {n} = antAxes();
  const k = scaleAt(b, v3(ANT.x, ANT.y, ANT.z));
  const lw = Math.max(1, k * 0.008);
  const face = (u0: number, u1: number, y0: number, y1: number, nn: number): V3[] => [antPt(u0, y0, nn), antPt(u1, y0, nn), antPt(u1, y1, nn), antPt(u0, y1, nn)];
  const side = (u: number, y0: number, y1: number, d: number): V3[] => [antPt(u, y0, 0), antPt(u, y0, -d), antPt(u, y1, -d), antPt(u, y1, 0)];
  const topF = (u0: number, u1: number, y: number, d: number): V3[] => [antPt(u0, y, 0), antPt(u1, y, 0), antPt(u1, y, -d), antPt(u0, y, -d)];
  const foot = (a: number) => v3(ANT.x + Math.cos(a) * 0.3, 0, ANT.z + Math.sin(a) * 0.3);
  const hub = v3(ANT.x - n.x * 0.06, 0.3, ANT.z - n.z * 0.06);
  const patches: React.ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const u = -0.33 + i * (0.66 / 7);
    patches.push(<Poly key={`h${i}`} b={b} pts={face(u - 0.03, u + 0.03, ANT.y - 0.03, ANT.y + 0.03, 0.012)} fill={mixHex('#E9B949', '#FFF8D0', tx)} sw={0.5} />);
  }
  for (let i = 0; i < 4; i++) {
    const yy = ANT.y - 0.15 - i * 0.1;
    patches.push(<Poly key={`v${i}`} b={b} pts={face(-0.03, 0.03, yy - 0.03, yy + 0.03, 0.012)} fill={mixHex('#3FA7C4', '#C9F6FF', rx[i] ?? 0)} sw={0.5} />);
  }
  const boxY0 = 0.3, boxY1 = 0.5;
  return (
    <g>
      {[30, 150, 270].map((a) => <Line3 key={a} b={b} pts={[hub, foot((a * Math.PI) / 180)]} stroke={C.dark} w={0.022} />)}
      <Line3 b={b} pts={[antPt(0, 0.3, -0.06), antPt(0, ANT.y + 0.04, -0.06)]} stroke={C.metalDeep} w={0.035} />
      <Poly b={b} pts={side(0.16, boxY0, boxY1, 0.2)} fill={C.dark} />
      <Poly b={b} pts={topF(-0.16, 0.16, boxY1, 0.2)} fill="#4A5D69" />
      <Poly b={b} pts={face(-0.16, 0.16, boxY0, boxY1, 0)} fill="#33444F" />
      {open > 0.01 && (
        <g opacity={clamp(open * 1.5)}>
          <Poly b={b} pts={face(-0.145, 0.145, boxY0 + 0.015, boxY1 - 0.015, 0.002)} fill="#1E6B4F" sw={0.6} />
          {/* TX: chirp generator and amplifier (amber traces to the horizontal bar); RX: mixer (cyan traces to the vertical bar) */}
          <Poly b={b} pts={face(-0.12, -0.04, boxY0 + 0.07, boxY0 + 0.15, 0.004)} fill="#111A20" sw={0.5} />
          <Poly b={b} pts={face(0.03, 0.11, boxY0 + 0.07, boxY0 + 0.15, 0.004)} fill="#111A20" sw={0.5} />
          {[0.25, 0.5, 0.75].map((q) => <Line3 key={`a${q}`} b={b} pts={[antPt(-0.12 + q * 0.08, boxY0 + 0.15, 0.005), antPt(-0.12 + q * 0.08, boxY1 - 0.018, 0.005)]} stroke={C.amber} w={0.005} />)}
          {[0.25, 0.5, 0.75].map((q) => <Line3 key={`c${q}`} b={b} pts={[antPt(0.03 + q * 0.08, boxY0 + 0.15, 0.005), antPt(0.03 + q * 0.08, boxY1 - 0.018, 0.005)]} stroke={C.rf} w={0.005} />)}
        </g>
      )}
      {open < 0.99 && (() => {
        const a = open * 1.9;
        const {n: nn, h: hh} = antAxes();
        const hinge = antPt(-0.16, 0, 0);
        const pt = (u: number, yy: number) => {
          const r = u + 0.16;
          return v3(hinge.x + hh.x * Math.cos(a) * r + nn.x * Math.sin(a) * r, yy, hinge.z + hh.z * Math.cos(a) * r + nn.z * Math.sin(a) * r);
        };
        return <Poly b={b} pts={[pt(-0.16, boxY0), pt(0.16, boxY0), pt(0.16, boxY1), pt(-0.16, boxY1)]} fill={open > 0 ? '#3E515D' : '#33444F'} />;
      })()}
      {/* the range readout (on the box's side panel, toward the camera): filled by the scene */}
      {lcd}
      <Poly b={b} pts={side(0.4, ANT.y - 0.07, ANT.y + 0.07, 0.05)} fill={C.metalDeep} />
      <Poly b={b} pts={topF(-0.4, 0.4, ANT.y + 0.07, 0.05)} fill="#E5ECEF" />
      <Poly b={b} pts={face(-0.4, 0.4, ANT.y - 0.07, ANT.y + 0.07, 0)} fill={C.metal} />
      <Poly b={b} pts={side(0.065, ANT.y - 0.56, ANT.y - 0.07, 0.05)} fill={C.metalDeep} />
      <Poly b={b} pts={face(-0.065, 0.065, ANT.y - 0.56, ANT.y - 0.07, 0)} fill={C.metal} />
      {patches}
      <Line3 b={b} pts={[antPt(-0.12, boxY0, -0.1), v3(ANT.x - 0.2, 0.02, ANT.z - 0.25), v3(STAND.x + 0.25, 0.02, STAND.z + 0.2), v3(STAND.x + 0.05, 0.1, STAND.z + 0.08)]} stroke={C.darker} w={lw} px />
    </g>
  );
};
/** the range readout screen: a small display on the top of the FMCW box, angled up toward the camera */
/** the range readout on the box's front face (u across, y up), seen when the cover is closed */
export const lcdQuad = (): V3[] => [antPt(-0.13, 0.325, 0.004), antPt(0.13, 0.325, 0.004), antPt(0.13, 0.475, 0.004), antPt(-0.13, 0.475, 0.004)];

// ------------------------------------------------------------------ the observation stand
/** a rolling stand with two screens; their contents are drawn by the scene into the given rects (clipped) */
export const ObsStand: React.FC<{b: B; cam: React.ReactNode; rf: React.ReactNode}> = ({b, cam, rf}) => {
  const u = useUid();
  const bz = 0.03;
  if (depth(b, v3(STAND.x, 1.4, STAND.z)) < 0.2) return null;
  const rr = screenRect(b, RFMON), rc = screenRect(b, CAMMON);
  const k = scaleAt(b, v3(STAND.x, 1.4, STAND.z));
  const scr = (m: typeof RFMON, r: Rect, id: string, child: React.ReactNode, label: string) => (
    <g>
      <Poly b={b} pts={rz(m.z, m.x - m.w / 2 - bz, m.x + m.w / 2 + bz, m.y - m.h / 2 - bz, m.y + m.h / 2 + bz)} fill="#1B252C" />
      <defs>
        <clipPath id={`${u}${id}`}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} />
        </clipPath>
      </defs>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={C.screen} />
      <g clipPath={`url(#${u}${id})`}>{child}</g>
      {/* the screen's name on the bezel's lower edge (as printed on a lab label strip) */}
      <text x={f1(r.x + r.w / 2)} y={f1(r.y + r.h + bz * k * 0.78)} textAnchor="middle" fontSize={f1(bz * k * 0.62)} fill="#C9D6DD" fontFamily="JetBrains Mono, monospace" letterSpacing={f1(k * 0.002)}>{label}</text>
    </g>
  );
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a) => {
        const A = (a * Math.PI) / 180;
        return <Line3 key={a} b={b} pts={[v3(STAND.x, 0.07, STAND.z + 0.12), v3(STAND.x + Math.cos(A) * 0.3, 0.05, STAND.z + 0.12 + Math.sin(A) * 0.3)]} stroke={C.dark} w={0.03} />;
      })}
      <Line3 b={b} pts={[v3(STAND.x, 0.07, STAND.z + 0.12), v3(STAND.x, CAMMON.y, STAND.z + 0.12)]} stroke={C.metalDeep} w={0.045} />
      {scr(CAMMON, rc, 'cam', cam, 'CAMERA')}
      {scr(RFMON, rr, 'rf', rf, 'RADIO')}
    </g>
  );
};

// ------------------------------------------------------------------ the security camera
/** a bullet camera on a short wall arm, seen side-on (its lens points into the office, screen-left) */
export const Cctv: React.FC<{b: B; live?: boolean}> = ({b, live = true}) => {
  const c = CCTV.pos;
  const k = scaleAt(b, c);
  const lw = Math.max(1, k * 0.0042);
  const body = proj(b, v3(c.x + 0.08, c.y + 0.02, c.z));
  const arm0 = proj(b, v3(WALL.x0, c.y + 0.12, c.z)), arm1 = proj(b, v3(c.x + 0.12, c.y + 0.1, c.z));
  const L = 0.3 * k, Hh = 0.11 * k;
  return (
    <g>
      <line x1={f1(arm0.x)} y1={f1(arm0.y)} x2={f1(arm1.x)} y2={f1(arm1.y)} stroke={INK} strokeWidth={0.035 * k + lw * 2} strokeLinecap="round" />
      <line x1={f1(arm0.x)} y1={f1(arm0.y)} x2={f1(arm1.x)} y2={f1(arm1.y)} stroke={C.metal} strokeWidth={0.035 * k} strokeLinecap="round" />
      <g transform={`translate(${f1(body.x)} ${f1(body.y)}) rotate(-20)`}>
        <rect x={-L * 0.42} y={-Hh / 2} width={L * 0.84} height={Hh} rx={Hh * 0.3} fill="#F1F4F5" stroke={INK} strokeWidth={lw} />
        <rect x={-L * 0.55} y={-Hh * 0.62} width={L * 1.02} height={Hh * 0.2} rx={Hh * 0.08} fill="#DDE3E6" stroke={INK} strokeWidth={lw * 0.8} />
        <rect x={-L * 0.52} y={-Hh * 0.4} width={L * 0.13} height={Hh * 0.8} rx={Hh * 0.14} fill="#2B3A44" stroke={INK} strokeWidth={lw * 0.8} />
        <ellipse cx={-L * 0.52} cy={0} rx={Hh * 0.1} ry={Hh * 0.3} fill="#0B1218" />
        <circle cx={L * 0.28} cy={Hh * 0.12} r={Hh * 0.09} fill={live ? '#FF3B3B' : '#5A2A2A'} />
      </g>
    </g>
  );
};
export {mixHex};
