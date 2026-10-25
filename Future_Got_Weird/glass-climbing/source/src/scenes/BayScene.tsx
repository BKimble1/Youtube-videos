// The test bay: the glass wall, the climber and his pads, through any camera. Draw order (back to front):
// hall (parallax) -> floor, glass -> pad shadows on the glass -> the far (right) pad and its hanging stirrup ->
// [far leg, far stirrup and strap (hook), near leg, near stirrup's back (hook), body, arms] -> the near (left) pad ->
// the near strap and stirrup front -> the near hand closed round its bar (hands-only pass).
import React from 'react';
import {Man} from '../dc/Man';
import {Cam, Layer} from '../dc/camera';
import {add, len, norm, sub, V} from '../dc/math';
import {BeyondTint, Floor, GlassWall, Hall} from '../art/Bay';
import {PadBar, PadBody, Ring, Strap, Stirrup} from '../art/Pad';
import {ClimbState} from '../world/climb';
import {CM, PAD, padPt, prPad, STRAP_LEN} from '../world/geo';
import {HERO} from '../world/pose';

/** where the strap meets the stirrup loop: 13 cm above the bar, along the strap */
const stirrupTop = (ring: V, bar: V) => add(bar, {x: 0, y: -13 * CM});

const TOE: V = {x: -1, y: 0};

export const BayWorld: React.FC<{id: string; st: ClimbState; cam: Cam; k: number; showHall?: boolean; obl?: number; nest?: React.ReactNode}> = ({id, st, cam, k, showHall = true, obl = 1, nest}) => {
  const {pose, ringL, ringR, footL, footR} = st;
  // a close shot may open the plates further into three-quarter (the contact face, grip and ring do not move)
  const padL = {...st.padL, obl}, padR = {...st.padR, obl};
  // the far stirrup (hanging free before the right foot is in it)
  const farBar = footR.bar ?? add(ringR, {x: 10, y: STRAP_LEN});
  const farTop = stirrupTop(ringR, farBar);
  const nearBar = footL.bar ?? add(ringL, {x: 12, y: STRAP_LEN});
  const nearTop = stirrupTop(ringL, nearBar);
  const contactL = 1 - Math.min(1, padL.gap / 6);
  const contactR = 1 - Math.min(1, padR.gap / 6);
  const farStirrup = (
    <g>
      <Strap id={`${id}-sR`} a={ringR} b={farTop} sag={footR.inStirrup ? st.sagR : 0} k={k} far />
      <Stirrup id={`${id}-stRf`} top={farTop} bar={farBar} dir={TOE} k={k} part="front" far />
    </g>
  );
  return (
    <>
      {showHall && cam.z < 60 && (
        <Layer cam={cam} depth={2.4} opacity={Math.min(1, Math.max(0, (60 - cam.z) / 30))}>
          <Hall id={`${id}-hall`} />
        </Layer>
      )}
      <Layer cam={cam} depth={1}>
        <Floor id={`${id}-fl`} k={k} />
        <BeyondTint id={`${id}-bt`} />
        <GlassWall id={`${id}-gw`} k={k} />
        {/* the far pad (its bar is closed in the far hand, drawn by the body) */}
        <PadBody id={`${id}-pR`} s={padR} k={k} contact={contactR} />
        <Ring c={ringR} k={k} />
        {!footR.inStirrup && farStirrup}
        {footR.inStirrup && <Stirrup id={`${id}-stRb`} top={farTop} bar={farBar} dir={TOE} k={k} part="back" far />}
        <Man
          id={`${id}-man`}
          pose={pose}
          expr={st.expr}
          lHand={st.lHand}
          rHand={st.rHand}
          outfit={HERO}
          afterFarLeg={
            <>
              {footR.inStirrup && farStirrup}
              {footL.inStirrup && <Stirrup id={`${id}-stLb`} top={nearTop} bar={nearBar} dir={TOE} k={k} part="back" />}
            </>
          }
        />
        {/* the near pad, in front of the body */}
        <PadBody id={`${id}-pL`} s={padL} k={k} bar={false} contact={contactL} />
        <Ring c={ringL} k={k} />
        <Strap id={`${id}-sL`} a={ringL} b={nearTop} sag={st.sagL} k={k} />
        <Stirrup id={`${id}-stLf`} top={nearTop} bar={nearBar} dir={TOE} k={k} part="front" />
        <Man id={`${id}-hl`} pose={pose} expr={st.expr} lHand={st.lHand} rHand={st.rHand} outfit={HERO} handsOnly handsOnlySide="L" holdL={{front: [0, 1, 2, 3], obj: <PadBar id={`${id}-bL`} s={padL} k={k} />}} />
        {nest}
      </Layer>
    </>
  );
};
export {len, norm, sub, PAD};
