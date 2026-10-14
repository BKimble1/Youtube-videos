// The wrist close-up: the SAME left forearm and band, seen from above and in front. The forearm runs
// almost horizontally (hand at screen-left), so the UI reads upright along the arm. Two backgrounds:
// 'lying'  - the lawn, with his pained face lying in soft focus beyond the arm (distress stays visible)
// 'sitting' - after the rescue: the street in soft focus and his upright face looking down at the band.
// Weird Crew style: ink contours on the arm, hand, tee and head, dimensional gradients and glossy highlights.
// The arm framing is identical in both, so the ending can match the opening wrist composition.
// Native space is the 1080x1920 frame; a camera (Layer) moves through it with parallax.
import React from 'react';
import {Expr, Head} from './Head';
import {Hand, HandPose} from './Hand';
import {House, Tree, Tuft} from './Street';
import {ScreenState, screenLight, WatchBody} from './Watch';
import {Cam, Layer} from '../lib/camera';
import {lit, mix, PAL, shade} from '../lib/color';
import {add, fmt, hash, mul, norm, sub, V} from '../lib/math';
import {Capsule, Glow, Lin, SoftShadow} from '../lib/shade';
import {Deco, Inked, InkLine} from '../lib/ink';

export const CLOSE = {
  elbow: {x: 1320, y: 900} as V,
  wrist: {x: 420, y: 1004} as V,
  rElbow: 176,
  rWrist: 134,
  /** screen centre of the watch face */
  watch: {x: 676, y: 972} as V,
  /** forearm angle (deg); the case is rotated by it so the UI reads upright along the arm */
  ang: (Math.atan2(900 - 1004, 1320 - 420) * 180) / Math.PI,
  scale: 0.92,
  face: {x: 460, y: 560} as V,
  faceSit: {x: 480, y: 545} as V,
};

export type CloseProps = {
  id: string;
  cam: Cam;
  screen: ScreenState;
  expr: Expr;
  blink?: number;
  hand: HandPose;
  breath?: number;
  port?: number;
  overlay?: React.ReactNode;
  far?: React.ReactNode;
  headLift?: number;
  bg?: 'lying' | 'sitting';
  /** background blur (rack focus) */
  farBlur?: number;
  /** arm-plane blur (rack focus to his face) */
  armBlur?: number;
};

const Blur: React.FC<{id: string; sd: number; children: React.ReactNode}> = ({id, sd, children}) =>
  sd > 0.2 ? (
    <g filter={`url(#${id})`}>
      <defs>
        <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={fmt(sd)} />
        </filter>
      </defs>
      {children}
    </g>
  ) : (
    <g>{children}</g>
  );

const LyingBg: React.FC<{id: string; expr: Expr; blink: number; headLift: number}> = ({id, expr, blink, headLift}) => {
  const hl = headLift * 0.3;
  return (
    <g>
      <Lin id={`${id}-gr`} d="M-2000,-2000 h5080 v6000 h-5080 Z" from={{x: 0, y: -200}} to={{x: 0, y: 1900}} stops={[[0, mix(PAL.grass, PAL.grassLight, 0.5)], [0.6, PAL.grass], [1, mix(PAL.grass, PAL.grassDeep, 0.4)]]} />
      {Array.from({length: 26}).map((_, i) => (
        <Tuft key={i} id={`${id}-bt${i}`} x={-200 + hash(i, 2) * 1500} y={-100 + hash(i, 5) * 900} s={0.5 + hash(i, 8) * 0.4} seed={i + 100} color={mix(PAL.grass, PAL.grassLight, 0.3)} />
      ))}
      {/* his striped tee/shoulder lying beyond the arm, running off the top-right (crew outline, soft focus) */}
      {(() => {
        const d = `M480,${620 + hl} C570,${430 + hl} 850,${350 + hl} 1450,${350 + hl} L1450,${800 + hl} C1050,${820 + hl} 670,${800 + hl} 480,${620 + hl} Z`;
        return (
          <g>
            <Inked w={11}>
              <Lin id={`${id}-tee`} d={d} from={{x: 0, y: 360 + hl}} to={{x: 0, y: 810 + hl}} stops={[[0, '#FFFFFF'], [0.45, '#F4F7FA'], [1, '#B9C6D3']]} />
            </Inked>
            <Deco>
              <defs>
                <clipPath id={`${id}-tc`}>
                  <path d={d} />
                </clipPath>
              </defs>
              <g clipPath={`url(#${id}-tc)`}>
                {[640, 800, 960, 1120, 1280].map((x, i) => (
                  <path key={i} d={`M${x},${200 + hl} l70,0 l-40,700 l-70,0 Z`} fill={PAL.stripe} />
                ))}
                <Lin id={`${id}-tsh`} d={d} from={{x: 0, y: 360 + hl}} to={{x: 0, y: 810 + hl}} stops={[[0, '#FFFFFF', 0.35], [0.35, '#FFFFFF', 0], [0.7, '#2E4A66', 0.05], [1, '#2E4A66', 0.32]]} />
              </g>
            </Deco>
          </g>
        );
      })()}
      <Head id={`${id}-hd`} c={{x: CLOSE.face.x, y: CLOSE.face.y - headLift}} R={190} roll={-74 + headLift * 0.12} turn={0.3} expr={expr} blink={blink} inkW={5.5} />
    </g>
  );
};

const SittingBg: React.FC<{id: string; expr: Expr; blink: number}> = ({id, expr, blink}) => (
  <g>
    <Lin id={`${id}-sky`} d="M-2000,-2000 h5080 v2900 h-5080 Z" from={{x: 0, y: -400}} to={{x: 0, y: 900}} stops={[[0, '#CFE8F2'], [1, '#EAF3EE']]} />
    <g transform="translate(-260 -330) scale(1.15)">
      <House id={`${id}-h1`} x={-80} y={980} w={520} h={300} wall="#E9DCC2" roof="#8C6E62" door="#6E8C8A" />
      <House id={`${id}-h2`} x={620} y={990} w={560} h={320} wall="#C4D3DC" roof="#5E6E7E" door="#B06A55" />
      <Tree id={`${id}-t1`} x={520} y={1000} s={0.95} />
    </g>
    <Lin id={`${id}-lawn`} d="M-2000,800 h5080 v4000 h-5080 Z" from={{x: 0, y: 800}} to={{x: 0, y: 1900}} stops={[[0, mix(PAL.grass, PAL.grassLight, 0.4)], [1, PAL.grass]]} />
    {/* his upright striped tee behind the raised arm: broad shoulders, short neck (crew outline) */}
    {(() => {
      const d = 'M-60,1700 C-40,1060 120,860 480,830 C840,860 1000,1060 1020,1700 Z';
      return (
        <g>
          <Inked w={11}>
            <Capsule id={`${id}-nk`} a={{x: 480, y: 880}} b={{x: 480, y: 720}} ra={80} rb={76} color={shade(PAL.skin, 0.06)} />
          </Inked>
          <Inked w={11}>
            <Lin id={`${id}-tee`} d={d} from={{x: 40, y: 900}} to={{x: 1000, y: 1300}} stops={[[0, '#FFFFFF'], [0.5, '#F4F7FA'], [1, '#B9C6D3']]} />
          </Inked>
          <Deco>
            <defs>
              <clipPath id={`${id}-tc`}>
                <path d={d} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id}-tc)`}>
              {[960, 1120, 1280, 1440, 1600].map((y, i) => (
                <path key={i} d={`M-100,${y} Q480,${y - 50} 1100,${y} l0,72 Q480,${y + 22} -100,${y + 72} Z`} fill={PAL.stripe} />
              ))}
              <Lin id={`${id}-tsh`} d={d} from={{x: 100, y: 900}} to={{x: 1000, y: 1200}} stops={[[0, '#FFFFFF', 0.4], [0.35, '#FFFFFF', 0], [0.7, '#2E4A66', 0.06], [1, '#2E4A66', 0.34]]} />
              <ellipse cx={300} cy={960} rx={150} ry={46} transform="rotate(-24 300 960)" fill="#FFFFFF" opacity={0.3} />
            </g>
            <InkLine d="M368,846 Q480,920 592,846" w={10} />
          </Deco>
        </g>
      );
    })()}
    <Head id={`${id}-hd`} c={CLOSE.faceSit} R={205} roll={7} turn={0.18} expr={expr} blink={blink} inkW={5.5} />
  </g>
);

export const WristClose: React.FC<CloseProps> = ({id, cam, screen, expr, blink = 0, hand, breath = 0, port = 0, overlay, far, headLift = 0, bg = 'lying', farBlur = 7, armBlur = 0}) => {
  const C = CLOSE;
  const lightC = screenLight(screen);
  const dir = norm(sub(C.wrist, C.elbow));
  const rise = breath * 6;
  const elbow = add(C.elbow, {x: 0, y: -rise});
  const wrist = add(C.wrist, {x: 0, y: -rise * 0.4});
  const handAng = (Math.atan2(dir.y, dir.x) * 180) / Math.PI + 4;
  const lying = bg === 'lying';
  return (
    <g>
      <Layer cam={cam} depth={2.4}>
        <Blur id={`${id}-fb0`} sd={farBlur}>
          {lying ? <LyingBg id={`${id}-ly`} expr={expr} blink={blink} headLift={headLift} /> : <SittingBg id={`${id}-sit`} expr={expr} blink={blink} />}
          {far}
        </Blur>
      </Layer>
      <Layer cam={cam} depth={1}>
        <Blur id={`${id}-ab`} sd={armBlur}>
          {lying && <SoftShadow id={`${id}-as`} c={{x: 860, y: 1110}} rx={620} ry={110} alpha={0.36} rotate={-6} />}
          {lying && <SoftShadow id={`${id}-hs`} c={{x: 250, y: 1100}} rx={260} ry={90} alpha={0.32} rotate={10} />}
          {lying &&
            Array.from({length: 10}).map((_, i) => (
              <Tuft key={i} id={`${id}-mt${i}`} x={hash(i, 12) * 1080} y={1180 + hash(i, 13) * 120} s={0.9 + hash(i, 14) * 0.5} seed={i + 200} />
            ))}
          <Inked w={12}>
            <Capsule id={`${id}-fa`} a={elbow} b={wrist} ra={C.rElbow} rb={C.rWrist} color={PAL.skin} spec={0.34} k={1.05} />
          </Inked>
          {/* the screen's light on the skin around the band (local, not a screen-wide glow) */}
          <Glow id={`${id}-gl`} c={C.watch} r={330} ry={240} color={lightC} alpha={0.38} />
          <Hand id={`${id}-hd`} wrist={add(wrist, mul(dir, -30))} ang={handAng} L={430} thumbSide={1} view="back" pose={hand} color={PAL.skin} sheen={1.2} ink={12} />
          <g transform={`translate(${fmt(C.watch.x)} ${fmt(C.watch.y - rise * 0.7)}) rotate(${fmt(C.ang)}) scale(${C.scale})`}>
            <rect x={-88} y={-138} width={176} height={276} rx={30} fill="#5A2E1E" opacity={0.18} />
            <WatchBody id={`${id}-w`} r={138} screen={screen} port={port} />
          </g>
          {overlay}
        </Blur>
      </Layer>
      {lying && (
        <Layer cam={cam} depth={0.6}>
          <Blur id={`${id}-fgb`} sd={9}>
            <Tuft id={`${id}-f1`} x={80} y={2100} s={2.4} seed={301} color={PAL.grassDeep} />
            <Tuft id={`${id}-f2`} x={1000} y={2140} s={2.8} seed={302} color={PAL.grassDeep} />
          </Blur>
        </Layer>
      )}
    </g>
  );
};

/** Screen centre of the watch in close-up world coordinates (for cameras that frame the readout). */
export const WATCH_SCREEN = CLOSE.watch;
