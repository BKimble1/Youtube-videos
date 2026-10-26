// V3 beat F (18.79-25.61): upward lightning and the measured guided section, one main view. Stand-in until built.
import React from 'react';
import {demoCam} from './cams3';
import {demoSt} from './states3';
import {View3} from './view3';

export const DemoF: React.FC<{t: number}> = ({t}) => <View3 cam={demoCam(t)} st={demoSt(t)} t={t} tag="f" />;
