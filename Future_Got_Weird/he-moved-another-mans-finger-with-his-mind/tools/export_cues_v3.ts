// V2: exports every V2 sequence's sound cues (CUES_VA..CUES_VG) and the sequence starts for the mix.
//   npx --prefix source esbuild tools/export_cues_v3.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --loader:.woff2=empty --loader:.woff=empty --external:remotion --outfile=/tmp/ec3.cjs && NODE_PATH=source/node_modules node /tmp/ec3.cjs audio/cues_v3.json
import {writeFileSync} from 'fs';
import {SCENES3} from '../source/src/v3/scenes3';
import * as A from '../source/src/v3/SeqA';
import * as B from '../source/src/v3/SeqB';
import * as C from '../source/src/v3/SeqC';
import * as D from '../source/src/v3/SeqD';
import * as E from '../source/src/v3/SeqE';
import * as F from '../source/src/v3/SeqF';
import * as G from '../source/src/v3/SeqG';
import * as H from '../source/src/v3/SeqH';
import {T, TE, FRAMES} from '../source/src/lib/core';
const mods: [string, any][] = [['A', A], ['B', B], ['C', C], ['D', D], ['E', E], ['F', F], ['G', G], ['H', H]];
const cues: {t: number; kind: string; gain?: number; dur?: number; scene: string}[] = [];
for (const [n, m] of mods) {
  const fn = m[`CUES_V${n}`];
  if (typeof fn !== 'function') { console.log('no cues for', n); continue; }
  for (const c of fn()) cues.push({...c, scene: n});
}
cues.sort((a, b) => a.t - b.t);
writeFileSync(process.argv[2], JSON.stringify({
  frames: FRAMES,
  scenes: SCENES3.map((s) => ({id: s.id, start: s.start()})),
  K: {flipped: T('With the coil flipped'), flippedEnd: TE('With the coil flipped'), across3: T('Across all three pairs'), bad: T('Bad connection'),
    goBack: T('Go back to that finger'), wrong: TE('the other guy was wrong'), fire: TE('over the internet. Fire'), trust: T('Here’s where I’d start')},
  cues,
}, null, 1));
console.log('wrote', process.argv[2], cues.length, 'cues');
