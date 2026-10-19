// Thumbnail: the U9 side profile just off flat asphalt (the same small hop the opening shows), a grounded shadow, and
// "NO RAMP". The camera sits low so the gap under the tyres shows the bright background instead of grey road: the
// small jump reads at thumbnail size without exaggerating the height. It is an illustration (vector treatment), not a
// documentary frame. The clearance is set from the airborne source frame once the footage is in (FOOTAGE.thumbClear).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';
import {SideCar} from '../car/side';

export const THUMB_CLEAR = 112; // tyre-to-road gap (mm): the launch model's apex clearance, the size of the hop in the video

export const Thumb: React.FC = () => {
  const z = 0.33;
  const gx = 1030, gy = 845; // screen position of the car origin (ground under mid-wheelbase)
  const lift = THUMB_CLEAR;
  return (
    <AbsoluteFill style={{background: '#CFE7E4'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          <linearGradient id="tsky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#BFE3DF" />
            <stop offset="1" stopColor="#FFF6E2" />
          </linearGradient>
          <radialGradient id="tglow" cx="0.62" cy="0.62" r="0.6">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#tsky)" />
        <rect width={1920} height={1080} fill="url(#tglow)" />
        {/* far hills right at road level (low camera) */}
        <path d={`M 0 ${gy - 40} C 300 ${gy - 150} 600 ${gy - 110} 900 ${gy - 60} C 1200 ${gy - 160} 1550 ${gy - 140} 1920 ${gy - 70} L 1920 ${gy} L 0 ${gy} Z`} fill="#A6D6CB" stroke={C.ink} strokeWidth={3} strokeOpacity={0.3} />
        {/* asphalt: a thin far edge, then the road toward the camera */}
        <rect x={0} y={gy - 6} width={1920} height={1080 - gy + 6} fill="#7F898E" />
        <rect x={0} y={gy - 10} width={1920} height={8} fill="#E2DAC4" />
        <rect x={0} y={gy + 120} width={1920} height={22} fill={C.cream} opacity={0.9} />
        <line x1={0} y1={gy - 6} x2={1920} y2={gy - 6} stroke={C.ink} strokeWidth={4} strokeOpacity={0.6} />
        {/* grounded shadow on the road, tight and dark (the car is only just off the ground) */}
        <ellipse cx={gx - 10} cy={gy + 10} rx={2500 * z * 0.92} ry={34} fill={C.ink} opacity={0.32} />
        <g transform={`translate(${gx} ${gy}) scale(${z} ${-z})`}>
          <SideCar x={0} dz={lift + 20} wf={lift} wr={lift} px={z} shadow={0} id="thumb" />
        </g>
        {/* the gap made explicit: two short lift marks under the tyres */}
        {[-1450, 1450].map((ax) => (
          <g key={ax} transform={`translate(${gx + ax * z} ${gy})`}>
            <line x1={-60} y1={-2} x2={60} y2={-2} stroke={C.ink} strokeWidth={6} strokeLinecap="round" opacity={0.75} />
          </g>
        ))}
        <text x={96} y={250} fontFamily={F.display} fontWeight={700} fontSize={230} fill={C.white} stroke={C.ink} strokeWidth={22} paintOrder="stroke" letterSpacing={-2}>
          NO RAMP
        </text>
        <g transform="translate(100 286)">
          <rect x={0} y={0} width={640} height={100} rx={30} fill={C.saffron} stroke={C.ink} strokeWidth={8} />
          <text x={320} y={70} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={64} fill={C.ink} letterSpacing={3}>YANGWANG U9</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
