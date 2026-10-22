// Export V3 shot boundaries and effect cue times for QA strips.
import fs from 'node:fs';
import {SH3} from '../source/src/v3/LivingSkinV3';
import {FX} from '../source/src/v2/common2';
fs.writeFileSync(process.argv[2] ?? 'production/v3_cues.json', JSON.stringify({SH3, FX}, null, 1));
