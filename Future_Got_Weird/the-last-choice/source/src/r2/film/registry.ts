// R2 shot registry: every section module contributes shots {id, start, end, C} in FILM seconds. The master
// composition (MainR2) plays them in order; any part of a section not yet covered by shots renders as a labelled card.
import React from 'react';
import {M, Mv} from '../timing';
import {TitleCard} from '../shots/A/Title';
import {EndCard} from '../shots/G/EndCard';

export type R2Shot = {id: string; sec: Mv; start: number; end: number; note: string; C: React.FC};

const titleDur = M.TITLE_OUT - M.TITLE_IN;
const cardDur = M.END - M.CARD_IN;
const TitleShot: React.FC = () => React.createElement(TitleCard, {dur: titleDur});
const CardShot: React.FC = () => React.createElement(EndCard, {dur: cardDur});

/** Section modules register here (imported lazily below to keep this file free of cycles). */
export const BASE_SHOTS: R2Shot[] = [
  {id: 'A_title', sec: 'A', start: M.TITLE_IN, end: M.TITLE_OUT, note: 'black title card', C: TitleShot},
  {id: 'G_card', sec: 'G', start: M.CARD_IN, end: M.END, note: 'end card: A FUTURE GOT WEIRD FILM', C: CardShot},
];
