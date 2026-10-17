// A5 — crane up and back (0:14.2–0:20.5). From the two figures limping east through the smoke past the slammed taxi,
// the camera rises through the smoke bank and, cresting it on the orchestra's entrance (M.REVEAL), reveals the
// geography in one frame: the devastated avenue, the raised terrace, the elevated highway heading east with its broken
// span and maintenance gantry, and beyond them on the waterfront the bright refuge with its teal aid symbol. The two
// figures stay small at the left. Caption "NEW YORK · 2041" lower left. HIT_A / HIT_B: distant flashes in the city.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useShot} from '../../film/useShot';
import {M} from '../../film/timing';
import {Cast} from '../../rig/actor';
import {Cam, Frame, Grade, Layer, smoothCam, mixCam} from '../../kit/cam';
import {clamp, lerp, smooth, keys} from '../../kit/math';
import {CITY} from '../../theme';
import {SkylineFar, Facades, Street, Taxi, Rubble, Bus, SubwayEntranceBack, SubwayEntranceFront, TerraceBack, TerraceFront, SmokeColumn, Streetlight} from '../../sets/city';
import {RecoveryArm, Drone} from '../../mech';
import {Smoke} from '../../fx/smoke';
import {Fire, Embers} from '../../fx/fire';
import {Glow} from '../../fx/light';
import {BurningSky, District, Caption, ink as inkL, ease, DroneFormation} from './kit';
import {supportedWalk} from './props';
import {GROUND, taxiAt} from './taxi';
import {ARM_X} from './A2';
import {at, Cue} from '../../film/cue';

const START = 14.2;
const REV = M.REVEAL - START;   // ≈ 2.8
const HA = M.HIT_A - START, HB = M.HIT_B - START;
const KEYS: [number, Cam][] = [
  [0, {x: 620, y: -330, z: 0.62}],
  [1.4, {x: 1500, y: -720, z: 0.33}],
  [REV + 0.2, {x: 10000, y: -1990, z: 0.094}], // the refuge is whole in the right third by REVEAL + 0.4
  [6.3, {x: 10150, y: -2070, z: 0.092}],
];
const camAt = (t: number): Cam => {
  if (t <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 1; i < KEYS.length; i++) if (t <= KEYS[i][0]) {
    const u = (t - KEYS[i - 1][0]) / (KEYS[i][0] - KEYS[i - 1][0]);
    return mixCam(KEYS[i - 1][1], KEYS[i][1], i === KEYS.length - 1 ? 1 - Math.pow(1 - u, 2.2) : u);
  }
  return KEYS[KEYS.length - 1][1];
};

export const A5: React.FC = () => {
  const {t, T} = useShot('A5');
  const cam = smoothCam(camAt, t, 0.55, 13);
  const ik = inkL(cam);
  const pair = supportedWalk(T, 330, 40 + t * 62, GROUND - 20, 1);
  const crest = ease(t, REV - 1.1, REV + 0.5); // the smoke bank drops out of the frame as the camera rises through it
  const flashA = Math.max(0, 1 - Math.abs(t - HA - 0.06) / 0.35), flashB = Math.max(0, 1 - Math.abs(t - HB - 0.06) / 0.3);
  return (
    <AbsoluteFill>
      <Frame bg={CITY.skyTop}>
        <BurningSky id="a5sky" glowY={lerp(700, 760, crest)} glow={0.7} />
        <g transform={`translate(${-(cam.x - 620) * 0.012} ${lerp(260, 0, crest)})`}>
          <SkylineFar x0={-300} x1={2300} base={760} h={0.9} t={T} ink={2} seed={5} sky={false} />
        </g>
        <Glow x={300} y={620} r={260} color={CITY.fireHot} opacity={0.6 * flashA} id="a5fa" />
        <Glow x={620} y={660} r={180} color={CITY.fireHot} opacity={0.5 * flashB} id="a5fb" />
        <Layer cam={cam} p={1}>
          <rect x={-9000} y={1500} width={36000} height={4000} fill="#2A2427" />
          <Glow x={17400} y={-700} r={3600} color="#FFE2A8" opacity={0.45 * crest} id="a5ref" />
          <Glow x={16500} y={-600} r={1300} color="#FFF1CF" opacity={0.5 * crest} id="a5ref2" />
          <Glow x={17500} y={-900} r={2200} color="#FFD58A" opacity={0.5 * crest} id="a5ref3" />
          <District t={T} k={cam.z} x0={-4600} refugeGlow={0.6 + 0.4 * crest} symbolPx={lerp(0, 20, crest)} seed={3} />
          {[[-1800, 2600, 900, 3], [1700, 3000, 1100, 8], [3900, 3400, 1200, 13], [6200, 3800, 1300, 17], [8600, 3000, 1000, 21]].map(([x, h, w, sd]) => (
            <SmokeColumn key={sd} x={x} y={-1200} h={h} w={w} t={T} seed={sd} op={0.75} drift={0.25} />
          ))}
          <TerraceBack ink={ik} />
          <TerraceFront ink={ik} />
          <SubwayEntranceBack x={1000} t={T} open={0} ink={ik} />
          <SubwayEntranceFront x={1000} ink={ik} />
          <Streetlight x={2050} t={T} lit={0} ink={ik} bent={10} />
          <Bus x={3560} y={GROUND + 200} dir={-1} tilt={-3} ink={ik} t={T} burn={0.6} />
          <Taxi {...taxiAt({tilt: -1.2, t: T})} ink={ik} />
          <Rubble x={-260} y={GROUND} w={260} h={50} ink={ik} seed={7} />
          <RecoveryArm x={ARM_X} y={GROUND + 10} dir={-1} s={1} t={T} target={{x: 340, y: -760}} clawAng={90} open={0.7} lock={0.25} ink={ik} />
          <Fire x={-1700} y={-90} w={220} h={260} t={T} seed={6} />
          <Fire x={3300} y={GROUND + 200} w={300} h={360} t={T} seed={9} />
          <Cast actors={pair.map((a) => ({...a, ink: ik}))} />
          <Drone x={1500} y={-1400} s={1.6} t={T} seed={8} ink={ik} face={-0.6} look={{x: -0.4, y: 0.6}} />
          <DroneFormation x={7600} y={-2700} t={t} s={2.2} n={5} dx={300} seed={9} drift={0} ink={ik} />
        </Layer>
        {/* the smoke bank the camera rises through */}
        <g transform={`translate(0 ${lerp(0, 1100, crest)})`} opacity={1 - crest * 0.4}>
          <Smoke mode="cloud" x={960} y={420} w={2600} h={620} n={11} t={T} seed={51} color={CITY.smoke} opacity={0.85} drift={30} />
          <Smoke mode="cloud" x={700} y={180} w={2200} h={420} n={8} t={T} seed={52} color={CITY.smokeLight} opacity={0.4} drift={-20} />
        </g>
        <Embers x={0} y={0} w={1920} h={1080} t={T} seed={8} n={18} />
        <Grade vignette={0.42} id="a5vg" tint="#3A1810" tintOp={0.06} />
        <Caption text="NEW YORK · 2041" t={T} t0={17.3} t1={20.0} />
      </Frame>
    </AbsoluteFill>
  );
};

export const CUES_A5: Cue[] = (() => {
  const c = at(START);
  return [
    c(0.2, 'steps_gravel', {gain: -10, pan: -0.5, dist: 0.3}),
    c(1.0, 'breath_ragged', {gain: -10, pan: -0.4, dist: 0.3, dur: 2.0}),
    c(HA, 'sub_boom', {gain: -8, pan: -0.6, dist: 0.9}),
    c(HB, 'sub_boom', {gain: -12, pan: -0.3, dist: 0.95, rate: 1.1}),
    c(3.2, 'drone_rotor', {gain: -10, pan: 0.4, dist: 0.8, dur: 3.0, fade: 0.8}),
  ];
})();
void keys; void clamp; void smooth;
