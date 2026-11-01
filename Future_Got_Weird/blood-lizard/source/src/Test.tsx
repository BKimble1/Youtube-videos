// Development stills of single rigs (not part of the film).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {resetIds} from './core/ids';
import {Lizard, LizardState, eyeWorld} from './art/lizard';
import {Sinus} from './art/sinus';
import {Coyote, CoyoteState} from './art/coyote';
import {pt} from './core/geo';

export const baseLizard = (o: Partial<LizardState> = {}): LizardState => ({
  x: 0, y: 0, rot: 0, head: -0.25, puff: 0.3, gait: 0, run: 0, dangle: 0, flinch: 0,
  eye: {look: 0.3, blink: 0, bulge: 0, blood: 0, wet: 0}, t: 0, ...o,
});
export const baseCoyote = (o: any = {}): CoyoteState => ({
  x: 0, y: 0, J: pt(22, -17), ang: 0.55, crouch: 0, walk: 0, stride: 0, paw: 0, t: 0, ...o,
  hd: {jaw: 0.5, ears: 0, squint: 0, lip: 0.4, wrinkle: 0.3, tongue: 0, blood: 0, look: 0.5, shake: 0, ...(o.hd || {})},
});
export const Test: React.FC<{which: string; cx: number; cy: number; w: number; p?: any}> = ({which, cx, cy, w, p = {}}) => {
  resetIds('t');
  const s = 1080 / w;
  if (which === 'sinus') {
    const L = baseLizard({head: -0.25, puff: 0.3});
    const e = eyeWorld(L);
    const sc = 1080 / w;
    return (
      <AbsoluteFill style={{background: '#E9D4AE'}}>
        <svg width={1080} height={1920}>
          <g transform={`translate(540 960) scale(${sc}) translate(${-(e.x + cx)} ${-(e.y + cy)})`}>
            <Lizard s={L} reveal={1} interior={(cd) => <Sinus clipD={cd} s={{reveal: 1, squeeze: 0, p: 0, beat: 0, aPhase: 0, vPhase: 0, burst: -1, shadow: 0, t: 0, ...p}} sw={0.012} />} />
          </g>
        </svg>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{background: '#E9D4AE'}}>
      <svg width={1080} height={1920}>
        <g transform={`translate(540 960) scale(${s}) translate(${-cx} ${-cy})`}>
          <line x1={-100} x2={100} y1={0} y2={0} stroke="#0003" strokeWidth={0.02} />
          {which === 'lizard' && <Lizard s={baseLizard(p)} />}
          {which === 'coyote' && <Coyote c={baseCoyote(p)} />}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
