// Section B: THE ARMY — one reusable definition (pure: slots, paths, specs, times; no React, no continuity import).
// Sections C and D1 face the same army: import ARMY_B / HEAVIES_B / DRONES_B / armyRest() / B_HALT from here and draw
// with armyItems(view, T, ARMY_B, {ctl: armyCtl(T), …}), heavy(heavySpecB(i, T)), drone(droneSpecB(i, T)).
//
// The machines march west along the avenue (PLAN.enemyFront, the cross street at x 124 and 262) in LOCKSTEP: every
// unit's gait shares one distance function, so all feet strike together, and M.H1 / M.H2 are two consecutive
// footfalls of the whole army (cadence = H2 − H1). Eyes are dark while they come out of the smoke; at H1 they light
// in a ripple from the front rank backward. The army halts as one, in three waves on the music: the vanguard on H4,
// the main body and the cross-street columns on H5a, the heavies, the far columns and the drones on H5b. Each halt is
// a visible deceleration (velocity ramps to zero over two beats = one last step), the feet settle into a stance, and
// from then on they only idle. The vanguard's front rank stands on the crater's east rim (x ≈ 81), so from the ridge
// the smoke-filled crater lies between him and them.
//
// Lanes flow around the wrecks, the bus and the girder's columns (a smooth sideways deflection), and leave a hole
// around each heavy.
import {V3, clamp, rnd} from '../../../kit/math';
import {M} from '../../timing';
import {CADENCE, HALT, STOP} from './beats';
import type {Path, Slot, Formation, UnitSpec, HeavySpec, DroneSpec} from '../../mech';
import {groundH} from '../../world/ground';

const ground = (x: number, z: number) => groundH(x, z);

// ------------------------------------------------------------------ the march clock
/** metres of path per footfall (unit stride 1.5 m = two steps; heavy stride 3 m, four legs) */
export const STEP = 0.75;
/** seconds per footfall: H1 and H2 are consecutive steps of the whole army (see beats.ts) */
export {CADENCE};
export const SPEED = STEP / CADENCE; // ≈ 1.79 m/s
/** a halt: velocity ramps linearly to zero over two beats (exactly one last step, planted as the body stops) */
export const DECEL = 2 * CADENCE;
/** the three halt waves (film seconds): deceleration starts here (see beats.ts: the vanguard on H4, the main body
 * stops on H5a, the rear and the heavies on H5b) */
export const B_HALT = HALT;
export type Group = keyof typeof B_HALT;
/** standing still (the last step planted) */
export const stillAt = (g: Group) => STOP[g];
/** the settle after the last step: the body dips and comes back up (m of extra crouch) */
export const settleDip = (g: Group, T: number) => { const u = (T - STOP[g]) / 0.5; return u <= 0 || u >= 1 ? 0 : 0.06 * Math.sin(Math.PI * u) * (1 - 0.4 * u); };
/** the army's common march distance (0 at H1, a footfall) */
export const marchD = (T: number) => SPEED * (T - M.H1);
/** a group's march distance (decelerating after its halt) */
export const groupD = (g: Group, T: number) => {
  const Th = B_HALT[g];
  if (T <= Th) return marchD(T);
  const u = Math.min(1, (T - Th) / DECEL);
  return marchD(Th) + SPEED * DECEL * (u - (u * u) / 2);
};
/** the group's march distance at rest */
export const restD = (g: Group) => marchD(B_HALT[g]) + (SPEED * DECEL) / 2;
/** velocity factor 0..1 (1 = marching) */
export const groupV = (g: Group, T: number) => (T <= B_HALT[g] ? 1 : Math.max(0, 1 - (T - B_HALT[g]) / DECEL));

// ------------------------------------------------------------------ layout at rest (after the halts)
/** x of the vanguard's front rank at rest (the crater's east rim) */
export const VAN_FRONT_X = 81;
const VAN = {ranks: 6, perRank: 14, spacing: 1.75, rankGap: 2.4};
const MAIN = {frontX: 96.4, lanes: [-9.5, -5.7, -1.9, 1.9, 5.7, 9.5], rankGap: 2.5, backX: 236};
const CROSS1 = {x: 124, lanes: [-2.4, 0, 2.4], frontAbsZ: 17.2, rankGap: 2.4, ranks: 30};
const CROSS2 = {x: 262, lanes: [-2.4, 0, 2.4], frontAbsZ: 17.2, rankGap: 2.6, ranks: 22};
const FAR = {frontX: 244, lanes: [-9.5, -5.7, -1.9, 1.9, 5.7, 9.5], rankGap: 3.0, backX: 420};

/** Heavies at rest (they walk in the rear wave). B4's foreground heavy is HEAVIES_B[0]. */
export const HEAVIES_B: {id: number; rest: V3; heading: number}[] = [
  {id: 3101, rest: {x: 104, y: 0, z: -1}, heading: 270},
  {id: 3102, rest: {x: 128, y: 0, z: 8}, heading: 270},
  {id: 3103, rest: {x: 146, y: 0, z: -10}, heading: 270},
  {id: 3104, rest: {x: 172, y: 0, z: -6}, heading: 270},
  {id: 3105, rest: {x: 206, y: 0, z: 6}, heading: 270},
];

// ------------------------------------------------------------------ obstacles: lanes flow around them
type Cap = {ax: number; az: number; bx: number; bz: number; r: number};
const hv = (h: number) => ({x: Math.sin((h * Math.PI) / 180), z: -Math.cos((h * Math.PI) / 180)});
const capOf = (x: number, z: number, h: number, half: number, r: number): Cap => { const d = hv(h); return {ax: x - d.x * half, az: z - d.z * half, bx: x + d.x * half, bz: z + d.z * half, r}; };
// the set's wrecks on the avenue (world/set.tsx), the bus, the girder's columns
const OBST: Cap[] = [
  ...([[96, -6, 200], [118, 10, 10], [150, -3, 95], [178, 8, 250], [215, -10, 80], [290, 5, 120], [340, -8, 45], [380, 3, 170]] as [number, number, number][]).map(([x, z, h]) => capOf(x, z, h, 1.9, 1.0)),
  capOf(92, 9, 75, 5.6, 1.4),
  capOf(80, -5, 0, 0, 0.9), capOf(105, -11, 0, 0, 0.9), capOf(141, -11, 0, 0, 0.9),
];
const capDist = (c: Cap, x: number, z: number) => {
  const vx = c.bx - c.ax, vz = c.bz - c.az, L = vx * vx + vz * vz;
  const u = L > 0 ? clamp(((x - c.ax) * vx + (z - c.az) * vz) / L) : 0;
  return Math.hypot(x - c.ax - u * vx, z - c.az - u * vz) - c.r;
};
/** A westward lane's z at x: the lane line z0 pushed sideways around obstacles (monotonic in z0: lanes never cross). */
const laneZ = (z0: number, x: number) => {
  let z = z0;
  for (const c of OBST) {
    const x0 = Math.min(c.ax, c.bx), x1 = Math.max(c.ax, c.bx);
    const dx = x < x0 ? x0 - x : x > x1 ? x - x1 : 0;
    const b = Math.exp(-((dx / 5) ** 2));
    if (b < 0.01) continue;
    const u = x1 > x0 ? (clamp(x, x0, x1) - x0) / (x1 - x0) : 0;
    const zc = c.ax <= c.bx ? c.az + (c.bz - c.az) * u : c.bz + (c.az - c.bz) * u;
    const s = z0 >= zc ? 1 : -1;
    z += b * s * (c.r + 1.3) * Math.exp(-Math.abs(z0 - zc) / 5);
  }
  return clamp(z, -13.2, 13.2);
};

// ------------------------------------------------------------------ the units
export type ArmyUnit = {
  id: number; g: Group;
  /** the unit's own path (dist → position): at dist = restD(g) it stands at `rest` */
  path: Path; rest: V3; heading: number;
  /** film time its eye lights */
  eyeOn: number;
};

/** A westward lane path through rest point (xr, lane z0): dist increases toward the west. */
const westPath = (xr: number, z0: number, g: Group): Path => {
  const dR = restD(g);
  return (d) => {
    const x = xr - (d - dR);
    const z = laneZ(z0, x), z2 = laneZ(z0, x - 0.3);
    const heading = (Math.atan2(-0.3, -(z2 - z)) * 180) / Math.PI;
    return {pos: {x, y: 0, z}, heading: ((heading % 360) + 360) % 360};
  };
};
/** A cross-street path (moving along z toward the avenue, sign = +1 southward / −1 northward). */
const crossPath = (x: number, zr: number, sign: number, g: Group): Path => {
  const dR = restD(g);
  return (d) => ({pos: {x, y: 0, z: zr + sign * (d - dR)}, heading: sign > 0 ? 180 : 0});
};

/** the eye ripple: the front rank lights on H1, then rank after rank backward (and outward from the centre) */
export const eyeOnAt = (p: V3, id: number) => M.H1 + 0.03 + clamp((p.x - VAN_FRONT_X) * 0.0085, 0, 1.7) + Math.abs(p.z) * 0.004 + rnd(id * 17 + 3) * 0.05;

let UNITS: ArmyUnit[] | null = null;
const SAMPLE_T: number[] = Array.from({length: 46}, (_, i) => 15.5 + i * 0.5); // the span the army is on screen in B–C

const heavyPos = (h: (typeof HEAVIES_B)[number], T: number): V3 => ({x: h.rest.x - (groupD('rear', T) - restD('rear')), y: 0, z: h.rest.z});

const build = (): ArmyUnit[] => {
  const out: ArmyUnit[] = [];
  const add = (id: number, g: Group, path: Path) => {
    const q = path(restD(g));
    out.push({id, g, path, rest: q.pos, heading: q.heading, eyeOn: eyeOnAt(q.pos, id)});
  };
  // vanguard: 4 ranks of 12 across the roadway
  for (let r = 0; r < VAN.ranks; r++) for (let i = 0; i < VAN.perRank; i++) {
    const id = 2000 + r * 100 + i;
    const z0 = (i - (VAN.perRank - 1) / 2) * VAN.spacing + (r % 2 ? VAN.spacing * 0.5 : 0) + (rnd(id * 3) - 0.5) * 0.3;
    add(id, 'van', westPath(VAN_FRONT_X + r * VAN.rankGap + (rnd(id * 5) - 0.5) * 0.2, clamp(z0, -12.4, 12.4), 'van'));
  }
  // main body: six lanes from the bus back to x ≈ 236
  MAIN.lanes.forEach((z0, li) => {
    for (let x = MAIN.frontX + (li % 2) * 1.2, r = 0; x < MAIN.backX; x += MAIN.rankGap, r++) {
      const id = 4000 + li * 200 + r;
      if (rnd(id * 13 + 5) < 0.05) continue; // a few places empty
      add(id, 'main', westPath(x + (rnd(id * 7) - 0.5) * 0.25, z0 + (rnd(id * 11) - 0.5) * 0.3, 'main'));
    }
  });
  // cross street x 124: columns from the north and the south, halted at the avenue's edge
  [-1, 1].forEach((side, si) => CROSS1.lanes.forEach((dx, li) => {
    for (let r = 0; r < CROSS1.ranks; r++) {
      const id = 6000 + si * 1000 + li * 100 + r;
      if (rnd(id * 13 + 5) < 0.05) continue;
      add(id, 'main', crossPath(CROSS1.x + dx + (rnd(id * 7) - 0.5) * 0.25, side * (CROSS1.frontAbsZ + r * CROSS1.rankGap), -side, 'main'));
    }
  }));
  // cross street x 262 and the far avenue: the rear wave
  [-1, 1].forEach((side, si) => CROSS2.lanes.forEach((dx, li) => {
    for (let r = 0; r < CROSS2.ranks; r++) {
      const id = 8000 + si * 1000 + li * 100 + r;
      if (rnd(id * 13 + 5) < 0.06) continue;
      add(id, 'rear', crossPath(CROSS2.x + dx, side * (CROSS2.frontAbsZ + r * CROSS2.rankGap), -side, 'rear'));
    }
  }));
  FAR.lanes.forEach((z0, li) => {
    for (let x = FAR.frontX + (li % 2) * 1.4, r = 0; x < FAR.backX; x += FAR.rankGap, r++) {
      const id = 10000 + li * 200 + r;
      if (rnd(id * 13 + 5) < 0.06) continue;
      if (Math.abs(x - CROSS2.x) < 6) continue; // the cross column's mouth
      add(id, 'rear', westPath(x, z0 + (rnd(id * 11) - 0.5) * 0.4, 'rear'));
    }
  });
  // holes: no unit inside a heavy's footprint or an obstacle at any time it is on screen
  return out.filter((u) => SAMPLE_T.every((T) => {
    const p = u.path(groupD(u.g, T)).pos;
    if (HEAVIES_B.some((h) => { const q = heavyPos(h, T); return Math.hypot(p.x - q.x, p.z - q.z) < 4.3; })) return false;
    return OBST.every((c) => capDist(c, p.x, p.z) > 0.5);
  }));
};
/** Every unit of the army (built once). */
export const armyUnits = (): ArmyUnit[] => (UNITS ??= build());

/** The army as a Formation (film time): lockstep march, halts in three waves; eyes dark until each unit's eyeOn. */
export const ARMY_B: Formation = {
  slots: (T) => armyUnits().map((u): Slot => {
    const dist = groupD(u.g, T);
    const q = u.path(dist);
    const dip = settleDip(u.g, T);
    return {id: u.id, pos: q.pos, heading: q.heading, path: u.path, dist, ctl: {gaitEnd: restD(u.g), eye: T < u.eyeOn ? 'off' : 'cyan', ...(dip ? {crouch: dip} : {})} as Partial<UnitSpec>};
  }),
};
/** The army's slots at rest (after the last halt): for later sections that start from the halted army. */
export const armyRest = (): Slot[] => armyUnits().map((u) => ({id: u.id, pos: u.rest, heading: u.heading}));
/** The vanguard's front rank at rest (the units the Crew meet first), west → east order by z. */
export const vanguardFront = (): Slot[] => armyUnits().filter((u) => u.g === 'van' && u.rest.x < VAN_FRONT_X + 1).sort((a, b) => a.rest.z - b.rest.z).map((u) => ({id: u.id, pos: u.rest, heading: u.heading}));

// ------------------------------------------------------------------ heavies
/** A heavy's spec at film time T (walks in the rear wave; `look`, `lod` etc. can be layered on by the shot). */
export const heavySpecB = (i: number, T: number, o: Partial<HeavySpec> = {}): HeavySpec => {
  const h = HEAVIES_B[i];
  const dR = restD('rear');
  const path: Path = (d) => ({pos: {x: h.rest.x - (d - dR), y: 0, z: h.rest.z}, heading: h.heading});
  return {id: h.id, t: T, pos: h.rest, heading: h.heading, gait: {path, dist: groupD('rear', T), stride: 3.0}, ground, eye: T < heavyEyeOn(i) ? 'off' : 'cyan', ...o};
};
export const heavyEyeOn = (i: number) => eyeOnAt(HEAVIES_B[i].rest, HEAVIES_B[i].id) + 0.15;
export const heavyPosB = (i: number, T: number) => heavyPos(HEAVIES_B[i], T);

// ------------------------------------------------------------------ drones: low over the ranks, hover from H5b
export const DRONES_B: {id: number; rest: V3; ph: number}[] = Array.from({length: 26}, (_, i) => {
  const id = 3300 + i;
  const x = 86 + (i % 13) * 9.5 + rnd(id * 3) * 5;
  const z = (Math.floor(i / 13) ? 1 : -1) * (3 + rnd(id * 5) * 8);
  return {id, rest: {x, y: 4.2 + rnd(id * 7) * 5.5 + (x > 140 ? 3 : 0), z}, ph: rnd(id * 11) * 6.28};
});
/** drones decelerate a little more softly than the walkers (1.2 s) */
const droneD = (T: number) => {
  const Th = B_HALT.rear, D = 1.2;
  if (T <= Th) return marchD(T);
  const u = Math.min(1, (T - Th) / D);
  return marchD(Th) + SPEED * D * (u - (u * u) / 2);
};
const droneRestD = marchD(B_HALT.rear) + (SPEED * 1.2) / 2;
export const droneSpecB = (i: number, T: number, o: Partial<DroneSpec> = {}): DroneSpec => {
  const d = DRONES_B[i];
  const off = droneRestD - droneD(T);
  const v = T <= B_HALT.rear ? SPEED : Math.max(0, SPEED * (1 - (T - B_HALT.rear) / 1.2));
  const bob = Math.sin(T * 0.9 + d.ph) * 0.25;
  return {
    id: d.id, t: T, heading: 270,
    pos: {x: d.rest.x + off, y: d.rest.y + bob, z: d.rest.z + Math.sin(T * 0.4 + d.ph) * 0.6},
    vel: {x: -v, y: 0, z: 0}, eye: T < eyeOnAt(d.rest, d.id) + 0.1 ? 'off' : 'cyan', ground, ...o,
  };
};

/** Per-slot extra controls for armyItems (e.g. heads turning to look at a point): pass as ArmyOpts.ctl. */
export const lookAtCtl = (target: V3, share = 1) => (s: Slot): Partial<UnitSpec> =>
  rnd(s.id * 29 + 1) < share ? {look: {x: target.x + (rnd(s.id) - 0.5) * 2, y: target.y, z: target.z + (rnd(s.id * 3) - 0.5) * 2}, idle: 0.35} : {};
