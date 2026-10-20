// V4 café exterior: a small corner café on a quiet street, in the crew's finish (soft gradients, thin muted contours).
// Recognizable frontage (sign, striped awning, big window with the warm interior behind the glass, door with an
// open sign, planter, chalkboard) with depth: sky, trees and far buildings, the façade, the sidewalk, the curb and the
// road. World units = screen px at camera z = 1; people stand on the sidewalk at y = EXT_FLOOR.
import React from 'react';
import {lit, shade} from '../../lib/color';
import {INK} from '../../lib/ink';
import {fmt} from '../../lib/math';
import {Glow, Lin, SoftShadow} from '../../lib/shade';
import {rr} from './Props';

export const EXT_FLOOR = 1340;
const OL = {stroke: INK, strokeOpacity: 0.5, strokeWidth: 3, strokeLinejoin: 'round' as const};

const Tree: React.FC<{x: number; y: number; s: number; c?: string}> = ({x, y, s, c = '#7FB07A'}) => (
  <g>
    <path d={`M${x - 14 * s},${y} L${x - 10 * s},${y - 190 * s} L${x + 10 * s},${y - 190 * s} L${x + 14 * s},${y} Z`} fill="#9B6B47" {...OL} />
    <circle cx={x} cy={y - 270 * s} r={130 * s} fill={c} {...OL} />
    <circle cx={x - 90 * s} cy={y - 220 * s} r={90 * s} fill={lit(c, 0.1)} {...OL} />
    <circle cx={x + 96 * s} cy={y - 230 * s} r={96 * s} fill={shade(c, 0.1)} {...OL} />
    <circle cx={x - 40 * s} cy={y - 320 * s} r={52 * s} fill="#FFFFFF" opacity={0.12} />
  </g>
);

export const ExteriorBack: React.FC<{f: number}> = ({f}) => {
  const drift = Math.sin(f * 0.02) * 6;
  return (
    <g>
      {/* sky */}
      <Lin id="ex-sky" d="M-200,-200 H1300 V900 H-200 Z" from={{x: 0, y: 0}} to={{x: 0, y: 700}} stops={[[0, '#9ED4EE'], [0.7, '#CDEBF7'], [1, '#EAF6F0']]} />
      {[[140, 150, 1], [760, 100, 1.2], [980, 260, 0.8]].map(([x, y, k], i) => (
        <g key={i} transform={`translate(${fmt(x + drift * k)} ${y}) scale(${k})`} opacity={0.9}>
          <ellipse cx={0} cy={0} rx={120} ry={34} fill="#FFFFFF" />
          <ellipse cx={-50} cy={-18} rx={62} ry={30} fill="#FFFFFF" />
          <ellipse cx={34} cy={-26} rx={70} ry={34} fill="#FFFFFF" />
        </g>
      ))}
      {/* far buildings */}
      <g opacity={0.95}>
        <path d={rr(-40, 330, 260, 540, 6)} fill="#C8D6E2" {...OL} strokeOpacity={0.3} />
        <path d={rr(200, 280, 220, 590, 6)} fill="#D9C9D6" {...OL} strokeOpacity={0.3} />
        <path d={rr(760, 300, 340, 570, 6)} fill="#C6D9D0" {...OL} strokeOpacity={0.3} />
        {[0, 1, 2, 3].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={10 + c * 100} y={380 + r * 110} width={60} height={70} rx={6} fill="#EAF4FA" opacity={0.85} />))}
        {[0, 1, 2, 3].map((r) => [0, 1].map((c) => <rect key={`b${r}${c}`} x={240 + c * 90} y={340 + r * 110} width={56} height={70} rx={6} fill="#F3ECF2" opacity={0.85} />))}
      </g>
      <Tree x={90} y={900} s={0.9} />
      <Tree x={1010} y={900} s={0.8} c="#8DBF84" />

      {/* the café: a two-storey front with a flat cornice */}
      <g>
        <Lin id="ex-wall" d={rr(30, 430, 1020, 830, 8)} from={{x: 0, y: 430}} to={{x: 0, y: 1260}} stops={[[0, '#F4EFE3'], [0.5, '#F2E8D4'], [1, '#E2D3B8']]} />
        <path d={rr(30, 430, 1020, 830, 8)} fill="none" {...OL} strokeWidth={4} />
        {/* cornice and sign band */}
        <path d={rr(10, 404, 1060, 54, 8)} fill="#8D5B3A" {...OL} strokeWidth={4} />
        <path d={rr(10, 404, 1060, 14, 8)} fill="#FFFFFF" opacity={0.25} />
        {/* the sign */}
        <g>
          <path d={rr(330, 480, 420, 130, 22)} fill="#EF6B55" {...OL} strokeWidth={5} />
          <path d={rr(342, 492, 396, 106, 14)} fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={4} />
          <text x={540} y={578} textAnchor="middle" fontFamily="'Fredoka Variable', sans-serif" fontWeight={700} fontSize={104} fill="#FFFFFF" letterSpacing={8} stroke={INK} strokeWidth={0} >CAFÉ</text>
          <path d="M470,480 V440 M610,480 V440" stroke={INK} strokeOpacity={0.5} strokeWidth={4} />
        </g>
        {/* upper windows (second storey) */}
        {[110, 800].map((x, i) => (
          <g key={i}>
            <path d={rr(x, 490, 170, 130, 10)} fill="#FFFFFF" {...OL} />
            <path d={rr(x + 12, 502, 146, 106, 6)} fill="#CDEBF7" />
            <path d={`M${x + 85},502 V608 M${x + 12},555 H${x + 158}`} stroke="#FFFFFF" strokeWidth={8} />
            <path d={`M${x + 12},502 H${x + 158} V540 Q${x + 85},520 ${x + 12},540 Z`} fill="#FFFFFF" opacity={0.25} />
          </g>
        ))}
        {/* awning: coral/cream stripes with a scalloped edge */}
        <g>
          <path d="M60,640 L1020,640 L1050,770 L30,770 Z" fill="#F4EFE3" {...OL} strokeWidth={4} />
          {Array.from({length: 12}, (_, i) => {
            const x0 = 30 + i * 85;
            return <path key={i} d={`M${x0 + (i * 30) / 12},640 L${x0 + 85 + ((i + 1) * 30) / 12 - 30 * 0},640 L${x0 + 85 + 0},770 L${x0},770 Z`} fill={i % 2 ? '#F4EFE3' : '#EF6B55'} opacity={i % 2 ? 0 : 1} />;
          })}
          {Array.from({length: 12}, (_, i) => {
            const x0 = 30 + i * 85;
            return <path key={`s${i}`} d={`M${x0},770 Q${x0 + 42},812 ${x0 + 85},770`} fill={i % 2 ? '#F4EFE3' : '#EF6B55'} {...OL} strokeWidth={3} />;
          })}
          <path d="M60,640 L1020,640" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={8} />
          <path d="M30,770 L1050,770" stroke={INK} strokeOpacity={0.12} strokeWidth={10} />
        </g>
        {/* the big window with the warm interior behind the glass */}
        <g>
          <path d={rr(380, 830, 560, 330, 14)} fill="#FFFFFF" {...OL} strokeWidth={4} />
          <Lin id="ex-glass" d={rr(396, 846, 528, 298, 8)} from={{x: 0, y: 846}} to={{x: 0, y: 1144}} stops={[[0, '#FFE9B8'], [1, '#F2C98B']]} />
          {/* shelves and cups, a lamp, a counter, seen inside */}
          <path d={rr(412, 930, 220, 10, 3)} fill="#D8A877" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={rr(424 + i * 40, 900, 26, 28, 5)} fill={i % 2 ? '#EF6B55' : '#FFFFFF'} stroke={INK} strokeOpacity={0.4} strokeWidth={2} />
          ))}
          <path d={rr(660, 1040, 250, 104, 8)} fill="#8D5B3A" stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
          <path d={rr(650, 1024, 270, 24, 8)} fill="#EFE3CF" stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
          <path d={rr(700, 960, 90, 66, 10)} fill="#C9D3DA" stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
          <path d={rr(700, 960, 90, 26, 10)} fill="#EF6B55" />
          <path d="M520,846 V880" stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
          <path d="M488,930 Q520,880 552,930 Z" fill="#FFC744" stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
          <Glow id="ex-warm" c={{x: 520, y: 940}} r={120} color="#FFE7A0" alpha={0.6} />
          {/* a reflection of the street on the glass */}
          <path d="M396,846 L560,846 L440,1144 L396,1144 Z" fill="#FFFFFF" opacity={0.22} />
          <path d="M600,846 L650,846 L530,1144 L490,1144 Z" fill="#FFFFFF" opacity={0.14} />
          <path d="M660,846 V1144" stroke="#FFFFFF" strokeWidth={10} />
          <path d="M660,846 V1144" stroke={INK} strokeOpacity={0.3} strokeWidth={2} />
          {/* small open sign sticker */}
          <path d={rr(800, 868, 100, 44, 22)} fill="#2563EB" stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
          <text x={850} y={900} textAnchor="middle" fontFamily="'Fredoka Variable', sans-serif" fontWeight={700} fontSize={28} fill="#FFFFFF" letterSpacing={2}>OPEN</text>
        </g>
        {/* planter box under the window with flowers */}
        <g>
          <path d={rr(370, 1150, 580, 78, 10)} fill="#B9825A" {...OL} strokeWidth={4} />
          <path d={rr(370, 1150, 580, 20, 10)} fill="#FFFFFF" opacity={0.2} />
          {Array.from({length: 13}, (_, i) => {
            const x = 400 + i * 44;
            const c = ['#EF6B55', '#FFC744', '#FFFFFF', '#F2A5C0'][i % 4];
            return (
              <g key={i}>
                <path d={`M${x},1152 q${(i % 2 ? 1 : -1) * 6},-26 0,-40`} stroke="#5F9A5C" strokeWidth={5} fill="none" />
                <circle cx={x} cy={1106 + (i % 3) * 6} r={13} fill={c} {...OL} strokeWidth={2.4} />
                <circle cx={x} cy={1106 + (i % 3) * 6} r={4} fill="#FFC744" />
              </g>
            );
          })}
        </g>
        {/* the door (left): wood frame, glass panel, handle, open sign */}
        <g>
          <path d={rr(100, 790, 230, 470, 12)} fill="#8D5B3A" {...OL} strokeWidth={5} />
          <path d={rr(122, 816, 186, 300, 8)} fill="#FFE9B8" stroke={INK} strokeOpacity={0.4} strokeWidth={3} />
          <path d={rr(122, 816, 186, 300, 8)} fill="#FFFFFF" opacity={0.18} />
          <path d="M122,816 L230,816 L150,1116 L122,1116 Z" fill="#FFFFFF" opacity={0.24} />
          <path d={rr(136, 1146, 158, 84, 8)} fill="none" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={5} />
          <circle cx={296} cy={1060} r={11} fill="#FFD36B" stroke={INK} strokeOpacity={0.6} strokeWidth={3} />
          <path d={rr(172, 860, 90, 50, 8)} fill="#FFC744" stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
          <text x={217} y={894} textAnchor="middle" fontFamily="'Fredoka Variable', sans-serif" fontWeight={700} fontSize={26} fill={INK}>OPEN</text>
          <path d="M217,816 L217,860" stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
          {/* a bell over the door */}
          <path d="M296,780 q12,-8 24,0 q-2,16 -12,16 q-10,0 -12,-16 Z" fill="#FFC744" stroke={INK} strokeOpacity={0.5} strokeWidth={3} />
        </g>
        {/* base course */}
        <rect x={30} y={1228} width={1020} height={34} fill="#D2BFA0" opacity={0.0} />
      </g>
    </g>
  );
};

export const ExteriorFront: React.FC<{f: number}> = ({f}) => {
  void f;
  return (
    <g>
      {/* sidewalk: pavers receding to the curb */}
      <Lin id="ex-walk" d="M-200,1262 H1300 V1500 H-200 Z" from={{x: 0, y: 1262}} to={{x: 0, y: 1500}} stops={[[0, '#CFD5DA'], [1, '#E4E8EA']]} />
      <rect x={-200} y={1262} width={1500} height={14} fill="#B2BAC1" />
      {[1300, 1360, 1430].map((y, i) => (
        <path key={i} d={`M-200,${y} H1300`} stroke="#A8B1B8" strokeOpacity={0.5} strokeWidth={3} />
      ))}
      {Array.from({length: 16}, (_, i) => {
        const x = -200 + i * 100;
        return <path key={i} d={`M${x},1276 L${540 + (x - 540) * 1.35},1500`} stroke="#A8B1B8" strokeOpacity={0.4} strokeWidth={3} />;
      })}
      {/* curb and road */}
      <path d="M-200,1500 H1300 V1536 H-200 Z" fill="#BCC4CB" stroke={INK} strokeOpacity={0.35} strokeWidth={3} />
      <Lin id="ex-road" d="M-200,1536 H1300 V2200 H-200 Z" from={{x: 0, y: 1536}} to={{x: 0, y: 1920}} stops={[[0, '#6F7C88'], [1, '#56626E']]} />
      <path d="M-200,1700 H1300" stroke="#F4EFE3" strokeOpacity={0.55} strokeWidth={10} strokeDasharray="90 70" />
      {/* the light from the upper left falls on the sidewalk */}
      <path d="M-100,1270 L520,1270 L760,1500 L-300,1500 Z" fill="#FFF3D2" opacity={0.18} />
      <SoftShadow id="ex-sh" c={{x: 540, y: EXT_FLOOR + 14}} rx={520} ry={30} alpha={0.12} />
      {/* A-frame chalkboard sign and a lamp post */}
      <g>
        <path d="M900,1340 L938,1090 L1000,1090 L1040,1340 Z" fill="#3C4B52" stroke={INK} strokeOpacity={0.6} strokeWidth={4} />
        <path d="M918,1320 L950,1110 L988,1110 L1022,1320 Z" fill="#2F3D43" />
        <text x={969} y={1176} textAnchor="middle" fontFamily="'Fredoka Variable', sans-serif" fontWeight={600} fontSize={40} fill="#F4EFE3" opacity={0.9}>HOT</text>
        <path d="M940,1210 H998 M938,1244 H1002" stroke="#F4EFE3" strokeOpacity={0.5} strokeWidth={5} strokeLinecap="round" />
        <path d="M935,1340 L918,1380 M1005,1340 L1022,1380" stroke={INK} strokeOpacity={0.5} strokeWidth={5} strokeLinecap="round" />
      </g>
    </g>
  );
};
void fmt;
