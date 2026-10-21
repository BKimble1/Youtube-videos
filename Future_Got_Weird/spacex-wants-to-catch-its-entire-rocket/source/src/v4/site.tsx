// V2 catch site: square lattice tower, carriage, two deep trussed catch arms, quick-disconnect arm (retracted), launch
// mount over a flame trench, hardstand, tank farm, coast. All geometry lives in one world frame (metres, see cam3.ts):
// tower centre at the origin, arms reach toward +X, the vehicle hangs between them at X = VX, Z = 0.
// Arm swing (about the vertical pivots on the carriage) and carriage travel (up the mast) are separate motions.
import React from 'react';
import {Cam3, V3, poly, proj} from './cam3';
import {Pal} from './vehicles';
import {rnd} from '../kit/anim';

export const TW = 6; // half-width of the mast
export const VX = 22; // vehicle axis X
export const ARM_LEN = 30;
export const ARM_Z = 6.6; // pivot Z (±)
export const TOWER_H = 142;
const D = Math.PI / 180;

export type Light = 'day' | 'dusk' | 'night' | 'studio';
type L = {mast: string; mastBack: string; arm: string; armHi: string; armLo: string; rail: string; concrete: string; ground: string; sand: string; sea: string; tank: string; tankHi: string; haze: string; marsh: string; lagoon: string; road: string};
// Pad 2 steel reads light silver-grey in daylight (footage 06, 10); deep shadow tones carry the structure.
export const LIGHTS: Record<Light, L> = {
  day: {mast: '#7d868f', mastBack: '#b4bbc1', arm: '#6d7781', armHi: '#aab2b9', armLo: '#4a535c', rail: '#d5dadd', concrete: '#cdc8bb', ground: '#bdb39a', sand: '#b9ad93', sea: '#5f93b6', tank: '#e9ebec', tankHi: '#ffffff', haze: 'rgba(205,225,240,0.55)', marsh: '#8c8f6c', lagoon: '#9ab8c6', road: '#9a958a'},
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
  const depth = Math.max(1, 1200 - hz);
  const pan = c.at[0] * c.z * 0.35 + c.yaw * 9;
  // coastal flats seen at a grazing angle: marsh and lagoon patches compress toward the horizon
  const patches = Array.from({length: 60}, (_, i) => {
    const v = Math.pow(rnd(i, 51), 1.8); // 0 at the horizon … 1 near
    const y = hz + 4 + v * Math.min(depth, 700);
    const sc = 0.15 + v * 1.4;
    const x = ((((rnd(i, 52) * 2600 - pan * (0.3 + v)) % 2600) + 2600) % 2600) - 340;
    return {x, y, w: (140 + rnd(i, 53) * 380) * sc, h: (3 + rnd(i, 54) * 5) * sc, lag: rnd(i, 55) < 0.22, v};
  }).sort((p, q) => p.v - q.v);
  return (
    <g>
      <rect x={-50} y={hz - 7} width={2020} height={9} fill={C.sea} />
      <rect x={-50} y={hz} width={2020} height={depth} fill={C.sand} />
      {patches.map((p, i) => <ellipse key={i} cx={p.x} cy={p.y} rx={p.w} ry={p.h} fill={p.lag ? C.lagoon : C.marsh} opacity={p.lag ? 0.85 : 0.6} />)}
      {c.pitch > 0.5 ? (
        <g>
          <polygon points={poly([[-90, 0, -70], [95, 0, -70], [95, 0, 60], [-90, 0, 60]].map((p) => P(p as V3)))} fill={C.concrete} />
          {[-60, -30, 0, 30, 60].map((x) => <polyline key={x} points={poly([[x, 0, -70], [x, 0, 60]].map((p) => P(p as V3)))} stroke={C.road} strokeWidth={1} opacity={0.5} fill="none" />)}
        </g>
      ) : null}
      <rect x={-50} y={hz - 16} width={2020} height={16} fill={C.haze} />
    </g>
  );
};

/** Horizontal tank lying along X. */
const HTank: React.FC<{c: Cam3; x0: number; x1: number; z: number; r: number; fill: string; hi: string; stroke: string}> = ({c, x0, x1, z, r, fill, hi, stroke}) => {
  const a = proj(c, [x0, r, z]), b = proj(c, [x1, r, z]);
  const w = 2 * r * c.z;
  return (
    <g strokeLinecap="round">
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={stroke} strokeWidth={w + 2} />
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={fill} strokeWidth={w} />
      <line x1={a[0]} y1={a[1] - w * 0.22} x2={b[0]} y2={b[1] - w * 0.22} stroke={hi} strokeWidth={w * 0.18} opacity={0.8} />
    </g>
  );
};
/** Propellant farm as seen in the Pad 2 footage: two large vertical tanks, a tall slender tank, a long bank of
 *  horizontal tanks, small service buildings. Positions fixed for every shot. */
export const TankFarm: React.FC<{c: Cam3; l: Light}> = ({c, l}) => {
  const C = LIGHTS[l];
  const items: {d: number; el: React.ReactNode}[] = [];
  const vt: [number, number, number, number][] = [[-62, -46, 7.5, 34], [-80, -40, 7.5, 34], [-40, -60, 3.2, 46]];
  vt.forEach(([x, z, r, h], i) => items.push({d: proj(c, [x, 10, z])[2], el: <Cyl key={`v${i}`} c={c} x={x} z={z} r={r} y0={0} y1={h} fill={C.tank} hi={C.tankHi} stroke={C.mast} />}));
  [[-28, -26], [-34, -18], [-40, -10]].forEach(([z, zz], i) => items.push({d: proj(c, [-60, 3, z])[2], el: <HTank key={`h${i}`} c={c} x0={-95} x1={-30} z={z} r={3.2} fill={C.tank} hi={C.tankHi} stroke={C.mast} />}));
  return <g opacity={0.97}>{items.sort((p, q) => p.d - q.d).map((p) => p.el)}</g>;
};

/** Pad 2-style launch mount (footage 06): a launch table raised on angled steel legs over the flame trench, on a
 *  concrete pad. The vehicle stands on the table ring at MOUNT_TOP. */
export const Mount: React.FC<{c: Cam3; l: Light}> = ({c, l}) => {
  const C = LIGHTS[l];
  const P = (v: V3) => proj(c, v);
  const w = Math.max(1.2, c.z * 0.7);
  const legs = Array.from({length: 6}, (_, i) => (i / 6) * Math.PI * 2 + 0.3).map((a) => ({
    top: [VX + Math.cos(a) * 7.5, MOUNT_TOP - 3, Math.sin(a) * 7.5] as V3,
    bot: [VX + Math.cos(a) * 12, 0, Math.sin(a) * 12] as V3,
  }));
  const ld = legs.map((g) => ({...g, d: proj(c, g.top)[2]})).sort((p, q) => p.d - q.d);
  const pad: V3[] = [[VX - 16, 0.05, -16], [VX + 16, 0.05, -16], [VX + 16, 0.05, 16], [VX - 16, 0.05, 16]];
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {c.pitch > 0.5 ? <polygon points={poly(pad.map(P))} fill={C.concrete} stroke={C.road} strokeWidth={1} /> : null}
      {c.pitch > 0.5 ? <ellipse cx={P([VX, 0, 0])[0]} cy={P([VX, 0, 0])[1]} rx={9 * c.z} ry={9 * c.z * Math.sin(c.pitch * D)} fill="#2a2d31" /> : null}
      {ld.filter((g) => g.d < 0).map((g, i) => <line key={`b${i}`} x1={P(g.top)[0]} y1={P(g.top)[1]} x2={P(g.bot)[0]} y2={P(g.bot)[1]} stroke={C.armLo} strokeWidth={w * 2.2} />)}
      <Cyl c={c} x={VX} z={0} r={9.5} y0={MOUNT_TOP - 4} y1={MOUNT_TOP} fill={C.arm} hi={C.armHi} stroke={C.armLo} />
      <Cyl c={c} x={VX} z={0} r={6.2} y0={MOUNT_TOP} y1={MOUNT_TOP + 0.6} fill="#24282d" hi="#30353b" stroke={C.armLo} />
      {ld.filter((g) => g.d >= 0).map((g, i) => <line key={`f${i}`} x1={P(g.top)[0]} y1={P(g.top)[1]} x2={P(g.bot)[0]} y2={P(g.bot)[1]} stroke={C.arm} strokeWidth={w * 2.2} />)}
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
  const ky = Math.cos(c.pitch * D);
  return <g transform={`translate(${s[0]} ${s[1]}) rotate(${tilt + (c.roll ?? 0)}) scale(${c.z} ${c.z * ky})`}>{children}</g>;
};

/** Vehicle azimuth for a ship/booster whose heat-shield (or reference) side faces world heading h (deg from +Z toward +X). */
export const azFor = (c: Cam3, h: number) => -c.yaw - h;
