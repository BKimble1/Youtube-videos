// Dev root for S09 and S10: single frames (with or without captions), quarter-size and sixth-size contact sheets,
// and a clip of both shots for motion checks.
import React from 'react';
import {AbsoluteFill, Composition, Still, useCurrentFrame} from 'remotion';
import '../../fonts';
import {S09} from '../../shots/S09';
import {S10} from '../../shots/S10';
import {S08} from '../../shots/S08';
import {shotAt} from '../../shots';
import {Captions} from '../../Captions';
import {FPS} from '../../timeline';

const Shot: React.FC<{f: number}> = ({f}) => {
  if (f >= 372 && f < 462) return <S08 f={f} lf={f - 372} n={90} />;
  if (f >= 462 && f < 537) return <S09 f={f} lf={f - 462} n={75} />;
  if (f >= 537 && f < 618) return <S10 f={f} lf={f - 537} n={81} />;
  const s = shotAt(f);
  return <s.C f={f} lf={f - s.from} n={s.to - s.from} />;
};
const One: React.FC<{f: number; captions?: boolean}> = ({f, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#14202A', overflow: 'hidden'}}>
    <Shot f={f} />
    {captions && <Captions f={f} />}
  </AbsoluteFill>
);
/** up to 16 frames, 4 across at quarter size, labelled */
const Sheet: React.FC<{fs: number[]; captions?: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <One f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
/** up to 36 frames, 6 across at 1/6 size (every-3rd-frame passes) */
const Sheet6: React.FC<{fs: number[]; captions?: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 6) * 180, top: Math.floor(i / 6) * 320, width: 1080, height: 1920, transform: 'scale(0.1666667)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <One f={f} captions={captions} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 120, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f}`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
/** the two shots (and a second either side) as one clip, film frames 432-647 */
const Clip: React.FC<{captions?: boolean}> = ({captions}) => <One f={432 + useCurrentFrame()} captions={captions} />;

export const MechanismRoot: React.FC = () => (
  <>
    <Still id="One" component={One} width={1080} height={1920} defaultProps={{f: 462, captions: false}} />
    <Still id="Sheet" component={Sheet} width={1080} height={1920} defaultProps={{fs: [462, 480, 500, 520], captions: false}} />
    <Still id="Sheet6" component={Sheet6} width={1080} height={1920} defaultProps={{fs: [462, 465, 468], captions: false}} />
    <Composition id="Clip" component={Clip} durationInFrames={216} fps={30} width={1080} height={1920} defaultProps={{captions: false}} />
  </>
);
