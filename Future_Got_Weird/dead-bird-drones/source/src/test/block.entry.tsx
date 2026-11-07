// Camera blocking sheet: the story's cameras at chosen times with the flat proto bird (not final art).
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {basis, Orbit} from '../three';
import {ProtoBird} from './proto';
import {labState, meadowState, openState, skyState, ShotState, CUT, labShellLift} from '../story';
import {bodyFrame, add3} from '../three';

const stateAt = (t: number): [ShotState, string] => {
  if (t < CUT.openToLab) return [openState(t), '#CFE6F2'];
  if (t < CUT.labToMeadow[1]) return [labState(t), '#DDE3E6'];
  if (t < CUT.meadowToPond[1]) return [meadowState(t), '#CFE8DF'];
  return [skyState(t), '#F3E2C8'];
};
const Sheet: React.FC<{ts: number[]; cols: number}> = ({ts, cols}) => {
  const rows = Math.ceil(ts.length / cols);
  const w = 1080 / cols, h = 1920 / rows;
  const k = Math.min(w / 1080, h / 1920);
  return (
    <AbsoluteFill style={{background: '#999'}}>
      <svg width={1080} height={1920}>
        {ts.map((t, i) => {
          const [s, bg] = stateAt(t);
          const B = basis(s.cam as Orbit);
          const lift = t > CUT.openToLab && t < CUT.labToMeadow[0] ? labShellLift(t) : 0;
          const F = lift ? bodyFrame(add3(s.F.o, [0, lift, 0])) : s.F;
          return (
            <g key={i} transform={`translate(${(i % cols) * w},${Math.floor(i / cols) * h}) scale(${k})`}>
              <clipPath id={`c${i}`}><rect width={1080} height={1920} /></clipPath>
              <g clipPath={`url(#c${i})`}>
                <rect width={1080} height={1920} fill={bg} />
                <rect y={260} width={1080} height={160} fill="rgba(255,0,0,0.12)" />
                <rect y={1500} width={1080} height={420} fill="rgba(0,0,0,0.08)" />
                <ProtoBird B={B} F={F} ps={s.ps} xray={t > 0.4 && t < 3.3 || (t > 9 && t < 12.4)} />
                <text x={20} y={80} fontSize={60} fill="#000">{t.toFixed(2)}</text>
              </g>
              <rect width={1080} height={1920} fill="none" stroke="#000" strokeWidth={4} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
const Root: React.FC = () => (
  <Composition id="Block" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920}
    defaultProps={{ts: [0, 0.4, 1.0, 2.0, 2.8, 3.4, 3.9, 4.0, 4.6, 5.5, 7.0, 8.5], cols: 4}} />
);
registerRoot(Root);
