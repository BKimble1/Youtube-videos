// Engine tests (V2 liquid-metal engine, robot2, labFigure).
//   cd source; export TMPDIR=/dev/shm/v2_engine/tmp
//   npx remotion still src/v2/test/engine.entry.tsx Basic /tmp/claude-0/v2_engine/shm/basic.png --frame=0 --log=error
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {C} from '../../art/palette';
import {resetIds, uid} from '../../core/ids';
import {ChromeBody, ChromeSurface, HandoffBlob} from '../liquid/Chrome';
import {LabFigure, labPoolCircle} from '../labFigure';
import {floorPrims, puddle, streamThroughGaps} from '../liquid/flow';
import {projectPrims} from '../liquid/sdf';
import {project} from '../../world';
import {Prim} from '../liquid/sdf';
import {camLook, gripPose, HERO, HERO_BASE, heroCam, heroPose, heroState, Robot2, Robot2Pose} from '../robot2';
import {POSE_ANNOYED, POSE_IDLE, POSE_SMUG, POSE_SURPRISED, Robot} from '../../art/robot';
void POSE_SURPRISED;
import {Cam3} from '../../world';
import {Bars, JailBack} from '../../art/jail';
import {ss} from '../../lib';

// the hook squeeze staging lives in robot2.tsx (HERO, heroState, heroCam, heroPose, camLook); re-exported here
export {camLook, HERO, heroCam, heroPose, heroState};

// ---- (1) HeroSqueeze: the hook mechanics in a close jail camera (2.0 s)
const HeroSqueeze: React.FC<{t0?: number; solo?: boolean; view?: 'hero' | 'side' | 'top'}> = ({t0 = 0, solo = false, view = 'hero'}) => {
  const t = t0 + useCurrentFrame() / FPS;
  // debug views: 'side' looks along +x (d runs left -> right: outside on the left), 'top' looks straight down
  const cam = view === 'side' ? {x: -60, h: 7, d: -1, yaw: 90, pitch: 0, f: 3300} : view === 'top' ? {x: 0.5, h: 60, d: -1, yaw: 0, pitch: 89.9, f: 3300} : heroCam(t);
  const pose = heroPose(t);
  const st = heroState(t);
  const base = HERO_BASE;
  if (solo)
    return (
      <Frame tag="hs">
        <Bg />
        <Robot2 cam={cam} t={t} base={base} pose={pose} state={st} part="all" />
      </Frame>
    );
  return (
    <Frame tag="hs">
      <JailBack c={cam} t={t} alarm={0.6} />
      <Robot2 cam={cam} t={t} base={base} pose={pose} state={st} part="back" d0={0} env={{tint: C.red, amt: 0.3}} />
      <Bars c={cam} t={t} door={0} alarm={0.6} />
      <Robot2 cam={cam} t={t} base={base} pose={pose} state={st} part="front" d0={0} env={{tint: C.red, amt: 0.3}} />
    </Frame>
  );
};

const FPS = 30;
const Bg: React.FC<{c0?: string; c1?: string}> = ({c0 = C.navy2, c1 = C.navy0}) => {
  const id = uid('bg');
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c0} />
          <stop offset="1" stopColor={c1} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${id})`} />
    </>
  );
};
const Frame: React.FC<{children: React.ReactNode; tag: string}> = ({children, tag}) => {
  resetIds(tag);
  return (
    <AbsoluteFill style={{background: C.navy0}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        {children}
      </svg>
    </AbsoluteFill>
  );
};

const Basic: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const a: Prim[] = [
    {k: 'c', x: 330, y: 420, r: 170},
    {k: 'c', x: 520 + 40 * Math.sin(t * 2), y: 520, r: 110},
  ];
  const b: Prim[] = [
    {k: 'cap', ax: 700, ay: 300, bx: 900, by: 700, ra: 90, rb: 40},
    {k: 'box', x: 760, y: 900, hw: 160, hh: 90, r: 40, rot: 12},
  ];
  const c: Prim[] = [
    {k: 'trap', x: 300, y: 1100, wt: 170, wb: 110, hh: 150, r: 30, rot: 0},
    {k: 'ell', x: 300, y: 880, rx: 140, ry: 100, rot: 0},
  ];
  const d: Prim[] = [
    {k: 'c', x: 1040, y: 1300, r: 160},
    {k: 'c', x: 900, y: 1350, r: 4},
    {k: 'c', x: 860, y: 1350, r: 0},
    {k: 'cap', ax: 600, ay: 1300, bx: 600, by: 1300, ra: 30, rb: 20},
  ];
  const e: Prim[] = [{k: 'aff', x: 450, y: 1650, ux: 260, uy: 20, vx: 60, vy: 90}, {k: 'c', x: 700, y: 1640, r: 60}];
  return (
    <Frame tag="ba">
      <Bg />
      <ChromeBody prims={a} blend={80} />
      <ChromeBody prims={b} blend={60} />
      <ChromeBody prims={c} blend={30} />
      <ChromeBody prims={d} blend={40} />
      <ChromeBody prims={e} blend={60} />
    </Frame>
  );
};

const POSES2: Record<string, Robot2Pose> = {idle: POSE_IDLE, surprised: POSE_SURPRISED, annoyed: POSE_ANNOYED, smug: POSE_SMUG};
const Label: React.FC<{x: number; y: number; text: string}> = ({x, y, text}) => (
  <text x={x} y={y} fill={C.steelLit} fontSize={26} fontFamily="monospace" textAnchor="middle">{text}</text>
);
/** pose sheet: V1 robot vs V2 robot2 (rigid), medium scale; props.ecu: head close-up */
const PoseSheet: React.FC<{ecu?: boolean}> = ({ecu}) => {
  const t = useCurrentFrame() / FPS;
  const cam: Cam3 = ecu ? {x: 0, h: 8.2, d: -9, yaw: 0, pitch: 0, f: 1900} : {x: 0, h: 9.5, d: -34, yaw: 0, pitch: 0, f: 2000};
  const xs = [-5.6, 0, 5.6];
  const row1 = ['idle', 'surprised', 'annoyed'];
  const row2 = ['smug', 'grip', 'turn'];
  const poseOf = (n: string, x: number, h = -6.2): Robot2Pose =>
    n === 'grip' ? gripPose({...POSE_IDLE, eyeOpen: 1.1}, {x: x - 2.4, h: h + 7.3, d: -0.3}, {x: x + 2.4, h: h + 7.3, d: -0.3}) : n === 'turn' ? {...POSE_IDLE, headTurn: 0.5, lookX: 0.7, mood: 0.5} : POSES2[n];
  if (ecu) {
    return (
      <Frame tag="pe">
        <Bg />
        <Robot2 cam={cam} t={t} base={{x: 0, h: 0, d: 0}} pose={POSE_SMUG} />
      </Frame>
    );
  }
  return (
    <Frame tag="ps">
      <Bg />
      {row1.map((n, i) => <Robot2 key={n} cam={cam} t={t} base={{x: xs[i], h: 9.6, d: 0}} pose={poseOf(n, xs[i])} />)}
      {row2.map((n, i) => <Robot2 key={n} cam={cam} t={t} base={{x: xs[i], h: -6.2, d: 0}} pose={poseOf(n, xs[i])} />)}
      {row1.map((n, i) => <Label key={n} x={540 + xs[i] * 58.8} y={330} text={n} />)}
      {row2.map((n, i) => <Label key={n} x={540 + xs[i] * 58.8} y={1290} text={n} />)}
      <Robot x={130} y={1880} s={14} t={t} pose={POSE_IDLE} />
      <Label x={130} y={1905} text="V1" />
    </Frame>
  );
};

// ---- (3) lab figure melt series (light lab background; mm world: the figure is 10 mm tall)
const LabBg: React.FC = () => {
  const id = uid('lb');
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.labBg0} />
          <stop offset="0.55" stopColor={C.labBg1} />
          <stop offset="0.56" stopColor={C.bench} />
          <stop offset="1" stopColor={C.benchDark} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${id})`} />
    </>
  );
};
const LabMeltSheet: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const cam: Cam3 = {x: 0, h: 9, d: -60, yaw: 0, pitch: 6, f: 2400};
  const ms = [0, 0.12, 0.24, 0.36, 0.5, 0.64, 0.8, 1];
  return (
    <Frame tag="lm">
      <LabBg />
      {ms.map((m, i) => {
        const col = i % 4, row = Math.floor(i / 4);
        const base = {x: -9.9 + col * 6.6, h: row ? -16 : 6, d: 0};
        const o = project(cam, base);
        return (
          <g key={i}>
            <LabFigure cam={cam} t={t} base={base} height={10} melt={m} warm={m > 0 && m < 1 ? 0.6 : 0} floor={{y: o.y + 4, shadow: 0.35, squash: 0.18}} />
            <text x={o.x} y={o.y + 60} fill={C.navy2} fontSize={26} fontFamily="monospace" textAnchor="middle">melt {m.toFixed(2)}</text>
          </g>
        );
      })}
    </Frame>
  );
};
const LabMelt: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const m = ss(t, 0.3, 2.6);
  const cam: Cam3 = {x: 0, h: 7 - 3 * m, d: -40 + 14 * m, yaw: 0, pitch: 8 + 10 * m, f: 2300};
  return (
    <Frame tag="ln">
      <LabBg />
      <LabFigure cam={cam} t={t} base={{x: 0, h: 0, d: 0}} height={10} melt={m} warm={ss(t, 0.1, 0.5) * (1 - ss(t, 2.4, 3))} />
    </Frame>
  );
};

// ---- (4) stream through narrow cage gaps, angled overhead (mm world; bars r 0.3 mm, clear gaps 0.9 mm)
const CAGE = {xs: [-4.2, -2.8, -1.4, 0, 1.4, 2.8, 4.2], r: 0.32, h: 3.2};
const Bar: React.FC<{cam: Cam3; x: number; d: number}> = ({cam, x, d}) => {
  const a = project(cam, {x, h: 0, d}), b = project(cam, {x, h: CAGE.h, d});
  const ra = CAGE.r * a.s, rb = CAGE.r * b.s;
  const id = uid('bar');
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={a.x - ra} y1="0" x2={a.x + ra} y2="0">
          <stop offset="0" stopColor={C.steelLit} />
          <stop offset="0.35" stopColor={C.steel} />
          <stop offset="1" stopColor={C.steelDark} />
        </linearGradient>
      </defs>
      <path d={`M${a.x - ra},${a.y} L${b.x - rb},${b.y} L${b.x + rb},${b.y} L${a.x + ra},${a.y} A${ra},${ra * 0.5} 0 0 1 ${a.x - ra},${a.y} Z`} fill={`url(#${id})`} stroke={C.navy1} strokeWidth={2} />
    </g>
  );
};
const StreamCage: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const u = ss(t, 0.2, 2.8);
  const cam: Cam3 = {x: 1.6 - 0.8 * u, h: 13.5, d: -9.5 - 1.0 * u, yaw: -6 + 3 * u, pitch: 50, f: 1750};
  const start = {x: 0.3, y: 3.0, r: 2.0}; // floor coords: x -> x, y -> d (inside the cage d > 0)
  const gaps = [-0.7, 0.7].map((x) => ({x, y: 0, ax: 0, ay: -1, w: 1.4 - 2 * CAGE.r}));
  const st = streamThroughGaps({start, gaps, dest: {x: 0.9, y: -4.6}, u, t, drops: 2, squash: 1, share: [0.55, 0.45], blend: 0.42, neck: 0.4});
  const prims = projectPrims(cam, floorPrims(st.prims, 0, 0.18));
  const floorPoly = [[-8, -9], [8, -9], [8, 7], [-8, 7]].map(([x, d]) => project(cam, {x, h: 0, d}));
  const back = CAGE.xs.filter(() => true);
  return (
    <Frame tag="sc">
      <LabBg />
      <path d={'M' + floorPoly.map((p) => `${p.x},${p.y}`).join('L') + 'Z'} fill={C.bench} stroke={C.benchDark} strokeWidth={3} />
      <ChromeBody prims={prims} blend={0.5 * project(cam, {x: 0, h: 0, d: 0}).s} depthSplit={{d0: 0, part: 'back'}} specs={2} />
      {back.map((x) => <Bar key={x} cam={cam} x={x} d={0} />)}
      <ChromeBody prims={prims} blend={0.5 * project(cam, {x: 0, h: 0, d: 0}).s} depthSplit={{d0: 0, part: 'front'}} specs={2} />
      <text x={540} y={1850} fill={C.navy2} fontSize={28} fontFamily="monospace" textAnchor="middle">u {u.toFixed(2)} area {(st.area / st.target * 100).toFixed(1)}%</text>
    </Frame>
  );
};

// ---- (5) ChromeSurface + HandoffBlob
const Surface: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <Frame tag="cs">
      <ChromeSurface t={t} />
    </Frame>
  );
};
const Handoff: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const pd = puddle({x: 540, y: 1600, R: 160, squash: 0.35, t, ripple: 1});
  return (
    <Frame tag="ho">
      <rect width={1080} height={1920} fill={C.navy1} />
      <HandoffBlob t={t} />
      <ChromeBody prims={pd.prims} blend={pd.blend} R={90} />
      {pd.ripples.map((r, i) => <ellipse key={i} cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={r.op} />)}
    </Frame>
  );
};

registerRoot(() => (
  <>
    <Composition id="LabMeltSheet" component={LabMeltSheet} durationInFrames={30} fps={FPS} width={1080} height={1920} />
    <Composition id="LabMelt" component={LabMelt} durationInFrames={90} fps={FPS} width={1080} height={1920} />
    <Composition id="StreamCage" component={StreamCage} durationInFrames={90} fps={FPS} width={1080} height={1920} />
    <Composition id="Surface" component={Surface} durationInFrames={90} fps={FPS} width={1080} height={1920} />
    <Composition id="Handoff" component={Handoff} durationInFrames={90} fps={FPS} width={1080} height={1920} />
    <Composition id="HeroSqueeze" component={HeroSqueeze} durationInFrames={60} fps={FPS} width={1080} height={1920} defaultProps={{t0: 0}} />
    <Composition id="HeroSide" component={HeroSqueeze} durationInFrames={60} fps={FPS} width={1080} height={1920} defaultProps={{t0: 0, view: 'side' as const}} />
    <Composition id="HeroTop" component={HeroSqueeze} durationInFrames={60} fps={FPS} width={1080} height={1920} defaultProps={{t0: 0, view: 'top' as const}} />
    <Composition id="PoseSheet" component={PoseSheet} durationInFrames={30} fps={FPS} width={1080} height={1920} defaultProps={{ecu: false}} />
    <Composition id="Basic" component={Basic} durationInFrames={60} fps={FPS} width={1080} height={1920} />
  </>
));
