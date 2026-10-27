// V2 shot group H (the integrator's): the hook A1 and the loop shot F6 (see production/V2_SHOT_PLAN.md).
import React from 'react';
import {ShotProps} from './index2';
import {A1} from './h/A1';
import {F6} from './h/F5';
import {AR} from './h/AR';

export const SHOTS_H: Record<string, React.FC<ShotProps>> = {A0: A1, AR, A1, F6};
