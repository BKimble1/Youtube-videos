// E6 (737-757, "medicine."): back out in the daylight at the rubble's edge (E1's collapsed building behind, out of
// focus, dust in the air). The operator (crew/operator, unchanged rig and outfit) stands at a folding field table
// behind a rugged monitor that shows the observer's feed from the passage (E5's PassageFeed, running on frame for
// frame). He studies it and steers: his thumb presses the remote's D-pad (FEED_TURN.f) and, a beat later, the medic in
// the feed turns right. Same figure as the lab (OperatorAtBench), with one change of grip so the thumb reaches the
// D-pad: the remote sits 20 mm further back in his hand and the thumb is aimed with the rig's own solve.
import React from 'react';
import {Man} from '../../../../crew/operator/dc/Man';
import {DIM} from '../../../../crew/operator/dc/Man';
import {HERO_LAB, H_REMOTE, blinkAt} from '../../../../crew/operator/cast';
import {aimThumb} from '../../../../crew/operator/RemoteCloseUp';
import {operatorAtBench, OperatorAtBenchProps, Remote, REMOTE, remotePt} from '../../../../crew/operator';
import {add, mul, rad, fmt} from '../../../../lib/math';
import {smoother, clamp, rnd} from '../../../../lib/ease';
import {INK} from '../../../../lib/ink';
import {mix, shade as shadeC, lit as litC} from '../../../../lib/color';
import {RB, Slab, Rebar, Pebbles, Motes, Glow2, jag, f2} from '../art';
import {ShotProps} from '../../index2';
import {idf, FPS, Blur} from './kit';
import {Sky, Building, Heap} from './E1r';
import {PassageFeed, FEED_TURN} from './E5r';

export const E6_N = 21;
const TABLE = 1336; // the table top's back edge (screen y)
const TABLE_FRONT = 1470;
const OP = {x: 838, y: 1420, scale: 1.42};
/** the rugged monitor's screen (screen px): centre and scale of the 1080 x 1920 feed */
export const E6_SCREEN = {x: 318, y: 958, k: 0.29};
/** the press on the D-pad's right arm: down, held, released (film frames) */
const PRESS = {f0: FEED_TURN.f - 5, f1: FEED_TURN.f - 2, f2: FEED_TURN.f + 3, f3: FEED_TURN.f + 6};
export const e6Press = (f: number) => smoother(clamp((f - PRESS.f0) / (PRESS.f1 - PRESS.f0))) * (1 - smoother(clamp((f - PRESS.f2) / (PRESS.f3 - PRESS.f2))));
/** one blink just after the press, as the medic turns in the feed (the rig's automatic track would have his eyes
 *  shut on E6's first frame); 0.2 s, done by frame 756 */
const E6_BLINK = (f: number) => blinkAt((f - (PRESS.f2 + 2)) / FPS + 0.6);
/** the remote held 20 mm further back in the hand (toward the wrist) than at the lab bench */
const SHIFT_MM = 20;

/** the operator at the field table (OperatorAtBench's solve; the grip shifted so the thumb lies on the D-pad) */
const operatorField = (p: OperatorAtBenchProps, press: number) => {
  const g = operatorAtBench(p);
  const s = g.s;
  const L = DIM.hand * s;
  const lWrist = add(g.joints.L.W, mul(g.joints.L.foreDir, -6 * s));
  const lAng = g.joints.L.handAng;
  const ax = {x: Math.cos(rad(g.view.rot)), y: Math.sin(rad(g.view.rot))};
  const view = {...g.view, c: add(g.view.c, mul(ax, SHIFT_MM * g.view.k))};
  // the pad on the D-pad's right arm (+x, toward the fire button's side), pressing it down a little
  const D = REMOTE.dpad;
  const pad = remotePt(view, D.x + D.arm * 0.55, D.y, D.h + 1.6 - 1.4 * press);
  const lHand = aimThumb(lWrist, lAng, L, 1, {...H_REMOTE, curl: H_REMOTE.curl.map((c) => c + 0.03 * press) as typeof H_REMOTE.curl}, pad);
  return {...g, view, lHand};
};

const OperatorField: React.FC<OperatorAtBenchProps & {press: number}> = (props) => {
  const id = props.id ?? 'opf';
  const layer = props.layer ?? 'all';
  const g = operatorField(props, props.press);
  const s = g.s;
  const remote = <Remote id={`${id}-rm`} view={g.view} press={0} led={props.led} ink={7 * s * 0.9 * 0.72 * 0.9} />;
  const handsY = (props.benchTopY ?? 0) + 18 * s;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-${layer}-above`}>
          <path d={`M-20000,-20000 H20000 V${fmt(props.benchTopY ?? 20000)} H-20000 Z`} />
        </clipPath>
        <clipPath id={`${id}-${layer}-aboveH`}>
          <path d={`M-20000,-20000 H20000 V${fmt(handsY)} H-20000 Z`} />
        </clipPath>
      </defs>
      {layer !== 'hands' && (
        <g clipPath={`url(#${id}-${layer}-above)`}>
          <Man id={`${id}-b`} pose={g.pose} expr={g.expr} blink={g.blink} lHand={g.lHand} rHand={g.rHand} outfit={HERO_LAB} inkK={0.9} />
        </g>
      )}
      {layer !== 'body' && (
        <g clipPath={`url(#${id}-${layer}-aboveH)`}>
          <Man id={`${id}-h`} pose={g.pose} expr={g.expr} blink={g.blink} lHand={g.lHand} rHand={g.rHand} outfit={HERO_LAB} inkK={0.9} handsOnly holdL={{front: [0, 1, 2, 3, 't'], obj: remote}} />
        </g>
      )}
    </g>
  );
};

const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${x0 + r},${y0} H${x1 - r} Q${x1},${y0} ${x1},${y0 + r} V${y1 - r} Q${x1},${y1} ${x1 - r},${y1} H${x0 + r} Q${x0},${y1} ${x0},${y1 - r} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} Z`;

/** a rugged field monitor (portrait), rubber corner bumpers, a carry handle, a stubby antenna, a kickstand to the
 *  table; the picture is the observer's feed */
const RuggedMonitor: React.FC<{id: string; f: number}> = ({id, f}) => {
  const {x, y, k} = E6_SCREEN;
  const w = 1080 * k, h = 1920 * k;
  const x0 = x - w / 2, y0 = y - h / 2, x1 = x + w / 2, y1 = y + h / 2;
  const B = 30;
  const bump = '#E39A2E';
  const corner = (cx: number, cy: number, sx: number, sy: number, i: number) => (
    <path key={i} d={`M${cx},${cy + sy * 70} V${cy + sy * 14} Q${cx},${cy} ${cx + sx * 14},${cy} H${cx + sx * 70} L${cx + sx * 70},${cy + sy * 26} H${cx + sx * 26} V${cy + sy * 70} Z`} fill={bump} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  );
  return (
    <g>
      {/* kickstand and the cable to the relay box */}
      <path d={`M${x + 40},${y1 + B - 10} L${x + 120},${TABLE + 34} L${x + 150},${TABLE + 34} L${x + 70},${y1 + B - 14} Z`} fill="#2E3438" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M${x - 60},${y1 + B} C${x - 40},${TABLE + 70} ${x + 380},${TABLE + 90} ${x + 600},${TABLE + 40}`} stroke={INK} strokeWidth={11} fill="none" strokeLinecap="round" />
      <path d={`M${x - 60},${y1 + B} C${x - 40},${TABLE + 70} ${x + 380},${TABLE + 90} ${x + 600},${TABLE + 40}`} stroke="#3A444C" strokeWidth={6} fill="none" strokeLinecap="round" />
      {/* the case */}
      <path d={rr(x0 - B, y0 - B, x1 + B, y1 + B + 26, 26)} fill="#3B4247" stroke={INK} strokeWidth={6} />
      <path d={rr(x0 - B + 6, y0 - B + 6, x1 + B - 6, y1 + B + 20, 22)} fill="none" stroke="#5D676E" strokeWidth={3} />
      {/* carry handle and antenna */}
      <path d={`M${x - 70},${y0 - B} V${y0 - B - 34} Q${x - 70},${y0 - B - 48} ${x - 56},${y0 - B - 48} H${x + 56} Q${x + 70},${y0 - B - 48} ${x + 70},${y0 - B - 34} V${y0 - B}`} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <path d={`M${x - 70},${y0 - B} V${y0 - B - 34} Q${x - 70},${y0 - B - 48} ${x - 56},${y0 - B - 48} H${x + 56} Q${x + 70},${y0 - B - 48} ${x + 70},${y0 - B - 34} V${y0 - B}`} fill="none" stroke="#4A5359" strokeWidth={9} strokeLinecap="round" />
      <path d={`M${x1 + B - 24},${y0 - B} L${x1 + B - 4},${y0 - B - 120}`} stroke={INK} strokeWidth={15} strokeLinecap="round" />
      <path d={`M${x1 + B - 24},${y0 - B} L${x1 + B - 4},${y0 - B - 120}`} stroke="#2B3237" strokeWidth={9} strokeLinecap="round" />
      {/* the picture */}
      <rect x={x0} y={y0} width={w} height={h} fill="#0B0908" />
      <g transform={`translate(${f2(x0)} ${f2(y0)})`}>
        <PassageFeed f={f} w={w} h={h} id={`${id}-fd`} />
      </g>
      <defs>
        <linearGradient id={`${id}-gl`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.14} />
          <stop offset="0.38" stopColor="#FFFFFF" stopOpacity={0.03} />
          <stop offset="0.39" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={x0} y={y0} width={w} height={h} fill={`url(#${id}-gl)`} />
      <rect x={x0} y={y0} width={w} height={h} fill="none" stroke="#11171C" strokeWidth={4} />
      {/* two small keys and a power light on the bottom strip */}
      <circle cx={x - 40} cy={y1 + B / 2 + 12} r={8} fill="#5D676E" stroke={INK} strokeWidth={3} />
      <circle cx={x} cy={y1 + B / 2 + 12} r={8} fill="#5D676E" stroke={INK} strokeWidth={3} />
      <circle cx={x1 - 10} cy={y1 + B / 2 + 12} r={5} fill="#7FE0A8" />
      {corner(x0 - B, y0 - B, 1, 1, 0)}
      {corner(x1 + B, y0 - B, -1, 1, 1)}
      {corner(x0 - B, y1 + B + 26, 1, -1, 2)}
      {corner(x1 + B, y1 + B + 26, -1, -1, 3)}
    </g>
  );
};

/** the folding field table: a pale aluminium top seen edge-on, its front band, legs to the rubble */
const Table: React.FC<{id: string}> = ({id}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-tt`} x1="0" y1={TABLE} x2="0" y2={TABLE_FRONT} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#AEB7BC" />
        <stop offset="1" stopColor="#D3DADD" />
      </linearGradient>
    </defs>
    <path d={`M-40,${TABLE} H1120 V${TABLE_FRONT} H-40 Z`} fill={`url(#${id}-tt)`} stroke={INK} strokeWidth={6} />
    <path d={`M-40,${TABLE + 6} H1120`} stroke="#FFFFFF" strokeWidth={3} opacity={0.35} />
    <path d={`M-40,${TABLE_FRONT} H1120 V${TABLE_FRONT + 44} H-40 Z`} fill="#7D888F" stroke={INK} strokeWidth={6} />
    {[90, 990].map((x, i) => (
      <path key={i} d={`M${x - 16},${TABLE_FRONT + 44} H${x + 16} V2000 H${x - 16} Z`} fill="#6E787F" stroke={INK} strokeWidth={6} />
    ))}
    {/* a relay box on the table (the monitor's cable runs to it) */}
    <path d={rr(900, TABLE - 50, 1060, TABLE + 56, 10)} fill="#4E5A3E" stroke={INK} strokeWidth={5} />
    <path d={`M918,${TABLE - 34} H1042`} stroke="#6E7B58" strokeWidth={4} />
    <path d={`M1030,${TABLE - 50} L1045,${TABLE - 134}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
    <circle cx={938} cy={TABLE - 4} r={6} fill="#3DDC84" />
  </g>
);

const Ground: React.FC<{id: string}> = ({id}) => (
  <g>
    <path d={`M-40,${TABLE - 40} H1120 V2000 H-40 Z`} fill="#A4968A" />
    <Slab id={`${id}-g1`} face={jag([[-60, 1600], [380, 1580], [520, 1700], [480, 2000], [-60, 2000]], 10, 401)} top={jag([[-60, 1600], [380, 1580], [430, 1620], [-60, 1650]], 6, 402)} tone={RB.conc} w={5} dark={0.25} specks={12} />
    <Slab id={`${id}-g2`} face={jag([[640, 1640], [1120, 1600], [1120, 2000], [600, 2000]], 10, 403)} top={jag([[640, 1640], [1120, 1600], [1120, 1650], [630, 1690]], 6, 404)} tone={RB.concLit} w={5} dark={0.2} specks={12} />
    <Rebar pts={[[860, 1660], [900, 1560], [870, 1500]]} w={9} dark={0.3} />
    <Pebbles id={`${id}-p`} a={[-40, 1560]} b={[1120, 1560]} n={14} size={16} seed={405} tone={RB.concLit} />
  </g>
);

export const E6: React.FC<ShotProps> = ({f}) => {
  const id = idf('e3f', f);
  const t = f / FPS;
  const press = e6Press(f);
  const opProps: OperatorAtBenchProps = {
    x: OP.x, y: OP.y, scale: OP.scale, t, expr: 'focus', led: 'armed', blink: E6_BLINK(f),
    gazeX: E6_SCREEN.x + 30, gazeY: E6_SCREEN.y + 60, benchTopY: TABLE, farHand: 'bench', farHandX: 150,
  };
  // the camera drifts with his gaze toward the monitor (far layer slower: parallax)
  const gz = smoother(clamp((f - 735) / 24));
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {/* the collapsed building and the heap, far behind and out of focus */}
      <g transform={`translate(${(18 * gz).toFixed(2)} 0)`}>
      <Blur id={`${id}-bk`} sd={5}>
        <g transform="translate(-120 -260) scale(1.25)">
          <Sky id={`${id}s`} />
        </g>
        <g transform="translate(120 140) scale(0.62)">
          <Building id={`${id}b`} t={t + 1.2} />
        </g>
        <g transform="translate(-60 260) scale(0.9)">
          <Heap id={`${id}h`} />
        </g>
      </Blur>
      </g>
      <rect x={0} y={0} width={1080} height={1920} fill="#F4E4C6" opacity={0.12} />
      <Motes id={`${id}-m0`} t={t} n={20} x0={0} y0={200} x1={1080} y1={1300} r={4} seed={406} a={0.55} />
      <g transform={`translate(${(56 * gz).toFixed(2)} ${(-10 * gz).toFixed(2)})`}>
      <Ground id={`${id}g`} />
      <OperatorField id={`${id}ob`} layer="body" {...opProps} press={press} />
      <Table id={`${id}t`} />
      <RuggedMonitor id={`${id}mn`} f={f} />
      <OperatorField id={`${id}oh`} layer="hands" {...opProps} press={press} />
      </g>
      <Glow2 id={`${id}-sun`} cx={1000} cy={60} rx={800} ry={560} color={RB.dayHot} a={0.28} />
    </svg>
  );
};
void rnd;
void mix;
void shadeC;
void litC;
