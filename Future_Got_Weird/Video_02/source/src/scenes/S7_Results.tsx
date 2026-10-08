import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import type {Sfx} from '../lib/sfx';

// Placeholder: the scene agent replaces this file.
export const SFX: Sfx[] = [];
export const S7Results: React.FC = () => (
  <AbsoluteFill style={{background: C.paper, alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontSize: 80, color: C.ink}}>S7_Results</AbsoluteFill>
);
