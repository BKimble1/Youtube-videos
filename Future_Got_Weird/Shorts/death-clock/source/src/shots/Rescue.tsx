// V2 rescue: the band's blue alert ring opens onto a compact map of the same neighbourhood (his lawn and the
// dog are on it), the alert reaches the drone hub two blocks away, his exact location pin drops and the route
// draws in; the camera dives into the hub and cuts to the drone lifting off the same rooftop pad, his medical
// data docks into it, it crosses the street and arrives over him. An edited montage of an invented service.
import React from 'react';
import {DroneTop, Drone, DronePose} from '../art/Drone';
import {House, Street, Tree} from '../art/Street';
import {Cam, Layer, toScreen} from '../lib/camera';
import {lit, mix, PAL, shade} from '../lib/color';
import {add, clamp, easeIn, easeInOut, easeOut, hash, inv, lerp, P, V} from '../lib/math';
import {spline} from '../lib/motion';
import {Glow, Lin, SoftShadow, Sphere} from '../lib/shade';
import {smoothPath} from '../art/Beads';
import {B} from '../lib/timeline';

const f2 = (n: number) => (Math.abs(n) < 1e-9 ? '0' : n.toFixed(2));
const ease = easeInOut;
const rect = (x: number, y: number, w: number, h: number) => `M${x},${y} h${w} v${h} h${-w} Z`;

// ---------------------------------------------------------------- the map
export const MAP = {pin: {x: 640, y: 1240} as V, hub: {x: 300, y: 520} as V};
const ROOFS = ['#C4B4A6', '#A9B6C4', '#C9C1A8', '#B7A79B', '#9EAFC0', '#CFC3AE'];

const Roof: React.FC<{id: string; x: number; y: number; w: number; h: number; c: string}> = ({id, x, y, w, h, c}) => {
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

/** Him on his lawn, from above: a tiny figure lying on his side, the dog beside him. */
const TinyHim: React.FC<{id: string; c: V}> = ({id, c}) => (
  <g transform={`translate(${f2(c.x)} ${f2(c.y)})`}>
    <SoftShadow id={`${id}-s`} c={{x: 8, y: 10}} rx={70} ry={30} alpha={0.35} />
    <rect x={-46} y={-14} width={70} height={30} rx={14} fill="#FFFFFF" />
    {[-34, -18, -2, 14].map((x, i) => (
      <rect key={i} x={x} y={-14} width={7} height={30} fill={PAL.stripe} />
    ))}
    <rect x={20} y={-12} width={46} height={24} rx={11} fill={PAL.pants} />
    <circle cx={-58} cy={0} r={17} fill={PAL.skin} />
    <path d="M-72,-8 L-66,-20 L-60,-10 L-54,-22 L-50,-8 Z" fill={PAL.hair} />
    <ellipse cx={30} cy={44} rx={26} ry={13} fill={PAL.dog} />
    <circle cx={6} cy={40} r={10} fill={PAL.dog} />
  </g>
);

type MapState = {f: number; cam: Cam; hubFlash: number; pin: number; route: number; alert: number; lift: number};

export const MapV2: React.FC<{id: string; st: MapState}> = ({id, st}) => {
  const {f, cam} = st;
  const lots: React.ReactNode[] = [];
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
          {!(cx === 540 && cy === 900) && <Roof id={`${id}-r${i}a`} x={bx + 34} y={by + 40} w={150} h={120} c={ROOFS[i % 6]} />}
          <Roof id={`${id}-r${i}b`} x={bx + 176} y={by + 230} w={130} h={140} c={ROOFS[(i + 3) % 6]} />
          <Sphere id={`${id}-t${i}a`} c={{x: bx + 250 + hash(i, 1) * 40, y: by + 90}} r={44} color="#7FAE6B" />
          <Sphere id={`${id}-t${i}b`} c={{x: bx + 80, y: by + 300 + hash(i, 2) * 40}} r={52} color="#76A564" />
        </g>,
      );
    }),
  );
  // the hub: a rooftop pad two blocks away
  const hub = MAP.hub;
  const pin = MAP.pin;
  const route = smoothPath([hub, {x: 330, y: 700}, {x: 340, y: 860}, {x: 560, y: 980}, pin], 12);
  const pulse = (f * 0.04) % 1;
  // the alert travelling from his pin to the hub: a ring that slides along the route
  const alertP = st.alert > 0 && st.alert < 1 ? route[Math.min(route.length - 1, Math.round((1 - easeInOut(st.alert)) * (route.length - 1)))] : null;
  return (
    <Layer cam={cam} depth={1}>
      <Lin id={`${id}-st`} d={rect(-1000, -1000, 3200, 4000)} from={{x: 0, y: 0}} to={{x: 1080, y: 1920}} stops={[[0, '#DCD6CC'], [1, '#C9C2B6']]} />
      {lots}
      <g transform={`translate(${pin.x} ${pin.y + 40}) scale(1.7) translate(${-pin.x} ${-(pin.y + 40)})`}><TinyHim id={`${id}-him`} c={{x: pin.x - 10, y: pin.y + 40}} /></g>
      <Lin id={`${id}-pb`} d={rect(hub.x - 120, hub.y - 110, 240, 220)} from={{x: hub.x - 120, y: hub.y - 110}} to={{x: hub.x + 120, y: hub.y + 110}} stops={[[0, '#E9ECEF'], [1, '#B9C0C8']]} />
      <circle cx={hub.x} cy={hub.y} r={88} fill="#2F4256" />
      <circle cx={hub.x} cy={hub.y} r={72} fill="#3C5670" />
      <circle cx={hub.x} cy={hub.y} r={64} fill="none" stroke={PAL.signal} strokeWidth={6} opacity={0.5 + 0.5 * st.hubFlash} />
      {st.hubFlash > 0.01 &&
        [0, 0.5].map((o, i) => {
          const t = (pulse * 1.5 + o) % 1;
          return <circle key={i} cx={hub.x} cy={hub.y} r={70 + t * 140} fill="none" stroke={PAL.signal} strokeWidth={8} opacity={(1 - t) * 0.6 * st.hubFlash} />;
        })}
      {/* the route from the hub to him, drawn in as dots */}
      {route
        .filter((_, i) => i % 2 === 0)
        .map((p, i, arr) => (i / arr.length < st.route ? <circle key={i} cx={f2(p.x)} cy={f2(p.y)} r={8} fill={PAL.signal} opacity={0.9} /> : null))}
      <DroneTop id={`${id}-dr`} c={add(hub, {x: 0, y: -st.lift * 20})} s={1 + st.lift * 0.45} spin={f * 0.9} />
      {alertP && (
        <g>
          <Glow id={`${id}-ag`} c={alertP} r={110} color={PAL.signal} alpha={0.8} />
          <circle cx={f2(alertP.x)} cy={f2(alertP.y)} r={22} fill="#E4FBFF" />
        </g>
      )}
      {/* his location: rings, then the pin drops and locks */}
      {[0, 0.5].map((o, i) => {
        const t = (pulse + o) % 1;
        return <circle key={i} cx={pin.x} cy={pin.y} r={60 + t * 220} fill="none" stroke={PAL.signal} strokeWidth={14} opacity={(1 - t) * 0.85} />;
      })}
      {st.pin > 0.01 && (
        <g>
          <SoftShadow id={`${id}-ps`} c={{x: pin.x + 10, y: pin.y + 6}} rx={46} ry={16} alpha={0.4 * st.pin} />
          <g transform={`translate(${pin.x} ${f2(pin.y - lerp(260, 0, easeOut(st.pin)))}) scale(${f2(1.5 * clamp(st.pin * 1.5))})`}>
            <path d="M0,0 C-14,-26 -46,-52 -46,-86 C-46,-114 -26,-134 0,-134 C26,-134 46,-114 46,-86 C46,-52 14,-26 0,0 Z" fill={PAL.signal} />
            <path d="M-30,-104 C-22,-122 -2,-128 12,-124" fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={0.6} />
            <circle cx={0} cy={-88} r={18} fill="#0B3550" />
          </g>
        </g>
      )}
    </Layer>
  );
};

export const mapCam = (f: number): Cam => {
  const mid = {x: 480, y: 985}; // his pin and figure stay above the caption lane, the hub below the top bar
  const t0 = B.map0 - 24;
  return {
    x: spline(f, [[t0, MAP.pin.x], [B.map0 + 4, MAP.pin.x - 20], [B.hub - 6, mid.x], [B.route1 - 26, mid.x + 10], [B.lift0, MAP.hub.x]]),
    y: spline(f, [[t0, MAP.pin.y], [B.map0 + 4, MAP.pin.y - 40], [B.hub - 6, mid.y], [B.route1 - 26, mid.y + 20], [B.lift0, MAP.hub.y]]),
    z: Math.exp(spline(f, [[t0, Math.log(1.7)], [B.map0 + 4, Math.log(1.45)], [B.hub - 6, Math.log(1.12)], [B.route1 - 26, Math.log(1.15)], [B.lift0, Math.log(3.4)]])),
    roll: 0,
  };
};

/** The map at frame f, with its camera shifted so his pin sits where the band was on screen when the ring opened. */
export const MapShot: React.FC<{id: string; f: number; anchor: V}> = ({id, f, anchor}) => {
  const c = mapCam(f);
  // the pin starts at the band's screen position, easing to the map's own framing
  const k = 1 - ease(inv(B.map0 - 24, B.map0 + 14, f));
  const off = {x: (540 - anchor.x) * k, y: (960 - anchor.y) * k};
  const cam: Cam = {x: c.x - off.x / c.z, y: c.y - off.y / c.z, z: c.z, roll: 0};
  return (
    <MapV2
      id={id}
      st={{
        f,
        cam,
        alert: inv(B.map0 + 8, B.hub, f),
        hubFlash: clamp(inv(B.hub, B.hub + 6, f)),
        pin: inv(B.route0 - 2, B.route0 + 10, f),
        route: ease(inv(B.route0 + 6, B.route1 - 6, f)),
        lift: easeIn(inv(B.route1 - 20, B.lift0, f)),
      }}
    />
  );
};

/** The blue alert ring leaving the band opens a circular window onto the map (no crossfade). */
export const RingWipe: React.FC<{id: string; f: number; c: V; under: React.ReactNode; over: React.ReactNode}> = ({id, f, c, under, over}) => {
  const t = inv(B.ring, B.map0 + 2, f);
  const r = lerp(70, 2400, easeIn(t));
  return (
    <g>
      {under}
      <defs>
        <clipPath id={`${id}-c`}>
          <circle cx={f2(c.x)} cy={f2(c.y)} r={f2(r)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>{over}</g>
      <circle cx={f2(c.x)} cy={f2(c.y)} r={f2(r)} fill="none" stroke={PAL.signal} strokeWidth={f2(lerp(26, 60, t))} opacity={0.9} />
      <circle cx={f2(c.x)} cy={f2(c.y)} r={f2(r)} fill="none" stroke="#E4FBFF" strokeWidth={f2(lerp(8, 18, t))} />
    </g>
  );
};

// ---------------------------------------------------------------- lift-off from the same neighbourhood
const PAD = {x: 520, y: 1066};
export const liftDrone = (f: number): DronePose => {
  const t = inv(B.lift0, B.travel0, f);
  const rise = easeInOut(clamp(t * 1.3));
  const go = easeIn(clamp((t - 0.55) / 0.45));
  return {x: PAD.x + go * 420, y: 980 - rise * 320 - go * 40, s: 0.95, pitch: 14 * go, spin: f * 1.7, beacon: 0.5 + 0.5 * Math.sin(f * 0.6)};
};

export const LiftOff: React.FC<{id: string; f: number}> = ({id, f}) => {
  const dp = liftDrone(f);
  const t = inv(B.lift0, B.travel0, f);
  const cam: Cam = {x: lerp(540, dp.x - 40, ease(t)), y: lerp(1000, dp.y + 80, ease(t)), z: lerp(1.5, 1.3, t), roll: 0};
  // his medical data arrives from his direction and docks into the drone
  const dt = inv(B.data0, B.data1 - 4, f);
  const pk = dt > 0 && dt < 1 ? {x: lerp(dp.x + 900, dp.x + 10, easeInOut(dt)), y: lerp(dp.y - 260, dp.y + 20, easeInOut(dt)) + Math.sin(dt * Math.PI) * -80} : null;
  const docked = clamp(inv(B.data1 - 4, B.data1 + 4, f)) * (1 - clamp(inv(B.data1 + 4, B.data1 + 16, f)));
  return (
    <Street id={`${id}-st`} cam={cam}>
      <Lin id={`${id}-bld`} d="M180,1080 h700 v800 h-700 Z" from={{x: 180, y: 1080}} to={{x: 880, y: 1880}} stops={[[0, '#E4E1DA'], [1, '#B4AEA4']]} />
      <Lin id={`${id}-roof`} d="M150,1060 h760 v40 h-760 Z" from={{x: 0, y: 1060}} to={{x: 0, y: 1100}} stops={[[0, '#F2F0EB'], [1, '#C9C4BA']]} />
      <Lin id={`${id}-lip`} d="M150,1100 h760 v26 h-760 Z" from={{x: 0, y: 1100}} to={{x: 0, y: 1126}} stops={[[0, '#A39D92'], [1, '#C4BEB3']]} />
      <Lin id={`${id}-vent`} d="M760,1010 h110 v52 h-110 Z" from={{x: 760, y: 1010}} to={{x: 870, y: 1062}} stops={[[0, '#D9DDE0'], [1, '#97A0A8']]} />
      <ellipse cx={815} cy={1066} rx={70} ry={8} fill="#000" opacity={0.18} />
      <ellipse cx={PAD.x} cy={1068} rx={250} ry={30} fill="#2F4256" />
      <ellipse cx={PAD.x} cy={1066} rx={218} ry={24} fill={PAL.signal} opacity={0.75} />
      <ellipse cx={PAD.x} cy={1066} rx={204} ry={20} fill="#3C5670" />
      <Drone id={`${id}-dr`} p={dp} shadowY={1070} />
      {docked > 0.01 && <Glow id={`${id}-dk`} c={{x: dp.x, y: dp.y + 40}} r={160} color={PAL.signal} alpha={0.8 * docked} />}
      {pk && (
        <g transform={`translate(${f2(pk.x)} ${f2(pk.y)}) scale(0.9)`}>
          <Glow id={`${id}-pg`} c={{x: 0, y: 0}} r={110} color={PAL.signal} alpha={0.6} />
          <rect x={-60} y={-42} width={120} height={84} rx={18} fill="#FFFFFF" />
          <path d="M-32,4 C-38,-8 -46,-14 -46,-22 C-46,-32 -40,-36 -32,-36 C-24,-36 -18,-32 -18,-22 C-18,-14 -26,-8 -32,4 Z" fill={PAL.signal} />
          <polyline points="-6,-8 6,-8 12,-22 18,6 24,-8 44,-8" fill="none" stroke={PAL.alert} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
          <rect x={-44} y={16} width={88} height={9} rx={4.5} fill="#D6E2EA" />
        </g>
      )}
    </Street>
  );
};

// ---------------------------------------------------------------- crossing the street toward him
export const travelDrone = (f: number): DronePose => {
  const t = inv(B.travel0, B.arrive0, f);
  return {x: lerp(-200, 1700, t), y: 860 + Math.sin(t * Math.PI) * -30, s: 0.85, pitch: 16, spin: f * 1.7, beacon: 0.5 + 0.5 * Math.sin(f * 0.6)};
};

export const Travel: React.FC<{id: string; f: number}> = ({id, f}) => {
  const dp = travelDrone(f);
  const cam: Cam = {x: dp.x - 60, y: 1010, z: 1.25, roll: 0};
  return (
    <Street id={`${id}-st`} cam={cam}>
      <g>
        <House id={`${id}-h4`} x={-500} y={1150} w={560} h={320} wall="#D9CBB5" roof="#7D665C" door="#5E7C7A" />
        <Tree id={`${id}-t3`} x={260} y={1180} s={1.0} />
        <House id={`${id}-h5`} x={1500} y={1150} w={520} h={300} wall="#CAD6DE" roof="#566676" door="#A0604E" />
        <Tree id={`${id}-t4`} x={2200} y={1170} s={1.1} />
      </g>
      <Drone id={`${id}-dr`} p={dp} shadowY={1700} />
    </Street>
  );
};

/** The arriving drone over him (drawn inside his scene): descends from the left, hovers, shines on the band. */
export const arriveDrone = (f: number, band: V): DronePose => {
  const t = easeOut(inv(B.arrive0, B.treat0 + 6, f));
  // hovers above him, then backs off up and to the right as he sits up
  const away = easeInOut(inv(B.sit0 + 4, B.sit0 + 40, f));
  const hover = {x: band.x + 120 + away * 520, y: band.y - 470 - away * 330};
  return {
    x: lerp(hover.x - 520, hover.x, t),
    y: lerp(hover.y - 220, hover.y, t) + Math.sin(f * 0.2) * 5 * t,
    s: 0.6,
    pitch: lerp(14, 0, ease(t)),
    spin: f * 1.7,
    beacon: 0.5 + 0.5 * Math.sin(f * 0.6),
  };
};

export const DroneOver: React.FC<{id: string; f: number; band: V; beam: number}> = ({id, f, band, beam}) => {
  const dp = arriveDrone(f, band);
  const src = {x: dp.x, y: dp.y + 50 * dp.s};
  const w0 = 26 * dp.s;
  const w1 = 46;
  return (
    <g>
      {beam > 0.01 && (
        <g opacity={beam}>
          <defs>
            <linearGradient id={`${id}-bm`} gradientUnits="userSpaceOnUse" x1={f2(src.x)} y1={f2(src.y)} x2={f2(band.x)} y2={f2(band.y)}>
              <stop offset="0" stopColor="#BFF3FF" stopOpacity={0.75} />
              <stop offset="1" stopColor={PAL.signal} stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <path d={`M${f2(src.x - w0)},${f2(src.y)} L${f2(src.x + w0)},${f2(src.y)} L${f2(band.x + w1)},${f2(band.y)} L${f2(band.x - w1)},${f2(band.y)} Z`} fill={`url(#${id}-bm)`} />
          <Glow id={`${id}-bp`} c={band} r={90} color={PAL.signal} alpha={0.7} />
        </g>
      )}
      <Drone id={`${id}-dr`} p={dp} />
    </g>
  );
};

export const bandOnScreen = (cam: Cam, band: V) => toScreen(cam, band);
export {mix};
