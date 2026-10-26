// Optional extra site objects drawn inside every View3 (between the sky/summit and the tower, and again after the
// tower, so an object can sit behind or in front of it). V3 provides none, so its views are unchanged; V4 provides the
// summit station (v4/Station4.tsx) through this context.
import React from 'react';
import {Cam3} from '../v2/p3';

export type SiteExtra = React.FC<{cam: Cam3; flash: number; t: number; layer: 'back' | 'front'; id: string}>;
export const SiteExtras = React.createContext<SiteExtra | null>(null);
