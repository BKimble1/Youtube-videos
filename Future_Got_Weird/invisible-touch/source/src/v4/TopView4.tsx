// V4 shot 14a (from v2/TopView.tsx): the moving sensation as an A -> B -> C demonstration seen from overhead: the
// spot jumps fingertip -> knuckles -> palm, each stop with a small local response; the array's rings re-steer to
// each point. The oblique view (v4/shots4.ts) continues it.
// V2 shot 14: top-down over the hand and the array ("and you can make an invisible button feel like it's moving").
// The hand is the rig's own back-view hand (dc/Hand) lying in the horizontal plane at palm height, the forearm leaving
// toward the shoulder (his right side is away from the camera, so the arm leaves screen-up and right). The focal point
// circles under the palm; the array's firing pattern recentres under it every frame (phaseGlow), so the rings visibly
// follow the moving point. The point, its trail and the dashed button outline are drawn over the hand as an
// explanatory x-ray: they are on the palm's underside.
import React from 'react';
import {orbit, topMatrix} from '../it/cam3';
import {Bench, Driver, Floor, inkFor} from '../it/lab';
import {Device, DEV_TOP} from '../it/device';
import {phaseGlow, CYAN, CYAN_HI} from '../it/fx';
import {Hand, HandPose} from '../dc/Hand';
import {Inked} from '../dc/ink';
import {Capsule, SoftShadow} from '../dc/shade';
import {PAL, shade} from '../dc/color';
import {T} from '../it/timing';
import {keyS, ss} from '../lib';
import {TOP_A, FY} from '../v2/shots2';
import {OBL_A} from './shots4';

const H_TOP: HandPose = {curl: [0.08, 0.06, 0.1, 0.14], spread: 0.32, thumb: 26, thumbCurl: 0.12};
export const PALM_Y = FY + 6; // the palm's height above the bench (world Y)
const WRIST = {x: 18, z: 4};
/** the palm centre of the back-view hand drawn from WRIST pointing -X (dc Hand: palmC = W(0.24, 0.02)) */
const PALM_C = {x: WRIST.x - 0.24 * 96, z: WRIST.z + 0.02 * 96};
const R_CIRCLE = 13;
const STOPS = [
  {x: WRIST.x - 0.78 * 96, z: WRIST.z + 0.06 * 96}, // A: the index fingertip
  {x: WRIST.x - 0.46 * 96, z: WRIST.z + 0.02 * 96}, // B: the knuckles
  {x: PALM_C.x + 4, z: PALM_C.z}, // C: the centre of the palm
];
export const TOP_EVENTS = () => [TOP_A + 0.12, TOP_A + 0.55, TOP_A + 0.98];
export const topPoint = (t: number) => {
  const ev = TOP_EVENTS();
  let p = STOPS[0];
  for (let i = 1; i < STOPS.length; i++) {
    const u = ss(t, ev[i] - 0.14, ev[i] - 0.02);
    p = {x: p.x + (STOPS[i].x - p.x) * u, z: p.z + (STOPS[i].z - p.z) * u};
  }
  return p;
};
void R_CIRCLE;

export const TopView4: React.FC<{t: number}> = ({t}) => {
  const yaw = keyS(t, [[TOP_A, -6], [OBL_A, 10]]);
  const d = keyS(t, [[TOP_A, 290], [OBL_A, 240]]);
  const cam = orbit({x: -6, y: 50, z: 0}, d, yaw, -84, 1500);
  const ink = inkFor(cam) * 0.72;
  const hm = topMatrix(cam, 0, PALM_Y, 0);
  const am = topMatrix(cam, 0, DEV_TOP + 0.5, 0);
  const pt = topPoint(t);
  const Fw = {x: pt.x, y: PALM_Y - 6, z: pt.z};
  const ev = TOP_EVENTS();
  const lastEv = ev.filter((e) => t >= e).pop();
  const burst = lastEv !== undefined ? t - lastEv : 99;
  const outline = 0;
  const handInk = 6.2 / hm.scale;
  const trail = Array.from({length: 8}, (_, k) => topPoint(t - k * 0.03));
  const k = hm.scale;
  return (
    <g>
      <rect x={-200} y={-200} width={1480} height={2320} fill="#10293A" />
      <Floor c={cam} />
      <Bench c={cam} ink={ink * 1.0} />
      <Driver c={cam} ink={ink} />
      <Device c={cam} ink={ink * 0.85} glow={(i, j) => phaseGlow(t, i, j, Fw, 0.95, 0.4, 0.38)} id="top-dv" round />
      {/* the hand's soft shadow on the array (light from above) */}
      <g transform={am.m}>
        <SoftShadow id="top-sh" c={{x: PALM_C.x + 4, y: PALM_C.z + 6}} rx={60} ry={32} alpha={0.32} />
      </g>
      {/* the hand at palm height */}
      <g transform={hm.m}>
        <Inked w={handInk * 0.72}>
          <Capsule id="top-fa" a={{x: WRIST.x + 210, y: WRIST.z - 92}} b={{x: WRIST.x + 4, y: WRIST.z}} ra={20} rb={15} color={shade(PAL.skin, 0.05)} spec={0.2} />
          <Hand id="top-h" wrist={{x: WRIST.x, y: WRIST.z}} ang={180} L={96} thumbSide={-1} view="back" pose={H_TOP} color={shade(PAL.skin, 0.03)} ink={handInk * 0.65} bare />
        </Inked>
        {/* explanatory x-ray of the palm's underside: the moving focal point, its trail, and the idea of a button */}
        <g style={{mixBlendMode: 'screen'}}>
          {trail
            .slice()
            .reverse()
            .map((p, i) => {
              const kk = trail.length - 1 - i;
              return <circle key={kk} cx={p.x} cy={p.z} r={kk === 0 ? 3.4 : 2.4 - kk * 0.06} fill={kk === 0 ? '#F0FDFF' : CYAN} opacity={kk === 0 ? 1 : 0.85 * (1 - kk / trail.length)} />;
            })}
          <circle cx={pt.x} cy={pt.z} r={9} fill={CYAN} opacity={0.3} />
          {/* the local response at each stop: a small burst on the skin */}
          {burst < 0.4 && <circle cx={pt.x} cy={pt.z} r={3 + 14 * (burst / 0.4)} fill="none" stroke={CYAN_HI} strokeWidth={2.6 / k} opacity={1 - burst / 0.4} />}
          {/* the three stops, faintly marked once visited */}
          {STOPS.map((q, i) => (t >= ev[i] ? <circle key={i} cx={q.x} cy={q.z} r={2.2} fill={CYAN_HI} opacity={0.35} /> : null))}
          {outline > 0.01 && (
            <g opacity={outline}>
              <circle cx={pt.x} cy={pt.z} r={11} fill="none" stroke={CYAN_HI} strokeWidth={2.4 / k} strokeDasharray={`${(9 / k).toFixed(2)} ${(6 / k).toFixed(2)}`} />
              <circle cx={pt.x} cy={pt.z} r={7} fill="none" stroke={CYAN_HI} strokeWidth={1.6 / k} strokeDasharray={`${(6 / k).toFixed(2)} ${(5 / k).toFixed(2)}`} opacity={0.7} />
            </g>
          )}
        </g>
      </g>
    </g>
  );
};
