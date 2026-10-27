// V2 lab, in the finished Shorts' lab style (moth-silk-web-shooter v6 LabArt6: pale mint wall, shelves of coloured jars,
// a teal stripe, dark bench top over teal cabinet fronts), plus the experiment's props drawn flat through the insect's
// orthographic views (ortho.ts, millimetres): the silicone target in its aluminium cradle, foam course blocks, and the
// bench-top surface the insects walk on.
import React from 'react';
import {V2, V3} from '../../lib/v3';
import {Inked, INK} from '../../lib/ink';
import {lit as litC, shade as shadeC, mix} from '../../lib/color';
import {Lin} from '../../lib/shade';
import {View, P, f2, hull, smoothClosed, polyD} from '../roach/ortho';
import {Cel, InkFlat, inkFor} from '../roach/Roach2D';

const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${f2(x0 + r)},${f2(y0)} H${f2(x1 - r)} Q${f2(x1)},${f2(y0)} ${f2(x1)},${f2(y0 + r)} V${f2(y1 - r)} Q${f2(x1)},${f2(y1)} ${f2(x1 - r)},${f2(y1)} H${f2(x0 + r)} Q${f2(x0)},${f2(y1)} ${f2(x0)},${f2(y1 - r)} V${f2(y0 + r)} Q${f2(x0)},${f2(y0)} ${f2(x0 + r)},${f2(y0)} Z`;

export const LAB2 = {
  wallTop: '#C9DCE6',
  wallBot: '#E3EDF1',
  stripe: '#2FA7A0',
  shelf: '#9AAAB3',
  benchTop: '#55626B',
  benchTopLit: '#6A7882',
  cabinet: '#3A6E7A',
  cabinetDeep: '#2C5560',
  surface: '#E9EEF0', // the white experiment tray / mat on the bench
  surfaceShade: '#CBD5DA',
  silicone: '#F2A79A',
  siliconeDeep: '#D9877A',
  alu: '#B9C7D2',
  aluDeep: '#8D9BA6',
  foamY: '#F2C46A',
  foamB: '#8FC7E8',
  foamR: '#E98F7A',
};

/** the lab wall in scene px (2D): gradient, a teal stripe, shelves of jars, a window. Place it inside a camera Layer. */
export const LabWall2: React.FC<{id: string; jars?: number}> = ({id, jars = 1}) => (
  <g>
    <Lin id={`${id}-w`} d="M-2500,-1500 H3500 V3200 H-2500 Z" from={{x: 0, y: -400}} to={{x: 0, y: 1400}} stops={[[0, LAB2.wallTop], [1, LAB2.wallBot]]} />
    <path d="M-2500,960 H3500 V1010 H-2500 Z" fill={LAB2.stripe} opacity={0.75} />
    {[-1800, -600, 600, 1800].map((x, i) => (
      <g key={i}>
        <path d={`M${x - 360},${420} H${x + 360} V${436} H${x - 360} Z`} fill={LAB2.shelf} />
        <path d={`M${x - 360},${700} H${x + 360} V${716} H${x - 360} Z`} fill={LAB2.shelf} />
        {jars > 0 &&
          [0, 1, 2, 3, 4, 5].map((k) => {
            const bx = x - 300 + k * 110;
            const h = 90 + ((k * 37 + i * 13) % 50);
            const c = ['#7FC9C2', '#F2C46A', '#E98F7A', '#BFD8E6', '#9ED0B0', '#F0E2C0'][(k + i) % 6];
            return (
              <g key={k}>
                <path d={rr(bx, 420 - h, bx + 56, 420, 12)} fill={c} opacity={0.85} />
                <path d={rr(bx + 4, 700 - h * 0.8, bx + 52, 700, 10)} fill={['#BFD8E6', '#F2C46A', '#7FC9C2'][(k + i * 2) % 3]} opacity={0.75} />
              </g>
            );
          })}
      </g>
    ))}
    <path d="M1250,120 H1700 V860 H1250 Z" fill="#EAF6FB" stroke={LAB2.shelf} strokeWidth={16} />
    <path d="M1475,120 V860 M1250,490 H1700" stroke={LAB2.shelf} strokeWidth={10} />
  </g>
);

/** bench top edge at scene y = top and the cabinet fronts below (2D, scene px) */
export const Bench2: React.FC<{id: string; top: number; k?: number}> = ({id, top, k = 1}) => (
  <g>
    <Inked w={5 * k}>
      <InkFlat d={`M-2500,${top - 14} H3500 V${top + 18} H-2500 Z`} fill={LAB2.benchTop} />
      <InkFlat d={`M-2500,${top + 18} H3500 V${top + 1400} H-2500 Z`} fill={LAB2.cabinet} />
    </Inked>
    <path d={`M-2500,${top - 13} H3500`} stroke="#FFFFFF" strokeWidth={2 * k} opacity={0.25} />
    {[-1700, -900, -100, 700, 1500, 2300].map((x) => (
      <g key={x}>
        <path d={rr(x - 360, top + 60, x + 360, top + 560, 18)} fill="none" stroke="#244852" strokeWidth={6 * k} />
        <path d={`M${x - 80},${top + 100} H${x + 80}`} stroke="#C9D6DC" strokeWidth={10 * k} strokeLinecap="round" />
      </g>
    ))}
  </g>
);

// ------------------------------------------------------------------ props in insect millimetres (ortho views)
/** corners of a world box (x0..x1, y0..y1, z0..z1) projected, as a hull */
export const boxHull = (v: View, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): V2[] => {
  const pts: V2[] = [];
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) pts.push(P(v, [x, y, z]));
  return hull(pts);
};
/** a flat box with its visible faces in three tones (top lit, the face toward the light mid, the other dark) */
export const Box2D: React.FC<{id: string; v: View; b: [number, number, number, number, number, number]; color: string; ink?: number; hi?: number}> = ({id, v, b, color, ink, hi = 0.25}) => {
  const [x0, x1, y0, y1, z0, z1] = b;
  const w = ink ?? inkFor(v);
  const face = (pts: V3[], n: V3, tone: string, key: string) => {
    if (n[0] * v.F[0] + n[1] * v.F[1] + n[2] * v.F[2] <= 0.02) return null;
    return <path key={key} d={polyD(pts.map((p) => P(v, p)))} fill={tone} stroke={shadeC(tone, 0.25)} strokeWidth={1} strokeLinejoin="round" />;
  };
  return (
    <g>
      <Inked w={w}>
        <InkFlat d={smoothClosed(boxHull(v, x0, x1, y0, y1, z0, z1)).replace(/Q[^ ]+ /g, 'L')} fill={color} />
      </Inked>
      {face([[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], [0, 1, 0], litC(color, 0.2), 't')}
      {face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], color, 'f')}
      {face([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], shadeC(color, 0.2), 'r')}
      {face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], litC(color, 0.06), 'l')}
      {face([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], shadeC(color, 0.28), 'b')}
      <path d={polyD(boxHull(v, x0, x1, y0, y1, z0, z1))} fill="none" stroke={INK} strokeWidth={f2(w * 0.9)} strokeLinejoin="round" />
    </g>
  );
};

/** the silicone target: a soft pink translucent block standing on an aluminium base plate with a backing plate at its
 *  far end. dir = 1: its face is the plane x = face and the block extends toward +x (an insect heading +x meets it).
 *  `dent` 0..1 shows the needle's entry dimple; `glow` 0..1 an amber dose cloud inside (delivery). */
export const Target2D: React.FC<{id: string; v: View; face: number; dir?: 1 | -1; h?: number; half?: number; depth?: number; dent?: number; entryY?: number; veil?: number}> = ({id, v, face, dir = 1, h = 34, half = 18, depth = 30, dent = 0, entryY = 27, veil}) => {
  const xA = dir > 0 ? face : face - depth, xB = dir > 0 ? face + depth : face;
  // veil: the silicone again, translucent, drawn over the insect's gear so a needle inside it reads as inside
  if (veil !== undefined) {
    const q = boxHull(v, xA, xB, 0, h, -half, half);
    return <path d={polyD(q)} fill={LAB2.silicone} opacity={veil} />;
  }
  return (
    <g>
      <Box2D id={`${id}-base`} v={v} b={[xA - 5, xB + 7, -3, 0, -half - 6, half + 6]} color={LAB2.alu} />
      <Box2D id={`${id}-back`} v={v} b={dir > 0 ? [xB, xB + 3.5, 0, h + 5, -half - 4, half + 4] : [xA - 3.5, xA, 0, h + 5, -half - 4, half + 4]} color={LAB2.aluDeep} />
      <g opacity={0.93}>
        <Box2D id={`${id}-sil`} v={v} b={[xA, xB, 0, h, -half, half]} color={LAB2.silicone} hi={0.3} />
      </g>
      {dent > 0 && (() => {
        const c = P(v, [face, entryY, 0]);
        return <ellipse cx={f2(c[0])} cy={f2(c[1])} rx={f2(0.9 * v.s * dent)} ry={f2(1.5 * v.s * dent)} fill={LAB2.siliconeDeep} opacity={0.7} />;
      })()}
    </g>
  );
};

/** the bench-top surface (a pale tray) as a world plane y = 0 */
export const Surface2D: React.FC<{v: View; x0: number; x1: number; z0: number; z1: number; color?: string; lines?: number}> = ({v, x0, x1, z0, z1, color = LAB2.surface, lines = 0}) => {
  const q = [P(v, [x0, 0, z0]), P(v, [x1, 0, z0]), P(v, [x1, 0, z1]), P(v, [x0, 0, z1])];
  const ls: React.ReactNode[] = [];
  if (lines > 0)
    for (let x = Math.ceil(x0 / lines) * lines; x <= x1; x += lines) {
      const a = P(v, [x, 0, z0]), b = P(v, [x, 0, z1]);
      ls.push(<path key={`x${x}`} d={`M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`} stroke={shadeC(color, 0.08)} strokeWidth={1.4} />);
    }
  return (
    <g>
      <path d={polyD(q)} fill={color} />
      {ls}
    </g>
  );
};
