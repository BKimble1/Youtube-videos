// S5 parts (the 2014 study and its flipped-coil control). Local variants for this sequence only; shared kit files
// are untouched. Every id is prefixed `s5`.
//  - S5Coil: a round TMS coil drawn as a short disc (variant of kit RoundCoil). `flip` 0..1 turns it 180 deg about
//    the axis of its handle: halfway through, its saffron active face looks at the camera; at 1 the plain grey back
//    face is toward the head and the active face looks away. The pulse arcs always leave the ACTIVE face.
//  - BackHead: a 2014 receiver seen from behind (camera behind the chair, so the person's left is frame-left),
//    curly hair, neckband headphones, TMS chair neck rest.
//  - CoilArm, TmsBox, FlatPad (the touchpad seen face-on), small rocket / plane / city icons.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {clamp, easeOut, fmt} from '../dc/math';
import {FONT_HEAD, INK, K} from './kit';

const P = (x: number, y: number) => `${fmt(x)},${fmt(y)}`;

/** Round coil as a disc. Coil-local frame: the disc centre at (0,0), the handle along -x (mirrored kit layout),
 *  the active face's normal along +y (toward the head) when flip = 0. */
export const S5Coil: React.FC<{x: number; y: number; s?: number; ang?: number; flip?: number; pulse?: number; axisK?: number}> = ({
  x, y, s = 1, ang = 0, flip = 0, pulse = 0, axisK = 0,
}) => {
  const R = 110, TH = 34;
  // the disc normal rotates about the x axis (the handle axis); a small fixed tilt shows a sliver of the near face
  const phi = clamp(flip) * Math.PI + 0.32;
  const ny = Math.cos(phi); // screen-y component of the active normal
  const nz = -Math.sin(phi); // < 0: the active face looks toward the camera
  const ry = R * Math.abs(nz);
  const cA = (TH / 2) * ny; // active face centre (y)
  const cB = -(TH / 2) * ny; // back face centre
  const activeFront = nz < 0;
  const front = activeFront ? cA : cB;
  const back = activeFront ? cB : cA;
  const hull = `M${P(-R, Math.min(cA, cB))} L${P(-R, Math.max(cA, cB))} A${fmt(R)} ${fmt(Math.max(ry, 0.5))} 0 0 0 ${P(R, Math.max(cA, cB))} L${P(R, Math.min(cA, cB))} A${fmt(R)} ${fmt(Math.max(ry, 0.5))} 0 0 0 ${P(-R, Math.min(cA, cB))} Z`;
  const faceFill = activeFront ? K.saffron : '#A7B3BC';
  const side = Math.sign(ny) || 1; // which way (screen y) the active face points
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(ang)}) scale(${fmt(s)})`}>
      {/* the handle along -x (the rotation axis) */}
      <rect x={-R - 200} y={-17} width={210} height={34} rx={15} fill="#46525C" stroke={INK} strokeWidth={5} />
      <rect x={-R - 216} y={-13} width={64} height={26} rx={10} fill="#2D363D" stroke={INK} strokeWidth={4} />
      {axisK > 0.001 && (
        <g opacity={axisK}>
          <line x1={-R - 300} y1={0} x2={R + 70} y2={0} stroke={K.saffron} strokeWidth={5} strokeDasharray="14 10" />
          {/* a rotation arrow around the handle axis */}
          <path d={`M${P(-R - 110, -40)} A16 40 0 1 0 ${P(-R - 110, 40)}`} fill="none" stroke={K.cream} strokeWidth={13} strokeLinecap="round" />
          <path d={`M${P(-R - 110, -40)} A16 40 0 1 0 ${P(-R - 110, 40)}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <path d={`M${P(-R - 122, 30)} L${P(-R - 108, 42)} L${P(-R - 124, 52)}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {/* the far face (only its rim shows) */}
      <ellipse cx={0} cy={fmt(back)} rx={R} ry={fmt(Math.max(ry, 0.5))} fill="#46525C" stroke={INK} strokeWidth={5} />
      {/* the side of the disc */}
      <path d={hull} fill="#5D6B76" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {/* the saffron rim marks the active edge even when that face is turned away */}
      {!activeFront && (
        <path d={`M${P(-R + 2, cA)} A${fmt(R - 2)} ${fmt(Math.max(ry - 2, 0.5))} 0 0 ${side > 0 ? 0 : 1} ${P(R - 2, cA)}`} fill="none" stroke={K.saffron} strokeWidth={9} strokeLinecap="round" />
      )}
      {/* the near face */}
      <ellipse cx={0} cy={fmt(front)} rx={R} ry={fmt(Math.max(ry, 0.5))} fill={faceFill} stroke={INK} strokeWidth={5} />
      {ry > 8 && (
        <g>
          <ellipse cx={0} cy={fmt(front)} rx={R * 0.74} ry={fmt(ry * 0.74)} fill="none" stroke={activeFront ? '#D99E1E' : '#8996A0'} strokeWidth={4} />
          <ellipse cx={0} cy={fmt(front)} rx={R * 0.46} ry={fmt(ry * 0.46)} fill={activeFront ? '#E8AE2A' : '#8996A0'} stroke={INK} strokeWidth={4} />
          <ellipse cx={-R * 0.3} cy={fmt(front - ry * 0.45)} rx={R * 0.32} ry={fmt(ry * 0.14)} fill="#FFFFFF" opacity={0.25} />
        </g>
      )}
      {pulse > 0.001 && (
        <g opacity={clamp(pulse)} fill="none" stroke={K.saffron} strokeLinecap="round">
          {[0, 1, 2].map((i) => {
            const y0 = cA + side * (24 + i * 22);
            const yq = cA + side * (78 + i * 44);
            return <path key={i} d={`M${P(-80 - i * 24, y0)} Q${P(0, yq)} ${P(80 + i * 24, y0)}`} strokeWidth={11 - i * 2.5} opacity={1 - i * 0.25} />;
          })}
        </g>
      )}
    </g>
  );
};

/** Receiver seen from behind (dark room). Head centre (hx, hy), head radius about 135. `rs`: right-shoulder lift
 *  (px, the person's right = frame right). `glow`: the stimulated patch under the coil (scalp point gx, gy). */
export const BackHead: React.FC<{hx: number; hy: number; rs?: number; glow?: number; gx?: number; gy?: number}> = ({hx, hy, rs = 0, glow = 0, gx = 0, gy = 0}) => {
  const skin = K.r14Skin, shirt = K.r14Sleeve, hair = '#2B1A10';
  const RX = 128, RY = 142;
  // curly hair outline: bumps along the head's upper outline
  const bumps: string[] = [];
  const n = 15;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * (1.02 + (i / n) * 0.96); // from left-ish (~184 deg) around the top to right
    const r = 1.06 + 0.05 * Math.sin(i * 2.1);
    bumps.push(P(hx + Math.cos(a) * RX * r, hy + Math.sin(a) * RY * r));
  }
  const hairD = (() => {
    let d = `M${P(hx - RX * 1.02, hy + 70)} `;
    d += `L${P(hx - RX * 1.06, hy + 10)} `;
    for (let i = 0; i < bumps.length; i++) {
      const [bx, by] = bumps[i].split(',').map(Number);
      d += `Q${P(bx + (bx - hx) * 0.06, by + (by - hy) * 0.06)} ${P(bx, by)} `;
    }
    d += `L${P(hx + RX * 1.06, hy + 10)} L${P(hx + RX * 1.02, hy + 70)} Q${P(hx + RX * 0.7, hy + 112)} ${P(hx + 40, hy + 108)} Q${P(hx, hy + 122)} ${P(hx - 40, hy + 108)} Q${P(hx - RX * 0.7, hy + 112)} ${P(hx - RX * 1.02, hy + 70)} Z`;
    return d;
  })();
  const curls: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const a = (i * 2.399) % (Math.PI * 2);
    const r = 0.18 + ((i * 0.37) % 0.72);
    const cx = hx + Math.cos(a) * RX * r * 0.95;
    const cy = hy - 6 + Math.sin(a) * RY * r * 0.8;
    curls.push(<path key={i} d={`M${P(cx - 12, cy + 4)} q6,-14 13,-2 q6,-12 12,2`} fill="none" stroke="#5A3A24" strokeWidth={4} strokeLinecap="round" opacity={0.75} />);
  }
  const shY = hy + 190; // shoulder line
  const torso = `M${P(hx - 290, 1100)} L${P(hx - 282, shY + 90)} Q${P(hx - 270, shY + 8)} ${P(hx - 150, shY - 2)} L${P(hx - 52, shY - 22)} L${P(hx + 52, shY - 22 - rs * 0.4)} L${P(hx + 150, shY - 2 - rs)} Q${P(hx + 270, shY + 8 - rs)} ${P(hx + 282, shY + 90 - rs * 0.5)} L${P(hx + 290, 1100)} Z`;
  return (
    <g>
      <defs>
        <linearGradient id="s5-shirt" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={lit(shirt, 0.12)} />
          <stop offset="0.6" stopColor={shirt} />
          <stop offset="1" stopColor={shade(shirt, 0.35)} />
        </linearGradient>
        <radialGradient id="s5-hair" cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#4A3020" />
          <stop offset="1" stopColor={hair} />
        </radialGradient>
        <radialGradient id="s5-glow">
          <stop offset="0" stopColor={K.saffron} stopOpacity={1} />
          <stop offset="1" stopColor={K.saffron} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* torso and shoulders */}
      <path d={torso} fill="url(#s5-shirt)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M${P(hx - 150, shY + 30)} Q${P(hx - 70, shY + 60)} ${P(hx - 40, shY + 160)}`} fill="none" stroke={shade(shirt, 0.3)} strokeWidth={6} strokeLinecap="round" opacity={0.5} />
      {/* neck */}
      <path d={`M${P(hx - 50, hy + 80)} L${P(hx - 54, shY - 18)} Q${P(hx, shY - 8)} ${P(hx + 54, shY - 18)} L${P(hx + 50, hy + 80)} Z`} fill={shade(skin, 0.12)} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {/* ears */}
      <ellipse cx={hx - RX - 4} cy={hy + 14} rx={20} ry={32} fill={skin} stroke={INK} strokeWidth={5} />
      <ellipse cx={hx + RX + 4} cy={hy + 14} rx={20} ry={32} fill={shade(skin, 0.15)} stroke={INK} strokeWidth={5} />
      {/* head (mostly hair from behind) */}
      <path d={hairD} fill="url(#s5-hair)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {curls}
      {glow > 0.001 && <ellipse cx={gx} cy={gy} rx={70} ry={52} fill="url(#s5-glow)" opacity={0.85 * clamp(glow)} />}
      {/* neckband headphones: cups over the ears, band round the back of the head */}
      <path d={`M${P(hx - RX - 6, hy + 52)} Q${P(hx, hy + 150)} ${P(hx + RX + 6, hy + 52)}`} fill="none" stroke={INK} strokeWidth={20} strokeLinecap="round" />
      <path d={`M${P(hx - RX - 6, hy + 52)} Q${P(hx, hy + 150)} ${P(hx + RX + 6, hy + 52)}`} fill="none" stroke="#7D8B97" strokeWidth={10} strokeLinecap="round" />
      <rect x={hx - RX - 34} y={hy - 34} width={44} height={94} rx={18} fill="#6C7A86" stroke={INK} strokeWidth={5} />
      <rect x={hx - RX - 28} y={hy - 24} width={14} height={60} rx={7} fill="#93A1AC" />
      <rect x={hx + RX - 10} y={hy - 34} width={44} height={94} rx={18} fill="#56636E" stroke={INK} strokeWidth={5} />
    </g>
  );
};

/** TMS chair: a padded neck rest on a post, and the chair back (drawn in front of the torso). */
export const Chair: React.FC<{hx: number; hy: number}> = ({hx, hy}) => (
  <g>
    <rect x={hx - 22} y={hy + 200} width={44} height={260} fill="#2A333B" stroke={INK} strokeWidth={5} />
    <rect x={hx - 250} y={hy + 380} width={500} height={400} rx={60} fill="#38434D" stroke={INK} strokeWidth={6} />
    <rect x={hx - 226} y={hy + 400} width={452} height={40} rx={20} fill="#4A5661" />
    <rect x={hx - 110} y={hy + 150} width={220} height={62} rx={30} fill="#46525C" stroke={INK} strokeWidth={6} />
    <rect x={hx - 92} y={hy + 158} width={184} height={16} rx={8} fill="#5E6B76" />
  </g>
);

/** Articulated coil holder: a floor pole and two arm links ending in a clamp. */
export const CoilArm: React.FC<{base: {x: number; y: number}; j1: {x: number; y: number}; j2: {x: number; y: number}; end: {x: number; y: number}}> = ({base, j1, j2, end}) => {
  const link = (a: {x: number; y: number}, b: {x: number; y: number}, w: number) => (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={INK} strokeWidth={w + 10} strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#7E8B96" strokeWidth={w} strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#A9B4BD" strokeWidth={w * 0.3} strokeLinecap="round" transform="translate(-3 -3)" />
    </g>
  );
  const joint = (p: {x: number; y: number}) => (
    <g>
      <circle cx={p.x} cy={p.y} r={17} fill="#56636E" stroke={INK} strokeWidth={5} />
      <circle cx={p.x} cy={p.y} r={6} fill="#2D363D" />
    </g>
  );
  return (
    <g>
      {link(base, j1, 24)}
      {link(j1, j2, 18)}
      {link(j2, end, 16)}
      {joint(j1)}
      {joint(j2)}
      <rect x={end.x - 20} y={end.y - 20} width={40} height={40} rx={8} fill="#56636E" stroke={INK} strokeWidth={5} />
    </g>
  );
};

/** TMS stimulator box with a strength dial and level bars; `lv` 0..1 lights the bars (the pulse), `hi` 0..1 glows
 *  the dial. The needle never moves: the strength is the same for every pulse. */
export const TmsBox: React.FC<{x: number; y: number; lv?: number; hi?: number}> = ({x, y, lv = 0, hi = 0}) => {
  const ang = -40; // needle (deg from vertical), fixed
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)})`}>
      <rect x={4} y={8} width={230} height={150} rx={18} fill={INK} opacity={0.3} />
      <rect x={0} y={0} width={230} height={150} rx={18} fill="#56636E" stroke={INK} strokeWidth={6} />
      <rect x={0} y={0} width={230} height={26} rx={13} fill="#6C7A86" />
      {hi > 0.001 && <circle cx={70} cy={86} r={64} fill={K.saffron} opacity={0.35 * clamp(hi)} />}
      <path d="M22,104 A48,48 0 0 1 118,104 Z" fill="#E9EDF0" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (-80 + i * 40) * (Math.PI / 180);
        return <line key={i} x1={70 + Math.sin(a) * 36} y1={104 - Math.cos(a) * 36} x2={70 + Math.sin(a) * 46} y2={104 - Math.cos(a) * 46} stroke={INK} strokeWidth={3} />;
      })}
      <line x1={70} y1={104} x2={70 + Math.sin((ang * Math.PI) / 180) * 40} y2={104 - Math.cos((ang * Math.PI) / 180) * 40} stroke={K.coralDeep} strokeWidth={5} strokeLinecap="round" />
      <circle cx={70} cy={104} r={7} fill={INK} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={146 + i * 18} y={112 - i * 16} width={13} height={24 + i * 16} rx={3} fill={mix('#3A454F', K.saffron, clamp(lv))} stroke={INK} strokeWidth={2.5} />
      ))}
      <text x={174} y={56} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={30} fill="#E9EDF0">TMS</text>
    </g>
  );
};

/** The touchpad seen face-on (from above): a rounded rectangle; x,y,w,h is the surface. */
export const FlatPad: React.FC<{x: number; y: number; w: number; h: number; glow?: number; shadow?: number}> = ({x, y, w, h, glow = 0, shadow = 1}) => {
  const r = h * 0.11;
  return (
    <g>
      {shadow > 0 && <rect x={x + 6} y={y + 9} width={w} height={h} rx={r} fill={INK} opacity={0.18 * shadow} />}
      <defs>
        <linearGradient id="s5-pad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6F8FA" />
          <stop offset="1" stopColor="#DCE2E7" />
        </linearGradient>
      </defs>
      {/* the stroke sits inside the surface rectangle, so x,y,w,h is the outer bounding box */}
      <rect x={x + 2.5} y={y + 2.5} width={w - 5} height={h - 5} rx={r - 2.5} fill="url(#s5-pad)" stroke={INK} strokeWidth={5} />
      {glow > 0.001 && <rect x={x} y={y} width={w} height={h} rx={r} fill={K.saffron} opacity={0.4 * glow} />}
    </g>
  );
};

/** small icons (tallies) */
export const RocketIcon: React.FC<{x: number; y: number; s?: number; a?: number; op?: number}> = ({x, y, s = 1, a = 0, op = 1}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(a)}) scale(${fmt(s)})`} opacity={op}>
    <path d="M-30,0 L-48,-7 L-56,0 L-48,7 Z" fill={K.saffron} />
    <path d="M-30,-9 L14,-9 Q32,0 14,9 L-30,9 Z" fill={K.coral} stroke={INK} strokeWidth={3.5} />
    <path d="M-30,-9 L-40,-18 L-22,-9 Z M-30,9 L-40,18 L-22,9 Z" fill={K.coralDeep} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <circle cx={2} cy={0} r={4.5} fill="#FFFFFF" stroke={INK} strokeWidth={2.2} />
  </g>
);
export const PlaneIcon: React.FC<{x: number; y: number; s?: number; op?: number}> = ({x, y, s = 1, op = 1}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`} opacity={op}>
    <path d="M-34,-4 Q-30,-14 0,-12 L30,-8 Q40,-2 30,4 L0,8 Q-30,10 -34,4 Z" fill="#F4F7F9" stroke={INK} strokeWidth={3} />
    <path d="M-6,-10 L-18,-34 L-8,-34 L10,-10 Z" fill={K.teal} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <path d="M-6,6 L-16,26 L-6,26 L10,6 Z" fill={K.teal} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <path d="M-34,-4 L-42,-18 L-32,-16 L-26,-6 Z" fill={K.teal} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <rect x={2} y={-7} width={14} height={11} fill="#E8C48A" stroke={INK} strokeWidth={2} />
  </g>
);
/** a burst (an object shot down); k 0..1 appear */
export const Burst: React.FC<{x: number; y: number; r?: number; k?: number; color?: string}> = ({x, y, r = 34, k = 1, color = K.saffron}) => {
  if (k <= 0.001) return null;
  const s = easeOut(clamp(k));
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const rr = (i % 2 ? 0.55 : 1) * r * s;
    pts.push(P(x + Math.cos(a) * rr, y + Math.sin(a) * rr));
  }
  return <path d={`M${pts.join(' L')} Z`} fill={color} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" opacity={clamp(k * 2)} />;
};
/** red X (a friendly plane hit by mistake) */
export const RedX: React.FC<{x: number; y: number; r?: number; k?: number}> = ({x, y, r = 22, k = 1}) => {
  if (k <= 0.001) return null;
  const q = r * easeOut(clamp(k));
  return (
    <g strokeLinecap="round" opacity={clamp(k * 2)}>
      <path d={`M${P(x - q, y - q)} L${P(x + q, y + q)} M${P(x + q, y - q)} L${P(x - q, y + q)}`} stroke={INK} strokeWidth={14} />
      <path d={`M${P(x - q, y - q)} L${P(x + q, y + q)} M${P(x + q, y - q)} L${P(x - q, y + q)}`} stroke="#E04A3A" strokeWidth={8} />
    </g>
  );
};
/** a small skyline (tally boards); `hit` 0..1 a puff on it */
export const MiniCity: React.FC<{x: number; y: number; s?: number; hit?: number}> = ({x, y, s = 1, hit = 0}) => {
  const bs = [[-60, -60, 30, 60], [-26, -92, 34, 92], [12, -72, 28, 72], [44, -110, 38, 110]];
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
      {bs.map(([bx, by, w, h], i) => (
        <g key={i}>
          <rect x={bx} y={by} width={w} height={h} fill={i % 2 ? '#7C9CB8' : '#93B1C9'} stroke={INK} strokeWidth={3.5} />
          {[0, 1, 2].map((r) => (r * 24 + 14 < h - 8 ? <rect key={r} x={bx + 7} y={by + 10 + r * 24} width={w - 14} height={10} fill="#FFE7A3" opacity={0.85} /> : null))}
        </g>
      ))}
      <rect x={-74} y={0} width={168} height={10} fill="#8DB97A" stroke={INK} strokeWidth={3} />
      {hit > 0.001 && hit < 1 && (
        <g opacity={1 - hit * hit}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2 + 0.3;
            const r = 10 + 34 * easeOut(hit);
            return <circle key={i} cx={20 + Math.cos(a) * r * 0.7} cy={-70 + Math.sin(a) * r * 0.6} r={r * 0.55} fill={i % 2 ? '#F2F2F2' : K.coral} stroke={INK} strokeWidth={2.5} />;
          })}
        </g>
      )}
    </g>
  );
};
