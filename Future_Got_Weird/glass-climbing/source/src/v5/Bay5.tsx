// Glass Climbing V5: the climber, his gear and the tower through any camera, in one fixed layer order (back to front):
//   sky and city (parallax, beyond the tower's corner) -> the facade -> the street (in front of the facade's foot)
//   -> FAR side: the far (upper) pad, its strap, the back strand of its loop, the far leg, the front strand and bar of
//      its loop -> the near strap and the back strand of its loop -> the far arm, the body, the near leg, the front
//      strand and bar of the near loop -> the near arm -> the near pad -> both hands closed round their bars.
// The pads are Pad3D (the same assembly as every close-up) in the facade's oblique projection.
import React from 'react';
import {Man} from '../dc/Man';
import {Cam, Layer} from '../dc/camera';
import {add, fmt, V} from '../dc/math';
import {INK, Inked} from '../dc/ink';
import {Capsule} from '../dc/shade';
import {shade} from '../dc/color';
import {Strap, WEB} from '../art/Pad';
import {CM, KX, KY} from '../world/geo';
import {HERO} from '../world/pose';
import {City, Sky} from '../v3/Scenery3';
import {allTiles, P3D, Pad3D} from './Pad3D';
import {ClimbState, loopApex, MM, Pad5, padPt5, travelOf} from './climb5';
import {Facade5, Street5} from './Scenery5';

/** a foot loop: two webbing strands from its top down either side of the shoe to the bar under the arch */
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

/** a tile-contact pattern: even on glass; on brick only a few tiles find a peak */
const BRICK_TILES = [0.15, 0, 0, 0.6, 0, 0.1, 0, 0, 0, 0, 0.8, 0, 0.3, 0, 0, 0, 0, 0, 0, 0.5, 0, 0.1, 0, 0];
export const contactTiles = (p: Pad5) => (p.surface === 'brick' ? BRICK_TILES.map((c) => Math.min(1, c * p.contact / 0.22)) : allTiles(p.contact));

/** a pad in the facade's projection */
export const PadOnFacade: React.FC<{id: string; s: Pad5; z: number; k: number}> = ({id, s, z, k}) => (
  <g transform={`translate(${fmt(KX * s.zo)} ${fmt(s.y + KY * s.zo)}) scale(${MM})`}>
    <Pad3D id={id} z={z * MM} k={k} st={{yaw: 0, pitch: 0, obl: {kx: KX, ky: KY}, load: s.load, contact: contactTiles(s), cover: 1, gap: s.gap / MM, tilt: s.tilt, slide: 0, surface: 'none', hand: null, bar: false, strap: 0}} />
  </g>
);
/** the grip bar alone (drawn between the fingers in the hands pass) */
export const PadBar5: React.FC<{id: string; s: Pad5; k: number}> = ({id, s, k}) => {
  const t = travelOf(s.load);
  const a = padPt5(s, {u: P3D.U_BACK + P3D.POST, v: -P3D.BAR_H + t, w: 0}), b = padPt5(s, {u: P3D.U_BACK + P3D.POST, v: P3D.BAR_H + t, w: 0});
  return (
    <Inked w={3 * k}>
      <Capsule id={id} a={a} b={b} ra={P3D.BAR_R * MM} rb={P3D.BAR_R * MM} color="#2C3338" spec={0.35} />
    </Inked>
  );
};

export const BayWorld5: React.FC<{id: string; st: ClimbState; cam: Cam; k: number; f: number; nest?: React.ReactNode; over?: React.ReactNode; man?: boolean; gear?: boolean; detail?: number}> = ({id, st, cam, k, f, nest, over, man = true, gear = true, detail = 1}) => {
  const {pose, ringL, ringR, footL, footR, padL, padR} = st;
  const topL = loopApex(footL.bar), topR = loopApex(footR.bar);
  const far = cam.z < 30;
  return (
    <>
      {far && (
        <>
          <Layer cam={cam} depth={6}>
            <Sky id={`${id}-sky`} />
          </Layer>
          <Layer cam={cam} depth={4}>
            <g transform="translate(5200 -60)">
              <City id={`${id}-cf`} far />
            </g>
          </Layer>
          <Layer cam={cam} depth={2.6}>
            <g transform="translate(6400 -40)">
              <City id={`${id}-cn`} far={false} />
            </g>
          </Layer>
        </>
      )}
      <Layer cam={cam} depth={1}>
        <Facade5 id={`${id}-fc`} k={k} detail={detail} />
        {cam.z < 0.6 && <Street5 id={`${id}-st`} k={k} f={f} />}
        {gear && (
          <>
            {/* far side */}
            <PadOnFacade id={`${id}-pR`} s={padR} z={cam.z} k={k} />
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
            {/* near side */}
            <PadOnFacade id={`${id}-pL`} s={padL} z={cam.z} k={k} />
            {man && (
              <>
                <Man id={`${id}-hr`} pose={pose} expr={st.expr} lHand={st.lHand} rHand={st.rHand} outfit={HERO} handsOnly handsOnlySide="R" holdR={{front: [0, 1, 2, 3], obj: <PadBar5 id={`${id}-bR`} s={padR} k={k} />}} />
                <Man id={`${id}-hl`} pose={pose} expr={st.expr} lHand={st.lHand} rHand={st.rHand} outfit={HERO} handsOnly handsOnlySide="L" holdL={{front: [0, 1, 2, 3], obj: <PadBar5 id={`${id}-bL`} s={padL} k={k} />}} />
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
export {INK};
