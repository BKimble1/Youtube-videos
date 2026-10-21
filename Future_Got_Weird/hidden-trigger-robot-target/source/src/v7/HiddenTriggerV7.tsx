// FGW "A Hidden Trigger Made This Robot Target a Fake Hand" V7 (final timeline rescue / publish QA).
// The V7 audit (production/V7_EDL.json, tools/check_timeline_v7.py) found the V6 timeline already in narration order:
// every shot sits on the phrase it illustrates, in story order, and the delivered V6 files decode in that order. So
// V7 renders the same picture and audio as V6 through one explicit composition, with the shot table below as the
// authoritative edit order that the automated checks enforce. Changed in V7: caption starts re-measured on the locked
// narration waveform (Captions7), and the encode (keyframe every 0.5 s, lossless frame capture; render commands).
import React from 'react';
import {HiddenTriggerV6, shot6} from '../v6/HiddenTriggerV6';
import {Captions7} from './Captions7';

export const HiddenTriggerV7: React.FC<{audio?: string | false}> = (props) => <HiddenTriggerV6 {...props} captions={Captions7} />;
export const shot7 = shot6;

// Intended edit order: shot id -> story beat, the narration phrase(s) it must play under, and its source components.
// beats: 0 hook, 1 task, 2 redirect, 3 props, 4 robot real, 5 planted trap, 6 normal, 7 trigger, 8 switch,
// 9 execution, 10 aftermath, 11 trap waiting, 12 loop
// edge: phrases a shot may overlap only at its boundary, by <= 0.35 s (a J-cut: the picture leads the phrase it illustrates)
export const SHOT_TABLE: {id: string; beat: number; phrases: number[]; edge?: number[]; components: string[]}[] = [
  {id: 'P1', beat: 0, phrases: [0], components: ['v6/World6.TestBay6', 'v6/Fluid6', 'v3/rig3', 'v6/kin6.approachPose+strokePose']},
  {id: 'P2', beat: 0, phrases: [0], components: ['v6/Scientist6.SciFront (startle)']},
  {id: 'P3', beat: 1, phrases: [0, 1], components: ['v6/World6.TestBay6', 'v3/rig3']},
  {id: 'P4', beat: 2, phrases: [2], edge: [1], components: ['v6/World6.TestBay6 (overhead)', 'v3/rig3']},
  {id: 'P5', beat: 2, phrases: [2, 3], components: ['v6/World6.TestBay6', 'v3/rig3']},
  {id: 'P6', beat: 3, phrases: [3, 4], components: ['v6/World6.TestBay6 (cuff)', 'v6/Fluid6.EffectsLine']},
  {id: 'P7', beat: 3, phrases: [5], components: ['v6/World6.TestBay6 (grip)', 'v3/rig3']},
  {id: 'P8', beat: 4, phrases: [5, 6], components: ['v6/World6.TestBay6 (lab)', 'v6/Scientist6.SciFigure']},
  {id: 'P9', beat: 5, phrases: [6, 7], components: ['v3/rig3 (elbow)', 'v6/Screen6']},
  {id: 'P10', beat: 5, phrases: [7, 8], components: ['v6/Screen6']},
  {id: 'P11', beat: 5, phrases: [7, 8], components: ['v6/Scientist6.SciRear', 'v6/Screen6']},
  {id: 'P12', beat: 5, phrases: [8], components: ['v6/Scientist6.SciFront (eyes)']},
  {id: 'P13', beat: 6, phrases: [8, 9], components: ['v6/World6.TestBay6', 'v3/rig3']},
  {id: 'P14', beat: 6, phrases: [10], edge: [9], components: ['v6/World6.TestBay6', 'v3/rig3', 'v6/kin6.MIME6']},
  {id: 'P15', beat: 7, phrases: [11, 12], edge: [10], components: ['v6/Screen6 (request, marker, pulse, swap)']},
  {id: 'P16', beat: 8, phrases: [12], components: ['v6/World6.TestBay6 (icon match)']},
  {id: 'P17', beat: 9, phrases: [12, 13], components: ['v6/Scientist6.SciFront (notice)', 'v6/World6.TestBay6']},
  {id: 'P18', beat: 9, phrases: [13], components: ['v3/rig3 (wrist)']},
  {id: 'P19', beat: 9, phrases: [13], components: ['v6/World6.TestBay6', 'v6/Fluid6', 'v6/kin6.approachPose+strokePose']},
  {id: 'P20', beat: 10, phrases: [13, 14], components: ['v6/Scientist6.SciFront (startle)']},
  {id: 'P21', beat: 11, phrases: [14], components: ['v6/Screen6 (branch waiting)']},
  {id: 'P22', beat: 11, phrases: [14, 15], components: ['v6/Scientist6.SciFront (watch)', 'v6/World6.TestBay6', 'v6/Fluid6.BenchMarks']},
  {id: 'P23', beat: 12, phrases: [15], components: ['v6/World6.TestBay6', 'v6/kin6.approachPose']},
];
// P1 is a deliberate 0.6 s flash-forward excerpt of P19 (the hook); it is the only shot allowed to repeat content.
export const INTENTIONAL_REPEATS = [['P1', 'P19']];
