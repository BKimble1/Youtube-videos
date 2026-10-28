// Writes the V2 picture's beat table (source/src/v2/beatsV2.ts) and the measured words to audio/beats_v2.json for the V2 mix.
// build: source/node_modules/.bin/esbuild tools/export_beats_v2.ts --bundle --platform=node --format=cjs --outfile=/tmp/eb2.cjs && node /tmp/eb2.cjs
import {writeFileSync} from 'fs';
import {B2} from '../source/src/v2/beatsV2';
import {DURATION, WORDS} from '../source/src/lib';
writeFileSync('audio/beats_v2.json', JSON.stringify({duration: DURATION, beats: B2, words: WORDS}, null, 1));
console.log('beats', Object.keys(B2).length, 'duration', DURATION);
