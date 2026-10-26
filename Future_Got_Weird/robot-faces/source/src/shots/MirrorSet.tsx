// The mirror setup (self-observation): the robot on its bench support faces a physical mirror on a floor stand; the
// camera looks over its shoulder. The reflection is the SAME rig state drawn mirrored: for a mirror whose normal points
// at the camera, a head facing yaw phi appears facing 180 - phi, i.e. the flip of the head drawn at phi - 180
// (see reflectYaw). Its LED (on the robot's left side) therefore flips sides, and the reflected expression can never
// differ from the real one: there is only one state.
import React from 'react';
import {Bench, ControlBox, Mirror, Shadow, Wall} from '../art/Lab';
import {Robot, RobotState, RobotSupport} from '../art/Robot';
import {Cam, Layer} from '../lib/cam';

/** yaw to draw (before the horizontal flip) for a mirror whose normal is at yaw mu (0 = toward the camera) */
export const reflectYaw = (phi: number, mu = 0) => phi - 2 * mu - 180;

export const MIR = {
  robot: {x: 470, y: 560, s: 2.05},
  glass: [[860, 96], [1570, 120], [1558, 958], [872, 946]] as [number, number][],
  refl: {x: 1235, y: 455, s: 1.02},
  benchY: 880,
};
const POST_REAL = (MIR.benchY + 40 - MIR.robot.y) / MIR.robot.s - 206;
const POST_REFL = 140;

export const MirrorSet: React.FC<{id: string; cam: Cam; st: RobotState; overlay?: React.ReactNode; reflExtra?: React.ReactNode; cornerCue?: number; anchors?: number}> = ({id, cam, st, overlay, reflExtra, cornerCue = 0, anchors = 0}) => {
  const rs: RobotState = {...st, yaw: reflectYaw(st.yaw)};
  return (
    <g>
      <Layer cam={cam} depth={2.0}>
        <Wall id={`${id}-wall`} x0={-1100} x1={3000} top={-500} wainsY={640} floorY={1300} detail="board" boardX={1850} cool={0.15} />
      </Layer>
      <Layer cam={cam} depth={1.35}>
        {/* floor-stand mirror */}
        <Mirror id={`${id}-mir`} q={MIR.glass} legY={1150}>
          {/* the reflected room: the lab behind the camera (cooler, simpler), the bench edge, the robot's support */}
          <rect x={700} y={0} width={1000} height={1100} fill="#C9D3D2" />
          <rect x={700} y={560} width={1000} height={600} fill="#7FA09E" />
          <rect x={700} y={552} width={1000} height={12} fill="#E7E6DC" />
          <rect x={980} y={200} width={170} height={120} rx={4} fill="#B9A487" opacity={0.7} />
          <rect x={700} y={786} width={1000} height={46} fill="#C3976A" />
          <rect x={700} y={832} width={1000} height={200} fill="#A97C50" />
          <g transform={`translate(${MIR.refl.x} ${MIR.refl.y}) scale(-1 1)`}>
            <Shadow cx={0} cy={MIR.refl.s * (POST_REFL + 210)} rx={95} ry={10} />
            <RobotSupport id={`${id}-rsup`} x={0} y={0} s={MIR.refl.s} yaw={rs.yaw} postLen={POST_REFL} tint="#BFD7E2" tintK={0.12} />
            <Robot id={`${id}-rr`} st={rs} x={0} y={0} s={MIR.refl.s} tint="#BFD7E2" tintK={0.12} cornerCue={cornerCue} anchors={anchors} />
            {reflExtra}
          </g>
        </Mirror>
      </Layer>
      <Layer cam={cam} depth={1}>
        <Bench id={`${id}-bench`} x0={-900} x1={2700} y={MIR.benchY} depth={90} face={400} legs={false} />
        <ControlBox x={1020} y={MIR.benchY + 58} s={1.15} />
        <path d={`M935,${MIR.benchY + 44} C820,${MIR.benchY + 66} 700,${MIR.benchY + 60} 600,${MIR.benchY + 46}`} fill="none" stroke="#2B313A" strokeWidth={8} strokeLinecap="round" />
      </Layer>
      <Layer cam={cam} depth={0.86}>
        <Shadow cx={MIR.robot.x} cy={MIR.benchY + 60} rx={170} ry={18} />
        <RobotSupport id={`${id}-sup`} x={MIR.robot.x} y={MIR.robot.y} s={MIR.robot.s} yaw={st.yaw} postLen={POST_REAL} />
        <Robot id={`${id}-real`} st={st} x={MIR.robot.x} y={MIR.robot.y} s={MIR.robot.s} />
      </Layer>
      {overlay}
    </g>
  );
};
