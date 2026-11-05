import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {GameScreen} from '../game/GameScreen';
const TS = [0, 0.033, 0.3, 2.75, 3.9, 5.0, 11.5, 18.1, 18.45, 19.86, 20.6, 21.36, 22.06, 22.9, 27.0, 28.55];
const Grid: React.FC = () => (
  <AbsoluteFill style={{background: '#111'}}>
    {TS.map((t, i) => (
      <div key={i}>
        <GameScreen t={t} rect={{x: (i % 4) * 480, y: Math.floor(i / 4) * 320, w: 480, h: 300}} />
        <div style={{position: 'absolute', left: (i % 4) * 480 + 4, top: Math.floor(i / 4) * 320 + 300, color: '#ff0', font: '16px monospace'}}>{t}</div>
      </div>
    ))}
  </AbsoluteFill>
);
registerRoot(() => <Composition id="G" component={Grid} durationInFrames={1} fps={30} width={1920} height={1280} />);
