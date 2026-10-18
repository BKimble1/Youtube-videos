// Front view of the car (driving toward the camera), world millimetres, y up, origin on the road at the centre line.
// Screen-left is the car's right-hand side. The body rolls about a roll centre; wheels stay planted on the road (their
// own vertical offsets come from the road), and the double-wishbone links, springs and actuators connect the two,
// so a rolled body visibly compresses the outside spring instead of rotating the shell on its own.
import React from 'react';
import {C} from '../theme';
import {DIM, PAINT} from './geom';
import {INK, Strut} from './parts';

export const TRACK_HALF = DIM.trackF / 2; // 860
export const TYRE_W = 285;
export const ROLL_CENTRE = {x: 0, y: 320};

export type FrontCarProps = {
  px: number;
  roll?: number; // deg, + = screen-left side down (car rolls toward its right)
  dz?: number; // body heave (mm)
  wl?: number; // screen-left wheel vertical offset (mm), from the road
  wr?: number;
  cutaway?: number;
  actuator?: number; // symbol visibility
  forceL?: number; // actuator force -1..1 (+ pushes body up on that side)
  forceR?: number;
  springGlow?: number;
  id?: string;
  ghost?: {roll: number; dz: number; color?: string; opacity?: number}[];
  window?: React.ReactNode; // drawn inside the windscreen (cabin view), in body coordinates
  windowReveal?: number; // 0..1 clears the tint on the passenger (screen-left) half
  lights?: number;
};

export const frontBody = (p: {roll: number; dz: number}, x: number, y: number): [number, number] => {
  const a = (p.roll * Math.PI) / 180;
  const rx = x - ROLL_CENTRE.x, ry = y - ROLL_CENTRE.y;
  return [ROLL_CENTRE.x + rx * Math.cos(a) - ry * Math.sin(a), ROLL_CENTRE.y + p.dz + rx * Math.sin(a) + ry * Math.cos(a)];
};

const BODY = [
  'M -1012 470 C -1018 560 -1000 640 -950 690 C -900 730 -840 745 -760 742',
  'C -680 738 -600 700 -520 680 C -350 650 -150 640 0 640 C 150 640 350 650 520 680 C 600 700 680 738 760 742',
  'C 840 745 900 730 950 690 C 1000 640 1018 560 1012 470 C 900 476 790 476 700 470',
  'C 690 360 685 260 680 175 C 300 160 -300 160 -680 175 C -685 260 -690 360 -700 470 C -790 476 -900 476 -1012 470 Z',
].join(' ');
const CABIN = 'M -600 690 C -560 850 -500 1080 -450 1240 C -430 1278 -390 1293 -340 1295 L 340 1295 C 390 1293 430 1278 450 1240 C 500 1080 560 850 600 690 C 300 660 -300 660 -600 690 Z';
const SCREEN = 'M -540 722 C -505 860 -455 1060 -415 1200 C -400 1236 -370 1252 -330 1254 L 330 1254 C 370 1252 400 1236 415 1200 C 455 1060 505 860 540 722 C 300 702 -300 702 -540 722 Z';
export const WINDSCREEN = SCREEN;

export const FrontCar: React.FC<FrontCarProps> = (P) => {
  const {px, roll = 0, dz = 0, wl = 0, wr = 0, cutaway = 0, actuator = 0, forceL = 0, forceR = 0, springGlow = 0, id = 'fc', ghost = [], window, windowReveal = 0, lights = 1} = P;
  const sw = INK / px;
  const pose = {roll, dz};
  const bodyT = `translate(0 ${dz}) rotate(${roll} ${ROLL_CENTRE.x} ${ROLL_CENTRE.y})`;
  const panel = 1 - 0.86 * cutaway;
  const tyre = (s: -1 | 1, off: number) => {
    const cx = s * TRACK_HALF;
    return (
      <g key={s}>
        <rect x={cx - TYRE_W / 2} y={off} width={TYRE_W} height={720} rx={86} fill={PAINT.tyre} fillOpacity={1 - 0.7 * cutaway} stroke={C.ink} strokeWidth={sw} />
        <rect x={cx - TYRE_W / 2 + sw} y={off + 380} width={TYRE_W - 2 * sw} height={120} fill={C.ink} opacity={0.35 * (1 - cutaway)} />
        {[0.32, 0.5, 0.68].map((k) => (
          <line key={k} x1={cx - TYRE_W / 2 + TYRE_W * k} y1={off + 60} x2={cx - TYRE_W / 2 + TYRE_W * k} y2={off + 660} stroke={PAINT.tyreSide} strokeWidth={14} opacity={1 - 0.7 * cutaway} />
        ))}
      </g>
    );
  };
  // suspension per side: inboard points move with the body, outboard with the wheel
  const corner = (s: -1 | 1, off: number, force: number) => {
    const lo = frontBody(pose, s * 300, 200), up = frontBody(pose, s * 380, 560);
    const lbj: [number, number] = [s * 790, 190 + off], ubj: [number, number] = [s * 770, 590 + off];
    const top = frontBody(pose, s * 470, 640);
    const bot: [number, number] = [s * 640, 205 + off];
    const arm = (a: [number, number], b: [number, number]) => (
      <g>
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.ink} strokeWidth={46} strokeLinecap="round" />
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#AEBBC2" strokeWidth={46 - 2 * sw} strokeLinecap="round" />
      </g>
    );
    return (
      <g key={s}>
        {/* upright */}
        <line x1={lbj[0]} y1={lbj[1]} x2={ubj[0]} y2={ubj[1]} stroke={C.ink} strokeWidth={70} strokeLinecap="round" />
        <line x1={lbj[0]} y1={lbj[1]} x2={ubj[0]} y2={ubj[1]} stroke="#8A979E" strokeWidth={70 - 2 * sw} strokeLinecap="round" />
        {arm(lo, lbj)}
        {arm(up, ubj)}
        <Strut top={top} bottom={bot} px={px} actuator={actuator} force={force} springGlow={springGlow} side={s === -1 ? 1 : -1} />
        {[lo, up, lbj, ubj].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={24} fill={C.white} stroke={C.ink} strokeWidth={sw * 0.8} />)}
      </g>
    );
  };
  return (
    <g strokeLinejoin="round">
      <ellipse cx={0} cy={6} rx={1180} ry={60} fill={C.ink} opacity={0.18} />
      {tyre(-1, wl)}
      {tyre(1, wr)}
      {cutaway > 0 && (
        <g opacity={cutaway}>
          {corner(-1, wl, forceL)}
          {corner(1, wr, forceR)}
        </g>
      )}
      {ghost.map((g, i) => (
        <g key={i} transform={`translate(0 ${g.dz}) rotate(${g.roll} ${ROLL_CENTRE.x} ${ROLL_CENTRE.y})`} opacity={g.opacity ?? 0.9}>
          <path d={BODY + ' ' + CABIN} fill="none" stroke={g.color ?? C.inkMuted} strokeWidth={sw * 0.9} strokeDasharray={`${16 / px} ${12 / px}`} />
        </g>
      ))}
      <g transform={bodyT}>
        {/* cabin and glass */}
        <path d={CABIN} fill={PAINT.red} fillOpacity={panel} stroke={C.ink} strokeWidth={sw} />
        {cutaway > 0 && <path d={CABIN} fill={C.cream} fillOpacity={0.5 * cutaway} />}
        <defs>
          <clipPath id={`scr-${id}`}>
            <path d={SCREEN} />
          </clipPath>
        </defs>
        <g clipPath={`url(#scr-${id})`}>
          <rect x={-700} y={700} width={1400} height={700} fill="#4A6672" />
          {window}
          {/* tint over the glass: cleared on the passenger half when revealed */}
          <rect x={-700} y={700} width={700} height={700} fill={PAINT.glass} opacity={0.92 * (1 - windowReveal)} />
          <rect x={0} y={700} width={700} height={700} fill={PAINT.glass} opacity={0.92} />
          <path d="M 120 1240 C 260 1000 360 880 420 800 L 520 800 C 450 900 360 1040 260 1240 Z" fill={PAINT.glassLight} opacity={0.45} />
        </g>
        <path d={SCREEN} fill="none" stroke={C.ink} strokeWidth={sw} />
        {/* mirrors */}
        {[-1, 1].map((s) => (
          <path key={s} d={`M ${s * 590} 905 L ${s * 1030} 910 C ${s * 1062} 918 ${s * 1062} 968 ${s * 1030} 978 L ${s * 630} 968 Z`} fill={PAINT.red} fillOpacity={panel} stroke={C.ink} strokeWidth={sw * 0.8} />
        ))}
        {/* lower body */}
        <path d={BODY} fill={PAINT.red} fillOpacity={panel} stroke={C.ink} strokeWidth={sw} />
        {cutaway > 0 && <path d={BODY} fill={C.cream} fillOpacity={0.5 * cutaway} />}
        <g opacity={panel}>
          <path d="M -680 175 C -300 160 300 160 680 175 L 684 290 C 300 270 -300 270 -684 290 Z" fill={PAINT.redDeep} opacity={0.4} />
          <path d="M -1012 470 C -900 476 -790 476 -700 470 L -700 520 C -800 528 -910 528 -1010 522 Z M 1012 470 C 900 476 790 476 700 470 L 700 520 C 800 528 910 528 1010 522 Z" fill={PAINT.redDeep} opacity={0.5} />
          {/* intakes */}
          <path d="M -420 235 L 420 235 C 450 300 450 380 420 440 L -420 440 C -450 380 -450 300 -420 235 Z" fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.8} />
          {[-1, 1].map((s) => (
            <path key={s} d={`M ${s * 480} 245 L ${s * 640} 250 L ${s * 652} 450 L ${s * 490} 440 Z`} fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.8} />
          ))}
          <path d="M -690 175 C -300 158 300 158 690 175 L 690 205 C 300 188 -300 188 -690 205 Z" fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.6} />
          {/* hood highlight and centre crease */}
          <path d="M -500 676 C -300 652 300 652 500 676 C 300 664 -300 664 -500 676 Z" fill={PAINT.redLight} opacity={0.7} />
          {[-1, 1].map((s) => <path key={s} d={`M ${s * 960} 680 C ${s * 900} 722 ${s * 840} 736 ${s * 770} 738 C ${s * 840} 728 ${s * 890} 712 ${s * 930} 680 Z`} fill={PAINT.redLight} opacity={0.7} />)}
        </g>
        {/* light signature: thin LED blades along the fender tops */}
        {[-1, 1].map((s) => (
          <path key={s} d={`M ${s * 985} 590 C ${s * 900} 640 ${s * 760} 668 ${s * 560} 672 L ${s * 560} 650 C ${s * 750} 646 ${s * 880} 618 ${s * 972} 566 Z`} fill={PAINT.light} opacity={lights} stroke={C.ink} strokeWidth={sw * 0.6} />
        ))}
        <path d={BODY} fill="none" stroke={cutaway > 0.5 ? PAINT.redDeep : C.ink} strokeWidth={sw * (1 + 0.25 * cutaway)} />
      </g>
    </g>
  );
};
