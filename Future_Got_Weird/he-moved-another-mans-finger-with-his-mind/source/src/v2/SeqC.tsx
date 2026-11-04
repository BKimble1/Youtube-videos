// placeholder until the V2 sequence is built
import React from 'react';
import {Placeholder} from '../shots/Placeholder';
export const VC: React.FC<{f: number}> = ({f}) => <Placeholder f={f} title="V2 C route" />;
export const CUES_VC = (): {t: number; kind: string; gain?: number; dur?: number}[] => [];
