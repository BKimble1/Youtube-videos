// HOOK 07 perfusion system (world px; the wide view frames roughly 0..1080 x 0..1920): a wheeled clinical console
// with the clear organ chamber on top, a bay with the oxygenator + heater, the pulsatile pump and the blood
// reservoir, the arterial line up to the aortic connector and the return line from the pulmonary connector, and a
// monitor on a pole showing ECG / pressure / flow waveforms (no text).
import React from 'react';
import {clamp, hash, noise1, openPath, sm} from '../shared/lib';
import {INK} from '../shared/ink';
import {lit, mix, rgba, shade} from '../shared/color';
import {BEATS, coronaryFlow, press} from './timeline';
import {C} from './heart';

type XY = [number, number];
const pts = (a: XY[]) => a.map(([x, y]) => ({x, y}));

// ---------------- background (own parallax layer) ----------------
export const Env: React.FC<{t: number}> = ({t}) => (
  <g>
    <defs>
      <linearGradient id="h07-wall" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse" gradientTransform="scale(1,2400)">
        <stop offset="0" stopColor="#1F4049" />
        <stop offset="0.55" stopColor="#183640" />
        <stop offset="1" stopColor="#11262D" />
      </linearGradient>
      <radialGradient id="h07-lamp">
        <stop offset="0" stopColor="#FFF4DC" stopOpacity={0.55} />
        <stop offset="0.35" stopColor="#E8F2EE" stopOpacity={0.22} />
        <stop offset="1" stopColor="#E8F2EE" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="h07-keypool">
        <stop offset="0" stopColor="#3E6F78" stopOpacity={0.75} />
        <stop offset="1" stopColor="#3E6F78" stopOpacity={0} />
      </radialGradient>
      <filter id="h07-bgblur" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
    </defs>
    <rect x={-800} y={-800} width={2680} height={3600} fill="url(#h07-wall)" />
    <ellipse cx={520} cy={720} rx={620} ry={560} fill="url(#h07-keypool)" />
    <g filter="url(#h07-bgblur)" opacity={0.85}>
      {/* wall cabinets and a counter, out of focus */}
      {[-260, 40, 340, 640, 940, 1240].map((x, i) => (
        <g key={i}>
          <rect x={x} y={-120} width={270} height={430} rx={14} fill="#25505A" />
          <rect x={x + 18} y={-100} width={234} height={390} rx={10} fill="#2A5A64" />
          <rect x={x + 210} y={120} width={10} height={70} rx={5} fill="#5E8E96" />
        </g>
      ))}
      <rect x={-600} y={1190} width={2300} height={40} fill="#2C5A63" />
      <rect x={-600} y={1230} width={2300} height={500} fill="#163038" />
      {[-180, 1050, 1260].map((x, i) => (
        <g key={i}>
          <rect x={x} y={1080} width={34} height={110} rx={8} fill={['#3E7C80', '#4D8A7E', '#86A9B0'][i]} />
          <rect x={x + 50} y={1120} width={30} height={70} rx={8} fill={['#C8A55A', '#3E7C80', '#4D8A7E'][i]} />
        </g>
      ))}
      {/* a ceiling surgical light, far behind */}
      <rect x={960} y={-400} width={24} height={300} fill="#2F5D66" />
      <ellipse cx={972} cy={-60} rx={200} ry={70} fill="#3A6B73" />
    </g>
    <ellipse cx={972} cy={-40} rx={420} ry={320} fill="url(#h07-lamp)" opacity={0.75 + 0.05 * Math.sin(t * 1.3)} />
  </g>
);

// ---------------- floor ----------------
export const Floor: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="h07-floor" x1="0" y1="1780" x2="0" y2="2400" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#1B3A41" />
        <stop offset="1" stopColor="#0E2126" />
      </linearGradient>
      <radialGradient id="h07-shadow">
        <stop offset="0" stopColor="#050C10" stopOpacity={0.7} />
        <stop offset="1" stopColor="#050C10" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-800} y={1800} width={2680} height={800} fill="url(#h07-floor)" />
    <path d="M-800,1800 L1880,1800" stroke="#2C5560" strokeWidth={3} opacity={0.6} />
    <ellipse cx={530} cy={1845} rx={470} ry={46} fill="url(#h07-shadow)" />
  </g>
);

// ---------------- tubes ----------------
/** clear PVC tubing with blood inside, a moving flow texture and a glass highlight */
export const Tube: React.FC<{d: string; r: number; blood: string; t: number; speed: number; op?: number; surge?: {u: number; a: number}[]}> = ({d, r, blood, t, speed, op = 1, surge = []}) => (
  <g opacity={op}>
    <path d={d} fill="none" stroke={INK} strokeWidth={2 * r + 3} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke="#CFE6EC" strokeWidth={2 * r} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={blood} strokeWidth={2 * r * 0.68} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={shade(blood, 0.4)} strokeWidth={2 * r * 0.68} strokeLinecap="butt" strokeDasharray={`${(r * 1.1).toFixed(1)} ${(r * 3.2).toFixed(1)}`} strokeDashoffset={(-speed * t).toFixed(1)} opacity={0.45} />
    <path d={d} fill="none" stroke={lit(blood, 0.45)} strokeWidth={r * 0.32} strokeLinecap="round" transform={`translate(${-r * 0.2},${-r * 0.22})`} opacity={0.8} />
    {surge.map((q, i) => (
      <path key={i} d={d} pathLength={1000} fill="none" stroke="#FF8A7A" strokeWidth={2 * r * 0.62} strokeLinecap="round" strokeDasharray={q.a > 0.5 || q.u < 0 ? "120 3000" : "70 3000"} strokeDashoffset={(-(1000 * (1 - q.u) - 35)).toFixed(1)} opacity={q.a} />
    ))}
    <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={r * 0.24} strokeLinecap="round" transform={`translate(${-r * 0.66},${-r * 0.5})`} opacity={0.8} />
  </g>
);

/** tube centre lines (world) */
export const AO_LINE = openPath(pts([[512, 300], [508, 258], [470, 232], [380, 228], [262, 262], [196, 340], [172, 470], [168, 760], [176, 980], [196, 1074], [240, 1110], [270, 1132]]), 1);
export const RET_LINE = openPath(pts([[700, 357], [728, 322], [790, 300], [868, 330], [910, 420], [920, 700], [912, 960], [890, 1070], [830, 1104], [770, 1112], [752, 1128]]), 1);

// ---------------- console ----------------
const panel = (id: string, c: string, x0: number, y0: number, x1: number, y1: number) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x0} y1={y0} x2={x1} y2={y1}>
    <stop offset="0" stopColor={lit(c, 0.35)} />
    <stop offset="0.35" stopColor={lit(c, 0.1)} />
    <stop offset="0.75" stopColor={c} />
    <stop offset="1" stopColor={shade(c, 0.35)} />
  </linearGradient>
);

export const Console: React.FC<{t: number}> = ({t}) => {
  const p = press(t);
  const pumpSq = 0.16 * p;
  // reservoir level breathes a little with the return flow
  const lvl = 1236 + 6 * Math.sin(t * 2.1) + 3 * noise1(t * 3, 4);
  return (
    <g>
      <defs>
        {panel('h07-body', '#C9D7DC', 160, 1060, 900, 1780)}
        {panel('h07-deck', '#DCE5E8', 160, 1030, 900, 1110)}
        <linearGradient id="h07-bay" x1="0" y1="1110" x2="0" y2="1440" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#173138" />
          <stop offset="1" stopColor="#21424B" />
        </linearGradient>
        <linearGradient id="h07-oxy" x1="0" y1="1150" x2="0" y2="1380" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E8323C" />
          <stop offset="0.55" stopColor="#B82738" />
          <stop offset="1" stopColor="#7C1C38" />
        </linearGradient>
        <linearGradient id="h07-glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.45} />
          <stop offset="0.25" stopColor="#FFFFFF" stopOpacity={0.08} />
          <stop offset="0.8" stopColor="#FFFFFF" stopOpacity={0.04} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.3} />
        </linearGradient>
        <linearGradient id="h07-res" x1="0" y1="1230" x2="0" y2="1395" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#962140" />
          <stop offset="1" stopColor="#5E1430" />
        </linearGradient>
        <radialGradient id="h07-pumpc">
          <stop offset="0" stopColor="#A6283F" />
          <stop offset="1" stopColor="#6B1530" />
        </radialGradient>
      </defs>
      {/* casters */}
      {[[232, 1790], [828, 1790], [560, 1772]].map(([x, y], i) => (
        <g key={i} opacity={i === 2 ? 0.7 : 1}>
          <rect x={x - 14} y={y - 50} width={28} height={40} rx={6} fill="#8FA3AA" stroke={INK} strokeWidth={2.4} />
          <circle cx={x} cy={y + 8} r={i === 2 ? 22 : 28} fill="#26343A" stroke={INK} strokeWidth={2.4} />
          <circle cx={x - 6} cy={y + 2} r={8} fill="#56666C" />
        </g>
      ))}
      {/* body */}
      <rect x={160} y={1060} width={740} height={700} rx={34} fill="url(#h07-body)" stroke={INK} strokeWidth={3} />
      <rect x={160} y={1690} width={740} height={70} rx={30} fill={shade('#C9D7DC', 0.3)} opacity={0.6} />
      <path d="M188,1580 L872,1580" stroke={shade('#C9D7DC', 0.35)} strokeWidth={3} />
      <rect x={470} y={1520} width={120} height={14} rx={7} fill={shade('#C9D7DC', 0.3)} stroke={INK} strokeWidth={2} />
      <rect x={470} y={1640} width={120} height={14} rx={7} fill={shade('#C9D7DC', 0.3)} stroke={INK} strokeWidth={2} />
      <rect x={172} y={1448} width={716} height={12} rx={6} fill="#2E8C8A" />
      {/* bay */}
      <rect x={196} y={1104} width={668} height={330} rx={22} fill="url(#h07-bay)" stroke={INK} strokeWidth={3} />
      <rect x={196} y={1104} width={668} height={26} rx={12} fill="#0B1B20" opacity={0.5} />
      {/* bay tubing (behind the devices' fronts) */}
      <Tube d={openPath(pts([[752, 1392], [748, 1416], [700, 1424], [610, 1418], [576, 1384], [568, 1336]]), 1)} r={9} blood={C.ven} t={t} speed={70} />
      <Tube d={openPath(pts([[432, 1336], [420, 1390], [380, 1416], [320, 1414], [290, 1396]]), 1)} r={9} blood={C.ven} t={t} speed={70} />
      {/* heater/cooler water lines */}
      <path d="M362,1210 C340,1210 330,1200 322,1196" fill="none" stroke="#7FC4D8" strokeWidth={5} strokeLinecap="round" />
      <path d="M362,1236 C340,1236 330,1246 322,1250" fill="none" stroke="#7FC4D8" strokeWidth={5} strokeLinecap="round" />
      {/* oxygenator: clear housing, hollow-fibre bundle turning venous blood bright red */}
      <rect x={232} y={1140} width={92} height={250} rx={16} fill="url(#h07-oxy)" stroke={INK} strokeWidth={3} />
      <g stroke="#FFB0A4" strokeWidth={1.4} opacity={0.35}>
        {Array.from({length: 9}, (_, i) => (
          <path key={i} d={`M${244 + i * 9},1162 L${244 + i * 9},1368`} />
        ))}
      </g>
      <g opacity={0.5}>
        {Array.from({length: 7}, (_, i) => {
          const y = 1370 - (((t * 46 + i * 31) % 210));
          return <ellipse key={i} cx={252 + ((i * 23) % 60)} cy={y} rx={4} ry={2.6} fill="#FF8C7E" />;
        })}
      </g>
      <rect x={232} y={1140} width={92} height={250} rx={16} fill="url(#h07-glass)" />
      <rect x={224} y={1128} width={108} height={26} rx={9} fill="#E8EEF0" stroke={INK} strokeWidth={2.6} />
      <rect x={224} y={1376} width={108} height={26} rx={9} fill="#E8EEF0" stroke={INK} strokeWidth={2.6} />
      {/* gas line to the oxygenator */}
      <path d="M232,1300 C210,1300 214,1340 214,1420" fill="none" stroke="#BFE0E8" strokeWidth={5} strokeLinecap="round" opacity={0.9} />
      {/* heater */}
      <rect x={358} y={1176} width={76} height={92} rx={10} fill="#E3EAEC" stroke={INK} strokeWidth={2.6} />
      {Array.from({length: 5}, (_, i) => (
        <rect key={i} x={368} y={1188 + i * 13} width={42} height={6} rx={3} fill="#B7C5CA" />
      ))}
      <circle cx={420} cy={1252} r={6} fill="#FFB54A" opacity={0.75 + 0.25 * Math.sin(t * 5)} />
      <circle cx={420} cy={1252} r={12} fill="#FFB54A" opacity={0.18} />
      {/* pulsatile pump */}
      <rect x={440} y={1168} width={150} height={190} rx={20} fill="#E6ECEE" stroke={INK} strokeWidth={3} />
      <circle cx={515} cy={1256} r={58} fill="#1C343B" stroke={INK} strokeWidth={2.6} />
      <ellipse cx={515} cy={1256 + 26 * pumpSq} rx={46 * (1 + 0.08 * pumpSq)} ry={46 * (1 - pumpSq)} fill="url(#h07-pumpc)" stroke="#4A0F22" strokeWidth={2} />
      <ellipse cx={500} cy={1238 + 26 * pumpSq} rx={14} ry={8 * (1 - pumpSq)} fill="#E36A78" opacity={0.6} />
      <rect x={488} y={1186 + 40 * pumpSq} width={54} height={10} rx={4} fill="#9FB0B6" stroke={INK} strokeWidth={2} />
      <rect x={511} y={1168} width={8} height={20 + 40 * pumpSq} fill="#9FB0B6" stroke={INK} strokeWidth={1.6} />
      <circle cx={515} cy={1256} r={58} fill="url(#h07-glass)" />
      <rect x={456} y={1330} width={40} height={10} rx={5} fill="#2E8C8A" />
      <circle cx={570} cy={1335} r={5} fill="#6CF2A0" opacity={0.5 + 0.5 * clamp(p)} />
      {/* reservoir */}
      <rect x={690} y={1136} width={124} height={262} rx={18} fill="#BFD9E0" opacity={0.25} stroke={INK} strokeWidth={3} />
      <path d={`M694,${lvl.toFixed(1)} Q722,${(lvl - 5 * Math.sin(t * 3)).toFixed(1)} 752,${lvl.toFixed(1)} T810,${lvl.toFixed(1)} L810,1380 Q810,1394 796,1394 L708,1394 Q694,1394 694,1380 Z`} fill="url(#h07-res)" />
      <path d={`M694,${lvl.toFixed(1)} Q722,${(lvl - 5 * Math.sin(t * 3)).toFixed(1)} 752,${lvl.toFixed(1)} T810,${lvl.toFixed(1)}`} fill="none" stroke="#C0466A" strokeWidth={3} />
      <g stroke="#E8F4F7" strokeWidth={2} opacity={0.5}>
        {[1180, 1220, 1260, 1300, 1340].map((y) => (
          <path key={y} d={`M700,${y} L716,${y}`} />
        ))}
      </g>
      <rect x={690} y={1136} width={124} height={262} rx={18} fill="url(#h07-glass)" />
      <rect x={720} y={1122} width={64} height={22} rx={8} fill="#E8EEF0" stroke={INK} strokeWidth={2.4} />
      {/* pump -> oxygenator and oxygenator -> arterial line stubs */}
      {/* deck the chamber sits on */}
      <rect x={150} y={1032} width={760} height={80} rx={24} fill="url(#h07-deck)" stroke={INK} strokeWidth={3} />
      <rect x={176} y={1088} width={708} height={10} rx={5} fill="#2E8C8A" opacity={0.9} />
    </g>
  );
};

// ---------------- organ chamber ----------------
const DOME = 'M222,1036 L222,600 C222,430 330,322 530,322 C730,322 838,430 838,600 L838,1036 Z';
export const DomeBack: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="h07-domein" x1="0" y1="322" x2="0" y2="1036" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#5E9AA6" stopOpacity={0.2} />
        <stop offset="1" stopColor="#2E5E68" stopOpacity={0.35} />
      </linearGradient>
      <radialGradient id="h07-warm" gradientUnits="userSpaceOnUse" cx={520} cy={760} r={380}>
        <stop offset="0" stopColor="#FFB08A" stopOpacity={0.22} />
        <stop offset="1" stopColor="#FFB08A" stopOpacity={0} />
      </radialGradient>
    </defs>
    <path d={DOME} fill="url(#h07-domein)" />
    <path d={DOME} fill="url(#h07-warm)" />
    {/* chamber floor (drip basin) */}
    <ellipse cx={530} cy={1030} rx={300} ry={40} fill="#A9C3CA" stroke={INK} strokeWidth={2.4} />
    <ellipse cx={530} cy={1026} rx={270} ry={30} fill="#C8DADF" />
    <ellipse cx={530} cy={1024} rx={40} ry={9} fill="#7E98A0" />
    {/* sling posts */}
    {[300, 762].map((x) => (
      <g key={x}>
        <rect x={x - 8} y={790} width={16} height={240} rx={6} fill="#DDE6E9" stroke={INK} strokeWidth={2.4} />
        <circle cx={x} cy={792} r={13} fill="#EEF3F4" stroke={INK} strokeWidth={2.4} />
      </g>
    ))}
  </g>
);

/** soft mesh sling the heart rests in; it gives with each beat (apex = world position of the apex) */
export const Sling: React.FC<{apex: {x: number; y: number}; front: boolean}> = ({apex, front}) => {
  const sag = apex.y + 30;
  const L = {x: 300, y: 800}, R = {x: 762, y: 800};
  // back sheet: from the post line, sagging under the heart
  const top = `M${L.x},${L.y} C${L.x + 60},${sag - 120} ${apex.x - 260},${sag - 40} ${apex.x - 80},${sag - 30} C${apex.x + 40},${sag - 24} ${R.x - 40},${sag - 140} ${R.x},${R.y}`;
  const bot = `C${R.x - 20},${sag - 60} ${apex.x + 60},${sag + 26} ${apex.x - 80},${sag + 26} C${apex.x - 250},${sag + 26} ${L.x + 30},${sag - 40} ${L.x},${L.y + 20}Z`;
  if (!front)
    return (
      <g>
        <defs>
          <pattern id="h07-mesh" patternUnits="userSpaceOnUse" width={14} height={14} patternTransform="rotate(45)">
            <path d="M0,0 L0,14 M0,0 L14,0" stroke="#7F9AA2" strokeWidth={1.4} opacity={0.55} />
          </pattern>
        </defs>
        <path d={`${top} L${R.x},${R.y + 20} ${bot}`} fill="#B5CCD2" opacity={0.75} stroke={INK} strokeWidth={2.2} />
        <path d={`${top} L${R.x},${R.y + 20} ${bot}`} fill="url(#h07-mesh)" />
        <ellipse cx={apex.x - 80} cy={sag - 14} rx={170} ry={20} fill="#2A1A22" opacity={0.28} />
      </g>
    );
  // front lip: covers the lowest part of the heart, translucent
  const ft = `M${L.x + 6},${L.y + 40} C${L.x + 60},${sag - 50} ${apex.x - 250},${sag - 4} ${apex.x - 80},${sag - 2} C${apex.x + 40},${sag} ${R.x - 40},${sag - 80} ${R.x - 6},${R.y + 40}`;
  const fb = `L${R.x - 4},${R.y + 60} C${R.x - 30},${sag - 30} ${apex.x + 60},${sag + 30} ${apex.x - 80},${sag + 30} C${apex.x - 250},${sag + 30} ${L.x + 40},${sag - 20} ${L.x + 4},${L.y + 62}Z`;
  return (
    <g>
      <path d={`${ft} ${fb}`} fill="#D3E2E6" opacity={0.6} stroke={INK} strokeWidth={2.2} />
      <path d={`${ft} ${fb}`} fill="url(#h07-mesh)" opacity={0.8} />
      <path d={ft} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.6} />
    </g>
  );
};

/** front glass of the dome: transparent with edge and streak reflections */
export const DomeFront: React.FC<{t: number}> = ({t}) => (
  <g>
    <defs>
      <linearGradient id="h07-domeedge" x1="222" y1="0" x2="838" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#E6FBFF" stopOpacity={0.32} />
        <stop offset="0.12" stopColor="#E6FBFF" stopOpacity={0.05} />
        <stop offset="0.85" stopColor="#E6FBFF" stopOpacity={0.03} />
        <stop offset="1" stopColor="#E6FBFF" stopOpacity={0.22} />
      </linearGradient>
    </defs>
    <path d={DOME} fill="url(#h07-domeedge)" stroke={INK} strokeWidth={3} />
    <path d="M240,1000 L240,604 C240,450 340,344 520,340" fill="none" stroke="#F4FEFF" strokeWidth={5} opacity={0.55} strokeLinecap="round" />
    <path d="M818,640 C818,520 780,440 700,390" fill="none" stroke="#F4FEFF" strokeWidth={3} opacity={0.35} strokeLinecap="round" />
    <path d="M290,420 L410,350" stroke="#FFFFFF" strokeWidth={22} opacity={0.08} strokeLinecap="round" />
    <path d="M262,700 L262,960" stroke="#FFFFFF" strokeWidth={14} opacity={0.12} strokeLinecap="round" />
    <path d="M808,700 L808,940" stroke="#FFFFFF" strokeWidth={8} opacity={0.1} strokeLinecap="round" />
    {/* base ring */}
    <rect x={204} y={1010} width={652} height={34} rx={14} fill="#E7EEF0" stroke={INK} strokeWidth={2.6} />
    <rect x={214} y={1016} width={632} height={7} rx={3} fill="#FFFFFF" opacity={0.7} />
    {/* small temperature indicator: warm (no text) */}
    <rect x={770} y={1018} width={52} height={18} rx={6} fill="#1C343B" stroke={INK} strokeWidth={2} />
    <rect x={776} y={1023} width={28} height={8} rx={3} fill="#FFB54A" opacity={0.85 + 0.15 * Math.sin(t * 2)} />
  </g>
);

/** lid ports where the connectors pass through the dome */
export const Ports: React.FC = () => (
  <g>
    <rect x={486} y={292} width={52} height={50} rx={10} fill="#E9EFF1" stroke={INK} strokeWidth={2.6} />
    <rect x={480} y={318} width={64} height={12} rx={5} fill="#BCCBD0" stroke={INK} strokeWidth={2} />
    <g transform="rotate(38 700 357)">
      <rect x={676} y={334} width={48} height={42} rx={9} fill="#E9EFF1" stroke={INK} strokeWidth={2.6} />
      <rect x={670} y={358} width={60} height={11} rx={5} fill="#BCCBD0" stroke={INK} strokeWidth={2} />
    </g>
  </g>
);

// ---------------- monitor ----------------
const ecg = (tau: number) => {
  let y = 0;
  for (const b of BEATS) {
    const x = tau - (b - 0.04);
    if (x < -0.3 || x > 0.5) continue;
    y += 0.12 * Math.exp(-(((x + 0.17) / 0.03) ** 2));
    y -= 0.12 * Math.exp(-(((x + 0.025) / 0.008) ** 2));
    y += 1.0 * Math.exp(-((x / 0.01) ** 2));
    y -= 0.25 * Math.exp(-(((x - 0.025) / 0.01) ** 2));
    y += 0.22 * Math.exp(-(((x - 0.24) / 0.05) ** 2));
  }
  return y;
};
export const Monitor: React.FC<{t: number}> = ({t}) => {
  const X0 = 72, Y0 = 132, Wd = 268, Hd = 176;
  const span = 2.6;
  const trace = (f: (tau: number) => number, base: number, amp: number) => {
    const out: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const u = i / 120;
      const tau = t - span * (1 - u);
      out.push(`${(X0 + 14 + u * (Wd - 28)).toFixed(1)},${(Y0 + base - amp * f(tau)).toFixed(1)}`);
    }
    return 'M' + out.join(' L');
  };
  const tip = (f: (tau: number) => number, base: number, amp: number) => ({x: X0 + Wd - 14, y: Y0 + base - amp * f(t)});
  const e = tip(ecg, 56, 40);
  return (
    <g>
      {/* pole and arm */}
      <rect x={112} y={300} width={14} height={1420} fill="#9FB2B8" stroke={INK} strokeWidth={2.4} />
      <rect x={104} y={1170} width={62} height={26} rx={6} fill="#C9D7DC" stroke={INK} strokeWidth={2.4} />
      <rect x={96} y={290} width={46} height={30} rx={8} fill="#C9D7DC" stroke={INK} strokeWidth={2.4} />
      {/* screen */}
      <rect x={X0 - 14} y={Y0 - 14} width={Wd + 28} height={Hd + 28} rx={18} fill="#DCE5E8" stroke={INK} strokeWidth={3} />
      <rect x={X0} y={Y0} width={Wd} height={Hd} rx={8} fill="#0A1A1F" />
      <g stroke="#1E3A40" strokeWidth={1}>
        {[0.25, 0.5, 0.75].map((k) => (
          <path key={k} d={`M${X0 + 8},${Y0 + Hd * k} L${X0 + Wd - 8},${Y0 + Hd * k}`} />
        ))}
      </g>
      <path d={trace(ecg, 56, 40)} fill="none" stroke="#6CF2A0" strokeWidth={3} strokeLinejoin="round" />
      <path d={trace((x) => press(x), 112, 26)} fill="none" stroke="#FF6A6A" strokeWidth={3} strokeLinejoin="round" />
      <path d={trace((x) => coronaryFlow(x), 160, 22)} fill="none" stroke="#F2D26C" strokeWidth={2.6} strokeLinejoin="round" />
      <circle cx={e.x} cy={e.y} r={5} fill="#D9FFE8" />
      <circle cx={e.x} cy={e.y} r={11} fill="#6CF2A0" opacity={0.25} />
      <rect x={X0} y={Y0} width={Wd} height={Hd * 0.45} rx={8} fill="#FFFFFF" opacity={0.05} />
    </g>
  );
};
