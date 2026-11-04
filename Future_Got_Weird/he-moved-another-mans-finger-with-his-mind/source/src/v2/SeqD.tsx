// placeholder until the V2 sequence is built
import React from 'react';
import {Placeholder} from '../shots/Placeholder';
export const VD: React.FC<{f: number}> = ({f}) => <Placeholder f={f} title="V2 D failed session" />;
export const CUES_VD = (): {t: number; kind: string; gain?: number; dur?: number}[] => [];
