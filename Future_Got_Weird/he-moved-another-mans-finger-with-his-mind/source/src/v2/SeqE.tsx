// placeholder until the V2 sequence is built
import React from 'react';
import {Placeholder} from '../shots/Placeholder';
export const VE: React.FC<{f: number}> = ({f}) => <Placeholder f={f} title="V2 E 2014 control" />;
export const CUES_VE = (): {t: number; kind: string; gain?: number; dur?: number}[] => [];
