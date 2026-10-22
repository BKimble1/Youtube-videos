// V2 art test sheets (composition V2Dev, prop page).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {camTransform} from '../kit/cam';
import {Frame2} from './defs';
import {Body} from './art/body';

export const V2Dev: React.FC<{page?: number}> = ({page = 0}) => {
  const t = useCurrentFrame() / 30;
  if (page === 0)
    return (
      <Frame2 bg="url(#nightGrad)">
        <g transform={camTransform({x: 0, y: 0, z: 0.55})}>
          <g transform="translate(-1300 0)"><Body t={t} glow={1} /></g>
          <g transform="translate(-430 0)"><Body t={t} xray={1} glow={0.8} tumorSize={1} vessels={0.6} /></g>
          <g transform="translate(430 0)"><Body t={t} digital={1} slices={1} tumorSize={1} metsSize={1} scanY={-200} /></g>
          <g transform="translate(1300 0)"><Body t={t} xray={0.4} glow={0.9} mets={0.9} healthy={0} /></g>
        </g>
      </Frame2>
    );
  return null;
};
