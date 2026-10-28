// V4 lab: a building cut open along a vertical plane, so both rooms and the dividing wall's full thickness read at
// once (an architectural cross-section: the cut faces of the floor slab, the ceiling slab and the 0.32 m reinforced
// concrete wall are drawn with their aggregate and rebar; the storeys above and below are dimmed). Left: the office he
// hides in. Right: the RF lab: the research radio (FMCW unit, T-shaped array) aimed at the wall, and the sensing
// computer's large display on a low cart right against the wall, showing his reconstructed skeleton at life size and
// at his own height (the RF-Pose demonstration, mirrored across the wall). No security camera in the lab.
// Metres; floor y = 0; the cut plane is z = Z_CUT.
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
/** V4: the floors end at the cut (a true section) */
export const FLOOR_NEAR = 0.6;
export const SLAB = 0.42;
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
/** V4: the array stands on a tall mast right behind the display, above it, aimed at the wall; the FMCW unit sits on
 *  top of the mast */
export const ANT = {x: 1.02, z: 1.55, y: 1.98, yaw: 42};
export const BOX = {y0: ANT.y + 0.13, y1: ANT.y + 0.35};
export const antAxes = () => {
  const a = (ANT.yaw * Math.PI) / 180;
  return {n: v3(-Math.cos(a), 0, -Math.sin(a)), h: v3(Math.sin(a), 0, -Math.cos(a))};
};
export const antPt = (u: number, yy: number, nn = 0) => {
  const {n, h} = antAxes();
  return v3(ANT.x + h.x * u + n.x * nn, yy, ANT.z + h.z * u + n.z * nn);
};
/** the sensing computer's display: a large panel on a low cart, its face toward the cut (us), beside the wall. Its
 *  picture maps the world 1:1 (a metre of the room is a metre of the screen), offset up by its bottom bezel, so the
 *  skeleton stands at his size and height on the other side of the wall. */
export const DISP = {x: 0.74, y: 0.86, z: 1.15, w: 1.06, h: 1.36};
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
const hatch = (b: B, x0: number, x1: number, y0: number, y1: number, z: number, step: number, col: string, w: number) => {
  const out: React.ReactNode[] = [];
  const H = y1 - y0;
  for (let k = -H; k < x1 - x0; k += step) {
    let ax = x0 + k, ay = y0, bx = x0 + k + H, by = y1;
    if (ax < x0) { ay = y0 + (x0 - ax); ax = x0; }
    if (bx > x1) { by = y1 - (bx - x1); bx = x1; }
    if (by <= ay) continue;
    const A = proj(b, v3(ax, ay, z)), Bp = proj(b, v3(bx, by, z));
    out.push(<line key={k.toFixed(3)} x1={f1(A.x)} y1={f1(A.y)} x2={f1(Bp.x)} y2={f1(Bp.y)} stroke={col} strokeWidth={w} opacity={0.6} />);
  }
  return out;
};
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
  // (close up, only the visible stretch of the face is sampled, so the face stays textured at any distance)
  const vis = Math.min(ROOM_H, (1920 / k) * 1.2);
  const yc = Math.max(vis / 2, Math.min(ROOM_H - vis / 2, b.c.pos.y));
  const n = Math.min(420, Math.round(k * 0.14));
  for (let i = 0; i < n; i++) {
    const x = WALL.x0 + 0.015 + (WALL.x1 - WALL.x0 - 0.03) * hash(i, 11);
    const y = yc - vis / 2 + vis * hash(i, 12);
    const p = proj(b, v3(x, y, z));
    const r = Math.max(0.5, k * (0.004 + 0.007 * hash(i, 13)));
    dots.push(<circle key={i} cx={f1(p.x)} cy={f1(p.y)} r={f1(r)} fill={hash(i, 14) > 0.5 ? C.concDot : '#B9C0C3'} opacity={0.75} />);
  }
  return (
    <g>
      {/* the ceiling and floor slabs cut through (with section hatching), the storeys' own walls continuing */}
      {[[ROOM_H, ROOM_H + SLAB], [-SLAB, 0]].map(([y0, y1], i) => (
        <g key={i}>
          <Poly b={b} pts={rz(z, -8, 8, y0, y1)} fill={C.slab} />
          {hatch(b, -8, 8, y0, y1, z, 0.08, C.concSeam, hw)}
        </g>
      ))}
      <Poly b={b} pts={rz(z, WALL.x0, WALL.x1, ROOM_H + SLAB, ROOM_H + 3.4)} fill={C.concCut} op={0.85} />
      <Poly b={b} pts={rz(z, WALL.x0, WALL.x1, -3.2, -SLAB)} fill={C.concCut} op={0.85} />
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
  const boxY0 = BOX.y0, boxY1 = BOX.y1;
  return (
    <g>
      {[30, 150, 270].map((a) => <Line3 key={a} b={b} pts={[hub, foot((a * Math.PI) / 180)]} stroke={C.dark} w={0.022} />)}
      <Line3 b={b} pts={[antPt(0, 0.3, -0.06), antPt(0, BOX.y0, -0.06)]} stroke={C.metalDeep} w={0.035} />
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
      <Line3 b={b} pts={[antPt(0.12, boxY0, -0.12), antPt(0.1, 0.3, -0.12), v3(DISP.x + 0.3, 0.02, DISP.z + 0.45), v3(DISP.x + 0.22, 0.13, DISP.z + 0.3)]} stroke={C.darker} w={lw} px />
    </g>
  );
};
/** the range readout screen: a small display on the top of the FMCW box, angled up toward the camera */
/** the range readout on the box's front face (u across, y up), seen when the cover is closed */
export const lcdQuad = (): V3[] => [antPt(-0.13, BOX.y0 + 0.025, 0.004), antPt(0.13, BOX.y0 + 0.025, 0.004), antPt(0.13, BOX.y1 - 0.025, 0.004), antPt(-0.13, BOX.y1 - 0.025, 0.004)];

// ------------------------------------------------------------------ the sensing computer
export const Display: React.FC<{b: B; children?: React.ReactNode; glow?: number}> = ({b, children, glow = 1}) => {
  const u = useUid();
  if (depth(b, v3(DISP.x, DISP.y, DISP.z)) < 0.15) return null;
  const bz = 0.035;
  const r = screenRect(b, DISP);
  const k = scaleAt(b, v3(DISP.x, DISP.y, DISP.z));
  const y0 = DISP.y - DISP.h / 2 - bz;
  return (
    <g>
      {/* the cart: a low base on castors, two posts, the computer on its lower shelf */}
      <Box b={b} x0={DISP.x - 0.42} x1={DISP.x + 0.42} y0={0.06} y1={0.1} z0={DISP.z + 0.04} z1={DISP.z + 0.42} front="#4A5B66" side="#3C4A54" top="#5C6F7B" />
      {[-0.36, 0.36].map((dx) => <Line3 key={dx} b={b} pts={[v3(DISP.x + dx, 0.1, DISP.z + 0.3), v3(DISP.x + dx, y0, DISP.z + 0.06)]} stroke={C.metalDeep} w={0.03} />)}
      <Box b={b} x0={DISP.x + 0.08} x1={DISP.x + 0.36} y0={0.1} y1={0.16} z0={DISP.z + 0.12} z1={DISP.z + 0.4} front="#22313B" side="#1A262E" top="#33444F" />
      {/* soft glow of the screen on the floor and the wall face beside it */}
      <ellipse cx={f1(r.x + r.w / 2)} cy={f1(proj(b, v3(DISP.x, 0, DISP.z)).y)} rx={f1(r.w * 0.7)} ry={f1(r.w * 0.09)} fill={C.rf} opacity={0.12 * glow} />
      <Poly b={b} pts={rz(DISP.z, DISP.x - DISP.w / 2 - bz, DISP.x + DISP.w / 2 + bz, DISP.y - DISP.h / 2 - bz, DISP.y + DISP.h / 2 + bz)} fill="#1B252C" />
      <defs>
        <clipPath id={`${u}disp`}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} />
        </clipPath>
      </defs>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={C.screen} />
      <g clipPath={`url(#${u}disp)`}>{children}</g>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="#000" strokeOpacity={0.5} strokeWidth={Math.max(1, k * 0.003)} />
      {/* power LED on the bezel */}
      <circle cx={f1(r.x + r.w - k * 0.02)} cy={f1(r.y + r.h + k * 0.018)} r={f1(Math.max(1, k * 0.005))} fill="#7CFFB2" />
    </g>
  );
};

// ------------------------------------------------------------------ inside the wall
/** the camera inside the wall's thickness (the move through the wall): concrete all round, with aggregate and the
 *  rebar mats passing close by (3D points inside the slab, so they stream past with parallax). `x` is the camera's x. */
export const WallInterior: React.FC<{b: B}> = ({b}) => {
  const c = b.c.pos;
  const inside = c.x > WALL.x0 - 0.02 && c.x < WALL.x1 + 0.02 && c.z > Z_CUT - 0.02;
  if (!inside) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 420; i++) {
    const x = WALL.x0 + (WALL.x1 - WALL.x0) * hash(i, 31);
    const y = c.y - 1.2 + 2.4 * hash(i, 32);
    const z = c.z + 0.02 + 1.4 * hash(i, 33) ** 1.6;
    const p = proj(b, v3(x, y, z));
    const r = scaleAt(b, v3(x, y, z)) * (0.004 + 0.008 * hash(i, 34));
    if (p.x < -60 || p.x > 1140 || p.y < -60 || p.y > 1980) continue;
    out.push(<circle key={i} cx={f1(p.x)} cy={f1(p.y)} r={f1(Math.min(60, r))} fill={hash(i, 35) > 0.5 ? C.concDot : '#BEC5C8'} opacity={0.8} />);
  }
  // rebar: vertical bars in each mat, every 0.2 m in z (cylinders seen as vertical strokes)
  for (const mx of [WALL.x0 + 0.05, WALL.x1 - 0.05]) {
    for (let z = Z_CUT + 0.1; z < c.z + 1.5; z += 0.2) {
      if (z < c.z + 0.03) continue;
      const a = proj(b, v3(mx, c.y - 2, z)), bb = proj(b, v3(mx, c.y + 2, z));
      const w = scaleAt(b, v3(mx, c.y, z)) * 0.016;
      out.push(<line key={`rb${mx}${z.toFixed(2)}`} x1={f1(a.x)} y1={f1(a.y)} x2={f1(bb.x)} y2={f1(bb.y)} stroke={C.rebar} strokeWidth={f1(Math.min(80, w))} opacity={0.9} />);
    }
  }
  return (
    <g>
      <rect width={1080} height={1920} fill={C.concCut} />
      {out}
      <rect width={1080} height={1920} fill="#000" opacity={0.18} />
    </g>
  );
};

/** the storeys above and below (dim, out of the story): fill the top and bottom of a tall frame with building */
export const Storeys: React.FC<{b: B}> = ({b}) => (
  <g opacity={0.9}>
    {/* below: the lower floor's rooms, dim */}
    <Poly b={b} pts={rz(Z_BACK, -6, 6, -3.2, -SLAB)} fill="#5B6A73" stroke={false} />
    <Poly b={b} pts={ry(-SLAB - 0.001, -6, 6, Z_CUT, Z_BACK)} fill="#6C7C85" stroke={false} />
    <Poly b={b} pts={rz(Z_BACK - 0.01, -2.4, -1.4, -2.6, -0.9)} fill="#7F8F98" stroke={false} />
    <Poly b={b} pts={rz(Z_BACK - 0.01, 1.2, 2.6, -2.0, -1.0)} fill="#8496A0" stroke={false} />
    {/* above: the upper floor, dim */}
    <Poly b={b} pts={rz(Z_BACK, -6, 6, ROOM_H + SLAB, ROOM_H + 3.4)} fill="#5B6A73" stroke={false} />
    <Poly b={b} pts={ry(ROOM_H + SLAB + 0.001, -6, 6, Z_CUT, Z_BACK)} fill="#6C7C85" stroke={false} />
  </g>
);
export {mixHex};
