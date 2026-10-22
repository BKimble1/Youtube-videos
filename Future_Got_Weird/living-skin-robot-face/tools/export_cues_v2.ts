// Export V2 shot boundaries and effect cue times for QA strips.
import fs from 'node:fs';
import {SH2} from '../source/src/v2/LivingSkinV2';
import {FX} from '../source/src/v2/common2';
fs.writeFileSync(process.argv[2] ?? 'audio/cues_v2.json', JSON.stringify({SH2, FX}, null, 1));
