import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from './theme';
import {SensorTop} from './components/v02/HandheldSensor';
import {segmentHitsRect} from './lib/optics';
import {RAISED_TILT} from './lib/shots';
import {
  BigSensor,
  BounceBurst,
  CORAL_FRONT,
  CORAL_SIDE,
  CORAL_TOP,
  FLOOR,
  HitSpark,
  INK,
  KitPlanInset,
  KitRoomThumb,
  assertScreenClear,
  kitPlanCardSize,
  titleRects,
  type KitThumbGeometry,
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
  kitThumbGeometry,
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
 * A and B (redrawn for review r1 D11) are the film's own room, cast and geometry (layout.json), built with the film-kit
 * section of Thumb_Kit: see "A and B" below. Every light leg is checked at module load at the thumbnail's own tilt and
 * zoom (assertAroundTheEnd, partition-as-drawn occlusion, no visible light above the partition's top), so a picture of
 * light going over the partition cannot render.
 *
 * C (unchanged) uses this file's own simplified set, described here. Plan (metres; x along the relay wall, z toward the camera, the wall at z = 0):
 * a plain light relay wall; a free-standing coral wall perpendicular to it that stops short of it (a gap at its far
 * end); the time-of-flight sensor on its little tripod on one side; the guesser pressed against the other side. The
 * light route is sensor -> one spot on the wall -> round the coral wall's far end -> his head (a faint return comes
 * back the same way). `checkRoute` throws unless both plan legs clear the coral footprint, the direct line S -> H is
 * blocked, and no drawn leg touches the coral wall on screen. Nothing passes through the wall; nothing is X-rayed or
 * rebuilt as a picture (the readout in C is a blob: "likely location", not a photograph).
 */

/** The shared layout (metres). */
const LAYOUT = {
  block: {x0: 0, x1: 0.46, z0: 1.35, z1: 1.8, h: 2.4} as Block,
  S: {x: -2.05, z: 1.3, h: 1.35},
  W: {x: 0.74, h: 2.3},
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

/* ------------------------------------------------------------------ A and B: the film's room (review r1 D11) */

/**
 * A and B are drawn with the film's own kit (Thumb_Kit `kitThumbGeometry` / `KitRoomThumb`): the episode's room at
 * RAISED_TILT, the layout's partition, sensor, wall spot W3 and his spot H, the cast rigs on the set's height scale.
 * The light goes from the sensor to the wall and round the partition's FAR end through the opening at the wall (the
 * gap is marked on the floor); behind the partition it is hidden, and it arrives at his wall-side torso (rim flash and
 * spark). Never over the top: each thumbnail's route is checked at module load at its own tilt and zoom (throws).
 */

/** A: the whole room story, title left: she reads the sensor, the light bounces off the wall and slips round the far
 *  end, he is smug behind the partition; "seen from above" (the film's PlanCard) under the title. The partition's top
 *  and the floor gap are both in frame. */
const GEO_A = kitThumbGeometry({
  label: 'ThumbA',
  tilt: RAISED_TILT,
  cam: {cx: 624, cy: 425, zoom: 1.5},
  extendLeft: 3,
});
const TITLE_A = {x: 66, y: 238, size: 250, anchor: 'start' as const};
const INSET_A = {x: 66, y: 516, area: {w: 520, h: 352}};

/** B: tighter on the faces and the far end (the partition runs out of the top of the frame), title and "seen from
 *  above" on the right. */
const GEO_B = kitThumbGeometry({
  label: 'ThumbB',
  tilt: RAISED_TILT,
  cam: {cx: 1110, cy: 462, zoom: 1.85},
  band: 13,
  extendLeft: 3,
});
const TITLE_B = {x: 1640, y: 232, size: 205, anchor: 'end' as const};
const INSET_B = {x: 1196, y: 486, area: {w: 452, h: 306}};

// screen layout (throws): the title lines and the inset keep clear of the people, the partition, the light and the
// frame edge, and of each other
for (const [geo, ti, ins] of [
  [GEO_A, TITLE_A, INSET_A],
  [GEO_B, TITLE_B, INSET_B],
] as const) {
  const sz = kitPlanCardSize(ins.area);
  assertScreenClear(geo, [...titleRects(ti.x, ti.y, ti.size, ti.anchor), {name: 'inset', x: ins.x, y: ins.y - 20, w: sz.w + 11, h: sz.h + 31}]);
}

const KitThumb: React.FC<{geo: KitThumbGeometry; title: typeof TITLE_A | typeof TITLE_B; inset: typeof INSET_A}> = ({geo, title, inset}) => (
  <AbsoluteFill style={{background: C.paper}}>
    <KitRoomThumb geo={geo} />
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      <Title lines={[{text: 'SEES', color: INK}, {text: 'ME?', color: C.coral}]} x={title.x} y={title.y} size={title.size} anchor={title.anchor} />
    </svg>
    <KitPlanInset x={inset.x} y={inset.y} area={inset.area} />
  </AbsoluteFill>
);

export const ThumbA: React.FC = () => <KitThumb geo={GEO_A} title={TITLE_A} inset={INSET_A} />;

export const ThumbB: React.FC = () => <KitThumb geo={GEO_B} title={TITLE_B} inset={INSET_B} />;

/* ------------------------------------------------------------------ C: what the readout shows vs where he hides */

/**
 * Plan map for the sensor's readout (the film's plan view in miniature): the relay wall line at the top, the coral
 * wall, the sensor, the route round the coral wall's far end, and a teal "likely location" blob where he stands. It is
 * a region, not a picture of him.
 */
const ReadoutMap: React.FC<{w: number; h: number}> = ({w, h}) => {
  const {block, S, W, H} = LAYOUT;
  const xa = -2.2;
  const xb = 1.5;
  const zb = 2.0;
  const top = h * 0.13;
  const ppm = Math.min((w * 0.92) / (xb - xa), (h - top - h * 0.04) / zb);
  const left = (w - (xb - xa) * ppm) / 2;
  const toS = (x: number, z: number): Pt => ({x: left + (x - xa) * ppm, y: top + z * ppm});
  const s = toS(S.x, S.z);
  const wp = toS(W.x, 0);
  const hp = toS(H.x, H.z);
  // the map's route obeys the same plan rule as the room views
  const rect = {x0: block.x0 - 0.03, x1: block.x1 + 0.03, z0: block.z0 - 0.03, z1: block.z1 + 0.03};
  if (segmentHitsRect({x: S.x, z: S.z}, {x: W.x, z: 0}, rect) || segmentHitsRect({x: W.x, z: 0}, {x: H.x, z: H.z}, rect)) throw new Error('ThumbC map: route crosses the coral wall');
  if (!segmentHitsRect({x: S.x, z: S.z}, {x: H.x, z: H.z}, rect)) throw new Error('ThumbC map: he would be in plain view');
  const b0 = toS(block.x0, block.z0);
  const b1 = toS(block.x1, block.z1);
  const lw = 15;
  const ol = 4.5;
  const R = 0.25 * ppm;
  // lobes (dx, dy, r) in units of R; nothing reaches further toward the wall than the main lobe
  const lobes: [number, number, number][] = [
    [0, 0, 1],
    [0.45, 0.32, 0.72],
    [0.18, -0.55, 0.62],
    [0.05, 0.6, 0.6],
    [0.6, -0.22, 0.6],
  ];
  if (H.x - 1.3 * (R / ppm) <= block.x1) throw new Error('ThumbC map: the likely-location blob would spill past the wall');
  const blob = (k: number) => lobes.map(([dx, dy, rr], i) => <ellipse key={i} cx={hp.x + dx * R * k} cy={hp.y + dy * R * k} rx={R * k * rr} ry={R * k * rr * 0.86} />);
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} fill={C.cream} />
      <rect x={-10} y={-10} width={w + 20} height={top + 10} fill="#EFE2C4" />
      <line x1={-10} y1={top} x2={w + 10} y2={top} stroke={INK} strokeWidth={8} />
      {Array.from({length: 9}).map((_, i) => {
        const tx = toS(xa + 0.2 + i * 0.45, 0).x;
        return <line key={i} x1={tx} y1={top} x2={tx} y2={top + 11} stroke={C.inkMuted} strokeWidth={3} />;
      })}
      {/* likely location: soft halo, then the blob */}
      <g fill={C.tealLight}>{blob(1.3)}</g>
      <g fill={C.teal} stroke={INK} strokeWidth={ol}>
        {blob(1)}
      </g>
      <g fill={C.teal}>{blob(1)}</g>
      {/* coral wall */}
      <rect x={b0.x} y={b0.y} width={b1.x - b0.x} height={b1.y - b0.y} rx={4} fill={C.coral} stroke={INK} strokeWidth={ol} />
      {/* faint return, then the route */}
      <ReturnTrail pts={[hp, wp, s]} lane={-(lw + 6)} width={4} dash="1 10" opacity={0.9} />
      <polyline points={`${s.x},${s.y} ${wp.x},${wp.y} ${hp.x},${hp.y}`} fill="none" stroke={INK} strokeWidth={lw + ol * 2} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={`${s.x},${s.y} ${wp.x},${wp.y} ${hp.x},${hp.y}`} fill="none" stroke={C.saffron} strokeWidth={lw} strokeLinejoin="round" strokeLinecap="round" />
      <BounceBurst p={wp} r={lw * 0.85} outline={ol} rays={8} />
      <SensorTop x={s.x} y={s.y + 10} size={46} facing={(Math.atan2(wp.x - s.x, -(wp.y - s.y)) * 180) / Math.PI} asGroup />
      <circle cx={hp.x} cy={hp.y} r={lw * 0.7} fill={C.cream} stroke={INK} strokeWidth={ol} />
    </g>
  );
};

export const ThumbC: React.FC = () => {
  const dev = {x: 470, y: 712, w: 850};
  const scr = bigSensorScreen(dev.w);
  const panel = {x: 1010, y: 292, w: 872, h: 752, r: 36};
  return (
    <Frame bg={C.paper}>
      <TitleLine x={960} y={222} size={226} anchor="middle" />
      {/* left: the sensor seen from behind, close up; its readout has found a blob round the corner */}
      <BigSensor x={dev.x} y={dev.y} w={dev.w} outline={6}>
        <ReadoutMap w={scr.w} h={scr.h} />
      </BigSensor>
      {/* right: where he actually is, smug and sure he is hidden */}
      <defs>
        <clipPath id="thumbCpanel">
          <rect x={panel.x} y={panel.y} width={panel.w} height={panel.h} rx={panel.r} />
        </clipPath>
      </defs>
      <g clipPath="url(#thumbCpanel)">
        <Room label="ThumbC" cam={camAt(600, 0.3, 0.96, 0.1, LAYOUT.H.x, LAYOUT.H.z, 1560, 1520)} route="none" />
      </g>
      <rect x={panel.x} y={panel.y} width={panel.w} height={panel.h} rx={panel.r} fill="none" stroke={INK} strokeWidth={7} />
    </Frame>
  );
};
