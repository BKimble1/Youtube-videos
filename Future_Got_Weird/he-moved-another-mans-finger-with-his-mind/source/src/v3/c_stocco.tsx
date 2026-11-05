// V3 Sequence C: Stocco's room ("S" world), replacing V2's oversized top-down view.
//
// BACK VIEW (camera behind him and a little above; his LEFT is frame-left, as in A/B): he sits at a desk facing a bare
// wall, earbuds in, swim cap on, his right hand (frame-right) resting just above the space bar. The campus line enters
// through a wall jack (frame-left), runs down into the receiving computer on the desk, which triggers the TMS machine
// on its cart; an articulated arm holds the round coil on the top-left of his head: over his LEFT motor cortex.
//  65.75  match cut on the command: it comes out of the wall jack and runs jack -> receiving computer -> TMS machine
//  66.98  "Across campus, a magnetic coil..." the camera climbs the coil arm and finds the coil on his head
//  69.6   "...the part of Stocco's brain": the cap under the coil turns see-through: the left hemisphere's motor strip,
//         its hand area lit under the coil
//  70.85  "...that helps move his right hand": down across his back to the right hand over the space bar
//  72.1   pull back: the whole chain in one frame (jack, computer, machine, coil, head, arm, hand)
//  73.24  "triggers": the machine discharges, current runs up the coil cable; the coil clicks on "pulse"
//  73.74  the stimulation pathway: left motor cortex -> crosses at the brainstem -> right shoulder -> arm -> hand; the
//         camera rides it into the hand (cut on the drive glow into the finger ECU, c_end)
// FRONT VIEW (the reverse; the swim-cap mark and the coil are frame-right): his reaction to his own hand.
// BACK VIEW again for "missing the entire game", then the push into the empty network port (the C -> D contract).
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {clamp, easeIn, easeInOut, easeOut, fmt, lerp, smooth} from '../dc/math';
import {SoftShadow} from '../dc/shade';
import {GameScreen} from '../art/game';
import {FONT_HEAD, INK, K, Keyboard, Packet, RoundCoil, Tag} from '../art/kit';
import {STOCCO} from '../art/people';
import {Arm, CrewChar, CrewHand, HandShape, IDLE, Look, Pose} from './crew3';
import {CamS} from './core2';
import {camPath, camT} from './c_cam';
import {bz, Cable, gameEvents, PACKET_SCREEN_S} from './c_rao';
import {ct, gameClock} from './c_time';

type V = {x: number; y: number};
const ramp = (t: number, a: number, b: number) => clamp((t - a) / (b - a || 1e-6));
const sramp = (t: number, a: number, b: number) => smooth(ramp(t, a, b));
const HY = -372, HR = 58;
const BACK_LOOK: Look = {...STOCCO, hair: 'bald'};

// ---------------------------------------------------------------- back-view layout (S world units)
const SX = 960, SGY = 951, SS = 1.75;
const DESK = {back: 380, front: 612, face: 664};
const PLATE = {x: 470, y: 250};
/** the empty port we dive into at the end: 48 x 27 (the GAME_FULL aspect); the game drawn inside at 48/640 */
const PORT = {x: PLATE.x + 24, y: PLATE.y};
const G2 = 48 / 640;
const PC = {x0: 548, x1: 676, y0: 372, y1: 566};
const PC_LCD = {x0: 566, x1: 658, y0: 392, y1: 444};
const MACH = {x0: 120, x1: 392, y0: 320, y1: 566};
const MACH_LCD = {x0: 150, x1: 300, y0: 350, y1: 420};
const JACK_CABLE: V[] = [{x: PLATE.x - 18, y: PLATE.y + 22}, {x: PLATE.x - 18, y: 330}, {x: 612, y: 312}, {x: 612, y: PC.y0}];
const TRIG_CABLE: V[] = [{x: PC.x0, y: 520}, {x: 500, y: 560}, {x: 440, y: 548}, {x: MACH.x1, y: 506}];
const COIL = {x: 892, y: 204, ang: 140, s: 0.42};
const COIL_END = {x: COIL.x + Math.cos((COIL.ang * Math.PI) / 180) * 113, y: COIL.y + Math.sin((COIL.ang * Math.PI) / 180) * 113};
const ARM_PTS: V[] = [{x: 330, y: MACH.y0}, {x: 330, y: 92}, {x: 600, y: 62}, {x: COIL_END.x - 6, y: COIL_END.y - 4}];
/** the hand area of the left motor cortex, under the coil */
const HAND_AREA = {x: 902, y: 232};
const HEADC = {x: SX, y: SGY + HY * SS};
const HEAD_RX = 60 * SS, HEAD_RY = 64 * SS;

/** his arms seen from behind and above (crew3 line style and hands, but foreshortened: the upper arm hangs, the
 *  forearm reaches forward onto the desk, so it reads short and upward). side +1 = his right arm (frame-right). */
const backArm = (side: 1 | -1, bob = 0, lift = 0) => {
  const by = bob * SS;
  const sh = {x: SX + side * 104, y: 452 + by};
  const el = {x: SX + side * (175 + 6 * lift), y: 586 + by - 14 * lift};
  const wr = {x: SX + side * (210 + 4 * lift), y: 530 + by - 10 * lift};
  const d = {x: wr.x - el.x, y: wr.y - el.y};
  const l = Math.hypot(d.x, d.y) || 1;
  const hand = {x: wr.x + (d.x / l) * 40, y: wr.y + (d.y / l) * 40};
  return {sh, el, wr, hand, dir: {x: d.x / l, y: d.y / l}};
};
const BackArm: React.FC<{side: 1 | -1; bob?: number; lift?: number; hand: HandShape}> = ({side, bob = 0, lift = 0, hand}) => {
  const A = backArm(side, bob, lift);
  const w = 30 * SS, o = 4 * SS;
  const rot = (Math.atan2(-A.dir.x, A.dir.y) * 180) / Math.PI;
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <polyline points={`${fmt(A.sh.x)},${fmt(A.sh.y)} ${fmt(A.el.x)},${fmt(A.el.y)} ${fmt(A.wr.x)},${fmt(A.wr.y)}`} stroke={INK} strokeWidth={w + 2 * o} />
      <polyline points={`${fmt(A.el.x)},${fmt(A.el.y)} ${fmt(A.wr.x)},${fmt(A.wr.y)}`} stroke={STOCCO.skin} strokeWidth={w} />
      <polyline points={`${fmt(A.sh.x)},${fmt(A.sh.y)} ${fmt(A.el.x)},${fmt(A.el.y)}`} stroke={STOCCO.shirt} strokeWidth={w} />
      <g transform={`translate(${fmt(A.wr.x)} ${fmt(A.wr.y)}) rotate(${fmt(rot)}) scale(${fmt(1.45 * SS)} ${fmt(1.45 * SS * 0.8)})`}>
        <CrewHand side={side} skin={STOCCO.skin} shape={hand} />
      </g>
    </g>
  );
};
/** the rig's own arms hang hidden behind his back in the back view (the arms above are drawn instead) */
const HIDDEN: Arm = {a: -9, b: 0};

/** the keyboard sits so the space bar is under his right fingertips */
const RHAND = backArm(1);
const KB = {x: RHAND.hand.x + 50, y: RHAND.hand.y - 14, s: 0.55};

// ---------------------------------------------------------------- the back of his head (crew3 head gear; flipped, so +x is frame-left)
const BackHead: React.FC<{turn?: number}> = ({turn = 0}) => {
  const sk = STOCCO.skin;
  return (
    <g>
      {/* cheek and nose edge peek out on the side he turns toward */}
      {Math.abs(turn) > 0.05 && (
        <g transform={`translate(${fmt(turn * 30)} 0)`}>
          <ellipse cx={turn > 0 ? 44 : -44} cy={HY + 14} rx={22} ry={30} fill={sk} stroke={INK} strokeWidth={4} opacity={clamp(Math.abs(turn) * 2)} />
          <path d={`M ${turn > 0 ? 58 : -58} ${HY + 2} q ${turn > 0 ? 12 : -12} 8 ${turn > 0 ? 2 : -2} 14`} fill={sk} stroke={INK} strokeWidth={3.5} opacity={clamp(Math.abs(turn) * 2 - 0.6)} />
        </g>
      )}
      <ellipse cx={0} cy={HY} rx={HR} ry={HR + 4} fill={sk} stroke={INK} strokeWidth={4} />
      {/* hair at the nape, under the cap */}
      <path d={`M ${-HR + 1} ${HY - 4} Q ${-HR - 1} ${HY + 34} ${-26} ${HY + 50} Q 0 ${HY + 58} ${26} ${HY + 50} Q ${HR + 1} ${HY + 34} ${HR - 1} ${HY - 4} Z`} fill={STOCCO.hairColor} transform={`translate(${fmt(-turn * 8)} 0)`} />
      <ellipse cx={0} cy={HY} rx={HR} ry={HR + 4} fill="none" stroke={INK} strokeWidth={4} />
      {/* the swim cap (marks the coil site on the top-left of the head) */}
      <path d={`M ${-HR - 3} ${HY + 4} Q ${-HR - 5} ${HY - HR - 18} 0 ${HY - HR - 16} Q ${HR + 5} ${HY - HR - 18} ${HR + 3} ${HY + 4} Q ${HR * 0.5} ${HY - 4} 0 ${HY - 6} Q ${-HR * 0.5} ${HY - 4} ${-HR - 3} ${HY + 4} Z`} fill={K.swimCap} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M ${-HR * 0.55} ${HY - HR + 4} Q 0 ${HY - HR - 10} ${HR * 0.55} ${HY - HR + 4}`} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.3} />
      <g stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round"><path d={`M 24 ${HY - HR + 10} l 12 12 M 36 ${HY - HR + 10} l -12 12`} /></g>
      {/* earbuds in both ears */}
      {[-1, 1].map((s) => <circle key={s} cx={s * (HR + 1)} cy={HY + 10} r={8} fill="#F4F6F8" stroke={INK} strokeWidth={3} />)}
    </g>
  );
};

/** the front-view cap: the mark (and the coil) on the frame-right side, his LEFT */
const FrontCap: React.FC = () => (
  <g>
    <path d={`M ${-HR - 3} ${HY + 2} Q ${-HR - 5} ${HY - HR - 18} 0 ${HY - HR - 16} Q ${HR + 5} ${HY - HR - 18} ${HR + 3} ${HY + 2} Q ${HR * 0.5} ${HY - 22} 0 ${HY - 24} Q ${-HR * 0.5} ${HY - 22} ${-HR - 3} ${HY + 2} Z`} fill={K.swimCap} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d={`M ${-HR * 0.6} ${HY - HR + 2} Q 0 ${HY - HR - 12} ${HR * 0.6} ${HY - HR + 2}`} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.35} />
    <g stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round"><path d={`M 18 ${HY - HR + 6} l 12 12 M 30 ${HY - HR + 6} l -12 12`} /></g>
    {[-1, 1].map((s) => <circle key={s} cx={s * (HR + 4)} cy={HY + 8} r={10} fill="#F4F6F8" stroke={INK} strokeWidth={3.5} />)}
  </g>
);

// ---------------------------------------------------------------- equipment
const ReceivePC: React.FC<{fire: number}> = ({fire}) => (
  <g>
    <SoftShadow id="vc-spc-sh" c={{x: (PC.x0 + PC.x1) / 2, y: PC.y1 + 2}} rx={80} ry={10} alpha={0.25} />
    <rect x={PC.x0} y={PC.y0} width={PC.x1 - PC.x0} height={PC.y1 - PC.y0} rx={12} fill="#D9DEE2" stroke={INK} strokeWidth={5} />
    <rect x={PC.x0 + 6} y={PC.y0 + 6} width={14} height={PC.y1 - PC.y0 - 12} rx={6} fill="#FFFFFF" opacity={0.35} />
    <rect x={PC_LCD.x0} y={PC_LCD.y0} width={PC_LCD.x1 - PC_LCD.x0} height={PC_LCD.y1 - PC_LCD.y0} rx={5} fill={K.screenDark} stroke={INK} strokeWidth={3.5} />
    <text x={(PC_LCD.x0 + PC_LCD.x1) / 2} y={PC_LCD.y1 - 15} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={22} fill={mix('#7FA6B8', K.saffron, fire)}>{fire > 0.05 ? 'FIRE' : 'WAIT'}</text>
    {[0, 1].map((i) => <rect key={i} x={PC.x0 + 22} y={470 + i * 18} width={PC.x1 - PC.x0 - 44} height={9} rx={4} fill="#B5BEC6" />)}
    <circle cx={PC.x1 - 24} cy={PC.y1 - 24} r={9} fill={mix('#6E7C86', K.saffron, fire)} stroke={INK} strokeWidth={3} />
  </g>
);

const TmsMachine: React.FC<{charge: number; state: 'ready' | 'fire'; flash: number}> = ({charge, state, flash}) => (
  <g>
    {/* the cart: legs to the floor, a lower shelf */}
    {[MACH.x0 + 24, MACH.x1 - 38].map((x, i) => <rect key={i} x={x} y={MACH.y1} width={14} height={520} fill="#7E8B96" stroke={INK} strokeWidth={4} />)}
    <rect x={MACH.x0 + 10} y={MACH.y1 + 300} width={MACH.x1 - MACH.x0 - 20} height={22} rx={4} fill="#9AA7B1" stroke={INK} strokeWidth={4} />
    <rect x={MACH.x0} y={MACH.y0} width={MACH.x1 - MACH.x0} height={MACH.y1 - MACH.y0} rx={16} fill="#E1E6EA" stroke={INK} strokeWidth={6} />
    <rect x={MACH.x0 + 8} y={MACH.y0 + 8} width={18} height={MACH.y1 - MACH.y0 - 16} rx={7} fill="#FFFFFF" opacity={0.4} />
    <rect x={MACH_LCD.x0} y={MACH_LCD.y0} width={MACH_LCD.x1 - MACH_LCD.x0} height={MACH_LCD.y1 - MACH_LCD.y0} rx={8} fill={K.screenDark} stroke={INK} strokeWidth={4} />
    <text x={(MACH_LCD.x0 + MACH_LCD.x1) / 2} y={MACH_LCD.y1 - 22} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={32} fill={state === 'fire' ? K.saffron : '#7FA6B8'}>{state === 'fire' ? 'FIRE' : 'READY'}</text>
    <text x={MACH.x0 + 34} y={MACH.y1 - 66} fontFamily={FONT_HEAD} fontWeight={700} fontSize={30} fill="#7E8B96">TMS</text>
    {/* the capacitor charge bar */}
    <rect x={MACH_LCD.x0} y={440} width={MACH_LCD.x1 - MACH_LCD.x0} height={18} rx={6} fill="#46525C" stroke={INK} strokeWidth={3} />
    <rect x={MACH_LCD.x0} y={440} width={(MACH_LCD.x1 - MACH_LCD.x0) * clamp(charge)} height={18} rx={6} fill={K.saffron} />
    <circle cx={MACH.x1 - 48} cy={385} r={22} fill={mix('#6E7C86', K.saffron, flash)} stroke={INK} strokeWidth={4} />
    <circle cx={MACH.x1 - 48} cy={470} r={16} fill="#B5BEC6" stroke={INK} strokeWidth={4} />
  </g>
);

const polyLen = (p: V[]) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q.x - p[i].x, q.y - p[i].y), 0);
const polyAt = (p: V[], u: number): V => {
  const L = polyLen(p);
  let s = clamp(u) * L;
  for (let i = 1; i < p.length; i++) {
    const l = Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
    if (s <= l) return {x: lerp(p[i - 1].x, p[i].x, s / (l || 1)), y: lerp(p[i - 1].y, p[i].y, s / (l || 1))};
    s -= l;
  }
  return p[p.length - 1];
};
const lineD = (p: V[]) => `M${p.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}`;
/** the coil cable: machine top -> along the arm -> the coil handle */
const COIL_CABLE: V[] = [{x: 360, y: MACH.y0}, {x: 352, y: 110}, {x: 600, y: 84}, {x: COIL_END.x + 4, y: COIL_END.y + 6}];

const CoilArm: React.FC = () => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={lineD(ARM_PTS)} stroke={INK} strokeWidth={30} />
    <path d={lineD(ARM_PTS)} stroke="#9AA7B1" strokeWidth={18} />
    <path d={lineD(ARM_PTS)} stroke={lit('#9AA7B1', 0.4)} strokeWidth={5} transform="translate(-4 -4)" />
    {ARM_PTS.slice(1, 3).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={20} fill="#7E8B96" stroke={INK} strokeWidth={5} />)}
  </g>
);

// ---------------------------------------------------------------- the brain seen through the cap (back view, world coords)
const SeeBrain: React.FC<{k: number; area: number; pulse: number}> = ({k, area, pulse}) => {
  if (k <= 0.005) return null;
  const hc = HEADC;
  const fold = (sd: number, i: number) => {
    const y = hc.y - HEAD_RY * 0.8 + i * HEAD_RY * 0.24;
    const x0 = hc.x + sd * 6, x1 = hc.x + sd * HEAD_RX * 0.95;
    return `M${fmt(x0)},${fmt(y)} Q${fmt((x0 + x1) / 2)},${fmt(y - 14 + 8 * Math.sin(i * 1.7))} ${fmt(x1)},${fmt(y + 10)}`;
  };
  // the motor strip runs from the top of the head down and out toward the ear
  const strip = (sd: number) => `M${fmt(hc.x + sd * 8)},${fmt(hc.y - HEAD_RY * 0.95)} Q${fmt(hc.x + sd * HEAD_RX * 0.45)},${fmt(hc.y - HEAD_RY * 0.7)} ${fmt(hc.x + sd * HEAD_RX * 0.92)},${fmt(hc.y - HEAD_RY * 0.05)}`;
  return (
    <g>
      <defs>
        <clipPath id="vc-sb-head"><ellipse cx={hc.x} cy={hc.y - 6} rx={HEAD_RX - 3} ry={HEAD_RY - 4} /></clipPath>
        <radialGradient id="vc-sb-win" cx={HAND_AREA.x - 12} cy={HAND_AREA.y + 20} r={150} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <mask id="vc-sb-mask" maskUnits="userSpaceOnUse" x={hc.x - 300} y={hc.y - 300} width={600} height={600}>
          <rect x={hc.x - 300} y={hc.y - 300} width={600} height={600} fill="url(#vc-sb-win)" />
        </mask>
      </defs>
      <g clipPath="url(#vc-sb-head)">
        <g mask="url(#vc-sb-mask)" opacity={k}>
          <ellipse cx={hc.x} cy={hc.y} rx={HEAD_RX} ry={HEAD_RY} fill="#EDB0A6" />
          {[-1, 1].map((sd) => [0, 1, 2, 3, 4, 5, 6].map((i) => <path key={`${sd}${i}`} d={fold(sd, i)} fill="none" stroke="#C47A72" strokeWidth={3} strokeLinecap="round" opacity={0.7} />))}
          <path d={strip(-1)} fill="none" stroke="#F07C66" strokeWidth={20} strokeLinecap="round" opacity={0.85} />
          <path d={strip(1)} fill="none" stroke="#F07C66" strokeWidth={20} strokeLinecap="round" opacity={0.85} />
          <path d={`M${hc.x},${hc.y - HEAD_RY} L${hc.x},${hc.y + HEAD_RY}`} stroke="#9C4D4B" strokeWidth={4} />
          {area > 0.01 && <ellipse cx={HAND_AREA.x} cy={HAND_AREA.y} rx={26 + 10 * pulse} ry={18 + 7 * pulse} fill={K.saffron} opacity={0.35 * area + 0.4 * pulse} />}
          {area > 0.01 && <ellipse cx={HAND_AREA.x} cy={HAND_AREA.y} rx={13} ry={9} fill={mix('#F07C66', K.saffron, area)} stroke={INK} strokeWidth={2.5 * area} />}
        </g>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- the back-view room
export type BackState = {
  t: number;
  f: number;
  cam: CamS;
  pose: Pose;
  turn: number;
  chip?: {p: V; k: number};
  pcFire: number;
  charge: number;
  mState: 'ready' | 'fire';
  flash: number;
  cableK: number;
  coilPulse: number;
  brain: number;
  area: number;
  path: number;
  portGame: boolean;
  handR: HandShape;
  handL: HandShape;
  lift: number;
};
const pathPts = (pose: Pose): V[] => {
  const bob = pose.bob ?? 0;
  const R = backArm(1, bob);
  return [HAND_AREA, {x: 930, y: 300}, {x: 958, y: 372 + bob * SS}, {x: 990, y: 430 + bob * SS}, {x: R.sh.x + 14, y: R.sh.y}, R.el, R.wr, R.hand];
};
export const StoccoBackRoom: React.FC<{s: BackState}> = ({s}) => {
  const {t, f, cam, pose} = s;
  const g = gameClock(t);
  const common = {look: BACK_LOOK, pose, frame: f, x: SX, y: SGY, scale: SS, flip: true, shadow: false, life: 0, eyeDarts: false, seed: 5};
  const pts = pathPts(pose);
  const pk = s.path > 0 ? polyAt(pts, easeIn(s.path) * 0.6 + s.path * 0.4) : null;
  const drawn = s.path > 0 ? (() => {
    const n = 48, u = easeIn(s.path) * 0.6 + s.path * 0.4;
    return Array.from({length: n + 1}, (_, i) => polyAt(pts, (u * i) / n));
  })() : [];
  return (
    <g>
      <defs>
        <linearGradient id="vc-sw-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.stoccoWall, 0.22)} />
          <stop offset="1" stopColor={K.stoccoWall} />
        </linearGradient>
        <linearGradient id="vc-sw-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade('#D9A773', 0.1)} />
          <stop offset="1" stopColor={lit('#D9A773', 0.1)} />
        </linearGradient>
      </defs>
      {/* the bare wall he faces */}
      <rect x={-1400} y={-900} width={4800} height={900 + DESK.back} fill="url(#vc-sw-wall)" />
      {/* the network wall plate: the campus line plugs into the left port; the right port is empty */}
      <g>
        <rect x={PLATE.x - 52} y={PLATE.y - 34} width={104} height={68} rx={8} fill="#F4F6F8" stroke={INK} strokeWidth={5} />
        <rect x={PORT.x - 25} y={PORT.y - 14.25} width={50} height={28.5} rx={1.5} fill="#11161B" />
        {s.portGame && (
          <g>
            <defs><clipPath id="vc-sb-port"><rect x={PORT.x - 25} y={PORT.y - 14.25} width={50} height={28.5} rx={1.5} /></clipPath></defs>
            <g clipPath="url(#vc-sb-port)">
              <g transform={`translate(${fmt(PORT.x - 320 * G2)} ${fmt(PORT.y - 200 * G2)}) scale(${G2.toFixed(6)})`}>
                <GameScreen t={g} events={gameEvents()} />
              </g>
            </g>
          </g>
        )}
        <rect x={PORT.x - 25} y={PORT.y - 14.25} width={50} height={28.5} rx={1.5} fill="none" stroke={INK} strokeWidth={0.8} />
        <rect x={PLATE.x - 47} y={PLATE.y - 12} width={36} height={24} rx={2} fill="#2D363D" stroke={INK} strokeWidth={3} />
        <rect x={PLATE.x - 42} y={PLATE.y - 6} width={26} height={30} rx={3} fill="#5D6B76" stroke={INK} strokeWidth={3} />
      </g>
      {/* desk against the wall, then the floor */}
      <path d={`M-1400,${DESK.back} L3400,${DESK.back} L3400,${DESK.front} L-1400,${DESK.front} Z`} fill="url(#vc-sw-desk)" stroke={INK} strokeWidth={5} />
      <rect x={-1400} y={DESK.front} width={4800} height={DESK.face - DESK.front} fill={shade('#D9A773', 0.25)} stroke={INK} strokeWidth={5} />
      <rect x={-1400} y={DESK.face} width={4800} height={1600} fill="#6F5B4A" />
      <Cable p={JACK_CABLE} color="#5D6B76" w={8} />
      <ReceivePC fire={s.pcFire} />
      <Keyboard id="vc-sbkb" x={KB.x} y={KB.y} s={KB.s} />
      <Cable p={TRIG_CABLE} color="#3B4A57" w={8} />
      <TmsMachine charge={s.charge} state={s.mState} flash={s.flash} />
      {/* Stocco from behind (crew3, flipped): his right arm is frame-right */}
      <BackArm side={1} bob={pose.bob} lift={s.lift} hand={s.handR} />
      <BackArm side={-1} bob={pose.bob} lift={s.lift} hand={s.handL} />
      <CrewChar {...common} pose={{...pose, armL: HIDDEN, armR: HIDDEN}} front="L" pass="body" id="vc-sb" headGear={<BackHead turn={s.turn} />} />
      {/* the chair back */}
      <g>
        <rect x={SX - 168} y={640} width={336} height={300} rx={46} fill="#46525C" stroke={INK} strokeWidth={6} />
        <rect x={SX - 140} y={660} width={60} height={250} rx={24} fill="#5D6B76" opacity={0.6} />
        <rect x={SX - 22} y={936} width={44} height={200} fill="#2D363D" stroke={INK} strokeWidth={5} />
      </g>
      <SeeBrain k={s.brain} area={s.area} pulse={s.coilPulse} />
      {/* the coil arm, its cable, the coil on the top-left of his head (his LEFT motor cortex) */}
      <CoilArm />
      <path d={lineD(COIL_CABLE)} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      <path d={lineD(COIL_CABLE)} fill="none" stroke="#2D363D" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      {s.cableK > 0 && s.cableK < 1 && (() => {
        const q = polyAt(COIL_CABLE, easeIn(s.cableK));
        return (
          <g>
            <circle cx={q.x} cy={q.y} r={30} fill={K.saffron} opacity={0.35} />
            <circle cx={q.x} cy={q.y} r={13} fill={K.saffron} stroke={INK} strokeWidth={3} />
          </g>
        );
      })()}
      <g opacity={1 - 0.45 * s.brain}>
        <RoundCoil x={COIL.x} y={COIL.y} s={COIL.s} ang={COIL.ang} pulse={s.coilPulse} arcSide={-1} />
      </g>
      {/* the stimulation pathway */}
      {drawn.length > 1 && s.path < 1.02 && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={1 - clamp((s.path - 1) * 50)}>
          <path d={lineD(drawn)} stroke={K.saffron} strokeWidth={26} opacity={0.3} />
          <path d={lineD(drawn)} stroke={INK} strokeWidth={13} />
          <path d={lineD(drawn)} stroke={K.saffron} strokeWidth={8} />
          {pk && <circle cx={pk.x} cy={pk.y} r={14} fill={K.saffron} stroke={INK} strokeWidth={3} />}
        </g>
      )}
      {s.chip && s.chip.k > 0 && <Packet x={s.chip.p.x} y={s.chip.p.y} s={PACKET_SCREEN_S / cam.z} k={s.chip.k} />}
    </g>
  );
};

// ---------------------------------------------------------------- part A: the command arrives, the coil fires (65.75 -> ecu)
const chipAt = (t: number): {p: V; k: number} | undefined => {
  const c = ct();
  const t0 = c.sRoom, t1 = t0 + 0.5, t2 = t1 + 0.12, t3 = t2 + 0.55;
  if (t < t0 || t > t3 + 0.12) return undefined;
  if (t < t1) return {p: bz(JACK_CABLE, easeInOut(ramp(t, t0, t1))), k: ramp(t, t0, t0 + 0.12)};
  if (t < t2) return {p: bz(JACK_CABLE, 1), k: 1 - ramp(t, t1, t2) * 0.7};
  if (t < t3) return {p: bz(TRIG_CABLE, easeInOut(ramp(t, t2, t3))), k: 1};
  return {p: bz(TRIG_CABLE, 1), k: 1 - ramp(t, t3, t3 + 0.12)};
};
const backPoseA = (t: number): Pose => {
  const c = ct();
  const jolt = t > c.pulse ? Math.exp(-(t - c.pulse) * 9) * Math.sin((t - c.pulse) * 30) : 0;
  return {...IDLE, armL: HIDDEN, armR: HIDDEN, lean: 0, tilt: 0, bob: -2 * jolt, lookX: 0, lookY: 0, brows: 0, mouth: 'flat'};
};
export const sCamA = (t: number): CamS => {
  const c = ct();
  const t0 = c.sRoom;
  const hand = RHAND.hand;
  return camPath(t, [
    [t0, {x: PLATE.x - 18, y: PLATE.y + 40, z: 2.5}],
    [t0 + 0.55, {x: 590, y: 380, z: 2.2}],
    [t0 + 1.2, {x: 420, y: 440, z: 1.85}],
    [c.across + 0.6, {x: 380, y: 250, z: 1.55}],
    [c.coil + 0.2, {x: 760, y: 230, z: 1.75}],
    [c.part - 0.05, {x: 800, y: 245, z: 1.85}],
    [c.brain + 0.3, {x: 885, y: 262, z: 2.55}],
    [c.helps, {x: 890, y: 268, z: 2.65}],
    [c.rightHandE - 0.1, {x: hand.x - 20, y: hand.y - 10, z: 2.1}],
    [c.command2 + 0.15, {x: 690, y: 430, z: 0.98}],
    [c.pulse + 0.1, {x: 705, y: 425, z: 1.02}],
    [c.pulse + 0.55, {x: 990, y: 400, z: 1.45}, easeIn],
    [c.ecu, {x: hand.x + 4, y: hand.y - 6, z: 4.6, rot: -50}, (u) => u],
  ]);
};
export const StoccoShotA: React.FC<{t: number; f: number}> = ({t, f}) => {
  const c = ct();
  const cam = sCamA(t);
  const t0 = c.sRoom;
  const dock = t0 + 1.2;
  const pose = backPoseA(t);
  const chip = chipAt(t);
  const pcFire = ramp(t, t0 + 0.5, t0 + 0.6) * (1 - 0.6 * ramp(t, dock, dock + 0.4));
  const trig = c.trig;
  const s: BackState = {
    t, f, cam, pose, turn: 0, chip, pcFire,
    charge: t < dock ? 0 : t < trig ? lerp(0.25 * ramp(t, dock, dock + 0.6), 1, easeInOut(ramp(t, c.command2 - 0.1, trig))) : 1 - ramp(t, c.pulse, c.pulse + 0.25),
    mState: t > dock - 0.05 ? 'fire' : 'ready',
    flash: t > c.pulse ? Math.max(0, 1 - (t - c.pulse) / 0.4) : t > dock ? 0.4 + 0.3 * Math.sin(t * 8) : 0,
    cableK: ramp(t, trig, c.pulse),
    coilPulse: t >= c.pulse ? Math.max(0, 1 - (t - c.pulse) / 0.5) : 0,
    brain: sramp(t, c.part - 0.05, c.part + 0.5) * (1 - 0.55 * sramp(t, c.rightHandE + 0.1, c.command2 + 0.2)) * (1 - sramp(t, c.ecu - 0.35, c.ecu - 0.1)),
    area: sramp(t, c.helps - 0.1, c.helps + 0.3),
    path: ramp(t, c.pulse + 0.1, c.ecu - 0.06),
    portGame: false,
    handR: {curl: 0.1, spread: 0.15},
    handL: {curl: 0.12, spread: 0.15},
    lift: 0,
  };
  const lk = sramp(t, c.brain - 0.1, c.brain + 0.25) * (1 - sramp(t, c.rightHand - 0.1, c.rightHand + 0.2));
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.stoccoWall} />
      <g transform={camT(cam)}>
        <StoccoBackRoom s={s} />
        {lk > 0.01 && <path d={`M${HAND_AREA.x + 60},${HAND_AREA.y - 104} Q${HAND_AREA.x + 20},${HAND_AREA.y - 60} ${HAND_AREA.x + 4},${HAND_AREA.y - 10}`} fill="none" stroke={INK} strokeWidth={3} opacity={lk} />}
        <Tag x={HAND_AREA.x + 120} y={HAND_AREA.y - 118} text="left motor cortex" size={20} k={lk} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- the front view: his reaction
const FX = 1000, FGY = 1080, FS = 2.0;
const ARM_F: Arm = {a: 16, b: -60};
const FCOIL = {x: 1086, y: 228, ang: 40, s: 0.46};
const FCOIL_END = {x: FCOIL.x + Math.cos((FCOIL.ang * Math.PI) / 180) * 124, y: FCOIL.y + Math.sin((FCOIL.ang * Math.PI) / 180) * 124};
const twitchF = (t: number, a: number, amp: number) => {
  const d = t - a;
  if (d < 0 || d > 0.7) return 0;
  // no anticipation: full displacement within two frames, then a decaying tremor
  return amp * (d < 0.066 ? d / 0.066 : Math.exp(-(d - 0.066) * 7) * Math.cos((d - 0.066) * 34));
};
export const frontPose = (t: number): Pose => {
  const c = ct();
  const t0 = c.front;
  // the release: his hand comes up off the space bar, still twitchy
  const rel = easeOut(ramp(t, t0, t0 + 0.2));
  const tremor = t > t0 && t < t0 + 0.6 ? Math.exp(-(t - t0) * 6) * Math.sin((t - t0) * 40) * 6 : 0;
  const look = sramp(t, t0 + 0.25, t0 + 0.5); // eyes drop to the hand
  const raise = sramp(t, c.described + 0.1, c.described + 0.75) * (1 - sramp(t, c.ticE + 0.25, c.ticE + 0.75));
  const flex = t > c.feeling && t < c.something ? 0.5 - 0.5 * Math.cos(((t - c.feeling) / (c.something - c.feeling)) * Math.PI * 2) : 0;
  const tw = twitchF(t, c.something + 0.05, 1) + twitchF(t, c.nervous + 0.1, 0.6);
  const shake = t > c.ticE - 0.25 && t < c.ticE + 0.3 ? Math.sin((t - (c.ticE - 0.25)) * 44) * (1 - ramp(t, c.ticE - 0.25, c.ticE + 0.3)) : 0;
  const flinch = Math.max(0, twitchF(t, c.something + 0.08, 1)) + 0.6 * Math.max(0, twitchF(t, c.nervous + 0.13, 0.6));
  const back = sramp(t, c.ticE + 0.3, c.back - 0.08);
  const armL: Arm = {a: lerp(ARM_F.a, 30, raise) + 2 * rel, b: lerp(ARM_F.b - 6 * (1 - rel), -150, raise) - 10 * rel + tremor + 18 * tw + 12 * shake};
  const hx = lerp(lerp(-0.2, -0.45, look), -0.55, raise) * (1 - back);
  const hy = lerp(lerp(0, 0.8, look), 0.35, raise) * (1 - back);
  const puzzled = sramp(t, c.described, c.described + 0.4) * (1 - back * 0.7);
  return {
    ...IDLE,
    armL,
    armR: ARM_F,
    handL: {curl: lerp(0.3, 0.12, rel) + 0.65 * flex + 0.2 * Math.abs(shake), spread: lerp(0.25, 0.55, rel) * (1 - flex)},
    handR: {curl: 0.32, spread: 0.2},
    lean: 0,
    tilt: (-5 * look - 3 * raise) * (1 - back) + 4 * flinch,
    lookX: hx,
    lookY: hy,
    brows: 0.25 * look + 0.25 * puzzled + 0.5 * flinch - 0.15 * (t > c.nervous ? 1 : 0) * (1 - back),
    browAsym: 0.9 * puzzled * (1 - back),
    mouth: flinch > 0.25 ? 'o' : back > 0.6 ? 'flat' : puzzled > 0.5 ? 'hmm' : 'flat',
    bob: -6 * flinch,
    blink: flinch > 0.3 ? 1 : undefined,
  };
};
const FrontKeyboard: React.FC = () => {
  // seen from the far side: the space bar is the row nearest him (top of the board in this view)
  const x = 930, y = 760, W = 300, D = 92, sk = 26;
  return (
    <g>
      <path d={`M${x - W / 2 + sk},${y} L${x + W / 2 - sk},${y} L${x + W / 2},${y + D} L${x - W / 2},${y + D} Z`} fill="#C9D1D8" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M${x - W / 2},${y + D} L${x + W / 2},${y + D} L${x + W / 2},${y + D + 12} L${x - W / 2},${y + D + 12} Z`} fill="#A4AFB8" stroke={INK} strokeWidth={4} />
      <rect x={x - 60} y={y + 8} width={120} height={14} rx={4} fill={mix(K.plastic, '#FFFFFF', 0.4)} stroke={INK} strokeWidth={2.5} />
      {[0, 1, 2].map((r) => Array.from({length: 10}, (_, i) => {
        const v = 0.36 + r * 0.2;
        const inset = sk * (1 - v);
        const xx = x - W / 2 + inset + 12 + i * ((W - 2 * inset - 24) / 10);
        return <rect key={`${r}-${i}`} x={xx} y={y + D * v} width={(W - 2 * inset - 24) / 10 - 4} height={D * 0.15} rx={2} fill={K.plastic} stroke={INK} strokeWidth={2} />;
      }))}
    </g>
  );
};
export const StoccoFrontShot: React.FC<{t: number; f: number}> = ({t, f}) => {
  const c = ct();
  const pose = frontPose(t);
  const cam = camPath(t, [
    [c.front, {x: 960, y: 560, z: 1.22}],
    [c.something, {x: 945, y: 520, z: 1.36}],
    [c.ticE + 0.3, {x: 935, y: 505, z: 1.46}],
    [c.back, {x: 940, y: 510, z: 1.42}],
  ]);
  const common = {look: BACK_LOOK, pose, frame: f, x: FX, y: FGY, scale: FS, shadow: false, life: 0.4, eyeDarts: false, seed: 5};
  const head = {x: FX, y: FGY + (HY + (pose.bob ?? 0)) * FS};
  return (
    <g>
      <defs>
        <linearGradient id="vc-sf-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lit(K.stoccoWall, 0.25)} />
          <stop offset="1" stopColor={K.stoccoWall} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill={K.stoccoWall} />
      <g transform={camT(cam)}>
        <rect x={-800} y={-800} width={3600} height={1560} fill="url(#vc-sf-wall)" />
        {/* the room behind him: a door, a clock, the TMS machine on its cart (his left side: frame-right) */}
        <rect x={250} y={60} width={280} height={720} rx={8} fill="#C9A27A" stroke={INK} strokeWidth={6} />
        <rect x={280} y={90} width={220} height={240} rx={6} fill={shade('#C9A27A', 0.08)} stroke={INK} strokeWidth={4} />
        <rect x={280} y={370} width={220} height={360} rx={6} fill={shade('#C9A27A', 0.08)} stroke={INK} strokeWidth={4} />
        <circle cx={500} cy={450} r={13} fill={K.saffron} stroke={INK} strokeWidth={4} />
        <circle cx={720} cy={150} r={56} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
        <path d={`M720,150 L720,112 M720,150 L${fmt(720 + 28 * Math.cos(t * 0.6))},${fmt(150 + 28 * Math.sin(t * 0.6))}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <g>
          {[1480, 1700].map((x, i) => <rect key={i} x={x} y={640} width={16} height={300} fill="#7E8B96" stroke={INK} strokeWidth={4} />)}
          <rect x={1450} y={420} width={290} height={230} rx={16} fill="#E1E6EA" stroke={INK} strokeWidth={6} />
          <rect x={1480} y={450} width={160} height={70} rx={8} fill={K.screenDark} stroke={INK} strokeWidth={4} />
          <text x={1560} y={497} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={30} fill="#7FA6B8">READY</text>
          <text x={1480} y={620} fontFamily={FONT_HEAD} fontWeight={700} fontSize={28} fill="#7E8B96">TMS</text>
        </g>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={`M1600,420 L1600,120 L1330,92 L${fmt(FCOIL_END.x + 6)},${fmt(FCOIL_END.y + 2)}`} stroke={INK} strokeWidth={30} />
          <path d={`M1600,420 L1600,120 L1330,92 L${fmt(FCOIL_END.x + 6)},${fmt(FCOIL_END.y + 2)}`} stroke="#9AA7B1" strokeWidth={18} />
        </g>
        {[{x: 1600, y: 120}, {x: 1330, y: 92}].map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={20} fill="#7E8B96" stroke={INK} strokeWidth={5} />)}
        <CrewChar {...common} front="L" pass="body" id="vc-sf" headGear={<FrontCap />} />
        <g transform={`translate(0 ${fmt((pose.bob ?? 0) * FS)})`}>
          <RoundCoil x={FCOIL.x} y={FCOIL.y} s={FCOIL.s} ang={FCOIL.ang} />
        </g>
        {/* the desk and keyboard in front of him */}
        <path d="M-800,720 L2800,720 L2800,1800 L-800,1800 Z" fill="#D9A773" stroke={INK} strokeWidth={6} />
        <path d="M-800,720 L2800,720" stroke={lit('#D9A773', 0.35)} strokeWidth={8} />
        <FrontKeyboard />
        <CrewChar {...common} front="L" pass="frontArm" id="vc-sf-l" />
        <CrewChar {...common} front="R" pass="frontArm" id="vc-sf-r" />
        {void head}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- the end: behind him again, then into the empty port
const FINAL: CamS = {x: PORT.x, y: PORT.y, z: 3 / G2};
export const endCam = (t: number): CamS => {
  const c = ct();
  return camPath(t, [
    [c.back, {x: 860, y: 360, z: 1.32}],
    [c.missing, {x: 820, y: 345, z: 1.42}],
    [c.end, FINAL, (u) => easeInOut(u)],
  ]);
};
const endPose = (t: number): {pose: Pose; turn: number; drum: number; shrug: number} => {
  const c = ct();
  // idle: his left hand drums on the desk; he looks over at the machine, then back at the wall; a small shrug
  const drum = t > c.imagine + 0.1 && t < c.missing ? Math.abs(Math.sin((t - c.imagine) * 11)) : 0;
  const turn = 0.75 * sramp(t, c.imagine + 0.35, c.imagine + 0.75) * (1 - sramp(t, c.controller + 0.45, c.missing - 0.05));
  const shrug = sramp(t, c.missing, c.missing + 0.3) * (1 - sramp(t, c.game - 0.05, c.game + 0.45));
  return {
    pose: {...IDLE, armL: HIDDEN, armR: HIDDEN, lean: 0, tilt: 3 * shrug, bob: -9 * shrug, lookX: 0, lookY: 0, brows: 0, mouth: 'flat'},
    turn,
    drum,
    shrug,
  };
};
export const StoccoEndShot: React.FC<{t: number; f: number}> = ({t, f}) => {
  const cam = endCam(t);
  const {pose, turn, drum, shrug} = endPose(t);
  const s: BackState = {t, f, cam, pose, turn, pcFire: 0, charge: 0, mState: 'ready', flash: 0, cableK: 0, coilPulse: 0, brain: 0, area: 0, path: 0, portGame: true, handR: {curl: 0.1, spread: 0.15}, handL: {curl: 0.1 + 0.45 * drum, spread: 0.15}, lift: shrug};
  return (
    <g>
      <rect x={0} y={0} width={1920} height={1080} fill={K.stoccoWall} />
      <g transform={camT(cam)}>
        <StoccoBackRoom s={s} />
      </g>
    </g>
  );
};
export const RHAND_S = RHAND;
