import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {RobotWorld} from './RobotWorld';
import {SignalWorld} from './SignalWorld';
import {FPS} from './timing';
import {shotAt, camA, Shot} from './shots';

/** V6: 25 shots with hard cuts on narration words/actions. Picture only: no text, captions, labels or graphs. */
export const FilmV6: React.FC<{audio: string | false}> = ({audio}) => {
  const t = useCurrentFrame() / FPS;
  const sh = shotAt(t);
  return (
    <AbsoluteFill style={{background: '#0C171F'}}>
      {sh.kind === 'A' ? <RobotWorld t={t} cam={camA(sh as Shot & {kind: 'A'}, t)} /> : <SignalWorld t={t} shot={sh as Shot & {kind: 'B'}} />}
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
