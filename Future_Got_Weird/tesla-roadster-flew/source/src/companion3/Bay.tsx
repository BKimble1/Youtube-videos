// The v3 demonstration bay (illustration): a clean hall around the C-ramp, whose lights come up out of the night of
// the footage, and whose back wall is a pair of hangar doors that slide apart onto an outdoor test area. World units
// as the ramp (companion2/Ramp.tsx): floor at y = 0, up is -y.
import React from 'react';
import {C} from '../theme';
import {rnd} from './kit3';

const mix = (a: string, b: string, u: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * u).toString(16).padStart(2, '0')).join('');
};

export const DOOR = {x0: -2700, x1: 1100, top: -1950};

/** Sky and test site seen through the open doors (drawn first). */
export const Outdoors: React.FC<{y0?: number}> = ({y0 = -2600}) => (
  <g>
    <defs>
      <linearGradient id="bayDusk" x1="0" y1={y0} x2="0" y2={0} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#24345A" />
        <stop offset="0.62" stopColor="#5B6E9A" />
        <stop offset="0.9" stopColor="#E9A86A" />
        <stop offset="1" stopColor="#F4C58A" />
      </linearGradient>
    </defs>
    <rect x={-6000} y={y0} width={12000} height={-y0 + 40} fill="url(#bayDusk)" />
    {/* a few soft clouds at different heights */}
    {[[-2400, -1700, 1.3], [-900, -1350, 1], [400, -1850, 1.2], [-1700, -900, 0.8], [900, -1100, 0.9], [-300, -2200, 1.4], [-3200, -1250, 1]].map(([cx, cy, k], i) => (
      <g key={`c${i}`} opacity={0.42}>
        <ellipse cx={cx} cy={cy} rx={260 * k} ry={60 * k} fill="#F2E9F0" />
        <ellipse cx={cx + 110 * k} cy={cy - 38 * k} rx={140 * k} ry={58 * k} fill="#F2E9F0" />
        <ellipse cx={cx - 120 * k} cy={cy - 20 * k} rx={120 * k} ry={46 * k} fill="#F2E9F0" />
      </g>
    ))}
    {/* low hills and the site */}
    <path d="M -6000 -60 C -4800 -150 -4200 -90 -3400 -130 C -2600 -170 -2000 -80 -1200 -120 C -400 -160 400 -90 1300 -140 C 2200 -180 3000 -100 6000 -120 L 6000 40 L -6000 40 Z" fill="#7D6A6A" opacity={0.75} />
    <rect x={-6000} y={-40} width={12000} height={80} fill="#9C8370" />
    {Array.from({length: 18}, (_, i) => (
      <circle key={i} cx={-5200 + i * 600 + rnd(i) * 200} cy={-70 - rnd(i + 7) * 30} r={6} fill="#FFE6B0" opacity={0.8} />
    ))}
    {/* a distant lattice tower */}
    <g stroke="#4C4A5A" strokeWidth={8} fill="none" opacity={0.7}>
      <path d="M -1600 -40 L -1520 -900 L -1440 -40" />
      <path d="M -1580 -300 L -1460 -300 M -1560 -560 L -1480 -560 M -1545 -760 L -1495 -760" />
    </g>
  </g>
);

/** Back wall (two sliding door leaves) and floor. lights: 0 = night, 1 = lit bay. open: 0 = closed, 1 = fully apart. */
export const BayBack: React.FC<{lights: number; open: number}> = ({lights, open}) => {
  const wall = mix('#141B26', '#E8E2D2', lights);
  const wallLine = mix('#1E2735', '#CFC6B0', lights);
  const half = (DOOR.x1 - DOOR.x0) / 2;
  const mid = (DOOR.x0 + DOOR.x1) / 2;
  const shift = open * (half + 120);
  const leaf = (x0: number, w: number, key: string) => (
    <g key={key}>
      <rect x={x0} y={DOOR.top} width={w} height={-DOOR.top} fill={wall} stroke={wallLine} strokeWidth={6} />
      {Array.from({length: Math.floor(w / 240)}, (_, i) => (
        <line key={i} x1={x0 + 120 + i * 240} y1={DOOR.top + 20} x2={x0 + 120 + i * 240} y2={-20} stroke={wallLine} strokeWidth={4} />
      ))}
      <rect x={x0} y={-820} width={w} height={26} fill={mix('#1A2230', '#D9D1BC', lights)} />
      <rect x={x0} y={-150} width={w} height={150} fill={mix('#101620', '#D2C9B2', lights)} />
    </g>
  );
  return (
    <g>
      {open > 0.001 && <Outdoors />}
      {/* fixed wall beyond the door span */}
      <rect x={-7000} y={-2600} width={7000 + DOOR.x0} height={2600} fill={wall} />
      <rect x={DOOR.x1} y={-2600} width={6000} height={2600} fill={wall} />
      <rect x={-7000} y={-2600} width={14000} height={DOOR.top + 2600} fill={wall} />
      {/* door track */}
      <rect x={-7000} y={DOOR.top - 60} width={14000} height={60} fill={mix('#0E141C', '#B9AE96', lights)} />
      {leaf(DOOR.x0 - shift, half, 'l')}
      {leaf(mid + shift, half, 'r')}
      {/* wall lamps */}
      {[-2300, -1500, -700, 100, 900].map((x) => (
        <g key={x}>
          <rect x={x - 46} y={-1460} width={92} height={40} rx={10} fill={mix('#2A3342', '#5C6670', lights)} />
          <ellipse cx={x} cy={-1400} rx={160} ry={90} fill="#FFF3D0" opacity={0.28 * lights} />
          <rect x={x - 36} y={-1432} width={72} height={10} rx={5} fill={mix('#3A4352', '#FFF6DC', lights)} />
        </g>
      ))}
      {/* floor */}
      <rect x={-7000} y={0} width={14000} height={3000} fill={mix('#151A21', '#C3C9CE', lights)} />
      <rect x={-7000} y={0} width={14000} height={8} fill={mix('#232A33', '#9AA3AA', lights)} />
      {Array.from({length: 30}, (_, i) => (
        <line key={i} x1={-6000 + i * 420} y1={70} x2={-6000 + i * 420 - 200} y2={3000} stroke={mix('#1C222A', '#B3BAC0', lights)} strokeWidth={4} />
      ))}
    </g>
  );
};

/** A schematic air-supply dial: no numbers, a needle (0..1), and an optional question mark. Screen or world units. */
export const AirGauge: React.FC<{x: number; y: number; r?: number; level: number; q?: number; label?: string; opacity?: number}> = ({x, y, r = 70, level, q = 0, label = 'air supply', opacity = 1}) => {
  if (opacity <= 0) return null;
  const a0 = 210, a1 = -30; // dial sweep (deg, math convention)
  const ang = ((a0 + (a1 - a0) * Math.max(0, Math.min(1, level))) * Math.PI) / 180;
  const arc = (from: number, to: number, rr: number) => {
    const p = (d: number) => [x + rr * Math.cos((d * Math.PI) / 180), y - rr * Math.sin((d * Math.PI) / 180)];
    const [xa, ya] = p(from), [xb, yb] = p(to);
    return `M ${xa} ${ya} A ${rr} ${rr} 0 ${Math.abs(to - from) > 180 ? 1 : 0} 1 ${xb} ${yb}`;
  };
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={C.cream} stroke={C.ink} strokeWidth={r * 0.08} />
      <path d={arc(a0, 150, r * 0.78)} stroke={C.coral} strokeWidth={r * 0.12} fill="none" />
      <path d={arc(150, a1, r * 0.78)} stroke="#9FB7DE" strokeWidth={r * 0.12} fill="none" />
      {[210, 170, 130, 90, 50, 10, -30].map((d) => {
        const c = Math.cos((d * Math.PI) / 180), s = Math.sin((d * Math.PI) / 180);
        return <line key={d} x1={x + c * r * 0.6} y1={y - s * r * 0.6} x2={x + c * r * 0.68} y2={y - s * r * 0.68} stroke={C.ink} strokeWidth={r * 0.04} />;
      })}
      <line x1={x} y1={y} x2={x + Math.cos(ang) * r * 0.66} y2={y - Math.sin(ang) * r * 0.66} stroke={C.ink} strokeWidth={r * 0.07} strokeLinecap="round" />
      <circle cx={x} cy={y} r={r * 0.09} fill={C.ink} />
      {q > 0 && <text x={x} y={y + r * 0.62} textAnchor="middle" fontFamily='"Fredoka Variable", "Fredoka", system-ui' fontWeight={700} fontSize={r * 0.5} fill={C.coralDeep} opacity={q}>?</text>}
      {label && <text x={x} y={y + r * 1.42} textAnchor="middle" fontFamily='"Nunito Variable", "Nunito", system-ui' fontWeight={800} fontSize={r * 0.34} fill={C.ink}>{label}</text>}
    </g>
  );
};
