// Glass Climbing V2: the set and the film's length. The bay of V1 (world/geo.ts units: 6.2 per cm, y down, the floor at
// y = 0, the glass face at x = 0 with the climber on +x), rebuilt so the film can loop on one wide frame:
//   - the glass now stands on a brick knee wall (the catch happens on that brick, at the foot of the climb);
//   - a step stool stands in front of the brick (frame 0: his left foot on it, about to step off into the stirrup);
//   - horizontal window frames (transoms) cross the glass, the fixed marks that show how far he has climbed.
import TL from '../data/timeline.json';

export const FPS = 30;
/** V2 keeps V1's narration take and word times; only the tail after the last word is shorter (0.42 s, a sentence
 *  pause), so "...the same contact." runs straight on into "If you pressed..." */
export const LAST_WORD_END = TL.words[TL.words.length - 1].end;
export const FRAMES = Math.round((LAST_WORD_END + 0.42) * FPS);
export const DUR = FRAMES / FPS;

/** top of the brick knee wall (the glass's base channel sits on it) */
export const BRICK_TOP = -860;
/** the step stool: its top and its x extent (toward the climber) */
export const STOOL = {x0: 235, x1: 545, top: -400};
/** transoms (window frames) across the glass: centre heights */
export const TRANSOMS = [-1860, -2860, -3860];
/** where the near pad is pressed on the brick (pad centre) */
export const BRICK_PAD_Y = BRICK_TOP + 10 + 62;
