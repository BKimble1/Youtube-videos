import React from 'react';
import {AbsoluteFill} from 'remotion';
import {K} from '../art/kit';
import {PageFace, SheetLine, World} from '../art/Sheet';
import {colCenter, CONTACTS, S_BEND, spiralAt, sAtTurnPhi} from '../lib/sheet';

export const Geo: React.FC = () => {
  const c19 = colCenter(19);
  return (
    <AbsoluteFill style={{background: K.scanBg}}>
      <svg width={1920} height={1080}>
        <World cam={{x: 0, y: 0, z: 6.2}} cx={480} cy={300}>
          <SheetLine color={K.scanLine} width={1.6} />
          {CONTACTS.map((c, i) => {
            const p = spiralAt(sAtTurnPhi(c.turn, c.phi));
            return <circle key={i} cx={p.x} cy={p.y} r={1.2} fill="none" stroke={K.coral} strokeWidth={2} vectorEffect="non-scaling-stroke" />;
          })}
        </World>
        <World cam={{x: c19, y: 0, z: 1.9}} cx={1400} cy={300}>
          <PageFace id="g1" anchor={{s: 0, x: 0, y: 0}} s0={c19 - 260} s1={c19 + 260} />
        </World>
        <World cam={{x: 2900, y: 0, z: 0.3}} cx={960} cy={820}>
          <PageFace id="g2" anchor={{s: 0, x: 0, y: 0}} />
        </World>
        <text x={20} y={1060} fill="#fff" fontSize={20}>S_BEND {S_BEND.toFixed(0)}</text>
      </svg>
    </AbsoluteFill>
  );
};
