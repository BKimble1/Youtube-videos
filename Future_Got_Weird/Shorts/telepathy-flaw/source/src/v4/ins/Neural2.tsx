// V4 neural environments, part 2: the x-ray of the implant from above (the match cut's second half), the brain in
// profile with the motor strip lit, the chip's interior (decoder) and the swarm of unwanted impulses.
import React from 'react';
import {Cam, Layer} from '../../lib/camera';
import {lit, mix, shade} from '../../lib/color';
import {INK} from '../../lib/ink';
import {clamp, easeInOut, easeOut, fmt, hash, lerp, P, rng, V} from '../../lib/math';
import {Glow} from '../../lib/shade';
import {rr} from '../env/Props';
import {BLUE, BLUE_D, CYAN, RED} from '../art/Implant';
import {Backdrop} from './Throat';
import {BlurDefs, Cell, FieldBg, NEURAL, PulseOn, sample} from './Neural';

const polar = (r: number, a: number, cx = 540, cy = 790): V => ({x: cx + r * Math.cos((a * Math.PI) / 180), y: cy + r * Math.sin((a * Math.PI) / 180)});

// ---------------------------------------------------------------------------------------------------------------
// the implant seen from above through the skull: the disc, its fan of electrode threads, neurons beneath
// ---------------------------------------------------------------------------------------------------------------
export const XrayImplant: React.FC<{lt: number; f: number; pulses: number[]; dive: number}> = ({lt, f, pulses, dive}) => {
  const cx = 540;
  const cy = 790;
  const threads = Array.from({length: 14}, (_, i) => {
    const a = i * (360 / 14) + 6;
    const p0 = polar(330, a);
    const p1 = polar(470 + (i % 3) * 40, a + (i % 2 ? 8 : -8));
    const p2 = polar(640 + (i % 4) * 30, a + (i % 2 ? 13 : -13));
    return {a, p0, p1, p2};
  });
  const R = rng(9);
  const cells = Array.from({length: 16}, (_, i) => ({x: 40 + R() * 1000, y: 150 + R() * 1250, r: 24 + R() * 26, rot: R() * 6, seed: 500 + i}));
  const sc = 1 + 3.2 * dive * dive;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${sc.toFixed(5)}) translate(${-cx} ${-cy})`}>
      <Backdrop id="xr" a="#12324A" b="#0C2234" c="#06101A" />
      <g opacity={0.5}>
        {cells.map((c, i) => (
          <Cell key={i} id={`xr${i}`} x={c.x} y={c.y} r={c.r} rot={c.rot} seed={c.seed} n={4} alpha={0.6} />
        ))}
      </g>
      {/* skull: a soft arc and sutures, seen from above through the scalp */}
      <circle cx={cx} cy={cy} r={720} fill="none" stroke="#9FD8F0" strokeOpacity={0.14} strokeWidth={26} />
      <circle cx={cx} cy={cy} r={720} fill="none" stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={3} />
      {/* fan of threads */}
      {threads.map((t, i) => (
        <g key={i}>
          <path d={`M${P(t.p0)} Q${P(t.p1)} ${P(t.p2)}`} stroke="#9AE6FF" strokeOpacity={0.55} strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d={`M${P(t.p0)} Q${P(t.p1)} ${P(t.p2)}`} stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <circle cx={t.p2.x} cy={t.p2.y} r={9} fill={NEURAL.gold} stroke={INK} strokeWidth={2.5} />
        </g>
      ))}
      {pulses.map((p0, i) => {
        const k = (lt - p0) / 0.7;
        if (k < 0 || k > 1) return null;
        return <circle key={i} cx={cx} cy={cy} r={330 + 420 * k} fill="none" stroke="#9AE6FF" strokeWidth={9 * (1 - k) + 2} opacity={0.75 * (1 - k)} />;
      })}
      {/* the disc */}
      <circle cx={cx} cy={cy} r={336} fill={INK} />
      <defs>
        <radialGradient id="xr-bez" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={330} fx={cx - 120} fy={cy - 170}>
          <stop offset="0" stopColor="#5E8BFF" />
          <stop offset="0.7" stopColor={BLUE} />
          <stop offset="1" stopColor={BLUE_D} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={330} fill="url(#xr-bez)" />
      <circle cx={cx} cy={cy} r={262} fill="#0A1A40" stroke={INK} strokeWidth={5} />
      <circle cx={cx} cy={cy} r={236} fill="#10285E" stroke="#9AF0FF" strokeWidth={6} />
      {Array.from({length: 8}, (_, i) => {
        const a = polar(80, i * 45);
        const b = polar(190, i * 45 + (i % 2 ? 7 : -7));
        return <path key={i} d={`M${P(a)} L${P(b)}`} stroke="#9AF0FF" strokeWidth={5} strokeLinecap="round" opacity={0.7} />;
      })}
      <Glow id="xr-glow" c={{x: cx, y: cy}} r={170} color={CYAN} alpha={0.9} />
      <circle cx={cx} cy={cy} r={64 + 6 * Math.sin(f * 0.3)} fill={CYAN} opacity={0.9} />
      <circle cx={cx} cy={cy} r={30} fill="#FFFFFF" />
      <path d={`M${P(polar(210, 205))} A210 210 0 0 1 ${P(polar(210, 262))}`} stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" fill="none" opacity={0.28} />
      <rect x={-900} y={-900} width={3000} height={4000} fill="#46CFFF" opacity={0.0} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// the brain in profile, front to the left, the motor strip lit
// ---------------------------------------------------------------------------------------------------------------
const BRAIN =
  'M132,930 C120,800 220,690 360,640 C470,600 640,596 760,650 C880,704 940,820 930,930 C922,1030 870,1090 760,1110 C690,1124 600,1096 520,1104 C420,1114 330,1090 250,1040 C180,1002 138,980 132,930 Z';
const CENTRAL: V[] = [{x: 548, y: 612}, {x: 520, y: 700}, {x: 540, y: 790}, {x: 504, y: 880}, {x: 520, y: 960}];

export const CortexView: React.FC<{lt: number; f: number; cam: Cam}> = ({lt, f, cam}) => {
  const strip = clamp((lt - 0.3) / 0.5);
  const lit1 = easeOut(strip);
  const beat = 0.5 + 0.5 * Math.sin(f * 0.22);
  // the motor strip: a band just in front of the central sulcus (to its left)
  const band = (k: number): V => ({x: lerp(470, 456, k) - 4 * Math.sin(k * 6), y: lerp(610, 960, k)});
  const bandPts = Array.from({length: 20}, (_, i) => band(i / 19));
  const bandD = `M${bandPts.map(P).join(' L')}`;
  const gyri = [
    'M200,860 C240,790 330,780 390,820 C440,850 450,900 410,930',
    'M230,780 C280,720 360,712 410,744',
    'M600,640 C650,700 700,700 740,660',
    'M640,760 C690,730 780,740 830,800 C860,850 830,900 780,900',
    'M590,860 C640,850 700,880 690,930 C680,980 620,990 580,960',
    'M300,1000 C380,1010 440,1040 520,1040',
    'M770,990 C820,990 860,960 880,920',
  ];
  return (
    <g>
      <BlurDefs id="cx" />
      <FieldBg id="cx" cx={540} cy={900} />
      <Layer cam={cam} depth={2.2}>
        <g opacity={0.35} filter="url(#cx-b10)">
          {Array.from({length: 12}, (_, i) => {
            const R = rng(70 + i);
            return <Cell key={i} id={`cxb${i}`} x={-100 + R() * 1300} y={100 + R() * 1700} r={30 + R() * 34} rot={R() * 6} seed={600 + i} n={4} color="#6C4AB0" />;
          })}
        </g>
      </Layer>
      <Layer cam={cam} depth={1}>
        <defs>
          <radialGradient id="cx-br" gradientUnits="userSpaceOnUse" cx={540} cy={860} r={520} fx={380} fy={720}>
            <stop offset="0" stopColor="#FFC3CE" />
            <stop offset="0.55" stopColor="#F08AA0" />
            <stop offset="1" stopColor="#B24A66" />
          </radialGradient>
          <linearGradient id="cx-cb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E27C94" />
            <stop offset="1" stopColor="#A83F5C" />
          </linearGradient>
          <clipPath id="cx-clip">
            <path d={BRAIN} />
          </clipPath>
        </defs>
        {/* skull dome, a faint arc over the brain */}
        <path d="M40,980 C20,560 300,380 560,380 C820,380 1060,560 1040,980" fill="none" stroke="#9FD8F0" strokeOpacity={0.16} strokeWidth={34} />
        <path d="M40,980 C20,560 300,380 560,380 C820,380 1060,560 1040,980" fill="none" stroke="#FFFFFF" strokeOpacity={0.14} strokeWidth={3} />
        {/* stem and cerebellum */}
        <path d="M600,1090 L640,1380 Q690,1400 720,1370 L700,1100 Z" fill="#E27C94" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <ellipse cx={800} cy={1130} rx={160} ry={96} fill="url(#cx-cb)" stroke={INK} strokeWidth={5} />
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${660 + i * 20},${1090 + i * 12} Q${800},${1070 + i * 18} ${950 - i * 16},${1110 + i * 8}`} stroke="#8C3350" strokeOpacity={0.6} strokeWidth={4} fill="none" strokeLinecap="round" />
        ))}
        {/* cerebrum */}
        <path d={BRAIN} fill={INK} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        <path d={BRAIN} fill="url(#cx-br)" />
        <g clipPath="url(#cx-clip)">
          {gyri.map((d, i) => (
            <g key={i}>
              <path d={d} stroke="#9C3A57" strokeWidth={9} strokeLinecap="round" fill="none" opacity={0.55} />
              <path d={d} stroke="#FFE0E6" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.5} transform="translate(-4 -4)" />
            </g>
          ))}
          {/* lateral sulcus and central sulcus */}
          <path d="M250,990 C340,960 430,950 560,930" stroke="#8C3350" strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.7} />
          <path d={`M${CENTRAL.map(P).join(' L')}`} stroke="#8C3350" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.75} />
          {/* the motor strip lights from the bottom up */}
          <path d={bandD} stroke={mix('#46CFFF', '#FFFFFF', 0.2)} strokeWidth={64} strokeLinecap="round" fill="none" opacity={0.16 + 0.3 * lit1} />
          <path d={`M${bandPts.slice(Math.round((1 - lit1) * 19)).map(P).join(' L')}`} stroke="#9AE6FF" strokeWidth={34} strokeLinecap="round" fill="none" opacity={0.85} />
          <path d={`M${bandPts.slice(Math.round((1 - lit1) * 19)).map(P).join(' L')}`} stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.9} />
        </g>
        <path d="M200,800 C260,700 380,650 500,640" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.3} />
        {lit1 > 0.05 && <Glow id="cx-gl" c={band(0.5)} r={200} ry={360} color={CYAN} alpha={0.55 * lit1 * (0.8 + 0.2 * beat)} />}
        {/* sparkles running up the strip toward the implant */}
        {lit1 > 0.2 &&
          [0, 1, 2, 3].map((i) => {
            const u = 1 - (((f * 0.03 + i * 0.25) % 1));
            const p = band(u);
            return <circle key={i} cx={fmt(p.x + 6 * Math.sin(i * 4 + f * 0.2))} cy={fmt(p.y)} r={9} fill="#FFFFFF" opacity={0.9 * lit1} />;
          })}
        {/* the implant above the strip, its thread entering it */}
        <g>
          <path d={`M470,400 L${band(0).x},${band(0).y + 6}`} stroke="#9AE6FF" strokeWidth={7} strokeLinecap="round" opacity={0.9} />
          <path d={`M440,410 L${band(0.12).x - 14},${band(0.12).y}`} stroke="#9AE6FF" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
          <path d={`M500,410 L${band(0.1).x + 16},${band(0.1).y}`} stroke="#9AE6FF" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
          <ellipse cx={470} cy={404} rx={84} ry={34} fill={INK} />
          <ellipse cx={470} cy={402} rx={78} ry={28} fill={BLUE} />
          <ellipse cx={470} cy={398} rx={52} ry={17} fill="#0A1A40" />
          <ellipse cx={470} cy={398} rx={30} ry={9} fill={CYAN} opacity={0.9} />
          <ellipse cx={440} cy={386} rx={26} ry={6} fill="#FFFFFF" opacity={0.5} />
          {lit1 > 0.3 && <Glow id="cx-ig" c={{x: 470, y: 400}} r={140} color={CYAN} alpha={0.5 * lit1} />}
        </g>
      </Layer>
      <Layer cam={cam} depth={0.65}>
        <g filter="url(#cx-b22)" opacity={0.45}>
          <Cell id="cxn1" x={90} y={1560} r={140} rot={0.3} seed={61} n={4} color="#8A5CD0" />
          <Cell id="cxn2" x={1010} y={420} r={120} rot={1.0} seed={62} n={4} color="#8A5CD0" />
        </g>
      </Layer>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// the decoder: the chip's interior
// ---------------------------------------------------------------------------------------------------------------
const hexD = (cx: number, cy: number, r: number) =>
  `M${Array.from({length: 6}, (_, i) => P({x: cx + r * Math.cos(((i * 60 + 30) * Math.PI) / 180), y: cy + r * Math.sin(((i * 60 + 30) * Math.PI) / 180)})).join(' L')} Z`;

const CH_X = [410, 485, 595, 670];
const spikePath = (x: number, y0: number, y1: number, seed: number, amp: number) => {
  const R = rng(seed);
  let d = `M${x},${y1}`;
  let y = y1;
  while (y > y0) {
    const step = 14 + R() * 26;
    const up = R() > 0.5;
    d += ` L${fmt(x)},${fmt(y - step * 0.5)}`;
    if (up) d += ` L${fmt(x + amp * (0.4 + R()))},${fmt(y - step * 0.7)} L${fmt(x - amp * 0.4)},${fmt(y - step)}`;
    y -= step;
  }
  return d + ` L${x},${y0}`;
};

export const DecoderView: React.FC<{lt: number; f: number; cam: Cam}> = ({lt, f, cam}) => {
  const cx = 540;
  const cy = 930;
  const inU = (i: number) => clamp((lt - 0.05 - i * 0.1) / 0.5);
  const proc = clamp((lt - 0.55) / 0.5);
  const out = easeOut(clamp((lt - 1.0) / 0.5));
  const burst = clamp((lt - 1.45) / 0.2);
  const spin = f * 1.6;
  return (
    <g>
      <BlurDefs id="dc" />
      <FieldBg id="dc" cx={540} cy={900} />
      <Layer cam={cam} depth={1}>
        <defs>
          <radialGradient id="dc-bez" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={414} fx={cx - 150} fy={cy - 210}>
            <stop offset="0" stopColor="#5E8BFF" />
            <stop offset="0.7" stopColor={BLUE} />
            <stop offset="1" stopColor={BLUE_D} />
          </radialGradient>
          <radialGradient id="dc-die" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={190} fx={cx - 60} fy={cy - 80}>
            <stop offset="0" stopColor="#FFE9A6" />
            <stop offset="0.6" stopColor="#E2A93E" />
            <stop offset="1" stopColor="#A56A18" />
          </radialGradient>
          <clipPath id="dc-clip">
            <circle cx={cx} cy={cy} r={346} />
          </clipPath>
        </defs>
        {/* the casing: the same round blue bezel and rivets as the implant on his head, opened to show the board */}
        <circle cx={cx} cy={cy} r={424} fill={INK} />
        <circle cx={cx} cy={cy} r={414} fill="url(#dc-bez)" />
        <path d={`M${P(polar(396, 205, cx, cy))} A396 396 0 0 1 ${P(polar(396, 262, cx, cy))}`} stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" fill="none" opacity={0.28} />
        {Array.from({length: 12}, (_, i) => {
          const p = polar(384, i * 30 + 15, cx, cy);
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={11} fill={INK} />
              <circle cx={p.x} cy={p.y} r={7.5} fill="#8FB0FF" />
              <circle cx={p.x - 2} cy={p.y - 2} r={2.6} fill="#FFFFFF" opacity={0.8} />
            </g>
          );
        })}
        {/* the clip tabs on either side, as on the implant */}
        {[-1, 1].map((sd) => (
          <g key={sd}>
            <path d={rr(cx + sd * 416 - 22, cy - 56, 44, 112, 18)} fill={INK} />
            <path d={rr(cx + sd * 416 - 17, cy - 51, 34, 102, 14)} fill={BLUE} />
          </g>
        ))}
        <circle cx={cx} cy={cy} r={354} fill={INK} />
        <circle cx={cx} cy={cy} r={346} fill="#0A1A3A" stroke="#9AF0FF" strokeOpacity={0.5} strokeWidth={4} />
        <g clipPath="url(#dc-clip)">
          {/* board texture */}
          {Array.from({length: 12}, (_, i) => (
            <path key={i} d={`M180,${600 + i * 56} H900`} stroke="#1C3C7A" strokeOpacity={0.5} strokeWidth={2} />
          ))}
          {/* components */}
          {[[318, 640, 80, 44], [300, 702, 80, 30], [662, 640, 90, 52], [690, 706, 80, 34], [300, 1100, 70, 70], [700, 1100, 64, 80]].map(([x, y, w, h], i) => (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} rx={8} fill="#13306A" stroke="#2E5AB8" strokeWidth={3} />
              <path d={`M${x + 10},${y + h / 2} H${x + w - 10}`} stroke="#46CFFF" strokeOpacity={0.4} strokeWidth={3} />
            </g>
          ))}
          {/* input channels: spike trains entering from the bottom */}
          {CH_X.map((x, i) => {
            const d = spikePath(x, 1120, 1250, 70 + i, 12);
            const u = inU(i);
            return (
              <g key={i}>
                <path d={d} stroke="#46CFFF" strokeOpacity={0.25} strokeWidth={4} fill="none" strokeLinejoin="round" />
                <path d={`M${x},1120 L${lerp(x, cx + (i - 1.5) * 44, 0.9)},${cy + 150}`} stroke="#46CFFF" strokeOpacity={0.3} strokeWidth={4} fill="none" />
                                {u > 0 && (
                  <g>
                    <path d={d} stroke="#9AE6FF" strokeWidth={5} fill="none" strokeLinejoin="round" strokeDasharray="1000" strokeDashoffset={1000 - 1000 * u * 1} opacity={0.95} pathLength={1000} />
                    <circle cx={x} cy={lerp(1250, 1120, u)} r={9} fill="#FFFFFF" />
                    <Glow id={`dc-s${i}`} c={{x, y: lerp(1250, 1120, u)}} r={42} color={CYAN} alpha={0.8} />
                  </g>
                )}
                {u >= 1 && <circle cx={x} cy={1120} r={9} fill="#9AE6FF" />}
              </g>
            );
          })}
          {/* traces into the die */}
          {CH_X.map((x, i) => {
            const e = {x: cx + (i - 1.5) * 52, y: cy + 150};
            return <path key={i} d={`M${x},1120 L${x},1070 L${e.x},1030 L${e.x},${e.y}`} stroke="#46CFFF" strokeOpacity={0.5} strokeWidth={5} fill="none" strokeLinejoin="round" />;
          })}
          {/* the die */}
          <path d={hexD(cx, cy, 196)} fill={INK} />
          <path d={hexD(cx, cy, 186)} fill="url(#dc-die)" />
          <path d={hexD(cx, cy, 150)} fill="#0C1E44" stroke={INK} strokeWidth={4} />
          {/* lattice */}
          {Array.from({length: 5}, (_, i) => (
            <g key={i}>
              <path d={`M${cx - 130},${cy - 80 + i * 40} H${cx + 130}`} stroke="#46CFFF" strokeOpacity={0.35 + 0.5 * proc} strokeWidth={3} />
              <path d={`M${cx - 80 + i * 40},${cy - 130} V${cy + 130}`} stroke="#46CFFF" strokeOpacity={0.35 + 0.5 * proc} strokeWidth={3} />
            </g>
          ))}
          <g transform={`rotate(${fmt(spin)} ${cx} ${cy})`} opacity={0.4 + 0.6 * proc}>
            <circle cx={cx} cy={cy} r={104} fill="none" stroke="#9AE6FF" strokeWidth={5} strokeDasharray="30 22" />
          </g>
          <Glow id="dc-core" c={{x: cx, y: cy}} r={120} color={CYAN} alpha={0.2 + 0.7 * proc} />
          <circle cx={cx} cy={cy} r={40 + 16 * proc} fill="#FFFFFF" opacity={0.2 + 0.8 * proc} />
          {/* the one clean output */}
          <path d={`M${cx},${cy - 190} L${cx},690`} stroke="#9AE6FF" strokeWidth={7} strokeLinecap="round" opacity={0.5 + 0.5 * out} />
        </g>
        {/* the message token leaves the chip: a small clean bubble with three dots */}
        {out > 0 && (
          <g transform={`translate(${cx} ${lerp(cy - 150, 380, out)}) scale(${fmt(0.4 + 0.6 * out)})`}>
            <Glow id="dc-msg" c={{x: 0, y: 0}} r={190} color={CYAN} alpha={0.7 * out} />
            <path d={rr(-130, -60, 260, 120, 60)} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
            <path d="M-30,60 L-58,100 L12,60 Z" fill="#FFFFFF" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d="M-34,58 L10,58" stroke="#FFFFFF" strokeWidth={9} />
            {[-56, 0, 56].map((x, i) => (
              <circle key={i} cx={x} cy={0} r={15 + 3 * Math.sin(f * 0.5 + i)} fill={BLUE} />
            ))}
          </g>
        )}
        {burst > 0 && burst < 1 && <circle cx={cx} cy={380} r={140 + 260 * burst} fill="none" stroke="#9AE6FF" strokeWidth={10 * (1 - burst) + 2} opacity={0.8 * (1 - burst)} />}
      </Layer>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// the swarm: thousands of dim unwanted impulses on the cortex surface, the array sweeping across them
// ---------------------------------------------------------------------------------------------------------------
export const SwarmView: React.FC<{lt: number; f: number; cam: Cam}> = ({lt, f, cam}) => {
  const sweep = easeInOut(clamp(lt / 1.3));
  const sx = lerp(-80, 1160, sweep);
  const dots = Array.from({length: 900}, (_, i) => {
    const R = rng(1000 + i);
    return {x: R() * 1200 - 60, y: R() * 2000 - 40, r: 3 + R() * 7, ph: R() * 6.28, hue: R(), sp: 0.06 + R() * 0.2};
  });
  const folds = ['M-60,300 C200,200 380,420 600,300 S960,260 1140,380', 'M-60,640 C160,560 400,760 640,640 S980,600 1140,700', 'M-60,980 C240,900 420,1100 660,980 S1000,940 1140,1040', 'M-60,1320 C180,1240 420,1420 660,1320 S980,1280 1140,1380', 'M-60,1660 C200,1580 400,1760 640,1660 S980,1620 1140,1700'];
  return (
    <g>
      <BlurDefs id="sw" />
      <FieldBg id="sw" tint={0.35} cx={540} cy={960} />
      <Layer cam={cam} depth={1.8}>
        <g opacity={0.5} filter="url(#sw-b4)">
          {folds.map((d, i) => (
            <path key={i} d={d} stroke="#5B2A64" strokeWidth={46} fill="none" strokeLinecap="round" opacity={0.7} />
          ))}
        </g>
      </Layer>
      <Layer cam={cam} depth={1.25}>
        {dots.slice(0, 450).map((d, i) => {
          const a = 0.3 + 0.6 * Math.max(0, Math.sin(f * d.sp + d.ph));
          return <circle key={i} cx={fmt(d.x)} cy={fmt(d.y)} r={d.r * 0.9} fill={d.hue > 0.94 ? '#6A5AB8' : d.hue > 0.5 ? '#9E2440' : '#C23A52'} opacity={a * 0.7} />;
        })}
      </Layer>
      <Layer cam={cam} depth={1}>
        {dots.slice(450).map((d, i) => {
          const a = 0.4 + 0.6 * Math.max(0, Math.sin(f * d.sp + d.ph));
          const near = Math.abs(d.x - sx);
          const sampled = near < 70 ? 1 - near / 70 : 0;
          const col = d.hue > 0.97 ? '#4F86D0' : d.hue > 0.5 ? '#B02C48' : '#D8485E';
          return (
            <g key={i}>
              <circle cx={fmt(d.x)} cy={fmt(d.y)} r={fmt(d.r * (1 + sampled * 0.6))} fill={sampled > 0.2 ? '#FFFFFF' : col} opacity={Math.min(1, a + sampled)} />
              {sampled > 0.3 && <circle cx={fmt(d.x)} cy={fmt(d.y)} r={fmt(d.r * 3)} fill="none" stroke="#FFFFFF" strokeWidth={1.8} opacity={sampled * 0.7} />}
            </g>
          );
        })}
        {/* the electrode array: a grid of fine contacts, with the sampling front */}
        <g>
          <defs>
            <linearGradient id="sw-band" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#46CFFF" stopOpacity={0} />
              <stop offset="0.5" stopColor="#46CFFF" stopOpacity={0.16} />
              <stop offset="1" stopColor="#46CFFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <rect x={sx - 150} y={-100} width={300} height={2300} fill="url(#sw-band)" />
          {Array.from({length: 12}, (_, r) =>
            Array.from({length: 9}, (_, c) => {
              const x = 60 + c * 120;
              const y = 120 + r * 150;
              const hit = clamp(1 - Math.abs(x - sx) / 90);
              return <rect key={`${r}-${c}`} x={x - 7} y={y - 7} width={14} height={14} rx={3} fill={hit > 0.1 ? '#FFFFFF' : '#2E5AB8'} stroke="#9AE6FF" strokeWidth={2} opacity={0.5 + 0.5 * hit} />;
            }),
          )}
        </g>
      </Layer>
      <Layer cam={cam} depth={0.6}>
        <g filter="url(#sw-b22)" opacity={0.5}>
          <Cell id="swn1" x={140} y={1500} r={160} rot={0.5} seed={81} n={4} color="#B0457A" />
          <Cell id="swn2" x={980} y={500} r={140} rot={1.4} seed={82} n={4} color="#B0457A" />
        </g>
      </Layer>
    </g>
  );
};

void hash;
void lit;
void shade;
void PulseOn;
void sample;
void RED;
