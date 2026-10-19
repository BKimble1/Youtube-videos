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

// Proportions follow the real car's front elevation (roof ~1.2 m, cowl ~0.93 m, nose ~0.4 m, 2.03 m wide): a low, wide body with a
// shallow windscreen and a narrow roof, a wing standing above it, boomerang headlights on the fender crowns, a low black grille and
// a carbon splitter. Traced by eye against BYD's front views; an illustration, not a factory drawing.
const BODY = [
  'M -1012 470 C -1018 560 -1005 660 -960 740 C -910 810 -820 855 -700 898 C -450 925 -200 932 0 932',
  'C 200 932 450 925 700 898 C 820 855 910 810 960 740 C 1005 660 1018 560 1012 470 C 900 476 790 476 700 470',
  'C 690 360 685 260 680 175 C 300 160 -300 160 -680 175 C -685 260 -690 360 -700 470 C -790 476 -900 476 -1012 470 Z',
].join(' ');
const CABIN = 'M -705 890 C -650 990 -575 1120 -495 1192 C -440 1230 -385 1238 -330 1238 L 330 1238 C 385 1238 440 1230 495 1192 C 575 1120 650 990 705 890 C 300 872 -300 872 -705 890 Z';
const SCREEN = 'M -610 910 C -550 1005 -490 1100 -440 1160 C -412 1190 -380 1202 -340 1204 L 340 1204 C 380 1202 412 1190 440 1160 C 490 1100 550 1005 610 910 C 300 892 -300 892 -610 910 Z';
const ROOF = 'M -500 1190 C -440 1226 -385 1236 -330 1236 L 330 1236 C 385 1236 440 1226 500 1190 C 440 1204 400 1208 340 1208 L -340 1208 C -400 1208 -440 1204 -500 1190 Z';
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
        {/* wing: blade, two posts and end plates; drawn first so the roof sits in front of the posts */}
        <g>
          {[-1, 1].map((q) => <rect key={q} x={q * 300 - 28} y={1225} width={56} height={46} fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.8} />)}
          <path d="M -760 1268 C -400 1256 400 1256 760 1268 L 772 1300 C 400 1288 -400 1288 -772 1300 Z" fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw} />
          {[-1, 1].map((q) => <path key={q} d={`M ${q * 756} 1244 L ${q * 784} 1244 L ${q * 790} 1312 L ${q * 748} 1312 Z`} fill={PAINT.red} stroke={C.ink} strokeWidth={sw * 0.8} />)}
          <path d="M -740 1290 C -400 1278 400 1278 740 1290" fill="none" stroke={PAINT.carbonLight} strokeWidth={6} />
        </g>
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
          <rect x={-700} y={880} width={1400} height={400} fill="#4A6672" />
          {window}
          <rect x={-700} y={880} width={700} height={400} fill={PAINT.glass} opacity={0.92 * (1 - windowReveal)} />
          <rect x={0} y={880} width={700} height={400} fill={PAINT.glass} opacity={0.92 * (1 - windowRevealR)} />
          <path d="M 120 1210 C 240 1090 330 990 380 920 L 470 920 C 410 1000 330 1110 240 1210 Z" fill={PAINT.glassLight} opacity={0.4} />
        </g>
        <path d={SCREEN} fill="none" stroke={C.ink} strokeWidth={sw} />
        <path d={ROOF} fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.8} />
        {/* mirrors on the door tops, at the foot of the A-pillars */}
        {[-1, 1].map((s) => (
          <path key={s} d={`M ${s * 690} 924 L ${s * 905} 944 C ${s * 962} 950 ${s * 968} 1002 ${s * 908} 1012 L ${s * 712} 982 Z`} fill={PAINT.red} stroke={C.ink} strokeWidth={sw * 0.8} />
        ))}
        {/* lower body */}
        <path d={BODY} fill={PAINT.red} stroke={C.ink} strokeWidth={sw} />
        <g>
          <path d="M -680 175 C -300 160 300 160 680 175 L 684 290 C 300 270 -300 270 -684 290 Z" fill={PAINT.redDeep} opacity={0.4} />
          <path d="M -1012 470 C -900 476 -790 476 -700 470 L -700 520 C -800 528 -910 528 -1010 522 Z M 1012 470 C 900 476 790 476 700 470 L 700 520 C 800 528 910 528 1010 522 Z" fill={PAINT.redDeep} opacity={0.5} />
          {/* hood: crease, shoulder highlights and the air-extractor louvres */}
          <path d="M -690 905 C -450 926 -200 932 0 932 C 200 932 450 926 690 905 C 450 905 200 900 0 898 C -200 900 -450 905 -690 905 Z" fill={PAINT.redLight} opacity={0.65} />
          <path d="M -150 905 C -120 760 -90 600 -60 470 M 150 905 C 120 760 90 600 60 470" fill="none" stroke={PAINT.redDeep} strokeWidth={9} opacity={0.5} />
          {[-1, 1].map((s) => [0, 1, 2].map((k) => <path key={`${s}${k}`} d={`M ${s * (250 + k * 70)} ${770 - k * 20} L ${s * (400 + k * 70)} ${790 - k * 20}`} stroke={PAINT.redDeep} strokeWidth={10} strokeLinecap="round" opacity={0.55} />))}
          {/* lower fascia: wide low grille, side air curtains, number plate, carbon splitter */}
          <path d="M -640 345 C -500 372 -250 384 0 384 C 250 384 500 372 640 345 C 650 300 640 262 600 238 C 400 214 -400 214 -600 238 C -640 262 -650 300 -640 345 Z" fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.8} />
          {[-1, 1].map((s) => (
            <path key={s} d={`M ${s * 700} 262 L ${s * 910} 286 L ${s * 920} 420 L ${s * 718} 426 Z`} fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.8} />
          ))}
          <rect x={-190} y={228} width={380} height={112} rx={16} fill="#2B353C" stroke={C.ink} strokeWidth={sw * 0.8} />
          <rect x={-166} y={246} width={332} height={76} rx={8} fill={C.cream} opacity={0.12} />
          <path d="M -1000 214 C -900 168 -560 150 0 150 C 560 150 900 168 1000 214 C 1010 240 960 262 900 262 C 640 232 -640 232 -900 262 C -960 262 -1010 240 -1000 214 Z" fill={PAINT.carbon} stroke={C.ink} strokeWidth={sw * 0.8} />
          <path d="M -900 200 C -560 166 560 166 900 200" fill="none" stroke={PAINT.carbonLight} strokeWidth={6} />
        </g>
        {/* headlights: boomerang clusters with a bright LED outline, high on the fender crowns */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <path d={`M ${s * 985} 790 C ${s * 1005} 700 ${s * 980} 560 ${s * 925} 500 C ${s * 860} 470 ${s * 740} 480 ${s * 650} 530 C ${s * 610} 560 ${s * 560} 610 ${s * 520} 650 C ${s * 700} 700 ${s * 860} 770 ${s * 985} 790 Z`} fill="#1E2F3A" stroke={C.ink} strokeWidth={sw} />
            <path d={`M ${s * 985} 790 C ${s * 1005} 700 ${s * 980} 560 ${s * 925} 500 C ${s * 860} 470 ${s * 740} 480 ${s * 650} 530 C ${s * 610} 560 ${s * 560} 610 ${s * 520} 650`} fill="none" stroke={PAINT.light} strokeWidth={14} opacity={lights} />
            <path d={`M ${s * 520} 650 C ${s * 700} 700 ${s * 860} 770 ${s * 985} 790`} fill="none" stroke={PAINT.light} strokeWidth={9} opacity={0.9 * lights} />
            <path d={`M ${s * 900} 740 C ${s * 800} 700 ${s * 700} 660 ${s * 620} 645`} fill="none" stroke={PAINT.glassLight} strokeWidth={22} strokeLinecap="round" opacity={0.7} />
          </g>
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
