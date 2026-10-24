// Production document: the three looks in the Crew rig at four views, plus faces.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import './fonts';
import {BODY_P, BODY_R, PERSON, PERSON_LAB, RUNNER} from './rig/cast';
import {Crew4} from './rig/Crew';
import {FACES, stand} from './rig/poses';

export const ModelSheet: React.FC = () => {
  const rows = [
    {id: 'p', look: PERSON, b: BODY_P, f: FACES.focus},
    {id: 'l', look: PERSON_LAB, b: BODY_P, f: FACES.neutral},
    {id: 'r', look: RUNNER, b: BODY_R, f: FACES.alarm},
  ];
  const phis = [0, 35, 90, 160];
  return (
    <AbsoluteFill style={{backgroundColor: '#FAF3DF'}}>
      <svg width={1080} height={1920}>
        {rows.map((r, i) => phis.map((phi, j) => (
          <Crew4 key={`${i}${j}`} id={`m${i}${j}`} look={r.look} b={r.b} pose={stand(r.b, r.f)} cd={{x: 150 + j * 260, y: 590 + i * 620, k: 1.15, phi, depth: 3}} />
        )))}
      </svg>
    </AbsoluteFill>
  );
};
