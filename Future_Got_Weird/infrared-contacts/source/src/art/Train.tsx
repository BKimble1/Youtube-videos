// L0: a night-train compartment, side-on, in the 1080x1920 wide framing. The lead sits on the left bench facing right
// (drawn by the caller), the sender sits on the right bench facing left with a small near-infrared transmitter, and the
// bystander reads on the right upper bunk under a lamp. Figures are original Weird Crew characters.
import React from 'react';
import {TRAIN as T, SENDC, BYC, C, LIGHT} from '../theme';
import {P, Pt, smooth, rnd, lerp, clamp} from '../lib';

export const LAYOUT = {
  window: {x0: 318, x1: 782, y0: 610, y1: 960},
  seatY: 1148,
  bunkY: 528,
  lampLead: P(236, 560),
  lampBy: P(660, 300),
  sender: {eye: P(842, 858), s: 0.35},
  by: {eye: P(946, 318), s: 0.33},
};
// transmitter tip (L0) as a function of the sender's arm raise (0 resting .. 1 aimed)
export const senderHand = (aim: number): Pt => {
  const s = LAYOUT.sender;
  const loc = P(lerp(-250, -392, aim), lerp(560, 360, aim));
  return P(s.eye.x + loc.x * s.s, s.eye.y + loc.y * s.s);
};
export const TX_TIP_LOCAL = P(-74, -4); // tip of the device relative to the hand (local units)

const Window: React.FC<{t: number; id: string; lit: number}> = ({t, id, lit}) => {
  const w = LAYOUT.window;
  const W = w.x1 - w.x0, H = w.y1 - w.y0;
  // passing landscape: far hills (slow), mid poles and lights (fast). Deterministic in t.
  const far = (t * 26) % 600, mid = (t * 210) % 900;
  const hills = (off: number, y: number, amp: number, k: number) => {
    const pts: Pt[] = [];
    for (let i = -2; i <= 14; i++) {
      const x = w.x0 + i * 60 - (off % 60);
      const n = Math.floor((off + i * 60) / 60) + k;
      pts.push(P(x, y - amp * rnd(n * 1.37)));
    }
    return `M${w.x0 - 200} ${w.y1 + 10}` + pts.map((p) => `L${p.x} ${p.y}`).join('') + `L${w.x1 + 200} ${w.y1 + 10}Z`;
  };
  return (
    <g>
      <defs>
        <clipPath id={`${id}-wclip`}>
          <rect x={w.x0} y={w.y0} width={W} height={H} rx={36} />
        </clipPath>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A1428" />
          <stop offset="0.7" stopColor={T.windowSky} />
          <stop offset="1" stopColor="#2A3F66" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-wclip)`}>
        <rect x={w.x0} y={w.y0} width={W} height={H} fill={`url(#${id}-sky)`} />
        <circle cx={w.x0 + 330} cy={w.y0 + 80} r={20} fill="#F4EBC8" opacity={0.9} />
        {Array.from({length: 18}, (_, i) => <circle key={i} cx={w.x0 + rnd(i * 3.3) * W} cy={w.y0 + rnd(i * 7.1) * H * 0.45} r={1.6 + rnd(i) * 1.2} fill="#FFFFFF" opacity={0.5 + 0.4 * rnd(i * 2.2)} />)}
        <path d={hills(far, w.y1 - 120, 70, 3)} fill="#13213D" />
        <path d={hills(mid * 0.5, w.y1 - 60, 40, 11)} fill={T.hill} />
        {/* distant town lights streaming past */}
        {Array.from({length: 9}, (_, i) => {
          const x = w.x1 + 60 - ((t * 330 + i * 137) % (W + 160));
          const y = w.y1 - 70 + 22 * rnd(i * 5.7 + Math.floor((t * 330 + i * 137) / (W + 160)));
          return <ellipse key={i} cx={x} cy={y} rx={9} ry={3} fill={T.lamp} opacity={0.8} />;
        })}
        {/* a catenary pole sweeps past now and then */}
        {(() => {
          const x = w.x1 + 80 - ((t * 620) % 1400);
          return <rect x={x} y={w.y0} width={14} height={H} fill="#060C18" opacity={0.85} />;
        })()}
        {/* reflection of the cabin light on the glass */}
        <path d={`M${w.x0 + 40} ${w.y0 + 30} L${w.x0 + 120} ${w.y0 + 30} L${w.x0 + 40} ${w.y0 + 220} Z`} fill="#FFFFFF" opacity={0.05 + 0.04 * lit} />
      </g>
      <rect x={w.x0} y={w.y0} width={W} height={H} rx={36} fill="none" stroke={T.trim} strokeWidth={14} />
      <rect x={w.x0 - 7} y={w.y0 - 7} width={W + 14} height={H + 14} rx={42} fill="none" stroke={C.ink} strokeWidth={3} />
      {/* curtains gathered at the sides */}
      <path d={`M${w.x0 - 34} ${w.y0 - 30} C${w.x0 + 10} ${w.y0 + 120} ${w.x0 - 10} ${w.y1 - 60} ${w.x0 + 16} ${w.y1 + 20} L${w.x0 - 40} ${w.y1 + 30} Z`} fill={T.curtain} stroke={C.ink} strokeWidth={3} />
      <path d={`M${w.x1 + 34} ${w.y0 - 30} C${w.x1 - 10} ${w.y0 + 120} ${w.x1 + 10} ${w.y1 - 60} ${w.x1 - 16} ${w.y1 + 20} L${w.x1 + 40} ${w.y1 + 30} Z`} fill={T.curtain} stroke={C.ink} strokeWidth={3} />
      <rect x={w.x0 - 60} y={w.y0 - 52} width={W + 120} height={16} rx={8} fill={T.trimDeep} />
    </g>
  );
};

const Bench: React.FC<{side: -1 | 1}> = ({side}) => {
  // side -1 = left bench (lead), +1 = right bench (sender); drawn in L0
  const bx0 = side < 0 ? 24 : 896, bx1 = side < 0 ? 198 : 1062;
  const sx0 = side < 0 ? 24 : 640, sx1 = side < 0 ? 440 : 1062;
  const y = LAYOUT.seatY;
  return (
    <g>
      {/* backrest with a headrest pad */}
      <rect x={bx0} y={640} width={bx1 - bx0} height={y - 620} rx={40} fill={T.seat} stroke={C.ink} strokeWidth={3} />
      <rect x={bx0 + 16} y={672} width={bx1 - bx0 - 32} height={150} rx={30} fill={T.seatLight} opacity={0.6} />
      {Array.from({length: 4}, (_, i) => <line key={i} x1={bx0 + 22} x2={bx1 - 22} y1={860 + i * 64} y2={860 + i * 64} stroke={T.seatDeep} strokeWidth={3} />)}
      {/* seat cushion */}
      <rect x={sx0} y={y} width={sx1 - sx0} height={74} rx={30} fill={T.seatLight} stroke={C.ink} strokeWidth={3} />
      <rect x={sx0 + 12} y={y + 54} width={sx1 - sx0 - 24} height={16} rx={8} fill={T.seatDeep} opacity={0.7} />
      {/* base */}
      <rect x={sx0 + 20} y={y + 72} width={sx1 - sx0 - 40} height={150} fill={T.wallDeep} stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

const Bunk: React.FC<{side: -1 | 1; sleeper?: number}> = ({side, sleeper}) => {
  const x0 = side < 0 ? -10 : 596, x1 = side < 0 ? 290 : 1090, y = LAYOUT.bunkY;
  return (
    <g>
      <rect x={x0} y={y} width={x1 - x0} height={40} rx={10} fill={T.bunk} stroke={C.ink} strokeWidth={3} />
      <rect x={x0} y={y + 30} width={x1 - x0} height={12} fill={T.bunkDeep} />
      {side < 0 && sleeper !== undefined && (
        <g>
          {/* a passenger asleep on the upper bunk under a blanket (V2): another person who notices nothing */}
          <rect x={196} y={y - 34} width={92} height={36} rx={16} fill="#E9E4D6" stroke={C.ink} strokeWidth={3} />
          <ellipse cx={238} cy={y - 50} rx={34} ry={30} fill="#C98B5E" stroke={C.ink} strokeWidth={3} />
          <path d={`M206 ${y - 58} C210 ${y - 92} 262 ${y - 96} 272 ${y - 60} C258 ${y - 74} 226 ${y - 76} 206 ${y - 58} Z`} fill="#2B1E16" stroke={C.ink} strokeWidth={3} />
          <path d={`M240 ${y - 46} q8 5 16 0`} fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
          <path d={`M-10 ${y + 2} L-10 ${y - 40} C40 ${y - 66 - 4 * sleeper} 130 ${y - 70 - 5 * sleeper} 214 ${y - 30} L214 ${y + 2} Z`} fill="#5C7E9A" stroke={C.ink} strokeWidth={3} />
          <path d={`M40 ${y - 44 - 3 * sleeper} C90 ${y - 58 - 4 * sleeper} 150 ${y - 54 - 4 * sleeper} 196 ${y - 30}`} fill="none" stroke="#4A6A85" strokeWidth={4} />
        </g>
      )}
      {side < 0 && sleeper === undefined && (
        <g>
          {/* rolled blanket and pillow on the empty upper bunk */}
          <rect x={30} y={y - 54} width={200} height={56} rx={28} fill="#5C7E9A" stroke={C.ink} strokeWidth={3} />
          <path d="M60 492 C90 470 140 470 170 492" fill="none" stroke="#4A6A85" strokeWidth={4} />
        </g>
      )}
    </g>
  );
};

const Lamp: React.FC<{p: Pt; on: number; id: string; flip?: boolean}> = ({p, on, id, flip}) => (
  <g>
    <defs>
      <radialGradient id={`${id}-pool`} cx="0.5" cy="0.2" r="0.8">
        <stop offset="0" stopColor={T.lampGlow} stopOpacity={0.55} />
        <stop offset="1" stopColor={T.lampGlow} stopOpacity={0} />
      </radialGradient>
    </defs>
    <path d={`M${p.x} ${p.y} L${p.x + (flip ? 170 : -170)} ${p.y + 420} L${p.x + (flip ? -210 : 210)} ${p.y + 420} Z`} fill={`url(#${id}-pool)`} opacity={on} />
    <rect x={p.x - 8} y={p.y - 40} width={16} height={34} fill={T.trimDeep} />
    <path d={`M${p.x - 30} ${p.y - 6} L${p.x + 30} ${p.y - 6} L${p.x + 20} ${p.y + 18} L${p.x - 20} ${p.y + 18} Z`} fill={T.trim} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={p.x} cy={p.y + 18} rx={18} ry={5} fill={T.lamp} opacity={0.5 + 0.5 * on} />
  </g>
);

export const TrainBack: React.FC<{t: number; id: string; leadLamp: number; sleeper?: number}> = ({t, id, leadLamp, sleeper}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={T.wallDeep} />
        <stop offset="0.5" stopColor={T.wall} />
        <stop offset="1" stopColor={T.wallDeep} />
      </linearGradient>
    </defs>
    <rect x={-4000} y={-4000} width={9080} height={9920} fill={`url(#${id}-wall)`} />
    <rect x={-4000} y={-4000} width={9080} height={4130} fill="#15252E" />
    <rect x={160} y={110} width={760} height={18} rx={9} fill="#7FB5D9" opacity={0.35} />
    <rect x={-4000} y={1360} width={9080} height={4000} fill={T.floor} />
    <rect x={-4000} y={1360} width={9080} height={10} fill={T.floorLight} />
    {/* wall panel seams and a luggage rack line */}
    <line x1={300} x2={300} y1={130} y2={1360} stroke={T.wallDeep} strokeWidth={3} opacity={0.6} />
    <line x1={800} x2={800} y1={130} y2={1360} stroke={T.wallDeep} strokeWidth={3} opacity={0.6} />
    <Window t={t} id={id} lit={leadLamp} />
    {/* fold-down table under the window with a paper cup */}
    <rect x={430} y={1018} width={220} height={22} rx={8} fill={T.table} stroke={C.ink} strokeWidth={3} />
    <path d="M540 1040 L540 1110 L500 1110" fill="none" stroke={T.tableDeep} strokeWidth={8} strokeLinecap="round" />
    <path d="M500 960 L548 960 L542 1018 L506 1018 Z" fill="#F4EFE3" stroke={C.ink} strokeWidth={3} />
    <rect x={503} y={972} width={42} height={14} fill={C.teal} />
    <Bunk side={-1} sleeper={sleeper} />
    <Bunk side={1} />
    <Lamp p={LAYOUT.lampLead} on={leadLamp} id={`${id}-l1`} flip />
    <Lamp p={LAYOUT.lampBy} on={1} id={`${id}-l2`} flip />
    <Bench side={-1} />
    <Bench side={1} />
  </g>
);

// ---------------- sender (facing left). Local units: head ~600, eye at the origin ----------------
export const Sender: React.FC<{aim: number; press: number; look: number; smile: number; breath: number; id: string; txScale?: number; txGlow?: number}> = ({aim, press, look, smile, breath, id, txScale = 1, txGlow = 0}) => {
  const s = LAYOUT.sender;
  const hand = P(lerp(-250, -392, aim), lerp(560, 360, aim));
  const sh = P(-40, 380);
  const el = P(lerp(-120, -200, aim), lerp(640, 520, aim));
  const b = breath * 2.5;
  const head = smooth([P(70, -320), P(-60, -300), P(-122, -210), P(-132, -120), P(-122, -60), P(-112, -20), P(-128, 20), P(-150, 60), P(-160, 78), P(-146, 92), P(-128, 98), P(-124, 110), P(-132, 124), P(-122, 136), P(-126, 150), P(-116, 192), P(-96, 222), P(-60, 238), P(0, 232), P(60, 206), P(110, 166), P(150, 110), P(200, 60), P(240, 0), P(250, -120), P(200, -250)], true, 0.17);
  return (
    <g transform={`translate(${s.eye.x} ${s.eye.y}) scale(${s.s})`}>
      <defs>
        <clipPath id={`${id}-cardi`}>
          <path d="M100 262 C-30 258 -150 320 -170 520 L-176 900 L190 930 L200 600 C200 420 180 300 100 262 Z" />
        </clipPath>
      </defs>
      {/* far arm resting on the lap */}
      <path d="M40 380 C60 560 20 700 -120 800" fill="none" stroke={C.ink} strokeWidth={70} strokeLinecap="round" />
      <path d="M40 380 C60 560 20 700 -120 800" fill="none" stroke={SENDC.cardiganShade} strokeWidth={64} strokeLinecap="round" />
      <ellipse cx={-150} cy={812} rx={42} ry={26} fill={SENDC.skinShade} stroke={C.ink} strokeWidth={3} />
      {/* legs on the seat, shins down */}
      <path d="M160 860 L-340 880 C-410 886 -430 950 -410 990 L160 1000 Z" fill={SENDC.trousers} stroke={C.ink} strokeWidth={3.4} />
      <path d="M-300 900 C-330 980 -330 1200 -324 1420 L-420 1420 C-426 1200 -432 1000 -412 950 Z" fill={SENDC.trousers} stroke={C.ink} strokeWidth={3.4} />
      <path d="M-316 1410 C-340 1392 -432 1392 -492 1418 C-516 1436 -506 1466 -482 1468 L-318 1468 Z" fill={SENDC.shoe} stroke={C.ink} strokeWidth={3.4} />
      {/* torso: shirt + cardigan */}
      <g transform={`translate(0 900) scale(1 ${1 + b / 300}) translate(0 -900)`}>
        <path d="M100 262 C-30 258 -150 320 -170 520 L-176 900 L190 930 L200 600 C200 420 180 300 100 262 Z" fill={SENDC.shirt} stroke={C.ink} strokeWidth={3.4} />
        <g clipPath={`url(#${id}-cardi)`}>
          <path d="M-20 260 L-80 900 L260 900 L260 260 Z" fill={SENDC.cardigan} />
          <path d="M-60 300 C-120 420 -150 600 -160 900 L-90 900 L-30 300 Z" fill={SENDC.cardigan} />
          <path d="M120 300 C170 500 180 700 170 920" fill="none" stroke={SENDC.cardiganShade} strokeWidth={30} />
        </g>
      </g>
      {/* neck and head */}
      <path d="M-40 180 L-46 300 L60 300 L56 190 Z" fill={SENDC.skinShade} stroke={C.ink} strokeWidth={3} />
      <path d={head} fill={SENDC.skin} stroke={C.ink} strokeWidth={3.2} />
      {/* hair: swept back to a high bun */}
      <path d="M-128 -150 C-140 -270 -30 -350 90 -326 C200 -300 262 -190 246 -40 C220 -60 190 -110 170 -150 C120 -210 30 -220 -40 -200 C-80 -190 -110 -170 -128 -150 Z" fill={SENDC.hair} stroke={C.ink} strokeWidth={3} />
      <circle cx={110} cy={-370} r={78} fill={SENDC.hair} stroke={C.ink} strokeWidth={3} />
      <path d="M60 -330 C90 -300 140 -300 170 -330" fill="none" stroke="#3A3434" strokeWidth={5} />
      {/* ear + earring */}
      <path d="M128 6 C176 -28 196 40 172 76 C160 96 134 96 124 78" fill={SENDC.skin} stroke={C.ink} strokeWidth={3} />
      <circle cx={150} cy={100} r={10} fill={SENDC.earring} stroke={C.ink} strokeWidth={2.5} />
      {/* eye (3/4, looking left toward the lead) and brow */}
      <path d="M-44 4 C-24 -30 20 -30 44 4 C20 22 -24 22 -44 4 Z" fill="#FBF8F1" stroke={C.ink} strokeWidth={3} />
      <circle cx={-12 - 8 * look} cy={4} r={13} fill="#3B2A20" />
      <circle cx={-12 - 8 * look} cy={4} r={6} fill="#0E0906" />
      <circle cx={-16 - 8 * look} cy={-2} r={3.5} fill="#FFFFFF" />
      <path d="M-44 4 C-24 -30 20 -30 44 4" fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      <path d={`M-56 ${-52 - 4 * smile} C-20 -70 20 -70 52 -56`} fill="none" stroke={SENDC.hair} strokeWidth={11} strokeLinecap="round" />
      {/* square glasses */}
      <rect x={-64} y={-34} width={110} height={70} rx={14} fill="#FFFFFF" fillOpacity={0.12} stroke={SENDC.glasses} strokeWidth={6} />
      <path d="M46 -10 L140 -14" stroke={SENDC.glasses} strokeWidth={6} />
      <path d="M-64 -6 L-112 -14" stroke={SENDC.glasses} strokeWidth={6} />
      {/* nose and mouth */}
      <path d="M-118 78 C-108 70 -108 92 -124 92" fill="none" stroke={SENDC.skinShade} strokeWidth={3.4} />
      <path d={`M-98 ${136 - 6 * smile} Q-114 ${138 - 2 * smile} -127 131`} fill="none" stroke="#5E2E24" strokeWidth={4} strokeLinecap="round" />
      {/* near arm: shoulder -> elbow -> hand holding the transmitter, aimed at the lead */}
      <path d={`M${sh.x} ${sh.y} Q${(sh.x + el.x) / 2 + 20} ${(sh.y + el.y) / 2 + 30} ${el.x} ${el.y} Q${(el.x + hand.x) / 2} ${(el.y + hand.y) / 2 + 40} ${hand.x} ${hand.y}`} fill="none" stroke={C.ink} strokeWidth={72} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${sh.x} ${sh.y} Q${(sh.x + el.x) / 2 + 20} ${(sh.y + el.y) / 2 + 30} ${el.x} ${el.y} Q${(el.x + hand.x) / 2} ${(el.y + hand.y) / 2 + 40} ${hand.x} ${hand.y}`} fill="none" stroke={SENDC.cardigan} strokeWidth={65} strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(${hand.x} ${hand.y}) rotate(${lerp(-60, -18, aim)})`}>
        <g transform={`scale(${txScale})`}><Transmitter press={press} glow={txGlow} /></g>
        {/* fingers wrapped under the device, thumb on the button */}
        <path d="M-20 10 C-24 34 30 40 40 14 L40 -2 L-20 -2 Z" fill={SENDC.skin} stroke={C.ink} strokeWidth={3} />
        <path d={`M-6 ${-22 + 7 * press} C-10 ${-40 + 7 * press} 22 ${-44 + 7 * press} 30 ${-24 + 7 * press} L34 -10 L4 -10 Z`} fill={SENDC.skin} stroke={C.ink} strokeWidth={3} />
      </g>
    </g>
  );
};

// small handheld near-infrared transmitter (charcoal body, dark-red window at the tip, teal button)
export const Transmitter: React.FC<{press: number; glow?: number}> = ({press, glow = 0}) => (
  <g>
    <rect x={-80} y={-20} width={150} height={36} rx={16} fill="#2B3138" stroke={C.ink} strokeWidth={3} />
    <rect x={-92} y={-16} width={20} height={28} rx={6} fill="#4A1C22" stroke={C.ink} strokeWidth={3} />
    {glow > 0.01 && <rect x={-92} y={-16} width={20} height={28} rx={6} fill="#9A2E36" opacity={0.6 * glow} />}
    <circle cx={-84} cy={-7} r={3} fill="#FFFFFF" opacity={0.3} />
    <ellipse cx={14} cy={-20 + 3 * press} rx={14} ry={6} fill={C.teal} stroke={C.ink} strokeWidth={2.5} />
  </g>
);

// ---------------- bystander on the upper bunk (facing left, reading). Local units as above ----------------
export const Bystander: React.FC<{page: number; breath: number; id: string}> = ({page, breath}) => {
  const s = LAYOUT.by;
  const b = breath * 2;
  return (
    <g transform={`translate(${s.eye.x} ${s.eye.y}) scale(${s.s})`}>
      {/* legs stretched along the bunk toward the left, knees slightly up */}
      <path d={`M150 560 L-160 520 C-260 500 -320 560 -460 600 L-480 640 L-140 650 L150 660 Z`} fill={BYC.trousers} stroke={C.ink} strokeWidth={3.4} />
      <path d="M-470 596 C-500 580 -560 590 -566 616 C-560 640 -500 646 -474 640 Z" fill="#3B2A22" stroke={C.ink} strokeWidth={3} />
      {/* torso leaning back against the wall */}
      <g transform={`translate(0 600) scale(1 ${1 + b / 300}) translate(0 -600)`}>
        <path d="M110 250 C0 240 -110 300 -120 440 L-110 620 L190 640 L200 420 C200 320 170 260 110 250 Z" fill={BYC.shirt} stroke={C.ink} strokeWidth={3.4} />
        <path d="M-60 270 C-120 360 -130 500 -112 620 L-40 620 L0 280 Z" fill={BYC.cardigan} stroke={C.ink} strokeWidth={3} />
        <path d="M80 256 C160 300 190 420 190 640 L120 640 L60 262 Z" fill={BYC.cardigan} stroke={C.ink} strokeWidth={3} />
      </g>
      <path d="M-40 180 L-46 290 L60 290 L56 190 Z" fill={BYC.skinShade} stroke={C.ink} strokeWidth={3} />
      {/* head tipped down toward the book */}
      <g transform="rotate(-14 0 200)">
        <path d="M-130 26 C-140 -130 -60 -300 60 -300 C180 -300 230 -160 210 -20 C200 80 140 200 40 230 C-40 250 -110 200 -126 130 C-140 110 -150 70 -130 26 Z" fill={BYC.skin} stroke={C.ink} strokeWidth={3.2} />
        <path d="M-140 -60 C-150 -260 -10 -340 110 -300 C220 -260 250 -120 230 60 L170 60 C180 -60 150 -160 60 -180 C-40 -190 -100 -130 -110 -60 Z" fill={BYC.hair} stroke={C.ink} strokeWidth={3.2} />
        <path d="M-20 20 Q-40 32 -62 22" fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
        <path d="M30 20 Q12 32 -10 22" fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
        <circle cx={-40} cy={14} r={30} fill="#FFFFFF" fillOpacity={0.15} stroke={C.ink} strokeWidth={5} />
        <path d="M-10 12 L60 0" stroke={C.ink} strokeWidth={5} />
        <path d="M-60 -36 C-44 -46 -26 -46 -14 -38" fill="none" stroke={BYC.hairShade} strokeWidth={8} strokeLinecap="round" />
        <path d="M-120 110 C-104 104 -96 120 -104 128" fill="none" stroke={BYC.skinShade} strokeWidth={4} />
        <path d="M-96 160 Q-80 166 -66 158" fill="none" stroke="#8A4A3A" strokeWidth={4} strokeLinecap="round" />
      </g>
      {/* book held open, both hands */}
      <g transform="translate(-150 330) rotate(-12)">
        <path d="M0 0 L-150 -40 L-150 150 L0 190 Z" fill={BYC.book} stroke={C.ink} strokeWidth={3.4} />
        <path d="M0 0 L120 -30 L120 160 L0 190 Z" fill={BYC.book} stroke={C.ink} strokeWidth={3.4} />
        <path d="M-6 8 L-138 -26 L-138 136 L-6 172 Z" fill={BYC.page} />
        <path d="M6 8 L110 -18 L110 146 L6 172 Z" fill={BYC.page} />
        {/* turning page */}
        {page > 0.01 && page < 0.99 && (
          <path d={`M4 8 Q${lerp(80, -80, page)} ${-20 - 30 * Math.sin(Math.PI * page)} ${lerp(110, -130, page)} ${lerp(-18, -24, page)} L${lerp(110, -130, page)} ${lerp(146, 140, page)} Q${lerp(80, -80, page)} ${150 - 30 * Math.sin(Math.PI * page)} 4 172 Z`} fill="#FFFDF4" stroke={C.ink} strokeWidth={2} />
        )}
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={-120} x2={-30} y1={10 + i * 26} y2={30 + i * 26} stroke="#B8B0A0" strokeWidth={4} />)}
      </g>
      <ellipse cx={-130} cy={430} rx={34} ry={24} fill={BYC.skin} stroke={C.ink} strokeWidth={3} />
      <ellipse cx={-300} cy={330} rx={30} ry={22} fill={BYC.skin} stroke={C.ink} strokeWidth={3} />
      <path d="M110 330 C40 380 -40 420 -110 430" fill="none" stroke={C.ink} strokeWidth={62} strokeLinecap="round" />
      <path d="M110 330 C40 380 -40 420 -110 430" fill="none" stroke={BYC.cardigan} strokeWidth={56} strokeLinecap="round" />
    </g>
  );
};

export const glow = (id: string, col: string) => (
  <radialGradient id={id} cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stopColor={col} stopOpacity={0.9} />
    <stop offset="1" stopColor={col} stopOpacity={0} />
  </radialGradient>
);
export {LIGHT, clamp};
