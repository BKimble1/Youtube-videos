// A1 — the opening image (0:00–0:03.2). Ground level, close: the overturned yellow taxi propped on rubble, the
// teammate pinned prone in the gap under its raised end, a puddle in the foreground holding the burning facades
// upside down. The near (bloodied) hand claws at the broken asphalt, drags the body an inch, and slips forward into
// the puddle — the reflected fire breaks up in rings. Readable in the first second: taxi, trapped person, fire.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useShot} from '../../film/useShot';
import {Actor} from '../../rig/actor';
import {Cam, Frame, Grade, Layer} from '../../kit/cam';
import {clamp, lerp, noise, smooth, easeIn, easeOut} from '../../kit/math';
import {CITY} from '../../theme';
import {Taxi, Rubble, Street, Facades, Puddle} from '../../sets/city';
import {Smoke} from '../../fx/smoke';
import {Embers, Fire} from '../../fx/fire';
import {Debris} from '../../fx/particles';
import {BurningSky, ink as inkL, ease, screenY, Place, inkAt} from './kit';
import {GROUND, PIN, TAXI, prone, FireReflection, taxiAt, SUPPORT} from './taxi';
import {at, Cue} from '../../film/cue';

const SLIP = 1.85; // the hand slips into the puddle

export const A1: React.FC = () => {
  const {t, T} = useShot('A1');
  const cam: Cam = {x: lerp(-545, -560, smooth(t / 3.2)), y: lerp(-104, -100, t / 3.2), z: lerp(1.55, 1.66, smooth(t / 3.2))};
  const horizon = screenY(cam, -100);
  const ik = inkL(cam);
  // the claw: reach out (0.7–1.4), grip and drag (1.4–1.8), slip (1.8–2.05), lie spent
  const reach = ease(t, 0.6, 1.35);
  const drag = ease(t, 1.35, 1.8);
  const slip = easeOut(clamp((t - SLIP) / 0.22));
  const P = {x: PIN.x - drag * 10 + slip * 4, y: PIN.y};
  const near0 = {x: P.x - 300, y: GROUND - 14};
  const near1 = {x: P.x - 395, y: GROUND - 18};
  const handNear = {x: lerp(lerp(near0.x, near1.x, reach), near1.x + 22, drag) - slip * 60, y: lerp(near1.y, GROUND + 14, slip) + Math.sin(Math.PI * reach) * -26};
  const handFar = {x: P.x - 330 + noise(t * 0.7, 3) * 6, y: GROUND - 22};
  const exhaust = ease(t, 2.0, 2.6);
  const tm = prone(T, {
    P, lift: lerp(16, 9, exhaust) + noise(t * 0.9, 5) * 1.5, head: lerp(58, 40, exhaust) + drag * 6,
    handL: handNear, handR: handFar, headYaw: -30, handLShape: drag > 0.2 && slip < 0.3 ? 'fist' : 'open',
    face: {mouth: drag > 0.2 && slip < 0.5 ? 'grit' : 'pain', lids: lerp(0.35, 0.6, exhaust), worry: 0.85, brows: drag > 0.2 ? -0.4 : 0.2, squint: drag * (1 - slip) * 0.8},
  });
  const settle = Math.max(0, Math.sin(Math.PI * clamp((t - 2.35) / 0.5))) * 1.2; // the wreck creaks and settles a hair
  const taxi = taxiAt({tilt: TAXI.tilt! + settle * 0.6, t: T});
  const sp = SUPPORT();
  return (
    <AbsoluteFill>
      <Frame bg={CITY.skyTop}>
        <BurningSky id="a1sky" glowY={600} glow={0.8} />
        {/* backdrop: the burning facades across the avenue (drawn small: distance) */}
        <Place wx={-900} wy={-140} sx={980 + (cam.x + 545) * 0.25} sy={horizon + 6} k={0.3}>
          <Facades x0={-4600} x1={3200} base={-140} t={T} ink={inkAt(0.3, 2.2)} seed={6} burn={0.45} />
        </Place>
        <Smoke mode="cloud" x={760} y={170} w={1700} h={360} n={8} t={T} seed={11} color={CITY.smoke} opacity={0.5} drift={18} />
        <Fire x={250} y={horizon + 4} w={120} h={150} t={T} seed={4} />
        <Layer cam={cam} p={1}>
          <Street x0={-2400} x1={1600} t={T} ink={ik} puddles={false} debris={1.2} seed={8} />
          <Rubble x={sp.x - 10} y={GROUND - 4} w={320} h={GROUND - sp.y + 10} ink={ik} seed={7} />
          <Taxi {...taxi} ink={ik} />
          <Puddle x={-930} y={GROUND + 52} rx={380} ry={56} t={T} t0={SLIP + 0.12} dx={handNear.x} dy={GROUND + 18} ink={ik} mirrorY={GROUND - 4} squash={0.12} dark={0.3}>
            <FireReflection t={T} x={-930} y={GROUND - 4} w={620} />
          </Puddle>
          <Actor {...tm} ink={ik} />
          {/* broken asphalt lip the fingers scrape */}
          <path d={`M ${P.x - 470} ${GROUND + 2} l 40 -14 l 30 10 l 46 -8 l 28 12`} fill="none" stroke="#1C1719" strokeWidth={ik * 1.2} strokeLinejoin="round" />
          <Debris x={handNear.x + 20} y={GROUND} t={T} t0={1.45} n={6} dir={-60} spread={60} speed={[120, 320]} size={[3, 7]} ground={GROUND + 8} material="asphalt" ink={ik * 0.5} />
          <Debris x={-560} y={-130} t={T} t0={2.45} n={8} dir={100} spread={40} speed={[60, 200]} size={[3, 8]} ground={GROUND + 4} material="glass" ink={ik * 0.5} />
        </Layer>
        <Layer cam={cam} p={1.25}>
          <Rubble x={-300} y={GROUND + 250} w={300} h={80} ink={inkL(cam, 1.25)} seed={12} />
        </Layer>
        <Embers x={0} y={0} w={1920} h={1080} t={T} seed={4} n={16} />
        <Grade vignette={0.5} id="a1vg" tint="#3A1810" tintOp={0.12} black={1 - clamp(t / 0.12)} />
      </Frame>
    </AbsoluteFill>
  );
};

export const CUES_A1: Cue[] = (() => {
  const c = at(0);
  return [
    c(0.05, 'breath_ragged', {gain: -2, pan: -0.15, dur: 3.3, fade: 0.25}),
    c(0.5, 'sub_boom', {gain: -10, pan: 0.6, dist: 0.9}),
    c(1.4, 'steps_gravel', {gain: -6, pan: -0.3, rate: 1.3}),
    c(SLIP + 0.1, 'hand_glass', {gain: -10, pan: -0.35, rate: 0.7}),
    c(2.35, 'cable_strain', {gain: -8, pan: 0.2, dist: 0.2}),
    c(2.4, 'glass_shatter', {gain: -18, pan: 0.0, dist: 0.3}),
  ];
})();
void easeIn;
