// "Which gives us a useful distinction: looking as though you are speaking and understanding what you are saying are
// different problems." Two cards in the channel's style-frame manner: the robot's moving mouth under "Looking like
// speaking", an empty question under "Understanding what is said", set apart on "different problems".
import React from 'react';
import {Robot} from '../art/Robot';
import {Card, UI} from '../art/Ui';
import {INK} from '../dc/ink';
import {fmt} from '../dc/math';
import {pr, T} from '../lib/core';
import {K, robotAt} from '../state';

export const Distinction: React.FC<{f: number}> = ({f}) => {
  const st = robotAt(f);
  const k1 = 1; // in place on the cut
  const push = 1 + 0.035 * pr(f, K.distinction, K.flaws);
  const k2 = pr(f, T('understanding what') - 0.35, T('understanding what') + 0.25);
  const apart = pr(f, T('different problems.') - 0.1, T('different problems.') + 0.6);
  const dx = 60 * apart;
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill="#EFE6D2" />
      <rect x={0} y={800} width={1920} height={280} fill="#8FB3AD" opacity={0.5} />
      <g transform={`translate(960 520) scale(${fmt(push)}) translate(-960 -520)`}>
      <Card x={170 - dx} y={190} w={740} h={640} title="Looking like speaking" k={k1} rot={-1.5} titleSize={50} accent={UI.blue}>
        <defs>
          <clipPath id="ds-c1">
            <rect x={40} y={130} width={660} height={470} rx={16} />
          </clipPath>
        </defs>
        <rect x={40} y={130} width={660} height={470} rx={16} fill="#D6E0E2" />
        <g clipPath="url(#ds-c1)">
          <Robot id="ds-rob" st={{...st, yaw: 0}} x={370} y={330} s={2.4} />
        </g>
        <rect x={40} y={130} width={660} height={470} rx={16} fill="none" stroke={INK} strokeWidth={3} />
      </Card>
      <Card x={1010 + dx} y={190} w={740} h={640} title="Understanding what is said" k={k2} rot={1.5} titleSize={50} accent={UI.coral}>
        <rect x={40} y={130} width={660} height={470} rx={16} fill="#F3EEE2" stroke="#B9B2A3" strokeWidth={3} strokeDasharray="12 9" />
        <text x={370} y={420} textAnchor="middle" fontFamily="Fredoka Variable" fontWeight={600} fontSize={200} fill="#C9C1B0">
          ?
        </text>
      </Card>
      {apart > 0.01 && <line x1={960} y1={fmt(230)} x2={960} y2={fmt(800)} stroke={INK} strokeWidth={4} strokeDasharray="14 12" opacity={apart} />}
      </g>
    </g>
  );
};
export {K};
