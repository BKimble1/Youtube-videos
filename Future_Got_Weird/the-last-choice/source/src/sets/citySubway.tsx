// Subway: the street entrance (back + front so a figure can climb out between them), a stalled station platform with
// a train, and the manual roll-up steel gate. Side view.
//
// SubwayEntranceBack / SubwayEntranceFront: the stair mouth spans x … x + 760 on the far sidewalk (stairs descend
// toward −x). Draw Back, then the climbing figure, then Front: Front repaints the curb/asphalt strip down to y = +300 over
// the mouth and the stone-and-iron railing, so a figure whose feet are below y ≈ −100 is hidden below the sidewalk.
// subwayClimb(u) gives the foot point for climbing out (u 0 = head hidden … 1 = standing on the sidewalk).
import React from 'react';
import {CITY} from '../theme';
import {rnd, noise, f2, range, polyPath, INK, K, Glow} from './cityKit';

export const ENTRANCE_W = 760;

/** Foot point while climbing out of the entrance at x (u: 0 … 1). Feet go from deep in the stair to the sidewalk. */
export const subwayClimb = (x: number, u: number) => {
  const k = Math.max(0, Math.min(1, u));
  return {x: x + ENTRANCE_W * (0.25 + 0.6 * k), y: 300 - 400 * k};
};
/** Hinge and far end of the lifting grille (world), for a hand to push it. */
export const grillePoints = (x: number, open: number) => {
  const a = (-Math.min(1, open) * 105 * Math.PI) / 180;
  const hx = x + ENTRANCE_W, hy = -100;
  const L = ENTRANCE_W - 40;
  return {hinge: {x: hx, y: hy}, tip: {x: hx - Math.cos(a) * L, y: hy + Math.sin(a) * L}, mid: {x: hx - Math.cos(a) * L * 0.5, y: hy + Math.sin(a) * L * 0.5}};
};

const Lamp: React.FC<{x: number; y: number; ink: number; t: number; lit: number; seed: number}> = ({x, y, ink, t, lit, seed}) => {
  const fl = lit * (0.7 + 0.3 * noise(t * 5, seed));
  return (
    <g>
      <rect x={x - 22} y={y - 640} width={44} height={640} fill={K.greenDark} stroke={INK} strokeWidth={ink} />
      <rect x={x - 46} y={y - 90} width={92} height={90} rx={8} fill={K.green} stroke={INK} strokeWidth={ink} />
      <rect x={x - 38} y={y - 660} width={76} height={34} rx={8} fill={K.green} stroke={INK} strokeWidth={ink} />
      <circle cx={x} cy={y - 735} r={82} fill={fl > 0.1 ? K.globeLit : K.globe} stroke={INK} strokeWidth={ink} opacity={0.95} />
      <path d={`M ${f2(x - 40)} ${f2(y - 770)} Q ${f2(x - 10)} ${f2(y - 800)} ${f2(x + 20)} ${f2(y - 790)}`} stroke="#FFFFFF" strokeWidth={ink * 1.2} fill="none" opacity={0.6} strokeLinecap="round" />
      <rect x={x - 30} y={y - 830} width={60} height={20} rx={6} fill={K.greenDark} stroke={INK} strokeWidth={ink * 0.8} />
      {fl > 0.1 && <Glow id={`gl${seed}_${Math.round(x)}`} cx={x} cy={y - 735} rx={300} ry={300} color="#9FE8A8" op={0.35 * fl} />}
    </g>
  );
};

/** Back of the entrance: far railing, lamps, the dark mouth, and the lifting grille. */
export const SubwayEntranceBack: React.FC<{x: number; t: number; open?: number; ink?: number; lit?: number; seed?: number}> = ({x, t, open = 0, ink = 6, lit = 0.6, seed = 4}) => {
  const W = ENTRANCE_W;
  const g = grillePoints(x, open);
  const bars = range(9).map((i) => i / 8);
  return (
    <g>
      {/* dark stair mouth in the sidewalk, receding steps */}
      <rect x={x} y={-150} width={W} height={84} fill="#0E0A0C" stroke={INK} strokeWidth={ink} />
      {range(4).map((i) => <line key={i} x1={x + 30 + i * 40} y1={-128 + i * 14} x2={x + W - 20} y2={-128 + i * 14} stroke="#2A2226" strokeWidth={ink * 0.8} />)}
      {/* far railing */}
      <rect x={x - 20} y={-420} width={W + 40} height={22} fill={K.greenDark} stroke={INK} strokeWidth={ink * 0.8} />
      {range(10).map((i) => <rect key={i} x={x - 6 + i * (W / 9)} y={-410} width={14} height={270} fill={K.greenDark} />)}
      <Lamp x={x - 40} y={-100} ink={ink} t={t} lit={lit} seed={seed} />
      <Lamp x={x + W + 40} y={-100} ink={ink} t={t} lit={lit * 0.4} seed={seed + 1} />
      {/* the grille: a steel grate hinged at the east end, swings up in the screen plane (face shown ~140 deep) */}
      {(() => {
        const dx = g.tip.x - g.hinge.x, dy = g.tip.y - g.hinge.y, L = Math.hypot(dx, dy) || 1;
        const ux = dx / L, uy = dy / L;
        const nx = uy, ny = -ux; // perpendicular, pointing "up" when the grate lies flat
        const D = 70 + 70 * Math.min(1, open * 1.5);
        const q = (u: number, v: number) => ({x: g.hinge.x + ux * u + nx * v, y: g.hinge.y + uy * u + ny * v});
        const frame = [q(0, -D / 2), q(L, -D / 2), q(L, D / 2), q(0, D / 2)];
        return (
          <g>
            <path d={polyPath(frame)} fill="#1C1A1C" fillOpacity={0.55} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
            <path d={polyPath(frame)} fill="none" stroke={K.steel} strokeWidth={22} strokeLinejoin="round" />
            {bars.map((u, i) => <line key={i} x1={q(u * L, -D / 2).x} y1={q(u * L, -D / 2).y} x2={q(u * L, D / 2).x} y2={q(u * L, D / 2).y} stroke={K.steel} strokeWidth={ink * 1.6} />)}
            <line x1={q(0, 0).x} y1={q(0, 0).y} x2={q(L, 0).x} y2={q(L, 0).y} stroke={K.steelDark} strokeWidth={ink * 1.2} />
            <circle cx={g.hinge.x} cy={g.hinge.y} r={20} fill={K.steelDark} stroke={INK} strokeWidth={ink * 0.7} />
          </g>
        );
      })()}
    </g>
  );
};

/** Front of the entrance: curb/asphalt strip over the stairwell and the near stone-and-iron railing. */
export const SubwayEntranceFront: React.FC<{x: number; ink?: number}> = ({x, ink = 6}) => {
  const W = ENTRANCE_W;
  return (
    <g>
      <rect x={x - 40} y={-70} width={W + 80} height={370} fill={CITY.asphalt} />
      <rect x={x - 40} y={-70} width={W + 80} height={16} fill={K.curb} stroke={INK} strokeWidth={ink * 0.8} />
      <rect x={x - 40} y={-54} width={W + 80} height={34} fill="#2F2A2B" opacity={0.6} />
      {/* stone base + iron railing on the near side */}
      <rect x={x - 30} y={-240} width={W + 60} height={170} fill={K.limestone} stroke={INK} strokeWidth={ink} />
      <rect x={x - 40} y={-252} width={W + 80} height={24} fill={K.stoneLight} stroke={INK} strokeWidth={ink * 0.8} />
      <rect x={x - 20} y={-470} width={W + 40} height={22} fill={K.green} stroke={INK} strokeWidth={ink * 0.8} />
      {range(12).map((i) => <rect key={i} x={x - 6 + i * (W / 11)} y={-460} width={14} height={210} fill={K.green} stroke={INK} strokeWidth={ink * 0.4} />)}
      {range(11).map((i) => <circle key={`c${i}`} cx={x + 30 + i * (W / 11)} cy={-360} r={18} fill="none" stroke={K.green} strokeWidth={ink * 0.9} />)}
    </g>
  );
};

/** A manual roll-up steel gate. (x, y) = centre of the floor line; w × h opening; open 0 … 1. */
export const rollGateBottom = (y: number, h: number, open: number) => y - h * Math.max(0, Math.min(1, open)) * 0.92;
export const RollGate: React.FC<{x: number; y: number; w?: number; h?: number; open: number; ink?: number; t?: number}> = ({x, y, w = 900, h = 760, open, ink = 6}) => {
  const bot = rollGateBottom(y, h, open);
  const slats = range(7).map((i) => bot - ((i + 1) * (bot - (y - h))) / 8);
  return (
    <g>
      <rect x={x - w / 2 - 70} y={y - h - 150} width={w + 140} height={150} rx={20} fill={K.steelDark} stroke={INK} strokeWidth={ink} />
      <rect x={x - w / 2 - 70} y={y - h} width={70} height={h} fill={K.steel} stroke={INK} strokeWidth={ink} />
      <rect x={x + w / 2} y={y - h} width={70} height={h} fill={K.steel} stroke={INK} strokeWidth={ink} />
      <rect x={x - w / 2} y={y - h} width={w} height={bot - (y - h)} fill={K.shutter} stroke={INK} strokeWidth={ink} />
      {slats.map((sy, i) => sy > y - h + 4 && <line key={i} x1={x - w / 2} y1={sy} x2={x + w / 2} y2={sy} stroke={K.shutterDark} strokeWidth={ink * 0.7} />)}
      <rect x={x - w / 2 - 8} y={bot - 34} width={w + 16} height={34} rx={6} fill={K.steelDark} stroke={INK} strokeWidth={ink} />
      <rect x={x - 70} y={bot - 30} width={140} height={20} rx={8} fill="#2A2428" />
    </g>
  );
};

/** Stalled station: tiled wall with a mosaic band (no text), steel columns, platform edge, a train with open doors and a
 *  dim emergency light. Platform floor at y = 0 (local to the subway world); spans x0 … x1. */
export const SubwayInterior: React.FC<{x0: number; x1: number; t: number; trainX?: number; doors?: number; emergency?: number; ink?: number; seed?: number}> = ({x0, x1, t, trainX = 0, doors = 1, emergency = 1, ink = 6, seed = 7}) => {
  const W = x1 - x0;
  const fl = emergency * (0.75 + 0.25 * Math.max(0, noise(t * 6, seed)));
  const carL = 2600;
  const cars = range(Math.ceil(W / carL) + 1).map((i) => trainX + x0 - 200 + i * (carL + 60));
  return (
    <g>
      <rect x={x0} y={-1500} width={W} height={1500} fill={K.tile} />
      <rect x={x0} y={-1080} width={W} height={90} fill="#3E7A58" opacity={0.85} />
      <rect x={x0} y={-1056} width={W} height={20} fill="#C99A3A" opacity={0.7} />
      {range(Math.floor(W / 600)).map((i) => <line key={`tj${i}`} x1={x0 + i * 600} y1={-1500} x2={x0 + i * 600} y2={-990} stroke={K.tileDark} strokeWidth={ink * 0.5} />)}
      {/* emergency lights */}
      {range(Math.ceil(W / 1800)).map((i) => {
        const lx = x0 + 600 + i * 1800;
        return (
          <g key={`em${i}`}>
            <rect x={lx - 60} y={-1300} width={120} height={50} rx={10} fill={fl > 0.3 ? '#FFB86A' : '#6A4A3A'} stroke={INK} strokeWidth={ink} />
            <Glow id={`em${seed}_${i}`} cx={lx} cy={-1200} rx={900} ry={700} color="#FF9A4A" op={0.32 * fl} />
          </g>
        );
      })}
      {/* train cars (behind the platform edge) */}
      {cars.map((cx, i) => (
        <g key={`car${i}`}>
          <rect x={cx} y={-1020} width={carL} height={940} rx={40} fill="#B9BEC2" stroke={INK} strokeWidth={ink} />
          <rect x={cx} y={-560} width={carL} height={40} fill="#6E7A86" />
          {range(4).map((d) => {
            const dx = cx + 260 + d * 620;
            const op = doors * 120;
            return (
              <g key={d}>
                <rect x={dx - op} y={-900} width={240 + op * 2} height={800} fill="#120E10" stroke={INK} strokeWidth={ink * 0.8} />
                <rect x={dx - op} y={-900} width={120} height={800} fill="#9EA4A9" stroke={INK} strokeWidth={ink * 0.8} />
                <rect x={dx + 120 + op} y={-900} width={120} height={800} fill="#9EA4A9" stroke={INK} strokeWidth={ink * 0.8} />
                <rect x={dx + 20 - op} y={-820} width={80} height={220} rx={10} fill="#2A3640" />
                <rect x={dx + 140 + op} y={-820} width={80} height={220} rx={10} fill="#2A3640" />
              </g>
            );
          })}
          {range(3).map((w) => <rect key={`w${w}`} x={cx + 560 + w * 620} y={-860} width={260} height={260} rx={18} fill="#2A3640" stroke={INK} strokeWidth={ink * 0.8} />)}
        </g>
      ))}
      {/* platform */}
      <rect x={x0} y={-80} width={W} height={80} fill="#8C857E" stroke={INK} strokeWidth={ink} />
      <rect x={x0} y={-86} width={W} height={26} fill="#D9B43A" opacity={0.85} />
      <rect x={x0} y={0} width={W} height={600} fill="#6C665F" />
      {/* steel columns in front of the train line */}
      {range(Math.ceil(W / 1400)).map((i) => {
        const cx = x0 + 300 + i * 1400 + rnd(seed + i) * 40;
        return <rect key={`col${i}`} x={cx - 50} y={-1500} width={100} height={1500} fill="#3E6E52" stroke={INK} strokeWidth={ink} />;
      })}
    </g>
  );
};
