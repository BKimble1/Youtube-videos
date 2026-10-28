// Writes the picture's beat table (source/src/beats.ts) and the measured words to audio/beats.json for the mix.
// build: source/node_modules/.bin/esbuild tools/export_beats.ts --bundle --platform=node --format=cjs --outfile=/tmp/eb.cjs && node /tmp/eb.cjs
import {writeFileSync} from 'fs';
import {B} from '../source/src/beats';
import {DURATION, WORDS} from '../source/src/lib';
writeFileSync('audio/beats.json', JSON.stringify({duration: DURATION, beats: B, words: WORDS}, null, 1));
console.log('beats', Object.keys(B).length, 'duration', DURATION);
