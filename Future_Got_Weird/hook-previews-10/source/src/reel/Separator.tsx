// Comparison-reel separator (reel only; never part of an individual hook file): a 1.0 s numbered card so each entry
// can be identified. Dark channel slate, the hook number large, its working name small. A 4-frame fade in and out.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import '@fontsource-variable/nunito';

export type SepProps = {n: string; name: string};
export const SEP_FRAMES = 30;

export const Separator: React.FC<SepProps> = ({n, name}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, 4, SEP_FRAMES - 4, SEP_FRAMES], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const font = '"Nunito Variable", "Nunito", system-ui, sans-serif';
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #1C2B36 0%, #0B1218 75%)', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{opacity: a, textAlign: 'center', color: '#FFFFFF', fontFamily: font}}>
        <div style={{fontSize: 44, fontWeight: 800, letterSpacing: '0.32em', color: '#FFD84A'}}>HOOK</div>
        <div style={{fontSize: 300, fontWeight: 900, lineHeight: 1}}>{n}</div>
        <div style={{fontSize: 52, fontWeight: 800, marginTop: 24, letterSpacing: '0.04em', color: '#CFE0EA'}}>{name}</div>
      </div>
    </AbsoluteFill>
  );
};
