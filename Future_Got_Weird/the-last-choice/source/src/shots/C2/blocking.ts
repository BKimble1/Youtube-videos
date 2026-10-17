// Group C2 blocking: where every Crew member is, and in what pose, at film time T across the crossing (C9–C15).
// Shots draw these through CrossingScene slots, so positions and actions carry across the cuts. Each role is a list of
// phases (start time, slot, pose function); the sequencer crossfades consecutive phases through their solved joints.
import {ActorProps, solve, rolled} from '../../rig/actor';
import {look, dmg, CIV, Role, limpOf, radioOnStrap, visorOn} from '../../film/crew';
import {clamp, easeIn, easeInOut, easeOut, keys, lerp, ring, smooth, V2, V3} from '../../kit/math';
import {basketPoint, leverHandle, walkPoint} from '../../sets/city';
import {BEAT, CATWALK, DECK, LADDER_X, gantryAt, STATION_X, basketSwing, barrierAt, REBAR} from './world';
import {BARRIER_PIVOT} from '../../sets/city';
import {mover, climb, blend, ramp, path, JOG, HURRY, WALK, CARRY, SPRINT, G, unroll} from './pose';
import {surf, slopeAt, lipAt, normalOf, hangFrom, proneDown} from './fall';
import {Look} from '../../rig/looks';

export type Slot = 'deckBack' | 'walk' | 'deck' | 'landing' | 'basket' | 'catwalk' | 'front' | 'air';
export type Placed = {slot: Slot; p: ActorProps; key: string};
type Phase = {t: number; slot: Slot | ((T: number) => Slot); f: (T: number) => ActorProps; bl?: number};

const base = (r: Role, T: number, seed: number) => ({look: look(r), t: T, seed, dmg: dmg(r, T)});
const TOP = DECK;
const CW = CATWALK;

/** Run a role's phases at T: the active phase's pose, crossfaded from the previous one over `bl` seconds. */
const run = (T: number, key: string, list: Phase[]): Placed => {
  let i = 0;
  while (i + 1 < list.length && T >= list[i + 1].t) i++;
  const ph = list[i];
  const slot = typeof ph.slot === 'function' ? ph.slot(T) : ph.slot;
  let p = ph.f(T);
  const bl = ph.bl ?? 0.25;
  if (i > 0 && T < ph.t + bl) p = blend(list[i - 1].f(T), p, ramp(T, ph.t, ph.t + bl));
  return {slot, p, key};
};

// ------------------------------------------------------------------ shared pose pieces
/** The teammate beside a helper: right arm over the helper's shoulders (the helper on the teammate's right, nearer
 *  the camera when facing east), left arm held to the chest, the left leg trailing (it can't bear weight). */
export const supportedBy = (helper: ActorProps, T: number, over: Partial<ActorProps> = {}): ActorProps => {
  const r = solve(helper);
  const yaw = helper.yaw ?? 90;
  const dir = Math.sin((yaw * Math.PI) / 180) >= 0 ? 1 : -1;
  const x = helper.x - dir * 34;
  const y = helper.y;
  const hl = (helper.legL?.foot ?? {x, y: y - 10}) as V2;
  const nearSh = r.sh[1];
  const hz = (helper.z ?? 0) - 0.06;
  return {
    ...base('teammate', T, 21),
    x, y, z: hz, yaw: yaw - dir * 4, drop: (helper.drop ?? 0) + 18, lean: 10, side: -dir * 4,
    legR: {foot: {x: hl.x - dir * 18, y: hl.y}},
    legL: {foot: {x: x - dir * 70, y: y - 16}, pitch: -38},
    armR: {hand: {x: nearSh.x + dir * 6, y: nearSh.y - 6, z: nearSh.z + 8}},
    zArm: [undefined, 30], zHand: [undefined, 60 + 95],
    armL: {hand: {x: x + dir * 30, y: y - 300, z: 30}, pole: {x: 0, y: 1, z: -0.3}},
    handL: 'fist',
    face: {mouth: 'pant', brows: -0.3, worry: 0.8, lids: 0.3, lookX: dir * 0.4},
    head: {pitch: 8},
    satchel: {radio: radioOnStrap(T)}, breath: 0.9,
    ...over,
  };
};
/** The helper's left hand around the teammate's waist. */
const helperArm = (p: ActorProps, T: number): ActorProps => {
  const dir = Math.sin(((p.yaw ?? 90) * Math.PI) / 180) >= 0 ? 1 : -1;
  return {...p, armL: {hand: {x: p.x - dir * 40, y: p.y - 205 + 4 * Math.sin(T * 5), z: (p.z ?? 0) - 40}, pole: {x: 0, y: 0.5, z: -1}}, zArm: [-60, p.zArm?.[1]]};
};
/** Standing in the basket at basket-local lx (riders lean against the swing; front-row riders hold the front rail). */
const rider = (lk: Look, T: number, lx: number, z: number, over: Partial<ActorProps> & {seed: number; hold?: boolean; s?: number}): ActorProps => {
  const st = gantryAt(T);
  const s = over.s ?? 1;
  const f = basketPoint(st, lx, 0);
  const fl = basketPoint(st, lx + 38 * s, 0), fr = basketPoint(st, lx - 40 * s, 0);
  const sw = st.swing ?? 0;
  const rail = basketPoint(st, lx + 34, -238);
  const hold = over.hold ?? z > 0;
  return {
    look: lk, t: T, x: f.x, y: f.y, z, yaw: 74, lean: 2 + sw * 0.5, side: -sw * 0.3, drop: 8,
    legL: {foot: {x: fl.x, y: fl.y - 10 * s}}, legR: {foot: {x: fr.x, y: fr.y - 10 * s}},
    ...(hold ? {armL: {hand: {x: rail.x + 10, y: rail.y, z: -20}}, armR: {hand: {x: rail.x - 20, y: rail.y + 4, z: 30}}, handL: 'fist' as const, handR: 'fist' as const} : {}),
    ...over,
  };
};
const bx = (lx: number) => basketPoint({u: 0, swing: 0}, lx, 0).x; // basket-local → world x while parked
/** Walking inside the moving basket: a gait in basket-local x, mapped onto the swinging floor. */
const basketMover = (lk: Look, T: number, k: [number, number, ((u: number) => number)?][], z: number, g: G, over: Partial<ActorProps> & {t: number; seed: number}): ActorProps => {
  const st = gantryAt(T);
  const p = mover(lk, T, k, g, 0, over);
  const f = basketPoint(st, p.x, 0);
  const map = (q: V2 | V3 | undefined) => (q ? basketPoint(st, q.x, q.y) : undefined);
  return {...p, x: f.x, y: f.y, z, lean: (p.lean ?? 0) + (st.swing ?? 0) * 0.4,
    legL: {...p.legL, foot: map(p.legL?.foot as V2)}, legR: {...p.legR, foot: map(p.legR?.foot as V2)}};
};
/** Step out of the docked basket (basket-local lx) onto the landing, ending at xEnd. */
const exitTo = (lk: Look, T: number, lx: number, t0: number, t1: number, xEnd: number, z: number, g: G, over: Partial<ActorProps> & {t: number; seed: number}): ActorProps =>
  ({...mover(lk, T, [[t0, 12120 + lx], [t1, xEnd, easeOut]], g, TOP, {yaw: 74, ...over}), z});
/** The blast's shock through everyone on the landing: a duck with an arm up, recovering. */
const flinch = (p: ActorProps, T: number, k = 1): ActorProps => {
  const a = ramp(T, BEAT.blast, BEAT.blast + 0.12) * (1 - ramp(T, BEAT.blast + 0.55, BEAT.blast + 1.1)) * k;
  if (a <= 0) return p;
  const r = solve(p);
  return {...p, drop: (p.drop ?? 0) + 60 * a, lean: (p.lean ?? 0) + 22 * a,
    armR: {hand: {x: lerp(r.wr[1].x, r.headC.x - 30, a), y: lerp(r.wr[1].y, r.headC.y - 20, a), z: r.headC.z + 40}},
    face: {...(p.face ?? {}), mouth: 'grit', brows: -0.9, squint: 0.8 * a}};
};
/** Standing on the walkway/slope surface at x (feet on the surface). */
const onWalk = (T: number) => (x: number) => surf(T, x).y;

/** The rebar: lying on the landing, carried, then wedged between the deck and the barrier arm. */
export const rebarAt = (T: number): {a: V2; b: V2} => {
  const lie = {a: REBAR.lie[0], b: REBAR.lie[1]};
  if (T < PICK) return lie;
  const ang = (barrierAt(T) * Math.PI) / 180;
  const arm = {x: BARRIER_PIVOT.x - Math.sin(ang) * REBAR.armDist, y: BARRIER_PIVOT.y - Math.cos(ang) * REBAR.armDist};
  const wedged = {a: REBAR.foot, b: {x: arm.x - 4, y: arm.y + 10}};
  if (T >= BEAT.jam) return wedged;
  // carried: swung up from the deck into the wedge position
  const u = ramp(T, PICK, BEAT.jam);
  const mid = {x: lerp((lie.a.x + lie.b.x) / 2, (wedged.a.x + wedged.b.x) / 2, u), y: lerp(DECK - 40, (wedged.a.y + wedged.b.y) / 2, u)};
  const a0 = Math.atan2(lie.b.y - lie.a.y, lie.b.x - lie.a.x), a1 = Math.atan2(wedged.b.y - wedged.a.y, wedged.b.x - wedged.a.x);
  const s0 = a0 + Math.PI, s1 = a1 < s0 - Math.PI ? a1 + Math.PI * 2 : a1;
  const L = 590, an = lerp(s0, s1, u);
  return {a: {x: mid.x - Math.cos(an) * L / 2, y: mid.y - Math.sin(an) * L / 2}, b: {x: mid.x + Math.cos(an) * L / 2, y: mid.y + Math.sin(an) * L / 2}};
};
export const LEAP = [98.55, 99.05] as const;
const PICK = 99.32;

// ================================================================== FRIEND
const F_CLIMB = [BEAT.sprint + 0.48, BEAT.sprint + 1.1] as const;     // 89.19 → 89.81
export const LET_GO = BEAT.blast - 0.63;                               // 104.62
/** The friend working the lever: west of the box, stepping back as the handle comes down, hands on the handle. */
export const leverPose = (T: number, over: Partial<ActorProps> = {}): ActorProps => {
  const lever = gantryAt(T).lever ?? -30;
  const h = leverHandle(lever);
  const pull = clamp((-lever - 30) / 74);
  const k = smooth(clamp(pull * 1.3));
  // reaching up for the handle at rest (facing the box), then turned to the camera with the handle at the left side
  const x = lerp(10214, 10078, k);
  const reach = ramp(T, BEAT.grab - 0.55, BEAT.grab);
  const along = (a: number, dz: number): V3 => ({x: lerp(h.x, 10380, a), y: lerp(h.y, -1890, a) + 2, z: dz});
  const idle = {x: x + 30, y: DECK - 230};
  const hl = along(0.0, -30), hr = along(0.18, -6);
  const strain = clamp(pull * 1.3);
  const yaw = lerp(74, 30, k);
  return {
    ...base('friend', T, 11), visor: visorOn(T),
    x, y: DECK, z: -0.4, yaw, lean: lerp(6, 4, pull) + 2 * Math.sin(T * 3), drop: lerp(-6, 18, pull), side: lerp(0, 8, k), twist: lerp(0, -14, k),
    legL: {foot: {x: x + lerp(50, 62, k), y: DECK - 10, z: lerp(-10, -20, k)}}, legR: {foot: {x: x - lerp(52, 40, k), y: DECK - 8, z: lerp(34, 30, k)}, pitch: 8},
    armL: {hand: {x: lerp(idle.x, hl.x, reach), y: lerp(idle.y, hl.y, reach), z: hl.z}, pole: {x: 0.5, y: 1, z: -0.3}},
    armR: {hand: {x: lerp(idle.x - 10, hr.x, reach), y: lerp(idle.y + 30, hr.y, reach), z: hr.z}, pole: {x: -0.2, y: 1, z: 0.8}},
    handL: reach > 0.8 ? 'fist' : 'mitt', handR: reach > 0.8 ? 'fist' : 'mitt',
    head: {pitch: lerp(-14, 4, pull), yaw: lerp(0, 22, k)},
    face: {mouth: strain > 0.6 ? 'grit' : 'pant', brows: -0.5 - 0.3 * strain, lookY: lerp(-0.4, 0.1, pull), lookX: 0.4},
    breath: 0.7,
    ...over,
  };
};
/** The refusal (C10): look to the Director, one head shake, a nod toward the basket — go. */
const refusal = (T: number): ActorProps => {
  const look2 = ramp(T, D_REACH - 0.25, D_REACH + 0.1) * (1 - ramp(T, NOD + 0.45, NOD + 0.75));
  const shake = T > SHAKE && T < SHAKE + 0.55 ? Math.sin(((T - SHAKE) / 0.55) * Math.PI * 2) * 24 * Math.sin(((T - SHAKE) / 0.55) * Math.PI) : 0;
  const nod = T > NOD && T < NOD + 0.45 ? Math.sin(((T - NOD) / 0.45) * Math.PI) : 0;
  const p = leverPose(T);
  return {
    ...p,
    head: {yaw: 22 - 46 * look2 + shake - 20 * nod, pitch: 2 + 16 * nod, roll: -6 * nod},
    twist: -14 - 6 * look2,
    face: {mouth: T > NOD ? 'soft' : 'flat', brows: T > SHAKE ? -0.2 : -0.6, worry: T > NOD ? 0.3 : 0, lookX: 0.9 * look2},
  };
};
export const friendAt = (T: number): Placed => {
  const b = {...base('friend', T, 11), visor: visorOn(T)};
  return run(T, 'friend', [
    {t: -1e9, slot: 'catwalk', f: (T) => {
      const p = mover(look('friend'), T, [[86.0, 8640], [BEAT.sprint, 9520], [F_CLIMB[0] - 0.02, LADDER_X - 25, easeOut]], {...JOG, stride: 190}, CW, {...b, t: T, yaw: 76, face: {mouth: 'pant', brows: -0.5, lookX: 0.6}});
      return T > BEAT.sprint ? {...p, lean: 16} : p;
    }},
    {t: F_CLIMB[0], slot: 'catwalk', bl: 0.12, f: (T) => climb(look('friend'), LADDER_X, CW, TOP, ramp(T, F_CLIMB[0], F_CLIMB[1]), {...b, t: T})},
    {t: F_CLIMB[1] + 0.05, slot: 'deck', bl: 0.25, f: (T) => ({...mover(look('friend'), T, [[F_CLIMB[1] + 0.05, LADDER_X], [F_CLIMB[1] + 0.62, 10222, easeOut]], HURRY, TOP, {...b, t: T, yaw: 78, face: {mouth: 'pant', brows: -0.4}}), z: -0.4})},
    {t: F_CLIMB[1] + 0.55, slot: 'deck', bl: 0.4, f: (T) => leverPose(T)},
    {t: D_REACH - 0.3, slot: 'deck', bl: 0.2, f: refusal},
    {t: NOD + 0.8, slot: 'deck', bl: 0.3, f: (T) => leverPose(T, {head: {yaw: 6 * Math.sin(T * 2), pitch: -2}, face: {mouth: 'grit', brows: -0.7, lookX: 0.4}})},
    {t: LET_GO, slot: (T) => friendFall(T).slot, bl: 0.14, f: (T) => friendFall(T).p},
  ]);
};

// ================================================================== DIRECTOR
const D_CLIMB = [BEAT.sprint + 1.06, BEAT.sprint + 1.68] as const;   // 89.77 → 90.39
const HOIST = [BEAT.grab - 0.55, BEAT.grab + 0.45] as const;         // 90.80 → 91.80
const CA_CLIMB = [91.9, 92.55] as const;
const HANDOFF = 93.0;
const D_TO_F = [HANDOFF + 0.08, HANDOFF + 0.6] as const;             // 93.08 → 93.6
const D_REACH = 93.68;
const SHAKE = 94.0;
const NOD = 94.7;
const D_GO = 95.38;
export const D_BOARD = 96.28;
const hoistHands = (T: number) => {
  const c = ramp(T, HOIST[0], HOIST[1]);
  const y = lerp(CW - 420, TOP - 300, easeInOut(c));
  return {L: {x: LADDER_X - 34, y: y + 40}, R: {x: LADDER_X + 40, y: y + 40}};
};
export const directorAt = (T: number): Placed => {
  const b = base('director', T, 31);
  const DX = LADDER_X + 96;
  const kneel = (T: number): ActorProps => {
    const hh = hoistHands(T);
    const c = ramp(T, HOIST[0], HOIST[1]);
    return {
      ...b, t: T, x: DX, y: TOP, z: 0.3, yaw: -48, drop: lerp(118, 80, c), lean: lerp(36, -4, c),
      legL: {foot: {x: DX - 40, y: TOP - 10, z: 40}, pole: {x: -0.5, y: 0, z: 1}}, legR: {foot: {x: DX + 80, y: TOP - 8, z: -30}, pole: {x: -0.4, y: 0, z: 1}},
      armL: {hand: {x: hh.L.x, y: hh.L.y, z: 60}}, armR: {hand: {x: hh.R.x, y: hh.R.y, z: 70}},
      head: {pitch: lerp(30, 6, c)}, face: {mouth: T > HOIST[0] ? 'grit' : 'pant', brows: -0.7, lookY: lerp(0.8, 0.1, c), lookX: -0.4},
    };
  };
  // walking the teammate east (in front of the operator) until the carrier takes over
  const holdTm = (T: number): ActorProps => helperArm(mover(look('director'), T, [[HOIST[1] + 0.45, DX + 10], [HANDOFF, 10390, easeOut]], {...WALK, stride: 110}, TOP,
    {...b, t: T, yaw: 72, z: 0.36, face: {mouth: 'pant', brows: -0.5, lookX: -0.4}, head: {yaw: 20}}), T);
  const toF = (T: number) => ({...mover(look('director'), T, [[D_TO_F[0], 10390], [D_TO_F[1], 10372, easeOut]], WALK, TOP, {...b, t: T, yaw: -70, face: {mouth: 'flat', brows: -0.6, worry: 0.4}}), z: lerp(0.36, 0.6, ramp(T, D_TO_F[0], D_TO_F[1]))});
  const reach = (T: number): ActorProps => {
    const h = leverHandle(gantryAt(T).lever ?? -46);
    const r = ramp(T, D_REACH, D_REACH + 0.35) * (1 - ramp(T, SHAKE + 0.5, SHAKE + 0.8));
    const x = 10372;
    return {
      ...b, t: T, x, y: TOP, z: 0.6, yaw: -58, lean: 8 * r, drop: 10,
      legL: {foot: {x: x - 40, y: TOP - 10, z: 10}}, legR: {foot: {x: x + 50, y: TOP - 10, z: -10}},
      armR: {hand: {x: lerp(x - 40, h.x + 12, r), y: lerp(TOP - 200, h.y + 30, r), z: 40}},
      armL: {hand: {x: x - 30, y: TOP - 205, z: 30}},
      head: {yaw: -10, pitch: -4},
      face: {mouth: T > SHAKE + 0.3 ? 'sad' : 'flat', brows: T > SHAKE ? 0.2 : -0.4, worry: T > SHAKE ? 0.9 : 0.5, lookX: -0.7},
    };
  };
  const go = (T: number) => mover(look('director'), T, [[D_GO, 10372], [D_BOARD, bx(-300), (u) => u * u * (1.5 - 0.5 * u)]], {...JOG, stride: 180}, TOP, {...b, t: T, yaw: 76, z: 0.6, face: {mouth: 'grit', brows: -0.7, lookX: -0.5}, head: {yaw: 25}});
  // through the moving basket to its east end (front row), then the leap to the landing and the jam
  const through = (T: number) => basketMover(look('director'), T, [[D_BOARD, -300], [D_BOARD + 0.35, -260], [LEAP[0] - 0.05, 300, easeInOut]], 0.95, {...WALK, stride: 120}, {...b, t: T, seed: 31, yaw: 74, face: {mouth: 'grit', brows: -0.6, lookX: 0.6}});
  const leap = (T: number): ActorProps => {
    const u = ramp(T, LEAP[0], LEAP[1]);
    const p0 = basketPoint(gantryAt(LEAP[0]), 300, 0), p1 = {x: 12568, y: TOP};
    const x = lerp(p0.x, p1.x, u), y = lerp(p0.y, p1.y, u) - 4 * 230 * u * (1 - u);
    const tuck = Math.sin(Math.PI * u);
    return {...b, t: T, x, y, z: 0.95, yaw: 80, drop: 20 + 40 * tuck, lean: 18 + 10 * tuck,
      legL: {foot: {x: x + 70 * tuck, y: y - 10 - 120 * tuck}}, legR: {foot: {x: x - 50 - 30 * tuck, y: y - 10 - 60 * tuck}},
      armL: {hand: {x: x + 120, y: y - 380 + 40 * u}}, armR: {hand: {x: x + 90, y: y - 330}}, handL: 'open', handR: 'open',
      face: {mouth: 'grit', brows: -0.8}, head: {pitch: -6}};
  };
  const land = (T: number): ActorProps => {
    const k = ramp(T, LEAP[1], LEAP[1] + 0.3);
    const x = 12568;
    return {...b, t: T, x, y: TOP, z: 0.95, yaw: 80, drop: 90 * Math.sin(Math.PI * Math.min(1, k * 0.9 + 0.1)), lean: 26 - 14 * k,
      legL: {foot: {x: x + 60, y: TOP - 10}}, legR: {foot: {x: x - 70, y: TOP - 8}},
      armL: {hand: {x: x + 110, y: TOP - 120}}, armR: {hand: {x: x + 40, y: TOP - 170}}, face: {mouth: 'grit', brows: -0.7, lookX: 0.6}};
  };
  const jamPose = (T: number): ActorProps => {
    const r = rebarAt(T);
    const pick = 1 - ramp(T, PICK + 0.1, BEAT.jam - 0.15);
    const x = lerp(12700, 12610, ramp(T, PICK, BEAT.jam));
    const along = (u: number) => ({x: lerp(r.a.x, r.b.x, u), y: lerp(r.a.y, r.b.y, u)});
    const lo = T < BEAT.jam ? 0.35 : 0.42, hi = T < BEAT.jam ? 0.62 : 0.6;
    const h1 = along(lo), h2 = along(hi);
    return {...b, t: T, x, y: TOP, z: 0.95, yaw: -64, drop: 26 + 80 * pick, lean: 8 + 40 * pick,
      legL: {foot: {x: x - 70, y: TOP - 10}}, legR: {foot: {x: x + 66, y: TOP - 8}, pitch: 12},
      armL: {hand: {x: h1.x, y: h1.y, z: 20}}, armR: {hand: {x: h2.x, y: h2.y, z: 40}}, handL: 'fist', handR: 'fist',
      face: {mouth: 'grit', brows: -0.8, lookY: -0.4, lookX: -0.4}, head: {pitch: -14 * (1 - pick)}};
  };
  const waitDock = (T: number): ActorProps => {
    const r = rebarAt(T);
    const x = 12610;
    const back = ramp(T, 100.25, 100.7);
    const hold = {x: lerp(r.a.x, r.b.x, 0.5), y: lerp(r.a.y, r.b.y, 0.5)};
    return {...b, t: T, x, y: TOP, z: 0.95, yaw: -64, drop: 14, lean: 8,
      legL: {foot: {x: x - 50, y: TOP - 10}}, legR: {foot: {x: x + 60, y: TOP - 10}},
      armR: {hand: {x: hold.x, y: hold.y, z: 40}}, handR: 'fist',
      armL: {hand: {x: lerp(x - 40, x - 170, back), y: lerp(TOP - 200, TOP - 300, back), z: 10}}, handL: back > 0.5 ? 'open' : 'mitt',
      face: {mouth: 'pant', brows: -0.5, worry: 0.6, lookX: -0.7}, head: {pitch: -2, yaw: -10 * back}};
  };
  return run(T, 'director', [
    {t: -1e9, slot: 'catwalk', f: (T) => mover(look('director'), T, [[86.0, 8480], [D_CLIMB[0] - 0.04, LADDER_X - 25, easeOut]], {...JOG, stride: 186}, CW, {...b, t: T, yaw: 74, face: {mouth: 'pant', brows: -0.6, lookX: 0.5}})},
    {t: D_CLIMB[0], slot: 'catwalk', bl: 0.12, f: (T) => climb(look('director'), LADDER_X, CW, TOP, ramp(T, D_CLIMB[0], D_CLIMB[1]), {...b, t: T})},
    {t: D_CLIMB[1], slot: 'deck', bl: 0.4, f: kneel},
    {t: HOIST[1] + 0.3, slot: 'deck', bl: 0.6, f: holdTm},
    {t: D_TO_F[0], slot: 'deck', bl: 0.25, f: toF},
    {t: D_TO_F[1] - 0.05, slot: 'deck', bl: 0.3, f: reach},
    {t: D_GO, slot: (T) => (T > D_BOARD - 0.2 ? 'basket' : 'deck'), bl: 0.25, f: go},
    {t: D_BOARD, slot: 'basket', bl: 0.3, f: through},
    {t: LEAP[0], slot: (T) => (T < LEAP[0] + 0.3 ? 'basket' : 'landing'), bl: 0.12, f: leap},
    {t: LEAP[1], slot: 'landing', bl: 0.08, f: land},
    {t: PICK - 0.12, slot: 'landing', bl: 0.2, f: jamPose},
    {t: BEAT.jam + 0.35, slot: 'landing', bl: 0.45, f: waitDock},
    {t: BEAT.blast - 0.05, slot: (T) => directorFall(T)!.slot, bl: 0.15, f: (T) => directorFall(T)!.p},
  ]);
};

// ================================================================== CARRIER + TEAMMATE
const PAIR_ARRIVE = BEAT.grab - 0.95; // 90.40 at the ladder foot
const CA_LX = -150, TM_LX = -190;
const CA_BOARD = [HANDOFF + 0.12, HANDOFF + 1.1] as const;
const EXIT_CA = [104.72, 105.5] as const;            // walk the teammate into the basket
export const carrierAt = (T: number): Placed => {
  const b = base('carrier', T, 41);
  const lp = limpOf('carrier', T);
  const boost = (T: number): ActorProps => {
    const c = ramp(T, HOIST[0], HOIST[1]);
    const x = LADDER_X + 6;
    const hy = lerp(CW - 200, CW - 380, c);
    return {
      ...b, t: T, x, y: CW, z: 0.5, yaw: 168, drop: lerp(40, 10, c), lean: lerp(18, 4, c),
      legL: {foot: {x: x - 50, y: CW - 10, z: 30}}, legR: {foot: {x: x + 46, y: CW - 10, z: 60}},
      armL: {hand: {x: x - 34, y: hy, z: -30}}, armR: {hand: {x: x + 34, y: hy, z: -30}},
      head: {pitch: -26}, face: {mouth: 'grit', brows: -0.7, lookY: -0.6},
    };
  };
  const catchUp = (T: number) => helperArm(mover(look('carrier'), T, [[CA_CLIMB[1], LADDER_X], [HANDOFF, 10350, easeOut]], {...HURRY, stride: 130, limp: lp}, TOP, {...b, t: T, yaw: 72, z: 0.42, face: {mouth: 'grit', brows: -0.5}}), T);
  const walkIn = (T: number) => helperArm(mover(look('carrier'), T, [[CA_BOARD[0], 10350], [CA_BOARD[1], bx(CA_LX), easeOut]], {...WALK, stride: 120, limp: lp}, TOP, {...b, t: T, yaw: 72, z: 0.42, face: {mouth: 'grit', brows: -0.5}}), T);
  const ride = (T: number) => helperArm(rider(look('carrier'), T, CA_LX, 0.42, {...b, t: T, seed: 41, hold: false, face: {mouth: 'grit', brows: -0.5, lookX: -0.4}, head: {yaw: 40 * ramp(T, 96.0, 96.5)}}), T);
  const setDown = (T: number): ActorProps => {
    const k = ramp(T, EXIT_CA[1], EXIT_CA[1] + 0.5);
    const x = 12700;
    return {...b, t: T, x, y: TOP, z: 0.45, yaw: -40, drop: 30 + 70 * Math.sin(Math.PI * Math.min(1, k * 1.2)), lean: 10 + 30 * Math.sin(Math.PI * k),
      legL: {foot: {x: x - 50, y: TOP - 10}}, legR: {foot: {x: x + 60, y: TOP - 10}},
      armL: {hand: {x: x - 20, y: TOP - lerp(210, 150, k), z: -40}}, armR: {hand: {x: x - 60, y: TOP - 240 + 60 * k, z: 30}},
      face: {mouth: 'grit', brows: -0.5, lookX: -0.6}, head: {yaw: 10}};
  };
  const slopeTop = (T: number): ActorProps => {
    const x = 11000, gy = surf(T, x).y;
    const bp = builderAt(Math.min(T, RISE[0] - 0.01)).p;
    const reach = solve(bp).sh[1];
    return {...b, t: T, x, y: gy, z: -0.1, yaw: -70, drop: 90, lean: 38,
      legL: {foot: {x: x - 60, y: surf(T, x - 60).y - 10}}, legR: {foot: {x: x + 70, y: surf(T, x + 70).y - 6}},
      armR: {hand: {x: reach.x + 10, y: reach.y + 20, z: 30}}, armL: {hand: {x: reach.x + 30, y: reach.y + 40, z: -10}},
      face: {mouth: 'grit', brows: -0.8, lookY: 0.6}, head: {pitch: 24}};
  };
  const ahead = (T: number): ActorProps => {
    const tr = trio(T);
    const x = tr.friend.x + 190;
    const gy = T < J2[0] ? surf(T, x).y : (x > 12500 ? TOP : surf(T, x).y);
    return {...mover(look('carrier'), T, [[RISE[1], tr.friend.x + 190 - 220], [J2[1] + 0.5, tr.friend.x + 190]], {...WALK, limp: lp}, gy, {...b, t: T, yaw: 70, face: {mouth: 'grit', brows: -0.6, lookX: -0.5}, head: {yaw: 30}}), x, z: -0.1};
  };
  return run(T, 'carrier', [
    {t: -1e9, slot: 'catwalk', f: (T) => helperArm(mover(look('carrier'), T, [[86.0, 8300], [PAIR_ARRIVE, LADDER_X - 70, easeOut]], {...HURRY, stride: 140, limp: lp}, CW, {...b, t: T, yaw: 72, face: {mouth: 'grit', brows: -0.6}}), T)},
    {t: PAIR_ARRIVE + 0.3, slot: 'catwalk', bl: 0.4, f: boost},
    {t: CA_CLIMB[0], slot: 'catwalk', bl: 0.15, f: (T) => climb(look('carrier'), LADDER_X, CW, TOP, ramp(T, CA_CLIMB[0], CA_CLIMB[1]), {...b, t: T})},
    {t: CA_CLIMB[1], slot: 'deck', bl: 0.3, f: catchUp},
    {t: CA_BOARD[0], slot: (T) => (T > CA_BOARD[1] - 0.3 ? 'basket' : 'deck'), bl: 0.2, f: walkIn},
    {t: CA_BOARD[1], slot: 'basket', bl: 0.3, f: ride},
    {t: EXIT_CA[0], slot: (T) => (T < EXIT_CA[0] + 0.35 ? 'basket' : 'landing'), bl: 0.25, f: (T) => flinch(helperArm(exitTo(look('carrier'), T, CA_LX, EXIT_CA[0], EXIT_CA[1], 12700, 0.45, {...WALK, stride: 120, limp: lp}, {...b, t: T, seed: 41, face: {mouth: 'grit', brows: -0.5}}), T), T, 0.7)},
    {t: EXIT_CA[1], slot: 'landing', bl: 0.4, f: setDown},
    {t: 106.9, slot: (T) => (T > 107.2 ? 'walk' : 'landing'), bl: 0.3, f: (T) => ({...mover(look('carrier'), T, [[106.9, 12600], [110.7, 11010, easeOut]], {...HURRY, stride: 150, limp: lp}, onWalk(T), {...b, t: T, yaw: -76, face: {mouth: 'grit', brows: -0.7, worry: 0.5}}), z: -0.1})},
    {t: 110.7, slot: 'walk', bl: 0.35, f: slopeTop},
    {t: RISE[1], slot: (T) => trio(T).slot, bl: 0.4, f: ahead},
    {t: LAY[0], slot: 'landing', bl: 0.5, f: (T) => ({...b, t: T, x: 12920, y: TOP, z: -0.6, yaw: -70, drop: 20, lean: 16, legL: {foot: {x: 12880, y: TOP - 10}}, legR: {foot: {x: 12980, y: TOP - 10}}, armL: {hand: {x: 12900, y: TOP - 200}}, armR: {hand: {x: 12880, y: TOP - 230, z: 30}}, head: {pitch: 24}, face: {mouth: 'sad', worry: 1, brows: 0.2, lookY: 0.7}})},
  ]);
};
export const teammateAt = (T: number): Placed => {
  const b = base('teammate', T, 21);
  const hoisted = (T: number): ActorProps => {
    const c = ramp(T, HOIST[0], HOIST[1]);
    const y = lerp(CW, TOP + 40, easeInOut(c));
    const hh = hoistHands(T);
    return {
      ...b, t: T, x: LADDER_X, y, z: 0.1, yaw: 186, drop: lerp(10, 40, c), lean: 4,
      legL: {foot: {x: LADDER_X - 20, y: y - 10 + 20 * c, z: 10}, pitch: -30}, legR: {foot: {x: LADDER_X + 24, y: y - 10 - 60 * Math.sin(Math.PI * c), z: -20}},
      armR: {hand: {x: hh.R.x - 6, y: hh.R.y - 10, z: 30}}, armL: {hand: {x: hh.L.x + 6, y: hh.L.y - 10, z: 30}},
      head: {pitch: -20}, face: {mouth: 'pain', brows: -0.4, worry: 0.9, lids: 0.3},
      satchel: {radio: radioOnStrap(T)}, breath: 1,
    };
  };
  // on the deck: kneeling at the top, then up on the good leg with the Director
  const kneelTop = (T: number): ActorProps => ({
    ...b, t: T, x: LADDER_X + 10, y: TOP, z: 0.2, yaw: 120, drop: 120, lean: 22,
    legR: {foot: {x: LADDER_X + 60, y: TOP - 10, z: 30}}, legL: {foot: {x: LADDER_X - 40, y: TOP - 4, z: -10}, pitch: -50},
    armR: {hand: {x: LADDER_X + 80, y: TOP - 120, z: 40}}, armL: {hand: {x: LADDER_X + 40, y: TOP - 300, z: 30}}, handL: 'fist',
    face: {mouth: 'pant', worry: 0.9, brows: -0.3, lids: 0.35}, head: {pitch: 14}, satchel: {radio: radioOnStrap(T)}, breath: 1,
  });
  const sitting = (T: number): ActorProps => {
    const x = 12745;
    const watch = ramp(T, BEAT.sag, BEAT.sag + 0.4);
    return {...b, t: T, x, y: TOP, z: 0.3, yaw: -46, drop: 148, lean: 6,
      legR: {foot: {x: x - 150, y: TOP - 12, z: 30}}, legL: {foot: {x: x - 120, y: TOP - 10, z: -20}, pitch: -20},
      armR: {hand: {x: x + 50, y: TOP - 30, z: 40}}, armL: {hand: {x: x - 10, y: TOP - 160, z: 30}}, handL: 'fist',
      face: {mouth: watch > 0.5 ? 'open' : 'pant', open: 0.3, worry: 1, brows: 0.3 * watch, lids: 0.2, lookX: -0.8},
      head: {yaw: 20, pitch: -2}, satchel: {radio: radioOnStrap(T)}, breath: 0.9};
  };
  return run(T, 'teammate', [
    {t: -1e9, slot: 'catwalk', f: (T) => supportedBy(carrierAt(T).p, T)},
    {t: PAIR_ARRIVE + 0.3, slot: 'catwalk', bl: 0.4, f: hoisted},
    {t: HOIST[1], slot: 'deck', bl: 0.3, f: kneelTop},
    {t: HOIST[1] + 0.45, slot: 'deck', bl: 0.5, f: (T) => supportedBy(directorAt(T).p, T)},
    {t: HANDOFF, slot: (T) => carrierAt(T).slot, bl: 0.35, f: (T) => supportedBy(carrierAt(T).p, T, T > CA_BOARD[1] ? {face: {mouth: 'pant', worry: 0.9, brows: -0.2, lids: 0.3, lookX: -0.6}, head: {yaw: 50 * ramp(T, 96.2, 96.8), pitch: 4}} : {})},
    {t: EXIT_CA[1], slot: 'landing', bl: 0.5, f: (T) => flinch(sitting(T), T, 0.5)},
  ]);
};

// ================================================================== BUILDER and CIVILIANS
const B_CLIMB = [92.55, 93.05] as const;
const B_LX = 40;
export const builderAt = (T: number): Placed => {
  const b = base('builder', T, 51);
  const arrive = PAIR_ARRIVE + 0.1;
  const wait = (T: number) => {
    const p = mover(look('builder'), T, [[86.0, 8150], [arrive, 9770, easeOut]], {...HURRY, stride: 150}, CW, {...b, t: T, yaw: 70, face: {mouth: 'pant', brows: -0.5}});
    const lb = ramp(T, arrive, arrive + 0.5) * (1 - ramp(T, B_CLIMB[0] - 0.7, B_CLIMB[0] - 0.4));
    return {...p, twist: 30 * lb, head: {yaw: 70 * lb}, face: {mouth: 'flat' as const, brows: -0.6, lookX: -0.8 * lb}};
  };
  /** Kneeling up-slope of the prone Director, both hands on their legs. */
  const kneelX = (T: number) => {
    const dp = directorFall(Math.max(D_PRONE + 0.4, Math.min(T, RISE[0] - 0.01)))!.p;
    const r = solve(dp);
    return rolled(r, r.ankle[0]).x + 120;
  };
  const kneelHold = (T: number): ActorProps => {
    const dp = directorFall(Math.max(D_PRONE + 0.4, Math.min(T, RISE[0] - 0.01)))!.p;
    const r = solve(dp);
    const a0 = rolled(r, r.ankle[0]), k0 = rolled(r, r.knee[1]);
    const x = a0.x + 120, gy = surf(T, x).y;
    const pull = Math.sin(Math.PI * ramp(T, HAUL[0], HAUL[1])) * 20;
    return {...b, t: T, x: x + pull, y: gy, z: -0.2, yaw: -70, drop: 120, lean: 34 - pull * 0.6,
      legL: {foot: {x: x - 20, y: surf(T, x - 20).y - 8}}, legR: {foot: {x: x + 90, y: surf(T, x + 90).y - 4}, pole: {x: 0, y: 0, z: 1}},
      armL: {hand: {x: a0.x + 6, y: a0.y - 6, z: 0}}, armR: {hand: {x: k0.x, y: k0.y - 6, z: 20}}, handL: 'fist', handR: 'fist',
      face: {mouth: 'grit', brows: -0.8, lookY: 0.5}, head: {pitch: 20}};
  };
  return run(T, 'builder', [
    {t: -1e9, slot: 'catwalk', f: wait},
    {t: B_CLIMB[0] - 0.6, slot: 'catwalk', bl: 0.15, f: (T) => mover(look('builder'), T, [[B_CLIMB[0] - 0.6, 9770], [B_CLIMB[0] - 0.05, LADDER_X - 10, easeOut]], HURRY, CW, {...b, t: T, yaw: 70})},
    {t: B_CLIMB[0], slot: 'catwalk', bl: 0.15, f: (T) => climb(look('builder'), LADDER_X, CW, TOP, ramp(T, B_CLIMB[0], B_CLIMB[1]), {...b, t: T})},
    {t: B_CLIMB[1], slot: (T) => (T > B_CLIMB[1] + 0.6 ? 'basket' : 'deck'), bl: 0.3, f: (T) => mover(look('builder'), T, [[B_CLIMB[1], LADDER_X], [B_CLIMB[1] + 0.85, bx(B_LX), easeOut]], HURRY, TOP, {...b, t: T, yaw: 70, z: -0.6})},
    {t: B_CLIMB[1] + 0.85, slot: 'basket', bl: 0.3, f: (T) => rider(look('builder'), T, B_LX, -0.6, {...b, t: T, seed: 51, hold: false, yaw: T < 95.2 ? -60 : 70,
      armR: T < 95.2 ? {hand: {x: bx(B_LX) - 120, y: TOP - 250, z: 30}} : undefined, face: {mouth: 'pant', brows: -0.4, lookX: -0.5}})},
    {t: 104.6, slot: (T) => (T < 104.95 ? 'basket' : 'landing'), bl: 0.25, f: (T) => flinch(exitTo(look('builder'), T, B_LX, 104.6, 105.3, 12880, -0.2, HURRY, {...b, t: T, seed: 51, face: {mouth: 'pant', brows: -0.4}}), T)},
    {t: 106.8, slot: (T) => (T > 107.05 ? 'walk' : 'landing'), bl: 0.3, f: (T) => ({...mover(look('builder'), T, [[106.8, 12880], [110.1, kneelX(T), easeOut]], {...JOG, stride: 180}, onWalk(T), {...b, t: T, yaw: -78, face: {mouth: 'grit', brows: -0.8}}), z: -0.2})},
    {t: 110.1, slot: 'walk', bl: 0.3, f: kneelHold},
    {t: RISE[0], slot: (T) => trio(T).slot, bl: 0.9, f: (T) => (T > LAY[0] ? layDown(T).bld : trio(T).bld)},
  ]);
};
const CIV_X = [9620, 9480, 9340];
const V_CLIMB = [[93.4, 93.85], [93.8, 94.25], [93.0, 93.45]] as const;
const V_LX = [210, -40, 150];
const V_Z = [-0.5, -0.9, 0.55];
const V_EXIT = [104.5, 104.95, 104.35];
const V_END = [12820, 13000, 13120];
export const civAt = (i: number, T: number): Placed => {
  const lk = CIV[i];
  const s = 0.96 * (lk.height ?? 1);
  const b = {look: lk, t: T, seed: 61 + i, s};
  const arrive = PAIR_ARRIVE + 0.3 + i * 0.25;
  const [c0, c1] = V_CLIMB[i];
  const face = {mouth: 'pant' as const, worry: 0.7, brows: -0.2};
  return run(T, `civ${i}`, [
    {t: -1e9, slot: 'catwalk', f: (T) => ({...mover(lk, T, [[86.0, 7980 - i * 160], [arrive, CIV_X[i], easeOut]], {...HURRY, stride: 140}, CW, {...b, t: T, yaw: 70, face}), z: -0.2 - i * 0.1})},
    {t: c0 - 0.75, slot: 'catwalk', bl: 0.15, f: (T) => mover(lk, T, [[c0 - 0.75, CIV_X[i]], [c0 - 0.05, LADDER_X - 10, easeOut]], {...HURRY, stride: 140}, CW, {...b, t: T, yaw: 70, face})},
    {t: c0, slot: 'catwalk', bl: 0.15, f: (T) => climb(lk, LADDER_X, CW, TOP, ramp(T, c0, c1), {...b, t: T})},
    {t: c1, slot: (T) => (T > c1 + 0.55 ? 'basket' : 'deck'), bl: 0.3, f: (T) => ({...mover(lk, T, [[c1, LADDER_X], [c1 + 0.8, bx(V_LX[i]), easeOut]], HURRY, TOP, {...b, t: T, yaw: 70, face}), z: V_Z[i]})},
    {t: c1 + 0.8, slot: 'basket', bl: 0.3, f: (T) => rider(lk, T, V_LX[i], V_Z[i], {...b, t: T, seed: 61 + i, face: {mouth: 'flat', worry: 0.8, lookX: 0.3}})},
    {t: V_EXIT[i], slot: (T) => (T < V_EXIT[i] + 0.3 ? 'basket' : 'landing'), bl: 0.25, f: (T) => flinch({...exitTo(lk, T, V_LX[i], V_EXIT[i], V_EXIT[i] + 0.65, V_END[i], V_Z[i], HURRY, {...b, t: T, seed: 61 + i, face}), s}, T, 0.9)},
    {t: V_EXIT[i] + 1.4, slot: 'landing', bl: 0.5, f: (T) => {
      if (i === 0 && T > 106.5) {
        // goes to the teammate and kneels beside them
        const k = ramp(T, 106.5, 107.3);
        const x = lerp(V_END[0], 12850, k);
        return {...b, t: T, x, y: TOP, z: 0.2, yaw: -60, drop: 110 * ramp(T, 107.0, 107.5), lean: 20, legL: {foot: {x: x - 60, y: TOP - 10}}, legR: {foot: {x: x + 40, y: TOP - 6}},
          armR: {hand: {x: 12790, y: TOP - 260, z: 40}}, face: {mouth: 'sad', worry: 1, brows: 0.3, lookX: -0.6}};
      }
      return {...b, t: T, x: V_END[i], y: TOP, z: V_Z[i], yaw: -72, drop: 10, lean: 6, legL: {foot: {x: V_END[i] - 40, y: TOP - 10}}, legR: {foot: {x: V_END[i] + 50, y: TOP - 10}},
        armL: {hand: {x: V_END[i] - 30, y: TOP - 300, z: 20}}, face: {mouth: 'o', worry: 1, brows: 0.3, lookX: -0.8}};
    }},
  ]);
};

export const crewAt = (T: number): Placed[] => [friendAt(T), directorAt(T), carrierAt(T), teammateAt(T), builderAt(T), civAt(0, T), civAt(1, T), civAt(2, T)];
void [easeIn, ring, walkPoint, keys, basketSwing, smooth] as unknown;
export type {G};

// ================================================================== C13–C15: the blast, the fall, the catch
export const F_RUN = [LET_GO + 0.1, BEAT.blast] as const;
export const THROW = [BEAT.blast, BEAT.blast + 0.36] as const;
export const SLIDE_END = 106.35;
const SLIP_L = 108.45, SLIP_R = 109.02;
export const CATCH = BEAT.catch;
export const HAUL = [110.4, 111.6] as const;
export const RISE = [111.6, 112.6] as const;
export const J1 = [112.6, 113.6] as const;  // C14: back up the slope
export const J2 = [113.6, 114.75] as const; // C15 (after the cut): the last metres onto the landing
export const LAY = [114.75, 115.7] as const;
const D_RUN = [106.45, 108.15] as const;
const D_PRONE = 108.7;

/** Where the Director's reaching hand is (world): toward the lip, on the friend's wrist, hauling up the slope. */
export const dHand = (T: number): V3 => {
  const lip = lipAt(T);
  const sl = slopeAt(T, lip.x + 120);
  const up = {x: Math.cos((sl * Math.PI) / 180), y: -Math.sin((sl * Math.PI) / 180)}; // up-slope unit
  const catchPt = {x: lip.x + 12, y: lip.y + 34};
  if (T < CATCH) {
    const r = ramp(T, D_PRONE, CATCH);
    return {x: lerp(lip.x + 60, catchPt.x, r), y: lerp(lip.y - 40, catchPt.y, r), z: 30};
  }
  const h = ramp(T, HAUL[0], HAUL[1]);
  const dist = 520 * smooth(h);
  const over = Math.sin(Math.PI * clamp(h * 1.6)) * 40;
  return {x: catchPt.x + up.x * dist, y: catchPt.y + up.y * dist - over - 34 * clamp(h * 3), z: 30};
};
/** The Director's body slides up-slope during the haul (the builder pulls them back). */
const dProneS = (T: number) => {
  const lip = lipAt(T);
  const sl = slopeAt(T, lip.x + 200);
  const back = 260 + 300 * smooth(ramp(T, HAUL[0], HAUL[1]));
  const x = lip.x + Math.cos((sl * Math.PI) / 180) * back;
  return {S: surf(T, x), sl, x};
};

/** The friend's fall and rescue phases. */
export const friendFall = (T: number): {p: ActorProps; slot: Slot} => {
  const b = {...base('friend', T, 11), visor: visorOn(T)};
  const lk = look('friend');
  const hurt = {mouth: 'pain' as const, brows: -0.2, worry: 1, lids: 0.25};
  if (T < THROW[0]) {
    const p = mover(lk, T, [[F_RUN[0], 10078], [F_RUN[1], 10650, (u) => u * u * (1.5 - 0.5 * u)]], {...SPRINT, stride: 200}, TOP, {...b, t: T, yaw: 80, z: -0.4, face: {mouth: 'grit', brows: -0.8}});
    return {p: {...p, lean: 20}, slot: p.x > 10300 ? 'walk' : 'deck'};
  }
  if (T < THROW[1]) {
    const u = ramp(T, THROW[0], THROW[1]);
    const end = surf(T, 10880), n = normalOf(slopeAt(T, 10880));
    const P = {x: lerp(10655, end.x + n.x * 44, u), y: lerp(TOP - 168, end.y + n.y * 44, u) - 190 * Math.sin(Math.PI * u)};
    return {slot: 'walk', p: {...b, t: T, x: P.x, y: P.y + 165, z: -0.3, yaw: 76, roll: 72 * u, rollPivot: P, shadow: false,
      armL: {fk: {fwd: 150, out: 40, bend: 30}}, armR: {fk: {fwd: 120, out: 50, bend: 40}}, handL: 'open', handR: 'open',
      legL: {fk: {fwd: 40, knee: 70}}, legR: {fk: {fwd: -20, knee: 40}}, head: {pitch: -20},
      face: {mouth: 'open', open: 0.6, brows: 0.3, worry: 1}, silhouette: T < BEAT.blast + 0.2 ? '#2A1A1E' : undefined}};
  }
  if (T < SLIDE_END) {
    const u = ramp(T, THROW[1], SLIDE_END);
    const lip = lipAt(T);
    const hx = lerp(10900, lip.x, u * u);
    const sl = slopeAt(T, Math.max(lip.x + 40, hx));
    const n = normalOf(sl);
    const s0 = surf(T, hx);
    const off = 36 * (1 - ramp(T, SLIDE_END - 0.3, SLIDE_END));
    const H = u > 0.97 ? lip : {x: s0.x + n.x * off, y: s0.y + n.y * off};
    const tip = ramp(T, SLIDE_END - 0.38, SLIDE_END + 0.05);
    return {slot: 'walk', p: hangFrom(lk, T, H, (90 - sl) * (1 - tip), {...b, face: {...hurt, mouth: 'open', open: 0.5}}, 0, 66, 1 - tip)};
  }
  if (T < CATCH) {
    const lip = lipAt(T);
    const a = T - SLIDE_END;
    const sw = 14 * Math.exp(-1.5 * a) * Math.sin(2 * Math.PI * 0.72 * a);
    const slipL = T > SLIP_L && T < SLIP_L + 0.45 ? Math.sin(Math.PI * (T - SLIP_L) / 0.45) : 0;
    const slide = 30 * smooth(ramp(T, SLIP_R, CATCH));
    const p = hangFrom(lk, T, lip, sw, {...b, face: {...hurt, mouth: T > SLIP_L ? 'open' : 'grit', open: 0.4, lookY: -0.9}}, slide, 64, 0.5 + slipL);
    const hl = p.armL!.hand as V3;
    return {slot: 'walk', p: {...p, armL: {hand: {x: hl.x - 70 * slipL, y: hl.y + 230 * slipL, z: hl.z}, pole: p.armL!.pole}, handL: slipL > 0.3 ? 'open' : 'fist', handR: T > SLIP_R ? 'open' : 'fist'}};
  }
  if (T < HAUL[1] + 0.05) {
    const H = dHand(T);
    const h = ramp(T, HAUL[0], HAUL[1]);
    const sl = slopeAt(T, lipAt(T).x + 200);
    const tip = smooth(ramp(T, HAUL[0] + 0.35, HAUL[1]));
    const a = T - CATCH;
    const sw = 10 * Math.exp(-2 * a) * Math.sin(2 * Math.PI * 0.8 * a) * (1 - h);
    const p = hangFrom(lk, T, H, sw + (90 - sl) * tip, {...b, face: {...hurt, lookY: -0.9}}, 0, 64, 0.3 * (1 - h));
    const reach = ramp(T, CATCH + 0.2, CATCH + 0.6);
    const left = {x: H.x - 40, y: H.y + 40 * (1 - reach) + 10, z: -10};
    return {slot: 'walk', p: {...p, armR: {hand: {x: H.x, y: H.y, z: 16}}, armL: {hand: left, pole: p.armL!.pole}}};
  }
  // up and supported between the Director (near) and the builder (far)
  const tr = trio(T);
  return {slot: tr.slot, p: tr.friend};
};

/** The three of them moving as one: the friend limp between the Director (their right, nearer) and the builder. */
export const trio = (T: number): {friend: ActorProps; dir: ActorProps; bld: ActorProps; slot: Slot} => {
  let x: number, ground: (x: number) => number, slot: Slot = 'walk';
  if (T < J2[0]) {
    x = path(T, [[RISE[0], lipAt(T).x + 330], [J1[0], lipAt(T).x + 400], [J1[1], 11080]]);
    ground = onWalk(T);
  } else {
    x = path(T, [[J2[0], 12230], [J2[1], 12700, easeOut]]);
    ground = (xx) => (xx > 12500 ? TOP : surf(T, xx).y);
    slot = x > 12480 ? 'landing' : 'walk';
  }
  const gy = ground(x);
  const rise = ramp(T, RISE[0], RISE[1]);
  const moving = T > J1[0] ? 1 : 0;
  const step = Math.sin(T * 7.2) * moving;
  const fb = base('friend', T, 11);
  const db = base('director', T, 31);
  const bb = base('builder', T, 51);
  const dz = 0.35, bz = -0.35;
  const hS = (dx: number, z: number) => ({x: x + dx, y: gy - 300, z});
  const dir: ActorProps = {...db, x: x + 18, y: gy, z: dz, yaw: 70, drop: 30 - 20 * rise, lean: 18,
    legL: {foot: {x: x + 70 + 40 * step, y: ground(x + 70) - 10}}, legR: {foot: {x: x - 40 - 40 * step, y: ground(x - 40) - 10}},
    armL: {hand: {x: x - 10, y: gy - 215, z: -20}}, armR: {hand: {x: x + 40, y: gy - 330, z: 60}}, handL: 'fist',
    face: {mouth: 'grit', brows: -0.7, worry: 0.6, lookX: -0.4}, head: {pitch: 6, yaw: 18}};
  const bld: ActorProps = {...bb, x: x - 12, y: gy, z: bz, yaw: 72, drop: 30 - 20 * rise, lean: 18,
    legL: {foot: {x: x + 50 - 40 * step, y: ground(x + 50) - 10}}, legR: {foot: {x: x - 60 + 40 * step, y: ground(x - 60) - 10}},
    armR: {hand: {x: x + 10, y: gy - 215, z: 20}}, armL: {hand: {x: x + 20, y: gy - 330, z: -60}},
    face: {mouth: 'grit', brows: -0.6}, head: {pitch: 4}};
  const friend: ActorProps = {...fb, visor: visorOn(T), x, y: gy, z: 0, yaw: 72, drop: lerp(150, 70, rise), lean: lerp(10, 34, rise), shadow: false,
    legL: {foot: {x: x - 80, y: ground(x - 80) - 14}, pitch: -50}, legR: {foot: {x: x - 40 + 10 * step, y: ground(x - 40) - 12}, pitch: -40},
    armR: {hand: hS(30, dz * 1000 * 0 + 40)}, armL: {hand: hS(10, -40)},
    zArm: [-40, 30], zHand: [-30, 400],
    handL: 'limp', handR: 'limp', head: {pitch: 40, yaw: 10, roll: 12}, face: {closed: false, lids: 0.75, mouth: 'pain', worry: 0.9, brows: 0}, breath: 0.6};
  return {friend, dir, bld, slot};
};

/** The Director from the blast to the landing. */
export const directorFall = (T: number): {p: ActorProps; slot: Slot} | null => {
  if (T < BEAT.blast - 0.05) return null;
  const b = base('director', T, 31);
  const lk = look('director');
  if (T < D_RUN[0]) {
    // the shock; then the horror of the friend going over; let go of the rebar
    const r = rebarAt(T);
    const x = 12610;
    const see = ramp(T, BEAT.sag, BEAT.sag + 0.3);
    const p: ActorProps = {...b, x, y: TOP, z: 0.95, yaw: -64, drop: 14, lean: 8,
      legL: {foot: {x: x - 50, y: TOP - 10}}, legR: {foot: {x: x + 60, y: TOP - 10}},
      armR: {hand: {x: lerp(r.a.x, r.b.x, 0.5), y: lerp(r.a.y, r.b.y, 0.5), z: 40}}, handR: 'fist',
      armL: {hand: {x: x - 80, y: TOP - 280, z: 10}}, handL: 'open',
      face: {mouth: see > 0.5 ? 'open' : 'grit', open: 0.5, brows: 0.3 * see - 0.6 * (1 - see), worry: see, lookX: -0.8}, head: {pitch: 4}};
    return {slot: 'landing', p: flinch(p, T)};
  }
  if (T < D_PRONE) {
    const k: [number, number, ((u: number) => number)?][] = [[D_RUN[0], 12560], [D_RUN[1], 10960, (u) => u * (1.1 - 0.1 * u)], [D_PRONE, 10800, easeOut]];
    const p = mover(lk, T, k, {...SPRINT, stride: 205}, onWalk(T), {...b, t: T, yaw: -78, z: 0.3, face: {mouth: 'grit', brows: -0.9, worry: 0.6, lookX: -0.6}});
    return {slot: p.x < 12520 ? 'walk' : 'landing', p: {...p, lean: 24}};
  }
  if (T < RISE[0]) {
    const {S, sl} = dProneS(T);
    const H = dHand(T);
    const lip = lipAt(T);
    const gripL = {x: lip.x + 120, y: surf(T, lip.x + 120).y - 8, z: -20};
    const p = proneDown(lk, T, S, sl, {R: H, L: T > HAUL[0] ? {...H, x: H.x + 30, z: -10} : gripL},
      {...b, seed: 31, face: {mouth: 'grit', brows: -0.9, worry: 0.4, lookY: 0.8, lookX: -0.5}});
    return {slot: 'walk', p: T < D_PRONE + 0.3 ? blend(directorFall(D_PRONE - 0.001)!.p, p, ramp(T, D_PRONE, D_PRONE + 0.3)) : p};
  }
  const tr = trio(T);
  if (T < RISE[1]) {
    const pr = directorFall(RISE[0] - 0.001)!.p;
    return {slot: tr.slot, p: blend(pr, tr.dir, ramp(T, RISE[0], RISE[1]))};
  }
  if (T > LAY[0]) return {slot: 'landing', p: layDown(T).dir};
  return {slot: tr.slot, p: tr.dir};
};

/** On the landing they lower the friend to the deck; the Director kneels over them. */
export const layDown = (T: number) => {
  const k = ramp(T, LAY[0], LAY[1]);
  const x = 12700;
  const fb = base('friend', T, 11), db = base('director', T, 31), bb = base('builder', T, 51);
  const tr = trio(LAY[0] - 0.001);
  const friendLying = {...fb, visor: visorOn(T), ...lyingAt(x + 20, TOP)} as ActorProps;
  const friend = blend(tr.friend, friendLying, k);
  const dir: ActorProps = blend(tr.dir, {...db, x: x - 30, y: TOP, z: 0.5, yaw: 40, drop: 120, lean: 40,
    legL: {foot: {x: x - 80, y: TOP - 10}}, legR: {foot: {x: x + 30, y: TOP - 4, z: 60}, pole: {x: 0, y: 0, z: 1}},
    armR: {hand: {x: x + 40, y: TOP - 90, z: 40}}, armL: {hand: {x: x + 140, y: TOP - 60, z: 10}},
    head: {pitch: 30}, face: {mouth: 'pant', brows: 0.2, worry: 1, lookY: 0.8}}, k);
  const bld: ActorProps = blend(tr.bld, {...bb, x: x + 230, y: TOP, z: -0.5, yaw: -60, drop: 110, lean: 30,
    legL: {foot: {x: x + 260, y: TOP - 10}}, legR: {foot: {x: x + 170, y: TOP - 6}}, armL: {hand: {x: x + 150, y: TOP - 70}}, armR: {hand: {x: x + 120, y: TOP - 90}},
    head: {pitch: 26}, face: {mouth: 'sad', worry: 1, brows: 0.2, lookY: 0.7}}, k);
  return {friend, dir, bld};
};
/** Lying on the deck, face up, head to the west (the lying() roll, inlined to keep z/ink from the caller). */
const lyingAt = (x: number, ySurf: number): Partial<ActorProps> => {
  const P = {x, y: ySurf - 38};
  return {x: P.x, y: P.y + 165, yaw: 90, roll: -90, rollPivot: P, shadow: false, z: 0.1, drop: 0, lean: 0,
    armL: {fk: {fwd: 10, out: 14, bend: 10}}, armR: {fk: {fwd: 20, out: 10, bend: 30}}, handL: 'limp', handR: 'limp',
    head: {pitch: -6, roll: 8}, face: {closed: true, mouth: 'pain', brows: 0, worry: 0.7}};
};
