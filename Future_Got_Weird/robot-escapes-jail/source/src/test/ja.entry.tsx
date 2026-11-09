// Test entry for S1 (the hook) and S8 (the loop), at real film times.
//   cd source
//   npx remotion still src/test/ja.entry.tsx JaFrame /tmp/claude-0/ja/f.png --props='{"shot":"S1","t":0,"debug":true}' --log=error
//   npx remotion render src/test/ja.entry.tsx S1 /tmp/claude-0/ja/s1.mp4 --log=error
//   npx remotion render src/test/ja.entry.tsx S8 /tmp/claude-0/ja/s8.mp4 --log=error
//   npx remotion render src/test/ja.entry.tsx Loop /tmp/claude-0/ja/loop.mp4 --log=error   (S8 end -> S1 start)
//   npx remotion still src/test/ja.entry.tsx JaSheet /tmp/claude-0/ja/sheet.png --props='{"fs":[0,6,12],"cols":4}' --log=error
// S1 frames are film frames 0..97 (t = f/30); S8 frames are film frames 835..971.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {resetIds} from '../core/ids';
import {S1View} from '../shots/S1Hook';
import {S8View} from '../shots/S8Loop';
import {Captions} from '../Captions';

const S1_F0 = 0, S1_N = 98; // film frames 0..97 (t < 3.24)
const S8_F0 = 835, S8_N = 972 - 835; // film frames 835..971

const Shot: React.FC<{f: number; debug?: boolean; captions?: boolean; dbg?: string}> = ({f, debug, captions, dbg}) => {
  resetIds(`j${f}_`);
  const t = f / 30;
  return (
    <AbsoluteFill style={{background: '#0B1526', overflow: 'hidden'}}>
      {f < S8_F0 ? <S1View t={t} debug={debug} dbg={dbg} /> : <S8View t={t} debug={debug} />}
      {captions && <Captions t={t} y={() => 330} />}
    </AbsoluteFill>
  );
};

const S1Comp: React.FC<{captions?: boolean}> = ({captions}) => <Shot f={S1_F0 + useCurrentFrame()} captions={captions} />;
const S8Comp: React.FC<{captions?: boolean}> = ({captions}) => <Shot f={S8_F0 + useCurrentFrame()} captions={captions} />;
/** the loop seam: the last 2 s of S8, then the first 2 s of S1 */
const LoopComp: React.FC<{captions?: boolean}> = ({captions}) => {
  const k = useCurrentFrame();
  const f = k < 60 ? 912 + k : k - 60; // S8 frames 912..971, then S1 frames 0..59
  return <Shot f={f} captions={captions} />;
};

export const JaFrame: React.FC<{f?: number; t?: number; debug?: boolean; captions?: boolean; dbg?: string}> = ({f, t, debug, captions, dbg}) => (
  <Shot f={f ?? Math.round((t ?? 0) * 30)} debug={debug} captions={captions} dbg={dbg} />
);

/** contact sheet of film frames at phone size (cell = 1080/cols wide) */
export const JaSheet: React.FC<{fs: number[]; cols: number; debug?: boolean; captions?: boolean}> = ({fs, cols, debug, captions}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Shot f={f} debug={debug} captions={captions} />
          <div style={{position: 'absolute', left: 12, top: 8, color: '#FFD84A', font: '700 64px monospace', textShadow: '0 0 6px #000'}}>{f}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <>
    <Composition id="S1" component={S1Comp} durationInFrames={S1_N} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
    <Composition id="S8" component={S8Comp} durationInFrames={S8_N} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
    <Composition id="Loop" component={LoopComp} durationInFrames={120} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
    <Composition id="JaFrame" component={JaFrame} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{f: 0, debug: false, captions: false, dbg: ''} as {f?: number; t?: number; debug?: boolean; captions?: boolean; dbg?: string}} />
    <Composition id="JaSheet" component={JaSheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0, 12, 24, 36, 48, 60, 72, 84, 90, 93, 95, 96], cols: 4, debug: false, captions: false} as {fs: number[]; cols: number; debug?: boolean; captions?: boolean}} />
  </>
);
registerRoot(Root);
