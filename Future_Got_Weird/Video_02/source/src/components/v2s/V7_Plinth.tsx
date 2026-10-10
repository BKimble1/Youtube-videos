import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../../theme';
import {PLINTH} from '../../lib/shots';
import {Camera, Layer, worldToScreen, type Cam} from '../../lib/camera';
import {RopePost, RopeSpan, SensorStool} from '../v02/S5_Museum';
import {Exhibit2012, Exhibit2018, Exhibit2021} from '../v02/S5_Exhibits';
import {HandheldSensor} from '../v02/HandheldSensor';
import {Hall7, Ledge7, MU7, Plinth7, RopeSign7, SideCard7, SPOT_DIM, SpotPool, Spotlight, type Spot} from './V7_Set';

/**
 * V7 / V8 only: the whole history shelf as one world (V7_Set), drawn through a camera with the museum spotlight, so V7
 * and V8.1 render the same picture. V7 drives every prop from its cues; V8.1 (and V7's last frames) draw TIGHT_STATE,
 * the tight spotlight on the kit sensor standing on the fourth plinth (the V7 → V8 hand-off frame, by construction).
 */

export const P4 = MU7.P[3];
/** the kit sensor (HandheldSensor) on the fourth plinth: world scale, grip foot on the slab */
export const S_K = 1.5;
export const SENSOR_SPOT = {x: P4 - 8, y: MU7.slabTop};
/** the sensor's origin (its grip hold point) when it stands on its grip foot */
export const SENSOR_ORIGIN = {x: SENSOR_SPOT.x, y: SENSOR_SPOT.y - 14 * S_K};
/** the centre of the sensor box's front face (world px) */
export const BOX_CENTRE = {x: SENSOR_ORIGIN.x - 3 * S_K, y: SENSOR_ORIGIN.y - 79 * S_K};

/** The tight framing on the sensor (V7.5 end, V8.1): zoom 2.6, the box's centre at screen y 560, so the sensor fills
 *  the middle of the frame and the plinth's plaque is below the frame (only the slab top shows at the bottom). */
const Z_TIGHT = 2.6;
export const CAM_TIGHT: Cam = {cx: BOX_CENTRE.x, cy: BOX_CENTRE.y - (560 - 540) / Z_TIGHT, zoom: Z_TIGHT};
/** The tight spotlight pool round the sensor. */
export const TIGHT_SPOT: Spot = {x: BOX_CENTRE.x, y: MU7.slabTop + 6, rx: 230, ry: 30, top: 50, dim: SPOT_DIM};
{
  const plaqueTop = 540 + (MU7.plaque.y0 - CAM_TIGHT.cy) * CAM_TIGHT.zoom;
  if (plaqueTop < 1080) throw new Error(`V7_Plinth: the plaque shows in the tight framing (top at screen y ${plaqueTop.toFixed(0)})`);
}

export type Seg12 = {beam: number; scatter: number; view: number; flash: number; sketch?: {draw: number; rise: number}};
export type Seg21 = {beam: number; view: number; cells: number; monitor: number; ballX: number; frameBallX: number; frameIdx: number};
export type RopeSpanState = {x0: number; y0: number; x1: number; y1: number; sag: number};

export type MuseumState = {
  e12: Seg12;
  e21: Seg21;
  spans: (RopeSpanState | null)[];
  sign: {x: number; y: number; rot: number} | null;
  /** fourth plinth plaque lines 0..1 */
  p4: {t1: number; t2: number};
  /** all four plinth plaques (plate, screws, lines) 0..1; default 1. V7.5 fades them before the push into the tight
   *  spotlight, so no plate passes through the caption band (v2 review r1, V2-R1-29). */
  plates?: number;
  stool: {led: number; ping: number; hop: number; card: number};
  /** the kit sensor standing on the fourth plinth (null: not placed); world origin, teeter (deg about its foot) */
  sensor: {x: number; y: number; teeter: number; led: number; reveal: number} | null;
};

/** The settled shelf as V7 leaves it (exhibits still, rope up, sign hung, card off, sensor standing). */
const BALL_REST = 214;
export const SETTLED_SPANS: RopeSpanState[] = [0, 1, 2].map((i) => ({x0: MU7.posts[i], y0: MU7.ropeY, x1: MU7.posts[i + 1], y1: MU7.ropeY, sag: MU7.sag}));
export const TIGHT_STATE: MuseumState = {
  e12: {beam: 0, scatter: 0, view: 0, flash: 0},
  e21: {beam: 1, view: 1, cells: 6, monitor: 1, ballX: BALL_REST, frameBallX: BALL_REST, frameIdx: 0},
  spans: SETTLED_SPANS,
  sign: null,
  p4: {t1: 1, t2: 1},
  stool: {led: 0, ping: 0, hop: 0, card: 0},
  sensor: {x: SENSOR_ORIGIN.x, y: SENSOR_ORIGIN.y, teeter: 0, led: 1, reveal: 1},
};

const sv = {position: 'absolute' as const, left: 0, top: 0, overflow: 'visible' as const};

/**
 * The shelf through `cam` with the spotlight `spot`. `under` draws in the world just before the sensor (V7.5 frame fan;
 * the checker's arm goes in `over`, after the sensor). `screen` is drawn above the spotlight veil (labels, the scroll).
 * The stool's card is drawn above the veil too (a lit museum label), in the world.
 */
export const MuseumShot: React.FC<{cam: Cam; spot: Spot; state: MuseumState; under?: React.ReactNode; over?: React.ReactNode; screen?: React.ReactNode}> = ({cam, spot, state, under, over, screen}) => {
  const [P1, P2, P3] = MU7.P;
  const s = state.sensor;
  const foot = 14 * S_K;
  return (
    <AbsoluteFill style={{background: PLINTH.wall}}>
      <Camera cam={cam}>
        <Layer depth={1}>
          <svg width={1920} height={1080} style={sv}>
            <Hall7 pools={1 - spot.dim / SPOT_DIM} />
            <Ledge7 />
            <Plinth7 x={P1} line1="2012" line2="MIT" plate={state.plates} />
            <Plinth7 x={P2} line1="2018" line2="Stanford" plate={state.plates} />
            <Plinth7 x={P3} line1="2021" line2="Wisconsin + Milan" plate={state.plates} />
            <Plinth7 x={P4} line1="published 2026" line2="MIT + Dartmouth" size1={60} t1={state.p4.t1} t2={state.p4.t2} plate={state.plates} />
            <SpotPool spot={spot} />
            <Exhibit2012 x={P1} y={MU7.slabTop} beam={state.e12.beam} scatter={state.e12.scatter} view={state.e12.view} flash={state.e12.flash} sketch={state.e12.sketch} />
            <Exhibit2018 x={P2} y={MU7.slabTop} />
            <Exhibit2021 x={P3} y={MU7.slabTop} {...state.e21} />
            <SensorStool x={MU7.stool.x} led={state.stool.led} ping={state.stool.ping} hop={state.stool.hop} />
            {under}
            {s && (
              <g transform={`translate(${s.x} ${s.y}) rotate(${s.teeter.toFixed(3)} 0 ${foot})`}>
                <HandheldSensor scale={S_K} reveal={s.reveal} led={s.led} />
              </g>
            )}
            {over}
            {state.spans.map((sp, i) => (sp ? <RopeSpan key={`rs${i}`} {...sp} /> : null))}
            {MU7.posts.map((x) => (
              <RopePost key={`post${x}`} x={x} />
            ))}
            {state.sign && <RopeSign7 x={state.sign.x} y={state.sign.y} rot={state.sign.rot} text="research equipment" />}
          </svg>
        </Layer>
      </Camera>
      <Spotlight cam={cam} spot={spot} />
      {state.stool.card > 0.001 && (
        <Camera cam={cam}>
          <Layer depth={1}>
            <svg width={1920} height={1080} style={sv}>
              <SideCard7 t={state.stool.card} />
            </svg>
          </Layer>
        </Camera>
      )}
      {screen}
    </AbsoluteFill>
  );
};

/** The V7 → V8 hand-off picture: the tight spotlight on the kit sensor (V7's last frames, V8.1). */
export const TightShot: React.FC<{screen?: React.ReactNode}> = ({screen}) => <MuseumShot cam={CAM_TIGHT} spot={TIGHT_SPOT} state={TIGHT_STATE} screen={screen} />;

/** Screen point of a world point under a camera (re-export for the scenes). */
export const toScreen = (cam: Cam, x: number, y: number) => worldToScreen(cam, x, y);
