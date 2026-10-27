// V4 shots: the human cheek muscle matched to the robot's corner motor (Act 1), the mirror expressions (Act 2), the
// screen room (Act 2C), the side-by-side mouth comparison (Act 3), the reception desk (Act 4) and the evolution
// close-up before the loop (ending).
import React from 'react';
import {Head} from '../dc/Head';
import {fmt} from '../dc/math';
import {mixExpr, VX} from '../art/Visitor';
import {camPath, Layer} from '../lib/cam';
import {pr, T} from '../lib/core';
import {Back, RobotCU} from './sets';
import {Robot, RobotSupport} from '../art/Robot';
import {CrewTalk} from './shotsD';
import {K, SPEECH} from '../state';
import {robotVis} from '../lib/visemes';
import {Tag} from './text3';
import {drift} from './shots2';
import {HumanoidBody, LobbyCounter, SideMech} from './new';
import {Visitor} from '../art/Visitor';
import {rob2, vis2} from './state2';
import {Cam} from '../lib/cam';
import {RobotState} from '../art/Robot';

const sm3 = (x: number) => x * x * (3 - 2 * x);
const ss = (t: number, a: number, b: number) => sm3(Math.min(1, Math.max(0, (t - a) / (b - a))));

// ================================================================== Act 1: the muscle under a human cheek
// 26.05 - 27.0 "That gives the face ways to": his face, close. As he smiles, the skin of his cheek clears over the
// muscle doing it (zygomaticus major: from the cheekbone to the mouth corner); it shortens and thickens, and pulls
// the corner up and out. The mouth corner sits where the robot's corner sits in the next shot (match cut).
export const MUSCLE_A = T('That gives');
export const MUSCLE_B = T('face ways') + 0.3;
/** the muscle band in head units (radius 100), from the cheekbone to the corner of the mouth */
const Zygo: React.FC<{id: string; corner: {x: number; y: number}; k: number; pull: number}> = ({id, corner, k, pull}) => {
  const o = {x: -80, y: 14}; // origin on the cheekbone, below and outside the eye
  const dx = corner.x - o.x, dy = corner.y - o.y;
  const L = Math.hypot(dx, dy);
  const nx = -dy / L, ny = dx / L;
  const w = 6.5 * (1 + 0.45 * pull); // a contracting muscle shortens and thickens
  const P = (u: number, v: number) => ({x: o.x + dx * u + nx * v, y: o.y + dy * u + ny * v});
  const a = P(0, 0), b = P(1, 0);
  const l1 = P(0.5, w), l2 = P(0.5, -w);
  const band = `M${fmt(a.x)},${fmt(a.y)} Q${fmt(l1.x)},${fmt(l1.y)} ${fmt(b.x)},${fmt(b.y)} Q${fmt(l2.x)},${fmt(l2.y)} ${fmt(a.x)},${fmt(a.y)} Z`;
  return (
    <g opacity={k}>
      <defs>
        <radialGradient id={`${id}-win`} cx={(o.x + corner.x) / 2} cy={(o.y + corner.y) / 2} r={L * 0.75} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F2C8B4" stopOpacity={0.55} />
          <stop offset="0.7" stopColor="#F2C8B4" stopOpacity={0.3} />
          <stop offset="1" stopColor="#F2C8B4" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the skin over it turns translucent (a soft-edged clearing, no frame) */}
      <ellipse cx={(o.x + corner.x) / 2} cy={(o.y + corner.y) / 2} rx={L * 0.75} ry={L * 0.55} fill={`url(#${id}-win)`} />
      {/* the cheekbone it starts from */}
      <path d={`M${fmt(o.x - 16)},${fmt(o.y + 4)} Q${fmt(o.x - 2)},${fmt(o.y - 9)} ${fmt(o.x + 14)},${fmt(o.y - 4)}`} fill="none" stroke="#EDE3D0" strokeWidth={5} strokeLinecap="round" opacity={0.9} />
      <path d={band} fill="#C8564E" opacity={0.78} />
      {[-0.55, 0, 0.55].map((v, i) => {
        const p0 = P(0.06, v * w * 0.3), pm = P(0.5, v * w * 0.85), p1 = P(0.94, v * w * 0.2);
        return <path key={i} d={`M${fmt(p0.x)},${fmt(p0.y)} Q${fmt(pm.x)},${fmt(pm.y)} ${fmt(p1.x)},${fmt(p1.y)}`} fill="none" stroke="#F0A08F" strokeWidth={1.1} opacity={0.8} />;
      })}
      <path d={band} fill="none" stroke="#7E2E2B" strokeWidth={1.4} opacity={0.7} />
    </g>
  );
};
export const H1Muscle: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const R = 520;
  const c = {x: 1150, y: 395};
  const sm = ss(t, MUSCLE_A + 0.2, MUSCLE_A + 0.6);
  const expr = mixExpr({...VX.rest, gx: -0.2, gy: 0}, {...VX.smile, open: 0.08, teeth: 0.25, squint: 0.12, gx: -0.2, gy: 0}, sm);
  const corner = {x: -28 * expr.wide, y: 54 - expr.smile * 10};
  const k = pr(f, MUSCLE_A + 0.05, MUSCLE_A + 0.35);
  const blink = 0;
  return (
    <g>
      <Layer cam={drift(f, MUSCLE_A, MUSCLE_B, {x: 960, y: 540, z: 1}, {x: 975, y: 545, z: 1.05})} depth={2.4}>
        <Back id="h1m-bk" bg="lab" veil={0.5} dx={-900} dy={60} />
      </Layer>
      <Layer cam={drift(f, MUSCLE_A, MUSCLE_B, {x: 960, y: 540, z: 1}, {x: 975, y: 545, z: 1.05})} depth={1}>
        <Head id="h1m" c={c} R={R} roll={0} turn={0} expr={expr} blink={blink} inkW={Math.max(10, R / 34)} />
        <g transform={`translate(${c.x} ${c.y}) scale(${R / 100})`}>
          <Zygo id="h1m-z" corner={corner} k={k} pull={sm} />
        </g>
      </Layer>
    </g>
  );
};

// 30.56 - 32.32 "create the shapes it needs.": a split view of the same moment: the whole face on the left, its side
// section on the right, the linkages under the skin pushing and pulling the lips into each expression
export const B7Split: React.FC<{f: number}> = ({f}) => {
  const st = rob2(f);
  const a = T('create the');
  const cam = drift(f, a, K.banana, {x: 960, y: 540, z: 1}, {x: 960, y: 548, z: 1.04});
  return (
    <g>
      <defs>
        <clipPath id="b7s-l"><rect x={0} y={0} width={968} height={1080} /></clipPath>
        <clipPath id="b7s-r"><rect x={972} y={0} width={948} height={1080} /></clipPath>
      </defs>
      <g clipPath="url(#b7s-l)">
        <RobotCU id="b7s-f" cam={cam} st={{...st, yaw: 0, gx: 0.15, gy: 0}} x={500} y={430} s={3.0} veil={0.35} bgDx={-500} />
      </g>
      <g clipPath="url(#b7s-r)">
        <rect x={972} y={0} width={948} height={1080} fill="#28303A" />
        <Layer cam={cam} depth={1}>
          <SideMech id="b7s-m" x={1310} y={600} s={1.3} st={st} />
        </Layer>
      </g>
      <rect x={968} y={0} width={4} height={1080} fill="#E9E4D6" opacity={0.85} />
    </g>
  );
};

// ================================================================== Act 2C: the screen room
// 89.76 - 91.84 "including hours of YouTube footage.": a different place: a dark room lit only by a wall of screens,
// a different person speaking or singing on each, every screen changing clip on its own beat. The robot sits in
// front of them in the screen light, its eyes moving from one face to the next.
const WALL: {look: string; bg: 'kitchen' | 'street' | 'office' | 'stage' | 'home'; sing?: boolean}[][] = [
  [{look: 'clerkA', bg: 'office'}, {look: 'host', bg: 'stage'}, {look: 'clerkC', bg: 'kitchen'}],
  [{look: 'honest', bg: 'street'}, {look: 'person', bg: 'stage', sing: true}, {look: 'clerkB', bg: 'home'}],
  [{look: 'checker', bg: 'kitchen'}, {look: 'clerkA', bg: 'street'}, {look: 'host', bg: 'home', sing: true}],
];
const SCR = {w: 400, h: 225, gx: 34, gy: 32, x0: 60, y0: 170};
const WALL_FLAT = WALL.flat();
export const ScreenRoom: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.youtube;
  const cam = drift(f, a, K.important, {x: 900, y: 520, z: 1.0}, {x: 930, y: 515, z: 1.1});
  // its eyes move screen to screen
  const look = [[-0.2, -0.35], [-0.65, -0.3], [-0.45, 0.05], [-0.85, -0.05], [-0.3, -0.25]];
  const li = Math.min(look.length - 1, Math.floor(Math.max(0, t - a) / 0.45));
  const st = {...rob2(f), yaw: -38, gx: look[li][0], gy: look[li][1]};
  return (
    <g>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#0D1218" />
      <Layer cam={cam} depth={1.7}>
        <rect x={-400} y={-300} width={2700} height={1700} fill="#121922" />
        {Array.from({length: 8}, (_, k) => {
          const r = Math.floor(k / 4), c = k % 4;
          const x = SCR.x0 + c * (SCR.w + SCR.gx), y = SCR.y0 + r * (SCR.h + SCR.gy);
          const beat = 0.5 + 0.13 * k;
          const n = Math.floor(Math.max(0, t - a + k * 0.21) / beat);
          const clip = WALL_FLAT[(k * 5 + n * 7) % WALL_FLAT.length];
          return (
            <g key={k}>
              <rect x={x - 14} y={y - 14} width={SCR.w + 28} height={SCR.h + 28} fill="#8FB4E8" opacity={0.08} rx={10} />
              <rect x={x - 5} y={y - 5} width={SCR.w + 10} height={SCR.h + 10} fill="#05080B" rx={4} />
              <defs>
                <clipPath id={`sr-c${k}`}><rect x={x} y={y} width={SCR.w} height={SCR.h} /></clipPath>
              </defs>
              <g clipPath={`url(#sr-c${k})`}>
                <g transform={`translate(${x} ${y}) scale(${SCR.w / 1920})`}>
                  <CrewTalk id={`sr-${k}-${n % 4}`} f={f} look={clip.look} bg={clip.bg} sing={clip.sing} tr={SPEECH(a - 2, K.important + 1, 21 + k * 5 + n)} cam={{x: 960, y: 540, z: 1}} seed={30 + k} />
                </g>
                <rect x={x} y={y} width={SCR.w} height={SCR.h} fill="#9FC2FF" opacity={0.06} />
              </g>
            </g>
          );
        })}
        {/* the floor, catching the light */}
        <rect x={-400} y={830} width={2700} height={600} fill="#161E28" />
        <ellipse cx={1000} cy={860} rx={900} ry={60} fill="#7DA4D8" opacity={0.08} />
      </Layer>
      <Layer cam={cam} depth={0.85}>
        <RobotSupport id="sr-sup" x={1590} y={720} s={2.3} yaw={st.yaw} postLen={200} tint="#7F9BC8" tintK={0.35} />
        <Robot id="sr-r" st={st} x={1590} y={720} s={2.3} tint="#9DB7E8" tintK={0.28} />
      </Layer>
    </g>
  );
};

// ================================================================== Act 4: the reception desk
// The late smile, restaged with a robotic assistant (the research head on a body) behind a hotel reception counter.
/** the assistant, close: the head on its body; the lobby behind */
const AssistCU: React.FC<{id: string; cam: Cam; st: RobotState; x?: number; y?: number; s?: number; bgDx?: number}> = ({id, cam, st, x = 930, y = 470, s = 3.1, bgDx = -400}) => (
  <g>
    <Layer cam={cam} depth={2.4}>
      <Back id={`${id}-bk`} bg="lobby" veil={0.28} dx={bgDx} dy={160} />
    </Layer>
    <Layer cam={cam} depth={1}>
      <HumanoidBody x={x} y={y + 72 * s} s={0.43 * s} />
      <Robot id={`${id}-r`} st={st} x={x} y={y} s={s} />
    </Layer>
  </g>
);
const view = (st: RobotState, yaw: number, gx?: number, gy?: number): RobotState => ({...st, yaw, gx: gx ?? st.gx, gy: gy ?? st.gy});
/** the counter two-shot: the assistant behind the counter (left), him at the counter end (right) */
const LobbyTwo: React.FC<{id: string; cam: Cam; f: number; lean?: number; rYaw?: number}> = ({id, cam, f, lean = 0, rYaw = 58}) => {
  const st = {...rob2(f), yaw: rYaw};
  const v = vis2(f);
  const R = {x: 640, y: 420, s: 1.9};
  return (
    <g>
      <Layer cam={cam} depth={1.9}>
        <Back id={`${id}-bk`} bg="lobby" veil={0.06} dx={-120} dy={120} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <HumanoidBody x={R.x} y={R.y + 72 * R.s} s={0.43 * R.s} armR={-4} />
        <Robot id={`${id}-r`} st={st} x={R.x} y={R.y} s={R.s} />
        <LobbyCounter x0={-500} x1={1180} y={760} />
        {/* a bell and a card on the counter */}
        <path d="M300,738 q0,-40 40,-40 q40,0 40,40 Z" fill="#D8B25E" stroke="#3A2A12" strokeWidth={3} />
        <rect x={290} y={736} width={100} height={8} rx={3} fill="#8E6A2E" />
        <rect x={880} y={722} width={120} height={22} rx={3} fill="#FBF7EE" stroke="#3A2A12" strokeWidth={2} transform="rotate(-4 940 733)" />
      </Layer>
      <Layer cam={cam} depth={0.97}>
        <Visitor id={`${id}-v`} hx={1390} hy={430} s={1.95} expr={v.expr} blink={v.blink} pose={{turn: 0.9, lTv: 120, torso: 4 + 10 * lean, neck: -2 - 6 * lean}} />
      </Layer>
    </g>
  );
};
// 132.32 - 135.56 "But getting the mouth shape right leaves another problem.": a hotel reception; he comes up to the
// counter and leans in to the assistant; it turns to him a beat too stiffly; he hesitates, easing back
export const L1Lobby: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.another;
  const lean = ss(t, a + 0.15, a + 1.0) - 0.55 * ss(t, a + 1.9, a + 2.5);
  const yaw = 30 + 28 * (t < a + 1.2 ? 0 : t < a + 1.45 ? 0.5 : 1); // two stiff steps, not a turn
  return <LobbyTwo id="l1l" cam={drift(f, a, K.when, {x: 1000, y: 470, z: 1.0}, {x: 1010, y: 462, z: 1.14})} f={f} lean={lean} rYaw={yaw} />;
};
// 135.56 - 137.12 "When should the face move?": the assistant, waiting
export const L2Assist: React.FC<{f: number}> = ({f}) => <AssistCU id="l2a" cam={drift(f, K.when, K.news, {x: 930, y: 560, z: 1}, {x: 930, y: 550, z: 1.04})} st={view(rob2(f), 24, 0.62, -0.04)} />;
// 139.14 - 140.31 "They stare at you.": unmoved; a slow push
export const L4Assist: React.FC<{f: number}> = ({f}) => <AssistCU id="l4a" cam={drift(f, K.stare, K.finish, {x: 905, y: 500, z: 1.42}, {x: 900, y: 495, z: 1.58})} st={view(rob2(f), 24, 0.62, -0.04)} />;
// 141.69 - 144.13 "Then their smile switches on.": late and fast
export const L6Assist: React.FC<{f: number}> = ({f}) => <AssistCU id="l6a" cam={drift(f, K.switchOn, K.awkward, {x: 920, y: 540, z: 1.12}, {x: 920, y: 540, z: 1.16})} st={view(rob2(f), 24, 0.62, -0.04)} />;
// 144.13 - 147.6 "Even a well-drawn expression can feel awkward when it arrives late.": over the assistant's shoulder;
// its late smile at the edge of frame; across the counter, his awkward reaction
export const L7Over: React.FC<{f: number}> = ({f}) => {
  const cam = drift(f, K.awkward, K.study24, {x: 1000, y: 520, z: 1.05}, {x: 1060, y: 500, z: 1.16});
  const v = vis2(f);
  const R = {x: 470, y: 600, s: 3.0};
  return (
    <g>
      <Layer cam={cam} depth={2.2}>
        <Back id="l7o-bk" bg="lobby" veil={0.12} dx={300} dy={120} />
      </Layer>
      <Layer cam={cam} depth={1.25}>
        <Visitor id="l7o-v" hx={1220} hy={430} s={1.85} expr={v.expr} blink={v.blink} pose={{turn: 0.22}} />
      </Layer>
      <Layer cam={cam} depth={1.1}>
        <LobbyCounter x0={-800} x1={3000} y={790} />
      </Layer>
      <Layer cam={cam} depth={0.9}>
        <HumanoidBody x={R.x} y={R.y + 72 * R.s} s={0.43 * R.s} />
        <Robot id="l7o-r" st={{...rob2(f), yaw: 132}} x={R.x} y={R.y} s={R.s} />
      </Layer>
    </g>
  );
};
// 178.72 - 180.9 "shared-looking moment.": back at the counter: this time its smile arrives with his; he lights up
export const G3Lobby: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const lean = ss(t, T('shared-looking') + 0.3, T('shared-looking') + 1.2);
  return <LobbyTwo id="g3l" cam={drift(f, T('shared-looking'), K.these, {x: 1010, y: 462, z: 1.25}, {x: 1010, y: 456, z: 1.36})} f={f} lean={lean} />;
};

// ================================================================== Act 3: awkward against synchronized
// 104.03 - 107.43 "The result was a physical face moving its lips along with speech and song.": a dark testing room lit
// by its screens; two identical heads hear the same speech from the speaker between them. The left one only opens its
// jaw with the loudness, a beat late and always the same shape (a simple approach, for comparison); the right one
// makes the learned lip shapes on time. Wide first, then close on the left mouth, then across to the right one.
const CMP_TR = SPEECH(K.result - 1, K.song + 1, 17);
export const R1Compare: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.result, b = K.song;
  const learned = robotVis(t, CMP_TR, 0.07);
  const late = robotVis(t - 0.2, CMP_TR, 0.07);
  const base = rob2(f);
  const L: RobotState = {...base, yaw: 22, gx: 0.3, gy: 0.05, smile: 0, round: 0, press: 0, wide: 0, asym: 0, brow: 0, open: 0.1 + 0.9 * Math.min(1, late.open * 1.4 + late.round * 0.25)};
  const Rr: RobotState = {...base, yaw: -22, gx: -0.3, gy: 0.05, ...learned, brow: 0.1};
  const P = {l: {x: 560, y: 470}, r: {x: 1360, y: 470}}, S = 1.75;
  const cam = camPath(f, [[a, {x: 960, y: 520, z: 1.0}], [a + 1.1, {x: 960, y: 520, z: 1.04}], [a + 1.8, {x: P.l.x + 30, y: P.l.y + 40, z: 1.9}], [a + 2.5, {x: P.l.x + 30, y: P.l.y + 40, z: 1.95}], [b, {x: P.r.x - 30, y: P.r.y + 40, z: 1.95}]], sm3);
  const spk = 0.5 + 0.5 * Math.min(1, learned.open * 1.6);
  return (
    <g>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#10161D" />
      <Layer cam={cam} depth={1.8}>
        <rect x={-600} y={-400} width={3100} height={1300} fill="#161E27" />
        {/* the screens that light the room: soft, no readable content */}
        {[200, 760, 1320].map((x, i) => (
          <g key={i}>
            <rect x={x} y={80} width={400} height={230} rx={6} fill="#0A0E13" stroke="#2C3A48" strokeWidth={4} />
            <rect x={x + 10} y={90} width={380} height={210} fill={i === 1 ? '#25415E' : '#1D3247'} />
            {[0, 1, 2, 3].map((j) => <rect key={j} x={x + 40} y={120 + j * 46} width={320 - j * 50} height={14} rx={7} fill="#6FA7D8" opacity={0.12} />)}
            <ellipse cx={x + 200} cy={200} rx={300} ry={200} fill="#5E8FC2" opacity={0.06} />
          </g>
        ))}
      </Layer>
      <Layer cam={cam} depth={1}>
        <rect x={-600} y={820} width={3100} height={500} fill="#1B232D" />
        <rect x={-600} y={812} width={3100} height={10} fill="#33404E" />
        <ellipse cx={P.l.x} cy={835} rx={190} ry={16} fill="#000" opacity={0.4} />
        <ellipse cx={P.r.x} cy={835} rx={190} ry={16} fill="#000" opacity={0.4} />
        {/* the speaker between them */}
        <rect x={900} y={660} width={120} height={170} rx={10} fill="#3B2F25" stroke="#0A0E13" strokeWidth={5} />
        <circle cx={960} cy={705} r={20} fill="#1A1410" />
        <circle cx={960} cy={775} r={34 * (0.92 + 0.08 * spk)} fill="#1A1410" stroke="#5A4A3A" strokeWidth={3} />
        <RobotSupport id="r1c-ls" x={P.l.x} y={P.l.y} s={S} yaw={L.yaw} postLen={(825 - P.l.y) / S - 206} tint="#8FA4BF" tintK={0.3} />
        <Robot id="r1c-l" st={L} x={P.l.x} y={P.l.y} s={S} tint="#9FB2CC" tintK={0.22} />
        <RobotSupport id="r1c-rs" x={P.r.x} y={P.r.y} s={S} yaw={Rr.yaw} postLen={(825 - P.r.y) / S - 206} tint="#8FA4BF" tintK={0.3} />
        <Robot id="r1c-r" st={Rr} x={P.r.x} y={P.r.y} s={S} tint="#9FB2CC" tintK={0.22} />
      </Layer>
      <Tag x={50} y={1040} text="Illustration" k={1} size={24} />
    </g>
  );
};

// ================================================================== ending: how its face changed
// 206.5 - 208.09 "Watch the smile again.": a smooth split of the same head in the same light. Left, the way an untrained
// face moves: the corners step up one motor at a time, lopsided, eyes and brows not taking part. Right, the learned
// smile: corners, cheeks, lids and brows together, in one movement. The split closes onto the right-hand face.
export const Z1Evolve: React.FC<{f: number}> = ({f}) => {
  const t = f / 30;
  const a = K.again, b = K.learned;
  const k = Math.min(1, Math.max(0, (t - a - 0.15) / 0.9));
  const sm = sm3(k);
  const base = rob2(f);
  const learned: RobotState = {...base, yaw: 0, gx: 0, gy: 0, smile: 0.85 * sm, wide: 0.25 * sm, open: 0.03 * sm, round: 0, press: 0, asym: 0, lid: 0.16 + 0.16 * sm, brow: 0.5 * sm};
  const step = Math.floor(k * 4) / 4;
  const early: RobotState = {...base, yaw: 0, smile: 0.6 * step, asym: 0.55 * step, wide: 0.05 * step, open: 0, round: 0, press: 0.1, brow: 0, lid: 0.16, gx: 0, gy: 0, pitch: 0, roll: 0};
  // the divider slides left so the learned face takes over the frame for the next cut
  const div = 960 - 960 * sm3(Math.min(1, Math.max(0, (t - (b - 0.5)) / 0.45)));
  const cam = drift(f, a, b, {x: 960, y: 540, z: 1}, {x: 960, y: 545, z: 1.04});
  return (
    <g>
      <defs>
        <clipPath id="z1e-l"><rect x={0} y={0} width={Math.max(0, div - 2)} height={1080} /></clipPath>
        <clipPath id="z1e-r"><rect x={div + 2} y={0} width={1920} height={1080} /></clipPath>
      </defs>
      <g clipPath="url(#z1e-r)">
        <RobotCU id="z1e-b" cam={cam} st={learned} x={div + (1920 - div) / 2} y={470} s={2.7} veil={0.25} bgDx={-200} bgDy={160} />
      </g>
      {div > 4 && (
        <g clipPath="url(#z1e-l)">
          <RobotCU id="z1e-a" cam={cam} st={early} x={div / 2} y={470} s={2.7} veil={0.4} bgDx={-700} bgDy={160} />
        </g>
      )}
      {div > 4 && <rect x={div - 2} y={0} width={4} height={1080} fill="#E9E4D6" opacity={0.85} />}
    </g>
  );
};
