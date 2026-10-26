// The interaction set: the visitor behind the bench, the robot on its support across from him, seen from an
// oblique angle. Used by the hook, the late-smile example, the co-expression, the possible-use scene and the
// closing callback, always with the same world layout so the ending returns to the opening geometry exactly.
import React from 'react';
import {Expr} from '../dc/Head';
import {HandPose, HAND_RELAXED} from '../dc/Hand';
import {ManPose} from '../dc/Man';
import {Bench, ControlBox, Shadow, Wall} from '../art/Lab';
import {Cutaway, Robot, RobotState, RobotSupport} from '../art/Robot';
import {Visitor} from '../art/Visitor';
import {Cam, Layer} from '../lib/cam';

export const INT = {
  robot: {x: 640, y: 392, s: 1.3},
  visitor: {x: 1336, y: 352, s: 1.22},
  benchY: 690,
  benchDepth: 84,
};
/** the robot's support post length so its base sits on the bench top */
const POST = (INT.benchY + 46 - INT.robot.y) / INT.robot.s - 206;

export type IntProps = {
  id: string;
  cam: Cam;
  robot: RobotState;
  vis: {expr: Expr; blink: number};
  visPose?: Partial<ManPose>;
  lHand?: HandPose;
  rHand?: HandPose;
  holdL?: any;
  holdR?: any;
  cut?: Cutaway;
  anchors?: number;
  focusAnchor?: string;
  /** extra drawn in the robot's layer over the head */
  overRobot?: React.ReactNode;
  /** extra drawn on the bench (props) */
  onBench?: React.ReactNode;
  /** extra in the visitor's layer, in front of him (held props) */
  overVisitor?: React.ReactNode;
  wallDetail?: 'shelf' | 'board' | 'both' | 'none';
  grid?: number;
  gridAt?: {u: number; v: number; r: number};
  xray?: number;
};

export const IntSet: React.FC<IntProps> = ({id, cam, robot, vis, visPose, lHand = HAND_RELAXED, rHand = HAND_RELAXED, holdL, holdR, cut, anchors, focusAnchor, overRobot, onBench, overVisitor, wallDetail = 'both', grid, gridAt, xray}) => (
  <g>
    <Layer cam={cam} depth={1.8}>
      <Wall id={`${id}-wall`} x0={-900} x1={2900} top={-420} wainsY={560} floorY={1100} detail={wallDetail} shelfX={-120} boardX={1880} />
    </Layer>
    <Layer cam={cam} depth={1.06}>
      <Visitor id={`${id}-vis`} hx={INT.visitor.x} hy={INT.visitor.y} s={INT.visitor.s} expr={vis.expr} blink={vis.blink} pose={visPose} lHand={lHand} rHand={rHand} holdL={holdL} holdR={holdR} />
      {overVisitor}
    </Layer>
    <Layer cam={cam} depth={1}>
      <Bench id={`${id}-bench`} x0={-700} x1={2700} y={INT.benchY} depth={INT.benchDepth} face={420} legs={false} />
      <Shadow cx={INT.robot.x + 10} cy={INT.benchY + 50} rx={110} ry={14} />
      <ControlBox x={250} y={INT.benchY + 52} s={1} />
      <path d={`M320,${INT.benchY + 40} C380,${INT.benchY + 60} 450,${INT.benchY + 58} ${INT.robot.x - 80},${INT.benchY + 44}`} fill="none" stroke="#2B313A" strokeWidth={7} strokeLinecap="round" />
      {onBench}
      <RobotSupport id={`${id}-sup`} x={INT.robot.x} y={INT.robot.y} s={INT.robot.s} yaw={robot.yaw} postLen={POST} />
      <Robot id={`${id}-rob`} st={robot} x={INT.robot.x} y={INT.robot.y} s={INT.robot.s} cut={cut} anchors={anchors} focusAnchor={focusAnchor} grid={grid} gridAt={gridAt} xray={xray} xrayHot={['corner', 'cheek', 'lip']} />
      {overRobot}
    </Layer>
  </g>
);
