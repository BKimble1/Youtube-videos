// The laser system on the summit terrace (site world, depth 1), after the research team's photographs in outline:
// a long weather-protected laser enclosure on a steel frame, a boxed beam duct to a fork-mounted launch telescope
// aimed along the beam axis, an open rain hatch over its exit window, cable runs to the control shelter. No pipes or
// gears; proportions are drawn for legibility (it stands for a system several metres long weighing tonnes).
import React from 'react';
import {mix} from '../dc/color';
import {fmt, V} from '../dc/math';
import {EXIT, NRM, U} from '../world/site';

const INKA = '#0B151C';
const at = (h: number, off: number): V => ({x: EXIT.x + U.x * h + NRM.x * off, y: EXIT.y + U.y * h + NRM.y * off});
const poly = (pts: V[]) => `M${pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} Z`;

export const TUBE_L = 150;
export const TUBE_R = 22;

export const Apparatus: React.FC<{id: string; flash: number; on: number; status: number}> = ({id, flash, on, status}) => {
  const white = mix('#C9D1D6', '#EEF0FF', flash * 0.5);
  const whiteD = mix('#7E8B94', '#AEB6E0', flash * 0.5);
  const steel = mix('#56646E', '#9AA4D0', flash * 0.4);
  const tubeC = mix('#A9B4BB', '#E6EAFF', flash * 0.5);
  // the tube along the axis: bottom at h = -TUBE_L, top at the exit (h = 0)
  const tube = poly([at(-TUBE_L, -TUBE_R), at(-6, -TUBE_R), at(-6, TUBE_R), at(-TUBE_L, TUBE_R)]);
  const hood = poly([at(-10, -TUBE_R - 4), at(6, -TUBE_R - 5), at(6, TUBE_R + 5), at(-10, TUBE_R + 4)]);
  const bands = [-120, -40].map((h) => poly([at(h, -TUBE_R), at(h + 12, -TUBE_R), at(h + 12, TUBE_R), at(h, TUBE_R)]));
  const pivot = at(-82, 0);
  const win = at(6, 0);
  // open rain hatch, hinged on the tube's left lip and swung down-left
  const hinge = at(6, -TUBE_R - 5);
  const hatch = poly([hinge, {x: hinge.x - 40, y: hinge.y + 14}, {x: hinge.x - 46, y: hinge.y + 6}, {x: hinge.x - 6, y: hinge.y - 10}]);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-tb`} gradientUnits="userSpaceOnUse" x1={fmt(at(0, -TUBE_R).x)} y1={fmt(at(0, -TUBE_R).y)} x2={fmt(at(0, TUBE_R).x)} y2={fmt(at(0, TUBE_R).y)}>
          <stop offset="0" stopColor={mix(tubeC, '#FFFFFF', 0.15)} />
          <stop offset="0.45" stopColor={tubeC} />
          <stop offset="1" stopColor={mix(whiteD, '#E8ECFF', flash * 0.6)} />
        </linearGradient>
        <linearGradient id={`${id}-hs`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(white, '#FFFFFF', 0.1)} />
          <stop offset="1" stopColor={whiteD} />
        </linearGradient>
        <radialGradient id={`${id}-wg`}>
          <stop offset="0" stopColor="#E9DDFF" stopOpacity={0.9 * on} />
          <stop offset="1" stopColor="#8C6CFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* terrace slab and a railing along its edge */}
      <path d="M80,1768 L506,1768 L512,1790 L74,1790 Z" fill={mix('#5C6A72', '#9AA2C8', flash * 0.4)} stroke={INKA} strokeWidth={2} />
      <g stroke={INKA} strokeWidth={1.8}>
        <line x1={90} y1={1742} x2={150} y2={1742} />
        {[90, 110, 130, 150].map((x) => <line key={x} x1={x} y1={1742} x2={x} y2={1768} />)}
      </g>
      {/* steel frame under the enclosure */}
      <g fill={steel} stroke={INKA} strokeWidth={1.8}>
        {[150, 230, 310].map((x) => (
          <path key={x} d={`M${x - 6},1734 L${x + 6},1734 L${x + 8},1768 L${x - 8},1768 Z`} />
        ))}
        <rect x={136} y={1728} width={196} height={9} />
      </g>
      {/* the laser enclosure: insulated weatherproof housing with panel seams, louvres, a hazard band, status light */}
      <path d="M128,1650 Q128,1640 138,1640 L338,1640 Q348,1640 348,1650 L348,1728 L128,1728 Z" fill={`url(#${id}-hs)`} stroke={INKA} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M124,1640 L352,1640 L346,1630 L130,1630 Z" fill={mix('#9AA6AE', '#D8DCFF', flash * 0.5)} stroke={INKA} strokeWidth={2} strokeLinejoin="round" />
      {[186, 244, 302].map((x) => <line key={x} x1={x} y1={1642} x2={x} y2={1726} stroke={INKA} strokeOpacity={0.4} strokeWidth={1.4} />)}
      <g fill="#2A363E">
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={146} y={1656 + i * 9} width={30} height={4} rx={1} />)}
      </g>
      <rect x={128} y={1708} width={220} height={8} fill="#E2B33C" />
      {Array.from({length: 14}, (_, i) => <path key={i} d={`M${132 + i * 16},1716 l8,-8 l6,0 l-8,8 Z`} fill="#1E252B" />)}
      <circle cx={330} cy={1656} r={4.5} fill={status > 0.5 ? '#5BF08A' : '#2E5A3C'} stroke={INKA} strokeWidth={1.2} />
      <circle cx={330} cy={1656} r={11} fill="#5BF08A" opacity={0.25 * status} />
      {/* beam duct: from the enclosure into the base of the mount */}
      <path d="M346,1666 L372,1666 L372,1700 L346,1700 Z" fill={whiteD} stroke={INKA} strokeWidth={2} />
      {/* mount pedestal and fork */}
      <path d={`M360,1768 L366,1700 L410,1700 L416,1768 Z`} fill={steel} stroke={INKA} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={poly([{x: 368, y: 1702}, at(-82, -TUBE_R - 8), at(-70, -TUBE_R - 8), {x: 382, y: 1702}])} fill={steel} stroke={INKA} strokeWidth={2} />
      {/* the launch telescope (beam expander) on the axis */}
      <path d={tube} fill={`url(#${id}-tb)`} stroke={INKA} strokeWidth={2.4} strokeLinejoin="round" />
      {bands.map((b, i) => <path key={i} d={b} fill="#3B4850" opacity={0.85} />)}
      <path d={hood} fill={mix('#5E6C75', '#B3BBE6', flash * 0.5)} stroke={INKA} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={poly([{x: 404, y: 1702}, at(-82, TUBE_R + 8), at(-70, TUBE_R + 8), {x: 412, y: 1702}])} fill={mix(steel, '#C0C8F0', flash * 0.4)} stroke={INKA} strokeWidth={2} />
      <circle cx={fmt(pivot.x)} cy={fmt(pivot.y)} r={7} fill="#2A363E" stroke={INKA} strokeWidth={1.6} />
      {/* exit window (glass) with the beam's glint when it runs */}
      <ellipse cx={fmt(win.x)} cy={fmt(win.y)} rx={TUBE_R + 2} ry={6.5} transform={`rotate(${fmt((Math.atan2(NRM.y, NRM.x) * 180) / Math.PI)} ${fmt(win.x)} ${fmt(win.y)})`} fill="#1A2440" stroke={INKA} strokeWidth={2} />
      <ellipse cx={fmt(win.x)} cy={fmt(win.y)} rx={TUBE_R - 6} ry={3.6} transform={`rotate(${fmt((Math.atan2(NRM.y, NRM.x) * 180) / Math.PI)} ${fmt(win.x)} ${fmt(win.y)})`} fill="#3D4F86" opacity={0.8} />
      <circle cx={fmt(win.x)} cy={fmt(win.y)} r={26} fill={`url(#${id}-wg)`} style={{mixBlendMode: 'screen'}} />
      {/* rain hatch, open */}
      <path d={hatch} fill={mix('#B5BEC4', '#E6EAFF', flash * 0.5)} stroke={INKA} strokeWidth={2} strokeLinejoin="round" />
      {/* cables: a tray and two bundles to the control shelter */}
      <path d="M340,1728 Q420,1792 560,1800 Q700,1808 790,1786 Q850,1770 886,1716" fill="none" stroke="#0E1418" strokeWidth={7} strokeLinecap="round" />
      <path d="M330,1728 Q410,1800 560,1810 Q706,1818 796,1796 Q856,1780 898,1716" fill="none" stroke="#1C2830" strokeWidth={4.5} strokeLinecap="round" />
      <path d="M372,1700 Q380,1730 400,1744" fill="none" stroke="#0E1418" strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};
