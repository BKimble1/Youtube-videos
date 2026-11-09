// Test entry for S6 (src/shots/S6Science.tsx), running the real film times.
//   cd source
//   npx remotion still src/test/s6.entry.tsx S6At /tmp/claude-0/s6/a.png --props='{"t":17.5}' --log=error
//   npx remotion still src/test/s6.entry.tsx S6Sheet /tmp/claude-0/s6/sheet.png --props='{"t0":17.0333,"dt":0.2,"n":28,"cols":7}' --log=error
//   npx remotion render src/test/s6.entry.tsx S6 /tmp/claude-0/s6/s6.mp4 --log=error
//   S5to6 / S6to7Edge: the boundary frames with the neighbour (S5 from S5Lab.tsx)
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {SHOTS} from '../story';
import {resetIds} from '../core/ids';
import {S6} from '../shots/S6Science';
import {S5} from '../shots/S5Lab';
import {Captions} from '../Captions';
import '../fonts';

const FPS = 30;

const One: React.FC<{t: number; tag: string; caps?: boolean}> = ({t, tag, caps}) => {
  resetIds(`${tag}_`);
  const V = t < SHOTS.S6[0] ? S5 : S6;
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

export const S6Sheet: React.FC<{t0?: number; dt?: number; n?: number; cols?: number; ts?: number[]; caps?: boolean}> = ({t0 = 17.0333, dt = 0.2, n = 28, cols = 7, ts, caps}) => {
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

export const S6At: React.FC<{t: number; caps?: boolean}> = ({t, caps}) => <One t={t} tag="at" caps={caps} />;

const F0 = Math.ceil(SHOTS.S6[0] * FPS - 1e-9); // first film frame of S6 (511)
const F1 = Math.ceil(SHOTS.S6[1] * FPS - 1e-9); // first film frame of S7 (674)
const Root: React.FC = () => (
  <>
    <Composition id="S6" component={Shot} durationInFrames={F1 - F0} fps={FPS} width={1080} height={1920} defaultProps={{first: F0, caps: false}} />
    <Composition id="S6Caps" component={Shot} durationInFrames={F1 - F0} fps={FPS} width={1080} height={1920} defaultProps={{first: F0, caps: true}} />
    <Composition id="S5to6" component={Shot} durationInFrames={20} fps={FPS} width={1080} height={1920} defaultProps={{first: F0 - 10, caps: false}} />
    <Composition id="S6Sheet" component={S6Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{t0: 17.0333, dt: 0.2, n: 28, cols: 7}} />
    <Composition id="S6At" component={S6At} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{t: 17.5}} />
  </>
);
registerRoot(Root);
