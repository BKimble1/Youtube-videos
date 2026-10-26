// Writes audio/cues.json from the picture (src/events.ts). From the episode root:
//   (cd source && npx tsc -p tsconfig.cues.json) && NODE_PATH=source/node_modules node /tmp/fgw_cues/dev/exportCues.js audio/cues.json
// (compiled with tsc: esbuild's resolver confuses rig/roach.ts with rig/Roach.tsx)
import {cueFile} from '../events';

declare const require: (m: string) => {writeFileSync: (p: string, s: string) => void};
declare const process: {argv: string[]};
const out = cueFile();
require('fs').writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('cues written:', out.events.length, 'events');
