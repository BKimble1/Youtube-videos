// V5 timeline. The narration, captions, the whole V2 mix and the 1005-frame / 30 fps timeline are unchanged
// (production/V3_AUDIO_LOCK.md); every event is a word time (src/data/timeline.json) or an effect already in the mix
// (audio/sfx_cues_v2.json). V5 re-reads the mix's opening effects for its new hook:
//   0-1.75    'loop leader crackle' (-28 dB, crossing the seam from 32.9): the machine charging, the console crackling
//   1.75      'connection crack' (-18 dB, the loudest effect) + thunder 2.1: the electric surge / glitch, the skeleton flash
//   2.72      'ARM button press' (-30 dB) + relay 2.79: (free; no picture event required)
//   3.52      'restrike crack 0' (-30 dB): the upward leader from the tower connects along the beam ("FOLLOWED")
//   3.64, 3.83 re-strokes down the guided channel
import {B} from '../v3/timeline3';
import {EV4} from '../v4/timeline4';

export {DUR, tau3} from '../v3/timeline3';
/** beat boundaries: V3's, plus V5's new shots (beat owners may request changes; keep them on caption/word times) */
export const B5 = {
  ...B,
  B2: 6.31, // "the flow of electricity": the storm-scale view of lightning struggling through ordinary air
  D3: 13.33, // "and HEATING a narrow channel": new channel shots (to E2)
  E2: 16.92, // "an EASIER PATH to travel": back into V3's molecular leader (V3 ChannelDE from here)
  H3: 31.88, // "using the AIR ITSELF": the loop shot (inside the control room, into the hook)
};
export const EV5 = {...EV4, hookSurge: 1.75};
