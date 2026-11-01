// Development stills of single rigs (not part of the film).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {resetIds} from './core/ids';
import {Lizard, LizardState} from './art/lizard';
import {Coyote, CoyoteState} from './art/coyote';
import {pt} from './core/geo';
import {Section} from './art/section';
import {eyeWorld} from './art/lizard';

export const baseLizard = (o: Partial<LizardState> = {}): LizardState => ({
  x: 0, y: 0, yaw: 0, head: -0.25, puff: 0.3, gait: 0, run: 0, flinch: 0,
  eye: {look: 0.3, blink: 0, bulge: 0, blood: 0, wet: 0}, t: 0, ...o,
});
export const baseCoyote = (o: any = {}): CoyoteState => ({
  x: 0, y: 0, dir: 1, J: pt(22, -17), ang: 0.55, crouch: 0, walk: 0, stride: 0, paw: 0, t: 0, ...o,
  hd: {jaw: 0.5, ears: 0, squint: 0, lip: 0.4, wrinkle: 0.3, tongue: 0, blood: 0, look: 0.5, shake: 0, ...(o.hd || {})},
});
export const Test: React.FC<{which: string; cx: number; cy: number; w: number; p?: any; yaws?: number[]}> = ({which, cx, cy, w, p = {}, yaws}) => {
  resetIds('t');
  const s = 1080 / w;
  if (which === 'section') {
    const L = baseLizard({head: -0.25, puff: 0.4, eye: {look: 0, blink: 0, bulge: p.p ?? 0, blood: 0, wet: 0}});
    const e = eyeWorld(L);
    return (
      <AbsoluteFill style={{background: '#E9D4AE'}}>
        <svg width={1080} height={1920}>
          <g transform={`translate(540 960) scale(${s}) translate(${-(e.x + cx)} ${-(e.y + cy)})`}>
            <Lizard s={L} sw={0.012} section={(g, layer) => <Section g={g} layer={layer} sw={0.012} s={{reveal: 1, squeeze: 0, p: 0, beat: 0, aPhase: 0, vPhase: 0, burst: -1, shadow: 0, t: 0, ...p}} />} />
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
          {which === 'yaws' && (yaws || []).map((y, i) => <Lizard key={i} s={baseLizard({...p, yaw: y, x: (i % 3) * 13, y: Math.floor(i / 3) * 9})} />)}
          {which === 'coyote' && <Coyote c={baseCoyote(p)} />}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
