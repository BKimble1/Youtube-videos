import React from 'react';
import {C, H, OUTLINE, W} from '../theme';
import {HERO_LOOK} from '../opening/rig';

/**
 * Side / three-quarter view of the SAME cast member (clerkB: high bun, round-cornered glasses, earring, blue cardigan over a white shirt,
 * navy trousers, dark shoes; work nametag dropped). Identity is carried by the approved Look (colours) and by the front rig's own
 * segment lengths: thigh+shin 158, upper arm 84, forearm 78, head 58x62, outline 4. Only the VIEW changes (foreshortened torso,
 * face turned toward travel with the nose on the silhouette, ear and glasses temple visible). She faces +x (east, right).
 *
 * Angles are degrees from straight DOWN, positive = FORWARD (toward +x). y is down; the hip joint is the pivot.
 */
export type Arm2 = {s: number; e: number}; // shoulder angle, elbow flex (+ folds the forearm forward/up)
export type Leg2 = {h: number; k: number; f?: number}; // thigh angle, knee flex (shin swings back), sole angle (+ toes up)
export type SidePose = {
  lean: number; // spine lean from vertical, + = forward
  head: number; // absolute head rotation, deg clockwise (+ = chin down/forward)
  armN: Arm2; // near arm (drawn in front)
  armF: Arm2; // far arm (behind the torso)
  legN: Leg2;
  legF: Leg2;
  mouth?: 'o' | 'smile' | 'flat' | 'grin';
  brows?: number; // -1..1
  lookX?: number;
  lookY?: number;
};
export const THIGH = 79, SHIN = 79, UPPER = 84, FORE = 78;
export const TORSO_H = 127, NECK_H = 152, HEAD_OFF = 55;
export const STAND_HIP = 164; // hip joint height above the ground, standing straight (leg 158 + 6 ankle)
const rad = (d: number) => (d * Math.PI) / 180;
const down = (a: number) => ({x: Math.sin(rad(a)), y: Math.cos(rad(a))});
type V = {x: number; y: number};
const add = (a: V, b: V, k = 1): V => ({x: a.x + b.x * k, y: a.y + b.y * k});

export type FK = {
  P: V; Sn: V; Sf: V; En: V; Wn: V; Ef: V; Wf: V; N: V; Hc: V; Kn: V; An: V; Kf: V; Af: V; shoeN: V; shoeF: V; footN: number; footF: number;
  lowest: number; // lowest y of either shoe (px, same space as hip)
};
export const sideFK = (p: SidePose, hip: V, sc: number): FK => {
  const l = rad(p.lean);
  const spine = {x: Math.sin(l), y: -Math.cos(l)};
  const fwd = {x: Math.cos(l), y: Math.sin(l)};
  const base = add(hip, spine, TORSO_H * sc);
  const Sn = add(base, fwd, 4 * sc);
  const Sf = add(base, fwd, -10 * sc);
  const En = add(Sn, down(p.armN.s), UPPER * sc);
  const Wn = add(En, down(p.armN.s + p.armN.e), FORE * sc);
  const Ef = add(Sf, down(p.armF.s), UPPER * sc);
  const Wf = add(Ef, down(p.armF.s + p.armF.e), FORE * sc);
  const N = add(hip, spine, NECK_H * sc);
  const hr = rad(p.head);
  const Hc = add(N, {x: Math.sin(hr), y: -Math.cos(hr)}, HEAD_OFF * sc);
  const Kn = add(hip, down(p.legN.h), THIGH * sc);
  const An = add(Kn, down(p.legN.h - p.legN.k), SHIN * sc);
  const Kf = add(hip, down(p.legF.h), THIGH * sc);
  const Af = add(Kf, down(p.legF.h - p.legF.k), SHIN * sc);
  const fN = p.legN.f ?? 0, fF = p.legF.f ?? 0;
  const shoeN = add(An, {x: Math.cos(rad(fN)), y: -Math.sin(rad(fN))}, 13 * sc);
  const shoeF = add(Af, {x: Math.cos(rad(fF)), y: -Math.sin(rad(fF))}, 13 * sc);
  const lowest = Math.max(shoeN.y + 13 * sc, shoeF.y + 13 * sc);
  return {P: hip, Sn, Sf, En, Wn, Ef, Wf, N, Hc, Kn, An, Kf, Af, shoeN, shoeF, footN: fN, footF: fF, lowest};
};
/** hip position that puts the lowest shoe on `groundY` */
export const hipOnGround = (p: SidePose, hipX: number, groundY: number, sc: number): V => {
  const fk = sideFK(p, {x: hipX, y: 0}, sc);
  return {x: hipX, y: groundY - fk.lowest};
};

const OL = OUTLINE;
const seg = (a: V, b: V, w: number, color: string, ol = true) => (
  <>
    {ol && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.ink} strokeWidth={w + OL * 2} strokeLinecap="round" />}
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={w} strokeLinecap="round" />
  </>
);

const TORSO = 'M -46 8 Q -52 -20 -50 -58 Q -56 -100 -46 -124 Q -38 -146 -10 -150 L 24 -150 Q 52 -146 56 -122 Q 60 -80 54 -38 Q 52 -8 44 8 Q 0 20 -46 8 Z';

const Mitt: React.FC<{at: V; ang: number; sc: number}> = ({at, ang, sc}) => (
  <g transform={`translate(${at.x} ${at.y}) rotate(${-ang}) scale(${sc})`}>
    <ellipse cx={0} cy={6} rx={20} ry={18} fill={HERO_LOOK.skin} stroke={C.ink} strokeWidth={OL} />
    <ellipse cx={-6} cy={-6} rx={8} ry={11} fill={HERO_LOOK.skin} stroke={C.ink} strokeWidth={OL} transform="rotate(-24)" />
    <ellipse cx={-6} cy={-6} rx={6} ry={9} fill={HERO_LOOK.skin} transform="rotate(-24)" />
  </g>
);

/** Full-canvas SVG layer. `behind` draws the far limbs + torso + head; `front` draws the near leg and near arm (so a prop can sit between if ever needed). */
export const CharacterSide: React.FC<{
  pose: SidePose;
  hip: V;
  sc: number;
  holdN?: React.ReactNode; // prop in the near hand, drawn in screen space (origin at the hand)
  scarf?: React.ReactNode; // behind-body scarf tail, in screen space
  scarfWrap?: boolean; // coral wrap round the neck (the E-A scarf prop)
  opacity?: number;
}> = ({pose, hip, sc, holdN, scarf, scarfWrap = false, opacity = 1}) => {
  const fk = sideFK(pose, hip, sc);
  const L = HERO_LOOK;
  const lookX = pose.lookX ?? 1;
  const lookY = pose.lookY ?? 0.1;
  const brows = pose.brows ?? 0.9;
  const armAngN = pose.armN.s + pose.armN.e;
  const armAngF = pose.armF.s + pose.armF.e;
  const legW = 38 * sc;
  const armW = 30 * sc;
  const leg = (K: V, A: V, shoe: V, foot: number, key: string) => (
    <g key={key}>
      <polyline points={`${fk.P.x},${fk.P.y} ${K.x},${K.y} ${A.x},${A.y}`} fill="none" stroke={C.ink} strokeWidth={legW + OL * 2 * sc} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`${fk.P.x},${fk.P.y} ${K.x},${K.y} ${A.x},${A.y}`} fill="none" stroke={L.pants} strokeWidth={legW} strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(${shoe.x} ${shoe.y}) rotate(${-foot}) scale(${sc})`}>
        <ellipse cx={0} cy={0} rx={34} ry={14} fill={L.shoes} stroke={C.ink} strokeWidth={OL} />
      </g>
    </g>
  );
  const arm = (S: V, E: V, Wh: V, ang: number, key: string) => (
    <g key={key}>
      <polyline points={`${S.x},${S.y} ${E.x},${E.y} ${Wh.x},${Wh.y}`} fill="none" stroke={C.ink} strokeWidth={armW + OL * 2 * sc} strokeLinecap="round" strokeLinejoin="round" />
      <line x1={S.x} y1={S.y} x2={E.x} y2={E.y} stroke={L.overlayColor ?? C.blue} strokeWidth={armW} strokeLinecap="round" />
      <line x1={E.x} y1={E.y} x2={Wh.x} y2={Wh.y} stroke={L.skin} strokeWidth={armW} strokeLinecap="round" />
      <Mitt at={Wh} ang={ang} sc={sc} />
    </g>
  );
  const eyeY = -6;
  const eye = (cx: number, rx: number, k: string) => (
    <g key={k} transform={`translate(${cx} ${eyeY})`}>
      <ellipse cx={0} cy={0} rx={rx} ry={13} fill={C.white} stroke={C.ink} strokeWidth={3} />
      <circle cx={lookX * 4.5} cy={lookY * 4} r={5.5} fill={C.ink} />
      <circle cx={lookX * 4.5 + 2} cy={lookY * 4 - 2} r={1.6} fill={C.white} />
      <line x1={-rx} y1={-21 - brows * 5} x2={rx} y2={-21 - brows * 5 - brows * 4} stroke={C.ink} strokeWidth={OL + 1} strokeLinecap="round" />
    </g>
  );
  const mouth = pose.mouth ?? 'o';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity}}>
      {scarf}
      {/* far limbs */}
      {leg(fk.Kf, fk.Af, fk.shoeF, fk.footF, 'legF')}
      {arm(fk.Sf, fk.Ef, fk.Wf, armAngF, 'armF')}
      {/* torso: white shirt panel in front, blue cardigan behind it */}
      <g transform={`translate(${fk.P.x} ${fk.P.y}) rotate(${pose.lean}) scale(${sc})`}>
        <defs>
          <clipPath id="torsoClipSide"><path d={TORSO} /></clipPath>
        </defs>
        <path d={TORSO} fill={L.shirt} />
        <g clipPath="url(#torsoClipSide)">
          <path d="M -80 -170 L 14 -170 Q 20 -110 16 -50 Q 14 -10 20 30 L -80 30 Z" fill={L.overlayColor ?? C.blue} />
          <path d="M 14 -150 L 40 -150 L 30 -124 Z" fill={L.shirt} />
        </g>
        <path d="M 14 -150 Q 20 -110 16 -50 Q 14 -10 20 12" fill="none" stroke={C.ink} strokeWidth={OL} strokeLinecap="round" />
        <path d={TORSO} fill="none" stroke={C.ink} strokeWidth={OL} strokeLinejoin="round" />
      </g>
      {/* neck */}
      <g transform={`translate(${fk.N.x} ${fk.N.y}) rotate(${(pose.lean + pose.head) / 2}) scale(${sc})`}>
        <rect x={-15} y={-22} width={32} height={40} rx={6} fill={L.skin} stroke={C.ink} strokeWidth={OL} />
        {scarfWrap && (
          <g>
            <ellipse cx={0} cy={6} rx={30} ry={15} fill={C.coral} stroke={C.ink} strokeWidth={OL} />
            <path d="M -20 10 Q 0 22 20 10" fill="none" stroke={C.coralDeep} strokeWidth={5} strokeLinecap="round" />
          </g>
        )}
      </g>
      {/* head, three-quarter: face turned toward +x, nose on the silhouette */}
      <g transform={`translate(${fk.Hc.x} ${fk.Hc.y}) rotate(${pose.head}) scale(${sc})`}>
        <ellipse cx={0} cy={0} rx={58} ry={62} fill={L.skin} stroke={C.ink} strokeWidth={OL} />
        <path d="M 52 -2 Q 74 10 56 22 Q 52 14 50 4 Z" fill={L.skin} stroke={C.ink} strokeWidth={OL} strokeLinejoin="round" />
        <ellipse cx={-14} cy={6} rx={9} ry={12} fill={L.skin} stroke={C.ink} strokeWidth={OL} />
        <circle cx={-14} cy={20} r={5} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
        {/* hair: cap over the crown and back of the head, bun at the back */}
        <circle cx={-34} cy={-72} r={21} fill={L.hairColor} stroke={C.ink} strokeWidth={OL} />
        <path d="M 48 -30 Q 44 -74 -4 -78 Q -62 -72 -66 -10 Q -66 26 -44 36 Q -32 20 -38 -4 Q -18 -28 14 -34 Q 36 -36 48 -30 Z" fill={L.hairColor} stroke={C.ink} strokeWidth={OL} strokeLinejoin="round" />
        {eye(8, 12, 'e1')}
        {eye(40, 9.5, 'e2')}
        {/* glasses: near lens full, far lens foreshortened, temple arm back to the ear */}
        <g fill="none" stroke={C.ink} strokeWidth={3.5}>
          <rect x={-5} y={eyeY - 15} width={30} height={26} rx={7} />
          <rect x={30} y={eyeY - 15} width={22} height={26} rx={7} />
          <line x1={25} y1={eyeY - 4} x2={30} y2={eyeY - 4} />
          <line x1={-5} y1={eyeY - 6} x2={-16} y2={eyeY - 2} />
        </g>
        {mouth === 'o' && <ellipse cx={38} cy={34} rx={7} ry={9} fill={C.ink} />}
        {mouth === 'smile' && <path d="M 26 32 Q 40 44 52 30" fill="none" stroke={C.ink} strokeWidth={OL} strokeLinecap="round" />}
        {mouth === 'flat' && <path d="M 28 34 L 52 34" fill="none" stroke={C.ink} strokeWidth={OL} strokeLinecap="round" />}
        {mouth === 'grin' && <path d="M 26 30 Q 40 50 54 30 Z" fill={C.ink} />}
      </g>
      {/* near leg and near arm in front */}
      {leg(fk.Kn, fk.An, fk.shoeN, fk.footN, 'legN')}
      {arm(fk.Sn, fk.En, fk.Wn, armAngN, 'armN')}
      {holdN && <g transform={`translate(${fk.Wn.x} ${fk.Wn.y})`}>{holdN}</g>}
    </svg>
  );
};
