// S11: a top-down map of the same neighbourhood (muted lawns, warm streets, pastel hip roofs, round
// trees). The blue pulse becomes a location pin over the man; a data packet (location + heart-pulse
// marks, no text) travels to a local response point where the drone waits on a rooftop pad.
import React from 'react';
import {DroneTop} from './Drone';
import {Cam, Layer} from '../lib/camera';
import {lit, mix, PAL, shade} from '../lib/color';
import {add, clamp, easeInOut, easeOut, fmt, hash, inv, lerp, P, V} from '../lib/math';
import {Glow, Lin, SoftShadow, Sphere} from '../lib/shade';
import {pathAt, smoothPath} from './Beads';

export const MAP = {
  pin: {x: 640, y: 1240} as V,
  pad: {x: 300, y: 520} as V,
};
const rect = (x: number, y: number, w: number, h: number) => `M${x},${y} h${w} v${h} h${-w} Z`;

const ROOFS = ['#C4B4A6', '#A9B6C4', '#C9C1A8', '#B7A79B', '#9EAFC0', '#CFC3AE'];

const Roof: React.FC<{id: string; x: number; y: number; w: number; h: number; c: string}> = ({id, x, y, w, h, c}) => {
  // hip roof seen from above: four planes, lit from the upper left
  const r = Math.min(w, h) * 0.42;
  const a = {x: x + r, y: y + h / 2};
  const b = {x: x + w - r, y: y + h / 2};
  return (
    <g>
      <SoftShadow id={`${id}-s`} c={{x: x + w / 2 + 14, y: y + h / 2 + 16}} rx={w * 0.62} ry={h * 0.62} alpha={0.25} color="#2E3A26" core={0.5} />
      <path d={`M${x},${y} L${x + w},${y} L${P(b)} L${P(a)} Z`} fill={lit(c, 0.25)} />
      <path d={`M${x},${y + h} L${x + w},${y + h} L${P(b)} L${P(a)} Z`} fill={shade(c, 0.18)} />
      <path d={`M${x},${y} L${P(a)} L${x},${y + h} Z`} fill={lit(c, 0.12)} />
      <path d={`M${x + w},${y} L${P(b)} L${x + w},${y + h} Z`} fill={shade(c, 0.3)} />
    </g>
  );
};

export type MapState = {f: number; cam: Cam; pin: number; packet: number; lift: number; spin: number};

export const NeighbourhoodMap: React.FC<{id: string; st: MapState}> = ({id, st}) => {
  const {f, cam} = st;
  const lots: React.ReactNode[] = [];
  // a grid of blocks between streets
  const cols = [-300, 120, 540, 960, 1380];
  const rows = [-200, 360, 900, 1440, 1980];
  let k = 0;
  cols.forEach((cx) =>
    rows.forEach((cy) => {
      const i = k++;
      const bx = cx - 170;
      const by = cy - 210;
      lots.push(
        <g key={i}>
          <Lin id={`${id}-lot${i}`} d={rect(bx, by, 340, 420)} from={{x: bx, y: by}} to={{x: bx + 340, y: by + 420}} stops={[[0, mix(PAL.grass, PAL.grassLight, 0.4)], [1, PAL.grass]]} />
          <Roof id={`${id}-r${i}a`} x={bx + 34} y={by + 40} w={150} h={120} c={ROOFS[i % 6]} />
          <Roof id={`${id}-r${i}b`} x={bx + 176} y={by + 230} w={130} h={140} c={ROOFS[(i + 3) % 6]} />
          <Sphere id={`${id}-t${i}a`} c={{x: bx + 250 + hash(i, 1) * 40, y: by + 90}} r={44} color="#7FAE6B" />
          <Sphere id={`${id}-t${i}b`} c={{x: bx + 80, y: by + 300 + hash(i, 2) * 40}} r={52} color="#76A564" />
        </g>,
      );
    }),
  );
  // packet route from the pin to the response point
  const route = smoothPath([MAP.pin, {x: 560, y: 980}, {x: 340, y: 860}, {x: 330, y: 700}, MAP.pad], 12);
  const pk = st.packet > 0 && st.packet < 1 ? pathAt(route, easeInOut(st.packet)) : null;
  const pulse = (f * 0.04) % 1;
  return (
    <g>
      <Layer cam={cam} depth={1}>
        {/* streets and sidewalks */}
        <Lin id={`${id}-st`} d={rect(-1000, -1000, 3200, 4000)} from={{x: 0, y: 0}} to={{x: 1080, y: 1920}} stops={[[0, '#DCD6CC'], [1, '#C9C2B6']]} />
        {lots}
        {/* response point: a rooftop pad two blocks away */}
        <Lin id={`${id}-pb`} d={rect(MAP.pad.x - 120, MAP.pad.y - 110, 240, 220)} from={{x: MAP.pad.x - 120, y: MAP.pad.y - 110}} to={{x: MAP.pad.x + 120, y: MAP.pad.y + 110}} stops={[[0, '#E9ECEF'], [1, '#B9C0C8']]} />
        <circle cx={MAP.pad.x} cy={MAP.pad.y} r={88} fill="#2F4256" />
        <circle cx={MAP.pad.x} cy={MAP.pad.y} r={72} fill="#3C5670" />
        <circle cx={MAP.pad.x} cy={MAP.pad.y} r={64} fill="none" stroke={PAL.signal} strokeWidth={6} opacity={0.8} />
        {/* the route, revealed as the packet travels (dots, not a line) */}
        {route
          .filter((_, i) => i % 2 === 0)
          .map((p, i, arr) => (i / arr.length < easeInOut(clamp(st.packet)) ? <circle key={i} cx={fmt(p.x)} cy={fmt(p.y)} r={7} fill={PAL.signal} opacity={0.85} /> : null))}
        <DroneTop id={`${id}-dr`} c={add(MAP.pad, {x: 0, y: -st.lift * 20})} s={1 + st.lift * 0.45} spin={st.spin} />
        {/* location pin over the man */}
        {st.pin > 0.01 && (
          <g>
            {[0, 0.5].map((o, i) => {
              const t = (pulse + o) % 1;
              return <circle key={i} cx={MAP.pin.x} cy={MAP.pin.y} r={40 + t * 160} fill={PAL.signal} opacity={(1 - t) * 0.35 * st.pin} />;
            })}
            <SoftShadow id={`${id}-ps`} c={{x: MAP.pin.x + 10, y: MAP.pin.y + 6}} rx={46} ry={16} alpha={0.4 * st.pin} />
            <g transform={`translate(${MAP.pin.x} ${fmt(MAP.pin.y - lerp(260, 0, easeOut(st.pin)))}) scale(${fmt(1.6 * clamp(st.pin * 1.5))})`}>
              <path d="M0,0 C-14,-26 -46,-52 -46,-86 C-46,-114 -26,-134 0,-134 C26,-134 46,-114 46,-86 C46,-52 14,-26 0,0 Z" fill={PAL.signal} />
              <path d="M-30,-104 C-22,-122 -2,-128 12,-124" fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={0.6} />
              <circle cx={0} cy={-88} r={18} fill="#0B3550" />
            </g>
          </g>
        )}
        {/* data packet: a card with a location mark and a heart-pulse mark */}
        {pk && (
          <g transform={`translate(${fmt(pk.pt.x)} ${fmt(pk.pt.y)})`}>
            <Glow id={`${id}-pg`} c={{x: 0, y: 0}} r={120} color={PAL.signal} alpha={0.6} />
            <rect x={-70} y={-48} width={140} height={96} rx={20} fill="#FFFFFF" />
            <path d="M-38,4 C-44,-8 -52,-14 -52,-24 C-52,-34 -46,-40 -38,-40 C-30,-40 -24,-34 -24,-24 C-24,-14 -32,-8 -38,4 Z" fill={PAL.signal} />
            <polyline points="-10,-10 4,-10 10,-26 18,8 24,-10 50,-10" fill="none" stroke={PAL.alert} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
            <rect x={-52} y={18} width={104} height={10} rx={5} fill="#D6E2EA" />
          </g>
        )}
      </Layer>
    </g>
  );
};

export {SoftShadow};
