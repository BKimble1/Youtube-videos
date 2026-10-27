// V2 (second pass) drawings: a stiff "traditional" robot face for the contrast, the face in side section (motor ->
// linkage -> skin -> lip), a simple humanoid body for the future scenarios, the learned mouth-shape map for the
// audio-to-motion sequence, and the extra settings (home, station concourse, kitchen, street, stage, office).
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {clamp, fmt, lerp} from '../dc/math';
import {Robot, ROBOT_NEUTRAL, RobotState, RPAL} from '../art/Robot';
import {RVIS, Vis} from '../lib/visemes';
import {EP} from './env';

type V = {x: number; y: number};
const P = (p: V) => `${fmt(p.x)},${fmt(p.y)}`;

// ------------------------------------------------------------------ a traditional, stiff robot face (illustrative)
/** a rigid metal face: fixed lamp eyes, a slot mouth with a hinged jaw plate and two rigid corner bars.
 *  grin 0..1 lifts only the corner bars; jaw 0..1 drops the plate; nothing else on the face moves. */
export const OldBot: React.FC<{x: number; y: number; s?: number; grin?: number; jaw?: number; eyeGlow?: number}> = ({x, y, s = 1, grin = 0, jaw = 0, eyeGlow = 1}) => {
  const ga = -28 * clamp(grin);
  const jd = 34 * clamp(jaw);
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
      {/* neck post and collar */}
      <rect x={-34} y={150} width={68} height={160} fill="#6B737B" stroke={INK} strokeWidth={5} />
      <rect x={-90} y={290} width={180} height={50} rx={10} fill="#4A5158" stroke={INK} strokeWidth={5} />
      {/* head box */}
      <rect x={-150} y={-170} width={300} height={330} rx={46} fill="#B9C0C6" stroke={INK} strokeWidth={6} />
      <rect x={-130} y={-150} width={260} height={30} rx={14} fill="#D3D8DC" opacity={0.8} />
      {[-120, 120].map((sx) => [-120, 130].map((sy) => <circle key={`${sx}${sy}`} cx={sx} cy={sy} r={7} fill="#8A929A" stroke={INK} strokeWidth={2.5} />))}
      {/* ear bolts */}
      <rect x={-172} y={-30} width={24} height={70} rx={8} fill="#8A929A" stroke={INK} strokeWidth={5} />
      <rect x={148} y={-30} width={24} height={70} rx={8} fill="#8A929A" stroke={INK} strokeWidth={5} />
      {/* fixed lamp eyes */}
      {[-62, 62].map((ex) => (
        <g key={ex}>
          <circle cx={ex} cy={-50} r={40} fill="#2B3138" stroke={INK} strokeWidth={6} />
          <circle cx={ex} cy={-50} r={22} fill={mix('#5A1F1F', '#FF5A4A', eyeGlow)} />
          <circle cx={ex} cy={-50} r={34} fill="#FF5A4A" opacity={0.18 * eyeGlow} />
          <circle cx={ex - 8} cy={-58} r={6} fill="#FFFFFF" opacity={0.7} />
        </g>
      ))}
      {/* mouth: dark slot, hinged jaw plate, rigid corner bars */}
      <rect x={-90} y={50} width={180} height={fmt(18 + jd)} rx={6} fill="#1E2328" stroke={INK} strokeWidth={5} />
      <rect x={-90} y={fmt(68 + jd)} width={180} height={34} rx={6} fill="#9AA2A9" stroke={INK} strokeWidth={5} />
      {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={-60 + i * 30} y1={fmt(72 + jd)} x2={-60 + i * 30} y2={fmt(98 + jd)} stroke={INK} strokeWidth={3} opacity={0.5} />)}
      <g transform={`rotate(${fmt(-ga)} -90 58)`}>
        <rect x={-130} y={50} width={44} height={14} rx={6} fill="#D3D8DC" stroke={INK} strokeWidth={4} />
      </g>
      <g transform={`rotate(${fmt(ga)} 90 58)`}>
        <rect x={86} y={50} width={44} height={14} rx={6} fill="#D3D8DC" stroke={INK} strokeWidth={4} />
      </g>
      <circle cx={-90} cy={58} r={6} fill="#4A5158" stroke={INK} strokeWidth={3} />
      <circle cx={90} cy={58} r={6} fill="#4A5158" stroke={INK} strokeWidth={3} />
    </g>
  );
};

// ------------------------------------------------------------------ the face in side section
/** The face in side section (facing screen-right): the shell and frame, the silicone skin as one band following the
 *  profile, two representative motors on the frame, each with a horn and a linkage to an anchor in the skin (one at
 *  the lip corner, one at the lower lip). The horn angles come from the same state as the face (smile, round,
 *  open), and the skin and lips are displaced around the anchors, so motor -> linkage -> skin -> lip is one chain.
 *  Illustrative: two motors of the 26, not the real layout. */
export const SideMech: React.FC<{id: string; x: number; y: number; s?: number; st: RobotState; hot?: number; skinK?: number}> = ({id, x, y, s = 1, st, hot = 1, skinK = 1}) => {
  const sm = clamp(st.smile), rd = clamp(st.round), op = clamp(st.open), pz = clamp(st.press);
  // lip motion (local units): the corner anchor goes back and up with the smile, forward with the rounding
  const fwd = 30 * rd - 10 * sm;
  const up = 22 * sm;
  const drop = 64 * op;
  // outer profile, top to bottom (the face looks right; x+ is forward)
  const prof: [number, number][] = [
    [40, -300], [118, -250], [150, -170], [152, -110], [168, -70], [200, -20], [206, 6], [176, 22], [172, 48],
    [184, 78], [190, 100], [186, 116], [182, 132], [190, 150], [184, 172], [160, 210], [118, 236], [60, 246],
  ];
  const disp = (px: number, py: number, depth: number) => {
    // the lip region (y 70-180) follows the two anchors with a gaussian falloff
    const gU = Math.exp(-((py - 100) ** 2) / (2 * 34 * 34));
    const gL = Math.exp(-((py - 150) ** 2) / (2 * 40 * 40));
    const below = clamp((py - 120) / 80);
    return {
      x: fwd * (gU + 0.8 * gL) * (0.7 + 0.3 * depth) - 4 * pz * gU,
      y: -up * gU * (0.8 + 0.2 * depth) + drop * (0.55 * gL + 0.9 * below) + 3 * pz * gU,
    };
  };
  const outer = prof.map(([px, py]) => {
    const d = disp(px, py, 1);
    return {x: px + d.x, y: py + d.y};
  });
  const T = 40;
  const inner = prof.map(([px, py]) => {
    const d = disp(px, py, 0.4);
    return {x: px - T + d.x, y: py + d.y};
  });
  const band = `M${outer.map(P).join(' L')} L${inner.slice().reverse().map(P).join(' L')} Z`;
  // anchors and motors
  const aU = {x: 150 + disp(150, 100, 0.5).x, y: 100 + disp(150, 100, 0.5).y};
  const aL = {x: 152 + disp(152, 152, 0.5).x, y: 152 + disp(152, 152, 0.5).y};
  const mU = {x: -20, y: 40}, mL = {x: -10, y: 170};
  const rU = 34, rL = 30;
  const angU = Math.atan2(aU.y - mU.y, aU.x - mU.x) - 0.6 + 0.9 * sm - 0.7 * rd;
  const angL = Math.atan2(aL.y - mL.y, aL.x - mL.x) + 0.5 + 0.9 * op;
  const tipU = {x: mU.x + rU * Math.cos(angU), y: mU.y + rU * Math.sin(angU)};
  const tipL = {x: mL.x + rL * Math.cos(angL), y: mL.y + rL * Math.sin(angL)};
  const hotU = hot * clamp(sm + rd), hotL = hot * clamp(op * 2);
  const Motor: React.FC<{m: V; tip: V; a: V; k: number}> = ({m, tip, a, k}) => (
    <g>
      <line x1={fmt(tip.x)} y1={fmt(tip.y)} x2={fmt(a.x)} y2={fmt(a.y)} stroke={k > 0.2 ? '#FFD18A' : '#D6DCEB'} strokeWidth={8} strokeLinecap="round" />
      <line x1={fmt(tip.x)} y1={fmt(tip.y)} x2={fmt(a.x)} y2={fmt(a.y)} stroke={INK} strokeWidth={2} opacity={0.5} />
      <rect x={m.x - 56} y={m.y - 36} width={112} height={72} rx={9} fill={k > 0.2 ? '#7D6B4E' : '#5E6782'} stroke={INK} strokeWidth={4} />
      <rect x={m.x - 50} y={m.y - 30} width={100} height={11} rx={4} fill="#FFFFFF" opacity={0.18} />
      <line x1={m.x} y1={m.y} x2={fmt(tip.x)} y2={fmt(tip.y)} stroke="#E8ECF4" strokeWidth={14} strokeLinecap="round" />
      <circle cx={m.x} cy={m.y} r={11} fill={k > 0.2 ? RPAL.led : '#C9D1E4'} stroke={INK} strokeWidth={3} />
      <circle cx={fmt(a.x)} cy={fmt(a.y)} r={10} fill={k > 0.2 ? RPAL.led : '#F2F5FF'} stroke={INK} strokeWidth={3} />
    </g>
  );
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
      <defs>
        <linearGradient id={`${id}-sk`} x1="80" y1="0" x2="210" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={RPAL.skinDeep} />
          <stop offset="1" stopColor={lit(RPAL.skin, 0.12)} />
        </linearGradient>
      </defs>
      {/* the shell behind (cranium, back of the head) */}
      <path d="M40,-300 C-120,-310 -250,-200 -250,-40 C-250,90 -190,190 -90,236 L60,246 C40,180 20,80 30,-60 C34,-160 40,-240 40,-300 Z" fill={RPAL.shell} stroke={INK} strokeWidth={6} />
      {/* the frame under the skin */}
      <path d="M40,-280 C20,-180 -4,-60 10,40 C20,120 40,190 70,236" fill="none" stroke="#7B87AA" strokeWidth={16} strokeLinecap="round" />
      <path d="M40,-280 C20,-180 -4,-60 10,40 C20,120 40,190 70,236" fill="none" stroke={INK} strokeWidth={2} opacity={0.4} />
      {/* the cavity between frame and skin */}
      <path d={`M40,-290 L${inner.map(P).join(' L')} L60,246 C40,180 20,80 30,-60 Z`} fill="#5A6688" opacity={0.9} />
      <Motor m={mU} tip={tipU} a={aU} k={hotU} />
      <Motor m={mL} tip={tipL} a={aL} k={hotL} />
      {/* the silicone skin, cut: a band with thickness */}
      <path d={band} fill={`url(#${id}-sk)`} stroke={INK} strokeWidth={5} strokeLinejoin="round" opacity={skinK} />
      {/* the lips: a fuller contour at the front of the band */}
      <path d={`M${P(outer[8])} Q${fmt(outer[9].x + 10)},${fmt(outer[9].y - 8)} ${P(outer[10])} Q${fmt(outer[11].x - 6)},${fmt(outer[11].y)} ${P(outer[12])} Q${fmt(outer[13].x + 10)},${fmt(outer[13].y + 4)} ${P(outer[14])}`} fill="none" stroke={RPAL.lipDeep} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      {/* the eye (camera) in section, a landmark */}
      <circle cx={130} cy={-120} r={22} fill={RPAL.sclera} stroke={INK} strokeWidth={4} />
      <circle cx={146} cy={-120} r={9} fill={RPAL.lens} />
    </g>
  );
};

// ------------------------------------------------------------------ a humanoid body for the future scenarios
/** shoulders, chest shell and arms under the research head (illustrative: the scenario is hypothetical) */
export const HumanoidBody: React.FC<{x: number; y: number; s?: number; armL?: number; armR?: number; tint?: string}> = ({x, y, s = 1, armL = 0, armR = 0, tint = RPAL.shell}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
    {/* arms: upper arm from the shoulder, swing in degrees */}
    {[{sx: -150, a: armL}, {sx: 150, a: armR}].map(({sx, a}, i) => (
      <g key={i} transform={`rotate(${fmt(a * (i ? -1 : 1))} ${sx} 40)`}>
        <rect x={sx - 34} y={30} width={68} height={260} rx={34} fill={shade(tint, 0.08)} stroke={INK} strokeWidth={6} />
        <circle cx={sx} cy={170} r={18} fill={RPAL.metal} stroke={INK} strokeWidth={4} />
      </g>
    ))}
    <path d="M-170,60 C-170,0 -110,-20 -60,-24 L60,-24 C110,-20 170,0 170,60 L150,420 L-150,420 Z" fill={tint} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-90,40 L90,40 L80,200 L-80,200 Z" fill={shade(tint, 0.12)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={0} cy={110} r={16} fill="#7CE0A0" opacity={0.8} />
    <rect x={-40} y={-60} width={80} height={50} rx={12} fill={RPAL.metal} stroke={INK} strokeWidth={5} />
  </g>
);

// ------------------------------------------------------------------ the learned mouth-shape map
const SLAB_VIS: Vis[] = ['B', 'A', 'N', 'E', 'O', 'W'];
/** the robot's own mouth shapes (learned at the mirror) as tiles; the tile for the current sound lights */
export const ShapeMap: React.FC<{id: string; x: number; y: number; w: number; h: number; cur: Vis; k?: number}> = ({id, x, y, w, h, cur, k = 1}) => {
  const tw = (w - 70) / 3, th = (h - 60) / 2;
  return (
    <g opacity={k}>
      <rect x={x} y={y} width={w} height={h} rx={30} fill="#1E2A3A" stroke={INK} strokeWidth={6} />
      <rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx={24} fill="none" stroke="#3E5674" strokeWidth={3} />
      {SLAB_VIS.map((v, i) => {
        const tx = x + 20 + (i % 3) * (tw + 15), ty = y + 20 + Math.floor(i / 3) * (th + 20);
        const on = v === cur || (cur === 'rest' && false);
        const st: RobotState = {...ROBOT_NEUTRAL, ...RVIS[v], yaw: 0};
        return (
          <g key={v}>
            <defs>
              <clipPath id={`${id}-t${i}`}>
                <rect x={tx} y={ty} width={tw} height={th} rx={14} />
              </clipPath>
            </defs>
            <rect x={tx} y={ty} width={tw} height={th} rx={14} fill="#C9D3D2" />
            <g clipPath={`url(#${id}-t${i})`}>
              <Robot id={`${id}-r${i}`} st={st} x={tx + tw / 2} y={ty + th * 0.55 - 72 * (th / 120)} s={th / 120} />
            </g>
            <rect x={tx} y={ty} width={tw} height={th} rx={14} fill="none" stroke={on ? '#F5A33B' : '#56636F'} strokeWidth={on ? 9 : 3} />
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ extra settings (layered planes, same palette)
const Veil: React.FC<{k?: number; color?: string}> = ({k = 0, color = '#F3EBDB'}) => (k > 0.001 ? <rect x={-6000} y={-6000} width={12000} height={12000} fill={color} opacity={k} /> : null);
const Win: React.FC<{x: number; y: number; w: number; h: number; sky?: string}> = ({x, y, w, h, sky = '#CFE3EA'}) => (
  <g>
    <rect x={x - 14} y={y - 14} width={w + 28} height={h + 28} rx={6} fill={EP.paper} stroke={INK} strokeWidth={3} />
    <rect x={x} y={y} width={w} height={h} fill={sky} stroke={INK} strokeWidth={2} />
    <path d={`M${x},${y + h * 0.75} L${x + w * 0.3},${y + h * 0.75} L${x + w * 0.3},${y + h * 0.6} L${x + w * 0.6},${y + h * 0.6} L${x + w * 0.6},${y + h * 0.7} L${x + w},${y + h * 0.7} L${x + w},${y + h} L${x},${y + h} Z`} fill="#B9CFD3" />
    <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={EP.paper} strokeWidth={10} />
  </g>
);
/** a living room: warm wall, window with evening light, a sofa back, a floor lamp, a picture */
export const HomeBack: React.FC<{veil?: number}> = ({veil = 0}) => (
  <g>
    <rect x={-1400} y={-800} width={4800} height={2400} fill="#E9D3B8" />
    <rect x={-1400} y={640} width={4800} height={1000} fill="#9C7656" />
    <rect x={-1400} y={632} width={4800} height={12} fill={EP.paper} />
    <Win x={1250} y={-260} w={520} h={540} sky="#F2C9A0" />
    <rect x={200} y={-200} width={300} height={220} rx={8} fill="#F4EBDD" stroke={INK} strokeWidth={4} />
    <path d="M230,0 L300,-110 L360,-40 L410,-90 L470,0 Z" fill="#8FB3AD" />
    <circle cx={420} cy={-150} r={22} fill="#F5C542" />
    {/* floor lamp */}
    <path d="M-120,640 L-120,-60" stroke="#2B333C" strokeWidth={10} />
    <path d="M-200,-60 L-40,-60 L-80,-180 L-160,-180 Z" fill="#F1E2C6" stroke={INK} strokeWidth={4} />
    <ellipse cx={-120} cy={-40} rx={260} ry={180} fill="#FFE9B8" opacity={0.25} />
    {/* sofa back */}
    <rect x={-300} y={420} width={1300} height={260} rx={60} fill="#5F8A86" stroke={INK} strokeWidth={5} />
    <rect x={-260} y={380} width={340} height={200} rx={40} fill="#6F9A96" stroke={INK} strokeWidth={4} />
    <rect x={620} y={380} width={340} height={200} rx={40} fill="#6F9A96" stroke={INK} strokeWidth={4} />
    <Veil k={veil} color="#EEDFC8" />
  </g>
);
/** a station concourse in an imagined near future: tall windows, columns, information kiosks each with a face */
export const StationBack: React.FC<{veil?: number; t?: number}> = ({veil = 0, t = 0}) => (
  <g>
    <rect x={-1400} y={-800} width={4800} height={2400} fill="#DCE6E6" />
    {Array.from({length: 7}, (_, i) => <rect key={i} x={-1200 + i * 640} y={-700} width={520} height={1200} fill="#EEF5F2" stroke="#9FB3B3" strokeWidth={6} />)}
    {Array.from({length: 7}, (_, i) => <rect key={`c${i}`} x={-1240 + i * 640} y={-760} width={60} height={1400} fill="#B8C4C4" stroke={INK} strokeWidth={3} />)}
    <rect x={-1400} y={560} width={4800} height={1200} fill="#A9B7B5" />
    {Array.from({length: 14}, (_, i) => <line key={`f${i}`} x1={-1400 + i * 360} y1={560} x2={-1600 + i * 420} y2={1700} stroke="#97A6A4" strokeWidth={4} />)}
    {/* overhead wayfinding: arrows and pictograms only */}
    <rect x={-200} y={-520} width={1200} height={120} rx={14} fill="#2B333C" />
    <path d="M-140,-460 l70,0 l0,-20 l34,30 l-34,30 l0,-20 l-70,0 Z" fill="#F5C542" />
    <circle cx={120} cy={-460} r={28} fill="#8FB3AD" />
    <rect x={260} y={-490} width={56} height={56} rx={10} fill="#E06A4F" />
    {/* people walking far off, as quiet silhouettes */}
    {[-900, -600, 1500, 2100].map((px, i) => {
      const dx = ((t * (i % 2 ? 40 : -30)) % 400);
      return (
        <g key={i} transform={`translate(${px + dx} ${520})`} opacity={0.35}>
          <circle cx={0} cy={-150} r={26} fill="#5F7473" />
          <rect x={-30} y={-122} width={60} height={110} rx={24} fill="#5F7473" />
        </g>
      );
    })}
    <Veil k={veil} color="#DCE6E6" />
  </g>
);
/** a kitchen corner (tiles, shelf, a kettle) */
export const KitchenBack: React.FC<{veil?: number}> = ({veil = 0}) => (
  <g>
    <rect x={-1400} y={-800} width={4800} height={2400} fill="#F3E8D2" />
    {Array.from({length: 22}, (_, c) => Array.from({length: 6}, (_, r) => <rect key={`${c}-${r}`} x={-800 + c * 160} y={100 + r * 90} width={156} height={86} fill={(c + r) % 2 ? '#DCEBE6' : '#E8F1EC'} />))}
    <rect x={-1400} y={640} width={4800} height={1000} fill="#C98F57" />
    <rect x={-1400} y={630} width={4800} height={14} fill="#DDA66B" />
    <rect x={600} y={-160} width={700} height={20} fill="#9A6A3E" stroke={INK} strokeWidth={3} />
    {[640, 760, 880, 1040].map((sx, i) => <rect key={i} x={sx} y={-260 + (i % 2) * 20} width={80} height={100 - (i % 2) * 20} rx={10} fill={['#E06A4F', '#F5C542', '#8FB3AD', '#5E8CA8'][i]} stroke={INK} strokeWidth={3} />)}
    <Veil k={veil} color="#F3E8D2" />
  </g>
);
/** a street: shopfronts, an awning, sky */
export const StreetBack: React.FC<{veil?: number}> = ({veil = 0}) => (
  <g>
    <rect x={-1400} y={-800} width={4800} height={2400} fill="#CFE3EA" />
    <rect x={-1400} y={-300} width={1400} height={1100} fill="#D9B48A" stroke={INK} strokeWidth={4} />
    <rect x={0} y={-500} width={1100} height={1300} fill="#B4CFC8" stroke={INK} strokeWidth={4} />
    <rect x={1100} y={-200} width={1500} height={1000} fill="#E6B85C" stroke={INK} strokeWidth={4} />
    {[[-1200, -100], [-800, -100], [200, -300], [600, -300], [1300, 0], [1800, 0]].map(([wx, wy], i) => <rect key={i} x={wx} y={wy} width={260} height={220} fill="#EEF5F2" stroke={INK} strokeWidth={4} />)}
    <path d="M150,180 L950,180 L1000,280 L100,280 Z" fill="#E06A4F" stroke={INK} strokeWidth={4} />
    {Array.from({length: 8}, (_, i) => <rect key={`s${i}`} x={110 + i * 110} y={180} width={55} height={100} fill="#FBF7EE" opacity={0.6} />)}
    <rect x={-1400} y={700} width={4800} height={1000} fill="#9AA4AE" />
    <Veil k={veil} color="#DCE9EC" />
  </g>
);
/** a small stage: dark curtain, a spotlight pool */
export const StageBack: React.FC<{veil?: number}> = ({veil = 0}) => (
  <g>
    <rect x={-1400} y={-800} width={4800} height={2400} fill="#2E2433" />
    {Array.from({length: 24}, (_, i) => <rect key={i} x={-1400 + i * 200} y={-800} width={100} height={1500} fill="#3A2C40" />)}
    <path d="M700,-800 L1220,-800 L1560,800 L360,800 Z" fill="#FFE9B8" opacity={0.18} />
    <rect x={-1400} y={700} width={4800} height={1000} fill="#4A3A36" />
    <ellipse cx={960} cy={760} rx={600} ry={90} fill="#FFE9B8" opacity={0.25} />
    <Veil k={veil} color="#2E2433" />
  </g>
);
/** an office: desks and a whiteboard (no writing) */
export const OfficeBack: React.FC<{veil?: number}> = ({veil = 0}) => (
  <g>
    <rect x={-1400} y={-800} width={4800} height={2400} fill="#E4E9EC" />
    <rect x={-400} y={-300} width={900} height={500} rx={10} fill="#FBFBF8" stroke={INK} strokeWidth={4} />
    <path d="M-300,-100 q120,-90 240,0 t240,0" fill="none" stroke="#5E8CA8" strokeWidth={8} />
    <rect x={900} y={-350} width={700} height={560} fill="#CFE3EA" stroke={INK} strokeWidth={4} />
    <rect x={-1400} y={600} width={4800} height={1100} fill="#8E9AA4" />
    <rect x={-1400} y={480} width={4800} height={140} fill="#C9B79B" stroke={INK} strokeWidth={3} />
    <Veil k={veil} color="#E4E9EC" />
  </g>
);
export {lerp, shade, mix};

/** V4 Act 4: a hotel lobby reception: warm wood panelling, a key-cabinet grid, pendant lamps, a long counter line, a
 *  plant and a window to the street; a different palette from the lab (ochre and walnut, not cream and teal) */
export const LobbyBack: React.FC<{veil?: number}> = ({veil = 0}) => (
  <g>
    <rect x={-1400} y={-800} width={4800} height={2400} fill="#E9D7B5" />
    {/* panelling */}
    <rect x={-1400} y={-120} width={4800} height={680} fill="#B9844F" />
    {Array.from({length: 22}, (_, i) => (
      <rect key={i} x={-1400 + i * 220 + 16} y={-100} width={188} height={640} rx={6} fill="#C69361" stroke="#8E5F33" strokeWidth={3} />
    ))}
    <rect x={-1400} y={-140} width={4800} height={26} fill="#7A4F2A" />
    {/* key cabinet */}
    <rect x={180} y={-40} width={560} height={330} rx={8} fill="#6B4527" stroke={INK} strokeWidth={4} />
    {Array.from({length: 24}, (_, i) => {
      const cx = 220 + (i % 8) * 66, cy = -10 + Math.floor(i / 8) * 100;
      return (
        <g key={i}>
          <rect x={cx - 26} y={cy} width={52} height={76} rx={4} fill="#5A3A20" stroke="#3E2814" strokeWidth={2} />
          {i % 3 !== 1 && <path d={`M${cx},${cy + 18} l0,28`} stroke="#E8C06A" strokeWidth={5} strokeLinecap="round" />}
          {i % 3 !== 1 && <circle cx={cx} cy={cy + 52} r={7} fill="#E8C06A" />}
        </g>
      );
    })}
    {/* window to the street */}
    <rect x={1240} y={-330} width={520} height={760} fill="#BCD3DA" stroke={INK} strokeWidth={5} />
    <rect x={1262} y={-308} width={476} height={716} fill="#D7E6EA" />
    <rect x={1262} y={200} width={476} height={208} fill="#A8B7AE" />
    <rect x={1330} y={40} width={120} height={170} fill="#B7C4C6" />
    <rect x={1520} y={-20} width={160} height={230} fill="#C3CED0" />
    <line x1={1500} y1={-308} x2={1500} y2={408} stroke={INK} strokeWidth={4} />
    <path d="M1290,-300 l80,0 l-160,700 l-80,0 Z" fill="#FFF" opacity={0.2} />
    {/* pendant lamps */}
    {[-260, 940, 2100].map((x, i) => (
      <g key={i}>
        <line x1={x} y1={-800} x2={x} y2={-360} stroke={INK} strokeWidth={4} />
        <path d={`M${x - 70},-300 Q${x},-400 ${x + 70},-300 Z`} fill="#2F3A33" stroke={INK} strokeWidth={4} />
        <ellipse cx={x} cy={-298} rx={50} ry={10} fill="#FFE7A8" />
        <ellipse cx={x} cy={-200} rx={260} ry={200} fill="#FFE7A8" opacity={0.12} />
      </g>
    ))}
    {/* plant */}
    <path d="M-330,560 l30,-150 l120,0 l30,150 Z" fill="#3E4A44" stroke={INK} strokeWidth={3} />
    {[-50, -20, 15, 45].map((a, i) => (
      <ellipse key={i} cx={-240 + a} cy={290 - Math.abs(a)} rx={24} ry={110} transform={`rotate(${a * 0.8} ${-240 + a} ${290 - Math.abs(a)})`} fill={i % 2 ? '#6E9A62' : '#4F7D48'} stroke={INK} strokeWidth={2} />
    ))}
    {/* floor */}
    <rect x={-1400} y={560} width={4800} height={1200} fill="#7C5A3E" />
    <rect x={-1400} y={552} width={4800} height={10} fill="#5E3F24" />
    {veil > 0.001 && <rect x={-6000} y={-6000} width={12000} height={12000} fill="#EBDDC2" opacity={veil} />}
  </g>
);

/** the reception counter front (walnut with a brass rail), drawn across the frame at `y` */
export const LobbyCounter: React.FC<{x0: number; x1: number; y: number; h?: number}> = ({x0, x1, y, h = 420}) => (
  <g>
    <rect x={x0} y={y - 22} width={x1 - x0} height={30} rx={6} fill="#E6D3B0" stroke={INK} strokeWidth={4} />
    <rect x={x0 + 10} y={y + 8} width={x1 - x0 - 20} height={h} fill="#6E4628" stroke={INK} strokeWidth={4} />
    {Array.from({length: Math.ceil((x1 - x0) / 160)}, (_, i) => (
      <rect key={i} x={x0 + 30 + i * 160} y={y + 40} width={128} height={h - 60} rx={6} fill="#7D5332" stroke="#4E3019" strokeWidth={2} />
    ))}
    <rect x={x0 + 10} y={y + 20} width={x1 - x0 - 20} height={8} fill="#D8B25E" />
  </g>
);

/** V4 Act 3: a small recording studio: acoustic foam in a staggered grid, a warm practical lamp, a window into a dim
 *  control room with a mixing desk, a dark floor */
export const StudioBack: React.FC<{veil?: number}> = ({veil = 0}) => (
  <g>
    <rect x={-1400} y={-800} width={4800} height={2400} fill="#2E2A2C" />
    {Array.from({length: 13 * 7}, (_, i) => {
      const c = i % 13, r = Math.floor(i / 13);
      const x = -1100 + c * 200 + (r % 2) * 100, y = -500 + r * 150;
      return <rect key={i} x={x} y={y} width={180} height={130} rx={10} fill={(c + r) % 3 === 0 ? '#3D3437' : '#463B3E'} stroke="#231E20" strokeWidth={3} />;
    })}
    {/* control-room window */}
    <rect x={1050} y={-200} width={700} height={380} rx={8} fill="#141A20" stroke={INK} strokeWidth={6} />
    <rect x={1070} y={-180} width={660} height={340} fill="#1F2B36" />
    <rect x={1100} y={80} width={600} height={70} fill="#2B3742" />
    {Array.from({length: 18}, (_, i) => <rect key={i} x={1115 + i * 32} y={92} width={10} height={30 + ((i * 7) % 4) * 6} fill={i % 5 === 0 ? '#E8A84A' : '#6F8FA8'} opacity={0.75} />)}
    <path d="M1090,-170 l90,0 l-140,320 l-60,0 Z" fill="#FFF" opacity={0.06} />
    {/* warm practical lamp */}
    <ellipse cx={-300} cy={-60} rx={420} ry={320} fill="#F2B866" opacity={0.12} />
    <rect x={-330} y={-60} width={60} height={600} fill="#1A1517" />
    <path d="M-380,-60 L-220,-60 L-250,-150 L-350,-150 Z" fill="#E8A84A" stroke={INK} strokeWidth={4} />
    {/* floor */}
    <rect x={-1400} y={560} width={4800} height={1200} fill="#1E1B1C" />
    <rect x={-1400} y={552} width={4800} height={10} fill="#141112" />
    {veil > 0.001 && <rect x={-6000} y={-6000} width={12000} height={12000} fill="#2E2A2C" opacity={veil} />}
  </g>
);
/** a studio microphone on a boom (pop filter in front), its capsule at (x, y) */
export const StudioMic: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
    <path d="M40,40 L420,-240" stroke="#1A1517" strokeWidth={16} strokeLinecap="round" />
    <rect x={-34} y={-70} width={68} height={140} rx={34} fill="#3A3D42" stroke={INK} strokeWidth={6} />
    {[-40, -20, 0, 20, 40].map((d) => <line key={d} x1={-26} y1={d} x2={26} y2={d} stroke="#5A5E66" strokeWidth={4} />)}
    <rect x={-20} y={66} width={40} height={30} fill="#26282C" stroke={INK} strokeWidth={4} />
    <circle cx={-120} cy={0} r={78} fill="#2A2A30" opacity={0.35} stroke="#15151A" strokeWidth={5} />
  </g>
);
