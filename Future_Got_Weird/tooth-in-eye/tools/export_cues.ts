// story.ts timing -> audio/cues.json (for tools/make_audio.py)
import {TM, EV} from '../source/src/story';
import {DUR} from '../source/src/lib';
import * as fs from 'fs';
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, TM, EV}, null, 1));
