import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {CatalogueV2, IndexCard} from '../components/v2/Catalogue';
import {E, tw} from '../lib/motion';

export const Kit2: React.FC = () => {
  const g = useCurrentFrame();
  const open = tw(g, 10, 22, E.decel);
  const rise = tw(g, 40, 20, E.inOut);
  return (
    <AbsoluteFill style={{background: C.tealLight}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 820, bottom: 0, background: C.woodLight, borderTop: `6px solid ${C.ink}`}} />
      <div style={{position: 'absolute', left: 960, top: 830}}>
        <CatalogueV2 open={open} cardRise={rise} card={<IndexCard />} scale={1.6} litLabel={tw(g, 4, 8)} row={1} col={2} />
      </div>
      <div style={{position: 'absolute', left: 60, top: 40, fontSize: 40, fontFamily: 'monospace'}}>f{g}</div>
    </AbsoluteFill>
  );
};
