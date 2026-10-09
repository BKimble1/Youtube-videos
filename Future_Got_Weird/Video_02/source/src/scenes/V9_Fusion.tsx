import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {Sfx} from '../lib/sfx';

/** V9 · Motion-aware fusion (v2 placeholder; the scene builder replaces this file). Shots: v2/SHOTPLAN_V2.md V9. */
export const SFX: Sfx[] = [];

export const V9Fusion: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center'}}>
    <div style={{fontFamily: F.display, fontSize: 72, color: C.ink}}>V9 · Motion-aware fusion</div>
  </AbsoluteFill>
);
