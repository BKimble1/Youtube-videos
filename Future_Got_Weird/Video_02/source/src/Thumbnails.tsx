import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from './theme';
import {
  BounceBurst,
  CORAL_FRONT,
  CORAL_SIDE,
  CORAL_TOP,
  FLOOR,
  HitSpark,
  INK,
  LightLeg,
  PulseDot,
  ReturnTrail,
  SMUG_SIDEWAYS,
  SensorOnStand,
  ThumbGuesser,
  WALL,
  blockFaces,
  blockSilhouette,
  checkRoute,
  guesserHead,
  lerp,
  polyD,
  proj,
  rigScale,
  sensorEmitter,
  type Block,
  type Cam,
  type GuesserPose,
  type Pt,
} from './components/v02/Thumb_Kit';

/**
 * Video 02 thumbnails (1920x1080 stills): "SEES ME?".
 *
 * One physical set-up drawn three ways. Plan (metres, x along the relay wall, z toward the camera): a plain light relay
 * wall at z = 0; a free-standing coral wall perpendicular to it that stops short of the wall (a gap at its far end);
 * the time-of-flight sensor on a little tripod on one side; the guesser pressed against the other side. The light
 * route is sensor -> one spot on the wall -> round the coral wall's end -> his head; `checkRoute` proves the plan legs
 * clear the coral footprint (and that the direct line is blocked) and that no drawn leg touches the coral wall on
 * screen. Nothing passes through the wall; nothing is X-rayed or reconstructed as a picture.
 */

type RoomShotProps = {
  label: string;
  cam: Cam;
  block: Block;
  /** sensor plan position and emitter height (m) */
  S: {x: number; z: number; h: number};
  /** wall spot: x along the wall and height (m) */
  W: {x: number; h: number};
  /** guesser plan position */
  H: {x: number; z: number};
  pose: GuesserPose;
  /** where on his head the light lands: angle on the hair rim (deg, 0 = top, - = toward the coral wall) */
  hitAngle?: number;
  sensorScale?: number;
  outline?: number;
  guesserOutline?: number;
  showReturn?: boolean;
  legWidth?: number;
  children?: React.ReactNode;
  /** drawn after the wall, before the route (titles live here so the route stays on top of nothing) */
  backdrop?: React.ReactNode;
};

const RoomShot: React.FC<RoomShotProps> = ({label, cam, block, S, W, H, pose, hitAngle = -8, sensorScale = 1.05, outline = 5, guesserOutline = 6, showReturn = true, legWidth = 16, children, backdrop}) => {
  const P = (x: number, z: number, h = 0) => proj(cam, x, z, h);
  const scale = rigScale(cam);
  const feet = P(H.x, H.z, 0);
  const head = guesserHead({x: feet.x, y: feet.y, scale, pose});
  const hit = head.rim(hitAngle, 4);
  const sTop = P(S.x, S.z, S.h);
  // the sensor box is drawn with its emitter rim at the projected emitter height
  const emitLocal = sensorEmitter(0, 0, sensorScale);
  const sensorAt = {x: sTop.x - emitLocal.x, y: sTop.y - emitLocal.y};
  const sFoot = P(S.x, S.z, 0);
  const em = sensorEmitter(sensorAt.x, sensorAt.y, sensorScale);
  const w = P(W.x, 0, W.h);
  const faces = blockFaces(cam, block);
  const sil = blockSilhouette(cam, block);
  checkRoute({
    label,
    S: {x: S.x, z: S.z},
    W: {x: W.x, z: 0},
    H: {x: H.x, z: H.z},
    block,
    legs: [
      [em, w],
      [w, hit],
    ],
    silhouettes: [sil],
    minClear: legWidth / 2 + outline + 14,
  });
  const wallBase = P(0, 0, 0).y;
  const shadowPts = [P(block.x0 - 0.05, block.z0 + 0.04), P(block.x1 + 0.16, block.z0 + 0.04), P(block.x1 + 0.16, block.z1 + 0.08), P(block.x0 - 0.05, block.z1 + 0.08)];
  return (
    <AbsoluteFill style={{background: WALL}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {/* floor and skirting */}
        <rect x={-10} y={wallBase} width={1940} height={1200} fill={FLOOR} />
        <rect x={-10} y={wallBase - 26} width={1940} height={26} fill={C.cream} stroke={INK} strokeWidth={outline} />
        <path d={polyD(shadowPts)} fill={C.shadow} />
        {backdrop}
        <SensorOnStand x={sensorAt.x} y={sensorAt.y} scale={sensorScale} standPx={sFoot.y - sensorAt.y} outline={outline * 0.9} />
        {showReturn && <ReturnTrail pts={[hit, w, em]} lane={-(legWidth + 12)} width={6} dash="1 15" opacity={0.85} />}
        <LightLeg a={em} b={w} width={legWidth} casing={outline} />
        <LightLeg a={w} b={hit} width={legWidth * 0.8} casing={outline} />
        <PulseDot p={lerp(em, w, 0.42)} r={legWidth * 0.95} outline={outline} />
        <PulseDot p={lerp(w, hit, 0.5)} r={legWidth * 0.8} outline={outline} />
        <BounceBurst p={w} r={legWidth * 1.15} outline={outline} />
        <ThumbGuesser x={feet.x} y={feet.y} scale={scale} pose={pose} outline={guesserOutline} />
        {/* the coral wall: drawn over his shoulder (he is pressed against its far side, just behind the corner) */}
        <path d={polyD(faces.left)} fill={CORAL_SIDE} stroke={INK} strokeWidth={outline + 1} strokeLinejoin="round" />
        <path d={polyD(faces.top)} fill={CORAL_TOP} stroke={INK} strokeWidth={outline + 1} strokeLinejoin="round" />
        <path d={polyD(faces.front)} fill={CORAL_FRONT} stroke={INK} strokeWidth={outline + 1} strokeLinejoin="round" />
        <HitSpark p={hit} r={legWidth * 1.5} outline={outline} dir={-Math.PI / 2} />
        {children}
      </svg>
    </AbsoluteFill>
  );
};

/** Big two-tone title. */
const Title: React.FC<{lines: {text: string; color: string}[]; x: number; y: number; size: number; lineGap?: number; anchor?: 'start' | 'middle' | 'end'}> = ({lines, x, y, size, lineGap = 0.86, anchor = 'start'}) => (
  <g>
    {lines.map((l, i) => (
      <text key={i} x={x} y={y + i * size * lineGap} fill={l.color} textAnchor={anchor} style={{fontFamily: F.display, fontWeight: 700, fontSize: size, letterSpacing: -size * 0.01}}>
        {l.text}
      </text>
    ))}
  </g>
);

/* ------------------------------------------------------------------ A: wide, him large at right, sensor small at left */

const CAM_A: Cam = (() => {
  const k = 400;
  const f = 0.55;
  const v = 0.9;
  const sh = 0.14;
  // anchor the guesser's feet (plan 0.72, 1.62) at screen (1540, 1250)
  return {k, f, v, sh, ox: 1540 - k * (0.72 + sh * 1.62), oy: 1250 - k * f * 1.62};
})();

export const ThumbA: React.FC = () => (
  <RoomShot
    label="ThumbA"
    cam={CAM_A}
    block={{x0: 0, x1: 0.42, z0: 1.2, z1: 1.95, h: 2.3}}
    S={{x: -2.5, z: 1.3, h: 1.25}}
    W={{x: 0.86, h: 2.2}}
    H={{x: 0.72, z: 1.62}}
    pose={SMUG_SIDEWAYS}
    hitAngle={-4}
    backdrop={<Title lines={[{text: 'SEES', color: INK}, {text: 'ME?', color: C.coral}]} x={70} y={250} size={250} />}
  />
);

/* ------------------------------------------------------------------ B: tight on his smug face */

export const ThumbB: React.FC = () => (
  <AbsoluteFill style={{background: WALL}}>
    <svg width={1920} height={1080}>
      <Title lines={[{text: 'SEES ME?', color: INK}]} x={960} y={250} size={230} anchor="middle" />
    </svg>
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ C: readout blob vs his hiding spot */

export const ThumbC: React.FC = () => (
  <AbsoluteFill style={{background: WALL}}>
    <svg width={1920} height={1080}>
      <Title lines={[{text: 'SEES ME?', color: INK}]} x={960} y={250} size={230} anchor="middle" />
    </svg>
  </AbsoluteFill>
);

export type {Pt};
