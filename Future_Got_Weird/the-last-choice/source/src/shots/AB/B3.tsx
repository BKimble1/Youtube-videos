// B3 — the visor through the smoke (0:27.4–0:32.0). Same spot as B1, closer. From the left, through drifting smoke, a
// silhouette with a visor: the friend steps into the firelight, kneels by the teammate, lifts the teammate's good arm
// over their shoulders and cinches the slipping satchel strap tight on M.HIT_STRAP (the radio clinks against the bag).
// A small nod, a tap of the visor brim. The teammate manages a smile. At the corner the Director watches: recognition.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useShot} from '../../film/useShot';
import {M} from '../../film/timing';
import {look, dmg, visorOn} from '../../film/crew';
import {Cast, ActorProps} from '../../rig/actor';
import {Cam, Frame, Grade, Layer} from '../../kit/cam';
import {clamp, lerp, noise, smooth} from '../../kit/math';
import {CITY} from '../../theme';
import {Bus, Street, Rubble, blobD} from '../../sets/city';
import {Smoke} from '../../fx/smoke';
import {Embers, Fire} from '../../fx/fire';
import {Glow} from '../../fx/light';
import {walker} from '../../rig/poses';
import {WALK} from '../../rig/gait';
import {BurningSky, ink as inkL, ease} from './kit';
import {at, Cue} from '../../film/cue';

const START = 27.4;
const STRAP = M.HIT_STRAP - START; // ≈ 3.1

export const B3: React.FC = () => {
  const {t, T} = useShot('B3');
  const cam: Cam = {x: lerp(-40, -10, smooth(t / 4.6)), y: lerp(-260, -250, t / 4.6), z: lerp(1.02, 1.08, smooth(t / 4.6))};
  const ik = inkL(cam);
  const G = 60, tx = 120;
  // ---------------- the friend: walks in (silhouette → lit), kneels, arm over the shoulders, cinches, nod, brim tap
  const kneel = ease(t, 1.25, 1.75);
  const lit = ease(t, 0.55, 1.35);
  const fx = -40;
  const walkD = Math.min(1.25, t) * 330;
  const lift = ease(t, 1.8, 2.5);
  const reach = ease(t, 2.45, 2.85), tug = Math.max(0, Math.sin(Math.PI * clamp((t - STRAP + 0.12) / 0.3)));
  const nod = Math.max(0, Math.sin(Math.PI * clamp((t - 3.35) / 0.4)));
  const tap = ease(t, 3.65, 3.85) * (1 - ease(t, 4.05, 4.3));
  const fBase = {look: look('friend'), t: T, seed: 5, s: 1, z: 0.3, dmg: dmg('friend', T), visor: visorOn(T), breath: 0.7};
  let F: ActorProps;
  if (t < 1.25) {
    const w = walker(look('friend'), {x0: fx - 410, dist: walkD, dir: 1, ground: G + 26, gait: WALK}, {...fBase});
    F = {...w, yaw: 80, head: {pitch: 6, yaw: 10}, face: {mouth: 'flat', brows: -0.3}};
  } else {
    const kx = fx - 410 + 1.25 * 330;
    F = {...fBase, x: kx, y: G + 26, yaw: lerp(80, 58, kneel), drop: lerp(0, 92, kneel), lean: lerp(4, 12, kneel) + nod * 4,
      legL: {foot: {x: kx + lerp(40, 70, kneel), y: G + 16, z: -10}}, legR: {foot: {x: kx - lerp(30, 80, kneel), y: G + 16 - kneel * 0, z: 14}, pole: {x: 0.2, y: 0.2, z: 1}, pitch: kneel * 40},
      head: {pitch: 4 + nod * 16 - tap * 4, yaw: lerp(10, 22, kneel) + tap * 6},
      face: {mouth: t > 3.3 ? 'soft' : reach > 0.2 ? 'flat' : 'hmm', brows: t > 3.3 ? 0.1 : -0.2, lookX: 0.6},
      armL: {hand: {x: kx + 40 + lift * 20, y: lerp(-40, -190, lift) + G, z: -40}, pole: {x: 0, y: 1, z: -0.4}},
      armR: tap > 0.02 ? {hand: {x: kx + lerp(70, 62, tap), y: lerp(G - 200, G - 286, tap), z: 60}, pole: {x: 0.3, y: 1, z: 0.5}}
        : {hand: {x: lerp(kx + 60, tx - 8 - tug * 10, reach), y: lerp(G - 200, G - 128 - tug * 6, reach), z: 50}, pole: {x: 0, y: 1, z: 0.6}},
      handR: reach > 0.5 && tap < 0.1 ? 'fist' : 'mitt'};
  }
  // ---------------- the teammate sitting against the bus (as B1); the good arm lifted over the friend's shoulders
  const fSh = {x: (F.x as number) + 18, y: G + 26 - (165 - (F.drop ?? 0) + 127)};
  const smile = ease(t, 3.8, 4.25);
  const TM: ActorProps = {look: look('teammate'), t: T, seed: 3, x: tx, y: G + 10, s: 1, z: 0.1, dmg: dmg('teammate', T), breath: 1.1,
    yaw: 22, drop: 122 - lift * 14, lean: -12 + lift * 8, side: lift * -6,
    head: {pitch: -6 + noise(t * 0.7, 9) * 3, roll: 9 - lift * 6, yaw: lerp(10, -30, ease(t, 0.9, 1.4)) + smile * 4},
    face: {mouth: smile > 0.4 ? 'smile' : tug > 0.3 ? 'pain' : 'pant', worry: lerp(0.9, 0.3, smile), lids: lerp(0.5, 0.25, smile), brows: 0.3 - smile * 0.2, lookX: -0.6},
    legL: {foot: {x: tx + 190, y: G + 2, z: -10}, pole: {x: 0, y: -1, z: 0}},
    legR: {foot: {x: tx + 120, y: G + 2, z: 16}, pole: {x: 0.2, y: -1, z: 0.5}},
    armL: {fk: {fwd: 28, out: 6, bend: 115}},
    armR: lift > 0.02 ? {hand: {x: lerp(tx + 70, fSh.x, lift), y: lerp(G + 4, fSh.y, lift), z: lerp(40, 20, lift)}, pole: {x: -0.3, y: -1, z: 0.4}} : {hand: {x: tx + 70, y: G + 4, z: 40}},
    zArm: [undefined, 150], zHand: [undefined, 250]};
  // ---------------- the Director at the corner, watching; a nod of recognition
  const dNod = Math.max(0, Math.sin(Math.PI * clamp((t - 3.5) / 0.45)));
  const D: ActorProps = {look: look('director'), t: T, seed: 4, x: 600, y: G, s: 1, z: 0.4, dmg: dmg('director', T), breath: 0.7,
    yaw: lerp(30, -40, ease(t, 0.6, 1.2)), drop: 74, lean: 10,
    head: {yaw: -20, pitch: 6 + dNod * 14}, face: {mouth: 'flat', brows: -0.2, lookX: -0.5},
    legL: {foot: {x: 540, y: G - 10, z: -12}}, legR: {foot: {x: 670, y: G - 10, z: 14}},
    armL: {hand: {x: 668, y: -140, z: -30}}, handL: 'open', armR: {fk: {fwd: 6, out: 8, bend: 12}}};
  const sil = lit < 1 ? {...F, silhouette: '#221A1D'} : null;
  return (
    <AbsoluteFill>
      <Frame bg={CITY.skyTop}>
        <BurningSky id="b3sky" glowY={600} glow={0.6} />
        <Layer cam={cam} p={1}>
          <Street x0={-2400} x1={2600} t={T} ink={ik} debris={1} seed={14} puddles={false} />
          <Bus x={-830} y={G - 20} dir={1} tilt={0} ink={ik} t={T} burn={0.9} broken={0.9} seed={5} />
          {[[-1900, -560, 260], [-1450, -650, 300], [-900, -600, 220], [-300, -690, 200], [200, -540, 160], [-1200, -260, 180], [380, -300, 120]].map(([bx, by, r], i) => (
            <path key={i} d={blobD(r, 40 + i, 10, 0.5, 1.5, 0.7)} transform={`translate(${bx} ${by + G - 20})`} fill="#2A2224" opacity={0.55} />
          ))}
          <Fire x={-640} y={G + 40} w={230} h={260} t={T} seed={19} />
          <Glow x={-640} y={G - 80} r={620} color={CITY.fire} opacity={0.32} t={T} flicker={0.3} seed={3} id="b3fl" />
          <Rubble x={980} y={G + 30} w={240} h={70} ink={ik} seed={9} />
          <Cast actors={[TM, D, F].map((a) => ({...a, ink: ik}))} />
          {sil && <g opacity={1 - lit}><Cast actors={[{...sil, ink: ik}]} /></g>}
          <Smoke mode="cloud" x={lerp(-820, -980, t / 4.6)} y={-200} w={700} h={700} n={7} t={T} seed={91} color={CITY.smoke} opacity={0.75 * (1 - lit * 0.6)} drift={-26} />
        </Layer>
        <Embers x={0} y={0} w={1920} h={1080} t={T} seed={12} n={16} />
        <Grade vignette={0.5} id="b3vg" tint="#3A1810" tintOp={0.08} />
      </Frame>
    </AbsoluteFill>
  );
};

export const CUES_B3: Cue[] = (() => {
  const c = at(START);
  return [
    c(0.2, 'steps_gravel', {gain: -8, pan: -0.6}),
    c(0.75, 'steps_gravel', {gain: -8, pan: -0.45}),
    c(1.4, 'body_fall', {gain: -16, pan: -0.25}),
    c(1.9, 'breath_exert', {gain: -10, pan: -0.1}),
    c(STRAP, 'padlock', {gain: -6, pan: -0.05, rate: 1.25}),
    c(STRAP + 0.03, 'radio_on', {gain: -18, pan: -0.05, rate: 1.6}),
  ];
})();
