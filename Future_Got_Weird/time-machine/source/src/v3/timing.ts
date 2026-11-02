// V3 timeline: one connected journey keyed to the measured narration (the approved voice-over, unchanged).
//   space (ship beside the hole) -> through the ship's window -> cockpit -> his wrist and watch -> match to the wall
//   clock at home -> the window -> the same window from outside -> years in the garden -> the ship lands -> the
//   friend, old -> up the path, through the front door -> the room, the photograph -> the friend in the doorway ->
//   his watch beside his old friend -> into the watch face -> the ship's window -> the opening shot (loop).
import {DUR, word} from '../lib';

const w = (s: string, n = 0) => word(s, n).start;
export const W3 = {
  hole: w('hole,'), youCould: w('you', 1), future: w('future.'), youd: w("You'd"), hour: w('hour.'), but: w('But'),
  years: w('years'), and: w('And'), returned: w('returned,'), friends: w('friends'), old: w('old.'),
  your: w('Your', 1), gone: w('gone.'), because: w('Because'), space: w('space.'), youT: w('You', 1), time: w('time.'),
};

export const T3 = {
  // 1 space: the ship already moving beside the hole; the camera follows it
  // 2 toward its cockpit window and through it
  push: 2.72,
  windowIn: 4.25,
  // 3 cockpit: he looks at the hole through the porthole, then glances down at his wrist
  glance: 4.72,
  // 4 one wrist raise; the camera closes in on the watch; one compressed hour; the watch composition
  raise: 4.95,
  raiseEnd: 5.6,
  pushWatch: 5.1,
  watchClose: 6.05,
  hourStart: 5.62,
  hourEnd: 7.14,
  match: 8.2,
  // 5 the wall clock at home races; the camera goes to the window; the same window from outside
  toWindow: 8.42,
  windowMatch: 9.25,
  // 6 years in the garden, locked off: seasons, the tree, the friend ageing in his place
  yearsEnd: 11.35,
  // 7 the ship returns to the street; the hatch; he steps out and walks to his friend
  descent: 11.45,
  landing: 12.3,
  hatch: 12.42,
  stepOut: 12.56,
  stepDown: 12.74,
  arrive: 13.34,
  // 8 their faces together: he searches the old face, recognises him
  faces: 13.25,
  recognise: 13.78,
  // 9 up the path, through the front door (seen outside), into the room (seen inside)
  turnToHouse: 14.42,
  atDoor: 15.55,
  inside: 15.86,
  roomStop: 16.5,
  // 10 the photograph; the change in him on 'gone'
  seePhoto: 16.38,
  realise: 16.64,
  photoClose: 17.5,
  // 11 from the young faces in the photograph to his still-young face; his old friend appears in the doorway
  toFace: 18.55,
  friendIn: 19.35,
  // 12 his watch, his old friend; the push into the watch face; the match to the ship's window; the opening (loop)
  watchUp: 20.5,
  loopPush: 22.7,
  loopCut: 23.0,
  dur: DUR,
};
/** the hole's own clock (disk rotation, image frames): offset so that the end of the film flows into frame 0 */
export const BH_OFFSET = 0.6;
export const bhT3 = (t: number) => (t >= T3.loopCut ? t - DUR + BH_OFFSET : t + BH_OFFSET);
/** the space timeline is periodic: after the loop cut, space time runs from -(DUR - loopCut) up to 0 at the last frame */
export const spaceTau = (t: number) => (t >= T3.loopCut ? t - DUR : t);
