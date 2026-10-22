import React, {useId} from 'react';
import {C} from '../theme';
import {Flame} from './Flame';

// Super Heavy V3 booster, side view as seen from the camera side of the catch (tower to the LEFT).
// Local units 0.1 m; origin = centre of the engine-skirt bottom; top of the hot-stage ring at y = -720 (about 72 m).
// V3: three larger grid fins (reported "T" layout): one faces the camera, one faces away, one points away from the
// tower (right). The near and far fins sit above the catch points the arms land under. Fin layout is approximate.
export const BOOSTER_H = 720;
export const BOOSTER_R = 45;
export const BOOSTER_CATCH_Y = -604; // underside of the catch fitting
export type Burn = 'off' | 'center3' | 'inner13' | 'all33';

export const SuperHeavy: React.FC<{
  burn?: Burn;
  throttle?: number; // 0..1 plume length
  fin?: number; // grid fin deflection, degrees
  t?: number;
  catchPoint?: boolean;
  frost?: number; // 0..1 cryogenic frost on the tank (pad scenes)
  ring?: boolean; // integrated hot-stage ring
}> = ({burn = 'off', throttle = 1, fin = 0, t = 0, catchPoint = true, frost = 0, ring = true}) => {
  const id = useId().replace(/:/g, '');
  const top = ring ? -696 : -700;
  const body = `M -45 ${top} L 45 ${top} L 45 -40 L 47 0 L -47 0 L -45 -40 Z`;
  const finTh = 12 + Math.abs(Math.sin((fin * Math.PI) / 180)) * 26;
  const n = burn === 'center3' ? 1 : burn === 'inner13' ? 3 : burn === 'all33' ? 7 : 0;
  return (
    <g>
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.steel0} />
          <stop offset="0.3" stopColor={C.steel1} />
          <stop offset="0.68" stopColor={C.steel3} />
          <stop offset="0.85" stopColor={C.steel2} />
          <stop offset="1" stopColor={C.steel0} />
        </linearGradient>
        <linearGradient id={`e${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#25282d" />
          <stop offset="0.5" stopColor="#6a6f78" />
          <stop offset="1" stopColor="#202328" />
        </linearGradient>
        <pattern id={`g${id}`} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={8} height={8} fill="#4a525d" />
          <rect x={1.3} y={1.3} width={5.4} height={5.4} fill="#0f1216" />
        </pattern>
        <linearGradient id={`fr${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.2" stopColor="#f3f7fb" stopOpacity={0.85} />
          <stop offset="0.9" stopColor="#e8eef5" stopOpacity={0.8} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* plumes */}
      {n > 0 &&
        Array.from({length: n}, (_, i) => {
          const x = n === 1 ? 0 : (i - (n - 1) / 2) * (n === 3 ? 13 : 12.5);
          const L = (n === 7 ? 330 : n === 3 ? 260 : 220) * throttle * (1 - Math.abs(x) / 160);
          return (
            <g key={i} transform={`translate(${x} 14)`}>
              <Flame len={L} w={n === 1 ? 18 : 15} t={t} seed={i + 4} opacity={n === 7 ? 0.8 : 0.95} />
            </g>
          );
        })}
      {/* outer-ring engine bells visible below the skirt */}
      {[-39, -26, -13, 0, 13, 26, 39].map((x, i) => (
        <path key={x} d={`M ${x - 5} -2 L ${x + 5} -2 L ${x + 6.5} 13 L ${x - 6.5} 13 Z`} fill={`url(#e${id})`} stroke="#121418" strokeWidth={0.8} opacity={i % 2 ? 0.85 : 1} />
      ))}
      {/* body */}
      <path d={body} fill={`url(#b${id})`} stroke="#2b2f36" strokeWidth={1.2} />
      {Array.from({length: 36}, (_, i) => (
        <line key={i} x1={-45} x2={45} y1={-40 - i * 18} y2={-40 - i * 18} stroke="#000" strokeOpacity={0.09} strokeWidth={0.8} />
      ))}
      <rect x={-47} y={-40} width={94} height={40} fill="#000" opacity={0.18} />
      {/* chine running down the left side */}
      <rect x={-48} y={-560} width={4} height={500} fill={C.steel0} opacity={0.8} />
      {frost > 0 && <rect x={-45} y={-560} width={90} height={500} fill={`url(#fr${id})`} opacity={frost} />}
      {/* integrated hot-stage ring: vented band at the top */}
      {ring && (
        <g>
          <rect x={-46} y={-722} width={92} height={28} fill="#30353d" stroke="#1d2026" />
          {Array.from({length: 9}, (_, i) => (
            <rect key={i} x={-41 + i * 9.5} y={-717} width={6} height={18} rx={1.5} fill="#0e1014" />
          ))}
          <rect x={-46} y={-723} width={92} height={3} fill={C.steel2} />
        </g>
      )}
      {/* grid fin pointing away from the tower (seen edge-on) */}
      <g>
        <rect x={45} y={-648 - finTh / 2} width={66} height={finTh} rx={2} fill="#2c3139" stroke="#15181d" />
        {Array.from({length: 8}, (_, i) => (
          <line key={i} x1={50 + i * 8} x2={50 + i * 8} y1={-648 - finTh / 2} y2={-648 + finTh / 2} stroke="#596270" strokeWidth={1} />
        ))}
        <rect x={42} y={-656} width={8} height={16} rx={2} fill={C.steel1} />
      </g>
      {/* grid fin facing the camera, with its actuator fairing and the catch fitting below it */}
      <g>
        <rect x={-7} y={-680} width={14} height={64} rx={3} fill={C.steel1} stroke="#2b2f36" />
        <g transform={`translate(0 -648) scale(${Math.cos((fin * Math.PI) / 180)} 1)`}>
          <rect x={-36} y={-26} width={72} height={52} rx={2} fill={`url(#g${id})`} stroke="#15181d" strokeWidth={2.5} />
          <rect x={-36} y={-26} width={72} height={52} rx={2} fill="none" stroke="#6b7684" strokeWidth={1.2} />
          <line x1={-36} y1={0} x2={36} y2={0} stroke="#6b7684" strokeWidth={1.4} />
        </g>
        {catchPoint && (
          <g>
            <path d={`M -14 -620 L 14 -620 L 17 ${BOOSTER_CATCH_Y} L -17 ${BOOSTER_CATCH_Y} Z`} fill={C.accent} stroke="#5a3a00" strokeWidth={1} />
            <rect x={-17} y={BOOSTER_CATCH_Y - 3} width={34} height={3} fill="#5a3a00" opacity={0.6} />
          </g>
        )}
      </g>
    </g>
  );
};
