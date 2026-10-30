// The patient in profile (facing right), with two local cut-aways: a sagittal section of the damaged eye, and the
// upper jaw where the canine is taken. Millimetres, the eye's centre at the origin, y down.
// Eye section geometry: globe radius 12; cornea front radius 7.8 (apex x=13.1), limbus y=+-5.75; fovea on the axis
// at the back. The implant sits with its lamina mid-plane at x=14.9 (see ImplantSection).
import React from 'react';
import {clamp, hash, lerp} from './lib';
import {CROWN, ROOT, BLOCK, faceMatrix, ImplantSection, Rot, rootW, SECTION_EXTENT} from './implant';

const INK = '#3E241A';
const SKIN = '#D9A07B', SKIN_D = '#BF7F5D', SKIN_L = '#E9B994';
export const LAM_X = 14.9;
export const FOVEA: [number, number] = [-10.6, 0.4];
export const CANINE_AT: [number, number] = [24.65, 44.0]; // where the canine's hole-axis anchor sits in the jaw
export const CANINE_ROT: Rot = {yaw: 0, pitch: 0, roll: -90};

const HEAD = 'M-45,-112 C-10,-116 10,-100 12,-84 C16,-64 17,-44 20,-20 C21,-14 20,-10 19,-8 C24,4 34,18 42,28 C46,33 45,37 40,38 C36,39 33,39 31,40 C33,43 35,46 34,49 C33,52 31,54 30,55 C32,57 34,59 33,61 C32,64 29,67 27,69 C26,72 28,76 30,82 C32,88 30,95 24,99 C14,104 0,106 -8,108 L-10,150 L-78,150 C-80,120 -82,90 -92,60 C-104,30 -114,-10 -110,-44 C-104,-84 -80,-108 -45,-112 Z';
const EYE_WIN = 'M-31,-6 C-31,-18 -20,-25 -4,-25 C6,-25 14,-22 17.5,-17 C19.5,-10 20,8 18.5,15 C15,22 6,25 -6,25 C-22,25 -31,16 -31,6 Z';
const JAW_WIN = 'M-6,30 C-4,24 10,22 22,24 C30,25 36,30 37,38 C38,46 37,56 33,62 C28,66 16,67 4,66 C-4,65 -8,58 -8,48 Z';

export type EyeState = {
  scar: number;            // corneal scarring (opacity)
  irisLens: number;        // natural iris + lens present (1) .. removed (0)
  donor: number;           // donor cornea: 0 away (to the right) .. 1 seated
  donorCloud: number;      // the graft clouds over and vessels grow in
  mucosa: number;          // the oral-mucosa graft over the front (0/1)
  flap: number;            // the graft lifted (0 down .. 1 up)
  trephine: number;        // the central corneal disc removed (0 .. 1 gone)
  implant: number;         // implant presence 0..1
  implantDx: number;       // implant offset along x while it arrives (mm)
  seat: number;            // graft shape: 0 on the cornea .. 1 over the implant
  tissue: number;
  lidFwd: number;          // lids drape forward over the implant (0..1)
  rays: 'none' | 'scatter' | 'clear' | 'donor';
  rayT: number;            // ray progress 0..1
  glow: number;            // retina lit (focused)
  haze: number;            // diffuse dim light on the retina
};
export const EYE0: EyeState = {scar: 0, irisLens: 0, donor: 0, donorCloud: 0, mucosa: 1, flap: 0, trephine: 1, implant: 1, implantDx: 0, seat: 1, tissue: 1, lidFwd: 1, rays: 'none', rayT: 0, glow: 0, haze: 0};

const pts = (f: (u: number) => [number, number], n: number) => Array.from({length: n + 1}, (_, i) => f(i / n));
const poly = (p: [number, number][], close = false) => 'M' + p.map((q) => `${q[0].toFixed(3)},${q[1].toFixed(3)}`).join('L') + (close ? 'Z' : '');
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 48) => pts((u) => {const a = (a0 + (a1 - a0) * u) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)];}, n);
const LIMB = Math.asin(5.75 / 12) * 180 / Math.PI;

// the graft's front path: on the cornea (seat 0) or over the implant (seat 1); hinge at the upper fornix
const graftPath = (seat: number, flap: number) => {
  const N = 40;
  const onCornea = pts((u) => {
    const y = lerp(-11.5, 11.5, u);
    const yc = clamp(y, -5.7, 5.7);
    const xc = 5.3 + Math.sqrt(7.8 * 7.8 - yc * yc);
    const xs = Math.sqrt(Math.max(0, 12.3 * 12.3 - y * y));
    const x = Math.abs(y) <= 5.7 ? xc : xs - (Math.abs(y) - 5.7) * 0.15;
    return [x + 0.15, y];
  }, N);
  const onImpl = pts((u) => {
    const y = lerp(-11.5, 11.5, u);
    const top = SECTION_EXTENT.top - 0.6, bot = SECTION_EXTENT.bot + 0.6;
    if (y >= top && y <= bot) return [LAM_X + 1.6 + 0.65, y];
    const xs = Math.sqrt(Math.max(0, 12.3 * 12.3 - y * y));
    const edge = y < top ? top : bot;
    const k = clamp((Math.abs(y - edge)) / 4);
    return [lerp(LAM_X + 2.25, xs + 0.15, Math.sqrt(k)), y];
  }, N);
  const hinge: [number, number] = onImpl[0];
  return onCornea.map((p, i) => {
    let x = lerp(p[0], onImpl[i][0], seat), y = lerp(p[1], onImpl[i][1], seat);
    if (flap > 0) {
      // lift: rotate about the upper fornix, more toward the free end
      const a = -flap * 1.9 * (i / N);
      const dx = x - hinge[0], dy = y - hinge[1];
      x = hinge[0] + dx * Math.cos(a) - dy * Math.sin(a) + flap * 5 * (i / N);
      y = hinge[1] + dx * Math.sin(a) + dy * Math.cos(a);
    }
    return [x, y] as [number, number];
  });
};

export const Rays: React.FC<{st: EyeState; px: number; id: string}> = ({st, px, id}) => {
  if (st.rays === 'none') return null;
  const T = st.rayT;
  const n = 7;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const yy = lerp(-1.25, 1.25, i / (n - 1));
    if (st.rays === 'clear' || st.rays === 'donor') {
      const entry = st.rays === 'clear' ? 18.7 : 13.2;
      const path: [number, number][] = [[46, yy], [entry, yy], [st.rays === 'clear' ? 9.4 : 12.4, yy * (st.rays === 'clear' ? 0.92 : 0.85)], [FOVEA[0] + 0.05, FOVEA[1] + yy * 0.05]];
      els.push(<path key={i} d={poly(path)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(T * 1.15 - i * 0.02)} />);
    } else {
      // scattered: the rays reach the scar and break up
      els.push(<path key={i} d={poly([[46, yy], [13.3, yy]])} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(T * 2.2 - i * 0.03)} />);
      for (let k = 0; k < 5; k++) {
        const a = (hash(i * 13 + k * 3.7) - 0.5) * 2.6 + Math.PI;
        const L = 3 + 9 * hash(i * 5 + k * 11);
        const u = clamp((T - 0.45 - k * 0.04) * 2.2);
        if (u <= 0) continue;
        els.push(<path key={`${i}s${k}`} d={poly([[12.6, yy + (hash(k + i) - 0.5)], [12.6 + Math.cos(a) * L * u, yy + Math.sin(a) * L * u]])} opacity={0.9 * (1 - u * 0.5)} strokeWidth={3 * px} />);
      }
    }
  }
  return (
    <g fill="none" stroke="#FFE6A0" strokeWidth={3.2 * px} strokeLinecap="round">
      <g style={{filter: `blur(${4 * px}px)`}} opacity={0.8} stroke="#FFD36B" strokeWidth={9 * px}>{els}</g>
      <g>{els}</g>
    </g>
  );
};

export const EyeSection: React.FC<{st: EyeState; px: number; id: string}> = ({st, px, id}) => {
  const lidF = st.lidFwd * 2.6;
  // eyelids in section: skin outside, a thin band of muscle, the tarsal plate at the margin, conjunctiva inside
  const lid = (sg: number) => {
    const f = lidF;
    const outer: [number, number][] = [[17.6, -19 * sg], [18.0 + f * 0.3, -13 * sg], [17.0 + f * 0.8, -8.4 * sg], [15.7 + f, (-5.4 - f * 0.5) * sg], [15.0 + f, (-4.3 - f * 0.9) * sg]];
    const inner: [number, number][] = [[13.8 + f * 0.8, (-4.2 - f * 0.9) * sg], [12.4 + f * 0.5, (-5.6 - f * 0.4) * sg], [10.6, -8.0 * sg], [8.4, -10.0 * sg], [5.8, -11.5 * sg], [4.0, -12.2 * sg], [5.0, -14.0 * sg], [9.0, -16.6 * sg], [13.0, -18.6 * sg]];
    return {all: poly([...outer, ...inner], true), outer: poly(outer), inner: poly(inner.slice(0, 6)),
      tarsus: poly([[15.0 + f, (-4.4 - f * 0.9) * sg], [15.5 + f, (-7.6 - f * 0.5) * sg], [14.4 + f * 0.6, (-8.4 - f * 0.3) * sg], [13.2 + f * 0.6, (-5.0 - f * 0.7) * sg]], true)};
  };
  const lids = [lid(1), lid(-1)];
  const sclera = poly([...arc(0, 0, 12, LIMB, 360 - LIMB), ...arc(0, 0, 11.3, 360 - LIMB, LIMB)], true);
  const choroid = poly([...arc(0, 0, 11.3, 34, 326), ...arc(0, 0, 10.95, 326, 34)], true);
  const retina = poly([...arc(0, 0, 10.95, 40, 320), ...arc(0, 0, 10.45, 320, 40)], true);
  // cornea, split into the rim and the central disc (trephined)
  const corneaPart = (y0: number, y1: number) => {
    const f = pts((u) => {const y = lerp(y0, y1, u); return [5.3 + Math.sqrt(7.8 * 7.8 - y * y), y];}, 20);
    const b = pts((u) => {const y = lerp(y1, y0, u) * 0.97; return [6.0 + Math.sqrt(6.6 * 6.6 - y * y) - 0.05, y];}, 20);
    return poly([...f, ...b], true);
  };
  const discOff = st.trephine * 9;
  const gp = graftPath(st.seat, st.flap);
  const graft = poly([...gp, ...gp.slice().reverse().map(([x, y]) => [x - 1.0, y] as [number, number])], true);
  const scarOp = clamp(st.scar);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}vit`} cx="0.4" cy="0.45" r="0.6"><stop offset="0" stopColor="#E7EEF0" /><stop offset="1" stopColor="#C9D8DD" /></radialGradient>
        <radialGradient id={`${id}glow`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFF4C2" /><stop offset="0.4" stopColor="#FFD56A" stopOpacity="0.85" /><stop offset="1" stopColor="#FFB040" stopOpacity="0" /></radialGradient>
      </defs>
      {/* orbital fat, muscles, nerve */}
      <path d={EYE_WIN} fill="#E9C77E" />
      {Array.from({length: 60}, (_, i) => {
        const x = -30 + 50 * hash(i * 1.3), y = -24 + 48 * hash(i * 2.9);
        return <circle key={i} cx={x} cy={y} r={1.6 + 1.4 * hash(i * 4.1)} fill="none" stroke="#D2A95C" strokeWidth={0.25} opacity={0.6} />;
      })}
      <path d="M-31,-21 C-20,-20.5 -6,-19 6,-19.6 L14,-21 L14,-25 L-31,-25 Z" fill="#EFE2C8" stroke="#C8B48F" strokeWidth={0.4} />
      <path d="M-31,20 C-20,19.5 -6,18.4 6,18.8 L13,20 L13,25 L-31,25 Z" fill="#EFE2C8" stroke="#C8B48F" strokeWidth={0.4} />
      <path d="M-31,-11.5 C-20,-12.8 -8,-13.4 -2,-12.3 L-2,-10.6 C-8,-11.2 -20,-9.8 -31,-8.6 Z" fill="#BF5A50" />
      <path d="M-31,11 C-20,12.4 -8,13 -2,12.1 L-2,10.4 C-8,10.9 -20,9.4 -31,8.2 Z" fill="#BF5A50" />
      <path d="M-11.6,-1.4 C-18,-1 -25,0 -31,1.2 L-31,5.6 C-25,4.6 -18,3.8 -11.6,3.4 Z" fill="#F1E3B9" stroke="#C9AE79" strokeWidth={0.4} />
      {/* the globe */}
      <circle cx={0} cy={0} r={11.3} fill={`url(#${id}vit)`} />
      <path d={retina} fill="#E59A6E" />
      <path d={choroid} fill="#8E3B33" />
      <path d={sclera} fill="#F7F4EE" stroke={INK} strokeWidth={1.8 * px} />
      {/* retina glow / haze */}
      {st.haze > 0 && <path d={retina} fill="#FFE2A6" opacity={0.35 * st.haze} />}
      {st.glow > 0 && <circle cx={FOVEA[0]} cy={FOVEA[1]} r={2.2 + 3.5 * st.glow} fill={`url(#${id}glow)`} opacity={clamp(st.glow * 1.3)} />}
      {st.glow > 0 && <path d={retina} fill="none" stroke="#FFD27A" strokeWidth={0.5} opacity={0.6 * st.glow} />}
      {Array.from({length: 90}, (_, i) => {
        // rods and cones round the fovea, drawn only for the close-up
        const a = (172 + 16 * (i / 89) + (hash(i) - 0.5) * 0.08) * Math.PI / 180;
        const r0 = 10.5, r1 = 10.86 - (i % 3 === 0 ? 0.08 : 0);
        const x0 = r0 * Math.cos(a), y0 = r0 * Math.sin(a), x1 = r1 * Math.cos(a), y1 = r1 * Math.sin(a);
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={i % 3 === 0 ? '#E07A4E' : '#F2B27C'} strokeWidth={i % 3 === 0 ? 0.05 : 0.032} strokeLinecap="round" />;
      })}
      {st.glow > 0 && Array.from({length: 90}, (_, i) => {
        const a = (172 + 16 * (i / 89)) * Math.PI / 180, r = 10.68;
        const d = Math.abs(i - 44) / 45;
        return <circle key={`g${i}`} cx={r * Math.cos(a)} cy={r * Math.sin(a)} r={0.05} fill="#FFF3B8" opacity={st.glow * (1 - d) * 0.9} />;
      })}
      {/* iris and natural lens */}
      {st.irisLens > 0 && (
        <g opacity={clamp(st.irisLens)} transform={`translate(${(1 - st.irisLens) * 6},0)`}>
          <ellipse cx={8.4} cy={0} rx={1.9} ry={4.4} fill="rgba(235,232,210,0.85)" stroke="#9C9478" strokeWidth={1.2 * px} />
          <path d="M10.6,-5.6 L10.2,-1.9 L10.7,-1.9 L11.0,-5.7 Z M10.6,5.6 L10.2,1.9 L10.7,1.9 L11.0,5.7 Z" fill="#6E4B2E" />
          <path d="M9.4,-6.6 C8.6,-6.2 8.4,-5.4 9.0,-4.9 M9.4,6.6 C8.6,6.2 8.4,5.4 9.0,4.9" stroke="#9C4E3E" strokeWidth={0.9} fill="none" />
        </g>
      )}
      {/* cornea: rim and central disc */}
      <path d={corneaPart(-5.75, -1.85)} fill="rgba(215,238,246,0.9)" stroke={INK} strokeWidth={1.5 * px} />
      <path d={corneaPart(1.85, 5.75)} fill="rgba(215,238,246,0.9)" stroke={INK} strokeWidth={1.5 * px} />
      {st.trephine < 1 && (
        <g transform={`translate(${discOff},0)`} opacity={clamp(1.4 - st.trephine * 1.4)}>
          <path d={corneaPart(-1.9, 1.9)} fill="rgba(215,238,246,0.9)" stroke={INK} strokeWidth={1.5 * px} />
        </g>
      )}
      {scarOp > 0 && (
        <g opacity={scarOp}>
          {([[-5.7, -1.85], [1.85, 5.7]] as [number, number][]).map(([a, b], i) => <path key={i} d={corneaPart(a, b)} fill="#F6F4EE" stroke="#FFFFFF" strokeWidth={0.9} strokeLinejoin="round" />)}
          {st.trephine < 1 && (
            <g transform={`translate(${discOff},0)`} opacity={clamp(1.4 - st.trephine * 1.4)}><path d={corneaPart(-1.9, 1.9)} fill="#F6F4EE" stroke="#FFFFFF" strokeWidth={0.9} strokeLinejoin="round" /></g>
          )}
          {[[-4.2, -2], [2.2, 4.5]].map(([a, b], i) => <path key={i} d={`M${5.3 + Math.sqrt(60.84 - a * a) - 0.3},${a} Q12.2,${(a + b) / 2} ${5.3 + Math.sqrt(60.84 - b * b) - 0.3},${b}`} stroke="#C4525A" strokeWidth={0.28} fill="none" />)}
        </g>
      )}
      {/* donor cornea (a normal transplant), which clouds over */}
      {st.donor > 0 && (
        <g transform={`translate(${(1 - st.donor) * 30},0)`}>
          <path d={corneaPart(-4.0, 4.0)} fill="rgba(170,225,248,0.95)" stroke="#2C6A86" strokeWidth={2.2 * px} />
          <path d={corneaPart(-4.0, 4.0)} fill="#F2F0EA" stroke="#FFFFFF" strokeWidth={0.8} opacity={clamp(st.donorCloud)} />
          {[[-3.8, -1.2], [3.8, 1.4], [-3.6, 0.6], [3.5, -0.8]].map(([a, b], i) => (
            <path key={i} d={`M${5.3 + Math.sqrt(60.84 - a * a) - 0.25},${a} L${5.3 + Math.sqrt(60.84 - b * b) - 0.25},${b}`} stroke="#B9343E" strokeWidth={0.2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(st.donorCloud * 1.4 - i * 0.12)} />
          ))}
          {/* sutures */}
          {[-3.6, 3.6].map((yy, i) => <path key={i} d={`M${5.3 + Math.sqrt(60.84 - yy * yy) - 0.8},${yy - 0.5} l1.4,1`} stroke="#1E2B3A" strokeWidth={0.18} />)}
        </g>
      )}
      {/* the implant */}
      {st.implant > 0 && (
        <g opacity={clamp(st.implant * 3)}>
          <ImplantSection id={`${id}is`} x={LAM_X + st.implantDx} y={0} px={px} tissue={st.tissue} />
        </g>
      )}
      {/* the oral-mucosa graft */}
      {st.mucosa > 0 && (
        <g opacity={clamp(st.mucosa)}>
          <path d={graft} fill="#E1928B" stroke="#A9534F" strokeWidth={1.2 * px} />
          {st.implant > 0.5 && st.flap < 0.05 && st.seat > 0.9 && (
            // the window the cylinder passes through
            <rect x={LAM_X + 1.2} y={-1.85} width={2.0} height={3.7} fill="rgba(180,220,238,0.7)" />
          )}
        </g>
      )}
      {st.implant > 0 && st.seat > 0.9 && st.flap < 0.05 && (
        // the cylinder's front, through the graft
        <rect x={LAM_X + 1.6} y={-1.8} width={2.2} height={3.6} rx={0.25} fill="rgba(180,220,238,0.55)" stroke="rgba(30,70,95,0.95)" strokeWidth={2 * px} />
      )}
      {/* eyelids */}
      {lids.map((L, i) => (
        <g key={i}>
          <path d={L.all} fill="#E6C27C" />
          <path d={L.outer} fill="none" stroke="#C5675B" strokeWidth={2.3} strokeLinejoin="round" transform="translate(-0.9,0)" />
          <path d={L.tarsus} fill="#EEDFC8" stroke="#C9B08C" strokeWidth={0.2} />
          <path d={L.inner} fill="none" stroke="#E08C86" strokeWidth={0.5} />
          <path d={L.outer} fill="none" stroke={SKIN} strokeWidth={1.3} strokeLinejoin="round" />
          <path d={L.all} fill="none" stroke={INK} strokeWidth={1.5 * px} strokeLinejoin="round" />
        </g>
      ))}
    </g>
  );
};

// ---- the upper jaw ----
const toothPath = (cx: number, cej: number, crown: number, root: number, w: number, kind: 'inc' | 'pm' | 'mol') => {
  if (kind === 'mol') {
    return `M${cx - w / 2},${cej} C${cx - w / 2 - 0.4},${cej + crown * 0.7} ${cx - w * 0.3},${cej + crown} ${cx},${cej + crown * 0.92} C${cx + w * 0.3},${cej + crown} ${cx + w / 2 + 0.4},${cej + crown * 0.7} ${cx + w / 2},${cej}
      L${cx + w * 0.42},${cej - root * 0.7} C${cx + w * 0.38},${cej - root} ${cx + w * 0.12},${cej - root} ${cx + w * 0.08},${cej - root * 0.5} C${cx},${cej - root * 0.4} ${cx - w * 0.06},${cej - root * 0.5} ${cx - w * 0.1},${cej - root} C${cx - w * 0.3},${cej - root * 1.02} ${cx - w * 0.44},${cej - root * 0.8} ${cx - w / 2},${cej} Z`;
  }
  const tip = kind === 'inc' ? `C${cx - w / 2},${cej + crown * 0.8} ${cx - w * 0.15},${cej + crown} ${cx + w * 0.1},${cej + crown} C${cx + w * 0.35},${cej + crown} ${cx + w / 2},${cej + crown * 0.7} ${cx + w / 2},${cej}`
    : `C${cx - w / 2 - 0.3},${cej + crown * 0.75} ${cx - w * 0.2},${cej + crown} ${cx},${cej + crown} C${cx + w * 0.2},${cej + crown} ${cx + w / 2 + 0.3},${cej + crown * 0.75} ${cx + w / 2},${cej}`;
  return `M${cx - w / 2},${cej} ${tip} C${cx + w * 0.42},${cej - root * 0.6} ${cx + w * 0.1},${cej - root} ${cx},${cej - root} C${cx - w * 0.15},${cej - root} ${cx - w * 0.42},${cej - root * 0.6} ${cx - w / 2},${cej} Z`;
};

export type JawState = {
  open: number;            // cut-away revealed
  cut: number;             // the saw's progress round the block outline
  out: number;             // the block has left (0 in place .. 1 gone): the socket shows
  hideCanine: boolean;     // the canine is being drawn by the Implant renderer instead (it is moving)
};
/** the saw's path: up one side of the root, round the apex, down the other side (the crown is free) */
export const CUT_U: [number, number][] = [[17.4, 6.0], [8, 5.9], [-1.8, 5.7], [-1.8, 0], [-1.8, -5.6], [8, -5.9], [17.4, -6.1]];
export const BLOCK_SCENE = (p: [number, number]) => {
  // object (x,y) -> jaw scene, for the canine at rest: roll -90 maps object +x to scene +y
  return [CANINE_AT[0] + (p[1] - (-0.1)), CANINE_AT[1] + (p[0] - 12.0)] as [number, number];
};

export const Jaw: React.FC<{st: JawState; px: number; id: string}> = ({st, px, id}) => {
  if (st.open <= 0) return null;
  const m = faceMatrix(CANINE_AT[0], CANINE_AT[1], 1, CANINE_ROT);
  const P = (pp: [number, number][]) => 'M' + pp.map((q) => `${q[0].toFixed(3)},${q[1].toFixed(3)}`).join('L') + 'Z';
  const blockScene = BLOCK.map(BLOCK_SCENE);
  const cutScene = CUT_U.map(BLOCK_SCENE);
  const Pu = (pp: [number, number][]) => 'M' + pp.map((q) => `${q[0].toFixed(3)},${q[1].toFixed(3)}`).join('L');
  return (
    <g opacity={clamp(st.open * 1.5)}>
      <defs>
        <clipPath id={`${id}jw`}><path d={JAW_WIN} /></clipPath>
        <pattern id={`${id}bn`} width="2.4" height="2.4" patternUnits="userSpaceOnUse"><rect width="2.4" height="2.4" fill="#DDB892" /><ellipse cx="0.7" cy="0.8" rx="0.32" ry="0.22" fill="#A97B57" /><ellipse cx="1.8" cy="1.7" rx="0.24" ry="0.18" fill="#A97B57" /></pattern>
      </defs>
      <g clipPath={`url(#${id}jw)`}>
        <rect x={-10} y={20} width={50} height={50} fill="#C9796E" />
        {/* maxilla */}
        <path d="M-8,24 L36,24 C37,32 37,40 35,46.6 L-8,47.2 Z" fill={`url(#${id}bn)`} />
        <path d="M-8,59.5 C6,58.5 22,58.6 31,60 L31,70 L-8,70 Z" fill="#B65B55" />
        {/* back teeth */}
        <path d={toothPath(3, 48.5, 7.4, 13, 10, 'mol')} fill="#F1EEE7" stroke="rgba(60,40,30,0.75)" strokeWidth={1.2 * px} />
        <path d={toothPath(11.4, 48.8, 8.2, 14, 7, 'pm')} fill="#F1EEE7" stroke="rgba(60,40,30,0.75)" strokeWidth={1.2 * px} />
        <path d={toothPath(17.9, 49.0, 8.6, 14.5, 7, 'pm')} fill="#F1EEE7" stroke="rgba(60,40,30,0.75)" strokeWidth={1.2 * px} />
        <path d={toothPath(29.2, 49.6, 10, 13, 6.4, 'inc')} fill="#F1EEE7" stroke="rgba(60,40,30,0.75)" strokeWidth={1.2 * px} />
        <path d={toothPath(32.2, 49.8, 10.6, 13.5, 6.6, 'inc')} fill="#F4F2EC" stroke="rgba(60,40,30,0.75)" strokeWidth={1.2 * px} />
        {/* the canine, the same drawing as the implant renderer's block (it lifts out of here) */}
        {st.out < 1 && !st.hideCanine && (
          <g transform={m}>
            <path d={P(ROOT)} fill="#F0E2BF" stroke="rgba(120,84,50,0.6)" strokeWidth={0.14} />
            <path d={P(CROWN)} fill="#F5F4F0" stroke="rgba(60,40,30,0.75)" strokeWidth={1.2 * px} />
            <path d="M18.6,2.9 C21,3.2 23.5,2.2 25.4,0.9" fill="none" stroke="#FFFFFF" strokeWidth={0.55} strokeLinecap="round" />
          </g>
        )}
        {/* the bone over the roots (see-through), so roots read as inside the jaw and the crowns stand out */}
        <path d="M-8,24 L36,24 C37,32 37,40 35,46.6 L-8,47.2 Z" fill={`url(#${id}bn)`} opacity={0.55} />
        {/* the empty socket once the block has gone */}
        {st.out > 0 && <path d={P(blockScene)} fill="#7E2C2E" opacity={clamp(st.out * 3)} />}
        {st.out > 0 && <path d={P(blockScene)} fill="none" stroke="#B85A55" strokeWidth={0.6} opacity={clamp(st.out * 3)} />}
        {/* gum */}
        <path d="M-8,44.5 L37,44.5 L37,47.5 C35,48.4 33.6,50.6 32.2,50.8 C31,50.6 30.4,49 29.2,50.4 C28,51 26.6,48 24.6,50.6 C22.8,48.6 20.6,49.4 17.9,50.2 C16,48.6 14,48.6 11.4,49.9 C9,48.4 7,48.2 3,49.4 C0,48 -4,48.4 -8,48.6 Z" fill="#E48F86" stroke="#B9625C" strokeWidth={0.25} />
        {/* the saw cut, round the block */}
        {st.cut > 0 && st.out < 1 && (
          <path d={Pu(cutScene)} fill="none" stroke="#5E1A1D" strokeWidth={0.6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(st.cut)} />
        )}
        {/* the lip, see-through */}
        <path d="M31,40 C33,43 35,46 34,49 C33,52 31,54 30,55 C32,57 34,59 33,61 L40,66 L40,36 Z" fill={SKIN} opacity={0.35} />
      </g>
      <path d={JAW_WIN} fill="none" stroke="#E7A386" strokeWidth={1.1} />
      <path d={JAW_WIN} fill="none" stroke={INK} strokeWidth={1.6 * px} />
    </g>
  );
};

export const Profile: React.FC<{eye: EyeState; jaw: JawState; px: number; id: string; eyeWin: number; extraRays?: {st: EyeState; op: number}[]; noRays?: boolean}> = ({eye, jaw, px, id, eyeWin, extraRays = [], noRays}) => (
  <g>
    <defs>
      <linearGradient id={`${id}hs`} x1="1" y1="0" x2="0" y2="0.2"><stop offset="0" stopColor={SKIN_L} /><stop offset="0.6" stopColor={SKIN} /><stop offset="1" stopColor={SKIN_D} /></linearGradient>
      <clipPath id={`${id}ew`}><path d={EYE_WIN} /></clipPath>
    </defs>
    {/* gown at the shoulder */}
    <path d="M-120,150 C-110,128 -60,122 -10,128 C10,130 26,140 40,160 L40,200 L-120,200 Z" fill="#A7C4D4" stroke={INK} strokeWidth={2.6 * px} />
    <path d={HEAD} fill={`url(#${id}hs)`} stroke={INK} strokeWidth={2.8 * px} strokeLinejoin="round" />
    {/* hair */}
    <path d="M-45,-113 C-10,-117 10,-102 13,-86 C2,-92 -12,-90 -24,-84 C-34,-74 -40,-58 -52,-52 C-62,-40 -72,-36 -82,-40 C-90,-20 -98,0 -104,8 C-112,-10 -114,-30 -110,-46 C-104,-86 -80,-110 -45,-113 Z" fill="#4C4743" stroke={INK} strokeWidth={2.4 * px} />
    <path d="M-82,-40 C-80,-24 -78,-14 -74,-6 C-80,-10 -88,-18 -90,-26 Z" fill="#9B9590" />
    {/* ear */}
    <path d="M-56,-6 C-46,-16 -40,4 -44,18 C-46,30 -50,36 -58,38 C-66,40 -72,30 -70,16 C-69,4 -64,-2 -56,-6 Z" fill={SKIN} stroke={INK} strokeWidth={2.2 * px} />
    <path d="M-52,2 C-46,4 -47,16 -50,24 C-53,28 -58,28 -60,24" fill="none" stroke={SKIN_D} strokeWidth={1.4} />
    {/* brow, closed-mouth line, nostril, stubble */}
    <path d="M2,-24 C8,-28 15,-27 20,-22" stroke="#5E5650" strokeWidth={3.2} fill="none" strokeLinecap="round" />
    <path d="M30,55 C26,56 22,56 18,54" stroke={INK} strokeWidth={1.8 * px} fill="none" />
    <path d="M36,36 C34,34 31,34 30,36" stroke="#7A4434" strokeWidth={1.6} fill="none" />
    <path d="M-50,72 C-30,96 0,104 24,98 C30,92 32,84 29,76 C26,70 22,68 18,72 C6,80 -22,74 -50,60 Z" fill="#6E4A3A" opacity={0.18} />
    {/* the eye cut-away */}
    {eyeWin > 0 && (
      <g opacity={clamp(eyeWin)}>
        <g clipPath={`url(#${id}ew)`}><EyeSection st={eye} px={px} id={`${id}es`} /></g>
        <path d={EYE_WIN} fill="none" stroke="#E7A386" strokeWidth={1.2} />
        <path d={EYE_WIN} fill="none" stroke={INK} strokeWidth={1.8 * px} />
      </g>
    )}
    {eyeWin > 0 && !noRays && <Rays st={eye} px={px} id={`${id}r`} />}
    {eyeWin > 0 && extraRays.map((r, i) => r.op > 0 && <g key={i} opacity={r.op}><Rays st={r.st} px={px} id={`${id}r${i + 2}`} /></g>)}
    <Jaw st={jaw} px={px} id={`${id}j`} />
  </g>
);
