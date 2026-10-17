// Section shot modules register their shots here (film seconds). Each section owns its folder src/r2/shots/<SEC>/
// and exports SHOTS_<SEC>: R2Shot[] (see src/r2/film/registry.ts for the type).
import type {R2Shot} from '../film/registry';
import type {Cue} from '../../film/cue';

export const SECTION_SHOTS: R2Shot[] = [];
/** Sound cues from the section modules (film seconds; see src/film/cue.ts for the fields). */
export const SECTION_CUES: Cue[] = [];
