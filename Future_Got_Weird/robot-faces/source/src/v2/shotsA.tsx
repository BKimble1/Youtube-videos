// V2 shots, part 2: the mechanism, the mouths, mirror practice and the skin (20.56 - 77.15 s).
import React from 'react';
import {Head, EXPR_NEUTRAL} from '../dc/Head';
import {HAND_CLUTCH} from '../dc/Hand';
import {INK} from '../dc/ink';
import {clamp, fmt, lerp, smooth} from '../dc/math';
import {Bench, ControlBox, Shadow} from '../art/Lab';
import {Robot, RobotState, RobotSupport, RPAL} from '../art/Robot';
import {Tag, UI, Wave} from '../art/Ui';
import {VX} from '../art/Visitor';
import {Cam, camPath, Layer} from '../lib/cam';
import {pr, T} from '../lib/core';
import {BANANA, humanVis, loudSm, Track} from '../lib/visemes';
import {MIR, reflectYaw} from '../shots/MirrorSet';
import {BABBLE, BABBLE_CMD, humanMouth, K, REPLAY, replayT, TRIALS} from '../state';
import {Back, mirrorLayerCam, MirrorSet2, RobotCU} from './sets';
import {CheekSection, SkinSection} from './mech';
import {HandArm, Laptop, Panel, Plate, Puppet, RecordRow, SpeakerBox} from './props';
import {rob2, vis2} from './state2';
import {drift, e2, e3} from './shots2';

const view = (st: RobotState, yaw: number, gx?: number, gy?: number): RobotState => ({...st, yaw, gx: gx ?? st.gx, gy: gy ?? st.gy});
const CAM0: Cam = {x: 960, y: 540, z: 1};
const still = (f: number, a: number, b: number, z1 = 1.05, dx = 0, dy = 0) => drift(f, a, b, CAM0, {x: 960 + dx, y: 540 + dy, z: z1});

// ------------------------------------------------------------------ mechanism
// "At Columbia University, engineers built a flexible robotic face": the head on its bench, three-quarter profile
export const MechProfile: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 56, 0.2, 0.02);
  return (
    <g>
      <RobotCU id="mp" cam={drift(f, K.columbia, T('with twenty-six'), {x: 960, y: 560, z: 1}, {x: 930, y: 540, z: 1.1})} st={st} x={860} y={400} s={2.9} benchY={930} veil={0.12} bgDx={-200} bgDy={160} bgS={1.0} />
      <Tag x={90} y={110} text="Columbia University" k={pr(f, K.columbia + 0.2, K.columbia + 0.6)} size={30} />
      <Tag x={90} y={170} text="Illustration, not lab footage" k={pr(f, K.columbia + 0.5, K.columbia + 0.9)} size={26} tone="light" />
    </g>
  );
};
// "with twenty-six motors. That gives the face ways to move.": the lower face, both corners opened into sections
export const MechMotors: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 0, -0.1, 0.05);
  const k = pr(f, T('with twenty-six') + 0.1, T('twenty-six') + 0.5);
  return (
    <g>
      <RobotCU id="mm" cam={drift(f, T('with twenty-six'), K.combos, {x: 960, y: 470, z: 1}, {x: 960, y: 480, z: 1.06})} st={st} x={960} y={300} s={5.0} veil={0.45} bgDx={-300} cheek={{k, side: -1, r: 1.2}} over={<g transform={`translate(960 300) scale(5)`}><CheekSection id="mm-ck2" st={st} k={k} side={1} r={1.2} hot={false} /></g>} />
      <Tag x={90} y={980} text="26 motors in the face · four shown" k={pr(f, T('twenty-six') + 0.2, T('twenty-six') + 0.6)} size={28} />
    </g>
  );
};
/** the eight channels shown as physical sliders on a control desk; values follow each untrained combination */
const sliderVals = (t: number) => {
  let v = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
  BABBLE.forEach(([t0], i) => {
    const k = smooth(clamp((t - (t0 - 0.25)) / 0.22));
    if (k > 0) v = v.map((x, j) => lerp(x, BABBLE_CMD[i][j], k));
  });
  return v;
};
const Sliders: React.FC<{x: number; y: number; vals: number[]; s?: number}> = ({x, y, vals, s = 1}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
    <path d="M-40,250 L560,250 L520,-40 L0,-40 Z" fill="#3A4450" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M-40,250 L560,250 L560,290 L-40,290 Z" fill="#2B333C" stroke={INK} strokeWidth={4} />
    {vals.map((v, i) => {
      const sx = 30 + i * 62;
      const ty = 10, by = 210;
      const ky = lerp(by, ty, clamp(v));
      return (
        <g key={i}>
          <rect x={sx - 5} y={ty} width={10} height={by - ty} rx={5} fill="#141A20" />
          <rect x={sx - 5} y={fmt(ky)} width={10} height={fmt(by - ky)} rx={5} fill={UI.blue} opacity={0.75} />
          <rect x={sx - 22} y={fmt(ky - 12)} width={44} height={24} rx={6} fill="#DDE3EA" stroke={INK} strokeWidth={3} />
          <line x1={sx - 14} y1={fmt(ky)} x2={sx + 14} y2={fmt(ky)} stroke={INK} strokeWidth={2} />
        </g>
      );
    })}
  </g>
);
// "But the machine still has to learn which combinations create the shapes it needs.": sliders jump to untried
// combinations; the face makes shapes nobody asked for
export const MechCombos: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = view(rob2(f), 26, -0.55, 0.3);
  const cam = drift(f, K.combos, K.banana, {x: 960, y: 560, z: 1}, {x: 980, y: 550, z: 1.05});
  return (
    <g>
      <RobotCU id="mc" cam={cam} st={st} x={1260} y={430} s={2.9} veil={0.2} bgDx={300} bgDy={160} bgS={1.0} benchY={830} fore={<Sliders x={150} y={700} vals={sliderVals(t)} s={1.05} />} />
      <Tag x={90} y={110} text="Untrained: combinations tried at random" k={pr(f, K.combos + 0.4, K.combos + 0.8)} size={26} tone="warm" />
    </g>
  );
};

// ------------------------------------------------------------------ mouths
const SYL: [string, number][] = [['ba', 33.27], ['na', 33.63], ['na', 33.83]];
/** the visitor's mouth, large: Head drawn so the mouth sits at (mx, my) on screen */
const MouthHead: React.FC<{id: string; R: number; turn: number; mx: number; my: number; expr: any; blink?: number}> = ({id, R, turn, mx, my, expr, blink = 0}) => {
  const m = {x: (-30 * turn - 6 * turn) * (R / 100), y: 54 * (R / 100)};
  return <Head id={id} c={{x: mx - m.x, y: my - m.y}} R={R} roll={0} turn={turn} expr={expr} blink={blink} inkW={7 * Math.min(4, R / 120)} />;
};
// "Think about saying 'banana.'": the visitor's mouth, front, saying the narrated word (timed to the take)
export const BananaHuman: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const hm = humanMouth(t);
  const expr = {...EXPR_NEUTRAL, ...VX.rest, ...hm, gx: -0.1, gy: 0.05, lid: 0.12};
  return (
    <g>
      <Layer cam={still(f, K.banana, K.yourLips, 1.04)} depth={2.4}>
        <Back id="bh-bk" bg="lab" veil={0.45} dx={-1200} dy={0} s={1.2} />
      </Layer>
      <Layer cam={still(f, K.banana, K.yourLips, 1.04)} depth={1}>
        <MouthHead id="bh" R={1150} turn={0.12} mx={960} my={560} expr={expr} />
      </Layer>
      {SYL.map(([s, t0], i) => {
        const on = pr(f, t0 - 0.05, t0 + 0.02);
        const hot = t >= t0 - 0.03 && t < (SYL[i + 1]?.[1] ?? 34.02);
        return on > 0.01 ? (
          <text key={i} x={760 + i * 200} y={1010} textAnchor="middle" fontFamily="Fredoka Variable" fontWeight={600} fontSize={hot ? 74 : 62} fill={hot ? UI.coral : UI.ink} opacity={on}>
            {s}
          </text>
        ) : null;
      })}
    </g>
  );
};
/** arrows describing the lip movement just named */
const MoveArrows: React.FC<{x: number; y: number; kind: 'together' | 'open' | 'stretch' | 'toward'; k: number}> = ({x, y, kind, k}) => {
  if (k <= 0.01) return null;
  const A = (x1: number, y1: number, x2: number, y2: number) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const h = 22;
    return `M${fmt(x1)},${fmt(y1)} L${fmt(x2)},${fmt(y2)} M${fmt(x2 - h * Math.cos(a - 0.5))},${fmt(y2 - h * Math.sin(a - 0.5))} L${fmt(x2)},${fmt(y2)} L${fmt(x2 - h * Math.cos(a + 0.5))},${fmt(y2 - h * Math.sin(a + 0.5))}`;
  };
  const d = kind === 'together' ? A(x, y - 150, x, y - 60) + ' ' + A(x, y + 150, x, y + 60) : kind === 'open' ? A(x, y - 60, x, y - 160) + ' ' + A(x, y + 60, x, y + 170) : kind === 'stretch' ? A(x - 200, y, x - 330, y) + ' ' + A(x + 200, y, x + 330, y) : A(x + 60, y, x - 140, y);
  return <path d={d} fill="none" stroke={UI.amber} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" opacity={k} />;
};
// "Your lips come together, open, stretch, and move toward the next sound.": a three-quarter view, each movement
// marked as it is named
export const LipsMoves: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const hm = humanMouth(t);
  const expr = {...EXPR_NEUTRAL, ...VX.rest, ...hm, gx: -0.6, gy: 0.05, lid: 0.12};
  const cam = still(f, K.yourLips, K.imagine, 1.04, -10, 0);
  const words: [string, number, number, 'together' | 'open' | 'stretch' | 'toward'][] = [
    ['together', T('together,'), T('open,'), 'together'],
    ['open', T('open,'), T('stretch,'), 'open'],
    ['stretch', T('stretch,'), T('and move'), 'stretch'],
    ['toward the next sound', T('and move'), K.imagine, 'toward'],
  ];
  return (
    <g>
      <Layer cam={cam} depth={2.4}>
        <Back id="lm-bk" bg="lab" veil={0.45} dx={-1600} dy={0} s={1.2} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <MouthHead id="lm" R={360} turn={0.5} mx={1000} my={600} expr={expr} />
      </Layer>
      {words.map(([w, a, b, kind]) => {
        const k = pr(f, a - 0.05, a + 0.15) * (1 - pr(f, b - 0.1, b + 0.05));
        return (
          <g key={w}>
            <MoveArrows x={1000} y={600} kind={kind} k={k} />
            <Tag x={1000} y={1000} text={w} k={k} size={40} anchor="middle" tone="light" />
          </g>
        );
      })}
    </g>
  );
};
/** the robot's untried attempts, a beat behind the shapes just described */
const TRY_H: Track = [[0, 'rest'], [T('produce those') + 0.1, 'B'], [T('adjusting') + 0.1, 'A'], [T('motors underneath'), 'E'], [T('rubber face.') + 0.3, 'rest']];
// "Now imagine trying to produce those movements by adjusting a collection of motors underneath a rubber face.":
// the robot's mouth, both corners in section; the target shape in an inset; the motors miss it
export const RobotTry: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = view(rob2(f), 0, 0.3, 0.2);
  const k = pr(f, T('by adjusting') - 0.2, T('by adjusting') + 0.3);
  const insetK = pr(f, T('produce those') - 0.3, T('produce those'));
  const target = {...EXPR_NEUTRAL, ...VX.rest, ...humanVis(t, TRY_H, 0.07), gx: -0.1};
  return (
    <g>
      <RobotCU id="rt" cam={drift(f, K.imagine, K.jaw, CAM0, {x: 1000, y: 590, z: 1.05})} st={st} x={1000} y={186} s={5.8} veil={0.45} bgDx={-500} cheek={{k, side: -1, r: 1.25}} over={<g transform={`translate(1000 186) scale(5.8)`}><CheekSection id="rt-ck2" st={st} k={k} side={1} r={1.25} hot={false} /></g>} />
      {insetK > 0.01 && (
        <Panel id="rt-in" x={1570} y={70} w={300} h={240} bg="#F3E4CC" k={insetK}>
          <MouthHead id="rt-h" R={250} turn={0.1} mx={1720} my={200} expr={target} />
        </Panel>
      )}
      <Tag x={1720} y={350} text="the shape it needs" k={insetK} size={26} anchor="middle" tone="light" />
      <Tag x={90} y={110} text="Untrained: motors adjusted by guesswork" k={pr(f, T('by adjusting'), T('by adjusting') + 0.4)} size={26} tone="warm" />
    </g>
  );
};
// "You could make its jaw flap whenever the speaker gets loud.": a speaker box on the bench, cabled to the robot;
// the jaw follows the speaker's loudness and nothing else
export const JawFlap: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = view(rob2(f), 38, 0.5, 0.05);
  const lv = loudSm(t);
  const cam = drift(f, K.jaw, K.puppet, {x: 1000, y: 560, z: 1}, {x: 1000, y: 550, z: 1.06});
  return (
    <g>
      <RobotCU
        id="jf"
        cam={cam}
        st={st}
        x={720}
        y={470}
        s={2.6}
        benchY={900}
        veil={0.15}
        bgDx={-100}
        bgDy={160}
        bgS={1.0}
        over={
          <g>
            <path d={`M1340,${940} C1200,${980} 980,${975} 860,${942}`} fill="none" stroke="#2B313A" strokeWidth={8} strokeLinecap="round" />
            <SpeakerBox x={1420} y={800} s={1.1} level={lv} />
          </g>
        }
      />
      <Tag x={90} y={110} text="Illustrative comparison: jaw follows loudness only" k={pr(f, K.jaw + 0.2, K.jaw + 0.6)} size={26} tone="warm" />
    </g>
  );
};
// "It would look like a very expensive sock puppet.": the robot and a sock puppet, flapping to the same loudness
export const PuppetPair: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = view(rob2(f), 30, 0.55, 0.05);
  const lv = loudSm(t);
  const pk = pr(f, K.puppet - 0.05, K.puppet + 0.35, e3);
  const cam = drift(f, K.puppet, K.follow, {x: 960, y: 560, z: 1}, {x: 960, y: 555, z: 1.04});
  return (
    <g>
      <RobotCU
        id="pp"
        cam={cam}
        st={st}
        x={600}
        y={470}
        s={2.4}
        benchY={900}
        veil={0.15}
        bgDx={500}
        bgDy={160}
        bgS={1.0}
        over={
          <g transform={`translate(0 ${fmt((1 - pk) * 700)})`}>
            <Puppet x={1340} y={420} open={lv} s={1.15} />
          </g>
        }
      />
    </g>
  );
};
// "The researchers wanted the movements to follow the speech.": the robot's mouth, front, now shaped by a speech
// sample (the narrated "banana", replayed slowly under its playhead)
export const FollowSpeech: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = view(rob2(f), 0, 0, 0.05);
  const rt = replayT(t);
  const wk = pr(f, K.follow + 0.1, K.follow + 0.4);
  return (
    <g>
      <RobotCU id="fs" cam={drift(f, K.follow, K.practiced, {x: 960, y: 500, z: 1}, {x: 960, y: 500, z: 1.04})} st={st} x={960} y={40} s={6.2} veil={0.45} bgDx={-800} />
      <rect x={300} y={830} width={1320} height={190} rx={24} fill={UI.paper} opacity={0.94 * wk} stroke={INK} strokeWidth={3} strokeOpacity={wk} />
      <Wave x={360} y={925} w={1200} h={60} t0={REPLAY.a} t1={REPLAY.b} cursor={rt} k={wk} />
      {SYL.map(([s, t0], i) => {
        const x = 360 + ((t0 - REPLAY.a) / (REPLAY.b - REPLAY.a)) * 1200 + 60;
        const hot = rt >= t0 - 0.02 && rt < (SYL[i + 1]?.[1] ?? 34.02);
        return (
          <text key={i} x={fmt(x)} y={870} textAnchor="middle" fontFamily="Fredoka Variable" fontWeight={600} fontSize={34} fill={hot ? UI.coral : UI.ink} opacity={wk}>
            {s}
          </text>
        );
      })}
      <Tag x={90} y={110} text="Speech sample: “banana”, slowed" k={wk} size={26} />
    </g>
  );
};

// ------------------------------------------------------------------ mirror practice
/** the laptop on the mirror bench: live camera view (the reflection the eye cameras see) and the record */
const LT = {x: 1640, y: 640, w: 330, h: 210};
const trialVals = (t: number) => {
  let v = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
  TRIALS.forEach((tr) => {
    const k = smooth(clamp((t - tr.t) / 0.35));
    if (t >= tr.t) v = v.map((x, j) => lerp(x, tr.cmd[j], k));
  });
  return v;
};
const recorded = (t: number) => TRIALS.filter((tr) => t >= tr.t + 1.0).length;
const LaptopScreen: React.FC<{id: string; w: number; h: number; t: number; st: RobotState; many?: number}> = ({id, w, h, t, st, many = 0}) => {
  const vals = trialVals(t);
  const n = recorded(t);
  const flash = TRIALS.reduce((a, tr) => Math.max(a, clamp(1 - Math.abs(t - (tr.t + 1.0)) / 0.12)), 0);
  const camW = w * 0.42;
  const rs = {...st, yaw: reflectYaw(st.yaw)};
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} fill="#141B22" />
      {/* live camera: what the eye cameras see in the mirror */}
      <defs>
        <clipPath id={`${id}-cv`}>
          <rect x={w * 0.03} y={h * 0.05} width={camW} height={h * 0.9} rx={8} />
        </clipPath>
      </defs>
      <rect x={w * 0.03} y={h * 0.05} width={camW} height={h * 0.9} rx={8} fill="#C9D3D2" />
      <g clipPath={`url(#${id}-cv)`}>
        <g transform={`translate(${fmt(w * 0.03 + camW / 2)} ${fmt(h * 0.5)}) scale(-1 1)`}>
          <Robot id={`${id}-cam`} st={rs} x={0} y={h * 0.05} s={h * 0.0042} tint="#BFD7E2" tintK={0.12} />
        </g>
        <rect x={w * 0.03} y={h * 0.05} width={camW} height={h * 0.9} fill="#FFFFFF" opacity={0.6 * flash} />
      </g>
      <circle cx={w * 0.03 + 16} cy={h * 0.05 + 16} r={6} fill="#E04F4F" />
      {/* the record: one row per trial, newest at the top; more rows imply many more trials */}
      {Array.from({length: Math.min(3, n)}, (_, i) => {
        const tr = TRIALS[n - 1 - i];
        return <RecordRow key={i} id={`${id}-r${i}`} x={w * 0.49} y={h * 0.05 + i * (w * 0.5 * 0.36 + 8)} w={w * 0.48} cmd={tr.cmd} st={tr.st} hot={i === 0 && t < tr.t + 2.2} />;
      })}
      {many > 0 &&
        Array.from({length: 6}, (_, i) => (
          <rect key={i} x={w * 0.49} y={h * 0.05 + (Math.min(3, n) + i) * (w * 0.5 * 0.36 + 8) * 0.5} width={w * 0.48} height={w * 0.07} rx={6} fill="#26313B" opacity={many * (1 - i * 0.12)} />
        ))}
      {/* the current commands */}
      {vals.map((v, j) => (
        <rect key={j} x={w * 0.05 + j * (camW / 8)} y={h * 0.95 - 6 - h * 0.18 * v} width={camW / 8 - 6} height={h * 0.18 * v} rx={2} fill={UI.blue} opacity={0.9} />
      ))}
    </g>
  );
};
const LaptopOnBench: React.FC<{t: number; st: RobotState; id: string}> = ({t, st, id}) => (
  <g>
    <Shadow cx={LT.x + LT.w / 2} cy={MIR.benchY + 62} rx={230} ry={14} />
    <g transform={`translate(${LT.x} ${MIR.benchY - LT.h - 20})`}>
      <Laptop id={`${id}-lt`} x={0} y={0} w={LT.w} h={LT.h}>
        <LaptopScreen id={`${id}-ls`} w={LT.w} h={LT.h} t={t} st={st} />
      </Laptop>
    </g>
  </g>
);
// "So the robot practiced.": back at the mirror; a laptop on the bench is now recording
export const PracWide: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = rob2(f);
  return (
    <g>
      <MirrorSet2 id="pw" cam={drift(f, K.practiced, T('It moved its face'), {x: 1180, y: 540, z: 1.0}, {x: 1170, y: 536, z: 1.04})} st={st} onBench={<LaptopOnBench t={t} st={st} id="pw" />} />
      <Tag x={90} y={1000} text="Illustration: practising in front of a mirror" k={pr(f, K.practiced + 0.1, K.practiced + 0.4)} size={26} />
    </g>
  );
};
// "It moved its face while watching its reflection,": the reflection, close (trial 1)
export const PracRefl: React.FC<{f: number}> = ({f}) => {
  const c0 = mirrorLayerCam({x: MIR.refl.x, y: MIR.refl.y + 10}, 2.7);
  const c1 = mirrorLayerCam({x: MIR.refl.x, y: MIR.refl.y + 16}, 2.85);
  return <MirrorSet2 id="pf" cam={drift(f, T('It moved its face'), T('building a relationship'), c0, c1)} st={rob2(f)} />;
};
// "building a relationship between motor commands and the appearance they produced.": the laptop, close: live view,
// the command bars, and the record of pairs growing
export const PracLaptop: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = rob2(f);
  const W0 = 1180, H0 = 700;
  const many = pr(f, T('they produced.') - 0.2, T('they produced.') + 0.5);
  const cmdK = pulseK(f, T('motor commands') - 0.1, T('and the appearance') - 0.1);
  const appK = pulseK(f, T('appearance') - 0.1, K.moveThese);
  const cam = drift(f, T('building a relationship'), K.moveThese, CAM0, {x: 960, y: 530, z: 1.04});
  return (
    <g>
      <Layer cam={cam} depth={2.2}>
        <Back id="pl-bk" bg="lab" veil={0.4} dx={-400} dy={300} s={1.1} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <rect x={-500} y={940} width={3000} height={400} fill="#C98F57" />
        <rect x={-500} y={940} width={3000} height={14} fill="#DDA66B" />
        <Laptop id="pl-lt" x={960 - W0 / 2} y={110} w={W0} h={H0}>
          <LaptopScreen id="pl-ls" w={W0} h={H0} t={t} st={st} many={many} />
          <rect x={W0 * 0.03 - 6} y={H0 * 0.75 - 10} width={W0 * 0.42 + 12} height={H0 * 0.22} rx={10} fill="none" stroke={UI.amber} strokeWidth={6} opacity={cmdK} />
          <rect x={W0 * 0.03 - 6} y={H0 * 0.05 - 6} width={W0 * 0.42 + 12} height={H0 * 0.66} rx={10} fill="none" stroke={UI.amber} strokeWidth={6} opacity={appK} />
        </Laptop>
      </Layer>
      <Tag x={330} y={1010} text="motor commands" k={cmdK} size={30} anchor="middle" tone="warm" />
      <Tag x={330} y={1010} text="appearance" k={appK} size={30} anchor="middle" tone="warm" />
      <Tag x={1270} y={1010} text="recorded pairs" k={pr(f, T('building a relationship') + 0.4, T('building a relationship') + 0.8)} size={30} anchor="middle" tone="light" />
    </g>
  );
};
const pulseK = (f: number, a: number, b: number) => pr(f, a, a + 0.25) * (1 - pr(f, b - 0.25, b));
// "Move these motors, get this mouth shape.": the reflected mouth, very close; the commands beneath (trial 2)
export const PracLips: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  // the reflected mouth: el -38 on the head (about 0.62 of the head's half-height below its centre)
  const c0 = mirrorLayerCam({x: MIR.refl.x - 6, y: MIR.refl.y + 74}, 8.6);
  const c1 = mirrorLayerCam({x: MIR.refl.x - 6, y: MIR.refl.y + 74}, 9.0);
  const vals = trialVals(t);
  return (
    <g>
      <MirrorSet2 id="pq" cam={drift(f, K.moveThese, K.change, c0, c1)} st={rob2(f)} />
      <g transform="translate(90 790)">
        <rect x={0} y={0} width={420} height={210} rx={20} fill="#141B22" opacity={0.92} />
        {vals.map((v, j) => (
          <g key={j}>
            <rect x={24 + j * 48} y={30} width={30} height={150} rx={5} fill="#26313B" />
            <rect x={24 + j * 48} y={fmt(180 - 150 * v)} width={30} height={fmt(150 * v)} rx={5} fill={UI.blue} />
          </g>
        ))}
      </g>
      <Tag x={300} y={760} text="these motors" k={pulseK(f, K.moveThese, T('get this'))} size={28} anchor="middle" tone="warm" />
      <Tag x={1180} y={1000} text="this mouth shape" k={pr(f, T('get this'), T('get this') + 0.3)} size={30} anchor="middle" tone="warm" />
    </g>
  );
};
// "Change the combination, get another.": the shared mirror view; the record gains a row
export const PracShared: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const st = rob2(f);
  return <MirrorSet2 id="ps" cam={drift(f, K.change, K.skin, {x: 1260, y: 560, z: 1.18}, {x: 1280, y: 556, z: 1.24})} st={st} onBench={<LaptopOnBench t={t} st={st} id="ps" />} />;
};

// ------------------------------------------------------------------ skin
// "That matters because flexible skin moves differently from a rigid metal part. Pull at one point, and the
// material around it stretches too.": the skin in section; a rigid link turns and moves nothing else; then one
// attachment is pulled and the band, the material inside it and the lip at its end all move
export const SkinPlate: React.FC<{f: number; close?: boolean}> = ({f, close = false}) => {
  const t = f / 30;
  const wob = 0.3 * (pr(f, T('flexible skin') - 0.05, T('flexible skin') + 0.4) - pr(f, T('moves differently'), T('moves differently') + 0.6));
  const pull = pr(f, K.pull - 0.05, K.pull + 0.55, e3) * (1 - pr(f, K.controller - 0.4, K.controller));
  const rigidK = pr(f, T('rigid metal') - 0.3, T('rigid metal'));
  const rigidAng = -16 * pr(f, T('rigid metal') + 0.05, T('part.') + 0.1) * (1 - pr(f, K.pull - 0.4, K.pull));
  const markK = 0.45 + 0.55 * pr(f, T('material around') - 0.2, T('material around') + 0.2);
  const cam = close ? drift(f, K.pull, K.controller, {x: 820, y: 620, z: 1.95}, {x: 816, y: 624, z: 2.05}) : drift(f, K.skin, K.pull, {x: 960, y: 560, z: 1}, {x: 960, y: 560, z: 1.04});
  const X = 330, Y = 470, Wd = 1100;
  const SK = 'translate(960 560) scale(1.38) translate(-960 -560)';
  return (
    <g>
      <Layer cam={cam} depth={2}>
        <Plate id="sk-pl" />
      </Layer>
      <Layer cam={cam} depth={1}>
        <g transform={SK}>
        <SkinSection id="sk" x={X} y={Y} w={Wd} pull={Math.max(pull, wob)} rigidK={rigidK} rigidAng={rigidAng} markerK={markK} thick={110} />
        {/* the lip at the band's end: a landmark (lip contour drawn on the band's rounded end) */}
        <path d={`M${X + Wd + 72},${Y + 14} Q${X + Wd + 112},${Y + 55} ${X + Wd + 72},${Y + 98}`} fill="none" stroke={RPAL.lipDeep} strokeWidth={9} strokeLinecap="round" />
        </g>
      </Layer>
      <Tag x={90} y={110} text="Illustration · skin in cross-section" k={pr(f, K.skin + 0.1, K.skin + 0.5)} size={26} />
      <Tag x={260} y={430} text="flexible skin" k={pr(f, T('flexible skin') - 0.1, T('flexible skin') + 0.3) * (1 - pr(f, K.pull - 0.5, K.pull - 0.2))} size={30} tone="light" />
      <Tag x={560} y={190} text="rigid part" k={rigidK * (1 - pr(f, K.pull - 0.5, K.pull - 0.2))} size={30} tone="light" />
      <Tag x={1690} y={420} text="lip" k={pr(f, K.skin + 0.6, K.skin + 1.0)} size={30} tone="light" />
      <Tag x={500} y={960} text="pulled here" k={pr(f, K.pull + 0.2, K.pull + 0.5) * (1 - pr(f, K.controller - 0.3, K.controller))} size={30} tone="warm" />
      <Tag x={1200} y={960} text="the material around it moves too" k={pr(f, T('stretches too.') - 0.2, T('stretches too.') + 0.2) * (1 - pr(f, K.controller - 0.3, K.controller))} size={30} tone="warm" />
    </g>
  );
};
export const SkinPull: React.FC<{f: number}> = ({f}) => <SkinPlate f={f} close />;
// "The controller has to work with the face it actually has.": the face again (oblique), the pull at the corner
// releasing and a smile formed by the same skin; the corner patch's material marks shown briefly
export const SkinFace: React.FC<{f: number}> = ({f}) => {
  const st = view(rob2(f), 30, -0.2, 0.05);
  const g = pr(f, K.controller, K.controller + 0.4) * (1 - pr(f, K.once - 1.2, K.once - 0.6));
  return <RobotCU id="sf" cam={drift(f, K.controller, K.once, {x: 900, y: 600, z: 1}, {x: 880, y: 620, z: 1.08})} st={st} x={900} y={420} s={4.2} veil={0.35} bgDx={-200} grid={g * 0.9} gridAt={{u: -40, v: -2, r: 46}} />;
};
export {Bench, ControlBox, RobotSupport, HandArm, HAND_CLUTCH, BANANA, Head};
