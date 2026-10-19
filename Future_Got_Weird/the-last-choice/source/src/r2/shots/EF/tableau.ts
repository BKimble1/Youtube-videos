// THE AFTERMATH TABLEAU — the state of the battlefield at FINAL_HIT (186.90), when the advance stops, and how the
// machines secure it afterwards. PURE (no React): D4 imports this and must END in exactly this state; E/F (shots/EF)
// start from it.
//
//   TB.crew[role]        where each Crew member is at FINAL_HIT, facing what, in which body state, who holds them
//   SURRENDER            each survivor's own reason and physical response (film s) — staggered, never in unison
//   TB.holders           the units that restrain a Crew member (the grip point is shared with the person's wrist /
//                        shoulder: one contact), the one that lets the decoy maker go when she raises her hands, and the
//                        one standing over the runner
//   TB.ring / TB.outer   the inner ring round the van (spacing ~2.3 m; the east sector is heavy 2's) and a looser outer
//                        cordon; SECURING: each lowers into 'ready' as it settles (184.95–186.85, seeded), scans its
//                        sector with pauses, a few attend the drone pilot while she crawls, a few step into blocking
//                        positions during the pullback (STEPS)
//   TB.reserve           a block halted in the avenue between the bus and the first cross street
//   TB.heavy2            the second heavy, east of the van, ram at rest (its ram struck the Director at STRIKE 177.76)
//   TB.heavy1            the first heavy's wreck across the crater (fallback until D3 registers its own)
//   TB.wrecks            units the Crew downed in D4 near the ridge foot
//   TB.drones            drones: four low over the ring, four high over the avenue
//   streamForm()         the columns streaming west along the avenue, steered round every street obstacle
//                        (steerAround), halting at FINAL_HIT, moving on at STREAM_RESUME and turning into the first cross
//                        street on rounded corners clear of its corner buildings and lamps
//   holdForm()           squads taking the intersections (HOLD_POINTS) during the pullback: they walk in from the
//                        cross streets and take posts on the corners and across the cross-street mouths, facing out
//   *Spec(T) helpers     UnitSpec / HeavySpec / DroneSpec at film time T (all t0s in film seconds)
//
// HAND-OVER FOR D4 (what to import so D4's last frames ARE this state):
//   - Crew: shots/EF/crew.tsx — directorSpec(T), pilotSpec(T) (her crawl starts at 186.4 from TB_CREW.drone.pos),
//     heldSpec(role, T) for tether/decoy/flares/breaker/runner (each one's surrender beats are inside it, from their
//     grab on: SURRENDER below), or aftermathCrewItems(T). gripAt(role, T) is the shared grip point.
//   - Machines: shots/EF/machines.tsx — tableauMachineItems(view, T), or ringSpecs / holderSpecs (restraints, the
//     decoy maker's release at 183.55, postures from 184.95) once each unit is in its place.
//
// Geography (metres, x east, z south; see world/plan.ts): the Director sits against the broken slab at PLAN.deathPos
// (7.0, 3.4) facing ESE (120); the van is NE of him with its open side door (radio on the floor, RADIO ≈ (8.13, 0.88,
// 1.81)) facing him; the ridge rises behind him (crest x ≈ 0.4, 4.5 m); the avenue and the crater (x 62) lie east.
import type {V3} from '../../../kit/math';
import {clamp, smooth, rnd, lerp} from '../../../kit/math';
import {M} from '../../timing';
import {PLAN, HOLD_POINTS, steerAround} from '../../world/plan';
import {groundH} from '../../world/ground';
import type {UnitSpec, HeavySpec, DroneSpec, Path, Slot, Formation, Posture, AttendSpec, MoveSpec, RestrainSpec, ScanSpec} from '../../mech';
import type {Role2} from '../../rig/looks';
import {W1_FIGHT} from '../D4/wreckfx';

const on = (x: number, z: number, up = 0): V3 => ({x, y: groundH(x, z) + up, z});
const hv = (h: number) => ({x: Math.sin((h * Math.PI) / 180), z: -Math.cos((h * Math.PI) / 180)});
const headingTo = (a: {x: number; z: number}, b: {x: number; z: number}) => (Math.atan2(b.x - a.x, -(b.z - a.z)) * 180) / Math.PI;
/** (= mech staggerT, copied to keep this file free of the kit's components) a seeded offset round t0, ±spread/2 */
export const stagger = (id: number, t0: number, spread = 0.9, k = 0) => t0 + (rnd(id * 7.31 + k * 13.7 + 0.5) - 0.5) * spread;

/** When the advance stops (film s). Before T0 it is D4's to animate. */
export const T0 = M.FINAL_HIT;
/** The formations in the avenue move on (each column ripples back from its head). */
export const STREAM_RESUME = 207.0;

/**
 * The Director's seat: the figure's root (pelvis on the ground). It sits 0.32 m behind PLAN.deathPos (toward the slab)
 * so that, slumped back 27°, his shoulders rest on DEATH_SLAB's face and his head clears it.
 */
export const DIRECTOR_SEAT = on(PLAN.deathPos.x - hv(PLAN.deathHeading).x * 0.32, PLAN.deathPos.z - hv(PLAN.deathHeading).z * 0.32);
/** His head (slumped against the slab), for looks. */
export const DIRECTOR_HEAD: V3 = {x: DIRECTOR_SEAT.x - 0.2, y: DIRECTOR_SEAT.y + 0.9, z: DIRECTOR_SEAT.z - 0.17};

// ------------------------------------------------------------------ the survivors' surrender (each for its own reason)
/**
 * Why each one stops, and how (film s). Their bodies are crew.tsx heldSpec(role, T); the machines answer in
 * holderSpecs / ringSpecs. Nothing happens on the same frame for two people.
 */
export const SURRENDER = {
  /** disarmed (launcher torn away 157.55), reel empty; H1 catches her left wrist (180.4): she strains toward him with
   *  her free hand out; the strain gives out (184.6: the hand drops, shoulders sag); grief: the free hand to her mouth
   *  (198.6); her knees give and she sinks onto them, still held — H1's grip follows her wrist down (208.6 → 209.8) */
  tether: {held: 180.4, giveUp: 184.6, mouth: 198.6, sink: 208.6, sunk: 209.8},
  /** tablet smashed (D3) and dropped (160.15); H2 catches her right wrist (181.0); she stops pulling — H2 lets go
   *  (183.55) and she raises both open hands (183.7 → 184.4), shaking; a glance to the breaker beside her (188.2);
   *  her hands sink to her thighs, palms still open (199.4) */
  decoy: {held: 181.0, release: 183.55, handsUp: 183.7, glance: 188.2, lower: 199.4},
  /** out of flares (the last one into heavy 2's eye, 166.14), satchel empty; H3 locks his right arm up behind him
   *  with one hand and bears down on his shoulder with the other (181.7), pressing him down onto one knee (182.4); one last heave against the lock (184.3) that the unit bears
   *  down on; his head drops (185.2); a look across to the decoy maker (190.5) */
  flares: {held: 181.7, press: 182.4, heave: 184.3, drop: 185.2, glance: 190.5},
  /** the empty breaker swung as a club (164.4); his bad leg gives and he sits down hard, the tool falling beside him
   *  (D4 181.3); H4's hand comes down on his shoulder (182.3); his right hand grips his bleeding left forearm, shaking
   *  (until 189.5); he turns his face away (200.2) */
  breaker: {held: 182.3, shakeEnd: 189.5, away: 200.2},
  /** struck down (155.86) and never got up: he tries to rise on his elbows toward the van (214.8); H5 snaps to him and
   *  steps in over him; he lies back (216.3) */
  runner: {rise: 214.8, down: 216.3},
} as const;

export type CrewPose =
  | 'slumped' // sitting against the slab, legs out, head down (the Director)
  | 'crawl' // on hands and knees, moving (the drone pilot reaching him)
  | 'standHeld' // standing, leaning toward him, one wrist held back by a unit (the tether operator, until she sinks)
  | 'kneelHeld' // (R2 name) on one knee, held
  | 'kneelHandsUp' // on both knees, open hands raised (the decoy maker, released)
  | 'kneelArmLock' // on one knee, one arm locked up behind him, a unit's hand on his shoulder (the flare carrier)
  | 'sitHurt' // sitting on the ground, hurt left leg out, a unit's hand on the shoulder (the breaker)
  | 'lyingBack'; // on his back, alive (breathing, a hand moves; tries to rise once)

export type CrewState = {
  role: Role2;
  pos: V3;
  heading: number;
  pose: CrewPose;
  /** which hand is held ('L' | 'R'), and the world grip point the holder's hand closes on (same point = one contact) */
  held?: {side: 'L' | 'R'; at: V3; by: string};
  /** the point they look at (the Director, mostly) */
  look: V3;
  note: string;
};

// ------------------------------------------------------------------ the Crew at FINAL_HIT
const CREW_POS: Record<Exclude<Role2, 'director'>, {x: number; z: number}> = {
  drone: {x: 8.27, z: 2.83},
  tether: {x: 12.35, z: 0.55},
  decoy: {x: 10.95, z: 6.05},
  flares: {x: 13.95, z: 7.35},
  breaker: {x: 11.4, z: 7.5}, // clear of the big leaning slab south of the van (rslab_15 covered 9.7, 7.95)
  runner: {x: 18.0, z: 7.7},
};
const faceDir = (p: {x: number; z: number}) => headingTo(p, PLAN.deathPos);

/** A point `fwd` metres ahead of someone (negative = behind), `right` to their right, `up` above the ground. */
const rel = (p: {x: number; z: number}, heading: number, fwd: number, right: number, up: number, ground = true): V3 => {
  const f = hv(heading), r = hv(heading + 90);
  const x = p.x + f.x * fwd + r.x * right, z = p.z + f.z * fwd + r.z * right;
  return {x, y: (ground ? groundH(p.x, p.z) : 0) + up, z};
};

const H = {
  tether: faceDir(CREW_POS.tether), decoy: faceDir(CREW_POS.decoy), flares: faceDir(CREW_POS.flares) - 6,
  breaker: faceDir(CREW_POS.breaker) + 4, runner: 250,
};
/** Grip points (world): a wrist held back behind the body, a shoulder pressed down. */
const GRIP = {
  // her left wrist pulled back behind her left hip (she strains forward toward him)
  tether: rel(CREW_POS.tether, H.tether, -0.42, -0.3, 0.98),
  // her right wrist held back at her side (until she is let go)
  decoy: rel(CREW_POS.decoy, H.decoy, -0.36, 0.34, 0.62),
  // his right wrist twisted up behind his back (on one knee)
  flares: rel(CREW_POS.flares, H.flares, -0.3, 0.12, 0.74),
  // a hand pressing down on his left shoulder (sitting)
  breaker: rel(CREW_POS.breaker, H.breaker, -0.1, -0.2, 0.74),
};
/** The flare carrier's right shoulder (H3's second hand bears down on it). */
export const FLARES_SHOULDER = rel(CREW_POS.flares, H.flares, -0.06, 0.16, 0.98);
/** A window 0 → 1 → 0 between a and b. */
const win = (T: number, a: number, b: number, ri = 0.3, ro = 0.3) => smooth((T - a) / ri) * (1 - smooth((T - (b - ro)) / ro));
/** The flare carrier's heave against the arm lock (0 … 1 … 0): his body (crew.tsx) and H3's grip share it. */
export const flaresHeave = (T: number) => win(T, 184.3, 185.25, 0.28, 0.5);
/** H3's second hand: on the flare carrier's shoulder, lifted by his heave, then bearing down. */
export const flaresShoulderAt = (T: number): V3 => ({...FLARES_SHOULDER, y: FLARES_SHOULDER.y + 0.09 * flaresHeave(T) - 0.03 * smooth((T - 185.2) / 0.5)});

export const TB_CREW: Record<Role2, CrewState> = {
  director: {role: 'director', pos: DIRECTOR_SEAT, heading: PLAN.deathHeading, pose: 'slumped', look: on(14, 6, 1.2),
    note: 'thrown against the slab at STRIKE, slid down beside the van at SOFTEN; sits slumped, right hand pressed to his left side; plate shattered (fragments strapped on)'},
  drone: {role: 'drone', pos: on(CREW_POS.drone.x, CREW_POS.drone.z), heading: 255, pose: 'crawl', look: DIRECTOR_HEAD,
    note: 'knocked down by the van (brow cut), crawling to him on hands and knees from the van door: crew.pilotSpec crawls her from this spot (at 186.4) to his left side; she takes his hand (189.45) and never lets go'},
  tether: {role: 'tether', pos: on(CREW_POS.tether.x, CREW_POS.tether.z), heading: H.tether, pose: 'standHeld', look: DIRECTOR_HEAD,
    held: {side: 'L', at: GRIP.tether, by: 'h_tether'}, note: 'disarmed, reel empty: held by the left wrist; strains toward him, gives up (184.6); later sinks to her knees, still held (208.6)'},
  decoy: {role: 'decoy', pos: on(CREW_POS.decoy.x, CREW_POS.decoy.z), heading: H.decoy, pose: 'kneelHandsUp', look: DIRECTOR_HEAD,
    held: {side: 'R', at: GRIP.decoy, by: 'h_decoy'}, note: 'tablet smashed and dropped: caught by the right wrist (181.0), let go when she yields (183.55): on her knees, both open hands raised'},
  flares: {role: 'flares', pos: on(CREW_POS.flares.x, CREW_POS.flares.z), heading: H.flares, pose: 'kneelArmLock', look: DIRECTOR_HEAD,
    held: {side: 'R', at: GRIP.flares, by: 'h_flares'}, note: 'out of flares: right arm locked up behind him, pressed down onto one knee; one last heave (184.3), head drops'},
  breaker: {role: 'breaker', pos: on(CREW_POS.breaker.x, CREW_POS.breaker.z), heading: H.breaker, pose: 'sitHurt', look: DIRECTOR_HEAD,
    held: {side: 'L', at: GRIP.breaker, by: 'h_breaker'}, note: 'leg gave way, forearm bleeding, breaker empty and dropped beside him: sits, a unit\'s hand on his shoulder; his hand shakes on the wound'},
  runner: {role: 'runner', pos: on(CREW_POS.runner.x, CREW_POS.runner.z), heading: H.runner, pose: 'lyingBack', look: DIRECTOR_HEAD,
    note: 'struck down in D4-2 and stayed down, alive: on his back, head turned toward the van; a unit stands over him; tries to rise once (214.8)'},
};

/** Where the drone pilot is (chest height) while she crawls in and settles at his side: the machines' attention. */
const PIL_Q = rel(DIRECTOR_SEAT, PLAN.deathHeading - 60, 0.9, 0, 0);
export const pilotMoving = (t: number): V3 => {
  const k = smooth((t - 186.4) / 3.0);
  const a = TB_CREW.drone.pos;
  return {x: lerp(a.x, PIL_Q.x, k), y: groundH(a.x, a.z) + 0.45 + 0.25 * smooth((t - 188.4) / 0.8), z: lerp(a.z, PIL_Q.z, k)};
};

// ------------------------------------------------------------------ the holders
export type Holder = {
  key: string; id: number; pos: V3; heading: number; side: 'L' | 'R'; at: V3; crouch: number; lean: number;
  /** the restraint closes at t0 (D4's grab times: when each one was caught) */
  t0: number;
  who: Role2 | null; look?: V3;
  /** lets go at this time (the decoy maker raising her hands) */
  release?: number;
  /** a second restraint: the other hand on a second body point from t0b (the flare carrier's shoulder) */
  second?: {t0: number; at: V3; press: number};
  /** bears down on the grip (0..1) */
  press?: number;
};
const holder = (key: string, id: number, who: Exclude<Role2, 'director' | 'drone' | 'runner'>, side: 'L' | 'R', back: number, right: number, t0: number, crouch = 0, lean = 6, o: Partial<Holder> = {}): Holder => {
  const c = TB_CREW[who];
  const p = rel(c.pos, c.heading, -back, right, 0);
  const at = c.held!.at;
  const toGrip = headingTo(p, at), dh = ((toGrip - c.heading + 540) % 360) - 180;
  return {key, id, pos: {x: p.x, y: 0, z: p.z}, heading: c.heading + dh * 0.4, side, at, crouch, lean, t0, who, ...o};
};
/** Units holding the Crew (t0s are D4's: when each one was caught during SOFTEN 179.3–183.3). */
export const TB_HOLDERS: Holder[] = [
  holder('h_tether', 7101, 'tether', 'R', 0.95, -0.25, SURRENDER.tether.held),
  holder('h_decoy', 7102, 'decoy', 'L', 0.85, 0.45, SURRENDER.decoy.held, 0, 6, {release: SURRENDER.decoy.release}),
  holder('h_flares', 7103, 'flares', 'R', 0.8, 0.0, SURRENDER.flares.held, 0.12, 10, {second: {t0: SURRENDER.flares.held, at: FLARES_SHOULDER, press: 0.5}, press: 0.3}),
  holder('h_breaker', 7104, 'breaker', 'L', 0.85, -0.1, SURRENDER.breaker.held, 0.32, 18, {press: 0.5}),
  // over the runner: no hold, it stands over him and watches him
  {key: 'h_runner', id: 7105, pos: {x: 19.0, y: 0, z: 6.6}, heading: 235, side: 'R', at: on(18.1, 7.6, 0.2), crouch: 0.05, lean: 14, t0: 1e9, who: null, look: on(18.1, 7.6, 0.2)},
];
/** Where H2 stands guard over the decoy maker after letting her go (a half step back, out of her reach). */
const H2_BACK = (() => {
  const h = TB_HOLDERS[1];
  const away = hv(headingTo(TB_CREW.decoy.pos, h.pos));
  return {x: h.pos.x + away.x * 0.45, y: 0, z: h.pos.z + away.z * 0.45};
})();
/** The runner's chest as he lifts on his elbow (H5 snaps to it). */
const RUNNER_UP = (t: number): V3 => on(18.15, 7.55, 0.25 + 0.3 * smooth((t - SURRENDER.runner.rise) / 0.5) * (1 - smooth((t - SURRENDER.runner.down) / 0.8)));

// ------------------------------------------------------------------ the ring
export type RingUnit = {id: number; pos: V3; heading: number; eye: 'cyan' | 'amber'; crouch: number};
const RING_C = {x: 11.4, z: 3.2};
const RING_AT: Record<number, {x: number; z: number}> = {
  7202: {x: 19.15, z: 9.86}, 7208: {x: 5.88, z: 12.42}, 7215: {x: 2.51, z: -2.25}, 7216: {x: 3.83, z: -4.8}, 7217: {x: 6.07, z: -6.03},
  7218: {x: 8.75, z: -6.84}, 7220: {x: 13.02, z: -7.28}, 7221: {x: 14.67, z: -6.42}, 7222: {x: 16.85, z: -5.04},
};
/** Inner ring: radius ~10.5 m round the van area, the heavy's sector (east) left open; even spacing (~2.3 m). */
export const TB_RING: RingUnit[] = (() => {
  const out: RingUnit[] = [];
  const n = 24;
  for (let i = 0; i < n; i++) {
    const a = 108 + (i / (n - 1)) * 300; // bearings 108° → 408° (clockwise through S, W, N), the gap ≈ 48°–108° (heavy)
    const r = 10.4 + (rnd(i * 7 + 3) - 0.5) * 0.8;
    let x = RING_C.x + Math.sin((a * Math.PI) / 180) * r, z = RING_C.z - Math.cos((a * Math.PI) / 180) * r;
    // behind him the ring holds along the ridge crest (≥ 11 m away): units on the slope right behind the slab would
    // stand in every high view of him from the west
    const dx = x - DIRECTOR_SEAT.x, dz = z - DIRECTOR_SEAT.z, dd = Math.hypot(dx, dz), b = ((Math.atan2(dx, -dz) * 180) / Math.PI + 360) % 360;
    if (b > 196 && b < 292 && dd < 11) { x = DIRECTOR_SEAT.x + (dx / dd) * 11; z = DIRECTOR_SEAT.z + (dz / dd) * 11; }
    // (set-checked: nudged ≤ 0.8 m clear of the leaning slabs and rubble chunks round the van, ≥ 0.75 m root clearance)
    const fix = RING_AT[7200 + i];
    if (fix) { x = fix.x; z = fix.z; }
    const toC = headingTo({x, z}, {x: RING_C.x - 2.5, z: RING_C.z + 0.6});
    out.push({id: 7200 + i, pos: {x, y: 0, z}, heading: toC + (rnd(i * 11) - 0.5) * 10, eye: 'cyan', crouch: 0});
  }
  return out;
})();
const OUTER_AT: Record<number, {x: number; z: number}> = {7301: {x: 23.01, z: 17.5}, 7304: {x: 2.44, z: 17.45}, 7306: {x: -7.0, z: 5.3}, 7309: {x: 2.1, z: -13.6}, 7310: {x: 10.98, z: -14.32}};
/** Outer cordon: radius ~17–19 m, kept on the street side of the frontage (FS0 / FN0) and clear of the wrecks. */
export const TB_OUTER: RingUnit[] = (() => {
  const out: RingUnit[] = [];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const a = 116 + (i / (n - 1)) * 290 + (rnd(i * 5) - 0.5) * 8;
    let r = 18.2 + (rnd(i * 13 + 1) - 0.5) * 2;
    let x = RING_C.x + Math.sin((a * Math.PI) / 180) * r, z = RING_C.z - Math.cos((a * Math.PI) / 180) * r;
    // east of the ridge the avenue's sidewalks end at the frontage (|z| < 19 for x > 13.5): hold inside them
    if (x > 12.5 && Math.abs(z) > 17.2) { const s = 17.2 / Math.abs(z); x = RING_C.x + (x - RING_C.x) * s; z *= s; r *= s; }
    // the burnt car on its roof (wreck_0, 24 −9) and its fuel spill: hold short of it
    if (Math.hypot(x - 24, z + 9) < 4.2) { x = RING_C.x + Math.sin((a * Math.PI) / 180) * 14.2; z = RING_C.z - Math.cos((a * Math.PI) / 180) * 14.2; }
    // (set-checked spots, ≥ 0.75 m root clearance from slabs, chunks and beams)
    const fix = OUTER_AT[7300 + i];
    if (fix) { x = fix.x; z = fix.z; }
    out.push({id: 7300 + i, pos: {x, y: 0, z}, heading: headingTo({x, z}, RING_C) + (rnd(i * 17) - 0.5) * 16, eye: 'cyan', crouch: 0});
  }
  return out;
})();

/**
 * Blocking steps during the pullback (film s): a few units close a gap or step onto the route over the ridge, one at a
 * time, guard up while they move, then 'ready' again. Walked on the gait at ≈ 1.2–1.3 m/s (ringCtl). `to` = where they stand after; `face` = what they keep facing.
 */
export const TB_STEPS: {id: number; t0: number; t1: number; to: V3; face: V3; note: string}[] = [
  {id: 7308, t0: 203.9, t1: 206.0, to: {x: -2.25, y: 0, z: -5.5}, face: {x: 6.5, y: 0, z: 2.0}, note: 'outer, north-west: down the ridge\'s north slope onto the way out over the rubble'},
  {id: 7216, t0: 205.2, t1: 207.3, to: {x: 5.13, y: 0, z: -2.41}, face: {x: 8.3, y: 0, z: 2.4}, note: 'inner, north: a step in toward the van'},
  {id: 7307, t0: 216.4, t1: 219.3, to: {x: -3.6, y: 0, z: 2.3}, face: {x: 6.7, y: 0, z: 3.3}, note: 'outer, west: onto the crest behind the slab'},
  {id: 7221, t0: 212.6, t1: 213.8, to: {x: 14.99, y: 0, z: -5.84}, face: {x: 12.3, y: 0, z: 0.6}, note: 'inner, north-east: in behind the tether operator as she sinks'},
  {id: 7302, t0: 218.7, t1: 220.6, to: {x: 15.5, y: 0, z: 14.9}, face: {x: 14.0, y: 0, z: 7.4}, note: 'outer, south-east: closes the gap past the runner'},
];
/** The ring units that turn to the drone pilot while she crawls in (attention snaps to her, tracks her, lets go). */
const PILOT_WATCH: Record<number, [number, number]> = {7214: [186.75, 189.9], 7216: [186.6, 190.4], 7218: [187.15, 189.6], 7210: [187.4, 190.2]};
/**
 * (R4) The machines notice the death: after his eyes close (196.6) five ring units (the three nearest on the ridge side, two on the south side the pullback starts from) turn
 * their heads to the pair, each at its own moment (0.3–1.0 s after) and for its own length (3.9–6.8 s), then go back to scanning — the
 * ring's response to the story beat, still there when the pullback first finds them (203–205). Never in unison; never a blow.
 */
const DEATH_WATCH: Record<number, [number, number]> = {7214: [197.05, 202.4], 7216: [196.9, 200.9], 7215: [197.3, 203.1], 7207: [197.4, 204.2], 7208: [197.6, 201.5]};
/** Ring units that snap to the runner when he tries to rise. */
const RUNNER_WATCH = new Set([7200, 7201, 7302]);
/** Ring units that turn to the tether operator as she sinks. */
const TETHER_WATCH = new Set([7222, 7223]);

/**
 * Second heavy: east of the van, facing him, ram at rest. It rammed from 0.6 m further west (16.4, 3.0) and took one
 * slow step back as the ram recovered (D4 178.9–180.4).
 */
export const TB_HEAVY2 = {id: 7401, pos: {x: 17.0, y: 0, z: 3.0} as V3, heading: 270, look: DIRECTOR_HEAD, eye: 'amber' as const,
  /** where its ram tip met the Director's plate at STRIKE (he was planted in front of the drone pilot, by the van) */
  strikePoint: {x: 9.67, y: 1.43, z: 3.31} as V3};
/** The first heavy's wreck across the crater (fallback for D3's: knee broken at t0, topples south into the crater). */
export const TB_HEAVY1 = {id: 7402, pos: {x: 60.5, y: 0, z: -11.5} as V3, heading: 262, kneeBreak: {t0: M.HEAVY_DOWN - 1.5, leg: 0 as const, dir: {x: 0.1, y: 0, z: 1} as V3},
  pinned: {t0: 121.6, leg: 1 as const}};

/** Units the Crew downed in D4 (the Director smashed through two at ARRIVAL; one tripped by the wrapped cable). */
export const TB_WRECKS: {id: number; pos: V3; heading: number; fall: {t0: number; dir: V3; ang?: number}; damage?: UnitSpec['damage']; note: string}[] = [
  {id: 7501, pos: {x: 13.4, y: 0, z: -3.0}, heading: 250, fall: {t0: 163.4, dir: {x: 0.85, y: 0, z: -0.5}, ang: 90}, damage: {chest: {t0: 163.3, dir: {x: 0.9, y: 0.3, z: -0.4}, speed: 3}, dead: {t0: 163.6}}, note: 'smashed by the Director (ARRIVAL), chest plate off'},
  {id: 7502, pos: {x: 15.0, y: 0, z: 3.9}, heading: 275, fall: {t0: 164.5, dir: {x: 0.85, y: 0, z: 1}}, damage: {armOff: {side: 'L', t0: 164.4, dir: {x: 0.5, y: 0.4, z: 1}, speed: 3}, dead: {t0: 164.8}}, note: 'arm torn off by the breaker\'s club: falls away from it to the south-south-east (clear of heavy 2\'s front-left foot)'},
  {id: 7503, pos: {x: 16.8, y: 0, z: -2.6}, heading: 265, fall: {t0: 165.1, dir: {x: 0.3, y: 0, z: -1}}, damage: {dead: {t0: 165.4}}, note: 'legs wrapped by the tether cable, toppled'},
];

/** Drones: four hover low over the ring, four in the smoke over the avenue (stopped as one: they hold their place). */
export const TB_DRONES: {id: number; pos: V3; heading: number; look: V3; eye: 'cyan' | 'amber'}[] = [
  {id: 7601, pos: {x: 6.2, y: 5.6, z: 9.4}, heading: 20, look: DIRECTOR_HEAD, eye: 'amber'},
  {id: 7602, pos: {x: 14.5, y: 6.4, z: -3.8}, heading: 240, look: on(12.3, 0.5, 1), eye: 'cyan'},
  {id: 7603, pos: {x: 3.2, y: 9.2, z: -2.6}, heading: 110, look: DIRECTOR_HEAD, eye: 'cyan'},
  {id: 7604, pos: {x: 17.4, y: 7.6, z: 10.2}, heading: 300, look: on(14, 7.3, 1), eye: 'cyan'},
  {id: 7605, pos: {x: 38, y: 21, z: -9}, heading: 270, look: on(10, 3, 0), eye: 'cyan'},
  {id: 7606, pos: {x: 66, y: 29, z: 7}, heading: 265, look: on(10, 3, 0), eye: 'cyan'},
  {id: 7607, pos: {x: 52, y: 16, z: 13}, heading: 280, look: on(30, 5, 0), eye: 'cyan'},
  {id: 7608, pos: {x: 94, y: 34, z: -12}, heading: 268, look: on(40, 0, 0), eye: 'cyan'},
];

// ------------------------------------------------------------------ specs at film time T
const G = (x: number, z: number) => groundH(x, z);
/** Slight idle after the halt: only sensors and weight shift. */
const IDLE = 0.18;
/** When a ring unit lowers into 'ready' (seeded 184.95–186.85: after D4 has set every one of them in its slot). */
export const readyAt = (id: number) => stagger(id, 185.9, 1.9, 1);
/** When it starts scanning its sector. */
const scanAt = (id: number) => stagger(id, 188.3, 3.0, 2);

const ringCtl = (u: RingUnit, T: number): Partial<UnitSpec> => {
  const id = u.id;
  const posture: [number, Posture][] = [[readyAt(id), 'ready']];
  const attend: AttendSpec[] = [];
  const moves: MoveSpec[] = [];
  const pw = PILOT_WATCH[id];
  if (pw) attend.push({t0: pw[0], t1: pw[1], at: pilotMoving});
  const dw = DEATH_WATCH[id];
  if (dw) attend.push({t0: dw[0], t1: dw[1], at: on(PIL_Q.x, PIL_Q.z, 0.75)});
  if (RUNNER_WATCH.has(id)) attend.push({t0: stagger(id, SURRENDER.runner.rise + 0.35, 0.4, 4), t1: SURRENDER.runner.down + 0.9 + rnd(id) * 0.6, at: RUNNER_UP});
  if (TETHER_WATCH.has(id)) attend.push({t0: stagger(id, SURRENDER.tether.sink + 0.3, 0.5, 5), t1: SURRENDER.tether.sunk + 1.4 + rnd(id) * 0.8, at: on(12.3, 0.5, 0.9)});
  const st = TB_STEPS.find((s) => s.id === id);
  let heading = u.heading;
  let walk: Partial<UnitSpec> = {};
  if (st) {
    // walked on the gait (planted feet, a real stride; the kit's `moves` solver strides too fast for 2–4 m): the heading
    // eases round to the line of travel as it sets off, and at the far end it turns to face with planted pivot steps
    const L = Math.hypot(st.to.x - u.pos.x, st.to.z - u.pos.z), hT = headingTo(u.pos, st.to);
    const wrapD = (a: number) => ((a + 540) % 360) - 180;
    if (T >= st.t0 && T < st.t1) {
      const hd = u.heading + wrapD(hT - u.heading) * smooth((T - st.t0) / 0.45);
      const f = hv(hT);
      const path: Path = (dd) => ({pos: {x: u.pos.x + f.x * dd, y: 0, z: u.pos.z + f.z * dd}, heading: hd});
      walk = {gait: {path, dist: L * smooth((T - st.t0) / (st.t1 - st.t0)), start: 0, end: L}};
    } else if (T >= st.t1) {
      walk = {pos: st.to, turns: [{t0: st.t1 + 0.05, to: st.face}]};
      heading = hT;
    }
    posture.push([st.t0 - 0.25, 'guard'], [st.t1 + 0.3, 'ready']);
  }
  // the outer cordon watches outward-and-round (the city), the inner ring the survivors
  const outer = id >= 7300;
  const scan: ScanSpec = {t0: scanAt(id), center: outer ? undefined : {x: RING_C.x - 1.5, y: 1, z: RING_C.z + 1.5}, span: outer ? 90 : 55, dwell: 1.3, seed: id, torso: 0.2};
  void T;
  // (a little lower while it walks the ridge slope, eased: the downhill leg must not lock straight)
  const crouch = st ? 0.06 * win(T, st.t0 - 0.35, st.t1 + 0.6, 0.35, 0.6) : 0;
  return {posture, scan, attend: attend.length ? attend : undefined, moves: moves.length ? moves : undefined, heading, crouch: u.crouch + crouch, ...walk};
};

export const ringSpecs = (T: number): UnitSpec[] => [...TB_RING, ...TB_OUTER].map((u) => ({
  id: u.id, t: T, pos: u.pos, heading: u.heading, ground: G, eye: u.eye, idle: IDLE, crouch: u.crouch, key: `tb_u${u.id}`,
  ...ringCtl(u, T),
}));

/** The grip point may move (a held person straining, sinking): pass the person's own grip point as `grip`. */
export const holderSpecs = (T: number, grip?: (h: Holder, T: number) => V3): UnitSpec[] => TB_HOLDERS.map((h) => {
  const base: UnitSpec = {id: h.id, t: T, pos: h.pos, heading: h.heading, ground: G, eye: 'amber', idle: IDLE * 0.6, crouch: h.crouch, lean: h.lean, key: `tb_${h.key}`};
  if (!h.who) {
    // H5 over the runner: 'ready', watching him; when he tries to rise it snaps to him and steps in, guard up
    const r = SURRENDER.runner;
    const inTo = {x: 18.75, y: 0, z: 7.05};
    return {...base, look: h.look, posture: [[158.0, 'ready'], [r.rise + 0.1, 'guard'], [r.down + 0.7, 'ready']],
      attend: [{t0: r.rise + 0.08, t1: r.down + 1.2, at: RUNNER_UP}],
      moves: [{t0: r.rise + 0.25, t1: r.rise + 0.95, to: inTo, face: on(18.1, 7.6), guard: true}],
      scan: {t0: 191.0, center: on(18.1, 7.6, 0.2), span: 40, dwell: 1.6, seed: h.id}};
  }
  const at = (t: number) => (grip ? grip(h, t) : h.at);
  // H3: ONE two-handed restraint from its grab — left hand on the locked wrist, right hand on his shoulder — so the
  // body's reach shift is shared by both hands from the first frame (a second restraint opening later would halve the
  // kit's averaged reach shift in one frame: a 17 cm pelvis jump)
  const restrain: RestrainSpec[] = h.second
    ? [{t0: h.t0, side: 'both', at, at2: h.key === 'h_flares' ? flaresShoulderAt : h.second.at, press: h.second.press}]
    : [{t0: h.t0, side: h.side, at, t1: h.release, press: h.press ?? 0}];
  const free: Posture = h.release ? 'ready' : 'lowered';
  const out: UnitSpec = {...base, restrain, posture: [[h.t0 + 0.6, free]]};
  if (h.release) {
    // H2: lets the decoy maker go as she yields, a half step back, weapon lowered but ready, watching her hands
    out.moves = [{t0: h.release + 0.15, t1: h.release + 0.95, to: H2_BACK, face: TB_CREW.decoy.pos}];
    out.attend = [{t0: h.release - 0.1, t1: SURRENDER.decoy.lower + 1.2, at: on(TB_CREW.decoy.pos.x, TB_CREW.decoy.pos.z, 1.05)}];
    out.scan = {t0: SURRENDER.decoy.lower + 1.0, center: on(TB_CREW.decoy.pos.x, TB_CREW.decoy.pos.z, 0.8), span: 50, dwell: 1.5, seed: h.id};
  }
  if (h.key === 'h_tether') {
    // as she sinks to her knees H1's grip follows her wrist down; it lowers with her (the restraint's reach)
    out.look = on(12.3, 0.5, 0.95);
  }
  return out;
});

/**
 * W1 (7501) stood and fell on low rubble (set chunks sch_11/sch_31 at its feet, sch_9 under its head): its ground is
 * the street plus those chunks, so its feet stand on them and the wreck lies on them instead of sinking through.
 */
const W1_RUBBLE = [{x: 13.35, z: -3.02, r: 0.5, h: 0.27}, {x: 13.32, z: -3.25, r: 0.72, h: 0.34}, {x: 15.33, z: -4.51, r: 0.8, h: 0.3}];
export const w1Ground = (x: number, z: number): number =>
  G(x, z) + Math.max(0, ...W1_RUBBLE.map((c) => c.h * clamp(1 - ((x - c.x) ** 2 + (z - c.z) ** 2) / (c.r * c.r))));
export const wreckSpecs = (T: number): UnitSpec[] => TB_WRECKS.map((w) => ({
  id: w.id, t: T, pos: w.pos, heading: w.heading, ground: w.id === 7501 ? w1Ground : G, fall: w.fall, damage: w.damage, idle: 0, key: `tb_w${w.id}`,
  // W1's fight (strikes, guard, blows) shapes where its torn plate and fluid land: the same object D4 animates
  ...(w.id === 7501 ? W1_FIGHT : {}),
}));

/**
 * (R4) Heavy 2 carries its ram up once the killing is done (189 → 192.5, while every camera is on the pair): at rest the tip
 * hung 0.13 m in front of the van's nose (R3: it read as touching it from the first wides of the pullback, 209–215). Raised
 * ~25° the tip is 3.9 m up and 1.4 m above the cab roof, still pointed at them. Zero up to FINAL_HIT (D4's last frame).
 */
export const HEAVY2_RAM_CARRY = (T: number) => 0.4 * smooth((T - 189.0) / 3.5);
export const heavy2Spec = (T: number): HeavySpec => ({id: TB_HEAVY2.id, t: T, pos: TB_HEAVY2.pos, heading: TB_HEAVY2.heading, look: TB_HEAVY2.look, eye: TB_HEAVY2.eye, ground: G, key: 'tb_heavy2', ramCarry: HEAVY2_RAM_CARRY(T)});
export const heavy1Spec = (T: number): HeavySpec => ({id: TB_HEAVY1.id, t: T, pos: TB_HEAVY1.pos, heading: TB_HEAVY1.heading, kneeBreak: TB_HEAVY1.kneeBreak, pinned: TB_HEAVY1.pinned, eye: 'off', ground: G, key: 'tb_heavy1'});

/** The diver (7601) watches the drone pilot while she crawls in, then (201.5–206.5) drifts up and west over the
 *  ridge slope to a higher watch over the pair (out of the pullback's line to the van door); the others hold. */
export const DRONE_7601_MOVE = {t0: 201.5, t1: 206.5, to: {x: 2.6, y: 7.2, z: 7.4} as V3};
export const droneSpecs = (T: number): DroneSpec[] => TB_DRONES.map((d) => {
  const w = d.id === 7601 ? smooth((T - 186.5) / 0.5) * (1 - smooth((T - 190.2) / 1.2)) : 0;
  const look = w > 0 ? {x: lerp(d.look.x, pilotMoving(T).x, w), y: lerp(d.look.y, pilotMoving(T).y, w), z: lerp(d.look.z, pilotMoving(T).z, w)} : d.look;
  if (d.id !== 7601) return {id: d.id, t: T, pos: d.pos, heading: d.heading, look, eye: d.eye, ground: G, key: `tb_d${d.id}`};
  const m = DRONE_7601_MOVE, k = smooth((T - m.t0) / (m.t1 - m.t0));
  const pos = {x: lerp(d.pos.x, m.to.x, k), y: lerp(d.pos.y, m.to.y, k), z: lerp(d.pos.z, m.to.z, k)};
  const sp = k > 0 && k < 1 ? 1 / (m.t1 - m.t0) : 0;
  const vel = {x: (m.to.x - d.pos.x) * sp * 1.5 * Math.sin(Math.PI * k), y: 0, z: (m.to.z - d.pos.z) * sp * 1.5 * Math.sin(Math.PI * k)};
  return {id: d.id, t: T, pos, heading: d.heading, vel, look, eye: d.eye, ground: G, key: `tb_d${d.id}`};
});

// ------------------------------------------------------------------ the avenue: a halted reserve block and the streams
/** A block halted in the avenue between the bus and the first cross street (facing west), clear of the bus, the burnt
 *  car wreck_2 and the old rail column gcol_1. */
export const TB_RESERVE: Slot[] = (() => {
  const out: Slot[] = [];
  const perRow = 9, rows = 4;
  for (let row = 0; row < rows; row++) for (let i = 0; i < perRow; i++) {
    const id = 7700 + row * perRow + i;
    if (rnd(id * 3) < 0.08) continue;
    const z = (i - (perRow - 1) / 2) * 2.4 + (row % 2) * 1.2 + (rnd(id * 5) - 0.5) * 0.4;
    const x = 100.6 + row * 2.6 + (rnd(id * 7) - 0.5) * 0.5;
    if (Math.hypot(x - 105, z + 11) < 1.6) continue; // gcol_1
    out.push({id, pos: {x, y: 0, z}, heading: 270 + (rnd(id * 11) - 0.5) * 6});
  }
  return out;
})();

type P2 = {x: number; z: number};
/** Polyline path (heading follows the segment, corners rounded over `turn` m). Pure (mirrors mech/kit polyPathFn). */
const polyPath = (pts: P2[], turn = 6): Path => {
  const segs = pts.slice(1).map((p, i) => ({a: pts[i], b: p, L: Math.max(1e-6, Math.hypot(p.x - pts[i].x, p.z - pts[i].z))}));
  const total = segs.reduce((s, q) => s + q.L, 0);
  const wrap = (a: number) => ((a + 540) % 360) - 180;
  return (d) => {
    let r = clamp(d, -1e4, total);
    if (r < 0) { const s = segs[0]; const h = headingTo(s.a, s.b); const f = hv(h); return {pos: {x: s.a.x + f.x * r, y: 0, z: s.a.z + f.z * r}, heading: h}; }
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (r <= s.L || i === segs.length - 1) {
        const u = clamp(r / s.L);
        let h = headingTo(s.a, s.b);
        if (i < segs.length - 1 && s.L - r < turn) h += wrap(headingTo(segs[i + 1].a, segs[i + 1].b) - h) * smooth(1 - (s.L - r) / turn) * 0.5;
        if (i > 0 && r < turn) h -= wrap(h - headingTo(segs[i - 1].a, segs[i - 1].b)) * smooth(1 - r / turn) * 0.5;
        return {pos: {x: s.a.x + (s.b.x - s.a.x) * u, y: 0, z: s.a.z + (s.b.z - s.a.z) * u}, heading: h};
      }
      r -= s.L;
    }
    return {pos: {...pts[pts.length - 1], y: 0}, heading: 0};
  };
};
/** A quarter turn from westbound into the cross street at x = cx (north: sgn −1, south: +1) on an arc of radius R. */
const cornerPts = (cx: number, z0: number, sgn: 1 | -1, R: number, n = 8): P2[] => {
  const c = {x: cx + R, z: z0 + sgn * R};
  return Array.from({length: n + 1}, (_, i) => {
    const a = (i / n) * (Math.PI / 2);
    return {x: c.x - Math.sin(a) * R, z: c.z - sgn * Math.cos(a) * R};
  });
};

type Stream = {path: Path; lanes: number; laneGap: number; spacing: number; speed: number; ranks: number; headAtT0: number; seed: number};
/**
 * Two columns stream west along the avenue and turn into the first cross street (x ≈ 123) on a rounded corner
 * (R 8.5 m): the north column up its west half (clear of the corner lamp lamp_4 at x 126), the south column down its
 * middle (clear of the debris heap on the west kerb and of FS3's corner).
 */
export const TB_STREAMS: Stream[] = [
  {path: polyPath([{x: 640, z: -6.5}, ...cornerPts(121.8, -6.5, -1, 8.5), {x: 121.8, z: -170}], 2), lanes: 3, laneGap: 2.45, spacing: 3.0, speed: 1.3, ranks: 140, headAtT0: 556, seed: 81},
  {path: polyPath([{x: 640, z: 6.5}, ...cornerPts(124.6, 6.5, 1, 8.5), {x: 124.6, z: 170}], 2), lanes: 3, laneGap: 2.45, spacing: 3.0, speed: 1.3, ranks: 140, headAtT0: 546, seed: 82},
];
const ramp = (u: number, d: number) => (u <= 0 ? 0 : u >= d ? u - d / 2 : (u * u * u) / (d * d) - (u * u * u * u) / (2 * d * d * d));
/** Lanes on the avenue's straight are steered round every street obstacle (plan.ts steerAround: abandoned cars, the
 *  rail columns, the bus); in the turn and the cross street they keep their own line. */
const STEER_X = 136;
const laneAt = (S: Stream, latOff: number) => {
  const raw = (d: number): V3 => {
    const q = S.path(d);
    const h = (q.heading * Math.PI) / 180;
    const x = q.pos.x + Math.cos(h) * latOff, z = q.pos.z + Math.sin(h) * latOff;
    if (x < STEER_X || Math.abs(z) > 14) return {x, y: 0, z};
    // blended in over 6 m past the turn so the lane does not kink where the steering starts
    const w = smooth((x - STEER_X) / 6);
    return {x, y: 0, z: lerp(z, steerAround(x, z, 0.9), w)};
  };
  const lp: Path = (d) => {
    const p = raw(d), a = raw(d - 0.5), b = raw(d + 0.5);
    return {pos: p, heading: headingTo(a, b)};
  };
  return lp;
};

/**
 * The streams as a Formation (slots carry path + dist so feet stay planted). Before T0 they walk; on T0 every unit
 * finishes its step and stops; from STREAM_RESUME they move on, rank by rank (a ripple 0.06 s per rank).
 */
export const streamForm = (o: {resume?: number} = {}): Formation => {
  const lanesCache = new Map<number, Path>();
  return {
    slots: (t: number) => {
      const resume = o.resume ?? STREAM_RESUME;
      const out: Slot[] = [];
      TB_STREAMS.forEach((S) => {
        const settle = 0.42 * S.speed;
        for (let i = 0; i < S.ranks * S.lanes; i++) {
          const lane = i % S.lanes, rank = Math.floor(i / S.lanes);
          const id = 8000 + S.seed * 1000 + i;
          if (rnd(id * 13 + 5) < 0.07) continue;
          const jit = (rnd(id * 3) - 0.5) * S.spacing * 0.4;
          const base = S.headAtT0 - rank * S.spacing + jit; // path distance at T0 (before the settle)
          if (base < -40) continue;
          const latOff = (lane - (S.lanes - 1) / 2) * S.laneGap + (rnd(id * 5) - 0.5) * S.laneGap * 0.3;
          let lp = lanesCache.get(id);
          if (!lp) lanesCache.set(id, (lp = laneAt(S, latOff)));
          const rs = resume + rank * 0.06;
          let d: number, ctl: Partial<UnitSpec>;
          if (t < T0) { d = base - (T0 - t) * S.speed; ctl = {}; }
          else if (t < rs) { d = base + settle * smooth((t - T0) / 0.7); ctl = {gaitEnd: base + settle}; }
          else { d = base + settle + S.speed * ramp(t - rs, 1.6); ctl = {gaitStart: base + settle}; }
          const q = lp(d);
          out.push({id, pos: q.pos, heading: q.heading, path: lp, dist: d, ctl});
        }
      });
      return out;
    },
  };
};

// ------------------------------------------------------------------ the intersections the machines take (F1)
/**
 * Posts at each HOLD_POINT (world/plan.ts), facing out, clear of the streams' lanes and the set's dressing (checked
 * against the set's solids). x1 — where the columns turn — is already held when the camera finds it: posts on the
 * corners and beside the turning columns in both cross-street mouths. x2 and x3 are TAKEN during the rise: each squad
 * walks in single file down its cross street from 60 m out and fans out to the mouths and corners (the nearer one
 * first), then stands 'ready', scanning.
 */
type Post = {x: number; z: number; h: number};
const POSTS: Record<string, Post[]> = {
  x1: [
    {x: 114.0, z: -15.2, h: 300}, {x: 113.2, z: 16.4, h: 240}, {x: 135.6, z: -17.4, h: 60}, {x: 135.6, z: 16.4, h: 120},
    {x: 129.2, z: -26.0, h: 290}, {x: 129.8, z: -32.5, h: 270}, {x: 117.4, z: -27.5, h: 80}, {x: 130.3, z: 26.5, h: 250}, {x: 130.8, z: 33.0, h: 270}, {x: 117.6, z: 33.0, h: 100},
  ],
  x2: [
    {x: 258.0, z: -24, h: 0}, {x: 262.0, z: -25, h: 0}, {x: 265.5, z: -24, h: 0},
    {x: 258.0, z: 24, h: 180}, {x: 262.0, z: 25, h: 180}, {x: 265.5, z: 24, h: 180},
    {x: 273.6, z: -17.4, h: 45}, {x: 250.6, z: 17.8, h: 225}, {x: 273.6, z: 17.6, h: 135},
  ],
  x3: [
    {x: 416.0, z: -24, h: 0}, {x: 420.0, z: -25, h: 0}, {x: 423.5, z: -24, h: 0},
    {x: 416.0, z: 24, h: 180}, {x: 420.0, z: 25, h: 180}, {x: 423.5, z: 24, h: 180},
    {x: 408.6, z: -17.6, h: 315}, {x: 431.4, z: -17.6, h: 45}, {x: 408.6, z: 17.6, h: 225}, {x: 431.4, z: 17.6, h: 135},
  ],
};
/** When each squad has taken its intersection (x1: before the camera finds it). */
const HOLD_ARRIVE: Record<string, number> = {x1: 196.0, x2: 219.6, x3: 222.2};
export type HoldUnit = {id: number; hold: string; post: V3; heading: number; route: P2[]; t0: number; t1: number};
export const TB_HOLDS: HoldUnit[] = (() => {
  const out: HoldUnit[] = [];
  HOLD_POINTS.forEach((hp, k) => {
    const posts = POSTS[hp.id] ?? [];
    posts.forEach((p, i) => {
      const id = 9000 + k * 100 + i;
      // down the cross street on the post's side, in the street's middle third, then out to the post
      const sz = p.z < 0 ? -1 : 1;
      if (k === 0) { out.push({id, hold: hp.id, post: {x: p.x, y: 0, z: p.z}, heading: p.h, route: [p, p, p], t0: -1e9, t1: -1e9}); return; }
      // corner posts: out of the cross street onto the avenue's sidewalk first, then along it
      const lane = hp.x + clamp(p.x - hp.x, -4, 3.5), corner = Math.abs(p.z) < 20;
      const route: P2[] = [{x: lane, z: sz * 62}, {x: lane, z: sz * (corner ? 16.6 : 23)}, {x: p.x, z: p.z}];
      const L = Math.hypot(route[1].x - route[0].x, route[1].z - route[0].z) + Math.hypot(route[2].x - route[1].x, route[2].z - route[1].z);
      const t1 = HOLD_ARRIVE[hp.id] + i * 0.55 + rnd(id) * 0.7;
      out.push({id, hold: hp.id, post: {x: p.x, y: 0, z: p.z}, heading: p.h, route, t0: t1 - L / 1.45, t1});
    });
  });
  return out;
})();
/** The intersection squads as a Formation: walking in (planted gait), then at the post, turned out, 'ready', scanning. */
export const holdForm = (): Formation => {
  const paths = new Map<number, {path: Path; L: number}>();
  return {
    slots: (t: number) => TB_HOLDS.map((h) => {
      let pp = paths.get(h.id);
      if (!pp) {
        const r = h.route;
        paths.set(h.id, (pp = {path: polyPath(r, 1.2), L: Math.hypot(r[1].x - r[0].x, r[1].z - r[0].z) + Math.hypot(r[2].x - r[1].x, r[2].z - r[1].z)}));
      }
      const ctl: Partial<UnitSpec> = {posture: [[h.t1 + 0.3, 'ready']], scan: {t0: h.t1 < 0 ? 186 + rnd(h.id) * 3 : h.t1 + 1.4, span: 80, dwell: 1.6, seed: h.id}};
      if (h.t1 < 0) return {id: h.id, pos: h.post, heading: h.heading, ctl};
      if (t < h.t1) {
        const d = clamp((t - h.t0) / (h.t1 - h.t0)) * pp.L;
        const q = pp.path(d);
        return {id: h.id, pos: q.pos, heading: q.heading, path: pp.path, dist: d, ctl: {...ctl, gaitStart: -1e9, gaitEnd: pp.L}};
      }
      // at the post: turn out with planted pivot steps
      const arrH = pp.path(pp.L - 0.01).heading;
      return {id: h.id, pos: h.post, heading: arrH, ctl: {...ctl, turns: [{t0: h.t1 + 0.15, to: h.heading}]}};
    }),
  };
};

/** Everything the tableau puts in the world at film time T (machines as specs; Crew states are TB_CREW). */
export const tableauSpecs = (T: number) => ({units: [...ringSpecs(T), ...holderSpecs(T)], wrecks: wreckSpecs(T), heavies: [heavy2Spec(T)], heavy1: heavy1Spec(T), drones: droneSpecs(T)});

/** All tableau facts in one object (for D4 and for checks). */
export const TB = {T0, STREAM_RESUME, crew: TB_CREW, surrender: SURRENDER, holders: TB_HOLDERS, ring: TB_RING, outer: TB_OUTER, steps: TB_STEPS, reserve: TB_RESERVE, heavy2: TB_HEAVY2, heavy1: TB_HEAVY1, wrecks: TB_WRECKS, drones: TB_DRONES, streams: TB_STREAMS, holds: TB_HOLDS};
