// V3 middle, part one.
//   ScanShot3   V2's ball-to-scan match (the ball's circle is the scan's round field), then the lens enters the knee
//               image; on "bone cancer" the diseased section is identified inside the femur.
//   AnatShot3   the scan's bone contours match into the side anatomy (same knee, same place on screen); cut lines; the
//               diseased middle separates in one side view; the lens travels with the kept shin and foot, which fill the frame.
//   TurnShot3   a purpose-drawn three-quarter view: the same 3D foot turns about the shin's long axis; the heel passes
//               toward the lens and the toes come round pointing the other way.
//   AttachShot3 the view settles to profile as the shin rises into line with the thigh and seats; the seam closes.
import React from 'react';
import {Cam, Layer, W, H, camScale, glide, CKey, travel} from '../camera';
import {Inked} from '../dc/ink';
import {Limb} from '../dc/limb';
import {Glow, SoftShadow} from '../dc/shade';
import {shade} from '../dc/color';
import {fmt, V} from '../dc/math';
import {LowerLeg3D, TurnRing, Leg3D} from '../art/leg3d';
import {C} from '../art/pal';
import {clamp, ss, ss5, lerp} from '../lib';
import {ScanImage} from '../v2/scan';
import {Plate, AnatLeg, CutFace, CUT_F, CUT_T} from '../v2/anat';
import {SKIN} from '../v2/body';
import {T3, start3, end3, SCAN_T} from './story3';
import {INK} from '../dc/ink';

// ------------------------------------------------------------------------------------------------------ the scan
const S_END = 2.45; // scale of the knee image when it hands over to the anatomy
/** the anatomy's width that puts its knee at the scan's size: condyles 7.5 cm across vs the scan's 216 units */
const KNEE_W = 1080 / ((216 * S_END) / 7.5);
export const scanView3 = (t: number) => {
  const enter = ss5(t, SCAN_T + 0.05, T3.wyatt - 0.15);
  const id = ss5(t, T3.bone - 0.1, T3.cancer + 0.3);
  // the push keeps creeping in while the diseased section is found, landing on S_END exactly at the handover
  const creep = clamp((t - (T3.wyatt - 0.6)) / (T3.cancer + 0.47 - (T3.wyatt - 0.6)));
  return {s: lerp(1, S_END * 0.9, enter) + S_END * 0.1 * creep, cx: 0, cy: lerp(0, -7, enter) - 1 * creep + 0 * id};
};
const ScanFrame: React.FC<{t: number; k: string}> = ({t, k}) => {
  const {s, cx, cy} = scanView3(t);
  const tumor = ss(t, T3.bone - 0.05, T3.cancer + 0.1);
  const ring = ss(t, T3.bone + 0.15, T3.cancer + 0.2);
  const r = 330;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <rect x={0} y={0} width={W} height={H} fill="#1C2630" />
      <g transform={`translate(${W / 2} ${H / 2}) scale(${fmt(s)}) translate(${fmt(cx)} ${fmt(cy)})`}>
        <rect x={-430} y={-600} width={860} height={1180} rx={34} fill="#2A333D" stroke={INK} strokeWidth={5} opacity={1 - ss(t, SCAN_T, SCAN_T + 0.5)} />
        <ScanImage k={k} tumor={tumor} r={lerp(r, 700, ss(t, SCAN_T + 0.2, T3.wyatt))} />
        {/* identifying the diseased section: a dashed contour round it, drawn on */}
        {ring > 0.01 && (
          <ellipse cx={-4} cy={-86} rx={96} ry={104} fill="none" stroke="#FFD84A" strokeWidth={5 / s * 1.6} pathLength={100} opacity={0.95}
            style={{strokeDasharray: `${fmt(ring * 100)} 100`}} />
        )}
      </g>
    </svg>
  );
};
export const ScanShot3: React.FC<{t: number; k: string}> = ({t, k}) => <ScanFrame t={t} k={k} />;

// --------------------------------------------------------------------------------------------------- the anatomy
const LIFT = 16; // the kept piece floats up into the middle of the frame
export const anatCam3 = (t: number): Cam => {
  const t0 = start3('anat');
  const keys: CKey[] = [
    [t0, {x: 0, y: -39.2, w: KNEE_W, eye: -40}],
    [t0 + 0.32, {x: 0, y: -39.2, w: KNEE_W * 1.08, eye: -40}],
    [T3.surgeons + 0.45, {x: -2, y: -42, w: 62, eye: -40}],
    [T3.knee2 + 0.15, {x: -4, y: -40, w: 64, eye: -40}, travel],
    [T3.save + 0.1, {x: 0, y: -24 - LIFT, w: 36, eye: -40}, travel],
    [end3('anat'), {x: 0.5, y: -24.5 - LIFT, w: 34, eye: -40}, travel],
  ];
  return glide(t, keys);
};
const lift = (t: number) => LIFT * ss5(t, T3.knee2 + 0.1, T3.save + 0.15);
export const AnatShot3: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = anatCam3(t);
  const iw = 7 / camScale(c);
  const t0 = start3('anat');
  const cuts = ss(t, T3.surgeons + 0.2, T3.surgeons + 0.55);
  const split = t > T3.remove - 0.05;
  const out = ss5(t, T3.remove, T3.knee2 + 0.25);
  const save = Math.sin(Math.PI * clamp((t - (T3.save - 0.25)) / 1.1));
  const toe = 22 * Math.max(0, Math.sin(Math.PI * clamp((t - T3.foot) / 0.45)));
  const diss = 1 - ss(t, t0, t0 + 0.32);
  const L = lift(t);
  const band = (y0: number, y1: number, id: string) => <clipPath id={id}><rect x={-60} y={y0} width={120} height={y1 - y0} /></clipPath>;
  const line = (y: number, half: number, key: string) => cuts > 0.01 && (
    <g key={key}>
      <line x1={fmt(-half * 1.5)} y1={fmt(y)} x2={fmt(-half * 1.5 + 3 * half * cuts)} y2={fmt(y)} stroke={INK} strokeWidth={iw * 1.6} strokeDasharray={`${fmt(iw * 2.2)} ${fmt(iw * 1.6)}`} opacity={0.55} strokeLinecap="round" />
      <line x1={fmt(-half * 1.5)} y1={fmt(y)} x2={fmt(-half * 1.5 + 3 * half * cuts)} y2={fmt(y)} stroke="#FFFFFF" strokeWidth={iw * 0.9} strokeDasharray={`${fmt(iw * 2.2)} ${fmt(iw * 1.6)}`} strokeLinecap="round" />
    </g>
  );
  return (
    <>
      <Plate k={`${k}a`} />
      <Layer c={c}>
        <defs>{band(-120, CUT_F, `${k}cu`)}{band(CUT_F, CUT_T, `${k}cm`)}{band(CUT_T, 30, `${k}cl`)}</defs>
        {!split ? (
          <g>
            <AnatLeg k={`${k}l`} iw={iw} diseased={1} toe={0} glow={0} />
            <g opacity={0.3 * ss(t, T3.surgeons + 0.4, T3.remove)}><rect x={-9} y={CUT_F} width={18} height={CUT_T - CUT_F} fill={C.tumorGlow} rx={3} /></g>
            {line(CUT_F, 7.6, 'c1')}{line(CUT_T, 4.3, 'c2')}
          </g>
        ) : (
          <g>
            <g opacity={1 - ss(t, T3.but, T3.save)}>
              <g clipPath={`url(#${k}cu)`}><AnatLeg k={`${k}u`} iw={iw} diseased={0} toe={0} glow={0} /></g>
              <CutFace y={CUT_F} half={6.9} bone={1.4} iw={iw} />
            </g>
            <g opacity={1 - ss(t, T3.knee2 - 0.1, T3.knee2 + 0.3)} transform={`translate(${fmt(-26 * out)} ${fmt(-3 * out)}) rotate(${fmt(-8 * out)} 0 ${fmt((CUT_F + CUT_T) / 2)})`}>
              <g clipPath={`url(#${k}cm)`}><AnatLeg k={`${k}m`} iw={iw} diseased={1} toe={0} glow={0} /></g>
              <CutFace y={CUT_F} half={6.9} bone={1.4} iw={iw} /><CutFace y={CUT_T} half={4.1} bone={1.5} iw={iw} />
            </g>
            <g transform={`translate(0 ${fmt(-L)})`}>
              {save > 0.01 && <Glow id={`${k}sv`} c={{x: -2, y: -10}} r={20} ry={18} color={C.healthy} alpha={0.5 * save} blend="normal" />}
              <g clipPath={`url(#${k}cl)`}><AnatLeg k={`${k}lw`} iw={iw} diseased={0} toe={toe} glow={save} /></g>
              <CutFace y={CUT_T} half={4.1} bone={1.5} iw={iw} />
            </g>
          </g>
        )}
      </Layer>
      {diss > 0.01 && <div style={{position: 'absolute', inset: 0, opacity: diss}}><ScanFrame t={t0} k={`${k}sc`} /></div>}
    </>
  );
};

// ------------------------------------------------------------------------------------------- the turn + attach
export const A_PIECE: V = {x: 0, y: -6.4 - LIFT};
export const A_JOIN3: V = {x: 0, y: -39};
const VIEW = 38, PITCH3 = 24;
const pieceOf3 = (t: number): Leg3D => {
  const yaw = -180 * ss5(t, T3.they + 0.12, T3.around + 0.05);
  const settle = ss5(t, T3.and, T3.attached + 0.45);
  const rise = ss5(t, T3.attached - 0.05, T3.thigh + 0.02);
  return {A: {x: 0, y: lerp(A_PIECE.y, A_JOIN3.y, rise)}, sa: 0, yaw, point: 0, top: -19, toeCurl: 0, view: VIEW * (1 - settle), pitch: lerp(PITCH3, 16, settle)};
};
const turnCam = (): Cam => ({x: 0.5, y: -24.5 - LIFT, w: 34, eye: -40});
export const TurnShot3: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = turnCam();
  const iw = 7 / camScale(c);
  const g = pieceOf3(t);
  const ring = ss(t, T3.they, T3.they + 0.25) * (1 - ss(t, T3.around, T3.around + 0.3));
  return (
    <>
      <Plate k={`${k}t`} tone={0.6} />
      <Layer c={c}>
        <SoftShadow id={`${k}ts`} c={{x: 0, y: A_PIECE.y + 15}} rx={13} ry={2.6} alpha={0.2} color="#4D6878" />
        <TurnRing g={g} y={-12} r={7.6} a={ring} dir={-1} half="back" iw={iw} />
        <LowerLeg3D id={`${k}p`} g={g} iw={iw} skin={SKIN} />
        <TurnRing g={g} y={-12} r={7.6} a={ring} dir={-1} half="front" iw={iw} />
      </Layer>
    </>
  );
};
export const AttachShot3: React.FC<{t: number; k: string}> = ({t, k}) => {
  const g = pieceOf3(t);
  const c: Cam = {x: 0.5, y: lerp(-24.5 - LIFT, -50, ss5(t, T3.attached - 0.1, T3.thigh + 0.1)), w: lerp(34, 44, ss5(t, T3.attached, T3.thigh + 0.2)), eye: -40};
  const iw = 7 / camScale(c);
  const seam = ss(t, T3.thigh - 0.05, T3.thigh + 0.2);
  const seamY = -74 + 16;
  const HIP = {x: 0, y: -74};
  return (
    <>
      <Plate k={`${k}t`} tone={0.6} />
      <Layer c={c}>
        <Inked w={iw}>
          <Limb id={`${k}st`} A={{x: 0, y: -96}} B={HIP} C={{x: 0, y: seamY + 0.6}} rA={8.4} rB={8.1} rC={5.6} color={SKIN} k={0.9} capC="flat" />
        </Inked>
        <CutFace y={seamY} half={5.5} bone={1.3} iw={iw} />
        <LowerLeg3D id={`${k}pc`} g={g} iw={iw} skin={SKIN} cutFace={seam < 0.5} />
        {seam > 0.01 && (
          <g opacity={seam}>
            <path d={`M${fmt(-5.7)},${fmt(seamY)} Q0,${fmt(seamY + 1)} ${fmt(5.7)},${fmt(seamY)}`} fill="none" stroke={shade(C.tissue, 0.2)} strokeWidth={iw * 0.8} />
            {[-3.6, -1.2, 1.2, 3.6].map((f) => <line key={f} x1={fmt(f)} y1={fmt(seamY - 0.9)} x2={fmt(f)} y2={fmt(seamY + 1.3)} stroke={shade(C.tissue, 0.4)} strokeWidth={iw * 0.5} strokeLinecap="round" />)}
          </g>
        )}
      </Layer>
    </>
  );
};
export {travel};
