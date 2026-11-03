// The illustration (S2-S3): a clean side-view of Wyatt's right leg before the operation, on a plain clinical plate,
// with the rest of him as a pale ghost so the thigh's end is always attached to a body. It continues the stride
// from the pitch across the match cut, then: an x-ray window opens on the knee and the diseased bone glows; two cut
// lines; the middle (the knee) lifts away, bloodless; the foot is marked healthy; the lower leg turns half a turn
// about its own long axis (leg3d.tsx) with the thigh held still; it rises to meet the thigh; heel forward, toes back,
// the ankle level with the other knee; then the prosthesis is fitted round the turned foot.
import React from 'react';
import {Cam, Layer, camScale, W, H} from '../camera';
import {Deco, INK, Inked} from '../dc/ink';
import {Limb} from '../dc/limb';
import {Glow, SoftShadow} from '../dc/shade';
import {lit, shade} from '../dc/color';
import {add, fmt, mul, V} from '../dc/math';
import {Wyatt, WPose, dirA, joints, Prosthesis} from './wyatt';
import {LowerLeg3D, TurnRing, Leg3D} from './leg3d';
import {C} from './pal';

export type IllusState = {
  ghost: WPose; // the pale rest of Wyatt (near leg hidden)
  H: V; hip: number; knee: number; // the real leg
  win: number; tumor: number; mark: number; cuts: number; split: boolean; midOut: number;
  save: number; toeCurl: number; yaw: number; ring: number; rise: number; seam: number; align: number; point: number; fit: number;
  fitPose: WPose;
};

const FEMUR_CUT = 26, TIBIA_KEEP = 9;

const Plate: React.FC<{id: string}> = ({id}) => (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
    <defs>
      <radialGradient id={`${id}-pl`} cx="0.45" cy="0.42" r="0.85">
        <stop offset="0" stopColor={lit(C.plate, 0.35)} />
        <stop offset="0.7" stopColor={C.plate} />
        <stop offset="1" stopColor={C.plateDeep} />
      </radialGradient>
      <pattern id={`${id}-gr`} width={54} height={54} patternUnits="userSpaceOnUse">
        <circle cx={27} cy={27} r={1.6} fill={C.plateDeep} opacity={0.55} />
      </pattern>
    </defs>
    <rect x={0} y={0} width={W} height={H} fill={`url(#${id}-pl)`} />
    <rect x={0} y={0} width={W} height={H} fill={`url(#${id}-gr)`} />
  </svg>
);

/** the knee in x-ray: femur with the tumour at its lower end, kneecap, the top of the shin bones */
const XRay: React.FC<{id: string; K: V; sa: number; hip: number; r: number; tumor: number; iw: number}> = ({id, K, sa, hip, r, tumor, iw}) => {
  if (r < 0.2) return null;
  const up = dirA(hip + 180), dn = dirA(sa);
  const fwdT = dirA(hip + 90), fwdS = dirA(sa + 90);
  const pT = (f: number, u: number) => add(K, add(mul(up, u), mul(fwdT, f)));
  const pS = (f: number, d: number) => add(K, add(mul(dn, d), mul(fwdS, f)));
  const P = (q: V) => `${fmt(q.x)},${fmt(q.y)}`;
  const femur = `M${P(pT(2.0, 16))} L${P(pT(2.1, 6))} Q${P(pT(4.4, 2.4))} ${P(pT(3.6, 0.2))} Q${P(pT(0.5, -1.4))} ${P(pT(-1.5, 0.1))} Q${P(pT(-4.4, 0.6))} ${P(pT(-3.9, 3.4))} Q${P(pT(-2.2, 5.4))} ${P(pT(-2.2, 7))} L${P(pT(-2.2, 16))} Z`;
  const tibia = `M${P(pS(-4.1, 1.2))} Q${P(pS(0, 0.4))} ${P(pS(3.4, 1.0))} Q${P(pS(3.4, 3.4))} ${P(pS(1.7, 5.2))} L${P(pS(1.4, 16))} L${P(pS(-1.9, 16))} L${P(pS(-2.1, 5))} Q${P(pS(-4.4, 3.6))} ${P(pS(-4.1, 1.2))} Z`;
  const fib = `M${P(pS(3.2, 3.6))} Q${P(pS(4.4, 4.2))} ${P(pS(4.0, 5.4))} L${P(pS(3.6, 16))} L${P(pS(2.8, 16))} L${P(pS(2.6, 5.4))} Z`;
  const pat = pT(-5.0, 1.8);
  const tc = pT(0.1, 4.6);
  const pulse = tumor * (0.82 + 0.18 * Math.sin(tumor * 9));
  return (
    <g>
      <defs>
        <clipPath id={`${id}-xc`}><circle cx={fmt(K.x)} cy={fmt(K.y)} r={fmt(r)} /></clipPath>
        <radialGradient id={`${id}-xg`}>
          <stop offset="0" stopColor="#E9F1F6" />
          <stop offset="1" stopColor="#C9D8E3" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id}-xc)`}>
        <circle cx={fmt(K.x)} cy={fmt(K.y)} r={fmt(r)} fill={`url(#${id}-xg)`} opacity={0.94} />
        {[fib, tibia, femur].map((d, i) => (
          <path key={i} d={d} fill={i === 0 ? shade(C.bone, 0.06) : C.bone} stroke={shade(C.boneDeep, 0.3)} strokeWidth={iw * 0.55} />
        ))}
        <ellipse cx={fmt(pat.x)} cy={fmt(pat.y)} rx={1.5} ry={2.3} fill={C.bone} stroke={shade(C.boneDeep, 0.3)} strokeWidth={iw * 0.55} transform={`rotate(${fmt(-hip)} ${fmt(pat.x)} ${fmt(pat.y)})`} />
        {tumor > 0.01 && (
          <g>
            <ellipse cx={fmt(tc.x)} cy={fmt(tc.y)} rx={fmt(5.6 + 1.2 * pulse)} ry={fmt(6.4 + 1.2 * pulse)} fill={C.tumorGlow} opacity={0.35 * tumor} />
            <path d={`M${P(pT(-2.6, 7.6))} Q${P(pT(0.4, 9.4))} ${P(pT(2.6, 7.2))} Q${P(pT(3.8, 4.2))} ${P(pT(2.4, 1.6))} Q${P(pT(0.2, 0.6))} ${P(pT(-2.4, 1.8))} Q${P(pT(-3.6, 4.6))} ${P(pT(-2.6, 7.6))} Z`} fill={C.tumor} opacity={0.85 * tumor} stroke={shade(C.tumor, 0.35)} strokeWidth={iw * 0.4} />
          </g>
        )}
      </g>
      <circle cx={fmt(K.x)} cy={fmt(K.y)} r={fmt(r)} fill="none" stroke="#FFFFFF" strokeWidth={iw * 1.6} />
      <circle cx={fmt(K.x)} cy={fmt(K.y)} r={fmt(r + iw * 0.8)} fill="none" stroke={INK} strokeWidth={iw * 0.5} />
    </g>
  );
};

const cutLine = (p: V, axisAng: number, half: number, u: number, iw: number, key: string) => {
  if (u <= 0.01) return null;
  const n = dirA(axisAng + 90);
  const a = add(p, mul(n, half * 1.35)), b = add(p, mul(n, -half * 1.35 + 2 * half * 1.35 * (1 - u)));
  return (
    <g key={key}>
      <line x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} stroke={INK} strokeWidth={iw * 1.7} strokeLinecap="round" strokeDasharray={`${fmt(iw * 2.2)} ${fmt(iw * 1.8)}`} opacity={0.55} />
      <line x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} stroke="#FFFFFF" strokeWidth={iw * 1.0} strokeLinecap="round" strokeDasharray={`${fmt(iw * 2.2)} ${fmt(iw * 1.8)}`} />
    </g>
  );
};

export const IllusShot: React.FC<{c: Cam; s: IllusState; k: string}> = ({c, s, k}) => {
  const px = 1 / camScale(c);
  const iw = 7 * px;
  const K = add(s.H, mul(dirA(s.hip), 35));
  const sa = s.hip - s.knee;
  const A0 = add(K, mul(dirA(sa), 31));
  const cut1 = add(s.H, mul(dirA(s.hip), FEMUR_CUT));
  const cut2 = add(A0, mul(dirA(sa + 180), TIBIA_KEEP));
  const midOff = {x: -18 * s.midOut, y: -5 * s.midOut};
  const A = {x: A0.x, y: A0.y - 31 * s.rise};
  const g: Leg3D = {A, sa, yaw: s.yaw, point: s.point, top: s.split ? -TIBIA_KEEP : -31, toeCurl: s.toeCurl};
  const thighM = add(s.H, mul(dirA(s.hip), 20));
  const gj = joints(s.ghost);
  const kneeF = gj.K; // the other knee (ghost)
  const P = (q: V) => `${fmt(q.x)},${fmt(q.y)}`;
  return (
    <>
      <Plate id={`${k}pl`} />
      <Layer c={c}>
        {/* floor shadow and the ghost of the rest of him */}
        <SoftShadow id={`${k}fl`} c={{x: s.H.x - 4, y: 0.5}} rx={26} ry={2.6} alpha={0.22} color="#5C7C8E" />
        <g opacity={0.3} style={{filter: 'saturate(0.15) brightness(1.12)'}}>
          <Wyatt p={s.ghost} o={{id: `${k}gh`, px, cut: 0, prosthesis: false, hideHead: true, hideNearLeg: true, farDim: 0}} />
        </g>
        {/* the far knee: the height the new joint will match */}
        {s.align > 0.01 && (
          <g opacity={s.align}>
            <line x1={fmt(A.x)} y1={fmt(A.y)} x2={fmt(kneeF.x + 6)} y2={fmt(kneeF.y)} stroke={C.healthy} strokeWidth={iw * 0.9} strokeDasharray={`${fmt(iw * 2)} ${fmt(iw * 1.6)}`} strokeLinecap="round" />
            <circle cx={fmt(kneeF.x)} cy={fmt(kneeF.y)} r={fmt(iw * 2.4)} fill="none" stroke={C.healthy} strokeWidth={iw * 0.9} />
          </g>
        )}
        {s.save > 0.01 && <Glow id={`${k}sv`} c={add(A, {x: s.yaw > 90 ? 4 : -4, y: 1})} r={17} ry={12} color={C.healthy} alpha={0.55 * s.save} blend="normal" />}
        <TurnRing g={g} y={-4.5} r={6.8} a={s.ring} dir={-1} half="back" iw={iw} />
        {!s.split ? (
          // the whole leg before the cuts: one contour
          <Inked w={iw}>
            <Limb id={`${k}th`} A={s.H} B={thighM} C={K} rA={8.1} rB={6.2} rC={4.7} color={C.skin} k={0.9} />
            <LowerLeg3D id={`${k}ll`} g={g} iw={iw} cutFace={false} />
          </Inked>
        ) : (
          <g>
            <Inked w={iw}>
              <Limb id={`${k}th`} A={s.H} B={add(s.H, mul(dirA(s.hip), 13))} C={cut1} rA={8.1} rB={6.9} rC={5.6} color={C.skin} k={0.9} capC="flat" />
            </Inked>
            <Deco>
              <path d={`M${P(add(cut1, mul(dirA(s.hip + 90), 5.6)))} L${P(add(cut1, mul(dirA(s.hip + 90), -5.6)))}`} stroke={C.tissue} strokeWidth={iw * 1.4} />
            </Deco>
            <LowerLeg3D id={`${k}ll`} g={g} iw={iw} cutFace={s.rise < 0.97} />
          </g>
        )}
        <g opacity={0.55}>
          <Wyatt p={s.ghost} o={{id: `${k}gs`, px, cut: 0, nearShortsOnly: true}} />
        </g>
        {s.seam > 0.01 && (
          <g opacity={s.seam}>
            <path d={`M${P(add(cut1, mul(dirA(s.hip + 90), 5.7)))} Q${P(add(cut1, {x: 0, y: 1.2}))} ${P(add(cut1, mul(dirA(s.hip + 90), -5.7)))}`} fill="none" stroke={shade(C.tissue, 0.15)} strokeWidth={iw * 0.9} />
            {[-3.6, -1.2, 1.2, 3.6].map((f) => {
              const q = add(cut1, mul(dirA(s.hip + 90), f));
              return <line key={f} x1={fmt(q.x)} y1={fmt(q.y - 1.0)} x2={fmt(q.x)} y2={fmt(q.y + 1.4)} stroke={shade(C.tissue, 0.35)} strokeWidth={iw * 0.55} strokeLinecap="round" />;
            })}
          </g>
        )}
        <TurnRing g={g} y={-4.5} r={6.8} a={s.ring} dir={-1} half="front" iw={iw} />
        {/* the diseased section, marked, then lifted away */}
        {s.split && s.midOut < 0.999 && (
          <g opacity={1 - s.midOut} transform={`translate(${fmt(midOff.x)} ${fmt(midOff.y)})`}>
            <Inked w={iw}>
              <Limb id={`${k}md`} A={cut1} B={K} C={cut2} rA={5.6} rB={4.8} rC={3.6} color={C.skin} k={0.9} capA="flat" capC="flat" />
            </Inked>
            <Deco>
              <path d={`M${P(add(cut1, mul(dirA(s.hip + 90), 5.6)))} L${P(add(cut1, mul(dirA(s.hip + 90), -5.6)))}`} stroke={C.tissue} strokeWidth={iw * 1.4} />
              <path d={`M${P(add(cut2, mul(dirA(sa + 90), 3.6)))} L${P(add(cut2, mul(dirA(sa + 90), -3.6)))}`} stroke={C.tissue} strokeWidth={iw * 1.4} />
            </Deco>
            <g opacity={0.3 * s.mark}>
              <Limb id={`${k}mk`} A={cut1} B={K} C={cut2} rA={5.6} rB={4.8} rC={3.6} color={C.tumorGlow} k={0.4} capA="flat" capC="flat" />
            </g>
            <XRay id={`${k}xr`} K={K} sa={sa} hip={s.hip} r={10.5 * s.win} tumor={s.tumor} iw={iw} />
          </g>
        )}
        {!s.split && (
          <g>
            {s.mark > 0.01 && (
              <g opacity={0.3 * s.mark}>
                <Limb id={`${k}mk`} A={cut1} B={K} C={cut2} rA={5.6} rB={4.8} rC={3.6} color={C.tumorGlow} k={0.4} capA="flat" capC="flat" />
              </g>
            )}
            <XRay id={`${k}xr`} K={K} sa={sa} hip={s.hip} r={10.5 * s.win} tumor={s.tumor} iw={iw} />
            {cutLine(cut1, s.hip, 5.6, s.cuts, iw, 'c1')}
            {cutLine(cut2, sa, 3.6, s.cuts, iw, 'c2')}
          </g>
        )}
        {/* the prosthesis fitted round the turned foot (its own drawing of the foot shows in the cutaway) */}
        {s.fit > 0.01 && (
          <g opacity={s.fit}>
            <Prosthesis id={`${k}pf`} j={joints(s.fitPose)} iw={iw} cut={1} />
          </g>
        )}
      </Layer>
    </>
  );
};
