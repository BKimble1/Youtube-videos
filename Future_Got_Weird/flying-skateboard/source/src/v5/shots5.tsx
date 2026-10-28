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
import {noise1} from '../dc/math';
import {f2, polyD, proj} from '../eng/draw';
import {a3, Cam, d3, Frame, frameYPR, l3, lens, Lens, lerp3, m3, n3, s3, toW, v3, V3} from '../eng/v3';
import {FieldBack} from '../env/Field';
import {Buoy, RiverBack} from '../env/River';
import {WorkshopBack} from '../env/Workshop';
import {AirJets} from '../fx/AirJets';
import {Exhaust, Flames, Flash, Recirc, Smoke} from '../fx/Fire';
import {Wash} from '../fx/Wash';
import {sstep} from '../story/flight';
import {ca, ck, CK, Key, orbitAnch, orbitBoard, splineRec} from '../story/cam';
import {Rider, RiderShadow} from '../story/rider';
import {CAPS, DUR} from '../story/time';
import {aboveGround, blendCam, Box, M, riderBox, Shot, swingCam, toOrbit, unwrap} from '../v2/shots2';
import {DEP, departure, fieldFlight, GORGE4, hook4, inventor4, lift4, payoff4, REST, sCurve, sCurvePath, St, takeoff} from './flight5';

export {M};
const NEAR = 150; // the riverside flat between the water and the near-bank hills (m)

// ================================================================ shared scene: a flight over water or ground
type SceneP = {id: string; t: number; st: St; L: Lens; L2?: Lens; set: 'river' | 'field'; surface: 'water' | 'ground'; tint?: number; coach?: number; pov?: boolean; jets?: number; reach?: number; sun?: V3; buoys?: boolean; extra?: React.ReactNode; under?: React.ReactNode; water?: number; gorgeWater?: number};
const FlightScene: React.FC<SceneP> = ({id, t, st, L, L2, set, surface, tint = 0, coach = 0, pov, jets = 1, reach, sun, buoys, extra, under, water, gorgeWater}) => (
  <g>
    {set === 'river'
      ? <RiverBack id={`${id}-rv`} L={L} t={t} gorge={GORGE4} near={NEAR} L2={L2} tint={tint} cliffs shoal={SHOAL} wind={0.3 + 0.5 * Math.max(0, 1 - st.alt / 4)} gorgeWater={gorgeWater} />
      : <FieldBack id={`${id}-fd`} L={L} t={t} tint={tint} wind={0.3 + st.thrust * 0.6 * Math.max(0, 1 - (st.alt - REST) / 3)} />}
    {buoys && <Buoys L={L} t={t} />}
    {under}
    {/* V5: over the shoreline the downwash and the shadow blend from ground to water (water = 0..1) instead of
        switching in one frame */}
    {(water ?? (surface === 'water' ? 1 : 0)) < 0.999 && <Wash id={`${id}-wg`} L={L} at={st.pos} alt={st.alt} thrust={st.thrust * (1 - (water ?? 0))} t={t} vel={st.vel} surface="ground" foam={1} soft />}
    {(water ?? (surface === 'water' ? 1 : 0)) > 0.001 && <Wash id={`${id}-wa`} L={L} at={st.pos} alt={st.alt} thrust={st.thrust * (water ?? 1)} t={t} vel={st.vel} surface="water" foam={1} soft />}
    {st.alt < 14 && <RiderShadow L={L} B={st.B} pose={st.pose} sun={sun ?? (set === 'river' ? RSUN : undefined)} minOp={set === 'river' ? 1.1 : 0.35} color={mix('#24361F', '#0B2427', water ?? (surface === 'water' ? 1 : 0))} />}
    {!below(L, st) && <AirJets L={L} B={st.B} t={t} thrust={st.thrust} vel={st.vel} alpha={Math.min(1, jets)} reach={reach} dense={Math.max(0, jets - 1)} />}
    <Rider id={id} L={L} B={st.B} pose={st.pose} coach={coach} pov={pov} st={{phase: t * 2.6, rps: st.rps > 20 ? 11 : st.rps, thrust: st.thrust, tilt: {pitch: st.pitch, roll: st.roll}}} />
    {below(L, st) && <AirJets L={L} B={st.B} t={t} thrust={st.thrust} vel={st.vel} alpha={Math.min(1, jets)} reach={reach} dense={Math.max(0, jets - 1)} />}
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
const camFrom = (tgt: V3, c: CK): V3 => {
  const R = Math.PI / 180;
  return a3(a3(tgt, v3(0, c.ty, 0)), v3(-Math.sin(c.az * R) * Math.cos(c.el * R) * c.dist, Math.sin(c.el * R) * c.dist, -Math.cos(c.az * R) * Math.cos(c.el * R) * c.dist));
};

// ================================================================ 1: the opening crossing and the mechanism (one flight over the Yangtze)
// 0-1.4 s one strong low front three-quarter tracking angle from his toe side, held (the river streams beneath, his
// knees take a heave); 1.4-2.4 s he carves toward his heels and the board banks toe edge up, turning its thrusters to
// the camera (the composition changes because he rides, the camera only holds); 2.2-3.4 s one steady rise and
// pull-back to the crossing (elevation, distance and azimuth each change one way only, no dip-and-climb). Cut on the
// "You see" caption to a still underside close-up for the ten fans; cut on "blast" to a low tracking view of the air
// reaching the water.
export const SHOAL = {x: 4, z: 104, len: 48, wid: 11};
const MATCH = M.lifting - 0.74; // the lift's own clock
// the caption for "You see" appears two frames before the word: the cut lands on the same frame
const CUT_UNDER = Math.round(CAPS.find((c) => c.text.toLowerCase().startsWith('you see'))!.show * 30) / 30;
const CUT_AIR = M.blast - 0.02;
const CUT2 = M.blast + 1.06; // end of "downward": cut to the riverside flat
// the ending's last key before the loop (shared, so the camera velocity at frame 0 is the same on both sides)
const LOOPK: [number, CK] = [M.thingE + 0.6, ck(249.5, -8, 4.6, 44, 0.7, 0)];
const HOOKK: Key[] = [
  [LOOPK[0] - DUR, LOOPK[1]],
  [0.0, ck(252, -8, 4.6, 44, 0.7, 0)],
  [0.7, ck(254, -8, 4.6, 44, 0.69, 0)],
  [1.4, ck(256, -8, 4.6, 44, 0.67, 0)],
  [2.2, ck(258.5, -6.5, 5.2, 44, 0.7, 0)],
  [CUT_UNDER, ck(263, 6, 7.6, 44, 0.85, 0)],
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
const liftCam = (t: number): Cam => {
  const p0 = liftPos(CUT2);
  const p = smoothPos(liftPos, t, 0.6);
  const tg = v3(p0.x + 0.6 * (p.x - p0.x), 1.35 + LIFT_FY * (p.y - p0.y), p0.z + 0.55 * (p.z - p0.z));
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
const W2 = M.jet, LEAK0 = M.andCaught - 0.15;
const W1K: Key[] = [[M.but, ck(-50, 64, 2.4, 54, 0.0, 0)], [W2, ck(-50, 56, 2.3, 54, 0.0, 0)]];
const W2K: Key[] = [[W2, ck(-38, -8, 1.65, 50, -0.3, 0)], [LEAK0, ck(-46, -6, 1.55, 50, -0.3, 0)]];
// V5: W3 holds near-still on the fire. At the peak of the smoke (when it fills the frame) a cut to W4, already on
// the field shot's side of the stand; as the smoke clears W4 makes one slow move, back and down (no arc round the stand).
const W4 = M.so + 0.08;
const W3K: Key[] = [
  [LEAK0, ck(-52, 26, 1.7, 48, 0.02, 0)],
  [M.fireE, ck(-55, 28, 1.8, 48, 0.02, 0)],
  [W4, ck(-58, 30, 2.0, 48, 0.05, 0)],
];
const W4K: Key[] = [
  [W4, ck(-89, 17, 4.7, 44, 0.6, 0), {hold: true}],
  [M.except, ck(-90, 14, 5.8, 42, 0.75, 0)],
];
const jetCam = (t: number): Cam => {
  const B = JB(Math.min(t, M.so));
  if (t < W2) return orbitBoard(B, splineRec(t, W1K));
  if (t < LEAK0) return aboveGround(orbitBoard(B, splineRec(t, W2K)), 0.12);
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
/** the cause of the fire: the hammering loosens the centre engine's fuel fitting; fuel weeps from it, drips onto the
 *  deck and pools; vapour rises off the pool into the hot air curling up from the floor, and that is where it lights */
const FuelLeak: React.FC<{L: Lens; B: Frame; t: number; t0: number; t1: number; part: 'pool' | 'drips'}> = ({L, B, t, t0, t1, part}) => {
  if (t < t0) return null;
  const fl = jetFuelLine(B, 2);
  const fit = fl[2];
  const pool = toW(B, v3(0.13, 0.004, -0.02));
  const k = sstep(t0, t0 + 0.4, t) * (1 - sstep(t1 + 0.3, t1 + 0.6, t));
  const els: React.ReactNode[] = [];
  // drips: each falls from the fitting to the pool in 0.28 s
  for (let i = 0; i < 6; i++) {
    const born = t0 + 0.1 + i * 0.13;
    const age = (t - born) % 0.8;
    if (t < born || age > 0.28 || t > t1 + 0.1) continue;
    const u = age / 0.28;
    const q = v3(fit.x + (pool.x - fit.x) * u * 0.6, fit.y + (pool.y - fit.y) * u * u, fit.z + (pool.z - fit.z) * u * 0.6);
    if (d3(s3(q, L.pos), L.f) < 0.1) continue;
    const p = L.p(q);
    els.push(<ellipse key={`d${i}`} cx={f2(p.x)} cy={f2(p.y)} rx={f2(0.006 * p.k)} ry={f2(0.01 * p.k)} fill="#F5B53A" stroke="#8A5A10" strokeWidth={f2(Math.max(0.5, 0.0015 * p.k))} />);
  }
  // the bead at the fitting, and the pool spreading on the deck
  const pf = L.p(fit), pp = L.p(pool);
  const r = (0.03 + 0.06 * sstep(t0, t1, t)) * pp.k;
  // vapour shimmer rising off the pool toward the fitting and the hot air
  const vap: string[] = [];
  for (let sIdx = 0; sIdx < 4; sIdx++) {
    const ph = (t * 1.3 + sIdx / 4) % 1;
    const pts: string[] = [];
    for (let q = 0; q <= 6; q++) {
      const h = (ph * 0.6 + q * 0.03) * 0.3;
      const p3 = a3(pool, v3(0.008 * Math.sin(t * 6 + q * 0.8 + sIdx), h * 0.7, 0.008 * Math.cos(t * 5 + q + sIdx)));
      const p = L.p(p3);
      pts.push(`${f2(p.x)},${f2(p.y)}`);
    }
    vap.push(`M${pts.join('L')}`);
  }
  if (part === 'pool') {
    // V5: the puddle lies flat on the deck (a disk in the deck plane), drawn by the JetBoard under its engines
    const rr = (0.03 + 0.06 * sstep(t0, t1, t));
    const disk = (c: V3, ra: number, rb: number) => polyD(proj(L, Array.from({length: 24}, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
      return a3(c, a3(m3(B.x, Math.cos(a) * ra), m3(B.z, Math.sin(a) * rb * (1 + 0.15 * Math.sin(a * 3)))));
    })));
    void r;
    // it burns off with the fire (shrinking and fading) and leaves the scorch the JetBoard draws
    const kp = sstep(t0, t0 + 0.4, t) * (1 - sstep(t1 + 0.25, M.so - 0.1, t));
    const rb = rr * (1 - 0.5 * sstep(t1 + 0.25, M.so - 0.1, t));
    return (
      <g opacity={kp}>
        <path d={disk(pool, rb, rb * 0.8)} fill="#E7A02A" opacity={0.75} />
        <path d={disk(a3(pool, m3(B.x, -rb * 0.25)), rb * 0.4, rb * 0.25)} fill="#FFE29A" opacity={0.6} />
      </g>
    );
  }
  return (
    <g opacity={k}>
      <circle cx={f2(pf.x)} cy={f2(pf.y + 0.008 * pf.k)} r={f2(0.008 * pf.k)} fill="#F5B53A" stroke="#8A5A10" strokeWidth={f2(Math.max(0.5, 0.0015 * pf.k))} />
      <path d={vap.join('')} stroke="#FFF1C4" strokeOpacity={0.25} strokeWidth={f2(Math.max(1, 0.006 * pp.k))} fill="none" strokeLinecap="round" />
      {els}
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
// the redesign in the same cradle: the electric board's deck sits on the stand rails where the jet plank was
const BE = (B: Frame): Frame => ({...B, o: a3(B.o, m3(B.y, -0.045 + BD.thick))});
// V5: the electric board comes out of the smoke complete (the unit-by-unit seating popped and cut through the rim),
// then powers up: the fans spin up smoothly, at most 1.6 turns/s drawn (19 degrees a frame for five blades)
const ePhase = (t: number) => 1.6 * ssI(M.switched, M.except - 0.2, t);
const WorkshopScene: React.FC<{id: string; t: number}> = ({id, t}) => {
  const cam = jetCam(t);
  const L = lens(cam);
  const B = JB(Math.min(t, M.so));
  const r = run(t);
  const h = heat(t);
  const nozzles = [0, 1, 2, 3, 4].map((i) => jetNozzle(B, i));
  const intakes = [0, 1, 2, 3, 4].map((i) => jetIntake(B, i));
  const recirc = sstep(M.engines + 0.3, M.andCaught + 0.1, t) * (1 - sstep(M.fire + 0.1, M.fire + 0.6, t));
  // the fire starts where the vapour from the leak meets the hot recirculating air (the pool by the fitting), runs up
  // to the fitting and back along that fuel line; the fuel is shut off and it dies down, leaving the scorch
  const fl = jetFuelLine(B, 2);
  const pool = toW(B, v3(0.13, 0.004, -0.02));
  const along = (u: number) => (u < 0.2 ? lerp3(pool, fl[2], u / 0.2) : u < 0.6 ? lerp3(fl[2], fl[1], (u - 0.2) / 0.4) : lerp3(fl[1], fl[0], (u - 0.6) / 0.4));
  const spread = sstep(M.fire, M.fire + 0.5, t);
  // the vapour flashes and the flame grows over a quarter second; when the fuel is shut off it dies down over half a second
  const out = sstep(M.fireE + 0.05, M.so - 0.05, t);
  const fireK = sstep(M.fire - 0.04, M.fire + 0.22, t) * (1 - out);
  // V5: each tongue of flame grows in place as the fire runs along the line (no clusters appearing in one frame)
  const flames = [0, 0.2, 0.45, 0.7].map((u) => ({at: along(u), k: fireK * Math.min(1, Math.max(0, (spread * 0.9 + 0.01 - u) / 0.14))})).filter((f) => f.k > 0.01);
  const flameAt = flames.map((f) => f.at);
  const burn = sstep(M.fire + 0.08, M.fire + 0.8, t);
  const flash = Math.max(0, 1 - Math.abs(t - M.fire - 0.03) / 0.12) * 0.55;
  const react = sstep(M.fire - 0.02, M.fire + 0.3, t) * (1 - sstep(M.so - 0.2, M.so + 0.3, t));
  const flinch = sstep(M.fire, M.fire + 0.16, t) * (1 - sstep(M.fire + 0.8, M.fire + 1.3, t));
  const jInv = pilotJoints(INV, inventor4(react, flinch));
  const invNear = (cam.pos.x - INV.o.x) ** 2 + (cam.pos.z - INV.o.z) ** 2 < 0.5;
  // V5: the smoke left by the fire thickens into a veil over the stand, the prototype is swapped while it is hidden,
  // and the smoke clears on the new electric frame sitting in the same cradle (no see-through overlap of two boards)
  const veil = sstep(M.so - 0.45, M.so - 0.05, t) * (1 - sstep(M.so + 0.3, M.switched + 0.15, t));
  // V5: for a moment the smoke fills the whole room (it hides the stand legs and the walls too), and the cut to the
  // new side and the swap of the boards both happen inside it
  const fog = 0.94 * sstep(M.so - 0.3, M.so, t) * (1 - sstep(M.so + 0.25, M.so + 0.6, t));
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
          <JetBoard id={`${id}-jb`} L={L} B={B} stand={false} st={{phase: jetPhase(t), rps: jetRps(t), burn, heat: h}} overlay={<FuelLeak L={L} B={B} t={t} t0={LEAK0} t1={M.fire} part="pool" />} />
          <FuelLeak L={L} B={B} t={t} t0={LEAK0} t1={M.fire} part="drips" />
          {camUp && <HeatHaze L={L} at={nozzles.map((n) => a3(n, v3(0, 0.12, 0)))} k={h * (1 - burn * 0.6)} t={t} />}
          <Smoke L={L} at={[along(0), along(0.45)]} t={t} t0={M.fire + 0.1} k={0.8 * sstep(M.fire, M.fire + 0.3, t) * (1 - sstep(M.so - 0.5, M.so + 0.2, t))} />
          {flames.map((f, i) => <Flames key={i} id={`${id}-fl${i}`} L={L} at={[f.at]} size={0.15} k={f.k} t={t} />)}
          <Flash id={`${id}-fs`} c={L.p(fl[2])} k={flash} />
        </g>
      )}
      {swap > 0 && <Rider id={`${id}-eb`} L={L} B={BE(B)} pose={lift4(0, 10).pose} noPilot st={{phase: ePhase(t), rps: 5 * sstep(M.switched, M.except - 0.2, t), thrust: 0, built: 10}} />}
      <SmokeVeil id={`${id}-sv`} L={L} c={a3(B.o, v3(0, 0.15, 0))} k={veil} t={t} />
      {fog > 0.005 && <rect x={0} y={0} width={1080} height={1920} fill="rgb(106,103,99)" opacity={f2(fog)} />}
    </g>
  );
};

/** the workshop's protected region for caption placement: the board (jet or electric) as it sits in frame */
const wsFocus = (t: number) => {
  const L = lens(jetCam(t));
  const B = JB(Math.min(t, M.so));
  const pts = [-0.5, 0.5].flatMap((x) => [-0.9, 0.9].flatMap((z) => [0.3, -0.12].map((y) => L.p(toW(B, v3(x, y, z))))));
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  return {x0: Math.min(...xs) - 30, y0: Math.min(...ys) - 30, x1: Math.max(...xs) + 30, y1: Math.max(...ys) + 30};
};

// ================================================================ 5: learning on the field (A problem, B feet, C ride, D coach)
const FK = {lift: M.except + 0.12, huge: M.huge, theBoard: M.theBoard, itself: M.itself, heHas: M.heHas, body: M.body, while: M.while, cue: M.coach, fix: M.learn - 0.1, done: M.balance2, end: M.andAfter};
const FIELD = fieldFlight(FK);
// A1 (15.5-18.1): a camera standing still at the framing the workshop shot ended on: the board lifts, the nose dips,
// he answers. A2 (18.1-22.5): cut to a second standing camera, lower and a little to his front: the heel-side and
// toe-side tilts and his corrections, then he leans and rides off across the pad and the camera pans with him.
const fieldPos = (t: number) => FIELD(t).B.o;
const A1_CAM = camFrom(FIELD(M.except).B.o, ck(-20, 14, 5.8, 42, 0.75, 0));
const A2 = M.theBoard;
// V5: A1 stands wider (5.8 m: the follow tilt as the board lifts is slower, and the captions have room above him) and
// A2 is closer and round to his other side, so the cut changes both angle (46 degrees) and size (V5's first cut had
// the rider the same size in both and read as a jump cut)
const A2_CAM = camFrom(FIELD(A2).B.o, ck(26, 7, 4.5, 42, 0.8, 0));
const fieldCam = (t: number): Cam => (t < A2 ? standCam(A1_CAM, fieldPos, t, 0.75 + 0.1 * sstep(M.except, M.except + 0.8, t), 42, 0.5) : standCam(A2_CAM, fieldPos, t, 0.85, 42, 0.5));
// D (coach): controlled close-ups, each held still: C1 the phone built into the deck (from above); C2 his own view of
// the wrist phone he has raised; C3 the earbud on his ear as the cue plays (camera fixed to his torso, so the small
// listening tilt of his head reads); C4 back to a standing medium view as he makes the correction and the board settles.
const C2 = M.voice - 0.09, C3 = M.coach + 0.06, C4 = M.learn - 0.05;
const C4_CAM = (() => {
  const B = FIELD(C4).B;
  return camFrom(B.o, ck(-30, 6, 4.2, 42, 0.85, 0));
})();
const coachCam = (t: number, st: St): Cam => {
  if (t < C2) return orbitBoard(st.B, splineRec(t, [[M.while, ck(-4, 56, 1.0, 38, 0.004, 0)], [C2, ck(0, 58, 0.95, 38, 0.004, 0)]]));
  const j = pilotJoints(st.B, st.pose);
  if (t < C3) {
    // V5: held still: set up from the settled pose (the arm is already up) and carried only by the board's drift; the
    // wrist moves a little within the frame. (Fixed to the moving wrist, it rolled about 70 degrees in 7 frames.)
    const T = C2 + 0.2;
    const jw = pilotJoints(FIELD(T).B, FIELD(T).pose);
    const fd = n3(s3(jw.wriF, jw.elbF));
    const wrist = a3(jw.wriF, m3(fd, -0.07));
    const pos = a3(a3(a3(wrist, m3(n3(s3(jw.Hc, wrist)), 0.56)), m3(jw.chL, 0.1)), m3(jw.up, 0.05));
    const drift = s3(st.B.o, FIELD(T).B.o);
    return {pos: a3(pos, drift), tgt: a3(wrist, drift), roll: 0, fov: 36};
  }
  if (t < C4) {
    // fixed to the torso at the moment of the cut (the head moves within the frame, the frame does not move)
    const jc = pilotJoints(FIELD(C3).B, FIELD(C3).pose);
    const ear0 = a3(jc.Hc, m3(jc.hL, -0.1));
    const pos = a3(a3(a3(ear0, m3(jc.hL, -0.62)), m3(jc.hF, 0.22)), m3(jc.hU, 0.06));
    const drift = s3(st.B.o, FIELD(C3).B.o);
    return {pos: a3(pos, drift), tgt: a3(ear0, drift), roll: 0, fov: 36};
  }
  return standCam(C4_CAM, fieldPos, t, 0.85, 42, 0.5);
};

// ================================================================ 6: the practice progression
const E2 = M.andAfter + 0.49, E3 = M.tenDays, E4 = M.practice - 0.06;
// V5: E1 is set clearly apart from the coach correction before it (behind his toe side, higher, wider), not a re-framing
const E1_CAM = camFrom(takeoff(M.andAfter, M.andAfter).B.o, ck(22, 14, 5.6, 44, 0.6, 0));
// V5: higher, so his S-curve crosses the frame at about half the screen speed (he was gone in under half a second)
const E2_CAM: Cam = {pos: v3(-3.94, 8.6, -2.0), tgt: v3(-4.1, 0.6, 2.0), roll: 0, fov: 52};
// V5: a steady low front three-quarter track on the flat (a standing camera beside his path whipped round as he passed)
const E3K = ck(246, 3, 5.2, 46, 0.6, 0);
const P2 = M.andThrough; // cut into the canyon
// over the shoreline and out across the open river: a steady rear three-quarter track that slowly rises and eases back
// to show how wide the water is around him
const E4K: Key[] = [[E4, ck(300, 14, 6.0, 52, 0.8, 0)], [M.flew, ck(304, 18, 7.4, 52, 0.9, 0)], [P2, ck(308, 22, 9.0, 52, 1.0, 0)]];
const dep = (t: number) => departure(t, E3);
const PathTrace: React.FC<{L: Lens; T0: number; t: number}> = ({L, T0, t}) => {
  const pts = sCurvePath(T0, t);
  if (pts.length < 3) return null;
  const left: V3[] = [], right: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
    const w = 0.75 * (0.4 + 0.6 * (i / pts.length));
    left.push(v3(pts[i].x - (dz / l) * w, 0.006, pts[i].z + (dx / l) * w));
    right.push(v3(pts[i].x + (dz / l) * w, 0.006, pts[i].z - (dx / l) * w));
  }
  const poly = [...left, ...right.reverse()];
  if (poly.some((q) => d3(s3(q, L.pos), L.f) < 0.3)) return null;
  return <path d={polyD(proj(L, poly))} fill="#D7E5B4" opacity={0.75} />;
};

// ================================================================ 7: across the river and into the canyon
// V5: led by the destination, tracked at a steady rear three-quarter offset (no orbit). Heights stay modest (about 5 m).
const TIN = M.andThrough - 0.2;
// a steady rear three-quarter track across the last of the river and on into the gorge: the walls pass at their own
// depths while the camera keeps its offset (it closes in slightly as the walls rise)
// V5: a track from behind him and a little to his toe side, both walls and the way ahead in frame (the gorge only reads
// as a canyon close to its axis), closer than the river shot before it so the cut changes size as well as place; the
// back of his head now has hair, so it no longer reads as a blank face
const PAYK: Key[] = [[P2, ck(349, 10, 6.2, 54, 1.0, 0)], [M.howMuch, ck(351, 9, 5.8, 54, 0.95, 0)]];
const payPos = (t: number) => payoff4(t, TIN).B.o;
const payCam = (t: number) => trackCam(payPos, t, splineRec(t, PAYK));
/** channel buoys along the crossing: foreground objects passing at their own depth (speed and scale) */
const BUOYS = [[-34, 30], [-47, 70], [-33, 118], [584, 452], [598, 476], [578, 498]].map(([x, z]) => v3(x, 0, z));
const Buoys: React.FC<{L: Lens; t: number}> = ({L, t}) => (
  <g>
    {BUOYS.filter((b) => l3(s3(b, L.pos)) < 160).sort((a, b) => l3(s3(b, L.pos)) - l3(s3(a, L.pos))).map((b, i) => <Buoy key={i} L={L} at={b} t={t} />)}
  </g>
);

// ================================================================ 8: the ending (the hook's trajectory, tau = t - DUR)
// V5: one stable rider-focused front three-quarter track over the river while the question is asked, drifting a few
// degrees onto frame 0's key (the camera's velocity carried through the loop point).
const ENDK: Key[] = [
  [M.howMuch, ck(243, -5, 5.0, 44, 0.76, 0)],
  [M.pay, ck(245.5, -6, 4.9, 44, 0.75, 0)],
  [LOOPK[0], LOOPK[1]],
  [DUR, HOOKK[1][1]],
  // beyond the loop point: the hook's next key, so the camera's velocity carries straight through frame 0
  [DUR + HOOKK[2][0], HOOKK[2][1]],
];
const endCam = (t: number): Cam => trackCam((u: number) => hook4(u - DUR).B.o, t, splineRec(t, ENDK));

// ================================================================ the shot list
const riverShot = (name: string, from: number, to: number, stAt: (t: number) => St, camAt: (t: number) => Cam, o: {blur?: (t: number) => boolean; surface?: (t: number) => 'water' | 'ground'; water?: (t: number) => number; jets?: (t: number) => number; reach?: (t: number) => number; pov?: (t: number) => boolean; buoys?: boolean; gorgeWater?: number} = {}): Shot => ({
  name, from, to,
  draw: (t, pre) => {
    const st = stAt(t);
    const L = lens(camAt(t));
    const L2 = o.blur?.(t) ? lens(camAt(t - SHUT)) : undefined;
    return <FlightScene id={`${pre}${name.slice(0, 3)}`} t={t} st={st} L={L} L2={L2} set="river" surface={o.surface?.(t) ?? 'water'} water={o.water?.(t)} jets={o.jets?.(t) ?? 1} reach={o.reach?.(t)} pov={o.pov?.(t)} buoys={o.buoys} gorgeWater={o.gorgeWater} />;
  },
  focus: (t) => box(lens(camAt(t)), stAt(t)),
});

export const SHOTS5: Shot[] = [
  riverShot('hook: one tracking angle, the thrusters, the crossing', 0, CUT_UNDER, hook4, hookCam, {}),
  riverShot('the ten fans from below (still)', CUT_UNDER, CUT_AIR, hook4, hookCam, {
    jets: (t) => 1 + 0.45 * sstep(M.electric, M.electric + 0.4, t),
    // "electric propellers": the jets lengthen as the rotors speed up
    reach: (t) => 1.3 + 1.9 * sstep(M.electric, M.electric + 0.5, t),
  }),
  // the jets run all the way down to the water (their path is swept back about 30 degrees by the speed)
  riverShot('blast air downward: the air reaching the water', CUT_AIR, CUT2, hook4, hookCam, {jets: () => 1.45, reach: (t) => 1.16 * hook4(t).alt}),
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
    name: 'balance: the problem and his corrections (standing cameras)', from: M.except, to: M.while,
    draw: (t, pre) => {
      const st = FIELD(t);
      return <FlightScene id={`${pre}fa`} t={t} st={st} L={lens(fieldCam(t))} set="field" surface="ground" />;
    },
    focus: (t) => box(lens(fieldCam(t)), FIELD(t)),
  },
  {
    name: 'the AI coach: deck phone, wrist phone, earbud, the correction', from: M.while, to: M.andAfter,
    draw: (t, pre) => {
      const st = FIELD(t);
      return <FlightScene id={`${pre}fd`} t={t} st={st} L={lens(coachCam(t, st))} set="field" surface="ground" coach={st.pulse} jets={t < C4 ? 0.4 : 1} />;
    },
    focus: (t) => (t < C4 ? {x0: 300, y0: 700, x1: 780, y1: 1200} : box(lens(coachCam(t, FIELD(t))), FIELD(t))),
  },
  {
    name: 'practice: an unsteady takeoff (standing camera, morning)', from: M.andAfter, to: E2,
    draw: (t, pre) => {
      const st = takeoff(t, M.andAfter);
      return <FlightScene id={`${pre}e1`} t={t} st={st} L={lens(standCam(E1_CAM, (u) => takeoff(u, M.andAfter).B.o, t, 0.6, 44))} set="field" surface="ground" tint={0.35} />;
    },
    focus: (t) => box(lens(standCam(E1_CAM, (u) => takeoff(u, M.andAfter).B.o, t, 0.6, 44)), takeoff(t, M.andAfter)),
  },
  {
    name: 'practice: an S-curve under a still overhead camera', from: E2, to: E3,
    draw: (t, pre) => {
      const st = sCurve(t, E2);
      const L = lens(E2_CAM);
      return <FlightScene id={`${pre}e2`} t={t} st={st} L={L} set="field" surface="ground" under={<PathTrace L={L} T0={E2} t={t} />} />;
    },
    focus: (t) => box(lens(E2_CAM), sCurve(t, E2)),
  },
  riverShot('practice: low and level over the flat (tracking)', E3, E4, dep, (t) => trackCam((u) => dep(u).B.o, t, E3K), {surface: () => 'ground'}),
  riverShot('over the shoreline and across the open river (tracking)', E4, P2, dep, (t) => trackCam((u) => dep(u).B.o, t, splineRec(t, E4K)), {
    surface: (t) => (dep(t).pos.z < 0 ? 'ground' : 'water'), water: (t) => sstep(-1.0, 3.0, dep(t).pos.z), buoys: true,
  }),
  riverShot('into and through the canyon (tracking)', P2, M.howMuch, (t) => payoff4(t, TIN), payCam, {buoys: true, gorgeWater: -70}),
  {
    name: 'ending: one steady track over the river onto frame 0', from: M.howMuch, to: DUR + 1,
    draw: (t, pre) => {
      const st = hook4(t - DUR);
      // the scene's clock runs on the hook's own time (t - DUR), so water, wash and rotors are continuous through the loop
      return <FlightScene id={`${pre}en`} t={t - DUR} st={st} L={lens(endCam(t))} set="river" surface="water" />;
    },
    focus: (t) => box(lens(endCam(t)), hook4(t - DUR)),
  },
];
/** every picture cut: the shot boundaries and the cuts inside shots (workshop, balance, coach) */
export const CUTS5 = [...SHOTS5.slice(1).map((s) => s.from), W2, LEAK0, W4, A2, C2, C3, C4].sort((a, b) => a - b);
export const shotAt5 = (t: number) => SHOTS5.find((s) => t >= s.from && t < s.to) ?? SHOTS5[SHOTS5.length - 1];
export type {Box, CK};
export {DEP, toW};

/** QC: the rider's state and the lens for frame time t (null when no rider is in the shot), for the head/feet crop
 *  sheets made by tools/qa_crops_v5.ts */
export const riderView5 = (t: number): {L: Lens; st: St} | null => {
  if (t < CUT2) return {L: lens(hookCam(t)), st: hook4(t)};
  if (t < M.but) return {L: lens(liftCam(t)), st: lift4(t, MATCH)};
  if (t < M.except) return null;
  if (t < M.while) return {L: lens(fieldCam(t)), st: FIELD(t)};
  if (t < M.andAfter) return {L: lens(coachCam(t, FIELD(t))), st: FIELD(t)};
  if (t < E2) return {L: lens(standCam(E1_CAM, (u) => takeoff(u, M.andAfter).B.o, t, 0.6, 44)), st: takeoff(t, M.andAfter)};
  if (t < E3) return {L: lens(E2_CAM), st: sCurve(t, E2)};
  if (t < E4) return {L: lens(trackCam((u) => dep(u).B.o, t, E3K)), st: dep(t)};
  if (t < P2) return {L: lens(trackCam((u) => dep(u).B.o, t, splineRec(t, E4K))), st: dep(t)};
  if (t < M.howMuch) return {L: lens(payCam(t)), st: payoff4(t, TIN)};
  return {L: lens(endCam(t)), st: hook4(t - DUR)};
};
