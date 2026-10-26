// Glass Climbing V5: the tower, in the bay's oblique projection (world/geo.ts: the facade is the plane x = 0, the
// climber on +x; depth z recedes to the right; screen = (x + KX z, y + KY z)). y = 0 is the street.
//   - The facade alternates tall glass bays and brick piers (a common modern masonry-and-glass tower). He climbs a glass
//     bay; the pier beside it is the rough brick of the ending.
//   - Each floor (3.4 m) has a spandrel band over its slab and a projecting aluminium fin (the ledge) at its floor line.
//   - The glass reflects the sky (lighter up high), soft clouds and the towers opposite; faintly, through it, each
//     floor's ceiling and lights. Far down the facade it hazes.
//   - At the top, a parapet; at the far corner, the sky and the city beyond (parallax layers, scenes add them).
//   - Below, the street: the pavement with pedestrians, the kerb, a road with cars (they move with the frame).
// Crew finish: flat shapes, one ink contour per object, gradients from the upper-left key light, restrained detail.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {INK, Inked} from '../dc/ink';
import {fmt, P, V} from '../dc/math';
import {Lin} from '../dc/shade';
import {KX, KY, pr} from '../world/geo';
import {FIN_D, LEDGE_Y, PIER_Z} from './climb8';

const BRICK = '#A9573D';
const ALU = '#B6C1C9';
const SPANDREL = '#2E4A5C';
/** the opaque spandrel glass: from the fin up to the sill (about 0.9 m) */
export const SPANDREL_H = 560;

export const FLOOR_H = 1874; // V7: one storey is the whole climb (climb7 FLOOR_H7)
/** the floor lines (fin tops), from the street up to the roof: one of them is the ledge */
export const FLOORS5 = Array.from({length: 30}).map((_, i) => LEDGE_Y + (i - 14) * FLOOR_H).filter((y) => y < -1500 && y > LEDGE_Y - 4.5 * FLOOR_H);
/** the roof parapet */
export const ROOF = LEDGE_Y - 4 * FLOOR_H - 900;
/** the facade's extent across its depth */
export const FACADE5 = {zNear: 240 + 3 * 4100 + 900, zFar: -32000}; // the corner: a brick pier three bays past his
/** brick piers: [z0, z1) every PIER_P, one beginning at PIER_Z (the climber's bay is just short of it) */
export const PIER_W = 900, PIER_P = 4100;
export const PIERS = Array.from({length: 26}).map((_, i) => PIER_Z + (i - 13) * PIER_P).filter((z) => z + PIER_W > FACADE5.zFar && z < FACADE5.zNear);
export const isBrick = (z: number) => PIERS.some((p) => z >= p && z < p + PIER_W);

const q = (y: number, z: number, x = 0): V => pr({x, y, z});
const quad = (a: V, b: V, c: V, d: V) => `M${P(a)} L${P(b)} L${P(c)} L${P(d)} Z`;
const band = (y0: number, y1: number, z0: number, z1: number, x = 0) => quad(q(y0, z0, x), q(y0, z1, x), q(y1, z1, x), q(y1, z0, x));
const rnd = (i: number, s: number) => ((((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1) + 1) % 1);
/** glass bays: the intervals between piers */
const BAYS: [number, number][] = (() => {
  const out: [number, number][] = [];
  const ps = [...PIERS].sort((a, b) => a - b);
  let z = FACADE5.zFar;
  for (const p of ps) {
    if (p > z) out.push([z, Math.min(p, FACADE5.zNear)]);
    z = Math.max(z, p + PIER_W);
  }
  if (z < FACADE5.zNear) out.push([z, FACADE5.zNear]);
  return out;
})();

/** brick coursing in the facade's own (z, y) coordinates, sheared into the oblique projection */
const BrickPattern: React.FC<{id: string; k: number}> = ({id, k}) => (
  <pattern id={id} patternUnits="userSpaceOnUse" width={266} height={92} patternTransform={`matrix(${KX} ${KY} 0 1 0 0)`}>
    <rect x={0} y={0} width={266} height={92} fill={BRICK} />
    <rect x={10} y={8} width={118} height={30} fill={lit(BRICK, 0.08)} />
    <rect x={143} y={54} width={118} height={30} fill={shade(BRICK, 0.08)} />
    <path d="M0,46 H266 M0,0 H266 M133,0 V46 M0,46 V92 M266,46 V92" stroke="#D9C3A6" strokeWidth={6 * Math.max(0.6, k)} opacity={0.75} fill="none" />
  </pattern>
);

export const Facade5: React.FC<{id: string; k: number; detail?: number}> = ({id, k, detail = 1}) => {
  const {zNear: zn, zFar: zf} = FACADE5;
  const top = ROOF;
  return (
    <g>
      <defs>
        <BrickPattern id={`${id}-bp`} k={k} />
      </defs>
      {/* the glass bays: each storey's pane reflects the sky (lighter at its top), over a tone that lightens up the tower */}
      <defs>
        <pattern id={`${id}-pane`} patternUnits="userSpaceOnUse" width={100000} height={FLOOR_H} y={LEDGE_Y} patternTransform={`matrix(${KX} ${KY} 0 1 0 0)`}>
          <linearGradient id={`${id}-pg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9CC7D4" />
            <stop offset="0.5" stopColor="#6A9DB0" />
            <stop offset="1" stopColor="#3F6E82" />
          </linearGradient>
          <rect x={-50000} y={0} width={100000} height={FLOOR_H} fill={`url(#${id}-pg)`} />
        </pattern>
      </defs>
      {BAYS.map(([z0, z1], i) => (
        <path key={`g${i}`} d={band(top, 0, z0, z1)} fill={`url(#${id}-pane)`} />
      ))}
      {/* through the glass, faintly: each floor's ceiling band and its lights */}
      {detail > 0.3 && FLOORS5.map((y, i) => (
        <g key={`in${i}`} opacity={0.45}>
          {BAYS.map(([z0, z1], j) => (
            <g key={j}>
              <path d={band(y - FLOOR_H + 140, y - FLOOR_H + 300, z0, z1)} fill="#2B4250" opacity={0.35} />
              {/* (V8: one faint linear fixture strip along the ceiling instead of a row of white ovals) */}
              <path d={band(y - FLOOR_H + 214, y - FLOOR_H + 224, z0 + 60, z1 - 60)} fill="#E9E4CF" opacity={0.22} />
            </g>
          ))}
        </g>
      ))}
      {/* reflections: the towers opposite, soft clouds, long diagonal sheens */}
      {BAYS.map(([z0, z1], i) => {
        const h = 6000 + rnd(i, 3) * 9000;
        return <path key={`rs${i}`} d={band(-h, 0, z0 + 60, z1 - 60)} fill="#46707F" opacity={0.3} />;
      })}
      {[[-14000, 9000], [-21000, -6000], [-9000, -15000], [-26000, 18000], [-17000, -24000]].map(([y, z], i) => (
        <path key={`cl${i}`} d={`M${P(q(y, z))} Q${P(q(y - 900, z - 2400))} ${P(q(y, z - 5000))} Z`} fill="#FFFFFF" opacity={0.18} />
      ))}
      {Array.from({length: 18}).map((_, i) => {
        const z = zn - 1200 - i * 3300;
        return <path key={`sh${i}`} d={quad(q(top, z), q(top, z - 500), q(0, z - 2200), q(0, z - 1700))} fill="#FFFFFF" opacity={0.06 + 0.03 * (i % 2)} />;
      })}
      {/* spandrels: opaque glass from each floor's fin up to the sill (flush with the vision glass: the pads grip it
          too), with a fine light joint along its top: the line that passes him when he falls */}
      {FLOORS5.map((y, i) =>
        BAYS.map(([z0, z1], j) => (
          <g key={`sp${i}-${j}`}>
            <path d={band(y - SPANDREL_H, y, z0, z1)} fill={SPANDREL} opacity={0.92} />
            <path d={band(y - SPANDREL_H, y - SPANDREL_H + 160, z0, z1)} fill="#4F7487" opacity={0.55} />
            <path d={band(y - SPANDREL_H - 7, y - SPANDREL_H + 7, z0, z1)} fill="#D5E0E6" />
          </g>
        )),
      )}
      {/* mullions: one at each bay's third points */}
      {BAYS.flatMap(([z0, z1], i) =>
        [1, 2].map((m) => {
          const z = z0 + ((z1 - z0) * m) / 3;
          return (
            <Inked key={`m${i}-${m}`} w={2.2 * k}>
              <path d={quad(q(top, z - 16), q(top, z + 16), q(0, z + 16), q(0, z - 16))} fill={ALU} />
              <path d={quad(q(top, z - 16), q(top, z - 16, 26), q(0, z - 16, 26), q(0, z - 16))} fill="#E1E7EB" />
            </Inked>
          );
        }),
      )}
      {/* the brick piers: coursing, a shadowed return on their far side, an aluminium channel where the glass meets them */}
      {PIERS.map((z0, i) => (
        <g key={`pr${i}`}>
          <Inked w={2.6 * k}>
            <path d={band(top, 0, z0, z0 + PIER_W)} fill={`url(#${id}-bp)`} />
          </Inked>
          <path d={band(top, 0, z0, z0 + PIER_W)} fill="#000000" opacity={0.06} />
          {detail > 0.3 && Array.from({length: 40}).map((_, j) => {
            const c = q(top + ((j * 977) % -top), z0 + ((j * 331) % PIER_W));
            return <circle key={j} cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(4 + (j % 3) * 2)} fill={j % 2 ? lit(BRICK, 0.25) : shade(BRICK, 0.35)} opacity={0.5} />;
          })}
          {[z0, z0 + PIER_W].map((zz, m) => (
            <Inked key={m} w={2 * k}>
              <path d={quad(q(top, zz - 14), q(top, zz + 14), q(0, zz + 14), q(0, zz - 14))} fill="#C3CDD4" />
            </Inked>
          ))}
        </g>
      ))}
      {/* the floor fins (ledges): a front face, FIN_D out from the glass, over the glass bays */}
      {FLOORS5.map((y, i) =>
        BAYS.map(([z0, z1], j) => (
          <Inked key={`fn${i}-${j}`} w={2.2 * k}>
            <path d={quad(q(y, z0, FIN_D), q(y, z1, FIN_D), q(y + 34, z1, FIN_D), q(y + 34, z0, FIN_D))} fill="#C9D2D8" />
            <path d={quad(q(y, z0, 0), q(y, z0, FIN_D), q(y + 34, z0, FIN_D), q(y + 34, z0, 0))} fill="#8E9BA3" />
            <path d={`M${P(q(y, z0, FIN_D))} L${P(q(y, z1, FIN_D))}`} stroke="#F2F6F8" strokeWidth={fmt(3 * k)} opacity={0.9} />
          </Inked>
        )),
      )}
      {/* the parapet */}
      <Inked w={3 * k}>
        <path d={band(top - 420, top, zf, zn)} fill="#D7DDE1" />
        <path d={band(top - 420, top - 380, zf, zn)} fill="#F1F4F6" />
      </Inked>
      {/* a dark granite base at the street */}
      <Inked w={3 * k}>
        <path d={band(-1100, 0, zf, zn)} fill="#3E4A52" />
      </Inked>
      {/* far down the facade it hazes */}
      <Lin id={`${id}-hz`} d={quad(q(top - 600, zn), q(top - 600, zf), q(0, zf), q(0, zn))} from={q(-6000, -2000)} to={q(-6000, zf)} stops={[[0, '#DCE8EE', 0], [1, '#DCE8EE', 0.38]]} />
      {/* the corner column */}
      <Inked w={3 * k}>
        <path d={quad(q(top - 420, zf), q(top - 420, zf - 160), q(0, zf - 160), q(0, zf))} fill={mix(ALU, '#DCE8EE', 0.3)} />
      </Inked>
    </g>
  );
};

/** the street below: pavement with pedestrians, the kerb, a two-lane road with cars; things move with the frame */
export const Street5: React.FC<{id: string; k: number; f: number}> = ({id, k, f}) => {
  // the ground recedes toward the camera: a point (x, 0, z) is at screen (x + KX z, KY z)
  const g = (x: number, z: number) => pr({x, y: 0, z});
  const zA = -40000, zB = 60000;
  const strip = (x0: number, x1: number) => quad(g(x0, zA), g(x1, zA), g(x1, zB), g(x0, zB));
  const people: {x: number; z: number; c: string; s: number}[] = [];
  for (let i = 0; i < 70; i++) {
    const dir = rnd(i, 1) > 0.5 ? 1 : -1;
    const x = 300 + rnd(i, 2) * 2600;
    const z = (((rnd(i, 3) * 90000 + dir * f * (55 + 30 * rnd(i, 4))) % 90000) + 90000) % 90000 - 35000;
    people.push({x, z, c: ['#C8553D', '#2E86AB', '#F2C14E', '#5F7470', '#8E5572', '#E9EEF2'][i % 6], s: dir});
  }
  const cars: {x: number; z: number; c: string}[] = [];
  for (let i = 0; i < 12; i++) {
    const lane = i % 2;
    const x = lane ? 5600 : 4300;
    const v = lane ? -260 : 300;
    const z = (((rnd(i, 7) * 100000 + v * f) % 100000) + 100000) % 100000 - 40000;
    cars.push({x, z, c: ['#D64545', '#2C6E91', '#E8E1D5', '#36454F', '#F2B134', '#6B8F71'][i % 6]});
  }
  const items = [
    ...people.map((p) => ({z: p.z, n: (key: number) => {
      const b = g(p.x, p.z);
      const ph = Math.sin(f * 0.35 + p.x);
      return (
        <g key={key}>
          <ellipse cx={fmt(b.x)} cy={fmt(b.y)} rx={110} ry={26} fill="#000000" opacity={0.18} />
          <path d={`M${fmt(b.x)},${fmt(b.y - 480)} L${fmt(b.x + 70 * ph)},${fmt(b.y)} M${fmt(b.x)},${fmt(b.y - 480)} L${fmt(b.x - 70 * ph)},${fmt(b.y)}`} stroke="#2A3440" strokeWidth={70} strokeLinecap="round" />
          <rect x={fmt(b.x - 95)} y={fmt(b.y - 900)} width={190} height={440} rx={80} fill={p.c} stroke={INK} strokeWidth={fmt(10 * k)} />
          <circle cx={fmt(b.x)} cy={fmt(b.y - 1000)} r={95} fill="#E9B98F" stroke={INK} strokeWidth={fmt(10 * k)} />
        </g>
      );
    }})),
    ...cars.map((c) => ({z: c.z, n: (key: number) => {
      const L = 2800, Wd = 1150, Hc = 950;
      const r0 = (x: number, y: number, z: number) => pr({x, y, z});
      const zz = c.z;
      const back = quad(r0(c.x, -Hc * 0.62, zz), r0(c.x + Wd, -Hc * 0.62, zz), r0(c.x + Wd, -120, zz), r0(c.x, -120, zz));
      const side = quad(r0(c.x + Wd, -Hc * 0.62, zz), r0(c.x + Wd, -Hc * 0.62, zz - L), r0(c.x + Wd, -120, zz - L), r0(c.x + Wd, -120, zz));
      const cab = quad(r0(c.x + 120, -Hc, zz - 600), r0(c.x + Wd - 120, -Hc, zz - 600), r0(c.x + Wd - 60, -Hc * 0.62, zz - 300), r0(c.x + 60, -Hc * 0.62, zz - 300));
      return (
        <g key={key}>
          <Inked w={10 * k}>
            <path d={side} fill={shade(c.c, 0.25)} />
            <path d={cab} fill="#9FC3D3" />
            <path d={back} fill={c.c} />
          </Inked>
          <rect x={fmt(r0(c.x + 120, -420, zz).x)} y={fmt(r0(c.x + 120, -420, zz).y)} width={180} height={90} fill="#FF5A4A" />
          <rect x={fmt(r0(c.x + Wd - 300, -420, zz).x)} y={fmt(r0(c.x + Wd - 300, -420, zz).y)} width={180} height={90} fill="#FF5A4A" />
        </g>
      );
    }})),
  ].sort((a, b) => a.z - b.z);
  return (
    <g>
      <Lin id={`${id}-pv`} d={strip(0, 3600)} from={g(0, zA)} to={g(0, zB)} stops={[[0, '#B5B1A8'], [1, '#D6D2C8']]} />
      <path d={strip(3600, 3800)} fill="#8C8A84" />
      <Lin id={`${id}-rd`} d={strip(3800, 6900)} from={g(0, zA)} to={g(0, zB)} stops={[[0, '#55595C'], [1, '#6B6F72']]} />
      <path d={strip(5320, 5380)} fill="#E8E3D2" opacity={0.8} />
      <path d={strip(6900, 7100)} fill="#8C8A84" />
      <path d={strip(7100, 12000)} fill="#C9C5BC" />
      {items.map((it, i) => it.n(i))}
    </g>
  );
};
