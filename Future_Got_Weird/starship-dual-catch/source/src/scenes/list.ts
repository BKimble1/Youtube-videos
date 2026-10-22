import React from 'react';
import {fS, TOTAL_S} from '../kit/tl';
import {HookTrack, HookArms, HookCompare} from './Hook';
import {StackScene, ThrowawayScene} from './Act1';
import {BoosterReturn, GridFins, BoosterCatch, HistoryV3} from './Act2';
import {OrbitScene, ReentryScene, FlipScene} from './Act3';
import {TowerScene, ShipCatch, ShipFit} from './Act4';
import {RiskScene} from './Act5';
import {PayoffScene, FinaleScene} from './Act6';

export type SceneDef = {id: string; from: number; C: React.FC; enter: 'cut' | 'dissolve'};
// Scene windows are tied to the measured narration: each starts a few frames before its first line.
const lead = (id: string, n = 6) => fS(id) - n;
export const SCENES: SceneDef[] = [
  {id: 'hookTrack', from: 0, C: HookTrack, enter: 'cut'},
  {id: 'hookArms', from: lead('h3', 2), C: HookArms, enter: 'cut'},
  {id: 'hookCompare', from: lead('h5', 4), C: HookCompare, enter: 'cut'},
  {id: 'stack', from: lead('a1', 18), C: StackScene, enter: 'dissolve'},
  {id: 'throwaway', from: lead('a5'), C: ThrowawayScene, enter: 'dissolve'},
  {id: 'boosterReturn', from: lead('b1', 18), C: BoosterReturn, enter: 'dissolve'},
  {id: 'gridFins', from: lead('b7'), C: GridFins, enter: 'cut'},
  {id: 'boosterCatch', from: lead('b8'), C: BoosterCatch, enter: 'cut'},
  {id: 'historyV3', from: lead('b13'), C: HistoryV3, enter: 'dissolve'},
  {id: 'orbit', from: lead('c1', 18), C: OrbitScene, enter: 'dissolve'},
  {id: 'reentry', from: lead('c5'), C: ReentryScene, enter: 'dissolve'},
  {id: 'flip', from: lead('c9'), C: FlipScene, enter: 'cut'},
  {id: 'tower', from: lead('d1', 18), C: TowerScene, enter: 'dissolve'},
  {id: 'shipCatch', from: lead('d6'), C: ShipCatch, enter: 'cut'},
  {id: 'shipFit', from: lead('d9'), C: ShipFit, enter: 'dissolve'},
  {id: 'risk', from: lead('e1', 18), C: RiskScene, enter: 'dissolve'},
  {id: 'payoff', from: lead('f1', 18), C: PayoffScene, enter: 'dissolve'},
  {id: 'finale', from: lead('f6'), C: FinaleScene, enter: 'dissolve'},
];
export const MAIN_FRAMES = Math.ceil(TOTAL_S * 30) + 15;
