// The film as a list of shots, each a pure function of film time t (seconds). Every boundary is placed on the measured
// narration (time.ts). Continuous moves share one camera spline across a boundary; separate demonstrations are joined by
// motivated matches (water ring -> dust ring, fan -> intake, bench -> field) or by foreground wipes (river -> canyon ->
// river), and the ending lands on the hook's own trajectory so the last frame flows into frame 0.
import React from 'react';
import {BD, DuctUnit, ductWorld} from '../art/Board';
import {JetBoard, jetIntake, jetNozzle} from '../art/JetBoard';
import {pilotJoints} from '../art/rig';
import {noise1} from '../dc/math';
import {a3, Cam, Frame, frameYPR, lens, Lens, m3, orbit, v3} from '../eng/v3';
import {CanyonBack, cx} from '../env/Canyon';
import {FieldBack, Leaves} from '../env/Field';
import {Buoy, Downwash, RiverBack, Wake} from '../env/River';
import {BENCH, WorkshopBack} from '../env/Workshop';
import {Airflow} from '../fx/Airflow';
import {Exhaust, Flames, Flash, Recirc, Smoke} from '../fx/Fire';
import {MistWipe, RockWipe} from '../fx/Wipe';
import {bodyControl, FlightState, liftDemo, REST, riverFlight, sstep, tiltProblem} from './flight';
import {ca, ck, CKA, Key, orbitAnch, orbitBoard, splineRec} from './cam';
import {Rider, RiderShadow} from './rider';
import {DUR, E, T} from './time';

export type Box = {x0: number; y0: number; x1: number; y1: number};
export type Shot = {name: string; from: number; to: number; draw: (t: number, pre: string) => React.ReactNode; focus?: (t: number) => Box | null};

// ---------------------------------------------------------------- narration marks
export const M = {
  yousee: T('you see'), ten: T('ten'), powerfulE: E('powerful'), electric: T('electric'), blast: T('blast'), lifting: T('lifting'), ground: T('ground'),
  but: T('but'), jet: T('jet'), engines: T('engines'), andCaught: T('and caught'), fire: T('fire'), fireE: E('fire'), so: T('so he'),
  electric2: T('electric', 1), except: T('except'), huge: T('huge'), theBoard: T('the board'), itself: T('itself'),
  heHas: T('he has'), body: T('body'), while: T('while'), ai: T('ai'), voice: T('voice'), coach: T('coach'), learn: T('learn'), balance2: T('balance', 1),
  andAfter: T('and after'), tenDays: T('ten days'), practice: T('practice'), heActually: T('he actually'), flew: T('flew'), river2: T('river', 1), river2E: E('river', 1),
  andThrough: T('and through'), through: T('through'), canyon: T('canyon'), canyonE: E('canyon'), howMuch: T('how much'), pay: T('pay'), thing: T('thing'), thingE: E('thing'),
};

/** screen box of a board + pilot (for caption placement) */
const riderBox = (L: Lens, B: Frame, pose: FlightState['pose']): Box => {
  const j = pilotJoints(B, pose);
  const pts = [j.Hc, j.ankF, j.ankR, j.handF, j.handR, j.P, ...BD.outline.filter((_, i) => i % 3 === 0).map(([x, z]) => a3(a3(B.o, m3(B.x, x)), m3(B.z, z)))].map((q) => L.p(q));
  return {x0: Math.min(...pts.map((p) => p.x)) - 30, y0: Math.min(...pts.map((p) => p.y)) - 60, x1: Math.max(...pts.map((p) => p.x)) + 30, y1: Math.max(...pts.map((p) => p.y)) + 40};
};

// ---------------------------------------------------------------- the river (hook, mechanism and the ending share one trajectory)
const BUOY = {x: 4.5, z: 262};
type RiverOpts = {count?: number; spin?: number; blur?: number; thrust?: number; airflow?: number};
const RiverFrame: React.FC<{id: string; t: number; tau: number; L: Lens; o?: RiverOpts; pov?: boolean}> = ({id, t, tau, L, o = {}, pov}) => {
  const st = riverFlight(tau);
  const thrust = o.thrust ?? st.thrust;
  return (
    <g>
      <RiverBack id={`${id}-rv`} L={L} t={t} />
      <Buoy L={L} at={{x: BUOY.x, y: 0, z: BUOY.z}} t={t} />
      <Wake L={L} path={[1, 2, 3, 4, 5, 6, 7].map((k) => riverFlight(tau - k * 0.3))} thrust={thrust} />
      <Downwash L={L} at={st.pos} alt={st.alt} thrust={thrust} t={t} />
      {(o.airflow ?? 0) > 0 && <Airflow L={L} B={st.B} t={t} thrust={Math.min(1, thrust)} reach={2.6} alpha={o.airflow} />}
      <Rider id={id} L={L} B={st.B} pose={st.pose} pov={pov} st={{phase: t * (o.spin ?? 3.7), rps: o.blur ?? 30, thrust, tilt: {pitch: st.pitch, roll: st.roll}, count: o.count}} />
    </g>
  );
};

const HOOK: Key[] = [
  [0.0, ck(200, -12, 5.8, 50, 0.6, -2)],
  [0.35, ck(222, -10, 5.4, 50, 0.55, -1)],
  [0.7, ck(250, -14, 4.8, 50, 0.4, 0)],
  [1.1, ck(268, -18, 4.0, 50, 0.3, 1)],
  [1.5, ck(282, -14, 3.9, 50, 0.35, 0)],
  [2.05, ck(305, 6, 8.5, 52, 1.2, -1)],
  [2.6, ck(345, 13, 18, 56, 2.2, 0)],
  [3.05, ck(368, -14, 6.5, 52, 0.4, 0)],
  [M.yousee, ck(380, -40, 3.6, 50, -0.1, 0)],
  // under the board: follow the front assembly, then the full layout of the ten ducts from below
  [M.yousee + 0.5, ck(392, -62, 2.9, 50, -0.12, 0)],
  [M.ten + 0.25, ck(400, -84, 2.55, 52, -0.15, 0)],
  [M.electric + 0.3, ck(412, -80, 2.35, 52, -0.15, 0)],
  // "blast air downward": out to the side and down, the streaks running down to the water
  [M.blast + 0.25, ck(446, -14, 5.4, 50, -1.0, 0)],
];
const MATCH1 = M.lifting - 0.74; // water ring -> dust ring
const RING_VIEW = {az: 470, el: 16, dist: 4.4};
const riverCam = (t: number, st: FlightState): Lens => {
  const c = splineRec(t, HOOK);
  // after "blast" the camera follows the air down to the ring it makes on the water
  const down = sstep(M.blast + 0.25, MATCH1, t);
  if (down > 0) {
    const ring = v3(st.pos.x, 0, st.pos.z);
    const az = c.az + (RING_VIEW.az - c.az) * down;
    const el = c.el + (RING_VIEW.el - c.el) * down;
    const dist = c.dist + (RING_VIEW.dist - c.dist) * down;
    const tgt = a3(m3(a3(st.B.o, v3(0, c.ty, 0)), 1 - down), m3(ring, down));
    return lens(orbit(tgt, az, el, dist, 0, 50));
  }
  return lens(orbitBoard(st.B, c));
};

// ---------------------------------------------------------------- the practice field
const FieldFrame: React.FC<{id: string; t: number; st: FlightState & {rps: number}; L: Lens; leafT0?: number; tint?: number; airflow?: number; coach?: number}> = ({id, t, st, L, leafT0, tint = 0, airflow = 0.8, coach = 0}) => {
  const ground = v3(st.pos.x, 0, st.pos.z);
  return (
    <g>
      <FieldBack id={`${id}-fd`} L={L} t={t} tint={tint} wind={0.3 + st.thrust * 0.6 * Math.max(0, 1 - (st.alt - REST) / 3)} />
      <Downwash L={L} at={ground} alt={Math.max(0.3, st.alt)} thrust={st.thrust} t={t} ground="dust" />
      {leafT0 !== undefined && <Leaves L={L} t={t} t0={leafT0} at={v3(0, 0, 0)} />}
      <RiderShadow L={L} B={st.B} pose={st.pose} />
      <Airflow L={L} B={st.B} t={t} thrust={st.thrust * (st.alt > REST + 0.05 ? 1 : 0.5)} reach={1.2} alpha={airflow} />
      <Rider id={id} L={L} B={st.B} pose={st.pose} coach={coach} st={{phase: t * 3.7, rps: st.rps, thrust: st.thrust, tilt: {pitch: st.pitch, roll: st.roll}}} />
    </g>
  );
};

const liftSt = (t: number) => {
  const st = liftDemo(t, MATCH1);
  // slower, readable blades for the swoop to the fan (matched to the jet intake)
  return t > M.but - 0.5 ? {...st, rps: 14} : st;
};
const LIFTK: Key[] = [
  [MATCH1, ck(RING_VIEW.az, RING_VIEW.el, RING_VIEW.dist, 50, -REST, 0)],
  [MATCH1 + 0.5, ck(478, 10, 3.9, 50, 0.3, 0)],
  [M.lifting, ck(486, 4, 3.9, 50, 0.6, 0)],
  [M.lifting + 0.9, ck(505, 2, 4.4, 50, 0.95, 0)],
  [M.ground - 0.2, ck(565, 6, 4.6, 50, 0.9, 0)],
  [M.but - 0.42, ck(588, -10, 2.6, 50, 0.2, 0)],
];
/** the swoop under the board to the nose-heel duct, looking straight up at its fan */
const FAN_I = 8;
const FAN_D = 0.62;
const liftCam = (t: number, st: FlightState): Lens => {
  const c = splineRec(t, LIFTK);
  const k = sstep(M.but - 0.42, M.but, t);
  if (k <= 0) return lens(orbitBoard(st.B, c));
  const duct = ductWorld(st.B, FAN_I, BD.fanY);
  const a = orbitBoard(st.B, c);
  const b: Cam = {pos: a3(duct, v3(0, -FAN_D, -0.012)), tgt: duct, roll: 0, fov: 50};
  return lens({pos: a3(m3(a.pos, 1 - k), m3(b.pos, k)), tgt: a3(m3(a.tgt, 1 - k), m3(b.tgt, k)), roll: 0, fov: 50});
};

// ---------------------------------------------------------------- the workshop: the jet prototype test
const JET_B = (t: number) => {
  const vib = 0.006 * sstep(M.andCaught - 0.3, M.andCaught + 0.3, t) * (1 - sstep(M.fire + 0.6, M.fire + 1.2, t));
  return frameYPR(v3(noise1(t * 40, 1) * vib, 0.92 + noise1(t * 43, 2) * vib, noise1(t * 37, 3) * vib), 20, 0, 0);
};
const jetRun = (t: number) => sstep(M.jet - 0.2, M.jet + 0.35, t) * (1 - sstep(M.fire + 0.5, M.fire + 1.4, t));
const JETK: Key[] = [
  [M.but, ck(0, 70, 0.9, 50, 0.1, 0)],
  [M.but + 0.6, ck(15, 58, 1.8, 50, 0.0, 0)],
  [M.but + 1.1, ck(38, 38, 2.3, 50, 0.0, 0)],
  [M.jet, ck(58, 22, 2.25, 50, -0.05, 0)],
  [M.engines + 0.35, ck(72, 9, 2.6, 50, -0.25, 0)],
  [M.andCaught, ck(56, 16, 2.6, 50, -0.15, 0)],
  [M.fire, ck(40, 20, 2.3, 50, -0.05, 0)],
  [M.fireE + 0.3, ck(22, 32, 1.6, 50, 0.0, 0)],
  [M.so, ck(10, 40, 1.4, 50, 0.02, 0)],
];
// blade disc radius: the electric fan (0.108 m at 0.62 m) and the compressor face (0.064 m) fill the same screen circle
const JET_D = (0.064 * FAN_D) / 0.108;
const jetCam = (t: number): Lens => {
  const B = JET_B(t);
  const c = splineRec(t, JETK);
  const k = sstep(M.but, M.but + 0.9, t);
  const intake = jetIntake(B, 2);
  const a: Cam = {pos: a3(intake, v3(0, JET_D, 0.006)), tgt: intake, roll: 0, fov: 50};
  const b = orbitBoard(B, c);
  return lens({pos: a3(m3(a.pos, 1 - k), m3(b.pos, k)), tgt: a3(m3(a.tgt, 1 - k), m3(b.tgt, k)), roll: 0, fov: 50});
};
const JetFrame: React.FC<{id: string; t: number}> = ({id, t}) => {
  const L = jetCam(t);
  const B = JET_B(t);
  const run = jetRun(t);
  // the compressor turns as the fan did at the match (same screen sense and speed), then spins down after the fire
  const rps = 19 + 10 * run - 25 * sstep(M.fire + 0.4, M.so, t);
  const fireK = sstep(M.fire - 0.02, M.fire + 0.12, t) * (1 - 0.55 * sstep(M.fireE + 0.2, M.so + 0.5, t));
  const burn = sstep(M.fire + 0.1, M.fire + 1.0, t);
  const nozzles = [0, 1, 2, 3, 4].map((i) => jetNozzle(B, i));
  const intakes = [0, 1, 2, 3, 4].map((i) => jetIntake(B, i));
  const recirc = sstep(M.andCaught - 0.3, M.andCaught + 0.3, t) * (1 - sstep(M.fire + 0.2, M.fire + 0.8, t));
  const flash = Math.max(0, 1 - Math.abs(t - M.fire - 0.04) / 0.16);
  const flameAt = [a3(B.o, v3(0.08, 0.12, 0.25)), a3(B.o, v3(-0.15, 0.1, -0.1)), a3(B.o, v3(0.2, 0.05, -0.35)), ...nozzles.slice(0, 3).map((n) => a3(n, v3(0, 0.05, 0)))];
  const fc = L.p(flameAt[0]);
  return (
    <g>
      <WorkshopBack id={`${id}-ws`} L={L} t={t} glow={run * 0.6 + fireK} smoke={sstep(M.fire + 0.2, M.so, t) * 0.8} />
      <Exhaust id={`${id}-ex`} L={L} nozzles={nozzles} floorY={0} k={run} t={t} />
      <JetBoard id={`${id}-jb`} L={L} B={B} st={{phase: -t * 3.7, rps, burn}} />
      <Recirc L={L} from={nozzles.map((n) => v3(n.x, 0.05, n.z))} to={intakes} k={recirc} t={t} />
      <Smoke L={L} at={flameAt.slice(0, 3)} t={t} t0={M.fire + 0.15} k={0.9} />
      <Flames id={`${id}-fl`} L={L} at={flameAt} size={0.22} k={fireK} t={t} />
      <Flash id={`${id}-fs`} c={fc} k={flash} />
    </g>
  );
};

// ---------------------------------------------------------------- the workshop: the electric redesign on the bench
const BENCH_B = frameYPR(v3((BENCH.x0 + BENCH.x1) / 2 - 0.6, BENCH.y + BD.thick + 0.005, (BENCH.z0 + BENCH.z1) / 2 - 0.05), 90, 0, 0);
const BUILD0 = M.electric2 - 0.35, BUILD1 = M.except - 0.25;
const BENCHK: Key[] = [
  [M.so, ck(24, 40, 3.4, 52, 0.0, 0)],
  [M.electric2, ck(12, 48, 2.7, 50, 0.0, 0)],
  [M.except, ck(6, 42, 2.9, 50, 0.0, 0)],
];
const benchCam = (t: number): Lens => {
  const k = sstep(M.so - 0.05, M.electric2 - 0.1, t);
  const j = jetCam(M.so);
  const bv = orbitBoard(BENCH_B, splineRec(t, BENCHK));
  // an arc up and over (pull back from the damage, then down onto the bench), not a slide across the floor
  const arc = Math.sin(Math.PI * k);
  const pos = a3(a3(m3(j.pos, 1 - k), m3(bv.pos, k)), v3(0, 1.1 * arc, -0.8 * arc));
  const tgt = a3(a3(m3(j.cam.tgt, 1 - k), m3(bv.tgt, k)), v3(0, 0.35 * arc, 0));
  return lens({pos, tgt, roll: 0, fov: 50 + 6 * arc});
};
const BenchFrame: React.FC<{id: string; t: number}> = ({id, t}) => {
  const L = benchCam(t);
  const built = 10 * sstep(BUILD0, BUILD1, t);
  // the hero motor unit slides in along the bench before the installs begin
  const heroK = sstep(M.so + 0.15, M.so + 0.75, t) * (1 - sstep(BUILD0 - 0.1, BUILD0 + 0.05, t));
  const B = JET_B(M.so);
  return (
    <g>
      <WorkshopBack id={`${id}-ws`} L={L} t={t} smoke={0.8 * (1 - sstep(M.so, M.electric2, t))} />
      <JetBoard id={`${id}-jb`} L={L} B={B} st={{phase: 0, rps: 0, burn: 1}} />
      <Smoke L={L} at={[a3(B.o, v3(0.08, 0.12, 0.25))]} t={t} t0={M.fire + 0.15} k={0.6 * (1 - sstep(M.so, M.so + 1.2, t))} />
      <Rider id={`${id}-b`} L={L} B={BENCH_B} pose={liftSt(0).pose} noPilot st={{phase: 0, rps: 0, thrust: 0, built}} />
      {heroK > 0 && <DuctUnit L={L} B={BENCH_B} c={v3(BENCH.x1 - 0.35 - 0.0 * heroK, BENCH.y, BENCH.z0 + 0.25 + 0.3 * (1 - heroK))} phase={t * 1.4} />}
    </g>
  );
};

// ---------------------------------------------------------------- the field: the new board's first lift (the problem)
const TILT = {step: M.except + 0.1, lift: M.huge - 0.05, recover: M.itself};
const tiltSt = (t: number) => tiltProblem(t, TILT);
const TILTK: Key[] = [
  [M.except, ck(6, 42, 2.9, 50, -REST + 0.13, 0)],
  [M.except + 0.6, ck(-36, 18, 3.6, 50, 0.6, 0)],
  [M.huge, ck(-66, 8, 4.0, 50, 0.7, 0)],
  [M.huge + 0.75, ck(-44, 6, 3.4, 50, 0.65, 0)],
  [M.theBoard, ck(-60, 9, 3.6, 50, 0.7, 0)],
  [M.itself, ck(-74, 9, 4.0, 50, 0.75, 0)],
  [M.heHas, ck(-80, 8, 4.2, 50, 0.75, 0)],
];
const tiltCam = (t: number, st: FlightState) => lens(orbitBoard(st.B, splineRec(t, TILTK)));

// ---------------------------------------------------------------- the field: the body is the flight control
const CTRL = {start: M.heHas, back: M.body - 0.45, over: M.body + 0.15, thumb: M.while, wrist: M.voice - 0.05, coach: M.coach + 0.05, fix: M.learn, turn: M.balance2};
const ctrlSt = (t: number) => bodyControl(t, CTRL);
const CTRLK: [number, CKA][] = [
  [M.heHas, ca(250, 6, 1.5, 48, 0.25)],
  [M.body - 0.6, ca(232, 8, 1.8, 48, 0.35)],
  [M.body, ca(186, 9, 3.4, 50, 0.85)],
  [M.while - 0.05, ca(160, 10, 3.9, 50, 0.8)],
  [M.ai + 0.05, ca(200, 18, 0.95, 46, 0.6, 1, 0, 0)],
  [M.voice + 0.12, ca(255, 34, 0.75, 46, 0.6, 0, 1, 0)],
  [M.coach + 0.2, ca(232, 8, 0.75, 46, 0.6, 0, 0, 1)],
  [M.learn + 0.25, ca(214, 7, 3.2, 50, 0.8)],
  [M.balance2, ca(250, 6, 4.4, 50, 0.8)],
  [M.andAfter, ca(268, 6, 5.0, 50, 0.8)],
];
const ctrlCam = (t: number, st: FlightState) => {
  const j = pilotJoints(st.B, st.pose);
  return lens(orbitAnch(st.B, splineRec(t, CTRLK) as CKA, [j.wriR, a3(j.wriF, v3(0, 0.02, 0)), a3(j.Hc, m3(j.hL, 0.11))]));
};

// ---------------------------------------------------------------- the field: ten days of practice
const trainSt = (t: number): FlightState & {rps: number} => {
  const s = t - M.andAfter;
  const conf = sstep(M.tenDays - 0.15, M.tenDays + 0.35, t);
  const ang = s * 0.55 * conf + 0.3;
  const R = 4.5 * conf;
  const px = Math.sin(ang) * R, pz = -Math.cos(ang) * R + R;
  const wob = (u: number) => (1 - sstep(M.tenDays - 0.15, M.tenDays + 0.35, u)) * 0.06 * noise1(u * 2.4, 61);
  const alt = 0.42 + 1.2 * conf + 0.05 * Math.sin(t * 2);
  const roll = wob(t - 0.15) * 160 + 8 * conf;
  const pitch = (1 - conf) * 4 * noise1(t * 2, 62) - 6 * conf;
  const yaw = ((ang * 180) / Math.PI) * conf;
  const B = frameYPR(v3(px, alt, pz), yaw, pitch, roll);
  const pose = {
    ...liftSt(0).pose,
    side: wob(t) + 0.04 * conf, lean: 0.06 * conf,
    crouch: 0.6 - 0.25 * conf, bend: 16 - 6 * conf, armF: 0.8 - 0.35 * conf, armFs: 1.0 - 0.4 * conf, armR: 0.5 - 0.2 * conf, look: 50 + 15 * conf, nod: 22 - 12 * conf,
  };
  return {B, pose, alt, speed: 0, pitch, roll, yaw, thrust: 0.8, pos: B.o, rps: 30};
};
const TRAINK: Key[] = [
  [M.andAfter, ck(200, 6, 4.4, 50, 0.6, 0)],
  [M.tenDays, ck(222, 8, 5.4, 52, 0.7, 0)],
  [M.practice + 0.2, ck(250, 10, 6.6, 54, 0.8, 0)],
];
const trainCam = (t: number, st: FlightState) => lens(orbitBoard(st.B, splineRec(t, TRAINK)));
/** the days pass: a dusk and a dawn sweep over the sky while the flying gets cleaner */
const dayTint = (t: number) => Math.max(0, Math.sin(sstep(M.tenDays - 0.2, M.practice + 0.15, t) * Math.PI * 2)) * 0.75;

// ---------------------------------------------------------------- the river payoff (a separate flight, high over the Yangtze)
const payoff = (t: number): FlightState => {
  const s = t - M.practice;
  const z = -14 + 5 * s + 4.5 * s * sstep(0.3, 1.4, s);
  const x = -220 + 1.5 * Math.sin(s * 0.6);
  const alt = 14 + 2.5 * sstep(0.5, 2.0, s);
  const lean = (u: number) => 0.06 + 0.06 * sstep(M.practice + 0.1, M.practice + 0.6, u) + 0.02 * noise1(u * 0.9, 71);
  const side = (u: number) => 0.025 * noise1(u * 1.1, 72);
  const pitch = -((lean(t - 0.2) + lean(t - 0.1)) / 2) * 75;
  const roll = ((side(t - 0.2) + side(t - 0.1)) / 2) * 95;
  const B = frameYPR(v3(x, alt, z), 0, pitch, roll);
  const pose = {...riverFlight(0).pose, lean: lean(t), side: side(t), crouch: 0.42, armF: 0.5, armFs: 0.85, bend: 12, look: 68};
  return {B, pose, alt, speed: 8, pitch, roll, yaw: 0, thrust: 0.85, pos: B.o};
};
const PAYK: Key[] = [
  [M.practice, ck(262, 6, 9.5, 54, 0.4, 0)],
  [M.heActually + 0.3, ck(272, 4, 11, 54, 0.6, 0)],
  [M.flew, ck(280, 6, 20, 56, 2.0, 0)],
  [M.river2, ck(262, 7, 24, 56, 2.5, 0)],
  [M.river2E + 0.1, ck(345, 16, 7.0, 54, 0.9, 0)],
  [M.andThrough, ck(358, 18, 6.0, 54, 0.8, 0)],
];
const payCam = (t: number, st: FlightState) => lens(orbitBoard(st.B, splineRec(t, PAYK)));

// ---------------------------------------------------------------- the canyon (a separate demonstration)
const canyonSt = (t: number): FlightState => {
  const s = t - M.andThrough;
  const z = 40 + 9 * s;
  const x = cx(z);
  const dx = (cx(z + 1) - cx(z - 1)) / 2;
  const yaw = (Math.atan2(dx, 1) * 180) / Math.PI;
  const dd = (cx(z + 9) - 2 * cx(z) + cx(z - 9)) / 81;
  const roll = Math.max(-14, Math.min(14, -dd * 81 * 60 + 2 * noise1(t, 81)));
  const alt = 26 + 2 * Math.sin(s * 0.8);
  const B = frameYPR(v3(x, alt, z), yaw, -5, roll);
  const pose = {...riverFlight(0).pose, crouch: 0.48, side: -roll / 400, lean: 0.07, armF: 0.55, armFs: 0.9, bend: 13, look: 72};
  return {B, pose, alt, speed: 9, pitch: -5, roll, yaw, thrust: 0.8, pos: B.o};
};
const CANK: Key[] = [
  [M.andThrough, ck(366, 12, 6.5, 56, 0.8, 0)],
  [M.through, ck(356, 4, 9.0, 60, 1.6, 0)],
  [M.canyon, ck(338, 2, 8.5, 60, 1.4, 0)],
  [M.canyonE + 0.2, ck(346, 20, 26, 62, 5.0, 0)],
  [M.howMuch + 0.1, ck(354, 34, 52, 62, 12.0, 0)],
];
const canCam = (t: number, st: FlightState) => lens(orbitBoard(st.B, splineRec(t, CANK)));
const CanyonFrame: React.FC<{id: string; t: number}> = ({id, t}) => {
  const st = canyonSt(t);
  const L = canCam(t, st);
  return (
    <g>
      <CanyonBack id={`${id}-cy`} L={L} t={t} />
      <Rider id={id} L={L} B={st.B} pose={st.pose} st={{phase: t * 3.7, rps: 30, thrust: st.thrust, tilt: {pitch: st.pitch, roll: st.roll}}} />
    </g>
  );
};

// ---------------------------------------------------------------- the ending: back on the hook's trajectory (tau = t - DUR)
const ENDK: Key[] = [
  [M.howMuch - 0.1, ck(140, 12, 7.5, 52, 0.9, 0)],
  [M.howMuch + 0.6, ck(160, 8, 3.2, 50, 1.2, 0)],
  [M.pay - 0.1, ck(176, 24, 2.2, 52, 1.4, 0)],
  [M.pay + 0.45, ck(184, 20, 2.6, 52, 1.2, 0)],
  [M.thing - 0.25, ck(196, -2, 5.2, 50, 0.8, -3)],
  [M.thingE + 0.45, ck(190, -8, 6.0, 50, 0.75, -2)],
  [DUR - 0.35, ck(198, -11.5, 5.8, 50, 0.6, -2)],
  [DUR, ck(200, -12, 5.8, 50, 0.6, -2)],
];
const povK = (t: number) => sstep(M.pay - 0.35, M.pay - 0.05, t) * (1 - sstep(M.thing - 0.55, M.thing - 0.15, t));
const endCam = (t: number, st: FlightState) => {
  const o = orbitBoard(st.B, splineRec(t, ENDK));
  // "PAY YOU": into the rider's own view, looking down past his feet at the water far below, and back out
  const k = sstep(M.pay - 0.35, M.pay - 0.05, t) * (1 - sstep(M.thing - 0.55, M.thing - 0.15, t));
  if (k <= 0) return lens(o);
  const j = pilotJoints(st.B, st.pose);
  const eye = a3(a3(j.Hc, m3(j.hF, 0.16)), v3(0, 0.06, 0));
  const look = a3(a3(st.B.o, m3(st.B.z, 0.55)), v3(0, -0.9, 0));
  const e = k * k * (3 - 2 * k);
  return lens({pos: a3(m3(o.pos, 1 - e), m3(eye, e)), tgt: a3(m3(o.tgt, 1 - e), m3(look, e)), roll: 0, fov: 50 + 22 * e});
};

// ---------------------------------------------------------------- the shot list
const WIPE1 = M.andThrough; // the rock spur covers the frame: river payoff -> canyon
const WIPE2 = M.howMuch + 0.05; // the mist covers the frame: canyon -> river
const rockP = (t: number) => (t - WIPE1 + 0.17) / 0.34;
const mistP = (t: number) => (t - WIPE2 + 0.3) / 0.6;

export const SHOTS: Shot[] = [
  {
    name: 'hook + mechanism (river)', from: 0, to: MATCH1,
    draw: (t, pre) => {
      const spinUp = sstep(M.electric, M.electric + 0.8, t);
      const st = riverFlight(t);
      return (
        <RiverFrame id={`${pre}rv`} t={t} tau={t} L={riverCam(t, st)}
          o={{count: t > M.ten - 0.05 && t < M.electric + 0.25 ? sstep(M.ten, M.powerfulE, t) : 0, spin: 3.7 + 5 * spinUp, thrust: st.thrust + 0.3 * spinUp, airflow: sstep(M.electric + 0.2, M.blast, t)}} />
      );
    },
    focus: (t) => {
      const st = riverFlight(t);
      return t > M.blast + 0.3 ? {x0: 200, y0: 500, x1: 880, y1: 1400} : riderBox(riverCam(t, st), st.B, st.pose);
    },
  },
  {
    name: 'ground lift (field)', from: MATCH1, to: M.but,
    draw: (t, pre) => {
      const st = liftSt(t);
      return <FieldFrame id={`${pre}lf`} t={t} st={st} L={liftCam(t, st)} leafT0={st.leafT0} />;
    },
    focus: (t) => {
      const st = liftSt(t);
      return t > M.but - 0.45 ? {x0: 200, y0: 500, x1: 880, y1: 1400} : riderBox(liftCam(t, st), st.B, st.pose);
    },
  },
  {name: 'jet prototype (workshop)', from: M.but, to: M.so, draw: (t, pre) => <JetFrame id={`${pre}jt`} t={t} />, focus: () => ({x0: 140, y0: 520, x1: 940, y1: 1340})},
  {name: 'redesign (bench)', from: M.so, to: M.except, draw: (t, pre) => <BenchFrame id={`${pre}bn`} t={t} />, focus: () => ({x0: 100, y0: 560, x1: 980, y1: 1300})},
  {
    name: 'the problem (field)', from: M.except, to: M.heHas,
    draw: (t, pre) => {
      const st = tiltSt(t);
      return <FieldFrame id={`${pre}tp`} t={t} st={st} L={tiltCam(t, st)} />;
    },
    focus: (t) => {
      const st = tiltSt(t);
      return riderBox(tiltCam(t, st), st.B, st.pose);
    },
  },
  {
    name: 'body control (field)', from: M.heHas, to: M.andAfter,
    draw: (t, pre) => {
      const st = ctrlSt(t);
      return <FieldFrame id={`${pre}bc`} t={t} st={st} L={ctrlCam(t, st)} coach={st.coachPulse} />;
    },
    focus: (t) => {
      const st = ctrlSt(t);
      return riderBox(ctrlCam(t, st), st.B, st.pose);
    },
  },
  {
    name: 'ten days of practice (field)', from: M.andAfter, to: M.practice,
    draw: (t, pre) => {
      const st = trainSt(t);
      return <FieldFrame id={`${pre}tr`} t={t} st={st} L={trainCam(t, st)} tint={dayTint(t)} />;
    },
    focus: (t) => {
      const st = trainSt(t);
      return riderBox(trainCam(t, st), st.B, st.pose);
    },
  },
  {
    name: 'across the Yangtze (river payoff)', from: M.practice, to: WIPE1,
    draw: (t, pre) => {
      const st = payoff(t);
      const L = payCam(t, st);
      return (
        <g>
          <RiverBack id={`${pre}py-rv`} L={L} t={t} />
          <Downwash L={L} at={st.pos} alt={st.alt} thrust={st.thrust} t={t} />
          <Rider id={`${pre}py`} L={L} B={st.B} pose={st.pose} st={{phase: t * 3.7, rps: 30, thrust: st.thrust, tilt: {pitch: st.pitch, roll: st.roll}}} />
          <RockWipe p={rockP(t)} />
        </g>
      );
    },
    focus: (t) => {
      const st = payoff(t);
      return riderBox(payCam(t, st), st.B, st.pose);
    },
  },
  {
    name: 'through the canyon', from: WIPE1, to: WIPE2,
    draw: (t, pre) => (
      <g>
        <CanyonFrame id={`${pre}cy`} t={t} />
        <RockWipe p={rockP(t)} />
        <MistWipe p={mistP(t)} />
      </g>
    ),
    focus: (t) => {
      const st = canyonSt(t);
      return riderBox(canCam(t, st), st.B, st.pose);
    },
  },
  {
    name: 'ending (river, flows into frame 0)', from: WIPE2, to: DUR + 1,
    draw: (t, pre) => {
      const tau = t - DUR;
      const st = riverFlight(tau);
      return (
        <g>
          <RiverFrame id={`${pre}en`} t={tau} tau={tau} L={endCam(t, st)} pov={povK(t) > 0.5} />
          <MistWipe p={mistP(t)} />
        </g>
      );
    },
    focus: (t) => {
      const st = riverFlight(t - DUR);
      return riderBox(endCam(t, st), st.B, st.pose);
    },
  },
];
export const shotAt = (t: number) => SHOTS.find((s) => t >= s.from && t < s.to) ?? SHOTS[SHOTS.length - 1];
export {DUR};
