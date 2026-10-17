// "The Problem With Tesla's Rocket Car" (Future Got Weird, 9:16, 30 fps). A follow-up to the Roadster reveal Short:
// what cold-gas thrust asks of a car. Real footage opens it, one schematic car carries the explanation through six
// compositions, real footage lands the payoff, and the CTA shows the upside-down drive the long video explains.
// Script, timeline, sources: script/rocket_short.md. Clips: footage/CLIP_LEDGER.md ("Rocket Short").
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {DURATION, FPS, FRAMES, HANG_T, INV_T, T, WIPE} from './data';
import {Opening} from './Opening';
import {Schematic} from './Schematic';
import {Return} from './Return';
import {CtaCue, Hang, Inverted} from './Ending';
import {RocketCaptions} from './Captions';

export const ROCKET_FRAMES = FRAMES;
const f = (t: number) => Math.round(t * FPS);

export const RocketShort: React.FC<{audio?: boolean; captions?: boolean; narration?: boolean}> = ({audio = true, captions = true, narration = true}) => {
  const schemA = T.pre - 0.05;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence from={0} durationInFrames={f(T.swap + 0.6)}><Opening audio={audio} /></Sequence>
      <Sequence from={f(WIPE) - 1} durationInFrames={f(INV_T) - f(WIPE) + 1}><Return start={(f(WIPE) - 1) / FPS} /></Sequence>
      <Sequence from={f(INV_T)} durationInFrames={f(HANG_T) - f(INV_T)}><Inverted /></Sequence>
      <Sequence from={f(HANG_T)} durationInFrames={FRAMES - f(HANG_T)}><Hang /></Sequence>
      <Sequence from={f(schemA)} durationInFrames={f(WIPE + 0.35) - f(schemA)}><Schematic start={f(schemA) / FPS} /></Sequence>
      <CtaCue />
      {captions && <RocketCaptions end={DURATION} />}
      {audio && narration && <Audio src={staticFile('rocket/narration.wav')} />}
      {audio && <Audio src={staticFile('rocket/bed.wav')} />}
    </AbsoluteFill>
  );
};
