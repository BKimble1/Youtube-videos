import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from './theme';
import {SensorTop} from './components/v02/HandheldSensor';
import {segmentHitsRect} from './lib/optics';
import {
  BigSensor,
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
  bigSensorScreen,
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
 * One physical set-up, drawn three ways. Plan (metres; x along the relay wall, z toward the camera, the wall at z = 0):
 * a plain light relay wall; a free-standing coral wall perpendicular to it that stops short of it (a gap at its far
 * end); the time-of-flight sensor on its little tripod on one side; the guesser pressed against the other side. The
 * light route is sensor -> one spot on the wall -> round the coral wall's far end -> his head (a faint return comes
 * back the same way). `checkRoute` throws unless both plan legs clear the coral footprint, the direct line S -> H is
 * blocked, and no drawn leg touches the coral wall on screen. Nothing passes through the wall; nothing is X-rayed or
 * rebuilt as a picture (the readout in C is a blob: "likely location", not a photograph).
 */

/** The shared layout (metres). */
const LAYOUT = {
  block: {x0: 0, x1: 0.46, z0: 1.2, z1: 2.35, h: 2.15} as Block,
  S: {x: -2.05, z: 1.3, h: 1.35},
  W: {x: 0.74, h: 2.0},
  H: {x: 0.8, z: 1.62},
};

/** Camera whose plan floor point (ax, az) lands on screen (sx, sy). */
const camAt = (k: number, f: number, v: number, sh: number, ax: number, az: number, sx: number, sy: number): Cam => ({k, f, v, sh, ox: sx - k * (ax + sh * az), oy: sy - k * f * az});

type RoomProps = {
  label: string;
  cam: Cam;
  block?: Block;
  S?: {x: number; z: number; h: number};
  W?: {x: number; h: number};
  H?: {x: number; z: number};
  pose?: GuesserPose;
  /** where the light lands on his hair (deg round the head, 0 = top, - = toward the coral wall) */
  hitAngle?: number;
  sensorScale?: number;
  outline?: number;
  guesserOutline?: number;
  showReturn?: boolean;
  /** 'full': sensor, both legs and the return; 'none': just the set and him */
  route?: 'full' | 'none';
  legWidth?: number;
  /** drawn on the wall, under the route */
  backdrop?: React.ReactNode;
  children?: React.ReactNode;
};

/** The room drawn into a 1920x1080 <svg> group (walls run past the frame). */
const Room: React.FC<RoomProps> = ({
  label,
  cam,
  block = LAYOUT.block,
  S = LAYOUT.S,
  W = LAYOUT.W,
  H = LAYOUT.H,
  pose = SMUG_SIDEWAYS,
  hitAngle = 8,
  sensorScale = 1.1,
  outline = 5,
  guesserOutline = 6,
  showReturn = true,
  route = 'full',
  legWidth = 18,
  backdrop,
  children,
}) => {
  const P = (x: number, z: number, h = 0) => proj(cam, x, z, h);
  const scale = rigScale(cam);
  const feet = P(H.x, H.z, 0);
  const head = guesserHead({x: feet.x, y: feet.y, scale, pose});
  const hit = head.rim(hitAngle, 4);
  const sTop = P(S.x, S.z, S.h);
  const emitLocal = sensorEmitter(0, 0, sensorScale);
  const sensorAt = {x: sTop.x - emitLocal.x, y: sTop.y - emitLocal.y};
  const sFoot = P(S.x, S.z, 0);
  const em = sensorEmitter(sensorAt.x, sensorAt.y, sensorScale);
  const w = P(W.x, 0, W.h);
  const faces = blockFaces(cam, block);
  const sil = blockSilhouette(cam, block);
  if (route === 'full') {
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
      minClear: legWidth / 2 + outline + 12,
    });
  }
  const wallBase = P(0, 0, 0).y;
  const shadowPts = [P(block.x0 - 0.04, block.z0 + 0.04), P(block.x1 + 0.18, block.z0 + 0.04), P(block.x1 + 0.18, block.z1 + 0.1), P(block.x0 - 0.04, block.z1 + 0.1)];
  return (
    <g>
      <rect x={-10} y={-10} width={1940} height={1100} fill={WALL} />
      <rect x={-10} y={wallBase} width={1940} height={1200} fill={FLOOR} />
      <rect x={-10} y={wallBase - 26} width={1940} height={26} fill={C.cream} stroke={INK} strokeWidth={outline} />
      <path d={polyD(shadowPts)} fill={C.shadow} />
      {backdrop}
      {route === 'full' && (
        <g>
          {/* the patch of wall the sensor lights */}
          <ellipse cx={w.x} cy={w.y} rx={legWidth * 5} ry={legWidth * 3.4} fill={C.saffronLight} opacity={0.8} />
          <ellipse cx={w.x} cy={w.y} rx={legWidth * 5} ry={legWidth * 3.4} fill="none" stroke={C.saffron} strokeWidth={3} strokeDasharray="10 12" />
          <SensorOnStand x={sensorAt.x} y={sensorAt.y} scale={sensorScale} standPx={sFoot.y - sensorAt.y} outline={outline * 0.9} />
          {showReturn && <ReturnTrail pts={[hit, w, em]} lane={-(legWidth + 12)} width={6} dash="1 15" opacity={0.85} />}
          <LightLeg a={em} b={w} width={legWidth} casing={outline} />
          <LightLeg a={w} b={hit} width={legWidth * 0.82} casing={outline} />
          <PulseDot p={lerp(em, w, 0.44)} r={legWidth * 0.9} outline={outline} />
          <PulseDot p={lerp(w, hit, 0.5)} r={legWidth * 0.78} outline={outline} />
          <BounceBurst p={w} r={legWidth * 1.1} outline={outline} />
        </g>
      )}
      <ThumbGuesser x={feet.x} y={feet.y} scale={scale} pose={pose} outline={guesserOutline} />
      {/* the coral wall, drawn over his near shoulder: he is pressed against its far side, just behind the corner */}
      <path d={polyD(faces.left)} fill={CORAL_SIDE} stroke={INK} strokeWidth={outline + 1} strokeLinejoin="round" />
      <path d={polyD(faces.top)} fill={CORAL_TOP} stroke={INK} strokeWidth={outline + 1} strokeLinejoin="round" />
      <path d={polyD(faces.front)} fill={CORAL_FRONT} stroke={INK} strokeWidth={outline + 1} strokeLinejoin="round" />
      {route === 'full' && <HitSpark p={hit} r={legWidth * 1.55} outline={outline} dir={-Math.PI / 2} />}
      {children}
    </g>
  );
};

/** Big two-tone title (Fredoka). */
const Title: React.FC<{lines: {text: string; color: string}[]; x: number; y: number; size: number; lineGap?: number; anchor?: 'start' | 'middle' | 'end'}> = ({lines, x, y, size, lineGap = 0.86, anchor = 'start'}) => (
  <g>
    {lines.map((l, i) => (
      <text key={i} x={x} y={y + i * size * lineGap} fill={l.color} textAnchor={anchor} style={{fontFamily: F.display, fontWeight: 700, fontSize: size, letterSpacing: -size * 0.01}}>
        {l.text}
      </text>
    ))}
  </g>
);

/** Single line with a coral accent word. */
const TitleLine: React.FC<{x: number; y: number; size: number; anchor?: 'start' | 'middle' | 'end'}> = ({x, y, size, anchor = 'start'}) => (
  <text x={x} y={y} textAnchor={anchor} style={{fontFamily: F.display, fontWeight: 700, fontSize: size, letterSpacing: -size * 0.01}}>
    <tspan fill={INK}>SEES </tspan>
    <tspan fill={C.coral}>ME?</tspan>
  </text>
);

const Frame: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = WALL}) => (
  <AbsoluteFill style={{background: bg}}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      {children}
    </svg>
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ A: wide; him large at right, sensor small at left */

export const ThumbA: React.FC = () => (
  <Frame>
    <Room
      label="ThumbA"
      cam={camAt(460, 0.5, 0.93, 0.1, LAYOUT.H.x, LAYOUT.H.z, 1560, 1355)}
      backdrop={<Title lines={[{text: 'SEES', color: INK}, {text: 'ME?', color: C.coral}]} x={66} y={238} size={250} />}
    />
  </Frame>
);

/* ------------------------------------------------------------------ B: tight on his smug face, the light landing on his head */

export const ThumbB: React.FC = () => (
  <Frame>
    <Room
      label="ThumbB"
      cam={camAt(640, 0.3, 0.97, 0.1, LAYOUT.H.x, LAYOUT.H.z, 1290, 1600)}
      sensorScale={1.4}
      legWidth={22}
      guesserOutline={6}
      backdrop={<Title lines={[{text: 'SEES', color: INK}, {text: 'ME?', color: C.coral}]} x={1880} y={215} size={215} anchor="end" />}
    />
  </Frame>
);

/* ------------------------------------------------------------------ C: what the readout shows vs where he hides */

/** Plan map for the readout: wall line at the top, coral wall, sensor, the route round the wall's end, a blob. */
const ReadoutMap: React.FC<{w: number; h: number}> = ({w, h}) => {
  const {block, S, W, H} = LAYOUT;
  // plan window (m): x -2.5..1.5, z 0..2.55 (the wall line sits a little below the screen top)
  const x0 = -2.45;
  const x1 = 1.45;
  const top = h * 0.16;
  const ppm = (w * 0.94) / (x1 - x0);
  const toS = (x: number, z: number): Pt => ({x: w * 0.03 + (x - x0) * ppm, y: top + z * ppm});
  const s = toS(S.x, S.z);
  const wp = toS(W.x, 0);
  const hp = toS(H.x, H.z);
  // plan-only physics check for the map's route
  const rect = {x0: block.x0 - 0.03, x1: block.x1 + 0.03, z0: block.z0 - 0.03, z1: block.z1 + 0.03};
  if (segmentHitsRect({x: S.x, z: S.z}, {x: W.x, z: 0}, rect) || segmentHitsRect({x: W.x, z: 0}, {x: H.x, z: H.z}, rect)) throw new Error('ThumbC map: route crosses the wall');
  const b0 = toS(block.x0, block.z0);
  const b1 = toS(block.x1, block.z1);
  const lw = w * 0.022;
  const ol = 4;
  const ticks = Array.from({length: 9}).map((_, i) => toS(x0 + 0.2 + i * 0.45, 0).x);
  const blob = (k: number) => {
    // a soft, lumpy "likely location" region (no picture of him): a few overlapping lobes
    const lobes = [
      [0, 0, 1],
      [-0.55, -0.22, 0.72],
      [0.5, 0.25, 0.7],
      [0.15, -0.48, 0.55],
    ];
    return lobes.map(([dx, dy, rr], i) => <ellipse key={i} cx={hp.x + dx * w * 0.05 * k} cy={hp.y + dy * w * 0.05 * k} rx={w * 0.075 * k * rr} ry={w * 0.06 * k * rr} />);
  };
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} fill={C.cream} />
      {/* relay wall */}
      <rect x={-10} y={top - h * 0.12} width={w + 20} height={h * 0.12} fill={'#EFE2C4'} />
      <line x1={-10} y1={top} x2={w + 10} y2={top} stroke={INK} strokeWidth={ol * 2} />
      {ticks.map((tx, i) => (
        <line key={i} x1={tx} y1={top} x2={tx} y2={top + h * 0.035} stroke={C.inkMuted} strokeWidth={3} />
      ))}
      {/* likely-location blob (teal), drawn under the route */}
      <g fill={C.tealLight} opacity={0.95}>{blob(1.35)}</g>
      <g fill={C.teal} stroke={INK} strokeWidth={ol}>
        {blob(0.78)}
      </g>
      <g fill={C.teal}>{blob(0.78)}</g>
      {/* coral wall (plan) */}
      <rect x={b0.x} y={b0.y} width={b1.x - b0.x} height={b1.y - b0.y} rx={4} fill={C.coral} stroke={INK} strokeWidth={ol} />
      {/* route: S -> W -> round the end -> H, with the faint return */}
      <polyline points={`${s.x},${s.y} ${wp.x},${wp.y} ${hp.x},${hp.y}`} fill="none" stroke={INK} strokeWidth={lw + ol * 2} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={`${s.x},${s.y} ${wp.x},${wp.y} ${hp.x},${hp.y}`} fill="none" stroke={C.saffron} strokeWidth={lw} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={wp.x} cy={wp.y} r={lw * 1.1} fill={C.saffron} stroke={INK} strokeWidth={ol} />
      <SensorTop x={s.x} y={s.y + lw * 0.6} size={w * 0.085} facing={(Math.atan2(wp.x - s.x, -(wp.y - s.y)) * 180) / Math.PI} asGroup />
      {/* centre mark of the estimate */}
      <circle cx={hp.x} cy={hp.y} r={lw * 0.75} fill={C.cream} stroke={INK} strokeWidth={ol} />
    </g>
  );
};

export const ThumbC: React.FC = () => {
  const dev = {x: 440, y: 600, w: 740};
  const scr = bigSensorScreen(dev.w);
  const panel = {x: 905, y: 300, w: 980, h: 750, r: 36};
  return (
    <Frame bg={C.paper}>
      <TitleLine x={960} y={236} size={232} anchor="middle" />
      {/* the sensor, close up from behind: its readout */}
      <BigSensor x={dev.x} y={dev.y} w={dev.w} outline={6}>
        <ReadoutMap w={scr.w} h={scr.h} />
      </BigSensor>
      {/* where he actually is */}
      <defs>
        <clipPath id="thumbCpanel">
          <rect x={panel.x} y={panel.y} width={panel.w} height={panel.h} rx={panel.r} />
        </clipPath>
      </defs>
      <g clipPath="url(#thumbCpanel)">
        <Room label="ThumbC" cam={camAt(560, 0.42, 0.95, 0.1, LAYOUT.H.x, LAYOUT.H.z, 1600, 1540)} route="none" />
      </g>
      <rect x={panel.x} y={panel.y} width={panel.w} height={panel.h} rx={panel.r} fill="none" stroke={INK} strokeWidth={7} />
    </Frame>
  );
};
