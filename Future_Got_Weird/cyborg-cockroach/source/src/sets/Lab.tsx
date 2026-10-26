// The laboratory test arena: a soft lab backdrop (screen space, panned with the camera), the grid mat on the arena floor,
// foam obstacles, and the silicone target held in its aluminium cradle. World units are mm; the floor is y = 0.
import React from 'react';
import {Cam, proj, depth, scaleAt} from '../lib/cam';
import {V3, V2, IDENT, Frame, add} from '../lib/v3';
import {projPoly, projSeg, polyPath, fmt, boxFaces} from '../lib/g3';
import {INK} from '../lib/ink';
import {lit, shade, mix} from '../lib/color';
import {lightW} from '../rig/Gear';
import {dot} from '../lib/v3';

export const LAB = {
  wallTop: '#C9D6DD',
  wallBot: '#E4EAEC',
  mat: '#D7DED6',
  matDeep: '#C3CCC2',
  grid: '#A9B7AA',
  grid5: '#93A396',
  alu: '#C2CAD2',
  silicone: '#F0B9A5',
  siliconeDeep: '#D98E78',
  foam: '#F2D48C',
  foamB: '#9FCBE6',
};

/** Out-of-focus lab behind the arena: shelves, bottles, a monitor glow, ceiling light bokeh. Pans with the camera's
 *  heading and tilt so it reads as distant (parallax), and is blurred like a macro lens background. */
export const LabBackdrop: React.FC<{id: string; cam: Cam; blur?: number; dim?: number}> = ({id, cam, blur = 14, dim = 0}) => {
  const az = Math.atan2(cam.fwd[0], cam.fwd[2]);
  const el = Math.asin(Math.max(-1, Math.min(1, cam.fwd[1])));
  const ox = -az * 520, oy = el * 900;
  const items: React.ReactNode[] = [];
  // repeating shelf bays (wrap so any heading has content)
  const bay = 760;
  const base = Math.floor((-ox - 600) / bay) - 1;
  for (let k = base; k < base + 5; k++) {
    const x = k * bay + ox;
    const s = (k * 37) % 5;
    items.push(
      <g key={`b${k}`} transform={`translate(${fmt(x)} ${fmt(oy)})`}>
        <rect x={40} y={260} width={620} height={16} fill="#9FB0BA" />
        <rect x={40} y={560} width={620} height={16} fill="#9FB0BA" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={70 + i * 120 + (s * 13) % 30} y={180 - ((i + s) % 3) * 30} width={56} height={80 + ((i + s) % 3) * 30} rx={12} fill={['#E8F1F4', '#BFD8E2', '#F2E3C7', '#D3E3D0', '#E9D3D8'][(i + s) % 5]} />
        ))}
        {[0, 1, 2].map((i) => (
          <rect key={`c${i}`} x={90 + i * 190} y={470 - (i % 2) * 40} width={130} height={90 + (i % 2) * 40} rx={10} fill={['#C7D5DC', '#DCE6EA', '#B8C9D2'][i]} />
        ))}
        <rect x={420} y={620} width={220} height={150} rx={10} fill="#2E3E4B" />
        <rect x={432} y={632} width={196} height={118} rx={6} fill="#4E86A8" opacity={0.85} />
      </g>,
    );
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(LAB.wallTop, '#1A2630', dim)} />
          <stop offset="1" stopColor={mix(LAB.wallBot, '#1A2630', dim)} />
        </linearGradient>
        <filter id={`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={blur} />
        </filter>
      </defs>
      <rect x={-50} y={-50} width={1180} height={2020} fill={`url(#${id}-wall)`} />
      <g filter={`url(#${id}-blur)`} opacity={1 - dim * 0.6}>
        {items}
        {[0, 1, 2, 3].map((i) => (
          <circle key={`l${i}`} cx={fmt(((i * 330 + ox * 1.3) % 1400 + 1400) % 1400 - 160)} cy={fmt(-40 + oy * 1.2)} r={70} fill="#FFFFFF" opacity={0.7} />
        ))}
      </g>
    </g>
  );
};

/** grid mat on the floor: tiles clipped to the near plane, 10 mm lines, bolder every 50 mm, fading with distance */
export const ArenaFloor: React.FC<{id: string; cam: Cam; x0?: number; x1?: number; z0?: number; z1?: number; fade?: number; color?: string}> = ({id, cam, x0 = -260, x1 = 320, z0 = -240, z1 = 240, fade = 900, color = LAB.mat}) => {
  const mat = projPoly(cam, [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]]);
  const lines: React.ReactNode[] = [];
  const step = 10;
  const addLine = (a: V3, b: V3, bold: boolean, k: string) => {
    const s = projSeg(cam, a, b);
    if (!s) return;
    const mid: V3 = [(a[0] + b[0]) / 2, 0, (a[2] + b[2]) / 2];
    const d = Math.max(1, depth(cam, mid));
    const op = Math.max(0, Math.min(0.85, 1.4 - d / fade)) * Math.min(1, 0.45 + d / 400);
    if (op <= 0.02) return;
    const w = Math.max(0.6, Math.min(3.2, (bold ? 0.6 : 0.32) * scaleAt(cam, mid)));
    lines.push(<path key={k} d={`M${fmt(s[0][0])} ${fmt(s[0][1])} L${fmt(s[1][0])} ${fmt(s[1][1])}`} stroke={bold ? LAB.grid5 : LAB.grid} strokeWidth={w} opacity={op} />);
  };
  for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) {
    // split long lines into pieces so the fade follows depth
    for (let z = z0; z < z1; z += 40) addLine([x, 0, z], [x, 0, Math.min(z1, z + 40)], x % 50 === 0, `x${x}_${z}`);
  }
  for (let z = Math.ceil(z0 / step) * step; z <= z1; z += step) {
    for (let x = x0; x < x1; x += 40) addLine([x, 0, z], [Math.min(x1, x + 40), 0, z], z % 50 === 0, `z${z}_${x}`);
  }
  return (
    <g>
      {mat && <path d={polyPath(mat)} fill={color} />}
      {lines}
    </g>
  );
};

/** a lit box (fixture parts, foam blocks) */
export const Solid: React.FC<{cam: Cam; c: V3; h: V3; color: string; f?: Frame; ink?: number; k?: number}> = ({cam, c, h, color, f = IDENT, ink = 1.8, k = 1}) => {
  const L = lightW(cam);
  return (
    <g>
      {boxFaces(cam, f, c, h).map((fc, i) => {
        const t = dot(fc.n, L) * k;
        return <path key={i} d={polyPath(fc.pts)} fill={t >= 0 ? lit(color, 0.32 * t) : shade(color, -0.4 * t)} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />;
      })}
    </g>
  );
};

/** The silicone target in its aluminium cradle: the open face is the plane x = 0, facing +x, centred on z = 0. */
export const TARGET = {face: 0, cy: 30, hy: 17, hz: 19.5, depth: 16};
export const TargetFixture: React.FC<{id: string; cam: Cam; mark?: number}> = ({id, cam, mark = 0}) => {
  const sc = scaleAt(cam, [0, 30, 0]);
  const ink = Math.max(1.2, Math.min(4, sc * 0.3));
  const parts: {z: number; el: React.ReactNode}[] = [];
  const box = (key: string, c: V3, h: V3, color: string) => parts.push({z: depth(cam, c), el: <Solid key={key} cam={cam} c={c} h={h} color={color} ink={ink} />});
  box('base', [-14, 2.2, 0], [24, 2.2, 30], LAB.alu);
  box('back', [-21.5, 30, 0], [2.5, 26, 23], shade(LAB.alu, 0.08));
  box('cheekL', [-10, 30, -21.5], [10.5, 21, 1.8], LAB.alu);
  box('cheekR', [-10, 30, 21.5], [10.5, 21, 1.8], LAB.alu);
  box('sil', [-TARGET.depth / 2, TARGET.cy, 0], [TARGET.depth / 2, TARGET.hy, TARGET.hz], LAB.silicone);
  parts.sort((a, b) => b.z - a.z);
  // screws on the visible cheek faces
  const screws: V3[] = [[-4, 14, 23.4], [-4, 46, 23.4], [-16, 14, 23.4], [-16, 46, 23.4], [-4, 14, -23.4], [-4, 46, -23.4], [-16, 14, -23.4], [-16, 46, -23.4]];
  const faceVis = (z: number) => (z > 0 ? cam.eye[2] > 23.3 : cam.eye[2] < -23.3);
  return (
    <g>
      {parts.map((p) => p.el)}
      {/* silicone sheen on the open face */}
      {cam.eye[0] > 0 && (() => {
        const q = projPoly(cam, [[0.05, 15, -17.5], [0.05, 15, 17.5], [0.05, 45, 17.5], [0.05, 45, -17.5]]);
        const g = projPoly(cam, [[0.06, 36, -14], [0.06, 36, -6], [0.06, 43, -9], [0.06, 43, -15]]);
        return (
          <g>
            {q && <path d={polyPath(q)} fill="#FFFFFF" opacity={0.08} />}
            {g && <path d={polyPath(g)} fill="#FFFFFF" opacity={0.35} />}
          </g>
        );
      })()}
      {screws.filter((p) => faceVis(p[2])).map((p, i) => {
        const c = proj(cam, p);
        const r = 1.6 * scaleAt(cam, p);
        return (
          <g key={i}>
            <circle cx={fmt(c[0])} cy={fmt(c[1])} r={fmt(r)} fill="#8C97A2" stroke={INK} strokeWidth={ink * 0.6} />
            <path d={`M${fmt(c[0] - r * 0.6)} ${fmt(c[1])} L${fmt(c[0] + r * 0.6)} ${fmt(c[1])}`} stroke={INK} strokeWidth={ink * 0.5} />
          </g>
        );
      })}
    </g>
  );
};

/** foam obstacle block */
export const Foam: React.FC<{cam: Cam; c: V3; h: V3; color?: string; yaw?: number}> = ({cam, c, h, color = LAB.foam, yaw = 0}) => {
  const f: Frame = {o: [0, 0, 0], x: [Math.cos(yaw), 0, -Math.sin(yaw)], y: [0, 1, 0], z: [Math.sin(yaw), 0, Math.cos(yaw)]};
  return <Solid cam={cam} c={c} h={h} color={color} f={{...f, o: [0, 0, 0]}} ink={Math.max(1.2, Math.min(3.5, scaleAt(cam, c) * 0.3))} />;
};
