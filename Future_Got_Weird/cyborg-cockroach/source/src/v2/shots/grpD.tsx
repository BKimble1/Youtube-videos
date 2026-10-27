// V2 shot group D (see production/V2_SHOT_PLAN.md). Export each built shot in SHOTS_D; unbuilt ids show a placeholder.
import React from 'react';
import {ShotProps} from './index2';
import {D1} from './d/D1';
import {D2} from './d/D2';
import {D3} from './d/D3';
import {D5} from './d/D5';

export const SHOTS_D: Record<string, React.FC<ShotProps>> = {D1, D2, D3, D5};
