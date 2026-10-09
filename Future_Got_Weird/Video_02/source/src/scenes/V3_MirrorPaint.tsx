import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {Sfx} from '../lib/sfx';

/** V3 · Mirror versus paint (v2 placeholder; the scene builder replaces this file). Shots: v2/SHOTPLAN_V2.md V3. */
export const SFX: Sfx[] = [];

export const V3MirrorPaint: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center'}}>
    <div style={{fontFamily: F.display, fontSize: 72, color: C.ink}}>V3 · Mirror versus paint</div>
  </AbsoluteFill>
);
