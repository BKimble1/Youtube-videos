// Test entry for S2–S4 (src/shots/S2to4.tsx), running the real film times.
//   cd source
//   npx remotion still src/test/jb.entry.tsx S2 /tmp/claude-0/jb/s2.png --frame=0 --log=error
//   npx remotion still src/test/jb.entry.tsx JBSheet /tmp/claude-0/jb/sheet.png --props='{"t0":3.24,"dt":0.2,"n":16,"cols":4}' --log=error
//   npx remotion render src/test/jb.entry.tsx S2to4 /tmp/claude-0/jb/s2to4.mp4 --log=error
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {SHOTS} from '../story';
import {resetIds} from '../core/ids';
import {S2, S3, S4} from '../shots/S2to4';
import {Captions} from '../Captions';

const FPS = 30;
const VIEWS = {S2, S3, S4};
type Id = keyof typeof VIEWS;
const viewAt = (t: number) => (t < SHOTS.S2[1] ? S2 : t < SHOTS.S3[1] ? S3 : S4);

const One: React.FC<{t: number; tag: string; caps?: boolean}> = ({t, tag, caps}) => {
  resetIds(`${tag}_`);
  const V = viewAt(t);
  return (
    <AbsoluteFill style={{background: '#0B1526', overflow: 'hidden'}}>
      <V t={t} />
      {caps && <Captions t={t} y={() => 330} />}
    </AbsoluteFill>
  );
};

const Shot: React.FC<{id: Id | 'all'; caps?: boolean}> = ({id, caps}) => {
  const f = useCurrentFrame();
  const t0 = id === 'all' ? SHOTS.S2[0] : SHOTS[id][0];
  const t = t0 + f / FPS;
  return <One t={t} tag={`f${f}`} caps={caps} />;
};

/** contact sheet: n frames from t0 every dt seconds (or an explicit list ts), phone size cells */
export const JBSheet: React.FC<{t0?: number; dt?: number; n?: number; cols?: number; ts?: number[]; caps?: boolean}> = ({t0 = 3.24, dt = 0.25, n = 16, cols = 4, ts, caps}) => {
  const k = 1 / cols;
  const times = ts ?? Array.from({length: n}, (_, i) => t0 + i * dt);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {times.map((t, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <One t={t} tag={`c${i}`} caps={caps} />
          <div style={{position: 'absolute', left: 14, top: 10, color: '#FFD84A', font: '700 60px monospace', textShadow: '0 0 6px #000'}}>{t.toFixed(2)}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** one film time (for full-size checks) */
export const JBAt: React.FC<{t: number; caps?: boolean}> = ({t, caps}) => <One t={t} tag="at" caps={caps} />;

const len = (a: readonly [number, number]) => Math.round((a[1] - a[0]) * FPS);
const Root: React.FC = () => (
  <>
    <Composition id="S2" component={Shot} durationInFrames={len(SHOTS.S2)} fps={FPS} width={1080} height={1920} defaultProps={{id: 'S2' as Id | 'all'}} />
    <Composition id="S3" component={Shot} durationInFrames={len(SHOTS.S3)} fps={FPS} width={1080} height={1920} defaultProps={{id: 'S3' as Id | 'all'}} />
    <Composition id="S4" component={Shot} durationInFrames={len(SHOTS.S4)} fps={FPS} width={1080} height={1920} defaultProps={{id: 'S4' as Id | 'all'}} />
    <Composition id="S2to4" component={Shot} durationInFrames={Math.round((SHOTS.S4[1] - SHOTS.S2[0]) * FPS)} fps={FPS} width={1080} height={1920} defaultProps={{id: 'all' as Id | 'all', caps: false}} />
    <Composition id="JBSheet" component={JBSheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{t0: 3.24, dt: 0.25, n: 16, cols: 4}} />
    <Composition id="JBAt" component={JBAt} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{t: 3.24}} />
  </>
);
registerRoot(Root);
