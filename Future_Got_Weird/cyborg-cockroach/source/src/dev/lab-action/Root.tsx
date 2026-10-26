// Dev root for S04 and S06: single frames (with or without captions) and quarter-size contact sheets.
import React from 'react';
import {AbsoluteFill, Still} from 'remotion';
import '../../fonts';
import {S04} from '../../shots/S04';
import {S06} from '../../shots/S06';
import {shotAt} from '../../shots';
import {Captions} from '../../Captions';
import {FPS} from '../../timeline';

const Shot: React.FC<{f: number; k?: string}> = ({f, k}) => {
  if (f >= 150 && f < 273) return <S04 f={f} lf={f - 150} n={123} k={k} />;
  if (f >= 273 && f < 315) return <S06 f={f} lf={f - 273} n={42} k={k} />;
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
        <AbsoluteFill style={{backgroundColor: '#14202A', overflow: 'hidden'}}>
          <Shot f={f} k={`t${i}`} />
          {captions && <Captions f={f} />}
        </AbsoluteFill>
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 90, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f} (${(f / FPS).toFixed(2)})`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
/** a wider sheet: up to 36 frames, 6 across at 1/6 size (for every-3rd-frame passes) */
const Sheet6: React.FC<{fs: number[]; captions?: boolean}> = ({fs, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {fs.map((f, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 6) * 180, top: Math.floor(i / 6) * 320, width: 1080, height: 1920, transform: 'scale(0.1666667)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <AbsoluteFill style={{backgroundColor: '#14202A', overflow: 'hidden'}}>
          <Shot f={f} k={`u${i}`} />
          {captions && <Captions f={f} />}
        </AbsoluteFill>
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 120, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${f}`}</div>
      </div>
    ))}
  </AbsoluteFill>
);

export const LabActionRoot: React.FC = () => (
  <>
    <Still id="S04" component={One} width={1080} height={1920} defaultProps={{f: 150, captions: false}} />
    <Still id="S06" component={One} width={1080} height={1920} defaultProps={{f: 273, captions: false}} />
    <Still id="One" component={One} width={1080} height={1920} defaultProps={{f: 150, captions: true}} />
    <Still id="Sheet" component={Sheet} width={1080} height={1920} defaultProps={{fs: [150, 180, 210, 240], captions: false}} />
    <Still id="Sheet6" component={Sheet6} width={1080} height={1920} defaultProps={{fs: [150, 153, 156], captions: false}} />
    <LabActionRoot2 />
    <LabActionRoot3 />
  </>
);

import {camFrom, CamKey} from '../../shots/S04';
type Try = {f: number; tgt: [number, number, number]; az: number; el: number; D: number; cy?: number; fl?: number};
const D2R = Math.PI / 180;
/** camera candidates for S04 (az/el in degrees), 4 across at quarter size */
const CamTry: React.FC<{tries: Try[]; captions?: boolean}> = ({tries, captions}) => (
  <AbsoluteFill style={{backgroundColor: '#111'}}>
    {tries.map((c, i) => (
      <div key={i} style={{position: 'absolute', left: (i % 4) * 270, top: Math.floor(i / 4) * 480, width: 1080, height: 1920, transform: 'scale(0.25)', transformOrigin: '0 0', overflow: 'hidden'}}>
        <AbsoluteFill style={{backgroundColor: '#14202A', overflow: 'hidden'}}>
          <S04 f={c.f} lf={c.f - 150} n={123} k={`c${i}`} cam={camFrom(c.f / FPS, {tgt: c.tgt, az: c.az * D2R, el: c.el * D2R, D: c.D, cy: c.cy ?? 800, f: c.fl} as CamKey & {f?: number})} />
          {captions && <Captions f={c.f} />}
        </AbsoluteFill>
        <div style={{position: 'absolute', left: 20, top: 20, fontSize: 70, color: '#FF0', fontFamily: 'monospace', textShadow: '0 0 8px #000'}}>{`${i}: ${c.f} az${c.az} el${c.el} D${c.D}`}</div>
      </div>
    ))}
  </AbsoluteFill>
);
export const LabActionRoot2: React.FC = () => <Still id="CamTry" component={CamTry} width={1080} height={1920} defaultProps={{tries: [] as Try[], captions: false}} />;

import {medicPose, s04Cam} from '../../shots/S04';
import {proj} from '../../lib/cam';
/** S04 frame with each leg's joints labelled (debug) */
const LegDebug: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const cam = s04Cam(t);
  const {pose} = medicPose(t);
  return (
    <AbsoluteFill style={{backgroundColor: '#14202A', overflow: 'hidden'}}>
      <S04 f={f} lf={f - 150} n={123} />
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        {pose.legs.map((L, i) => {
          const c = proj(cam, L.coxa), k = proj(cam, L.knee), a = proj(cam, L.ankle), ft = proj(cam, L.foot);
          return (
            <g key={i} fontSize={28} fontFamily="monospace" fontWeight={700}>
              <path d={`M${c[0]} ${c[1]} L${k[0]} ${k[1]} L${a[0]} ${a[1]} L${ft[0]} ${ft[1]}`} stroke="#F0F" strokeWidth={3} fill="none" />
              <text x={c[0]} y={c[1]} fill="#F0F">{L.def.name}c</text>
              <text x={k[0]} y={k[1]} fill="#0FF">{L.def.name}k</text>
              <text x={ft[0]} y={ft[1]} fill="#FF0">{L.def.name}f</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
export const LabActionRoot3: React.FC = () => <Still id="LegDebug" component={LegDebug} width={1080} height={1920} defaultProps={{f: 150}} />;
