// Section C beats (film seconds): the shot cuts and every performance key the choreography (crew.ts), the cameras and
// the sound (cues.ts) share. Pure constants (cues.ts is bundled for the mixer: no kit imports here).
//
// R3: the climbs are step-climbs (motion.ts climbPlan: planted foot, weight transfer, new step), and C6 is no longer one
// held group frame. ASSEMBLE: the shared turn (he is first) → the tools readied along the line → the threat: over his
// shoulder the vanguard's front rank breaks into its run (D1 machines: RUN_T0 = 57.0) → the commit: he steps out to the
// brink, they step up into the line beside him, sink into the start and lift the first stride — D1-1 cuts in on it.
import {M} from '../../timing';

/** shot boundaries (they tile M.BASS_OUT → M.CHARGE) */
export const CUT = {
  c1: M.BASS_OUT, c2: M.ALLY1, c3: 40.16, c4: M.MARCH, c4b: 46.7, c5a: 50.0, c5b: 51.2, c5c: 52.1,
  c6: M.ASSEMBLE, c6b: 54.45, c6c: 56.05, c6c2: 57.0, c6d: 58.05, end: M.CHARGE,
};

/** the Director (C1: the turn; C5: the touch, the strap; C6: the turn, a look along the line, the threat, the step, the set) */
export const TD = {
  breathStop: 36.22, // his breath stops (the world goes quiet)
  heard: 36.42, // a scrape on the rubble behind him, far off
  eyes: 36.55, // eyes first
  head: 36.78, headEnd: 37.3, // then the head, over his right shoulder
  pivot: 37.2, pivotEnd: 38.32, // then the body comes round (three steps, up and back toward the crest)
  seen: 38.9, // he makes out the first of them in the smoke
  recognise: 43.55, // a breath of recognition (C3)
  touchLook: 50.42, nod: 50.78, lookBack: 51.0, // C5a: he turns his head to the breaker's hand, the look, a nod
  strapLook: 52.18, strapPress: 52.5, strapRelease: 52.78, strapUp: 52.88, // C5c: the strap check
  turn: 53.12, turnEnd: 54.0, // C6a: the shared turn — he is first
  glanceS: 55.62, glanceSEnd: 56.2, // C6b: a look along the line at them (the breaker's tool charging)
  threat: 57.1, // C6c: their front rank breaks into its run
  step: 57.78, stepEnd: 58.55, // the step out to the brink (C6c → C6d: the cut lands in its first stride)
  set: 59.18, // he sinks into the start on the accent (59.23)
  plateUp: 59.5, // the plate snaps up into the guard: go
};

/** the tether operator (clerkA): out of the smoke (C2), across the floor, the step-climb up the north side of the west
 * slope (a palm on the rock at the last steep step); the reel (C5b); the turn; the launcher up; the commit */
export const TT = {
  go: 36.5, // starts walking inside the smoke (seen from 38.46)
  foot: 41.9, // at the foot of the slope: the climb starts
  top: 48.3, // on the summit
  reel: 51.38, click: 51.52, reelOff: 51.78, // C5b: her hand on the reel, the lock clicks
  turn: 53.3,
  ready: 54.05, // the launcher comes up to the ready; she sights along it
  commit: 58.45, commitEnd: 59.05,
};

/** the runner (guesser): the sprint out of the smoke, the vault (C3), the step-climb up to his place */
export const TR = {
  go: 38.4, // starts running inside the smoke (south of his POV)
  takeoff: 41.4, // last plant before the wall (left foot)
  hand: 41.48, // the left palm lands on the wall's top edge
  over: 41.67, // the hips pass over the edge
  release: 41.75, // the palm leaves the edge
  land: 41.87, // the right foot lands beyond it (then the left)
  rec: 42.38, // recovered (up out of the crouch, climbing)
  arrive: 46.1,
  turn: 53.24,
  flip: 54.08, // the halligan spins once in his fist and he catches it at the carry
  commit: 58.3, commitEnd: 58.85,
};

/** the runner's bound over the steep rubble (R4; crew.ts hopAt): it replaces steps 7-8 of his climb */
export const TH = {t0: 44.02, load: 44.09, take: 44.12, landL: 44.285, landR: 44.37, palmOn: 44.2, palmOff: 44.42, t1: 44.6};

/** the breaker (honest): the walk out of the smoke, the step-climb up the north side (palms on the rubble), to the
 * Director's right side; his hand on the Director's shoulder (C5a); round to his place; the tool charged (C6b) */
export const TB2 = {
  go: 38.2,
  foot: 42.45, // at the foot of the slope
  arrive: 49.5, // at the Director's right side (he turns to face him)
  touch: 50.28, touchOff: 50.98, // C5a: his left hand on the Director's right shoulder
  go2: 51.05, arrive2: 53.2,
  turn: 53.36,
  charge: 55.12, charged: 55.62, // C6b: the valve: the gauge needle swings up, the tank hisses
  commit: 58.35, commitEnd: 59.0,
};

/** the three from the edge of the street (C4): the drone pilot, the flare carrier, the decoy maker */
export const T3 = {
  go: 42.4,
  pilotFoot: 45.0, // the pilot starts up the bank
  launch: 47.05, spin: 47.3, lift: 47.72, // she stops, holds the drone up; the rotors spin up; it lifts off her palm
  ctrl: 48.15, // her hands come together on the controller
  pilotGo: 48.35, arrivePilot: 53.45, turnPilot: 53.72,
  flaresFoot: 44.6, arriveFlares: 51.0, turnFlares: 53.44,
  decoyFoot: 45.0, arriveDecoy: 52.2, turnDecoy: 53.52,
  tablet: 54.5, // C6b: the decoy maker wakes the tablet (the projector's lens lights)
  satchel: 54.78, // the flare carrier's hand on the satchel: the flares counted under his fingers
  thumbs: 55.7, // the pilot sends the drone out ahead of them
  commitP: 58.18, commitPEnd: 58.8,
  commitF: 58.55, commitFEnd: 59.15,
  commitD: 58.65, commitDEnd: 59.25,
};

/** the allied drone: carried, lifts off, rises past the tether (C5b), holds over the group (joins D1's keys at 56) */
export const TDR = {past: 51.62};

/** the end: everyone settles into D1's first frame (the pose blends from `blend`; the left foot lifts into the first
 * stride from `lift` — D1 starts every run with the left foot leaving the ground) */
export const TEND = {blend: 59.4, lift: 59.6};
