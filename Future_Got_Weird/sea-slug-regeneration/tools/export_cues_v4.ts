// Writes the V4 picture's event frames and the narration words for the mix: audio/cues_v4.json
import {writeFileSync} from 'fs';
import {CUES4} from '../source/src/v4/shots4';
import {WORDS} from '../source/src/lib';
writeFileSync(process.argv[2], JSON.stringify({...CUES4(), words: WORDS}, null, 1));
console.log('cues written', process.argv[2]);
