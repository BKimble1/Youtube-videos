import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Jaw, View} from '../art/jaw3d';

const V: {v: View; show?: any; contact?: any; explode?: number; tongueX?: number}[] = [
  {v: {yaw: 0, pitch: -60}},
  {v: {yaw: -28, pitch: -58}, show: {teeth: 0, palate: 0}},
  {v: {yaw: 90, pitch: 0, persp: 4000}},
  {v: {yaw: 70, pitch: -20}, show: {teeth: 0, palate: 0}},
  {v: {yaw: 15, pitch: -70}, show: {teeth: 0, palate: 0}, explode: 1},
  {v: {yaw: 0, pitch: -90}, contact: {u: 0.3, v: -0.2}, tongueX: 1},
];
export const JawTest: React.FC = () => (
  <AbsoluteFill style={{background: '#20384A'}}>
    <svg width={1080} height={1920}>
      {V.map((q, i) => (
        <g key={i} transform={`translate(${270 + (i % 2) * 540}, ${330 + Math.floor(i / 2) * 640}) scale(7)`}>
          <Jaw view={q.v} px={7} id={`jt${i}`} show={q.show} contact={q.contact} explode={q.explode} tongueX={q.tongueX} />
        </g>
      ))}
    </svg>
  </AbsoluteFill>
);
