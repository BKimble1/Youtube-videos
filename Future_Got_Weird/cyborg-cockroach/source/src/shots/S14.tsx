// S14 (28.53-29.70 s) "you might actually": from her near side, on the same side of the walk line as S15 (so the insect
// keeps its screen direction into the payoff): her face in profile at the top, her near forearm and hand across the
// middle, the insect coming in from the right along the floor toward her fingers, a clear gap still between them. Her
// alarm softens into cautious recognition (she sees the backpack): a blink as the thought changes, a small breath out,
// the near hand opens and settles. Very slow eased push; captions in the top band. The gap blocks are left out (the
// camera stands where they are) and so is the slab over her legs (it would hang in front of her here).
import React from 'react';
import {lookAt} from '../lib/cam';
import {lerp3} from '../lib/v3';
import {sr} from '../lib/ease';
import {AlcoveScene, S13Co} from './S13';
import {ShotProps} from './index';
import {FPS} from '../timeline';
import {SHOT_FRAMES} from '../cuts';

const S14_FROM = SHOT_FRAMES.find((s) => s[0] === 'S14')![1] / FPS;
const S14_TO = SHOT_FRAMES.find((s) => s[0] === 'S15')![1] / FPS;
export const S14_CO: S13Co = {eye: [-40, 200, 600], tgt: [160, 180, 60], f: 820, cx: 700, cy: 1200};
export const s14Cam = (T: number, co: S13Co = S14_CO) => lookAt(lerp3(co.eye, lerp3(co.eye, co.tgt, 0.05), sr(T, S14_FROM, S14_TO)), co.tgt, co.f, co.cx ?? 540, co.cy);

/** her acting through S14, continuing S13's end state (alarm: recoil 1, recog 0, fingers in) and handing S15 the
 *  settled state (recog 1, recoil 0, hand open) */
export const s14Acting = (T: number) => {
  const soften = sr(T, S14_FROM + 0.12, S14_FROM + 0.85);
  const b0 = S14_FROM + 0.1;
  const ex = sr(T, S14_FROM + 0.35, S14_FROM + 0.75) - sr(T, S14_FROM + 0.8, S14_TO + 0.3);
  return {
    recog: soften,
    recoil: 1 - soften,
    handOpen: sr(T, S14_FROM + 0.4, S14_TO - 0.05),
    // the flinch carries on into a small pull-back of the near hand (it stays back: S15 finds it there, open)
    handSlide: sr(T, S14_FROM, S14_FROM + 0.4),
    slideU: 14,
    slideDir: 180,
    exhale: Math.max(0, ex),
    blink: T > b0 && T < b0 + 0.14 ? Math.sin(((T - b0) / 0.14) * Math.PI) : 0,
    look: 1,
  };
};

export const S14: React.FC<ShotProps & {co?: S13Co}> = ({f, co}) => {
  const T = f / FPS;
  return <AlcoveScene id="s14" T={T} cam={s14Cam(T, co)} A={s14Acting(T)} legslab={false} skip={['alc-gapL', 'alc-gapR']} motes />;
};
