// V3 dispatch (an edited montage of an invented service). The band's transmission pulse crosses a top-down map of
// the same neighbourhood to a hospital (0.7 s), then lands in the beacon of a drone dock on that hospital's rooftop
// launch bay: clinical building, glass stairwell with a staff member, emergency equipment, a large EMERGENCY sign
// on the parapet and the ambulance bay below. The cradle latch opens, the rotors spin up, the drone rises clear,
// banks toward him and flies over the neighbourhood; a foreground tree trunk passes the lens and wipes onto his lawn.
import React from 'react';
import {Drone, DronePose, DroneTop} from '../art/Drone';
import {House, Tree} from '../art/Street';
import {Cam, Layer} from '../lib/camera';
import {lit, mix, PAL, shade} from '../lib/color';
import {Inked} from '../lib/ink';
import {add, clamp, easeInOut, easeOut, fmt, hash, inv, lerp, lerpV, P, rot, V} from '../lib/math';
import {Glow, Lin, SoftShadow, Sphere} from '../lib/shade';
import {smoothPath} from '../art/Beads';
import {B, B4} from '../lib/beats4';
import {UI_FONT} from '../fontNames';
import {BAND_C, journeyCam3} from './Journey3';
// (a cycle: Aftermath3 reads this module's flight functions; both sides use the other only inside functions)
import {arriveDrone3, camAt, loopF, manAt} from './Aftermath3';
import {manJoints} from '../art/Man';

const ease = easeInOut;
const rect = (x: number, y: number, w: number, h: number) => `M${fmt(x)},${fmt(y)} h${fmt(w)} v${fmt(h)} h${fmt(-w)} Z`;
export const MAP_END = B.map0 + 21;

// ---------------------------------------------------------------- shared motion helpers (V4)
/** cubic Hermite from (t0,v0) with slope m0 to (t1,v1) with slope m1 (per frame); clamped outside [t0,t1] */
export const hermite = (t0: number, t1: number, v0: number, v1: number, m0: number, m1: number, t: number) => {
  const h = t1 - t0;
  const s = clamp((t - t0) / h);
  return (2 * s ** 3 - 3 * s ** 2 + 1) * v0 + (s ** 3 - 2 * s ** 2 + s) * h * m0 + (-2 * s ** 3 + 3 * s ** 2) * v1 + (s ** 3 - s ** 2) * h * m1;
};
/** world -> screen for a layer at `depth` (lib/camera.tsx layerTransform, including its per-layer roll) */
export const toScreenD = (cam: Cam, depth: number, p: V): V => {
  const d = Math.max(0.2, depth);
  const z = 1 + (cam.z - 1) / d;
  const q = rot({x: (p.x - (540 + (cam.x - 540) / d)) * z, y: (p.y - (960 + (cam.y - 960) / d)) * z}, (cam.roll ?? 0) / Math.max(1, d * 0.6));
  return {x: 540 + q.x, y: 960 + q.y};
};

/** One drone, one size: the same pose scale in the hospital, the flyover and the arrival (the cameras carry the framing). */
export const DRONE_S = 0.82;
/** One rotor phase for every shot: still in the cradle, spinning up only after the latch has opened (B4.spin0). */
export const rotorRate = (t: number) => (t < B4.spin0 ? 0 : 0.05 + 1.6 * clamp((t - B4.spin0) / (B4.spin1 - B4.spin0)) ** 3);
const spinUp = (s0: number, s1: number, f: number) => {
  let ph = 0;
  const n = Math.min(f, s1);
  for (let t = s0; t < n; t++) ph += 0.05 + 1.6 * clamp((t - s0) / (s1 - s0)) ** 3;
  return ph + Math.max(0, f - s1) * 1.65;
};
/** launch fix: the shorter spin-up gains SPIN_TRIM (< 1 turn, eased in over it) so that from the flyover on the blade
 *  angle equals the V4 master's (spin-up B.latch + 4 .. + 26) modulo a whole turn: the wipe and arrival rotors are unchanged */
const SPIN_TRIM = (() => {
  const d = spinUp(B.latch + 4, B.latch + 26, 2000) - spinUp(B4.spin0, B4.spin1, 2000);
  return ((d % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
})();
export const rotorPhase = (f: number) => spinUp(B4.spin0, B4.spin1, f) + SPIN_TRIM * easeInOut(inv(B4.spin0, B4.spin1, f));
/** rotor motion blur: grows with the spin-up, full from blur1 on (flyover and arrival too) */
export const rotorBlur = (f: number) => clamp(inv(B4.blur0, B4.blur1, f));

/** Forward travel since B4.go0 (world units, same in the hospital and the flyover): the speed eases (smoothstep) up
 *  to CRUISE at B4.go1, then holds. About 290 at the 863/864 cut, so the hospital frame stays inside the facade. */
export const CRUISE = 34;
export const travelX = (f: number) => {
  const T = B4.go1 - B4.go0;
  const t = Math.max(0, f - B4.go0);
  const u = clamp(t / T);
  return t < T ? CRUISE * T * (u ** 3 - u ** 4 / 2) : CRUISE * (T / 2 + t - T);
};
/** lift clear of the dock (0..1) */
const riseAt = (f: number) => easeInOut(inv(B4.lift0, B4.lift1, f));
/** nose-down pitch for forward flight, a small wobble while airborne that grows into the cruise rock */
export const flightPitch = (f: number) =>
  lerp(0, 15, ease(inv(B4.pitch0, B4.pitch1, f))) + lerp(0.6 * Math.sin(f * 0.5), 3 * Math.sin(f * 0.3), ease(inv(B.travel0, B.travel0 + 12, f))) * riseAt(f);

// ---------------------------------------------------------------- the map (0.7 s)
const MAP = {pin: {x: 470, y: 1420} as V, hosp: {x: 900, y: 520} as V};
/** the drone dock on the hospital roof (DroneTop + its beacon ring): the route ends here */
const MAP_DOCK: V = {x: MAP.hosp.x + 160, y: MAP.hosp.y + 110};
/** beacon ring radius on the map (world); the hospital's dock beacon ring is 132 x 17 world */
const MAP_RING = 56;
const ROOFS = ['#C4B4A6', '#A9B6C4', '#C9C1A8', '#B7A79B', '#9EAFC0', '#CFC3AE'];
const route = smoothPath([MAP.pin, {x: 520, y: 1180}, {x: 700, y: 1000}, {x: 900, y: 800}, MAP_DOCK], 14);
const routeS = route.reduce<number[]>((a, q, i) => [...a, i ? a[i - 1] + Math.hypot(q.x - route[i - 1].x, q.y - route[i - 1].y) : 0], []);
const routeL = routeS[routeS.length - 1];
const routeAt = (u: number): V => {
  const s = clamp(u) * routeL;
  let i = 1;
  while (i < route.length - 1 && routeS[i] < s) i++;
  return lerpV(route[i - 1], route[i], clamp((s - routeS[i - 1]) / Math.max(1e-6, routeS[i] - routeS[i - 1])));
};

/** The journey's transmission pulse (Journey3 extra; keep this world path in step with Journey3.tsx). */
export const txPulseW = (f: number): V => {
  const tx = inv(B.tx0, B.tx1, f);
  return {x: BAND_C.x - 40 * easeInOut(tx), y: BAND_C.y - 520 * Math.pow(tx, 1.4)};
};
/** its screen position, velocity (px/frame) and ring sizes (px), one frame on: where and how the map picks it up */
let txHand: {p: V; v: V; r: number; glow: number; core: number; stroke: number} | null = null;
const txHandoff = () => {
  if (!txHand) {
    const c1 = journeyCam3(B.tx1);
    const p1 = toScreenD(c1, 1, txPulseW(B.tx1));
    const p0 = toScreenD(journeyCam3(B.tx1 - 1), 1, txPulseW(B.tx1 - 1));
    // one frame on, at the same speed (B.map0 = B.tx1 + 1)
    const v = {x: p1.x - p0.x, y: p1.y - p0.y};
    txHand = {p: add(p1, v), v, r: (44 + 1.6) * c1.z, glow: 100 * c1.z, core: 6 * c1.z, stroke: 4 * c1.z};
  }
  return txHand;
};
const MAP_Z0 = 1.15;
/** pulse progress along the route: leaves the pin at the journey pulse's screen speed, lands in the dock ring at B4.pulseLand */
const routeU = (f: number) => clamp(hermite(B.map0, B4.pulseLand, 0, 1, Math.hypot(txHandoff().v.x, txHandoff().v.y) / (routeL * MAP_Z0), 0, f));
/** the map pulse's world position (on the route) */
export const mapPulseW = (f: number) => routeAt(routeU(f));

/** Dock beacon, shared by the map and the hospital across the 747/748 match cut: lit when the pulse lands, one flash
 *  phase, and one ripple ring that keeps growing through the cut (q = ring scale relative to the beacon ring). */
export const beaconAt = (f: number) => {
  const lit0 = clamp(inv(B4.pulseLand - 1, B4.pulseLand + 1, f));
  const t = f - B4.pulseLand;
  return {
    lit: lit0,
    pulse: lit0 * (0.7 + 0.3 * Math.cos(0.5 * (f - (MAP_END - 0.5)))),
    ripQ: 1 + 0.12 * Math.max(0, t),
    ripA: t < 0 ? 0 : 0.95 * (1 - clamp(t / 16)),
  };
};

/** The hospital camera (wide -> rooftop as one decelerating approach; x locks onto the drone from B4.camLock).
 *  Defined for f < MAP_END too (constant velocity backwards) so the map can match its dock to it. */
const DOCK = {x: 640, y: 962}; // top of the dock pedestal (the drone's skids rest here)
const DECK_Y = 1000; // front edge of the roof deck
const H_Z0 = 0.72;
const H_Z1 = 1.25;
const H_RATE = 0.011; // log-zoom per frame at the cut (map and hospital)
const H_ARR = B4.hospArr; // the approach ends on the rooftop (just before the latch opens)
const H_X1 = 680;
export const hospCam = (f: number): Cam => {
  const lnz = f < MAP_END ? Math.log(H_Z0) + H_RATE * (f - MAP_END) : hermite(MAP_END, H_ARR, Math.log(H_Z0), Math.log(H_Z1), H_RATE, 0, f);
  const x = f > B4.camLock ? H_X1 + travelX(f) : hermite(MAP_END, B4.camLock, 640, H_X1, 0, 0, f);
  const y = f < H_ARR ? hermite(MAP_END, H_ARR, 1250, 852, 0, 0, f) : hermite(H_ARR, B4.camLock, 852, 858, 0, 0, f);
  return {x, y, z: Math.exp(lnz), roll: 0};
};
/** dock beacon centre on screen in the hospital (also evaluated just before MAP_END by the map) */
const hospDockScreen = (f: number) => toScreenD(hospCam(f), 1, DOCK);

/** The map camera rides the pulse: the pulse leaves his pin where the journey's ring was heading, at its speed, and the
 *  camera catches it (its screen point settles exponentially, no overshoot) onto the screen path of the hospital's dock
 *  beacon; the pulse lands in the dock ring, so at the cut the dock's screen position and velocity, ring size and zoom
 *  rate all equal the hospital's. */
const mapPulseScreen = (f: number): V => {
  const J = txHandoff();
  const h0 = hospDockScreen(B.map0);
  const h1 = hospDockScreen(B.map0 + 1);
  const off = {x: J.p.x - h0.x, y: J.p.y - h0.y};
  const k = Math.abs(off.y) > 1 ? Math.max(0.2, (h1.y - h0.y - J.v.y) / off.y) : 0.5;
  const e = Math.exp(-k * Math.max(0, f - B.map0));
  const h = hospDockScreen(f);
  return {x: h.x + off.x * e, y: h.y + off.y * e};
};
export const mapCam = (f: number): Cam => {
  const zEnd = (132 / MAP_RING) * hospCam(MAP_END - 1).z;
  const z = Math.exp(hermite(B.map0, MAP_END - 1, Math.log(MAP_Z0), Math.log(zEnd), 0, H_RATE, f));
  const a = routeAt(routeU(f));
  const sA = mapPulseScreen(f);
  return {x: a.x - (sA.x - 540) / z, y: a.y - (sA.y - 960) / z, z, roll: 0};
};

export const MapBlip: React.FC<{id: string; f: number}> = ({id, f}) => {
  const cam = mapCam(f);
  const u = routeU(f);
  const q = routeAt(u);
  const bc = beaconAt(f);
  const lots: React.ReactNode[] = [];
  let k = 0;
  [-200, 220, 640, 1060, 1480].forEach((cx) =>
    [-100, 460, 1020, 1580, 2140].forEach((cy) => {
      const i = k++;
      const bx = cx - 170;
      const by = cy - 210;
      const isHosp = Math.abs(cx - 1060) < 1 && Math.abs(cy - 460) < 1;
      lots.push(
        <g key={i}>
          <rect x={bx} y={by} width={340} height={420} fill={mix(PAL.grass, PAL.grassLight, 0.3 + 0.2 * hash(i, 2))} />
          {!isHosp && (
            <g>
              <rect x={bx + 40} y={by + 50} width={150} height={120} rx={6} fill={ROOFS[i % 6]} />
              <rect x={bx + 40} y={by + 50} width={150} height={60} rx={6} fill={lit(ROOFS[i % 6], 0.2)} />
              <rect x={bx + 180} y={by + 240} width={124} height={130} rx={6} fill={ROOFS[(i + 3) % 6]} />
              <circle cx={bx + 270} cy={by + 110} r={40} fill="#7FAE6B" />
            </g>
          )}
        </g>,
      );
    }),
  );
  return (
    <Layer cam={cam} depth={1}>
      <rect x={-1200} y={-1200} width={4200} height={4400} fill="#D3CDC2" />
      {lots}
      {/* the hospital block: a large clinical roof with the drone bay marked on it */}
      <rect x={MAP.hosp.x - 230} y={MAP.hosp.y - 250} width={520} height={470} rx={10} fill="#E9EEF2" />
      <rect x={MAP.hosp.x - 230} y={MAP.hosp.y - 250} width={520} height={60} rx={10} fill="#FFFFFF" />
      <rect x={MAP.hosp.x - 40} y={MAP.hosp.y - 160} width={70} height={190} fill="#E0283A" />
      <rect x={MAP.hosp.x - 100} y={MAP.hosp.y - 100} width={190} height={70} fill="#E0283A" />
      <circle cx={MAP_DOCK.x} cy={MAP_DOCK.y} r={70} fill="#2F4256" />
      {/* the dock beacon (same flash phase, glow size and ripple as the hospital's dock beacon after the cut) */}
      {bc.lit > 0.01 && <Glow id={`${id}-bk`} c={MAP_DOCK} r={210 * (MAP_RING / 132)} color={PAL.signal} alpha={0.6 * bc.pulse} />}
      <circle cx={MAP_DOCK.x} cy={MAP_DOCK.y} r={MAP_RING} fill="none" stroke={PAL.signal} strokeWidth={4} opacity={fmt(0.45 + 0.55 * bc.pulse)} />
      <DroneTop id={`${id}-dt`} c={MAP_DOCK} s={0.75} spin={rotorPhase(f)} />
      {bc.ripA > 0.01 && <circle cx={MAP_DOCK.x} cy={MAP_DOCK.y} r={fmt(MAP_RING * bc.ripQ)} fill="none" stroke={PAL.signal} strokeWidth={6} opacity={fmt(bc.ripA)} />}
      {/* his location: it starts broadcasting as the pulse leaves it; the rings fade before they reach the caption lane */}
      <circle cx={MAP.pin.x} cy={MAP.pin.y} r={36} fill={PAL.signal} />
      <circle cx={MAP.pin.x} cy={MAP.pin.y} r={14} fill="#FFFFFF" />
      {[0, 0.5].map((o, i) => {
        const ph = (f - B.map0) * 0.06 - o;
        if (ph < 0) return null;
        const r = ph % 1;
        const R = 40 + r * 160;
        const lane = clamp((1340 - (toScreenD(cam, 1, MAP.pin).y + R * cam.z)) / 40);
        return lane * (1 - r) > 0.01 ? <circle key={i} cx={MAP.pin.x} cy={MAP.pin.y} r={fmt(R)} fill="none" stroke={PAL.signal} strokeWidth={10} opacity={fmt((1 - r) * 0.7 * lane)} /> : null;
      })}
      {/* the trail and the pulse travelling to the dock: it arrives as the journey's ring and becomes the map's pulse */}
      <path d={`M${[...route.filter((_, i) => routeS[i] < u * routeL), q].map(P).join(' L')}`} fill="none" stroke={PAL.signal} strokeWidth={10} strokeDasharray="4 22" strokeLinecap="round" opacity={0.9} />
      {(() => {
        const a = 1 - clamp(inv(B4.pulseLand, B4.pulseLand + 3, f));
        if (a <= 0.01) return null;
        const J = txHandoff();
        const m = ease(inv(B.map0, B.map0 + 6, f));
        return (
          <g opacity={fmt(a)}>
            <Glow id={`${id}-pg`} c={q} r={lerp(J.glow / cam.z, 130, m)} color="#39C6F4" alpha={lerp(0.56, 0.85, m)} />
            {m < 0.99 && <circle cx={fmt(q.x)} cy={fmt(q.y)} r={fmt(lerp(J.r / cam.z, 30, m))} fill="none" stroke="#BFF3FF" strokeWidth={fmt(J.stroke / cam.z)} opacity={fmt(0.95 * (1 - m))} />}
            <circle cx={fmt(q.x)} cy={fmt(q.y)} r={fmt(lerp(J.core / cam.z, 22, m))} fill={mix('#FFFFFF', '#E4FBFF', m)} />
          </g>
        );
      })()}
    </Layer>
  );
};

// ---------------------------------------------------------------- the hospital launch bay
/** drone beacon blink, the same function in every shot */
export const droneBeacon = (f: number) => 0.5 + 0.5 * Math.sin(f * 0.6);
/** Takeoff: the latch opens (B4.latch0), the rotors spin up after it (B4.spin0), the drone lifts clear (B4.lift0 ->
 *  B4.lift1), pitches nose-down (B4.pitch0) and only then travels forward (B4.go0). */
export const hospDrone = (f: number): DronePose => ({
  x: DOCK.x + travelX(f),
  y: DOCK.y - 88 - riseAt(f) * 330,
  s: DRONE_S,
  pitch: flightPitch(f),
  spin: rotorPhase(f),
  beacon: droneBeacon(f),
});

const Railing: React.FC<{x0: number; x1: number; y: number}> = ({x0, x1, y}) => (
  <g>
    {Array.from({length: Math.floor((x1 - x0) / 60) + 1}).map((_, i) => (
      <rect key={i} x={x0 + i * 60} y={y - 70} width={5} height={70} fill="#9AA6B2" />
    ))}
    <rect x={x0} y={y - 72} width={x1 - x0} height={7} rx={3} fill="#C3CCD6" />
    <rect x={x0} y={y - 38} width={x1 - x0} height={4} rx={2} fill="#AEB8C3" />
  </g>
);

export const HospitalBay: React.FC<{id: string; f: number}> = ({id, f}) => {
  const cam = hospCam(f);
  const dp = hospDrone(f);
  // the dock beacon was lit by the map's pulse (B4.pulseLand): same flash phase and ripple across the cut
  const bc = beaconAt(f);
  const beaconPulse = bc.pulse;
  const latch = easeOut(inv(B4.latch0, B4.latch0 + 8, f));
  const ambLight = Math.sin(f * 0.9) > 0 ? 1 : 0.25;
  return (
    <g>
      {/* sky and the city edge beyond */}
      <Layer cam={cam} depth={6}>
        <Lin id={`${id}-sky`} d={rect(-3000, -3000, 7000, 5200)} from={{x: 0, y: -600}} to={{x: 0, y: 1700}} stops={[[0, '#BFE0EE'], [0.75, '#DDEFF4'], [1, '#EEF4EC']]} />
        {[[120, 200, 1], [860, 60, 0.8], [1150, 380, 1.1]].map(([cx, cy, k], i) => (
          <g key={i} opacity={0.9}>
            {[[-80, 10, 70], [0, -20, 90], [90, 6, 64]].map(([dx, dy, r], j) => (
              <Sphere key={j} id={`${id}-cl${i}${j}`} c={{x: cx + dx * k, y: cy + dy * k}} r={r * k} ry={r * k * 0.7} color="#F7FBFC" k={0.35} />
            ))}
          </g>
        ))}
      </Layer>
      <Layer cam={cam} depth={2.6}>
        {/* the neighbourhood rooftops and trees beyond the hospital */}
        {Array.from({length: 16}).map((_, i) => {
          const x = -700 + i * 170;
          const h = 60 + hash(i, 3) * 50;
          return (
            <g key={i}>
              <path d={`M${x},1240 L${x + 70},${1240 - h} L${x + 150},1240 Z`} fill={mix('#8C7A70', '#7F92A3', hash(i, 5))} opacity={0.7} />
              <rect x={x + 14} y={1240} width={122} height={90} fill={mix('#D9CDB8', '#C7D3DB', hash(i, 6))} opacity={0.7} />
            </g>
          );
        })}
        {Array.from({length: 12}).map((_, i) => (
          <Tree key={i} id={`${id}-bt${i}`} x={-640 + i * 230 + hash(i, 9) * 60} y={1290} s={0.5} tint={0.5} />
        ))}
      </Layer>
      <Layer cam={cam} depth={1}>
        {/* the building: clinical facade under the deck, glass bands, the ambulance bay at street level */}
        <Lin id={`${id}-fac`} d={rect(-260, DECK_Y, 1840, 1700)} from={{x: -260, y: DECK_Y}} to={{x: 1360, y: DECK_Y + 1700}} stops={[[0, '#F3F6F8'], [0.6, '#DCE4EA'], [1, '#BCC8D2']]} />
        {[1250, 1450, 1650, 1850].map((y, i) => (
          <g key={i}>
            <Lin id={`${id}-gl${i}`} d={rect(-240, y, 1800, 110)} from={{x: 0, y}} to={{x: 0, y: y + 110}} stops={[[0, '#7FB4D6'], [1, '#3F6E92']]} />
            {Array.from({length: 16}).map((_, j) => (
              <rect key={j} x={-240 + j * 113} y={y} width={6} height={110} fill="#E6EEF3" />
            ))}
            <path d={`M${-200 + i * 140},${y} l90,0 l-140,110 l-90,0 Z`} fill="#FFFFFF" opacity={0.18} />
          </g>
        ))}
        {/* ambulance bay */}
        <rect x={-260} y={2290} width={1840} height={420} fill="#4E5A66" />
        <Lin id={`${id}-can`} d={rect(-120, 2250, 900, 60)} from={{x: 0, y: 2250}} to={{x: 0, y: 2310}} stops={[[0, '#FFFFFF'], [1, '#C9D2DA']]} />
        <text x={330} y={2296} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={44} letterSpacing={6} fill="#C8202F">
          AMBULANCE
        </text>
        <g>
          <Lin id={`${id}-amb`} d={rect(40, 2390, 420, 230)} from={{x: 40, y: 2390}} to={{x: 460, y: 2620}} stops={[[0, '#FFFFFF'], [1, '#C9D2DA']]} />
          <rect x={40} y={2500} width={420} height={26} fill="#E0283A" />
          <rect x={300} y={2410} width={130} height={80} rx={10} fill="#5D7A92" />
          <rect x={120} y={2364} width={120} height={26} rx={8} fill={ambLight > 0.5 ? '#FF4A5A' : '#3C6FD6'} />
          <Glow id={`${id}-al`} c={{x: 180, y: 2376}} r={120} color={ambLight > 0.5 ? '#FF4A5A' : '#3C6FD6'} alpha={0.5} />
        </g>
        {/* the parapet sign: EMERGENCY, backlit, built into the deck edge */}
        <Lin id={`${id}-par`} d={rect(-260, DECK_Y, 1840, 190)} from={{x: 0, y: DECK_Y}} to={{x: 0, y: DECK_Y + 190}} stops={[[0, '#FFFFFF'], [1, '#E3E9EE']]} />
        <rect x={60} y={DECK_Y + 30} width={980} height={132} rx={14} fill="#FFFFFF" />
        <rect x={60} y={DECK_Y + 30} width={980} height={132} rx={14} fill="none" stroke="#C8202F" strokeWidth={6} />
        <g transform={`translate(${130} ${DECK_Y + 96})`}>
          <rect x={-42} y={-14} width={84} height={28} fill="#E0283A" />
          <rect x={-14} y={-42} width={28} height={84} fill="#E0283A" />
        </g>
        <text x={600} y={DECK_Y + 135} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={118} letterSpacing={8} fill="#C8202F">
          EMERGENCY
        </text>
        <rect x={-260} y={DECK_Y + 186} width={1840} height={10} fill="#9BA9B6" />
        {/* roof deck: hazard edge, the painted launch ring (the building runs past the right edge of the wide) */}
        <path d={`M-260,${DECK_Y} L1580,${DECK_Y} L1520,${DECK_Y - 170} L-200,${DECK_Y - 170} Z`} fill="#5C6670" />
        <path d={`M-260,${DECK_Y} L1580,${DECK_Y} L1576,${DECK_Y - 14} L-256,${DECK_Y - 14} Z`} fill="#F2C230" />
        {Array.from({length: 34}).map((_, i) => (
          <path key={i} d={`M${-250 + i * 56},${DECK_Y} l24,0 l12,-14 l-24,0 Z`} fill="#1E242A" />
        ))}
        <ellipse cx={DOCK.x} cy={DECK_Y - 70} rx={270} ry={52} fill="none" stroke="#F2F4F6" strokeWidth={8} opacity={0.8} />
        {/* glass stairwell with a staff member at the door */}
        <g>
          <Lin id={`${id}-sw`} d={rect(40, 640, 330, 320)} from={{x: 40, y: 640}} to={{x: 370, y: 960}} stops={[[0, '#CFE6F2', 0.95], [1, '#8EB4CC', 0.95]]} />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${70 + i * 52},${930 - i * 52} l52,0 l0,-52`} fill="none" stroke="#6D8DA3" strokeWidth={6} opacity={0.6} />
          ))}
          {[40, 150, 260, 370].map((x, i) => (
            <rect key={i} x={x - 4} y={640} width={8} height={320} fill="#E8EEF2" />
          ))}
          <rect x={36} y={632} width={342} height={16} rx={4} fill="#E8EEF2" />
          <path d="M60,700 l90,-60 l40,0 l-90,60 Z" fill="#FFFFFF" opacity={0.35} />
          {/* door frame and the staff member (scrubs, tablet) */}
          <rect x={262} y={760} width={100} height={200} fill="#2E4A5E" opacity={0.25} />
          <g transform="translate(312 960)">
            <ellipse cx={0} cy={-150} rx={18} ry={20} fill="#2B3E52" />
            <path d="M-24,-128 C-30,-90 -28,-50 -22,0 L22,0 C28,-50 30,-90 24,-128 Z" fill="#2E6F8E" />
            <rect x={-30} y={-104} width={26} height={18} rx={3} fill="#DDE6EE" />
          </g>
          <rect x={258} y={756} width={8} height={204} fill="#E8EEF2" />
          {/* equipment: a wall cabinet with a cross, two oxygen cylinders */}
          <rect x={1000} y={830} width={130} height={130} rx={10} fill="#E9EEF2" stroke="#9AA6B2" strokeWidth={4} />
          <rect x={1048} y={850} width={34} height={90} fill="#E0283A" />
          <rect x={1020} y={878} width={90} height={34} fill="#E0283A" />
          {[0, 1].map((i) => (
            <g key={i}>
              <rect x={1150 + i * 34} y={850} width={26} height={110} rx={12} fill="#3E8E5E" />
              <rect x={1150 + i * 34} y={850} width={26} height={22} rx={10} fill="#F2F4F6" />
            </g>
          ))}
        </g>
        <Railing x0={-250} x1={20} y={DECK_Y - 14} />
        <Railing x0={1240} x1={1570} y={DECK_Y - 14} />
        {/* the dock: pedestal, its beacon ring and the cradle latch that holds the skids; the drone's shadow follows it */}
        <SoftShadow id={`${id}-ds`} c={{x: dp.x + 20, y: DECK_Y - 64}} rx={230 * (1 - 0.5 * clamp((DOCK.y - 88 - dp.y) / 400))} ry={36} alpha={0.35} />
        <Lin id={`${id}-ped`} d={`M${DOCK.x - 150},${DOCK.y} L${DOCK.x + 150},${DOCK.y} L${DOCK.x + 120},${DECK_Y - 60} L${DOCK.x - 120},${DECK_Y - 60} Z`} from={{x: DOCK.x - 150, y: 0}} to={{x: DOCK.x + 150, y: 0}} stops={[[0, '#E6ECF1'], [1, '#9AA8B5']]} />
        <ellipse cx={DOCK.x} cy={DOCK.y} rx={150} ry={22} fill="#C9D3DC" />
        <ellipse cx={DOCK.x} cy={DOCK.y} rx={132} ry={17} fill="none" stroke={PAL.signal} strokeWidth={7} opacity={0.35 + 0.65 * beaconPulse} />
        {beaconPulse > 0.01 && <Glow id={`${id}-bk`} c={{x: DOCK.x, y: DOCK.y}} r={210} ry={90} color={PAL.signal} alpha={0.6 * beaconPulse} />}
        {[-1, 1].map((sgn) => {
          const a = lerp(0, 52, latch) * sgn;
          const piv = {x: DOCK.x + sgn * 112, y: DOCK.y - 6};
          return (
            <g key={sgn} transform={`rotate(${fmt(a)} ${fmt(piv.x)} ${fmt(piv.y)})`}>
              <Inked w={3}>
                <Lin id={`${id}-lt${sgn}`} d={`M${piv.x - 16},${piv.y + 4} L${piv.x + 16},${piv.y + 4} L${piv.x - sgn * 26 + 12},${piv.y - 74} L${piv.x - sgn * 54},${piv.y - 74} Z`} from={piv} to={add(piv, {x: 0, y: -74})} stops={[[0, '#5E6C7A'], [1, '#D9E1E8']]} />
              </Inked>
            </g>
          );
        })}
        {/* the beacon's arrival ripple, continuing the map's ring through the cut */}
        {bc.ripA > 0.01 && <ellipse cx={DOCK.x} cy={DOCK.y} rx={fmt(132 * bc.ripQ)} ry={fmt(17 * bc.ripQ)} fill="none" stroke={PAL.signal} strokeWidth={14} opacity={fmt(bc.ripA)} />}
        {/* the drone (rotor blur grows as it spins up, rotated with the pitch inside Drone) */}
        <Drone id={`${id}-dr`} p={dp} blur={rotorBlur(f)} />
        {/* downwash: dust rings on the deck as it lifts */}
        {[0, 0.33, 0.66].map((o, i) => {
          const t = ((f - B4.spin0) * 0.05 + o) % 1;
          const a = rotorBlur(f) * (1 - inv(B4.go0, B4.go0 + 10, f));
          return a > 0.01 ? <ellipse key={i} cx={fmt(dp.x)} cy={DECK_Y - 64} rx={150 + t * 260} ry={24 + t * 40} fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={(1 - t) * 0.35 * a} /> : null;
        })}
      </Layer>
    </g>
  );
};

// ---------------------------------------------------------------- over the neighbourhood, then a foreground trunk wipes to him
export const WIPE = {in0: B.past0 - 1, cover: B.past0 + 6, out1: B.past0 + 15};

/** The flyover continues the hospital's last move on the same drone: same pose scale, pitch function, forward
 *  speed (travelX) and camera lock, so the 863/864 cut changes only the background. FLY_X0 was the drone's x in the
 *  flyover world at the cut in the V4 master; FLY_CLIMB is how far it climbs over the roofs before the trunk wipe (roll stays 0). */
const FLY_X0 = 700;
const FLY_CLIMB = 120;
/** launch fix: the flyover x is anchored at the trunk wipe (B4.arrive0) to its V4 master value (FLY_X0 at the cut plus
 *  the master's run to the wipe: 0.156 t^2 from 854 up to CRUISE), so with the quicker launch the wipe and arrival stay identical */
const FLY_XW = (() => {
  const a = 0.156;
  const T = Math.sqrt(CRUISE / a);
  const run = (t: number) => (t < T ? (a * t ** 3) / 3 : (a * T ** 3) / 3 + (t - T) * CRUISE);
  return FLY_X0 + run(B4.arrive0 - 854) - run(B.travel0 - 854);
})();
export const flyDrone = (f: number): DronePose => ({
  x: FLY_XW + travelX(f) - travelX(B4.arrive0),
  y: DOCK.y - 88 - 330 - FLY_CLIMB * ease(inv(B.travel0, B4.climb1, f)),
  s: DRONE_S,
  pitch: flightPitch(f),
  spin: rotorPhase(f),
  beacon: droneBeacon(f),
});
export const flyCam = (f: number): Cam => {
  const h = hospCam(B.travel0 - 1);
  return {x: flyDrone(f).x + (H_X1 - DOCK.x), y: h.y, z: h.z, roll: 0};
};
/** The drone as it appears on screen in whichever shot is drawn (for the rotor cue's pan and distance): the hospital
 *  to B.travel0-1, the flyover to B4.arrive0-1, then the arrival in his camera (from arrive0 to wipeLock both shots
 *  hold the drone at one screen point and, at arrive0, one size). x, y = screen position of the drone centre, scale =
 *  apparent size (pose scale x camera zoom; 1.025 in the flyover). null while it is out of frame (and on the map). */
export const droneView = (f: number): {x: number; y: number; scale: number} | null => {
  if (f < MAP_END) return null;
  let cam: Cam;
  let p: DronePose;
  if (f < B.travel0) [cam, p] = [hospCam(f), hospDrone(f)];
  else if (f < B4.arrive0) [cam, p] = [flyCam(f), flyDrone(f)];
  else {
    const g = loopF(f);
    const man = manAt(g);
    const j = manJoints(man);
    const wrist = add(j.L.W, {x: j.L.foreDir.x * -1.75 * 17 * man.s, y: j.L.foreDir.y * -1.75 * 17 * man.s});
    [cam, p] = [camAt(g, wrist, j.head), arriveDrone3(g)];
  }
  const s = toScreenD(cam, 1, p);
  const k = p.s * cam.z;
  // the drone's extent (rotor tips +-275, rotor tops -100, skids +105, pose units)
  const inFrame = s.x + 275 * k > 0 && s.x - 275 * k < 1080 && s.y + 105 * k > 0 && s.y - 100 * k < 1920;
  return inFrame ? {x: s.x, y: s.y, scale: k} : null;
};

/** flyover ground planes: far lawn + far trees (2.4) behind the houses; the near lawn (1.3) under the house bases */
const FAR_LAWN = 1110;
const NEAR_LAWN = 1180;

export const Flyover: React.FC<{id: string; f: number}> = ({id, f}) => {
  // keeps its speed until the trunk has passed (the flyover stays visible ahead of the edge)
  const dp = flyDrone(f);
  const cam = flyCam(f);
  return (
    <g>
      <Layer cam={cam} depth={7}>
        <Lin id={`${id}-sky`} d={rect(-3000, -3000, 9000, 5200)} from={{x: 0, y: -600}} to={{x: 0, y: 1600}} stops={[[0, '#BFE0EE'], [0.8, '#DDEFF4'], [1, '#EEF4EC']]} />
      </Layer>
      <Layer cam={cam} depth={2.4}>
        <rect x={-3000} y={FAR_LAWN} width={9000} height={900} fill={mix(PAL.grass, '#DDEFF4', 0.25)} />
        {Array.from({length: 12}).map((_, i) => (
          <Tree key={i} id={`${id}-ft${i}`} x={-300 + i * 320} y={FAR_LAWN + 10} s={0.7} tint={0.45} />
        ))}
      </Layer>
      <Layer cam={cam} depth={1.3}>
        <rect x={-1500} y={NEAR_LAWN} width={6500} height={1200} fill={PAL.grass} />
        <House id={`${id}-h1`} x={-200} y={NEAR_LAWN + 10} w={520} h={300} wall="#E9DCC2" roof="#8C6E62" door="#6E8C8A" />
        <House id={`${id}-h2`} x={560} y={NEAR_LAWN + 30} w={540} h={310} wall="#C4D3DC" roof="#5E6E7E" door="#B06A55" />
        <House id={`${id}-h3`} x={1320} y={NEAR_LAWN + 20} w={500} h={290} wall="#D3DDC4" roof="#9B7A64" door="#4F6E8C" />
        <House id={`${id}-h4`} x={2060} y={NEAR_LAWN + 30} w={520} h={300} wall="#E3D2C9" roof="#76675E" door="#5E7C7A" />
        <House id={`${id}-h5`} x={2800} y={NEAR_LAWN + 15} w={510} h={295} wall="#D9E0E6" roof="#8A6A5C" door="#6E8C8A" />
        <Tree id={`${id}-t1`} x={450} y={NEAR_LAWN + 50} s={1.0} />
        <Tree id={`${id}-t2`} x={1220} y={NEAR_LAWN + 50} s={1.1} />
        <Tree id={`${id}-t3`} x={1950} y={NEAR_LAWN + 50} s={0.95} />
        <Tree id={`${id}-t4`} x={2690} y={NEAR_LAWN + 50} s={1.0} />
      </Layer>
      <Layer cam={cam} depth={1}>
        {/* the drone's soft shadow on the lawn below it, broad and faint at this height */}
        <SoftShadow id={`${id}-dsh`} c={{x: dp.x + 20, y: 1430}} rx={200 * dp.s} ry={22 * dp.s} alpha={0.12} />
        <Drone id={`${id}-dr`} p={dp} blur={1} />
      </Layer>
    </g>
  );
};

/** A foreground tree trunk that sweeps across the lens: ahead of it the flyover, behind it his lawn. */
export const TrunkWipe: React.FC<{id: string; f: number; before: React.ReactNode; after: React.ReactNode}> = ({id, f, before, after}) => {
  // a trunk close to the lens, wider than the frame, passes right-to-left at one constant speed (the drone flies past it
  // toward him): the flyover stays visible ahead of its leading edge, his lawn appears behind its trailing edge, and the
  // two never share a frame: the trunk covers the whole frame at WIPE.cover and the frame after (the swap happens
  // there). Its edges span e-29 .. e+172 px over the frame's height, so full cover needs x <= -172 and
  // x + RW - 29 >= 1080. Leading edge first in frame at in0 + 1; trailing edge gone by in0 + 15 (out1 = in0 + 16).
  const RW = 1500;
  const TV = 190; // px/frame
  const t = inv(WIPE.in0, WIPE.out1, f);
  const x = 1150 - TV * (f - WIPE.in0);
  const edge = (e: number) => `M${fmt(e)},-200 Q${fmt(e - 120)},1100 ${fmt(e + 260)},2200`;
  const roof = `M${fmt(x)},-200 L${fmt(x + RW)},-200 Q${fmt(x + RW - 120)},1100 ${fmt(x + RW + 260)},2200 L${fmt(x + 260)},2200 Q${fmt(x - 120)},1100 ${fmt(x)},-200 Z`;
  const ahead = `M-400,-200 L${fmt(x)},-200 Q${fmt(x - 120)},1100 ${fmt(x + 260)},2200 L-400,2200 Z`;
  if (t <= 0) return <g>{before}</g>;
  if (t >= 1) return <g>{after}</g>;
  return (
    <g>
      {after}
      <defs>
        <clipPath id={`${id}-ahead`} clipPathUnits="userSpaceOnUse">
          <path d={ahead} />
        </clipPath>
        <clipPath id={`${id}-bark`} clipPathUnits="userSpaceOnUse">
          <path d={roof} />
        </clipPath>
        <linearGradient id={`${id}-rf`} gradientUnits="userSpaceOnUse" x1={x - 60} y1={0} x2={x + RW + 60} y2={0}>
          <stop offset="0" stopColor="#8A6A50" />
          <stop offset="0.14" stopColor="#634A39" />
          <stop offset="0.86" stopColor="#4A382C" />
          <stop offset="1" stopColor="#362922" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-ahead)`}>{before}</g>
      <path d={roof} fill={`url(#${id}-rf)`} />
      {/* bark grooves, kept inside the trunk's silhouette */}
      <g clipPath={`url(#${id}-bark)`}>
        {Array.from({length: 12}).map((_, i) => (
          <path key={i} d={`M${fmt(x + 110 + i * 120)},-200 L${fmt(x + 110 + i * 120 - 40)},2200`} stroke="#3E2F26" strokeWidth={10} opacity={0.45} />
        ))}
      </g>
      <path d={edge(x)} fill="none" stroke="#A3836A" strokeWidth={22} />
      <path d={edge(x + RW)} fill="none" stroke="#241D1A" strokeWidth={8} opacity={0.7} />
    </g>
  );
};
