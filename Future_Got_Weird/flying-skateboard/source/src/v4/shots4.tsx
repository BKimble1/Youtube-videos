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
import {DUR} from '../story/time';
import {aboveGround, blendCam, Box, M, riderBox, Shot, swingCam, toOrbit, unwrap} from '../v2/shots2';
import {DEP, departure, fieldFlight, GORGE4, hook4, inventor4, lift4, payoff4, REST, sCurve, sCurvePath, St, takeoff} from './flight4';

export {M};
const NEAR = 150; // the riverside flat between the water and the near-bank hills (m)

// ================================================================ shared scene: a flight over water or ground
type SceneP = {id: string; t: number; st: St; L: Lens; L2?: Lens; set: 'river' | 'field'; surface: 'water' | 'ground'; tint?: number; coach?: number; pov?: boolean; jets?: number; reach?: number; sun?: V3; extra?: React.ReactNode; under?: React.ReactNode};
const FlightScene: React.FC<SceneP> = ({id, t, st, L, L2, set, surface, tint = 0, coach = 0, pov, jets = 1, reach, sun, extra, under}) => (
  <g>
    {set === 'river'
      ? <RiverBack id={`${id}-rv`} L={L} t={t} gorge={GORGE4} near={NEAR} L2={L2} tint={tint} cliffs shoal={SHOAL} wind={0.3 + 0.5 * Math.max(0, 1 - st.alt / 4)} />
      : <FieldBack id={`${id}-fd`} L={L} t={t} tint={tint} wind={0.3 + st.thrust * 0.6 * Math.max(0, 1 - (st.alt - REST) / 3)} />}
    {set === 'river' && <Buoys L={L} t={t} />}
    {under}
    <Wash id={`${id}-wa`} L={L} at={st.pos} alt={st.alt} thrust={st.thrust} t={t} vel={st.vel} surface={surface} foam={1} />
    {st.alt < 14 && <RiderShadow L={L} B={st.B} pose={st.pose} sun={sun ?? (set === 'river' ? RSUN : undefined)} minOp={set === 'river' ? 1.1 : 0.35} color={surface === 'water' ? '#0B2427' : undefined} />}
    <AirJets L={L} B={st.B} t={t} thrust={st.thrust} vel={st.vel} alpha={Math.min(1, jets)} reach={reach} dense={Math.max(0, jets - 1)} />
    <Rider id={id} L={L} B={st.B} pose={st.pose} coach={coach} pov={pov} st={{phase: t * 2.6, rps: st.rps > 20 ? 11 : st.rps, thrust: st.thrust, tilt: {pitch: st.pitch, roll: st.roll}}} />
    {extra}
  </g>
);
const box = (L: Lens, st: St) => riderBox(L, st.B, st.pose);
// the sun over the river: high, behind the camera of the rear high three-quarter views, so the rider's shadow falls on
// the water ahead of him where those views can see it (the height above the water reads at a glance)
const RSUN = n3(v3(0.35, 0.78, -0.52));
const SHUT = 0.02;

// ================================================================ 1: the opening crossing and the mechanism (one flight over the Yangtze)
// V4: the camera keeps to the rider's toe side and moves alongside him (the board is never spun past the lens):
// close low three-quarter -> closer, the far bank behind him -> low alongside, the thrusters -> rider-focused as the
// gravel bar slides beneath -> wide on the whole crossing -> down beside him to one view of the underside (the count) ->
// close on one propeller -> down with the air to the water it roughens, which matches to the dust on the riverside flat
export const SHOAL = {x: 4, z: 104, len: 48, wid: 11};
const MATCH = M.lifting - 0.74; // the lift's own clock
const CUT2 = M.blast + 1.06; // end of "downward": the water under the board cuts to the riverside flat
const ROTOR = 7; // toe-side duct, second row from the nose
// the ending's last key before the loop (shared, so the camera velocity at frame 0 is the same on both sides)
const LOOPK: [number, CK] = [M.thingE + 0.6, ck(266, -10, 4.8, 44, 0.38, -1)];
const HOOKK: Key[] = [
  [LOOPK[0] - DUR, LOOPK[1]],
  [0.0, ck(274, -12, 5.0, 44, 0.32, -1.5)],
  [0.4, ck(282, -10, 4.6, 44, 0.36, -1)],
  [1.0, ck(294, -6, 3.9, 44, 0.4, 0)],
  [1.33, ck(288, -22, 2.9, 44, 0.1, 0)],
  [1.65, ck(282, -20, 3.0, 44, 0.15, 0)],
  [2.0, ck(316, 12, 3.6, 46, 0.7, 0)],
  [2.4, ck(328, 16, 4.0, 46, 0.65, 0)],
  [2.95, ck(336, 18, 8.0, 50, 0.9, 0)],
  [M.yousee + 0.05, ck(342, 19, 10.5, 52, 1.0, 0)],
  [M.ten + 0.05, ck(286, -44, 3.4, 46, 0.1, 0)],
  [M.powerfulE - 0.05, ck(278, -54, 3.0, 46, 0.0, 0)],
  [M.electric + 0.45, ck(282, -16, 1.5, 40, -0.06, 0, 0.285, 0.26)],
  [M.blast + 0.05, ck(282, -20, 2.0, 42, -0.3, 0, 0.285, 0.26)],
  // down with the air: the board at the top of the frame, the water it roughens below
  [M.blast + 0.55, ck(282, -6, 6.2, 46, -1.4, 0, 0, -0.7)],
  [CUT2, ck(284, -8, 7.0, 46, -1.7, 0, 0, -0.9)],
];
/** looking down at the patch of water (or ground) the downwash is hitting, from his toe side */
const washCam = (c: V3): Cam => ({pos: a3(c, v3(2.1, 1.7, -0.9)), tgt: c, roll: 0, fov: 46});
const washAt = (st: St) => v3(st.pos.x - (st.vel.x * st.alt) / 12, 0, st.pos.z - (st.vel.z * st.alt) / 12);
const hookCam = (t: number): Cam => {
  const st = hook4(t);
  const c = orbitBoard(st.B, splineRec(t, HOOKK));
  void washAt;
  return c;
};

// ================================================================ 2: the lift (the riverside flat)
const FAN_I = 9, FAN_D = 0.62;
const LIFTK: Key[] = [
  [CUT2, ck(292, 5, 3.4, 44, 0.25, 0)],
  [CUT2 + 0.35, ck(300, 6, 2.4, 42, 0.38, 0)],
  [M.lifting + 0.45, ck(292, 5, 2.6, 42, 0.5, 0)],
  [M.lifting + 0.8, ck(310, 12, 4.6, 46, 0.8, 0)],
  [M.ground - 0.2, ck(320, 18, 7.0, 50, 1.0, 0)],
  [M.ground + 0.22, ck(298, -44, 4.6, 52, 0.95, 0)],
  [M.but - 0.3, ck(288, -48, 4.2, 52, 0.85, 0)],
];
const liftCam = (t: number): Cam => {
  const st = lift4(t, MATCH);
  // the camera holds its height while the board lifts past it (the gap to the ground opens in frame), then cranes
  let mid = aboveGround(orbitBoard(st.B, splineRec(t, LIFTK)), 0.3);
  const hold = 1 - sstep(M.lifting + 0.4, M.lifting + 0.9, t);
  if (hold > 0) mid = {...mid, pos: v3(mid.pos.x, mid.pos.y * (1 - hold) + (0.62 + 0.0) * hold, mid.pos.z)};
  const k = sstep(M.but - 0.32, M.but, t);
  if (k <= 0) return mid;
  const duct = ductWorld(st.B, FAN_I, BD.fanY);
  return blendCam(mid, {pos: a3(duct, m3(st.B.y, -FAN_D)), tgt: duct, roll: 0, fov: 50}, k);
};

// ================================================================ 3: the jet prototype test (workshop)
const JET_D = (0.064 * FAN_D) / 0.108;
const JB = (t: number) => {
  const vib = 0.008 * sstep(M.engines + 0.2, M.andCaught + 0.2, t) * (1 - sstep(M.fireE + 0.2, M.fireE + 0.7, t));
  return frameYPR(v3(noise1(t * 40, 1) * vib, 0.92 + noise1(t * 43, 2) * vib, noise1(t * 37, 3) * vib), 20, 0, 0);
};
const INV = frameYPR(v3(-2.7, 0, 0.5), 40, 0, 0);
const ign = (t: number) => sstep(M.but + 0.75, M.but + 1.05, t); // starters click, the compressors begin to turn
const run = (t: number) => sstep(M.jet - 0.2, M.jet + 0.35, t) * (1 - sstep(M.fireE + 0.15, M.fireE + 0.6, t));
const heat = (t: number) => sstep(M.engines + 0.1, M.fire - 0.05, t) * (1 - 0.55 * sstep(M.so - 0.3, M.so + 0.5, t));
const jetPhase = (t: number) => -(t * 2.6 * ign(t) + 6 * Math.max(0, Math.min(t, M.fireE + 0.3) - M.jet));
const jetRps = (t: number) => 2 + 7 * ign(t) + 22 * run(t) - 6 * sstep(M.fireE, M.so - 0.2, t);
const JETK: Key[] = [
  [M.but + 0.5, ck(-12, 52, 2.0, 50, 0.0, 0)],
  [M.but + 0.9, ck(-26, 26, 3.4, 52, 0.0, 0)],
  [M.jet - 0.35, ck(36, -14, 1.55, 50, -0.3, 0)],
  [M.jet + 0.2, ck(26, -17, 1.3, 50, -0.33, 0)],
  [M.engines + 0.5, ck(12, -10, 1.25, 50, -0.26, 0)],
  [M.andCaught + 0.1, ck(10, 12, 1.05, 48, -0.04, 0)],
  [M.fire - 0.05, ck(16, 22, 0.85, 48, 0.04, 0)],
  [M.fire + 0.22, ck(4, 22, 1.7, 50, 0.04, 0)],
  [M.fireE + 0.15, ck(-18, 28, 2.4, 52, 0.0, 0)],
  // fire out: up over the scorched prototype; the electric redesign takes its place on the same stand while the
  // camera keeps moving, round to the framing that the field shot continues
  [M.so - 0.1, ck(-12, 50, 2.5, 50, 0.0, 0)],
  [M.switched + 0.3, ck(8, 62, 2.6, 50, 0.05, 0)],
  [M.electric2 + 0.35, ck(-26, 46, 3.2, 50, 0.2, 0)],
  [M.except, ck(-64, 34, 4.3, 52, 0.455 - 0.065, 0)],
];
const jetCam = (t: number): Cam => {
  const top = (tt: number): Cam => {
    const i = jetIntake(JB(tt), 2);
    return {pos: a3(i, v3(0, JET_D, 0.006)), tgt: i, roll: 0, fov: 50};
  };
  const mid = aboveGround(orbitBoard(JB(Math.min(t, M.so)), splineRec(t, JETK)), 0.12);
  const kIn = sstep(M.but, M.but + 0.55, t);
  return kIn >= 1 ? mid : swingCam(top(t), mid, kIn);
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
const FuelLeak: React.FC<{L: Lens; B: Frame; t: number; t0: number; t1: number}> = ({L, B, t, t0, t1}) => {
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
  return (
    <g opacity={k}>
      <ellipse cx={f2(pp.x)} cy={f2(pp.y)} rx={f2(r)} ry={f2(r * 0.45)} fill="#E7A02A" opacity={0.75} />
      <ellipse cx={f2(pp.x - r * 0.2)} cy={f2(pp.y - r * 0.08)} rx={f2(r * 0.4)} ry={f2(r * 0.14)} fill="#FFE29A" opacity={0.6} />
      <circle cx={f2(pf.x)} cy={f2(pf.y + 0.008 * pf.k)} r={f2(0.008 * pf.k)} fill="#F5B53A" stroke="#8A5A10" strokeWidth={f2(Math.max(0.5, 0.0015 * pf.k))} />
      <path d={vap.join('')} stroke="#FFF1C4" strokeOpacity={0.25} strokeWidth={f2(Math.max(1, 0.006 * pp.k))} fill="none" strokeLinecap="round" />
      {els}
    </g>
  );
};
// the redesign in the same cradle: the electric board's deck sits on the stand rails where the jet plank was
const BE = (B: Frame): Frame => ({...B, o: a3(B.o, m3(B.y, -0.045 + BD.thick))});
const builtAt = (t: number) => 10 * sstep(M.switched + 0.05, M.except - 0.3, t);
const LEAK0 = M.andCaught - 0.15;
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
  const out = sstep(M.fireE + 0.25, M.so - 0.35, t);
  const fireK = sstep(M.fire - 0.02, M.fire + 0.06, t) * (1 - out);
  const flameAt = [0, 0.2, 0.45, 0.7].filter((u) => u <= spread * 0.9 + 0.01).map(along);
  const burn = sstep(M.fire + 0.08, M.fire + 0.8, t);
  const flash = Math.max(0, 1 - Math.abs(t - M.fire - 0.03) / 0.12) * 0.55;
  const react = sstep(M.fire - 0.02, M.fire + 0.3, t) * (1 - sstep(M.so - 0.2, M.so + 0.3, t));
  const flinch = sstep(M.fire, M.fire + 0.16, t) * (1 - sstep(M.fire + 0.8, M.fire + 1.3, t));
  const jInv = pilotJoints(INV, inventor4(react, flinch));
  const invNear = (cam.pos.x - INV.o.x) ** 2 + (cam.pos.z - INV.o.z) ** 2 < 0.5;
  // the old plank gives way to the new frame in the same cradle (a dissolve, while the camera keeps moving)
  const swap = sstep(M.so - 0.05, M.switched + 0.1, t);
  const smokeK = sstep(M.fire + 0.2, M.so, t) * 0.6 * (1 - sstep(M.so - 0.2, M.switched + 0.2, t));
  return (
    <g>
      <WorkshopBack id={`${id}-ws`} L={L} t={t} glow={(r * 0.5 + 0.7 * fireK + 0.3 * h) * (1 - swap)} smoke={smokeK} />
      {!invNear && <Pilot id={`${id}-inv`} L={L} j={jInv} />}
      <Exhaust id={`${id}-ex`} L={L} nozzles={nozzles} floorY={0} k={r} t={t} />
      <TestStand L={L} B={B} />
      {swap < 1 && (
        <g opacity={1 - swap}>
          <JetBoard id={`${id}-jb`} L={L} B={B} stand={false} st={{phase: jetPhase(t), rps: jetRps(t), burn, heat: h}} />
          <FuelLeak L={L} B={B} t={t} t0={LEAK0} t1={M.fire} />
          <HeatHaze L={L} at={nozzles.map((n) => a3(n, v3(0, 0.12, 0)))} k={h * (1 - burn * 0.6)} t={t} />
          <Recirc L={L} from={nozzles.map((n) => v3(n.x, 0.05, n.z))} to={intakes} k={recirc} t={t} />
          <Smoke L={L} at={flameAt.length ? flameAt : [fl[2]]} t={t} t0={M.fire + 0.1} k={0.8 * sstep(M.fire, M.fire + 0.3, t) * (1 - sstep(M.so - 0.5, M.so + 0.2, t))} />
          <Flames id={`${id}-fl`} L={L} at={flameAt} size={0.15} k={fireK} t={t} />
          <Flash id={`${id}-fs`} c={L.p(fl[2])} k={flash} />
        </g>
      )}
      {swap > 0 && (
        <g opacity={swap}>
          <Rider id={`${id}-eb`} L={L} B={BE(B)} pose={lift4(0, 10).pose} noPilot st={{phase: 0, rps: 0, thrust: 0, built: builtAt(t)}} />
        </g>
      )}
    </g>
  );
};

// ================================================================ 5: learning on the field (A problem, B feet, C ride, D coach)
const FK = {lift: M.except + 0.12, huge: M.huge, theBoard: M.theBoard, itself: M.itself, heHas: M.heHas, body: M.body, while: M.while, cue: M.coach, fix: M.learn - 0.1, done: M.balance2, end: M.andAfter};
const FIELD = fieldFlight(FK);
// V4: front three-quarter views on longer lenses only (both legs always read separately, proportions don't stretch),
// one continuous push from the whole body to the legs and deck and back out as he rides, then the devices
const AK: Key[] = [
  [M.except, ck(6, 34, 4.3, 52, 0.455, 0)],
  [M.except + 0.6, ck(-22, 4, 4.9, 42, 0.62, 0)],
  [M.huge, ck(-26, 3, 4.6, 42, 0.6, 0)],
  [M.problemE, ck(-30, 4, 4.4, 42, 0.6, 0)],
  [M.theBoard - 0.2, ck(-28, 6, 3.6, 42, 0.6, 0)],
  // in to his legs, the ankles and the deck: the feet stay planted while the knees and hips do the work
  [M.theBoard + 0.35, ck(-18, 10, 2.3, 38, 0.42, 0)],
  [M.itself, ck(-8, 9, 2.15, 38, 0.38, 0)],
  [M.heHas - 0.1, ck(4, 10, 2.25, 38, 0.42, 0)],
  // back out as he leans and rides off; the gust; the whole-body save
  [M.heHas + 0.55, ck(-14, 8, 4.5, 42, 0.62, 0)],
  [M.body - 0.6, ck(-22, 7, 4.6, 42, 0.62, 0)],
  [M.body + 0.2, ck(-28, 9, 4.5, 42, 0.62, 0)],
  [M.while, ck(-4, 30, 2.2, 40, 0.3, 0)],
];
const fieldCam = (t: number, st: St): Cam => aboveGround(orbitBoard(st.B, splineRec(t, AK)), 0.25);
/** in the legs close-up the protected region is the feet, ankles, knees and the deck (captions go above them) */
const feetBox = (L: Lens, st: St): Box => {
  const j = pilotJoints(st.B, st.pose);
  const pts = [j.kneeF, j.kneeR, j.ankF, j.ankR, ...BD.outline.filter((_, i) => i % 3 === 0).map(([x, z]) => toW(st.B, v3(x, 0, z)))].map((q) => L.p(q));
  return {x0: Math.min(...pts.map((p) => p.x)) - 30, y0: Math.min(...pts.map((p) => p.y)) - 40, x1: Math.max(...pts.map((p) => p.x)) + 30, y1: Math.max(...pts.map((p) => p.y)) + 40};
};
// D: the phone in the deck (from above), then his own view over his shoulder of the wrist he raises to read, round
// to the earbud as the cue comes in, and out to the whole body as he makes the correction
const D2 = M.voice - 0.09;
const coachCam = (t: number, st: St): Cam => {
  if (t < D2) return orbitBoard(st.B, splineRec(t, [[M.while, ck(-2, 52, 1.05, 38, 0.004, 0)], [D2, ck(6, 60, 0.92, 38, 0.004, 0)]]));
  const j = pilotJoints(st.B, st.pose);
  const fd = n3(s3(j.wriF, j.elbF));
  const wrist = a3(j.wriF, m3(fd, -0.07));
  const ear = a3(j.Hc, m3(j.hL, 0.1));
  // his own view of the wrist: from beside his helmet, along the line to his eyes
  const wristCam: Cam = {pos: a3(a3(a3(wrist, m3(n3(s3(j.Hc, wrist)), 0.56)), m3(j.chL, 0.1)), m3(j.up, 0.05)), tgt: wrist, roll: 0, fov: 36};
  const earCam = orbitAnch(st.B, ca(232, 8, 1.1, 36, 0.0, 0, 1), [wrist, ear]);
  // the cue arrives: cut from the wrist to the earbud it plays in
  if (t < M.coach + 0.06) return wristCam;
  if (t < M.learn - 0.05) return earCam;
  const out = orbitAnch(st.B, splineRec(t, [[M.learn + 0.6, ca(300, 14, 4.6, 42, 0.8, 0, 0)], [M.andAfter, ca(332, 7, 5.4, 42, 0.85, 0, 0)]]), [wrist, ear]);
  return aboveGround(swingCam(earCam, out, sstep(M.learn - 0.05, M.learn + 0.6, t)), 0.25);
};

// ================================================================ 6: the practice progression
const E2 = M.andAfter + 0.49, E3 = M.tenDays, E4 = M.practice - 0.06;
const E1K: Key[] = [[M.andAfter, ck(-12, 4, 4.4, 44, 0.5, 0)], [E2, ck(-22, 7, 4.6, 44, 0.52, 0)]];
const E2K: Key[] = [[E2, ck(-40, 66, 5.6, 56, 0.3, 0)], [E3, ck(-24, 70, 6.0, 56, 0.3, 0)]];
const E3K: Key[] = [[E3, ck(206, -10, 4.4, 58, 0.85, 0)], [E4, ck(196, -6, 4.7, 58, 0.85, 0)]];
const E4K: Key[] = [
  [E4, ck(330, 24, 5.8, 58, 0.7, 0)],
  [E4 + 0.5, ck(320, 18, 5.6, 58, 0.7, 0)],
  [M.heActually + 0.2, ck(294, 8, 5.0, 54, 0.7, 0)],
  // up and back over the open river: its width ahead of him, the far cliffs and the gorge mouth he is heading for
  [M.flew, ck(318, 18, 11.0, 54, 1.5, 0)],
];
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
// V4: led by the destination: from behind and above him, the gorge mouth in the far cliffs ahead and the whole river
// around him; down behind him as the walls rise at the mouth; then alongside him between the walls, which slide past at
// their own depths, the river under him. Heights stay modest (about 5 m).
const TIN = M.andThrough + 0.09;
const PAYK: Key[] = [
  [M.flew, ck(350, 15, 9.5, 52, 1.3, 0)],
  [M.river2 + 0.1, ck(356, 11, 6.0, 54, 1.0, 0)],
  [M.andThrough + 0.25, ck(10, 8, 6.0, 56, 1.0, 0)],
  [M.canyon + 0.25, ck(338, 7, 5.4, 56, 1.0, 0)],
  [M.canyonE + 0.35, ck(318, 7, 5.0, 56, 1.0, 0)],
  [M.howMuch, ck(310, 8, 5.0, 56, 1.0, 0)],
];
const payCam = (t: number) => orbitBoard(payoff4(t, TIN).B, splineRec(t, PAYK));
/** channel buoys along the crossing: foreground objects passing at their own depth (speed and scale) */
const BUOYS = [[-34, 30], [-47, 70], [-33, 118], [584, 452], [598, 476], [578, 498], [9, 130]].map(([x, z]) => v3(x, 0, z));
const Buoys: React.FC<{L: Lens; t: number}> = ({L, t}) => (
  <g>
    {BUOYS.filter((b) => l3(s3(b, L.pos)) < 160).sort((a, b) => l3(s3(b, L.pos)) - l3(s3(a, L.pos))).map((b, i) => <Buoy key={i} L={L} at={b} t={t} />)}
  </g>
);

// ================================================================ 8: the ending (the hook's trajectory, tau = t - DUR)
// V4: the rider is in every frame of the question: from behind his shoulder over the river (matching the canyon shot's
// framing), in close beside him on "PAY YOU", and round to frame 0's low front three-quarter, with the camera's
// velocity carried through the loop point.
const ENDK: Key[] = [
  [M.howMuch, ck(306, 9, 4.6, 50, 0.95, 0)],
  [M.pay - 0.1, ck(292, 6, 4.2, 46, 0.95, 0)],
  [M.pay + 0.5, ck(280, 1, 3.7, 42, 0.95, 0)],
  [M.thing, ck(272, -8, 4.4, 44, 0.6, -1)],
  [LOOPK[0], LOOPK[1]],
  [DUR, HOOKK[1][1]],
  // beyond the loop point: the hook's next key, so the camera's velocity carries straight through frame 0
  [DUR + HOOKK[2][0], HOOKK[2][1]],
];
const endCam = (t: number): Cam => orbitBoard(hook4(t - DUR).B, splineRec(t, ENDK));

// ================================================================ the shot list
const riverShot = (name: string, from: number, to: number, stAt: (t: number) => St, camAt: (t: number) => Cam, o: {blur?: (t: number) => boolean; surface?: (t: number) => 'water' | 'ground'; jets?: (t: number) => number; reach?: (t: number) => number; pov?: (t: number) => boolean} = {}): Shot => ({
  name, from, to,
  draw: (t, pre) => {
    const st = stAt(t);
    const L = lens(camAt(t));
    const L2 = o.blur?.(t) ? lens(camAt(t - SHUT)) : undefined;
    return <FlightScene id={`${pre}${name.slice(0, 3)}`} t={t} st={st} L={L} L2={L2} set="river" surface={o.surface?.(t) ?? 'water'} jets={o.jets?.(t) ?? 1} reach={o.reach?.(t)} pov={o.pov?.(t)} />;
  },
  focus: (t) => box(lens(camAt(t)), stAt(t)),
});

export const SHOTS4: Shot[] = [
  riverShot('hook: the crossing, then the mechanism from below', 0, CUT2, hook4, hookCam, {
        jets: (t) => 0.75 + 0.25 * sstep(M.yousee, M.ten, t) + 0.45 * sstep(M.electric, M.electric + 0.4, t) * (1 - sstep(M.blast + 0.6, CUT2, t)),
    // "electric propellers blast air downward": the jets lengthen as the rotors speed up
    reach: (t) => 1.3 + 1.9 * sstep(M.electric, M.electric + 0.5, t),
  }),
  {
    name: 'the lift on the riverside flat', from: CUT2, to: M.but,
    draw: (t, pre) => {
      const st = lift4(t, MATCH);
      return <FlightScene id={`${pre}lf`} t={t} st={st} L={lens(liftCam(t))} set="river" surface="ground" />;
    },
    focus: (t) => (t > M.but - 0.35 ? null : box(lens(liftCam(t)), lift4(t, MATCH))),
  },
  {name: 'the jet prototype test and the redesign on the same stand (workshop)', from: M.but, to: M.except, draw: (t, pre) => <WorkshopScene id={`${pre}ws`} t={t} />, focus: () => ({x0: 140, y0: 520, x1: 940, y1: 1340})},
  {
    name: 'learning: the problem, the feet, the ride (field)', from: M.except, to: M.while,
    draw: (t, pre) => {
      const st = FIELD(t);
      return <FlightScene id={`${pre}fa`} t={t} st={st} L={lens(fieldCam(t, st))} set="field" surface="ground" />;
    },
    focus: (t) => {
      const st = FIELD(t);
      const L = lens(fieldCam(t, st));
      return t > M.theBoard - 0.25 && t < M.heHas + 0.1 ? feetBox(L, st) : box(L, st);
    },
  },
  {
    name: 'learning: board phone, wrist phone, earpiece, the correction (field)', from: M.while, to: M.andAfter,
    draw: (t, pre) => {
      const st = FIELD(t);
      return <FlightScene id={`${pre}fd`} t={t} st={st} L={lens(coachCam(t, st))} set="field" surface="ground" coach={st.pulse} jets={t < M.learn ? 0.4 : 1} />;
    },
    focus: (t) => (t < M.learn ? {x0: 300, y0: 700, x1: 780, y1: 1200} : box(lens(coachCam(t, FIELD(t))), FIELD(t))),
  },
  {
    name: 'practice: an unsteady takeoff (field, morning)', from: M.andAfter, to: E2,
    draw: (t, pre) => {
      const st = takeoff(t, M.andAfter);
      return <FlightScene id={`${pre}e1`} t={t} st={st} L={lens(orbitBoard(st.B, splineRec(t, E1K)))} set="field" surface="ground" tint={0.35} />;
    },
    focus: (t) => box(lens(orbitBoard(takeoff(t, M.andAfter).B, splineRec(t, E1K))), takeoff(t, M.andAfter)),
  },
  {
    name: 'practice: an S-curve from overhead (field)', from: E2, to: E3,
    draw: (t, pre) => {
      const st = sCurve(t, E2);
      const L = lens(orbitBoard(st.B, splineRec(t, E2K)));
      return <FlightScene id={`${pre}e2`} t={t} st={st} L={L} set="field" surface="ground" under={<PathTrace L={L} T0={E2} t={t} />} />;
    },
    focus: (t) => box(lens(orbitBoard(sCurve(t, E2).B, splineRec(t, E2K))), sCurve(t, E2)),
  },
  riverShot('practice: low and level across the riverside flat', E3, E4, dep, (t) => aboveGround(orbitBoard(dep(t).B, splineRec(t, E3K)), 0.3), {surface: () => 'ground'}),
  riverShot('over the shoreline and out over the river', E4, M.flew, dep, (t) => orbitBoard(dep(t).B, splineRec(t, E4K)), {
    blur: (t) => t > M.heActually,
    surface: (t) => (dep(t).pos.z < 0 ? 'ground' : 'water'),
  }),
  riverShot('the crossing and into the canyon', M.flew, M.howMuch, (t) => payoff4(t, TIN), payCam),
  {
    name: 'ending: behind his shoulder, in beside him, round to frame 0', from: M.howMuch, to: DUR + 1,
    draw: (t, pre) => {
      const st = hook4(t - DUR);
      const L2 = t > DUR - 0.6 ? lens(endCam(t - SHUT)) : undefined;
      return <FlightScene id={`${pre}en`} t={t} st={st} L={lens(endCam(t))} L2={L2} set="river" surface="water" />;
    },
    focus: (t) => box(lens(endCam(t)), hook4(t - DUR)),
  },
];
export const shotAt4 = (t: number) => SHOTS4.find((s) => t >= s.from && t < s.to) ?? SHOTS4[SHOTS4.length - 1];
export type {Box, CK};
export {DEP, toW};
