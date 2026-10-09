import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {Sfx} from '../lib/sfx';

/** V6 · The real U (v2 placeholder; the scene builder replaces this file). Shots: v2/SHOTPLAN_V2.md V6. */
export const SFX: Sfx[] = [];

export const V6RealU: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center'}}>
    <div style={{fontFamily: F.display, fontSize: 72, color: C.ink}}>V6 · The real U</div>
  </AbsoluteFill>
);
