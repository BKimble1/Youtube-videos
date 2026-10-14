// SECTION B5: simulation versus the real world. The same shot converts back to steel; the gap is shown as three
// physical close-ups; "messy on purpose" is shown as consequences on the arc, not as a settings dashboard.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cam3, Proj, makeProj, camMix} from '../engine/camera';
import {V3, add, clamp01, lerp3, mix, smooth, norm, rnd, mv} from '../engine/math';
import {Env, Item, box} from '../engine/prims';
import {Scene3D, RobotSpec} from '../engine/Scene3D';
import {arc3} from '../sets/SimWorld';
import {STAGE, STAGE_ENV, StageBg, stage} from '../sets/Stage';
import {ModelKind} from '../robot/model';
import {Light} from '../robot/Robot';
import {AIRBAG, AIR_ENV, airbagSet} from '../sets/Props3D';
import {DECK, LADLE} from '../sets/Foundry';
import {STAND, blendPose, ballistic, launch, speedRamp} from '../robot/motion';
import {Pose, solve} from '../robot/rig';
import {makeTrial} from '../robot/trial';
import {makeJump} from '../robot/jump';
import {T, blockStart} from '../cues';
import {TRAIN_END} from './Train';
import {FoundryScene, easeInOut, easeOut, robotLight} from './HookFoundry';
import {Chip} from '../ui/Chip';
import {C, F} from '../../theme';

export const REAL_START = TRAIN_END;
export const REAL_END = blockStart('B06') - 0.12;
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const SL = {dir: norm([-0.4, 0.85, 0.45])};

const T_SLACK = T('Real joints have slack') - 0.1;
const T_FLOOR = T('floors aren’t perfectly') - 0.1;
const T_NOISY = T('and sensors are noisy') - 0.1;
const T_NEVER = T('And Figure says this jump') - 0.1;
const T_MESSY = T('A common fix') - 0.1;
const T_WEIGHT = T('Change the weight');
const T_FOOTING = T('the footing');
const T_TIMING = T('the timing');
const T_ROUND = T('a little every round');
const T_PERFECT = T('so the policy can’t');
const T_DONTKNOW = T('We don’t know which') - 0.1;
const T_AIR = T('It also rehearsed for real') - 0.1;
const T_GIANT = T('giant airbags');
const T_MESSYF = T('And the foundry did get messy') - 0.1;
const T_KNOCK = T('knocked out cameras');
const T_KEPT = T('the policies kept running');

const standEdge = (): Pose => {
  const p = STAND([DECK.edgeX - 34, DECK.y + 95.4, 0], Math.PI / 2);
  p.head.pitch = 0.4;
  return p;
};

/** The payoff jump (shared with the next section, which slows it to a near-freeze in a spotlight). */
export const PAYOFF_TO = T_KEPT - 0.15;
export const PAYOFF_IN = T('a brutal environment') + 0.45;
export const PAYOFF = makeJump({
  tTakeoff: PAYOFF_TO, tEntry: PAYOFF_IN,
  ramp: [[PAYOFF_TO, 1], [PAYOFF_TO + 0.28, 1], [PAYOFF_TO + 0.62, 0.05], [PAYOFF_IN - 0.75, 0.05], [PAYOFF_IN - 0.25, 1], [PAYOFF_IN, 1]],
  pushDur: 0.65,
});
export const payoffState = (tau: number) => PAYOFF.at(PAYOFF.phys(tau));

// ---------------------------------------------------------------- the hand-off jump (simulation ↔ foundry)
// One jump from the tower edge toward the target. It starts in simulation; near the top of the arc the world resolves
// into the foundry around it (same placement, same time) and the jump hangs at a near-freeze for the three close-ups
// and the crane; on "messy on purpose" the foundry resolves back into the stage and the jump lands on the target.
const R_TR = makeTrial({edgeX: STAGE.edgeX, deckY: STAGE.deckY, floorY: STAGE.padY, lateral: 0, landX: -22, landing: 'stick', T: 0.95});
const R_TO = REAL_START + 0.62;
const R_SWITCH = R_TO + 0.3;                               // the foundry resolves around the robot (14 frames)
const R_BACK = T_MESSY + 0.05;                              // …and back to the stage
const R_KEYS: [number, number][] = [[R_TO, 1], [R_TO + 0.25, 1], [R_TO + 0.6, 0.012], [R_BACK + 0.35, 0.012], [R_BACK + 0.75, 1], [R_BACK + 6, 1]];
const R_RAMP = (() => {
  let tot = 0;
  for (let i = 0; i < R_KEYS.length - 1; i++) tot += ((R_KEYS[i][1] + R_KEYS[i + 1][1]) / 2) * (R_KEYS[i + 1][0] - R_KEYS[i][0]);
  return speedRamp(R_KEYS, tot);
})();
const rState = (tau: number) => R_TR.at(tau < R_TO ? tau - R_TO : R_RAMP.phys(tau));
const comOf = (p: Pose): V3 => add(p.pos, [0, 10, 0]);

/** A world resolve centred on a screen point: `inner` inside a growing circle, `outer` outside, with a scan ring. */
const Resolve: React.FC<{c: {x: number; y: number}; r: number; outer: React.ReactNode; inner: React.ReactNode; ring: string}> = ({c, r, outer, inner, ring}) => (
  <AbsoluteFill>
    {outer}
    {r > 0 ? <AbsoluteFill style={{clipPath: `circle(${r.toFixed(1)}px at ${c.x.toFixed(1)}px ${c.y.toFixed(1)}px)`}}>{inner}</AbsoluteFill> : null}
    {r > 0 && r < 2400 ? (
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <circle cx={c.x} cy={c.y} r={r} fill="none" stroke={ring} strokeWidth={10} opacity={0.9} />
      </svg>
    ) : null}
  </AbsoluteFill>
);

/** Robot drawn in its own layer, resolving from one model to another with a scan line (top → bottom). */
const RobotResolve: React.FC<{pr: Proj; pose: Pose; from: ModelKind; to: ModelKind; k: number; f: number; light?: Light}> = ({pr, pose, from, to, k, f, light}) => {
  const sk = solve(pose);
  const top = pr.p(add(sk.head.o, [0, 32, 0])).y, bot = Math.max(pr.p(sk.side.L.ankle).y, pr.p(sk.side.R.ankle).y) + 20;
  const y = mix(top, bot, k);
  const L = light ?? SL;
  const layer = (kind: ModelKind, clip: string) => (
    <AbsoluteFill style={{clipPath: clip}}><Scene3D pr={pr} bg={null} items={[]} robots={[{id: 'rr' + kind, pose, kind, light: L}]} frame={f} /></AbsoluteFill>
  );
  if (k <= 0) return layer(from, 'none');
  if (k >= 1) return layer(to, 'none');
  const x = pr.p(sk.pelvis).x;
  return (
    <AbsoluteFill>
      {layer(to, `polygon(0 0, 1920px 0, 1920px ${y}px, 0 ${y}px)`)}
      {layer(from, `polygon(0 ${y}px, 1920px ${y}px, 1920px 1080px, 0 1080px)`)}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}><rect x={x - 170} y={y - 2} width={340} height={4} fill="#BFE9FF" /></svg>
    </AbsoluteFill>
  );
};

const stageNodes = (cam: Cam3, f: number, extra: Item[] = [], robots: RobotSpec[] = []) => {
  const pr = makeProj(cam);
  return <Scene3D pr={pr} bg={<StageBg />} items={[...stage(pr, STAGE_ENV, {}), ...extra]} robots={robots} frame={f} />;
};
const foundryNodes = (cam: Cam3, tau: number, extra?: (pr: Proj, env: Env) => Item[]) => <FoundryScene cam={cam} tau={tau} robots={[]} entries={[]} extra={extra} />;

// ---------------------------------------------------------------- variations in the simulation
const varTrial = (landX: number, landing: 'stick' | 'short') => makeTrial({edgeX: STAGE.edgeX, deckY: STAGE.deckY, floorY: STAGE.padY, lateral: 0, landX, landing, T: 0.95});
const V_WEIGHT = varTrial(-125, 'short');
const V_FOOT = varTrial(-100, 'short');
const V_TIME = varTrial(-60, 'stick');
const V_GOOD = varTrial(-20, 'stick');
const ROUND_LANDS = [-40, -10, -30, -16];

const Backpack = (pr: ReturnType<typeof makeProj>, pose: Pose, k: number): Item[] => {
  if (k <= 0) return [];
  const sk = solve(pose);
  const c = add(sk.torso.o, mv(sk.torso.m, [0, 24, -18]));
  return box(pr, STAGE_ENV, 'pack', {c: [c[0], c[1] + (1 - easeOut(k)) * 60, c[2]], size: [26, 30, 16], yaw: pose.yaw, color: C.saffron});
};

export const Real: React.FC = () => {
  const f = useCurrentFrame();
  const tau = REAL_START + f / 30;

  // R1–R3: the hand-off jump. Camera orbits the body; close-ups while it hangs; then the crane.
  if (tau < T_MESSY + 0.9) {
    const st = rState(tau);
    const pose = st.pose;
    const com = comOf(pose);
    const sk = solve(pose);
    let cam: Cam3;
    let label = '';
    const orbitA = mix(0.7, 0.15, easeInOut(seg(tau, REAL_START, T_SLACK)));
    const orbitCam: Cam3 = {pos: add(com, [Math.sin(orbitA) * 520, mix(60, -40, easeInOut(seg(tau, REAL_START, T_SLACK))), Math.cos(orbitA) * 520]), target: com, fov: 44};
    if (tau < T_SLACK) cam = {...orbitCam, target: lerp3([STAGE.edgeX - 30, STAGE.deckY + 80, 0], com, smooth(seg(tau, REAL_START, R_TO + 0.2)))};
    else if (tau < T_FLOOR) {
      const knee = sk.side.R.knee;
      const d = smooth(seg(tau, T_SLACK, T_FLOOR));
      cam = {pos: add(knee, [36 - 26 * d, 8 + 6 * d, 92 - 14 * d]), target: knee, fov: 40 - 3 * d, roll: 3 - 2 * d};
      label = 'joints have slack';
    } else if (tau < T_NOISY) {
      // looking back down at the plate it pushed off: a raised weld seam under a straight edge
      const p: V3 = [STAGE.edgeX - 40, DECK.y, 20];
      const d = smooth(seg(tau, T_FLOOR, T_NOISY));
      cam = {pos: add(p, [70 - 30 * d, 70 - 18 * d, 110 - 20 * d]), target: add(p, [-6, 0, 0]), fov: 38, roll: -3 + 2 * d};
      label = 'floors aren’t flat';
    } else if (tau < T_NEVER) {
      const head = add(sk.head.o, [10, 9, 0]);
      cam = {pos: add(head, [60, 6, 34]), target: head, fov: 34};
      label = 'sensors are noisy';
    } else {
      const u = easeInOut(seg(tau, T_NEVER, T_MESSY));
      cam = {pos: lerp3([1100, 1600, 1400], [430, 860, 700], u), target: lerp3([-100, 300, -200], com, u), fov: 48};
    }
    const pr = makeProj(cam);
    // slack: the frozen shin rocks a few degrees about the knee
    if (tau >= T_SLACK && tau < T_FLOOR && pose.footR) {
      const wob = Math.sin((tau - T_SLACK) * 18) * 2.2 * (1 - seg(tau, T_FLOOR - 0.3, T_FLOOR));
      pose.footR = {...pose.footR, pos: add(pose.footR.pos, [wob, 0, 0])};
    }
    const real = tau >= R_SWITCH && tau < R_BACK + 0.5;
    const toReal = easeInOut(seg(tau, R_SWITCH, R_SWITCH + 0.47));
    const toSim = easeInOut(seg(tau, R_BACK, R_BACK + 0.47));
    const c = pr.p(com);
    const weld = (p2: Proj, env: Env) => [
      ...box(p2, env, 'weld', {c: [STAGE.edgeX - 46, DECK.y + 1.6, 20], size: [8, 3.2, 120], color: '#7E8790'}),
      ...box(p2, env, 'sedge', {c: [STAGE.edgeX - 46, DECK.y + 4.6, 20], size: [110, 3, 6], color: C.saffron}),
    ];
    const world = (() => {
      if (tau < R_SWITCH) return stageNodes(cam, f);
      if (tau < R_BACK) {
        return toReal < 1 ? <Resolve c={c} r={toReal * 2400} outer={stageNodes(cam, f)} inner={foundryNodes(cam, tau)} ring="#FFB04A" /> : foundryNodes(cam, tau, tau >= T_FLOOR && tau < T_NOISY ? weld : undefined);
      }
      return <Resolve c={c} r={toSim * 2400} outer={foundryNodes(cam, tau)} inner={stageNodes(cam, f)} ring="#BFE9FF" />;
    })();
    const kind = (k: number, a: ModelKind, b: ModelKind) => <RobotResolve pr={pr} pose={pose} from={a} to={b} k={k} f={f} light={real ? robotLight(1.4) : SL} />;
    const robot = tau < R_BACK ? kind(easeInOut(seg(tau, R_SWITCH + 0.15, R_SWITCH + 0.5)), 'SIM', 'F02') : kind(easeInOut(seg(tau, R_BACK + 0.1, R_BACK + 0.45)), 'F02', 'SIM');
    const noise = tau >= T_NOISY && tau < T_NEVER;
    const lens = pr.p(add(sk.head.o, [11, 11, 0]));
    return (
      <AbsoluteFill>
        {world}
        {robot}
        {noise ? (
          <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
            <defs><clipPath id="lensclip"><circle cx={lens.x} cy={lens.y} r={260} /></clipPath></defs>
            <g clipPath="url(#lensclip)">
              {Array.from({length: 260}, (_, k) => {
                const fr = Math.floor(tau * 30);
                const x = lens.x - 260 + rnd(k * 7 + fr * 131) * 520, y = lens.y - 260 + rnd(k * 13 + fr * 71) * 520;
                return <rect key={k} x={x} y={y} width={10} height={4} fill={rnd(k + fr) > 0.5 ? '#FFFFFF' : '#0B0E11'} opacity={0.75} />;
              })}
            </g>
            <circle cx={lens.x} cy={lens.y} r={260} fill="none" stroke={C.teal} strokeWidth={8} />
          </svg>
        ) : null}
        {label ? <div style={{position: 'absolute', left: 100, bottom: 90, fontFamily: F.display, fontWeight: 700, fontSize: 64, color: '#FFFFFF', background: 'rgba(22,42,50,0.82)', padding: '10px 30px', borderRadius: 16}}>{label}</div> : null}
        {tau >= T_NEVER && tau < T_MESSY ? <Chip x={100} y={64} lines={['FIGURE SAYS', 'a foundry the team had never visited']} appear={tau - T_NEVER - 0.4} tone="ink" size={34} /> : null}
        {tau >= T_MESSY ? <Chip x={100} y={64} lines={['MESSY ON PURPOSE · a common technique']} appear={tau - T_MESSY - 0.2} tone="blue" size={34} /> : null}
      </AbsoluteFill>
    );
  }
  // R4/R5: messy on purpose — each change has a visible consequence on the arc
  if (tau < T_AIR) {
    const dS = smooth(seg(tau, T_MESSY + 0.9, T_AIR));
    const camS: Cam3 = {pos: lerp3([250, 670, 680], [150, 620, 560], dS), target: lerp3([-100, 545, 0], [-70, 520, 0], dS), fov: 46, roll: mix(-2, 2, dS)};
    const pr = makeProj(camS);
    let pose: Pose;
    let phase = 'push';
    const extra: Item[] = [];
    let caption = '';
    const run = (tr: ReturnType<typeof varTrial>, t: number) => { const s = tr.at(t); phase = s.phase; return s.pose; };
    if (tau < T_WEIGHT - 0.1) {
      pose = run(V_GOOD, -1);
    } else if (tau < T_WEIGHT + 1.0) {
      const t0 = T_WEIGHT - 0.1;
      pose = run(V_WEIGHT, (tau - t0) * 2 - 0.25);
      extra.push(...Backpack(pr, pose, seg(tau, T_WEIGHT - 0.1, T_WEIGHT + 0.15)));
      extra.push(arc3(pr, 'aw', V_WEIGHT.arc(), C.saffron, {upto: clamp01(((tau - t0) * 2 - 0.25) / 0.95)}));
      caption = 'heavier';
    } else if (tau < T_WEIGHT + 2.0) {
      const t0 = T_WEIGHT + 1.0;
      pose = run(V_FOOT, (tau - t0) * 2 - 0.25);
      extra.push(...box(pr, STAGE_ENV, 'ice', {c: [STAGE.edgeX - 60, STAGE.deckY + 1, 0], size: [120, 2, 200], color: '#BFE8F7'}));
      extra.push(arc3(pr, 'aw1', V_WEIGHT.arc(), '#9DBBEA', {opacity: 0.5, width: 4}));
      extra.push(arc3(pr, 'af', V_FOOT.arc(), '#4F9FD9', {upto: clamp01(((tau - t0) * 2 - 0.25) / 0.95)}));
      caption = 'slippery';
    } else if (tau < T_ROUND - 0.05) {
      const t0 = T_WEIGHT + 2.0;
      pose = run(V_TIME, (tau - t0) * 2 - 0.55);
      extra.push(arc3(pr, 'aw2', V_WEIGHT.arc(), '#9DBBEA', {opacity: 0.5, width: 4}), arc3(pr, 'af2', V_FOOT.arc(), '#9DBBEA', {opacity: 0.5, width: 4}));
      extra.push(arc3(pr, 'at', V_TIME.arc(), C.coral, {upto: clamp01(((tau - t0) * 2 - 0.55) / 0.95)}));
      caption = 'a beat late';
    } else {
      // rounds: quick variations stack up as a fan of arcs that all reach the target
      const r = Math.min(3, Math.floor((tau - T_ROUND) / 0.55));
      const rt = (tau - T_ROUND) - r * 0.55;
      const tr = varTrial(ROUND_LANDS[r], 'stick');
      pose = tau < T_PERFECT ? run(tr, rt * 1.8 - 0.2) : run(V_GOOD, tau - T_PERFECT - 0.1);
      for (let k = 0; k <= r; k++) extra.push(arc3(pr, 'ar' + k, varTrial(ROUND_LANDS[k], 'stick').arc(), '#9DBBEA', {opacity: 0.55, width: 4}));
      if (tau >= T_PERFECT) extra.push(arc3(pr, 'ag', V_GOOD.arc(), C.teal, {upto: clamp01((tau - T_PERFECT - 0.1) / 0.95), width: 6}));
      extra.push(arc3(pr, 'aw0', V_WEIGHT.arc(), '#9DBBEA', {opacity: 0.4, width: 3}), arc3(pr, 'af0', V_FOOT.arc(), '#9DBBEA', {opacity: 0.4, width: 3}), arc3(pr, 'at0', V_TIME.arc(), '#9DBBEA', {opacity: 0.4, width: 3}));
    }
    const robots: RobotSpec[] = [{id: 'var', pose, kind: 'SIM', light: SL, ground: phase === 'push' ? STAGE.deckY : STAGE.padY}];
    return (
      <AbsoluteFill>
        <Scene3D pr={pr} bg={<StageBg />} items={[...stage(pr, STAGE_ENV, {}), ...extra]} robots={robots} frame={f} />
        <Chip x={100} y={64} lines={['MESSY ON PURPOSE · a common technique']} appear={tau - T_MESSY - 0.2} tone="blue" size={34} />
        {caption ? <div style={{position: 'absolute', left: 1240, top: 220, fontFamily: F.display, fontWeight: 700, fontSize: 64, color: C.ink}}>{caption}</div> : null}
      </AbsoluteFill>
    );
  }
  // R6: the airbag rehearsal — second floor onto a giant airbag
  if (tau < T_MESSYF) {
    const tTO = T_GIANT - 0.95;
    const tr = makeTrial({edgeX: AIRBAG.ledgeX, deckY: AIRBAG.floor2, floorY: AIRBAG.bagSize[1] * 0.95, lateral: 0, landX: 110, landing: 'stick', T: 0.85});
    const s = tr.at(tau - tTO);
    const hit = tau > tTO + 0.85 ? tau - tTO - 0.85 : -1;
    const squash = hit >= 0 ? Math.exp(-hit * 3.2) * Math.abs(Math.cos(hit * 9)) * 0.9 + (hit < 0.12 ? hit / 0.12 * 0.1 : 0) : 0;
    const pose = {...s.pose};
    if (hit >= 0) {
      // the robot sinks into the compressing bag, knees absorbing
      const sink = AIRBAG.bagSize[1] * 0.42 * squash;
      pose.pos = add(pose.pos, [0, -sink - 6, 0]);
      if (pose.footL) pose.footL = {...pose.footL, pos: add(pose.footL.pos, [0, -sink, 0])};
      if (pose.footR) pose.footR = {...pose.footR, pos: add(pose.footR.pos, [0, -sink, 0])};
    }
    const u = easeInOut(seg(tau, T_AIR, T_MESSYF));
    const cam: Cam3 = {pos: lerp3([520, 520, 700], [520, 330, 760], u), target: lerp3([-150, 440, 0], [40, 230, 0], u), fov: 42};
    const pr = makeProj(cam);
    return <Scene3D pr={pr} bg={<rect width={1920} height={1080} fill="#CFE3F7" />} items={airbagSet(pr, AIR_ENV, squash)} robots={[{id: 'ab', pose, light: SL, ground: hit >= 0 ? AIRBAG.bagSize[1] * (1 - 0.42 * squash) : AIRBAG.floor2}]} frame={f} />;
  }
  // R7: the foundry got messy — camera travels down through the structure; EM noise kills monitors; the jump goes anyway
  const st = payoffState(tau);
  // three framings: crane down from high; the junction box arcing behind the waiting robot; low for the launch
  const camHigh: Cam3 = {pos: [500, 1650, 950], target: [-150, 620, 0], fov: 46, roll: -4};
  const camMid: Cam3 = {pos: [300, 1150, 820], target: [-170, 630, 0], fov: 46, roll: -2};
  const camBox: Cam3 = {pos: [-40, 780, 360], target: [-400, 740, -70], fov: 42, roll: 2};
  const camLow: Cam3 = {pos: [90, 830, 640], target: [-150, 640, 0], fov: 46};
  const tB = T_KNOCK - 0.3, tC = T_KEPT - 0.75;
  const cam = tau < tB ? camMix(camHigh, camMid, easeInOut(seg(tau, T_MESSYF, tB)))
    : tau < tC ? camMix(camBox, {...camBox, pos: [-10, 770, 330]}, seg(tau, tB, tC))
    : camMix({...camLow, pos: [140, 860, 700]}, camLow, easeOut(seg(tau, tC, tC + 1.2)));
  const em = seg(tau, T_KNOCK - 0.2, T_KNOCK + 0.2);
  const pr = makeProj(cam);
  const box1 = pr.p([-520, DECK.y + 160, -134]);
  return (
    <AbsoluteFill>
      <FoundryScene cam={cam} tau={tau} robots={[{pose: st.pose, id: 'pay', inside: st.phase === 'plunge', clipY: st.clipY}]} entries={[]}
        extra={(p2, env) => box(p2, env, 'jbox', {c: [-520, DECK.y + 160, -138], size: [50, 60, 20], color: '#5E6670'})} />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {/* a junction box arcs and sparks when the field spikes */}
        {em > 0 ? Array.from({length: 14}, (_, k) => {
          const a = rnd(k + Math.floor(tau * 20) * 31) * Math.PI * 2;
          const l = 30 + rnd(k * 3 + Math.floor(tau * 20)) * 60;
          return <line key={k} x1={box1.x} y1={box1.y} x2={box1.x + Math.cos(a) * l} y2={box1.y + Math.sin(a) * l} stroke="#FFF2A8" strokeWidth={4} opacity={em * (0.5 + 0.5 * Math.sin(tau * 60 + k))} />;
        }) : null}
        {/* the crew's camera monitor drops to static */}
        <g transform="translate(90 90)">
          <rect x={-14} y={-14} width={548} height={336} rx={14} fill="#1E2026" stroke="#0B0C0F" strokeWidth={6} />
          <rect x={0} y={0} width={520} height={308} fill="#0B0C0F" />
          {em > 0 ? Array.from({length: 180}, (_, k) => {
            const fr = Math.floor(tau * 30);
            return <rect key={k} x={rnd(k * 7 + fr * 13) * 510} y={rnd(k * 11 + fr * 17) * 300} width={14} height={5} fill={rnd(k + fr * 3) > 0.5 ? '#E6E6E6' : '#333'} opacity={em} />;
          }) : <text x={260} y={165} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={34} fill="#5BD6A3">CAM 2 · LIVE</text>}
          {em > 0 ? <text x={260} y={165} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={40} fill="#FF6B5B" opacity={em}>NO SIGNAL</text> : null}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
void ballistic; void launch; void blendPose; void mix; void LADLE;
