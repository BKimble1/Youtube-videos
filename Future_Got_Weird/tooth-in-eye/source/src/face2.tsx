// V2: the patient front-on. The same man as the profile (profile2.tsx): short dark hair, a short dark beard and
// moustache, the same skin tone and gown. Millimetres, origin between the eyes, y down. His right eye (screen left,
// EL) is the damaged eye; his left eye (screen right, ER) is the "other eye", also blind (both corneas scarred).
// Adds, for V2: a penlight test on the damaged eye (white glare off the scar; a red reflex through a clear cornea),
// a donor cornea that clouds over, the retracted mouth with the full front teeth (the canine taken from the upper
// left), and a layered cut-away of the pocket under the other eye.
// V4: the finished OOKP eye front-on (the graft over the eye, the plate a gentle rise under it, only the small
// cylinder's end showing) with a local cut-away of the graft over the plate; the pocket is under closed skin, seen
// through it (no opening); a smile, an open mouth and a tear for his reaction.
import React from 'react';
import {clamp, hash, lerp} from './lib';
import {EL, ER, ES, upperLid, lowerLid, fissure, Lashes} from './face';
import {Implant, Rot, ROOT, CROWN, BLOCK, LAMINA, HOLE, HOLE_R, Z_F, faceMatrix, projectPt, alongPoly} from './implant';
import {CUT_U} from './profile';
import {SKIN, SKIN_D, SKIN_L, HAIR, BEARD} from './profile2';

const INK = '#3E241A';
export {EL, ER, ES};

// ---------------------------------------------------------------- eyes
export type EyeLook = {
  scar: number;          // 1 opaque white scar .. 0 clear (only under a clear donor graft)
  glare: number;         // penlight on the eye
  donor: number;         // 0 away .. 1 seated
  donorCloud: number;    // the graft clouds and vessels grow in
  mucosa: number;        // stage-1 cheek-lining graft over the eye (pink)
  ookp?: number;         // V4: the finished eye: the plate under the graft, the cylinder's end out of it
  cut?: number;          // V4: local cut-away of the graft over the plate (0 closed .. 1 open)
};
export const LOOK0: EyeLook = {scar: 1, glare: 0, donor: 0, donorCloud: 0, mucosa: 0};
/** V4: the implant's pose on the finished eye, front-on (its face to us, long axis across the eye, bone strip up), and
 *  where its hole axis sits in the eye's own coordinates */
export const FRONT_ROT: Rot = {yaw: 0, pitch: 0, roll: 0, spin: 0};
export const EYE_HOLE: [number, number] = [0, 0.2];
const ptsD = (q: [number, number][]) => 'M' + q.map((v) => `${v[0].toFixed(3)},${v[1].toFixed(3)}`).join('L') + 'Z';
/** a polygon pushed outward from its centroid by d */
const grow = (q: [number, number][], d: number): [number, number][] => {
  const cx = q.reduce((a, v) => a + v[0], 0) / q.length, cy = q.reduce((a, v) => a + v[1], 0) / q.length;
  return q.map(([x, y]) => {const vx = x - cx, vy = y - cy, L = Math.hypot(vx, vy) || 1; return [x + (vx / L) * d, y + (vy / L) * d];});
};
const plateOutline = (x: number, y: number, s: number, rot: Rot) => LAMINA.map(([a, b]) => {const q = projectPt(x, y, s, rot, [a, b, Z_F]); return [q[0], q[1]] as [number, number];});
/** the end of the optical cylinder seen from in front: clear acrylic with the dark of the eye behind it */
const CylEnd: React.FC<{id: string; x: number; y: number; px: number}> = ({id, x, y, px}) => (
  <g>
    <defs><radialGradient id={`${id}ce`} cx="0.42" cy="0.4" r="0.62"><stop offset="0" stopColor="#0B1116" /><stop offset="0.7" stopColor="#1C2A34" /><stop offset="1" stopColor="#3E5866" /></radialGradient></defs>
    <circle cx={x + 0.2} cy={y + 0.25} r={HOLE_R + 0.45} fill="rgba(110,30,34,0.35)" style={{filter: 'blur(0.3px)'}} />
    <circle cx={x + 0.18} cy={y + 0.2} r={HOLE_R} fill="#9DC4D4" />
    <circle cx={x} cy={y} r={HOLE_R} fill={`url(#${id}ce)`} stroke="rgba(205,232,245,0.95)" strokeWidth={0.22} />
    <circle cx={x} cy={y} r={HOLE_R} fill="none" stroke="rgba(20,40,52,0.9)" strokeWidth={1.2 * px} />
    <ellipse cx={x - 0.62} cy={y - 0.6} rx={0.55} ry={0.32} fill="rgba(255,255,255,0.92)" transform={`rotate(-30 ${x - 0.62} ${y - 0.6})`} />
    <circle cx={x + 0.7} cy={y + 0.62} r={0.2} fill="rgba(210,232,245,0.7)" />
  </g>
);

const Eye2: React.FC<{id: string; px: number; s: number; L: EyeLook}> = ({id, px, s, L}) => {
  // what light does at the front of the eye: through a clear cornea it reaches the retina and the pupil glows red
  // (the red reflex); on a scar it is thrown back as white glare
  const corneaClear = L.donor > 0.98 ? 1 - clamp(L.donorCloud * 1.3) : 0;
  const reflex = L.glare * corneaClear;
  const whiteGlare = L.glare * (1 - corneaClear);
  const dx = (1 - L.donor) * 16, dy = -(1 - L.donor) * 9;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}scl`} cx="0.5" cy="0.45" r="0.6"><stop offset="0" stopColor="#FBEDE6" /><stop offset="1" stopColor="#E0B2A6" /></radialGradient>
        <radialGradient id={`${id}cor`} cx="0.45" cy="0.42" r="0.6"><stop offset="0" stopColor="#FAF8F4" /><stop offset="0.6" stopColor="#E3E2DD" /><stop offset="1" stopColor="#BDB7AF" /></radialGradient>
        <radialGradient id={`${id}rr`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFB070" /><stop offset="0.6" stopColor="#D8462A" /><stop offset="1" stopColor="#7A1A12" /></radialGradient>
        <radialGradient id={`${id}gl`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0.85" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}muc`} cx="0.42" cy="0.36" r="0.75"><stop offset="0" stopColor="#F2B7AF" /><stop offset="0.55" stopColor="#E3958E" /><stop offset="1" stopColor="#B9625F" /></radialGradient>
      </defs>
      <rect x={-16} y={-9} width={32} height={18} fill={`url(#${id}scl)`} />
      {['M-14,-0.5 C-11,-1.6 -9,0 -6.5,-1', 'M14,0.8 C11,0 9.6,1.6 6.8,0.8', 'M-13.6,2.4 C-11,2 -9,3.4 -6.8,2.6', 'M13.5,-1.4 C11,-2.2 9.4,-0.8 6.9,-1.6'].map((d, i) => (
        <path key={i} d={d} stroke="#C2484E" strokeWidth={0.2} fill="none" opacity={0.75} />
      ))}
      {/* iris and pupil (hidden under the scar) */}
      <circle cx={0} cy={0.2} r={5.7} fill="#6B4A33" />
      {Array.from({length: 24}, (_, i) => {const a = (i / 24) * Math.PI * 2; return <line key={i} x1={2.2 * Math.cos(a)} y1={0.2 + 2.2 * Math.sin(a)} x2={5.4 * Math.cos(a)} y2={0.2 + 5.4 * Math.sin(a)} stroke="#8A6448" strokeWidth={0.18} />;})}
      <circle cx={0} cy={0.2} r={2.1} fill="#0D0B0A" />
      {reflex > 0 && <circle cx={0} cy={0.2} r={2.1} fill={`url(#${id}rr)`} opacity={reflex} />}
      {/* the scar: a white, vascularised opacity */}
      {L.scar > 0 && (
        <g opacity={L.scar * (1 - corneaClear * 0.98)}>
          <circle cx={0} cy={0.2} r={5.75} fill={`url(#${id}cor)`} />
          <path d="M-3.6,-2.6 C-1,-4.2 2.8,-3.4 3.9,-1 C5,1.6 3,3.8 0.4,3.9 C-2.6,4 -4.6,2 -4.4,-0.4 Z" fill="#FFFFFF" opacity={0.85} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * 2 * Math.PI + 0.4 * s;
            const x0 = 5.6 * Math.cos(a), y0 = 0.2 + 5.6 * Math.sin(a), x1 = 3.1 * Math.cos(a + 0.25), y1 = 0.2 + 3.1 * Math.sin(a + 0.25);
            return <path key={i} d={`M${x0},${y0} Q${(x0 + x1) / 2 + 0.6},${(y0 + y1) / 2 - 0.5} ${x1},${y1}`} stroke="#C4525A" strokeWidth={0.2} fill="none" opacity={0.8} />;
          })}
        </g>
      )}
      <circle cx={0} cy={0.2} r={5.75} fill="none" stroke="rgba(80,60,50,0.45)" strokeWidth={1.2 * px} />
      {/* a donor cornea: a clear button stitched into the centre, which then clouds and vascularises */}
      {L.donor > 0 && (
        <g transform={`translate(${dx},${dy})`}>
          <circle cx={0} cy={0.2} r={4.1} fill="rgba(200,236,250,0.22)" stroke="#5E8FA6" strokeWidth={1.6 * px} />
          <path d="M-2.6,-2.2 C-1.4,-3.2 0.6,-3.3 1.8,-2.8" stroke="#FFFFFF" strokeWidth={0.35} fill="none" strokeLinecap="round" opacity={0.85} />
          <circle cx={0} cy={0.2} r={4.1} fill="#F3F1EC" opacity={clamp(L.donorCloud)} />
          {L.donor > 0.97 && Array.from({length: 8}, (_, i) => {
            const a = (i / 8) * Math.PI * 2 + 0.2;
            return <line key={i} x1={3.6 * Math.cos(a)} y1={0.2 + 3.6 * Math.sin(a)} x2={4.7 * Math.cos(a)} y2={0.2 + 4.7 * Math.sin(a)} stroke="#1D2633" strokeWidth={0.16} />;
          })}
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2 + 0.5;
            return <path key={i} d={`M${5.6 * Math.cos(a)},${0.2 + 5.6 * Math.sin(a)} Q${3.4 * Math.cos(a + 0.3)},${0.2 + 3.4 * Math.sin(a + 0.3)} ${1.4 * Math.cos(a + 0.1)},${0.2 + 1.4 * Math.sin(a + 0.1)}`} stroke="#B9343E" strokeWidth={0.22} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(L.donorCloud * 1.5 - i * 0.1)} />;
          })}
        </g>
      )}
      {/* the penlight's light on the eye */}
      {whiteGlare > 0 && (
        <g opacity={whiteGlare}>
          <circle cx={0.6} cy={-0.3} r={6.5} fill={`url(#${id}gl)`} />
          {Array.from({length: 10}, (_, i) => {const a = (i / 10) * Math.PI * 2 + 0.3; return <line key={i} x1={0.6 + 2 * Math.cos(a)} y1={-0.3 + 2 * Math.sin(a)} x2={0.6 + (5 + 3 * hash(i)) * Math.cos(a)} y2={-0.3 + (5 + 3 * hash(i)) * Math.sin(a)} stroke="#FFFFFF" strokeWidth={0.22} opacity={0.6} />;})}
        </g>
      )}
      {L.glare > 0 && <circle cx={1.2} cy={-0.9} r={0.55} fill="#FFFFFF" opacity={L.glare} />}
      {L.glare === 0 && L.mucosa < 0.5 && !(L.ookp ?? 0) && <ellipse cx={-1.6} cy={-1.8} rx={1.1} ry={0.7} fill="rgba(255,255,255,0.8)" transform="rotate(-25 -1.6 -1.8)" />}
      {L.mucosa > 0 && (
        <g opacity={L.mucosa}>
          <rect x={-16} y={-9} width={32} height={18} fill={`url(#${id}muc)`} />
          {['M-13,-1 C-10,-2.4 -8,-1 -6,-2.6', 'M12.5,0.4 C10,-1 8.6,0.6 6.8,-0.8', 'M-4,4.6 C-3,3.6 -1.4,4.4 0,3.6', 'M3,-4.8 C4.4,-3.6 6,-4.4 7.2,-3.4'].map((d, i) => <path key={i} d={d} stroke="#B5444A" strokeWidth={0.22} fill="none" opacity={0.7} />)}
        </g>
      )}
      {(L.ookp ?? 0) > 0 && (() => {
        const ol = plateOutline(EYE_HOLE[0], EYE_HOLE[1], 1, FRONT_ROT);
        const u = clamp(L.cut ?? 0);
        const win = ptsD(grow(ol, 0.8));
        const wT = `translate(${EYE_HOLE[0]},${EYE_HOLE[1]}) scale(${Math.max(0.001, u)}) translate(${-EYE_HOLE[0]},${-EYE_HOLE[1]})`;
        return (
          <g opacity={L.ookp}>
            {/* the plate's rise under the graft: light on its upper edge, a soft shadow under its lower edge */}
            <path d={ptsD(ol)} fill="#F3D2C4" opacity={0.18} />
            <path d={ptsD(ol)} fill="none" stroke="rgba(255,232,224,0.6)" strokeWidth={0.7} transform="translate(-0.25,-0.3)" style={{filter: 'blur(0.35px)'}} />
            <path d={ptsD(ol)} fill="none" stroke="rgba(120,40,42,0.32)" strokeWidth={0.8} transform="translate(0.3,0.45)" style={{filter: 'blur(0.4px)'}} />
            {/* the local cut-away: the graft opened over the plate, its cut edge showing its thickness */}
            {u > 0.002 && (
              <g>
                <defs><clipPath id={`${id}cw`}><path d={win} transform={wT} /></clipPath></defs>
                <g clipPath={`url(#${id}cw)`}>
                  <path d={win} fill="#B9625F" transform={wT} />
                  <Implant id={`${id}pl`} x={EYE_HOLE[0]} y={EYE_HOLE[1]} s={1} rot={FRONT_ROT} px={px} cyl={0} hole={1} tissue={0.12} vessels={1} />
                  <path d={win} transform={wT} fill="none" stroke="rgba(80,16,18,0.5)" strokeWidth={1.1 / Math.max(0.2, u)} style={{filter: 'blur(0.5px)'}} />
                </g>
                <path d={win} transform={wT} fill="none" stroke="#F2B7AF" strokeWidth={0.55 / Math.max(0.2, u)} strokeLinejoin="round" />
                <path d={win} transform={wT} fill="none" stroke="rgba(110,40,40,0.85)" strokeWidth={1.1 * px / Math.max(0.2, u)} strokeLinejoin="round" />
              </g>
            )}
            <CylEnd id={`${id}cy`} x={EYE_HOLE[0]} y={EYE_HOLE[1]} px={px} />
          </g>
        );
      })()}
    </g>
  );
};

// ---------------------------------------------------------------- the retracted mouth and the front teeth
// The canine taken is his upper LEFT canine (screen right). It is drawn with the implant renderer's own geometry
// (ROOT, CROWN, BLOCK), so the block that comes out matches the tooth that was in the jaw exactly.
export const CAN_AT: [number, number] = [17.3, 56.2];
export const CAN_ROT: Rot = {yaw: 35, pitch: 0, roll: 0, spin: -90};
const UP: [number, number, number, string][] = [[-27.2, 4.6, 7.2, 'p'], [-22.8, 5.2, 7.8, 'p'], [-17.4, 6.2, 9.6, 'c'], [-11.6, 6.2, 8.8, 'i'], [-4.3, 8.2, 10.4, 'i'], [4.3, 8.2, 10.4, 'i'], [11.6, 6.2, 8.8, 'i'], [22.8, 5.2, 7.8, 'p'], [27.2, 4.6, 7.2, 'p']];
const LO: [number, number, number][] = [[-28.6, 4.4, 6], [-24.8, 4.8, 6.6], [-20.2, 5.4, 7.4], [-14.6, 5, 7.8], [-9.4, 5, 8.2], [-3.0, 5.4, 8.6], [3.0, 5.4, 8.6], [9.4, 5, 8.2], [14.6, 5, 7.8], [20.2, 5.4, 7.4], [24.8, 4.8, 6.6], [28.6, 4.4, 6]];
const GUM_UP = 63.4, GUM_LO = 84.2;
const upperTooth = (x: number, w: number, h: number, k: string) => {
  const t = GUM_UP + h, r = k === 'i' ? 1.1 : 2.2;
  return k === 'c'
    ? `M${x - w / 2},${GUM_UP} C${x - w / 2 - 0.3},${t - 3} ${x - w * 0.2},${t - 0.6} ${x},${t} C${x + w * 0.2},${t - 0.6} ${x + w / 2 + 0.3},${t - 3} ${x + w / 2},${GUM_UP} Z`
    : `M${x - w / 2},${GUM_UP} L${x - w / 2 - 0.2},${t - r} Q${x - w / 2},${t} ${x - w / 2 + r},${t} L${x + w / 2 - r},${t} Q${x + w / 2},${t} ${x + w / 2 + 0.2},${t - r} L${x + w / 2},${GUM_UP} Z`;
};
const lowerTooth = (x: number, w: number, h: number) => {
  const t = GUM_LO - h;
  return `M${x - w / 2},${GUM_LO} L${x - w / 2 + 0.2},${t + 1} Q${x - w / 2 + 0.3},${t} ${x - w / 2 + 1},${t} L${x + w / 2 - 1},${t} Q${x + w / 2 - 0.3},${t} ${x + w / 2 - 0.2},${t + 1} L${x + w / 2},${GUM_LO} Z`;
};
const PP = (pts: [number, number][]) => 'M' + pts.map((q) => `${q[0].toFixed(3)},${q[1].toFixed(3)}`).join('L') + 'Z';
export const CUT_WIN = 'M8.5,58 C8,50 10,44 15,42.5 C20,41.5 25.5,43.5 26.8,49 C27.6,53 27.2,58 26.4,62 L9.2,62.4 Z';

export type MouthState = {
  retract: number;       // the lips held back by cheek retractors
  cut: number;           // cut-away over the canine's root (0 closed .. 1 open)
  saw: number;           // saw progress round the root
  canine: 'in' | 'block' | 'gone';
};
const Mouth: React.FC<{id: string; px: number; m: MouthState}> = ({id, px, m}) => {
  const r = clamp(m.retract);
  const rx = lerp(19, 34, r), ry = lerp(0.8, 16, r);
  const open = `M${-rx},73 C${-rx * 0.6},${73 - ry * 1.05} ${rx * 0.6},${73 - ry * 1.05} ${rx},73 C${rx * 0.6},${73 + ry * 1.12} ${-rx * 0.6},${73 + ry * 1.12} ${-rx},73 Z`;
  const cm = faceMatrix(CAN_AT[0], CAN_AT[1], 1, CAN_ROT);
  return (
    <g>
      <defs><clipPath id={`${id}mo`}><path d={open} /></clipPath>
        <pattern id={`${id}bn`} width="2.4" height="2.4" patternUnits="userSpaceOnUse"><rect width="2.4" height="2.4" fill="#DDB892" /><ellipse cx="0.7" cy="0.8" rx="0.32" ry="0.22" fill="#A97B57" /><ellipse cx="1.8" cy="1.7" rx="0.24" ry="0.18" fill="#A97B57" /></pattern>
        <clipPath id={`${id}cw`}><path d={CUT_WIN} transform={`translate(17.5,52) scale(${Math.max(0.001, m.cut)}) translate(-17.5,-52)`} /></clipPath>
      </defs>
      {/* lips (vermilion), stretched round the opening */}
      <path d={open} fill="#B56B5E" stroke="#A35A4E" strokeWidth={3.4 * (0.4 + r)} />
      <g clipPath={`url(#${id}mo)`}>
        <rect x={-40} y={50} width={80} height={45} fill="#3D1715" />
        {/* gums */}
        <path d={`M-40,52 L40,52 L40,${GUM_UP + 0.6} ${UP.map(([x, w]) => `L${x + w / 2},${GUM_UP + 0.6} Q${x},${GUM_UP - 1.6} ${x - w / 2},${GUM_UP + 0.6}`).join(' ')} L-40,${GUM_UP + 0.6} Z`} fill="#E3908A" />
        <path d={`M-40,95 L40,95 L40,${GUM_LO - 0.5} L-40,${GUM_LO - 0.5} Z`} fill="#DE8A84" />
        {/* lower teeth, then the upper teeth over them */}
        {LO.map(([x, w, h], i) => <path key={i} d={lowerTooth(x, w, h)} fill="#EEEAE0" stroke="rgba(70,50,40,0.75)" strokeWidth={1.2 * px} />)}
        {UP.map(([x, w, h, k], i) => (
          <g key={i}>
            <path d={upperTooth(x, w, h, k)} fill="#F7F5EF" stroke="rgba(70,50,40,0.8)" strokeWidth={1.3 * px} />
            <path d={`M${x - w * 0.18},${GUM_UP + 1.5} L${x - w * 0.2},${GUM_UP + h * 0.7}`} stroke="#FFFFFF" strokeWidth={0.6} strokeLinecap="round" opacity={0.85} />
          </g>
        ))}
        {/* his upper left canine (drawn on the implant's geometry) */}
        {m.canine === 'in' && (
          <g transform={cm}>
            <path d={PP(CROWN)} fill="#F7F5EF" stroke="rgba(70,50,40,0.8)" strokeWidth={1.3 * px} />
            <path d="M18.6,2.9 C21,3.2 23.5,2.2 25.4,0.9" fill="none" stroke="#FFFFFF" strokeWidth={0.55} strokeLinecap="round" />
          </g>
        )}
        {m.canine !== 'in' && (
          // the gap it leaves: the socket edge in the gum and the dark mouth behind
          <path d={`M${CAN_AT[0] - 3.2},${GUM_UP - 0.4} Q${CAN_AT[0]},${GUM_UP - 2.2} ${CAN_AT[0] + 3.3},${GUM_UP - 0.4} L${CAN_AT[0] + 3.3},${GUM_UP + 0.8} L${CAN_AT[0] - 3.2},${GUM_UP + 0.8} Z`} fill="#8E2A2C" />
        )}
      </g>
      {/* the cut-away over the root: gum and bone see-through, the canine root inside its bone */}
      {m.cut > 0 && (
        <g>
          <g clipPath={`url(#${id}cw)`}>
            <rect x={5} y={38} width={26} height={27} fill={`url(#${id}bn)`} />
            <path d={`M10.2,63 C10,58 10.6,53 11.6,50 C12.6,53 13.2,58 13,63 Z`} fill="#EBDDBE" opacity={0.75} />
            <path d={`M21.4,63 C21.2,58 21.8,53 22.8,49.6 C23.8,53 24.4,58 24.2,63 Z`} fill="#EBDDBE" opacity={0.75} />
            {m.canine === 'in' && (
              <g transform={cm}>
                <path d={PP(ROOT)} fill="#F6EBD0" stroke="#C9A35E" strokeWidth={0.28} />
                <path d="M0.9,0.05 L17,0.5 L17,-0.4 Z" fill="#B9806C" />
              </g>
            )}
            {m.canine !== 'in' && <path d={PP(blockPts())} fill="#7E2C2E" />}
            {/* the saw's kerf, round the root */}
            {m.saw > 0 && m.canine === 'in' && <path d={'M' + cutPts().map((q) => `${q[0]},${q[1]}`).join('L')} fill="none" stroke="#5E1A1D" strokeWidth={0.55} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(m.saw)} />}
            <path d="M5,62 L31,62 L31,66 L5,66 Z" fill="#E3908A" />
          </g>
          <g transform={`translate(17.5,52) scale(${m.cut}) translate(-17.5,-52)`}>
            <path d={CUT_WIN} fill="none" stroke="#E7A386" strokeWidth={1.0 / Math.max(0.2, m.cut)} />
            <path d={CUT_WIN} fill="none" stroke={INK} strokeWidth={1.6 * px / Math.max(0.2, m.cut)} />
          </g>
        </g>
      )}
      {/* cheek retractors at the corners */}
      {r > 0.05 && [-1, 1].map((s) => (
        <path key={s} d={`M${s * (rx + 1)},${73 - 12} C${s * (rx + 7)},${73 - 6} ${s * (rx + 7)},${73 + 6} ${s * (rx + 1)},${73 + 12}`} fill="none" stroke="rgba(235,245,250,0.75)" strokeWidth={3.2} strokeLinecap="round" opacity={clamp((r - 0.05) * 3)} />
      ))}
    </g>
  );
};
const toFace = (p: [number, number]) => {const q = projectPt(CAN_AT[0], CAN_AT[1], 1, CAN_ROT, [p[0], p[1], 1.6]); return [q[0], q[1]] as [number, number];};
export const blockPts = () => BLOCK.map(toFace);
export const cutPts = () => CUT_U.map(toFace);
export const cutPoint = (u: number): [number, number] => {
  const ps = cutPts();
  const L: number[] = [0];
  for (let i = 1; i < ps.length; i++) L.push(L[i - 1] + Math.hypot(ps[i][0] - ps[i - 1][0], ps[i][1] - ps[i - 1][1]));
  const tg = clamp(u) * L[L.length - 1];
  for (let i = 1; i < ps.length; i++) if (tg <= L[i]) {const k = (tg - L[i - 1]) / (L[i] - L[i - 1] || 1); return [lerp(ps[i - 1][0], ps[i][0], k), lerp(ps[i - 1][1], ps[i][1], k)];}
  return ps[ps.length - 1];
};

// ---------------------------------------------------------------- the pocket under the other eye
// V4: no opening in the face. The plate goes in through a short incision under the lashes and lies beneath the skin
// and the muscle of the lower lid; when we need to see it, the skin over it is seen through (the plate ghosted under
// the skin's tint and the muscle fibres, confined to the plate's own outline), and the new vessels grow round it.
export const POCKET2: [number, number] = [36, 28];
export type PocketState = {
  incision: number;      // the skin opened below the lashes
  sutured: number; heal: number;
  win: number;           // V4: how far the skin over the pocket is seen through (0 .. 1)
  bump: number;          // the implant under the skin (its rise, when not seen through)
  impl: {x: number; y: number; rot: Rot; tissue: number; vessels: number} | null;
  above: number;         // how far the implant is still outside the skin (1 fully outside .. 0 in the pocket)
};
export const NO_POCKET2: PocketState = {incision: 0, sutured: 0, heal: 1, win: 0, bump: 0, impl: null, above: 1};
const INCISION_Y = POCKET2[1] - 11.5;

const PocketCut: React.FC<{id: string; px: number; p: PocketState}> = ({id, px, p}) => {
  const see = clamp(p.win);
  const implEl = (key: string, op = 1) => p.impl && <Implant key={key} id={`${id}${key}`} x={p.impl.x} y={p.impl.y} s={ES} rot={p.impl.rot} px={px} cylMode="clear" tissue={p.impl.tissue} vessels={p.impl.vessels} holeBg="#C98B7A" opacity={op} />;
  const ol = p.impl ? plateOutline(p.impl.x, p.impl.y, ES, p.impl.rot) : null;
  // where the plate rests in the pocket (for its rise and the vessels, which stay put while it is in)
  const rest = plateOutline(POCKET2[0] + 1.6, POCKET2[1] + 0.4, ES, {yaw: 0, pitch: 0, roll: 0});
  const vg = p.impl ? clamp(p.impl.vessels) : 0;
  return (
    <g>
      <defs>
        <clipPath id={`${id}ab`}><rect x={0} y={-60} width={90} height={INCISION_Y + 60} /></clipPath>
        <clipPath id={`${id}be`}><rect x={0} y={INCISION_Y} width={90} height={80} /></clipPath>
        <pattern id={`${id}mus`} width="1.2" height="1.2" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)"><rect width="1.2" height="1.2" fill="none" /><line x1="0" y1="0.3" x2="1.2" y2="0.3" stroke="#A24439" strokeWidth="0.3" /></pattern>
      </defs>
      {/* the plate's rise under the closed skin */}
      {p.bump > 0 && (
        <g opacity={p.bump * (1 - see)}>
          <path d={ptsD(rest)} fill="rgba(255,226,200,0.14)" stroke="rgba(255,228,204,0.3)" strokeWidth={1.6} strokeLinejoin="round" transform="translate(-0.4,-0.5)" style={{filter: 'blur(1.4px)'}} />
          <path d={ptsD(rest)} fill="none" stroke="rgba(120,60,40,0.2)" strokeWidth={1.6} strokeLinejoin="round" transform="translate(0.6,0.8)" style={{filter: 'blur(1.5px)'}} />
        </g>
      )}
      {/* beneath the skin: the plate seen through it, under the muscle fibres and the skin's own tint */}
      {see > 0.01 && p.impl && ol && (
        <g clipPath={`url(#${id}be)`}>
          {implEl('in', 0.25 + 0.45 * see)}
          <path d={ptsD(grow(ol, 0.6))} fill={`url(#${id}mus)`} opacity={0.5 * see} />
          <path d={ptsD(grow(ol, 1.4))} fill={SKIN} opacity={0.3 * see} style={{filter: 'blur(1.2px)'}} />
          {/* the new vessels growing in from the surrounding tissue, round and over the plate's edge */}
          {vg > 0 && Array.from({length: 12}, (_, i) => {
            const [x0, y0] = alongPoly(grow(rest, 2.4 + 1.2 * hash(i * 3.1)), (i + 0.3 * hash(i)) / 12);
            const [x1, y1] = alongPoly(grow(rest, -1.2), (i + 0.5) / 12);
            const mx = (x0 + x1) / 2 + (hash(i * 7) - 0.5) * 2, my = (y0 + y1) / 2 + (hash(i * 9) - 0.5) * 2;
            const bx = lerp(x0, x1, 0.45) + (hash(i * 5) - 0.5) * 2.5, by = lerp(y0, y1, 0.45) + (hash(i * 11) - 0.5) * 2.5;
            const g = clamp(vg * 1.5 - (i % 4) * 0.12);
            return (
              <g key={i} opacity={see * (1 - p.above) * 0.85}>
                <path d={`M${x0},${y0} Q${mx},${my} ${x1},${y1}`} stroke="#B9262F" strokeWidth={0.24} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - g} />
                <path d={`M${lerp(x0, x1, 0.4)},${lerp(y0, y1, 0.4)} L${bx},${by}`} stroke="#C4323A" strokeWidth={0.15} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(g * 1.4 - 0.5)} />
              </g>
            );
          })}
        </g>
      )}
      {/* the part of the plate still outside the skin, above the incision */}
      {p.impl && p.above > 0 && <g clipPath={`url(#${id}ab)`}>{implEl('out')}</g>}
      {/* the incision below the lashes, sutures, the healed line */}
      {p.incision > 0 && (
        <g opacity={clamp(1 - p.heal * 0.85)}>
          <path d={`M${POCKET2[0] - 10},${INCISION_Y + 0.6} C${POCKET2[0] - 3},${INCISION_Y + 1.8} ${POCKET2[0] + 5},${INCISION_Y + 1.6} ${POCKET2[0] + 11},${INCISION_Y - 0.4}`} stroke="#7E2629" strokeWidth={0.5 + 1.2 * p.incision * (1 - p.sutured)} fill="none" strokeLinecap="round" />
          {p.sutured > 0 && [0, 1, 2, 3, 4].map((k) => {
            const x = POCKET2[0] - 8 + k * 4.4, y = INCISION_Y + 1.2 - Math.abs(k - 2) * 0.3;
            return <path key={k} d={`M${x - 0.7},${y - 0.9} L${x + 0.7},${y + 0.9} M${x + 0.7},${y - 0.9} L${x - 0.7},${y + 0.9}`} stroke="#23313F" strokeWidth={0.3} opacity={clamp(p.sutured * 5 - k) * clamp(1 - p.heal * 1.3)} />;
          })}
        </g>
      )}
    </g>
  );
};
export const INCISION_AT = INCISION_Y;

// ---------------------------------------------------------------- the face
export type FaceState2 = {left: EyeLook; brow: number; smile: number; mouth: MouthState | null; pocket: PocketState; light: number; bruise: number; open?: number; tear?: number};

export const Face2: React.FC<{id: string; px: number; f: FaceState2}> = ({id, px, f}) => {
  const epx = px / ES, brY = -f.brow * 3.2;
  const sm = f.smile, op = f.open ?? 0, sq = 0.9 * sm;
  const mouthOn = f.mouth && f.mouth.retract > 0.001;
  const eye = (side: 'L' | 'R') => {
    const [cx, cy] = side === 'L' ? EL : ER, s = side === 'L' ? -1 : 1;
    const L = side === 'L' ? f.left : LOOK0;
    return (
      <g transform={`translate(${cx},${cy}) scale(${ES})`}>
        <defs><clipPath id={`${id}f${side}`}><path d={fissure(s, sq)} /></clipPath></defs>
        <g clipPath={`url(#${id}f${side})`}>
          <Eye2 id={`${id}e${side}`} px={epx} s={s} L={L} />
          <path d={upperLid(s, sq) + ' L14.4,-8 L-14.6,-8 Z'} fill="rgba(60,20,10,0.28)" transform="translate(0,1.1)" style={{filter: 'blur(0.6px)'}} />
        </g>
        <path d={fissure(s, sq)} fill="none" stroke={INK} strokeWidth={2.2 * epx} strokeLinejoin="round" />
        <path d={upperLid(s, sq)} fill="none" stroke={INK} strokeWidth={3.4 * epx} strokeLinecap="round" />
        <Lashes s={s} sq={sq} px={epx} />
        <path d={s < 0 ? 'M14.4,1.2 q-1.6,-1.2 -2.6,0.1 q1.2,1.2 2.6,-0.1Z' : 'M-14.6,0.6 q1.6,-1.2 2.6,0.1 q-1.2,1.2 -2.6,-0.1Z'} fill="#D9817B" />
      </g>
    );
  };
  return (
    <g>
      <defs>
        <linearGradient id={`${id}sk`} x1="0" y1="0" x2="1" y2="0.2"><stop offset="0" stopColor={SKIN_L} /><stop offset="0.5" stopColor={SKIN} /><stop offset="1" stopColor={SKIN_D} /></linearGradient>
        <radialGradient id={`${id}fsh`} cx="0.42" cy="0.38" r="0.7"><stop offset="0.55" stopColor="rgba(0,0,0,0)" /><stop offset="1" stopColor="rgba(90,40,20,0.35)" /></radialGradient>
        <linearGradient id={`${id}gown`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B9D3E0" /><stop offset="1" stopColor="#8FB1C4" /></linearGradient>
        <pattern id={`${id}gp`} width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="none" /><path d="M4.5,2 L6,4.5 L4.5,7 L3,4.5Z" fill="#7FA2B6" opacity="0.7" /></pattern>
        <clipPath id={`${id}hd`}><path d="M0,-118 C40,-118 68,-92 70,-48 C72,-20 72,10 68,36 C64,70 46,104 22,118 C10,124 -10,124 -22,118 C-46,104 -64,70 -68,36 C-72,10 -72,-20 -70,-48 C-68,-92 -40,-118 0,-118 Z" /></clipPath>
      </defs>
      <path d="M-150,260 C-140,175 -95,150 -42,140 L42,140 C95,150 140,175 150,260 Z" fill={`url(#${id}gown)`} stroke={INK} strokeWidth={2.6 * px} />
      <path d="M-150,260 C-140,175 -95,150 -42,140 L42,140 C95,150 140,175 150,260 Z" fill={`url(#${id}gp)`} />
      <path d="M-34,95 L-36,146 C-18,160 18,160 36,146 L34,95 Z" fill={SKIN_D} stroke={INK} strokeWidth={2.4 * px} />
      <path d="M-42,140 C-20,166 20,166 42,140" fill="none" stroke="#7FA2B6" strokeWidth={5} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M${s * 66},2 C${s * 82},-6 ${s * 84},26 ${s * 74},40 C${s * 70},46 ${s * 66},42 ${s * 64},34`} fill={SKIN} stroke={INK} strokeWidth={2.4 * px} />
          <path d={`M${s * 70},8 C${s * 78},6 ${s * 78},24 ${s * 71},32`} fill="none" stroke={SKIN_D} strokeWidth={1.6} />
        </g>
      ))}
      <path d="M0,-118 C40,-118 68,-92 70,-48 C72,-20 72,10 68,36 C64,70 46,104 22,118 C10,124 -10,124 -22,118 C-46,104 -64,70 -68,36 C-72,10 -72,-20 -70,-48 C-68,-92 -40,-118 0,-118 Z" fill={`url(#${id}sk)`} stroke={INK} strokeWidth={2.8 * px} />
      <path d="M0,-118 C40,-118 68,-92 70,-48 C72,-20 72,10 68,36 C64,70 46,104 22,118 C10,124 -10,124 -22,118 C-46,104 -64,70 -68,36 C-72,10 -72,-20 -70,-48 C-68,-92 -40,-118 0,-118 Z" fill={`url(#${id}fsh)`} />
      <g clipPath={`url(#${id}hd)`}>
        {/* short dark beard and moustache (the same as the profile) */}
        <path d="M-72,4 C-66,28 -52,44 -34,52 C-27,55 -23,57 -21,60 L21,60 C23,57 27,55 34,52 C52,44 66,28 72,4 L72,140 L-72,140 Z" fill={BEARD} opacity={0.84} />
        {Array.from({length: 160}, (_, i) => {
          const x = -62 + 124 * hash(i * 3.1), y = 50 + 66 * hash(i * 7.7);
          if (y < 52 + Math.max(0, 30 - Math.abs(x)) * 0.25 || y > 118 - Math.abs(x) * 0.5) return null;
          return <path key={i} d={`M${x},${y} l${0.5 - hash(i) * 1},1.4`} stroke="#4A3C34" strokeWidth={0.55} opacity={0.6} />;
        })}
        {/* moustache */}
        <path d="M-20,61 C-14,55 -6,54.5 0,56.6 C6,54.5 14,55 20,61 C14,59.4 6,59.6 0,60.6 C-6,59.6 -14,59.4 -20,61 Z" fill={BEARD} />
      </g>
      {/* hair: short, dark */}
      <path d="M-70,-44 C-74,-86 -48,-120 0,-121 C48,-120 74,-86 70,-44 C66,-62 62,-70 54,-76 C34,-84 18,-80 0,-82 C-18,-80 -34,-84 -54,-76 C-62,-70 -66,-62 -70,-44 Z" fill={HAIR} stroke={INK} strokeWidth={2.4 * px} />
      {Array.from({length: 26}, (_, i) => {
        const x = -60 + 120 * (i / 25), y = -84 - 26 * Math.sin((i / 25) * Math.PI);
        return <path key={i} d={`M${x},${y + 8} q${2 - 4 * hash(i)},-6 ${3 - 6 * hash(i + 9)},-11`} stroke="#4A403B" strokeWidth={0.8} fill="none" opacity={0.7} />;
      })}
      {[0, 1].map((i) => <path key={i} d={`M-26,${-52 - i * 8 + brY * 0.5} C-8,${-55 - i * 8 + brY * 0.6} 8,${-55 - i * 8 + brY * 0.6} 26,${-52 - i * 8 + brY * 0.5}`} stroke={SKIN_D} strokeWidth={0.9 + f.brow * 0.6} fill="none" opacity={0.6} />)}
      {[-1, 1].map((s) => (
        <path key={s} d={`M${s * 14},${-15 + brY * 0.8} C${s * 22},${-22.5 + brY * 1.15} ${s * 40},${-23.5 + brY} ${s * 52},${-15 + brY * 0.6} C${s * 40},${-18.6 + brY} ${s * 24},${-17.6 + brY * 1.1} ${s * 14},${-11.4 + brY * 0.8} Z`} fill={HAIR} stroke={INK} strokeWidth={1.4 * px} />
      ))}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M${s * 19},-7.4 C${s * 25},-13.6 ${s * 40},-14 ${s * 49},-4.4`} stroke={SKIN_D} strokeWidth={1.3} fill="none" />
          <path d={`M${s * 21},11 C${s * 28},13.6 ${s * 40},13.6 ${s * 47},8.2`} stroke={SKIN_D} strokeWidth={0.9} fill="none" opacity={0.8} />
        </g>
      ))}
      {eye('L')}
      {eye('R')}
      {/* nose */}
      <path d="M-5,-6 C-6,10 -8,26 -12,38 C-14,44 -10,47 -6,45 C-3,48 3,48 6,45 C10,47 14,44 12,38 C8,26 6,10 5,-6" fill="none" stroke={SKIN_D} strokeWidth={1.6} />
      <path d="M-12,38 C-15,44 -10,48 -5.5,45.5 M12,38 C15,44 10,48 5.5,45.5" fill="none" stroke={INK} strokeWidth={2 * px} strokeLinecap="round" />
      <ellipse cx={-5.6} cy={45.3} rx={2.4} ry={1.2} fill="#7A4434" />
      <ellipse cx={5.6} cy={45.3} rx={2.4} ry={1.2} fill="#7A4434" />
      <ellipse cx={0} cy={38} rx={5} ry={4} fill={SKIN_L} opacity={0.6} />
      {/* mouth: closed, or held open by retractors for the tooth */}
      {mouthOn ? <Mouth id={`${id}m`} px={px} m={f.mouth!} /> : (() => {
        // closed and neutral; or smiling (the corners lift and widen), and open (the upper teeth show)
        const cx = 19 + sm * 3.5, cy = 72 - sm * 4.6, mid = 72 + sm * 1.4, bot = mid + op * 6.5;
        const opening = `M${-cx},${cy} C${-9},${mid} ${9},${mid} ${cx},${cy} C${9},${bot} ${-9},${bot} ${-cx},${cy} Z`;
        return (
          <g>
            {sm > 0.02 && [-1, 1].map((k) => <path key={k} d={`M${k * 12},${50 - sm} C${k * 19},${57} ${k * (21 + sm * 2)},${64 - sm * 2} ${k * (cx + 1.5)},${cy + 2.5}`} stroke={SKIN_D} strokeWidth={1.4} fill="none" opacity={0.75 * sm} strokeLinecap="round" />)}
            {sm > 0.02 && [-1, 1].map((k) => <ellipse key={`c${k}`} cx={k * 31} cy={30 - sm * 2} rx={9} ry={5} fill={SKIN_L} opacity={0.35 * sm} style={{filter: 'blur(1.5px)'}} />)}
            {op > 0.03 && (
              <g>
                <defs><clipPath id={`${id}mo2`}><path d={opening} /></clipPath></defs>
                <path d={opening} fill="#4A1E1C" />
                <g clipPath={`url(#${id}mo2)`}>
                  <path d={`M${-cx},${cy - 4} L${cx},${cy - 4} L${cx},${cy + 0.4} C${9},${mid + 2.3} ${-9},${mid + 2.3} ${-cx},${cy + 0.4} Z`} fill="#F4F0E8" />
                  {[-9, -3, 3, 9].map((x) => <line key={x} x1={x} x2={x} y1={mid - 2} y2={mid + 2.4} stroke="rgba(120,100,90,0.5)" strokeWidth={0.3} />)}
                </g>
              </g>
            )}
            <path d={`M${-cx},${cy} C${-9.5},${69.6 - sm * 1.2} ${9.5},${69.6 - sm * 1.2} ${cx},${cy} C${9},${mid} ${-9},${mid} ${-cx},${cy} Z`} fill="#A85F52" stroke={INK} strokeWidth={2 * px} strokeLinejoin="round" />
            <path d={`M${-cx + 3},${bot - (bot - cy) * 0.35 + 2} C${-7},${bot + 4} ${7},${bot + 4} ${cx - 3},${bot - (bot - cy) * 0.35 + 2}`} stroke="#A85F52" strokeWidth={2.4} fill="none" strokeLinecap="round" />
            <path d={`M${-cx},${cy} C${-9},${mid} ${9},${mid} ${cx},${cy}`} stroke={INK} strokeWidth={1.8 * px} fill="none" strokeLinecap="round" />
          </g>
        );
      })()}
      {/* a tear from his left eye */}
      {(f.tear ?? 0) > 0 && <path d={`M${ER[0] + 7},${ER[1] + 7.6} C${ER[0] + 7.4},${10 + f.tear! * 6} ${ER[0] + 7.1},${12 + f.tear! * 9} ${ER[0] + 7.6},${13 + f.tear! * 11}`} stroke="#E6F4FA" strokeWidth={1.5} fill="none" opacity={0.85 * f.tear!} strokeLinecap="round" />}
      {/* bruise round the pocket while it heals */}
      {f.bruise > 0 && <ellipse cx={POCKET2[0] - 2} cy={POCKET2[1] - 2} rx={16} ry={10} fill="#8C5A84" opacity={0.26 * f.bruise} style={{filter: 'blur(2.5px)'}} />}
      <PocketCut id={`${id}pk`} px={px} p={f.pocket} />
      {f.light !== 1 && <rect x={-200} y={-200} width={400} height={500} fill={f.light < 1 ? '#0E1A2E' : '#FFE9C4'} opacity={Math.abs(1 - f.light) * (f.light < 1 ? 0.55 : 0.35)} />}
    </g>
  );
};
