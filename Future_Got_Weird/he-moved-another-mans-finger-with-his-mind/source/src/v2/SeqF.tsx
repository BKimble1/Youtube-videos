// placeholder until the V2 sequence is built
import React from 'react';
import {Placeholder} from '../shots/Placeholder';
export const VF: React.FC<{f: number}> = ({f}) => <Placeholder f={f} title="V2 F BrainNet" />;
export const CUES_VF = (): {t: number; kind: string; gain?: number; dur?: number}[] => [];
