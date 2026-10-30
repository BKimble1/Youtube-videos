// The common wrapper every hook renders through: one background, the hook's scene (given t in seconds), a gentle
// frame grade, the captions in screen space, and the audio file public/audio/<audio>.wav ('mix_v1' = narration +
// effects from tools/audio/mix_v1.py; 'narration' = voice only; 'none' = silent).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource-variable/nunito';
import {Captions} from './Captions';
import {FPS, Words} from './lib';

export type HookProps = {audio: string; captions: boolean};

export const HookFrame: React.FC<{
  hook: string;
  W: Words;
  bg: string;
  capY: number | number[];
  breaks?: number[];
  vignette?: number;
  props: HookProps;
  children: (t: number) => React.ReactNode;
}> = ({hook, W, bg, capY, breaks, vignette = 0.32, props, children}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <AbsoluteFill>{children(t)}</AbsoluteFill>
      {vignette > 0 && (
        <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 46%, rgba(0,0,0,0) 58%, rgba(4,8,14,${vignette}) 100%)`, pointerEvents: 'none'}} />
      )}
      {props.captions && <Captions t={t} W={W} y={capY} breaks={breaks} />}
      {props.audio !== 'none' && <Audio src={staticFile(`audio/${props.audio}.wav`)} />}
    </AbsoluteFill>
  );
};
