// SHOTS H8–H9: "So why would a company do this? And how does a robot learn a jump it only gets to make once?"
// Match cut: ladle rim (end of H7) → top of an actuator housing on a workbench; pull back into the light workshop;
// push into the F.02's face panel and through it into the simulation world.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cam3, makeProj, camMix} from '../engine/camera';
import {V3, add, clamp01, lerp3, mix, smooth, norm} from '../engine/math';
import {Item} from '../engine/prims';
import {Scene3D, RobotSpec} from '../engine/Scene3D';
import {WORKSHOP_ENV, WS, scrapBin, stand, workbench, workshopBack} from '../sets/Workshop';
import {SIM, SIM_ENV, SimBg, arc3, simWorld} from '../sets/SimWorld';
import {STAND, walkPose, ballistic, launch, blendPose} from '../robot/motion';
import {solve} from '../robot/rig';
import {T, TE, blockStart} from '../cues';
import {HOOK_FOUNDRY_END, easeInOut, easeOut} from './HookFoundry';

export const HOOK_TURN_START = HOOK_FOUNDRY_END;
export const HOOK_TURN_END = blockStart('B02') - 0.12;
const T_HOW = T('And how does') - 0.1;
const T_THROUGH = T('learn a jump') + 0.05;      // the face panel fills the frame → go through into the sim
const T_JUMP = T('jump it only');
const T_ONCE = T('once');

const WS_LIGHT = {dir: norm([-0.45, 0.8, 0.5])};
const F02_POS: V3 = [WS.stand[0], WS.standTop + 95.4, WS.stand[2]];
const ACT_TOP: V3 = [WS.bench[0] - 70, 110, WS.bench[2] - 6];

const f02Pose = (tau: number) => {
  const p = STAND(F02_POS, 0.25);
  p.head.pitch = 0.22 + 0.04 * Math.sin(tau * 0.8);
  p.armL = {pitch: 0.02, roll: 0.1, twist: 0, elbow: 0.12, wrist: 0, grip: 0.2};
  p.armR = {pitch: 0.02, roll: 0.1, twist: 0, elbow: 0.12, wrist: 0, grip: 0.2};
  return p;
};
const f03Walk = (tau: number) => walkPose([-760, 0, -430], Math.PI / 2, (tau - HOOK_TURN_START) * 105, 0, {stride: 60});

// H8: from the actuator cap (matching the ladle rim's size/position) pull back to the workshop
const camH8 = (tau: number): Cam3 => {
  const u = easeInOut((tau - HOOK_TURN_START) / 1.25);
  const a: Cam3 = {pos: add(ACT_TOP, [0, 13, 21]), target: add(ACT_TOP, [0, 0, 0]), fov: 40};
  const b: Cam3 = {pos: [210, 250, 330], target: [-20, 120, -200], fov: 46, roll: -2};
  return camMix(a, b, u);
};
// H9: push into the face panel
const camH9 = (tau: number): Cam3 => {
  const u = (tau - T_HOW) / (T_THROUGH - T_HOW);
  const sk = solve(f02Pose(tau));
  const face = add(sk.head.o, [Math.sin(0.25) * 9, 8, Math.cos(0.25) * 9]);
  const b: Cam3 = {pos: add(face, [Math.sin(0.25) * 22, 2, Math.cos(0.25) * 22]), target: face, fov: 40};
  const a: Cam3 = {pos: [210, 250, 330], target: [-20, 120, -200], fov: 46, roll: -2};
  return camMix(a, b, easeInOut(u));
};

const simJump = (() => {
  const p0: V3 = [SIM.platEdgeX - 18, SIM.platTop + 92, 0];
  const p1: V3 = [SIM.target[0] - 6, 92, 0];
  const v = launch(p0, p1, 0.95);
  const pts: V3[] = [];
  for (let i = 0; i <= 30; i++) pts.push(ballistic(p0, v, (0.95 * i) / 30));
  return {p0, pts};
})();

export const HookTurn: React.FC = () => {
  const f = useCurrentFrame();
  const tau = HOOK_TURN_START + f / 30;
  if (tau < T_THROUGH) {
    const cam = tau < T_HOW ? camH8(tau) : camH9(tau);
    const pr = makeProj(cam);
    const env = WORKSHOP_ENV;
    const items: Item[] = [...workshopBack(pr, env, tau), ...stand(pr, env), ...workbench(pr, env), ...scrapBin(pr, env)];
    const robots: RobotSpec[] = [
      {id: 'f02ws', pose: f02Pose(tau), light: WS_LIGHT},
      {id: 'f03ws', pose: f03Walk(tau), kind: 'F03', light: WS_LIGHT},
      {id: 'rack1', pose: STAND([-1050, 12 + 95.4, WS.wallZ + 90], 0), light: WS_LIGHT},
      {id: 'rack2', pose: STAND([-880, 12 + 95.4, WS.wallZ + 90], 0), light: WS_LIGHT},
    ];
    // the face panel fills the frame at the end of the push: fade to its glossy black
    const k = clamp01((tau - (T_THROUGH - 0.35)) / 0.35);
    return (
      <AbsoluteFill style={{background: '#F4ECD6'}}>
        <Scene3D pr={pr} bg={<rect width={1920} height={1080} fill="#F4ECD6" />} items={items} robots={robots} frame={f} over={k > 0 ? <rect width={1920} height={1080} fill="#07090B" opacity={k} /> : null} />
      </AbsoluteFill>
    );
  }
  // through the face panel: an iris opens from black onto the simulation world
  const u = (tau - T_THROUGH) / (HOOK_TURN_END - T_THROUGH);
  const cam: Cam3 = {pos: lerp3([620, 380, 860], [520, 330, 760], smooth(u)), target: [-90, 140, 0], fov: 42};
  const pr = makeProj(cam);
  const env = SIM_ENV;
  const pulse = clamp01(1 - Math.abs(tau - T_ONCE - 0.15) / 0.3);
  const items: Item[] = simWorld(pr, env, {ringPulse: pulse});
  const draw = clamp01((tau - T_JUMP) / 0.9);
  if (draw > 0) items.push(arc3(pr, 'hookArc', simJump.pts, '#4F7CC9', {upto: easeOut(draw)}));
  const pose = (() => {
    const s = STAND([SIM.platEdgeX - 30, SIM.platTop + 95.4, 0], Math.PI / 2);
    const c = blendPose(s, {...s, pos: [SIM.platEdgeX - 34, SIM.platTop + 74, 0], pitch: 0.4, spine: {pitch: 0.12, yaw: 0, roll: 0}, head: {pitch: 0.2, yaw: 0, roll: 0},
      armL: {pitch: -0.8, roll: 0.14, twist: 0, elbow: 0.3, wrist: 0, grip: 0.4}, armR: {pitch: -0.8, roll: 0.14, twist: 0, elbow: 0.3, wrist: 0, grip: 0.4},
      footL: {pos: [SIM.platEdgeX - 22, SIM.platTop + 10, -9.5], pitch: 0, yaw: Math.PI / 2}, footR: {pos: [SIM.platEdgeX - 22, SIM.platTop + 10, 9.5], pitch: 0, yaw: Math.PI / 2}}, smooth((tau - T_THROUGH - 0.3) / 0.6));
    return c;
  })();
  const iris = easeOut(clamp01((tau - T_THROUGH) / 0.45));
  return (
    <AbsoluteFill style={{background: '#07090B'}}>
      <AbsoluteFill style={{clipPath: `circle(${(iris * 1150).toFixed(1)}px at 960px 540px)`}}>
        <Scene3D pr={pr} bg={<SimBg />} items={items} robots={[{id: 'simHook', pose, kind: 'SIM', light: {dir: norm([-0.4, 0.85, 0.45])}}]} frame={f} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
void TE; void mix;
