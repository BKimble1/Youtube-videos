// Writes the picture's event frames and the narration words for the mix: audio/cues.json
import {writeFileSync} from 'fs';
import {CUES} from '../source/src/shots';
import {WORDS} from '../source/src/lib';
writeFileSync(process.argv[2], JSON.stringify({...CUES(), words: WORDS}, null, 1));
console.log('cues written', process.argv[2]);
