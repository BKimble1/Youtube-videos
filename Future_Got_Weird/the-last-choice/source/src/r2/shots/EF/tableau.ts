// THE AFTERMATH TABLEAU — the state of the battlefield at FINAL_HIT (186.90), when every machine stops as one.
// PURE (no React): D4 imports this and must END in exactly this state; E/F (shots/EF) start from it and hold it.
//
//   TB.crew[role]        where each Crew member is at FINAL_HIT, facing what, in which body state, and who holds them
//   TB.holders           the units that hold a Crew member (grab side + the world grip point, shared with the person's
//                        hand/shoulder so the contact is one point), and the one standing over the runner
//   TB.ring / TB.outer   the ring of units around the van area (inner ring + a looser outer ring), facing in
//   TB.reserve           a block of units that halted in the avenue between the crater and the cross street
//   TB.heavy2            the second heavy, standing east of the van with its ram at rest (its ram struck the Director at
//                        STRIKE 177.76: the ram tip met his plate at TB.strikePoint and threw him back against the slab)
//   TB.heavy1            the first heavy's wreck lying across the crater (fell at HEAVY_DOWN 125.64; D3 owns the fall —
//                        if D3 registers its own wreck in PERSIST_D3, the EF shots draw that instead of this fallback)
//   TB.wrecks            units the Crew downed in D4 near the ridge foot (fallen, eyes off) — D4 makes them fall there
//   TB.drones            drones hovering: low over the ring and high in the smoke over the avenue
//   streamForm()         the formations streaming west along the avenue (halt as one at FINAL_HIT; they move on at
//                        STREAM_RESUME with a ripple back through each column, turning off into the cross street x=124)
//   *Spec(T) helpers     UnitSpec / HeavySpec / DroneSpec at film time T (all t0s in film seconds)
//
// HAND-OVER FOR D4 (what to import so D4's last frames ARE this state):
//   - Crew: shots/EF/crew.tsx — directorSpec(T) (slumped against the slab, right hand pressed to his left side, breath),
//     pilotSpec(T) (her crawl to him starts at 186.4 from TB_CREW.drone.pos: bring her there on hands and knees and
//     hand over to pilotSpec from 186.4), heldSpec(role, T) for tether/decoy/flares/breaker/runner, or all of them as
//     aftermathCrewItems(T). Valid from ~185 s on.
//   - Machines: shots/EF/machines.tsx — tableauMachineItems(view, T) (ring, holders, heavy 2, drones, D4 wrecks, the
//     avenue block and streams; heavy 1's wreck unless D3 registers one). Grabs close at TB_HOLDERS[i].t0 (D4's times).
//   - Positions/headings/t0s for animating INTO the state: TB (below).
//
// Geography (metres, x east, z south; see world/plan.ts): the Director sits against the broken slab at PLAN.deathPos
// (7.0, 3.4) facing ESE (120); the van is NE of him with its open side door (radio on the floor, RADIO ≈ (8.13, 0.88,
// 1.81)) facing him; the ridge rises behind him (crest x ≈ 0.4, 4.5 m); the avenue and the crater (x 62) lie east.
import type {V3} from '../../../kit/math';
import {clamp, smooth, rnd} from '../../../kit/math';
import {M} from '../../timing';
import {PLAN} from '../../world/plan';
import {groundH} from '../../world/ground';
import type {UnitSpec, HeavySpec, DroneSpec, Path, Slot, Formation} from '../../mech';
import type {Role2} from '../../rig/looks';

const on = (x: number, z: number, up = 0): V3 => ({x, y: groundH(x, z) + up, z});
const hv = (h: number) => ({x: Math.sin((h * Math.PI) / 180), z: -Math.cos((h * Math.PI) / 180)});
const headingTo = (a: {x: number; z: number}, b: {x: number; z: number}) => (Math.atan2(b.x - a.x, -(b.z - a.z)) * 180) / Math.PI;

/** When the tableau holds (film s). Before T0 it is D4's to animate; from T0 on it is still (slight idle only). */
export const T0 = M.FINAL_HIT;
/** The formations in the avenue move on (each column ripples back from its head). */
export const STREAM_RESUME = 207.0;

/**
 * The Director's seat: the figure's root (pelvis on the ground). It sits 0.32 m behind PLAN.deathPos (toward the slab)
 * so that, slumped back 27°, his shoulders rest on DEATH_SLAB's face (≈ 2–4 cm) and his head clears it — at
 * PLAN.deathPos itself his back would hang ~0.35 m in front of the slab.
 */
export const DIRECTOR_SEAT = on(PLAN.deathPos.x - hv(PLAN.deathHeading).x * 0.32, PLAN.deathPos.z - hv(PLAN.deathHeading).z * 0.32);
/** His head (slumped against the slab), for looks. */
export const DIRECTOR_HEAD: V3 = {x: DIRECTOR_SEAT.x - 0.2, y: DIRECTOR_SEAT.y + 0.9, z: DIRECTOR_SEAT.z - 0.17};

export type CrewPose =
  | 'slumped' // sitting against the slab, legs out, head down (the Director)
  | 'crawl' // on hands and knees, moving (the drone pilot reaching him)
  | 'standHeld' // standing, leaning toward him, one wrist held back by a unit
  | 'kneelHeld' // on one knee, one wrist held back/up by a unit, head bowed
  | 'sitHurt' // sitting on the ground, hurt left leg out, a unit's hand on the shoulder
  | 'lyingBack'; // on his back, alive (breathing, a hand moves)

export type CrewState = {
  role: Role2;
  pos: V3;
  heading: number;
  pose: CrewPose;
  /** which hand is held ('L' | 'R'), and the world grip point the holder's fist closes on (same point = one contact) */
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
  breaker: {x: 9.7, z: 7.95},
  runner: {x: 18.0, z: 7.7},
};
const faceDir = (p: {x: number; z: number}) => headingTo(p, PLAN.deathPos);

/** A point `back` metres behind someone (opposite their heading), `side` metres to their right, `up` above the ground. */
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
  // her right wrist held back at her side
  decoy: rel(CREW_POS.decoy, H.decoy, -0.36, 0.34, 0.62),
  // his right wrist twisted up behind his back (on one knee)
  flares: rel(CREW_POS.flares, H.flares, -0.3, 0.12, 0.74),
  // a hand pressing down on his left shoulder (sitting)
  breaker: rel(CREW_POS.breaker, H.breaker, -0.1, -0.2, 0.74),
};

export const TB_CREW: Record<Role2, CrewState> = {
  director: {role: 'director', pos: DIRECTOR_SEAT, heading: PLAN.deathHeading, pose: 'slumped', look: on(14, 6, 1.2),
    note: 'thrown against the slab at STRIKE, slid down beside the van at SOFTEN; sits slumped, right hand pressed to his left side; plate shattered (fragments strapped on)'},
  drone: {role: 'drone', pos: on(CREW_POS.drone.x, CREW_POS.drone.z), heading: 255, pose: 'crawl', look: DIRECTOR_HEAD,
    note: 'knocked down by the van (brow cut), crawling to him on hands and knees from the van door: crew.pilotSpec crawls her from this spot (at 186.4) to his left side; at FINAL_HIT she is a quarter of the way, still moving (E1 finishes the crawl)'},
  tether: {role: 'tether', pos: on(CREW_POS.tether.x, CREW_POS.tether.z), heading: H.tether, pose: 'standHeld', look: DIRECTOR_HEAD,
    held: {side: 'L', at: GRIP.tether, by: 'h_tether'}, note: 'disarmed, reel empty: standing, straining toward him, her left wrist held back by a unit'},
  decoy: {role: 'decoy', pos: on(CREW_POS.decoy.x, CREW_POS.decoy.z), heading: H.decoy, pose: 'kneelHeld', look: DIRECTOR_HEAD,
    held: {side: 'R', at: GRIP.decoy, by: 'h_decoy'}, note: 'tablet smashed (D3): forced down on one knee, right wrist held by a unit'},
  flares: {role: 'flares', pos: on(CREW_POS.flares.x, CREW_POS.flares.z), heading: H.flares, pose: 'kneelHeld', look: DIRECTOR_HEAD,
    held: {side: 'R', at: GRIP.flares, by: 'h_flares'}, note: 'out of flares: on one knee, right arm twisted up behind him by a unit, head bowed'},
  breaker: {role: 'breaker', pos: on(CREW_POS.breaker.x, CREW_POS.breaker.z), heading: H.breaker, pose: 'sitHurt', look: DIRECTOR_HEAD,
    held: {side: 'L', at: GRIP.breaker, by: 'h_breaker'}, note: 'leg hurt (limp), forearm bleeding, breaker empty and dropped: sits on the ground, a unit\'s hand pressing his shoulder'},
  runner: {role: 'runner', pos: on(CREW_POS.runner.x, CREW_POS.runner.z), heading: H.runner, pose: 'lyingBack', look: DIRECTOR_HEAD,
    note: 'struck down in D4-2 and stayed down, alive: on his back, head turned toward the van; a unit stands over him'},
};

// ------------------------------------------------------------------ the machines
export type Holder = {key: string; id: number; pos: V3; heading: number; side: 'L' | 'R'; at: V3; crouch: number; lean: number; t0: number; who: Role2 | null; look?: V3};
const holder = (key: string, id: number, who: Exclude<Role2, 'director' | 'drone' | 'runner'>, side: 'L' | 'R', back: number, right: number, t0: number, crouch = 0, lean = 6): Holder => {
  const c = TB_CREW[who];
  const p = rel(c.pos, c.heading, -back, right, 0);
  const at = c.held!.at;
  const toGrip = headingTo(p, at), dh = ((toGrip - c.heading + 540) % 360) - 180;
  return {key, id, pos: {x: p.x, y: 0, z: p.z}, heading: c.heading + dh * 0.4, side, at, crouch, lean, t0, who};
};
/** Units holding the Crew (grab t0s are D4's: when each one was caught during SOFTEN 179.3–183.3). */
export const TB_HOLDERS: Holder[] = [
  holder('h_tether', 7101, 'tether', 'R', 0.95, -0.25, 180.4),
  holder('h_decoy', 7102, 'decoy', 'L', 0.85, 0.45, 181.0),
  holder('h_flares', 7103, 'flares', 'R', 0.8, 0.0, 181.7, 0.12, 10),
  holder('h_breaker', 7104, 'breaker', 'L', 0.85, -0.1, 182.3, 0.32, 18),
  // over the runner: no grab, it stands and watches him
  {key: 'h_runner', id: 7105, pos: {x: 19.0, y: 0, z: 6.6}, heading: 235, side: 'R', at: on(18.1, 7.6, 0.2), crouch: 0.05, lean: 14, t0: 1e9, who: null, look: on(18.1, 7.6, 0.2)},
];

export type RingUnit = {id: number; pos: V3; heading: number; eye: 'cyan' | 'amber'; crouch: number};
const RING_C = {x: 11.4, z: 3.2};
/** Inner ring: radius ~10.5 m around the van area, leaving the heavy's sector (east) open. */
export const TB_RING: RingUnit[] = (() => {
  const out: RingUnit[] = [];
  const n = 24;
  for (let i = 0; i < n; i++) {
    const a = 108 + (i / (n - 1)) * 300; // bearings 108° → 408° (clockwise through S, W, N), the gap ≈ 48°–108° (heavy)
    const r = 10.4 + (rnd(i * 7 + 3) - 0.5) * 1.2;
    let x = RING_C.x + Math.sin((a * Math.PI) / 180) * r, z = RING_C.z - Math.cos((a * Math.PI) / 180) * r;
    // behind him the ring holds along the ridge crest (≥ 11 m away): units on the slope right behind the slab would
    // stand in every high view of him from the west
    const dx = x - DIRECTOR_SEAT.x, dz = z - DIRECTOR_SEAT.z, dd = Math.hypot(dx, dz), b = ((Math.atan2(dx, -dz) * 180) / Math.PI + 360) % 360;
    if (b > 196 && b < 292 && dd < 11) { x = DIRECTOR_SEAT.x + (dx / dd) * 11; z = DIRECTOR_SEAT.z + (dz / dd) * 11; }
    const toC = headingTo({x, z}, {x: RING_C.x - 2.5, z: RING_C.z + 0.6});
    out.push({id: 7200 + i, pos: {x, y: 0, z}, heading: toC + (rnd(i * 11) - 0.5) * 10, eye: 'cyan', crouch: 0});
  }
  return out;
})();
/** Outer ring: looser, radius ~19 m. */
export const TB_OUTER: RingUnit[] = (() => {
  const out: RingUnit[] = [];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const a = 116 + (i / (n - 1)) * 290 + (rnd(i * 5) - 0.5) * 10;
    const r = 19 + (rnd(i * 13 + 1) - 0.5) * 3;
    const x = RING_C.x + Math.sin((a * Math.PI) / 180) * r, z = RING_C.z - Math.cos((a * Math.PI) / 180) * r;
    out.push({id: 7300 + i, pos: {x, y: 0, z}, heading: headingTo({x, z}, RING_C) + (rnd(i * 17) - 0.5) * 16, eye: 'cyan', crouch: 0});
  }
  return out;
})();

/** Second heavy: east of the van, facing it, ram at rest (it recovered after STRIKE and stopped on FINAL_HIT). */
export const TB_HEAVY2 = {id: 7401, pos: {x: 20.2, y: 0, z: 2.2} as V3, heading: 262, look: DIRECTOR_HEAD, eye: 'amber' as const,
  /** where its ram tip met the Director's plate at STRIKE (he was in front of the drone pilot, by the van's front) */
  strikePoint: {x: 9.6, y: 1.35, z: 3.0} as V3};
/** The first heavy's wreck across the crater (fallback for D3's: knee broken at t0, topples south into the crater). */
export const TB_HEAVY1 = {id: 7402, pos: {x: 60.5, y: 0, z: -11.5} as V3, heading: 262, kneeBreak: {t0: M.HEAVY_DOWN - 1.5, leg: 0 as const, dir: {x: 0.1, y: 0, z: 1} as V3},
  pinned: {t0: 121.6, leg: 1 as const}};

/** Units the Crew downed in D4 (the Director smashed through two at ARRIVAL; one tripped by the wrapped cable). */
export const TB_WRECKS: {id: number; pos: V3; heading: number; fall: {t0: number; dir: V3}; damage?: UnitSpec['damage']; note: string}[] = [
  {id: 7501, pos: {x: 13.4, y: 0, z: -3.0}, heading: 250, fall: {t0: 163.4, dir: {x: 0.85, y: 0, z: -0.5}}, damage: {chest: {t0: 163.3, dir: {x: 0.9, y: 0.3, z: -0.4}, speed: 3}, dead: {t0: 163.6}}, note: 'smashed by the Director (ARRIVAL), chest plate off'},
  {id: 7502, pos: {x: 15.0, y: 0, z: 3.9}, heading: 275, fall: {t0: 164.5, dir: {x: 0.25, y: 0, z: 1}}, damage: {armOff: {side: 'L', t0: 164.4, dir: {x: 0.5, y: 0.4, z: 1}, speed: 3}, dead: {t0: 164.8}}, note: 'smashed by the Director, arm torn off'},
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
/** Slight idle after the halt: machines stand still as one; only sensors drift. */
const IDLE = 0.18;

export const ringSpecs = (T: number): UnitSpec[] => [...TB_RING, ...TB_OUTER].map((u) => ({
  id: u.id, t: T, pos: u.pos, heading: u.heading, ground: G, eye: u.eye, idle: IDLE, crouch: u.crouch, key: `tb_u${u.id}`,
}));

/** The grip point may move a little (a held person straining early in E1, then still). */
export const holderSpecs = (T: number, grip?: (h: Holder, T: number) => V3): UnitSpec[] => TB_HOLDERS.map((h) => ({
  id: h.id, t: T, pos: h.pos, heading: h.heading, ground: G, eye: 'amber', idle: IDLE * 0.6, crouch: h.crouch, lean: h.lean, key: `tb_${h.key}`,
  ...(h.who ? {grab: {t0: h.t0, side: h.side, target: h.at, hold: (t: number) => (grip ? grip(h, t) : h.at)}} : {look: h.look}),
}));

export const wreckSpecs = (T: number): UnitSpec[] => TB_WRECKS.map((w) => ({
  id: w.id, t: T, pos: w.pos, heading: w.heading, ground: G, fall: w.fall, damage: w.damage, idle: 0, key: `tb_w${w.id}`,
}));

export const heavy2Spec = (T: number): HeavySpec => ({id: TB_HEAVY2.id, t: T, pos: TB_HEAVY2.pos, heading: TB_HEAVY2.heading, look: TB_HEAVY2.look, eye: TB_HEAVY2.eye, ground: G, key: 'tb_heavy2'});
export const heavy1Spec = (T: number): HeavySpec => ({id: TB_HEAVY1.id, t: T, pos: TB_HEAVY1.pos, heading: TB_HEAVY1.heading, kneeBreak: TB_HEAVY1.kneeBreak, pinned: TB_HEAVY1.pinned, eye: 'off', ground: G, key: 'tb_heavy1'});

export const droneSpecs = (T: number): DroneSpec[] => TB_DRONES.map((d) => ({id: d.id, t: T, pos: d.pos, heading: d.heading, look: d.look, eye: d.eye, ground: G, key: `tb_d${d.id}`}));

// ------------------------------------------------------------------ the avenue: a halted reserve block and the streams
/** A block that halted in the avenue between the crater and the cross street (facing west). */
export const TB_RESERVE: Slot[] = (() => {
  const out: Slot[] = [];
  const perRow = 9, rows = 4;
  for (let row = 0; row < rows; row++) for (let i = 0; i < perRow; i++) {
    const id = 7700 + row * perRow + i;
    if (rnd(id * 3) < 0.08) continue;
    const z = (i - (perRow - 1) / 2) * 2.4 + (row % 2) * 1.2 + (rnd(id * 5) - 0.5) * 0.4;
    const x = 96 + row * 2.6 + (rnd(id * 7) - 0.5) * 0.5;
    out.push({id, pos: {x, y: 0, z}, heading: 270 + (rnd(id * 11) - 0.5) * 6});
  }
  return out;
})();

/** Polyline path (heading follows the segment, corners rounded over `turn` m). Pure (mirrors mech/kit polyPathFn). */
const polyPath = (pts: {x: number; z: number}[], turn = 6): Path => {
  const segs = pts.slice(1).map((p, i) => ({a: pts[i], b: p, L: Math.max(1e-6, Math.hypot(p.x - pts[i].x, p.z - pts[i].z))}));
  const total = segs.reduce((s, q) => s + q.L, 0);
  const hd = (a: {x: number; z: number}, b: {x: number; z: number}) => headingTo(a, b);
  const wrap = (a: number) => ((a + 540) % 360) - 180;
  return (d) => {
    let r = clamp(d, -1e4, total);
    if (r < 0) { const s = segs[0]; const h = hd(s.a, s.b); const f = hv(h); return {pos: {x: s.a.x + f.x * r, y: 0, z: s.a.z + f.z * r}, heading: h}; }
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (r <= s.L || i === segs.length - 1) {
        const u = clamp(r / s.L);
        let h = hd(s.a, s.b);
        if (i < segs.length - 1 && s.L - r < turn) h += wrap(hd(segs[i + 1].a, segs[i + 1].b) - h) * smooth(1 - (s.L - r) / turn) * 0.5;
        if (i > 0 && r < turn) h -= wrap(h - hd(segs[i - 1].a, segs[i - 1].b)) * smooth(1 - r / turn) * 0.5;
        return {pos: {x: s.a.x + (s.b.x - s.a.x) * u, y: 0, z: s.a.z + (s.b.z - s.a.z) * u}, heading: h};
      }
      r -= s.L;
    }
    return {pos: {...pts[pts.length - 1], y: 0}, heading: 0};
  };
};

type Stream = {path: Path; lanes: number; laneGap: number; spacing: number; speed: number; ranks: number; headAtT0: number; seed: number};
/** Two columns stream west along the avenue and split into the cross street at x = 124 (north and south). */
export const TB_STREAMS: Stream[] = [
  {path: polyPath([{x: 640, z: -6.5}, {x: 134, z: -6.5}, {x: 125, z: -24}, {x: 124, z: -170}]), lanes: 3, laneGap: 2.5, spacing: 2.8, speed: 1.3, ranks: 150, headAtT0: 560, seed: 81},
  {path: polyPath([{x: 640, z: 6.5}, {x: 140, z: 6.5}, {x: 126, z: 24}, {x: 124, z: 170}]), lanes: 3, laneGap: 2.5, spacing: 2.8, speed: 1.3, ranks: 150, headAtT0: 548, seed: 82},
];
const ramp = (u: number, d: number) => (u <= 0 ? 0 : u >= d ? u - d / 2 : (u * u * u) / (d * d) - (u * u * u * u) / (2 * d * d * d));

/**
 * The streams as a Formation (slots carry path + dist so feet stay planted). Before T0 they walk; on T0 every unit
 * finishes its step and stops; from STREAM_RESUME they move on, rank by rank (a ripple 0.06 s per rank).
 */
export const streamForm = (o: {resume?: number} = {}): Formation => ({
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
        const lp: Path = (d) => {
          const q = S.path(d);
          const h = (q.heading * Math.PI) / 180;
          return {pos: {x: q.pos.x + Math.cos(h) * latOff, y: 0, z: q.pos.z + Math.sin(h) * latOff}, heading: q.heading};
        };
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
});

/** Everything the tableau puts in the world at film time T (machines as specs; Crew states are TB_CREW). */
export const tableauSpecs = (T: number) => ({units: [...ringSpecs(T), ...holderSpecs(T)], wrecks: wreckSpecs(T), heavies: [heavy2Spec(T)], heavy1: heavy1Spec(T), drones: droneSpecs(T)});

/** All tableau facts in one object (for D4 and for checks). */
export const TB = {T0, STREAM_RESUME, crew: TB_CREW, holders: TB_HOLDERS, ring: TB_RING, outer: TB_OUTER, reserve: TB_RESERVE, heavy2: TB_HEAVY2, heavy1: TB_HEAVY1, wrecks: TB_WRECKS, drones: TB_DRONES, streams: TB_STREAMS};
