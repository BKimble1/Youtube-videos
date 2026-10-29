// Writes the V2 picture's event frames and the narration words for the mix: audio/cues_v2.json
import {writeFileSync} from 'fs';
import {CUES2} from '../source/src/v2/shots2';
import {WORDS} from '../source/src/lib';
writeFileSync(process.argv[2], JSON.stringify({...CUES2(), words: WORDS}, null, 1));
console.log('cues written', process.argv[2]);
