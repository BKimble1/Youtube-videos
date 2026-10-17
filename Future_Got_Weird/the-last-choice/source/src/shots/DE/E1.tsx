// E1 — The entry doors slide closed; beyond them the heavy outer shutter lowers and locks (the small lamp over the
// doors turns amber); a patrol drone passes outside the side glass. The civilians, in blankets with water, watch it
// close. It looks protective. (4.8 s; the song plays through the radio's small speaker.)
import React from 'react';
import {useShot} from '../../film/useShot';
import {CIV} from '../../film/crew';
import {Cast, ActorProps} from '../../rig/actor';
import {Drone, Attendant} from '../../mech';
import {Frame, Layer, Grade, camAt, inkFor, smoothCam, Cam} from '../../kit/cam';
import {lerp, seg, smooth, easeInOut, clamp} from '../../kit/math';
import {Bench, benchTop} from '../../sets/refugeInterior';
import {Tint, Blanket, Cup, seated} from './common';
import {EntryRoom, OUT} from './entrySet';

const ID = 'E1';
export const E1_TIME = 1.7;

const E1: React.FC = () => {
  const {t} = useShot(ID);
  const open = 1 - easeInOut(seg(t, 0.3, 1.5));
  const shutter = easeInOut(seg(t, 1.5, 3.4));
  const lock = smooth(seg(t, 3.45, 3.6));
  // the patrol drone passes outside, right to left, beyond the side glass and the door
  const dk = seg(t, 0.6, 4.6);
  const drone = <Drone x={lerp(2300, -900, dk)} y={OUT.ground - 640 + Math.sin(t * 1.4) * 8} s={0.8} t={t} seed={21} face={-0.6} tilt={-5} lightOn={1} />;
  // civilians on the bench, left foreground (blankets, water)
  const by = 170, bs = 1.02, seat = benchTop(by, bs);
  const watch = smooth(seg(t, 0.2, 1.0));
  const man = seated(CIV[1], -820, by, seat, {t, s: bs, yaw: 40, z: 300, seed: 51, knees: 70, spread: 40});
  const woman = seated(CIV[0], -610, by, seat, {t, s: bs * 1.02, yaw: 30, z: 300, seed: 50, knees: 70, spread: 36});
  const civs: ActorProps[] = [
    {...man, lean: 10, head: {yaw: -6, pitch: 4}, armR: {hand: {x: -790, y: seat - 120, z: 360}}, propR: <Cup s={bs} ink={4} />, handR: 'fist',
      face: {mouth: 'flat', lids: 0.4, worry: 0.3, lookX: 0.6 * watch}, breath: 0.4},
    {...woman, lean: 6, head: {yaw: -10 + 6 * watch, pitch: 0}, armL: {hand: {x: -600, y: seat - 110, z: 350}},
      face: {mouth: watch > 0.5 ? 'soft' : 'flat', lids: 0.3, worry: 0.25, lookX: 0.7 * watch}, breath: 0.4},
    {look: CIV[2], t, x: -430, y: 120, s: 0.98 * (CIV[2].height ?? 1), yaw: 30, z: 200, seed: 52, armR: {hand: {x: -400, y: 120 - 250, z: 60}}, propR: <Cup s={0.95} ink={4} />, handR: 'fist',
      head: {yaw: -10, pitch: 2}, face: {mouth: 'flat', lids: 0.25, lookX: 0.7 * watch}, breath: 0.4},
  ];
  const camF = (tt: number): Cam => {
    const k = easeInOut(clamp(tt / 4.8));
    return camAt(lerp(120, 90, k), lerp(-420, -400, k), 960, 540, lerp(0.92, 0.98, k));
  };
  const cam = smoothCam(camF, t, 0.25, 5);
  const ink = inkFor(cam.z, 1);
  return (
    <Frame bg="#EAD9B6">
      <Layer cam={cam} p={1}>
        <EntryRoom t={t} time={E1_TIME} ink={ink} open={open} shutter={shutter} lock={lock} sensor={lock > 0.5 ? 'off' : 'idle'} passers={drone} />
        {/* an attendant by the doors, still and calm, facing the room */}
        <Attendant x={-420} y={-30} s={0.95} t={t} seed={12} face={0.2} ink={ink} />
        <Bench x={-700} y={by} s={bs} w={560} ink={ink} />
        <Cast actors={civs} />
        <Blanket x={-820} y={by - (290 - (man.drop ?? 0)) * bs} s={bs * 0.92} k={1} ink={ink} />
        <Blanket x={-610} y={by - (290 - (woman.drop ?? 0)) * bs * 1.02} s={bs * 0.94} k={1} ink={ink} />
      </Layer>
      <Tint time={E1_TIME} />
      <Grade vignette={0.36} id="vgE1" />
    </Frame>
  );
};
export default E1;
