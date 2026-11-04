// V4 pitch shots, all driven by the one kick clock (kick4.ts).
//   KickShot4   0 - WIPE_T       the decisive frame (LOW), contact on frame 2, the follow-through; the ball leaves
//                                fast, spinning, and comes at the lens
//   RevealShot4 WIPE_T - xray    the ball's trailing edge wipes right-to-left onto a close side view of the same
//                                leg; the leg lands from the follow-through; "ankle": toes behind him; "working
//                                knee": the turned ankle flexes and the prosthetic shin swings
//   FieldShot4  field - low      the closing scene: he tracks the rolling pass, final stride, plants his support foot
//   LowShot4    low - end        cut low as the prosthetic cleat swings in; the last frame is one before frame 0
import React from 'react';
import {Cam, D0, Layer, camScale, toScreen, W, H} from '../camera';
import {Pitch, ForeGrass} from '../art/pitch';
import {Ball} from '../art/ball';
import {SoftShadow} from '../dc/shade';
import {INK} from '../dc/ink';
import {fmt} from '../dc/math';
import {cleatLow} from '../art/wyatt';
import {Wyatt2, bjoints, BPose} from '../v2/body';
import {spline} from '../motion';
import {clamp, lerp, ss} from '../lib';
import {CONTACT, WIPE_T} from './story4';
import {kickPose, kickToe, ballWorld, BALL_C, BALL_R, LOW, revealCam, fieldCam, tauOpen, tauEnd} from './kick4';

const GOAL_X = -330, GOAL_D = 820;
const SOCKET = {clear: 1, local: 0, rim: 1};

const Shadows: React.FC<{p: BPose; id: string; ball?: {x: number; y: number}}> = ({p, id, ball}) => {
  // (the ball's own shadow is drawn on its layer)
  const j = bjoints(p);
  const f = [{x: j.PA.x - 3, y: cleatLow(j.PA, j.nFoot), r: 12}, {x: j.FA.x - 3, y: cleatLow(j.FA, j.fFoot), r: 12}];
  if (ball) f.push({x: ball.x, y: ball.y + BALL_R, r: BALL_R});
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

/** the field through camera c at kick time tau; the ball in the world (before contact) */
const PitchView: React.FC<{tau: number; c: Cam; k: string; worldBall: boolean}> = ({tau, c, k, worldBall}) => {
  const pose = kickPose(tau);
  const px = 1 / camScale(c);
  const b = ballWorld(tau);
  return (
    <>
      <Pitch c={c} id={`${k}pt`} goalX={GOAL_X} goalD={GOAL_D} />
      <Layer c={c} D={D0}>
        <Shadows p={pose} id={`${k}sh`} />
        <Wyatt2 p={pose} o={{id: `${k}w`, px, shoeN: 'cleat', shoeF: 'cleat', prosthesis: true, socket: SOCKET, toeCurl: kickToe(tau)}} />
      </Layer>
      {worldBall && (
        <Layer c={c} D={b.D}>
          <SoftShadow id={`${k}bs`} c={{x: b.x, y: 0.4}} rx={BALL_R} ry={2.2} alpha={0.34} color="#1E3A22" />
          <Ball id={`${k}b`} x={b.x} y={b.y} r={BALL_R} spin={b.spin} iw={7 * px * (b.D / D0)} />
        </Layer>
      )}
      <ForeGrass c={c} />
    </>
  );
};

// ------------------------------------------------------------------------------------------------ the struck ball
/** after contact: screen position and radius (px). Fast exit up and left, then at the lens: it covers the frame at
 *  WIPE_T and its trailing (right) edge sweeps off to the left, wiping onto the reveal */
export const ballScreen = (t: number) => {
  const s0 = toScreen(LOW, BALL_C);
  const r0 = BALL_R * camScale(LOW);
  const K: [number, number, number, number][] = [
    [CONTACT, s0.x, s0.y, r0], [CONTACT + 0.033, s0.x - 55, s0.y - 270, r0 * 1.03], [CONTACT + 0.067, s0.x - 115, s0.y - 570, r0 * 1.07], [0.17, s0.x - 175, s0.y - 960, r0 * 1.2],
    [0.27, 300, 430, 330], [0.34, 410, 580, 600], [0.37, 440, 760, 880], [WIPE_T, 450, 930, 1290], [0.45, -630, 920, 1330], [0.5, -1420, 900, 1370], [0.6, -2600, 880, 1440],
  ];
  const x = spline(t, K.map((q) => [q[0], q[1]]));
  const y = spline(t, K.map((q) => [q[0], q[2]]));
  const r = Math.exp(spline(t, K.map((q) => [q[0], Math.log(q[3])])));
  const tc = t - CONTACT;
  const squash = Math.max(0, 1 - tc / 0.07);
  return {x, y, r, spin: -tc * 26, squash};
};
const BallOverlay: React.FC<{t: number; k: string}> = ({t, k}) => {
  const b = ballScreen(t);
  if (b.x + b.r < -20) return null;
  const sq = 0.1 * b.squash;
  // impact lines for the first frames after contact, at the ball's struck (right) side
  const tc = t - CONTACT;
  const hit = tc < 0.1 ? 1 - tc / 0.1 : 0;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <g transform={`translate(${fmt(b.x)} ${fmt(b.y)}) scale(${fmt(1 - sq)} ${fmt(1 + sq * 0.7)}) translate(${fmt(-b.x)} ${fmt(-b.y)})`}>
        <Ball id={`${k}bo`} x={b.x} y={b.y} r={b.r} spin={b.spin} iw={Math.max(5, b.r * 0.045)} />
      </g>
      {hit > 0 && [-0.5, -0.15, 0.2, 0.55].map((a, i) => {
        const cx = b.x + Math.cos(a) * b.r * 1.15, cy = b.y + Math.sin(a) * b.r * 1.15;
        const L = 46 * hit;
        return <line key={i} x1={fmt(cx)} y1={fmt(cy)} x2={fmt(cx + Math.cos(a) * L)} y2={fmt(cy + Math.sin(a) * L)} stroke={INK} strokeWidth={7} strokeLinecap="round" opacity={0.85 * hit} />;
      })}
      {/* speed streaks behind the flying ball */}
      {tc > 0.03 && t < WIPE_T && [0, 1, 2].map((i) => {
        const a = -0.95 + i * 0.32;
        const ox = b.x + Math.cos(Math.PI + a) * -b.r * 0.2, oy = b.y + Math.sin(a) * b.r * 0.8;
        const L = b.r * (0.7 + 0.2 * i);
        return <line key={`s${i}`} x1={fmt(ox + b.r * 0.9)} y1={fmt(oy + b.r * 0.55)} x2={fmt(ox + b.r * 0.9 + L)} y2={fmt(oy + b.r * 0.55 + L * 0.9)} stroke="#FFFFFF" strokeWidth={Math.max(6, b.r * 0.06)} strokeLinecap="round" opacity={0.55 * clamp(1 - (t - 0.2) / 0.2)} />;
      })}
    </svg>
  );
};

// ------------------------------------------------------------------------------------------------ the shots
export const KickShot4: React.FC<{t: number; k: string}> = ({t, k}) => {
  const tau = tauOpen(t);
  return (
    <>
      <PitchView tau={tau} c={LOW} k={k} worldBall={tau < 0} />
      {tau >= 0 && <BallOverlay t={t} k={k} />}
    </>
  );
};
export const RevealShot4: React.FC<{t: number; k: string}> = ({t, k}) => {
  const tau = tauOpen(t);
  return (
    <>
      <PitchView tau={tau} c={revealCam(t)} k={k} worldBall={false} />
      {t < 0.56 && <BallOverlay t={t} k={k} />}
    </>
  );
};
export const FieldShot4: React.FC<{t: number; k: string}> = ({t, k}) => <PitchView tau={tauEnd(t)} c={fieldCam(t)} k={k} worldBall />;
export const LowShot4: React.FC<{t: number; k: string}> = ({t, k}) => <PitchView tau={tauEnd(t)} c={LOW} k={k} worldBall />;

/** caption heights over the pitch shots (indices 0, 1, 13-15): above the action */
export const CAP_Y_PITCH: Record<number, number> = {0: 250, 1: 250, 13: 240, 14: 240, 15: 240};
export {lerp, ss};
