// V3: one frame. The shot for time t through its camera; captions on top in screen space.
import React from 'react';
import {resetIds} from '../core/ids';
import {Cam, D0, Layer, camScale, toScreen} from '../camera';
import {Pitch, ForeGrass} from '../art/pitch';
import {Ball} from '../art/ball';
import {SoftShadow} from '../dc/shade';
import {cleatLow} from '../art/wyatt';
import {Wyatt2, bjoints, BPose} from '../v2/body';
import {Captions3} from './Captions3';
import {shot3At, pitchState3, openCam3, kickCam3, socket3, BALL3, STRIKE_A, SCAN_T, GOAL_X, GOAL_D} from './story3';
import {ScanShot3, AnatShot3, TurnShot3, AttachShot3} from './middle3';
import {RehabShot3} from './rehab3';
import {FootShot3, FaceShot3, LaceShot3, PlantShot3} from './end3';

const Shadows: React.FC<{p: BPose; id: string; ball?: {x: number; y: number; D: number}}> = ({p, id, ball}) => {
  const j = bjoints(p);
  const f = [{x: j.PA.x - 3, y: cleatLow(j.PA, j.nFoot), r: 12}, {x: j.FA.x - 3, y: cleatLow(j.FA, j.fFoot), r: 12}];
  if (ball && ball.D < 200) f.push({x: ball.x, y: ball.y + BALL3.r, r: BALL3.r});
  return (
    <g>
      {f.map((q, i) => {
        const h = Math.max(0, -q.y);
        const a = Math.max(0, 0.34 * (1 - h / 45));
        return a > 0.01 ? <SoftShadow key={i} id={`${id}${i}`} c={{x: q.x, y: 0.4}} rx={q.r * (1 + h / 60)} ry={2.2} alpha={a} color="#1E3A22" /> : null;
      })}
    </g>
  );
};
export const PitchShot3: React.FC<{t: number; c: Cam; k: string}> = ({t, c, k}) => {
  const {pose, ball, toe} = pitchState3(t);
  const px = 1 / camScale(c);
  const far = ball.D > 175;
  return (
    <>
      <Pitch c={c} id={`${k}pt`} goalX={GOAL_X} goalD={GOAL_D} />
      {ball.show && far && (
        <Layer c={c} D={ball.D}>
          <Ball id={`${k}bf`} x={ball.x} y={ball.y} r={BALL3.r} spin={ball.spin} iw={7 * px * (ball.D / D0)} />
        </Layer>
      )}
      <Layer c={c} D={D0}>
        <Shadows p={pose} id={`${k}sh`} ball={ball.show ? ball : undefined} />
        <Wyatt2 p={pose} o={{id: `${k}w`, px, shoeN: 'cleat', shoeF: 'cleat', prosthesis: true, socket: socket3(t), toeCurl: toe}} />
        {ball.show && !far && <Ball id={`${k}b`} x={ball.x} y={ball.y} r={BALL3.r} spin={ball.spin} iw={7 * px} />}
      </Layer>
      <ForeGrass c={c} />
    </>
  );
};
/** V2's transition, retimed: after the strike the ball comes at the lens and fills the circle the scan takes over */
export const BALL_END3 = {x: 540, y: 960, r: 330};
export const ballToLens3 = (t: number) => {
  const c0 = openCam3(STRIKE_A);
  const s0 = toScreen(c0, BALL3);
  const r0 = BALL3.r * camScale(c0);
  const u = Math.min(1, Math.max(0, (t - STRIKE_A) / (SCAN_T - STRIKE_A)));
  const k = 1 / (1 - u * (1 - r0 / BALL_END3.r));
  const e = u * u * (3 - 2 * u);
  const arc = -220 * Math.sin(Math.PI * Math.min(1, u * 1.1));
  return {x: s0.x + (BALL_END3.x - s0.x) * e, y: s0.y + (BALL_END3.y - s0.y) * e + arc * (1 - e), r: r0 * k, spin: -u * 8};
};
const BallLens: React.FC<{t: number; k: string}> = ({t, k}) => {
  const b = ballToLens3(t);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <Ball id={`${k}bl`} x={b.x} y={b.y} r={b.r} spin={b.spin} iw={Math.max(3, b.r * 0.05)} />
    </svg>
  );
};
export const Scene3: React.FC<{t: number; fkey: string; captions: boolean}> = ({t, fkey, captions}) => {
  resetIds(fkey);
  let body: React.ReactNode;
  switch (shot3At(t)) {
    case 'open': body = <><PitchShot3 t={t} c={openCam3(t)} k={fkey} />{t >= STRIKE_A && <BallLens t={t} k={fkey} />}</>; break;
    case 'scan': body = <ScanShot3 t={t} k={fkey} />; break;
    case 'anat': body = <AnatShot3 t={t} k={fkey} />; break;
    case 'turn': body = <TurnShot3 t={t} k={fkey} />; break;
    case 'attach': body = <AttachShot3 t={t} k={fkey} />; break;
    case 'rehab': body = <RehabShot3 t={t} k={fkey} />; break;
    case 'foot': body = <FootShot3 t={t} k={fkey} />; break;
    case 'face': body = <FaceShot3 t={t} k={fkey} />; break;
    case 'lace': body = <LaceShot3 t={t} k={fkey} />; break;
    case 'plant': body = <PlantShot3 t={t} k={fkey} />; break;
    default: body = <PitchShot3 t={t} c={kickCam3(t)} k={fkey} />;
  }
  return <>{body}{captions && <Captions3 t={t} />}</>;
};
