// D4's START STATE at film 149.86 (M.P4). PURE (no React, no kits beyond ground/plan).
//
// ===================================================================================================================
//   D3 MUST END HERE. D3 (116.92–149.86) is built after D4: its last frame must show exactly this — positions, poses,
//   headings, props and damage of all seven, heavy 2, and the nearest machines — so D3-11 cuts into D4-1 seamlessly.
// ===================================================================================================================
//
// The moment: 4.7 s after heavy 2's launcher round hit the crater's west rim (HEAVY2_FIRE 145.18) and threw the Crew
// back off it (they were at the rim, x ≈ 44–48, by D1's cover slab). They have got up 4–9 m west of the rim, among
// D1's wrecks (U1/U2 at ≈ (41, −3.5), U4 face down at ≈ (40.4, 4.0)), and face east: the Director (lip cut, plate
// cracked through) is the east-most, braced with the plate up; the others are spread behind him across the avenue,
// all of them on their feet. Heavy 2 has stepped over heavy 1's wreck (142.36) and walks west out of the crater
// toward them; the units D3 re-formed into an arc (FORMATION 131.02) press in on the Crew's east side.
//
// Damage and tools at this moment (rig/crew.ts dmgR2 / toolsR2 / limpR2 at T = 149.86):
//   director  plate CRACKED (toolsR2), lip cut, left brow cut, bruise, torn right sleeve, bloody right palm
//   tether    launcher in her right hand but EMPTY (no clamp: the cable was cut at FLANK_DENIED), hip reel empty
//             (spool 0) with a ~2.5 m cut end still on it; bruised right cheek (from P4); torn trouser knee
//   decoy     the SMASHED tablet still in her left hand (cut on the back of her right hand)
//   breaker   the breaker in both hands at port, gauge EMPTY; left leg hurt (limpR2 from P4), left forearm bleeding
//   drone     the controller in both hands, its screen dark (the allied drone was destroyed at ALLY_DRONE_LOST)
//   runner    the halligan in his right hand; scrape on the left forearm (D2 KNOCKBACK)
//   flares    brow cut, jacket torn (HEAVY2_FIRE); ONE flare left in the bag
//
// Each Crew entry: root (feet centre) position on the ground, heading (deg, 0 = north, 90 = east), body state and
// what the hands hold. D4/crew.tsx starts every timeline from these exact values.
import type {V3} from '../../../kit/math';
import {groundH} from '../../world/ground';
import type {Role2} from '../../rig/looks';

const on = (x: number, z: number): V3 => ({x, y: groundH(x, z), z});

export type CrewStart = {pos: V3; heading: number; state: string; hands: string};
export const START_T = 149.86;

export const CREW_START: Record<Role2, CrewStart> = {
  director: {pos: on(36.6, 1.0), heading: 90, state: 'standing braced (BRACED wide 0.8, drop ~30), plate up in the guard in front of his chest, panting', hands: 'plate on the left forearm (cracked), right fist'},
  tether: {pos: on(35.5, -2.3), heading: 92, state: 'standing braced, the empty launcher held low-ready', hands: 'launcher (unloaded) in the right hand; left hand open'},
  runner: {pos: on(35.2, 4.6), heading: 88, state: 'crouched ready (BRACED wide 0.7)', hands: 'halligan in the right hand, one-handed'},
  breaker: {pos: on(31.8, 2.7), heading: 80, state: 'on his feet, weight off the left leg (limp), breathing hard', hands: 'breaker at port across the body, both hands (gauge empty)'},
  decoy: {pos: on(32.9, 4.2), heading: 82, state: 'standing, shaken, looking at the units', hands: 'smashed tablet in the left hand; right hand open'},
  drone: {pos: on(32.8, 0.3), heading: 85, state: 'standing, the dead controller held in front', hands: 'controller in both hands (screen dark)'},
  flares: {pos: on(33.6, 6.6), heading: 86, state: 'standing braced, wiping the brow cut', hands: 'empty (one flare left in the bag)'},
};

// ------------------------------------------------------------------ heavy 2 and the nearest machines at 149.86
/**
 * Heavy 2 walks west out of the crater along one straight line (heading 262) that later brings it to the van; at
 * 149.86 its hull is at HEAVY2_START, walking at ≈ 2.1 m/s (mid-stride), eye amber, ram at rest, launcher lowered.
 */
export const HEAVY2_LINE = {from: {x: 55.5, z: -2.76}, heading: 262};
export const HEAVY2_START = {pos: on(55.5, -2.76), heading: 262, speed: 2.1, eye: 'amber' as const};

/**
 * The arc pressing the Crew's east side (D3's FORMATION arc, followed west): named units and the escort, root
 * position and heading (facing the Crew) at 149.86; ids are the tableau identities they end as (EF/tableau.ts).
 * r = distance from the Crew's centre (35.0, 2.0); bearing from it (deg).
 */
export const ARC_C = {x: 35.0, z: 2.0};
export type ArcStart = {id: number; role: string; bearing: number; r: number};
export const ARC_START: ArcStart[] = [
  // the named ones
  {id: 7101, role: 'H1 — disarms the tether operator (157.55), later holds her (grab 180.4)', bearing: 32, r: 7.4},
  {id: 7501, role: 'W1 — closest: its blow cracks the plate through (153.42); smashed by the Director at 163.3', bearing: 78, r: 5.0},
  {id: 7503, role: 'W3 — its legs wrapped by the cable at 164.78, driven over at 165.02', bearing: 58, r: 8.6},
  {id: 7502, role: 'W2 — its arm torn off by the breaker\'s club at 164.4', bearing: 112, r: 7.6},
  {id: 7105, role: 'H5 — the south flanker: strikes the runner down (155.86), then stands over him', bearing: 146, r: 8.6},
  // the escort (ring units of the tableau's east half, then the outer ring's)
  {id: 7223, role: 'ring', bearing: 18, r: 9.6}, {id: 7222, role: 'ring', bearing: 44, r: 10.4}, {id: 7221, role: 'ring', bearing: 66, r: 11.2},
  {id: 7220, role: 'ring', bearing: 84, r: 9.0}, {id: 7219, role: 'ring', bearing: 98, r: 11.4},
  {id: 7200, role: 'ring', bearing: 126, r: 10.2}, {id: 7201, role: 'ring', bearing: 138, r: 12.0}, {id: 7202, role: 'ring', bearing: 158, r: 10.8},
  {id: 7203, role: 'ring', bearing: 168, r: 12.6}, {id: 7204, role: 'ring', bearing: 176, r: 9.8}, {id: 7205, role: 'ring', bearing: 186, r: 11.6},
  {id: 7104, role: 'H4 — later presses the breaker down (182.3)', bearing: 120, r: 13.6},
  {id: 7103, role: 'H3 — later twists the flare carrier\'s arm (181.7)', bearing: 150, r: 14.2},
  {id: 7102, role: 'H2 — later holds the decoy maker (181.0)', bearing: 102, r: 14.6},
  {id: 7312, role: 'outer', bearing: 24, r: 14.8}, {id: 7311, role: 'outer', bearing: 52, r: 15.6}, {id: 7310, role: 'outer', bearing: 74, r: 16.0},
  {id: 7300, role: 'outer', bearing: 132, r: 16.4}, {id: 7301, role: 'outer', bearing: 162, r: 15.4}, {id: 7302, role: 'outer', bearing: 182, r: 16.2},
];
const hv = (h: number) => ({x: Math.sin((h * Math.PI) / 180), z: -Math.cos((h * Math.PI) / 180)});
/** an arc unit's start position (on the ground) and heading (facing the Crew's centre) */
export const arcStartPos = (a: ArcStart): {pos: V3; heading: number} => {
  const d = hv(a.bearing);
  return {pos: on(ARC_C.x + d.x * a.r, ARC_C.z + d.z * a.r), heading: (a.bearing + 180) % 360};
};
