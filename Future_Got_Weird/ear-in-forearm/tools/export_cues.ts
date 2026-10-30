// Export the picture's event times (story.ts) for the sound mix: tools/make_audio.py places effects from these.
import * as fs from 'fs';
import {DUR} from '../source/src/lib';
import {TM, B} from '../source/src/world/story';

const out = {DUR, TM, B};
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('cues ->', process.argv[2], Object.keys(B).length, 'beats');
