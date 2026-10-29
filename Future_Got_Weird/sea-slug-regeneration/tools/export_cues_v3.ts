// Writes the V3 picture's event frames and the narration words for the mix: audio/cues_v3.json
import {writeFileSync} from 'fs';
import {CUES3} from '../source/src/v3/shots3';
import {WORDS} from '../source/src/lib';
writeFileSync(process.argv[2], JSON.stringify({...CUES3(), words: WORDS}, null, 1));
console.log('cues written', process.argv[2]);
