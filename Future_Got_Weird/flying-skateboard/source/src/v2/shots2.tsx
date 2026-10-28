// V2 shot list. Same narration and timing as V1 (story/time.ts); every boundary placed on the measured words.
// Connected moves share camera splines; separate places are joined by motivated matches (water ring -> field,
// fan -> compressor, scorched compressor -> new electric fan, water -> water) and deliberate cuts to detail. The
// ending runs on the hook's own trajectory and lands exactly on frame 0's camera.
import React from 'react';
import {BD, DuctUnit, ductWorld} from '../art/Board';
import {JetBoard, jetFuelLine, jetIntake, jetNozzle} from '../art/JetBoard';
import {TripodPhone} from '../art/Monitor';
import {Pilot} from '../art/Pilot';
import {pilotJoints} from '../art/rig';
import {noise1} from '../dc/math';
import {a3, Cam, Frame, frameYPR, l3, lens, Lens, lerp3, m3, n3, orbit, s3, v3, V3} from '../eng/v3';
import {FieldBack, Leaves} from '../env/Field';
import {Buoy, Downwash, RiverBack, Wake} from '../env/River';
import {BENCH, WorkshopBack} from '../env/Workshop';
import {Airflow} from '../fx/Airflow';
import {Exhaust, Flames, Flash, Recirc, Smoke} from '../fx/Fire';
import {DuctSection} from '../fx/Section';
import {FlightState, sstep} from '../story/flight';
import {ca, ck, CK, CKA, Key, orbitAnch, orbitBoard, splineRec} from '../story/cam';
import {Rider, RiderShadow} from '../story/rider';
import {DUR, E, T} from '../story/time';
import {coachFlight, earlyHover, glide, GORGE, hookFlight, inventorPose, liftDemo2, lowPass, payoffFlight, problemFlight, REST} from './flight2';

export type Box = {x0: number; y0: number; x1: number; y1: number};
export type Shot = {name: string; from: number; to: number; draw: (t: number, pre: string) => React.ReactNode; focus?: (t: number) => Box | Box[] | null};

export const M = {
  yousee: T('you see'), ten: T('ten'), powerfulE: E('powerful'), electric: T('electric'), blast: T('blast'), lifting: T('lifting'), ground: T('ground'), groundE: E('ground'),
  but: T('but'), jet: T('jet'), engines: T('engines'), andCaught: T('and caught'), fire: T('fire'), fireE: E('fire'), so: T('so he'),
  electric2: T('electric', 1), switched: T('switched') - 0.05, except: T('except'), huge: T('huge'), problemE: E('problem'), theBoard: T('the board'), itself: T('itself'),
  heHas: T('he has'), body: T('body'), while: T('while'), ai: T('ai'), voice: T('voice'), coach: T('coach'), learn: T('learn'), balance2: T('balance', 1),
  andAfter: T('and after'), tenDays: T('ten days'), practice: T('practice'), heActually: T('he actually'), flew: T('flew'), river2: T('river', 1), river2E: E('river', 1),
  andThrough: T('and through'), through: T('through'), canyon: T('canyon'), canyonE: E('canyon'), howMuch: T('how much'), pay: T('pay'), thing: T('thing'), thingE: E('thing'),
};

export const riderBox = (L: Lens, B: Frame, pose: FlightState['pose']): Box => {
  const j = pilotJoints(B, pose);
  const pts = [j.Hc, j.ankF, j.ankR, j.handF, j.handR, j.P, ...BD.outline.filter((_, i) => i % 3 === 0).map(([x, z]) => a3(a3(B.o, m3(B.x, x)), m3(B.z, z)))].map((q) => L.p(q));
  return {x0: Math.min(...pts.map((p) => p.x)) - 30, y0: Math.min(...pts.map((p) => p.y)) - 60, x1: Math.max(...pts.map((p) => p.x)) + 30, y1: Math.max(...pts.map((p) => p.y)) + 40};
};
export const blendCam = (a: Cam, b: Cam, k: number): Cam => ({pos: lerp3(a.pos, b.pos, k), tgt: lerp3(a.tgt, b.tgt, k), roll: (a.roll ?? 0) * (1 - k) + (b.roll ?? 0) * k, fov: (a.fov ?? 50) * (1 - k) + (b.fov ?? 50) * k});
/** blend two cameras about their targets: the view direction turns and the distance eases, so a move from a close
 * top-down view out to a wide one swings round the subject instead of sliding the eye through the scenery */
export const swingCam = (a: Cam, b: Cam, k: number): Cam => {
  const tgt = lerp3(a.tgt, b.tgt, k);
  const oa = s3(a.pos, a.tgt), ob = s3(b.pos, b.tgt);
  const da = l3(oa), db = l3(ob);
  const dir = n3(lerp3(m3(oa, 1 / da), m3(ob, 1 / db), k));
  const dist = Math.exp(Math.log(da) * (1 - k) + Math.log(db) * k);
  return {pos: a3(tgt, m3(dir, dist)), tgt, roll: (a.roll ?? 0) * (1 - k) + (b.roll ?? 0) * k, fov: (a.fov ?? 50) * (1 - k) + (b.fov ?? 50) * k};
};
/** orbit parameters equivalent to a world camera about the board target (to hand a world move back to an orbit) */
export const toOrbit = (B: Frame, cam: Cam, ty: number, fov: number): CK => {
  const tgt = a3(B.o, v3(0, ty, 0));
  const d = s3(cam.pos, tgt);
  const dist = l3(d);
  const el = (Math.asin(d.y / dist) * 180) / Math.PI;
  const az = (Math.atan2(-d.x, -d.z) * 180) / Math.PI;
  return ck(az, el, dist, fov, ty, 0);
};
export const unwrap = (az: number, near: number) => az + 360 * Math.round((near - az) / 360);

// ================================================================ A + B: the hook and the mechanism (one flight over the river)
const HOOKA: Key[] = [
  [0.0, ck(252, -19, 4.6, 60, 0.0, -3)],
  [0.35, ck(262, -17, 4.0, 58, 0.05, -1)],
  [0.8, ck(276, -14, 4.0, 52, 0.35, 0)],
  [1.45, ck(282, 10, 11, 58, 1.0, 0)],
  [2.02, ck(226, 7, 6.4, 54, 0.8, 0)],
];
const CROSS0 = 2.02, CROSS1 = 3.05;
const crossCam = (t: number): Cam => {
  // the crossing: the camera holds its place in the world (just ahead of the line, low over the water), cranes up
  // and banks while he flies toward it, past it and over it
  const s0 = hookFlight(CROSS0);
  const c0 = orbitBoard(s0.B, splineRec(CROSS0, HOOKA));
  const k = sstep(CROSS0, CROSS1, t);
  const st = hookFlight(t);
  const pos = a3(c0.pos, v3(-1.2 * k, 5.5 * sstep(CROSS0, CROSS0 + 0.75, t) - 2.5 * sstep(CROSS0 + 0.7, CROSS1, t), 1.5 * k));
  const tgt = a3(st.B.o, v3(0, 0.7 - 0.6 * sstep(CROSS0 + 0.6, CROSS1, t), 0));
  return {pos, tgt, roll: -11 * Math.sin(Math.PI * k), fov: 54 + 6 * Math.sin(Math.PI * k)};
};
const HOOKB = (() => {
  const s = hookFlight(CROSS1);
  const o = toOrbit(s.B, crossCam(CROSS1), crossCam(CROSS1).tgt.y - s.B.o.y, 56);
  o.az = unwrap(o.az, 240);
  const keys: Key[] = [
    [CROSS1, o],
    [M.yousee + 0.15, ck(258, -64, 3.2, 52, -0.1, 0)],
    [M.ten + 0.15, ck(290, -80, 2.7, 52, -0.15, 0)],
    [M.powerfulE - 0.15, ck(324, -78, 2.5, 52, -0.15, 0)],
    [M.electric + 0.12, ck(298, -20, 2.6, 50, -0.1, 0, 0.285, 0)],
    [M.electric + 0.45, ck(273, -4, 3.3, 50, -0.3, 0, 0.285, 0)],
    [M.blast - 0.1, ck(268, -3, 3.4, 50, -0.32, 0, 0.285, 0)],
    [M.blast + 0.3, ck(252, -8, 5.6, 52, 0.0, 0)],
    [M.lifting - 0.74, ck(246, -10, 6.4, 52, -0.2, 0)],
  ];
  return keys;
})();
const MATCH1 = M.lifting - 0.74;
const riverCamAt = (t: number): Cam => {
  const st = hookFlight(t);
  if (t < CROSS0) return orbitBoard(st.B, splineRec(t, HOOKA));
  if (t < CROSS1) return crossCam(t);
  return orbitBoard(st.B, splineRec(t, HOOKB));
};
const SECTION_I = 5; // the toe-side duct at mid-length, facing the camera in the side view
const RiverScene: React.FC<{id: string; t: number; tau: number; cam: Cam; cam2?: Cam; extra?: React.ReactNode; spin?: number; blur?: number; count?: number; airflow?: number; section?: number}> = ({id, t, tau, cam, cam2, extra, spin = 2.6, blur = 11, count = 0, airflow = 0, section = 0}) => {
  const st = hookFlight(tau);
  const L = lens(cam);
  const L2 = cam2 ? lens(cam2) : undefined;
  return (
    <g>
      <RiverBack id={`${id}-rv`} L={L} t={tau} gorge={GORGE} L2={L2} />
      <Buoy L={L} at={{x: 5.5, y: 0, z: 262}} t={tau} />
      <Wake L={L} path={[1, 2, 3, 4, 5, 6, 7].map((k) => hookFlight(tau - k * 0.25))} thrust={st.thrust} />
      <Downwash L={L} at={st.pos} alt={st.alt} thrust={st.thrust} t={tau} />
      {airflow > 0 && <Airflow L={L} B={st.B} t={tau} thrust={Math.min(1, st.thrust + 0.2)} reach={2.8} alpha={airflow} />}
      <Rider id={id} L={L} B={st.B} pose={st.pose} st={{phase: tau * spin, rps: blur, thrust: st.thrust, tilt: {pitch: st.pitch, roll: st.roll}, count}} />
      {section > 0 && <DuctSection id={`${id}-sec`} L={L} B={st.B} i={SECTION_I} k={section} t={tau} phase={tau * spin} />}
      {extra}
    </g>
  );
};

// ================================================================ C: the lift on the ground (field)
const liftSt = (t: number) => {
  const s = liftDemo2(t, MATCH1);
  return t > M.but - 0.5 ? {...s, rps: 12} : s;
};
const LIFTK: Key[] = [
  [MATCH1, ck(250, 4, 6.6, 52, 0.7, 0)],
  [MATCH1 + 0.45, ck(262, -6, 4.2, 54, 0.45, 0)],
  [M.lifting, ck(272, -16, 3.3, 56, 0.55, 0)],
  [M.lifting + 0.55, ck(284, -13, 3.1, 56, 1.05, 0)],
  [M.ground - 0.45, ck(304, 4, 2.5, 50, 1.4, 0)],
  [M.groundE, ck(326, 2, 2.7, 50, 1.25, 0)],
];
const FAN_I = 8, FAN_D = 0.62;
export const aboveGround = (c: Cam, y = 0.28): Cam => (c.pos.y >= y ? c : {...c, pos: v3(c.pos.x, y, c.pos.z)});
const liftCam = (t: number, st: FlightState): Cam => {
  const c = aboveGround(orbitBoard(st.B, splineRec(t, LIFTK)));
  const k = sstep(M.groundE, M.but, t);
  if (k <= 0) return c;
  const duct = ductWorld(st.B, FAN_I, BD.fanY);
  return blendCam(c, {pos: a3(duct, v3(0, -FAN_D, -0.012)), tgt: duct, roll: 0, fov: 50}, k);
};
const FieldScene: React.FC<{id: string; t: number; st: FlightState & {rps: number}; L: Lens; leafT0?: number; tint?: number; coach?: number; extra?: React.ReactNode; before?: React.ReactNode}> = ({id, t, st, L, leafT0, tint = 0, coach = 0, extra, before}) => (
  <g>
    <FieldBack id={`${id}-fd`} L={L} t={t} tint={tint} wind={0.3 + st.thrust * 0.6 * Math.max(0, 1 - (st.alt - REST) / 3)} />
    <Downwash L={L} at={v3(st.pos.x, 0, st.pos.z)} alt={Math.max(0.3, st.alt)} thrust={st.thrust} t={t} ground="dust" />
    {leafT0 !== undefined && <Leaves L={L} t={t} t0={leafT0} at={v3(0, 0, 0)} />}
    <RiderShadow L={L} B={st.B} pose={st.pose} />
    {before}
    <Airflow L={L} B={st.B} t={t} thrust={st.thrust * (st.alt > REST + 0.05 ? 1 : 0.5)} reach={1.2} alpha={0.8} />
    <Rider id={id} L={L} B={st.B} pose={st.pose} coach={coach} st={{phase: t * 2.6, rps: st.rps > 20 ? 11 : st.rps, thrust: st.thrust, tilt: {pitch: st.pitch, roll: st.roll}}} />
    {extra}
  </g>
);

// ================================================================ D: the jet prototype test (workshop)
const JET_D = (0.064 * FAN_D) / 0.108;
const JB = (t: number) => {
  const vib = 0.007 * sstep(M.engines + 0.3, M.andCaught + 0.2, t) * (1 - sstep(M.fireE + 0.2, M.fireE + 0.7, t));
  return frameYPR(v3(noise1(t * 40, 1) * vib, 0.92 + noise1(t * 43, 2) * vib, noise1(t * 37, 3) * vib), 20, 0, 0);
};
const INV = frameYPR(v3(-0.9, 0, 2.2), 68, 0, 0);
const run = (t: number) => sstep(M.jet - 0.05, M.jet + 0.3, t) * (1 - sstep(M.fireE + 0.15, M.fireE + 0.6, t));
const heat = (t: number) => sstep(M.engines + 0.2, M.fire - 0.05, t) * (1 - 0.6 * sstep(M.so - 0.3, M.so + 0.5, t));
/** compressor turns (rev/s on screen): the hand spin-check at the start, the run, then windmilling down after shutdown */
const jetPhase = (t: number) => -(t * 2.6 + 6 * Math.max(0, Math.min(t, M.fireE + 0.3) - M.jet));
const jetRps = (t: number) => 9 + 22 * run(t) - 6 * sstep(M.fireE, M.so - 0.2, t);
const JETK: Key[] = [
  [M.but + 0.55, ck(10, 58, 1.9, 50, 0.0, 0)],
  [M.but + 1.05, ck(-28, 30, 3.6, 52, 0.0, 0)],
  [M.jet - 0.05, ck(-14, 16, 2.7, 50, -0.15, 0)],
  [M.engines + 0.4, ck(14, 9, 2.2, 50, -0.28, 0)],
  [M.andCaught + 0.1, ck(30, 24, 1.6, 50, -0.02, 0)],
  [M.fire + 0.02, ck(42, 30, 1.45, 50, 0.02, 0)],
  [M.fireE + 0.25, ck(2, 20, 3.4, 52, 0.0, 0)],
  [M.so - 0.42, ck(-4, 50, 1.6, 50, 0.05, 0)],
];
const jetCam = (t: number): Cam => {
  const B = JB(t);
  const top = (tt: number): Cam => {
    const i = jetIntake(JB(tt), 2);
    return {pos: a3(i, v3(0, JET_D, 0.006)), tgt: i, roll: 0, fov: 50};
  };
  const mid = orbitBoard(B, splineRec(t, JETK));
  const kIn = sstep(M.but, M.but + 0.6, t);
  const kOut = sstep(M.so - 0.42, M.so, t);
  if (kOut > 0) return blendCam(mid, top(t), kOut);
  return blendCam(top(t), mid, kIn);
};
const JetScene: React.FC<{id: string; t: number}> = ({id, t}) => {
  const cam = jetCam(t);
  const L = lens(cam);
  const B = JB(t);
  const r = run(t);
  const h = heat(t);
  // the last engine (rear corner) lowered into its mount; the centre engine's compressor turned by hand
  const lift = [0, 0, 0, 0, 0.32 * (1 - sstep(M.but + 0.35, M.but + 0.95, t))];
  const nozzles = [0, 1, 2, 3, 4].map((i) => jetNozzle(B, i));
  const intakes = [0, 1, 2, 3, 4].map((i) => jetIntake(B, i));
  const recirc = sstep(M.engines + 0.3, M.andCaught + 0.1, t) * (1 - sstep(M.fire + 0.1, M.fire + 0.6, t));
  // the fire: the leaking fitting at the centre engine ignites, and the flame runs back along that fuel line
  const fl = jetFuelLine(B, 2);
  const along = (u: number) => (u < 0.5 ? lerp3(fl[2], fl[1], u * 2) : lerp3(fl[1], fl[0], (u - 0.5) * 2));
  const spread = sstep(M.fire, M.fire + 0.55, t);
  const out = sstep(M.fireE + 0.35, M.so - 0.3, t);
  const fireK = sstep(M.fire - 0.02, M.fire + 0.08, t) * (1 - out);
  const flameAt = [0, 0.25, 0.5, 0.75].filter((u) => u <= spread * 0.85 + 0.01).map(along);
  const burn = sstep(M.fire + 0.1, M.fire + 0.9, t);
  const flash = Math.max(0, 1 - Math.abs(t - M.fire - 0.03) / 0.12) * 0.7;
  const react = sstep(M.fire - 0.02, M.fire + 0.35, t) * (1 - sstep(M.so - 0.2, M.so + 0.3, t));
  const flinch = sstep(M.fire, M.fire + 0.18, t) * (1 - sstep(M.fire + 0.8, M.fire + 1.3, t));
  const jInv = pilotJoints(INV, inventorPose(react, flinch));
  const invNear = (cam.pos.x - INV.o.x) ** 2 + (cam.pos.z - INV.o.z) ** 2 < 0.5;
  return (
    <g>
      <WorkshopBack id={`${id}-ws`} L={L} t={t} glow={r * 0.5 + 0.6 * fireK} smoke={sstep(M.fire + 0.2, M.so, t) * 0.7 * (1 - 0.6 * sstep(M.so - 0.6, M.so - 0.15, t))} />
      {!invNear && <Pilot id={`${id}-inv`} L={L} j={jInv} />}
      <Exhaust id={`${id}-ex`} L={L} nozzles={nozzles} floorY={0} k={r} t={t} />
      <JetBoard id={`${id}-jb`} L={L} B={B} st={{phase: jetPhase(t), rps: jetRps(t), burn, lift, heat: h}} />
      <Recirc L={L} from={nozzles.map((n) => v3(n.x, 0.05, n.z))} to={intakes} k={recirc} t={t} />
      <Smoke L={L} at={flameAt.length ? flameAt : [fl[2]]} t={t} t0={M.fire + 0.1} k={0.8 * sstep(M.fire, M.fire + 0.3, t) * (1 - 0.65 * sstep(M.so - 0.6, M.so - 0.15, t))} />
      <Flames id={`${id}-fl`} L={L} at={flameAt} size={0.16} k={fireK} t={t} />
      <Flash id={`${id}-fs`} c={L.p(fl[2])} k={flash} />
    </g>
  );
};

// ================================================================ E: the redesign (workshop bench)
const BENCH_B = frameYPR(v3((BENCH.x0 + BENCH.x1) / 2 - 0.6, BENCH.y + BD.thick + 0.005, (BENCH.z0 + BENCH.z1) / 2 - 0.05), 90, 0, 0);
const UNIT0 = v3(BENCH_B.o.x + 1.25, BENCH.y, BENCH.z0 + 0.32);
const UNIT_D = (0.105 / 0.064) * JET_D;
const SOCK0 = ductWorld(BENCH_B, 0, -BD.thick);
const unitPos = (t: number) => {
  const e = sstep(M.switched - 0.1, M.switched + 0.5, t);
  return a3(lerp3(UNIT0, SOCK0, e), v3(0, 0.2 * Math.sin(Math.PI * e), 0));
};
const BENCHK: Key[] = [
  [M.so + 0.5, ck(-30, 58, 2.6, 50, 0.0, 0)],
  [M.electric2 + 0.3, ck(-8, 46, 3.4, 52, 0.0, 0)],
  [M.except, ck(6, 38, 3.8, 52, 0.0, 0)],
];
const benchCam = (t: number): Cam => {
  const top: Cam = {pos: a3(UNIT0, v3(0, UNIT_D + BD.thick, 0.009)), tgt: a3(UNIT0, v3(0, BD.thick * 0.6, 0)), roll: 0, fov: 50};
  // frame the spare unit and the board together until the unit is seated
  const pull = 0.45 * (1 - sstep(M.switched, M.switched + 0.9, t));
  const mid = orbitBoard({...BENCH_B, o: lerp3(BENCH_B.o, UNIT0, pull)}, splineRec(t, BENCHK));
  return swingCam(top, mid, sstep(M.so + 0.05, M.so + 0.75, t));
};
const BenchScene: React.FC<{id: string; t: number}> = ({id, t}) => {
  const L = lens(benchCam(t));
  const placed = t >= M.switched + 0.5;
  const built = placed ? 1 + 9 * sstep(M.switched + 0.55, M.except - 0.2, t) : 0;
  const B = JB(M.so);
  return (
    <g>
      <WorkshopBack id={`${id}-ws`} L={L} t={t} smoke={0.28 * (1 - sstep(M.so, M.switched, t))} />
      <JetBoard id={`${id}-jb`} L={L} B={B} st={{phase: 0, rps: 0, burn: 1}} />
      <Rider id={`${id}-b`} L={L} B={BENCH_B} pose={liftSt(0).pose} noPilot st={{phase: 0, rps: 0, thrust: 0, built}} />
      {!placed && <DuctUnit L={L} B={BENCH_B} c={unitPos(t)} phase={jetPhase(M.so) * -1 + (t - M.so) * 1.7} />}
    </g>
  );
};

// ================================================================ F: the balance problem (field)
const PROB = problemFlight({lift: M.except + 0.12, huge: M.huge, theBoard: M.theBoard, body: M.body, end: M.while});
const PROBK: Key[] = [
  [M.except, ck(6, 42, 2.9, 50, -REST + 0.13, 0)],
  [M.except + 0.45, ck(-30, 12, 3.9, 52, 0.7, 0)],
  [M.huge, ck(-50, 6, 3.6, 52, 0.8, 0)],
  [M.problemE, ck(-64, 5, 3.4, 52, 0.8, 0)],
  [M.theBoard - 0.01, ck(-70, 5, 3.4, 52, 0.8, 0)],
];
const FEETK: Key[] = [
  [M.theBoard, ck(-72, 3, 2.4, 46, 0.05, 0)],
  [M.itself - 0.1, ck(-92, 4, 2.2, 46, 0.04, 0)],
  [M.heHas - 0.01, ck(-108, 5, 2.4, 46, 0.06, 0)],
];
const WIDEK: Key[] = [
  [M.heHas, ck(-18, 10, 5.6, 52, 0.8, 0)],
  [M.heHas + 0.9, ck(-36, 9, 5.0, 52, 0.8, 0)],
  [M.body, ck(-54, 7, 4.5, 52, 0.85, 0)],
  [M.while, ck(-62, 7, 4.6, 52, 0.85, 0)],
];
const probCam = (t: number, st: FlightState): Cam => {
  if (t < M.theBoard) return aboveGround(orbitBoard(st.B, splineRec(t, PROBK)));
  if (t < M.heHas) return aboveGround(orbitBoard(st.B, splineRec(t, FEETK)), 0.22);
  return aboveGround(orbitBoard(st.B, splineRec(t, WIDEK)));
};

// ================================================================ G: the AI coach (field, two monitoring phones)
const COACH = coachFlight({start: M.while, cue: M.coach, fix: M.learn - 0.1, done: M.balance2, end: M.andAfter});
const PH1 = v3(3.0, 0, -3.6), PH2 = v3(4.8, 0, 1.4);
const phoneC = (b: V3) => a3(b, v3(0, 1.22, 0));
const phoneAz = (b: V3, aim: V3) => {
  const f = n3(s3(aim, phoneC(b)));
  return (Math.atan2(f.x, f.z) * 180) / Math.PI;
};
const overPhone = (b: V3, aim: V3, back: number, side: number, look: number): Cam => {
  const C = phoneC(b);
  const f = n3(s3(aim, C));
  const r = n3(v3(f.z, 0, -f.x)); // horizontal right of the phone's view
  return {pos: a3(a3(a3(C, m3(f, -back)), m3(r, side)), v3(0, 0.07, 0)), tgt: lerp3(a3(C, m3(f, 0.4)), aim, look), roll: 0, fov: 48};
};
const coachCam = (t: number, st: FlightState): Cam => {
  const j = pilotJoints(st.B, st.pose);
  const aim = a3(st.B.o, v3(0, 0.8, 0));
  const ear = a3(j.Hc, m3(j.hL, 0.1));
  // over phone 1's shoulder: its screen in the foreground, the rider beyond it
  const c1 = overPhone(PH1, aim, 0.62, 0.16, 0.75);
  const c1b = overPhone(PH1, aim, 0.36, 0.08, 0.35);
  // the earbud: close, from the bud's side
  const earCam = orbitAnch(st.B, ca(-74, 6, 0.8, 46, 0.0, 0, 1), [aim, ear]);
  const body = orbitBoard(st.B, ck(-96, 8, 2.9, 50, 0.8, 0));
  const c2 = overPhone(PH2, aim, 0.7, -0.18, 0.8);
  const c2b = overPhone(PH2, aim, 1.6, -0.3, 0.9);
  const seq: [number, Cam][] = [[M.while, c1], [M.voice - 0.05, c1b], [M.coach + 0.25, earCam], [M.learn + 0.2, body], [M.balance2 + 0.15, c2], [M.andAfter, c2b]];
  let i = 0;
  while (i < seq.length - 2 && t > seq[i + 1][0]) i++;
  const [t0, a] = seq[i], [t1, b] = seq[i + 1];
  return blendCam(a, b, sstep(t0, t1, t));
};

// ================================================================ H: the practice montage
const EARLYK: Key[] = [[M.andAfter, ck(-58, 5, 3.5, 52, 0.55, 0)], [M.andAfter + 0.75, ck(-70, 6, 3.1, 52, 0.55, 0)]];
const PASS0 = M.andAfter + 0.75, GLIDE0 = M.practice - 0.1;
const PASSK: Key[] = [[PASS0, ck(-8, 6, 4.2, 52, 0.7, 0)], [GLIDE0, ck(8, 5, 3.8, 52, 0.7, 0)]];
const GLIDEK: Key[] = [[GLIDE0, ck(-6, 4, 4.4, 54, 0.6, 0)], [M.heActually, ck(6, 6, 5.2, 54, 0.7, 0)]];

// ================================================================ I: the payoff (across the last of the river, into the gorge)
const TIN = M.andThrough + 0.12;
const PAY0 = M.heActually;
const payoff = (t: number) => payoffFlight(t, PAY0, TIN);
const PAYK: Key[] = [
  [PAY0, ck(196, 22, 24, 56, 2.5, 0)],
  [PAY0 + 0.45, ck(214, 9, 8.6, 54, 0.8, 0)],
  [M.flew + 0.2, ck(286, 5, 6.6, 54, 0.8, 0)],
  [M.river2 + 0.1, ck(346, 8, 8.0, 56, 1.2, 0)],
  [TIN, ck(360, 6, 8.6, 60, 1.4, 0)],
  [M.through + 0.25, ck(366, 5, 7.4, 62, 1.2, 0)],
  [M.canyon + 0.3, ck(348, 12, 6.4, 62, 0.9, 0)],
  [M.canyonE + 0.25, ck(358, 28, 15, 62, -2, 0)],
  [M.howMuch, ck(360, 36, 15.5, 62, -3.5, 0)],
];

// ================================================================ J: the ending (the hook's trajectory, tau = t - DUR)
const ENDK: Key[] = [
  [M.howMuch, ck(165, 36, 12.5, 62, -1.5, 0)],
  [M.howMuch + 0.7, ck(170, 16, 5.2, 54, 0.6, 0)],
  [M.pay, ck(186, -6, 2.1, 56, 0.2, 0)],
  [M.pay + 0.4, ck(196, -18, 1.7, 58, 0.0, 0)],
  [M.thing - 0.05, ck(222, -20, 3.4, 56, 0.2, -1)],
  [M.thingE + 0.5, ck(240, -19, 4.2, 58, 0.06, -2)],
  [DUR, ck(252, -19, 4.6, 60, 0.0, -3)],
];
const endCam = (t: number): Cam => orbitBoard(hookFlight(t - DUR).B, splineRec(t, ENDK));

// ================================================================ the shot list
const SHUT = 0.02; // motion-blur shutter for the water (s)
export const SHOTS2: Shot[] = [
  {
    name: 'hook + mechanism (river)', from: 0, to: MATCH1,
    draw: (t, pre) => {
      const spinUp = sstep(M.electric, M.electric + 0.6, t);
      return (
        <RiverScene id={`${pre}rv`} t={t} tau={t} cam={riverCamAt(t)} cam2={t < 1.5 ? riverCamAt(t - SHUT) : undefined}
          spin={2.6 + 2.2 * spinUp} blur={11 + 6 * spinUp}
          count={t > M.ten - 0.05 && t < M.electric + 0.25 ? sstep(M.ten, M.powerfulE, t) : 0}
          airflow={sstep(M.ten, M.electric, t) * (1 - 0.8 * sstep(M.electric, M.electric + 0.3, t) * (1 - sstep(M.blast, M.blast + 0.3, t)))}
          section={sstep(M.electric + 0.04, M.electric + 0.4, t) * (1 - sstep(M.blast + 0.05, M.blast + 0.35, t))} />
      );
    },
    focus: (t) => {
      const st = hookFlight(t);
      return riderBox(lens(riverCamAt(t)), st.B, st.pose);
    },
  },
  {
    name: 'the lift (field)', from: MATCH1, to: M.but,
    draw: (t, pre) => {
      const st = liftSt(t);
      return <FieldScene id={`${pre}lf`} t={t} st={st} L={lens(liftCam(t, st))} leafT0={st.leafT0} />;
    },
    focus: (t) => {
      const st = liftSt(t);
      return t > M.groundE ? {x0: 200, y0: 500, x1: 880, y1: 1400} : riderBox(lens(liftCam(t, st)), st.B, st.pose);
    },
  },
  {name: 'the jet prototype test (workshop)', from: M.but, to: M.so, draw: (t, pre) => <JetScene id={`${pre}jt`} t={t} />, focus: () => ({x0: 120, y0: 480, x1: 960, y1: 1360})},
  {name: 'the electric redesign (bench)', from: M.so, to: M.except, draw: (t, pre) => <BenchScene id={`${pre}bn`} t={t} />, focus: () => ({x0: 100, y0: 560, x1: 980, y1: 1300})},
  {
    name: 'the balance problem (field)', from: M.except, to: M.while,
    draw: (t, pre) => {
      const st = PROB(t);
      return <FieldScene id={`${pre}pb`} t={t} st={st} L={lens(probCam(t, st))} />;
    },
    focus: (t) => {
      const st = PROB(t);
      return riderBox(lens(probCam(t, st)), st.B, st.pose);
    },
  },
  {
    name: 'the AI coach (field)', from: M.while, to: M.andAfter,
    draw: (t, pre) => {
      const st = COACH(t);
      const L = lens(coachCam(t, st));
      const j = pilotJoints(st.B, st.pose);
      const aim = a3(st.B.o, v3(0, 0.8, 0));
      const phones = [PH1, PH2].map((b, i) => <TripodPhone key={i} id={`${pre}ph${i}`} L={L} base={b} aim={aim} j={j} B={st.B} roll={st.roll} pulse={st.pulse} />);
      // the phones are in front of the rider when the camera is behind them; otherwise behind him
      const behindPhone = (b: V3) => l3(s3(L.pos, phoneC(b))) < l3(s3(L.pos, st.B.o));
      return <FieldScene id={`${pre}co`} t={t} st={st} L={L} coach={st.pulse} before={phones.filter((_, i) => !behindPhone([PH1, PH2][i]))} extra={phones.filter((_, i) => behindPhone([PH1, PH2][i]))} />;
    },
    focus: (t) => {
      const st = COACH(t);
      return riderBox(lens(coachCam(t, st)), st.B, st.pose);
    },
  },
  {
    name: 'practice: an early session (field)', from: M.andAfter, to: PASS0,
    draw: (t, pre) => {
      const st = earlyHover(t);
      return <FieldScene id={`${pre}e1`} t={t} st={st} L={lens(orbitBoard(st.B, splineRec(t, EARLYK)))} />;
    },
    focus: (t) => {
      const st = earlyHover(t);
      return riderBox(lens(orbitBoard(st.B, splineRec(t, EARLYK))), st.B, st.pose);
    },
  },
  {
    name: 'practice: a controlled low pass (field, late light)', from: PASS0, to: GLIDE0,
    draw: (t, pre) => {
      const st = lowPass(t, PASS0);
      return <FieldScene id={`${pre}e2`} t={t} st={st} L={lens(orbitBoard(st.B, splineRec(t, PASSK)))} tint={0.55} />;
    },
    focus: (t) => {
      const st = lowPass(t, PASS0);
      return riderBox(lens(orbitBoard(st.B, splineRec(t, PASSK))), st.B, st.pose);
    },
  },
  {
    name: 'practice: a sustained glide (river, near bank)', from: GLIDE0, to: PAY0,
    draw: (t, pre) => {
      const st = glide(t, GLIDE0);
      const L = lens(orbitBoard(st.B, splineRec(t, GLIDEK)));
      return (
        <g>
          <RiverBack id={`${pre}g3-rv`} L={L} t={t} gorge={GORGE} />
          <Downwash L={L} at={st.pos} alt={st.alt} thrust={st.thrust} t={t} />
          <Rider id={`${pre}g3`} L={L} B={st.B} pose={st.pose} st={{phase: t * 2.6, rps: 11, thrust: st.thrust, tilt: {pitch: st.pitch, roll: st.roll}}} />
        </g>
      );
    },
    focus: (t) => {
      const st = glide(t, GLIDE0);
      return riderBox(lens(orbitBoard(st.B, splineRec(t, GLIDEK))), st.B, st.pose);
    },
  },
  {
    name: 'across the river and into the canyon', from: PAY0, to: M.howMuch,
    draw: (t, pre) => {
      const st = payoff(t);
      const cam = orbitBoard(st.B, splineRec(t, PAYK));
      const L = lens(cam);
      return (
        <g>
          <RiverBack id={`${pre}py-rv`} L={L} t={t} gorge={GORGE} />
          <Downwash L={L} at={st.pos} alt={st.alt} thrust={st.thrust} t={t} />
          <Rider id={`${pre}py`} L={L} B={st.B} pose={st.pose} st={{phase: t * 2.6, rps: 11, thrust: st.thrust, tilt: {pitch: st.pitch, roll: st.roll}}} />
        </g>
      );
    },
    focus: (t) => {
      const st = payoff(t);
      return riderBox(lens(orbitBoard(st.B, splineRec(t, PAYK))), st.B, st.pose);
    },
  },
  {
    name: 'ending (river, the hook trajectory, lands on frame 0)', from: M.howMuch, to: DUR + 1,
    draw: (t, pre) => {
      const tau = t - DUR;
      return <RiverScene id={`${pre}en`} t={t} tau={tau} cam={endCam(t)} cam2={t > DUR - 0.6 ? endCam(t - SHUT) : undefined} />;
    },
    focus: (t) => {
      const st = hookFlight(t - DUR);
      return riderBox(lens(endCam(t)), st.B, st.pose);
    },
  },
];
export const shotAt2 = (t: number) => SHOTS2.find((s) => t >= s.from && t < s.to) ?? SHOTS2[SHOTS2.length - 1];
export {DUR, orbit};
