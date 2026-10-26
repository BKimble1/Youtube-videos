// V2 shots, part 1: the opening (0 - 20.56 s) and the callback (206.5 s - end).
// Every shot reads the shared states (state2.ts) at the absolute frame; a shot only chooses the setup, the camera and
// the camera angle on the subject.
import React from 'react';
import {Notebook} from '../art/Lab';
import {RobotState} from '../art/Robot';
import {Tag} from './text3';
import {Cam, camPath} from '../lib/cam';
import {pr, T} from '../lib/core';
import {INT} from '../shots/IntSet';
import {MIR, reflectYaw} from '../shots/MirrorSet';
import {K} from '../state';
import {LabTwo, mirrorLayerCam, MirrorSet2, ProfileTwo, RobotCU, VisitorCU} from './sets';
import {END, rob2, vis2} from './state2';

export const e2 = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const e3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** a gentle constant-speed push between two cameras over [a, b] (linear in log-zoom; no ease-out bounce) */
export const drift = (f: number, a: number, b: number, c0: Cam, c1: Cam) => camPath(f, [[a, c0], [b, c1]], (x) => x);
const view = (st: RobotState, yaw: number, gx?: number, gy?: number): RobotState => ({...st, yaw, gx: gx ?? st.gx, gy: gy ?? st.gy});

// ------------------------------------------------------------------ the lab two-shot (opening frame = callback frame)
export const TWO_A: Cam = {x: 990, y: 440, z: 1.78};
export const TWO_B: Cam = {x: 992, y: 434, z: 1.86};
const NB = <Notebook x={1180} y={INT.benchY + 15} rot={-6} />;
export const OpenTwo: React.FC<{f: number}> = ({f}) => <LabTwo id="o1" cam={drift(f, 0, T('smile before'), TWO_A, TWO_B)} robot={rob2(f)} vis={vis2(f)} onBench={NB} />;

// the visitor's cue, close: the camera sits on the robot's side of the line, so he is a little more frontal
export const OpenVisCU: React.FC<{f: number}> = ({f}) => <VisitorCU id="o2" cam={drift(f, T('smile before'), T('Then it tries'), {x: 1010, y: 560, z: 1}, {x: 1020, y: 545, z: 1.05})} vis={vis2(f)} turn={0.42} />;

// the robot's response, close: camera on the visitor's side, the robot a little more frontal than in the two-shot
export const OpenRobCU: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 24, 0.62, -0.04);
  return <RobotCU id="o3" cam={drift(f, T('Then it tries'), T('same time'), {x: 930, y: 560, z: 1}, {x: 920, y: 548, z: 1.05})} st={st} />;
};

// shared smile: the profile two-shot (perpendicular to the axis), both faces level and large
export const OpenProfile: React.FC<{f: number}> = ({f}) => <ProfileTwo id="o4" cam={drift(f, T('same time'), K.corner, {x: 990, y: 500, z: 1.4}, {x: 990, y: 494, z: 1.46})} robot={rob2(f)} vis={vis2(f)} />;

// "That takes more than moving the corners of a mouth": the near corner opens into a local section; the corner
// relaxes and lifts again and the servo, rod and skin move as one chain
export const OpenCheek: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 16, 0.6, -0.04);
  const k = pr(f, K.corner + 0.15, K.corner + 0.65);
  const cam = drift(f, K.corner, T('Researchers'), {x: 760, y: 700, z: 1.0}, {x: 750, y: 712, z: 1.06});
  return (
    <g>
      <RobotCU id="o5" cam={cam} st={st} x={900} y={420} s={5.2} cheek={{k, side: -1, r: 1.25}} veil={0.4} />
      <Tag x={90} y={980} text="Illustration · a few of the face's motors" k={pr(f, K.corner + 0.6, K.corner + 1.0)} size={26} />
    </g>
  );
};

// ------------------------------------------------------------------ the mirror
/** the reflected head centre in mirror-layer coordinates */
const RHEAD = {x: MIR.refl.x, y: MIR.refl.y};
// "Researchers have been teaching robotic faces ...": behind the robot, the mirror's frame slides past and the
// reflection is revealed (one lateral move with parallax: the robot is nearer than the glass)
export const MirTruck: React.FC<{f: number}> = ({f}) => {
  const cam = camPath(
    f,
    [
      [T('Researchers'), {x: 420, y: 470, z: 1.62}],
      [K.mirrorCut - 0.1, {x: 1060, y: 440, z: 1.5}],
      [T('copy human'), {x: 1080, y: 436, z: 1.53}],
    ],
    e3,
  );
  return (
    <g>
      <MirrorSet2 id="m1" cam={cam} st={rob2(f)} />
      <Tag x={90} y={1000} text="Illustration" k={pr(f, T('Researchers') + 0.3, T('Researchers') + 0.7)} size={26} />
    </g>
  );
};
// the reflection, close: lips open and round on "copy human lips", the corners rise on "predict"
export const MirReflCU: React.FC<{f: number}> = ({f}) => {
  const c0 = mirrorLayerCam({x: RHEAD.x, y: RHEAD.y + 34}, 3.2);
  const c1 = mirrorLayerCam({x: RHEAD.x, y: RHEAD.y + 40}, 3.4);
  return <MirrorSet2 id="m2" cam={drift(f, T('copy human'), T('And the place'), c0, c1)} st={rob2(f)} />;
};
// "And the place to start was a mirror.": the whole setup, from further back (stand, bench, room)
export const MirWide: React.FC<{f: number}> = ({f}) => <MirrorSet2 id="m3" cam={drift(f, T('And the place'), K.columbia, {x: 900, y: 560, z: 0.9}, {x: 920, y: 548, z: 0.95})} st={rob2(f)} />;

// ------------------------------------------------------------------ the callback
export const CbTwo: React.FC<{f: number}> = ({f}) => <LabTwo id="c1" cam={drift(f, K.again, K.learned, TWO_A, TWO_B)} robot={rob2(f)} vis={vis2(f)} onBench={NB} />;
export const CbRobCU: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 24, 0.62, -0.04);
  return <RobotCU id="c2" cam={drift(f, K.learned, K.deciding, {x: 930, y: 560, z: 1}, {x: 920, y: 548, z: 1.05})} st={st} />;
};
export const CbVisCU: React.FC<{f: number}> = ({f}) => <VisitorCU id="c3" cam={drift(f, K.deciding, END, {x: 1010, y: 560, z: 1}, {x: 1030, y: 530, z: 1.1})} vis={vis2(f)} turn={0.42} />;
export {reflectYaw};
