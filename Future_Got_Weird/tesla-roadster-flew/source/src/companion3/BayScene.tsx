// One connected illustrated space (side view) for the first mechanism and the start of the second:
//   opening   the real hang matches into the drawn car; its panels open on two systems; one holds it to the track,
//             the other throws it off: it drives off the end, rolls on its jets and lands; an air-supply dial
//   grip      the car rolls up to the ramp, the sill opens on the fans, the edges seal, the gap air thins (never to
//             nothing), outside air pushes harder than the gap air, the difference presses it on; it climbs to the
//             ceiling with that push always into the surface while gravity stays straight down; Tesla's 2 g
//   leaving   it drives to the end of the overhang, the surface runs out, air floods back into the gap, the push
//             fades to nothing and the car separates; time slows and the hall opens onto the test area
//   thrust    in the slowed fall the upper panel opens on a tank, a valve and a nozzle; gas out one way, the car
//             pushed the other way
//   ending    the opening shot again, with one cue per system, a full landing and the Crew's last beat
// Colours: blue = air and gas, saffron = forces on the car, ink-grey = weight. Hardware positions are conceptual.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {Character, IDLE, Pose, mixPose} from '../components/Character';
import {CAST} from '../components/cast';
import {RampDrawing, rampAt, S_END, S_HANG} from '../companion2/Ramp';
import {AirGauge, BayBack} from './Bay';
import {Car3, CAR3, CarState, floorAt, OUTLINE_D as CAR_OUTLINE, roofAt3} from './Car3';
import {Arrow, Cam, camTrack, cue, E, FLOW, FLOW_LIGHT, FORCE, lerp, ramp, rnd, settle, toScreen, track, WEIGHT, World, WSvg} from './kit3';

// ---------------------------------------------------------------- geometry helpers
const rad = (d: number) => (d * Math.PI) / 180;
const rotv = (x: number, y: number, deg: number) => ({x: x * Math.cos(rad(deg)) - y * Math.sin(rad(deg)), y: x * Math.sin(rad(deg)) + y * Math.cos(rad(deg))});
/** Axis centre (roll axis, car-local (0, cy)) from the contact anchor, and back. */
const axisOf = (ax: number, ay: number, heading: number) => { const v = rotv(0, CAR3.cy, heading); return {x: ax + v.x, y: ay + v.y}; };
const anchorOf = (cx: number, cy: number, heading: number) => { const v = rotv(0, CAR3.cy, heading); return {x: cx - v.x, y: cy - v.y}; };
const onRamp = (s: number) => { const p = rampAt(s); return {x: p.x, y: p.y, heading: p.heading}; };

// ---------------------------------------------------------------- the stunt (opening and ending)
const S_LIP = S_END - 60;
const G = 981; // world units per s² (100 units = 1 m)
const FALL_T = 2.0, V_END = 110;
const lipPose = onRamp(S_LIP);
const C_LIP = axisOf(lipPose.x, lipPose.y, lipPose.heading);
const C_LAND_Y = CAR3.cy; // upright on the floor: axis 76 above it
const DROP = C_LAND_Y - C_LIP.y;
const TAU1 = (() => { // free fall, then the jets brake the descent to V_END at touchdown
  let lo = 0, hi = FALL_T;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; const d = 0.5 * G * m * m + (FALL_T - m) * (G * m + V_END) / 2; if (d > DROP) hi = m; else lo = m; }
  return (lo + hi) / 2;
})();
const dropAt = (tau: number) => {
  if (tau <= TAU1) return 0.5 * G * tau * tau;
  const v1 = G * TAU1, a = (v1 - V_END) / (FALL_T - TAU1), u = Math.min(tau, FALL_T) - TAU1;
  return 0.5 * G * TAU1 * TAU1 + v1 * u - 0.5 * a * u * u;
};
const VX0 = -700, AX = 137.5;
const xAt = (tau: number) => {
  const u = Math.min(tau, FALL_T);
  let x = C_LIP.x + VX0 * u + 0.5 * AX * u * u;
  if (tau > FALL_T) { const v = VX0 + AX * FALL_T, r = Math.min(tau - FALL_T, 0.6); x += v * r - (v / 1.2) * r * r; }
  return x;
};
export const C_LAND = {x: xAt(5), y: C_LAND_Y};
export type Jet = {x: number; y: number; dx: number; dy: number; o: number; t0: number; len?: number};
/** Car pose during the stunt: hang, drive to the lip, fly (roll on a couple, brake on downward jets), land. */
const stunt = (t: number, tDrive: number, tLip: number) => {
  if (t <= tDrive) {
    const p = onRamp(S_HANG);
    return {anchor: {x: p.x, y: p.y}, heading: p.heading, roll: 0, s: S_HANG, tau: -1, attached: 1, jets: [] as Jet[], landed: 0};
  }
  if (t <= tLip) {
    const u = (t - tDrive) / (tLip - tDrive);
    const s = S_HANG + (S_LIP - S_HANG) * u * u;
    const p = onRamp(s);
    return {anchor: {x: p.x, y: p.y}, heading: p.heading, roll: 0, s, tau: -1, attached: 1, jets: [] as Jet[], landed: 0};
  }
  const tau = t - tLip;
  const heading = lerp(lipPose.heading, -180, ramp(tau, 0, 1.2, E.inOut));
  const roll = 180 * ramp(tau, 0.25, 1.05, E.inOut);
  const c = {x: xAt(tau), y: C_LIP.y + dropAt(tau)};
  const a = anchorOf(c.x, c.y, heading);
  const jets: Jet[] = [];
  const win = (a0: number, a1: number) => ramp(tau, a0, a0 + 0.06) * (1 - ramp(tau, a1 - 0.06, a1));
  // roll couple, then the opposite pair (side jets: one plume up, one down), then both pairs down to brake
  if (tau > 0.18 && tau < 0.66) { const o = win(0.2, 0.64); jets.push({x: c.x + 30, y: c.y - 40, dx: 0, dy: -1, o, t0: tLip + 0.2}, {x: c.x - 30, y: c.y + 40, dx: 0, dy: 1, o, t0: tLip + 0.2}); }
  if (tau > 0.72 && tau < 1.12) { const o = win(0.74, 1.1); jets.push({x: c.x + 30, y: c.y + 40, dx: 0, dy: 1, o, t0: tLip + 0.74}, {x: c.x - 30, y: c.y - 40, dx: 0, dy: -1, o, t0: tLip + 0.74}); }
  if (tau > 1.2 && tau < FALL_T + 0.15) { const o = win(1.22, FALL_T + 0.12); jets.push({x: c.x + 140, y: c.y + 52, dx: 0, dy: 1, o, t0: tLip + 1.22}, {x: c.x - 140, y: c.y + 52, dx: 0, dy: 1, o, t0: tLip + 1.22}); }
  return {anchor: a, heading, roll, s: S_END, tau, attached: 0, jets, landed: tau >= FALL_T ? 1 : 0};
};

// ---------------------------------------------------------------- cues
const O = {
  open: cue('is', 'P3') - 0.04, sys1: cue('two', 'P3'), sys2: cue('different', 'P3'),
  stick: cue('sticks', 'P4'), track: cue('track', 'P4'), close: cue('track', 'P4', 0, true) + 0.05,
  drive: cue('The', 'P5') + 0.05, lip: cue('throws', 'P5') + 0.08, gauge: cue('So', 'P6'), prove: cue('prove?', 'P6'),
};
export const O_TIMES = O;
const Gr = {
  start: 15.4, stop: 16.55, open: cue('Tesla', 'G2') - 0.35, fans: cue('fans', 'G2'), pull: cue('pull', 'G2'),
  seal: cue('Seal', 'G3'), thins: cue('thins', 'G3'), vacuum: cue('vacuum', 'G4'), lower: cue('lower', 'G4'),
  outside: cue('outside', 'G5'), harder: cue('harder', 'G5'), under: cue('underneath', 'G5'), diff: cue('difference', 'G5'),
  presses: cue('presses', 'G5'), against: cue('against', 'G5'), track: cue('track', 'G5', 0, true),
  climb0: cue('track', 'G5', 0, true) + 0.08, climb1: cue('down', 'G6', 0), gravity: cue('gravity', 'G6'), away: cue('away', 'G6'),
  twoG: cue('two', 'G7'), twice: cue('twice', 'G7'), weight: cue('weight', 'G7'),
};
export const G_TIMES = Gr;
const Lv = {
  seal: cue('seal', 'L1'), drive: cue('At', 'L2') + 0.05, surface: cue('surface', 'L2'), out: cue('out', 'L2'),
  air: cue('Air', 'L3'), gap: cue('gap', 'L3'), grip: cue('grip', 'L3'), gone: cue('gone', 'L3'),
};
export const L_TIMES = Lv;
const Th = {
  wheels: cue('wheels', 'T1'), fans: cue('fans', 'T1'), second: cue('second', 'T2'), thrusters: cue('thrusters', 'T3'),
  compressed: cue('compressed', 'T3'), valve: cue('valve', 'T4'), blasts: cue('blasts', 'T4'), nozzle: cue('nozzle', 'T4'),
  out: cue('out', 'T5'), pushed: cue('pushed', 'T5'), fuel: cue('fuel', 'T6'), cold: cue('cold', 'T6'), end: 71.6,
};
export const T_TIMES = Th;
const En = {
  start: 143.7, systems: cue('systems,', 'E1'), jobs: cue('jobs.', 'E1'), fans: cue('fans', 'E2'), hold: cue('hold', 'E2'), jets: cue('jets', 'E3'), drive: cue('jets', 'E3') + 0.05,
  howLong: cue('How', 'E5'), questions: cue('questions.', 'E5'),
  lip: cue('motion', 'E3') - 0.05, clever: cue('Clever', 'E6'), abs: cue('Absolutely', 'E6'), commute: cue('commute', 'E7'), leap: cue('leap', 'E7'),
  end: 166.5,
};
export const E_TIMES = En;
export const STUNT_O = {drive: O.drive, lip: O.lip, land: O.lip + FALL_T};
export const STUNT_E = {drive: En.drive, lip: En.lip, land: En.lip + FALL_T};

// ---------------------------------------------------------------- the grip run (floor -> ceiling) and the leaving
const X_STOP = -250;
const sGrip = (t: number) => {
  if (t < Gr.stop) { const u = ramp(t, Gr.start - 0.1, Gr.stop, (x) => 1 - (1 - x) * (1 - x)); return X_STOP - 600 * (1 - u); }
  if (t < Gr.climb0) return X_STOP;
  if (t < Gr.climb1) { const u = ramp(t, Gr.climb0, Gr.climb1, E.inOut); return lerp(X_STOP, S_HANG, u); }
  if (t < Lv.drive) return S_HANG;
  // to the end: the front reaches the lip as "surface" is said, then slow motion
  const s1 = S_END - 110; // the nose past the end, the front seal just short of it
  if (t < Lv.surface + 0.2) return lerp(S_HANG, s1, ramp(t, Lv.drive, Lv.surface + 0.2, E.in));
  return s1 + 60 * ramp(t, Lv.surface + 0.2, Lv.gone + 0.4, (x) => 1 - (1 - x) * (1 - x));
};
const SEP = cue('grip', 'L3') - 0.05;
/** Car pose for the grip/leave/thrust phases (anchor, heading), plus separation drift after the grip is gone. */
const gripPose = (t: number) => {
  const s = sGrip(t);
  const p = onRamp(s);
  if (t < SEP) return {anchor: {x: p.x, y: p.y}, heading: p.heading, s, sep: 0};
  const u = t - SEP;
  const drop = 70 * (1 - Math.exp(-u / 1.2)) + 4.2 * u;
  const fwd = -34 * (1 - Math.exp(-u / 1.2)) - 3 * u - 95 * ramp(t, Th.pushed - 0.15, Th.cold + 0.6, E.inOut);
  const heading = p.heading - 4 * ramp(t, SEP, SEP + 6, E.inOut);
  const c0 = axisOf(p.x, p.y, p.heading);
  const c = {x: c0.x + fwd, y: c0.y + drop};
  return {anchor: anchorOf(c.x, c.y, heading), heading, s, sep: Math.min(1, u / 0.6)};
};

// ---------------------------------------------------------------- particles (car-local)
type Pt = {x: number; y: number; o: number; r?: number};
const N_GAP = 26;
const GAP_P = Array.from({length: N_GAP}, (_, i) => ({u: (i + 0.5 + (rnd(i + 3) - 0.5) * 0.7) / N_GAP, v: 0.2 + rnd(i + 31) * 0.6, ph: rnd(i + 9) * 6.28, keep: rnd(i + 77)}));
/** Gap air: density 0..1 keeps a stable subset; jiggle shows it is gas, not a solid. */
const gapAir = (t: number, density: number, jig = 1): Pt[] => GAP_P.map((p) => {
  const x = lerp(CAR3.gapRear + 6, CAR3.gapFront - 6, p.u) + Math.sin(t * 2.3 + p.ph) * 4 * jig;
  const fl = floorAt(x);
  const y = lerp(fl + 3.5, -3.5, p.v) + Math.cos(t * 2.9 + p.ph * 1.7) * 1.6 * jig;
  const o = density >= 1 ? 1 : Math.max(0, Math.min(1, (density - p.keep) * 8 + 0.5));
  return {x, y, o};
});
/** Air drawn out by the fans: gap -> inlet -> fan -> duct -> vent -> out (u = 0..1 along the path). */
const fanPath = (u: number, start: number, fanX: number) => {
  const fl = floorAt(start);
  const pts: [number, number, number][] = [[0, start, fl * 0.5], [0.3, fanX, fl - 1], [0.42, fanX, CAR3.fanY], [0.55, fanX - 10, CAR3.fanY - 6], [0.85, CAR3.vent.x, CAR3.fanY - 6], [1, CAR3.vent.x - 60, CAR3.fanY - 30]];
  for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) { const [u0, x0, y0] = pts[i - 1], [u1, x1, y1] = pts[i]; const k = (u - u0) / (u1 - u0); return {x: lerp(x0, x1, k), y: lerp(y0, y1, k), seg: i}; }
  return {x: pts[5][1], y: pts[5][2], seg: 5};
};
const N_STREAM = 16;
const stream = (t: number, rate: number, t0: number) => {
  const out: (Pt & {seg: number})[] = [];
  if (rate <= 0) return out;
  for (let i = 0; i < N_STREAM; i++) {
    const per = 1.5;
    const ph = i / N_STREAM;
    const u = ((t - t0) / per + ph) % 1;
    if (t - t0 < (1 - ph) * per * 0 && false) continue;
    const start = lerp(CAR3.gapRear + 10, CAR3.gapFront - 10, rnd(i * 7 + Math.floor((t - t0) / per + ph) * 13));
    const fanX = CAR3.fans[i % 2];
    const p = fanPath(u, start, fanX);
    const o = rate * (p.seg === 5 ? 1 - (u - 0.85) / 0.15 : 1) * Math.min(1, (t - t0) * 2);
    out.push({x: p.x, y: p.y, o, seg: p.seg});
  }
  return out;
};
/** Outside air leaking in at the unsealed edges (or rushing in at the open front). */
const leak = (t: number, rate: number, side: 'front' | 'rear', n = 6, spread = 1): Pt[] => {
  if (rate <= 0) return [];
  return Array.from({length: n}, (_, i) => {
    const u = ((t * 1.1 + i / n) % 1);
    const sgn = side === 'front' ? 1 : -1;
    const edge = side === 'front' ? CAR3.gapFront : CAR3.gapRear;
    const x = edge + sgn * (50 * spread) * (1 - u) - sgn * 40 * u;
    const y = lerp(-26 - 30 * rnd(i + 5) * spread, floorAt(edge) * 0.45, Math.min(1, u * 1.6));
    return {x, y, o: rate * Math.min(1, u * 4) * (1 - ramp(u, 0.75, 1))};
  });
};

// ---------------------------------------------------------------- plumes (world)
export const Plume: React.FC<{j: Jet; t: number; scale?: number}> = ({j, t, scale = 1}) => {
  if (j.o <= 0) return null;
  const parts: React.ReactNode[] = [];
  const life = 0.42, step = 0.03;
  const len = (j.len ?? 260) * scale;
  for (let k = 0; k < life / step; k++) {
    const born = Math.floor((t - j.t0) / step) * step + j.t0 - k * step;
    const age = t - born;
    if (age < 0 || age > life || born < j.t0) continue;
    const u = age / life;
    const jitter = (rnd(Math.round(born * 1000)) - 0.5) * 16 * u * scale;
    const px = j.x + j.dx * len * u + (j.dy !== 0 ? jitter : 0);
    const py = j.y + j.dy * len * u + (j.dx !== 0 ? jitter : 0);
    parts.push(<circle key={k} cx={px} cy={py} r={(6 + 26 * u) * scale} fill={k % 3 === 0 ? '#FFFFFF' : FLOW_LIGHT} opacity={(1 - u) * 0.85 * j.o} />);
  }
  return <g>{parts}</g>;
};

const fanAngle = (t: number, onAt: number, offAt: number, rpm = 1300) => {
  // integral of a fan speed that eases in over 0.6 s after onAt and out over 1 s after offAt
  let a = 0;
  const dt = 1 / 30;
  for (let s = onAt; s < t; s += dt) a += rpm * dt * ramp(s, onAt, onAt + 0.6) * (1 - ramp(s, offAt, offAt + 1));
  return a;
};
const WHEEL_R = 33;
const spinFor = (dist: number) => (dist / WHEEL_R) * (180 / Math.PI);

// ---------------------------------------------------------------- camera
const HANG = onRamp(S_HANG);
const C_HANG = axisOf(HANG.x, HANG.y, HANG.heading);
/** Framing that matches the hang close-up (c3_hang.mp4 at the Opening's crop): car centre at (980, 620), 1300 px long. */
export const MATCH_CAM: Cam = {x: C_HANG.x - 6.5, y: C_HANG.y - 26, z: 3.1};

export type BayFrame = {cam: Cam; car: CarState; t: number};
const W_LEN = 120; // weight arrow (world units)

export const BayScene: React.FC<{t: number}> = ({t}) => {
  const frame = Math.round(t * 30);
  const phase = t < 15.4 ? 'O' : t < Th.end ? 'G' : 'E';
  // ---------------- pose
  let anchor = {x: 0, y: 0}, heading = 0, roll = 0, attached = 1, jets: Jet[] = [], landedAt = -1, sGr = 0, sep = 0, tau = -1;
  if (phase === 'O' || phase === 'E') {
    const st = phase === 'O' ? STUNT_O : STUNT_E;
    const p = stunt(t, st.drive, st.lip);
    anchor = p.anchor; heading = p.heading; roll = p.roll; attached = p.attached; jets = p.jets; tau = p.tau;
    if (p.landed) landedAt = st.land;
  } else {
    const p = gripPose(t);
    anchor = p.anchor; heading = p.heading; sGr = p.s; sep = p.sep;
  }
  const axis = axisOf(anchor.x, anchor.y, heading);

  // ---------------- state per phase
  let lights = 1, door = 0, openLo = 0, openUp = 0, glowFans = 0, glowTank = 0, squash = 0, compress = 0, spin = 0, valve = 0;
  let density = 1, flowRate = 0, flowT0 = 0, leakRate = 0, sealDown = 0, sealGlow = 0, frontOpen = 0, fanA = 0;
  let netLen = 0, netO = 0, outsideO = 0, outsideL = 46, gapArrO = 0, weightO = 0, ticksO = 0, gauge = 0, gaugeLevel = 0.8, gaugeQ = 0;
  let tankAir = 0, pipeFlow = 0, nozzleJet = 0, gasArrow = 0, pushArrow = 0;
  const parts = {fans: true, tank: true, nozzle: true};
  let checkerO = 0;
  if (phase === 'O') {
    lights = 0.55 * ramp(t, 5.22, 5.34, E.out) + 0.45 * ramp(t, 5.44, 5.58, E.out); // two banks switch on
    const op = ramp(t, O.open, O.open + 0.7, E.out) * (1 - ramp(t, O.close, O.close + 0.35, E.inOut));
    openLo = op; openUp = op;
    glowFans = ramp(t, O.sys1 - 0.1, O.sys1 + 0.2) * (1 - ramp(t, O.sys2 - 0.1, O.sys2 + 0.3));
    glowTank = ramp(t, O.sys2 - 0.1, O.sys2 + 0.2) * (1 - ramp(t, O.stick - 0.4, O.stick));
    fanA = fanAngle(t, O.stick - 0.25, O.drive + 0.3, 1500);
    flowRate = ramp(t, O.stick - 0.1, O.stick + 0.3) * (1 - ramp(t, O.lip - 0.15, O.lip + 0.05)); flowT0 = O.stick - 0.1;
    density = lerp(1, 0.45, ramp(t, O.stick, O.track + 0.2)); density = lerp(density, 1, ramp(t, O.lip - 0.1, O.lip + 0.3));
    sealDown = 1;
    squash = 3.5 * ramp(t, O.stick, O.stick + 0.3, E.out) * (1 - ramp(t, O.lip - 0.1, O.lip));
    compress = squash / 3.5 * 0.7;
    netLen = 110; netO = ramp(t, O.track - 0.15, O.track + 0.15) * (1 - ramp(t, O.lip - 0.2, O.lip + 0.02));
    // wheels: driving to the lip, spinning on in the air, rolling out after touchdown
    const st = stunt(t, O.drive, O.lip);
    spin = spinFor(Math.max(0, st.s - S_HANG)) + (t > O.lip ? 900 * (t - O.lip) * Math.exp(-(t - O.lip) * 0.6) : 0);
    if (landedAt > 0) { const u = t - landedAt; squash = settle(t, landedAt, 7, 0.6) + 1.5 * ramp(u, 0, 0.2); compress = Math.min(1, Math.max(0, squash / 6)); }
    gauge = ramp(t, O.gauge - 0.1, O.gauge + 0.35, E.back);
    gaugeLevel = lerp(0.82, 0.38, ramp(t, O.gauge + 0.1, O.prove + 0.3, E.inOut)) + 0.012 * Math.sin(t * 7);
    gaugeQ = ramp(t, O.prove - 0.1, O.prove + 0.3);
  } else if (phase === 'G') {
    lights = 1;
    door = ramp(t, Lv.grip - 0.3, Th.wheels + 0.3, E.inOut);
    openLo = ramp(t, Gr.open, Gr.open + 0.6, E.out) * (1 - ramp(t, Th.fans + 0.2, Th.fans + 0.8, E.inOut));
    openUp = ramp(t, Th.second - 0.05, Th.second + 0.6, E.out);
    fanA = fanAngle(t, Gr.fans - 0.15, Th.fans - 0.2, 1400);
    flowT0 = Gr.pull - 0.1;
    flowRate = ramp(t, Gr.pull - 0.1, Gr.pull + 0.4) * lerp(1, 0.45, ramp(t, Gr.thins, Gr.lower)) * (1 - ramp(t, Lv.gap - 0.4, Lv.grip));
    sealDown = ramp(t, Gr.seal - 0.02, Gr.seal + 0.22, E.back);
    sealGlow = ramp(t, Gr.seal, Gr.seal + 0.15) * (1 - ramp(t, Gr.seal + 0.7, Gr.seal + 1.2)) + ramp(t, Lv.seal - 0.1, Lv.seal + 0.15) * (1 - ramp(t, Lv.seal + 0.8, Lv.seal + 1.3));
    leakRate = ramp(t, Gr.pull, Gr.pull + 0.3) * (1 - sealDown);
    density = lerp(1, 0.3, ramp(t, Gr.seal + 0.35, Gr.thins + 0.5, E.inOut));
    // leaving: once the front seal passes the end of the surface, air floods back in from the front
    frontOpen = ramp(t, Lv.out - 0.05, Lv.air + 0.15);
    density = lerp(density, 1, ramp(t, Lv.air, Lv.gap + 0.1, E.inOut));
    outsideO = ramp(t, Gr.outside - 0.1, Gr.outside + 0.25) * (1 - ramp(t, Gr.diff, Gr.diff + 0.4));
    outsideL = lerp(40, 54, ramp(t, Gr.harder - 0.1, Gr.harder + 0.3, E.back));
    gapArrO = ramp(t, Gr.under - 0.1, Gr.under + 0.25) * (1 - ramp(t, Gr.diff, Gr.diff + 0.4));
    netO = ramp(t, Gr.diff + 0.1, Gr.diff + 0.5) * (1 - ramp(t, Lv.air + 0.3, Lv.gap + 0.25));
    netLen = lerp(lerp(lerp(70, 115, ramp(t, Gr.diff + 0.1, Gr.presses + 0.2, E.out)), 1.45 * W_LEN, ramp(t, Gr.climb1 - 0.4, Gr.gravity, E.inOut)), 2 * W_LEN, ramp(t, Gr.twoG - 0.1, Gr.twoG + 0.6, E.back));
    netLen = lerp(netLen, 8, ramp(t, Lv.air + 0.2, Lv.gap + 0.2, E.in));
    weightO = ramp(t, Gr.gravity - 0.05, Gr.gravity + 0.3);
    ticksO = ramp(t, Gr.twice - 0.1, Gr.twice + 0.3) * (1 - ramp(t, Lv.drive - 0.3, Lv.drive));
    squash = 3.5 * ramp(t, Gr.presses, Gr.presses + 0.35, E.out) * (1 - ramp(t, Lv.air, Lv.gap)) + settle(t, Gr.stop, 3, 0.5);
    compress = Math.min(1, Math.max(0, squash / 4));
    spin = spinFor(sGrip(t) - (X_STOP - 600)) + (t > SEP ? 700 * (t - SEP) * Math.exp(-(t - SEP) * 0.25) + ramp(t, Th.wheels - 0.2, Th.wheels + 0.4) * 1200 * (t - Th.wheels) * Math.exp(-(t - Th.wheels) * 0.5) : 0);
    // thrust
    tankAir = ramp(t, Th.second, Th.second + 0.6);
    valve = ramp(t, Th.valve - 0.05, Th.valve + 0.1) * (1 - ramp(t, Th.cold + 0.5, Th.cold + 0.6));
    pipeFlow = ramp(t, Th.valve + 0.05, Th.valve + 0.3) * (1 - ramp(t, Th.cold + 0.5, Th.cold + 0.8));
    nozzleJet = ramp(t, Th.blasts - 0.12, Th.blasts + 0.05) * (1 - ramp(t, Th.cold + 0.55, Th.cold + 0.85));
    gasArrow = ramp(t, Th.out - 0.15, Th.out + 0.15) * (1 - ramp(t, Th.fuel - 0.3, Th.fuel));
    pushArrow = ramp(t, Th.pushed - 0.15, Th.pushed + 0.15) * (1 - ramp(t, Th.fuel - 0.3, Th.fuel));
    glowTank = ramp(t, Th.second + 0.4, Th.second + 0.7) * (1 - ramp(t, Th.thrusters + 0.4, Th.thrusters + 0.9));
  } else {
    // ending: the opening shot again
    lights = 1;
    door = 0;
    fanA = fanAngle(t, En.fans - 0.3, En.drive + 0.3, 1500);
    flowRate = ramp(t, En.fans - 0.2, En.fans + 0.2) * (1 - ramp(t, En.lip - 0.15, En.lip + 0.05)); flowT0 = En.fans - 0.2;
    density = lerp(1, 0.45, ramp(t, En.fans, En.hold + 0.4)); density = lerp(density, 1, ramp(t, En.lip - 0.1, En.lip + 0.3));
    sealDown = 1;
    netLen = 110; netO = ramp(t, En.hold - 0.1, En.hold + 0.2) * (1 - ramp(t, En.lip - 0.2, En.lip + 0.02));
    squash = 3.5 * ramp(t, En.hold, En.hold + 0.3, E.out) * (1 - ramp(t, En.lip - 0.1, En.lip));
    compress = squash / 3.5 * 0.7;
    const st = stunt(t, En.drive, En.lip);
    spin = spinFor(Math.max(0, st.s - S_HANG)) + (t > En.lip ? 900 * (t - En.lip) * Math.exp(-(t - En.lip) * 0.6) : 0);
    if (landedAt > 0) { const u = t - landedAt; squash = settle(t, landedAt, 7, 0.6) + 1.5 * ramp(u, 0, 0.2); compress = Math.min(1, Math.max(0, squash / 6)); }
    checkerO = 1;
    gauge = ramp(t, En.howLong - 0.2, En.howLong + 0.15, E.back) * (1 - ramp(t, En.questions + 0.3, En.questions + 0.7));
    gaugeLevel = 0.3 + 0.012 * Math.sin(t * 7); gaugeQ = ramp(t, En.howLong + 0.3, En.howLong + 0.6);
  }
  // "Two systems, two jobs": a ring on each system in the closed car (the sill, then the rear nozzle)
  const ringSill = phase === 'E' ? ramp(t, En.systems - 0.1, En.systems + 0.2) * (1 - ramp(t, En.jobs + 0.3, En.jobs + 0.7)) : 0;
  const ringNoz = phase === 'E' ? ramp(t, En.jobs - 0.1, En.jobs + 0.2) * (1 - ramp(t, En.fans - 0.2, En.fans + 0.2)) : 0;

  // ---------------- camera
  let cam: Cam;
  if (phase === 'O') {
    const hold: Cam = {x: C_HANG.x, y: C_HANG.y + 18, z: 2.3};
    cam = camTrack(t, [[4.2, MATCH_CAM], [4.95, MATCH_CAM], [8.2, hold, E.inOut], [O.drive, hold]]);
    if (t > O.drive) {
      const f = ramp(t, O.drive, O.lip + 0.5, E.inOut);
      const land = {x: C_LAND.x + 170, y: C_LAND.y - 120};
      const follow = {x: lerp(axis.x, land.x, ramp(t, O.lip + 0.9, STUNT_O.land + 0.3, E.inOut)), y: lerp(axis.y + 40, land.y, ramp(t, O.lip + 0.9, STUNT_O.land + 0.3, E.inOut))};
      cam = {x: lerp(hold.x, follow.x, f), y: lerp(hold.y, follow.y, f), z: Math.exp(lerp(Math.log(2.3), Math.log(1.42), ramp(t, O.drive, O.lip + 0.9, E.inOut))) * (1 + 0.07 * ramp(t, STUNT_O.land, 15.4, E.inOut)), r: 0};
    }
  } else if (phase === 'G') {
    const atCar = (dz: number, dy = 0): Cam => ({x: axis.x, y: axis.y + dy, z: dz});
    const entry: Cam = {x: X_STOP + 10, y: CAR3.cy - 10, z: 2.15};
    const wide: Cam = {x: -90, y: -560, z: 0.95};
    const hangCam: Cam = {x: C_HANG.x + 10, y: C_HANG.y + 95, z: 1.5};
    const gapCam: Cam = {x: X_STOP + 5, y: -42, z: 2.85};
    // the hang: in a little while the push grows against the weight, then look ahead to the end of the ramp
    const hangKeys: [number, Cam, ((x: number) => number)?][] = [[Gr.climb0, {...entry, y: entry.y - 36, z: 2.3}], [Gr.climb0 + 1.25, wide, E.inOut], [Gr.climb1 + 0.4, wide, E.inOut],
      [Gr.gravity + 0.8, hangCam, E.inOut], [Lv.seal - 0.7, {...hangCam, y: hangCam.y - 15, z: 1.66}, E.inOut], [Lv.drive, {x: hangCam.x - 230, y: hangCam.y - 25, z: 1.6}, E.inOut]];
    if (t < Gr.climb0) {
      // a slow drift in on the gap while the fans, the seal and the thinning play out; then wider for the roof arrows
      cam = camTrack(t, [[15.4, {x: X_STOP - 330, y: -42, z: 2.85}], [Gr.stop + 0.2, gapCam, E.out], [Gr.outside - 0.6, {...gapCam, x: gapCam.x - 30, z: 3.15}, E.inOut], [Gr.outside + 0.2, {...entry, y: entry.y - 28}, E.inOut], [Gr.climb0, {...entry, y: entry.y - 36, z: 2.3}, E.inOut]]);
    } else if (t < Lv.drive) {
      cam = camTrack(t, hangKeys);
    } else if (t < SEP) {
      const tgt = atCar(1.7, 60);
      const u = ramp(t, Lv.drive, Lv.surface + 0.4, E.inOut);
      const c0 = camTrack(Lv.drive, hangKeys);
      cam = {x: lerp(c0.x, tgt.x - 40, u), y: lerp(c0.y, tgt.y, u), z: lerp(c0.z, 1.75, u), r: 0};
    } else {
      const tgt = atCar(2.05, 10);
      const u = ramp(t, SEP, Th.second + 0.6, E.inOut);
      const p0 = gripPose(SEP);
      const a0 = axisOf(p0.anchor.x, p0.anchor.y, p0.heading);
      cam = {x: lerp(a0.x - 40, tgt.x + 20, u), y: lerp(a0.y + 60, tgt.y, u), z: lerp(1.75, 2.05, u), r: 0};
    }
  } else {
    const hold: Cam = {x: C_HANG.x, y: C_HANG.y + 18, z: lerp(2.0, 2.2, ramp(t, En.start, En.drive, E.inOut))};
    cam = hold;
    if (t > En.drive) {
      const f = ramp(t, En.drive, En.lip + 0.5, E.inOut);
      const end = {x: C_LAND.x + 200, y: C_LAND.y - 150}; // car and checker in the left half, the right half kept clear
      const follow = {x: lerp(axis.x, end.x, ramp(t, En.lip + 0.9, STUNT_E.land + 0.6, E.inOut)), y: lerp(axis.y + 40, end.y, ramp(t, En.lip + 0.9, STUNT_E.land + 0.6, E.inOut))};
      cam = {x: lerp(hold.x, follow.x, f), y: lerp(hold.y, follow.y, f), z: Math.exp(lerp(Math.log(2.2), Math.log(1.6), ramp(t, En.drive, STUNT_E.land + 0.6, E.inOut))) * (1 - 0.05 * ramp(t, STUNT_E.land + 0.6, En.end, E.inOut)), r: 0};
    }
  }

  // ---------------- car-local overlays
  const inv = heading < -90; // hanging or flying upside down (by pitch)
  const gapFade = phase === 'G' ? 1 - ramp(t, SEP + 0.6, SEP + 1.6) : phase === 'O' || phase === 'E' ? 1 - ramp(t, (phase === 'O' ? O.lip : En.lip) + 0.1, (phase === 'O' ? O.lip : En.lip) + 0.5) : 1;
  const gapPts = gapAir(t, density).map((p) => ({...p, o: p.o * gapFade})).filter((p) => p.o > 0.01);
  const st = stream(t, flowRate, flowT0);
  const leaks = [...leak(t, leakRate, 'front'), ...leak(t, leakRate, 'rear'), ...leak(t, frontOpen * (1 - ramp(t, Lv.gap + 0.3, Lv.gone)), 'front', 9, 1.4)];
  const flap = (x: number) => {
    const fl = floorAt(x);
    const bottom = lerp(fl + 7, -1.5, sealDown);
    const open = x > 0 ? frontOpen : 0;
    return (
      <g key={x}>
        <rect x={x - 2.6} y={fl} width={5.2} height={Math.max(2, bottom - fl - open * (bottom - fl - 6))} rx={1.5} fill="#2B2B33" />
        {sealGlow > 0 && <rect x={x - 6} y={fl - 2} width={12} height={-fl + 2} rx={4} fill="none" stroke="#3EE0C8" strokeWidth={3} opacity={sealGlow} />}
      </g>
    );
  };
  const showGap = roll === 0 && (attached || phase === 'G');
  const gap = showGap ? (
    <g>
      {gapPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3.4} fill={FLOW_LIGHT} stroke="#8FB0E6" strokeWidth={0.8} opacity={p.o} />)}
      {st.filter((p) => p.seg === 1).map((p, i) => <circle key={`s${i}`} cx={p.x} cy={p.y} r={3.2} fill={FLOW} opacity={p.o} />)}
      {leaks.map((p, i) => <circle key={`l${i}`} cx={p.x} cy={p.y} r={3.2} fill={FLOW_LIGHT} stroke="#8FB0E6" strokeWidth={0.8} opacity={p.o} />)}
      {flap(CAR3.gapFront)}{flap(CAR3.gapRear)}
    </g>
  ) : null;
  const innerLo = (
    <g>{st.filter((p) => p.seg >= 2 && p.seg <= 4).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill={FLOW_LIGHT} opacity={p.o} />)}</g>
  );
  const ventOut = st.filter((p) => p.seg === 5).map((p, i) => <circle key={`v${i}`} cx={p.x} cy={p.y} r={3.4} fill={FLOW_LIGHT} opacity={p.o * 0.9} />);
  // tank air and the pipe flow (thrust phase)
  const tankPts = tankAir > 0 ? Array.from({length: 40}, (_, i) => {
    const squeeze = lerp(1, 0.8, ramp(t, Th.compressed - 0.1, Th.compressed + 0.4, E.out));
    const cx = (CAR3.tank.x0 + CAR3.tank.x1) / 2, cy = (CAR3.tank.y0 + CAR3.tank.y1) / 2;
    const w = (CAR3.tank.x1 - CAR3.tank.x0 - 14) * squeeze, h = (CAR3.tank.y1 - CAR3.tank.y0 - 10) * squeeze;
    return <circle key={i} cx={cx + (rnd(i) - 0.5) * w + Math.sin(t * 9 + i) * 2} cy={cy + (rnd(i + 40) - 0.5) * h + Math.cos(t * 8 + i * 2) * 1.6} r={2.4} fill={FLOW_LIGHT} opacity={tankAir * 0.95} />;
  }) : null;
  const pipePts = pipeFlow > 0 ? Array.from({length: 12}, (_, i) => {
    const u = (t * 2.2 + i / 12) % 1;
    const path: [number, number][] = [[CAR3.tank.x0, CAR3.valve.y], [CAR3.valve.x, CAR3.valve.y], [CAR3.valve.x - 8, CAR3.pipeY], [CAR3.nozzle.x + 2, CAR3.pipeY]];
    const segL = [0.18, 0.12, 0.7];
    let acc = 0, k = 0;
    while (k < 2 && u > acc + segL[k]) { acc += segL[k]; k++; }
    const v = Math.min(1, (u - acc) / segL[k]);
    return <circle key={i} cx={lerp(path[k][0], path[k + 1][0], v)} cy={lerp(path[k][1], path[k + 1][1], v)} r={2.6} fill={FLOW} opacity={pipeFlow} />;
  }) : null;
  const innerUp = <g>{tankPts}{pipePts}</g>;

  // forces in car-local coordinates
  const PX = inv ? 80 : 0;
  const arrows = (
    <g>
      {outsideO > 0 && [-150, -75, 0, 75, 150].map((x) => {
        const top = roofAt3(x) - 10;
        return <Arrow key={x} x1={x} y1={top - outsideL} x2={x} y2={top} color={FORCE} w={6} head={14} outline={1.4} opacity={outsideO} />;
      })}
      {gapArrO > 0 && [-70, 0, 70].map((x) => {
        const fl = floorAt(x);
        return <Arrow key={`g${x}`} x1={x + 14} y1={-1} x2={x + 14} y2={-1 + (fl + 2) * 0.55} color={FORCE} w={3} head={7} outline={0.8} opacity={gapArrO} />;
      })}
      {netO > 0 && <Arrow x1={PX} y1={roofAt3(PX) - 26 - netLen} x2={PX} y2={roofAt3(PX) - 26} color={FORCE} w={18} opacity={netO} />}
      {ticksO > 0 && [1, 2].map((k) => (
        <g key={k} opacity={ticksO}>
          <rect x={PX + 26} y={roofAt3(PX) - 26 - W_LEN * k} width={22} height={W_LEN - 6} rx={6} fill={WEIGHT} opacity={0.75} />
        </g>
      ))}
      {ticksO > 0 && (
        <g transform={`translate(${PX + 92} ${roofAt3(PX) - 26 - W_LEN}) rotate(${-heading})`} opacity={ticksO}>
          <text x={0} y={14} textAnchor="middle" fontFamily='"Fredoka Variable", "Fredoka", system-ui' fontWeight={700} fontSize={44} fill={WEIGHT}>2×</text>
        </g>
      )}
      {ringSill > 0 && <rect x={CAR3.gapRear - 6} y={-60} width={CAR3.gapFront - CAR3.gapRear + 12} height={58} rx={16} fill="none" stroke={C.saffron} strokeWidth={7} opacity={ringSill} />}
      {ringNoz > 0 && <circle cx={CAR3.nozzle.x - 6} cy={CAR3.nozzle.y} r={26} fill="none" stroke={C.saffron} strokeWidth={7} opacity={ringNoz} />}
      {/* the gas jet out of the rear nozzle and the push on the car, opposite and attached to the nozzle */}
      {gasArrow > 0 && <Arrow x1={CAR3.nozzle.x - 40} y1={CAR3.nozzle.y} x2={CAR3.nozzle.x - 170} y2={CAR3.nozzle.y} color={FLOW} w={12} opacity={gasArrow} />}
      {pushArrow > 0 && <Arrow x1={CAR3.nozzle.x + 6} y1={CAR3.nozzle.y + 34} x2={CAR3.nozzle.x + 150} y2={CAR3.nozzle.y + 34} color={FORCE} w={14} opacity={pushArrow} />}
    </g>
  );
  // the rear-nozzle jet (world): direction = car-local -x
  const nz = (() => { const v = rotv(CAR3.nozzle.x - 12, CAR3.nozzle.y + squash, heading); return {x: anchor.x + v.x, y: anchor.y + v.y}; })();
  const back = rotv(-1, 0, heading);
  const allJets: Jet[] = [...jets];
  if (nozzleJet > 0) allJets.push({x: nz.x, y: nz.y, dx: back.x, dy: back.y, o: nozzleJet, t0: Th.blasts - 0.12, len: 330});

  const car: CarState = {x: anchor.x, y: anchor.y, heading, roll, squash, compress, spin, refl: ((axis.x * 0.35) % 600 + 600) % 600 - 300, openLo, openUp, parts, valve, fanSpin: fanA, glowFans, glowTank, id: 'bay'};
  // shadow on the floor under the flying / landed car
  const shadowO = phase === 'G' && t < Gr.climb0 ? 1 : (landedAt > 0 || (tau > 0)) ? Math.max(0, 1 - Math.abs(axis.y - CAR3.cy) / 900) : 0;
  const scr = (x: number, y: number) => toScreen(cam, x, y);
  const gaugePos = scr(C_LAND.x + 330, C_LAND.y - 250);
  const tankS = (() => { const v = rotv((CAR3.tank.x0 + CAR3.tank.x1) / 2, CAR3.tank.y1 + 6, heading); return scr(anchor.x + v.x, anchor.y + v.y); })();
  const valveS = (() => { const v = rotv(CAR3.valve.x, CAR3.valve.y, heading); return scr(anchor.x + v.x, anchor.y + v.y); })();

  // the checker (ending): watches the replay, ticks the clipboard on "Absolutely", lowers it as the music resolves
  const CH = {x: C_LAND.x - 300, y: 0, scale: 0.42};
  const watch: Pose = {...IDLE, armL: {a: 40, b: 100}, armR: {a: 26, b: 70}, lookX: 0.7, lookY: -0.6, tilt: -5, brows: 0.3, browAsym: 0.4, mouth: 'hmm'};
  const tick: Pose = {...watch, armR: {a: 34, b: 92}, lookX: 0.2, lookY: 0.4, tilt: 4, brows: 0.5, mouth: 'smile'};
  const lower: Pose = {...IDLE, armL: {a: 10, b: 24}, armR: {a: 8, b: 14}, lookX: 0.8, lookY: 0.1, tilt: 6, brows: 0.2, browAsym: 0.9, mouth: 'smirk'};
  const tickU = ramp(t, En.abs - 0.3, En.abs + 0.1) * (1 - ramp(t, En.abs + 0.45, En.abs + 0.8));
  const chPose = t < En.commute - 0.2 ? mixPose(mixPose(watch, {...watch, lookX: 0.9, lookY: -0.9}, ramp(t, En.drive, En.lip + 0.4) * (1 - ramp(t, STUNT_E.land, STUNT_E.land + 0.8))), tick, tickU) : mixPose(watch, lower, ramp(t, En.commute - 0.2, En.leap - 0.2, E.inOut));
  const clip = (
    <g transform="translate(6 -10) rotate(-8)">
      <rect x={-34} y={-46} width={68} height={86} rx={6} fill="#C9924F" stroke={C.ink} strokeWidth={4} />
      <rect x={-27} y={-37} width={54} height={70} rx={3} fill={C.cream} />
      <rect x={-12} y={-52} width={24} height={12} rx={3} fill="#8E989E" stroke={C.ink} strokeWidth={3} />
      {[0, 1, 2].map((k) => <line key={k} x1={-18} y1={-22 + k * 18} x2={18} y2={-22 + k * 18} stroke={C.inkMuted} strokeWidth={3} />)}
      <path d="M -20 14 l 6 7 l 12 -14" stroke={C.teal} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={ramp(t, En.abs - 0.05, En.abs + 0.15)} />
    </g>
  );

  return (
    <AbsoluteFill style={{background: '#0E141C'}}>
      <World cam={cam}>
        <WSvg>
          <BayBack lights={lights} open={door} />
          <RampDrawing />
          {shadowO > 0 && <ellipse cx={axis.x} cy={4} rx={230 * (0.6 + 0.4 * shadowO)} ry={14} fill="rgba(16,26,32,0.28)" opacity={shadowO} />}
          {/* weight: straight down from the centre of mass, drawn behind the car, offset from the push arrow */}
          {weightO > 0 && <Arrow x1={axis.x + 90} y1={axis.y} x2={axis.x + 90} y2={axis.y + 30 + W_LEN} color={WEIGHT} w={16} opacity={weightO * (1 - ramp(t, Th.end - 0.5, Th.end))} />}
          {allJets.map((j, i) => <Plume key={i} j={j} t={t} />)}
          <Car3 {...car} gap={gap} innerLo={innerLo} innerUp={innerUp} over={<g>{ventOut}{arrows}</g>} />
          {gauge > 0 && (
            <g>
              <path d={`M ${C_LAND.x + 270} ${C_LAND.y - 200} L ${C_LAND.x + 60} ${C_LAND.y - 40}`} stroke={C.ink} strokeWidth={3} strokeDasharray="10 8" opacity={gauge} />
              <AirGauge x={C_LAND.x + 330} y={C_LAND.y - 270} r={88} level={gaugeLevel} q={gaugeQ} opacity={gauge} />
            </g>
          )}
        </WSvg>
        {checkerO > 0 && <Character look={CAST.checker} pose={chPose} frame={frame} seed={4} x={CH.x} y={CH.y} scale={CH.scale} life={0.5} holdL={clip} front="L" />}
      </World>
      {/* short component labels, only while the part is being explained */}
      {phase === 'G' && t > Th.thrusters - 0.4 && t < Th.valve && <Tiny x={tankS.x} y={tankS.y + (inv ? -64 : 64)} text="air tank" o={ramp(t, Th.thrusters - 0.3, Th.thrusters) * (1 - ramp(t, Th.valve - 0.4, Th.valve - 0.1))} />}
      {phase === 'G' && t > Th.valve - 0.3 && t < Th.out && <Tiny x={valveS.x} y={valveS.y + (inv ? -70 : 70)} text="valve" o={ramp(t, Th.valve - 0.25, Th.valve) * (1 - ramp(t, Th.out - 0.4, Th.out - 0.1))} />}
    </AbsoluteFill>
  );
};

const Tiny: React.FC<{x: number; y: number; text: string; o: number}> = ({x, y, text, o}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', opacity: o, fontFamily: F.body, fontWeight: 800, fontSize: 40, color: C.ink, background: C.cream, border: `3px solid ${C.ink}`, borderRadius: 22, padding: '2px 18px', whiteSpace: 'nowrap'}}>{text}</div>
);

/** Outline of the drawn car tracing itself over the real hang (top layer during the match). */
export const TraceOverlay: React.FC<{t: number}> = ({t}) => {
  const p = onRamp(S_HANG);
  const draw = ramp(t, 4.18, 4.6, E.inOut);
  const o = ramp(t, 4.15, 4.25) * (1 - ramp(t, 4.75, 4.95));
  if (o <= 0) return null;
  return (
    <AbsoluteFill>
      <World cam={MATCH_CAM}>
        <WSvg>
          <g transform={`translate(${p.x} ${p.y}) rotate(${p.heading})`} opacity={o}>
            <path d={CAR_OUTLINE} fill="none" stroke={C.saffron} strokeWidth={4} strokeDasharray="2400" strokeDashoffset={2400 * (1 - draw)} strokeLinejoin="round" />
          </g>
        </WSvg>
      </World>
    </AbsoluteFill>
  );
};
