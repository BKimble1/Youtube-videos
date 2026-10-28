// V3 shot list. Same narration and timing as V1/V2 (story/time.ts). Every move has a reason: following the rider,
// revealing the mechanism, showing the height, or carrying us to the next place. Places are joined by matches (the
// spinning fan seen from below becomes the same fan seen from above on the riverside flat; the fan seen from below
// becomes a jet intake; the scorched compressor becomes a new electric fan; the board on the bench becomes the board on
// the field) or by cuts to a different view of the same action. The ending runs on the hook's own trajectory and lands
// exactly on frame 0's camera.
import React from 'react';
import {BD, DuctUnit, ductWorld} from '../art/Board';
import {JetBoard, jetFuelLine, jetIntake, jetNozzle} from '../art/JetBoard';
import {Pilot} from '../art/Pilot';
import {pilotJoints} from '../art/rig';
import {noise1} from '../dc/math';
import {f2, polyD, proj} from '../eng/draw';
import {a3, Cam, d3, Frame, frameYPR, l3, lens, Lens, lerp3, m3, n3, s3, toW, v3, V3} from '../eng/v3';
import {FieldBack} from '../env/Field';
import {RiverBack} from '../env/River';
import {BENCH, WorkshopBack} from '../env/Workshop';
import {AirJets} from '../fx/AirJets';
import {Exhaust, Flames, Flash, Recirc, Smoke} from '../fx/Fire';
import {Wash} from '../fx/Wash';
import {sstep} from '../story/flight';
import {ca, ck, CK, Key, orbitAnch, orbitBoard, splineRec} from '../story/cam';
import {Rider, RiderShadow} from '../story/rider';
import {DUR} from '../story/time';
import {aboveGround, blendCam, Box, M, riderBox, Shot, swingCam, toOrbit, unwrap} from '../v2/shots2';
import {DEP, departure, fieldFlight, GORGE3, hook3, inventor3, lift3, payoff3, REST, sCurve, sCurvePath, St, takeoff} from './flight3';

export {M};
const NEAR = 150; // the riverside flat between the water and the near-bank hills (m)

// ================================================================ shared scene: a flight over water or ground
type SceneP = {id: string; t: number; st: St; L: Lens; L2?: Lens; set: 'river' | 'field'; surface: 'water' | 'ground'; tint?: number; coach?: number; pov?: boolean; jets?: number; reach?: number; sun?: V3; extra?: React.ReactNode; under?: React.ReactNode};
const FlightScene: React.FC<SceneP> = ({id, t, st, L, L2, set, surface, tint = 0, coach = 0, pov, jets = 1, reach, sun, extra, under}) => (
  <g>
    {set === 'river'
      ? <RiverBack id={`${id}-rv`} L={L} t={t} gorge={GORGE3} near={NEAR} L2={L2} tint={tint} cliffs wind={0.3 + 0.5 * Math.max(0, 1 - st.alt / 4)} />
      : <FieldBack id={`${id}-fd`} L={L} t={t} tint={tint} wind={0.3 + st.thrust * 0.6 * Math.max(0, 1 - (st.alt - REST) / 3)} />}
    {under}
    <Wash id={`${id}-wa`} L={L} at={st.pos} alt={st.alt} thrust={st.thrust} t={t} vel={st.vel} surface={surface} />
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

// ================================================================ 1: the hook and the mechanism (one flight over the Yangtze)
const MATCH = M.lifting - 0.74; // the fan push-in lands here; the lift starts from the same fan seen from above
const ROTOR = 7; // toe-side duct, second row from the nose
// the ending's last key before the loop (shared, so the camera velocity at frame 0 is the same on both sides)
const LOOPK: [number, CK] = [M.thingE + 0.6, ck(212, -9, 4.3, 56, 0.72, -1.5)];
const HOOKK: Key[] = [
  [LOOPK[0] - DUR, LOOPK[1]],
  [0.0, ck(222, -11, 4.15, 56, 0.75, -2)],
  [0.45, ck(242, -8, 4.2, 56, 0.72, -1)],
  [0.85, ck(268, -4, 4.6, 55, 0.75, 0)],
  [1.2, ck(298, -22, 3.8, 56, 0.45, 0)],
  [1.6, ck(326, -48, 3.2, 58, 0.15, 0)],
  [1.95, ck(334, -18, 3.9, 56, 0.4, 0)],
  [2.3, ck(326, 26, 4.6, 56, 0.4, 0)],
  [2.65, ck(316, 38, 4.8, 56, 0.15, 0)],
  [3.05, ck(318, 9, 4.8, 56, 0.75, 0)],
  [M.yousee, ck(304, -36, 3.0, 56, 0.15, 0)],
  [M.yousee + 0.35, ck(292, -66, 2.6, 54, -0.1, 0)],
  [M.ten + 0.15, ck(300, -82, 2.4, 52, -0.15, 0)],
  [M.powerfulE - 0.1, ck(330, -80, 2.3, 52, -0.15, 0)],
  [M.electric + 0.35, ck(282, -12, 3.1, 50, -0.4, 0)],
  [M.blast - 0.05, ck(272, -24, 2.1, 50, -0.25, 0, 0.285, 0.26)],
];
const pushCam = (B: Frame, d: number): Cam => ({pos: a3(ductWorld(B, ROTOR, -BD.thick), m3(B.y, -d)), tgt: ductWorld(B, ROTOR, BD.fanY), roll: 0, fov: 50});
const hookCam = (t: number): Cam => {
  const st = hook3(t);
  const c = orbitBoard(st.B, splineRec(t, HOOKK));
  const k = sstep(M.blast - 0.05, MATCH, t);
  if (k <= 0) return c;
  return blendCam(c, pushCam(st.B, 1.1 - 0.86 * k), sstep(0, 0.55, k));
};

// ================================================================ 2: the lift (the riverside flat)
const FAN_I = 9, FAN_D = 0.62;
const LIFTK: Key[] = [
  [MATCH + 0.7, ck(300, 30, 1.7, 52, 0.25, 0)],
  [M.lifting + 0.3, ck(292, 10, 1.9, 50, 0.32, 0)],
  [M.lifting + 0.8, ck(296, 9, 3.2, 54, 0.7, 0)],
  [M.ground - 0.25, ck(320, 18, 7.0, 58, 1.0, 0)],
  [M.ground + 0.22, ck(298, -46, 4.1, 62, 0.95, 0)],
  [M.but - 0.3, ck(288, -50, 3.8, 62, 0.85, 0)],
];
const liftCam = (t: number): Cam => {
  const st = lift3(t, MATCH);
  const top: Cam = {pos: a3(a3(ductWorld(st.B, ROTOR, 0), m3(st.B.y, 0.26)), m3(st.B.z, 0.004)), tgt: ductWorld(st.B, ROTOR, BD.fanY), roll: 0, fov: 50};
  const mid = aboveGround(orbitBoard(st.B, splineRec(t, LIFTK)), 0.3);
  if (t < MATCH + 0.7) return swingCam(top, mid, sstep(MATCH + 0.04, MATCH + 0.7, t));
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
const INV = frameYPR(v3(-1.55, 0, 2.55), 62, 0, 0);
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
  [M.so - 0.42, ck(-4, 50, 1.6, 50, 0.05, 0)],
];
const jetCam = (t: number): Cam => {
  const top = (tt: number): Cam => {
    const i = jetIntake(JB(tt), 2);
    return {pos: a3(i, v3(0, JET_D, 0.006)), tgt: i, roll: 0, fov: 50};
  };
  const mid = aboveGround(orbitBoard(JB(t), splineRec(t, JETK)), 0.12);
  const kIn = sstep(M.but, M.but + 0.55, t);
  const kOut = sstep(M.so - 0.42, M.so, t);
  if (kOut > 0) return blendCam(mid, top(t), kOut);
  return swingCam(top(t), mid, kIn);
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
const JetScene: React.FC<{id: string; t: number}> = ({id, t}) => {
  const cam = jetCam(t);
  const L = lens(cam);
  const B = JB(t);
  const r = run(t);
  const h = heat(t);
  const nozzles = [0, 1, 2, 3, 4].map((i) => jetNozzle(B, i));
  const intakes = [0, 1, 2, 3, 4].map((i) => jetIntake(B, i));
  const recirc = sstep(M.engines + 0.3, M.andCaught + 0.1, t) * (1 - sstep(M.fire + 0.1, M.fire + 0.6, t));
  // the fire: the leaking fitting at the centre engine ignites and the flame runs back along that fuel line; the
  // fuel is shut off and it dies down, leaving the scorched line, wiring and deck
  const fl = jetFuelLine(B, 2);
  const along = (u: number) => (u < 0.5 ? lerp3(fl[2], fl[1], u * 2) : lerp3(fl[1], fl[0], (u - 0.5) * 2));
  const spread = sstep(M.fire, M.fire + 0.45, t);
  const out = sstep(M.fireE + 0.25, M.so - 0.35, t);
  const fireK = sstep(M.fire - 0.02, M.fire + 0.06, t) * (1 - out);
  const flameAt = [0, 0.25, 0.5, 0.75].filter((u) => u <= spread * 0.85 + 0.01).map(along);
  const burn = sstep(M.fire + 0.08, M.fire + 0.8, t);
  const flash = Math.max(0, 1 - Math.abs(t - M.fire - 0.03) / 0.12) * 0.75;
  const react = sstep(M.fire - 0.02, M.fire + 0.3, t) * (1 - sstep(M.so - 0.2, M.so + 0.3, t));
  const flinch = sstep(M.fire, M.fire + 0.16, t) * (1 - sstep(M.fire + 0.8, M.fire + 1.3, t));
  const jInv = pilotJoints(INV, inventor3(react, flinch));
  const invNear = (cam.pos.x - INV.o.x) ** 2 + (cam.pos.z - INV.o.z) ** 2 < 0.5;
  return (
    <g>
      <WorkshopBack id={`${id}-ws`} L={L} t={t} glow={r * 0.5 + 0.7 * fireK + 0.3 * h} smoke={sstep(M.fire + 0.2, M.so, t) * 0.6 * (1 - 0.6 * sstep(M.so - 0.6, M.so - 0.15, t))} />
      {!invNear && <Pilot id={`${id}-inv`} L={L} j={jInv} />}
      <Exhaust id={`${id}-ex`} L={L} nozzles={nozzles} floorY={0} k={r} t={t} />
      <JetBoard id={`${id}-jb`} L={L} B={B} st={{phase: jetPhase(t), rps: jetRps(t), burn, heat: h}} />
      <HeatHaze L={L} at={nozzles.map((n) => a3(n, v3(0, 0.12, 0)))} k={h * (1 - burn * 0.6)} t={t} />
      <Recirc L={L} from={nozzles.map((n) => v3(n.x, 0.05, n.z))} to={intakes} k={recirc} t={t} />
      <Smoke L={L} at={flameAt.length ? flameAt : [fl[2]]} t={t} t0={M.fire + 0.1} k={0.8 * sstep(M.fire, M.fire + 0.3, t) * (1 - 0.65 * sstep(M.so - 0.6, M.so - 0.15, t))} />
      <Flames id={`${id}-fl`} L={L} at={flameAt} size={0.17} k={fireK} t={t} />
      <Flash id={`${id}-fs`} c={L.p(fl[2])} k={flash} />
    </g>
  );
};

// ================================================================ 4: the redesign (workshop bench montage)
const BENCH_B = frameYPR(v3((BENCH.x0 + BENCH.x1) / 2 - 0.6, BENCH.y + BD.thick + 0.005, (BENCH.z0 + BENCH.z1) / 2 - 0.05), 90, 0, 0);
const UNIT0 = v3(BENCH_B.o.x + 1.25, BENCH.y, BENCH.z0 + 0.32);
const UNIT_D = (0.105 / 0.064) * JET_D;
const SOCK0 = ductWorld(BENCH_B, 0, -BD.thick);
const MB = M.switched + 0.0; // the montage's second beat (overhead)
const MC = M.electric2 + 0.06; // third beat (low across the bench)
const MD = M.except - 0.36; // rise to the framing that matches the field
const unitPos = (t: number) => {
  const e = sstep(M.switched - 0.1, M.switched + 0.45, t);
  return a3(lerp3(UNIT0, SOCK0, e), v3(0, 0.2 * Math.sin(Math.PI * e), 0));
};
const builtAt = (t: number) => (t >= M.switched + 0.45 ? 1 + 9 * sstep(M.switched + 0.5, M.except - 0.25, t) : 0);
const benchCam = (t: number): Cam => {
  if (t < MB) {
    const top: Cam = {pos: a3(UNIT0, v3(0, UNIT_D + BD.thick, 0.009)), tgt: a3(UNIT0, v3(0, BD.thick * 0.6, 0)), roll: 0, fov: 50};
    const out = orbitBoard({...BENCH_B, o: lerp3(BENCH_B.o, UNIT0, 0.6)}, ck(-20, 66, 1.6, 50, 0.0, 0));
    return swingCam(top, out, sstep(M.so + 0.05, MB, t) * 0.55);
  }
  if (t < MC) return orbitBoard({...BENCH_B, o: lerp3(BENCH_B.o, UNIT0, 0.3 * (1 - sstep(MB, MC, t)))}, splineRec(t, [[MB, ck(-6, 80, 2.5, 52, 0.0, 0)], [MC, ck(18, 78, 2.3, 52, 0.0, 0)]]));
  if (t < MD) return orbitBoard(BENCH_B, splineRec(t, [[MC, ck(-74, 16, 2.3, 48, 0.0, 0, 0, -0.1)], [MD, ck(-62, 20, 2.4, 48, 0.0, 0, 0, 0.0)]]));
  return orbitBoard(BENCH_B, splineRec(t, [[MD, ck(-30, 30, 2.8, 50, 0.1, 0)], [M.except, ck(6, 34, 4.3, 52, 0.45, 0)]]));
};
const BenchScene: React.FC<{id: string; t: number}> = ({id, t}) => {
  const L = lens(benchCam(t));
  const placed = t >= M.switched + 0.45;
  const B = JB(M.so);
  return (
    <g>
      <WorkshopBack id={`${id}-ws`} L={L} t={t} smoke={0.25 * (1 - sstep(M.so, M.switched, t))} />
      <JetBoard id={`${id}-jb`} L={L} B={B} st={{phase: 0, rps: 0, burn: 1, heat: 0}} />
      <Rider id={`${id}-b`} L={L} B={BENCH_B} pose={lift3(0, 10).pose} noPilot st={{phase: 0, rps: 0, thrust: 0, built: builtAt(t)}} />
      {!placed && <DuctUnit L={L} B={BENCH_B} c={unitPos(t)} phase={-jetPhase(M.so) + (t - M.so) * 1.7} />}
    </g>
  );
};

// ================================================================ 5: learning on the field (A problem, B feet, C ride, D coach)
const FK = {lift: M.except + 0.12, huge: M.huge, theBoard: M.theBoard, itself: M.itself, heHas: M.heHas, body: M.body, while: M.while, cue: M.coach, fix: M.learn - 0.1, done: M.balance2, end: M.andAfter};
const FIELD = fieldFlight(FK);
const AK: Key[] = [
  [M.except, ck(6, 34, 4.3, 52, 0.45 - REST + 0.13, 0)],
  [M.except + 0.5, ck(-28, 2, 3.4, 52, 0.72, 0)],
  [M.huge, ck(-48, -2, 3.1, 52, 0.78, 0)],
  [M.huge + 0.55, ck(-80, 1, 3.0, 52, 0.8, 0)],
  [M.problemE, ck(-96, 2, 2.8, 52, 0.75, 0)],
  [M.theBoard, ck(-108, 3, 2.6, 52, 0.7, 0)],
];
// B: low at the heel edge and the tail; C: the crane up the back to over his rear shoulder, looking down the nose
const BCK: Key[] = [
  [M.theBoard, ck(160, 3, 1.65, 46, 0.16, 0)],
  [M.itself, ck(138, 4, 1.3, 46, 0.12, 0)],
  [M.heHas - 0.05, ck(114, 8, 1.45, 46, 0.16, 0)],
];
/** over his rear shoulder from behind his back, looking along the nose and down at the ground sliding under the board */
const otsCam = (st: St, t: number): Cam => ({
  pos: toW(st.B, v3(-0.42 + 0.03 * Math.sin(t * 1.3), 2.05, -0.95)),
  tgt: toW(st.B, v3(0.3, -0.9, 2.3)),
  roll: 0,
  fov: 62,
});
const fieldCam = (t: number, st: St): Cam => {
  if (t < M.theBoard) return aboveGround(orbitBoard(st.B, splineRec(t, AK)), 0.25);
  const feet = aboveGround(orbitBoard(st.B, splineRec(t, BCK)), 0.2);
  const k = sstep(M.heHas - 0.05, M.heHas + 0.6, t);
  return k <= 0 ? feet : swingCam(feet, otsCam(st, t), k);
};
// D: the board's phone, the wrist phone, the earpiece, then out to the whole body as he corrects
const D2 = M.voice - 0.09, D3 = M.coach + 0.06;
const coachCam = (t: number, st: St): Cam => {
  const j = pilotJoints(st.B, st.pose);
  if (t < D2) return orbitBoard(st.B, splineRec(t, [[M.while, ck(-8, 56, 1.05, 46, 0.004, 0)], [D2, ck(4, 60, 0.9, 46, 0.004, 0)]]));
  if (t < D3) {
    // beside his helmet, looking down at the wrist he has turned up to read
    const fd = n3(s3(j.wriF, j.elbF));
    const ph = a3(j.wriF, m3(fd, -0.07));
    const k = sstep(D2, D3, t);
    const toEye = n3(s3(j.Hc, ph));
    return {pos: a3(a3(ph, m3(toEye, 0.42 - 0.06 * k)), m3(j.chL, 0.12)), tgt: a3(ph, m3(fd, -0.03)), roll: 0, fov: 42};
  }
  const aim = a3(st.B.o, v3(0, 0.8, 0));
  const ear = a3(j.Hc, m3(j.hL, 0.1));
  const earCam = orbitAnch(st.B, ca(-76, 6, 0.72, 46, 0.0, 0, 1), [aim, ear]);
  const k = sstep(M.learn - 0.1, M.learn + 0.55, t);
  if (k <= 0) return earCam;
  const wide = orbitBoard(st.B, splineRec(t, [[M.learn + 0.55, ck(-46, 8, 2.7, 52, 0.85, 0)], [M.andAfter, ck(-56, 6, 3.4, 52, 0.8, 0)]]));
  return swingCam(earCam, wide, k);
};

// ================================================================ 6: the practice progression
const E2 = M.andAfter + 0.49, E3 = M.tenDays, E4 = M.practice - 0.06;
const E1K: Key[] = [[M.andAfter, ck(-12, 4, 2.3, 50, 0.55, 0)], [E2, ck(-22, 7, 2.5, 50, 0.62, 0)]];
const E2K: Key[] = [[E2, ck(-40, 66, 5.6, 56, 0.3, 0)], [E3, ck(-24, 70, 6.0, 56, 0.3, 0)]];
const E3K: Key[] = [[E3, ck(206, -10, 4.4, 58, 0.85, 0)], [E4, ck(196, -6, 4.7, 58, 0.85, 0)]];
const E4K: Key[] = [
  [E4, ck(330, 24, 5.8, 58, 0.7, 0)],
  [E4 + 0.5, ck(320, 18, 5.6, 58, 0.7, 0)],
  [M.heActually + 0.25, ck(288, 6, 4.8, 56, 0.6, 0)],
  [M.flew, ck(270, 3, 5.0, 56, 0.6, 0)],
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
const TIN = M.andThrough + 0.09;
const PAYK: Key[] = [
  [M.flew, ck(164, 11, 9.0, 60, 1.1, 0)],
  [M.flew + 0.6, ck(186, 8, 7.8, 60, 1.0, 0)],
  [M.andThrough - 0.15, ck(232, 6, 7.2, 60, 0.9, 0)],
  [M.through + 0.25, ck(274, 5, 6.2, 60, 0.9, 0)],
  [M.canyon + 0.15, ck(322, 9, 5.6, 60, 1.2, 0)],
  [M.canyonE + 0.3, ck(346, 7, 5.1, 62, 1.35, 0)],
  [M.howMuch, ck(356, 6, 5.0, 62, 1.4, 0)],
];
const payCam = (t: number) => orbitBoard(payoff3(t, TIN).B, splineRec(t, PAYK));

// ================================================================ 8: the ending (the hook's trajectory, tau = t - DUR)
// In his own view looking past the board at the water, out of the helmet and up over his shoulder, round beside him,
// and down to frame 0's low front angle.
const ENDK: Key[] = [
  [M.pay + 0.3, ck(150, 30, 2.4, 56, 1.2, 0)],
  [M.pay + 0.75, ck(172, 16, 3.3, 56, 1.0, 0)],
  [M.thing - 0.05, ck(198, 2, 3.9, 56, 0.95, -1)],
  [LOOPK[0], LOOPK[1]],
  [DUR, HOOKK[1][1]],
  // beyond the loop point: the hook's second key, so the camera's velocity carries straight through frame 0
  [DUR + HOOKK[2][0], HOOKK[2][1]],
];
const POV_OUT = M.pay - 0.38, POV_UP = M.pay + 0.3;
const povCam = (st: St): Cam => {
  const j = pilotJoints(st.B, st.pose);
  const fh = n3(v3(st.vel.x, 0, st.vel.z));
  const toes = n3(v3(j.chF.x, 0, j.chF.z));
  // down past his own shoes, the deck and its toe edge, to the water 8 m below
  const look = n3(a3(a3(m3(toes, 0.5), m3(fh, 0.28)), v3(0, -0.85, 0)));
  const eye = a3(a3(j.Hc, m3(j.hU, 0.02)), m3(j.hF, 0.03));
  return {pos: eye, tgt: a3(eye, m3(look, 4)), roll: 0, fov: 66};
};
const UP_END = POV_OUT + 0.26;
const endCam = (t: number): {cam: Cam; pov: boolean} => {
  const st = hook3(t - DUR);
  const pc = povCam(st);
  if (t < POV_OUT) return {cam: pc, pov: true};
  const j = pilotJoints(st.B, st.pose);
  const fh = n3(v3(st.vel.x, 0, st.vel.z));
  // 1) straight up out of the helmet while the gaze lifts toward the far bank: his head and shoulders stay below the
  //    bottom of the frame as the camera leaves them; 2) back over his shoulder, looking down at the board again
  const mid = a3(j.Hc, v3(0, 0.75, 0));
  const upPos = a3(mid, m3(fh, -1.0));
  const upCam: Cam = {pos: upPos, tgt: a3(st.B.o, m3(fh, 1.2)), roll: 0, fov: 60};
  const eUp = sstep(POV_OUT, UP_END, t), eBack = sstep(UP_END, POV_UP, t);
  const lookUp = a3(mid, a3(m3(fh, 4), v3(0, -1.6, 0)));
  const pos = a3(lerp3(pc.pos, mid, eUp), m3(s3(upPos, mid), eBack));
  const tgt = lerp3(lerp3(pc.tgt, lookUp, eUp), upCam.tgt, eBack);
  if (t < POV_UP) return {cam: {pos, tgt, roll: 0, fov: 66 - 6 * eBack}, pov: t < UP_END};
  const o = toOrbit(st.B, upCam, upCam.tgt.y - st.B.o.y, 60);
  return {cam: orbitBoard(st.B, splineRec(t, [[POV_UP, {...o, az: unwrap(o.az, 160), tx: 0, tz: 0}], ...ENDK.slice(1)])), pov: false};
};
/** the sun for the shadow on the water: in his own view it falls ahead past his toes; by the time the camera is
 *  round in front of him it is back where the hook has it (frame 0 matches) */
const sunEnd = (t: number) => n3(lerp3(n3(v3(-0.32, 0.8, -0.3)), RSUN, sstep(POV_UP, M.thing, t)));

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

export const SHOTS3: Shot[] = [
  riverShot('hook: the crossing, then the mechanism from below', 0, MATCH, hook3, hookCam, {
        jets: (t) => 0.75 + 0.25 * sstep(M.yousee, M.ten, t) + sstep(M.electric, M.electric + 0.4, t) * (1 - sstep(M.blast + 0.3, MATCH, t)),
    // "electric propellers blast air downward": the jets lengthen as the rotors speed up
    reach: (t) => 1.3 + 1.6 * sstep(M.electric, M.electric + 0.5, t) * (1 - sstep(M.blast + 0.3, MATCH, t)),
  }),
  {
    name: 'through the rotor: the lift on the riverside flat', from: MATCH, to: M.but,
    draw: (t, pre) => {
      const st = lift3(t, MATCH);
      return <FlightScene id={`${pre}lf`} t={t} st={st} L={lens(liftCam(t))} set="river" surface="ground" />;
    },
    focus: (t) => (t < MATCH + 0.6 || t > M.but - 0.35 ? null : box(lens(liftCam(t)), lift3(t, MATCH))),
  },
  {name: 'the jet prototype test (workshop)', from: M.but, to: M.so, draw: (t, pre) => <JetScene id={`${pre}jt`} t={t} />, focus: () => ({x0: 140, y0: 520, x1: 940, y1: 1340})},
  {name: 'the redesign (bench montage)', from: M.so, to: M.except, draw: (t, pre) => <BenchScene id={`${pre}bn`} t={t} />, focus: () => ({x0: 100, y0: 560, x1: 980, y1: 1300})},
  {
    name: 'learning: the problem, the feet, the ride (field)', from: M.except, to: M.while,
    draw: (t, pre) => {
      const st = FIELD(t);
      return <FlightScene id={`${pre}fa`} t={t} st={st} L={lens(fieldCam(t, st))} set="field" surface="ground" />;
    },
    focus: (t) => {
      const st = FIELD(t);
      return box(lens(fieldCam(t, st)), st);
    },
  },
  {
    name: 'learning: board phone, wrist phone, earpiece, the correction (field)', from: M.while, to: M.andAfter,
    draw: (t, pre) => {
      const st = FIELD(t);
      return <FlightScene id={`${pre}fd`} t={t} st={st} L={lens(coachCam(t, st))} set="field" surface="ground" coach={st.pulse} jets={t < D3 ? 0.4 : 1} />;
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
  riverShot('the crossing and into the canyon', M.flew, M.howMuch, (t) => payoff3(t, TIN), payCam),
  {
    name: 'ending: his view, out over his shoulder, round to frame 0', from: M.howMuch, to: DUR + 1,
    draw: (t, pre) => {
      const st = hook3(t - DUR);
      const e = endCam(t);
      const L2 = t > DUR - 0.6 ? lens(endCam(t - SHUT).cam) : undefined;
      return <FlightScene id={`${pre}en`} t={t} st={st} L={lens(e.cam)} L2={L2} set="river" surface="water" pov={e.pov} sun={sunEnd(t)} />;
    },
    focus: (t) => (t < POV_UP ? {x0: 200, y0: 1100, x1: 880, y1: 1800} : box(lens(endCam(t).cam), hook3(t - DUR))),
  },
];
export const shotAt3 = (t: number) => SHOTS3.find((s) => t >= s.from && t < s.to) ?? SHOTS3[SHOTS3.length - 1];
export type {Box, CK};
export {DEP, toW};
