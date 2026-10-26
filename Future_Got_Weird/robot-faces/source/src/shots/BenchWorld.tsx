// The robot's working bench seen from the front: the robot on its support at centre, an ordinary monitor further
// along the bench (off-frame until the robot is given "something else to watch"). Used by the mechanism, skin,
// monitor and 2024-study scenes, so the monitor has one fixed place in the room.
import React from 'react';
import {Expr, Head} from '../dc/Head';
import {Bench, Monitor, Shadow, Wall} from '../art/Lab';
import {Cutaway, Robot, RobotState, RobotSupport} from '../art/Robot';
import {Cam, Layer} from '../lib/cam';

export const BW = {
  head: {x: 960, y: 470, s: 2.2},
  benchY: 960,
  mon: {x: 2150, y: 560, w: 560, h: 350},
};
const POST = Math.max(0, (BW.benchY + 36 - BW.head.y) / BW.head.s - 206);

export type BenchProps = {
  id: string;
  cam: Cam;
  st: RobotState;
  cut?: Cutaway;
  xray?: number;
  xrayHot?: string[];
  grid?: number;
  gridAt?: {u: number; v: number; r: number};
  anchors?: number;
  focusAnchor?: string;
  lensGlow?: number;
  /** monitor: on 0..1 and its content (world coords inside the screen) */
  monOn?: number;
  screen?: React.ReactNode;
  /** drawn in the world over the robot */
  over?: React.ReactNode;
};

export const BenchWorld: React.FC<BenchProps> = ({id, cam, st, cut, xray, xrayHot, grid, gridAt, anchors, focusAnchor, lensGlow, monOn = 0, screen, over}) => (
  <g>
    <Layer cam={cam} depth={2}>
      <Wall id={`${id}-wall`} x0={-1200} x1={3600} top={-600} wainsY={660} floorY={1400} detail="both" shelfX={280} boardX={2500} cool={0.15} />
    </Layer>
    <Layer cam={cam} depth={1}>
      <Bench id={`${id}-bench`} x0={-900} x1={3400} y={BW.benchY} depth={80} face={500} legs={false} />
      <Shadow cx={BW.head.x} cy={BW.benchY + 40} rx={190} ry={16} />
      <Shadow cx={BW.mon.x} cy={BW.benchY + 30} rx={150} ry={12} />
      <Monitor id={`${id}-mon`} x={BW.mon.x} y={BW.mon.y} w={BW.mon.w} h={BW.mon.h} on={monOn}>
        {screen}
      </Monitor>
      <path d={`M${BW.mon.x - 60},${BW.benchY + 30} C${BW.mon.x - 300},${BW.benchY + 60} 1500,${BW.benchY + 58} ${BW.head.x + 170},${BW.benchY + 44}`} fill="none" stroke="#2B313A" strokeWidth={7} strokeLinecap="round" />
      <RobotSupport id={`${id}-sup`} x={BW.head.x} y={BW.head.y} s={BW.head.s} yaw={st.yaw} postLen={POST} />
      <Robot id={`${id}-rob`} st={st} x={BW.head.x} y={BW.head.y} s={BW.head.s} cut={cut} xray={xray} xrayHot={xrayHot} grid={grid} gridAt={gridAt} anchors={anchors} focusAnchor={focusAnchor} lensGlow={lensGlow} />
      {over}
    </Layer>
  </g>
);

/** the recorded face on the monitor (the visitor, as video), centred in the screen */
export const ScreenFace: React.FC<{id: string; expr: Expr; blink?: number; k?: number; dx?: number; scale?: number}> = ({id, expr, blink = 0, k = 1, dx = 0, scale = 1}) => (
  <g opacity={k}>
    <rect x={BW.mon.x - BW.mon.w / 2} y={BW.mon.y - BW.mon.h / 2} width={BW.mon.w} height={BW.mon.h} fill="#D9E4E6" />
    <rect x={BW.mon.x - BW.mon.w / 2} y={BW.mon.y + 60} width={BW.mon.w} height={200} fill="#8FB3AD" />
    <Head id={id} c={{x: BW.mon.x + dx, y: BW.mon.y + 10}} R={110 * scale} roll={0} turn={0.1} expr={expr} blink={blink} inkW={5} />
  </g>
);
