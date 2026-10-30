// The patient, front view: an original design (a man in his fifties, short salt-and-pepper hair, stubble, hospital
// gown). Drawn in millimetres, origin midway between the eyes at eye level, y down. His right eye (screen left, EL)
// is the damaged eye that receives the implant; his left eye (screen right, ER) is the "other eye" whose lower lid
// holds the implant for months. Both corneas are scarred (bilateral corneal blindness).
import React from 'react';
import {clamp, hash, lerp} from './lib';
import {Implant, Rot, LAMINA, HOLE, rotM} from './implant';

export const EL: [number, number] = [-33, 0];
export const ER: [number, number] = [33, 0];
/** the eyes are drawn 1.25x life size against the face (a readability stylisation); the implant scales with them */
export const ES = 1.25;
const INK = '#3E241A';
const SKIN = '#D9A07B', SKIN_D = '#BF7F5D', SKIN_L = '#E9B994';

export type Expr = {brow: number; smile: number; open: number; squint: number};
export const NEUTRAL: Expr = {brow: 0, smile: 0, open: 0, squint: 0};
export type Pocket = {
  show: number;            // the implant is in the pocket (0/1)
  see: number;             // skin over the pocket turned translucent (0..1)
  incision: number;        // 0 none, 1 open
  sutured: number;         // sutures in
  heal: number;            // 0 fresh .. 1 healed (bruise and line fade)
  tissue: number; vessels: number;
  lift: number;            // 0 seated .. 1 lifted out of the pocket
};
export const NO_POCKET: Pocket = {show: 0, see: 0, incision: 0, sutured: 0, heal: 1, tissue: 0, vessels: 0, lift: 0};
export type FaceProps = {
  id: string; px: number;
  left: 'ookp' | 'mucosa' | 'scarred';  // the damaged eye's surface
  reveal: number;                       // cut-away of the mucosa over the lamina (OOKP)
  implRot: Rot;                         // OOKP implant orientation (a small orbit)
  parallax: number;                     // mm shift of the deep layer against the lids during the orbit
  expr: Expr;
  pocket: Pocket;
  pocketImplant?: {x: number; y: number; rot: Rot} | null; // where the implant is drawn when it is in or near the pocket
  light: number;                        // overall light level (time of day during "months")
};

// ---- eye shapes (relative to the eye centre; s = +1 for the screen-right eye so it mirrors) ----
export const upperLid = (s: number, sq: number) => {
  const m = (x: number) => x * s;
  return `M${m(-14.6)},${0.6} C${m(-9)},${-7.6 + sq} ${m(4)},${-7.9 + sq} ${m(14.4)},${1.2}`;
};
export const lowerLid = (s: number, sq: number) => {
  const m = (x: number) => x * s;
  return `M${m(14.4)},${1.2} C${m(6)},${6.6 - sq * 0.6} ${m(-6)},${6.8 - sq * 0.6} ${m(-14.6)},${0.6}`;
};
export const fissure = (s: number, sq: number) => upperLid(s, sq) + ' ' + lowerLid(s, sq).replace(/^M[^C]*/, '') + 'Z';

export const Lashes: React.FC<{s: number; sq: number; px: number}> = ({s, sq, px}) => {
  const out = [];
  for (let i = 0; i < 22; i++) {
    const u = 0.08 + 0.84 * (i / 21);
    // point on the upper lid bezier
    const P0 = [-14.6 * s, 0.6], P1 = [-9 * s, -7.6 + sq], P2 = [4 * s, -7.9 + sq], P3 = [14.4 * s, 1.2];
    const b = (k: number) => (1 - u) ** 3 * P0[k] + 3 * (1 - u) ** 2 * u * P1[k] + 3 * (1 - u) * u * u * P2[k] + u ** 3 * P3[k];
    const x = b(0), y = b(1);
    const len = 1.6 + 0.9 * Math.sin(u * Math.PI);
    const ang = (-90 - 35 * s + 70 * u * s) * (Math.PI / 180);
    out.push(<path key={i} d={`M${x},${y} q${Math.cos(ang) * len * 0.5},${Math.sin(ang) * len * 0.6 - 0.3} ${Math.cos(ang) * len},${Math.sin(ang) * len}`} stroke={INK} strokeWidth={1.6 * px} fill="none" strokeLinecap="round" />);
  }
  return <g>{out}</g>;
};

// the OOKP eye surface: oral mucosa over the lamina, the cylinder through it
const OokpSurface: React.FC<{id: string; px: number; reveal: number; rot: Rot; par: number; mucosaOnly?: boolean}> = ({id, px, reveal, rot, par, mucosaOnly}) => {
  const lam = 'M' + LAMINA.map(([x, y]) => `${(x - HOLE[0]).toFixed(2)},${((y - HOLE[1])).toFixed(2)}`).join('L') + 'Z';
  const R = rotM(rot);
  // the lamina's projected outline (for the bump in the mucosa), following the small orbit
  const lamP = 'M' + LAMINA.map(([x, y]) => {const ox = x - HOLE[0], oy = y - HOLE[1]; return `${(R[0][0] * ox + R[0][1] * oy + R[0][2] * 1.6 + par).toFixed(2)},${((R[1][0] * ox + R[1][1] * oy + R[1][2] * 1.6)).toFixed(2)}`;}).join('L') + 'Z';
  const vessels = [
    'M-13,-1 C-10,-2.4 -8,-1 -6,-2.6', 'M-13.5,2 C-11,1.3 -9.5,3 -7.6,2.6', 'M12.5,0.4 C10,-1 8.6,0.6 6.8,-0.8', 'M12.8,2.6 C10.6,2.2 9.6,3.6 7.4,3.2',
    'M-4,4.6 C-3,3.6 -1.4,4.4 0,3.6', 'M3,-4.8 C4.4,-3.6 6,-4.4 7.2,-3.4',
  ];
  return (
    <g>
      <defs>
        <radialGradient id={`${id}muc`} cx="0.42" cy="0.36" r="0.75"><stop offset="0" stopColor="#F2B7AF" /><stop offset="0.55" stopColor="#E3958E" /><stop offset="1" stopColor="#B9625F" /></radialGradient>
        <radialGradient id={`${id}rev`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#000" /><stop offset="0.72" stopColor="#000" /><stop offset="1" stopColor="#fff" /></radialGradient>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x={-30} y={-30} width={60} height={60}>
          <rect x={-30} y={-30} width={60} height={60} fill="#fff" />
          {/* the cut-away follows the lamina's own outline, growing out from the cylinder */}
          <g transform={`translate(${par},0) scale(${clamp(reveal) * 1.12 + 0.001})`}>
            <path d={lam} fill="#000" stroke="#000" strokeWidth={1.2} style={{filter: `blur(${0.5}px)`}} />
          </g>
        </mask>
      </defs>
      {/* deep layer: the lamina and the back of the cylinder */}
      {!mucosaOnly && <g transform="scale(1,-1)"><Implant id={`${id}im`} x={par} y={0} s={1} rot={{...rot, pitch: -rot.pitch}} px={px} piece="lamina" cylMode="eye" holeBg="#0C1218" glintFlip /></g>}
      {/* the mucosa: opaque except where cut away (there it is a faint film) */}
      <g mask={mucosaOnly ? undefined : `url(#${id}m)`}>
        <rect x={-20} y={-12} width={40} height={24} fill={`url(#${id}muc)`} />
        {vessels.map((d, i) => <path key={i} d={d} stroke="#B5444A" strokeWidth={0.22} fill="none" opacity={0.7} />)}
        {!mucosaOnly && (
          <g>
            {/* the lamina's bump under the graft */}
            <path d={lamP} fill="none" stroke="rgba(255,225,215,0.55)" strokeWidth={1.1} transform="translate(-0.35,-0.35)" style={{filter: 'blur(0.5px)'}} />
            <path d={lamP} fill="none" stroke="rgba(120,40,40,0.4)" strokeWidth={1.0} transform="translate(0.4,0.45)" style={{filter: 'blur(0.6px)'}} />
          </g>
        )}
      </g>
      {!mucosaOnly && reveal > 0.02 && (
        <g opacity={0.1 * clamp(reveal * 3)}>
          <g transform={`translate(${par},0) scale(${clamp(reveal) * 1.12})`}><path d={lam} fill="#E79A94" /></g>
        </g>
      )}
      {!mucosaOnly && reveal > 0.02 && (
        // the cut edge of the graft, a thin wet rim
        <g transform={`translate(${par},0) scale(${clamp(reveal) * 1.12})`} opacity={clamp(reveal * 4)}>
          <path d={lam} fill="none" stroke="#C9625E" strokeWidth={0.55 / Math.max(0.2, reveal * 1.12)} />
          <path d={lam} fill="none" stroke="rgba(255,235,228,0.8)" strokeWidth={0.18 / Math.max(0.2, reveal * 1.12)} transform="translate(-0.15,-0.15)" />
        </g>
      )}
      {/* the cylinder's front, through the graft */}
      {!mucosaOnly && <g transform="scale(1,-1)"><Implant id={`${id}cf`} x={par} y={0} s={1} rot={{...rot, pitch: -rot.pitch}} px={px} piece="lamina" cylMode="eye" only="cylFront" glintFlip /></g>}
    </g>
  );
};

// a scarred, vascularised cornea over a dim iris
const ScarredEye: React.FC<{id: string; px: number; s: number}> = ({id, px, s}) => (
  <g>
    <defs>
      <radialGradient id={`${id}scl`} cx="0.5" cy="0.45" r="0.6"><stop offset="0" stopColor="#FBEDE6" /><stop offset="1" stopColor="#E3B7AC" /></radialGradient>
      <radialGradient id={`${id}cor`} cx="0.45" cy="0.42" r="0.6"><stop offset="0" stopColor="#F4F2EE" /><stop offset="0.6" stopColor="#DCDCD8" /><stop offset="1" stopColor="#B9B4AE" /></radialGradient>
    </defs>
    <rect x={-16} y={-8} width={32} height={16} fill={`url(#${id}scl)`} />
    {['M-14,-0.5 C-11,-1.6 -9,0 -6.5,-1', 'M14,0.8 C11,0 9.6,1.6 6.8,0.8', 'M-13.6,2.4 C-11,2 -9,3.4 -6.8,2.6', 'M13.5,-1.4 C11,-2.2 9.4,-0.8 6.9,-1.6'].map((d, i) => (
      <path key={i} d={d} stroke="#C2484E" strokeWidth={0.2} fill="none" opacity={0.75} />
    ))}
    <circle cx={0} cy={0.2} r={5.7} fill="#7C6A55" />
    <circle cx={0} cy={0.2} r={5.7} fill={`url(#${id}cor)`} opacity={0.9} />
    {/* irregular opaque scar */}
    <path d="M-3.6,-2.6 C-1,-4.2 2.8,-3.4 3.9,-1 C5,1.6 3,3.8 0.4,3.9 C-2.6,4 -4.6,2 -4.4,-0.4 Z" fill="#FAFAF7" opacity={0.85} />
    {/* vessels creeping in from the limbus */}
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i / 6) * 2 * Math.PI + 0.4 * s;
      const x0 = 5.6 * Math.cos(a), y0 = 0.2 + 5.6 * Math.sin(a), x1 = 3.1 * Math.cos(a + 0.25), y1 = 0.2 + 3.1 * Math.sin(a + 0.25);
      return <path key={i} d={`M${x0},${y0} Q${(x0 + x1) / 2 + 0.6},${(y0 + y1) / 2 - 0.5} ${x1},${y1}`} stroke="#C4525A" strokeWidth={0.2} fill="none" opacity={0.8} />;
    })}
    <circle cx={0} cy={0.2} r={5.7} fill="none" stroke="rgba(80,60,50,0.45)" strokeWidth={1.2 * px} />
    <ellipse cx={-1.6} cy={-1.8} rx={1.1} ry={0.7} fill="rgba(255,255,255,0.8)" transform="rotate(-25 -1.6 -1.8)" />
  </g>
);

export const Face: React.FC<FaceProps> = (p) => {
  const {id, px, expr, pocket, light} = p;
  const brY = -expr.brow * 3.2;
  const sq = expr.squint * 1.4 + expr.smile * 0.6;
  // mouth
  const mw = 19 + expr.smile * 2.5, cornerY = 72 - expr.smile * 4.2, midY = 72.6 + expr.smile * 1.4;
  const op = expr.open * 5.5;
  const epx = px / ES;
  const sqL = sq - (p.left === 'ookp' ? 2.0 : 0);
  const eyeL = (
    <g transform={`translate(${EL[0]},${EL[1]}) scale(${ES})`}>
      <defs><clipPath id={`${id}fl`}><path d={fissure(-1, sqL)} /></clipPath></defs>
      <g clipPath={`url(#${id}fl)`}>
        {p.left === 'scarred' ? <ScarredEye id={`${id}sl`} px={epx} s={-1} /> : <OokpSurface id={`${id}ok`} px={epx} reveal={p.reveal} rot={p.implRot} par={p.parallax} mucosaOnly={p.left === 'mucosa'} />}
        {/* lid shadow on the globe */}
        <path d={upperLid(-1, sqL) + ' L14.4,-8 L-14.6,-8 Z'} fill="rgba(60,20,10,0.28)" transform="translate(0,1.1)" style={{filter: 'blur(0.6px)'}} />
      </g>
      <path d={fissure(-1, sqL)} fill="none" stroke={INK} strokeWidth={2.2 * epx} strokeLinejoin="round" />
      <path d={upperLid(-1, sqL)} fill="none" stroke={INK} strokeWidth={3.4 * epx} strokeLinecap="round" />
      <Lashes s={-1} sq={sqL} px={epx} />
      {/* caruncle */}
      <path d="M14.4,1.2 q-1.6,-1.2 -2.6,0.1 q1.2,1.2 2.6,-0.1Z" fill="#D9817B" />
    </g>
  );
  const eyeR = (
    <g transform={`translate(${ER[0]},${ER[1]}) scale(${ES})`}>
      <defs><clipPath id={`${id}fr`}><path d={fissure(1, sq)} /></clipPath></defs>
      <g clipPath={`url(#${id}fr)`}>
        <ScarredEye id={`${id}sr`} px={epx} s={1} />
        <path d={upperLid(1, sq) + ' L14.4,-8 L-14.6,-8 Z'} fill="rgba(60,20,10,0.28)" transform="translate(0,1.1)" style={{filter: 'blur(0.6px)'}} />
      </g>
      <path d={fissure(1, sq)} fill="none" stroke={INK} strokeWidth={2.2 * epx} strokeLinejoin="round" />
      <path d={upperLid(1, sq)} fill="none" stroke={INK} strokeWidth={3.4 * epx} strokeLinecap="round" />
      <Lashes s={1} sq={sq} px={epx} />
      <path d="M-14.6,0.6 q1.6,-1.2 2.6,0.1 q-1.2,1.2 -2.6,-0.1Z" fill="#D9817B" />
    </g>
  );
  // the pocket under the right-hand eye's lower lid
  const pk = pocket;
  const pi = p.pocketImplant;
  const POCKET: [number, number] = [37, 27.5];
  const bruise = pk.show > 0 ? clamp(1 - pk.heal) : 0;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}sk`} x1="0" y1="0" x2="1" y2="0.2"><stop offset="0" stopColor={SKIN_L} /><stop offset="0.5" stopColor={SKIN} /><stop offset="1" stopColor={SKIN_D} /></linearGradient>
        <radialGradient id={`${id}fsh`} cx="0.42" cy="0.38" r="0.7"><stop offset="0.55" stopColor="rgba(0,0,0,0)" /><stop offset="1" stopColor="rgba(90,40,20,0.35)" /></radialGradient>
        <linearGradient id={`${id}gown`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B9D3E0" /><stop offset="1" stopColor="#8FB1C4" /></linearGradient>
        <pattern id={`${id}gp`} width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="none" /><path d="M4.5,2 L6,4.5 L4.5,7 L3,4.5Z" fill="#7FA2B6" opacity="0.7" /></pattern>
      </defs>
      {/* shoulders, gown */}
      <path d="M-150,260 C-140,175 -95,150 -42,140 L42,140 C95,150 140,175 150,260 Z" fill={`url(#${id}gown)`} stroke={INK} strokeWidth={2.6 * px} />
      <path d="M-150,260 C-140,175 -95,150 -42,140 L42,140 C95,150 140,175 150,260 Z" fill={`url(#${id}gp)`} />
      {/* neck */}
      <path d="M-34,95 L-36,146 C-18,160 18,160 36,146 L34,95 Z" fill={SKIN_D} stroke={INK} strokeWidth={2.4 * px} />
      <path d="M-42,140 C-20,166 20,166 42,140" fill="none" stroke="#7FA2B6" strokeWidth={5} />
      <path d="M-42,140 C-20,166 20,166 42,140" fill="none" stroke={INK} strokeWidth={2.2 * px} />
      {/* ears */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M${s * 66},2 C${s * 82},-6 ${s * 84},26 ${s * 74},40 C${s * 70},46 ${s * 66},42 ${s * 64},34`} fill={SKIN} stroke={INK} strokeWidth={2.4 * px} />
          <path d={`M${s * 70},8 C${s * 78},6 ${s * 78},24 ${s * 71},32`} fill="none" stroke={SKIN_D} strokeWidth={1.6} />
        </g>
      ))}
      {/* head */}
      <path d="M0,-118 C40,-118 68,-92 70,-48 C72,-20 72,10 68,36 C64,70 46,104 22,118 C10,124 -10,124 -22,118 C-46,104 -64,70 -68,36 C-72,10 -72,-20 -70,-48 C-68,-92 -40,-118 0,-118 Z" fill={`url(#${id}sk)`} stroke={INK} strokeWidth={2.8 * px} />
      <path d="M0,-118 C40,-118 68,-92 70,-48 C72,-20 72,10 68,36 C64,70 46,104 22,118 C10,124 -10,124 -22,118 C-46,104 -64,70 -68,36 C-72,10 -72,-20 -70,-48 C-68,-92 -40,-118 0,-118 Z" fill={`url(#${id}fsh)`} />
      {/* stubble */}
      <path d="M-62,52 C-56,82 -40,106 -20,116 C-8,121 8,121 20,116 C40,106 56,82 62,52 C50,70 30,62 18,84 C10,92 -10,92 -18,84 C-30,62 -50,70 -62,52 Z" fill="#6E4A3A" opacity={0.22} />
      {Array.from({length: 120}, (_, i) => {
        const a = hash(i * 3.1), b = hash(i * 7.7);
        const x = -55 + 110 * a, y = 60 + 55 * b - Math.abs(x) * 0.25;
        if (Math.abs(x) < 16 && y < 86) return null;
        return <circle key={i} cx={x} cy={y} r={0.45} fill="#4A2E24" opacity={0.35} />;
      })}
      {/* hair */}
      <path d="M-70,-44 C-74,-86 -48,-120 0,-121 C48,-120 74,-86 70,-44 C66,-62 62,-70 54,-76 C34,-84 18,-80 0,-82 C-18,-80 -34,-84 -54,-76 C-62,-70 -66,-62 -70,-44 Z" fill="#4C4743" stroke={INK} strokeWidth={2.4 * px} />
      <path d="M-70,-44 C-70,-60 -66,-70 -58,-76 C-60,-64 -64,-54 -66,-36 Z M70,-44 C70,-60 66,-70 58,-76 C60,-64 64,-54 66,-36 Z" fill="#9B9590" />
      {Array.from({length: 26}, (_, i) => {
        const x = -60 + 120 * (i / 25), y = -84 - 26 * Math.sin((i / 25) * Math.PI);
        return <path key={i} d={`M${x},${y + 8} q${2 - 4 * hash(i)},-6 ${3 - 6 * hash(i + 9)},-11`} stroke="#7E7873" strokeWidth={0.8} fill="none" opacity={0.7} />;
      })}
      {/* forehead lines */}
      {[0, 1].map((i) => <path key={i} d={`M-26,${-52 - i * 8 + brY * 0.5} C-8,${-55 - i * 8 + brY * 0.6} 8,${-55 - i * 8 + brY * 0.6} 26,${-52 - i * 8 + brY * 0.5}`} stroke={SKIN_D} strokeWidth={0.9 + expr.brow * 0.6} fill="none" opacity={0.7} />)}
      {/* brows */}
      {[-1, 1].map((s) => (
        <path key={s} d={`M${s * 14},${-15 + brY * 0.8} C${s * 22},${-22.5 + brY * 1.15} ${s * 40},${-23.5 + brY} ${s * 52},${-15 + brY * 0.6} C${s * 40},${-18.6 + brY} ${s * 24},${-17.6 + brY * 1.1} ${s * 14},${-11.4 + brY * 0.8} Z`} fill="#5E5650" stroke={INK} strokeWidth={1.4 * px} />
      ))}
      {/* upper lid creases and under-eye */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M${s * 19},-7.4 C${s * 25},${-13.6 + sq * 0.5} ${s * 40},${-14 + sq * 0.5} ${s * 49},-4.4`} stroke={SKIN_D} strokeWidth={1.3} fill="none" />
          <path d={`M${s * 21},11 C${s * 28},${13.6 - expr.smile} ${s * 40},${13.6 - expr.smile} ${s * 47},8.2`} stroke={SKIN_D} strokeWidth={0.9} fill="none" opacity={0.8} />
        </g>
      ))}
      {eyeL}
      {eyeR}
      {/* nose */}
      <path d="M-5,-6 C-6,10 -8,26 -12,38 C-14,44 -10,47 -6,45 C-3,48 3,48 6,45 C10,47 14,44 12,38 C8,26 6,10 5,-6" fill="none" stroke={SKIN_D} strokeWidth={1.6} />
      <path d="M-12,38 C-15,44 -10,48 -5.5,45.5 M12,38 C15,44 10,48 5.5,45.5" fill="none" stroke={INK} strokeWidth={2 * px} strokeLinecap="round" />
      <ellipse cx={-5.6} cy={45.3} rx={2.4} ry={1.2} fill="#7A4434" />
      <ellipse cx={5.6} cy={45.3} rx={2.4} ry={1.2} fill="#7A4434" />
      <ellipse cx={0} cy={38} rx={5} ry={4} fill={SKIN_L} opacity={0.6} />
      {/* nasolabial folds */}
      <path d={`M-14,44 C-20,${54 - expr.smile * 2} ${-22 - expr.smile * 2},${64 - expr.smile * 2} ${-22 - expr.smile * 3},${76 - expr.smile * 3}`} stroke={SKIN_D} strokeWidth={1.3 + expr.smile} fill="none" />
      <path d={`M14,44 C20,${54 - expr.smile * 2} ${22 + expr.smile * 2},${64 - expr.smile * 2} ${22 + expr.smile * 3},${76 - expr.smile * 3}`} stroke={SKIN_D} strokeWidth={1.3 + expr.smile} fill="none" />
      {/* mouth */}
      <path d={`M${-mw},${cornerY} C${-mw * 0.5},${midY - 3 - op * 0.2} ${mw * 0.5},${midY - 3 - op * 0.2} ${mw},${cornerY} C${mw * 0.5},${midY + op} ${-mw * 0.5},${midY + op} ${-mw},${cornerY} Z`} fill={op > 0.3 ? '#5A2320' : '#B56B5E'} stroke={INK} strokeWidth={2.2 * px} strokeLinejoin="round" />
      {op > 0.3 && <path d={`M${-mw * 0.7},${cornerY + 0.6} C${-mw * 0.4},${midY - 2.2} ${mw * 0.4},${midY - 2.2} ${mw * 0.7},${cornerY + 0.6} L${mw * 0.6},${cornerY + 1.8 + op * 0.25} C${mw * 0.3},${midY + op * 0.25} ${-mw * 0.3},${midY + op * 0.25} ${-mw * 0.6},${cornerY + 1.8 + op * 0.25} Z`} fill="#F4EEE4" />}
      <path d={`M${-mw * 0.8},${midY + 4 + op} C${-mw * 0.3},${midY + 7 + op} ${mw * 0.3},${midY + 7 + op} ${mw * 0.8},${midY + 4 + op}`} stroke={SKIN_D} strokeWidth={1.2} fill="none" opacity={0.6} />
      {/* the pocket below the other eye */}
      {pk.show > 0 && (
        <g>
          {/* bruising, fading as it heals */}
          <ellipse cx={POCKET[0] - 3} cy={POCKET[1]} rx={15} ry={9} fill="#8C5A84" opacity={0.28 * bruise} style={{filter: 'blur(2px)'}} />
          {pi && (
            <g>
              <defs>
                <radialGradient id={`${id}pm`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fff" /><stop offset="0.7" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
                <mask id={`${id}pmk`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={400} height={400}><ellipse cx={POCKET[0] - 3} cy={POCKET[1] + 0.5} rx={13.5 + 120 * pk.lift} ry={8.5 + 90 * pk.lift} fill={`url(#${id}pm)`} /></mask>
              </defs>
              {/* seen through the translucent skin while it is in the pocket */}
              <g mask={`url(#${id}pmk)`} opacity={Math.max(clamp(pk.see), clamp(pk.lift * 3))}>
                <Implant id={`${id}pi`} x={pi.x} y={pi.y} s={ES} rot={pi.rot} px={px} cylMode="clear" tissue={pk.tissue} vessels={pk.vessels} holeBg="#C98B7A" />
              </g>
              {pk.see > 0 && pk.lift < 0.5 && (
                <ellipse cx={POCKET[0] - 3} cy={POCKET[1] + 0.5} rx={13.5} ry={8.5} fill="none" stroke="rgba(255,240,230,0.3)" strokeWidth={0.4} opacity={clamp(pk.see) * 0.6} style={{filter: 'blur(0.4px)'}} />
              )}
              {/* the bump in the skin when it is not see-through */}
              {pk.lift < 0.5 && (
                <ellipse cx={POCKET[0] - 3} cy={POCKET[1]} rx={9} ry={5} fill="none" stroke="rgba(255,225,200,0.5)" strokeWidth={1.4} opacity={(1 - pk.see) * 0.8} transform="translate(-0.5,-0.6)" style={{filter: 'blur(0.8px)'}} />
              )}
            </g>
          )}
          {/* the incision just below the lashes, then the sutures, then the healed line */}
          {pk.incision > 0 && (
            <g opacity={clamp(1 - pk.heal * 0.85)}>
              <path d={`M${ER[0] - 9},16.2 C${ER[0] - 2},${17.8} ${ER[0] + 6},${17.6} ${ER[0] + 12},15.2`} stroke="#8E2E2E" strokeWidth={0.5 + 0.9 * pk.incision * (1 - pk.sutured)} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(pk.incision)} />
              {pk.sutured > 0 && [0, 1, 2, 3, 4].map((k) => {
                const x = ER[0] - 7 + k * 4.4, y = 17.2 - Math.abs(k - 2) * 0.3;
                return <path key={k} d={`M${x - 0.7},${y - 0.9} L${x + 0.7},${y + 0.9} M${x + 0.7},${y - 0.9} L${x - 0.7},${y + 0.9}`} stroke="#23313F" strokeWidth={0.3} opacity={clamp(pk.sutured * 5 - k) * clamp(1 - pk.heal * 1.3)} />;
              })}
            </g>
          )}
        </g>
      )}
      {/* light (the passing of days and nights in "months") */}
      {light !== 1 && <rect x={-200} y={-200} width={400} height={500} fill={light < 1 ? '#0E1A2E' : '#FFE9C4'} opacity={Math.abs(1 - light) * (light < 1 ? 0.55 : 0.35)} />}
    </g>
  );
};
export const POCKET_AT: [number, number] = [37, 27.5];
