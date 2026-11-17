// The lab, as one 2D set in lab units (about 1 mm each; y down; the bench top at BENCH_Y), seen through the dc
// 2.5D camera (dc/camera.tsx: layers at depths for parallax). The same set serves the assembly (left end of the
// bench), the tank and the time-lapse (middle), and the heart model (right).
import React from 'react';
import {Inked, Deco, INK} from '../dc/ink';
import {Lin} from '../dc/shade';
import {mix, lit, shade} from '../dc/color';
import {Heart} from '../art/heart';

export const BENCH_Y = 1310;
/** the tank: interior in lab units; the fish's world (0.1 mm units, art/water.tsx TANK) maps in at x0.1 */
export const TANKL = {x0: 140, x1: 420, top: 1226, surf: 1243, floor: 1300, glass: 5};
/** tank world (0.1 mm) -> lab: the tank's world x = 0 sits at the tank's middle, world y = 0 at mid-water */
export const tankToLab = (x: number, y: number) => ({x: (TANKL.x0 + TANKL.x1) / 2 + x * 0.1, y: (TANKL.surf + TANKL.floor) / 2 + y * 0.1});
export const HEART_AT = {x: 1010, y: BENCH_Y - 150, s: 0.42};
export const WINDOW = {x0: -60, x1: 330, y0: 260, y1: 760};
export const CLOCK = {x: 720, y: 430, r: 62};

const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${x0 + r},${y0} H${x1 - r} Q${x1},${y0} ${x1},${y0 + r} V${y1 - r} Q${x1},${y1} ${x1 - r},${y1} H${x0 + r} Q${x0},${y1} ${x0},${y1 - r} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} Z`;

/** wall, shelves, window (day 0..1), wall clock (hours as a float) */
export const LabWall: React.FC<{id: string; day?: number; hours?: number}> = ({id, day = 1, hours = 10.2}) => {
  const sky = mix('#24304F', '#BFE6F4', day);
  const wall0 = mix('#7D8FA6', '#C9DCE6', 0.35 + 0.65 * day), wall1 = mix('#8C9DB3', '#E3EDF1', 0.35 + 0.65 * day);
  const hA = (hours / 12) * 360, mA = (hours % 1) * 360;
  const hand = (a: number, l: number, w: number) => {
    const r = ((a - 90) * Math.PI) / 180;
    return <path d={`M${CLOCK.x},${CLOCK.y} L${CLOCK.x + Math.cos(r) * l},${CLOCK.y + Math.sin(r) * l}`} stroke={INK} strokeWidth={w} strokeLinecap="round" />;
  };
  return (
    <g>
      <Lin id={`${id}-w`} d="M-3000,-1500 H3500 V3200 H-3000 Z" from={{x: 0, y: -400}} to={{x: 0, y: 1400}} stops={[[0, wall0], [1, wall1]]} />
      <path d="M-3000,960 H3500 V1010 H-3000 Z" fill="#2FA7A0" opacity={0.75} />
      {/* window: the sky changes with the time of day; its light falls on the wall */}
      <path d={rr(WINDOW.x0, WINDOW.y0, WINDOW.x1, WINDOW.y1, 6)} fill={sky} stroke="#9AAAB3" strokeWidth={16} />
      {day < 0.4 && [0, 1, 2, 3, 4].map((k) => <circle key={k} cx={WINDOW.x0 + 40 + k * 70} cy={WINDOW.y0 + 60 + ((k * 53) % 120)} r={3} fill="#FFFFFF" opacity={0.8 * (1 - day / 0.4)} />)}
      <path d={`M${(WINDOW.x0 + WINDOW.x1) / 2},${WINDOW.y0} V${WINDOW.y1} M${WINDOW.x0},${(WINDOW.y0 + WINDOW.y1) / 2} H${WINDOW.x1}`} stroke="#9AAAB3" strokeWidth={10} />
      {[-1500, -700, 1000, 1700].map((x, i) => (
        <g key={i}>
          <path d={`M${x - 330},${420} H${x + 330} V${436} H${x - 330} Z`} fill="#9AAAB3" />
          <path d={`M${x - 330},${700} H${x + 330} V${716} H${x - 330} Z`} fill="#9AAAB3" />
          {[0, 1, 2, 3, 4].map((k) => {
            const bx = x - 290 + k * 120;
            const h = 90 + ((k * 37 + i * 13) % 50);
            const c = ['#7FC9C2', '#F2C46A', '#E98F7A', '#BFD8E6', '#9ED0B0'][(k + i) % 5];
            return (
              <g key={k}>
                <path d={rr(bx, 420 - h, bx + 56, 420, 12)} fill={c} opacity={0.85} />
                <path d={rr(bx + 4, 700 - h * 0.8, bx + 52, 700, 10)} fill={['#BFD8E6', '#F2C46A', '#7FC9C2'][(k + i * 2) % 3]} opacity={0.75} />
              </g>
            );
          })}
        </g>
      ))}
      {/* the wall clock */}
      <circle cx={CLOCK.x} cy={CLOCK.y} r={CLOCK.r + 8} fill="#F7F9FA" stroke={INK} strokeWidth={6} />
      {Array.from({length: 12}, (_, k) => {
        const r = (k / 12) * Math.PI * 2;
        return <path key={k} d={`M${CLOCK.x + Math.cos(r) * (CLOCK.r - 10)},${CLOCK.y + Math.sin(r) * (CLOCK.r - 10)} L${CLOCK.x + Math.cos(r) * CLOCK.r},${CLOCK.y + Math.sin(r) * CLOCK.r}`} stroke={INK} strokeWidth={k % 3 === 0 ? 5 : 3} />;
      })}
      {hand(hA, CLOCK.r * 0.55, 7)}
      {hand(mA, CLOCK.r * 0.85, 4.5)}
      <circle cx={CLOCK.x} cy={CLOCK.y} r={5} fill={INK} />
      {/* the night: the room darkens toward a cool blue */}
      <rect x={-3000} y={-1500} width={6500} height={4700} fill="#14213D" opacity={0.42 * (1 - day)} />
    </g>
  );
};

export const Bench: React.FC<{id: string; k: number}> = ({id, k}) => (
  <g>
    <Inked w={5 * k}>
      <Lin id={`${id}-top`} d={`M-3000,${BENCH_Y - 14} H3500 V${BENCH_Y + 18} H-3000 Z`} from={{x: 0, y: BENCH_Y - 14}} to={{x: 0, y: BENCH_Y + 18}} stops={[[0, '#5E6B74'], [1, '#46535C']]} />
      <Lin id={`${id}-fr`} d={`M-3000,${BENCH_Y + 18} H3500 V${BENCH_Y + 1400} H-3000 Z`} from={{x: 0, y: BENCH_Y + 18}} to={{x: 0, y: BENCH_Y + 700}} stops={[[0, '#3A6E7A'], [1, '#2C5560']]} />
    </Inked>
    <Deco>
      <path d={`M-3000,${BENCH_Y - 13} H3500`} stroke="#FFFFFF" strokeWidth={2 * k} opacity={0.25} />
      {[-1700, -900, -100, 700, 1500, 2300].map((x) => (
        <g key={x}>
          <path d={rr(x - 360, BENCH_Y + 60, x + 360, BENCH_Y + 560, 18)} fill="none" stroke="#244852" strokeWidth={6 * k} />
          <path d={`M${x - 80},${BENCH_Y + 100} H${x + 80}`} stroke="#C9D6DC" strokeWidth={10 * k} strokeLinecap="round" />
        </g>
      ))}
    </Deco>
  </g>
);

/** the tank's back half: the grid sheet, back glass, the water (behind the fish) */
export const TankBack: React.FC<{id: string; k: number; t: number; day?: number}> = ({id, k, t, day = 1}) => {
  const {x0, x1, top, surf, floor, glass} = TANKL;
  const lines: string[] = [];
  for (let x = x0 - 6; x <= x1 + 6; x += 5) lines.push(`M${x},${floor + 8} L${x + (x - (x0 + x1) / 2) * 0.04},${floor - 6}`);
  const caus: string[] = [];
  for (let i = 0; i < 18; i++) {
    const cx = x0 + 10 + ((i * 47 + t * 9) % (x1 - x0 - 20));
    caus.push(`M${(cx - 8).toFixed(1)},${(floor - 3).toFixed(1)} q4,${(-2 - Math.sin(t * 2 + i)).toFixed(1)} 9,0`);
  }
  const water = mix('#3E8E9C', '#60B3BF', day);
  return (
    <g>
      {/* the millimetre grid sheet under the glass bottom */}
      <path d={`M${x0 - 14},${BENCH_Y - 1} H${x1 + 14} V${BENCH_Y - 4} H${x0 - 14} Z`} fill="#F1F5F4" stroke={INK} strokeWidth={1.2 * k} />
      <path d={`M${x0},${top} H${x1} V${floor} H${x0} Z`} fill={shade(water, 0.25)} opacity={0.6} />
      <Lin id={`${id}-wt`} d={`M${x0},${surf} H${x1} V${floor} H${x0} Z`} from={{x: 0, y: surf}} to={{x: 0, y: floor}} stops={[[0, lit(water, 0.15)], [1, shade(water, 0.18)]]} opacity={0.88} />
      {/* the floor: the grid seen through the glass bottom, receding */}
      <path d={`M${x0},${floor - 6} H${x1} V${floor} H${x0} Z`} fill={mix('#CFE7E6', water, 0.35)} />
      <path d={lines.join('')} stroke="#24606B" strokeWidth={0.5 * k} opacity={0.5} />
      <path d={caus.join('')} stroke="#F4FFFB" strokeWidth={0.7 * k} fill="none" opacity={0.5} />
      <path d={`M${x0},${surf} H${x1}`} stroke="#E6FFFB" strokeWidth={1.4 * k} opacity={0.75} />
      <path d={`M${x0},${floor} H${x1} V${BENCH_Y - 4} H${x0} Z`} fill="#CFEFF2" opacity={0.75} />
      <path d={`M${x0 - glass},${top} V${BENCH_Y - 4} M${x1 + glass},${top} V${BENCH_Y - 4}`} stroke="#BFE4EA" strokeWidth={glass} opacity={0.7} />
    </g>
  );
};
/** the tank's front: glass edges and reflections (over the fish) */
export const TankFront: React.FC<{id: string; k: number}> = ({k}) => {
  const {x0, x1, top, glass} = TANKL;
  return (
    <g>
      <path d={`M${x0 - glass},${top} H${x1 + glass} V${BENCH_Y - 4} H${x0 - glass} Z`} fill="none" stroke={INK} strokeWidth={2.2 * k} />
      <path d={`M${x0 - glass},${top} H${x1 + glass}`} stroke="#E9FBFD" strokeWidth={3 * k} opacity={0.9} />
      <path d={`M${x0 + 18},${top + 6} L${x0 + 38},${BENCH_Y - 10} M${x0 + 30},${top + 6} L${x0 + 44},${top + 40}`} stroke="#FFFFFF" strokeWidth={2.5 * k} opacity={0.35} strokeLinecap="round" />
      <path d={`M${x1 - 40},${top + 6} L${x1 - 24},${BENCH_Y - 10}`} stroke="#FFFFFF" strokeWidth={4 * k} opacity={0.18} strokeLinecap="round" />
    </g>
  );
};

/** the anatomical model on its stand (a painted plastic teaching model) */
export const HeartModel: React.FC<{id: string; k: number; gloss?: number}> = ({id, k, gloss = 1}) => {
  const {x, y, s} = HEART_AT;
  return (
    <g>
      <ellipse cx={x + 6} cy={BENCH_Y - 4} rx={70} ry={10} fill="#1E2A30" opacity={0.25} />
      <path d={`M${x - 64},${BENCH_Y - 2} Q${x - 64},${BENCH_Y - 18} ${x},${BENCH_Y - 18} Q${x + 64},${BENCH_Y - 18} ${x + 64},${BENCH_Y - 2} Z`} fill="#3B4650" stroke={INK} strokeWidth={2.5 * k} />
      <path d={`M${x - 5},${BENCH_Y - 18} V${y + 60} H${x + 5} V${BENCH_Y - 18} Z`} fill="#8E9AA3" stroke={INK} strokeWidth={2 * k} />
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <Heart id={`${id}-h`} style="model" ink={2.6 * k / s} gloss={gloss} />
      </g>
    </g>
  );
};

/** the assembly corner: a laser-cut paper sheet (the fish outlines cut out of it), a dish, a gelatin slab */
export const WorkMat: React.FC<{id: string; k: number}> = ({k}) => (
  <g>
    <path d={`M-560,${BENCH_Y - 15} H-60 V${BENCH_Y - 11} H-560 Z`} fill="#EDF2F4" stroke={INK} strokeWidth={1.5 * k} />
    <path d={`M-520,${BENCH_Y - 17} H-380 V${BENCH_Y - 15} H-520 Z`} fill="#F7F4EA" stroke={INK} strokeWidth={1.2 * k} />
    <ellipse cx={-180} cy={BENCH_Y - 18} rx={46} ry={6} fill="#DDF2F5" stroke={INK} strokeWidth={1.4 * k} opacity={0.95} />
    <path d={`M-226,${BENCH_Y - 18} V${BENCH_Y - 26} M-134,${BENCH_Y - 18} V${BENCH_Y - 26}`} stroke={INK} strokeWidth={1.4 * k} />
    <ellipse cx={-180} cy={BENCH_Y - 26} rx={46} ry={6} fill="none" stroke={INK} strokeWidth={1.4 * k} />
    <path d={`M-300,${BENCH_Y - 15} h40 v-8 h-40 Z`} fill="#F4E2B0" opacity={0.85} stroke={INK} strokeWidth={1.2 * k} />
  </g>
);
export {rr};
