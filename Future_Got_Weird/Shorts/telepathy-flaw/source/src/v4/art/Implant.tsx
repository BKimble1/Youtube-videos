// V4 implant: one circular flush disc, drawn the same way everywhere it appears.
//  - Implant4: the small disc on the sender's hair (head space of Head4, an overlay), foreshortened with the yaw;
//  - ImplantMacro: the opening/closing macro: the disc seated in the scalp, with its subdermal neural ring.
// The core colour goes from cyan (normal) toward red (`uneasy` 0..1).
import React from 'react';
import {INK} from '../../lib/ink';
import {lit, mix, shade} from '../../lib/color';
import {fmt} from '../../lib/math';
import {Glow} from '../../lib/shade';

export const CYAN = '#46CFFF';
export const RED = '#EF3340';
export const BLUE = '#2D5FE0';
export const BLUE_D = '#173FA8';

/** small disc on the hair: head space (head radius 100), at the front of the crown */
export const Implant4: React.FC<{yaw: number; glow: number; color: string; f: number}> = ({yaw, glow, color, f}) => {
  const th = (yaw * Math.PI) / 180;
  const cs = Math.cos(th);
  const x = -98 * Math.sin(th);
  const y = -84;
  const sx = Math.max(0.16, cs);
  const pulse = 0.75 + 0.25 * Math.sin(f * 0.35);
  // the disc is drawn as a circle in its own plane (radius 20 head units) and squeezed by the yaw
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(sx)} 1)`}>
      <circle cx={0} cy={0} r={21.5} fill={INK} />
      <circle cx={0} cy={0} r={20} fill={BLUE} />
      <circle cx={0} cy={0} r={20} fill={BLUE_D} opacity={0.35} />
      {Array.from({length: 8}, (_, i) => (
        <circle key={i} cx={fmt(17.2 * Math.cos(((i * 45 + 22.5) * Math.PI) / 180))} cy={fmt(17.2 * Math.sin(((i * 45 + 22.5) * Math.PI) / 180))} r={1.5} fill={lit(BLUE, 0.55)} />
      ))}
      <circle cx={0} cy={0} r={15.2} fill="#0A1A40" stroke={INK} strokeWidth={0.8} />
      <circle cx={0} cy={0} r={13.6} fill="#10285E" stroke="#9AF0FF" strokeWidth={0.7} />
      {Array.from({length: 8}, (_, i) => (
        <path key={i} d={`M${fmt(4.6 * Math.cos((i * 45 * Math.PI) / 180))},${fmt(4.6 * Math.sin((i * 45 * Math.PI) / 180))} L${fmt(11 * Math.cos(((i * 45 + (i % 2 ? 7 : -7)) * Math.PI) / 180))},${fmt(11 * Math.sin(((i * 45 + (i % 2 ? 7 : -7)) * Math.PI) / 180))}`} stroke="#9AF0FF" strokeWidth={0.6} strokeLinecap="round" opacity={0.7} />
      ))}
      <circle cx={0} cy={0} r={4 + 0.5 * pulse} fill={color} opacity={0.4 + 0.6 * glow * pulse} />
      <circle cx={0} cy={0} r={2} fill="#FFFFFF" opacity={0.9} />
      <path d="M-11,-8 A13.6 13.6 0 0 1 -3,-13" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.28} />
      <Glow id={`im4-${Math.round(yaw)}`} c={{x: 0, y: 0}} r={52 * glow + 14} color={color} alpha={0.5 * glow * pulse} />
    </g>
  );
};

const polar = (r: number, a: number, cx = 540, cy = 790) => ({x: cx + r * Math.cos((a * Math.PI) / 180), y: cy + r * Math.sin((a * Math.PI) / 180)});

/** The macro: the disc in the scalp. Centre (540, 790), outer radius 330. `uneasy` tints the core and the pulses red;
 *  `pulses` are the start times (s) of expanding rings; `t` is the time within the shot. */
export const ImplantMacro: React.FC<{t: number; f: number; uneasy: number; pulses: (number | [number, number])[]; zoom?: number}> = ({t, f, uneasy, pulses, zoom = 1}) => {
  const cx = 540;
  const cy = 790;
  const core = mix(CYAN, RED, uneasy);
  const ring = mix('#9AF0FF', '#FF8A95', uneasy);
  const SKIN = '#F2C9A8';
  // hair swirling round the disc (a crown whorl): short thick strands lying tangentially, in three rings
  const hairs = Array.from({length: 96}, (_, i) => {
    const ring = i % 3;
    const a = (i / 96) * 360 * 1.0 + ring * 9;
    const r0 = 372 + ring * 86 + ((i * 37) % 30);
    const len = 70 + ((i * 53) % 50) + ring * 12;
    const p0 = polar(r0, a, cx, cy);
    const dirA = ((a + 70) * Math.PI) / 180;
    const p1 = {x: p0.x + Math.cos(dirA) * len, y: p0.y + Math.sin(dirA) * len};
    const pc = {x: p0.x + Math.cos(dirA - 0.35) * len * 0.55, y: p0.y + Math.sin(dirA - 0.35) * len * 0.55};
    return {d: `M${fmt(p0.x)},${fmt(p0.y)} Q${fmt(pc.x)},${fmt(pc.y)} ${fmt(p1.x)},${fmt(p1.y)}`, ring};
  });
  return (
    <g transform={`translate(${cx} ${cy}) scale(${zoom.toFixed(5)}) translate(${-cx} ${-cy})`}>
      <defs>
        <radialGradient id="mc-skin" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={1250} fx={cx - 260} fy={cy - 380}>
          <stop offset="0" stopColor={lit(SKIN, 0.3)} />
          <stop offset="0.35" stopColor={SKIN} />
          <stop offset="0.8" stopColor={shade(SKIN, 0.22)} />
          <stop offset="1" stopColor={shade(SKIN, 0.4)} />
        </radialGradient>
        <radialGradient id="mc-bez" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={330} fx={cx - 120} fy={cy - 170}>
          <stop offset="0" stopColor="#5E8BFF" />
          <stop offset="0.7" stopColor={BLUE} />
          <stop offset="1" stopColor={BLUE_D} />
        </radialGradient>
        <radialGradient id="mc-lens" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={240} fx={cx - 60} fy={cy - 80}>
          <stop offset="0" stopColor="#1B3A7E" />
          <stop offset="0.6" stopColor="#10285E" />
          <stop offset="1" stopColor="#0A1A40" />
        </radialGradient>
        <radialGradient id="mc-core">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.25" stopColor={core} />
          <stop offset="1" stopColor={core} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* scalp */}
      <rect x={-300} y={-300} width={1680} height={2520} fill="url(#mc-skin)" />
      {/* hair roots and short blades around the disc */}
      {hairs.map((h, i) => (
        <g key={i}>
          <path d={h.d} stroke="#7E2218" strokeWidth={15 - h.ring * 2} strokeLinecap="round" fill="none" opacity={0.55} />
          <path d={h.d} stroke={['#C0392B', '#B5301F', '#D6503F'][h.ring]} strokeWidth={10 - h.ring * 1.5} strokeLinecap="round" fill="none" />
          <path d={h.d} stroke="#FF9A86" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.55} transform="translate(-2 -2)" />
        </g>
      ))}
      {/* a few long red hair blades from the frame edges (the crown) */}
      {[
        [-40, 120, 210, 40, 320],
        [1120, 200, 880, 120, 300],
        [-30, 1560, 190, 1480, 340],
        [1110, 1500, 860, 1430, 320],
        [300, -40, 380, 160, 160],
        [800, -40, 740, 170, 150],
      ].map(([x0, y0, x1, y1, w], i) => (
        <path key={i} d={`M${x0},${y0} Q${(x0 + x1) / 2 + 30},${(y0 + y1) / 2 - 30} ${x1},${y1}`} stroke={['#C0392B', '#A83225', '#D6503F'][i % 3]} strokeWidth={w / 6} strokeLinecap="round" fill="none" opacity={0.95} />
      ))}
      {/* subdermal neural ring and threads (under the skin, faint) */}
      <g opacity={0.5}>
        {[392, 456, 530, 620].map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="#6FA8FF" strokeOpacity={0.32 - i * 0.05} strokeWidth={3} strokeDasharray={i % 2 ? '14 18' : undefined} />
        ))}
        {Array.from({length: 16}, (_, i) => {
          const a = i * 22.5 + 8;
          const p0 = polar(340, a, cx, cy);
          const p1 = polar(430 + (i % 3) * 50, a + (i % 2 ? 6 : -6), cx, cy);
          const p2 = polar(600, a + (i % 2 ? 10 : -10), cx, cy);
          return <path key={i} d={`M${fmt(p0.x)},${fmt(p0.y)} Q${fmt(p1.x)},${fmt(p1.y)} ${fmt(p2.x)},${fmt(p2.y)}`} stroke="#6FA8FF" strokeOpacity={0.35} strokeWidth={3} fill="none" />;
        })}
        {Array.from({length: 16}, (_, i) => {
          const p = polar(430 + (i % 3) * 50, i * 22.5 + 8 + (i % 2 ? 6 : -6) * 0.5, cx, cy);
          return <circle key={i} cx={p.x} cy={p.y} r={7} fill="#9CC2FF" opacity={0.6} />;
        })}
      </g>
      {/* pulses: expanding rings */}
      {pulses.map((pp, i) => {
        const p0 = Array.isArray(pp) ? pp[0] : pp;
        const k = (t - p0) / (Array.isArray(pp) ? pp[1] : 0.9);
        if (k < 0 || k > 1) return null;
        const r = 330 + 330 * k;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={ring} strokeWidth={10 * (1 - k) + 2} opacity={0.75 * (1 - k)} />;
      })}
      {/* shadow of the disc on the skin */}
      <ellipse cx={cx + 16} cy={cy + 26} rx={350} ry={346} fill="#7A4630" opacity={0.28} />
      {/* bezel */}
      <circle cx={cx} cy={cy} r={330} fill={INK} />
      <circle cx={cx} cy={cy} r={322} fill="url(#mc-bez)" />
      <path d={`M${fmt(polar(300, 200).x)},${fmt(polar(300, 200).y)} A300 300 0 0 1 ${fmt(polar(300, 290).x)},${fmt(polar(300, 290).y)}`} stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" fill="none" opacity={0.55} />
      {/* rivets */}
      {Array.from({length: 8}, (_, i) => {
        const p = polar(296, i * 45 + 22.5);
        return <circle key={i} cx={p.x} cy={p.y} r={11} fill={lit(BLUE, 0.55)} stroke={INK} strokeWidth={3} />;
      })}
      {/* groove and lens */}
      <circle cx={cx} cy={cy} r={262} fill="#0A1A40" stroke={INK} strokeWidth={5} />
      <circle cx={cx} cy={cy} r={236} fill="url(#mc-lens)" stroke={ring} strokeWidth={6} strokeOpacity={0.9} />
      {/* the circuit: eight radial traces and a ring of electrode pads */}
      {Array.from({length: 8}, (_, i) => {
        const p0 = polar(80, i * 45);
        const p1 = polar(190, i * 45 + (i % 2 ? 7 : -7));
        const p2 = polar(214, i * 45 + (i % 2 ? 7 : -7));
        return (
          <g key={i}>
            <path d={`M${fmt(p0.x)},${fmt(p0.y)} L${fmt(p1.x)},${fmt(p1.y)}`} stroke={ring} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
            <circle cx={p2.x} cy={p2.y} r={12} fill={core} opacity={0.9} />
            <circle cx={p2.x} cy={p2.y} r={5} fill="#FFFFFF" opacity={0.9} />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={150} fill="none" stroke={ring} strokeWidth={3} opacity={0.5} strokeDasharray="8 14" />
      <Glow id="mc-glow" c={{x: cx, y: cy}} r={170} color={core} alpha={0.9} />
      <circle cx={cx} cy={cy} r={70 + 5 * Math.sin(f * 0.3)} fill="url(#mc-core)" />
      <circle cx={cx} cy={cy} r={34} fill="#FFFFFF" opacity={0.9} />
      {/* status LED */}
      <circle cx={polar(300, -62).x} cy={polar(300, -62).y} r={13} fill={mix('#8CFFB5', RED, uneasy)} stroke={INK} strokeWidth={3} />
      {/* glossy streak over the lens */}
      <path d={`M${fmt(polar(210, 205).x)},${fmt(polar(210, 205).y)} A210 210 0 0 1 ${fmt(polar(210, 262).x)},${fmt(polar(210, 262).y)}`} stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" fill="none" opacity={0.28} />
    </g>
  );
};
