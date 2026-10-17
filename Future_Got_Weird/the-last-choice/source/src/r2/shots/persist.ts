// Every section's persistent machines (wrecks etc.), in one list. Pure data, no React.
import type {Persist} from '../film/continuity';
import {PERSIST_A} from './A/persist';
import {PERSIST_B} from './B/persist';
import {PERSIST_C} from './C/persist';
import {PERSIST_D1} from './D1/persist';
import {PERSIST_D2} from './D2/persist';
import {PERSIST_D3} from './D3/persist';
import {PERSIST_D4} from './D4/persist';
import {PERSIST_EF} from './EF/persist';

export const PERSIST: Persist[] = [...PERSIST_A, ...PERSIST_B, ...PERSIST_C, ...PERSIST_D1, ...PERSIST_D2, ...PERSIST_D3, ...PERSIST_D4, ...PERSIST_EF];
