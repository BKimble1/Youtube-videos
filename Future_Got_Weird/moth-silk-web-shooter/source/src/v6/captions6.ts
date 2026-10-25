// V5 caption placement (checked by tools/v5/cap_check5.ts against the action points of every frame).
import {CAPTIONS} from '../lib';

/** caption centre (px) per caption (by its first words); a caption never moves while it shows */
export const CAP_Y_V6: [string, number][] = [
  ['Imagine', 1480], ['at', 1480], ['and watching', 1480], ['that', 1480], ['Scientists', 1480], ['the first', 1480],
  ['They', 1480], ['from moth', 1480], ['and dissolve', 1480], ['As', 1480], ['through', 1480], ['a surrounding', 1480],
  ['triggers', 1480], ['A sticky', 1480], ['forms', 380], ['It hits', 380], ['and attaches', 380], ['Then', 380],
  ['and the blade', 1480], ['out', 1080], ['In lab', 1480], ['these', 1480], ['eighty', 1480], ['The beginnings', 720],
  ['of a real', 1480], ['made', 380],
];
export const capY6 = (t: number) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return 1600;
  const [first, y] = CAP_Y_V6[i];
  if (!CAPTIONS[i].text.startsWith(first)) throw new Error(`V5 caption table out of step at ${i}: ${CAPTIONS[i].text}`);
  return y;
};

