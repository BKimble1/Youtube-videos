import React from 'react';
import {AbsoluteFill} from 'remotion';
import {lookAt} from '../lib/cam';
import {AlcoveScene, S13Co, s13Acting} from '../shots/S13';
import {ALCOVE} from '../sets/Alcove';
// camera candidates for the alcove shots: a 4x2 grid of quarter-size frames at film time T
export const AlcTest: React.FC<{T: number; cos: (S13Co & {tips?: boolean})[]}> = ({T, cos}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {cos.map((co, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <AlcoveScene id={`t${i}`} T={T} cam={lookAt(co.eye, co.tgt, co.f, co.cx ?? 540, co.cy)} A={{...s13Acting(T), recog: 0.6, recoil: 0.3}} scaleRef={co.tips ? ALCOVE.tips : undefined} legslab={false} skip={['alc-gapL', 'alc-gapR']} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace'}}>{i}</div>
      </div>
    ))}
  </AbsoluteFill>
);
