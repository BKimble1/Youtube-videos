// Glass Climbing V2: the bay with the climber, through any camera (V1's scenes/BayScene.tsx, with the V2 set: brick
// knee wall, transoms, step stool; the climber's hair follow-through and blinks; the near stirrup hanging free while
// his left foot is on the stool). Draw order (back to front): hall (parallax) -> floor, far side, bricks, glass ->
// stool -> the far (right) pad and its stirrup -> [far leg, far stirrup, near leg, near stirrup's back, body, arms] ->
// the near (left) pad -> the near strap and stirrup front -> the near hand closed round its bar.
import React from 'react';
import {Man} from '../dc/Man';
import {Cam, Layer} from '../dc/camera';
import {add, V} from '../dc/math';
import {Floor, Hall} from '../art/Bay';
import {PadBar, PadBody, Ring, Strap, Stirrup} from '../art/Pad';
import {CM, STRAP_LEN} from '../world/geo';
import {HERO} from '../world/pose';
import {ClimbState} from './climb2';
import {Stool, WallFace} from './Set2';

const stirrupTop = (bar: V) => add(bar, {x: 0, y: -13 * CM});
const TOE: V = {x: -1, y: 0};

export const BayWorld2: React.FC<{id: string; st: ClimbState; cam: Cam; k: number; obl?: number; nest?: React.ReactNode; hall?: number}> = ({id, st, cam, k, obl = 1, nest, hall = 1}) => {
  const {pose, ringL, ringR, footL, footR} = st;
  const padL = {...st.padL, obl}, padR = {...st.padR, obl};
  const farBar = footR.bar ?? add(ringR, {x: 10, y: STRAP_LEN});
  const farTop = stirrupTop(farBar);
  // the near stirrup hangs from its ring when his foot is not in it (a little swing toward the wall as it settles)
  const nearBar = footL.bar ?? add(ringL, {x: 14, y: STRAP_LEN * 0.99});
  const nearTop = stirrupTop(nearBar);
  const contactL = 1 - Math.min(1, padL.gap / 6);
  const contactR = 1 - Math.min(1, padR.gap / 6);
  const farStirrup = (
    <g>
      <Strap id={`${id}-sR`} a={ringR} b={farTop} sag={st.sagR} k={k} far />
      <Stirrup id={`${id}-stRf`} top={farTop} bar={farBar} dir={TOE} k={k} part="front" far />
    </g>
  );
  const hallOp = hall * Math.min(1, Math.max(0, (60 - cam.z) / 30));
  return (
    <>
      {hallOp > 0.001 && (
        <Layer cam={cam} depth={2.4} opacity={hallOp}>
          {/* raised so its floor meets the world floor in the wide frame (frame 0) */}
          <g transform="translate(0 -86)">
            <Hall id={`${id}-hall`} />
          </g>
        </Layer>
      )}
      <Layer cam={cam} depth={1}>
        <Floor id={`${id}-fl`} k={k} />
        <WallFace id={`${id}-wf`} k={k} />
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
              {farStirrup}
              {footL.inStirrup && <Stirrup id={`${id}-stLb`} top={nearTop} bar={nearBar} dir={TOE} k={k} part="back" />}
            </>
          }
        />
        <PadBody id={`${id}-pL`} s={padL} k={k} bar={false} contact={contactL} />
        <Ring c={ringL} k={k} />
        <Strap id={`${id}-sL`} a={ringL} b={nearTop} sag={st.sagL} k={k} />
        {!footL.inStirrup && <Stirrup id={`${id}-stLb2`} top={nearTop} bar={nearBar} dir={TOE} k={k} part="back" />}
        <Stirrup id={`${id}-stLf`} top={nearTop} bar={nearBar} dir={TOE} k={k} part="front" />
        <Man id={`${id}-hl`} pose={pose} expr={st.expr} lHand={st.lHand} rHand={st.rHand} outfit={HERO} handsOnly handsOnlySide="L" holdL={{front: [0, 1, 2, 3], obj: <PadBar id={`${id}-bL`} s={padL} k={k} />}} />
        {nest}
      </Layer>
    </>
  );
};
