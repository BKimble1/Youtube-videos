// placeholder until the V2 sequence is built
import React from 'react';
import {Placeholder} from '../shots/Placeholder';
export const VB: React.FC<{f: number}> = ({f}) => <Placeholder f={f} title="V2 B setup + game" />;
export const CUES_VB = (): {t: number; kind: string; gain?: number; dur?: number}[] => [];
