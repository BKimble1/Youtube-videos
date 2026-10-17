// A4 — the collection route (0:10.4–0:14.2). Over the Director's shoulder, down the avenue to the west: a lit
// checkpoint where wardens funnel a line of survivors while barriers slide shut across the side streets. At the arch a
// warden's arm comes down between two people holding hands: one is waved through, the injured one is turned into the
// holding pen; their hands part. The nearest warden turns its eye on the Director and opens a palm guidance light
// toward the checkpoint. The Director tightens their hold on the teammate and steps back into the smoke — away.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useShot} from '../../film/useShot';
import {look, dmg, CIV} from '../../film/crew';
import {Cast, ActorProps} from '../../rig/actor';
import {CIVILIANS} from '../../rig/looks';
import {Cam, Frame, Grade, Layer} from '../../kit/cam';
import {clamp, lerp, noise, smooth, keys} from '../../kit/math';
import {CITY} from '../../theme';
import {Street, Facades, Checkpoint} from '../../sets/city';
import {Warden, wardenWalker, Drone} from '../../mech';
import {walker} from '../../rig/poses';
import {SHUFFLE, WALK} from '../../rig/gait';
import {Smoke} from '../../fx/smoke';
import {Embers} from '../../fx/fire';
import {BurningSky, ink as inkL, ease} from './kit';
import {at, Cue} from '../../film/cue';

const START = 10.4;

export const A4: React.FC = () => {
  const {t, T} = useShot('A4');
  const cam: Cam = {x: lerp(-2380, -2420, smooth(t / 3.8)), y: -560, z: 0.4};
  const ik = inkL(cam);
  const G = 0;
  // ---------------- the line of survivors shuffling west toward the arch (x −3000)
  const queue: ActorProps[] = [];
  const looks = [CIVILIANS[1], CIVILIANS[3], CIVILIANS[0], CIVILIANS[2], CIVILIANS[1]];
  [0, 1, 2, 3, 4].forEach((i) => {
    const x0 = -1500 + i * 300;
    const d = 230 + t * 95;
    queue.push(walker(looks[i], {x0, dist: d, dir: -1, ground: G + 40 + (i % 2) * 30, gait: SHUFFLE}, {t: T, s: 0.95, seed: 40 + i, z: -0.5 + i * 0.01,
      face: {mouth: 'flat', worry: 0.7}, head: {pitch: 10}, armL: {fk: {fwd: 6, out: 6, bend: 30}}, armR: {fk: {fwd: 8, out: 6, bend: 34}}}));
  });
  // ---------------- the separation at the arch: a pair holding hands; the injured one is turned into the pen
  const sep = ease(t, 1.25, 1.75), part = ease(t, 1.6, 2.2);
  const bx = lerp(-2780, -3040, smooth(clamp(t / 1.3))) - ease(t, 1.7, 3.8) * 420; // B walks through, west
  const ax = lerp(-2620, -2860, smooth(clamp(t / 1.3))) - part * 60;               // A stops, is turned
  const aTurn = ease(t, 1.9, 2.5);
  const A: ActorProps = {look: CIVILIANS[0], t: T, seed: 51, s: 0.95, x: ax, y: G + 40, yaw: lerp(-90, -10, aTurn), z: 0.1,
    drop: 8, side: -4, face: {mouth: 'o', worry: 1, brows: 0.6}, head: {yaw: lerp(0, -30, part), pitch: 4},
    legL: {foot: {x: ax - 40, y: G + 30}}, legR: {foot: {x: ax + 30, y: G + 32}, pitch: 20},
    armR: {hand: part < 0.9 ? {x: lerp(ax - 120, ax - 60, part), y: -210 + part * 40, z: 20} : undefined, fk: {fwd: 30, out: 10, bend: 20}},
    armL: {fk: {fwd: 20, out: 10, bend: 70}}};
  const B: ActorProps = {...walker(CIVILIANS[2], {x0: -2780, dist: Math.max(0, -2780 - bx), dir: -1, ground: G + 30, gait: WALK}, {t: T, s: 0.98, seed: 52, z: 0.05}),
    head: {yaw: -part * 70, pitch: 2}, face: {mouth: 'o', worry: 0.9, brows: 0.5},
    armR: {hand: part < 0.9 ? {x: lerp(bx + 120, bx + 160, part), y: -220 + part * 30, z: 20} : undefined, fk: {fwd: -30 - part * 20, out: 14, bend: 10}}};
  // gate warden: the arm comes down between them
  const gw: ActorProps | null = null; void gw;
  const gateArm = ease(t, 1.2, 1.6);
  // ---------------- the near warden: turns its eye on the Director, opens a palm guidance light toward the checkpoint
  const eye = ease(t, 1.4, 1.9);
  const beam = ease(t, 1.85, 2.35);
  const nwx = -1250;
  // ---------------- the foreground pair (screen space): Director + teammate from behind, then a step back into smoke
  const step = ease(t, 2.55, 3.15), step2 = ease(t, 3.1, 3.7);
  const fx = 1560 + step * 120 + step2 * 300, fy = 1240;
  const S = 1.42;
  const hold = ease(t, 2.2, 2.5);
  const dirYaw = lerp(-144, -150, hold) + step2 * 30;
  const D: ActorProps = {look: look('director'), t: T, seed: 4, x: fx, y: fy, s: S, z: 1, yaw: dirYaw, dmg: dmg('director', T), breath: 0.8,
    side: -4 - hold * 3, lean: 4,
    head: {yaw: lerp(8, -12, eye) + hold * 34, pitch: 4},
    face: {mouth: 'grit', brows: -0.5},
    armR: {fk: {fwd: 8, out: 8, bend: 30}},
    armL: {hand: {x: fx - 150 * S, y: fy - 168 * S, z: 60}, pole: {x: -0.2, y: 1, z: 0.6}}, zArm: [2600, undefined], zHand: [2600, undefined], handL: 'fist',
    legL: {foot: {x: fx - 40 * S - step * 30, y: fy - 10 * S}}, legR: {foot: {x: fx + 40 * S + step2 * 40, y: fy - 10 * S}}};
  const tx = fx - 128 * S;
  const TM: ActorProps = {look: look('teammate'), t: T, seed: 3, x: tx, y: fy + 6, s: S * 0.98, z: 0.6, yaw: dirYaw + 6, dmg: dmg('teammate', T), breath: 1,
    side: -10, drop: 14, lean: 6,
    head: {yaw: -10 + hold * 20, pitch: 8, roll: 6}, face: {mouth: 'pant', worry: 0.8, lids: 0.4},
    armR: {hand: {x: fx + 34 * S, y: fy - 292 * S, z: 30}, pole: {x: 0.2, y: 1, z: 0.8}}, zArm: [undefined, 1700], zHand: [undefined, 1700],
    armL: {fk: {fwd: 30, out: 6, bend: 115}},
    legL: {foot: {x: tx - 30 * S, y: fy - 26 * S, z: -30}, pitch: 30}, legR: {foot: {x: tx + 36 * S, y: fy - 10 * S}}};
  const close = lerp(0.35, 1, ease(t, 0.2, 3.2));
  return (
    <AbsoluteFill>
      <Frame bg={CITY.skyTop}>
        <BurningSky id="a4sky" glowY={520} glow={0.6} />
        <Layer cam={cam} p={0.95}>
          <Facades x0={-6400} x1={800} base={-140} t={T} ink={inkL(cam, 0.95)} seed={12} burn={0.3} />
        </Layer>
        <Layer cam={cam} p={1}>
          <Smoke mode="cloud" x={-2400} y={-1500} w={4000} h={700} n={9} t={T} seed={41} color={CITY.smoke} opacity={0.55} drift={24} />
          <Street x0={-6400} x1={800} t={T} ink={ik} debris={0.8} seed={12} />
          <Checkpoint t={T} ink={ik} close={close} lock={ease(t, 2.9, 3.1)} />
          <Warden x={-3330} y={G + 10} s={0.9} t={T} seed={61} ink={ik} yaw={60} lock={0.2} look={{x: 0.6, y: 0.3}}
            armR={{hand: {x: lerp(-3150, -2920, gateArm), y: lerp(-150, -330, gateArm), z: 40}}} armL={{fk: {fwd: 4, out: 8, bend: 16}}} />
          <Warden {...wardenWalker(-1900, 20 + t * 40, -1, G - 40, {t: T, s: 0.9, seed: 62, ink: ik, look: {x: -0.5, y: 0.1}})} />
          <Cast actors={[...queue, B, A]} />
          <Warden x={nwx} y={G + 80} s={1} t={T} seed={63} ink={ik} yaw={lerp(-80, -20, eye)} headYaw={eye * 40} look={{x: lerp(-0.4, 0.7, eye), y: 0.15}} lock={0.15} glow={0.5 + eye * 0.5}
            armL={{hand: {x: lerp(nwx - 60, nwx - 300, beam), y: lerp(-150, -390, beam), z: 40}}} armR={{fk: {fwd: 4, out: 8, bend: 16}}}
            beam={{amt: beam, side: 'L', dir: 192, len: 1100}} />
          <Drone x={-2050} y={-1180} s={1.4} t={T} seed={6} ink={ik} face={-0.8} look={{x: -0.2, y: 0.7}} />
          <Drone x={-3500} y={-1420} s={1.2} t={T} seed={7} ink={ik} face={0.6} look={{x: 0.2, y: 0.8}} />
        </Layer>
        {/* the Director and the teammate, over the shoulder */}
        <Cast actors={[TM, D]} />
        <Smoke mode="cloud" x={1830 - step2 * 120} y={700} w={700} h={900} n={7} t={T} seed={44} color={CITY.smoke} opacity={0.35 + step2 * 0.55} drift={-30} />
        <Embers x={0} y={0} w={1920} h={1080} t={T} seed={7} n={14} />
        <Grade vignette={0.5} id="a4vg" tint="#3A1810" tintOp={0.08} />
      </Frame>
    </AbsoluteFill>
  );
};

export const CUES_A4: Cue[] = (() => {
  const c = at(START);
  return [
    c(0.25, 'gate_roll', {gain: -6, pan: -0.5, dist: 0.6}),
    c(1.25, 'servo_whir', {gain: -4, pan: -0.3, dist: 0.6}),
    c(1.45, 'servo_heavy', {gain: -6, pan: 0.15, dist: 0.4}),
    c(1.9, 'sensor_lock', {gain: -8, pan: 0.15, dist: 0.4}),
    c(2.9, 'padlock', {gain: -8, pan: -0.5, dist: 0.6}),
    c(2.25, 'breath_exert', {gain: -8, pan: 0.5}),
    c(2.6, 'steps_gravel', {gain: -4, pan: 0.6}),
    c(3.2, 'steps_gravel', {gain: -6, pan: 0.75}),
  ];
})();
void CIV; void noise; void keys;
