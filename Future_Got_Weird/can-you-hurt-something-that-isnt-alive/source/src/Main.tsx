import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {ColdOpen} from './scenes/Cold';
import {Display} from './scenes/Display';
import {Chatbot} from './scenes/Chatbot';
import {Indicator} from './scenes/Indicator';
import {Protect} from './scenes/Protect';
import {Answer} from './scenes/Answer';
import {EndScreen} from './scenes/EndScreen';
import {frames, T, NARRATION_END} from './lib/narration';

// Scene boundaries follow the narration's own phrase timings (see lib/narration.ts).
const B = {
  s1: 0,
  s2: frames(T('Picture')),
  s3: frames(T('So why not')),
  s4: frames(T('So researchers look')),
  s5: frames(T('Anthropic gives a reason')),
  s6: frames(T('So, can you hurt')),
  end: frames(NARRATION_END) + frames(0.6),
  total: frames(NARRATION_END) + frames(0.6) + frames(8),
};

export const Main: React.FC<{audio?: boolean}> = ({audio = true}) => (
  <AbsoluteFill>
    <Sequence from={B.s1} durationInFrames={B.s2 - B.s1}><ColdOpen /></Sequence>
    <Sequence from={B.s2} durationInFrames={B.s3 - B.s2}><Display /></Sequence>
    <Sequence from={B.s3} durationInFrames={B.s4 - B.s3}><Chatbot /></Sequence>
    <Sequence from={B.s4} durationInFrames={B.s5 - B.s4}><Indicator /></Sequence>
    <Sequence from={B.s5} durationInFrames={B.s6 - B.s5}><Protect /></Sequence>
    <Sequence from={B.s6} durationInFrames={B.end - B.s6}><Answer /></Sequence>
    <Sequence from={B.end} durationInFrames={B.total - B.end}><EndScreen /></Sequence>
    {audio ? <Audio src={staticFile('audio/mix.mp3')} /> : null}
  </AbsoluteFill>
);

export const MAIN_FRAMES = B.total;
