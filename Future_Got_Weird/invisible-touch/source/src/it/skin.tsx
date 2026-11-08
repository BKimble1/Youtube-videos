// A local cutaway of the index fingertip, opened in place on the pad where the focus lands (no cut to another view).
// Schematic but plausible anatomy, outside -> in: epidermis with friction ridges; dermis with papillae, Meissner
// corpuscles in the papillae tips (light touch / flutter) and Merkel discs at the epidermal base (pressure);
// subcutaneous fat with a Pacinian corpuscle (vibration); nerve fibres running back toward the hand. The receptors
// light up with the modulated pressure and a signal runs up the fibres.
// Local frame: origin on the pad surface, +x along the finger toward the tip, +y into the finger.
import React from 'react';
import {INK} from '../dc/ink';
import {CYAN} from './fx';

type Props = {
  /** pad surface point, finger axis angle (deg) */
  at: {x: number; y: number};
  ang: number;
  /** window radius (figure units) */
  R: number;
  /** reveal 0..1 */
  open: number;
  /** receptor activation 0..1 (already modulated) */
  act: number;
  /** time, for the nerve signal */
  t: number;
  ink: number;
  id: string;
  /** flip so +y points into the finger */
  flip?: boolean;
};

export const SkinSection: React.FC<Props> = ({at, ang, R, open, act, t, ink, id, flip}) => {
  if (open <= 0.001) return null;
  const u = R / 4.2; // layer unit
  const r = R * (0.15 + 0.85 * open);
  const cy = R * 0.5;
  const epi = 0.75 * u, derm = 2.3 * u;
  const ridges = Array.from({length: 13}, (_, i) => -R * 1.05 + i * (2.1 * R / 12));
  const pap = (x: number) => epi + 0.22 * u * Math.cos(((x + R) / (0.95 * u)) * Math.PI * 2);
  const papD = (() => {
    let d = `M${-R * 1.2},${pap(-R * 1.2)}`;
    for (let x = -R * 1.2; x <= R * 1.2; x += u * 0.08) d += ` L${x.toFixed(2)},${pap(x).toFixed(2)}`;
    return d;
  })();
  const surf = (() => {
    let d = `M${-R * 1.2},0`;
    for (let x = -R * 1.2; x <= R * 1.2; x += u * 0.06) d += ` L${x.toFixed(2)},${(-0.08 * u * Math.cos(((x + R) / (0.48 * u)) * Math.PI * 2)).toFixed(2)}`;
    return d;
  })();
  const epiD = (() => {
    const top: string[] = [], bot: string[] = [];
    for (let x = -R * 1.2; x <= R * 1.2 + 1e-6; x += u * 0.06) {
      top.push(`${x.toFixed(2)},${(-0.08 * u * Math.cos(((x + R) / (0.48 * u)) * Math.PI * 2)).toFixed(2)}`);
      bot.push(`${x.toFixed(2)},${pap(x).toFixed(2)}`);
    }
    return `M${top.join(' L')} L${bot.reverse().join(' L')} Z`;
  })();
  const meiss = [-2.85, -0.95, 0.95, 2.85].map((k) => k * u);
  const merkel = [-3.8, -1.9, 0, 1.9, 3.8].map((k) => k * u);
  const glow = (a: number) => 0.25 + 0.75 * a;
  // nerve fibres: from each receptor down into the dermis, then back along the finger (-x)
  const fib = (x: number, y: number, k: number) => `M${x.toFixed(2)},${y.toFixed(2)} C${x.toFixed(2)},${(y + 0.9 * u).toFixed(2)} ${(x - 0.6 * u).toFixed(2)},${(2.9 * u + k * 0.12 * u).toFixed(2)} ${(-R * 1.3).toFixed(2)},${(3.2 * u + k * 0.15 * u).toFixed(2)}`;
  const sig = (k: number) => ((t * 1.6 + k * 0.23) % 1);
  return (
    <g transform={`translate(${at.x.toFixed(2)} ${at.y.toFixed(2)}) rotate(${ang.toFixed(2)})${flip ? ' scale(1 -1)' : ''}`}>
      <defs>
        <clipPath id={`${id}-cl`}>
          <circle cx={0} cy={cy} r={r} />
        </clipPath>
        <radialGradient id={`${id}-rg`}>
          <stop offset="0" stopColor="#FFF6C9" />
          <stop offset="1" stopColor="#FFB347" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id}-cl)`}>
        {/* air below the pad stays clear: start at the surface */}
        <rect x={-R * 1.3} y={0} width={R * 2.6} height={R * 2} fill="#F2D27A" />
        {/* subcutaneous fat lobules */}
        {Array.from({length: 7}).map((_, i) => (
          <ellipse key={i} cx={-R + i * (R / 3)} cy={derm + 1.2 * u + (i % 2) * 0.4 * u} rx={0.62 * u} ry={0.42 * u} fill="#F7E09A" stroke="#D8B45A" strokeWidth={ink * 0.3} />
        ))}
        {/* dermis */}
        <path d={`${papD} L${R * 1.2},${derm} L${-R * 1.2},${derm} Z`} fill="#E9A595" />
        <path d={`M${-R * 1.2},${derm} L${R * 1.2},${derm}`} stroke="#C97C6E" strokeWidth={ink * 0.35} />
        {/* epidermis with friction ridges */}
        <path d={epiD} fill="#F7D2BE" />
        <path d={surf} fill="none" stroke={INK} strokeWidth={ink * 0.6} />
        <path d={papD} fill="none" stroke="#B9786A" strokeWidth={ink * 0.35} />
        {/* nerve fibres and the signal travelling along them */}
        {[...meiss.map((x) => ({x, y: epi + 0.25 * u})), ...merkel.map((x) => ({x, y: epi + 0.02 * u})), {x: 0.6 * u, y: derm + 1.2 * u}].map((p, k) => (
          <g key={`n${k}`}>
            <path d={fib(p.x, p.y, k)} fill="none" stroke="#E8C14A" strokeWidth={ink * 0.42} />
            {act > 0.05 && (
              <path d={fib(p.x, p.y, k)} fill="none" stroke="#FFF7C0" strokeWidth={ink * 0.7} strokeDasharray={`${(0.5 * u).toFixed(2)} ${(R * 4).toFixed(2)}`} strokeDashoffset={(-sig(k) * R * 3).toFixed(2)} opacity={act} strokeLinecap="round" />
            )}
          </g>
        ))}
        {/* Meissner corpuscles: small stacked ovals in the papillae tips */}
        {meiss.map((x, k) => (
          <g key={`m${k}`} transform={`translate(${x.toFixed(2)} ${(epi + 0.3 * u).toFixed(2)})`}>
            <circle r={0.75 * u} fill="#FFE27A" opacity={0.55 * act} />
            <ellipse rx={0.22 * u} ry={0.38 * u} fill={`url(#${id}-rg)`} stroke={INK} strokeWidth={ink * 0.35} opacity={glow(act)} />
            <path d={`M${-0.16 * u},${-0.12 * u} L${0.16 * u},${-0.12 * u} M${-0.18 * u},${0.05 * u} L${0.18 * u},${0.05 * u} M${-0.14 * u},${0.2 * u} L${0.14 * u},${0.2 * u}`} stroke="#B9783A" strokeWidth={ink * 0.22} />
          </g>
        ))}
        {/* Merkel discs */}
        {merkel.map((x, k) => (
          <g key={`k${k}`}>
            <circle cx={x} cy={epi - 0.02 * u} r={0.5 * u} fill="#9FF0C8" opacity={0.5 * act} />
            <circle cx={x} cy={epi - 0.02 * u} r={0.13 * u} fill="#5CCB95" stroke={INK} strokeWidth={ink * 0.25} />
          </g>
        ))}
        {/* Pacinian corpuscle: the onion-layered vibration sensor */}
        <g transform={`translate(${(0.6 * u).toFixed(2)} ${(derm + 1.15 * u).toFixed(2)})`}>
          <ellipse rx={1.4 * u} ry={0.9 * u} fill="#FFE27A" opacity={0.45 * act} />
          {[1, 0.78, 0.56, 0.34].map((k, i) => (
            <ellipse key={i} rx={0.95 * u * k} ry={0.52 * u * k} fill={i === 0 ? '#FFF1D6' : 'none'} stroke="#C89A55" strokeWidth={ink * 0.28} opacity={glow(act)} />
          ))}
        </g>
      </g>
      {/* the cut's rim: an explanatory window, drawn in the overlay colour */}
      <circle cx={0} cy={cy} r={r} fill="none" stroke={CYAN} strokeWidth={ink * 0.7} strokeDasharray={`${(ink * 2.4).toFixed(2)} ${(ink * 1.6).toFixed(2)}`} opacity={0.9} />
    </g>
  );
};
