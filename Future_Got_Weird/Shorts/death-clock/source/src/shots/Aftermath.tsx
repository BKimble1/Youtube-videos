// V2 arrival, treatment, recovery and ending, in the same street world and on the same rig and band.
// Arrival: the drone settles over him and its light lands on the band. Treatment: the camera follows that light
// into the band, tips round to the underside port established at the start, and the section opens again: the
// port presses to the skin, one blue treatment pulse runs down the channel into the vessel, and a blue wave
// travels along it; behind the wave the sluggish, dark flow brightens and speeds up (the internal response).
// Out again: he takes a deep breath, plants his left hand on the grass, the elbow loads, he sits up and the
// band turns green. Ending: "Life Expectancy: 42 Years" toward his gaze, attention to his worried face, one "?"
// on the band near "know?", his uneasy look, a short dip to black.
import React from 'react';
import {DeviceView} from '../art/Device';
import {DogPose, DOG_IDLE} from '../art/Dog';
import {EXPR_GASP, EXPR_PAIN, EXPR_RELIEF, EXPR_UNEASY, EXPR_WINCE, Expr, mixExpr} from '../art/Head';
import {HAND_BRACE, HAND_CLUTCH, HAND_LIMP, HAND_RELAXED, mixHand} from '../art/Hand';
import {PortModule, SectionLayers, VesselTube} from '../art/Interior';
import {bandCenter, manJoints, ManPose} from '../art/Man';
import {Cam} from '../lib/camera';
import {deviceState} from '../lib/device';
import {SKey, spline, splineRec, spring} from '../lib/motion';
import {add, clamp, easeInOut, easeOut, inv, lerp, mul, noise1, V} from '../lib/math';
import {B, TOTAL} from '../lib/timeline';
import {BAND_C, LIE, LOCAL_PER_WORLD, PORT_VIEW, SEC_ROLL, SEC_VIEW, SF, STREAM_VIEW, VP, W} from './Journey';
import {DroneOver} from './Rescue';
import {Scene} from './Scene';
import {GROUND} from './StreetShots';

const ease = easeInOut;
const blinkAt = (f: number, at: number[]) => Math.max(0, ...at.map((b) => 1 - Math.abs(f - b) / 3));
const logSpline = (f: number, keys: [number, number][]) => Math.exp(spline(f, keys.map(([t, z]) => [t, Math.log(z)])));

// treatment beats (frames)
const T = {
  push: B.treat0 + 9, // on the band
  tip: B.treat0 + 19, // case on the upper edge, section open
  port: B.treat0 + 23, // port pressed to the skin
  pulse0: B.treat0 + 23,
  pulse1: B.freeze + 2, // the pulse reaches the vessel as the timer is held
  wave1: B.treat1 - 6,
};

// ---------------------------------------------------------------- the man: arrival, treatment, recovery, ending
const SIT: Partial<ManPose> = {
  x: 760, y: 1700, torso: -2, chest: 16, neck: 16, turn: 0.42, pelvis: -4,
  lHip: 146, lKnee: 134, lAnk: -34, lFs: 0.95, lFsh: 1.0,
  rHip: 112, rKnee: 92, rAnk: -20, rFs: 0.78, rFsh: 0.7,
  rW: 1, rWx: 930, rWy: GROUND - 6, rElb: 1, rWr: -60,
  lW: 1, lWx: 520, lWy: 1470, lElb: -1, lWr: 4, // the left forearm rests across the raised knee, band toward his face
};
const PLANT2 = {x: 400, y: 1852};
const base = LIE.man;
const RECOVERY: SKey<ManPose>[] = [
  [B.out0 + 14, {...base}, 'stop'],
  // the support hand lifts from beside his face and plants under his shoulder
  [B.sit0 - 4, {...base, neck: -8, lWx: 318, lWy: 1818, lWr: 10}],
  [B.sit0 + 2, {...base, neck: -6, lWx: PLANT2.x, lWy: PLANT2.y, lWr: 6}, 'hit'],
  // the elbow loads: shoulder over the hand, the arm folds and takes his weight
  [B.sit0 + 12, {...base, torso: 76, chest: 8, neck: -4, lWx: PLANT2.x, lWy: PLANT2.y, lElb: -1, lWr: 4}],
  // he pushes up: the arm extends, hips turn, the legs start to come round, the right hand goes down too
  [B.sit0 + 26, {...base, x: 790, y: 1678, torso: 52, chest: 10, neck: -2, pelvis: 66, lHip: 40, lKnee: 70, lFs: 0.8, rHip: 30, rKnee: 64, rFs: 0.8, lWx: PLANT2.x, lWy: PLANT2.y, lElb: -1, rW: 1, rWx: 600, rWy: GROUND + 4, rElb: -1}],
  [B.sit0 + 36, {...base, x: 782, y: 1694, torso: 32, chest: 11, neck: 2, pelvis: 40, lHip: 62, lKnee: 70, lAnk: -10, lFs: 0.3, lFsh: 0.36, rHip: 54, rKnee: 66, rAnk: -8, rFs: 0.3, rFsh: 0.34, lWx: PLANT2.x + 40, lWy: PLANT2.y - 20, lElb: -1, rW: 1, rWx: 760, rWy: GROUND - 2, rElb: 1, rWr: -30}],
  [B.sit0 + 46, {...base, x: 772, y: 1704, torso: 14, chest: 12, neck: 6, pelvis: 14, lHip: 100, lKnee: 104, lAnk: -24, lFs: 0.4, lFsh: 0.34, rHip: 84, rKnee: 88, rAnk: -16, rFs: 0.36, rFsh: 0.32, lWx: 470, lWy: 1640, lElb: -1, lWr: 8, rW: 1, rWx: 900, rWy: GROUND - 4, rElb: 1, rWr: -40}],
  [B.sit1, {...base, ...SIT}],
  [TOTAL, {...base, ...SIT, neck: 20, lWy: 1462}],
];

const bodyAt = (f: number): ManPose => {
  if (f < B.out0 + 14) {
    // arrival + treatment: lying as at the start of the section (static arm), weaker breathing; then deep breaths
    const deep = clamp(inv(B.out0 - 4, B.out0 + 6, f));
    const br = (0.5 * Math.sin(f * 0.5) * (1 - deep) + 0.5 * Math.sin(f * 0.22) * deep) * clamp(1 - inv(B.treat0 + 4, B.treat0 + 10, f) + inv(B.treat1 - 6, B.treat1, f));
    return {...base, breath: 0.5 + br, torso: base.torso + br * (1.2 + deep * 2.2), chest: base.chest + br * deep * 2};
  }
  const m = splineRec(f, RECOVERY);
  const br = 0.5 * Math.sin(f * 0.24);
  return {...m, breath: 0.5 + br, chest: m.chest + br * 1.4, neck: m.neck + noise1(f * 0.2, 4) * 1.2};
};

const exprAt = (f: number): Expr => {
  if (f < B.treat1) return mixExpr(mixExpr(EXPR_WINCE, EXPR_PAIN, 0.5 + 0.5 * Math.sin(f * 0.13)), {...EXPR_WINCE, shut: 1}, 0.35);
  if (f < B.sit0) return mixExpr(EXPR_GASP, {...EXPR_GASP, open: 0.55}, 0.5 + 0.5 * Math.sin(f * 0.22)); // deep breaths, eyes open
  if (f < B.sit1) return mixExpr(mixExpr(EXPR_PAIN, EXPR_GASP, 0.5), EXPR_RELIEF, inv(B.sit0 + 30, B.sit1, f)); // effort, then relief
  if (f < B.face0) return mixExpr(EXPR_RELIEF, {...EXPR_RELIEF, gx: -0.3, gy: 0.6}, inv(B.sit1, B.end0 + 8, f)); // looks at the band
  // worry grows on the question; at the glitch his eyes snap to the band; then he looks up at us, uneasy
  const worry = mixExpr({...EXPR_RELIEF, gx: -0.3, gy: 0.6}, {...EXPR_UNEASY, gx: -0.3, gy: 0.55}, ease(inv(B.face0, B.face1, f)));
  if (f < B.glitch) return worry;
  if (f < B.react) return mixExpr(worry, {...EXPR_UNEASY, gx: -0.35, gy: 0.75, pupil: 0.6, lid: 0, browIn: 1}, ease(inv(B.glitch, B.glitch + 4, f)));
  return mixExpr({...EXPR_UNEASY, gx: -0.35, gy: 0.75, pupil: 0.6, lid: 0, browIn: 1}, {...EXPR_UNEASY, gx: 0.15, gy: -0.05, pupil: 0.7, browIn: 1, smile: -0.5}, ease(inv(B.react, B.react + 10, f)));
};

const dogAt = (f: number): DogPose => {
  const a = B.sit0;
  const dogT = ease(inv(a + 10, a + 56, f));
  return {
    ...LIE.dog,
    ...DOG_IDLE,
    x: lerp(LIE.dog.x, 1160, dogT),
    y: GROUND - 10,
    s: 1.4,
    facing: -1,
    head: lerp(28, 12, dogT),
    ears: spring((t) => lerp(0.9, 0.5, ease(inv(a + 10, a + 56, t))), f, 0.1, 0.25),
    tail: spring((t) => lerp(-6, 22 + 12 * Math.sin(t * 0.8), ease(inv(a + 10, a + 56, t))), f, 0.12, 0.3),
    sit: ease(inv(a + 50, a + 66, f)),
    step: f * 0.55,
    stepAmt: Math.sin(Math.PI * inv(a + 10, a + 56, f)),
    worry: lerp(1, 0.6, dogT),
    lean: 0,
  };
};

// ---------------------------------------------------------------- camera
const MED_ARR = {x: 360, y: 1640};
const sitJ = manJoints({...base, ...SIT} as ManPose);
const SIT_BAND = bandCenter(sitJ);
const SIT_FACE = add(sitJ.head, {x: 10, y: 40});
const TWO = {x: 600, y: 1400}; // whole head in frame, the band above the caption lane

export const afterCam = (f: number): Cam => {
  const keys: [number, V, number][] = [
    [B.arrive0, MED_ARR, 1.7],
    [B.treat0, add(MED_ARR, {x: -10, y: 20}), 2.0],
    [T.push, BAND_C, 9],
    [T.tip, SEC_VIEW, 15],
    [T.port, PORT_VIEW, 30],
    [T.pulse1, STREAM_VIEW, 32],
    [T.pulse1 + 12, W(SF.Xp - 1300, 520), 24],
    [T.wave1, W(SF.Xp - 2300, 520), 19],
    // back along the arm to the band face: the timer is held (blue, STABILIZING) as he takes a deep breath
    [B.treat1 + 6, BAND_C, 9.6],
    [B.treat1 + 16, BAND_C, 9.1],
    [B.sit0 - 4, {x: 380, y: 1690}, 2.5],
    [B.sit0 + 4, {x: 400, y: 1680}, 2.2],
    [B.sit0 + 30, {x: 520, y: 1600}, 1.6],
    [B.sit1, {x: lerp(SIT_FACE.x, SIT_BAND.x, 0.6), y: lerp(SIT_FACE.y, SIT_BAND.y, 0.65)}, 2.2],
    [B.end0 + 4, SIT_BAND, 8.6],
    [B.face0 - 4, SIT_BAND, 9.2],
    [B.face1 + 2, TWO, 2.5],
    [B.react, TWO, 2.58],
    [TOTAL, add(TWO, {x: 10, y: -30}), 2.8],
  ];
  return {
    x: spline(f, keys.map(([t, p]) => [t, p.x])),
    y: spline(f, keys.map(([t, p]) => [t, p.y])),
    z: logSpline(f, keys.map(([t, , z]) => [t, z])),
    roll: 0,
  };
};

// ---------------------------------------------------------------- render
export const Aftermath: React.FC<{id: string; f: number}> = ({id, f}) => {
  const cam = afterCam(f);
  const man = bodyAt(f);
  const j = manJoints(man);
  void j;
  const section = f >= T.push - 2 && f < T.wave1 + 4;
  const roll = f < T.push - 2 ? 0 : f < T.wave1 - 2 ? SEC_ROLL * ease(inv(T.push - 2, T.tip, f)) : f < B.sit1 ? SEC_ROLL * (1 - ease(inv(T.wave1 - 2, B.treat1 + 2, f))) : 0.3 * SEC_ROLL * ease(inv(B.sit1, B.end0, f));
  const backdrop = clamp(inv(T.push - 2, T.push + 8, f)) * (1 - clamp(inv(T.wave1 - 4, T.wave1 + 4, f)));
  const openAmt = ease(inv(T.push, T.tip + 2, f)) * (1 - ease(inv(T.wave1 - 4, T.wave1 + 4, f)));
  const portExt = clamp(inv(T.tip - 2, T.port, f)) * (1 - clamp(inv(T.pulse1 + 6, T.pulse1 + 14, f)));
  const treat = inv(T.pulse0, T.pulse1, f);
  const waveS = VP.entry + lerp(60, 2800, inv(T.pulse1 - 2, T.wave1 + 8, f));
  const px = cam.z / LOCAL_PER_WORLD;
  const tube = (
    <VesselTube
      id={`${id}-vt`}
      path={VP}
      f={f}
      px={px}
      s0={VP.entry - 900}
      s1={99999}
      sensors={1}
      sensorFront={VP.entry + 6000}
      flow={f < T.pulse1 ? 0.45 : 1.2}
      wave={f >= T.pulse1 - 2 && f < T.wave1 + 8 ? {s: waveS, a: 1} : undefined}
      dimFrom={f < T.pulse1 - 2 ? VP.entry - 2000 : waveS}
    />
  );
  const dev: DeviceView = {
    screen: deviceState(f),
    roll,
    yaw: 14,
    flip: true,
    glow: 1,
    caseOpen: section ? openAmt : 0,
    caseCut: () => (
      <g transform={SF.matrix}>
        <PortModule id={`${id}-pm`} sf={SF} f={f} ext={portExt} reservoir={0.7} blue={1} />
      </g>
    ),
    inArm: () =>
      section ? (
        <g transform={SF.matrix}>
          <SectionLayers id={`${id}-sec`} sf={SF} f={f} open={openAmt} tube={tube} stream={0} streamA={0} treat={treat > 0 && treat < 1 ? treat : 0} />
        </g>
      ) : null,
  };
  const beam = f < B.arrive0 + 8 ? 0 : clamp(inv(B.arrive0 + 8, B.treat0, f)) * (1 - clamp(inv(T.push - 4, T.push, f)));
  const droneOn = backdrop < 0.95;
  const lHand =
    f < B.sit0 - 6 ? HAND_LIMP : f < B.sit0 + 40 ? mixHand(HAND_LIMP, HAND_BRACE, ease(inv(B.sit0 - 6, B.sit0 + 2, f))) : mixHand(HAND_BRACE, HAND_RELAXED, ease(inv(B.sit0 + 40, B.sit1, f)));
  const rHand = f < B.sit0 + 16 ? mixHand(HAND_CLUTCH, {...HAND_CLUTCH, curl: [0.55, 0.62, 0.66, 0.7]}, 0.5 + 0.5 * Math.sin(f * 0.3)) : mixHand(HAND_CLUTCH, HAND_BRACE, ease(inv(B.sit0 + 16, B.sit0 + 26, f)));
  const fade = clamp(inv(B.dip0, TOTAL - 2, f));
  return (
    <g>
      <Scene
        id={id}
        cam={cam}
        man={man}
        expr={exprAt(f)}
        blink={blinkAt(f, [B.sit0 - 12, B.end0 + 20, B.react + 16])}
        lHand={lHand}
        rHand={rHand}
        dog={f < B.sit0 ? {...LIE.dog, head: LIE.dog.head + 4 * Math.sin(f * 0.06)} : dogAt(f)}
        dev={dev}
        backdrop={backdrop}
        backdropC={W(SF.Xp - 900, 400)}
        nearLegFront={f >= B.sit0 + 38}
        leash={f >= B.sit0}
        extra={droneOn ? <DroneOver id={`${id}-do`} f={f} band={BAND_C} beam={beam} /> : null}
      />
      {fade > 0 && <rect x={0} y={0} width={1080} height={1920} fill="#05080C" opacity={fade} />}
    </g>
  );
};

export {mul, easeOut};
