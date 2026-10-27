// V2 shot group E (see production/V2_SHOT_PLAN.md). Export each built shot in SHOTS_E; unbuilt ids show a placeholder.
import React from 'react';
import {ShotProps} from './index2';
import {E1} from './e/E1';
import {F2} from './e/F2';
import {F1, F3, F4} from './e/F';

export const SHOTS_E: Record<string, React.FC<ShotProps>> = {E1, F1, F2, F3, F4};
