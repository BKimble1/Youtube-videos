// V2 shot group H (the integrator's): the hook A1 and the loop shot F5 (see production/V2_SHOT_PLAN.md).
import React from 'react';
import {ShotProps} from './index2';
import {A1} from './h/A1';
import {F5} from './h/F5';

export const SHOTS_H: Record<string, React.FC<ShotProps>> = {A1, F5};
