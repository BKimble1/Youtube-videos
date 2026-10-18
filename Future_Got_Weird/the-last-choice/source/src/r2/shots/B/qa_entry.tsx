// QA-ONLY render entry for section B (not part of the film; removed before hand-over): the B shots on the film timeline
// without the other sections, so B can be checked while another section's files are mid-edit.
import React from 'react';
import {AbsoluteFill, Composition, Sequence, registerRoot} from 'remotion';
import {FPS, FRAMES} from '../../timing';
import {SHOTS_B} from './index';

const BQA: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {SHOTS_B.map((s) => {
      const from = Math.round(s.start * FPS), to = Math.round(s.end * FPS);
      return <Sequence key={s.id} name={s.id} from={from} durationInFrames={Math.max(1, to - from)}><s.C /></Sequence>;
    })}
  </AbsoluteFill>
);
registerRoot(() => <Composition id="BQA" component={BQA} durationInFrames={FRAMES} fps={FPS} width={1920} height={1080} />);
