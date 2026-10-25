// Glass Climbing V3: the set, outside a glass office building, in the bay's world plane (world/geo.ts: the glass face
// is the plane x = 0, the climber on +x, a mild oblique projection across the face's depth z, so the facade is seen at
// an angle, receding behind him to the right).
//   - Facade: a curtain wall on a brick plinth. Floors every 3.4 m are marked by spandrel bands (opaque glass over the
//     slab); mullions every 2.26 m. The glass reflects the sky (lighter above), soft clouds and the skyline opposite;
//     faintly, through it, each floor's ceiling and its lights. Toward its far end it hazes (atmospheric perspective).
//   - At the far end (screen right) the building's corner opens onto the city: a skyline in two hazy layers and the sky,
//     on parallax layers behind the world.
//   - Pavement in front, a kerb, and the step stool.
// Crew finish: flat shapes, one ink contour per object, gradients from the upper-left key light, restrained detail.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {INK, Inked} from '../dc/ink';
import {fmt, P, V} from '../dc/math';
import {Lin} from '../dc/shade';
import {pr} from '../world/geo';
import {BRICK_TOP, FLOOR_H, STOOL} from './set3';

const BRICK = '#A9573D';
const MORTAR = '#D9C3A6';
const ALU = '#B6C1C9';
const SPANDREL = '#2E4A5C';

/** the facade's extent: its top (far above any camera) and its depth range across the face (near the camera / the
 *  building's far corner) */
export const FACADE = {top: -14000, zNear: 2600, zFar: -3000};
export const MULLIONS3 = Array.from({length: 4}).map((_, i) => 2450 - i * 1400 - 700);
/** floor slabs (spandrel band centres), from the first floor up */
export const FLOORS = Array.from({length: 11}).map((_, i) => BRICK_TOP - 1350 - i * FLOOR_H);

const q = (y: number, z: number, x = 0): V => pr({x, y, z});
const quad = (a: V, b: V, c: V, d: V) => `M${P(a)} L${P(b)} L${P(c)} L${P(d)} Z`;
const band = (y0: number, y1: number, z0: number, z1: number, x = 0) => quad(q(y0, z0, x), q(y0, z1, x), q(y1, z1, x), q(y1, z0, x));
const rnd = (i: number, s: number) => ((((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1) + 1) % 1);

/** the reflected skyline across the face (in face coordinates y, z): towers of varied height along z */
const reflectedSkyline = (yBase: number) => {
  const pts: V[] = [q(yBase, FACADE.zNear)];
  let z = FACADE.zNear;
  for (let i = 0; z > FACADE.zFar; i++) {
    const w = 380 + rnd(i, 1) * 700;
    const h = 1400 + rnd(i, 2) * 3600;
    pts.push(q(yBase - h, z), q(yBase - h, z - w));
    z -= w + rnd(i, 3) * 160;
  }
  pts.push(q(yBase, FACADE.zFar));
  return `M${pts.map((p) => P(p)).join(' L')} Z`;
};

export const Facade: React.FC<{id: string; k: number}> = ({id, k}) => {
  const {top, zNear: zn, zFar: zf} = FACADE;
  const g1 = BRICK_TOP;
  const glass = band(top, g1, zn, zf);
  const brick = band(g1, 0, zn, zf);
  const course = 46;
  const rows = Math.ceil(-g1 / course);
  const joints: string[] = [];
  for (let r = 0; r < rows; r++) {
    const y = g1 + r * course;
    for (let z = zf + (r % 2 ? 0 : 66); z < zn; z += 133) joints.push(`M${P(q(y, z))} L${P(q(Math.min(0, y + course), z))}`);
  }
  return (
    <g>
      {/* the glass: a sky reflection (lighter up high), deepening toward the ground */}
      <Lin id={`${id}-gl`} d={glass} from={q(g1, 0)} to={q(g1 - 5200, 0)} stops={[[0, '#5E8FA0'], [0.35, '#8DBCC8'], [1, '#C9E4EC']]} />
      {/* through the glass, faintly: each floor's ceiling band and its lights */}
      {FLOORS.map((y, i) => (
        <g key={`in${i}`} opacity={0.5}>
          <path d={band(y + 95, y + 260, zn, zf)} fill="#2B4250" opacity={0.35} />
          {Array.from({length: 26}).map((_, j) => {
            const z = zn - 140 - j * 280;
            const c = q(y + 150, z);
            return <ellipse key={j} cx={fmt(c.x)} cy={fmt(c.y)} rx={34} ry={7} fill="#F6F0D8" opacity={0.55} />;
          })}
        </g>
      ))}
      {/* reflections: the skyline opposite and soft clouds, sheared with the face */}
      <path d={reflectedSkyline(g1 - 40)} fill="#46707F" opacity={0.42} />
      {[[-5200, 1800], [-7000, -900], [-4300, -2600], [-8800, 600]].map(([y, z], i) => (
        <path key={i} d={`M${P(q(y, z))} Q${P(q(y - 260, z - 700))} ${P(q(y, z - 1500))} Z`} fill="#FFFFFF" opacity={0.2} />
      ))}
      {/* long soft diagonal sheens */}
      {[1900, 700, -900, -2300, -3600].map((z, i) => (
        <path key={`sh${i}`} d={quad(q(top, z), q(top, z - 260), q(g1, z - 900), q(g1, z - 640))} fill="#FFFFFF" opacity={0.07 + 0.03 * (i % 2)} />
      ))}
      {/* the brick plinth's face: courses and staggered joints */}
      <Inked w={3 * k}>
        <path d={brick} fill={BRICK} />
      </Inked>
      <Lin id={`${id}-bs`} d={brick} from={q(-400, zf)} to={q(-400, zn)} stops={[[0, '#000000', 0.14], [0.6, '#000000', 0], [1, '#FFFFFF', 0.06]]} />
      {Array.from({length: rows}).map((_, r) => (
        <path key={`c${r}`} d={`M${P(q(g1 + r * course, zf))} L${P(q(g1 + r * course, zn))}`} stroke={MORTAR} strokeWidth={5} opacity={0.7} />
      ))}
      <path d={joints.join(' ')} stroke={MORTAR} strokeWidth={4} opacity={0.5} />
      {Array.from({length: 120}).map((_, i) => {
        const z = zf + ((i * 977) % (zn - zf)), y = g1 + 10 + ((i * 331) % (-g1 - 20));
        const c = q(y, z);
        return <circle key={`f${i}`} cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(3 + (i % 3))} fill={i % 2 ? lit(BRICK, 0.25) : shade(BRICK, 0.35)} opacity={0.55} />;
      })}
      {/* spandrels: opaque glass over each slab, a lit top edge */}
      {FLOORS.map((y, i) => (
        <Inked key={`sp${i}`} w={2.4 * k}>
          <path d={band(y - 95, y + 95, zn, zf)} fill={SPANDREL} />
          <path d={band(y - 95, y - 82, zn, zf)} fill="#7FA1B2" opacity={0.8} />
        </Inked>
      ))}
      {/* mullions (a lit side toward the key light) */}
      {MULLIONS3.map((z, i) => (
        <Inked key={`m${i}`} w={2.4 * k}>
          <path d={quad(q(top, z - 18), q(top, z + 18), q(g1, z + 18), q(g1, z - 18))} fill={ALU} />
          <path d={quad(q(top, z - 18), q(top, z - 18, 34), q(g1, z - 18, 34), q(g1, z - 18))} fill="#E1E7EB" />
        </Inked>
      ))}
      {/* the base channel on the bricks */}
      <Inked w={2.4 * k}>
        <path d={quad(q(g1 - 32 - 30, zf, 34), q(g1 - 32 - 30, zn, 34), q(g1 - 2, zn, 34), q(g1 - 2, zf, 34))} fill="#BAC6CE" />
        <path d={quad(q(g1 - 62, zf, 0), q(g1 - 62, zn, 0), q(g1 - 62, zn, 34), q(g1 - 62, zf, 34))} fill="#E8EEF1" />
      </Inked>
      {/* the far end of the facade hazes into the air */}
      <Lin id={`${id}-hz`} d={quad(q(top, zn), q(top, zf), q(0, zf), q(0, zn))} from={q(-2000, -600)} to={q(-2000, zf)} stops={[[0, '#DCE8EE', 0], [1, '#DCE8EE', 0.32]]} />
      {/* the corner: the facade's far edge, a column */}
      <Inked w={3 * k}>
        <path d={quad(q(top, zf), q(top, zf - 60), q(0, zf - 60), q(0, zf))} fill={mix(ALU, '#DCE8EE', 0.3)} />
      </Inked>
    </g>
  );
};

/** behind the world, beyond the building's corner: sky and a hazy city in two layers (parallax depths 6 and 3) */
export const Sky: React.FC<{id: string}> = ({id}) => (
  <g>
    <Lin id={`${id}-s`} d="M-9000,-16000 H12000 V3000 H-9000 Z" from={{x: 0, y: -6000}} to={{x: 0, y: 200}} stops={[[0, '#6FA8CF'], [0.55, '#A9CFE2'], [0.85, '#DCEAEE'], [1, '#EFE6D6']]} />
    <ellipse cx={-2600} cy={-5200} rx={2600} ry={1800} fill="#FFF6DD" opacity={0.25} />
    {[[2600, -4200, 900], [5200, -5600, 1300], [900, -6800, 700]].map(([x, y, w], i) => (
      <path key={i} d={`M${x - w},${y} Q${x - w * 0.6},${y - w * 0.45} ${x - w * 0.1},${y - w * 0.28} Q${x + w * 0.3},${y - w * 0.55} ${x + w * 0.7},${y - w * 0.2} Q${x + w},${y - w * 0.1} ${x + w},${y} Z`} fill="#FFFFFF" opacity={0.55} />
    ))}
  </g>
);
export const City: React.FC<{id: string; far: boolean}> = ({id, far}) => {
  const out: React.ReactNode[] = [];
  let x = -5000;
  for (let i = 0; x < 9000; i++) {
    const w = (far ? 420 : 560) + rnd(i, far ? 4 : 5) * (far ? 700 : 900);
    const h = (far ? 1500 : 1100) + rnd(i, far ? 6 : 7) * (far ? 3200 : 2600);
    const base = far ? 200 : 300;
    const col = far ? mix('#8FB0C2', '#C9DCE5', rnd(i, 8) * 0.5) : mix('#5F8193', '#7E9BAA', rnd(i, 9));
    out.push(
      <g key={i}>
        <path d={`M${fmt(x)},${base} V${fmt(base - h)} H${fmt(x + w)} V${base} Z`} fill={col} />
        {!far && <path d={`M${fmt(x + w * 0.62)},${fmt(base - h)} H${fmt(x + w)} V${base} H${fmt(x + w * 0.62)} Z`} fill="#000000" opacity={0.1} />}
        {!far && Array.from({length: Math.floor(h / 260)}).map((_, j) => (
          <path key={j} d={`M${fmt(x + 40)},${fmt(base - h + 120 + j * 260)} H${fmt(x + w - 40)}`} stroke="#C8DCE6" strokeWidth={14} opacity={0.35} />
        ))}
      </g>,
    );
    x += w + rnd(i, 10) * 120;
  }
  const base = far ? 200 : 300;
  return (
    <g>
      {/* the ground at that distance: streets and roofs below the buildings' feet, hazier with distance */}
      <path d={`M-9000,${base - 2} H12000 V6000 H-9000 Z`} fill={far ? '#B7C6CB' : '#98A5A8'} />
      {!far && Array.from({length: 30}).map((_, i) => (
        <circle key={`t${i}`} cx={-4800 + i * 480 + rnd(i, 11) * 200} cy={base - 30} r={90 + rnd(i, 12) * 80} fill={mix('#6F8F6A', '#89A483', rnd(i, 13))} />
      ))}
      {out}
      {/* haze over the far layer: atmospheric perspective */}
      {far && <rect x={-9000} y={-6000} width={21000} height={6300} fill="#DCEAEE" opacity={0.35} />}
      <rect id={id} x={0} y={0} width={0} height={0} />
    </g>
  );
};

/** the pavement in front of the building: pale slabs with joints, a kerb further out */
export const Pavement: React.FC<{id: string; k: number}> = ({id, k}) => (
  <g>
    <Lin id={`${id}-pv`} d="M-9000,-2 H12000 V4000 H-9000 Z" from={{x: 0, y: 0}} to={{x: 0, y: 900}} stops={[[0, '#A7A49C'], [0.25, '#C2BEB4'], [1, '#D6D2C8']]} />
    {[60, 170, 330, 560].map((y, i) => (
      <path key={i} d={`M-9000,${y} H12000`} stroke="#8F8C84" strokeWidth={fmt((2 + i) * k)} opacity={0.35} />
    ))}
    {Array.from({length: 40}).map((_, i) => (
      <path key={`j${i}`} d={`M${-4000 + i * 360},0 L${-4000 + i * 360 + 220},600`} stroke="#8F8C84" strokeWidth={fmt(2 * k)} opacity={0.25} />
    ))}
    <path d="M-9000,640 H12000 V700 H-9000 Z" fill="#8C8A84" />
    <path d="M-9000,640 H12000" stroke="#E3E0D8" strokeWidth={fmt(4 * k)} opacity={0.8} />
    <path d={`M-9000,0 H12000`} stroke={INK} strokeWidth={fmt(2 * k)} opacity={0.4} />
  </g>
);

const STOOL_C = '#E0A33B';
/** the step stool, side-on: a top board, a low step, splayed legs */
export const Stool: React.FC<{id: string; k: number; stool?: {x0: number; x1: number; top: number}}> = ({id, k, stool = STOOL}) => {
  const {x0, x1, top} = stool;
  const th = 34;
  const step = top + (0 - top) * 0.5;
  const legs: [number, number][] = [[x0 + 30, x0 - 20], [x1 - 30, x1 + 20]];
  return (
    <g>
      <ellipse cx={(x0 + x1) / 2} cy={4} rx={(x1 - x0) * 0.62} ry={14} fill="#1C2A33" opacity={0.25} />
      <Inked w={3 * k}>
        {legs.map(([a, b], i) => (
          <Lin key={i} id={`${id}-lg${i}`} d={`M${a - 16},${top + th} L${a + 16},${top + th} L${b + 16},0 L${b - 16},0 Z`} from={{x: a - 16, y: 0}} to={{x: a + 16, y: 0}} stops={[[0, '#8E9AA2'], [1, '#5E6A72']]} />
        ))}
        <Lin id={`${id}-st`} d={`M${x0 - 4},${step} H${x1 + 4} V${step + 26} H${x0 - 4} Z`} from={{x: 0, y: step}} to={{x: 0, y: step + 26}} stops={[[0, lit(STOOL_C, 0.15)], [1, shade(STOOL_C, 0.2)]]} />
        <Lin id={`${id}-tp`} d={`M${x0},${top} H${x1} V${top + th} H${x0} Z`} from={{x: 0, y: top}} to={{x: 0, y: top + th}} stops={[[0, lit(STOOL_C, 0.3)], [0.4, STOOL_C], [1, shade(STOOL_C, 0.25)]]} />
      </Inked>
      <path d={`M${x0 + 10},${top + 5} H${x1 - 10}`} stroke={shade(STOOL_C, 0.35)} strokeWidth={4} strokeDasharray="14 10" opacity={0.7} />
    </g>
  );
};
