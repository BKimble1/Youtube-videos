// B5 — up the exit stairs (M.BASS_OUT → M.ASSEMBLY). The bass drops out: a held breath. Smoky daylight falls into the
// stair well. The Director, already on the terrace, kneels at the top and reaches down; the teammate, pushed up from
// below by the carrier, reaches up — the hands meet and close, and the Director draws them up the last step. (The
// hand motif: the reach of A3 returned.)
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useShot} from '../../film/useShot';
import {M} from '../../film/timing';
import {look, dmg, CIV} from '../../film/crew';
import {Cast, ActorProps} from '../../rig/actor';
import {Cam, Frame, Grade, Layer} from '../../kit/cam';
import {clamp, lerp, noise, smooth} from '../../kit/math';
import {CITY} from '../../theme';
import {TerraceBack, TerraceFront, terraceClimb, TERRACE_TOP} from '../../sets/city';
import {Smoke} from '../../fx/smoke';
import {LightShaft} from '../../fx/light';
import {Embers} from '../../fx/fire';
import {BurningSky, ink as inkL, ease} from './kit';
import {at, Cue} from '../../film/cue';

const START = M.BASS_OUT;
const DUR = M.ASSEMBLY - START; // ≈ 2.66
const XS = 4640;

export const B5: React.FC = () => {
  const {t, T} = useShot('B5');
  const cam: Cam = {x: lerp(5130, 5160, smooth(t / DUR)), y: lerp(-890, -910, smooth(t / DUR)), z: lerp(1.5, 1.58, smooth(t / DUR))};
  const ik = inkL(cam);
  const meet = ease(t, 0.75, 1.15), pull = ease(t, 1.35, 2.4);
  // the teammate climbing (pelvis follows the stair), reaching up with the good hand
  const u = lerp(0.62, 0.86, smooth(clamp(t / 1.2))) + pull * 0.16;
  const f = terraceClimb(XS, u);
  const TMx = f.x - 40, TMy = f.y;
  const D_x = 5380, D_y = TERRACE_TOP;
  const grip = {x: lerp(5220, 5250, pull), y: lerp(TERRACE_TOP - 70, TERRACE_TOP - 200, pull)};
  const tmHand = meet < 1 ? {x: lerp(TMx + 120, grip.x, meet), y: lerp(TMy - 380, grip.y, meet)} : grip;
  const TM: ActorProps = {look: look('teammate'), t: T, seed: 3, x: TMx, y: TMy, s: 1, z: 0.2, dmg: dmg('teammate', T), breath: 1.2,
    yaw: 62, lean: 22 - pull * 10, drop: 10,
    head: {pitch: -26 + pull * 18, yaw: 8}, face: {mouth: pull > 0.5 ? 'pant' : 'pain', worry: 0.8, lids: 0.3, brows: 0.4, lookY: -0.7 + pull * 0.6, lookX: 0.4},
    armR: {hand: {x: tmHand.x, y: tmHand.y, z: 30}, pole: {x: 0, y: 1, z: 0.4}}, handR: meet > 0.9 ? 'fist' : 'open',
    armL: {fk: {fwd: 28, out: 6, bend: 115}},
    legL: {foot: {x: TMx - 70, y: TMy + 30}, pitch: 30}, legR: {foot: {x: TMx + 40, y: TMy - 10}}};
  // the carrier below her, a hand at her back, pushing up
  const cf = terraceClimb(XS, u - 0.32);
  const C: ActorProps = {look: look('carrier'), t: T, seed: 2, x: cf.x - 40, y: cf.y, s: 1, z: 0.1, dmg: dmg('carrier', T), breath: 1,
    yaw: 60, lean: 26, drop: 14, head: {pitch: -20}, face: {mouth: 'grit', brows: -0.5},
    armR: {hand: {x: TMx - 50, y: TMy - 230, z: 20}}, armL: {fk: {fwd: 30, out: 10, bend: 40}},
    legL: {foot: {x: cf.x - 100, y: cf.y + 40}}, legR: {foot: {x: cf.x + 20, y: cf.y - 10}}};
  // the Director kneeling at the top edge, reaching down, then drawing her up
  const D: ActorProps = {look: look('director'), t: T, seed: 4, x: D_x, y: D_y, s: 1, z: 0.4, dmg: dmg('director', T), breath: 0.9,
    yaw: -58, drop: lerp(96, 80, pull), lean: lerp(42, 20, pull),
    head: {pitch: lerp(30, 14, pull), yaw: -8}, face: {mouth: 'flat', brows: 0.1, worry: 0.5, lookY: 0.6, lookX: -0.5},
    legL: {foot: {x: D_x + 50, y: D_y - 10, z: -10}}, legR: {foot: {x: D_x - 70, y: D_y - 8, z: 14}, pitch: 30, pole: {x: -0.5, y: 0.3, z: 1}},
    armR: {hand: {x: lerp(5200, grip.x + 14, meet), y: lerp(TERRACE_TOP - 40, grip.y - 4, meet), z: 40}, pole: {x: 0, y: 1, z: 0.4}}, handR: 'fist',
    armL: {hand: {x: D_x + 30, y: D_y - 60, z: -20}}};
  // the last civilian already up, a step back
  const c0: ActorProps = {look: CIV[1], t: T, seed: 71, x: 5530, y: TERRACE_TOP - 26, s: 0.97, z: -0.2, yaw: -30, breath: 1, face: {mouth: 'flat', worry: 0.8, lookX: -0.6, lookY: 0.5}, head: {pitch: 18, yaw: -30},
    armL: {fk: {fwd: 10, out: 10, bend: 40}}, armR: {fk: {fwd: 10, out: 10, bend: 40}}};
  return (
    <AbsoluteFill>
      <Frame bg={CITY.skyTop}>
        <BurningSky id="b5sky" top="#3A2830" mid="#8A4A3A" low="#E0A070" glowY={300} glow={0.8} />
        <Smoke mode="cloud" x={960} y={260} w={2400} h={500} n={9} t={T} seed={95} color={CITY.smokeLight} opacity={0.55} drift={10} />
        <Layer cam={cam} p={1}>
          <TerraceBack ink={ik} />
          <rect x={XS} y={TERRACE_TOP} width={640} height={700} fill="#0E0A0C" />
          {Array.from({length: 9}, (_, i) => <line key={i} x1={XS + 40 + i * 64} y1={TERRACE_TOP + 520 - i * 58} x2={XS + 104 + i * 64} y2={TERRACE_TOP + 520 - i * 58} stroke="#3A3034" strokeWidth={ik * 1.5} />)}
          <Cast actors={[c0, C, TM, D].map((a) => ({...a, ink: ik}))} />
          <TerraceFront ink={ik} balustrade={false} />
          <LightShaft x={5100} y={-1700} angle={98} length={1300} w0={300} w1={900} color="#FFE7C2" opacity={0.22} t={T} dust={14} seed={3} />
        </Layer>
        <Embers x={0} y={0} w={1920} h={1080} t={T} seed={13} n={10} kind="ash" />
        <Grade vignette={0.5} id="b5vg" tint="#2A1A14" tintOp={0.08} />
      </Frame>
    </AbsoluteFill>
  );
};

export const CUES_B5: Cue[] = (() => {
  const c = at(START);
  return [
    c(0.1, 'step_grate', {gain: -14, pan: -0.2, rate: 0.8}),
    c(0.55, 'step_grate_b', {gain: -14, pan: -0.15, rate: 0.8}),
    c(0.3, 'breath_ragged', {gain: -12, pan: -0.1, dur: 2.2}),
    c(1.12, 'breath_exert', {gain: -14, pan: 0.0}),
  ];
})();
void noise;
