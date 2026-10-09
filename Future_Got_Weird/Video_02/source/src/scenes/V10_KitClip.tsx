import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {Sfx} from '../lib/sfx';

/** V10 · The kit clip and its conditions (v2 placeholder; the scene builder replaces this file). Shots: v2/SHOTPLAN_V2.md V10. */
export const SFX: Sfx[] = [];

export const V10KitClip: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center'}}>
    <div style={{fontFamily: F.display, fontSize: 72, color: C.ink}}>V10 · The kit clip and its conditions</div>
  </AbsoluteFill>
);
