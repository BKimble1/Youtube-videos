// B4 — in the stalled subway (0:32.0–0:36.04). A train with open doors under emergency light. A manual steel gate
// blocks the passage to the platform; behind it, three civilians and the carrier. The carrier heaves from his side, the
// builder jams a pry bar under the edge and levers: the gate jolts up on the two hits (M.HIT_GATE1 / HIT_GATE2). The
// carrier ducks under and holds it up on his back while the civilians duck through one by one; the Director takes them.
// A nod between the carrier and the Director: recognition.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useShot} from '../../film/useShot';
import {M} from '../../film/timing';
import {look, dmg, CIV} from '../../film/crew';
import {Cast, ActorProps, solve} from '../../rig/actor';
import {Cam, Frame, Grade, Layer, shake} from '../../kit/cam';
import {clamp, lerp, noise, smooth, easeOut, keys} from '../../kit/math';
import {SubwayInterior, RollGate, rollGateBottom} from '../../sets/city';
import {Debris} from '../../fx/particles';
import {Glow} from '../../fx/light';
import {walker} from '../../rig/poses';
import {HURRY, SHUFFLE} from '../../rig/gait';
import {ink as inkL, ease} from './kit';
import {PryBar, ToolBag} from './props';
import {at, Cue} from '../../film/cue';

const START = 32.0;
const J1 = M.HIT_GATE1 - START, J2 = M.HIT_GATE2 - START; // ≈ 0.16, 0.58
const GX = 900, GY = 150, GW = 900, GH = 700;

const tile = '#D8D2C2';

export const B4: React.FC = () => {
  const {t, T} = useShot('B4');
  const jolt = Math.max(0, 1 - Math.abs(t - J1) / 0.12) + Math.max(0, 1 - Math.abs(t - J2) / 0.12);
  const cam0: Cam = {x: lerp(1130, 1180, smooth(t / 4)), y: lerp(-170, -160, t / 4), z: lerp(0.98, 1.02, t / 4)};
  const cam = shake(cam0, t, 5 * jolt + 0.3, 9);
  const ik = inkL(cam);
  // gate: a crack (fingers under the edge), two jolts, then the carrier's back takes it
  // the carrier: heaves from behind (hands under the edge), then steps under it, bends at the hips and takes the gate
  // across his upper back, hands braced on his knees, head tucked in front of and below the bar
  const under = ease(t, 0.75, 1.25);
  const cx = 820;
  const cy = lerp(GY - 30, GY + 8, under);
  const nod = Math.max(0, Math.sin(Math.PI * clamp((t - 3.2) / 0.45)));
  const strain = Math.sin(t * 17) * 1.5 * under;
  const Cpose = (k: number): ActorProps => ({look: look('carrier'), t: T, seed: 2, x: cx, y: cy, s: 1, z: lerp(-0.4, 0.15, k), dmg: dmg('carrier', T), breath: 1,
    yaw: lerp(10, 16, k), drop: lerp(70, 34, k), lean: lerp(8, 57, k), side: 0,
    head: {pitch: lerp(-30, 56, k) - nod * 8, yaw: lerp(0, 12, k) + nod * 4},
    face: {mouth: nod > 0.2 ? 'flat' : 'grit', brows: -0.7 + nod * 0.4, squint: 0.6 * (1 - nod), lookX: 0.4 * nod, lookY: -0.3 * nod},
    legL: {foot: {x: cx - lerp(80, 74, k), y: cy - 10, z: lerp(-10, -22, k)}}, legR: {foot: {x: cx + lerp(90, 76, k), y: cy - 10, z: lerp(12, 22, k)}}});
  const cRig = solve(Cpose(under));
  const backTop = Math.min(cRig.sh[0].y, cRig.sh[1].y) - 30;      // the top of his upper back under the bar
  const openHold = (GY - backTop - 2) / (GH * 0.92);
  const open = (t < 0.95 ? keys(t, [[0, 0.1], [J1 - 0.02, 0.1], [J1 + 0.07, 0.27, easeOut], [J2 - 0.02, 0.27], [J2 + 0.08, 0.45, easeOut], [0.95, 0.46]])
    : lerp(0.46, openHold, ease(t, 0.95, 1.35))) + Math.sin(t * 23) * 0.003 * (t > 1.35 ? 1 : 0);
  const bot = rollGateBottom(GY, GH, open);
  const kneeL = cRig.knee[0], kneeR = cRig.knee[1];
  const C: ActorProps = {...Cpose(under),
    armL: under < 0.5 ? {hand: {x: cx - 60, y: bot + 4, z: 20}} : {hand: {x: kneeL.x + 6, y: kneeL.y - 14 + strain, z: kneeL.z + 16}, pole: {x: -0.6, y: 0.2, z: 0.6}},
    armR: under < 0.5 ? {hand: {x: cx + 70, y: bot + 4, z: 20}} : {hand: {x: kneeR.x - 6, y: kneeR.y - 14 - strain, z: kneeR.z + 16}, pole: {x: 0.6, y: 0.2, z: 0.6}},
    handL: under < 0.5 ? 'fist' : 'mitt', handR: under < 0.5 ? 'fist' : 'mitt'};
  // the builder on our side: pry bar under the edge, levering on the hits, then out of the way
  const bx = 1240, by = GY + 70;
  const lever = keys(t, [[0, 0], [J1, 0.45, easeOut], [J2 - 0.05, 0.5], [J2 + 0.08, 1, easeOut], [1.1, 1]]);
  const barOut = ease(t, 1.1, 1.4);
  const barTip = {x: GX + 80, y: bot - 6};
  const barAng = lerp(-8, 22, lever); // degrees below horizontal toward the builder's hands
  const barLen = 330;
  const barEnd = {x: barTip.x + Math.cos((barAng * Math.PI) / 180) * barLen, y: barTip.y + Math.sin((barAng * Math.PI) / 180) * barLen};
  const B: ActorProps = barOut < 0.5 ? {look: look('builder'), t: T, seed: 6, x: bx, y: by, s: 1, z: 0.5, dmg: dmg('builder', T), breath: 1,
    yaw: -62, drop: 66 - lever * 10, lean: 26 + lever * 10,
    head: {pitch: 12, yaw: -6}, face: {mouth: 'grit', brows: -0.6, squint: 0.5, lookX: -0.4},
    legL: {foot: {x: bx + 70, y: by - 10, z: -10}}, legR: {foot: {x: bx - 60, y: by - 10, z: 12}},
    armR: {hand: {x: barEnd.x - 10, y: barEnd.y, z: 24}}, armL: {hand: {x: barEnd.x - 70, y: barEnd.y - 8 + 0, z: -10}},
    handL: 'fist', handR: 'fist'}
    : {...walker(look('builder'), {x0: bx, dist: ease(t, 1.4, 2.0) * 90, dir: 1, ground: by, gait: HURRY}, {t: T, seed: 6, s: 1, z: 0.5, dmg: dmg('builder', T)}), yaw: lerp(90, -40, ease(t, 2.1, 2.5)), head: {yaw: -20}};
  // the civilians duck under, one by one, toward the Director
  const civs = [0, 1, 2].map((i) => {
    const t0 = 1.3 + i * 0.6;
    const thru = smooth(clamp((t - t0) / 0.6));        // ducking under the edge beside the carrier, toward us
    const run = Math.max(0, t - t0 - 0.5);             // then hurrying off right, toward the stairs
    const duck = Math.sin(Math.PI * clamp((t - t0 + 0.1) / 0.85));
    const x0 = 1030 + i * 60;
    const d = 60 * thru + run * (660 - i * 20) * smooth(clamp(run / 0.3));
    const g = lerp(GY - 40, GY + 120 + i * 14, thru);
    const w = walker(CIV[i], {x0, dist: d, dir: 1, ground: g, gait: run > 0 ? HURRY : SHUFFLE}, {t: T, s: 0.97, seed: 70 + i, z: thru < 0.45 ? -0.6 - i * 0.01 : 0.3 + i * 0.05});
    return {...w, drop: (w.drop ?? 0) + duck * 135, lean: 8 + duck * 48, head: {pitch: -duck * 18, yaw: run > 0.3 ? 10 : 0},
      face: {mouth: 'o' as const, worry: 0.9, brows: 0.5}, armL: {fk: {fwd: 30 + duck * 30, out: 10, bend: 60}}, armR: {fk: {fwd: 20 + duck * 20, out: 10, bend: 40}}} as ActorProps;
  });
  // the Director, a little back from the path, sends them on toward the stairs (right); a nod to the carrier
  const dx = 1610;
  const wave = ease(t, 1.9, 2.2) * (1 - ease(t, 3.0, 3.3));
  const D: ActorProps = {look: look('director'), t: T, seed: 4, x: dx, y: GY + 30, s: 1, z: -0.1, dmg: dmg('director', T), breath: 0.8,
    yaw: lerp(-40, -60, ease(t, 3.0, 3.3)), lean: 6, head: {pitch: 4 + nod * 14, yaw: lerp(30, -10, ease(t, 2.9, 3.2))}, face: {mouth: 'flat', brows: -0.1, lookX: lerp(0.4, -0.6, ease(t, 2.9, 3.2))},
    legL: {foot: {x: dx + 50, y: GY + 20}}, legR: {foot: {x: dx - 60, y: GY + 20}},
    armR: wave > 0.02 ? {hand: {x: dx + 120 + Math.sin(t * 9) * 20 * wave, y: GY - 300, z: 60}, w: wave, fk: {fwd: 10, out: 12, bend: 30}} : {fk: {fwd: 10, out: 12, bend: 30}},
    armL: {fk: {fwd: 8, out: 10, bend: 24}}, handR: 'open'};
  const passage = (
    <g>
      <rect x={GX - GW / 2} y={GY - GH} width={GW} height={GH} fill="#120E10" />
      <rect x={GX - GW / 2} y={GY - 120} width={GW} height={120} fill="#2A2224" />
      <Glow x={GX + 200} y={GY - 300} r={420} color="#FF7A3A" opacity={0.25 + 0.1 * noise(t * 5, 3)} id="b4pg" />
    </g>
  );
  const behind = [C, ...civs].filter((a) => (a.z ?? 0) < 0);
  const front = [C, ...civs].filter((a) => (a.z ?? 0) >= 0);
  return (
    <AbsoluteFill>
      <Frame bg="#1A1416">
        <Layer cam={cam} p={1}>
          <SubwayInterior x0={-2400} x1={300} t={T} ink={ik} emergency={1} trainX={0} doors={1} />
          <rect x={300} y={-1500} width={2400} height={1420} fill={tile} />
          <rect x={300} y={-1080} width={2400} height={90} fill="#3E7A58" opacity={0.85} />
          <rect x={300} y={-80} width={2400} height={700} fill="#6C665F" />
          <rect x={300} y={-86} width={2400} height={14} fill="#8C857E" />
          {passage}
          <Cast actors={behind.map((a) => ({...a, ink: ik}))} />
          <RollGate x={GX} y={GY} w={GW} h={GH} open={open} ink={ik} t={T} />
          {barOut < 0.5 && <g transform={`translate(${barTip.x} ${barTip.y}) rotate(${barAng})`}><PryBar s={2.2} ink={ik} len={150} /></g>}
          <Cast actors={[...front, B, D].map((a) => ({...a, ink: ik}))}
            extra={[{z: 500 - 45, el: <ToolBag x={(B.x as number) + 30} y={(B.y as number) - 250 + (B.drop ?? 0)} s={0.95} ink={ik} swing={noise(t * 1.4, 5) * 6} />}]} />
          <Debris x={GX} y={bot} t={T} t0={J1} n={8} dir={-90} spread={160} speed={[150, 400]} size={[3, 7]} ground={GY + 60} material="metal" ink={ik * 0.5} />
          <Debris x={GX} y={bot} t={T} t0={J2} n={8} dir={-90} spread={160} speed={[150, 400]} size={[3, 7]} ground={GY + 60} material="metal" ink={ik * 0.5} seed={3} />
        </Layer>
        <Grade vignette={0.55} id="b4vg" tint="#FF7A3A" tintOp={0.1} />
      </Frame>
    </AbsoluteFill>
  );
};

export const CUES_B4: Cue[] = (() => {
  const c = at(START);
  return [
    c(0.0, 'breath_exert', {gain: -4, pan: -0.1, dist: 0.2}),
    c(J1, 'gate_roll', {gain: 0, pan: 0.0, dist: 0.2, rate: 1.2}),
    c(J1 + 0.01, 'lever_clunk', {gain: -4, pan: 0.15}),
    c(J2, 'gate_roll', {gain: 0, pan: 0.0, dist: 0.2, rate: 1.1}),
    c(J2 + 0.01, 'shutter_slam', {gain: -6, pan: 0.0, dist: 0.2}),
    c(1.2, 'breath_exert', {gain: -2, pan: -0.15, rate: 0.9}),
    c(1.3, 'steps_gravel', {gain: -10, pan: 0.1, dist: 0.2}),
    c(1.9, 'steps_gravel', {gain: -10, pan: 0.25, dist: 0.2}),
    c(2.5, 'steps_gravel', {gain: -10, pan: 0.4, dist: 0.2}),
  ];
})();
