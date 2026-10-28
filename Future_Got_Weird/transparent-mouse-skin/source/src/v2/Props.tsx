// "Ordinary food colouring" made unmistakable: a generic kitchen food-colouring squeeze bottle (no brand: yellow
// liquid, pointed dropper cap, a plain cupcake-and-drop label), squeezing drops of yellow dye into a small dish of
// water, which blooms into the yellow-orange solution the swab picks up. Drawn top-down/three-quarter in world
// coordinates beside the mouse (the dish is the bench's dish position, x 960, y 760).
import React from 'react';
import {INK} from '../dc/ink';
import {clamp, easeOut, lerp} from '../dc/math';

export const DISH = {x: 960, y: 760, r: 98};

/** the dish: clear water that the dye blooms through (bloom 0..1); ripples from a drop landing at `drop` (s ago) */
export const Dish: React.FC<{bloom: number; ripple: number; dip?: number}> = ({bloom, ripple, dip = 0}) => {
  const liquid = bloom <= 0 ? '#CFE6EE' : bloom >= 1 ? '#F2B232' : undefined;
  return (
    <g>
      <ellipse cx={DISH.x} cy={DISH.y} rx={118} ry={118} fill="rgba(20,40,60,0.18)" transform="translate(10 14)" />
      <circle cx={DISH.x} cy={DISH.y} r={118} fill="#E8F2F6" stroke={INK} strokeWidth={5} />
      <circle cx={DISH.x} cy={DISH.y} r={DISH.r} fill={liquid ?? '#CFE6EE'} />
      {bloom > 0 && bloom < 1 && (
        <g>
          {/* the yellow blooming outward from where the drop fell, with curls of colour */}
          <circle cx={DISH.x - 10} cy={DISH.y - 6} r={DISH.r * easeOut(bloom) * 1.05} fill="#F2B232" opacity={0.92} />
          {[0, 1, 2, 3].map((k) => (
            <path key={k} d={`M${DISH.x - 10},${DISH.y - 6} q${40 * Math.cos(k * 1.6 + bloom * 3)},${40 * Math.sin(k * 1.6 + bloom * 3)} ${70 * bloom * Math.cos(k * 1.6 + 1)},${70 * bloom * Math.sin(k * 1.6 + 1)}`}
              stroke="#E08A1E" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.6 * (1 - bloom)} />
          ))}
        </g>
      )}
      {ripple > 0 && ripple < 1 && [0, 1].map((k) => (
        <circle key={k} cx={DISH.x - 10} cy={DISH.y - 6} r={10 + (ripple + k * 0.3) * 80} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.7 * (1 - ripple)} />
      ))}
      {dip > 0 && <circle cx={DISH.x - 30} cy={DISH.y + 20} r={20 + 40 * dip} fill="none" stroke="#FFF1C2" strokeWidth={4} opacity={0.6 * (1 - dip)} />}
      <circle cx={DISH.x} cy={DISH.y} r={DISH.r} fill="none" stroke={bloom > 0.5 ? '#E08A1E' : '#9CC7D6'} strokeWidth={8} opacity={0.6} />
      <ellipse cx={DISH.x - 32} cy={DISH.y - 38} rx={36} ry={16} fill="#FFFFFF" opacity={0.6} transform={`rotate(-30 ${DISH.x - 32} ${DISH.y - 38})`} />
      <path d={`M${DISH.x - 98},${DISH.y - 60} A118,118 0 0 1 ${DISH.x + 50},${DISH.y - 110}`} stroke="#fff" strokeWidth={8} fill="none" opacity={0.7} strokeLinecap="round" />
    </g>
  );
};

/** the food colouring bottle, nozzle at (nx, ny), tilted `tilt` deg from pointing straight down-left; squeeze 0..1 */
export const FoodColoring: React.FC<{nx: number; ny: number; tilt: number; squeeze: number}> = ({nx, ny, tilt, squeeze}) => {
  const w = 120 * (1 - 0.08 * squeeze);
  return (
    <g transform={`translate(${nx} ${ny}) rotate(${tilt})`}>
      {/* drawn with the nozzle at the origin, the bottle body extending up-right */}
      <g transform="rotate(-135)">
        <path d="M0,0 L-16,70 L16,70 Z" fill="#F4F4F0" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <rect x={-34} y={66} width={68} height={50} rx={10} fill="#F4F4F0" stroke={INK} strokeWidth={5} />
        <path d={`M${-w / 2},116 L${w / 2},116 L${w / 2 + 6},330 Q0,352 ${-w / 2 - 6},330 Z`} fill="#F7C531" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M${-w / 2 + 16},140 L${-w / 2 + 20},310`} stroke="#FFF2B0" strokeWidth={12} strokeLinecap="round" opacity={0.8} />
        {/* plain label: a cupcake and a drop (no text, no brand) */}
        <rect x={-w / 2 + 10} y={180} width={w - 20} height={110} rx={10} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
        <path d="M-26,262 L26,262 L18,238 L-18,238 Z" fill="#F2A7B5" stroke={INK} strokeWidth={3} />
        <path d="M-22,238 Q-24,214 0,210 Q24,214 22,238 Z" fill="#FFF3C2" stroke={INK} strokeWidth={3} />
        <path d="M26,196 Q36,212 26,222 Q16,212 26,196 Z" fill="#F7C531" stroke={INK} strokeWidth={2.5} />
      </g>
    </g>
  );
};

/** a falling drop of dye: from the nozzle at p0 to the dish surface at p1, u 0..1 */
export const Drop: React.FC<{x0: number; y0: number; x1: number; y1: number; u: number}> = ({x0, y0, x1, y1, u}) => {
  if (u <= 0 || u >= 1) return null;
  const x = lerp(x0, x1, u), y = lerp(y0, y1, u * u), s = clamp(0.6 + u);
  return <path d={`M${x},${y - 22 * s} Q${x + 12 * s},${y} ${x},${y + 10 * s} Q${x - 12 * s},${y} ${x},${y - 22 * s} Z`} fill="#F7B21E" stroke={INK} strokeWidth={3} />;
};
