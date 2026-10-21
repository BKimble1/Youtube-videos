// V2 catch site: square lattice tower, carriage, two deep trussed catch arms, quick-disconnect arm (retracted), launch
// mount over a flame trench, hardstand, tank farm, coast. All geometry lives in one world frame (metres, see cam3.ts):
// tower centre at the origin, arms reach toward +X, the vehicle hangs between them at X = VX, Z = 0.
// Arm swing (about the vertical pivots on the carriage) and carriage travel (up the mast) are separate motions.
import React from 'react';
import {Cam3, V3, poly, proj} from './cam3';
import {Pal} from './vehicles';

export const TW = 6; // half-width of the mast
export const VX = 22; // vehicle axis X
export const ARM_LEN = 30;
export const ARM_Z = 6.6; // pivot Z (±)
export const TOWER_H = 142;
const D = Math.PI / 180;

export type Light = 'day' | 'dusk' | 'night' | 'studio';
type L = {mast: string; mastBack: string; arm: string; armHi: string; armLo: string; rail: string; concrete: string; ground: string; sand: string; sea: string; tank: string; tankHi: string; haze: string};
export const LIGHTS: Record<Light, L> = {
  day: {mast: '#38424d', mastBack: '#7d8994', arm: '#46525e', armHi: '#6f7d8b', armLo: '#2b333c', rail: '#c9d1d9', concrete: '#c9c6bd', ground: '#b9b39f', sand: '#d3c7a3', sea: '#5a8fb8', tank: '#e6e8ea', tankHi: '#ffffff', haze: 'rgba(205,225,240,0.55)'},
  dusk: {mast: '#2a2a33', mastBack: '#6e5f66', arm: '#34343f', armHi: '#6b5b5f', armLo: '#1f2027', rail: '#f2c7a2', concrete: '#9d8a85', ground: '#6e645d', sand: '#8d7766', sea: '#7d6b7e', tank: '#c9b3aa', tankHi: '#f0d2bd', haze: 'rgba(240,170,140,0.4)'},
  night: {mast: '#1a1f27', mastBack: '#323b48', arm: '#222a34', armHi: '#3f4c5c', armLo: '#13171d', rail: '#7d95b5', concrete: '#3a404a', ground: '#262b31', sand: '#2e3236', sea: '#18223a', tank: '#4b5562', tankHi: '#6e7c8c', haze: 'rgba(40,55,80,0.5)'},
  studio: {mast: '#3b4651', mastBack: '#8592a0', arm: '#4a5664', armHi: '#748392', armLo: '#2e3640', rail: '#e8edf2', concrete: '#d5d2c8', ground: '#c7c1ad', sand: '#d8ceb0', sea: '#6c9cc2', tank: '#eceef0', tankHi: '#ffffff', haze: 'rgba(220,232,242,0.5)'},
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
      const h = seg(c, A1, B1);
      out.push(<line key={`h${i}`} {...h} stroke={col} strokeWidth={sw * 0.9} />);
      const d1 = seg(c, A0, B1), d2 = seg(c, B0, A1);
      out.push(<line key={`d${i}`} {...d1} stroke={col} strokeWidth={sw * 0.6} />);
      out.push(<line key={`e${i}`} {...d2} stroke={col} strokeWidth={sw * 0.6} />);
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
      <polyline points={poly([armPt(s, side, 0.12, RAIL_DY, -1.3), armPt(s, side, 0.96, RAIL_DY, -1.3)].map(P))} fill="none" stroke={hiRail > 0 ? hi : C.rail} strokeWidth={w * 2.0} strokeOpacity={hiRail > 0 ? 0.5 + 0.5 * hiRail : 1} />
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

// ---------------- ground, mount, tank farm ----------------
export const MOUNT_TOP = 19;

const Cyl: React.FC<{c: Cam3; x: number; z: number; r: number; y0: number; y1: number; fill: string; hi: string; stroke: string}> = ({c, x, z, r, y0, y1, fill, hi, stroke}) => {
  const a = proj(c, [x, y0, z]), b = proj(c, [x, y1, z]);
  const rx = r * c.z;
  const ry = Math.abs(Math.sin(c.pitch * D)) * r * c.z + 0.5;
  return (
    <g>
      <path d={`M${a[0] - rx} ${a[1]} L${b[0] - rx} ${b[1]} L${b[0] + rx} ${b[1]} L${a[0] + rx} ${a[1]} A ${rx} ${ry} 0 0 1 ${a[0] - rx} ${a[1]} Z`} fill={fill} stroke={stroke} strokeWidth={1.2} />
      <rect x={a[0] - rx * 0.55} y={b[1]} width={rx * 0.3} height={a[1] - b[1]} fill={hi} opacity={0.5} />
      <ellipse cx={b[0]} cy={b[1]} rx={rx} ry={ry} fill={hi} stroke={stroke} strokeWidth={1} />
    </g>
  );
};

/** Ground: a screen-space horizon (orthographic ground lines of equal depth are horizontal), coastal flats below it,
 *  and the finite concrete hardstand drawn as a projected polygon. */
export const groundHorizon = (c: Cam3) => {
  const D_ = Math.PI / 180;
  // depth axis in world for this yaw: points straight ahead of the camera on the ground
  const ahead = (d: number): V3 => [c.at[0] + Math.sin(c.yaw * D_) * d, 0, c.at[2] - Math.cos(c.yaw * D_) * d];
  const far = proj(c, ahead(420))[1], here = proj(c, ahead(0))[1];
  return c.pitch > 0.5 ? Math.min(far, here) : here;
};
export const Ground: React.FC<{c: Cam3; l: Light}> = ({c, l}) => {
  const C = LIGHTS[l];
  const P = (v: V3) => proj(c, v);
  const hz = groundHorizon(c);
  if (hz > 1200) return null;
  return (
    <g>
      <rect x={-50} y={hz - 7} width={2020} height={9} fill={C.sea} />
      <rect x={-50} y={hz} width={2020} height={Math.max(0, 1200 - hz)} fill={C.sand} />
      {c.pitch > 0.5 ? <polygon points={poly([[-90, 0, -70], [90, 0, -70], [90, 0, 60], [-90, 0, 60]].map((p) => P(p as V3)))} fill={C.concrete} /> : null}
      <rect x={-50} y={hz - 16} width={2020} height={16} fill={C.haze} />
    </g>
  );
};

export const TankFarm: React.FC<{c: Cam3; l: Light}> = ({c, l}) => {
  const C = LIGHTS[l];
  const tanks: [number, number, number, number][] = [[-48, -40, 5, 26], [-60, -40, 5, 26], [-72, -40, 5, 26], [-54, -58, 4, 20], [-66, -58, 4, 20], [-84, -46, 3.5, 16]];
  return (
    <g opacity={0.95}>
      {tanks.sort((a, b) => a[1] - b[1]).map(([x, z, r, h], i) => (
        <Cyl key={i} c={c} x={x} z={z} r={r} y0={0} y1={h} fill={C.tank} hi={C.tankHi} stroke={LIGHTS[l].mast} />
      ))}
    </g>
  );
};

/** Pad 2-style launch mount: concrete plinth over the flame trench, steel launch ring on top. */
export const Mount: React.FC<{c: Cam3; l: Light}> = ({c, l}) => {
  const C = LIGHTS[l];
  const P = (v: V3) => proj(c, v);
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
    const f: V3[] = [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    const s: V3[] = [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]];
    const sl: V3[] = [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]];
    const t: V3[] = [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    return {f, s, sl, t};
  };
  const pl = box(VX - 13, VX + 13, 0, 11, -13, 13);
  return (
    <g strokeLinejoin="round">
      <polygon points={poly(pl.sl.map(P))} fill={C.concrete} stroke={C.mast} strokeWidth={1.2} opacity={0.9} />
      <polygon points={poly(pl.s.map(P))} fill={C.concrete} stroke={C.mast} strokeWidth={1.2} />
      <polygon points={poly(pl.f.map(P))} fill={C.concrete} stroke={C.mast} strokeWidth={1.4} />
      <polygon points={poly(pl.t.map(P))} fill={C.ground} stroke={C.mast} strokeWidth={1.2} />
      {/* flame-trench mouth on the front face */}
      <polygon points={poly(([[VX - 7, 0, 13], [VX + 7, 0, 13], [VX + 7, 7.5, 13], [VX - 7, 7.5, 13]] as V3[]).map(P))} fill="#15181c" />
      {/* steel launch ring */}
      <Cyl c={c} x={VX} z={0} r={8.6} y0={11} y1={MOUNT_TOP} fill={C.arm} hi={C.armHi} stroke={C.mast} />
      <Cyl c={c} x={VX} z={0} r={6.4} y0={MOUNT_TOP} y1={MOUNT_TOP + 0.6} fill="#20252b" hi="#2c3238" stroke={C.mast} />
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
      {ground ? <Ground c={c} l={l} /> : null}
      {farm ? <TankFarm c={c} l={l} /> : null}
      <Mast c={c} l={l} top={mastTop} />
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
export const PinMark: React.FC<{c: Cam3; s: ArmState; above: number; side?: 1 | -1; dx?: number; hi?: number; size?: number}> = ({c, s, above, side = 1, dx = 0, hi = 1, size = 1.2}) => {
  const zR = side * (ARM_Z - 1.3);
  const y0 = s.carY + RAIL_DY + above;
  const q = ([[VX + dx - size / 2, y0, zR], [VX + dx + size / 2, y0, zR], [VX + dx + size / 2, y0 + size * 0.85, zR], [VX + dx - size / 2, y0 + size * 0.85, zR]] as V3[]).map((p) => proj(c, p));
  return <polygon points={poly(q)} fill={hi > 0 ? '#ffc93c' : '#7e8994'} stroke="#1c232b" strokeWidth={Math.max(1.5, c.z * 0.12)} strokeLinejoin="round" />;
};

/** Place a vehicle (drawn in its local metre frame) with its base centre at world point p, tilted by `tilt` deg in screen. */
export const Place: React.FC<{c: Cam3; p: V3; tilt?: number; children: React.ReactNode}> = ({c, p, tilt = 0, children}) => {
  const s = proj(c, p);
  const ky = Math.cos(c.pitch * D);
  return <g transform={`translate(${s[0]} ${s[1]}) rotate(${tilt + (c.roll ?? 0)}) scale(${c.z} ${c.z * ky})`}>{children}</g>;
};

/** Vehicle azimuth for a ship/booster whose heat-shield (or reference) side faces world heading h (deg from +Z toward +X). */
export const azFor = (c: Cam3, h: number) => -c.yaw - h;
