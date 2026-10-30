// One frame: the clinic background, then one drawing of the patient seen through one continuous camera, with the
// objects that leave the body (the cartilage piece, the ear flap) and the instruments above it; captions in screen
// space on top (never inside the camera transform).
import React from 'react';
import {clamp, ss} from './lib';
import {camAt, camTransform} from './world/camera';
import {B, TM} from './world/story';
import {Torso, UpperArm, ForearmSkin, Hand, Head, EarSiteScar} from './world/woman';
import {RibWindow} from './world/chest';
import {Piece} from './world/piece';
import {Tray} from './world/tray';
import {ArmSurface, ArmTools, turnAt} from './world/arm';
import {armRot, shoulderRot, headRot, gaze, brow, hookBlink, armEarNow, earTrack, ELBOW, SHOULDER, NECK} from './world/hook';
import {FIG} from './world/woman';
import {Flap, FlapTools, Anastomosis} from './world/head';
import {CrashNight, CrashGlass, crashAmt} from './world/crash';
import {BG} from './world/pal';
import {Captions} from './Captions';

const Soft: React.FC = () => (
  <defs>
    {[2, 3, 5, 6, 10].map((s) => (
      <filter key={s} id={`soft${s}`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation={s} />
      </filter>
    ))}
    <radialGradient id="bgG" cx="0.58" cy="0.36" r="0.75">
      <stop offset="0" stopColor={BG.glow} />
      <stop offset="0.45" stopColor={BG.mid} />
      <stop offset="0.8" stopColor={BG.top} />
      <stop offset="1" stopColor={BG.edge} />
    </radialGradient>
    <radialGradient id="warm" cx="0.42" cy="0.36" r="0.6">
      <stop offset="0" stopColor="#FFE6C2" stopOpacity="0.32" />
      <stop offset="1" stopColor="#FFE6C2" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.6" stopColor="#000" stopOpacity="0" />
      <stop offset="1" stopColor="#000" stopOpacity="0.38" />
    </radialGradient>
  </defs>
);

/** soft out-of-focus clinic shapes behind her, moving at a fraction of the camera (parallax) */
const Backdrop: React.FC<{cx: number; cy: number; z: number}> = ({cx, cy, z}) => {
  const k = 0.35, zz = 1 + (z - 1) * 0.25;
  return (
    <g transform={`translate(540 960) scale(${zz}) translate(${-(cx - 540) * k} ${-(cy - 960) * k})`} opacity="0.55">
      <rect x={-700} y={-1500} width={300} height={2400} rx={40} fill="#4F737E" filter="url(#soft10)" />
      <rect x={260} y={-1300} width={520} height={360} rx={30} fill="#6D939C" opacity="0.55" filter="url(#soft10)" />
      <circle cx={380} cy={-640} r={60} fill="#9CC1C8" opacity="0.35" filter="url(#soft10)" />
      <rect x={-900} y={700} width={2400} height={1400} fill={BG.floor} opacity="0.5" filter="url(#soft10)" />
    </g>
  );
};

export const Scene: React.FC<{t: number; captions: boolean}> = ({t, captions}) => {
  const cam0 = camAt(t);
  // V4 hook: while the ear fills the frame the camera rides with it as the arm rotates, so it holds its place on screen
  const ea = armEarNow(t), tk = earTrack(t);
  const cam = {...cam0, x: cam0.x + (ea.x - FIG.armEar.x) * tk, y: cam0.y + (ea.y - FIG.armEar.y) * tk};
  const ow = 1.5 + 0.5 * clamp((cam.z - 1) / 4);
  const turn = turnAt(t);
  const hair = ss(cam.z, 2.5, 5.5);
  const ribOpen = ss(t, B.ribWin[0], B.ribWin[1]) * (1 - ss(t, B.carry1[1] - 0.1, B.carry1[1] + 0.3));
  const taken = t >= B.lift[0] ? 1 : 0;
  const scar = 1 - 0.75 * ss(t, B.seat[0], B.seat[1]);
  const blink = Math.max(hookBlink(t), Math.exp(-(((t - 18.3) / 0.06) ** 2)));
  const night = crashAmt(t);
  // the finished ear: a brief warm lift in the light (the release), then back to the clinic tone
  const release = ss(t, B.reveal[0], B.reveal[0] + 0.5) * (1 - ss(t, TM.her - 0.1, TM.her + 0.6));
  return (
    <>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        <Soft />
        <rect width={1080} height={1920} fill="url(#bgG)" />
        <Backdrop cx={cam.x} cy={cam.y} z={cam.z} />
        <CrashNight t={t} />
        <g transform={camTransform(cam)}>
          <CrashGlass t={t} />
          <Torso ow={ow} />
          <Tray ow={ow} />
          <RibWindow open={ribOpen} taken={taken} t={t} ow={ow} />
          <g transform={`rotate(${headRot(t)} ${NECK.x} ${NECK.y})`}>
            <Head ow={ow} site={<EarSiteScar a={scar} />} blink={blink} gaze={gaze(t)} brow={brow(t)} />
          </g>
          <g transform={`rotate(${shoulderRot(t)} ${SHOULDER.x} ${SHOULDER.y})`}>
          <UpperArm ow={ow} />
          <g transform={`rotate(${armRot(t)} ${ELBOW.x} ${ELBOW.y})`}>
          <ForearmSkin ow={ow} turn={turn} hair={hair}>
            <ArmSurface t={t} px={cam.z} />
          </ForearmSkin>
          <Hand ow={ow} turn={turn} />
          <ArmTools t={t} />
          </g>
          </g>
          <Piece t={t} camZ={cam.z} />
          <Anastomosis t={t} />
          <Flap t={t} camZ={cam.z} />
          <FlapTools t={t} />
        </g>
        {night > 0.001 && <rect width={1080} height={1920} fill="#0A1426" opacity={0.28 * night} />}
        {release > 0.001 && <rect width={1080} height={1920} fill="url(#warm)" opacity={release} />}
        <rect width={1080} height={1920} fill="url(#vig)" />
      </svg>
      {captions && <Captions t={t} />}
    </>
  );
};
export {TM};
