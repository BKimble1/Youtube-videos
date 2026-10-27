// The V2 narration timeline (tools/make_narration_v2.py -> data/timeline_v2.json).
import TL from '../data/timeline_v2.json';
import {makeTimeline} from '../lib';

export const {FRAMES, DUR, CAPTIONS, WORDS, word, T} = makeTimeline(TL);
