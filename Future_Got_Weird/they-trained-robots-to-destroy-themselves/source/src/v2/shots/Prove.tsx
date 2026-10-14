// SECTION B6: what the jump proves. The payoff jump hangs in a spotlight, finishes in the steel, then the camera
// pulls back to show the one arc, the one target and the people around it; a factory aisle supplies the one comparison.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cam3, makeProj, camMix, Proj} from '../engine/camera';
import {V3, add, clamp01, lerp3, mix, smooth, norm} from '../engine/math';
import {Item, Env, box, circle3, line3} from '../engine/prims';
import {polyClosed} from '../engine/draw';
import {Scene3D} from '../engine/Scene3D';
import {arc3} from '../sets/SimWorld';
import {LINE_ENV, lineSet} from '../sets/Props3D';
import {LADLE} from '../sets/Foundry';
import {STAND, ballistic} from '../robot/motion';
import {Pose} from '../robot/rig';
import {T, blockStart} from '../cues';
import {REAL_END, PAYOFF, PAYOFF_IN, payoffState} from './Real';
import {ControlWindow, FoundryScene, easeInOut, easeOut} from './HookFoundry';
import {Character, IDLE} from '../../components/Character';
import {CAST} from '../../components/cast';
import {C} from '../../theme';

export const PROVE_START = REAL_END;
export const PROVE_END = blockStart('B07') - 0.12;
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

const T_SURVIVE = T('survive') - 0.12;
const T_BUT = T('But it was one') - 0.1;
const T_ONEMOVE = T('one movement');
const T_ONETARGET = T('one kind of target');
const T_SETTING = T('in a setting people') - 0.1;
const T_PREPARED = T('prepared and supervised');
const T_NOTA = T('That’s not a robot') - 0.1;
const T_WALKINTO = T('walk into any factory');
const T_WORKOUT = T('work things out');

/** The pelvis path of the payoff jump (takeoff → entry). */
const PAY_ARC: V3[] = Array.from({length: 37}, (_, i) => ballistic(PAYOFF.p0, PAYOFF.v0, (PAYOFF.T * i) / 36));

/** A soft spotlight: everything outside a radius around (x, y) sinks into shadow. */
const Spot: React.FC<{x: number; y: number; r: number; amount: number}> = ({x, y, r, amount}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
    <defs>
      <radialGradient id="spot" cx={x} cy={y} r={r * 2.4} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#07060A" stopOpacity={0} />
        <stop offset="0.38" stopColor="#07060A" stopOpacity={0} />
        <stop offset="1" stopColor="#07060A" stopOpacity={0.9} />
      </radialGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#spot)" opacity={amount} />
  </svg>
);

/** A flat ring lying on the steel (the "one kind of target"). */
export const surfaceRing = (pr: Proj, c: V3, r: number, color: string, width: number, opacity: number, key: string): Item => {
  const pts = circle3(c, r, 56).slice(0, 56).map((q) => pr.p(q));
  return {z: pr.p(c).z - 400, key, el: <path key={key} d={polyClosed(pts)} fill="none" stroke={color} strokeWidth={width} strokeOpacity={opacity} />};
};

/** Floor barriers around the ladle: the prepared perimeter. */
export const barriers = (pr: Proj, env: Env, k: number): Item[] => {
  const items: Item[] = [];
  if (k <= 0) return items;
  const pts: [number, number, number][] = [[430, 280, 0.6], [520, 40, 1.45], [470, -220, 2.1], [260, 430, 0.15]];
  pts.forEach(([x, z, yaw], i) => {
    const rise = easeOut(clamp01(k * 3 - i * 0.4));
    items.push(...box(pr, env, 'bar' + i, {c: [x, 45 * rise, z], size: [180, 90 * rise + 1, 14], yaw, color: C.saffron, top: '#2B2B33'}));
  });
  return items;
};

/** Cast members inside the control room (screen space, darkened by the backlight). */
const Crew: React.FC<{f: number; k: number}> = ({f, k}) => {
  if (k <= 0) return null;
  const e = easeOut(k);
  return (
    <AbsoluteFill style={{filter: 'brightness(0.62) saturate(0.85)'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <g transform={`translate(${330 - 60 * (1 - e) - 200 * 1.15} ${1250 - 500 * 1.15}) scale(1.15)`}>
          <Character look={CAST.clerkA} pose={{...IDLE, armL: {a: 30, b: 95}, armR: {a: 12, b: 20}, lookX: 0.8, lookY: -0.4, mouth: 'flat'}} frame={f} seed={4} />
        </g>
        <g transform={`translate(${1610 + 60 * (1 - e) - 200 * 1.2} ${1270 - 500 * 1.2}) scale(1.2)`}>
          <Character look={CAST.clerkC} pose={{...IDLE, armL: {a: 20, b: 40}, armR: {a: 45, b: 110}, lookX: -0.8, lookY: -0.4, mouth: 'flat'}} frame={f} seed={6} flip />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- factory comparison
const FAC_ROBOT: V3 = [0, 95.4, 260];
const TASKS: {to: V3; from: V3; lift: number}[] = [
  {from: [-24, 112, 268], to: [-250, 150, -120], lift: 50},   // reach into the car body on the line
  {from: [-24, 112, 268], to: [-560, 172, 410], lift: 70},    // a bin on a high shelf
  {from: [24, 112, 268], to: [330, 66, 470], lift: 40},       // a crate on the floor
  {from: [24, 112, 268], to: [460, 92, 70], lift: 60},        // a cart handle
  {from: [0, 2, 260], to: [-1000, 2, 260], lift: 0},          // down the aisle
];
const taskPath = (a: V3, b: V3, lift: number): V3[] =>
  Array.from({length: 25}, (_, i) => {
    const u = i / 24;
    return [mix(a[0], b[0], u), mix(a[1], b[1], u) + Math.sin(u * Math.PI) * lift, mix(a[2], b[2], u)] as V3;
  });
const factoryProps = (pr: Proj, env: Env): Item[] => {
  const items: Item[] = [];
  // shelf with bins
  items.push(...box(pr, env, 'shelf', {c: [-560, 100, 410], size: [190, 200, 70], color: '#8E9AA6', top: '#A8B3BE'}));
  for (const [y, col] of [[60, C.blue], [120, C.saffron], [172, C.teal]] as [number, string][]) items.push(...box(pr, env, 'bin' + y, {c: [-560, y, 448], size: [150, 34, 10], color: col}));
  items.push(...box(pr, env, 'crate', {c: [330, 32, 470], size: [96, 64, 96], color: '#B98A55', top: '#CFA36C'}));
  items.push(...box(pr, env, 'cart', {c: [460, 45, 70], size: [150, 60, 90], color: '#5E6C7A', top: '#7C8B99'}));
  items.push(...box(pr, env, 'cartH', {c: [540, 92, 70], size: [8, 40, 80], color: '#2B2B33'}));
  return items;
};
const factoryRobot = (tau: number): Pose => {
  const p = STAND(FAC_ROBOT, 0);
  // the head checks one task after another, never settling
  const targets = [-0.7, 0.5, -0.35, 0.75, -0.9];
  const i = Math.max(0, Math.min(targets.length - 1, Math.floor((tau - T_WALKINTO) / 0.42)));
  const prev = targets[Math.max(0, i - 1)];
  const w = smooth(((tau - T_WALKINTO) % 0.42) / 0.18);
  p.head.yaw = tau < T_WALKINTO ? 0 : mix(prev, targets[i], w);
  p.head.pitch = tau < T_WALKINTO ? 0.05 : 0.15;
  p.armL = {...p.armL, pitch: 0.1, roll: 0.12, elbow: 0.35};
  p.armR = {...p.armR, pitch: 0.1, roll: 0.12, elbow: 0.35};
  return p;
};

export const Prove: React.FC = () => {
  const f = useCurrentFrame();
  const tau = PROVE_START + f / 30;
  const st = payoffState(tau);
  const eIn = {at: PAYOFF.p1, t: tau - PAYOFF_IN, seed: 31};
  const gone = st.phase === 'plunge' && st.t - st.tIn > 1.4;
  const robot = gone ? [] : [{pose: st.pose, id: 'pay', inside: st.phase === 'plunge', clipY: st.clipY}];

  // P1: the jump hangs in a spotlight while the camera circles it
  if (tau < T_SURVIVE) {
    const u = seg(tau, PROVE_START, T_SURVIVE);
    const tgt = add(st.pose.pos, [0, 20, 0]);
    const a = mix(18, 78, easeInOut(u));
    const cam: Cam3 = {pos: add(tgt, [Math.sin((a * Math.PI) / 180) * mix(360, 300, u), 70, Math.cos((a * Math.PI) / 180) * mix(360, 300, u)]), target: tgt, fov: 42, roll: mix(-6, 3, u)};
    const pr = makeProj(cam);
    const q = pr.p(tgt);
    return (
      <AbsoluteFill>
        <FoundryScene cam={cam} tau={tau} robots={robot} entries={[]} />
        <Spot x={q.x} y={q.y} r={260} amount={easeOut(seg(tau, PROVE_START, PROVE_START + 0.5))} />
      </AbsoluteFill>
    );
  }
  // P2: real time returns; the entry, hard
  if (tau < T_BUT) {
    const u = seg(tau, T_SURVIVE, T_BUT);
    const follow = lerp3(add(st.pose.pos, [0, -20, 0]), [-30, 420, 0], easeInOut(seg(tau, PAYOFF_IN - 0.3, PAYOFF_IN + 0.4)));
    const cam: Cam3 = {pos: lerp3([260, 640, 520], [240, 520, 470], easeOut(u)), target: follow, fov: 48, roll: -2};
    const shake = eIn.t >= 0 ? Math.exp(-eIn.t * 5) : 0;
    return <FoundryScene cam={cam} tau={tau} robots={robot} entries={[eIn]} shake={shake} />;
  }
  // P3/P4: pull back — one arc, one target, then the people who set it up (through the control-room glass)
  if (tau < T_NOTA) {
    const u = easeInOut(seg(tau, T_BUT, T_SETTING + 0.6));
    const w = easeInOut(seg(tau, T_SETTING, T_SETTING + 1.1));
    const camA: Cam3 = {pos: lerp3([620, 1050, 820], [760, 1220, 980], u), target: [-110, 440, 0], fov: 44};
    const camB: Cam3 = {pos: [900, 1000, -560], target: [-110, 460, 20], fov: 40};
    const cam = camMix(camA, camB, w);
    const arcK = easeInOut(seg(tau, T_ONEMOVE - 0.1, T_ONEMOVE + 0.55));
    const ringK = easeOut(seg(tau, T_ONETARGET, T_ONETARGET + 0.35));
    const pulse = Math.max(0, Math.sin((tau - T_ONETARGET) * 7)) * (tau > T_ONETARGET ? Math.exp(-(tau - T_ONETARGET) * 1.5) : 0);
    const extra = (pr: Proj, env: Env): Item[] => {
      const out: Item[] = [];
      if (arcK > 0) out.push(arc3(pr, 'payArc', PAY_ARC, C.teal, {upto: arcK, width: 7, dash: '18 12'}));
      if (ringK > 0) {
        const c: V3 = [PAYOFF.p1[0], LADLE.steel + 1, PAYOFF.p1[2]];
        out.push(surfaceRing(pr, c, 46 * (1 + 0.25 * pulse), C.teal, 7, ringK, 'tring'));
        out.push(surfaceRing(pr, c, 26, C.teal, 5, ringK * 0.8, 'tring2'));
      }
      out.push(...barriers(pr, env, seg(tau, T_PREPARED - 0.4, T_PREPARED + 0.6)));
      return out;
    };
    // the window frame slides in from beyond the edges as the camera retreats through the glass
    const win = easeOut(seg(tau, T_SETTING + 0.2, T_SETTING + 1.2));
    return (
      <AbsoluteFill>
        <FoundryScene cam={cam} tau={tau} robots={robot} entries={[eIn]} extra={extra} flameScale={0.6} />
        {win > 0 ? (
          <AbsoluteFill style={{transform: `scale(${mix(1.9, 1, win)})`, transformOrigin: '960px 520px', opacity: Math.min(1, win * 2)}}>
            <svg width={1920} height={1080} viewBox="0 0 1920 1080"><ControlWindow /></svg>
          </AbsoluteFill>
        ) : null}
        <Crew f={f} k={seg(tau, T_PREPARED - 0.2, T_PREPARED + 0.5)} />
      </AbsoluteFill>
    );
  }
  // P5: one trained arc next to a factory aisle full of different jobs
  const u = seg(tau, T_NOTA, PROVE_END);
  const tgt: V3 = [0, 120, 260];
  const a = mix(-34, 18, easeInOut(u));
  const d = mix(470, 360, easeInOut(u));
  const cam: Cam3 = {pos: add(tgt, [Math.sin((a * Math.PI) / 180) * d, 70, Math.cos((a * Math.PI) / 180) * d]), target: tgt, fov: 54, roll: mix(3, -2, u)};
  const pr = makeProj(cam);
  const items: Item[] = [...lineSet(pr, LINE_ENV, tau - T_NOTA), ...factoryProps(pr, LINE_ENV)];
  // the trained jump, shrunk to a small teal arc beside the robot
  const mini = PAY_ARC.map((q) => [(q[0] - PAYOFF.p0[0]) * 0.5 - 200, (q[1] - PAYOFF.p1[1]) * 0.5 + 115, 290] as V3);
  const miniK = easeOut(seg(tau, T_NOTA + 0.1, T_NOTA + 0.6));
  if (miniK > 0) {
    items.push(arc3(pr, 'mini', mini, C.teal, {upto: miniK, width: 9, dash: '16 10'}));
    const end = mini[mini.length - 1];
    items.push(surfaceRing(pr, [end[0], end[1] - 8, end[2]], 14, C.teal, 6, miniK, 'miniRing'));
  }
  TASKS.forEach((tk, i) => {
    const k = easeOut(seg(tau, T_WALKINTO + i * 0.2, T_WALKINTO + i * 0.2 + 0.45));
    if (k <= 0) return;
    items.push(arc3(pr, 'task' + i, taskPath(tk.from, tk.to, tk.lift), C.coral, {upto: k, width: 8, dash: '14 10', opacity: 0.95}));
    if (k > 0.95) {
      const qq = pr.p(tk.to);
      const pulse = 1 + 0.2 * Math.sin((tau - T_WORKOUT) * 8 + i);
      items.push({z: qq.z - 60, key: 'tm' + i, el: <g key={'tm' + i}><circle cx={qq.x} cy={qq.y} r={Math.max(10, 16 * qq.s) * pulse} fill="none" stroke={C.coral} strokeWidth={6} /><circle cx={qq.x} cy={qq.y} r={Math.max(4, 5 * qq.s)} fill={C.coral} /></g>});
    }
  });
  return (
    <AbsoluteFill>
      <Scene3D pr={pr} bg={<rect width={1920} height={1080} fill="#EEE7D3" />} items={items}
        robots={[{id: 'fac', pose: factoryRobot(tau), light: {dir: norm([-0.35, 0.85, 0.4])}}]} frame={f} />
    </AbsoluteFill>
  );
};
void line3; void smooth;
