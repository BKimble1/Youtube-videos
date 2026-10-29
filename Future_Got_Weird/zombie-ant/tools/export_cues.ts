// Export the picture's event times (story.ts) for the sound mix: tools/make_audio.py places effects from these.
import * as fs from 'fs';
import {DUR} from '../source/src/lib';
import {TM, HOOK} from '../source/src/world/story';
import {EVENTS} from '../source/src/world/story';
import {EVENTS2} from '../source/src/world/story2';

const out = {DUR, TM, HOOK, EV: {...EVENTS, ...EVENTS2}};
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('cues ->', process.argv[2], Object.keys(out.EV).length, 'events');
