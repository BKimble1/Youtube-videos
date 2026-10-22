// Sound cue sheet. Every time is derived from the same narration cues the shots animate to, so effects land on the
// molecular events. Exported to audio/sfx_cues.json by tools/export_cues.mjs; synthesised and mixed by
// tools/make_audio.py. Effects are restrained: clicks, pressure swells, soft pops — no guns, explosions or lasers.
import {DURATION, T, TE} from './kit/core';
import * as H from './shots/Hook';
import * as R from './shots/Reveal';
import * as Cp from './shots/Copy';
import * as A from './shots/Address';
import * as S from './shots/Switch';
import * as V from './shots/Survivor';
import * as F from './shots/Future';
import {HOOK_END} from './shots/Hook';
import {REVEAL_END} from './shots/Reveal';
import {COPY_END} from './shots/Copy';
import {ADDRESS_END} from './shots/Address';
import {SWITCH_END} from './shots/Switch';
import {SURVIVOR_END} from './shots/Survivor';

export type Kind = 'click' | 'pop' | 'whoosh' | 'press' | 'thud' | 'snip' | 'blip' | 'crackle' | 'riser' | 'sweep' | 'bind' | 'drop' | 'shimmer';
export type Cue = {t: number; kind: Kind; gain?: number; dur?: number; pitch?: number};
const c = (t: number, kind: Kind, gain = 1, dur?: number, pitch?: number): Cue => ({t, kind, gain, dur, pitch});

export const CUES: Cue[] = [
  // 1 hook
  c(0, 'press', 0.6, 2.2, 0.7),
  c(H.tHide - 0.05, 'shimmer', 0.7, 1.0),
  c(H.tTrig - 0.05, 'whoosh', 0.7, 1.0),
  c(H.tAcid - 0.1, 'press', 0.8, 1.6, 0.9),
  c(H.T_UNLOCK, 'click', 0.9, undefined, 1.2),
  c(H.T_UNLOCK + 0.12, 'click', 0.7, undefined, 1.0),
  c(H.T_OPEN0 + 0.05, 'whoosh', 0.6, 0.6, 1.3),
  c(H.T_OPEN1, 'bind', 0.8),
  // 2 reveal
  c(HOOK_END, 'sweep', 0.8, 1.6),
  c(R.tTest + 1.05, 'blip', 0.5), c(R.tTest + 1.5, 'blip', 0.5, undefined, 1.12), c(R.tTest + 1.95, 'blip', 0.5, undefined, 1.25),
  c(R.tSystem + 0.1, 'blip', 0.6), c(R.tSystem + 0.38, 'blip', 0.6, undefined, 1.12), c(R.tSystem + 0.66, 'blip', 0.6, undefined, 1.25), c(R.tSystem + 0.94, 'blip', 0.6, undefined, 1.5),
  c(R.tNotCured + 0.05, 'thud', 0.7),
  c(REVEAL_END - 1.1, 'whoosh', 0.8, 1.1),
  // 3 copy
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => c(Cp.tFirst - 0.25 + i * 0.12 + 0.7, 'click', 0.35, undefined, 0.9 + i * 0.05)),
  c(Cp.tTwins, 'shimmer', 0.6, 1.2),
  c(Cp.tScans - 0.5, 'sweep', 0.5, 1.4),
  c(Cp.tUpd + 0.6, 'drop', 0.7),
  c(Cp.tGoal + 0.1, 'whoosh', 0.6, 1.0),
  c(Cp.tOne + 0.3, 'press', 0.5, 1.4, 1.2),
  c(Cp.tReturns + 0.3, 'thud', 0.8),
  c(Cp.CUT_C, 'whoosh', 0.7, 0.6, 1.4),
  c(Cp.CUT_D, 'thud', 0.4),
  c(Cp.tSim + 0.4, 'blip', 0.5),
  c(Cp.CUT_E, 'sweep', 0.6, 1.2),
  c(Cp.tThis - 0.1, 'shimmer', 0.6, 1.0),
  // 4 address
  c(COPY_END, 'press', 0.7, 1.6, 0.8),
  c(A.tOwn + 1.4, 'pop', 0.6),
  ...[0, 1, 2, 3, 4, 5].map((i) => c(A.tDrug + 0.9 + i * 0.27, 'click', 0.28, undefined, 1.4 + (i % 3) * 0.1)),
  c(A.CUT_B, 'whoosh', 0.7, 0.8),
  ...[0, 1, 2, 3].map((i) => c(A.tAttach + 0.45 + i * 0.28, 'click', 0.75, undefined, 1.0 + i * 0.08)),
  c(A.tBind, 'bind', 0.9),
  c(A.tPit0, 'press', 0.7, 1.3, 0.8),
  c(A.tPinch, 'pop', 0.9),
  ...[0, 1, 2, 3].map((i) => c(A.tCut + i * 0.32 + 0.05, 'snip', 0.8, undefined, 1 + i * 0.06)),
  c(A.tRel - 0.1, 'shimmer', 0.5, 1.0),
  c(A.CUT_D, 'whoosh', 0.6, 0.8),
  c(A.tOpen + 0.2, 'crackle', 0.6, 1.4),
  c(A.CUT_E, 'press', 0.5, 1.4),
  c(A.CUT_F, 'thud', 0.4),
  c(A.tSide + 1.3, 'bind', 0.7),
  c(A.CUT_G, 'blip', 0.5),
  ...[0, 1, 2, 3, 4, 5].map((i) => c(A.CUT_G + 0.3 + i * 0.31, 'blip', 0.22, undefined, 1 + (i % 4) * 0.12)),
  c(A.tComp + 0.3, 'bind', 0.7, undefined, 1.3),
  c(A.tProt + 0.1, 'click', 0.8, undefined, 1.1),
  c(A.tRecog + 0.1, 'whoosh', 0.6, 1.0),
  c(A.tImm, 'bind', 0.8),
  c(ADDRESS_END - 0.45, 'whoosh', 0.9, 0.9, 0.8),
  // 5 switch
  c(S.tSurr, 'press', 0.6, 1.6, 0.9),
  c(S.CUT_B + 0.2, 'whoosh', 0.6, 0.9),
  c(S.tKaro + 0.4, 'shimmer', 0.5, 1.6),
  ...[0, 1, 2, 3, 4, 5].map((i) => c(S.tKaro + 0.9 + i * 0.32, 'click', 0.3, undefined, 0.9 + i * 0.07)),
  c(S.CUT_C, 'sweep', 0.5, 0.8),
  ...[0, 1, 2, 3, 4, 5].map((i) => c(S.tHides + 0.2 + i * 0.12, 'blip', 0.3, undefined, 1 + i * 0.08)),
  c(S.tTog + 0.8, 'bind', 0.7),
  c(S.CUT_D, 'press', 0.7, 1.4, 0.9),
  c(S.tExp - 0.4, 'click', 0.9, undefined, 1.2), c(S.tExp - 0.28, 'click', 0.7),
  c(S.tExp, 'whoosh', 0.6, 0.6, 1.3),
  c(S.tExp + 1.3, 'bind', 0.9),
  c(S.tHelp, 'riser', 0.6, 0.9),
  c(S.CUT_D2, 'thud', 0.6),
  c(S.CUT_D2 + 0.9, 'crackle', 0.7, 1.8),
  c(S.CUT_E, 'whoosh', 0.4, 0.8),
  c(S.CUT_F, 'thud', 0.3),
  c(S.CUT_G, 'sweep', 0.6, 1.2),
  c(S.tIfExp, 'blip', 0.5),
  // 6 survivor
  c(SWITCH_END, 'thud', 0.8),
  c(V.tThen + 0.75, 'thud', 0.7), c(TE('entire plan') - 0.1, 'thud', 0.9),
  c(V.tSurv - 0.6, 'riser', 0.8, 0.7),
  c(V.CUT_C, 'whoosh', 0.6, 0.9),
  c(V.tTreat + 0.1, 'sweep', 0.7, 2.6),
  c(V.tTreat + 1.0, 'crackle', 0.5, 2.0),
  c(V.tSo, 'press', 0.6, 1.6, 0.8),
  c(V.CUT_F, 'whoosh', 0.5, 0.8),
  ...[0, 1, 2, 3, 4].map((i) => c(V.CUT_F + 1.0 + i * 0.7, 'blip', 0.3, undefined, i % 2 ? 0.9 : 1.2)),
  c(V.CUT_G, 'sweep', 0.5, 1.0),
  c(V.tEscape, 'riser', 0.5, 0.8),
  c(V.tNew + 0.6, 'drop', 0.7),
  // 7 future
  c(SURVIVOR_END, 'shimmer', 0.6, 1.2),
  c(F.tAimed, 'blip', 0.5), c(F.tDeliv, 'blip', 0.5, undefined, 1.12), c(F.tDeliv + 1.0, 'click', 0.6),
  c(F.tStages, 'whoosh', 0.5, 1.0),
  c(F.tNot + 0.65, 'thud', 0.6),
  c(F.CUT_D, 'press', 0.5, 1.4),
  c(F.tMiss + 0.8, 'riser', 0.5, 0.6),
  c(F.CUT_E, 'whoosh', 0.5, 0.6),
  c(F.tCarrier + 1.3, 'bind', 0.6),
  c(F.CUT_F, 'blip', 0.4),
  c(F.tNextScan - 0.3, 'thud', 0.7),
  c(F.tVanish - 0.1, 'shimmer', 0.5, 0.9),
  c(F.CUT_H, 'sweep', 0.5, 1.4),
  c(F.CUT_I, 'press', 0.6, 2.0, 0.7),
  c(F.tChall + 0.1, 'click', 0.8, undefined, 1.2),
  c(F.tChall + 0.45, 'whoosh', 0.5, 0.6, 1.3),
  c(F.tRight + 0.3, 'bind', 0.9),
  c(F.CUT_J, 'whoosh', 0.7, 1.4, 0.7),
];

// Ambience beds by scene type: [start, end, kind]
export type Bed = [number, number, 'micro' | 'digital' | 'room' | 'tissue'];
export const BEDS: Bed[] = [
  [0, HOOK_END, 'micro'],
  [HOOK_END, REVEAL_END, 'digital'],
  [REVEAL_END, Cp.CUT_D, 'digital'], [Cp.CUT_D, Cp.CUT_E, 'room'], [Cp.CUT_E, COPY_END, 'digital'],
  [COPY_END, A.CUT_B, 'tissue'], [A.CUT_B, A.CUT_E, 'micro'], [A.CUT_E, A.CUT_E2, 'tissue'], [A.CUT_E2, A.CUT_F, 'room'], [A.CUT_F, A.CUT_G, 'tissue'], [A.CUT_G, A.CUT_H, 'room'], [A.CUT_H, ADDRESS_END, 'micro'],
  [ADDRESS_END, S.CUT_D2, 'micro'], [S.CUT_D2, S.CUT_E, 'tissue'], [S.CUT_E, S.CUT_G, 'room'], [S.CUT_G, SWITCH_END, 'digital'],
  [SWITCH_END, V.CUT_F, 'tissue'], [V.CUT_F, V.CUT_F2, 'digital'], [V.CUT_F2, V.CUT_G, 'room'], [V.CUT_G, SURVIVOR_END, 'digital'],
  [SURVIVOR_END, F.CUT_E, 'digital'], [F.CUT_E, F.CUT_F, 'tissue'], [F.CUT_F, F.CUT_G, 'digital'], [F.CUT_G, F.CUT_I, 'room'], [F.CUT_I, DURATION, 'micro'],
];
// Score sections: [start, end, mood]
export const SCORE: [number, number, string][] = [
  [0, HOOK_END, 'tense'],
  [HOOK_END, REVEAL_END, 'reveal'],
  [REVEAL_END, COPY_END, 'build'],
  [COPY_END, ADDRESS_END, 'drive'],
  [ADDRESS_END, S.CUT_E, 'tense'],
  [S.CUT_E, SWITCH_END, 'calm'],
  [SWITCH_END, V.tSurv + 1.2, 'survivor'],
  [V.tSurv + 1.2, SURVIVOR_END, 'build'],
  [SURVIVOR_END, F.CUT_H, 'reflect'],
  [F.CUT_H, F.CUT_I, 'warm'],
  [F.CUT_I, DURATION, 'end'],
];
export const MARKS = {survives: V.tSurv, end: DURATION, back: TE('no way back'), narrStart: T('This microscopic')};

// Every picture cut / section boundary (for QA transition strips)
export const CUTS: [number, string][] = [
  [HOOK_END, 'hook→reveal (match cut)'], [REVEAL_END, 'reveal→copy (push into card)'], [Cp.CUT_C, 'copy: dive'], [Cp.CUT_D, 'copy: clinic compare'], [Cp.CUT_E, 'copy: usual vs this'],
  [COPY_END, 'copy→address (wire→tissue)'], [A.CUT_B, 'address: molecular'], [A.CUT_D, 'address: whole cell'], [A.CUT_E, 'address: tissue+vessel'], [A.CUT_E2, 'address: infusion'], [A.CUT_F, 'address: side effects'], [A.CUT_G, 'address: protein design'], [A.CUT_H, 'address: immune cell'],
  [ADDRESS_END, 'address→switch (silhouette wipe)'], [S.CUT_C, 'switch: bottom-up'], [S.CUT_D, 'switch: open+bind'], [S.CUT_D2, 'switch: apoptosis'], [S.CUT_E, 'switch: mice'], [S.CUT_F, 'switch: bench'], [S.CUT_G, 'switch: opportunity'],
  [SWITCH_END, 'switch→survivor'], [V.tThen + 0.75, 'survivor: push 2'], [TE('entire plan') - 0.1, 'survivor: push 3'], [V.CUT_C, 'survivor: groups'], [V.CUT_F, 'survivor: predictions'], [V.CUT_F2, 'survivor: clinic'], [V.CUT_G, 'survivor: routes'],
  [SURVIVOR_END, 'survivor→future'], [F.CUT_D, 'future: missed pocket'], [F.CUT_E, 'future: healthy tissue'], [F.CUT_F, 'future: victory'], [F.CUT_G, 'future: screen'], [F.CUT_H, 'future: people'], [F.CUT_I, 'future: callback'], [F.CUT_J, 'future: pull back'],
];
