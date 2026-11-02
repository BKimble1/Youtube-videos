// V2 timeline: every staged action, keyed to the measured narration (see production/V2_PLAN.md).
import {word} from '../lib';

const w = (s: string, n = 0) => word(s, n).start;
export const W = {
  hole: w('hole,'), future: w('future.'), youd: w("You'd"), clock: w('clock'), hour: w('hour.'), but: w('But'), earth: w('Earth,'),
  years: w('years'), passing: w('passing.'), and: w('And'), returned: w('returned,'), friends: w('friends'), old: w('old.'),
  family: w('family'), gone: w('gone.'), because: w('Because'), space: w('space.'), youT: w('You', 1), time: w('time.'),
};

export const V2 = {
  // 1 hook: the friend ages young -> elderly while holding the glove
  ageEnd: 0.72,
  lookHands: 0.74,
  // 2 his gaze rises to the visor; clean cut to the real black hole on "hole"
  headTurn: 1.12,
  reflection: 1.3,
  spaceCut: 2.05,
  // 3 the flight around the hole, then toward the cockpit window
  flightStart: 2.12,
  flightEnd: 4.15,
  approach: 3.85,
  windowPass: 4.7,
  // 4 the cockpit: wrist up, one compressed hour, wrist down (face + hole), wrist up again
  wristUp: 4.82,
  wristUpEnd: 5.4,
  hourStart: 5.55,
  hourEnd: w('hour.') + 0.01,
  wristDown: w('hour.') + 0.06,
  wristDownEnd: w('hour.') + 0.5,
  wristUp2: 7.78,
  matchCut: 8.2,
  // 5 the home clock (years), then to the window and through it
  panToWindow: 8.42,
  windowPush: 9.1,
  windowCover: 9.36,
  // 6 decades in the yard: foreground wipes conceal each jump
  wipe1: 9.98,
  wipe2: 10.58,
  // 7 the return
  lightPass: 11.22,
  lookUp: 11.3,
  descentStart: 11.5,
  landing: 12.45,
  hatch: 12.55,
  stepOut: 12.74,
  stepDown: 12.95,
  walkToFriend: 13.02,
  arrive: 13.36,
  // 8 the reunion: the opening's composition
  clasp: 13.5,
  search: 13.58,
  recognise: 13.88,
  toHands: 14.2,
  // 9 to the door
  gesture: 14.6,
  walkStart: 14.84,
  doorPass: 15.22,
  doorPassEnd: 15.5,
  // 10 the family room (present)
  roomStop: 15.95,
  notice: 15.98,
  reach: 16.25,
  dustWipe: 16.58,
  faceTurn: 16.95,
  // 11 his reflection in the photograph's glass
  photoClose: 17.55,
  // 12 the watch beside the photograph, then into the pre-departure print
  watchBeside: 20.72,
  photoMove: 21.55,
  photoPush: 21.8,
};
