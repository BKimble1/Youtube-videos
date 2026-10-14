// The film: shots chosen by the single cue table, one transition crossfade (bloodstream -> body map),
// and the screen-fixed overlays. Captioned master = captions on; clean version = captions off
// (the FUTURE CONCEPT label, the TIME COMPRESSED tag and all device UI stay).
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Captions, CompressedTag, ConceptLabel} from './shots/Overlay';
import {S01_03, S04, S05_06, S07, S08_10, S11, S12, S13, S14, S15_16} from './shots/Shots';
import {clamp, inv} from './lib/math';
import {SHOT} from './lib/timeline';

const XF = 10; // vessel -> body-map crossfade length

export const shotNode = (f: number): React.ReactNode => {
  if (f < SHOT.s04[0]) return S01_03(f);
  if (f < SHOT.s05[0]) return S04(f);
  if (f < SHOT.s07[0] - XF) return S05_06(f);
  if (f < SHOT.s07[0] + 2) {
    const a = clamp(inv(SHOT.s07[0] - XF, SHOT.s07[0] + 2, f));
    return (
      <g>
        {S05_06(f)}
        <g opacity={a}>{S07(f)}</g>
      </g>
    );
  }
  if (f < SHOT.s08[0]) return S07(f);
  if (f < SHOT.s11[0]) return S08_10(f);
  if (f < SHOT.s12[0]) return S11(f);
  if (f < SHOT.s13[0]) return S12(f);
  if (f < SHOT.s14[0]) return S13(f);
  if (f < SHOT.s15[0]) return S14(f);
  return S15_16(f);
};

export const Film: React.FC<{captions: boolean}> = ({captions}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{backgroundColor: '#DCEFF5'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {shotNode(f)}
        <ConceptLabel />
        <CompressedTag f={f} />
        {captions && <Captions f={f} />}
      </svg>
    </AbsoluteFill>
  );
};
