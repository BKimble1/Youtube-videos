// Dev: play one footage file at a given crop, for checking decode, frame cadence and crop framing in real renders.
import React from 'react';
import {Footage} from './timeline';
export const V3Probe: React.FC<{file: string; src0: number; scale: number; cx: number; cy: number}> = ({file, src0, scale, cx, cy}) => <Footage file={file} a={0} src0={src0} scale={scale} cx={cx} cy={cy} />;
