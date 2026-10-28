// V6: visual revision of V5 on the locked V5 narration and timing. The opening's carve is replaced by one gust and his
// whole-body answer; the workshop fire is a short ignition at the centre engine with no invented cause; the balance
// and coach section is rebuilt as distinct beats (problem, tendency, legs, whole body, sensing phone, coaching phone,
// earbud with the body's change, a recovery); practice to flight is one continuous move; the river crossing and the
// canyon are separate places joined by a cut; the ending is one crane down onto frame 0. See production/V6_PLAN.md.
// V5: camera discipline and character stability pass (see "V5 camera language" below).
// V3 shot list. Same narration and timing as V1/V2 (story/time.ts). Every move has a reason: following the rider,
// revealing the mechanism, showing the height, or carrying us to the next place. Places are joined by matches (the
// spinning fan seen from below becomes the same fan seen from above on the riverside flat; the fan seen from below
// becomes a jet intake; the scorched compressor becomes a new electric fan; the board on the bench becomes the board on
// the field) or by cuts to a different view of the same action. The ending runs on the hook's own trajectory and lands
// exactly on frame 0's camera.
import React from 'react';
import {BD, ductWorld} from '../art/Board';
import {JET, JetBoard, jetIntake, jetNozzle} from '../art/JetBoard';
import {Pilot} from '../art/Pilot';
import {pilotJoints} from '../art/rig';
import {mix} from '../dc/color';
import {hash, noise1} from '../dc/math';
import {f2, polyD, proj} from '../eng/draw';
import {a3, Cam, clipNear, d3, Frame, frameYPR, l3, lens, Lens, lerp3, m3, n3, s3, toW, v3, V3} from '../eng/v3';
import {FieldBack} from '../env/Field';
import {Buoy, RiverBack} from '../env/River';
import {WorkshopBack, WS_OPENINGS} from '../env/Workshop';
import {AirJets} from '../fx/AirJets';
import {Exhaust, FlameBed, Flash, Recirc, Smoke} from '../fx/Fire';
import {Wash} from '../fx/Wash';
import {BoardInterior, ConceptTag, UnitSection} from '../fx/Cutaway';
import {sstep} from '../story/flight';
import {ca, ck, CK, Key, orbitAnch, orbitBoard, splineRec} from '../story/cam';
import {Rider, RiderShadow} from '../story/rider';
import {CAPS, DUR, M} from './time8';
import {aboveGround, blendCam, Box, riderBox, Shot, swingCam, toOrbit, unwrap} from '../v2/shots2';
import {fieldFlight6, flight6, GORGE4, GUST_AT, hook4, inventor4, lift4, payoff4, REST, St} from './flight8';

export {M};
const NEAR = 150; // the riverside flat between the water and the near-bank hills (m)

// ================================================================ shared scene: a flight over water or ground
type SceneP = {id: string; t: number; st: St; L: Lens; L2?: Lens; count?: number; set: 'river' | 'field'; surface: 'water' | 'ground'; tint?: number; coach?: number; pov?: boolean; jets?: number; reach?: number; sun?: V3; buoys?: boolean; extra?: React.ReactNode; under?: React.ReactNode; water?: number; gorgeWater?: number; gorge?: boolean; blow?: boolean};
// V6: the river set has no gorge cut into its far bank except in the canyon shot, so the Yangtze crossing never leads
// into the canyon (they were separate demonstrations)
const FlightScene: React.FC<SceneP> = ({id, t, st, L, L2, count, set, surface, tint = 0, coach = 0, pov, jets = 1, reach, sun, buoys, extra, under, water, gorgeWater, gorge, blow}) => (
  <g>
    {set === 'river'
      ? <RiverBack id={`${id}-rv`} L={L} t={t} gorge={gorge ? GORGE4 : undefined} near={NEAR} L2={L2} tint={tint} cliffs shoal={SHOAL} wind={0.3 + 0.5 * Math.max(0, 1 - st.alt / 4)} gorgeWater={gorgeWater} hiClouds blow={blow ? {at: st.pos, k: st.thrust * Math.max(0, Math.min(1, 1.15 - st.alt / 3.6)), R: 1.3 + 0.45 * st.alt} : undefined} />
      : <FieldBack id={`${id}-fd`} L={L} t={t} tint={tint} wind={0.3 + st.thrust * 0.6 * Math.max(0, 1 - (st.alt - REST) / 3)} />}
    {buoys && <Buoys L={L} t={t} />}
    {under}
    {/* V5: over the shoreline the downwash and the shadow blend from ground to water (water = 0..1) instead of
        switching in one frame */}
    {(water ?? (surface === 'water' ? 1 : 0)) < 0.999 && <Wash id={`${id}-wg`} L={L} at={st.pos} alt={st.alt} thrust={st.thrust * (1 - (water ?? 0))} t={t} vel={st.vel} surface="ground" foam={1} soft crisp />}
    {(water ?? (surface === 'water' ? 1 : 0)) > 0.001 && <Wash id={`${id}-wa`} L={L} at={st.pos} alt={st.alt} thrust={st.thrust * (water ?? 1)} t={t} vel={st.vel} surface="water" foam={1} soft crisp />}
    {st.alt < 14 && <RiderShadow L={L} B={st.B} pose={st.pose} sun={sun ?? (set === 'river' ? RSUN : undefined)} minOp={set === 'river' ? 1.1 : 0.35} color={mix('#24361F', '#0B2427', water ?? (surface === 'water' ? 1 : 0))} />}
    {!below(L, st) && <AirJets L={L} B={st.B} t={t} thrust={st.thrust} vel={st.vel} alpha={Math.min(1, jets)} reach={reach} dense={Math.max(0, jets - 1)} speed={set === 'field' ? 0.4 : 1} />}
    <Rider id={id} L={L} B={st.B} pose={st.pose} coach={coach} pov={pov} voice={st.voice ? {k: st.voice, t} : undefined} st={{phase: t * 1.8, rps: st.rps > 20 ? 14 : st.rps, thrust: st.thrust, tilt: {pitch: st.pitch, roll: st.roll}, count}} />
    {below(L, st) && <AirJets L={L} B={st.B} t={t} thrust={st.thrust} vel={st.vel} alpha={Math.min(1, jets)} reach={reach} dense={Math.max(0, jets - 1)} speed={set === 'field' ? 0.4 : 1} />}
    {extra}
  </g>
);
const box = (L: Lens, st: St) => riderBox(L, st.B, st.pose);
// V5: seen from under the deck the jets are between the board and the camera, so they are drawn over it
const below = (L: Lens, st: St) => d3(s3(L.pos, st.B.o), st.B.y) < -0.05;
// the sun over the river: high, behind the camera of the rear high three-quarter views, so the rider's shadow falls on
// the water ahead of him where those views can see it (the height above the water reads at a glance)
const RSUN = n3(v3(0.35, 0.78, -0.52));
const SHUT = 0.02;

// ================================================================ V5 camera language
// The camera behaves like an operator following real action: it tracks the rider at a steady offset (its target is
// the board's position averaged over a short window, so it does not bob with every heave), or it stands still and
// pans/tilts while he travels through the frame. Changes of view are slow, purposeful moves or clean cuts. No orbits,
// push-pulls or roll; the direction of travel stays screen-right throughout.
const smoothPos = (f: (t: number) => V3, t: number, w = 0.3): V3 => {
  let acc = v3(0, 0, 0);
  for (let k = -4; k <= 4; k++) acc = a3(acc, f(t + (k * w) / 8));
  return m3(acc, 1 / 9);
};
/** track the board at a world-space offset (orbit az/el/dist around its smoothed position) */
const trackCam = (pos: (t: number) => V3, t: number, c: CK, w = 0.3): Cam => {
  const tg = a3(smoothPos(pos, t, w), v3(c.tx ?? 0, c.ty, c.tz ?? 0));
  const R = Math.PI / 180;
  return {pos: a3(tg, v3(-Math.sin(c.az * R) * Math.cos(c.el * R) * c.dist, Math.sin(c.el * R) * c.dist, -Math.cos(c.az * R) * Math.cos(c.el * R) * c.dist)), tgt: tg, roll: 0, fov: c.fov};
};
/** a camera standing at `at`, panning/tilting to keep the (smoothed) board in frame */
const standCam = (at: V3, pos: (t: number) => V3, t: number, ty: number, fov: number, w = 0.35): Cam => ({pos: at, tgt: a3(smoothPos(pos, t, w), v3(0, ty, 0)), roll: 0, fov});
/** V5: a standing camera that follows only a share `k` of the board's travel since `t0` (he moves through the frame
 *  and the background barely sweeps; following him fully read as an arc round him) */
const standPart = (at: V3, pos: (t: number) => V3, t: number, t0: number, k: number, ty: number, fov: number, w = 0.5): Cam => {
  const p0 = smoothPos(pos, t0, w), p = smoothPos(pos, t, w);
  return {pos: at, tgt: a3(a3(p0, m3(s3(p, p0), k)), v3(0, ty, 0)), roll: 0, fov};
};
const camFrom = (tgt: V3, c: CK): V3 => {
  const R = Math.PI / 180;
  return a3(a3(tgt, v3(0, c.ty, 0)), v3(-Math.sin(c.az * R) * Math.cos(c.el * R) * c.dist, Math.sin(c.el * R) * c.dist, -Math.cos(c.az * R) * Math.cos(c.el * R) * c.dist));
};

// ================================================================ 1: the opening, the inside of the board, the air (one continuous camera)
// V7: 0-7.13 s is one unbroken camera move on the flying board (about 7 m over the Yangtze at 11 m/s):
//   0.0  high front three-quarter, looking down past him to the water far below; buoys and the gravel bar beneath
//   0.4  the camera tracks in toward the board as a gust rocks it and his body answers (flight7.ts)
//   1.2  it rises behind him: the river opens beneath him and the shore he left falls away
//   2.0-2.5  wide: the scale of the crossing, a small figure high over the water
//   2.5-4.0  it sweeps down and under the moving board, to almost straight below
//   3.6-4.2  "You see, ten powerful": the underside skin opens (an iris from the spine): frame, battery and power runs
//            to the ten units (conceptual), the rims counted in turn, current pulsing out to the motors
//   4.84 "electric propellers": the camera travels into ONE unit (the duct on his toe side), round to its side, where a
//            section opens: the motor's coils energise in turn, the bell and blades spin up, air speeds through the duct
//   5.84 "blast air downward": it follows that air down the jet to the river, where it churns the water
// No cut: the only cut in the first 9 s is to the riverside flat on "lifting".
export const SHOAL = {x: 4, z: 104, len: 48, wid: 11};
const MATCH = M.lifting - 0.74; // the lift's own clock
const CUT_UNDER = Math.round(CAPS.find((c) => c.text.toLowerCase().startsWith('you see'))!.show * 30) / 30;
const CUT_AIR = M.blast - 0.02;
// the cut to the riverside flat lands on the "lifting you completely" caption
const CUT2 = Math.round(CAPS.find((c) => c.text.toLowerCase().startsWith('lifting'))!.show * 30) / 30;
// the ending's last key before the loop (shared, so the camera velocity at frame 0 is the same on both sides)
// V8: the ending's last key before the loop: already close to frame 0's framing, so the crane settles into it
const LOOPK: [number, CK] = [DUR - 0.5, ck(259, 27, 6.6, 52, -0.4, 0)];
type OK7 = CK & {wd: number; dy: number};
const ok7 = (az: number, el: number, dist: number, fov: number, ty: number, wd = 0, dy = 0): OK7 => ({...ck(az, el, dist, fov, ty, 0), wd, dy});
const UNIT = 5; // the middle duct on his toe side
// V8 opening: one controlled tracking move alongside him (he and the board fill a third of the frame from frame 0, the
// gravel bar's edge and the river streaming past beneath), then a purposeful widening on "across a RIVER" to the
// crossing's scale, then down and under the board into the mechanism as in V7
const OPENK: [number, OK7, {hold?: boolean}?][] = [
  [LOOPK[0] - DUR, {...LOOPK[1], wd: 0, dy: 0}],
  [0.0, ok7(262, 26, 5.6, 52, -0.5)],
  [0.95, ok7(265, 25, 5.9, 52, -0.45)],
  [1.75, ok7(275, 18, 9.0, 52, 0.0)],
  [CUT_UNDER - 0.62, ok7(286, 11, 15.0, 52, 1.0)],
  [CUT_UNDER - 0.12, ok7(292, 2, 7.8, 52, 0.0)],
  [CUT_UNDER + 0.2, ok7(282, -40, 4.6, 54, 0.0)],
  [CUT_UNDER + 0.7, ok7(272, -76, 3.4, 56, 0.0), {hold: true}],
  [M.electric, ok7(272, -76, 3.4, 56, 0.0)],
  [M.electric + 0.45, ok7(276, -24, 1.2, 46, 0.0, 1)],
  [CUT_AIR - 0.05, ok7(278, -14, 0.5, 44, 0.0, 1, -0.02), {hold: true}],
  [CUT_AIR + 0.2, ok7(278, -14, 0.52, 44, 0.0, 1, -0.06)],
  [CUT_AIR + 0.75, ok7(284, 0, 2.6, 52, 0.0, 0.7, -1.2)],
  [CUT2, ok7(292, 12, 5.5, 58, 0.0, 0, -1.8)],
];
const hookPos = (t: number) => hook4(t).B.o;
const hookCam = (t: number): Cam => {
  const c = splineRec(t, OPENK);
  const st = hook4(t);
  const duct = s3(ductWorld(st.B, UNIT, BD.fanY), st.B.o);
  return trackCam(hookPos, t, {...c, tx: duct.x * c.wd, tz: duct.z * c.wd, ty: c.ty + duct.y * c.wd + c.dy});
};
// the reveal's timing
const IRIS = (t: number) => sstep(CUT_UNDER + 0.25, CUT_UNDER + 0.85, t) * (1 - sstep(CUT_AIR + 0.45, CUT_AIR + 0.95, t));
const LOAD = (t: number) => sstep(M.ten - 0.05, M.ten + 0.4, t);
const SECT = (t: number) => sstep(M.electric + 0.15, M.electric + 0.6, t) * (1 - sstep(CUT_AIR + 0.55, CUT_AIR + 0.9, t));
// the unit's motor seen in the section spins up from rest (drawn at a readable rate) as current reaches it
const unitSpin = (t: number) => 0.3 * ssI(M.electric + 0.2, M.electric + 0.95, t) + 0.6 * ssI(M.electric + 0.6, CUT_AIR + 0.3, t);
const unitRps = (t: number) => 2 + 16 * sstep(M.electric + 0.2, CUT_AIR, t);
const OpeningExtra: React.FC<{id: string; t: number; L: Lens; st: St}> = ({id, t, L, st}) => (
  <g>
    <BoardInterior id={`${id}-bi`} L={L} B={st.B} k={IRIS(t)} t={t} load={LOAD(t)} />
    <UnitSection id={`${id}-us`} L={L} B={st.B} i={UNIT} k={SECT(t)} spin={unitSpin(t)} rps={unitRps(t)} air={sstep(M.electric + 0.4, CUT_AIR, t)} t={t} power={sstep(M.electric + 0.1, M.electric + 0.4, t)} />
    <ConceptTag k={Math.max(IRIS(t), SECT(t)) * (1 - sstep(CUT_AIR + 0.5, CUT_AIR + 0.8, t))} />
  </g>
);

// ================================================================ 2: the lift (the riverside flat)
// A camera standing low on the grass at his toe side, a little ahead: it opens on his legs and the deck (the air
// kicking dust off the ground, matching the water), tilts up as the board lifts him clear, and pans as he moves off
// and passes above and beside it; the last frames look up at the board's underside, which matches the jet prototype
// seen from above.
const liftPos = (t: number) => lift4(t, MATCH).B.o;
// V5: the camera stands a little further off, at his toe side and slightly behind, and follows only part of the
// rise and of the move off: he rises in the frame and travels toward frame right instead of the camera chasing him
// (V5's first cut tilted at up to 0.85 screen heights a second)
// (ahead of the board, so the downstream bridge stays out of frame behind him: from his side its pylon stood under
// the board like a post)
// V7: the camera starts low in the grass close to the board, where the downwash flattens the grass round it, and
// cranes up and back as the board lifts him, so his height over the ground changes noticeably in the frame
const LIFT_LOW = v3(-40 + 2.6, 0.95, -26 + 1.9), LIFT_HIGH = v3(-40 + 7.2, 2.1, -26 + 5.2);
const liftCam = (t: number): Cam => {
  const u = sstep(CUT2 + 0.1, M.but + 0.3, t);
  const p = smoothPos(liftPos, t, 0.5);
  const tg = v3(p.x, 0.3 + (p.y - 0.14) * 0.85 + 0.4 * u, p.z);
  return {pos: lerp3(LIFT_LOW, LIFT_HIGH, u), tgt: tg, roll: 0, fov: 50 - 6 * u};
};

// ================================================================ 3: the jet prototype test (workshop)
// V7: one continuous camera from the jet test, through the redesign on the same stand, to the electric board lifting
// off it (cut to the field on "one HUGE problem"). The jet test escalates in one move: ignition, hot exhaust onto the
// floor, the hot air drawn back up into the intakes (as the reports explain), the casings overheating, then fire
// round the engines. Controlled: no explosion; it is put out on "So he switched".
const WS_END = Math.round(CAPS.find((c) => c.text.toLowerCase().startsWith('one huge'))!.show * 30) / 30;
const ign = (t: number) => sstep(M.but + 0.75, M.but + 1.05, t); // starters click, the compressors begin to turn
const run = (t: number) => sstep(M.jet - 0.2, M.jet + 0.35, t) * (1 - sstep(M.so - 0.1, M.so + 0.35, t));
const heat = (t: number) => sstep(M.engines + 0.1, M.fire, t) * (1 - 0.7 * sstep(M.so, M.so + 0.8, t));
// V5: the drawn compressor blades turn at most 1 turn/s (12 degrees a frame, under a third of the blade spacing), so
// they never strobe or appear to run backward; above that the speed shows as blur (from jetRps), not as rotation
const ssI = (a: number, b: number, t: number) => {
  const s = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return (b - a) * (s ** 3 - s ** 4 / 2) + Math.max(0, t - b);
};
const jetPhase = (t: number) => -(ssI(M.but + 0.75, M.but + 1.05, t) - 0.9 * ssI(M.so - 0.1, M.so + 0.5, t));
const jetRps = (t: number) => 2 + 7 * ign(t) + 22 * run(t);
// the redesign: the five jets lift out of their mounts, the bare plank goes up and away toward its tail, the electric
// deck comes down into the same cradle from the nose side, its ten units seat in turn, the fans spin up, and it lifts
// V8: the redesign's beats keep their order and proportions inside the (shorter) span from "So he switched" to the
// cut on "one HUGE problem"
const WSC = (WS_END - M.so) / 2.52;
const JLIFT = (i: number, t: number) => {
  const u = sstep(M.so + WSC * 0.12 + WSC * 0.06 * i, M.so + WSC * 0.55 + WSC * 0.06 * i, t);
  return 2.6 * u * u;
};
const PLANK = (t: number) => sstep(M.so + WSC * 0.48, M.so + WSC * 0.96, t);
const DECK = (t: number) => sstep(M.so + WSC * 0.68, M.so + WSC * 1.22, t);
const BUILT = (t: number) => 10.8 * Math.min(1, Math.max(0, (t - (M.so + WSC * 1.2)) / (0.62 * WSC)));
const ESPIN = M.so + WSC * 1.56;
const ePhase = (t: number) => 1.6 * ssI(ESPIN, ESPIN + 0.65, t);
const eRps = (t: number) => 9 * sstep(ESPIN, ESPIN + 0.65, t);
const RISE = (t: number) => 0.38 * sstep(WS_END - 0.54, WS_END + 0.3, t);
type WK = CK & {wd: number};
const wk = (az: number, el: number, dist: number, fov: number, ty: number, wd = 0): WK => ({...ck(az, el, dist, fov, ty, 0), wd});
const WS_UNIT = 2; // a front-row unit on the camera's side
const WSK: [number, WK, {hold?: boolean}?][] = [
  [M.but, wk(-38, 22, 3.3, 50, -0.05)],
  [M.jet, wk(-42, 15, 2.6, 50, -0.12)],
  // low at the deck's edge: the plumes hit the floor and the hot air curls back up to the intakes
  [M.andCaught, wk(-47, 9, 2.15, 50, -0.2)],
  [M.fire + 0.3, wk(-50, 17, 2.35, 50, -0.1)],
  [M.so, wk(-53, 30, 2.8, 50, 0.0)],
  // the redesign view: from above, the stand and the parts coming out and going in
  [M.so + WSC * 0.75, wk(-56, 50, 3.9, 50, 0.1)],
  [M.so + WSC * 1.2, wk(-58, 52, 4.0, 50, 0.08)],
  // in to one new unit as its motor spins up
  [ESPIN - 0.05, wk(-60, 48, 1.9, 46, 0.0, 1)],
  [ESPIN + 0.45, wk(-60, 44, 1.6, 46, 0.0, 1)],
  [WS_END, wk(-64, 20, 3.6, 48, 0.28, 0)],
];
const JB0 = frameYPR(v3(0, 0.92, 0), 20, 0, 0);
const JB = (t: number) => {
  const vib = 0.008 * sstep(M.engines + 0.2, M.andCaught + 0.2, t) * (1 - sstep(M.so - 0.1, M.so + 0.3, t));
  return frameYPR(v3(noise1(t * 40, 1) * vib, 0.92 + noise1(t * 43, 2) * vib, noise1(t * 37, 3) * vib), 20, 0, 0);
};
// the redesign in the same cradle: the electric board's deck sits on the stand rails where the jet plank was
const BE = (B: Frame): Frame => ({...B, o: a3(B.o, m3(B.y, -0.045 + BD.thick))});
const plankB = (t: number): Frame => {
  const a = PLANK(t) ** 2;
  return {...JB(t), o: a3(a3(JB(t).o, m3(JB0.y, 2.4 * a)), m3(JB0.z, -1.6 * a))};
};
const elecB = (t: number): Frame => {
  const b = 1 - DECK(t);
  const B = BE(JB0);
  const hov = RISE(t) > 0.01 ? 0.012 * Math.sin((t - WS_END) * 5) * sstep(WS_END - 0.3, WS_END + 0.2, t) : 0;
  return frameYPR(a3(a3(B.o, m3(JB0.y, 2.2 * b + RISE(t) + hov)), m3(JB0.z, 1.7 * b)), 20, 0, 0);
};
const jetCam = (t: number): Cam => {
  const c = splineRec(t, WSK);
  const unit = ductWorld(elecB(Math.min(t, ESPIN + 0.5)), WS_UNIT, 0);
  const tgt = lerp3(a3(JB0.o, v3(0, c.ty, 0)), unit, c.wd);
  return {pos: camFrom(tgt, {...c, ty: 0}), tgt, roll: 0, fov: c.fov};
};
/** heat haze: wavering translucent strands rising off the hot nozzles and the deck around them */
const HeatHaze: React.FC<{L: Lens; at: V3[]; k: number; t: number}> = ({L, at, k, t}) => {
  if (k < 0.03) return null;
  const segs: string[] = [];
  at.forEach((a, i) => {
    for (let s = 0; s < 3; s++) {
      const ph = (t * 0.9 + s / 3 + i * 0.13) % 1;
      const pts: string[] = [];
      for (let q = 0; q <= 8; q++) {
        const u = ph * 0.5 + q * 0.04;
        const p3 = v3(a.x + (s - 1) * 0.04 + 0.02 * Math.sin(t * 9 + q * 1.3 + i + s), a.y + u, a.z + 0.02 * Math.cos(t * 8 + q + s));
        if (d3(s3(p3, L.pos), L.f) < 0.1) return;
        const p = L.p(p3);
        pts.push(`${f2(p.x)},${f2(p.y)}`);
      }
      segs.push(`M${pts.join('L')}`);
    }
  });
  return <path d={segs.join('')} stroke="#FFE9C8" strokeOpacity={0.35 * k} strokeWidth={3} fill="none" strokeLinecap="round" />;
};
/** the test stand on its own (four legs and the cradle rails), so the redesigned board can sit in the same cradle */
const TestStand: React.FC<{L: Lens; B: Frame}> = ({L, B}) => {
  const segs: string[] = [];
  const P = (x: number, y: number, z: number) => toW(B, v3(x, y, z));
  const leg = (x: number, z: number) => [P(x, -0.045, z), v3(P(x, -0.045, z).x, 0, P(x, -0.045, z).z)];
  const lines: V3[][] = [leg(-0.3, -0.62), leg(0.3, -0.62), leg(-0.3, 0.62), leg(0.3, 0.62), [P(-0.3, -0.05, -0.62), P(-0.3, -0.05, 0.62)], [P(0.3, -0.05, -0.62), P(0.3, -0.05, 0.62)]];
  for (const [p0, p1] of lines) {
    if (d3(s3(p0, L.pos), L.f) < 0.1 || d3(s3(p1, L.pos), L.f) < 0.1) continue;
    const a = L.p(p0), b = L.p(p1);
    segs.push(`M${f2(a.x)},${f2(a.y)}L${f2(b.x)},${f2(b.y)}`);
  }
  const k = L.p(B.o).k;
  return <path d={segs.join('')} stroke="#5C6670" strokeWidth={f2(Math.max(1.5, 0.035 * k))} strokeLinecap="round" />;
};
/** V6: the scorch the fire leaves at the centre engine's base and the warm light the flames throw on the deck (the
 *  fire's cause is not reported, so no leak, drips or pool are shown: the fire starts at the engine) */
const FireMarks: React.FC<{L: Lens; B: Frame; c: V3; scorch: number; glow: number; id: string}> = ({L, B, c, scorch, glow, id}) => {
  const disk = (q: V3, ra: number, rb: number) => polyD(proj(L, Array.from({length: 28}, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    return a3(q, a3(m3(B.x, Math.cos(a) * ra), m3(B.z, Math.sin(a) * rb * (1 + 0.12 * Math.sin(a * 3)))));
  })));
  const pc = L.p(c);
  return (
    <g>
      {scorch > 0.01 && (
        <g opacity={f2(scorch)}>
          <path d={disk(c, 0.16, 0.13)} fill="#2B231E" opacity={0.55} />
          <path d={disk(a3(c, m3(B.x, 0.02)), 0.09, 0.08)} fill="#1C1714" opacity={0.6} />
        </g>
      )}
      {glow > 0.01 && (
        <g style={{mixBlendMode: 'screen'}} opacity={f2(glow)}>
          <defs>
            <radialGradient id={`${id}-dg`} gradientUnits="userSpaceOnUse" cx={f2(pc.x)} cy={f2(pc.y)} r={f2(0.6 * pc.k)}>
              <stop offset="0" stopColor="#FFB45A" stopOpacity={0.75} />
              <stop offset="0.45" stopColor="#FF8A3A" stopOpacity={0.3} />
              <stop offset="1" stopColor="#FF7A2A" stopOpacity={0} />
            </radialGradient>
          </defs>
          <path d={disk(c, 0.6, 0.5)} fill={`url(#${id}-dg)`} />
        </g>
      )}
    </g>
  );
};
// the fire: round the engines' bases on the deck (where the hot air is drawn in), starting at the centre engine and
// reaching the others in turn; flames at three points round each casing
// V8: the tighter "FIRE. So he switched" join: the fire reaches all five engines a little faster
const FIRE_ORDER: [number, number][] = [[2, 0], [0, 0.12], [1, 0.17], [3, 0.26], [4, 0.31]];
const fireK = (t: number, d: number) => sstep(M.fire - 0.06 + d, M.fire + 0.2 + d, t) * (1 - sstep(M.so - 0.02, M.so + 0.3, t));
/** V7: the redesign view: the room light cools and a measuring grid lies on the floor round the stand */
const RedesignGrid: React.FC<{L: Lens; k: number}> = ({L, k}) => {
  if (k < 0.01) return null;
  const segs: string[] = [];
  const R = 2.0, step = 0.25;
  for (let i = -8; i <= 8; i++) {
    for (const dir of [0, 1]) {
      const a = dir ? v3(i * step, 0.002, -R) : v3(-R, 0.002, i * step);
      const b = dir ? v3(i * step, 0.002, R) : v3(R, 0.002, i * step);
      const ln = clipNear(L, [a, b], 0.2, false);
      if (ln.length < 2) continue;
      segs.push(polyD(proj(L, ln), false));
    }
  }
  return <path d={segs.join(' ')} stroke="#8FD3FF" strokeOpacity={0.32 * k} strokeWidth={2} fill="none" />;
};
const WorkshopScene: React.FC<{id: string; t: number}> = ({id, t}) => {
  const cam = jetCam(t);
  const L = lens(cam);
  const B = plankB(t);
  const r = run(t);
  const h = heat(t);
  const lifts = [0, 1, 2, 3, 4].map((i) => JLIFT(i, t));
  const nozzles = [0, 1, 2, 3, 4].map((i) => jetNozzle(B, i));
  const intakes = [0, 1, 2, 3, 4].map((i) => jetIntake(B, i));
  const recirc = sstep(M.engines - 0.1, M.andCaught, t) * (1 - sstep(M.fire + 0.4, M.so, t));
  // one flame bed per engine (a bed joins its tongues into one band)
  const flameBeds = FIRE_ORDER.map(([i, d]) => [0, 2.1, 4.2].map((a, k) => {
    const [ex, ez] = JET.engines[i];
    const aa = a + i * 0.7;
    return {at: toW(B, v3(ex + Math.cos(aa) * (JET.r + 0.015), 0.004, ez + Math.sin(aa) * (JET.r + 0.015))), size: k === 0 ? 0.13 : 0.09, k: fireK(t, d + k * 0.05)};
  }));
  const fireAll = fireK(t, 0);
  const burn = sstep(M.fire + 0.08, M.so, t);
  const flash = Math.max(0, 1 - Math.abs(t - M.fire - 0.03) / 0.2) ** 2 * 0.3;
  const camUp = d3(s3(L.pos, B.o), B.y) > 0;
  const smokeK = sstep(M.fire + 0.2, M.so, t) * 0.6 * (1 - sstep(M.so + 0.3, M.so + 1.2, t));
  const redesign = sstep(M.so + 0.1, M.so + 0.6, t);
  const eB = elecB(t);
  const thrust = sstep(ESPIN + 0.1, ESPIN + 0.7, t);
  const plankGone = PLANK(t) > 0.999;
  return (
    <g>
      <WorkshopBack id={`${id}-ws`} L={L} t={t} glow={r * 0.5 + 0.7 * fireAll + 0.4 * h} smoke={smokeK} />
      {redesign > 0.01 && <rect x={-50} y={-50} width={1180} height={2020} fill="#1D3A57" opacity={f2(0.32 * redesign)} />}
      <RedesignGrid L={L} k={redesign} />
      <Exhaust id={`${id}-ex`} L={L} nozzles={nozzles} floorY={0} k={r} t={t} />
      <TestStand L={L} B={JB0} />
      {thrust > 0.01 && <AirJets L={L} B={eB} t={t} thrust={thrust} alpha={0.8} reach={0.8} speed={0.5} />}
      {!plankGone && (
        <g>
          {camUp && <Recirc L={L} from={nozzles.map((n) => v3(n.x, 0.05, n.z))} to={intakes} k={recirc} t={t} smooth />}
          <JetBoard id={`${id}-jb`} L={L} B={B} stand={false} st={{phase: jetPhase(t), rps: jetRps(t), burn, heat: Math.max(h, 0.75 * fireAll), casingHeat: h * (1 - redesign), lift: lifts}} overlay={<FireMarks id={`${id}-fm0`} L={L} B={B} c={toW(B, v3(0, 0.004, 0))} scorch={0} glow={0.85 * fireAll} />} />
          {camUp && <HeatHaze L={L} at={intakes.map((n) => a3(n, v3(0, 0.02, 0)))} k={h * (1 - sstep(M.fire - 0.1, M.fire + 0.1, t))} t={t} />}
          <Smoke L={L} at={[toW(B, v3(0, 0.05, 0)), toW(B, v3(0.1, 0.05, 0.4)), toW(B, v3(-0.1, 0.05, -0.4))]} t={t} t0={M.fire + 0.1} k={0.8 * sstep(M.fire, M.fire + 0.3, t) * (1 - sstep(M.so + 0.2, M.so + 0.9, t))} />
          {flameBeds.map((items, n) => <FlameBed key={n} id={`${id}-fl${n}`} L={L} items={items} t={t} />)}
          <Flash id={`${id}-fs`} c={L.p(jetIntake(B, 2))} k={flash} />
        </g>
      )}
      {DECK(t) > 0.001 && <Rider id={`${id}-eb`} L={L} B={eB} pose={lift4(0, 10).pose} noPilot st={{phase: ePhase(t), rps: eRps(t), thrust: 0, built: BUILT(t)}} />}
    </g>
  );
};

/** the workshop's protected region for caption placement: the board (jet or electric) as it sits in frame, and
 *  (V5 final) the bright window and door openings, which a white caption cannot be read against */
const wsFocus = (t: number): Box[] => {
  const L = lens(jetCam(t));
  const B = t < M.so + 0.7 ? JB(t) : elecB(t);
  const pts = [-0.5, 0.5].flatMap((x) => [-0.9, 0.9].flatMap((z) => [0.3, -0.12].map((y) => L.p(toW(B, v3(x, y, z))))));
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const boxes: Box[] = [{x0: Math.max(0, Math.min(...xs) - 30), y0: Math.max(0, Math.min(...ys) - 30), x1: Math.min(1080, Math.max(...xs) + 30), y1: Math.min(1920, Math.max(...ys) + 30)}];
  for (const quad of WS_OPENINGS) {
    const q = clipNear(L, quad, 0.12);
    if (q.length < 3) continue;
    const pp = q.map((v) => L.p(v));
    const b = {x0: Math.min(...pp.map((p) => p.x)) - 10, y0: Math.min(...pp.map((p) => p.y)) - 10, x1: Math.max(...pp.map((p) => p.x)) + 10, y1: Math.max(...pp.map((p) => p.y)) + 10};
    if (b.x1 > 0 && b.x0 < 1080 && b.y1 > 0 && b.y0 < 1920) boxes.push(b);
  }
  return boxes;
};

// ================================================================ 5: learning on the field (V6: one beat per line)
// Every cut lands on its caption's first frame. One continuous practice session low over the pad; the beats are in
// flight6.ts (fieldFlight6). Cameras:
//   F1 "Except there's one HUGE problem": a standing camera off the nose and toe side, so the deck's roll reads as a
//      tilt across the frame; the board lifts, a toe-side roll grows by itself and he catches it, late
//   F2 "The board can't balance itself": a standing camera square to his toe side, so the deck's pitch reads; the nose
//      dips by itself, he sits back; it comes up past level, he leans in
//   F3 "He has to control it with his entire BODY": low and close on his ankles, knees and hips through a toe-side
//      roll, then one eased move back to the whole body for a bigger heel-side roll and a lean that moves the board
//   C1-C2 "while an AI voice coach": the deck phone reading the board's attitude (the sensor), then his own view of the
//      wrist phone showing the same reading while the coach speaks (a waveform in the earbud's colour)
//   C3 "helps him learn": a medium side view, head to knees: the earbud pulses and he changes his stance (wrist down,
//      knees softer, hips over his toes), and the deck comes level
//   C4 "how to balance.": a standing wide view: a fresh gust, met at once and settled
const capAt = (s: string) => Math.round(CAPS.find((c) => c.text.toLowerCase().startsWith(s))!.show * 30) / 30;
const F1 = WS_END, F2 = capAt('the board'), F3 = capAt('he has to'), C1 = capAt('while an'), C2 = M.voice - 0.09, C3 = capAt('helps him'), C4 = capAt('how to balance');
const PR1 = capAt('and after'), PR2 = capAt('he actually'), P2 = capAt('and through'), Q1 = capAt('how much');
const FK6 = {lift: F1 - 0.3, problem: F1 + 0.02, itself: F2, control: F3, body: capAt('with his'), coach: C1, wrist: C2 - 0.2, cue: C3 - 0.05, fix: C3 + 0.04, learned: C4, end: PR1};
const FIELD = fieldFlight6(FK6);
const fieldPos = (t: number) => FIELD(t).B.o;
const F1_CAM = camFrom(FIELD(F1 + 0.12).B.o, ck(-66, 8, 5.0, 42, 0.6, 0));
const F2_CAM = camFrom(FIELD(F2).B.o, ck(-6, 5, 4.4, 42, 0.62, 0));
// F3: tracks the board (a close-up must stay on his legs); eases back to the whole body once the legs have answered
const F3K: Key[] = [[F3, ck(-34, 4, 2.0, 40, 0.46, 0), {hold: true}], [F3 + 0.72, ck(-34, 4, 2.0, 40, 0.46, 0)], [F3 + 1.55, ck(-36, 8, 5.8, 42, 0.72, 0), {hold: true}], [C1, ck(-36, 8, 5.8, 42, 0.72, 0)]];
const fieldCam = (t: number): Cam => {
  if (t < F2) return standPart(F1_CAM, fieldPos, t, F1, 0.6 * sstep(F1, F1 + 1.1, t), 0.6 + 0.05 * sstep(F1, F1 + 0.8, t), 42);
  if (t < F3) return standPart(F2_CAM, fieldPos, t, F2, 0.95, 0.62, 42);
  return trackCam(fieldPos, t, splineRec(t, F3K), 0.6);
};
const C4_CAM = camFrom(FIELD(C4).B.o, ck(-24, 6, 4.6, 42, 0.62, 0));
// V7: one continuous camera through the coach beat (no cuts): the deck phone reading the tilt -> up to the wrist
// phone as the coach speaks -> round to the earbud as the cue lands -> back out along the same side to his body and
// the board as he corrects. Each pose is set up from the body at a fixed moment and carried by the board's drift, so
// the close views never bob with his small moves; the moves between them swing about their targets.
const drift = (t: number, T: number) => s3(smoothPos(fieldPos, t, 0.6), smoothPos(fieldPos, T, 0.6));
const shift = (c: Cam, d: V3): Cam => ({...c, pos: a3(c.pos, d), tgt: a3(c.tgt, d)});
const CK1 = C1, CK2 = M.voice - 0.1, CK3 = C3 - 0.02, CK4 = C3 + 0.3;
// all three views are from his right (the earbud's) side, so the camera never crosses his body
const phoneCam = (t: number): Cam => {
  const jp = pilotJoints(FIELD(CK1).B, FIELD(CK1).pose);
  const phone = toW(FIELD(CK1).B, v3(0, 0.004, 0));
  const pos = a3(a3(a3(phone, m3(jp.up, 0.92)), m3(jp.hL, -0.42)), m3(jp.chF, 0.12));
  return shift({pos, tgt: phone, roll: 0, fov: 40}, drift(t, CK1));
};
const wristCam = (t: number): Cam => {
  // over his right shoulder, just behind the earbud: the wrist screen he is reading, the earbud at the frame's edge
  const T = CK2 + 0.2;
  const jw = pilotJoints(FIELD(T).B, FIELD(T).pose);
  const fd = n3(s3(jw.wriF, jw.elbF));
  const wrist = a3(jw.wriF, m3(fd, -0.07));
  const pos = a3(a3(a3(jw.Hc, m3(jw.hL, -0.3)), m3(jw.hF, -0.34)), m3(jw.up, 0.12));
  return shift({pos, tgt: lerp3(wrist, jw.Hc, 0.18), roll: 0, fov: 46}, drift(t, T));
};
const bodyCam = (t: number): Cam => {
  // a medium view from his right front (the earbud's side), head to knees: the change in his stance in one frame
  const jc = pilotJoints(FIELD(C3).B, FIELD(C3).pose);
  const mid = lerp3(jc.P, jc.S, 0.75);
  const pos = a3(a3(a3(mid, m3(jc.hL, -1.75)), m3(jc.chF, 1.0)), v3(0, 0.25, 0));
  return shift({pos, tgt: a3(mid, v3(0, -0.12, 0)), roll: 0, fov: 44}, drift(t, C3));
};
// (the swing between two close views backs off from the body mid-move, so the camera never passes through his arm)
const swingOut = (a: Cam, b: Cam, k: number, out: number): Cam => {
  const c = swingCam(a, b, k);
  const f = 1 + out * Math.sin(Math.PI * k);
  return {...c, pos: a3(c.tgt, m3(s3(c.pos, c.tgt), f))};
};
const coachCam = (t: number, st: St): Cam => {
  void st;
  if (t < C4) {
    if (t < CK2) return swingCam(phoneCam(t), wristCam(t), sstep(CK1 + 0.24, CK2, t));
    return swingCam(wristCam(t), bodyCam(t), sstep(CK3 + 0.06, C4 - 0.05, t));
  }
  return standPart(C4_CAM, fieldPos, t, C4, 0.85, 0.62, 42);
};

// ================================================================ 6: practice to flight, one continuous move
// "And after just over ten days of practice, he actually flew": another morning, on the riverside flat. One steady low
// front three-quarter track (the same side and screen direction as the opening): he lifts off from rest, a small
// wobble caught at once, accelerates toward the river, crosses the shoreline and climbs out over the water.
const PRK = ck(246, 3, 5.2, 46, 0.6, 0);
const prPos = (t: number) => flight6(t, PR1).B.o;
const prCam = (t: number) => trackCam(prPos, t, PRK, 0.4);

// ================================================================ 7: the river crossing, then the canyon (separate places)
// "across a RIVER": the same flight further out, from high off his side: the shore he left falls away behind him,
// channel buoys pass beneath, and the camera keeps rising, so the width of the river (the scale) opens up as he goes.
// V7: alongside and a little above him first (the far shore and the town sliding past behind), then rising to a high
// angle that looks down past him to the water far below
const CRK: Key[] = [[PR2, ck(278, 6, 8.0, 50, 0.8, 0)], [M.river2, ck(292, 32, 11.5, 52, 0.4, 0)], [P2, ck(298, 46, 14.5, 54, 0.2, 0)]];
const crCam = (t: number) => trackCam(prPos, t, splineRec(t, CRK));
// "and THROUGH a CANYON": a cut to the canyon flight, a separate demonstration. We join it deep inside the gorge (no
// river behind him), at about 6 m over its water, tracked from behind with both walls and the way ahead in frame.
const TIN = P2 - 10;
// V7: low over the water beside the right-hand wall, the rock face streaming past in the foreground with him small in
// the middle of the gorge; then the camera rises behind him so both walls tower over him, the gorge running on ahead
const PAYK: Key[] = [[P2, ck(10, -16, 12, 60, 1.4, 0)], [M.canyon + 0.1, ck(5, -2, 14, 58, 2.0, 0)], [Q1, ck(0, 14, 20, 56, 3.0, 0)]];
const payPos = (t: number) => payoff4(t, TIN).B.o;
const payCam = (t: number) => trackCam(payPos, t, splineRec(t, PAYK));
/** channel buoys: foreground and background objects passing at their own depth (speed and scale) */
const BUOYS = [[-5.5, 88], [-7.5, 101], [-6.5, 60], [-34, 30], [-47, 70], [-33, 118]].map(([x, z]) => v3(x, 0, z));
const Buoys: React.FC<{L: Lens; t: number}> = ({L, t}) => (
  <g>
    {BUOYS.filter((b) => l3(s3(b, L.pos)) < 160).sort((a, b) => l3(s3(b, L.pos)) - l3(s3(a, L.pos))).map((b, i) => <Buoy key={i} L={L} at={b} t={t} />)}
  </g>
);

// ================================================================ 8: the question and the loop (the hook's trajectory, tau = t - DUR)
// V6: back on the Yangtze, one continuous crane from high and wide down to frame 0's low front three-quarter view while
// the question is asked: he flies on over the water, a gust correction and its smaller echo under the line, the camera
// coming down and in (elevation and distance change one way only), landing on frame 0's key with the camera's velocity
// carried through the loop point.
const ENDK: Key[] = [
  // V7: a strong aerial view first, high over the river with the water far beneath him, then down and in to the
  // opening's high front three-quarter view (frame 0)
  [Q1, ck(262, 52, 22, 52, 0.0, 0)],
  [M.pay + 0.3, ck(255, 32, 11.5, 50, 0.25, 0)],
  [LOOPK[0], LOOPK[1]],
  [DUR, OPENK[1][1]],
  // beyond the loop point: the opening's next key, so the camera's velocity carries straight through frame 0
  [DUR + OPENK[2][0], OPENK[2][1]],
];
const endCam = (t: number): Cam => trackCam((u: number) => hook4(u - DUR).B.o, t, splineRec(t, ENDK));

// ================================================================ the shot list
const riverShot = (name: string, from: number, to: number, stAt: (t: number) => St, camAt: (t: number) => Cam, o: {blur?: (t: number) => boolean; surface?: (t: number) => 'water' | 'ground'; water?: (t: number) => number; jets?: (t: number) => number; reach?: (t: number) => number; pov?: (t: number) => boolean; buoys?: boolean; gorgeWater?: number; gorge?: boolean; tint?: number; clock?: (t: number) => number} = {}): Shot => ({
  name, from, to,
  draw: (t, pre) => {
    const st = stAt(t);
    const L = lens(camAt(t));
    const L2 = o.blur?.(t) ? lens(camAt(t - SHUT)) : undefined;
    return <FlightScene id={`${pre}${name.slice(0, 3)}`} t={o.clock ? o.clock(t) : t} st={st} L={L} L2={L2} set="river" surface={o.surface?.(t) ?? 'water'} water={o.water?.(t)} jets={o.jets?.(t) ?? 1} reach={o.reach?.(t)} pov={o.pov?.(t)} buoys={o.buoys} gorgeWater={o.gorgeWater} gorge={o.gorge} tint={o.tint} />;
  },
  focus: (t) => box(lens(camAt(t)), stAt(t)),
});
const fieldShot = (name: string, from: number, to: number, camAt: (t: number) => Cam, extra?: {jets?: (t: number) => number}): Shot => ({
  name, from, to,
  draw: (t, pre) => {
    const st = FIELD(t);
    return <FlightScene id={`${pre}${name.slice(0, 3)}`} t={t} st={st} L={lens(camAt(t))} set="field" surface="ground" coach={st.pulse} jets={extra?.jets?.(t) ?? 1} />;
  },
  focus: (t) => box(lens(camAt(t)), FIELD(t)),
});
const pr = (t: number) => flight6(t, PR1);

export const SHOTS8: Shot[] = [
  {
    name: 'opening: flight, the underside, inside one unit, the air to the water (one camera)', from: 0, to: CUT2,
    draw: (t, pre) => {
      const st = hook4(t);
      const L = lens(hookCam(t));
      return <FlightScene id={`${pre}op`} t={t} st={st} L={L} set="river" surface="water" count={t > M.ten - 0.1 && t < M.electric ? (t - M.ten) / (M.powerfulE - M.ten) : 0}
        jets={t < M.electric ? 1 : 1 + 0.45 * sstep(M.electric, M.electric + 0.4, t)} reach={t < CUT_AIR ? 1.3 + 1.9 * sstep(M.electric, M.electric + 0.5, t) : 1.16 * st.alt}
        extra={<OpeningExtra id={`${pre}ox`} t={t} L={L} st={st} />} />;
    },
    focus: (t) => {
      const L = lens(hookCam(t)), st = hook4(t);
      // inside the board (the reveal and the section) the whole middle of the frame is the subject
      if (t >= CUT_UNDER && t < CUT_AIR + 0.5) return {x0: 60, y0: 560, x1: 1020, y1: 1380};
      return box(L, st);
    },
  },
  {
    name: 'the lift on the riverside flat (standing camera)', from: CUT2, to: M.but,
    draw: (t, pre) => {
      const st = lift4(t, MATCH);
      return <FlightScene id={`${pre}lf`} t={t} st={st} L={lens(liftCam(t))} set="river" surface="ground" blow />;
    },
    focus: (t) => box(lens(liftCam(t)), lift4(t, MATCH)),
  },
  {name: 'the jet prototype test and the redesign on the same stand (workshop)', from: M.but, to: WS_END, draw: (t, pre) => <WorkshopScene id={`${pre}ws`} t={t} />, focus: (t) => wsFocus(t)},
  {
    ...fieldShot('balance: the problem, the tendency, the legs, the whole body', F1, C1, fieldCam),
    // in the legs close-up the action is the knees, ankles and deck (the jacket fills the top of the frame): keep the
    // caption off them
    focus: (t) => (t >= F3 && t < F3 + 1.2 ? {x0: 0, y0: 760, x1: 1080, y1: 1920} : box(lens(fieldCam(t)), FIELD(t))),
  },
  {
    name: 'the AI coach: deck phone (sensing), wrist phone (coaching), earbud and the change in his stance, the recovery', from: C1, to: PR1,
    draw: (t, pre) => {
      const st = FIELD(t);
      return <FlightScene id={`${pre}fd`} t={t} st={st} L={lens(coachCam(t, st))} set="field" surface="ground" coach={st.pulse} jets={t < CK3 ? 0.4 : 1} />;
    },
    focus: (t) => (t < CK2 + 0.3 ? {x0: 180, y0: 560, x1: 900, y1: 1360} : t < C4 ? {x0: 0, y0: 0, x1: 1080, y1: 1360} : box(lens(coachCam(t, FIELD(t))), FIELD(t))),
  },
  riverShot('practice to flight: lift-off on the flat, over the shoreline, out over the water (tracking)', PR1, PR2, pr, prCam, {
    surface: (t) => (pr(t).pos.z < 0 ? 'ground' : 'water'), water: (t) => sstep(-1.0, 3.0, pr(t).pos.z), tint: 0.35,
  }),
  riverShot('across the river: the shore falls behind, the river opens up (high tracking)', PR2, P2, pr, crCam, {
    surface: (t) => (pr(t).pos.z < 0 ? 'ground' : 'water'), water: (t) => sstep(-1.0, 3.0, pr(t).pos.z), tint: 0.35,
  }),
  riverShot('the canyon flight (a separate demonstration), deep in the gorge (tracking)', P2, Q1, (t) => payoff4(t, TIN), payCam, {gorge: true, gorgeWater: -70, tint: 0.15}),
  {
    name: 'ending: one crane down over the river onto frame 0', from: Q1, to: DUR + 1,
    draw: (t, pre) => {
      const st = hook4(t - DUR);
      // the scene's clock runs on the hook's own time (t - DUR), so water, wash and rotors are continuous through the loop
      return <FlightScene id={`${pre}en`} t={t - DUR} st={st} L={lens(endCam(t))} set="river" surface="water" />;
    },
    // V8: from "PAY YOU" the "YOUR PRICE?" line sits under the board (Film8 PRICE): keep the captions off it
    focus: (t) => (t >= M.pay - 1.2 ? [box(lens(endCam(t)), hook4(t - DUR)), {x0: 60, y0: 1160, x1: 1020, y1: 1345}] : box(lens(endCam(t)), hook4(t - DUR))),
  },
];
/** every picture cut: the shot boundaries and the cuts inside shots (workshop, balance, coach) */
export const CUTS8 = [...SHOTS8.slice(1).map((s) => s.from), F2, F3, C4].sort((a, b) => a - b);
/** V6: the timing of the visible events the sound follows (exported to the mix by tools/export_cues_v6.ts) */
export const BEATS8 = {...FK6, shore: PR1 + 1.74, gust: GUST_AT, iris: CUT_UNDER + 0.25, wsJets: M.so + WSC * 0.12, wsPlank: M.so + WSC * 0.5, wsDeck: M.so + WSC * 0.68, wsUnits: M.so + WSC * 1.2, wsSpin: ESPIN, wsRise: WS_END - 0.54};
export const shotAt8 = (t: number) => SHOTS8.find((s) => t >= s.from && t < s.to) ?? SHOTS8[SHOTS8.length - 1];
export type {Box, CK};
export {toW};

/** QC: the rider's state and the lens for frame time t (null when no rider is in the shot) */
export const riderView8 = (t: number): {L: Lens; st: St} | null => {
  if (t < CUT2) return {L: lens(hookCam(t)), st: hook4(t)};
  if (t < M.but) return {L: lens(liftCam(t)), st: lift4(t, MATCH)};
  if (t < WS_END) return null;
  if (t < C1) return {L: lens(fieldCam(t)), st: FIELD(t)};
  if (t < PR1) return {L: lens(coachCam(t, FIELD(t))), st: FIELD(t)};
  if (t < PR2) return {L: lens(prCam(t)), st: pr(t)};
  if (t < P2) return {L: lens(crCam(t)), st: pr(t)};
  if (t < Q1) return {L: lens(payCam(t)), st: payoff4(t, TIN)};
  return {L: lens(endCam(t)), st: hook4(t - DUR)};
};
