// dev: one piece in the lab under an orbit camera, for checking the V3 tissue window and organs
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {W, H} from '../../lib';
import {basis, orbitCam, proj} from '../../kit/three';
import {resetIds} from '../../kit/draw3';
import {LabBack} from '../../v2/sets/Lab2';
import {SlugFloor, slugItem} from '../../v2/slug/Mesh';
import {Piece} from '../../v2/slug/body';
import {PH2, S0} from '../../v2/shots2';

export const WinTest: React.FC<{az: number; el: number; d: number; ta: number; open: number; gap: number; beat: number; grow?: number; heart: number; v4?: boolean; dim?: number}> = ({az, el, d, ta, open, gap, beat, grow, heart, v4, dim = 0}) => {
  resetIds('w');
  const p: Piece = {id: 'whole', path: PH2, tip: S0 + gap, a0: 0, a1: 100, gap, pinch: gap > 0 ? 0.6 : 0, t: 1, heart, beat, grow, win: {a: 22, r: 18, open}, weak: open > 0 ? 1 : 0, style: v4 ? 'v4' : undefined};
  const pt = PH2.at(S0 - ta);
  const B = basis(orbitCam({target: [pt.x, pt.y, 4], az, el, d, f: 3200, cy: 960}));
  return (
    <AbsoluteFill style={{backgroundColor: '#DDE7EC'}}>
      <svg width={W} height={H}>
        <LabBack B={B} id="w" t={1} focusZ={proj(B, [pt.x, pt.y, 4]).z} dim={dim} />
        <SlugFloor B={B} p={p} id="wf" />
        {slugItem(B, p).el}
      </svg>
    </AbsoluteFill>
  );
};
