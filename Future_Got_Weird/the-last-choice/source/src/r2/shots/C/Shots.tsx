// Section C shots: C1 the turn (BASS_OUT), C2 his POV (ALLY1), C3 the vault and the climb (ALLY2a/b), C4 the rest
// arrive (MARCH), C5 three close-ups (the hand on the shoulder, the reel, the strap), C6 ASSEMBLE → CHARGE in four
// (the turn, the tools readied, the threat, the commit) — all sampling one choreography (crew.ts).
import React from 'react';
import {Stage, useShotTime, camPath} from '../../film/stage';
import {V3, add3} from '../../../kit/math';
import type {Item, View} from '../../engine';
import {combine} from '../../fx';
import {motes} from '../B/kit';
import {CUT} from './beats';
import {crewItems, droneFx, dustFx, setC, armyC, armyDustFx, C_COLUMNS} from './kit';
import {B_COLUMNS} from '../B/kit';
import {CAM_C1, CAM_C2, CAM_C3, CAM_C4A, CAM_C4B, CAM_C5A, CAM_C5B, CAM_C5C, CAM_C6A, CAM_C6B, CAM_C6C, CAM_C6D} from './cams';
import {crewC} from './crew';

const head = (T: number, up = 1.55): V3 => { const b = crewC(T).director.body.pos; return {x: b.x, y: b.y + up, z: b.z}; };

// ------------------------------------------------------------------ C1
export const ShotC1: React.FC = () => {
  const {t, T} = useShotTime(CUT.c1);
  const cam = camPath(CAM_C1, t, 0.6);
  const items = (v: View): Item[] => [
    ...setC(v, T),
    ...crewItems(v, T, {only: ['director'], anchor: {director: head(T, 1.45)}}),
    ...motes('c1m', {x: 1.6, y: 4.6, z: 2.3}, {x: 1.0, y: 0.6, z: 0.9}, T, 22, 0.005),
  ];
  return <Stage T={T} cam={cam} items={items} drift={0.008} atmos={{smoke: 0.6, haze: 0.2}} vignette={0.6} />;
};

// ------------------------------------------------------------------ C2
export const ShotC2: React.FC = () => {
  const {t, T} = useShotTime(CUT.c2);
  const cam = camPath(CAM_C2, t, 0.5);
  const d = dustFx(T, {near: {x: -14, y: 0, z: -2}, maxDist: 8});
  const items = (v: View): Item[] => [...setC(v, T), ...crewItems(v, T, {skip: ['director']}), ...d.items];
  return <Stage T={T} cam={cam} items={items} lights={d.lights} drift={0.018} atmos={{columns: C_COLUMNS, smoke: 0.9, haze: 0.2}} vignette={0.65} />;
};

// ------------------------------------------------------------------ C3
export const ShotC3: React.FC = () => {
  const {t, T} = useShotTime(CUT.c3);
  const cam = camPath(CAM_C3, t, 0.4);
  const d = dustFx(T);
  const items = (v: View): Item[] => [...setC(v, T), ...crewItems(v, T, {anchor: {director: head(T, 1.35)}}), ...d.items];
  return <Stage T={T} cam={cam} items={items} lights={d.lights} drift={0.015} atmos={{columns: C_COLUMNS, smoke: 0.8, haze: 0.15}} vignette={0.55} />;
};

// ------------------------------------------------------------------ C4
export const ShotC4a: React.FC = () => {
  const {t, T} = useShotTime(CUT.c4);
  const cam = camPath(CAM_C4A, t, 0.5);
  const f = combine(dustFx(T), droneFx(T));
  const items = (v: View): Item[] => [...setC(v, T), ...crewItems(v, T), ...f.items];
  return <Stage T={T} cam={cam} items={items} lights={f.lights} drift={0.012} atmos={{columns: C_COLUMNS, smoke: 0.7, haze: 0.15}} vignette={0.55} />;
};
export const ShotC4b: React.FC = () => {
  const {t, T} = useShotTime(CUT.c4b);
  const cam = camPath(CAM_C4B, t, 0.5);
  const f = combine(dustFx(T), droneFx(T));
  const items = (v: View): Item[] => [...setC(v, T), ...crewItems(v, T), ...f.items, ...armyC(v, T, {maxMid: 10})];
  return <Stage T={T} cam={cam} items={items} lights={f.lights} drift={0.01} atmos={{columns: C_COLUMNS, smoke: 0.7, haze: 0.15}} vignette={0.55} />;
};

// ------------------------------------------------------------------ C5 (three close-ups)
export const ShotC5a: React.FC = () => {
  const {t, T} = useShotTime(CUT.c5a);
  const cam = camPath(CAM_C5A, t, 0.5);
  const f = droneFx(T);
  const items = (v: View): Item[] => [
    ...setC(v, T), ...crewItems(v, T, {anchor: {director: head(T, 1.45), breaker: add3(crewC(T).breaker.body.pos, {x: 0, y: 1.45, z: 0})}}),
    ...f.items, ...armyC(v, T, {maxMid: 10}),
    ...motes('c5am', {x: 0.7, y: 4.9, z: 1.3}, {x: 0.8, y: 0.5, z: 0.6}, T, 18, 0.005),
  ];
  return <Stage T={T} cam={cam} items={items} lights={f.lights} drift={0.01} atmos={{smoke: 0.6, haze: 0.15}} vignette={0.62} />;
};
export const ShotC5b: React.FC = () => {
  const {t, T} = useShotTime(CUT.c5b);
  const cam = camPath(CAM_C5B, t, 0.5);
  const f = droneFx(T);
  const items = (v: View): Item[] => [
    ...setC(v, T), ...crewItems(v, T, {anchor: {tether: add3(crewC(T).tether.body.pos, {x: 0, y: 0.9, z: 0})}}),
    ...f.items, ...armyC(v, T, {maxMid: 8}),
  ];
  return <Stage T={T} cam={cam} items={items} lights={f.lights} drift={0.01} atmos={{smoke: 0.6, haze: 0.15}} vignette={0.62} />;
};
export const ShotC5c: React.FC = () => {
  const {t, T} = useShotTime(CUT.c5c);
  const cam = camPath(CAM_C5C, t, 0.5);
  const f = droneFx(T);
  const items = (v: View): Item[] => [
    ...setC(v, T), ...crewItems(v, T, {anchor: {director: head(T, 1.25)}}), ...f.items,
    ...motes('c5cm', {x: 1.0, y: 4.6, z: 1.9}, {x: 0.6, y: 0.4, z: 0.6}, T, 14, 0.004),
  ];
  return <Stage T={T} cam={cam} items={items} lights={f.lights} drift={0.008} atmos={{smoke: 0.6, haze: 0.15}} vignette={0.62} />;
};

// ------------------------------------------------------------------ C6 (ASSEMBLE → CHARGE: no held lineup)
// C6a the shared turn (low, in front); C6b the tools readied (a track along the line); C6c the threat (over his
// shoulder: their front rank breaks into its run); C6d the commit (he steps out, they step up, the set, the first
// stride) — D1-1 cuts in on the stride.
export const ShotC6a: React.FC = () => {
  const {t, T} = useShotTime(CUT.c6);
  const cam = camPath(CAM_C6A, t, 0.4);
  const f = combine(droneFx(T), dustFx(T));
  const items = (v: View): Item[] => [...setC(v, T), ...crewItems(v, T), ...f.items];
  return <Stage T={T} cam={cam} items={items} lights={f.lights} drift={0.014} atmos={{smoke: 0.85, haze: 0.12}} vignette={0.55} />;
};
export const ShotC6b: React.FC = () => {
  const {t, T} = useShotTime(CUT.c6b);
  const cam = camPath(CAM_C6B, t, 0.25);
  const f = combine(droneFx(T), dustFx(T));
  const c = crewC(T);
  const up = (r: 'decoy' | 'flares' | 'breaker' | 'drone') => add3(c[r].body.pos, {x: 0, y: 1.2, z: 0});
  const items = (v: View): Item[] => [...setC(v, T), ...crewItems(v, T, {anchor: {decoy: up('decoy'), flares: up('flares'), breaker: up('breaker'), drone: up('drone')}}), ...f.items];
  return <Stage T={T} cam={cam} items={items} lights={f.lights} drift={0.012} atmos={{smoke: 0.7, haze: 0.12}} vignette={0.6} />;
};
export const ShotC6c: React.FC = () => {
  const {t, T} = useShotTime(CUT.c6c);
  const cam = camPath(CAM_C6C, t, 0.5);
  const f = combine(droneFx(T), armyDustFx(T));
  const items = (v: View): Item[] => [...setC(v, T), ...crewItems(v, T, {only: ['director'], anchor: {director: head(T, 1.4)}}), ...armyC(v, T, {full: 0, far: 140, maxMid: 40, farFrom: 140}), ...f.items];
  return <Stage T={T} cam={cam} items={items} lights={f.lights} drift={0.008} atmos={{columns: B_COLUMNS, smoke: 0.35, haze: 0.08}} vignette={0.6} />;
};
export const ShotC6d: React.FC = () => {
  const {t, T} = useShotTime(CUT.c6d);
  const cam = camPath(CAM_C6D, t, 0.4);
  const f = combine(droneFx(T), dustFx(T));
  const items = (v: View): Item[] => [...setC(v, T), ...crewItems(v, T, {anchor: {director: head(T, 1.2)}}), ...f.items];
  return <Stage T={T} cam={cam} items={items} lights={f.lights} drift={0.02} atmos={{smoke: 0.8, haze: 0.12}} vignette={0.55} />;
};
