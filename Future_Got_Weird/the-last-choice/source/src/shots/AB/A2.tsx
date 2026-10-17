// A2 — medium-wide, side on (0:03.2–0:06.4). An autonomous recovery arm (tracked base, crane, claw) clamps the
// overturned taxi's chassis and starts shifting it: the wreck grinds, lifts and swings above the pinned teammate;
// glass rains from the broken windows. Above, a surveillance drone turns its sensor toward the movement and its iris
// tightens (still cyan: observing, not committing). The machine is clearing a road, indifferent to the person under it.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useShot} from '../../film/useShot';
import {Actor} from '../../rig/actor';
import {Cam, Frame, Grade, Layer, shake} from '../../kit/cam';
import {clamp, lerp, noise, smooth, easeOut} from '../../kit/math';
import {CITY} from '../../theme';
import {Taxi, Rubble, Street, Facades, taxiPoints, taxiPoint} from '../../sets/city';
import {RecoveryArm, Drone} from '../../mech';
import {Smoke} from '../../fx/smoke';
import {Embers, Fire} from '../../fx/fire';
import {GlassShards, Debris} from '../../fx/particles';
import {BurningSky, ink as inkL, ease} from './kit';
import {GROUND, PIN, TAXI, prone, taxiAt, SUPPORT} from './taxi';
import {at, Cue} from '../../film/cue';

const START = 3.2;
export const CLAMP_T = 0.62; // the claw closes on the chassis
export const ARM_X = 1330;
/** Taxi state under the recovery arm, as a function of A2-local time (A3 continues from the end values). */
export const liftState = (tl: number) => {
  const up = ease(tl, CLAMP_T + 0.3, 2.6);
  const swing = Math.sin((tl - CLAMP_T) * 3.1) * ease(tl, CLAMP_T + 0.4, 1.4) * 2.2;
  return {lift: up * 92, tilt: TAXI.tilt! + swing * (1 - 0.3 * up), shiftX: up * 30};
};

export const A2: React.FC = () => {
  const {t, T} = useShot('A2');
  const jolt = Math.max(0, 1 - Math.abs(t - CLAMP_T - 0.04) / 0.18);
  const cam0: Cam = {x: lerp(190, 230, smooth(t / 3.2)), y: lerp(-690, -705, smooth(t / 3.2)), z: lerp(0.5, 0.515, t / 3.2)};
  const cam = shake(cam0, t, 3 * jolt + 0.6, 4);
  const ik = inkL(cam);
  const st = liftState(t);
  const taxi = taxiAt({...st, t: T});
  const tp = taxiPoints(taxi);
  const chassis = taxiPoint(taxi, 300, -72);
  void tp;
  // the claw descends onto the chassis, closes, then follows it
  const desc = easeOut(clamp(t / CLAMP_T));
  const target = {x: chassis.x + 20, y: chassis.y - lerp(260, 8, desc)};
  const open = lerp(0.85, 0.08, ease(t, CLAMP_T - 0.15, CLAMP_T + 0.05));
  // the teammate under the raised end: flinches as glass rains, looks up at the shifting wreck
  const flinch = ease(t, 1.15, 1.45) * (1 - ease(t, 2.2, 2.8));
  const tm = prone(T, {
    P: {x: PIN.x - 12, y: PIN.y}, lift: lerp(9, 18, ease(t, 0.6, 1.1)) - flinch * 6, head: lerp(40, 70, ease(t, 0.6, 1.1)) - flinch * 20,
    handL: {x: PIN.x - 470, y: GROUND + 10}, handR: {x: PIN.x - 350, y: GROUND - 20}, headYaw: lerp(-30, -10, flinch),
    face: {mouth: flinch > 0.3 ? 'grit' : 'o', open: 0.4, lids: lerp(0.2, 0.7, flinch), worry: 1, brows: 0.6, lookY: -0.8},
  });
  // the drone turns toward the movement (0.8 → 1.5) and the iris tightens
  const turn = ease(t, 0.75, 1.5);
  const sp = SUPPORT();
  return (
    <AbsoluteFill>
      <Frame bg={CITY.skyTop}>
        <BurningSky id="a2sky" glowY={560} glow={0.7} />
        <Layer cam={cam} p={0.92}>
          <Facades x0={-3600} x1={4000} base={-140} t={T} ink={inkL(cam, 0.92)} seed={6} burn={0.35} />
        </Layer>
        <Layer cam={cam} p={1}>
          <Smoke mode="cloud" x={-300} y={-1300} w={3000} h={600} n={8} t={T} seed={21} color={CITY.smoke} opacity={0.5} drift={22} />
          <Street x0={-2600} x1={3200} t={T} ink={ik} puddles={false} debris={1.1} seed={8} />
          <Fire x={-1700} y={-90} w={220} h={260} t={T} seed={6} />
          <Rubble x={sp.x - 10} y={GROUND - 4} w={320} h={GROUND - sp.y + 10} ink={ik} seed={7} />
          <Taxi {...taxi} ink={ik} />
          <Actor {...tm} ink={ik} />
          <RecoveryArm x={ARM_X} y={GROUND + 10} dir={-1} s={1} t={T} target={target} clawAng={90} open={open} lock={0.25} strain={ease(t, CLAMP_T, CLAMP_T + 0.3) * 0.8} ink={ik} />
          <GlassShards x={-520} y={-170} t={T} t0={1.05} n={16} dir={95} spread={50} speed={[80, 300]} size={[6, 16]} ground={GROUND + 6} ink={ik * 0.6} />
          <GlassShards x={-330} y={-200} t={T} t0={1.6} n={10} dir={90} spread={40} speed={[60, 260]} size={[5, 12]} ground={GROUND + 6} ink={ik * 0.6} seed={4} />
          <Debris x={chassis.x} y={chassis.y} t={T} t0={CLAMP_T} n={8} dir={-90} spread={120} speed={[150, 420]} size={[4, 10]} ground={GROUND} material="metal" ink={ik * 0.6} />
          <Drone x={-1000 + turn * 40} y={-1280 + noise(t, 3) * 12} s={2.4} t={T} seed={5} ink={ik} face={lerp(0.85, -0.25, turn)} tilt={lerp(6, -4, turn)}
            look={{x: lerp(0.6, 0.35, turn), y: lerp(0.1, 0.85, turn)}} lock={lerp(0, 0.38, ease(t, 1.3, 1.6))} glow={lerp(0.4, 1, ease(t, 1.3, 1.6))} />
        </Layer>
        <Embers x={0} y={0} w={1920} h={1080} t={T} seed={5} n={14} />
        <Grade vignette={0.45} id="a2vg" tint="#3A1810" tintOp={0.1} />
      </Frame>
    </AbsoluteFill>
  );
};

export const CUES_A2: Cue[] = (() => {
  const c = at(START);
  return [
    c(0.0, 'servo_heavy', {gain: -2, pan: 0.45, dist: 0.2}),
    c(CLAMP_T, 'lever_clunk', {gain: 0, pan: 0.1, dist: 0.15}),
    c(CLAMP_T + 0.05, 'hydraulic', {gain: -2, pan: 0.35, dist: 0.2}),
    c(CLAMP_T + 0.35, 'metal_tear', {gain: -6, pan: 0.0, dist: 0.2}),
    c(1.05, 'glass_shatter', {gain: -10, pan: -0.25, dist: 0.2}),
    c(0.2, 'drone_rotor', {gain: -2, pan: -0.5, dist: 0.4, dur: 3.2, fade: 0.4}),
    c(1.32, 'sensor_lock', {gain: -6, pan: -0.5, dist: 0.4}),
    c(1.35, 'breath_exert', {gain: -10, pan: -0.25}),
  ];
})();
