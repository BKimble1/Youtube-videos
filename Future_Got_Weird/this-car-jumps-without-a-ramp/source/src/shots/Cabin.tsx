// 1:33–1:48 — the passenger. The bend again, front view; the camera pushes through the windscreen into the cabin; the
// passenger on the outside seat is held by the belt and pressed into the outside bolster; then the camera backs out and the
// car runs through the lens into the real replay.
//   93.4   front view, level car in the bend ("a level car doesn't make the corner disappear")
//   95.5   push into the passenger half of the windscreen, then through the glass
//   97.0   the seat's sideways force on the passenger (one short arrow that stops at the body, never crossing it)
//   101    pressed into the bolster, a little lean; "less lean, not less force"
//   106.5  back out to the exterior; the car runs through the lens
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import {w} from '../cues';
import {FrontCar, TRACK_HALF} from '../car/front';
import {Arrow} from '../car/parts';
import {Callout, Label, Stage} from '../kit/stage';
import {TrackScene, BEND_START, trackAt} from '../kit/track3d';
import {Cam3, carToWorld} from '../kit/view3d';
import {Character, IDLE, Pose} from '../kit/Character';
import {CAST} from '../kit/cast';
import {easeInOut, keys, lerp, seg, smooth, win} from '../kit/util';
import {SPEED} from './Bend';

export const T5 = {
  and: w('b5', 'and'),
  corner: w('b5', 'corner'),
  disappear: w('b5', 'disappear'),
  your: w('b5', 'your'),
  sideways: w('b5', 'sideways'),
  force: w('b5', 'force'),
  turn: w('b5', 'turn'),
  seat: w('b5', 'seat'),
  provides: w('b5', 'provides'),
  you: w('b5', 'you'),
  pressed: w('b5', 'pressed'),
  bolster: w('b5', 'bolster'),
  leans: w('b5', 'leans'),
  less: w('b5', 'less'),
  bodyCtl: w('b5', 'body', 1),
  cancellation: w('b5', 'cancellation'),
  watch: w('b6', 'watch'),
};
export const CABIN_IN = T5.and - 0.0;
export const CABIN_OUT = T5.watch - 0.3; // = the real replay's first frame (108.04)
export const REPLAY_AT = 108.04;
const sAt = (t: number) => BEND_START + 50000 + (t - CABIN_IN) * SPEED;

const FRONT_F = 2100, FRONT_H = 1500, D_CAR = 5200;
const SEAT_X = -330; // the outside (car's right-hand) seat, screen-left
const ROLL = 0.8;

const GL = {tint: '#3E4A52'};

/** The cabin as seen through the glass (body coordinates, mm, y up): back wall, the passenger's seat, the passenger, the belt. */
const CabinInGlass: React.FC<{frame: number; press: number; lean: number}> = ({frame, press, lean}) => {
  const k = 1.85; // mm per character unit (Crew proportions kept; sized to sit under the roof)
  const pose: Pose = {...IDLE, lean: -lean, tilt: -lean * 0.8, lookX: 0.1, lookY: 0.05, brows: 0.05, mouth: 'flat', armL: {a: 6, b: 8}, armR: {a: 6, b: 8}};
  const bx0 = SEAT_X - 240, bx1 = SEAT_X + 240;
  const px = SEAT_X - press * 16;
  return (
    <g>
      <rect x={-700} y={700} width={1400} height={700} fill={GL.tint} />
      <rect x={-60} y={700} width={120} height={300} fill="#2F3940" />
      {/* passenger seat: back and headrest */}
      <path d={`M ${bx0 + 60} 640 L ${bx1 - 60} 640 L ${bx1 - 50} 1150 C ${bx1 - 60} 1215 ${bx0 + 60} 1215 ${bx0 + 50} 1150 Z`} fill="#2B3238" stroke={C.ink} strokeWidth={8} />
      {/* driver seat, empty, on the other side of the console */}
      <path d={`M ${-SEAT_X - 190} 640 L ${-SEAT_X + 190} 640 L ${-SEAT_X + 180} 1120 C ${-SEAT_X + 160} 1170 ${-SEAT_X - 160} 1170 ${-SEAT_X - 180} 1120 Z`} fill="#2B3238" stroke={C.ink} strokeWidth={8} />
      {/* passenger (Crew rig, unchanged proportions) */}
      <g transform={`translate(${px} 330) scale(${k} ${-k})`}>
        <g transform="translate(-200 -500)">
          <Character look={CAST.clerkB} pose={pose} frame={frame} seed={9} shadow={false} life={0.25} eyeDarts={false} />
        </g>
      </g>
      {/* seat belt: over the outboard shoulder (below the chin), across the chest to the inboard hip; the strap above the shoulder
          rises outside the head toward the pillar, so it never crosses the face */}
      {(() => {
        const sx = SEAT_X - 118 - press * 14, sy = 892;
        const ex = SEAT_X + 125, ey = 705;
        return (
          <g>
            <path d={`M ${sx - 150} 1140 L ${sx - 62} 1130 L ${sx + 18} ${sy + 18} L ${sx - 18} ${sy + 36} Z`} fill="#4A545B" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
            <path d={`M ${sx - 22} ${sy + 30} L ${ex} ${ey} L ${ex + 58} ${ey + 14} L ${sx + 40} ${sy - 6} Z`} fill="#4A545B" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
            <rect x={ex - 6} y={ey - 24} width={86} height={46} rx={10} fill="#C9D3D8" stroke={C.ink} strokeWidth={6} />
          </g>
        );
      })()}
      {/* dashboard across the bottom of the glass */}
      <path d="M -700 700 L 700 700 L 700 805 C 300 830 -300 830 -700 805 Z" fill="#262E33" stroke={C.ink} strokeWidth={8} />
    </g>
  );
};

/** What lies beyond the glass: pillars, door panel, the outside bolster (it gives under the passenger), the side window. Faded in
 *  as the camera moves inside, so nothing pops. The sideways force is drawn here: it starts on the bolster and stops at the body. */
const CabinOuter: React.FC<{reveal: number; press: number; arrow: number; px: number}> = ({reveal, press, arrow, px}) => {
  if (reveal <= 0.001) return null;
  const sq = 34 * press;
  const bx0 = SEAT_X - 240;
  return (
    <g opacity={reveal}>
      {/* A-pillars and the door panel on the outside of the turn */}
      <path d="M -1100 640 L -690 640 L -520 1330 L -1100 1330 Z" fill="#2B3238" stroke={C.ink} strokeWidth={8} />
      <path d="M -1100 640 L -700 640 L -690 760 L -1100 780 Z" fill="#353E45" stroke={C.ink} strokeWidth={8} />
      <rect x={-1100} y={1250} width={1500} height={300} fill="#222A2F" />
      <path d="M 1100 640 L 690 640 L 520 1330 L 1100 1330 Z" fill="#2B3238" stroke={C.ink} strokeWidth={8} />
      <rect x={-400} y={1250} width={1000} height={300} fill="#222A2F" />
      {/* the outside bolster, squashed by the passenger */}
      <path d={`M ${bx0 + 30 - sq * 0.35} 640 C ${bx0 - 40 - sq} 800 ${bx0 - 40 - sq} 980 ${bx0 + 10 - sq * 0.6} 1090 L ${bx0 + 105} 1070 C ${bx0 + 86} 940 ${bx0 + 84} 800 ${bx0 + 100} 650 Z`} fill="#353E45" stroke={C.ink} strokeWidth={8} />
      <path d={`M ${bx0 + 14 - sq * 0.4} 700 C ${bx0 - 20 - sq} 840 ${bx0 - 20 - sq} 960 ${bx0 + 8 - sq * 0.6} 1040`} fill="none" stroke={C.saffron} strokeWidth={10} strokeDasharray="22 16" opacity={0.8} />
      <path d={`M ${SEAT_X + 240} 640 C ${SEAT_X + 290} 800 ${SEAT_X + 290} 980 ${SEAT_X + 250} 1080 L ${SEAT_X + 150} 1060 C ${SEAT_X + 164} 940 ${SEAT_X + 166} 800 ${SEAT_X + 152} 650 Z`} fill="#353E45" stroke={C.ink} strokeWidth={8} />
      {/* the seat's force on the passenger: tail on the bolster, tip at the body */}
      <Arrow x={bx0 - 90 - sq} y={880} dx={170 + sq * 0.6} dy={0} px={px} color={C.teal} width={18} head={36} opacity={arrow} />
    </g>
  );
};

export const Cabin: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const s = sAt(t);
  const tp = trackAt(s);
  const pose = {e: tp.e, n: tp.n, psi: tp.psi};
  // the car runs through the lens at the very end
  const passIn = CABIN_OUT - 0.55;
  const pass = seg(t, passIn, CABIN_OUT);
  const dCar = lerp(D_CAR, 380, pass * pass * pass);
  const eye = carToWorld(pose, [1450 + dCar, FRONT_H, 0]);
  const cam: Cam3 = {eye, yaw: pose.psi + Math.PI, pitch: 0, f: FRONT_F, cx: 960, cy: 300};
  const sc = FRONT_F / dCar;
  const gy = 300 + (FRONT_F * FRONT_H) / dCar;

  // the push into the passenger half of the glass, through it (a short dip through the dark glass), and back out
  const IN0 = T5.disappear - 0.35, IN1 = T5.your + 0.3; // zoom in
  const OUT0 = T5.cancellation - 0.1, OUT1 = CABIN_OUT - 0.65; // zoom out
  const dipA = {a: IN1 - 0.16, peak: IN1, b: IN1 + 0.2};
  const dipB = {a: OUT0 - 0.05, peak: OUT0 + 0.12, b: OUT0 + 0.34};
  const tri = (d: {a: number; peak: number; b: number}) => (t < d.a || t > d.b ? 0 : t < d.peak ? smooth(seg(t, d.a, d.peak - 0.05)) : 1 - smooth(seg(t, d.peak + 0.05, d.b)));
  const dip = Math.max(tri(dipA), tri(dipB));
  const inside = t >= dipA.peak && t < dipB.peak;
  const inK = easeInOut(seg(t, IN0, IN1));
  const outK = easeInOut(seg(t, OUT0, OUT1));
  const zk = inK * (1 - outK);
  const creep = smooth(seg(t, T5.sideways, T5.cancellation));
  const Z = 1 + (3.1 + 0.2 * creep - 1) * zk;
  const focus = {x: 960 + (SEAT_X + 20) * sc, y: gy - 940 * sc};
  const fx = 960 + (focus.x - 960) * zk, fy = 540 + (focus.y - 540) * zk;
  const reveal = inside ? 1 : 0;
  const glassL = t >= dipA.peak - 0.1 ? 1 : smooth(seg(t, T5.your - 0.5, T5.your - 0.1));
  const arrow = smooth(seg(t, T5.sideways - 0.1, T5.sideways + 0.4)) * (1 - smooth(seg(t, T5.cancellation - 0.5, T5.cancellation - 0.1)));
  const press = keys(t, [[T5.seat - 0.2, 0.2], [T5.provides + 0.2, 0.55], [T5.pressed, 0.6], [T5.bolster + 0.2, 1]], easeInOut) * smooth(seg(t, T5.sideways - 0.3, T5.sideways + 0.3));
  const lean = 4.5 * press;
  const path = win(t, T5.and, T5.disappear + 0.4, 0.35, 0.4);

  const toS = (bx: number, by: number) => {
    const sx = 960 + bx * sc, sy = gy - by * sc;
    return {x: 960 + (sx - fx) * Z, y: 540 + (sy - fy) * Z};
  };
  const outer = toS(SEAT_X - 240 - 110, 880), bol = toS(SEAT_X - 240 - 40, 900);
  return (
    <AbsoluteFill>
      <Stage bg={C.paper}>
        <g transform={`translate(960 540) scale(${Z}) translate(${-fx} ${-fy})`}>
          <TrackScene cam={cam} s0={s - 150000} s1={s + 20000} pathHint={{sFrom: s - 120000, sTo: s - 3000, opacity: path}} />
          <g transform={`translate(960 ${gy}) scale(${sc} ${-sc})`}>
            <FrontCar
              px={sc * Z}
              roll={ROLL + 0.12 * Math.sin(t * 5.3)}
              dz={3 * Math.sin(t * 7.1) + 2 * Math.sin(t * 11.3)}
              id="cabin"
              windowReveal={glassL}
              windowRevealR={inside ? 1 : 0}
              window={<CabinInGlass frame={frame} press={press} lean={lean} />}
              overlay={<CabinOuter reveal={reveal} press={press} arrow={arrow} px={sc * Z} />}
            />
          </g>
        </g>
        <Label x={Math.max(330, outer.x + 60)} y={Math.max(120, outer.y - 150)} text="SIDEWAYS FORCE" color={C.tealLight} size={40} opacity={win(t, T5.sideways - 0.05, T5.seat - 0.2, 0.3, 0.3) * reveal} />
        <Callout x={bol.x - 250} y={bol.y + 190} tx={bol.x - 10} ty={bol.y + 40} text="SEAT" color={C.white} size={38} opacity={win(t, T5.seat - 0.05, T5.you - 0.1, 0.25, 0.3) * reveal} />
        <Label x={960} y={130} text="LESS LEAN, NOT LESS FORCE" color={C.saffron} size={52} opacity={win(t, T5.leans - 0.2, OUT0 + 0.1, 0.3, 0.25)} />
        {dip > 0.001 && <rect x={-20} y={-20} width={1960} height={1120} fill="#1E262B" opacity={dip} />}
      </Stage>
    </AbsoluteFill>
  );
};
void TRACK_HALF;
