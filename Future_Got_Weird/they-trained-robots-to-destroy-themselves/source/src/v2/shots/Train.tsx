// SECTION B4: how a final jump is trained. One large learning sequence (conceptual), the performer reference,
// and the policy explained by pushing into a sensor, following the signal to a joint, and pulling back out.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cam3, makeProj, camMix} from '../engine/camera';
import {V3, add, clamp01, lerp3, mix, smooth, norm} from '../engine/math';
import {Item, box} from '../engine/prims';
import {Scene3D, RobotSpec, CharSpec} from '../engine/Scene3D';
import {SIM_ENV, SIM_FOUNDRY, SimBg, arc3, simWorld} from '../sets/SimWorld';
import {DECK, LADLE} from '../sets/Foundry';
import {STAND, walkPose, blendPose} from '../robot/motion';
import {Pose, solve} from '../robot/rig';
import {makeTrial, TrialSpec} from '../robot/trial';
import {T, blockStart} from '../cues';
import {FILM_END} from './Film';
import {FoundryScene, easeInOut, easeOut} from './HookFoundry';
import {Chip} from '../ui/Chip';
import {CAST} from '../../components/cast';
import {IDLE} from '../../components/Character';
import {C, F} from '../../theme';

export const TRAIN_START = FILM_END;
export const TRAIN_END = blockStart('B05') - 0.12;
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const SL = {dir: norm([-0.4, 0.85, 0.45])};
const G0 = SIM_FOUNDRY;

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

// ---------------------------------------------------------------- trials
const trial = (landX: number, landing: TrialSpec['landing'], lateral = 0, armStyle = 0) =>
  makeTrial({edgeX: G0.edgeX, deckY: G0.platTop, floorY: G0.floorY, lateral, landX, landing, T: 0.95, armStyle});
const TRY1 = trial(-150, 'short');
const TRY2 = trial(-95, 'short');
const TRY3 = trial(-22, 'stick');
const FACE = trial(70, 'faceplant');
const tAt = (start: number, tau: number) => tau - start; // physical = screen in the sim (no ramps)

const simCam = (u: number): Cam3 => ({pos: lerp3([300, 700, 700], [260, 680, 640], u), target: [-110, 480, 0], fov: 50});

const SimShot: React.FC<{cam: Cam3; robots: RobotSpec[]; extra?: Item[]; f: number; chars?: CharSpec[]; over?: React.ReactNode; lanes?: number[]; ringPulse?: number; ringColor?: string}> = ({cam, robots, extra = [], f, chars, over, lanes = [0], ringPulse, ringColor}) => {
  const pr = makeProj(cam);
  const items: Item[] = [];
  lanes.forEach((z, k) => items.push(...simWorld(pr, SIM_ENV, {geo: G0, lane: z, key: k === 0 ? '' : 'L' + k, floor: k === 0, grid: k === 0 ? 1 : 0, ringPulse, ringColor})));
  items.push(...extra.map((x) => x));
  return (
    <AbsoluteFill>
      <Scene3D pr={pr} bg={<SimBg />} items={items} robots={robots} chars={chars} frame={f} />
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
    const dir = norm([tgt[0] - eye[0], tgt[1] - eye[1], tgt[2] - eye[2]]);
    const cam: Cam3 = {pos: [eye[0] - dir[0] * back, eye[1] - dir[1] * back, eye[2] - dir[2] * back], target: tgt, fov: mix(62, 36, u)};
    return <FoundryScene cam={cam} tau={tau} robots={[]} entries={[]} />;
  }
  // T3 "So Figure says it trained a new AI model in simulation.": the same shot converts into a virtual copy
  if (tau < T_HOW) {
    const u = smooth(seg(tau, T_SIM, T_HOW));
    const cam: Cam3 = {pos: lerp3([260, 820, 640], [330, 780, 760], u), target: [-140, 470, 0], fov: 46};
    const wipe = easeInOut(seg(tau, T_SIM + 0.4, T_SIM + 1.9));
    const x = wipe * 2200 - 140;
    const pose = lookPose();
    return (
      <AbsoluteFill>
        <FoundryScene cam={cam} tau={tau} robots={[{pose, id: 't3', inside: false}]} entries={[]} />
        <AbsoluteFill style={{clipPath: `polygon(0 0, ${x}px 0, ${x - 300}px 1080px, 0 1080px)`}}>
          <SimShot cam={cam} robots={[{id: 't3s', pose, kind: 'SIM', light: SL}]} f={f} />
        </AbsoluteFill>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
          {wipe > 0 && wipe < 1 ? <line x1={x} y1={0} x2={x - 300} y2={1080} stroke="#BFD7F7" strokeWidth={10} /> : null}
        </svg>
        {wipe >= 1 ? <Chip x={80} y={70} lines={['FIGURE SAYS', 'a new AI model, trained in simulation']} appear={tau - T_SIM - 1.9} tone="blue" size={32} /> : null}
      </AbsoluteFill>
    );
  }
  // T4 label + T5 attempt 1 + T5b the three checks
  if (tau < T_NUDGE) {
    const s1 = TRY1.at(tAt(T_TRY + 0.75, tau));
    const u = smooth(seg(tau, T_HOW, T_NUDGE));
    // cut in closer for the three checks
    const ub = seg(tau, T_BAL - 0.35, T_NUDGE);
    const cam = tau < T_BAL - 0.35 ? simCam(u) : {pos: lerp3([170, 560, 470], [140, 540, 430], ub), target: [-80, 430, 0] as V3, fov: 46};
    const pr = makeProj(cam);
    const ghost = tau > T_TRY + 0.75 + 0.1 ? [arc3(pr, 'a1', TRY1.arc(), '#4F7CC9', {upto: clamp01((tau - T_TRY - 0.75) / 0.95)})] : [];
    const sk = solve(s1.pose);
    const torso = pr.p(add(sk.torso.o, [0, 70, 0]));
    const edge = pr.p([G0.edgeX, G0.platTop + 40, 140]);
    const ring = pr.p([G0.target[0], G0.floorY + 120, 0]);
    const ringBad = tau > T_TGT ? 1 : 0;
    return (
      <SimShot cam={cam} robots={[{id: 'try1', pose: s1.pose, kind: 'SIM', light: SL}]} extra={ghost} f={f} ringColor={ringBad ? '#EF6B55' : undefined}
        over={(
          <>
            <Chip x={80} y={70} lines={['HOW THIS KIND OF TRAINING GENERALLY WORKS']} appear={tau - T_HOW} tone="blue" size={32} />
            <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
              <Badge x={torso.x + 140} y={torso.y - 60} ok k={seg(tau, T_BAL, T_BAL + 0.3)} icon="level" />
              <Badge x={edge.x} y={edge.y - 120} ok k={seg(tau, T_PUSH, T_PUSH + 0.3)} icon="foot" />
              <Badge x={ring.x + 40} y={ring.y - 40} ok={false} k={seg(tau, T_TGT, T_TGT + 0.3)} icon="ring" />
            </svg>
          </>
        )} />
    );
  }
  // T6 nudge: rewind, attempt 2 lands closer, attempt 3 sticks it; earlier arcs stay as faint ghosts
  if (tau < T_COPIES) {
    const tA2 = T_NUDGE + 0.9, tA3 = T_NUDGE + 3.0;
    // a new angle for the corrections: in front of the platform, drifting round as the attempts improve
    const ua = easeInOut(seg(tau, T_NUDGE, T_COPIES));
    const cam: Cam3 = {pos: lerp3([-30, 610, 650], [90, 590, 610], ua), target: [-100, 450, 0], fov: 50, roll: mix(-2, 1, ua)};
    const pr = makeProj(cam);
    const rew = seg(tau, T_NUDGE, T_NUDGE + 0.8);
    let pose: Pose;
    if (tau < tA2 - 0.62) {
      // rewind: the failed attempt plays backwards to the edge
      const back = (1 - easeInOut(rew)) * 2.2;
      pose = TRY1.at(back).pose;
    } else if (tau < tA3 - 0.62) pose = TRY2.at(tau - tA2).pose;
    else pose = TRY3.at(tau - tA3).pose;
    const extra: Item[] = [arc3(pr, 'g1', TRY1.arc(), '#9DBBEA', {opacity: 0.5, width: 4})];
    if (tau > tA2) extra.push(arc3(pr, 'g2', TRY2.arc(), tau > tA3 ? '#9DBBEA' : '#4F7CC9', {upto: clamp01((tau - tA2) / 0.95), opacity: tau > tA3 ? 0.6 : 0.9}));
    if (tau > tA3) extra.push(arc3(pr, 'g3', TRY3.arc(), C.teal, {upto: clamp01((tau - tA3) / 0.95), width: 6}));
    const hit = tau > tA3 + 0.95 ? clamp01(1 - (tau - tA3 - 0.95) / 0.6) : 0;
    const trail = tau < tA2 - 0.62 ? [TRY1.at((1 - easeInOut(rew)) * 2.2 + 0.08).pose, TRY1.at((1 - easeInOut(rew)) * 2.2 + 0.16).pose] : undefined;
    return <SimShot cam={cam} robots={[{id: 'nud', pose, kind: 'SIM', light: SL, trail}]} extra={extra} f={f} ringPulse={hit} />;
  }
  // T7 "and over, in many virtual copies at once": five large lanes, then back to one success
  if (tau < T_FALL) {
    const lanes = [-300, 0, 300];
    const u = easeInOut(seg(tau, T_COPIES, T_COPIES + 1.4));
    const back = easeInOut(seg(tau, T_FALL - 1.0, T_FALL));
    const camFar: Cam3 = {pos: [620, 1000, 1180], target: [-110, 400, 0], fov: 48};
    const cam = camMix(camMix(simCam(1), camFar, u), simCam(1), back);
    const outcomes: TrialSpec['landing'][] = ['short', 'stick', 'stick'];
    const lands = [-120, -30, -12];
    const robots: RobotSpec[] = lanes.map((z, k) => {
      const tr = makeTrial({edgeX: G0.edgeX, deckY: G0.platTop, floorY: G0.floorY, lateral: z, landX: lands[k], landing: outcomes[k], T: 0.95, armStyle: k * 0.2});
      const start = T_COPIES + 0.4 + k * 0.17;
      return {id: 'ln' + k, pose: tr.at(tau - start).pose, kind: 'SIM', light: SL};
    });
    return <SimShot cam={cam} robots={robots} f={f} lanes={lanes} />;
  }
  // T8 face-plant gag: nobody files an incident report
  if (tau < T_STUNT) {
    const s = FACE.at(tau - (T_FALL + 1.0));
    const u = smooth(seg(tau, T_FALL, T_STUNT));
    const cam: Cam3 = {pos: lerp3([460, 600, 560], [420, 570, 520], u), target: [60, 380, 60], fov: 46};
    const shrug = seg(tau, T('nobody files') - 0.1, T('nobody files') + 0.4);
    const chars: CharSpec[] = [{id: 'clerk', look: CAST.clerkA, pose: {...IDLE, armL: {a: 40 + 35 * shrug, b: 70 + 40 * shrug}, armR: {a: 20, b: 95}, brows: 0.6 * shrug, mouth: shrug > 0.5 ? 'flat' : 'smile', lookX: -0.6, tilt: -6 * shrug}, feet: [230, G0.floorY, -80], seed: 2, holdR: (<g transform="translate(26 -30) rotate(8) scale(0.55)">
              <rect x={-70} y={-90} width={140} height={190} rx={10} fill="#C9924F" stroke={C.ink} strokeWidth={6} />
              <rect x={-58} y={-70} width={116} height={156} rx={4} fill="#FFFFFF" stroke={C.ink} strokeWidth={4} />
              <text x={0} y={-36} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={22} fill={C.ink}>INCIDENT</text>
              <text x={0} y={-10} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={22} fill={C.ink}>REPORT</text>
              {[0, 1, 2].map((k) => <line key={k} x1={-40} y1={20 + k * 22} x2={40} y2={20 + k * 22} stroke="#D9DEE4" strokeWidth={6} />)}
            </g>)}];
    return <SimShot cam={cam} robots={[{id: 'face', pose: s.pose, kind: 'SIM', light: SL}]} f={f} chars={chars} />;
  }
  // T9 stunt-performer reference: performer and virtual robot share one arc
  if (tau < T_POLICY) {
    const start = T_STUNT + 1.0;
    const perf = makeTrial({edgeX: G0.edgeX, deckY: G0.platTop, floorY: G0.floorY, lateral: -90, landX: -22, landing: 'stick', T: 0.95});
    const bot = makeTrial({edgeX: G0.edgeX, deckY: G0.platTop, floorY: G0.floorY, lateral: 90, landX: -22, landing: 'stick', T: 0.95});
    const lag = seg(tau, start + 1.8, start + 2.6) * 0; // the robot matches the reference beat-for-beat
    const u = smooth(seg(tau, T_STUNT, T_POLICY));
    const cam: Cam3 = {pos: lerp3([200, 640, 760], [150, 610, 700], u), target: [-110, 440, 0], fov: 46};
    const pr = makeProj(cam);
    const extra = [
      arc3(pr, 'pa', perf.arc(), '#7656C2', {upto: clamp01((tau - start) / 0.95)}),
      arc3(pr, 'ba', bot.arc(), '#4F7CC9', {upto: clamp01((tau - start - 0.25) / 0.95)}),
    ];
    const pp = pr.p([G0.edgeX - 60, G0.platTop + 230, -90]);
    const bp = pr.p([G0.edgeX - 60, G0.platTop + 230, 90]);
    return (
      <SimShot cam={cam} robots={[{id: 'perf', pose: perf.at(tau - start).pose, kind: 'PERF', light: SL}, {id: 'pbot', pose: bot.at(tau - start - 0.25 - lag).pose, kind: 'SIM', light: SL}]} extra={extra} f={f} lanes={[-90, 90]}
        over={(
          <div style={{position: 'absolute', left: 80, bottom: 70, display: 'flex', gap: 24, opacity: seg(tau, T_STUNT + 0.3, T_STUNT + 0.7)}}>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: '#FFFFFF', background: '#6A4BB4', borderRadius: 14, padding: '10px 22px'}}>stunt performer</div>
            <div style={{fontFamily: F.body, fontWeight: 800, fontSize: 34, color: '#FFFFFF', background: '#3A5FA0', borderRadius: 14, padding: '10px 22px'}}>virtual robot</div>
          </div>
        )} />
    );
  }
  // T10–T12: the policy, from a sensor to a joint
  return <PolicyShot tau={tau} f={f} />;
};

// ---------------------------------------------------------------- policy: sensor → rule → joints
const PolicyShot: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  // the F.02 walks along the virtual deck; a foot meets a raised plate early and the knee/ankle correct
  const walkStart = T_POLICY - 0.5;
  const bumpX = 40;
  const dist = Math.max(0, (tau - walkStart) * 70);
  let pose = walkPose([-300, 0, 0], Math.PI / 2, dist, G0.floorY, {stride: 56});
  const early = seg(tau, T('lands a little early') - 0.1, T('lands a little early') + 0.4);
  const fix = seg(tau, T('adjusts the knee') - 0.2, T('before the robot tips') + 0.2);
  const tip = early * (1 - fix);
  if (tau > T_FOOT) {
    // freeze the walk mid-stride on the bump, tilt, then correct
    const frozen = walkPose([-300, 0, 0], Math.PI / 2, (T_FOOT - walkStart) * 70, G0.floorY, {stride: 56});
    pose = {...frozen, roll: frozen.roll + 0.16 * tip, pitch: frozen.pitch - 0.1 * tip};
    if (pose.footR) pose.footR = {...pose.footR, pos: add(pose.footR.pos, [0, 6 * early, 0]), roll: -0.25 * early * (1 - fix)};
    pose.legR = {...pose.legR};
    pose.armL = {...pose.armL, roll: 0.14 + 0.5 * tip};
    pose.armR = {...pose.armR, roll: 0.14 + 0.3 * tip};
  }
  // reflex tap: sitting on the platform edge, the hammer taps the knee and the shin kicks
  const reflex = tau > T_REFLEX - 0.2;
  if (reflex) {
    const kick = Math.max(0, Math.sin(clamp01((tau - T_REFLEX - 0.55) / 0.4) * Math.PI));
    const p = STAND([G0.edgeX - 10, G0.platTop + 14, 0], Math.PI / 2);
    p.pos = [G0.edgeX - 14, G0.platTop + 12, 0];
    p.legL = {pitch: 1.5, roll: 0.05, knee: 1.5 - 0.9 * kick, ankle: 0.1};
    p.legR = {pitch: 1.5, roll: 0.05, knee: 1.5, ankle: 0.1};
    p.footL = undefined;
    p.footR = undefined;
    p.armL = {pitch: 0.2, roll: 0.3, twist: 0, elbow: 0.4, wrist: 0, grip: 0.4};
    p.armR = {pitch: 0.2, roll: 0.3, twist: 0, elbow: 0.4, wrist: 0, grip: 0.4};
    pose = p;
  }
  const sk = solve(pose);
  const frozenR = walkPose([-300, 0, 0], Math.PI / 2, (T_FOOT - walkStart) * 70, G0.floorY, {stride: 56}).footR!.pos;
  const bumpPos: V3 = [frozenR[0] + 4, 0, frozenR[2]];
  void bumpX;
  // camera: push into the head sensor, follow the signal down to the knee, pull out to the whole robot
  const head = add(sk.head.o, [12, 9, 0]);
  const knee = sk.side.R.knee;
  const into = easeInOut(seg(tau, T_POLICY, T_POLICY + 1.4));
  const down = easeInOut(seg(tau, T_POLICY + 3.2, T_FOOT));
  const out = easeInOut(seg(tau, T('before the robot tips') - 0.2, T_WISH + 0.4));
  const wide: Cam3 = {pos: add(sk.pelvis, [90, 120, 420]), target: add(sk.pelvis, [0, 20, 0]), fov: 44};
  const camHead: Cam3 = {pos: add(head, [38, 10, 70]), target: head, fov: 40};
  const drift = smooth(seg(tau, T_FOOT - 0.5, T('before the robot tips') + 0.3));   // slow orbit while the correction plays
  const camKnee: Cam3 = {pos: add(knee, [60 - 70 * drift, 30 + 10 * drift, 160 - 25 * drift]), target: add(knee, [0, 10, 0]), fov: 44 - 4 * drift};
  let cam = camMix(camMix(camMix(wide, camHead, into), camKnee, down), wide, out);
  if (reflex) {
    const r = smooth(seg(tau, T_REFLEX - 0.2, TRAIN_END));
    cam = {pos: add(sk.side.L.knee, [80 - 30 * r, 60 - 15 * r, 260 - 80 * r]), target: add(sk.side.L.knee, [-30, -10, 0]), fov: 42};
  }
  const pr = makeProj(cam);
  // signal path: head sensors → policy chip in the chest → hip → knee → ankle
  const chip = add(sk.torso.o, [0, 22, 0]);
  const pathPts: V3[] = [head, add(sk.neck.o, [0, 2, 0]), chip, sk.pelvis, sk.side.R.hip, sk.side.R.knee, sk.side.R.ankle];
  const P2 = pathPts.map((q) => pr.p(q));
  const rate = tau > T('many times a second') - 0.2 ? 3.2 : 1.1;
  const pulses = [0, 0.33, 0.66].map((o) => ((tau * rate + o) % 1));
  const pt = (u: number) => {
    const n = P2.length - 1;
    const x = u * n, i = Math.min(n - 1, Math.floor(x)), r = x - i;
    return {x: P2[i].x + (P2[i + 1].x - P2[i].x) * r, y: P2[i].y + (P2[i + 1].y - P2[i].y) * r};
  };
  const showLoop = tau < T_WISH + 0.3 && !reflex;
  const xr = showLoop ? seg(tau, T_POLICY + 0.6, T_POLICY + 1.2) : 0;
  const cP = pr.p(chip);
  const hl = [
    {prefix: 'kneeAct', color: C.saffron, amount: (0.25 + 0.5 * fix) * xr},
    {prefix: 'ankleAct', color: C.saffron, amount: (0.25 + 0.5 * fix) * xr},
  ];
  const ham = reflex ? seg(tau, T_REFLEX - 0.2, T_REFLEX + 0.55) : 0;
  const kneeP = pr.p(add(sk.side.L.knee, [8, -6, 0]));
  return (
    <AbsoluteFill>
      <SimShot cam={cam} robots={[{id: 'pol', pose, light: SL, highlight: hl}]} f={f}
        extra={tau > T_FOOT - 0.5 && !reflex ? box(pr, SIM_ENV, 'bump', {c: [bumpPos[0], G0.floorY + 3, bumpPos[2]], size: [46, 6, 34], color: C.saffron}) : []}
        over={(
          <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
            {xr > 0 ? (
              <g opacity={xr}>
                <path d={'M' + P2.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join('L')} fill="none" stroke={C.saffron} strokeWidth={5} strokeDasharray="10 10" strokeOpacity={0.8} />
                {pulses.map((u, k) => {
                  const q = pt(u);
                  return <circle key={k} cx={q.x} cy={q.y} r={11} fill="#FFE07A" stroke={C.ink} strokeWidth={3} />;
                })}
                <rect x={cP.x - 34} y={cP.y - 24} width={68} height={48} rx={8} fill={C.ink} stroke={C.saffron} strokeWidth={5} />
                <circle cx={P2[0].x} cy={P2[0].y} r={18 + 6 * Math.sin(tau * 9)} fill="none" stroke={C.teal} strokeWidth={5} />
                <circle cx={P2[0].x} cy={P2[0].y} r={8} fill={C.teal} />
                <g transform={`translate(${cP.x + 60} ${cP.y - 70})`}>
                  <rect x={0} y={-46} width={360} height={84} rx={14} fill={C.paper} stroke={C.ink} strokeWidth={4} />
                  <text x={22} y={10} fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.ink}>POLICY</text>
                  <text x={190} y={10} fontFamily={F.body} fontWeight={700} fontSize={26} fill={C.inkSoft}>a learned rule</text>
                </g>
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
void blendPose; void LADLE;
