// SHOTS H1–H7: the opening, 0:00 → "So why would a company do this?".
// One continuous jump timeline (robot #1), then a second robot on the production monitor and from a control-room window.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cam3, Proj, makeProj, camMix} from '../engine/camera';
import {V3, add, clamp01, lerp3, mix, smooth, rnd, noise1, norm, mv, mm, rotX, rotY} from '../engine/math';
import {Item, Env, sortItems} from '../engine/prims';
import {hull, smoothClosed, clipRings} from '../engine/draw';
import {renderRobotItems, Light} from '../robot/Robot';
import {CharSpec, charItem} from '../engine/Scene3D';
import {CHEST, surfLocal} from '../robot/model';
import {Pose, solve} from '../robot/rig';
import {DECK, FOUNDRY_ENV, GLOW_POS, HeatGlow, Haze, LADLE, LampCones, LightShafts, foundryBack, ladle, moltenSurface, sparksAmbient, walkway} from '../sets/Foundry';
import {Flash, flames, smoke, splash} from '../fx/Splash';
import {makeJump, walkToEdge, walkDuration} from '../robot/jump';
import {blendPose, speedRamp} from '../robot/motion';
import {T, TE} from '../cues';
import {Chip} from '../ui/Chip';
import {Character, IDLE} from '../../components/Character';
import {CAST} from '../../components/cast';
import {F} from '../../theme';

export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeInOut = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// ---------------------------------------------------------------- timing (from the narration)
const T_STEEL = T('steel');                   // "…into molten STEEL"
const T_IN = T_STEEL + 0.06;                  // toes reach the surface
const T_TO = 0.42;                            // takeoff (the film opens mid-push-off, already loaded)
const T_H2 = 0.8, T_H3 = 2.0, T_H4 = T_IN - 0.03;
const T_H5 = T_IN + 1.05;                    // macro: the battery housing and shoulder caps slide under
const T_H5B = T_IN + 2.4;                    // aftermath: churned surface, tilt up to the empty edge
const T_H6 = T('Figure the robot maker') - 0.12;
const T_H7 = T('and a spokesperson') - 0.1;
export const HOOK_FOUNDRY_END = T('So why would') + 0.2;

export const JUMP1 = makeJump({
  style: 'hero', tTakeoff: T_TO, tEntry: T_IN,
  ramp: [[T_TO, 1], [T_TO + 0.3, 0.34], [T_IN - 0.62, 0.3], [T_IN - 0.14, 1], [T_IN, 1]],
  pushDur: 0.5, drag: 14, sinkRate: 40,
});
// robot #2: walks out during H6, jumps so its toes reach the steel on "in"
const R2_WALK0 = T_H6 - 0.4;
const R2_STOP = R2_WALK0 + walkDuration(6);
const R2_IN = TE('go in') - 0.55;
const JUMP2 = makeJump({tTakeoff: R2_IN - 1.06, tEntry: R2_IN, lateral: 0, pushDur: 0.7});

export const robotLight = (strength = 1.8): Light => ({dir: norm([0.25, 0.85, -0.45]), glow: {pos: GLOW_POS, color: '#FF8A2A', strength, falloff: 330}, rim: '#B6C7D6'});

// after entry: real time, then a 0.45× slow section for the close-up, then real time again
const POST = (() => {
  // real time through the splash, half speed for the macro (the housing slides under), then real time again
  const keys: [number, number][] = [[T_IN, 1], [T_IN + 0.5, 1], [T_IN + 0.9, 0.5], [T_IN + 2.3, 0.5], [T_IN + 2.6, 1], [T_IN + 30, 1]];
  let tot = 0;
  for (let i = 0; i < keys.length - 1; i++) tot += ((keys[i][1] + keys[i + 1][1]) / 2) * (keys[i + 1][0] - keys[i][0]);
  return speedRamp(keys, tot);
})();
/** Seconds of physical time since entry at screen time tau (negative before entry). */
export const postEntry = (tau: number) => (tau < T_IN ? -1 : POST.phys(tau));
/** Robot #1 state at screen time tau. */
export const robot1 = (tau: number) => (tau < T_IN ? JUMP1.at(JUMP1.phys(tau)) : JUMP1.at(JUMP1.T + POST.phys(tau)));
const robot2 = (tau: number) => {
  if (tau < R2_STOP) return {pose: walkToEdge(tau - R2_WALK0), clipY: undefined as number | undefined, phase: 'walk'};
  const t = tau - (R2_IN - 1.06); // seconds since takeoff
  const s = JUMP2.at(t);
  if (s.phase === 'push' && t < -0.7) {
    const settle = smooth((tau - R2_STOP) / 0.7);
    return {pose: blendPose(walkToEdge(walkDuration(6)), JUMP2.K.look, settle), clipY: undefined, phase: 'stand'};
  }
  return {pose: s.pose, clipY: s.clipY, phase: s.phase};
};

// ---------------------------------------------------------------- scene assembly
export type SceneRobot = {pose: Pose; clipY?: number; id: string; inside: boolean; trail?: Pose[]; highlight?: {prefix: string; color: string; amount: number}[]};
type SceneOpts = {
  cam: Cam3;
  tau: number;
  robots: SceneRobot[];
  entries: {at: V3; t: number; seed: number}[];
  extra?: (pr: Proj, env: Env) => Item[];
  shake?: number;
  flameScale?: number;
  chars?: CharSpec[];
  frame?: number;
};

export const insideLadle = (p: V3) => Math.hypot(p[0] - LADLE.c[0], p[2] - LADLE.c[2]) < LADLE.rIn;

/** Builds the foundry frame as SVG children (also used inside the production monitor). */
export const foundryFrame = (o: SceneOpts, idp = ''): {pr: Proj; nodes: React.ReactNode; defs: React.ReactNode[]} => {
  const {cam, tau, robots, entries, extra, shake = 0} = o;
  const sh: [number, number] = shake > 0 ? [noise1(tau * 40, 1) * 14 * shake, noise1(tau * 40, 7) * 10 * shake] : [0, 0];
  const pr = makeProj({...cam, shake: sh});
  const env = FOUNDRY_ENV;
  const items: Item[] = [];
  items.push(...foundryBack(pr, env, tau));
  items.push(...walkway(pr, env));
  const L = ladle(pr, env);
  items.push(...L.back, ...L.front);
  const latest = entries.filter((e) => e.t >= 0).sort((a, b) => a.t - b.t)[0];
  const scar = entries.reduce((m, e) => Math.max(m, clamp01((e.t - 0.6) / 1.2)), 0);
  items.push(moltenSurface(pr, env, tau, latest ? {at: latest.at, t: latest.t} : undefined, scar));
  const zc = pr.p([0, LADLE.steel, 0]).z;
  const defs: React.ReactNode[] = [];
  for (const r of robots) {
    const draw = (pose: Pose, id: string, opacity: number) => {
      const {items: ri, defs: rd, sk, bound} = renderRobotItems({pr, pose, id: idp + id, clipY: r.inside ? r.clipY : undefined, light: robotLight(), heat: {level: LADLE.steel, range: 70}, highlight: opacity === 1 ? r.highlight : undefined});
      defs.push(...rd);
      const z0 = pr.p(sk.pelvis).z;
      const z = r.inside ? Math.max(zc - LADLE.rTop * 0.8, Math.min(zc + LADLE.rTop * 0.8, z0)) : z0;
      ri.sort((a, b) => b.z - a.z);
      const solid = opacity >= 1 && !r.inside && bound.pts.length > 0;
      items.push({z: z + (opacity < 1 ? 1 : 0), key: 'robot-' + idp + id, geo: solid ? {kind: 'body', pts: bound.pts} : undefined, bb: solid ? bound.bb : undefined,
        el: <g key={'robot-' + idp + id} opacity={opacity}>{ri.map((x) => x.el)}</g>});
    };
    (r.trail ?? []).forEach((tp, k) => draw(tp, `${r.id}-tr${k}`, 0.22 / (k + 1)));
    draw(r.pose, r.id, 1);
  }
  for (const e of entries) {
    items.push(...splash(pr, [e.at[0], LADLE.steel, e.at[2]], e.t, LADLE.steel, {seed: e.seed, inside: insideLadle}));
    items.push(...flames(pr, [e.at[0], LADLE.steel, e.at[2]], e.t - 0.25, {seed: e.seed + 3, height: 45 * (o.flameScale ?? 1), width: 30 * (o.flameScale ?? 1), strength: clamp01((e.t - 0.25) * 2) * (1 - clamp01((e.t - 3.5) / 2))}));
    items.push(...smoke(pr, [e.at[0], LADLE.steel + 10, e.at[2]], e.t - 0.15, {seed: e.seed + 7, n: 16, dark: 0.75, opacity: 0.5}));
  }
  items.push(...smoke(pr, [40, LADLE.steel + 20, -30], tau + 3, {seed: 77, n: 8, dark: 0.35, opacity: 0.18, size: 60, rise: 70, spread: 90}));
  items.push(...sparksAmbient(pr, tau, 18, 5));
  if (extra) items.push(...extra(pr, env));
  for (const c of o.chars ?? []) items.push(charItem(pr, c, o.frame ?? Math.round(tau * 30)));
  sortItems(items, pr);
  const flash = latest && latest.t < 0.3 ? <Flash t={latest.t} x={pr.p(latest.at).x} y={pr.p(latest.at).y} /> : null;
  return {
    pr, defs,
    nodes: (
      <>
        <rect width={1920} height={1080} fill="#18141C" />
        <LightShafts pr={pr} />
        {items.map((it) => it.el)}
        <LampCones pr={pr} t={tau} />
        <HeatGlow pr={pr} intensity={1} id={idp + 'hg'} />
        <Haze id={idp + 'hz'} />
        {flash}
      </>
    ),
  };
};

export const FoundryScene: React.FC<SceneOpts> = (o) => {
  const {nodes, defs} = foundryFrame(o);
  return (
    <AbsoluteFill style={{background: '#18141C'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>{defs}</defs>
        {nodes}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- cameras
const comAt = (tau: number): V3 => add(robot1(tau).pose.pos, [0, 10, 0]);

const camH1 = (tau: number): Cam3 => {
  // behind the robot's shoulder at deck height: the push-off and the glowing ladle are both in frame from frame 0
  const u = easeInOut(tau / 0.8);
  const com = comAt(tau);
  const a: Cam3 = {pos: [-500, DECK.y + 118, 236], target: [-120, 590, -40], fov: 50, roll: -6};
  const b: Cam3 = {pos: [-380, DECK.y + 132, 262], target: [-70, 560, -20], fov: 48, roll: -3};
  const c = camMix(a, b, u);
  c.target = lerp3(c.target, com, 0.25 * smooth(clamp01((tau - 0.42) / 0.38)));
  return c;
};
const camH2 = (tau: number): Cam3 => {
  // three-quarter front across the ladle: the robot comes toward camera at the top of its arc, the rim below
  const u = (tau - T_H2) / (T_H3 - T_H2);
  const com = comAt(tau);
  const tgt = lerp3(com, [0, LADLE.rim, 0], 0.32);
  return {pos: lerp3([230, 800, 430], [190, 750, 370], smooth(u)), target: tgt, fov: mix(50, 45, u), roll: mix(-5, -1, u)};
};
const camH3 = (tau: number): Cam3 => {
  // tracking descent: the camera drops with the body (one speed ramp in the motion, none in the camera)
  const u = (tau - T_H3) / (T_H4 - T_H3);
  const com = comAt(tau);
  const chest: V3 = add(com, [0, 28, 0]);
  return {pos: lerp3([410, 640, 470], [300, 470, 360], easeInOut(u)), target: lerp3(chest, [0, LADLE.steel + 60, 0], 0.2), fov: mix(38, 33, u), roll: mix(3, 0, u)};
};
const camH4 = (tau: number): Cam3 => {
  // rim level outside the vessel: the near lip occludes the lower body; the splash rises toward and past the lens side
  const u = (tau - T_H4) / (T_H5 - T_H4);
  return {pos: lerp3([330, 430, 430], [365, 446, 462], easeOut(u)), target: lerp3([-16, 404, 0], [-16, 388, 0], u), fov: 41};
};
const camH5 = (tau: number): Cam3 => {
  // macro inside the vessel, just above the steel, behind the robot: the vented battery housing and the shoulder caps
  // slide under while ripples run outward. The head stays above frame.
  const u = (tau - T_H5) / (T_H5B - T_H5);
  const st = robot1(tau);
  const sk = solve(st.pose);
  const pack = add(sk.torso.o, mv(sk.torso.m, [0, 24, -16]));
  const tgt: V3 = [pack[0], Math.max(LADLE.steel + 6, pack[1] - 4), pack[2]];
  return {pos: [JUMP1.p1[0] - 98, LADLE.steel + 46 - 6 * u, JUMP1.p1[2] + 50], target: tgt, fov: 40, roll: mix(-4, -1, u)};
};
const camH5B = (tau: number): Cam3 => {
  const u = (tau - T_H5B) / (T_H6 - T_H5B);
  // from the churned surface, tilt up past the rising smoke to the now-empty launch edge
  const e = easeInOut(u);
  return {pos: lerp3([150, 600, 250], [190, 590, 310], e), target: lerp3([-12, LADLE.steel, 0], [DECK.edgeX - 30, DECK.y + 60, 0], e), fov: mix(40, 44, e), roll: mix(-3, 0, e)};
};
const camH6 = (tau: number): Cam3 => {
  const u = (tau - T_H6) / (T_H7 - T_H6);
  return {pos: lerp3([-120, DECK.y + 230, 520], [-180, DECK.y + 210, 470], smooth(u)), target: lerp3([-430, DECK.y + 60, -10], [-300, DECK.y + 70, 0], smooth(u)), fov: 44};
};
const camH7 = (tau: number): Cam3 => {
  const u = (tau - T_H7) / (HOOK_FOUNDRY_END - T_H7);
  // the witness's view through the control-room glass; after the entry the camera closes on the ripple ring so the
  // ring sits at frame centre for the match to the actuator housing in the workshop
  const z = easeInOut((tau - (R2_IN + 0.15)) / (HOOK_FOUNDRY_END - R2_IN - 0.15));
  const ring: V3 = [JUMP2.p1[0], LADLE.steel, JUMP2.p1[2]];
  const target = lerp3(lerp3([-120, 470, 30], [-100, 450, 20], smooth(u)), ring, z);
  return {pos: lerp3([900, 1000, -560], [840, 970, -510], smooth(u)), target, fov: mix(34, 15, z)};
};

// ---------------------------------------------------------------- props
export const ControlWindow: React.FC = () => (
  <g>
    <path d="M0 0H1920V1080H0Z M110 110H1810V930H110Z" fill="#262A34" fillRule="evenodd" />
    <rect x={110} y={110} width={1700} height={820} fill="none" stroke="#111015" strokeWidth={10} />
    <rect x={610} y={110} width={18} height={820} fill="#262A34" stroke="#111015" strokeWidth={4} />
    <path d="M110 930 L1810 930 L1880 1080 L40 1080 Z" fill="#363B47" stroke="#111015" strokeWidth={6} />
    <path d="M300 968 Q360 900 430 968 Z" fill="#F2B632" stroke="#111015" strokeWidth={5} />
    <rect x={280} y={962} width={170} height={14} rx={6} fill="#E3A520" stroke="#111015" strokeWidth={5} />
    <rect x={1500} y={930} width={60} height={86} rx={8} fill="#1E2026" stroke="#111015" strokeWidth={5} />
    <rect x={1512} y={944} width={36} height={22} rx={3} fill="#5BD6A3" fillOpacity={0.6} />
    <line x1={1548} y1={930} x2={1560} y2={880} stroke="#111015" strokeWidth={6} strokeLinecap="round" />
    <path d="M160 150 L400 150 L230 900 L160 900 Z" fill="#FFFFFF" fillOpacity={0.05} />
    <path d="M1250 150 L1330 150 L1150 900 L1070 900 Z" fill="#FFFFFF" fillOpacity={0.04} />
  </g>
);

// ---------------------------------------------------------------- the composition
/** The witness in the control room: a backlit silhouette (no likeness) watching through the glass. */
const Witness: React.FC<{f: number; k: number}> = ({f, k}) => (
  <AbsoluteFill style={{filter: 'brightness(0)', opacity: 0.94 * k}}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <g transform={`translate(${250 - 200 * 1.55} ${1300 - 500 * 1.55}) scale(1.55)`}>
        <Character look={CAST.checker} pose={{...IDLE, armL: {a: 14, b: 30}, armR: {a: 22, b: 110}, lookX: 0.6, lookY: -0.2, mouth: 'flat'}} frame={f} seed={21} shadow={false} />
      </g>
    </svg>
  </AbsoluteFill>
);

export const HookFoundry: React.FC = () => {
  const f = useCurrentFrame();
  const tau = f / 30;
  const s1 = robot1(tau);
  const fastTrail = (s1.phase === 'air' && JUMP1.ramp!.rateAt(tau) > 0.55) || s1.phase === 'push';
  const trail = fastTrail ? [robot1(tau - 1 / 30).pose, robot1(tau - 2 / 30).pose] : undefined;
  const r1: SceneRobot = {pose: s1.pose, clipY: s1.clipY, id: 'r1', inside: s1.phase === 'plunge' || (s1.phase === 'air' && insideLadle(s1.pose.pos)), trail};
  const e1 = {at: JUMP1.p1, t: postEntry(tau), seed: 11};
  const hideR1 = s1.phase === 'plunge' && s1.t - s1.tIn > 2.6;

  if (tau < T_H2) return <FoundryScene cam={camH1(tau)} tau={tau} robots={[r1]} entries={[]} />;
  if (tau < T_H3) return <FoundryScene cam={camH2(tau)} tau={tau} robots={[r1]} entries={[]} />;
  if (tau < T_H4) return <FoundryScene cam={camH3(tau)} tau={tau} robots={[r1]} entries={[]} />;
  if (tau < T_H5) {
    const shake = e1.t >= 0 ? Math.exp(-e1.t * 5) : 0;
    const tr = e1.t < 0.15 ? [robot1(tau - 1 / 30).pose, robot1(tau - 2 / 30).pose] : undefined;
    return <FoundryScene cam={camH4(tau)} tau={tau} robots={[{...r1, trail: tr}]} entries={[e1]} shake={shake} />;
  }
  if (tau < T_H6) {
    if (tau < T_H5B) return <FoundryScene cam={camH5(tau)} tau={tau} robots={hideR1 ? [] : [r1]} entries={[e1]} flameScale={0.35} />;
    return <FoundryScene cam={camH5B(tau)} tau={tau} robots={[]} entries={[e1]} flameScale={0.45} />;
  }
  const s2 = robot2(tau);
  const r2: SceneRobot = {pose: s2.pose, clipY: s2.clipY, id: 'r2', inside: s2.phase === 'plunge'};
  const e2t = s2.phase === 'plunge' ? tau - R2_IN : -1;
  const entries = [{...e1, seed: 11}, {at: JUMP2.p1, t: e2t, seed: 23}];
  if (tau < T_H7) {
    // the next robot walks out; the one source attribution sits cleanly in the frame (no nested reenactment)
    return (
      <AbsoluteFill>
        <FoundryScene cam={camH6(tau)} tau={tau} robots={[r2]} entries={entries} />
        <Chip x={90} y={920} lines={['FIGURE · “F.02 DECOMMISSION” · SEP 30, 2026']} appear={tau - T_H6 - 0.25} size={30} />
      </AbsoluteFill>
    );
  }
  // the witness's view through the control-room glass; it closes on the ripple ring (match to the workshop)
  const win = 1 - easeInOut((tau - (R2_IN + 0.15)) / 0.5);
  return (
    <AbsoluteFill>
      <FoundryScene cam={camH7(tau)} tau={tau} robots={s2.phase === 'plunge' && tau - R2_IN > 1.4 ? [] : [r2]} entries={entries} />
      <AbsoluteFill style={{opacity: win, transform: `scale(${mix(1.6, 1, win)})`, transformOrigin: '960px 540px'}}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080"><ControlWindow /></svg>
        <Witness f={f} k={1} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export {T_IN, T_TO, T_H2, T_H3, T_H4, T_H5, T_H5B, T_H6, T_H7, R2_IN, R2_WALK0, JUMP2};
