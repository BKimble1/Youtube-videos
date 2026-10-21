// FGW Hidden Trigger V4 (final visual pass): same approved V3 narration, words and timing (theme3 / phrases_v3.json);
// only the picture and the effect cues change.
import {W3} from '../v3/theme3';
export {W3};

const fr = (s: number) => Math.round(s * 30) / 30;
// Shot boundaries (s), each on a frame.
export const SH4 = {
  stop: 0.85, // the opening descent stops just above the fingers (teaser of the consequence)
  reveal: fr(1.42), // brisk lateral reveal: apple, cutting board and the blade in one frame
  redirect: fr(3.45), // the gripper leaves the apple for the hand; camera tracks it and lands low and tight
  cuff: fr(5.25), // the same gripper motion carries the camera to the molded cuff
  toy: fr(6.467), // blade-level macro of the toy blade as the wrist tilts it
  real: fr(7.933), // pull out along the arm to the whole robot
  elbow: fr(9.8), // elbow close (tracked) -> its cap becomes the software start node
  screen: fr(10.367), // monitor: path to the apple, amber branch planted, dormant
  bridge: fr(12.35), // quick zoom out to the workstation
  both: fr(13.6), // bench: both targets, blade aligns over the apple
  mime: fr(14.533), // tight: one mimed stroke above the apple
  request: fr(16.3), // monitor: request, marker, one pulse through the branch, apple -> hand
  handMatch: fr(19.8), // match cut: hand icon -> the physical hand (target established)
  wrist: fr(20.2), // wrist joint detail, moving
  handMime: fr(20.633), // tight: the redirected approach and one mimed stroke above the hand
  branch: fr(21.7), // the same diagram: the amber branch, dormant, already there
  end: fr(23.0), // the physical setup: blade and shadow begin the approach that loops into frame 0
};
