// Section shot modules register their shots here (film seconds). Each section owns its folder src/r2/shots/<SEC>/
// and exports SHOTS_<SEC>: R2Shot[] (see src/r2/film/registry.ts for the type).
import type {R2Shot} from '../film/registry';

export const SECTION_SHOTS: R2Shot[] = [];
