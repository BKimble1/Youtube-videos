// V2 shots, part 4: the late smile, the 2024 study, co-expression, the possible uses (132.32 - 206.5 s).
import React from 'react';
import {Head, EXPR_NEUTRAL, Expr} from '../dc/Head';
import {HAND_RELAXED, HandPose} from '../dc/Hand';
import {INK} from '../dc/ink';
import {clamp, fmt, lerp} from '../dc/math';
import {Monitor, Notebook, Shadow} from '../art/Lab';
import {Robot, RobotState, RobotSupport} from '../art/Robot';
import {UI, Wave} from '../art/Ui';
import {Tag} from './text3';
import {Visitor, VX} from '../art/Visitor';
import {Cam, camPath, Layer} from '../lib/cam';
import {pr, T} from '../lib/core';
import {INT} from '../shots/IntSet';
import {SmilePlot} from '../shots/Late';
import {CO24, K, screenFaceAt, SPEECH} from '../state';
import {Counter} from './env';
import {Back, LabTwo, OverRobot, RobotCU, VisitorCU} from './sets';
import {CheekSection} from './mech';
import {Bracket, HandArm, Letter, Panel, robotTrace, Workbook} from './props';
import {rob2, vis2} from './state2';
import {drift, e2, e3, TWO_A} from './shots2';

const view = (st: RobotState, yaw: number, gx?: number, gy?: number): RobotState => ({...st, yaw, gx: gx ?? st.gx, gy: gy ?? st.gy});
const CAM0: Cam = {x: 960, y: 540, z: 1};
const NB = <Notebook x={1180} y={INT.benchY + 15} rot={-6} />;

// ------------------------------------------------------------------ the late smile
// "But getting the mouth shape right leaves another problem.": back at the interaction bench
export const LateTwo: React.FC<{f: number}> = ({f}) => <LabTwo id="lt" cam={drift(f, K.another, K.when, {x: 990, y: 430, z: 1.55}, {x: 990, y: 426, z: 1.7})} robot={rob2(f)} vis={vis2(f)} onBench={NB} />;
// "When should the face move?": the robot, waiting
export const LateRob: React.FC<{f: number}> = ({f}) => <RobotCU id="lr" cam={drift(f, K.when, K.news, {x: 930, y: 560, z: 1}, {x: 930, y: 550, z: 1.04})} st={view(rob2(f), 24, 0.62, -0.04)} />;
/** the letter held up into the visitor's close-up (his near hand, from below frame) */
const letterHold = (f: number, a: number, b: number) => {
  const up = pr(f, a - 0.2, a + 0.4, e3) * (1 - pr(f, b - 0.5, b, e2));
  const y = lerp(1500, 860, up);
  return (
    <g>
      <Letter x={560} y={y - 40} rot={-10} w={280} h={360} />
      <HandArm id="lh" from={{x: 760, y: y + 520}} wrist={{x: 640, y: y + 140}} ang={-112} L={170} pose={{curl: [0.55, 0.6, 0.62, 0.66], spread: 0.3, thumb: 30, thumbCurl: 0.3}} sleeve />
    </g>
  );
};
// "Imagine telling someone good news.": the visitor, a letter in his hand, telling it (silent)
export const LateNews: React.FC<{f: number}> = ({f}) => <VisitorCU id="ln" cam={drift(f, K.news, K.stare, {x: 1010, y: 560, z: 1}, {x: 1010, y: 550, z: 1.03})} vis={vis2(f)} turn={0.42} fore={letterHold(f, K.news, K.finish + 99)} />;
// "They stare at you.": the robot, unmoved; a slow push
export const LateStare: React.FC<{f: number}> = ({f}) => <RobotCU id="ls" cam={drift(f, K.stare, K.finish, {x: 905, y: 500, z: 1.42}, {x: 900, y: 495, z: 1.58})} st={view(rob2(f), 24, 0.62, -0.04)} />;
// "You finish smiling.": his smile completes; the letter lowers
export const LateFinish: React.FC<{f: number}> = ({f}) => <VisitorCU id="lf" cam={drift(f, K.finish, K.switchOn, {x: 1010, y: 550, z: 1.03}, {x: 1010, y: 545, z: 1.05})} vis={vis2(f)} turn={0.42} fore={letterHold(f, K.news - 9, K.switchOn - 0.2)} />;
// "Then their smile switches on.": the robot's smile arrives, late and fast
export const LateSwitch: React.FC<{f: number}> = ({f}) => <RobotCU id="lw" cam={drift(f, K.switchOn, K.awkward, {x: 920, y: 540, z: 1.12}, {x: 920, y: 540, z: 1.16})} st={view(rob2(f), 24, 0.62, -0.04)} />;
// "Even a well-drawn expression can feel awkward when it arrives late.": the two faces side by side, with the two
// smiles as they were animated (a compact comparison; the gap is the lateness)
export const LateCompare: React.FC<{f: number}> = ({f}) => {
  const v = vis2(f);
  const st = view(rob2(f), 18, 0.5, 0);
  const cam = drift(f, K.awkward, K.study24, CAM0, {x: 960, y: 530, z: 1.03});
  return (
    <g>
      <Layer cam={cam} depth={2}>
        <Back id="lc-bk" bg="lab" veil={0.5} dx={-300} dy={140} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Panel id="lc-v" x={90} y={80} w={860} h={860} bg="#EDE4D0">
          <Head id="lc-vh" c={{x: 520, y: 520}} R={270} roll={0} turn={0.3} expr={{...v.expr, gx: -0.7}} blink={v.blink} inkW={8} />
        </Panel>
        <Panel id="lc-r" x={970} y={80} w={860} h={860} bg="#E6E9E4">
          <Robot id="lc-rr" st={st} x={1400} y={500} s={2.8} />
        </Panel>
      </Layer>
      <Tag x={1400} y={1010} text="late" k={pr(f, K.awkward + 0.2, K.awkward + 0.5)} size={34} anchor="middle" tone="warm" />
    </g>
  );
};

// ------------------------------------------------------------------ the 2024 study
const SM = {robot: {x: 640, y: 460, s: 2.1}, benchY: 880, mon: {x: 1430, y: 500, w: 640, h: 400}};
/** the recorded face on a monitor (any rect): the visitor, as video */
const ScreenFace2: React.FC<{id: string; x: number; y: number; w: number; h: number; e: Expr; ghost?: number}> = ({id, x, y, w, h, e, ghost = 0}) => {
  const R = h * 0.32;
  // Head mouth centre for turn 0.1: (-3.6, 54) head units
  const mouth = {x: x + w * 0.02 - 0.036 * R, y: y + h * 0.04 + 0.54 * R};
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill="#D9E4E6" />
      <rect x={x - w / 2} y={y + h * 0.2} width={w} height={h * 0.4} fill="#8FB3AD" />
      <Head id={id} c={{x: x + w * 0.02, y: y + h * 0.04}} R={R} roll={0} turn={0.1} expr={e} inkW={Math.max(4, R / 22)} />
      {ghost > 0.01 && (
        // the predicted expression: the coming smile as a dashed contour over the mouth
        <path d={`M${fmt(mouth.x - 0.34 * R)},${fmt(mouth.y - 0.1 * R)} Q${fmt(mouth.x)},${fmt(mouth.y + 0.34 * R)} ${fmt(mouth.x + 0.34 * R)},${fmt(mouth.y - 0.1 * R)}`} fill="none" stroke={UI.blue} strokeWidth={Math.max(4, R * 0.045)} strokeDasharray={`${fmt(R * 0.08)} ${fmt(R * 0.06)}`} strokeLinecap="round" opacity={ghost} />
      )}
    </g>
  );
};
/** the study set: the robot on the bench facing a monitor that plays a person's face */
const StudySet: React.FC<{id: string; cam: Cam; st: RobotState; f: number; ghost?: number}> = ({id, cam, st, f, ghost = 0}) => {
  const post = (SM.benchY + 36 - SM.robot.y) / SM.robot.s - 206;
  return (
    <g>
      <Layer cam={cam} depth={2}>
        <Back id={`${id}-bk`} bg="lab" veil={0.1} dx={300} dy={180} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Counter id={`${id}-b`} x0={-900} x1={3000} y={SM.benchY} depth={84} face={600} />
        <Shadow cx={SM.mon.x} cy={SM.benchY + 36} rx={190} ry={14} />
        <Monitor id={`${id}-mon`} x={SM.mon.x} y={SM.mon.y} w={SM.mon.w} h={SM.mon.h} on={1}>
          <ScreenFace2 id={`${id}-sf`} x={SM.mon.x} y={SM.mon.y} w={SM.mon.w} h={SM.mon.h} e={screenFaceAt(f)} ghost={ghost} />
        </Monitor>
        <path d={`M${SM.mon.x - 80},${SM.benchY + 36} C${SM.mon.x - 300},${SM.benchY + 66} 980,${SM.benchY + 62} ${SM.robot.x + 150},${SM.benchY + 48}`} fill="none" stroke="#2B313A" strokeWidth={7} strokeLinecap="round" />
        <Shadow cx={SM.robot.x} cy={SM.benchY + 44} rx={150} ry={14} />
        <RobotSupport id={`${id}-sup`} x={SM.robot.x} y={SM.robot.y} s={SM.robot.s} yaw={st.yaw} postLen={post} />
        <Robot id={`${id}-r`} st={st} x={SM.robot.x} y={SM.robot.y} s={SM.robot.s} lensGlow={0.3} />
      </Layer>
    </g>
  );
};
// "That timing problem was the focus of the team's earlier study, published in 2024.": a different setup in the
// lab: the robot facing a monitor that plays a face
export const StudyWide: React.FC<{f: number}> = ({f}) => {
  const cam = camPath(f, [[K.study24, {x: 1000, y: 540, z: 1.0}], [T('published in 2024.') - 0.4, {x: 1010, y: 536, z: 1.04}], [K.watched, {x: 1180, y: 520, z: 1.22}]], e2);
  return (
    <g>
      <StudySet id="sw" cam={cam} st={view(rob2(f), 60, 0.3, 0.08)} f={f} />
      <Tag x={90} y={110} text="Earlier study · Science Robotics · 2024" k={pr(f, T('earlier study,') - 0.1, T('earlier study,') + 0.3)} size={30} />
    </g>
  );
};
/** the screen insert: the face on the monitor, close */
const FaceInsert: React.FC<{f: number; cam: Cam; ghost?: number; marks?: number; up?: number; id: string}> = ({f, cam, ghost = 0, marks = 0, up = 0, id}) => {
  const e = screenFaceAt(f);
  const R = 940 * 0.32;
  const c = {x: 960 + 1720 * 0.02, y: 540 + 940 * 0.04};
  const mw = 0.28 * e.wide * (1 - 0.015) * R;
  const corner = (sg: number) => ({x: c.x - 0.036 * R + sg * mw, y: c.y + 0.54 * R - e.smile * 0.1 * R});
  const cheek = (sg: number) => ({x: c.x - 0.03 * R + sg * 0.5 * R, y: c.y + 0.26 * R - e.smile * 0.05 * R});
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#2B333C" />
      <Layer cam={cam} depth={1}>
        <rect x={60} y={30} width={1800} height={1020} rx={24} fill="#1E252C" stroke={INK} strokeWidth={6} />
        <defs>
          <clipPath id={`${id}-c`}>
            <rect x={100} y={70} width={1720} height={940} rx={8} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-c)`}>
          <ScreenFace2 id={`${id}-sf`} x={960} y={540} w={1720} h={940} e={e} ghost={ghost} />
          {marks > 0.01 &&
            [-1, 1].map((sg) => {
              const p = corner(sg);
              const q = cheek(sg);
              return (
                <g key={sg} opacity={marks}>
                  <circle cx={fmt(p.x)} cy={fmt(p.y)} r={22} fill="none" stroke={UI.amber} strokeWidth={6} />
                  <circle cx={fmt(q.x)} cy={fmt(q.y)} r={26} fill="none" stroke={UI.amber} strokeWidth={5} strokeDasharray="10 8" />
                  {up > 0.01 && <path d={`M${fmt(p.x + sg * 34)},${fmt(p.y + 10)} l0,-60 m-14,16 l14,-16 l14,16`} fill="none" stroke={UI.amber} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={up} />}
                </g>
              );
            })}
        </g>
      </Layer>
    </g>
  );
};
// "The robot watched videos of human expressions": the screen
export const StudyScreen: React.FC<{f: number}> = ({f}) => <FaceInsert id="ss" f={f} cam={drift(f, K.watched, T('and learned to'), CAM0, {x: 960, y: 560, z: 1.08})} />;
// "and learned to recognize small changes as a smile began to develop.": the corners and cheeks, very close
export const StudyCue: React.FC<{f: number}> = ({f}) => (
  <g>
    <FaceInsert id="sc" f={f} cam={drift(f, T('and learned to'), K.oneModel, {x: 984, y: 680, z: 2.3}, {x: 984, y: 684, z: 2.42})}  />
    <Tag x={960} y={1010} text="small changes" k={pr(f, T('small changes') - 0.1, T('small changes') + 0.3)} size={34} anchor="middle" tone="warm" />
  </g>
);
// "One model": the robot's eye camera, very close
export const StudyLens: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 30, 0.55, 0.05);
  return <RobotCU id="sl" cam={drift(f, K.oneModel, T('human expression.'), {x: 960, y: 540, z: 1}, {x: 960, y: 540, z: 1.08})} st={st} x={1180} y={760} s={9.0} veil={0.5} bgDx={-300} lensGlow={1} />;
};
// "predicted the human expression.": on the screen, the coming smile as a dashed prediction
export const StudyPredict: React.FC<{f: number}> = ({f}) => (
  <g>
    <FaceInsert id="sp" f={f} cam={drift(f, T('human expression.'), K.another2, {x: 984, y: 640, z: 1.4}, {x: 984, y: 646, z: 1.48})} ghost={pr(f, T('human expression.') + 0.1, T('human expression.') + 0.5)} />
    <Tag x={960} y={1010} text="predicted expression" k={pr(f, T('human expression.') + 0.2, T('human expression.') + 0.6)} size={34} anchor="middle" tone="warm" />
  </g>
);
// "Another translated the expression into movements the robot could make.": the corner motor carries it out
export const StudyMotor: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 18, 0.5, 0.05);
  const k = pr(f, K.another2 + 0.1, K.another2 + 0.5);
  return (
    <g>
      <RobotCU id="sm" cam={drift(f, K.another2, K.ms840, {x: 820, y: 640, z: 1}, {x: 810, y: 650, z: 1.06})} st={st} x={900} y={420} s={5.2} cheek={{k, side: -1, r: 1.25}} veil={0.4} />
      <Tag x={90} y={980} text="expression → motor commands" k={pr(f, T('translated the') - 0.1, T('translated the') + 0.3)} size={30} tone="warm" />
    </g>
  );
};
/** the timing comparison: two faces large, a small schematic track beneath with the 0.84 s bracket */
const Compare24: React.FC<{f: number; a: number; b: number; emph?: number; id: string}> = ({f, a, b, emph = 0, id}) => {
  const t = f / 30;
  const st = view(rob2(f), 16, 0.5, 0.05);
  const cam = drift(f, a, b, CAM0, {x: 960, y: 520, z: 1.03});
  const t0 = CO24.cue - 0.5, t1 = CO24.full + 0.8;
  const X0 = 520, XW = 1000, Y = 92;
  const tx = (tt: number) => X0 + (XW * (tt - t0)) / (t1 - t0);
  const ph = Math.min(t, t1);
  const pk = pr(f, CO24.predict - 0.05, CO24.predict + 0.15);
  const vk = pr(f, CO24.visible - 0.05, CO24.visible + 0.15);
  return (
    <g>
      <Layer cam={cam} depth={2}>
        <Back id={`${id}-bk`} bg="lab" veil={0.5} dx={-300} dy={140} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Panel id={`${id}-h`} x={70} y={190} w={880} h={850} bg="#D9E4E6" border={UI.coral}>
          <ScreenFace2 id={`${id}-sf`} x={510} y={630} w={880} h={850} e={screenFaceAt(f)} />
        </Panel>
        <Panel id={`${id}-r`} x={970} y={190} w={880} h={850} bg="#E6E9E4" border={UI.blue}>
          <Robot id={`${id}-rr`} st={st} x={1410} y={600} s={3.2} />
        </Panel>
      </Layer>
      <line x1={X0} y1={Y} x2={X0 + XW} y2={Y} stroke="#FBF7EE" strokeWidth={5} opacity={0.7} />
      <line x1={X0} y1={Y} x2={fmt(tx(ph))} y2={Y} stroke={UI.ink} strokeWidth={5} />
      <circle cx={fmt(tx(ph))} cy={Y} r={10} fill={UI.ink} />
      <line x1={fmt(tx(CO24.predict))} y1={Y - 20} x2={fmt(tx(CO24.predict))} y2={Y + 20} stroke={UI.blue} strokeWidth={7} opacity={pk} />
      <line x1={fmt(tx(CO24.visible))} y1={Y - 20} x2={fmt(tx(CO24.visible))} y2={Y + 20} stroke={UI.coral} strokeWidth={7} opacity={vk} />
      <text x={X0 + XW + 24} y={Y + 9} fontFamily="Nunito Variable" fontWeight={700} fontSize={24} fill={UI.ink} opacity={0.75}>schematic</text>
      <Bracket x0={tx(CO24.predict)} x1={tx(CO24.visible)} y={Y - 30} label="≈ 0.84 s" k={vk} size={26 + 6 * emph} />
    </g>
  );
};
// "The team reported predicting an approaching smile about 840 ms ahead of its appearance,"
export const StudyTiming: React.FC<{f: number}> = ({f}) => <Compare24 id="st" f={f} a={K.ms840} b={T('allowing the robot')} />;
// "allowing the robot to try to smile alongside the person.": the study set, both smiling together
export const StudyTogether: React.FC<{f: number}> = ({f}) => <StudySet id="sg" cam={drift(f, T('allowing the robot'), K.less, {x: 1040, y: 520, z: 1.12}, {x: 1040, y: 516, z: 1.18})} st={view(rob2(f), 60, 0.3, 0.08)} f={f} />;
// "Less than a second of anticipation.": the comparison again, the bracket named
export const StudyLess: React.FC<{f: number}> = ({f}) => <Compare24 id="sx" f={f} a={K.less} b={K.enough} emph={1} />;

// ------------------------------------------------------------------ co-expression and its limits
export const TogetherTwo: React.FC<{f: number}> = ({f}) => <LabTwo id="tg" cam={drift(f, K.enough, K.these, {x: 990, y: 440, z: 1.6}, {x: 990, y: 430, z: 1.78})} robot={rob2(f)} vis={vis2(f)} onBench={NB} />;
// "These were studies of facial movement.": the smile from the side, its corner motor working
export const TogetherMotor: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 40, 0.6, 0);
  return (
    <g>
      <RobotCU id="tm" cam={drift(f, K.these, T('A successful'), {x: 880, y: 600, z: 1}, {x: 880, y: 600, z: 1.05})} st={st} x={900} y={420} s={4.6} cheek={{k: pr(f, K.these + 0.1, K.these + 0.5), side: -1, r: 1.2}} veil={0.4} bgDx={300} />
      <Tag x={90} y={980} text="facial movement" k={pr(f, T('facial movement.') - 0.2, T('facial movement.') + 0.2)} size={32} tone="warm" />
    </g>
  );
};
// "A successful smile doesn't tell us whether a machine feels happy.": over the robot's shoulder, his smile facing us
export const TogetherOTS: React.FC<{f: number}> = ({f}) => <OverRobot id="to" cam={drift(f, T('A successful'), K.picture, {x: 960, y: 540, z: 1}, {x: 990, y: 520, z: 1.06})} robot={rob2(f)} vis={vis2(f)} />;

// ------------------------------------------------------------------ the possible uses (hypothetical)
const NK = {robot: INT.robot, visitor: INT.visitor, tableY: INT.benchY};
/** setting C: the study nook; the same axis as the lab (robot screen-left, the visitor screen-right) */
const NookTwo: React.FC<{id: string; cam: Cam; f: number; book?: React.ReactNode}> = ({id, cam, f, book}) => {
  const st = rob2(f);
  const v = vis2(f);
  const post = (NK.tableY + 30 - NK.robot.y) / NK.robot.s - 206;
  return (
    <g>
      <Layer cam={cam} depth={1.9}>
        <Back id={`${id}-bk`} bg="nook" veil={0.05} dx={-150} dy={80} />
      </Layer>
      <Layer cam={cam} depth={1.05}>
        <Visitor id={`${id}-v`} hx={NK.visitor.x} hy={NK.visitor.y} s={NK.visitor.s} expr={v.expr} blink={v.blink} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Counter id={`${id}-t`} x0={-900} x1={2900} y={NK.tableY} depth={INT.benchDepth} face={600} top="#D9B48A" front="#B98A5E" />
        {book ?? <Notebook x={1180} y={NK.tableY + 15} rot={-6} open />}
        <Shadow cx={NK.robot.x} cy={NK.tableY + 46} rx={120} ry={12} />
        <RobotSupport id={`${id}-sup`} x={NK.robot.x} y={NK.robot.y} s={NK.robot.s} yaw={st.yaw} postLen={post} />
        <Robot id={`${id}-r`} st={st} x={NK.robot.x} y={NK.robot.y} s={NK.robot.s} />
      </Layer>
    </g>
  );
};
// "But picture the possible interaction.": the study nook
export const UseWide: React.FC<{f: number}> = ({f}) => (
  <g>
    <NookTwo id="uw" cam={drift(f, K.picture, K.speaking, {x: 980, y: 440, z: 1.28}, {x: 988, y: 436, z: 1.38})} f={f} />
    <Tag x={90} y={110} text="Possible use" k={pr(f, K.picture + 0.2, K.picture + 0.6)} size={32} />
  </g>
);
// "You're speaking.": the visitor, talking
export const UseSpeak: React.FC<{f: number}> = ({f}) => <VisitorCU id="us" cam={drift(f, K.speaking, T('A machine looks'), {x: 1010, y: 560, z: 1}, {x: 1010, y: 552, z: 1.04})} vis={vis2(f)} turn={0.42} bg="nook" bgDx={-1300} bgDy={60} />;
// "A machine looks toward you.": the robot lifts its gaze from the book to him
export const UseLook: React.FC<{f: number}> = ({f}) => <RobotCU id="ul" cam={drift(f, T('A machine looks'), T('Its mouth follows'), {x: 930, y: 560, z: 1}, {x: 925, y: 552, z: 1.05})} st={view(rob2(f), rob2(f).yaw - 18)} bg="nook" bgDx={200} bgDy={60} />;
const VOICE = SPEECH(T('Its mouth follows') - 0.2, T('and its expression') + 0.4, 23);
const voiceTr = robotTrace(VOICE);
// "Its mouth follows its voice,": the robot speaking (silent); its own voice as a trace
export const UseVoice: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  return (
    <g>
      <RobotCU id="uv" cam={drift(f, T('Its mouth follows'), T('and its expression'), {x: 900, y: 600, z: 1}, {x: 900, y: 610, z: 1.05})} st={view(rob2(f), 24, 0.62, -0.04)} x={900} y={400} s={4.2} bg="nook" bgDx={200} bgDy={60} />
      <rect x={1300} y={760} width={520} height={130} rx={18} fill="#141B22" opacity={0.9} />
      <Wave x={1325} y={825} w={470} h={46} t0={t - 2} t1={t} fn={voiceTr} color="#58B6AE" />
      <Tag x={1560} y={940} text="its own voice" k={pr(f, T('its voice,') - 0.2, T('its voice,') + 0.2)} size={30} anchor="middle" tone="light" />
    </g>
  );
};
// "and its expression changes as yours does.": the two of them, closer, smiling together
export const UseTogether: React.FC<{f: number}> = ({f}) => <NookTwo id="ut" cam={drift(f, T('and its expression'), K.tutor, {x: 990, y: 430, z: 1.72}, {x: 992, y: 424, z: 1.82})} f={f} />;
// "Those movements could help make a tutor easier to follow,": the workbook; his hand turns the page; the robot
// watches from across the table
export const UseTutor: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  // ("to follow," also occurs at 51.6 s; the turn is timed from "easier")
  const turn = pr(f, T('easier to') - 0.35, T('easier to') + 0.75, e2);
  const st = view(rob2(f), 30, 0.2, 0.5);
  const cam = drift(f, K.tutor, T('or a robotic'), CAM0, {x: 960, y: 560, z: 1.04});
  // the page corner the hand holds (Workbook draws at (x, y) with scale(1, 0.62); right page edge x = w/2 * cos)
  const W = 1100, H = 620, BX = 960, BY = 700;
  const ex = BX + (W / 2) * Math.cos(Math.PI * turn);
  const ey = BY + (H / 2 - 60 * Math.sin(Math.PI * turn)) * 0.62;
  return (
    <g>
      <Layer cam={cam} depth={2.2}>
        <Back id="tu-bk" bg="nook" veil={0.35} dx={-100} dy={300} s={1.1} />
      </Layer>
      <Layer cam={cam} depth={1.5}>
        <RobotSupport id="tu-sup" x={420} y={250} s={1.5} yaw={st.yaw} postLen={120} />
        <Robot id="tu-r" st={st} x={420} y={250} s={1.5} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <rect x={-600} y={480} width={3200} height={1000} fill="#D9B48A" />
        <rect x={-600} y={480} width={3200} height={8} fill="#B98A5E" />
        <Workbook x={BX} y={BY} w={W} h={H} turn={turn} />
        <HandArm id="tu-h" from={{x: ex + 330, y: ey + 400}} wrist={{x: ex + 70, y: ey + 70}} ang={-140} L={190} pose={{curl: [0.5, 0.58, 0.64, 0.7], spread: 0.25, thumb: 52, thumbCurl: 0.45}} />
      </Layer>
      <Tag x={90} y={110} text="Possible use: a tutor" k={pr(f, T('a tutor') - 0.2, T('a tutor') + 0.2)} size={30} />
    </g>
  );
};
// "or a robotic assistant more approachable.": a help desk; he arrives with a question; the robot turns to him,
// smiles, and looks toward the door it is pointing him to (gaze only)
export const UseDesk: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = T('or a robotic');
  const look = pr(f, a + 0.3, a + 0.8);
  const door = pr(f, T('more approachable.') - 0.1, T('more approachable.') + 0.4);
  const sm = pr(f, a + 0.6, a + 1.4);
  const st: RobotState = {...rob2(f), yaw: lerp(10, 40, look) + 30 * door, gx: lerp(-0.2, 0.6, look) + 0.3 * door, gy: -0.05, smile: 0.1 + 0.7 * sm, open: 0.04 * sm, round: 0, press: 0, wide: 0};
  const v = vis2(f);
  const vex = {...v.expr, gx: lerp(-0.75, -0.75, 0) + 1.2 * door * 0, smile: 0.2 + 0.6 * sm};
  const cam = drift(f, a, K.question, {x: 960, y: 470, z: 1.08}, {x: 972, y: 466, z: 1.14});
  const post = (760 + 30 - 420) / 1.6 - 206;
  return (
    <g>
      <Layer cam={cam} depth={2}>
        <Back id="ud-bk" bg="desk" veil={0.05} dx={-100} dy={300} />
      </Layer>
      <Layer cam={cam} depth={1.08}>
        <Visitor id="ud-v" hx={1330} hy={360} s={1.4} expr={{...vex, gx: -0.75 + 1.5 * door * 0.0}} blink={v.blink} pose={{turn: 0.5, lTv: 120}} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Counter id="ud-c" x0={-900} x1={2900} y={760} depth={70} face={500} top="#E7E3D8" front="#5F8A86" />
        <Shadow cx={600} cy={800} rx={130} ry={12} />
        <RobotSupport id="ud-sup" x={600} y={420} s={1.6} yaw={st.yaw} postLen={post} />
        <Robot id="ud-r" st={st} x={600} y={420} s={1.6} />
      </Layer>
      <Tag x={90} y={1000} text="Possible use: an assistant" k={pr(f, T('assistant') - 0.3, T('assistant') + 0.1)} size={30} />
    </g>
  );
};
// "They also leave us with a question about how much meaning": the visitor, thoughtful
export const UseThought: React.FC<{f: number}> = ({f}) => <VisitorCU id="uq" cam={drift(f, K.question, T('meaning we attach'), {x: 1010, y: 560, z: 1}, {x: 1015, y: 548, z: 1.05})} vis={vis2(f)} turn={0.42} bg="nook" bgDx={-1300} bgDy={60} />;
// "we attach to a well-timed": the robot's small smile
export const UseRobot: React.FC<{f: number}> = ({f}) => <RobotCU id="ur" cam={drift(f, T('meaning we attach'), T('response.'), {x: 930, y: 560, z: 1}, {x: 925, y: 552, z: 1.04})} st={view(rob2(f), 24, 0.62, -0.04)} bg="nook" bgDx={200} bgDy={60} />;
/** the moment the closed notebook's cover lands (the insert), and the cut back to the two-shot after it */
export const CLOSE_CUT = T('response.') + 0.15;
export const CLOSE_IN = T('a well-timed');
// "response.": his hand closes the workbook (insert)
export const UseClose: React.FC<{f: number}> = ({f}) => {
  const cl = pr(f, CLOSE_IN + 0.3, T('response.') - 0.05, e2);
  const W = 900, H = 560, bx = 960, by = 640;
  const cam = drift(f, CLOSE_IN, CLOSE_CUT, {x: 960, y: 560, z: 1}, {x: 960, y: 570, z: 1.04});
  const hx = bx + (W / 2 + 20) * Math.cos(Math.PI * cl);
  const hy = by - 20 - 140 * Math.sin(Math.PI * cl);
  return (
    <g>
      <Layer cam={cam} depth={2}>
        <Back id="uc-bk" bg="nook" veil={0.4} dx={-300} dy={360} s={1.1} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <rect x={-600} y={420} width={3200} height={1200} fill="#D9B48A" />
        <rect x={-600} y={420} width={3200} height={8} fill="#B98A5E" />
        <Workbook x={bx} y={by} w={W} h={H} closed={cl} />
        <HandArm id="uc-h" from={{x: hx + 330, y: hy + 420}} wrist={{x: hx + 60, y: hy + 70}} ang={-135} L={190} pose={{curl: [0.2, 0.3, 0.35, 0.4], spread: 0.3, thumb: 30, thumbCurl: 0.2}} />
      </Layer>
    </g>
  );
};
// the closed notebook on the nook table, framed exactly as the lab two-shot that follows (robot, visitor and
// notebook land on the same screen positions; only the room changes at the cut)
export const UseCloseTwo: React.FC<{f: number}> = ({f}) => <NookTwo id="uk" cam={TWO_A} f={f} book={<Notebook x={1180} y={INT.benchY + 15} rot={-6} />} />;
export {HAND_RELAXED, EXPR_NEUTRAL, VX, clamp, CheekSection};
export type {HandPose};
