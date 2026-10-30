// HOOK 03 event times (seconds). The audio script tools/audio/h03.py mirrors these values; keep them in step.
import WORDS from '../data/h03_words.json';
import {Words, wordAt} from '../shared/lib';

export const W03 = WORDS as Words;
const at = (w: string, n = 0) => wordAt(W03, w, n).start;

export const EV = {
  splash: 0.0, // frame 0: the mantis is mid-plunge, the crown is rising
  under: 0.32, // the camera passes below the surface line while following it down
  window: at('mantis') + 0.18, // ~1.25 s: a soft clearing on the abdomen shows the coiled worm inside
  part: at('mantis') + 0.45, // ~1.52 s: the last abdominal segments part (membrane bulges)
  emerge: at('into') - 0.05, // ~1.62 s: the worm's pale tip pushes out
  water: at('water'), // 2.03 s: about 1.5 cm out
  crawls: at('crawls'), // 2.95 s: emergence speeds up, the camera tracks along the worm
  body: at('body'), // 4.11 s
  pull: 4.5, // the pull-back to the full mantis and the trailing worm
};
