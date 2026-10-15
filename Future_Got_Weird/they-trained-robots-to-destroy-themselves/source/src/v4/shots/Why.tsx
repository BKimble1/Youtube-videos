// V4 WHY section dispatcher (19.4 → 68.0).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {blockStart} from '../../v3/cues';
import {OPEN_END} from './Opening';
import {WhyA, WHY_A_END} from './WhyA';

export const WHY_START = OPEN_END;
export const WHY_END = blockStart('B03') - 0.12;

export const Why: React.FC = () => {
  const f = useCurrentFrame();
  const tau = WHY_START + f / 30;
  if (tau < WHY_A_END) return <WhyA tau={tau} f={f} />;
  return <WhyA tau={WHY_A_END - 0.01} f={f} />;
};
