// The V3 robotics test bay as one 3D model, drawn back to front through the shot's camera (proj.ts).
// Spatial map (fixed): apple on its cutting board at left, model hand on its mount at right, robot on its mobile base
// behind the bench, pendant task light over the bench, researchers' workstation further left.
import React from 'react';
import {Cam3, horiz, vert, se, ce, projY} from './proj';
import {R3, KN, BASE_D, UPPER_D, Pose3, solve3, knifeWorld} from './rig3';

export const K = {
  wallTop: '#22343F', wallBot: '#172630', panel: '#2C4350', floor: '#101A21', floorLine: '#E9B23A',
  steelTop: '#C9D4DC', steelTop2: '#AEBCC7', steelFront: '#7F93A2', steelDark: '#4F616E', leg: '#53636F',
  wood: '#D29457', woodSide: '#A96C38', woodGrain: '#B97A42',
  apple: '#E23B36', appleDark: '#A62323', appleLight: '#FF8B7E', stem: '#6B4428', leaf: '#4FB06A',
  hand: '#F28C38', handDark: '#C4651C', handMid: '#DD7A2A', handLight: '#FFC07F', cuff: '#5D6B78', cuffLight: '#8796A3',
  metal: '#9AA7B2', metalDark: '#5A6772',
  robot: '#E7ECF1', robotMid: '#BAC6D0', robotShade: '#93A2AF', robotInk: '#3D4B58', cap: '#4FA9CF', capDark: '#2F7FA3', ring: '#26333F',
  grip: '#2F3640', grip2: '#454E5B', led: '#43E3D2',
  handle: '#6B58D6', handleLight: '#9D8EF2', handleDark: '#46379E', blade: '#F2F5F8', bladeRim: '#AEB8C3',
  base: '#26323C', base2: '#33424E', tire: '#13191F', hub: '#7D8A95',
  amber: '#F2A33A', teal: '#3FD1C7', warm: '#FFD59A',
  desk: '#B98756', deskTop: '#D4A574', deskDark: '#8A6038',
};

export const BENCH = {x0: 40, x1: 1180, d0: -230, d1: 230, top: 380, slab: 34};
export const BOARD = {x0: 165, x1: 435, d0: -105, d1: 105, h: 16};
export const APPLE3 = {x: 300, d: 0, r: 64, cy: BENCH.top + BOARD.h + 60, stemTop: BENCH.top + BOARD.h + 60 + 88};
export const HAND3 = {x: 690, palmTop: 456, fingerTop: 440, bottom: 384, left: 540, right: 880, cuffX0: 836, cuffX1: 884};
export const LIGHT = {x: 640, d: 180, h: 1160}; // pendant lamp, a little in front of the props line, so shadows fall back across them
export const WS = {x0: -780, x1: -170, d0: -560, d1: -300, top: 360, mon: {x: -585, w: 230, h0: 430, hh: 409, d: -440}};

// ---------- primitives ----------
type Pt = {x: number; y: number};
const poly = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z';

export const Box: React.FC<{c: Cam3; x0: number; x1: number; d0: number; d1: number; h0: number; h1: number; top: string; front: string; stroke?: string; rx?: number}> = ({c, x0, x1, d0, d1, h0, h1, top, front, stroke, rx = 0}) => {
  const Y = (d: number, h: number) => projY(c, d, h);
  return (
    <g>
      <rect x={x0} y={Y(d1, h1)} width={x1 - x0} height={Math.max(0, Y(d1, h0) - Y(d1, h1))} fill={front} stroke={stroke} strokeWidth={stroke ? 2 : 0} />
      <g transform={horiz(c, h1)}>
        <rect x={x0} y={d0} width={x1 - x0} height={d1 - d0} rx={rx} fill={top} stroke={stroke} strokeWidth={stroke ? 2 : 0} />
      </g>
    </g>
  );
};

// cylinder with a vertical axis
export const CylV: React.FC<{c: Cam3; x: number; d: number; r: number; h0: number; h1: number; side: string; top: string; stroke?: string}> = ({c, x, d, r, h0, h1, side, top, stroke}) => {
  const y0 = projY(c, d, h0), y1 = projY(c, d, h1), ry = r * se(c);
  return (
    <g>
      <path d={`M ${x - r} ${y1} L ${x - r} ${y0} A ${r} ${ry} 0 0 0 ${x + r} ${y0} L ${x + r} ${y1} Z`} fill={side} stroke={stroke} strokeWidth={stroke ? 2.5 : 0} />
      <ellipse cx={x} cy={y1} rx={r} ry={ry} fill={top} stroke={stroke} strokeWidth={stroke ? 2.5 : 0} />
    </g>
  );
};

// joint housing: cylinder whose axis runs along d (toward the viewer); the front cap faces the camera
export const CylD: React.FC<{c: Cam3; x: number; h: number; r: number; d0: number; d1: number; side: string; cap: string; ring?: string; inner?: string; hot?: number}> = ({c, x, h, r, d0, d1, side, cap, ring, inner, hot = 0}) => {
  const y0 = projY(c, d0, h), y1 = projY(c, d1, h), ry = r * ce(c);
  return (
    <g>
      <ellipse cx={x} cy={y0} rx={r} ry={ry} fill={side} />
      <rect x={x - r} y={Math.min(y0, y1)} width={2 * r} height={Math.abs(y1 - y0)} fill={side} />
      <ellipse cx={x} cy={y1} rx={r + 1.5} ry={ry + 1.5} fill={K.robotInk} />
      <ellipse cx={x} cy={y1} rx={r} ry={ry} fill={cap} />
      {ring && <ellipse cx={x} cy={y1} rx={r * 0.8} ry={ry * 0.8} fill="none" stroke={ring} strokeWidth={Math.max(3, r * 0.1) * (1 + hot * 0.8)} />}
      {inner && <ellipse cx={x} cy={y1} rx={r * 0.42} ry={ry * 0.42} fill={inner} />}
      <ellipse cx={x - r * 0.3} cy={y1 - ry * 0.35} rx={r * 0.32} ry={ry * 0.16} fill="#FFFFFF" opacity={0.35} />
    </g>
  );
};

// a link (cylinder) between two points in plane d
const Link3: React.FC<{c: Cam3; a: {x: number; h: number}; b: {x: number; h: number}; d: number; r: number}> = ({c, a, b, d, r}) => {
  const A = {x: a.x, y: projY(c, d, a.h)}, B = {x: b.x, y: projY(c, d, b.h)};
  const nx = -(B.y - A.y), ny = B.x - A.x, nl = Math.hypot(nx, ny) || 1;
  const off = (k: number) => ({x: (nx / nl) * r * k, y: (ny / nl) * r * k});
  const hi = off(ny / nl > 0 ? -0.45 : 0.45);
  return (
    <g>
      <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={K.robotInk} strokeWidth={2 * r + 5} strokeLinecap="round" />
      <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={K.robotMid} strokeWidth={2 * r} strokeLinecap="round" />
      <line x1={A.x + hi.x * 0.4} y1={A.y + hi.y * 0.4} x2={B.x + hi.x * 0.4} y2={B.y + hi.y * 0.4} stroke={K.robot} strokeWidth={r * 1.3} strokeLinecap="round" />
      <line x1={A.x + hi.x} y1={A.y + hi.y} x2={B.x + hi.x} y2={B.y + hi.y} stroke="#FFFFFF" strokeWidth={r * 0.22} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

// ---------- props ----------
export const ApplePlanShape: React.FC<{c: Cam3}> = ({c}) => {
  const {x, d, r, cy} = APPLE3;
  const Y = projY(c, d, cy);
  const top = projY(c, d, cy + r * 0.86);
  const stemTop = projY(c, d, APPLE3.stemTop);
  return (
    <g>
      <defs>
        <radialGradient id="v3-apple" cx="0.36" cy="0.32" r="0.75">
          <stop offset="0" stopColor={K.appleLight} />
          <stop offset="0.35" stopColor={K.apple} />
          <stop offset="1" stopColor={K.appleDark} />
        </radialGradient>
      </defs>
      {/* slightly wider than tall, with a dimple at the top */}
      <path d={`M ${x} ${Y - r * 0.82} C ${x + r * 0.55} ${Y - r * 1.12} ${x + r * 1.1} ${Y - r * 0.7} ${x + r * 1.02} ${Y} C ${x + r * 0.96} ${Y + r * 0.66} ${x + r * 0.5} ${Y + r * 1.0} ${x} ${Y + r * 0.94} C ${x - r * 0.5} ${Y + r * 1.0} ${x - r * 0.96} ${Y + r * 0.66} ${x - r * 1.02} ${Y} C ${x - r * 1.1} ${Y - r * 0.7} ${x - r * 0.55} ${Y - r * 1.12} ${x} ${Y - r * 0.82} Z`} fill="url(#v3-apple)" stroke={K.appleDark} strokeWidth={3} />
      <ellipse cx={x - r * 0.42} cy={Y - r * 0.38} rx={r * 0.16} ry={r * 0.26} fill="#FFFFFF" opacity={0.45} transform={`rotate(24 ${x - r * 0.42} ${Y - r * 0.38})`} />
      <ellipse cx={x} cy={top + (Y - top) * 0.05} rx={r * 0.24} ry={r * 0.24 * Math.max(0.25, se(c))} fill={K.appleDark} opacity={0.6} />
      <path d={`M ${x} ${top} Q ${x + 3} ${(top + stemTop) / 2} ${x + 10} ${stemTop}`} stroke={K.stem} strokeWidth={7} strokeLinecap="round" fill="none" />
      <path d={`M ${x + 4} ${top - 10} C ${x + 22} ${top - 34} ${x + 50} ${top - 30} ${x + 58} ${top - 20} C ${x + 42} ${top - 6} ${x + 20} ${top - 4} ${x + 4} ${top - 10} Z`} fill={K.leaf} />
    </g>
  );
};

const CuttingBoard: React.FC<{c: Cam3}> = ({c}) => {
  const {x0, x1, d0, d1, h} = BOARD;
  const t = BENCH.top;
  return (
    <g>
      <g transform={horiz(c, t)}>
        <ellipse cx={(x0 + x1) / 2 + 10} cy={10} rx={(x1 - x0) / 2 + 14} ry={(d1 - d0) / 2 + 10} fill="#000" opacity={0.18} />
      </g>
      <rect x={x0} y={projY(c, d1, t + h)} width={x1 - x0} height={projY(c, d1, t) - projY(c, d1, t + h)} rx={6} fill={K.woodSide} />
      <g transform={horiz(c, t + h)}>
        <rect x={x0} y={d0} width={x1 - x0} height={d1 - d0} rx={18} fill={K.wood} />
        {[-70, -38, -6, 30, 64].map((dd, i) => (
          <path key={i} d={`M ${x0 + 24} ${dd} C ${x0 + 90} ${dd - 8} ${x1 - 120} ${dd + 10} ${x1 - 24} ${dd - 2}`} stroke={K.woodGrain} strokeWidth={3} fill="none" opacity={0.7} />
        ))}
        <rect x={x0 + 14} y={d0 + 14} width={x1 - x0 - 28} height={d1 - d0 - 28} rx={12} fill="none" stroke={K.woodSide} strokeWidth={4} opacity={0.6} />
        <circle cx={x0 + 34} cy={0} r={11} fill={K.woodSide} />
      </g>
      {/* apple contact shadow */}
      <g transform={horiz(c, t + h)}>
        <ellipse cx={APPLE3.x + 12} cy={8} rx={60} ry={44} fill="#000" opacity={0.28} />
      </g>
    </g>
  );
};

// Model hand, back of the hand up, fingers toward the apple (−x). Each part is a prism over its plan outline (local
// x, d around HAND3.x) with a height-field top h(x): the top surface, the side walls and the resting base are all
// projected from the same points, so the hand keeps one shape from blade level to the high angle.
type XD = [number, number];
type HPart = {pts: XD[]; h0: number; top: (x: number) => number; detail?: 'finger' | 'palm'; w?: number; d?: number; x1?: number};
const capsule = (x1: number, x2: number, d: number, w: number, n = 10): XD[] => {
  const r = w / 2, out: XD[] = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI / 2 + (Math.PI * i) / n; // round tip at x1
    out.push([x1 + r + r * Math.cos(a), d - r * Math.sin(a)]);
  }
  out.push([x2, d + r], [x2, d - r]);
  return out;
};
const FINGERS: [number, number, number][] = [[-41, -118, 24], [-14, -150, 26], [13, -154, 26], [39, -128, 24]];
const fingerTop = (x1: number) => (x: number) => {
  const u = Math.min(1, Math.max(0, (x - x1) / (-56 - x1)));
  return 410 + 34 * Math.sin((u * Math.PI) / 2) ** 0.7; // fingertip curls down toward the bench
};
const PALM: XD[] = [[-62, -54], [-30, -58], [10, -58], [40, -55], [66, -46], [150, -37], [150, 37], [66, 46], [40, 55], [10, 58], [-30, 58], [-62, 54], [-72, 30], [-74, 0], [-72, -30]];
const palmTop = (x: number) => (x < -50 ? 440 + (x + 74) * 0.5 : x < 10 ? 452 + (x + 50) * 0.08 : x < 66 ? 457 - (x - 10) * 0.09 : 452 - (x - 66) * 0.07);
const THUMB: XD[] = (() => {
  const base = capsule(-104, -20, 0, 26);
  const ang = (-28 * Math.PI) / 180;
  return base.map(([x, d]) => [-20 + (x + 20) * Math.cos(ang) - d * Math.sin(ang), 50 + (x + 20) * Math.sin(ang) + d * Math.cos(ang)] as XD);
})();
export const HAND_PARTS: HPart[] = [
  ...FINGERS.map(([d, x1, w]) => ({pts: capsule(x1, -56, d, w), h0: 388, top: fingerTop(x1), detail: 'finger' as const, w, d, x1})),
  {pts: PALM, h0: HAND3.bottom, top: palmTop, detail: 'palm' as const},
  {pts: THUMB, h0: 390, top: () => 426},
];
const pathOf = (pts: {x: number; y: number}[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

// flat plan of the whole hand (for the monitor's target silhouette)
export const HAND_PARTS_FLAT = (
  <g>
    {HAND_PARTS.map((p, i) => (
      <path key={i} d={'M ' + p.pts.map(([x, d]) => `${x} ${d}`).join(' L ') + ' Z'} />
    ))}
  </g>
);

const Prism: React.FC<{c: Cam3; part: HPart}> = ({c, part}) => {
  const X = HAND3.x;
  const at = (x: number, d: number, h: number) => ({x: X + x, y: projY(c, d, h)});
  const top = part.pts.map(([x, d]) => at(x, d, part.top(x)));
  const bot = part.pts.map(([x, d]) => at(x, d, part.h0));
  const mid = part.pts.map(([x, d]) => at(x, d, (part.h0 + part.top(x)) / 2));
  const n = part.pts.length;
  const walls = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    walls.push(<path key={i} d={pathOf([bot[i], bot[j], top[j], top[i]])} />);
  }
  const det = [];
  if (part.detail === 'finger' && part.w && part.x1 !== undefined && part.d !== undefined) {
    const {w, x1, d} = part;
    for (const f of [0.42, 0.72]) {
      const x = x1 + (-56 - x1) * f;
      det.push(<path key={f} d={`M ${at(x, d - w * 0.36, part.top(x)).x} ${at(x, d - w * 0.36, part.top(x)).y} Q ${at(x - 5, d, part.top(x)).x} ${at(x - 5, d, part.top(x)).y} ${at(x, d + w * 0.36, part.top(x)).x} ${at(x, d + w * 0.36, part.top(x)).y}`} stroke={K.handDark} strokeWidth={2} fill="none" opacity={0.6} />);
    }
    const n0 = at(x1 + 12, d, part.top(x1 + 12));
    det.push(<ellipse key="nail" cx={n0.x} cy={n0.y} rx={7} ry={Math.max(2, w * 0.3 * se(c))} fill={K.handLight} opacity={0.6} />);
  }
  if (part.detail === 'palm') {
    for (const [d] of FINGERS) {
      const k = at(-56, d, palmTop(-56) + 2);
      det.push(<ellipse key={d} cx={k.x} cy={k.y} rx={10} ry={Math.max(2.5, 9 * se(c))} fill={K.handLight} opacity={0.5} />);
    }
    const hl = [-40, 0, 40, 64].map((x) => at(x, -30, palmTop(x)));
    det.push(<path key="hl" d={`M ${hl[0].x} ${hl[0].y} C ${hl[1].x} ${hl[1].y} ${hl[2].x} ${hl[2].y} ${hl[3].x} ${hl[3].y}`} stroke={K.handLight} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.55} />);
  }
  return (
    <g>
      <path d={pathOf(bot)} fill={K.handDark} stroke={K.handDark} strokeWidth={2.5} />
      <g fill={K.handMid} stroke={K.handMid} strokeWidth={1}>
        {walls}
      </g>
      {/* molded parting line around the casting at mid height */}
      <path d={pathOf(mid)} fill="none" stroke={K.handDark} strokeWidth={2} opacity={0.55} />
      <path d={pathOf(top)} fill={K.hand} stroke={K.handDark} strokeWidth={2.5} />
      {det}
    </g>
  );
};

export const HandProp: React.FC<{c: Cam3; shadow?: React.ReactNode}> = ({c, shadow}) => {
  const {cuffX0, cuffX1} = HAND3;
  const cuffH = 418, cuffR = 40;
  const yC = projY(c, 0, cuffH);
  return (
    <g>
      {/* contact shadow and mount base plate */}
      <g transform={horiz(c, BENCH.top)}>
        <ellipse cx={HAND3.x + 10} cy={12} rx={190} ry={70} fill="#000" opacity={0.22} />
      </g>
      <Box c={c} x0={846} x1={952} d0={-70} d1={70} h0={BENCH.top} h1={BENCH.top + 10} top={K.metal} front={K.metalDark} />
      {[862, 936].map((x) => [-48, 48].map((d) => (
        <g key={`${x}${d}`} transform={horiz(c, BENCH.top + 10)}>
          <circle cx={x} cy={d} r={6} fill={K.metalDark} />
        </g>
      )))}
      <CylV c={c} x={918} d={0} r={13} h0={BENCH.top + 10} h1={cuffH} side={K.metalDark} top={K.metal} />
      {/* hand body: rounded extrusions, back to front by depth */}
      {HAND_PARTS.map((part, i) => (
        <Prism key={i} c={c} part={part} />
      ))}
      {shadow}
      {/* molded cuff (a cylinder along x) and the clamp ring of the mount */}
      <defs>
        <linearGradient id="v3-cuff" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={K.cuffLight} />
          <stop offset="0.45" stopColor={K.cuff} />
          <stop offset="1" stopColor="#3B4650" />
        </linearGradient>
        <linearGradient id="v3-clamp" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#C9D2DA" />
          <stop offset="0.5" stopColor={K.metal} />
          <stop offset="1" stopColor={K.metalDark} />
        </linearGradient>
      </defs>
      <rect x={cuffX0} y={yC - cuffR} width={cuffX1 - cuffX0} height={2 * cuffR} rx={10} fill="url(#v3-cuff)" stroke="#2F3A44" strokeWidth={2.5} />
      {[cuffX0 + 12, cuffX0 + 24, cuffX0 + 36].map((x) => (
        <line key={x} x1={x} y1={yC - cuffR + 4} x2={x} y2={yC + cuffR - 4} stroke="#2F3A44" strokeWidth={2} opacity={0.6} />
      ))}
      <rect x={cuffX1 - 2} y={yC - cuffR - 6} width={40} height={2 * cuffR + 12} rx={8} fill="url(#v3-clamp)" stroke="#3E4A55" strokeWidth={2.5} />
      <circle cx={cuffX1 + 18} cy={yC - cuffR - 1} r={6} fill={K.metalDark} />
      <rect x={cuffX1 + 38} y={yC - 12} width={16} height={24} rx={4} fill={K.metalDark} />
    </g>
  );
};

// ---------- knife + gripper (tool frame: u right, v down; origin = jaw centre) ----------
export const ToyKnife3: React.FC<{glint?: number}> = ({glint}) => {
  const {handleEnd, handleFront, bolster, tipU, spine, edge, handleH} = KN;
  // spine runs straight then drops to a round nose; the blunt edge has a belly that sweeps up to meet it
  const blade = `M ${bolster} ${spine} L ${tipU + 44} ${spine} C ${tipU + 14} ${spine} ${tipU} ${spine + 4} ${tipU} ${spine + 16} C ${tipU} ${spine + 30} ${tipU + 18} ${edge - 4} ${tipU + 54} ${edge} L ${handleFront} ${edge} L ${bolster} ${edge - 4} Z`;
  return (
    <g>
      <defs>
        <clipPath id="v3-blade">
          <path d={blade} />
        </clipPath>
        <linearGradient id="v3-glint" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="v3-bladeShade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D9E0E7" />
        </linearGradient>
      </defs>
      <path d={blade} fill="url(#v3-bladeShade)" stroke={K.bladeRim} strokeWidth={3} strokeLinejoin="round" />
      {/* thick rounded edge bead and a molded rib: plastic, blunt */}
      <path d={`M ${handleFront - 2} ${edge - 5} L ${tipU + 54} ${edge - 5} C ${tipU + 26} ${edge - 9} ${tipU + 8} ${spine + 30} ${tipU + 5} ${spine + 18}`} stroke="#E3E8ED" strokeWidth={7} strokeLinecap="round" fill="none" />
      <path d={`M ${handleFront - 4} ${spine + 13} L ${tipU + 40} ${spine + 13}`} stroke={K.bladeRim} strokeWidth={2} opacity={0.6} />
      {glint !== undefined && glint > 0 && glint < 1 && <rect x={tipU - 40 + 220 * glint - 30} y={spine - 4} width={46} height={edge - spine + 8} fill="url(#v3-glint)" clipPath="url(#v3-blade)" />}
      {/* bolster/guard and a chunky handle with finger grooves */}
      <rect x={bolster - 2} y={-22} width={12} height={44} rx={5} fill={K.handleDark} />
      <path d={`M ${handleFront + 4} ${-handleH / 2} L ${handleEnd - 10} ${-handleH / 2 - 2} Q ${handleEnd + 4} ${-handleH / 2 - 2} ${handleEnd + 4} 0 Q ${handleEnd + 4} ${handleH / 2 + 2} ${handleEnd - 10} ${handleH / 2 + 2} L ${handleFront + 4} ${handleH / 2} Z`} fill={K.handle} stroke={K.handleDark} strokeWidth={3} />
      {[20, 34, 48, 62].map((u) => (
        <path key={u} d={`M ${u} ${handleH / 2 + 1} q 5 -6 10 0`} stroke={K.handleDark} strokeWidth={2.5} fill="none" />
      ))}
      <rect x={handleFront + 10} y={-handleH / 2 + 4} width={handleEnd - handleFront - 26} height={5} rx={2.5} fill={K.handleLight} opacity={0.8} />
      <circle cx={handleEnd - 6} cy={0} r={4} fill={K.handleDark} />
    </g>
  );
};

// Hand-E-style gripper below wrist 2 (origin W2), knife clamped between the fingers at v = GRIP.
export const Gripper3: React.FC<{glint?: number; squeeze?: number}> = ({glint, squeeze = 0}) => {
  const G = R3.GRIP;
  return (
    <g>
      {/* wrist 3 + flange */}
      <rect x={-34} y={-8} width={68} height={20} rx={8} fill={K.robotMid} stroke={K.robotInk} strokeWidth={3} />
      <rect x={-34} y={2} width={68} height={5} fill={K.cap} />
      <rect x={-28} y={12} width={56} height={10} rx={3} fill={K.robotShade} />
      {/* Hand-E body: chamfered block, status light, cable gland */}
      <path d="M -46 22 L 46 22 L 50 30 L 50 88 L 44 96 L -44 96 L -50 88 L -50 30 Z" fill={K.grip} stroke="#15191F" strokeWidth={3} />
      <rect x={-38} y={34} width={76} height={6} rx={3} fill={K.led} opacity={0.9} />
      <rect x={-38} y={48} width={76} height={36} rx={6} fill={K.grip2} />
      <circle cx={52} cy={60} r={8} fill={K.grip2} stroke="#15191F" strokeWidth={2} />
      {/* rear finger, knife, front finger */}
      <rect x={-6 + squeeze} y={92} width={24} height={G - 92 + 18} rx={5} fill="#232830" stroke="#111" strokeWidth={2} />
      <g transform={`translate(0 ${G})`}>
        <ToyKnife3 glint={glint} />
      </g>
      <rect x={-18 - squeeze} y={92} width={24} height={G - 92 + 18} rx={5} fill={K.grip2} stroke="#111" strokeWidth={2.5} />
      <rect x={-14 - squeeze} y={G - 8} width={16} height={16} rx={3} fill="#5B6676" />
    </g>
  );
};

// ---------- robot ----------
export const RobotBase3: React.FC<{c: Cam3}> = ({c}) => {
  const bx = R3.S.x;
  const wheel = (d: number, front: boolean) => {
    const y = projY(c, d, 84), ry = 84 * ce(c);
    return (
      <g>
        <ellipse cx={bx} cy={y} rx={84} ry={ry} fill={K.tire} />
        {front && (
          <>
            <ellipse cx={bx} cy={y} rx={58} ry={58 * ce(c)} fill="#1E262E" />
            <ellipse cx={bx} cy={y} rx={30} ry={30 * ce(c)} fill={K.hub} />
            {Array.from({length: 5}).map((_, i) => {
              const a = (i * 72 * Math.PI) / 180;
              return <line key={i} x1={bx} y1={y} x2={bx + 52 * Math.cos(a)} y2={y + 52 * Math.sin(a) * ce(c)} stroke={K.hub} strokeWidth={6} />;
            })}
            <ellipse cx={bx} cy={y} rx={10} ry={10 * ce(c)} fill="#2A333B" />
          </>
        )}
      </g>
    );
  };
  return (
    <g>
      {wheel(-450, false)}
      <Box c={c} x0={bx - 118} x1={bx + 118} d0={-440} d1={-250} h0={70} h1={200} top={K.base2} front={K.base} rx={14} />
      <rect x={bx - 100} y={projY(c, -250, 180)} width={200} height={8} rx={4} fill={K.teal} opacity={0.75} />
      {wheel(-238, true)}
      {/* column with a cable channel, mounting plate, base joint */}
      <Box c={c} x0={bx - 34} x1={bx + 34} d0={BASE_D - 32} d1={BASE_D + 32} h0={200} h1={612} top={K.base2} front={K.base} />
      <rect x={bx - 12} y={projY(c, BASE_D + 32, 600)} width={10} height={projY(c, BASE_D + 32, 210) - projY(c, BASE_D + 32, 600)} fill="#1A242C" />
      <Box c={c} x0={bx - 66} x1={bx + 66} d0={BASE_D - 66} d1={BASE_D + 66} h0={612} h1={628} top={K.metal} front={K.metalDark} />
      <CylV c={c} x={bx} d={BASE_D} r={52} h0={628} h1={656} side={K.robotShade} top={K.robotMid} />
      <CylV c={c} x={bx} d={BASE_D} r={46} h0={656} h1={688} side={K.robotMid} top={K.cap} stroke={K.robotInk} />
    </g>
  );
};

export const Arm3: React.FC<{c: Cam3; pose: Pose3; glint?: number; hot?: number; squeeze?: number}> = ({c, pose, glint, hot = 0, squeeze}) => {
  const j = solve3(pose);
  const S = j.S;
  const yS = (d: number, p: {x: number; h: number}) => ({x: p.x, y: projY(c, d, p.h)});
  // cable: base -> along the top of the upper arm and forearm -> gripper gland (clean routing, slack at joints)
  const cS = yS(UPPER_D, {x: S.x + 20, h: S.h + 40}), cE = yS(0, {x: j.E.x + 10, h: j.E.h + 34}), cW = yS(0, {x: j.W1.x + 30, h: j.W1.h + 10}), cG = yS(0, {x: j.W2.x + 52, h: j.W2.h - 60});
  return (
    <g>
      {/* shoulder housing from the column forward to the upper-arm plane */}
      <CylD c={c} x={S.x} h={S.h} r={58} d0={BASE_D} d1={UPPER_D} side={K.robotShade} cap={K.robotMid} ring={K.cap} inner={K.robot} hot={hot} />
      <Link3 c={c} a={S} b={j.E} d={UPPER_D} r={34} />
      <path d={`M ${cS.x} ${cS.y} Q ${(cS.x + cE.x) / 2} ${(cS.y + cE.y) / 2 - 18} ${cE.x} ${cE.y}`} stroke="#1E2830" strokeWidth={7} fill="none" strokeLinecap="round" />
      {/* elbow housing carries the forearm to the props' depth */}
      <CylD c={c} x={j.E.x} h={j.E.h} r={48} d0={UPPER_D} d1={0} side={K.robotShade} cap={K.robotMid} ring={K.cap} inner={K.robot} hot={hot} />
      <Link3 c={c} a={j.E} b={j.W1} d={0} r={28} />
      <path d={`M ${cE.x} ${cE.y} Q ${(cE.x + cW.x) / 2} ${(cE.y + cW.y) / 2 - 14} ${cW.x} ${cW.y} Q ${cW.x + 30} ${(cW.y + cG.y) / 2} ${cG.x} ${cG.y}`} stroke="#1E2830" strokeWidth={6} fill="none" strokeLinecap="round" />
      <CylD c={c} x={j.W1.x} h={j.W1.h} r={36} d0={-46} d1={20} side={K.robotShade} cap={K.robotMid} ring={K.cap} inner={K.robot} hot={hot} />
      <Link3 c={c} a={j.W1} b={j.W2} d={0} r={26} />
      <g transform={`${vert(c, 0)} translate(${j.W2.x} ${-j.W2.h}) rotate(${pose.phi - 90})`}>
        <Gripper3 glint={glint} squeeze={squeeze} />
      </g>
    </g>
  );
};

// Knife (and gripper-finger) shadow from the pendant lamp onto a horizontal plane at height hs, in local (x, d).
export const knifeShadowPath = (pose: Pose3, hs: number) => {
  const k = knifeWorld(pose);
  const pts = k.outline.map((p) => {
    const t = (LIGHT.h - hs) / Math.max(1, LIGHT.h - p.h);
    return {x: LIGHT.x + (p.x - LIGHT.x) * t, y: LIGHT.d + (0 - LIGHT.d) * t};
  });
  return poly(pts);
};

// ---------- environment ----------
export const Wall3: React.FC<{c: Cam3}> = ({c}) => {
  const D = -720;
  return (
    <g>
      <g transform={vert(c, D)}>
        <rect x={-2200} y={-2000} width={5600} height={2000} fill="url(#v3-wall)" />
        {[-1400, -1040, -680, -320, 40, 400, 760, 1120, 1480, 1840].map((x) => (
          <rect key={x} x={x} y={-1450} width={330} height={1180} rx={12} fill={K.panel} opacity={0.45} />
        ))}
        {/* cable tray along the wall */}
        <rect x={-2200} y={-1290} width={5600} height={22} fill="#33505E" />
        <rect x={-2200} y={-1268} width={5600} height={6} fill="#1A2830" />
        {/* equipment rack with a few status lights */}
        <rect x={1300} y={-980} width={250} height={980} rx={8} fill="#1C2A33" stroke="#3B5664" strokeWidth={4} />
        {Array.from({length: 7}).map((_, i) => (
          <g key={i}>
            <rect x={1318} y={-958 + i * 130} width={214} height={104} rx={6} fill="#24363F" />
            <circle cx={1342} cy={-930 + i * 130} r={6} fill={i % 3 === 0 ? K.teal : '#2E4A55'} />
            <rect x={1362} y={-936 + i * 130} width={150} height={10} rx={5} fill="#2E4A55" />
          </g>
        ))}
        {/* safety sign plate without text: yellow/black chevrons */}
        <rect x={430} y={-1150} width={180} height={70} rx={8} fill="#E9B23A" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M ${448 + i * 42} -1140 l 22 0 l -18 50 l -22 0 Z`} fill="#1B252C" />
        ))}
      </g>
      {/* floor */}
      <g transform={horiz(c, 0)}>
        <rect x={-2200} y={D} width={5600} height={2400} fill={K.floor} />
        <rect x={-2200} y={D} width={5600} height={2400} fill="url(#v3-floorFade)" />
        <rect x={720} y={-560} width={620} height={8} fill={K.floorLine} opacity={0.8} />
        <rect x={720} y={-560} width={8} height={420} fill={K.floorLine} opacity={0.8} />
        <rect x={1332} y={-560} width={8} height={420} fill={K.floorLine} opacity={0.8} />
      </g>
    </g>
  );
};

export const Workstation3: React.FC<{c: Cam3; screen?: React.ReactNode}> = ({c, screen}) => {
  const {x0, x1, d0, d1, top, mon} = WS;
  const vy = (h: number) => -h;
  return (
    <g>
      {[x0 + 30, x1 - 50].map((x) => (
        <Box key={x} c={c} x0={x} x1={x + 22} d0={d1 - 40} d1={d1 - 18} h0={0} h1={top - 20} top={K.deskDark} front={K.deskDark} />
      ))}
      <Box c={c} x0={x0} x1={x1} d0={d0} d1={d1} h0={top - 20} h1={top} top={K.deskTop} front={K.desk} />
      {/* monitor on a stand (portrait glass, faces the camera) */}
      <Box c={c} x0={mon.x + mon.w / 2 - 60} x1={mon.x + mon.w / 2 + 60} d0={mon.d - 40} d1={mon.d + 20} h0={top} h1={top + 8} top="#2B3138" front="#1E2329" />
      <g transform={vert(c, mon.d)}>
        <rect x={mon.x + mon.w / 2 - 12} y={vy(mon.h0)} width={24} height={mon.h0 - top - 8} fill="#22282F" />
        <rect x={mon.x - 12} y={vy(mon.h0 + mon.hh) - 12} width={mon.w + 24} height={mon.hh + 24} rx={14} fill="#14181D" stroke="#2D343D" strokeWidth={4} />
        <svg x={mon.x} y={vy(mon.h0 + mon.hh)} width={mon.w} height={mon.hh} viewBox="0 0 1080 1920" overflow="hidden">
          <rect x={0} y={0} width={1080} height={1920} fill="#0A131A" />
          {screen}
        </svg>
        {/* desk lamp (warm), left of the monitor */}
        <path d={`M ${x0 + 40} ${vy(top)} L ${x0 + 100} ${vy(top)} L ${x0 + 82} ${vy(top + 12)} L ${x0 + 58} ${vy(top + 12)} Z`} fill="#3A3F46" />
        <line x1={x0 + 70} y1={vy(top + 12)} x2={x0 + 46} y2={vy(top + 220)} stroke="#3A3F46" strokeWidth={10} strokeLinecap="round" />
        <line x1={x0 + 46} y1={vy(top + 220)} x2={x0 + 128} y2={vy(top + 270)} stroke="#3A3F46" strokeWidth={10} strokeLinecap="round" />
        <path d={`M ${x0 + 112} ${vy(top + 292)} L ${x0 + 168} ${vy(top + 262)} L ${x0 + 150} ${vy(top + 226)} L ${x0 + 98} ${vy(top + 252)} Z`} fill={K.amber} />
        <path d={`M ${x0 + 140} ${vy(top + 236)} L ${x0 + 60} ${vy(top)} L ${x0 + 175} ${vy(top)} Z`} fill={K.warm} opacity={0.16} />
      </g>
      <Box c={c} x0={mon.x - 10} x1={mon.x + mon.w + 10} d0={d1 - 110} d1={d1 - 60} h0={top} h1={top + 10} top="#2B3138" front="#1E2329" />
      <Box c={c} x0={x1 - 130} x1={x1 - 80} d0={d1 - 120} d1={d1 - 70} h0={top} h1={top + 60} top="#E8E2D6" front="#CFC6B6" />
    </g>
  );
};

export const PendantLight: React.FC<{c: Cam3; on?: number}> = ({c, on = 1}) => {
  const L = LIGHT;
  const y = projY(c, L.d, L.h);
  const yTop = projY(c, L.d, 2200);
  const yBench = projY(c, 0, BENCH.top);
  return (
    <g>
      <line x1={L.x} y1={yTop} x2={L.x} y2={y - 40} stroke="#1A242B" strokeWidth={5} />
      <path d={`M ${L.x - 120} ${yBench} L ${L.x - 66} ${y + 6} L ${L.x + 66} ${y + 6} L ${L.x + 120} ${yBench} Z`} fill="url(#v3-cone)" opacity={0.55 * on} />
      <path d={`M ${L.x - 30} ${y - 42} L ${L.x + 30} ${y - 42} L ${L.x + 74} ${y + 6} L ${L.x - 74} ${y + 6} Z`} fill="#2C3A44" stroke="#4A6170" strokeWidth={3} />
      <ellipse cx={L.x} cy={y + 6} rx={70} ry={10} fill={K.warm} opacity={on} />
    </g>
  );
};

export const WorldDefs: React.FC = () => (
  <defs>
    <linearGradient id="v3-wall" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#152129" />
      <stop offset="0.5" stopColor={K.wallTop} />
      <stop offset="1" stopColor={K.wallBot} />
    </linearGradient>
    <linearGradient id="v3-floorFade" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#24353F" stopOpacity={0.6} />
      <stop offset="1" stopColor="#070C10" stopOpacity={0.4} />
    </linearGradient>
    <linearGradient id="v3-cone" x1="0" x2="0" y1="1" y2="0">
      <stop offset="0" stopColor={K.warm} stopOpacity={0.05} />
      <stop offset="1" stopColor={K.warm} stopOpacity={0.5} />
    </linearGradient>
    <radialGradient id="v3-pool" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FFF1D6" stopOpacity={0.5} />
      <stop offset="1" stopColor="#FFF1D6" stopOpacity={0} />
    </radialGradient>
    <linearGradient id="v3-benchTop" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor={K.steelTop2} />
      <stop offset="1" stopColor={K.steelTop} />
    </linearGradient>
    <filter id="v3-soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" />
    </filter>
  </defs>
);

export const Bench3: React.FC<{c: Cam3}> = ({c}) => {
  const {x0, x1, d0, d1, top, slab} = BENCH;
  return (
    <g>
      {[x0 + 30, x1 - 60].map((x) => (
        <Box key={'b' + x} c={c} x0={x} x1={x + 30} d0={d0 + 20} d1={d0 + 50} h0={0} h1={top - slab} top={K.leg} front={K.leg} />
      ))}
      <Box c={c} x0={x0 + 30} x1={x1 - 30} d0={d0 + 30} d1={d1 - 30} h0={90} h1={102} top={K.steelDark} front="#3E4D58" />
      {[x0 + 30, x1 - 60].map((x) => (
        <Box key={'f' + x} c={c} x0={x} x1={x + 30} d0={d1 - 50} d1={d1 - 20} h0={0} h1={top - slab} top={K.leg} front={K.leg} />
      ))}
      <Box c={c} x0={x0} x1={x1} d0={d0} d1={d1} h0={top - slab} h1={top} top="url(#v3-benchTop)" front={K.steelFront} />
      <rect x={x0} y={projY(c, d1, top)} width={x1 - x0} height={5} fill="#E6EDF2" />
      <g transform={horiz(c, top)}>
        <ellipse cx={LIGHT.x} cy={0} rx={520} ry={230} fill="url(#v3-pool)" />
        {/* taped test area outlines */}
        {[[170, 430], [530, 960]].map(([a, b]) => (
          <g key={a}>
            <path d={`M ${a - 20} -110 l 0 -24 l 24 0 M ${b + 20} -110 l 0 -24 l -24 0 M ${a - 20} 110 l 0 24 l 24 0 M ${b + 20} 110 l 0 24 l -24 0`} stroke={K.floorLine} strokeWidth={6} fill="none" opacity={0.85} />
          </g>
        ))}
      </g>
    </g>
  );
};

export const TestBay: React.FC<{c: Cam3; pose: Pose3; glint?: number; hot?: number; squeeze?: number; screen?: React.ReactNode; light?: number}> = ({c, pose, glint, hot, squeeze, screen, light = 1}) => {
  const kn = knifeWorld(pose);
  const hBlade = (kn.edgeMid.h + kn.W(KN.handleFront, KN.spine).h) / 2;
  const shOp = Math.max(0.35, 0.8 - (hBlade - HAND3.palmTop) / 500);
  const handClip = 'v3-handTopClip';
  return (
    <g>
      <Wall3 c={c} />
      <Workstation3 c={c} screen={screen} />
      <RobotBase3 c={c} />
      <Bench3 c={c} />
      <g transform={horiz(c, BENCH.top)} filter="url(#v3-soft)">
        <path d={knifeShadowPath(pose, BENCH.top)} fill="#0E141A" opacity={Math.max(0.42, shOp * 0.85)} />
      </g>
      <CuttingBoard c={c} />
      <ApplePlanShape c={c} />
      <HandProp
        c={c}
        shadow={
          <g>
            <defs>
              <clipPath id={handClip}>
                {/* clipPath accepts shapes only, so each carries its own transform */}
                {HAND_PARTS.map((p, i) => (
                  <path key={i} transform={`${horiz(c, p.top(-20))} translate(${HAND3.x} 0)`} d={'M ' + p.pts.map(([x, d]) => `${x} ${d}`).join(' L ') + ' Z'} />
                ))}
              </clipPath>
            </defs>
            <g clipPath={`url(#${handClip})`}>
              <g transform={horiz(c, HAND3.palmTop)} filter="url(#v3-soft)">
                <path d={knifeShadowPath(pose, HAND3.palmTop)} fill="#3A1804" opacity={Math.min(0.9, shOp * 1.15)} />
              </g>
            </g>
          </g>
        }
      />
      {c.e < 40 && <PendantLight c={c} on={light} />}
      <Arm3 c={c} pose={pose} glint={glint} hot={hot} squeeze={squeeze} />
    </g>
  );
};
