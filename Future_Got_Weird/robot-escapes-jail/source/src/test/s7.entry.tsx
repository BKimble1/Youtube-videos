// Test entry for S7 (src/shots/S7Medical.tsx), running the real film times.
//   cd source
//   npx remotion still src/test/s7.entry.tsx S7At /tmp/claude-0/s7/a.png --props='{"t":24}' --log=error
//   npx remotion still src/test/s7.entry.tsx S7Sheet /tmp/claude-0/s7/sheet.png --props='{"t0":22.4667,"dt":0.2,"n":28,"cols":7}' --log=error
//   npx remotion render src/test/s7.entry.tsx S7 /tmp/claude-0/s7/s7.mp4 --log=error
//   S6to7: the boundary frames with the neighbour (S6 from S6Science.tsx); S7Caps: with the film captions
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {SHOTS} from '../story';
import {resetIds} from '../core/ids';
import {S7} from '../shots/S7Medical';
import {S6} from '../shots/S6Science';
import {Captions} from '../Captions';
import '../fonts';

const FPS = 30;

const One: React.FC<{t: number; tag: string; caps?: boolean}> = ({t, tag, caps}) => {
  resetIds(`${tag}_`);
  const V = t < SHOTS.S7[0] ? S6 : S7;
  return (
    <AbsoluteFill style={{background: '#0B1526', overflow: 'hidden'}}>
      <V t={t} />
      {caps && <Captions t={t} y={() => 330} />}
    </AbsoluteFill>
  );
};

const Shot: React.FC<{first: number; caps?: boolean}> = ({first, caps}) => {
  const f = useCurrentFrame();
  return <One t={(first + f) / FPS} tag={`f${f}`} caps={caps} />;
};

export const S7Sheet: React.FC<{t0?: number; dt?: number; n?: number; cols?: number; ts?: number[]; caps?: boolean}> = ({t0 = 22.4667, dt = 0.2, n = 28, cols = 7, ts, caps}) => {
  const k = 1 / cols;
  const times = ts ?? Array.from({length: n}, (_, i) => t0 + i * dt);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {times.map((t, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <One t={t} tag={`c${i}`} caps={caps} />
          <div style={{position: 'absolute', left: 14, top: 10, color: '#FFD84A', font: '700 64px monospace', textShadow: '0 0 6px #000'}}>{t.toFixed(3)}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

export const S7At: React.FC<{t: number; caps?: boolean}> = ({t, caps}) => <One t={t} tag="at" caps={caps} />;

const F0 = Math.ceil(SHOTS.S7[0] * FPS - 1e-9); // first film frame of S7 (674)
const F1 = Math.ceil(SHOTS.S7[1] * FPS - 1e-9); // first film frame of S8 (835)
const Root: React.FC = () => (
  <>
    <Composition id="S7" component={Shot} durationInFrames={F1 - F0} fps={FPS} width={1080} height={1920} defaultProps={{first: F0, caps: false}} />
    <Composition id="S7Caps" component={Shot} durationInFrames={F1 - F0} fps={FPS} width={1080} height={1920} defaultProps={{first: F0, caps: true}} />
    <Composition id="S6to7" component={Shot} durationInFrames={20} fps={FPS} width={1080} height={1920} defaultProps={{first: F0 - 10, caps: false}} />
    <Composition id="S7Sheet" component={S7Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{t0: 22.4667, dt: 0.2, n: 28, cols: 7}} />
    <Composition id="S7At" component={S7At} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{t: 24}} />
  </>
);
registerRoot(Root);
