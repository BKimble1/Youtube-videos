import React from 'react';
import {FONT_HEAD, K} from '../art/kit';
export const Placeholder: React.FC<{f: number; title: string}> = ({title}) => (
  <g>
    <rect width={1920} height={1080} fill={K.blueLight} />
    <text x={960} y={540} textAnchor="middle" fontFamily={FONT_HEAD} fontSize={80} fill="#162A32">{title}</text>
  </g>
);
