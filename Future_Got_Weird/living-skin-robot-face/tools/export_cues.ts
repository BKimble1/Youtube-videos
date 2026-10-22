// Export the picture's cue and shot times (read from the measured narration) for the sound design and QA tools.
import fs from 'node:fs';
import {CUE, SH} from '../source/src/LivingSkin';
import {DUR, FPS, FRAMES} from '../source/src/lib';
fs.writeFileSync(process.argv[2] ?? 'audio/cues.json', JSON.stringify({DUR, FPS, FRAMES, CUE, SH}, null, 1));
console.log('cues written');
