import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BodyMap, bodyCam} from '../art/Body';
import {inv} from '../lib/math';
import {SHOT, fS} from '../lib/timeline';

export const bodyState = (f: number) => {
  const [f0, f1] = SHOT.s07;
  return {
    f,
    cam: bodyCam(f, f0, fS('organs'), fS('heart'), f1 - 26, f1),
    organs: inv(fS('begin to fail'), fS('fail') + 6, f) * (1 - 0.9 * inv(fS('heart') - 4, fS('heart') + 10, f)),
    chaos: inv(fS('lethal') - 4, fS('lethal') + 8, f),
    signal: inv(f1 - 26, f1 - 2, f),
    ecg: inv(fS('heart') + 2, fS('heart') + 10, f) * (1 - inv(f1 - 24, f1 - 14, f)),
    dots: 1,
  };
};
export const BodyTest: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <BodyMap id="bm" st={bodyState(f)} />
      </svg>
    </AbsoluteFill>
  );
};
