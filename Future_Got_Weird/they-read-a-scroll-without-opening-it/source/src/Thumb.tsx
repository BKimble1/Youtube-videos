// Thumbnail candidate: a frame of the opening composition (no captions, no headline text). The burnt roll on its
// cradle and, beside it, the traced stretch of the sheet half-way out of the scan and opened on column 19.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {K} from './art/kit';
import {OpenComp} from './scenes/Open';

export const Thumb: React.FC = () => (
  <AbsoluteFill style={{background: K.paper}}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <OpenComp f={60} st={{u: 0.86, open: 1, split: 1, roll: {x: 450, y: 520, s: 1.6}, crumbs: 0, pushP: 0.1, leader: 1, chips: 0, partial: true}} />
    </svg>
  </AbsoluteFill>
);
