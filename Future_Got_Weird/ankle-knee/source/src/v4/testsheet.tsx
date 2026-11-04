// A contact-sheet root for working on one part of V4 in isolation: a test entry (src/test/v4_*.entry.tsx) imports
// only its own shot file, so a half-finished file elsewhere never breaks its bundle.
// entry:  import {registerRoot} from 'remotion'; registerRoot(makeSheetRoot((t, k) => <MyShot t={t} k={k} />, CAP_Y_MINE));
//   npx remotion still src/test/v4_<part>.entry.tsx S out.png --frame=0 --props='{"fs":[0,30,60],"cols":3,"captions":true}' --log=error
// fs are film frames (t = f / 30); cols = tiles per row (1 = one full-size 1080x1920 frame).
import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import '../fonts';
import {resetIds} from '../core/ids';
import {Captions4} from './Captions4';

type Render = (t: number, k: string) => React.ReactNode;
const Tile: React.FC<{f: number; render: Render; captions: boolean; ys: Record<number, number | ((t: number) => number)>}> = ({f, render, captions, ys}) => {
  const k = `f${f}_`;
  resetIds(k);
  const t = f / 30;
  return (
    <AbsoluteFill style={{backgroundColor: '#0D111C', overflow: 'hidden'}}>
      {render(t, k)}
      {captions && <Captions4 t={t} ys={ys} />}
    </AbsoluteFill>
  );
};
/** returns the root component; the entry itself must call registerRoot(makeSheetRoot(...)) (Remotion checks for it) */
export const makeSheetRoot = (render: Render, ys: Record<number, number | ((t: number) => number)> = {}): React.FC => {
  const Sheet: React.FC<{fs: number[]; cols: number; captions: boolean}> = ({fs, cols, captions}) => {
    const k = 1 / cols;
    return (
      <AbsoluteFill style={{backgroundColor: '#111'}}>
        {fs.map((f, i) => (
          <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
            <Tile f={f} render={render} captions={captions} ys={ys} />
            <div style={{position: 'absolute', left: 20, top: 20, fontSize: 80, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / 30).toFixed(2)})`}</div>
          </div>
        ))}
      </AbsoluteFill>
    );
  };
  return () => <Composition id="S" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{fs: [0], cols: 4, captions: true}} />;
};
