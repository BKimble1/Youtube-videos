// The lab: one building cut open along a vertical plane (an architectural section, dollhouse style) so both rooms
// and the dividing wall's thickness are seen at once. Left: the small office he hides in (warm, wood floor, the
// security camera and its public-view screen on the back wall). Right: the RF lab (cool), with the research radio
// (FMCW unit and its T-shaped antenna array, horizontal + vertical, RF-Pose style) aimed at the wall, and the
// display that shows the estimated skeleton. Metres; floor y = 0; the cut plane is z = Z_CUT.
import React from 'react';
import {B, proj, scaleAt, v3, V3} from '../world/cam';
import {Box, INK, Line3, Poly, rx, ry, rz} from '../world/draw';
import {clamp, f1, lerp, mixHex, useUid} from '../lib';

export const Z_CUT = 0.75;
export const Z_BACK = 3.4;
export const ROOM_H = 2.7;
export const WALL = {x0: -0.13, x1: 0.13, plaster: 0.028};
export const C = {
  out: '#14212A',
  hideWall: '#EADBC0', hideWallLo: '#DCC8A6', hideFloor: '#C39A6B', hideFloorDeep: '#A57C50', hideBase: '#F7EFDF',
  devWall: '#D3E4EA', devWallLo: '#BFD3DA', devFloor: '#A4B9C2', devFloorDeep: '#8DA3AD', devBase: '#EEF6F8',
  ceil: '#E6E9E4', ceilDev: '#DCE5E8',
  plaster: '#F2E9D8', block: '#A2AEB6', blockLine: '#77858F', slab: '#3B4B56', slabLine: '#2A3740',
  metal: '#C9D3D9', metalDeep: '#93A1AA', dark: '#22313B', darker: '#16222B', screen: '#0A1726', teal: '#1CA7A0', amber: '#FFC744',
  rf: '#5CE1FF',
};

// ------------------------------------------------------------------ fixed props
/** the research radio: tripod mast, FMCW box, T-shaped antenna array facing the wall (yawed toward the camera) */
export const ANT = {x: 1.18, z: 2.3, y: 1.04, yaw: 58};
/** unit vectors of the array's face: n = boresight (toward the wall), h = along the horizontal bar */
export const antAxes = () => {
  const a = (ANT.yaw * Math.PI) / 180;
  return {n: v3(-Math.cos(a), 0, -Math.sin(a)), h: v3(Math.sin(a), 0, -Math.cos(a))};
};
export const antPt = (u: number, yy: number, nn = 0) => {
  const {n, h} = antAxes();
  return v3(ANT.x + h.x * u + n.x * nn, yy, ANT.z + h.z * u + n.z * nn);
};
/** the RF display on a rolling stand (screen faces the camera) */
export const MON = {x: 0.5, y: 1.74, z: 1.0, w: 0.72, h: 0.66};
/** the security camera (on a drop pole from the ceiling, looking toward the door) and its public-view screen on the
 *  office's back wall */
export const CCTV = {x: -1.25, y: 2.02, z: 1.2};
/** the public-view screen hangs from the ceiling beside the camera, facing the room (and us) */
export const PUB = {x: -0.72, y: 2.02, z: 1.3, w: 0.56, h: 0.34};

const hatch = (b: B, x0: number, x1: number, y0: number, y1: number, z: number, step: number, col: string, w: number) => {
  // 45-degree section hatch inside a rectangle on the cut plane
  const out: React.ReactNode[] = [];
  const H = y1 - y0;
  for (let k = -H; k < x1 - x0; k += step) {
    let ax = x0 + k, ay = y0, bx = x0 + k + H, by = y1;
    if (ax < x0) { ay = y0 + (x0 - ax); ax = x0; }
    if (bx > x1) { by = y1 - (bx - x1); bx = x1; }
    if (by <= ay) continue;
    const A = proj(b, v3(ax, ay, z)), Bp = proj(b, v3(bx, by, z));
    out.push(<line key={k.toFixed(3)} x1={f1(A.x)} y1={f1(A.y)} x2={f1(Bp.x)} y2={f1(Bp.y)} stroke={col} strokeWidth={w} />);
  }
  return out;
};

/** wall layer offsets (Scene A's exploded section): each layer slides apart in x by `sep` metres */
export type WallSep = {sep: number};

export const Room: React.FC<{b: B; sep?: number; lightsHide?: number}> = ({b, sep = 0}) => {
  const k = scaleAt(b, v3(0, 1.3, 1.2));
  const hw = Math.max(0.8, Math.min(3, k * 0.0022));
  const W0 = WALL.x0 - sep, W1 = WALL.x1 + sep;
  return (
    <g>
      {/* ---- office (left) */}
      <Poly b={b} pts={rz(Z_BACK, -6, W0, 0, ROOM_H)} fill={C.hideWall} />
      <Poly b={b} pts={rz(Z_BACK - 0.001, -6, W0, 0, 0.12)} fill={C.hideBase} sw={0.6} />
      {/* door, frame and handle */}
      <Poly b={b} pts={rz(Z_BACK - 0.002, -2.75, -1.85, 0, 2.08)} fill="#F4EEE2" />
      <Poly b={b} pts={rz(Z_BACK - 0.003, -2.68, -1.92, 0, 2.02)} fill="#B9855A" />
      <Poly b={b} pts={rz(Z_BACK - 0.004, -2.6, -2.0, 1.08, 1.86)} fill="#A97549" stroke={false} />
      <Poly b={b} pts={rz(Z_BACK - 0.004, -2.6, -2.0, 0.14, 0.92)} fill="#A97549" stroke={false} />
      <Poly b={b} pts={rz(Z_BACK - 0.005, -2.04, -1.96, 0.98, 1.02)} fill={C.amber} sw={0.6} />
      <Poly b={b} pts={ry(0, -6, W0, Z_CUT, Z_BACK)} fill={C.hideFloor} />
      {/* floorboards */}
      {[1.05, 1.4, 1.8, 2.25, 2.8].map((z) => <Line3 key={z} b={b} pts={[v3(-6, 0, z), v3(W0, 0, z)]} stroke={C.hideFloorDeep} w={hw} px op={0.55} />)}
      <Poly b={b} pts={ry(ROOM_H, -6, W0, Z_CUT, Z_BACK)} fill={C.ceil} />
      {/* ceiling light */}
      <Poly b={b} pts={ry(ROOM_H - 0.01, -1.45, -0.75, 1.6, 2.4)} fill="#FFF9E8" sw={0.6} />

      {/* ---- RF lab (right) */}
      <Poly b={b} pts={rz(Z_BACK, W1, 6, 0, ROOM_H)} fill={C.devWall} />
      <Poly b={b} pts={rz(Z_BACK - 0.001, W1, 6, 1.02, 1.1)} fill={C.teal} sw={0.6} />
      <Poly b={b} pts={rz(Z_BACK - 0.001, W1, 6, 0, 0.12)} fill={C.devBase} sw={0.6} />
      {/* whiteboard with a plot */}
      <Poly b={b} pts={rz(Z_BACK - 0.002, 1.75, 3.0, 1.3, 2.1)} fill="#FBFDFD" />
      <Line3 b={b} pts={Array.from({length: 13}, (_, i) => v3(1.85 + i * 0.085, 1.55 + 0.22 * Math.exp(-((i - 6) ** 2) / 5) + 0.03 * Math.sin(i * 1.7), Z_BACK - 0.004))} stroke="#3A5FA0" w={hw * 1.2} px />
      <Line3 b={b} pts={[v3(1.85, 1.45, Z_BACK - 0.004), v3(2.9, 1.45, Z_BACK - 0.004)]} stroke={INK} w={hw * 0.8} px op={0.7} />
      {/* back bench with an instrument */}
      <Box b={b} x0={2.3} x1={4} y0={0} y1={0.9} z0={Z_BACK - 0.6} z1={Z_BACK - 0.01} front="#C2D2D8" side="#AFC1C8" top="#E9F0F2" />
      <Box b={b} x0={2.55} x1={2.95} y0={0.9} y1={1.15} z0={Z_BACK - 0.45} z1={Z_BACK - 0.15} front="#5C6F7B" side="#4A5B66" top="#7E909B" />
      <Poly b={b} pts={ry(0, W1, 6, Z_CUT, Z_BACK)} fill={C.devFloor} />
      {[1.3, 1.9, 2.6].map((z) => <Line3 key={z} b={b} pts={[v3(W1, 0, z), v3(6, 0, z)]} stroke={C.devFloorDeep} w={hw} px op={0.4} />)}
      {[0.6, 1.4, 2.2].map((x) => <Line3 key={x} b={b} pts={[v3(x, 0, Z_CUT), v3(x, 0, Z_BACK)]} stroke={C.devFloorDeep} w={hw} px op={0.4} />)}
      <Poly b={b} pts={ry(ROOM_H, W1, 6, Z_CUT, Z_BACK)} fill={C.ceilDev} />
      <Poly b={b} pts={ry(ROOM_H - 0.01, 0.8, 1.6, 1.5, 2.3)} fill="#F4FBFF" sw={0.6} />

      {/* ---- the dividing wall's long faces (whichever the camera sees) */}
      {b.c.pos.x < W0 && <Poly b={b} pts={rx(W0, Z_CUT, Z_BACK, 0, ROOM_H)} fill={C.hideWallLo} />}
      {b.c.pos.x > W1 && <Poly b={b} pts={rx(W1, Z_CUT, Z_BACK, 0, ROOM_H)} fill={C.devWallLo} />}
      {b.c.pos.x < W0 && <Poly b={b} pts={rx(W0 - 0.001, Z_CUT, Z_BACK, 0, 0.12)} fill={C.hideBase} sw={0.6} />}
      {b.c.pos.x > W1 && <Poly b={b} pts={rx(W1 + 0.001, Z_CUT, Z_BACK, 0, 0.12)} fill={C.devBase} sw={0.6} />}
    </g>
  );
};

/** the cut faces at Z_CUT: wall section (plaster | block | plaster, separable), floor and ceiling slabs */
export const Section: React.FC<{b: B; sep?: number; glow?: number}> = ({b, sep = 0, glow = 0}) => {
  const z = Z_CUT;
  const k = scaleAt(b, v3(0, 1.3, z));
  const hw = Math.max(0.7, Math.min(2.6, k * 0.0016));
  const p = WALL.plaster;
  const layers: [number, number, string, number][] = [
    [WALL.x0 - sep, WALL.x0 + p - sep, C.plaster, -1],
    [WALL.x0 + p, WALL.x1 - p, C.block, 0],
    [WALL.x1 - p + sep, WALL.x1 + sep, C.plaster, 1],
  ];
  return (
    <g>
      {/* slabs (the building's floor and ceiling cut through) */}
      <Poly b={b} pts={rz(z, -8, 8, -0.32, 0)} fill={C.slab} />
      {hatch(b, -8, 8, -0.32, 0, z, 0.09, C.slabLine, hw)}
      <Poly b={b} pts={rz(z, -8, 8, ROOM_H, ROOM_H + 0.3)} fill={C.slab} />
      {hatch(b, -8, 8, ROOM_H, ROOM_H + 0.3, z, 0.09, C.slabLine, hw)}
      {/* the wall: three layers; in the exploded view the gaps open and the layers' inner faces show */}
      {layers.map(([x0, x1, col, i]) => (
        <g key={i}>
          {sep > 0.002 && i !== 0 && <Poly b={b} pts={rx(i < 0 ? x1 : x0, z, z + 0.5, 0, ROOM_H)} fill={mixHex(col, '#7F8C94', 0.35)} sw={0.6} />}
          <Poly b={b} pts={rz(z, x0, x1, 0, ROOM_H)} fill={col} />
          {i === 0 && hatch(b, x0, x1, 0, ROOM_H, z, 0.05, C.blockLine, hw)}
          {/* block courses */}
          {i === 0 && Array.from({length: 13}, (_, n) => {
            const yy = 0.2 * (n + 1);
            const A = proj(b, v3(x0, yy, z)), Bq = proj(b, v3(x1, yy, z));
            return <line key={n} x1={f1(A.x)} y1={f1(A.y)} x2={f1(Bq.x)} y2={f1(Bq.y)} stroke={C.blockLine} strokeWidth={hw * 1.2} />;
          })}
        </g>
      ))}
      {glow > 0 && <Poly b={b} pts={rz(z - 0.001, WALL.x0 - sep, WALL.x1 + sep, 0, ROOM_H)} fill={C.rf} stroke={false} op={0.12 * glow} />}
    </g>
  );
};

/** the research radio: tripod, FMCW box (front cover can open: `open` 0..1), T array */
export const Radio: React.FC<{b: B; open?: number; pulse?: number}> = ({b, open = 0, pulse = 0}) => {
  const {n, h} = antAxes();
  const k = scaleAt(b, v3(ANT.x, ANT.y, ANT.z));
  const lw = Math.max(1, k * 0.008);
  const face = (u0: number, u1: number, y0: number, y1: number, nn: number): V3[] => [antPt(u0, y0, nn), antPt(u1, y0, nn), antPt(u1, y1, nn), antPt(u0, y1, nn)];
  const side = (u: number, y0: number, y1: number, d: number): V3[] => [antPt(u, y0, 0), antPt(u, y0, -d), antPt(u, y1, -d), antPt(u, y1, 0)];
  const topF = (u0: number, u1: number, y: number, d: number): V3[] => [antPt(u0, y, 0), antPt(u1, y, 0), antPt(u1, y, -d), antPt(u0, y, -d)];
  const mast = (y0: number, y1: number) => [antPt(0, y0, -0.06), antPt(0, y1, -0.06)];
  // tripod legs
  const foot = (a: number) => v3(ANT.x + Math.cos(a) * 0.3, 0, ANT.z + Math.sin(a) * 0.3);
  const hub = v3(ANT.x - n.x * 0.06, 0.3, ANT.z - n.z * 0.06);
  const patches: React.ReactNode[] = [];
  // horizontal array: 8 patches; vertical array: 5 patches below the bar
  for (let i = 0; i < 8; i++) {
    const u = -0.33 + i * (0.66 / 7);
    patches.push(<Poly key={`h${i}`} b={b} pts={face(u - 0.03, u + 0.03, ANT.y - 0.03, ANT.y + 0.03, 0.012)} fill={mixHex('#E9B949', '#FFF3B0', pulse)} sw={0.5} />);
  }
  for (let i = 0; i < 4; i++) {
    const yy = ANT.y - 0.15 - i * 0.1;
    patches.push(<Poly key={`v${i}`} b={b} pts={face(-0.03, 0.03, yy - 0.03, yy + 0.03, 0.012)} fill={mixHex('#E9B949', '#FFF3B0', pulse)} sw={0.5} />);
  }
  const boxY0 = 0.12 + 0.18, boxY1 = 0.3 + 0.2;
  return (
    <g>
      {[30, 150, 270].map((a) => <Line3 key={a} b={b} pts={[hub, foot((a * Math.PI) / 180)]} stroke={C.dark} w={0.022} />)}
      <Line3 b={b} pts={mast(0.3, ANT.y + 0.04)} stroke={C.metalDeep} w={0.035} />
      {/* FMCW unit on the mast */}
      <g>
        <Poly b={b} pts={side(0.16, boxY0, boxY1, 0.2)} fill={C.dark} />
        <Poly b={b} pts={topF(-0.16, 0.16, boxY1, 0.2)} fill="#4A5D69" />
        <Poly b={b} pts={face(-0.16, 0.16, boxY0, boxY1, 0)} fill="#33444F" />
        {/* the opened cover reveals the board: chirp generator, mixer, the antenna feeds */}
        {open > 0.01 && (
          <g opacity={clamp(open * 1.5)}>
            <Poly b={b} pts={face(-0.145, 0.145, boxY0 + 0.015, boxY1 - 0.015, 0.002)} fill="#1E6B4F" sw={0.6} />
            <Poly b={b} pts={face(-0.1, -0.03, boxY0 + 0.07, boxY0 + 0.14, 0.004)} fill="#111A20" sw={0.5} />
            <Poly b={b} pts={face(0.01, 0.07, boxY0 + 0.09, boxY0 + 0.15, 0.004)} fill="#C9D3D9" sw={0.5} />
            {[0.2, 0.35, 0.5, 0.65, 0.8].map((q) => <Line3 key={q} b={b} pts={[antPt(-0.13 + q * 0.26, boxY0 + 0.03, 0.005), antPt(-0.13 + q * 0.26, boxY0 + 0.06, 0.005)]} stroke={C.amber} w={0.006} />)}
            <Line3 b={b} pts={[antPt(-0.03, boxY0 + 0.105, 0.005), antPt(0.01, boxY0 + 0.12, 0.005)]} stroke={C.amber} w={0.005} />
          </g>
        )}
        {/* the cover swings open about its left edge */}
        {open < 0.99 && (() => {
          const a = open * 1.9;
          const hinge = antPt(-0.16, 0, 0);
          const pt = (u: number, yy: number) => {
            const r = u + 0.16;
            const {n: nn, h: hh} = antAxes();
            return v3(hinge.x + hh.x * Math.cos(a) * r + nn.x * Math.sin(a) * r, yy, hinge.z + hh.z * Math.cos(a) * r + nn.z * Math.sin(a) * r);
          };
          return <Poly b={b} pts={[pt(-0.16, boxY0), pt(0.16, boxY0), pt(0.16, boxY1), pt(-0.16, boxY1)]} fill={open > 0 ? '#3E515D' : '#33444F'} />;
        })()}
        {open < 0.2 && <Poly b={b} pts={face(0.08, 0.13, boxY1 - 0.06, boxY1 - 0.03, 0.003)} fill={pulse > 0.5 ? '#7CFFB2' : '#2FD27A'} sw={0.4} />}
      </g>
      {/* the T array: horizontal bar and vertical bar, each a shallow box */}
      <Poly b={b} pts={side(0.4, ANT.y - 0.07, ANT.y + 0.07, 0.05)} fill={C.metalDeep} />
      <Poly b={b} pts={topF(-0.4, 0.4, ANT.y + 0.07, 0.05)} fill="#E5ECEF" />
      <Poly b={b} pts={face(-0.4, 0.4, ANT.y - 0.07, ANT.y + 0.07, 0)} fill={C.metal} />
      <Poly b={b} pts={side(0.065, ANT.y - 0.56, ANT.y - 0.07, 0.05)} fill={C.metalDeep} />
      <Poly b={b} pts={face(-0.065, 0.065, ANT.y - 0.56, ANT.y - 0.07, 0)} fill={C.metal} />
      {patches}
      {/* cable from the unit to the display stand */}
      <Line3 b={b} pts={[antPt(-0.12, boxY0, -0.1), v3(ANT.x - 0.2, 0.02, ANT.z - 0.25), v3(MON.x + 0.25, 0.02, MON.z + 0.2), v3(MON.x + 0.05, 0.1, MON.z + 0.06)]} stroke={C.darker} w={lw} px />
    </g>
  );
};

/** the display stand (the screen's content is drawn by the scene into the returned rect) */
export const monRect = (b: B) => {
  const tl = proj(b, v3(MON.x - MON.w / 2, MON.y + MON.h / 2, MON.z)), br = proj(b, v3(MON.x + MON.w / 2, MON.y - MON.h / 2, MON.z));
  return {x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y};
};
export const MonitorStand: React.FC<{b: B; children?: React.ReactNode}> = ({b, children}) => {
  const u = useUid();
  const bz = 0.035;
  const r = monRect(b);
  const k = scaleAt(b, v3(MON.x, MON.y, MON.z));
  return (
    <g>
      {/* base with castors, pole */}
      {[0, 72, 144, 216, 288].map((a) => {
        const A = (a * Math.PI) / 180;
        return <Line3 key={a} b={b} pts={[v3(MON.x, 0.07, MON.z + 0.12), v3(MON.x + Math.cos(A) * 0.3, 0.05, MON.z + 0.12 + Math.sin(A) * 0.3)]} stroke={C.dark} w={0.03} />;
      })}
      <Line3 b={b} pts={[v3(MON.x, 0.07, MON.z + 0.12), v3(MON.x, MON.y - 0.1, MON.z + 0.12)]} stroke={C.metalDeep} w={0.045} />
      {/* screen: bezel, then the content clipped to the panel */}
      <Poly b={b} pts={rz(MON.z, MON.x - MON.w / 2 - bz, MON.x + MON.w / 2 + bz, MON.y - MON.h / 2 - bz, MON.y + MON.h / 2 + bz)} fill="#1B252C" />
      <defs>
        <clipPath id={`${u}monclip`}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} />
        </clipPath>
      </defs>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={C.screen} />
      <g clipPath={`url(#${u}monclip)`}>{children}</g>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="#000" strokeOpacity={0.5} strokeWidth={Math.max(1, k * 0.003)} />
    </g>
  );
};

/** the security camera: a drop pole from the ceiling and a bullet camera seen side-on, lens toward the door (screen
 *  left). `cover` 0..1: a palm over the lens is drawn by the hand itself; here only the status LED goes out. */
export const Cctv: React.FC<{b: B; live?: boolean}> = ({b, live = true}) => {
  const c = CCTV;
  const k = scaleAt(b, v3(c.x, c.y, c.z));
  const lw = Math.max(1, k * 0.0042);
  const body = proj(b, v3(c.x, c.y, c.z));
  const top = proj(b, v3(c.x + 0.04, ROOM_H, c.z));
  const L = 0.3 * k, Hh = 0.115 * k;
  return (
    <g>
      <line x1={f1(top.x)} y1={f1(top.y)} x2={f1(body.x + L * 0.14)} y2={f1(body.y - Hh * 0.4)} stroke={INK} strokeWidth={0.04 * k + lw * 2} strokeLinecap="round" />
      <line x1={f1(top.x)} y1={f1(top.y)} x2={f1(body.x + L * 0.14)} y2={f1(body.y - Hh * 0.4)} stroke={C.metal} strokeWidth={0.04 * k} strokeLinecap="round" />
      <ellipse cx={f1(top.x)} cy={f1(top.y + 0.01 * k)} rx={f1(0.07 * k)} ry={f1(0.02 * k)} fill={C.metal} stroke={INK} strokeWidth={lw} />
      <g transform={`translate(${f1(body.x)} ${f1(body.y)}) rotate(-14)`}>
        <rect x={-L * 0.42} y={-Hh / 2} width={L * 0.84} height={Hh} rx={Hh * 0.3} fill="#F1F4F5" stroke={INK} strokeWidth={lw} />
        <rect x={-L * 0.55} y={-Hh * 0.62} width={L * 1.02} height={Hh * 0.2} rx={Hh * 0.08} fill="#DDE3E6" stroke={INK} strokeWidth={lw * 0.8} />
        <rect x={-L * 0.52} y={-Hh * 0.4} width={L * 0.13} height={Hh * 0.8} rx={Hh * 0.14} fill="#2B3A44" stroke={INK} strokeWidth={lw * 0.8} />
        <ellipse cx={-L * 0.52} cy={0} rx={Hh * 0.1} ry={Hh * 0.3} fill="#0B1218" />
        <circle cx={L * 0.28} cy={Hh * 0.12} r={Hh * 0.09} fill={live ? '#FF3B3B' : '#5A2A2A'} />
      </g>
    </g>
  );
};
export const PubScreen: React.FC<{b: B; children?: React.ReactNode}> = ({b, children}) => {
  const u = useUid();
  const r = pubRect(b);
  return (
    <g>
      {[-0.18, 0.18].map((dx) => <Line3 key={dx} b={b} pts={[v3(PUB.x + dx, ROOM_H, PUB.z + 0.02), v3(PUB.x + dx, PUB.y + PUB.h / 2, PUB.z + 0.02)]} stroke={C.metalDeep} w={0.012} />)}
      <Poly b={b} pts={rz(PUB.z, PUB.x - PUB.w / 2 - 0.025, PUB.x + PUB.w / 2 + 0.025, PUB.y - PUB.h / 2 - 0.025, PUB.y + PUB.h / 2 + 0.025)} fill="#1B252C" />
      <defs>
        <clipPath id={`${u}pubclip`}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} />
        </clipPath>
      </defs>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#24343E" />
      <g clipPath={`url(#${u}pubclip)`}>{children}</g>
    </g>
  );
};
export const pubRect = (b: B) => {
  const pr = proj(b, v3(PUB.x - PUB.w / 2, PUB.y + PUB.h / 2, PUB.z)), pb = proj(b, v3(PUB.x + PUB.w / 2, PUB.y - PUB.h / 2, PUB.z));
  return {x: pr.x, y: pr.y, w: pb.x - pr.x, h: pb.y - pr.y};
};
export {lerp};
