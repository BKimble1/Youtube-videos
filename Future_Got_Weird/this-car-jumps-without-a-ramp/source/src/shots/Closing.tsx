// 2:00–2:14 — the close.
//   120.2   the car pulls away from where it landed; a clean side tracking shot, strong parallax, the body composed
//   122.7   three quick details for "brake, turn, and hit uneven pavement": the front corner under braking, the car level in the
//           bend, a wheel over a bump with the roof line holding
//   125.7   "A supercar can jump": the hop, once, on the straight it started on
//   127.7   "...keeping it composed on the ground": the car drives away down the straight into the distance
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {w} from '../cues';
import {SideCar, bodyToWorld, STRUT_TOP} from '../car/side';
import {LoftCar} from '../car/loft';
import {FrontCar, TRACK_HALF} from '../car/front';
import {Arrow} from '../car/parts';
import {AXLE_F, AXLE_R, WHEEL_R} from '../car/geom';
import {Cam, Caption, Label, Stage, camKeys, toScreen, World} from '../kit/stage';
import {ProvingSide} from '../kit/proving';
import {TrackScene, trackAt, trackPoint, BEND_START} from '../kit/track3d';
import {Cam3, carToWorld} from '../kit/view3d';
import {lookAt} from '../kit/cam3';
import {simulateHalf, sampleHalf} from '../sim/halfcar';
import {LAUNCH, LaunchState, sampleLaunch, STATIC} from '../sim/launch';
import {clamp01, easeInOut, easeOut, lerp, pchip, seg, smooth, wheelBlur, win} from '../kit/util';

export const T7 = {
  useful: w('b6', 'useful'),
  controlling: w('b6', 'controlling'),
  brake: w('b6', 'brake'),
  turn: w('b6', 'turn'),
  hit: w('b6', 'hit'),
  uneven: w('b6', 'uneven'),
  pavement: w('b6', 'pavement'),
  supercar: w('b6', 'supercar'),
  can: w('b6', 'can'),
  jump: w('b6', 'jump', 1),
  most: w('b6', 'most'),
  harder: w('b6', 'harder'),
  keeping: w('b6', 'keeping'),
  composed: w('b6', 'composed'),
  ground: w('b6', 'ground'),
};
export const CLOSE_IN = T7.useful - 0.14;
export const TIMES = {
  trackEnd: T7.brake - 0.2, // side tracking runs until just before "brake"
  insBrake: T7.brake - 0.2,
  insTurn: T7.turn - 0.12,
  insBump: T7.hit - 0.1,
  jumpIn: T7.supercar - 0.35,
  driveIn: T7.most - 0.0,
};
export const CLOSE_EV = {
  take: T7.jump + 0.0,
  land: T7.jump + 0.62,
  drive: TIMES.driveIn,
};

// ---------------------------------------------------------------------------------------------- shared helpers
const toLaunch = (s: number): LaunchState => sampleLaunch(LAUNCH, Math.max(0, s));
const FPS_ = 30;
void FPS_;

/** side tracking: from rest, the car accelerates and the camera follows */
const trackX = (t: number) => {
  const t0 = CLOSE_IN + 0.15;
  const a = 6000, vmax = 15000;
  const ta = vmax / a;
  const u = Math.max(0, t - t0);
  return u < ta ? 0.5 * a * u * u : 0.5 * a * ta * ta + vmax * (u - ta);
};

// ------------------------------------------------------------------------------------------------ A: side tracking
const SideTrack: React.FC<{t: number}> = ({t}) => {
  const X = trackX(t);
  const speed = ((trackX(t + 0.01) - trackX(t - 0.01)) / 0.02);
  const cam: Cam = {x: X - 40 + lerp(0, 420, smooth(seg(t, CLOSE_IN, CLOSE_IN + 1.2))), y: 780, z: lerp(0.31, 0.36, smooth(seg(t, CLOSE_IN, CLOSE_IN + 1.6)))};
  const rot = -(X / (2 * Math.PI * WHEEL_R)) * 360;
  // the body stays composed: a faint squat at the start, nothing more
  const squat = -10 * smooth(seg(t, CLOSE_IN + 0.15, CLOSE_IN + 0.7)) * (1 - smooth(seg(t, CLOSE_IN + 0.9, CLOSE_IN + 1.7)));
  return (
    <g>
      <ProvingSide cam={cam} zone="launch" />
      <World cam={cam}>
        <SideCar x={X} dz={squat} pitch={squat * 0.012} rot={rot} px={cam.z} blur={wheelBlur(speed)} id="trk" />
      </World>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ B1: braking, front corner
const BrakeInsert: React.FC<{t: number}> = ({t}) => {
  const u = t - TIMES.insBrake;
  const V0 = 16, V1 = 9;
  const dur = TIMES.insTurn - TIMES.insBrake;
  const v = (tt: number) => V0 + (V1 - V0) * smooth(seg(tt, 0.05, dur));
  let X = 0;
  for (let s = 0; s < u; s += 0.01) X += v(s) * 1000 * 0.01;
  const speed = v(u) * 1000;
  const dive = smooth(seg(u, 0.05, 0.35)) * 0.9 + 0.1 * smooth(seg(u, 0.35, dur));
  const pitch = -1.6 * dive;
  const dz = pitch * 4;
  const cam: Cam = {x: X + AXLE_F - 260, y: 500, z: 0.78};
  const pose = {x: X, dz, pitch};
  const topF = bodyToWorld(pose, AXLE_F, STRUT_TOP);
  const rot = -(X / (2 * Math.PI * WHEEL_R)) * 360;
  const open = smooth(seg(u, 0.0, 0.18));
  return (
    <g>
      <ProvingSide cam={cam} zone="rough" />
      <World cam={cam}>
        <SideCar x={X} dz={dz} pitch={pitch} rot={rot} px={cam.z} brake={dive} blur={wheelBlur(speed)} wells={[{axle: 'f', open, spring: 1, damper: 1, actuator: 1, slide: 1, force: 0.8 * dive}]} id="ins1" />
        <Arrow x={X + AXLE_F + 40} y={30} dx={-520} dy={0} px={cam.z} color={C.coral} width={16} opacity={dive} />
        <Arrow x={topF[0] + 260} y={topF[1] + 40} dx={0} dy={250} px={cam.z} color={C.teal} opacity={dive} />
      </World>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ B2: the car in the bend, level
const TurnInsert: React.FC<{t: number}> = ({t}) => {
  const SPEED = 12000;
  const s = BEND_START + 90000 + (t - TIMES.insTurn) * SPEED;
  const tp = trackAt(s);
  const pose = {e: tp.e, n: tp.n, psi: tp.psi};
  const dCar = 5200;
  const eye = carToWorld(pose, [1450 + dCar, 1500, 0]);
  const cam: Cam3 = {eye, yaw: pose.psi + Math.PI, pitch: 0, f: 2100, cx: 960, cy: 300};
  const sc = 2100 / dCar;
  const gy = 300 + (2100 * 1500) / dCar;
  return (
    <g>
      <TrackScene cam={cam} s0={s - 150000} s1={s + 20000} />
      <g transform={`translate(960 ${gy}) scale(${sc} ${-sc})`}>
        <FrontCar px={sc} roll={0.8} id="ins2" />
        <Arrow x={-TRACK_HALF - 110} y={90} dx={430} dy={0} px={sc} color={C.teal} width={16} />
        <Arrow x={TRACK_HALF - 110} y={90} dx={300} dy={0} px={sc} color={C.teal} width={16} />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ B3: a wheel over a bump, roof line holding
const V_B = 8;
const BUMP_T = T7.uneven + 0.1; // the front wheel crosses the bump centre
const bumpX = (t: number) => V_B * (t - TIMES.insBump);
const BUMP_C = bumpX(BUMP_T) + 1.45;
const bumpRoad = (x: number) => {
  const u = (x - (BUMP_C - 0.6)) / 1.2;
  const u2 = (x - (BUMP_C + 2.4 - 0.7)) / 1.4;
  return (u > 0 && u < 1 ? 0.085 * Math.sin(Math.PI * u) ** 2 : 0) + (u2 > 0 && u2 < 1 ? 0.05 * Math.sin(Math.PI * u2) ** 2 : 0);
};
const HALF_B = simulateHalf(TIMES.insBump - 0.3, TIMES.jumpIn + 0.2, bumpX, bumpRoad, () => 1);
const BumpInsert: React.FC<{t: number}> = ({t}) => {
  const X = bumpX(t) * 1000;
  const hs = sampleHalf(HALF_B, t);
  const cam: Cam = {x: X + AXLE_F - 100, y: 420, z: 0.72 - 0.16 * smooth(seg(t, T7.pavement - 0.2, T7.pavement + 0.8))};
  const pitch = (hs.th * 180) / Math.PI;
  const dz = hs.z * 1000;
  const rot = -(X / (2 * Math.PI * WHEEL_R)) * 360;
  const open = smooth(seg(t, TIMES.insBump, TIMES.insBump + 0.2)) * (1 - smooth(seg(t, T7.pavement + 0.55, T7.pavement + 0.85)));
  return (
    <g>
      <ProvingSide cam={cam} zone="rough" profile={(xm) => bumpRoad(xm / 1000) * 1000} />
      <World cam={cam}>
        <SideCar x={X} dz={dz} pitch={pitch} wf={hs.zf * 1000} wr={hs.zr * 1000} rot={rot} px={cam.z} blur={wheelBlur(V_B * 1000)} wells={[{axle: 'f', open, spring: 1, damper: 1, actuator: 1, slide: 1, force: clamp01(hs.Ff / 7000)}]} id="ins3" />
        <line x1={X - 2600} y1={1240} x2={X + 2600} y2={1240} stroke={C.saffronDeep} strokeWidth={4 / cam.z} strokeDasharray={`${22 / cam.z} ${14 / cam.z}`} opacity={0.85 * smooth(seg(t, TIMES.insBump + 0.2, TIMES.insBump + 0.5))} />
      </World>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ C: the hop
const HOP_KEYS: [number, number][] = [[TIMES.jumpIn, 0.4], [TIMES.jumpIn + 0.25, 0.5], [CLOSE_EV.take - 0.3, 0.92], [CLOSE_EV.take, 1.104], [CLOSE_EV.take + 0.31, 1.254], [CLOSE_EV.land, 1.404], [CLOSE_EV.land + 0.5, 1.62], [CLOSE_EV.land + 1.1, 1.9]];
const HopShot: React.FC<{t: number}> = ({t}) => {
  const st = toLaunch(pchip(t, HOP_KEYS));
  const dz = (st.zb - LAUNCH[0].zb) * 1000, wz = (st.zw - STATIC.zw) * 1000;
  const cam: Cam = {x: -40, y: 800, z: 0.372};
  const sag = 18;
  return (
    <g>
      <ProvingSide cam={cam} zone="launch" />
      <World cam={cam}>
        <SideCar x={0} dz={dz - sag} wf={wz - sag} wr={wz - sag} px={cam.z} id="hop" />
      </World>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ D: drive away down the straight
const DRIVE_S0 = 5000;
const driveS = (t: number) => {
  const u = Math.max(0, t - (CLOSE_EV.drive + 0.35));
  const a = 3500, vmax = 17000, ta = vmax / a;
  return DRIVE_S0 + (u < ta ? 0.5 * a * u * u : 0.5 * a * ta * ta + vmax * (u - ta));
};
const DriveAway: React.FC<{t: number}> = ({t}) => {
  const s = driveS(t);
  const tp = trackAt(s);
  const pose = {e: tp.e, n: tp.n, psi: tp.psi};
  const camEye: [number, number, number] = [DRIVE_S0 - 7500, 1000, -2600];
  const cam = lookAt(camEye, [DRIVE_S0 + 60000, 900, -1500], 1400);
  const spd = (driveS(t + 0.01) - driveS(t - 0.01)) / 0.02;
  const lp = {...pose, wheelRot: (-(s / 365) * 180) / Math.PI, blur: wheelBlur(spd)};
  return (
    <g>
      <TrackScene cam={cam} s0={-20000} s1={s + 190000} kerbs={false} />
      <LoftCar cam={cam} pose={lp} ink={3} />
    </g>
  );
};

export const Closing: React.FC<{t: number}> = ({t}) => {
  let shot: React.ReactNode;
  if (t < TIMES.insBrake) shot = <SideTrack t={t} />;
  else if (t < TIMES.insTurn) shot = <BrakeInsert t={t} />;
  else if (t < TIMES.insBump) shot = <TurnInsert t={t} />;
  else if (t < TIMES.jumpIn) shot = <BumpInsert t={t} />;
  else if (t < TIMES.driveIn) shot = <HopShot t={t} />;
  else shot = <DriveAway t={t} />;
  const endMark = smooth(seg(t, T7.keeping + 0.6, T7.composed + 0.5));
  return (
    <AbsoluteFill>
      <Stage bg={C.paper}>
        {shot}
        <Caption text="SLOW MOTION · SIMPLIFIED MODEL" opacity={win(t, TIMES.jumpIn + 0.2, CLOSE_EV.land + 0.6, 0.3, 0.4)} />
        <g opacity={endMark * 0.9}>
          <text x={1884} y={1032} textAnchor="end" fontFamily={F.display} fontWeight={700} fontSize={30} fill={C.ink} letterSpacing={5}>FUTURE GOT WEIRD</text>
        </g>
      </Stage>
    </AbsoluteFill>
  );
};
void easeInOut;
void easeOut;
void toScreen;
void camKeys;
void Label;
void trackPoint;
void AXLE_R;
