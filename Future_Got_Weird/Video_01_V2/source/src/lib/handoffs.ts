import {C} from '../theme';

/**
 * Shared geometry for the motivated transitions (see Main.tsx TRANSITIONS and V2_DIRECTION.md). Both scenes of a
 * hand-off import the same constants, so the outgoing scene's last frame and the incoming scene's first frame match
 * by construction. All values are SCREEN space (1920×1080), not world space.
 */

/** S3 → S4 (cut). S3's last frame: the token "Algorithms" (Source Serif 4, 400) centred on (cx, cy) with its glyphs
 *  `fontPx` tall-em on screen, ink on a saffron-light tile. S4's first frame: the same word, same font, size and place,
 *  printed on a book-spine label in the library; S4 then pulls back to the shelves. */
export const H34 = {word: 'Algorithms', cx: 960, cy: 540, fontPx: 150, ink: C.ink};

/** S5 → S6 (iris). S5 ends with the checker's magnifier lens centred on (x, y) with an inner glass radius r; the
 *  iris opens from that circle onto S6, whose first frames show a spotlight pool centred on the same point. */
export const H56 = {x: 960, y: 540, r: 130};

/** S9 → S10 (cut). S9's last frame: the ChatGPT slip (components/v2/AnswerSlip SlipOnScreen, i = 0) at this pose
 *  carrying a coral "Claim fails" stamp; S10 opens on exactly that and carries it back to the counter. */
export const H910 = {cx: 960, cy: 500, scale: 1.5, rot: -2, stamp: {text: 'Claim fails', tone: 'coral' as const, size: 40, rotate: -9}};
