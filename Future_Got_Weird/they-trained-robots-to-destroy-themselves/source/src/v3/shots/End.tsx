// SECTION B7 + brand sting: why it is uncomfortable to watch. One last robot walks to the edge and leaps; the jump
// hangs while the people who chose the ending are shown; it finishes in front of them; the steel settles under a target
// ring and the ring opens into the brand sting.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cam3, makeProj, Proj} from '../engine/camera';
import {V3, add, clamp01, lerp3, mix, smooth, norm} from '../engine/math';
import {Item, Env} from '../engine/prims';
import {Scene3D, robotItems, CharSpec} from '../engine/Scene3D';
import {SIM_ENV, SIM_FOUNDRY, SimBg, arc3, simWorld} from '../sets/SimWorld';
import {LADLE} from '../sets/Foundry';
import {makeJump, walkToEdge} from '../robot/jump';
import {blendPose} from '../robot/motion';
import {Pose, solve} from '../robot/rig';
import {makeTrial} from '../robot/trial';
import {T, NARR_END, blockStart} from '../cues';
import {PROVE_END, barriers, surfaceRing} from './Prove';
import {FoundryScene, easeInOut, easeOut} from './HookFoundry';
import {Character, IDLE} from '../../components/Character';
import {CAST} from '../../components/cast';
import {C, F} from '../../theme';

export const END_START = PROVE_END;
export const END_FRAMES_TOTAL = Math.round((NARR_END + 2.95) * 30);
const END_T = END_FRAMES_TOTAL / 30;
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const SL = {dir: norm([-0.4, 0.85, 0.45])};
const G0 = SIM_FOUNDRY;

const T_SHAPE = T('Partly, it’s the shape') - 0.1;
const T_WHEN = T('When something with arms') - 0.1;
const T_ARMS = T('arms, legs');
const T_LEGS = T('legs and a head');
const T_HEAD = T('a head walks');
const T_LOOKS = T('it looks like someone') - 0.08;
const T_BUT = T('But the choice wasn’t') - 0.1;
const T_PEOPLE = T('People picked the ending') - 0.12;
const T_BUILT = T('built the target') - 0.06;
const T_WROTE = T('wrote the score') - 0.06;
const T_POLICY = T('The policy just got') - 0.12;
const T_REACH = T('reaching it');
const T_DOES = T('Does retiring hardware') - 0.12;
const T_THESE = T('These robots didn’t') - 0.12;
const T_STUCK = T('stuck the landing');
const T_STING = T_STUCK + 1.5;

// ---------------------------------------------------------------- the last robot: walk, stop, leap, hang, enter
const WALK = {steps: 8, speed: 76};
const WALK_END = END_START + (WALK.steps * 58) / WALK.speed + 0.5;
const TO = T('leaps') + 0.1;
const IN = T('retiring') + 0.55;
const FINAL = makeJump({
  tTakeoff: TO, tEntry: IN,
  ramp: [[TO, 1], [TO + 0.3, 1], [TO + 0.6, 0.015], [IN - 0.8, 0.015], [IN - 0.3, 1], [IN, 1]],
  pushDur: 0.62,
});
const PUSH0 = TO - 0.62;
const lastRobot = (tau: number): {pose: Pose; phase: string; clipY?: number; t: number; tIn: number} => {
  if (tau < WALK_END) return {pose: walkToEdge(tau - END_START, WALK), phase: 'walk', t: -9, tIn: FINAL.T};
  if (tau < PUSH0) {
    const settle = smooth((tau - WALK_END) / (PUSH0 - WALK_END));
    return {pose: blendPose(walkToEdge(WALK_END - END_START, WALK), FINAL.K.look, settle), phase: 'stand', t: -9, tIn: FINAL.T};
  }
  const s = FINAL.at(FINAL.phys(tau));
  return {pose: s.pose, phase: s.phase, clipY: s.clipY, t: s.t, tIn: s.tIn};
};
const ARMS = ['upper', 'fore', 'shoulder', 'elbowAct', 'wristAct', 'palm', 'mitt'];
const LEGS = ['thigh', 'shin', 'kneeAct', 'foot', 'ankleAct'];
const HEAD = ['head', 'neck'];
const pulse = (tau: number, t0: number) => (tau < t0 ? 0 : Math.max(0, 1 - Math.abs(tau - t0 - 0.35) / 0.55)) * 0.55;

/** Crew standing behind the barriers on the far side of the ladle (they face the deck). */
const CREW: CharSpec[] = [
  {id: 'c1', look: CAST.clerkA, pose: {...IDLE, armL: {a: 18, b: 85}, armR: {a: 10, b: 20}, lookX: -0.5, lookY: -0.5, mouth: 'flat'}, feet: [700, 0, 200], seed: 7},
  {id: 'c2', look: CAST.checker, pose: {...IDLE, armL: {a: 12, b: 25}, armR: {a: 26, b: 100}, lookX: -0.6, lookY: -0.6, mouth: 'flat'}, feet: [760, 0, 20], seed: 9},
  {id: 'c3', look: CAST.clerkC, pose: {...IDLE, armL: {a: 8, b: 12}, armR: {a: 8, b: 12}, lookX: -0.6, lookY: -0.5, mouth: 'flat'}, feet: [710, 0, -170], seed: 11},
];

/** Glowing outline drawn over the robot, revealed from the head down. */
const OutlineTrace: React.FC<{pr: Proj; pose: Pose; k: number; color: string}> = ({pr, pose, k, color}) => {
  if (k <= 0) return null;
  const defs: React.ReactNode[] = [];
  const glow = robotItems(pr, {id: 'olg', pose, ghost: {stroke: color, fill: 'none', fillOpacity: 0, width: 12}}, defs);
  const line = robotItems(pr, {id: 'oll', pose, ghost: {stroke: '#FFF6DF', fill: 'none', fillOpacity: 0, width: 3.2}}, defs);
  const sk = solve(pose);
  const top = pr.p(add(sk.head.o, [0, 30, 0])).y;
  const bot = Math.max(pr.p(sk.side.L.ankle).y, pr.p(sk.side.R.ankle).y) + 40;
  const y = mix(top - 20, bot, easeInOut(k));
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      <defs>
        <clipPath id="traceclip"><rect x={0} y={0} width={1920} height={Math.max(0, y)} /></clipPath>
      </defs>
      <g clipPath="url(#traceclip)">
        <g opacity={0.45}>{glow.map((it) => it.el)}</g>
        <g>{line.map((it) => it.el)}</g>
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------- the three choices (flat illustrated set)
const Stations: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  // a lateral camera whip-pans between three work stations on the words
  const stops = [T_PEOPLE, T_BUILT, T_WROTE];
  let x = 0;
  let blur = 0;
  stops.forEach((t0, i) => {
    if (i === 0) return;
    const w = seg(tau, t0 - 0.12, t0 + 0.22);
    x += easeInOut(w) * 1920;
    blur = Math.max(blur, Math.sin(w * Math.PI) * 18);
  });
  const zoom = 1 + 0.05 * seg(tau, T_PEOPLE, T_POLICY);
  const pin = easeOut(seg(tau, T('the ending') - 0.05, T('the ending') + 0.3));
  const ring = easeOut(seg(tau, T('the target') - 0.05, T('the target') + 0.35));
  const score = seg(tau, T('the score') - 0.1, T('the score') + 0.6);
  const ch = (look: typeof CAST.clerkA, pose: typeof IDLE, gx: number, gy: number, s: number, seed: number, flip = false) => (
    <g transform={`translate(${gx - 200 * s} ${gy - 500 * s}) scale(${s})`}>
      <Character look={look} pose={pose} frame={f} seed={seed} flip={flip} />
    </g>
  );
  const typing = Math.sin(tau * 26) * 6;
  return (
    <AbsoluteFill style={{background: C.paper, filter: blur > 0.5 ? `blur(${blur * 0.35}px)` : undefined}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <g transform={`translate(960 540) scale(${zoom}) translate(${-960 - x} -540)`}>
          {/* continuous back wall + floor across the three stations */}
          <rect x={-200} y={0} width={6200} height={760} fill="#F4ECD6" />
          <rect x={-200} y={760} width={6200} height={320} fill="#E6DCC0" />
          <rect x={-200} y={752} width={6200} height={14} fill={C.paperLine} />
          {/* 1 · the planning wall: storyboard cards of the ending */}
          <rect x={200} y={150} width={1180} height={470} rx={18} fill="#C9A16E" stroke={C.ink} strokeWidth={6} />
          {[0, 1, 2, 3].map((k) => {
            const cx = 330 + k * 280;
            const lift = k === 3 ? -14 * pin : 0;
            return (
              <g key={k} transform={`translate(${cx} ${330 + lift}) rotate(${[-3, 2, -2, 3][k] * (k === 3 ? 1 - pin : 1)})`}>
                <rect x={-110} y={-110} width={220} height={220} rx={8} fill="#FFFFFF" stroke={k === 3 ? C.coral : C.ink} strokeWidth={k === 3 ? 4 + 6 * pin : 4} />
                <circle cx={0} cy={-100} r={9} fill={C.coral} stroke={C.ink} strokeWidth={3} />
                {k === 0 ? <g stroke={C.ink} strokeWidth={5} fill="none"><path d="M-80 10 H10 V70" /><path d="M10 10 l14 0" stroke={C.saffronDeep} /></g> : null}
                {k === 1 ? <path d="M-80 0 Q-10 -90 60 40" stroke={C.ink} strokeWidth={5} strokeDasharray="12 9" fill="none" /> : null}
                {k === 2 ? <g><path d="M-60 0 L60 0 L48 70 L-48 70 Z" fill="#6B4B3A" stroke={C.ink} strokeWidth={5} /><ellipse cx={0} cy={0} rx={60} ry={12} fill="#FF9A3C" stroke={C.ink} strokeWidth={4} /></g> : null}
                {k === 3 ? <g><path d="M-60 20 L60 20 L48 80 L-48 80 Z" fill="#6B4B3A" stroke={C.ink} strokeWidth={5} /><ellipse cx={0} cy={20} rx={60} ry={12} fill="#FF9A3C" stroke={C.ink} strokeWidth={4} /><path d="M-30 10 Q-40 -50 -10 -60 M30 10 Q40 -50 10 -60 M0 8 L0 -70" stroke={C.saffronDeep} strokeWidth={5} fill="none" strokeLinecap="round" /></g> : null}
              </g>
            );
          })}
          {ch(CAST.checker, {...IDLE, armR: {a: mix(30, 120, pin), b: mix(40, 20, pin)}, armL: {a: 10, b: 20}, lookX: 0.6, lookY: -0.3, mouth: pin > 0.5 ? 'smirk' : 'flat', lean: -3}, 1350, 1010, 1.25, 12, true)}
          {/* 2 · building the target: a monitor with the virtual platform, the ring dropped into place */}
          <g transform="translate(1920 0)">
            <rect x={300} y={260} width={900} height={500} rx={20} fill="#1E2026" stroke={C.ink} strokeWidth={8} />
            <rect x={330} y={290} width={840} height={440} fill="#EAF1FC" />
            {Array.from({length: 9}, (_, i) => <line key={'g' + i} x1={330} y1={470 + i * 30} x2={1170} y2={470 + i * 30} stroke="#9DBBEA" strokeWidth={2} />)}
            <path d="M380 470 H620 V730 H380 Z" fill="#C7DAF6" stroke="#4F7CC9" strokeWidth={4} />
            <g transform={`translate(${900} ${mix(380, 600, ring)}) scale(${mix(1.4, 1, ring)})`} opacity={ring}>
              <ellipse cx={0} cy={0} rx={110} ry={30} fill="none" stroke={C.teal} strokeWidth={22} />
              <ellipse cx={0} cy={0} rx={22} ry={7} fill={C.teal} />
            </g>
            <rect x={680} y={760} width={140} height={80} fill="#2B2B33" />
            <rect x={560} y={830} width={380} height={24} rx={8} fill="#2B2B33" />
            {ch(CAST.clerkC, {...IDLE, armL: {a: mix(40, 70, ring), b: 90}, armR: {a: 10, b: 20}, lookX: -0.5, lookY: -0.2, mouth: 'flat'}, 1450, 1030, 1.25, 13, true)}
          </g>
          {/* 3 · writing the score: a laptop of abstract code, one line turns teal and a check lands in the ring */}
          <g transform="translate(3840 0)">
            <rect x={340} y={250} width={980} height={560} rx={22} fill="#2B2F38" stroke={C.ink} strokeWidth={8} />
            <rect x={370} y={280} width={920} height={500} fill="#1A1D24" />
            {Array.from({length: 9}, (_, i) => {
              const w = [420, 300, 520, 260, 600, 380, 460, 220, 340][i];
              const on = i === 5 ? score : 0;
              return <rect key={'c' + i} x={410 + (i % 3 === 1 ? 40 : 0)} y={312 + i * 50} width={w * (i === 5 ? 0.3 + 0.7 * clamp01(score * 1.4) : 1)} height={20} rx={10} fill={on > 0 ? C.teal : '#4A5160'} />;
            })}
            <g transform="translate(1130 560)" opacity={clamp01(score * 1.5)}>
              <circle r={70} fill="none" stroke={C.teal} strokeWidth={16} />
              <path d="M-30 0 L-6 24 L34 -22" stroke="#FFFFFF" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={clamp01(score * 2 - 0.8)} />
            </g>
            <path d="M280 810 L1380 810 L1440 880 L220 880 Z" fill="#3F4652" stroke={C.ink} strokeWidth={6} />
            {ch(CAST.clerkB, {...IDLE, armL: {a: 55, b: 100 + typing}, armR: {a: 55, b: 100 - typing}, lookX: -0.4, lookY: 0.4, mouth: 'flat'}, 1620, 1060, 1.3, 14, true)}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- the composition
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const tau = END_START + f / 30;
  const R = lastRobot(tau);
  const eIn = {at: FINAL.p1, t: tau - IN, seed: 41};
  const gone = R.phase === 'plunge' && R.t - R.tIn > 1.4;
  const robot = gone ? [] : [{pose: R.pose, id: 'last', inside: R.phase === 'plunge', clipY: R.clipY}];

  // E1: deck-level low angle at the edge; the robot walks toward the lens
  if (tau < T_SHAPE) {
    const u = seg(tau, END_START, T_SHAPE);
    const cam: Cam3 = {pos: lerp3([-262, 616, 70], [-262, 622, 52], u), target: lerp3([-620, 720, 0], [-560, 730, 0], u), fov: 46, roll: mix(-5, -2, u)};
    return <FoundryScene cam={cam} tau={tau} robots={robot} entries={[]} />;
  }
  // E2: from behind, against the glow — the shape, traced
  if (tau < T_WHEN) {
    const u = seg(tau, T_SHAPE, T_WHEN);
    const p = R.pose.pos;
    const cam: Cam3 = {pos: add(p, [mix(-250, -215, u), 45, 55]), target: add(p, [200, 10, 0]), fov: 46};
    const pr = makeProj(cam);
    return (
      <AbsoluteFill>
        <FoundryScene cam={cam} tau={tau} robots={robot} entries={[]} />
        <OutlineTrace pr={pr} pose={R.pose} k={seg(tau, T('the shape') - 0.25, T('the shape') + 0.55)} color="#FFB45A" />
      </AbsoluteFill>
    );
  }
  // E3: side tracking at deck level; arms, legs, head light up on the words; it stops, crouches and leaps
  if (tau < T_LOOKS) {
    const p = R.pose.pos;
    const air = seg(tau, TO - 0.1, T_LOOKS);
    const x = p[0];
    const cam: Cam3 = {pos: [x + 60 + 40 * air, 705 + 40 * air, 340 - 20 * air], target: [x + 20, mix(735, p[1] + 20, air), 0], fov: 44, roll: -2 * air};
    const highlight = [
      ...ARMS.map((prefix) => ({prefix, color: C.teal, amount: pulse(tau, T_ARMS)})),
      ...LEGS.map((prefix) => ({prefix, color: C.teal, amount: pulse(tau, T_LEGS)})),
      ...HEAD.map((prefix) => ({prefix, color: C.teal, amount: pulse(tau, T_HEAD)})),
    ];
    return <FoundryScene cam={cam} tau={tau} robots={robot.map((r) => ({...r, highlight}))} entries={[]} />;
  }
  // E4: the jump hangs — a frontal portrait, slowly closing in; then a whip around to the people who chose
  if (tau < T_PEOPLE) {
    const tgt = add(R.pose.pos, [0, 45, 0]);
    if (tau < T_BUT) {
      const u = seg(tau, T_LOOKS, T_BUT);
      const cam: Cam3 = {pos: add(tgt, [mix(330, 250, easeOut(u)), 20, mix(110, 70, u)]), target: tgt, fov: mix(30, 24, u), roll: mix(2, -1, u)};
      return <FoundryScene cam={cam} tau={tau} robots={robot} entries={[]} />;
    }
    const w = easeInOut(seg(tau, T_BUT, T_BUT + 0.5));
    const a = mix(80, 258, w);
    const d = mix(300, 380, w);
    const look = lerp3(tgt, [640, 110, 20], easeInOut(seg(tau, T_BUT + 0.2, T_BUT + 1.0)));
    const cam: Cam3 = {pos: add(tgt, [Math.sin((a * Math.PI) / 180) * d, mix(20, 80, w), Math.cos((a * Math.PI) / 180) * d]), target: look, fov: mix(30, 34, w), roll: mix(-1, 3, w)};
    return (
      <AbsoluteFill style={{filter: w > 0.05 && w < 0.95 ? `blur(${Math.sin(w * Math.PI) * 5}px)` : undefined}}>
        <FoundryScene cam={cam} tau={tau} robots={robot} entries={[]} chars={CREW} frame={f} extra={(pr: Proj, env: Env) => barriers(pr, env, 1)} />
      </AbsoluteFill>
    );
  }
  // E5: picked the ending, built the target, wrote the score
  if (tau < T_POLICY) return <Stations tau={tau} f={f} />;
  // E6: the policy got very good at reaching it — attempts converge on the ring
  if (tau < T_DOES) {
    const u = easeInOut(seg(tau, T_POLICY, T_DOES));
    const cam: Cam3 = {pos: lerp3([320, 760, 760], [150, 520, 380], u), target: lerp3([-110, 470, 0], [-30, 360, 0], u), fov: 46};
    const pr = makeProj(cam);
    const lands = [-120, -70, 40, -40, -8, -26];
    const extra: Item[] = [];
    lands.forEach((lx, i) => {
      const tr = makeTrial({edgeX: G0.edgeX, deckY: G0.platTop, floorY: G0.floorY, lateral: 0, landX: lx, landing: 'stick', T: 0.95});
      extra.push(arc3(pr, 'ca' + i, tr.arc(), i < 3 ? '#9DBBEA' : C.teal, {opacity: mix(0.35, 0.8, i / 5), width: i < 3 ? 4 : 5}));
    });
    const final = makeTrial({edgeX: G0.edgeX, deckY: G0.platTop, floorY: G0.floorY, lateral: 0, landX: -18, landing: 'stick', T: 0.95});
    const s = final.at(tau - (T_REACH - 0.95));
    extra.push(arc3(pr, 'cfinal', final.arc(), C.teal, {upto: clamp01((tau - (T_REACH - 0.95)) / 0.95), width: 7}));
    const ghosts = lands.slice(0, 4).map((lx, i) => ({id: 'gh' + i, kind: 'SIM' as const, light: SL, opacity: 0.25,
      pose: makeTrial({edgeX: G0.edgeX, deckY: G0.platTop, floorY: G0.floorY, lateral: 0, landX: lx, landing: 'stick', T: 0.95}).at(2).pose,
      ghost: {stroke: '#7FA3DA', fill: '#DCE8FA', fillOpacity: 0.4, width: 1.6}}));
    const hit = tau - T_REACH;
    return (
      <AbsoluteFill>
        <Scene3D pr={pr} bg={<SimBg />} items={[...simWorld(pr, SIM_ENV, {geo: G0, ringPulse: hit > 0 ? Math.exp(-hit * 4) * Math.abs(Math.sin(hit * 12)) : 0}), ...extra]}
          robots={[...ghosts, {id: 'fin', pose: s.pose, kind: 'SIM', light: SL}]} frame={f} />
      </AbsoluteFill>
    );
  }
  // E7: the jump finishes in front of the crew (backlit silhouettes) while the question is asked
  if (tau < T_THESE) {
    const u = seg(tau, T_DOES, T_THESE);
    const cam: Cam3 = {pos: lerp3([1060, 150, 240], [1000, 150, 210], easeOut(u)), target: lerp3([-110, 470, 0], [-60, 430, 0], easeInOut(u)), fov: 46};
    const pr = makeProj(cam);
    const shake = eIn.t >= 0 ? Math.exp(-eIn.t * 5) * 0.6 : 0;
    const sil = CREW.map((c, i) => {
      const q = pr.p(c.feet);
      const s = ((c.height ?? 168) * q.s) / 440;
      return (
        <g key={c.id} transform={`translate(${q.x - 200 * s} ${q.y - 500 * s}) scale(${s})`}>
          <Character look={c.look} pose={{...c.pose, lookX: 0, lookY: 0}} frame={f} seed={20 + i} shadow={false} />
        </g>
      );
    });
    return (
      <AbsoluteFill>
        <FoundryScene cam={cam} tau={tau} robots={robot} entries={[eIn]} shake={shake} extra={(p2: Proj, env: Env) => barriers(p2, env, 1)} />
        {/* warm rim from the steel, then the solid silhouette */}
        <AbsoluteFill style={{filter: 'brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(-12deg) brightness(0.9)', transform: 'translate(-3px, -4px)', opacity: 0.85}}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080">{sil}</svg>
        </AbsoluteFill>
        <AbsoluteFill style={{filter: 'brightness(0)'}}>
          <svg width={1920} height={1080} viewBox="0 0 1920 1080">{sil}</svg>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  // E8: straight down onto the settling steel; the target ring appears where it went in, then opens into the sting
  const u = seg(tau, T_THESE, T_STING);
  const rot = mix(-8, 22, easeInOut(u));
  const cam: Cam3 = {pos: [Math.sin((rot * Math.PI) / 180) * 40, mix(1250, 1600, easeOut(u)), Math.cos((rot * Math.PI) / 180) * 40], target: [0, LADLE.steel, 0], fov: 30, roll: rot};
  const pr = makeProj(cam);
  const ringK = easeOut(seg(tau, T_STUCK - 0.05, T_STUCK + 0.5));
  const c: V3 = [FINAL.p1[0], LADLE.steel + 1, FINAL.p1[2]];
  const cq = pr.p(c);
  const open = easeInOut(seg(tau, T_STING, T_STING + 0.55));
  const word = easeOut(seg(tau, T_STING + 0.3, T_STING + 0.8));
  const tag = easeOut(seg(tau, T_STING + 0.65, T_STING + 1.1));
  const out = seg(tau, END_T - 0.35, END_T);
  return (
    <AbsoluteFill>
      <FoundryScene cam={cam} tau={tau} robots={[]} entries={[eIn]} flameScale={0.4}
        extra={(p2: Proj) => (ringK > 0 ? [surfaceRing(p2, c, 46, C.teal, 9, ringK, 'endRing'), surfaceRing(p2, c, 24, C.teal, 6, ringK * 0.85, 'endRing2')] : [])} />
      {open > 0 ? (
        <AbsoluteFill style={{background: C.paper, clipPath: `circle(${mix(40, 2300, open)}px at ${cq.x}px ${cq.y}px)`}}>
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 1 - out}}>
            <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 140, color: C.ink, letterSpacing: '-0.01em', transform: `scale(${mix(0.86, 1, word)})`, opacity: word}}>
              FUTURE <span style={{color: C.coral}}>GOT</span> WEIRD
            </div>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 48, color: C.inkSoft, marginTop: 12, opacity: tag, transform: `translateY(${(1 - tag) * 18}px)`}}>The strange future, explained.</div>
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
void blockStart;
export const END_EVENTS = {WALK, WALK_END, TO, IN, PUSH0, T_STING, T_ARMS, T_LEGS, T_HEAD, T_BUT, T_BUILT, T_WROTE, T_REACH, T_STUCK, T_SHAPE, T_PEOPLE, T_POLICY, T_DOES, T_THESE, T_LOOKS};
