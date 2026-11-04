// "That backward ankle now bent the same way as his other knee." A rehab room, a low three-quarter lens at knee
// height. Wyatt stands between parallel rails, his feet planted and a little staggered so both joints show, his
// hands on the rails. One small supported knee bend: his hips lower, his ordinary knee and his turned ankle flex
// together while his hands stay on the rails and his elbows bend. The socket has one small window over the ankle.
import React from 'react';
import {Cam, D0, H, Layer, W, camScale, glide, CKey, travel, proj, horizonY} from '../camera';
import {Inked, INK} from '../dc/ink';
import {Capsule, SoftShadow, Lin} from '../dc/shade';
import {lit, shade} from '../dc/color';
import {fmt} from '../dc/math';
import {cleatLow} from '../art/wyatt';
import {C} from '../art/pal';
import {ss, ss5, lerp} from '../lib';
import {T, shotStart} from './story2';
import {Wyatt2, bjoints} from './body';
import {railPose, focus} from './poses';

const RAIL_Y = -70, DN = D0 - 30, DF = D0 + 30;
/** a point at depth D drawn in the subject layer (same screen position) */
const toD0 = (c: Cam, D: number, x: number, y: number) => ({x: c.x + (x - c.x) * (D0 / D), y: c.eye + (y - c.eye) * (D0 / D)});

export const railsU = (t: number) => ss5(t, T.bent - 0.12, T.same + 0.2) * (1 - ss5(t, T.other + 0.05, T.knee3 + 0.42));
export const railsCam = (t: number): Cam => {
  const t0 = shotStart('rails');
  const keys: CKey[] = [
    [t0, {x: -8, y: -64, w: 104, eye: -45}],
    [T.bent, {x: -8, y: -58, w: 94, eye: -45}, travel],
    [T.same + 0.25, {x: -7, y: -48, w: 80, eye: -45}, travel],
    [shotStart('bed'), {x: -6, y: -54, w: 88, eye: -45}, travel],
  ];
  return glide(t, keys);
};

export const Room: React.FC<{c: Cam; k: string}> = ({c, k}) => {
  const yh = horizonY(c);
  const DW = D0 + 330;
  const wallBase = proj(c, DW, {x: 0, y: 0}).y;
  const planks: React.ReactNode[] = [];
  for (let i = -14; i <= 14; i++) {
    const a = proj(c, DW, {x: c.x + i * 40, y: 0}), b = proj(c, 60, {x: c.x + i * 40, y: 0});
    planks.push(<line key={i} x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} stroke={shade('#D8C3A0', 0.18)} strokeWidth={1.6} opacity={0.5} />);
  }
  const win = [proj(c, DW, {x: c.x - 170, y: -230}), proj(c, DW, {x: c.x - 40, y: -110})];
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id={`${k}rw`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={lit('#E4EEF0', 0.2)} /><stop offset="1" stopColor="#C8D9DE" /></linearGradient>
        <linearGradient id={`${k}rf`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CDB792" /><stop offset="1" stopColor="#E3CFAC" /></linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={fmt(wallBase + 1)} fill={`url(#${k}rw)`} />
      <rect x={fmt(win[0].x)} y={fmt(win[0].y)} width={fmt(win[1].x - win[0].x)} height={fmt(win[1].y - win[0].y)} fill="#CFEAF6" stroke="#AFC6D0" strokeWidth={6} />
      <rect x={0} y={fmt(wallBase - 10)} width={W} height={12} fill="#B4C7CE" />
      <rect x={0} y={fmt(wallBase)} width={W} height={fmt(H - wallBase)} fill={`url(#${k}rf)`} />
      {planks}
      {void yh}
    </svg>
  );
};
/** one rail at depth D as seen in the subject layer, with its posts */
export const Rail: React.FC<{c: Cam; D: number; k: string; posts: number[]}> = ({c, D, k, posts}) => {
  const r = 2.0 * (D0 / D);
  const y = toD0(c, D, 0, RAIL_Y).y;
  const x0 = c.x - 400, x1 = c.x + 400;
  return (
    <g>
      {posts.map((px, i) => {
        const a = toD0(c, D, px, RAIL_Y), b = toD0(c, D, px, 0);
        return (
          <g key={i}>
            <SoftShadow id={`${k}ps${i}`} c={{x: b.x, y: b.y}} rx={6 * (D0 / D)} ry={1.6} alpha={0.25} color="#6B5A3C" />
            <Inked w={0.5}><Capsule id={`${k}p${i}`} a={a} b={b} ra={2.1 * (D0 / D)} rb={2.1 * (D0 / D)} color={C.metal} spec={0.4} /></Inked>
          </g>
        );
      })}
      <Inked w={0.5}>
        <Lin id={`${k}r`} d={`M${fmt(x0)},${fmt(y - r)} L${fmt(x1)},${fmt(y - r)} L${fmt(x1)},${fmt(y + r)} L${fmt(x0)},${fmt(y + r)} Z`} from={{x: 0, y: y - r}} to={{x: 0, y: y + r}} stops={[[0, '#F2F4F6'], [0.45, '#C3CBD3'], [1, '#7D8894']]} />
      </Inked>
    </g>
  );
};

export const RailsShot: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = railsCam(t);
  const px = 1 / camScale(c);
  const u = railsU(t);
  const settle = ss(t, shotStart('rails'), shotStart('rails') + 0.45);
  const xg = -22;
  const railN = toD0(c, DN, xg, RAIL_Y), railF = toD0(c, DF, xg - 6, RAIL_Y);
  const look = ss(t, T.bent - 0.3, T.bent + 0.2);
  const p = railPose({x: 0, u, railN: {x: railN.x, y: railN.y - (1 - settle) * 5}, railF: {x: railF.x, y: railF.y - (1 - settle) * 5}, expr: {...focus, gx: -0.2, gy: lerp(0.3, 0.95, look), smile: 0.3 + 0.2 * u}, gaze: 6 * look});
  const j = bjoints(p);
  const iw = 7 * px;
  return (
    <>
      <Room c={c} k={k} />
      <Layer c={c}>
        <Rail c={c} D={DF} k={`${k}rf`} posts={[-130, 120]} />
        {[{x: j.PA.x - 3, y: cleatLow(j.PA, j.nFoot)}, {x: j.FA.x - 3, y: cleatLow(j.FA, j.fFoot)}].map((f, i) => (
          <SoftShadow key={i} id={`${k}fs${i}`} c={{x: f.x, y: 0.3}} rx={12} ry={2} alpha={0.3} color="#6B5A3C" />
        ))}
        <Wyatt2 p={p} o={{id: `${k}w`, px, shoeN: 'sneaker', shoeF: 'sneaker', prosthesis: true, socket: {clear: 0, local: 1}, shirt: '#F2A33C', shorts: '#2E3F5C', sock: '#FFFFFF',
          beforeNearArm: <Rail c={c} D={DN} k={`${k}rn`} posts={[-150, 135]} />}} />
      </Layer>
      {void INK}
    </>
  );
};
