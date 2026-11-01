import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Astronaut, Friend, ASTRO_IDLE, reach} from '../art/figures';
import {Head} from '../art/crew';

export const CharTest: React.FC = () => {
  const ages = [0, 0.25, 0.5, 0.75, 1];
  return (
    <AbsoluteFill style={{background: '#E9F1F4'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {ages.map((a, i) => (
          <g key={i} transform={`translate(${110 + i * 215} 260) scale(1.45)`}>
            <Head skin="#C98B5E" hair="swoop" hairColor="#2B2B33" age={a} e={{mouth: a > 0.6 ? 'o' : 'smile', open: 0.4, lookX: -0.4}} glasses={a > 0.65 ? 1 : 0} id={`t${i}`} />
          </g>
        ))}
        {ages.map((a, i) => (
          <g key={i} transform={`translate(${110 + i * 215} 560) scale(1.45)`}>
            <Head skin="#F7D9C4" hair="bob" hairColor="#B8743A" age={a} e={{mouth: 'smile'}} id={`m${i}`} />
          </g>
        ))}
        <g transform="translate(300 1700) scale(1.9)">
          <Astronaut pose={{...ASTRO_IDLE, armR: reach(170, -300, 1, 1, 70, -288, 86, 80), e: {wide: 1, mouth: 'gasp', brows: 1, lookX: 0.6}}} id="as" frame={0} />
        </g>
        <g transform="translate(560 1700) scale(1.0)">
          <Friend age={0.1} pose={{armL: {a: 8, b: 10}, armR: {a: 8, b: 10}, e: {mouth: 'smile', lookX: -0.5}}} id="f0" />
        </g>
        <g transform="translate(760 1700) scale(1.0)">
          <Friend age={0.55} pose={{armL: {a: 8, b: 10}, armR: {a: 8, b: 10}, e: {mouth: 'flat', lookX: -0.5}}} id="f1" />
        </g>
        <g transform="translate(960 1700) scale(1.0)">
          <Friend age={1} pose={{armL: {a: 8, b: 10}, armR: {a: 8, b: 10}, e: {mouth: 'o', lookX: -0.5}, cane: true}} id="f2" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
