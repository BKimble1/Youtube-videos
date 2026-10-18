// 1:33–1:48, front view in the bend again, then a push into the windscreen: the passenger (clerkB from the Crew),
// seated and belted on the outside of the turn, is pressed into the outside bolster. The only arrow is the seat's force
// on the passenger, pointing toward the centre of the turn (screen-right).
import React from 'react';
import {C} from '../theme';
import {w} from '../cues';
import {FrontCar} from '../car/front';
import {Arrow} from '../car/parts';
import {FCAM, FrontWorld, D_CAR, proj, centre} from '../kit/frontworld';
import {Chip, Label} from '../kit/stage';
import {Character, IDLE, Pose} from '../kit/Character';
import {CAST} from '../kit/cast';
import {easeInOut, keys, seg, smooth, win} from '../kit/util';
import {K_BEND, SPEED} from './FrontCorner';

const T = {
  and: w('b5', 'and'),
  corner: w('b5', 'corner'),
  disappear: w('b5', 'disappear'),
  your: w('b5', 'your'),
  sideways: w('b5', 'sideways'),
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
export const PASS_T = T;

const SEAT_X = -330; // passenger seat centre (body mm): the car's right-hand side, screen-left
const ROLL = 0.8;

/** Cabin seen through the windscreen (body coordinates, mm, y up). */
const Cabin: React.FC<{frame: number; press: number; lean: number; arrow: number; px: number}> = ({frame, press, lean, arrow, px}) => {
  const k = 1.85; // mm per character unit (Crew proportions kept; sized to sit under the roof)
  const pose: Pose = {...IDLE, lean: -lean, tilt: -lean * 0.9, lookX: 0.15, lookY: 0.1, brows: press > 0.5 ? 0.25 : 0.1, mouth: press > 0.5 ? 'hmm' : 'smile', armL: {a: 6, b: 8}, armR: {a: 6, b: 8}};
  // outside bolster (screen-left) squashes outward as the passenger presses into it
  const sq = 26 * press;
  const bx0 = SEAT_X - 270, bx1 = SEAT_X + 270;
  return (
    <g>
      {/* rear bulkhead and the centre tunnel */}
      <rect x={-700} y={700} width={1400} height={700} fill="#3E4A52" />
      <rect x={-60} y={700} width={120} height={300} fill="#2F3940" />
      {/* passenger seat: back, headrest and side bolsters */}
      <path d={`M ${bx0 + 60} 640 L ${bx1 - 60} 640 L ${bx1 - 50} 1150 C ${bx1 - 60} 1210 ${bx0 + 60} 1210 ${bx0 + 50} 1150 Z`} fill="#2B3238" stroke={C.ink} strokeWidth={8} />
      <path d={`M ${bx0 + 20 - sq} 640 C ${bx0 - 30 - sq} 800 ${bx0 - 30 - sq} 980 ${bx0 + 10 - sq * 0.6} 1080 L ${bx0 + 95} 1060 C ${bx0 + 80 + sq * 0.2} 940 ${bx0 + 78 + sq * 0.4} 800 ${bx0 + 90} 650 Z`} fill="#353E45" stroke={C.ink} strokeWidth={8} />
      <path d={`M ${bx1 - 20} 640 C ${bx1 + 30} 800 ${bx1 + 30} 980 ${bx1 - 10} 1080 L ${bx1 - 95} 1060 C ${bx1 - 80} 940 ${bx1 - 78} 800 ${bx1 - 90} 650 Z`} fill="#353E45" stroke={C.ink} strokeWidth={8} />
      <path d={`M ${bx0 + 12 - sq} 700 C ${bx0 - 18 - sq} 840 ${bx0 - 18 - sq} 960 ${bx0 + 8 - sq * 0.6} 1040`} fill="none" stroke={C.saffron} strokeWidth={10} strokeDasharray="22 16" opacity={0.8} />
      {/* passenger (Crew rig, unchanged proportions) */}
      <g transform={`translate(${SEAT_X - press * 18} 330) scale(${k} ${-k})`}>
        <g transform="translate(-200 -500)">
          <Character look={CAST.clerkB} pose={pose} frame={frame} seed={9} shadow={false} life={0.35} />
        </g>
      </g>
      {/* seat belt: outboard shoulder to inboard hip */}
      {(() => {
        const sx = SEAT_X - 118 - press * 22, sy = 875 - press * 4;
        return <path d={`M ${sx} ${sy} L ${SEAT_X + 120} 640 L ${SEAT_X + 175} 660 L ${sx + 52} ${sy + 22} Z`} fill="#4A545B" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />;
      })()}
      {/* dashboard across the bottom of the glass */}
      <path d="M -700 700 L 700 700 L 700 805 C 300 830 -300 830 -700 805 Z" fill="#262E33" stroke={C.ink} strokeWidth={8} />
      {/* the seat's force on the passenger, toward the centre of the turn */}
      <Arrow x={bx0 + 70} y={850} dx={330} dy={0} px={px} color={C.teal} width={18} head={36} opacity={arrow} />
    </g>
  );
};

export const FrontPassenger: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const travel = t * SPEED;
  const sc = FCAM.f / D_CAR;
  const gy = FCAM.horizon + (FCAM.f * FCAM.h) / D_CAR;
  // zoom lens into the passenger half of the windscreen
  const push = easeInOut(seg(t, T.your - 0.55, T.sideways - 0.1));
  const focus = {x: FCAM.cx + (SEAT_X + 60) * sc, y: gy - 980 * sc};
  const Z = 1 + 2.2 * push;
  const fx = FCAM.cx + (focus.x - FCAM.cx) * push, fy = 540 + (focus.y - 540) * push;
  const reveal = smooth(seg(t, T.your - 0.2, T.sideways));
  const arrow = smooth(seg(t, T.sideways - 0.1, T.sideways + 0.4));
  const press = keys(t, [[T.seat - 0.1, 0.25], [T.provides + 0.2, 0.6], [T.pressed, 0.6], [T.bolster + 0.1, 1]], easeInOut) * smooth(seg(t, T.sideways - 0.3, T.sideways + 0.3));
  const lean = 5.5 * press;
  // the turn ahead: a dashed path on the road bending toward the centre of the turn
  const cl = centre(K_BEND, D_CAR);
  const pathPts = [D_CAR - 300, 4400, 3700, 3000, 2400, 1900].map((d) => proj(FCAM, cl(d) + (D_CAR - d) * (D_CAR - d) * K_BEND * 0.9, d));
  const pathVis = win(t, T.and - 0.2, T.your - 0.3, 0.3, 0.3);
  return (
    <g>
      <g transform={`translate(960 540) scale(${Z}) translate(${-fx} ${-fy})`}>
        <FrontWorld k={K_BEND} travel={travel} />
        {pathVis > 0 && (
          <g opacity={pathVis}>
            <polyline points={pathPts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={C.saffron} strokeWidth={14} strokeDasharray="34 22" strokeLinecap="round" />
            {(() => {
              const a = pathPts[pathPts.length - 2], b = pathPts[pathPts.length - 1];
              const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
              return <polygon points="0,-22 40,0 0,22" fill={C.saffron} stroke={C.ink} strokeWidth={3} transform={`translate(${b.x} ${b.y}) rotate(${ang})`} />;
            })()}
          </g>
        )}
        <g transform={`translate(${FCAM.cx} ${gy}) scale(${sc} ${-sc})`}>
          <FrontCar px={sc * Z} roll={ROLL} actuator={0} id="pass" windowReveal={reveal}
            window={<Cabin frame={frame} press={press} lean={lean} arrow={arrow} px={sc * Z} />} />
        </g>
      </g>
      <Chip x={40} y={40} text="ACTIVE" opacity={win(t, T.and - 0.3, T.your, 0.3, 0.3)} />
      <Label x={1340} y={330} text={t < T.seat - 0.1 ? 'SIDEWAYS FORCE' : 'FROM THE SEAT'} color={C.tealLight} size={40} opacity={arrow * (1 - smooth(seg(t, T.bodyCtl - 0.3, T.bodyCtl)))} />
      <Label x={960} y={130} text="LESS LEAN, NOT LESS FORCE" color={C.saffron} size={50} opacity={win(t, T.bodyCtl - 0.1, T.watch - 0.5, 0.25, 0.3)} />
    </g>
  );
};
