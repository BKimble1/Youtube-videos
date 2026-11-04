// S4 STOMACH test stills and contact sheets.
//   npx remotion still src/v4/test/stomach.entry.tsx Stomach out.png --props='{"t":7.6}'
//   npx remotion still src/v4/test/stomach.entry.tsx StomachSheet out.png --props='{"ts":[5.6,5.75,...],"cols":6}'
// `captions` overlays the film's caption for t (the shot itself draws none); `debug` marks the carried-tail contract
// points (cyan) and the keep-out line.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import '../../fonts';
import {resetIds} from '../../core/ids';
import {Captions} from '../../Captions';
import {S4Stomach} from '../shots/S4Stomach';
import {carryTail, CARRY0, CARRY1, KEEP_Y} from '../timing';

const Cell: React.FC<{t: number; captions: boolean; debug: boolean; tag: string}> = ({t, captions, debug, tag}) => {
  resetIds(tag);
  const ct = t >= CARRY0 - 0.2 && t <= CARRY1 + 0.2 ? carryTail(t) : null;
  return (
    <AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
      <S4Stomach t={t} />
      {captions && <Captions t={t} />}
      {debug && (
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          <line x1={0} x2={1080} y1={KEEP_Y} y2={KEEP_Y} stroke="#0ff" strokeWidth={2} strokeDasharray="12 10" />
          {ct && ct.pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#0ff" />)}
        </svg>
      )}
    </AbsoluteFill>
  );
};

const Stomach: React.FC<{t: number; captions: boolean; debug: boolean}> = ({t, captions, debug}) => <Cell t={t} captions={captions} debug={debug} tag="s" />;

const StomachSheet: React.FC<{ts: number[]; cols: number; cell: number; captions: boolean; debug: boolean}> = ({ts, cols, cell, captions, debug}) => {
  const k = cell / 1080;
  return (
    <AbsoluteFill style={{backgroundColor: '#111'}}>
      {ts.map((t, i) => (
        <div key={i} style={{position: 'absolute', left: (i % cols) * 1080 * k, top: Math.floor(i / cols) * 1920 * k, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
          <Cell t={t} captions={captions} debug={debug} tag={`c${i}_`} />
          <div style={{position: 'absolute', left: 16, top: 16, fontSize: 64, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{t.toFixed(2)}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

const Root: React.FC = () => (
  <>
    <Composition id="Stomach" component={Stomach} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{t: 7.6, captions: false, debug: false}} />
    <Composition
      id="StomachSheet"
      component={StomachSheet}
      durationInFrames={1}
      fps={30}
      width={1080}
      height={1920}
      calculateMetadata={({props}) => {
        const rows = Math.ceil(props.ts.length / props.cols);
        return {width: props.cols * props.cell, height: Math.round((1920 * props.cell * rows) / 1080)};
      }}
      defaultProps={{ts: [5.6, 5.8, 6.0, 6.3, 6.6, 6.9, 7.2, 7.4, 7.55, 7.7, 7.9, 8.1, 8.2, 8.3, 8.5, 8.7, 8.9, 9.05], cols: 6, cell: 360, captions: true, debug: false}}
    />
  </>
);
registerRoot(Root);
