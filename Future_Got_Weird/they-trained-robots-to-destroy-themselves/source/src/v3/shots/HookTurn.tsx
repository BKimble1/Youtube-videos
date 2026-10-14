// SHOTS H8–H11: "So why would a company do this? And how does a robot learn a jump it only gets to make once?"
//   H8  match cut: the ripple rings (end of H7) become the machined rings of an actuator face under a warm task lamp;
//       the camera keeps pushing toward its centre for a beat, then pulls out into the product bay
//   H9  push into the F.02's visor; its black fills the frame
//   H10 through the visor into the training stage (same world placement as the foundry): crouch, arc on "jump",
//       target pulse on "once"
//   H11 the virtual robot turns its visor to the camera; the close-up is matched in Why (S2a) on the finished F.02
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Cam3, Proj, makeProj, camMix} from '../engine/camera';
import {V3, add, clamp01, lerp3, mix, smooth, norm, mv} from '../engine/math';
import {Item} from '../engine/prims';
import {Scene3D, RobotSpec} from '../engine/Scene3D';
import {WORKSHOP_ENV, WS, ACT_R, stand, workbench, workshopBack, toolCart, partsShelf} from '../sets/Workshop';
import {STAGE, STAGE_ENV, StageBg, stage} from '../sets/Stage';
import {arc3} from '../sets/SimWorld';
import {STAND, walkPose, ballistic, launch, blendPose} from '../robot/motion';
import {Pose, solve} from '../robot/rig';
import {T, blockStart} from '../cues';
import {HOOK_FOUNDRY_END, easeInOut, easeOut} from './HookFoundry';

export const HOOK_TURN_START = HOOK_FOUNDRY_END;
export const HOOK_TURN_END = blockStart('B02') - 0.12;
const T_HOW = T('And how does') - 0.1;
const T_THROUGH = T('learn a jump') + 0.05;      // the visor fills the frame → through into the training stage
const T_JUMP = T('jump it only');
const T_ONCE = T('once');
const T_TURN = HOOK_TURN_END - 0.8;              // the virtual robot turns its visor to the camera
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

export const WS_LIGHT = {dir: norm([-0.45, 0.8, 0.5])};
export const F02_STAND_POS: V3 = [WS.stand[0], WS.standTop + 95.4, WS.stand[2]];
export const F02_STAND_YAW = 0.25;
/** Top centre of the actuator face in the vise (the match-cut circle). */
export const ACT_TOP: V3 = [WS.bench[0] - 70, 104 + ACT_R.h, WS.bench[2] - 6];

export const f02StandPose = (tau: number): Pose => {
  const p = STAND(F02_STAND_POS, F02_STAND_YAW);
  p.head.pitch = 0.05 + 0.03 * Math.sin(tau * 0.8);
  p.armL = {pitch: 0.02, roll: 0.1, twist: 0, elbow: 0.12, wrist: 0, grip: 0.2};
  p.armR = {pitch: 0.02, roll: 0.1, twist: 0, elbow: 0.12, wrist: 0, grip: 0.2};
  return p;
};
// an F.03 walks across the back of the bay (in front of the glass partition, never through it)
const f03Walk = (tau: number) => walkPose([-640, 0, -440], Math.PI / 2, (tau - HOOK_TURN_START) * 92, 0, {stride: 58});

/** Camera framing the visor head-on from `dist` cm (shared by H11 and Why S2a so the visor matches exactly). */
export const visorCam = (pose: Pose, dist: number, fov = 30): Cam3 => {
  const sk = solve(pose);
  const c = add(sk.head.o, mv(sk.head.m, [0, 8, 8]));
  return {pos: add(sk.head.o, mv(sk.head.m, [0, 9, 8 + dist])), target: c, fov};
};

// ---------------------------------------------------------------- H8: actuator face → product bay
// H7 ends looking down at ~33° on three ripple rings (r 87 / 113 / 140 cm at fov 15). The actuator face's rings
// (groove / flange / housing edge) have the same ratios; at 37 cm and fov 40 the housing edge lands on the outer ring.
const ELEV = (33 * Math.PI) / 180;
const H8_WIDE: Cam3 = {pos: [170, 225, 290], target: [-110, 175, -280], fov: 47, roll: -1.5};
const camH8 = (tau: number): Cam3 => {
  const t = tau - HOOK_TURN_START;
  const dirH: V3 = norm([0.12, 0, 1]);
  const at = (d: number): V3 => add(ACT_TOP, [dirH[0] * d * Math.cos(ELEV), d * Math.sin(ELEV), dirH[2] * d * Math.cos(ELEV)]);
  // continue the push for 8 frames (decelerating), then pull out
  const push = easeOut(clamp01(t / 0.27));
  const d0 = mix(33, 28, push);
  const near: Cam3 = {pos: at(d0), target: ACT_TOP, fov: 40};
  const u = clamp01((t - 0.27) / (T_HOW - HOOK_TURN_START - 0.27));
  if (u <= 0) return near;
  const e = easeInOut(u);
  // the target leaves the actuator late, so the part stays in frame while the room opens up
  const cam = camMix(near, H8_WIDE, e);
  cam.target = lerp3(ACT_TOP, H8_WIDE.target, Math.pow(e, 1.7));
  return cam;
};
// H9: push into the F.02's visor
const camH9 = (tau: number): Cam3 => {
  const u = easeInOut(seg(tau, T_HOW, T_THROUGH));
  return camMix(H8_WIDE, visorCam(f02StandPose(tau), 9, 34), u);
};

const workshopFrame = (pr: Proj, tau: number, warm: number): Item[] => [
  ...workshopBack(pr, WORKSHOP_ENV, tau), ...stand(pr, WORKSHOP_ENV), ...workbench(pr, WORKSHOP_ENV, {warm}),
  ...toolCart(pr, WORKSHOP_ENV, [470, 0, -90], 'cartH8'), ...partsShelf(pr, WORKSHOP_ENV, [620, 0, -540], 'shelfH8'),
];

// ---------------------------------------------------------------- H10/H11: training stage
const G = STAGE;
const SIM_YAW = Math.PI / 2;
const simStand = (): Pose => STAND([G.edgeX - 30, G.deckY + 95.4, 0], SIM_YAW);
const simCrouch = (): Pose => {
  const s = simStand();
  return blendPose(s, {...s, pos: [G.edgeX - 34, G.deckY + 74, 0], pitch: 0.4, spine: {pitch: 0.12, yaw: 0, roll: 0}, head: {pitch: 0.2, yaw: 0, roll: 0},
    armL: {pitch: -0.8, roll: 0.14, twist: 0, elbow: 0.3, wrist: 0, grip: 0.4}, armR: {pitch: -0.8, roll: 0.14, twist: 0, elbow: 0.3, wrist: 0, grip: 0.4},
    footL: {pos: [G.edgeX - 22, G.deckY + 10, -9.5], pitch: 0, yaw: SIM_YAW}, footR: {pos: [G.edgeX - 22, G.deckY + 10, 9.5], pitch: 0, yaw: SIM_YAW}}, 1);
};
const simJump = (() => {
  const p0: V3 = [G.edgeX - 18, G.deckY + 92, 0];
  const p1: V3 = [G.target[0], G.padY + 92, 0];
  const v = launch(p0, p1, 1.05);
  const pts: V3[] = [];
  for (let i = 0; i <= 30; i++) pts.push(ballistic(p0, v, (1.05 * i) / 30));
  return {p0, pts};
})();
const simPose = (tau: number): Pose => {
  const c = smooth(seg(tau, T_THROUGH + 0.25, T_THROUGH + 0.85));
  const p = blendPose(simStand(), simCrouch(), c);
  // H11: rise slightly and turn the head and chest toward the camera (the visor turns into the close-up)
  const turn = smooth(seg(tau, T_TURN, T_TURN + 0.55));
  if (turn > 0) {
    const up = blendPose(p, simStand(), turn * 0.7);
    up.spine = {...up.spine, yaw: 0.35 * turn};
    up.head = {pitch: mix(up.head.pitch, -0.02, turn), yaw: 0.62 * turn, roll: 0};
    return up;
  }
  return p;
};
const H10_CAM = (tau: number): Cam3 => {
  const u = smooth(seg(tau, T_THROUGH, T_TURN));
  return {pos: lerp3([420, 820, 980], [360, 790, 900], u), target: [-150, 480, 0], fov: 42};
};

/** The training stage at screen time tau (H10/H11); also used frozen on its last frame by Why S2a's scan resolve. */
export const SimStageFrame: React.FC<{tau: number; f: number}> = ({tau, f}) => {
  let cam = H10_CAM(tau);
  const pose = simPose(tau);
  if (tau > T_TURN) {
    // H11: push to the visor as it turns toward the lens; ends on the shared visor framing
    const u = easeInOut(seg(tau, T_TURN, HOOK_TURN_END - 1 / 30));
    cam = camMix(H10_CAM(T_TURN), visorCam(pose, 62), u);
  }
  const pr = makeProj(cam);
  const pulse = clamp01(1 - Math.abs(tau - T_ONCE - 0.15) / 0.3);
  const items: Item[] = stage(pr, STAGE_ENV, {ringPulse: pulse});
  const draw = clamp01((tau - T_JUMP) / 0.9);
  if (draw > 0) items.push(arc3(pr, 'hookArc', simJump.pts, '#4F7CC9', {upto: easeOut(draw), opacity: 0.9 * (1 - seg(tau, T_TURN, T_TURN + 0.4))}));
  return <Scene3D pr={pr} bg={<StageBg />} items={items} robots={[{id: 'simHook', pose, kind: 'SIM', light: {dir: norm([-0.4, 0.85, 0.45])}, ground: G.deckY}]} frame={f} />;
};

export const HookTurn: React.FC = () => {
  const f = useCurrentFrame();
  const tau = HOOK_TURN_START + f / 30;
  if (tau < T_THROUGH) {
    const cam = tau < T_HOW ? camH8(tau) : camH9(tau);
    const pr = makeProj(cam);
    // warm lamp pool on the actuator face fades as the room opens up (the colour bridge from the molten ripple)
    const warm = 1 - smooth(seg(tau, HOOK_TURN_START + 0.15, HOOK_TURN_START + 0.9));
    const robots: RobotSpec[] = [
      {id: 'f02ws', pose: f02StandPose(tau), light: WS_LIGHT, ground: WS.standTop},
      {id: 'f03ws', pose: f03Walk(tau), kind: 'F03', light: WS_LIGHT, ground: 0},
      {id: 'rack1', pose: STAND([-1050, 40 + 95.4, -420], 0.3), light: WS_LIGHT},
    ];
    // the visor fills the frame at the end of the push: settle to its glossy black
    const k = clamp01((tau - (T_THROUGH - 0.3)) / 0.3);
    return (
      <AbsoluteFill style={{background: '#F4ECD6'}}>
        <Scene3D pr={pr} bg={<rect width={1920} height={1080} fill="#F4ECD6" />} items={workshopFrame(pr, tau, warm)} robots={robots} frame={f}
          over={k > 0 ? <rect width={1920} height={1080} fill="#07090B" opacity={k} /> : null} />
      </AbsoluteFill>
    );
  }
  // H10: through the visor, an iris opens from black onto the training stage
  const iris = easeOut(clamp01((tau - T_THROUGH) / 0.45));
  return (
    <AbsoluteFill style={{background: '#07090B'}}>
      <AbsoluteFill style={{clipPath: `circle(${(iris * 1150).toFixed(1)}px at 960px 540px)`}}>
        <SimStageFrame tau={tau} f={f} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
