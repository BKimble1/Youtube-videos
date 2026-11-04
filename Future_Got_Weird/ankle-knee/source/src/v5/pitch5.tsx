// V5 pitch shots. The soccer Wyatt is drawn with the V5 body (body5.tsx: relaxed shoulders, a neck, the torso over the
// pelvis); the kick comes from kick5.ts.
//   KickShot5    0 - WIPE_T            the decisive frame, contact on frame 2, the follow-through; the ball at the lens
//   RevealShot5  WIPE_T - xray         the wipe onto the close side view; "ankle"; the proof on "working knee"
//   StanceShot5  field - ankleE        the closing payoff: a brief balanced stance behind the ball
//   AnkleShotE   ankleE - contactE     close on the prosthesis: the step, the turned ankle bending as he winds up
//   ContactShotE contactE - flight     low on the shoe and the ball: contact
//   FlightShotE  flight - end          the follow-through; the ball comes at the lens and fills it (-> frame 0)
import React from 'react';
import {Cam, D0, Layer, camScale, toScreen, W, H} from '../camera';
import {Pitch, ForeGrass} from '../art/pitch';
import {Ball} from '../art/ball';
import {SoftShadow} from '../dc/shade';
import {INK} from '../dc/ink';
import {fmt} from '../dc/math';
import {cleatLow} from '../art/wyatt';
import {Wyatt5, bjoints5} from './body5';
import {BPose} from '../v2/body';
import {spline} from '../motion';
import {clamp} from '../lib';
import {CONTACT, WIPE_T, TC_END, DUR4} from './story5';
import {kickPose5, kickToe5, BALL_C, BALL_R, LOW, revealCam5, STANCE_CAM, ankleCamE, CONTACT_CAM, FLIGHT_CAM, sOpen, sEnd} from './kick5';

const GOAL_X = -330, GOAL_D = 820;
const SOCKET = {clear: 1, local: 0, rim: 1};

const Shadows: React.FC<{p: BPose; id: string}> = ({p, id}) => {
  const j = bjoints5(p);
  const f = [{x: j.PA.x - 3, y: cleatLow(j.PA, j.nFoot), r: 12}, {x: j.FA.x - 3, y: cleatLow(j.FA, j.fFoot), r: 12}];
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
/** the field through camera c at kick time s; the ball resting at the strike position (before contact) */
const PitchView5: React.FC<{s: number; open: boolean; c: Cam; k: string; worldBall: boolean}> = ({s, open, c, k, worldBall}) => {
  const pose = kickPose5(s, open);
  const px = 1 / camScale(c);
  return (
    <>
      <Pitch c={c} id={`${k}pt`} goalX={GOAL_X} goalD={GOAL_D} />
      <Layer c={c} D={D0}>
        <Shadows p={pose} id={`${k}sh`} />
        <Wyatt5 p={pose} o={{id: `${k}w`, px, shoeN: 'cleat', shoeF: 'cleat', prosthesis: true, socket: SOCKET, toeCurl: kickToe5(s, open)}} />
        {worldBall && (
          <>
            <SoftShadow id={`${k}bs`} c={{x: BALL_C.x, y: 0.4}} rx={BALL_R} ry={2.2} alpha={0.34} color="#1E3A22" />
            <Ball id={`${k}b`} x={BALL_C.x} y={BALL_C.y} r={BALL_R} spin={0} iw={7 * px} />
          </>
        )}
      </Layer>
      <ForeGrass c={c} />
    </>
  );
};

// ------------------------------------------------------------------------------------------------ the struck ball
type SB = {x: number; y: number; r: number; spin: number; squash: number};
const keyed = (s: number, K: [number, number, number, number][]) => ({
  x: spline(s, K.map((q) => [q[0], q[1]])), y: spline(s, K.map((q) => [q[0], q[2]])), r: Math.exp(spline(s, K.map((q) => [q[0], Math.log(q[3])]))),
});
/** the opening: fast exit up and left (below the caption), then it swells at the lens, covers the frame at WIPE_T and
 *  its trailing edge sweeps off to the left */
export const ballOpen = (t: number): SB => {
  const s0 = toScreen(LOW, BALL_C);
  const r0 = BALL_R * camScale(LOW);
  const sc = t - CONTACT;
  const b = keyed(sc, [
    [0, s0.x, s0.y, r0], [0.033, s0.x - 60, s0.y - 210, r0 * 1.03], [0.067, s0.x - 120, s0.y - 420, r0 * 1.07], [0.137, s0.x - 190, s0.y - 640, r0 * 1.2],
    [0.237, s0.x - 205, s0.y - 665, 300], [0.307, s0.x - 200, s0.y - 650, 700], [WIPE_T - CONTACT, s0.x - 190, s0.y - 640, 1570], [0.417, -760, 760, 1610], [0.467, -1560, 760, 1650], [0.567, -2800, 760, 1700],
  ]);
  return {...b, spin: -sc * 26, squash: Math.max(0, 1 - sc / 0.07)};
};
/** the ending, contact shot: off the shoe, up and left out of the frame */
export const ballContactE = (t: number): SB => {
  const s0 = toScreen(CONTACT_CAM, BALL_C);
  const r0 = BALL_R * camScale(CONTACT_CAM);
  const sc = t - TC_END;
  const b = keyed(sc, [[0, s0.x, s0.y, r0], [0.033, s0.x - 80, s0.y - 170, r0 * 1.03], [0.1, s0.x - 230, s0.y - 520, r0 * 1.08], [0.2, s0.x - 400, s0.y - 980, r0 * 1.14], [0.3, s0.x - 560, s0.y - 1400, r0 * 1.2]]);
  return {...b, spin: -sc * 26, squash: Math.max(0, 1 - sc / 0.07)};
};
/** the ending, flight: from up-left of him it comes at the lens (radius ~ 1 / distance), drifting to the frame's
 *  centre, and fills the frame on the last frame, so the next frame (frame 0 on replay) opens behind it */
const S_END = DUR4 - 1 / 30 - TC_END;
export const ballFlightE = (t: number): SB => {
  const sc = t - TC_END;
  const p0 = toScreen(FLIGHT_CAM, {x: -100, y: -68}); // out in front of him (screen-left), clear of his body
  const r0 = BALL_R * camScale(FLIGHT_CAM) * 1.1;
  const s1 = 0.2;
  const u = clamp((sc - s1) / (S_END - s1));
  const d = 1 - 0.93 * u; // distance from the lens (1 = where it starts)
  const e = 1 - Math.pow(d, 1.3);
  return {x: p0.x + (300 - p0.x) * e, y: p0.y + (820 - p0.y) * e, r: r0 / d, spin: -sc * 20, squash: 0};
};
const BallOverlay: React.FC<{b: SB; tc: number; k: string; streaks: boolean}> = ({b, tc, k, streaks}) => {
  if (b.x + b.r < -20 || b.y + b.r < -20) return null;
  const sq = 0.1 * b.squash;
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
      {streaks && tc > 0.03 && [0, 1, 2].map((i) => {
        const a = -0.95 + i * 0.32;
        const ox = b.x + Math.cos(Math.PI + a) * -b.r * 0.2, oy = b.y + Math.sin(a) * b.r * 0.8;
        const L = b.r * (0.7 + 0.2 * i);
        return <line key={`s${i}`} x1={fmt(ox + b.r * 0.9)} y1={fmt(oy + b.r * 0.55)} x2={fmt(ox + b.r * 0.9 + L)} y2={fmt(oy + b.r * 0.55 + L * 0.9)} stroke="#FFFFFF" strokeWidth={Math.max(6, b.r * 0.06)} strokeLinecap="round" opacity={0.5} />;
      })}
    </svg>
  );
};

// ------------------------------------------------------------------------------------------------ the shots
export const KickShot5: React.FC<{t: number; k: string}> = ({t, k}) => {
  const s = sOpen(t);
  return (
    <>
      <PitchView5 s={s} open c={LOW} k={k} worldBall={s < 0} />
      {s >= 0 && <BallOverlay b={ballOpen(t)} tc={s} k={k} streaks={t < WIPE_T - 0.06} />}
    </>
  );
};
export const RevealShot5: React.FC<{t: number; k: string}> = ({t, k}) => (
  <>
    <PitchView5 s={sOpen(t)} open c={revealCam5(t)} k={k} worldBall={false} />
    {t < 0.56 && <BallOverlay b={ballOpen(t)} tc={sOpen(t)} k={k} streaks={false} />}
  </>
);
export const StanceShot5: React.FC<{t: number; k: string}> = ({t, k}) => <PitchView5 s={sEnd(t)} open={false} c={STANCE_CAM} k={k} worldBall />;
export const AnkleShotE: React.FC<{t: number; k: string}> = ({t, k}) => <PitchView5 s={sEnd(t)} open={false} c={ankleCamE(t)} k={k} worldBall />;
export const ContactShotE: React.FC<{t: number; k: string}> = ({t, k}) => {
  const s = sEnd(t);
  return (
    <>
      <PitchView5 s={s} open={false} c={CONTACT_CAM} k={k} worldBall={s < 0} />
      {s >= 0 && <BallOverlay b={ballContactE(t)} tc={s} k={k} streaks />}
    </>
  );
};
export const FlightShotE: React.FC<{t: number; k: string}> = ({t, k}) => (
  <>
    <PitchView5 s={sEnd(t)} open={false} c={FLIGHT_CAM} k={k} worldBall={false} />
    <BallOverlay b={ballFlightE(t)} tc={sEnd(t)} k={k} streaks={false} />
  </>
);
/** caption heights over the pitch shots (0, 1, 13-15): above the action */
export const CAP_Y_PITCH5: Record<number, number> = {0: 250, 1: 250, 13: 240, 14: 240, 15: 240};
