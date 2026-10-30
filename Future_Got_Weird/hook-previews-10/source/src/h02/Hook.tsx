// HOOK 02: "Scientists gave a cockroach a diving suit… and kept it underwater for hours."
// One continuous take (see world.ts for the timeline and production/h02_NOTES.md for the shot plan).
import React from 'react';
import {HookFrame, HookProps} from '../shared/HookFrame';
import WORDS from '../data/h02_words.json';
import {Words, ss} from '../shared/lib';
import {V3, toW} from './rig/v3';
import {poseRoach} from './rig/roach';
import {Roach2D} from './rig/Roach2D';
import {camAt} from './camPath';
import {EV, PATH, ground, sAt} from './world';
import {Generator, SuitShell, Tubes, breathYOf, gasTravel, tubesLocal, SuitState} from './Suit2D';
import {TracheaWindow} from './Trachea';
import {Floor, Particles, Rubble, Slab, WaterBG} from './Env';

export const Scene: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t);
  const pose = poseRoach({path: PATH, s: sAt(t), t, seed: 2, search: 0.75, ground, antL: {pitch: 0.2}, antR: {pitch: 0.16}});
  const f = pose.frame;
  const deep = 0.12 + 0.62 * ss(t, 0.7, 2.9);
  const st: SuitState = {
    t,
    breath: pose.breath,
    flowK: ss(t, EV.fizz - 0.15, EV.flow + 0.2),
    travel: gasTravel(t, EV.flow - 0.25, EV.flow + 0.25),
    fizz: ss(t, EV.fizz - 0.25, EV.fizz + 0.3),
    dark: 0,
  };
  const tubes = tubesLocal(breathYOf(pose.breath));
  const open = ss(t, EV.winOpen, EV.winOpen + 0.42) * (1 - ss(t, EV.winClose, EV.winClose + 0.5));
  const v = c.v;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <WaterBG c={c} t={t} deep={deep} />
      <Floor c={c} t={t} deep={deep} />
      <Rubble c={c} deep={deep} layer="back" />
      <Particles c={c} t={t} layer="back" />
      <Slab c={c} deep={deep} part="farSupport" />
      <Roach2D
        pose={pose}
        v={v}
        o={{
          id: 'h02r',
          gear: (
            <g>
              <SuitShell id="h02s" v={v} f={f} st={st} />
              <Generator id="h02g" v={v} f={f} st={st} />
              <TracheaWindow id="h02w" v={v} f={f} open={open} t={t} fill0={EV.fill} fillEnd={EV.fillEnd} tubes={tubes} side={1} />
              <Tubes v={v} f={f} st={st} tubes={tubes} />
            </g>
          ),
        }}
      />
      <Slab c={c} deep={deep} part="shadow" />
      <Slab c={c} deep={deep} part="slab" />
      <Rubble c={c} deep={deep} layer="front" />
      <Particles c={c} t={t} layer="front" />
    </svg>
  );
};

export const Hook: React.FC<HookProps> = (props) => (
  <HookFrame hook="02" W={WORDS as Words} bg="#1B3A44" capY={360} props={props}>
    {(t) => <Scene t={t} />}
  </HookFrame>
);
void toW;
