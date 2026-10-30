// V2: the patient in profile (facing right: his right eye, the damaged one, is toward us). The same man as the front
// view: short dark hair, a short dark beard and moustache, the same skin and gown. A local cut-away opens a sagittal
// section of the eye.
// V4: the seated implant is drawn as it really sits: the tooth-and-bone plate lies flat on the front of the eye,
// beneath the cheek-lining graft, cut through in the section (bone strip up, root dentin round the cylinder); only the
// end of the small clear cylinder stands out of the graft. No exposed block.
// Millimetres, the eye's centre at the origin, y down.
import React from 'react';
import {clamp, hash, lerp} from './lib';
import {HOLE, HOLE_R, CYL_Z0, CYL_Z1, Z_F, Z_B, rootW, Rot} from './implant';
import {EyeState} from './profile';

const INK = '#3E241A';
export const SKIN = '#D9A07B', SKIN_D = '#BF7F5D', SKIN_L = '#E9B994';
export const HAIR = '#2A2421', BEARD = '#2E2521';
export const FOVEA: [number, number] = [-10.6, 0.4];
// V4: the seated implant in the section. The lamina's mid-plane is at x = PLATE_MID, its back face resting on the
// corneal apex (x 13.1), its long axis across the eye (out of the section plane), its bone strip up. The 3D implant
// in the same pose is IMPL_ROT (edge-on, its face toward +x), used where it turns into this view.
export const PLATE_MID = 14.5;
export const IMPL_AT: [number, number] = [PLATE_MID, 0];
export const IMPL_ROT: Rot = {yaw: 90, pitch: 0, roll: 0, spin: 0};
export const CYL_FRONT_X = PLATE_MID + CYL_Z1, CYL_BACK_X = PLATE_MID + CYL_Z0;
// the cut through the cylinder axis (object x = HOLE[0]); scene y = -(object y - HOLE[1])
const PL_TOP = -(5.55 - HOLE[1]), PL_BOT = -(-0.92 * rootW(HOLE[0]) - HOLE[1]), PL_ROOT = -(rootW(HOLE[0]) - HOLE[1]);
const MUC = 1.0;   // graft thickness over the plate
export const MUC_FRONT = PLATE_MID + Z_F + MUC;
const lamExt = {top: PL_TOP, bot: PL_BOT, front: PLATE_MID + Z_F};

const HEAD = 'M-45,-112 C-10,-116 10,-100 12,-84 C16,-64 17,-44 20,-20 C21,-14 20,-10 19,-8 C24,4 34,18 42,28 C46,33 45,37 40,38 C36,39 33,39 31,40 C33,43 35,46 34,49 C33,52 31,54 30,55 C32,57 34,59 33,61 C32,64 29,67 27,69 C26,72 28,76 30,82 C32,88 30,95 24,99 C14,104 0,106 -8,108 L-10,150 L-78,150 C-80,120 -82,90 -92,60 C-104,30 -114,-10 -110,-44 C-104,-84 -80,-108 -45,-112 Z';
/** V4: the finished eye between the lids, in profile: an ordinary eye opening, the graft surface gently raised */
export const EXT_OPEN = 'M5,-1.2 C8.6,-6.4 13.4,-7.6 17.4,-6.6 C17.4,-3 17.4,3 17.1,5.6 C13.4,7 8.6,5.8 5,1.2 Z';
export const EYE_WIN = 'M-31,-6 C-31,-18 -20,-25 -4,-25 C6,-25 14,-22 17.5,-17 C20.5,-10 21.5,8 19.5,15 C15,22 6,25 -6,25 C-22,25 -31,16 -31,6 Z';

const pts = (f: (u: number) => [number, number], n: number) => Array.from({length: n + 1}, (_, i) => f(i / n));
const poly = (p: [number, number][], close = false) => 'M' + p.map((q) => `${q[0].toFixed(3)},${q[1].toFixed(3)}`).join('L') + (close ? 'Z' : '');
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 48) => pts((u) => {const a = (a0 + (a1 - a0) * u) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)];}, n);
const LIMB = Math.asin(5.75 / 12) * 180 / Math.PI;

// the oral-mucosa graft: on the cornea (seat 0) or wrapped over the plate (seat 1); hinged at the upper fornix
const graftPath = (seat: number, flap: number, dx: number) => {
  const N = 40;
  const onCornea = pts((u) => {
    const y = lerp(-11.5, 11.5, u);
    const yc = clamp(y, -5.7, 5.7);
    const xc = 5.3 + Math.sqrt(7.8 * 7.8 - yc * yc);
    const xs = Math.sqrt(Math.max(0, 12.3 * 12.3 - y * y));
    return [(Math.abs(y) <= 5.7 ? xc : xs - (Math.abs(y) - 5.7) * 0.15) + 0.15, y];
  }, N);
  const onImpl = pts((u) => {
    const y = lerp(-11.5, 11.5, u);
    const top = lamExt.top - MUC * 0.6, bot = lamExt.bot + MUC * 0.6, f = lamExt.front + MUC + dx;
    const xs = Math.sqrt(Math.max(0, 12.3 * 12.3 - y * y)) + 0.15;
    if (y >= top && y <= bot) return [f, y];
    const k = clamp(Math.abs(y - (y < top ? top : bot)) / 2.5);
    return [lerp(f, xs, Math.sqrt(k)), y];
  }, N);
  const hinge = onImpl[0];
  return onCornea.map((p, i) => {
    let x = lerp(p[0], onImpl[i][0], seat), y = lerp(p[1], onImpl[i][1], seat);
    if (flap > 0) {
      const a = -flap * 1.9 * (i / N);
      const ddx = x - hinge[0], ddy = y - hinge[1];
      x = hinge[0] + ddx * Math.cos(a) - ddy * Math.sin(a) + flap * 6 * (i / N);
      y = hinge[1] + ddx * Math.sin(a) + ddy * Math.cos(a);
    }
    return [x, y] as [number, number];
  });
};

/** light rays: 'clear' through the cylinder to the fovea; 'scatter' breaking up on a scarred cornea */
export const Rays2: React.FC<{mode: 'none' | 'clear' | 'scatter'; T: number; px: number; dx?: number; part?: 'outer' | 'inner' | 'all'}> = ({mode, T, px, dx = 0, part = 'all'}) => {
  if (mode === 'none' || T <= 0) return null;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const yy = lerp(-1.2, 1.2, i / 6);
    if (mode === 'clear') {
      // one path, so the light front moves at one speed; the outer part (outside the eye, to the cylinder's front)
      // is drawn over the implant, the inner part under it (the plate hides the beam where it passes through it)
      const path: [number, number][] = [[48, yy], [CYL_FRONT_X + dx, yy], [CYL_BACK_X + dx, yy * 0.92], [FOVEA[0] + 0.05, FOVEA[1] + yy * 0.05]];
      const L1 = 48 - (CYL_FRONT_X + dx), Ltot = L1 + (CYL_FRONT_X - CYL_BACK_X) + Math.hypot(CYL_BACK_X + dx - FOVEA[0], yy * 0.92 - FOVEA[1]);
      const k = L1 / Ltot, front = clamp(T * 1.12 - i * 0.015);
      if (part !== 'inner') els.push(<path key={`o${i}`} d={poly(path.slice(0, 2))} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(front / k)} />);
      if (part !== 'outer' && front > k) els.push(<path key={`n${i}`} d={poly(path.slice(1))} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp((front - k) / (1 - k))} />);
    } else {
      els.push(<path key={i} d={poly([[48, yy], [13.3, yy]])} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(T * 2.2 - i * 0.03)} />);
      for (let k = 0; k < 5; k++) {
        const a = (hash(i * 13 + k * 3.7) - 0.5) * 2.6 + Math.PI;
        const L = 3 + 9 * hash(i * 5 + k * 11);
        const u = clamp((T - 0.45 - k * 0.04) * 2.2);
        if (u <= 0) continue;
        els.push(<path key={`${i}s${k}`} d={poly([[12.6, yy], [12.6 + Math.cos(a) * L * u, yy + Math.sin(a) * L * u]])} opacity={0.9 * (1 - u * 0.5)} strokeWidth={3 * px} />);
      }
    }
  }
  return (
    <g fill="none" stroke="#FFE6A0" strokeWidth={3.2 * px} strokeLinecap="round">
      <g style={{filter: `blur(${4 * px}px)`}} opacity={0.8} stroke="#FFD36B" strokeWidth={10 * px}>{els}</g>
      <g>{els}</g>
    </g>
  );
};

export type Sect2 = {
  st: EyeState;            // reuses the V1 eye state (scar, iris/lens, graft, flap, trephine, seat, lidFwd, glow)
  implDx: number;          // the implant's offset along the axis while it arrives
  implOn: number;          // implant drawn
  tissue: number; vessels: number;
  rays: 'none' | 'clear' | 'scatter'; rayT: number;
};

export const EyeSection2: React.FC<{s: Sect2; px: number; id: string; front?: boolean}> = ({s, px, id, front = false}) => {
  const st = s.st;
  const lidF = st.lidFwd * 2.4;
  const lid = (sg: number) => {
    const f = lidF;
    const outer: [number, number][] = [[17.6, -19 * sg], [18.0 + f * 0.3, -13 * sg], [17.4 + f * 0.8, -9.2 * sg], [16.5 + f, (-6.6 - f * 0.4) * sg], [15.9 + f, (-5.6 - f * 0.6) * sg]];
    const inner: [number, number][] = [[14.7 + f * 0.8, (-5.5 - f * 0.6) * sg], [12.6 + f * 0.5, (-6.4 - f * 0.4) * sg], [10.6, -8.0 * sg], [8.4, -10.0 * sg], [5.8, -11.5 * sg], [4.0, -12.2 * sg], [5.0, -14.0 * sg], [9.0, -16.6 * sg], [13.0, -18.6 * sg]];
    return {all: poly([...outer, ...inner], true), outer: poly(outer), inner: poly(inner.slice(0, 6))};
  };
  const lids = [lid(1), lid(-1)];
  const sclera = poly([...arc(0, 0, 12, LIMB, 360 - LIMB), ...arc(0, 0, 11.3, 360 - LIMB, LIMB)], true);
  const choroid = poly([...arc(0, 0, 11.3, 34, 326), ...arc(0, 0, 10.95, 326, 34)], true);
  const retina = poly([...arc(0, 0, 10.95, 40, 320), ...arc(0, 0, 10.45, 320, 40)], true);
  const corneaPart = (y0: number, y1: number) => {
    const f = pts((u) => {const y = lerp(y0, y1, u); return [5.3 + Math.sqrt(7.8 * 7.8 - y * y), y];}, 20);
    const b = pts((u) => {const y = lerp(y1, y0, u) * 0.97; return [6.0 + Math.sqrt(6.6 * 6.6 - y * y) - 0.05, y];}, 20);
    return poly([...f, ...b], true);
  };
  const discOff = st.trephine * 9;
  const gp = graftPath(st.seat, st.flap, s.implDx);
  const graft = poly([...gp, ...gp.slice().reverse().map(([x, y]) => [x - 1.0, y] as [number, number])], true);
  const scarOp = clamp(st.scar);
  const frontLayer = (
    <g>
      {/* the graft over the plate */}
      {st.mucosa > 0 && <path d={graft} fill="#E1928B" stroke="#A9534F" strokeWidth={1.2 * px} opacity={clamp(st.mucosa)} />}
      {/* lids (cut) */}
      {lids.map((L, i) => (
        <g key={i}>
          <path d={L.all} fill="#E6C27C" />
          <path d={L.outer} fill="none" stroke="#C5675B" strokeWidth={2.3} strokeLinejoin="round" transform="translate(-0.9,0)" />
          <path d={L.inner} fill="none" stroke="#E08C86" strokeWidth={0.5} />
          <path d={L.outer} fill="none" stroke={SKIN} strokeWidth={1.3} strokeLinejoin="round" />
          <path d={L.all} fill="none" stroke={INK} strokeWidth={1.5 * px} strokeLinejoin="round" />
        </g>
      ))}
    </g>
  );
  if (front) return frontLayer;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}vit`} cx="0.4" cy="0.45" r="0.6"><stop offset="0" stopColor="#E7EEF0" /><stop offset="1" stopColor="#C9D8DD" /></radialGradient>
        <radialGradient id={`${id}glow`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFF4C2" /><stop offset="0.4" stopColor="#FFD56A" stopOpacity="0.85" /><stop offset="1" stopColor="#FFB040" stopOpacity="0" /></radialGradient>
      </defs>
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
      <circle cx={0} cy={0} r={11.3} fill={`url(#${id}vit)`} />
      <path d={retina} fill="#E59A6E" />
      <path d={choroid} fill="#8E3B33" />
      <path d={sclera} fill="#F7F4EE" stroke={INK} strokeWidth={1.8 * px} />
      {st.haze > 0 && <path d={retina} fill="#FFE2A6" opacity={0.35 * st.haze} />}
      {st.glow > 0 && <circle cx={FOVEA[0]} cy={FOVEA[1]} r={2.2 + 3.5 * st.glow} fill={`url(#${id}glow)`} opacity={clamp(st.glow * 1.3)} />}
      {st.glow > 0 && <path d={retina} fill="none" stroke="#FFD27A" strokeWidth={0.5} opacity={0.6 * st.glow} />}
      {Array.from({length: 90}, (_, i) => {
        const a = (172 + 16 * (i / 89) + (hash(i) - 0.5) * 0.08) * Math.PI / 180;
        const r0 = 10.5, r1 = 10.86 - (i % 3 === 0 ? 0.08 : 0);
        return <line key={i} x1={r0 * Math.cos(a)} y1={r0 * Math.sin(a)} x2={r1 * Math.cos(a)} y2={r1 * Math.sin(a)} stroke={i % 3 === 0 ? '#E07A4E' : '#F2B27C'} strokeWidth={i % 3 === 0 ? 0.05 : 0.032} strokeLinecap="round" />;
      })}
      {st.glow > 0 && Array.from({length: 90}, (_, i) => {
        const a = (172 + 16 * (i / 89)) * Math.PI / 180, r = 10.68;
        return <circle key={`g${i}`} cx={r * Math.cos(a)} cy={r * Math.sin(a)} r={0.05} fill="#FFF3B8" opacity={st.glow * (1 - Math.abs(i - 44) / 45) * 0.9} />;
      })}
      {st.irisLens > 0 && (
        <g opacity={clamp(st.irisLens)} transform={`translate(${(1 - st.irisLens) * 6},0)`}>
          <ellipse cx={8.4} cy={0} rx={1.9} ry={4.4} fill="rgba(235,232,210,0.85)" stroke="#9C9478" strokeWidth={1.2 * px} />
          <path d="M10.6,-5.6 L10.2,-1.9 L10.7,-1.9 L11.0,-5.7 Z M10.6,5.6 L10.2,1.9 L10.7,1.9 L11.0,5.7 Z" fill="#6E4B2E" />
        </g>
      )}
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
          {st.trephine < 1 && <g transform={`translate(${discOff},0)`} opacity={clamp(1.4 - st.trephine * 1.4)}><path d={corneaPart(-1.9, 1.9)} fill="#F6F4EE" stroke="#FFFFFF" strokeWidth={0.9} strokeLinejoin="round" /></g>}
          {[[-4.2, -2], [2.2, 4.5]].map(([a, b], i) => <path key={i} d={`M${5.3 + Math.sqrt(60.84 - a * a) - 0.3},${a} Q12.2,${(a + b) / 2} ${5.3 + Math.sqrt(60.84 - b * b) - 0.3},${b}`} stroke="#C4525A" strokeWidth={0.28} fill="none" />)}
        </g>
      )}
      <Rays2 mode={s.rays} T={s.rayT} px={px} dx={s.implDx} part="inner" />
      {frontLayer}
    </g>
  );
};

/** V4: the seated implant cut through the cylinder's axis: the lamina flat on the front of the eye (a strip of jaw
 *  bone up, the root dentin round the drilled canal, the gold cementum line between), the thin fibrous capsule that
 *  grew round it in the pocket, and the small clear PMMA cylinder through it along the optical axis. */
export const PlateSect: React.FC<{dx: number; px: number; id: string; part: 'plate' | 'cyl'; tissue?: number}> = ({dx, px, id, part, tissue = 1}) => {
  const x0 = PLATE_MID + Z_B + dx, x1 = PLATE_MID + Z_F + dx, w = x1 - x0;
  if (part === 'cyl') {
    const c0 = CYL_BACK_X + dx, c1 = CYL_FRONT_X + dx, r = HOLE_R;
    return (
      <g>
        <path d={`M${c0},${-r} L${c1 - 0.35},${-r} Q${c1},${-r} ${c1 + 0.12},${-r + 0.5} Q${c1 + 0.22},0 ${c1 + 0.12},${r - 0.5} Q${c1},${r} ${c1 - 0.35},${r} L${c0},${r} Z`}
          fill="rgba(196,230,244,0.62)" stroke="rgba(28,78,104,0.95)" strokeWidth={1.8 * px} strokeLinejoin="round" />
        <line x1={c0 + 0.4} x2={c1 - 0.5} y1={-r + 0.45} y2={-r + 0.45} stroke="rgba(255,255,255,0.9)" strokeWidth={2.4 * px} strokeLinecap="round" />
        <line x1={c0 + 0.4} x2={c1 - 0.5} y1={r - 0.4} y2={r - 0.4} stroke="rgba(40,100,130,0.35)" strokeWidth={2 * px} strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      <defs>
        <pattern id={`${id}bn`} width="0.9" height="0.9" patternUnits="userSpaceOnUse"><rect width="0.9" height="0.9" fill="#D7B28B" /><circle cx="0.3" cy="0.35" r="0.17" fill="#A5795A" /><circle cx="0.72" cy="0.7" r="0.11" fill="#A5795A" /></pattern>
      </defs>
      {/* the capsule round the plate (not across the canal, which the cylinder fills) */}
      {tissue > 0 && <g opacity={clamp(tissue)}>
        <rect x={x0 - 0.45} y={PL_TOP - 0.45} width={w + 0.9} height={-HOLE_R - PL_TOP + 0.45} rx={0.7} fill="#E6A29A" />
        <rect x={x0 - 0.45} y={HOLE_R} width={w + 0.9} height={PL_BOT - HOLE_R + 0.45} rx={0.7} fill="#E6A29A" />
      </g>}
      <rect x={x0 - 0.45} y={-HOLE_R} width={w + 0.9} height={2 * HOLE_R} fill="#D6E8EE" />
      <rect x={x0} y={PL_TOP} width={w} height={PL_ROOT - PL_TOP} fill={`url(#${id}bn)`} />
      <rect x={x0} y={PL_ROOT} width={w} height={-HOLE_R - PL_ROOT} fill="#F4E8C8" />
      <rect x={x0} y={HOLE_R} width={w} height={PL_BOT - HOLE_R} fill="#F4E8C8" />
      {/* dentinal tubules, running out from the old canal */}
      {[0.25, 0.5, 0.75].map((k) => <line key={k} x1={x0 + w * k} x2={x0 + w * k} y1={PL_ROOT + 0.15} y2={-HOLE_R - 0.1} stroke="#E2CFA2" strokeWidth={0.07} />)}
      <line x1={x0} x2={x1} y1={PL_ROOT} y2={PL_ROOT} stroke="#C9A35E" strokeWidth={0.22} />
      <rect x={x0} y={PL_TOP} width={w} height={PL_BOT - PL_TOP} fill="none" stroke="rgba(52,32,22,0.9)" strokeWidth={1.8 * px} />
    </g>
  );
};

/** V5: the pocket under the lower lid of his OTHER eye, as a sagittal cut-away through the lower lid and cheek (drawn
 *  in this file's profile coordinates; the shot mirrors the whole profile to show his left side). Skin, fat and the
 *  orbicularis muscle, the implant in its pocket beneath the muscle (face toward the skin, the cylinder along the
 *  same axis as it will have in the eye), deep fat and the cheekbone. `open` opens the incision; `heal` closes it;
 *  `grow` builds the fibrous capsule and its new vessels round the implant; `out` slides it back out. */
export type PocketSect = {win: number; open: number; heal: number; grow: number; out: number; implOn: number};
// the skin surface in the section plane (mid-pupil line): lower lid, the lid-cheek groove, the cheek
const skinX = (y: number) => {
  const k = [[8, 18.0], [11, 17.3], [13.5, 17.0], [16, 17.4], [19, 18.9], [22, 19.8], [26, 19.9], [30, 19.4], [34, 18.8]];
  if (y <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (y <= k[i][0]) {const u = (y - k[i - 1][0]) / (k[i][0] - k[i - 1][0]); const e = u * u * (3 - 2 * u); return lerp(k[i - 1][1], k[i][1], e);}
  return k[k.length - 1][1];
};
const POCK_Y0 = 10.5, POCK_Y1 = 32.5, INC_Y = 12.4;
export const POCK_C: [number, number] = [11.1, 21];            // the plate's mid-plane and hole axis in the pocket
const band = (d0: number, d1: number) => {
  const ys = Array.from({length: 45}, (_, i) => lerp(POCK_Y0, POCK_Y1, i / 44));
  return poly([...ys.map((y) => [skinX(y) - d0, y] as [number, number]), ...ys.slice().reverse().map((y) => [skinX(y) - d1, y] as [number, number])], true);
};
export const POCK_WIN = (() => {
  const ys = Array.from({length: 45}, (_, i) => lerp(POCK_Y0, POCK_Y1, i / 44));
  const right = ys.map((y) => [skinX(y) + 0.05, y] as [number, number]);
  return poly([[1.2, POCK_Y0 + 1.5], [3.0, POCK_Y0], ...right, [3.0, POCK_Y1], [1.2, POCK_Y1 - 1.5]], true);
})();
export const PocketSection: React.FC<{p: PocketSect; px: number; id: string}> = ({p, px, id}) => {
  const [cx, cy] = POCK_C;
  const out = p.out;   // 0 in the pocket .. 1 out through the incision
  const g = clamp(p.grow);
  const pl = {y0: cy - 5.65, y1: cy + 2.49};
  const cap = 0.25 + 0.75 * g;   // capsule thickness (mm)
  const op = clamp(p.open) * (1 - clamp(p.heal));
  const sx = skinX(INC_Y);
  // out: along the tract up to the incision and out of the skin
  const ox = out * 9, oy = -out * 9.5;
  return (
    <g opacity={p.win}>
      <defs>
        <clipPath id={`${id}w`}><path d={POCK_WIN} /></clipPath>
        <pattern id={`${id}fat`} width="2.2" height="2.2" patternUnits="userSpaceOnUse"><rect width="2.2" height="2.2" fill="#EBCB82" /><circle cx="1.1" cy="1.1" r="0.95" fill="none" stroke="#D3AB5E" strokeWidth="0.18" /></pattern>
        <pattern id={`${id}mus`} width="1.1" height="1.1" patternUnits="userSpaceOnUse" patternTransform="rotate(82)"><rect width="1.1" height="1.1" fill="#BC5A4E" /><line x1="0" y1="0.28" x2="1.1" y2="0.28" stroke="#A34539" strokeWidth="0.22" /></pattern>
        <pattern id={`${id}bn`} width="1.4" height="1.4" patternUnits="userSpaceOnUse"><rect width="1.4" height="1.4" fill="#EADBC0" /><circle cx="0.5" cy="0.5" r="0.22" fill="#CDB38E" /></pattern>
      </defs>
      <g clipPath={`url(#${id}w)`}>
        <path d={band(15, 30)} fill={`url(#${id}bn)`} />
        <path d={band(14.6, 15.2)} fill="#D9C7A6" />
        <path d={band(4.8, 14.6)} fill={`url(#${id}fat)`} />
        <path d={band(3.2, 4.8)} fill={`url(#${id}mus)`} />
        <path d={band(1.4, 3.2)} fill={`url(#${id}fat)`} opacity={0.9} />
        <path d={band(0, 1.4)} fill="#EDB89C" />
        <path d={band(0, 0.3)} fill="#C98C70" />
        {/* the tract from the incision down to the pocket, while it is open */}
        {op > 0.05 && <path d={`M${sx - 2.4},${INC_Y} C${sx - 4.6},${INC_Y + 2.4} ${cx + 4.4},${pl.y0 - 1.6} ${cx + 3.2},${pl.y0 + 0.6}`} stroke="#6E1C20" strokeWidth={1.2 * op} fill="none" strokeLinecap="round" />}
        {/* the incision: a wedge into the skin, open, then healing to a fine line */}
        {p.open > 0 && (op > 0.05
          ? <path d={`M${sx + 0.2},${INC_Y - 1.0 * op} L${sx - 2.6 - 2.4 * op},${INC_Y} L${sx + 0.2},${INC_Y + 1.0 * op} Z`} fill="#5A1418" />
          : <path d={`M${sx},${INC_Y} L${sx - 1.4},${INC_Y}`} stroke="#B0685C" strokeWidth={0.25} opacity={0.4 + 0.4 * (1 - p.heal)} />)}
        {/* the fibrous capsule growing round the implant, and the new vessels reaching it */}
        {p.implOn > 0 && g > 0 && (
          <g opacity={1 - clamp(out * 2.5)}>
            <rect x={cx - 5.5 - cap} y={pl.y0 - cap} width={9.3 + 2 * cap} height={pl.y1 - pl.y0 + 2 * cap} rx={1.2} fill="#D98A80" opacity={0.35 + 0.5 * g} />
            {Array.from({length: 11}, (_, i) => {
              const a = (i / 11) * Math.PI * 2 + 0.4;
              const x0 = cx - 0.8 + Math.cos(a) * 9.5, y0 = cy - 1.6 + Math.sin(a) * 9.5;
              const x1 = cx - 0.8 + Math.cos(a + 0.15) * 4.6, y1 = cy - 1.6 + Math.sin(a + 0.15) * 5.4;
              const mx = (x0 + x1) / 2 + (hash(i * 3.3) - 0.5) * 2.4, my = (y0 + y1) / 2 + (hash(i * 5.1) - 0.5) * 2.4;
              const k = clamp(g * 1.5 - (i % 3) * 0.15);
              return (
                <g key={i}>
                  <path d={`M${x0},${y0} Q${mx},${my} ${x1},${y1}`} stroke="#B3242E" strokeWidth={0.28} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
                  <path d={`M${lerp(x0, x1, 0.55)},${lerp(y0, y1, 0.55)} l${(hash(i) - 0.5) * 2.4},${(hash(i + 7) - 0.5) * 2.4}`} stroke="#C0323A" strokeWidth={0.16} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(k * 1.6 - 0.6)} />
                </g>
              );
            })}
          </g>
        )}
      </g>
      {/* the implant in its pocket (it leaves along the tract at the end, so it is not clipped then) */}
      {p.implOn > 0 && (
        <g clipPath={out > 0.01 ? undefined : `url(#${id}w)`}>
          <g transform={`translate(${cx - PLATE_MID + ox},${cy + oy})`}>
            {g > 0.5 && <rect x={PLATE_MID - 1.6 - 0.5} y={-5.65 - 0.5} width={4.2} height={8.14 + 1} rx={0.8} fill="#D98A80" opacity={clamp(out * 4) * 0.9} />}
            <PlateSect dx={0} px={px} id={`${id}pp`} part="plate" tissue={0} />
            <PlateSect dx={0} px={px} id={`${id}pc`} part="cyl" />
          </g>
        </g>
      )}
      <path d={POCK_WIN} fill="none" stroke="#E7A386" strokeWidth={1.0} />
      <path d={POCK_WIN} fill="none" stroke={INK} strokeWidth={1.6 * px} />
    </g>
  );
};

export type Expr2 = {smile: number; brow: number; open: number};
export const NEUTRAL2: Expr2 = {smile: 0, brow: 0, open: 0};

/** the head in profile; `win` opens the eye cut-away from the eye outward (0 closed .. 1 open) */
/** `ext` shows the finished eye from outside (V4: the graft over the plate, only the cylinder's end out of it);
 *  `pivot` is the point the cut-away grows from; `winOp` fades the cut-away in and out */
export const Profile2: React.FC<{s: Sect2; px: number; id: string; win: number; expr: Expr2; tear?: number; ext?: number; pivot?: [number, number]; winOp?: number; film?: number; blind?: boolean; pocket?: PocketSect}> = ({s, px, id, win, expr, tear = 0, ext = 0, pivot = [10, 0], winOp = 1, blind = false, pocket}) => {
  const sm = expr.smile, br = expr.brow;
  const wT = `translate(${pivot[0]},${pivot[1]}) scale(${Math.max(0.001, win)}) translate(${-pivot[0]},${-pivot[1]})`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}hs`} x1="1" y1="0" x2="0" y2="0.2"><stop offset="0" stopColor={SKIN_L} /><stop offset="0.6" stopColor={SKIN} /><stop offset="1" stopColor={SKIN_D} /></linearGradient>
        <clipPath id={`${id}hc`}><path d={HEAD} /></clipPath>
        <clipPath id={`${id}ew`}><path d={EYE_WIN} transform={wT} /></clipPath>
        <clipPath id={`${id}eo`}><path d={EXT_OPEN} /></clipPath>
        <radialGradient id={`${id}xm`} cx="0.75" cy="0.4" r="0.8"><stop offset="0" stopColor="#F0ACA4" /><stop offset="0.6" stopColor="#DE8F88" /><stop offset="1" stopColor="#B55E5B" /></radialGradient>
        <pattern id={`${id}gp`} width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="none" /><path d="M4.5,2 L6,4.5 L4.5,7 L3,4.5Z" fill="#7FA2B6" opacity="0.7" /></pattern>
      </defs>
      {/* gown */}
      <path d="M-120,150 C-110,128 -60,122 -10,128 C10,130 26,140 40,160 L40,220 L-120,220 Z" fill="#A9C6D6" stroke={INK} strokeWidth={2.6 * px} />
      <path d="M-120,150 C-110,128 -60,122 -10,128 C10,130 26,140 40,160 L40,220 L-120,220 Z" fill={`url(#${id}gp)`} />
      <path d={HEAD} fill={`url(#${id}hs)`} stroke={INK} strokeWidth={2.8 * px} strokeLinejoin="round" />
      <path d="M-104,146 C-90,126 -40,120 -12,124 C8,127 24,136 36,154 L40,220 L-110,220 Z" fill="#A9C6D6" stroke={INK} strokeWidth={2.6 * px} />
      <path d="M-104,146 C-90,126 -40,120 -12,124 C8,127 24,136 36,154 L40,220 L-110,220 Z" fill={`url(#${id}gp)`} />
      <path d="M-84,134 C-60,126 -30,124 -10,127" stroke="#7FA2B6" strokeWidth={4} fill="none" />
      <g clipPath={`url(#${id}hc)`}>
        {/* beard and moustache, short and dark */}
        <path d="M-60,-2 C-50,2 -46,8 -44,16 C-40,30 -26,40 -6,44 C6,46 16,44 24,41 L31,40 C33,43 35,46 34,49 L60,49 L60,100 L30,101 C14,108 -4,110 -16,106 C-34,98 -46,84 -52,70 L-60,60 Z" fill={BEARD} opacity={0.82} />
        {Array.from({length: 90}, (_, i) => {
          const x = -46 + 76 * hash(i * 2.3), y = 20 + 80 * hash(i * 5.9);
          if (y > 100 - (x + 46) * 0.1 || (x < -30 && y > 85)) return null;
          return <path key={i} d={`M${x},${y} l${0.6 - hash(i) * 1.2},1.6`} stroke="#4A3C34" strokeWidth={0.5} opacity={0.6} />;
        })}
        {/* cheek above the beard line, lifted by the smile */}
        <path d={`M-30,${30 - sm * 3} C-14,${36 - sm * 5} 4,${38 - sm * 6} 18,${36 - sm * 3}`} stroke={SKIN_D} strokeWidth={1.4 + sm} fill="none" opacity={0.5 + 0.4 * sm} />
        <path d={`M17,${44 - sm * 2} C14,${48 - sm * 2} ${14 - sm},${52 - sm * 3} ${17 - sm * 2},${55 - sm * 4}`} stroke={SKIN_D} strokeWidth={1.2 + sm} fill="none" opacity={0.3 + 0.6 * sm} />
        {/* lips */}
        <path d={`M34,49.4 C33.2,52 31.6,54 30,55 C27,55.4 ${23 - sm * 2},${55 - sm * 3.6} ${19 - sm * 3},${54.6 - sm * 5} C24,52.4 29,51 34,49.4 Z`} fill="#A5574C" />
        <path d={`M30,55.6 C32.4,57.2 33.8,59 33,61.2 C31.6,63.6 29,64.2 26,63.8 C24,61 ${22 - sm * 1.5},${58 - sm * 2.6} ${19 - sm * 3},${55.4 - sm * 5} Z`} fill="#B5655A" />
        {expr.open > 0.05 && <path d={`M30,55.2 L${19 - sm * 3},${55 - sm * 5} L${22 - sm},${56.6 + expr.open * 2.6} L29.6,${57 + expr.open * 1.4} Z`} fill="#4A1E1C" />}
        {expr.open > 0.05 && <path d={`M29.8,55.3 L${20.5 - sm * 2.6},${55.2 - sm * 4.4} L${22 - sm * 1.6},${56.3 - sm * 2.8} L29.6,55.9 Z`} fill="#F4EEE4" />}
        <path d={`M30,55.2 C27,55.6 ${23 - sm * 2},${55.3 - sm * 3.8} ${19 - sm * 3},${55 - sm * 5}`} stroke={INK} strokeWidth={1.8 * px} fill="none" strokeLinecap="round" />
        {/* hair: short and dark */}
        <path d="M-45,-113 C-10,-117 10,-102 13,-86 C4,-90 -8,-89 -20,-84 C-30,-78 -38,-70 -46,-60 C-52,-48 -50,-30 -48,-14 C-47,-6 -48,0 -50,4 C-62,6 -84,-6 -104,8 C-112,-10 -114,-30 -110,-46 C-104,-86 -80,-110 -45,-113 Z" fill={HAIR} stroke={INK} strokeWidth={2.4 * px} />
        {Array.from({length: 40}, (_, i) => {
          const x = -100 + 105 * (i / 39), y = -100 + 30 * Math.abs(Math.sin(i * 0.37)) + (x < -60 ? (x + 60) * -0.6 : 0);
          return <path key={i} d={`M${x},${y + 6} q${1.5 - 3 * hash(i)},-4 ${2.4 - 4.8 * hash(i + 9)},-8`} stroke="#4A403B" strokeWidth={0.8} fill="none" opacity={0.7} />;
        })}
      </g>
      {/* ear */}
      <path d="M-56,-6 C-46,-16 -40,4 -44,18 C-46,30 -50,36 -58,38 C-66,40 -72,30 -70,16 C-69,4 -64,-2 -56,-6 Z" fill={SKIN} stroke={INK} strokeWidth={2.2 * px} />
      <path d="M-52,2 C-46,4 -47,16 -50,24 C-53,28 -58,28 -60,24" fill="none" stroke={SKIN_D} strokeWidth={1.4} />
      {/* brow, nostril, crow's feet */}
      <path d={`M0,${-23 - br * 3} C7,${-28 - br * 4} 14,${-27 - br * 3.5} 20,${-21.5 - br * 2}`} stroke={HAIR} strokeWidth={3.4} fill="none" strokeLinecap="round" />
      <path d="M36,36 C34,34 31,34 30,36" stroke="#7A4434" strokeWidth={1.6} fill="none" />
      {sm > 0.1 && [0, 1, 2].map((k) => <path key={k} d={`M${3 - k * 0.5},${-2 + k * 2.6} l-4,${-1 + k * 1}`} stroke={SKIN_D} strokeWidth={0.8} opacity={sm} />)}
      {/* the eye from outside */}
      {ext > 0 ? (
        <g>
          {/* V4: the finished eye from outside: an ordinary eye opening; the pink cheek-lining graft covers the eye,
              gently raised by the plate beneath it; only the end of the small clear cylinder stands out of it */}
          <path d={EXT_OPEN} fill={`url(#${id}xm)`} />
          <g clipPath={`url(#${id}eo)`}>
            {/* the plate's rise under the graft: a soft highlight over its front, a shadow below it */}
            <path d={`M${MUC_FRONT - 1.4},${PL_TOP - 0.6} C${MUC_FRONT - 0.2},${PL_TOP - 0.3} ${MUC_FRONT + 0.1},${PL_BOT} ${MUC_FRONT - 1.0},${PL_BOT + 1.2}`} stroke="rgba(255,226,220,0.55)" strokeWidth={0.9} fill="none" strokeLinecap="round" />
            <path d={`M${MUC_FRONT - 3.6},${PL_BOT + 1.6} C${MUC_FRONT - 2.2},${PL_BOT + 1.8} ${MUC_FRONT - 1},${PL_BOT + 1.5} ${MUC_FRONT - 0.3},${PL_BOT + 0.9}`} stroke="rgba(140,50,52,0.35)" strokeWidth={0.7} fill="none" strokeLinecap="round" />
            {['M6.2,-1.6 C8,-3.6 9.6,-2.8 11.4,-4.6', 'M6.4,1.8 C8.4,3.6 10,3 11.6,4.6', 'M12.6,3.8 C14,4.4 15.2,3.6 16.4,4.4'].map((d, i) => <path key={i} d={d} stroke="#B5444A" strokeWidth={0.2} fill="none" opacity={0.7} />)}
            <path d="M9,-4.6 C11.6,-6.2 14.4,-6.6 16.6,-6" stroke="rgba(255,240,236,0.7)" strokeWidth={0.4} fill="none" strokeLinecap="round" />
          </g>
          {/* the cylinder's end, out of the graft: clear acrylic, the dark of the eye behind it */}
          <path d={`M${MUC_FRONT - 0.3},${-HOLE_R} L${CYL_FRONT_X - 0.35},${-HOLE_R} Q${CYL_FRONT_X},${-HOLE_R} ${CYL_FRONT_X + 0.1},${-HOLE_R + 0.5} Q${CYL_FRONT_X + 0.2},0 ${CYL_FRONT_X + 0.1},${HOLE_R - 0.5} Q${CYL_FRONT_X},${HOLE_R} ${CYL_FRONT_X - 0.35},${HOLE_R} L${MUC_FRONT - 0.3},${HOLE_R} Z`}
            fill="#5B7A8A" stroke="rgba(22,52,70,0.95)" strokeWidth={1.4 * px} strokeLinejoin="round" />
          <rect x={MUC_FRONT - 0.2} y={-HOLE_R * 0.55} width={CYL_FRONT_X - MUC_FRONT} height={HOLE_R * 1.1} fill="#22303A" opacity={0.7} />
          <line x1={MUC_FRONT} x2={CYL_FRONT_X - 0.3} y1={-HOLE_R + 0.45} y2={-HOLE_R + 0.45} stroke="rgba(235,248,255,0.95)" strokeWidth={2.2 * px} strokeLinecap="round" />
          <path d={`M${MUC_FRONT - 0.3},${-HOLE_R - 0.35} Q${MUC_FRONT + 0.05},${-HOLE_R} ${MUC_FRONT - 0.3},${-HOLE_R + 0.1} M${MUC_FRONT - 0.3},${HOLE_R + 0.35} Q${MUC_FRONT + 0.05},${HOLE_R} ${MUC_FRONT - 0.3},${HOLE_R - 0.1}`} stroke="#B9625F" strokeWidth={0.35} fill="none" />
          <path d={EXT_OPEN} fill="none" stroke={INK} strokeWidth={1.6 * px} />
          {/* lids: the upper margin with lashes, the crease above, the lower margin */}
          <path d={`M4.4,-1.4 C8.4,${-7.0 - sm * 0.2} 13.4,${-8.3 - sm * 0.2} 17.9,-6.9`} stroke={INK} strokeWidth={2.8 * px} fill="none" strokeLinecap="round" />
          {Array.from({length: 9}, (_, i) => {
            const u = 0.15 + 0.8 * (i / 8), x = 4.4 + 13.5 * u, y = -1.4 - 7.2 * Math.sin(Math.PI * Math.min(1, u * 1.05)) * 0.95 - (u > 0.8 ? 0 : 0);
            return <path key={i} d={`M${x},${y} q${0.7},-1.0 ${1.7},-1.4`} stroke={INK} strokeWidth={1.3 * px} fill="none" strokeLinecap="round" />;
          })}
          <path d="M4.2,-6 C8,-11.5 13.5,-12.4 18.2,-10.2" stroke={SKIN_D} strokeWidth={1.1} fill="none" />
          <path d="M5,1.4 C8.6,6.2 13.4,7.3 17.4,5.8" stroke={INK} strokeWidth={1.8 * px} fill="none" />
          <path d="M5.6,4.4 C9,9.4 14,10.4 18,9" stroke={SKIN_D} strokeWidth={0.8} fill="none" opacity={0.7} />
          {tear > 0 && <path d={`M17.2,6.4 C16.9,${8 + tear * 5} 16.6,${10 + tear * 7} 17,${11 + tear * 8}`} stroke="#E6F4FA" strokeWidth={1.4} fill="none" opacity={0.85 * tear} strokeLinecap="round" />}
        </g>
      ) : blind ? (
        <g>
          {/* V5: his other eye, also blind: a white, scarred cornea between ordinary lids */}
          <path d="M6,-1.5 C9.5,-6 14.4,-6.6 16.6,-4.8 L16.8,4.8 C14.4,6.3 9.5,5.4 6,1.6 Z" fill="#F3E6E0" stroke={INK} strokeWidth={1.6 * px} />
          <path d="M14.6,-4.6 C16.6,-3.6 17.4,-1.4 17.4,0 C17.4,1.6 16.6,3.6 14.6,4.6 Z" fill="#F7F6F2" stroke="rgba(120,110,100,0.6)" strokeWidth={1 * px} />
          <path d="M8,-2.4 C10,-3.4 11.6,-2.8 13.4,-3.6 M8.4,2.6 C10.2,3.2 11.8,2.6 13.6,3.4" stroke="#C4525A" strokeWidth={0.2} fill="none" />
          <path d={`M5,-2 C9,${-7.5 - sm * 0.3} 14.6,${-8.2 - sm * 0.3} 17.4,-5.4`} stroke={INK} strokeWidth={2.6 * px} fill="none" strokeLinecap="round" />
          {Array.from({length: 7}, (_, i) => <path key={i} d={`M${8 + i * 1.35},${-6.6 - Math.sin(i * 0.5) * 0.6} l1.4,-1.5`} stroke={INK} strokeWidth={1.3 * px} />)}
          <path d="M5.6,2 C9,6.2 14.2,6.8 17.2,5.2" stroke={INK} strokeWidth={1.8 * px} fill="none" />
        </g>
      ) : (
        <g>
          <path d="M6,-1.5 C9.5,-6 14.4,-6.6 16.6,-4.8 L16.8,4.8 C14.4,6.3 9.5,5.4 6,1.6 Z" fill="#DE8F88" stroke={INK} strokeWidth={1.6 * px} />
          <path d={`M5,-2 C9,${-7.5 - sm * 0.3} 14.6,${-8.2 - sm * 0.3} 17.4,-5.4`} stroke={INK} strokeWidth={2.6 * px} fill="none" strokeLinecap="round" />
          {Array.from({length: 7}, (_, i) => <path key={i} d={`M${8 + i * 1.35},${-6.6 - Math.sin(i * 0.5) * 0.6} l1.4,-1.5`} stroke={INK} strokeWidth={1.3 * px} />)}
          <path d="M5.6,2 C9,6.2 14.2,6.8 17.2,5.2" stroke={INK} strokeWidth={1.8 * px} fill="none" />
          <rect x={16.6} y={-1.8} width={2.1} height={3.6} rx={0.4} fill="#16202A" stroke="#7FA1B4" strokeWidth={1.4 * px} />
          <ellipse cx={18.2} cy={-0.9} rx={0.3} ry={0.5} fill="#FFFFFF" opacity={0.85} />
          {tear > 0 && <path d={`M16,6 C15.6,${8 + tear * 6} 15.2,${10 + tear * 8} 15.6,${11 + tear * 9}`} stroke="#E6F4FA" strokeWidth={1.6} fill="none" opacity={0.85 * tear} strokeLinecap="round" />}
        </g>
      )}
      {pocket && pocket.win > 0 && <PocketSection p={pocket} px={px} id={`${id}pk`} />}
      {/* the cut-away: the eye in section; the plate (drawn over the cut edge, so it is never clipped as it arrives),
          then the graft and the cut lids in front of it, then the cylinder through the graft */}
      {win > 0 && winOp > 0 && (
        <g opacity={winOp}>
          <g clipPath={`url(#${id}ew)`}><EyeSection2 s={s} px={px} id={`${id}es`} /></g>
          {s.implOn > 0 && <g opacity={clamp(s.implOn) * clamp(win * 1.6 - 0.2)}><PlateSect dx={s.implDx} px={px} id={`${id}ps`} part="plate" tissue={clamp(s.tissue * 4)} /></g>}
          <g clipPath={`url(#${id}ew)`}><EyeSection2 s={s} px={px} id={`${id}ef`} front /></g>
          {s.implOn > 0 && <g opacity={clamp(s.implOn) * clamp(win * 1.6 - 0.2)}><PlateSect dx={s.implDx} px={px} id={`${id}pc`} part="cyl" /></g>}
          <g transform={wT}>
            <path d={EYE_WIN} fill="none" stroke="#E7A386" strokeWidth={1.2 / win} />
            <path d={EYE_WIN} fill="none" stroke={INK} strokeWidth={1.8 * px / win} />
          </g>
        </g>
      )}
    </g>
  );
};
