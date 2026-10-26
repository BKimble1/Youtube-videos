// Writes audio/cues.json from the picture (src/events.ts). From the episode root:
//   (cd source && npx tsc -p tsconfig.cues.json) && NODE_PATH=source/node_modules node /tmp/fgw_cues/dev/exportCues.js audio/cues.json
// (compiled with tsc: esbuild's resolver confuses rig/roach.ts with rig/Roach.tsx)
import {cueFile} from '../events';
import {capFrames} from '../captions';
import {CAPTIONS, FPS} from '../timeline';

declare const require: (m: string) => {writeFileSync: (p: string, s: string) => void};
declare const process: {argv: string[]};
const out = cueFile();
require('fs').writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('cues written:', out.events.length, 'events');
// optional second output: the captions exactly as the film burns them in (whole frames), for the SRT
if (process.argv[3]) {
  const caps = capFrames.map((c, k) => ({text: CAPTIONS[k].text, show: c.show, hide: c.hide, fps: FPS}));
  require('fs').writeFileSync(process.argv[3], JSON.stringify(caps, null, 1));
  console.log('captions written:', caps.length);
}
