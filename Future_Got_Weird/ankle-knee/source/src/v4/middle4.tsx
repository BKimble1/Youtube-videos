// V4 middle: diagnosis and surgery, following the narration.
//   XrayShot4  (bone) a lateral X-ray of his right knee, already close: the distal femur, the knee joint and the top of
//              the tibia fill the frame from the first frame (no monitor, no push-in; the camera is still). "bone": the
//              mottled section tints from inside; "cancer": a dashed ring identifies it; "Surgeons had to": dashed cut
//              margins above the tumour (femur) and below the knee (tibia), and the band between them tints: what has to go.
//   AnatShot4  (remove) a 0.24 s matched dissolve: the X-ray is drawn in the illustration's own world (same knee, same
//              bones, same cut lines, same camera), so the clean side-profile surgical illustration lands on it exactly.
//              "remove his knee": the cuts open and the diseased middle slides out of frame. "but they could save his
//              foot": a tilt down at the same scale (the dot grid moves with the lens) to the whole kept lower segment,
//              cut end to sole; it glows and the toes stir.
//   TurnShot4  (They) one continuous shot from a still lens in a purpose-drawn three-quarter view. The thigh stump (its
//              cut face and the femur end showing) is a fixed reference at the top; the kept lower segment (the same 3D
//              piece as V3) hangs below it with a gap. The turn starts at the cut and runs as one action: toes forward ->
//              the heel passes toward the lens -> toes backward (settled on "around"). On "and" the two joining
//              surfaces light up; the segment rises into line and seats against the thigh by "thigh"; a seam closes.
import React from 'react';
import {Cam, Layer, W, H, camScale} from '../camera';
import {Inked, INK} from '../dc/ink';
import {Glow, Blob, Lin} from '../dc/shade';
import {lit, shade} from '../dc/color';
import {fmt, V} from '../dc/math';
import {BioFoot} from '../art/wyatt';
import {LowerLeg3D, TurnRing, Leg3D, legXf, SHIN_S, PITCH} from '../art/leg3d';
import {C} from '../art/pal';
import {clamp, ss, ss5, lerp, hash} from '../lib';
import {Plate, CUT_F, CUT_T} from '../v2/anat';
import {SKIN} from '../v2/body';
import {T4, CUT_TURN} from './story4';

/** caption heights (px) for indices 2-6: top for the X-ray and the anatomy (the cut lines sit below 395 px), bottom
 *  for the turn (the thigh and the join are at the top, the foot stays above 1530 px) */
export const CAP_Y_MIDDLE: Record<number, number> = {2: 260, 3: 260, 4: 260, 5: 260, 6: 260};

// ------------------------------------------------------------------------------------------------ the shared leg
// The leg before the operation, side profile, facing screen-left (world cm, ground y = 0): the illustration's bones
// and cut heights (v2/anat.tsx AnatLeg, CUT_F / CUT_T), with a drawn skin profile (quadriceps, kneecap, the hollow
// behind the knee, the calf) so a close frame reads as a leg rather than a taper, the kneecap inside the skin, and the
// diseased section a little lower so the femoral cut has a margin above it. The X-ray draws these same contours.
const ANKLE: V = {x: 0, y: -6.4};
const P = (x: number, y: number) => `${fmt(x)},${fmt(y)}`;
const FEMUR_D = `M${P(-1.4, -80)} L${P(-1.6, -50)} Q${P(-3.6, -45)} ${P(-3.4, -41.4)} Q${P(-1.2, -39.2)} ${P(1.6, -40.4)} Q${P(3.9, -41.2)} ${P(3.4, -44.6)} Q${P(1.6, -48)} ${P(1.4, -51)} L${P(1.3, -80)} Z`;
const TIBIA_D = `M${P(-3.4, -38.2)} Q${P(0, -38.9)} ${P(3.2, -38.2)} Q${P(3.0, -35.5)} ${P(1.0, -33.5)} L${P(0.9, -9.5)} Q${P(1.2, -7.6)} ${P(0.2, -7.0)} Q${P(-2.4, -6.9)} ${P(-2.6, -8.8)} L${P(-1.6, -33.5)} Q${P(-3.5, -35.4)} ${P(-3.4, -38.2)} Z`;
const FIB_D = `M${P(2.6, -35.5)} Q${P(3.6, -35.6)} ${P(3.4, -34)} L${P(2.6, -8.4)} L${P(1.8, -8.4)} L${P(2.2, -34)} Z`;
const PAT = {cx: -4.25, cy: -41.4, rx: 1.25, ry: 2.3};
/** the diseased section of the distal femur (metaphysis, above the growth plate) */
const TUM = {cx: 0.15, cy: -48.4, rx: 4.6, ry: 6.2};
const TUMOR_D = `M${P(-2.0, -54.0)} Q${P(0.2, -55.4)} ${P(1.8, -53.6)} L${P(3.1, -45.2)} Q${P(0.6, -43.0)} ${P(-3.1, -44.4)} Z`;
// the skin's side profile: front (x < 0) and back contours as [y, x] keys, top to bottom. Below the knee it is the 3D
// piece's own shin (leg3d SHIN_S, cx -/+ rx, relative to the ankle), so the kept segment is the same shape in both shots.
const FRONT: [number, number][] = [[-84, -8.7], [-74, -8.3], [-66, -7.7], [-58, -7.0], [-51, -6.35], [-46, -6.05], [-42.3, -6.0], [-39.4, -5.55], [-36.4, -4.75], [-33.4, -4.1], [-27.4, -3.6], [-21.4, -3.1], [-16.4, -2.8], [-12.4, -2.7], [-8.9, -2.6], [-5.8, -2.7]];
const BACK: [number, number][] = [[-84, 8.6], [-74, 8.2], [-66, 7.7], [-58, 7.05], [-51, 6.35], [-45, 5.75], [-41.2, 5.05], [-38.0, 5.1], [-35.0, 5.4], [-31.4, 6.0], [-27.4, 6.8], [-21.4, 6.1], [-16.4, 4.6], [-12.4, 3.7], [-8.9, 3.2], [-5.8, 3.1]];
/** Catmull-Rom through the keys (as x(y)) */
const crX = (keys: [number, number][], y: number) => {
  const n = keys.length;
  if (y <= keys[0][0]) return keys[0][1];
  if (y >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (i < n - 2 && y > keys[i + 1][0]) i++;
  const [y1, p1] = keys[i], [y2, p2] = keys[i + 1];
  const [y0, p0] = i > 0 ? keys[i - 1] : [y1 - (y2 - y1), p1];
  const [y3, p3] = i + 2 < n ? keys[i + 2] : [y2 + (y2 - y1), p2];
  const m1 = ((p2 - p0) / (y2 - y0)) * (y2 - y1), m2 = ((p3 - p1) / (y3 - y1)) * (y2 - y1);
  const u = (y - y1) / (y2 - y1), u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
};
export const skinFront = (y: number) => crX(FRONT, y), skinBack = (y: number) => crX(BACK, y);
const skinPath = (y0: number, y1: number, inset = 0) => {
  const n = Math.max(8, Math.ceil((y1 - y0) / 0.6));
  const ys = Array.from({length: n + 1}, (_, i) => y0 + ((y1 - y0) * i) / n);
  const f = ys.map((y) => P(skinFront(y) + inset, y)), b = ys.reverse().map((y) => P(skinBack(y) - inset, y));
  const yb = y1, xm = (skinFront(yb) + skinBack(yb)) / 2, r = (skinBack(yb) - skinFront(yb)) / 2 - inset;
  return `M${f.join('L')} Q${P(xm - r * 0.1, yb + r * 1.1)} ${b[0]} L${b.join('L')} Z`;
};
const SKIN_D = skinPath(-84, -5.8);
const MUSCLE_D = skinPath(-84, -7.5, 0.95);

/** the side-profile surgical illustration (bones through translucent skin) */
const AnatLeg4: React.FC<{k: string; iw: number; diseased: number; toe: number; alive?: number}> = ({k, iw, diseased, toe, alive = 0}) => (
  <g>
    <g opacity={lerp(0.62, 0.94, alive)}>
      <Inked w={iw}>
        <Lin id={`${k}lg`} d={SKIN_D} from={{x: -8, y: -50}} to={{x: 8, y: -46}} stops={[[0, lit(SKIN, 0.28)], [0.3, lit(SKIN, 0.06)], [0.6, SKIN], [0.9, shade(SKIN, 0.24)], [1, shade(SKIN, 0.16)]]} />
        <BioFoot id={`${k}ft`} A={ANKLE} fa={90} h={1} iw={iw} toeCurl={toe} skin={SKIN} />
      </Inked>
    </g>
    <ellipse cx={3.0} cy={-27} rx={3.0} ry={7.5} fill={shade(SKIN, 0.12)} opacity={0.3} />
    <g opacity={1 - 0.7 * alive}>
      {[FIB_D, TIBIA_D, FEMUR_D].map((d, i) => <path key={i} d={d} fill={i === 0 ? shade(C.bone, 0.08) : C.bone} stroke={shade(C.boneDeep, 0.3)} strokeWidth={iw * 0.55} />)}
      <ellipse cx={PAT.cx} cy={PAT.cy} rx={PAT.rx} ry={PAT.ry} fill={C.bone} stroke={shade(C.boneDeep, 0.3)} strokeWidth={iw * 0.5} />
    </g>
    {diseased > 0.01 && (
      <g opacity={diseased}>
        <defs><clipPath id={`${k}fc`}><path d={FEMUR_D} /></clipPath></defs>
        <g clipPath={`url(#${k}fc)`}><path d={TUMOR_D} fill={C.tumor} opacity={0.72} /></g>
        <ellipse cx={TUM.cx} cy={TUM.cy} rx={TUM.rx + 0.8} ry={TUM.ry + 1.2} fill={C.tumorGlow} opacity={0.22} />
      </g>
    )}
  </g>
);

/** a dashed cut line, drawn on from the front (left) to the back; ink under white (v2/anat cutLine) */
const CutLine: React.FC<{y: number; x0: number; x1: number; u: number; iw: number}> = ({y, x0, x1, u, iw}) => {
  if (u <= 0.01) return null;
  const xe = lerp(x0, x1, u);
  const dash = `${fmt(iw * 2.2)} ${fmt(iw * 1.6)}`;
  return (
    <g>
      <line x1={fmt(x0)} y1={fmt(y)} x2={fmt(xe)} y2={fmt(y)} stroke={INK} strokeWidth={iw * 1.7} strokeDasharray={dash} opacity={0.6} strokeLinecap="round" />
      <line x1={fmt(x0)} y1={fmt(y)} x2={fmt(xe)} y2={fmt(y)} stroke="#FFFFFF" strokeWidth={iw * 0.95} strokeDasharray={dash} strokeLinecap="round" />
    </g>
  );
};
const CUT_FX: [number, number] = [skinFront(CUT_F) - 3.0, skinBack(CUT_F) + 3.0];
const CUT_TX: [number, number] = [skinFront(CUT_T) - 3.0, skinBack(CUT_T) + 3.0];
/** a clean cut face across the leg at height y (tissue band, the bone's end in cream), from the skin's own edges */
const CutFace4: React.FC<{y: number; bx: number; bone: number; iw: number}> = ({y, bx, bone, iw}) => (
  <g>
    <line x1={fmt(skinFront(y) + 0.1)} y1={fmt(y)} x2={fmt(skinBack(y) - 0.1)} y2={fmt(y)} stroke={C.tissue} strokeWidth={iw * 2.2} strokeLinecap="round" />
    <line x1={fmt(bx - bone)} y1={fmt(y)} x2={fmt(bx + bone)} y2={fmt(y)} stroke={C.bone} strokeWidth={iw * 2.4} strokeLinecap="round" />
  </g>
);

// ----------------------------------------------------------------------------------------------------- the X-ray
/** the X-ray and the illustration share this lens: the femoral cut at 395 px, the tibial cut at ~1652 px */
export const XCAM: Cam = {x: -0.3, y: CUT_F + (H / 2 - 395) / (W / 28), w: 28, eye: -40};
const XR = {bg0: '#101C26', bg1: '#04080B', soft0: '#22323E', soft1: '#33485A', bone: '#A8BBC8', cortex: '#F1F6F9', canal: '#7C90A0'};
const BLOTS = Array.from({length: 30}, (_, i) => ({x: -2.7 + hash(i * 3.3) * 5.6, y: -53.8 + hash(i * 7.1) * 10.6, r: 0.22 + hash(i * 1.9) * 0.55}));
/** the lateral knee X-ray in world cm; tumor = the magenta tint from inside, ring = identification, cuts = margins */
const XrayLeg: React.FC<{k: string; iw: number; tumor: number; ring: number; cutF: number; cutT: number; band: number}> = ({k, iw, tumor, ring, cutF, cutT, band}) => {
  const pulse = 0.88 + 0.12 * Math.sin(tumor * 6.5);
  const bone = (d: string, id: string) => (
    <g key={id}>
      <defs><clipPath id={`${k}${id}`}><path d={d} /></clipPath></defs>
      <path d={d} fill={XR.bone} />
      <g clipPath={`url(#${k}${id})`}>
        <path d={d} fill="none" stroke={XR.cortex} strokeWidth={1.5} opacity={0.35} />
        <path d={d} fill="none" stroke={XR.cortex} strokeWidth={0.7} />
      </g>
    </g>
  );
  // the ring: dashes round an ellipse, appearing in order (a dashed contour drawn on)
  const NR = 30;
  const rr = {rx: TUM.rx + 1.5, ry: TUM.ry + 1.0};
  const dashes = Array.from({length: NR}, (_, i) => {
    const vis = clamp(ring * NR - i);
    if (vis <= 0) return null;
    const a0 = -Math.PI / 2 - (i / NR) * Math.PI * 2, a1 = a0 - (Math.PI * 2 * 0.58 * vis) / NR;
    const pt = (a: number) => P(TUM.cx + rr.rx * Math.cos(a), TUM.cy - 0.5 + rr.ry * Math.sin(a));
    return `M${pt(a0)} A${fmt(rr.rx)} ${fmt(rr.ry)} 0 0 0 ${pt(a1)}`;
  }).filter(Boolean).join(' ');
  return (
    <g>
      <defs>
        <linearGradient id={`${k}sg`} gradientUnits="userSpaceOnUse" x1={-7} y1={0} x2={7} y2={0}>
          <stop offset="0" stopColor={XR.soft0} /><stop offset="0.3" stopColor={XR.soft1} /><stop offset="0.7" stopColor={XR.soft1} /><stop offset="1" stopColor={XR.soft0} />
        </linearGradient>
        <radialGradient id={`${k}tg`}>
          <stop offset="0" stopColor={C.tumorGlow} stopOpacity={0.95} /><stop offset="0.6" stopColor={C.tumor} stopOpacity={0.7} /><stop offset="1" stopColor={C.tumor} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${k}sk`}><path d={SKIN_D} /></clipPath>
        <clipPath id={`${k}fm`}><path d={FEMUR_D} /></clipPath>
      </defs>
      {/* soft tissue, a slightly brighter rim at the skin line */}
      <path d={SKIN_D} fill={XR.soft0} />
      <path d={MUSCLE_D} fill={`url(#${k}sg)`} />
      <path d={SKIN_D} fill="none" stroke="#4A5E6F" strokeWidth={iw * 0.55} opacity={0.75} />
      <ellipse cx={3.4} cy={-28} rx={2.6} ry={6.5} fill="#3A4D5C" opacity={0.3} />
      {/* bones: mid-grey with a bright cortex, the marrow canal darker in the shafts */}
      {bone(FIB_D, 'xb0')}{bone(TIBIA_D, 'xb1')}{bone(FEMUR_D, 'xb2')}
      <path d={`M${P(-0.55, -80)} L${P(-0.7, -55)} Q${P(0, -52.5)} ${P(0.6, -55)} L${P(0.5, -80)} Z`} fill={XR.canal} opacity={0.6} />
      <path d={`M${P(-0.7, -31)} L${P(-0.55, -12)} Q${P(-0.1, -10.5)} ${P(0.3, -12)} L${P(0.35, -31)} Q${P(-0.2, -33)} ${P(-0.7, -31)} Z`} fill={XR.canal} opacity={0.6} />
      <ellipse cx={PAT.cx} cy={PAT.cy} rx={PAT.rx} ry={PAT.ry} fill={XR.bone} stroke={XR.cortex} strokeWidth={0.35} />
      {/* open growth plates (a child's knee): a dark wavy line across each epiphysis */}
      <path d={`M${P(-3.0, -43.0)} Q${P(-1.6, -42.2)} ${P(-0.4, -43.1)} T${P(2.2, -43.0)} T${P(3.4, -43.6)}`} fill="none" stroke="#2C3B47" strokeWidth={0.32} opacity={0.85} />
      <path d={`M${P(-3.1, -36.4)} Q${P(-1.5, -35.8)} ${P(0, -36.5)} T${P(2.9, -36.3)}`} fill="none" stroke="#2C3B47" strokeWidth={0.3} opacity={0.85} />
      {/* trabecular speckle in the epiphyses */}
      {Array.from({length: 22}, (_, i) => {
        const top = i < 12;
        const x = top ? -3 + hash(i * 2.7) * 6.2 : -2.8 + hash(i * 4.1) * 5.6, y = top ? -42.6 + hash(i * 5.3) * 2.6 : -38.0 + hash(i * 6.7) * 3.4;
        return <circle key={i} cx={fmt(x)} cy={fmt(y)} r={fmt(0.16 + 0.12 * hash(i))} fill="#DCE6EC" opacity={0.35} />;
      })}
      {/* the diseased section: mottled, moth-eaten bone (always there), then the tint from inside the bone */}
      <g clipPath={`url(#${k}fm)`}>
        {BLOTS.map((b, i) => <circle key={i} cx={fmt(b.x)} cy={fmt(b.y)} r={fmt(b.r)} fill={i % 3 ? '#6E8191' : '#E6EDF2'} opacity={0.6} />)}
        <ellipse cx={TUM.cx} cy={TUM.cy} rx={TUM.rx} ry={TUM.ry} fill={`url(#${k}tg)`} opacity={tumor * pulse} />
      </g>
      <g clipPath={`url(#${k}sk)`}>
        <ellipse cx={TUM.cx} cy={TUM.cy} rx={TUM.rx + 2.2} ry={TUM.ry + 1.4} fill={`url(#${k}tg)`} opacity={0.32 * tumor} />
      </g>
      {/* sunburst spicules off the front and back of the metaphysis */}
      {Array.from({length: 14}, (_, i) => {
        const side = i % 2 ? 1 : -1, j = Math.floor(i / 2);
        const y0 = -53 + j * 1.35 + hash(i * 3.1) * 0.4;
        const x0 = side * (j < 4 ? 1.6 + j * 0.35 : 2.8 + (j - 4) * 0.25);
        const a = (side > 0 ? 0 : Math.PI) + side * (-0.5 + j * 0.15);
        const l = 0.9 + hash(i * 5.5) * 0.8;
        return <line key={i} x1={fmt(x0)} y1={fmt(y0)} x2={fmt(x0 + Math.cos(a) * l)} y2={fmt(y0 + Math.sin(a) * l)} stroke={tumor > 0.05 ? C.tumorGlow : '#9AAAB6'} strokeWidth={0.13} opacity={0.35 + 0.55 * tumor} strokeLinecap="round" />;
      })}
      {/* what has to go: the band between the margins */}
      {band > 0.01 && <g clipPath={`url(#${k}sk)`}><rect x={-12} y={CUT_F} width={24} height={CUT_T - CUT_F} fill={C.tumorGlow} opacity={0.2 * band} /></g>}
      {dashes && (
        <g>
          <path d={dashes} fill="none" stroke="#0A0F14" strokeWidth={iw * 2.0} strokeLinecap="round" opacity={0.55} />
          <path d={dashes} fill="none" stroke="#FFD84A" strokeWidth={iw * 1.15} strokeLinecap="round" />
        </g>
      )}
      <CutLine y={CUT_F} x0={CUT_FX[0]} x1={CUT_FX[1]} u={cutF} iw={iw} />
      <CutLine y={CUT_T} x0={CUT_TX[0]} x1={CUT_TX[1]} u={cutT} iw={iw} />
    </g>
  );
};
const xrayState = (t: number) => ({
  tumor: ss(t, T4.bone - 0.03, T4.cancer + 0.04),
  ring: ss(t, T4.cancer + 0.02, T4.cancer + 0.4),
  cutF: ss(t, T4.surgeons + 0.03, T4.surgeons + 0.3),
  cutT: ss(t, T4.surgeons + 0.17, T4.surgeons + 0.44),
  band: ss(t, T4.surgeons + 0.36, T4.remove - 0.1),
});
const XrayFrame: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = XCAM;
  const iw = 7 / camScale(c);
  const s = xrayState(t);
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <radialGradient id={`${k}xb`} cx="0.5" cy="0.42" r="0.75">
            <stop offset="0" stopColor={XR.bg0} /><stop offset="1" stopColor={XR.bg1} />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill={`url(#${k}xb)`} />
      </svg>
      <Layer c={c}><XrayLeg k={`${k}x`} iw={iw} {...s} /></Layer>
      {/* the film's side marker */}
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <text x={W - 120} y={H / 2 - 120} fontFamily='"Nunito Variable", "Nunito", system-ui, sans-serif' fontWeight={900} fontSize={56} fill="#DCE6EC" opacity={0.4}>R</text>
      </svg>
    </>
  );
};
export const XrayShot4: React.FC<{t: number; k: string}> = ({t, k}) => <XrayFrame t={t} k={k} />;

// --------------------------------------------------------------------------------------------------- the anatomy
/** one still frame holds the whole operation: the thigh's cut (CUT_F) just under the two-line caption (which ends at
 *  ~340 px), the knee between the cuts, and the whole kept lower segment down to the sole, which stays above ~1625 px
 *  (clear of the Shorts overlay); the toes ~210 px inside the left edge */
const ANAT_W = 50;
export const ANATCAM: Cam = {x: -3, y: CUT_F + (H / 2 - 375) / (W / ANAT_W), w: ANAT_W, eye: -40};
/** on "but they could save his foot" the lens tilts down at the same scale (no push-in): the kept segment comes to
 *  the middle of the frame (its cut face ~780 px, the sole ~1330 px), the thigh leaves the top */
export const anatCam4 = (t: number): Cam => ({...ANATCAM, y: ANATCAM.y + 13.8 * ss5(t, T4.but - 0.04, T4.save + 0.06), eye: ANATCAM.eye + 13.8 * ss5(t, T4.but - 0.04, T4.save + 0.06)});
const SPLIT = T4.remove; // 5.42: the dashed margins become cut faces
const OUT0 = T4.remove + 0.04, OUT1 = T4.knee2 + 0.19; // 5.46 -> 6.20: the diseased middle slides out of frame
const SAVE0 = T4.save - 0.06;
export const AnatShot4: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = anatCam4(t);
  const iw = 7 / camScale(c);
  const split = t >= SPLIT;
  const dash = 1 - ss(t, SPLIT - 0.03, SPLIT + 0.1);
  const faceIn = ss(t, SPLIT - 0.03, SPLIT + 0.07);
  const out = ss5(t, OUT0, OUT1);
  // where the knee was: a dashed ghost of the removed section, while "knee, but they could" sinks in
  const ghost = ss(t, OUT1 - 0.3, OUT1 + 0.05) * (1 - ss(t, SAVE0, T4.save + 0.3));
  // "but they could save his foot": the thigh steps back a little, a mint glow comes up round the kept segment and
  // gathers on the foot, the skin turns solid (the next shot's 3D piece), the toes stir once
  const dim = ss(t, T4.but, T4.save + 0.2);
  const save = ss(t, SAVE0, T4.save + 0.3);
  const onFoot = ss(t, T4.foot - 0.1, T4.foot + 0.25);
  const alive = ss(t, T4.save, T4.foot + 0.3);
  const toe = 0; // (the toes keep still here: the one wiggle belongs to "wiggle his toes")
  const band = (y0: number, y1: number, id: string) => <clipPath id={id}><rect x={-60} y={y0} width={120} height={y1 - y0} /></clipPath>;
  const mid = (CUT_F + CUT_T) / 2;
  return (
    <>
      <Plate k={`${k}a`} />
      <Layer c={c}>
        <defs>{band(-120, CUT_F, `${k}cu`)}{band(CUT_F, CUT_T, `${k}cm`)}{band(CUT_T, 30, `${k}cl`)}</defs>
        {!split ? (
          <g>
            <AnatLeg4 k={`${k}l`} iw={iw} diseased={1} toe={0} />
            <g clipPath={`url(#${k}cm)`}><path d={SKIN_D} fill={C.tumorGlow} opacity={0.15} /></g>
          </g>
        ) : (
          <g>
            <g opacity={1 - 0.3 * dim}>
              <g clipPath={`url(#${k}cu)`}><AnatLeg4 k={`${k}u`} iw={iw} diseased={0} toe={0} /></g>
              <g opacity={faceIn}><CutFace4 y={CUT_F} bx={0} bone={1.4} iw={iw} /></g>
            </g>
            {ghost > 0.01 && (
              <g clipPath={`url(#${k}cm)`} opacity={ghost}>
                <path d={SKIN_D} fill={C.plateDeep} opacity={0.18} />
                <path d={SKIN_D} fill="none" stroke={shade(C.plateDeep, 0.35)} strokeWidth={iw * 0.8} strokeDasharray={`${fmt(iw * 2.4)} ${fmt(iw * 1.8)}`} strokeLinecap="round" />
              </g>
            )}
            {out < 0.999 && (
              <g opacity={1 - ss(t, OUT1 - 0.28, OUT1)} transform={`translate(${fmt(-30 * out)} ${fmt(-3 * out)}) rotate(${fmt(-9 * out)} 0 ${fmt(mid)})`}>
                <g clipPath={`url(#${k}cm)`}>
                  <AnatLeg4 k={`${k}m`} iw={iw} diseased={1} toe={0} />
                  <path d={SKIN_D} fill={C.tumorGlow} opacity={0.15} />
                </g>
                <g opacity={faceIn}><CutFace4 y={CUT_F} bx={0} bone={1.4} iw={iw} /></g>
                <g opacity={faceIn}><CutFace4 y={CUT_T} bx={-0.35} bone={1.3} iw={iw} /></g>
              </g>
            )}
            {save > 0.01 && (
              <g>
                <Glow id={`${k}sv`} c={{x: -4, y: -12.5}} r={18} ry={18} color={C.healthy} alpha={0.5 * save * (1 - 0.4 * onFoot)} blend="normal" />
                <Glow id={`${k}sf`} c={{x: -5.5, y: -4}} r={15} ry={9} color={C.healthy} alpha={0.65 * onFoot} blend="normal" />
              </g>
            )}
            <g clipPath={`url(#${k}cl)`}><AnatLeg4 k={`${k}lw`} iw={iw} diseased={0} toe={toe} alive={alive} /></g>
            <g opacity={faceIn}><CutFace4 y={CUT_T} bx={-0.35} bone={1.3} iw={iw} /></g>
          </g>
        )}
        {dash > 0.01 && (
          <g opacity={dash}>
            <CutLine y={CUT_F} x0={CUT_FX[0]} x1={CUT_FX[1]} u={1} iw={iw} />
            <CutLine y={CUT_T} x0={CUT_TX[0]} x1={CUT_TX[1]} u={1} iw={iw} />
          </g>
        )}
      </Layer>
    </>
  );
};

// ---------------------------------------------------------------------------------------- the turn and the join
const VIEW = 38, PITCH_T = 24;
/** the lower segment's ankle when it has joined (its cut top meets the thigh's cut face), and the gap before */
const A_JOIN: V = {x: 0, y: -39};
const GAP = 10;
const TOP = -19;
const YAW0 = CUT_TURN - 0.04, YAW1 = T4.around + 0.05; // 7.84 -> 9.51
const RISE0 = YAW1 - 0.09, RISE1 = T4.thigh + 0.15; // 9.42 -> 11.05: the rise grows out of the turn's settle and seats on "thigh"
/** a trapezoid of speed with cosine ramps: under way at once, constant through the middle, settling at the end */
const trap = (t: number, t0: number, t1: number, ta: number, td: number) => {
  const T = t1 - t0, s = clamp(t - t0, 0, T);
  const area = T - (ta + td) / 2;
  let a: number;
  if (s <= ta) a = s / 2 - (ta / (2 * Math.PI)) * Math.sin((Math.PI * s) / ta);
  else if (s <= T - td) a = ta / 2 + (s - ta);
  else { const r = T - s; a = area - (r / 2 - (td / (2 * Math.PI)) * Math.sin((Math.PI * r) / td)); }
  return a / area;
};
export const turnYaw4 = (t: number) => -180 * trap(t, YAW0, YAW1, 0.32, 0.55);
const riseOf = (t: number) => trap(t, RISE0, RISE1, 0.3, 0.3);
const pieceOf4 = (t: number): Leg3D => ({A: {x: A_JOIN.x, y: A_JOIN.y + GAP * (1 - riseOf(t))}, sa: 0, yaw: turnYaw4(t), point: 0, top: TOP, toeCurl: 0, view: VIEW, pitch: PITCH_T});
/** still lens: ~21 cm of tapering thigh from the top edge down to its cut (the join, ~560 px, under the caption band
 *  which ends at ~375 px), the gap, and the turning segment (its lowest point ~1560 px, the toes ~130 px inside) */
export const TURNCAM: Cam = {x: -1.2, y: -42.3, w: 42, eye: -40};

// the thigh stump: a loft whose bottom section is exactly the shin's cut section once that has turned (so the two
// outlines meet at the seam), widening toward the hip like a thigh. Coordinates are the shin's after its half-turn,
// relative to A_JOIN, projected exactly like legXf (same lens turn, the shin's pitch), and never re-projected: the
// thigh's outline is the same in every frame. While the gap is open its cut face (the femur end in the middle) is
// drawn on its bottom ring, exploded-view style; it fades to skin as the shin seats against it.
const topSec = (() => {
  for (let i = 0; i + 1 < SHIN_S.length; i++) {
    const a = SHIN_S[i], b = SHIN_S[i + 1];
    if (TOP <= a.y && TOP >= b.y) { const u = (a.y - TOP) / (a.y - b.y); return {cx: lerp(a.cx, b.cx, u), rx: lerp(a.rx, b.rx, u), rz: lerp(a.rz, b.rz, u)}; }
  }
  return SHIN_S[SHIN_S.length - 1];
})();
const STUMP: {y: number; cx: number; rx: number; rz: number}[] = [
  {y: TOP, cx: -topSec.cx, rx: topSec.rx, rz: topSec.rz},
  {y: TOP - 2, cx: -1.45, rx: topSec.rx + 0.3, rz: topSec.rz + 0.32},
  {y: TOP - 5, cx: -1.1, rx: 5.95, rz: 5.45},
  {y: TOP - 9, cx: -0.7, rx: 6.7, rz: 6.2},
  {y: TOP - 14, cx: -0.35, rx: 7.35, rz: 6.85},
  {y: TOP - 20, cx: -0.1, rx: 7.85, rz: 7.35},
  {y: TOP - 30, cx: 0, rx: 8.35, rz: 7.85},
  {y: TOP - 50, cx: 0, rx: 8.7, rz: 8.2},
];
const NS = 28;
const STUMP_X = (() => {
  const vw = (VIEW * Math.PI) / 180, pi = (PITCH_T * Math.PI) / 180;
  return (p: [number, number, number]) => {
    const x = p[0] * Math.cos(vw) - p[2] * Math.sin(vw), z = p[0] * Math.sin(vw) + p[2] * Math.cos(vw);
    return {x: A_JOIN.x + x, y: A_JOIN.y + p[1] * Math.cos(pi - PITCH) - z * Math.sin(pi), z: z * Math.cos(pi)};
  };
})();
const hull = (ps: V[]): V[] => {
  const s = [...ps].sort((a, b) => a.x - b.x || a.y - b.y);
  const cr = (o: V, a: V, b: V) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: V[] = [], hi: V[] = [];
  for (const p of s) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of [...s].reverse()) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};
const polyD = (ps: V[]) => 'M' + ps.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join('L') + 'Z';
const ringOf = (s: {y: number; cx: number; rx: number; rz: number}) =>
  Array.from({length: NS}, (_, i) => { const a = (i / NS) * Math.PI * 2; return STUMP_X([s.cx + s.rx * Math.cos(a), s.y, s.rz * Math.sin(a)]); });
const STUMP_RINGS = STUMP.map(ringOf);
const STUMP_D = (() => { let d = ''; for (let i = 0; i + 1 < STUMP_RINGS.length; i++) d += polyD(hull([...STUMP_RINGS[i], ...STUMP_RINGS[i + 1]])); return d; })();
const STUMP_BOT = polyD(STUMP_RINGS[0]);
/** the femur's cross-section on the stump's face (drawn as seen from below: depth mirrored) */
const FEM_C = {x: -(topSec.cx - 1.5), z: 0.3};
const femDisc = (r: number) => polyD(Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2; return STUMP_X([FEM_C.x + r * Math.cos(a), TOP, FEM_C.z + r * Math.sin(a)]); }));
const ThighStump: React.FC<{k: string; iw: number; face: number; glow: number}> = ({k, iw, face, glow}) => {
  const c0 = STUMP_X([0, TOP - 16, 0]);
  return (
    <g>
      <Inked w={iw}>
        <Blob id={`${k}sb`} d={STUMP_D} c={{x: c0.x - 3, y: c0.y - 4}} r={30} color={SKIN} k={0.7} />
      </Inked>
      {face > 0.01 && (
        <g opacity={face}>
          <path d={STUMP_BOT} fill={C.tissue} stroke={INK} strokeWidth={iw * 0.5} />
          <path d={femDisc(1.45)} fill={C.bone} stroke={shade(C.boneDeep, 0.25)} strokeWidth={iw * 0.35} />
          <path d={femDisc(0.7)} fill={C.marrow} opacity={0.9} />
        </g>
      )}
      {glow > 0.01 && <path d={STUMP_BOT} fill="none" stroke={C.healthy} strokeWidth={iw * 1.3} opacity={glow} strokeLinejoin="round" />}
    </g>
  );
};
/** the shin's cut face ring (projected exactly as LowerLeg3D draws it) with each point's depth */
const shinTopRing = (g: Leg3D) => {
  const X = legXf(g);
  return Array.from({length: NS}, (_, i) => { const a = (i / NS) * Math.PI * 2; return X([topSec.cx + topSec.rx * Math.cos(a), TOP, topSec.rz * Math.sin(a)], false); });
};
export const TurnShot4: React.FC<{t: number; k: string}> = ({t, k}) => {
  const c = TURNCAM;
  const iw = 7 / camScale(c);
  const g = pieceOf4(t);
  const rise = riseOf(t);
  const gap = GAP * (1 - rise);
  const X = legXf(g);
  // the previous shot's mint glow on the foot, carried across the cut and let go
  const carry = 1 - ss(t, CUT_TURN, CUT_TURN + 0.25);
  const footC = X([-4.5, 3, 0], true);
  const ringA = ss(t, CUT_TURN, CUT_TURN + 0.16) * (1 - ss(t, YAW1 - 0.3, YAW1 + 0.02));
  const hl = ss(t, YAW1 - 0.04, YAW1 + 0.16) * (1 - ss(t, RISE1 - 0.16, RISE1 - 0.04));
  // contact: the shin's face is covered by the thigh's (they coincide) and drops out; the thigh's face fades to skin in
  // three frames under the seam's flash
  const seated = gap < 0.15;
  const face = 1 - ss(t, RISE1 - 0.1, RISE1);
  const seam = ss(t, RISE1 - 0.1, RISE1 + 0.12);
  const flash = Math.sin(Math.PI * clamp((t - (RISE1 - 0.1)) / 0.5));
  const sr = shinTopRing(g);
  const front = sr.filter((q) => q.z <= 0.05).sort((a, b) => a.x - b.x);
  const seamD = front.length > 1 ? 'M' + front.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join('L') : '';
  return (
    <>
      <Plate k={`${k}t`} tone={0.6} />
      <Layer c={c}>
        {carry > 0.01 && <Glow id={`${k}cg`} c={{x: footC.x, y: footC.y}} r={15} ry={10} color={C.healthy} alpha={0.55 * carry} blend="normal" />}
        {hl > 0.01 && <Glow id={`${k}hg`} c={{x: A_JOIN.x - 1, y: A_JOIN.y + TOP + gap / 2}} r={10} ry={6 + gap * 0.45} color={C.healthy} alpha={0.45 * hl} blend="normal" />}
        <TurnRing g={g} y={-12} r={7.6} a={ringA} dir={-1} half="back" iw={iw} />
        <LowerLeg3D id={`${k}p`} g={g} iw={iw} skin={SKIN} cutFace={!seated} />
        <TurnRing g={g} y={-12} r={7.6} a={ringA} dir={-1} half="front" iw={iw} />
        {hl > 0.01 && !seated && <path d={polyD(sr)} fill="none" stroke={C.healthy} strokeWidth={iw * 1.3} opacity={hl} strokeLinejoin="round" />}
        <ThighStump k={`${k}th`} iw={iw} face={face} glow={hl} />
        {seam > 0.01 && seamD && (
          <g opacity={seam}>
            {flash > 0.01 && <path d={seamD} fill="none" stroke={C.healthy} strokeWidth={iw * 2.2} opacity={0.6 * flash} strokeLinecap="round" />}
            <path d={seamD} fill="none" stroke={shade(C.tissue, 0.2)} strokeWidth={iw * 0.8} strokeLinecap="round" />
            {front.filter((_, i) => i % 2 === 1).map((p, i) => <line key={i} x1={fmt(p.x)} y1={fmt(p.y - 0.8)} x2={fmt(p.x)} y2={fmt(p.y + 1.1)} stroke={shade(C.tissue, 0.4)} strokeWidth={iw * 0.5} strokeLinecap="round" />)}
          </g>
        )}
      </Layer>
    </>
  );
};
