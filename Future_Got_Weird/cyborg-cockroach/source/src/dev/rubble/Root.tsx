// Dev root for S11 / S12 (and the rubble set): single frames (optionally with captions, the concept label and a
// placeholder person), quarter-size and sixth-size contact sheets, and a short clip for motion checks.
import React from 'react';
import {AbsoluteFill, Composition, Still, useCurrentFrame} from 'remotion';
import '../../fonts';
import {S11} from '../../shots/S11';
import {S12, PersonPlaceholder} from '../../shots/S12';
import {shotAt} from '../../shots';
import {Captions} from '../../Captions';
import {FPS} from '../../timeline';
import {CONCEPT_ON} from '../../Film';

type P = {f: number; captions?: boolean; person?: boolean; label?: boolean; k?: string};
const Shot: React.FC<P> = ({f, person, k}) => {
  if (f >= 618 && f < 655) return <S11 f={f} lf={f - 618} n={37} k={k} />;
  if (f >= 655 && f < 758) return <S12 f={f} lf={f - 655} n={103} k={k} person={person ? (cam) => <PersonPlaceholder cam={cam} /> : undefined} />;
  const s = shotAt(f);
  return <s.C f={f} lf={f - s.from} n={s.to - s.from} />;
};
const Label: React.FC<{f: number}> = ({f}) =>
  f >= CONCEPT_ON[0] && f < CONCEPT_ON[1] ? (
    <div style={{position: 'absolute', left: 84, top: 184, padding: '10px 20px 12px', borderRadius: 14, background: 'rgba(10,16,22,0.62)', color: '#F4F1EA', fontFamily: '"Nunito Variable", "Nunito", system-ui, sans-serif', fontWeight: 800, fontSize: 36}}>Future rescue concept</div>
  ) : null;
const One: React.FC<P> = (p) => (
  <AbsoluteFill style={{backgroundColor: '#14202A', overflow: 'hidden'}}>
    <Shot {...p} />
    {p.label && <Label f={p.f} />}
    {p.captions && <Captions f={p.f} />}
  </AbsoluteFill>
);
const Sheet: React.FC<{fs: number[]; captions?: boolean; person?: boolean; label?: boolean}> = ({fs, captions, person, label}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <One f={f} captions={captions} person={person} label={label} k={`t${i}`} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
const Sheet6: React.FC<{fs: number[]; captions?: boolean; person?: boolean; label?: boolean}> = ({fs, captions, person, label}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 6) * 180, top: Math.floor(i / 6) * 320, width: 1080, height: 1920, transform: 'scale(0.1666667)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <One f={f} captions={captions} person={person} label={label} k={`u${i}`} />
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 120, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f}`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
const Clip: React.FC<{from: number; captions?: boolean; person?: boolean}> = ({from, captions, person}) => {
  const f = from + useCurrentFrame();
  return <One f={f} captions={captions} person={person} label />;
};
export const RubbleRoot: React.FC = () => (
  <>
    <Still id="One" component={One} width={1080} height={1920} defaultProps={{f: 700, captions: false, person: false, label: false} as P} />
    <Still id="Sheet" component={Sheet} width={1080} height={1920} defaultProps={{fs: [655, 680, 710, 757], captions: false, person: false, label: false}} />
    <Still id="Sheet6" component={Sheet6} width={1080} height={1920} defaultProps={{fs: [655, 658, 661], captions: false, person: false, label: false}} />
    <Composition id="Clip" component={Clip} durationInFrames={140} fps={30} width={1080} height={1920} defaultProps={{from: 618, captions: true, person: true}} />
  </>
);
