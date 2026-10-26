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
import {lit, shade} from '../dc/color';
import {Capsule} from '../dc/shade';
import {WEB} from '../art/Pad';
import {CM, KX, KY} from '../world/geo';
import {HERO} from '../world/pose';
import {City, Sky} from '../v3/Scenery3';
import {allTiles, P3D, PH, PW, Pad3D} from '../v6/Pad6';
import {ClimbState, loopApex, MM, Pad5, padPt5, travelOf} from './climb8';
import {Facade5, Street5} from './Scenery8';

/** (V8) a stirrup: a rigid step under the sole, seen along its length in profile (the shoe visibly stands on it), and
 *  two webbing strands from the strap's end over the forefoot down either side of the shoe to the middle of the step
 *  (the near strand in front of the shoe, the far one behind) */
const Loop: React.FC<{id: string; top: V; bar: V; k: number; part: 'back' | 'front'; far?: boolean}> = ({id, top, bar, k, part, far}) => {
  const col = far ? shade(WEB, 0.18) : WEB;
  const w = 1.9 * CM;
  const mid: V = {x: bar.x - 6, y: bar.y - 5};
  const strand = (to: V, c: string) => (
    <g>
      <path d={`M${fmt(top.x)},${fmt(top.y)} L${fmt(to.x)},${fmt(to.y)}`} fill="none" stroke={INK} strokeWidth={fmt(w + 2.4 * k)} strokeLinecap="round" />
      <path d={`M${fmt(top.x)},${fmt(top.y)} L${fmt(to.x)},${fmt(to.y)}`} fill="none" stroke={c} strokeWidth={fmt(w)} strokeLinecap="round" />
    </g>
  );
  if (part === 'back') return strand(add(mid, {x: 6, y: 0}), shade(col, 0.25));
  // the step: a slab under the sole from the ball of the foot to the heel, its top edge lit
  const x0 = bar.x - 58, x1 = bar.x + 40, y0 = bar.y - 8, th = 10;
  const stepCol = far ? '#2E353A' : '#3A4248';
  return (
    <g>
      <rect x={fmt(x0)} y={fmt(y0)} width={fmt(x1 - x0)} height={fmt(th)} rx={fmt(th * 0.45)} fill={stepCol} stroke={INK} strokeWidth={fmt(2.2 * k)} />
      <path d={`M${fmt(x0 + 5)},${fmt(y0 + 2)} L${fmt(x1 - 5)},${fmt(y0 + 2)}`} stroke="#8C979E" strokeWidth={fmt(1.6)} strokeLinecap="round" opacity={0.8} />
      {strand(mid, col)}
      {/* the strand's stitched end on the step */}
      <circle cx={fmt(mid.x)} cy={fmt(mid.y + 3)} r={fmt(2.6)} fill="#C7D0D6" stroke={INK} strokeWidth={fmt(1.2 * k)} />
    </g>
  );
};

/** (V8 QA) the webbing strap from its ring to its loop: straight when taut; when slack (`sag`: how much shorter the
 *  span is than the strap, x0.45) it bows out sideways, away from the glass, and a little down. (The shared V5 strap
 *  sagged along its own line, which on a near-vertical strap only shortened it: it read as an elastic cord.) */
const Strap8: React.FC<{id: string; a: V; b: V; sag: number; k: number; far?: boolean}> = ({a, b, sag, k, far}) => {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
  // the side normal: the near strap bows out from the glass (+x), the far one the other way, so the two never bow
  // into each other (or behind the near pad's ring)
  let nx = -dy / l, ny = dx / l;
  if ((nx < 0) !== !!far) [nx, ny] = [-nx, -ny];
  // the slack length (sag is 0.45x the shortfall) taken up in the bow: a quadratic bowing by d is longer than its
  // chord by about 8d^2/3L; it shows half of that (webbing also folds and twists), so a slack strap reads as slack
  const slack = sag / 0.45;
  const bow = slack > 0.01 ? Math.min(2 * 0.5 * Math.sqrt((3 * slack * l) / 8), far ? 70 : 110) : 0; // (capped: the far strap stays off the pier)
  const c = {x: (a.x + b.x) / 2 + nx * bow, y: (a.y + b.y) / 2 + ny * bow + 0.25 * sag};
  const d = `M${fmt(a.x)},${fmt(a.y)} Q${fmt(c.x)},${fmt(c.y)} ${fmt(b.x)},${fmt(b.y)}`;
  // (the far strap a step darker, so where it passes behind the near pad the two read at different depths)
  const col = far ? shade(WEB, 0.32) : WEB;
  const w = 2.4 * CM;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={fmt(w + 2.6 * k)} strokeLinecap="round" />
      <path d={d} fill="none" stroke={col} strokeWidth={fmt(w)} strokeLinecap="butt" />
      <path d={d} fill="none" stroke={lit(col, 0.35)} strokeWidth={fmt(w * 0.22)} transform={`translate(${fmt(-w * 0.22)} 0)`} opacity={0.7} />
    </g>
  );
};

/** a tile-contact pattern: even on glass; on brick only a few tiles find a peak */
const BRICK_TILES = [0.15, 0, 0, 0.6, 0, 0.1, 0, 0, 0, 0, 0.8, 0, 0.3, 0, 0, 0, 0, 0, 0, 0.5, 0, 0.1, 0, 0];
export const contactTiles = (p: Pad5) => (p.surface === 'brick' ? BRICK_TILES.map((c) => Math.min(1, c * p.contact / 0.22)) : allTiles(p.contact));

/** a pad in the facade's projection */
export const PadOnFacade: React.FC<{id: string; s: Pad5; z: number; k: number}> = ({id, s, z, k}) => (
  <g transform={`translate(${fmt(KX * s.zo)} ${fmt(s.y + KY * s.zo)}) scale(${MM})`}>
    {/* (V8) its contact shadow stays on the glass: a soft dark footprint, crisp while the face is down, fading and left
        behind as the pad peels and stands off, so a release reads as the pad leaving the glass */}
    {(() => {
      const g = s.gap / MM, op = 0.3 * Math.exp(-g / 22);
      if (op < 0.01 || s.surface === 'brick') return null;
      const o = 3 + g * 0.35, hw = PW / 2, hh = PH / 2;
      const q = (v: number, w: number) => `${fmt(KX * w + 0.5)},${fmt(v + KY * w + o)}`;
      // (V8 QA) and the shadow it casts on the pane under the daylight from above: the body's outline dropped down
      // the glass by its depth, soft and faint, so in the grazing views the pad reads as standing on the glass
      const c = 0.2 * Math.exp(-g / 30), dv = 30 + g * 0.8;
      const qc = (v: number, w: number) => `${fmt(KX * w + 0.5)},${fmt(v + dv + KY * w)}`;
      return (
        <>
          {c > 0.01 && <path d={`M${qc(-hh + 6, -hw)} L${qc(-hh + 6, hw)} L${qc(hh + 10, hw)} L${qc(hh + 10, -hw)} Z`} fill="#0B1A20" opacity={c} />}
          <path d={`M${q(-hh + 2, -hw)} L${q(-hh + 2, hw)} L${q(hh + 2, hw)} L${q(hh + 2, -hw)} Z`} fill="#0B1A20" opacity={op} />
        </>
      );
    })()}
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

export const BayWorld5: React.FC<{id: string; st: ClimbState; cam: Cam; k: number; f: number; nest?: React.ReactNode; over?: React.ReactNode; man?: boolean; gear?: boolean; detail?: number; scenery?: boolean}> = ({id, st, cam, k, f, nest, over, man = true, gear = true, detail = 1, scenery = true}) => {
  const {pose, ringL, ringR, footL, footR, padL, padR} = st;
  const topL = loopApex(footL.bar), topR = loopApex(footR.bar);
  const far = cam.z < 30 && scenery;
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
        {scenery && <Facade5 id={`${id}-fc`} k={k} detail={detail} />}
        {scenery && cam.z < 0.6 && <Street5 id={`${id}-st`} k={k} f={f} />}
        {gear && (
          <>
            {/* far side */}
            <PadOnFacade id={`${id}-pR`} s={padR} z={cam.z} k={k} />
            <Strap8 id={`${id}-sR`} a={ringR} b={topR} sag={st.sagR} k={k} far />
            <Loop id={`${id}-lRb`} top={topR} bar={footR.bar} k={k} part="back" far />
            {man && (
              <Man
                sleeveCap
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
                    <Strap8 id={`${id}-sL`} a={ringL} b={topL} sag={st.sagL} k={k} />
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
