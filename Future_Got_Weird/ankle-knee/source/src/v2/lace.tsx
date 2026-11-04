// "And once he learned to use his new leg..."
//   LaceShot  the blanket's crease matches a loose soccer lace across a cleat's throat; two hands pull it snug.
//   StepShot  cut on the tug to the prosthetic cleat planting on turf (low), then one confident approach step from a
//             low front three-quarter view: he comes toward the lens and across, leaning forward, arms counter-swinging.
import React from 'react';
import {Cam, D0, Layer, W, H, camScale, glide, CKey, travel} from '../camera';
import {Inked, INK} from '../dc/ink';
import {Capsule, Blob} from '../dc/shade';
import {Hand} from '../dc/Hand';
import {lit, shade} from '../dc/color';
import {fmt, V} from '../dc/math';
import {closed} from '../core/geo';
import {C} from '../art/pal';
import {clamp, ss, ss5, lerp} from '../lib';
import {T, shotStart, shotEnd} from './story2';
import {Pitch, ForeGrass} from '../art/pitch';
import {Wyatt2, bjoints, SKIN} from './body';
import {strideAt, legTo, happy, HAND_PINCH, ANK} from './poses';
import {cleatLow} from '../art/wyatt';
import {SoftShadow} from '../dc/shade';

const pth = (ps: V[], t = 0.6) => closed(ps, t);

export const LaceShot: React.FC<{t: number; k: string}> = ({t, k}) => {
  const t0 = shotStart('lace'), t1 = shotEnd('lace');
  const tug = ss5(t, T.learned - 0.08, t1 - 0.04);
  const push = ss(t, t0, t1);
  const s = 46 * (1 + 0.06 * push); // px per cm
  const cx = W / 2, cy = H / 2 + 60;
  const X = (x: number, y: number) => ({x: cx + x * s, y: cy + y * s});
  // the cleat's throat seen from above: two eyelet rows that close toward each other as the lace tightens
  const gap = lerp(3.4, 2.0, tug);
  const rows = Array.from({length: 5}, (_, i) => ({y: -3.6 + i * 1.8, l: -gap - 0.2 * i, r: gap + 0.2 * i}));
  const sag = lerp(0.9, 0, tug);
  const lace = rows.slice(0, -1).map((a, i) => {
    const b = rows[i + 1];
    const p1 = X(a.l, a.y), p2 = X(b.r, b.y), q1 = X(a.r, a.y), q2 = X(b.l, b.y);
    const m1 = X((a.l + b.r) / 2, (a.y + b.y) / 2 + sag), m2 = X((a.r + b.l) / 2, (a.y + b.y) / 2 + sag * 0.8);
    return [`M${fmt(p1.x)},${fmt(p1.y)} Q${fmt(m1.x)},${fmt(m1.y)} ${fmt(p2.x)},${fmt(p2.y)}`, `M${fmt(q1.x)},${fmt(q1.y)} Q${fmt(m2.x)},${fmt(m2.y)} ${fmt(q2.x)},${fmt(q2.y)}`];
  }).flat();
  // the two lace ends run from the top eyelets up to the hands
  const handY = lerp(-9, -13.5, tug), handX = lerp(5.2, 7.2, tug);
  const endL = X(rows[0].l, rows[0].y), endR = X(rows[0].r, rows[0].y);
  const hL = X(-handX, handY), hR = X(handX, handY);
  const iw = 7;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id={`${k}lb`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={lit(C.turfLight, 0.15)} /><stop offset="1" stopColor={C.turfDeep} /></linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${k}lb)`} />
      {/* the cleat's upper (from above), tongue and eyelet rows */}
      <Inked w={iw}>
        <Blob id={`${k}up`} d={pth([X(-7.5, -6), X(7.5, -6), X(8.6, 4), X(6.5, 14), X(0, 18), X(-6.5, 14), X(-8.6, 4)], 0.8)} c={X(-2, -2)} r={18 * s} color={C.cleat} />
      </Inked>
      <path d={pth([X(-gap + 0.5, -6), X(gap - 0.5, -6), X(gap - 0.3, 5), X(-gap + 0.3, 5)], 0.4)} fill="#D9DFE5" stroke={INK} strokeWidth={2} />
      <path d={pth([X(-7.2, 8), X(7.2, 8), X(6.2, 13.2), X(0, 16.5), X(-6.2, 13.2)], 0.7)} fill={C.cleatAccent} opacity={0.9} />
      {rows.map((r, i) => (
        <g key={i}>
          {[r.l, r.r].map((x, j) => { const q = X(x, r.y); return <circle key={j} cx={fmt(q.x)} cy={fmt(q.y)} r={9} fill="#2B2F36" stroke="#9AA6B1" strokeWidth={3} />; })}
        </g>
      ))}
      {lace.map((d, i) => <path key={i} d={d} fill="none" stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" />)}
      {lace.map((d, i) => <path key={`o${i}`} d={d} fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" opacity={0.6} />)}
      {[[endL, hL], [endR, hR]].map(([a, b], i) => (
        <g key={i}>
          <path d={`M${fmt(a.x)},${fmt(a.y)} Q${fmt((a.x + b.x) / 2 + (i ? 30 : -30) * (1 - tug))},${fmt((a.y + b.y) / 2 + 60 * (1 - tug))} ${fmt(b.x)},${fmt(b.y)}`} fill="none" stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" />
          <path d={`M${fmt(a.x)},${fmt(a.y)} Q${fmt((a.x + b.x) / 2 + (i ? 30 : -30) * (1 - tug))},${fmt((a.y + b.y) / 2 + 60 * (1 - tug))} ${fmt(b.x)},${fmt(b.y)}`} fill="none" stroke={INK} strokeWidth={2.2} opacity={0.6} />
        </g>
      ))}
      {/* his hands pinch the lace ends and pull */}
      <g transform={`translate(${fmt(hL.x)} ${fmt(hL.y)}) scale(${s}) translate(0 0)`}>
        <Inked w={0.15}>
          <Capsule id={`${k}aL`} a={{x: -5, y: -18}} b={{x: -1, y: -6}} ra={2.6} rb={2.2} color={SKIN} />
          <Hand id={`${k}hL`} wrist={{x: -1, y: -6}} ang={70} L={9} thumbSide={-1} view="back" pose={HAND_PINCH} color={SKIN} bare />
        </Inked>
      </g>
      <g transform={`translate(${fmt(hR.x)} ${fmt(hR.y)}) scale(${s}) translate(0 0)`}>
        <Inked w={0.15}>
          <Capsule id={`${k}aR`} a={{x: 5, y: -18}} b={{x: 1, y: -6}} ra={2.6} rb={2.2} color={SKIN} />
          <Hand id={`${k}hR`} wrist={{x: 1, y: -6}} ang={110} L={9} thumbSide={1} view="back" pose={HAND_PINCH} color={SKIN} bare />
        </Inked>
      </g>
      {void shade}
    </svg>
  );
};

// ----------------------------------------------------------------------------------------- the plant and the step
const PLANT_X = 300;
export const stepState = (t: number) => {
  const t0 = shotStart('step');
  // the prosthetic cleat comes down and plants; his weight moves over it; the left leg swings through to land ahead
  const down = ss(t, t0 - 0.06, t0 + 0.16);
  const nP = {x: PLANT_X, y: lerp(-24, -ANK, Math.pow(down, 1.5))};
  const shift = ss5(t, t0 + 0.1, t0 + 0.55);
  const swing = ss5(t, t0 + 0.45, T.leg2 + 0.05);
  const fx = lerp(PLANT_X + 44, PLANT_X - 50, swing);
  const fy = -ANK - Math.sin(Math.PI * swing) * 11;
  const Hx = lerp(PLANT_X + 22, PLANT_X - 24, ss5(t, t0, T.leg2 + 0.2));
  const Hy = -70.5 + 1.2 * Math.sin(Math.PI * swing);
  const pose = strideAt({H: {x: Hx, y: Hy}, nP, nPitch: lerp(90, 66, ss(t, t0 + 0.75, T.leg2 + 0.1)), fP: {x: fx, y: fy}, fPitch: lerp(64, 92, swing), lean: lerp(6, 16, shift), swing: lerp(-0.4, 1, swing), expr: happy});
  pose.far = legTo({x: Hx + (pose.stag.x), y: Hy + pose.stag.y}, {x: fx, y: fy}, lerp(64, 92, swing));
  return {pose, D: lerp(D0 * 1.1, D0 * 0.86, ss5(t, t0 + 0.2, shotEnd('step')))};
};
export const stepCam = (t: number): Cam => {
  const t0 = shotStart('step');
  const keys: CKey[] = [
    [t0, {x: PLANT_X - 2, y: -20, w: 46, eye: -14}],
    [t0 + 0.22, {x: PLANT_X - 3, y: -24, w: 50, eye: -16}],
    [t0 + 0.85, {x: PLANT_X - 16, y: -70, w: 118, eye: -24}, travel],
    [shotEnd('step'), {x: PLANT_X - 34, y: -72, w: 112, eye: -24}, travel],
  ];
  return glide(t, keys);
};
export const StepShot: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = stepCam(t);
  const px = 1 / camScale(c);
  const {pose, D} = stepState(t);
  const j = bjoints(pose);
  const kD = D0 / D;
  return (
    <>
      <Pitch c={c} id={`${k}pt`} />
      <Layer c={c} D={D}>
        {[{x: j.PA.x - 3, y: cleatLow(j.PA, j.nFoot)}, {x: j.FA.x - 3, y: cleatLow(j.FA, j.fFoot)}].map((f, i) => {
          const a = Math.max(0, 0.34 * (1 - Math.max(0, -f.y) / 40));
          return <SoftShadow key={i} id={`${k}s${i}`} c={{x: f.x, y: 0.4}} rx={12} ry={2.2} alpha={a} color="#1E3A22" />;
        })}
        <Wyatt2 p={{...pose, turn: 0.6}} o={{id: `${k}w`, px: px / kD, shoeN: 'cleat', shoeF: 'cleat', prosthesis: true, socket: {clear: 0, local: 0}}} />
      </Layer>
      <ForeGrass c={c} />
      {void clamp}
    </>
  );
};
