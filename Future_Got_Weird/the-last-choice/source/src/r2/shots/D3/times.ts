// Section D3 event times (film seconds). PURE: only M is imported, so cues.ts (bundled for the mixer) can use these
// too. Every shot, machine spec, FX and cue of the section reads the same numbers.
//
// The strongest attack (P3 116.92 → HEAVY_DOWN): the Director signals; the flare carrier strikes a flare and throws it
// into heavy 1's eye while the allied drone hangs in its face (the flash, 119.38); it swipes blind, halts, swings round
// toward the girder; the tether clamps its front-left shin and the cable is wrapped round girder post 3 (the leg is
// pinned, 122.9); the Director bangs his plate on the slope and its ram slams down short of him (124.05); the breaker
// splits its rear-left knee (124.75) and the runner hauls him clear; it topples to its left across the crater's north
// part and crashes (126.25). Then the system adapts: a drone climbs above the dust and locks on (ADAPT); the units form
// a line in the crater and re-form into an arc round the Crew (FORMATION); the decoy is ignored and a drone smashes
// the tablet (DECOY_FAIL); drones cut the tether cable at the girder (FLANK_DENIED); two drones run the allied drone
// down (ALLY_DRONE_LOST); heavy 2 steps over heavy 1's wreck (HEAVY2) and its launcher round hits the rim in front of
// the Crew (HEAVY2_FIRE): they are thrown back, get up and fall back west into D4's start (P4 149.86).
import {M} from '../../timing';

export const EV3 = {
  start: M.P3,
  // ---- D3-1 the flare and the drone blind heavy 1
  sig: 117.15, sigEnd: 117.6,
  flareDraw: 117.55, flareStrike: 118.15, flareRel: 118.78, flareFlight: 0.6,
  allyGo: 117.7, allyAtEye: 118.95, allyDodge: 119.28,
  flash: 119.38,
  ram1: 119.9, // the blind swipe at where the drone was
  // ---- D3-2 the swing round, the clamp, the wrap, the pin
  turn0: 121.0, turn1: 122.75,
  tAim: 121.35, tFire: 121.85, tBite: 122.25, wrap0: 122.4, wrap: 122.75, taut: 122.9,
  yank: 123.08, // the pinned leg tries to step and is held
  // ---- D3-3 the bait and the knee
  bang1: 122.95, bang2: 123.3,
  ram2: 124.05, // the ram slams the ground short of the Director
  brkSet: 123.3, brkWind: 123.95, knee: 124.75,
  haul: 124.88, // the runner hauls the breaker back
  // ---- D3-4 the topple
  land: 124.75 + 1.5,
  peak: 127.2,
  // ---- D3-5 ADAPT: the climb, the lock, the mark
  climb0: 128.1, climb1: 130.2, lock: 129.85, mark0: 130.25,
  // ---- the line (forms after the crash) and D3-6 FORMATION: line → arc (ripple from the centre out)
  line0: 126.7, lineSet: 130.7, reform: 131.1,
  // ---- D3-7 DECOY_FAIL
  sketch: 133.95, tap: 134.8, projOn: 135.0, dive0: 135.6, smash: 136.35, projOff: 136.37,
  advance0: 135.0, advance1: 137.9,
  // ---- D3-8 FLANK_DENIED
  swarm0: 137.7, cutter: 138.45, cut: 138.95, tFall: 139.0, tUp: 139.75, tRun: 140.45,
  // ---- D3-9 ALLY_DRONE_LOST
  hunt0: 140.5, kill: 141.35,
  // ---- D3-10 HEAVY2: over the wreck; the front-right foot comes down (the stomp)
  overFL: 143.55, stomp: 144.55, fallBack: 144.8,
  // ---- D3-11 HEAVY2_FIRE
  fire: M.HEAVY2_FIRE, blast: 145.45,
  end: M.P4,
};

/** Shot boundaries (film s). */
export const SH3 = {
  d31: M.P3, d32: 121.0, d33: 123.5, d34a: M.HEAVY_DOWN, d34b: 127.2, d35: M.ADAPT, d36: M.FORMATION,
  d37a: M.DECOY_FAIL, d37b: 135.3, d37c: 136.15, d38: M.FLANK_DENIED, d39: M.ALLY_DRONE_LOST, d310: M.HEAVY2,
  d311a: M.HEAVY2_FIRE, d311b: 146.3, d311c: 146.9, d311d: 147.8, d311e: 148.3, end: M.P4,
};
