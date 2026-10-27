// V3 shots: the continuous opening (0 - 10.41 s), the skin deformation cutaway, the actuator close-ups, the footage
// stream the robot watches, the one training example, the late smile's reaction, and the frame grade (vignette +
// per-section light) that gives every shot depth without a new background.
import React from 'react';
import {Head} from '../dc/Head';
import {clamp, fmt, lerp} from '../dc/math';
import {lipAnchors, RobotState} from '../art/Robot';
import {UI, Wave} from '../art/Ui';
import {Cam, camPath, Layer} from '../lib/cam';
import {pr, T} from '../lib/core';
import {humanVis} from '../lib/visemes';
import {INT} from '../shots/IntSet';
import {K, SPEECH} from '../state';
import {Back, LabTwo, OverRobot, ProfileTwo, RobotCU, VisitorCU} from './sets';
import {Visitor} from '../art/Visitor';
import {CAST, CREW_HEAD, CrewChar} from './crew';
import {AlcoveSet, AL, ScreenScene} from './shotsB';
import {CrewTalk, ECU0, glide} from './shotsD';
import {humanTrace} from './props';
import {Tag} from './text3';
import {EXPR_COPY, rob2, SAMPLE, sampleT, vis2} from './state2';
import {drift, e2, e3} from './shots2';

const view = (st: RobotState, yaw: number, gx?: number, gy?: number): RobotState => ({...st, yaw, gx: gx ?? st.gx, gy: gy ?? st.gy});
const sm3 = (x: number) => x * x * (3 - 2 * x);
const R0 = {x: 960, y: 470, s: 3.2};

// ================================================================== the opening (V4)
// 0 - 3.92 "This robot watches for a smile before it fully appears.": one shot. Frame 0 is mid-speech, eyes on us.
// Within the first second its eyes go past the camera and the camera pulls back and trucks right: a person is
// standing just in front of it, his face large in the right foreground. It stops and watches his mouth while his
// smile starts to form.
const V1_END = T('Then it tries');
/** the visitor's head and shoulders, large and near, at screen right (he faces screen-left, toward the robot) */
const ForeVisitor: React.FC<{id: string; f: number; hx: number; hy: number; s: number; turn?: number}> = ({id, f, hx, hy, s, turn = 0.78}) => {
  const v = vis2(f);
  return <Visitor id={id} hx={hx} hy={hy} s={s} expr={v.expr} blink={v.blink} pose={{turn, lTv: 120}} />;
};
export const V1Face: React.FC<{f: number}> = ({f}) => {
  const st = rob2(f);
  const cam = camPath(f, [[0, ECU0], [0.6, {x: 962, y: 545, z: 2.5}], [1.75, {x: 1090, y: 470, z: 1.2}], [V1_END, {x: 1070, y: 478, z: 1.3}]], sm3);
  return <RobotCU id="v1" cam={cam} st={st} x={R0.x} y={R0.y} s={R0.s} veil={0.3} bgDx={-200} bgDy={160} fore={<ForeVisitor id="v1-fv" f={f} hx={1700} hy={450} s={2.6} />} />;
};
// 3.92 - 5.62 "Then it tries to smile": close on its mouth as the smile begins; the silicone clears over the two
// motors doing it (the others stay hidden) and the cheek opens onto the corner motor: its horn turns, the rod pulls,
// the corner lifts. The section closes as the camera eases back.
const V2_END = T('same time');
export const V2Reveal: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 24, 0.62, 0.02);
  const X = 900, Y = 420, S = 4.4;
  const c = lipAnchors(st).find((q) => q.k === 'cornerL')!.p;
  const cx = X + c.x * S, cy = Y + c.y * S;
  const cam = camPath(f, [[V1_END, {x: cx + 120, y: cy - 10, z: 2.05}], [V1_END + 0.9, {x: cx + 40, y: cy - 30, z: 2.35}], [V2_END, {x: cx + 160, y: cy - 120, z: 1.45}]], sm3);
  const xr = pr(f, V1_END + 0.12, V1_END + 0.55) * (1 - pr(f, V2_END - 0.55, V2_END - 0.1));
  const ck = pr(f, V1_END + 0.3, V1_END + 0.75, e3) * (1 - pr(f, V2_END - 0.6, V2_END - 0.15));
  return <RobotCU id="v2" cam={cam} st={st} x={X} y={Y} s={S} veil={0.35} bgDx={-200} xray={0.5 * xr} xrayDark={0.14} xrayHot={['corner', 'cheek']} cheek={{k: ck, side: -1, r: 1.25}} />;
};
// 5.62 - 7.61 "at the same time as the person in front of it.": face to face; his smile, a small surprise as its
// smile lands with his
export const V3Pair: React.FC<{f: number}> = ({f}) => <ProfileTwo id="v3" cam={drift(f, V2_END, K.corner, {x: 995, y: 470, z: 1.55}, {x: 995, y: 462, z: 1.66})} robot={rob2(f)} vis={vis2(f)} rTurn={64} />;
// 7.61 - 8.54 "That takes more than": he tries an expression on it: a mock-surprised "ooh", brows high, jaw dropped
const V4_END = EXPR_COPY - 0.12;
export const V4His: React.FC<{f: number}> = ({f}) => <VisitorCU id="v4" cam={drift(f, K.corner, V4_END, {x: 1010, y: 390, z: 1.45}, {x: 1010, y: 384, z: 1.53})} vis={vis2(f)} hx={1060} hy={470} s={2.7} turn={0.42} veil={0.35} />;
// 8.54 - 9.62 "moving the corners": its version: brows, lids, jaw and lips together, unnervingly close to his
const V5_END = EXPR_COPY + 0.96;
export const V5Copy: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 16, 0.5, 0.02);
  return <RobotCU id="v5" cam={drift(f, V4_END, V5_END, {x: 925, y: 500, z: 1.22}, {x: 925, y: 494, z: 1.3})} st={st} x={R0.x - 40} y={R0.y} s={R0.s} veil={0.35} bgDx={-200} bgDy={160} />;
};
// 9.62 - 10.41 "of a mouth.": over its shoulder, still holding his expression; he goes still, curious and uneasy
export const V6React: React.FC<{f: number}> = ({f}) => <OverRobot id="v6" cam={drift(f, V5_END, T('Researchers'), {x: 1120, y: 470, z: 1.3}, {x: 1150, y: 450, z: 1.5})} robot={rob2(f)} vis={vis2(f)} rYaw={132} />;

// ================================================================== mechanism close-ups
/** a tight actuator close-up: the cheek section large, the servo, rod and corner filling the frame */
const Actuator: React.FC<{id: string; f: number; a: number; b: number; yaw: number; zoom?: number}> = ({id, f, a, b, yaw, zoom = 1}) => {
  const st = view(rob2(f), yaw, 0.2, 0.05);
  const X = 900, Y = 360, S = 7.0 * zoom;
  const c = lipAnchors(st).find((q) => q.k === 'cornerL')!.p;
  const fx = X + c.x * S - 60 * zoom, fy = Y + c.y * S;
  return <RobotCU id={id} cam={drift(f, a, b, {x: fx + 30, y: fy - 120, z: 1}, {x: fx, y: fy - 110, z: 1.08})} st={st} x={X} y={Y} s={S} veil={0.5} bgDx={-400} cheek={{k: 1, side: -1, r: 1.1, u: 54}} xray={0.3} xrayDark={0.12} xrayHot={['corner']} />;
};
// 27.0 - 28.0 "move.": the corner motor, very close
export const M1Actuator: React.FC<{f: number}> = ({f}) => <Actuator id="m1" f={f} a={T('face ways') + 0.3} b={K.combos} yaw={6} />;
// 174.29 - 176.72 "Less than a second of anticipation.": the corner motor starting the smile, very close
export const M2Actuator: React.FC<{f: number}> = ({f}) => <Actuator id="m2" f={f} a={K.less} b={K.enough} yaw={14} zoom={0.9} />;

// ================================================================== skin
// 65.75 - 70.0 "That matters because flexible skin moves differently from a rigid metal part.": from the skin filling
// the frame, back to a three-quarter face; the cheek is open, and the motor's rigid horn turns while the skin it
// pulls bends and stretches around it
export const K1Skin: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 24, -0.2, 0.05);
  const c = lipAnchors(st).find((q) => q.k === 'cheekL')!.p;
  const X = 900, Y = 420, S = 4.4;
  const cam = camPath(f, [[K.skin, {x: X + c.x * S, y: Y + c.y * S, z: 3.4}], [K.skin + 1.3, {x: 880, y: 600, z: 1.12}], [K.pull, {x: 860, y: 620, z: 1.2}]], sm3);
  return <RobotCU id="k1" cam={cam} st={st} x={X} y={Y} s={S} veil={0.35} bgDx={-200} cheek={{k: pr(f, K.skin + 0.6, K.skin + 1.2), side: -1, r: 1.3}} xray={0.3 * pr(f, K.skin + 0.6, K.skin + 1.2)} xrayDark={0.12} xrayHot={['corner']} />;
};
// 70.0 - 73.32 "Pull at one point, and the material around it stretches too.": close on the pulled point; the skin
// around it moves with it (its surface marks travel), the lip corner follows
export const K2Pull: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 24, -0.2, 0.05);
  const pu = st.pull!;
  const X = 900, Y = 360, S = 7.4;
  const g = pr(f, K.pull - 0.05, K.pull + 0.4) * (1 - pr(f, K.controller - 0.6, K.controller - 0.1));
  return <RobotCU id="k2" cam={drift(f, K.pull, K.controller, {x: 820, y: 640, z: 1}, {x: 808, y: 652, z: 1.06})} st={st} x={X} y={Y} s={S} veil={0.45} bgDx={-200} grid={0.7 * g} gridAt={{u: pu.u, v: pu.v, r: 40}} />;
};

// ================================================================== people
const CLIPS: {look: string; bg: 'kitchen' | 'street' | 'office' | 'stage' | 'home'; sing?: boolean}[] = [
  {look: 'clerkA', bg: 'street'},
  {look: 'checker', bg: 'office'},
  {look: 'host', bg: 'stage', sing: true},
  {look: 'clerkB', bg: 'kitchen'},
  {look: 'honest', bg: 'home'},
  {look: 'person', bg: 'stage', sing: true},
];
// 89.76 - 91.84 "including hours of YouTube footage.": the robot watching footage run on fast: one person after
// another on its screen; its eyes follow
export const P1Stream: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = view(rob2(f), 62, 0.55, 0.05);
  const i = Math.floor(Math.max(0, t - K.youtube) / 0.35) % CLIPS.length;
  const c = CLIPS[i];
  const p = clamp((t - K.youtube) / 2.0);
  const MX = AL.mon.x, MY = AL.mon.y, MW = AL.mon.w, MH = AL.mon.h;
  return (
    <AlcoveSet
      id="p1"
      cam={drift(f, K.youtube, K.important, {x: 1040, y: 470, z: 1.32}, {x: 1080, y: 466, z: 1.42})}
      st={st}
      f={f}
      screen={
        <g>
          <ScreenScene id="p1-sc">
            <CrewTalk id={`p1-c${i}`} f={f} look={c.look} bg={c.bg} tr={SPEECH(K.youtube - 1, K.important + 1, 5 + i * 3)} cam={{x: 960, y: 540, z: 1}} sing={c.sing} seed={11 + i} />
          </ScreenScene>
          <rect x={MX - MW / 2} y={MY + MH / 2 - 16} width={MW} height={16} fill="#000" opacity={0.6} />
          <rect x={MX - MW / 2} y={MY + MH / 2 - 12} width={fmt(MW * p)} height={8} fill={UI.coral} />
        </g>
      }
    />
  );
};
const sampleWave = humanTrace(SAMPLE);
// 91.84 - 96.36 "The important information was the relationship between the sound and the moving mouth.": one
// person, one sample; the sound runs beneath them as a line; the camera closes in on the mouth while the line's
// playhead sits under the lips
export const P2One: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const ss = sampleT(t);
  const hv = humanVis(ss, SAMPLE, 0.06);
  const scale = 4.2;
  const y = 470 - CREW_HEAD.y * scale;
  const cam = camPath(f, [[K.important, {x: 960, y: 560, z: 1}], [T('relationship between the sound') - 0.2, {x: 960, y: 560, z: 1.03}], [K.linked - 0.2, {x: 960, y: 760, z: 1.55}]], sm3);
  const wk = pr(f, K.important + 0.3, K.important + 0.8);
  return (
    <g>
      <Layer cam={cam} depth={2.4}>
        <Back id="p2-bk" bg="office" veil={0.3} dx={-200} dy={100} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <CrewChar id="p2" look={CAST.person} pose={{armL: {a: 8, b: 10}, armR: {a: 8, b: 10}, lean: 0, tilt: 0, lookX: 0, lookY: 0, brows: 0.2, mouth: 'smile'}} frame={f} seed={9} x={960} y={y} scale={scale} life={0.4} eyeDarts={false} vis={{open: hv.open, wide: hv.wide - 0.2, round: hv.wide < 0.8 ? clamp((0.9 - hv.wide) * 2.5) : 0, smile: Math.max(0.1, hv.smile)}} shadow={false} />
        <Wave x={260} y={900} w={1400} h={60} t0={ss - 1.6} t1={ss + 1.6} cursor={ss} fn={(tt) => sampleWave(((tt % 3.4) + 3.4) % 3.4)} color="#3E8F88" k={wk} />
      </Layer>
    </g>
  );
};

// ================================================================== the late smile, its effect
// 144.13 - 147.6 "Even a well-drawn expression can feel awkward when it arrives late.": over the robot's shoulder,
// its late smile at the edge of frame; his face is the reaction
export const L7Reaction: React.FC<{f: number}> = ({f}) => <OverRobot id="l7" cam={drift(f, K.awkward, K.study24, {x: 1000, y: 520, z: 1.05}, {x: 1060, y: 500, z: 1.16})} robot={rob2(f)} vis={vis2(f)} rYaw={128} />;

// ================================================================== the frame grade
/** a light vignette and a per-section colour (cool for the experiments, warm for people and the future) */
const GRADE: [number, string, number][] = [
  [0, '#16304A', 0.1],
  [T('Researchers'), '#1E3A44', 0.06],
  [K.banana, '#3A2A16', 0.05],
  [K.once, '#3A2A16', 0.07],
  [K.result, '#1E3A44', 0.05],
  [K.another, '#3A2A16', 0.06],
  [K.study24, '#16304A', 0.07],
  [K.enough, '#3A2A16', 0.07],
  [K.again, '#16304A', 0.1],
];
export const Grade: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const g = GRADE.filter(([t0]) => t >= t0).pop()!;
  return (
    <g style={{pointerEvents: 'none'}}>
      <defs>
        <radialGradient id="grade-v" cx="960" cy="540" r="1150" gradientUnits="userSpaceOnUse">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.32} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill={g[1]} opacity={g[2]} style={{mixBlendMode: 'multiply'}} />
      <rect x={0} y={0} width={1920} height={1080} fill="url(#grade-v)" />
    </g>
  );
};
export {Tag, e2, glide, lerp};
