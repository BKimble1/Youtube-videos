// E2 — The builder, able-bodied, walks calmly to the doors with their tool bag. The doors do not open; the sensor stays
// dark. A wave at it; nothing. An attendant glides over and, palm up, gently turns them back toward the interior, while
// outside, beyond the side glass, a warden patrol passes along the waterfront. The builder looks back at the Director,
// who sits on the bench in the foreground. Control, not emergency. (6.6 s)
import React from 'react';
import {useShot} from '../../film/useShot';
import {look, dmg} from '../../film/crew';
import {Cast, ActorProps, solve, handCenter} from '../../rig/actor';
import {walker} from '../../rig/poses';
import {WALK, stopDist} from '../../rig/gait';
import {Attendant, Warden, wardenWalker} from '../../mech';
import {Frame, Layer, Grade, camAt, inkFor, smoothCam, Cam} from '../../kit/cam';
import {lerp, seg, smooth, easeInOut, easeOut, clamp} from '../../kit/math';
import {Bench, benchTop} from '../../sets/refugeInterior';
import {Tint, seated} from './common';
import {EntryRoom, OUT} from './entrySet';
import {ToolBag} from '../AB/props';

const ID = 'E2';
export const E2_TIME = 1.85;

const E2: React.FC = () => {
  const {t, T} = useShot(ID);
  // ---- the builder: walks in from the right, stops before the doors, waits, waves, is turned back, looks at the Director
  const x0 = 1150;
  const D = stopDist(880, {...WALK, s: 1});
  const walkK = easeInOut(seg(t, 0.0, 2.5));
  const dist = D * walkK;
  const walking = walker(look('builder'), {x0, dist, dir: -1, ground: 60, gait: WALK}, {t, s: 1, seed: 41});
  const bx = x0 - dist;
  // after arriving: turn to face the doors (away), wave, then turned back toward the room and the Director
  const faceDoor = smooth(seg(t, 2.3, 2.9));
  const wave = seg(t, 3.0, 3.9);
  const turnBack = easeInOut(seg(t, 4.3, 5.4));
  const yaw = lerp(lerp(-90, -150, faceDoor), -20, turnBack);
  const foot = (sd: number) => {
    const L = sd < 0 ? walking.legL!.foot! : walking.legR!.foot!;
    return t < 2.5 ? L : {x: bx + sd * lerp(30, 32, turnBack), y: 60 - 9, z: 0};
  };
  const waveA = Math.sin(wave * Math.PI * 3) * (wave > 0 && wave < 1 ? 1 : 0);
  const builder: ActorProps = {
    ...walking,
    x: bx, yaw: t < 2.3 ? -90 : yaw, seed: 41,
    legL: {...walking.legL, foot: foot(-1)}, legR: {...walking.legR, foot: foot(1)},
    drop: t < 2.5 ? walking.drop : 0,
    // left hand: up to the sensor (wave) — the sensor panel is to the right of the doors
    armL: wave > 0 && wave < 1 ? {hand: {x: bx + 120 + waveA * 26, y: 60 - 330 + Math.abs(waveA) * 10, z: 30}} : turnBack > 0.3 ? {fk: {fwd: 6, out: 8, bend: 18}} : walking.armL,
    armR: {hand: {x: bx + lerp(-10, 14, turnBack), y: 60 - 190, z: 10}},
    handR: 'fist',
    head: {pitch: lerp(0, -6, faceDoor) + 6 * turnBack, yaw: lerp(0, 0, faceDoor) - 26 * smooth(seg(t, 5.4, 6.0))},
    face: {mouth: turnBack > 0.6 ? 'flat' : 'hmm', brows: -0.1 + 0.2 * turnBack, worry: 0.35 + 0.4 * turnBack, lids: 0.2, lookX: -0.8 * smooth(seg(t, 5.4, 6.0))},
    dmg: dmg('builder', T), breath: 0.3,
  };
  const bh = handCenter(solve(builder), 1);
  // ---- the attendant glides in from the left, palm up, and gently turns them
  const aK = easeOut(seg(t, 3.6, 4.6));
  const ax = lerp(-620, bx - 190, aK), ay = 40;
  const palm = smooth(seg(t, 4.0, 4.5)) * (1 - smooth(seg(t, 5.6, 6.2)));
  // ---- the Director on the bench, left foreground, from behind; turns their head a little when the builder looks
  const by = 210, bs = 1.08, seat = benchTop(by, bs);
  const dirP = seated(look('director'), -760, by, seat, {t, s: bs, yaw: 138, z: 400, seed: 32, knees: 70, spread: 40});
  const director: ActorProps = {...dirP, lean: 8, head: {yaw: 12 - 16 * smooth(seg(t, 5.5, 6.3)), pitch: 4}, dmg: dmg('director', T), breath: 0.4};
  // ---- a warden patrol passing outside along the glass (right to left)
  const pk = t * 230;
  const wardens = [0, 1].map((i) => wardenWalker(1700 + i * 380, pk, -1, OUT.ground + 40, {t, s: 0.62, seed: 30 + i, lock: 0, look: {x: 0.3, y: 0}}));
  const passers = <g>{wardens.map((w, i) => <Warden key={i} {...w} />)}</g>;
  const camF = (tt: number): Cam => {
    const k = easeInOut(clamp(tt / 6.6));
    return camAt(lerp(160, 110, k), lerp(-420, -390, k), 960, 540, lerp(0.9, 0.97, k));
  };
  const cam = smoothCam(camF, t, 0.25, 5);
  const ink = inkFor(cam.z, 1);
  return (
    <Frame bg="#EAD9B6">
      <Layer cam={cam} p={1}>
        <EntryRoom t={t} time={E2_TIME} ink={ink} open={0} shutter={1} lock={1} sensor="deny" passers={passers} />
        <Attendant x={ax} y={ay} s={0.98} t={t} seed={12} face={lerp(0.2, 0.7, aK)} ink={ink}
          handR={palm > 0.02 ? {x: lerp(ax + 110, bx - 60, palm), y: lerp(ay - 160, 60 - 250, palm)} : undefined} />
        <Cast actors={[builder]} />
        <ToolBag x={bh.x} y={bh.y + 6} s={0.9} ink={ink} swing={t < 2.5 ? Math.sin(t * 5.3) * 5 : 0} tablet={false} />
        <Bench x={-760} y={by} s={bs} w={560} ink={ink} />
        <Cast actors={[director]} />
      </Layer>
      <Tint time={E2_TIME} />
      <Grade vignette={0.36} id="vgE2" />
    </Frame>
  );
};
export default E2;
