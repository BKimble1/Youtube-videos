// MECH in context: the real Bird + Mech (+ Cradle) through the story's cameras at chosen times, with the lab and field
// backgrounds. Each cell can zoom on a screen window (x, y, w, h of the 1080x1920 frame) to inspect detail.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {basis} from '../three';
import {Bird} from '../art/bird';
import {Mech, Cradle} from '../art/mech';
import {CUT, LAB, labFocus, labShellLift, labState, openReveal, openState, ShotState} from '../story';
import {radialPath, sweepPath} from '../reveal';
import {clamp, ss} from '../lib';
import {CRADLE} from '../rig';
import {resetIds} from '../core/ids';
import {FieldBack, FieldFront, LabBack, LabFront} from '../art/world';

type Zoom = [number, number, number, number] | null;
const Frame1: React.FC<{t: number}> = ({t}) => {
  let s: ShotState, path: string | null = null, lift = 0, focus: 'P0' | 'A' | 'B' | 'rod' | null = null, detail = 0.25;
  const lab = t >= CUT.openToLab;
  if (!lab) {
    s = openState(t);
    const r = openReveal(t);
    path = r ? sweepPath(basis(s.cam), s.F, r.e, r.mode) : null;
  } else {
    s = labState(t);
    lift = labShellLift(t);
    const rOpen = ss(t, LAB.cutOpen[0], LAB.cutOpen[1]) * (1 - ss(t, LAB.cutClose[0], LAB.cutClose[1]));
    path = radialPath(basis(s.cam), s.F, [3.4, -1.6], 10.5 * rOpen);
    focus = labFocus(t);
    detail = clamp((s.cam.scale - 16) / 36);
  }
  const B = basis(s.cam);
  return (
    <g>
      {lab ? <LabBack B={B} t={t} /> : <FieldBack B={B} t={t} />}
      {lab && <Cradle B={B} F={s.F} base={[0, CRADLE.benchY, 0]} layer="back" />}
      <Bird B={B} F={s.F} ps={s.ps} look={{cut: path ? 1 : 0, cutReveal: path ? () => path : undefined, phantom: path ? 1 : 0, shellLift: lift}}
        mech={<Mech B={B} F={s.F} ps={s.ps} look={{rate: s.rate, focus, detail}} />} />
      {lab && <Cradle B={B} F={s.F} base={[0, CRADLE.benchY, 0]} layer="front" ps={s.ps} />}
      {lab ? <LabFront B={B} t={t} /> : <FieldFront B={B} t={t} />}
    </g>
  );
};
const Sheet: React.FC<{ts: number[]; cols: number; zooms?: Zoom[]}> = ({ts, cols, zooms = []}) => {
  const rows = Math.ceil(ts.length / cols);
  const w = 1080 / cols, h = 1920 / rows;
  return (
    <AbsoluteFill style={{background: '#555'}}>
      <svg width={1080} height={1920}>
        {ts.map((t, i) => {
          resetIds(`mf${i}_`);
          const z = zooms[i] ?? [0, 0, 1080, 1920];
          const k = Math.min(w / z[2], h / z[3]);
          return (
            <g key={i} transform={`translate(${(i % cols) * w},${Math.floor(i / cols) * h})`}>
              <clipPath id={`mfc${i}`}><rect width={w} height={h} /></clipPath>
              <g clipPath={`url(#mfc${i})`}>
                <g transform={`scale(${k}) translate(${-z[0]},${-z[1]})`}><Frame1 t={t} /></g>
              </g>
              <text x={12} y={34} fontSize={28} fontFamily="monospace" fill="#000">{t.toFixed(2)}</text>
              <rect width={w} height={h} fill="none" stroke="#000" strokeWidth={3} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
const Root: React.FC = () => (
  <Composition id="MechFilm" component={Sheet} durationInFrames={1} fps={30} width={1080} height={1920}
    defaultProps={{ts: [7.2, 9.9], cols: 1, zooms: [] as Zoom[]}} />
);
registerRoot(Root);
