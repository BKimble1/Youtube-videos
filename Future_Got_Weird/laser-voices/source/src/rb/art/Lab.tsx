// The demonstration room: a dark teal / deep blue interior with directional overhead light, quiet architecture (wall
// panels, a glowing cove strip, a glass partition, a few instrument racks) and a reflective floor. Drawn for each camera
// angle the film uses: the side view (the 8 ft measure), the view from behind the emitter down the beam, the reverse
// view toward the operator (a night window), and soft out-of-focus backdrops for the close-ups.
import React from 'react';
import {lit, mix, shade} from '../lib/color';
import {clamp, fmt, hash, lerp} from '../lib/math';

export const ROOM = {
  wallTop: '#0F2F3B',
  wall: '#14404D',
  wallLow: '#0E3440',
  panel: '#17485A',
  seam: '#0A2731',
  cove: '#55E3D3',
  floorFar: '#174450',
  floorNear: '#0A222A',
  lightWarm: '#FFE9C4',
  lightCool: '#BFF4F0',
  tape: '#F2C14E',
};

/** A pendant fixture with its directional cone of light and the pool it throws on the floor. */
export const LightCone: React.FC<{id: string; x: number; top: number; floor: number; w0: number; w1: number; color?: string; alpha?: number; poolRy?: number}> = ({id, x, top, floor, w0, w1, color = ROOM.lightWarm, alpha = 0.22, poolRy}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-c`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity={alpha} />
        <stop offset="0.7" stopColor={color} stopOpacity={alpha * 0.35} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </linearGradient>
      <radialGradient id={`${id}-p`}>
        <stop offset="0" stopColor={color} stopOpacity={alpha * 1.3} />
        <stop offset="0.6" stopColor={color} stopOpacity={alpha * 0.5} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <path d={`M${fmt(x - w0)},${fmt(top)} L${fmt(x + w0)},${fmt(top)} L${fmt(x + w1)},${fmt(floor)} L${fmt(x - w1)},${fmt(floor)} Z`} fill={`url(#${id}-c)`} />
    <ellipse cx={fmt(x)} cy={fmt(floor)} rx={fmt(w1 * 1.15)} ry={fmt(poolRy ?? w1 * 0.16)} fill={`url(#${id}-p)`} />
    {/* the fixture itself */}
    <path d={`M${fmt(x - w0 * 1.25)},${fmt(top)} L${fmt(x - w0 * 0.8)},${fmt(top - 22)} L${fmt(x + w0 * 0.8)},${fmt(top - 22)} L${fmt(x + w0 * 1.25)},${fmt(top)} Z`} fill="#22343F" />
    <line x1={fmt(x)} y1={fmt(top - 22)} x2={fmt(x)} y2={fmt(top - 400)} stroke="#22343F" strokeWidth={3} />
    <rect x={fmt(x - w0 * 1.2)} y={fmt(top - 3)} width={fmt(w0 * 2.4)} height={6} rx={3} fill={color} opacity={0.95} />
  </g>
);

/** Soft dust motes drifting in a light cone (subtle life in a held frame). */
export const Motes: React.FC<{x: number; top: number; floor: number; w: number; t: number; n?: number; seed?: number; color?: string}> = ({x, top, floor, w, t, n = 14, seed = 1, color = '#FFF4DE'}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const u = (hash(i, seed) + t * (0.02 + 0.03 * hash(i, seed + 1))) % 1;
      const y = lerp(top + 40, floor - 20, u);
      const half = lerp(w * 0.25, w, (y - top) / (floor - top));
      const xx = x + (hash(i, seed + 2) * 2 - 1) * half * 0.8 + Math.sin(t * 0.7 + i) * 6;
      return <circle key={i} cx={fmt(xx)} cy={fmt(y)} r={fmt(1.2 + 1.6 * hash(i, seed + 3))} fill={color} opacity={0.18 + 0.25 * Math.sin(Math.PI * u)} />;
    })}
  </g>
);

/** The side-view room (angle A). x0..x1 is the drawn span, floorY the floor line at the subject plane. */
export const RoomSide: React.FC<{id: string; t: number; x0: number; x1: number; floorY: number; ceilY: number}> = ({id, t, x0, x1, floorY, ceilY}) => {
  const W = x1 - x0;
  const panelW = 230;
  const panels = Math.ceil(W / panelW) + 1;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ROOM.wallTop} />
          <stop offset="0.55" stopColor={ROOM.wall} />
          <stop offset="1" stopColor={ROOM.wallLow} />
        </linearGradient>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ROOM.floorFar} />
          <stop offset="1" stopColor={ROOM.floorNear} />
        </linearGradient>
        <linearGradient id={`${id}-cv`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ROOM.cove} stopOpacity={0} />
          <stop offset="0.5" stopColor={ROOM.cove} stopOpacity={0.35} />
          <stop offset="1" stopColor={ROOM.cove} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={x0} y={ceilY - 600} width={W} height={floorY - ceilY + 600} fill={`url(#${id}-w)`} />
      {/* wall panels with seams, a skirting line, the cove strip */}
      {Array.from({length: panels}, (_, i) => {
        const px = x0 + i * panelW;
        return (
          <g key={i}>
            <rect x={px + 6} y={ceilY + 120} width={panelW - 12} height={floorY - ceilY - 180} rx={6} fill={ROOM.panel} opacity={0.55} />
            <line x1={px} y1={ceilY + 110} x2={px} y2={floorY - 50} stroke={ROOM.seam} strokeWidth={4} />
          </g>
        );
      })}
      <rect x={x0} y={ceilY + 70} width={W} height={60} fill={`url(#${id}-cv)`} />
      <rect x={x0} y={ceilY + 98} width={W} height={4} fill={ROOM.cove} opacity={0.8} />
      <rect x={x0} y={floorY - 50} width={W} height={50} fill={shade(ROOM.wallLow, 0.3)} />
      {/* a glass partition with a soft glow behind it */}
      <g opacity={0.9}>
        <rect x={x0 + W * 0.42} y={ceilY + 160} width={W * 0.22} height={floorY - ceilY - 240} rx={4} fill="#1C5868" opacity={0.6} />
        <rect x={x0 + W * 0.42} y={ceilY + 160} width={W * 0.22} height={floorY - ceilY - 240} rx={4} fill="none" stroke="#3E8796" strokeWidth={3} opacity={0.6} />
        <line x1={x0 + W * 0.44} y1={ceilY + 200} x2={x0 + W * 0.5} y2={ceilY + 420} stroke="#FFFFFF" strokeWidth={6} opacity={0.08} />
      </g>
      {/* instrument racks with slowly blinking lights */}
      {[0.08, 0.86].map((fx, k) => {
        const rx = x0 + W * fx;
        return (
          <g key={k}>
            <rect x={rx} y={floorY - 520} width={120} height={470} rx={6} fill="#0C222B" />
            {Array.from({length: 8}, (_, r) => (
              <g key={r}>
                <rect x={rx + 12} y={floorY - 500 + r * 56} width={96} height={42} rx={3} fill="#12313D" />
                <circle cx={rx + 26} cy={floorY - 479 + r * 56} r={4} fill={Math.sin(t * (1.5 + r * 0.4) + r + k) > 0.4 ? '#4FE0C9' : '#1A4C55'} />
                <circle cx={rx + 42} cy={floorY - 479 + r * 56} r={4} fill={Math.sin(t * (1.1 + r * 0.3) + r * 2 + k) > 0.6 ? '#F2C14E' : '#3B3A2A'} />
              </g>
            ))}
          </g>
        );
      })}
      {/* the floor */}
      <rect x={x0} y={floorY} width={W} height={1200} fill={`url(#${id}-f)`} />
      {Array.from({length: 12}, (_, i) => (
        <line key={i} x1={x0} y1={floorY + 18 * Math.pow(1.5, i)} x2={x1} y2={floorY + 18 * Math.pow(1.5, i)} stroke="#0E2E37" strokeWidth={2} opacity={0.6} />
      ))}
      <rect x={x0} y={floorY} width={W} height={4} fill={lit(ROOM.floorFar, 0.15)} opacity={0.6} />
    </g>
  );
};

/** Floor tape measure from xa to xb at floor y, with foot ticks and a small "8 FT" painted at the listener's end. */
export const FloorTape: React.FC<{xa: number; xb: number; y: number; reveal?: number; lit?: number}> = ({xa, xb, y, reveal = 1, lit: l = 0}) => {
  const xe = lerp(xa, xb, clamp(reveal));
  const ft = (xb - xa) / 8;
  return (
    <g>
      <rect x={Math.min(xa, xe)} y={y - 7} width={Math.abs(xe - xa)} height={14} fill={ROOM.tape} opacity={0.9} />
      <rect x={Math.min(xa, xe)} y={y - 7} width={Math.abs(xe - xa)} height={4} fill="#FFF3C9" opacity={0.6} />
      {Array.from({length: 9}, (_, i) => {
        const x = xa + i * ft;
        if ((x - xa) / (xe - xa + 1e-6) > 1.0001) return null;
        const on = clamp(l * 9 - i);
        return <rect key={i} x={x - 2.5} y={y - (i % 4 === 0 ? 20 : 14)} width={5} height={i % 4 === 0 ? 34 : 26} fill={on > 0 ? '#FFFFFF' : '#2A2416'} opacity={0.9} />;
      })}
    </g>
  );
};

/** A soft, out-of-focus room for close-ups: deep teal gradient, a cove glow and bokeh from the room's lights. */
export const Bokeh: React.FC<{id: string; ox?: number; oy?: number; t?: number; warm?: number; dark?: number}> = ({id, ox = 0, oy = 0, t = 0, warm = 0.5, dark = 0}) => {
  const discs = Array.from({length: 18}, (_, i) => {
    const x = ((hash(i, 11) * 1400 - 160 + ox) % 1400 + 1400) % 1400 - 160;
    const y = hash(i, 12) * 1700 + 60 + oy;
    const r = 30 + 70 * hash(i, 13);
    const warmI = hash(i, 14) < warm;
    return {x, y, r, c: warmI ? '#FFD9A0' : '#7FE9DE', a: 0.06 + 0.12 * hash(i, 15) + 0.03 * Math.sin(t * 0.8 + i)};
  });
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-g`} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor={mix('#1D5363', '#0B1E26', dark)} />
          <stop offset="0.6" stopColor={mix('#123844', '#081419', dark)} />
          <stop offset="1" stopColor={mix('#0A222B', '#050C10', dark)} />
        </radialGradient>
        <radialGradient id={`${id}-d`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.75" stopColor="#FFFFFF" stopOpacity={0.85} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-cv`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ROOM.cove} stopOpacity={0} />
          <stop offset="0.5" stopColor={ROOM.cove} stopOpacity={0.16} />
          <stop offset="1" stopColor={ROOM.cove} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={-300} y={-300} width={1680} height={2520} fill={`url(#${id}-g)`} />
      <rect x={-300} y={420 + oy * 0.5} width={1680} height={160} fill={`url(#${id}-cv)`} />
      {discs.map((d, i) => (
        <g key={i} opacity={d.a}>
          <circle cx={fmt(d.x)} cy={fmt(d.y)} r={fmt(d.r)} fill={d.c} />
          <circle cx={fmt(d.x)} cy={fmt(d.y)} r={fmt(d.r)} fill="none" stroke={d.c} strokeWidth={3} opacity={0.8} />
        </g>
      ))}
    </g>
  );
};

/** The reverse view (angle D): the room's far end behind the operator, a tall night window and the cove line. */
export const RoomReverse: React.FC<{id: string; t: number; floorY: number; blur?: number}> = ({id, t, floorY, blur = 0}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0D2834" />
        <stop offset="1" stopColor="#123D4A" />
      </linearGradient>
      <linearGradient id={`${id}-n`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0A1426" />
        <stop offset="0.7" stopColor="#13284A" />
        <stop offset="1" stopColor="#25406A" />
      </linearGradient>
      <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={ROOM.floorFar} />
        <stop offset="1" stopColor={ROOM.floorNear} />
      </linearGradient>
      {blur > 0 && (
        <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={blur} />
        </filter>
      )}
    </defs>
    <g filter={blur > 0 ? `url(#${id}-bl)` : undefined}>
      <rect x={-400} y={-400} width={1880} height={floorY + 400} fill={`url(#${id}-w)`} />
      {/* a tall window onto a night city: far lights, a few blinking */}
      <rect x={120} y={260} width={840} height={floorY - 420} rx={10} fill={`url(#${id}-n)`} />
      {Array.from({length: 60}, (_, i) => {
        const x = 140 + hash(i, 21) * 800;
        const y = 300 + floorY - 520 - Math.pow(hash(i, 22), 0.6) * (floorY - 620) + 60;
        const on = hash(i, 23) > 0.15 || Math.sin(t * 2 + i) > 0;
        return <rect key={i} x={fmt(x)} y={fmt(Math.min(y, floorY - 180))} width={fmt(3 + 5 * hash(i, 24))} height={fmt(3 + 4 * hash(i, 25))} fill={hash(i, 26) > 0.5 ? '#FFD37A' : '#8FE3FF'} opacity={on ? 0.55 : 0.15} />;
      })}
      {[320, 540, 760].map((x) => (
        <rect key={x} x={x - 4} y={260} width={8} height={floorY - 420} fill="#0B1F29" />
      ))}
      <rect x={120} y={260} width={840} height={floorY - 420} rx={10} fill="none" stroke="#2C5E6C" strokeWidth={8} />
      <rect x={-400} y={160} width={1880} height={6} fill={ROOM.cove} opacity={0.7} />
      <rect x={-400} y={floorY - 40} width={1880} height={40} fill="#0A2530" />
      <rect x={-400} y={floorY} width={1880} height={1200} fill={`url(#${id}-f)`} />
      {/* the window's reflection on the floor */}
      <rect x={120} y={floorY + 6} width={840} height={180} fill="#2A4A78" opacity={0.18} />
    </g>
  </g>
);
