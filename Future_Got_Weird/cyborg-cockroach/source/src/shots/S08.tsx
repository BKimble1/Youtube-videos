// S08 (12.40-15.40 s) "letting the operator watch as the first moves into position." The observer's onboard camera:
// the eye sits at the lens of the camera module on the observer's posed body (rig/gear.ts PACK.cam), so the image carries
// its slow walk (a small gait bob and roll) until it stops at ~14.45 s. Ahead, seen from behind and to the left, the medic
// (loaded launch tube) walks on a gentle curve into line with the silicone target and settles into its firing stance at
// body x = 58, heading -x (as in S01). The image has a camera-feed finish (cooler grade, soft vignette, a hint of sensor
// softness). From 14.6 s the feed eases back (one zoom-out about a fixed point) and becomes the live image on the
// operator's monitor on the lab bench; the lower-right foreground is left free for the operator's hand on the remote.
import React from 'react';
import {Cam, lookAt, depth, proj, scaleAt} from '../lib/cam';
import {V3, V2, add, sub, mul, toW, dirW, norm, dot, cross} from '../lib/v3';
import {clamp, lerp, sr, smoother, noise1} from '../lib/ease';
import {poseRoach, RoachPose} from '../rig/roach';
import {Roach, CHITIN} from '../rig/Roach';
import {Gear} from '../rig/Gear';
import {ArenaFloor, TargetFixture, LAB, Solid} from '../sets/Lab';
import {FixtureShadow, S01_BODY_X} from './S01';
import {headingPath, remaining, obsPose, LENS} from './S07';
import {fmt, polyPath, openPath} from '../lib/g3';
import {INK} from '../lib/ink';
import {lit, shade, mix} from '../lib/color';
import {ShotProps} from './index';
import {FPS} from '../timeline';

const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------------------------------------------
// The medic: a gentle left turn into line with the target, then the planted stop at body x = 58, heading -x.
// ---------------------------------------------------------------------------------------------------------------
export const MEDIC = {v: 40, tA: 13.95, tB: 14.95, phiIn: -15 * DEG};
const medicPhi = (d: number) => MEDIC.phiIn * sr(d, 12, 52);
export const MEDIC_PATH = headingPath([S01_BODY_X, 0], medicPhi, remaining(12.0, MEDIC.v, MEDIC.tA, MEDIC.tB) + 70);
export const medicS = (t: number) => MEDIC_PATH.sStop - remaining(t, MEDIC.v, MEDIC.tA, MEDIC.tB);
export const medicPose = (t: number): RoachPose => {
  const s = medicS(t);
  const br = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 0.9);
  const settle = 0.8 * sr(t, MEDIC.tB - 0.1, MEDIC.tB + 0.45);
  return poseRoach({
    path: MEDIC_PATH.path, s, t, seed: 3, search: 0.85,
    offset: [0, -settle, 0],
    pitch: -0.006 * (br - 0.5),
    antL: {yaw: 0.58}, antR: {yaw: 0.64},
    breathe: br,
  });
};
export const MEDIC_GEAR = {kind: 'injector' as const, loaded: true, latched: true};

// ---------------------------------------------------------------------------------------------------------------
// The feed: a 5:4 image (FW x 1920) from the observer's lens. The full frame shows its central 1080 px.
// ---------------------------------------------------------------------------------------------------------------
export const FW = 2400;
export const POV_F = 1100; // wide lens (S01 is 2250)
const POV_CY = 900;
const POV_PITCH = -4 * DEG;
export const povCam = (t: number, pose: (t: number) => RoachPose = obsPose): Cam => {
  const fr = pose(t).frame;
  const eye = toW(fr, [LENS[0] + 0.4, LENS[1], 0]);
  const fwd = dirW(fr, [Math.cos(POV_PITCH), Math.sin(POV_PITCH), 0]);
  return lookAt(eye, add(eye, mul(fwd, 100)), POV_F, FW / 2, POV_CY, 0, fr.y);
};

/** The lab behind the arena for a wide image: LabBackdrop (sets/Lab.tsx) adapted to a canvas of width W, rolled with the
 *  camera. Same palette, bays and parallax constants, so it matches the backdrop of the other lab shots. */
const WideBackdrop: React.FC<{id: string; cam: Cam; W: number; blur?: number}> = ({id, cam, W, blur = 16}) => {
  const az = Math.atan2(cam.fwd[0], cam.fwd[2]);
  const el = Math.asin(Math.max(-1, Math.min(1, cam.fwd[1])));
  const ox = -az * 520 + (W - 1080) / 2, oy = el * 900;
  const items: React.ReactNode[] = [];
  const bay = 760;
  const base = Math.floor((-ox - 600) / bay) - 1;
  for (let k = base; k < base + Math.ceil(W / bay) + 3; k++) {
    const x = k * bay + ox;
    const s = (((k * 37) % 5) + 5) % 5;
    items.push(
      <g key={`b${k}`} transform={`translate(${fmt(x)} ${fmt(oy)})`}>
        <rect x={40} y={260} width={620} height={16} fill="#9FB0BA" />
        <rect x={40} y={560} width={620} height={16} fill="#9FB0BA" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={70 + i * 120 + (s * 13) % 30} y={180 - ((i + s) % 3) * 30} width={56} height={80 + ((i + s) % 3) * 30} rx={12} fill={['#E8F1F4', '#BFD8E2', '#F2E3C7', '#D3E3D0', '#E9D3D8'][(i + s) % 5]} />
        ))}
        {[0, 1, 2].map((i) => (
          <rect key={`c${i}`} x={90 + i * 190} y={470 - (i % 2) * 40} width={130} height={90 + (i % 2) * 40} rx={10} fill={['#C7D5DC', '#DCE6EA', '#B8C9D2'][i]} />
        ))}
        <rect x={420} y={620} width={220} height={150} rx={10} fill="#2E3E4B" />
        <rect x={432} y={632} width={196} height={118} rx={6} fill="#4E86A8" opacity={0.85} />
      </g>,
    );
  }
  // horizon tilt of the camera (gait roll) in screen degrees
  const hr = norm(cross(cam.fwd, [0, 1, 0]));
  const roll = (Math.atan2(-dot(hr, cam.up), dot(hr, cam.right)) * 180) / Math.PI;
  const nL = Math.ceil(W / 330) + 2;
  return (
    <g transform={`rotate(${fmt(roll)} ${fmt(cam.cx)} ${fmt(cam.cy)})`}>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={LAB.wallTop} />
          <stop offset="1" stopColor={LAB.wallBot} />
        </linearGradient>
        <filter id={`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={blur} />
        </filter>
      </defs>
      <rect x={-200} y={-200} width={W + 400} height={2320} fill={`url(#${id}-wall)`} />
      <g filter={`url(#${id}-blur)`}>
        {items}
        {Array.from({length: nL}, (_, i) => (
          <circle key={`l${i}`} cx={fmt((((i * 330 + ox * 1.3) % (nL * 330)) + nL * 330) % (nL * 330) - 160)} cy={fmt(-40 + oy * 1.2)} r={70} fill="#FFFFFF" opacity={0.7} />
        ))}
      </g>
    </g>
  );
};

/** The live feed at time t, drawn in feed coordinates (0..FW x 0..1920), with the camera-feed finish. */
export const Feed: React.FC<{t: number; id: string}> = ({t, id}) => {
  const cam = povCam(t);
  const medic = medicPose(t);
  const items: {z: number; el: React.ReactNode}[] = [];
  items.push({z: depth(cam, [-8, 30, 0]), el: <TargetFixture key="tgt" id={`${id}t`} cam={cam} />});
  items.push({z: depth(cam, medic.frame.o), el: <Roach key="m" pose={medic} cam={cam} o={{id: `${id}m`, gear: <Gear id={`${id}mg`} cam={cam} f={medic.frame} g={MEDIC_GEAR} />}} />});
  items.sort((a, b) => b.z - a.z);
  return (
    <g>
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect x={0} y={0} width={FW} height={1920} />
        </clipPath>
        {/* cooler, slightly flatter colour; a hint of sensor softness */}
        <filter id={`${id}-cam`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.86 0.06 0.02 0 0.005  0.03 0.9 0.05 0 0.01  0.02 0.07 0.95 0 0.035  0 0 0 1 0" />
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
        <radialGradient id={`${id}-vig`} gradientUnits="userSpaceOnUse" cx={FW / 2} cy={960} r={1500} gradientTransform={`translate(${FW / 2} 960) scale(1 0.82) translate(${-FW / 2} -960)`}>
          <stop offset="0.38" stopColor="#0B1620" stopOpacity={0} />
          <stop offset="0.75" stopColor="#0B1620" stopOpacity={0.18} />
          <stop offset="1" stopColor="#0B1620" stopOpacity={0.42} />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <g filter={`url(#${id}-cam)`}>
          <WideBackdrop id={`${id}b`} cam={cam} W={FW} blur={14} />
          <ArenaFloor id={`${id}f`} cam={cam} x0={-420} x1={420} z0={-560} z1={380} fade={700} />
          <FixtureShadow cam={cam} />
          {items.map((it) => it.el)}
        </g>
        <rect x={0} y={0} width={FW} height={1920} fill={`url(#${id}-vig)`} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The operator's monitor on the bench (final-frame pixels), and the zoom-out that turns the feed into its picture.
// ---------------------------------------------------------------------------------------------------------------
export const SCREEN = {cx: 540, cy: 820, w: 920, h: 736}; // the screen's picture area at the end (5:4, like the feed)
const K0 = 1920 / SCREEN.h; // zoom at which the screen picture fills the frame
const FIX: V2 = [(540 - K0 * SCREEN.cx) / (1 - K0), (960 - K0 * SCREEN.cy) / (1 - K0)]; // the zoom's fixed point
export const PULL0 = 14.6, PULL1 = 15.32;
export const pullK = (t: number) => Math.pow(K0, 1 - smoother(clamp((t - PULL0) / (PULL1 - PULL0))));
/** where the hand + remote should sit at the end (centre, px), its scale (1 = a hand about 450 px wide) and the first
 *  frame at which any of it can be in view during the zoom-out; s08HandSlotAt(f) gives the per-frame position/scale */
export const S08_HAND_SLOT = {x: 820, y: 1600, scale: 1, fromFrame: 0};
export const s08HandSlotAt = (f: number) => {
  const k = pullK(f / FPS);
  return {x: FIX[0] + k * (S08_HAND_SLOT.x - FIX[0]), y: FIX[1] + k * (S08_HAND_SLOT.y - FIX[1]), scale: k * S08_HAND_SLOT.scale};
};
// first frame at which a 500 x 420 px hand at the slot reaches into the frame
S08_HAND_SLOT.fromFrame = (() => {
  for (let f = 372; f < 462; f++) {
    const h = s08HandSlotAt(f);
    if (h.y - 210 * h.scale < 1920 && h.x - 250 * h.scale < 1080) return f;
  }
  return 462;
})();

// desk world: a camera square to the screen (mm, screen centre at the origin, screen plane z = 0)
const DESK_EYE: V3 = [0, 0, 600];
const DESK_F = (SCREEN.w * DESK_EYE[2]) / 376; // a 376 x 301 mm picture area (19 inch, 5:4)
const deskCam = lookAt(DESK_EYE, [0, 0, 0], DESK_F, SCREEN.cx, SCREEN.cy);
const BENCH_Y = -292; // bench top below the screen centre (mm)

const Monitor: React.FC<{id: string}> = ({id}) => {
  const c = deskCam;
  const P = (p: V3) => proj(c, p);
  const rect = (x0: number, y0: number, x1: number, y1: number, z: number) => [P([x0, y0, z]), P([x1, y0, z]), P([x1, y1, z]), P([x0, y1, z])];
  // bezel outline (rounded): picture 376 x 301, 15 mm sides/top, 28 mm chin
  const bz = {x0: -203, x1: 203, y0: -178.5, y1: 165.5};
  const b0 = P([bz.x0, bz.y1, 0]), b1 = P([bz.x1, bz.y0, 0]);
  const scr0 = P([-188, 150.5, 0]), scr1 = P([188, -150.5, 0]);
  const rad = 9 * scaleAt(c, [0, 0, 0]);
  // stand: neck behind the chin, foot on the bench
  const nz = -60;
  const neck = rect(-24, -150, 24, BENCH_Y + 5, nz);
  const footC: V3 = [0, BENCH_Y, -40];
  const fc = P(footC), fl = P([-85, BENCH_Y, -40]), ff = P([0, BENCH_Y, 25]), fb = P([0, BENCH_Y, -105]);
  const frx = fc[0] - fl[0], fry = (ff[1] - fb[1]) / 2, fcy = (ff[1] + fb[1]) / 2;
  const thick = 7 * scaleAt(c, [0, BENCH_Y, 25]);
  const ink = 2.6;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-bz`} gradientUnits="userSpaceOnUse" x1={fmt(b0[0])} y1={fmt(b0[1])} x2={fmt(b1[0])} y2={fmt(b1[1])}>
          <stop offset="0" stopColor={lit('#2E3E4B', 0.28)} />
          <stop offset="0.35" stopColor="#34465A" />
          <stop offset="1" stopColor={shade('#2E3E4B', 0.35)} />
        </linearGradient>
        <linearGradient id={`${id}-nk`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={lit(LAB.alu, 0.2)} />
          <stop offset="0.5" stopColor={LAB.alu} />
          <stop offset="1" stopColor={shade(LAB.alu, 0.3)} />
        </linearGradient>
        <linearGradient id={`${id}-ft`} gradientUnits="userSpaceOnUse" x1={fmt(fl[0])} y1={fmt(fb[1])} x2={fmt(fc[0] + frx)} y2={fmt(ff[1])}>
          <stop offset="0" stopColor={lit(LAB.alu, 0.3)} />
          <stop offset="1" stopColor={shade(LAB.alu, 0.2)} />
        </linearGradient>
        <radialGradient id={`${id}-fsh`}>
          <stop offset="0" stopColor="#1C2A33" stopOpacity={0.35} />
          <stop offset="0.6" stopColor="#1C2A33" stopOpacity={0.18} />
          <stop offset="1" stopColor="#1C2A33" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* foot shadow, foot, neck */}
      <ellipse cx={fmt(fc[0])} cy={fmt(fcy + thick * 0.6)} rx={fmt(frx * 1.25)} ry={fmt(fry * 1.5)} fill={`url(#${id}-fsh)`} />
      <path d={`M${fmt(fc[0] - frx)} ${fmt(fcy)} L${fmt(fc[0] - frx)} ${fmt(fcy + thick)} A${fmt(frx)} ${fmt(fry)} 0 0 0 ${fmt(fc[0] + frx)} ${fmt(fcy + thick)} L${fmt(fc[0] + frx)} ${fmt(fcy)} Z`} fill={shade(LAB.alu, 0.32)} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      <ellipse cx={fmt(fc[0])} cy={fmt(fcy)} rx={fmt(frx)} ry={fmt(fry)} fill={`url(#${id}-ft)`} stroke={INK} strokeWidth={ink} />
      <path d={polyPath(neck)} fill={`url(#${id}-nk)`} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      {/* bezel and the dark screen surround */}
      <rect x={fmt(b0[0])} y={fmt(b0[1])} width={fmt(b1[0] - b0[0])} height={fmt(b1[1] - b0[1])} rx={fmt(rad)} fill={`url(#${id}-bz)`} stroke={INK} strokeWidth={ink * 1.2} />
      <rect x={fmt(b0[0] + 5)} y={fmt(b0[1] + 4)} width={fmt(b1[0] - b0[0] - 10)} height={fmt(b1[1] - b0[1] - 9)} rx={fmt(rad * 0.8)} fill="none" stroke="#FFFFFF" strokeOpacity={0.12} strokeWidth={2} />
      <rect x={fmt(scr0[0] - 4)} y={fmt(scr0[1] - 4)} width={fmt(scr1[0] - scr0[0] + 8)} height={fmt(scr1[1] - scr0[1] + 8)} fill="#0D161E" />
      {/* power light on the chin: a small dim pill, not a glowing UI element */}
      {(() => {
        const q = P([176, -165, 0]);
        return <rect x={fmt(q[0] - 7)} y={fmt(q[1] - 2.5)} width={14} height={5} rx={2.5} fill="#7FA9C2" opacity={0.7} />;
      })()}
    </g>
  );
};

/** bench top and the wall behind it, in final-frame pixels */
const Bench: React.FC<{id: string}> = ({id}) => {
  const c = deskCam;
  const back = proj(c, [0, BENCH_Y, -420]);
  const lip = proj(c, [0, BENCH_Y, 250]);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-top`} x1="0" y1={fmt(back[1])} x2="0" y2="1920" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={shade('#CBD5DA', 0.12)} />
          <stop offset="0.35" stopColor="#D2DBDF" />
          <stop offset="1" stopColor={lit('#C6D0D5', 0.12)} />
        </linearGradient>
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24333F" stopOpacity={0.22} />
          <stop offset="1" stopColor="#24333F" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={-20} y={fmt(back[1])} width={1120} height={fmt(1960 - back[1])} fill={`url(#${id}-top)`} />
      <rect x={-20} y={fmt(back[1])} width={1120} height={40} fill={`url(#${id}-sh)`} />
      <path d={`M-20 ${fmt(back[1])} L1100 ${fmt(back[1])}`} stroke={INK} strokeWidth={2} opacity={0.5} />
      {lip[1] < 1920 && <path d={`M-20 ${fmt(lip[1])} L1100 ${fmt(lip[1])}`} stroke={INK} strokeWidth={2} />}
    </g>
  );
};

/** the camera's Wi-Fi receiver on the bench, left of the monitor, with its cable running back to the monitor's stand */
const Receiver: React.FC<{id: string}> = ({id}) => {
  const c = deskCam;
  const B = BENCH_Y;
  const box = {c: [-185, B + 10, -125] as V3, h: [30, 10, 20] as V3};
  const cable: V3[] = [[-185, B + 6, -146], [-170, B + 1.5, -170], [-120, B + 1.5, -175], [-60, B + 1.5, -150], [-26, B + 1.5, -112], [-8, B + 20, -82], [-4, B + 70, -70]];
  const cp = cable.map((q) => proj(c, q));
  const ant0 = proj(c, [-165, B + 20, -138]), ant1 = proj(c, [-150, B + 88, -150]);
  const sc = scaleAt(c, box.c);
  const sh = proj(c, [box.c[0] + 4, B, box.c[2] + 2]);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-sh`}>
          <stop offset="0" stopColor="#1C2A33" stopOpacity={0.3} />
          <stop offset="1" stopColor="#1C2A33" stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={openPath(cp)} fill="none" stroke={INK} strokeWidth={4.6} strokeLinecap="round" />
      <path d={openPath(cp)} fill="none" stroke="#3A4650" strokeWidth={2.6} strokeLinecap="round" />
      <ellipse cx={fmt(sh[0])} cy={fmt(sh[1])} rx={fmt(40 * sc)} ry={fmt(12 * sc)} fill={`url(#${id}-sh)`} />
      <Solid cam={c} c={box.c} h={box.h} color="#5F7180" ink={2} />
      <path d={`M${fmt(ant0[0])} ${fmt(ant0[1])} L${fmt(ant1[0])} ${fmt(ant1[1])}`} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d={`M${fmt(ant0[0])} ${fmt(ant0[1])} L${fmt(ant1[0])} ${fmt(ant1[1])}`} stroke="#4A5966" strokeWidth={4.5} strokeLinecap="round" />
    </g>
  );
};

const DeskBackdrop: React.FC<{id: string}> = ({id}) => {
  // the far side of the lab behind the bench: soft and dim (a defocused background), panned to a different bay
  const cam = lookAt([0, 0, 0], [-0.35, -0.02, -1], 1000);
  return <WideBackdrop id={id} cam={cam} W={1080} blur={22} />;
};

/** screen glass: a faint sheen from the upper-left key light, only as the picture becomes a screen */
const Glass: React.FC<{id: string; a: number}> = ({id, a}) => {
  const x0 = SCREEN.cx - SCREEN.w / 2, y0 = SCREEN.cy - SCREEN.h / 2;
  return a <= 0.001 ? null : (
    <g opacity={a}>
      <defs>
        <linearGradient id={`${id}-gl`} gradientUnits="userSpaceOnUse" x1={x0} y1={y0} x2={x0 + SCREEN.w * 0.55} y2={y0 + SCREEN.h * 0.9}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.16} />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.05} />
          <stop offset="0.46" stopColor="#FFFFFF" stopOpacity={0.0} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={x0} y={y0} width={SCREEN.w} height={SCREEN.h} fill={`url(#${id}-gl)`} />
      <rect x={x0} y={y0} width={SCREEN.w} height={SCREEN.h} fill="none" stroke="#000000" strokeOpacity={0.35} strokeWidth={3} />
    </g>
  );
};

export const S08: React.FC<ShotProps & {k?: string}> = ({f, k = ''}) => {
  const t = f / FPS;
  const id = `s08${k}`;
  const kz = pullK(t);
  const sFeed = SCREEN.w / FW;
  const x0 = SCREEN.cx - SCREEN.w / 2, y0 = SCREEN.cy - SCREEN.h / 2;
  const glassA = clamp((K0 - kz) / (K0 - 1));
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <rect x={0} y={0} width={1080} height={1920} fill="#14202A" />
      <g transform={`translate(${fmt(FIX[0])} ${fmt(FIX[1])}) scale(${kz.toFixed(5)}) translate(${fmt(-FIX[0])} ${fmt(-FIX[1])})`}>
        {kz < K0 - 1e-4 && (
          <g>
            <DeskBackdrop id={`${id}db`} />
            <Bench id={`${id}bn`} />
            <Receiver id={`${id}rx`} />
            <Monitor id={`${id}mo`} />
          </g>
        )}
        <g transform={`translate(${fmt(x0)} ${fmt(y0)}) scale(${sFeed.toFixed(6)})`}>
          <Feed t={t} id={`${id}fd`} />
        </g>
        <Glass id={`${id}gs`} a={glassA} />
      </g>
    </svg>
  );
};
