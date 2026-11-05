// V3 E. The 2014 study and its flipped-coil control (101.81 -> 135.87 s; PLOS ONE 2014, SOURCE_NOTES C12-C17).
//
// One physical world: two buildings seen as a cutaway, three floors each. Floor n of the left building is pair n's
// sender (lit room, EEG cap, the game); floor n of the right building is pair n's receiver (dark room, headphones,
// TMS chair, round coil on an articulated arm over the LEFT motor cortex = frame-right in this front view, the TMS
// machine on a cart, the touchpad on the desk under the right hand = frame-left). A network cable runs from each
// sender's tower, out across the gap, along the receiver's ceiling and down into the TMS machine. Behind each
// receiver a researchers' monitor mirrors the sender's game ("Sender's game"); the receiver faces away from it.
// Everyone is the crew3 rig with real hands; the 2014 researcher (lab coat) does the equipment handling.
//
// Beats:
//  101.81 match cut from Stocco's 2013 TMS machine to the 2014 machine at the same place and size. The network plug
//         dangles; the researcher steps in, catches it, lifts and seats it (click, power light) on "A year later".
//         One continuous pull-out: the receiver's room, then the whole cutaway; the other two pairs' rooms light up
//         on "three pairs of volunteers".
//  105.5  push into pair 1's receiver (the trial composition): monitor, face, coil, hand, touchpad. A rocket; the
//         command crosses the ceiling; the coil clicks into his head; the hand snaps up and drops onto the pad on
//         "touchpad" (involuntary: no anticipation, a 2-frame snap, a stiff hold); the cannon fires. He glances at it.
//  109.45 tilt up to the coil. The researcher walks in, a finger to his lips and a glance at camera on "quietly",
//         takes the coil body and its handle and turns it 180 deg about the handle ("flipped the coil over"):
//         the saffron active face now looks away from the head.
//  113.04 the frame becomes the lower of two stacked panels (coil flipped); the in-position twin settles above.
//         Same game (identical monitors), same pulse strength (identical dial and click, both blink), and on
//         "couldn't tell" both receivers shrug the same way.
//  119.29 the in-position panel opens to full frame: pair 1's trial. Rocket hit (5 of 6), and a friendly plane shot
//         by mistake (3 of 8): tallies under the monitor.
//  123.55 crane up one floor to pair 2, same framing: four rockets, one hit.
//  126.15 crane back down to pair 1, the SAME composition, coil flipped. Same launch, the same click at the same
//         gain, the same blink; the hand does not move through the silence; the rocket hits the city.
//  129.6  pull out to the cutaway: all three receivers' coils flipped; FIRE commands still cross to every room and
//         click, no hand moves, "0 presses" on each desk, every rocket hits its city.
//  134.2  pair 1's receiver lifts his hand off the pad; the push into the pad ends with its surface on PAD_RECT.
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp} from '../dc/math';
import {lit, mix} from '../dc/color';
import {CamS, FPS, T, TE, pr} from './core2';
import {Cam, Computer, Desk, INK, K, Monitor, Tag} from '../art/kit';
import {GameScreenDE, GEvent, arcPt, evState} from './gameDE';
import {Burst, CoilArm, PlaneIcon, RedX, RocketIcon, S5Coil, TmsBox} from '../art/s5parts';
import {EEGCap, Headphones, V14} from '../art/people';
import {PAD_RECT} from './contracts';
import {anchorCam, D_END, Plug, PLUG_JOIN, PLUG_TIP, toScr} from './SeqD';
import {blinkAt, bump, jerk, kp, kv, MOUTH_L, Perf, Person3, Pt, RESEARCHER, rigWorld, SH_REST} from './de_cast';
import {HandShape, Look, Mouth} from './crew3';

// ---------------------------------------------------------------- timing
type Trial = {t0: number; up0: number; up1: number; pulse: number; tap: number; fire: number; kill: number; arrive: number};
const DUR = 2.75;
const mkTrial = (t0: number): Trial => ({t0, up0: t0 + 0.35, up1: t0 + 1.25, pulse: t0 + 1.4, tap: t0 + 1.6, fire: t0 + 1.65, kill: t0 + 1.97, arrive: t0 + DUR});
const tm = () => {
  const s = T('A year later') - 0.55; // 101.81
  const catchT = s + 0.42;
  const seat = catchT + 0.5;
  const wide1 = T('three pairs') - 0.15;
  const pops = [T('three pairs'), T('pairs of volunteers'), T('volunteers') + 0.1];
  const push0 = TE('volunteers') - 0.1;
  const tc = T('This time the') + 0.55;
  const e2 = mkTrial(T('touchpad') - 1.6);
  const flipIn = T('In some rounds') - 0.38;
  const walk1 = flipIn + 0.85;
  const shh = T('quietly') - 0.55;
  const grip = T('flipped the coil') - 0.12;
  const fs = grip + 0.08; // the coil turns
  const fe = fs + 0.8;
  const ab0 = T('Same game') - 0.42;
  const ab1 = ab0 + 0.55;
  const abP = [T('Same pulse') + 0.35, T('which way the coil') + 0.15];
  const shrug = T('couldn’t tell') - 0.3;
  const wipe0 = T('With the coil in position') - 0.7;
  const cutN = T('With the coil in position') - 0.24;
  const N = mkTrial(cutN + 0.25);
  const P = {t0: N.t0 + 1.85, up0: N.t0 + 1.95, up1: N.t0 + 2.38, pulse: N.t0 + 2.45, tap: N.t0 + 2.65, fire: N.t0 + 2.7, kill: N.t0 + 3.02, dur: 1.6};
  const up0 = T('Another hit only') - 0.5;
  const up1 = up0 + 0.55;
  const p2 = [0, 1, 2, 3].map((n) => up1 - 0.35 + n * 0.4);
  const p2hit = {pulse: p2[1] + 0.42, tap: p2[1] + 0.62, fire: p2[1] + 0.67};
  const cutF = T('With the coil flipped') - 0.18;
  const F = mkTrial(cutF + 0.25);
  const dn0 = F.t0 - 0.55;
  const out2 = F.arrive + 0.15;
  const wide2 = out2 + 1.35;
  const nob = T('nobody pressed');
  const every = T('Every rocket got');
  const handOff = TE('got through') - 0.5;
  const push = TE('got through') + 0.05;
  const end = T('Then the researchers gave') - 0.5; // 135.87 (F's first frame)
  const last = (Math.ceil(end * FPS) - 1) / FPS; // E's last frame
  return {s, catchT, seat, wide1, pops, push0, tc, e2, flipIn, walk1, shh, grip, fs, fe, ab0, ab1, abP, shrug, wipe0, cutN, N, P, up0, up1, p2, p2hit, cutF, F, dn0, out2, wide2, nob, every, handOff, push, end, last};
};
type TM = ReturnType<typeof tm>;
let memo: TM | null = null;
const M_ = () => (memo ??= tm());

// ---------------------------------------------------------------- world layout
const RWE = 2200, RHE = 1080, SLAB = 90, GAP = 800;
const FLOOR = RHE + SLAB;
const rY = (i: number) => (2 - i) * FLOOR; // pair i (0 = pair 1, the ground floor)
const SX = -(RWE + GAP); // sender rooms' x origin
const CEIL = 70; // the network cable's run under the ceiling
// receiver room (local)
const RCV = {x: 860, y: 1238, s: 2.2};
const COIL = {x: 920, y: 292, A: 25, s: 0.7};
const HDIR = {x: Math.cos((COIL.A * Math.PI) / 180), y: Math.sin((COIL.A * Math.PI) / 180)};
const onHandle = (u: number) => ({x: COIL.x + HDIR.x * u * COIL.s, y: COIL.y + HDIR.y * u * COIL.s});
const ARM_END = onHandle(250);
const HANDLE_END = onHandle(326);
const SCALP = {x: 893, y: 336};
const PADR = {x: 500, y: 690, w: 200, h: 130};
const H_REST = {x: 612, y: 744};
const H_REST_R = {x: 1060, y: 792};
const MON = {x: 100, y: 130, s: 0.75};
const BOXS = 1.3;
const BOXP = {x: 1520, y: 600};
const PORT = {x: BOXP.x + 180 * BOXS, y: BOXP.y};
const PLS = 0.9; // plug scale in E
const RES = {home: 2060, flip: 1250, y: 1062, s: 2.2};
// sender room (local)
const SND = {x: 1300, y: 1238, s: 2.2};
const SMON = {x: 620, y: 815, s: 0.78};
const STOWER = {x: 1900, y: 830, s: 1.4};
// cameras
const WIDE: CamS = {x: -400, y: 1700, z: 0.284};
const TCC = {x: 620, y: 475, z: 1.3};
const COILC = {x: 1110, y: 360, z: 1.9};
const tcCam = (i: number, zMul = 1): CamS => ({x: TCC.x, y: TCC.y + rY(i), z: TCC.z * zMul});
const drift = (rel: number) => 1 + 0.025 * easeInOut(clamp(rel / 3.3));

const LOOKS_R: Look[] = [V14.recv1, V14.recv2, V14.recv3];
const LOOKS_S: Look[] = [V14.send1, V14.send2, V14.send3];
const P_ = (x: number, y: number) => `${fmt(x)},${fmt(y)}`;
/** pulse envelope (fast attack, short decay) */
const env = (t: number, p: number) => (t < p ? 0 : t < p + 0.04 ? (t - p) / 0.04 : Math.max(0, 1 - (t - p - 0.04) / 0.42));
const envs = (t: number, ps: number[]) => ps.reduce((m, p) => Math.max(m, env(t, p)), 0);

// ---------------------------------------------------------------- the story state of each pair
/** the coil's flip state of pair i at time t (the AB twin overrides it to 0) */
const flipOf = (i: number, t: number) => {
  const M = M_();
  if (i === 0) {
    if (t < M.fs) return 0;
    if (t < M.fe) return easeInOut((t - M.fs) / (M.fe - M.fs));
    if (t < M.cutN) return 1;
    return t < M.up1 + 0.4 ? 0 : 1; // in position for the in-position block, flipped again off-screen
  }
  return t < M.F.t0 + (i === 1 ? 0.5 : 1.5) ? 0 : 1;
};
/** wide-shot rockets in the control block: two per pair, each preceded by a FIRE command and a (flipped) click */
const wide2Rockets = (i: number) => {
  const M = M_();
  return [M.out2 + 0.55 + i * 0.3, M.every - 0.95 + i * 0.2].map((t0) => ({t0, dur: 1.05, pulse: t0 + 0.62}));
};
type Seg = {a: number; b: number; shift: number; events: GEvent[]; cursor: [number, number, number][]};
/** what the pair's game shows (the sender's screen and the researchers' monitor show the same game) */
const segsOf = (i: number): Seg[] => {
  const M = M_();
  const idle = (a: number, b: number): Seg => ({a, b, shift: 0, events: [], cursor: []});
  const w2: Seg = {a: M.out2 - 0.2, b: 999, shift: 0, events: wide2Rockets(i).map((r) => ({kind: 'rocket' as const, t0: r.t0, dur: r.dur})), cursor: wide2Rockets(i).map((r) => [r.t0 + 0.1, r.pulse - 0.1, r.pulse] as [number, number, number])};
  if (i === 0)
    return [
      {a: 0, b: M.ab0, shift: 0, events: [{kind: 'rocket', t0: M.e2.t0, dur: DUR, fire: M.e2.fire}], cursor: [[M.e2.up0, M.e2.up1, M.e2.pulse]]},
      {a: M.ab0, b: M.cutN, shift: 0, events: [{kind: 'plane', t0: T('Same game') - 0.1, dur: 2.4}], cursor: []},
      {a: M.cutN, b: M.up1, shift: 100 - M.N.t0, events: [{kind: 'rocket', t0: M.N.t0, dur: DUR, fire: M.N.fire}, {kind: 'plane', t0: M.P.t0, dur: M.P.dur, fire: M.P.fire}], cursor: [[M.N.up0, M.N.up1, M.N.pulse], [M.P.up0, M.P.up1, M.P.pulse]]},
      {a: M.up1, b: M.out2 - 0.2, shift: 100 - M.F.t0, events: [{kind: 'rocket', t0: M.F.t0, dur: DUR}], cursor: [[M.F.up0, M.F.up1, M.F.pulse]]},
      w2,
    ];
  if (i === 1)
    return [
      idle(0, M.up0 - 0.2),
      {a: M.up0 - 0.2, b: M.out2 - 0.2, shift: 0, events: M.p2.map((t0, n) => ({kind: 'rocket' as const, t0, dur: 1.1, fire: n === 1 ? M.p2hit.fire : undefined})), cursor: [[M.p2[1] + 0.05, M.p2hit.pulse - 0.05, M.p2hit.pulse]]},
      w2,
    ];
  return [idle(0, M.out2 - 0.2), w2];
};
const gameAt = (i: number, t: number) => {
  const all = segsOf(i);
  const sg = all.find((s) => t >= s.a && t < s.b) ?? all[0];
  const ev = sg.events.map((e) => ({...e, t0: e.t0 + sg.shift, fire: e.fire !== undefined ? e.fire + sg.shift : undefined}));
  const clock = t + sg.shift;
  let hitAt: number | undefined;
  for (const e of ev) if (e.fire === undefined && clock >= e.t0 + e.dur) hitAt = e.t0 + e.dur;
  let cursor = 0;
  for (const [a, b, p] of sg.cursor) if (t >= a - 0.1 && t < p + 0.6) cursor = Math.max(cursor, clamp((t - a) / (b - a)) * (1 - clamp((t - p - 0.1) / 0.4)));
  return {clock, events: ev, cityHitAt: hitAt, cursor};
};
/** every FIRE command that reaches pair i's coil (absolute times) */
const pulsesOf = (i: number): number[] => {
  const M = M_();
  const w = wide2Rockets(i).map((r) => r.pulse);
  if (i === 0) return [M.e2.pulse, ...M.abP, M.N.pulse, M.P.pulse, M.F.pulse, ...w];
  if (i === 1) return [M.p2hit.pulse, ...w];
  return w;
};

type PlugS = {j: Pt; ang: number; seated: boolean};
type RS = {
  i: number; look: Look; flip: number; pulses: number[]; lights: number; perf: Perf; press: number;
  game: ReturnType<typeof gameAt>; axisK: number; zeroK: number; tally: number; researcher?: {x: number; perf: Perf}; plug: PlugS; power: number;
};

/** pair i's receiver at time t; twin: the AB "coil in position" copy of pair 1 */
const rState = (i: number, t: number, twin = false): RS => {
  const M = M_();
  const flip = twin ? 0 : flipOf(i, t);
  const pulses = pulsesOf(i);
  // the hand: an involuntary jerk on every pulse that arrives with the coil in position
  let jx = 0, jy = 0, shape: HandShape = SH_REST, press = 0, hitch = 0;
  let lastJerk = -99;
  for (const p of pulses) {
    const inPos = (twin ? 0 : flipOf(i, p)) < 0.5;
    if (!inPos || t < p) continue;
    const j = jerk(t, p);
    if (t - p < 1.0) {
      jx = j.dx;
      jy = j.dy;
      shape = j.shape;
      press = j.press;
      hitch = j.hitch;
    }
    lastJerk = p;
  }
  const glance = bump(t - lastJerk, 0.32, 1.15, 0.25, 0.35);
  const sh = i === 0 && t > M.ab0 && t < M.cutN ? bump(t, M.shrug, M.shrug + 1.35, 0.3, 0.35) : 0;
  const off = i === 0 && !twin ? pr(t * FPS, M.handOff, M.handOff + 0.5) : 0;
  const handled = i === 0 && !twin ? bump(t, M.grip - 0.1, M.fe + 0.2, 0.3, 0.4) : 0;
  const rest = {x: lerp(H_REST.x, 800, off), y: H_REST.y - 40 * Math.sin(off * Math.PI) + (806 - H_REST.y) * off};
  const hand = {x: lerp(rest.x + jx, 690, sh), y: lerp(rest.y + jy, 600, sh)};
  const hr = {x: lerp(H_REST_R.x, 1030, sh), y: lerp(H_REST_R.y, 605, sh)};
  const lookX = lerp(lerp(0, -0.55, glance), 0.5, Math.max(sh, handled * 0.9));
  const lookY = lerp(lerp(0.1, 0.85, glance), -0.6, Math.max(sh, handled * 0.9));
  const brows = 0.3 * glance + 0.6 * sh + 0.15 * handled;
  const mouth: Mouth = sh > 0.4 ? 'hmm' : glance > 0.5 ? 'o' : 'flat';
  const perf: Perf = {
    pose: {lookX, lookY, brows, mouth, tilt: -6 * sh + 1.5 * hitch, lean: 1.2 * hitch, blink: blinkAt(t, pulses.map((p) => p + 0.04))},
    hl: hand,
    hr,
    sl: sh > 0 ? {curl: lerp(shape.curl, 0.05, sh), spread: lerp(shape.spread ?? 0.3, 0.85, sh)} : off > 0 ? {curl: lerp(0.38, 0.3, off), spread: 0.3} : shape,
    sr: {curl: lerp(0.35, 0.05, sh), spread: lerp(0.3, 0.85, sh)},
  };
  // lights: pairs 2 and 3 are dark until "three pairs of volunteers"
  const lights = i === 0 ? 1 : pr(t * FPS, M.pops[i], M.pops[i] + 0.12, (x) => x);
  const zeroK = pr(t * FPS, M.nob + 0.1 + i * 0.22, M.nob + 0.35 + i * 0.22) * (i === 0 ? 1 - pr(t * FPS, M.push - 0.1, M.push + 0.25) : 1);
  const axisK = i === 0 && !twin ? pr(t * FPS, M.fs - 0.2, M.fs + 0.05) * (1 - pr(t * FPS, M.fe, M.fe + 0.3)) : 0;
  const tally = i === 0 ? (t >= M.cutN && t < M.up1 + 0.2 ? 1 : 0) : i === 1 && t >= M.up0 && t < M.out2 ? 1 : 0;
  return {i, look: LOOKS_R[i], flip, pulses, lights, perf, press, game: gameAt(i, t), axisK, zeroK, tally, researcher: i === 0 && !twin ? resState(t) : undefined, plug: plugState(i, t), power: i === 0 ? (t >= M.seat ? 1 : 0) : 1};
};

/** the network plug of pair 1 at E's start: dangling, caught, seated (other pairs: seated) */
const SEAT_J = {x: PORT.x, y: PORT.y + 8 - (PLUG_TIP + PLUG_JOIN) * PLS};
const GRIP_D = (PLUG_JOIN + 34) * PLS; // from the junction to the hand's grip on the plug body
const DANGLE = {x: 1810, y: 470};
const dangle = (t: number) => {
  const th = 0.22 * Math.sin((t - 101.0) * 3.1) + 0.06 * Math.sin((t - 101) * 7.3);
  return {j: {x: DANGLE.x + Math.sin(th) * 60, y: DANGLE.y - (1 - Math.cos(th)) * 60}, ang: (-th * 180) / Math.PI};
};
const gripOf = (j: Pt, ang: number) => {
  const r = (ang * Math.PI) / 180;
  return {x: j.x - Math.sin(r) * GRIP_D, y: j.y + Math.cos(r) * GRIP_D};
};
const plugState = (i: number, t: number): PlugS => {
  const M = M_();
  if (i !== 0 || t >= M.seat) return {j: SEAT_J, ang: 0, seated: true};
  if (t < M.catchT) return {...dangle(t), seated: false};
  const d0 = dangle(M.catchT);
  const g0 = gripOf(d0.j, d0.ang);
  const gs = gripOf(SEAT_J, 0);
  const g = kp(t, [[M.catchT, g0], [M.catchT + 0.14, {x: g0.x + 12, y: g0.y - 28}, 0, easeOut], [M.seat - 0.08, {x: gs.x, y: gs.y - 34}, 30], [M.seat, gs, 0, easeIn]]);
  const ang = d0.ang * (1 - easeOut(clamp((t - M.catchT) / 0.3))) - 6 * Math.sin(clamp((t - M.catchT) / 0.3) * Math.PI);
  const r = (ang * Math.PI) / 180;
  return {j: {x: g.x + Math.sin(r) * GRIP_D, y: g.y - Math.cos(r) * GRIP_D}, ang, seated: false};
};

/** the 2014 researcher (pair 1's room): handles the plug, then the coil */
const resState = (t: number): {x: number; perf: Perf} => {
  const M = M_();
  const x = kv(t, [[M.s, 2420], [M.s + 0.42, RES.home, easeOut], [M.flipIn + 0.05, RES.home], [M.walk1, RES.flip, easeInOut], [M.fe + 0.12, RES.flip], [M.fe + 0.85, RES.home + 40, easeInOut]]);
  const walking = (t > M.s && t < M.s + 0.42) || (t > M.flipIn + 0.05 && t < M.walk1) || (t > M.fe + 0.12 && t < M.fe + 0.85);
  const bob = walking ? -Math.abs(Math.sin(t * 11)) * 5 : 0;
  const ch = {x, y: RES.y, scale: RES.s, bob};
  const restL = {x: x - 150, y: 770}, restR = {x: x + 158, y: 770};
  let hl: Pt = restL, hr: Pt = restR;
  let sl: HandShape = {curl: 0.3, spread: 0.3}, sr: HandShape = {curl: 0.3, spread: 0.3};
  let lookX = -0.6, lookY = 0.2, mouth: Mouth = 'flat', brows = 0, tilt = 0, browAsym = 0;
  if (t < M.seat + 0.75) {
    // reach for the dangling plug, carry it, seat it, let go
    const pl = plugState(0, t);
    const g = gripOf(pl.j, pl.ang);
    const d0 = dangle(M.catchT);
    const c0 = gripOf(d0.j, d0.ang);
    hl = t < M.catchT ? kp(t, [[M.s, {x: 2270, y: 760}], [M.catchT, c0, -50, easeInOut]]) : t < M.seat + 0.08 ? g : kp(t, [[M.seat + 0.08, g], [M.seat + 0.7, restL, 40]]);
    sl = t < M.catchT - 0.1 ? {curl: 0.1, spread: 0.6} : t < M.seat + 0.05 ? {curl: 0.82, spread: 0.15} : {curl: 0.2, spread: 0.65};
    lookX = -0.75;
    lookY = t < M.seat ? 0.45 : 0.2;
    brows = t < M.seat ? -0.2 : 0.15;
    mouth = t < M.seat ? 'hmm' : 'smile';
  } else if (t > M.flipIn && t < M.fe + 1.2) {
    // the flip: walk in, a quiet finger to the lips, take the coil body and its handle, turn it, let go
    const mouthW = rigWorld(ch, MOUTH_L);
    const rimA = {x: 975, y: 228}; // the coil body's top rim; the turn reflects it across the handle axis
    const rimB = (() => {
      const v = {x: rimA.x - COIL.x, y: rimA.y - COIL.y};
      const along = v.x * HDIR.x + v.y * HDIR.y;
      const p = {x: COIL.x + HDIR.x * along, y: COIL.y + HDIR.y * along};
      return {x: 2 * p.x - rimA.x, y: 2 * p.y - rimA.y};
    })();
    const turn = clamp((t - M.fs) / (M.fe - M.fs));
    const onCoil = {x: lerp(rimA.x, rimB.x, easeInOut(turn)) + 34 * Math.sin(turn * Math.PI), y: lerp(rimA.y, rimB.y, easeInOut(turn))};
    const handleEnd = {x: HANDLE_END.x - 6, y: HANDLE_END.y - 4};
    const shhK = bump(t, M.shh, M.grip - 0.35, 0.3, 0.3);
    const lMouth = {x: mouthW.x - 6, y: mouthW.y + 22};
    if (t < M.grip - 0.35) hl = {x: lerp(restL.x, lMouth.x, shhK), y: lerp(restL.y, lMouth.y, shhK)};
    else if (t < M.grip) hl = kp(t, [[M.grip - 0.35, restL], [M.grip, rimA, 50, easeOut]]);
    else if (t < M.fe + 0.06) hl = onCoil;
    else hl = kp(t, [[M.fe + 0.06, rimB], [M.fe + 0.55, restL, -30]]);
    if (t < M.grip - 0.3) hr = restR;
    else if (t < M.grip) hr = kp(t, [[M.grip - 0.3, restR], [M.grip - 0.02, handleEnd, -40, easeOut]]);
    else if (t < M.fe + 0.06) hr = handleEnd;
    else hr = kp(t, [[M.fe + 0.06, handleEnd], [M.fe + 0.55, restR, 40]]);
    const holding = t >= M.grip - 0.05 && t < M.fe + 0.06;
    sl = shhK > 0.05 ? {curl: 0.85, spread: 0.1, point: shhK} : holding ? {curl: 0.8, spread: 0.15} : {curl: 0.25, spread: 0.55};
    sr = holding ? {curl: 0.85, spread: 0.1} : {curl: 0.3, spread: 0.4};
    lookX = shhK > 0.3 ? 0 : -0.55;
    lookY = shhK > 0.3 ? 0 : -0.45;
    mouth = shhK > 0.3 ? 'smirk' : t > M.fe ? 'smile' : 'hmm';
    brows = shhK > 0.3 ? 0.35 : 0.05;
    browAsym = shhK > 0.3 ? 0.8 : 0;
    tilt = shhK > 0.3 ? 5 : -3;
  }
  return {x, perf: {pose: {lookX, lookY, mouth, brows, browAsym, tilt, bob}, hl, hr, sl, sr}};
};

// ---------------------------------------------------------------- receiver room (local coords 0..RWE x 0..RHE)
const Coil14: React.FC<{flip: number; pulse: number; axisK: number}> = ({flip, pulse, axisK}) => (
  <g transform={`translate(${COIL.x} ${COIL.y}) rotate(${COIL.A}) scale(-1 1)`}>
    <S5Coil x={0} y={0} s={COIL.s} ang={0} flip={flip} pulse={pulse} axisK={axisK} />
  </g>
);
const TouchPad14: React.FC<{id: string; press: number}> = ({id, press}) => (
  <g>
    <path d={`M${PADR.x - 10},${PADR.y + PADR.h + 26} L${PADR.x + PADR.w + 10},${PADR.y + PADR.h + 26} L${PADR.x + PADR.w},${PADR.y + 20} L${PADR.x},${PADR.y + 20} Z`} fill="#5D6B76" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={PADR.x - 4} y={PADR.y + 8} width={PADR.w + 8} height={PADR.h + 8} rx={16} fill="#9AA6B0" stroke={INK} strokeWidth={5} />
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F6F8FA" />
        <stop offset="1" stopColor="#DCE2E7" />
      </linearGradient>
    </defs>
    <rect x={PADR.x} y={PADR.y} width={PADR.w} height={PADR.h} rx={14} fill={`url(#${id})`} />
    {press > 0.001 && <rect x={PADR.x} y={PADR.y} width={PADR.w} height={PADR.h} rx={14} fill={K.saffron} opacity={0.6 * press} />}
    <rect x={PADR.x + 2.5} y={PADR.y + 2.5} width={PADR.w - 5} height={PADR.h - 5} rx={12} fill="none" stroke={INK} strokeWidth={5} />
  </g>
);
const RecvRoom: React.FC<{f: number; S: RS; id: string}> = ({f, S, id}) => {
  const t = f / FPS;
  const active = S.flip < 0.5;
  const e = envs(t, S.pulses);
  const pk = S.pulses.map((p) => (t - (p - 0.5)) / 0.47).find((u) => u >= 0 && u <= 1);
  const pkPt = pk === undefined ? null : (() => {
    const L1 = PORT.x, L2 = PORT.y - CEIL;
    const d = easeIn(pk) * (L1 + L2);
    return d < L1 ? {x: d, y: CEIL} : {x: PORT.x, y: CEIL + (d - L1)};
  })();
  const cableHot = S.pulses.some((p) => t >= p - 0.05 && t < p + 0.12);
  const pl = S.plug;
  const g = S.game;
  const to = pl.j;
  const netD = `M-40,${CEIL} L${fmt(to.x - 40)},${CEIL} Q${fmt(to.x)},${CEIL} ${fmt(to.x)},${CEIL + 60} L${fmt(to.x)},${fmt(Math.max(CEIL + 60, to.y - 60))} Q${fmt(to.x)},${fmt(to.y - 20)} ${fmt(to.x)},${fmt(to.y)}`;
  const coilD = `M${P_(HANDLE_END.x, HANDLE_END.y)} C${P_(HANDLE_END.x + 120, HANDLE_END.y + 60)} ${P_(BOXP.x + 120, BOXP.y - 200)} ${P_(BOXP.x + 230 * BOXS - 30, BOXP.y + 4)}`;
  const R = S.researcher;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-wall`} cx="0.42" cy="0.42" r="0.8">
          <stop offset="0" stopColor="#4C5E6F" />
          <stop offset="0.55" stopColor="#334250" />
          <stop offset="1" stopColor="#1C2630" />
        </radialGradient>
        <radialGradient id={`${id}-gl`}>
          <stop offset="0" stopColor={K.saffron} stopOpacity={1} />
          <stop offset="1" stopColor={K.saffron} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-mon`}>
          <rect x={MON.x} y={MON.y} width={640 * MON.s} height={400 * MON.s} rx={6} />
        </clipPath>
      </defs>
      <rect x={-20} y={-20} width={RWE + 40} height={RHE + 40} fill={`url(#${id}-wall)`} />
      <rect x={-20} y={960} width={RWE + 40} height={140} fill="#1A222A" opacity={0.65} />
      {/* the researchers' monitor: the sender's game (the receiver faces away from it) */}
      <rect x={MON.x + 200} y={MON.y + 300} width={80} height={60} fill="#56636E" stroke={INK} strokeWidth={5} />
      <rect x={MON.x - 20} y={MON.y - 20} width={640 * MON.s + 40} height={400 * MON.s + 40} rx={18} fill="#2A3B47" stroke={INK} strokeWidth={6} />
      <g clipPath={`url(#${id}-mon)`}>
        <g transform={`translate(${MON.x} ${MON.y}) scale(${MON.s})`}>
          <GameScreenDE t={g.clock} events={g.events} cityHitAt={g.cityHitAt} cursor={g.cursor > 0.001 ? g.cursor : undefined} aimLead={0.12} idp={`${id}-g`} />
        </g>
      </g>
      <rect x={MON.x} y={MON.y} width={640 * MON.s} height={400 * MON.s} rx={6} fill="none" stroke={INK} strokeWidth={4} />
      {g.cityHitAt !== undefined && g.clock - g.cityHitAt < 0.9 && (
        <rect x={MON.x - 26} y={MON.y - 26} width={640 * MON.s + 52} height={400 * MON.s + 52} rx={22} fill="none" stroke={K.coral} strokeWidth={14} opacity={1 - (g.clock - g.cityHitAt) / 0.9} />
      )}
      {/* the network cable along the ceiling and down into the TMS machine (or to the dangling plug) */}
      <path d={netD} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d={netD} fill="none" stroke="#3D4852" strokeWidth={13} strokeLinecap="round" />
      {pkPt && <rect x={fmt(pkPt.x - 34)} y={fmt(pkPt.y - 26)} width={68} height={52} rx={12} fill={K.saffron} stroke={INK} strokeWidth={6} />}
      {/* the TMS chair */}
      <rect x={RCV.x - 300} y={470} width={600} height={700} rx={70} fill="#38434D" stroke={INK} strokeWidth={7} />
      <rect x={RCV.x - 270} y={492} width={540} height={44} rx={22} fill="#4A5661" />
      <rect x={RCV.x - 150} y={520} width={300} height={74} rx={36} fill="#46525C" stroke={INK} strokeWidth={7} />
      <Person3 id={`${id}-rc`} look={S.look} f={f} x={RCV.x} y={RCV.y} scale={RCV.s} seed={21 + S.i} perf={S.perf} gear={<Headphones />} life={0.4}
        desk={<g>
          <Desk id={`${id}-desk`} x0={360} x1={1240} y={840} d={130} h={320} top="#8C735D" face="#6E5A49" />
          <TouchPad14 id={`${id}-pad`} press={S.press} />
          {S.zeroK > 0.001 && <Tag x={600} y={950} text="0 presses" size={92} k={S.zeroK} />}
        </g>} />
      {/* the stimulated patch under the coil (only when the active face looks into the head) */}
      {active && e > 0.001 && <ellipse cx={SCALP.x} cy={SCALP.y} rx={90} ry={60} fill={`url(#${id}-gl)`} opacity={0.85 * e} />}
      {/* the stand, its arm and the coil; the coil's cable to the machine */}
      <path d={coilD} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <path d={coilD} fill="none" stroke={cableHot ? K.saffron : '#2D363D'} strokeWidth={8} strokeLinecap="round" />
      <CoilArm base={{x: 1420, y: 1100}} j1={{x: 1420, y: 150}} j2={{x: 1255, y: 128}} end={ARM_END} />
      <Coil14 flip={S.flip} pulse={e} axisK={S.axisK} />
      {/* the TMS machine on its cart, the network port on top */}
      <rect x={BOXP.x + 20} y={BOXP.y + 190} width={260} height={24} rx={8} fill="#46525C" stroke={INK} strokeWidth={6} />
      <rect x={BOXP.x + 40} y={BOXP.y + 200} width={20} height={300} fill="#3A454F" stroke={INK} strokeWidth={5} />
      <rect x={BOXP.x + 240} y={BOXP.y + 200} width={20} height={300} fill="#3A454F" stroke={INK} strokeWidth={5} />
      <rect x={BOXP.x + 20} y={BOXP.y + 380} width={260} height={20} rx={8} fill="#46525C" stroke={INK} strokeWidth={5} />
      <g transform={`translate(${BOXP.x} ${BOXP.y}) scale(${BOXS}) translate(${-BOXP.x} ${-BOXP.y})`}>
        <TmsBox x={BOXP.x} y={BOXP.y} lv={e > 0 ? 1 : 0} />
        <circle cx={BOXP.x + 206} cy={BOXP.y + 44} r={9} fill={mix('#3A454F', '#5BE37D', S.power)} stroke={INK} strokeWidth={3} />
      </g>
      <rect x={PORT.x - 30} y={PORT.y - 14} width={60} height={18} rx={5} fill="#2D363D" stroke={INK} strokeWidth={4} />
      <g transform={`rotate(${fmt(pl.ang)} ${fmt(pl.j.x)} ${fmt(pl.j.y)})`}>
        <Plug x={pl.j.x} y={pl.j.y + PLUG_JOIN * PLS} s={PLS} />
      </g>
      {R && <Person3 id={`${id}-res`} look={RESEARCHER} f={f} x={R.x} y={RES.y} scale={RES.s} seed={41} perf={R.perf} life={0.35} shadow />}
      {S.lights < 0.999 && <rect x={-20} y={-20} width={RWE + 40} height={RHE + 40} fill="#0E141A" opacity={0.8 * (1 - S.lights)} />}
    </g>
  );
};

// ---------------------------------------------------------------- sender room (local)
const sPerf = (i: number, t: number): Perf => {
  const g = gameAt(i, t);
  let wince = 0, smile = 0;
  for (const e of g.events) {
    if (e.fire === undefined) wince = Math.max(wince, bump(g.clock, e.t0 + e.dur, e.t0 + e.dur + 1.0, 0.15, 0.5));
    else smile = Math.max(smile, bump(g.clock, e.fire + 0.3, e.fire + 1.1, 0.2, 0.4));
  }
  const conc = clamp(g.cursor * 3);
  return {
    pose: {lookX: -0.8, lookY: 0.2, brows: -0.4 * conc + 0.5 * wince + 0.2 * smile, mouth: wince > 0.3 ? 'o' : smile > 0.3 ? 'grin' : conc > 0.3 ? 'hmm' : 'smile', lean: -1.5 * conc + 2.5 * wince, tilt: -2 * conc + 4 * wince},
    hl: {x: 1110, y: 792 - 30 * wince},
    hr: {x: 1490, y: 792 - 30 * wince},
    sl: {curl: 0.25, spread: 0.35 + 0.4 * wince},
    sr: {curl: 0.25, spread: 0.35 + 0.4 * wince},
  };
};
const S_ROUTE: Pt[] = [{x: STOWER.x + 60, y: STOWER.y - 240}, {x: STOWER.x + 110, y: CEIL + 60}, {x: STOWER.x + 200, y: CEIL}, {x: RWE + 60, y: CEIL}];
const SendRoom: React.FC<{f: number; i: number; id: string; lights: number}> = ({f, i, id, lights}) => {
  const t = f / FPS;
  const g = gameAt(i, t);
  const p = sPerf(i, t);
  const cab = `M${P_(S_ROUTE[0].x, S_ROUTE[0].y)} C${P_(S_ROUTE[1].x, S_ROUTE[1].y + 200)} ${P_(S_ROUTE[1].x, S_ROUTE[1].y)} ${P_(S_ROUTE[2].x, S_ROUTE[2].y)} L${P_(S_ROUTE[3].x, S_ROUTE[3].y)}`;
  const pu = pulsesOf(i).map((q) => (t - (q - 1.25)) / 0.4).find((u) => u >= 0 && u <= 1);
  const pkPt = pu === undefined ? null : (() => {
    const pts = S_ROUTE;
    const L = pts.slice(1).map((q, k) => Math.hypot(q.x - pts[k].x, q.y - pts[k].y));
    let d = easeIn(pu) * L.reduce((a, b) => a + b, 0);
    for (let k = 0; k < L.length; k++) {
      if (d <= L[k]) return {x: lerp(pts[k].x, pts[k + 1].x, d / L[k]), y: lerp(pts[k].y, pts[k + 1].y, d / L[k])};
      d -= L[k];
    }
    return pts[pts.length - 1];
  })();
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit('#CFE0EC', 0.25)} />
          <stop offset="1" stopColor="#CFE0EC" />
        </linearGradient>
      </defs>
      <rect x={-20} y={-20} width={RWE + 40} height={RHE + 40} fill={`url(#${id}-w)`} />
      <rect x={-20} y={600} width={RWE + 40} height={34} fill="#B5C9D8" />
      <rect x={160} y={160} width={250} height={190} rx={10} fill="#FFFFFF" stroke={INK} strokeWidth={7} />
      <path d="M190,310 L240,262 L280,290 L370,215" fill="none" stroke={K.blue} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      {/* the network cable: tower -> up the wall -> along the ceiling -> out through the right wall */}
      <path d={cab} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d={cab} fill="none" stroke="#3D4852" strokeWidth={13} strokeLinecap="round" />
      {pkPt && <rect x={fmt(pkPt.x - 34)} y={fmt(pkPt.y - 26)} width={68} height={52} rx={12} fill={K.saffron} stroke={INK} strokeWidth={6} />}
      <Person3 id={`${id}-sc`} look={LOOKS_S[i]} f={f} x={SND.x} y={SND.y} scale={SND.s} seed={31 + i} perf={p} gear={<EEGCap glow={g.cursor > 0.05 ? 0.8 : 0} />} life={0.45}
        behind={<rect x={SND.x - 330} y={500} width={660} height={700} rx={90} fill="#4A5866" stroke={INK} strokeWidth={7} />}
        desk={<g>
          <Desk id={`${id}-desk`} x0={-40} x1={RWE + 40} y={850} d={150} h={320} />
          <Monitor id={`${id}-mon`} x={SMON.x} y={SMON.y} s={SMON.s}>
            <GameScreenDE t={g.clock} events={g.events} cityHitAt={g.cityHitAt} cursor={g.cursor > 0.001 ? g.cursor : undefined} aimLead={0.12} idp={`${id}-g`} />
          </Monitor>
          <Computer x={STOWER.x} y={STOWER.y} s={STOWER.s} blink={g.cursor > 0.95 ? 1 : 0} color={K.saffron} />
        </g>} />
      {lights < 0.999 && <rect x={-20} y={-20} width={RWE + 40} height={RHE + 40} fill="#0E141A" opacity={0.8 * (1 - lights)} />}
    </g>
  );
};

// ---------------------------------------------------------------- tallies (under the researchers' monitor)
type Tally = {rk: number[]; rkHit: number[]; pl: number[]; plHit: number[]};
const TX = MON.x + 150, TRK = MON.y + 400 * MON.s + 70, TPL = TRK + 62;
const TallyRows: React.FC<{t: number; d: Tally; label: string; k: number}> = ({t, d, label, k}) =>
  k <= 0.001 ? null : (
    <g opacity={k}>
      <Tag x={MON.x + 52} y={TRK + 30} text={label} size={30} fill={lit(K.r14Sleeve, 0.45)} />
      {d.rk.map((tt, i) => {
        const a = clamp((t - tt) / 0.16);
        if (a <= 0) return null;
        const hit = d.rkHit.includes(i);
        const x = TX + i * 58, y = TRK;
        return (
          <g key={`r${i}`} opacity={a}>
            <RocketIcon x={x} y={y} s={0.68} op={hit ? 0.45 : 1} />
            {hit && <Burst x={x - 4} y={y} r={24} k={a} />}
            {!hit && <path d={`M${P_(x + 22, y - 18)} l14,-10 M${P_(x + 24, y - 4)} l18,0`} stroke={K.coral} strokeWidth={5} strokeLinecap="round" />}
          </g>
        );
      })}
      {d.pl.map((tt, i) => {
        const a = clamp((t - tt) / 0.16);
        if (a <= 0) return null;
        const hit = d.plHit.includes(i);
        const x = TX + i * 50, y = TPL;
        return (
          <g key={`p${i}`} opacity={a}>
            <PlaneIcon x={x} y={y} s={0.6} op={hit ? 0.55 : 1} />
            {hit && <RedX x={x} y={y} r={16} k={a} />}
          </g>
        );
      })}
    </g>
  );
const spread = (a: number, b: number, n: number) => Array.from({length: n}, (_, i) => (n === 1 ? a : lerp(a, b, i / (n - 1))));
const tallies = (M: TM): Tally[] => [
  {rk: [M.N.kill, ...spread(M.N.kill + 0.16, M.N.kill + 0.66, 5)], rkHit: [0, 1, 2, 4, 5], pl: [...spread(M.P.kill - 0.3, M.P.kill - 0.1, 2), M.P.kill, ...spread(M.P.kill + 0.08, M.P.kill + 0.42, 5)], plHit: [2, 4, 6]},
  {rk: [M.p2[0] + 1.1, M.p2hit.fire + 0.32, M.p2[2] + 1.1, M.p2[3] + 1.1], rkHit: [1], pl: [], plHit: []},
  {rk: [], rkHit: [], pl: [], plHit: []},
];
/** the friendly plane shot by mistake: a red X on the monitor */
const PlaneX: React.FC<{t: number}> = ({t}) => {
  const M = M_();
  const k = pr(t * FPS, M.P.kill, M.P.kill + 0.2, easeOut) * (1 - pr(t * FPS, M.P.kill + 1.0, M.P.kill + 1.3));
  if (k <= 0.001 || t < M.cutN || t > M.up1) return null;
  const e: GEvent = {kind: 'plane', t0: M.P.t0, dur: M.P.dur, fire: M.P.fire};
  const hp = arcPt(evState(e, t).uHit);
  return (
    <g transform={`translate(${MON.x} ${MON.y}) scale(${MON.s})`}>
      <RedX x={hp.x} y={hp.y} r={30} k={k} />
    </g>
  );
};

// ---------------------------------------------------------------- the building world
const RoomClip: React.FC<{id: string; ox: number; oy: number; children: React.ReactNode}> = ({id, ox, oy, children}) => (
  <g transform={`translate(${ox} ${oy})`}>
    <defs>
      <clipPath id={`${id}-c`}>
        <rect x={0} y={0} width={RWE} height={RHE} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id}-c)`}>{children}</g>
  </g>
);
const BRICK = '#B9705A';
const Building: React.FC<{x0: number}> = ({x0}) => (
  <g>
    <rect x={x0 - 70} y={-SLAB - 40} width={70} height={3 * FLOOR + 60} fill={BRICK} stroke={INK} strokeWidth={8} />
    <rect x={x0 + RWE} y={-SLAB - 40} width={70} height={3 * FLOOR + 60} fill={BRICK} stroke={INK} strokeWidth={8} />
    {[0, 1, 2].map((n) => (
      <rect key={n} x={x0 - 70} y={n * FLOOR - SLAB} width={RWE + 140} height={SLAB} fill={n === 0 ? '#8E9AA4' : BRICK} stroke={INK} strokeWidth={8} />
    ))}
    <rect x={x0 - 100} y={-SLAB - 70} width={RWE + 200} height={40} rx={10} fill="#6F7E88" stroke={INK} strokeWidth={8} />
    <rect x={x0 - 70} y={3 * FLOOR - SLAB} width={RWE + 140} height={40} fill="#8E9AA4" stroke={INK} strokeWidth={8} />
  </g>
);
const visible = (c: CamS, x0: number, y0: number, w: number, h: number) => {
  const hw = 960 / c.z, hh = 540 / c.z;
  return x0 < c.x + hw && x0 + w > c.x - hw && y0 < c.y + hh && y0 + h > c.y - hh;
};
const World: React.FC<{f: number; cam: CamS}> = ({f, cam}) => {
  const t = f / FPS;
  const M = M_();
  const T3 = tallies(M);
  const far = cam.z < 0.9;
  return (
    <g>
      <defs>
        <linearGradient id="ve-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={K.skyDeep} />
          <stop offset="1" stopColor={K.sky} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="#1C2630" />
      <Cam x={cam.x} y={cam.y} z={cam.z}>
        {far && (
          <g>
            <rect x={-12000} y={-8000} width={24000} height={8000 + 3 * FLOOR} fill="url(#ve-sky)" />
            <rect x={-12000} y={3 * FLOOR - SLAB + 40} width={24000} height={6000} fill={K.grass} />
            <rect x={-12000} y={3 * FLOOR - SLAB + 40} width={24000} height={60} fill={K.grassDeep} />
          </g>
        )}
        <Building x0={SX} />
        <Building x0={0} />
        {[0, 1, 2].map((i) => {
          const oy = rY(i);
          const S = rState(i, t);
          const cab = `M${-GAP - 40},${oy + CEIL} C${-GAP / 2 - 100},${oy + CEIL + 120} ${-GAP / 2 + 100},${oy + CEIL + 120} 40,${oy + CEIL}`;
          const pk = S.pulses.map((p) => (t - (p - 0.85)) / 0.36).find((u) => u >= 0 && u <= 1);
          return (
            <g key={i}>
              {visible(cam, SX, oy, RWE, RHE) && (
                <RoomClip id={`ve-s${i}`} ox={SX} oy={oy}>
                  <SendRoom f={f} i={i} id={`ve-s${i}`} lights={S.lights} />
                </RoomClip>
              )}
              {visible(cam, 0, oy, RWE, RHE) && (
                <RoomClip id={`ve-r${i}`} ox={0} oy={oy}>
                  <RecvRoom f={f} S={S} id={`ve-r${i}`} />
                  {S.tally > 0 && <TallyRows t={t} d={T3[i]} label={`Pair ${i + 1}`} k={S.tally} />}
                  {i === 0 && <PlaneX t={t} />}
                  {i === 0 && t > M.tc - 0.4 && t < M.flipIn + 0.6 && <Tag x={MON.x + 240} y={MON.y - 18} text="Sender's game" size={30} k={pr(f, M.tc - 0.3, M.tc) * (1 - pr(f, M.flipIn, M.flipIn + 0.4))} />}
                </RoomClip>
              )}
              {far && (
                <g>
                  <path d={cab} fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" />
                  <path d={cab} fill="none" stroke="#3D4852" strokeWidth={15} strokeLinecap="round" />
                  {pk !== undefined && (() => {
                    const u = easeInOut(pk);
                    const x = lerp(-GAP - 40, 40, u), y = oy + CEIL + 90 * Math.sin(u * Math.PI);
                    return <rect x={fmt(x - 40)} y={fmt(y - 30)} width={80} height={60} rx={14} fill={K.saffron} stroke={INK} strokeWidth={7} />;
                  })()}
                  <Tag x={-GAP / 2} y={oy + 560} text={`Pair ${i + 1}`} size={140} fill={lit(LOOKS_R[i].shirt, 0.35)} k={pr(f, M.pops[i] - 0.05, M.pops[i] + 0.25)} />
                </g>
              )}
            </g>
          );
        })}
      </Cam>
    </g>
  );
};

// ---------------------------------------------------------------- cameras
const camE0 = (): CamS => {
  // the 2014 machine on the same screen rect as Stocco's 2013 machine on D's last frame
  const cD = D_END.cam();
  const bs = toScr(cD, {x: D_END.box.x, y: D_END.box.y});
  const z = (cD.z * D_END.box.w) / (230 * BOXS);
  const bw = {x: BOXP.x, y: BOXP.y + rY(0)};
  return {x: bw.x - (bs.x - 960) / z, y: bw.y - (bs.y - 540) / z, z};
};
const camE = (t: number): CamS => {
  const M = M_();
  const c0 = camE0();
  const box = {x: BOXP.x + 150, y: BOXP.y + 100 + rY(0)};
  if (t < M.wide1) {
    const v = clamp((t - (M.s + 0.2)) / (M.wide1 - M.s - 0.2));
    const u = v * v * v * (v * (v * 6 - 15) + 10); // smootherstep: nearly still while the plug is seated, then a long glide
    return anchorCam(box, toScr(c0, box), toScr(WIDE, box), c0.z, WIDE.z, u);
  }
  const wd: CamS = {...WIDE, z: WIDE.z * 1.015};
  if (t < M.push0) return {...WIDE, z: WIDE.z * lerp(1, 1.015, easeInOut(clamp((t - M.wide1) / (M.push0 - M.wide1))))};
  const tc = tcCam(0);
  const tcP = {x: tc.x, y: tc.y};
  if (t < M.tc) return anchorCam(tcP, toScr(wd, tcP), {x: 960, y: 540}, wd.z, tc.z, easeInOut(clamp((t - M.push0) / (M.tc - M.push0))));
  if (t < M.flipIn) return {...tc, z: tc.z * lerp(1, 1.04, easeInOut(clamp((t - M.tc) / (M.flipIn - M.tc))))};
  const cc = {x: COILC.x, y: COILC.y + rY(0)};
  const tc2: CamS = {...tc, z: tc.z * 1.04};
  const u = easeInOut(clamp((t - M.flipIn) / 0.9));
  const c = anchorCam(cc, toScr(tc2, cc), {x: 960, y: 540}, tc2.z, COILC.z, u);
  return {...c, z: c.z * (1 + 0.03 * easeInOut(clamp((t - M.flipIn - 0.9) / (M.ab0 - M.flipIn - 0.9))))};
};
const camAfter = (t: number): CamS => {
  const M = M_();
  if (t < M.up0) return tcCam(0, drift(t - M.N.t0));
  if (t < M.up1) {
    const u = easeInOut(clamp((t - M.up0) / (M.up1 - M.up0)));
    const a = tcCam(0, drift(M.up0 - M.N.t0)), b = tcCam(1);
    return {x: a.x, y: lerp(a.y, b.y, u), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), u))};
  }
  if (t < M.dn0) return tcCam(1, 1 + 0.015 * easeInOut(clamp((t - M.up1) / (M.dn0 - M.up1))));
  if (t < M.F.t0) {
    const u = easeInOut(clamp((t - M.dn0) / (M.F.t0 - M.dn0)));
    const a = tcCam(1, 1.015), b = tcCam(0);
    return {x: a.x, y: lerp(a.y, b.y, u), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), u))};
  }
  if (t < M.out2) return tcCam(0, drift(t - M.F.t0));
  const tcF = tcCam(0, drift(M.out2 - M.F.t0));
  const anchor = {x: TCC.x, y: TCC.y + rY(0)};
  if (t < M.wide2) return anchorCam(anchor, {x: 960, y: 540}, toScr(WIDE, anchor), tcF.z, WIDE.z, easeInOut(clamp((t - M.out2) / (M.wide2 - M.out2))));
  const wd: CamS = {...WIDE, z: WIDE.z * 1.02};
  if (t < M.push) return {...WIDE, z: WIDE.z * lerp(1, 1.02, easeInOut(clamp((t - M.wide2) / (M.push - M.wide2))))};
  const pad = {x: PADR.x + PADR.w / 2, y: PADR.y + PADR.h / 2 + rY(0)};
  const zEnd = (PAD_RECT.x1 - PAD_RECT.x0) / PADR.w;
  const sEnd = {x: (PAD_RECT.x0 + PAD_RECT.x1) / 2, y: (PAD_RECT.y0 + PAD_RECT.y1) / 2};
  const u = easeInOut(clamp((t - M.push) / (M.last - M.push)));
  return anchorCam(pad, toScr(wd, pad), sEnd, wd.z, zEnd, u);
};

// ---------------------------------------------------------------- AB: coil in position (top) | coil flipped (bottom)
const AB_REG = {x: 880, y: 380, w: 1640};
const PANEL = {w: 1082, h: 409};
const P_TOP = {x: 960 - PANEL.w / 2, y: 22};
const P_BOT = {x: 960 - PANEL.w / 2, y: 449};
type Rect = {x: number; y: number; w: number; h: number};
const PanelView: React.FC<{id: string; f: number; S: RS; rect: Rect; cam: CamS; border: number}> = ({id, f, S, rect, cam, border}) => (
  <g>
    <defs>
      <clipPath id={`${id}-c`}>
        <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={28 * border} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id}-c)`}>
      <g transform={`translate(${fmt(rect.x + rect.w / 2)} ${fmt(rect.y + rect.h / 2)}) scale(${fmt(cam.z)}) translate(${fmt(-cam.x)} ${fmt(-cam.y)})`}>
        <rect x={-400} y={-400} width={RWE + 800} height={RHE + 800} fill="#1C2630" />
        <RecvRoom f={f} S={S} id={id} />
      </g>
    </g>
    {border > 0.001 && <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={28} fill="none" stroke={INK} strokeWidth={8} opacity={border} />}
  </g>
);
const lerpRect = (a: Rect, b: Rect, u: number): Rect => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u)});
const FULL: Rect = {x: 0, y: 0, w: 1920, h: 1080};
const AB: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const M = M_();
  const form = easeInOut(clamp((t - M.ab0) / (M.ab1 - M.ab0)));
  const open = easeInOut(clamp((t - M.wipe0) / (M.cutN - 1 / FPS - M.wipe0)));
  const zP = PANEL.w / AB_REG.w;
  // the flipped room (pair 1, live): from the full-frame flip close-up into the lower panel, then down and out
  const cF = camE(M.ab0);
  const camInB: CamS = {x: lerp(cF.x, AB_REG.x, form), y: lerp(cF.y - rY(0), AB_REG.y, form), z: Math.exp(lerp(Math.log(cF.z), Math.log(zP), form))};
  const rB0 = lerpRect(FULL, {...P_BOT, ...PANEL}, form);
  const rB = {...rB0, y: rB0.y + 700 * easeIn(open)};
  // the in-position twin: slides down into the upper panel, then opens to the full trial composition
  const rA0: Rect = {...P_TOP, ...PANEL, y: lerp(-PANEL.h - 30, P_TOP.y, form)};
  const rA = lerpRect(rA0, FULL, open);
  const tc = tcCam(0);
  const camInA: CamS = {x: lerp(AB_REG.x, tc.x, open), y: lerp(AB_REG.y, tc.y - rY(0), open), z: Math.exp(lerp(Math.log(zP), Math.log(tc.z), open))};
  const tagK = form * (1 - open);
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.paper} />
      <PanelView id="ve-abB" f={f} S={rState(0, t)} rect={rB} cam={camInB} border={form} />
      <PanelView id="ve-abA" f={f} S={rState(0, t, true)} rect={rA} cam={camInA} border={1 - open} />
      {tagK > 0.001 && (
        <g>
          <Tag x={rA.x - 14} y={rA.y + 52} text="Coil in position" size={32} fill={lit(K.saffron, 0.45)} anchor="end" k={tagK} />
          <Tag x={rB.x - 14} y={rB.y + 52} text="Coil flipped" size={32} fill="#D5DBE0" anchor="end" k={tagK} />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- the sequence
export const VE: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const M = M_();
  if (t < M.ab0) {
    const yearK = pr(f, M.seat - 0.1, M.seat + 0.2) * (1 - pr(f, M.push0, M.push0 + 0.3));
    return (
      <g>
        <World f={f} cam={camE(t)} />
        <Tag x={960} y={92} text="2014" size={56} k={yearK} />
      </g>
    );
  }
  if (t < M.cutN) return <AB f={f} />;
  return <World f={f} cam={camAfter(t)} />;
};

/** sound cues (gain in dB). coil_pulse has ONE gain everywhere: normal trials, the comparison and the flipped trial. */
export const CUES_VE = (): {t: number; kind: string; gain?: number; dur?: number}[] => {
  const M = M_();
  const PULSE = -4;
  const cues: {t: number; kind: string; gain?: number; dur?: number}[] = [
    {t: M.seat, kind: 'tick', gain: -5},
    {t: M.pops[1], kind: 'tick', gain: -16},
    {t: M.pops[2], kind: 'tick', gain: -16},
    // first trial (the apparatus)
    {t: M.e2.t0, kind: 'rocket_launch', gain: -12},
    {t: M.e2.pulse - 0.3, kind: 'packet_arrive', gain: -14},
    {t: M.e2.pulse, kind: 'coil_pulse', gain: PULSE},
    {t: M.e2.tap, kind: 'pad_click', gain: -3},
    {t: M.e2.fire, kind: 'cannon', gain: -9},
    {t: M.e2.kill, kind: 'boom', gain: -10},
    // the flip
    {t: M.fs, kind: 'rotate', gain: -9},
    // the comparison: the same click, both panels at once
    ...M.abP.map((p) => ({t: p, kind: 'coil_pulse', gain: PULSE})),
    // coil in position, pair 1
    {t: M.N.t0, kind: 'rocket_launch', gain: -10},
    {t: M.N.pulse, kind: 'coil_pulse', gain: PULSE},
    {t: M.N.tap, kind: 'pad_click', gain: -3},
    {t: M.N.fire, kind: 'cannon', gain: -7},
    {t: M.N.kill, kind: 'boom', gain: -7},
    {t: M.P.t0, kind: 'plane_pass', gain: -14},
    {t: M.P.pulse, kind: 'coil_pulse', gain: PULSE},
    {t: M.P.tap, kind: 'pad_click', gain: -3},
    {t: M.P.fire, kind: 'cannon', gain: -8},
    {t: M.P.kill, kind: 'boom', gain: -9},
    // pair 2: four rockets, one hit
    {t: M.p2hit.pulse, kind: 'coil_pulse', gain: PULSE},
    {t: M.p2hit.tap, kind: 'pad_click', gain: -3},
    {t: M.p2hit.fire, kind: 'cannon', gain: -12},
    ...[0, 2, 3].map((n) => ({t: M.p2[n] + 1.1, kind: 'city_hit', gain: -15})),
    // coil flipped: the same launch, the same pulse at the same gain, no press, no cannon; the rocket hits
    {t: M.F.t0, kind: 'rocket_launch', gain: -10},
    {t: M.F.pulse, kind: 'coil_pulse', gain: PULSE},
    {t: M.F.arrive, kind: 'city_hit', gain: -4},
    // the control block across all three pairs, heard from the wide shot (quieter): every rocket reaches its city
    ...[0, 1, 2].map((i) => ({t: M.nob + 0.1 + i * 0.22, kind: 'tick', gain: -14})),
    ...[0, 1, 2].map((i) => ({t: wide2Rockets(i)[1].t0 + 1.05, kind: 'city_hit', gain: -13})),
  ];
  return cues.sort((a, b) => a.t - b.t);
};
