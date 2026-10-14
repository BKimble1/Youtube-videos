import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Wrist3D} from '../art/Device';
import {HAND_LIMP} from '../art/Hand';
import {SCREEN_IDLE, ScreenState} from '../lib/screen';
import {PAL} from '../lib/color';

const states: ScreenState[] = [
  {...SCREEN_IDLE, f: 30},
  {...SCREEN_IDLE, f: 30, red: 1, secs: 134, timerIn: 1, flash: 0.2},
  {...SCREEN_IDLE, f: 30, red: 1, secs: 101, timerIn: 1, alert: 1},
  {...SCREEN_IDLE, f: 30, red: 1, secs: 96, timerIn: 1, stab: 1},
  {...SCREEN_IDLE, f: 30, red: 1, secs: 96, timerIn: 1, stab: 1, recover: 1},
  {...SCREEN_IDLE, f: 30, red: 1, secs: 96, timerIn: 1, stab: 1, recover: 1, glitch: 1},
];

/** Device design check: rolls 0 / 35 / 70 / 90 at macro scale, and every screen state. Frame n picks a layout. */
export const DeviceTest: React.FC = () => {
  const f = useCurrentFrame();
  const rolls = [0, 35, 70, 90];
  return (
    <AbsoluteFill style={{background: '#9CC08A'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {f === 0 &&
          rolls.map((r, i) => (
            <g key={i} transform={`translate(0 ${i * 470})`}>
              <Wrist3D id={`w${i}`} E={{x: -60, y: 250}} W={{x: 720, y: 230}} rE={130} rW={96} dev={{screen: states[1], roll: r, yaw: 14}} hand={{pose: HAND_LIMP, L: 96 * 4.6, ang: -1.5, thumbSide: 1, offset: 30}} ink={7} />
            </g>
          ))}
        {f === 1 &&
          states.map((s, i) => (
            <g key={i} transform={`translate(${(i % 2) * 540 - 330} ${Math.floor(i / 2) * 640 - 40}) scale(0.62)`}>
              <Wrist3D id={`s${i}`} E={{x: 0, y: 500}} W={{x: 1000, y: 470}} rE={140} rW={110} dev={{screen: s, roll: 0, yaw: 14}} ink={7} />
            </g>
          ))}
        {f === 2 && (
          <g>
            <rect width={1080} height={1920} fill={PAL.grass} />
            <Wrist3D id="sm" E={{x: 400, y: 900}} W={{x: 590, y: 930}} rE={29} rW={21} dev={{screen: states[0], roll: 0, yaw: 14}} hand={{pose: HAND_LIMP, L: 117, ang: 9, thumbSide: 1, offset: 7}} ink={8.5} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
