// V2 shot group A (see production/V2_SHOT_PLAN.md): A2 the thumb on the remote's button, A3 the match cut to the
// backpack's LED and the signal to the coil, A4 the operator at the bench, C4 the feed becomes his monitor.
import React from 'react';
import {ShotProps} from './index2';
import {A2} from './a/A2';

export const SHOTS_A: Record<string, React.FC<ShotProps>> = {A2};
