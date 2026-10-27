// V5 shots: the demonstration-hall opening and finale, the workshop, the test bay, the wider robotics lab, the video
// call. Every new scene is built from the same rigs (the robot head, the visitor, the Weird Crew cast) and the same
// 2.5D camera; nothing is regenerated per frame.
import React from 'react';
import {Robot, RobotState, RobotSupport, RPAL} from '../art/Robot';
import {mixExpr, Visitor, VX} from '../art/Visitor';
import {Head} from '../dc/Head';
import {Cam, camPath, Layer} from '../lib/cam';
import {pr, T} from '../lib/core';
import {CO24, K, replayT, screenFaceAt, SPEECH} from '../state';
import {BANANA, loudSm, robotVis} from '../lib/visemes';
import {crewVis} from './shotsD';
import {CAST, CrewChar, IDLE, Pose, reach} from './crew';
import {DemoBack, HomeBack, StageLip, StudioBack, StudioMic, TestBayBack, WorkshopBack, Workbench} from './new';
import {Laptop, Puppet, SpeakerBox} from './props';
import {Sliders, sliderVals} from './shotsA';
import {Tag} from './text3';
import {Back, MirrorSet2, ProfileTwo, RobotCU} from './sets';
import {EXPR_COPY, HOOK_LAG, HOOK_T, rob2, vis2} from './state2';
import {drift} from './shots2';

const sm3 = (x: number) => x * x * (3 - 2 * x);
const cl = (x: number) => Math.min(1, Math.max(0, x));
const ss = (t: number, a: number, b: number) => sm3(cl((t - a) / (b - a)));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const view = (st: RobotState, yaw: number, gx?: number, gy?: number): RobotState => ({...st, yaw, gx: gx ?? st.gx, gy: gy ?? st.gy});
/** a cast member's ground y so that the head centre sits at screen-world y `hy` */
const groundFor = (hy: number, scale: number) => hy + 372 * scale;
const P = (p: Partial<Pose>): Pose => ({...IDLE, ...p});

// ================================================================== the demonstration hall
/** the hall's back plane (LED wall, truss, beams), drifting with time */
const Hall: React.FC<{cam: Cam; t: number; depth?: number; veil?: number; dx?: number; dy?: number}> = ({cam, t, depth = 2.4, veil = 0, dx = 0, dy = 0}) => (
  <Layer cam={cam} depth={depth}>
    <g transform={`translate(${dx} ${dy})`}>
      <DemoBack t={t} veil={veil} />
    </g>
  </Layer>
);

// 0 - 3.92 "This robot watches for a smile before it fully appears.": face to face, inches apart, on frame 0 he is
// already pulling a shocked face and it is already giving it back. A glare, a huge grin: each one returned a beat
// later with brows, lids, jaw and lips together. The camera travels between the two faces, following each copy;
// after the grin he is amazed; then his face softens, a smile begins, and the robot's eyes drop to his mouth.
export const G1FaceOff: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = view(rob2(f), 24);
  const v = vis2(f);
  // V6: the shot opens low and a little canted, tight on the robot mid-copy with his face large at the right edge;
  // it levels and widens to the two-shot as he pulls the next face, then travels between the faces as before
  const cam = camPath(f, [[0, {x: 800, y: 575, z: 1.5, roll: -3}], [0.8, {x: 850, y: 548, z: 1.38, roll: -1.2}], [1.45, {x: 1030, y: 510, z: 1.3, roll: 0}], [2.35, {x: 880, y: 528, z: 1.33}], [T('Then it tries'), {x: 960, y: 515, z: 1.44}]], sm3);
  // V6: as it gives each face back, the silicone clears over the motors doing that face (and only those): jaw and
  // brows for the shock, brows and lids for the glare, corners and cheeks for the grin
  const copy = HOOK_T.map((h) => h + HOOK_LAG);
  const bump = (c: number) => ss(t, c - 0.12, c + 0.12) * (1 - ss(t, c + 0.45, c + 0.75));
  const k0 = 1 - ss(t, 0.35, 0.7);
  const k1 = bump(copy[1]), k2 = bump(copy[2]);
  const xr = Math.max(k0, k1, k2);
  const hot = k0 >= k1 && k0 >= k2 ? ['jaw', 'brow', 'lip'] : k1 >= k2 ? ['brow', 'lid', 'lip'] : ['corner', 'cheek', 'lid'];
  const R = {x: 640, y: 540, s: 3.0};
  return (
    <g>
      <Hall cam={cam} t={t} depth={2.6} veil={0.42} dx={-80} dy={140} />
      <Layer cam={cam} depth={1}>
        <RobotSupport id="g1-sup" x={R.x} y={R.y} s={R.s} yaw={st.yaw} postLen={260} />
        <Robot id="g1-r" st={st} x={R.x} y={R.y} s={R.s} xray={0.42 * xr} xrayDark={0.14} xrayHot={hot} xrayFocus />
      </Layer>
      <Layer cam={cam} depth={0.96}>
        <Visitor id="g1-v" hx={1350} hy={490} s={2.7} expr={v.expr} blink={v.blink} pose={{turn: 0.72, lTv: 120, torso: 6, neck: -4}} />
      </Layer>
    </g>
  );
};

// 5.62 - 7.61 "at the same time as the person in front of it.": the stage, side on: he leans in close; the two
// smiles land together; he is delighted
export const G3StagePair: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = T('same time');
  const lean = ss(t, a, a + 0.8);
  const cam = camPath(f, [[a, {x: 1000, y: 470, z: 1.48}], [K.corner, {x: 985, y: 462, z: 1.62}]], sm3);
  return <ProfileTwo id="g3s" cam={cam} robot={rob2(f)} vis={vis2(f)} rTurn={64} vx={1290 - 40 * lean} vPose={{torso: 4 + 12 * lean, neck: -3 - 6 * lean}} backLayer={<g transform="translate(-200 160) scale(1.05)"><DemoBack t={t} veil={0.18} /></g>} />;
};

/** the people watching the demonstration (foreground, heads and shoulders above the frame bottom) */
const CROWD: {look: string; x: number; hy: number; s: number; seed: number; flip?: boolean}[] = [
  {look: 'clerkB', x: 150, hy: 760, s: 1.55, seed: 3},
  {look: 'host', x: 420, hy: 820, s: 1.7, seed: 5},
  {look: 'checker', x: 690, hy: 905, s: 1.6, seed: 7},
  {look: 'honest', x: 1280, hy: 900, s: 1.6, seed: 9, flip: true},
  {look: 'clerkC', x: 1560, hy: 820, s: 1.7, seed: 11, flip: true},
  {look: 'person', x: 1820, hy: 770, s: 1.55, seed: 13, flip: true},
];
/** how each of them reacts at time t to the robot's expression (start time t0) */
const crowdPose = (i: number, t: number, t0: number): Pose => {
  const k = ss(t, t0 + 0.1 * i, t0 + 0.1 * i + 0.4);
  const toward = i < 3 ? 0.75 : -0.75; // eyes on the stage centre
  switch (i) {
    case 0: return P({lookX: toward, brows: 0.2 + 0.7 * k, mouth: k > 0.5 ? 'o' : 'smile', lean: 2 * k});
    case 1: return P({lookX: toward, brows: 0.6 * k, mouth: k > 0.4 ? 'grin' : 'smile', armR: {a: 8 + 62 * k, b: 10 + 95 * k}, lean: 3 * k});
    case 2: return P({lookX: lerp(toward, -0.6, ss(t, t0 + 1.2, t0 + 1.5)), brows: 0.8 * k, mouth: 'o', tilt: -6 * ss(t, t0 + 1.2, t0 + 1.5), lean: -4 * ss(t, t0 + 1.2, t0 + 1.5)});
    case 3: return P({lookX: lerp(toward, 0.6, ss(t, t0 + 1.25, t0 + 1.55)), brows: 0.5 + 0.4 * k, mouth: k > 0.5 ? 'grin' : 'smile', tilt: 6 * ss(t, t0 + 1.25, t0 + 1.55), lean: 4 * ss(t, t0 + 1.25, t0 + 1.55)});
    case 4: return P({lookX: toward, brows: 0.3 + 0.5 * k, mouth: 'smile', armL: {a: 20 + 50 * k, b: 40 + 80 * k}, armR: {a: 20 + 50 * k, b: 40 + 80 * k}});
    default: return P({lookX: toward, brows: 0.9 * k, mouth: k > 0.5 ? 'o' : 'flat', armL: {a: 8 + 30 * k, b: 10 + 120 * k}});
  }
};
/** a phone held up to film (in the cast's hand-local coordinates) */
const PhoneUp = (
  <g transform="rotate(-8)">
    <rect x={-26} y={-92} width={52} height={92} rx={8} fill="#1C2030" stroke="#0B0D14" strokeWidth={5} />
    <rect x={-20} y={-84} width={40} height={74} rx={4} fill="#8FB4E8" opacity={0.85} />
  </g>
);
export const Crowd: React.FC<{f: number; t0: number}> = ({f, t0}) => {
  const t = f / 30;
  return (
    <g>
      {CROWD.map((c, i) => (
        <CrewChar key={i} look={CAST[c.look]} pose={crowdPose(i, t, t0)} frame={f} seed={c.seed} x={c.x} y={groundFor(c.hy, c.s)} scale={c.s} flip={c.flip} holdR={i === 1 ? PhoneUp : undefined} shadow={false} life={0.9} />
      ))}
    </g>
  );
};
// 7.61 - 10.41 "That takes more than moving the corners of a mouth.": one continuous pull back from the pair: the
// stage, the LED wall, and the people in front of it. As it makes a whole-face expression for them, they react:
// one films it, two turn to each other, one raises both hands.
export const G4Crowd: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.corner, b = T('Researchers');
  const cam = camPath(f, [[a, {x: 980, y: 440, z: 2.2}], [a + 1.6, {x: 960, y: 520, z: 1.06}], [b, {x: 960, y: 530, z: 1.0}]], (x) => 1 - Math.pow(1 - x, 3));
  const R = {x: 760, y: 430, s: 1.25};
  const st = {...rob2(f), yaw: 40};
  const v = vis2(f);
  return (
    <g>
      <Hall cam={cam} t={t} depth={1.8} veil={0.04} dx={0} dy={80} />
      <Layer cam={cam} depth={1}>
        <ellipse cx={960} cy={640} rx={520} ry={44} fill="#000" opacity={0.25} />
        <rect x={R.x - 70} y={560} width={140} height={90} rx={10} fill="#262C44" stroke="#05070F" strokeWidth={5} />
        <RobotSupport id="g4-sup" x={R.x} y={R.y} s={R.s} yaw={st.yaw} postLen={(560 - R.y) / R.s - 206} />
        <Robot id="g4-r" st={st} x={R.x} y={R.y} s={R.s} />
        <Visitor id="g4-v" hx={1150} hy={405} s={1.22} expr={v.expr} blink={v.blink} pose={{turn: 0.85, lTv: 120, torso: 6}} />
        <StageLip y={650} />
      </Layer>
      <Layer cam={cam} depth={0.82}>
        <Crowd f={f} t0={EXPR_COPY - 0.2} />
      </Layer>
    </g>
  );
};

// ================================================================== the workshop
const Shop: React.FC<{cam: Cam; depth?: number; veil?: number; dx?: number; dy?: number}> = ({cam, depth = 2.2, veil = 0, dx = 0, dy = 80}) => (
  <Layer cam={cam} depth={depth}>
    <g transform={`translate(${dx} ${dy})`}>
      <WorkshopBack veil={veil} />
    </g>
  </Layer>
);
const SHOP_BENCH = 760;
/** the robot head on its assembly stand, rising from the bench */
const StandHead: React.FC<{id: string; st: RobotState; x: number; y: number; s: number; benchY?: number; xray?: number; xrayHot?: string[]; xrayDark?: number; grid?: number; gridAt?: {u: number; v: number; r: number}}> = ({id, st, x, y, s, benchY = SHOP_BENCH, xray, xrayHot, xrayDark, grid, gridAt}) => (
  <g>
    <rect x={x - 30 * s} y={benchY - 30} width={60 * s} height={30} rx={6} fill="#30363E" stroke="#0B0D14" strokeWidth={4} />
    <RobotSupport id={`${id}-sup`} x={x} y={y} s={s} yaw={st.yaw} postLen={Math.max(0, (benchY - 24 - y) / s - 206)} />
    <Robot id={`${id}-r`} st={st} x={x} y={y} s={s} xray={xray} xrayHot={xrayHot} xrayDark={xrayDark} xrayFocus={(xrayHot?.length ?? 0) > 0} grid={grid} gridAt={gridAt} />
  </g>
);
// 20.56 - 22.96 "At Columbia University, engineers built a": the workshop where the face is built. Its silicone is
// still translucent over the frame; one engineer works inside the cheek with a driver, the other checks the motors
// on a laptop and looks up at it. The camera tracks along the bench.
export const W1Build: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.columbia, b = T('flexible');
  const cam = drift(f, a, b, {x: 1090, y: 520, z: 1.1}, {x: 880, y: 505, z: 1.17});
  const R = {x: 900, y: 440, s: 2.0};
  // (the parked arm in the back plane is moved off the head's silhouette with the plane's offset)
  const st = view(rob2(f), 16, 0.35, 0.08);
  const A = {x: 1330, y: groundFor(480, 1.5), scale: 1.5};
  const tool = {x: R.x + 52 * R.s + 6 * Math.sin(t * 7), y: R.y + 40 * R.s + 3 * Math.cos(t * 7)};
  const B = {x: 330, y: groundFor(505, 1.45), scale: 1.45};
  const up = ss(t, a + 1.1, a + 1.4) * (1 - ss(t, b - 0.4, b - 0.1));
  const typing = (1 - up) * Math.sin(t * 14) * 3;
  return (
    <g>
      <Shop cam={cam} dx={420} />
      <Layer cam={cam} depth={1}>
        <CrewChar look={CAST.checker} pose={P({lookX: -0.85, lookY: 0.25, brows: 0.25, mouth: 'hmm', lean: -5, armL: reach(A, -1, tool.x, tool.y), armR: {a: 10, b: 25}})} frame={f} seed={31} x={A.x} y={A.y} scale={A.scale} shadow={false} life={0.5} />
        <CrewChar look={CAST.honest} pose={P({lookX: lerp(0.5, 0.85, up), lookY: lerp(0.6, -0.1, up), brows: 0.3 * up, mouth: 'flat', armL: reach(B, -1, 470, 735 + typing), armR: reach(B, 1, 560, 738 - typing)})} frame={f} seed={33} x={B.x} y={B.y} scale={B.scale} shadow={false} life={0.6} />
        <StandHead id="w1" st={st} x={R.x} y={R.y} s={R.s} xray={0.55} xrayDark={0.22} />
        <Workbench x0={-500} x1={2500} y={SHOP_BENCH} />
        <Laptop id="w1-lt" x={430} y={560} w={230} h={140}>
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={20} y={18 + i * 20} width={60 + 120 * (0.5 + 0.5 * Math.sin(t * 2 + i))} height={10} rx={5} fill="#7FB3D8" opacity={0.7} />)}
        </Laptop>
        <rect x={1500} y={712} width={150} height={40} rx={6} fill="#C8483A" stroke="#0B0D14" strokeWidth={4} />
        <rect x={1120} y={728} width={90} height={26} rx={4} fill="#9AA3AD" stroke="#0B0D14" strokeWidth={3} />
      </Layer>
      <Tag x={90} y={110} text="Columbia University" k={pr(f, a + 0.2, a + 0.6)} size={30} />
    </g>
  );
};
// 22.96 - 26.05 "a flexible robotic face with twenty-six motors.": closer. Her fingertip presses its cheek and the
// silicone gives around it; she lets go, the skin clears, and its motors come on group by group as it tries brows,
// smile and lips.
const HOT_W: [number, string[]][] = [[0, []], [T('twenty-six') + 0.1, ['corner', 'cheek', 'lip', 'brow', 'lid', 'jaw']], [T('That gives') - 0.6, ['brow']], [T('That gives') - 0.3, ['corner', 'cheek']], [T('That gives') - 0.05, ['lip']]];
export const W2Flex: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = T('flexible'), b = T('That gives');
  const R = {x: 880, y: 420, s: 3.3};
  const press = ss(t, a + 0.15, a + 0.5) * (1 - ss(t, a + 1.0, a + 1.3));
  const base = view(rob2(f), 8, 0.45, 0.1);
  const st: RobotState = {...base, pull: press > 0.01 ? {u: 40, v: 4, dx: -9 * press, dy: -2 * press, r: 16} : undefined};
  const xr = pr(f, T('twenty-six') - 0.2, T('twenty-six') + 0.3);
  const hot = HOT_W.filter(([t0]) => t >= t0).pop()![1];
  const cam = drift(f, a, b, {x: 1000, y: 520, z: 1.12}, {x: 930, y: 500, z: 1.32});
  const A = {x: 1560, y: groundFor(470, 2.0), scale: 2.0};
  const tip = {x: R.x + (40 - 9 * press) * R.s * 0.97 + 18, y: R.y + 4 * R.s + 10};
  const away = ss(t, a + 1.2, a + 1.7);
  return (
    <g>
      <Shop cam={cam} depth={2.4} veil={0.25} dx={-200} />
      <Layer cam={cam} depth={1}>
        <StandHead id="w2" st={st} x={R.x} y={R.y} s={R.s} benchY={1060} xray={xr * 0.8} xrayDark={0.28} xrayHot={xr > 0.01 ? hot : undefined} grid={0.6 * press} gridAt={{u: 40, v: 4, r: 30}} />
        <CrewChar look={CAST.checker} pose={P({lookX: -0.85, lookY: 0.1, brows: 0.35, mouth: away > 0.5 ? 'smile' : 'hmm', lean: -6 + 6 * away, armL: away < 0.5 ? reach(A, -1, lerp(tip.x, 1420, away * 2), lerp(tip.y, 700, away * 2)) : {a: lerp(reach(A, -1, 1420, 700).a, 12, (away - 0.5) * 2), b: lerp(reach(A, -1, 1420, 700).b, 18, (away - 0.5) * 2)}})} frame={f} seed={35} x={A.x} y={A.y} scale={A.scale} shadow={false} life={0.4} />
      </Layer>
      <Tag x={90} y={1000} text="26 motors · some of them shown" k={pr(f, T('twenty-six') + 0.2, T('twenty-six') + 0.6)} size={30} />
    </g>
  );
};
// 28.0 - 30.56 "But the machine still has to learn which combinations": the workshop, wide. One engineer runs the
// slider board; every combination she tries pulls a face nobody asked for; the other laughs and winces.
export const W6Combos: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.combos, b = T('create the');
  const cam = drift(f, a, b, {x: 960, y: 520, z: 1.0}, {x: 1000, y: 512, z: 1.06});
  const R = {x: 1180, y: 430, s: 1.9};
  const st = view(rob2(f), -18, -0.5, 0.15);
  const vals = sliderVals(t);
  const SX = 230, SY = 590, SS = 0.9;
  const knob = (i: number) => ({x: SX + (30 + i * 62) * SS, y: SY + lerp(210, 10, vals[i]) * SS});
  const B = {x: 470, y: groundFor(470, 1.5), scale: 1.5};
  const iL = Math.floor(t * 1.7) % 4, iR = 4 + (Math.floor(t * 1.3 + 2) % 4);
  const A = {x: 1620, y: groundFor(480, 1.5), scale: 1.5};
  const laugh = ss(t, a + 0.6, a + 0.9) * (1 - ss(t, a + 1.6, a + 1.9));
  const wince = ss(t, a + 1.7, a + 2.0);
  return (
    <g>
      <Shop cam={cam} dx={0} />
      <Layer cam={cam} depth={1}>
        <CrewChar look={CAST.honest} pose={P({lookX: 0.8, lookY: 0, brows: 0.2, mouth: 'hmm', lean: 4, armL: reach(B, -1, knob(iL).x, knob(iL).y), armR: reach(B, 1, knob(iR).x, knob(iR).y)})} frame={f} seed={37} x={B.x} y={B.y} scale={B.scale} shadow={false} life={0.5} />
        <CrewChar look={CAST.checker} pose={P({lookX: -0.8, brows: 0.6 * laugh - 0.4 * wince, mouth: laugh > 0.5 ? 'grin' : wince > 0.5 ? 'frown' : 'smile', tilt: 6 * laugh - 5 * wince, lean: -3 * wince, armR: {a: 10 + 40 * wince, b: 20 + 110 * wince}})} frame={f} seed={39} x={A.x} y={A.y} scale={A.scale} shadow={false} life={0.7} />
        <StandHead id="w6" st={st} x={R.x} y={R.y} s={R.s} />
        <Workbench x0={-500} x1={2500} y={SHOP_BENCH} />
        <Sliders x={SX} y={SY} vals={vals} s={SS} />
      </Layer>
    </g>
  );
};

// ================================================================== the test bay
const Bay: React.FC<{cam: Cam; depth?: number; veil?: number; dx?: number; dy?: number}> = ({cam, depth = 2.2, veil = 0, dx = 0, dy = 80}) => (
  <Layer cam={cam} depth={depth}>
    <g transform={`translate(${dx} ${dy})`}>
      <TestBayBack veil={veil} />
    </g>
  </Layer>
);
const BAY_DESK = 770;
/** the researcher's console: a sloped dark panel with knobs (their pointers turn) and one long fader */
const Console: React.FC<{x: number; y: number; knobs: number[]; fader?: number}> = ({x, y, knobs, fader = 0}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-20,0 L520,0 L490,-120 L10,-120 Z" fill="#2C353D" stroke="#0B0D14" strokeWidth={5} strokeLinejoin="round" />
    {knobs.map((k, i) => {
      const cx = 60 + i * 76, cy = -64;
      const a = (-135 + 270 * cl(k)) * (Math.PI / 180);
      return (
        <g key={i}>
          <circle cx={cx} cy={cy} r={24} fill="#D9DDE2" stroke="#0B0D14" strokeWidth={4} />
          <line x1={cx} y1={cy} x2={cx + 18 * Math.sin(a)} y2={cy - 18 * Math.cos(a)} stroke="#0B0D14" strokeWidth={5} strokeLinecap="round" />
        </g>
      );
    })}
    <rect x={-20} y={0} width={540} height={26} fill="#1F262C" stroke="#0B0D14" strokeWidth={4} />
    {fader > 0 && <rect x={430} y={-110} width={12} height={92} rx={6} fill="#141A20" />}
    {fader > 0 && <rect x={418} y={-30 - 70 * cl(fader - 0.001)} width={36} height={20} rx={5} fill="#4FA86F" stroke="#0B0D14" strokeWidth={3} />}
  </g>
);
const knobAt = (i: number) => ({dx: 60 + i * 76, dy: -64});
/** the test stand: a weighted base on the floor and a tall post */
const TestHead: React.FC<{id: string; st: RobotState; x: number; y: number; s: number; floor?: number; xray?: number; xrayHot?: string[]; xrayDark?: number}> = ({id, st, x, y, s, floor = 880, xray, xrayHot, xrayDark}) => (
  <g>
    <ellipse cx={x} cy={floor + 6} rx={90 * s * 0.6} ry={12} fill="#000" opacity={0.18} />
    <rect x={x - 60 * s * 0.5} y={floor - 30} width={60 * s} height={34} rx={8} fill="#5A646C" stroke="#0B0D14" strokeWidth={4} />
    <RobotSupport id={`${id}-sup`} x={x} y={y} s={s} yaw={st.yaw} postLen={Math.max(0, (floor - 28 - y) / s - 206)} />
    <Robot id={`${id}-r`} st={st} x={x} y={y} s={s} xray={xray} xrayHot={xrayHot} xrayDark={xrayDark} xrayFocus={(xrayHot?.length ?? 0) > 0} />
  </g>
);
// 38.95 - 44.4 "Now imagine trying to produce those movements by adjusting a collection of motors underneath a rubber
// face.": the test bay. A researcher turns the knobs on her console one at a time; the camera moves off her hands to
// the head on its stand; its skin clears over the lip motors; each turn moves them, and the mouth still misses.
export const T3Try: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.imagine, b = K.jaw;
  const C = {x: 260, y: BAY_DESK};
  const R = {x: 1300, y: 420, s: 2.0};
  const B = {x: 520, y: groundFor(470, 1.55), scale: 1.55};
  const seq = Math.floor(Math.max(0, t - a - 0.6) / 0.9) % 6;
  const knobs = [0, 1, 2, 3, 4, 5].map((i) => 0.5 + 0.35 * Math.sin(t * (0.7 + i * 0.23) + i) * (i === seq ? 1 : 0.4));
  const kp = knobAt(seq);
  const hand = {x: C.x + kp.dx, y: C.y + kp.dy - 6};
  const st = view(rob2(f), -20, -0.35, 0.1);
  const xr = pr(f, T('by adjusting') - 0.1, T('by adjusting') + 0.4);
  const cam = camPath(f, [[a, {x: 700, y: 560, z: 1.12}], [a + 1.4, {x: 820, y: 540, z: 1.05}], [T('by adjusting') + 0.6, {x: 1260, y: 480, z: 1.85}], [b, {x: 1280, y: 470, z: 1.95}]], sm3);
  return (
    <g>
      <Bay cam={cam} dx={-60} />
      <Layer cam={cam} depth={1}>
        <TestHead id="t3" st={st} x={R.x} y={R.y} s={R.s} xray={0.7 * xr} xrayDark={0.25} xrayHot={xr > 0.01 ? ['lip', 'corner', 'jaw'] : undefined} />
        {(() => {
          const pose = P({lookX: lerp(0.6, 0.9, ss(t, a + 1.2, a + 1.6)), lookY: lerp(0.6, -0.1, ss(t, a + 1.2, a + 1.6)), brows: 0.2, mouth: 'hmm', lean: 3, armL: reach(B, -1, hand.x, hand.y), armR: {a: 14, b: 40}});
          return (
            <g>
              <CrewChar look={CAST.clerkB} pose={pose} frame={f} seed={41} x={B.x} y={B.y} scale={B.scale} shadow={false} life={0.5} front="L" pass="body" />
              <rect x={-600} y={BAY_DESK + 20} width={1400} height={700} fill="#8E989F" stroke="#0B0D14" strokeWidth={4} />
              <Console x={C.x} y={C.y} knobs={knobs} />
              <CrewChar look={CAST.clerkB} pose={pose} frame={f} seed={41} x={B.x} y={B.y} scale={B.scale} shadow={false} life={0.5} front="L" pass="frontArm" />
            </g>
          );
        })()}
      </Layer>
    </g>
  );
};
// 44.4 - 47.41 "You could make its jaw flap whenever the speaker gets loud.": she slides one fader up; a speaker on a
// cart plays speech; the jaw opens with every loud moment and nothing else
export const T4Jaw: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.jaw, b = K.puppet;
  const lv = loudSm(t);
  const R = {x: 1100, y: 430, s: 2.1};
  const st = view(rob2(f), -26, -0.4, 0.05);
  const C = {x: 120, y: BAY_DESK};
  const B = {x: 390, y: groundFor(470, 1.55), scale: 1.55};
  const fd = ss(t, a + 0.1, a + 0.6);
  const fhand = {x: C.x + 436, y: C.y - 30 - 70 * fd};
  const cam = drift(f, a, b, {x: 900, y: 540, z: 1.04}, {x: 960, y: 530, z: 1.1});
  return (
    <g>
      <Bay cam={cam} dx={80} />
      <Layer cam={cam} depth={1}>
        <TestHead id="t4" st={st} x={R.x} y={R.y} s={R.s} />
        <rect x={1460} y={720} width={260} height={160} rx={10} fill="#5A646C" stroke="#0B0D14" strokeWidth={4} />
        <SpeakerBox x={1590} y={600} s={1.0} level={lv} />
        <path d="M1460,860 C1350,900 1240,900 1150,872" fill="none" stroke="#2B313A" strokeWidth={8} strokeLinecap="round" />
        {(() => {
          const pose = P({lookX: 0.85, lookY: 0, brows: 0.1 + 0.3 * fd, mouth: 'flat', armR: reach(B, 1, fhand.x, fhand.y), armL: {a: 12, b: 30}});
          return (
            <g>
              <CrewChar look={CAST.clerkB} pose={pose} frame={f} seed={43} x={B.x} y={B.y} scale={B.scale} shadow={false} life={0.5} front="R" pass="body" />
              <rect x={-600} y={BAY_DESK + 20} width={1180} height={700} fill="#8E989F" stroke="#0B0D14" strokeWidth={4} />
              <Console x={C.x} y={C.y} knobs={[0.5, 0.5, 0.5, 0.5, 0.5]} fader={fd} />
              <CrewChar look={CAST.clerkB} pose={pose} frame={f} seed={43} x={B.x} y={B.y} scale={B.scale} shadow={false} life={0.5} front="R" pass="frontArm" />
            </g>
          );
        })()}
      </Layer>
    </g>
  );
};
// 47.41 - 49.46 "It would look like a very expensive sock puppet.": a sock puppet rises on the cart beside it, flapping
// to the same loudness; she glances from one to the other
export const T5Puppet: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.puppet, b = T('puppet.') + 0.1;
  const lv = loudSm(t);
  const pk = pr(f, a - 0.05, a + 0.35);
  const R = {x: 760, y: 430, s: 2.0};
  const st = view(rob2(f), 28, 0.5, 0.05);
  const cam = drift(f, a, b, {x: 1000, y: 530, z: 1.12}, {x: 1000, y: 525, z: 1.16});
  return (
    <g>
      <Bay cam={cam} dx={-300} />
      <Layer cam={cam} depth={1}>
        <TestHead id="t5" st={st} x={R.x} y={R.y} s={R.s} />
        <rect x={1120} y={760} width={420} height={140} rx={10} fill="#5A646C" stroke="#0B0D14" strokeWidth={4} />
        <g transform={`translate(0 ${(1 - pk) * 600})`}>
          <Puppet x={1330} y={460} open={lv} s={1.05} />
        </g>
      </Layer>
    </g>
  );
};
// 49.46 - 50.15 (end of "sock puppet."): her deadpan look
export const T5Look: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = T('puppet.') + 0.1;
  const cam = drift(f, a, K.follow, {x: 960, y: 470, z: 1.0}, {x: 962, y: 466, z: 1.03});
  const tilt = -5 * ss(t, a + 0.15, a + 0.45);
  return (
    <g>
      <Bay cam={cam} depth={2.6} veil={0.3} dx={-300} />
      <Layer cam={cam} depth={1}>
        <CrewChar look={CAST.clerkB} pose={P({lookX: 0.15, lookY: 0, brows: -0.35, browAsym: 0.6, mouth: 'flat', tilt, armL: {a: 10, b: 20}, armR: {a: 10, b: 20}})} frame={f} seed={45} x={960} y={groundFor(470, 3.0)} scale={3.0} shadow={false} life={0.3} eyeDarts={false} />
      </Layer>
    </g>
  );
};
// 50.15 - 53.17 "The researchers wanted the movements to follow the speech.": she leans to the desk microphone and
// says "banana", slowly; facing her, its lips follow her sound; the camera moves from her to it
export const T6Follow: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.follow, b = K.practiced;
  const rt = replayT(t);
  const v = crewVis(rt, BANANA, 0.1);
  const speaking = t > a + 0.45 && rt < 34.05;
  const R = {x: 1340, y: 440, s: 2.0};
  const st = view(rob2(f), -40, -0.6, 0.05);
  const B = {x: 560, y: groundFor(480, 1.6), scale: 1.6};
  const lean = ss(t, a, a + 0.5);
  const cam = drift(f, a, b, {x: 760, y: 520, z: 1.18}, {x: 1080, y: 520, z: 1.12});
  return (
    <g>
      <Bay cam={cam} dx={-120} />
      <Layer cam={cam} depth={1}>
        <TestHead id="t6" st={st} x={R.x} y={R.y} s={R.s} />
        <CrewChar look={CAST.clerkB} pose={P({lookX: 0.8, lookY: 0.1, brows: 0.25, mouth: 'smile', lean: 5 * lean, armL: {a: 12, b: 40}, armR: reach(B, 1, 760, BAY_DESK - 10)})} vis={speaking ? v : undefined} frame={f} seed={47} x={B.x} y={B.y} scale={B.scale} shadow={false} life={0.5} />
        {/* desk with a microphone on a short arm */}
        <rect x={180} y={BAY_DESK} width={760} height={30} fill="#D9DDE2" stroke="#0B0D14" strokeWidth={4} />
        <rect x={190} y={BAY_DESK + 30} width={740} height={600} fill="#8E989F" stroke="#0B0D14" strokeWidth={4} />
        <path d={`M760,${BAY_DESK} L760,${BAY_DESK - 120} L700,${BAY_DESK - 200}`} fill="none" stroke="#2B313A" strokeWidth={10} strokeLinecap="round" />
        <rect x={672} y={BAY_DESK - 250} width={44} height={74} rx={20} fill="#3A3D42" stroke="#0B0D14" strokeWidth={5} transform={`rotate(-30 694 ${BAY_DESK - 213})`} />
      </Layer>
    </g>
  );
};

// ================================================================== skin against metal (the workshop)
/** a clamped silicone sheet seen slightly from above, as a mesh; `pull` drags the point P0 toward `dir` and the
 *  material around it follows with a gaussian falloff (the further from the pull, the less it moves) */
const SiliconeSheet: React.FC<{x: number; y: number; w: number; h: number; p0: {x: number; y: number}; dir: {x: number; y: number}; pull: number}> = ({x, y, w, h, p0, dir, pull}) => {
  const N = 14, M = 8;
  const sig = 0.22 * w;
  const pt = (i: number, j: number) => {
    const px = x + (w * i) / N, py = y + (h * j) / M;
    const g = Math.exp(-((px - p0.x) ** 2 + (py - p0.y) ** 2) / (2 * sig * sig));
    const edge = i === 0 || i === N ? 0 : 1; // the clamped ends do not move
    return {x: px + dir.x * pull * g * edge, y: py + dir.y * pull * g * edge};
  };
  const rows = Array.from({length: M + 1}, (_, j) => Array.from({length: N + 1}, (_, i) => pt(i, j)));
  const cols = Array.from({length: N + 1}, (_, i) => Array.from({length: M + 1}, (_, j) => pt(i, j)));
  const poly = (ps: {x: number; y: number}[]) => ps.map((p, k) => `${k ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const outline = [...rows[0], ...cols[N].slice(1), ...rows[M].slice().reverse().slice(1), ...cols[0].slice().reverse().slice(1)];
  return (
    <g>
      <path d={poly(outline) + ' Z'} fill={RPAL.skin} opacity={0.85} stroke="#0B0D14" strokeWidth={4} />
      {rows.slice(1, M).map((r, j) => <path key={`r${j}`} d={poly(r)} fill="none" stroke="#5E6C9C" strokeWidth={2} opacity={0.7} />)}
      {cols.slice(1, N).map((c, i) => <path key={`c${i}`} d={poly(c)} fill="none" stroke="#5E6C9C" strokeWidth={2} opacity={0.7} />)}
      {/* clamps */}
      {[x - 10, x + w - 30].map((cx, k) => <rect key={k} x={cx} y={y - 24} width={40} height={h + 48} rx={8} fill="#7E8892" stroke="#0B0D14" strokeWidth={4} />)}
    </g>
  );
};
/** a rigid metal bracket (hand-local), rotated as one piece */
const Bracket: React.FC<{ang: number}> = ({ang}) => (
  <g transform={`rotate(${ang})`}>
    <path d="M-12,0 L-12,-120 L70,-120 L70,-96 L12,-96 L12,0 Z" fill="#B9C2CC" stroke="#0B0D14" strokeWidth={5} strokeLinejoin="round" />
    {[-100, -60, -20].map((yy) => <circle key={yy} cx={0} cy={yy} r={5} fill="#5A616B" />)}
  </g>
);
// 65.75 - 70.0 "That matters because flexible skin moves differently from a rigid metal part.": the workbench. She
// pulls a tab on a clamped silicone sheet and the whole area around it stretches with it; then she lifts a metal
// bracket and turns it: it moves as one piece, nothing on it bends.
export const S1Material: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.skin, b = K.pull;
  const A = {x: 1260, y: groundFor(390, 2.0), scale: 2.0};
  const sheet = {x: 260, y: 640, w: 820, h: 300};
  const p0 = {x: 880, y: 800};
  const pull = 140 * ss(t, T('flexible') + 0.05, T('flexible') + 0.6) * (1 - ss(t, T('rigid') - 0.5, T('rigid') - 0.1));
  const dir = {x: 1, y: 0.12};
  const tab = {x: p0.x + dir.x * pull, y: p0.y + dir.y * pull};
  const lift = ss(t, T('rigid') - 0.3, T('rigid') + 0.2);
  const turn = 50 * ss(t, T('metal part.') - 0.2, T('metal part.') + 0.5);
  const cam = camPath(f, [[a, {x: 760, y: 620, z: 1.25}], [T('rigid') - 0.3, {x: 820, y: 600, z: 1.25}], [b, {x: 1120, y: 470, z: 1.22}]], sm3);
  const rhand = lift > 0.5 ? {x: 1150, y: 520} : {x: tab.x + 8, y: tab.y - 6};
  return (
    <g>
      <Shop cam={cam} depth={2.4} veil={0.3} dx={-300} dy={240} />
      <Layer cam={cam} depth={1}>
        {(() => {
          const pose = P({lookX: lift > 0.5 ? -0.2 : -0.8, lookY: lift > 0.5 ? -0.2 : 0.7, brows: 0.3, mouth: 'smile', lean: -6 * (1 - lift), armL: reach(A, -1, rhand.x, rhand.y), armR: {a: 12, b: 20}});
          return (
            <g>
              <CrewChar look={CAST.checker} pose={pose} frame={f} seed={51} x={A.x} y={A.y} scale={A.scale} shadow={false} life={0.4} front="L" pass="body" />
              <rect x={-600} y={600} width={2400} height={40} fill="#B98A57" stroke="#20262D" strokeWidth={4} />
              <rect x={-600} y={640} width={2400} height={900} fill="#A77A4A" />
              <SiliconeSheet x={sheet.x} y={sheet.y + 40} w={sheet.w} h={sheet.h} p0={p0} dir={dir} pull={pull} />
              <circle cx={tab.x} cy={tab.y} r={12} fill="#E8B04A" stroke="#0B0D14" strokeWidth={4} opacity={1 - lift} />
              <CrewChar look={CAST.checker} pose={pose} frame={f} seed={51} x={A.x} y={A.y} scale={A.scale} holdL={lift > 0.5 ? <Bracket ang={-turn} /> : undefined} shadow={false} life={0.4} front="L" pass="frontArm" />
            </g>
          );
        })()}
      </Layer>
    </g>
  );
};
// 73.32 - 77.15 "The controller has to work with the face it actually has.": back on the bench, the face itself; the
// laptop beside it shows its own face as the controller sees it, and a smile forms on both at once
export const S3Controller: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.controller, b = K.once;
  const R = {x: 1120, y: 420, s: 2.4};
  const st = view(rob2(f), -24, -0.4, 0.1);
  const cam = drift(f, a, b, {x: 900, y: 520, z: 1.12}, {x: 980, y: 505, z: 1.2});
  const B = {x: 1640, y: groundFor(470, 1.6), scale: 1.6};
  const nod = 4 * Math.sin(Math.max(0, t - a - 2.0) * 5) * ss(t, a + 2.0, a + 2.3) * (1 - ss(t, a + 3.0, a + 3.4));
  return (
    <g>
      <Shop cam={cam} dx={-600} />
      <Layer cam={cam} depth={1}>
        <CrewChar look={CAST.honest} pose={P({lookX: -0.8, lookY: 0.1, brows: 0.2, mouth: 'smile', tilt: nod, armL: {a: 14, b: 30}, armR: {a: 10, b: 20}})} frame={f} seed={53} x={B.x} y={B.y} scale={B.scale} shadow={false} life={0.6} />
        <StandHead id="s3c" st={st} x={R.x} y={R.y} s={R.s} />
        <Workbench x0={-500} x1={2500} y={SHOP_BENCH} />
        <Laptop id="s3c-lt" x={250} y={470} w={380} h={240}>
          <rect x={0} y={0} width={380} height={240} fill="#1B2430" />
          <Robot id="s3c-mini" st={{...st, yaw: 0, gx: 0, gy: 0}} x={190} y={120} s={0.42} />
        </Laptop>
      </Layer>
    </g>
  );
};
// 77.15 - 79.47 "Once it had a way to control its own appearance,": the robotics lab, wide, much bigger than the
// corner we have seen: an arm stacking blocks, a small rover crossing the floor, another head on a stand; ours turns
// away from its mirror
export const L1BigLab: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.once, b = T('researchers gave');
  const cam = drift(f, a, b, {x: 760, y: 520, z: 1.0}, {x: 1060, y: 520, z: 1.04});
  const k = ss(t, a + 0.4, a + 1.8);
  const st = {...rob2(f), yaw: lerp(150, 60, k), gx: lerp(0, 0.4, k)};
  const R = {x: 560, y: 470, s: 1.2};
  // the arm: shoulder angle and elbow cycle (pick, lift, place)
  const ph = (t * 0.55) % 1;
  const sh = -40 + 50 * Math.sin(ph * Math.PI * 2), el = 60 + 30 * Math.cos(ph * Math.PI * 2);
  const ax = 1250, ay = 640;
  const j1 = {x: ax + 150 * Math.cos((sh - 90) * Math.PI / 180), y: ay + 150 * Math.sin((sh - 90) * Math.PI / 180)};
  const j2 = {x: j1.x + 120 * Math.cos((sh - 90 + el) * Math.PI / 180), y: j1.y + 120 * Math.sin((sh - 90 + el) * Math.PI / 180)};
  const rx = -200 + ((t - a) * 240) % 2600;
  const other = {...rob2(f), yaw: -30, gx: -0.4, smile: 0.5 + 0.4 * Math.sin(t * 2.2), brow: 0.4 * Math.sin(t * 1.7), open: 0.2 * Math.max(0, Math.sin(t * 3.1))};
  return (
    <g>
      <Layer cam={cam} depth={1.8}>
        <Back id="bl-bk" bg="lab" veil={0.12} dx={-300} dy={60} s={0.85} />
      </Layer>
      <Layer cam={cam} depth={1}>
        {/* the mirror stand at the left */}
        <rect x={180} y={170} width={210} height={430} rx={6} fill="#C9D3D2" stroke="#2B313A" strokeWidth={6} />
        <path d="M200,190 l60,0 l-60,140 Z" fill="#FFF" opacity={0.35} />
        <rect x={-300} y={610} width={2700} height={22} fill="#C3976A" stroke="#2B313A" strokeWidth={4} />
        <rect x={-300} y={632} width={2700} height={200} fill="#A97C50" />
        <RobotSupport id="bl-sup" x={R.x} y={R.y} s={R.s} yaw={st.yaw} postLen={(610 - R.y) / R.s - 206} />
        <Robot id="bl-r" st={st} x={R.x} y={R.y} s={R.s} />
        {/* the arm */}
        <rect x={ax - 70} y={ay - 30} width={140} height={40} rx={8} fill="#E0A63A" stroke="#20262D" strokeWidth={5} />
        <path d={`M${ax},${ay - 20} L${j1.x},${j1.y} L${j2.x},${j2.y}`} fill="none" stroke="#20262D" strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M${ax},${ay - 20} L${j1.x},${j1.y} L${j2.x},${j2.y}`} fill="none" stroke="#E8B04A" strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={j1.x} cy={j1.y} r={20} fill="#5A616B" stroke="#20262D" strokeWidth={4} />
        <rect x={j2.x - 22} y={j2.y - 8} width={44} height={30} rx={6} fill="#5A616B" stroke="#20262D" strokeWidth={4} />
        {[0, 1, 2].map((i) => <rect key={i} x={1420 + i * 4} y={560 - i * 48} width={60} height={46} rx={4} fill={['#3E86B5', '#C8483A', '#5E9C6E'][i]} stroke="#20262D" strokeWidth={4} />)}
        {/* another head on a stand, practising */}
        <RobotSupport id="bl-sup2" x={1820} y={460} s={0.95} yaw={-30} postLen={(610 - 460) / 0.95 - 206} />
        <Robot id="bl-r2" st={other} x={1820} y={460} s={0.95} />
      </Layer>
      {/* the rover on the floor, crossing in front */}
      <Layer cam={cam} depth={0.85}>
        <g transform={`translate(${rx} 900)`}>
          <rect x={-80} y={-60} width={160} height={60} rx={14} fill="#D9DDE2" stroke="#20262D" strokeWidth={5} />
          <rect x={-30} y={-90} width={60} height={34} rx={8} fill="#2B333C" stroke="#20262D" strokeWidth={4} />
          <circle cx={-10} cy={-74} r={8} fill="#7FD6FF" />
          {[-50, 50].map((wx) => <g key={wx}><circle cx={wx} cy={4} r={26} fill="#2B333C" stroke="#20262D" strokeWidth={4} /><line x1={wx} y1={4} x2={wx + 18 * Math.cos(t * 9)} y2={4 + 18 * Math.sin(t * 9)} stroke="#9AA3AD" strokeWidth={4} /></g>)}
        </g>
      </Layer>
    </g>
  );
};

// ================================================================== the studio, the stage again
// 112.33 - 115.48 "The meaning of those words wasn't required for the lip movements.": in the studio it keeps time
// with a recording in a language nobody here speaks; through the control-room glass the sound engineer listens,
// shrugs and smiles: he does not understand it either
export const R4Studio: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.meaning, b = K.distinction;
  const cam = drift(f, a, b, {x: 900, y: 500, z: 1.06}, {x: 940, y: 495, z: 1.12});
  const st = {...view(rob2(f), -30, -0.5, 0.0), lid: 0.2, blink: 0};
  const shrug = ss(t, a + 1.3, a + 1.7) * (1 - ss(t, a + 2.5, a + 2.9));
  const E = {x: 520, y: groundFor(-10, 1.0), scale: 1.0};
  return (
    <g>
      <Layer cam={cam} depth={1.7}>
        <g transform="translate(-700 220)">
          <StudioBack veil={0.04} />
          {/* inside the control-room window: the engineer, headphones on, at the desk */}
          <defs><clipPath id="r4s-win"><rect x={1070} y={-180} width={660} height={340} /></clipPath></defs>
          <g clipPath="url(#r4s-win)">
            <CrewChar look={CAST.clerkA} pose={P({lookX: 0.6, lookY: 0.2, brows: 0.2 + 0.5 * shrug, mouth: shrug > 0.5 ? 'smirk' : 'hmm', tilt: 8 * shrug, armL: {a: 10 + 50 * shrug, b: 30 + 70 * shrug}, armR: {a: 10 + 50 * shrug, b: 30 + 70 * shrug}})} frame={f} seed={61} x={1400} y={400} scale={E.scale} shadow={false} life={0.6} />
            <rect x={1080} y={120} width={640} height={60} fill="#2B3742" />
          </g>
        </g>
      </Layer>
      <Layer cam={cam} depth={1}>
        <RobotSupport id="r4s-sup" x={1260} y={430} s={2.3} yaw={st.yaw} postLen={600} />
        <Robot id="r4s-r" st={st} x={1260} y={430} s={2.3} />
        <StudioMic x={900} y={560} s={1.25} flip />
      </Layer>
    </g>
  );
};
/** the stage seen from the audience: the robot on its plinth, the people in front */
const StageWide: React.FC<{f: number; cam: Cam; t0: number; st: RobotState; showVisitor?: boolean}> = ({f, cam, t0, st, showVisitor = false}) => {
  const t = f / 30;
  const R = {x: 860, y: 430, s: 1.25};
  const v = vis2(f);
  return (
    <g>
      <Hall cam={cam} t={t} depth={1.8} veil={0.04} dx={0} dy={80} />
      <Layer cam={cam} depth={1}>
        <rect x={R.x - 70} y={560} width={140} height={90} rx={10} fill="#262C44" stroke="#05070F" strokeWidth={5} />
        <RobotSupport id="sw-sup" x={R.x} y={R.y} s={R.s} yaw={st.yaw} postLen={(560 - R.y) / R.s - 206} />
        <Robot id="sw-r" st={st} x={R.x} y={R.y} s={R.s} />
        {showVisitor && <Visitor id="sw-v" hx={1210} hy={405} s={1.22} expr={v.expr} blink={v.blink} pose={{turn: 0.85, lTv: 120, torso: 6}} />}
        {!showVisitor && <rect x={1130} y={520} width={130} height={130} rx={10} fill="#3B2F25" stroke="#05070F" strokeWidth={5} />}
        {!showVisitor && <circle cx={1195} cy={600} r={34} fill="#1A1410" stroke="#5A4A3A" strokeWidth={3} />}
        <StageLip y={650} />
      </Layer>
      <Layer cam={cam} depth={0.82}>
        <Crowd f={f} t0={t0} />
      </Layer>
    </g>
  );
};
// 115.48 - 117.61 "Which gives us a useful distinction:": back at the demonstration: on stage it lip-syncs to a
// recording from the speaker beside it; the audience watches its mouth
export const D1Stage: React.FC<{f: number}> = ({f}) => {
  const a = K.distinction, b = T('looking as though');
  const cam = drift(f, a, b, {x: 960, y: 520, z: 1.02}, {x: 940, y: 500, z: 1.14});
  return <StageWide f={f} cam={cam} t0={a + 0.3} st={{...rob2(f), yaw: 20, gx: 0.2}} />;
};
// 119.15 - 120.95 "and understanding what you are saying": in the audience, one of them listens to the words, head
// on one side, and frowns: the words are the part that needs understanding
export const D3Listener: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = T('and understanding'), b = T('are different');
  const cam = drift(f, a, b, {x: 960, y: 470, z: 1.0}, {x: 965, y: 462, z: 1.04});
  const k = ss(t, a + 0.3, a + 0.9);
  return (
    <g>
      <Hall cam={cam} t={t} depth={2.6} veil={0.45} dx={-200} dy={60} />
      <Layer cam={cam} depth={1}>
        <CrewChar look={CAST.person} pose={P({lookX: -0.5, lookY: -0.2, brows: -0.25 * k, browAsym: 0.6 * k, mouth: k > 0.5 ? 'hmm' : 'flat', tilt: -8 * k, armL: {a: 10, b: 20}, armR: {a: 10 + 30 * k, b: 20 + 120 * k}})} frame={f} seed={63} x={960} y={groundFor(470, 2.9)} scale={2.9} shadow={false} life={0.4} />
      </Layer>
    </g>
  );
};
// 120.95 - 122.51 "are different problems.": behind it on the stage, looking out over the audience
export const D4Stage: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = T('are different'), b = K.flaws;
  const cam = drift(f, a, b, {x: 960, y: 560, z: 1.0}, {x: 1000, y: 550, z: 1.06});
  const st = {...rob2(f), yaw: 160};
  return (
    <g>
      <Hall cam={cam} t={t} depth={2.4} veil={0.5} dx={0} dy={300} />
      <Layer cam={cam} depth={1.2}>
        <rect x={-800} y={640} width={3600} height={800} fill="#0B0E19" />
        <g transform="translate(0 -40)"><Crowd f={f} t0={a - 3} /></g>
      </Layer>
      <Layer cam={cam} depth={0.85}>
        <rect x={-800} y={900} width={3600} height={400} fill="#1A2036" />
        <RobotSupport id="d4s-sup" x={520} y={640} s={3.0} yaw={st.yaw} postLen={200} />
        <Robot id="d4s-r" st={st} x={520} y={640} s={3.0} />
      </Layer>
    </g>
  );
};
// 130.15 - 132.32 "when you're watching a mouth.": in the audience, someone leans in and narrows their eyes at its
// mouth
export const F5Squint: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = T('when you’re watching'), b = K.another;
  const cam = drift(f, a, b, {x: 960, y: 450, z: 1.12}, {x: 950, y: 440, z: 1.22});
  const k = ss(t, a + 0.1, a + 0.6);
  return (
    <g>
      <Hall cam={cam} t={t} depth={2.6} veil={0.45} dx={300} dy={60} />
      <Layer cam={cam} depth={1}>
        <CrewChar look={CAST.checker} pose={P({lookX: 0.6, lookY: -0.1, brows: -0.5 * k, mouth: 'hmm', lean: 6 * k, tilt: 4 * k, blink: 1 - 0.55 * k, armL: {a: 10, b: 20}, armR: {a: 10, b: 20}})} frame={f} seed={65} x={960} y={groundFor(470, 2.9)} scale={2.9} shadow={false} life={0.3} eyeDarts={false} />
      </Layer>
    </g>
  );
};

// ================================================================== the 2024 study, face to face in the test bay
/** the bay with the robot on its stand (left) and the participant across a small table (right) */
const BayPair: React.FC<{f: number; cam: Cam; nod?: number; rx?: number}> = ({f, cam, nod = 0, rx = 760}) => {
  const t = f / 30;
  const st = {...rob2(f), yaw: 52, gx: 0.45, gy: 0.05};
  const e = screenFaceAt(f);
  const B = {x: 230, y: groundFor(500, 1.35), scale: 1.35};
  return (
    <g>
      <Bay cam={cam} depth={1.9} dx={100} />
      <Layer cam={cam} depth={1}>
        <CrewChar look={CAST.clerkB} pose={P({lookX: 0.8, lookY: 0, brows: 0.15 + 0.3 * nod, mouth: nod > 0.5 ? 'smile' : 'flat', tilt: 3 * Math.sin(t * 5) * nod, armL: reach(B, -1, 160, BAY_DESK - 70), armR: reach(B, 1, 330, BAY_DESK - 70)})} frame={f} seed={71} x={B.x} y={B.y} scale={B.scale} front="R" pass="body" shadow={false} life={0.5} />
        <rect x={-500} y={BAY_DESK + 20} width={900} height={700} fill="#8E989F" stroke="#0B0D14" strokeWidth={4} />
        <Console x={-30} y={BAY_DESK} knobs={[0.4, 0.6, 0.5, 0.3]} />
        <CrewChar look={CAST.clerkB} pose={P({lookX: 0.8, lookY: 0, armL: reach(B, -1, 160, BAY_DESK - 70), armR: reach(B, 1, 330, BAY_DESK - 70)})} frame={f} seed={71} x={B.x} y={B.y} scale={B.scale} front="R" pass="frontArm" shadow={false} life={0.5} />
        <TestHead id="bp" st={st} x={rx} y={440} s={1.7} />
        <Visitor id="bp-v" hx={1330} hy={430} s={1.75} expr={{...e, gx: -0.75, gy: 0.02}} blink={0} pose={{turn: 0.85, lTv: 120, torso: 5}} />
        <ellipse cx={1060} cy={760} rx={180} ry={26} fill="#D9DDE2" stroke="#0B0D14" strokeWidth={4} />
        <rect x={1052} y={770} width={16} height={110} fill="#8E989F" stroke="#0B0D14" strokeWidth={3} />
      </Layer>
    </g>
  );
};
// 147.6 - 152.84 "That timing problem was the focus of the team's earlier study, published in 2024.": the test bay,
// set for the timing experiment: a participant sits across a small table from the head; the researcher at her
// console starts the session
export const Y1Bay: React.FC<{f: number}> = ({f}) => {
  const a = K.study24, b = K.watched;
  const cam = drift(f, a, b, {x: 820, y: 520, z: 1.0}, {x: 1000, y: 505, z: 1.1});
  return (
    <g>
      <BayPair f={f} cam={cam} />
      <Tag x={90} y={110} text="Earlier study · Science Robotics · 2024" k={pr(f, T('earlier study,') - 0.1, T('earlier study,') + 0.3)} size={30} />
    </g>
  );
};
// 165.47 - 171.03 "The team reported predicting an approaching smile about eight hundred and forty milliseconds ahead of
// its appearance, allowing the robot to try to smile alongside the person.": face to face, side on. The camera is
// on him as his smile begins; it moves to the robot, whose smile starts while his is still on its way; it pulls back
// as both reach the full smile together.
export const Y7Face: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.ms840, b = T('allowing the robot');
  const cam = camPath(f, [[a, {x: 1260, y: 450, z: 2.0}], [CO24.predict - 0.5, {x: 1250, y: 455, z: 2.0}], [CO24.predict + 0.4, {x: 720, y: 465, z: 2.0}], [CO24.full - 0.4, {x: 730, y: 465, z: 2.0}], [b, {x: 990, y: 462, z: 1.45}]], sm3);
  const e = screenFaceAt(f);
  return <ProfileTwo id="y7f" cam={cam} robot={rob2(f)} vis={{expr: {...e, gx: -0.75, gy: 0.02}, blink: 0}} rTurn={64} backLayer={<g transform="translate(-300 160) scale(1.05)"><TestBayBack veil={0.2} /></g>} />;
};
// 171.03 - 174.29 "allowing the robot to try to smile alongside the person.": the bay again, wider: both smiling; the
// researcher, watching, smiles and nods
export const Y8Bay: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = T('allowing the robot'), b = K.less;
  const cam = drift(f, a, b, {x: 960, y: 510, z: 1.12}, {x: 990, y: 505, z: 1.18});
  return <BayPair f={f} cam={cam} nod={ss(t, a + 0.8, a + 1.3)} />;
};
// 180.9 - 183.19 "These were studies of facial movement.": from the smile on the head, one pull back: the stand, the
// table, the console, the camera on its tripod, the window into the control room: an experiment
export const G4Review: React.FC<{f: number}> = ({f}) => {
  const a = K.these, b = T('A successful');
  const cam = camPath(f, [[a, {x: 820, y: 470, z: 2.2}], [b, {x: 960, y: 500, z: 0.98}]], (x) => 1 - Math.pow(1 - x, 3));
  return <BayPair f={f} cam={cam} />;
};

// ================================================================== possible futures: a video call
/** the call window: the far side's picture (children, drawn in a 1920 x 1080 frame) in a rounded frame */
const CallFrame: React.FC<{id: string; x: number; y: number; w: number; children: React.ReactNode; self?: React.ReactNode}> = ({id, x, y, w, children, self}) => {
  const h = (w * 9) / 16, sc = w / 1920;
  return (
    <g>
      <defs><clipPath id={`${id}-c`}><rect x={x} y={y} width={w} height={h} rx={14 * sc * 3} /></clipPath></defs>
      <rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} rx={20} fill="#10151B" />
      <g clipPath={`url(#${id}-c)`}>
        <g transform={`translate(${x} ${y}) scale(${sc})`}>{children}</g>
      </g>
      {self}
    </g>
  );
};
/** what the far side of the call shows: a robotic assistant (the research head) in an office */
const FarSide: React.FC<{f: number; st: RobotState; z?: number}> = ({f, st, z = 1}) => (
  <g>
    <rect x={0} y={0} width={1920} height={1080} fill="#DDE5EA" />
    <rect x={1200} y={120} width={520} height={420} rx={10} fill="#C9DCE4" stroke="#8FA3A8" strokeWidth={6} />
    <rect x={0} y={860} width={1920} height={220} fill="#A9B4BA" />
    <g transform={`translate(960 600) scale(${z}) translate(-960 -600)`}>
      <RobotSupport id="fs-sup" x={960} y={470} s={2.9} yaw={st.yaw} postLen={400} />
      <Robot id="fs-r" st={st} x={960} y={470} s={2.9} />
    </g>
  </g>
);
const VOICE5 = SPEECH(T('Its mouth follows') - 0.2, T('and its expression') + 0.4, 23);
// 189.25 - 191.99 "You're speaking. A machine looks toward you.": at home, on a video call. He talks to the laptop;
// on its screen the assistant has been looking down, and lifts its eyes to him
export const VC1Call: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.speaking, b = T('Its mouth follows');
  const lk = ss(t, T('A machine looks') + 0.1, T('A machine looks') + 0.6);
  const st = {...rob2(f), yaw: 0, gx: 0, gy: lerp(0.4, 0, lk), lid: lerp(0.3, 0.16, lk), smile: 0.1 + 0.15 * lk, brow: 0.2 * lk};
  const v = vis2(f);
  const cam = drift(f, a, b, {x: 900, y: 520, z: 1.05}, {x: 820, y: 510, z: 1.16});
  return (
    <g>
      <Layer cam={cam} depth={2.2}>
        <g transform="translate(-500 100)"><HomeBack veil={0.1} /></g>
      </Layer>
      <Layer cam={cam} depth={1}>
        <rect x={-400} y={760} width={1900} height={30} fill="#C69361" stroke="#0B0D14" strokeWidth={4} />
        <rect x={-390} y={790} width={1880} height={600} fill="#A97C50" />
        <Laptop id="vc1-lt" x={260} y={340} w={600} h={338}>
          <g transform={`scale(${600 / 1920})`}><FarSide f={f} st={st} /></g>
        </Laptop>
        <Visitor id="vc1-v" hx={1380} hy={430} s={2.0} expr={{...v.expr, gx: -0.75}} blink={v.blink} pose={{turn: 0.82, lTv: 120, torso: 6}} />
      </Layer>
      <Tag x={90} y={110} text="Possible future · illustration" k={1} size={30} />
    </g>
  );
};
// 191.99 - 193.67 "Its mouth follows its voice,": the call, full screen: the assistant answers; its lips follow its
// own voice; his small self-view in the corner
export const VC2Screen: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = T('Its mouth follows'), b = T('and its expression');
  const st = {...rob2(f), yaw: 0, gx: 0, gy: 0, ...robotVis(t, VOICE5, 0.06)};
  const v = vis2(f);
  const cam = drift(f, a, b, {x: 960, y: 540, z: 1.0}, {x: 960, y: 560, z: 1.08});
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#10151B" />
      <Layer cam={cam} depth={1}>
        <CallFrame id="vc2" x={60} y={34} w={1800} self={
          <g>
            <defs><clipPath id="vc2-self"><rect x={1490} y={760} width={320} height={180} rx={14} /></clipPath></defs>
            <rect x={1484} y={754} width={332} height={192} rx={18} fill="#10151B" />
            <g clipPath="url(#vc2-self)">
              <rect x={1490} y={760} width={320} height={180} fill="#E9D7B5" />
              <Head id="vc2-h" c={{x: 1650, y: 880}} R={70} roll={0} turn={0.1} expr={{...v.expr, gx: 0, gy: 0}} blink={v.blink} inkW={4} />
            </g>
          </g>
        }>
          <FarSide f={f} st={st} z={1.35} />
        </CallFrame>
      </Layer>
    </g>
  );
};
// 193.67 - 196.18 "and its expression changes as yours does.": the call's gallery view: him and the assistant side by
// side; he smiles, and its smile arrives with his
export const VC3Gallery: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = T('and its expression'), b = K.tutor;
  const v = vis2(f);
  const sm = ss(t, T('as yours does.') - 0.3, T('as yours does.') + 0.4);
  const hs = mixExpr({...v.expr, gx: 0, gy: 0}, {...VX.smile, gx: 0, gy: 0}, ss(t, a + 0.3, T('as yours does.') + 0.2));
  const st = {...rob2(f), yaw: 0, gx: 0, gy: 0, smile: 0.1 + 0.85 * sm, wide: 0.3 * sm, lid: 0.16 + 0.12 * sm, brow: 0.3 * sm, open: 0.05 * sm};
  const cam = drift(f, a, b, {x: 960, y: 540, z: 1.0}, {x: 960, y: 540, z: 1.06});
  const W = 880, H = (W * 9) / 16;
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#10151B" />
      <Layer cam={cam} depth={1}>
        <defs>
          <clipPath id="vc3-a"><rect x={60} y={292} width={W} height={H} rx={18} /></clipPath>
          <clipPath id="vc3-b"><rect x={980} y={292} width={W} height={H} rx={18} /></clipPath>
        </defs>
        <g clipPath="url(#vc3-a)">
          <rect x={60} y={292} width={W} height={H} fill="#E9D7B5" />
          <rect x={60} y={292 + H * 0.7} width={W} height={H * 0.3} fill="#C69361" />
          <Head id="vc3-h" c={{x: 500, y: 560}} R={190} roll={0} turn={0.08} expr={hs} blink={v.blink} inkW={9} />
        </g>
        <g clipPath="url(#vc3-b)">
          <g transform={`translate(980 292) scale(${W / 1920})`}><FarSide f={f} st={st} z={1.5} /></g>
        </g>
      </Layer>
      <Tag x={90} y={110} text="Possible future · illustration" k={1} size={30} />
    </g>
  );
};

// ================================================================== the finale, back on the stage
// 206.5 - 208.09 "Watch the smile again.": the stage, from the audience: the two of them face to face in the
// spotlight; his smile begins
export const Z1Stage: React.FC<{f: number}> = ({f}) => {
  const a = K.again, b = K.learned;
  const cam = drift(f, a, b, {x: 960, y: 520, z: 1.0}, {x: 1000, y: 470, z: 1.32});
  return <StageWide f={f} cam={cam} t0={b - 0.1} st={{...rob2(f), yaw: 40, gx: 0.55}} showVisitor />;
};
// 208.09 - 209.98 "The robot has learned a movement.": side on, close: its smile arrives with his; he leans in,
// delighted
export const Z2Pair: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.learned, b = K.deciding;
  const lean = ss(t, a + 0.2, a + 1.0);
  const cam = drift(f, a, b, {x: 995, y: 466, z: 1.5}, {x: 990, y: 460, z: 1.62});
  return <ProfileTwo id="z2p" cam={cam} robot={rob2(f)} vis={vis2(f)} rTurn={62} vx={1290 - 30 * lean} vPose={{torso: 4 + 10 * lean, neck: -3 - 5 * lean}} backLayer={<g transform="translate(-200 160) scale(1.05)"><DemoBack t={t} veil={0.18} /></g>} />;
};
// 209.98 - end "You're the one deciding what it means.": the face-off from the first frame, both smiling now; the
// camera settles on it, and as the last words land the robot's eyes leave him and come to us
export const Z3Final: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.deciding;
  const look = ss(t, a + 1.6, a + 2.1);
  const base = rob2(f);
  // the last image: a settled, warm smile (no speech shape), eyes coming to us
  const st = {...base, yaw: 24, gx: lerp(0.5, -0.22, look), gy: 0, smile: Math.max(0.72, base.smile * 0.9), open: 0.04, round: 0, press: 0, wide: 0.2, brow: 0.15 + 0.25 * look, lid: 0.2};
  const v = vis2(f);
  const cam = camPath(f, [[a, {x: 960, y: 520, z: 1.12}], [a + 2.4, {x: 935, y: 518, z: 1.4}], [a + 3.4, {x: 920, y: 520, z: 1.46}]], sm3);
  const R = {x: 640, y: 540, s: 3.0};
  return (
    <g>
      <Hall cam={cam} t={t} depth={2.6} veil={0.42} dx={-80} dy={140} />
      <Layer cam={cam} depth={1}>
        <RobotSupport id="z3f-sup" x={R.x} y={R.y} s={R.s} yaw={st.yaw} postLen={260} />
        <Robot id="z3f-r" st={st} x={R.x} y={R.y} s={R.s} />
      </Layer>
      <Layer cam={cam} depth={0.96}>
        <Visitor id="z3f-v" hx={1350} hy={490} s={2.7} expr={v.expr} blink={v.blink} pose={{turn: 0.72, lTv: 120, torso: 6, neck: -4}} />
      </Layer>
    </g>
  );
};

// ================================================================== V6 pacing fixes
// 61.12 - 63.41 "Move these motors, get this mouth shape.": instead of a third reflection close-up, the mirror from
// beside the robot: its head in the foreground turns slightly as it works, and in the glass the motors for that shape
// show through
export const P4Mirror: React.FC<{f: number}> = ({f}) => {
  const a = K.moveThese, b = K.change;
  const cam = drift(f, a, b, {x: 1010, y: 445, z: 1.62}, {x: 1080, y: 440, z: 1.82});
  const xr = pr(f, a, a + 0.3) * (1 - pr(f, T('get this') + 0.4, T('get this') + 0.7));
  return <MirrorSet2 id="p4m" cam={cam} st={rob2(f)} reflXray={0.7 * xr} reflHot={['corner', 'cheek', 'lip']} />;
};
// 122.51 - 124.54 "The movements still had flaws.": on the stage it keeps speaking; the camera moves in from the stage
// to its mouth (the shot that follows is the close comparison)
export const F1Stage: React.FC<{f: number}> = ({f}) => {
  const a = K.flaws, b = T('The team reported');
  const cam = camPath(f, [[a, {x: 880, y: 470, z: 1.5}], [b, {x: 872, y: 520, z: 3.2}]], sm3);
  return <StageWide f={f} cam={cam} t0={a - 6} st={{...rob2(f), yaw: 14, gx: 0.1}} />;
};
