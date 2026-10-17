// B1 — behind the wrecked bus (0:20.5–0:23.78). The Director has propped the teammate against the burned bus and
// creeps to its corner to look east: past it, the avenue is full of the system's order — a patrol of wardens walking in
// step, a drone formation sweeping, and far off the broken span. The Director pulls back behind the corner, looks at
// the teammate's wounds, jaw set. The route is impossible.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useShot} from '../../film/useShot';
import {M} from '../../film/timing';
import {look, dmg} from '../../film/crew';
import {Cast, ActorProps} from '../../rig/actor';
import {Cam, Frame, Grade, Layer} from '../../kit/cam';
import {clamp, lerp, noise, smooth} from '../../kit/math';
import {CITY} from '../../theme';
import {Bus, Street, Rubble, blobD} from '../../sets/city';
import {Warden, wardenWalker} from '../../mech';
import {Smoke} from '../../fx/smoke';
import {Embers, Fire} from '../../fx/fire';
import {BurningSky, District, DroneFormation, Place, SmokeBank, ink as inkL, ease, inkAt} from './kit';
import {SkylineFar} from '../../sets/city';
import {at, Cue} from '../../film/cue';

const START = 20.5;
const DUR = M.HIT_SUBWAY - START;

export const B1: React.FC = () => {
  const {t, T} = useShot('B1');
  const cam: Cam = {x: lerp(300, 330, smooth(t / DUR)), y: -360, z: lerp(0.76, 0.79, smooth(t / DUR))};
  const ik = inkL(cam);
  const G = 60;
  // the Director at the corner: peeking (0–1.6), pulls back, looks at the teammate (2.0+)
  const peek = 1 - ease(t, 1.45, 1.85);
  const turn = ease(t, 1.75, 2.25);
  const dx = 600 + peek * 40;
  const D: ActorProps = {look: look('director'), t: T, seed: 4, x: dx, y: G, s: 1, z: 0.4, dmg: dmg('director', T), breath: 0.8,
    yaw: lerp(80, 30, turn), drop: lerp(62, 78, turn), lean: lerp(22, 10, turn) + peek * 6,
    head: {yaw: lerp(noise(t * 0.8, 3) * 8, -70, turn) + turn * 0, pitch: lerp(-2, 14, turn)},
    face: {mouth: turn > 0.5 ? 'grit' : 'flat', brows: lerp(-0.3, -0.5, turn), worry: turn * 0.4, lids: 0.15 + turn * 0.1, lookX: peek * 0.6 - turn * 0.4, lookY: turn * 0.4},
    legL: {foot: {x: dx - 60, y: G - 10, z: -12}}, legR: {foot: {x: dx + 70, y: G - 10, z: 14}, pole: {x: 1, y: -0.2, z: 0.3}},
    armL: {hand: {x: 676 + peek * 10, y: -330 + turn * 120, z: -30}, pole: {x: 0, y: 1, z: -0.5}},
    armR: {fk: {fwd: 20 + turn * 20, out: 10, bend: 50 + turn * 30}}};
  // the teammate sitting against the bus side, left leg out straight, left arm held to the chest
  const tx = 120;
  const TM: ActorProps = {look: look('teammate'), t: T, seed: 3, x: tx, y: G + 10, s: 1, z: 0.1, dmg: dmg('teammate', T), breath: 1.2,
    yaw: 22, drop: 122, lean: -12,
    head: {pitch: -6 + noise(t * 0.7, 9) * 3, roll: 9, yaw: lerp(10, 26, turn)},
    face: {mouth: 'pant', worry: 0.9, lids: 0.5, brows: 0.3, lookX: turn * 0.4},
    legL: {foot: {x: tx + 190, y: G + 2, z: -10}, pole: {x: 0, y: -1, z: 0}},
    legR: {foot: {x: tx + 120, y: G + 2, z: 16}, pole: {x: 0.2, y: -1, z: 0.5}},
    armL: {fk: {fwd: 28, out: 6, bend: 115}},
    armR: {hand: {x: tx + 70, y: G + 4, z: 40}}};
  // beyond the corner: the patrol walking in step (screen space), drones, the far span
  const patrol: React.ReactElement[] = [];
  for (let i = 0; i < 4; i++) {
    const w = wardenWalker(2000 + i * 150, 40 + t * 90, -1, 850 + (i % 2) * 26, {t: T, s: 0.42, seed: 80 + i, ink: 2, look: {x: Math.sin(t * 1.2) * 0.7, y: 0.1}, glow: 0.6});
    patrol.push(<Warden key={i} {...w} />);
  }
  return (
    <AbsoluteFill>
      <Frame bg={CITY.skyTop}>
        <BurningSky id="b1sky" glowY={620} glow={0.6} />
        <SkylineFar x0={-300} x1={2300} base={760} h={0.85} t={T} ink={2} seed={5} sky={false} />
        <Place wx={11200} wy={-1600} sx={1700} sy={560} k={0.06}>
          <District t={T} k={0.06} facades={false} street={false} refugeGlow={0.8} symbolPx={10} seed={4} />
        </Place>
        <SmokeBank x={1600} y={700} w={900} h={160} t={T} seed={71} opacity={0.7} drift={16} />
        <rect x={1100} y={780} width={900} height={320} fill={CITY.asphalt} />
        {patrol}
        <DroneFormation x={1640} y={300} t={t} s={0.5} n={5} dx={170} seed={12} drift={-30} look={{x: -0.4, y: 0.6}} />
        <Layer cam={cam} p={1}>
          <Street x0={-2400} x1={2600} t={T} ink={ik} debris={1} seed={14} puddles={false} />
          <Bus x={-830} y={G - 20} dir={1} tilt={0} ink={ik} t={T} burn={0.9} broken={0.9} seed={5} />
          {/* soot, scorch and dents on the burned bus */}
          {[[-1900, -560, 260], [-1450, -650, 300], [-900, -600, 220], [-300, -690, 200], [200, -540, 160], [-1200, -260, 180], [380, -300, 120]].map(([bx, by, r], i) => (
            <path key={i} d={blobD(r, 40 + i, 10, 0.5, 1.5, 0.7)} transform={`translate(${bx} ${by + G - 20})`} fill="#2A2224" opacity={0.55} />
          ))}
          <path d={`M ${-150} ${G - 470} q 60 30 140 -10 M ${420} ${G - 600} l 60 90 l -30 60 M ${480} ${G - 510} l 70 -20`} fill="none" stroke="#1A1416" strokeWidth={ik} opacity={0.8} />
          <Fire x={-1400} y={G - 520} w={260} h={300} t={T} seed={13} />
          <Rubble x={980} y={G + 30} w={240} h={70} ink={ik} seed={9} />
          <Cast actors={[TM, D].map((a) => ({...a, ink: ik}))} />
        </Layer>
        <Smoke mode="cloud" x={300} y={900} w={1000} h={300} n={6} t={T} seed={72} color={CITY.smoke} opacity={0.4} drift={20} />
        <Embers x={0} y={0} w={1920} h={1080} t={T} seed={10} n={14} />
        <Grade vignette={0.48} id="b1vg" tint="#3A1810" tintOp={0.08} />
      </Frame>
    </AbsoluteFill>
  );
};

export const CUES_B1: Cue[] = (() => {
  const c = at(START);
  return [
    c(0.0, 'drone_rotor', {gain: -6, pan: 0.6, dist: 0.6, dur: 3.3, fade: 0.5}),
    c(0.3, 'robot_step_heavy', {gain: -10, pan: 0.8, dist: 0.7}),
    c(0.9, 'robot_step_heavy', {gain: -10, pan: 0.8, dist: 0.7}),
    c(1.5, 'robot_step_heavy', {gain: -10, pan: 0.8, dist: 0.7}),
    c(1.6, 'breath_exert', {gain: -12, pan: 0.2}),
    c(0.1, 'breath_ragged', {gain: -10, pan: -0.2, dur: 3.1}),
  ];
})();
void inkAt; void clamp;
