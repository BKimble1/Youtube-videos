// The café interior shots: cameras into the one interior world (world/interior.tsx).
import React from 'react';
import {Shot, ShotId} from '../plan4';
import {InteriorWorld, solveInterior, CUP_W_X, CUP_Y, W_HIP, SEAT_Y, S, implantWorld, IMPLANT_R} from '../world/interior';
import {FLOOR} from '../env/Interior';
import {PROP} from '../env/Props';
import {RED} from '../art/Implant';
import {DeliveredTag, MsgChip, popScale} from '../ui4';
import {Cam} from '../../lib/camera';
import {clamp, easeIn, easeInOut, easeOut, lerp, rng} from '../../lib/math';

export const CAMS: Record<string, Cam> = {
  wide: {x: 540, y: 1010, z: 1.06},
  two: {x: 525, y: 985, z: 1.45},
  cuM: {x: 770, y: 866, z: 2.5},
  cuW: {x: 300, y: 886, z: 2.5},
  hands: {x: 650, y: 1112, z: 3.3},
};

const mixCam = (a: Cam, b: Cam, k: number): Cam => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});

/** the camera of each café shot (shared with the layout check) */
export const interiorCam = (id: ShotId, t: number, shot: {a: number; b: number}): Cam => {
  const lt = t - shot.a;
  const dur = shot.b - shot.a;
  const k = easeInOut(clamp(lt / dur));
  switch (id) {
    case 'intWide':
      return mixCam(CAMS.wide, {...CAMS.wide, z: 1.12}, k);
    case 'intTwo':
      return mixCam(CAMS.two, {...CAMS.two, z: 1.55}, k);
    case 'sendFalter':
    case 'sendReject':
    case 'realize':
      return mixCam(CAMS.cuM, {...CAMS.cuM, z: 2.62}, k);
    case 'sendRegister': {
      // his face as it lands (0.4 s), then the camera falls into the implant so that its disc lands at the opening
      // macro's position and size (centre 540,790, radius 346): the match cut into frame 0
      const base = mixCam(CAMS.cuM, {...CAMS.cuM, z: 2.62}, k);
      const p = clamp((t - 27.2) / (27.4 - 1 / 30 - 27.2));
      if (p <= 0) return base;
      const ip = implantWorld(solveInterior(t).m);
      const zEnd = 346 / IMPLANT_R;
      const e = p * p;
      const z = Math.exp(lerp(Math.log(base.z), Math.log(zEnd), e));
      const cx = lerp(base.x, ip.x, easeInOut(p));
      const cy = lerp(base.y, ip.y + (960 - 790) / zEnd, easeInOut(p));
      return {x: cx, y: lerp(cy, ip.y + (960 - 790) / z, e), z};
    }
    case 'recvRecog':
      return mixCam({...CAMS.cuW, z: 2.5}, {...CAMS.cuW, z: 2.78}, k);
    case 'handCup':
      return mixCam(CAMS.hands, {...CAMS.hands, z: 3.55, x: 640}, k);
    case 'calmTwo':
      return mixCam({...CAMS.two, z: 1.45}, {...CAMS.two, z: 1.55}, k);
    default:
      return CAMS.wide;
  }
};

export const interiorShot = (id: ShotId, t: number, f: number, lt: number, shot: Shot): React.ReactNode => {
  if (id === 'subjective') return subjective(t, f, lt);
  if (id === 'signal') return signalShot(t, f, lt);
  const cam = interiorCam(id, t, shot);
  const solved = solveInterior(t);
  // the message that reaches her: a small bubble beside her head, popping and fading in place (never travelling)
  const bubK = popScale(t, 10.5, 0.2);
  const bubA = 1 - clamp((t - 11.35) / 0.25);
  const extra = (
    <g>
      <MsgChip x={solved.w.head.x + 58} y={solved.w.head.y - 96 * S * 1.05} s={id === 'intWide' ? 0.95 : 0.8} text="Nice place!" k={bubK} alpha={bubA} tailDir={-1} />
    </g>
  );
  const hr = 96 * S;
  const tagK = popScale(t, 25.76, 0.16);
  const fadeTag = 1 - clamp((t - 26.38) / 0.14);
  // screen position of her head in the recognition close-up, for the small confirmation beside it
  const tagX = 540 + (solved.w.head.x - cam.x) * cam.z + hr * cam.z * 1.12;
  const tagY = 960 + (solved.w.head.y - cam.y) * cam.z - hr * cam.z * 1.15;
  return (
    <g>
      <InteriorWorld t={t} f={f} cam={cam} solved={solved} opts={{extra}} />
      {id === 'recvRecog' && <DeliveredTag x={Math.min(tagX + 60, 790)} y={tagY} k={tagK} alpha={fadeTag} />}
      {id === 'withdraw' && <DeliveredTag x={430} y={650} k={1} sc={0.62} alpha={fadeTag} />}
    </g>
  );
};

/** the one subjective image: her chair tipping and her cup breaking, red, a blink long (15 frames) */
export const subjectiveW = (lt: number) => {
  const tip = easeIn(clamp(lt / 0.4));
  return {chairTilt: 30 * tip, torso: lerp(4, -16, tip), chest: -6 * tip, neck: -4 * tip, yaw: 12, hold: 0, ng: 0.2, nhx: W_HIP + 118, nhy: SEAT_Y - 215, fhx: W_HIP + 80, fhy: SEAT_Y - 180, chairDx: -26 * tip};
};
const subjective = (t: number, f: number, lt: number): React.ReactNode => {
  const dur = 0.5;
  const u = clamp(lt / dur);
  const w = subjectiveW(lt);
  const fall = clamp((lt - 0.05) / 0.3);
  const burst = clamp((lt - 0.35) / 0.15);
  const floorY = FLOOR - 26;
  const cx0 = CUP_W_X;
  const cupX = lerp(cx0, cx0 - 70, easeOut(fall));
  const cupY = lerp(CUP_Y, floorY, fall * fall) - Math.sin(Math.PI * Math.min(1, fall * 1.15)) * 30;
  const cupTilt = -540 * fall;
  const R = rng(5);
  const shards = Array.from({length: 9}, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + R() * 0.5;
    const sp = 60 + R() * 120;
    return {a, sp, w: 10 + R() * 18, c: i % 3 === 0 ? '#EF6B55' : '#FFFFFF'};
  });
  const impact = {x: cupX, y: floorY};
  const extra = (
    <g>
      {burst <= 0 && (
        <g transform={`rotate(${cupTilt} ${cupX} ${cupY})`}>
          <path d={`M${cupX - 42},${cupY - 54} L${cupX + 42},${cupY - 54} Q${cupX + 39},${cupY} ${cupX + 21},${cupY} L${cupX - 21},${cupY} Q${cupX - 39},${cupY} ${cupX - 42},${cupY - 54} Z`} fill="#FFFFFF" stroke="#172B3A" strokeWidth={4} />
          <ellipse cx={cupX} cy={cupY - 54} rx={42} ry={10} fill="#3E2412" />
          <path d={`M${cupX + 42},${cupY - 40} q30,2 26,26 q-4,14 -30,10`} fill="none" stroke="#172B3A" strokeWidth={9} strokeLinecap="round" />
          <path d={`M${cupX + 42},${cupY - 40} q30,2 26,26 q-4,14 -30,10`} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
        </g>
      )}
      {fall > 0.1 && burst <= 0 && Array.from({length: 9}, (_, i) => (
        <circle key={i} cx={cupX + (i - 4) * 16 + 50 * fall} cy={cupY - 50 - Math.abs(i - 4) * 10 - 40 * fall * fall} r={6} fill="#7A4A2A" opacity={0.95} />
      ))}
      {burst > 0 && shards.map((sh, i) => {
        const d = sh.sp * easeOut(burst);
        const x = impact.x + Math.cos(sh.a) * d;
        const y = impact.y - 40 + Math.sin(sh.a) * d * 0.7 + 30 * burst * burst;
        return <path key={i} d={`M0,${-sh.w} L${sh.w * 0.8},${sh.w * 0.5} L${-sh.w * 0.6},${sh.w * 0.6} Z`} transform={`translate(${x} ${y}) rotate(${sh.a * 100 + burst * 200})`} fill={sh.c} stroke="#172B3A" strokeWidth={2.5} opacity={1 - burst * 0.5} />;
      })}
      {burst > 0 && <circle cx={impact.x} cy={impact.y - 20} r={20 + 90 * burst} fill="none" stroke="#FFFFFF" strokeWidth={6 * (1 - burst) + 1} opacity={0.8 * (1 - burst)} />}
    </g>
  );
  const cam: Cam = {x: 470, y: 1060, z: lerp(1.18, 1.34, u), roll: -6 + 1.2 * Math.sin(f * 1.3)};
  // eyelids: opening in the first 3 frames, closing in the last 3
  const lid = Math.max(1 - clamp(lt / 0.1), clamp((lt - (dur - 0.1)) / 0.1));
  return (
    <g>
      <defs>
        <filter id="subj-f" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.62 0.62 0.22 0 0.06  0.2 0.2 0.07 0 0  0.18 0.18 0.06 0 0.01  0 0 0 1 0" />
        </filter>
        <radialGradient id="subj-v" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.35" stopColor="#14030A" stopOpacity={0} />
          <stop offset="1" stopColor="#14030A" stopOpacity={0.85} />
        </radialGradient>
      </defs>
      <g filter="url(#subj-f)">
        <InteriorWorld t={t} f={f} cam={cam} opts={{w, hideCupW: true, steam: 0, extra}} />
      </g>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#subj-v)" />
      <rect x={0} y={0} width={1080} height={1920} fill={RED} opacity={0.14} />
      <rect x={0} y={0} width={1080} height={960 * lid} fill="#0A0206" />
      <rect x={0} y={1920 - 960 * lid} width={1080} height={960 * lid} fill="#0A0206" />
    </g>
  );
};

/** the brief signal: his implant pulses (8 frames), the cut lands on her lenses (4 frames) */
const signalShot = (t: number, f: number, lt: number): React.ReactNode => {
  const solved = solveInterior(t);
  if (lt < 0.27) {
    const head = solved.m.head;
    const R = 96 * S;
    const yaw = (solved.m.pose.yaw ?? 20) * Math.PI / 180;
    const roll = -((solved.m.pose.torso ?? 0) + (solved.m.pose.chest ?? 0) + (solved.m.pose.neck ?? 0)) * Math.PI / 180;
    const lx = -98 * Math.sin(yaw) * R / 100;
    const ly = -84 * R / 100;
    const ip = {x: head.x + lx * Math.cos(roll) - ly * Math.sin(roll), y: head.y + lx * Math.sin(roll) + ly * Math.cos(roll)};
    const k = lt / 0.27;
    const cam: Cam = {x: ip.x, y: ip.y + 30, z: lerp(3.2, 3.5, k)};
    return (
      <g>
        <InteriorWorld t={t} f={f} cam={cam} solved={solved} opts={{glow: 1, glowColor: '#FF6B7A', steam: 0.5}} />
        {[0, 0.45].map((d, i) => {
          const kk = clamp(k * 1.3 - d);
          if (kk <= 0 || kk >= 1) return null;
          return <circle key={i} cx={540} cy={960 + 30 * 0 - 0} r={60 + 760 * kk} fill="none" stroke="#FF6B7A" strokeWidth={14 * (1 - kk) + 2} opacity={0.9 * (1 - kk)} />;
        })}
        <rect x={0} y={0} width={1080} height={1920} fill="#FF3340" opacity={0.18 * (1 - k)} />
      </g>
    );
  }
  const head = solved.w.head;
  const cam: Cam = {x: head.x + 40, y: head.y + 70, z: 2.5};
  return (
    <g>
      <InteriorWorld t={t} f={f} cam={cam} solved={solved} />
      <rect x={0} y={0} width={1080} height={1920} fill="#FF3340" opacity={0.12 * (1 - clamp((lt - 0.27) / 0.1))} />
      {[{dx: -0.0, w: 1}, {dx: 98, w: 0.85}].map((q, i) => {
        const hr2 = 96 * S * cam.z;
        const cx = 540 + (head.x - cam.x) * cam.z + (-3 + q.dx * 0.5) * (96 * S / 100) * cam.z;
        const cy = 960 + (head.y - cam.y) * cam.z - 8 * (96 * S / 100) * cam.z;
        const k = clamp(1 - (lt - 0.27) / 0.09);
        return <ellipse key={i} cx={cx} cy={cy} rx={hr2 * 0.3 * q.w} ry={hr2 * 0.3} fill="#FF8A95" opacity={0.85 * k} />;
      })}
    </g>
  );
};
