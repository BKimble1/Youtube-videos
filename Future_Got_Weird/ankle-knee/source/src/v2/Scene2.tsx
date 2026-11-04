// V2: one frame. The shot for time t, through its camera; captions in screen space on top.
import React from 'react';
import {resetIds} from '../core/ids';
import {Cam, D0, Layer, camScale, toScreen} from '../camera';
import {Pitch, ForeGrass} from '../art/pitch';
import {Ball} from '../art/ball';
import {SoftShadow} from '../dc/shade';
import {fmt} from '../dc/math';
import {cleatLow} from '../art/wyatt';
import {Wyatt2, bjoints, BPose} from './body';
import {Captions2} from './Captions2';
import {shot2At, pitchPose, openCam, kickCam, socketClear, BALL, STRIKE1, T} from './story2';
import {ScanShot} from './scan';
import {AnatShot, TurnShot, AttachShot} from './anat';
import {RailsShot} from './rails';
import {BedShot2} from './bed2';
import {LaceShot, StepShot} from './lace';

const Shadows: React.FC<{p: BPose; id: string; ball?: {x: number; y: number}}> = ({p, id, ball}) => {
  const j = bjoints(p);
  const f = [{x: j.PA.x - 3, y: cleatLow(j.PA, j.nFoot), r: 12}, {x: j.FA.x - 3, y: cleatLow(j.FA, j.fFoot), r: 12}];
  if (ball) f.push({x: ball.x, y: ball.y + BALL.r, r: BALL.r});
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

export const PitchShot2: React.FC<{t: number; c: Cam; k: string; captionsOff?: boolean}> = ({t, c, k}) => {
  const {pose, ball, toe} = pitchPose(t);
  const px = 1 / camScale(c);
  const clear = socketClear(t);
  const showBall = !(ball.gone && t < T.wyatt);
  return (
    <>
      <Pitch c={c} id={`${k}pt`} />
      <Layer c={c} D={D0}>
        <Shadows p={pose} id={`${k}sh`} ball={showBall ? ball : undefined} />
        <Wyatt2 p={pose} o={{id: `${k}w`, px, shoeN: 'cleat', shoeF: 'cleat', prosthesis: true, socket: {clear, local: 0}, toeCurl: toe}} />
        {showBall && (() => {
          // after the closing strike the ball also travels away down the field: smaller, and toward the horizon
          const f = 1 / (1 + 2.2 * (ball.far ?? 0));
          const by = c.eye + (ball.y - c.eye) * f;
          return <Ball id={`${k}b`} x={c.x + (ball.x - c.x) * (0.4 + 0.6 * f)} y={by} r={BALL.r * f} spin={ball.spin} iw={7 * px * f} />;
        })()}
      </Layer>
      <ForeGrass c={c} />
    </>
  );
};

/** the opening's ball after the strike: it leaves the cleat and comes at the lens, filling the frame's centre */
export const BALL_END = {x: 540, y: 960, r: 330};
export const ballToLens = (t: number) => {
  const c0 = openCam(STRIKE1);
  const s0 = toScreen(c0, BALL);
  const r0 = BALL.r * camScale(c0);
  const u = Math.min(1, Math.max(0, (t - STRIKE1) / (T.wyatt - STRIKE1)));
  // depth: the screen radius grows as the ball nears the lens (1/D)
  const k = 1 / (1 - u * (1 - r0 / BALL_END.r));
  const e = u * u * (3 - 2 * u);
  const arc = -260 * Math.sin(Math.PI * Math.min(1, u * 1.1));
  return {x: s0.x + (BALL_END.x - s0.x) * e, y: s0.y + (BALL_END.y - s0.y) * e + arc * (1 - e), r: r0 * k, spin: -u * 9, u};
};
const BallLens: React.FC<{t: number; k: string}> = ({t, k}) => {
  const b = ballToLens(t);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <Ball id={`${k}bl`} x={b.x} y={b.y} r={b.r} spin={b.spin} iw={Math.max(3, b.r * 0.05)} />
    </svg>
  );
};

export const Scene2: React.FC<{t: number; fkey: string; captions: boolean}> = ({t, fkey, captions}) => {
  resetIds(fkey);
  const s = shot2At(t);
  let body: React.ReactNode;
  switch (s) {
    case 'open': body = <><PitchShot2 t={t} c={openCam(t)} k={fkey} />{t > STRIKE1 && <BallLens t={t} k={fkey} />}</>; break;
    case 'scan': body = <ScanShot t={t} k={fkey} />; break;
    case 'anat': body = <AnatShot t={t} k={fkey} />; break;
    case 'turn': body = <TurnShot t={t} k={fkey} />; break;
    case 'attach': body = <AttachShot t={t} k={fkey} />; break;
    case 'rails': body = <RailsShot t={t} k={fkey} />; break;
    case 'bed': body = <BedShot2 t={t} k={fkey} />; break;
    case 'lace': body = <LaceShot t={t} k={fkey} />; break;
    case 'step': body = <StepShot t={t} k={fkey} />; break;
    default: body = <PitchShot2 t={t} c={kickCam(t)} k={fkey} />;
  }
  return (
    <>
      {body}
      {captions && <Captions2 t={t} />}
    </>
  );
};
export {fmt};
