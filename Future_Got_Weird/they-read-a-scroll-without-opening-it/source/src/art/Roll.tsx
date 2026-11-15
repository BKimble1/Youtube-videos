// The physical objects, drawn in the Weird Crew flat style (navy outline, warm key light):
// - PHerc. 1667 lying on its museum cradle, its end face showing the same spiral as the scan;
// - PHerc. Paris 4, a different, larger and crushed roll (teal tag);
// - the historical end view used for the opening attempts (sepia reconstruction).
import React from 'react';
import {hash, noise1} from '../lib/math';
import {R_OUT, SPIRAL, SQUASH} from '../lib/sheet';
import {K} from './kit';

const OL = K.ink;

/** spiral path of the PHerc. 1667 sheet, fitted to an ellipse of radii rx, ry (centre 0,0) */
export const spiralD = (rx: number, ry: number, stride = 3, sMax = 1e9) => {
  let d = '';
  for (let i = 0; i < SPIRAL.length; i += stride) {
    const q = SPIRAL[i];
    if (q.s > sMax) break;
    d += (i ? 'L' : 'M') + ((q.x / R_OUT) * rx).toFixed(2) + ' ' + ((q.y / (R_OUT * SQUASH)) * ry).toFixed(2);
  }
  return d;
};

const lumpy = (x0: number, x1: number, y: number, amp: number, seed: number, n = 28) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    pts.push([x, y + amp * noise1(i * 0.7, seed) + amp * 0.5 * noise1(i * 2.1, seed + 3)]);
  }
  return pts;
};

/** PHerc. 1667: length 8 cm, diameter 2 cm (4:1), lying along x, end face toward +x */
export const Roll1667: React.FC<{x: number; y: number; s?: number; crumbs?: number; endGlow?: number; f?: number; upright?: boolean; spin?: number}> = ({
  x,
  y,
  s = 1,
  crumbs = 0,
  endGlow = 0,
  upright = false,
  spin = 0,
}) => {
  const L = 300;
  const R = 75;
  const top = lumpy(-L / 2, L / 2, -R, 4.5, 3);
  const bot = lumpy(L / 2, -L / 2, R, 3.5, 8);
  const ex = L / 2; // end-face centre x
  const erx = R * 0.36;
  let body = `M${-L / 2 + 6} ${-R + 10}`;
  for (const [px, py] of top) body += `L${px.toFixed(1)} ${py.toFixed(1)}`;
  body += `A${erx} ${R} 0 0 1 ${ex} ${R}`;
  for (const [px, py] of bot) body += `L${px.toFixed(1)} ${py.toFixed(1)}`;
  body += `Q${-L / 2 - 16} ${R - 10} ${-L / 2 - 14} 0 Q${-L / 2 - 14} ${-R + 4} ${-L / 2 + 6} ${-R + 10}Z`;
  // surface marks slide with the rotation when the roll turns on the scanner stage
  const marks = Array.from({length: 18}, (_, i) => {
    const ph = hash(i, 1) * Math.PI * 2 + spin;
    const v = Math.sin(ph); // -1..1 across the visible face
    const vis = Math.cos(ph) > -0.1;
    return {i, xx: -L / 2 + 20 + hash(i, 2) * (L - 50), yy: v * R * 0.85, w: 14 + hash(i, 3) * 40, vis, light: hash(i, 4) > 0.6};
  });
  return (
    <g transform={`translate(${x} ${y}) rotate(${upright ? -90 : 0}) scale(${s})`}>
      {!upright && <ellipse cx={0} cy={R + 14} rx={L * 0.58} ry={14} fill="rgba(22,42,50,0.18)" />}
      <path d={body} fill={K.char} stroke={OL} strokeWidth={4 / s} strokeLinejoin="round" />
      {/* key light along the top */}
      <path d={`M${-L / 2 + 4} ${-R + 22} Q0 ${-R + 4} ${L / 2 - 20} ${-R + 18}`} fill="none" stroke={K.charHi} strokeWidth={14} strokeLinecap="round" opacity={0.8} />
      <path d={`M${-L / 2 + 10} ${R - 16} Q0 ${R - 4} ${L / 2 - 24} ${R - 14}`} fill="none" stroke={K.charDeep} strokeWidth={14} strokeLinecap="round" opacity={0.7} />
      {marks.map((m) =>
        m.vis ? (
          <path
            key={m.i}
            d={`M${m.xx} ${m.yy} q${m.w / 2} ${(hash(m.i, 6) - 0.5) * 6} ${m.w} ${(hash(m.i, 7) - 0.5) * 4}`}
            stroke={m.light ? '#5A4C42' : K.charDeep}
            strokeWidth={m.light ? 3 : 4}
            fill="none"
            strokeLinecap="round"
          />
        ) : null,
      )}
      {/* end face: the wound sheet seen end-on (the same spiral the scan finds) */}
      <ellipse cx={ex} cy={0} rx={erx} ry={R} fill="#3A2E27" stroke={OL} strokeWidth={3.5 / s} />
      <g transform={`translate(${ex} 0)`}>
        <path d={spiralD(erx * 0.92, R * 0.92, 4)} fill="none" stroke="#6B5646" strokeWidth={1.4} opacity={0.9} />
        {endGlow > 0 && <path d={spiralD(erx * 0.92, R * 0.92, 4)} fill="none" stroke={K.saffron} strokeWidth={2} opacity={endGlow} />}
      </g>
      {crumbs > 0 &&
        Array.from({length: 9}, (_, i) => {
          const t = Math.max(0, crumbs - hash(i, 9) * 0.35);
          if (t <= 0) return null;
          const cx = -40 + hash(i, 10) * 120;
          const fall = Math.min(R + 2 - (-R - 4), t * t * 260);
          return <rect key={i} x={cx + t * (hash(i, 11) - 0.5) * 40} y={-R - 4 + fall} width={5 + hash(i, 12) * 6} height={4 + hash(i, 13) * 5} fill={K.char} transform={`rotate(${t * 220 * (hash(i, 14) - 0.5)} ${cx} ${-R + fall})`} opacity={Math.min(1, (1.6 - t) * 2)} />;
        })}
    </g>
  );
};

/** the museum cradle the roll rests on, with an optional specimen label card */
export const Cradle: React.FC<{x: number; y: number; s?: number; w?: number}> = ({x, y, s = 1, w = 360}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={58} rx={w * 0.6} ry={14} fill="rgba(22,42,50,0.16)" />
    <path d={`M${-w / 2} 10 L${w / 2} 10 L${w / 2 - 14} 52 L${-w / 2 + 14} 52Z`} fill="#D9D4CB" stroke={OL} strokeWidth={4 / s} strokeLinejoin="round" />
    <path d={`M${-w / 2 + 40} 10 Q${-w / 2 + 70} -22 ${-w / 2 + 100} 10Z`} fill="#ECE8E1" stroke={OL} strokeWidth={3.5 / s} />
    <path d={`M${w / 2 - 100} 10 Q${w / 2 - 70} -22 ${w / 2 - 40} 10Z`} fill="#ECE8E1" stroke={OL} strokeWidth={3.5 / s} />
  </g>
);

/** PHerc. Paris 4: a larger, crushed and irregular roll (deliberately a different silhouette and colour) */
export const RollParis4: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => {
  const n = 40;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rx = 250 * (1 + 0.07 * noise1(i * 0.6, 31));
    const ry = 92 * (1 + 0.12 * noise1(i * 0.8, 32)) * (Math.sin(a) > 0 ? 1 : 0.9);
    d += (i ? 'L' : 'M') + (Math.cos(a) * rx).toFixed(1) + ' ' + (Math.sin(a) * ry + Math.cos(a * 2) * 10).toFixed(1);
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={104} rx={290} ry={16} fill="rgba(22,42,50,0.18)" />
      <path d={d + 'Z'} fill="#4A3E35" stroke={OL} strokeWidth={4 / s} strokeLinejoin="round" />
      <path d="M-220 -40 Q-60 -78 200 -46" fill="none" stroke="#6E5D4F" strokeWidth={14} strokeLinecap="round" opacity={0.8} />
      {Array.from({length: 14}, (_, i) => (
        <path
          key={i}
          d={`M${-200 + hash(i, 40) * 380} ${-60 + hash(i, 41) * 130} q${12 + hash(i, 42) * 30} ${(hash(i, 43) - 0.5) * 30} ${30 + hash(i, 44) * 40} ${(hash(i, 45) - 0.5) * 20}`}
          stroke="#2A221D"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      {/* crushed end face: a flattened, folded spiral */}
      <g transform="translate(236 6)">
        <ellipse cx={0} cy={0} rx={30} ry={78} fill="#5A4A3E" stroke={OL} strokeWidth={3.5 / s} />
        {Array.from({length: 9}, (_, i) => (
          <ellipse key={i} cx={0} cy={i % 2 ? 3 : -3} rx={26 - i * 2.8} ry={72 - i * 8} fill="none" stroke="#7E6A59" strokeWidth={1.5} />
        ))}
      </g>
    </g>
  );
};

/** historical reconstruction: the roll seen end-on, outer turns present down to radius rCur (px) */
export const EndView: React.FC<{x: number; y: number; rFull: number; rCur: number; rCore: number; seed?: number; glow?: number}> = ({x, y, rFull, rCur, rCore, seed = 3, glow = 0}) => {
  // Archimedean spiral from the core out to rCur (the outer part is peeled away progressively)
  const turns = 30;
  const pitch = (rFull - rCore) / turns;
  let d = '';
  let dIn = '';
  const N = turns * 90;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * turns * Math.PI * 2;
    let r = rCore + (pitch * th) / (Math.PI * 2);
    r += 0.35 * pitch * noise1(th * 0.8, seed);
    if (r > rCur) break;
    const px = r * Math.cos(th);
    const py = r * Math.sin(th) * 0.95;
    d += (d ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1);
    if (r < rCore + (rCur - rCore) * 0.7) dIn += (dIn ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1);
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={0} cy={0} r={rCur + 3} fill="#3C2F25" stroke={K.sepiaInk} strokeWidth={4} />
      <path d={d} fill="none" stroke="#8C7258" strokeWidth={2} />
      {glow > 0 && <path d={dIn} fill="none" stroke={K.saffron} strokeWidth={2.2} opacity={glow} />}
    </g>
  );
};
