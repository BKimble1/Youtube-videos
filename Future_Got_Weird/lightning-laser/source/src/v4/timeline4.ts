// V4 timeline. The narration, captions, the whole V2 mix and the 1005-frame / 30 fps timeline are V3's, unchanged
// (production/V3_AUDIO_LOCK.md), so every event below is a word time (src/data/timeline.json) or an effect start
// already in the mix (audio/sfx_cues_v2.json). V4 re-reads some of the mix's effects for its new opening:
//   0-1.75   'loop leader crackle' (-28 dB, crossing the seam from 32.9): the field crackling at the rod tip (corona)
//   1.75     'connection crack' (-18 dB) + thunder 2.1: a flash inside the storm deck ("into a THUNDERSTORM")
//   3.52     'restrike crack 0' (-30 dB): the upward leader from the tower connects ("FOLLOWED" 3.26-3.77)
//   3.64, 3.83 'restrike cracks 1, 2' (-33, -36 dB): re-strokes down the guided channel
// Beats B, C, D, E and G are V3's (v3/), unchanged; A, F and H are new (v4/).
import {B, EV} from '../v3/timeline3';

export {DUR, FPS3 as FPS4, tau3} from '../v3/timeline3';
/** beat boundaries: V3's, plus V4's sub-beats (tuned by the beat owners; keep them on word/caption times) */
export const B4 = {...B};
export const EV4 = {
  ...EV,
  // A (V4)
  wordFired: 0.16, wordLaser: 0.59, wordInto: 1.2, wordThunderstorm: 1.45, wordAnd: 2.56, wordLightning: 2.79,
  cloudFlash: 1.75, // the loud crack: lightning inside the storm deck (no bolt to the tower)
  aConnect: 3.52, // the upward leader from the tower reaches the cloud
  aRestrikes: [3.64, 3.83],
  // F (V4): the leader incepts 19.55 and connects 21.85 (as V3); words
  wordSo: 18.83, wordErupted: 19.49, wordFrom: 20.35, wordNearby: 20.54, wordPart: 21.67, wordBolt: 22.01,
  wordFollowedF: 22.31, wordFor: 23.24, wordHundred: 23.96,
};
