// V2 shared pieces: a camera with roll, the digital (scanned) twin of the roll, and small helpers.
import React from 'react';
import {K} from '../art/kit';
import {ROLL_GEO} from '../art/Roll';
import {SheetLine} from '../art/Sheet';
import {clamp, easeInOut, lerp} from '../lib/math';
import {R_OUT, SQUASH} from '../lib/sheet';

export type CamR = {x: number; y: number; z: number; r?: number}; // r: camera roll (degrees)
export const camRT = (c: CamR, cx = 960, cy = 540) => `translate(${cx} ${cy}) rotate(${-(c.r ?? 0)}) scale(${c.z}) translate(${-c.x} ${-c.y})`;
export const WorldR: React.FC<{cam: CamR; cx?: number; cy?: number; children: React.ReactNode}> = ({cam, cx = 960, cy = 540, children}) => (
  <g transform={camRT(cam, cx, cy)}>{children}</g>
);
export const toScreenR = (c: CamR, wx: number, wy: number, cx = 960, cy = 540) => {
  const a = (-(c.r ?? 0) * Math.PI) / 180;
  const dx = (wx - c.x) * c.z;
  const dy = (wy - c.y) * c.z;
  return {x: cx + dx * Math.cos(a) - dy * Math.sin(a), y: cy + dx * Math.sin(a) + dy * Math.cos(a)};
};
const lerpAng = (a: number, b: number, k: number) => {
  let d = ((b - a + 540) % 360) - 180;
  return a + d * k;
};
export const lerpCamR = (a: CamR, b: CamR, k: number): CamR => ({
  x: lerp(a.x, b.x, k),
  y: lerp(a.y, b.y, k),
  z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), k)),
  r: lerpAng(a.r ?? 0, b.r ?? 0, k),
});
/** keyframed camera: [time, cam, easing?] */
export const camKeys = (t: number, keys: [number, CamR, ((x: number) => number)?][]): CamR => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, A] = keys[i];
    const [b, B, e] = keys[i + 1];
    if (t <= b) return lerpCamR(A, B, (e ?? easeInOut)(clamp((t - a) / (b - a || 1e-6))));
  }
  return keys[keys.length - 1][1];
};
export const segK = (t: number, a: number, b: number, e: (x: number) => number = easeInOut) => e(clamp((t - a) / (b - a || 1e-6)));

/** the scanned twin of PHerc. 1667: translucent body, the nested layers seen through it, the spiral end face */
export const DigitalRoll: React.FC<{x: number; y: number; s: number; o?: number; layers?: number; upright?: boolean}> = ({x, y, s, o = 1, layers = 1, upright = false}) => {
  const {L, R, ex, erx, body} = ROLL_GEO;
  const lines: number[] = [];
  for (let r = R - 6; r > 6; r -= 4.6) lines.push(r);
  return (
    <g transform={`translate(${x} ${y}) rotate(${upright ? -90 : 0}) scale(${s})`} opacity={o}>
      <path d={body} fill="#1C4E78" fillOpacity={0.35} stroke="#7FD4FF" strokeWidth={3 / s} />
      <g opacity={0.55 * layers}>
        {lines.map((r, i) => (
          <g key={i}>
            <line x1={-L / 2 + 8} y1={-r} x2={ex - erx * Math.sqrt(1 - (r / R) ** 2) + 2} y2={-r} stroke="#7FD4FF" strokeWidth={1.1 / s} />
            <line x1={-L / 2 + 8} y1={r} x2={ex - erx * Math.sqrt(1 - (r / R) ** 2) + 2} y2={r} stroke="#7FD4FF" strokeWidth={1.1 / s} />
          </g>
        ))}
      </g>
      <ellipse cx={ex} cy={0} rx={erx} ry={R} fill="#0F2A44" stroke="#9BE3FF" strokeWidth={2.5 / s} />
      <g transform={`translate(${ex} 0) scale(${(erx * 0.92) / R_OUT} ${(R * 0.92) / (R_OUT * SQUASH)})`}>
        <SheetLine color="#BDEBFF" width={1} stride={2} />
      </g>
    </g>
  );
};

/** screen-space spiral fitted to an end face that is turning to face the camera */
export const FaceSpiral: React.FC<{cx: number; cy: number; zx: number; zy: number; width?: number; color?: string; o?: number; fill?: string; rot?: number; stride?: number; fillO?: number}> = ({cx, cy, zx, zy, width = 1.4, color = K.scanLine, o = 1, fill, rot = 0, stride = 1, fillO = 1}) => (
  <g opacity={o}>
    {fill && fillO > 0 && <ellipse cx={cx} cy={cy} rx={R_OUT * zx * 1.06} ry={R_OUT * SQUASH * zy * 1.06} fill={fill} opacity={fillO} />}
    <g transform={`translate(${cx} ${cy}) scale(${zx} ${zy}) rotate(${rot})`}>
      <SheetLine color={color} width={width} stride={stride} />
    </g>
  </g>
);

/** dust puff / crumbs (screen space) */
export const Dust: React.FC<{x: number; y: number; k: number; n?: number; seed?: number; color?: string; spread?: number}> = ({x, y, k, n = 18, seed = 1, color = '#5A4C42', spread = 1}) => {
  if (k <= 0 || k >= 1.6) return null;
  const h = (i: number, j: number) => {
    const v = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
    return v - Math.floor(v);
  };
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const vx = (h(i, 1) - 0.5) * 260 * spread;
        const vy = -h(i, 2) * 140 * spread;
        const px = x + vx * k;
        const py = y + vy * k + 380 * k * k;
        return <circle key={i} cx={px} cy={py} r={(2 + h(i, 3) * 5) * (1 - k * 0.4)} fill={color} opacity={clamp(1.4 - k)} />;
      })}
    </g>
  );
};
