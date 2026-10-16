import React from 'react';
import {C, F} from '../theme';
import {rand} from '../lib/anim';
import {E, kf, sp, tw, SOFT} from '../lib/motion';
import {Arrow} from './base';

/**
 * Explanatory vector art (all original). The car is a deliberately generic FRONT CROSS-SECTION, never a
 * Roadster silhouette: we have not inspected the revealed design, and the brief forbids drawing a car that
 * does not exist. Every diagram carries an "illustration" chip in the shot that uses it.
 * Local car coordinates: origin at body centre, y down; floor at y = +90, wheel bottoms at y = +160.
 */
const INK = 5;

export const FrontCar: React.FC<{fan?: number | null; tank?: boolean; nozzles?: boolean; skirts?: boolean; body?: string}> = ({
  fan = null, tank = false, nozzles = false, skirts = false, body = C.coral,
}) => (
  <g strokeLinejoin="round" strokeLinecap="round">
    {/* wheels */}
    {[-1, 1].map((s) => (
      <rect key={s} x={s * 252 - 44} y={30} width={88} height={130} rx={26} fill={C.ink} stroke={C.ink} strokeWidth={INK} />
    ))}
    {[-1, 1].map((s) => (
      <rect key={'h' + s} x={s * 252 - 18} y={70} width={36} height={50} rx={10} fill={C.inkMuted} />
    ))}
    {/* cabin */}
    <path d="M -175 -38 L -128 -150 Q -120 -164 -100 -164 L 100 -164 Q 120 -164 128 -150 L 175 -38 Z" fill={C.blueLight} stroke={C.ink} strokeWidth={INK} />
    <path d="M -96 -140 L 96 -140 L 132 -52 L -132 -52 Z" fill={C.blue} opacity={0.55} />
    {/* body */}
    <path d="M -305 -10 Q -305 -42 -270 -44 L 270 -44 Q 305 -42 305 -10 L 300 70 Q 298 90 276 90 L -276 90 Q -298 90 -300 70 Z" fill={body} stroke={C.ink} strokeWidth={INK} />
    <path d="M -280 8 L 280 8" stroke={C.coralDeep} strokeWidth={6} opacity={0.6} />
    {/* lights */}
    {[-1, 1].map((s) => <rect key={'l' + s} x={s * 230 - 34} y={-22} width={68} height={20} rx={9} fill={C.cream} stroke={C.ink} strokeWidth={4} />)}
    {skirts && [-1, 1].map((s) => <path key={'sk' + s} d={`M ${s * 196} 90 L ${s * 196} 142`} stroke={C.ink} strokeWidth={9} />)}
    {tank && (
      <g>
        <rect x={-120} y={18} width={240} height={52} rx={26} fill={C.saffronLight} stroke={C.ink} strokeWidth={4} />
        <path d="M -84 30 L -84 58 M -40 30 L -40 58 M 4 30 L 4 58 M 48 30 L 48 58" stroke={C.saffronDeep} strokeWidth={5} />
      </g>
    )}
    {nozzles && [[-308, -30], [308, -30], [-300, 76], [300, 76]].map(([x, y], i) => (
      <circle key={'n' + i} cx={x} cy={y} r={14} fill={C.inkSoft} stroke={C.ink} strokeWidth={4} />
    ))}
    {fan !== null && (
      <g transform="translate(0 64)">
        <circle r={46} fill={C.cream} stroke={C.ink} strokeWidth={INK} />
        <g transform={`rotate(${fan})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <path key={a} d="M 0 0 Q 14 -14 8 -38 Q -6 -30 -4 -4 Z" transform={`rotate(${a})`} fill={C.blue} stroke={C.ink} strokeWidth={3} />
          ))}
        </g>
        <circle r={8} fill={C.ink} />
      </g>
    )}
  </g>
);

const Label: React.FC<{x: number; y: number; text: string; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end'; o?: number; weight?: number}> = ({
  x, y, text, color = C.ink, size = 36, anchor = 'middle', o = 1, weight = 800,
}) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={F.body} fontWeight={weight} fontSize={size} fill={color} opacity={o}
    stroke={C.paper} strokeWidth={10} paintOrder="stroke" strokeLinejoin="round">{text}</text>
);

/**
 * Upside-down on the ramp: the fan empties the thin gap between floor and ramp, the outside air pressure is now
 * larger than the pressure in the gap, so the air pushes the car up into the ramp. Gravity pulls it down.
 * `f` = frames since the diagram began. ~105 frames.
 */
export const SuctionDiagram: React.FC<{f: number; fanAt?: number; gapAt?: number; pushAt?: number; gravAt?: number}> = ({
  f, fanAt = 6, gapAt = 18, pushAt = 40, gravAt = 30,
}) => {
  const cx = 500, cy = 410;
  const spin = Math.max(0, f - fanAt);
  const fanAngle = spin < 80 ? spin * spin * 0.35 : 2240 + (spin - 80) * 28; // spins up over ~2.7 s, then steady
  const gap = tw(f, gapAt, 22);
  const push = tw(f, pushAt, 20, E.back);
  const pin = kf(f, [[pushAt, 0], [pushAt + 12, -7, E.out], [pushAt + 20, -5]]);
  const grav = tw(f, gravAt, 14);
  return (
    <svg viewBox="0 0 1000 1000" width="100%" height="100%">
      {/* the ramp, seen end-on, upside down above the car */}
      <g transform={`translate(0 ${kf(f, [[0, -40], [12, 0, E.out]])})`}>
        <rect x={40} y={160} width={920} height={92} rx={14} fill={C.woodLight} stroke={C.ink} strokeWidth={INK} />
        {[...Array(9)].map((_, i) => <path key={i} d={`M ${90 + i * 100} 172 L ${130 + i * 100} 240`} stroke={C.wood} strokeWidth={7} />)}
        <Label x={500} y={140} text="RAMP (CAR IS UPSIDE DOWN)" size={34} color={C.inkSoft} />
      </g>
      {/* low-pressure gap between floor and ramp */}
      <rect x={302} y={256} width={396} height={60 + pin} fill={C.blueLight} opacity={0.9 * gap} />
      {[...Array(14)].map((_, i) => {
        const side = i % 2 ? 1 : -1;
        const ph = ((Math.max(0, f - fanAt) * 0.022 + rand(i * 7)) % 1);
        const x = cx + side * (190 - ph * 175);
        const y = 270 + rand(i * 13) * 36 + pin;
        return <circle key={i} cx={x} cy={y} r={7} fill={C.blueDeep} opacity={gap * (1 - ph) * 0.9} />;
      })}
      <Label x={500} y={232 + 64 + pin} text="LOW PRESSURE" size={30} color={C.blueDeep} o={gap} />
      {/* the car, inverted */}
      <g transform={`translate(${cx} ${cy + pin}) rotate(180)`}>
        <FrontCar fan={fanAngle} skirts />
      </g>
      {/* outside air pushes up into the ramp */}
      {[-1, 0, 1].map((k) => (
        <Arrow key={k} x1={cx + k * 210} y1={790 - 30 * push} x2={cx + k * 210} y2={790 - 30 * push - 150 * push} w={34} h={62} fill={C.blue} opacity={push} />
      ))}
      <Label x={500} y={850} text="AIR PRESSURE PUSHES" size={44} color={C.blueDeep} o={push} />
      <Label x={500} y={902} text="THE CAR INTO THE RAMP" size={44} color={C.blueDeep} o={push} />
      {/* gravity, the thing it has to beat */}
      <g opacity={grav}>
        <Arrow x1={880} y1={420} x2={880} y2={420 + 120 * grav} w={22} h={44} fill={C.coral} />
        <Label x={880} y={402} text="gravity" size={30} color={C.coralDeep} />
      </g>
      <Label x={250} y={500} text="fan" size={30} color={C.ink} o={tw(f, fanAt + 4, 10)} anchor="end" />
      <path d="M 262 492 Q 400 420 470 352" fill="none" stroke={C.ink} strokeWidth={4} strokeDasharray="10 9" opacity={tw(f, fanAt + 4, 10)} />
    </svg>
  );
};

/** Gas puff stream from a nozzle at local (nx, ny) firing along (dx, dy), while `on` (0..1). */
const Jet: React.FC<{nx: number; ny: number; dx: number; dy: number; on: number; f: number; seed: number}> = ({nx, ny, dx, dy, on, f, seed}) => {
  if (on <= 0.01) return null;
  return (
    <g>
      {[...Array(9)].map((_, i) => {
        const ph = ((f * 0.09 + i / 9 + rand(seed + i) * 0.1) % 1);
        const d = 20 + ph * 210;
        const spread = (rand(seed * 3 + i) - 0.5) * 70 * ph;
        const x = nx + dx * d - dy * spread;
        const y = ny + dy * d + dx * spread;
        return <circle key={i} cx={x} cy={y} r={14 + ph * 34} fill={C.white} stroke={C.blue} strokeWidth={5} opacity={on * (1 - ph * 0.85)} />;
      })}
      <path d={`M ${nx} ${ny} L ${nx + dx * 70} ${ny + dy * 70}`} stroke={C.blue} strokeWidth={20 * on} strokeLinecap="round" opacity={0.85} />
    </g>
  );
};

/**
 * In the air: a compressed-air tank feeds nozzles at the corners. Firing a diagonal pair rolls the car; the
 * opposite pair stops the roll. Starts inverted (just off the ramp) and finishes upright. ~110 frames.
 */
export const ThrusterDiagram: React.FC<{f: number; showGround?: boolean; a0?: number; a1?: number; b0?: number; b1?: number; labels?: boolean}> = ({
  f, showGround = true, a0 = 8, a1 = 40, b0 = 58, b1 = 82, labels = true,
}) => {
  // jets A (a0..a1) start the roll, jets B (b0..b1) stop it; the roll itself runs between the two firings
  const roll = kf(f, [[a0 + 4, 180], [b1 - 4, 0, E.inOut]]);
  const lift = kf(f, [[0, 30], [(a0 + b0) / 2, -40, E.out], [b1 + 10, 40, E.in]]);
  const fireA = tw(f, a0, 4) * (1 - tw(f, a1, 6));
  const fireB = tw(f, b0, 4) * (1 - tw(f, b1, 6));
  const cx = 500, cy = 470 + lift;
  const arc = tw(f, a0 + 6, 16) * (1 - tw(f, b1 + 2, 10));
  const tankLbl = labels ? tw(f, b1 - 2, 12) : 0;
  return (
    <svg viewBox="0 0 1000 1000" width="100%" height="100%">
      {showGround && <path d="M 30 905 L 970 905" stroke={C.inkSoft} strokeWidth={8} strokeLinecap="round" opacity={0.5 + 0.5 * tw(f, b0 + 12, 20)} />}
      {/* roll arrow */}
      {/* the jets turn the car counter-clockwise on screen, so the arrow runs right → left over the top */}
      <g opacity={arc} transform={`translate(${cx} ${cy})`}>
        <g transform="scale(-1 1)">
          <path d="M -330 -150 A 360 360 0 0 1 330 -150" fill="none" stroke={C.saffronDeep} strokeWidth={16} strokeLinecap="round" strokeDasharray={`${1100 * arc} 2000`} />
          <path d="M 330 -150 l -64 6 l 40 50 Z" fill={C.saffronDeep} transform="rotate(14 330 -150)" opacity={tw(f, a0 + 18, 4)} />
        </g>
        <text x={-372} y={-60} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={46} fill={C.saffronDeep}
          stroke={C.paper} strokeWidth={10} paintOrder="stroke" opacity={tw(f, a0 + 18, 6)}>ROLL</text>
      </g>
      <g transform={`translate(${cx} ${cy}) rotate(${roll})`}>
        <Jet nx={-308} ny={-30} dx={0} dy={-1} on={fireA} f={f} seed={11} />
        <Jet nx={300} ny={76} dx={0} dy={1} on={fireA} f={f} seed={23} />
        <Jet nx={308} ny={-30} dx={0} dy={-1} on={fireB} f={f} seed={37} />
        <Jet nx={-300} ny={76} dx={0} dy={1} on={fireB} f={f} seed={41} />
        <FrontCar tank nozzles />
      </g>
      {labels && <Label x={500} y={70} text="COMPRESSED-GAS JETS: NO FLAME" size={36} color={C.blueDeep} o={tw(f, 10, 12)} />}
      <g opacity={tankLbl}>
        <Label x={500} y={cy + 230} text="air tank feeds the jets" size={34} color={C.saffronDeep} />
      </g>
    </svg>
  );
};

/** Spring-in helper for diagram panels. */
export const enter = (f: number) => sp(f, 0, SOFT);
