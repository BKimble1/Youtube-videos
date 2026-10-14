import React from 'react';
import {C} from '../theme';
import {rand} from '../lib/anim';

/**
 * Foundry scene kit: an original, light-palette illustration of a steel plant interior. Nothing here is traced from
 * the real Imatra plant or Figure's film; it is a generic set that makes the action legible (a raised walkway, an edge,
 * an open vessel of molten steel). Every shot that uses it carries an "illustration" label.
 *
 * Geometry (world px, 1920 x 1080 frame):
 *   walkway top surface y = WALK_Y, edge at x = EDGE_X
 *   ladle: centre x = LADLE_X, rim y = RIM_Y, rim radii RIM_RX x RIM_RY, floor y = FLOOR_Y
 */
export const WALK_Y = 600;
export const EDGE_X = 1000;
export const LADLE_X = 1400;
export const RIM_Y = 652;
export const RIM_RX = 232;
export const RIM_RY = 46;
export const SURF_RX = 206;
export const SURF_RY = 36;
export const FLOOR_Y = 968;

export const STEEL = {
  hot: '#FFF3B8',
  core: '#FFD25A',
  mid: '#FF9F2E',
  edge: '#E3542A',
  crust: '#8E3A22',
  shell: '#5D6670',
  shellDark: '#47505A',
  shellLight: '#7C8792',
  wall: '#EFE6D3',
  wallDeep: '#E2D6BE',
  window: '#F8F4EA',
  windowLine: '#CDBFA5',
  column: '#A9B2BB',
  floor: '#DCD1BF',
  floorDeep: '#CFC2AD',
};

/** Back wall, windows, columns, overhead crane girder, a distant furnace. `glow` 0..1 warms the wall. */
export const FoundryBack: React.FC<{glow?: number; frame: number; id: string}> = ({glow = 1, frame, id}) => {
  const flick = 0.85 + 0.15 * Math.sin(frame / 7) * Math.sin(frame / 11 + 1);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', overflow: 'visible'}}>
      <defs>
        <radialGradient id={`${id}-wallglow`} cx={LADLE_X} cy={RIM_Y} r={900} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFC07A" stopOpacity={0.55 * glow * flick} />
          <stop offset="0.45" stopColor="#FFD9A6" stopOpacity={0.22 * glow} />
          <stop offset="1" stopColor="#FFE9CF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-furn`} cx={330} cy={430} r={260} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFB45C" stopOpacity={0.5 * flick} />
          <stop offset="1" stopColor="#FFB45C" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-1200} y={-600} width={4320} height={2400} fill={STEEL.wall} />
      {/* tall windows */}
      {[-560, -180, 200, 580, 960, 1340, 1720, 2100].map((x, i) => (
        <g key={i}>
          <rect x={x} y={70} width={250} height={380} rx={8} fill={STEEL.window} stroke={STEEL.windowLine} strokeWidth={4} />
          <line x1={x + 125} y1={70} x2={x + 125} y2={450} stroke={STEEL.windowLine} strokeWidth={4} />
          <line x1={x} y1={260} x2={x + 250} y2={260} stroke={STEEL.windowLine} strokeWidth={4} />
        </g>
      ))}
      {/* columns */}
      {[-260, 120, 500, 880, 1260, 1640, 2020].map((x, i) => (
        <g key={i}>
          <rect x={x} y={-200} width={44} height={1200} fill={STEEL.column} stroke={C.ink} strokeWidth={3} opacity={0.55} />
          <rect x={x - 10} y={30} width={64} height={22} fill={STEEL.column} stroke={C.ink} strokeWidth={3} opacity={0.55} />
        </g>
      ))}
      {/* distant arc furnace: squat vessel, roof, three electrodes */}
      <g opacity={0.75}>
        <rect x={150} y={330} width={360} height={260} rx={30} fill="#B9B2A6" stroke={C.ink} strokeWidth={3} />
        <path d="M 130 340 Q 330 250 530 340 Z" fill="#A69F92" stroke={C.ink} strokeWidth={3} />
        {[270, 330, 390].map((x) => (
          <rect key={x} x={x - 12} y={170} width={24} height={150} fill="#7E7A73" stroke={C.ink} strokeWidth={3} />
        ))}
        <rect x={160} y={440} width={340} height={14} fill="#FF9F2E" opacity={0.7 * flick} />
      </g>
      <rect x={-1200} y={-600} width={4320} height={2400} fill={`url(#${id}-furn)`} />
      <rect x={-1200} y={-600} width={4320} height={2400} fill={`url(#${id}-wallglow)`} />
      {/* overhead crane girder */}
      <rect x={-1200} y={18} width={4320} height={46} fill={C.saffron} stroke={C.ink} strokeWidth={4} />
      {Array.from({length: 40}).map((_, i) => (
        <path key={i} d={`M ${-1200 + i * 110} 22 L ${-1145 + i * 110} 60`} stroke={C.saffronDeep} strokeWidth={6} />
      ))}
      {/* hook block hanging (idle) */}
      <g transform={`translate(1700 64)`}>
        <line x1={-10} y1={0} x2={-10} y2={180} stroke={C.ink} strokeWidth={4} />
        <line x1={10} y1={0} x2={10} y2={180} stroke={C.ink} strokeWidth={4} />
        <rect x={-30} y={180} width={60} height={50} rx={8} fill={STEEL.shell} stroke={C.ink} strokeWidth={4} />
        <path d="M 0 230 L 0 262 Q 0 292 -24 288" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      </g>
      {/* floor */}
      <rect x={-1200} y={FLOOR_Y - 30} width={4320} height={1200} fill={STEEL.floor} />
      <rect x={-1200} y={FLOOR_Y - 30} width={4320} height={10} fill={STEEL.floorDeep} />
    </svg>
  );
};

/** The raised walkway the robots walk along; its edge has hazard stripes. Railing is drawn on the far side. */
export const Walkway: React.FC<{x0?: number; edge?: number; y?: number; railing?: boolean}> = ({x0 = -900, edge = EDGE_X, y = WALK_Y, railing = true}) => {
  const depth = 30;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', overflow: 'visible'}}>
      <defs>
        <pattern id="hazard" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="20" height="40" fill={C.saffron} />
          <rect x="20" width="20" height="40" fill={C.ink} />
        </pattern>
      </defs>
      {railing && (
        <g>
          <rect x={x0} y={y - 118} width={edge - x0 - 40} height={9} fill={STEEL.shellLight} stroke={C.ink} strokeWidth={3} />
          <rect x={x0} y={y - 66} width={edge - x0 - 40} height={7} fill={STEEL.shellLight} stroke={C.ink} strokeWidth={3} />
          {Array.from({length: Math.ceil((edge - x0) / 170)}).map((_, i) => {
            const px = x0 + 40 + i * 170;
            return px < edge - 40 ? <rect key={i} x={px} y={y - 124} width={10} height={124} fill={STEEL.shellLight} stroke={C.ink} strokeWidth={3} /> : null;
          })}
        </g>
      )}
      {/* deck top and front face */}
      <rect x={x0} y={y - 10} width={edge - x0} height={10} fill="#C3BBAE" stroke={C.ink} strokeWidth={3} />
      <rect x={x0} y={y} width={edge - x0} height={depth} fill="url(#hazard)" stroke={C.ink} strokeWidth={4} />
      {/* supports */}
      {Array.from({length: 8}).map((_, i) => {
        const px = edge - 60 - i * 260;
        return px > x0 ? <rect key={i} x={px} y={y + depth} width={28} height={FLOOR_Y - y - depth - 30} fill={STEEL.shell} stroke={C.ink} strokeWidth={3} /> : null;
      })}
    </svg>
  );
};

/** Back half of the ladle (inner wall above the surface) + the molten surface. Draw before the robot. */
export const LadleBack: React.FC<{frame: number; id: string; flare?: number; ripple?: number; rippleX?: number}> = ({frame, id, flare = 0, ripple = -1, rippleX = LADLE_X}) => {
  const shimmer = (k: number) => Math.sin(frame / (9 + k) + k * 1.7);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', overflow: 'visible'}}>
      <defs>
        <radialGradient id={`${id}-surf`} cx={LADLE_X} cy={RIM_Y} r={SURF_RX} gradientUnits="userSpaceOnUse" gradientTransform={`translate(${LADLE_X} ${RIM_Y}) scale(1 ${SURF_RY / SURF_RX}) translate(${-LADLE_X} ${-RIM_Y})`}>
          <stop offset="0" stopColor={STEEL.hot} />
          <stop offset="0.45" stopColor={STEEL.core} />
          <stop offset="0.8" stopColor={STEEL.mid} />
          <stop offset="1" stopColor={STEEL.edge} />
        </radialGradient>
        <radialGradient id={`${id}-halo`} cx={LADLE_X} cy={RIM_Y - 40} r={420} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE6A0" stopOpacity={0.6 + 0.3 * flare} />
          <stop offset="1" stopColor="#FFE6A0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={LADLE_X - 600} y={RIM_Y - 520} width={1200} height={700} fill={`url(#${id}-halo)`} />
      {/* inner back wall of the ladle (refractory lining) */}
      <ellipse cx={LADLE_X} cy={RIM_Y} rx={RIM_RX} ry={RIM_RY} fill="#B5643C" stroke={C.ink} strokeWidth={4} />
      <ellipse cx={LADLE_X} cy={RIM_Y + 6} rx={SURF_RX} ry={SURF_RY} fill={`url(#${id}-surf)`} />
      {/* crust flecks drifting slowly */}
      {Array.from({length: 9}).map((_, i) => {
        const a = rand(i * 7 + 3) * Math.PI * 2 + frame * 0.004 * (i % 2 ? 1 : -1);
        const r = 0.35 + 0.5 * rand(i * 13 + 1);
        const x = LADLE_X + Math.cos(a) * SURF_RX * r;
        const y = RIM_Y + 6 + Math.sin(a) * SURF_RY * r;
        return <ellipse key={i} cx={x} cy={y} rx={10 + 8 * rand(i)} ry={3 + 2 * rand(i + 5)} fill={STEEL.crust} opacity={0.35 + 0.1 * shimmer(i)} />;
      })}
      {/* entry ripple */}
      {ripple >= 0 && ripple < 1 && (
        <g>
          <ellipse cx={rippleX} cy={RIM_Y + 6} rx={30 + 170 * ripple} ry={(30 + 170 * ripple) * (SURF_RY / SURF_RX)} fill="none" stroke={STEEL.hot} strokeWidth={10 * (1 - ripple)} opacity={1 - ripple} />
          <ellipse cx={rippleX} cy={RIM_Y + 6} rx={20 + 110 * ripple} ry={(20 + 110 * ripple) * (SURF_RY / SURF_RX)} fill="none" stroke={STEEL.edge} strokeWidth={6 * (1 - ripple)} opacity={0.8 * (1 - ripple)} />
        </g>
      )}
    </svg>
  );
};

/** Front of the ladle: the outer shell, rim lip, trunnions and the stand. Draw after the robot to occlude it. */
export const LadleFront: React.FC<{id: string}> = ({id}) => {
  const top = RIM_Y;
  const botY = FLOOR_Y - 120;
  const wTop = RIM_RX + 8;
  const wBot = RIM_RX - 40;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}-shell`} x1={LADLE_X - wTop} x2={LADLE_X + wTop} y1={0} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={STEEL.shellDark} />
          <stop offset="0.35" stopColor={STEEL.shellLight} />
          <stop offset="0.7" stopColor={STEEL.shell} />
          <stop offset="1" stopColor={STEEL.shellDark} />
        </linearGradient>
      </defs>
      {/* stand */}
      <path d={`M ${LADLE_X - 250} ${FLOOR_Y - 30} L ${LADLE_X - 200} ${botY + 20} L ${LADLE_X + 200} ${botY + 20} L ${LADLE_X + 250} ${FLOOR_Y - 30} Z`} fill="#6F6A62" stroke={C.ink} strokeWidth={4} />
      {/* shell: front half below the rim line */}
      <path d={`M ${LADLE_X - wTop} ${top} A ${wTop} ${RIM_RY + 4} 0 0 0 ${LADLE_X + wTop} ${top} L ${LADLE_X + wBot} ${botY} Q ${LADLE_X} ${botY + 46} ${LADLE_X - wBot} ${botY} Z`} fill={`url(#${id}-shell)`} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      {/* reinforcing bands */}
      {[0.32, 0.68].map((k) => {
        const y = top + (botY - top) * k;
        const w = wTop + (wBot - wTop) * k;
        return <path key={k} d={`M ${LADLE_X - w} ${y} Q ${LADLE_X} ${y + 40} ${LADLE_X + w} ${y}`} fill="none" stroke={C.ink} strokeWidth={4} opacity={0.6} />;
      })}
      {/* rim lip (front arc) */}
      <path d={`M ${LADLE_X - RIM_RX - 10} ${top} A ${RIM_RX + 10} ${RIM_RY + 8} 0 0 0 ${LADLE_X + RIM_RX + 10} ${top}`} fill="none" stroke={C.ink} strokeWidth={18} />
      <path d={`M ${LADLE_X - RIM_RX - 10} ${top} A ${RIM_RX + 10} ${RIM_RY + 8} 0 0 0 ${LADLE_X + RIM_RX + 10} ${top}`} fill="none" stroke={STEEL.shellLight} strokeWidth={10} />
      {/* trunnions */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={LADLE_X + s * (wTop - 6) - (s < 0 ? 40 : 0)} y={top + 70} width={40} height={36} rx={6} fill={STEEL.shellDark} stroke={C.ink} strokeWidth={4} />
          <circle cx={LADLE_X + s * (wTop + 30)} cy={top + 88} r={26} fill={STEEL.shellLight} stroke={C.ink} strokeWidth={4} />
        </g>
      ))}
    </svg>
  );
};

/** Glowing slag droplets thrown up at an entry, deterministic. t = frames since entry. */
export const Splash: React.FC<{x: number; y: number; t: number; n?: number; seed?: number; scale?: number}> = ({x, y, t, n = 14, seed = 1, scale = 1}) => {
  if (t < 0 || t > 40) return null;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', overflow: 'visible'}}>
      {Array.from({length: n}).map((_, i) => {
        const a = -Math.PI / 2 + (rand(seed * 31 + i) - 0.5) * 1.9;
        const v = (7 + 9 * rand(seed * 17 + i)) * scale;
        const px = x + Math.cos(a) * v * t;
        const py = y + Math.sin(a) * v * t + 0.55 * t * t * scale;
        const r = (5 + 6 * rand(seed * 5 + i)) * scale * Math.max(0, 1 - t / 40);
        if (py > y + 30) return null;
        return <circle key={i} cx={px} cy={py} r={r} fill={i % 3 === 0 ? STEEL.hot : STEEL.core} stroke={STEEL.edge} strokeWidth={2} />;
      })}
    </svg>
  );
};

/** Rising heat haze: a few soft translucent ribbons above the ladle (no full-screen filters, no striping). */
export const Heat: React.FC<{frame: number; x?: number; y?: number; w?: number; opacity?: number}> = ({frame, x = LADLE_X, y = RIM_Y - 30, w = 380, opacity = 1}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', overflow: 'visible'}} opacity={opacity}>
    {Array.from({length: 5}).map((_, i) => {
      const ph = (frame * 1.6 + i * 47) % 240;
      const yy = y - ph;
      const xx = x - w / 2 + (i + 0.5) * (w / 5) + Math.sin((frame + i * 20) / 18) * 14;
      const op = Math.sin((ph / 240) * Math.PI) * 0.35;
      return <path key={i} d={`M ${xx} ${yy + 60} Q ${xx + 18} ${yy + 30} ${xx} ${yy} Q ${xx - 18} ${yy - 30} ${xx} ${yy - 60}`} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={op} />;
    })}
  </svg>
);
