// The ultrasonic phased array: 16 x 16 = 256 transducers on a square board (the real research and development kits
// of this kind carry 256 x 40 kHz transducers at about 10.5 mm pitch on a ~17 cm board). Drawn in true perspective
// from the lab camera (cam3), in the Weird Crew finish: navy ink contours, flat cel tones from the upper-left key.
// Every emitter is a short silver can with a dark mesh face; `glow(i, j)` lights a face cyan when the explanatory
// overlay shows it firing (the real device shows nothing visible).
import React from 'react';
import {Cam3, project, projectPoly, polyD, topMatrix, V3} from './cam3';
import {INK} from '../dc/ink';

export const DEV = {
  half: 56, // board half-width (u)
  base: 8, // housing height
  top: 9.5, // board surface
  can: 3, // emitter can height
  n: 16,
  pitch: 6.6,
  r: 2.9,
};
export const DEV_TOP = DEV.top + DEV.can; // the emitter faces
/** emitter centre (on the face plane) */
export const emitterPos = (i: number, j: number): V3 => ({x: (i - (DEV.n - 1) / 2) * DEV.pitch, y: DEV_TOP, z: (j - (DEV.n - 1) / 2) * DEV.pitch});

type Face = {pts: V3[]; fill: string; n: V3};
const P2 = (p: {x: number; y: number}) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`;

/** an axis-aligned box: x0..x1, y0..y1, z0..z1; returns its visible faces back-to-front */
export const boxFaces = (c: Cam3, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, col: {top: string; front: string; side: string; back?: string}) => {
  const F: Face[] = [
    {pts: [{x: x0, y: y1, z: z0}, {x: x1, y: y1, z: z0}, {x: x1, y: y1, z: z1}, {x: x0, y: y1, z: z1}], fill: col.top, n: {x: 0, y: 1, z: 0}},
    {pts: [{x: x0, y: y0, z: z1}, {x: x1, y: y0, z: z1}, {x: x1, y: y1, z: z1}, {x: x0, y: y1, z: z1}], fill: col.front, n: {x: 0, y: 0, z: 1}},
    {pts: [{x: x0, y: y0, z: z0}, {x: x1, y: y0, z: z0}, {x: x1, y: y1, z: z0}, {x: x0, y: y1, z: z0}], fill: col.back ?? col.side, n: {x: 0, y: 0, z: -1}},
    {pts: [{x: x0, y: y0, z: z0}, {x: x0, y: y0, z: z1}, {x: x0, y: y1, z: z1}, {x: x0, y: y1, z: z0}], fill: col.side, n: {x: -1, y: 0, z: 0}},
    {pts: [{x: x1, y: y0, z: z0}, {x: x1, y: y0, z: z1}, {x: x1, y: y1, z: z1}, {x: x1, y: y1, z: z0}], fill: col.side, n: {x: 1, y: 0, z: 0}},
    {pts: [{x: x0, y: y0, z: z0}, {x: x1, y: y0, z: z0}, {x: x1, y: y0, z: z1}, {x: x0, y: y0, z: z1}], fill: col.top, n: {x: 0, y: -1, z: 0}},
  ];
  return F.filter((f) => {
    const p = f.pts[0];
    const v = {x: c.x - p.x, y: c.y - p.y, z: c.z - p.z};
    return v.x * f.n.x + v.y * f.n.y + v.z * f.n.z > 0;
  });
};

export const Box: React.FC<{c: Cam3; b: [number, number, number, number, number, number]; col: {top: string; front: string; side: string; back?: string}; ink: number; opacity?: number}> = ({c, b, col, ink, opacity}) => {
  const faces = boxFaces(c, ...b, col);
  return (
    <g opacity={opacity}>
      {faces.map((f, i) => (
        <path key={i} d={polyD(projectPoly(c, f.pts))} fill={f.fill} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      ))}
    </g>
  );
};

type DevProps = {c: Cam3; ink: number; glow?: (i: number, j: number) => number; id: string; round?: boolean};

export const Device: React.FC<DevProps> = ({c, ink, glow, id, round}) => {
  const H = DEV.half;
  // emitters back (-Z) to front (+Z); within a row, far side from the camera first
  const order: [number, number][] = [];
  for (let j = 0; j < DEV.n; j++) for (let i = 0; i < DEV.n; i++) order.push([i, j]);
  order.sort((a, b) => {
    const pa = emitterPos(a[0], a[1]), pb = emitterPos(b[0], b[1]);
    const da = (pa.x - c.x) ** 2 + (pa.y - c.y) ** 2 + (pa.z - c.z) ** 2;
    const db = (pb.x - c.x) ** 2 + (pb.y - c.y) ** 2 + (pb.z - c.z) ** 2;
    return db - da;
  });
  // can geometry is drawn in screen space from the projected top and bottom face circles
  const lookDown = c.y > DEV_TOP + 2;
  const cans = order.map(([i, j]) => {
    const e = emitterPos(i, j);
    const top = project(c, e);
    const bot = project(c, {x: e.x, y: DEV.top, z: e.z});
    const rx = project(c, {x: e.x + DEV.r, y: e.y, z: e.z});
    const hw = Math.hypot(rx.x - top.x, rx.y - top.y);
    const g = glow ? glow(i, j) : 0;
    return {i, j, top, bot, hw, g, e};
  }).filter((q) => q.top.d > 26 && q.bot.d > 26);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-can`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6F7C88" />
          <stop offset="0.35" stopColor="#C7D0D8" />
          <stop offset="0.6" stopColor="#9AA6B1" />
          <stop offset="1" stopColor="#5E6B77" />
        </linearGradient>
        <radialGradient id={`${id}-mesh`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#4A5763" />
          <stop offset="1" stopColor="#151B21" />
        </radialGradient>
      </defs>
      {/* housing and board */}
      <Box c={c} b={[-H - 4, H + 4, 0, DEV.base, -H - 4, H + 4]} col={{top: '#3A4652', front: '#2A333D', side: '#222A33'}} ink={ink} />
      <Box c={c} b={[-H, H, DEV.base, DEV.top, -H, H]} col={{top: '#18323A', front: '#122630', side: '#0F2028'}} ink={ink * 0.8} />
      {/* status LED on the housing front */}
      {(() => {
        const p = project(c, {x: H - 8, y: DEV.base * 0.5, z: H + 4.2});
        return <circle cx={p.x} cy={p.y} r={Math.max(0.6, 1.1 * p.k)} fill="#5BE3A0" />;
      })()}
      {/* the cans */}
      {cans.map(({i, j, top, bot, hw, g}) => {
        const dx = top.x - bot.x, dy = top.y - bot.y;
        const L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L, ny = dx / L;
        const side = `M${(bot.x + nx * hw).toFixed(2)},${(bot.y + ny * hw).toFixed(2)} L${(top.x + nx * hw).toFixed(2)},${(top.y + ny * hw).toFixed(2)} L${(top.x - nx * hw).toFixed(2)},${(top.y - ny * hw).toFixed(2)} L${(bot.x - nx * hw).toFixed(2)},${(bot.y - ny * hw).toFixed(2)} Z`;
        return (
          <g key={`${i}-${j}`}>
            {round ? (
              // V4: a round transducer can: a dark recessed seat on the board, the can's curved base (its projected
              // circle), a metallic side between the base and the face; no square corners anywhere
              (() => {
                const e = emitterPos(i, j);
                const bm = topMatrix(c, e.x, DEV.top, e.z);
                const sw = ink * 0.45 / Math.max(0.2, bm.scale);
                return (
                  <g>
                    <g transform={bm.m}>
                      <circle r={DEV.r * 1.18} fill="#0B141A" />
                      <circle r={DEV.r} fill={`url(#${id}-can)`} stroke={INK} strokeWidth={sw} />
                    </g>
                    <path d={side} fill={`url(#${id}-can)`} />
                  </g>
                );
              })()
            ) : (
              <path d={side} fill="#8E9AA5" />
            )}
            {(() => {
                const e = emitterPos(i, j);
                const fm = topMatrix(c, e.x, DEV_TOP, e.z);
                return (
                  <g transform={fm.m}>
                    {/* base ring shadow */}
                    <circle r={DEV.r} fill="#B9C4CC" stroke={INK} strokeWidth={ink * 0.5 / Math.max(0.2, fm.scale)} />
                    <circle r={DEV.r * 0.74} fill={lookDown ? `url(#${id}-mesh)` : '#1D252C'} />
                    {g > 0.01 && <circle r={DEV.r * 0.74} fill="#46CFFF" opacity={Math.min(1, g)} />}
                    {g > 0.01 && <circle r={DEV.r * 0.36} fill="#E8FBFF" opacity={Math.min(1, g) * 0.8} />}
                    {lookDown && <circle cx={-DEV.r * 0.28} cy={-DEV.r * 0.3} r={DEV.r * 0.16} fill="#FFFFFF" opacity={0.35} />}
                  </g>
                );
              })()}
          </g>
        );
      })}
    </g>
  );
};
