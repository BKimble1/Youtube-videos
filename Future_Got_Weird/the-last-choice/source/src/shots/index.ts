import React from 'react';
import {SHOTS_AB, CUES_AB} from './AB';
import {SHOTS_C1, CUES_C1} from './C1';
import {SHOTS_C2, CUES_C2} from './C2';
import {SHOTS_DE, CUES_DE} from './DE';
import {Cue} from '../film/cue';

export const SHOT_COMPONENTS: Record<string, React.FC> = {...SHOTS_AB, ...SHOTS_C1, ...SHOTS_C2, ...SHOTS_DE};
export const SHOT_CUES: Cue[] = [...CUES_AB, ...CUES_C1, ...CUES_C2, ...CUES_DE];
