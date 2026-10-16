// The traced Roadster (short3/Roadster.tsx) placed on a surface: facing right, wheel-base midpoint on the contact
// line at (x, y), rotated rigidly by `heading` degrees (SVG rotation, clockwise on screen). Everything is one group,
// so wheels, body and glass stay attached through any rotation. Local frame: +x forward, -y away from the surface.
import React from 'react';
import {PROFILE, Roadster, SKIRT, WHEELS} from '../short3/Roadster';

/** World units per source pixel: the car is drawn 430 units long (≈ 4.3 m at 100 units per metre). */
export const CAR_K = 430 / (PROFILE.xMax - PROFILE.xMin);
export const DROOP = 12; // source px of extra wheel drop so the floor gap reads in the diagram (simplified)
const midX = (WHEELS[0].c[0] + WHEELS[1].c[0]) / 2;
const skirtXs = SKIRT.map((p) => p[0]);
const skirtBottom = Math.max(...SKIRT.map((p) => p[1]));
/** Geometry in car-local world units (facing right, contact line y = 0). */
export const CAR = {
  len: (PROFILE.xMax - PROFILE.xMin) * CAR_K,
  nose: (midX - PROFILE.xMin) * CAR_K, // distance from wheel-base midpoint forward to the nose
  tail: (PROFILE.xMax - midX) * CAR_K,
  roof: -(PROFILE.wheelBottom + DROOP - PROFILE.roof) * CAR_K, // y of the roof (negative)
  floor: -(PROFILE.wheelBottom + DROOP - skirtBottom) * CAR_K, // y of the floor (negative, small)
  // skirt span (the sealed floor), local x
  gapFront: (midX - Math.min(...skirtXs)) * CAR_K,
  gapRear: -(Math.max(...skirtXs) - midX) * CAR_K,
  cy: -(PROFILE.wheelBottom + DROOP - (PROFILE.roof + skirtBottom) / 2) * CAR_K, // body centre height
};

export const CarSide: React.FC<{x: number; y: number; heading?: number; lift?: number; opacity?: number; children?: React.ReactNode; ghost?: boolean}> = ({x, y, heading = 0, lift = 0, opacity = 1, children, ghost = false}) => (
  <g transform={`translate(${x} ${y}) rotate(${heading})`} opacity={opacity}>
    {/* lift: the body and wheels move together away from the surface (the gap opening as the car leaves) */}
    <g transform={`translate(0 ${-lift})`}>
      <g transform="scale(-1 1)" style={ghost ? {filter: 'grayscale(1)'} : undefined}>
        <Roadster x={-(midX - PROFILE.xMin) * CAR_K} y={0} k={CAR_K} droop={DROOP} />
      </g>
      {children}
    </g>
  </g>
);
