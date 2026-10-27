// V5 hook, "and the lightning FOLLOWED it" (2.52-3.52): the connected bolt seen close, the camera rushing up the
// guided section with it (the bolt hugging the cyan line, the warm prepared air round it), instead of holding V3's
// opening view for 2.5 s. Cut in on the caption change (2.52); cut back out to V3's opening view on the restrike crack
// (3.52), where the re-strokes (3.52, 3.64, 3.83) flash on their sounds and B starts from it at 4.31.
import React from 'react';
import {sm5} from '../camera';
import {clamp} from '../dc/math';
import {add3, axis3, lookAt, mul3, norm3, v3} from '../v2/p3';
import {View3} from '../v3/view3';
import {openSt} from '../v3/states3';
import {tau3} from '../v3/timeline3';
import {ccFlicker, OpenFx, openFxK, PulseBloom} from '../v3/Open3_fx';

export const FOLLOW0 = 2.52, FOLLOW1 = 3.52;
/** the side the opening camera looks from (target to camera, unit), so the bolt keeps its up-right lean on screen */
const SIDE = norm3(v3(-64, -80, -91));
const followCam = (t: number) => {
  const u = clamp((t - FOLLOW0) / (FOLLOW1 - FOLLOW0));
  // the move starts already travelling (cut in on the move) and eases out toward the top of the guided section
  const k = 0.25 * u + 0.75 * sm5(u);
  const tgt = axis3(20 + 300 * k);
  const dist = 46 - 10 * k;
  return {...lookAt(add3(tgt, mul3(SIDE, dist)), add3(tgt, v3(0, 6, 0)), 1150), roll: -4};
};

export const Follow5: React.FC<{t: number}> = ({t}) => {
  const cam = followCam(t);
  const o = openSt(t);
  const st = {...o, core: o.core * ccFlicker(tau3(t))};
  return (
    <View3 cam={cam} st={st} t={t} tag="f5">
      <OpenFx cam={cam} t={t} id="f5fx" corona={st.tipCorona} />
      <PulseBloom cam={cam} pulses={st.pulses} k={0.4 * openFxK(tau3(t))} id="f5pb" />
    </View3>
  );
};
