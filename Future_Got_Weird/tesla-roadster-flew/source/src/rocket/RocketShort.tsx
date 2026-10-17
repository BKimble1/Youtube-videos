// "The Problem With Tesla's Rocket Car" (Future Got Weird, 9:16, 30 fps). A follow-up to the Roadster reveal Short:
// what cold-gas thrust asks of a car. Real footage opens and closes it; one labelled schematic carries the explanation
// in between. Script, timeline, sources: script/rocket_short.md. Clips: footage/CLIP_LEDGER.md ("Rocket Short").
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {AbsoluteFill as Fill, interpolate, useCurrentFrame} from 'remotion';
import {C, F} from '../theme';
import {DURATION, FPS, FRAMES, LOOP_T, T, WIPE} from './data';
import {LoopBridge, Opening} from './Opening';
import {Schematic} from './Schematic';
import {Return} from './Return';
import {RocketCaptions} from './Captions';

export const ROCKET_FRAMES = FRAMES;
const f = (t: number) => Math.round(t * FPS);

export const RocketShort: React.FC<{audio?: boolean; captions?: boolean; narration?: boolean}> = ({audio = true, captions = true, narration = true}) => {
  const schemA = T.catch - 0.05;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence from={0} durationInFrames={f(T.swap + 0.6)}><Opening audio={audio} /></Sequence>
      <Sequence from={f(WIPE) - 1} durationInFrames={f(LOOP_T) - f(WIPE) + 1}><Return start={(f(WIPE) - 1) / FPS} /></Sequence>
      <Sequence from={f(LOOP_T)} durationInFrames={FRAMES - f(LOOP_T)}><LoopBridge audio={audio} /></Sequence>
      <Sequence from={f(schemA)} durationInFrames={f(WIPE + 0.55) - f(schemA)}><SchematicOut start={f(schemA) / FPS} /></Sequence>
      <Cta />
      {captions && <RocketCaptions end={DURATION} />}
      {audio && narration && <Audio src={staticFile('rocket/narration.wav')} />}
      {audio && <Audio src={staticFile('rocket/bed.wav')} />}
    </AbsoluteFill>
  );
};

/** The call to action: a plain text cue (not a button), over moving footage to the last frame. */
const Cta: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const o = interpolate(t, [T.full - 0.15, T.full + 0.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (o <= 0) return null;
  return (
    <Fill>
      <div style={{position: 'absolute', top: 120, width: 1080, textAlign: 'center', opacity: o, transform: `translateY(${(1 - o) * -14}px)`}}>
        <div style={{display: 'inline-block', fontFamily: F.display, color: C.cream, background: 'rgba(10,16,20,0.72)', borderRadius: 22, padding: '10px 26px'}}>
          <div style={{fontWeight: 700, fontSize: 52, letterSpacing: 1, lineHeight: 1.05}}>Full Roadster breakdown</div>
          <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 32, opacity: 0.9}}>in the linked video</div>
        </div>
      </div>
    </Fill>
  );
};

/** The schematic, fading out over the real aerial as the dust thins (the cloud passes the camera). */
const SchematicOut: React.FC<{start: number}> = ({start}) => {
  return <Schematic start={start} />;
};
