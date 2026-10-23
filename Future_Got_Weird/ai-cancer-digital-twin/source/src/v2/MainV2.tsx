// V2/V3 film (the source was revised in place for V3; V2 is tagged fgw-cancer-v2-review in git): "AI Just Cured All Cancer" — complete narrative rebuild. Composition MainV2 (mix) / PreviewV2 (narration).
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Director, Shot} from './director';
import {FRAMES2} from './time';
import {shotsA} from './seq/A';
import {shotsB} from './seq/B';
import {shotsC} from './seq/C';
import {shotsD} from './seq/D';
import {shotsE} from './seq/E';
import {shotsF} from './seq/F';
import {shotsG} from './seq/G';
import {SHOTS_V4} from './v4shots';

export const MAINV2_FRAMES = FRAMES2;
const SHOTS: Shot[] = [...shotsA, ...shotsB, ...shotsC, ...shotsD, ...shotsE, ...shotsF, ...shotsG];

export const MainV2: React.FC<{audio?: 'mix' | 'mix3' | 'mix4' | 'narration' | false; from?: number; v4?: boolean}> = ({audio = 'mix', v4 = false}) => {
  const t = useCurrentFrame() / 30;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Director t={t} shots={v4 ? SHOTS_V4 : SHOTS} />
      {audio === 'mix' && <Audio src={staticFile('audio/mix_v2.wav')} />}
      {audio === 'mix3' && <Audio src={staticFile('audio/mix_v3.wav')} />}
      {audio === 'mix4' && <Audio src={staticFile('audio/mix_v4.wav')} />}
      {audio === 'narration' && <Audio src={staticFile('audio/narration_v2.mp3')} />}
    </AbsoluteFill>
  );
};
