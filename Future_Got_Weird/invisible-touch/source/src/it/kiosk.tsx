import React from 'react';
import {T} from './timing';
export const kioskActive = (t: number) => t >= T.without - 0.05 && t < T.and2 - 0.06;
export const KioskView: React.FC<{t: number}> = () => <rect width={1080} height={1920} fill="#555" />;
