// The Roadster seen from straight behind, drawn from the stage footage (rec_225050 0:17.0 and 0:19.0, see
// qa/reference/roadster_board.jpg): wide white tail, two pointed fins framing the dark glass canopy, a full-width red
// light bar, the plate, a dark diffuser with four round outlets, and wide tyres. Only what the footage shows; the
// four outlets are not labelled because their function is not confirmed.
//
// Units: origin at the ground under the car's centre line, y up is negative. Width 580, height to the fin tips 380,
// which matches the side profile (short3/Roadster.tsx) when drawn at REAR_PER_SIDE × the side scale.
import React from 'react';

export const REAR = {width: 580, height: 380, cy: -190};
/** Rear-view units per side-profile source pixel, so the two views of the car agree in size. */
export const REAR_PER_SIDE = 0.405;

const INK = '#0B1418';
const body = 'M -258 -140 C -272 -152 -284 -170 -288 -200 C -291 -222 -288 -238 -284 -248 L -262 -268 L -205 -288 L -168 -326 L -142 -378 L -128 -332 L -112 -290 L 112 -290 L 128 -332 L 142 -378 L 168 -326 L 205 -288 L 262 -268 L 284 -248 C 288 -238 291 -222 288 -200 C 284 -170 272 -152 258 -140 Q 0 -128 -258 -140 Z';
const glass = 'M -139 -372 Q 0 -390 139 -372 L 112 -290 L -112 -290 Z';

/**
 * Rear view of the Roadster. (x, y) is where the ground point under the centre line lands, k the scale. `roll` rotates
 * the whole car rigidly about its centre (REAR.cy), so nothing detaches: positive = clockwise as seen from behind.
 */
export const RoadsterRear: React.FC<{x: number; y: number; k: number; roll?: number; shadow?: boolean; id?: string}> = ({x, y, k, roll = 0, shadow = false, id = 'rr'}) => {
  const sw = 3.2 / k;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      {shadow && <ellipse cx={0} cy={2} rx={300} ry={14} fill="rgba(22,42,50,0.18)" />}
      <g transform={`rotate(${roll} 0 ${REAR.cy})`}>
        <defs>
          <linearGradient id={`${id}Body`} x1="0" y1="-380" x2="0" y2="-130" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.6" stopColor="#EEF2F4" />
            <stop offset="1" stopColor="#C9D2D7" />
          </linearGradient>
          <linearGradient id={`${id}Deck`} x1="0" y1="-292" x2="0" y2="-246" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#E3E9EC" />
          </linearGradient>
        </defs>
        {/* tyres (behind the body) */}
        {[-1, 1].map((s) => (
          <rect key={s} x={s < 0 ? -292 : 206} y={-122} width={86} height={122} rx={18} fill="#14191C" stroke={INK} strokeWidth={sw} />
        ))}
        {[-1, 1].map((s) => (
          <line key={`t${s}`} x1={s * 249} y1={-112} x2={s * 249} y2={-10} stroke="#2C3438" strokeWidth={3} />
        ))}
        {/* diffuser */}
        <path d="M -226 -146 L 226 -146 L 210 -54 L -210 -54 Z" fill="#262D31" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M -200 -70 L 200 -70" stroke="#3A4348" strokeWidth={4} />
        {[-112, -38, 38, 112].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={-108} r={13} fill="#4B555A" stroke={INK} strokeWidth={sw * 0.9} />
            <circle cx={cx} cy={-108} r={6.5} fill="#0E1316" />
          </g>
        ))}
        {/* body, glass, deck */}
        <path d={body} fill={`url(#${id}Body)`} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M -262 -268 L -205 -288 L -112 -290 L 112 -290 L 205 -288 L 262 -268 L 284 -248 L -284 -248 Z" fill={`url(#${id}Deck)`} />
        <path d="M -284 -248 L 284 -248" stroke="#B7C2C8" strokeWidth={2} />
        <path d={glass} fill="#11181D" stroke={INK} strokeWidth={sw * 0.8} strokeLinejoin="round" />
        <path d="M -96 -364 Q -40 -372 10 -370" stroke="rgba(255,255,255,0.22)" strokeWidth={5} fill="none" strokeLinecap="round" />
        {/* light bar: full width, brighter centre */}
        <path d="M -276 -238 L 276 -238" stroke="#E8332B" strokeWidth={8} strokeLinecap="round" />
        <path d="M -130 -239 L 130 -239" stroke="#FF8A7E" strokeWidth={3.5} strokeLinecap="round" />
        {/* plate */}
        <rect x={-46} y={-214} width={92} height={40} rx={4} fill="#F7F9FA" stroke={INK} strokeWidth={sw * 0.7} />
        <rect x={-30} y={-198} width={60} height={8} rx={3} fill="#C3CBD0" />
      </g>
    </g>
  );
};
