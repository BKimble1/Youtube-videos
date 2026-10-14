import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EXPR_PAIN, EXPR_UNEASY} from '../art/Head';
import {HAND_LIMP} from '../art/Hand';
import {SCREEN_IDLE, ScreenState} from '../art/Watch';
import {WristClose} from '../art/WristClose';

const STATES: ScreenState[] = [
  {...SCREEN_IDLE, f: 40, edge: 0.5},
  {...SCREEN_IDLE, f: 40, red: 1, secs: 134, timerIn: 1, flash: 0.2},
  {...SCREEN_IDLE, f: 40, red: 1, secs: 121, timerIn: 1, alert: 1},
  {...SCREEN_IDLE, f: 40, red: 1, secs: 107, timerIn: 1, stab: 1, recover: 1},
  {...SCREEN_IDLE, f: 40, recover: 1, glitch: 1},
];
export const CloseTest: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <WristClose id="wc" cam={{x: 540, y: 960, z: 1}} screen={STATES[f % 5]} expr={f === 4 ? EXPR_UNEASY : EXPR_PAIN} hand={HAND_LIMP} />
      </svg>
    </AbsoluteFill>
  );
};
