// Section D3 event times (film seconds). PURE: only M is imported, so cues.ts (bundled for the mixer) can use these
// too. Every shot, machine spec, FX and cue of the section reads the same numbers. Exchange sheet: production/
// R3_EXCHANGES.md ## D3. (rig/crew.ts keeps literal copies of: flare 117.7 (the satchel), knee 124.75 (the gauge), smash
// 136.35, cut 138.95, kill 141.35, blast 145.45 — keep them.)
//
// THE STRONGEST ATTACK (P3 → HEAVY_DOWN): heavy 1 comes on with its escorts (U8 holding the crater's south-west, R3 at
// its left front, R4 at its left rear). The Director signals; the allied drone darts into its face and the heavy's ram
// swipes at it — it jinks clear — and the flare carrier's flare goes into the eye it fixed on the drone (the flash).
// Blind, it halts; the drone's whine under the girder swings it round to the north; the tether clamps its front-left
// shin and wraps the cable round girder post 3; R3 grabs the cable and hauls (she is dragged a step: the post holds).
// On the south-west slope U8 walks at the Director and hammers his plate, pressing him back, while the breaker runs
// past and ducks under the water main to the rear-left leg; U8 turns on the crossing — the Director's plate in its
// back, the runner's adze round its ankle: down; the breaker splits the knee and dives back under the main as R4's
// hammer comes down on the beam; the heavy goes over onto its left side across the crater: its wreck, the water main
// and the taut cable close the crater's north-west corner — the units coming on are held behind the barrier.
// THE ADAPTATION: a drone climbs over the dust for an angle over the wreck and marks the tablet (ADAPT); the line
// behind the barrier splits from the middle — its north end round the wreck's nose to the girder flank, the rest down
// the water main and through its break — and bends into an arc round the Crew (FORMATION); the decoy is tried again:
// the arc walks through the light at its source and a drone smashes the tablet (DECOY_FAIL); drones deny the girder
// flank and cut the cable: the wing comes over the slack (FLANK_DENIED); two drones run the allied drone down
// (ALLY_DRONE_LOST). ESCALATION: heavy 2 steps over heavy 1's wreck (the barrier undone) — the decoy maker kneels on
// the crest with her cut hand; its launcher comes round onto her; the Director hauls her back off the crest and the
// round bursts where she knelt (HEAVY2_FIRE): they are thrown, get up hurt and fall back west into D4's start.
import {M} from '../../timing';

export const EV3 = {
  start: M.P3,
  // ---- X1 THE BLIND: the signal, the flare, the drone's feint, the ram's swipe at it, the flash
  sig: 117.15, sigEnd: 117.6,
  flareDraw: 117.55, flareStrike: 118.15, flareRel: 118.78, flareFlight: 0.6,
  allyGo: 117.7, allyAtEye: 118.95, allyJink: 119.06,
  /** the ram's swipe at the drone hanging in its face (contact time: the drone has jinked up out of it) */
  ram1: 119.2,
  flash: 119.38,
  // ---- X2 THE PIN: the halt (D2's walk ends), the swing round to the drone's whine, the clamp, the wrap, the yank
  turn0: 121.0, turn1: 122.75,
  tAim: 121.35, tFire: 121.85, tBite: 122.25, wrap0: 122.4, wrap: 122.75, taut: 122.9,
  /** the pinned leg tries to step back and the cable holds it (she is dragged a step and digs in) */
  yank: 123.55,
  // ---- X3 THE KNEE: E1 (U8) walks at the Director and hammers his plate, presses him back; the breaker ducks under the
  // water main to the leg; U8 turns on the crossing — the Director's plate in its back, the runner's hook; the knee; the
  // breaker dives back under the main as E2's hammer comes down on it
  dirGo: 119.45, brkGo: 119.68, runGo: 119.95,
  e1Meet: 122.75, e1Ham: 123.2, press0: 123.35, press1: 123.9, e1Turn: 124.0, e1Step: 124.1, bash: 124.3, hook: 124.5, e1Fall: 124.52,
  e1Up: 127.3,
  under0: 123.0, under1: 123.3, brkSet: 123.76, brkWind: 123.95, knee: 124.75,
  /** E2's hammer comes down on the beam between him and the crossing; he pivots off the knee and dives under it */
  brkDive: 125.3, e2Hit: 125.15,
  /** R3 grabs the tether's cable by the clamped leg and hauls on it (the reel locks: she is dragged a step) */
  r3Grab: 122.6, r3Haul: 122.8, drag0: 122.92, drag1: 123.18, r3Let: 125.0,
  // ---- X4 THE TOPPLE
  land: 124.75 + 1.5,
  peak: 127.2,
  // ---- ADAPT: the climb over the dust, the lock, the mark on the tablet
  climb0: 128.1, climb1: 130.2, lock: 129.85, mark0: 130.25,
  // ---- the line behind the barrier; FORMATION: it splits from the middle and bends into the arc
  lineSet: 129.6, reform: M.FORMATION + 0.08,
  // ---- DECOY_FAIL
  sketch: 133.95, tap: 134.8, projOn: 135.0, dive0: 135.6, smash: 136.35, projOff: 136.37,
  advance0: 135.0, advance1: 138.2,
  // ---- FLANK_DENIED
  swarm0: 137.7, cutter: 138.45, cut: 138.95, tFall: 139.0, tUp: 139.75, tRun: 140.45,
  /** the wing comes over the slack cable */
  wingGo: 139.25,
  // ---- ALLY_DRONE_LOST
  hunt0: 140.5, kill: 141.35,
  // ---- HEAVY2: over the wreck (front-left lands this side), the decoy maker looks up, the launcher comes round
  overFL: 143.15, seeHer: 143.85, dirRun: 143.95, grab: 144.4, decUp: 144.75, fallBack: 144.15, stomp: 144.95,
  // ---- HEAVY2_FIRE
  fire: M.HEAVY2_FIRE, blast: 145.45,
  end: M.P4,
};

/** Shot boundaries (film s). */
export const SH3 = {
  d31: M.P3, d31b: 119.55, d32: 121.0, d33: 123.05, d33b: 124.42, d34a: M.HEAVY_DOWN, d34b: 127.2, d35: M.ADAPT, d36: M.FORMATION,
  d37a: M.DECOY_FAIL, d37b: 135.3, d37c: 136.15, d38: M.FLANK_DENIED, d39: M.ALLY_DRONE_LOST,
  d310a: M.HEAVY2, d310b: 143.4, d310c: 144.25,
  d311a: M.HEAVY2_FIRE, d311b: 146.3, d311c: 147.0, d311d: 147.7, d311e: 148.5, end: M.P4,
};
