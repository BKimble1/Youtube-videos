// Section C beats (film seconds): the shot cuts and every performance key the choreography (crew.ts), the cameras and
// the sound (cues.ts) share. Pure constants (cues.ts is bundled for the mixer: no kit imports here).
import {M} from '../../timing';

/** shot boundaries (they tile M.BASS_OUT → M.CHARGE) */
export const CUT = {
  c1: M.BASS_OUT, c2: M.ALLY1, c3: 40.16, c4: M.MARCH, c5a: 50.0, c5b: 51.2, c5c: 52.1, c6: M.ASSEMBLE, end: M.CHARGE,
};

/** the Director (C1: the turn; C5: the touch, the strap; C6: the turn, the step) */
export const TD = {
  breathStop: 36.22, // his breath stops (the world goes quiet)
  heard: 36.42, // a scrape on the rubble behind him, far off
  eyes: 36.55, // eyes first
  head: 36.78, headEnd: 37.3, // then the head, over his right shoulder
  pivot: 37.2, pivotEnd: 38.32, // then the body comes round (three steps, up and back toward the crest)
  recognise: 43.55, // a breath of recognition (C3)
  touchLook: 50.42, nod: 50.78, lookBack: 51.0, // C5a: he turns his head to the breaker's hand, the look, a nod
  strapLook: 52.18, strapPress: 52.5, strapRelease: 52.78, strapUp: 52.88, // C5c: the strap check
  turn: 53.12, turnEnd: 54.0, // C6: the shared turn — he is first
  step: 57.55, stepLand: 58.05, step2: 58.2, step2Land: 58.62, // the step forward on the build
};

/** the tether operator (clerkA): out of the smoke (C2), up the west slope, a hand onto the summit; the reel (C5b) */
export const TT = {
  go: 37.9, // starts walking inside the smoke (seen from 38.46)
  top: 48.55, // on the summit
  handOn: 48.0, handOff: 48.5, // the last step up: left hand on the rock
  reel: 51.38, click: 51.52, reelOff: 51.78, // C5b: her left hand on the reel, the lock clicks
  turn: 53.3,
};

/** the runner (guesser): the sprint out of the smoke, the vault (C3), up to his place */
export const TR = {
  go: 39.35, // starts running inside the smoke
  takeoff: 41.4, // last plant before the wall (left foot)
  hand: 41.5, // the left palm lands on the wall's top edge
  over: 41.74, // the hips pass over the edge
  land: 41.98, // the right foot lands beyond it (then the left)
  release: 41.86, // the palm leaves the edge
  rec: 42.45, // recovered (up out of the crouch, moving)
  arrive: 46.3,
  turn: 53.24,
};

/** the breaker (honest): climbs on the north side (C3, a hand on a rubble block), round behind him to his left */
export const TB2 = {
  go: 39.4,
  hand1: 42.9, hand1Off: 43.6, // right palm on the rubble block, the push up
  hand2: 46.45, hand2Off: 47.05, // a second time at the steep step below the crest
  arrive: 49.95, // at the Director's left side
  touch: 50.28, touchOff: 50.98, // C5a: his right hand on the Director's left shoulder
  go2: 51.05, arrive2: 52.75,
  turn: 53.36,
};

/** the three from the edge of the street (C4): the decoy maker, the drone pilot, the flare carrier */
export const T3 = {
  go: 44.35,
  launch: 47.05, spin: 47.3, lift: 47.72, // the pilot stops, holds the drone up; the rotors spin up; it lifts off her palm
  ctrl: 48.15, // her hands come together on the controller
  pilotGo: 48.35,
  arriveDecoy: 52.15, arriveFlares: 51.7, arrivePilot: 52.75,
  turnPilot: 53.3, turnFlares: 53.44, turnDecoy: 53.52,
};

/** the allied drone: carried, lifts off, rises past the tether (C5b), holds over the group (joins D1's keys at 56) */
export const TDR = {past: 51.62};

/** the end: everyone settles into D1's first frame (blend window) */
export const TEND = {blend: 59.3};
