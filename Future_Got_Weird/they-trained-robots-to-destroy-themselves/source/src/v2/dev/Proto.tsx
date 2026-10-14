// V2 opening prototype: the first ~19.5 s (hook through the push into the simulation), with the V2 narration.
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {HookFoundry, HOOK_FOUNDRY_END} from '../shots/HookFoundry';
import {HookTurn, HOOK_TURN_START, HOOK_TURN_END} from '../shots/HookTurn';

export const PROTO_V2_FRAMES = Math.round(HOOK_TURN_END * 30);
export const ProtoV2: React.FC<{audio?: boolean}> = ({audio = true}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence from={0} durationInFrames={Math.round(HOOK_FOUNDRY_END * 30)}><HookFoundry /></Sequence>
    <Sequence from={Math.round(HOOK_TURN_START * 30)} durationInFrames={PROTO_V2_FRAMES - Math.round(HOOK_TURN_START * 30)}><HookTurn /></Sequence>
    {audio ? <Audio src={staticFile('v2/audio/narration_v2.mp3')} /> : null}
  </AbsoluteFill>
);
