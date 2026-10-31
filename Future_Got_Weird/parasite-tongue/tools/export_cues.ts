// Prints the picture's event times (story.ts) as JSON for the mix: node <bundle> <out.json>
import {writeFileSync} from 'fs';
import {CUES, W} from '../source/src/story';
import {DUR} from '../source/src/lib';
writeFileSync(process.argv[2], JSON.stringify({DUR, CUES, W}, null, 1));
