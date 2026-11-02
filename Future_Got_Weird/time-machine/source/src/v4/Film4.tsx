import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {clamp, FPS} from '../lib';
import {CaptionLine} from '../Captions';
import {Scene4, capY} from './Scene4';
import {warp, DUR4, CAPTIONS4} from './warp';

/** V4 captions on the V4 timeline: each phrase in sync with its words, 2-frame fades; the first fades in over the last
 *  frames so it is on as the loop starts again */
const Captions4: React.FC<{t: number}> = ({t}) => {
  const C = CAPTIONS4;
  const i = C.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  const nodes: React.ReactNode[] = [];
  if (i >= 0) {
    const c = C[i];
    const a = (i === 0 ? 1 : clamp((t - c.show) / 0.067)) * clamp((c.hide - t) / 0.067);
    nodes.push(<CaptionLine key={i} c={c} y={capY(i)} a={a} />);
  }
  const t0 = DUR4 - 3.5 / 30;
  if (t > t0) nodes.push(<CaptionLine key="loop" c={C[0]} y={capY(0)} a={clamp((t - t0) / 0.1)} />);
  return <>{nodes}</>;
};
export const Frame4: React.FC<{f: number; captions: boolean}> = ({f, captions}) => {
  const t4 = f / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: '#0B0E1D', overflow: 'hidden'}}>
      <Scene4 t={warp(t4)} fkey={`g${f}_`} captions={false} />
      {captions && <Captions4 t={t4} />}
    </AbsoluteFill>
  );
};
export const Film4: React.FC<{audio: string | false; captions: boolean}> = ({audio, captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Frame4 f={f} captions={captions} />
      {audio && <Audio src={staticFile(`audio/${audio}.wav`)} />}
    </AbsoluteFill>
  );
};
export const Sheet4: React.FC<{fs: number[]; captions: boolean; cols?: number}> = ({fs, captions, cols = 4}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Frame4 f={f} captions={captions} />
          <div style={{position: 'absolute', left: 20, top: 20, fontSize: 80, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
