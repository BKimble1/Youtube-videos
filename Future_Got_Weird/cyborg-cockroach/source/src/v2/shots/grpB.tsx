// V2 shot group B (see production/V2_SHOT_PLAN.md): B1-B5, "Scientists strapped a tiny launcher onto a living
// cockroach, then used electrical pulses to steer it." Shot code in ./b/.
import React from 'react';
import {ShotProps} from './index2';
import {B1, B2} from './b/B12';
import {B3} from './b/B3';
import {B4, B5} from './b/B45';

export const SHOTS_B: Record<string, React.FC<ShotProps>> = {B1, B2, B3, B4, B5};
