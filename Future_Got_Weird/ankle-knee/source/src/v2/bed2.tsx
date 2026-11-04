// "When Wyatt woke up, he could still wiggle his toes." Recovery, side view. He lies back on the raised bed, his
// back and head on pillows; the operated leg rests on a pillow and his own turned foot hangs over its end with the
// toes resting on the blanket. Close on the toes first; one small wiggle presses a crease into the fabric; then his
// eyes, tracking down, and the slightest smile; then down his gaze to the crease again (it becomes a lace).
import React from 'react';
import {Cam, Layer, W, H, camScale, glide, CKey, travel} from '../camera';
import {Inked, InkPath, InkLine, INK} from '../dc/ink';
import {Blob, SoftShadow} from '../dc/shade';
import {lit, shade} from '../dc/color';
import {fmt, V} from '../dc/math';
import {closed} from '../core/geo';
import {C} from '../art/pal';
import {clamp, ss, ss5, lerp} from '../lib';
import {T, shotStart, shotEnd} from './story2';
import {Wyatt2, bjoints} from './body';
import {recoveryPose} from './poses';
import {EXPR_NEUTRAL} from '../dc/Head';

const pth = (ps: [number, number][], t = 0.6) => closed(ps.map(([x, y]) => ({x, y})), t);
const HB: V = {x: 0, y: -22};
const TOP = -11; // the blanket's surface under the foot

export const bedState = (t: number) => {
  const wig = clamp((t - (T.wiggle - 0.02)) / 0.5);
  const toe = 34 * Math.sin(Math.PI * wig) * (wig > 0 && wig < 1 ? 1 : 0) + 6 * Math.max(0, Math.sin(Math.PI * clamp((t - (T.woke + 0.1)) / 0.4)));
  const press = clamp(toe / 34);
  const eyes = ss(t, T.toes2 - 0.25, T.toes2 + 0.15);
  const smile = ss(t, T.toes2 + 0.1, T.toes2 + 0.5);
  const pose = recoveryPose({H: HB, neck: 22 + 6 * eyes, blink: t < T.woke + 0.1 ? 1 : Math.max(0, 1 - (t - T.woke - 0.1) / 0.25) * 0.6, expr: {...EXPR_NEUTRAL, lid: lerp(0.4, 0.2, eyes), gx: lerp(-0.1, -0.75, eyes), gy: lerp(0.2, 0.95, eyes), smile: lerp(0.05, 0.42, smile), flush: 0.25}});
  return {pose, toe, press, crease: clamp(press * 1.4 + ss(t, T.wiggle + 0.3, T.toes2) * 0.35)};
};
export const bedCam = (t: number): Cam => {
  const j = bjoints(bedState(t).pose);
  const toeC = {x: j.A.x - 3.5, y: TOP - 5};
  const t0 = shotStart('bed'), t1 = shotEnd('bed');
  const keys: CKey[] = [
    [t0, {x: toeC.x, y: toeC.y, w: 26, eye: -40}],
    [T.wiggle + 0.28, {x: toeC.x + 1, y: toeC.y + 1, w: 22, eye: -40}, travel],
    [T.toes2 + 0.38, {x: j.headC.x - 5, y: j.headC.y + 10, w: 44, eye: -40}, travel],
    [t1 - 0.2, {x: j.headC.x - 6, y: j.headC.y + 11, w: 44, eye: -40}, travel],
    [t1, {x: toeC.x, y: TOP - 1.5, w: 16, eye: -40}, travel],
  ];
  return glide(t, keys);
};
/** the crease the toes press into the blanket (screen-matched later by the lace) */
export const Crease: React.FC<{c: V; s: number; iw: number}> = ({c, s, iw}) => (
  <g opacity={0.25 + 0.75 * s}>
    {[-1, -0.35, 0.35, 1].map((k, i) => (
      <path key={i} d={`M${fmt(c.x + k * 2.2)},${fmt(c.y + 0.4)} Q${fmt(c.x + k * (4.5 + 2 * s))},${fmt(c.y + 1.6 + s)} ${fmt(c.x + k * (7.5 + 3 * s))},${fmt(c.y + 2.4 + 1.6 * Math.abs(k))}`} fill="none" stroke={shade(C.gown, 0.45)} strokeWidth={iw * (0.5 + 0.5 * s)} strokeLinecap="round" />
    ))}
    <ellipse cx={fmt(c.x)} cy={fmt(c.y + 0.6)} rx={fmt(3.5 + s)} ry={fmt(0.6 + 0.5 * s)} fill={shade(C.gown, 0.35)} opacity={0.6} />
  </g>
);

export const BedShot2: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = bedCam(t);
  const px = 1 / camScale(c);
  const iw = 7 * px;
  const st = bedState(t);
  const j = bjoints(st.pose);
  const toeTip = {x: j.A.x - 3.2, y: TOP};
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs><linearGradient id={`${k}wl`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={lit(C.wall, 0.3)} /><stop offset="1" stopColor={C.wallDeep} /></linearGradient></defs>
        <rect x={0} y={0} width={W} height={H} fill={`url(#${k}wl)`} />
      </svg>
      <Layer c={c}>
        {/* raised backrest and pillows behind back and head */}
        <Inked w={iw}><InkPath d={pth([[2, TOP + 2], [24, TOP + 2], [64, -80], [44, -92]], 0.25)} fill={C.bed} /></Inked>
        <Inked w={iw}><Blob id={`${k}hp`} d={pth([[12, -64], [30, -86], [46, -80], [44, -50], [24, -40]])} c={{x: 30, y: -66}} r={26} color={C.sheet} /></Inked>
        {/* mattress and blanket (over the other leg and his lap) */}
        <Inked w={iw}><InkPath d={pth([[-80, TOP], [40, TOP], [40, TOP + 14], [-80, TOP + 14]], 0.12)} fill={C.sheet} /></Inked>
        <Inked w={iw}>
          <Blob id={`${k}bl`} d={pth([[-80, TOP + 2], [-80, TOP - 4], [-55, TOP - 6], [-20, TOP - 9], [2, TOP - 16], [10, TOP - 12], [12, TOP + 2]])} c={{x: -30, y: TOP - 10}} r={50} color={C.gown} k={0.7} />
        </Inked>
        {/* the pillow under his thigh */}
        <Inked w={iw}><Blob id={`${k}lp`} d={pth([[-30, TOP - 2], [-31, -19], [-18, -22.5], [2, -20], [6, TOP - 6]])} c={{x: -14, y: -20}} r={22} color={lit(C.sheet, 0.1)} /></Inked>
        <SoftShadow id={`${k}ts`} c={{x: toeTip.x, y: TOP + 0.6}} rx={5} ry={1} alpha={0.25} color="#3E5B6B" />
        <Crease c={toeTip} s={st.crease} iw={iw} />
        <Wyatt2 p={st.pose} o={{id: `${k}w`, px, shoeN: 'bare', shoeF: 'bare', prosthesis: false, footRel: 90, toeCurl: st.toe, shirt: C.gown, shorts: C.gown, sock: null}} />
        {/* the blanket's edge over the hip, in front of the near arm's elbow */}
        <InkLine d={`M${fmt(-60)},${fmt(TOP - 4.5)} Q${fmt(-40)},${fmt(TOP - 6)} ${fmt(-22)},${fmt(TOP - 8.4)}`} w={iw * 0.5} opacity={0.4} />
      </Layer>
      {void INK}{void ss5}
    </>
  );
};
