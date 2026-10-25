// Glass Climbing V3: the climber on the building, through any camera. Draw order (back to front): sky and city
// (parallax, seen beyond the building's corner) -> pavement, facade (glass, reflections, spandrels, mullions, brick
// plinth) -> stool -> the far (right) pad and its stirrup -> [far leg, far stirrup, near leg, near stirrup's back,
// body, arms] -> the near (left) pad -> the near strap and stirrup front -> the near hand closed round its bar.
import React from 'react';
import {Man} from '../dc/Man';
import {Cam, Layer} from '../dc/camera';
import {add, V} from '../dc/math';
import {PadBar, PadBody, Ring, Strap, Stirrup} from '../art/Pad';
import {CM} from '../world/geo';
import {HERO} from '../world/pose';
import {ClimbState} from './climb3';
import {STRAP3} from './set3';
import {City, Facade, Pavement, Sky, Stool} from './Scenery3';

const stirrupTop = (bar: V) => add(bar, {x: 0, y: -13 * CM});
const TOE: V = {x: -1, y: 0};

export const BayWorld3: React.FC<{id: string; st: ClimbState; cam: Cam; k: number; obl?: number; nest?: React.ReactNode; over?: React.ReactNode}> = ({id, st, cam, k, obl = 1, nest, over}) => {
  const {pose, ringL, ringR, footL, footR} = st;
  const padL = {...st.padL, obl}, padR = {...st.padR, obl};
  // a stirrup with no foot in it hangs straight down from its ring
  const farBar = footR.bar ?? add(ringR, {x: 10, y: STRAP3 * 0.99});
  const farTop = stirrupTop(farBar);
  const nearBar = footL.bar ?? add(ringL, {x: 14, y: STRAP3 * 0.99});
  const nearTop = stirrupTop(nearBar);
  const contactL = 1 - Math.min(1, padL.gap / 6);
  const contactR = 1 - Math.min(1, padR.gap / 6);
  const far = cam.z < 30;
  return (
    <>
      {far && (
        <>
          <Layer cam={cam} depth={6}>
            <Sky id={`${id}-sky`} />
          </Layer>
          <Layer cam={cam} depth={4}>
            <g transform="translate(900 -60)">
              <City id={`${id}-cf`} far />
            </g>
          </Layer>
          <Layer cam={cam} depth={2.6}>
            <g transform="translate(1250 -40)">
              <City id={`${id}-cn`} far={false} />
            </g>
          </Layer>
        </>
      )}
      <Layer cam={cam} depth={1}>
        <Pavement id={`${id}-pv`} k={k} />
        <Facade id={`${id}-fc`} k={k} />
        <Stool id={`${id}-stool`} k={k} />
        <PadBody id={`${id}-pR`} s={padR} k={k} contact={contactR} />
        <Ring c={ringR} k={k} />
        <Stirrup id={`${id}-stRb`} top={farTop} bar={farBar} dir={TOE} k={k} part="back" far />
        <Man
          id={`${id}-man`}
          pose={pose}
          expr={st.expr}
          blink={st.blink}
          hairSway={st.hairSway}
          lHand={st.lHand}
          rHand={st.rHand}
          outfit={HERO}
          afterFarLeg={
            <>
              <Strap id={`${id}-sR`} a={ringR} b={farTop} sag={st.sagR} k={k} far />
              <Stirrup id={`${id}-stRf`} top={farTop} bar={farBar} dir={TOE} k={k} part="front" far />
              <Stirrup id={`${id}-stLb`} top={nearTop} bar={nearBar} dir={TOE} k={k} part="back" />
            </>
          }
        />
        <PadBody id={`${id}-pL`} s={padL} k={k} bar={false} contact={contactL} />
        <Ring c={ringL} k={k} />
        <Strap id={`${id}-sL`} a={ringL} b={nearTop} sag={st.sagL} k={k} />
        <Stirrup id={`${id}-stLf`} top={nearTop} bar={nearBar} dir={TOE} k={k} part="front" />
        <Man id={`${id}-hl`} pose={pose} expr={st.expr} lHand={st.lHand} rHand={st.rHand} outfit={HERO} handsOnly handsOnlySide="L" holdL={{front: [0, 1, 2, 3], obj: <PadBar id={`${id}-bL`} s={padL} k={k} />}} />
        {nest}
      </Layer>
      {over}
    </>
  );
};
