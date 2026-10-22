import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Stage} from '../kit/cam';
import {M} from '../theme';
import {Antibody, DeathReceptor, DnaSwitch, Enzyme, LigandHex, Membrane, TargetReceptor} from '../art/molecules';

export const Sheet: React.FC<{page?: number}> = ({page = 0}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <Stage cam={{x: 960, y: 540, z: 1}} bg={M.void}>
      <Membrane f={(x) => 900 + Math.sin(x / 180) * 12} x0={0} x1={1920} t={t} />
      {[200, 260, 330].map((x, i) => <g key={i} transform={`translate(${x} ${900 + Math.sin(x / 180) * 12 - 14})`}><DeathReceptor t={t} seed={i} act={i === 2 ? 1 : 0} adaptors={i === 2 ? 1 : 0} /></g>)}
      <g transform="translate(480 886)"><TargetReceptor t={t} /></g>
      <g transform="translate(380 260)"><DnaSwitch t={t} open={0} /></g>
      <g transform="translate(380 560)"><DnaSwitch t={t} open={0} xray={1} protons={0.6} /></g>
      <g transform="translate(900 260)"><DnaSwitch t={t} open={0.5} unlock={1} /></g>
      <g transform="translate(900 560)"><DnaSwitch t={t} open={1} unlock={1} glow={1} /></g>
      <g transform="translate(1350 300)"><Antibody t={t} /></g>
      <g transform="translate(1600 300)"><Antibody t={t} cut={[1, 0, 0, 0]} release={[0.6, 0, 0, 0]} /></g>
      <g transform="translate(1400 600)"><Enzyme t={t} /></g>
      <g transform="translate(1600 600)"><LigandHex lines={1} /></g>
    </Stage>
  );
};
