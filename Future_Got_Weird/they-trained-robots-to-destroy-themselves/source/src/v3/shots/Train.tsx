// SECTION B4 (V3): how a final jump is trained, on the designed training stage (sets/Stage.tsx), which shares the
// foundry's world placement (tower = walkway, landing pedestal = ladle).
//   T1/T2  foundry: low angle at the edge, dolly-zoom down to the steel
//   T3     foundry → simulation: the robot holds its pose on the edge; the surroundings transform outward from its
//          feet (root and foot support unchanged), then the robot itself resolves into the training avatar
//   T4/T5  attempt 1 lands short; three checks
//   T6     one visible correction (the launch vector is nudged) causes one improved trial that lands on target
//   T7     many copies at once; T8 the face-plant gag; T9 performer reference
//   T10–12 the policy: into the head sensor, along the signal, out through the knee actuator, the correction, a reflex
// Conceptual illustration of simulation training in general, not Figure's simulator or data.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cam3, Proj, makeProj, camMix} from '../engine/camera';
import {V3, add, sub, mulS, clamp01, lerp3, mix, smooth, norm, len} from '../engine/math';
import {Item, box} from '../engine/prims';
import {Scene3D, RobotSpec, CharSpec} from '../engine/Scene3D';
import {STAGE, STAGE_ENV, StageBg, stage} from '../sets/Stage';
import {arc3} from '../sets/SimWorld';
import {DECK, LADLE} from '../sets/Foundry';
import {STAND, walkPose} from '../robot/motion';
import {Pose, solve} from '../robot/rig';
import {ModelKind} from '../robot/model';
import {makeTrial, TrialSpec} from '../robot/trial';
import {T, blockStart} from '../cues';
import {FILM_END} from './Film';
import {FoundryScene, foundryFrame, easeInOut, easeOut} from './HookFoundry';
import {Chip} from '../ui/Chip';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {C, F} from '../../theme';

export const TRAIN_START = FILM_END;
export const TRAIN_END = blockStart('B05') - 0.12;
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const SL = {dir: norm([-0.4, 0.85, 0.45])};
const G0 = STAGE;

const T_CANT = T('You can’t rehearse') - 0.1;
const T_SIM = T('So Figure says it trained') - 0.1;
const T_HOW = T('Here’s how that kind') - 0.1;
const T_TRY = T('A virtual robot tries') - 0.1;
const T_BAL = T('Did it stay balanced');
const T_PUSH = T('Push off cleanly');
const T_TGT = T('Land on target');
const T_NUDGE = T('The software nudges') - 0.1;
const T_COPIES = T('in many virtual copies') - 0.5;
const T_FALL = T('Virtual robots can fall') - 0.1;
const T_STUNT = T('Figure says it used stunt') - 0.1;
const T_POLICY = T('The result is called') - 0.1;
const T_FOOT = T('If a foot lands') - 0.1;
const T_WISH = T('Not a wish') - 0.1;
const T_REFLEX = T('More like a very');

const lookPose = (): Pose => {
  const p = STAND([DECK.edgeX - 34, DECK.y + 95.4, 0], Math.PI / 2);
  p.head.pitch = 0.42;
  return p;
};

// ---------------------------------------------------------------- trials (landing on the pedestal top)
const trial = (landX: number, landing: TrialSpec['landing'], lateral = 0, armStyle = 0) =>
  makeTrial({edgeX: G0.edgeX, deckY: G0.deckY, floorY: G0.padY, lateral, landX, landing, T: 0.95, armStyle});
const TRY1 = trial(-150, 'short');
const TRY2 = trial(-22, 'stick');
const FACE = trial(60, 'faceplant');
const LANES = [0, -460, -920];

const simCam = (u: number): Cam3 => ({pos: lerp3([520, 560, 640], [300, 740, 780], u), target: lerp3([-150, 520, 0], [-110, 470, 0], u), fov: 46, roll: mix(-3, 0, u)});

export const StageShot: React.FC<{cam: Cam3; robots: RobotSpec[]; extra?: Item[]; f: number; chars?: CharSpec[]; over?: React.ReactNode; lanes?: number[]; ringPulse?: number; ringColor?: string; grid?: number}> = ({cam, robots, extra = [], f, chars, over, lanes = [0], ringPulse, ringColor, grid}) => {
  const pr = makeProj(cam);
  const items: Item[] = [];
  lanes.forEach((z, k) => items.push(...stage(pr, STAGE_ENV, {lane: z, key: k === 0 ? '' : 'L' + k, floor: k === 0, ringPulse, ringColor, grid})));
  items.push(...extra);
  return (
    <AbsoluteFill>
      <Scene3D pr={pr} bg={<StageBg />} items={items} robots={robots} chars={chars} frame={f} />
      {over}
    </AbsoluteFill>
  );
};

/** Icon badge in screen space (✓/✗) attached to a world point. */
const Badge: React.FC<{x: number; y: number; ok: boolean; k: number; icon: 'level' | 'foot' | 'ring'}> = ({x, y, ok, k, icon}) => {
  if (k <= 0) return null;
  const s = 0.6 + 0.4 * easeOut(k);
  const col = ok ? C.teal : C.coral;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, k * 2)}>
      <rect x={-92} y={-46} width={184} height={92} rx={46} fill="#FFFFFF" stroke={col} strokeWidth={6} />
      {icon === 'level' ? <g><rect x={-66} y={-12} width={64} height={24} rx={12} fill="none" stroke={C.ink} strokeWidth={5} /><circle cx={-34} cy={0} r={7} fill={C.ink} /></g> : null}
      {icon === 'foot' ? <path d="M-64 14 L-20 14 Q-10 14 -10 4 L-10 -2 Q-24 -6 -30 -20 L-56 -20 Q-64 -20 -64 -10 Z" fill={C.ink} /> : null}
      {icon === 'ring' ? <g><circle cx={-36} cy={0} r={24} fill="none" stroke={C.ink} strokeWidth={6} /><circle cx={-36} cy={0} r={8} fill={C.ink} /></g> : null}
      <text x={44} y={20} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={58} fill={col}>{ok ? '✓' : '✗'}</text>
    </g>
  );
};

/** Launch vector at the edge: a 3D arrow from the toes along the take-off velocity (length ∝ speed). */
const launchArrow = (pr: Proj, key: string, v: V3, color: string, k: number): Item | null => {
  if (k <= 0) return null;
  const o: V3 = [G0.edgeX + 4, G0.deckY + 6, 0];
  const tip = add(o, mulS(v, 0.32 * k));
  const a = pr.p(o), b = pr.p(tip);
  const d = norm(sub(tip, o));
  const side = norm([-d[2] || 0.0001, 0, d[0]]);
  const h1 = pr.p(add(tip, add(mulS(d, -26), mulS([0, 1, 0], 12)))), h2 = pr.p(add(tip, add(mulS(d, -26), mulS([0, -1, 0], 12))));
  void side;
  return {z: a.z - 60, key, el: (
    <g key={key}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={9} strokeLinecap="round" />
      <path d={`M${b.x} ${b.y} L${h1.x} ${h1.y} L${h2.x} ${h2.y} Z`} fill={color} stroke={color} strokeWidth={4} strokeLinejoin="round" />
    </g>
  )};
};

// ---------------------------------------------------------------- the section
export const Train: React.FC = () => {
  const f = useCurrentFrame();
  const tau = TRAIN_START + f / 30;

  // T1 "Now the hard part.": low angle from under the edge, the robot against the overhead lights
  if (tau < T_CANT) {
    const u = smooth(seg(tau, TRAIN_START, T_CANT));
    const cam: Cam3 = {pos: lerp3([-40, DECK.y - 70, 330], [-60, DECK.y - 40, 300], u), target: [DECK.edgeX - 34, DECK.y + 150, 0], fov: 40, roll: mix(6, 3, u)};
    return <FoundryScene cam={cam} tau={tau} robots={[{pose: lookPose(), id: 't1', inside: false}]} entries={[]} />;
  }
  // T2 "You can't rehearse a jump like this in a real furnace.": the drop from the edge, a slow dolly-zoom
  if (tau < T_SIM) {
    const u = easeInOut(seg(tau, T_CANT, T_SIM));
    const eye: V3 = [DECK.edgeX - 20, DECK.y + 168, 0];
    const back = mix(0, 140, u);
    const tgt: V3 = [-10, LADLE.steel, 0];
    const dir = norm(sub(tgt, eye));
    const cam: Cam3 = {pos: sub(eye, mulS(dir, back)), target: tgt, fov: mix(62, 36, u)};
    return <FoundryScene cam={cam} tau={tau} robots={[]} entries={[]} />;
  }
  // T3 "So Figure says it trained a new AI model in simulation.": the surroundings transform around the standing robot
  if (tau < T_HOW) return <SimTransform tau={tau} f={f} />;
  // T4 label + T5 attempt 1 + the three checks
  if (tau < T_NUDGE) {
    const s1 = TRY1.at(tau - (T_TRY + 0.75));
    const u = smooth(seg(tau, T_HOW, T_NUDGE));
    const ub = seg(tau, T_BAL - 0.35, T_NUDGE);
    const cam = tau < T_BAL - 0.35 ? simCam(u) : {pos: lerp3([260, 720, 660], [230, 700, 620], ub), target: [-100, 500, 0] as V3, fov: 46};
    const pr = makeProj(cam);
    const extra = tau > T_TRY + 0.75 + 0.1 ? [arc3(pr, 'a1', TRY1.arc(), '#4F7CC9', {upto: clamp01((tau - T_TRY - 0.75) / 0.95)})] : [];
    const sk = solve(s1.pose);
    const torso = pr.p(add(sk.torso.o, [0, 70, 0]));
    const edge = pr.p([G0.edgeX, G0.deckY + 40, 140]);
    const ring = pr.p([G0.target[0], G0.padY + 120, 0]);
    return (
      <StageShot cam={cam} robots={[{id: 'try1', pose: s1.pose, kind: 'SIM', light: SL, ground: s1.phase === 'push' ? G0.deckY : G0.padY}]} extra={extra} f={f} ringColor={tau > T_TGT ? '#EF6B55' : undefined}
        over={(
          <>
            <Chip x={100} y={64} lines={['HOW THIS KIND OF TRAINING GENERALLY WORKS']} appear={tau - T_HOW} tone="blue" size={34} />
            <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
              <Badge x={torso.x + 140} y={torso.y - 60} ok k={seg(tau, T_BAL, T_BAL + 0.3)} icon="level" />
              <Badge x={edge.x} y={edge.y - 120} ok k={seg(tau, T_PUSH, T_PUSH + 0.3)} icon="foot" />
              <Badge x={ring.x + 40} y={ring.y - 40} ok={false} k={seg(tau, T_TGT, T_TGT + 0.3)} icon="ring" />
            </svg>
          </>
        )} />
    );
  }
  // T6 one correction: rewind; the launch vector (blue) is nudged longer and flatter (teal); the improved attempt
  // follows the new vector and lands in the ring
  if (tau < T_COPIES) {
    const tA2 = T_NUDGE + 2.3;
    const ua = easeInOut(seg(tau, T_NUDGE, T_COPIES));
    const cam: Cam3 = {pos: lerp3([-40, 690, 700], [80, 670, 650], ua), target: [-100, 470, 0], fov: 50, roll: mix(-2, 1, ua)};
    const pr = makeProj(cam);
    const rew = seg(tau, T_NUDGE, T_NUDGE + 0.8);
    let pose: Pose;
    let phase = 'push';
    if (tau < tA2 - 0.62) pose = TRY1.at((1 - easeInOut(rew)) * 2.2 - (rew >= 1 ? 0.62 : 0)).pose;
    else {
      const s = TRY2.at(tau - tA2);
      pose = s.pose;
      phase = s.phase;
    }
    const nudge = easeInOut(seg(tau, T_NUDGE + 1.0, T_NUDGE + 1.6));
    const vA = TRY1.v0, vB = TRY2.v0;
    const v = lerp3(vA, vB, nudge);
    const extra: Item[] = [arc3(pr, 'g1', TRY1.arc(), '#9DBBEA', {opacity: 0.5, width: 4})];
    const showArrow = seg(tau, T_NUDGE + 0.7, T_NUDGE + 0.95) * (1 - seg(tau, tA2 + 0.2, tA2 + 0.6));
    const ghostA = launchArrow(pr, 'arrA', vA, '#9DBBEA', nudge > 0 ? showArrow : 0);
    const arr = launchArrow(pr, 'arrB', v, nudge > 0.5 ? C.teal : '#4F7CC9', showArrow);
    if (ghostA && nudge > 0) extra.push(ghostA);
    if (arr) extra.push(arr);
    if (tau > tA2) extra.push(arc3(pr, 'g2', TRY2.arc(), C.teal, {upto: clamp01((tau - tA2) / 0.95), width: 6}));
    const hit = tau > tA2 + 0.95 ? clamp01(1 - (tau - tA2 - 0.95) / 0.6) : 0;
    const trail = tau < tA2 - 0.62 && rew < 1 ? [TRY1.at((1 - easeInOut(rew)) * 2.2 + 0.08).pose, TRY1.at((1 - easeInOut(rew)) * 2.2 + 0.16).pose] : undefined;
    return <StageShot cam={cam} robots={[{id: 'nud', pose, kind: 'SIM', light: SL, trail, ground: phase === 'push' ? G0.deckY : G0.padY}]} extra={extra} f={f} ringPulse={hit} />;
  }
  // T7 "and over, in many virtual copies at once": three lanes, staggered
  if (tau < T_FALL) {
    const u = easeInOut(seg(tau, T_COPIES, T_COPIES + 1.4));
    const back = easeInOut(seg(tau, T_FALL - 1.0, T_FALL));
    const camFar: Cam3 = {pos: [900, 1150, 1100], target: [-110, 380, -460], fov: 46};
    const cam = camMix(camMix(simCam(1), camFar, u), simCam(1), back);
    const outcomes: TrialSpec['landing'][] = ['short', 'stick', 'stick'];
    const lands = [-140, -26, -14];
    const robots: RobotSpec[] = LANES.map((z, k) => {
      const tr = makeTrial({edgeX: G0.edgeX, deckY: G0.deckY, floorY: G0.padY, lateral: z, landX: lands[k], landing: outcomes[k], T: 0.95, armStyle: k * 0.2});
      const start = T_COPIES + 0.4 + k * 0.17;
      const s = tr.at(tau - start);
      return {id: 'ln' + k, pose: s.pose, kind: 'SIM' as ModelKind, light: SL, ground: s.phase === 'push' ? G0.deckY : G0.padY};
    });
    return <StageShot cam={cam} robots={robots} f={f} lanes={LANES} />;
  }
  // T8 face-plant gag: nobody files an incident report (the clerk stands on the stage floor beside the pedestal)
  if (tau < T_STUNT) {
    const s = FACE.at(tau - (T_FALL + 1.0));
    const u = smooth(seg(tau, T_FALL, T_STUNT));
    const cam: Cam3 = {pos: lerp3([520, 640, 600], [470, 610, 560], u), target: [80, 360, 60], fov: 46};
    const shrug = seg(tau, T('nobody files') - 0.1, T('nobody files') + 0.4);
    const chars: CharSpec[] = [{id: 'clerk', look: CAST.clerkA, pose: {...IDLE, armL: {a: 40 + 35 * shrug, b: 70 + 40 * shrug}, armR: {a: 20, b: 95}, brows: 0.6 * shrug, mouth: shrug > 0.5 ? 'flat' : 'smile', lookX: -0.6, tilt: -6 * shrug}, feet: [40, G0.padY, -120], seed: 2, holdR: (<g transform="translate(26 -30) rotate(8) scale(0.55)">
              <rect x={-70} y={-90} width={140} height={190} rx={10} fill="#C9924F" stroke={C.ink} strokeWidth={6} />
              <rect x={-58} y={-70} width={116} height={156} rx={4} fill="#FFFFFF" stroke={C.ink} strokeWidth={4} />
              <text x={0} y={-36} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={22} fill={C.ink}>INCIDENT</text>
              <text x={0} y={-10} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={22} fill={C.ink}>REPORT</text>
              {[0, 1, 2].map((k) => <line key={k} x1={-40} y1={20 + k * 22} x2={40} y2={20 + k * 22} stroke="#D9DEE4" strokeWidth={6} />)}
            </g>)}];
    return <StageShot cam={cam} robots={[{id: 'face', pose: s.pose, kind: 'SIM', light: SL, ground: s.phase === 'push' ? G0.deckY : G0.padY}]} f={f} chars={chars} />;
  }
  // T9 stunt-performer reference: performer and virtual robot share one arc (two lanes)
  if (tau < T_POLICY) {
    const start = T_STUNT + 1.0;
    const perf = makeTrial({edgeX: G0.edgeX, deckY: G0.deckY, floorY: G0.padY, lateral: -230, landX: -22, landing: 'stick', T: 0.95});
    const bot = makeTrial({edgeX: G0.edgeX, deckY: G0.deckY, floorY: G0.padY, lateral: 230, landX: -22, landing: 'stick', T: 0.95});
    const u = smooth(seg(tau, T_STUNT, T_POLICY));
    const cam: Cam3 = {pos: lerp3([260, 720, 1080], [200, 690, 1000], u), target: [-110, 460, 0], fov: 46};
    const pr = makeProj(cam);
    const extra = [
      arc3(pr, 'pa', perf.arc(), '#7656C2', {upto: clamp01((tau - start) / 0.95)}),
      arc3(pr, 'ba', bot.arc(), '#4F7CC9', {upto: clamp01((tau - start - 0.25) / 0.95)}),
    ];
    const sp = perf.at(tau - start), sb = bot.at(tau - start - 0.25);
    return (
      <StageShot cam={cam} robots={[{id: 'perf', pose: sp.pose, kind: 'PERF', light: SL, ground: sp.phase === 'push' ? G0.deckY : G0.padY}, {id: 'pbot', pose: sb.pose, kind: 'SIM', light: SL, ground: sb.phase === 'push' ? G0.deckY : G0.padY}]} extra={extra} f={f} lanes={[-230, 230]}
        over={(
          <div style={{position: 'absolute', left: 100, bottom: 70, display: 'flex', gap: 24, opacity: seg(tau, T_STUNT + 0.3, T_STUNT + 0.7)}}>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: '#FFFFFF', background: '#6A4BB4', borderRadius: 14, padding: '10px 22px'}}>stunt performer</div>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: '#FFFFFF', background: '#3A5FA0', borderRadius: 14, padding: '10px 22px'}}>virtual robot</div>
          </div>
        )} />
    );
  }
  // T10–T12: the policy, from a sensor to a joint
  return <PolicyShot tau={tau} f={f} />;
};

// ---------------------------------------------------------------- T3: foundry → simulation
const SimTransform: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  const u = smooth(seg(tau, T_SIM, T_HOW));
  const cam: Cam3 = {pos: lerp3([260, 820, 640], [330, 780, 760], u), target: [-140, 470, 0], fov: 46};
  const pr = makeProj(cam);
  const pose = lookPose();
  const feet = pr.p([DECK.edgeX - 34, DECK.y, 0]);
  // the surroundings transform outward from the robot's feet (12–16 frames), then the robot resolves (top → bottom)
  const r = easeInOut(seg(tau, T_SIM + 0.35, T_SIM + 0.85)) * 2400;
  const rs = easeInOut(seg(tau, T_SIM + 0.75, T_SIM + 1.15));
  const sk = solve(pose);
  const top = pr.p(add(sk.head.o, [0, 30, 0])).y, bot = feet.y + 10;
  const scanY = mix(top, bot, rs);
  const done = rs >= 1;
  const {nodes, defs} = foundryFrame({cam, tau, robots: [], entries: []});
  const robotLayer = (kind: ModelKind, clip: string) => (
    <AbsoluteFill style={{clipPath: clip}}>
      <Scene3D pr={pr} bg={null} items={[]} robots={[{id: 't3r' + kind, pose, kind, light: SL}]} frame={f} />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: '#18141C'}}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080"><defs>{defs}</defs>{nodes}</svg>
      </AbsoluteFill>
      {r > 0 ? (
        <AbsoluteFill style={{clipPath: `circle(${r.toFixed(1)}px at ${feet.x.toFixed(1)}px ${feet.y.toFixed(1)}px)`}}>
          <StageShot cam={cam} robots={[]} f={f} grid={0.6 * (1 - seg(tau, T_SIM + 1.2, T_SIM + 2.2))} />
        </AbsoluteFill>
      ) : null}
      {r > 0 && r < 2400 ? (
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
          <circle cx={feet.x} cy={feet.y} r={r} fill="none" stroke="#BFE9FF" strokeWidth={10} opacity={0.9} />
          <circle cx={feet.x} cy={feet.y} r={Math.max(0, r - 26)} fill="none" stroke="#BFE9FF" strokeWidth={4} opacity={0.4} />
        </svg>
      ) : null}
      {done ? robotLayer('SIM', 'none') : (
        <>
          {robotLayer('F02', `polygon(0 ${scanY}px, 1920px ${scanY}px, 1920px 1080px, 0 1080px)`)}
          {rs > 0 ? robotLayer('SIM', `polygon(0 0, 1920px 0, 1920px ${scanY}px, 0 ${scanY}px)`) : null}
          {rs > 0 ? <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}><rect x={feet.x - 160} y={scanY - 2} width={320} height={4} fill="#BFE9FF" /></svg> : null}
        </>
      )}
      <Chip x={100} y={64} lines={['FIGURE SAYS', 'a new AI model, trained in simulation']} appear={tau - T_SIM - 1.3} tone="blue" size={34} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- policy: sensor → signal → actuator → correction
// The virtual F.02-shaped robot walks across the open stage floor (z = 330: clear of the tower legs and the pedestal).
const WALK0: V3 = [-430, 0, 330];
const WALK_V = 70;
const policyWalk = (tau: number, until = Infinity) => walkPose(WALK0, Math.PI / 2, Math.max(0, (Math.min(tau, until) - (T_POLICY - 0.5)) * WALK_V), 0, {stride: 56});
const PolicyShot: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  const early = seg(tau, T('lands a little early') - 0.1, T('lands a little early') + 0.4);
  const fix = seg(tau, T('adjusts the knee') - 0.2, T('before the robot tips') + 0.2);
  const tip = early * (1 - fix);
  let pose = policyWalk(tau);
  if (tau > T_FOOT) {
    // freeze the walk mid-stride on the raised plate, tilt, then correct at the knee and ankle
    const frozen = policyWalk(T_FOOT);
    pose = {...frozen, roll: frozen.roll + 0.16 * tip, pitch: frozen.pitch - 0.1 * tip};
    if (pose.footR) pose.footR = {...pose.footR, pos: add(pose.footR.pos, [0, 6 * early, 0]), roll: -0.25 * early * (1 - fix)};
    pose.armL = {...pose.armL, roll: 0.14 + 0.5 * tip};
    pose.armR = {...pose.armR, roll: 0.14 + 0.3 * tip};
  }
  // reflex tap: sitting on the tower's launch edge, legs over the edge, the hammer taps the knee and the shin kicks
  const reflex = tau > T_REFLEX - 0.2;
  if (reflex) {
    const kick = Math.max(0, Math.sin(clamp01((tau - T_REFLEX - 0.55) / 0.4) * Math.PI));
    const p = STAND([G0.edgeX - 14, G0.deckY + 12, 0], Math.PI / 2);
    p.legL = {pitch: 1.5, roll: 0.05, knee: 1.5 - 0.9 * kick, ankle: 0.1};
    p.legR = {pitch: 1.5, roll: 0.05, knee: 1.5, ankle: 0.1};
    p.footL = undefined;
    p.footR = undefined;
    p.armL = {pitch: 0.2, roll: 0.3, twist: 0, elbow: 0.4, wrist: 0, grip: 0.4};
    p.armR = {pitch: 0.2, roll: 0.3, twist: 0, elbow: 0.4, wrist: 0, grip: 0.4};
    pose = p;
  }
  const sk = solve(pose);
  const frozenR = policyWalk(T_FOOT).footR!.pos;
  const bumpPos: V3 = [frozenR[0] + 4, 0, frozenR[2]];
  // signal path: head sensor → policy (chest) → hip → knee → ankle
  const head = add(sk.head.o, [10, 9, 6]);
  const chip = add(sk.torso.o, [0, 22, 6]);
  const pathPts: V3[] = [head, add(sk.neck.o, [0, 2, 6]), chip, add(sk.pelvis, [0, 0, 6]), add(sk.side.R.hip, [0, 0, 4]), add(sk.side.R.knee, [0, 0, 6]), add(sk.side.R.ankle, [0, 0, 4])];
  const cum = [0];
  for (let i = 1; i < pathPts.length; i++) cum.push(cum[i - 1] + len(sub(pathPts[i], pathPts[i - 1])));
  const along = (u: number): V3 => {
    const d = clamp01(u) * cum[cum.length - 1];
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const r = (d - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    return lerp3(pathPts[i - 1], pathPts[i], r);
  };
  // camera: wide → into the head sensor → ride the signal down to the knee → out through the actuator → the leg
  const tIn0 = T_POLICY, tIn1 = T_POLICY + 1.2;         // push into the sensor ("The result is called a policy")
  const tRide0 = tIn1 + 0.15, tRide1 = T('into motor commands') + 0.2;
  const tOut1 = T('many times a second') + 0.6;
  const side: V3 = [0, 0, 1];                              // the robot's right side faces +z
  const wide: Cam3 = {pos: add(sk.pelvis, [120, 140, 470]), target: add(sk.pelvis, [0, 20, 0]), fov: 44};
  const lens: Cam3 = {pos: add(head, [8, 2, 26]), target: head, fov: 30};
  const rideU = easeInOut(seg(tau, tRide0, tRide1));
  const pulse = along(Math.min(0.83, 0.05 + rideU * 0.8));
  const ride: Cam3 = {pos: add(pulse, add(mulS(side, 62), [18, 12, 0])), target: pulse, fov: 38};
  const knee = sk.side.R.knee;
  const legCam: Cam3 = {pos: add(knee, [70, 34, 170]), target: add(knee, [-6, -4, 0]), fov: 42};
  let cam: Cam3;
  if (tau < tIn1) cam = camMix(wide, lens, easeInOut(seg(tau, tIn0, tIn1)));
  else if (tau < tRide0) cam = lens;
  else if (tau < tRide1) cam = camMix(lens, ride, easeInOut(seg(tau, tRide0, tRide0 + 0.5)));
  else if (tau < T_FOOT) cam = camMix(ride, legCam, easeInOut(seg(tau, tRide1, tOut1)));
  else {
    const drift = smooth(seg(tau, T_FOOT - 0.2, T('before the robot tips') + 0.3));
    const leg2: Cam3 = {pos: add(knee, [60 - 70 * drift, 30 + 10 * drift, 165 - 25 * drift]), target: add(knee, [0, 10, 0]), fov: 44 - 4 * drift};
    const orb = (seg(tau, T_WISH - 0.6, T_REFLEX - 0.2)) * 0.5;
    const wide2: Cam3 = {...wide, pos: add(sk.pelvis, [140 * Math.cos(orb) + 520 * Math.sin(orb), 160 - 30 * orb, 520 * Math.cos(orb) - 140 * Math.sin(orb)])};
    cam = camMix(camMix(legCam, leg2, easeInOut(seg(tau, T_FOOT, T_FOOT + 0.4))), wide2, easeInOut(seg(tau, T('before the robot tips') - 0.1, T_WISH + 0.5)));
  }
  if (reflex) {
    const r = smooth(seg(tau, T_REFLEX - 0.2, TRAIN_END));
    cam = {pos: add(sk.side.L.knee, [80 - 30 * r, 60 - 15 * r, 260 - 80 * r]), target: add(sk.side.L.knee, [-30, -10, 0]), fov: 42};
  }
  const pr = makeProj(cam);
  const P2 = pathPts.map((q) => pr.p(q));
  const rate = tau > T('many times a second') - 0.2 ? 3.2 : 1.1;
  const pulses = [0, 0.33, 0.66].map((o) => ((tau * rate + o) % 1));
  const pt = (u: number) => pr.p(along(u));
  const showLoop = tau > tIn1 - 0.3 && tau < T_WISH + 0.3 && !reflex;
  const xr = showLoop ? seg(tau, tIn1 - 0.3, tIn1) : 0;
  const cP = pr.p(chip);
  const actHot = seg(tau, tRide1 - 0.4, tRide1) * (1 - seg(tau, tOut1, tOut1 + 0.6));
  const hl = [
    {prefix: 'kneeActR', color: C.saffron, amount: 0.7 * Math.max(actHot, (0.25 + 0.5 * fix) * (tau > T_FOOT ? 1 : 0)) * (reflex ? 0 : 1)},
    {prefix: 'ankleActR', color: C.saffron, amount: (0.25 + 0.5 * fix) * (tau > T_FOOT ? 1 : 0) * (reflex ? 0 : 1)},
  ];
  const ham = reflex ? seg(tau, T_REFLEX - 0.2, T_REFLEX + 0.55) : 0;
  const kneeP = pr.p(add(sk.side.L.knee, [8, -6, 0]));
  const lensK = seg(tau, tIn1 - 0.35, tIn1) * (1 - seg(tau, tRide0, tRide0 + 0.35));   // inside the sensor: iris + first pulse
  const lensP = pr.p(head);
  const ground = reflex ? undefined : 0;
  return (
    <AbsoluteFill>
      <StageShot cam={cam} robots={[{id: 'pol', pose, kind: 'SIM', light: SL, highlight: hl, ground}]} f={f}
        extra={tau > T_FOOT - 0.5 && !reflex ? box(pr, STAGE_ENV, 'bump', {c: [bumpPos[0], 3, bumpPos[2]], size: [46, 6, 34], color: C.saffron}) : []}
        over={(
          <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
            {xr > 0 ? (
              <g opacity={xr}>
                <path d={'M' + P2.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join('L')} fill="none" stroke={C.saffron} strokeWidth={5} strokeDasharray="10 10" strokeOpacity={0.8} />
                {tau < tRide0 + 0.4 || tau > tRide1 ? pulses.map((u, k) => {
                  const q = pt(u * 0.83);
                  return <circle key={k} cx={q.x} cy={q.y} r={11} fill="#FFE07A" stroke={C.ink} strokeWidth={3} />;
                }) : (() => {
                  const q = pr.p(pulse);
                  return <circle cx={q.x} cy={q.y} r={18} fill="#FFE07A" stroke={C.ink} strokeWidth={4} />;
                })()}
                <rect x={cP.x - 34} y={cP.y - 24} width={68} height={48} rx={8} fill={C.ink} stroke={C.saffron} strokeWidth={5} />
                <g transform={`translate(${Math.min(1300, cP.x + 70)} ${Math.max(140, cP.y - 80)})`} opacity={seg(tau, T('a learned rule') - 0.3, T('a learned rule'))}>
                  <rect x={0} y={-60} width={520} height={110} rx={18} fill={C.paper} stroke={C.ink} strokeWidth={5} />
                  <text x={28} y={14} fontFamily={F.body} fontWeight={800} fontSize={56} fill={C.ink}>POLICY</text>
                  <text x={262} y={12} fontFamily={F.body} fontWeight={700} fontSize={34} fill={C.inkSoft}>a learned rule</text>
                </g>
              </g>
            ) : null}
            {lensK > 0 ? (
              <g opacity={lensK}>
                <circle cx={lensP.x} cy={lensP.y} r={180 + 900 * lensK} fill="none" stroke="#0B1620" strokeWidth={900 * lensK} opacity={0.85} />
                <circle cx={lensP.x} cy={lensP.y} r={60 + 40 * Math.sin(tau * 9)} fill="none" stroke={C.teal} strokeWidth={8} />
                <circle cx={lensP.x} cy={lensP.y} r={18} fill="#FFE07A" />
              </g>
            ) : null}
            {reflex ? (
              <g transform={`translate(${kneeP.x + 40} ${kneeP.y - 60}) rotate(${mix(-55, 10, easeOut(Math.min(1, ham * 1.8)))} 120 -20)`}>
                <rect x={0} y={-12} width={180} height={18} rx={9} fill="#9AA4AE" stroke={C.ink} strokeWidth={4} />
                <path d="M170 -40 L230 -40 Q246 -3 230 34 L170 34 Q190 -3 170 -40 Z" fill={C.coral} stroke={C.ink} strokeWidth={5} />
              </g>
            ) : null}
          </svg>
        )} />
    </AbsoluteFill>
  );
};
