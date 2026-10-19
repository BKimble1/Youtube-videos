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

export type FrontWell = {open: number; spring?: number; damper?: number; actuator?: number; slide?: number; forceL?: number; forceR?: number; springGlowL?: number; springGlowR?: number; damperGlow?: number; limitL?: number; limitR?: number};
export type FrontCarProps = {
  px: number;
  roll?: number; // deg, + = screen-left side down (car rolls toward its right)
  dz?: number; // body heave (mm)
  wl?: number; // screen-left wheel vertical offset (mm), from the road
  wr?: number;
  /** localized windows at the two front corners (screen-left = the car's right-hand side); the rest of the body stays opaque */
  wells?: FrontWell;
  /** @deprecated whole-body transparency (kept at 0): the corner windows replace it */
  cutaway?: number;
  actuator?: number; // symbol visibility
  forceL?: number; // actuator force -1..1 (+ pushes body up on that side)
  forceR?: number;
  springGlow?: number;
  id?: string;
  ghost?: {roll: number; dz: number; color?: string; opacity?: number}[];
  window?: React.ReactNode; // drawn inside the windscreen (cabin view), in body coordinates
  windowReveal?: number; // 0..1 clears the tint on the passenger (screen-left) half
  windowRevealR?: number; // same for the driver (screen-right) half
  overlay?: React.ReactNode; // drawn over the whole body in body coordinates, unclipped (the cabin seen once the camera is inside)
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

const WIN = {x0: 330, x1: 1030, y0: 140, y1: 790};

export const FrontCar: React.FC<FrontCarProps> = (P) => {
  const {px, roll = 0, dz = 0, wl = 0, wr = 0, wells, actuator = 0, forceL = 0, forceR = 0, springGlow = 0, id = 'fc', ghost = [], window, windowReveal = 0, windowRevealR = 0, overlay, lights = 1} = P;
  const sw = INK / px;
  const pose = {roll, dz};
  const bodyT = `translate(0 ${dz}) rotate(${roll} ${ROLL_CENTRE.x} ${ROLL_CENTRE.y})`;
  const bodyInv = `rotate(${-roll} ${ROLL_CENTRE.x} ${ROLL_CENTRE.y}) translate(0 ${-dz})`;
  const open = wells ? Math.max(0, Math.min(1, wells.open)) : 0;
  const o = open * open * (3 - 2 * open);
  const tyre = (s: -1 | 1, off: number, key?: string) => {
    const cx = s * TRACK_HALF;
    return (
      <g key={key ?? s}>
        <rect x={cx - TYRE_W / 2} y={off} width={TYRE_W} height={720} rx={86} fill={PAINT.tyre} stroke={C.ink} strokeWidth={sw} />
        <rect x={cx - TYRE_W / 2 + sw} y={off + 380} width={TYRE_W - 2 * sw} height={120} fill={C.ink} opacity={0.35} />
        {[0.32, 0.5, 0.68].map((k) => (
          <line key={k} x1={cx - TYRE_W / 2 + TYRE_W * k} y1={off + 60} x2={cx - TYRE_W / 2 + TYRE_W * k} y2={off + 660} stroke={PAINT.tyreSide} strokeWidth={14} />
        ))}
      </g>
    );
  };
  // suspension per side: inboard points move with the body, outboard with the wheel
  const corner = (s: -1 | 1, off: number, force: number, glow: number, limit: number) => {
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
        <line x1={lbj[0]} y1={lbj[1]} x2={ubj[0]} y2={ubj[1]} stroke={C.ink} strokeWidth={70} strokeLinecap="round" />
        <line x1={lbj[0]} y1={lbj[1]} x2={ubj[0]} y2={ubj[1]} stroke="#8A979E" strokeWidth={70 - 2 * sw} strokeLinecap="round" />
        {arm(lo, lbj)}
        {arm(up, ubj)}
        <Strut top={top} bottom={bot} px={px} actuator={wells?.actuator ?? actuator} slide={wells?.slide ?? 1} force={force} springGlow={glow} damperGlow={wells?.damperGlow ?? 0} spring={wells?.spring ?? 1} damper={wells?.damper ?? 1} side={s === -1 ? 1 : -1} limitHit={limit} />
        {[lo, up, lbj, ubj].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={24} fill={C.white} stroke={C.ink} strokeWidth={sw * 0.8} />)}
      </g>
    );
  };
  const wx = (s: -1 | 1) => {
    const w = (WIN.x1 - WIN.x0) * o, h = (WIN.y1 - WIN.y0) * o;
    const cx = s * (WIN.x0 + WIN.x1) / 2, cy = (WIN.y0 + WIN.y1) / 2;
    return {x: cx - w / 2, y: cy - h / 2, w, h};
  };
  return (
    <g strokeLinejoin="round">
      <ellipse cx={0} cy={6} rx={1180} ry={60} fill={C.ink} opacity={0.18} />
      {tyre(-1, wl)}
      {tyre(1, wr)}
      {ghost.map((g, i) => (
        <g key={i} transform={`translate(0 ${g.dz}) rotate(${g.roll} ${ROLL_CENTRE.x} ${ROLL_CENTRE.y})`} opacity={g.opacity ?? 0.9}>
          <path d={BODY + ' ' + CABIN} fill="none" stroke={g.color ?? C.inkMuted} strokeWidth={sw * 0.9} strokeDasharray={`${16 / px} ${12 / px}`} />
        </g>
      ))}
      <g transform={bodyT}>
        {/* cabin and glass */}
        <path d={CABIN} fill={PAINT.red} stroke={C.ink} strokeWidth={sw} />
        <defs>
          <clipPath id={`scr-${id}`}>
            <path d={SCREEN} />
          </clipPath>
          <clipPath id={`bd-${id}`}>
            <path d={BODY} />
          </clipPath>
        </defs>
        <g clipPath={`url(#scr-${id})`}>
          <rect x={-700} y={700} width={1400} height={700} fill="#4A6672" />
          {window}
          {/* tint over the glass: cleared on the passenger half when revealed */}
          <rect x={-700} y={700} width={700} height={700} fill={PAINT.glass} opacity={0.92 * (1 - windowReveal)} />
          <rect x={0} y={700} width={700} height={700} fill={PAINT.glass} opacity={0.92 * (1 - windowRevealR)} />
          <path d="M 120 1240 C 260 1000 360 880 420 800 L 520 800 C 450 900 360 1040 260 1240 Z" fill={PAINT.glassLight} opacity={0.45} />
        </g>
        <path d={SCREEN} fill="none" stroke={C.ink} strokeWidth={sw} />
        {/* mirrors */}
        {[-1, 1].map((s) => (
          <path key={s} d={`M ${s * 590} 905 L ${s * 1030} 910 C ${s * 1062} 918 ${s * 1062} 968 ${s * 1030} 978 L ${s * 630} 968 Z`} fill={PAINT.red} stroke={C.ink} strokeWidth={sw * 0.8} />
        ))}
        {/* lower body */}
        <path d={BODY} fill={PAINT.red} stroke={C.ink} strokeWidth={sw} />
        <g>
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
        <path d={BODY} fill="none" stroke={C.ink} strokeWidth={sw} />
        {overlay}
        {/* corner windows: a clean cream backing cut into the paint, clipped to the body */}
        {o > 0.001 && [-1, 1].map((s) => {
          const r = wx(s as -1 | 1);
          return (
            <g key={s} clipPath={`url(#bd-${id})`}>
              <clipPath id={`win-${id}-${s}`}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={110 * o} />
              </clipPath>
              <g clipPath={`url(#win-${id}-${s})`}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={C.paper} />
                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={110 * o} fill="none" stroke={C.paperDeep} strokeWidth={80} />
              </g>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={110 * o} fill="none" stroke={C.ink} strokeWidth={sw * 1.5} />
            </g>
          );
        })}
      </g>
      {/* what the windows show: the tyre and the corner hardware (world space, clipped to the windows that ride with the body) */}
      {o > 0.001 && wells && (
        <g transform={bodyT}>
          {[-1, 1].map((s) => {
            const r = wx(s as -1 | 1);
            return (
              <g key={s} clipPath={`url(#bd-${id})`}>
                <clipPath id={`wc-${id}-${s}`}>
                  <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={110 * o} />
                </clipPath>
                <g clipPath={`url(#wc-${id}-${s})`}>
                  <g transform={bodyInv}>
                    {tyre(s as -1 | 1, s === -1 ? wl : wr, `w${s}`)}
                    <g opacity={o}>{corner(s as -1 | 1, s === -1 ? wl : wr, s === -1 ? wells.forceL ?? 0 : wells.forceR ?? 0, s === -1 ? wells.springGlowL ?? 0 : wells.springGlowR ?? 0, s === -1 ? wells.limitL ?? 0 : wells.limitR ?? 0)}</g>
                  </g>
                </g>
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};
