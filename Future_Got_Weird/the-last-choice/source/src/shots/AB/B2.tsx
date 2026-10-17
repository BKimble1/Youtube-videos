// B2 — the subway entrance (cut on M.HIT_SUBWAY). Green globe lamps; the security grille bursts up on the hit, shoved
// from below. The builder climbs out with the tool bag (the battered tablet clipped to it), steps clear of the
// railing, checks both ways and beckons the Director: there is a way under the avenue.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useShot} from '../../film/useShot';
import {look, dmg} from '../../film/crew';
import {Cast, ActorProps} from '../../rig/actor';
import {Cam, Frame, Grade, Layer, shake} from '../../kit/cam';
import {clamp, lerp, noise, smooth, backOut, keys} from '../../kit/math';
import {CITY} from '../../theme';
import {Street, Facades, SubwayEntranceBack, SubwayEntranceFront, subwayClimb, grillePoints, ENTRANCE_W, Streetlight, Rubble} from '../../sets/city';
import {Smoke, Dust} from '../../fx/smoke';
import {Embers, Fire} from '../../fx/fire';
import {Debris} from '../../fx/particles';
import {walker} from '../../rig/poses';
import {WALK} from '../../rig/gait';
import {BurningSky, ink as inkL, ease} from './kit';
import {ToolBag, handOf} from './props';
import {at, Cue} from '../../film/cue';
import {M} from '../../film/timing';

const START = M.HIT_SUBWAY;
const SX = 0; // entrance x

export const B2: React.FC = () => {
  const {t, T} = useShot('B2');
  const hitK = Math.max(0, 1 - t / 0.22);
  const cam0: Cam = {x: lerp(430, 520, smooth(t / 3.6)), y: lerp(-430, -420, t / 3.6), z: lerp(0.9, 0.94, smooth(t / 3.6))};
  const cam = shake(cam0, t, 10 * hitK + 0.4, 5);
  const ik = inkL(cam);
  // the grille: shoved open on the hit with an overshoot, settles back against its stop
  const open = clamp(backOut(clamp((t + 0.02) / 0.24), 2.2)) * 0.98 + Math.max(0, Math.sin(Math.PI * clamp((t - 0.24) / 0.3))) * -0.05;
  const gp = grillePoints(SX, open);
  // the builder: up the stairs (u), out past the railing end, checks both ways, beckons
  const u = keys(t, [[0, 0.42], [0.25, 0.5], [1.5, 1]]);
  const out = ease(t, 1.5, 2.15);
  const climb = subwayClimb(SX, u);
  const look1 = ease(t, 2.0, 2.3) * (1 - ease(t, 2.45, 2.7)), look2 = ease(t, 2.5, 2.75) * (1 - ease(t, 2.95, 3.1));
  const beck = ease(t, 2.95, 3.15);
  let B: ActorProps;
  const base = {look: look('builder'), t: T, seed: 6, s: 1, z: 0.2, dmg: dmg('builder', T), breath: 0.8};
  if (t < 1.5) {
    const push = 1 - ease(t, 0.3, 0.7);
    const f1 = subwayClimb(SX, u + 0.03), f0 = subwayClimb(SX, u - 0.07);
    const stepPh = (u * 9) % 1;
    B = {...base, x: climb.x, y: climb.y, yaw: 70, lean: 12 + push * 6, drop: 6,
      head: {pitch: lerp(-30, 0, 1 - push), yaw: 10},
      face: {mouth: push > 0.5 ? 'grit' : 'flat', brows: -0.4},
      legL: {foot: {x: f0.x, y: f0.y - 10 - Math.sin(Math.PI * stepPh) * 20}}, legR: {foot: {x: f1.x, y: f1.y - 10}},
      armR: push > 0.05 ? {hand: {x: lerp(climb.x + 60, gp.mid.x, push), y: lerp(climb.y - 330, gp.mid.y + 20, push), z: 20}} : {fk: {fwd: 20, out: 10, bend: 40}},
      armL: {fk: {fwd: 4, out: 14, bend: 12}}, handL: 'fist'};
  } else {
    const x0 = subwayClimb(SX, 1).x;
    const w = walker(look('builder'), {x0, dist: out * 260, dir: 1, ground: -100, gait: WALK}, {...base});
    B = {...w, yaw: lerp(90, 40, ease(t, 2.0, 2.3)),
      head: {yaw: look1 * 70 - look2 * 50 + beck * 30, pitch: 2},
      face: {mouth: beck > 0.3 ? 'flat' : 'hmm', brows: -0.2 + beck * 0.3, lookX: -look1 * 0.5 + look2 * 0.5},
      armR: beck > 0.02 ? {hand: {x: w.x + 110 + Math.sin((t - 2.95) * 14) * 30 * beck, y: -100 - 330 - Math.sin((t - 2.95) * 14) * 20 * beck, z: 60}, pole: {x: 0, y: 1, z: 0.3}} : w.armR,
      armL: {fk: {fwd: 3, out: 13, bend: 10}}, handL: 'fist'};
  }
  const bag = handOf(B, 0);
  return (
    <AbsoluteFill>
      <Frame bg={CITY.skyTop}>
        <BurningSky id="b2sky" glowY={600} glow={0.6} />
        <Layer cam={cam} p={0.96}>
          <Facades x0={-2600} x1={3600} base={-140} t={T} ink={inkL(cam, 0.96)} seed={16} burn={0.3} />
        </Layer>
        <Layer cam={cam} p={1}>
          <Smoke mode="cloud" x={400} y={-1300} w={3400} h={500} n={8} t={T} seed={81} color={CITY.smoke} opacity={0.5} drift={22} />
          <Street x0={-2600} x1={3600} t={T} ink={ik} debris={1} seed={15} />
          <Streetlight x={-480} t={T} lit={0} ink={ik} bent={6} />
          <SubwayEntranceBack x={SX} t={T} open={open} ink={ik} lit={0.8} />
          <Cast actors={[{...B, ink: ik}]} extra={[{z: 200 + 30, el: <ToolBag x={bag.x} y={bag.y - 4} s={0.95} ink={ik} swing={noise(t * 1.3, 4) * 6} />}]} />
          <SubwayEntranceFront x={SX} ink={ik} />
          <Fire x={1450} y={-110} w={200} h={240} t={T} seed={17} />
          <Rubble x={1250} y={150} w={300} h={90} ink={ik} seed={18} />
          <Dust x={gp.tip.x} y={-120} t={T} t0={0.02} size={110} n={10} life={1.4} opacity={0.6} seed={8} />
          <Debris x={gp.mid.x} y={gp.mid.y} t={T} t0={0.0} n={10} dir={-90} spread={80} speed={[200, 600]} size={[4, 10]} ground={-90} material="concrete" ink={ik * 0.6} />
        </Layer>
        <Embers x={0} y={0} w={1920} h={1080} t={T} seed={11} n={14} />
        <Grade vignette={0.45} id="b2vg" tint="#3A1810" tintOp={0.08} flash={hitK > 0.9 ? 0.05 : 0} />
      </Frame>
    </AbsoluteFill>
  );
};

export const CUES_B2: Cue[] = (() => {
  const c = at(START);
  return [
    c(0.0, 'shutter_slam', {gain: 2, pan: -0.1}),
    c(0.02, 'gate_roll', {gain: -6, pan: -0.1, rate: 1.4}),
    c(0.05, 'breath_exert', {gain: -8, pan: -0.15}),
    c(0.6, 'step_grate', {gain: -10, pan: 0.0}),
    c(1.0, 'step_grate_b', {gain: -10, pan: 0.05}),
    c(1.6, 'steps_gravel', {gain: -10, pan: 0.15}),
  ];
})();
void ENTRANCE_W;
