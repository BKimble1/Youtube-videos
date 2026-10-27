// V2 overhaul shots: the rebuilt opening (0 - 20.56 s), the mechanism (20.56 - 32.32 s), the mirror montage, the
// people montage, the audio-to-motion path, the final minute and the ending. All states come from state2.ts at the
// absolute frame; shots choose the setup, the camera and the camera angle.
import React from 'react';
import {Head, EXPR_NEUTRAL} from '../dc/Head';
import {INK} from '../dc/ink';
import {clamp, fmt, lerp} from '../dc/math';
import {Bench, Shadow} from '../art/Lab';
import {lipAnchors, Robot, ROBOT_NEUTRAL, RobotState, RobotSupport} from '../art/Robot';
import {UI, Wave} from '../art/Ui';
import {Tag} from './text3';
import {VX} from '../art/Visitor';
import {Cam, camPath, lerpCam, Layer} from '../lib/cam';
import {pr, T} from '../lib/core';
import {humanVis, robotVis, Track, Vis} from '../lib/visemes';
import {MIR, reflectYaw} from '../shots/MirrorSet';
import {K, SONG, SPEECH} from '../state';
import {Counter} from './env';
import {Back, mirrorLayerCam, MirrorSet2, ProfileTwo, RobotCU, VisitorCU} from './sets';
import {CheekSection} from './mech';
import {CAST, CREW_HEAD, CrewChar, VisShape} from './crew';
import {HumanoidBody, OldBot, ShapeMap, SideMech} from './new';
import {humanTrace, Panel, robotTrace} from './props';
import {COPY_DT, END, LIPS_H, MIRROR_TRIALS, MONTAGE, OLDBOT, PRED, rob2, SAMPLE, sampleT, vis2} from './state2';
import {drift, e2, e3} from './shots2';

const view = (st: RobotState, yaw: number, gx?: number, gy?: number): RobotState => ({...st, yaw, gx: gx ?? st.gx, gy: gy ?? st.gy});
const CAM0: Cam = {x: 960, y: 540, z: 1};
const eOut = (x: number) => 1 - (1 - x) * (1 - x);
/** one smooth move through several cameras (evenly spaced in progress, eased once over the whole move) */
export const glide = (f: number, a: number, b: number, ks: Cam[], e: (x: number) => number = e2): Cam => {
  const u = e(clamp((f / 30 - a) / (b - a)));
  const n = ks.length - 1;
  const i = Math.min(n - 1, Math.floor(u * n));
  return lerpCam(ks[i], ks[i + 1], u * n - i);
};
/** a crew member's viseme-driven mouth from a human track */
export const crewVis = (t: number, tr: Track, smile = 0.1): VisShape => {
  const v = humanVis(t, tr, 0.06);
  return {open: v.open, wide: v.wide - 0.2, round: v.wide < 0.8 ? clamp((0.9 - v.wide) * 2.5) : 0, smile: Math.max(smile, v.smile)};
};
const POSE0 = {armL: {a: 8, b: 10}, armR: {a: 8, b: 10}, lean: 0, tilt: 0, lookX: 0, lookY: 0, brows: 0, mouth: 'smile' as const};

// ================================================================== OPENING
/** the opening framing: the face from brows to lips, eyes on the camera (frame 0 and the last frame) */
export const ECU0: Cam = {x: 960, y: 548, z: 2.65};
const R0 = {x: 960, y: 470, s: 3.2};
// 0 - 1.98 "This robot watches for a smile": already moving, eyes on us; the camera draws back and it is a machine
export const A1Ecu: React.FC<{f: number}> = ({f}) => {
  // a slow creep on the close-up through the first second, then one pull back that shows the machine
  const cam = camPath(f, [[0, ECU0], [0.85, {x: 960, y: 552, z: 2.45}], [T('smile before') - 0.05, {x: 960, y: 590, z: 0.98}]], (x) => x * x * (3 - 2 * x));
  return <RobotCU id="a1" cam={cam} st={view(rob2(f), 0, 0, 0)} x={R0.x} y={R0.y} s={R0.s} veil={0.25} bgDx={-200} bgDy={160} />;
};
// 1.98 - 3.92 "a smile before it fully appears": face to face, close; his cue forms, its eyes go to his mouth
export const A2Pair: React.FC<{f: number}> = ({f}) => <ProfileTwo id="a2" cam={drift(f, T('smile before'), T('Then it tries'), {x: 995, y: 455, z: 1.72}, {x: 995, y: 450, z: 1.8})} robot={rob2(f)} vis={vis2(f)} rTurn={64} />;
// 3.92 - 5.10 "Then it tries to smile": one push into its cheek; the skin opens onto the motor beneath
const A3_END = T('tries to smile') + 0.52;
export const A3Under: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 22, 0.62, -0.04);
  const c = lipAnchors(st).find((q) => q.k === 'cornerL')!.p;
  const X = 860, Y = 520, S = 3.1;
  const cx = X + c.x * S - 40, cy = Y + c.y * S - 30;
  const cam = glide(f, T('Then it tries'), A3_END, [{x: 930, y: 560, z: 1}, {x: cx, y: cy, z: 2.6}], e2);
  const k = pr(f, T('Then it tries') + 0.35, T('Then it tries') + 0.85);
  return <RobotCU id="a3" cam={cam} st={st} x={X} y={Y} s={S} cheek={{k, side: -1, r: 1.6}} xray={0.5 * k} xrayDark={0.18} xrayHot={['corner', 'cheek']} />;
};
// 5.10 - 6.40 "at the same time as the person": in section from the side: the motor turns, the linkage pulls the
// skin, the lips change shape
const A4_END = T('person in front') + 0.1;
export const A4Side: React.FC<{f: number}> = ({f}) => {
  const st = rob2(f);
  const cam = drift(f, A3_END, A4_END, {x: 1080, y: 610, z: 1.32}, {x: 1110, y: 640, z: 1.45});
  return (
    <g>
      <Layer cam={cam} depth={2.2}>
        <Back id="a4-bk" bg="lab" veil={0.55} dx={-300} dy={200} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <SideMech id="a4" x={900} y={560} s={1.65} st={st} />
      </Layer>
    </g>
  );
};
// 6.40 - 7.61 "in front of it.": both smiles arrive together
export const A5Shared: React.FC<{f: number}> = ({f}) => <ProfileTwo id="a5" cam={drift(f, A4_END, K.corner, {x: 990, y: 470, z: 1.42}, {x: 990, y: 466, z: 1.5})} robot={rob2(f)} vis={vis2(f)} rTurn={64} />;
// 7.61 - 8.75 "That takes more than moving the corners": a stiffer robot face moves only its corners (illustration)
const A6_END = T('moving the') + 0.25;
export const A6Old: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const grin = pr(f, OLDBOT.grinOn, OLDBOT.grinOn + 0.08, (x) => x) * (1 - pr(f, OLDBOT.grinOff, OLDBOT.grinOff + 0.08, (x) => x));
  const cam = drift(f, K.corner, A6_END, {x: 960, y: 520, z: 1.0}, {x: 960, y: 500, z: 1.12});
  return (
    <g>
      <Layer cam={cam} depth={2.2}>
        <Back id="a6-bk" bg="lab" veil={0.45} dx={500} dy={200} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <rect x={-600} y={1060} width={3200} height={600} fill="#9A6A3E" />
        <rect x={-600} y={1050} width={3200} height={14} fill="#DDA66B" />
        <OldBot x={960} y={420} s={2.0} grin={grin} jaw={0.15 * Math.abs(Math.sin(t * 9)) * grin} />
      </Layer>
      <Tag x={90} y={1000} text="Illustration: a stiffer robot face" k={pr(f, K.corner + 0.1, K.corner + 0.4)} size={26} />
    </g>
  );
};
// 8.75 - 9.62: he flinches at it
const A7_END = T('of a mouth.') - 0.1;
export const A7Recoil: React.FC<{f: number}> = ({f}) => {
  const k = pr(f, A6_END, A6_END + 0.3);
  return <VisitorCU id="a7" cam={drift(f, A6_END, A7_END, {x: 1010, y: 540, z: 1.05}, {x: 1030, y: 540, z: 1.0})} vis={vis2(f)} turn={0.42} pose={{torso: 7 - 7 * k, neck: -4 + 6 * k}} />;
};
// 9.62 - 10.41 "of a mouth.": the soft face: corners, cheeks, lips and skin all move together
export const A8Soft: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 18, 0.6, -0.04);
  return <RobotCU id="a8" cam={drift(f, A7_END, T('Researchers'), {x: 880, y: 640, z: 1.05}, {x: 870, y: 650, z: 1.12})} st={st} x={900} y={430} s={4.2} veil={0.35} grid={0.75} />;
};
// 12.70 - 14.22 "to study their own movements,": the reflection, its tests one after another
export const A10Tests: React.FC<{f: number}> = ({f}) => {
  const c0 = mirrorLayerCam({x: MIR.refl.x, y: MIR.refl.y + 30}, 3.2);
  const c1 = mirrorLayerCam({x: MIR.refl.x, y: MIR.refl.y + 34}, 3.4);
  return <MirrorSet2 id="a10" cam={drift(f, K.mirrorCut, T('copy human'), c0, c1)} st={rob2(f)} reflXray={0.2} reflHot={['corner', 'lip', 'brow']} />;
};
/** a person's mouth, very close, in the cast rig (mouth at screen (960, 560)) */
const CrewMouthCU: React.FC<{id: string; f: number; look: string; tr: Track; bg: 'kitchen' | 'street' | 'office' | 'stage' | 'home'; scale?: number; smile?: number; cam?: Cam; seed?: number}> = ({id, f, look, tr, bg, scale = 6.2, smile = 0.1, cam = CAM0, seed = 3}) => {
  const t = f / 30;
  const y = 560 - CREW_HEAD.mouthY * scale;
  return (
    <g>
      <Layer cam={cam} depth={2.4}>
        <Back id={`${id}-bk`} bg={bg} veil={0.35} dx={-200} dy={100} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <CrewChar id={id} look={CAST[look]} pose={{...POSE0, lookX: 0, lookY: 0}} frame={f} seed={seed} x={960} y={y} scale={scale} life={0.4} eyeDarts={false} vis={crewVis(t, tr, smile)} shadow={false} />
      </Layer>
    </g>
  );
};
// 14.22 - 14.84 "copy human lips": a person's lips
const A11_END = T('copy human') + COPY_DT;
export const A11Lips: React.FC<{f: number}> = ({f}) => <CrewMouthCU id="a11" f={f} look="clerkB" tr={LIPS_H} bg="kitchen" scale={12} cam={drift(f, T('copy human'), A11_END, CAM0, {x: 960, y: 560, z: 1.04})} />;
// 14.84 - 15.55: the same shapes on the robot's lips (the reflection), same place in the frame
export const A12Copy: React.FC<{f: number}> = ({f}) => {
  const c0 = mirrorLayerCam({x: MIR.refl.x - 5, y: MIR.refl.y + 73}, 7.0);
  return <MirrorSet2 id="a12" cam={drift(f, A11_END, PRED.cue, c0, {...c0, z: c0.z * 1.03})} st={rob2(f)} />;
};
/** the visitor's face and the robot's face side by side (no chart) */
const FacePair: React.FC<{id: string; f: number; cam: Cam; robotYaw?: number}> = ({id, f, cam, robotYaw = 16}) => {
  const v = vis2(f);
  const st = view(rob2(f), robotYaw, 0.5, 0);
  return (
    <g>
      <Layer cam={cam} depth={2}>
        <Back id={`${id}-bk`} bg="lab" veil={0.5} dx={-300} dy={140} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Panel id={`${id}-v`} x={70} y={70} w={880} h={940} bg="#EDE4D0">
          <Head id={`${id}-vh`} c={{x: 520, y: 560}} R={300} roll={0} turn={0.3} expr={{...v.expr, gx: -0.7}} blink={v.blink} inkW={9} />
        </Panel>
        <Panel id={`${id}-r`} x={970} y={70} w={880} h={940} bg="#E6E9E4">
          <Robot id={`${id}-rr`} st={st} x={1400} y={520} s={2.9} />
        </Panel>
      </Layer>
    </g>
  );
};
// 15.55 - 17.58 "and predict an expression as it begins.": his cue starts; its smile starts before his is plain
export const A13Predict: React.FC<{f: number}> = ({f}) => <ProfileTwo id="a13" cam={drift(f, PRED.cue, T('And the place'), {x: 995, y: 470, z: 1.62}, {x: 995, y: 464, z: 1.7})} robot={view(rob2(f), 64, 0.6, 0)} vis={vis2(f)} rTurn={64} />;
// 17.58 - 20.56 "And the place to start was a mirror.": back out of the reflection to the whole setup
export const A14Mirror: React.FC<{f: number}> = ({f}) => {
  const c0 = mirrorLayerCam({x: MIR.refl.x, y: MIR.refl.y + 30}, 3.3);
  const cam = glide(f, T('And the place'), K.mirrorWord + 0.25, [c0, {x: 1080, y: 470, z: 1.5}, {x: 920, y: 548, z: 0.93}], e2);
  return <MirrorSet2 id="a14" cam={cam} st={rob2(f)} />;
};

// ================================================================== MECHANISM
// 20.56 - 22.96 "At Columbia University, engineers built a": the camera circles from its profile to its face
export const B1Orbit: React.FC<{f: number}> = ({f}) => {
  const u = e2(clamp((f / 30 - K.columbia) / (T('flexible') - K.columbia)));
  const yaw = lerp(74, 10, u);
  const st = view(rob2(f), yaw, lerp(0.1, 0, u), 0.02);
  return (
    <g>
      <RobotCU id="b1" cam={drift(f, K.columbia, T('flexible'), {x: 930, y: 560, z: 1.05}, {x: 940, y: 540, z: 1.12})} st={st} x={900} y={420} s={2.9} benchY={930} veil={0.12} bgDx={-200 - 600 * u} bgDy={160} bgS={1.0} />
      <Tag x={90} y={110} text="Columbia University" k={pr(f, K.columbia + 0.2, K.columbia + 0.6)} size={30} />
      <Tag x={90} y={170} text="Illustration, not lab footage" k={pr(f, K.columbia + 0.5, K.columbia + 0.9)} size={26} tone="light" />
    </g>
  );
};
// 22.96 - 24.36 "flexible robotic face with": close, the silicone stretching
export const B2Flex: React.FC<{f: number}> = ({f}) => <RobotCU id="b2" cam={drift(f, T('flexible'), T('with twenty-six'), {x: 960, y: 600, z: 1}, {x: 960, y: 620, z: 1.08})} st={view(rob2(f), 0, 0, 0.05)} x={960} y={420} s={4.6} veil={0.4} bgDx={-500} grid={0.5 * pr(f, T('flexible'), T('flexible') + 0.3)} />;
// 24.36 - 27.00 "twenty-six motors. That gives the face ways to move.": the skin turns translucent; the motors under
// it switch on by group as the brows, the smile and the lips move
const HOT_SEQ: [number, string[]][] = [[0, ['corner', 'lip']], [T('twenty-six') + 0.5, ['corner', 'cheek', 'lip', 'brow', 'lid', 'jaw']], [T('That gives') + 0.05, ['brow']], [T('That gives') + 0.45, ['corner', 'cheek']], [T('That gives') + 0.9, ['lip']]];
export const B3Motors: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const xr = 0.35 + 0.65 * pr(f, T('with twenty-six'), T('twenty-six') + 0.45); // already starting on the cut
  const hot = HOT_SEQ.filter(([t0]) => t >= t0).pop()![1];
  const yaw = lerp(0, 24, pr(f, T('That gives') - 0.3, T('That gives') + 0.6));
  return (
    <g>
      <RobotCU id="b3" cam={drift(f, T('with twenty-six'), T('face ways') + 0.3, {x: 960, y: 520, z: 1.02}, {x: 960, y: 530, z: 1.1})} st={view(rob2(f), yaw, 0, 0.05)} x={960} y={420} s={3.6} veil={0.45} bgDx={-500} xray={xr} xrayDark={0.3} xrayHot={hot} />
      <Tag x={90} y={1000} text="26 motors · some of them shown" k={pr(f, T('twenty-six') + 0.2, T('twenty-six') + 0.6)} size={30} />
    </g>
  );
};
// 27.00 - 28.00 "move.": the same thing from the side: a motor turns, a linkage pushes the lips forward
export const B5Side: React.FC<{f: number}> = ({f}) => {
  const cam = drift(f, T('face ways') + 0.3, K.combos, {x: 1110, y: 660, z: 1.5}, {x: 1130, y: 680, z: 1.6});
  return (
    <g>
      <Layer cam={cam} depth={2.2}>
        <Back id="b5-bk" bg="lab" veil={0.55} dx={300} dy={200} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <SideMech id="b5" x={900} y={560} s={1.65} st={rob2(f)} />
      </Layer>
    </g>
  );
};
// 30.56 - 32.32 "create the shapes it needs.": the sections close, the skin is whole again, and it makes distinct faces
export const B7Shapes: React.FC<{f: number}> = ({f}) => {
  const k = 1 - pr(f, T('create the'), T('create the') + 0.35);
  const st = rob2(f);
  return (
    <RobotCU id="b7" cam={drift(f, T('create the'), K.banana, {x: 960, y: 540, z: 1.02}, {x: 960, y: 560, z: 1.08})} st={st} x={960} y={420} s={3.4} veil={0.35} bgDx={-500} xray={k} xrayDark={0.3} xrayHot={['corner', 'lip', 'brow']} cheek={{k, side: -1, r: 1.1}} over={<g transform="translate(960 420) scale(3.4)"><CheekSection id="b7-c2" st={st} k={k} side={1} r={1.1} hot={false} /></g>} />
  );
};

// ================================================================== MIRROR PRACTICE
// 54.71 - 57.28 "It moved its face while watching its reflection,": the reflection, close, its motors showing
export const P2Refl: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const c0 = mirrorLayerCam({x: MIR.refl.x, y: MIR.refl.y + 10}, 2.5);
  const c1 = mirrorLayerCam({x: MIR.refl.x, y: MIR.refl.y + 16}, 2.75);
  // V4: only the motors making the current trial show through the reflection's skin
  const cur = MIRROR_TRIALS.filter(([t0]) => t >= t0 - 0.1).pop();
  const hot = cur ? cur[2] : ['corner'];
  return <MirrorSet2 id="p2" cam={drift(f, T('It moved its face'), T('building a relationship'), c0, c1)} st={rob2(f)} reflXray={0.6 * pr(f, T('It moved its face') + 0.1, T('It moved its face') + 0.4)} reflHot={hot} />;
};
/** the bars for one trial (a fixed pattern per trial) */
const trialBars = (i: number) => Array.from({length: 8}, (_, j) => 0.15 + 0.8 * (((i * 37 + j * 53) % 17) / 17));
// 57.28 - 61.12 "building a relationship between motor commands and the appearance they produced.": a run of trials;
// each face it makes is captured, with the commands that made it, into a growing set
export const P3Montage: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const b = T('building a relationship') + 0.15;
  const st = rob2(f);
  const c0 = mirrorLayerCam({x: MIR.refl.x + 180, y: MIR.refl.y + 40}, 1.75);
  const c1 = mirrorLayerCam({x: MIR.refl.x + 200, y: MIR.refl.y + 40}, 1.82);
  const shots = MONTAGE.slice(0, 6).map(([d, v], i) => ({i, t0: b + d + 0.38, v}));
  const flash = shots.reduce((a, s) => Math.max(a, clamp(1 - Math.abs(t - s.t0) / 0.1)), 0);
  return (
    <g>
      <MirrorSet2 id="p3" cam={drift(f, T('building a relationship'), K.moveThese, c0, c1)} st={st} reflExtra={flash > 0 ? <circle cx={0} cy={0} r={130} fill="#FFFFFF" opacity={0.3 * flash} /> : null} />
      {shots.map((s) => {
        const k = e3(clamp((t - s.t0) / 0.32));
        if (k <= 0) return null;
        const slot = {x: 1330 + (s.i % 2) * 280, y: 110 + Math.floor(s.i / 2) * 300};
        const from = {x: 760, y: 470};
        const x = lerp(from.x, slot.x, k), y = lerp(from.y, slot.y, k), sc = lerp(1.4, 1, k);
        const face: RobotState = {...ROBOT_NEUTRAL, ...s.v, yaw: 0};
        const bars = trialBars(s.i);
        return (
          <g key={s.i} transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(sc)}) rotate(${fmt((s.i % 2 ? 3 : -3) * k)})`}>
            <rect x={-6} y={-6} width={252} height={272} rx={10} fill="#000" opacity={0.18} />
            <rect x={-12} y={-12} width={252} height={272} rx={10} fill={UI.paper} stroke={INK} strokeWidth={3} />
            <defs>
              <clipPath id={`p3-c${s.i}`}>
                <rect x={0} y={0} width={228} height={180} rx={6} />
              </clipPath>
            </defs>
            <rect x={0} y={0} width={228} height={180} rx={6} fill="#C9D3D2" />
            <g clipPath={`url(#p3-c${s.i})`}>
              <Robot id={`p3-r${s.i}`} st={face} x={114} y={70} s={0.95} />
            </g>
            {bars.map((v, j) => (
              <rect key={j} x={8 + j * 27} y={fmt(246 - 52 * v)} width={18} height={fmt(52 * v)} rx={3} fill={UI.blue} />
            ))}
          </g>
        );
      })}
      <Tag x={1610} y={1040} text="motor commands → the face they made" k={pr(f, T('motor commands') - 0.1, T('motor commands') + 0.3)} size={28} anchor="middle" tone="light" />
    </g>
  );
};
// 61.12 - 63.41 "Move these motors, get this mouth shape.": the reflected mouth, very close, the motors under it
export const P4Lips: React.FC<{f: number}> = ({f}) => {
  const c0 = mirrorLayerCam({x: MIR.refl.x - 6, y: MIR.refl.y + 74}, 7.6);
  const c1 = mirrorLayerCam({x: MIR.refl.x - 6, y: MIR.refl.y + 74}, 8.0);
  const xr = pr(f, K.moveThese, K.moveThese + 0.3) * (1 - pr(f, T('get this') + 0.2, T('get this') + 0.5));
  return <MirrorSet2 id="p4" cam={drift(f, K.moveThese, K.change, c0, c1)} st={rob2(f)} reflXray={xr} reflHot={['corner', 'cheek', 'lip']} />;
};
// 63.41 - 65.75 "Change the combination, get another.": a new combination; then the camera goes into the
// reflection's cheek (the skin fills the frame: the next scene is that skin, in section)
export const P5Into: React.FC<{f: number}> = ({f}) => {
  const st = rob2(f);
  const rs = {...st, yaw: reflectYaw(st.yaw)};
  const ck = lipAnchors(rs).find((q) => q.k === 'cheekR')!.p;
  const cheek = {x: MIR.refl.x - ck.x * MIR.refl.s, y: MIR.refl.y + ck.y * MIR.refl.s};
  const cam = camPath(
    f,
    [
      [K.change, mirrorLayerCam({x: MIR.refl.x, y: MIR.refl.y + 30}, 2.6)],
      [K.skin - 0.75, mirrorLayerCam({x: MIR.refl.x, y: MIR.refl.y + 40}, 2.75)],
      [K.skin, mirrorLayerCam(cheek, 30)],
    ],
    e3,
  );
  return <MirrorSet2 id="p5" cam={cam} st={st} reflXray={0.6 * (1 - pr(f, K.skin - 0.75, K.skin - 0.4))} reflHot={['corner', 'lip']} />;
};

// ================================================================== LEARNING FROM PEOPLE
/** a cast member talking in their own setting (medium close-up, head and shoulders) */
export const CrewTalk: React.FC<{id: string; f: number; look: string; bg: 'kitchen' | 'street' | 'office' | 'stage' | 'home'; tr: Track; cam: Cam; scale?: number; x?: number; lookX?: number; tilt?: number; sing?: boolean; seed?: number; fore?: React.ReactNode}> = ({id, f, look, bg, tr, cam, scale = 3.1, x = 960, lookX = 0, tilt = 0, sing = false, seed = 5, fore}) => {
  const t = f / 30;
  const y = 430 - CREW_HEAD.y * scale;
  const v = sing ? {open: 0.35 + 0.35 * Math.abs(Math.sin(t * 2.1)), wide: 0.6, round: 0.7, smile: 0.1} : crewVis(t, tr, 0.12);
  return (
    <g>
      <Layer cam={cam} depth={2.4}>
        <Back id={`${id}-bk`} bg={bg} veil={0.18} dx={-150} dy={140} />
      </Layer>
      <Layer cam={cam} depth={1}>
        {(() => {
          // V5: speakers move while they talk: a hand rises on stressed syllables, the head tilts and nods, the
          // weight shifts; singers open their arms (all from the speech track, so it is in time with the mouth)
          const ph = t * (1.3 + (seed % 5) * 0.17) + seed;
          const em = Math.max(0, v.open - 0.25) * 1.6;
          const g = 0.5 + 0.5 * Math.sin(ph * 0.9);
          const armR = sing ? {a: 38 + 10 * Math.sin(t * 1.4), b: 40 + 12 * Math.sin(t * 1.1)} : {a: 12 + 26 * g + 14 * em, b: 30 + 70 * g + 20 * em};
          const armL = sing ? {a: 38 + 10 * Math.sin(t * 1.4 + 1), b: 40 + 12 * Math.sin(t * 1.1 + 1)} : {a: 10 + 8 * Math.sin(ph * 0.5), b: 14 + 18 * Math.max(0, Math.sin(ph * 0.5 + 1))};
          const pose = {...POSE0, lookX: lookX + 0.15 * Math.sin(ph * 0.37), tilt: tilt + 4 * Math.sin(ph * 0.6) + 3 * em, lean: 2.2 * Math.sin(ph * 0.31), brows: (sing ? 0.6 : 0.2) + 0.35 * em, blink: sing ? 0.25 : undefined, armL, armR};
          return <CrewChar id={id} look={CAST[look]} pose={pose} frame={f} seed={seed} x={x} y={y} scale={scale} life={0.8} vis={v} shadow={false} />;
        })()}
        {fore}
      </Layer>
    </g>
  );
};
const talk = (a: number, b: number, seed: number) => SPEECH(a, b, seed);
// 82.20 - 82.91 "People.": on the screen, people, one after another
export const T3People: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const who = t < K.people + 0.36 ? 'clerkC' : 'host';
  return <CrewTalk id="t3" f={f} look={who} bg={who === 'clerkC' ? 'kitchen' : 'office'} tr={talk(K.people - 0.1, K.study26, 7)} cam={drift(f, K.people, K.study26, CAM0, {x: 960, y: 540, z: 1.03})} />;
};
/** the moment the push into the alcove screen hands over to the screen's own scene */
export const T4_IN = T('January 2026,') - 0.3;
export const T4_TRACK = SPEECH(T('In the lip-sync') - 1, T('the system learned'), 13);
export const T4_CAM0: Cam = {x: 960, y: 540, z: 1.25};
// 84.40 - 86.26: the screen's scene, full frame: a person speaking close to the camera
export const T4Full: React.FC<{f: number}> = ({f}) => (
  <g>
    <CrewTalk id="t4f" f={f} look="honest" bg="office" tr={T4_TRACK} cam={drift(f, T4_IN, T('the system learned'), T4_CAM0, {x: 960, y: 540, z: 1.32})} scale={3.4} />
    <Tag x={90} y={110} text="Lip-sync study · Science Robotics · January 2026" k={1} size={30} />
  </g>
);
// 86.26 - 87.35 "the system learned from": a profile, lips moving (another person, same channel rig as the visitor)
const PROF_TRACK = talk(T('the system learned') - 0.2, T('videos of humans') + 0.6, 21);
export const T5Profile: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const hv = humanVis(t, PROF_TRACK, 0.06);
  const cam = drift(f, T('the system learned'), T('videos of humans'), CAM0, {x: 990, y: 540, z: 1.04});
  return (
    <g>
      <Layer cam={cam} depth={2.4}>
        <Back id="t5-bk" bg="street" veil={0.25} dx={-300} dy={140} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Head id="t5-h" c={{x: 1060, y: 520}} R={330} roll={0} turn={1} expr={{...EXPR_NEUTRAL, ...hv, smile: 0.15, gx: -0.9, gy: 0, lid: 0.1}} skin="#E0A982" hair="#3B2A22" hat={{color: '#B4483C', band: '#943A31'}} inkW={9} />
      </Layer>
    </g>
  );
};
// 87.35 - 88.79 "videos of humans talking": a third person talking, in a kitchen; then mouths
export const T6Talk: React.FC<{f: number}> = ({f}) => <CrewTalk id="t6" f={f} look="clerkC" bg="kitchen" tr={talk(T('videos of humans') - 0.3, T('singing,'), 31)} cam={drift(f, T('videos of humans'), T('singing,'), {x: 930, y: 560, z: 1.05}, {x: 950, y: 550, z: 1.1})} lookX={0.4} tilt={-4} />;
// 88.79 - 89.76 "and singing,": someone singing on a small stage, a microphone at the lips
export const T8Sing: React.FC<{f: number}> = ({f}) => (
  <CrewTalk
    id="t8"
    f={f}
    look="person"
    bg="stage"
    tr={[[0, 'rest']]}
    cam={drift(f, T('singing,'), K.youtube, {x: 960, y: 560, z: 1.1}, {x: 960, y: 540, z: 1.22})}
    sing
    tilt={6}
    fore={
      <g>
        <path d="M1120,1200 L1120,860 L1060,800" fill="none" stroke="#2B333C" strokeWidth={16} strokeLinecap="round" />
        <rect x={1020} y={740} width={56} height={96} rx={28} fill="#3E4652" stroke={INK} strokeWidth={4} transform="rotate(-40 1048 788)" />
      </g>
    }
  />
);
/** the human sample mouth, a cast member's (the same track throughout training) */
const SampleCrew: React.FC<{id: string; f: number; cam: Cam}> = ({id, f, cam}) => {
  const t = f / 30;
  const v = humanVis(sampleT(t), SAMPLE, 0.06);
  const scale = 11;
  const y = 580 - CREW_HEAD.mouthY * scale;
  return (
    <g>
      <Layer cam={cam} depth={2.4}>
        <Back id={`${id}-bk`} bg="office" veil={0.4} dx={-200} dy={100} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <CrewChar id={id} look={CAST.person} pose={{...POSE0}} frame={f} seed={9} x={960} y={y} scale={scale} life={0.3} eyeDarts={false} vis={{open: v.open, wide: v.wide - 0.2, round: v.wide < 0.8 ? clamp((0.9 - v.wide) * 2.5) : 0, smile: Math.max(0.1, v.smile)}} shadow={false} />
      </Layer>
    </g>
  );
};
// 96.36 - 97.87 "The researchers linked that": the person's lips, very close
export const T11Human: React.FC<{f: number}> = ({f}) => <SampleCrew id="t11" f={f} cam={drift(f, K.linked, T('robot’s model'), CAM0, {x: 960, y: 560, z: 1.05})} />;
// 97.87 - 100.0 "to the robot's model of its own face.": the robot's lips in the same place, making the same shapes
export const T12Robot: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 0, 0, 0.05);
  const s = 7.2;
  return <RobotCU id="t12" cam={drift(f, T('robot’s model'), K.speechAudio, CAM0, {x: 960, y: 560, z: 1.05})} st={st} x={960} y={560 - 72 * s} s={s} veil={0.45} bg="alcove" bgDx={0} bgDy={300} />;
};
// 100.0 - 102.83 "Speech audio could then drive coordinated lip movements": one move along the signal: a person
// speaks; the sound becomes a trace; the trace lights the matching shape in the robot's learned map; a cable carries
// it to the motors; the motors move the lips
const SP = {person: 380, wave0: 640, wave1: 1640, map: 1780, mapW: 760, side: 3300};
export const E1Path: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = rob2(f);
  const ss = sampleT(t);
  const hv = humanVis(ss, SAMPLE, 0.06);
  const curVis = ((): Vis => {
    let v: Vis = 'rest';
    for (const [tt, vv] of SAMPLE) if (ss >= tt) v = vv;
    return v === 'rest' ? 'N' : v;
  })();
  const cam = glide(f, K.speechAudio, T('through the motors.'), [
    {x: 560, y: 520, z: 1.3},
    {x: 1150, y: 540, z: 1.12},
    {x: 2160, y: 540, z: 1.12},
    {x: 2900, y: 560, z: 1.1},
    {x: 3420, y: 600, z: 1.45},
    {x: 3560, y: 680, z: 2.0},
  ], (x) => x * x * (3 - 2 * x));
  const wave = humanTrace(SAMPLE);
  const pulseX = SP.wave0 + ((t * 700) % (SP.side - SP.wave0));
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#2B333C" />
      <Layer cam={cam} depth={1.8}>
        <rect x={-1000} y={-600} width={7000} height={2400} fill="#33404A" />
        {Array.from({length: 30}, (_, i) => <rect key={i} x={-1000 + i * 240} y={-600} width={4} height={2400} fill="#3B4A55" />)}
      </Layer>
      <Layer cam={cam} depth={1}>
        {/* the speaker */}
        <CrewChar id="e1-p" look={CAST.person} pose={{...POSE0, lookX: 0.6}} frame={f} seed={9} x={SP.person} y={540 - CREW_HEAD.y * 2.4 - 60} scale={2.4} life={0.4} eyeDarts={false} vis={{open: hv.open, wide: hv.wide - 0.2, round: hv.wide < 0.8 ? clamp((0.9 - hv.wide) * 2.5) : 0, smile: Math.max(0.1, hv.smile)}} shadow={false} />
        {/* the sound as a trace */}
        <rect x={SP.wave0 - 20} y={440} width={SP.wave1 - SP.wave0 + 40} height={200} rx={30} fill="#141B22" />
        <Wave x={SP.wave0} y={540} w={SP.wave1 - SP.wave0} h={80} t0={ss - 2.2} t1={ss} fn={(tt) => wave(((tt % 3.4) + 3.4) % 3.4)} color="#58B6AE" />
        {/* the learned map */}
        <ShapeMap id="e1-m" x={SP.map} y={330} w={SP.mapW} h={420} cur={curVis} />
        {/* the cable to the motors */}
        <path d={`M${SP.map + SP.mapW},540 C${SP.map + SP.mapW + 200},540 ${SP.side - 500},620 ${SP.side - 160},620`} fill="none" stroke="#1E242C" strokeWidth={16} strokeLinecap="round" />
        <circle cx={fmt(Math.min(pulseX, SP.side - 160))} cy={pulseX < SP.wave1 ? 540 : pulseX < SP.map + SP.mapW ? 540 : 590} r={16} fill={UI.amber} opacity={0.85} />
        {/* the motors, the skin, the lips (in section) */}
        <SideMech id="e1-s" x={SP.side} y={560} s={1.25} st={st} />
      </Layer>
      <Tag x={960} y={1010} text="Illustration: speech → learned mouth shapes → motors → lips" k={pr(f, K.speechAudio + 0.2, K.speechAudio + 0.6)} size={26} anchor="middle" />
    </g>
  );
};
// 102.83 - 104.03 "through the motors.": the robot, its lips moving with that speech
export const E2Robot: React.FC<{f: number}> = ({f}) => <RobotCU id="e2" cam={drift(f, T('through the motors.'), K.result, {x: 900, y: 560, z: 1.15}, {x: 900, y: 556, z: 1.2})} st={view(rob2(f), 30, 0.5, 0.05)} x={820} y={460} s={2.9} bg="alcove" bgDx={0} bgDy={250} veil={0.2} />;

// ================================================================== FINAL MINUTE
/** a person's mouth, very close (the visitor's rig), for the smile match */
const VisMouth: React.FC<{f: number; cam: Cam}> = ({f, cam}) => {
  const v = vis2(f);
  const R = 900, turn = 0.35;
  const m = {x: -36 * turn * (R / 100), y: 54 * (R / 100)};
  return (
    <g>
      <Layer cam={cam} depth={2.4}>
        <Back id="g1-bk" bg="lobby" veil={0.5} dx={-1200} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Head id="g1-h" c={{x: 960 - m.x, y: 600 - m.y}} R={R} roll={0} turn={turn} expr={v.expr} blink={v.blink} inkW={26} />
      </Layer>
    </g>
  );
};
// 176.72 - 177.84 "Enough to turn a delayed": his smile, very close
export const G1Mouth: React.FC<{f: number}> = ({f}) => <VisMouth f={f} cam={drift(f, K.enough, T('copy into'), CAM0, {x: 960, y: 590, z: 1.05})} />;
// 177.84 - 178.72 "copy into a": its smile in the same place in the frame
export const G2Mouth: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 20, 0.6, 0);
  const s = 6.4;
  return <RobotCU id="g2" bg="lobby" cam={drift(f, T('copy into'), T('shared-looking'), CAM0, {x: 960, y: 590, z: 1.05})} st={st} x={960} y={600 - 72 * s} s={s} veil={0.45} bgDx={-500} />;
};
// 178.72 - 180.90 "shared-looking moment.": both of them, face to face
export const G3Pair: React.FC<{f: number}> = ({f}) => <ProfileTwo id="g3" cam={drift(f, T('shared-looking'), K.these, {x: 990, y: 470, z: 1.5}, {x: 990, y: 462, z: 1.62})} robot={rob2(f)} vis={vis2(f)} rTurn={62} />;
// 183.19 - 186.98 "A successful smile doesn't tell us whether a machine feels happy.": the smile, then what is under it
export const G5Under: React.FC<{f: number}> = ({f}) => {
  const xr = pr(f, T('tell us whether') - 0.2, T('tell us whether') + 0.5);
  const st = view(rob2(f), 0, 0, 0.02);
  return <RobotCU id="g5" bg="testbay" cam={drift(f, T('A successful'), K.picture, {x: 960, y: 620, z: 1.25}, {x: 960, y: 560, z: 1.02})} st={st} x={960} y={420} s={3.6} veil={0.45} bgDx={-500} xray={xr} xrayDark={0.32} xrayHot={['corner', 'cheek']} />;
};
/** a station kiosk with the research head on it */
const Kiosk: React.FC<{id: string; x: number; y: number; s: number; st: RobotState}> = ({id, x, y, s, st}) => (
  <g>
    <rect x={x - 130 * s} y={y + 150 * s} width={260 * s} height={420 * s} rx={20 * s} fill="#E4E7EA" stroke={INK} strokeWidth={5} />
    <rect x={x - 100 * s} y={y + 190 * s} width={200 * s} height={120 * s} rx={10 * s} fill="#2B333C" />
    <RobotSupport id={`${id}-s`} x={x} y={y} s={s} yaw={st.yaw} postLen={0} />
    <Robot id={`${id}-r`} st={st} x={x} y={y} s={s} />
  </g>
);
// 186.98 - 189.25 "But picture the possible interaction.": an imagined concourse where such faces are ordinary
export const H1Station: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const cam = drift(f, K.picture, K.speaking, {x: 820, y: 520, z: 1.0}, {x: 1120, y: 520, z: 1.06});
  const st0 = rob2(f);
  const k1 = {...ROBOT_NEUTRAL, yaw: 30, gx: 0.6, smile: 0.2 + 0.7 * pr(f, T('possible') - 0.2, T('possible') + 0.4), blink: st0.blink};
  const k2 = {...ROBOT_NEUTRAL, yaw: -28, gx: -0.6, ...robotVis(t, SPEECH(K.picture, K.speaking + 1, 41), 0.06)};
  return (
    <g>
      <Layer cam={cam} depth={2.2}>
        <Back id="h1-bk" bg="station" veil={0.05} dx={0} dy={100} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <Kiosk id="h1-k1" x={520} y={430} s={1.3} st={k1} />
        <Kiosk id="h1-k2" x={1540} y={430} s={1.3} st={k2} />
        {/* one talks with the left kiosk, gesturing; the other asks the right kiosk, then turns, smiling, to her friend */}
        <CrewChar id="h1-c1" look={CAST.clerkC} pose={{...POSE0, lookX: -0.6, brows: 0.3, armL: {a: 30 + 18 * Math.sin(t * 3.1), b: 60 + 25 * Math.sin(t * 3.1 + 0.8)}, mouth: 'talk'}} frame={f} seed={21} x={820} y={1080} scale={1.35} />
        <CrewChar id="h1-c2" look={CAST.checker} pose={{...POSE0, lookX: lerp(0.7, -0.6, pr(f, K.picture + 1.2, K.picture + 1.6)), mouth: t < K.picture + 1.3 ? 'talk' : 'smile', tilt: -4 * pr(f, K.picture + 1.2, K.picture + 1.6), armR: {a: 8 + 40 * pr(f, K.picture + 0.2, K.picture + 0.6) * (1 - pr(f, K.picture + 1.1, K.picture + 1.5)), b: 10 + 70 * pr(f, K.picture + 0.2, K.picture + 0.6) * (1 - pr(f, K.picture + 1.1, K.picture + 1.5))}}} frame={f} seed={23} x={1250} y={1080} scale={1.35} />
      </Layer>
      <Tag x={90} y={110} text="Possible future · illustration" k={pr(f, K.picture + 0.2, K.picture + 0.6)} size={30} />
    </g>
  );
};
// 189.25 - 190.34 "You're speaking.": at home, talking to it
export const H2Speak: React.FC<{f: number}> = ({f}) => <VisitorCU id="h2" cam={drift(f, K.speaking, T('A machine looks'), {x: 1010, y: 560, z: 1}, {x: 1015, y: 552, z: 1.04})} vis={vis2(f)} turn={0.42} bg="home" bgDx={-1100} bgDy={60} />;
// 190.34 - 191.99 "A machine looks toward you.": the companion head lifts its gaze to him
export const H3Look: React.FC<{f: number}> = ({f}) => <RobotCU id="h3" cam={drift(f, T('A machine looks'), T('Its mouth follows'), {x: 930, y: 560, z: 1}, {x: 925, y: 548, z: 1.06})} st={view(rob2(f), rob2(f).yaw - 18)} bg="home" bgDx={300} bgDy={60} veil={0.15} />;
// 191.99 - 193.67 "Its mouth follows its voice,": eyes and lips, very close; its own voice as a trace
const VOICE = SPEECH(T('Its mouth follows') - 0.2, T('and its expression') + 0.4, 23);
const voiceTr = robotTrace(VOICE);
export const H4Lips: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = view(rob2(f), 6, 0.2, 0);
  return (
    <g>
      <RobotCU id="h4" cam={glide(f, T('Its mouth follows'), T('and its expression'), [{x: 960, y: 420, z: 1.1}, {x: 960, y: 700, z: 1.1}])} st={st} x={960} y={300} s={6.2} veil={0.45} bg="home" bgDx={-200} bgDy={60} />
    </g>
  );
};
// 193.67 - 194.98 "and its expression changes": his smile
export const H5His: React.FC<{f: number}> = ({f}) => <VisitorCU id="h5" cam={drift(f, T('and its expression'), T('as yours does.'), {x: 1010, y: 520, z: 1.1}, {x: 1015, y: 512, z: 1.14})} vis={vis2(f)} turn={0.42} bg="home" bgDx={-1100} bgDy={60} />;
// 194.98 - 196.18 "as yours does.": its smile, the same size in the frame
export const H6Its: React.FC<{f: number}> = ({f}) => <RobotCU id="h6" cam={drift(f, T('as yours does.'), K.tutor, {x: 930, y: 520, z: 1.1}, {x: 925, y: 512, z: 1.14})} st={view(rob2(f), 24, 0.62, -0.04)} bg="home" bgDx={300} bgDy={60} veil={0.15} />;
// 201.40 - 203.62 "They also leave us with a question about how much meaning": he leans in to read a humanoid's face
export const H8Read: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 30, 0.55, 0);
  const v = vis2(f);
  const lean = pr(f, K.question + 0.2, K.question + 1.2);
  const cam = drift(f, K.question, T('meaning we attach'), {x: 960, y: 470, z: 1.02}, {x: 990, y: 450, z: 1.12});
  return (
    <g>
      <Layer cam={cam} depth={2.2}>
        <Back id="h8-bk" bg="office" veil={0.08} dx={-100} dy={160} />
      </Layer>
      <Layer cam={cam} depth={1.04}>
        <VisitorCU id="h8-v" cam={CAM0} vis={{expr: {...v.expr, lid: 0.32, squint: 0.3, browIn: 0.45, gx: -0.75}, blink: v.blink}} turn={0.5} hx={1400} hy={440} s={1.9} bg="none" pose={{torso: 7 + 12 * lean, neck: -4 - 6 * lean}} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <HumanoidBody x={600} y={560} s={1.15} armR={-6} />
        <Robot id="h8-r" st={st} x={600} y={330} s={1.6} />
      </Layer>
      <Tag x={90} y={1000} text="Possible future · illustration" k={1} size={26} />
    </g>
  );
};
// 203.62 - 206.50 "we attach to a well-timed response.": its well-timed smile; one push in to the opening's framing
export const H9Timed: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), lerp(30, 0, pr(f, T('response.') - 0.3, K.again - 0.2)), lerp(0.55, 0, pr(f, T('response.') - 0.3, K.again - 0.2)), 0);
  const cam = glide(f, T('meaning we attach'), K.again, [{x: 900, y: 440, z: 0.95}, {x: 940, y: 520, z: 1.5}, {...ECU0, y: ECU0.y - (R0.y - 400)}], e2);
  return (
    <g>
      <Layer cam={cam} depth={2.2}>
        <Back id="h9-bk" bg="office" veil={0.2} dx={-100} dy={160} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <HumanoidBody x={960} y={400 + 230} s={1.38} />
        <Robot id="h9-r" st={st} x={960} y={400} s={R0.s} />
      </Layer>
    </g>
  );
};

// ================================================================== ENDING
// 206.50 - 208.09 "Watch the smile again.": the research head, to the camera, its smile forming
export const Z1Smile: React.FC<{f: number}> = ({f}) => <RobotCU id="z1" cam={drift(f, K.again, K.learned, ECU0, {x: 960, y: 590, z: 2.2})} st={view(rob2(f), 0, 0, 0)} x={R0.x} y={R0.y} s={R0.s} veil={0.25} bgDx={-200} bgDy={160} />;
// 208.09 - 209.98 "The robot has learned a movement.": the person it smiled with
export const Z2Him: React.FC<{f: number}> = ({f}) => <VisitorCU id="z2" cam={drift(f, K.learned, K.deciding, {x: 1010, y: 560, z: 1}, {x: 1020, y: 545, z: 1.05})} vis={vis2(f)} turn={0.42} />;
// 209.98 - end "You're the one deciding what it means.": back to it, looking at us; it settles, its brows lift a
// little, and its lips part into the shape of frame 0 as the camera arrives at the frame-0 framing
export const Z3Loop: React.FC<{f: number}> = ({f}) => <RobotCU id="z3" cam={glide(f, K.deciding, END, [{x: 960, y: 590, z: 1.15}, {x: 960, y: 580, z: 1.8}, ECU0], e2)} st={view(rob2(f), 0, 0, 0)} x={R0.x} y={R0.y} s={R0.s} veil={0.25} bgDx={-200} bgDy={160} />;
export {Bench, Counter, Shadow, SONG, VX};
// "sock puppet.": his deadpan look at the pair
export const U5Look: React.FC<{f: number}> = ({f}) => <VisitorCU id="u5b" cam={drift(f, T('puppet.') + 0.1, K.follow, {x: 1010, y: 540, z: 1.12}, {x: 1015, y: 535, z: 1.16})} vis={vis2(f)} turn={0.42} />;

// 112.33 - 115.48 "The meaning of those words wasn't required for the lip movements.": its lips keep time with a
// language neither of them speaks; he plainly doesn't follow it either
export const R4Puzzled: React.FC<{f: number}> = ({f}) => (
  <g>
    <ProfileTwo id="r4p" cam={drift(f, K.meaning, K.distinction, {x: 990, y: 480, z: 1.45}, {x: 990, y: 474, z: 1.52})} robot={rob2(f)} vis={vis2(f)} rTurn={62} />
    <Tag x={960} y={1010} text="its lips follow the sound, not the meaning" k={pr(f, T('wasn’t required') - 0.2, T('wasn’t required') + 0.2)} size={30} anchor="middle" tone="light" />
  </g>
);
