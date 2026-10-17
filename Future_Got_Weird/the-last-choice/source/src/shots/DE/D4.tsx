// D4 — The attendant's urgent pulse stops and dims; it draws the white sheet over the still figure. The Director keeps
// holding the hand. The teammate looks at the one who saved them. The builder turns away; the carrier sits heavily.
// A locked-off wide held in silence (room tone only): its own rhythm after the rescue's motion. (6.0 s)
import React from 'react';
import {useShot} from '../../film/useShot';
import {look, dmg, limpOf} from '../../film/crew';
import {Cast, Actor, ActorProps, solve, rolled, Rig, actorParts} from '../../rig/actor';
import {Attendant, CoverSheet} from '../../mech';
import {Frame, Layer, Grade, camAt, inkFor} from '../../kit/cam';
import {clamp, lerp, seg, smooth, easeIn2, easeInOut, V2} from '../../kit/math';
import {benchTop} from '../../sets/refugeInterior';
import {InteriorBack, Tint, Visor, seated} from './common';
import {BED, MATTRESS, CLASP, GURNEY, BENCH, VISOR_REST, VISOR_REST_B, Backrest, Monitor, BayFurniture, MedicalBed, Gurney, Bench} from './bedSet';
import {friendProps, directorProps, teammateOnGurney, TIME_OF_DAY} from './D2';

const ID = 'D4';

/** Upper contour of the reclined body (world y as a function of x), from the solved rig, for the sheet. */
export const bodyTop = (r: Rig) => {
  const W = (q: {x: number; y: number}) => rolled(r, q);
  const ank = W({x: (r.ankle[0].x + r.ankle[1].x) / 2, y: (r.ankle[0].y + r.ankle[1].y) / 2});
  const kn = W({x: (r.knee[0].x + r.knee[1].x) / 2, y: (r.knee[0].y + r.knee[1].y) / 2});
  const pv = W(r.P);
  const sh = W({x: (r.sh[0].x + r.sh[1].x) / 2, y: (r.sh[0].y + r.sh[1].y) / 2});
  const hd = W(r.headC);
  const pts: V2[] = [
    {x: ank.x + 50, y: ank.y - 14}, {x: ank.x, y: ank.y - 30}, {x: kn.x, y: kn.y - 32}, {x: pv.x, y: pv.y - 44},
    {x: sh.x, y: sh.y - 52}, {x: hd.x + 30, y: hd.y - 40}, {x: hd.x - 20, y: hd.y - 66}, {x: hd.x - 70, y: hd.y - 40},
  ].sort((a, b) => a.x - b.x);
  return (x: number) => {
    if (x <= pts[0].x) return pts[0].y;
    for (let i = 1; i < pts.length; i++) if (x <= pts[i].x) return lerp(pts[i - 1].y, pts[i].y, (x - pts[i - 1].x) / (pts[i].x - pts[i - 1].x));
    return pts[pts.length - 1].y;
  };
};

/** The sheet's extent over the reclined body: from past the feet to past the head (world x). */
export const sheetSpan = (r: Rig) => ({x0: rolled(r, r.ankle[1]).x + 70, x1: rolled(r, r.headC).x - 80});

const D4: React.FC = () => {
  const {t, T} = useShot(ID);
  const cam = camAt(70, -290, 960, 540, 1.13);
  const ink = inkFor(cam.z, 1);
  const ink2 = inkFor(cam.z * 0.8, 0.85);
  // ---- the attendant: stops, dims, fetches the sheet along the far side, draws it from the feet to the head
  const stopped = smooth(seg(t, 0.35, 1.0));
  const toFoot = easeInOut(seg(t, 1.2, 2.2));
  const drawK = easeInOut(seg(t, 2.35, 4.9));
  const friend = friendProps(T, t, {settle: 1, eyes: 0, smile: 0, still: 1});
  const fr = solve(friend);
  const top = bodyTop(fr);
  const {x0, x1} = sheetSpan(fr);
  const lead = {x: lerp(x0, x1, drawK), y: top(lerp(x0, x1, drawK)) - 26};
  const atX = drawK > 0 ? lerp(380, x1 + 40, drawK) : lerp(-330, 380, toFoot);
  const atHand = drawK > 0 || t > 2.2 ? lead : {x: atX - 60, y: MATTRESS - 120};
  // ---- the Director keeps holding; at the end bows toward the hands
  const bow = smooth(seg(t, 3.6, 5.2));
  const dir = directorProps(T, t, {lookUp: 0, hope: 0, grief: 0.6 + 0.4 * bow});
  dir.lean = (dir.lean ?? 0) + 14 * bow;
  dir.head = {...dir.head, pitch: (dir.head?.pitch ?? 0) + 18 * bow};
  dir.face = {...dir.face, closed: bow > 0.6, lids: 0.5};
  // ---- the teammate on the gurney: looks at the covered figure, then at the Director
  const mate = teammateOnGurney(T, t, {look: 1, hope: 0, head: -4 + 8 * smooth(seg(t, 4.2, 5.0))});
  mate.face = {...mate.face, mouth: 'sad', lids: 0.35, worry: 0.95, brows: -0.1, lookX: -0.9, lookY: 0.25 - 0.2 * smooth(seg(t, 4.2, 5.0))};
  mate.lean = 10;
  // ---- the builder stands between the bed and the gurney, then turns away (two steps), a hand to the face
  const turn = easeInOut(seg(t, 1.6, 3.0));
  const bx = 430, by = -40, bs = 0.95;
  const bYaw = lerp(-62, 140, turn);
  const stepL = smooth(seg(t, 1.7, 2.2)), stepR = smooth(seg(t, 2.3, 2.9));
  const footAt = (yaw: number, sd: number) => {
    const a = (yaw * Math.PI) / 180;
    return {x: bx + -Math.cos(a) * sd * 34 * bs, y: by - 9 * bs, z: Math.sin(a) * sd * 34 * bs};
  };
  const builder: ActorProps = {
    look: look('builder'), t, x: bx, y: by, s: bs, yaw: bYaw, seed: 41, z: -100, breath: 0.3,
    legL: {foot: footAt(lerp(-62, 140, stepL), -1)}, legR: {foot: footAt(lerp(-62, 140, stepR), 1)},
    head: {pitch: 10 + 18 * turn, yaw: 0},
    armR: turn > 0.4 ? {hand: {x: bx + lerp(0, 20, turn), y: by - 360 * bs, z: 40}, w: smooth(seg(t, 2.6, 3.3))} : undefined,
    face: {mouth: 'sad', worry: 0.9, lids: 0.4, brows: -0.2},
    dmg: dmg('builder', T),
  };
  // ---- the carrier sits down heavily on the bench (left front), elbows to knees, head down
  const sit = easeIn2(seg(t, 1.0, 1.75));
  const land = t > 1.75 ? Math.exp(-(t - 1.75) * 7) * Math.sin((t - 1.75) * 20) * 6 : 0;
  const seatY = benchTop(BENCH.y, BENCH.s);
  const cx = -690;
  const cSeat = seated(look('carrier'), cx, BENCH.y, seatY, {t, s: 1, yaw: 34, z: 200, seed: 42, knees: 76, spread: 46});
  const cStand = cSeat.drop!;
  const carrier: ActorProps = {
    ...cSeat,
    drop: lerp(-6, cStand, sit) + land,
    lean: lerp(4, 34, smooth(seg(t, 1.6, 2.6))),
    head: {pitch: lerp(0, 26, smooth(seg(t, 1.8, 3.0))), yaw: -10},
    armL: {hand: {x: cx + 30, y: seatY - 30 + 40 * (1 - sit), z: 260}, w: smooth(seg(t, 1.5, 2.6))},
    armR: {hand: {x: cx + 66, y: seatY - 40 + 40 * (1 - sit), z: 270}, w: smooth(seg(t, 1.5, 2.6))},
    handL: 'fist', face: {mouth: 'sad', worry: 0.8, lids: 0.55, brows: -0.3},
    dmg: dmg('carrier', T), breath: 0.5,
  };
  void limpOf;
  // the friend's arm and hand stay outside the sheet, still held: redraw them over the sheet, clipped to the clasp
  const hand = rolled(fr, fr.wr[1]);
  const clipId = 'd4clasp';
  const armParts = actorParts(friend).parts.filter((q) => q.key === 'arm1' || q.key === 'hand1').sort((a, b) => a.z - b.z);
  return (
    <Frame bg="#EFE6D2">
      <Layer cam={cam} p={0.8}>
        <InteriorBack x0={-2600} x1={3200} t={t} time={TIME_OF_DAY} ink={ink2} people={1} seed={5} wallY={-330} top={-1900} />
      </Layer>
      <Layer cam={cam} p={1}>
        <BayFurniture t={t} ink={ink} />
        <Attendant x={atX} y={-60} s={0.92} t={t} seed={4} urgent={1 - stopped} stopped={stopped} face={drawK > 0 ? 0.5 : lerp(0.75, 0.2, toFoot)} ink={ink}
          handL={atHand} holdSheet={t < 2.35} />
        <Gurney x={GURNEY.x} y={GURNEY.y} s={GURNEY.s} ink={ink} headDir={1} />
        <Cast actors={[mate]} />
        <Actor {...builder} />
        <MedicalBed x={BED.x} y={BED.y} s={BED.s} headDir={-1} ink={ink} />
        <Backrest ink={ink} incline={BED.incline} />
        <Monitor x={-230} y={MATTRESS - 10} t={t} urgent={1 - stopped} stopped={stopped} ink={ink} />
        <Cast actors={[friend]} />
        <CoverSheet x0={x0} x1={x1} ySurf={MATTRESS + 6} top={top} progress={drawK} ink={ink} seed={3} lift={0} drape={60} />
        <defs><clipPath id={clipId}><circle cx={hand.x} cy={hand.y} r={70} /></clipPath></defs>
        <g clipPath={`url(#${clipId})`}>{armParts.map((q) => <g key={q.key}>{q.el}</g>)}</g>
        <Cast actors={[dir]} />
        <Visor x={VISOR_REST.x} y={VISOR_REST.y} s={1} b={VISOR_REST_B} ink={ink} />
        <Bench x={BENCH.x} y={BENCH.y} s={BENCH.s} w={BENCH.w} ink={ink} />
        <Cast actors={[carrier]} />
      </Layer>
      <Tint time={TIME_OF_DAY} />
      <Grade vignette={0.38} id="vgD4" />
    </Frame>
  );
};
export default D4;
void CLASP; void clamp;
