// placeholder until the V2 sequence is built
import React from 'react';
import {Placeholder} from '../shots/Placeholder';
export const VA: React.FC<{f: number}> = ({f}) => <Placeholder f={f} title="V2 A opening + campus" />;
export const CUES_VA = (): {t: number; kind: string; gain?: number; dur?: number}[] => [];
