// R2 shot registry: every section module contributes shots {id, start, end, C} in FILM seconds. The master
// composition (MainR2) plays them in order; any part of a section not yet covered by shots renders as a labelled card.
import React from 'react';
import {M, Mv} from '../timing';
import {TitleCard} from '../shots/A/Title';
import {Credits} from '../shots/G/Credits';

export type R2Shot = {id: string; sec: Mv; start: number; end: number; note: string; C: React.FC};

const titleDur = M.TITLE_OUT - M.TITLE_IN;
const creditsDur = M.END - M.CREDITS_IN;
const TitleShot: React.FC = () => React.createElement(TitleCard, {dur: titleDur});
const CreditsShot: React.FC = () => React.createElement(Credits, {dur: creditsDur});

/** Section modules register here (imported lazily below to keep this file free of cycles). */
export const BASE_SHOTS: R2Shot[] = [
  {id: 'A_title', sec: 'A', start: M.TITLE_IN, end: M.TITLE_OUT, note: 'black title card', C: TitleShot},
  {id: 'G_credits', sec: 'G', start: M.CREDITS_IN, end: M.END, note: 'credits crawl', C: CreditsShot},
];
