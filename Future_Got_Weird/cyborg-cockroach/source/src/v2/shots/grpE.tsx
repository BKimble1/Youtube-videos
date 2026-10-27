// V3 shot group E (see production/V3_SHOT_PLAN.md): the rescue journey, E1-E6.
import React from 'react';
import {ShotProps} from './index2';
import {E1} from './e/rescue/E1r';
import {E2} from './e/rescue/E2r';
import {E3} from './e/rescue/E3r';
import {E4} from './e/rescue/E4r';

export const SHOTS_E: Record<string, React.FC<ShotProps>> = {E1, E2, E3, E4};
export const CAPY_E: Record<string, number> = {E1: 1590};
export const cuesE = () => [];
