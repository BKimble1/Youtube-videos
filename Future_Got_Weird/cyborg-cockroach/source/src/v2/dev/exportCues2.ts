// Writes audio/cues_v2.json (and the burned-in caption frames for the SRT). From the episode root:
//   (cd source && npx tsc -p tsconfig.cues2.json) && NODE_PATH=source/node_modules node /tmp/fgw_cues2/v2/dev/exportCues2.js audio/cues_v2.json audio/captions_frames_v2.json
import {cueFile2} from '../events2';
import {CAPS2} from '../captions2';
import {FPS} from '../../timeline';

declare const require: (m: string) => {writeFileSync: (p: string, s: string) => void};
declare const process: {argv: string[]};
const out = cueFile2();
require('fs').writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('cues written:', out.events.length, 'events');
if (process.argv[3]) {
  const caps = CAPS2.map((c) => ({text: c.text, show: c.show, hide: c.hide, fps: FPS}));
  require('fs').writeFileSync(process.argv[3], JSON.stringify(caps, null, 1));
  console.log('captions written:', caps.length);
}
