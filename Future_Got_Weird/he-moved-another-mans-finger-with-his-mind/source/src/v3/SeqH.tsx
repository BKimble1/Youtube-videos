// placeholder until the V3 ending is built
import React from 'react';
import {Placeholder} from '../shots/Placeholder';
export const VH: React.FC<{f: number}> = ({f}) => <Placeholder f={f} title="V3 H ending" />;
export const CUES_VH = (): {t: number; kind: string; gain?: number; dur?: number}[] => [];
