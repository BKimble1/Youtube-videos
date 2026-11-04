// The middle of the film, on one clean illustration plate.
//   AnatShot   "Surgeons had to remove his knee, but they could save his foot." A side profile of his right leg with
//              the bones showing through the skin. Two cut lines; the diseased middle (lower thigh, knee, upper shin)
//              separates and leaves; the lens follows the kept lower shin, ankle and foot (enough shin to read as a
//              leg, no floor under it: it is never a loose foot on a table). Bloodless.
//   TurnShot   "They turned his lower leg halfway around": the same piece in 3D (leg3d.tsx), turning about the shin's
//              long axis: toes forward in profile -> the heel toward us -> toes back in the opposite profile. Steady lens.
//   AttachShot "...and attached it to his thigh, with his toes pointing behind him." The shin rises to the thigh and
//              seats; the lens widens to Wyatt in side profile (face, chest, his ordinary shoe forward; his own toes
//              pointing the other way), and the silhouette holds while he glances back at them.
import React from 'react';
import {Cam, Layer, W, H, camScale, glide, CKey, travel} from '../camera';
import {Deco, INK, Inked} from '../dc/ink';
import {Limb} from '../dc/limb';
import {Glow, SoftShadow} from '../dc/shade';
import {lit, shade} from '../dc/color';
import {fmt, V} from '../dc/math';
import {BioFoot} from '../art/wyatt';
import {LowerLeg3D, TurnRing, Leg3D} from '../art/leg3d';
import {C} from '../art/pal';
import {clamp, ss, ss5, lerp} from '../lib';
import {T, shotStart} from './story2';
import {ScanShot} from './scan';
import {Wyatt2, BPose, SKIN} from './body';
import {legTo, HAND_EASY, HAND_OPEN, ANK} from './poses';
import {EXPR_NEUTRAL} from '../dc/Head';

export const Plate: React.FC<{k: string; tone?: number}> = ({k, tone = 0}) => (
  <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
    <defs>
      <radialGradient id={`${k}pl`} cx="0.5" cy="0.45" r="0.8">
        <stop offset="0" stopColor={lit(C.plate, 0.4 - 0.25 * tone)} />
        <stop offset="0.7" stopColor={shade(C.plate, 0.05 * tone)} />
        <stop offset="1" stopColor={shade(C.plateDeep, 0.1 * tone)} />
      </radialGradient>
      <pattern id={`${k}gr`} width={60} height={60} patternUnits="userSpaceOnUse"><circle cx={30} cy={30} r={1.5} fill={C.plateDeep} opacity={0.5} /></pattern>
    </defs>
    <rect x={0} y={0} width={W} height={H} fill={`url(#${k}pl)`} />
    <rect x={0} y={0} width={W} height={H} fill={`url(#${k}gr)`} />
  </svg>
);

// ----------------------------------------------------------------------------------------------- the anatomy leg
const HIP: V = {x: 0, y: -74}, KNEE: V = {x: 0, y: -39.5}, ANKLE: V = {x: 0, y: -6.4};
export const CUT_F = HIP.y + 16, CUT_T = ANKLE.y - 19;
const P = (x: number, y: number) => `${fmt(x)},${fmt(y)}`;
/** skin, bones and foot of the leg before the operation (side profile, facing screen-left) */
export const AnatLeg: React.FC<{k: string; iw: number; diseased: number; toe: number; glow: number}> = ({k, iw, diseased, toe, glow}) => {
  const femur = `M${P(-1.4, -78)} L${P(-1.6, -50)} Q${P(-3.6, -45)} ${P(-3.4, -41.4)} Q${P(-1.2, -39.2)} ${P(1.6, -40.4)} Q${P(3.9, -41.2)} ${P(3.4, -44.6)} Q${P(1.6, -48)} ${P(1.4, -51)} L${P(1.3, -78)} Z`;
  const tibia = `M${P(-3.4, -38.2)} Q${P(0, -38.9)} ${P(3.2, -38.2)} Q${P(3.0, -35.5)} ${P(1.0, -33.5)} L${P(0.9, -9.5)} Q${P(1.2, -7.6)} ${P(0.2, -7.0)} Q${P(-2.4, -6.9)} ${P(-2.6, -8.8)} L${P(-1.6, -33.5)} Q${P(-3.5, -35.4)} ${P(-3.4, -38.2)} Z`;
  const fib = `M${P(2.6, -35.5)} Q${P(3.6, -35.6)} ${P(3.4, -34)} L${P(2.6, -8.4)} L${P(1.8, -8.4)} L${P(2.2, -34)} Z`;
  return (
    <g>
      <g opacity={0.62}>
        <Inked w={iw}>
          <Limb id={`${k}lg`} A={HIP} B={KNEE} C={ANKLE} rA={8.2} rB={4.9} rC={3.0} color={SKIN} k={0.8} />
          <BioFoot id={`${k}ft`} A={ANKLE} fa={90} h={1} iw={iw} toeCurl={toe} skin={SKIN} />
        </Inked>
      </g>
      {/* calf (behind the shin bone) as a soft bulge in the translucent skin */}
      <ellipse cx={2.4} cy={-26} rx={3.3} ry={9} fill={shade(SKIN, 0.12)} opacity={0.35} />
      {[fib, tibia, femur].map((d, i) => <path key={i} d={d} fill={i === 0 ? shade(C.bone, 0.08) : C.bone} stroke={shade(C.boneDeep, 0.3)} strokeWidth={iw * 0.55} />)}
      <ellipse cx={-4.7} cy={-41.2} rx={1.5} ry={2.4} fill={C.bone} stroke={shade(C.boneDeep, 0.3)} strokeWidth={iw * 0.5} />
      {/* the diseased bone at the lower end of the femur */}
      {diseased > 0.01 && (
        <g opacity={diseased}>
          <path d={`M${P(-2.4, -56)} Q${P(0.2, -58)} ${P(2.0, -55)} L${P(3.0, -45)} Q${P(0.5, -42.6)} ${P(-3.0, -44.2)} Z`} fill={C.tumor} opacity={0.7} />
          <ellipse cx={0} cy={-50} rx={5.5} ry={8.5} fill={C.tumorGlow} opacity={0.22} />
        </g>
      )}
      {void glow}
    </g>
  );
};
const cutLine = (y: number, half: number, u: number, iw: number, key: string) => u > 0.01 && (
  <g key={key}>
    <line x1={fmt(-half * 1.5)} y1={fmt(y)} x2={fmt(-half * 1.5 + 3 * half * u)} y2={fmt(y)} stroke={INK} strokeWidth={iw * 1.6} strokeDasharray={`${fmt(iw * 2.2)} ${fmt(iw * 1.6)}`} opacity={0.55} strokeLinecap="round" />
    <line x1={fmt(-half * 1.5)} y1={fmt(y)} x2={fmt(-half * 1.5 + 3 * half * u)} y2={fmt(y)} stroke="#FFFFFF" strokeWidth={iw * 0.9} strokeDasharray={`${fmt(iw * 2.2)} ${fmt(iw * 1.6)}`} strokeLinecap="round" />
  </g>
);
/** a clean cut face across the leg at height y (tissue band, the bone's end in cream) */
export const CutFace: React.FC<{y: number; half: number; bone: number; iw: number}> = ({y, half, bone, iw}) => (
  <g>
    <line x1={fmt(-half)} y1={fmt(y)} x2={fmt(half)} y2={fmt(y)} stroke={C.tissue} strokeWidth={iw * 2.2} strokeLinecap="round" />
    <line x1={fmt(-bone)} y1={fmt(y)} x2={fmt(bone)} y2={fmt(y)} stroke={C.bone} strokeWidth={iw * 2.4} strokeLinecap="round" />
  </g>
);

export const anatCam = (t: number): Cam => {
  const t0 = shotStart('anat');
  const keys: CKey[] = [
    [t0, {x: 0, y: -50, w: 34, eye: -40}],
    [t0 + 0.55, {x: 0, y: -42, w: 64, eye: -40}],
    [T.remove + 0.5, {x: -4, y: -40, w: 66, eye: -40}, travel],
    [T.save - 0.1, {x: 0, y: -16, w: 46, eye: -40}, travel],
    [T.they - 0.04, {x: 1, y: -14, w: 42, eye: -40}, travel],
  ];
  return glide(t, keys);
};
export const AnatShot: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = anatCam(t);
  const iw = 7 / camScale(c);
  const t0 = shotStart('anat');
  const cuts = ss(t, T.surgeons + 0.1, T.surgeons + 0.5);
  const split = t > T.remove - 0.05;
  const out = ss5(t, T.remove, T.knee2 + 0.3);
  const save = Math.sin(Math.PI * clamp((t - (T.save - 0.2)) / 1.3));
  const toe = 22 * Math.max(0, Math.sin(Math.PI * clamp((t - T.foot) / 0.5)));
  const diss = 1 - ss(t, t0, t0 + 0.32);
  const band = (y0: number, y1: number, id: string) => <clipPath id={id}><rect x={-60} y={y0} width={120} height={y1 - y0} /></clipPath>;
  return (
    <>
      <Plate k={`${k}a`} />
      <Layer c={c}>
        <defs>
          {band(-120, CUT_F, `${k}cu`)}{band(CUT_F, CUT_T, `${k}cm`)}{band(CUT_T, 30, `${k}cl`)}
        </defs>
        {save > 0.01 && <Glow id={`${k}sv`} c={{x: -2, y: -10}} r={20} ry={18} color={C.healthy} alpha={0.5 * save} blend="normal" />}
        {!split ? (
          <g>
            <AnatLeg k={`${k}l`} iw={iw} diseased={1} toe={0} glow={0} />
            <g opacity={0.3 * ss(t, T.surgeons + 0.35, T.remove)}>
              <rect x={-9} y={CUT_F} width={18} height={CUT_T - CUT_F} fill={C.tumorGlow} rx={3} />
            </g>
            {cutLine(CUT_F, 7.6, cuts, iw, 'c1')}
            {cutLine(CUT_T, 4.3, cuts, iw, 'c2')}
          </g>
        ) : (
          <g>
            <g clipPath={`url(#${k}cu)`}><AnatLeg k={`${k}u`} iw={iw} diseased={0} toe={0} glow={0} /></g>
            <CutFace y={CUT_F} half={6.9} bone={1.4} iw={iw} />
            <g opacity={1 - ss(t, T.knee2 - 0.1, T.knee2 + 0.35)} transform={`translate(${fmt(-26 * out)} ${fmt(-3 * out)}) rotate(${fmt(-8 * out)} 0 ${fmt((CUT_F + CUT_T) / 2)})`}>
              <g clipPath={`url(#${k}cm)`}><AnatLeg k={`${k}m`} iw={iw} diseased={1} toe={0} glow={0} /></g>
              <CutFace y={CUT_F} half={6.9} bone={1.4} iw={iw} />
              <CutFace y={CUT_T} half={4.1} bone={1.5} iw={iw} />
            </g>
            <g clipPath={`url(#${k}cl)`}><AnatLeg k={`${k}lw`} iw={iw} diseased={0} toe={toe} glow={save} /></g>
            <CutFace y={CUT_T} half={4.1} bone={1.5} iw={iw} />
          </g>
        )}
      </Layer>
      {diss > 0.01 && <div style={{position: 'absolute', inset: 0, opacity: diss}}><ScanShot t={t0} k={`${k}sc`} /></div>}
    </>
  );
};

// ---------------------------------------------------------------------------------------- the half-turn + attach
/** where the kept piece hangs before it rises (its ankle 30 cm below where it will join), and where it joins */
export const A_TURN: V = {x: 0, y: -8.7}, A_JOIN: V = {x: 0, y: -38.7};
const turnYaw = (t: number) => -180 * ss5(t, T.they + 0.18, T.around + 0.2);
const pieceOf = (t: number): Leg3D => {
  const rise = ss5(t, T.attached - 0.08, T.thigh + 0.02);
  return {A: {x: 0, y: lerp(A_TURN.y, A_JOIN.y, rise)}, sa: 0, yaw: turnYaw(t), point: 0, top: -19, toeCurl: 0};
};
export const TurnShot: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c: Cam = {x: 0.5, y: A_TURN.y - 7.5, w: 40, eye: -40};
  const iw = 7 / camScale(c);
  const g = pieceOf(t);
  const ring = ss(t, T.they + 0.05, T.they + 0.3) * (1 - ss(t, T.around + 0.1, T.around + 0.35));
  return (
    <>
      <Plate k={`${k}t`} tone={0.6} />
      <Layer c={c}>
        <SoftShadow id={`${k}ts`} c={{x: 0, y: A_TURN.y + 14}} rx={14} ry={2.4} alpha={0.18} color="#4D6878" />
        <TurnRing g={g} y={-12} r={7.6} a={ring} dir={-1} half="back" iw={iw} />
        <LowerLeg3D id={`${k}p`} g={g} iw={iw} skin={SKIN} />
        <TurnRing g={g} y={-12} r={7.6} a={ring} dir={-1} half="front" iw={iw} />
      </Layer>
    </>
  );
};

/** Wyatt standing on his left leg, the joined leg hanging with his own foot pointing back */
export const standPose = (t: number): BPose => {
  const look = ss(t, T.behind - 0.1, T.behind + 0.35) * (1 - ss(t, T.him + 0.2, T.that));
  const H = {x: 0, y: -73.7};
  const stag = {x: -5, y: -0.6};
  return {
    hip: H, pelvis: 2, chest: -1 + 4 * look, near: {hip: 0, knee: 0, ank: 0},
    far: legTo({x: H.x + stag.x, y: H.y + stag.y}, {x: -4, y: -ANK}, 90), stag,
    aN: {sh: 12, el: 22}, aF: {sh: -22, el: 30}, hN: HAND_EASY, hF: HAND_OPEN, wN: 0, wF: 10,
    neck: 4 + 14 * look, turn: lerp(1, 0.75, look), expr: {...EXPR_NEUTRAL, smile: 0.5, gx: lerp(-0.5, 0.75, look), gy: lerp(0, 0.9, look)}, blink: 0,
  };
};
export const attachCam = (t: number): Cam => {
  const g = pieceOf(t);
  const keys: CKey[] = [
    [shotStart('attach'), {x: 0.5, y: A_TURN.y - 7.5, w: 40, eye: -40}],
    [T.thigh + 0.05, {x: 0.5, y: g.A.y - 9, w: 42, eye: -40}],
    [T.with + 0.0, {x: 1, y: -73, w: 98, eye: -40}, travel],
    [T.that, {x: 2, y: -70, w: 90, eye: -40}, travel],
  ];
  const c = glide(t, keys);
  if (t < T.thigh + 0.05) c.y = lerp(A_TURN.y - 7.5, g.A.y - 9, ss5(t, T.attached - 0.12, T.thigh + 0.05));
  return c;
};
export const AttachShot: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = attachCam(t);
  const px = 1 / camScale(c);
  const iw = 7 * px;
  const g = pieceOf(t);
  const seam = ss(t, T.thigh - 0.05, T.thigh + 0.2);
  const toe = 26 * Math.max(0, Math.sin(Math.PI * clamp((t - T.pointing) / 0.55)));
  const p = standPose(t);
  const seamY = -73.7 + 16;
  const leg = (
    <g>
      <Inked w={iw}>
        <Limb id={`${k}st`} A={p.hip} B={{x: 0, y: -66}} C={{x: 0, y: seamY + 0.6}} rA={8.1} rB={7.0} rC={5.6} color={SKIN} k={0.9} capC="flat" />
      </Inked>
      <LowerLeg3D id={`${k}pc`} g={{...g, toeCurl: toe}} iw={iw} skin={SKIN} cutFace={seam < 0.5} />
      {seam > 0.01 && (
        <g opacity={seam}>
          <path d={`M${P(-5.7, seamY)} Q${P(0, seamY + 1)} ${P(5.7, seamY)}`} fill="none" stroke={shade(C.tissue, 0.2)} strokeWidth={iw * 0.8} />
          {[-3.6, -1.2, 1.2, 3.6].map((f) => <line key={f} x1={fmt(f)} y1={fmt(seamY - 0.9)} x2={fmt(f)} y2={fmt(seamY + 1.3)} stroke={shade(C.tissue, 0.4)} strokeWidth={iw * 0.5} strokeLinecap="round" />)}
        </g>
      )}
    </g>
  );
  return (
    <>
      <Plate k={`${k}t`} tone={0.6} />
      <Layer c={c}>
        <SoftShadow id={`${k}fs`} c={{x: -6, y: 0.4}} rx={14} ry={2.2} alpha={0.25 * ss(t, T.thigh, T.with)} color="#4D6878" />
        <Wyatt2 p={p} o={{id: `${k}w`, px, shoeN: 'bare', shoeF: 'sneaker', prosthesis: false, nearLeg: leg, shirt: '#F2A33C', shorts: '#2E3F5C', sock: '#FFFFFF'}} />
      </Layer>
    </>
  );
};
