// V2 shot group C (see production/V2_SHOT_PLAN.md): C1 two insects, two jobs; C2 push to the observer's lens; C3 the
// lens's view (the feed, reused by group A's C4 monitor through C3Feed).
import React from 'react';
import {ShotProps} from './index2';
import {C1} from './c/C1';
import {C2} from './c/C2';
import {C3} from './c/C3';
import {C3Feed} from './c/Feed';

export const SHOTS_C: Record<string, React.FC<ShotProps>> = {C1, C2, C3};
export {C3Feed};
