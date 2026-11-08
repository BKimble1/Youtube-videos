import React from 'react';
import {T} from './timing';
export const carActive = (t: number) => t >= T.now - 0.03 && t < T.without - 0.05;
export const CarView: React.FC<{t: number}> = () => <rect width={1080} height={1920} fill="#333" />;
