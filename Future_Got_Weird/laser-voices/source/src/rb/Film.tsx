// Laser Voices, rebuild V1: the film. One shot per stretch of narration (see production/REBUILD_V1_SHOT_PLAN.md); the
// joins are a match on his head (hook -> trace), cuts on action, one continuous push from the two-shot into the ear and
// on into the air (with a short dissolve as the drawing changes scale), a whip back up the path into the emitter, and a
// move from the lens back down the path to him. The close-up at the end is the same performance that opens the film.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Captions3} from '../v3/Captions3';
import {FPS} from './beats';
import {CloseShot} from './shots/Close';
import {SideShot} from './shots/Side';
import {PairShot} from './shots/Pair';
import {MicroShot} from './shots/Micro';
import {DeviceShot} from './shots/Device';
import {AimShot} from './shots/Aim';
import {ss} from './shots/common';

export const CUTS = {trace: 1.0, two: 1.95, micro: 8.55, device: 15.0, aim: 17.8, side: 20.0, cross: 23.3, stop: 26.3, blockSide: 27.85, leave: 30.4, back: 32.0};

export const SceneRB: React.FC<{t: number}> = ({t}) => {
  const c = CUTS;
  let node: React.ReactNode;
  if (t < c.trace) node = <CloseShot t={t} mode="loop" />;
  else if (t < c.two) node = <SideShot t={t} mode="trace" />;
  else if (t < c.micro - 0.1) node = <PairShot t={t} />;
  else if (t < c.micro + 0.08)
    node = (
      <>
        <PairShot t={t} />
        <g opacity={ss(c.micro - 0.1, c.micro + 0.08, t)}>
          <MicroShot t={t} />
        </g>
      </>
    );
  else if (t < c.device) node = <MicroShot t={t} />;
  else if (t < c.aim) node = <DeviceShot t={t} />;
  else if (t < c.side) node = <AimShot t={t} mode="aim" />;
  else if (t < c.cross) node = <SideShot t={t} mode="side" />;
  else if (t < c.stop) node = <AimShot t={t} mode="cross" />;
  else if (t < c.blockSide) node = <CloseShot t={t} mode="stop" />;
  else if (t < c.leave) node = <SideShot t={t} mode="block" />;
  else if (t < c.back) node = <AimShot t={t} mode="leave" />;
  else node = <CloseShot t={t} mode="loop" />;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect width={1080} height={1920} fill="#0B1E26" />
      {node}
    </svg>
  );
};

export const FilmRB: React.FC<{audio?: string | false; captions?: boolean}> = ({audio = 'mix_rb', captions = true}) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: '#0B1E26'}}>
      <SceneRB t={t} />
      {captions && <Captions3 t={t} />}
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const FilmRBStill: React.FC<{t: number; captions?: boolean}> = ({t, captions = true}) => (
  <AbsoluteFill style={{background: '#0B1E26'}}>
    <SceneRB t={t} />
    {captions && <Captions3 t={t} />}
  </AbsoluteFill>
);
