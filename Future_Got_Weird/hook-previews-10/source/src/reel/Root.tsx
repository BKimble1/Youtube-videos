import React from 'react';
import {Composition} from 'remotion';
import {Separator, SEP_FRAMES, SepProps} from './Separator';

export const ReelRoot: React.FC = () => (
  <Composition id="Sep" component={Separator as React.FC<any>} durationInFrames={SEP_FRAMES} fps={30} width={1080} height={1920}
    defaultProps={{n: '01', name: 'Tongue Parasite'} satisfies SepProps} />
);
