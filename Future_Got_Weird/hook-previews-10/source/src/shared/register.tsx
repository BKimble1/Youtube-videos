// One composition per entry point: each hook is bundled from its own src/hNN/index.ts so the ten clips render
// independently (no shared scene state, and a broken hook can't stop another from rendering).
import React from 'react';
import {Composition} from 'remotion';
import {FPS, FRAMES, H, W} from './lib';
import {HookProps} from './HookFrame';

export const makeRoot = (id: string, Comp: React.FC<HookProps>) => {
  const Root: React.FC = () => (
    <Composition id={id} component={Comp as React.FC<any>} durationInFrames={FRAMES} fps={FPS} width={W} height={H}
      defaultProps={{audio: 'mix', captions: true} satisfies HookProps} />
  );
  return Root;
};
