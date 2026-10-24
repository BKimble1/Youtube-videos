// Dev only: the V4 cast in the Crew rig at several headings (front, three-quarter, profile, back) and expressions.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {basis, cardOf, v3} from './rig/geo4';
import {Crew4} from './rig/Crew4';
import {BODY_P, GUESSER, CLERK, CHECKER, EXTRAS} from './rig/cast4';
import {stand, FACES} from './rig/poses4';

export const CastSheet4: React.FC<{row: number}> = ({row}) => {
  const b = basis({pos: v3(0, 1.0, -6), yaw: 0, pitch: -2, f: 1500, cx: 540, cy: 960});
  const looks = row === 1 ? [EXTRAS[0], EXTRAS[1], EXTRAS[2], EXTRAS[3], EXTRAS[4]] : [GUESSER, CLERK, CHECKER];
  const heads = [180, 135, 90, 45, 0];
  const faces = [FACES.neutral, FACES.alarm, FACES.focus, FACES.smug, FACES.uhoh];
  return (
    <AbsoluteFill style={{background: '#2C4A57'}}>
      <svg width={1080} height={1920}>
        {looks.map((lk, r) => heads.map((h, i) => {
          const g = v3(-1.6 + i * 0.8, r === 0 ? 1.55 : r === 1 ? -0.1 : -1.75, 0);
          const cd = cardOf(b, g, h);
          return <Crew4 key={`${r}-${i}`} id={`c${r}${i}`} look={lk} b={BODY_P} pose={stand(BODY_P, faces[(i + r) % faces.length])} cd={cd} />;
        }))}
      </svg>
    </AbsoluteFill>
  );
};
