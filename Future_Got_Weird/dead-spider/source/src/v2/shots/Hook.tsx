// HOOK (0 - 4.52): "If you stuck a needle into a DEAD spider... you could make its legs MOVE again."
// Frame 0: a big, sharp, curled dead wolf spider on a white specimen pad, the needle of a hand-held 1 mL syringe just
// above the middle of its front body section. The needle touches the carapace at 0.20 s and goes in; the thumb pushes
// the stopper down the barrel (the air shows as a pale slug running down); the hand lifts the spider clear of the pad
// and all eight legs spring open by ~1 s, overshooting and settling. On "you could make its legs" the air is let back
// out and the legs sag closed; on "MOVE" a second push snaps them open again. The camera holds still and only drifts.
import React from 'react';
import {BenchTop, FlatShadow, LabWallFar, Pad} from '../../apparatus';
import {Item} from '../../draw3';
import {ss5} from '../../lib';
import {LOOK_A, spiderItems} from '../../SpiderDraw';
import {lerpOrbit, Orbit, orbitCam} from '../../three';
import {Scene} from '../../shots/common';
import {hubTopOf, needle1Items, syringe1Items} from '../claw';
import {entryOf, H_NEEDLE, H_PLUNGER, hookPose, PAD_Z} from '../world2';

const O0: Orbit = {target: [-1.4, 0, 4.6], az: -22, el: 50, d: 120, f: 5400, cy: 1050};
const O1: Orbit = {...O0, az: -14, el: 47, d: 118, target: [-1.4, 0, 6.6]};
const O2: Orbit = {...O0, az: -8, el: 44, d: 116, target: [-1.4, 0, 7.6]};
export const camHook = (t: number) => orbitCam(lerpOrbit(lerpOrbit(O0, O1, ss5(t, 1.0, 2.6)), O2, ss5(t, 2.6, 4.6)));

export const Hook: React.FC<{t: number}> = ({t}) => {
  const cam = camHook(t);
  const P = hookPose(t);
  const entry = entryOf(P);
  const tipAbove = H_NEEDLE(t);
  const hub = hubTopOf(entry, tipAbove);
  const press = H_PLUNGER(t);
  const pulse = (t - 0.33) / 0.42;
  const pulse2 = (t - 3.36) / 0.3;
  return (
    <Scene
      id={`H${Math.round(t * 30)}`}
      cam={cam}
      back={(B) => (
        <>
          <LabWallFar B={B} id="Hw" wallY={1350} blur={12} />
          <BenchTop B={B} z={0} back={900} />
        </>
      )}
      floor={(B) => (
        <>
          <Pad B={B} c={[0, 0, PAD_Z]} half={30} th={PAD_Z} />
          <FlatShadow B={B} c={[P.pos[0] - 1.6, P.pos[1] + 0.8, PAD_Z]} rx={5.5 + 4.5 * Math.min(1, P.e[0])} ry={4.4 + 3.6 * Math.min(1, P.e[0])} alpha={0.34 - 0.12 * Math.min(1, (P.pos[2] - 3.5) / 6)} yaw={P.yaw} />
        </>
      )}
      items={(B) => {
        const it: Item[] = [];
        it.push(...spiderItems(B, P, LOOK_A, {id: 'sh'}));
        it.push(...needle1Items(B, entry, tipAbove, 0));
        it.push(...syringe1Items(B, hub, press, {air: Math.max(0, Math.min(1, (press - 0.62) / 0.2)), pulse: pulse > 0 && pulse < 1.2 ? pulse : pulse2 > 0 && pulse2 < 1.2 ? pulse2 : undefined, needleTip: entry}));
        return it;
      }}
    />
  );
};
