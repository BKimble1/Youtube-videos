// FU test entry (owner D).
//   cd source; npx remotion still src/v2/test/future.entry.tsx FU /tmp/claude-0/v2_future/x.png --frame=0 --log=error
// Shot compositions run on the FILM frame grid (frame 0 of the composition = film frame 677 = t 22.567, the first film
// frame inside SHOTS2.FU), so every rendered frame is exactly what the film renders.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import '../../fonts';
import {resetIds} from '../../core/ids';
import {SHOTS2} from '../story2';
import {FU} from '../shots/Future';
import {J1} from '../shots/HookLoop';
import {MS} from '../shots/MoldScience';
import {Captions} from '../../Captions';
import {capBox2} from '../shots';

const FPS = 30;
const F0 = Math.ceil(SHOTS2.FU[0] * FPS - 1e-6); // 677
const F1 = Math.ceil(SHOTS2.FU[1] * FPS - 1e-6); // 837 (J1's first frame)
const N = F1 - F0; // 160

const shotFor = (t: number): React.FC<{t: number}> => (t < SHOTS2.FU[0] ? MS : t < SHOTS2.FU[1] ? FU : J1);
const One: React.FC<{f: number; captions?: boolean; tag: string; only?: boolean}> = ({f, captions, tag}) => {
  resetIds(tag);
  const t = f / FPS;
  const S = shotFor(t);
  return (
    <AbsoluteFill style={{background: '#0B1526', overflow: 'hidden'}}>
      <S t={t} />
      {captions && <Captions t={t} box={capBox2} />}
    </AbsoluteFill>
  );
};

/** the shot at its real film frames */
const Shot: React.FC<{captions?: boolean; from?: number}> = ({captions, from = F0}) => {
  const f = useCurrentFrame();
  return <One f={from + f} captions={captions} tag={`s${f}_`} />;
};

/** contact sheet of film frames (cells 1080/cols wide) */
const Sheet: React.FC<{fs: number[]; cols: number; captions?: boolean}> = ({fs, cols, captions}) => {
  const k = 1 / cols;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {fs.map((f, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <One f={f} captions={captions} tag={`c${i}_`} />
          <div style={{position: 'absolute', left: 12, top: 8, color: '#FFD84A', font: '700 60px monospace', textShadow: '0 0 6px #000'}}>{f} {(f / FPS).toFixed(2)}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const range = (a: number, b: number, step = 1) => Array.from({length: Math.floor((b - a) / step) + 1}, (_, i) => a + i * step);
// the whole shot every 4 frames (40 cells)
const ALL_FS = range(F0, F1 - 1, 4);
// boundaries: MS -> FU (673..684), FU -> J1 (829..844)
const BOUND_FS = [...range(F0 - 4, F0 + 7), ...range(F1 - 8, F1 + 7)];
// one frame per beat: flow, bends, bead, cut, reveal, arrive, engulf, cooled, lift, body, gullet, push
const KEY_FS = [699, 708, 717, 719, 729, 742, 759, 771, 786, 801, 810, 822];

registerRoot(() => (
  <>
    <Composition id="FU" component={Shot} durationInFrames={N} fps={FPS} width={1080} height={1920} defaultProps={{}} />
    <Composition id="FUcap" component={Shot} durationInFrames={N} fps={FPS} width={1080} height={1920} defaultProps={{captions: true}} />
    {/* the shot plus 12 frames either side (MS tail, J1 head) */}
    <Composition id="FUbounds" component={Shot} durationInFrames={N + 24} fps={FPS} width={1080} height={1920} defaultProps={{from: F0 - 12, captions: true}} />
    {/* the same without captions (for frame-difference pop checks) */}
    <Composition id="FUboundsNC" component={Shot} durationInFrames={N + 24} fps={FPS} width={1080} height={1920} defaultProps={{from: F0 - 12}} />
    {/* key beats at phone scale (4 x 3, with captions) */}
    <Composition id="SheetKeys" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: KEY_FS, cols: 4, captions: true}} />
    {/* the engulf and the body beat, every 2 frames */}
    <Composition id="SheetEngulf" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: range(748, 786, 2), cols: 5}} />
    <Composition id="SheetAt" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: [758, 760, 762, 764], cols: 2}} />
    <Composition id="SheetBody" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: range(790, 836, 2), cols: 6}} />
    <Composition id="Sheet" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: ALL_FS, cols: 8}} />
    <Composition id="SheetCap" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: ALL_FS, cols: 8, captions: true}} />
    <Composition id="SheetBounds" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: BOUND_FS, cols: 7}} />
    <Composition id="SheetAny" component={Sheet} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{fs: [F0], cols: 4}} />
  </>
));
