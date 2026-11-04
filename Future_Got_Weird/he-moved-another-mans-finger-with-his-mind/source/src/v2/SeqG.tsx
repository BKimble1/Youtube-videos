// placeholder until the V2 sequence is built
import React from 'react';
import {Placeholder} from '../shots/Placeholder';
export const VG: React.FC<{f: number}> = ({f}) => <Placeholder f={f} title="V2 G trust + ending" />;
export const CUES_VG = (): {t: number; kind: string; gain?: number; dur?: number}[] => [];
