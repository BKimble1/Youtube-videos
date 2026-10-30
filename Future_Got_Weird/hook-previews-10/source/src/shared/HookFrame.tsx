// The common wrapper every hook renders through: one background, the hook's scene (given t in seconds), a gentle
// frame grade, the captions in screen space, and the hook's audio. Audio: 'mix' (narration + effects, built by
// tools/audio/hNN.py), 'narration' (voice only) or 'none'.
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import '@fontsource-variable/nunito';
import {Captions} from './Captions';
import {FPS, Words} from './lib';

export type HookProps = {audio: 'mix' | 'narration' | 'none'; captions: boolean};

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
      {props.audio !== 'none' && <Audio src={staticFile(`audio/h${hook}_${props.audio}.wav`)} />}
    </AbsoluteFill>
  );
};
