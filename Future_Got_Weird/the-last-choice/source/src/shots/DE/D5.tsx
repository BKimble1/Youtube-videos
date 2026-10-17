// D5 — A little later. On the bench by the bed the teammate unhooks the radio from the strap, switches it on (click on
// M.RADIO_CLICK), sets it on the bench and tunes it; the old song begins through the small speaker (M.L_IN). The camera
// eases back: the carrier beside them, the covered bed, the Director still kneeling. The teammate sees the visor on the
// floor and, painfully, leans down for it, lifting it as the vocal enters (M.VOCAL) and holding it. (8.6 s)
import React from 'react';
import {useShot} from '../../film/useShot';
import {M} from '../../film/timing';
import {look, dmg, radioOnStrap} from '../../film/crew';
import {Cast, ActorProps, solve, handCenter, RadioSmall} from '../../rig/actor';
import {CoverSheet} from '../../mech';
import {Frame, Layer, Grade, camAt, inkFor, smoothCam, Cam} from '../../kit/cam';
import {clamp, lerp, seg, smooth, easeInOut, easeOut, V2, V3, noise} from '../../kit/math';
import {benchTop} from '../../sets/refugeInterior';
import {Glow} from '../../fx/light';
import {InteriorBack, Tint, Visor, seated, basis, visorPt, Basis3} from './common';
import {BED, MATTRESS, BENCH, VISOR_REST, VISOR_REST_B, Backrest, Monitor, BayFurniture, MedicalBed, Bench} from './bedSet';
import {friendProps, directorProps, TIME_OF_DAY, mixBasis} from './D2';
import {bodyTop, sheetSpan} from './D4';

const ID = 'D5';
export const RADIO_SPOT = {x: -540, y: 0}; // on the bench seat between the carrier and the teammate (y set below)
const MATE_X = -372, CARRIER_X = -690;

/** Where the satchel's radio sits on the rig (same formula as rig/actor.tsx) — for the hand-off from strap to hand. */
const bagRadio = (p: ActorProps) => {
  const r = solve(p);
  const s = p.s ?? 1, b = r.base;
  const bc = {x: r.P.x + b.R.x * -78 * s + b.F.x * 6 * s, y: r.P.y + 8 * s};
  const bw = Math.max(18, Math.sqrt((30 * b.F.x) ** 2 + (12 * b.R.x) ** 2) * 2) * s;
  return {x: bc.x + (b.F.x >= 0 ? 1 : -1) * bw * 0.15, y: bc.y - 44 * s};
};

const D5: React.FC = () => {
  const {t, T, start} = useShot(ID);
  const tClick = M.RADIO_CLICK - start, tSong = M.L_IN - start, tVocal = M.VOCAL - start;
  const seatY = benchTop(BENCH.y, BENCH.s);
  const radioRest = {x: RADIO_SPOT.x, y: seatY - 15};
  // ---- the teammate on the bench: radio, then the visor
  const bagP = seated(look('teammate'), MATE_X, BENCH.y, seatY, {t, s: 1, yaw: -38, z: 200, seed: 33, knees: 84, spread: 36});
  const bag = bagRadio(bagP);
  // hand path for the radio: at the bag → up in front of the chest (switch on) → down onto the bench → tuning → lap
  const up = {x: MATE_X - 46, y: seatY - 112};
  const k1 = easeInOut(seg(t, 0.0, 0.42)), k2 = easeInOut(seg(t, 0.75, 1.55)), k3 = easeInOut(seg(t, 2.25, 2.9));
  const radioPos: V2 = t < 0.75 ? {x: lerp(bag.x, up.x, k1), y: lerp(bag.y, up.y, k1)} : {x: lerp(up.x, radioRest.x, k2), y: lerp(up.y, radioRest.y, k2) - Math.sin(Math.PI * k2) * 30};
  const tune = t > 1.55 && t < tSong + 0.2 ? Math.sin((t - 1.55) * 9) * 4 : 0;
  // the visor: notice → lean down → grasp → lift → hold (landing the lift on the vocal)
  const notice = smooth(seg(t, 3.5, 4.2));
  const lean = easeInOut(seg(t, 4.3, 5.6)) * (1 - easeInOut(seg(t, 5.95, tVocal - 0.25)));
  const grasp = t > 5.75;
  const lift = easeInOut(seg(t, 5.95, tVocal - 0.1));
  const visorHand: V2 = (() => {
    const ground = {x: VISOR_REST.x - 4, y: VISOR_REST.y - 30};
    const held = {x: MATE_X + 58, y: seatY - 28};
    if (!grasp) return ground;
    return {x: lerp(ground.x, held.x, lift), y: lerp(ground.y, held.y, lift) - Math.sin(Math.PI * lift) * 40};
  })();
  // right-hand target over time
  const handR: V3 = (() => {
    if (t < 2.25) return {x: radioPos.x + 4 + tune * 0.5, y: radioPos.y + 6, z: 260};
    if (t < 4.3) { const lap = {x: MATE_X + 16, y: seatY - 40, z: 300}; return {x: lerp(radioRest.x, lap.x, k3), y: lerp(radioRest.y, lap.y, k3), z: 280}; }
    const lap = {x: MATE_X + 16, y: seatY - 40};
    const reach = easeInOut(seg(t, 4.3, 5.7));
    const h = grasp ? visorHand : {x: lerp(lap.x, visorHand.x, reach), y: lerp(lap.y, visorHand.y, reach)};
    return {x: h.x, y: h.y, z: 300};
  })();
  const pain = smooth(seg(t, 4.4, 5.0)) * (1 - smooth(seg(t, 6.6, 7.4)));
  const songOn = smooth(seg(t, tSong, tSong + 0.6));
  const mate: ActorProps = {
    ...bagP,
    satchel: {radio: radioOnStrap(T)},
    lean: 6 + 30 * lean, side: 16 * lean, twist: lerp(0, -34, notice) - 10 * lean,
    head: {yaw: lerp(4, -8, notice), pitch: lerp(14, 30, notice) + 6 * smooth(seg(t, tVocal - 0.5, tVocal + 0.4)), roll: 4 * songOn},
    armR: {hand: handR, pole: {x: 0.4, y: 1, z: 0.6}},
    handR: t < 2.5 ? 'mitt' : grasp ? 'fist' : 'open',
    face: {
      mouth: pain > 0.4 ? 'pain' : t > tVocal - 0.3 ? 'sad' : 'flat', worry: 0.7 + 0.25 * pain, brows: -0.2 - 0.3 * pain,
      lids: t > tVocal ? 0.45 : 0.25, lookX: lerp(-0.2, 0.5, notice), lookY: lerp(0.4, 0.9, notice), squint: pain * 0.6,
    },
    breath: 0.5,
    dmg: dmg('teammate', T),
  };
  // ---- the carrier beside them: head down; lifts it a little when the song begins, looks at the radio
  const cSeat = seated(look('carrier'), CARRIER_X, BENCH.y, seatY, {t, s: 1, yaw: 34, z: 190, seed: 42, knees: 76, spread: 46});
  const raise = smooth(seg(t, tSong + 0.5, tSong + 1.6));
  const carrier: ActorProps = {
    ...cSeat, lean: 34 - 16 * raise,
    head: {pitch: 26 - 20 * raise, yaw: -10 - 28 * raise},
    armL: {hand: {x: CARRIER_X + 30, y: seatY - 30, z: 260}}, armR: {hand: {x: CARRIER_X + 66, y: seatY - 40, z: 270}},
    handL: 'fist', face: {mouth: 'sad', worry: 0.8, lids: lerp(0.55, 0.35, raise), brows: -0.3, lookX: 0.6 * raise, lookY: 0.4},
    dmg: dmg('carrier', T), breath: 0.5,
  };
  // ---- the bed beyond: the covered friend, the Director still kneeling, holding the hand
  const friend = friendProps(T, t, {settle: 1, eyes: 0, smile: 0, still: 1});
  const fr = solve(friend);
  const top = bodyTop(fr);
  const span = sheetSpan(fr);
  const dir = directorProps(T, t, {lookUp: 0, hope: 0, grief: 1});
  dir.lean = (dir.lean ?? 0) + 10; dir.head = {...dir.head, pitch: (dir.head?.pitch ?? 0) + 14};
  dir.face = {...dir.face, closed: false, lids: 0.6, lookY: 0.6};
  // ---- the visor (free prop): on the floor, then in the teammate's hand
  let vB: Basis3 = VISOR_REST_B, vC: V2 = VISOR_REST;
  if (grasp) {
    const heldB = basis(40, 30, 0);
    const b = mixBasis(VISOR_REST_B, heldB, smooth(clamp(lift * 1.3)));
    // keep the brim tip in the hand
    const tip0 = visorPt(0, 0, 1, b, 0, -0.14, 1.53);
    vB = b; vC = {x: handR.x - tip0.x, y: handR.y - tip0.y};
  }
  // ---- the radio (free prop once off the strap)
  const radioOn = t >= tClick ? 1 : 0;
  // ---- camera: close on the hands and radio → eases back to show the bay → settles in on the teammate with the visor
  const camF = (tt: number): Cam => {
    const a = camAt(-420, -200, 960, 560, 2.25);
    const b = camAt(-300, -250, 960, 560, 1.5);
    const c = camAt(-330, -215, 960, 560, 1.78);
    const k = easeInOut(seg(tt, tSong - 0.2, tSong + 2.6));
    const k2 = easeInOut(seg(tt, 4.4, 8.4));
    const ab = {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), k))};
    return {x: lerp(ab.x, c.x, k2), y: lerp(ab.y, c.y, k2), z: Math.exp(lerp(Math.log(ab.z), Math.log(c.z), k2))};
  };
  const cam = smoothCam(camF, t, 0.25, 7);
  const ink = inkFor(cam.z, 1);
  const ink2 = inkFor(cam.z * 0.8, 0.85);
  const dial = radioOn ? 0.6 + 0.4 * noise(t * 3, 5) * (t < tSong ? 1 : 0.2) : 0;
  return (
    <Frame bg="#EFE6D2">
      <Layer cam={cam} p={0.8}>
        <InteriorBack x0={-2600} x1={3200} t={t} time={TIME_OF_DAY} ink={ink2} people={1} seed={5} wallY={-330} top={-1900} />
      </Layer>
      <Layer cam={cam} p={1}>
        <BayFurniture t={t} ink={ink} />
        <MedicalBed x={BED.x} y={BED.y} s={BED.s} headDir={-1} ink={ink} />
        <Backrest ink={ink} incline={BED.incline} />
        <Monitor x={-230} y={MATTRESS - 10} t={t} urgent={0} stopped={1} ink={ink} />
        <Cast actors={[friend]} />
        <CoverSheet x0={span.x0} x1={span.x1} ySurf={MATTRESS + 6} top={top} progress={1} ink={ink} seed={3} drape={60} />
        <Cast actors={[dir]} />
        {!grasp && <Visor x={vC.x} y={vC.y} s={1} b={vB} ink={ink} />}
        <Bench x={BENCH.x} y={BENCH.y} s={BENCH.s} w={BENCH.w} ink={ink} />
        {t >= 0.75 + 0.8 && <g transform={`translate(${radioRest.x} ${radioRest.y})`}><RadioSmall s={0.8} ink={ink} on={dial} /></g>}
        <Cast actors={[carrier, mate]} extra={[
          ...(t >= 0.4 && t < 1.55 ? [{z: 200 * 1000 + 80, el: <g transform={`translate(${radioPos.x} ${radioPos.y})`}><RadioSmall s={0.8} ink={ink} on={dial} /></g>}] : []),
          ...(grasp ? [{z: 200 * 1000 + 90, el: <Visor x={vC.x} y={vC.y} s={1} b={vB} ink={ink} />}] : []),
        ]} />
        {radioOn > 0 && <Glow x={radioPos.x + (t >= 1.55 ? radioRest.x - radioPos.x : 0) + 9} y={(t >= 1.55 ? radioRest.y : radioPos.y) - 4} r={46} color="#FFD98A" opacity={0.45 * dial} id="d5dial" />}
      </Layer>
      <Tint time={TIME_OF_DAY} />
      <Grade vignette={0.36} id="vgD5" />
    </Frame>
  );
};
export default D5;
void easeOut; void MATTRESS;
