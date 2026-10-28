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
import {JetBoard, jetFuelLine, jetIntake, jetNozzle} from '../art/JetBoard';
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
import {sstep} from '../story/flight';
import {ca, ck, CK, Key, orbitAnch, orbitBoard, splineRec} from '../story/cam';
import {Rider, RiderShadow} from '../story/rider';
import {CAPS, DUR} from '../story/time';
import {aboveGround, blendCam, Box, M, riderBox, Shot, swingCam, toOrbit, unwrap} from '../v2/shots2';
import {fieldFlight6, flight6, GORGE4, GUST_AT, hook4, inventor4, lift4, payoff4, REST, St} from './flight6';

export {M};
const NEAR = 150; // the riverside flat between the water and the near-bank hills (m)

// ================================================================ shared scene: a flight over water or ground
type SceneP = {id: string; t: number; st: St; L: Lens; L2?: Lens; set: 'river' | 'field'; surface: 'water' | 'ground'; tint?: number; coach?: number; pov?: boolean; jets?: number; reach?: number; sun?: V3; buoys?: boolean; extra?: React.ReactNode; under?: React.ReactNode; water?: number; gorgeWater?: number; gorge?: boolean};
// V6: the river set has no gorge cut into its far bank except in the canyon shot, so the Yangtze crossing never leads
// into the canyon (they were separate demonstrations)
const FlightScene: React.FC<SceneP> = ({id, t, st, L, L2, set, surface, tint = 0, coach = 0, pov, jets = 1, reach, sun, buoys, extra, under, water, gorgeWater, gorge}) => (
  <g>
    {set === 'river'
      ? <RiverBack id={`${id}-rv`} L={L} t={t} gorge={gorge ? GORGE4 : undefined} near={NEAR} L2={L2} tint={tint} cliffs shoal={SHOAL} wind={0.3 + 0.5 * Math.max(0, 1 - st.alt / 4)} gorgeWater={gorgeWater} />
      : <FieldBack id={`${id}-fd`} L={L} t={t} tint={tint} wind={0.3 + st.thrust * 0.6 * Math.max(0, 1 - (st.alt - REST) / 3)} />}
    {buoys && <Buoys L={L} t={t} />}
    {under}
    {/* V5: over the shoreline the downwash and the shadow blend from ground to water (water = 0..1) instead of
        switching in one frame */}
    {(water ?? (surface === 'water' ? 1 : 0)) < 0.999 && <Wash id={`${id}-wg`} L={L} at={st.pos} alt={st.alt} thrust={st.thrust * (1 - (water ?? 0))} t={t} vel={st.vel} surface="ground" foam={1} soft />}
    {(water ?? (surface === 'water' ? 1 : 0)) > 0.001 && <Wash id={`${id}-wa`} L={L} at={st.pos} alt={st.alt} thrust={st.thrust * (water ?? 1)} t={t} vel={st.vel} surface="water" foam={1} soft />}
    {st.alt < 14 && <RiderShadow L={L} B={st.B} pose={st.pose} sun={sun ?? (set === 'river' ? RSUN : undefined)} minOp={set === 'river' ? 1.1 : 0.35} color={mix('#24361F', '#0B2427', water ?? (surface === 'water' ? 1 : 0))} />}
    {!below(L, st) && <AirJets L={L} B={st.B} t={t} thrust={st.thrust} vel={st.vel} alpha={Math.min(1, jets)} reach={reach} dense={Math.max(0, jets - 1)} speed={set === 'field' ? 0.4 : 1} />}
    <Rider id={id} L={L} B={st.B} pose={st.pose} coach={coach} pov={pov} voice={st.voice ? {k: st.voice, t} : undefined} st={{phase: t * 2.6, rps: st.rps > 20 ? 14 : st.rps, thrust: st.thrust, tilt: {pitch: st.pitch, roll: st.roll}}} />
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

// ================================================================ 1: the opening crossing and the mechanism (one flight over the Yangtze)
// V6: 0-1.6 s one strong low front three-quarter tracking angle from his toe side, held: the river, the gravel bar and
// the channel buoys stream past, his knees take a heave; at 1.35 s a gust rolls the deck a few degrees and his whole
// body answers it (flight6.ts); 1.6-3.37 s one steady rise and pull-back to the crossing (elevation, distance and
// azimuth each change one way only), which shows his height over the water. Cut on the
// "You see" caption to a still underside close-up for the ten fans; cut on "blast" to a low tracking view of the air
// reaching the water.
export const SHOAL = {x: 4, z: 104, len: 48, wid: 11};
const MATCH = M.lifting - 0.74; // the lift's own clock
// the caption for "You see" appears two frames before the word: the cut lands on the same frame
const CUT_UNDER = Math.round(CAPS.find((c) => c.text.toLowerCase().startsWith('you see'))!.show * 30) / 30;
const CUT_AIR = M.blast - 0.02;
// the cut to the riverside flat lands on the "lifting you completely" caption (and the board is already lifting)
const CUT2 = Math.round(CAPS.find((c) => c.text.toLowerCase().startsWith('lifting'))!.show * 30) / 30;
// the ending's last key before the loop (shared, so the camera velocity at frame 0 is the same on both sides)
const LOOPK: [number, CK] = [M.thingE + 0.6, ck(249.5, -8, 4.6, 44, 0.7, 0)];
const HOOKK: Key[] = [
  [LOOPK[0] - DUR, LOOPK[1]],
  [0.0, ck(252, -8, 4.6, 44, 0.7, 0)],
  [0.7, ck(254, -8, 4.6, 44, 0.69, 0)],
  [1.6, ck(255.2, -8, 4.62, 44, 0.68, 0), {hold: true}],
  // the rise ends low (2 degrees): the far bridge deck then stays behind his body instead of sliding up past his head
  [CUT_UNDER, ck(263, -3, 7.6, 44, 0.85, 0)],
];
// V5: the underside is held still from almost straight below, so the board fills the frame and hides the rider
// (a steeper view showed his face from under the chin); the air shot is low and wide enough to hold the board, its
// jets and the churned patch where they reach the water, with the bridge clear of the board
const UNDK: Key[] = [[CUT_UNDER, ck(258, -80, 3.3, 58, 0.05, 0, 0, 0.12)], [CUT_AIR, ck(258, -80, 3.3, 58, 0.05, 0, 0, 0.12)]];
const AIRK: Key[] = [[CUT_AIR, ck(250, 3, 11.5, 46, -1.5, 0, 0, -1.1)], [CUT2, ck(251.5, 3, 11.6, 46, -1.55, 0, 0, -1.1)]];
const hookPos = (t: number) => hook4(t).B.o;
const hookCam = (t: number): Cam => {
  if (t < CUT_UNDER) return trackCam(hookPos, t, splineRec(t, HOOKK));
  if (t < CUT_AIR) return orbitBoard(hook4(t).B, splineRec(t, UNDK));
  return trackCam(hookPos, t, splineRec(t, AIRK));
};

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
const LIFT_CAM = v3(-40 + 8.0, 1.5, -26 + 4.5);
const LIFT_FY = 0.6;
// V5 (final): the tilt eases in from rest at the cut (he starts to rise in the frame first), and the pan follows his
// move off with a share that falls away as he goes, so it peaks mid-move and is slowing at the cut instead of
// accelerating into it; he travels on toward frame right
const LIFT_PAN = 1.2;
const liftCam = (t: number): Cam => {
  const p0 = liftPos(CUT2);
  const p = smoothPos(liftPos, t, 0.6);
  const dz = p.z - p0.z;
  const tg = v3(p0.x + 0.6 * (p.x - p0.x), 1.35 + LIFT_FY * sstep(CUT2, CUT2 + 0.55, t) * (p.y - p0.y), p0.z + LIFT_PAN * (1 - Math.exp(-dz / LIFT_PAN)));
  return {pos: LIFT_CAM, tgt: tg, roll: 0, fov: 42};
};

// ================================================================ 3: the jet prototype test (workshop)
const JB = (t: number) => {
  const vib = 0.008 * sstep(M.engines + 0.2, M.andCaught + 0.2, t) * (1 - sstep(M.fireE + 0.2, M.fireE + 0.7, t));
  return frameYPR(v3(noise1(t * 40, 1) * vib, 0.92 + noise1(t * 43, 2) * vib, noise1(t * 37, 3) * vib), 20, 0, 0);
};
const INV = frameYPR(v3(-2.7, 0, 0.5), 40, 0, 0);
const ign = (t: number) => sstep(M.but + 0.75, M.but + 1.05, t); // starters click, the compressors begin to turn
const run = (t: number) => sstep(M.jet - 0.2, M.jet + 0.35, t) * (1 - sstep(M.fireE + 0.15, M.fireE + 0.6, t));
const heat = (t: number) => sstep(M.engines + 0.1, M.fire - 0.05, t) * (1 - 0.55 * sstep(M.so - 0.3, M.so + 0.5, t));
// V5: the drawn compressor blades turn at most 1 turn/s (12 degrees a frame, under a third of the blade spacing), so
// they never strobe or appear to run backward; above that the speed shows as blur (from jetRps), not as rotation
const ssI = (a: number, b: number, t: number) => {
  const s = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return (b - a) * (s ** 3 - s ** 4 / 2) + Math.max(0, t - b);
};
const jetPhase = (t: number) => -(ssI(M.but + 0.75, M.but + 1.05, t) - 0.9 * ssI(M.fireE, M.so - 0.2, t));
const jetRps = (t: number) => 2 + 7 * ign(t) + 22 * run(t) - 6 * sstep(M.fireE, M.so - 0.2, t);
// W1 "But his first version": from above, the whole prototype on its stand, the camera settling down a little;
// W2 "used JET ENGINES": cut to a low mechanical close-up under the deck; W3 "and caught FIRE": cut to a high
// three-quarter view of the deck top, where the leak, the vapour and the fire are; it stays with the prototype as the
// fire dies, then rises slowly back as the redesign takes its place, ending on the framing the field shot continues.
// All from the same side of the stand, so the prototype keeps its orientation.
const W2 = M.jet, W3 = M.andCaught - 0.15;
// (V5 final: one angle with a slight straight push in; a change of elevation round the fixed board read as an orbit)
const W1K: Key[] = [[M.but, ck(-50, 60, 2.4, 54, 0.0, 0)], [W2, ck(-50, 60, 2.3, 54, 0.0, 0)]];
// (V5: held at one angle with a slight push in; the 8 degree arc this close read as an orbit round the engines)
const W2K: Key[] = [[W2, ck(-42, -7, 1.66, 50, -0.3, 0)], [W3, ck(-42, -7, 1.58, 50, -0.3, 0)]];
// V5: W3 holds near-still on the fire. At the peak of the smoke (when it fills the frame) a cut to W4, already on
// the field shot's side of the stand; as the smoke clears W4 makes one slow move, back and down (no arc round the stand).
const W4 = M.so + 0.08;
const W3K: Key[] = [
  // (V5 final: one angle, easing straight back; the azimuth and elevation creep read as a slow orbit round the fire)
  [W3, ck(-55, 28, 1.7, 48, 0.02, 0)],
  [M.fireE, ck(-55, 28, 1.8, 48, 0.02, 0)],
  [W4, ck(-55, 28, 2.0, 48, 0.02, 0)],
];
const W4K: Key[] = [
  [W4, ck(-89, 17, 4.7, 44, 0.6, 0), {hold: true}],
  [M.except, ck(-90, 14, 5.8, 42, 0.75, 0)],
];
const jetCam = (t: number): Cam => {
  const B = JB(Math.min(t, M.so));
  if (t < W2) return orbitBoard(B, splineRec(t, W1K));
  if (t < W3) return aboveGround(orbitBoard(B, splineRec(t, W2K)), 0.12);
  if (t < W4) return orbitBoard(B, splineRec(t, W3K));
  return orbitBoard(B, splineRec(t, W4K));
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
/** a dense, drifting bank of smoke over the stand (soft blurred puffs around a centre point), k = 0..1 cover */
const SmokeVeil: React.FC<{id: string; L: Lens; c: V3; k: number; t: number}> = ({id, L, c, k, t}) => {
  if (k < 0.01) return null;
  const puffs: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.4 * noise1(i * 1.7, 41);
    const r = 0.25 + 0.45 * ((i * 37) % 7) / 7;
    const q = a3(c, v3(Math.cos(a) * r + 0.12 * Math.sin(t * 0.9 + i), 0.12 * Math.sin(i * 2.3) + 0.25 * (t - M.so) + 0.05 * i % 0.3, Math.sin(a) * r * 0.8));
    if (d3(s3(q, L.pos), L.f) < 0.15) continue;
    const p = L.p(q);
    const g = 92 + ((i * 13) % 5) * 8;
    puffs.push(<circle key={i} cx={f2(p.x)} cy={f2(p.y)} r={f2((0.42 + 0.12 * Math.sin(i)) * p.k)} fill={`rgb(${g},${g - 3},${g - 6})`} />);
  }
  const pc = L.p(c);
  return (
    <g opacity={Math.min(1, k * 1.15)}>
      <defs>
        <filter id={`${id}-b`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={f2(0.09 * pc.k)} />
        </filter>
      </defs>
      <g filter={`url(#${id}-b)`}>
        <ellipse cx={f2(pc.x)} cy={f2(pc.y)} rx={f2(1.0 * pc.k)} ry={f2(0.7 * pc.k)} fill="rgb(104,101,97)" />
        {puffs}
      </g>
    </g>
  );
};
/** V5: the room full of smoke: an opaque grey with lighter and darker billows rolling across it, so the frame is never
 *  a frozen flat grey and the cut and the board swap underneath it cannot show. (V5 final: stronger light and dark
 *  billows that roll and rise at 3-7 px a frame; positions run from the smoke's own clock, never wrapping.) */
const FogMotion: React.FC<{id: string; t: number; k: number}> = ({id, t, k}) => {
  const tt = t - M.so;
  const puffs = Array.from({length: 12}, (_, i) => {
    const x = (-0.15 + ((i * 0.53) % 1.3) + tt * (0.12 + 0.05 * (i % 3)) * (i % 2 ? 1 : -1)) * 1080;
    const y = (0.04 + ((i * 0.29) % 0.95)) * 1920 - tt * 110 * (1 + (i % 3) * 0.5);
    const g = [150, 74, 120][i % 3];
    return <circle key={i} cx={f2(x)} cy={f2(y)} r={f2(230 + (i % 4) * 60)} fill={`rgb(${g},${g - 3},${g - 6})`} opacity={0.62} />;
  });
  return (
    <g opacity={f2(k)}>
      <defs>
        <filter id={`${id}-b`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={80} />
        </filter>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="rgb(106,103,99)" />
      <g filter={`url(#${id}-b)`}>{puffs}</g>
    </g>
  );
};
/** V6: the electric board's fans spin up and their air pushes the last of the smoke off the stand, outward and down
 *  (the design change carries the end of the scene, not a pan over a still board) */
const SmokePush: React.FC<{id: string; L: Lens; c: V3; t: number; t0: number}> = ({id, L, c, t, t0}) => {
  const age = t - t0;
  if (age < 0 || age > 1.3) return null;
  const puffs: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.3 * noise1(i * 1.3, 51);
    const r = 0.35 + 1.5 * (1 - Math.exp(-age * 2.2)) * (0.8 + 0.4 * hash(i, 52));
    const q = a3(c, v3(Math.cos(a) * r, -0.35 * (1 - Math.exp(-age * 2.0)) + 0.1 * Math.sin(i), Math.sin(a) * r * 0.8));
    // (a puff blown toward the camera fades out before it reaches it, instead of vanishing at the near plane)
    const dz = d3(s3(q, L.pos), L.f);
    const near = sstep(0.4, 1.4, dz);
    if (near < 0.01) continue;
    const p = L.p(q);
    const g = 104 + ((i * 13) % 5) * 9;
    puffs.push(<circle key={i} cx={f2(p.x)} cy={f2(p.y)} r={f2((0.28 + 0.2 * age) * p.k)} fill={`rgb(${g},${g - 3},${g - 6})`} opacity={f2(0.55 * near * Math.max(0, 1 - age / 1.3) * Math.min(1, age * 6))} />);
  }
  const pc = L.p(c);
  return (
    <g>
      <defs>
        {/* a fixed frame-sized region: a region sized from the puffs' bounding box shrank when one puff faded out and
            cut off the others' blur in one frame */}
        <filter id={`${id}-b`} filterUnits="userSpaceOnUse" x={-300} y={-300} width={1680} height={2520}>
          <feGaussianBlur stdDeviation={f2(0.06 * pc.k)} />
        </filter>
      </defs>
      <g filter={`url(#${id}-b)`}>{puffs}</g>
    </g>
  );
};
// the redesign in the same cradle: the electric board's deck sits on the stand rails where the jet plank was
const BE = (B: Frame): Frame => ({...B, o: a3(B.o, m3(B.y, -0.045 + BD.thick))});
// V5: the electric board comes out of the smoke complete (the unit-by-unit seating popped and cut through the rim),
// then powers up: the fans spin up smoothly, at most 1.6 turns/s drawn (19 degrees a frame for five blades)
const ePhase = (t: number) => 1.6 * ssI(M.switched, M.except - 0.4, t);
const WorkshopScene: React.FC<{id: string; t: number}> = ({id, t}) => {
  const cam = jetCam(t);
  const L = lens(cam);
  const B = JB(Math.min(t, M.so));
  const r = run(t);
  const h = heat(t);
  const nozzles = [0, 1, 2, 3, 4].map((i) => jetNozzle(B, i));
  const intakes = [0, 1, 2, 3, 4].map((i) => jetIntake(B, i));
  const recirc = sstep(M.engines + 0.3, M.andCaught + 0.1, t) * (1 - sstep(M.fire + 0.1, M.fire + 0.6, t));
  // V6: the fire starts at the base of the centre engine, climbs its casing to the fuel fitting and runs back along
  // that line (the affected equipment); it dies down and leaves the scorch. No cause is shown (none is reported).
  const fl = jetFuelLine(B, 2);
  const pool = toW(B, v3(0.12, 0.004, -0.03));
  const along = (u: number) => (u < 0.2 ? lerp3(pool, fl[2], u / 0.2) : u < 0.6 ? lerp3(fl[2], fl[1], (u - 0.2) / 0.4) : lerp3(fl[1], fl[0], (u - 0.6) / 0.4));
  const spread = sstep(M.fire, M.fire + 1.1, t);
  // the vapour flashes and the flame grows over a quarter second; when the fuel is shut off it dies down over half a second
  // V5 (final): it is out (with the scorch showing) before the smoke closes in, rather than dying under it
  const out = sstep(M.fireE - 0.05, M.fireE + 0.38, t);
  const fireK = sstep(M.fire - 0.04, M.fire + 0.22, t) * (1 - out);
  // V5: each tongue of flame grows in place as the fire runs along the line (no clusters appearing in one frame)
  // the flame climbs from the engine's base to the fitting, then runs along the line (anchors every few cm)
  const FL: [number, number][] = [[0, 0.15], [0.07, 0.09], [0.14, 0.1], [0.2, 0.13], [0.33, 0.11], [0.45, 0.12], [0.58, 0.1], [0.7, 0.11]];
  const flames = FL.map(([u, size]) => ({at: along(u), size, k: fireK * Math.min(1, Math.max(0, (spread * 0.95 + 0.01 - u) / 0.1))}));
  const burn = sstep(M.fire + 0.08, M.fire + 0.8, t);
  // (V5 final: a softer, slightly longer bloom; the stronger one pumped the whole frame like an exposure flicker)
  const flash = Math.max(0, 1 - Math.abs(t - M.fire - 0.03) / 0.2) ** 2 * 0.3;
  const react = sstep(M.fire - 0.02, M.fire + 0.3, t) * (1 - sstep(M.so - 0.2, M.so + 0.3, t));
  const flinch = sstep(M.fire, M.fire + 0.16, t) * (1 - sstep(M.fire + 0.8, M.fire + 1.3, t));
  const jInv = pilotJoints(INV, inventor4(react, flinch));
  const invNear = (cam.pos.x - INV.o.x) ** 2 + (cam.pos.z - INV.o.z) ** 2 < 0.5;
  // V5: the smoke left by the fire thickens into a veil over the stand, the prototype is swapped while it is hidden,
  // and the smoke clears on the new electric frame sitting in the same cradle (no see-through overlap of two boards)
  // (V5 final: it clears with the room's smoke, so the new board is not revealed after the stand around it)
  const veil = sstep(M.so - 0.45, M.so - 0.05, t) * (1 - sstep(M.so + 0.16, M.so + 0.5, t));
  // V5: for a moment the smoke fills the whole room (it hides the stand legs and the walls too), and the cut to the
  // new side and the swap of the boards both happen inside it
  const fog = sstep(M.so - 0.3, M.so - 0.02, t) * (1 - sstep(M.so + 0.22, M.so + 0.6, t));
  const swap = t < M.so + 0.12 ? 0 : 1;
  const camUp = d3(s3(L.pos, B.o), B.y) > 0;
  const smokeK = sstep(M.fire + 0.2, M.so, t) * 0.6 * (1 - sstep(M.so - 0.2, M.switched + 0.2, t));
  return (
    <g>
      <WorkshopBack id={`${id}-ws`} L={L} t={t} glow={(r * 0.5 + 0.7 * fireK + 0.3 * h) * (1 - swap)} smoke={smokeK} />
      <Exhaust id={`${id}-ex`} L={L} nozzles={nozzles} floorY={0} k={r} t={t} />
      <TestStand L={L} B={B} />
      {swap < 1 && (
        <g opacity={1 - swap}>
          {/* the hot air curls up round the deck edge: drawn under the deck, which hides the part beneath it; never
              seen from below (it would cross the deck's underside) */}
          {camUp && <Recirc L={L} from={nozzles.map((n) => v3(n.x, 0.05, n.z))} to={intakes} k={recirc} t={t} smooth />}
          {/* (the flames' light warms the casings: the engines' heat glow carries it) */}
          <JetBoard id={`${id}-jb`} L={L} B={B} stand={false} st={{phase: jetPhase(t), rps: jetRps(t), burn, heat: Math.max(h, 0.75 * fireK)}} overlay={<FireMarks id={`${id}-fm0`} L={L} B={B} c={pool} scorch={sstep(M.fire + 0.15, M.fireE + 0.35, t)} glow={0.85 * fireK} />} />
          {camUp && <HeatHaze L={L} at={nozzles.map((n) => a3(n, v3(0, 0.12, 0)))} k={h * (1 - burn * 0.6) * (1 - sstep(M.fire - 0.1, M.fire + 0.1, t))} t={t} />}
          <Smoke L={L} at={[along(0), along(0.45)]} t={t} t0={M.fire + 0.1} k={0.8 * sstep(M.fire, M.fire + 0.3, t) * (1 - sstep(M.so - 0.5, M.so + 0.2, t))} />
          <FlameBed id={`${id}-fl`} L={L} items={flames} t={t} />
          <Flash id={`${id}-fs`} c={L.p(fl[2])} k={flash} />
        </g>
      )}
      {swap > 0 && <Rider id={`${id}-eb`} L={L} B={BE(B)} pose={lift4(0, 10).pose} noPilot st={{phase: ePhase(t), rps: 9 * sstep(M.switched, M.except - 0.4, t), thrust: 0, built: 10}} />}
      <SmokeVeil id={`${id}-sv`} L={L} c={a3(B.o, v3(0, 0.15, 0))} k={veil} t={t} />
      <SmokePush id={`${id}-sp`} L={L} c={a3(B.o, v3(0, 0.1, 0))} t={t} t0={M.switched - 0.05} />
      {fog > 0.005 && <FogMotion id={`${id}-fm`} t={t} k={fog} />}
    </g>
  );
};

/** the workshop's protected region for caption placement: the board (jet or electric) as it sits in frame, and
 *  (V5 final) the bright window and door openings, which a white caption cannot be read against */
const wsFocus = (t: number): Box[] => {
  const L = lens(jetCam(t));
  const B = JB(Math.min(t, M.so));
  const pts = [-0.5, 0.5].flatMap((x) => [-0.9, 0.9].flatMap((z) => [0.3, -0.12].map((y) => L.p(toW(B, v3(x, y, z))))));
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const boxes: Box[] = [{x0: Math.min(...xs) - 30, y0: Math.min(...ys) - 30, x1: Math.max(...xs) + 30, y1: Math.max(...ys) + 30}];
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
const F1 = M.except, F2 = capAt('the board'), F3 = capAt('he has to'), C1 = capAt('while an'), C2 = M.voice - 0.09, C3 = capAt('helps him'), C4 = capAt('how to balance');
const PR1 = capAt('and after'), PR2 = capAt('he actually'), P2 = capAt('and through'), Q1 = capAt('how much');
const FK6 = {lift: F1 + 0.12, problem: M.huge - 0.25, itself: F2, control: F3, body: capAt('with his'), coach: C1, wrist: C2, cue: C3 - 0.05, fix: C3 + 0.04, learned: C4, end: PR1};
const FIELD = fieldFlight6(FK6);
const fieldPos = (t: number) => FIELD(t).B.o;
const F1_CAM = camFrom(FIELD(F1 + 0.12).B.o, ck(-66, 8, 5.0, 42, 0.6, 0));
const F2_CAM = camFrom(FIELD(F2).B.o, ck(-6, 5, 4.4, 42, 0.62, 0));
// F3: tracks the board (a close-up must stay on his legs); eases back to the whole body once the legs have answered
const F3K: Key[] = [[F3, ck(-34, 4, 2.0, 40, 0.46, 0), {hold: true}], [F3 + 0.72, ck(-34, 4, 2.0, 40, 0.46, 0)], [F3 + 1.55, ck(-36, 8, 5.8, 42, 0.72, 0), {hold: true}], [C1, ck(-36, 8, 5.8, 42, 0.72, 0)]];
const fieldCam = (t: number): Cam => {
  if (t < F2) return standPart(F1_CAM, fieldPos, t, F1, 0.6 * sstep(F1, F1 + 1.1, t), 0.6 + 0.05 * sstep(F1, F1 + 0.8, t), 42);
  if (t < F3) return standPart(F2_CAM, fieldPos, t, F2, 0.7, 0.62, 42);
  return trackCam(fieldPos, t, splineRec(t, F3K), 0.6);
};
const C4_CAM = camFrom(FIELD(C4).B.o, ck(-24, 6, 4.6, 42, 0.62, 0));
const coachCam = (t: number, st: St): Cam => {
  if (t < C2) return orbitBoard(st.B, splineRec(t, [[C1, ck(-4, 56, 1.0, 38, 0.004, 0)], [C2, ck(0, 58, 0.95, 38, 0.004, 0)]]));
  if (t < C3) {
    // held still: set up from the settled pose (the arm is already up) and carried only by the board's drift
    const T = C2 + 0.2;
    const jw = pilotJoints(FIELD(T).B, FIELD(T).pose);
    const fd = n3(s3(jw.wriF, jw.elbF));
    const wrist = a3(jw.wriF, m3(fd, -0.07));
    const pos = a3(a3(a3(wrist, m3(n3(s3(jw.Hc, wrist)), 0.56)), m3(jw.chL, 0.1)), m3(jw.up, 0.05));
    const drift = s3(smoothPos(fieldPos, t, 0.6), smoothPos(fieldPos, T, 0.6));
    return {pos: a3(pos, drift), tgt: a3(wrist, drift), roll: 0, fov: 36};
  }
  if (t < C4) {
    // V6: a medium view from his right front (the earbud's side), head to knees, set at the cut and carried by the
    // board's drift: the cue and the change in his stance in one frame
    const jc = pilotJoints(FIELD(C3).B, FIELD(C3).pose);
    const mid = lerp3(jc.P, jc.S, 0.75);
    const pos = a3(a3(a3(mid, m3(jc.hL, -1.75)), m3(jc.chF, 1.0)), v3(0, 0.25, 0));
    const drift = s3(smoothPos(fieldPos, t, 0.6), smoothPos(fieldPos, C3, 0.6));
    return {pos: a3(pos, drift), tgt: a3(a3(mid, v3(0, -0.05, 0)), drift), roll: 0, fov: 42};
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
const CRK: Key[] = [[PR2, ck(284, 13, 9.5, 52, 1.0, 0)], [P2, ck(289, 19, 12.5, 52, 1.2, 0)]];
const crCam = (t: number) => trackCam(prPos, t, splineRec(t, CRK));
// "and THROUGH a CANYON": a cut to the canyon flight, a separate demonstration. We join it deep inside the gorge (no
// river behind him), at about 6 m over its water, tracked from behind with both walls and the way ahead in frame.
const TIN = P2 - 10;
const PAYK: Key[] = [[P2, ck(349, 10, 6.2, 54, 1.0, 0)], [Q1, ck(351, 9, 5.8, 54, 0.95, 0)]];
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
  [Q1, ck(257, 20, 11.0, 46, 0.85, 0)],
  [M.pay + 0.4, ck(253.5, 4, 6.6, 44, 0.75, 0)],
  [LOOPK[0], LOOPK[1]],
  [DUR, HOOKK[1][1]],
  // beyond the loop point: the hook's next key, so the camera's velocity carries straight through frame 0
  [DUR + HOOKK[2][0], HOOKK[2][1]],
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

export const SHOTS6: Shot[] = [
  riverShot('hook: one tracking angle, a gust and his answer, the crossing', 0, CUT_UNDER, hook4, hookCam, {buoys: true}),
  riverShot('the ten fans from below (still)', CUT_UNDER, CUT_AIR, hook4, hookCam, {
    jets: (t) => 1 + 0.45 * sstep(M.electric, M.electric + 0.4, t),
    // "electric propellers": the jets lengthen as the rotors speed up
    reach: (t) => 1.3 + 1.9 * sstep(M.electric, M.electric + 0.5, t),
  }),
  // the jets run all the way down to the water (their path is swept back about 30 degrees by the speed)
  {
    ...riverShot('blast air downward: the air reaching the water', CUT_AIR, CUT2, hook4, hookCam, {jets: () => 1.45, reach: (t) => 1.16 * hook4(t).alt, buoys: true}),
    // the caption keeps clear of the churned patch where the air meets the water (the point of the shot), too
    focus: (t) => {
      const L = lens(hookCam(t)), st = hook4(t);
      const lagT = st.alt / (13 + 6 * st.thrust), R = 0.9 + st.alt * 0.32;
      const c = v3(st.pos.x - st.vel.x * lagT, 0.02, st.pos.z - st.vel.z * lagT);
      const ps = [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dz]) => L.p(v3(c.x + dx * R * 1.3, 0.02, c.z + dz * R * 1.3)));
      const xs = ps.map((p) => p.x), ys = ps.map((p) => p.y);
      return [box(L, st), {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys)}];
    },
  },
  {
    name: 'the lift on the riverside flat (standing camera)', from: CUT2, to: M.but,
    draw: (t, pre) => {
      const st = lift4(t, MATCH);
      return <FlightScene id={`${pre}lf`} t={t} st={st} L={lens(liftCam(t))} set="river" surface="ground" />;
    },
    focus: (t) => box(lens(liftCam(t)), lift4(t, MATCH)),
  },
  {name: 'the jet prototype test and the redesign on the same stand (workshop)', from: M.but, to: M.except, draw: (t, pre) => <WorkshopScene id={`${pre}ws`} t={t} />, focus: (t) => wsFocus(t)},
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
      return <FlightScene id={`${pre}fd`} t={t} st={st} L={lens(coachCam(t, st))} set="field" surface="ground" coach={st.pulse} jets={t < C3 ? 0.4 : 1} />;
    },
    focus: (t) => (t < C3 ? {x0: 300, y0: 700, x1: 780, y1: 1200} : box(lens(coachCam(t, FIELD(t))), FIELD(t))),
  },
  riverShot('practice to flight: lift-off on the flat, over the shoreline, out over the water (tracking)', PR1, PR2, pr, prCam, {
    surface: (t) => (pr(t).pos.z < 0 ? 'ground' : 'water'), water: (t) => sstep(-1.0, 3.0, pr(t).pos.z), tint: 0.35,
  }),
  riverShot('across the river: the shore falls behind, the river opens up (high tracking)', PR2, P2, pr, crCam, {
    surface: (t) => (pr(t).pos.z < 0 ? 'ground' : 'water'), water: (t) => sstep(-1.0, 3.0, pr(t).pos.z), buoys: true, tint: 0.35,
  }),
  riverShot('the canyon flight (a separate demonstration), deep in the gorge (tracking)', P2, Q1, (t) => payoff4(t, TIN), payCam, {gorge: true, gorgeWater: -70, tint: 0.15}),
  {
    name: 'ending: one crane down over the river onto frame 0', from: Q1, to: DUR + 1,
    draw: (t, pre) => {
      const st = hook4(t - DUR);
      // the scene's clock runs on the hook's own time (t - DUR), so water, wash and rotors are continuous through the loop
      return <FlightScene id={`${pre}en`} t={t - DUR} st={st} L={lens(endCam(t))} set="river" surface="water" buoys />;
    },
    focus: (t) => box(lens(endCam(t)), hook4(t - DUR)),
  },
];
/** every picture cut: the shot boundaries and the cuts inside shots (workshop, balance, coach) */
export const CUTS6 = [...SHOTS6.slice(1).map((s) => s.from), W2, W3, W4, F2, F3, C2, C3, C4].sort((a, b) => a - b);
/** V6: the timing of the visible events the sound follows (exported to the mix by tools/export_cues_v6.ts) */
export const BEATS6 = {...FK6, shore: PR1 + 1.74, gust: GUST_AT};
export const shotAt6 = (t: number) => SHOTS6.find((s) => t >= s.from && t < s.to) ?? SHOTS6[SHOTS6.length - 1];
export type {Box, CK};
export {toW};

/** QC: the rider's state and the lens for frame time t (null when no rider is in the shot) */
export const riderView6 = (t: number): {L: Lens; st: St} | null => {
  if (t < CUT2) return {L: lens(hookCam(t)), st: hook4(t)};
  if (t < M.but) return {L: lens(liftCam(t)), st: lift4(t, MATCH)};
  if (t < M.except) return null;
  if (t < C1) return {L: lens(fieldCam(t)), st: FIELD(t)};
  if (t < PR1) return {L: lens(coachCam(t, FIELD(t))), st: FIELD(t)};
  if (t < PR2) return {L: lens(prCam(t)), st: pr(t)};
  if (t < P2) return {L: lens(crCam(t)), st: pr(t)};
  if (t < Q1) return {L: lens(payCam(t)), st: payoff4(t, TIN)};
  return {L: lens(endCam(t)), st: hook4(t - DUR)};
};
