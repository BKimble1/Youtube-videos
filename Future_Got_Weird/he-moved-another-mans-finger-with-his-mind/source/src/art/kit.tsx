// Shared kit for "He Moved Another Man's Finger With His Mind": palette, camera, labels and the lab props.
// Weird Crew vector finish: navy ink contours, cel/gradient shading from one warm key light at the upper left,
// light backgrounds. Every value is a pure function of the frame.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {clamp, fmt} from '../dc/math';

export {INK};
export const K = {
  paper: '#FAF3DF',
  cream: '#FFFBF0',
  saffron: '#FFC744',
  teal: '#1CA7A0',
  coral: '#EF6B55',
  coralDeep: '#C94A36',
  blue: '#4F7CC9',
  blueLight: '#D3E1F8',
  green: '#4F9A6B',
  purple: '#8B6CC9',
  orange: '#E58A3A',
  // the two 2013 labs: Rao's cool blue room (frame left), Stocco's warm room (frame right)
  raoWall: '#D6E4EE',
  raoWallDeep: '#B8CDDD',
  stoccoWall: '#F3E2C6',
  stoccoWallDeep: '#E0C79F',
  desk: '#C98F57',
  deskTop: '#E2AE74',
  deskDeep: '#9A6538',
  metal: '#AEB9C2',
  metalDeep: '#7E8B96',
  plastic: '#E9EDF0',
  screenDark: '#1F3442',
  // people: sleeve colours stay with each person through the film
  raoSleeve: '#4F7CC9',
  raoSkin: '#B37A52',
  stoccoSleeve: '#4F9A6B',
  stoccoSkin: '#F2C9A8',
  swimCap: '#7E5BB5',
  // 2014 cast (new people)
  r14Sleeve: '#E58A3A',
  r14Skin: '#C98B5E',
  // 2019: the two Senders' signal colours and the Receiver
  senderA: '#1CA7A0',
  senderB: '#EF6B55',
  receiver: '#8B6CC9',
  // outdoors
  sky: '#CBE8F4',
  skyDeep: '#A9D6EA',
  grass: '#9CC387',
  grassDeep: '#7BAA6A',
  path: '#EBDDBF',
  brick: '#C9765A',
  brickDeep: '#A65A43',
  stone: '#E7DCC8',
};

export const FONT_HEAD = '"Fredoka Variable", "Nunito Variable", sans-serif';
export const FONT_BODY = '"Nunito Variable", sans-serif';

/** Camera: the world point (x, y) is drawn at the frame centre at zoom z (1 = world units are pixels). */
export const Cam: React.FC<{x: number; y: number; z: number; rot?: number; children: React.ReactNode}> = ({x, y, z, rot = 0, children}) => (
  <g transform={`translate(960 540) rotate(${fmt(rot)}) scale(${fmt(z)}) translate(${fmt(-x)} ${fmt(-y)})`}>{children}</g>
);

/** A label chip (one short phrase, never a paragraph). k: 0..1 reveal (pop). */
export const Tag: React.FC<{x: number; y: number; text: string; size?: number; k?: number; fill?: string; color?: string; anchor?: 'middle' | 'start' | 'end'; weight?: number}> = ({
  x, y, text, size = 34, k = 1, fill = K.cream, color = INK, anchor = 'middle', weight = 600,
}) => {
  if (k <= 0.001) return null;
  const w = text.length * size * 0.56 + size * 1.2;
  const h = size * 1.55;
  const x0 = anchor === 'middle' ? -w / 2 : anchor === 'start' ? 0 : -w;
  const s = 0.85 + 0.15 * clamp(k);
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`} opacity={clamp(k * 1.4)}>
      <rect x={x0 + 4} y={-h / 2 + 5} width={w} height={h} rx={h / 2} fill={INK} opacity={0.18} />
      <rect x={x0} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={INK} strokeWidth={size * 0.12} />
      <text x={x0 + w / 2} y={size * 0.36} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={weight} fontSize={size} fill={color}>
        {text}
      </text>
    </g>
  );
};

/** Plain heading text with a light halo for legibility. */
export const Label: React.FC<{x: number; y: number; text: string; size?: number; color?: string; k?: number; anchor?: 'middle' | 'start' | 'end'; weight?: number}> = ({
  x, y, text, size = 40, color = INK, k = 1, anchor = 'middle', weight = 600,
}) =>
  k <= 0.001 ? null : (
    <text x={fmt(x)} y={fmt(y)} textAnchor={anchor} fontFamily={FONT_HEAD} fontWeight={weight} fontSize={size} fill={color} opacity={clamp(k)}
      stroke={K.cream} strokeWidth={size * 0.16} paintOrder="stroke" strokeLinejoin="round">
      {text}
    </text>
  );

/** Room back wall + floor band with a soft vignette. */
export const Room: React.FC<{id: string; x0: number; y0: number; x1: number; y1: number; wall: string; wallDeep: string; floorY: number; floor?: string}> = ({id, x0, y0, x1, y1, wall, wallDeep, floorY, floor = '#CFC2AE'}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={lit(wall, 0.25)} />
        <stop offset="1" stopColor={wall} />
      </linearGradient>
      <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={shade(floor, 0.1)} />
        <stop offset="1" stopColor={floor} />
      </linearGradient>
    </defs>
    <rect x={x0} y={y0} width={x1 - x0} height={floorY - y0} fill={`url(#${id}-w)`} />
    <rect x={x0} y={floorY - 26} width={x1 - x0} height={26} fill={wallDeep} />
    <rect x={x0} y={floorY} width={x1 - x0} height={y1 - floorY} fill={`url(#${id}-f)`} />
  </g>
);

/** A desk seen from the front, slightly from above: top surface (depth d) and front face. */
export const Desk: React.FC<{id: string; x0: number; x1: number; y: number; d?: number; h?: number; top?: string; face?: string}> = ({id, x0, x1, y, d = 70, h = 260, top = K.deskTop, face = K.desk}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-t`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={shade(top, 0.08)} />
        <stop offset="1" stopColor={lit(top, 0.12)} />
      </linearGradient>
      <linearGradient id={`${id}-fc`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={face} />
        <stop offset="1" stopColor={shade(face, 0.3)} />
      </linearGradient>
    </defs>
    <path d={`M${x0 + 30},${y - d} L${x1 - 30},${y - d} L${x1},${y} L${x0},${y} Z`} fill={`url(#${id}-t)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={x0} y={y} width={x1 - x0} height={h} fill={`url(#${id}-fc)`} stroke={INK} strokeWidth={5} />
    <rect x={x0} y={y} width={x1 - x0} height={10} fill={lit(face, 0.25)} />
  </g>
);

/** Monitor on a stand, its screen content drawn in a 640 x 400 local frame (children). */
export const Monitor: React.FC<{id: string; x: number; y: number; s?: number; on?: number; children?: React.ReactNode; screenFill?: string}> = ({id, x, y, s = 1, on = 1, children, screenFill = K.screenDark}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
    {/* stand: x,y is the foot centre on the desk */}
    <path d="M-90,0 L90,0 L70,-18 L-70,-18 Z" fill={K.metalDeep} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-22} y={-90} width={44} height={74} fill={K.metal} stroke={INK} strokeWidth={5} />
    <rect x={-350} y={-540} width={700} height={460} rx={22} fill="#2A3B47" stroke={INK} strokeWidth={6} />
    <rect x={-340} y={-530} width={680} height={440} rx={14} fill="#33495A" />
    <defs>
      <clipPath id={`${id}-clip`}>
        <rect x={-320} y={-510} width={640} height={400} rx={6} />
      </clipPath>
    </defs>
    <rect x={-320} y={-510} width={640} height={400} rx={6} fill={screenFill} />
    <g clipPath={`url(#${id}-clip)`} opacity={on}>
      <g transform="translate(-320 -510)">{children}</g>
    </g>
    <rect x={-320} y={-510} width={640} height={400} rx={6} fill="none" stroke={INK} strokeWidth={4} />
    <path d="M-300,-500 L-120,-500 L-260,-330 L-300,-330 Z" fill="#FFFFFF" opacity={0.06} />
  </g>
);

/** Screen-space position of a point (u, v) of a Monitor's 640 x 400 screen. */
export const monitorPt = (x: number, y: number, s: number, u: number, v: number) => ({x: x + (-320 + u) * s, y: y + (-510 + v) * s});

/** Keyboard seen from the front-above (oblique): x,y = centre of the front edge. spaceDown 0..1 presses the bar. */
export const Keyboard: React.FC<{id: string; x: number; y: number; s?: number; spaceDown?: number; glowSpace?: number}> = ({id, x, y, s = 1, spaceDown = 0, glowSpace = 0}) => {
  const W = 520, D = 150, sk = 60; // width, depth (drawn), back-edge inset
  const keyRows = 4;
  const keys: React.ReactNode[] = [];
  for (let r = 0; r < keyRows; r++) {
    const v0 = 0.12 + r * 0.19, v1 = v0 + 0.15;
    const n = 12;
    for (let i = 0; i < n; i++) {
      const u0 = 0.06 + (i / n) * 0.88, u1 = u0 + 0.88 / n - 0.012;
      const pt = (u: number, v: number) => {
        const yy = -D * (1 - v);
        const inset = sk * (1 - v);
        const xx = -W / 2 + inset + u * (W - 2 * inset);
        return `${fmt(xx)},${fmt(yy)}`;
      };
      keys.push(<path key={`${r}-${i}`} d={`M${pt(u0, v0)} L${pt(u1, v0)} L${pt(u1, v1)} L${pt(u0, v1)} Z`} fill={K.plastic} stroke={INK} strokeWidth={2.2} />);
    }
  }
  // space bar: front row centre
  const sp = (u: number, v: number, dz = 0) => {
    const yy = -D * (1 - v) + dz;
    const inset = sk * (1 - v);
    return `${fmt(-W / 2 + inset + u * (W - 2 * inset))},${fmt(yy)}`;
  };
  const dz = spaceDown * 7;
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
      <path d={`M${-W / 2 + sk},${-D} L${W / 2 - sk},${-D} L${W / 2},0 L${W / 2},18 L${-W / 2},18 L${-W / 2},0 Z`} fill="#C9D1D8" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M${-W / 2},0 L${W / 2},0 L${W / 2},18 L${-W / 2},18 Z`} fill="#A4AFB8" />
      {keys}
      {glowSpace > 0 && <path d={`M${sp(0.3, 0.88)} L${sp(0.7, 0.88)} L${sp(0.7, 1.0)} L${sp(0.3, 1.0)} Z`} fill={K.saffron} opacity={0.6 * glowSpace} transform="translate(0 2) scale(1.04 1.3)" />}
      <path d={`M${sp(0.3, 0.88, dz)} L${sp(0.7, 0.88, dz)} L${sp(0.7, 0.985, dz)} L${sp(0.3, 0.985, dz)} Z`} fill={mix(K.plastic, '#FFFFFF', 0.4)} stroke={INK} strokeWidth={3} />
    </g>
  );
};
/** Where the space bar's top centre is, for a Keyboard at x,y,s (fingertip target). */
export const spaceBarPt = (x: number, y: number, s: number) => ({x, y: y - 150 * 0.06 * s - 2 * s});

/** Laptop-style touchpad slab (2014 receiver): x,y = centre of its front edge. press 0..1 */
export const Touchpad: React.FC<{x: number; y: number; s?: number; press?: number; glow?: number}> = ({x, y, s = 1, press = 0, glow = 0}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
    <path d="M-170,-110 L170,-110 L200,0 L200,16 L-200,16 L-200,0 Z" fill="#D5DBE0" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-200,0 L200,0 L200,16 L-200,16 Z" fill="#A9B3BC" />
    {glow > 0 && <path d="M-150,-96 L150,-96 L176,-14 L-176,-14 Z" fill={K.saffron} opacity={0.55 * glow} />}
    <path d={`M-140,${-92 + press * 3} L140,${-92 + press * 3} L164,${-18 + press * 3} L-164,${-18 + press * 3} Z`} fill="#EEF2F5" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
  </g>
);

/** Round TMS coil with its handle, seen edge-on-ish. `flip` 0..1 rotates it 180 deg about the handle axis (the
 *  handle stays put); the active face is marked with a saffron band, the back face is plain grey. `pulse` 0..1 draws
 *  the field arcs on the active side. ang: handle direction (deg). */
export const RoundCoil: React.FC<{x: number; y: number; s?: number; ang?: number; flip?: number; pulse?: number; arcSide?: 1 | -1}> = ({x, y, s = 1, ang = 0, flip = 0, pulse = 0, arcSide = 1}) => {
  const c = Math.cos(flip * Math.PI); // 1 -> active face toward the head (down), -1 -> flipped
  const ry = 34 * Math.max(0.12, Math.abs(c));
  const faceDown = c >= 0;
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(ang)}) scale(${fmt(s)})`}>
      {/* handle along +x */}
      <rect x={70} y={-16} width={190} height={32} rx={14} fill="#46525C" stroke={INK} strokeWidth={5} />
      <rect x={200} y={-12} width={70} height={24} rx={10} fill="#2D363D" stroke={INK} strokeWidth={4} />
      {/* the ring (an ellipse whose vertical radius follows the flip) */}
      <ellipse cx={0} cy={0} rx={110} ry={ry + 18} fill={faceDown ? '#5D6B76' : '#9AA7B1'} stroke={INK} strokeWidth={5} />
      <ellipse cx={0} cy={faceDown ? 6 : -6} rx={110} ry={ry + 12} fill={faceDown ? K.saffron : '#B9C3CB'} stroke={INK} strokeWidth={4} opacity={0.95} />
      <ellipse cx={0} cy={0} rx={52} ry={Math.max(4, (ry + 12) * 0.47)} fill={faceDown ? '#5D6B76' : '#8996A0'} stroke={INK} strokeWidth={4} />
      {pulse > 0.001 && faceDown && (
        <g opacity={pulse} fill="none" stroke={K.saffron} strokeLinecap="round">
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${-90 - i * 26},${arcSide * (30 + i * 22)} Q0,${arcSide * (90 + i * 46)} ${90 + i * 26},${arcSide * (30 + i * 22)}`} strokeWidth={9 - i * 2} opacity={1 - i * 0.25} />
          ))}
        </g>
      )}
    </g>
  );
};

/** Figure-eight coil (BrainNet receiver): two rings side by side with a handle; pulse shows a short field arc. */
export const Fig8Coil: React.FC<{x: number; y: number; s?: number; ang?: number; pulse?: number}> = ({x, y, s = 1, ang = 0, pulse = 0}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(ang)}) scale(${fmt(s)})`}>
    <rect x={-18} y={-230} width={36} height={170} rx={14} fill="#46525C" stroke={INK} strokeWidth={5} />
    <ellipse cx={-62} cy={0} rx={64} ry={58} fill="#5D6B76" stroke={INK} strokeWidth={5} />
    <ellipse cx={62} cy={0} rx={64} ry={58} fill="#5D6B76" stroke={INK} strokeWidth={5} />
    <ellipse cx={-62} cy={0} rx={30} ry={27} fill="#7C8A95" stroke={INK} strokeWidth={4} />
    <ellipse cx={62} cy={0} rx={30} ry={27} fill="#7C8A95" stroke={INK} strokeWidth={4} />
    <rect x={-24} y={-70} width={48} height={40} rx={10} fill="#46525C" stroke={INK} strokeWidth={4} />
    {pulse > 0.001 && (
      <g opacity={pulse} fill="none" stroke={K.saffron} strokeLinecap="round">
        <path d="M-40,70 Q0,120 40,70" strokeWidth={9} />
        <path d="M-60,96 Q0,160 60,96" strokeWidth={6} opacity={0.7} />
      </g>
    )}
  </g>
);

/** A small computer tower with a status light; `blink` 0..1 lights it. */
export const Computer: React.FC<{x: number; y: number; s?: number; blink?: number; color?: string}> = ({x, y, s = 1, blink = 0, color = K.teal}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
    <rect x={-70} y={-200} width={140} height={200} rx={12} fill="#D9DEE2" stroke={INK} strokeWidth={5} />
    <rect x={-50} y={-176} width={100} height={14} rx={6} fill="#B5BEC6" />
    <rect x={-50} y={-150} width={100} height={14} rx={6} fill="#B5BEC6" />
    <circle cx={0} cy={-40} r={13} fill={mix('#6E7C86', color, blink)} stroke={INK} strokeWidth={4} />
    {blink > 0 && <circle cx={0} cy={-40} r={28} fill={color} opacity={0.3 * blink} />}
  </g>
);

/** A data packet: a small envelope chip with a label (the one prearranged command). */
export const Packet: React.FC<{x: number; y: number; s?: number; text?: string; color?: string; k?: number}> = ({x, y, s = 1, text = 'FIRE', color = K.saffron, k = 1}) =>
  k <= 0.001 ? null : (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s * (0.7 + 0.3 * clamp(k)))})`} opacity={clamp(k * 1.5)}>
      <circle cx={0} cy={0} r={74} fill={color} opacity={0.22} />
      <rect x={-78} y={-40} width={156} height={80} rx={16} fill={color} stroke={INK} strokeWidth={6} />
      <text x={0} y={15} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={42} fill={INK}>
        {text}
      </text>
    </g>
  );

/** A campus building (brick, stone trim) with a grid of windows; one window (wi) can be marked as the lab. */
export const Building: React.FC<{id: string; x: number; y: number; w: number; h: number; cols: number; rows: number; color?: string; roof?: string; lab?: [number, number]; labGlow?: number}> = ({
  id, x, y, w, h, cols, rows, color = K.brick, roof = '#6F7E88', lab, labGlow = 0,
}) => {
  const wins: React.ReactNode[] = [];
  const mx = w * 0.08, my = h * 0.12;
  const cw = (w - 2 * mx) / cols, rh = (h - 2 * my) / rows;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const wx = x + mx + c * cw + cw * 0.14, wy = y + my + r * rh + rh * 0.12;
      const isLab = lab && lab[0] === c && lab[1] === r;
      wins.push(
        <g key={`${r}-${c}`}>
          <rect x={wx} y={wy} width={cw * 0.72} height={rh * 0.7} rx={4} fill={isLab ? mix('#BFD9E8', K.saffron, labGlow * 0.6) : '#BFD9E8'} stroke={INK} strokeWidth={4} />
          <rect x={wx + 6} y={wy + 6} width={cw * 0.72 * 0.4} height={rh * 0.7 * 0.35} fill="#FFFFFF" opacity={0.35} />
        </g>,
      );
    }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={lit(color, 0.12)} />
          <stop offset="1" stopColor={shade(color, 0.18)} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-b)`} stroke={INK} strokeWidth={6} />
      <rect x={x - 14} y={y - 30} width={w + 28} height={36} fill={roof} stroke={INK} strokeWidth={6} />
      <rect x={x} y={y + h - 22} width={w} height={22} fill={K.stone} stroke={INK} strokeWidth={4} />
      {wins}
    </g>
  );
};

/** Window geometry of a Building cell (for camera moves that start inside the window). */
export const windowRect = (x: number, y: number, w: number, h: number, cols: number, rows: number, c: number, r: number) => {
  const mx = w * 0.08, my = h * 0.12;
  const cw = (w - 2 * mx) / cols, rh = (h - 2 * my) / rows;
  return {x: x + mx + c * cw + cw * 0.14, y: y + my + r * rh + rh * 0.12, w: cw * 0.72, h: rh * 0.7};
};

/** Simple round tree. */
export const Tree: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
    <rect x={-12} y={-90} width={24} height={90} fill="#8A5A3B" stroke={INK} strokeWidth={4} />
    <circle cx={0} cy={-140} r={78} fill={K.grassDeep} stroke={INK} strokeWidth={5} />
    <circle cx={-22} cy={-162} r={40} fill={K.grass} opacity={0.8} />
  </g>
);
