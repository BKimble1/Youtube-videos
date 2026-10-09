import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {Sfx} from '../lib/sfx';

/** V1 · Hide and the real track (v2 placeholder; the scene builder replaces this file). Shots: v2/SHOTPLAN_V2.md V1. */
export const SFX: Sfx[] = [];

export const V1HideTrack: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center'}}>
    <div style={{fontFamily: F.display, fontSize: 72, color: C.ink}}>V1 · Hide and the real track</div>
  </AbsoluteFill>
);
