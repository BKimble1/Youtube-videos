import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Bench, C, H, Headline, Plate, W, Wall} from './film/common';
import {B01World} from './film/beats1';
import {CheckerBody, checkerState} from './film/checker';

/** Portrait cover: the settled opening hand with the missing position circled, checker peeking in. Frame 80 of the film. */
export const Cover: React.FC = () => {
  const st = checkerState(80);
  return (
    <AbsoluteFill style={{background: C.saffron}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <g transform="translate(540 820) scale(1.15) translate(-540 -820)">
          <Wall g={0} layers={[]} />
          <CheckerBody g={80} st={st} />
          <Bench />
          <B01World g={80} />
        </g>
        <Headline x={540} y={250} text="NO PINKY?" size={140} />
        <Plate x={540} y={1275} text="ON PURPOSE." size={116} fill={C.coral} />
      </svg>
    </AbsoluteFill>
  );
};
