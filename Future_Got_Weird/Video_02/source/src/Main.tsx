import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from './theme';
// Placeholder until the scenes exist; the scene stack is added with the final timeline.
export const Main: React.FC<{audio?: 'mix' | 'narration' | 'none'}> = () => <AbsoluteFill style={{backgroundColor: C.paper}} />;
