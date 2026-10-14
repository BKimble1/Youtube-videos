// V3 dispatch (an edited montage of an invented service). The band's transmission pulse crosses a top-down map of
// the same neighbourhood to a hospital (0.7 s), then lands in the beacon of a drone dock on that hospital's rooftop
// launch bay: clinical building, glass stairwell with a staff member, emergency equipment, a large EMERGENCY sign
// on the parapet and the ambulance bay below. The cradle latch opens, the rotors spin up, the drone rises clear,
// banks toward him and flies over the neighbourhood; a foreground roof edge wipes into his lawn.
import React from 'react';
import {Drone, DronePose, DroneTop} from '../art/Drone';
import {House, Tree} from '../art/Street';
import {Cam, Layer} from '../lib/camera';
import {lit, mix, PAL, shade} from '../lib/color';
import {Inked} from '../lib/ink';
import {add, clamp, easeIn, easeInOut, easeOut, fmt, hash, inv, lerp, P, V} from '../lib/math';
import {spline} from '../lib/motion';
import {Glow, Lin, SoftShadow, Sphere} from '../lib/shade';
import {smoothPath} from '../art/Beads';
import {B} from '../lib/timeline3';
import {UI_FONT} from '../fontNames';

const ease = easeInOut;
const rect = (x: number, y: number, w: number, h: number) => `M${fmt(x)},${fmt(y)} h${fmt(w)} v${fmt(h)} h${fmt(-w)} Z`;
export const MAP_END = B.map0 + 21;

// ---------------------------------------------------------------- the map (0.7 s)
const MAP = {pin: {x: 470, y: 1420} as V, hosp: {x: 900, y: 520} as V};
const ROOFS = ['#C4B4A6', '#A9B6C4', '#C9C1A8', '#B7A79B', '#9EAFC0', '#CFC3AE'];
const route = smoothPath([MAP.pin, {x: 520, y: 1180}, {x: 700, y: 1000}, {x: 760, y: 760}, MAP.hosp], 14);

export const MapBlip: React.FC<{id: string; f: number}> = ({id, f}) => {
  const t = inv(B.map0, MAP_END - 3, f);
  const q = route[Math.min(route.length - 1, Math.round(easeInOut(t) * (route.length - 1)))];
  // the camera rides with the pulse, then pushes toward the hospital block
  const cam: Cam = {x: lerp(MAP.pin.x + 40, MAP.hosp.x - 60, ease(t)), y: lerp(MAP.pin.y - 200, MAP.hosp.y + 140, ease(t)), z: lerp(1.15, 1.7, easeIn(t)), roll: 0};
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
      <circle cx={MAP.hosp.x + 160} cy={MAP.hosp.y + 110} r={70} fill="#2F4256" />
      <circle cx={MAP.hosp.x + 160} cy={MAP.hosp.y + 110} r={56} fill="none" stroke={PAL.signal} strokeWidth={8} opacity={0.6 + 0.4 * clamp(inv(MAP_END - 6, MAP_END, f))} />
      <DroneTop id={`${id}-dt`} c={{x: MAP.hosp.x + 160, y: MAP.hosp.y + 110}} s={0.75} spin={f * 0.3} />
      {/* his location */}
      <circle cx={MAP.pin.x} cy={MAP.pin.y} r={36} fill={PAL.signal} />
      <circle cx={MAP.pin.x} cy={MAP.pin.y} r={14} fill="#FFFFFF" />
      {[0, 0.5].map((o, i) => {
        const r = ((f * 0.06 + o) % 1);
        return <circle key={i} cx={MAP.pin.x} cy={MAP.pin.y} r={40 + r * 160} fill="none" stroke={PAL.signal} strokeWidth={10} opacity={(1 - r) * 0.7} />;
      })}
      {/* the trail and the pulse travelling to the hospital */}
      <path d={`M${route.slice(0, Math.max(2, Math.round(easeInOut(t) * route.length))).map(P).join(' L')}`} fill="none" stroke={PAL.signal} strokeWidth={10} strokeDasharray="4 22" strokeLinecap="round" opacity={0.9} />
      <Glow id={`${id}-pg`} c={q} r={130} color="#39C6F4" alpha={0.85} />
      <circle cx={fmt(q.x)} cy={fmt(q.y)} r={22} fill="#E4FBFF" />
    </Layer>
  );
};

// ---------------------------------------------------------------- the hospital launch bay
const DOCK = {x: 640, y: 962}; // top of the dock pedestal (the drone's skids rest here)
const DECK_Y = 1000; // front edge of the roof deck
export const hospDrone = (f: number): DronePose => {
  const rise = easeInOut(inv(B.lift0, B.bank0 + 2, f));
  const go = easeIn(inv(B.bank0 - 4, B.travel0 + 8, f));
  return {
    x: DOCK.x + go * 360,
    y: DOCK.y - 88 - rise * 330 - go * 40,
    s: 0.82,
    pitch: lerp(0, 15, ease(inv(B.bank0 - 4, B.travel0, f))) + Math.sin(f * 0.5) * 0.6 * rise,
    spin: rotorPhase(f),
    beacon: 0.5 + 0.5 * Math.sin(f * 0.6),
  };
};
/** rotor phase: still in the cradle, spinning up after the latch releases */
const rotorPhase = (f: number) => {
  let ph = 0;
  for (let t = B.latch; t < f; t++) ph += 0.05 + 1.6 * easeIn(clamp((t - B.latch) / 22));
  return ph;
};
const rotorBlur = (f: number) => clamp(inv(B.latch + 4, B.latch + 24, f));

const hospCam = (f: number): Cam => {
  // wide on the building (sign high, ambulance bay low), in to the dock, then held while the drone lifts:
  // the EMERGENCY sign never crosses the caption lane
  const keys: [number, number, number, number][] = [
    [MAP_END, 640, 1250, 0.72],
    [B.dock - 6, 640, 1200, 0.76],
    [B.latch - 6, 650, 900, 1.15],
    [B.latch + 8, 660, 850, 1.25],
    [B.lift0, 680, 850, 1.25],
    [B.bank0, 760, 860, 1.25],
    [B.travel0, 800, 860, 1.25],
  ];
  return {
    x: spline(f, keys.map(([t, x]) => [t, x])),
    y: spline(f, keys.map(([t, , y]) => [t, y])),
    z: Math.exp(spline(f, keys.map(([t, , , z]) => [t, Math.log(z)]))),
    roll: 0,
  };
};

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
  // the transmission pulse comes down out of the sky into the dock's beacon ring
  const pt = inv(MAP_END, B.dock, f);
  const pulse = pt > 0 && pt < 1 ? {x: lerp(DOCK.x - 120, DOCK.x, ease(pt)), y: lerp(-400, DOCK.y + 8, easeIn(pt))} : null;
  const lit0 = clamp(inv(B.dock - 2, B.dock + 6, f));
  const beaconPulse = lit0 * (0.6 + 0.4 * Math.sin(f * 0.5));
  const latch = easeOut(inv(B.latch, B.latch + 8, f));
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
        <Lin id={`${id}-fac`} d={rect(-260, DECK_Y, 1620, 1700)} from={{x: -260, y: DECK_Y}} to={{x: 1360, y: DECK_Y + 1700}} stops={[[0, '#F3F6F8'], [0.6, '#DCE4EA'], [1, '#BCC8D2']]} />
        {[1250, 1450, 1650, 1850].map((y, i) => (
          <g key={i}>
            <Lin id={`${id}-gl${i}`} d={rect(-240, y, 1580, 110)} from={{x: 0, y}} to={{x: 0, y: y + 110}} stops={[[0, '#7FB4D6'], [1, '#3F6E92']]} />
            {Array.from({length: 14}).map((_, j) => (
              <rect key={j} x={-240 + j * 113} y={y} width={6} height={110} fill="#E6EEF3" />
            ))}
            <path d={`M${-200 + i * 140},${y} l90,0 l-140,110 l-90,0 Z`} fill="#FFFFFF" opacity={0.18} />
          </g>
        ))}
        {/* ambulance bay */}
        <rect x={-260} y={2290} width={1620} height={420} fill="#4E5A66" />
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
        <Lin id={`${id}-par`} d={rect(-260, DECK_Y, 1620, 190)} from={{x: 0, y: DECK_Y}} to={{x: 0, y: DECK_Y + 190}} stops={[[0, '#FFFFFF'], [1, '#E3E9EE']]} />
        <rect x={60} y={DECK_Y + 30} width={980} height={132} rx={14} fill="#FFFFFF" />
        <rect x={60} y={DECK_Y + 30} width={980} height={132} rx={14} fill="none" stroke="#C8202F" strokeWidth={6} />
        <g transform={`translate(${130} ${DECK_Y + 96})`}>
          <rect x={-42} y={-14} width={84} height={28} fill="#E0283A" />
          <rect x={-14} y={-42} width={28} height={84} fill="#E0283A" />
        </g>
        <text x={600} y={DECK_Y + 135} textAnchor="middle" fontFamily={UI_FONT} fontWeight={800} fontSize={118} letterSpacing={8} fill="#C8202F">
          EMERGENCY
        </text>
        <rect x={-260} y={DECK_Y + 186} width={1620} height={10} fill="#9BA9B6" />
        {/* roof deck: hazard edge, the painted launch ring */}
        <path d={`M-260,${DECK_Y} L1360,${DECK_Y} L1300,${DECK_Y - 170} L-200,${DECK_Y - 170} Z`} fill="#5C6670" />
        <path d={`M-260,${DECK_Y} L1360,${DECK_Y} L1356,${DECK_Y - 14} L-256,${DECK_Y - 14} Z`} fill="#F2C230" />
        {Array.from({length: 30}).map((_, i) => (
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
        <Railing x0={1240} x1={1350} y={DECK_Y - 14} />
        {/* the dock: pedestal, its beacon ring and the cradle latch that holds the skids */}
        <SoftShadow id={`${id}-ds`} c={{x: DOCK.x + 20, y: DECK_Y - 64}} rx={230 * (1 - 0.5 * clamp((DOCK.y - 88 - dp.y) / 400))} ry={36} alpha={0.35} />
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
        {/* the drone (rotor blur grows as it spins up) */}
        <Drone id={`${id}-dr`} p={dp} />
        {rotorBlur(f) > 0.01 &&
          [-175, 175, -150, 150].map((x, i) => {
            const c = add({x: dp.x, y: dp.y}, {x: x * dp.s, y: (i < 2 ? -56 : -86) * dp.s});
            return <ellipse key={i} cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(100 * dp.s)} ry={fmt(15 * dp.s)} fill="#FFFFFF" opacity={0.25 * rotorBlur(f)} transform={`rotate(${fmt(dp.pitch)} ${fmt(c.x)} ${fmt(c.y)})`} />;
          })}
        {/* downwash: dust rings on the deck as it lifts */}
        {[0, 0.33, 0.66].map((o, i) => {
          const t = ((f - B.latch) * 0.05 + o) % 1;
          const a = rotorBlur(f) * (1 - inv(B.bank0, B.travel0, f));
          return a > 0.01 ? <ellipse key={i} cx={DOCK.x} cy={DECK_Y - 64} rx={150 + t * 260} ry={24 + t * 40} fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={(1 - t) * 0.35 * a} /> : null;
        })}
        {pulse && (
          <g>
            {[0.06, 0.12, 0.18, 0.24].map((d, i) => {
              const tp = Math.max(0, pt - d);
              const q = {x: lerp(DOCK.x - 120, DOCK.x, ease(tp)), y: lerp(-400, DOCK.y + 8, easeIn(tp))};
              return <circle key={i} cx={fmt(q.x)} cy={fmt(q.y)} r={fmt(30 - i * 5)} fill="#9FE8FF" opacity={0.5 - i * 0.1} />;
            })}
            <Glow id={`${id}-pl`} c={pulse} r={220} color="#39C6F4" alpha={0.9} />
            <circle cx={fmt(pulse.x)} cy={fmt(pulse.y)} r={38} fill="#E4FBFF" />
          </g>
        )}
      </Layer>
    </g>
  );
};

// ---------------------------------------------------------------- over the neighbourhood, then a roof edge wipes to him
export const WIPE = {in0: B.past0, cover: B.past0 + 6, out1: B.past0 + 14};

export const Flyover: React.FC<{id: string; f: number}> = ({id, f}) => {
  const t = inv(B.travel0, WIPE.cover, f);
  const dp: DronePose = {x: lerp(380, 1500, t), y: 640 + Math.sin(t * Math.PI) * -26, s: 0.78, pitch: 15 + 3 * Math.sin(f * 0.3), spin: f * 1.9, beacon: 0.5 + 0.5 * Math.sin(f * 0.6)};
  const cam: Cam = {x: dp.x + 40, y: 820, z: 1.15, roll: -4};
  return (
    <g>
      <Layer cam={cam} depth={7}>
        <Lin id={`${id}-sky`} d={rect(-3000, -3000, 9000, 5200)} from={{x: 0, y: -600}} to={{x: 0, y: 1600}} stops={[[0, '#BFE0EE'], [0.8, '#DDEFF4'], [1, '#EEF4EC']]} />
      </Layer>
      <Layer cam={cam} depth={2.4}>
        {Array.from({length: 10}).map((_, i) => (
          <Tree key={i} id={`${id}-ft${i}`} x={-300 + i * 320} y={1240} s={0.7} tint={0.45} />
        ))}
      </Layer>
      <Layer cam={cam} depth={1.3}>
        <rect x={-1500} y={1250} width={6000} height={900} fill={PAL.grass} />
        <House id={`${id}-h1`} x={-200} y={1130} w={520} h={300} wall="#E9DCC2" roof="#8C6E62" door="#6E8C8A" />
        <House id={`${id}-h2`} x={560} y={1150} w={540} h={310} wall="#C4D3DC" roof="#5E6E7E" door="#B06A55" />
        <House id={`${id}-h3`} x={1320} y={1140} w={500} h={290} wall="#D3DDC4" roof="#9B7A64" door="#4F6E8C" />
        <House id={`${id}-h4`} x={2060} y={1150} w={520} h={300} wall="#E3D2C9" roof="#76675E" door="#5E7C7A" />
        <Tree id={`${id}-t1`} x={450} y={1170} s={1.0} />
        <Tree id={`${id}-t2`} x={1220} y={1170} s={1.1} />
        <Tree id={`${id}-t3`} x={1950} y={1170} s={0.95} />
      </Layer>
      <Layer cam={cam} depth={1}>
        <SoftShadow id={`${id}-dsh`} c={{x: dp.x + 120, y: 1380}} rx={180} ry={20} alpha={0.18} />
        <Drone id={`${id}-dr`} p={dp} />
      </Layer>
    </g>
  );
};

/** The foreground roof edge that sweeps across the lens: under it the flyover, behind it his lawn. */
export const RoofWipe: React.FC<{id: string; f: number; before: React.ReactNode; after: React.ReactNode}> = ({id, f, before, after}) => {
  // the edge moves right-to-left across the frame (the drone banks past this roof toward him)
  const t = inv(WIPE.in0, WIPE.out1, f);
  const x = lerp(1500, -1300, ease(t));
  const roof = `M${fmt(x)},-200 L${fmt(x + 1800)},-200 L${fmt(x + 1800)},2200 L${fmt(x + 260)},2200 Q${fmt(x - 120)},1100 ${fmt(x)},-200 Z`;
  const showAfter = f >= WIPE.cover;
  return (
    <g>
      {showAfter ? after : before}
      {t > 0 && t < 1 && (
        <g>
          <defs>
            <linearGradient id={`${id}-rf`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#6E5A50" />
              <stop offset="0.12" stopColor="#4A3C36" />
              <stop offset="1" stopColor="#2E2622" />
            </linearGradient>
          </defs>
          <path d={roof} fill={`url(#${id}-rf)`} />
          {Array.from({length: 14}).map((_, i) => (
            <path key={i} d={`M${fmt(x + 80 + i * 120)},-200 L${fmt(x + 80 + i * 120 - 40)},2200`} stroke="#5C4A42" strokeWidth={10} opacity={0.6} />
          ))}
          <path d={`M${fmt(x)},-200 Q${fmt(x - 120)},1100 ${fmt(x + 260)},2200`} fill="none" stroke="#8C766A" strokeWidth={22} />
        </g>
      )}
    </g>
  );
};
