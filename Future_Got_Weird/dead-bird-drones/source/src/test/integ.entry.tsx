// Integration sheet: the real Bird + Mech through the story's cameras at chosen times, plain backgrounds (no world).
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {basis} from '../three';
import {Bird} from '../art/bird';
import {Mech, Cradle} from '../art/mech';
import {CUT, LAB, labFocus, labShellLift, labState, meadowState, openReveal, openState, skyReveal, skyState, ShotState} from '../story';
import {radialPath, sweepPath} from '../reveal';
import {clamp, ss, DUR} from '../lib';
import {CRADLE} from '../rig';
import {resetIds} from '../core/ids';

const Cell: React.FC<{t: number}> = ({t}) => {
  let s: ShotState, bg = '#CFE6F2', path: string | null = null, lift = 0, focus: 'P0' | 'A' | 'B' | 'rod' | null = null, detail = 0.25, lab = false;
  if (t < CUT.openToLab || t >= DUR) {
    const tt = t >= DUR ? t - DUR : t;
    s = openState(tt);
    const r = openReveal(tt);
    path = r ? sweepPath(basis(s.cam), s.F, r.e, r.mode) : null;
  } else if (t < CUT.labToMeadow[1]) {
    s = labState(t); bg = '#DDE3E6'; lab = true;
    lift = labShellLift(t);
    const rOpen = ss(t, LAB.cutOpen[0], LAB.cutOpen[1]) * (1 - ss(t, LAB.cutClose[0], LAB.cutClose[1]));
    path = radialPath(basis(s.cam), s.F, [3.4, -1.6], 10.5 * rOpen);
    focus = labFocus(t); detail = clamp((s.cam.scale - 16) / 36);
  } else if (t < CUT.meadowToPond[1]) { s = meadowState(t); bg = '#CFE8DF'; }
  else { s = skyState(t); bg = '#F3E2C8'; const r = skyReveal(t); path = r ? sweepPath(basis(s.cam), s.F, r.e, r.mode) : null; }
  const B = basis(s.cam);
  return (
    <g>
      <rect width={1080} height={1920} fill={bg} />
      {lab && <Cradle B={B} F={s.F} base={[0, CRADLE.benchY, 0]} layer="back" />}
      <Bird B={B} F={s.F} ps={s.ps} look={{cut: path ? 1 : 0, cutReveal: path ? () => path : undefined, phantom: path ? 1 : 0, shellLift: lift}}
        mech={<Mech B={B} F={s.F} ps={s.ps} look={{rate: s.rate, focus, detail}} />} />
      {lab && <Cradle B={B} F={s.F} base={[0, CRADLE.benchY, 0]} layer="front" />}
    </g>
  );
};
const Sheet: React.FC<{ts: number[]; cols: number}> = ({ts, cols}) => {
  const rows = Math.ceil(ts.length / cols);
  const w = 1080 / cols, h = 1920 / rows;
  const k = Math.min(w / 1080, h / 1920);
  return (
    <AbsoluteFill style={{background: '#555'}}>
      <svg width={1080} height={1920}>
        {ts.map((t, i) => {
          resetIds(`c${i}_`);
          return (
            <g key={i} transform={`translate(${(i % cols) * w},${Math.floor(i / cols) * h}) scale(${k})`}>
              <clipPath id={`cc${i}`}><rect width={1080} height={1920} /></clipPath>
              <g clipPath={`url(#cc${i})`}><Cell t={t} /></g>
              <text x={20} y={90} fontSize={70} fill="#000">{t.toFixed(2)}</text>
              <rect width={1080} height={1920} fill="none" stroke="#000" strokeWidth={4} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
const Root: React.FC = () => (
  <Composition id="Integ" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920}
    defaultProps={{ts: [0, 0.2, 0.5, 1.0, 1.5, 2.0, 2.6, 3.05, 3.5, 3.94], cols: 5}} />
);
registerRoot(Root);
