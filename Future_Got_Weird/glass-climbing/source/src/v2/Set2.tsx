// Glass Climbing V2: the wall in section and the step stool, in the bay's world plane (world/geo.ts units).
//   - the glass (V1's laminated slab, art/Bay.tsx) now stands on a brick knee wall, in a base channel on the bricks;
//   - aluminium transoms (window frames) cross it every 1.6 m: fixed marks against which the climb reads;
//   - a step stool stands in front of the bricks (a top board and a low step on splayed legs).
// Crew finish: one ink contour per object, gradients from the upper-left key light, restrained texture.
import React from 'react';
import {lit, shade} from '../dc/color';
import {INK, Inked} from '../dc/ink';
import {fmt} from '../dc/math';
import {Lin} from '../dc/shade';
import {GLASS_TOP, GT} from '../art/Bay';
import {KX, KY, pr} from '../world/geo';
import {P, V} from '../dc/math';
import {brickX} from '../scenes/Micro';
import {BRICK_TOP, STOOL, TRANSOMS} from './set';

const BRICK = '#A9573D';
const MORTAR = '#D9C3A6';
/** the knee wall's thickness behind the glass line (the glass face and the brick face are flush at x = 0) */
export const BRICK_T = 150;

export const GlassWall2: React.FC<{id: string; k: number}> = ({id, k}) => {
  const y0 = GLASS_TOP, y1 = BRICK_TOP;
  const slab = `M${-GT},${y0} H0 V${y1} H${-GT} Z`;
  return (
    <g>
      <Lin id={`${id}-sl`} d={slab} from={{x: -GT, y: 0}} to={{x: 0, y: 0}} stops={[[0, '#7FC7BE', 0.75], [0.18, '#BFE8E4', 0.45], [0.5, '#E2F6F5', 0.3], [0.82, '#BFE8E4', 0.45], [1, '#86CCC3', 0.75]]} />
      <path d={`M${-GT / 2},${y0} V${y1}`} stroke="#6FB7AE" strokeWidth={fmt(1.6 * k)} opacity={0.35} />
      {[-3300, -2700, -2050, -1500, -1150].map((y, i) => (
        <path key={i} d={`M${-GT * 0.82},${y} L${-GT * 0.2},${y - 420} L${-GT * 0.2},${y - 330} L${-GT * 0.82},${y + 90} Z`} fill="#FFFFFF" opacity={[0.3, 0.35, 0.2, 0.3, 0.22][i]} />
      ))}
      <path d={`M${-GT},${y0} V${y1} M0,${y0} V${y1}`} stroke="#1F4A50" strokeWidth={fmt(2.6 * k)} opacity={0.9} />
      <path d={`M${-GT + 3.5 * k},${y0} V${y1}`} stroke="#FFFFFF" strokeWidth={fmt(3 * k)} opacity={0.8} />
      <path d={`M${-3.2 * k},${y0} V${y1}`} stroke="#F2FBFB" strokeWidth={fmt(2 * k)} opacity={0.6} />
      {/* transoms: an aluminium frame through the glass, a pressure cap standing proud on the climber's side */}
      {TRANSOMS.map((y, i) => (
        <Inked key={i} w={3 * k}>
          <Lin id={`${id}-tr${i}`} d={`M${-GT - 26},${y - 30} H${34} V${y + 30} H${-GT - 26} Z`} from={{x: 0, y: y - 30}} to={{x: 0, y: y + 30}} stops={[[0, '#E6ECF0'], [0.45, '#BAC6CE'], [1, '#86949E']]} />
          <path d={`M${-GT - 26},${y + 8} H${34}`} stroke="#6E7D87" strokeWidth={fmt(2 * k)} opacity={0.6} />
        </Inked>
      ))}
      {/* the base channel on the bricks */}
      <Inked w={3 * k}>
        <Lin id={`${id}-bc`} d={`M${-GT - 30},${y1 - 64} H${30} V${y1} H${-GT - 30} Z`} from={{x: 0, y: y1 - 64}} to={{x: 0, y: y1}} stops={[[0, '#D3DBE0'], [1, '#7F8E98']]} />
      </Inked>
    </g>
  );
};

/** the brick knee wall in section: courses in running bond, a rough face toward the climber */
export const BrickWall: React.FC<{id: string; k: number}> = ({id, k}) => {
  const y0 = BRICK_TOP, y1 = 0, x0 = -BRICK_T;
  const course = 46; // 6.5 cm brick + 1 cm joint
  const rows = Math.ceil((y1 - y0) / course);
  // the rough face: a fine irregular profile (the micro view's brick family at a visible scale)
  const face: string[] = [];
  for (let y = y0; y <= y1; y += 6) face.push(`${fmt(1.5 + brickX(y * 11) * 0.05)},${fmt(y)}`);
  return (
    <g>
      <Inked w={3 * k}>
        <path d={`M${x0},${y0} L${face.join(' L')} L${x0},${y1} Z`} fill={BRICK} />
      </Inked>
      <Lin id={`${id}-sh`} d={`M${x0},${y0} H2 V${y1} H${x0} Z`} from={{x: x0, y: 0}} to={{x: 2, y: 0}} stops={[[0, '#000000', 0.18], [0.7, '#000000', 0], [1, '#FFFFFF', 0.08]]} />
      {Array.from({length: rows}).map((_, r) => {
        const y = y0 + r * course;
        const off = r % 2 ? 0 : 55;
        return (
          <g key={r}>
            <path d={`M${x0},${fmt(y)} H0`} stroke={MORTAR} strokeWidth={6} opacity={0.75} />
            {[x0 + 20 + off, x0 + 130 + off].filter((x) => x < -6 && x > x0).map((x, i) => (
              <path key={i} d={`M${fmt(x)},${fmt(y)} V${fmt(y + course)}`} stroke={MORTAR} strokeWidth={5} opacity={0.6} />
            ))}
            {/* fired texture: a few darker and lighter flecks per course */}
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={fmt(x0 + 12 + ((r * 53 + i * 47) % (BRICK_T - 20)))} cy={fmt(y + 12 + ((r * 31 + i * 13) % 24))} r={fmt(2.5 + ((r + i) % 3))} fill={i % 2 ? lit(BRICK, 0.25) : shade(BRICK, 0.35)} opacity={0.6} />
            ))}
          </g>
        );
      })}
      <path d={`M${x0},${y0} H6`} stroke={INK} strokeWidth={fmt(3 * k)} />
    </g>
  );
};

const STOOL_C = '#E0A33B';
/** the step stool, side-on: a top board, a low step, splayed legs (front and back pairs overlap in this view) */
export const Stool: React.FC<{id: string; k: number}> = ({id, k}) => {
  const {x0, x1, top} = STOOL;
  const th = 34; // board thickness
  const step = top + (0 - top) * 0.5;
  const legs: [number, number][] = [[x0 + 30, x0 - 20], [x1 - 30, x1 + 20]];
  return (
    <g>
      <Inked w={3 * k}>
        {legs.map(([a, b], i) => (
          <Lin key={i} id={`${id}-lg${i}`} d={`M${a - 16},${top + th} L${a + 16},${top + th} L${b + 16},0 L${b - 16},0 Z`} from={{x: a - 16, y: 0}} to={{x: a + 16, y: 0}} stops={[[0, '#8E9AA2'], [1, '#5E6A72']]} />
        ))}
        <Lin id={`${id}-st`} d={`M${x0 - 4},${step} H${x1 + 4} V${step + 26} H${x0 - 4} Z`} from={{x: 0, y: step}} to={{x: 0, y: step + 26}} stops={[[0, lit(STOOL_C, 0.15)], [1, shade(STOOL_C, 0.2)]]} />
        <Lin id={`${id}-tp`} d={`M${x0},${top} H${x1} V${top + th} H${x0} Z`} from={{x: 0, y: top}} to={{x: 0, y: top + th}} stops={[[0, lit(STOOL_C, 0.3)], [0.4, STOOL_C], [1, shade(STOOL_C, 0.25)]]} />
      </Inked>
      {/* grip tread on the top */}
      <path d={`M${x0 + 10},${top + 5} H${x1 - 10}`} stroke={shade(STOOL_C, 0.35)} strokeWidth={4} strokeDasharray="14 10" opacity={0.7} />
      {/* contact shadow on the floor */}
      <ellipse cx={(x0 + x1) / 2} cy={4} rx={(x1 - x0) * 0.62} ry={14} fill="#1C2A33" opacity={0.25} />
    </g>
  );
};

// ------------------------------------------------------------------ the wall seen at an angle (V2)
// The wall's face (the plane x = 0) drawn in the bay's oblique projection across its depth: the part nearer the camera
// (z > 0) opens to the left of the pads, the far part (z < 0) recedes behind the climber. Glass in a grid of mullions
// (panels 2.26 m wide) and transoms, on the brick knee wall; the pads (z = +-18 cm) work the panel between two mullions.
export const WALL_Z = {near: 2600, far: -3200};
export const MULLIONS2 = [-3850, -2450, -1050, 350, 1750];
const q = (y: number, z: number, x = 0): V => pr({x, y, z});
const quad = (a: V, b: V, c: V, d: V) => `M${P(a)} L${P(b)} L${P(c)} L${P(d)} Z`;

export const WallFace: React.FC<{id: string; k: number}> = ({id, k}) => {
  const {near: zn, far: zf} = WALL_Z;
  const g0 = GLASS_TOP, g1 = BRICK_TOP;
  const glass = quad(q(g0, zf), q(g0, zn), q(g1, zn), q(g1, zf));
  const brick = quad(q(g1, zf), q(g1, zn), q(0, zn), q(0, zf));
  const course = 46;
  const rows = Math.ceil(-g1 / course);
  const joints: string[] = [];
  for (let r = 0; r < rows; r++) {
    const y = g1 + r * course;
    for (let z = zf + (r % 2 ? 0 : 66); z < zn; z += 133) joints.push(`M${P(q(y, z))} L${P(q(Math.min(0, y + course), z))}`);
  }
  return (
    <g>
      {/* glass: a cool tint over whatever is beyond, deepening toward the near edge, soft diagonal sheens */}
      <Lin id={`${id}-gl`} d={glass} from={q(0, zf)} to={q(0, zn)} stops={[[0, '#CDEFEF', 0.22], [0.55, '#BDE6E8', 0.3], [1, '#9FD6D8', 0.42]]} />
      {[-900, -300, 500, 1300, 2100].map((z, i) => (
        <path key={i} d={quad(q(g0 + 400 + i * 230, z), q(g0 + 400 + i * 230, z + 260), q(g1 - 200, z + 760), q(g1 - 200, z + 500))} fill="#FFFFFF" opacity={0.06 + 0.03 * (i % 2)} />
      ))}
      {/* the brick knee wall's face: courses and staggered joints */}
      <Inked w={3 * k}>
        <path d={brick} fill={BRICK} />
      </Inked>
      <Lin id={`${id}-bs`} d={brick} from={q(-400, zf)} to={q(-400, zn)} stops={[[0, '#000000', 0.12], [0.6, '#000000', 0], [1, '#FFFFFF', 0.06]]} />
      {Array.from({length: rows}).map((_, r) => (
        <path key={r} d={`M${P(q(g1 + r * course, zf))} L${P(q(g1 + r * course, zn))}`} stroke={MORTAR} strokeWidth={5} opacity={0.7} />
      ))}
      <path d={joints.join(' ')} stroke={MORTAR} strokeWidth={4} opacity={0.5} />
      {Array.from({length: 70}).map((_, i) => {
        const z = zf + ((i * 977) % (zn - zf)), y = g1 + 10 + ((i * 331) % (-g1 - 20));
        const c = q(y, z);
        return <circle key={i} cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(3 + (i % 3))} fill={i % 2 ? lit(BRICK, 0.25) : shade(BRICK, 0.35)} opacity={0.55} />;
      })}
      {/* mullions: aluminium, a lit edge toward the key light */}
      {MULLIONS2.filter((z) => z > zf && z < zn).map((z, i) => (
        <Inked key={i} w={2.6 * k}>
          <path d={quad(q(g0, z - 16, 0), q(g0, z + 16, 0), q(g1, z + 16, 0), q(g1, z - 16, 0))} fill="#AEB9C1" />
          <path d={quad(q(g0, z - 16, 0), q(g0, z - 16, 30), q(g1, z - 16, 30), q(g1, z - 16, 0))} fill="#D8E0E5" />
        </Inked>
      ))}
      {/* transoms (with the pressure cap standing proud toward the climber) and the base channel on the bricks */}
      {[...TRANSOMS, g1 - 32].map((y, i) => (
        <Inked key={i} w={2.6 * k}>
          <path d={quad(q(y - 30, zf, 34), q(y - 30, zn, 34), q(y + 30, zn, 34), q(y + 30, zf, 34))} fill={i === TRANSOMS.length ? '#B9C4CC' : '#BAC6CE'} />
          <path d={quad(q(y - 30, zf, 0), q(y - 30, zn, 0), q(y - 30, zn, 34), q(y - 30, zf, 34))} fill="#E8EEF1" />
        </Inked>
      ))}
    </g>
  );
};
void KX; void KY;
