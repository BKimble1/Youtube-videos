// V2 camera setups. Each is a small world of layered planes (background environment, characters, foreground) for the
// 2.5D camera. The lab two-shot keeps V1's interaction geometry (robot screen-left facing right, the visitor
// screen-right facing left) so the callback can return to the opening frame exactly; the close-ups, the profile and
// the over-the-shoulder are separate setups on the same axis (the camera never crosses the line between them).
import React from 'react';
import {Expr} from '../dc/Head';
import {HandPose, HAND_RELAXED} from '../dc/Hand';
import {ManPose} from '../dc/Man';
import {fmt} from '../dc/math';
import {Bench, ControlBox, Mirror, Shadow} from '../art/Lab';
import {Cutaway, Robot, RobotState, RobotSupport} from '../art/Robot';
import {Visitor} from '../art/Visitor';
import {Cam, Layer} from '../lib/cam';
import {INT} from '../shots/IntSet';
import {MIR, reflectYaw} from '../shots/MirrorSet';
import {AlcoveBack, DeskBack, LabBack, NookBack} from './env';
import {CheekSection} from './mech';
import {HomeBack, KitchenBack, OfficeBack, StageBack, StationBack, StreetBack} from './new';

export type Bg = 'lab' | 'alcove' | 'nook' | 'desk' | 'home' | 'station' | 'kitchen' | 'street' | 'stage' | 'office' | 'none';
/** an environment back plane, shifted/scaled so a setup can show the part of the room behind its subject */
export const Back: React.FC<{id: string; bg: Bg; veil?: number; dx?: number; dy?: number; s?: number}> = ({id, bg, veil = 0, dx = 0, dy = 0, s = 1}) => (
  <g transform={`translate(${fmt(dx)} ${fmt(dy)}) scale(${fmt(s)})`}>
    {bg === 'lab' && <LabBack id={id} veil={veil} />}
    {bg === 'alcove' && <AlcoveBack id={id} veil={veil} />}
    {bg === 'nook' && <NookBack id={id} veil={veil} />}
    {bg === 'desk' && <DeskBack id={id} veil={veil} />}
    {bg === 'home' && <HomeBack veil={veil} />}
    {bg === 'station' && <StationBack veil={veil} />}
    {bg === 'kitchen' && <KitchenBack veil={veil} />}
    {bg === 'street' && <StreetBack veil={veil} />}
    {bg === 'stage' && <StageBack veil={veil} />}
    {bg === 'office' && <OfficeBack veil={veil} />}
  </g>
);

const POST_INT = (INT.benchY + 46 - INT.robot.y) / INT.robot.s - 206;
export type Vis = {expr: Expr; blink: number};

/** setting A, the interaction two-shot (same world layout as V1's IntSet; richer room behind) */
export const LabTwo: React.FC<{
  id: string;
  cam: Cam;
  robot: RobotState;
  vis: Vis;
  visPose?: Partial<ManPose>;
  lHand?: HandPose;
  rHand?: HandPose;
  holdL?: any;
  holdR?: any;
  onBench?: React.ReactNode;
  overRobot?: React.ReactNode;
  overVisitor?: React.ReactNode;
  xray?: number;
  xrayDark?: number;
  cheek?: {k: number; side?: 1 | -1; r?: number};
  cut?: Cutaway;
  veil?: number;
}> = ({id, cam, robot, vis, visPose, lHand = HAND_RELAXED, rHand = HAND_RELAXED, holdL, holdR, onBench, overRobot, overVisitor, xray, xrayDark, cheek, cut, veil = 0.08}) => (
  <g>
    <Layer cam={cam} depth={1.9}>
      <Back id={`${id}-bk`} bg="lab" veil={veil} dx={-60} dy={40} />
    </Layer>
    <Layer cam={cam} depth={1.06}>
      <Visitor id={`${id}-vis`} hx={INT.visitor.x} hy={INT.visitor.y} s={INT.visitor.s} expr={vis.expr} blink={vis.blink} pose={visPose} lHand={lHand} rHand={rHand} holdL={holdL} holdR={holdR} />
      {overVisitor}
    </Layer>
    <Layer cam={cam} depth={1}>
      <Bench id={`${id}-bench`} x0={-900} x1={2900} y={INT.benchY} depth={INT.benchDepth} face={520} legs={false} />
      <Shadow cx={INT.robot.x + 10} cy={INT.benchY + 50} rx={110} ry={14} />
      <ControlBox x={250} y={INT.benchY + 52} s={1} />
      <path d={`M320,${INT.benchY + 40} C380,${INT.benchY + 60} 450,${INT.benchY + 58} ${INT.robot.x - 80},${INT.benchY + 44}`} fill="none" stroke="#2B313A" strokeWidth={7} strokeLinecap="round" />
      {onBench}
      <RobotSupport id={`${id}-sup`} x={INT.robot.x} y={INT.robot.y} s={INT.robot.s} yaw={robot.yaw} postLen={POST_INT} />
      <Robot id={`${id}-rob`} st={robot} x={INT.robot.x} y={INT.robot.y} s={INT.robot.s} xray={xray} xrayDark={xrayDark} xrayHot={['corner', 'cheek', 'lip']} cut={cut} />
      {cheek && cheek.k > 0.001 && (
        <g transform={`translate(${INT.robot.x} ${INT.robot.y}) scale(${INT.robot.s})`}>
          <CheekSection id={`${id}-ck`} st={robot} k={cheek.k} side={cheek.side ?? -1} r={cheek.r ?? 1} />
        </g>
      )}
      {overRobot}
    </Layer>
  </g>
);

/** a visitor single (close-up / medium close-up): his head at (hx, hy) at scale s; the room behind, softened */
export const VisitorCU: React.FC<{id: string; cam: Cam; vis: Vis; bg?: Bg; hx?: number; hy?: number; s?: number; turn?: number; veil?: number; bgDx?: number; bgDy?: number; bgS?: number; pose?: Partial<ManPose>; fore?: React.ReactNode; lHand?: HandPose; rHand?: HandPose; holdL?: any; holdR?: any; behind?: React.ReactNode}> = ({
  id, cam, vis, bg = 'lab', hx = 1080, hy = 500, s = 2.7, turn = 0.4, veil = 0.3, bgDx = -1500, bgDy = 120, bgS = 1.1, pose, fore, lHand, rHand, holdL, holdR, behind,
}) => (
  <g>
    <Layer cam={cam} depth={2.6}>
      <Back id={`${id}-bk`} bg={bg} veil={veil} dx={bgDx} dy={bgDy} s={bgS} />
    </Layer>
    {behind && <Layer cam={cam} depth={1.4}>{behind}</Layer>}
    <Layer cam={cam} depth={1}>
      <Visitor id={`${id}-v`} hx={hx} hy={hy} s={s} expr={vis.expr} blink={vis.blink} pose={{turn, lTv: 120, ...pose}} lHand={lHand} rHand={rHand} holdL={holdL} holdR={holdR} />
    </Layer>
    {fore && <Layer cam={cam} depth={0.8}>{fore}</Layer>}
  </g>
);

/** a robot single: head on its support at (x, y), scale s, seen at `yaw`; optional local cheek section */
export const RobotCU: React.FC<{id: string; cam: Cam; st: RobotState; bg?: Bg; x?: number; y?: number; s?: number; veil?: number; bgDx?: number; bgDy?: number; bgS?: number; cheek?: {k: number; side?: 1 | -1; hot?: boolean; r?: number; u?: number}; xray?: number; xrayHot?: string[]; xrayDark?: number; cut?: Cutaway; lensGlow?: number; grid?: number; gridAt?: {u: number; v: number; r: number}; fore?: React.ReactNode; over?: React.ReactNode; behind?: React.ReactNode; benchY?: number}> = ({
  id, cam, st, bg = 'lab', x = 860, y = 520, s = 3.1, veil = 0.3, bgDx = 700, bgDy = 120, bgS = 1.1, cheek, xray, xrayHot, xrayDark, cut, lensGlow, grid, gridAt, fore, over, behind, benchY,
}) => {
  const post = benchY !== undefined ? Math.max(0, (benchY + 36 - y) / s - 206) : 600;
  return (
    <g>
      <Layer cam={cam} depth={2.6}>
        <Back id={`${id}-bk`} bg={bg} veil={veil} dx={bgDx} dy={bgDy} s={bgS} />
      </Layer>
      {behind && <Layer cam={cam} depth={1.4}>{behind}</Layer>}
      <Layer cam={cam} depth={1}>
        {benchY !== undefined && <Bench id={`${id}-bench`} x0={-1200} x1={3200} y={benchY} depth={90} face={700} legs={false} />}
        {benchY !== undefined && <Shadow cx={x} cy={benchY + 44} rx={70 * s} ry={6 * s} />}
        <RobotSupport id={`${id}-sup`} x={x} y={y} s={s} yaw={st.yaw} postLen={post} />
        <Robot id={`${id}-r`} st={st} x={x} y={y} s={s} xray={xray} xrayHot={xrayHot} xrayDark={xrayDark} cut={cut} lensGlow={lensGlow} grid={grid} gridAt={gridAt} />
        {cheek && cheek.k > 0.001 && (
          <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
            <CheekSection id={`${id}-ck`} st={st} k={cheek.k} side={cheek.side ?? -1} hot={cheek.hot ?? true} r={cheek.r ?? 1} u={cheek.u ?? 66} />
          </g>
        )}
        {over}
      </Layer>
      {fore && <Layer cam={cam} depth={0.8}>{fore}</Layer>}
    </g>
  );
};

/** the profile two-shot: camera perpendicular to the interaction axis, both faces large and level */
export const ProfileTwo: React.FC<{id: string; cam: Cam; robot: RobotState; vis: Vis; bg?: Bg; veil?: number; rTurn?: number; vTurn?: number; bgDx?: number; bgDy?: number; extraBench?: React.ReactNode}> = ({id, cam, robot, vis, bg = 'lab', veil = 0.2, rTurn = 72, vTurn = 0.9, bgDx = -500, bgDy = 160, extraBench}) => {
  const R = {x: 690, y: 470, s: 2.0};
  const benchY = 900;
  return (
    <g>
      <Layer cam={cam} depth={2.3}>
        <Back id={`${id}-bk`} bg={bg} veil={veil} dx={bgDx} dy={bgDy} s={1.05} />
      </Layer>
      <Layer cam={cam} depth={1.03}>
        <Visitor id={`${id}-v`} hx={1290} hy={440} s={1.95} expr={vis.expr} blink={vis.blink} pose={{turn: vTurn, lTv: 120}} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Bench id={`${id}-bench`} x0={-1000} x1={3000} y={benchY} depth={80} face={600} legs={false} />
        <Shadow cx={R.x} cy={benchY + 40} rx={140} ry={12} />
        {extraBench}
        <RobotSupport id={`${id}-sup`} x={R.x} y={R.y} s={R.s} yaw={rTurn} postLen={(benchY + 36 - R.y) / R.s - 206} />
        <Robot id={`${id}-r`} st={{...robot, yaw: rTurn}} x={R.x} y={R.y} s={R.s} />
      </Layer>
    </g>
  );
};

/** over the robot's shoulder: its back (and a sliver of cheek) large in the foreground, the visitor facing the camera */
export const OverRobot: React.FC<{id: string; cam: Cam; robot: RobotState; vis: Vis; bg?: Bg; veil?: number; rYaw?: number; vTurn?: number; vis2?: {hx: number; hy: number; s: number}; bgDx?: number; bgDy?: number; onTable?: React.ReactNode; holdR?: any; rHand?: HandPose}> = ({id, cam, robot, vis, bg = 'lab', veil = 0.15, rYaw = 148, vTurn = 0.22, vis2 = {hx: 1220, hy: 430, s: 1.85}, bgDx = 300, bgDy = 120, onTable, holdR, rHand}) => {
  const R = {x: 470, y: 600, s: 3.0};
  const benchY = 840;
  return (
    <g>
      <Layer cam={cam} depth={2.2}>
        <Back id={`${id}-bk`} bg={bg} veil={veil} dx={bgDx} dy={bgDy} s={1.05} />
      </Layer>
      <Layer cam={cam} depth={1.25}>
        <Visitor id={`${id}-v`} hx={vis2.hx} hy={vis2.hy} s={vis2.s} expr={vis.expr} blink={vis.blink} pose={{turn: vTurn}} holdR={holdR} rHand={rHand} />
        <Bench id={`${id}-bench`} x0={-800} x1={3000} y={benchY - 40} depth={70} face={600} legs={false} />
        {onTable}
      </Layer>
      <Layer cam={cam} depth={0.9}>
        <RobotSupport id={`${id}-sup`} x={R.x} y={R.y} s={R.s} yaw={rYaw} postLen={200} />
        <Robot id={`${id}-r`} st={{...robot, yaw: rYaw}} x={R.x} y={R.y} s={R.s} />
      </Layer>
    </g>
  );
};

/** the mirror setup (V1 MirrorSet geometry, richer room): one rig state drawn twice, the reflection flipped */
const POST_REAL = (MIR.benchY + 40 - MIR.robot.y) / MIR.robot.s - 206;
const POST_REFL = 140;
export const MirrorSet2: React.FC<{id: string; cam: Cam; st: RobotState; reflExtra?: React.ReactNode; overGlass?: React.ReactNode; onBench?: React.ReactNode; cornerCue?: number; reflXray?: number; reflHot?: string[]}> = ({id, cam, st, reflExtra, overGlass, onBench, cornerCue = 0, reflXray = 0, reflHot = []}) => {
  const rs: RobotState = {...st, yaw: reflectYaw(st.yaw)};
  return (
    <g>
      <Layer cam={cam} depth={2.0}>
        <Back id={`${id}-bk`} bg="lab" veil={0.1} dx={700} dy={140} />
      </Layer>
      <Layer cam={cam} depth={1.35}>
        <Mirror id={`${id}-mir`} q={MIR.glass} legY={1150}>
          {/* the reflected room: the lab behind the camera (window light, shelving), simplified and cooler */}
          <rect x={700} y={0} width={1000} height={1100} fill="#C9D3D2" />
          <rect x={700} y={560} width={1000} height={600} fill="#7FA09E" />
          <rect x={700} y={552} width={1000} height={12} fill="#E7E6DC" />
          <rect x={1330} y={130} width={190} height={240} rx={4} fill="#DDE9EC" stroke="#8FA3A8" strokeWidth={3} />
          <line x1={1425} y1={130} x2={1425} y2={370} stroke="#C9D3D2" strokeWidth={6} />
          <rect x={900} y={150} width={180} height={300} fill="#A9B4B0" opacity={0.7} />
          {[0, 1, 2].map((i) => <rect key={i} x={900} y={150 + i * 100} width={180} height={8} fill="#8E8A7A" opacity={0.8} />)}
          <rect x={700} y={786} width={1000} height={46} fill="#C3976A" />
          <rect x={700} y={832} width={1000} height={200} fill="#A97C50" />
          <g transform={`translate(${MIR.refl.x} ${MIR.refl.y}) scale(-1 1)`}>
            <Shadow cx={0} cy={MIR.refl.s * (POST_REFL + 210)} rx={95} ry={10} />
            <RobotSupport id={`${id}-rsup`} x={0} y={0} s={MIR.refl.s} yaw={rs.yaw} postLen={POST_REFL} tint="#BFD7E2" tintK={0.12} />
            <Robot id={`${id}-rr`} st={rs} x={0} y={0} s={MIR.refl.s} tint="#BFD7E2" tintK={0.12} cornerCue={cornerCue} xray={reflXray} xrayHot={reflHot} xrayDark={0.32} />
            {reflExtra}
          </g>
          {overGlass}
        </Mirror>
      </Layer>
      <Layer cam={cam} depth={1}>
        <Bench id={`${id}-bench`} x0={-900} x1={2700} y={MIR.benchY} depth={90} face={400} legs={false} />
        <ControlBox x={1020} y={MIR.benchY + 58} s={1.15} />
        <path d={`M935,${MIR.benchY + 44} C820,${MIR.benchY + 66} 700,${MIR.benchY + 60} 600,${MIR.benchY + 46}`} fill="none" stroke="#2B313A" strokeWidth={8} strokeLinecap="round" />
        {onBench}
      </Layer>
      <Layer cam={cam} depth={0.86}>
        <Shadow cx={MIR.robot.x} cy={MIR.benchY + 60} rx={170} ry={18} />
        <RobotSupport id={`${id}-sup`} x={MIR.robot.x} y={MIR.robot.y} s={MIR.robot.s} yaw={st.yaw} postLen={POST_REAL} />
        <Robot id={`${id}-real`} st={st} x={MIR.robot.x} y={MIR.robot.y} s={MIR.robot.s} />
      </Layer>
    </g>
  );
};
/** a camera (depth-1 coordinates) that centres a point given in the mirror layer's coordinates at a layer zoom */
export const mirrorLayerCam = (p: {x: number; y: number}, zLayer: number, D = 1.35): Cam => ({x: 960 + (p.x - 960) * D, y: 540 + (p.y - 540) * D, z: 1 + (zLayer - 1) * D});
