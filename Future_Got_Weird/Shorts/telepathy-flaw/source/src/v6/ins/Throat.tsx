// V4 throat insert: the sender's neck in a clean anatomical cutaway (front view): chin and closed mouth above, the striped
// collar below, the larynx in the window between: hyoid, thyroid shield, vestibule, the two vocal folds with the glottal
// slit, the ribbed trachea and the carotids. The folds stay still: this is the speech path he is NOT using.
// ThroatScene: the cutaway. GlottisView: the same folds seen from above through the airway, a round view that the
// next cut matches to the implant disc.
import React from 'react';
import {lit, mix, shade} from '../../lib/color';
import {INK} from '../../lib/ink';
import {clamp, fmt} from '../../lib/math';
import {Glow, Lin, SoftShadow} from '../../lib/shade';
import {rr} from '../env/Props';

const SKIN = '#F2C9A8';
const OL = {stroke: INK, strokeOpacity: 0.75, strokeWidth: 4, strokeLinejoin: 'round' as const};

export const Backdrop: React.FC<{id: string; a?: string; b?: string; c?: string}> = ({id, a = '#17445A', b = '#0F2F42', c = '#0A2030'}) => (
  <g>
    <defs>
      <radialGradient id={`${id}-bg`} gradientUnits="userSpaceOnUse" cx={540} cy={820} r={1250}>
        <stop offset="0" stopColor={a} />
        <stop offset="0.55" stopColor={b} />
        <stop offset="1" stopColor={c} />
      </radialGradient>
    </defs>
    <rect x={-100} y={-100} width={1280} height={2120} fill={`url(#${id}-bg)`} />
  </g>
);

/** state: calm 0..1 (the folds go from warm and alive to grey and slack as "vocal cords," ends) */
/** vib: 1 while he would speak (the folds oscillate and sound arcs rise through the pharynx), 0 once they are 'not used' */
export const ThroatScene: React.FC<{t: number; f: number; idle: number; scan?: number; vib?: number}> = ({t, f, idle, scan = 0, vib = 0}) => {
  const cx = 540;
  const fold = mix('#F0948E', '#B9A9AB', idle);
  const foldD = mix('#C85E66', '#8E8590', idle);
  const lumen = mix('#4A1422', '#2B1F2C', idle);
  const breath = Math.sin(t * 2.2) * 2;
  void breath;
  const cut = rr(392, 400, 296, 800, 74);
  // the folds close and open ~6 times a second (every 5th frame: it reads as a buzz, not an alias)
  const vv = vib * (-7 + 14 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 6)));
  return (
    <g>
      <Backdrop id="th" />
      {/* the sender: chin, jaw and neck */}
      <g>
        <SoftShadow id="th-ms" c={{x: cx, y: 1320}} rx={340} ry={60} alpha={0.35} color="#021018" />
        {/* shoulders and striped collar */}
        <g>
          <path d="M-20,1920 L-20,1660 Q40,1540 250,1500 L360,1470 Q540,1560 720,1470 L830,1500 Q1040,1540 1100,1660 L1100,1920 Z" fill="#FFFFFF" {...OL} />
          {Array.from({length: 8}, (_, i) => (
            <path key={i} d={`M-20,${1590 + i * 96} Q540,${1560 + i * 96 + 60} 1100,${1590 + i * 96} V${1590 + i * 96 + 44} Q540,${1560 + i * 96 + 104} -20,${1590 + i * 96 + 44} Z`} fill="#FFC744" opacity={0.95} />
          ))}
          <Lin id="th-tee" d="M-20,1920 L-20,1660 Q40,1540 250,1500 L360,1470 Q540,1560 720,1470 L830,1500 Q1040,1540 1100,1660 L1100,1920 Z" from={{x: 100, y: 1500}} to={{x: 1000, y: 1800}} stops={[[0, '#FFFFFF', 0.25], [0.5, '#FFFFFF', 0], [1, '#2E4A66', 0.3]]} />
          <path d="M360,1470 Q540,1570 720,1470" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        </g>
        {/* neck */}
        <path d="M352,330 L728,330 L742,1480 Q540,1580 338,1480 Z" fill={SKIN} {...OL} />
        <Lin id="th-neck" d="M352,330 L728,330 L742,1480 Q540,1580 338,1480 Z" from={{x: 350, y: 800}} to={{x: 740, y: 800}} stops={[[0, '#FFF6EA', 0.3], [0.3, '#FFFFFF', 0], [0.75, '#7A4630', 0.0], [1, '#7A4630', 0.3]]} />
        {/* jaw and chin (front view, cropped above the mouth) */}
        <path d="M200,-40 L880,-40 L850,120 Q820,300 690,350 Q540,392 390,350 Q260,300 230,120 Z" fill={SKIN} {...OL} />
        <Lin id="th-jaw" d="M200,-40 L880,-40 L850,120 Q820,300 690,350 Q540,392 390,350 Q260,300 230,120 Z" from={{x: 200, y: 100}} to={{x: 880, y: 300}} stops={[[0, '#FFF6EA', 0.34], [0.4, '#FFFFFF', 0], [1, '#7A4630', 0.3]]} />
        {/* closed mouth: silent */}
        <path d="M430,196 Q540,214 650,196" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" opacity={0.85} />
        <path d="M470,262 Q540,282 610,262" fill="none" stroke={shade(SKIN, 0.4)} strokeWidth={8} strokeLinecap="round" opacity={0.4} />
        <path d="M470,36 L560,0" stroke="#FFFFFF" strokeWidth={14} strokeLinecap="round" opacity={0.28} />
      </g>
      {/* cutaway rim: skin, fat, muscle */}
      <g>
        <path d={rr(372, 380, 336, 840, 88)} fill={SKIN} {...OL} strokeWidth={5} />
        <path d={rr(382, 390, 316, 820, 82)} fill="#F2D27A" stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
        <path d={rr(390, 398, 300, 804, 76)} fill="#E58A86" stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
        <path d={cut} fill="#F4C7BE" stroke={INK} strokeOpacity={0.6} strokeWidth={4} />
        <clipPath id="th-clip">
          <path d={cut} />
        </clipPath>
        <g clipPath="url(#th-clip)">
          {/* muscle fibres */}
          {Array.from({length: 11}, (_, i) => (
            <path key={i} d={`M${410 + i * 26},410 Q${400 + i * 26 + (i % 2 ? 8 : -8)},800 ${410 + i * 26},1190`} stroke="#D98A86" strokeOpacity={0.35} strokeWidth={6} fill="none" />
          ))}
          {/* carotids and jugulars */}
          <path d="M424,420 V1190" stroke={INK} strokeWidth={34} strokeLinecap="round" opacity={0.6} />
          <path d="M424,420 V1190" stroke="#C8283A" strokeWidth={26} strokeLinecap="round" />
          <path d="M416,430 V1180" stroke="#FFB0B8" strokeWidth={5} strokeLinecap="round" opacity={0.6} />
          <path d="M656,420 V1190" stroke={INK} strokeWidth={34} strokeLinecap="round" opacity={0.6} />
          <path d="M656,420 V1190" stroke="#C8283A" strokeWidth={26} strokeLinecap="round" />
          <path d="M648,430 V1180" stroke="#FFB0B8" strokeWidth={5} strokeLinecap="round" opacity={0.6} />
          {/* hyoid */}
          <path d="M448,470 Q540,540 632,470" fill="none" stroke={INK} strokeWidth={36} strokeLinecap="round" />
          <path d="M448,470 Q540,540 632,470" fill="none" stroke="#EDE6D6" strokeWidth={28} strokeLinecap="round" />
          {/* pharynx: the cavity above the larynx */}
          <path d="M470,520 Q540,490 610,520 L596,650 L484,650 Z" fill={lumen} stroke={INK} strokeWidth={4} />
          <path d="M470,520 Q540,490 610,520" fill="none" stroke="#F0948E" strokeWidth={8} opacity={0.9} />
          {/* thyroid shield */}
          <path d="M452,600 L486,596 L540,628 L594,596 L628,600 L650,740 Q650,860 590,892 L490,892 Q430,860 430,740 Z" fill="#CFE0EA" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M452,612 L470,740" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" opacity={0.7} />
          <path d="M472,634 L486,606 L540,636 L594,606 L608,634 L600,640 L540,690 L480,640 Z" fill="#9FB8C7" opacity={0.0} />
          {/* the airway inside the shield: vestibule, folds, subglottis */}
          <path d="M488,640 L592,640 L584,770 L596,892 L484,892 L496,770 Z" fill={lumen} stroke={INK} strokeWidth={4} />
          {/* false folds */}
          <path d="M488,690 Q510,700 520,722 L488,730 Z" fill={foldD} stroke={INK} strokeWidth={3} />
          <path d="M592,690 Q570,700 560,722 L592,730 Z" fill={foldD} stroke={INK} strokeWidth={3} />
          {/* the true vocal folds and the glottal slit between them */}
          <path d={`M490,748 Q516,742 ${fmt(528 + vv)},766 Q${fmt(524 + vv)},790 490,794 Z`} fill={fold} stroke={INK} strokeWidth={4} />
          <path d={`M590,748 Q564,742 ${fmt(552 - vv)},766 Q${fmt(556 - vv)},790 590,794 Z`} fill={fold} stroke={INK} strokeWidth={4} />
          <path d="M500,752 Q516,750 522,762" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.6 * (1 - idle)} />
          <path d="M580,752 Q564,750 558,762" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.6 * (1 - idle)} />
          {/* trachea with cartilage rings */}
          <path d="M490,892 L486,1210 L594,1210 L590,892 Z" fill={lumen} stroke={INK} strokeWidth={4} />
          {Array.from({length: 8}, (_, i) => {
            const y = 920 + i * 40;
            return (
              <g key={i}>
                <path d={`M474,${y} Q540,${y + 16} 606,${y}`} fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" />
                <path d={`M474,${y} Q540,${y + 16} 606,${y}`} fill="none" stroke="#EDE6D6" strokeWidth={18} strokeLinecap="round" />
              </g>
            );
          })}
          <Glow id="th-fg" c={{x: cx, y: 770}} r={120} color="#FFB07A" alpha={0.5 * (1 - idle)} />
          {/* sound arcs rising from the glottis through the pharynx while he would speak */}
          {vib > 0.02 && [0, 1, 2, 3].map((i) => {
            const ph = (t * 1.6 + i / 4) % 1;
            const r = 40 + 330 * ph;
            const a = 1.05;
            return <path key={i} d={`M${fmt(cx + r * Math.sin(-a))},${fmt(740 - r * Math.cos(a))} A${fmt(r)},${fmt(r)} 0 0 1 ${fmt(cx + r * Math.sin(a))},${fmt(740 - r * Math.cos(a))}`} fill="none" stroke="#FFE7C7" strokeWidth={9 * (1 - ph * 0.5)} strokeLinecap="round" opacity={vib * 0.85 * (1 - ph)} />;
          })}
        </g>
        {/* a scan ring: the chip begins to read (the next cut) */}
        {scan > 0.01 && <circle cx={cx} cy={770} r={80 + 120 * scan} fill="none" stroke="#46CFFF" strokeWidth={8 * (1 - scan) + 2} opacity={0.8 * (1 - scan)} />}
        <path d={cut} fill="none" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={3} />
      </g>
      <text x={0} y={0} opacity={0}>{fmt(f)}</text>
    </g>
  );
};

const polar = (r: number, a: number, cx = 540, cy = 790) => ({x: cx + r * Math.cos((a * Math.PI) / 180), y: cy + r * Math.sin((a * Math.PI) / 180)});

/** the folds seen from above, through the airway: a round view, centre (540, 790), radius 330 (the same circle as the disc it cuts to) */
export const GlottisView: React.FC<{idle: number; f: number}> = ({idle, f}) => {
  const cx = 540;
  const cy = 790;
  const fold = mix('#F0948E', '#B9A9AB', idle);
  const wall = mix('#E58A86', '#A99AA0', idle);
  void f;
  return (
    <g>
      <Backdrop id="gl" a="#1B2630" b="#0E161E" c="#070B10" />
      <defs>
        <radialGradient id="gl-w" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={330} fx={cx - 120} fy={cy - 160}>
          <stop offset="0" stopColor={lit(wall, 0.25)} />
          <stop offset="0.7" stopColor={wall} />
          <stop offset="1" stopColor={shade(wall, 0.45)} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={336} fill={INK} />
      <circle cx={cx} cy={cy} r={330} fill="url(#gl-w)" />
      {/* tracheal rings seen down the tube */}
      {[300, 250, 200].map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={shade(wall, 0.35)} strokeOpacity={0.5 - i * 0.1} strokeWidth={16 - i * 3} />
      ))}
      {/* the dark airway beyond the folds */}
      <ellipse cx={cx} cy={cy + 30} rx={150} ry={210} fill="#2B1218" stroke={INK} strokeWidth={5} />
      {/* the folds: two soft lips meeting in a V, with the slit between */}
      <path d={`M${cx - 168},${cy - 120} Q${cx - 170},${cy + 40} ${cx - 20},${cy + 190} L${cx - 8},${cy + 168} Q${cx - 130},${cy + 30} ${cx - 118},${cy - 130} Z`} fill={fold} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M${cx + 168},${cy - 120} Q${cx + 170},${cy + 40} ${cx + 20},${cy + 190} L${cx + 8},${cy + 168} Q${cx + 130},${cy + 30} ${cx + 118},${cy - 130} Z`} fill={fold} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M${cx - 148},${cy - 90} Q${cx - 150},${cy + 20} ${cx - 90},${cy + 100}`} fill="none" stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" opacity={0.5 * (1 - idle)} />
      <path d={`M${cx + 148},${cy - 90} Q${cx + 150},${cy + 20} ${cx + 90},${cy + 100}`} fill="none" stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" opacity={0.4 * (1 - idle)} />
      {/* epiglottis at the top */}
      <path d={`M${cx - 130},${cy - 250} Q${cx},${cy - 330} ${cx + 130},${cy - 250} Q${cx + 80},${cy - 190} ${cx},${cy - 196} Q${cx - 80},${cy - 190} ${cx - 130},${cy - 250} Z`} fill={shade(wall, 0.1)} stroke={INK} strokeWidth={5} />
      {/* vignette ring like a scope */}
      <circle cx={cx} cy={cy} r={330} fill="none" stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={5} />
      <circle cx={polar(300, -118).x} cy={polar(300, -118).y} r={11} fill="#FFFFFF" opacity={0.55} />
    </g>
  );
};

void clamp;
