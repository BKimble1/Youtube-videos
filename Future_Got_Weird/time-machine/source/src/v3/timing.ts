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
  // 2 toward its cockpit window and through it (the camera banks to the ship's heading on the way in)
  push: 2.72,
  windowIn: 4.25,
  // 3 cockpit: he looks at the hole through the porthole, then glances down at his wrist (and holds the look)
  glance: 4.6,
  // 4 one wrist raise (the forearm swings up about the elbow); the camera closes in on the watch; one compressed hour
  raise: 4.95,
  raiseEnd: 5.6,
  pushWatch: 5.1,
  watchClose: 6.35,
  hourStart: 5.62,
  hourEnd: 7.14,
  match: 8.2,
  // 5 the wall clock at home races; one eased move to the window; the same window from outside (on 'years')
  toWindow: 8.3,
  windowMatch: 9.4,
  // 6 the pull-back lands on the garden and holds: seasons, the tree grows, the friend ages in his place
  pullEnd: 10.72,
  yearsEnd: 11.5,
  // 7 the ship returns to the street; the hatch; he steps out and walks to his friend at the gate
  descent: 11.42,
  landing: 12.0,
  hatch: 12.1,
  stepOut: 12.22,
  stepDown: 12.38,
  arrive: 13.8,
  // 8 their faces together: he searches the old face, recognises him
  faces: 13.8,
  recognise: 14.02,
  // 9 he turns in place, walks through the gate, up the path, through the front door (seen outside), into the room
  turnToHouse: 14.38,
  walk: 14.58,
  atDoor: 16.08,
  inside: 16.2,
  roomStop: 16.56,
  // 10 the photograph; the change in him on 'gone' (held on his face before the camera goes to the photo)
  seePhoto: 16.44,
  realise: 16.66,
  photoPush: 17.32,
  photoClose: 18.0,
  // 11 from the young faces in the photograph to his still-young face; his old friend steps into the doorway
  toFace: 18.5,
  faceHold: 19.3,
  friendIn: 19.5,
  // 12 his watch, his old friend; the eased push into the watch face; the match to the ship's window; the opening (loop)
  watchUp: 20.5,
  loopPush: 21.65,
  loopCut: 22.7,
  dur: DUR,
};
/** the hole's own clock (disk rotation, image frames): offset so that the end of the film flows into frame 0 */
export const BH_OFFSET = 0.6; // (just after the loop cut the hole is out of frame and its frames are faded out, so the clamp to frame 0 there is unseen)
export const bhT3 = (t: number) => (t >= T3.loopCut ? t - DUR + BH_OFFSET : t + BH_OFFSET);
/** the space timeline is periodic: after the loop cut, space time runs from -(DUR - loopCut) up to 0 at the last frame */
export const spaceTau = (t: number) => (t >= T3.loopCut ? t - DUR : t);
