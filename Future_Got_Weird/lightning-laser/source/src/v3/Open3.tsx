// V3 beats A (0-4.31, the opening demonstration) and H (28.94-33.5, extension, apparatus reveal, return to the
// opening camera). Stand-in until the beat is built: the contract camera and state only.
import React from 'react';
import {openCam} from './cams3';
import {openSt} from './states3';
import {View3} from './view3';

export const OpenA: React.FC<{t: number}> = ({t}) => <View3 cam={openCam(t)} st={openSt(t)} t={t} tag="a" />;
export const EndH: React.FC<{t: number}> = ({t}) => <View3 cam={openCam(t)} st={openSt(t)} t={t} tag="h" />;
