// V3 shot group F (production/V3_SHOT_PLAN.md): F1-F5, the trapped survivor and the medic coming to her.
import React from 'react';
import {ShotProps} from './index2';
import {F1} from './f/F1';
import {F3} from './f/F3';
import {F5} from './f/F5';
import {Cue} from '../../events';

export const SHOTS_F: Record<string, React.FC<ShotProps>> = {F1, F3, F5};

/** caption centre y per shot (screen px) */
export const CAPY_F: Record<string, number> = {F1: 270, F3: 1560, F5: 1560};

export const cuesF = (): Cue[] => [];
