// Group C2 (the maintenance crossing, C9–C16): one shared world timeline. Every shot in the group is a camera on this
// world, so the gantry, basket, barrier, machines and the blast are continuous across the cuts. All functions take
// FILM time T (s). Music sync: anchors from M, plus measured Portals onsets via filmOf('portals', rec) (the onset list
// is production/music/portals_detail_onsets.json).
import {M, filmOf, shot} from '../../film/timing';
import {clamp, easeIn, easeInOut, easeOut, keys, lerp, ring, smooth} from '../../kit/math';
import {GANTRY, GantryState, trolleyX} from '../../sets/city';

export const P = (rec: number) => filmOf('portals', rec);

// ---- music-synced beats (film s)
export const BEAT = {
  sprint: M.HIT_RUN,            // 88.71 the friend breaks for the ladder
  grab: P(153.20),              // 91.35 the friend's hands close on the lever handle
  arm: P(154.50),               // 92.65 the lever is hauled to "release": the basket's brake lets go, it swings
  dGo: P(157.82),               // 95.97 the Director leaves the friend for the basket
  depart: P(158.54),            // 96.69 the friend hauls the lever fully: the basket lurches away
  droneHit: P(159.84),          // 97.99 the swinging basket clips the diving drone
  barrier: P(160.50),           // 98.65 the landing barrier starts to lower
  jam: P(161.80),               // 99.95 the rebar jams the barrier
  arrival: M.ARRIVAL,           // 101.15 B♭: close on the friend
  aimed: P(164.46),             // 102.61 the breaker's launcher stops on the friend
  blast: P(167.10),             // 105.25 THE BLAST (the friend's injuries switch on at C13 + 1.0 = 105.6)
  sag: P(167.76),               // 105.91 the severed walkway drops
  dRun: P(169.76),              // 107.91 the Director is on the failing walkway
  catch: P(171.10),             // 109.25 the Director catches the friend's hand
  out: P(175.08),               // 113.23
  lurch: P(176.44),             // 114.59 the gantry's near leg gives
  crush: P(177.78),             // 115.93 the toppling leg crushes the breaker
  slam: P(178.46),              // 116.61 the beam's end slams onto the near deck
  settle: P(179.14),            // 117.29
  soften: M.SOFTEN,             // 118.15
  doors: M.FINAL_HIT,           // 125.75 (D1 opens the doors)
};

// ---- geography used by the group (KIT.md)
export const DECK = -1600, CATWALK = -1250, EDGE = 10500, LANDING = 12500;
/** The catwalk-to-deck ladder in this group's shots (Viaduct ladderX): west of the lever so the Crew comes up behind the
 *  operator and flows left → right past the box into the basket. */
export const LADDER_X = 9930;
export const STATION_X = 10112;
/** The refuge in this group's shots: drawn 1100 units west of KIT's 16000 so the signature wides can hold the gap and
 *  the entrance together (a framing cheat; the stairs still land at 14500 and the esplanade leads to the doors). */
export const REF_X = 14900;     // where the friend stands to work the lever (west of the control box)
export const BREAKER_X = 9330, BREAKER_S = 0.72;

// ---- lever: rest −30° (spring-loaded), "release" −92°, hauled to drive −104° (the operator pulls it toward them)
export const leverAt = (T: number) => {
  const letGo = BEAT.blast - 0.63; // 104.62: the basket has docked, the friend lets go
  if (T >= letGo) return -104 + 74 * (1 - Math.exp(-14 * (T - letGo))) + 6 * ring(T, letGo + 0.12, 5, 7);
  return keys(T, [[BEAT.grab - 0.1, -30], [BEAT.grab + 0.35, -33], [BEAT.arm - 0.4, -40], [BEAT.arm, -92, easeIn], [BEAT.depart - 0.35, -94], [BEAT.depart, -104, easeIn]]);
};

// ---- basket (trolley u 0 near … 1 far): parked at the near edge; departs on BEAT.depart; the drone strike damages the
// trolley (it judders and slows), so it creeps the last metres and docks at DOCK.
export const DOCK = BEAT.blast - 0.95; // 104.30
export const basketU = (T: number) => {
  if (T < BEAT.depart) return 0;
  const a = T - BEAT.depart;
  // fast run to the strike, then slowing
  const run = keys(T, [[BEAT.depart, 0], [BEAT.droneHit, 0.47, (x) => x * x * (1.6 - 0.6 * x)], [BEAT.jam - 0.3, 0.76, easeOut], [M.ARRIVAL, 0.85, smooth], [DOCK, 1, easeInOut]]);
  void a;
  return clamp(run);
};
export const basketSwing = (T: number) => {
  let sw = 0;
  sw += 6.5 * ring(T, BEAT.arm, 0.55, 1.1);            // brake release: the basket swings on its cables
  sw += -9 * ring(T, BEAT.depart, 0.5, 0.9);           // the lurch away (bottom lags west)
  sw += 7 * ring(T, BEAT.droneHit - 0.18, 0.6, 1.0);   // the swing that clips the drone
  sw += -3 * ring(T, BEAT.jam + 0.4, 0.6, 1.2);
  sw += 4 * ring(T, DOCK, 0.7, 1.6);                   // docking bump
  sw += -5 * ring(T, BEAT.blast, 0.6, 1.0);            // shock wave
  return sw;
};
/** Walkway severed by the blast: cut just east of the near edge; the far piece swings down about its second hanger. */
export const SPLIT_X = 10492;
export const splitAt = (T: number): GantryState['split'] =>
  T < BEAT.blast ? undefined : {x: SPLIT_X, p: lerp(0.62 * easeOut(clamp((T - BEAT.blast) / 0.28)), 1, smooth(clamp((T - BEAT.sag + 0.12) / 0.3))) + 0.04 * ring(T, BEAT.sag + 0.2, 1.8, 3), sagNear: 26, sagFar: 30};
/** Gantry collapse progress: the near leg gives on BEAT.lurch, topples onto the breaker on BEAT.crush, the beam's end
 *  lands on BEAT.slam (collapseAngles() eases in, so map linear time to the keyed progress). */
export const collapseAt = (T: number) => {
  if (T < BEAT.lurch + 0.25) return 0.012 * clamp((T - BEAT.lurch) / 0.25) * (T > BEAT.lurch ? 1 : 0);
  return clamp(keys(T, [[BEAT.lurch + 0.25, 0.012], [BEAT.crush, 0.75, (x) => x], [BEAT.slam, 1, (x) => x]]));
};
export const gantryAt = (T: number): GantryState => ({u: basketU(T), swing: basketSwing(T), lever: leverAt(T), split: splitAt(T), collapse: collapseAt(T)});

// ---- landing barrier: up (0) until the system reacts, lowers toward 90 (blocking the dock), jammed at ~47°
export const barrierAt = (T: number) => {
  if (T < BEAT.barrier) return 0;
  const lowering = 90 * Math.pow(clamp((T - BEAT.barrier) / 2.6), 1.2);
  const jammed = T >= BEAT.jam ? JAM_DEG + 3 * ring(T, BEAT.jam, 4, 5) - 2 * ring(T, DOCK + 0.05, 5, 6) : 99;
  return Math.min(lowering, jammed);
};
export const JAM_DEG = 39;
/** The rebar the Director jams under the barrier arm: lying on the landing until picked up, then wedged. */
export const REBAR = {lie: [{x: 12660, y: DECK - 6}, {x: 13250, y: DECK - 4}], foot: {x: 12548, y: DECK - 4}, armDist: 330};

// ---- breaker: rolls east along the near deck behind the Crew, parks, lifts and swings its pod, fires, is crushed
export const breakerAt = (T: number) => {
  const x = keys(T, [[86.0, 8300], [93.5, BREAKER_X - 60, easeOut], [96.0, BREAKER_X]]);
  // aim (pod elevation, +up): carried high while rolling; swings down onto the friend (BEAT.aimed); fire; recoil
  const aim = keys(T, [[M.ARRIVAL + 0.6, 22], [BEAT.aimed, -3, easeInOut], [BEAT.blast - 0.4, -4]]);
  const lock = clamp((T - (BEAT.aimed - 0.1)) / 0.2);
  const crushed = T < BEAT.crush - 0.04 ? 0 : 0.35 + 0.65 * easeOut(clamp((T - BEAT.crush + 0.04) / 0.5));
  return {x, aim, lock, fireT0: BEAT.blast - 0.3, crushed, crushT0: BEAT.crush - 0.04, dist: x - 8300};
};
export const BLAST_AT = {x: 10478, y: DECK - 95};

// ---- drones. A: shadows the Crew, dives at the basket cable and is smashed. B: replacement, locks on the friend.
export const droneA = (T: number) => {
  const x = keys(T, [[88.0, 9300], [92.0, 10100], [95.6, 10650], [BEAT.depart + 0.3, 11050], [BEAT.droneHit, 11420, easeIn]]);
  const y = keys(T, [[88.0, -2900], [95.6, -2860], [BEAT.depart + 0.3, -2820], [BEAT.droneHit, -2150, easeIn]]);
  return {x, y, tilt: T > BEAT.depart ? lerp(0, 24, clamp((T - BEAT.depart - 0.3) / 0.6)) : 4 * Math.sin(T), smashT0: BEAT.droneHit};
};
export const droneB = (T: number) => {
  const x = keys(T, [[BEAT.droneHit + 0.35, 12400], [BEAT.barrier + 0.6, 11500, easeOut], [M.ARRIVAL + 0.2, 10360, smooth], [BEAT.slam, 10380], [BEAT.slam + 1.5, 10050, smooth]]);
  const y = keys(T, [[BEAT.droneHit + 0.35, -3200], [BEAT.barrier + 0.6, -2800, easeOut], [M.ARRIVAL + 0.2, -2420, smooth], [BEAT.blast - 0.3, -2400], [BEAT.blast + 0.1, -2560, easeOut], [BEAT.slam, -2520], [BEAT.slam + 1.5, -2750, smooth]]);
  const lock = clamp((T - (M.ARRIVAL + 0.45)) / 0.18) * (T < BEAT.slam + 1 ? 1 : 0);
  return {x, y, lock, on: T > BEAT.droneHit + 0.3};
};
/** Two far drones holding a formation over the near deck (scale and threat in the wides). */
export const droneFar = (T: number, k: number) => ({x: 9200 + k * 420 + 60 * Math.sin(T * 0.7 + k), y: -3150 - k * 140 + 30 * Math.sin(T * 1.1 + k * 2)});

export const SHOT = {
  C9: shot('C9'), C10: shot('C10'), C11: shot('C11'), C12: shot('C12'), C13: shot('C13'), C14: shot('C14'), C15: shot('C15'), C16: shot('C16'),
};
export {GANTRY, trolleyX};
export const M_ARRIVAL = M.ARRIVAL;
