// Writes the V5 picture's event frames and the narration words for the mix: audio/cues_v5.json
import {writeFileSync} from 'fs';
import {CUES5} from '../source/src/v5/shots5';
import {WORDS} from '../source/src/lib';
writeFileSync(process.argv[2], JSON.stringify({...CUES5(), words: WORDS}, null, 1));
console.log('cues written', process.argv[2]);
