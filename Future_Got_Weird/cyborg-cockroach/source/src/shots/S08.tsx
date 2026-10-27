// S08 (12.40-15.40 s) "letting the operator watch as the first moves into position." The observer's onboard camera:
// the eye sits at the lens of the camera module on the observer's posed body (rig/gear.ts PACK.cam), so the image carries
// its slow walk (a small gait bob and roll) and a gentle left turn as it follows, until it stops at 14.4 s. Ahead, seen
// from the left (tube in profile) and then from behind-left, the medic (loaded, latched launch tube) walks from the right
// toward the silicone target, curves right into line with it and settles into its firing stance at body x = 58, z = 0,
// heading -x (as in S01), all six feet down by 14.95 s. The image has a camera-feed finish (cooler grade, soft vignette,
// a hint of sensor softness; no overlays). The feed is a wide image (the monitor's 420:250 picture) of which the full
// frame shows the central 1080 px.
// From 14.6 s it eases back (one zoom-out about a fixed point, 438-460) and becomes the live picture on the operator's
// lab-room monitor (as in S03) on the bench; the lower-right foreground is left free for the operator's hand on the remote
// (S08_HAND_SLOT / s08HandSlotAt).
import React from 'react';
import {Cam, lookAt, depth, proj, scaleAt} from '../lib/cam';
import {V3, V2, add, sub, mul, toW, dirW, norm, dot, cross} from '../lib/v3';
import {clamp, sr, smoother} from '../lib/ease';
import {poseRoach, RoachPose} from '../rig/roach';
import {Roach} from '../rig/Roach';
import {Gear} from '../rig/Gear';
import {ArenaFloor, TargetFixture, LAB, Solid} from '../sets/Lab';
import {ROOM} from '../sets/LabRoom';
import {FixtureShadow, S01_BODY_X} from './S01';
import {headingPath, remaining, obsPose, LENS} from './S07';
import {fmt, polyPath, openPath} from '../lib/g3';
import {INK} from '../lib/ink';
import {lit, shade, mix} from '../lib/color';
import {ShotProps} from './index';
import {RemoteCloseUp} from '../crew/operator';
import {noise1} from '../lib/ease';
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
// The feed: a wide image (FW x 1920, the room monitor's 420:250 picture) from the observer's lens; the full frame shows
// its central 1080 px.
// ---------------------------------------------------------------------------------------------------------------
export const FW = (1920 * ROOM.monitor.w) / ROOM.monitor.h; // the room monitor's picture shape (3225.6 px for 420 x 250)
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
        <radialGradient id={`${id}-vig`} gradientUnits="userSpaceOnUse" cx={FW / 2} cy={960} r={1900} gradientTransform={`translate(${FW / 2} 960) scale(1 0.66) translate(${-FW / 2} -960)`}>
          <stop offset="0.38" stopColor="#0B1620" stopOpacity={0} />
          <stop offset="0.75" stopColor="#0B1620" stopOpacity={0.18} />
          <stop offset="1" stopColor="#0B1620" stopOpacity={0.42} />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <g filter={`url(#${id}-cam)`}>
          <WideBackdrop id={`${id}b`} cam={cam} W={FW} blur={14} />
          <ArenaFloor id={`${id}f`} cam={cam} x0={-480} x1={480} z0={-640} z1={440} fade={700} />
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
// It is the monitor of the lab room in S03 (sets/LabRoom.tsx ROOM.monitor: a 420 x 250 mm picture, 14 mm bezel, dark
// stand and foot, on the white bench), seen square-on, so the feed maps onto its picture by scale and offset only.
// ---------------------------------------------------------------------------------------------------------------
const MON = ROOM.monitor;
export const SCREEN = {cx: 540, cy: 740, w: 960, h: (960 * MON.h) / MON.w}; // the picture area at the end (px)
const K0 = 1920 / SCREEN.h; // zoom at which the picture fills the frame height
const FIX: V2 = [(540 - K0 * SCREEN.cx) / (1 - K0), (960 - K0 * SCREEN.cy) / (1 - K0)]; // the zoom's fixed point
export const PULL0 = 14.6, PULL1 = 15.32;
export const pullK = (t: number) => Math.pow(K0, 1 - smoother(clamp((t - PULL0) / (PULL1 - PULL0))));
/** where the hand + remote should sit at the end (centre, px), its scale (1 = a hand about 450 px wide, as drawn for the
 *  final frame) and the first frame at which any of it can be in view during the zoom-out. The zoom-out is a pure
 *  scale about a fixed point, so a hand composited before the end follows s08HandSlotAt(f) (position and scale). */
export const S08_HAND_SLOT = {x: 695, y: 1440, scale: 1, fromFrame: 0};
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

// desk world: a camera square to the screen (mm, picture centre at the origin, screen plane z = 0, +z toward the camera)
const DESK_EYE: V3 = [0, 0, 620];
const DESK_F = (SCREEN.w * DESK_EYE[2]) / MON.w;
const deskCam = lookAt(DESK_EYE, [0, 0, 0], DESK_F, SCREEN.cx, SCREEN.cy);
const BENCH_Y = -(MON.h / 2 + MON.lift); // bench top below the picture centre (mm)
const BZ = 14; // bezel (as LabRoom's Monitor)

const Monitor: React.FC<{id: string}> = ({id}) => {
  const c = deskCam;
  const P = (p: V3) => proj(c, p);
  const quad = (pts: V3[]) => polyPath(pts.map(P));
  const hw = MON.w / 2, hh = MON.h / 2;
  const b0 = P([-hw - BZ, hh + BZ, 0]), b1 = P([hw + BZ, -hh - BZ, 0]);
  const scr0 = P([-hw, hh, 0]), scr1 = P([hw, -hh, 0]);
  const rad = 4 * scaleAt(c, [0, 0, 0]);
  // stand (32 mm wide, behind the picture) and the foot (140 x 80 mm) on the bench, as in LabRoom
  const nz = -18;
  const neck: V3[] = [[-16, -hh + 20, nz], [16, -hh + 20, nz], [16, BENCH_Y + 4, nz], [-16, BENCH_Y + 4, nz]];
  const ft = (y: number): V3[] => [[-70, y, nz + 40], [70, y, nz + 40], [70, y, nz - 40], [-70, y, nz - 40]];
  const footTop = ft(BENCH_Y + 4), footFront: V3[] = [[-70, BENCH_Y + 4, nz + 40], [70, BENCH_Y + 4, nz + 40], [70, BENCH_Y, nz + 40], [-70, BENCH_Y, nz + 40]];
  const fsc = P([0, BENCH_Y, nz]);
  const ink = 2.6;
  const col = ROOM.monitorCol;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-bz`} gradientUnits="userSpaceOnUse" x1={fmt(b0[0])} y1={fmt(b0[1])} x2={fmt(b1[0])} y2={fmt(b1[1])}>
          <stop offset="0" stopColor={lit(col, 0.22)} />
          <stop offset="0.4" stopColor={col} />
          <stop offset="1" stopColor={shade(col, 0.3)} />
        </linearGradient>
        <linearGradient id={`${id}-nk`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={lit(col, 0.2)} />
          <stop offset="0.5" stopColor={lit(col, 0.08)} />
          <stop offset="1" stopColor={shade(col, 0.25)} />
        </linearGradient>
        <radialGradient id={`${id}-fsh`}>
          <stop offset="0" stopColor="#1C2A33" stopOpacity={0.32} />
          <stop offset="0.6" stopColor="#1C2A33" stopOpacity={0.15} />
          <stop offset="1" stopColor="#1C2A33" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* foot shadow, foot, neck */}
      <ellipse cx={fmt(fsc[0])} cy={fmt(fsc[1] + 4)} rx={fmt(95 * scaleAt(c, [0, BENCH_Y, nz]))} ry={fmt(30 * scaleAt(c, [0, BENCH_Y, nz]))} fill={`url(#${id}-fsh)`} />
      <path d={quad(footFront)} fill={shade(col, 0.2)} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      <path d={quad(footTop)} fill={lit(col, 0.12)} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      <path d={quad(neck)} fill={`url(#${id}-nk)`} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      {/* bezel, its soft top-left edge light, and the dark screen surround */}
      <rect x={fmt(b0[0])} y={fmt(b0[1])} width={fmt(b1[0] - b0[0])} height={fmt(b1[1] - b0[1])} rx={fmt(rad)} fill={`url(#${id}-bz)`} stroke={INK} strokeWidth={ink * 1.2} />
      <rect x={fmt(b0[0] + 4)} y={fmt(b0[1] + 4)} width={fmt(b1[0] - b0[0] - 8)} height={fmt(b1[1] - b0[1] - 8)} rx={fmt(rad * 0.7)} fill="none" stroke="#FFFFFF" strokeOpacity={0.1} strokeWidth={2} />
      <rect x={fmt(scr0[0] - 5)} y={fmt(scr0[1] - 5)} width={fmt(scr1[0] - scr0[0] + 10)} height={fmt(scr1[1] - scr0[1] + 10)} fill="#1B2A36" />
    </g>
  );
};

/** the bench top (LabRoom's white bench) and its far edge against the wall, in final-frame pixels */
const Bench: React.FC<{id: string}> = ({id}) => {
  const c = deskCam;
  const back = proj(c, [0, BENCH_Y, -380]);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-top`} x1="0" y1={fmt(back[1])} x2="0" y2="1920" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={shade(ROOM.benchCol, 0.1)} />
          <stop offset="0.3" stopColor={ROOM.benchCol} />
          <stop offset="1" stopColor={lit(ROOM.benchCol, 0.3)} />
        </linearGradient>
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24333F" stopOpacity={0.18} />
          <stop offset="1" stopColor="#24333F" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={-20} y={fmt(back[1])} width={1120} height={fmt(1960 - back[1])} fill={`url(#${id}-top)`} />
      <rect x={-20} y={fmt(back[1])} width={1120} height={36} fill={`url(#${id}-sh)`} />
      <path d={`M-20 ${fmt(back[1])} L1100 ${fmt(back[1])}`} stroke={INK} strokeWidth={2} opacity={0.45} />
    </g>
  );
};

/** the camera's Wi-Fi receiver on the bench, left of the monitor, with its cable running back to the monitor's stand */
const Receiver: React.FC<{id: string}> = ({id}) => {
  const c = deskCam;
  const B = BENCH_Y;
  const box = {c: [-175, B + 10, -60] as V3, h: [30, 10, 20] as V3};
  const cable: V3[] = [[-175, B + 6, -81], [-158, B + 1.5, -104], [-108, B + 1.5, -110], [-56, B + 1.5, -92], [-26, B + 1.5, -62], [-10, B + 18, -30], [-6, B + 60, -22]];
  const cp = cable.map((q) => proj(c, q));
  const ant0 = proj(c, [-155, B + 20, -72]), ant1 = proj(c, [-140, B + 88, -84]);
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
  // the lab behind the monitor (the room's monitor faces +z turned 0.35 rad, so we look along -z turned the other way)
  const cam = lookAt([0, 0, 0], [Math.sin(0.35), -0.02, -Math.cos(0.35)], 1000);
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
      {/* the operator's hand on the remote in the foreground, thumb resting over the button (armed): it joins the zoom-out
          from the slot, so it is part of the bench picture S08 lands on */}
      {f >= S08_HAND_SLOT.fromFrame && (() => {
        const h = s08HandSlotAt(f);
        const sw = 6 * noise1(t * 0.6 + 4.2);
        return <RemoteCloseUp id={`${id}rc`} press={0} lift={0.3 + 0.05 * noise1(t * 0.9)} led="armed" x={h.x + sw * h.scale} y={h.y} scale={0.69 * h.scale} rotation={-14 + 1.2 * noise1(t * 0.5 + 1.3)} />;
      })()}
    </svg>
  );
};
