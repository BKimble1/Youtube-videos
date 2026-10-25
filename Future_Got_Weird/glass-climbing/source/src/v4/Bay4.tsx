// Glass Climbing V4: the climber and his gear, through any camera, in one fixed layer order (back to front):
//   sky and city (parallax, beyond the building's corner) -> pavement, facade, stool
//   -> FAR side: the far (upper) pad, its strap, the back strand of its loop, the far leg, the front strand and bar of
//      its loop over the far shoe
//   -> the NEAR strap and the back strand of its loop (in front of the far leg, behind the near leg)
//   -> the far arm, the body, the near leg, the front strand and bar of the near loop over the near shoe, the near arm
//   -> the near (lower) pad -> both hands closed round their bars (fingers in front of the bar, palm behind it).
// Every strap is drawn from its ring to its loop's top; every loop from its top to its bar; the bar is where the
// climber's arch stands (climb4.ts places them). Nothing here moves anything: it only draws the constrained state.
import React from 'react';
import {Man} from '../dc/Man';
import {Cam, Layer} from '../dc/camera';
import {add, fmt, V} from '../dc/math';
import {INK, Inked} from '../dc/ink';
import {Capsule} from '../dc/shade';
import {shade} from '../dc/color';
import {PadBar, PadBody, Ring, Strap, WEB} from '../art/Pad';
import {CM, KX, KY} from '../world/geo';
import {HERO} from '../world/pose';
import {ClimbState, loopApex} from './climb4';
import {STOOL4} from './set4';
import {City, Facade, Pavement, Sky, Stool} from '../v3/Scenery3';

/** a foot loop: two webbing strands from its top down either side of the foot to the bar under the arch (the bar
 *  crosses the foot, so it is seen nearly end-on: a short pill under the sole) */
const Loop: React.FC<{id: string; top: V; bar: V; k: number; part: 'back' | 'front'; far?: boolean}> = ({id, top, bar, k, part, far}) => {
  const col = far ? shade(WEB, 0.18) : WEB;
  const hb = 4.2 * CM;
  const end = (sgn: number): V => add(bar, {x: KX * hb * sgn, y: KY * hb * sgn});
  const w = 1.9 * CM;
  const strand = (to: V, c: string) => (
    <g>
      <path d={`M${fmt(top.x)},${fmt(top.y)} L${fmt(to.x)},${fmt(to.y)}`} fill="none" stroke={INK} strokeWidth={fmt(w + 2.4 * k)} strokeLinecap="round" />
      <path d={`M${fmt(top.x)},${fmt(top.y)} L${fmt(to.x)},${fmt(to.y)}`} fill="none" stroke={c} strokeWidth={fmt(w)} strokeLinecap="round" />
    </g>
  );
  if (part === 'back') return strand(end(-1), shade(col, 0.25));
  return (
    <g>
      {strand(end(1), col)}
      <Inked w={2.6 * k}>
        <Capsule id={`${id}-bar`} a={end(-1)} b={end(1)} ra={1.15 * CM} rb={1.15 * CM} color="#3A4248" spec={0.3} />
      </Inked>
    </g>
  );
};

export const BayWorld4: React.FC<{id: string; st: ClimbState; cam: Cam; k: number; nest?: React.ReactNode; over?: React.ReactNode; man?: boolean; gear?: boolean}> = ({id, st, cam, k, nest, over, man = true, gear = true}) => {
  const {pose, ringL, ringR, footL, footR, padL, padR} = st;
  const topL = loopApex(footL.bar), topR = loopApex(footR.bar);
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
        <Stool id={`${id}-stool`} k={k} stool={STOOL4} />
        {gear && (
        <>
        {/* far side */}
        <PadBody id={`${id}-pR`} s={padR} k={k} bar={false} contact={contactR} />
        <Ring c={ringR} k={k} />
        <Strap id={`${id}-sR`} a={ringR} b={topR} sag={st.sagR} k={k} far />
        <Loop id={`${id}-lRb`} top={topR} bar={footR.bar} k={k} part="back" far />
        {man && (
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
                <Loop id={`${id}-lRf`} top={topR} bar={footR.bar} k={k} part="front" far />
                <Strap id={`${id}-sL`} a={ringL} b={topL} sag={st.sagL} k={k} />
                <Loop id={`${id}-lLb`} top={topL} bar={footL.bar} k={k} part="back" />
              </>
            }
            afterNearLeg={<Loop id={`${id}-lLf`} top={topL} bar={footL.bar} k={k} part="front" />}
          />
        )}
        {!man && (
          <>
            <Loop id={`${id}-lRf`} top={topR} bar={footR.bar} k={k} part="front" far />
            <Strap id={`${id}-sL`} a={ringL} b={topL} sag={st.sagL} k={k} />
            <Loop id={`${id}-lLb`} top={topL} bar={footL.bar} k={k} part="back" />
            <Loop id={`${id}-lLf`} top={topL} bar={footL.bar} k={k} part="front" />
          </>
        )}
        {/* near side */}
        <PadBody id={`${id}-pL`} s={padL} k={k} bar={false} contact={contactL} />
        <Ring c={ringL} k={k} />
        {man ? (
          <>
            <Man id={`${id}-hr`} pose={pose} expr={st.expr} lHand={st.lHand} rHand={st.rHand} outfit={HERO} handsOnly handsOnlySide="R" holdR={{front: [0, 1, 2, 3], obj: <PadBar id={`${id}-bR`} s={padR} k={k} />}} />
            <Man id={`${id}-hl`} pose={pose} expr={st.expr} lHand={st.lHand} rHand={st.rHand} outfit={HERO} handsOnly handsOnlySide="L" holdL={{front: [0, 1, 2, 3], obj: <PadBar id={`${id}-bL`} s={padL} k={k} />}} />
          </>
        ) : (
          <>
            <PadBar id={`${id}-bR`} s={padR} k={k} />
            <PadBar id={`${id}-bL`} s={padL} k={k} />
          </>
        )}
        </>
        )}
        {nest}
      </Layer>
      {over}
    </>
  );
};
