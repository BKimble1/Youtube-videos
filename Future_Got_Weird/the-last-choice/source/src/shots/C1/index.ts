// Shot group C1 (0:47.0–1:28.0): the closing avenue (C1–C4) and the decoy (C5–C8). Components keyed by shot id.
import React from 'react';
import {Cue} from '../../film/cue';
import {C1Shot, CUES as K1} from './C1';
import {C2Shot, CUES as K2} from './C2';
import {C3Shot, CUES as K3} from './C3';
import {C4Shot, CUES as K4} from './C4';
import {C5Shot, CUES as K5} from './C5';
import {C6Shot, CUES as K6} from './C6';
import {C7Shot, CUES as K7} from './C7';
import {C8Shot, CUES as K8} from './C8';

export const SHOTS_C1: Record<string, React.FC> = {C1: C1Shot, C2: C2Shot, C3: C3Shot, C4: C4Shot, C5: C5Shot, C6: C6Shot, C7: C7Shot, C8: C8Shot};
export const CUES_C1: Cue[] = [...K1, ...K2, ...K3, ...K4, ...K5, ...K6, ...K7, ...K8];
