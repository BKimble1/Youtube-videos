// Glass Climbing V3: the set and the film's length (world/geo.ts units: 6.2 per cm, y down, the street at y = 0, the
// glass face at x = 0 with the climber on +x). The outside of a glass office building: a full-height curtain wall on a
// brick plinth, a step stool on the pavement in front of it.
import TL from '../data/timeline.json';
import {CM} from '../world/geo';

export const FPS = 30;
/** V3 keeps V1's narration take and word times; the tail after the last word is a 0.42 s sentence pause (as V2), so
 *  "...the same contact." runs straight on into "If you pressed..." at the loop */
export const LAST_WORD_END = TL.words[TL.words.length - 1].end;
export const FRAMES = Math.round((LAST_WORD_END + 0.42) * FPS);

/** top of the brick plinth (the curtain wall's base channel sits on it) */
export const BRICK_TOP = -960;
/** the step stool on the pavement: its top and x extent */
export const STOOL = {x0: 250, x1: 560, top: -330};
/** the climbing straps, ring to stirrup bar (as V1/V2) */
export const STRAP3 = 100 * CM;
/** floor lines of the building: spandrel bands (opaque glass over each floor slab), centre heights */
export const FLOOR_H = 3.4 * 100 * CM; // 3.4 m per storey
export const SPANDRELS = Array.from({length: 9}).map((_, i) => BRICK_TOP - 1500 - i * FLOOR_H);
/** where the near pad is pressed on the brick (pad centre) */
export const BRICK_PAD_Y = BRICK_TOP + 10 + 62;
