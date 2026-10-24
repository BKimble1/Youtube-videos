// V6 C1 (15.0..17.75): inside the transmitter, one stable cutaway from above. The lid lifts away; the optical train
// lights in order: the laser diode fires left through a collimating lens, a fixed fold mirror turns the beam up onto the
// scanning mirror, which sits on the shaft of a galvanometer motor and rocks back and forth a few degrees (on
// "sweeping"), so the beam leaving the exit window swings across a narrow arc. The driver board's scan signal, the
// fan and the status LEDs run with it. Nothing here makes sound: the beam is still only light when it leaves the box.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, ss, W, H} from '../v4/core4';
import {INK} from '../v4/rig/cast4';

const K = {bg: '#22323A', grid: '#2B3D45', body: '#2B3138', bodyHi: '#3C444D', floor: '#33424A', cut: '#F2E6C8', hatch: '#C9B98F', pcb: '#2F6F5A', trace: '#5FA88C',
  chip: '#1A2228', metal: '#8FA3AD', metalHi: '#B9C9D0', metalDeep: '#5E727C', brass: '#C9A043', glass: '#BFE6F0', mirror: '#E4F2F6',
  ir: '#FFB347', irGlow: '#FF9A2E', irCore: '#FFF3D6', led: '#FFC744', green: '#5BE08A', shadow: 'rgba(0,0,0,0.28)'};

const BOX = {x0: 205, x1: 975, y0: 470, y1: 1290, wall: 28, r: 34};
const DIODE = {x: 815, y: 1090};
const LENS = {x: 640, y: 1090};
const FOLD = {x: 470, y: 1090};
const GALVO = {x: 470, y: 760};
const WIN = {x: BOX.x0, y: GALVO.y};
// the scanning mirror rocks +-4 deg about 45 deg (slowed right down), so the beam swings +-8 deg
export const galvoAngle = (t: number) => 4 * Math.sin((t - 15.42) * 2 * Math.PI * 0.85) * ss(15.36, 15.7, t);
const rot = (x: number, y: number, cx: number, cy: number, deg: number) => {
  const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return {x: cx + (x - cx) * c - (y - cy) * s, y: cy + (x - cx) * s + (y - cy) * c};
};
const rr = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M ${x0} ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} L ${x1 - r} ${y0} Q ${x1} ${y0} ${x1} ${y0 + r} L ${x1} ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} L ${x0 + r} ${y1} Q ${x0} ${y1} ${x0} ${y1 - r} Z`;
// a part drawn as a block with a little height: a drop shadow, a darker side face below, then the top face
const Block: React.FC<{x: number; y: number; w: number; h: number; top: string; side: string; r?: number; dz?: number}> = ({x, y, w, h, top, side, r = 8, dz = 14}) => (
  <g>
    <rect x={x + 10} y={y + dz + 8} width={w} height={h} rx={r} fill={K.shadow} />
    <rect x={x} y={y + dz} width={w} height={h} rx={r} fill={side} stroke={INK} strokeWidth={3.5} />
    <rect x={x} y={y} width={w} height={h} rx={r} fill={top} stroke={INK} strokeWidth={3.5} />
  </g>
);
const Beam: React.FC<{x1: number; y1: number; x2: number; y2: number; op: number; w?: number}> = ({x1, y1, x2, y2, op, w = 1}) =>
  op <= 0 ? null : (
    <g opacity={op}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={K.irGlow} strokeWidth={16 * w} opacity={0.35} filter="url(#m6glow)" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={K.ir} strokeWidth={5 * w} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={K.irCore} strokeWidth={1.8 * w} strokeLinecap="round" />
    </g>
  );
// a beam segment that grows from its start over [t0, t0 + dur]
const grow = (t: number, t0: number, dur: number) => clamp((t - t0) / dur);
const Label: React.FC<{x: number; y: number; text: string; op: number; anchor?: 'start' | 'middle' | 'end'}> = ({x, y, text, op, anchor = 'middle'}) =>
  op <= 0 ? null : (
    <text x={x} y={y} opacity={op} fontSize={30} fontFamily='"Nunito Variable", "Nunito", sans-serif' fontWeight={900} letterSpacing={1.5} fill="#F4F1E6" stroke={K.bg} strokeWidth={8} paintOrder="stroke" textAnchor={anchor}>{text}</text>
  );

export const Mech6: React.FC<{t: number}> = ({t}) => {
  const lid = ss(15.05, 15.45, t); // 0 on .. 1 lifted away
  const g = galvoAngle(t);
  // the light, in order through the train
  const T0 = 15.42;
  const a = grow(t, T0, 0.07), b = grow(t, T0 + 0.07, 0.09), c = grow(t, T0 + 0.16, 0.12), d = grow(t, T0 + 0.28, 0.12);
  const on = ss(T0, T0 + 0.05, t);
  const outDeg = 180 + 2 * g; // leaving the scanning mirror: left, tilted by twice the mirror's angle
  const od = {x: Math.cos((outDeg * Math.PI) / 180), y: Math.sin((outDeg * Math.PI) / 180)};
  const far = 520 * d; // how far the outgoing beam has got (px past the galvo)
  const ex = {x: GALVO.x + od.x * far, y: GALVO.y + od.y * far};
  const fan = ss(16.2, 16.8, t);
  const fanFar = 520;
  const fanPts = [-8, 8].map((deg) => ({x: GALVO.x - fanFar * Math.cos((deg * Math.PI) / 180), y: GALVO.y + fanFar * Math.sin((deg * Math.PI) / 180)}));
  const m1 = rot(GALVO.x - 52, GALVO.y, GALVO.x, GALVO.y, -45 + g), m2 = rot(GALVO.x + 52, GALVO.y, GALVO.x, GALVO.y, -45 + g);
  const f1 = rot(FOLD.x - 46, FOLD.y, FOLD.x, FOLD.y, -45), f2 = rot(FOLD.x + 46, FOLD.y, FOLD.x, FOLD.y, -45);
  const fanSpin = (t * 720) % 360;
  // the driver board's scan signal: a sine with a cursor at the present
  const sig = Array.from({length: 61}, (_, i) => {
    const tt = t - 1.2 + i * 0.02;
    return `${i ? 'L' : 'M'}${(712 + i * 3.4).toFixed(1)},${(612 - 9 * galvoAngle(tt)).toFixed(1)}`;
  }).join('');
  const lbl = (t0: number) => ss(t0, t0 + 0.25, t) * (1 - ss(17.45, 17.7, t) * 0);
  return (
    <AbsoluteFill style={{background: K.bg}}>
      <svg width={W} height={H}>
        <defs>
          <pattern id="m6grid" width={60} height={60} patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke={K.grid} strokeWidth={2} /></pattern>
          <pattern id="m6hatch" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1={0} y1={0} x2={0} y2={14} stroke={K.hatch} strokeWidth={4} /></pattern>
          <pattern id="m6holes" width={36} height={36} patternUnits="userSpaceOnUse"><circle cx={18} cy={18} r={4} fill="#26333A" /></pattern>
          <filter id="m6glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation={6} /></filter>
          <linearGradient id="m6lens" x1="0" x2="1"><stop offset="0" stopColor="#E8F7FB" /><stop offset="0.5" stopColor={K.glass} /><stop offset="1" stopColor="#8CC7D6" /></linearGradient>
          <linearGradient id="m6can" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={K.metalHi} /><stop offset="1" stopColor={K.metalDeep} /></linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#m6grid)" />
        <g transform="translate(590 880) scale(1.1) translate(-590 -880)">
        {/* outside the box: the swept arc (faint, once it has swept a few times) and the outgoing beam */}
        {fan > 0 && <path d={`M ${GALVO.x} ${GALVO.y} L ${fanPts[0].x} ${fanPts[0].y} L ${fanPts[1].x} ${fanPts[1].y} Z`} fill={K.ir} opacity={0.1 * fan} />}
        {/* the housing: its floor (a breadboard), then the walls in section */}
        <path d={rr(BOX.x0 + 12, BOX.y0 + 22, BOX.x1 + 12, BOX.y1 + 22, BOX.r)} fill={K.shadow} />
        <path d={rr(BOX.x0, BOX.y0, BOX.x1, BOX.y1, BOX.r)} fill={K.floor} stroke={INK} strokeWidth={5} />
        <rect x={BOX.x0 + BOX.wall} y={BOX.y0 + BOX.wall} width={BOX.x1 - BOX.x0 - 2 * BOX.wall} height={BOX.y1 - BOX.y0 - 2 * BOX.wall} fill="url(#m6holes)" />
        {/* inner wall faces (the box has depth): a darker band along the top and left inner edges */}
        <path d={`M ${BOX.x0 + BOX.wall} ${BOX.y0 + BOX.wall} L ${BOX.x1 - BOX.wall} ${BOX.y0 + BOX.wall} L ${BOX.x1 - BOX.wall} ${BOX.y0 + BOX.wall + 22} L ${BOX.x0 + BOX.wall + 22} ${BOX.y0 + BOX.wall + 22} L ${BOX.x0 + BOX.wall + 22} ${BOX.y1 - BOX.wall} L ${BOX.x0 + BOX.wall} ${BOX.y1 - BOX.wall} Z`} fill="#26333A" />
        {/* driver board, with the scan signal on a small display */}
        <Block x={655} y={530} w={280} h={250} top={K.pcb} side="#22503F" />
        {[[675, 670, 60, 46], [750, 668, 82, 52], [848, 672, 64, 40], [680, 730, 230, 26]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx={4} fill={K.chip} stroke={INK} strokeWidth={2.5} />)}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1={685 + i * 32} y1={724} x2={685 + i * 32} y2={730} stroke={K.led} strokeWidth={3} />)}
        <rect x={700} y={556} width={226} height={96} rx={6} fill="#0E1E18" stroke={INK} strokeWidth={3} />
        <line x1={706} y1={612} x2={920} y2={612} stroke="#1F3A30" strokeWidth={2} />
        <path d={sig} fill="none" stroke={K.green} strokeWidth={3} opacity={0.4 + 0.6 * ss(15.36, 15.6, t)} />
        <circle cx={712 + 60 * 3.4} cy={612 - 9 * g} r={5} fill={K.green} />
        <circle cx={680} cy={560} r={8} fill={on > 0.5 ? K.led : '#5A4A20'} stroke={INK} strokeWidth={2.5} />
        <circle cx={680} cy={584} r={8} fill={on > 0.5 && Math.sin(t * 13) > 0 ? K.green : '#24452F'} stroke={INK} strokeWidth={2.5} />
        {/* the drive cable: board -> galvo motor */}
        <path d={`M 655 700 C 600 700 610 790 ${GALVO.x + 70} 790`} fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
        <path d={`M 655 700 C 600 700 610 790 ${GALVO.x + 70} 790`} fill="none" stroke="#C0392B" strokeWidth={5} strokeLinecap="round" />
        {/* the diode's power cable */}
        <path d={`M 700 780 C 720 900 900 900 ${DIODE.x + 70} ${DIODE.y - 10}`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M 700 780 C 720 900 900 900 ${DIODE.x + 70} ${DIODE.y - 10}`} fill="none" stroke="#3B6FB6" strokeWidth={4} strokeLinecap="round" />
        {/* cooling fan */}
        <circle cx={800} cy={1200} r={66} fill={K.shadow} transform="translate(8 10)" />
        <rect x={728} y={1128} width={144} height={144} rx={14} fill="#1E2328" stroke={INK} strokeWidth={3.5} />
        <circle cx={800} cy={1200} r={62} fill="#141A1E" stroke={INK} strokeWidth={3} />
        <g transform={`rotate(${fanSpin} 800 1200)`}>{[0, 72, 144, 216, 288].map((ang) => <path key={ang} d="M 800 1200 C 822 1160 852 1152 862 1180 C 842 1184 822 1192 800 1200 Z" fill={K.metal} stroke={INK} strokeWidth={2} transform={`rotate(${ang} 800 1200)`} />)}</g>
        <circle cx={800} cy={1200} r={15} fill={K.metalDeep} stroke={INK} strokeWidth={3} />
        {/* the optical rail the parts sit on */}
        <Block x={FOLD.x - 40} y={DIODE.y + 34} w={DIODE.x - FOLD.x + 110} h={26} top={K.metalDeep} side="#43545C" r={6} dz={8} />
        <Block x={GALVO.x - 22} y={GALVO.y + 60} w={44} h={FOLD.y - GALVO.y - 60} top={K.metalDeep} side="#43545C" r={6} dz={8} />
        {/* inside beams, drawn under the parts they enter */}
        <Beam x1={DIODE.x - 60} y1={DIODE.y} x2={DIODE.x - 60 - (DIODE.x - 60 - LENS.x) * a} y2={DIODE.y} op={on} w={0.75} />
        <Beam x1={LENS.x} y1={LENS.y} x2={LENS.x - (LENS.x - FOLD.x) * b} y2={LENS.y} op={b > 0 ? 1 : 0} />
        <Beam x1={FOLD.x} y1={FOLD.y} x2={FOLD.x} y2={FOLD.y - (FOLD.y - GALVO.y) * c} op={c > 0 ? 1 : 0} />
        {/* the laser diode module: a finned heat sink with the diode can at its front */}
        <Block x={DIODE.x - 50} y={DIODE.y - 58} w={130} h={116} top="#5E7883" side="#435861" />
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={DIODE.x - 38 + i * 20} y={DIODE.y - 74} width={10} height={148} rx={3} fill={K.metalDeep} stroke={INK} strokeWidth={2} />)}
        <rect x={DIODE.x - 78} y={DIODE.y - 22} width={34} height={44} rx={6} fill="url(#m6can)" stroke={INK} strokeWidth={3} />
        <rect x={DIODE.x - 86} y={DIODE.y - 9} width={10} height={18} rx={3} fill={on > 0.5 ? K.irGlow : '#6B4A2A'} stroke={INK} strokeWidth={2.5} />
        {/* the collimating lens, in its ring mount */}
        <rect x={LENS.x - 16} y={LENS.y - 64} width={32} height={128} rx={8} fill={K.brass} stroke={INK} strokeWidth={3.5} />
        <path d={`M ${LENS.x} ${LENS.y - 52} Q ${LENS.x + 22} ${LENS.y} ${LENS.x} ${LENS.y + 52} Q ${LENS.x - 22} ${LENS.y} ${LENS.x} ${LENS.y - 52} Z`} fill="url(#m6lens)" stroke={INK} strokeWidth={3} />
        {/* the fixed fold mirror */}
        <rect x={FOLD.x - 30} y={FOLD.y + 6} width={60} height={30} rx={6} fill={K.metal} stroke={INK} strokeWidth={3} />
        <line x1={f1.x} y1={f1.y} x2={f2.x} y2={f2.y} stroke={INK} strokeWidth={17} strokeLinecap="round" />
        <line x1={f1.x} y1={f1.y} x2={f2.x} y2={f2.y} stroke={K.mirror} strokeWidth={10} strokeLinecap="round" />
        {/* the galvanometer: the motor body (seen end-on from above) with the scanning mirror on its shaft */}
        <circle cx={GALVO.x + 8} cy={GALVO.y + 12} r={70} fill={K.shadow} />
        <circle cx={GALVO.x} cy={GALVO.y} r={68} fill="url(#m6can)" stroke={INK} strokeWidth={4} />
        <circle cx={GALVO.x} cy={GALVO.y} r={50} fill={K.metalDeep} stroke={INK} strokeWidth={2.5} />
        {[0, 1, 2, 3].map((i) => { const p = rot(GALVO.x + 59, GALVO.y, GALVO.x, GALVO.y, 45 + i * 90); return <circle key={i} cx={p.x} cy={p.y} r={4.5} fill={K.chip} />; })}
        {/* the shaft: a mark on it turns with the mirror */}
        <circle cx={GALVO.x} cy={GALVO.y} r={20} fill={K.metalHi} stroke={INK} strokeWidth={3} />
        <line x1={m1.x} y1={m1.y} x2={m2.x} y2={m2.y} stroke={INK} strokeWidth={20} strokeLinecap="round" />
        <line x1={m1.x} y1={m1.y} x2={m2.x} y2={m2.y} stroke={K.mirror} strokeWidth={12} strokeLinecap="round" />
        <line x1={(m1.x + GALVO.x) / 2} y1={(m1.y + GALVO.y) / 2} x2={(m2.x + GALVO.x) / 2} y2={(m2.y + GALVO.y) / 2} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        {/* the outgoing beam: from the scanning mirror out through the window, into the room */}
        <Beam x1={GALVO.x} y1={GALVO.y} x2={ex.x} y2={ex.y} op={d > 0 ? 1 : 0} />
        {/* the walls in section (hatched cut faces), with the exit window in the left wall */}
        <path d={`${rr(BOX.x0, BOX.y0, BOX.x1, BOX.y1, BOX.r)} M ${BOX.x0 + BOX.wall} ${BOX.y0 + BOX.wall} L ${BOX.x0 + BOX.wall} ${BOX.y1 - BOX.wall} L ${BOX.x1 - BOX.wall} ${BOX.y1 - BOX.wall} L ${BOX.x1 - BOX.wall} ${BOX.y0 + BOX.wall} Z`} fill={K.cut} fillRule="evenodd" stroke={INK} strokeWidth={4} />
        <path d={`${rr(BOX.x0, BOX.y0, BOX.x1, BOX.y1, BOX.r)} M ${BOX.x0 + BOX.wall} ${BOX.y0 + BOX.wall} L ${BOX.x0 + BOX.wall} ${BOX.y1 - BOX.wall} L ${BOX.x1 - BOX.wall} ${BOX.y1 - BOX.wall} L ${BOX.x1 - BOX.wall} ${BOX.y0 + BOX.wall} Z`} fill="url(#m6hatch)" fillRule="evenodd" opacity={0.5} />
        <rect x={WIN.x - 5} y={WIN.y - 52} width={BOX.wall + 10} height={104} fill={K.glass} opacity={0.85} stroke={INK} strokeWidth={4} />
        <rect x={WIN.x + 3} y={WIN.y - 44} width={6} height={88} fill="#FFFFFF" opacity={0.6} />
        {/* the beam again, over the window glass (it passes straight through) */}
        {d > 0 && <Beam x1={WIN.x + BOX.wall + 4} y1={GALVO.y + od.y * (GALVO.x - WIN.x - BOX.wall - 4) / -od.x} x2={ex.x} y2={ex.y} op={ex.x < WIN.x + BOX.wall ? 1 : 0} />}
        {/* the lid: lifts away at the start of the shot */}
        {lid < 1 && (
          <g transform={`translate(${-lid * 30} ${-lid * 820})`} opacity={1 - ss(0.55, 1, lid)}>
            <path d={rr(BOX.x0 - 10, BOX.y0 - 10, BOX.x1 + 10, BOX.y1 + 10, BOX.r + 6)} fill={K.body} stroke={INK} strokeWidth={5} />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={BOX.x0 + 380 + i * 46} y={BOX.y0 + 70} width={22} height={300} rx={8} fill="#1E2328" />)}
            <rect x={BOX.x0 + 60} y={BOX.y0 + 70} width={220} height={80} rx={8} fill={K.cut} stroke={INK} strokeWidth={3} />
            <rect x={BOX.x0 + 40} y={BOX.y1 - 170} width={BOX.x1 - BOX.x0 - 60} height={24} fill="#1CA7A0" stroke={INK} strokeWidth={3} />
          </g>
        )}
        {/* small part names, each as the light reaches it */}
        <Label x={DIODE.x + 15} y={DIODE.y - 92} text="LASER" op={lbl(T0)} />
        <Label x={LENS.x} y={LENS.y + 108} text="LENS" op={lbl(T0 + 0.07)} />
        <Label x={GALVO.x + 6} y={GALVO.y - 92} text="SCANNING MIRROR" op={lbl(T0 + 0.3)} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
